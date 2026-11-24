// MIT License - see LICENSE file in the project root for details.
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Barry contributors
/* Adapter for wasm-bindgen-rayon 1.3.0's no-bundler startWorkers ABI.
 * Upstream workerHelpers.no-bundler.js: Copyright 2022 Google Inc., Apache-2.0.
 * The package driver authenticates the upstream shim before resolving this file.
 */
/**
 * Barry pool policy around the Apache-derived no-bundler ABI. All direct
 * owners in a dedicated realm share one immutable group; no per-image pool or
 * extra shared pixel copy is created. The parent must service fatal ports while
 * synchronous Rayon work blocks this realm. Startup failure tears down every
 * started helper; readiness precedes builder.build() to avoid barrier deadlocks.
 */
import {errorRecord, remoteError} from './barry-error.mjs';

export const workerProtocolVersion = 12;
const optionsContractVersion = 6;
const supportedSymbologies = 0x7ee70;

let configuration = null;
const helpers = new Set();
let fatalPort = null;
let fatalHandler = null;
let state = 'empty';
const startupRejects = new Set();
let resourceFetchMs = 0;

/** Sum of observed helper resource fetch durations in milliseconds; may overlap. */
export function threadPoolResourceFetchMs() { return resourceFetchMs; }
/** Current ready/starting helper count in this pool, excluding the calling worker. */
export function threadPoolHelperCount() { return helpers.size; }

/**
 * Configure the one group before generated glue starts helpers; does no scan.
 * @param {object} options CommonTimeOrigin is monotonic-domain milliseconds;
 * participants is caller-inclusive positive capacity. fatalPort is a transferred
 * parent-serviced MessagePort; optional onFatal notifies this owner as well.
 * Repeated identical capacity/origin is allowed; closed/failed groups cannot reopen.
 */
export function configureThreadPool({commonTimeOrigin, fatalPort: port, onFatal, participants} = {}) {
  if (!Number.isFinite(commonTimeOrigin) || commonTimeOrigin < 0) throw new Error('invalid browser clock origin');
  if (!Number.isSafeInteger(participants) || participants < 1) throw new Error('invalid participant capacity');
  if (configuration && (configuration.commonTimeOrigin !== commonTimeOrigin || configuration.participants !== participants)) {
    throw new Error('browser execution already initialized with different options');
  }
  if (state === 'closed' || state === 'failed') throw new Error('threaded execution is closed');
  configuration = {commonTimeOrigin, participants};
  if (port !== undefined) fatalPort = port;
  if (onFatal !== undefined) fatalHandler = onFatal;
}

/** Terminate the entire pool group, including helpers that never acknowledged. */
function terminateHelpers() {
  for (const helper of helpers) helper.terminate();
  helpers.clear();
}
/** Settle all pending readiness waiters when containment prevents progress. */
function rejectStartup(error) {
  for (const reject of startupRejects) reject(error);
  startupRejects.clear();
}
/** One fatal group transition: terminate, reject startup, notify independent parent. */
function fail(error) {
  if (state === 'failed' || state === 'closed') return;
  state = 'failed';
  terminateHelpers();
  rejectStartup(error);
  try { fatalPort?.postMessage({type: 'barry-helper-fatal', error: errorRecord(error)}); } catch {}
  fatalHandler?.(error);
}

/**
 * wasm-bindgen-rayon startWorkers ABI: initialize exactly participants-1 helpers.
 * @param {WebAssembly.Module} module Already compiled shared-memory artifact.
 * @param {WebAssembly.Memory} memory Shared memory retained by generated TLS glue.
 * @param {object} builder Upstream pool builder; receiver/mainJS are passed through.
 * @returns {Promise<void>} Resolves only after every real readiness and pool build.
 * @throws Any startup/fatal error rejects and terminates the full started group.
 */
export async function startWorkers(module, memory, builder) {
  if (state !== 'empty') throw new Error('threaded execution is already initialized');
  if (!configuration) throw new Error('browser clock is not initialized');
  const count = builder.numThreads();
  if (count !== configuration.participants - 1) throw new Error('threaded helper allocation does not match initialized capacity');
  if (!(module instanceof WebAssembly.Module) || !(memory instanceof WebAssembly.Memory) ||
      !(memory.buffer instanceof SharedArrayBuffer)) throw new Error('threaded execution requires shared WebAssembly memory');
  if (!fatalPort) throw new Error('threaded execution requires a parent fatal MessagePort');
  state = 'starting';
  const ready = [];
  try {
    for (let index = 0; index < count; index++) {
      if (state !== 'starting') throw new Error('Barry helper failed during initialization');
      const helper = new Worker(new URL('./rayon-helper.mjs', import.meta.url), {
        type: 'module', name: `barry-rayon-helper-${index + 1}`
      });
      helpers.add(helper);
      ready.push(new Promise((resolve, reject) => {
        startupRejects.add(reject);
        let acknowledged = false;
        helper.addEventListener('error', event => {
          event.preventDefault();
          fail(event.error || new Error(event.message || 'Barry helper crashed'));
        });
        helper.addEventListener('messageerror', () => fail(new Error('Barry helper message could not be decoded')));
        helper.addEventListener('message', ({data}) => {
          if (data?.type === 'barry-helper-fatal') {
            fail(remoteError(data.error));
          } else if (data?.type === 'wasm_bindgen_worker_ready' && state === 'starting' && !acknowledged) {
            if (data.protocolVersion !== workerProtocolVersion || data.optionsContractVersion !== optionsContractVersion ||
                data.supportedSymbologies !== supportedSymbologies ||
                !Number.isFinite(data.resourceFetchMs) || data.resourceFetchMs < 0) {
              fail(new Error('incompatible Barry helper readiness; rebuild the complete browser package'));
              return;
            }
            acknowledged = true;
            resourceFetchMs += data.resourceFetchMs;
            startupRejects.delete(reject);
            resolve();
          }
        });
        // Every helper has a direct parent-serviced fatal path. The dedicated
        // owner may be blocked inside a Wasm barrier when any helper traps.
        const channel = new MessageChannel();
        try {
          fatalPort.postMessage({type: 'barry-helper-port', protocolVersion: workerProtocolVersion, index, port: channel.port1}, [channel.port1]);
          helper.postMessage({type: 'wasm_bindgen_worker_init', protocolVersion: workerProtocolVersion,
            optionsContractVersion, supportedSymbologies, module, memory, receiver: builder.receiver(),
            mainJS: builder.mainJS(), commonTimeOrigin: configuration.commonTimeOrigin, fatalPort: channel.port2}, [channel.port2]);
        } catch (error) {
          channel.port1.close();
          channel.port2.close();
          fail(error);
        }
      }));
    }
    await Promise.all(ready);
    if (state !== 'starting') throw new Error('Barry helper failed during initialization');
    // Preserve generated TLS initialization and readiness BEFORE synchronous build.
    builder.build();
    state = 'ready';
  } catch (error) {
    fail(error);
    await Promise.allSettled(ready);
    throw error;
  }
}

/** Idempotently terminate all helpers/ports; permanently forbid pool reuse. */
export function closeThreadPool() {
  if (state === 'closed') return;
  state = 'closed';
  rejectStartup(new Error('threaded execution is closed'));
  terminateHelpers();
  fatalPort?.close();
  fatalPort = null;
  fatalHandler = null;
}

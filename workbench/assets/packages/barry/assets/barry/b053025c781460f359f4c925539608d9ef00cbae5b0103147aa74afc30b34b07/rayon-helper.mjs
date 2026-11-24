// MIT License - see LICENSE file in the project root for details.
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright (c) 2026 Barry contributors
/* Adapted from wasm-bindgen-rayon 1.3.0 workerHelpers.no-bundler.js.
 * Copyright 2022 Google Inc. Licensed under the Apache License, Version 2.0.
 * See notices/wasm-bindgen-rayon/ in the distributed package.
 */
/**
 * Persistent helper entrypoint, not a user-callable scanner. Accept one
 * wasm_bindgen_worker_init packet carrying protocol12, compiled module, shared
 * memory, unchanged common-origin clock, upstream receiver/mainJS, and a direct
 * parent-serviced fatal MessagePort. Generated glue retains ownership of TLS and
 * the Rayon receiver. Readiness means the exact expected artifact has initialized,
 * not that a barcode or timing workload ran. The blocking event loop must never
 * return; every exceptional exit sends one fatal record on both containment paths.
 * Barry modifications are MIT; the adapted upstream portions remain Apache-2.0.
 */
import {errorRecord} from './barry-error.mjs';

let initialized = false;
let fatalPort = null;
let reported = false;
const protocolVersion = 12;
const optionsContractVersion = 6;
const supportedSymbologies = 0x7ee70;

/** Notify the independently serviceable parent before closing this broken helper. */
function fatal(error) {
  if (reported) return;
  reported = true;
  const message = {type: 'barry-helper-fatal', error: errorRecord(error)};
  // Unlike a message through the owning Worker, this direct port is serviceable
  // while that Worker is blocked waiting for this helper's scope barrier.
  try { fatalPort?.postMessage(message); } catch {}
  try { self.postMessage(message); } catch {}
  self.close();
}

self.addEventListener('error', event => {
  event.preventDefault();
  fatal(event.error || new Error(event.message || 'Barry helper crashed'));
});
self.addEventListener('unhandledrejection', event => {
  event.preventDefault();
  fatal(event.reason);
});
self.addEventListener('messageerror', () => fatal(new Error('Barry helper message could not be decoded')));
// Latch initialization before the first await so duplicate packets cannot import
// a second module or bind another receiver to this persistent worker.
self.addEventListener('message', async ({data}) => {
  if (data?.type !== 'wasm_bindgen_worker_init' || initialized) return;
  initialized = true;
  fatalPort = data.fatalPort;
  if (data.protocolVersion !== protocolVersion || data.optionsContractVersion !== optionsContractVersion ||
      data.supportedSymbologies !== supportedSymbologies) {
    fatal(new Error('incompatible Barry helper protocol/options/capability; rebuild browser package'));
    return;
  }
  try {
    const mainJS = new URL('./threads/barry_wasm.js', import.meta.url);
    if (new URL(data.mainJS, import.meta.url).href !== mainJS.href) {
      throw new Error('unexpected threaded module URL');
    }
    if (!Number.isFinite(data.commonTimeOrigin) || data.commonTimeOrigin < 0) {
      throw new Error('invalid browser clock origin');
    }
    const pkg = await import('./threads/barry_wasm.js');
    // wasm-bindgen 0.2.130 takes this object form; preserve shared module/memory
    // and leave TLS setup to generated glue exactly as upstream does.
    await pkg.default({module_or_path: data.module, memory: data.memory});
    if (pkg.optionsContractVersion?.() !== optionsContractVersion || pkg.ownerProfileProtocolVersion12?.() !== protocolVersion ||
        pkg.supportedSymbologies?.() !== supportedSymbologies) {
      throw new Error('incompatible Barry helper Wasm protocol/options/capability; rebuild browser package');
    }
    pkg.initializeClock(data.commonTimeOrigin);
    const resourceFetchMs = performance.getEntriesByType('resource')
      .reduce((total, entry) => total + Math.max(0, entry.duration), 0);
    self.postMessage({type: 'wasm_bindgen_worker_ready', protocolVersion, optionsContractVersion,
      supportedSymbologies, resourceFetchMs});
    pkg.wbg_rayon_start_worker(data.receiver);
    // The persistent Rayon event loop must not return while the pool is alive.
    throw new Error('Barry helper exited unexpectedly');
  } catch (error) {
    fatal(error);
  }
});

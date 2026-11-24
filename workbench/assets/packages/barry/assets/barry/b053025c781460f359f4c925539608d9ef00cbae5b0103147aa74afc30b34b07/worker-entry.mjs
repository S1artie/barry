// MIT License - see LICENSE file in the project root for details.
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Barry contributors
/**
 * Dedicated worker protocol12 owner, loaded only by worker-client.mjs. The init
 * packet transfers a parent-serviced fatal port, immutable mode/capacity and the
 * common clock origin. Readiness reports the actual allocated owner profile.
 * A strictly increasing session request stream is serialized through `tail`;
 * close is the final accepted operation and acknowledges after releasing the
 * allocated owners and every helper. Pixels/regions are private snapshots,
 * results are independent copies. No callback may reset the original caller deadline.
 * Ordinary input errors return a request error; internal/trap failures poison
 * the whole stack and notify the independently serviceable parent.
 */
import {workerProtocolVersion as poolProtocolVersion, configureThreadPool, closeThreadPool as terminateThreadPool, threadPoolResourceFetchMs} from './thread-pool.mjs';
import {supportedSymbologies, supportedSymbologyMask} from './symbology-selection.mjs';
import {classifyBarryError, errorRecord} from './barry-error.mjs';

let session = null;
let ownerProfile = null;
let scanner = null;
let decoder = null;
let api = null;
let fatal = false;
let closing = false;
let tail = Promise.resolve();
let lastRequestId = 0;
// Preserve the realm's one origin across independently quantized getter reads.
const realmTimeOrigin = performance.timeOrigin;
const epoch = () => realmTimeOrigin + performance.now();
const protocolVersion = 12;
const optionsContractVersion = 6;

/** Report one fatal transition, never reenter a possibly interrupted Rust barrier. */
function fail(error) {
  if (fatal) return;
  fatal = true;
  terminateThreadPool();
  try { self.postMessage({type: 'fatal', session, error: errorRecord(error)}); } catch {}
  // No Rust destructor is attempted after a trap: its invariants may be broken.
  // The outer owner terminates this entire dedicated-worker subtree.
  self.close();
}

self.addEventListener('error', event => {
  event.preventDefault();
  fail(event.error || new Error(event.message || 'Barry worker crashed'));
});
self.addEventListener('unhandledrejection', event => {
  event.preventDefault();
  fail(event.reason);
});
self.addEventListener('messageerror', () => fail(new Error('Barry worker message could not be decoded')));

/** Authenticate the wire contract and initialize one artifact without scanning. */
async function initialize(message) {
  session = message.session;
  try {
    if (message.protocolVersion !== protocolVersion || message.optionsContractVersion !== optionsContractVersion ||
        message.supportedSymbologies !== supportedSymbologyMask ||
        !['combined', 'regions'].includes(message.ownerProfile)) {
      throw new Error('incompatible Barry worker protocol/options/profile/capability; rebuild the complete browser package (worker12/options6)');
    }
    ownerProfile = message.ownerProfile;
    if (poolProtocolVersion !== protocolVersion) throw new Error('incompatible Barry thread-pool protocol');
    if (message.execution !== 'serial' && message.execution !== 'threads') throw new Error('invalid execution mode');
    if (message.execution === 'threads') {
      const hardware = navigator.hardwareConcurrency;
      if (!Number.isSafeInteger(hardware) || hardware < 1 || hardware > 0xffffffff) {
        throw new Error('threaded execution requires valid observed hardwareConcurrency');
      }
      configureThreadPool({commonTimeOrigin: message.commonTimeOrigin, fatalPort: message.fatalPort,
        participants: message.maxParticipants === 0 ? Math.min(2, hardware) : message.maxParticipants, onFatal: fail});
    } else {
      message.fatalPort?.close();
    }
    api = await import('./index.mjs');
    if (api.optionsContractVersion !== optionsContractVersion || api.workerProtocolVersion !== protocolVersion ||
        !Array.isArray(api.supportedSymbologies) ||
        api.supportedSymbologies.length !== supportedSymbologies.length ||
        !supportedSymbologies.every((name, index) => api.supportedSymbologies[index] === name)) {
      throw new Error('incompatible Barry ESM options/worker/capability contract');
    }
    const executionOptions = {execution: message.execution, maxParticipants: message.maxParticipants};
    await api.default({...executionOptions, commonTimeOrigin: message.commonTimeOrigin, fatalPort: message.fatalPort});
    if (fatal) return;
    if (ownerProfile === 'combined') scanner = new api.Scanner(executionOptions);
    decoder = new api.RegionDecoder(executionOptions);
    // Resource Timing durations are observed fetch costs, not scan time or an
    // assertion that fetching and instantiation occurred serially.
    const resourceFetchMs = performance.getEntriesByType('resource')
      .reduce((total, entry) => total + Math.max(0, entry.duration), threadPoolResourceFetchMs());
    self.postMessage({type: 'ready', session, requestId: 0, operation: 'init', resourceFetchMs,
      protocolVersion, optionsContractVersion, supportedSymbologies: supportedSymbologyMask,
      ownerProfile: scanner === null ? 'regions' : 'combined', execution: decoder.execution});
  } catch (error) {
    fail(error);
  }
}

/** Execute one accepted request using its original invocation or direct clock.
 * @param {object} message Session/request/operation plus private copied args.
 * @param {number} receivedAt Common-origin milliseconds observed on arrival.
 */
async function execute(message, receivedAt) {
  if (fatal) return;
  const {requestId, operation, args} = message;
  const startedAt = epoch();
  try {
    if (operation === 'close') {
      scanner?.close();
      decoder.close();
      api.closeThreadPool();
      terminateThreadPool();
      scanner = null;
      decoder = null;
      self.postMessage({type: 'result', protocolVersion, optionsContractVersion, ownerProfile, session, requestId, operation, result: undefined,
        timing: {receivedAt, startedAt, finishedAt: epoch()}});
      self.close();
      return;
    }
    // Invocation-domain submissions retain their original parent timestamp.
    // Process qualification explicitly brackets the direct synchronous method.
    if (message.clockDomain !== 'invocation' && message.clockDomain !== 'direct') throw new Error('invalid worker clock domain');
    if (message.clockDomain === 'invocation' && !Number.isFinite(message.originalEntry)) throw new Error('invalid entry timestamp');
    const result = api.invokeWorkerRequest(operation === 'decodeRegionsGray' ? decoder : scanner,
      operation, args, message.clockDomain === 'invocation' ? message.originalEntry : undefined);
    self.postMessage({type: 'result', protocolVersion, optionsContractVersion, ownerProfile, session, requestId, operation, result,
      timing: {receivedAt, startedAt, finishedAt: epoch()}});
  } catch (error) {
    if (operation === 'close' || error?.fatal || classifyBarryError(error) !== 'INVALID_ARGUMENT' ||
        scanner?.poisoned || decoder?.poisoned) {
      fail(error);
      return;
    }
    self.postMessage({type: 'result', protocolVersion, optionsContractVersion, ownerProfile, session, requestId, operation, error: errorRecord(error),
      timing: {receivedAt, startedAt, finishedAt: epoch()}});
  }
}

// Capture receipt before waiting on `tail`; queued validation still consumes the
// original budget. Foreign/duplicate/out-of-order packets cannot consume work.
self.addEventListener('message', ({data}) => {
  if (!data || fatal) return;
  if (session === null) {
    if (data.type !== 'init' || typeof data.session !== 'string' || data.requestId !== 0) return;
    // Set the session synchronously so duplicate init cannot race module fetch.
    session = data.session;
    tail = initialize(data);
    return;
  }
  if (data.type !== 'request' || data.session !== session || closing ||
      !Number.isSafeInteger(data.requestId) || data.requestId <= lastRequestId) return;
  if (data.protocolVersion !== protocolVersion || data.optionsContractVersion !== optionsContractVersion ||
      data.ownerProfile !== ownerProfile || !Array.isArray(data.args) ||
      !(data.operation === 'close' || data.operation === 'decodeRegionsGray' ||
        (ownerProfile === 'combined' && (data.operation === 'scanGray' || data.operation === 'findRegionsGray')))) {
    fail(new Error('incompatible Barry worker request protocol/options/profile/operation; rebuild browser package'));
    return;
  }
  lastRequestId = data.requestId;
  if (data.operation === 'close') closing = true;
  const receivedAt = epoch();
  tail = tail.then(() => execute(data, receivedAt)).catch(fail);
});

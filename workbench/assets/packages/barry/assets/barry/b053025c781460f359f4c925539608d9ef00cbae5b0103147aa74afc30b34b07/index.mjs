// MIT License - see LICENSE file in the project root for details.
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Barry contributors
/**
 * Realm-local SIMD Wasm facade. Initialization selects one immutable mode and
 * shared helper capacity. Owners reuse native scratch and upload only the
 * readable grayscale span, refreshing views after memory growth. Returned Rust
 * records are copied into independent JS storage, never exposed as scratch views.
 * All geometry stays in input-image pixels (x right, y down); image orientation
 * and display scaling belong to callers. See index.d.ts for the full contract.
 */
export {createWorkerScanner, createWorkerRegionDecoder} from './worker-client.mjs';
export {LocalizationStop, isBarcodeOf} from './databar-result.mjs';
export {validateScanOptions} from './symbology-selection.mjs';
import {classifyBarryError, tagError} from './barry-error.mjs';
export {classifyBarryError};
import {imageSpan, canonicalRegions} from './frame-input.mjs';
import {ownBarcodeResults, isGeometryOnly} from './databar-result.mjs';
import {scanOptions, supportedSymbologies, supportedSymbologyMask} from './symbology-selection.mjs';
export {supportedSymbologies};

// One binding/pool per realm, not per Scanner. A failed initialization remains a
// failed promise: selecting a different artifact would hide a deployment error.
let selectedExecution;
let initialization;
let binding;
let memory;
let commonTimeOrigin;
let poolTransport;
let poolClosed = false;
let participantCapacity;
let availableCpus;
// A fresh timeOrigin read may have a different quantization offset. Snapshot it
// once; only monotonic now() advances the original common-origin deadline.
const realmTimeOrigin = performance.timeOrigin;

/** Exact direct-API options handshake; do not mix generated artifact versions. */
export const optionsContractVersion = 6;
/** Exact worker/helper protocol handshake. */
export const workerProtocolVersion = 12;

function option(options, name, fallback) {
  try {
    const value = options[name];
    return value === undefined ? fallback : value;
  } catch (error) {
    throw tagError(error, 'INVALID_ARGUMENT');
  }
}

/** Resolve Auto within initialized capacity; explicit allocation is never reduced. */
function participantOption(options, capacity) {
  const value = option(options, 'maxParticipants', 0);
  if (!Number.isSafeInteger(value) || value < 0 || value > capacity) {
    throw tagError(new RangeError(`maxParticipants must be 0 (Auto) or 1..${capacity}`), 'INVALID_ARGUMENT');
  }
  return value === 0 ? Math.min(2, capacity) : value;
}

// Standard SIMD is part of both shipped artifacts, not an alternate engine.
const simd128Probe = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0,
  1, 5, 1, 96, 0, 1, 123,
  3, 2, 1, 0,
  10, 22, 1, 20, 0, 253, 12,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11,
]);

/** Validate mode before importing either artifact so failure cannot trigger fallback. */
function executionOption(options = {}, fallback = 'serial') {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw tagError(new TypeError('invalid execution options'), 'INVALID_ARGUMENT');
  }
  const execution = option(options, 'execution', fallback);
  if (execution !== 'serial' && execution !== 'threads') throw tagError(new TypeError('invalid execution mode'), 'INVALID_ARGUMENT');
  return execution;
}
/** Shared Wasm barriers require an isolated dedicated owner, never the UI realm. */
function requireThreadEnvironment() {
  if (globalThis.crossOriginIsolated !== true || typeof SharedArrayBuffer === 'undefined') {
    throw tagError(new Error('threaded execution requires cross-origin isolation'), 'INITIALIZATION_FAILED');
  }
  if (typeof DedicatedWorkerGlobalScope === 'undefined' || !(globalThis instanceof DedicatedWorkerGlobalScope)) {
    throw tagError(new Error('threaded execution requires a dedicated worker'), 'INITIALIZATION_FAILED');
  }
}

/** Select and initialize one SIMD artifact without constructing/scanning an owner.
 * Once artifact/pool initialization begins, rejection is cached for this module
 * instance; recovery requires a fresh owner Worker/realm, not a matching retry.
 * Preliminary option/environment validation failures are not cached.
 * @param {object} [options] Mode (default serial), integer maxParticipants (0 Auto),
 * and for first direct threaded initialization a parent-serviced fatalPort.
 * @returns {Promise<object>} Frozen constructors/capability after helper readiness.
 * @throws Conflicting initialization or unavailable SIMD/isolation rejects.
 */
export default async function init(options = {}) {
  const execution = executionOption(options);
  if (execution === 'threads') requireThreadEnvironment();
  const hardware = globalThis.navigator?.hardwareConcurrency;
  if (!Number.isSafeInteger(hardware) || hardware < 1 || hardware > 0xffffffff) {
    throw tagError(new Error('browser execution requires valid observed hardwareConcurrency'), 'INITIALIZATION_FAILED');
  }
  const participants = participantOption(options, execution === 'serial' ? 1 : hardware);
  if (selectedExecution !== undefined && selectedExecution !== execution) {
    throw tagError(new Error('execution mode does not match initialized module'), 'INVALID_ARGUMENT');
  }
  if (participantCapacity !== undefined && participantCapacity !== participants) {
    throw tagError(new Error('maxParticipants does not match initialized module capacity'), 'INVALID_ARGUMENT');
  }
  let fatalPort;
  if (initialization === undefined && execution === 'threads') {
    fatalPort = option(options, 'fatalPort');
    if (typeof MessagePort === 'undefined' || !(fatalPort instanceof MessagePort)) {
      throw tagError(new TypeError('threaded execution requires a parent fatal MessagePort'), 'INVALID_ARGUMENT');
    }
  }
  if (initialization === undefined) {
    if (typeof WebAssembly === 'undefined' || !WebAssembly.validate(simd128Probe)) {
      throw tagError(new Error('Barry requires WebAssembly standard SIMD (simd128)'), 'INITIALIZATION_FAILED');
    }
    const origin = option(options, 'commonTimeOrigin', realmTimeOrigin);
    if (!Number.isFinite(origin) || origin < 0 || origin > realmTimeOrigin + performance.now()) {
      throw tagError(new RangeError('invalid browser clock origin'), 'INVALID_ARGUMENT');
    }
    selectedExecution = execution;
    participantCapacity = participants;
    availableCpus = hardware;
    commonTimeOrigin = origin;
    initialization = (async () => {
      if (execution === 'threads') {
        // Keep the same URL-based singleton as the separately shipped Wasm glue.
        poolTransport = await import(new URL('./thread-pool.mjs', import.meta.url).href);
        if (poolTransport.workerProtocolVersion !== workerProtocolVersion) {
          throw new Error('incompatible Barry thread-pool protocol; rebuild the complete browser package (worker12)');
        }
        poolTransport.configureThreadPool({commonTimeOrigin, fatalPort, participants});
      }
      const url = execution === 'threads'
        ? new URL('./threads/barry_wasm.js', import.meta.url)
        : new URL('./serial/barry_wasm.js', import.meta.url);
      const loaded = await import(url.href);
      await loaded.default();
      if (loaded.optionsContractVersion?.() !== optionsContractVersion ||
          loaded.ownerProfileProtocolVersion12?.() !== workerProtocolVersion ||
          loaded.supportedSymbologies?.() !== supportedSymbologyMask) {
        throw new Error('incompatible Barry Wasm capability/options/protocol; rebuild the complete browser package (options6/worker12)');
      }
      loaded.initializeClock(commonTimeOrigin);
      if (execution === 'threads') await loaded.initializeThreadPool(commonTimeOrigin, participants);
      if (execution === 'threads' && poolTransport.threadPoolHelperCount() !== participants - 1) {
        throw new Error('threaded helper readiness does not match requested capacity');
      }
      memory = loaded.wasmMemory();
      binding = loaded;
      return Object.freeze({ Scanner, RegionDecoder, execution, participantCapacity: participants,
        optionsContractVersion, supportedSymbologies });
    })().catch(error => {
      try { poolTransport?.closeThreadPool(); } catch { /* retain the first initialization failure */ }
      throw tagError(error, 'INITIALIZATION_FAILED');
    });
  }
  return initialization;
}

/** Idempotently shut down the module-wide stack after all direct owners close.
 * Individual owners never close this shared pool; shutdown permanently forbids
 * new owners, while already copied result records remain usable.
 */
export function closeThreadPool() {
  if (poolClosed) return;
  poolClosed = true;
  try {
    try {
      if (binding && selectedExecution === 'threads') binding.closeThreadPool();
    } finally {
      poolTransport?.closeThreadPool();
    }
  } catch (error) {
    throw fatalError(error);
  }
}

/** Convert the browser's common-origin clock to the Rust clock's seconds. */
function now() {
  return (realmTimeOrigin + performance.now() - commonTimeOrigin) / 1000;
}
function directSelection(options, localization, supplied) {
  try { return scanOptions(options, localization, supplied); }
  catch (error) { throw tagError(error, 'INVALID_ARGUMENT'); }
}

/** Preserve the trap/error and the legacy fatal flag on unexpected post-ready failures. */
function fatalError(cause) {
  const error = tagError(cause, 'OWNER_FAILED');
  try {
    if (!(error instanceof WebAssembly.RuntimeError)) error.name = 'BarryFatalError';
    error.fatal = true;
    return error;
  } catch {
    const fatal = tagError(new Error(error.message, {cause: error}), 'OWNER_FAILED');
    fatal.name = 'BarryFatalError';
    fatal.fatal = true;
    return fatal;
  }
}
function hasFrameGeometry(record, width, height) {
  if (!record || !Number.isInteger(record.left) || !Number.isInteger(record.right) ||
      !Number.isInteger(record.top) || !Number.isInteger(record.bottom) ||
      record.left < 0 || record.left > record.right || record.right > width ||
      record.top < 0 || record.top > record.bottom || record.bottom > height ||
      !Array.isArray(record.corners) || record.corners.length !== 8) return false;
  for (let i = 0; i < 8; i++) if (!Number.isFinite(record.corners[i])) return false;
  return true;
}

function ownDecoded(result, selection, width, height, supplied) {
  ownBarcodeResults(result, selection);
  if (!Number.isFinite(result.localizationMs) || result.localizationMs < 0 ||
      (supplied && result.localizationMs !== 0) || 'regions' in result ||
      !result.barcodes.every(record => hasFrameGeometry(record, width, height))) {
    throw new Error('invalid Barry decoding response');
  }
}

/** Include result finalization in the original budget without restarting its clock. */
function finalize(result, started, budgetMs, allocation) {
  // Rust already owns and converts every payload/geometry. This final sample
  // includes the binding return and JS result finalization in the clock.
  const facts = result.execution;
  if (!facts || facts.availableCpus !== allocation.availableCpus || facts.poolHelpers !== allocation.poolHelpers ||
      facts.participantLimit !== allocation.participantLimit || !Number.isInteger(facts.participantsUsed) ||
      facts.participantsUsed < 0 || facts.participantsUsed > facts.participantLimit ||
      !Number.isInteger(facts.peakParticipants) || facts.peakParticipants < 0 ||
      facts.peakParticipants > facts.participantsUsed || (facts.peakParticipants === 0) !== (facts.participantsUsed === 0) ||
      !Number.isFinite(result.elapsedMs) || !Number.isInteger(result.stopReason) || result.stopReason < 0 ||
      result.stopReason > 3 || result.complete !== (result.stopReason === 0)) {
    throw new Error('invalid Barry result timing/execution response');
  }
  result.execution = Object.freeze({...result.execution});
  const elapsedMs = (now() - started) * 1000;
  result.elapsedMs = elapsedMs;
  if (budgetMs !== 0 && elapsedMs >= budgetMs) result.stopReason = 1;
  result.complete = result.stopReason === 0;
  return result;
}
/** Shared scanner/decoder storage and poison lifecycle; one owner, one realm. */
class Owner {
  #native;
  #closed = false;
  #failure;
  #view;
  #pointer = 0;
  /** Allocate the selected native owner; constructors never inspect pixels. */
  constructor(options, decoder) {
    const execution = executionOption(options, selectedExecution);
    if (!binding) throw tagError(new Error('Barry module is not initialized'), 'INITIALIZATION_FAILED');
    if (poolClosed) throw tagError(new Error('Barry module is closed'), 'CLOSED');
    if (execution === 'threads') requireThreadEnvironment();
    if (execution !== selectedExecution) throw tagError(new Error('execution mode does not match initialized module'), 'INVALID_ARGUMENT');
    const participants = participantOption(options, participantCapacity);
    try {
      this.#native = decoder ? new binding.WasmRegionDecoder(participants) : new binding.WasmScanner(participants);
    } catch (error) {
      if (classifyBarryError(error) === 'INVALID_ARGUMENT') throw error;
      throw tagError(error, 'INITIALIZATION_FAILED');
    }
    Object.defineProperty(this, 'execution', {value: Object.freeze({availableCpus,
      participantLimit: participants, poolHelpers: participantCapacity - 1, participantsUsed: 0, peakParticipants: 0})});
  }
  /** Whether an internal failure forbids future processing. */
  get poisoned() { return this.#failure !== undefined; }
  /** Whether close has released this owner's native storage. */
  get closed() { return this.#closed; }
  /** Frozen canonical family names, independent of per-call selection. */
  get supportedSymbologies() { return supportedSymbologies; }
  /** Separate ordinary close from fatal poison so callers can contain traps. */
  _assertOpen() {
    if (this.#failure) throw fatalError(new Error('Barry instance is poisoned', {cause: this.#failure}));
    if (this.#closed) throw tagError(new Error('Barry instance is closed'), 'CLOSED');
  }
  /** Reserve/reuse scratch, refresh memory-growth-invalidated views, then borrow.
   * Only known validation failures preserve reuse; unexpected failures poison.
   */
  _call(pixels, operation, width, height, selection, started, invoke) {
    // User getters may have closed this owner or detached a previously validated input.
    this._assertOpen();
    const required = pixels.byteLength;
    if (required === 0) throw tagError(new RangeError('image buffer too small'), 'INVALID_ARGUMENT');
    let returned = false;
    try {
      this.#pointer = this.#native.reserveInput(required);
      // Any Rust operation, not just reserveInput, may grow linear memory.
      if (!this.#view || this.#view.buffer !== memory.buffer || this.#view.byteOffset !== this.#pointer
          || this.#view.byteLength !== this.#native.inputCapacity) {
        this.#view = new Uint8Array(memory.buffer, this.#pointer, this.#native.inputCapacity);
      }
      this.#view.set(pixels);
      const result = invoke(this.#native);
      returned = true;
      if (operation === 'findRegionsGray') {
        if (!Array.isArray(result.regions) || 'barcodes' in result ||
            !result.regions.every(region => isGeometryOnly(region) && hasFrameGeometry(region, width, height))) {
          throw new Error('invalid Barry localization response');
        }
      } else {
        ownDecoded(result, selection, width, height, operation === 'decodeRegionsGray');
      }
      return finalize(result, started, selection.budgetMs, this.execution);
    } catch (error) {
      // Only Rust's tagged request rejection is reusable. A broken result
      // (even one throwing a validation-looking exception) is never input.
      if (!returned && classifyBarryError(error) === 'INVALID_ARGUMENT' && Object.hasOwn(error, 'barryCode') &&
          !(error instanceof WebAssembly.RuntimeError)) throw error;
      this.#failure = fatalError(error);
      this.#view = undefined;
      throw this.#failure;
    }
  }
  /** Idempotently free healthy storage; poisoned state never reenters a barrier. */
  close() {
    if (this.#closed) return;
    this.#closed = true;
    this.#view = undefined;
    // A trap can interrupt a borrowed call/barrier. Never attempt a destructor
    // that could wait forever after that fatal interruption; the owning Worker
    // stack is terminated by the worker transport. This instance is unusable.
    try {
      if (this.#failure) this.#native.__destroy_into_raw();
      else this.#native.free();
    } catch (error) {
      this.#failure = fatalError(error);
      throw this.#failure;
    } finally {
      this.#native = undefined;
    }
  }
}

/** Synchronous reusable full-scan/localization owner. Retain independent results;
 * do not overlap calls or share this instance across realms. Explicitly close it.
 */
export class Scanner extends Owner {
  /** Construct after init using initialized mode and caller-inclusive capacity. */
  constructor(options = {}) { super(options, false); }
  /** Localize then decode. Uint8Array grayscale is read-only; dimensions 1..65535,
   * width*height <= 100M, stride >= width, required span (height-1)*stride+width.
   * @returns {object} Independent barcodes/timing/execution, possibly empty or partial.
   */
  scanGray(...args) { const started = now(); return this._invoke('scanGray', args, started); }
  /** Localize only using the same image/options contract; candidates need not decode. */
  findRegionsGray(...args) { const started = now(); return this._invoke('findRegionsGray', args, started); }
  /** Preserve the captured method-entry clock through validation/upload/core work. */
  _invoke(operation, [data, width, height, stride, options], started, submitted) {
    this._assertOpen();
    if (operation !== 'scanGray' && operation !== 'findRegionsGray') throw new TypeError('invalid worker operation');
    const selection = submitted ?? directSelection(options, operation === 'findRegionsGray', false);
    const {budgetMs, maxRegions, symbologyMask, subtypeMask, supplementPolicy,
      itfSubtypeMask, itfMinLength, itfMaxLength, qrSubtypeMask, pdf417SubtypeMask, dataBarSubtypeMask,
      dataBarReadLinkedComponent} = selection;
    const pixels = submitted ? data : imageSpan(data, width, height, stride);
    return this._call(pixels, operation, width, height, selection, started, owner =>
      owner[operation](width, height, stride, budgetMs, symbologyMask, subtypeMask, supplementPolicy,
        itfSubtypeMask, itfMinLength, itfMaxLength, qrSubtypeMask, pdf417SubtypeMask, dataBarSubtypeMask,
        dataBarReadLinkedComponent, maxRegions, started));
  }
}
/** Reusable supplied-region decoder; construction and calls do not create a CNN. */
export class RegionDecoder extends Owner {
  /** Allocate decoder scratch only after compatible module initialization. */
  constructor(options = {}) { super(options, true); }
  /** Decode 0..128 finite strictly convex image-pixel perimeters of absolute
   * area > 1e-9 pixel²; ignore supplied bounds. Either winding is canonicalized
   * clockwise from the topmost/leftmost vertex; corners may lie outside the image.
   * Input/final-row/budget/ownership rules match Scanner.scanGray. Omitted
   * budgetMs is 0 (Unlimited); empty formats validate but start no recognition.
   */
  decodeRegionsGray(...args) { const started = now(); return this._invoke('decodeRegionsGray', args, started); }
  /** Canonicalize copied corners before the same original-deadline core entry. */
  _invoke(operation, [data, width, height, stride, regions, options], started, submitted) {
    if (operation !== 'decodeRegionsGray') throw new TypeError('invalid worker operation');
    this._assertOpen();
    const selection = submitted ?? directSelection(options, false, true);
    const {budgetMs, symbologyMask, subtypeMask, supplementPolicy, itfSubtypeMask, itfMinLength, itfMaxLength,
      qrSubtypeMask, pdf417SubtypeMask, dataBarSubtypeMask, dataBarReadLinkedComponent} = selection;
    const pixels = submitted ? data : imageSpan(data, width, height, stride);
    const canonical = submitted ? regions : canonicalRegions(regions);
    return this._call(pixels, operation, width, height, selection, started, owner =>
      owner.decodeRegionsGray(width, height, stride, budgetMs, symbologyMask, subtypeMask, supplementPolicy,
        itfSubtypeMask, itfMinLength, itfMaxLength, qrSubtypeMask, pdf417SubtypeMask, dataBarSubtypeMask,
        dataBarReadLinkedComponent, canonical, started));
  }
}

/**
 * Internal worker transport hook; not a second decoder API.
 * @param {Scanner|RegionDecoder} owner Realm-local owner, never a remote proxy.
 * @param {string} operation Validated direct public method name.
 * @param {Array} args Snapshotted method arguments, ending in resolved selection words.
 * @param {number|undefined} originalEntry Common-origin milliseconds from async
 * invocation; undefined explicitly selects the process consumer's direct clock.
 * @returns {object} Independent synchronous result; never resets or clamps an invocation deadline.
 */
export function invokeWorkerRequest(owner, operation, args, originalEntry) {
  const entry = originalEntry === undefined ? now() : (originalEntry - commonTimeOrigin) / 1000;
  // The sender validates capture <= dispatch in its own monotonic realm.
  // Independently coarsened timeOrigin/now pairs are not an ordering oracle
  // across realms; retain the original entry instead of clamping/restarting it.
  if (!Number.isFinite(entry) || entry < 0) throw new RangeError('invalid entry timestamp');
  const submitted = args.at(-1);
  if (!submitted || typeof submitted !== 'object' || args.length !== (operation === 'decodeRegionsGray' ? 6 : 5)) {
    throw new TypeError('invalid worker request selection');
  }
  return owner._invoke(operation, args, entry, submitted);
}

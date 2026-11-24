// MIT License - see LICENSE file in the project root for details.
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Barry contributors
/**
 * Parent-side asynchronous owner. Session/request/operation identities protect
 * queue state from stale replies. Accepted calls copy their inputs once into
 * private transport storage and carry one original invocation deadline through
 * the dedicated owner. Fatal ports remain serviced here even while that owner
 * is blocked in a Rayon barrier; failure terminates the entire nested subtree.
 */
import {ownBarcodeResults, isGeometryOnly} from './databar-result.mjs';
import {scanOptions, supportedSymbologies, supportedSymbologyMask} from './symbology-selection.mjs';
import {canonicalRegions, snapshotImage} from './frame-input.mjs';
import {classifyBarryError, remoteError, tagError} from './barry-error.mjs';

// Some engines independently quantize repeated timeOrigin reads. Keep one
// realm origin so monotonic now() cannot acquire a backwards epoch offset.
const realmTimeOrigin = performance.timeOrigin;
const epoch = () => realmTimeOrigin + performance.now();
const nonnegative = value => Math.max(0, value);
const protocolVersion = 12;
const optionsContractVersion = 6;

/** Validate resource facts instead of inferring participation from pool capacity. */
function validExecution(facts) {
  return facts && ['availableCpus', 'participantLimit', 'poolHelpers', 'participantsUsed', 'peakParticipants']
    .every(key => Number.isSafeInteger(facts[key]) && facts[key] >= 0) &&
    facts.participantLimit >= 1 && facts.participantLimit <= facts.availableCpus &&
    facts.poolHelpers < facts.availableCpus && facts.participantLimit <= facts.poolHelpers + 1 &&
    facts.participantsUsed <= facts.participantLimit &&
    facts.peakParticipants <= facts.participantsUsed &&
    (facts.participantsUsed === 0) === (facts.peakParticipants === 0);
}

/** One dedicated Worker plus its parent-serviced fatal-port/queue state machine. */
class WorkerScanner {
  #worker;
  #port;
  #session;
  #state = 'starting';
  #nextId = 1;
  #queue = [];
  #active = null;
  #ready;
  #resolveReady;
  #rejectReady;
  #closePromise = null;
  #lastTransport = null;
  #initializationStarted = epoch();
  #initializationTransport = null;
  #helperPorts = new Set();
  #execution = null;
  #clockDomain;
  #requestedExecution;
  #requestedParticipants;
  #profile;
  #failure = null;

  /** Start a private session; readiness authenticates versions/allocation, not pixels. */
  constructor(execution, maxParticipants, clockDomain, ownerProfile) {
    this.#profile = ownerProfile;
    if (ownerProfile === 'combined') {
      this.scanGray = (...args) => this.#call('scanGray', args);
      this.findRegionsGray = (...args) => this.#call('findRegionsGray', args);
    }
    this.#clockDomain = clockDomain;
    this.#requestedExecution = execution;
    this.#requestedParticipants = maxParticipants;
    this.#session = crypto.randomUUID();
    this.#ready = new Promise((resolve, reject) => {
      this.#resolveReady = resolve;
      this.#rejectReady = reject;
    });
    const channel = new MessageChannel();
    this.#port = channel.port1;
    try {
      this.#worker = new Worker(new URL('./worker-entry.mjs', import.meta.url), {
        type: 'module', name: 'barry-scanner'
      });
      this.#port.onmessage = ({data}) => {
        if (data?.type === 'barry-helper-fatal') this.#fail(remoteError(data.error));
        else if (data?.type === 'barry-helper-port') {
          if (data.protocolVersion !== protocolVersion || !(data.port instanceof MessagePort)) {
            this.#fail(new Error('incompatible Barry helper port protocol'));
            return;
          }
          const port = data.port;
          this.#helperPorts.add(port);
          port.onmessage = ({data: report}) => {
            if (report?.type === 'barry-helper-fatal') this.#fail(remoteError(report.error));
          };
          port.onmessageerror = () => this.#fail(new Error('Barry helper message could not be decoded'));
        }
      };
      this.#port.onmessageerror = () => this.#fail(new Error('Barry helper message could not be decoded'));
      this.#worker.addEventListener('error', event => {
        event.preventDefault();
        this.#fail(event.error || new Error(event.message || 'Barry worker crashed'));
      });
      this.#worker.addEventListener('messageerror', () => this.#fail(new Error('Barry worker message could not be decoded')));
      this.#worker.addEventListener('message', event => this.#receive(event.data));
      // Readiness contains no pixels, operations, expected payloads or hints.
      this.#worker.postMessage({type: 'init', session: this.#session, requestId: 0,
        protocolVersion, optionsContractVersion, supportedSymbologies: supportedSymbologyMask, ownerProfile, execution, maxParticipants,
        commonTimeOrigin: realmTimeOrigin, fatalPort: channel.port2}, [channel.port2]);
    } catch (error) {
      channel.port2.close();
      this.#fail(error);
    }
  }

  /** Resolve only after compatible scanner, decoder and helper readiness. */
  ready() { return this.#ready; }
  /** Last transport diagnostics in milliseconds, null before the first response. */
  get lastTransport() { return this.#lastTransport; }
  /** Initialization ready/fetch durations in milliseconds; fetches may overlap. */
  get initializationTransport() { return this.#initializationTransport; }
  /** Frozen canonical family names. */
  get supportedSymbologies() { return supportedSymbologies; }
  /** Frozen initialized allocation with zero per-call participation. */
  get execution() { return this.#execution; }
  /** Lifecycle state; the factory exposes the facade only after readiness. */
  get status() { return this.#state; }

  /** Release parent ports before terminating a potentially blocked worker subtree. */
  #release() {
    this.#port.close();
    for (const port of this.#helperPorts) port.close();
    this.#helperPorts.clear();
    // Dedicated-worker termination also terminates its nested helper subtree;
    // this path works even when the owning worker cannot run JS during Rayon.
    this.#worker?.terminate();
  }

  /** A fatal transition rejects readiness and every accepted request exactly once. */
  #fail(error) {
    if (this.#state === 'failed' || this.#state === 'closed') return;
    const code = this.#state !== 'starting' ? 'OWNER_FAILED' :
      classifyBarryError(error) === 'INVALID_ARGUMENT' ? 'INVALID_ARGUMENT' : 'INITIALIZATION_FAILED';
    error = tagError(error, code);
    this.#failure = error;
    error.fatal = true;
    this.#state = 'failed';
    this.#release();
    this.#rejectReady(error);
    this.#active?.reject(error);
    this.#active = null;
    for (const request of this.#queue.splice(0)) request.reject(error);
  }

  /** Match session, monotonic request ID and operation before mutating queue state. */
  #receive(message) {
    if (!message || message.session !== this.#session ||
        this.#state === 'closed' || this.#state === 'failed') return;
    if (message.type === 'fatal') {
      this.#fail(remoteError(message.error));
      return;
    }
    if (message.type === 'ready') {
      if (this.#state !== 'starting' || message.requestId !== 0) return;
      const facts = message.execution;
      if (message.protocolVersion !== protocolVersion || message.optionsContractVersion !== optionsContractVersion ||
          message.operation !== 'init' || message.ownerProfile !== this.#profile ||
          message.supportedSymbologies !== supportedSymbologyMask || !validExecution(facts) ||
          facts.participantsUsed !== 0 || facts.peakParticipants !== 0 ||
          facts.participantLimit !== (this.#requestedParticipants || Math.min(2,
            this.#requestedExecution === 'serial' ? 1 : facts.availableCpus)) ||
          facts.poolHelpers !== facts.participantLimit - 1 ||
          (this.#requestedExecution === 'serial' && facts.participantLimit !== 1)) {
        this.#fail(new Error('incompatible Barry worker options/protocol/profile/capability/execution; rebuild the complete browser package (worker12/options6)'));
        return;
      }
      if (!Number.isFinite(message.resourceFetchMs) || message.resourceFetchMs < 0) {
        this.#fail(new Error('invalid Barry worker initialization timing'));
        return;
      }
      this.#execution = Object.freeze({...facts});
      this.#state = 'open';
      this.#initializationTransport = Object.freeze({
        readyMs: nonnegative(epoch() - this.#initializationStarted),
        resourceFetchMs: message.resourceFetchMs
      });
      this.#resolveReady(this);
      return;
    }
    const request = this.#active;
    // Foreign, duplicate and stale IDs cannot consume the current operation.
    if (message.type !== 'result' || !request || message.requestId !== request.id) return;
    if (message.protocolVersion !== protocolVersion || message.optionsContractVersion !== optionsContractVersion ||
        message.operation !== request.operation || message.ownerProfile !== this.#profile) {
      this.#fail(new Error('incompatible Barry worker response protocol/options; rebuild browser package'));
      return;
    }
    if (message.error && (request.operation === 'close' || message.error.fatal ||
        classifyBarryError(message.error) !== 'INVALID_ARGUMENT')) {
      this.#fail(remoteError(message.error));
      return;
    }
    // The invocation caller owns public elapsed timing below. Independently
    // coarsened receiver clocks can give its intermediate difference a negative
    // sign; direct qualification instead owns a same-realm nonnegative interval.
    if (request.operation !== 'close' && !message.error &&
        (!message.result || !validExecution(message.result.execution) ||
          !['availableCpus', 'participantLimit', 'poolHelpers'].every(
            key => message.result.execution[key] === this.#execution[key]) ||
          typeof message.result.complete !== 'boolean' || !Number.isInteger(message.result.stopReason) ||
          message.result.stopReason < 0 || message.result.stopReason > 3 ||
          message.result.complete !== (message.result.stopReason === 0) ||
          !Number.isFinite(message.result.elapsedMs) ||
          (request.operation !== 'findRegionsGray' &&
            (!Number.isFinite(message.result.localizationMs) || message.result.localizationMs < 0)) ||
          (request.operation === 'decodeRegionsGray' && message.result.localizationMs !== 0) ||
          (this.#clockDomain === 'direct' && message.result.elapsedMs < 0))) {
      this.#fail(new Error('invalid Barry worker result/execution response'));
      return;
    }
    if (request.operation !== 'close' && !message.error) {
      try {
        const result = message.result;
        if (request.operation === 'findRegionsGray') {
          if ('barcodes' in result || !Array.isArray(result.regions) || !result.regions.every(isGeometryOnly)) {
            throw new Error('invalid Barry worker localization response');
          }
        } else {
          ownBarcodeResults(result, request.selection);
        }
      } catch (error) {
        this.#fail(error);
        return;
      }
    }
    const now = epoch();
    const timing = message.timing;
    if (!timing || ![timing.receivedAt, timing.startedAt, timing.finishedAt].every(Number.isFinite) ||
        timing.startedAt < timing.receivedAt || timing.finishedAt < timing.startedAt) {
      this.#fail(new Error('invalid Barry worker timing response'));
      return;
    }
    const queueMs = nonnegative(request.sentAt - request.enqueuedAt) +
      nonnegative(timing.startedAt - timing.receivedAt);
    const requestMs = nonnegative(timing.receivedAt - request.sentAt);
    const responseMs = nonnegative(now - timing.finishedAt);
    this.#lastTransport = Object.freeze({queueMs, requestMs, responseMs,
      totalMs: queueMs + requestMs + responseMs});
    this.#active = null;
    if (request.operation === 'close') {
      this.#state = 'closed';
      this.#release();
      request.resolve();
      return;
    }
    if (message.error) request.reject(remoteError(message.error));
    else {
      const result = message.result;
      if (this.#clockDomain === 'invocation') {
        // Includes snapshot, accepted queueing, transport and client ownership.
        result.execution = Object.freeze({...result.execution});
        result.elapsedMs = epoch() - request.enqueuedAt;
        if (request.selection.budgetMs !== 0 && result.elapsedMs >= request.selection.budgetMs) result.stopReason = 1;
        result.complete = result.stopReason === 0;
      }
      request.resolve(result);
    }
    this.#pump();
  }

  /** Dispatch one private snapshot, never refreshing its invocation timestamp. */
  #pump() {
    if (this.#active || !this.#queue[0]?.args || !['open', 'closing'].includes(this.#state)) return;
    const request = this.#queue.shift();
    this.#active = request;
    request.sentAt = epoch();
    try {
      if (this.#clockDomain === 'invocation' &&
          (!Number.isFinite(request.enqueuedAt) || request.enqueuedAt < 0 ||
           request.enqueuedAt > request.sentAt)) {
        throw new RangeError('invalid entry timestamp');
      }
      this.#worker.postMessage({type: 'request', session: this.#session,
        protocolVersion, optionsContractVersion, ownerProfile: this.#profile, requestId: request.id, operation: request.operation,
        originalEntry: this.#clockDomain === 'invocation' ? request.enqueuedAt : undefined,
        clockDomain: this.#clockDomain, args: request.args}, request.transfer);
      request.args = null;
      request.transfer = null;
    } catch (error) {
      this.#fail(error);
    }
  }

  /** Admit at most one pending call before touching rejected pixels or options. */
  #call(operation, args, enqueuedAt = epoch()) {
    if (this.#state !== 'open') return Promise.reject(this.#failure || tagError(new Error('scanner is closed'), 'CLOSED'));
    if (this.#queue.length + Number(this.#active !== null) >= 2) {
      return Promise.reject(tagError(new Error('Barry worker queue is full (one active and one pending request)'), 'QUEUE_FULL'));
    }
    // Reserve the position before touching foreign getters. A nested call/close
    // can reserve behind us, but #pump cannot send past the unfinished snapshot.
    return new Promise((resolve, reject) => {
      const request = {id: this.#nextId++, operation, enqueuedAt, resolve, reject};
      this.#queue.push(request);
      try {
        const supplied = operation === 'decodeRegionsGray';
        const selection = Object.freeze(scanOptions(args[supplied ? 5 : 4], operation === 'findRegionsGray', supplied));
        const [, width, height, stride] = args;
        const regions = supplied ? canonicalRegions(args[4]) : null;
        const image = snapshotImage(args[0], width, height, stride);
        request.args = supplied ? [image, width, height, stride, regions, selection] : [image, width, height, stride, selection];
        request.transfer = [image.buffer];
        request.selection = selection;
      } catch (error) {
        const index = this.#queue.indexOf(request);
        if (index !== -1) this.#queue.splice(index, 1);
        reject(tagError(error, 'INVALID_ARGUMENT'));
      }
      this.#pump();
    });
  }
  /** Async supplied-region decoding; snapshot bytes and finite strictly convex
   * corners of absolute area > 1e-9 pixel². Bounds are ignored. See index.d.ts
   * for clipping/canonical geometry, original-deadline and default-budget rules.
   */
  decodeRegionsGray(...args) { return this.#call('decodeRegionsGray', args); }

  /** @internal The Flutter package samples this module's epoch before marshalling. */
  submitFromFlutter(operation, args, entry) {
    if (this.#clockDomain !== 'invocation' || this.#profile !== 'combined' ||
        !['scanGray', 'findRegionsGray', 'decodeRegionsGray'].includes(operation) ||
        !Number.isFinite(entry) || entry < realmTimeOrigin || entry > epoch()) {
      return Promise.reject(tagError(new RangeError('invalid Flutter submission clock or operation'), 'INVALID_ARGUMENT'));
    }
    return this.#call(operation, args, entry);
  }

  /** Idempotently reject new work, drain accepted calls, then await owner release. */
  close() {
    if (this.#closePromise) return this.#closePromise;
    if (this.#state === 'closed' || this.#state === 'failed') {
      this.#closePromise = Promise.resolve();
      return this.#closePromise;
    }
    this.#state = 'closing';
    // Previously accepted requests drain in order. New calls fail immediately.
    this.#closePromise = new Promise((resolve, reject) => {
      this.#queue.push({id: this.#nextId++, operation: 'close', args: [], transfer: [],
        enqueuedAt: epoch(), resolve, reject});
    });
    this.#pump();
    return this.#closePromise;
  }
}

/** Validate deployment without fallback, then expose only a genuinely ready owner. */
async function createOwner(options, clockDomain, ownerProfile) {
  let execution, maxParticipants;
  try {
    if (options === null || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('invalid execution options');
    ({execution = 'serial', maxParticipants = 0} = options);
    if (execution !== 'serial' && execution !== 'threads') throw new Error('invalid execution mode');
    if (!Number.isSafeInteger(maxParticipants) || maxParticipants < 0) throw new RangeError('invalid maxParticipants');
  } catch (error) {
    throw tagError(error, 'INVALID_ARGUMENT');
  }
  try {
    if (execution === 'threads' &&
        (globalThis.crossOriginIsolated !== true || typeof SharedArrayBuffer !== 'function')) {
      throw new Error('threaded execution requires cross-origin isolation');
    }
    const owner = new WorkerScanner(execution, maxParticipants, clockDomain, ownerProfile);
    return owner.ready();
  } catch (error) {
    throw tagError(error, 'INITIALIZATION_FAILED');
  }
}

/**
 * Create a public asynchronous scanner/decoder stack; performs no image scan.
 * @param {object} [options] execution ('serial' default or explicit 'threads') and
 * integer maxParticipants (0 Auto); threaded mode requires cross-origin isolation.
 * @returns {Promise<object>} Ready WorkerScanner with one active/one pending slot.
 * Calls snapshot inputs without detachment; fatal errors dispose the full stack.
 */
export function createWorkerScanner(options = {}) { return createOwner(options, 'invocation', 'combined'); }

/** @internal Shared epoch for the Flutter bridge. Not exported by index.mjs. */
export function flutterInvocationNow() { return epoch(); }

/** @internal Same worker, admission, snapshot and wire protocol as public calls. */
export function submitFlutterRequest(owner, entry, operation, ...args) {
  return owner.submitFromFlutter(operation, args, entry);
}

/** Create a dedicated supplied-region decoder without allocating a scanner. */
export function createWorkerRegionDecoder(options = {}) { return createOwner(options, 'invocation', 'regions'); }

/**
 * Maintained process-consumer entry using the direct synchronous owner clock.
 * @param {object} [options] Same immutable mode/allocation as createWorkerScanner.
 * @returns {Promise<object>} Ready owner; process setup/IPC is not API elapsed time.
 * @internal Not an alternate public deadline policy.
 */
export function createProcessScanner(options = {}) { return createOwner(options, 'direct', 'combined'); }

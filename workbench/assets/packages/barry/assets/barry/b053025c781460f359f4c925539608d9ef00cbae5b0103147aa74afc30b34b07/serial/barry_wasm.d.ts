/* tslint:disable */
/* eslint-disable */

/**
 * Standalone supplied-region owner: no CNN graph is constructed or invoked.
 * Input reuse/free rules match WasmScanner; each returned payload is copied into JS storage.
 */
export class WasmRegionDecoder {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Decode0..128 supplied quads against the uploaded original grayscale pixels.
     * Budget0=Unlimited, mask0=empty; started is original common-origin seconds.
     * No CNN runs and localization time is zero. Validation/decoding/conversion
     * share the entry clock; output bytes/geometry survive owner reuse/free.
     */
    decodeRegionsGray(width: number, height: number, stride: number, budget: number, mask: number, subtypes: number, policy: number, itf_subtypes: number, itf_min_length: number, itf_max_length: number, qr_subtypes: number, pdf417_subtypes: number, databar_subtypes: number, databar_read_linked_component: number, supplied: any, started: number): any;
    /**
     * Construct a decode owner outside clocks;0=Auto caller-inclusive allocation.
     */
    constructor(participants: number);
    /**
     * Reserve reusable upload bytes; returned offset/views expire on growth/free.
     */
    reserveInput(required: number): number;
    /**
     * Current accessible upload capacity in bytes, not retained result storage.
     */
    readonly inputCapacity: number;
}

/**
 * Thread-confined scanner plus reusable input; use the ESM facade for lifecycle.
 * Generated free drops the owner/input after synchronous calls drain. Results
 * already returned to JS remain independent and valid across reuse and close.
 */
export class WasmScanner {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Localize uploaded pixels without treating unread geometry as decoded data.
     * Uses the same dimensions/options/common-origin timestamp as scanGray;
     * returns copied regions and actual completion/stop/time/allocation fields.
     */
    findRegionsGray(width: number, height: number, stride: number, budget: number, mask: number, subtypes: number, policy: number, itf_subtypes: number, itf_min_length: number, itf_max_length: number, qr_subtypes: number, pdf417_subtypes: number, databar_subtypes: number, databar_read_linked_component: number, maximum: number, started: number): any;
    /**
     * Construct outside call clocks;0 participants requests core Auto allocation.
     * Invalid/noninteger/out-of-capacity allocations return a JS exception.
     */
    constructor(participants: number);
    /**
     * Reserve upload bytes, returning an offset valid until growth or owner free.
     * Refresh memory views after this call;0 is permitted, allocation may fail.
     */
    reserveInput(required: number): number;
    /**
     * Scan uploaded pixels with native ownership and one original entry clock.
     * Dimensions/stride obey `image`; budget0=Unlimited, cap1..128, mask0=empty.
     * `started` is common-origin seconds captured before facade preparation.
     * Returns copied payload/geometry/metadata and real partial/elapsed state;
     * validation/core/JS conversion failures throw, never select another reader.
     */
    scanGray(width: number, height: number, stride: number, budget: number, mask: number, subtypes: number, policy: number, itf_subtypes: number, itf_min_length: number, itf_max_length: number, qr_subtypes: number, pdf417_subtypes: number, databar_subtypes: number, databar_read_linked_component: number, maximum: number, started: number): any;
    /**
     * Accessible upload capacity in bytes; not an image length or total workspace.
     */
    readonly inputCapacity: number;
}

/**
 * Install the common nonnegative epoch-millisecond origin before any calls.
 * Repeating the identical origin succeeds; a changed/invalid origin fails.
 */
export function initializeClock(origin: number): void;

/**
 * Return the options contract the ESM facade probes before binding methods.
 */
export function optionsContractVersion(): number;

/**
 * Binding and binary must both support the current low-level selection layout.
 * The generation-specific symbol prevents stale glue from passing this check.
 */
export function ownerProfileProtocolVersion12(): number;

/**
 * Return the twelve supported family bits; explicit zero searches nothing.
 */
export function supportedSymbologies(): number;

/**
 * Return the module's WebAssembly.Memory, not an independent copy of its bytes.
 * Views must be refreshed after reserve/growth; never retain them after free.
 */
export function wasmMemory(): any;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_wasmregiondecoder_free: (a: number, b: number) => void;
    readonly __wbg_wasmscanner_free: (a: number, b: number) => void;
    readonly initializeClock: (a: number) => [number, number];
    readonly optionsContractVersion: () => number;
    readonly ownerProfileProtocolVersion12: () => number;
    readonly supportedSymbologies: () => number;
    readonly wasmMemory: () => any;
    readonly wasmregiondecoder_decodeRegionsGray: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: any, q: number) => [number, number, number];
    readonly wasmregiondecoder_inputCapacity: (a: number) => number;
    readonly wasmregiondecoder_new: (a: number) => [number, number, number];
    readonly wasmregiondecoder_reserveInput: (a: number, b: number) => [number, number, number];
    readonly wasmscanner_findRegionsGray: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number) => [number, number, number];
    readonly wasmscanner_inputCapacity: (a: number) => number;
    readonly wasmscanner_new: (a: number) => [number, number, number];
    readonly wasmscanner_reserveInput: (a: number, b: number) => [number, number, number];
    readonly wasmscanner_scanGray: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number) => [number, number, number];
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;

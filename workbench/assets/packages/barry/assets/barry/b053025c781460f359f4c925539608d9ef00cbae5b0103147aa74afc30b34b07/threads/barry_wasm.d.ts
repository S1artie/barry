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
 * Drain/close the explicitly provisioned threaded pool; do not free live lanes.
 */
export function closeThreadPool(): void;

export function initThreadPool(num_threads: number): Promise<any>;

/**
 * Install the common nonnegative epoch-millisecond origin before any calls.
 * Repeating the identical origin succeeds; a changed/invalid origin fails.
 */
export function initializeClock(origin: number): void;

/**
 * Provision the shared persistent pool outside scan clocks in threaded builds.
 * `participants` is an integer1..u32::MAX including the caller; core/browser
 * capacity validation may reject it. Helpers receive the same millisecond origin.
 */
export function initializeThreadPool(origin: number, participants: number): Promise<void>;

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

export class wbg_rayon_PoolBuilder {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    build(): void;
    mainJS(): string;
    numThreads(): number;
    receiver(): number;
}

export function wbg_rayon_start_worker(receiver: number): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly __wbg_wasmregiondecoder_free: (a: number, b: number) => void;
    readonly __wbg_wasmscanner_free: (a: number, b: number) => void;
    readonly __wbg_wbg_rayon_poolbuilder_free: (a: number, b: number) => void;
    readonly closeThreadPool: () => [number, number];
    readonly initThreadPool: (a: number) => any;
    readonly initializeClock: (a: number) => [number, number];
    readonly initializeThreadPool: (a: number, b: number) => any;
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
    readonly wbg_rayon_poolbuilder_build: (a: number) => void;
    readonly wbg_rayon_poolbuilder_mainJS: (a: number) => any;
    readonly wbg_rayon_poolbuilder_numThreads: (a: number) => number;
    readonly wbg_rayon_poolbuilder_receiver: (a: number) => number;
    readonly wbg_rayon_start_worker: (a: number) => void;
    readonly wasm_bindgen_ac160c7fd16679d4___convert__closures_____invoke___js_sys_cde4803b16aa7d81___Function_fn_wasm_bindgen_ac160c7fd16679d4___JsValue_____wasm_bindgen_ac160c7fd16679d4___sys__Undefined___js_sys_cde4803b16aa7d81___Function_fn_wasm_bindgen_ac160c7fd16679d4___JsValue_____wasm_bindgen_ac160c7fd16679d4___sys__Undefined_______true_: (a: number, b: number, c: any, d: any) => void;
    readonly wasm_bindgen_ac160c7fd16679d4___convert__closures_____invoke___wasm_bindgen_ac160c7fd16679d4___JsValue__core_4f05ee2f03ba470a___result__Result_____wasm_bindgen_ac160c7fd16679d4___JsError___true_: (a: number, b: number, c: any) => [number, number];
    readonly wasm_bindgen_ac160c7fd16679d4___convert__closures_____invoke___js_sys_cde4803b16aa7d81___futures__task__wait_async_polyfill__MessageEvent______true_: (a: number, b: number, c: any) => void;
    readonly wasm_bindgen_ac160c7fd16679d4___convert__closures_____invoke___wasm_bindgen_ac160c7fd16679d4___JsValue______true_: (a: number, b: number, c: any) => void;
    readonly memory: WebAssembly.Memory;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_destroy_closure: (a: number, b: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_thread_destroy: (a?: number, b?: number, c?: number) => void;
    readonly __wbindgen_start: (a: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput, memory?: WebAssembly.Memory, thread_stack_size?: number }} module - Passing `SyncInitInput` directly is deprecated.
 * @param {WebAssembly.Memory} memory - Deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput, memory?: WebAssembly.Memory, thread_stack_size?: number } | SyncInitInput, memory?: WebAssembly.Memory): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput>, memory?: WebAssembly.Memory, thread_stack_size?: number }} module_or_path - Passing `InitInput` directly is deprecated.
 * @param {WebAssembly.Memory} memory - Deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput>, memory?: WebAssembly.Memory, thread_stack_size?: number } | InitInput | Promise<InitInput>, memory?: WebAssembly.Memory): Promise<InitOutput>;

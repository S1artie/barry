var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// build/work/20261124T174216Z-91f8c3920e1b/wasm/threads/bindgen/barry_wasm.js
import { startWorkers } from "../thread-pool.mjs";

// build/work/20261124T174216Z-91f8c3920e1b/wasm/threads/bindgen/snippets/barry-9341e44569dd220e/inline1.js
var inline1_exports = {};
__export(inline1_exports, {
  barryEpochMilliseconds: () => barryEpochMilliseconds
});
var barryPerformance = globalThis.performance;
var barryRealmOrigin = barryPerformance.timeOrigin;
var barryPerformanceNow = barryPerformance.now.bind(barryPerformance);
function barryEpochMilliseconds() {
  return barryRealmOrigin + barryPerformanceNow();
}

// build/work/20261124T174216Z-91f8c3920e1b/wasm/threads/bindgen/snippets/barry-9341e44569dd220e/inline0.js
var inline0_exports = {};
__export(inline0_exports, {
  barry_dedicated_worker: () => barry_dedicated_worker,
  barry_thread_isolation: () => barry_thread_isolation
});
function barry_thread_isolation() {
  return globalThis.crossOriginIsolated === true && typeof SharedArrayBuffer === "function";
}
function barry_dedicated_worker() {
  return typeof DedicatedWorkerGlobalScope !== "undefined" && globalThis instanceof DedicatedWorkerGlobalScope;
}

// build/work/20261124T174216Z-91f8c3920e1b/wasm/threads/bindgen/snippets/barry-9341e44569dd220e/inline2.js
var inline2_exports = {};
__export(inline2_exports, {
  barry_observed_hardware_cpus: () => barry_observed_hardware_cpus
});
function barry_observed_hardware_cpus() {
  const value = globalThis.navigator?.hardwareConcurrency;
  return Number.isSafeInteger(value) && value > 0 && value <= 4294967295 ? value : 0;
}

// build/work/20261124T174216Z-91f8c3920e1b/wasm/threads/bindgen/barry_wasm.js
var WasmRegionDecoder = class {
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    WasmRegionDecoderFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_wasmregiondecoder_free(ptr, 0);
  }
  /**
   * Decode0..128 supplied quads against the uploaded original grayscale pixels.
   * Budget0=Unlimited, mask0=empty; started is original common-origin seconds.
   * No CNN runs and localization time is zero. Validation/decoding/conversion
   * share the entry clock; output bytes/geometry survive owner reuse/free.
   * @param {number} width
   * @param {number} height
   * @param {number} stride
   * @param {number} budget
   * @param {number} mask
   * @param {number} subtypes
   * @param {number} policy
   * @param {number} itf_subtypes
   * @param {number} itf_min_length
   * @param {number} itf_max_length
   * @param {number} qr_subtypes
   * @param {number} pdf417_subtypes
   * @param {number} databar_subtypes
   * @param {number} databar_read_linked_component
   * @param {any} supplied
   * @param {number} started
   * @returns {any}
   */
  decodeRegionsGray(width, height, stride, budget, mask, subtypes, policy, itf_subtypes, itf_min_length, itf_max_length, qr_subtypes, pdf417_subtypes, databar_subtypes, databar_read_linked_component, supplied, started) {
    const ret = wasm.wasmregiondecoder_decodeRegionsGray(this.__wbg_ptr, width, height, stride, budget, mask, subtypes, policy, itf_subtypes, itf_min_length, itf_max_length, qr_subtypes, pdf417_subtypes, databar_subtypes, databar_read_linked_component, supplied, started);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * Current accessible upload capacity in bytes, not retained result storage.
   * @returns {number}
   */
  get inputCapacity() {
    const ret = wasm.wasmregiondecoder_inputCapacity(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * Construct a decode owner outside clocks;0=Auto caller-inclusive allocation.
   * @param {number} participants
   */
  constructor(participants) {
    const ret = wasm.wasmregiondecoder_new(participants);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    this.__wbg_ptr = ret[0];
    WasmRegionDecoderFinalization.register(this, this.__wbg_ptr, this);
    return this;
  }
  /**
   * Reserve reusable upload bytes; returned offset/views expire on growth/free.
   * @param {number} required
   * @returns {number}
   */
  reserveInput(required) {
    const ret = wasm.wasmregiondecoder_reserveInput(this.__wbg_ptr, required);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] >>> 0;
  }
};
if (Symbol.dispose) WasmRegionDecoder.prototype[Symbol.dispose] = WasmRegionDecoder.prototype.free;
var WasmScanner = class {
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    WasmScannerFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_wasmscanner_free(ptr, 0);
  }
  /**
   * Localize uploaded pixels without treating unread geometry as decoded data.
   * Uses the same dimensions/options/common-origin timestamp as scanGray;
   * returns copied regions and actual completion/stop/time/allocation fields.
   * @param {number} width
   * @param {number} height
   * @param {number} stride
   * @param {number} budget
   * @param {number} mask
   * @param {number} subtypes
   * @param {number} policy
   * @param {number} itf_subtypes
   * @param {number} itf_min_length
   * @param {number} itf_max_length
   * @param {number} qr_subtypes
   * @param {number} pdf417_subtypes
   * @param {number} databar_subtypes
   * @param {number} databar_read_linked_component
   * @param {number} maximum
   * @param {number} started
   * @returns {any}
   */
  findRegionsGray(width, height, stride, budget, mask, subtypes, policy, itf_subtypes, itf_min_length, itf_max_length, qr_subtypes, pdf417_subtypes, databar_subtypes, databar_read_linked_component, maximum, started) {
    const ret = wasm.wasmscanner_findRegionsGray(this.__wbg_ptr, width, height, stride, budget, mask, subtypes, policy, itf_subtypes, itf_min_length, itf_max_length, qr_subtypes, pdf417_subtypes, databar_subtypes, databar_read_linked_component, maximum, started);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
  /**
   * Accessible upload capacity in bytes; not an image length or total workspace.
   * @returns {number}
   */
  get inputCapacity() {
    const ret = wasm.wasmscanner_inputCapacity(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * Construct outside call clocks;0 participants requests core Auto allocation.
   * Invalid/noninteger/out-of-capacity allocations return a JS exception.
   * @param {number} participants
   */
  constructor(participants) {
    const ret = wasm.wasmscanner_new(participants);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    this.__wbg_ptr = ret[0];
    WasmScannerFinalization.register(this, this.__wbg_ptr, this);
    return this;
  }
  /**
   * Reserve upload bytes, returning an offset valid until growth or owner free.
   * Refresh memory views after this call;0 is permitted, allocation may fail.
   * @param {number} required
   * @returns {number}
   */
  reserveInput(required) {
    const ret = wasm.wasmscanner_reserveInput(this.__wbg_ptr, required);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return ret[0] >>> 0;
  }
  /**
   * Scan uploaded pixels with native ownership and one original entry clock.
   * Dimensions/stride obey `image`; budget0=Unlimited, cap1..128, mask0=empty.
   * `started` is common-origin seconds captured before facade preparation.
   * Returns copied payload/geometry/metadata and real partial/elapsed state;
   * validation/core/JS conversion failures throw, never select another reader.
   * @param {number} width
   * @param {number} height
   * @param {number} stride
   * @param {number} budget
   * @param {number} mask
   * @param {number} subtypes
   * @param {number} policy
   * @param {number} itf_subtypes
   * @param {number} itf_min_length
   * @param {number} itf_max_length
   * @param {number} qr_subtypes
   * @param {number} pdf417_subtypes
   * @param {number} databar_subtypes
   * @param {number} databar_read_linked_component
   * @param {number} maximum
   * @param {number} started
   * @returns {any}
   */
  scanGray(width, height, stride, budget, mask, subtypes, policy, itf_subtypes, itf_min_length, itf_max_length, qr_subtypes, pdf417_subtypes, databar_subtypes, databar_read_linked_component, maximum, started) {
    const ret = wasm.wasmscanner_scanGray(this.__wbg_ptr, width, height, stride, budget, mask, subtypes, policy, itf_subtypes, itf_min_length, itf_max_length, qr_subtypes, pdf417_subtypes, databar_subtypes, databar_read_linked_component, maximum, started);
    if (ret[2]) {
      throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
  }
};
if (Symbol.dispose) WasmScanner.prototype[Symbol.dispose] = WasmScanner.prototype.free;
function closeThreadPool() {
  const ret = wasm.closeThreadPool();
  if (ret[1]) {
    throw takeFromExternrefTable0(ret[0]);
  }
}
function initThreadPool(num_threads) {
  const ret = wasm.initThreadPool(num_threads);
  return ret;
}
function initializeClock(origin) {
  const ret = wasm.initializeClock(origin);
  if (ret[1]) {
    throw takeFromExternrefTable0(ret[0]);
  }
}
function initializeThreadPool(origin, participants) {
  const ret = wasm.initializeThreadPool(origin, participants);
  return ret;
}
function optionsContractVersion() {
  const ret = wasm.optionsContractVersion();
  return ret >>> 0;
}
function ownerProfileProtocolVersion12() {
  const ret = wasm.ownerProfileProtocolVersion12();
  return ret >>> 0;
}
function supportedSymbologies() {
  const ret = wasm.supportedSymbologies();
  return ret >>> 0;
}
function wasmMemory() {
  const ret = wasm.wasmMemory();
  return ret;
}
var wbg_rayon_PoolBuilder = class _wbg_rayon_PoolBuilder {
  static __wrap(ptr) {
    const obj = Object.create(_wbg_rayon_PoolBuilder.prototype);
    obj.__wbg_ptr = ptr;
    wbg_rayon_PoolBuilderFinalization.register(obj, obj.__wbg_ptr, obj);
    return obj;
  }
  __destroy_into_raw() {
    const ptr = this.__wbg_ptr;
    this.__wbg_ptr = 0;
    wbg_rayon_PoolBuilderFinalization.unregister(this);
    return ptr;
  }
  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_wbg_rayon_poolbuilder_free(ptr, 0);
  }
  build() {
    wasm.wbg_rayon_poolbuilder_build(this.__wbg_ptr);
  }
  /**
   * @returns {string}
   */
  mainJS() {
    const ret = wasm.wbg_rayon_poolbuilder_mainJS(this.__wbg_ptr);
    return ret;
  }
  /**
   * @returns {number}
   */
  numThreads() {
    const ret = wasm.wbg_rayon_poolbuilder_numThreads(this.__wbg_ptr);
    return ret >>> 0;
  }
  /**
   * @returns {number}
   */
  receiver() {
    const ret = wasm.wbg_rayon_poolbuilder_receiver(this.__wbg_ptr);
    return ret >>> 0;
  }
};
if (Symbol.dispose) wbg_rayon_PoolBuilder.prototype[Symbol.dispose] = wbg_rayon_PoolBuilder.prototype.free;
function wbg_rayon_start_worker(receiver) {
  wasm.wbg_rayon_start_worker(receiver);
}
function __wbg_get_imports(memory) {
  const import0 = {
    __proto__: null,
    __wbg_Error_208446807d0d1e30: function(arg0, arg1) {
      const ret = Error(getStringFromWasm0(arg0, arg1));
      return ret;
    },
    __wbg___wbindgen_is_function_741ff2bb612836f5: function(arg0) {
      const ret = typeof arg0 === "function";
      return ret;
    },
    __wbg___wbindgen_is_null_c22311b1cc228e3a: function(arg0) {
      const ret = arg0 === null;
      return ret;
    },
    __wbg___wbindgen_is_object_8b968c3ab8e96595: function(arg0) {
      const val = arg0;
      const ret = typeof val === "object" && val !== null;
      return ret;
    },
    __wbg___wbindgen_is_undefined_be5b34249ff1fc15: function(arg0) {
      const ret = arg0 === void 0;
      return ret;
    },
    __wbg___wbindgen_memory_17a1178bc3328ea3: function() {
      const ret = wasm.memory;
      return ret;
    },
    __wbg___wbindgen_module_2e98e71e8e96b4ac: function() {
      const ret = wasmModule;
      return ret;
    },
    __wbg___wbindgen_number_get_934b640d0889af78: function(arg0, arg1) {
      const obj = arg1;
      const ret = typeof obj === "number" ? obj : void 0;
      getDataViewMemory0().setFloat64((arg0 >>> 0) + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
      getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, !isLikeNone(ret), true);
    },
    __wbg___wbindgen_rethrow_d953c34c2e20677f: function(arg0) {
      throw arg0;
    },
    __wbg___wbindgen_throw_4c88d8bf264fd984: function(arg0, arg1) {
      throw new Error(getStringFromWasm0(arg0, arg1));
    },
    __wbg__wbg_cb_unref_09736879a3f67559: function(arg0) {
      arg0._wbg_cb_unref();
    },
    __wbg_async_d07a488424b248e8: function(arg0) {
      const ret = arg0.async;
      return ret;
    },
    __wbg_buffer_0eaa216bac6b8749: function(arg0) {
      const ret = arg0.buffer;
      return ret;
    },
    __wbg_call_a410eb4b59ed5965: function() {
      return handleError(function(arg0, arg1, arg2) {
        const ret = arg0.call(arg1, arg2);
        return ret;
      }, arguments);
    },
    __wbg_data_6d94f1893c1a6f56: function(arg0) {
      const ret = arg0.data;
      return ret;
    },
    __wbg_get_2080c49015e35254: function() {
      return handleError(function(arg0, arg1) {
        const ret = Reflect.get(arg0, arg1);
        return ret;
      }, arguments);
    },
    __wbg_get_d7176cfb76d71114: function(arg0, arg1) {
      const ret = arg0[arg1 >>> 0];
      return ret;
    },
    __wbg_get_unchecked_e6325ad374eff861: function(arg0, arg1) {
      const ret = arg0[arg1 >>> 0];
      return ret;
    },
    __wbg_instanceof_Window_5cf453f5639aa1a2: function(arg0) {
      let result;
      try {
        result = arg0 instanceof Window;
      } catch (_) {
        result = false;
      }
      const ret = result;
      return ret;
    },
    __wbg_isArray_bcf1376d0d732d08: function(arg0) {
      const ret = Array.isArray(arg0);
      return ret;
    },
    __wbg_length_b03a0fabb109b1e9: function(arg0) {
      const ret = arg0.length;
      return ret;
    },
    __wbg_new_68957d2a912dfa0a: function(arg0) {
      const ret = new Int32Array(arg0);
      return ret;
    },
    __wbg_new_787b9fb330d55d78: function(arg0, arg1) {
      const ret = new Error(getStringFromWasm0(arg0, arg1));
      return ret;
    },
    __wbg_new_ba40181b3f24ac80: function(arg0, arg1) {
      try {
        var state0 = { a: arg0, b: arg1 };
        var cb0 = (arg02, arg12) => {
          const a = state0.a;
          state0.a = 0;
          try {
            return wasm_bindgen_ac160c7fd16679d4___convert__closures_____invoke___js_sys_cde4803b16aa7d81___Function_fn_wasm_bindgen_ac160c7fd16679d4___JsValue_____wasm_bindgen_ac160c7fd16679d4___sys__Undefined___js_sys_cde4803b16aa7d81___Function_fn_wasm_bindgen_ac160c7fd16679d4___JsValue_____wasm_bindgen_ac160c7fd16679d4___sys__Undefined_______true_(a, state0.b, arg02, arg12);
          } finally {
            state0.a = a;
          }
        };
        const ret = new Promise(cb0);
        return ret;
      } finally {
        state0.a = 0;
      }
    },
    __wbg_new_cd4348290afae586: function() {
      const ret = new Object();
      return ret;
    },
    __wbg_new_from_slice_b8daf545a41c6aa0: function(arg0, arg1) {
      const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
      return ret;
    },
    __wbg_new_typed_e09da9dae6ee5935: function(arg0, arg1) {
      try {
        var state0 = { a: arg0, b: arg1 };
        var cb0 = (arg02, arg12) => {
          const a = state0.a;
          state0.a = 0;
          try {
            return wasm_bindgen_ac160c7fd16679d4___convert__closures_____invoke___js_sys_cde4803b16aa7d81___Function_fn_wasm_bindgen_ac160c7fd16679d4___JsValue_____wasm_bindgen_ac160c7fd16679d4___sys__Undefined___js_sys_cde4803b16aa7d81___Function_fn_wasm_bindgen_ac160c7fd16679d4___JsValue_____wasm_bindgen_ac160c7fd16679d4___sys__Undefined_______true_(a, state0.b, arg02, arg12);
          } finally {
            state0.a = a;
          }
        };
        const ret = new Promise(cb0);
        return ret;
      } finally {
        state0.a = 0;
      }
    },
    __wbg_new_with_length_a3dc62dea6e2e158: function(arg0) {
      const ret = new Array(arg0 >>> 0);
      return ret;
    },
    __wbg_new_worker_ab40b804322ae831: function(arg0, arg1) {
      const ret = new Worker(getStringFromWasm0(arg0, arg1));
      return ret;
    },
    __wbg_of_4cc373bef1f715a4: function(arg0, arg1, arg2) {
      const ret = Array.of(arg0, arg1, arg2);
      return ret;
    },
    __wbg_postMessage_a8a190b3536a4954: function() {
      return handleError(function(arg0, arg1) {
        arg0.postMessage(arg1);
      }, arguments);
    },
    __wbg_queueMicrotask_1e8503a8a690f0a3: function(arg0) {
      const ret = arg0.queueMicrotask;
      return ret;
    },
    __wbg_queueMicrotask_4a1a4d8dd332373b: function(arg0) {
      queueMicrotask(arg0);
    },
    __wbg_resolve_dbf78ab4942478b0: function(arg0) {
      const ret = Promise.resolve(arg0);
      return ret;
    },
    __wbg_set_2793479888329cb6: function() {
      return handleError(function(arg0, arg1, arg2) {
        const ret = Reflect.set(arg0, arg1, arg2);
        return ret;
      }, arguments);
    },
    __wbg_set_d2d33b52458e984a: function(arg0, arg1, arg2) {
      arg0[arg1 >>> 0] = arg2;
    },
    __wbg_set_onmessage_2c118f9979657ab3: function(arg0, arg1) {
      arg0.onmessage = arg1;
    },
    __wbg_startWorkers_622cedd0d351664e: function(arg0, arg1, arg2) {
      const ret = startWorkers(arg0, arg1, wbg_rayon_PoolBuilder.__wrap(arg2));
      return ret;
    },
    __wbg_static_accessor_GLOBAL_THIS_003ee833af9699fc: function() {
      const ret = typeof globalThis === "undefined" ? void 0 : globalThis;
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    },
    __wbg_static_accessor_GLOBAL_e4293fb22cbe77da: function() {
      const ret = typeof global === "undefined" ? void 0 : global;
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    },
    __wbg_static_accessor_SELF_53bb20457401453d: function() {
      const ret = typeof self === "undefined" ? void 0 : self;
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    },
    __wbg_static_accessor_URL_fac851ed3060f4eb: function() {
      const ret = import.meta.url;
      return ret;
    },
    __wbg_static_accessor_WINDOW_b5e0810bfecb7feb: function() {
      const ret = typeof window === "undefined" ? void 0 : window;
      return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    },
    __wbg_then_3a4f899454bcf8c9: function(arg0, arg1) {
      const ret = arg0.then(arg1);
      return ret;
    },
    __wbg_then_656f253a5dd7d8ea: function(arg0, arg1, arg2) {
      const ret = arg0.then(arg1, arg2);
      return ret;
    },
    __wbg_then_e3f7f2d365708be8: function(arg0, arg1) {
      const ret = arg0.then(arg1);
      return ret;
    },
    __wbg_value_bfe4d7d3c9cebaa6: function(arg0) {
      const ret = arg0.value;
      return ret;
    },
    __wbg_waitAsync_44d21aa5306efd6b: function() {
      const ret = Atomics.waitAsync;
      return ret;
    },
    __wbg_waitAsync_8fcbe0cb448a7f98: function(arg0, arg1, arg2) {
      const ret = Atomics.waitAsync(arg0, arg1 >>> 0, arg2);
      return ret;
    },
    __wbindgen_generic_0000000000000001: function(arg0, arg1) {
      const ret = makeMutClosure(arg0, arg1, wasm_bindgen_ac160c7fd16679d4___convert__closures_____invoke___wasm_bindgen_ac160c7fd16679d4___JsValue__core_4f05ee2f03ba470a___result__Result_____wasm_bindgen_ac160c7fd16679d4___JsError___true_);
      return ret;
    },
    __wbindgen_generic_0000000000000002: function(arg0, arg1) {
      const ret = makeMutClosure(arg0, arg1, wasm_bindgen_ac160c7fd16679d4___convert__closures_____invoke___js_sys_cde4803b16aa7d81___futures__task__wait_async_polyfill__MessageEvent______true_);
      return ret;
    },
    __wbindgen_generic_0000000000000003: function(arg0, arg1) {
      const ret = makeMutClosure(arg0, arg1, wasm_bindgen_ac160c7fd16679d4___convert__closures_____invoke___wasm_bindgen_ac160c7fd16679d4___JsValue______true_);
      return ret;
    },
    __wbindgen_generic_0000000000000004: function(arg0) {
      const ret = arg0;
      return ret;
    },
    __wbindgen_generic_0000000000000005: function(arg0, arg1) {
      const ret = getStringFromWasm0(arg0, arg1);
      return ret;
    },
    __wbindgen_init_externref_table: function() {
      const table = wasm.__wbindgen_externrefs;
      table.set(0, void 0);
      table.set(1024, void 0);
      table.set(1025, null);
      table.set(1026, true);
      table.set(1027, false);
    },
    __wbindgen_link_bdfdbb5f216b9442: function(arg0) {
      const val = `onmessage = function (ev) {
                let [ia, index, value] = ev.data;
                ia = new Int32Array(ia.buffer);
                let result = Atomics.wait(ia, index, value);
                postMessage(result);
            };
            `;
      const ret = typeof URL.createObjectURL === "undefined" ? "data:application/javascript," + encodeURIComponent(val) : URL.createObjectURL(new Blob([val], { type: "text/javascript" }));
      const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
      const len1 = WASM_VECTOR_LEN;
      getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
      getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
    },
    memory: memory || new WebAssembly.Memory({ initial: 38, maximum: 65536, shared: true })
  };
  return {
    __proto__: null,
    "./barry_wasm_bg.js": import0,
    "./snippets/barry-9341e44569dd220e/inline1.js": inline1_exports,
    "./snippets/barry-9341e44569dd220e/inline0.js": inline0_exports,
    "./snippets/barry-9341e44569dd220e/inline0.js": inline0_exports,
    "./snippets/barry-9341e44569dd220e/inline2.js": inline2_exports
  };
}
function wasm_bindgen_ac160c7fd16679d4___convert__closures_____invoke___js_sys_cde4803b16aa7d81___futures__task__wait_async_polyfill__MessageEvent______true_(arg0, arg1, arg2) {
  wasm.wasm_bindgen_ac160c7fd16679d4___convert__closures_____invoke___js_sys_cde4803b16aa7d81___futures__task__wait_async_polyfill__MessageEvent______true_(arg0, arg1, arg2);
}
function wasm_bindgen_ac160c7fd16679d4___convert__closures_____invoke___wasm_bindgen_ac160c7fd16679d4___JsValue______true_(arg0, arg1, arg2) {
  wasm.wasm_bindgen_ac160c7fd16679d4___convert__closures_____invoke___wasm_bindgen_ac160c7fd16679d4___JsValue______true_(arg0, arg1, arg2);
}
function wasm_bindgen_ac160c7fd16679d4___convert__closures_____invoke___wasm_bindgen_ac160c7fd16679d4___JsValue__core_4f05ee2f03ba470a___result__Result_____wasm_bindgen_ac160c7fd16679d4___JsError___true_(arg0, arg1, arg2) {
  const ret = wasm.wasm_bindgen_ac160c7fd16679d4___convert__closures_____invoke___wasm_bindgen_ac160c7fd16679d4___JsValue__core_4f05ee2f03ba470a___result__Result_____wasm_bindgen_ac160c7fd16679d4___JsError___true_(arg0, arg1, arg2);
  if (ret[1]) {
    throw takeFromExternrefTable0(ret[0]);
  }
}
function wasm_bindgen_ac160c7fd16679d4___convert__closures_____invoke___js_sys_cde4803b16aa7d81___Function_fn_wasm_bindgen_ac160c7fd16679d4___JsValue_____wasm_bindgen_ac160c7fd16679d4___sys__Undefined___js_sys_cde4803b16aa7d81___Function_fn_wasm_bindgen_ac160c7fd16679d4___JsValue_____wasm_bindgen_ac160c7fd16679d4___sys__Undefined_______true_(arg0, arg1, arg2, arg3) {
  wasm.wasm_bindgen_ac160c7fd16679d4___convert__closures_____invoke___js_sys_cde4803b16aa7d81___Function_fn_wasm_bindgen_ac160c7fd16679d4___JsValue_____wasm_bindgen_ac160c7fd16679d4___sys__Undefined___js_sys_cde4803b16aa7d81___Function_fn_wasm_bindgen_ac160c7fd16679d4___JsValue_____wasm_bindgen_ac160c7fd16679d4___sys__Undefined_______true_(arg0, arg1, arg2, arg3);
}
var WasmRegionDecoderFinalization = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((ptr) => wasm.__wbg_wasmregiondecoder_free(ptr, 1));
var WasmScannerFinalization = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((ptr) => wasm.__wbg_wasmscanner_free(ptr, 1));
var wbg_rayon_PoolBuilderFinalization = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((ptr) => wasm.__wbg_wbg_rayon_poolbuilder_free(ptr, 1));
function addToExternrefTable0(obj) {
  const idx = wasm.__externref_table_alloc();
  wasm.__wbindgen_externrefs.set(idx, obj);
  return idx;
}
var CLOSURE_DTORS = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((state) => wasm.__wbindgen_destroy_closure(state.a, state.b));
function getArrayU8FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}
var cachedDataViewMemory0 = null;
function getDataViewMemory0() {
  if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer !== wasm.memory.buffer) {
    cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
  }
  return cachedDataViewMemory0;
}
function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return decodeText(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}
var cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
  if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.buffer !== wasm.memory.buffer) {
    cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8ArrayMemory0;
}
function handleError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    const idx = addToExternrefTable0(e);
    wasm.__wbindgen_exn_store(idx);
  }
}
function isLikeNone(x) {
  return x === void 0 || x === null;
}
function makeMutClosure(arg0, arg1, f) {
  const state = { a: arg0, b: arg1, cnt: 1 };
  const real = (...args) => {
    state.cnt++;
    const a = state.a;
    state.a = 0;
    try {
      return f(a, state.b, ...args);
    } finally {
      state.a = a;
      real._wbg_cb_unref();
    }
  };
  real._wbg_cb_unref = () => {
    if (--state.cnt === 0) {
      wasm.__wbindgen_destroy_closure(state.a, state.b);
      state.a = 0;
      CLOSURE_DTORS.unregister(state);
    }
  };
  CLOSURE_DTORS.register(real, state, state);
  return real;
}
function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === void 0) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr2 = malloc(buf.length, 1) >>> 0;
    getUint8ArrayMemory0().subarray(ptr2, ptr2 + buf.length).set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr2;
  }
  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;
  const mem = getUint8ArrayMemory0();
  let offset = 0;
  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 127) break;
    mem[ptr + offset] = code;
  }
  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
    const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
    const ret = cachedTextEncoder.encodeInto(arg, view);
    offset += ret.written;
    ptr = realloc(ptr, len, offset, 1) >>> 0;
  }
  WASM_VECTOR_LEN = offset;
  return ptr;
}
function takeFromExternrefTable0(idx) {
  const value = wasm.__wbindgen_externrefs.get(idx);
  wasm.__externref_table_dealloc(idx);
  return value;
}
var cachedTextDecoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-8", { ignoreBOM: true }) : void 0;
if (cachedTextDecoder) cachedTextDecoder.decode();
var MAX_SAFARI_DECODE_BYTES = 2146435072;
var numBytesDecoded = 0;
function decodeText(bytes) {
  numBytesDecoded += bytes.length;
  if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
    cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true });
    cachedTextDecoder.decode();
    numBytesDecoded = bytes.length;
  }
  return cachedTextDecoder.decode(bytes.slice());
}
var cachedTextEncoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : void 0;
if (cachedTextEncoder) {
  cachedTextEncoder.encodeInto = function(arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
      read: arg.length,
      written: buf.length
    };
  };
}
var WASM_VECTOR_LEN = 0;
var wasmModule;
var wasmInstance;
var wasm;
function __wbg_finalize_init(instance, module, thread_stack_size) {
  wasmInstance = instance;
  wasm = instance.exports;
  wasmModule = module;
  cachedDataViewMemory0 = null;
  cachedUint8ArrayMemory0 = null;
  if (typeof thread_stack_size !== "undefined" && (typeof thread_stack_size !== "number" || thread_stack_size === 0 || thread_stack_size % 65536 !== 0)) {
    throw new Error("invalid stack size");
  }
  wasm.__wbindgen_start(thread_stack_size);
  return wasm;
}
async function __wbg_load(module, imports) {
  if (typeof Response === "function" && module instanceof Response) {
    if (!module.ok) {
      throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
    }
    if (typeof WebAssembly.instantiateStreaming === "function") {
      try {
        return await WebAssembly.instantiateStreaming(module, imports);
      } catch (e) {
        const validResponse = expectedResponseType(module.type);
        if (validResponse && module.headers.get("Content-Type") !== "application/wasm") {
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
        } else {
          throw e;
        }
      }
    }
    const bytes = await module.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
  } else {
    const instance = await WebAssembly.instantiate(module, imports);
    if (instance instanceof WebAssembly.Instance) {
      return { instance, module };
    } else {
      return instance;
    }
  }
  function expectedResponseType(type) {
    switch (type) {
      case "basic":
      case "cors":
      case "default":
        return true;
    }
    return false;
  }
}
function initSync(module, memory) {
  if (wasm !== void 0) return wasm;
  let thread_stack_size;
  if (module !== void 0) {
    if (Object.getPrototypeOf(module) === Object.prototype) {
      ({ module, memory, thread_stack_size } = module);
    } else {
      console.warn("using deprecated parameters for `initSync()`; pass a single object instead");
    }
  }
  const imports = __wbg_get_imports(memory);
  if (!(module instanceof WebAssembly.Module)) {
    module = new WebAssembly.Module(module);
  }
  const instance = new WebAssembly.Instance(module, imports);
  return __wbg_finalize_init(instance, module, thread_stack_size);
}
var __wbg_init_promise;
async function __wbg_init(module_or_path, memory) {
  if (wasm !== void 0) return wasm;
  if (__wbg_init_promise === void 0) {
    __wbg_init_promise = __wbg_init_once(module_or_path, memory);
    __wbg_init_promise.catch(() => {
      __wbg_init_promise = void 0;
    });
  }
  return __wbg_init_promise;
}
async function __wbg_init_once(module_or_path, memory) {
  let thread_stack_size;
  if (module_or_path !== void 0) {
    if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
      ({ module_or_path, memory, thread_stack_size } = module_or_path);
    } else {
      console.warn("using deprecated parameters for the initialization function; pass a single object instead");
    }
  }
  if (module_or_path === void 0) {
    module_or_path = new URL("barry_wasm_bg.wasm", import.meta.url);
  }
  const imports = __wbg_get_imports(memory);
  if (typeof module_or_path === "string" || typeof Request === "function" && module_or_path instanceof Request || typeof URL === "function" && module_or_path instanceof URL) {
    module_or_path = fetch(module_or_path);
  }
  const { instance, module } = await __wbg_load(await module_or_path, imports);
  return __wbg_finalize_init(instance, module, thread_stack_size);
}
export {
  WasmRegionDecoder,
  WasmScanner,
  closeThreadPool,
  __wbg_init as default,
  initSync,
  initThreadPool,
  initializeClock,
  initializeThreadPool,
  optionsContractVersion,
  ownerProfileProtocolVersion12,
  supportedSymbologies,
  wasmMemory,
  wbg_rayon_PoolBuilder,
  wbg_rayon_start_worker
};

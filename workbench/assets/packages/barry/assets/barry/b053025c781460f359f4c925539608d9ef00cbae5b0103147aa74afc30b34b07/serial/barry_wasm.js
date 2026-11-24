var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// build/work/20261124T174216Z-91f8c3920e1b/wasm/serial/bindgen/snippets/barry-9341e44569dd220e/inline0.js
var inline0_exports = {};
__export(inline0_exports, {
  barryEpochMilliseconds: () => barryEpochMilliseconds
});
var barryPerformance = globalThis.performance;
var barryRealmOrigin = barryPerformance.timeOrigin;
var barryPerformanceNow = barryPerformance.now.bind(barryPerformance);
function barryEpochMilliseconds() {
  return barryRealmOrigin + barryPerformanceNow();
}

// build/work/20261124T174216Z-91f8c3920e1b/wasm/serial/bindgen/snippets/barry-9341e44569dd220e/inline1.js
var inline1_exports = {};
__export(inline1_exports, {
  barry_observed_hardware_cpus: () => barry_observed_hardware_cpus
});
function barry_observed_hardware_cpus() {
  const value = globalThis.navigator?.hardwareConcurrency;
  return Number.isSafeInteger(value) && value > 0 && value <= 4294967295 ? value : 0;
}

// build/work/20261124T174216Z-91f8c3920e1b/wasm/serial/bindgen/barry_wasm.js
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
function initializeClock(origin) {
  const ret = wasm.initializeClock(origin);
  if (ret[1]) {
    throw takeFromExternrefTable0(ret[0]);
  }
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
function __wbg_get_imports() {
  const import0 = {
    __proto__: null,
    __wbg___wbindgen_is_null_c22311b1cc228e3a: function(arg0) {
      const ret = arg0 === null;
      return ret;
    },
    __wbg___wbindgen_is_object_8b968c3ab8e96595: function(arg0) {
      const val = arg0;
      const ret = typeof val === "object" && val !== null;
      return ret;
    },
    __wbg___wbindgen_memory_17a1178bc3328ea3: function() {
      const ret = wasm.memory;
      return ret;
    },
    __wbg___wbindgen_number_get_934b640d0889af78: function(arg0, arg1) {
      const obj = arg1;
      const ret = typeof obj === "number" ? obj : void 0;
      getDataViewMemory0().setFloat64((arg0 >>> 0) + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
      getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, !isLikeNone(ret), true);
    },
    __wbg___wbindgen_throw_4c88d8bf264fd984: function(arg0, arg1) {
      throw new Error(getStringFromWasm0(arg0, arg1));
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
    __wbg_isArray_bcf1376d0d732d08: function(arg0) {
      const ret = Array.isArray(arg0);
      return ret;
    },
    __wbg_length_b03a0fabb109b1e9: function(arg0) {
      const ret = arg0.length;
      return ret;
    },
    __wbg_new_787b9fb330d55d78: function(arg0, arg1) {
      const ret = new Error(getStringFromWasm0(arg0, arg1));
      return ret;
    },
    __wbg_new_cd4348290afae586: function() {
      const ret = new Object();
      return ret;
    },
    __wbg_new_from_slice_b8daf545a41c6aa0: function(arg0, arg1) {
      const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
      return ret;
    },
    __wbg_new_with_length_a3dc62dea6e2e158: function(arg0) {
      const ret = new Array(arg0 >>> 0);
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
    __wbindgen_generic_0000000000000001: function(arg0) {
      const ret = arg0;
      return ret;
    },
    __wbindgen_generic_0000000000000002: function(arg0, arg1) {
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
    }
  };
  return {
    __proto__: null,
    "./barry_wasm_bg.js": import0,
    "./snippets/barry-9341e44569dd220e/inline0.js": inline0_exports,
    "./snippets/barry-9341e44569dd220e/inline1.js": inline1_exports
  };
}
var WasmRegionDecoderFinalization = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((ptr) => wasm.__wbg_wasmregiondecoder_free(ptr, 1));
var WasmScannerFinalization = typeof FinalizationRegistry === "undefined" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((ptr) => wasm.__wbg_wasmscanner_free(ptr, 1));
function addToExternrefTable0(obj) {
  const idx = wasm.__externref_table_alloc();
  wasm.__wbindgen_externrefs.set(idx, obj);
  return idx;
}
function getArrayU8FromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}
var cachedDataViewMemory0 = null;
function getDataViewMemory0() {
  if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || cachedDataViewMemory0.buffer.detached === void 0 && cachedDataViewMemory0.buffer !== wasm.memory.buffer) {
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
  if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
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
function takeFromExternrefTable0(idx) {
  const value = wasm.__wbindgen_externrefs.get(idx);
  wasm.__externref_table_dealloc(idx);
  return value;
}
var cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true });
cachedTextDecoder.decode();
var MAX_SAFARI_DECODE_BYTES = 2146435072;
var numBytesDecoded = 0;
function decodeText(bytes) {
  numBytesDecoded += bytes.length;
  if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
    cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true });
    cachedTextDecoder.decode();
    numBytesDecoded = bytes.length;
  }
  return cachedTextDecoder.decode(bytes);
}
var wasmModule;
var wasmInstance;
var wasm;
function __wbg_finalize_init(instance, module) {
  wasmInstance = instance;
  wasm = instance.exports;
  wasmModule = module;
  cachedDataViewMemory0 = null;
  cachedUint8ArrayMemory0 = null;
  wasm.__wbindgen_start();
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
function initSync(module) {
  if (wasm !== void 0) return wasm;
  if (module !== void 0) {
    if (Object.getPrototypeOf(module) === Object.prototype) {
      ({ module } = module);
    } else {
      console.warn("using deprecated parameters for `initSync()`; pass a single object instead");
    }
  }
  const imports = __wbg_get_imports();
  if (!(module instanceof WebAssembly.Module)) {
    module = new WebAssembly.Module(module);
  }
  const instance = new WebAssembly.Instance(module, imports);
  return __wbg_finalize_init(instance, module);
}
var __wbg_init_promise;
async function __wbg_init(module_or_path) {
  if (wasm !== void 0) return wasm;
  if (__wbg_init_promise === void 0) {
    __wbg_init_promise = __wbg_init_once(module_or_path);
    __wbg_init_promise.catch(() => {
      __wbg_init_promise = void 0;
    });
  }
  return __wbg_init_promise;
}
async function __wbg_init_once(module_or_path) {
  if (module_or_path !== void 0) {
    if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
      ({ module_or_path } = module_or_path);
    } else {
      console.warn("using deprecated parameters for the initialization function; pass a single object instead");
    }
  }
  if (module_or_path === void 0) {
    module_or_path = new URL("barry_wasm_bg.wasm", import.meta.url);
  }
  const imports = __wbg_get_imports();
  if (typeof module_or_path === "string" || typeof Request === "function" && module_or_path instanceof Request || typeof URL === "function" && module_or_path instanceof URL) {
    module_or_path = fetch(module_or_path);
  }
  const { instance, module } = await __wbg_load(await module_or_path, imports);
  return __wbg_finalize_init(instance, module);
}
export {
  WasmRegionDecoder,
  WasmScanner,
  __wbg_init as default,
  initSync,
  initializeClock,
  optionsContractVersion,
  ownerProfileProtocolVersion12,
  supportedSymbologies,
  wasmMemory
};

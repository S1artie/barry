// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string'], importedStringConstants: ''};
  return new CompiledApp(
      await _compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string'], importedStringConstants: ''};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

let _isCompileStreamingSupported;
async function _compileStreaming(source, builtins) {
  _isCompileStreamingSupported ??= WebAssembly.compileStreaming(
    new Response(
      new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,2,23,1,14,119,97,115,109,58,106,115,45,115,116,114,105,110,103,4,99,97,115,116,0,0]),
      {headers: {'Content-Type': 'application/wasm'}},
    ),
    builtins,
  ).then(() => false, (e) => e instanceof WebAssembly.CompileError);
  if (await _isCompileStreamingSupported) {
    return WebAssembly.compileStreaming(source, builtins);
  }
  return WebAssembly.compile(await (await source).arrayBuffer(), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      AC: (t, s) => t.set(s),
      AD: (x0,x1) => x0.go(x1),
      AE: () => globalThis.window.flutterConfiguration,
      AF: (x0,x1) => { x0.method = x1 },
      AG: x0 => globalThis.parseFloat(x0),
      AH: x0 => x0.clientWidth,
      AI: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      AJ: x0 => x0.kind,
      AK: (x0,x1) => x0.classifyBarryError(x1),
      AL: x0 => x0.sequenceIndex,
      AM: x0 => x0.sequenceCount,
      AN: x0 => x0.id,
      AO: x0 => x0.getReader(),
      B: s => printToConsole(s),
      BB: Function.prototype.call.bind(String.prototype.toLowerCase),
      BC: Function.prototype.call.bind(DataView.prototype.setFloat32),
      BD: (x0,x1) => x0.append(x1),
      BE: (x0,x1) => x0.attachShadow(x1),
      BF: (x0,x1) => { x0.noValidate = x1 },
      BG: (x0,x1) => x0.getComputedStyle(x1),
      BH: x0 => x0.innerWidth,
      BI: (a, s, e) => a.slice(s, e),
      BJ: x0 => x0.navigator,
      BK: x0 => ({budgetMs: x0}),
      BL: x0 => x0.eciControls,
      BM: x0 => x0.sequenceIndex,
      BN: x0 => x0.offsetHeight,
      BO: x0 => x0.value,
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: (o, p, r) => o.replaceAll(p, () => r),
      CC: Function.prototype.call.bind(DataView.prototype.getFloat32),
      CD: (x0,x1) => { x0.textContent = x1 },
      CE: x0 => x0.preventDefault(),
      CF: x0 => x0.isConnected,
      CG: x0 => x0.documentElement,
      CH: (x0,x1) => x0.removeChild(x1),
      CI: x0 => x0.close(),
      CJ: x0 => x0.isSecureContext,
      CK: x0 => ({corners: x0}),
      CL: x0 => x0.secondaryCorrectedCodewords,
      CM: x0 => x0.applicationIndicator,
      CN: x0 => x0.offsetWidth,
      CO: x0 => x0.done,
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: (x0,x1) => x0[x1],
      DC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      DD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      DE: (x0,x1) => x0.contains(x1),
      DF: x0 => x0.click(),
      DG: x0 => x0.computedStyleMap(),
      DH: x0 => x0.firstChild,
      DI: x0 => x0.height,
      DJ: () => globalThis.window,
      DK: (x0,x1,x2,x3,x4,x5,x6,x7,x8) => x0.submitFlutterRequest(x1,x2,x3,x4,x5,x6,x7,x8),
      DL: x0 => x0.primaryCorrectedCodewords,
      DM: x0 => x0.fnc1,
      DN: x0 => x0.stopPropagation(),
      DO: x0 => x0.read(),
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: x0 => x0.length,
      EC: Function.prototype.call.bind(DataView.prototype.getUint32),
      ED: x0 => x0.parentElement,
      EE: (x0,x1) => x0.focus(x1),
      EF: (x0,x1) => x0.getElementsByClassName(x1),
      EG: (x0,x1) => x0.get(x1),
      EH: x0 => x0.viewConstraints,
      EI: x0 => x0.width,
      EJ: x0 => x0.message,
      EK: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9) => x0.submitFlutterRequest(x1,x2,x3,x4,x5,x6,x7,x8,x9),
      EL: x0 => x0.serviceClass,
      EM: x0 => x0.correctedCodewords,
      EN: x0 => x0.disabled,
      EO: x0 => x0.body,
      F: () => new Error().stack,
      FB: o => o,
      FC: Function.prototype.call.bind(DataView.prototype.setUint32),
      FD: (x0,x1) => x0.querySelectorAll(x1),
      FE: (x0,x1) => x0.closest(x1),
      FF: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      FG: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      FH: x0 => x0.hostElement,
      FI: (x0,x1,x2,x3,x4,x5) => x0.createImageBitmap(x1,x2,x3,x4,x5),
      FJ: x0 => x0.name,
      FK: x0 => x0.peakParticipants,
      FL: x0 => x0.countryCode,
      FM: x0 => x0.mask,
      FN: (x0,x1) => { x0.min = x1 },
      FO: (x0,x1) => new OffscreenCanvas(x0,x1),
      G: s => JSON.stringify(s),
      GB: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      GC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      GD: x0 => x0.length,
      GE: (x0,x1) => x0.getAttribute(x1),
      GF: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      GG: x0 => x0.matches,
      GH: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      GI: (x0,x1) => x0.createImageBitmap(x1),
      GJ: (x0,x1) => x0.cancelVideoFrameCallback(x1),
      GK: x0 => x0.participantsUsed,
      GL: x0 => x0.postalCode,
      GM: x0 => x0.errorCorrection,
      GN: (x0,x1) => { x0.max = x1 },
      GO: x0 => x0.assetBase,
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: (x0,x1) => x0.exec(x1),
      HC: Function.prototype.call.bind(DataView.prototype.getInt32),
      HD: (x0,x1) => x0.item(x1),
      HE: x0 => x0.activeElement,
      HF: (x0,x1) => x0.contains(x1),
      HG: (x0,x1) => x0.matchMedia(x1),
      HH: x0 => ({runApp: x0}),
      HI: x0 => new Blob(x0),
      HJ: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      HK: x0 => x0.poolHelpers,
      HL: x0 => x0.mode,
      HM: x0 => x0.version,
      HN: (x0,x1) => { x0.disabled = x1 },
      HO: x0 => x0.loader,
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: x0 => x0.flags,
      IC: Function.prototype.call.bind(DataView.prototype.setInt32),
      ID: x0 => x0.userAgent,
      IE: (x0,x1) => x0.add(x1),
      IF: (s) => +s,
      IG: x0 => x0.matches,
      IH: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      II: x0 => x0.close(),
      IJ: x0 => x0.pause(),
      IK: x0 => x0.participantLimit,
      IL: x0 => x0.maxicodeInfo,
      IM: x0 => x0.subtype,
      IN: (x0,x1) => { x0.scrollLeft = x1 },
      IO: () => globalThis._flutter,
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      JC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      JD: x0 => x0.maxTouchPoints,
      JE: x0 => x0.classList,
      JF: x0 => x0.target,
      JG: x0 => x0.timeStamp,
      JH: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      JI: x0 => x0.naturalHeight,
      JJ: x0 => x0.remove(),
      JK: x0 => x0.availableCpus,
      JL: x0 => x0.sequenceIdBytes,
      JM: x0 => x0.qrInfo,
      JN: (x0,x1) => { x0.spellcheck = x1 },
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: o => o instanceof RegExp,
      KC: o => o instanceof Uint16Array,
      KD: x0 => x0.platform,
      KE: x0 => x0.data,
      KF: (x0,x1) => x0.dispatchEvent(x1),
      KG: (x0,x1) => x0.hasAttribute(x1),
      KH: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      KI: x0 => x0.naturalWidth,
      KJ: x0 => x0.stop(),
      KK: x0 => x0.execution,
      KL: x0 => x0.sequenceCount,
      KM: x0 => x0.symbology,
      KN: (x0,x1) => { x0.disabled = x1 },
      L: o => o === undefined,
      LB: s => s.trim(),
      LC: Function.prototype.call.bind(DataView.prototype.getUint16),
      LD: x0 => x0.navigator,
      LE: x0 => x0.scrollTop,
      LF: (x0,x1) => x0.createEvent(x1),
      LG: x0 => x0.type,
      LH: () => typeof dartUseDateNowForTicks !== "undefined",
      LI: (x0,x1) => { x0.src = x1 },
      LJ: (x0,x1) => { x0.height = x1 },
      LK: x0 => x0.localizationMs,
      LL: x0 => x0.sequenceIndex,
      LM: x0 => x0.barcodes,
      LN: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9) => x0.drawImage(x1,x2,x3,x4,x5,x6,x7,x8,x9),
      M: o => String(o),
      MB: (a, s) => a.join(s),
      MC: Function.prototype.call.bind(DataView.prototype.setUint16),
      MD: s => new Date(s * 1000).getTimezoneOffset() * 60,
      ME: (handle) => clearTimeout(handle),
      MF: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      MG: (x0,x1) => x0.getModifierState(x1),
      MH: () => Date.now(),
      MI: x0 => x0.displayHeight,
      MJ: (x0,x1) => { x0.width = x1 },
      MK: x0 => x0.stopReason,
      ML: x0 => x0.readerInitialization,
      MM: x0 => x0.regions,
      MN: (x0,x1) => x0.getContext(x1),
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: x0 => x0.random(),
      NC: o => o instanceof Int16Array,
      ND: Date.now,
      NE: (x0,x1) => x0.removeAttribute(x1),
      NF: x0 => x0.readText(),
      NG: x0 => x0.buttons,
      NH: () => 1000 * performance.now(),
      NI: x0 => x0.displayWidth,
      NJ: (x0,x1) => { x0.srcObject = x1 },
      NK: x0 => x0.fitError,
      NL: x0 => x0.gs1,
      NM: (x0,x1) => { x0.symbologies = x1 },
      NN: (x0,x1) => { x0.height = x1 },
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: () => globalThis.Math,
      OC: Function.prototype.call.bind(DataView.prototype.getInt16),
      OD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      OE: (x0,x1) => { x0.value = x1 },
      OF: x0 => x0.clipboard,
      OG: x0 => x0.ctrlKey,
      OH: x0 => new Uint8Array(x0),
      OI: x0 => x0.duration,
      OJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      OK: x0 => x0.scanlines,
      OL: x0 => x0.eciControls,
      OM: x0 => ({enabled: x0}),
      ON: (x0,x1) => { x0.width = x1 },
      P: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PB: (x0,x1) => x0.error(x1),
      PC: Function.prototype.call.bind(DataView.prototype.setInt16),
      PD: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      PE: (x0,x1) => { x0.value = x1 },
      PF: (x0,x1) => x0.writeText(x1),
      PG: x0 => x0.getBoundingClientRect(),
      PH: (x0,x1,x2) => x0.slice(x1,x2),
      PI: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      PJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PK: x0 => x0.votes,
      PL: x0 => x0.modeCorrectedCodewords,
      PM: x0 => ({supplement: x0}),
      PN: (x0,x1) => x0.transferFromImageBitmap(x1),
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: () => globalThis.console,
      QC: o => o instanceof Uint8ClampedArray,
      QD: x0 => x0.style,
      QE: x0 => x0.value,
      QF: x0 => x0.unlock(),
      QG: x0 => x0.y,
      QH: (x0,x1) => x0.decode(x1),
      QI: (x0,x1) => x0.decode(x1),
      QJ: x0 => x0.hidden,
      QK: x0 => x0.text,
      QL: x0 => x0.correctedCodewords,
      QM: x0 => ({minLength: x0}),
      QN: x0 => x0.rasterEndMilliseconds,
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: s => s.trimRight(),
      RC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      RD: (x0,x1) => x0.createElement(x1),
      RE: x0 => x0.selectionDirection,
      RF: (x0,x1) => x0.lock(x1),
      RG: x0 => x0.x,
      RH: (x0,x1) => x0.adoptText(x1),
      RI: x0 => x0.image,
      RJ: x0 => x0.type,
      RK: x0 => x0.bottom,
      RL: x0 => x0.dataCodewords,
      RM: x0 => ({readLinkedComponent: x0}),
      RN: x0 => x0.rasterStartMilliseconds,
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      SC: Function.prototype.call.bind(DataView.prototype.setInt8),
      SD: x0 => x0.body,
      SE: x0 => x0.selectionStart,
      SF: x0 => x0.orientation,
      SG: x0 => x0.top,
      SH: x0 => x0.first(),
      SI: x0 => x0.close(),
      SJ: (x0,x1,x2) => x0.addEventListener(x1,x2),
      SK: x0 => x0.right,
      SL: x0 => x0.layers,
      SM: (x0,x1) => { x0.dataBar = x1 },
      SN: x0 => x0.imageBitmaps,
      T: x0 => new Promise(x0),
      TB: () => ({}),
      TC: Function.prototype.call.bind(DataView.prototype.getInt8),
      TD: x0 => x0.remove(),
      TE: x0 => x0.selectionEnd,
      TF: (x0,x1) => x0.querySelector(x1),
      TG: x0 => x0.left,
      TH: x0 => x0.next(),
      TI: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      TJ: x0 => ({exact: x0}),
      TK: x0 => x0.top,
      TL: x0 => x0.compact,
      TM: (x0,x1) => { x0.subtypes = x1 },
      TN: x0 => x0.canvasKitMaximumSurfaces,
      U: (x0,x1,x2) => x0.call(x1,x2),
      UB: (o, p, v) => o[p] = v,
      UC: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      UD: (x0,x1) => x0.getPropertyValue(x1),
      UE: x0 => x0.value,
      UF: (x0,x1) => { x0.content = x1 },
      UG: x0 => x0.offsetTop,
      UH: x0 => x0.current(),
      UI: x0 => new window.ImageDecoder(x0),
      UJ: x0 => ({deviceId: x0}),
      UK: x0 => x0.left,
      UL: x0 => x0.aztecInfo,
      UM: (x0,x1) => { x0.pdf417 = x1 },
      UN: x0 => x0.nextSibling,
      V: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      VB: () => [],
      VC: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      VD: (x0,x1) => x0.warn(x1),
      VE: x0 => x0.selectionDirection,
      VF: x0 => x0.head,
      VG: x0 => x0.scrollLeft,
      VH: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      VI: x0 => x0.name,
      VJ: (x0,x1) => ({video: x0,audio: x1}),
      VK: x0 => x0.corners,
      VL: x0 => x0.optionalFields,
      VM: (x0,x1) => { x0.qr = x1 },
      VN: (x0,x1) => x0.debug(x1),
      W: x0 => new Array(x0),
      WB: (a, i) => a.push(i),
      WC: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      WD: x0 => x0.console,
      WE: x0 => x0.selectionStart,
      WF: (x0,x1) => { x0.name = x1 },
      WG: x0 => x0.offsetLeft,
      WH: x0 => x0.v8BreakIterator,
      WI: x0 => x0.repetitionCount,
      WJ: (x0,x1) => x0.getUserMedia(x1),
      WK: x0 => x0.subtype,
      WL: x0 => x0.lastSegment,
      WM: x0 => ({subtypes: x0}),
      WN: x0 => x0.hostElement,
      X: o => [o],
      XB: b => !!b,
      XC: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      XD: (x0,x1) => { x0.id = x1 },
      XE: x0 => x0.selectionEnd,
      XF: (x0,x1) => { x0.title = x1 },
      XG: x0 => x0.offsetParent,
      XH: () => globalThis.Intl,
      XI: x0 => x0.frameCount,
      XJ: x0 => x0.getTracks(),
      XK: x0 => x0.itfInfo,
      XL: x0 => x0.fileId,
      XM: (x0,x1) => { x0.itf = x1 },
      XN: x0 => x0.location,
      Y: (o0, o1) => [o0, o1],
      YB: x0 => new Int8Array(x0),
      YC: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      YD: (x0,x1) => x0.requestAnimationFrame(x1),
      YE: (x0,x1) => { x0.name = x1 },
      YF: () => globalThis.document,
      YG: x0 => x0.offsetY,
      YH: (x0,x1) => x0.segment(x1),
      YI: x0 => x0.selectedTrack,
      YJ: x0 => x0.play(),
      YK: x0 => x0.supplement,
      YL: x0 => x0.segmentIndex,
      YM: (x0,x1) => { x0.subtypes = x1 },
      YN: (x0,x1) => x0.getModifierState(x1),
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      ZC: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      ZD: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      ZE: (x0,x1) => { x0.placeholder = x1 },
      ZF: (x0,x1) => x0.vibrate(x1),
      ZG: x0 => x0.offsetX,
      ZH: x0 => x0.index,
      ZI: x0 => x0.completed,
      ZJ: (x0,x1) => x0.requestVideoFrameCallback(x1),
      ZK: x0 => x0.subtype,
      ZL: x0 => x0.readerInitialization,
      ZM: (x0,x1) => { x0.maxLength = x1 },
      ZN: x0 => x0.metaKey,
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: x0 => new Uint8Array(x0),
      aC: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      aD: x0 => x0.now(),
      aE: (x0,x1) => { x0.autocomplete = x1 },
      aF: (o, p) => p in o,
      aG: x0 => x0.deltaMode,
      aH: x0 => x0.next(),
      aI: x0 => x0.ready,
      aJ: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      aK: x0 => x0.eanUpcInfo,
      aL: x0 => x0.control,
      aM: (x0,x1) => { x0.eanUpc = x1 },
      aN: x0 => x0.altKey,
      b: (x0,x1,x2) => { x0[x1] = x2 },
      bB: x0 => new Uint8ClampedArray(x0),
      bC: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      bD: x0 => x0.performance,
      bE: (x0,x1) => { x0.type = x1 },
      bF: x0 => x0.arrayBuffer(),
      bG: x0 => x0.deltaY,
      bH: x0 => x0.value,
      bI: x0 => x0.tracks,
      bJ: (x0,x1,x2,x3) => x0.drawImage(x1,x2,x3),
      bK: x0 => x0.sequenceCount,
      bL: x0 => x0.eciControls,
      bM: (x0,x1) => { x0.subtypes = x1 },
      bN: x0 => x0.ctrlKey,
      c: o => o,
      cB: x0 => new Int16Array(x0),
      cC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      cD: (x0,x1) => x0.unregister(x1),
      cE: (x0,x1) => { x0.name = x1 },
      cF: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      cG: x0 => x0.deltaX,
      cH: x0 => x0.done,
      cI: () => globalThis.window.ImageDecoder,
      cJ: (x0,x1,x2,x3,x4) => x0.getImageData(x1,x2,x3,x4),
      cK: x0 => x0.sequenceIndex,
      cL: x0 => x0.eci,
      cM: (x0,x1) => { x0.maxRegions = x1 },
      cN: x0 => x0.isComposing,
      d: (o, p) => o[p],
      dB: x0 => new Uint16Array(x0),
      dC: x0 => x0.history,
      dD: () => globalThis.window.FinalizationRegistry,
      dE: (x0,x1) => { x0.placeholder = x1 },
      dF: x0 => x0.status,
      dG: x0 => x0.wheelDeltaY,
      dH: (o, m, a) => o[m].apply(o, a),
      dI: x0 => new Worker(x0),
      dJ: x0 => x0.data,
      dK: x0 => x0.assignment,
      dL: x0 => x0.correctedCodewords,
      dM: x0 => x0.flutterInvocationNow(),
      dN: x0 => x0.code,
      e: () => globalThis,
      eB: x0 => new Int32Array(x0),
      eC: () => globalThis.window,
      eD: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      eE: (x0,x1) => { x0.scrollTop = x1 },
      eF: (x0,x1) => x0.fetch(x1),
      eG: x0 => x0.wheelDeltaX,
      eH: x0 => x0.iterator,
      eI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      eJ: x0 => x0.height,
      eK: x0 => x0.offset,
      eL: x0 => x0.errorCorrectionCodewords,
      eM: (x0,x1) => ({execution: x0,maxParticipants: x1}),
      eN: x0 => x0.repeat,
      f: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      fC: x0 => x0.search,
      fD: x0 => new window.FinalizationRegistry(x0),
      fE: x0 => x0.tagName,
      fF: x0 => x0.content,
      fG: x0 => x0.bottom,
      fH: () => globalThis.Symbol,
      fI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fJ: x0 => x0.width,
      fK: x0 => x0.eciControls,
      fL: x0 => x0.errorCorrectionLevel,
      fM: (x0,x1) => x0.createWorkerScanner(x1),
      fN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: x0 => new Uint32Array(x0),
      gC: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      gD: x0 => x0.scale,
      gE: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      gF: x0 => x0.document,
      gG: x0 => x0.right,
      gH: (x0,x1) => new Intl.Segmenter(x0,x1),
      gI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gJ: (x0,x1) => ({alpha: x0,willReadFrequently: x1}),
      gK: x0 => x0.macroFormat,
      gL: x0 => x0.columns,
      gM: x0 => x0.workerProtocolVersion,
      gN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: x0 => new Float32Array(x0),
      hC: x0 => x0.location,
      hD: x0 => x0.visualViewport,
      hE: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      hF: x0 => x0.language,
      hG: x0 => x0.clientY,
      hH: x0 => x0.Segmenter,
      hI: x0 => x0.slice(),
      hJ: (x0,x1,x2) => x0.getContext(x1,x2),
      hK: x0 => x0.readerProgramming,
      hL: x0 => x0.rows,
      hM: x0 => x0.optionsContractVersion,
      hN: x0 => x0.click(),
      i: (string, token) => string.split(token),
      iB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      iC: x0 => x0.pathname,
      iD: x0 => x0.devicePixelRatio,
      iE: x0 => x0.visibilityState,
      iF: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      iG: x0 => x0.clientX,
      iH: x0 => x0.buffer,
      iI: (x0,x1) => ({generation: x0,bytes: x1}),
      iJ: x0 => x0.videoHeight,
      iK: x0 => x0.gs1,
      iL: x0 => x0.subtype,
      iM: (m) => import(m),
      iN: x0 => x0.message,
      j: o => o instanceof Array,
      jB: x0 => new Float64Array(x0),
      jC: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      jD: (d, digits) => d.toFixed(digits),
      jE: x0 => x0.hasFocus(),
      jF: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      jG: x0 => x0.changedTouches,
      jH: x0 => x0.wasmMemory,
      jI: (x0,x1,x2) => x0.postMessage(x1,x2),
      jJ: x0 => x0.videoWidth,
      jK: x0 => x0.correctedCodewords,
      jL: x0 => x0.variant,
      jM: () => globalThis.document.baseURI,
      jN: x0 => globalThis.URL.createObjectURL(x0),
      k: (a, i) => a[i],
      kB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      kC: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      kD: x0 => x0.maxHeight,
      kE: x0 => x0.relatedTarget,
      kF: (x0,x1) => x0.querySelector(x1),
      kG: x0 => x0.key,
      kH: () => globalThis.window._flutter_skwasmInstance,
      kI: x0 => x0.terminate(),
      kJ: x0 => x0.readyState,
      kK: x0 => x0.mask,
      kL: x0 => x0.macroInfo,
      kM: (x0,x1) => x0.appendChild(x1),
      kN: x0 => x0.lastModified,
      l: a => a.length,
      lB: x0 => new ArrayBuffer(x0),
      lC: o => Object.keys(o),
      lD: x0 => x0.maxWidth,
      lE: x0 => x0.index,
      lF: (x0,x1) => x0.querySelectorAll(x1),
      lG: x0 => x0.identifier,
      lH: () => new TextDecoder(),
      lI: x0 => x0.buffer,
      lJ: x0 => x0.kind,
      lK: x0 => x0.columns,
      lL: x0 => x0.pdf417Info,
      lM: x0 => x0.firstElementChild,
      lN: x0 => x0.size,
      m: (string, times) => string.repeat(times),
      mB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      mC: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      mD: x0 => x0.minHeight,
      mE: x0 => x0.unicode,
      mF: x0 => x0.tabIndex,
      mG: x0 => x0.touches,
      mH: (map, o, v) => map.set(o, v),
      mI: (x0,x1) => { x0.onmessageerror = x1 },
      mJ: (x0,x1,x2) => x0.setAttribute(x1,x2),
      mK: x0 => x0.rows,
      mL: x0 => x0.applicationIndicator,
      mM: () => new FileReader(),
      mN: x0 => x0.name,
      n: (decoder, codeUnits) => decoder.decode(codeUnits),
      nB: (x0,x1,x2) => new DataView(x0,x1,x2),
      nC: f => f.dartFunction,
      nD: x0 => x0.minWidth,
      nE: (x0,x1) => { x0.lastIndex = x1 },
      nF: x0 => x0.parentNode,
      nG: x0 => x0.pressure,
      nH: (map, o) => map.get(o),
      nI: (x0,x1) => { x0.onerror = x1 },
      nJ: (x0,x1) => x0.createElement(x1),
      nK: x0 => x0.hasText,
      nL: x0 => x0.fnc1Position,
      nM: (x0,x1) => x0.readAsArrayBuffer(x1),
      nN: x0 => x0.type,
      o: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      oB: (o, p) => o[p],
      oC: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      oD: x0 => x0.height,
      oE: x0 => x0.dotAll,
      oF: x0 => x0.clientY,
      oG: x0 => x0.tiltY,
      oH: () => new WeakMap(),
      oI: (x0,x1) => { x0.onmessage = x1 },
      oJ: (x0,x1) => { x0.pointerEvents = x1 },
      oK: x0 => x0.payloadBytes,
      oL: x0 => x0.readerProgramming,
      oM: x0 => x0.result,
      oN: (x0,x1) => x0.item(x1),
      p: () => new TextDecoder("utf-8", {fatal: true}),
      pB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      pC: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      pD: x0 => x0.width,
      pE: x0 => x0.ignoreCase,
      pF: x0 => x0.clientX,
      pG: x0 => x0.tiltX,
      pH: x0 => x0.debugSkipFontRetryDelay,
      pI: x0 => x0.height,
      pJ: (x0,x1) => { x0.objectFit = x1 },
      pK: x0 => x0.dotcodeInfo,
      pL: x0 => x0.sequenceFileId,
      pM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      pN: x0 => x0.length,
      q: () => new TextDecoder("utf-8", {fatal: false}),
      qB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      qC: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      qD: x0 => x0.screen,
      qE: x0 => x0.multiline,
      qF: x0 => x0.shiftKey,
      qG: x0 => x0.pointerType,
      qH: (x0,x1,x2) => x0.set(x1,x2),
      qI: x0 => x0.width,
      qJ: (x0,x1) => { x0.height = x1 },
      qK: x0 => x0.bytes,
      qL: x0 => x0.sequenceCount,
      qM: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      qN: x0 => x0.files,
      r: s => s.trimLeft(),
      rB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      rC: (o, i) => o[i],
      rD: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      rE: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      rF: x0 => x0.disconnect(),
      rG: x0 => x0.pointerId,
      rH: x0 => x0.fontFallbackBaseUrl,
      rI: x0 => x0.bytes,
      rJ: (x0,x1) => { x0.width = x1 },
      rK: x0 => x0.identifier,
      rL: x0 => x0.sequenceIndex,
      rM: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      rN: (x0,x1) => { x0.multiple = x1 },
      s: (l, r) => l === r,
      sB: o => o.byteOffset,
      sC: o => o.length,
      sD: (x0,x1) => x0.removeProperty(x1),
      sE: x0 => x0.keyCode,
      sF: x0 => new Intl.Locale(x0),
      sG: x0 => x0.getCoalescedEvents(),
      sH: (handle) => clearInterval(handle),
      sI: x0 => x0.error,
      sJ: x0 => x0.style,
      sK: x0 => x0.extraPackets,
      sL: x0 => x0.macroKind,
      sM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      sN: (x0,x1) => { x0.accept = x1 },
      t: s => s.toUpperCase(),
      tB: o => o.buffer,
      tC: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      tD: (x0,x1) => x0.appendChild(x1),
      tE: (x0,x1) => x0.scrollIntoView(x1),
      tF: x0 => x0.region,
      tG: x0 => x0.blur(),
      tH: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      tI: x0 => x0.generation,
      tJ: (x0,x1) => { x0.playsInline = x1 },
      tK: x0 => x0.secondaryOffset,
      tL: x0 => x0.correctedCodewords,
      tM: () => new XMLHttpRequest(),
      tN: (x0,x1) => { x0.type = x1 },
      u: Object.is,
      uB: (b, o) => new DataView(b, o),
      uC: x0 => x0.state,
      uD: x0 => x0.debugShowSemanticsNodes,
      uE: x0 => x0.multiViewEnabled,
      uF: x0 => x0.script,
      uG: x0 => x0.button,
      uH: () => Date.now(),
      uI: x0 => x0.data,
      uJ: (x0,x1) => { x0.defaultMuted = x1 },
      uK: x0 => x0.primaryLength,
      uL: x0 => x0.gs1,
      uM: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      uN: (x0,x1) => x0.querySelector(x1),
      v: (x0,x1) => x0.test(x1),
      vB: (b, o, l) => new DataView(b, o, l),
      vC: x0 => x0.hash,
      vD: (o, c) => o instanceof c,
      vE: x0 => x0.parent,
      vF: x0 => x0.language,
      vG: (x0,x1) => x0.prepend(x1),
      vH: x0 => new WeakRef(x0),
      vI: x0 => x0.baseURI,
      vJ: (x0,x1) => { x0.muted = x1 },
      vK: x0 => x0.linkage,
      vL: x0 => x0.eci,
      vM: x0 => x0.send(),
      vN: x0 => x0.extraAssets,
      w: o => o,
      wB: Function.prototype.call.bind(DataView.prototype.getUint8),
      wC: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      wD: x0 => x0.vendor,
      wE: (x0,x1) => x0.replaceWith(x1),
      wF: x0 => x0.languages,
      wG: x0 => x0.innerHeight,
      wH: x0 => x0.deref(),
      wI: () => globalThis.document,
      wJ: x0 => x0.close(),
      wK: x0 => x0.dataRows,
      wL: x0 => x0.columns,
      wM: x0 => x0.response,
      wN: x0 => x0.fontManifest,
      x: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      xB: Function.prototype.call.bind(DataView.prototype.setUint8),
      xC: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      xD: (x0,x1) => x0.createTextNode(x1),
      xE: (x0,x1) => { x0.className = x1 },
      xF: (x0,x1) => x0.observe(x1),
      xG: x0 => x0.height,
      xH: () => globalThis.WeakRef,
      xI: x0 => x0.enumerateDevices(),
      xJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      xK: x0 => x0.layout,
      xL: x0 => x0.rows,
      xM: (x0,x1) => { x0.responseType = x1 },
      xN: x0 => x0.assetManifest,
      y: (a, i, v) => a[i] = v,
      yB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      yC: x0 => x0.state,
      yD: (x0,x1) => { x0.nonce = x1 },
      yE: (x0,x1) => { x0.tabIndex = x1 },
      yF: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      yG: x0 => x0.width,
      yH: (a, i) => a.splice(i, 1),
      yI: x0 => x0.label,
      yJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      yK: x0 => x0.dataBarInfo,
      yL: x0 => x0.dataMatrixInfo,
      yM: x0 => x0.vendor,
      yN: x0 => x0.buildConfig,
      z: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      zB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      zC: (x0,x1,x2) => x0.addEventListener(x1,x2),
      zD: x0 => x0.nonce,
      zE: (x0,x1) => { x0.action = x1 },
      zF: x0 => new ResizeObserver(x0),
      zG: x0 => x0.clientHeight,
      zH: a => a.pop(),
      zI: x0 => x0.deviceId,
      zJ: (x0,x1,x2) => x0.then(x1,x2),
      zK: x0 => x0.sequenceCount,
      zL: x0 => x0.sequenceParity,
      zM: (x0,x1,x2) => x0.insertBefore(x1,x2),
      zN: x0 => x0.length,

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}

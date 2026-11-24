# @barry/barcode 0.1.0 — Barry for browsers

Serve this entire ESM package over HTTPS or loopback HTTP. The browser needs
ES modules, module workers and standard WebAssembly SIMD (`simd128`). Node 20+
and npm are packaging tools, not scanner runtime dependencies.

## Open one worker, scan a frame, close

On a page served next to this package's `index.mjs`, use a serial worker to
keep recognition off the UI thread without cross-origin isolation:

```js
import {createWorkerScanner, LocalizationStop} from './index.mjs';
const owner = await createWorkerScanner({execution: 'serial'});
try {
  const gray = new Uint8Array([255, 255, 255, 255]); // a blank 2×2 frame
  const result = await owner.scanGray(gray, 2, 2, 2, {budgetMs: 500});
  for (const barcode of result.barcodes) {
    const exact = barcode.dataMatrixInfo ?? barcode.pdf417Info ?? barcode.aztecInfo ??
      barcode.maxicodeInfo ?? barcode.dotcodeInfo;
    console.log(barcode.symbology, exact?.hasText === false ? null : barcode.text, exact?.payloadBytes);
  }
  console.log('records:', result.barcodes.length, 'complete:', result.complete,
    'deadline:', result.stopReason === LocalizationStop.DEADLINE);
} finally { await owner.close(); }
```

Reuse the owner across frames. A completed empty call is not proof of absence;
a partial call may contain committed reads. Available text can be the empty
string. Unavailable text does not discard counted bytes. QR text is not
original QR segment bytes. For external detections,
`await createWorkerRegionDecoder({execution: 'serial'})` constructs only a
supplied-region decoder. Pass four perimeter corners in submitted-frame pixels
per proposal, not dummy bounds. Separate Find and Decode calls have separate
budgets; returned reads are not positional matches to the proposals.

This product uses options 6, worker/helper
protocol 12 and capability mask 519792.
Upgrade the whole tree together. Omit `symbologies` for all twelve families:
CODE_128, CODE_39, CODE_93, QR_CODE, DATA_MATRIX, PDF417, AZTEC, MAXICODE,
GS1_DATABAR, DOTCODE, EAN_UPC, ITF. Explicit `enabled: []` searches none.
For only the Micro subtype of PDF417 use:

```json
{"symbologies":{"enabled":["PDF417"],"pdf417":{"subtypes":["MICROPDF417"]}}}
```

Call `validateScanOptions('scanGray', options)` for external configuration
before opening an owner. Switch on `classifyBarryError(error)`: INVALID_ARGUMENT
means fix the input and reuse the owner; QUEUE_FULL means defer or drop a
preview; INITIALIZATION_FAILED means repair the deployment; CLOSED or
OWNER_FAILED means stop submitting to this owner. Do not replay automatically.

## Delivered runtime files

- [`index.mjs`](index.mjs)
- [`index.d.ts`](index.d.ts)
- [`worker-client.mjs`](worker-client.mjs)
- [`worker-entry.mjs`](worker-entry.mjs)
- [`frame-input.mjs`](frame-input.mjs)
- [`barry-error.mjs`](barry-error.mjs)
- [`databar-result.mjs`](databar-result.mjs)
- [`dotcode-result.mjs`](dotcode-result.mjs)
- [`symbology-selection.mjs`](symbology-selection.mjs)
- [`thread-pool.mjs`](thread-pool.mjs)
- [`rayon-helper.mjs`](rayon-helper.mjs)
- [`serial/barry_wasm.js`](serial/barry_wasm.js)
- [`serial/barry_wasm_bg.wasm`](serial/barry_wasm_bg.wasm)
- [`serial/barry_wasm.d.ts`](serial/barry_wasm.d.ts)
- [`serial/barry_wasm_bg.wasm.d.ts`](serial/barry_wasm_bg.wasm.d.ts)
- [`threads/barry_wasm.js`](threads/barry_wasm.js)
- [`threads/barry_wasm_bg.wasm`](threads/barry_wasm_bg.wasm)
- [`threads/barry_wasm.d.ts`](threads/barry_wasm.d.ts)
- [`threads/barry_wasm_bg.wasm.d.ts`](threads/barry_wasm_bg.wasm.d.ts)

Serve the entire directory with its relative layout intact. Use HTTPS or loopback
HTTP, not `file:`. Serve modules and workers as JavaScript and Wasm as
`application/wasm`; don't turn missing files into HTML redirects. The owner
`worker-entry.mjs`, `rayon-helper.mjs`, glue and Wasm resolve relative to the
modules. Deploy them as real HTTP URLs; copying only `index.mjs` or bundling it
without making those URLs available is insufficient.

## Install locally or deploy under an application base URL

In this directory run `pack_dir=$(mktemp -d); npm pack --offline --pack-destination "$pack_dir"`.
In a separate app, install that exact file with
`npm install --offline --ignore-scripts --no-audit --no-fund --no-save /absolute/path/to/package.tgz`.
No registry publication is assumed. For a static page, serve the package tree
unchanged and import its `index.mjs` by URL.

For a bundled app, the source distribution's `examples/browser/production`
contains the strict TypeScript and esbuild recipe: use
`node build.mjs --tarball /absolute/path/to/package.tgz` with its provisioned tools.
Bundle the app, **not Barry**. At build time resolve `@barry/barcode/package.json`;
copy the complete package (notices and both modes) under
`vendor/barry/<version>-<tarball-sha256>/`. Use `typeof import('@barry/barcode')`
for types, and import the real URL against the deployment base on client mount,
not during SSR. Stop admission on unmount; close even a late-ready worker.

For example, serve under `/lab/scanner/` with fresh/revalidated HTML,
immutable versioned assets and real 404s before SPA fallback. Inspect failed
worker, private-module, glue and Wasm requests. Allow same-origin module workers
with `worker-src 'self'` and Wasm compilation with
`script-src 'self' 'wasm-unsafe-eval'` in applicable page and worker policies.

## GS1 DataBar results

Select `'GS1_DATABAR'` for DataBar-only scans; omitting selection enables all
twelve families. Set `symbologies.dataBar.readLinkedComponent` to `false` to
decode only the primary of a linked symbol. The default is `true`; subtype
selection and Find Regions geometry are unchanged.

Each DataBar barcode includes immutable `dataBarInfo` with
the primary layout, data-row count, and linkage state. `LINKED_UNREAD` is a
verified primary with no verified upper, not a complete composite. Use the
byte lengths/offsets to separate the components of the exact scanner text
(including any group separators). Additional `]e1` and `]e2` packets are
separate identifier/frozen numeric-array pairs, not Uint8Arrays or part of the text. Details survive owner close
and Wasm memory growth.

## DotCode results

`'DOTCODE'` selects DotCode. Each DotCode barcode includes `dotcodeInfo` with
exact bytes, lattice dimensions, arithmetic mask, corrected word count, flags,
and optional macro, ECI and append metadata. Display the exact bytes when no
strict text is available. Reader programming and append parts are not executed
or assembled.

All PDF417 variants, including Micro, report PDF417. When serializing full public
metadata explicitly copy `pdf417Info.subtype`: it is a derived non-enumerable getter.

## Explicit threaded mode

Configure the server's response headers for cross-origin isolation:
`Cross-Origin-Opener-Policy: same-origin` and
`Cross-Origin-Embedder-Policy: require-corp`. Use same-origin assets or provide
the appropriate CORS/CORP headers. Verify `crossOriginIsolated` and browser
support for shared memory and Wasm atomics. Select threaded execution explicitly:

```js
import {createWorkerScanner} from './index.mjs';
const owner = await createWorkerScanner({execution: 'threads'});
try {
  const result = await owner.scanGray(gray, width, height, stride, {budgetMs: 5000});
  // Consume the independent result here.
} finally {
  await owner.close();
}
```

The async facade starts a dedicated module Worker and manages its helper pool.
Close it to drain accepted calls and release the owner and helpers. Direct
threaded init is for a dedicated Worker with a parent-serviced fatal message
port; close direct scanner/decoder owners before `closeThreadPool()`. Missing
SIMD/isolation, failed initialization and incompatible assets are errors;
threaded mode never falls back to serial. Failed artifact initialization is
cached in that realm; fix the deployment and use a new owner/realm.

For synchronous serial work in your own realm, call
`await init({execution:'serial'})` before constructing `Scanner` or
`RegionDecoder`. Closing a direct owner does not close a shared threaded pool.

## Process protocol reference (not JavaScript call syntax)

The source project's process bridge uses raw10, 16 tab-separated fields: width,
height, stride, budget, enabled mask, retail subtypes, supplement policy, ITF
subtypes, ITF minimum, ITF maximum, QR subtypes, PDF417 subtypes, DataBar
subtypes, DataBar linked reading (1 to read, 0 to skip), region cap, absolute
raw path. Replace RAW below with the absolute path of a six-byte grayscale
file (the final row needs no trailing padding):

```text
2	2	4	500	2048	15	0	7	0	-1	7	2	127	1	32	RAW
```

Supplied mode uses the exact number of proposals in field 15 instead of a cap
and appends the absolute JSON quadrilaterals path as field 17.

[MIT license](LICENSE) · [Third-party notices](THIRD-PARTY-NOTICES.md) ·
[Packaged notice inventory](NOTICE-MANIFEST.json).

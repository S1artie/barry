// MIT License - see LICENSE file in the project root for details.
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Barry contributors
/**
 * Barry's SIMD browser API. Each direct owner is confined to its constructing
 * realm; do not call it concurrently. Async owners serialize accepted work in a
 * dedicated Worker. All results, strings, corners and payload bytes are independent
 * snapshots that survive subsequent calls and close(). There are no borrowed
 * views into Wasm memory in these public records.
 *
 * Image methods accept grayscale bytes (0 black, 255 white), integer dimensions
 * 1..65535 with width*height <= 100,000,000, and integer byte stride >= width and
 * <= 2^32-1. A Uint8Array must contain at least (height-1)*stride+width bytes; final
 * row padding is not required. The required span must fit wasm32. Input is read
 * only and never detached. Geometry is in this exact supplied image's pixel
 * coordinates, x rightward/y downward; no implicit EXIF/orientation transform.
 *
 * Invalid options/images/regions throw (async methods reject) without poisoning
 * a valid owner. A trap/internal failure poisons the owner: errors carry
 * `fatal: true`, and its whole Worker/helper stack must be terminated. Deadlines
 * are cooperative, include validation and result finalization, and may overrun
 * while borrowed readers drain. Partial results are not quality guarantees.
 * @packageDocumentation
 */
/** `serial`: one caller, no helpers. `threads`: explicit isolated shared-memory deployment; never falls back. */
export type Execution = 'serial' | 'threads';
/** Worker lifecycle, independent of whether its most recent scan was complete. */
export type WorkerStatus = 'open' | 'closing' | 'closed' | 'failed';
/** Stable recovery categories shared by direct and worker APIs. */
export type BarryErrorCode =
  'INVALID_ARGUMENT' | 'QUEUE_FULL' | 'CLOSED' | 'INITIALIZATION_FAILED' | 'OWNER_FAILED';
/** Read a recognized Barry error code without testing exception identity across realms.
 * Unrelated errors have no classification. */
export function classifyBarryError(error: unknown): BarryErrorCode | undefined;
/** Immutable mode/allocation requested during initialization or owner creation. */
export interface ExecutionOptions {
  /** Mode; defaults to serial for init/async creation and to initialized mode for direct owners. */
  execution?: Execution;
  /** Caller-inclusive integer limit; 0 (default) selects min(2, capacity).
   * Serial capacity is 1. Threaded init defaults to min(2, hardwareConcurrency);
   * explicit init limits may use all observed CPUs. Owners cannot exceed the
   * initialized capacity, and default owners use at most two in a larger pool. */
  maxParticipants?: number;
}
/** Direct module initialization; this creates no scanner and scans no pixels. */
export interface InitOptions extends ExecutionOptions {
  /** Required on first direct threaded init. The parent must service
   * `barry-helper-port` packets by listening on their transferred `port` and
   * terminate the dedicated owner on any `barry-helper-fatal` message, including
   * one on the original fatalPort. Retain/close every registered port.
   * createWorkerScanner installs this complete containment automatically. */
  fatalPort?: MessagePort;
}
/** Localization/full-scan search controls; supplied decoding uses DecodeOptions. */
export interface ScanOptions extends DecodeOptions {
  /** Integer localization-region cap 1..128, default 32; not a barcode-count guarantee. */
  maxRegions?: number
}
/** Canonical twelve-family capability, identical across maintained deployments. */
export type Symbology = 'CODE_128' | 'CODE_39' | 'CODE_93' | 'QR_CODE' | 'DATA_MATRIX' |
  'PDF417' | 'AZTEC' | 'MAXICODE' | 'GS1_DATABAR' | 'DOTCODE' | 'EAN_UPC' | 'ITF';
/** Physical retail subtype, not a top-level symbology name. */
export type EanUpcSubtype = 'EAN_13' | 'EAN_8' | 'UPC_A' | 'UPC_E';
/** Requirements apply to decoded retail results, not geometry-only localization. */
export type SupplementPolicy = 'IGNORE' | 'READ_IF_FOUND' | 'REQUIRE_2' | 'REQUIRE_5' | 'REQUIRE_2_OR_5';
/** Physical subtype within ITF. STANDARD is ordinary Interleaved 2 of 5. */
export type ItfSubtype = 'STANDARD' | 'IATA_2_OF_5' | 'ITF_14';
/** Physical QR encoding; all three report the QR_CODE family. */
export type QrSubtype = 'MODEL_1' | 'MODEL_2' | 'MICRO_QR';
/** Full and Compact share STANDARD; MicroPDF417 also reports the PDF417 family. */
export type Pdf417Subtype = 'STANDARD' | 'MICROPDF417';
/** Requested physical DataBar shapes, not result layout labels. */
export type DataBarSubtype = 'OMNIDIRECTIONAL' | 'TRUNCATED' | 'STACKED' | 'STACKED_OMNIDIRECTIONAL' |
  'LIMITED' | 'EXPANDED' | 'EXPANDED_STACKED';
/** Validated even when ITF is disabled; bounds are ignored for geometry-only localization. */
export interface ItfOptions {
  /** Omitted: all three. Empty: no ITF work. */
  readonly subtypes?: readonly ItfSubtype[];
  /** Inclusive minimum, exact integer 0..2147483647; omitted means 0. */
  readonly minLength?: number;
  /** Inclusive maximum, at least the minimum and at most 2147483647; omitted means unbounded. */
  readonly maxLength?: number;
}
export interface SymbologySelection {
  /** Empty: validate, search nothing. Every name must be supported. */
  readonly enabled: readonly Symbology[];
  readonly eanUpc?: {
    /** Omitted: all four. Empty: no retail work. Validated even when EAN_UPC is disabled. */
    readonly subtypes?: readonly EanUpcSubtype[];
    /** Omitted: IGNORE. Validated even when EAN_UPC is disabled. */
    readonly supplement?: SupplementPolicy;
  };
  readonly itf?: ItfOptions;
  /** Omitted subtypes means all; empty means no work. Validated even with the parent disabled. */
  readonly qr?: {readonly subtypes?: readonly QrSubtype[]};
  readonly pdf417?: {readonly subtypes?: readonly Pdf417Subtype[]};
  readonly dataBar?: {
    /** Either compatible subtype admits genuinely ambiguous single-row or stacked evidence. */
    readonly subtypes?: readonly DataBarSubtype[];
    /** Omitted: true. False reads only the primary. Validated even when GS1_DATABAR is disabled; ignored for localization. */
    readonly readLinkedComponent?: boolean;
  };
}
/** Runtime options handshake version; mixed product generations are rejected. */
export const optionsContractVersion: 6;
/** Worker wire-protocol handshake version, independent of package semver. */
export const workerProtocolVersion: 12;
/** Frozen canonical names; omitted selection requests all families. */
export const supportedSymbologies: readonly Symbology[];
/** Decoder controls, snapshotted at accepted async invocation. */
export interface DecodeOptions {
  /** Exact safe integer 0..Number.MAX_SAFE_INTEGER milliseconds; omitted defaults
   * to 0 (Unlimited). One original deadline includes validation, waits and result finalization. */
  budgetMs?: number;
  /** Omitted: all families and subtypes, IGNORE for supplements, unrestricted ITF lengths. */
  symbologies?: SymbologySelection;
}
/** Operation names accepted by the strict configuration validator. */
export type ScanOperation = 'scanGray' | 'findRegionsGray' | 'decodeRegionsGray';
/** Validate options before opening an owner, including exact operation-specific keys.
 * Omission is valid; the value is neither modified nor installed as owner state.
 * Ordinary processing calls continue to ignore unrecognized top-level keys. */
export function validateScanOptions<O extends ScanOperation>(
  operation: O, options?: unknown
): asserts options is (O extends 'decodeRegionsGray' ? DecodeOptions : ScanOptions) | undefined;
/** Immutable resource allocation and observed per-call participation, not throughput. */
export interface ExecutionInfo {
  /** Observed hardwareConcurrency, independent of initialized capacity. */
  readonly availableCpus: number;
  /** Caller-inclusive selected limit, 1..initialized capacity. */
  readonly participantLimit: number;
  /** Initialized helper count; capacity is poolHelpers + 1 (serial: 1). */
  readonly poolHelpers: number;
  /** Distinct participating workers including caller; zero on owner allocation snapshots. */
  readonly participantsUsed: number;
  /** Peak simultaneously participating workers; zero on allocation snapshots. */
  readonly peakParticipants: number;
}
/** Four finite (x,y) pixel pairs in perimeter order, x rightward/y downward.
 * Returned corners are unclipped and clockwise, starting at the topmost/leftmost
 * point. Supplied regions accept either winding and are canonicalized before decoding. */
export type Corners = [number, number, number, number, number, number, number, number];
/** Detector input in submitted pixel coordinates. Only corners are read; existing
 * localization regions may be used directly without copying or dropping bounds. */
export interface RegionInput {
  readonly corners: Readonly<Corners>;
  readonly left?: number;
  readonly top?: number;
  readonly right?: number;
  readonly bottom?: number;
}
/** Convex quadrilateral. Returned integer bounds are floor(minimum)/ceil(maximum)
 * corner extents clipped to the input image. Supplied decoding ignores bounds. */
export interface Region {
  /** Inclusive clipped left pixel edge; ignored for supplied regions. */
  left: number;
  /** Inclusive clipped top pixel edge; ignored for supplied regions. */
  top: number;
  /** Exclusive clipped right pixel edge; ignored for supplied regions. */
  right: number;
  /** Exclusive clipped bottom pixel edge; ignored for supplied regions. */
  bottom: number;
  /** Independent finite strictly convex perimeter with absolute area > 1e-9 pixel²;
   * may extend outside the image. At most 128 regions per supplied decode call. */
  corners: Corners;
}
/** QR metadata, present only for a QR barcode; optional controls use explicit sentinels. */
export interface QRInfo {
  readonly subtype: QrSubtype;
  /** Model 1: 1..14; Model 2: 1..40; Micro QR: M1..M4 encoded as 1..4. */
  version: number;
  /** DETECTION_ONLY is exclusive to Micro QR M1. */
  errorCorrection: 'L' | 'M' | 'Q' | 'H' | 'DETECTION_ONLY';
  /** Selected data-mask index 0..7 for full QR, 0..3 for Micro QR. */
  mask: number;
  /** Reed-Solomon codewords corrected, 0..3706; not a confidence score. */
  correctedCodewords: number;
  /** FNC1 mode: 0 absent, 1 first position, 2 second position. */
  fnc1: number;
  /** Second-position FNC1 indicator: 0..99, 165..190 or 197..222;
   * -1 unless fnc1 is 2. */
  applicationIndicator: number;
  /** Structured-append zero-based index below sequenceCount; -1 when absent. */
  sequenceIndex: number;
  /** Structured-append symbol count, 1..16; 0 when absent. */
  sequenceCount: number;
  /** Structured-append parity byte, 0..255; -1 when absent. */
  sequenceParity: number;
}
/** Data Matrix ECC200 metadata. Exact bytes remain authoritative independently
 * of strict text availability. Supported squares have side 10, 12, 14, 16, 18,
 * 20, 22, 24, 26, 32, 36, 40, 44, 48, 52, 64, 72, 80, 88, 96, 104, 120,
 * 132 or 144 modules. Rectangles (rows,columns) are (8,18), (8,32), (12,26),
 * (12,36), (16,36), (16,48); dimensions are not arbitrary ranges. */
export interface DataMatrixInfo {
  /** Independently copied decoded bytes, length 0..4096, including embedded NULs. */
  payloadBytes: Uint8Array;
  /** Whether Barcode.text has a supported strict interpretation; false means
   * empty text, not a replacement-decoded string. Payload bytes are still exact. */
  hasText: boolean;
  /** Symbol rows in modules, including the finder border. */
  rows: number;
  /** Symbol columns in modules, including the finder border. */
  columns: number;
  /** Explicit ECI assignment, 0..999999; -1 when absent. */
  eci: number;
  /** First-position FNC1 identifies GS1 content. */
  gs1: boolean;
  /** Reed-Solomon codewords corrected, 0..2178; not a confidence estimate. */
  correctedCodewords: number;
  /** Macro marker: 0 absent, 5 Macro05, 6 Macro06. */
  macroKind: number;
  /** Zero-based structured-append index below sequenceCount; -1 when absent. */
  sequenceIndex: number;
  /** Structured-append symbol count, 2..16; 0 when absent. */
  sequenceCount: number;
  /** Structured-append file identifier, 1..64516; -1 when absent. */
  sequenceFileId: number;
  /** Whether the reader-programming control was present. */
  readerProgramming: boolean;
  /** FNC1 header position: 0 absent, 1 first/GS1, 2 application-indicator position. */
  fnc1Position: number;
  /** Second-position FNC1 indicator: 66..91, 98..123 or 130..229;
   * -1 unless fnc1Position is 2. */
  applicationIndicator: number;
}
/** Encountered ECI control, with offsets counted in payload bytes, not characters. */
export interface Pdf417ECI {
  /** Nondecreasing offset0..payloadBytes.length; equal offsets preserve encounter order. */
  offset: number;
  /**927 charset,926 general-purpose or925 user-defined. */
  control: 927 | 926 | 925;
  /**927/0..899,926/900..810899,925/810900..811799. */
  assignment: number;
}
/** Independent single Macro segment; no automatic sequence reassembly. */
export interface Pdf417MacroInfo {
  /** Zero-based segment index0..99998. */
  segmentIndex: number;
  /**3..2784 decimal characters in three-digit groups000..899; leading zeros remain data. */
  fileId: string;
  /** Whether the last-segment control was present. */
  lastSegment: boolean;
  /** Copied raw optional codewords, at most928 values each0..928. */
  optionalFields: number[];
}
/** Exact copied PDF-family payload and layout/control metadata. */
export interface Pdf417Info {
  /** Copied bytes0..4096, including NUL/high bytes, never a Wasm-memory view. */
  payloadBytes: Uint8Array;
  /** False requires empty Barcode.text, not missing payload; available empty text is distinct. */
  hasText: boolean;
  /** Full/Compact are STANDARD; Micro is MICROPDF417. All variants report PDF417. */
  readonly variant: 'full' | 'compact' | 'micro';
  /** Derived from variant; not a separate field on the wire. */
  readonly subtype: Pdf417Subtype;
  /** Logical symbol rows; full/Compact3..90, Micro exact catalog layout. */
  rows: number;
  /** Data-codeword columns excluding row indicators; full/Compact1..30, Micro1..4. */
  columns: number;
  /** Full/Compact correction level0..8; null for Micro. */
  errorCorrectionLevel: number | null;
  /** Full/Compact parity2<<level; exact catalog parity for Micro. */
  errorCorrectionCodewords: number;
  /**0..errorCorrectionCodewords, not confidence. */
  correctedCodewords: number;
  /** Last charset927 assignment0..899, or null when absent. */
  eci: number | null;
  /** At most928 copied controls in encounter order; available text permits only charset3/26. */
  eciControls: Pdf417ECI[];
  /** Reader-initialization control presence. */
  readerInitialization: boolean;
  /** Optional independent single-segment Macro metadata; null means absent. */
  macroInfo: Pdf417MacroInfo | null;
}
/** Encountered Aztec ECI transition, in payload byte offsets. */
export interface AztecECI {
  readonly offset: number;
  readonly assignment: number;
}
/** Exact copied payload and control metadata for one ordinary Aztec Code symbol. */
export interface AztecInfo {
  /** Independent owned bytes, including NUL/high bytes; never a Wasm-memory view. */
  payloadBytes: Uint8Array;
  /** False requires empty Barcode.text; available empty text is distinct. */
  hasText: boolean;
  compact: boolean;
  /** Compact 1..4; Full-Range 1..32. */
  layers: number;
  dataCodewords: number;
  /** Corrected payload codewords, not confidence. */
  correctedCodewords: number;
  /** Corrected mode nibbles, separately from payload corrections. */
  modeCorrectedCodewords: number;
  /** Owned records in encounter order, including when offsets are equal. */
  eciControls: readonly AztecECI[];
  /** Leading FNC1 was present; any embedded separators remain in the payload. */
  gs1: boolean;
  readerInitialization: boolean;
  /** Zero-based structured-append index, or -1 when absent. */
  sequenceIndex: number;
  /** Structured-append count 2..26, or 0 when absent. */
  sequenceCount: number;
  /** Optional exact identifier bytes, copied separately from the payload. */
  sequenceIdBytes: Uint8Array;
}
/** Encountered MaxiCode ECI transition, in payload byte offsets. */
export interface MaxiCodeECI {
  readonly offset: number;
  readonly assignment: number;
}
/** Exact copied bytes and metadata for one MaxiCode symbol. */
export interface MaxiCodeInfo {
  /** Independent owned bytes, including controls/NUL/high bytes, never a Wasm view.
   * Carrier modes 2/3 return only the secondary message, without prepending fields. */
  payloadBytes: Uint8Array;
  /** False requires empty Barcode.text; available empty text is distinct.
   * Text uses ISO-8859-1 by default and for ECI 3; ECI 26 requires valid UTF-8. */
  hasText: boolean;
  /** Mode 6 announces scanner programming data; Barry does not act on it. */
  mode: 2 | 3 | 4 | 5 | 6;
  /** Encoded postcode (including zeroes or space padding); null in modes 4–6. */
  postalCode: string | null;
  /** Exactly three decimal digits in modes 2/3; null in modes 4–6. */
  countryCode: string | null;
  /** Exactly three decimal digits in modes 2/3; null in modes 4–6. */
  serviceClass: string | null;
  /** Number of corrected six-bit words in the primary block. */
  primaryCorrectedCodewords: number;
  /** Total corrected six-bit words in both secondary blocks. */
  secondaryCorrectedCodewords: number;
  /** Owned records in encounter order, including when offsets are equal. */
  eciControls: readonly MaxiCodeECI[];
  /** Zero-based structured-append index, or -1 when absent. */
  sequenceIndex: number;
  /** Structured-append count 2..8, or 0 when absent. */
  sequenceCount: number;
}
/** Primary shape visible in the image; Omnidirectional and Truncated share one encoding. */
export type DataBarLayout = 'OMNIDIRECTIONAL_OR_TRUNCATED' | 'STACKED' | 'STACKED_OMNIDIRECTIONAL' |
  'LIMITED' | 'EXPANDED' | 'EXPANDED_STACKED' | 'STACKED_UNSPECIFIED';
/** Upper-component status, independent of the scan's complete/deadline state. */
export type DataBarLinkage = 'STANDALONE' | 'LINKED_UNREAD' | 'CC_A' | 'CC_B';
/** Exact, separately transmitted bytes; a CC-B escape need not be UTF-8. */
export interface DataBarPacket {
  readonly identifier: ']e1' | ']e2';
  readonly bytes: readonly number[];
}
/** Immutable GS1 DataBar evidence, owned independently of scanner or Wasm memory. */
export interface DataBarInfo {
  readonly layout: DataBarLayout;
  /** Primary data rows only; excludes separators and all upper rows. */
  readonly dataRows: number;
  readonly linkage: DataBarLinkage;
  /** Length in bytes of the primary at the start of Barcode.text. */
  readonly primaryLength: number;
  /** Supplementary scanner data's byte offset after any join GS. Null for standalone
   * or unread uppers; equals the text length for a verified empty segment. */
  readonly secondaryOffset: number | null;
  /** Additional packets, distinct from the ordinary scanner data in Barcode.text. */
  readonly extraPackets: readonly DataBarPacket[];
}
/** Encountered DotCode ECI transition in counted payload-byte offsets. */
export interface DotCodeECI {
  readonly offset: number;
  readonly assignment: number;
}
/** Exact AIM DotCode scanner data independent of the common text projection. */
export interface DotCodeInfo {
  /** Owned bytes (including NULs and GS), never a view into Wasm memory. */
  payloadBytes: Uint8Array;
  /** False requires empty Barcode.text. An available empty string is distinct. */
  hasText: boolean;
  /** Scanner output orients the lattice as odd rows and even columns. */
  rows: number;
  columns: number;
  /** Arithmetic mask only, not a corner-priming flag. */
  mask: 0 | 1 | 2 | 3;
  correctedCodewords: number;
  gs1: boolean;
  /** Announced programming data; Barry does not act on it. */
  readerProgramming: boolean;
  /** Exactly two ASCII digits when present, preserving leading zero. */
  macroFormat: string | null;
  /** Encounter order, including multiple controls at an equal byte offset. */
  eciControls: readonly DotCodeECI[];
  /** One-based index and total 2–35, or both null. Parts are not assembled. */
  sequenceIndex: number | null;
  sequenceCount: number | null;
}
/** Physical EAN/UPC subtype and the exact verified trailing supplement, if any. */
export interface EanUpcInfo {
  readonly subtype: EanUpcSubtype;
  /** Null for primary-only; otherwise exactly two or five ASCII digits. */
  readonly supplement: string | null;
}
/** Verified physical ITF subtype; digits are preserved in Barcode.text. */
export interface ItfInfo {
  readonly subtype: ItfSubtype;
}
/** Independent decoded value with image-space geometry and format-specific metadata. */
export interface Barcode extends Region {
  /** Retail text is primary digits followed by any supplement, without a separator.
   * Consult hasText on metadata for formats with independent exact byte payloads. */
  text: string;
  /** Canonical format name from supportedSymbologies. */
  symbology: Symbology;
  /** Supporting votes: linear/DataBar2..scanlines; QR/matrix/PDF1. Not a probability. */
  votes: number;
  /** Supporting linear/DataBar samples, votes..21; matrix/PDF 0. Not a quality metric. */
  scanlines: number;
  /** Finite nonnegative geometric fit residual; not calibrated confidence. */
  fitError: number;
  /** QR metadata or null for other formats. */
  readonly qrInfo: QRInfo | null;
  /** Data Matrix metadata or null for other formats. */
  dataMatrixInfo: DataMatrixInfo | null;
  /** Exact copied PDF-family metadata or null for other formats. */
  readonly pdf417Info: Pdf417Info | null;
  /** Exact copied Aztec Code metadata or null for other formats. */
  aztecInfo: AztecInfo | null;
  /** Exact copied MaxiCode metadata or null for other formats. */
  maxicodeInfo: MaxiCodeInfo | null;
  /** Verified GS1 DataBar evidence, including unread linkage, or null for other formats. */
  readonly dataBarInfo: DataBarInfo | null;
  /** Exact copied AIM DotCode metadata or null for other formats. */
  dotcodeInfo: DotCodeInfo | null;
  /** Verified retail subtype and supplement, or null for other families. */
  readonly eanUpcInfo: EanUpcInfo | null;
  /** Verified ITF subtype, or null for other families. */
  readonly itfInfo: ItfInfo | null;
}
type FamilyDetailKey = {
  QR_CODE: 'qrInfo';
  DATA_MATRIX: 'dataMatrixInfo';
  PDF417: 'pdf417Info';
  AZTEC: 'aztecInfo';
  MAXICODE: 'maxicodeInfo';
  GS1_DATABAR: 'dataBarInfo';
  DOTCODE: 'dotcodeInfo';
  EAN_UPC: 'eanUpcInfo';
  ITF: 'itfInfo';
};
/** Original record narrowed by its actual family and the corresponding present details.
 * A Code 128, Code 39 or Code 93 record has no required family-specific detail arm. */
export type BarcodeOf<S extends Symbology> = S extends keyof FamilyDetailKey
  ? Barcode & {symbology: S} & {readonly [K in FamilyDetailKey[S]]: NonNullable<Barcode[K]>}
  : Barcode & {symbology: S};
export function isBarcodeOf<S extends Symbology>(barcode: Barcode, family: S): barcode is BarcodeOf<S>;
/** 0 complete, 1 deadline, 2 region limit, 3 work limit. Earlier results remain valid on partial return. */
export const LocalizationStop: Readonly<{COMPLETE: 0; DEADLINE: 1; REGION_LIMIT: 2; WORK_LIMIT: 3}>;
export type LocalizationStop = typeof LocalizationStop[keyof typeof LocalizationStop];
/** Independent full-scan or supplied-region decode snapshot; multiplicity is retained. */
export interface DecodingResult {
  /** Independent decoded records; may be empty, even for a complete call. */
  barcodes: Barcode[];
  /** Exactly stopReason === 0; does not assert that every visible symbol decoded. */
  complete: boolean;
  /** Why processing stopped; partial records remain usable. */
  stopReason: LocalizationStop;
  /** Public invocation through validation, upload and result conversion in milliseconds. */
  elapsedMs: number;
  /** Milliseconds in the union of active native localization intervals, not
   * public-entry time or summed worker durations; zero for supplied decoding. */
  localizationMs: number;
  /** Frozen per-call allocation and participation snapshot. */
  execution: Readonly<ExecutionInfo>;
}
/** Independent localization snapshot, without performing barcode decoding. */
export interface LocalizationResult {
  /** Copied candidate quadrilaterals; candidates are not guaranteed barcodes. */
  regions: Region[];
  /** Exactly stopReason === 0, independent of candidate count. */
  complete: boolean;
  /** Completion/deadline/region/work stop code. */
  stopReason: LocalizationStop;
  /** Entire public invocation in milliseconds, including result finalization. */
  elapsedMs: number;
  /** Frozen per-call allocation and participation snapshot. */
  execution: Readonly<ExecutionInfo>;
}
/** Frozen result of module initialization; mode and capacity never grow during calls. */
export interface InitializedModule {
  /** Direct full-scan/localization owner constructor. */
  readonly Scanner: typeof Scanner;
  /** Direct supplied-region owner constructor. */
  readonly RegionDecoder: typeof RegionDecoder;
  /** Explicit selected artifact mode. */
  readonly execution: Execution;
  /** Caller-inclusive initialized capacity. */
  readonly participantCapacity: number;
  /** Exact options handshake version. */
  readonly optionsContractVersion: 6;
  /** Frozen canonical family names. */
  readonly supportedSymbologies: readonly Symbology[];
}
/** Initialize once before direct construction. Serial requires SIMD; threads also
 * require isolation, a dedicated Worker and parent-serviced fatal MessagePort.
 * Conflicting reinitialization rejects; no mode fallback or inference occurs.
 * Once artifact/pool initialization begins, rejection is cached for this module
 * instance; recovery requires a fresh owner Worker/realm, not a matching retry.
 * Preliminary option/environment validation failures are not cached.
 * @param options Immutable execution/capacity and fatal-channel selection.
 * @returns Frozen constructors and selected capability after all helpers are ready.
 */
export default function init(options?: InitOptions): Promise<Readonly<InitializedModule>>;
/** Realm-confined synchronous reusable scanner. Close explicitly to release Wasm storage. */
export class Scanner {
  /** Allocate one core owner in the initialized mode; no image is scanned. */
  constructor(options?: ExecutionOptions);
  /** True after close, including after a poisoned owner's disposal. */
  readonly closed: boolean;
  /** True after a fatal internal failure; further processing is forbidden. */
  readonly poisoned: boolean;
  /** Frozen canonical family names. */
  readonly supportedSymbologies: readonly Symbology[];
  /** Initialized allocation only; per-call actual participation is on results. */
  readonly execution: Readonly<ExecutionInfo>;
  /** Localize then decode grayscale pixels using the module image contract.
   * @param data Borrowed read-only grayscale bytes, never detached.
   * @param width Image columns, integer 1..65535.
   * @param height Image rows, integer 1..65535; total pixels <= 100,000,000.
   * @param stride Byte distance between row starts; final-row padding optional.
   * @param options Budget, formats and localization cap; defaults described above.
   * @returns Independent exact payload/geometry records, possibly partial or empty.
   */
  scanGray(data: Uint8Array, width: number, height: number, stride: number, options?: ScanOptions): DecodingResult;
  /** Localize only, with identical image/options validation and deadline semantics. */
  findRegionsGray(data: Uint8Array, width: number, height: number, stride: number, options?: ScanOptions): LocalizationResult;
  /** Idempotently release core storage; retained results remain valid. */
  close(): void;
}
/** Standalone supplied-region decoder: construction/calls do not construct a CNN. */
export class RegionDecoder {
  /** Allocate a realm-confined reusable decoder after init; no inference occurs. */
  constructor(options?: ExecutionOptions);
  /** Whether this owner has been explicitly closed. */
  readonly closed: boolean;
  /** Fatal internal failure prevents reuse; invalid caller inputs do not poison it. */
  readonly poisoned: boolean;
  /** Frozen canonical family names. */
  readonly supportedSymbologies: readonly Symbology[];
  /** Allocation snapshot with zero call participation. */
  readonly execution: Readonly<ExecutionInfo>;
  /** Decode 0..128 supplied strictly convex regions with absolute area > 1e-9
   * square pixels, without localization. Reads only finite corners, canonicalizing
   * winding/start; bounds are ignored and corners may extend outside the image.
   * Pixels use the same width/height/stride/final-row contract as Scanner.scanGray.
   * @returns Independent records; supplied region order/multiplicity is not collapsed.
   */
  decodeRegionsGray(data: Uint8Array, width: number, height: number, stride: number, regions: readonly RegionInput[], options?: DecodeOptions): DecodingResult;
  /** Idempotently release storage without invalidating earlier result snapshots. */
  close(): void;
}
/** Transport diagnostics in milliseconds, already included in async API elapsedMs. */
export interface WorkerTransport {
  /** Accepted parent queue wait plus receiver dispatch wait. */
  readonly queueMs: number;
  /** Parent dispatch to receiver arrival, measured in the shared origin domain. */
  readonly requestMs: number;
  /** Receiver completion to parent receipt. */
  readonly responseMs: number;
  /** Sum of queueMs, requestMs and responseMs; not extra decoder time. */
  readonly totalMs: number;
}
/** Async facade with a dedicated supplied-region decoder and optional helpers. */
export interface WorkerRegionDecoder {
  /** Closing drains previously accepted calls. A failed owner never accepts new work. */
  readonly status: WorkerStatus;
  /** Initialization diagnostics: readyMs is caller wait; resourceFetchMs sums
   * observed resource durations (which may overlap), both milliseconds. */
  readonly initializationTransport: Readonly<{
    /** Parent invocation through complete real worker readiness, in milliseconds. */
    readyMs: number;
    /** Sum of observed resource fetch durations, milliseconds; may overlap. */
    resourceFetchMs: number
  }>;
  /** Last settled request diagnostics, or null before the first response. */
  readonly lastTransport: Readonly<WorkerTransport> | null;
  /** Frozen canonical family names. */
  readonly supportedSymbologies: readonly Symbology[];
  /** Initialized allocation snapshot; actual participation is returned per call. */
  readonly execution: Readonly<ExecutionInfo>;
  /** Snapshot 0..128 supplied regions/options/pixels and decode without a CNN. */
  decodeRegionsGray(data: Uint8Array, width: number, height: number, stride: number, regions: readonly RegionInput[], options?: DecodeOptions): Promise<DecodingResult>;
  /** Reject new submissions, drain accepted requests and acknowledge only after
   * owners/helpers release and dispatch shutdown. Idempotent, even after failure. */
  close(): Promise<void>;
}
/** Combined worker owns a full scanner and a separate supplied-region decoder. */
export interface WorkerScanner extends WorkerRegionDecoder {
  /** Snapshot accepted pixels/options, queue and perform full scan. Same image
   * contract as direct Scanner; caller buffers are never transferred/detached. */
  scanGray(data: Uint8Array, width: number, height: number, stride: number, options?: ScanOptions): Promise<DecodingResult>;
  /** Snapshot accepted input and localize only, returning independent candidate regions. */
  findRegionsGray(data: Uint8Array, width: number, height: number, stride: number, options?: ScanOptions): Promise<LocalizationResult>;
}
/** Create a decode-only worker under the same admission, lifetime and execution
 * contract as createWorkerScanner. No full scanner is constructed. */
export function createWorkerRegionDecoder(options?: ExecutionOptions): Promise<WorkerRegionDecoder>;
/** Create one async owner with at most one active + one pending call. Overflow
 * rejects before copying/accessing rejected input. Accepted inputs/options are
 * snapshotted without detachment. One invocation deadline spans snapshot,
 * queueing, transport and client result finalization. Initialization does no scan.
 * @param options Explicit mode and caller-inclusive capacity; default serial/Auto.
 * @returns Ready owner; initialization errors reject without a serial fallback.
 */
export function createWorkerScanner(options?: ExecutionOptions): Promise<WorkerScanner>;
/** Shut down the module-wide threaded Worker stack after all direct owners close.
 * Idempotent; the module cannot subsequently reopen. Does not close direct owners.
 */
export function closeThreadPool(): void;

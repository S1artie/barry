// MIT License - see LICENSE file in the project root for details.
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Barry contributors

import {validateDotCodeInfo} from './dotcode-result.mjs';
import {symbologyBit, eanUpcSubtypeBit, itfSubtypeBit, qrSubtypeBit} from './symbology-selection.mjs';

/** Stop state is independent of the number of committed records. */
export const LocalizationStop = Object.freeze({COMPLETE: 0, DEADLINE: 1, REGION_LIMIT: 2, WORK_LIMIT: 3});

const detailKey = new Map([
  ['QR_CODE', 'qrInfo'], ['DATA_MATRIX', 'dataMatrixInfo'], ['PDF417', 'pdf417Info'],
  ['AZTEC', 'aztecInfo'], ['MAXICODE', 'maxicodeInfo'], ['GS1_DATABAR', 'dataBarInfo'],
  ['DOTCODE', 'dotcodeInfo'], ['EAN_UPC', 'eanUpcInfo'], ['ITF', 'itfInfo'],
]);

/** Narrow a decoded record without inferring missing evidence from its text or selection. */
export function isBarcodeOf(barcode, family) {
  if (barcode?.symbology !== family) return false;
  const key = detailKey.get(family);
  if (key === undefined) return symbologyBit(family) !== 0;
  const info = barcode[key];
  return info !== null && typeof info === 'object' && !Array.isArray(info);
}

// Each layout carries the compatible requested shape bits and its primary row
// count (null means Expanded Stacked's bounded variable row count).
const dataBarLayouts = new Map([
  ['OMNIDIRECTIONAL_OR_TRUNCATED', [3, 1]], ['STACKED', [4, 2]], ['STACKED_OMNIDIRECTIONAL', [8, 2]],
  ['LIMITED', [16, 1]], ['EXPANDED', [32, 1]], ['EXPANDED_STACKED', [64, null]], ['STACKED_UNSPECIFIED', [12, 2]],
]);
const microQrCorrections = [
  new Map([['DETECTION_ONLY', 0]]), new Map([['L', 5], ['M', 6]]),
  new Map([['L', 6], ['M', 8]]), new Map([['L', 8], ['M', 10], ['Q', 14]]),
];
const microPdfParity = [
  new Map([[11, 7], [14, 7], [17, 7], [20, 8], [24, 8], [28, 8]]),
  new Map([[8, 8], [11, 9], [14, 9], [17, 10], [20, 11], [23, 13], [26, 15]]),
  new Map([[6, 12], [8, 14], [10, 16], [12, 18], [15, 21], [20, 26], [26, 32], [32, 38], [38, 44], [44, 50]]),
  new Map([[4, 8], [6, 12], [8, 14], [10, 16], [12, 18], [15, 21], [20, 26], [26, 32], [32, 38], [38, 44], [44, 50]]),
];
const integer = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
const fields = (object, names) => object !== null && typeof object === 'object' && !Array.isArray(object) &&
  Reflect.ownKeys(object).length === names.length && names.every(name => Object.hasOwn(object, name));
const invalid = () => { throw new Error('invalid GS1 DataBar metadata, text or evidence'); };
const gs = '\x1d';
const textData = text => text.length > 0 && !text.startsWith(gs) && !/[^\x1d\x20-\x7e]/u.test(text) &&
  !text.endsWith(gs) && !text.includes(gs + gs);
const elementData = text => /^[0-9]/u.test(text) && textData(text);

// ISO 24723 join: GS1's closed table of predefined-length two-digit prefixes,
// not a registry of AIs. All other elements need GS before another one.
function joinWithGs(primary) {
  let start = 0;
  while (start < primary.length) {
    const ai = primary.slice(start, start + 2);
    if (!/^[0-9]{2}$/u.test(ai)) invalid();
    const prefix = Number(ai);
    if (prefix === 0) start += 20;
    else if (prefix <= 3 || prefix === 41) start += 16;
    else if (prefix === 4) start += 18;
    else if (prefix >= 11 && prefix <= 19) start += 8;
    else if (prefix === 20) start += 4;
    else if (prefix >= 31 && prefix <= 36) start += 10;
    else {
      const end = primary.indexOf(gs, start);
      if ((end === -1 ? primary.length : end) - start < 3) invalid();
      if (end === -1) return true;
      start = end + 1;
    }
  }
  if (start !== primary.length) invalid();
  return false;
}

/** Validate the counted DataBar text/packets before admitting a browser result. */
export function validateDataBarInfo(barcode, dataBarSubtypeMask, dataBarReadLinkedComponent) {
  const info = barcode.dataBarInfo;
  if (!Object.hasOwn(barcode, 'dataBarInfo')) invalid();
  if (barcode.symbology !== 'GS1_DATABAR') {
    if (info !== null) invalid();
    return null;
  }
  const {text, votes, scanlines} = barcode;
  if (![barcode.qrInfo, barcode.dataMatrixInfo, barcode.pdf417Info,
    barcode.aztecInfo, barcode.maxicodeInfo].every(value => value === null) ||
      typeof text !== 'string' || text.length > 512 || !integer(scanlines, 2, 21) || !integer(votes, 2, scanlines) ||
      !fields(info, ['layout', 'dataRows', 'linkage', 'primaryLength', 'secondaryOffset', 'extraPackets']) ||
      !dataBarLayouts.has(info.layout) || !integer(info.primaryLength, 1, text.length) ||
      !Array.isArray(info.extraPackets) || info.extraPackets.length > 54) invalid();
  const {layout, dataRows, linkage, primaryLength, secondaryOffset, extraPackets} = info;
  const [compatible, rows] = dataBarLayouts.get(layout);
  if (!(compatible & dataBarSubtypeMask) || (rows === null ? !integer(dataRows, 2, 11) : rows !== dataRows)) invalid();
  // Ordinary element data is ASCII (including GS); JS character offsets are byte offsets.
  const primary = text.slice(0, primaryLength);
  if (!elementData(primary)) invalid();
  if (layout !== 'EXPANDED' && layout !== 'EXPANDED_STACKED') {
    if (primary.length !== 16 || !/^01[0-9]{14}$/u.test(primary) ||
        (layout === 'LIMITED' && primary[2] > '1')) invalid();
    let check = 0;
    for (let i = 2; i < 16; i++) check += (primary.charCodeAt(i) - 48) * (i % 2 === 0 ? 3 : 1);
    if (check % 10 !== 0) invalid();
  }
  if (linkage === 'STANDALONE' || linkage === 'LINKED_UNREAD') {
    if (secondaryOffset !== null || primaryLength !== text.length || extraPackets.length) invalid();
    return info;
  }
  if (dataBarReadLinkedComponent === 0 || (linkage !== 'CC_A' && linkage !== 'CC_B') ||
      !integer(secondaryOffset, primaryLength, text.length)) invalid();
  const emptySecondary = secondaryOffset === text.length;
  const join = !emptySecondary && joinWithGs(primary);
  if (secondaryOffset !== primaryLength + Number(join) || (join && text[primaryLength] !== gs) ||
      (emptySecondary ? !extraPackets.length : !textData(text.slice(secondaryOffset)))) invalid();

  let total = 0;
  for (let i = 0; i < extraPackets.length; i++) {
    const packet = extraPackets[i];
    if (!fields(packet, ['identifier', 'bytes']) || !Array.isArray(packet.bytes)) invalid();
    const {identifier, bytes} = packet;
    total += bytes.length;
    if (total > 384) invalid();
    // For-of visits holes as undefined, so every counted position is checked.
    for (const byte of bytes) if (!integer(byte, 0, 255)) invalid();
    if (identifier === ']e1') {
      if (bytes.length < 3 || !integer(bytes[1], 48, 57) || !elementData(String.fromCharCode(...bytes))) invalid();
    } else if (identifier !== ']e2' || linkage !== 'CC_B' || i !== extraPackets.length - 1) invalid();
  }
  return info;
}

export function validateQrInfo(barcode, qrSubtypeMask) {
  const fail = () => { throw new Error('invalid QR metadata, evidence or selection'); };
  const q = barcode.qrInfo;
  if (barcode.symbology !== 'QR_CODE') {
    if (q !== null) fail();
    return null;
  }
  if (!fields(q, ['subtype', 'version', 'errorCorrection', 'mask', 'correctedCodewords', 'fnc1',
    'applicationIndicator', 'sequenceIndex', 'sequenceCount', 'sequenceParity']) ||
      !(qrSubtypeBit(q.subtype) & qrSubtypeMask) || barcode.votes !== 1 || barcode.scanlines !== 0 ||
      ![barcode.dataMatrixInfo, barcode.pdf417Info, barcode.aztecInfo, barcode.maxicodeInfo].every(value => value === null) ||
      typeof barcode.text !== 'string' || barcode.text.length > 8192 ||
      !integer(q.correctedCodewords, 0, 3706) || !integer(q.fnc1, 0, 2) ||
      !integer(q.sequenceCount, 0, 16) ||
      (q.sequenceCount === 0 ? q.sequenceIndex !== -1 || q.sequenceParity !== -1
        : !integer(q.sequenceIndex, 0, q.sequenceCount - 1) || !integer(q.sequenceParity, 0, 255)) ||
      (q.fnc1 === 2 ? !(integer(q.applicationIndicator, 0, 99) || integer(q.applicationIndicator, 165, 190) ||
        integer(q.applicationIndicator, 197, 222)) : q.applicationIndicator !== -1)) fail();
  if (q.subtype === 'MICRO_QR') {
    if (!integer(q.version, 1, 4) || !integer(q.correctedCodewords, 0, microQrCorrections[q.version - 1].get(q.errorCorrection)) ||
        !integer(q.mask, 0, 3) || q.fnc1 !== 0 || q.sequenceCount !== 0) fail();
  } else if (!integer(q.version, 1, q.subtype === 'MODEL_1' ? 14 : 40) ||
      !['L', 'M', 'Q', 'H'].includes(q.errorCorrection) || !integer(q.mask, 0, 7) ||
      q.subtype === 'MODEL_1' && (q.fnc1 !== 0 || q.correctedCodewords > 396)) fail();
  return q;
}

export function validatePdf417Info(barcode, pdf417SubtypeMask, rawArrays = false) {
  const fail = () => { throw new Error('invalid PDF417 metadata, evidence or selection'); };
  const p = barcode.pdf417Info;
  if (barcode.symbology !== 'PDF417') {
    if (p !== null) fail();
    return null;
  }
  if (!fields(p, ['payloadBytes', 'hasText', 'variant', 'rows', 'columns', 'errorCorrectionLevel',
    'errorCorrectionCodewords', 'correctedCodewords', 'eci', 'eciControls', 'readerInitialization', 'macroInfo']) ||
      ![barcode.qrInfo, barcode.dataMatrixInfo, barcode.aztecInfo, barcode.maxicodeInfo].every(value => value === null) ||
      barcode.votes !== 1 || barcode.scanlines !== 0 ||
      !(rawArrays ? Array.isArray(p.payloadBytes) : p.payloadBytes instanceof Uint8Array &&
        p.payloadBytes.buffer instanceof ArrayBuffer && p.payloadBytes.byteOffset === 0 &&
        p.payloadBytes.byteLength === p.payloadBytes.buffer.byteLength) ||
      p.payloadBytes.length > 4096 || typeof p.hasText !== 'boolean' || typeof p.readerInitialization !== 'boolean' ||
      typeof barcode.text !== 'string' || barcode.text.length > 8192 || (!p.hasText && barcode.text !== '') ||
      !integer(p.rows, 3, 90) || !integer(p.columns, 1, 30) ||
      !integer(p.errorCorrectionCodewords, 2, 512) || !integer(p.correctedCodewords, 0, p.errorCorrectionCodewords)) fail();
  if (rawArrays) for (const byte of p.payloadBytes) if (!integer(byte, 0, 255)) fail();
  const {variant, rows, columns, errorCorrectionLevel: level, errorCorrectionCodewords: parity} = p;
  if (variant === 'micro') {
    if (!(pdf417SubtypeMask & 2) || level !== null || microPdfParity[columns - 1]?.get(rows) !== parity) fail();
  } else if (!(pdf417SubtypeMask & 1) || !['full', 'compact'].includes(variant) ||
      !integer(level, 0, 8) || parity !== 2 ** (level + 1) || rows * columns > 928 || rows * columns <= parity + 1) fail();

  if (!Array.isArray(p.eciControls) || p.eciControls.length > 928) fail();
  let offset = 0, charset = null;
  for (const control of p.eciControls) {
    if (!fields(control, ['offset', 'control', 'assignment']) || !integer(control.offset, offset, p.payloadBytes.length) ||
        !(control.control === 927 && integer(control.assignment, 0, 899) ||
          control.control === 926 && integer(control.assignment, 900, 810899) ||
          control.control === 925 && integer(control.assignment, 810900, 811799)) ||
        p.hasText && (control.control !== 927 || ![3, 26].includes(control.assignment))) fail();
    offset = control.offset;
    if (control.control === 927) charset = control.assignment;
  }
  if (p.eci !== charset) fail();
  const m = p.macroInfo;
  if (m !== null) {
    if (!fields(m, ['segmentIndex', 'fileId', 'lastSegment', 'optionalFields']) ||
        !integer(m.segmentIndex, 0, 99998) || typeof m.fileId !== 'string' || m.fileId.length > 2784 ||
        !/^(?:[0-8][0-9]{2})+$/u.test(m.fileId) || typeof m.lastSegment !== 'boolean' ||
        !Array.isArray(m.optionalFields) || m.optionalFields.length > 928) fail();
    for (const word of m.optionalFields) if (!integer(word, 0, 928)) fail();
  }
  return p;
}

const retailWidths = new Map([['EAN_13', 13], ['EAN_8', 8], ['UPC_A', 12], ['UPC_E', 8]]);
function validateEanUpcInfo(barcode, {subtypeMask, supplementPolicy}) {
  const fail = () => { throw new Error('invalid EAN/UPC metadata, text, evidence or selection'); };
  const info = barcode.eanUpcInfo;
  if (!Object.hasOwn(barcode, 'eanUpcInfo')) fail();
  if (barcode.symbology !== 'EAN_UPC') {
    if (info !== null) fail();
    return;
  }
  const {text, votes, scanlines} = barcode;
  if (![barcode.qrInfo, barcode.dataMatrixInfo, barcode.pdf417Info, barcode.aztecInfo,
    barcode.maxicodeInfo, barcode.dataBarInfo, barcode.dotcodeInfo].every(value => value === null) ||
      !integer(scanlines, 2, 21) || !integer(votes, 2, scanlines) ||
      !fields(info, ['subtype', 'supplement'])) fail();
  const {subtype, supplement} = info;
  const width = retailWidths.get(subtype);
  if (width === undefined || !(subtypeMask & eanUpcSubtypeBit(subtype)) ||
      (supplement !== null && (typeof supplement !== 'string' || ![2, 5].includes(supplement.length)))) fail();
  const length = supplement === null ? 0 : supplement.length;
  if (typeof text !== 'string' || text.length !== width + length || /[^0-9]/u.test(text) ||
      (subtype === 'EAN_13' && text[0] === '0') || (subtype === 'UPC_E' && !/^[01]/u.test(text)) ||
      (length && text.slice(width) !== supplement) ||
      (supplementPolicy === 0 && length !== 0) ||
      (supplementPolicy === 2 && length !== 2) || (supplementPolicy === 3 && length !== 5) ||
      (supplementPolicy === 4 && length === 0)) fail();
}

function validGtin14(text) {
  let sum = 0;
  for (let i = 0; i < 14; i++) sum += (text.charCodeAt(i) - 48) * (i % 2 === 0 ? 3 : 1);
  return sum % 10 === 0;
}

function validateItfInfo(barcode, {itfSubtypeMask, itfMinLength, itfMaxLength}) {
  const fail = () => { throw new Error('invalid ITF metadata, text, evidence or selection'); };
  const info = barcode.itfInfo;
  if (!Object.hasOwn(barcode, 'itfInfo')) fail();
  if (barcode.symbology !== 'ITF') {
    if (info !== null) fail();
    return;
  }
  const {text, votes, scanlines} = barcode;
  if (![barcode.qrInfo, barcode.dataMatrixInfo, barcode.pdf417Info, barcode.aztecInfo,
    barcode.maxicodeInfo, barcode.dataBarInfo, barcode.dotcodeInfo, barcode.eanUpcInfo].every(value => value === null) ||
      !integer(scanlines, 2, 21) || !integer(votes, 2, scanlines) ||
      !fields(info, ['subtype']) || !(itfSubtypeMask & itfSubtypeBit(info.subtype)) ||
      typeof text !== 'string' || text.length < itfMinLength ||
      (itfMaxLength !== -1 && text.length > itfMaxLength)) fail();
  const length = text.length;
  if (!integer(length, 1, 128) || /[^0-9]/u.test(text)) fail();
  switch (info.subtype) {
    case 'STANDARD':
      if (length % 2 !== 0 || (length === 14 && validGtin14(text))) fail();
      break;
    case 'IATA_2_OF_5':
      if (length > 81) fail();
      break;
    case 'ITF_14':
      if (length !== 14 || !validGtin14(text)) fail();
      break;
  }
}

function derivedPdf417Subtype() {
  return this.variant === 'micro' ? 'MICROPDF417' : 'STANDARD';
}

/** Admit tagged results before exposing independent, immutable subtype/DataBar details. */
export function ownBarcodeResults(result, selection) {
  if (!Array.isArray(result.barcodes)) throw new Error('invalid Barry decoding response');
  for (const barcode of result.barcodes) {
    const bit = symbologyBit(barcode?.symbology);
    if (!bit) throw new Error('invalid Barry result symbology');
    if (!(selection.symbologyMask & bit)) throw new Error('Barry result contains an unselected symbology');
    validateItfInfo(barcode, selection);
    validateEanUpcInfo(barcode, selection);
    validateDotCodeInfo(barcode);
    const info = validateDataBarInfo(barcode, selection.dataBarSubtypeMask, selection.dataBarReadLinkedComponent);
    const qr = validateQrInfo(barcode, selection.qrSubtypeMask);
    const pdf = validatePdf417Info(barcode, selection.pdf417SubtypeMask);
    if (qr !== null) Object.defineProperty(qr, 'subtype', {writable: false, configurable: false});
    if (pdf !== null) {
      Object.defineProperty(pdf, 'variant', {writable: false, configurable: false});
      // Wire/structured-clone metadata contains only the authoritative variant.
      Object.defineProperty(pdf, 'subtype', {get: derivedPdf417Subtype});
    }
    Object.defineProperty(barcode, 'qrInfo', {writable: false, configurable: false});
    Object.defineProperty(barcode, 'pdf417Info', {writable: false, configurable: false});
    if (barcode.itfInfo !== null) Object.freeze(barcode.itfInfo);
    Object.defineProperty(barcode, 'itfInfo', {writable: false, configurable: false});
    if (barcode.eanUpcInfo !== null) Object.freeze(barcode.eanUpcInfo);
    Object.defineProperty(barcode, 'eanUpcInfo', {writable: false, configurable: false});
    if (info !== null) {
      for (const packet of info.extraPackets) {
        Object.freeze(packet.bytes);
        Object.freeze(packet);
      }
      Object.freeze(info.extraPackets);
      Object.freeze(info);
      Object.defineProperty(barcode, 'dataBarInfo', {writable: false, configurable: false});
    }
  }
}

/** A localization record carries only the five region geometry properties. */
export function isGeometryOnly(region) {
  return fields(region, ['left', 'top', 'right', 'bottom', 'corners']);
}

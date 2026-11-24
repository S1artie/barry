// MIT License - see LICENSE file in the project root for details.
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Barry contributors

const maximumBytes = 3685;
const maximumControls = 735;
const maximumTextBytes = 7370;
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const fields = (object, names) => object !== null && typeof object === 'object' && !Array.isArray(object) &&
  Object.keys(object).length === names.length && names.every(name => Object.hasOwn(object, name));
const invalid = () => { throw new Error('invalid DotCode metadata, text or evidence'); };
const utf8 = new TextDecoder('utf-8', {fatal: true, ignoreBOM: true});

// The default is ASCII, not Latin-1. Unknown and malformed charset segments
// suppress the common text, but an empty segment may have any ECI assignment.
function segment(bytes, start, end, assignment) {
  if (start === end) return '';
  if (assignment === 26) {
    try { return utf8.decode(bytes.subarray(start, end)); } catch { return null; }
  }
  if (assignment !== null && assignment !== 3) return null;
  if (assignment === null) {
    for (let i = start; i < end; i++) if (bytes[i] > 127) return null;
  }
  return String.fromCharCode(...bytes.subarray(start, end));
}

/** Check the DotCode arm before accepting either a typed browser result or its
 * ordinary byte-array representation after Playwright serialization. */
export function validateDotCodeInfo(barcode, serialized = false) {
  const info = barcode.dotcodeInfo;
  if (!Object.hasOwn(barcode, 'dotcodeInfo')) invalid();
  if (barcode.symbology !== 'DOTCODE') {
    if (info !== null) invalid();
    return null;
  }
  if (![barcode.qrInfo, barcode.dataMatrixInfo, barcode.pdf417Info, barcode.aztecInfo,
    barcode.maxicodeInfo, barcode.dataBarInfo].every(value => value === null) ||
      barcode.votes !== 1 || barcode.scanlines !== 0 || typeof barcode.text !== 'string' ||
      barcode.text.length > maximumTextBytes || !fields(info, ['payloadBytes', 'hasText', 'rows', 'columns',
        'mask', 'correctedCodewords', 'gs1', 'readerProgramming', 'macroFormat', 'eciControls',
        'sequenceIndex', 'sequenceCount'])) invalid();
  const {payloadBytes, hasText, rows, columns, mask, correctedCodewords, gs1, readerProgramming,
    macroFormat, eciControls, sequenceIndex, sequenceCount} = info;
  if (!integer(rows, 5, 200) || !integer(columns, 5, 200) || (rows + columns) % 2 !== 1 ||
      !integer(mask, 0, 3) || ![hasText, gs1, readerProgramming].every(flag => typeof flag === 'boolean') ||
      (macroFormat !== null && (typeof macroFormat !== 'string' || macroFormat.length !== 2 || !/^[0-9]{2}$/u.test(macroFormat))) ||
      (sequenceCount === null ? sequenceIndex !== null :
        !integer(sequenceCount, 2, 35) || !integer(sequenceIndex, 1, sequenceCount)) ||
      !(serialized ? Array.isArray(payloadBytes) : payloadBytes instanceof Uint8Array &&
        payloadBytes.buffer instanceof ArrayBuffer && payloadBytes.byteOffset === 0 &&
        payloadBytes.byteLength === payloadBytes.buffer.byteLength) ||
      payloadBytes.length > maximumBytes || !Array.isArray(eciControls) || eciControls.length > maximumControls) invalid();
  if ((gs1 && readerProgramming) || (macroFormat !== null && (gs1 || readerProgramming))) invalid();
  // Invert 2 + 9 * (data + 3 + floor(data / 2)) <= rows * columns / 2.
  const available = Math.floor((rows * columns / 2 - 2) / 9);
  const data = Math.floor((2 * Math.max(0, available - 3) + 1) / 3);
  if (data === 0 || !integer(correctedCodewords, 0, 3 + Math.floor(data / 2))) invalid();
  let bytes = payloadBytes;
  if (serialized) {
    // for...of also rejects holes, rather than silently treating them as zero.
    for (const byte of payloadBytes) if (!integer(byte, 0, 255)) invalid();
    bytes = Uint8Array.from(payloadBytes);
  }
  if (macroFormat !== null) {
    // The general macro can encode any format digits, including 05/06/12.
    // The dedicated forms have the same prefix/trailer with extra GS/RS bytes.
    const prefix = `[)>\x1e${macroFormat}`;
    if (bytes.length <= prefix.length || segment(bytes, 0, prefix.length, null) !== prefix ||
        bytes[bytes.length - 1] !== 4) invalid();
  }
  let offset = 0, assignment = null, projected = '';
  for (const control of eciControls) {
    if (!fields(control, ['offset', 'assignment']) || !integer(control.offset, offset, bytes.length) ||
        !integer(control.assignment, 0, 811799)) invalid();
    if (projected !== null) {
      const part = segment(bytes, offset, control.offset, assignment);
      projected = part === null ? null : projected + part;
    }
    offset = control.offset;
    assignment = control.assignment;
  }
  if (projected !== null) {
    const part = segment(bytes, offset, bytes.length, assignment);
    projected = part === null ? null : projected + part;
  }
  if (hasText !== (projected !== null) || barcode.text !== (projected ?? '')) invalid();
  return info;
}

// MIT License - see LICENSE file in the project root for details.
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Barry contributors

import {tagError} from './barry-error.mjs';

// Stable family IDs, not array ordinals. Retired IDs 1–4, 8–9 and 13 are not aliases.
const familyBits = new Map([
  ['CODE_128', 0x10], ['CODE_39', 0x20], ['CODE_93', 0x40],
  ['QR_CODE', 0x200], ['DATA_MATRIX', 0x400], ['PDF417', 0x800],
  ['AZTEC', 0x2000], ['MAXICODE', 0x4000], ['GS1_DATABAR', 0x8000],
  ['DOTCODE', 0x10000], ['EAN_UPC', 0x20000], ['ITF', 0x40000],
]);
const subtypeBits = new Map([['EAN_13', 1], ['EAN_8', 2], ['UPC_A', 4], ['UPC_E', 8]]);
const itfSubtypeBits = new Map([['STANDARD', 1], ['IATA_2_OF_5', 2], ['ITF_14', 4]]);
const qrSubtypeBits = new Map([['MODEL_1', 1], ['MODEL_2', 2], ['MICRO_QR', 4]]);
const subtypeFamilies = new Map([
  ['qr', ['qrSubtypeMask', qrSubtypeBits]],
  ['pdf417', ['pdf417SubtypeMask', new Map([['STANDARD', 1], ['MICROPDF417', 2]])]],
  ['dataBar', ['dataBarSubtypeMask', new Map([['OMNIDIRECTIONAL', 1], ['TRUNCATED', 2],
    ['STACKED', 4], ['STACKED_OMNIDIRECTIONAL', 8], ['LIMITED', 16], ['EXPANDED', 32], ['EXPANDED_STACKED', 64]])]],
]);
const policies = new Map([
  ['IGNORE', 0], ['READ_IF_FOUND', 1], ['REQUIRE_2', 2], ['REQUIRE_5', 3], ['REQUIRE_2_OR_5', 4],
]);
export const supportedSymbologies = Object.freeze([...familyBits.keys()]);
export const supportedSymbologyMask = 0x7ee70;
export const symbologyBit = name => familyBits.get(name) ?? 0;
export const eanUpcSubtypeBit = name => subtypeBits.get(name) ?? 0;
export const itfSubtypeBit = name => itfSubtypeBits.get(name) ?? 0;
export const qrSubtypeBit = name => qrSubtypeBits.get(name) ?? 0;
export const familySubtypeNames = (family, mask) =>
  [...subtypeFamilies.get(family)[1]].filter(([, bit]) => mask & bit).map(([name]) => name);

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const record = value => {
  if (!object(value) || Object.prototype.toString.call(value) !== '[object Object]') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || Object.getPrototypeOf(prototype) === null;
};
const onlyKeys = (value, keys) => Reflect.ownKeys(value).every(key => keys.includes(key));
const digitCount = value => Number.isInteger(value) && value >= 0 && value <= 0x7fffffff;
function maskOf(names, bits, label) {
  if (!Array.isArray(names)) throw new RangeError(`${label} must be an array of canonical names`);
  let mask = 0;
  for (const name of names) {
    const bit = bits.get(name);
    if (bit === undefined) throw new RangeError(`unknown ${label} name`);
    mask |= bit;
  }
  return mask;
}

/** Resolve all ten selection words, validating nested options even for disabled families. */
export function scanOptions(options = {}, localization, supplied = false) {
  const invalid = () => { throw new RangeError(localization ? 'invalid localization options' : 'invalid decoding options'); };
  if (!object(options)) invalid();
  const {budgetMs = 0, symbologies} = options;
  let maxRegions = 128;
  if (!supplied) ({maxRegions = 32} = options);
  if (!Number.isSafeInteger(budgetMs) || budgetMs < 0 || !Number.isInteger(maxRegions) || maxRegions < 1 || maxRegions > 128) invalid();
  let symbologyMask = supportedSymbologyMask, subtypeMask = 0xf, supplementPolicy = 0;
  let itfSubtypeMask = 7, itfMinLength = 0, itfMaxLength = -1;
  if (symbologies !== undefined) {
    if (!record(symbologies) || !Object.hasOwn(symbologies, 'enabled') ||
        !onlyKeys(symbologies, ['enabled', 'eanUpc', 'itf', 'qr', 'pdf417', 'dataBar'])) {
      throw new RangeError('symbologies must be an object with enabled and optional family selections');
    }
    symbologyMask = maskOf(symbologies.enabled, familyBits, 'symbology');
    const eanUpc = symbologies.eanUpc;
    if (eanUpc !== undefined) {
      if (!record(eanUpc) || !onlyKeys(eanUpc, ['subtypes', 'supplement'])) {
        throw new RangeError('invalid eanUpc selection');
      }
      const {subtypes, supplement = 'IGNORE'} = eanUpc;
      if (subtypes !== undefined) subtypeMask = maskOf(subtypes, subtypeBits, 'EAN/UPC subtype');
      supplementPolicy = policies.get(supplement);
      if (supplementPolicy === undefined) throw new RangeError('invalid EAN/UPC supplement policy');
    }
    const itf = symbologies.itf;
    if (itf !== undefined) {
      if (!record(itf) || !onlyKeys(itf, ['subtypes', 'minLength', 'maxLength'])) {
        throw new RangeError('invalid itf selection');
      }
      const {subtypes, minLength, maxLength} = itf;
      if (subtypes !== undefined) itfSubtypeMask = maskOf(subtypes, itfSubtypeBits, 'ITF subtype');
      if ((minLength !== undefined && !digitCount(minLength)) ||
          (maxLength !== undefined && !digitCount(maxLength)) ||
          (minLength !== undefined && maxLength !== undefined && maxLength < minLength)) {
        throw new RangeError('invalid ITF digit bounds');
      }
      itfMinLength = minLength ?? 0;
      itfMaxLength = maxLength ?? -1;
    }
  }
  const result = {budgetMs, maxRegions, symbologyMask, subtypeMask, supplementPolicy, itfSubtypeMask, itfMinLength, itfMaxLength};
  let dataBarReadLinkedComponent = 1;
  for (const [family, [field, bits]] of subtypeFamilies) {
    const settings = symbologies?.[family];
    if (settings !== undefined &&
        (!record(settings) || !onlyKeys(settings, family === 'dataBar' ? ['subtypes', 'readLinkedComponent'] : ['subtypes']))) {
      throw new RangeError(`invalid ${family} selection`);
    }
    const subtypes = settings?.subtypes;
    result[field] = subtypes === undefined ? (1 << bits.size) - 1 : maskOf(subtypes, bits, `${family} subtype`);
    if (family === 'dataBar' && settings && Object.hasOwn(settings, 'readLinkedComponent')) {
      const readLinkedComponent = settings.readLinkedComponent;
      if (typeof readLinkedComponent !== 'boolean') throw new RangeError('invalid DataBar readLinkedComponent');
      dataBarReadLinkedComponent = Number(readLinkedComponent);
    }
  }
  result.dataBarReadLinkedComponent = dataBarReadLinkedComponent;
  return result;
}

const decodeOptionKeys = ['budgetMs', 'symbologies'];
const searchOptionKeys = [...decodeOptionKeys, 'maxRegions'];

// A configuration from another window has a different Object.prototype. Accept
// that prototype (or null), but not class instances or inherited option records.
function plainOptions(value) {
  if (!object(value)) return false;
  const proto = Object.getPrototypeOf(value);
  if (proto === null || proto === Object.prototype) return true;
  if (Object.getPrototypeOf(proto) !== null) return false;
  const ctor = Object.getOwnPropertyDescriptor(proto, 'constructor')?.value;
  return typeof ctor === 'function' && ctor.prototype === proto &&
    Function.prototype.toString.call(ctor) === Function.prototype.toString.call(Object);
}

/** Opt-in strict validation for configuration loaders, before any owner is needed. */
export function validateScanOptions(operation, options) {
  try {
    const supplied = operation === 'decodeRegionsGray';
    const localization = operation === 'findRegionsGray';
    if (!supplied && !localization && operation !== 'scanGray') {
      throw new RangeError('unknown Barry scan operation');
    }
    if (options === undefined) return;
    if (!plainOptions(options)) throw new TypeError('scan options must be a plain record');
    if (!onlyKeys(options, supplied ? decodeOptionKeys : searchOptionKeys)) {
      throw new RangeError(`unknown option for ${operation}`);
    }
    scanOptions(options, localization, supplied);
  } catch (error) {
    throw tagError(error, 'INVALID_ARGUMENT');
  }
}

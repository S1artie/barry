// MIT License - see LICENSE file in the project root for details.
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Barry contributors
import {tagError} from './barry-error.mjs';

// These intrinsic getters consult the internal typed-array slots, not a caller's
// prototype, overridden properties, Symbol.toStringTag, subarray or species.
const typedArray = Object.getPrototypeOf(Uint8Array.prototype);
const getter = key => Object.getOwnPropertyDescriptor(typedArray, key).get;
const kindOf = getter(Symbol.toStringTag), lengthOf = getter('byteLength');
const bufferOf = getter('buffer'), offsetOf = getter('byteOffset');
const integer = (value, minimum, maximum) => Number.isInteger(value) && value >= minimum && value <= maximum;
const invalid = message => { throw tagError(new RangeError(message), 'INVALID_ARGUMENT'); };

/** Borrow exactly the required bytes (including inter-row padding) for direct upload. */
export function imageSpan(data, width, height, stride) {
  if (!integer(width, 1, 65535) || !integer(height, 1, 65535) || width * height > 100_000_000) {
    invalid('invalid image dimensions');
  }
  if (!integer(stride, width, 0xffffffff)) invalid('invalid stride');
  const required = (height - 1) * stride + width;
  if (required > 0xffffffff) invalid('image buffer too small');
  if (kindOf.call(data) !== 'Uint8Array') throw tagError(new TypeError('image data must be Uint8Array'), 'INVALID_ARGUMENT');
  const length = lengthOf.call(data);
  if (length < required) invalid('image buffer too small');
  // Reborrow using the actual backing window, including for foreign realms and shared input.
  return new Uint8Array(bufferOf.call(data), offsetOf.call(data), required);
}

/** Snapshot accepted caller pixels into a private, transferable ArrayBuffer. */
export function snapshotImage(data, width, height, stride) {
  return new Uint8Array(imageSpan(data, width, height, stride));
}

function quad(region) {
  if (region === null || typeof region !== 'object' || Array.isArray(region)) invalid('invalid decoding region');
  const corners = region.corners;
  if (!Array.isArray(corners) || corners.length !== 8) invalid('invalid decoding region');
  // Read exactly eight scalar indices once, not even the caller's iterator.
  const points = new Array(8);
  for (let i = 0; i < 8; i++) {
    const value = corners[i];
    if (!Number.isFinite(value)) invalid('invalid decoding region');
    points[i] = value;
  }
  let direction = 0, first = 0;
  for (let i = 0; i < 4; i++) {
    const a = i * 2, b = (a + 2) % 8, c = (a + 4) % 8;
    const cross = (points[b] - points[a]) * (points[c + 1] - points[b + 1])
      - (points[b + 1] - points[a + 1]) * (points[c] - points[b]);
    if (!Number.isFinite(cross) || cross === 0 || (i !== 0 && direction !== Math.sign(cross))) invalid('invalid decoding region');
    direction = Math.sign(cross);
    if (points[a + 1] < points[first + 1] || (points[a + 1] === points[first + 1] && points[a] < points[first])) first = a;
  }
  // Triangulate about vertex 0, avoiding cancellation due to absolute coordinates.
  const area = ((points[2] - points[0]) * (points[5] - points[1]) - (points[3] - points[1]) * (points[4] - points[0])
    + ((points[4] - points[0]) * (points[7] - points[1]) - (points[5] - points[1]) * (points[6] - points[0]))) / 2;
  if (!Number.isFinite(area) || Math.abs(area) <= 1e-9) invalid('invalid decoding region');
  if (first === 0 && direction > 0) return {corners: points};
  const canonical = new Array(8);
  for (let i = 0; i < 8; i += 2) {
    const index = (first + 8 + direction * i) % 8;
    canonical[i] = points[index]; canonical[i + 1] = points[index + 1];
  }
  return {corners: canonical};
}

/** Return private, canonical corner records; neither read bounds nor clone foreign graphs. */
export function canonicalRegions(regions) {
  try {
    if (!Array.isArray(regions)) invalid('invalid decoding region');
    const count = regions.length;
    if (!Number.isInteger(count) || count < 0) invalid('invalid decoding region');
    if (count > 128) invalid('at most 128 decoding regions required');
    const result = new Array(count);
    for (let i = 0; i < count; i++) result[i] = quad(regions[i]);
    return result;
  } catch (error) {
    throw tagError(error, 'INVALID_ARGUMENT');
  }
}

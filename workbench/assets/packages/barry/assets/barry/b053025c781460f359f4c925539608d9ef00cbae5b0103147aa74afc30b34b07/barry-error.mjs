// MIT License - see LICENSE file in the project root for details.
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Barry contributors

const codes = new Set(['INVALID_ARGUMENT', 'QUEUE_FULL', 'CLOSED', 'INITIALIZATION_FAILED', 'OWNER_FAILED']);

// Thrown values can come from another realm or from arbitrary application getters.
function field(value, key) {
  try { return value?.[key]; } catch { return undefined; }
}

/** Recognize only the public recovery codes. No English/realm-based inference. */
export function classifyBarryError(value) {
  const code = field(value, 'barryCode');
  return codes.has(code) ? code : undefined;
}

function bounded(value, limit, fallback) {
  return typeof value === 'string' ? value.slice(0, limit) : fallback;
}

function description(value) {
  const record = {
    name: bounded(field(value, 'name'), 128, 'Error'),
    message: bounded(field(value, 'message'), 2048, bounded(value, 2048, 'Barry worker failed')),
  };
  const stack = bounded(field(value, 'stack'), 8192);
  if (stack !== undefined) record.stack = stack;
  return record;
}

/** Only bounded diagnostic strings, one cause, and Barry's own recovery facts cross a port. */
export function errorRecord(error) {
  const record = description(error);
  const cause = field(error, 'cause');
  if (cause !== undefined && cause !== null) record.cause = description(cause);
  const code = classifyBarryError(error);
  if (code !== undefined) record.barryCode = code;
  if (field(error, 'fatal') === true) record.fatal = true;
  return record;
}

function fromDescription(record, options) {
  const error = new Error(record.message, options);
  error.name = record.name;
  if (record.stack !== undefined) error.stack = record.stack;
  return error;
}

export function remoteError(value) {
  const record = errorRecord(value);
  const error = fromDescription(record, record.cause && {cause: fromDescription(record.cause)});
  if (record.barryCode !== undefined) error.barryCode = record.barryCode;
  if (record.fatal) error.fatal = true;
  return error;
}

/** Preserve the original local exception/type where possible, including its cause. */
export function tagError(error, code) {
  try {
    Object.defineProperty(error, 'barryCode', {value: code, configurable: true, enumerable: true, writable: true});
    return error;
  } catch {
    // Primitive, frozen or otherwise unmodifiable exception. Do not mutate its cause graph.
    const wrapped = fromDescription(description(error), {cause: error});
    wrapped.barryCode = code;
    return wrapped;
  }
}

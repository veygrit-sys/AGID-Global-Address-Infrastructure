export const TOPOGRAPHIC_COG_VALIDATION_RECEIPT_SCHEMA =
  'agid-topographic-cog-validation-receipt-v0.1';
export const TOPOGRAPHIC_COG_VALIDATOR_COMMAND =
  'gdal driver cog validate';
export const TOPOGRAPHIC_COG_VALIDATOR_MINIMUM_VERSION = '3.13.0';

const sha256Pattern = /^sha256:[a-f0-9]{64}$/i;
const gdalVersionPattern = /^(\d+)\.(\d+)\.(\d+)$/;

export type TopographicCogValidationReceipt = {
  schemaVersion: typeof TOPOGRAPHIC_COG_VALIDATION_RECEIPT_SCHEMA;
  validatedAt: string;
  validator: {
    command: typeof TOPOGRAPHIC_COG_VALIDATOR_COMMAND;
    gdalVersion: string;
    fullCheck: 'yes';
  };
  input: {
    contentSha256: `sha256:${string}`;
    byteLength: number;
  };
  rawReport: {
    fileName: string;
    sha256: `sha256:${string}`;
    byteLength: number;
  };
  result: {
    status: 'passed' | 'blocked';
    exitCode: number;
    warningCount: number;
    errorCount: number;
  };
};

export type TopographicCogValidationEvidence = {
  receiptSha256: `sha256:${string}`;
  validatedAt: string;
  gdalVersion: string;
  fullCheck: 'yes';
  rawReportSha256: `sha256:${string}`;
  rawReportByteLength: number;
};

function asObject(value: unknown, field: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${field} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function requireOnlyKeys(
  object: Record<string, unknown>,
  field: string,
  allowed: readonly string[],
) {
  const allowedKeys = new Set(allowed);
  const unknown = Object.keys(object).find(key => !allowedKeys.has(key));
  if (unknown) throw new Error(`${field} contains unsupported field ${unknown}.`);
}

function asIsoTimestamp(value: unknown, field: string) {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) {
    throw new Error(`${field} must be an ISO timestamp.`);
  }
  return new Date(value).toISOString();
}

function asSha256(value: unknown, field: string) {
  if (typeof value !== 'string' || !sha256Pattern.test(value)) {
    throw new Error(`${field} must be a SHA-256 digest.`);
  }
  return value.toLowerCase() as `sha256:${string}`;
}

function asPositiveInteger(value: unknown, field: string) {
  if (!Number.isSafeInteger(value) || Number(value) <= 0) {
    throw new Error(`${field} must be a positive integer.`);
  }
  return Number(value);
}

function asNonNegativeInteger(value: unknown, field: string) {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new Error(`${field} must be a non-negative integer.`);
  }
  return Number(value);
}

function asSafeFileName(value: unknown, field: string) {
  if (
    typeof value !== 'string'
    || !value.trim()
    || value.length > 255
    || value !== value.trim()
    || /[\\/\0]/.test(value)
  ) {
    throw new Error(`${field} must be a bounded basename without path separators.`);
  }
  return value;
}

export function compareGdalVersions(left: string, right: string) {
  const leftMatch = left.match(gdalVersionPattern);
  const rightMatch = right.match(gdalVersionPattern);
  if (!leftMatch || !rightMatch) {
    throw new Error('GDAL versions must use major.minor.patch syntax.');
  }
  for (let index = 1; index <= 3; index += 1) {
    const difference = Number(leftMatch[index]) - Number(rightMatch[index]);
    if (difference !== 0) return difference;
  }
  return 0;
}

function validateReceipt(value: unknown): TopographicCogValidationReceipt {
  const receipt = asObject(value, 'COG validation receipt');
  requireOnlyKeys(receipt, 'COG validation receipt', [
    'schemaVersion',
    'validatedAt',
    'validator',
    'input',
    'rawReport',
    'result',
  ]);
  if (receipt.schemaVersion !== TOPOGRAPHIC_COG_VALIDATION_RECEIPT_SCHEMA) {
    throw new Error('COG validation receipt schemaVersion is unsupported.');
  }
  const validator = asObject(receipt.validator, 'COG validation receipt.validator');
  requireOnlyKeys(validator, 'COG validation receipt.validator', [
    'command',
    'gdalVersion',
    'fullCheck',
  ]);
  if (validator.command !== TOPOGRAPHIC_COG_VALIDATOR_COMMAND) {
    throw new Error('COG validation receipt must use the GDAL COG validator command.');
  }
  if (typeof validator.gdalVersion !== 'string') {
    throw new Error('COG validation receipt.validator.gdalVersion must be a string.');
  }
  if (
    compareGdalVersions(
      validator.gdalVersion,
      TOPOGRAPHIC_COG_VALIDATOR_MINIMUM_VERSION,
    ) < 0
  ) {
    throw new Error(
      `COG validation receipt requires GDAL ${TOPOGRAPHIC_COG_VALIDATOR_MINIMUM_VERSION} or newer.`,
    );
  }
  if (validator.fullCheck !== 'yes') {
    throw new Error('COG validation receipt must require GDAL --full-check=yes.');
  }
  const input = asObject(receipt.input, 'COG validation receipt.input');
  requireOnlyKeys(input, 'COG validation receipt.input', [
    'contentSha256',
    'byteLength',
  ]);
  const rawReport = asObject(receipt.rawReport, 'COG validation receipt.rawReport');
  requireOnlyKeys(rawReport, 'COG validation receipt.rawReport', [
    'fileName',
    'sha256',
    'byteLength',
  ]);
  const result = asObject(receipt.result, 'COG validation receipt.result');
  requireOnlyKeys(result, 'COG validation receipt.result', [
    'status',
    'exitCode',
    'warningCount',
    'errorCount',
  ]);
  const exitCode = asNonNegativeInteger(result.exitCode, 'COG validation receipt.result.exitCode');
  const warningCount = asNonNegativeInteger(
    result.warningCount,
    'COG validation receipt.result.warningCount',
  );
  const errorCount = asNonNegativeInteger(
    result.errorCount,
    'COG validation receipt.result.errorCount',
  );
  const passed = exitCode === 0 && warningCount === 0 && errorCount === 0;
  if (result.status !== (passed ? 'passed' : 'blocked')) {
    throw new Error('COG validation receipt.result.status does not match the strict validator policy.');
  }
  return {
    schemaVersion: TOPOGRAPHIC_COG_VALIDATION_RECEIPT_SCHEMA,
    validatedAt: asIsoTimestamp(receipt.validatedAt, 'COG validation receipt.validatedAt'),
    validator: {
      command: TOPOGRAPHIC_COG_VALIDATOR_COMMAND,
      gdalVersion: validator.gdalVersion,
      fullCheck: 'yes',
    },
    input: {
      contentSha256: asSha256(input.contentSha256, 'COG validation receipt.input.contentSha256'),
      byteLength: asPositiveInteger(input.byteLength, 'COG validation receipt.input.byteLength'),
    },
    rawReport: {
      fileName: asSafeFileName(rawReport.fileName, 'COG validation receipt.rawReport.fileName'),
      sha256: asSha256(rawReport.sha256, 'COG validation receipt.rawReport.sha256'),
      byteLength: asPositiveInteger(rawReport.byteLength, 'COG validation receipt.rawReport.byteLength'),
    },
    result: {
      status: passed ? 'passed' : 'blocked',
      exitCode,
      warningCount,
      errorCount,
    },
  };
}

export function parseTopographicCogValidationReceipt(data: string) {
  let value: unknown;
  try {
    value = JSON.parse(data);
  } catch {
    throw new Error('COG validation receipt must be valid JSON.');
  }
  return validateReceipt(value);
}

export function createTopographicCogValidationReceipt(
  input: TopographicCogValidationReceipt,
) {
  return validateReceipt(input);
}

export function requirePassedTopographicCogValidation(
  receipt: TopographicCogValidationReceipt,
  expectedContentSha256: `sha256:${string}`,
) {
  if (receipt.input.contentSha256 !== expectedContentSha256.toLowerCase()) {
    throw new Error('COG validation receipt is not bound to the expected GeoTIFF digest.');
  }
  if (receipt.result.status !== 'passed') {
    throw new Error('COG validation receipt is blocked by validator findings.');
  }
  return receipt;
}

/**
 * Reduces a retained validator receipt to the integrity fields that may travel
 * with a derived artifact. The raw report remains a separately retained file.
 */
export function bindPassedTopographicCogValidationEvidence(input: {
  receipt: TopographicCogValidationReceipt;
  receiptSha256: `sha256:${string}`;
  expectedContentSha256: `sha256:${string}`;
  expectedByteLength: number;
}): TopographicCogValidationEvidence {
  const receipt = requirePassedTopographicCogValidation(
    createTopographicCogValidationReceipt(input.receipt),
    input.expectedContentSha256,
  );
  if (receipt.input.byteLength !== asPositiveInteger(
    input.expectedByteLength,
    'expected COG input byteLength',
  )) {
    throw new Error('COG validation receipt is not bound to the expected GeoTIFF byte length.');
  }
  return {
    receiptSha256: asSha256(input.receiptSha256, 'COG validation receipt SHA-256'),
    validatedAt: receipt.validatedAt,
    gdalVersion: receipt.validator.gdalVersion,
    fullCheck: 'yes',
    rawReportSha256: receipt.rawReport.sha256,
    rawReportByteLength: receipt.rawReport.byteLength,
  };
}

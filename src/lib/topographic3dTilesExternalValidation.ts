export const TOPOGRAPHIC_3D_TILES_EXTERNAL_VALIDATION_SCHEMA =
  'agid-topographic-3d-tiles-external-validation-v0.1';
export const TOPOGRAPHIC_3D_TILES_VALIDATOR_NAME =
  'CesiumGS 3D Tiles Validator';
export const TOPOGRAPHIC_3D_TILES_VALIDATOR_VERSION = '0.6.1';
export const TOPOGRAPHIC_3D_TILES_VALIDATOR_PACKAGE =
  'https://www.npmjs.com/package/3d-tiles-validator/v/0.6.1';
export const TOPOGRAPHIC_3D_TILES_VALIDATOR_LICENSE = 'Apache-2.0';

export type Topographic3dTilesValidatorReport = {
  date: string;
  numErrors: number;
  numWarnings: number;
  numInfos: number;
  issues?: unknown[];
};

export type Topographic3dTilesExternalValidation = {
  schemaVersion: typeof TOPOGRAPHIC_3D_TILES_EXTERNAL_VALIDATION_SCHEMA;
  validator: {
    name: typeof TOPOGRAPHIC_3D_TILES_VALIDATOR_NAME;
    version: typeof TOPOGRAPHIC_3D_TILES_VALIDATOR_VERSION;
    packageUrl: typeof TOPOGRAPHIC_3D_TILES_VALIDATOR_PACKAGE;
    licenseId: typeof TOPOGRAPHIC_3D_TILES_VALIDATOR_LICENSE;
  };
  validatedAt: string;
  input: {
    tilesetFileName: string;
    tilesetSha256: `sha256:${string}`;
    internalEvidenceFileName: string;
    internalEvidenceSha256: `sha256:${string}`;
  };
  report: {
    fileName: string;
    sha256: `sha256:${string}`;
    numErrors: number;
    numWarnings: number;
    numInfos: number;
  };
  result: {
    status: 'passed' | 'blocked';
    policy: 'zero-errors-and-zero-warnings';
    issueCodes: string[];
  };
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function requireCount(
  object: Record<string, unknown>,
  field: 'numErrors' | 'numWarnings' | 'numInfos',
) {
  const value = object[field];
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new Error(`3D Tiles validator report ${field} must be a nonnegative integer.`);
  }
  return Number(value);
}

export function parseTopographic3dTilesValidatorReport(
  reportData: string,
): Topographic3dTilesValidatorReport {
  let value: unknown;
  try {
    value = JSON.parse(reportData);
  } catch {
    throw new Error('3D Tiles validator report must be valid JSON.');
  }
  if (!isObject(value)) {
    throw new Error('3D Tiles validator report must be an object.');
  }
  const date = value.date;
  if (
    typeof date !== 'string'
    || !Number.isFinite(Date.parse(date))
  ) {
    throw new Error('3D Tiles validator report date must be an ISO timestamp.');
  }
  const numErrors = requireCount(value, 'numErrors');
  const numWarnings = requireCount(value, 'numWarnings');
  const numInfos = requireCount(value, 'numInfos');
  const rawIssues = value.issues;
  let issues: unknown[] | undefined;
  if (rawIssues !== undefined) {
    if (!Array.isArray(rawIssues)) {
      throw new Error('3D Tiles validator report issues must be an array when present.');
    }
    issues = rawIssues;
  }
  const expectedIssueCount = numErrors + numWarnings + numInfos;
  if ((issues?.length ?? 0) !== expectedIssueCount) {
    throw new Error('3D Tiles validator report issue counts do not match its issues array.');
  }
  return {
    date: new Date(date).toISOString(),
    numErrors,
    numWarnings,
    numInfos,
    ...(issues ? { issues } : {}),
  };
}

export function createTopographic3dTilesExternalValidation(input: {
  reportData: string;
  reportFileName: string;
  reportSha256: `sha256:${string}`;
  tilesetFileName: string;
  tilesetSha256: `sha256:${string}`;
  internalEvidenceFileName: string;
  internalEvidenceSha256: `sha256:${string}`;
}): Topographic3dTilesExternalValidation {
  const report = parseTopographic3dTilesValidatorReport(input.reportData);
  const issueCodes: string[] = [];
  if (report.numErrors > 0) issueCodes.push('validator-errors-present');
  if (report.numWarnings > 0) issueCodes.push('validator-warnings-present');
  const status = issueCodes.length === 0 ? 'passed' : 'blocked';
  return {
    schemaVersion: TOPOGRAPHIC_3D_TILES_EXTERNAL_VALIDATION_SCHEMA,
    validator: {
      name: TOPOGRAPHIC_3D_TILES_VALIDATOR_NAME,
      version: TOPOGRAPHIC_3D_TILES_VALIDATOR_VERSION,
      packageUrl: TOPOGRAPHIC_3D_TILES_VALIDATOR_PACKAGE,
      licenseId: TOPOGRAPHIC_3D_TILES_VALIDATOR_LICENSE,
    },
    validatedAt: report.date,
    input: {
      tilesetFileName: input.tilesetFileName,
      tilesetSha256: input.tilesetSha256,
      internalEvidenceFileName: input.internalEvidenceFileName,
      internalEvidenceSha256: input.internalEvidenceSha256,
    },
    report: {
      fileName: input.reportFileName,
      sha256: input.reportSha256,
      numErrors: report.numErrors,
      numWarnings: report.numWarnings,
      numInfos: report.numInfos,
    },
    result: {
      status,
      policy: 'zero-errors-and-zero-warnings',
      issueCodes,
    },
  };
}

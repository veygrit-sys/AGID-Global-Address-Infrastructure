import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createTopographic3dTilesExternalValidation,
  TOPOGRAPHIC_3D_TILES_VALIDATOR_VERSION,
} from '../src/lib/topographic3dTilesExternalValidation';

const DEFAULT_DIRECTORY = join(
  'output',
  'topographic-3d-tiles-conformance',
);
export const TOPOGRAPHIC_3D_TILES_VALIDATOR_REPORT_FILE =
  `cesium-validator-${TOPOGRAPHIC_3D_TILES_VALIDATOR_VERSION}.json`;
export const TOPOGRAPHIC_3D_TILES_INTERNAL_EVIDENCE_FILE =
  'tileset.evidence.json';
export const TOPOGRAPHIC_3D_TILES_EXTERNAL_EVIDENCE_FILE =
  'external-validator.evidence.json';
export const MAX_TOPOGRAPHIC_3D_TILES_VALIDATION_JSON_BYTES = 4 * 1024 * 1024;

function argument(name: string, fallback: string) {
  const inline = process.argv.find(value => value.startsWith(`${name}=`));
  if (inline) return resolve(inline.slice(name.length + 1));
  const index = process.argv.indexOf(name);
  return resolve(
    index >= 0 && process.argv[index + 1]
      ? process.argv[index + 1]
      : fallback,
  );
}

function sha256(data: string) {
  return `sha256:${createHash('sha256').update(data).digest('hex')}` as const;
}

function readBoundUtf8(path: string, field: string) {
  const resolvedPath = resolve(path);
  const stat = statSync(resolvedPath);
  if (
    !stat.isFile()
    || stat.size <= 0
    || stat.size > MAX_TOPOGRAPHIC_3D_TILES_VALIDATION_JSON_BYTES
  ) {
    throw new Error(
      `${field} must be a non-empty regular file no larger than ${MAX_TOPOGRAPHIC_3D_TILES_VALIDATION_JSON_BYTES} bytes.`,
    );
  }
  try {
    return {
      path: resolvedPath,
      data: new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(resolvedPath)),
    };
  } catch {
    throw new Error(`${field} must contain valid UTF-8.`);
  }
}

function requireCanonicalFileName(path: string, expected: string, field: string) {
  if (basename(path) !== expected) {
    throw new Error(`${field} must use the canonical file name ${expected}.`);
  }
}

function readInternalEvidence(
  evidenceData: string,
  actualTilesetSha256: `sha256:${string}`,
) {
  const evidence = JSON.parse(evidenceData) as {
    files?: Array<{
      role?: string;
      fileName?: string;
      sha256?: string;
    }>;
  };
  const tileset = evidence.files?.find(file => file.role === 'tileset');
  if (
    tileset?.fileName !== 'tileset.json'
    || tileset.sha256 !== actualTilesetSha256
  ) {
    throw new Error(
      'Internal 3D Tiles evidence does not bind the validator input tileset.',
    );
  }
}

export function verifyTopographic3dTilesValidatorReportFiles(input: {
  reportPath: string;
  tilesetPath: string;
  evidencePath: string;
  outputPath: string;
}) {
  const report = readBoundUtf8(input.reportPath, '3D Tiles validator report');
  const tileset = readBoundUtf8(input.tilesetPath, '3D Tiles tileset');
  const evidence = readBoundUtf8(input.evidencePath, '3D Tiles internal evidence');
  const outputPath = resolve(input.outputPath);
  requireCanonicalFileName(
    report.path,
    TOPOGRAPHIC_3D_TILES_VALIDATOR_REPORT_FILE,
    '3D Tiles validator report',
  );
  requireCanonicalFileName(tileset.path, 'tileset.json', '3D Tiles tileset');
  requireCanonicalFileName(
    evidence.path,
    TOPOGRAPHIC_3D_TILES_INTERNAL_EVIDENCE_FILE,
    '3D Tiles internal evidence',
  );
  requireCanonicalFileName(
    outputPath,
    TOPOGRAPHIC_3D_TILES_EXTERNAL_EVIDENCE_FILE,
    '3D Tiles external validation output',
  );
  if (new Set([report.path, tileset.path, evidence.path, outputPath]).size !== 4) {
    throw new Error('3D Tiles validation inputs and output must use distinct paths.');
  }
  if (existsSync(outputPath)) {
    throw new Error('3D Tiles external validation output must not already exist.');
  }
  const reportData = report.data;
  const tilesetData = tileset.data;
  const evidenceData = evidence.data;
  const tilesetSha256 = sha256(tilesetData);
  readInternalEvidence(evidenceData, tilesetSha256);
  const attestation = createTopographic3dTilesExternalValidation({
    reportData,
    reportFileName: basename(report.path),
    reportSha256: sha256(reportData),
    tilesetFileName: basename(tileset.path),
    tilesetSha256,
    internalEvidenceFileName: basename(evidence.path),
    internalEvidenceSha256: sha256(evidenceData),
  });
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(
    outputPath,
    `${JSON.stringify(attestation, null, 2)}\n`,
    { flag: 'wx' },
  );
  if (attestation.result.status !== 'passed') {
    throw new Error(
      `External 3D Tiles validation blocked: ${attestation.result.issueCodes.join(',')}`,
    );
  }
  return attestation;
}

function main() {
  const directory = resolve(DEFAULT_DIRECTORY);
  const reportPath = argument(
    '--report',
    join(directory, TOPOGRAPHIC_3D_TILES_VALIDATOR_REPORT_FILE),
  );
  const tilesetPath = argument(
    '--tileset',
    join(directory, 'tileset.json'),
  );
  const evidencePath = argument(
    '--evidence',
    join(directory, TOPOGRAPHIC_3D_TILES_INTERNAL_EVIDENCE_FILE),
  );
  const outputPath = argument(
    '--output',
    join(directory, TOPOGRAPHIC_3D_TILES_EXTERNAL_EVIDENCE_FILE),
  );
  const attestation = verifyTopographic3dTilesValidatorReportFiles({
    reportPath,
    tilesetPath,
    evidencePath,
    outputPath,
  });
  console.log(JSON.stringify({
    outputPath,
    status: attestation.result.status,
    validator: attestation.validator,
    counts: attestation.report,
  }, null, 2));
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  main();
}

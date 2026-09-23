import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import {
  basename,
  dirname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  MAX_NYC_3DEP_BATCH_PACKAGE_JSON_BYTES,
  verifyNyc3depLocalTileBatchPackage,
} from '../src/lib/topographicNyc3depBatchPackageVerifier';
import type { Nyc3depParent3dTilesBundle } from '../src/lib/topographicNyc3depParent3dTiles';
import {
  createNyc3depParent3dTilesExternalValidation,
  NYC_3DEP_PARENT_3D_TILES_EXTERNAL_EVIDENCE_FILE,
  NYC_3DEP_PARENT_3D_TILES_VALIDATOR_REPORT_FILE,
} from '../src/lib/topographicNyc3depParent3dTilesExternalValidation';

export const NYC_3DEP_PARENT_3D_TILES_VALIDATOR_CLI_VERSION =
  'agid-nyc-3dep-parent-3d-tiles-validator-cli-v0.1';

function requiredArgument(flag: string) {
  const inline = process.argv.find(value => value.startsWith(`${flag}=`));
  if (inline) return inline.slice(flag.length + 1);
  const index = process.argv.indexOf(flag);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) throw new Error(`${flag} is required.`);
  return value;
}

function sha256(value: string) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}` as const;
}

function readBoundUtf8(path: string, field: string) {
  const resolvedPath = resolve(path);
  const stat = statSync(resolvedPath);
  if (
    !stat.isFile()
    || stat.size <= 0
    || stat.size > MAX_NYC_3DEP_BATCH_PACKAGE_JSON_BYTES
  ) {
    throw new Error(
      `${field} must be a non-empty regular file no larger than ${MAX_NYC_3DEP_BATCH_PACKAGE_JSON_BYTES} bytes.`,
    );
  }
  try {
    const data = new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(resolvedPath));
    return {
      path: resolvedPath,
      data,
      byteLength: new TextEncoder().encode(data).byteLength,
      sha256: sha256(data),
    };
  } catch {
    throw new Error(`${field} must contain valid UTF-8.`);
  }
}

function parseJson(value: string, field: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new Error(`${field} must contain valid JSON.`);
  }
}

function isWithin(root: string, candidate: string) {
  const pathRelativeToRoot = relative(root, candidate);
  return (
    pathRelativeToRoot === ''
    || (
      pathRelativeToRoot !== '..'
      && !pathRelativeToRoot.startsWith(`..${sep}`)
      && !isAbsolute(pathRelativeToRoot)
    )
  );
}

export async function verifyNyc3depParent3dTilesValidatorReportFiles(input: {
  outputDirectory: string;
  reportPath: string;
  outputPath: string;
}) {
  const outputDirectory = resolve(input.outputDirectory);
  const packageVerification = await verifyNyc3depLocalTileBatchPackage(outputDirectory);
  if (packageVerification.parent.status !== 'ready') {
    throw new Error('NYC parent external validation requires a complete package with a ready parent tileset.');
  }

  const report = readBoundUtf8(input.reportPath, 'NYC parent 3D Tiles validator report');
  const tileset = readBoundUtf8(resolve(outputDirectory, 'tileset.json'), 'NYC parent tileset');
  const evidence = readBoundUtf8(resolve(outputDirectory, 'tileset.evidence.json'), 'NYC parent internal evidence');
  const outputPath = resolve(input.outputPath);
  if (basename(report.path) !== NYC_3DEP_PARENT_3D_TILES_VALIDATOR_REPORT_FILE) {
    throw new Error(
      `NYC parent 3D Tiles validator report must use the canonical file name ${NYC_3DEP_PARENT_3D_TILES_VALIDATOR_REPORT_FILE}.`,
    );
  }
  if (basename(outputPath) !== NYC_3DEP_PARENT_3D_TILES_EXTERNAL_EVIDENCE_FILE) {
    throw new Error(
      `NYC parent external validation output must use the canonical file name ${NYC_3DEP_PARENT_3D_TILES_EXTERNAL_EVIDENCE_FILE}.`,
    );
  }
  if (isWithin(outputDirectory, outputPath)) {
    throw new Error('NYC parent external validation output must be outside the retained batch package.');
  }
  if (new Set([report.path, tileset.path, evidence.path, outputPath]).size !== 4) {
    throw new Error('NYC parent validator inputs and output must use distinct paths.');
  }
  if (existsSync(outputPath)) {
    throw new Error('NYC parent external validation output must not already exist.');
  }
  if (
    tileset.sha256 !== packageVerification.parent.tilesetSha256
    || evidence.sha256 !== packageVerification.parent.evidenceSha256
  ) {
    throw new Error('NYC parent tileset or internal evidence changed after package verification.');
  }
  const parentBundle: Nyc3depParent3dTilesBundle = {
    tileset: {
      fileName: 'tileset.json',
      mediaType: 'application/json',
      data: tileset.data,
      byteLength: tileset.byteLength,
      sha256: tileset.sha256,
      tileset: parseJson(tileset.data, 'NYC parent tileset') as Nyc3depParent3dTilesBundle['tileset']['tileset'],
    },
    evidence: {
      fileName: 'tileset.evidence.json',
      mediaType: 'application/json',
      data: evidence.data,
      byteLength: evidence.byteLength,
      sha256: evidence.sha256,
      manifest: parseJson(evidence.data, 'NYC parent internal evidence') as Nyc3depParent3dTilesBundle['evidence']['manifest'],
    },
  };
  const attestation = createNyc3depParent3dTilesExternalValidation({
    reportData: report.data,
    reportFileName: basename(report.path),
    reportSha256: report.sha256,
    parentBundle,
  });
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(attestation, null, 2)}\n`, { flag: 'wx' });
  if (attestation.result.status !== 'passed') {
    throw new Error(
      `NYC parent external 3D Tiles validation blocked: ${attestation.result.issueCodes.join(',')}`,
    );
  }
  return attestation;
}

async function main() {
  const attestation = await verifyNyc3depParent3dTilesValidatorReportFiles({
    outputDirectory: requiredArgument('--output-dir'),
    reportPath: requiredArgument('--report'),
    outputPath: requiredArgument('--output'),
  });
  console.log(JSON.stringify({
    cliVersion: NYC_3DEP_PARENT_3D_TILES_VALIDATOR_CLI_VERSION,
    status: attestation.result.status,
    validator: attestation.validator,
    report: attestation.report,
    parent: {
      batchReceiptSha256: attestation.parent.batchReceiptSha256,
      childCount: attestation.parent.children.length,
    },
  }, null, 2));
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  void main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

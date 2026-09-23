import { createHash } from 'node:crypto';

import {
  createTopographic3dTilesExternalValidation,
  TOPOGRAPHIC_3D_TILES_VALIDATOR_VERSION,
  type Topographic3dTilesExternalValidation,
} from './topographic3dTilesExternalValidation';
import {
  NYC_3DEP_PARENT_3D_TILES_EVIDENCE_SCHEMA,
  NYC_3DEP_PARENT_3D_TILES_METHOD,
  type Nyc3depParent3dTilesBundle,
} from './topographicNyc3depParent3dTiles';

export const NYC_3DEP_PARENT_3D_TILES_EXTERNAL_VALIDATION_SCHEMA =
  'agid-nyc-3dep-parent-3d-tiles-external-validation-v0.1';
export const NYC_3DEP_PARENT_3D_TILES_VALIDATOR_REPORT_FILE =
  `cesium-validator-${TOPOGRAPHIC_3D_TILES_VALIDATOR_VERSION}.json`;
export const NYC_3DEP_PARENT_3D_TILES_EXTERNAL_EVIDENCE_FILE =
  'parent.external-validator.evidence.json';

type Sha256 = `sha256:${string}`;

export type Nyc3depParent3dTilesExternalValidation = {
  schemaVersion: typeof NYC_3DEP_PARENT_3D_TILES_EXTERNAL_VALIDATION_SCHEMA;
  validatedAt: string;
  validator: Topographic3dTilesExternalValidation['validator'];
  parent: {
    tilesetFileName: 'tileset.json';
    tilesetSha256: Sha256;
    internalEvidenceFileName: 'tileset.evidence.json';
    internalEvidenceSha256: Sha256;
    batchReceiptSha256: Sha256;
    children: Array<{
      tileId: string;
      uri: string;
      tilesetSha256: Sha256;
      evidenceSha256: Sha256;
    }>;
  };
  report: Topographic3dTilesExternalValidation['report'];
  result: Topographic3dTilesExternalValidation['result'];
  privacy: {
    containsRawElevation: false;
    containsAddressData: false;
  };
  nonClaims: string[];
};

const SHA256 = /^sha256:[a-f0-9]{64}$/i;
const SAFE_RELATIVE_URI = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9][A-Za-z0-9._/-]*$/;

function sha256(value: string) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}` as Sha256;
}

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

function requireDigest(value: unknown, field: string) {
  if (typeof value !== 'string' || !SHA256.test(value)) {
    throw new Error(`${field} must be a SHA-256 digest.`);
  }
  return value as Sha256;
}

function parseJson(value: string, field: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new Error(`${field} must contain valid JSON.`);
  }
}

function assertParentBundleArtifacts(bundle: Nyc3depParent3dTilesBundle) {
  if (
    bundle.tileset.fileName !== 'tileset.json'
    || bundle.evidence.fileName !== 'tileset.evidence.json'
  ) {
    throw new Error('NYC parent external validation requires canonical parent 3D Tiles file names.');
  }
  if (
    bundle.tileset.byteLength !== byteLength(bundle.tileset.data)
    || bundle.tileset.sha256 !== sha256(bundle.tileset.data)
  ) {
    throw new Error('NYC parent tileset bytes do not match their declared digest binding.');
  }
  if (
    bundle.evidence.byteLength !== byteLength(bundle.evidence.data)
    || bundle.evidence.sha256 !== sha256(bundle.evidence.data)
  ) {
    throw new Error('NYC parent internal evidence bytes do not match their declared digest binding.');
  }
  if (
    JSON.stringify(parseJson(bundle.tileset.data, 'NYC parent tileset'))
      !== JSON.stringify(bundle.tileset.tileset)
  ) {
    throw new Error('NYC parent tileset data does not match its declared tileset object.');
  }

  const manifest = bundle.evidence.manifest;
  if (
    manifest.schemaVersion !== NYC_3DEP_PARENT_3D_TILES_EVIDENCE_SCHEMA
    || manifest.method !== NYC_3DEP_PARENT_3D_TILES_METHOD
    || JSON.stringify(parseJson(bundle.evidence.data, 'NYC parent internal evidence'))
      !== JSON.stringify(manifest)
  ) {
    throw new Error('NYC parent internal evidence does not match its declared parent hierarchy contract.');
  }
  const expectedEvidenceData = `${JSON.stringify(manifest, null, 2)}\n`;
  if (bundle.evidence.data !== expectedEvidenceData) {
    throw new Error('NYC parent internal evidence must use the canonical serialization.');
  }
  const batchReceiptSha256 = requireDigest(
    manifest.batchReceiptSha256,
    'NYC parent internal evidence batchReceiptSha256',
  );
  if (manifest.children.length < 1) {
    throw new Error('NYC parent internal evidence must bind at least one child tileset.');
  }
  const childIds = new Set<string>();
  const children = manifest.children.map(child => {
    if (
      typeof child.tileId !== 'string'
      || child.tileId.length === 0
      || childIds.has(child.tileId)
    ) {
      throw new Error('NYC parent internal evidence contains an invalid or duplicate child tile identifier.');
    }
    childIds.add(child.tileId);
    if (
      typeof child.uri !== 'string'
      || !SAFE_RELATIVE_URI.test(child.uri)
      || !child.uri.endsWith('/tileset.json')
    ) {
      throw new Error('NYC parent internal evidence contains an unsafe child tileset URI.');
    }
    return {
      tileId: child.tileId,
      uri: child.uri,
      tilesetSha256: requireDigest(
        child.tilesetSha256,
        `NYC parent child ${child.tileId} tilesetSha256`,
      ),
      evidenceSha256: requireDigest(
        child.evidenceSha256,
        `NYC parent child ${child.tileId} evidenceSha256`,
      ),
    };
  });
  return { batchReceiptSha256, children };
}

/**
 * Binds an independently produced CesiumGS validator report to a fully
 * verified NYC parent hierarchy. Callers must verify the retained batch
 * package first; this function only validates the parent files and report
 * binding presented to it.
 */
export function createNyc3depParent3dTilesExternalValidation(input: {
  reportData: string;
  reportFileName: string;
  reportSha256: Sha256;
  parentBundle: Nyc3depParent3dTilesBundle;
}): Nyc3depParent3dTilesExternalValidation {
  if (input.reportFileName !== NYC_3DEP_PARENT_3D_TILES_VALIDATOR_REPORT_FILE) {
    throw new Error(
      `NYC parent validator report must use the canonical file name ${NYC_3DEP_PARENT_3D_TILES_VALIDATOR_REPORT_FILE}.`,
    );
  }
  if (input.reportSha256 !== sha256(input.reportData)) {
    throw new Error('NYC parent validator report bytes do not match their declared SHA-256 digest.');
  }
  const parent = assertParentBundleArtifacts(input.parentBundle);
  const validation = createTopographic3dTilesExternalValidation({
    reportData: input.reportData,
    reportFileName: input.reportFileName,
    reportSha256: input.reportSha256,
    tilesetFileName: input.parentBundle.tileset.fileName,
    tilesetSha256: input.parentBundle.tileset.sha256,
    internalEvidenceFileName: input.parentBundle.evidence.fileName,
    internalEvidenceSha256: input.parentBundle.evidence.sha256,
  });
  return {
    schemaVersion: NYC_3DEP_PARENT_3D_TILES_EXTERNAL_VALIDATION_SCHEMA,
    validatedAt: validation.validatedAt,
    validator: validation.validator,
    parent: {
      tilesetFileName: input.parentBundle.tileset.fileName,
      tilesetSha256: input.parentBundle.tileset.sha256,
      internalEvidenceFileName: input.parentBundle.evidence.fileName,
      internalEvidenceSha256: input.parentBundle.evidence.sha256,
      batchReceiptSha256: parent.batchReceiptSha256,
      children: parent.children,
    },
    report: validation.report,
    result: validation.result,
    privacy: {
      containsRawElevation: false,
      containsAddressData: false,
    },
    nonClaims: [
      'This sidecar binds a retained validator report to one internally verified NYC parent hierarchy; it does not execute the validator.',
      'A passed validator report is not source-promotion, survey, coverage, vertical-accuracy, building, cadastral, routing, or delivery evidence.',
      'The sidecar contains no raw elevation samples, coordinates, addresses, recipients, AOID material, credentials, or secrets.',
    ],
  };
}

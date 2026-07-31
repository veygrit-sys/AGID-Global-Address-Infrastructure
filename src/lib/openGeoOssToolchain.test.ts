import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assessOpenGeoOssToolchain,
  requireOpenGeoOssCapability,
} from './openGeoOssToolchain';
import type { OpenGeoOssToolProbe } from './openGeoOssToolchain';

const digest = `sha256:${'a'.repeat(64)}` as const;

function readyInput() {
  return {
    probes: [
      { tool: 'gdal', status: 'available' as const, version: '3.13.0', evidenceSha256: digest },
      { tool: 'proj', status: 'available' as const, version: '9.7.1', evidenceSha256: digest },
      { tool: 'postgis', status: 'available' as const, version: '3.5.0', evidenceSha256: digest },
      { tool: 'osm2pgsql', status: 'available' as const, version: '2.2.0', evidenceSha256: digest },
      { tool: 'libpostal', status: 'available' as const, version: '1.1.0', evidenceSha256: digest },
      { tool: 'cosign', status: 'available' as const, version: '2.5.0', evidenceSha256: digest },
    ] as OpenGeoOssToolProbe[],
    projDatabaseReady: true,
    tufMetadataReady: true,
  };
}

test('open geo OSS toolchain distinguishes installed capabilities from source promotion', () => {
  const result = assessOpenGeoOssToolchain(readyInput());
  assert.equal(result.version, 'agid-open-geo-oss-toolchain-v1');
  assert.deepEqual(result.capabilities.map(item => item.status), ['ready', 'ready', 'ready', 'ready']);
  assert.equal(result.sourcePromotion.toolchainAlonePermitsPromotion, false);
  assert.deepEqual(result.sourcePromotion.requiredSeparateEvidence, [
    'license',
    'version',
    'scope',
    'correction-path',
    'source-approval',
  ]);
});

test('terrain readiness fails closed for a stale GDAL or unavailable PROJ database', () => {
  const input = readyInput();
  input.probes[0] = { tool: 'gdal', status: 'available', version: '3.12.1', evidenceSha256: digest };
  input.projDatabaseReady = false;
  const result = assessOpenGeoOssToolchain(input);
  const terrain = result.capabilities.find(item => item.capability === 'source-backed-terrain');
  assert.deepEqual(terrain?.blockingReasons, ['gdal-version-below-3.13.0', 'proj-data-not-ready']);
  assert.throws(
    () => requireOpenGeoOssCapability(result, 'source-backed-terrain'),
    /gdal-version-below-3.13.0/,
  );
});

test('spatial import, parser, and signed release all remain separately gated', () => {
  const input = readyInput();
  input.probes[3] = { tool: 'osm2pgsql', status: 'missing' };
  input.probes[4] = { tool: 'libpostal', status: 'unverified' };
  input.probes[5] = { tool: 'cosign', status: 'missing' };
  input.tufMetadataReady = false;
  const result = assessOpenGeoOssToolchain(input);

  assert.deepEqual(
    result.capabilities.find(item => item.capability === 'versioned-spatial-index')?.blockingReasons,
    ['osm2pgsql-not-available'],
  );
  assert.deepEqual(
    result.capabilities.find(item => item.capability === 'local-multilingual-parser')?.blockingReasons,
    ['libpostal-not-available'],
  );
  assert.deepEqual(
    result.capabilities.find(item => item.capability === 'signed-artifact-release')?.blockingReasons,
    ['cosign-not-available', 'tuf-metadata-not-ready'],
  );
});

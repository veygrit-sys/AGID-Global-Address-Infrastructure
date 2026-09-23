import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  GLOBAL_PRIVACY_MODE_VERSION,
  buildGlobalPrivacyModeSummary,
} from './globalPrivacyMode';

test('global privacy mode defaults to local-only and no raw address', () => {
  const summary = buildGlobalPrivacyModeSummary();

  assert.equal(summary.schemaVersion, GLOBAL_PRIVACY_MODE_VERSION);
  assert.equal(summary.runtimeMode, 'local-only');
  assert.equal(summary.modeCode, 'Mode 0');
  assert.equal(summary.privacyDefault, 'no-raw-address');
  assert.equal(summary.networkLabel, 'online');
});

test('global privacy mode models optional registry, ZK, and Ethereum rails', () => {
  assert.equal(buildGlobalPrivacyModeSummary({ registryEnabled: true }).runtimeMode, 'local-server-registry');
  assert.equal(buildGlobalPrivacyModeSummary({ zkEnabled: true }).runtimeMode, 'zk-only');
  assert.equal(buildGlobalPrivacyModeSummary({ ethereumEnabled: true }).runtimeMode, 'ethereum-registry');

  const full = buildGlobalPrivacyModeSummary({ zkEnabled: true, ethereumEnabled: true });
  assert.equal(full.runtimeMode, 'full-zk-ethereum');
  assert.equal(full.modeCode, 'Mode 4');
});

test('global privacy mode warns on detailed QR and high-risk contexts', () => {
  const publicQr = buildGlobalPrivacyModeSummary({ qrPayloadPrivacy: 'public' });
  assert.equal(publicQr.qrExposure, 'minimal-public-reference');
  assert.equal(publicQr.warnings.some(warning => warning.includes('Full QR')), false);

  const fullQrDisaster = buildGlobalPrivacyModeSummary({
    qrPayloadPrivacy: 'full',
    disasterMode: true,
    online: false,
  });
  assert.equal(fullQrDisaster.qrExposure, 'sensitive-full-payload');
  assert.equal(fullQrDisaster.riskLevel, 'high-risk');
  assert.equal(fullQrDisaster.networkLabel, 'offline-ready');
  assert.equal(fullQrDisaster.warnings.length, 3);
});

test('global privacy mode reports active operational contexts without exposing address data', () => {
  const summary = buildGlobalPrivacyModeSummary({
    shippingMode: true,
    droneMode: true,
    gisMode: true,
    systematicMode: true,
  });

  assert.deepEqual(summary.activeContextLabels, ['Shipping', 'Drone', 'GIS', 'Systematic']);
  assert.equal(JSON.stringify(summary).includes('address:'), false);
});

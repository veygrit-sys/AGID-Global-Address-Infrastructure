import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildSettingsPolicyCenterSnapshot,
  DEFAULT_SETTINGS_POLICY_PROVIDERS,
  SETTINGS_POLICY_CENTER_VERSION,
} from './settingsPolicyCenter';

test('keeps Mode 0 local, free, offline-capable, and unblocked', () => {
  const snapshot = buildSettingsPolicyCenterSnapshot({
    mode: 'local-only',
    language: 'ja-JP',
    highRiskMode: false,
    now: '2026-06-18T00:00:00.000Z',
  });

  assert.equal(snapshot.version, SETTINGS_POLICY_CENTER_VERSION);
  assert.equal(snapshot.blocked, false);
  assert.equal(snapshot.profile.offlineCapable, true);
  assert.equal(snapshot.profile.gasCostRisk, 'none');
  assert.equal(snapshot.impact.localOnlyAvailable, true);
  assert.equal(snapshot.impact.rawAddressLeavesDevice, false);
  assert.equal(snapshot.impact.proofSecretLeavesDevice, false);
  assert.equal(snapshot.mandatorySecurityGate.valid, true);
});

test('requires ZK and Ethereum adapters for full mode', () => {
  const snapshot = buildSettingsPolicyCenterSnapshot({
    mode: 'full-zk-ethereum',
    language: 'en',
    now: '2026-06-18T00:00:00.000Z',
  });

  assert.equal(snapshot.blocked, true);
  assert.ok(snapshot.findings.some(finding => finding.code === 'missing-zk-prover'));
  assert.ok(snapshot.findings.some(finding => finding.code === 'missing-ethereum-l2'));
});

test('accepts full mode when required adapters are enabled with safe data only', () => {
  const providers = DEFAULT_SETTINGS_POLICY_PROVIDERS.map(provider => {
    if (provider.id === 'zk-prover' || provider.id === 'ethereum-l2') {
      return { ...provider, enabled: true };
    }
    return provider;
  });
  const snapshot = buildSettingsPolicyCenterSnapshot({
    mode: 'full-zk-ethereum',
    language: 'en',
    providers,
    now: '2026-06-18T00:00:00.000Z',
  });

  assert.equal(snapshot.blocked, false);
  assert.equal(snapshot.profile.zkRequired, true);
  assert.equal(snapshot.profile.ethereumRequired, true);
  assert.equal(snapshot.impact.enabledProviderCount, 2);
  assert.equal(snapshot.impact.rawAgidLeavesDevice, false);
});

test('blocks enabled providers that try to receive private address material', () => {
  const providers = DEFAULT_SETTINGS_POLICY_PROVIDERS.map(provider => (
    provider.id === 'carrier-api'
      ? {
          ...provider,
          enabled: true,
          outboundData: [...provider.outboundData, 'raw-address' as const, 'recipient-identity' as const],
        }
      : provider
  ));
  const snapshot = buildSettingsPolicyCenterSnapshot({
    mode: 'server-registry',
    language: 'ja-JP',
    providers,
    now: '2026-06-18T00:00:00.000Z',
  });

  assert.equal(snapshot.blocked, true);
  assert.ok(snapshot.findings.some(finding => finding.code === 'missing-server-registry'));
  assert.ok(snapshot.findings.some(finding => finding.code === 'provider-forbidden-data:carrier-api'));
  assert.doesNotMatch(JSON.stringify(snapshot.safeExport), /private address sample|private recipient sample/);
});

test('enforces high-risk defaults for AGID-S, short expiry, and no history', () => {
  const snapshot = buildSettingsPolicyCenterSnapshot({
    mode: 'local-only',
    language: 'ja-JP',
    highRiskMode: true,
    noAddressHistory: false,
    agidSOnlyForHighRisk: false,
    shortAliasTtlSeconds: 900,
    now: '2026-06-18T00:00:00.000Z',
  });

  assert.equal(snapshot.blocked, true);
  assert.ok(snapshot.findings.some(finding => finding.code === 'high-risk-must-use-agid-s'));
  assert.ok(snapshot.findings.some(finding => finding.code === 'high-risk-address-history-enabled'));
  assert.equal(snapshot.input.shortAliasTtlSeconds, 300);
  assert.equal(snapshot.publicPrivatePreview.privacy.rawAgidPublic, false);
});

test('safe export contains settings and commitments but not raw private samples', () => {
  const snapshot = buildSettingsPolicyCenterSnapshot({
    mode: 'server-registry',
    language: 'en',
    providers: DEFAULT_SETTINGS_POLICY_PROVIDERS.map(provider => (
      provider.id === 'hosted-registry' ? { ...provider, enabled: true } : provider
    )),
    now: '2026-06-18T00:00:00.000Z',
  });
  const exportText = JSON.stringify(snapshot.safeExport);

  assert.equal(snapshot.blocked, false);
  assert.match(exportText, /server-registry/);
  assert.match(exportText, /publicPayloadFingerprint/);
  assert.doesNotMatch(exportText, /private address sample|private recipient sample|ABCDEFGHJKLMNPQ/);
  assert.equal(snapshot.publicPrivatePreview.privacy.rawAddressPublic, false);
  assert.equal(snapshot.publicPrivatePreview.privacy.rawAoidPublic, false);
});

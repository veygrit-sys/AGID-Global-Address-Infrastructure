import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  OFFLINE_FIELD_KIT_VERSION,
  buildOfflineFieldKit,
  validateOfflineFieldKit,
} from './offlineFieldKit';

test('builds an OSS-safe Offline Field Kit manifest', () => {
  const kit = buildOfflineFieldKit();

  assert.equal(kit.manifest.kitId, 'offline-field-kit');
  assert.equal(kit.manifest.version, OFFLINE_FIELD_KIT_VERSION);
  assert.equal(kit.manifest.counts.runbooks, kit.runbooks.length);
  assert.equal(kit.manifest.counts.checklists, kit.checklists.length);
  assert.equal(kit.manifest.counts.fixtures, kit.fixtures.length);
  assert.ok(kit.manifest.privacyPosition.includes('local-first'));
  assert.ok(kit.manifest.privacyPosition.includes('no-raw-address'));

  for (const file of kit.manifest.files) {
    assert.equal(file.containsPersonalData, false);
    assert.equal(file.containsRawAddressData, false);
    assert.equal(file.containsThirdPartyData, false);
  }
});

test('validates the generated Offline Field Kit', () => {
  const validation = validateOfflineFieldKit(buildOfflineFieldKit());

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
});

test('covers field, POS, aid, locker, drone, hotel, and registry sync runbooks', () => {
  const kit = buildOfflineFieldKit();
  const surfaces = kit.runbooks.map(runbook => runbook.surface);

  assert.ok(surfaces.includes('field-handoff'));
  assert.ok(surfaces.includes('ngo-aid-station'));
  assert.ok(surfaces.includes('warehouse-locker'));
  assert.ok(surfaces.includes('drone-reachability'));
  assert.ok(surfaces.includes('hotel-check-in'));
  assert.ok(surfaces.includes('registry-sync'));
  assert.ok(kit.modes.some(mode => mode.mode === 'local-only'));
  assert.ok(kit.modes.some(mode => mode.mode === 'deferred-sync'));
  assert.ok(kit.modes.some(mode => mode.mode === 'zk-ready-local-verification'));
});

test('fixture connects signed field receipts, CRDT sync, used-state, and reachability without raw material', () => {
  const kit = buildOfflineFieldKit();
  const fixture = kit.fixtures[0];

  assert.equal(fixture.scanReceipt.syncState, 'queued');
  assert.equal(fixture.reachabilityReceipt.syncState, 'queued');
  assert.match(fixture.scanReceipt.signature.signatureId, /^FHS-/);
  assert.match(fixture.scanReceipt.offlineQueueRef, /^FHQ-/);
  assert.equal(fixture.scanReceipt.privacy.rawAddressStored, false);
  assert.equal(fixture.scanReceipt.privacy.rawAgidStored, false);
  assert.equal(fixture.scanReceipt.privacy.rawAoidStored, false);
  assert.equal(fixture.scanReceipt.privacy.proofSecretStored, false);

  assert.equal(fixture.crdtEnvelope.privacy.rawAddressStored, false);
  assert.equal(fixture.crdtEnvelope.privacy.rawAoidStored, false);
  assert.equal(fixture.crdtEnvelope.privacy.publicSyncMaterial, 'public-values-and-commitments-only');
  assert.equal(fixture.crdtSummary.conflictCount, 0);

  assert.equal(fixture.offlineLedgerSummary.pendingSync, 1);
  assert.equal(fixture.offlineSyncItems.length, 1);
  assert.equal(fixture.offlineLedgerSummary.rawAddressStored, false);
  assert.equal(fixture.offlineLedgerSummary.rawProofStored, false);

  assert.equal(fixture.reachabilityReport.privacy.publicContainsRawAddress, false);
  assert.equal(fixture.reachabilityReport.privacy.publicContainsRawAgid, false);
  assert.equal(fixture.reachabilityReport.privacy.publicContainsPreciseCoordinates, false);
  assert.equal(fixture.reachabilityReport.publicProjection.publicationState, 'restricted');
});

test('runbooks make offline conflicts review-required instead of destructive', () => {
  const kit = buildOfflineFieldKit();
  const registry = kit.runbooks.find(runbook => runbook.surface === 'registry-sync');
  const field = kit.runbooks.find(runbook => runbook.surface === 'field-handoff');
  const locker = kit.runbooks.find(runbook => runbook.surface === 'warehouse-locker');
  const aid = kit.runbooks.find(runbook => runbook.surface === 'ngo-aid-station');

  assert.ok(registry);
  assert.ok(field);
  assert.ok(locker);
  assert.ok(aid);
  assert.match(registry.syncPolicy, /accept, reject, or conflict/i);
  assert.match(registry.fallbackPolicy, /append-only/i);
  assert.ok(field.requiredControls.some(control => /terminal signature/i.test(control)));
  assert.ok(field.requiredControls.some(control => /AGID-S QR\/NFC intake summary/i.test(control)));
  assert.ok(locker.requiredControls.some(control => /QR\/NFC reader emits alias/i.test(control)));
  assert.ok(aid.requiredControls.some(control => /AGID-S or local proof transport/i.test(control)));
  assert.ok(field.forbiddenStorage.some(item => /proof secret/i.test(item)));
  assert.ok(kit.releaseRules.some(rule => /encrypted token and decrypted AGID stay local/i.test(rule)));
});

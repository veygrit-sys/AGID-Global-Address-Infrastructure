import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveAddressSystem, type AddressResolutionInput } from '../lib/addressResolutionSystem';
import {
  createAddressResolutionLedgerEntry,
  createConfiguredAddressResolutionLedgerStore,
  createInMemoryAddressResolutionLedgerStore,
  MongoDbAddressResolutionLedgerStore,
} from './addressResolutionLedgerStore';

const tokyoAddress: AddressResolutionInput = {
  mode: 'local-only',
  domain: 'ledger:unit-test',
  language: 'en',
  addressText: '100-0005 Tokyo Chiyoda Marunouchi 1-9-1',
  address: {
    country_code: 'JP',
    state: 'Tokyo',
    city: 'Chiyoda',
    road: 'Marunouchi',
    house_number: '1-9-1',
    postcode: '100-0005',
  },
  countryCode: 'JP',
  targetCountries: ['JP'],
  postalCode: '100-0005',
  postalEvidence: [{
    source: 'japan-postcode-api',
    sourceId: 'japan-postcode-api',
    countryCode: 'JP',
    postalCode: '100-0005',
    state: 'Tokyo',
    city: 'Chiyoda',
    confidence: 0.97,
  }],
  lat: 35.681236,
  lon: 139.767125,
  now: '2026-06-17T00:00:00.000Z',
};

test('address resolution ledger entry stores commitments and audit steps without raw private material', async () => {
  const result = await resolveAddressSystem(tokyoAddress);
  const entry = createAddressResolutionLedgerEntry(result, {
    nullifierHash: '0xledger-nullifier',
    nullifierScope: 'delivery:handoff:test',
    nullifierUsage: 'address-resolution-test',
    nullifierExpiresAt: '2026-06-17T01:00:00.000Z',
  });
  const serialized = JSON.stringify(entry);

  assert.equal(entry.resolution.rawAddressStored, false);
  assert.equal(entry.resolution.rawAgidStored, false);
  assert.equal(entry.resolution.rawAoidStored, false);
  assert.equal(entry.resolution.rawCoordinatesStored, false);
  assert.equal(entry.resolution.recipientIdentityStored, false);
  assert.equal(entry.resolution.canonicalAddressStored, false);
  assert.equal(entry.resolution.publicFieldsOnly, true);
  assert.ok(entry.commitments.some(item => item.commitmentKind === 'address-reference'));
  assert.ok(entry.steps.some(item => item.stepName === 'final-decision'));
  assert.equal(entry.nullifiers[0]?.scope, 'delivery:handoff:test');
  assert.equal(entry.nullifiers[0]?.usage, 'address-resolution-test');

  assert.doesNotMatch(serialized, /Tokyo|Chiyoda|Marunouchi|100-0005|35\.681236|139\.767125/);
  if (result.agid?.id) assert.doesNotMatch(serialized, new RegExp(result.agid.id));
});

test('in-memory address resolution ledger supports write, lookup, recent, and stats', async () => {
  const store = createInMemoryAddressResolutionLedgerStore();
  const result = await resolveAddressSystem(tokyoAddress);
  const receipt = await store.recordResolution(result, {
    nullifierHash: '0xledger-nullifier-memory',
    nullifierScope: 'delivery:handoff:test',
  });
  const entry = await store.getResolution(result.resolutionId);
  const recent = await store.recent(5);
  const stats = await store.stats();

  assert.equal(receipt.recorded, true);
  assert.equal(receipt.storageMode, 'memory');
  assert.equal(receipt.rawAddressStored, false);
  assert.ok(receipt.streamId.startsWith('arl-stream:'));
  assert.equal(receipt.temporalSequence, 1);
  assert.ok(receipt.temporalSnapshotId.startsWith('ARLTS-'));
  assert.equal(entry?.resolution.resolutionId, result.resolutionId);
  assert.equal(entry?.nullifiers[0]?.nullifierHash, '0xledger-nullifier-memory');
  assert.equal(recent[0]?.resolutionId, result.resolutionId);
  assert.equal(stats.resolutionCount, 1);
  assert.equal(stats.commitmentCount, receipt.commitmentCount);
  assert.equal(stats.evidenceCount, receipt.evidenceCount);
  assert.equal(stats.stepCount, receipt.stepCount);
  assert.equal(stats.nullifierCount, receipt.nullifierCount);
  assert.equal(stats.eventCount, 1);
  assert.equal(stats.snapshotCount, 1);
});

test('address resolution ledger appends temporal events and point-in-time snapshots', async () => {
  const store = createInMemoryAddressResolutionLedgerStore();
  const result = await resolveAddressSystem(tokyoAddress);
  const receipt = await store.recordResolution(result);
  const correction = await store.recordEvent({
    streamId: receipt.streamId,
    aggregateKind: 'address-reference',
    aggregateId: result.commitments.addressReferenceCommitment,
    eventType: 'address-corrected',
    eventVersion: 1,
    occurredAt: '2026-06-17T00:05:00.000Z',
    causationId: result.resolutionId,
    payload: {
      status: 'partial',
      decision: 'review',
      confidence: 0.71,
      correctionReason: 'operator-feedback-commitment',
      feedbackHash: '0xfeedback-hash',
    },
  });
  const events = await store.getEventStream(receipt.streamId);
  const current = await store.getSnapshot(receipt.streamId);
  const beforeCorrection = await store.getSnapshot(receipt.streamId, '2026-06-17T00:01:00.000Z');
  const serialized = JSON.stringify({ events, current, beforeCorrection });

  assert.equal(correction.sequence, 2);
  assert.equal(correction.previousEventHash, events[0]?.eventHash);
  assert.equal(events.length, 2);
  assert.equal(current?.sequence, 2);
  assert.equal(current?.status, 'partial');
  assert.equal(current?.decision, 'review');
  assert.equal(beforeCorrection?.sequence, 1);
  assert.doesNotMatch(serialized, /Tokyo|Chiyoda|Marunouchi|100-0005|35\.681236|139\.767125/);
});

test('address resolution ledger can be configured for MongoDB without exposing raw material in the adapter contract', () => {
  const store = createConfiguredAddressResolutionLedgerStore({
    storageMode: 'mongodb',
    mongodbUrl: 'mongodb://127.0.0.1:27017',
    mongodbDbName: 'agid_test',
    mongodbCollectionPrefix: 'arl_test',
  });

  assert.ok(store instanceof MongoDbAddressResolutionLedgerStore);
  assert.equal(store.storageMode, 'mongodb');
});

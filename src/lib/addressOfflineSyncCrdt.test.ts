import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  applyAddressOfflineCrdtOperation,
  buildAddressOfflineSyncEnvelope,
  compareAddressOfflineCrdtClocks,
  createAddressOfflineCrdtOperation,
  createAddressOfflineCrdtState,
  getAddressOfflineCrdtVisibleSetMembers,
  incrementAddressOfflineCrdtClock,
  mergeAddressOfflineCrdtStates,
  summarizeAddressOfflineCrdtState,
} from './addressOfflineSyncCrdt';

test('offline CRDT vector clocks detect causal and concurrent updates', () => {
  const a1 = incrementAddressOfflineCrdtClock({}, 'field-pos-a');
  const a2 = incrementAddressOfflineCrdtClock(a1, 'field-pos-a');
  const b1 = incrementAddressOfflineCrdtClock({}, 'field-pos-b');

  assert.equal(compareAddressOfflineCrdtClocks(a1, a2), 'before');
  assert.equal(compareAddressOfflineCrdtClocks(a2, a1), 'after');
  assert.equal(compareAddressOfflineCrdtClocks(a1, { ...a1 }), 'equal');
  assert.equal(compareAddressOfflineCrdtClocks(a1, b1), 'concurrent');
});

test('offline CRDT merges causal field updates without conflict', () => {
  const first = createAddressOfflineCrdtOperation({
    actorId: 'pos-a',
    entityId: 'shipment-001',
    entityKind: 'shipping-label',
    domain: 'delivery:handoff',
    action: 'upsert-field',
    field: 'status',
    publicValue: 'Recipient Pending',
    now: '2026-06-17T00:00:00.000Z',
  });
  const second = createAddressOfflineCrdtOperation({
    actorId: 'pos-a',
    entityId: 'shipment-001',
    entityKind: 'shipping-label',
    domain: 'delivery:handoff',
    action: 'upsert-field',
    field: 'status',
    publicValue: 'Handoff Complete',
    clock: first.clock,
    now: '2026-06-17T00:01:00.000Z',
  });

  const state = applyAddressOfflineCrdtOperation(
    applyAddressOfflineCrdtOperation(undefined, first),
    second,
  );

  assert.equal(state.fields.status.publicValue, 'Handoff Complete');
  assert.equal(state.conflicts.length, 0);
  assert.equal(summarizeAddressOfflineCrdtState(state).auditRequired, false);
});

test('offline CRDT marks concurrent conflicting field updates as audit-required', () => {
  const base = createAddressOfflineCrdtState({
    entityId: 'shipment-002',
    entityKind: 'shipping-label',
    domain: 'delivery:handoff',
    now: '2026-06-17T00:00:00.000Z',
  });
  const accepted = createAddressOfflineCrdtOperation({
    actorId: 'pos-a',
    entityId: 'shipment-002',
    entityKind: 'shipping-label',
    domain: 'delivery:handoff',
    action: 'upsert-field',
    field: 'status',
    publicValue: 'Carrier Scan OK',
    now: '2026-06-17T00:01:00.000Z',
  });
  const rejected = createAddressOfflineCrdtOperation({
    actorId: 'pos-b',
    entityId: 'shipment-002',
    entityKind: 'shipping-label',
    domain: 'delivery:handoff',
    action: 'upsert-field',
    field: 'status',
    publicValue: 'Rejected',
    now: '2026-06-17T00:02:00.000Z',
  });

  const left = applyAddressOfflineCrdtOperation(base, accepted);
  const right = applyAddressOfflineCrdtOperation(base, rejected);
  const merged = mergeAddressOfflineCrdtStates(left, right);

  assert.equal(merged.fields.status.publicValue, 'Rejected');
  assert.equal(merged.conflicts.length, 1);
  assert.equal(merged.conflicts[0].conflictType, 'concurrent-field-write');
  assert.equal(merged.conflicts[0].resolution, 'audit-required');
  assert.equal(summarizeAddressOfflineCrdtState(merged).auditRequired, true);
});

test('offline CRDT requires commitments for sensitive fields', () => {
  assert.throws(
    () => createAddressOfflineCrdtOperation({
      actorId: 'pos-a',
      entityId: 'address-001',
      entityKind: 'address-reference',
      domain: 'address-registration',
      action: 'upsert-field',
      field: 'rawAddress',
      publicValue: '1-1 Chiyoda Tokyo',
    }),
    /sensitive field/i,
  );

  const safe = createAddressOfflineCrdtOperation({
    actorId: 'pos-a',
    entityId: 'address-001',
    entityKind: 'address-reference',
    domain: 'address-registration',
    action: 'upsert-field',
    field: 'rawAddress',
    valueCommitment: 'addr:commitment:abc',
  });

  assert.equal(safe.valueCommitment, 'addr:commitment:abc');
  assert.equal(safe.rawAddressStored, false);
});

test('offline CRDT OR-Set merges offline nullifiers and respects observed removals', () => {
  const addA = createAddressOfflineCrdtOperation({
    actorId: 'field-pos-a',
    entityId: 'aid-event-001',
    entityKind: 'pos-usage',
    domain: 'aid:distribution',
    action: 'add-set-member',
    setName: 'used-nullifiers',
    memberCommitment: 'sln:commitment:a',
    now: '2026-06-17T00:00:00.000Z',
  });
  const addB = createAddressOfflineCrdtOperation({
    actorId: 'field-pos-b',
    entityId: 'aid-event-001',
    entityKind: 'pos-usage',
    domain: 'aid:distribution',
    action: 'add-set-member',
    setName: 'used-nullifiers',
    memberCommitment: 'sln:commitment:b',
    now: '2026-06-17T00:00:10.000Z',
  });

  const merged = mergeAddressOfflineCrdtStates(
    applyAddressOfflineCrdtOperation(undefined, addA),
    applyAddressOfflineCrdtOperation(undefined, addB),
  );
  assert.equal(getAddressOfflineCrdtVisibleSetMembers(merged, 'used-nullifiers').length, 2);

  const removeA = createAddressOfflineCrdtOperation({
    actorId: 'field-pos-a',
    entityId: 'aid-event-001',
    entityKind: 'pos-usage',
    domain: 'aid:distribution',
    action: 'remove-set-member',
    setName: 'used-nullifiers',
    memberId: addA.memberId,
    memberCommitment: addA.memberCommitment,
    observedAddTags: [addA.operationId],
    clock: addA.clock,
    now: '2026-06-17T00:01:00.000Z',
  });
  const afterRemove = applyAddressOfflineCrdtOperation(merged, removeA);

  assert.equal(getAddressOfflineCrdtVisibleSetMembers(afterRemove, 'used-nullifiers').length, 1);
  assert.equal(getAddressOfflineCrdtVisibleSetMembers(afterRemove, 'used-nullifiers')[0].memberCommitment, 'sln:commitment:b');
});

test('offline CRDT sync envelope contains only public values and commitments', () => {
  const operation = createAddressOfflineCrdtOperation({
    actorId: 'pos-a',
    entityId: 'address-privacy',
    entityKind: 'address-reference',
    domain: 'address-registration',
    action: 'upsert-field',
    field: 'rawAddress',
    valueCommitment: 'addr:commitment:private',
    now: '2026-06-17T00:00:00.000Z',
  });
  const state = applyAddressOfflineCrdtOperation(undefined, operation);
  const envelope = buildAddressOfflineSyncEnvelope(state);

  assert.equal(envelope.privacy.rawAddressStored, false);
  assert.equal(envelope.fields.rawAddress.valueCommitment, 'addr:commitment:private');
  assert.doesNotMatch(JSON.stringify(envelope), /Chiyoda|Tokyo Station|AOID secret|\+81|090-0000/i);
});

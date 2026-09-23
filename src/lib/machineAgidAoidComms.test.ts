import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildMachineCommunicationDemo,
  buildMachineCommunicationEnvelope,
  createMachineNodeIdentity,
  findForbiddenMachineMaterial,
  listMachineCommunicationCapabilities,
  negotiateMachineCommunication,
  verifyMachineCommunicationEnvelope,
  type MachineCommunicationEnvelope,
} from './machineAgidAoidComms';

test('machine AGID/AOID communication demo negotiates safe machine decisions', () => {
  const demo = buildMachineCommunicationDemo('2026-06-20T09:00:00.000Z');

  assert.equal(demo.nodes.length, 4);
  assert.equal(demo.envelopes.length, 2);
  assert.equal(demo.handshakes[0]?.decision, 'accept');
  assert.equal(demo.handshakes[0]?.nextAction, 'open-locker');
  assert.equal(demo.handshakes[1]?.decision, 'accept');
  assert.equal(demo.handshakes[1]?.nextAction, 'continue-local');

  for (const envelope of demo.envelopes) {
    assert.equal(envelope.privacy.rawAddressStored, false);
    assert.equal(envelope.privacy.rawAgidStored, false);
    assert.equal(envelope.privacy.rawAoidStored, false);
    assert.equal(envelope.privacy.rawRecipientStored, false);
    assert.equal(envelope.privacy.payloadIsCommitmentOnly, true);
    assert.deepEqual(findForbiddenMachineMaterial(envelope), []);
  }
});

test('machine AGID/AOID communication exposes roles, modes, operations, and safe payload keys', () => {
  const capabilities = listMachineCommunicationCapabilities();

  assert.ok(capabilities.roles.includes('pos-terminal'));
  assert.ok(capabilities.roles.includes('locker-controller'));
  assert.ok(capabilities.roles.includes('drone-agent'));
  assert.ok(capabilities.modes.includes('local-only'));
  assert.ok(capabilities.modes.includes('full-zk-ethereum'));
  assert.ok(capabilities.operations.includes('locker-release-request'));
  assert.ok(capabilities.publicPayloadKeys.includes('agidCommitment'));
  assert.ok(capabilities.publicPayloadKeys.includes('aoidCommitment'));
  assert.equal(capabilities.privacy.payloadIsCommitmentOnly, true);
});

test('machine AGID/AOID envelope accepts commitment-only payloads and verifies signatures', () => {
  const pos = createMachineNodeIdentity({
    role: 'pos-terminal',
    nodeId: 'NODE-POS-TEST',
    organizationRef: 'org:test-store',
    deviceKeyId: 'key:test-pos',
    trustLevel: 'organization-trusted',
    capabilities: ['verify-waybill-alias', 'check-revocation-freshness'],
  });
  const locker = createMachineNodeIdentity({
    role: 'locker-controller',
    nodeId: 'NODE-LOCKER-TEST',
    organizationRef: 'org:test-locker',
    deviceKeyId: 'key:test-locker',
    trustLevel: 'paired',
    capabilities: ['verify-aoid-reference', 'open-locker', 'sync-redacted-receipt'],
  });
  const envelope = buildMachineCommunicationEnvelope({
    from: pos,
    to: locker,
    purpose: 'locker-release',
    operation: 'locker-release-request',
    createdAt: '2026-06-20T09:00:00.000Z',
    publicPayload: {
      aoidCommitment: 'AOC-TEST-001',
      waybillAlias: 'WBA-TEST-001',
      unknownSafeLookingKey: 'drop-me',
    },
  });

  assert.deepEqual(envelope.payloadKeys, ['aoidCommitment', 'waybillAlias']);
  assert.ok(envelope.warnings.includes('payload-key-dropped:unknownSafeLookingKey'));
  assert.match(envelope.nonce, /^MNONCE-[A-F0-9]{18}$/);
  assert.equal(envelope.audience, 'NODE-LOCKER-TEST');

  const verification = verifyMachineCommunicationEnvelope(envelope, {
    now: '2026-06-20T09:00:10.000Z',
  });
  assert.equal(verification.valid, true);
  assert.equal(verification.status, 'accepted');
  assert.deepEqual(verification.errors, []);

  const handshake = negotiateMachineCommunication({
    request: envelope,
    now: '2026-06-20T09:00:10.000Z',
  });
  assert.equal(handshake.decision, 'accept');
  assert.equal(handshake.nextAction, 'open-locker');
  assert.equal(handshake.receipt.privacy.rawAddressStored, false);
});

test('machine AGID/AOID communication rejects missing nonce and audience mismatches', () => {
  const envelope = buildMachineCommunicationEnvelope({
    from: {
      role: 'pos-terminal',
      nodeId: 'NODE-POS-REPLAY',
      trustLevel: 'organization-trusted',
      capabilities: ['verify-waybill-alias', 'check-revocation-freshness'],
    },
    to: {
      role: 'locker-controller',
      nodeId: 'NODE-LOCKER-REPLAY',
      trustLevel: 'paired',
      capabilities: ['verify-aoid-reference', 'open-locker'],
    },
    purpose: 'locker-release',
    operation: 'locker-release-request',
    createdAt: '2026-06-20T09:00:00.000Z',
    publicPayload: {
      aoidCommitment: 'AOC-REPLAY-001',
      waybillAlias: 'WBA-REPLAY-001',
    },
  });
  const replayShape = {
    ...envelope,
    nonce: '',
    audience: 'NODE-OTHER-DEVICE',
  } as MachineCommunicationEnvelope;

  const verification = verifyMachineCommunicationEnvelope(replayShape, {
    now: '2026-06-20T09:00:05.000Z',
  });

  assert.equal(verification.valid, false);
  assert.ok(verification.errors.includes('machine-envelope-nonce-missing'));
  assert.ok(verification.errors.includes('machine-envelope-audience-mismatch'));
  assert.ok(verification.errors.includes('machine-envelope-signature-mismatch'));
});

test('machine AGID/AOID communication rejects raw private material and tampered envelopes', () => {
  const from = {
    role: 'pos-terminal' as const,
    trustLevel: 'organization-trusted' as const,
    capabilities: ['verify-waybill-alias' as const],
  };
  const to = {
    role: 'field-device' as const,
    trustLevel: 'paired' as const,
    capabilities: ['report-reachability' as const],
  };

  assert.throws(() => buildMachineCommunicationEnvelope({
    from,
    to,
    purpose: 'delivery-handoff',
    operation: 'handoff-request',
    publicPayload: {
      address: 'private-location-line',
      proofSecret: 'recipient-secret',
    },
  }), /private material/i);

  const safeEnvelope = buildMachineCommunicationEnvelope({
    from,
    to,
    purpose: 'reachability-report',
    operation: 'reachability-report',
    createdAt: '2026-06-20T09:00:00.000Z',
    publicPayload: {
      agidCommitment: 'AGC-TEST-001',
      coarseRegion: 'safe-region',
    },
  });

  const tampered = {
    ...safeEnvelope,
    publicPayload: {
      ...safeEnvelope.publicPayload,
      address: 'private-location-line',
    },
  } as MachineCommunicationEnvelope;
  const verification = verifyMachineCommunicationEnvelope(tampered, {
    now: '2026-06-20T09:00:05.000Z',
  });

  assert.equal(verification.valid, false);
  assert.ok(verification.errors.includes('machine-envelope-private-material-forbidden'));
  assert.ok(verification.errors.includes('machine-envelope-signature-mismatch'));
  assert.ok(verification.forbiddenFields.some(field => field.endsWith('.address')));
});

test('machine AGID/AOID communication sends public-untrusted nodes to review', () => {
  const envelope = buildMachineCommunicationEnvelope({
    from: {
      role: 'shopping-agent',
      trustLevel: 'public-untrusted',
      capabilities: ['verify-waybill-alias'],
    },
    to: {
      role: 'carrier-gateway',
      trustLevel: 'organization-trusted',
      capabilities: ['verify-waybill-alias', 'check-revocation-freshness'],
    },
    purpose: 'delivery-handoff',
    operation: 'handoff-request',
    createdAt: '2026-06-20T09:00:00.000Z',
    publicPayload: {
      waybillAlias: 'WBA-REVIEW-001',
      waybillCommitment: 'WBC-REVIEW-001',
    },
  });

  const handshake = negotiateMachineCommunication({
    request: envelope,
    now: '2026-06-20T09:00:05.000Z',
  });

  assert.equal(handshake.decision, 'review');
  assert.ok(handshake.warnings.includes('sender-public-untrusted-requires-review'));
});

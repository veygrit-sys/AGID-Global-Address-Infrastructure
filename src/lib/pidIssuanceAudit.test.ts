import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveAddressMorphism } from './addressMorphism';
import {
  createPidIssuanceAuditProof,
  stripPrivatePidIssuanceAuditMaterial,
  verifyPidIssuanceAuditProof,
} from './pidIssuanceAudit';

const issuerId = 'agid-pid-audit-test';
const issuerSecret = 'test-only-pid-audit-issuer-secret';
const privateAuditSalt = 'pid-audit-private-salt-for-tests';

const tokyoStationNative = {
  id: 'native-private-candidate-id',
  label: '東京都千代田区丸の内1丁目9-1',
  canonical: {
    country_code: 'jp',
    country: 'Japan',
    state: 'Tokyo',
    city: 'Chiyoda',
    subdistrict: 'Marunouchi',
    road: 'Marunouchi',
    house_number: '1-9-1',
    postcode: '1000005',
  },
  lat: 35.681236,
  lon: 139.767125,
  sources: ['jp-open-data', 'nominatim'],
  confidence: 0.92,
  validationScore: 0.94,
  historyEvents: [
    { kind: 'delivery_success' as const, weight: 5, source: 'owner-private-history' },
    { kind: 'manual_confirmation' as const, weight: 3, source: 'private-device-log' },
  ],
};

const tokyoStationEnglish = {
  id: 'english-private-candidate-id',
  label: '1-9-1 Marunouchi, Chiyoda City, Tokyo 100-0005, Japan',
  canonical: {
    country_code: 'jp',
    country: 'Japan',
    state: 'Tokyo',
    city: 'Chiyoda',
    subdistrict: 'Marunouchi',
    road: 'Marunouchi',
    house_number: '1-9-1',
    postcode: '1000005',
  },
  lat: 35.68124,
  lon: 139.76713,
  sources: ['parser', 'libpostal'],
  confidence: 0.86,
  validationScore: 0.9,
};

function resolveTokyoStation() {
  const candidates = [tokyoStationNative, tokyoStationEnglish];
  const result = resolveAddressMorphism({
    input: 'Tokyo Station Marunouchi 1-9-1 private input',
    context: {
      lat: 35.6812,
      lon: 139.7671,
      countryCode: 'jp',
      postcode: '1000005',
      purpose: 'registration',
    },
    candidates,
  });
  return { candidates, result };
}

test('issues a PID audit proof for candidate generation, clustering, unresolved gate, history update, and PID issuance', async () => {
  const { candidates, result } = resolveTokyoStation();
  const envelope = await createPidIssuanceAuditProof({
    issuerId,
    issuerSecret,
    inputAddress: 'Tokyo Station Marunouchi 1-9-1 private input',
    candidates,
    result,
    context: { countryCode: 'jp', postcode: '1000005', purpose: 'registration' },
    historyUpdate: {
      previousHistoryRoot: 'private-before-history-root',
      nextHistoryRoot: 'private-after-history-root',
      eventCount: 2,
      actorScope: 'owner-device',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    candidateGeneration: {
      generatorVersion: 'test-candidate-generator-v1',
    },
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 3600,
    privateAuditSalt,
  });

  assert.equal(envelope.claim.pid, result.pid);
  assert.equal(envelope.claim.status, 'verified');
  assert.equal(envelope.claim.steps.map(step => step.name).join(','), [
    'candidate-generation',
    'clustering',
    'unresolved-gate',
    'history-update',
    'pid-issuance',
  ].join(','));
  assert.equal(envelope.claim.steps.every(step => step.passed), true);
  assert.equal(envelope.claim.historyUpdate.eventCount, 2);
  assert.equal(envelope.claim.proofHint.zkpGenerated, false);
  assert.equal(envelope.claim.proofHint.zkReady, true);
  assert.equal(envelope.localCacheKey?.startsWith('pid-audit:'), true);

  const publicEnvelope = stripPrivatePidIssuanceAuditMaterial(envelope);
  const publicText = JSON.stringify(publicEnvelope);

  assert.equal('privateAuditSalt' in publicEnvelope, false);
  assert.equal('localCacheKey' in publicEnvelope, false);
  assert.equal(publicText.includes('Tokyo Station'), false);
  assert.equal(publicText.includes('Marunouchi'), false);
  assert.equal(publicText.includes('1000005'), false);
  assert.equal(publicText.includes('private-before-history-root'), false);
  assert.equal(publicText.includes('private-after-history-root'), false);
  assert.equal(publicText.includes('owner-private-history'), false);
  assert.equal(publicText.includes('native-private-candidate-id'), false);

  const verification = await verifyPidIssuanceAuditProof(publicEnvelope, {
    issuerId,
    issuerSecret,
    expectedPid: result.pid!,
    now: '2026-01-01T00:10:00.000Z',
    minimumEvidence: 0.8,
    minimumConfidence: 0.9,
  });

  assert.equal(verification.valid, true);
  assert.equal(verification.signatureValid, true);
  assert.equal(verification.workflowPassed, true);
  assert.equal(verification.privacyPreserved, true);
  assert.equal(verification.proofCost, 'none');
});

test('keeps commitments stable for the same hidden witnesses and private audit salt', async () => {
  const { candidates, result } = resolveTokyoStation();
  const baseInput = {
    issuerId,
    issuerSecret,
    inputAddress: 'Tokyo Station Marunouchi 1-9-1 private input',
    candidates,
    result,
    historyUpdate: {
      previousHistoryRoot: 'private-before-history-root',
      nextHistoryRoot: 'private-after-history-root',
      eventCount: 2,
    },
    issuedAt: '2026-01-01T00:00:00.000Z',
    privateAuditSalt,
  };

  const first = await createPidIssuanceAuditProof(baseInput);
  const second = await createPidIssuanceAuditProof(baseInput);

  assert.deepEqual(first.claim.commitments, second.claim.commitments);
  assert.equal(first.claim.pid, second.claim.pid);
});

test('rejects tampered PID audit proof signatures', async () => {
  const { candidates, result } = resolveTokyoStation();
  const envelope = await createPidIssuanceAuditProof({
    issuerId,
    issuerSecret,
    inputAddress: 'Tokyo Station Marunouchi 1-9-1 private input',
    candidates,
    result,
    historyUpdate: {
      nextHistoryRoot: 'private-after-history-root',
      eventCount: 1,
    },
    issuedAt: '2026-01-01T00:00:00.000Z',
    privateAuditSalt,
  });

  const tampered = {
    ...stripPrivatePidIssuanceAuditMaterial(envelope),
    claim: {
      ...envelope.claim,
      decision: {
        ...envelope.claim.decision,
        risk: 0.999,
      },
    },
  };

  const verification = await verifyPidIssuanceAuditProof(tampered, {
    issuerSecret,
    now: '2026-01-01T00:10:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.signatureValid, false);
  assert.ok(verification.errors.includes('signature-invalid'));
});

test('does not issue audit proof for unresolved PID results', async () => {
  const result = resolveAddressMorphism({
    input: 'unknown private address',
    candidates: [{
      id: 'weak-private-candidate',
      label: 'unknown private candidate label',
      canonical: {},
      confidence: 0.1,
      historyEvents: [{ kind: 'delivery_failure', weight: 4, source: 'private-failure-log' }],
    }],
  });

  await assert.rejects(
    createPidIssuanceAuditProof({
      issuerId,
      issuerSecret,
      inputAddress: 'unknown private address',
      candidates: [{
        id: 'weak-private-candidate',
        label: 'unknown private candidate label',
        canonical: {},
        confidence: 0.1,
      }],
      result,
      historyUpdate: {
        nextHistoryRoot: 'private-after-history-root',
        eventCount: 1,
      },
      privateAuditSalt,
    }),
    /selected PID/i
  );
});

test('requires a history update witness before proving PID issuance', async () => {
  const { candidates, result } = resolveTokyoStation();

  await assert.rejects(
    createPidIssuanceAuditProof({
      issuerId,
      issuerSecret,
      inputAddress: 'Tokyo Station Marunouchi 1-9-1 private input',
      candidates,
      result,
      historyUpdate: {
        nextHistoryRoot: '',
        eventCount: 0,
      },
      privateAuditSalt,
    }),
    /history update witness/i
  );
});

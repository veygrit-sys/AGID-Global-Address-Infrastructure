import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createDroneDeliveryEvidenceReceipt,
  listDroneDeliveryEvidenceApiCapabilities,
} from './droneDeliveryEvidenceApi';

test('drone delivery evidence API exposes reachability scope without flight control', () => {
  const capabilities = listDroneDeliveryEvidenceApiCapabilities();

  assert.equal(capabilities.version, 'drone-delivery-evidence-api-v1');
  assert.equal(capabilities.scope, 'delivery-evidence-and-reachability-only-no-flight-control');
  assert.ok(capabilities.endpoints.includes('POST /api/drone-delivery-evidence/report'));
  assert.ok(capabilities.acceptedProblemKinds.includes('drone-landing-impossible'));
  assert.match(capabilities.notInScope.join(' '), /autopilot command/i);
  assert.match(capabilities.notInScope.join(' '), /flight authorization/i);
});

test('completed drone evidence becomes a handoff report without leaking raw address fields', () => {
  const receipt = createDroneDeliveryEvidenceReceipt({
    deliveryId: 'delivery-secret-123',
    operatorRef: 'operator-alpha',
    missionRef: 'mission-hidden',
    accessGrantRef: 'grant-hidden',
    signedReceiptRef: 'signed-drone-receipt',
    outcome: 'completed',
    reporterType: 'drone-operator',
    reporterTrusted: true,
    agid: 'ML01R1A0ZTR4',
    rawAddress: 'Private recipient tower 8F',
    countryCode: 'JP',
    regionCode: 'JP-13',
    evidence: [
      { kind: 'device-attestation', signed: true },
      { kind: 'photo-redacted', redacted: true },
    ],
    now: '2026-06-18T12:00:00.000Z',
  });

  assert.equal(receipt.decision, 'attach-to-handoff-report');
  assert.equal(receipt.guarantees.autopilotCommandsEmitted, false);
  assert.equal(receipt.guarantees.flightControlStateStored, false);
  assert.equal(receipt.reachabilityReport.privacy.publicContainsRawAddress, false);
  assert.ok(receipt.publicApiProjection.coarseAgid?.startsWith('ML01R1A0'));
  assert.ok(receipt.restrictedOperatorReceipt.receiptCommitment.startsWith('drone.delivery.receipt:'));

  const publicJson = JSON.stringify(receipt.publicApiProjection);
  assert.doesNotMatch(publicJson, /Private recipient tower|delivery-secret-123|operator-alpha|mission-hidden/i);
});

test('cannot-reach drone reports stay restricted when precise telemetry or high-risk route exists', () => {
  const receipt = createDroneDeliveryEvidenceReceipt({
    deliveryId: 'delivery-drone-blocked',
    outcome: 'cannot-reach',
    problemKind: 'drone-no-fly',
    reporterType: 'drone-operator',
    reporterTrusted: true,
    deviceId: 'drone-unit-77',
    agid: 'DR01AREA9999',
    latitude: 35.681236,
    longitude: 139.767125,
    highRiskMode: true,
    evidence: [
      { kind: 'signed-drone-telemetry', signed: true, containsPreciseTelemetry: true },
    ],
    now: '2026-06-18T12:05:00.000Z',
  });

  assert.equal(receipt.decision, 'share-restricted-operator-receipt');
  assert.equal(receipt.publicApiProjection.publicationState, 'restricted');
  assert.equal(receipt.publicApiProjection.problemKind, 'access-limited');
  assert.ok(receipt.restrictedOperatorReceipt.closedFields.includes('preciseCoordinates'));
  assert.ok(receipt.restrictedOperatorReceipt.sensitiveTags.includes('drone-route-sensitive'));
  assert.ok(receipt.warnings.includes('drone-evidence-restricted-to-authorized-operator-receipt'));

  const publicJson = JSON.stringify(receipt.publicApiProjection);
  assert.doesNotMatch(publicJson, /35\.681236|139\.767125|drone-unit-77|delivery-drone-blocked/i);
});

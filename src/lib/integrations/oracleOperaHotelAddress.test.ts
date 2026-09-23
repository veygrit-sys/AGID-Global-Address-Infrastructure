import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildOracleOperaHotelAddressReview,
  getOracleOperaHotelRoleView,
  listOracleOperaHotelAddressSamples,
  ORACLE_OPERA_HOTEL_ADDRESS_ROLES,
  ORACLE_OPERA_HOTEL_ADDRESS_REVIEW_VERSION,
  type OracleOperaHotelAddressInput,
} from './oracleOperaHotelAddress';

const readySample = listOracleOperaHotelAddressSamples()[1] as OracleOperaHotelAddressInput;

test('Oracle OPERA hotel address review produces a ready OHIP-safe preview', () => {
  const review = buildOracleOperaHotelAddressReview(readySample);

  assert.equal(review.status, 'ready');
  assert.equal(review.queue.canQueue, true);
  assert.equal(review.mapper.mapperId, 'ohip-reservation-profile-address-mapper-v1');
  assert.equal(review.mapper.pathTemplate, '/ohip/v1/hotels/{hotelId}/reservations/{reservationId}/profiles/{profileId}/addresses');
  assert.equal(review.safeIntegrationPreview.reviewVersion, ORACLE_OPERA_HOTEL_ADDRESS_REVIEW_VERSION);
  assert.equal(review.safeIntegrationPreview.postalCodePresent, true);
  assert.ok(review.readinessScore >= 90);
  assert.ok(review.releaseGates.some(gate => gate.id === 'connectorFetchNoCache' && gate.status === 'pass'));
  assert.ok(review.releaseGates.some(gate => gate.id === 'noUnsafeRetry' && gate.status === 'pass'));
});

test('safe integration preview does not expose raw hotel address lines or postal code', () => {
  const review = buildOracleOperaHotelAddressReview(readySample);
  const safePreview = JSON.stringify(review.safeIntegrationPreview);

  assert.match(review.displayAddressLines.join('\n'), /1 Euston Road/);
  assert.doesNotMatch(safePreview, /1 Euston Road/);
  assert.doesNotMatch(safePreview, /N1C 4TB/);
  assert.doesNotMatch(safePreview, /Kings Cross Station Hotel/);
  assert.match(safePreview, /"postalCodePresent":true/);
});

test('OHIP preview separates Profile Reservation Address and Notes mappers', () => {
  const review = buildOracleOperaHotelAddressReview(readySample);

  assert.deepEqual(review.ohipMapperLanes.map(lane => lane.domain), ['Profile', 'Reservation', 'Address', 'Notes']);
  assert.ok(review.ohipMapperLanes.every(lane => lane.mapperId.startsWith('ohip-')));
  assert.ok(review.ohipMapperLanes.some(lane => lane.domain === 'Address' && lane.mapperId === review.mapper.mapperId));
  assert.ok(review.ohipMapperLanes.some(lane => lane.domain === 'Notes' && lane.safeFields.includes('causeCodes')));
  assert.doesNotMatch(JSON.stringify(review.ohipMapperLanes), /1 Euston Road|N1C 4TB|Kings Cross Station Hotel/);
});

test('sync state exposes waiting failure and resend policy as reason codes only', () => {
  const review = buildOracleOperaHotelAddressReview({
    ...readySample,
    oracleRawErrorExposed: true,
    rawAddressShared: true,
    noUnsafeRetry: false,
    oracleRawErrorSample: 'ORA-RAW-SECRET guest address 1 Euston Road N1C 4TB',
  });
  const publicConnectorSurface = JSON.stringify({
    safeIntegrationPreview: review.safeIntegrationPreview,
    ohipMapperLanes: review.ohipMapperLanes,
    syncState: review.syncState,
    auditEvents: review.auditEvents,
    warnings: review.warnings,
    queue: review.queue,
  });

  assert.equal(review.syncState.waiting.code, 'SYNC_BLOCKED');
  assert.equal(review.syncState.failure.code, 'SYNC_FAILED_REDACTED');
  assert.equal(review.syncState.resend.code, 'RESEND_FORBIDDEN_UNSAFE_RETRY_GATE');
  assert.ok(review.syncState.causeCodes.includes('ORACLE_RAW_ERROR_REDACTED'));
  assert.ok(review.syncState.causeCodes.includes('RAW_ADDRESS_RESPONSE_BLOCKED'));
  assert.ok(review.syncState.causeCodes.includes('UNSAFE_RETRY_FORBIDDEN'));
  assert.doesNotMatch(publicConnectorSurface, /ORA-RAW-SECRET|1 Euston Road|N1C 4TB/);
});

test('blocked OPERA release gates prevent queueing and keep Oracle raw errors redacted', () => {
  const review = buildOracleOperaHotelAddressReview({
    ...readySample,
    oracleRawErrorExposed: true,
    rawAddressShared: true,
    noUnsafeRetry: false,
    oracleRawErrorSample: 'ORA-RAW-SECRET guest address 1 Euston Road N1C 4TB',
  });
  const serialized = JSON.stringify(review);

  assert.equal(review.status, 'blocked');
  assert.equal(review.queue.canQueue, false);
  assert.ok(review.releaseGates.some(gate => gate.id === 'oracle-raw-error-redaction' && gate.status === 'block'));
  assert.ok(review.releaseGates.some(gate => gate.id === 'raw-address-redaction' && gate.status === 'block'));
  assert.ok(review.releaseGates.some(gate => gate.id === 'noUnsafeRetry' && gate.status === 'block'));
  assert.doesNotMatch(JSON.stringify(review.safeIntegrationPreview), /ORA-RAW-SECRET|1 Euston Road|N1C 4TB/);
  assert.doesNotMatch(serialized, /ORA-RAW-SECRET/);
});

test('missing postal code for countries with postal systems requires manual review', () => {
  const review = buildOracleOperaHotelAddressReview({
    ...readySample,
    postalCode: '',
  });

  assert.equal(review.status, 'needs-review');
  assert.equal(review.queue.canQueue, false);
  assert.ok(review.fieldChecks.some(check => check.id === 'postal-code' && check.status === 'review'));
  assert.ok(review.warnings.some(warning => /Postal code is missing/i.test(warning)));
});

test('Oracle OPERA role views separate admin, front desk, delivery, and customer visibility', () => {
  assert.deepEqual(ORACLE_OPERA_HOTEL_ADDRESS_ROLES.map(role => role.role), ['admin', 'frontDesk', 'delivery', 'customer']);

  const admin = getOracleOperaHotelRoleView('admin');
  const frontDesk = getOracleOperaHotelRoleView('frontDesk');
  const delivery = getOracleOperaHotelRoleView('delivery');
  const customer = getOracleOperaHotelRoleView('customer');

  assert.equal(admin.canQueueOperaSync, true);
  assert.equal(admin.canSeeReleaseGates, true);
  assert.equal(frontDesk.canEditAddress, true);
  assert.equal(frontDesk.canQueueOperaSync, false);
  assert.equal(delivery.canSeeRawStaffAddress, false);
  assert.equal(delivery.canSeeOperaMapper, false);
  assert.equal(customer.auditLogScope, 'customer-receipt');
  assert.equal(customer.canSeeReleaseGates, false);
});

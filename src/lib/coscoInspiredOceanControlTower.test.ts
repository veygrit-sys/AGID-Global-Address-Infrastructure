import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildCoscoInspiredOceanControlTower,
  COSCO_INSPIRED_OCEAN_CONTROL_TOWER_VERSION,
  validateCoscoInspiredOceanControlTower,
  validateIso6346ContainerNumber,
} from './coscoInspiredOceanControlTower';

test('validates ISO 6346-style container numbers and detects bad check digits', () => {
  const valid = validateIso6346ContainerNumber('MSCU6639870');
  assert.equal(valid.formatValid, true);
  assert.equal(valid.checkDigitValid, true);

  const invalid = validateIso6346ContainerNumber('COSU1234567');
  assert.equal(invalid.formatValid, true);
  assert.equal(invalid.checkDigitValid, false);
});

test('builds an in-transit ocean control tower without exposing booking, B/L, or container identifiers', () => {
  const tower = buildCoscoInspiredOceanControlTower({
    mode: 'external-carrier',
    carrierId: 'cosco-like-ocean',
    serviceCode: 'AWE1',
    bookingNumber: 'BK-PRIVATE-001',
    billOfLadingNumber: 'BOL-PRIVATE-001',
    containerNumbers: ['MSCU6639870'],
    rateTariffRef: 'rate-ref-001',
    origin: {
      portCode: 'CNSHA',
      city: 'Shanghai',
      countryCode: 'CN',
      agid: 'AGID-CN-SHANGHAI-PORT-PRIVATE',
      coarseAgid: 'AGID-CN-SH*',
    },
    destination: {
      portCode: 'USLAX',
      city: 'Los Angeles',
      countryCode: 'US',
      agid: 'AGID-US-LAX-PORT-PRIVATE',
      coarseAgid: 'AGID-US-LA*',
    },
    scheduleLegs: [
      {
        origin: { portCode: 'CNSHA', city: 'Shanghai', countryCode: 'CN', coarseAgid: 'AGID-CN-SH*' },
        destination: { portCode: 'USLAX', city: 'Los Angeles', countryCode: 'US', coarseAgid: 'AGID-US-LA*' },
        vesselName: 'COSCO INSPIRED VESSEL',
        voyageNumber: '088E',
        serviceCode: 'AWE1',
        status: 'departed',
        etd: '2026-06-01T08:00:00.000Z',
        eta: '2026-06-18T14:00:00.000Z',
      },
    ],
    milestones: [
      { status: 'booking-confirmed', observedAt: '2026-05-28T02:00:00.000Z', source: 'carrier', signed: true },
      { status: 'laden-gate-in', observedAt: '2026-05-31T16:00:00.000Z', source: 'terminal', signed: true },
      { status: 'vessel-departed', observedAt: '2026-06-01T08:30:00.000Z', source: 'carrier', signed: true },
    ],
    smartDocuments: [
      { type: 'bill-of-lading', status: 'accepted', documentRef: 'doc-bl-commitment', signed: true },
      { type: 'commercial-invoice', status: 'accepted', documentRef: 'doc-invoice-commitment', signed: true },
      { type: 'packing-list', status: 'accepted', documentRef: 'doc-pack-commitment', signed: true },
    ],
  });

  assert.equal(tower.version, COSCO_INSPIRED_OCEAN_CONTROL_TOWER_VERSION);
  assert.equal(tower.status, 'in-transit');
  assert.equal(tower.nextAction, 'track-cargo');
  assert.ok(tower.capabilities.includes('cargo-tracking'));
  assert.ok(tower.capabilities.includes('sailing-schedule'));
  assert.ok(tower.capabilities.includes('smart-documents'));
  assert.equal(tower.publicProjection.containerSummary.count, 1);
  assert.equal(tower.publicProjection.containerSummary.iso6346CheckDigitValid, 1);
  assert.equal(tower.publicProjection.route.legCount, 1);
  assert.equal(tower.privacy.rawBookingNumberStored, false);
  assert.equal(tower.privacy.rawBillOfLadingStored, false);
  assert.equal(tower.privacy.rawContainerNumbersStored, false);

  const publicText = JSON.stringify(tower.publicProjection);
  assert.equal(publicText.includes('BK-PRIVATE-001'), false);
  assert.equal(publicText.includes('BOL-PRIVATE-001'), false);
  assert.equal(publicText.includes('MSCU6639870'), false);
  assert.ok(tower.commitments.bookingNumber.startsWith('ocean:'));
  assert.ok(tower.commitments.billOfLadingNumber.startsWith('ocean:'));

  const validation = validateCoscoInspiredOceanControlTower(tower);
  assert.equal(validation.ok, true);
});

test('requires smart document remediation before ocean cargo can continue', () => {
  const tower = buildCoscoInspiredOceanControlTower({
    bookingNumber: 'BK-PRIVATE-002',
    origin: { portCode: 'JPTYO', countryCode: 'JP', coarseAgid: 'AGID-JP-TY*' },
    destination: { portCode: 'SGSIN', countryCode: 'SG', coarseAgid: 'AGID-SG-SI*' },
    scheduleLegs: [
      { origin: { portCode: 'JPTYO', countryCode: 'JP' }, destination: { portCode: 'SGSIN', countryCode: 'SG' } },
    ],
    smartDocuments: [
      { type: 'bill-of-lading', status: 'accepted', signed: true },
      { type: 'customs-declaration', status: 'missing' },
      { type: 'commercial-invoice', status: 'rejected' },
    ],
  });

  assert.equal(tower.status, 'docs-required');
  assert.equal(tower.nextAction, 'upload-smart-documents');
  assert.ok(tower.actions.includes('upload-smart-documents'));
  assert.equal(tower.publicProjection.documentSummary.missing, 1);
  assert.equal(tower.publicProjection.documentSummary.rejected, 1);
});

test('moves arrived ocean cargo into final-mile label creation when inland delivery is required', () => {
  const tower = buildCoscoInspiredOceanControlTower({
    bookingNumber: 'BK-PRIVATE-003',
    finalMileRequired: true,
    origin: { portCode: 'NLRTM', countryCode: 'NL', coarseAgid: 'AGID-NL-RT*' },
    destination: { portCode: 'GBFXT', countryCode: 'GB', coarseAgid: 'AGID-GB-FX*' },
    scheduleLegs: [
      { origin: { portCode: 'NLRTM', countryCode: 'NL' }, destination: { portCode: 'GBFXT', countryCode: 'GB' }, status: 'arrived' },
    ],
    milestones: [
      { status: 'booking-confirmed', source: 'carrier', signed: true, observedAt: '2026-06-01T00:00:00.000Z' },
      { status: 'vessel-arrived', source: 'carrier', signed: true, observedAt: '2026-06-10T00:00:00.000Z' },
      { status: 'discharged', source: 'terminal', signed: true, observedAt: '2026-06-11T00:00:00.000Z' },
    ],
    smartDocuments: [
      { type: 'bill-of-lading', status: 'accepted', signed: true },
      { type: 'release-order', status: 'accepted', signed: true },
    ],
  });

  assert.equal(tower.status, 'final-mile-required');
  assert.equal(tower.nextAction, 'create-final-mile-label');
  assert.ok(tower.actions.includes('create-final-mile-label'));
});

test('keeps high-risk ocean shipments coarse and flags unsigned/delayed milestones for control tower review', () => {
  const tower = buildCoscoInspiredOceanControlTower({
    highRiskMode: true,
    bookingNumber: 'BK-PRIVATE-004',
    containerNumbers: ['COSU1234567'],
    origin: { portCode: 'USLAX', countryCode: 'US', agid: 'AGID-US-LAX-PRIVATE', coarseAgid: 'AGID-US-LA*' },
    destination: { portCode: 'USSEA', countryCode: 'US', agid: 'AGID-US-SEA-PRIVATE', coarseAgid: 'AGID-US-SE*' },
    scheduleLegs: [
      { origin: { portCode: 'USLAX', countryCode: 'US' }, destination: { portCode: 'USSEA', countryCode: 'US' } },
    ],
    milestones: [
      { status: 'delayed', source: 'port', signed: false, observedAt: '2026-06-12T00:00:00.000Z' },
    ],
    smartDocuments: [
      { type: 'bill-of-lading', status: 'accepted', signed: true },
    ],
  });

  assert.equal(tower.publicProjection.publicMode, 'coarse-state-only');
  assert.ok(tower.warnings.includes('high-risk-mode-uses-coarse-port-agid-publicly'));
  assert.ok(tower.warnings.includes('unsigned-carrier-or-port-milestone'));
  assert.ok(tower.warnings.includes('control-tower-delay-or-exception'));
  assert.ok(tower.warnings.includes('container-check-digit-invalid'));
  assert.ok(tower.actions.includes('review-control-tower'));
  assert.equal(JSON.stringify(tower.publicProjection).includes('AGID-US-LAX-PRIVATE'), false);
  assert.equal(validateCoscoInspiredOceanControlTower(tower).ok, true);
});

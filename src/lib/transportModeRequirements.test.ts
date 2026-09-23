import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildTransportRequirementChecklist,
  getTransportModeProfile,
  listTransportModeProfiles,
} from './transportModeRequirements';

describe('transport mode requirements', () => {
  it('captures the required land, sea, and air capabilities', () => {
    const land = getTransportModeProfile('land');
    const sea = getTransportModeProfile('sea');
    const air = getTransportModeProfile('air');

    assert.deepEqual(listTransportModeProfiles().map(profile => profile.mode), ['land', 'sea', 'air']);

    for (const feature of [
      'ecmr-consignment-note',
      'driver-vehicle-trust',
      'proof-of-delivery',
      'pos-handoff',
      'recipient-proof',
      'offline-sync',
    ]) {
      assert.ok(land.requiredFeatures.includes(feature as never));
    }
    for (const feature of [
      'booking',
      'bill-of-lading',
      'container',
      'vessel-voyage',
      'port-terminal',
      'terminal-hold',
      'customs',
      'final-mile-handoff',
    ]) {
      assert.ok(sea.requiredFeatures.includes(feature as never));
    }
    for (const feature of [
      'awb-eawb',
      'flight-leg',
      'cutoff',
      'aviation-security',
      'dangerous-goods',
      'temperature-control',
      'iata-one-record-compatibility',
    ]) {
      assert.ok(air.requiredFeatures.includes(feature as never));
    }
  });

  it('builds a ready land checklist when POS handoff, POD, proof, and offline sync are present', () => {
    const checklist = buildTransportRequirementChecklist({
      mode: 'land',
      highRiskMode: true,
      offlineExpected: true,
      features: [
        'ecmr-consignment-note',
        'driver-vehicle-trust',
        'proof-of-delivery',
        'pos-handoff',
        'recipient-proof',
        'offline-sync',
      ],
      documents: ['ecmr', 'pod-receipt'],
      evidence: [
        { type: 'address-verification', status: 'complete' },
        { type: 'carrier-acceptance', status: 'complete' },
        { type: 'driver-device-signature', status: 'complete', signed: true },
        { type: 'vehicle-assignment', status: 'complete' },
        { type: 'recipient-proof', status: 'complete' },
        { type: 'pod', status: 'complete', signed: true },
        { type: 'offline-sync-receipt', status: 'complete' },
      ],
    });

    assert.equal(checklist.status, 'ready');
    assert.equal(checklist.nextAction, 'none');
    assert.deepEqual(checklist.blockers, []);
    assert.equal(checklist.privacy.rawAddressStored, false);
  });

  it('routes sea gaps toward ocean booking, B/L, container, customs, and final-mile evidence', () => {
    const checklist = buildTransportRequirementChecklist({
      mode: 'ocean',
      features: ['booking', 'container'],
      documents: ['booking-confirmation'],
      evidence: [
        { type: 'booking-confirmed', status: 'complete' },
        { type: 'container-validated', status: 'complete' },
      ],
    });

    assert.equal(checklist.mode, 'sea');
    assert.equal(checklist.status, 'requires-input');
    assert.equal(checklist.nextAction, 'collect-ocean-booking-and-document-evidence');
    assert.ok(checklist.blockers.includes('feature:bill-of-lading'));
    assert.ok(checklist.blockers.includes('feature:vessel-voyage'));
    assert.ok(checklist.blockers.includes('document:bill-of-lading'));
    assert.ok(checklist.blockers.includes('evidence:final-mile-created'));
  });

  it('requires signed and mode-specific evidence for air cargo', () => {
    const checklist = buildTransportRequirementChecklist({
      mode: 'air-cargo',
      dangerousGoods: true,
      temperatureControlled: true,
      features: [
        'awb-eawb',
        'flight-leg',
        'cutoff',
        'aviation-security',
        'dangerous-goods',
        'temperature-control',
        'iata-one-record-compatibility',
      ],
      documents: [
        'air-waybill',
        'security-screening',
        'dangerous-goods-declaration',
        'temperature-log',
        'iata-one-record',
        'customs-declaration',
      ],
      evidence: [
        { type: 'awb-accepted', status: 'complete' },
        { type: 'flight-leg-confirmed', status: 'complete' },
        { type: 'cutoff-validated', status: 'complete' },
        { type: 'security-screened', status: 'complete', signed: true },
        { type: 'dangerous-goods-cleared', status: 'complete' },
        { type: 'temperature-chain-ok', status: 'complete' },
        { type: 'one-record-compatible', status: 'complete' },
        { type: 'customs-release', status: 'complete', signed: true },
        { type: 'final-mile-created', status: 'complete' },
      ],
    });

    assert.equal(checklist.mode, 'air');
    assert.equal(checklist.status, 'requires-review');
    assert.equal(checklist.nextAction, 'manual-review');
    assert.ok(checklist.warnings.includes('evidence:awb-accepted'));
    assert.ok(!checklist.blockers.includes('document:dangerous-goods-declaration-required'));
  });
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildAddressSystemConnectionPlan } from './addressSystemConnection';
import { verifyAddressCandidate } from './addressVerificationEngine';

const jpFormat = {
  countryCode: 'JP',
  name: 'Japan',
  native: {
    addressFormat: '〒{{postcode}}\n{{state}}{{city}}{{street}}{{houseNumber}}',
    fields: [
      { key: 'postcode', required: true },
      { key: 'state', required: true },
      { key: 'city', required: true },
    ],
  },
  postalCode: {
    regex: '^\\d{3}-?\\d{4}$',
    source: 'Japan Post postal-code CSV',
  },
  addressRules: {
    postalCode: { required: true, usage: 'required' as const },
    openSourceIds: ['japan-post-csv'],
  },
};

const hkFormat = {
  countryCode: 'HK',
  name: 'Hong Kong',
  native: {
    addressFormat: '{{building}}\n{{street}}\n{{district}}\nHong Kong',
    fields: [
      { key: 'district', required: true },
      { key: 'street', required: true },
    ],
  },
  postalCode: {
    regex: null,
    source: 'Hongkong Post / LandsD / CSDI (No postal codes used)',
    format: 'No normal postal code',
  },
  addressRules: {
    postalCode: null,
    openSourceIds: ['hk-csdi', 'landsd', 'osm-nominatim'],
  },
};

test('connects Japan addresses through postal system, local format rules, and AGID binding', () => {
  const plan = buildAddressSystemConnectionPlan({
    countryCode: 'JP',
    targetCountries: ['JP'],
    format: jpFormat,
    postalMode: 'format-and-lookup',
    hasPostalCode: true,
    hasAgid: true,
    hasAoid: true,
    purpose: 'delivery',
  });

  assert.equal(plan.mode, 'postal-authoritative');
  assert.equal(plan.canIssuePid, true);
  assert.equal(plan.canBindAoid, true);
  assert.equal(plan.requiresManualConfirmation, false);
  assert.equal(plan.stages.find(stage => stage.layer === 'postal-routing')?.status, 'connected');
  assert.equal(plan.stages.find(stage => stage.layer === 'agid-spatial-cell')?.status, 'connected');
});

test('connects no-postal-code jurisdictions through official geodata and AGID instead of forcing postcode lookup', () => {
  const plan = buildAddressSystemConnectionPlan({
    countryCode: 'HK',
    targetCountries: ['HK'],
    format: hkFormat,
    postalMode: 'geo-only',
    hasPostalCode: false,
    hasCoordinates: true,
    sources: ['hk-csdi', 'landsd', 'osm-nominatim'],
    purpose: 'verification',
  });

  assert.equal(plan.mode, 'geo-official-reference');
  assert.equal(plan.coveragePolicyId, 'no-postal-strong-geo');
  assert.equal(plan.stages.find(stage => stage.layer === 'postal-routing')?.status, 'not-needed');
  assert.equal(plan.stages.find(stage => stage.layer === 'administrative-boundary')?.status, 'connected');
  assert.equal(plan.canIssuePid, true);
});

test('blocks address-system connection when jurisdiction and spatial anchor are absent', () => {
  const plan = buildAddressSystemConnectionPlan({
    hasPostalCode: true,
    purpose: 'registration',
  });

  assert.equal(plan.mode, 'unsupported');
  assert.equal(plan.canIssuePid, false);
  assert.equal(plan.canBindAoid, false);
  assert.ok(plan.nextActions.includes('resolve-jurisdiction'));
  assert.ok(plan.nextActions.includes('encode-coordinate-to-agid'));
});

test('address verification result exposes the address-system connection plan', () => {
  const result = verifyAddressCandidate({
    targetCountries: ['JP'],
    countryCode: 'JP',
    postalCode: '1000001',
    scope: 'address',
    format: jpFormat,
    systemConnection: {
      hasAgid: true,
      hasAoid: true,
      purpose: 'delivery',
    },
  });

  assert.equal(result.systemConnection.planVersion, 'address-system-connection-v1');
  assert.equal(result.systemConnection.mode, 'postal-authoritative');
  assert.equal(result.systemConnection.canBindAoid, true);
});

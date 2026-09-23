import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ADDRESS_MAP_QUALITY_LAYER_VERSION,
  evaluateAddressMapQualityLayer,
} from './addressMapQualityLayer';

test('accepts a delivery address only when geocoding, validation, routes, reverse geocoding, and boundary evidence agree', () => {
  const assessment = evaluateAddressMapQualityLayer({
    address: {
      countryCode: 'JP',
      city: 'Tokyo',
      postcode: '100-0001',
      agid: 'AGID-JP-TOKYO-0001',
      displayText: 'Tokyo Metropolitan Government Building\n2-8-1 Nishi-Shinjuku, Shinjuku-ku, Tokyo 163-8001',
    },
    deliveryRequired: true,
    evidence: [
      {
        source: 'geocoding',
        status: 'verified',
        provider: 'nominatim-self-host',
        confidence: 0.97,
        precision: 'rooftop',
        matchedCountryCode: 'JP',
        matchedCity: 'Tokyo',
        matchedPostcode: '100-0001',
      },
      {
        source: 'places',
        status: 'verified',
        provider: 'overture-osm',
        confidence: 0.92,
        placeType: 'government-building',
      },
      {
        source: 'address-validation',
        status: 'verified',
        provider: 'official-postal-reference',
        confidence: 0.94,
        deliverable: true,
        matchedCountryCode: 'JP',
        matchedCity: 'Tokyo',
        matchedPostcode: '100-0001',
      },
      {
        source: 'routes',
        status: 'verified',
        provider: 'osrm',
        confidence: 0.9,
        reachable: true,
      },
      {
        source: 'reverse-geocoding',
        status: 'verified',
        provider: 'pelias',
        confidence: 0.89,
        precision: 'street',
        matchedCountryCode: 'JP',
        matchedCity: 'Tokyo',
      },
      {
        source: 'boundary',
        status: 'verified',
        provider: 'overture-boundary',
        confidence: 0.95,
        insideBoundary: true,
        distanceToBoundaryMeters: 1200,
      },
    ],
  });

  assert.equal(assessment.version, ADDRESS_MAP_QUALITY_LAYER_VERSION);
  assert.equal(assessment.status, 'verified');
  assert.equal(assessment.decision, 'accept');
  assert.equal(assessment.deliveryEligibility, 'eligible');
  assert.equal(assessment.boundaryRisk, 'inside');
  assert.equal(assessment.scoreVisibleToUser, false);
  assert.equal(assessment.privacy.preciseCoordinatesExposed, false);
  assert.equal(assessment.privacy.rawAddressLogged, false);
  assert.ok(assessment.internalScore >= 0.78);
  assert.ok(assessment.sources.includes('geocoding'));
  assert.ok(assessment.actions.includes('accept'));
});

test('warns and asks for boundary reverification near borders without exposing a numeric score to users', () => {
  const assessment = evaluateAddressMapQualityLayer({
    address: {
      countryCode: 'FR',
      city: 'Strasbourg',
      postcode: '67000',
      agid: 'AGID-FR-ALSACE-EDGE',
      displayText: 'Rue du Rhin\nStrasbourg 67000\nFrance',
    },
    borderBufferMeters: 100,
    evidence: [
      { source: 'geocoding', status: 'verified', confidence: 0.88, precision: 'street', matchedCountryCode: 'FR', matchedCity: 'Strasbourg', matchedPostcode: '67000' },
      { source: 'address-validation', status: 'verified', confidence: 0.86, deliverable: true, matchedCountryCode: 'FR', matchedCity: 'Strasbourg', matchedPostcode: '67000' },
      { source: 'routes', status: 'verified', confidence: 0.82, reachable: true },
      { source: 'reverse-geocoding', status: 'verified', confidence: 0.8, precision: 'street', matchedCountryCode: 'FR', matchedCity: 'Strasbourg' },
      { source: 'boundary', status: 'verified', confidence: 0.9, insideBoundary: true, distanceToBoundaryMeters: 45 },
    ],
  });

  assert.equal(assessment.boundaryRisk, 'near-boundary');
  assert.equal(assessment.decision, 'warn');
  assert.ok(assessment.warnings.includes('map-quality-near-boundary'));
  assert.ok(assessment.actions.includes('reverify-boundary'));
  assert.equal(assessment.scoreVisibleToUser, false);
});

test('rejects outside-boundary or unreachable delivery evidence as a hard review condition', () => {
  const assessment = evaluateAddressMapQualityLayer({
    address: {
      countryCode: 'CL',
      city: 'Arica',
      postcode: '1000000',
      displayText: 'Arica port access road\nArica y Parinacota\nChile',
    },
    deliveryRequired: true,
    evidence: [
      { source: 'geocoding', status: 'partial', confidence: 0.68, precision: 'street', matchedCountryCode: 'CL', matchedCity: 'Arica' },
      { source: 'address-validation', status: 'failed', confidence: 0.2, deliverable: false, matchedCountryCode: 'CL' },
      { source: 'routes', status: 'failed', confidence: 0.1, reachable: false },
      { source: 'boundary', status: 'failed', confidence: 0.1, insideBoundary: false, distanceToBoundaryMeters: 0 },
    ],
  });

  assert.equal(assessment.status, 'needs-review');
  assert.equal(assessment.decision, 'reject');
  assert.equal(assessment.deliveryEligibility, 'not-eligible');
  assert.equal(assessment.boundaryRisk, 'outside');
  assert.ok(assessment.warnings.includes('map-quality-address-not-deliverable'));
  assert.ok(assessment.warnings.includes('map-quality-route-unreachable'));
  assert.ok(assessment.warnings.includes('map-quality-outside-boundary'));
  assert.ok(assessment.actions.includes('request-manual-review'));
});

test('detects cross-source country and postcode conflicts before accepting address display', () => {
  const assessment = evaluateAddressMapQualityLayer({
    address: {
      countryCode: 'JP',
      city: 'Tokyo',
      postcode: '100-0001',
      displayText: 'Chiyoda, Tokyo 100-0001',
    },
    evidence: [
      { source: 'geocoding', status: 'verified', confidence: 0.9, precision: 'street', matchedCountryCode: 'KR', matchedCity: 'Seoul', matchedPostcode: '04524' },
      { source: 'address-validation', status: 'partial', confidence: 0.62, deliverable: true, matchedCountryCode: 'JP', matchedCity: 'Tokyo', matchedPostcode: '100-0001' },
    ],
  });

  assert.equal(assessment.status, 'needs-review');
  assert.equal(assessment.decision, 'review');
  assert.ok(assessment.warnings.includes('map-quality-cross-source-country-conflict'));
  assert.ok(assessment.warnings.includes('map-quality-cross-source-postcode-conflict'));
});

test('keeps high-risk mode coarse and schedules missing reverse, validation, route, and boundary checks', () => {
  const assessment = evaluateAddressMapQualityLayer({
    highRiskMode: true,
    deliveryRequired: true,
    address: {
      countryCode: 'AQ',
      agid: 'AGID-AQ-FIELD-0001',
      displayText: 'AQ',
    },
    evidence: [
      { source: 'geocoding', status: 'partial', confidence: 0.5, precision: 'natural-feature', matchedCountryCode: 'AQ' },
    ],
  });

  assert.equal(assessment.privacy.highRiskMode, true);
  assert.equal(assessment.privacy.recommendedPublicMode, 'coarse-decision-only');
  assert.ok(assessment.actions.includes('use-coarse-mode'));
  assert.ok(assessment.actions.includes('run-reverse-geocoding'));
  assert.ok(assessment.actions.includes('run-address-validation'));
  assert.ok(assessment.actions.includes('run-route-check'));
  assert.ok(assessment.actions.includes('run-boundary-check'));
  assert.ok(assessment.actions.includes('ask-user-to-complete-address'));
  assert.equal(assessment.scoreVisibleToUser, false);
});

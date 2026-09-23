import assert from 'node:assert/strict';
import { test } from 'node:test';

import { COMMERCIAL_FEATURE_AREAS } from './openCoreProductStrategy';
import {
  getCommercialImpactForecast,
  validateCommercialImpactForecast,
} from './commercialImpactForecast';

test('covers every commercial feature area with a forecast line', () => {
  const forecast = getCommercialImpactForecast();
  const expected = COMMERCIAL_FEATURE_AREAS.map(area => area.id).sort();
  const actual = [...new Set(forecast.forecastLines.map(line => line.commercialFeatureId))].sort();

  assert.deepEqual(actual, expected);
  assert.equal(forecast.forecastLines.length, 10);
});

test('keeps the forecast ordered by low, base, and high scenarios', () => {
  const byHorizon = new Map(getCommercialImpactForecast().scenarios.map(scenario => [scenario.horizon, scenario]));

  assert.equal(byHorizon.get('12-month')?.baseArrUsd, 185000);
  assert.equal(byHorizon.get('24-month')?.baseArrUsd, 2700000);
  assert.equal(byHorizon.get('36-month')?.baseArrUsd, 10900000);

  for (const scenario of byHorizon.values()) {
    assert.ok(scenario.lowArrUsd <= scenario.baseArrUsd);
    assert.ok(scenario.baseArrUsd <= scenario.highArrUsd);
  }
  assert.ok((byHorizon.get('12-month')?.baseArrUsd ?? 0) < (byHorizon.get('24-month')?.baseArrUsd ?? 0));
  assert.ok((byHorizon.get('24-month')?.baseArrUsd ?? 0) < (byHorizon.get('36-month')?.baseArrUsd ?? 0));
});

test('identifies the most important commercial revenue drivers', () => {
  const forecast = getCommercialImpactForecast();

  assert.deepEqual(forecast.topRevenueDrivers.slice(0, 3), [
    'Private Deployment',
    'Advanced POS Management',
    'Hosted Registry API',
  ]);
  assert.ok(forecast.forecastLines.some(line => line.label === 'Address Radar / Signal' && line.impactScore >= 80));
});

test('monetizes operations without paywalling safety-critical basics', () => {
  const forecast = getCommercialImpactForecast();
  const allPricingAndGuardrails = forecast.forecastLines
    .flatMap(line => [...line.plausiblePricing, ...line.guardrails])
    .join(' ');
  const forbidden = forecast.doNotDoForRevenue.join(' ');

  assert.match(allPricingAndGuardrails, /free|self-host|local/i);
  assert.match(forbidden, /Do not sell raw addresses/);
  assert.match(forbidden, /Do not make high-risk privacy controls paid/);
  assert.match(forbidden, /Do not require Ethereum, ZK, or a hosted registry/);
  assert.match(forbidden, /token-first/);
});

test('validates the commercial impact forecast', () => {
  const validation = validateCommercialImpactForecast();

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.deepEqual(validation.warnings, []);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAddressDataLoadPlan,
  summarizeAddressDataLoadPlan,
} from './addressDataLoadPlan';
import { verifyAddressCandidate } from './addressVerificationEngine';

test('plans Japan postal verification without eager bulk loading', () => {
  const plan = buildAddressDataLoadPlan({
    countryCode: 'JP',
    targetCountries: ['JP'],
    postalMode: 'format-and-lookup',
    lookupRequired: true,
    hasPostalCode: true,
  });

  assert.equal(plan.countryCode, 'JP');
  assert.equal(plan.targetAllowed, true);
  assert.ok(plan.blocking.some(source => source.id === 'local-address-format-rules'));
  assert.ok(plan.onDemand.some(source => source.id === 'japan-post-digital-address-api'));
  assert.ok(plan.background.some(source => source.id === 'japan-post-csv'));
  assert.ok(plan.disabled.some(source => source.id === 'upu-universal-postcode-database'));
  assert.equal(
    plan.warnings.some(warning => warning.includes('No credential-free strong postal lookup source')),
    false,
  );
});

test('keeps geo-only targets out of mandatory postal dataset loading', () => {
  const plan = buildAddressDataLoadPlan({
    countryCode: 'HK',
    targetCountries: ['HK'],
    postalMode: 'geo-only',
    lookupRequired: false,
    hasPostalCode: false,
  });

  assert.equal(plan.lookupRequired, false);
  assert.ok(plan.onDemand.some(source => source.kind === 'geocoder'));
  assert.equal(plan.nextActions.includes('run-on-demand-postal-lookup-or-address-reference'), false);
  assert.ok(plan.warnings.some(warning => warning.includes('geo or non-postal')));
});

test('does not load legal framework metadata as a postal lookup source', () => {
  const plan = buildAddressDataLoadPlan({
    countryCode: 'GT',
    targetCountries: ['GT'],
    postalMode: 'format-and-lookup',
    lookupRequired: true,
    hasPostalCode: true,
  });

  const sourceIds = [
    ...plan.blocking,
    ...plan.background,
    ...plan.onDemand,
    ...plan.disabled,
  ].map(source => source.id);
  assert.ok(!sourceIds.includes('correos-guatemala-postal-legal-framework'));
});

test('summarizes load plans for API-safe diagnostics', () => {
  const summary = summarizeAddressDataLoadPlan(buildAddressDataLoadPlan({
    countryCode: 'DE',
    postalMode: 'format-and-lookup',
    lookupRequired: true,
  }));

  assert.equal(summary.countryCode, 'DE');
  assert.ok(summary.blocking.includes('local-address-format-rules'));
  assert.ok(summary.disabled.includes('upu-universal-postcode-database'));
  assert.ok(summary.nextActions.includes('configure-credentialless-official-source'));
});

test('address verification result carries a separate data loading plan', () => {
  const result = verifyAddressCandidate({
    targetCountries: ['JP'],
    countryCode: 'JP',
    postalCode: '1000001',
    scope: 'postal',
  });

  assert.equal(result.status, 'partial');
  assert.equal(result.dataLoading.countryCode, 'JP');
  assert.ok(result.dataLoading.onDemand.some(source => source.id === 'japan-post-digital-address-api'));
  assert.ok(result.audit.some(step => step.step === 'data-load-plan'));
});

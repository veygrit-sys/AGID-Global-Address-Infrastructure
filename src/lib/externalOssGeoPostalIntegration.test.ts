import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

import {
  buildExternalOssGeoPostalIntegrationPlan,
  buildExternalOssGeoPostalIntegrationPlans,
  summarizeExternalOssGeoPostalIntegrationPlans,
} from './externalOssGeoPostalIntegration';

const root = join(process.cwd(), 'src', 'data', 'address_formats');

function walkJsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walkJsonFiles(path) : path.endsWith('.json') ? [path] : [];
  });
}

function loadFormat(relativePath: string) {
  return {
    relativePath,
    format: JSON.parse(readFileSync(join(root, relativePath), 'utf8')),
  };
}

function loadAllFormats() {
  return walkJsonFiles(root).map(file => ({
    relativePath: relative(root, file),
    format: JSON.parse(readFileSync(file, 'utf8')),
  }));
}

test('Japan uses reliable postal autofill with official and OSS geo cross-checks', () => {
  const plan = buildExternalOssGeoPostalIntegrationPlan(loadFormat('asia/east_asia/JP.json'));
  const sourceIds = plan.sources.map(source => source.id);

  assert.equal(plan.policy.id, 'postal-reliable-api');
  assert.equal(plan.operationalClass, 'postal-code-available-reliable-api');
  assert.equal(plan.capabilities.postalAutofill, 'strong');
  assert.equal(plan.capabilities.postalValidation, 'strong');
  assert.equal(plan.adapterPolicy.queryMode, 'postal-code-first');
  assert.ok(sourceIds.includes('zipcloud-jp'));
  assert.ok(sourceIds.includes('jageocoder'));
  assert.ok(sourceIds.includes('gsi-basic-geospatial'));
  assert.ok(plan.sourceGroups.postal.length > 0);
  assert.ok(plan.sourceGroups.terrain.length > 0);
  assert.ok(plan.releaseGates.includes('public-source-license-ledger-required'));
});

test('Hong Kong is no-postcode strong-geo and should not force postal autofill', () => {
  const plan = buildExternalOssGeoPostalIntegrationPlan(loadFormat('asia/east_asia/HK.json'));
  const sourceIds = plan.sources.map(source => source.id);

  assert.equal(plan.policy.id, 'no-postal-strong-geo');
  assert.equal(plan.operationalClass, 'no-postal-code-strong-geo-oss');
  assert.equal(plan.capabilities.postalAutofill, 'disabled');
  assert.equal(plan.capabilities.geoVerification, 'primary');
  assert.equal(plan.adapterPolicy.queryMode, 'coordinate-first');
  assert.ok(sourceIds.includes('landsd-hk'));
  assert.ok(sourceIds.includes('csdi-hk'));
  assert.ok(plan.recommendations.some(item => item.includes('AGID/coordinates/admin hierarchy')));
});

test('Nigeria stays weak-postal with candidate-first behavior and manual priority', () => {
  const plan = buildExternalOssGeoPostalIntegrationPlan(loadFormat('africa/western_africa/NG.json'));

  assert.equal(plan.policy.id, 'postal-weak-api');
  assert.equal(plan.operationalClass, 'postal-code-available-weak-api');
  assert.equal(plan.capabilities.postalAutofill, 'candidate');
  assert.equal(plan.capabilities.postalValidation, 'format-only');
  assert.equal(plan.capabilities.manualFallback, true);
  assert.equal(plan.adapterPolicy.queryMode, 'candidate-first');
  assert.ok(plan.sourceGroups.address.length > 0);
  assert.ok(plan.sourceGroups.natural.length > 0);
  assert.ok(plan.recommendations.some(item => item.includes('manual input as source of truth')));
});

test('all address-format files can produce a maintainable external OSS integration plan', () => {
  const plans = buildExternalOssGeoPostalIntegrationPlans(loadAllFormats());
  const summary = summarizeExternalOssGeoPostalIntegrationPlans(plans);

  assert.equal(plans.length, summary.total);
  assert.equal(summary.total, loadAllFormats().length);
  assert.equal(Object.values(summary.byOperationalClass).reduce((total, count) => total + count, 0), summary.total);
  assert.ok(summary.byOperationalClass['postal-code-available-reliable-api'] > 0);
  assert.ok(summary.byOperationalClass['postal-code-available-weak-api'] > 0);
  assert.ok(summary.byOperationalClass['no-postal-code-strong-geo-oss'] > 0);
  assert.ok(summary.bySourceRole.postal > 0);
  assert.ok(summary.bySourceRole.geocoding > 0);
  assert.ok(summary.bySourceRole['admin-boundary'] > 0);
  assert.deepEqual(plans.flatMap(plan => plan.unregisteredSourceIds), []);

  for (const plan of plans) {
    assert.ok(plan.adapterPolicy.externalRequestPrivacy.length >= 4, `${plan.countryCode} should have external request privacy rules`);
    assert.ok(plan.releaseGates.includes('public-source-license-ledger-required'), `${plan.countryCode} should keep a license gate`);
  }
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ASIA_COUNTRY_CODES } from '../data/asiaOpenGeoSources';
import {
  buildAllAsiaGeographicValidationPlans,
  buildAsiaGeographicValidationPlan,
  isAsiaGeographicValidationCountry,
} from './asiaGeographicValidationPlan';

test('builds source-gated administrative, alias, and script-aware plans for every Asian registry country', () => {
  for (const countryCode of ASIA_COUNTRY_CODES) {
    const plan = buildAsiaGeographicValidationPlan(countryCode);
    assert.ok(plan, `${countryCode} should have an Asia geographic plan`);
    assert.equal(plan?.countryCode, countryCode);
    assert.equal(plan?.geographicScope, 'registry-label-only');

    const admin = plan?.capabilities.find(capability => capability.id === 'administrative-hierarchy');
    const aliases = plan?.capabilities.find(capability => capability.id === 'locality-aliases');
    const scripts = plan?.capabilities.find(capability => capability.id === 'script-aware-locality-aliases');
    const delivery = plan?.capabilities.find(capability => capability.id === 'delivery-claims');
    assert.equal(admin?.state, 'source-gated');
    assert.deepEqual(admin?.sourceIds, ['geoboundaries']);
    assert.equal(aliases?.state, 'source-gated');
    assert.deepEqual(aliases?.sourceIds, ['geonames-gazetteer']);
    assert.equal(scripts?.state, 'source-gated');
    assert.deepEqual(scripts?.sourceIds, ['geonames-gazetteer']);
    assert.equal(delivery?.state, 'disabled');
    assert.equal(plan?.sourceComposition.state, 'open-and-agid-source-gated');
    assert.deepEqual(
      plan?.sourceComposition.components.slice(0, 3).map(component => component.sourceId),
      ['geoboundaries', 'geonames-gazetteer', `agid-synthetic-administrative-evaluation-${countryCode.toLowerCase()}-v1`],
    );
    assert.equal(plan?.sourceComposition.deliveryClaimsEnabled, false);
    assert.ok(plan?.nonClaims.some(nonClaim => nonClaim.includes('sovereignty')));
  }
});

test('builds a reusable OSS, AGID, and country-source composition for every Asian registry country', () => {
  const plans = buildAllAsiaGeographicValidationPlans({
    countrySourceReadiness: [
      {
        countryCode: 'JP',
        sourceId: 'jp-official-admin',
        sourceOrigin: 'official-publication',
        approvedAdministrativeKeyCount: 1,
        syntheticAdministrativeEvaluationEligible: true,
        deliveryClaimsEnabled: false,
      },
      {
        countryCode: 'JP',
        sourceId: 'jp-maintained-oss-admin',
        sourceOrigin: 'maintained-open-source',
        approvedAdministrativeKeyCount: 1,
        syntheticAdministrativeEvaluationEligible: true,
        deliveryClaimsEnabled: false,
      },
    ],
  });
  assert.equal(plans.length, ASIA_COUNTRY_CODES.length);
  assert.deepEqual(plans.map(plan => plan.countryCode), [...ASIA_COUNTRY_CODES]);

  const japan = plans.find(plan => plan.countryCode === 'JP');
  assert.equal(japan?.sourceComposition.state, 'country-source-attached-source-gated');
  assert.deepEqual(
    japan?.sourceComposition.components
      .filter(component => component.role === 'country-scoped-metadata')
      .map(component => [component.sourceId, component.sourceOrigin]),
    [
      ['jp-maintained-oss-admin', 'maintained-open-source'],
      ['jp-official-admin', 'official-publication'],
    ],
  );
  assert.ok(japan?.sourceComposition.requiredGates.includes('script-ambiguity-and-reversible-normalization-policy'));
});

test('allows only explicit open-license metadata sources into the background plan', () => {
  const japan = buildAsiaGeographicValidationPlan('JP');
  assert.ok(japan);

  const geoBoundaries = japan?.sourcePlans.find(source => source.id === 'geoboundaries');
  const geoNames = japan?.sourcePlans.find(source => source.id === 'geonames-gazetteer');
  const jageocoder = japan?.sourcePlans.find(source => source.id === 'jageocoder');
  const geolonia = japan?.sourcePlans.find(source => source.id === 'geolonia-addresses');
  const zipcloud = japan?.sourcePlans.find(source => source.id === 'zipcloud-jp');
  const nominatim = japan?.sourcePlans.find(source => source.id === 'osm-nominatim');

  assert.equal(geoBoundaries?.reuseStatus, 'open-license-evidenced');
  assert.equal(geoBoundaries?.loadMode, 'background-metadata-index');
  assert.equal(geoNames?.reuseStatus, 'open-license-evidenced');
  assert.equal(geoNames?.loadMode, 'background-metadata-index');
  assert.equal(jageocoder?.reuseStatus, 'open-license-evidenced');
  assert.equal(jageocoder?.loadMode, 'disabled');
  assert.equal(geolonia?.reuseStatus, 'open-license-evidenced');
  assert.equal(geolonia?.loadMode, 'disabled');
  assert.equal(zipcloud?.role, 'postal-reference');
  assert.equal(zipcloud?.loadMode, 'disabled');
  assert.equal(nominatim?.loadMode, 'disabled');
  assert.ok(nominatim?.reason.includes('client-controlled ephemeral privacy contract'));
});

test('keeps postal candidates non-authoritative and excludes out-of-scope countries', () => {
  const china = buildAsiaGeographicValidationPlan('CN');
  const postal = china?.capabilities.find(capability => capability.id === 'postal-candidates');

  assert.equal(postal?.state, 'candidate-only');
  assert.ok(postal?.sourceIds.includes('china-postal-code'));
  assert.equal(buildAsiaGeographicValidationPlan('KE'), null);
  assert.equal(isAsiaGeographicValidationCountry('jp'), true);
  assert.equal(isAsiaGeographicValidationCountry('KE'), false);
});

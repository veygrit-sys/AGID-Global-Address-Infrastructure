import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AFRICA_COUNTRY_CODES } from '../data/africaOpenGeoSources';
import {
  buildAllAfricaGeographicValidationPlans,
  buildAfricaGeographicValidationPlan,
  isAfricaGeographicValidationCountry,
} from './africaGeographicValidationPlan';

test('builds a source-gated administrative and locality plan for every African country', () => {
  for (const countryCode of AFRICA_COUNTRY_CODES) {
    const plan = buildAfricaGeographicValidationPlan(countryCode);
    assert.ok(plan, `${countryCode} should have an Africa geographic plan`);
    assert.equal(plan?.countryCode, countryCode);

    const admin = plan?.capabilities.find(capability => capability.id === 'administrative-hierarchy');
    const aliases = plan?.capabilities.find(capability => capability.id === 'locality-aliases');
    const delivery = plan?.capabilities.find(capability => capability.id === 'delivery-claims');
    assert.equal(admin?.state, 'source-gated');
    assert.deepEqual(admin?.sourceIds, ['geoboundaries']);
    assert.equal(aliases?.state, 'source-gated');
    assert.deepEqual(aliases?.sourceIds, ['geonames-gazetteer']);
    assert.equal(delivery?.state, 'disabled');
    assert.equal(plan?.sourceComposition.state, 'open-and-agid-source-gated');
    assert.deepEqual(
      plan?.sourceComposition.components.slice(0, 3).map(component => component.sourceId),
      ['geoboundaries', 'geonames-gazetteer', `agid-synthetic-administrative-evaluation-${countryCode.toLowerCase()}-v1`],
    );
    assert.equal(plan?.sourceComposition.deliveryClaimsEnabled, false);
    assert.ok(plan?.nonClaims.some(nonClaim => nonClaim.includes('raw addresses')));
  }
});

test('builds a reusable OSS, AGID, and country-source composition for every African country', () => {
  const plans = buildAllAfricaGeographicValidationPlans({
    countrySourceReadiness: [
      {
        countryCode: 'LS',
        sourceId: 'ls-official-admin',
        sourceOrigin: 'official-publication',
        approvedAdministrativeKeyCount: 1,
        syntheticAdministrativeEvaluationEligible: true,
        deliveryClaimsEnabled: false,
      },
      {
        countryCode: 'LS',
        sourceId: 'ls-maintained-oss-admin',
        sourceOrigin: 'maintained-open-source',
        approvedAdministrativeKeyCount: 1,
        syntheticAdministrativeEvaluationEligible: true,
        deliveryClaimsEnabled: false,
      },
    ],
  });
  assert.equal(plans.length, AFRICA_COUNTRY_CODES.length);
  assert.deepEqual(plans.map(plan => plan.countryCode), [...AFRICA_COUNTRY_CODES]);

  const lesotho = plans.find(plan => plan.countryCode === 'LS');
  assert.equal(lesotho?.sourceComposition.state, 'country-source-attached-source-gated');
  assert.deepEqual(
    lesotho?.sourceComposition.components
      .filter(component => component.role === 'country-scoped-metadata')
      .map(component => [component.sourceId, component.sourceOrigin]),
    [
      ['ls-maintained-oss-admin', 'maintained-open-source'],
      ['ls-official-admin', 'official-publication'],
    ],
  );
  assert.ok(lesotho?.sourceComposition.requiredGates.includes('separate-postal-and-delivery-evidence'));
});

test('limits background indexing to explicit open-license administrative and locality metadata', () => {
  const kenya = buildAfricaGeographicValidationPlan('KE');
  assert.ok(kenya);

  const geoBoundaries = kenya?.sourcePlans.find(source => source.id === 'geoboundaries');
  const geoNames = kenya?.sourcePlans.find(source => source.id === 'geonames-gazetteer');
  const kenyaOpenData = kenya?.sourcePlans.find(source => source.id === 'kenya-open-data');
  const postaKenya = kenya?.sourcePlans.find(source => source.id === 'posta-kenya');
  const nominatim = kenya?.sourcePlans.find(source => source.id === 'osm-nominatim');

  assert.equal(geoBoundaries?.reuseStatus, 'open-license-evidenced');
  assert.equal(geoBoundaries?.loadMode, 'background-metadata-index');
  assert.equal(geoNames?.reuseStatus, 'open-license-evidenced');
  assert.equal(geoNames?.loadMode, 'background-metadata-index');
  assert.equal(kenyaOpenData?.reuseStatus, 'terms-review-required');
  assert.equal(kenyaOpenData?.loadMode, 'disabled');
  assert.equal(postaKenya?.role, 'postal-reference');
  assert.equal(postaKenya?.loadMode, 'disabled');
  assert.equal(nominatim?.loadMode, 'disabled');
  assert.ok(nominatim?.reason.includes('client-controlled ephemeral privacy contract'));
});

test('keeps postal operator material candidate-only and rejects non-African countries', () => {
  const nigeria = buildAfricaGeographicValidationPlan('NG');
  const postal = nigeria?.capabilities.find(capability => capability.id === 'postal-candidates');

  assert.equal(postal?.state, 'candidate-only');
  assert.ok(postal?.sourceIds.includes('nipost-postcode'));
  assert.equal(buildAfricaGeographicValidationPlan('JP'), null);
  assert.equal(isAfricaGeographicValidationCountry('za'), true);
  assert.equal(isAfricaGeographicValidationCountry('JP'), false);
});

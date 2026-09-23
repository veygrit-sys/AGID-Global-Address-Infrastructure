import assert from 'node:assert/strict';
import { test } from 'node:test';

import { EUROPE_COUNTRY_AND_TERRITORY_CODES } from '../data/europeOpenGeoSources';
import {
  buildAllEuropeGeographicValidationPlans,
  buildEuropeGeographicValidationPlan,
  isEuropeGeographicValidationCountry,
} from './europeGeographicValidationPlan';

test('builds source-gated administrative, multilingual, and neutral-scope plans for every Europe registry label', () => {
  for (const countryCode of EUROPE_COUNTRY_AND_TERRITORY_CODES) {
    const plan = buildEuropeGeographicValidationPlan(countryCode);
    assert.ok(plan, `${countryCode} should have a Europe geographic plan`);
    assert.equal(plan?.countryCode, countryCode);
    assert.equal(plan?.geographicScope, 'registry-label-only');

    const admin = plan?.capabilities.find(capability => capability.id === 'administrative-hierarchy');
    const aliases = plan?.capabilities.find(capability => capability.id === 'locality-aliases');
    const scripts = plan?.capabilities.find(capability => capability.id === 'cross-script-locality-aliases');
    const scope = plan?.capabilities.find(capability => capability.id === 'country-and-territory-scope-aliases');
    const delivery = plan?.capabilities.find(capability => capability.id === 'delivery-claims');
    assert.equal(admin?.state, 'source-gated');
    assert.deepEqual(admin?.sourceIds, ['geoboundaries']);
    assert.equal(aliases?.state, 'source-gated');
    assert.deepEqual(aliases?.sourceIds, ['geonames-gazetteer']);
    assert.equal(scripts?.state, 'source-gated');
    assert.deepEqual(scripts?.sourceIds, ['geonames-gazetteer']);
    assert.equal(scope?.state, 'source-gated');
    assert.deepEqual(scope?.sourceIds, ['geonames-gazetteer']);
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

test('builds a reusable OSS, AGID, and country-source composition for every Europe registry label', () => {
  const plans = buildAllEuropeGeographicValidationPlans({
    countrySourceReadiness: [
      {
        countryCode: 'FI',
        sourceId: 'fi-official-admin',
        sourceOrigin: 'official-publication',
        approvedAdministrativeKeyCount: 1,
        syntheticAdministrativeEvaluationEligible: true,
        deliveryClaimsEnabled: false,
      },
      {
        countryCode: 'FI',
        sourceId: 'fi-maintained-oss-admin',
        sourceOrigin: 'maintained-open-source',
        approvedAdministrativeKeyCount: 1,
        syntheticAdministrativeEvaluationEligible: true,
        deliveryClaimsEnabled: false,
      },
    ],
  });
  assert.equal(plans.length, EUROPE_COUNTRY_AND_TERRITORY_CODES.length);
  assert.deepEqual(plans.map(plan => plan.countryCode), [...EUROPE_COUNTRY_AND_TERRITORY_CODES]);

  const finland = plans.find(plan => plan.countryCode === 'FI');
  assert.equal(finland?.sourceComposition.state, 'country-source-attached-source-gated');
  assert.deepEqual(
    finland?.sourceComposition.components
      .filter(component => component.role === 'country-scoped-metadata')
      .map(component => [component.sourceId, component.sourceOrigin]),
    [
      ['fi-maintained-oss-admin', 'maintained-open-source'],
      ['fi-official-admin', 'official-publication'],
    ],
  );
  assert.ok(finland?.sourceComposition.requiredGates.includes('neutral-country-and-territory-scope-policy'));
});

test('does not auto-load open address registers, territorial postal sources, or geocoders', () => {
  const finland = buildEuropeGeographicValidationPlan('FI');
  const svalbard = buildEuropeGeographicValidationPlan('SJ_SVA');
  assert.ok(finland);
  assert.ok(svalbard);

  const geoBoundaries = finland?.sourcePlans.find(source => source.id === 'geoboundaries');
  const geoNames = finland?.sourcePlans.find(source => source.id === 'geonames-gazetteer');
  const dvvAddresses = finland?.sourcePlans.find(source => source.id === 'dvv-finland-address-data');
  const posti = finland?.sourcePlans.find(source => source.id === 'posti-finland-postal-code-services');
  const svalbardPost = svalbard?.sourcePlans.find(source => source.id === 'posten-norway-svalbard');
  const nominatim = finland?.sourcePlans.find(source => source.id === 'osm-nominatim');

  assert.equal(geoBoundaries?.loadMode, 'background-metadata-index');
  assert.equal(geoNames?.loadMode, 'background-metadata-index');
  assert.equal(dvvAddresses?.loadMode, 'disabled');
  assert.equal(posti?.role, 'postal-reference');
  assert.equal(posti?.loadMode, 'disabled');
  assert.equal(svalbardPost?.role, 'postal-reference');
  assert.equal(svalbardPost?.loadMode, 'disabled');
  assert.equal(nominatim?.loadMode, 'disabled');
  assert.ok(nominatim?.reason.includes('client-controlled ephemeral privacy contract'));
});

test('keeps postal candidates non-authoritative and rejects other regional labels', () => {
  const germany = buildEuropeGeographicValidationPlan('DE');
  const postal = germany?.capabilities.find(capability => capability.id === 'postal-candidates');

  assert.equal(postal?.state, 'candidate-only');
  assert.ok(postal?.sourceIds.includes('deutsche-post-plz-server'));
  assert.equal(buildEuropeGeographicValidationPlan('JP'), null);
  assert.equal(isEuropeGeographicValidationCountry('sj_sva'), true);
  assert.equal(isEuropeGeographicValidationCountry('JP'), false);
});

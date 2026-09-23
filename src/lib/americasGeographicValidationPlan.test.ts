import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AMERICAS_COUNTRY_CODES } from '../data/americasOpenGeoSources';
import {
  buildAllAmericasGeographicValidationPlans,
  buildAmericasGeographicValidationPlan,
  isAmericasGeographicValidationCountry,
} from './americasGeographicValidationPlan';

test('builds source-gated administrative, language, and island scope plans for every Americas registry label', () => {
  for (const countryCode of AMERICAS_COUNTRY_CODES) {
    const plan = buildAmericasGeographicValidationPlan(countryCode);
    assert.ok(plan, `${countryCode} should have an Americas geographic plan`);
    assert.equal(plan?.countryCode, countryCode);
    assert.equal(plan?.geographicScope, 'registry-label-only');

    const admin = plan?.capabilities.find(capability => capability.id === 'administrative-hierarchy');
    const aliases = plan?.capabilities.find(capability => capability.id === 'locality-aliases');
    const languages = plan?.capabilities.find(capability => capability.id === 'multilingual-locality-aliases');
    const islands = plan?.capabilities.find(capability => capability.id === 'island-and-territory-scope-aliases');
    const delivery = plan?.capabilities.find(capability => capability.id === 'delivery-claims');
    assert.equal(admin?.state, 'source-gated');
    assert.deepEqual(admin?.sourceIds, ['geoboundaries']);
    assert.equal(aliases?.state, 'source-gated');
    assert.deepEqual(aliases?.sourceIds, ['geonames-gazetteer']);
    assert.equal(languages?.state, 'source-gated');
    assert.deepEqual(languages?.sourceIds, ['geonames-gazetteer']);
    assert.equal(islands?.state, 'source-gated');
    assert.deepEqual(islands?.sourceIds, ['geonames-gazetteer']);
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

test('builds a reusable OSS, AGID, and country-source composition for every Americas registry label', () => {
  const plans = buildAllAmericasGeographicValidationPlans({
    countrySourceReadiness: [
      {
        countryCode: 'BR',
        sourceId: 'br-official-admin',
        sourceOrigin: 'official-publication',
        approvedAdministrativeKeyCount: 1,
        syntheticAdministrativeEvaluationEligible: true,
        deliveryClaimsEnabled: false,
      },
      {
        countryCode: 'BR',
        sourceId: 'br-maintained-oss-admin',
        sourceOrigin: 'maintained-open-source',
        approvedAdministrativeKeyCount: 1,
        syntheticAdministrativeEvaluationEligible: true,
        deliveryClaimsEnabled: false,
      },
    ],
  });
  assert.equal(plans.length, AMERICAS_COUNTRY_CODES.length);
  assert.deepEqual(plans.map(plan => plan.countryCode), [...AMERICAS_COUNTRY_CODES]);

  const brazil = plans.find(plan => plan.countryCode === 'BR');
  assert.equal(brazil?.sourceComposition.state, 'country-source-attached-source-gated');
  assert.deepEqual(
    brazil?.sourceComposition.components
      .filter(component => component.role === 'country-scoped-metadata')
      .map(component => [component.sourceId, component.sourceOrigin]),
    [
      ['br-maintained-oss-admin', 'maintained-open-source'],
      ['br-official-admin', 'official-publication'],
    ],
  );
  assert.ok(brazil?.sourceComposition.requiredGates.includes('neutral-country-and-territory-scope-policy'));
});

test('does not auto-load country portals, postcode services, or geocoders', () => {
  const costaRica = buildAmericasGeographicValidationPlan('CR');
  const anguilla = buildAmericasGeographicValidationPlan('AI');
  assert.ok(costaRica);
  assert.ok(anguilla);

  const geoBoundaries = costaRica?.sourcePlans.find(source => source.id === 'geoboundaries');
  const geoNames = costaRica?.sourcePlans.find(source => source.id === 'geonames-gazetteer');
  const snit = costaRica?.sourcePlans.find(source => source.id === 'snit-cr');
  const correos = costaRica?.sourcePlans.find(source => source.id === 'correos-cr-postal');
  const anguillaPost = anguilla?.sourcePlans.find(source => source.id === 'anguilla-post');
  const nominatim = costaRica?.sourcePlans.find(source => source.id === 'osm-nominatim');

  assert.equal(geoBoundaries?.loadMode, 'background-metadata-index');
  assert.equal(geoNames?.loadMode, 'background-metadata-index');
  assert.equal(snit?.loadMode, 'disabled');
  assert.equal(correos?.role, 'postal-reference');
  assert.equal(correos?.loadMode, 'disabled');
  assert.equal(anguillaPost?.role, 'postal-reference');
  assert.equal(anguillaPost?.loadMode, 'disabled');
  assert.equal(nominatim?.loadMode, 'disabled');
  assert.ok(nominatim?.reason.includes('client-controlled ephemeral privacy contract'));
});

test('keeps postal candidates non-authoritative and rejects other regional labels', () => {
  const brazil = buildAmericasGeographicValidationPlan('BR');
  const postal = brazil?.capabilities.find(capability => capability.id === 'postal-candidates');

  assert.equal(postal?.state, 'candidate-only');
  assert.ok(postal?.sourceIds.includes('viacep-br'));
  assert.equal(buildAmericasGeographicValidationPlan('JP'), null);
  assert.equal(isAmericasGeographicValidationCountry('gt'), true);
  assert.equal(isAmericasGeographicValidationCountry('JP'), false);
});

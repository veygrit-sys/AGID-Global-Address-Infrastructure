import assert from 'node:assert/strict';
import { test } from 'node:test';

import { OCEANIA_COUNTRY_AND_TERRITORY_CODES } from '../data/oceaniaOpenGeoSources';
import { buildApprovedCountryGeographicMetadataEvaluationIndex } from './countryGeographicMetadataEvaluationCatalog';
import { projectCountryGeographicMetadataReadiness } from './countryGeographicMetadataEvaluationIndex';
import {
  buildAllOceaniaGeographicValidationPlans,
  buildOceaniaGeographicValidationPlan,
  isOceaniaGeographicValidationCountry,
} from './oceaniaGeographicValidationPlan';

test('builds source-gated administrative, locality, and island plans for every Oceania registry label', () => {
  for (const countryCode of OCEANIA_COUNTRY_AND_TERRITORY_CODES) {
    const plan = buildOceaniaGeographicValidationPlan(countryCode);
    assert.ok(plan, `${countryCode} should have an Oceania geographic plan`);
    assert.equal(plan?.countryCode, countryCode);
    assert.equal(plan?.geographicScope, 'registry-label-only');

    const admin = plan?.capabilities.find(capability => capability.id === 'administrative-hierarchy');
    const aliases = plan?.capabilities.find(capability => capability.id === 'locality-aliases');
    const islands = plan?.capabilities.find(capability => capability.id === 'island-and-territory-aliases');
    const delivery = plan?.capabilities.find(capability => capability.id === 'delivery-claims');
    assert.equal(admin?.state, 'source-gated');
    assert.deepEqual(admin?.sourceIds, ['geoboundaries']);
    assert.equal(aliases?.state, 'source-gated');
    assert.deepEqual(aliases?.sourceIds, ['geonames-gazetteer']);
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

test('builds a reusable OSS, AGID, and country-source composition for every Oceania registry label', () => {
  const plans = buildAllOceaniaGeographicValidationPlans({
    countrySourceReadiness: [
      {
        countryCode: 'NZ',
        sourceId: 'nz-official-admin',
        sourceOrigin: 'official-publication',
        approvedAdministrativeKeyCount: 1,
        syntheticAdministrativeEvaluationEligible: true,
        deliveryClaimsEnabled: false,
      },
      {
        countryCode: 'NZ',
        sourceId: 'nz-maintained-oss-admin',
        sourceOrigin: 'maintained-open-source',
        approvedAdministrativeKeyCount: 1,
        syntheticAdministrativeEvaluationEligible: true,
        deliveryClaimsEnabled: false,
      },
    ],
  });
  assert.equal(plans.length, OCEANIA_COUNTRY_AND_TERRITORY_CODES.length);
  assert.deepEqual(plans.map(plan => plan.countryCode), [...OCEANIA_COUNTRY_AND_TERRITORY_CODES]);

  const newZealand = plans.find(plan => plan.countryCode === 'NZ');
  assert.equal(newZealand?.sourceComposition.state, 'country-source-attached-source-gated');
  assert.deepEqual(
    newZealand?.sourceComposition.components
      .filter(component => component.role === 'country-scoped-metadata')
      .map(component => [component.sourceId, component.sourceOrigin]),
    [
      ['nz-maintained-oss-admin', 'maintained-open-source'],
      ['nz-official-admin', 'official-publication'],
    ],
  );
  assert.ok(newZealand?.sourceComposition.requiredGates.includes('island-and-territory-scope-policy'));
});

test('attaches the approved Stats NZ metadata projection without enabling postal or delivery claims', () => {
  const index = buildApprovedCountryGeographicMetadataEvaluationIndex({ now: '2026-07-25T12:00:00Z' });
  const newZealand = buildOceaniaGeographicValidationPlan('NZ', {
    countrySourceReadiness: projectCountryGeographicMetadataReadiness(index, 'NZ'),
  });

  assert.equal(newZealand?.sourceComposition.state, 'country-source-attached-source-gated');
  assert.ok(newZealand?.sourceComposition.components.some(component => (
    component.sourceId === 'stats-nz-geographic-boundaries-2026'
    && component.sourceOrigin === 'official-publication'
  )));
  assert.equal(newZealand?.sourceComposition.deliveryClaimsEnabled, false);
  assert.equal(
    newZealand?.capabilities.find(capability => capability.id === 'delivery-claims')?.state,
    'disabled',
  );
});

test('does not auto-load national address, marine, or territory postal data', () => {
  const newZealand = buildOceaniaGeographicValidationPlan('NZ');
  const antarctica = buildOceaniaGeographicValidationPlan('AQ');
  assert.ok(newZealand);
  assert.ok(antarctica);

  const geoBoundaries = newZealand?.sourcePlans.find(source => source.id === 'geoboundaries');
  const geoNames = newZealand?.sourcePlans.find(source => source.id === 'geonames-gazetteer');
  const linzAddresses = newZealand?.sourcePlans.find(source => source.id === 'linz-nz-addresses');
  const australianTerritories = antarctica?.sourcePlans.find(source => source.id === 'auspost-territories');
  const nominatim = newZealand?.sourcePlans.find(source => source.id === 'osm-nominatim');

  assert.equal(geoBoundaries?.loadMode, 'background-metadata-index');
  assert.equal(geoNames?.loadMode, 'background-metadata-index');
  assert.equal(linzAddresses?.reuseStatus, 'open-license-evidenced');
  assert.equal(linzAddresses?.loadMode, 'disabled');
  assert.equal(australianTerritories?.role, 'postal-reference');
  assert.equal(australianTerritories?.loadMode, 'disabled');
  assert.equal(nominatim?.loadMode, 'disabled');
  assert.ok(nominatim?.reason.includes('client-controlled ephemeral privacy contract'));
});

test('keeps postal candidates non-authoritative and excludes other regional labels', () => {
  const fiji = buildOceaniaGeographicValidationPlan('FJ');
  const postal = fiji?.capabilities.find(capability => capability.id === 'postal-candidates');

  assert.equal(postal?.state, 'candidate-only');
  assert.ok(postal?.sourceIds.includes('post-fiji'));
  assert.equal(buildOceaniaGeographicValidationPlan('JP'), null);
  assert.equal(isOceaniaGeographicValidationCountry('au'), true);
  assert.equal(isOceaniaGeographicValidationCountry('JP'), false);
});

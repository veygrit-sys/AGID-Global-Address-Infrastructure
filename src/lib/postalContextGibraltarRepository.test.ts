import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../../', import.meta.url);
const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const manifest = readJson('data/postal_country_packs/gi/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/gi/postal-context/source-profile.json');
const review = readJson('reports/postal-context-m2/gi-source-review-2026-08-30.json');

test('Gibraltar defines one generic code without claiming an official postal boundary', () => {
  assert.equal(manifest.repository.country_code, 'GI');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.full_code_regex, '^GX11 1AA$');
  assert.equal(review.postalSystem.currentCodes, 1);
  assert.equal(review.postalSystem.normalizedCode, 'GX11 1AA');
  assert.equal(review.postalSystem.officialSubCountryPostalAreasAvailable, false);
  assert.equal(review.postalSystem.domesticAlternativeIsPostcode, false);
});

test('Gibraltar M2 requires a rights-cleared virtual territory surface', () => {
  const m2 = manifest.promotion.stages.find((stage: { id: string }) => stage.id === 'M2_current_gibraltar_generic_postcode_visualization');
  assert.deepEqual(m2, profile.m2_definition);
  assert.match(m2.definition, /single generic country-wide postcode/i);
  assert.match(m2.definition, /classified virtual rather than an official postal boundary/i);
  assert.match(m2.definition, /WFS without reproduction and distribution permission.*address-register rows.*parcels.*buildings.*synthetic fixtures/i);
});

test('official observations reconcile while eligible geometry remains zero', () => {
  assert.equal(review.dataQuality.completeness.postcodeDenominator, '1/1');
  assert.equal(review.dataQuality.consistency.upu2013GenericCodeMatchesUpuAugust2026SingleCode, true);
  assert.equal(review.geometry.officialPostalPolygonRecords, 0);
  assert.equal(review.geometry.rightsClearedVirtualTerritoryPolygonRecords, 0);
  assert.equal(review.geometry.productionEligibleRecords, 0);
  assert.equal(review.geometry.geoportalFeatureRowsQueried, 0);
  assert.equal(review.geometry.oarRowsQueried, 0);
  assert.equal(review.geometry.inventedDeliveryZones, 0);
});

test('Gibraltar review records the rights and real-app blocker truthfully', () => {
  assert.equal(review.rights.geoportalReproductionAndDistributionPermissionEstablished, false);
  assert.equal(review.rights.contractAcceptances, 0);
  assert.equal(review.rights.apiKeysRequestedOrUsed, 0);
  assert.equal(review.app.sharedAreaPathVerified, true);
  assert.equal(review.app.realGiRuntimeVerified, false);
  assert.equal(review.app.realGiApiVerified, false);
  assert.equal(review.app.realGiAppAreaVisualizationVerified, false);
  assert.equal(review.countryM2Achieved, false);
});

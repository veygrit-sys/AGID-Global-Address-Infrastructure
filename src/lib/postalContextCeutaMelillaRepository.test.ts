import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

import { getEuropeOpenSourceIds } from '../data/europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from './officialPostalSourceCatalog';

const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const manifest = readJson('data/postal_country_packs/ea/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/ea/postal-context/source-profile.json');
const m2Review = readJson('data/postal_country_packs/ea/postal-context/m2-source-review.json');
const sourceReport = readJson('reports/postal-context-m2/ea-source-review-2026-09-03.json');
const address = readJson('src/data/address_formats/europe/spanish_autonomous_regions/EA.json');
const hierarchy = readJson('src/data/address_hierarchy/europe.json');

test('EA keeps a country-specific M2 definition and no publishable runtime artifact', () => {
  assert.equal(manifest.repository.country_code, 'EA');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.equal(manifest.promotion.target_stage, 'M2_current_correos_ea_assignments_and_postal_area_visualization');
  assert.equal(manifest.promotion.data_completion_verified, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(existsSync('data/postal_country_packs/ea/postal-context/m2/descriptor.json'), false);
});

test('EA source review pins official view evidence while retaining zero production records', () => {
  assert.equal(profile.countryCode, 'EA');
  assert.equal(profile.allRawBodiesExcludedFromGit, true);
  assert.equal(profile.sources.length, 6);
  assert.ok(profile.sources.every((source: { bundled_here: boolean }) => source.bundled_here === false));
  assert.equal(m2Review.postalAuthorityFindings.currentPostalSystemConfirmed, true);
  assert.deepEqual(m2Review.postalAuthorityFindings.distinctSourceMembers, ['Ceuta', 'Melilla']);
  assert.equal(m2Review.geometryQuality.officialViewPolygonSamplesValidated, 1);
  assert.equal(m2Review.geometryQuality.samplePositionCount, 184);
  assert.equal(m2Review.geometryQuality.productionEligibleRecords, 0);
  assert.equal(m2Review.qualityEnhancement.huggingFaceOrModelProductionIngested, false);
});

test('EA exact receipt report is reproducible and excludes raw bodies from Git', () => {
  assert.equal(sourceReport.result, 'blocked');
  assert.equal(sourceReport.receiptCount, 9);
  assert.equal(sourceReport.receiptBytes, 514425);
  assert.equal(sourceReport.officialViewSample.postalCode, '51001');
  assert.equal(sourceReport.officialViewSample.geometryType, 'Polygon');
  assert.equal(sourceReport.officialViewSample.positionCount, 184);
  assert.equal(sourceReport.officialViewSample.productionEligible, false);
  assert.equal(sourceReport.pointAndAreaSeparation.findGeometryType, 'Point');
  assert.equal(sourceReport.pointAndAreaSeparation.pointPromotedToArea, false);
  assert.equal(sourceReport.rights.cartociudadExplicitViewOnly, true);
  assert.equal(sourceReport.rights.cnigSoleDistributorAndConsultationOnly, true);
  assert.equal(sourceReport.rights.agidCompatibleBulkRedistributionEstablished, false);
  assert.equal(sourceReport.rawBodiesBundledInGit, false);
  assert.ok(sourceReport.receipts.every((receipt: { sha256: string }) => /^[a-f0-9]{64}$/.test(receipt.sha256)));
});

test('EA metadata accepts both members and exposes official source references', () => {
  assert.equal(address.name, 'Ceuta and Melilla');
  assert.equal(address.postalCode.regex, '^(?:51|52)\\d{3}$');
  assert.ok(address.openSourceIds.includes('correos-spain'));
  assert.ok(address.openSourceIds.includes('ign-spain-cnig'));
  const serialized = JSON.stringify(hierarchy);
  assert.ok(serialized.includes('Ceuta and Melilla'));
  assert.ok(serialized.includes('^(?:51|52)\\\\d{3}$'));
  const sourceIds = getEuropeOpenSourceIds('EA');
  assert.ok(sourceIds.includes('correos-spain'));
  assert.ok(sourceIds.includes('ign-spain-cnig'));
  const officialIds = getOfficialPostalSourcesForCountry('EA').map(source => source.id);
  assert.ok(officialIds.includes('cartociudad-ea-postcodes'));
  assert.ok(officialIds.includes('cartociudad-ea-wms'));
  assert.ok(officialIds.includes('correos-data-ea'));
});

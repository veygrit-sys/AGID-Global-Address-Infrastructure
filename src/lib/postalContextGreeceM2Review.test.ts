import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type SourceReview = {
  countryCode: string;
  m2Definition: { id: string; definition: string };
  officialObservations: Array<{ contentVerified: boolean }>;
  tercetAudit: Record<string, number | string | string[]>;
  geometry: Record<string, number | boolean>;
  rights: Record<string, number | boolean>;
  app: Record<string, boolean>;
  countryM2Achieved: boolean;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const review = JSON.parse(readFileSync(resolve(root, 'reports/postal-context-m2/gr-source-review-2026-08-30.json'), 'utf8')) as SourceReview;
const manifest = JSON.parse(readFileSync(resolve(root, 'data/postal_country_packs/gr/postal-context/repository-manifest.json'), 'utf8')) as {
  promotion: { current_stage: string; stages: Array<{ id: string; definition: string }> };
};

test('Greece M2 definition requires current ELTA assignments and real area visualization', () => {
  const stage = manifest.promotion.stages.find(candidate => candidate.id === review.m2Definition.id);
  assert.equal(review.countryCode, 'GR');
  assert.deepEqual(stage, review.m2Definition);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.match(review.m2Definition.definition, /ELTA nationwide.*Polygon\/MultiPolygon.*real GR loader, API and app/i);
});

test('Greece TERCET audit is exact but does not claim operator completeness', () => {
  assert.equal(review.tercetAudit.rows, 1041);
  assert.equal(review.tercetAudit.distinctPostalCodes, 1041);
  assert.equal(review.tercetAudit.duplicateRows, 0);
  assert.equal(review.tercetAudit.invalidFiveDigitCodes, 0);
  assert.deepEqual(review.tercetAudit.columns, ['NUTS3', 'CODE']);
  assert.equal(review.tercetAudit.authoritativeEltaAssignmentRows, 0);
});

test('Greece review keeps point, NUTS, census, address and land authorities separate', () => {
  assert.ok(review.officialObservations.every(observation => observation.contentVerified));
  assert.equal(review.geometry.officialPostalPolygonRecords, 0);
  assert.equal(review.geometry.giscoOrGeoNamesPointsPromoted, 0);
  assert.equal(review.geometry.nutsOrAdministrativeProxyRecords, 0);
  assert.equal(review.geometry.elstatFeatureRowsQueried, 0);
  assert.equal(review.geometry.cadastreOrLandRowsQueried, 0);
  assert.equal(review.geometry.pointBuffers, 0);
  assert.equal(review.geometry.voronoiCells, 0);
  assert.equal(review.geometry.syntheticFixturePromoted, false);
});

test('Greece remains blocked without fabricating a real API or app area', () => {
  assert.equal(review.rights.eltaBulkAssignmentReusePermissionEstablished, false);
  assert.equal(review.rights.eltaPolygonReusePermissionEstablished, false);
  assert.equal(review.app.sharedAreaPathVerified, true);
  assert.equal(review.app.realGrRuntimeVerified, false);
  assert.equal(review.app.realGrApiVerified, false);
  assert.equal(review.app.realGrAppAreaVisualizationVerified, false);
  assert.equal(review.countryM2Achieved, false);
});

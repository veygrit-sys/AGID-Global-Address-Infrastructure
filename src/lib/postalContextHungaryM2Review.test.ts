import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (path: string) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const review = readJson('reports/postal-context-m2/hu-source-review-2026-08-30.json');
const manifest = readJson('data/postal_country_packs/hu/postal-context/repository-manifest.json');

test('Hungary review pins a country-specific current-assignment and real-area definition', () => {
  assert.equal(review.countryCode, 'HU');
  assert.equal(review.baseCommit, '1ae561564aa09afb5fe85d3b0f9abb5ed82308dc');
  assert.equal(review.m2Definition.id, 'M2_current_magyar_posta_assignment_and_postcode_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find((stage: { id: string }) => stage.id === review.m2Definition.id), review.m2Definition);
  assert.match(review.m2Definition.definition, /Magyar Posta.*special.*Polygon\/MultiPolygon.*real HU loader.*app/i);
});

test('Hungary official observations bind exact bodies and preserve controlled-source boundaries', () => {
  assert.equal(review.officialObservations.length, 8);
  assert.ok(review.officialObservations.every((source: { contentVerified: boolean }) => source.contentVerified));
  assert.ok(review.officialObservations.every((source: { byteLength: number }) => source.byteLength > 0));
  assert.ok(review.officialObservations.every((source: { sha256: string }) => /^sha256:[a-f0-9]{64}$/.test(source.sha256)));
  assert.equal(review.rights.partnerExtraRawRowsCommitted, false);
  assert.equal(review.rights.kcrPublicBulkAccessEstablished, false);
  assert.equal(review.rights.authenticatedRequests, 0);
  assert.equal(review.rights.paidOperations, 0);
});

test('current Magyar Posta data is valid assignment evidence but has no special class or area', () => {
  assert.equal(review.postalAudit.rows, 3817);
  assert.equal(review.postalAudit.distinctPostalCodes, 3817);
  assert.equal(review.postalAudit.duplicatePostalCodes, 0);
  assert.equal(review.postalAudit.invalidFourDigitCodes, 0);
  assert.equal(review.postalAudit.blankCodes, 0);
  assert.equal(review.postalAudit.leadingZeroCodes, 16);
  assert.equal(review.postalAudit.specialClassFields, 0);
  assert.equal(review.postalAudit.coordinateFields, 0);
  assert.equal(review.postalAudit.polygonOrMultiPolygonRecords, 0);
});

test('TERCET is internally valid but cannot replace the current denominator or area', () => {
  assert.equal(review.tercetAudit.rows, 3156);
  assert.equal(review.tercetAudit.distinctPostalCodes, 3156);
  assert.equal(review.tercetAudit.invalidFourDigitCodes, 0);
  assert.equal(review.tercetAudit.coordinateColumns, 0);
  assert.equal(review.tercetAudit.polygonOrMultiPolygonRecords, 0);
  assert.equal(review.comparison.overlapDistinctCodes, 3049);
  assert.equal(review.comparison.onlyCurrentMagyarPostaCodes, 768);
  assert.equal(review.comparison.onlyTercet2025Codes, 107);
  assert.equal(review.comparison.currentMagyarPostaCoverageByTercetPercent, 79.879);
});

test('Hungary does not fabricate geometry or claim a real API or browser path', () => {
  assert.equal(review.geometry.officialPostalPolygonRecords, 0);
  assert.equal(review.geometry.rightsClearedDerivedPostalPolygonRecords, 0);
  assert.equal(review.geometry.pointBuffers, 0);
  assert.equal(review.geometry.voronoiCells, 0);
  assert.equal(review.geometry.syntheticFixturePromoted, false);
  assert.equal(review.app.sharedAreaPathVerified, true);
  assert.equal(review.app.realHuRuntimeVerified, false);
  assert.equal(review.app.realHuApiVerified, false);
  assert.equal(review.app.realHuAppAreaVisualizationVerified, false);
  assert.equal(review.browserReview.browserPluginAttempted, false);
  assert.equal(review.countryM2Achieved, false);
});

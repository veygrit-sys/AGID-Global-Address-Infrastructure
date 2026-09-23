import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Review = {
  countryCode: string;
  baseCommit: string;
  m2Definition: { id: string; definition: string };
  officialObservations: Array<{ id: string; byteLength: number; sha256: string; contentVerified: boolean }>;
  tercetAudit: {
    rows: number;
    distinctPostalCodes: number;
    duplicateRows: number;
    duplicatePostalCodes: number;
    rawSingleQuotedCodeRows: number;
    normalizedExactFiveDigitCodes: number;
    invalidNormalizedCodes: number;
    coordinateColumns: number;
    polygonOrMultiPolygonRecords: number;
    authoritativeHrvatskaPostaAssignmentRows: number;
  };
  geometry: Record<string, number | boolean>;
  rights: Record<string, number | boolean>;
  app: Record<string, boolean>;
  browserReview: { browserPluginAttempted: boolean; succeeded: boolean };
  countryM2Achieved: boolean;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const review = JSON.parse(readFileSync(
  resolve(root, 'reports/postal-context-m2/hr-source-review-2026-08-30.json'),
  'utf8',
)) as Review;
const manifest = JSON.parse(readFileSync(
  resolve(root, 'data/postal_country_packs/hr/postal-context/repository-manifest.json'),
  'utf8',
)) as { promotion: { stages: Array<{ id: string; definition: string }> } };

test('Croatia review pins a country-specific current-assignment and real-area definition', () => {
  assert.equal(review.countryCode, 'HR');
  assert.equal(review.baseCommit, 'f2dceed066ebeced7ac04590e3c239a8d1766084');
  assert.equal(review.m2Definition.id, 'M2_current_hrvatska_posta_assignment_and_postcode_area_visualization');
  assert.deepEqual(
    manifest.promotion.stages.find(stage => stage.id === review.m2Definition.id),
    review.m2Definition,
  );
  assert.match(review.m2Definition.definition, /Hrvatska pošta.*DGU.*Polygon\/MultiPolygon.*real HR loader.*app/i);
});

test('Croatia official observations bind exact bodies without promoting restricted downloads', () => {
  assert.equal(review.officialObservations.length, 9);
  assert.ok(review.officialObservations.every(source => source.contentVerified));
  assert.ok(review.officialObservations.every(source => source.byteLength > 0));
  assert.ok(review.officialObservations.every(source => /^sha256:[a-f0-9]{64}$/.test(source.sha256)));
  assert.equal(review.rights.croatianPostDataFilesDownloaded, false);
  assert.equal(review.rights.croatianPostExpressConsentObtained, false);
  assert.equal(review.rights.dguRegisterRequestSubmitted, false);
  assert.equal(review.rights.paidOperations, 0);
  assert.equal(review.rights.contractAcceptances, 0);
});

test('TERCET Croatia audit is internally valid but contains no operator denominator or area', () => {
  assert.equal(review.tercetAudit.rows, 667);
  assert.equal(review.tercetAudit.distinctPostalCodes, 667);
  assert.equal(review.tercetAudit.duplicateRows, 0);
  assert.equal(review.tercetAudit.duplicatePostalCodes, 0);
  assert.equal(review.tercetAudit.rawSingleQuotedCodeRows, 667);
  assert.equal(review.tercetAudit.normalizedExactFiveDigitCodes, 667);
  assert.equal(review.tercetAudit.invalidNormalizedCodes, 0);
  assert.equal(review.tercetAudit.coordinateColumns, 0);
  assert.equal(review.tercetAudit.polygonOrMultiPolygonRecords, 0);
  assert.equal(review.tercetAudit.authoritativeHrvatskaPostaAssignmentRows, 0);
});

test('Croatia does not fabricate geometry or claim a real API or browser path', () => {
  assert.equal(review.geometry.officialPostalPolygonRecords, 0);
  assert.equal(review.geometry.rightsClearedDerivedPostalPolygonRecords, 0);
  assert.equal(review.geometry.operatorOfficeToDguCrosswalkRows, 0);
  assert.equal(review.geometry.pointBuffers, 0);
  assert.equal(review.geometry.voronoiCells, 0);
  assert.equal(review.geometry.syntheticFixturePromoted, false);
  assert.equal(review.app.sharedAreaPathVerified, true);
  assert.equal(review.app.realHrRuntimeVerified, false);
  assert.equal(review.app.realHrApiVerified, false);
  assert.equal(review.app.realHrAppAreaVisualizationVerified, false);
  assert.equal(review.browserReview.browserPluginAttempted, false);
  assert.equal(review.browserReview.succeeded, false);
  assert.equal(review.countryM2Achieved, false);
});

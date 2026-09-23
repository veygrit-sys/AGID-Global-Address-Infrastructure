import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const gy = ledger.countries.find(country => country.countryCode === 'GY');
const manifest = readJson('data/postal_country_packs/gy/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/gy/postal-context/source-profile.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/gy-source-review-2026-09-01.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/gy-checks-2026-09-01.json', root));

test('GY remains M1 blocked under its current real-area definition', () => {
  assert.equal(gy.status, 'blocked'); assert.equal(gy.attempts, 1); assert.equal(gy.evidence, null);
  assert.equal(gy.m2Definition.id, 'M2_current_gpoc_guyana_seven_digit_postcode_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === gy.m2Definition.id), gy.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('GY fixes the current GPOC finder denominator and exceptions', () => {
  const e = gy.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 14); assert.equal(e.exactOfficialBodiesBytes, 3938769);
  assert.equal(e.finderRows, 2272); assert.equal(e.currentValidSevenDigitCodes, 214); assert.deepEqual(e.invalidCodeValues, ['120101']);
});

test('missing rights and geometry never promote contextual proxies', () => {
  const e = gy.blocker.evidence;
  assert.equal(e.gpocOpenPostalDatasetLicencePublishedOnReviewedBodies, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.productionEligibleRecords, 0); assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('GY reports are digest-pinned and exactly one country advances', () => {
  assert.equal(digest(sourceReport), gy.lastAttempt.reportDigest); assert.equal(digest(checks), gy.lastAttempt.engineeringReportDigest);
  assert.equal(gy.blocker.evidence.publishedEvidenceCommit, 'c2d7c2d873ab8f25fbb304d08ed20a3549c53137');
  const next = ledger.countries.find(country => country.countryCode === 'HN'); assert.equal(next.status, 'pending'); assert.equal(next.attempts, 0);
});

test('running app evidence records the wrong-country failure without promotion', () => {
  const e = gy.blocker.evidence;
  assert.equal(e.appStarted, true); assert.equal(e.fallbackBrowserVisualInspectionCompleted, true);
  assert.equal(e.gyPostalContextRequestObservedInBrowser, false); assert.equal(e.realGyAgidPostalApiVerified, false);
  assert.equal(e.realGyAgidAppAreaVisualizationVerified, false); assert.equal(e.postalAreaUnavailableNoticeDisplayed, false);
  assert.equal(e.directGyPostalApiStatus, 404); assert.match(gy.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});

test('GY and source object identities and non-area exceptions remain separate', () => {
  const e = gy.blocker.evidence;
  assert.equal(e.gyIdentityPreserved, true); assert.equal(e.gpocRegionLocalitySublocalityStreetAndOfficeIdentitiesPreserved, true);
  assert.equal(e.neighbouringCountryOrTerritoryIdentityMerged, false);
  assert.match(manifest.postal_system.postal_object_rule, /413018/);
});

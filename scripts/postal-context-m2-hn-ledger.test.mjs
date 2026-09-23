import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const hn = ledger.countries.find(country => country.countryCode === 'HN');
const manifest = readJson('data/postal_country_packs/hn/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/hn/postal-context/source-profile.json');
const address = readJson('src/data/address_formats/americas/central_america/HN.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/hn-source-review-2026-09-01.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/hn-checks-2026-09-01.json', root));

test('HN remains M1 blocked under its current real-area definition', () => {
  assert.equal(hn.status, 'blocked'); assert.equal(hn.attempts, 1); assert.equal(hn.evidence, null);
  assert.equal(hn.m2Definition.id, 'M2_current_honducor_honduras_five_digit_postcode_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === hn.m2Definition.id), hn.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('HN records the current five-digit scheme without rewriting legacy evidence', () => {
  const e = hn.blocker.evidence;
  assert.equal(address.postalCode.format, 'NNNNN'); assert.equal(address.postalCode.regex, '^\\d{5}$');
  assert.equal(e.currentPostalCodeLength, 5); assert.equal(e.currentPostalCodeFormat, '99999');
  assert.equal(e.legacyPostalCodeFormat, 'AANNNN'); assert.equal(e.legacySchemePromotedToCurrent, false);
});

test('missing assignment, rights and geometry never promote contextual proxies', () => {
  const e = hn.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 23); assert.equal(e.exactOfficialBodiesBytes, 10917737);
  assert.equal(e.sinitCatalogueLayers, 1034); assert.equal(e.sinitPostalLayerMatches, 0);
  assert.equal(e.honducorOpenPostalDatasetLicencePublishedOnReviewedBodies, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.productionEligibleRecords, 0); assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('HN reports are digest-pinned and exactly one country advances', () => {
  assert.equal(digest(sourceReport), hn.lastAttempt.reportDigest); assert.equal(digest(checks), hn.lastAttempt.engineeringReportDigest);
  assert.equal(hn.blocker.evidence.publishedEvidenceCommit, 'd223f3cc4750bca910569c094cf5093dcdee8dc7');
  const next = ledger.countries.find(country => country.countryCode === 'HT'); assert.equal(next.status, 'pending'); assert.equal(next.attempts, 0);
});

test('running app evidence records the missing HN area without promotion', () => {
  const e = hn.blocker.evidence;
  assert.equal(e.appStarted, true); assert.equal(e.fallbackBrowserVisualInspectionCompleted, true);
  assert.equal(e.hnPostalContextRequestObservedInBrowser, false); assert.equal(e.realHnAgidPostalApiVerified, false);
  assert.equal(e.realHnAgidAppAreaVisualizationVerified, false); assert.equal(e.postalAreaUnavailableNoticeDisplayed, false);
  assert.equal(e.directHnPostalApiStatus, 404); assert.match(hn.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});

test('HN and authority identities remain separate', () => {
  const e = hn.blocker.evidence;
  assert.equal(e.hnIdentityPreserved, true);
  assert.equal(e.honducorPostalSinitAdministrativeAddressBuildingAndAgidIdentitiesSeparated, true);
  assert.equal(e.neighbouringCountryOrTerritoryIdentityMerged, false);
  assert.match(manifest.postal_system.postal_object_rule, /legacy_code/);
});

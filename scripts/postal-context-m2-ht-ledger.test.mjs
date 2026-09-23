import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const ht = ledger.countries.find(country => country.countryCode === 'HT');
const manifest = readJson('data/postal_country_packs/ht/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/ht/postal-context/source-profile.json');
const address = readJson('src/data/address_formats/americas/caribbean/HT.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/ht-source-review-2026-09-01.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/ht-checks-2026-09-01.json', root));

test('HT remains M1 blocked under its current real-area definition', () => {
  assert.equal(ht.status, 'blocked'); assert.equal(ht.attempts, 1); assert.equal(ht.evidence, null);
  assert.equal(ht.m2Definition.id, 'M2_current_office_des_postes_haiti_htnnnn_postal_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(stage => stage.id === ht.m2Definition.id), ht.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.data_completion_verified, false);
});

test('HT records integral current syntax without promoting examples', () => {
  const e = ht.blocker.evidence;
  assert.equal(address.postalCode.format, 'HTNNNN'); assert.equal(address.postalCode.regex, '^HT\\d{4}$');
  assert.equal(e.currentPostalCodeLength, 6); assert.equal(e.currentPostalCodeFormat, 'HT9999');
  assert.equal(e.integralCountryPrefix, 'HT'); assert.equal(e.upuHaitiSheetEdition, '09/2017');
});

test('missing assignment rights and geometry never promote contextual proxies', () => {
  const e = ht.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 22); assert.equal(e.exactOfficialBodiesBytes, 35633074);
  assert.equal(e.operatorPostcodeRouteStatus, 404); assert.equal(e.operatorPostcodeAndLegalSearchResults, 0);
  assert.equal(e.haitidataOpenDataOperational, false); assert.equal(e.officeDesPostesOpenPostalDatasetLicencePublishedOnReviewedBodies, false);
  assert.equal(e.compatibleAgidProcessingStorageDerivationRedistributionAndPublicServingRightsEstablished, false);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0); assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.productionEligibleRecords, 0); assert.equal(e.approvedAgidRuntimeArtifacts, 0); assert.equal(e.rawSourceBodiesInGit, 0);
  assert.ok(profile.sources.every(source => source.bundled_here === false));
});

test('HT reports are digest-pinned and exactly one country advances', () => {
  assert.equal(digest(sourceReport), ht.lastAttempt.reportDigest); assert.equal(digest(checks), ht.lastAttempt.engineeringReportDigest);
  assert.equal(ht.blocker.evidence.publishedEvidenceCommit, 'd0f1b7262ac625bf51dde0427e330fd51b42d74f');
  const next = ledger.countries.find(country => country.countryCode === 'JM'); assert.equal(next.status, 'pending'); assert.equal(next.attempts, 0);
});

test('running app evidence records the missing HT area and wrong-country selection', () => {
  const e = ht.blocker.evidence;
  assert.equal(e.appStarted, true); assert.equal(e.fallbackBrowserVisualInspectionCompleted, true);
  assert.equal(e.htPostalContextRequestObservedInBrowser, false); assert.equal(e.realHtAgidPostalApiVerified, false);
  assert.equal(e.realHtAgidAppAreaVisualizationVerified, false); assert.equal(e.postalAreaUnavailableNoticeDisplayed, false);
  assert.equal(e.selectedCountryAfterHaitiCandidateAttempt, 'AU'); assert.equal(e.directHtPostalApiStatus, 503);
  assert.match(ht.blocker.retryPolicy, /Do not contact.*register.*authenticate.*accept.*pay.*create.*publish.*deploy/i);
});

test('HT and source authority identities remain separate', () => {
  const e = ht.blocker.evidence;
  assert.equal(e.htIdentityPreserved, true);
  assert.equal(e.officePostalCnigsIhsiAdministrativeAddressBuildingAndAgidIdentitiesSeparated, true);
  assert.equal(e.neighbouringCountryOrTerritoryIdentityMerged, false);
  assert.match(manifest.postal_system.administrative_rule, /not the Office des Postes HTNNNN assignment/);
});

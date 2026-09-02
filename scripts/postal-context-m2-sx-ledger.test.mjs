import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const digest = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const ledger = readJson('docs/postal-context-m2-rollout.json');
const sx = ledger.countries.find(x => x.countryCode === 'SX');
const manifest = readJson('data/postal_country_packs/sx/postal-context/repository-manifest.json');
const profile = readJson('data/postal_country_packs/sx/postal-context/source-profile.json');
const address = readJson('src/data/address_formats/americas/caribbean/SX.json');
const generatedPack = readJson('data/postal_country_packs/sx/manifest.json');
const sourceReport = readFileSync(new URL('reports/postal-context-m2/sx-source-review-2026-09-02.json', root));
const checks = readFileSync(new URL('reports/postal-context-m2/sx-checks-2026-09-02.json', root));

test('SX remains blocked under official no-postcode and real-area criterion', () => {
  assert.equal(sx.status, 'blocked');
  assert.equal(sx.attempts, 1);
  assert.equal(sx.evidence, null);
  assert.equal(sx.m2Definition.id, 'M2_current_pss_no_postcode_authority_and_future_area_visualization');
  assert.deepEqual(manifest.promotion.stages.find(x => x.id === sx.m2Definition.id), sx.m2Definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.promotion.data_completion_verified, false);
});

test('exact official receipts establish no postcode without a proxy', () => {
  const e = sx.blocker.evidence;
  assert.equal(e.exactBodiesByteAndSha256Bound, 5);
  assert.equal(e.exactOfficialBodiesBytes, 1116875);
  assert.equal(e.currentPostalCodeFormat, 'none');
  assert.equal(e.upuListsSintMaartenAsNotRequiringPostalCodes, true);
  assert.equal(e.designatedOperator, 'Postal Services Sint Maarten (PSS)');
  assert.equal(e.currentCompletePostalCodeAssignmentsValidated, 0);
  assert.equal(e.officialPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.derivedOrVirtualPostalPolygonOrMultiPolygonRecords, 0);
  assert.equal(e.generatedSxPlanningCodesPromoted, 0);
  assert.equal(e.productionEligibleRecords, 0);
  assert.ok(profile.sources.every(x => x.bundled_here === false));
});

test('address metadata removes unsupported four digits and keeps typed detail', () => {
  assert.equal(address.postalCode.format, 'none');
  assert.equal(address.postalCode.regex, null);
  assert.doesNotMatch(address.native.addressFormat, /postcode/i);
  assert.doesNotMatch(address.english.addressFormat, /postcode/i);
  assert.equal(address.native.fields.some(x => x.key === 'postcode'), false);
  assert.equal(address.english.fields.some(x => x.key === 'postcode'), false);
  for (const key of ['recipient', 'street', 'houseNumber', 'city']) {
    assert.ok(address.native.fields.some(x => x.key === key), key);
  }
});

test('generated SX pack remains synthetic and reports are digest pinned', () => {
  assert.notEqual(generatedPack.officialStatus, 'official');
  assert.equal(sx.blocker.evidence.syntheticGeneratedSxPackPromoted, false);
  assert.equal(digest(sourceReport), sx.lastAttempt.reportDigest);
  assert.equal(digest(checks), sx.lastAttempt.engineeringReportDigest);
  assert.equal(sx.blocker.evidence.sourceReviewDigest, sx.lastAttempt.reportDigest);
  assert.equal(sx.blocker.evidence.engineeringChecksDigest, sx.lastAttempt.engineeringReportDigest);
});

test('shared capability never promotes absent SX input or geometry', () => {
  const e = sx.blocker.evidence;
  assert.equal(e.sharedAppAreaPathVerified, true);
  assert.equal(e.realSxAgidPostalApiVerified, false);
  assert.equal(e.realSxAgidAppAreaVisualizationVerified, false);
  assert.equal(e.browserE2eVerified, false);
  assert.equal(e.approvedAgidRuntimeArtifacts, 0);
  assert.equal(e.rawSourceBodiesInGit, 0);
  assert.equal(e.sxIdentityPreserved, true);
  assert.equal(sx.blocker.requiresExplicitApproval, false);
});
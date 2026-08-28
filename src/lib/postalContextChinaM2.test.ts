import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry, getPreferredPostalSourceIdsForCountry } from './officialPostalSourceCatalog';
const read = (p: string) => readFileSync(new URL('../../' + p, import.meta.url), 'utf8').replaceAll('\r\n', '\n');
const manifest = JSON.parse(read('data/postal_country_packs/cn/postal-context/repository-manifest.json'));
const profile = JSON.parse(read('data/postal_country_packs/cn/postal-context/m2-source-review.json'));
const reportPath = 'reports/postal-context-m2/cn-source-review-2026-08-28.json';

test('CN explicit M2 retains the existing stricter geometry and address/building review requirements', () => {
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.equal(manifest.promotion.target_stage, 'M2_source_attested'); assert.deepEqual(manifest.promotion.stages, [profile.m2_definition]);
  assert.equal(profile.definition_review.previous_named_definition, null);
  assert.equal(profile.definition_review.independently_licensed_assignment_geometry_required, true);
  assert.equal(profile.definition_review.official_polygon_required, false);
  assert.match(profile.m2_definition.definition, /current national.*independently licensed point or area.*civic\/building-link review.*real AGID/i);
  assert.match(read('docs/postal-context-china-runtime.md'), /M2 or later requires exact current typed assignment artifacts.*independently licensed point or area geometry/);
  assert.equal(manifest.promotion.hard_blockers.length, 10);
  for (const flag of ['contains_raw_source_data', 'contains_real_addresses', 'contains_personal_data', 'contains_production_geometry']) assert.equal(manifest.release_scope[flag], false);
});

test('CN rule article, mapping context and operator names cannot alone grant validated addresses', () => {
  const sources = getOfficialPostalSourcesForCountry('CN'), preferred = getPreferredPostalSourceIdsForCountry('CN');
  for (const id of ['china-postal-code', 'tianditu-china']) {
    const source = sources.find(s => s.id === id); assert.ok(source);
    assert.ok(source.sourceRole === 'legal-framework-only' || source.sourceRole === 'context-only');
    assert.equal(source.validationReadiness, 'metadata-only'); assert.ok(!preferred.includes(id));
    for (const identity of [{ sourceIds: [id] }, { url: source.url }, { source: source.label }]) assert.equal(classifyPostalSourceTrust({ countryCode: 'CN', ...identity }).strength, 'weak');
  }
  assert.equal(sources.find(s => s.id === 'china-postal-code')?.trustTier, 'authoritative');
  assert.equal(classifyPostalSourceTrust({ countryCode: 'CN', source: 'China Post' }).strength, 'weak');
  assert.equal(classifyPostalSourceTrust({ countryCode: 'HK', sourceIds: ['china-postal-code'] }).strength, 'weak');
});

test('CN actual outlet sample records shared codes, counts and missingness without publishing addresses', () => {
  const r = JSON.parse(read(reportPath)), l = r.locatorObservation, q = l.aggregate;
  assert.equal(l.successfulPages, 2); assert.equal(l.allReviewedRequestsSucceeded, true);
  assert.equal(q.observedRows, 20); assert.equal(q.distinctPostcodes, 17); assert.equal(q.distinctOfficeLabelTuples, 20);
  assert.equal(q.postcodesSharedByDifferentOfficeLabels, 3); assert.equal(q.excessDuplicateComparisonRows, 0);
  assert.equal(q.invalidPostcodeRows, 0); assert.ok(Object.values(q.missingFieldRows).every(n => n === 0));
  assert.ok(l.pages.every((p: {reportedTotal: number}) => p.reportedTotal === 54631));
  assert.equal(l.observedRowFractionOfReportedOutletTotal, 20 / 54631);
  assert.equal(l.fractionIsNationalPostalCoverage, false); assert.equal(l.atomicSnapshotVerified, false);
  assert.equal(l.repeatedPage.byteIdenticalToFirstResponse, true); assert.equal(l.sourceRowsPersisted, 0);
  assert.equal(q.geometryType, 'none'); assert.equal(q.currentNationalCoverageVerified, false);
  for (const key of ['postalGeometryRecords', 'civicAddressRelations', 'exactBuildingRelations', 'postcodesInferred']) assert.equal(q[key], 0);
});

test('CN source document dates and retrieval failures are not silently promoted to current datasets', () => {
  const r = JSON.parse(read(reportPath));
  assert.equal(r.references.filter((p: {contentVerified: boolean}) => p.contentVerified).length, 4);
  assert.match(r.references.find((p: {id: string}) => p.id === 'china-postal-code').edition, /2015.*2018-10-22/);
  assert.match(r.references.find((p: {id: string}) => p.id === 'china-postal-and-address-code-response-2025').edition, /2025-06-19.*2025-10-11/);
  assert.match(r.references.find((p: {id: string}) => p.id === 'china-geospatial-platform-management-2019').edition, /2021-01-15/);
  assert.equal(r.references.find((p: {id: string}) => p.id === 'tianditu-search-api-reference').contentVerified, false);
  for (const flag of ['countryM2Achieved', 'realAgidRuntimeVerified', 'rightsForPublicM2ArtifactCleared', 'tlsVerificationDisabled', 'authenticationPerformed', 'privateQueriesPerformed', 'contractAcceptancePerformed']) assert.equal(r[flag], false);
  assert.equal(r.publishedDataArtifacts, 0); assert.equal(profile.rights_review.public_destination_approved, false);
});

test('CN ledger pins observed report bytes while leaving M2 blocked and retrying only after the pending pass', () => {
  const ledger = JSON.parse(read('docs/postal-context-m2-rollout.json'));
  const cn = ledger.countries.find((c: {countryCode: string}) => c.countryCode === 'CN');
  assert.equal(cn.status, 'blocked'); assert.equal(cn.evidence, null); assert.deepEqual(cn.m2Definition, profile.m2_definition);
  assert.equal(cn.lastAttempt.report, reportPath);
  assert.equal(cn.lastAttempt.reportDigest, 'sha256:' + createHash('sha256').update(read(reportPath)).digest('hex'));
  assert.equal(cn.blocker.requiresExplicitApproval, false);
  assert.equal(Date.parse(cn.blocker.retryAfter) - Date.parse(cn.blocker.observedAt), 7 * 86400000);
});

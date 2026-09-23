import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry, getPreferredPostalSourceIdsForCountry } from './officialPostalSourceCatalog';
const read = (p: string) => readFileSync(new URL('../../' + p, import.meta.url), 'utf8').replaceAll('\r\n', '\n');
const manifest = JSON.parse(read('data/postal_country_packs/bt/postal-context/repository-manifest.json'));
const profile = JSON.parse(read('data/postal_country_packs/bt/postal-context/m2-source-review.json'));
const reportPath = 'reports/postal-context-m2/bt-source-review-2026-08-28.json';

test('BT missing national M2 criterion is explicit without changing target or claiming source data completion', () => {
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.equal(manifest.promotion.target_stage, 'M2_source_attested'); assert.deepEqual(manifest.promotion.stages, [profile.m2_definition]);
  assert.equal(manifest.promotion.m2_review.previous_definition, null); assert.equal(manifest.promotion.m2_review.existing_target_preserved, true);
  assert.match(profile.m2_definition.definition, /current national.*Dzongkhag.*immutable artifacts.*real AGID/);
  for (const flag of ['contains_raw_source_data', 'contains_real_addresses', 'contains_personal_data', 'contains_production_geometry']) assert.equal(manifest.release_scope[flag], false);
  assert.equal(profile.definition_review.geometry_not_required_for_assignment_m2, true);
  assert.equal(profile.definition_review.civic_and_building_link_not_required_for_assignment_m2, true);
});
test('BT source identity alone never upgrades context, map access, examples or transactions to validated addresses', () => {
  const sources = getOfficialPostalSourcesForCountry('BT'), preferred = getPreferredPostalSourceIdsForCountry('BT');
  const ids = JSON.parse(read('data/postal_country_packs/bt/postal-context/source-profile.json')).sources.map((s: {source_id: string}) => s.source_id);
  for (const id of ids) {
    const source = sources.find(s => s.id === id); assert.ok(source);
    assert.ok(source.sourceRole === 'context-only' || source.sourceRole === 'legal-framework-only');
    assert.equal(source.validationReadiness, 'metadata-only'); assert.ok(!preferred.includes(id));
    for (const identity of [{ sourceIds: [id] }, { url: source.url }, { source: source.label }]) assert.equal(classifyPostalSourceTrust({ countryCode: 'BT', ...identity }).strength, 'weak', id);
  }
  assert.equal(sources.find(s => s.id === 'bhutan-post-postcode-finder')?.authority, 'postal-operator');
  assert.equal(sources.find(s => s.id === 'bhutan-post-postcode-finder')?.trustTier, 'authoritative');
});
test('BT live aggregate records duplicate groups and malformed rows without inferring missing geography', () => {
  const r = JSON.parse(read(reportPath)), l = r.locatorObservation, q = l.aggregate;
  assert.equal(l.observedDistricts, 20); assert.equal(l.allReviewedDistrictRequestsSucceeded, true);
  assert.equal(q.observedRows, 76); assert.equal(q.distinctPostcodes, 38); assert.equal(q.distinctOfficeTuples, 38);
  assert.equal(q.exactDuplicateGroups, 38); assert.equal(q.rowsInExactDuplicateGroups, 76);
  assert.equal(q.excessExactDuplicateRows, 38); assert.equal(q.exactDuplicateExcessRate, 0.5);
  assert.equal(q.invalidPostcodeRows, 0); assert.ok(Object.values(q.missingFieldRows).every(n => n === 0));
  assert.equal(l.allDistrictLabelsMatchSearch, true); assert.equal(l.explicitTableStructureValid, false);
  assert.equal(l.districts.reduce((n: number, d: {structure: {rowsMissingOpeningTag: number}}) => n + d.structure.rowsMissingOpeningTag, 0), 56);
  assert.deepEqual(q.officeKinds, { PO: 68, GPO: 8 });
  for (const flag of ['rowsDeduplicated', 'postcodesInferred', 'labelsCorrected', 'postalGeometryRecords', 'civicAddressRelations', 'exactBuildingRelations']) assert.equal(q[flag], 0);
  assert.equal(q.geometryType, 'none'); assert.equal(q.currentNationalCoverageVerified, false);
});
test('BT limited repeat hashes are not a current atomic national release or reuse permission', () => {
  const r = JSON.parse(read(reportPath)), l = r.locatorObservation;
  assert.equal(l.before.responseDigest, l.after.responseDigest); assert.equal(l.repeatedDistrict.byteIdenticalToFirstResponse, true);
  assert.equal(l.atomicSnapshotVerified, false); assert.equal(l.stableVersionOrAllocationDateVerified, false);
  assert.equal(l.sourceRowsPersisted, 0); assert.equal(r.publishedDataArtifacts, 0);
  for (const flag of ['countryM2Achieved', 'realAgidRuntimeVerified', 'rightsForPublicM2ArtifactCleared', 'tlsVerificationDisabled', 'authenticationPerformed', 'privateQueriesPerformed', 'contractAcceptancePerformed']) assert.equal(r[flag], false);
  assert.equal(r.references.filter((x: {contentVerified: boolean}) => x.contentVerified).length, 6);
  const upu = r.references.find((x: {id: string}) => x.id === 'upu-bhutan-addressing');
  assert.equal(upu.edition, '02/2010'); assert.equal(upu.byteLength, 166218); assert.match(upu.lastModified, /2020/);
  assert.equal(upu.sourceDocumentDigest, profile.reference_probes.find((x: {id: string}) => x.id === upu.id).expectedDigest);
  assert.equal(r.references.find((x: {id: string}) => x.id === 'bhutan-post-legacy-postcodes-pdf').httpStatus, 404);
  assert.equal(profile.rights_review.source_rights_for_m2_cleared, false); assert.equal(profile.rights_review.public_destination_approved, false);
});
test('BT ledger pins source-report bytes and defers unresolved permissions while other pending countries continue', () => {
  const ledger = JSON.parse(read('docs/postal-context-m2-rollout.json')), bt = ledger.countries.find((c: {countryCode: string}) => c.countryCode === 'BT');
  assert.equal(bt.status, 'blocked'); assert.equal(bt.evidence, null); assert.deepEqual(bt.m2Definition, profile.m2_definition);
  assert.equal(bt.lastAttempt.report, reportPath);
  assert.equal(bt.lastAttempt.reportDigest, 'sha256:' + createHash('sha256').update(read(reportPath)).digest('hex'));
  assert.equal(bt.blocker.requiresExplicitApproval, false);
  assert.equal(Date.parse(bt.blocker.retryAfter) - Date.parse(bt.blocker.observedAt), 7 * 86400000);
});

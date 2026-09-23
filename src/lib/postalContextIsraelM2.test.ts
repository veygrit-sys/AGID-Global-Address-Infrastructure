import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry, getPreferredPostalSourceIdsForCountry } from './officialPostalSourceCatalog';

const read = (path: string) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8').replaceAll('\r\n', '\n');
const parse = (path: string) => JSON.parse(read(path));
const manifest = parse('data/postal_country_packs/il/postal-context/repository-manifest.json');
const contract = parse('data/postal_country_packs/il/postal-context/m2-source-review.json');
const reportPath = 'reports/postal-context-m2/il-source-review-2026-08-28.json';
const report = parse(reportPath);

test('IL formalizes its missing M2 criterion without promoting street samples, geometry or addresses', () => {
  assert.equal(contract.m2_definition.id, 'M2_licensed_assignment');
  assert.deepEqual(manifest.promotion.stages.find((s: {id: string}) => s.id === contract.m2_definition.id), contract.m2_definition);
  assert.match(contract.m2_definition.definition, /Israel Post assignment artifact.*source-stated coverage.*immutable digest-pinned.*AGID loader\/API/);
  assert.match(contract.m2_definition.definition, /independent authority.*no polygon or national coverage is presumed/);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.equal(manifest.promotion.hard_blockers.length, 9);
  for (const key of ['contains_raw_source_data', 'contains_real_addresses', 'contains_personal_data', 'contains_production_geometry']) assert.equal(manifest.release_scope[key], false);
  assert.match(manifest.postal_system.territorial_rule, /not a territorial or sovereignty assertion/);
});

test('IL source identity alone remains weak while operator provenance stays authoritative', () => {
  const sources = getOfficialPostalSourcesForCountry('IL'), preferred = getPreferredPostalSourceIdsForCountry('IL');
  const ids = new Set(parse('data/postal_country_packs/il/postal-context/source-profile.json').sources.map((s: {source_id: string}) => s.source_id));
  const reviewed = sources.filter(s => ids.has(s.id)); assert.equal(reviewed.length, 8);
  for (const s of reviewed) {
    assert.equal(s.validationReadiness, 'metadata-only'); assert.ok(!preferred.includes(s.id));
    for (const input of [{sourceIds: [s.id]}, {url: s.url}, {source: s.label}]) assert.equal(classifyPostalSourceTrust({ countryCode: 'IL', ...input }).strength, 'weak');
  }
  assert.equal(sources.find(s => s.id === 'israel-post')?.trustTier, 'authoritative');
  assert.equal(classifyPostalSourceTrust({ countryCode: 'IL', source: 'Israel Post' }).tier, 'weak');
});

test('IL real street pages preserve bounded observations and do not become assignments or building relations', () => {
  assert.deepEqual(report.streetPages.map((r: {profile: {observedRows: number}}) => r.profile.observedRows), [50,50,50]);
  assert.deepEqual(report.streetPages.map((r: {profile: {offset: number}}) => r.profile.offset), [0,50,0]);
  for (const r of report.streetPages) {
    assert.equal(r.httpStatus, 200); assert.match(r.responseDigest, /^sha256:[a-f0-9]{64}$/); assert.equal(r.profile.observedShapeValid, true);
    assert.equal(r.profile.reportedTotal, 63571); assert.equal(r.profile.reportedTotalIsPostalCoverage, false);
    for (const key of ['missingNameRows','invalidCodeRows','invalidNameRows','excessDuplicateRowIds','excessDuplicateCompositeKeys','sourceRowsPersisted','postalAssignments','civicAddressRelations','exactBuildingRelations','coordinates','agidRelations']) assert.equal(r.profile[key], 0);
    assert.equal(r.profile.geometryType, 'none'); assert.equal(r.profile.assignmentValidity, null); assert.equal(r.profile.fullSnapshotVerified, false); assert.equal(r.profile.stableCivicIdentityVerified, false);
  }
  assert.deepEqual(report.streetPages.map((r: {profile: {streetCodesSharedAcrossLocalities: number}}) => r.profile.streetCodesSharedAcrossLocalities), [1,6,1]);
  const s = report.sampleConsistency;
  assert.equal(s.initialRowObservations, 100); assert.equal(s.pageRowIdRangesDisjoint, true); assert.equal(s.byteIdenticalRepeat, true);
  assert.equal(s.tupleMultisetIdenticalRepeat, true); assert.equal(s.metadataProjectionStable, true); assert.equal(s.atomicSnapshotVerified, false); assert.equal(s.nationalPostalCoverageVerified, false);
});

test('IL incomplete rights and page failures cannot be hidden by working API or dated UPU PDF', () => {
  for (const r of report.streetMetadata) {
    assert.equal(r.httpStatus, 200); assert.equal(r.profile.resourceId, contract.street_probe.resource_id);
    assert.equal(r.profile.declaredLicenseId, ''); assert.equal(r.profile.declaredLicenseTitle, ''); assert.equal(r.profile.metadataTimezone, 'not-stated');
    assert.equal(r.profile.currentTermsPinned, false); assert.equal(r.profile.productionRedistributionCleared, false); assert.equal(r.profile.downloadFetched, false);
  }
  const refs = new Map<string, any>(report.references.map((r: {id: string}) => [r.id, r]));
  assert.equal(refs.get('israel-post-terms').httpStatus, 403); assert.equal(refs.get('data-gov-il-terms-2025').httpStatus, 404);
  const upu = refs.get('upu-israel-addressing-2022'); assert.equal(upu.digestMatches, true); assert.equal(upu.byteLength, 134613);
  assert.equal(upu.sourceDocumentDigest, contract.reference_probes.find((r: {id: string}) => r.id === upu.id).expectedDigest);
  assert.equal(upu.sourceDataRecords, 0); assert.match(upu.edition, /10\/2022.*format and routing reference only/);
  for (const key of ['postalLookupRequests','bulkDownloadRequests','sourceRowsPersisted','sourceSnapshotsRetained','publishedDataArtifacts','paidOperations']) assert.equal(report[key], 0);
  for (const key of ['userAuthenticationPerformed','contractAcceptancePerformed','realAgidRuntimeVerified','countryM2Achieved']) assert.equal(report[key], false);
  assert.doesNotMatch(read(reportPath), /maintainer_email|recipient|SYNTHETIC-SECRET|@/);
});

test('IL ledger pins the exact source receipt and keeps later public review separate from new authority', () => {
  const ledger = parse('docs/postal-context-m2-rollout.json'), il = ledger.countries.find((c: {countryCode: string}) => c.countryCode === 'IL');
  assert.equal(il.status, 'blocked'); assert.equal(il.evidence, null); assert.equal(il.attempts, 1); assert.deepEqual(il.m2Definition, contract.m2_definition);
  assert.equal(il.lastAttempt.reportDigest, 'sha256:' + createHash('sha256').update(read(reportPath)).digest('hex'));
  assert.equal(il.blocker.evidence.metadataResponseDigest, report.streetMetadata[0].responseDigest);
  assert.equal(il.blocker.evidence.initialRowObservations, 100); assert.equal(il.blocker.evidence.repeatedRowObservations, 50);
  assert.equal(Date.parse(il.blocker.retryAfter) - Date.parse(il.blocker.observedAt), 7 * 86400000);
  assert.equal(il.blocker.requiresExplicitApproval, false); assert.match(il.blocker.retryPolicy, /after all pending.*does not authorize restricted access or publication/);
});

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry, getPreferredPostalSourceIdsForCountry } from './officialPostalSourceCatalog';

const read = (path: string) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8').replaceAll('\r\n', '\n');
const parse = (path: string) => JSON.parse(read(path));
const manifest = parse('data/postal_country_packs/id/postal-context/repository-manifest.json');
const contract = parse('data/postal_country_packs/id/postal-context/m2-source-review.json');
const reportPath = 'reports/postal-context-m2/id-source-review-2026-08-28.json';
const report = parse(reportPath);

test('ID retains its complete national assignment M2 criterion and does not promote parser work', () => {
  assert.deepEqual(contract.m2_definition, { id: 'M2_assignment', definition: 'A complete rights-cleared current code-to-locality assignment passes authority, coverage, freshness, licence and digest gates.' });
  assert.deepEqual(manifest.promotion.stages.find((s: {id: string}) => s.id === 'M2_assignment'), contract.m2_definition);
  assert.equal(manifest.repository.maturity, 'M1_metadata'); assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.equal(manifest.promotion.hard_blockers.length, 13);
  for (const key of ['contains_raw_source_data', 'contains_real_addresses', 'contains_personal_data', 'contains_production_geometry']) assert.equal(manifest.release_scope[key], false);
});

test('ID source metadata stays weak and the conflicting catalog is not confirmed bulk-open-data', () => {
  const sources = getOfficialPostalSourcesForCountry('ID'), preferred = getPreferredPostalSourceIdsForCountry('ID');
  const ids = new Set(parse('data/postal_country_packs/id/postal-context/source-profile.json').sources.map((s: {source_id: string}) => s.source_id));
  const reviewed = sources.filter(s => ids.has(s.id)); assert.equal(reviewed.length, 9);
  for (const s of reviewed) {
    assert.equal(s.validationReadiness, 'metadata-only'); assert.ok(!preferred.includes(s.id));
    for (const input of [{sourceIds: [s.id]}, {url: s.url}, {source: s.label}]) assert.equal(classifyPostalSourceTrust({ countryCode: 'ID', ...input }).strength, 'weak');
  }
  const catalog = sources.find(s => s.id === 'sdi-indonesia-village-postcode');
  assert.equal(catalog?.availability, 'web-search'); assert.equal(catalog?.authority, 'official-open-data');
  assert.match(catalog?.notes?.join(' ') ?? '', /private=true.*isopen=false.*null licence.*rejected.*403/);
});

test('ID real public searches retain bounded counts and no coordinates, premise, geometry or building claims', () => {
  assert.deepEqual(report.postalSearch.map((r: {profile: {observedRows: number}}) => r.profile.observedRows), [1,20,20]);
  for (const r of report.postalSearch) {
    assert.equal(r.httpStatus, 200); assert.match(r.responseDigest, /^sha256:[a-f0-9]{64}$/); assert.equal(r.profile.observedShapeValid, true);
    for (const key of ['missingCodeRows','invalidCodeRows','incompleteLocalityRows','excessDuplicateTupleRows','sourceRowsPersisted','geometryRecords','civicAddressRelations','exactBuildingRelations','coordinateRecords']) assert.equal(r.profile[key], 0);
    assert.equal(r.profile.geometryType, 'none'); assert.equal(r.profile.assignmentEdition, null); assert.equal(r.profile.assignmentValidity, null); assert.equal(r.profile.currentNationalCoverageVerified, false);
  }
  assert.equal(report.postalSearch[1].profile.distinctValidCodes, 20); assert.equal(report.postalSearch[1].profile.distinctProvinceLabels, 4);
  assert.equal(report.repeat.byteIdentical, true); assert.equal(report.repeat.tupleMultisetIdentical, true); assert.equal(report.repeat.atomicOrNationalSnapshotVerified, false);
  assert.equal(report.postalForm.profile.rightsReservedMarkerPresent, true); assert.equal(report.postalForm.profile.activeDownloadLinkPresent, false);
});

test('ID public catalog/access contradictions are recorded without restricted data or embedded account fields', () => {
  const p = report.catalog.profile;
  assert.equal(p.datasetId, contract.catalog_probe.dataset_id); assert.equal(p.declaredOpen, false); assert.equal(p.declaredPrivate, true);
  assert.equal(p.declaredLicenseTitle, null); assert.equal(p.reviewStatus, 'rejected'); assert.equal(p.publicLabelConflictsWithAccessFlags, true);
  assert.equal(p.metadataTimestampTimezone, 'not-stated'); assert.equal(p.assignmentEdition, null); assert.equal(p.redistributionRightsCleared, false);
  assert.equal(report.publisher.httpStatus, 403); assert.equal(report.publisher.responseDigest, null);
  assert.deepEqual(Object.keys(p).sort(), [...contract.catalog_probe.allowed_output_fields].sort());
  for (const key of ['sourceRowsPersisted','sourceSnapshotsRetained','bulkResourceRequests','publishedDataArtifacts','paidOperations']) assert.equal(report[key], 0);
  for (const key of ['userAuthenticationPerformed','embeddedAccountFieldsPersisted','contractAcceptancePerformed','realAgidRuntimeVerified','countryM2Achieved']) assert.equal(report[key], false);
  assert.doesNotMatch(read(reportPath), /apikey|creator_profile|@|SYNTHETIC-SECRET/);
});

test('ID ledger pins the exact source receipt, stays blocked and permits only later public-reference review', () => {
  const ledger = parse('docs/postal-context-m2-rollout.json'), id = ledger.countries.find((c: {countryCode: string}) => c.countryCode === 'ID');
  assert.equal(id.status, 'blocked'); assert.equal(id.evidence, null); assert.equal(id.attempts, 1); assert.deepEqual(id.m2Definition, contract.m2_definition);
  assert.equal(id.lastAttempt.reportDigest, 'sha256:' + createHash('sha256').update(read(reportPath)).digest('hex'));
  assert.equal(id.blocker.evidence.catalogResponseDigest, report.catalog.responseDigest);
  assert.equal(id.blocker.evidence.initialRowObservations, 21); assert.equal(id.blocker.evidence.repeatedRowObservations, 20);
  assert.equal(Date.parse(id.blocker.retryAfter) - Date.parse(id.blocker.observedAt), 7 * 86400000);
  assert.equal(id.blocker.requiresExplicitApproval, false); assert.match(id.blocker.retryPolicy, /after all pending.*does not authorize restricted access or publication/);
});

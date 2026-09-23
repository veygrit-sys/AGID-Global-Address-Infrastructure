import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry, getPreferredPostalSourceIdsForCountry } from './officialPostalSourceCatalog';
import { normalizeArmeniaPostalCode } from './postalContextCountryPolicy';

const read = (path: string) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const manifest = JSON.parse(read('data/postal_country_packs/am/postal-context/repository-manifest.json'));
const profile = JSON.parse(read('data/postal_country_packs/am/postal-context/m2-source-review.json'));
const reportPath = 'reports/postal-context-m2/am-source-review-2026-08-28.json';

test('AM retains its existing M2 definition and independent address/building/territory gates', () => {
  assert.deepEqual(manifest.promotion.stages.find((s: { id: string }) => s.id === 'M2_experimental'), {
    id: 'M2_experimental', definition: 'Pinned rights-cleared snapshots reproduce experimental packs with complete lineage.',
  });
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.equal(manifest.promotion.m2_review.definition_unchanged, true);
  assert.ok(manifest.promotion.m2_review.required_evidence.includes('real-agid-loader-and-api-verification-not-only-synthetic-fixtures'));
  for (const key of ['contains_raw_source_data', 'contains_real_addresses', 'contains_personal_data', 'contains_production_geometry']) assert.equal(manifest.release_scope[key], false);
  for (const blocker of ['post-office-address-used-as-civic-address-of-postcode', 'directory-postcode-used-as-unique-object-key', 'pdf-metadata-date-used-as-assignment-validity', 'disputed-feature-auto-assigned-to-am']) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('AM reference IDs, exact URLs and names cannot claim current postal validation', () => {
  const sources = getOfficialPostalSourcesForCountry('AM');
  const preferred = getPreferredPostalSourceIdsForCountry('AM');
  for (const id of ['haypost-am', 'haypost-address-reference', 'upu-armenia-addressing', 'armenia-real-estate-address-register', 'armenia-national-geoportal-buildings', 'cadastre-armenia']) {
    const source = sources.find(s => s.id === id);
    assert.ok(source);
    assert.equal(source.sourceRole, 'context-only');
    assert.equal(source.validationReadiness, 'metadata-only');
    assert.ok(!preferred.includes(id));
    for (const identity of [{ sourceIds: [id] }, { url: source.url }, { source: source.label }]) {
      assert.equal(classifyPostalSourceTrust({ countryCode: 'AM', ...identity }).strength, 'weak');
    }
  }
  assert.equal(normalizeArmeniaPostalCode('0002'), '0002');
  assert.equal(normalizeArmeniaPostalCode('2'), null);
});

test('AM directory grain, temporal and reuse policies do not create polygon or building authority', () => {
  assert.equal(profile.directory_probe.source_edition, null);
  assert.equal(profile.directory_probe.allow_search_queries, false);
  assert.equal(profile.directory_probe.allow_authentication, false);
  assert.equal(profile.directory_probe.persist_source_response, false);
  assert.match(profile.directory_probe.duplicate_policy, /postcode alone is not a unique office identifier/);
  assert.match(profile.directory_probe.date_policy, /not provider-declared assignment validity/);
  assert.match(profile.rights_review.cadastre, /does not prove all layers are paid/);
  assert.match(profile.rights_review.privacy, /not a dataset redistribution grant/);
  assert.match(profile.authority_boundaries.address, /not the civic address of every point/);
  assert.match(profile.authority_boundaries.geometry, /derived, virtual and none remain distinct/);
});

test('AM live directory preflight is aggregate-only and explicitly fails promotion', () => {
  const report = JSON.parse(read(reportPath));
  const validation = report.directoryObservation.validation;
  assert.equal(report.countryM2Achieved, false);
  assert.equal(report.realAgidRuntimeVerified, false);
  assert.equal(report.sourceDataSnapshotsPersisted, 0);
  assert.equal(report.publishedDataArtifacts, 0);
  assert.equal(report.rightsForPublicTransformedArtifactsCleared, false);
  assert.equal(validation.responseDigest, profile.directory_probe.expected_digest);
  assert.equal(validation.observedDirectoryRows, 428);
  assert.equal(validation.distinctPostcodes, 427);
  assert.equal(validation.leadingZeroRows, 185);
  assert.equal(validation.duplicatePostcodeGroups, 1);
  assert.equal(validation.rowsInDuplicateGroups, 2);
  assert.equal(validation.missingContextRows, 4);
  assert.equal(validation.codeAndBasicRowChecksPassed, false);
  assert.equal(validation.sourceEdition, null);
  assert.equal(validation.validFrom, null);
  assert.equal(validation.currentAssignmentVerified, false);
  assert.equal(validation.buildingLinksVerified, 0);
  assert.ok(!JSON.stringify(report).includes('Nalbandyan'));
});

test('AM ledger preserves its criterion and pins the actual report bytes', () => {
  const ledger = JSON.parse(read('docs/postal-context-m2-rollout.json'));
  const am = ledger.countries.find((c: { countryCode: string }) => c.countryCode === 'AM');
  assert.deepEqual(am.m2Definition, manifest.promotion.stages.find((s: { id: string }) => s.id === 'M2_experimental'));
  assert.equal(am.status, 'blocked');
  assert.equal(am.evidence, null);
  assert.equal(am.lastAttempt.report, reportPath);
  assert.equal(am.lastAttempt.reportDigest, 'sha256:' + createHash('sha256').update(read(reportPath).replaceAll('\r\n', '\n')).digest('hex'));
  assert.equal(am.lastAttempt.realAgidRuntimeVerified, false);
  assert.equal(am.blocker.requiresExplicitApproval, false);
  assert.ok(Date.parse(am.blocker.retryAfter) > Date.parse(am.blocker.observedAt));
});

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry, getPreferredPostalSourceIdsForCountry } from './officialPostalSourceCatalog';
import { normalizeAzerbaijanPostalCode } from './postalContextCountryPolicy';

const read = (path: string) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const manifest = JSON.parse(read('data/postal_country_packs/az/postal-context/repository-manifest.json'));
const profile = JSON.parse(read('data/postal_country_packs/az/postal-context/m2-source-review.json'));
const reportPath = 'reports/postal-context-m2/az-source-review-2026-08-28.json';

test('AZ preserves its original M2 scope and independent postal/address/building/territory gates', () => {
  assert.deepEqual(manifest.promotion.stages.find((s: { id: string }) => s.id === 'M2_experimental'), {
    id: 'M2_experimental', definition: 'Pinned rights-cleared snapshots reproduce experimental packs with complete lineage.',
  });
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.equal(manifest.promotion.m2_review.definition_unchanged, true);
  assert.ok(manifest.promotion.m2_review.required_evidence.includes('real-agid-loader-and-api-verification-not-only-synthetic-fixtures'));
  for (const key of ['contains_raw_source_data', 'contains_real_addresses', 'contains_personal_data', 'contains_production_geometry']) assert.equal(manifest.release_scope[key], false);
  for (const blocker of ['office-address-used-as-civic-address-of-postcode', 'presentation-index-used-as-stable-provider-object-id', 'street-number-hints-used-as-exact-building-links', 'malformed-or-out-of-range-coordinates-silently-repaired']) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
  assert.match(manifest.postal_system.territory_rule, /Nakhchivan/);
});

test('AZ precise source IDs, URLs and names stay context-only, including the dated UPU guide', () => {
  const sources = getOfficialPostalSourcesForCountry('AZ');
  const preferred = getPreferredPostalSourceIdsForCountry('AZ');
  for (const id of ['azerpost-address-reference', 'azerpost-public-branches', 'upu-azerbaijan-addressing', 'azerbaijan-address-register', 'azerbaijan-state-committee-property', 'azerbaijan-open-data']) {
    const source = sources.find(s => s.id === id);
    assert.ok(source);
    assert.equal(source.sourceRole, 'context-only');
    assert.equal(source.validationReadiness, 'metadata-only');
    assert.ok(!preferred.includes(id));
    for (const identity of [{ sourceIds: [id] }, { url: source.url }, { source: source.label }]) {
      const classification = classifyPostalSourceTrust({ countryCode: 'AZ', ...identity });
      assert.equal(classification.strength, 'weak');
      assert.ok(classification.matches.some(s => s.id === id));
    }
  }
  assert.equal(sources.find(s => s.id === 'azerpost-address-reference')?.trustTier, 'authoritative');
  assert.equal(sources.find(s => s.id === 'azerbaijan-open-data')?.url, 'https://opendata.az/en');
  assert.equal(normalizeAzerbaijanPostalCode('0001'), 'AZ0001');
  assert.equal(normalizeAzerbaijanPostalCode('1'), null);
});

test('AZ review separates public address fields, protected registry data, fees and office-search hints', () => {
  assert.equal(profile.branch_probe.source_edition, null);
  for (const key of ['allow_search_queries', 'allow_authentication', 'persist_source_response']) assert.equal(profile.branch_probe[key], false);
  assert.match(profile.branch_probe.identity_policy, /not established stable provider object identifiers/);
  assert.match(profile.branch_probe.address_policy, /not parsed into individual premises/);
  assert.match(profile.rights_review.public_address_fields, /positive public-access basis/);
  assert.match(profile.rights_review.protected_fields, /not in the reviewed public-field enumeration/);
  assert.match(profile.rights_review.cadastre, /not a blanket statement/);
  assert.match(profile.authority_boundaries.geometry, /derived, virtual and none remain distinct/);
});

test('AZ live branch counts and quality exceptions cannot promote M2 or exact addresses', () => {
  const report = JSON.parse(read(reportPath));
  const v = report.branchObservation.validation;
  for (const key of ['countryM2Achieved', 'realAgidRuntimeVerified', 'rightsForPublicTransformedArtifactsCleared']) assert.equal(report[key], false);
  for (const key of ['sourceDataSnapshotsPersisted', 'publishedDataArtifacts']) assert.equal(report[key], 0);
  assert.equal(report.references.filter((r: { contentVerified: boolean }) => r.contentVerified).length, 8);
  assert.equal(v.observedBranchRows, 993);
  assert.equal(v.distinctPostcodes, 993);
  assert.equal(v.leadingZeroRows, 139);
  assert.equal(v.emptyTypeRows, 993);
  assert.equal(v.presentationIdsMatchRowIndexes, true);
  assert.equal(v.postcodeUniqueWithinResponse, true);
  assert.equal(v.postcodeIsStableObjectKey, false);
  assert.deepEqual(v.coordinates, { missingBoth: 0, missingOne: 0, invalidDecimal: 11, outOfRange: 1, zeroPair: 0, rangeValid: 981 });
  assert.equal(v.streetEntries, 6512);
  assert.equal(v.streetEntriesMissingNumbers, 8);
  assert.equal(v.currentAssignmentVerified, false);
  assert.equal(v.readyForAddressContextIngestion, false);
  assert.equal(v.buildingLinksVerified, 0);
  assert.equal(v.sourceEdition, null);
  assert.equal(v.embeddedJsonDigest, 'sha256:b31b721c86c7ec22a0d2a1817e150e3b22de1c82472d8e57efd320c294bccbdd');
  const upu = report.references.find((r: { id: string }) => r.id === 'upu-azerbaijan-addressing');
  assert.equal(upu.sourceDocumentDigest, profile.reference_probes.find((r: { id: string }) => r.id === upu.id).expectedDigest);
  assert.ok(!JSON.stringify(report).includes('"street_numbers":'));
  assert.ok(!JSON.stringify(report).includes('"latitude":'));
});

test('AZ ledger pins the report and stays blocked with a bounded read-only retry', () => {
  const ledger = JSON.parse(read('docs/postal-context-m2-rollout.json'));
  const az = ledger.countries.find((c: { countryCode: string }) => c.countryCode === 'AZ');
  assert.deepEqual(az.m2Definition, manifest.promotion.stages.find((s: { id: string }) => s.id === 'M2_experimental'));
  assert.equal(az.status, 'blocked');
  assert.equal(az.evidence, null);
  assert.equal(az.lastAttempt.report, reportPath);
  assert.equal(az.lastAttempt.reportDigest, 'sha256:' + createHash('sha256').update(read(reportPath).replaceAll('\r\n', '\n')).digest('hex'));
  assert.equal(az.lastAttempt.realAgidRuntimeVerified, false);
  assert.equal(az.blocker.requiresExplicitApproval, false);
  assert.equal(Date.parse(az.blocker.retryAfter) - Date.parse(az.blocker.observedAt), 7 * 24 * 60 * 60 * 1000);
});

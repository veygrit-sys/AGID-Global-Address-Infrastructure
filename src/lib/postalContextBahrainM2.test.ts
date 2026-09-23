import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry, getPreferredPostalSourceIdsForCountry } from './officialPostalSourceCatalog';
const read = (path: string) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const manifest = JSON.parse(read('data/postal_country_packs/bh/postal-context/repository-manifest.json'));
const profile = JSON.parse(read('data/postal_country_packs/bh/postal-context/m2-source-review.json'));
const reportPath = 'reports/postal-context-m2/bh-source-review-2026-08-28.json';

test('BH preserves complete M2 assignment and P.O. box rules without requiring M3 or M4', () => {
  assert.deepEqual(manifest.promotion.stages.find((s: { id: string }) => s.id === 'M2_assignment'), {
    id: 'M2_assignment', definition: 'Complete rights-cleared postcode-block assignment and non-spatial P.O. box-delivery rules pass authority, range, coverage, freshness, licence and digest gates.',
  });
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.equal(manifest.promotion.m2_review.definition_unchanged, true);
  assert.match(manifest.promotion.m2_review.stage_boundary, /M3.*M4.*separate/);
  for (const key of ['contains_raw_source_data', 'contains_real_addresses', 'contains_personal_data', 'contains_production_geometry']) assert.equal(manifest.release_scope[key], false);
  for (const blocker of ['landmark-block-label-used-as-explicit-postcode-block-assignment', 'dataset-bbox-used-as-postal-boundary', 'presentation-counter-used-as-stable-civic-or-building-id', 'complete-landmark-response-used-as-complete-national-assignment', 'government-open-data-licence-used-to-release-controlled-or-personal-data']) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('BH references and legal documents cannot confer assignment validation by exact ID, URL or label', () => {
  const sources = getOfficialPostalSourcesForCountry('BH');
  const preferred = getPreferredPostalSourceIdsForCountry('BH');
  const legal = ['bahrain-open-data-terms', 'bahrain-open-government-data-license-v1'];
  for (const id of ['bahrain-post-services-directory', 'upu-bahrain-addressing', 'iga-bahrain-address-services', 'bahrain-open-data-geographic-locations', 'bahrain-municipal-geographic-explorer', 'slrb-bahrain-cadastre', ...legal]) {
    const source = sources.find(s => s.id === id);
    assert.ok(source);
    assert.equal(source.sourceRole, legal.includes(id) ? 'legal-framework-only' : 'context-only');
    assert.equal(source.validationReadiness, legal.includes(id) ? 'reference-eligible' : 'metadata-only');
    assert.ok(!preferred.includes(id));
    for (const identity of [{ sourceIds: [id] }, { url: source.url }, { source: source.label }]) {
      const classification = classifyPostalSourceTrust({ countryCode: 'BH', ...identity });
      assert.equal(classification.strength, 'weak');
      assert.ok(classification.matches.some(s => s.id === id));
    }
  }
  assert.equal(sources.find(s => s.id === 'iga-bahrain-address-services')?.trustTier, 'authoritative');
  assert.equal(sources.find(s => s.id === 'bahrain-open-data-geographic-locations')?.depth, 'geo-only');
});

test('BH positive government open-data scope coexists with exact obligations, exclusions and separate authority', () => {
  assert.match(manifest.postal_system.licence_rule, /other government websites/);
  assert.match(manifest.postal_system.licence_rule, /Null dataset licence metadata is not proof of no rights/);
  assert.match(profile.rights_review.positive_basis, /including eligible datasets on other government sites/);
  for (const obligation of ['source-and-extraction-date-attribution', 'prescribed-disclaimer-from-exact-license-clause-3.3(c)', 'propagate-attribution-transformation-and-disclaimer-to-sublicensees', 'cease-use-and-remove-on-authorized-request-under-license-conditions']) assert.ok(profile.rights_review.obligations.includes(obligation));
  for (const key of ['allow_authentication', 'allow_private_queries', 'persist_source_rows']) assert.equal(profile.dataset_probe[key], false);
  assert.match(profile.authority_boundaries.geometry, /bbox is an envelope, not a postal polygon/);
  assert.match(profile.authority_boundaries.po_box, /not a subscriber identity, home or catchment/);
});

test('BH real 27-point observation is complete only for that response, not postal coverage or building data', () => {
  const report = JSON.parse(read(reportPath));
  const observation = report.landmarkObservation, v = observation.validation, meta = observation.metadataBefore.validation;
  for (const key of ['countryM2Achieved', 'realAgidRuntimeVerified', 'completePostcodeBlockAssignmentVerified', 'rightsForPublicM2ArtifactCleared', 'tlsVerificationDisabled']) assert.equal(report[key], false);
  assert.equal(report.references.filter((r: { contentVerified: boolean }) => r.contentVerified).length, 5);
  assert.equal(report.termsObservation.status, 'terms-observed-not-release-authorization');
  assert.equal(report.termsObservation.pageContentDate, '2025-10-07');
  assert.equal(v.observedLandmarkRows, 27); assert.equal(v.apiTotal, 27); assert.equal(v.distinctBlocks, 20);
  assert.equal(v.repeatedBlockGroups, 5); assert.equal(v.rowsInRepeatedBlockGroups, 12);
  assert.equal(v.distinctCounters, 27); assert.equal(v.countersAreContiguousOneToN, true); assert.equal(v.stableRecordIdentityVerified, false);
  assert.equal(v.distinctGovernorateLabels, 4); assert.equal(v.ambiguousBilingualGovernorateLabelGroups, 0);
  for (const key of ['invalidBlockRows', 'missingBlockRows', 'missingNameRows', 'missingGovernorateRows', 'invalidCoordinateRows', 'coordinateFieldsMismatchRows', 'exactDuplicateRowGroups', 'postcodesInferredFromBlock', 'buildingLinksVerified', 'postalGeometryRecords', 'poBoxSubscribersRetrieved', 'sourceRowsPersisted']) assert.equal(v[key], 0);
  assert.equal(v.completeObservedDatasetResponse, true); assert.equal(v.metadataUnchangedDuringProbe, true);
  assert.equal(v.completeNationalCoverageVerified, false); assert.equal(v.providerCrsAndPositionAccuracyVerified, false);
  assert.equal(meta.metadataBboxGeometryType, 'Polygon'); assert.equal(meta.bboxIsPostalGeometry, false); assert.deepEqual(meta.geometryTypes, ['Point']);
  assert.equal(meta.postcodeFieldPresent, false); assert.equal(meta.datasetLicense, null); assert.equal(meta.emptyLicenseFieldsDoNotNegatePortalLicense, true);
  assert.equal(observation.metadataBefore.responseDigest, observation.metadataAfter.responseDigest);
  assert.equal(observation.records.responseDigest, 'sha256:a11af9552ab525d00dfcf3158176115bb0c70da1bd6d739eef41286ba7e5f5e0');
  assert.deepEqual(report.catalogObservations.map((r: { totalMatches: number }) => r.totalMatches), [6, 0]);
  assert.ok(report.catalogObservations.every((r: { underlyingDatasetRecordsRetrieved: number; searchIsProofOfNationalAbsence: boolean }) => r.underlyingDatasetRecordsRetrieved === 0 && !r.searchIsProofOfNationalAbsence));
  for (const ref of report.references.filter((r: { expectedDigest?: string }) => r.expectedDigest)) assert.equal(ref.sourceDocumentDigest, ref.expectedDigest);
  for (const rawKey of ['"results":', '"coordinates":', '"lat":', '"lon":', '"owner":']) assert.ok(!JSON.stringify(report).includes(rawKey));
});

test('BH ledger pins real evidence without claiming M2 and schedules a bounded read-only retry', () => {
  const ledger = JSON.parse(read('docs/postal-context-m2-rollout.json'));
  const bh = ledger.countries.find((c: { countryCode: string }) => c.countryCode === 'BH');
  assert.deepEqual(bh.m2Definition, manifest.promotion.stages.find((s: { id: string }) => s.id === 'M2_assignment'));
  assert.equal(bh.status, 'blocked'); assert.equal(bh.evidence, null); assert.equal(bh.lastAttempt.report, reportPath);
  assert.equal(bh.lastAttempt.reportDigest, 'sha256:' + createHash('sha256').update(read(reportPath).replaceAll('\r\n', '\n')).digest('hex'));
  assert.equal(bh.blocker.requiresExplicitApproval, false);
  assert.equal(Date.parse(bh.blocker.retryAfter) - Date.parse(bh.blocker.observedAt), 7 * 24 * 60 * 60 * 1000);
});

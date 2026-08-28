import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry, getPreferredPostalSourceIdsForCountry } from './officialPostalSourceCatalog';
import { normalizeBangladeshPostalCode } from './postalContextCountryPolicy';

const read = (path: string) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const manifest = JSON.parse(read('data/postal_country_packs/bd/postal-context/repository-manifest.json'));
const profile = JSON.parse(read('data/postal_country_packs/bd/postal-context/m2-source-review.json'));
const reportPath = 'reports/postal-context-m2/bd-source-review-2026-08-28.json';

test('BD preserves the complete M2 assignment definition without adding M3 geometry or M4 buildings', () => {
  assert.deepEqual(manifest.promotion.stages.find((s: { id: string }) => s.id === 'M2_assignment'), {
    id: 'M2_assignment', definition: 'A complete rights-cleared, editioned postcode and typed office assignment passes authority, coverage, freshness, licence and digest gates.',
  });
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.equal(manifest.promotion.m2_review.definition_unchanged, true);
  assert.match(manifest.promotion.m2_review.stage_boundary, /M3 and M4 remain separate/);
  for (const key of ['contains_raw_source_data', 'contains_real_addresses', 'contains_personal_data', 'contains_production_geometry']) assert.equal(manifest.release_scope[key], false);
  for (const blocker of ['three-page-sample-presented-as-complete-national-m2-assignment', 'site-footer-update-used-as-office-assignment-validity', 'tls-verification-disabled-to-ingest-official-data', 'unknown-office-type-guessed-from-blank-code-or-adjacent-row', 'same-office-label-or-postcode-used-as-stable-object-identity']) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('BD precise source IDs, URLs and labels cannot turn metadata into current assignment validation', () => {
  const sources = getOfficialPostalSourcesForCountry('BD');
  const preferred = getPreferredPostalSourceIdsForCountry('BD');
  for (const id of ['bangladesh-post-postcode-tables', 'bangladesh-post-gazipur-page', 'bangladesh-post-eastern-circle-page', 'upu-bangladesh-addressing', 'survey-of-bangladesh-gis-services', 'bangladesh-nsdi-geoportal', 'bangladesh-nsdi-data-catalog', 'bbs-bangladesh-census-2022', 'dlrs-bangladesh-map-portal']) {
    const source = sources.find(s => s.id === id);
    assert.ok(source);
    assert.equal(source.sourceRole, 'context-only');
    assert.equal(source.validationReadiness, 'metadata-only');
    assert.ok(!preferred.includes(id));
    for (const identity of [{ sourceIds: [id] }, { url: source.url }, { source: source.label }]) {
      const classification = classifyPostalSourceTrust({ countryCode: 'BD', ...identity });
      assert.equal(classification.strength, 'weak');
      assert.ok(classification.matches.some(s => s.id === id));
    }
  }
  const postal = sources.find(s => s.id === 'bangladesh-post-postcode-tables');
  assert.equal(postal?.trustTier, 'authoritative');
  assert.equal(postal?.url, profile.table_probes[0].url);
  assert.equal(normalizeBangladeshPostalCode('১০০০'), '1000');
  assert.equal(normalizeBangladeshPostalCode('0000'), null);
});

test('BD review distinguishes source scope, native verified TLS, blank assignments and rights', () => {
  assert.equal(profile.table_probes.length, 3);
  for (const key of ['tls_verification_may_be_disabled', 'allow_authentication', 'allow_registry_or_address_queries', 'persist_source_response']) assert.equal(profile.transport_policy[key], false);
  assert.match(profile.assignment_policy.blank_codes, /Never fill from previous or next row/);
  assert.match(profile.assignment_policy.office_classes, /unknown labels remain unknown/);
  assert.match(profile.assignment_policy.row_identity, /not stable office identifiers/);
  assert.match(profile.assignment_policy.temporal, /Content-specific dates are distinct/);
  assert.match(profile.rights_review.completeness, /do not satisfy.*complete national M2_assignment/);
  assert.match(profile.rights_review.nsdi, /not Bangladesh Post's assignment licence/);
  assert.match(profile.rights_review.no_blanket_unavailability_claim, /reachable with Windows Schannel verification/);
});

test('BD real table observations retain exceptions and do not promote national M2 or exact addresses', () => {
  const report = JSON.parse(read(reportPath));
  for (const key of ['countryM2Achieved', 'realAgidRuntimeVerified', 'rightsForPublicTransformedArtifactsCleared', 'completeNationalCoverageVerified', 'tlsVerificationDisabled']) assert.equal(report[key], false);
  assert.equal(report.transport, 'curl-cli-verified-tls');
  for (const key of ['sourceDataSnapshotsPersisted', 'publishedDataArtifacts']) assert.equal(report[key], 0);
  assert.equal(report.references.filter((r: { contentVerified: boolean }) => r.contentVerified).length, 6);
  assert.equal(report.references.filter((r: { error?: string }) => r.error === 'curl-tls-verification-failed').length, 3);
  const [dhaka, gazipur, eastern] = report.tableObservations.map((r: { validation: unknown }) => r.validation);
  assert.deepEqual([dhaka, gazipur, eastern].map(v => [v.observedOfficeRows, v.validCodeRows, v.blankCodeRows, v.invalidCodeRows, v.distinctPostcodes]), [[162, 52, 109, 1, 52], [158, 23, 135, 0, 23], [2551, 2551, 0, 0, 475]]);
  assert.deepEqual([dhaka, gazipur].map(v => v.missingBilingualNameRows), [162, 158]);
  assert.deepEqual([dhaka, gazipur].map(v => v.officeClasses.unknown), [111, 137]);
  assert.equal(eastern.bengaliDigitCodeRows, 2551);
  assert.equal(eastern.duplicatePostcodeGroups, 298);
  assert.equal(eastern.rowsInDuplicatePostcodeGroups, 2374);
  assert.equal(eastern.duplicateAssignmentRowGroups, 1);
  assert.equal(eastern.rowsInDuplicateAssignmentGroups, 2);
  assert.equal(eastern.missingAccountingOfficeRows, 2551);
  assert.equal(eastern.missingHeadOfficeRows, 2551);
  assert.deepEqual([dhaka, gazipur, eastern].map(v => v.officeContextsWithMultipleNonblankCodes), [1, 0, 1]);
  assert.deepEqual([dhaka, gazipur, eastern].map(v => v.tableDigest), ['sha256:eb746fc17c9a97de5b4060adb134daaef81341b80b847e24b18a33d6cf652847', 'sha256:1cc1bf924eec554c2c78af6adc67727b0c1e604d94b16d1e5432f89c66fe8873', 'sha256:715e210767d9401520618aecbc5160b24232027df78147fe24a0dd3d14b7a025']);
  for (const [index, observation] of report.tableObservations.entries()) {
    const v = observation.validation;
    assert.equal(observation.requestedUrl, profile.table_probes[index].url);
    assert.ok(Number.isFinite(Date.parse(observation.observedAt)));
    assert.equal(v.pageContentDate, profile.table_probes[index].page_content_date);
    assert.equal(v.pageContentDateVerified, true);
    assert.equal(v.sourceAssignmentEdition, null);
    for (const key of ['stableOfficeIdentityVerified', 'currentAssignmentVerified', 'completeNationalCoverageVerified', 'siteFooterDateUsedAsAssignmentValidity', 'responseIsRetainedSourceSnapshot']) assert.equal(v[key], false);
    for (const key of ['blankCodesFilled', 'missingContextFilled', 'postalGeometryRecords', 'civicAddressesVerified', 'buildingLinksVerified']) assert.equal(v[key], 0);
  }
  const upu = report.references.find((r: { id: string }) => r.id === 'upu-bangladesh-addressing');
  assert.equal(upu.sourceDocumentDigest, profile.reference_probes.find((r: { id: string }) => r.id === upu.id).expectedDigest);
  for (const rawKey of ['"rows":', '"coordinates":', '"address":', '"body":']) assert.ok(!JSON.stringify(report).includes(rawKey));
});

test('BD ledger pins the observed report and remains blocked with a bounded read-only retry', () => {
  const ledger = JSON.parse(read('docs/postal-context-m2-rollout.json'));
  const bd = ledger.countries.find((c: { countryCode: string }) => c.countryCode === 'BD');
  assert.deepEqual(bd.m2Definition, manifest.promotion.stages.find((s: { id: string }) => s.id === 'M2_assignment'));
  assert.equal(bd.status, 'blocked');
  assert.equal(bd.evidence, null);
  assert.equal(bd.lastAttempt.report, reportPath);
  assert.equal(bd.lastAttempt.reportDigest, 'sha256:' + createHash('sha256').update(read(reportPath).replaceAll('\r\n', '\n')).digest('hex'));
  assert.equal(bd.lastAttempt.realAgidRuntimeVerified, false);
  assert.equal(bd.blocker.requiresExplicitApproval, false);
  assert.equal(Date.parse(bd.blocker.retryAfter) - Date.parse(bd.blocker.observedAt), 7 * 24 * 60 * 60 * 1000);
});

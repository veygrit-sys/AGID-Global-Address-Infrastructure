import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry, getPreferredPostalSourceIdsForCountry } from './officialPostalSourceCatalog';
import { normalizeAfghanistanPostalCode } from './postalContextCountryPolicy';

const read = (path: string) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const manifest = JSON.parse(read('data/postal_country_packs/af/postal-context/repository-manifest.json'));
const profile = JSON.parse(read('data/postal_country_packs/af/postal-context/m2-source-review.json'));

test('AF M2 retains edition, permission, geometry, temporal, privacy and real AGID requirements', () => {
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  const m2 = manifest.promotion.stages.find((stage: { id: string }) => stage.id === 'M2_experimental');
  assert.match(m2.definition, /Rights-cleared, editioned Afghan Post six-digit assignment and postal-area artifacts/);
  assert.match(m2.definition, /temporal lineage, independently licensed geometry, CRS\/topology and privacy checks, published immutable artifacts, and real AGID runtime verification/);
  for (const key of ['contains_raw_source_data', 'contains_real_addresses', 'contains_personal_data', 'contains_production_geometry']) assert.equal(manifest.release_scope[key], false);
  assert.equal(manifest.release_scope.fixtures_are_synthetic, true);
  assert.ok(manifest.promotion.m2_required_evidence.includes('real-agid-loader-and-api-validation-not-only-synthetic-fixtures'));
  assert.ok(manifest.promotion.hard_blockers.includes('live-area-observation-without-retained-edition-or-redistribution-rights-presented-as-m2'));
});

test('AF operator and map webpages are not eligible postal validation datasets', () => {
  const preferred = getPreferredPostalSourceIdsForCountry('AF');
  const sources = getOfficialPostalSourcesForCountry('AF');
  for (const id of ['afghan-post', 'afghan-postal-code-system']) {
    const source = sources.find(item => item.id === id);
    assert.ok(source);
    assert.equal(source.authority, 'postal-operator');
    assert.equal(source.sourceRole, 'context-only');
    assert.equal(source.validationReadiness, 'metadata-only');
    assert.ok(!preferred.includes(id));
    for (const identity of [{ sourceIds: [id] }, { url: source.url }, { source: source.label }]) {
      assert.equal(classifyPostalSourceTrust({ countryCode: 'AF', ...identity }).strength, 'weak');
    }
  }
});

test('AF review keeps source-specific dates and forbids guessed legacy expansion', () => {
  assert.match(profile.temporal_review.upu_statement, /1 October 2024/);
  assert.match(profile.temporal_review.operator_page_caveat, /21 March 2011/);
  assert.match(profile.temporal_review.rule, /Neither document nor retrieval date supplies validity dates.*do not invent legacy-code suffixes/);
  assert.ok(manifest.promotion.hard_blockers.includes('legacy-four-digit-code-expanded-with-invented-zone-suffix'));
  assert.equal(normalizeAfghanistanPostalCode('1002'), null);
  assert.equal(normalizeAfghanistanPostalCode('۱۰۰۲۰۸'), '100208');
  // Format normalization alone has never established source assignment.
  assert.equal(normalizeAfghanistanPostalCode('999999'), '999999');
});

test('AF keeps administration, building identity and AGID separate from postal geometry', () => {
  assert.match(profile.rights_review.admin_context, /not for Afghan Post postal geometry or address data/);
  assert.match(manifest.postal_system.geometry_rule, /OCHA.*administrative context.*derived.*never become official/);
  assert.match(manifest.postal_system.building_rule, /explicit rights-cleared civic-address identifier.*stable reviewed relation.*not an automatic/);
  assert.match(manifest.postal_system.agid_rule, /independent spatial index.*without relabelling/);
  assert.equal(profile.area_probe.allow_search_queries, false);
  assert.equal(profile.area_probe.allow_bulk_endpoints, false);
  assert.equal(profile.area_probe.persist_source_response, false);
});

test('real AF area preflight cannot satisfy retained-source or publication gates', () => {
  const report = JSON.parse(read('reports/postal-context-m2/af-source-review-2026-08-28.json'));
  assert.equal(report.countryM2Achieved, false);
  assert.equal(report.sourceDataSnapshotsPersisted, 0);
  assert.equal(report.publishedDataArtifacts, 0);
  assert.equal(report.rightsForPublicTransformedArtifactsCleared, false);
  assert.equal(report.areaObservation.sourceResponsesPersisted, 0);
  assert.equal(report.areaObservation.countryM2Achieved, false);
  assert.equal(report.areaObservation.realAgidRuntimeVerified, false);
  if (report.areaObservation.observedAreaRecords) {
    assert.match(report.areaObservation.responseDigest, /^sha256:[a-f0-9]{64}$/);
    assert.equal(report.areaObservation.validation.matchesRequestedCode, true);
    assert.equal(report.areaObservation.validation.sourceEdition, null);
    assert.equal(report.areaObservation.validation.completeTopologyVerified, false);
  }
  assert.ok(!JSON.stringify(report).includes('coordinates'));
});

test('AF ledger criterion and report hash match repository bytes', () => {
  const ledger = JSON.parse(read('docs/postal-context-m2-rollout.json'));
  const af = ledger.countries.find((country: { countryCode: string }) => country.countryCode === 'AF');
  assert.deepEqual(af.m2Definition, manifest.promotion.stages.find((stage: { id: string }) => stage.id === 'M2_experimental'));
  if (af.lastAttempt?.report === 'reports/postal-context-m2/af-source-review-2026-08-28.json') {
    const digest = 'sha256:' + createHash('sha256').update(read(af.lastAttempt.report).replaceAll('\r\n', '\n')).digest('hex');
    assert.equal(af.lastAttempt.reportDigest, digest);
  }
});

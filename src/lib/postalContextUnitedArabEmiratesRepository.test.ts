import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parse } from 'yaml';
import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from '../data/asiaOpenGeoSources';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry, getPreferredPostalSourceIdsForCountry } from './officialPostalSourceCatalog';
import { isPostalContextCountryCode } from './postalContextCountryPolicy';

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const manifest = JSON.parse(read('data/postal_country_packs/ae/postal-context/repository-manifest.json'));
const profile = JSON.parse(read('data/postal_country_packs/ae/postal-context/source-profile.json'));
const referenceIds = ['makani-dubai', 'emirates-post-po-box', 'dmt-onwani-addressing', 'dmt-onwani-terms', 'upu-uae-addressing-2014'];

test('AE M1 contract keeps three identifier namespaces and real scoped M2 gates', () => {
  assert.equal(manifest.repository.country_code, 'AE');
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  for (const field of ['contains_raw_source_data', 'contains_real_addresses', 'contains_personal_data', 'contains_production_geometry']) assert.equal(manifest.release_scope[field], false);
  assert.deepEqual(manifest.identifier_namespaces.map((item: { id: string }) => item.id), ['emirates_post_po_box', 'dubai_makani_entrance', 'abu_dhabi_onwani_postal_code']);
  assert.deepEqual(manifest.identifier_namespaces[0].required_identity, ['operator', 'branch_id', 'box_identifier']);
  const m2 = manifest.promotion.stages.find((stage: { id: string }) => stage.id === 'M2_scoped_address_context');
  assert.match(m2.definition, /rights-cleared.*real dataset.*jurisdiction.*namespace.*published.*AGID/);
  for (const gate of ['real-current-source-records-with-declared-edition-and-scope', 'rights-cleared-for-the-actual-transformations-and-public-artifacts', 'approved-immutable-external-publication-and-remote-digest-verification', 'namespace-aware-agid-loader-and-api-verification']) assert.ok(manifest.promotion.m2_required_evidence.includes(gate));
  for (const exception of ['po_box_not_postcode', 'onwani_not_nationwide_postcode', 'makani_entrance_not_postal_polygon', 'parcel_not_civic_address', 'ambiguous_identifier_without_namespace']) assert.ok(manifest.exception_classes.includes(exception));
});

test('AE official reference metadata cannot validate postal assignments by source ID', () => {
  const sources = getOfficialPostalSourcesForCountry('AE');
  const preferred = getPreferredPostalSourceIdsForCountry('AE');
  for (const id of referenceIds) {
    const source = sources.find(item => item.id === id);
    assert.ok(source, id);
    assert.equal(source.validationReadiness, 'metadata-only');
    assert.ok(['context-only', 'legal-framework-only'].includes(source.sourceRole ?? ''));
    assert.equal(source.availability, 'web-search');
    assert.ok(!preferred.includes(id));
    const result = classifyPostalSourceTrust({ countryCode: 'AE', sourceIds: [id] });
    assert.equal(result.strength, 'weak', id);
    assert.deepEqual(result.matches.map(item => item.id), [id]);
    assert.ok(!getOfficialPostalSourcesForCountry('AF').some(item => item.id === id));
  }
});

test('exact AE reference URLs cannot be upgraded by generic official source aliases', () => {
  for (const source of getOfficialPostalSourcesForCountry('AE').filter(item => referenceIds.includes(item.id))) {
    const result = classifyPostalSourceTrust({ countryCode: 'AE', url: source.url });
    assert.equal(result.strength, 'weak', source.id);
    assert.ok(result.matches.some(item => item.id === source.id));
    assert.equal(classifyPostalSourceTrust({ countryCode: 'AE', source: source.label }).strength, 'weak', source.id);
    assert.equal(classifyPostalSourceTrust({ countryCode: 'AE', source: 'UPU', url: source.url }).strength, 'weak', source.id);
  }
  assert.equal(classifyPostalSourceTrust({ countryCode: 'AE', source: 'Dubai Makani' }).strength, 'weak');
  assert.equal(classifyPostalSourceTrust({ countryCode: 'AE', url: 'https://www.makani.ae/' }).strength, 'weak');
});

test('AE sources preserve subnational coverage and conditional rights', () => {
  const ids = getAsiaOpenSourceIds('AE');
  for (const id of ['makani-dubai-open-data', 'dmt-onwani-addressing', 'dmt-onwani-terms'] as const) {
    assert.ok(ids.includes(id));
    assert.equal(ASIA_OPEN_GEO_SOURCES[id].coverage, 'subnational');
    assert.equal(ASIA_OPEN_GEO_SOURCES[id].usage, 'reference');
  }
  assert.match(ASIA_OPEN_GEO_SOURCES['makani-dubai-open-data'].license ?? '', /Conditional.*not unrestricted/);
  assert.ok(ids.includes('emirates-post-po-box'));
  assert.ok(ids.includes('upu-uae-addressing-2014'));
});

test('AE JSON and YAML describe scoped Onwani without inventing a nationwide code validator', () => {
  const base = 'src/data/address_formats/asia/middle_east/AE';
  const json = JSON.parse(read(`${base}.json`));
  const yaml = parse(read(`${base}.yaml`));
  assert.deepEqual(yaml.postalCode, json.postalCode);
  assert.deepEqual(yaml.openSourceIds, json.openSourceIds);
  assert.deepEqual(yaml.addressRules.openSourceIds, json.openSourceIds);
  assert.match(json.postalCode.format, /Abu Dhabi Onwani.*separate from PO Boxes and Makani/);
  assert.equal(json.postalCode.regex, null);
  assert.equal(json.postalCode.api, null);
  assert.equal(json.addressRules.postalCode, null);
  for (const id of getAsiaOpenSourceIds('AE')) assert.ok(json.openSourceIds.includes(id), id);
});

test('AE reference contract does not enable a country-only runtime or infer civic and building evidence', () => {
  assert.equal(isPostalContextCountryCode('AE'), false);
  assert.equal(isPostalContextCountryCode('JP'), true);
  assert.match(manifest.agid_integration.enablement_gate, /namespace\/jurisdiction.*PO Box, Onwani and Makani/);
  assert.ok(manifest.promotion.hard_blockers.includes('location-or-parcel-proximity-promoted-to-building-identity'));
  assert.ok(manifest.promotion.m2_required_evidence.includes('separate-direct-source-evidence-for-civic-number-building-and-entrance-display'));
});

test('historical UPU and current municipal references remain documents, not source rows', () => {
  assert.ok(profile.sources.every((source: { bundled_here: boolean }) => source.bundled_here === false));
  const upu = profile.sources.find((source: { source_id: string }) => source.source_id === 'upu-uae-addressing-2014');
  assert.equal(upu.source_version, '09/2014');
  assert.equal(upu.assignment_authority, 'none');
  assert.equal(upu.geometry_authority, 'none');
  assert.match(upu.role, /Historical.*does not override current municipal Onwani/);
});

test('recorded AE reference review reports zero data and never promotes access errors', () => {
  const report = JSON.parse(read('reports/postal-context-m2/ae-reference-review-2026-08-28.json'));
  assert.equal(report.countryM2Achieved, false);
  assert.equal(report.sourceDataRecords, 0);
  assert.equal(report.sourceDataSnapshotsPersisted, 0);
  assert.equal(report.publishedDataArtifacts, 0);
  assert.equal(report.rightsForPublicTransformedArtifactsCleared, false);
  assert.deepEqual(report.references.map((ref: { id: string }) => ref.id), profile.reference_probes.map((ref: { id: string }) => ref.id));
  for (const ref of report.references) {
    assert.ok(Number.isFinite(Date.parse(ref.observedAt)));
    if (ref.contentVerified) {
      assert.equal(ref.status, 'reference-verified-not-data');
      assert.equal(ref.sourceDataRecords, 0);
      assert.match(ref.sourceDocumentDigest, /^sha256:[a-f0-9]{64}$/);
    } else assert.ok(!ref.sourceDocumentDigest);
  }
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Manifest = {
  repository: { name: string; country_code: string; maturity: string };
  release_scope: Record<string, boolean>;
  postal_system: Record<string, string>;
  promotion: { current_stage: string; data_completion_verified: boolean; agid_integration_verified: boolean; hard_blockers: string[]; stages: Array<{ id: string; definition: string }>; agid_integration: Record<string, any> };
};
type Profile = {
  artifact_scope: string;
  sources: Array<Record<string, any>>;
  artifact_partitions: Array<{ id: string }>;
};
type Fixtures = {
  country_code: string;
  synthetic: boolean;
  promotion_eligible: boolean;
  fixture_policy: Record<string, any>;
  fixtures: Array<{
    fixture_id: string;
    synthetic_address: { postcode?: string };
    expected: { must_not_assert: string[] };
  }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/ec/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Ecuador seed separates lookup evidence, legal semantics, interoperability, buildings, cadastre, models, jurisdiction, and AGID', () => {
  const value = readJson<Manifest>('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-ec');
  assert.equal(value.repository.country_code, 'EC');
  assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, true);
  assert.equal(value.release_scope.contains_raw_source_data, false);
  assert.equal(value.release_scope.contains_real_addresses, false);
  assert.equal(value.release_scope.contains_personal_data, false);
  assert.equal(value.release_scope.contains_production_geometry, false);
  assert.equal(value.postal_system.code_format, 'NNNNNN');
  assert.match(value.postal_system.assignment_rule, /six numeric digits.*province.*planning district.*postal zone.*syntax alone/i);
  assert.match(value.postal_system.geometry_rule, /territorial portions.*180204.*MultiPolygon.*single live observation.*2020.*use agreement.*cannot be presented/i);
  assert.match(value.postal_system.address_format_rule, /recipient.*building.*house or building number.*cross street.*canton.*province.*no real example/i);
  assert.match(value.postal_system.postal_object_rule, /postal_area.*unique_postcode.*unknown.*postal zone.*without source evidence/i);
  assert.match(value.postal_system.building_rule, /civic-address identifier.*stable reviewed relation.*INEC.*CUEN.*not an exact/i);
  assert.match(value.postal_system.cadastre_rule, /municipal.*GADs.*Parcels remain separate.*Owner.*resident/i);
  assert.match(value.postal_system.derived_and_realtime_rule, /machine learning.*cache TTL.*derived status.*never overwrites/i);
  assert.match(value.postal_system.agid_rule, /independent spatial index.*Versioned crosswalks.*official Ecuador/i);
  assert.match(value.postal_system.licence_rule, /no blanket bulk polygon.*Resolution 2020-26.*use agreement.*Annex 1.*DINARP.*INEC.*IGM.*ODbL/i);
  assert.match(value.postal_system.jurisdiction_rule, /ISO EC.*mainland.*insular.*maritime/i);
  assert.match(value.postal_system.temporal_rule, /lookup observations.*INEC.*municipal parcels.*source version.*timeless/i);
  assert.equal(value.promotion.data_completion_verified, false);
  assert.equal(value.promotion.agid_integration_verified, false);
  assert.equal(value.promotion.stages[0].id, 'M2_current_mintel_assignment_and_postal_area_visualization');
  assert.match(value.promotion.stages[0].definition, /current complete.*use agreement.*180204.*MultiPolygon.*translucent fill/i);
  assert.equal(value.promotion.agid_integration.approved_runtime_artifacts, 0);
  for (const blocker of [
    'valid-six-digit-text-presented-as-current-assignment',
    'single-live-lookup-or-unverified-geoserver-presented-as-current-complete-reusable-postal-polygon-release',
    'vector-product-downloaded-or-used-without-reviewed-and-authorized-use-agreement',
    'historical-1225-zone-count-presented-as-current-complete-denominator',
    'dinarp-inec-igm-admin-cadastre-or-osm-evidence-presented-as-canonical-postal-polygon',
    'coordinate-cuen-census-point-parcel-containment-or-proximity-presented-as-exact-building-relation',
    'derived-api-or-model-surface-presented-as-official-or-used-to-fill-unknown-coverage',
    'postal-source-coverage-silently-extended-beyond-declared-ec-scope',
  ]) assert.ok(value.promotion.hard_blockers.includes(blocker));
});

test('Ecuador source profile keeps postal lookup, interoperability, census, IGM, GAD, and community authority separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('codigo-postal-ec')?.assignment_authority ?? '', /official_government.*lookup/i);
  assert.match(sources.get('codigo-postal-ec')?.geometry_authority ?? '', /lookup_rendering.*not_bulk.*polygon/i);
  assert.match(sources.get('codigo-postal-ec-technical-standard')?.geometry_authority ?? '', /none.*without_digital_release/i);
  assert.match(sources.get('codigo-postal-ec-public-products-resolution')?.geometry_authority ?? '', /vector_product_declared.*not_retrieved/i);
  assert.match(sources.get('codigo-postal-ec-public-products-resolution')?.redistribution_class ?? '', /use_agreement.*protected_download/i);
  assert.match(sources.get('dinarp-ecuador-postal-interoperability')?.redistribution_class ?? '', /authorized_interoperability/i);
  assert.match(sources.get('inec-ecuador-census-cartography')?.geometry_authority ?? '', /census_point.*not_postal.*footprint/i);
  assert.match(sources.get('igm-ecuador-base-cartography')?.geometry_authority ?? '', /base_cartography.*not_postal/i);
  assert.match(sources.get('sistema-nacional-catastro-ecuador')?.geometry_authority ?? '', /parcel.*not_postal/i);
  assert.match(sources.get('osm-ecuador')?.redistribution_class ?? '', /ODbL/i);
  for (const id of [
    'official-postal-lookup-observations', 'postal-legal-semantics', 'official-controlled-postal-products',
    'authorized-interoperability-observations', 'typed-postal-objects',
    'historical-postal-observations', 'derived-postal-validation-surfaces',
    'administrative-identities-and-boundaries', 'civic-address-and-intersection-context',
    'inec-census-building-context', 'explicit-civic-address-to-building-relation',
    'gad-cadastre-context', 'community-validation', 'agid-crosswalk',
  ]) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === id));
});

test('Ecuador fixtures are synthetic and keep lookup geometry, buildings, property, jurisdiction, and AGID non-authoritative', () => {
  const pack = readJson<Fixtures>('fixtures/ecuador-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'EC');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.postal_value, '999999');
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.synthetic_value_not_checked_against_live_lookup, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.ok(postcodes.every(postcode => /^\d{6}$/.test(postcode)));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('ec-syn-')));
  for (const claim of [
    'synthetic-code-is-current-postal-assignment',
    'synthetic-polygon-is-official-mintel-reusable-postal-geometry',
    'lookup-rendering-or-unverified-featureserver-is-official-reusable-postal-geometry',
    'dinarp-inec-igm-or-gad-object-is-postal-assignment',
    'coordinate-cuen-census-point-parcel-containment-or-proximity-is-exact-building-link',
    'owner-resident-person-property-utility-or-cadastral-data-is-public-address-data',
    'postal-source-coverage-extends-beyond-declared-ec-scope',
    'agid-cell-is-official-postal-geometry',
  ]) assert.ok(prohibited.has(claim));
});

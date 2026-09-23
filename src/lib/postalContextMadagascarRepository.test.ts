import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Manifest = {
  repository: { name: string; country_code: string; maturity: string };
  release_scope: Record<string, boolean>;
  postal_system: Record<string, string | string[]>;
  promotion: { current_stage: string; hard_blockers: string[] };
};
type Profile = {
  artifact_scope: string;
  sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>;
  artifact_partitions: Array<{ id: string }>;
  postal_assignment_promotion_gate: { required: string[]; failure_mode: string };
  postal_geometry_promotion_gate: { required: string[]; failure_mode: string };
  administrative_crosswalk_gate: { required: string[]; failure_mode: string };
  building_resolution_gate: { required: string[]; failure_mode: string };
  public_hosting_gate: { required: string[]; failure_mode: string };
};
type Fixtures = {
  country_code: string;
  synthetic: boolean;
  promotion_eligible: boolean;
  fixture_policy: {
    contains_real_addresses: boolean;
    contains_upstream_rows: boolean;
    contains_personal_data: boolean;
    postcode_value: string;
    postcode_matches_dated_shape: boolean;
    first_digit_is_dated_province_range: boolean;
    synthetic_value_not_assignment_evidence: boolean;
    collision_requires_replacement_before_promotion: boolean;
    coordinates_are_upstream_observations: boolean;
    identifiers_are_assignment_evidence: boolean;
  };
  fixtures: Array<{ fixture_id: string; expected: { must_not_assert: string[] } }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/mg/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Madagascar seed separates current assignment, dated administration, geometry, community, land, buildings, privacy, hosting and AGID', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-mg');
  assert.equal(manifest.repository.country_code, 'MG');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_upstream_rows, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.canonical_postcode_format, 'NNN');
  assert.match(String(manifest.postal_system.dated_shape_rule), /August 2011.*three digits.*six historical provinces.*not a current assignment/i);
  assert.match(String(manifest.postal_system.assignment_rule), /current.*digest.*Paositra Malagasy.*homepage self-address.*UPU examples.*community list.*do not establish.*complete/i);
  assert.match(String(manifest.postal_system.administrative_transition_rule), /province.*Fivondronana.*not.*current region.*many-to-many.*non-postal/i);
  assert.match(String(manifest.postal_system.geometry_rule), /no reviewed.*canonical postcode boundary.*default.*none.*Voronoi.*AGID.*never.*official/i);
  assert.match(String(manifest.postal_system.community_rule), /OpenStat.*CC BY 4\.0.*manually collected.*incomplete.*never.*authority/i);
  assert.match(String(manifest.postal_system.building_rule), /rights-cleared civic address point.*explicit address-to-building.*insufficient/i);
  assert.match(String(manifest.postal_system.land_rule), /FTM.*SALB.*MATSF.*does not prove.*building.*owner/i);
  assert.match(String(manifest.postal_system.privacy_rule), /Law 2014-038.*purpose.*security.*retention.*query histories.*not public/i);
  assert.match(String(manifest.postal_system.realtime_rule), /bounded normalized receipts.*terms version.*no invisible unverified live fallback/i);
  assert.match(String(manifest.postal_system.hosting_rule), /Cloudflare.*Hugging Face.*rights-cleared.*controlled infrastructure/i);
  assert.match(String(manifest.postal_system.agid_rule), /independent spatial index.*not a Paositra Malagasy.*building/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.length >= 9);
});

test('Madagascar source profile gates operator, dated UPU, community, administration, land, privacy, buildings and ODbL independently', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('paositra-malagasy')?.assignment_authority, 'official_self_address_observation_only');
  assert.equal(sources.get('paositra-malagasy')?.geometry_authority, 'none');
  assert.equal(sources.get('paositra-malagasy-agencies')?.assignment_authority, 'none_office_identity_only');
  assert.equal(sources.get('upu-madagascar-addressing-2011')?.assignment_authority, 'none_dated_examples_and_semantics_only');
  assert.equal(sources.get('openstat-madagascar-postcodes-2021')?.assignment_authority, 'none_community_candidate');
  assert.equal(sources.get('openstat-madagascar-postcodes-2021')?.redistribution_class, 'R1_open_attributed_candidate');
  assert.match(sources.get('un-salb-madagascar-ftm')?.geometry_authority ?? '', /administrative.*not_postal/i);
  assert.equal(sources.get('matsf-madagascar-geospatial-land')?.redistribution_class, 'R5_private_restricted');
  assert.equal(sources.get('madagascar-data-protection-2014-038')?.geometry_authority, 'none');
  assert.equal(sources.get('osm-madagascar')?.redistribution_class, 'R6_odbl_separate_partition');
  for (const id of ['current-official-postal-observations', 'dated-upu-semantics', 'community-postcode-candidates', 'current-administrative-context', 'land-restricted', 'civic-address-and-building', 'derived-or-virtual-candidates', 'community-odbl', 'private-and-query', 'synthetic-conformance']) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === id), id);
  assert.match(profile.postal_assignment_promotion_gate.failure_mode, /syntax.*dated.*self-address.*community/i);
  assert.match(profile.postal_geometry_promotion_gate.failure_mode, /no-canonical-geometry/i);
  assert.match(profile.administrative_crosswalk_gate.failure_mode, /do-not-map.*province.*current-admin/i);
  assert.match(profile.building_resolution_gate.failure_mode, /stop-at-address-or-locality/i);
  assert.match(profile.public_hosting_gate.failure_mode, /cloudflare.*hugging-face/i);
});

test('Madagascar fixtures are synthetic and cannot promote codes, boundaries, administration, addresses or buildings', () => {
  const fixtures = readJson<Fixtures>('fixtures/madagascar-synthetic.json');
  assert.equal(fixtures.country_code, 'MG');
  assert.equal(fixtures.synthetic, true);
  assert.equal(fixtures.promotion_eligible, false);
  assert.equal(fixtures.fixture_policy.contains_real_addresses, false);
  assert.equal(fixtures.fixture_policy.contains_upstream_rows, false);
  assert.equal(fixtures.fixture_policy.contains_personal_data, false);
  assert.equal(fixtures.fixture_policy.postcode_value, '699');
  assert.equal(fixtures.fixture_policy.postcode_matches_dated_shape, true);
  assert.equal(fixtures.fixture_policy.first_digit_is_dated_province_range, true);
  assert.equal(fixtures.fixture_policy.synthetic_value_not_assignment_evidence, true);
  assert.equal(fixtures.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.equal(fixtures.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(fixtures.fixture_policy.identifiers_are_assignment_evidence, false);
  const prohibited = new Set(fixtures.fixtures.flatMap(fixture => fixture.expected.must_not_assert));
  for (const claim of ['current_paositra_assignment', 'postcode_polygon', 'current_region_or_district', 'deliverability', 'building', 'real_address', 'real_building', 'land_title', 'owner_or_occupant']) assert.ok(prohibited.has(claim), claim);
});

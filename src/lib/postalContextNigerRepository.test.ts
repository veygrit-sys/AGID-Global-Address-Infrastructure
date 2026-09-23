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
    postcode_matches_current_shape: boolean;
    first_digit_is_current_region_range: boolean;
    synthetic_value_not_assignment_evidence: boolean;
    collision_requires_replacement_before_promotion: boolean;
    coordinates_are_upstream_observations: boolean;
    identifiers_are_assignment_evidence: boolean;
  };
  fixtures: Array<{ fixture_id: string; expected: { must_not_assert: string[] } }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/ne/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Niger seed keeps routing codes non-geographic and separates address, building, land, privacy, hosting and AGID', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-ne');
  assert.equal(manifest.repository.country_code, 'NE');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_upstream_rows, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.canonical_postcode_format, 'NNNN');
  assert.match(String(manifest.postal_system.current_directory_shape_rule), /four digits.*1 through 8.*not a live assignment/i);
  assert.match(String(manifest.postal_system.coding_method_rule), /first digit.*region.*remaining digits.*post office.*pinned independently/i);
  assert.match(String(manifest.postal_system.geometry_rule), /no boundary coordinates.*default full-code geometry is none.*Voronoi.*AGID.*never.*official/i);
  assert.match(String(manifest.postal_system.address_rule), /postcode.*before.*locality.*BP.*separate.*2005.*not override current/i);
  assert.match(String(manifest.postal_system.building_rule), /rights-cleared civic address point.*explicit address-to-building.*insufficient/i);
  assert.match(String(manifest.postal_system.land_rule), /cadastral.*controlled context.*does not prove.*owner.*occupant/i);
  assert.match(String(manifest.postal_system.privacy_rule), /Law 2022-59.*purpose.*security.*query histories.*not public/i);
  assert.match(String(manifest.postal_system.realtime_rule), /bounded normalized receipts.*terms version.*no invisible unverified live fallback/i);
  assert.match(String(manifest.postal_system.hosting_rule), /Cloudflare.*Hugging Face.*rights-cleared.*controlled infrastructure/i);
  assert.match(String(manifest.postal_system.agid_rule), /independent spatial index.*not a Niger Poste code.*building/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.length >= 8);
});

test('Niger source profile gates assignments, geography, land, buildings, privacy, realtime hosting and ODbL independently', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('niger-poste')?.assignment_authority, 'official_postal_operator');
  assert.equal(sources.get('niger-poste')?.geometry_authority, 'none');
  assert.equal(sources.get('niger-poste')?.redistribution_class, 'R3_terms_unresolved');
  assert.equal(sources.get('niger-poste-agencies')?.assignment_authority, 'none_office_identity_only');
  assert.equal(sources.get('niger-poste-agencies')?.geometry_authority, 'none');
  assert.equal(sources.get('upu-niger-addressing-2005')?.assignment_authority, 'none');
  assert.equal(sources.get('ignniger-national-geography')?.geometry_authority, 'official_administrative_or_land_geometry');
  assert.equal(sources.get('ignniger-national-geography')?.redistribution_class, 'R5_private_restricted');
  assert.equal(sources.get('hapdp-niger-data-protection-2022')?.geometry_authority, 'none');
  assert.equal(sources.get('osm-niger')?.redistribution_class, 'R6_odbl_separate_partition');
  for (const id of ['postal-routing-observations', 'administrative-context', 'land-restricted', 'civic-address-and-building', 'derived-or-virtual-candidates', 'community-odbl', 'private-and-query', 'synthetic-conformance']) {
    assert.ok(profile.artifact_partitions.some(item => item.id === id), id);
  }
  assert.ok(profile.postal_assignment_promotion_gate.required.includes('current-niger-poste-row'));
  assert.match(profile.postal_assignment_promotion_gate.failure_mode, /syntax-only-or-stale/i);
  assert.ok(profile.postal_geometry_promotion_gate.required.includes('explicit-niger-poste-geographic-assignment-or-authorized-boundary-crosswalk'));
  assert.match(profile.postal_geometry_promotion_gate.failure_mode, /no-canonical-geometry/i);
  assert.ok(profile.building_resolution_gate.required.includes('explicit-address-building-relation'));
  assert.match(profile.building_resolution_gate.failure_mode, /without-exact-building/i);
  assert.ok(profile.public_hosting_gate.required.includes('non-personal-minimized-artifact'));
  assert.match(profile.public_hosting_gate.failure_mode, /cloudflare-and-hugging-face/i);
});

test('Niger fixtures are synthetic and cannot promote routing codes, polygons, admin/land joins, addresses or buildings', () => {
  const pack = readJson<Fixtures>('fixtures/niger-synthetic.json');
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'NE');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.postcode_value, '8999');
  assert.equal(pack.fixture_policy.postcode_matches_current_shape, true);
  assert.equal(pack.fixture_policy.first_digit_is_current_region_range, true);
  assert.equal(pack.fixture_policy.synthetic_value_not_assignment_evidence, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.identifiers_are_assignment_evidence, false);
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('ne-syn-')));
  for (const claim of ['directory-row-is-postcode-polygon', 'region-locality-or-office-point-is-postal-catchment', 'postcode-proves-address', 'nearest-land-text-or-model-proves-building', 'admin-boundary-is-postcode-polygon', 'land-is-postal-address-or-building', 'agid-is-niger-poste-land-address-or-building', 'derived-surface-is-official-postcode-polygon']) {
    assert.ok(prohibited.has(claim), claim);
  }
});

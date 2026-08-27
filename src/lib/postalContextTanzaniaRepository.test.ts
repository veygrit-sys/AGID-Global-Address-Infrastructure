import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Manifest = {
  repository: { name: string; country_code: string; maturity: string };
  release_scope: Record<string, boolean>;
  postal_system: Record<string, string>;
  promotion: { current_stage: string; hard_blockers: string[] };
};
type Profile = {
  artifact_scope: string;
  sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>;
  artifact_partitions: Array<{ id: string }>;
  administrative_geometry_promotion_gate: { required: string[]; failure_mode: string };
  building_resolution_gate: { required: string[]; failure_mode: string };
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
    postcode_category: string;
    po_box_value: string;
    civic_address_value: string;
    building_value: string;
    coordinates_are_upstream_observations: boolean;
    identifiers_are_assignment_evidence: boolean;
    synthetic_values_not_checked_against_live_tcra: boolean;
    collision_requires_replacement_before_promotion: boolean;
  };
  fixtures: Array<{ fixture_id: string; expected: { must_not_assert: string[] } }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/tz/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Tanzania seed separates five-digit syntax, assignment status, five categories, geometry, address, building, privacy and AGID', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-tz');
  assert.equal(manifest.repository.country_code, 'TZ');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.canonical_postcode_format, 'NNNNN_typed_category_and_assignment_required');
  assert.match(manifest.postal_system.postcode_rule, /six mainland zones plus Zanzibar.*ward.*allocated, assigned and reserved/i);
  assert.match(manifest.postal_system.category_rule, /administrative_area.*post_office.*big_mailer.*landmark.*temporary_event.*do not universally denote a polygon/i);
  assert.match(manifest.postal_system.geometry_rule, /explicit TCRA geometry.*ward\/shehia.*derived review surface.*rights-cleared NBS or OCGS.*not official postcode polygons/i);
  assert.match(manifest.postal_system.address_rule, /house number.*ward or shehia.*physical address code.*P\.O\. Box.*separate/i);
  assert.match(manifest.postal_system.building_rule, /explicit rights-cleared LGA or NaPA civic-address-to-building.*candidate context only/i);
  assert.match(manifest.postal_system.licence_rule, /address-file dissemination under TCRA.*NBS 2022.*prohibit redistribution.*written agreement/i);
  assert.match(manifest.postal_system.privacy_rule, /Personal Data Protection Act.*9 April 2026/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
});

test('Tanzania source profile gates current assignments, restricted ward geometry, NaPA buildings, privacy and ODbL independently', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('tcra-tanzania-postcodes')?.assignment_authority, 'official_postcode_lookup_observation');
  assert.equal(sources.get('tcra-tanzania-postcode-plan-2026')?.geometry_authority, 'none');
  assert.match(sources.get('tcra-tanzania-addressing')?.geometry_authority ?? '', /do_not_create_reusable_postal_surface/i);
  assert.equal(sources.get('nbs-tanzania-wards-2022')?.redistribution_class, 'R3_written_permission_required');
  assert.match(sources.get('nbs-tanzania-wards-2022')?.geometry_authority ?? '', /statistical_boundary_artifact_specific/i);
  assert.equal(sources.get('tcra-tanzania-napa')?.redistribution_class, 'R5_private_restricted');
  assert.equal(sources.get('osm-tanzania')?.redistribution_class, 'R2_odbl_separate_partition');
  for (const id of ['typed-current-postcode-assignment', 'administrative-area-crosswalk', 'non-area-postal-objects', 'official-postal-surface', 'derived-postal-review-surface', 'mainland-and-zanzibar-administration', 'civic-address-and-po-box', 'address-linked-building', 'agid-crosswalk', 'community-odbl', 'private-and-restricted']) {
    assert.ok(profile.artifact_partitions.some(item => item.id === id), id);
  }
  assert.ok(profile.administrative_geometry_promotion_gate.required.includes('written-redistribution-permission'));
  assert.match(profile.administrative_geometry_promotion_gate.failure_mode, /no-canonical-geometry/i);
  assert.ok(profile.building_resolution_gate.required.includes('explicit-address-building-relation'));
  assert.match(profile.building_resolution_gate.failure_mode, /without-exact-building/i);
});

test('Tanzania fixtures are synthetic and cannot promote codes, categories, polygons, addresses or buildings', () => {
  const pack = readJson<Fixtures>('fixtures/tanzania-synthetic.json');
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'TZ');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.postcode_value, '19999');
  assert.equal(pack.fixture_policy.postcode_category, 'administrative_area');
  assert.match(pack.fixture_policy.po_box_value, /^TZ-SYN-/);
  assert.match(pack.fixture_policy.civic_address_value, /^TZ-SYN-/);
  assert.match(pack.fixture_policy.building_value, /^TZ-SYN-/);
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.identifiers_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.synthetic_values_not_checked_against_live_tcra, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('tz-syn-')));
  for (const claim of ['five-digit-text-universally-means-area', 'post-office-or-big-mailer-is-polygon', 'synthetic-derived-surface-is-official-tcra-postcode-polygon', 'po-box-is-postcode-residence-or-building', 'agid-is-tcra-postcode-or-napa-address-code']) {
    assert.ok(prohibited.has(claim), claim);
  }
});

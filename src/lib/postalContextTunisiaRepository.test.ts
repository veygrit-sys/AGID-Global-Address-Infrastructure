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
    delivery_office_value: string;
    civic_address_value: string;
    building_value: string;
    coordinates_are_upstream_observations: boolean;
    identifiers_are_assignment_evidence: boolean;
    synthetic_values_not_checked_against_live_la_poste: boolean;
    collision_requires_replacement_before_promotion: boolean;
  };
  fixtures: Array<{ fixture_id: string; expected: { must_not_assert: string[] } }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/tn/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Tunisia seed separates four-digit syntax, current assignment, admin geometry, address, building, cadastre, privacy and AGID', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-tn');
  assert.equal(manifest.repository.country_code, 'TN');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.canonical_postcode_format, 'NNNN_syntax_and_current_assignment_separate');
  assert.match(manifest.postal_system.postcode_rule, /four.*digits.*leading zero.*governorate.*delegation.*locality.*not.*polygon/i);
  assert.match(manifest.postal_system.geometry_rule, /No verified reusable nationwide.*office point.*delegation boundary.*derived review surface.*canonical geometry.*La Poste/i);
  assert.match(manifest.postal_system.address_rule, /entrance.*staircase.*building.*letter-box.*not current address rows/i);
  assert.match(manifest.postal_system.building_rule, /stable rights-cleared civic-address identifier.*explicit reviewed authoritative address-to-building.*nearest OSM footprint.*candidate/i);
  assert.match(manifest.postal_system.cadastre_rule, /OTC.*separate.*not.*postcode.*owner.*occupant/i);
  assert.match(manifest.postal_system.licence_rule, /national open-data framework.*licence not specified.*not.*redistribution permission/i);
  assert.match(manifest.postal_system.privacy_rule, /2004-63.*geolocation.*INPDP.*foreign transfer/i);
  assert.match(manifest.postal_system.hosting_rule, /Cloudflare.*Hugging Face.*non-personal.*controlled infrastructure/i);
  assert.match(manifest.postal_system.agid_rule, /AGID remains an independent.*does not become.*postcode.*building/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.length >= 7);
});

test('Tunisia source profile independently gates assignments, admin boundaries, cadastre, buildings, privacy and ODbL', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('la-poste-tunisienne-codes')?.assignment_authority, 'official_postal_lookup_observation');
  assert.equal(sources.get('la-poste-tunisienne-codes')?.redistribution_class, 'R4_validation_only');
  assert.equal(sources.get('upu-tunisia-addressing-2014')?.geometry_authority, 'none');
  assert.equal(sources.get('tunisian-open-data-delegations-2025')?.redistribution_class, 'R3_terms_unresolved');
  assert.equal(sources.get('tunisian-open-data-governorates-2025')?.redistribution_class, 'R2_attributed_open_artifact');
  assert.equal(sources.get('otc-tunisia-cadastral-geoportal')?.redistribution_class, 'R5_private_restricted');
  assert.equal(sources.get('osm-tunisia')?.redistribution_class, 'R6_odbl_separate_partition');
  for (const id of ['current-postcode-assignment', 'administrative-context', 'official-postal-surface', 'derived-postal-review-surface', 'civic-address-components', 'cadastral-context', 'address-linked-building', 'agid-crosswalk', 'community-odbl', 'private-and-restricted']) {
    assert.ok(profile.artifact_partitions.some(item => item.id === id), id);
  }
  assert.ok(profile.administrative_geometry_promotion_gate.required.includes('dataset-specific-redistribution-licence'));
  assert.match(profile.administrative_geometry_promotion_gate.failure_mode, /no-canonical-geometry/i);
  assert.ok(profile.building_resolution_gate.required.includes('explicit-address-building-relation'));
  assert.match(profile.building_resolution_gate.failure_mode, /without-exact-building/i);
});

test('Tunisia fixtures are synthetic and cannot promote assignments, polygons, cadastral links, addresses or buildings', () => {
  const pack = readJson<Fixtures>('fixtures/tunisia-synthetic.json');
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'TN');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.postcode_value, '0996');
  assert.match(pack.fixture_policy.delivery_office_value, /^TN-SYN-/);
  assert.match(pack.fixture_policy.civic_address_value, /^TN-SYN-/);
  assert.match(pack.fixture_policy.building_value, /^TN-SYN-/);
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.identifiers_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.synthetic_values_not_checked_against_live_la_poste, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('tn-syn-')));
  for (const claim of ['four-digit-text-is-exclusive-delivery-catchment', 'synthetic-derived-surface-is-official-la-poste-postcode-polygon', 'governorate-or-delegation-is-postcode-polygon', 'postcode-admin-parcel-address-text-containment-nearest-footprint-or-model-is-address-building-link', 'agid-is-la-poste-code-cadastre-address-or-building']) {
    assert.ok(prohibited.has(claim), claim);
  }
});

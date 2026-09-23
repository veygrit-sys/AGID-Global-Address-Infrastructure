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
    main_island_postcode_value: string;
    rodrigues_postcode_value: string;
    agalega_postcode_value: string;
    postcodes_match_reviewed_shapes: boolean;
    synthetic_values_not_assignment_evidence: boolean;
    collision_requires_replacement_before_promotion: boolean;
    coordinates_are_upstream_observations: boolean;
    identifiers_are_assignment_evidence: boolean;
  };
  fixtures: Array<{ fixture_id: string; expected: { must_not_assert: string[] } }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/mu/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Mauritius seed separates territory assignments, geometry, administration, offices, cadastre, buildings, privacy, hosting and AGID', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-mu');
  assert.equal(manifest.repository.country_code, 'MU');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_upstream_rows, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.canonical_postcode_format, 'NNNNN | RNNNN | ANNNN');
  assert.match(String(manifest.postal_system.shape_rule), /main island.*five digits.*nine geographical districts.*Rodrigues.*R.*Agalega.*A.*not assignment/i);
  assert.match(String(manifest.postal_system.assignment_rule), /current Mauritius Post.*Open Data Mauritius.*territory.*valid-time.*valid shape.*insufficient/i);
  assert.match(String(manifest.postal_system.territory_rule), /Main-island.*Rodrigues.*Agalega.*explicit.*must not be substituted/i);
  assert.match(String(manifest.postal_system.geometry_rule), /no reviewed.*canonical.*boundary.*default.*none.*Voronoi.*AGID.*never.*official/i);
  assert.match(String(manifest.postal_system.open_data_rule), /separate CC BY-SA 4\.0.*digest.*share-alike.*no boundary.*building/i);
  assert.match(String(manifest.postal_system.administrative_rule), /nine geographical districts.*not administrative.*2022.*differ.*2011.*versioned.*non-postal/i);
  assert.match(String(manifest.postal_system.office_rule), /facilities only.*not.*catchment.*customer.*polygon.*building/i);
  assert.match(String(manifest.postal_system.building_rule), /rights-cleared civic address point.*explicit address-to-building.*insufficient/i);
  assert.match(String(manifest.postal_system.land_rule), /Cadastral Survey Act 2011.*access.*confidentiality.*does not.*postcode.*building.*owner/i);
  assert.match(String(manifest.postal_system.privacy_rule), /Data Protection Act 2017.*purpose.*security.*retention.*query histories.*not public/i);
  assert.match(String(manifest.postal_system.realtime_rule), /bounded normalized receipts.*territory.*no invisible unverified live fallback/i);
  assert.match(String(manifest.postal_system.hosting_rule), /Cloudflare.*Hugging Face.*CC BY-SA.*controlled infrastructure/i);
  assert.match(String(manifest.postal_system.agid_rule), /independent spatial index.*not a Mauritius Post.*building/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.length >= 10);
});

test('Mauritius source profile gates operator, three open-data territories, administration, cadastre, privacy, buildings and ODbL independently', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('mauritius-post-postcode')?.assignment_authority, 'official_interactive_result');
  assert.equal(sources.get('mauritius-post-postcode')?.geometry_authority, 'none');
  assert.equal(sources.get('upu-mauritius-postcode-rollout-2014')?.assignment_authority, 'none_dated_rollout_context_only');
  for (const id of ['mauritius-open-data-mainland-postcodes', 'mauritius-open-data-rodrigues-postcodes', 'mauritius-open-data-agalega-postcodes']) {
    assert.match(sources.get(id)?.assignment_authority ?? '', /official_open_data_reference.*operator_reconciliation/i);
    assert.equal(sources.get(id)?.redistribution_class, 'R1_cc_by_sa_attributed');
    assert.equal(sources.get(id)?.geometry_authority, 'none');
  }
  assert.equal(sources.get('mauritius-open-data-post-offices')?.assignment_authority, 'none_facility_identity_only');
  assert.match(sources.get('mauritius-open-data-districts')?.geometry_authority ?? '', /district_not_postal/i);
  assert.match(sources.get('stats-mauritius-census-2022-admin')?.geometry_authority ?? '', /statistical_administrative_context_not_postal/i);
  assert.equal(sources.get('mauritius-cadastral-survey-act-dcdb')?.redistribution_class, 'R5_private_restricted');
  assert.equal(sources.get('mauritius-data-protection-act-2017')?.geometry_authority, 'none');
  assert.equal(sources.get('osm-mauritius')?.redistribution_class, 'R6_odbl_separate_partition');
  for (const id of ['current-operator-observations', 'mainland-official-open-data', 'rodrigues-official-open-data', 'agalega-official-open-data', 'postal-facilities', 'versioned-admin-statistical-context', 'cadastral-restricted', 'civic-address-and-building', 'derived-or-virtual-candidates', 'community-odbl', 'private-and-query', 'synthetic-conformance']) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === id), id);
  assert.match(profile.postal_assignment_promotion_gate.failure_mode, /shape.*upu.*office.*unpinned-open-data/i);
  assert.match(profile.postal_geometry_promotion_gate.failure_mode, /no-canonical-geometry/i);
  assert.match(profile.administrative_crosswalk_gate.failure_mode, /do-not-map.*district.*ward.*vca.*rodrigues.*postcode/i);
  assert.match(profile.building_resolution_gate.failure_mode, /stop-at-address-sublocality-or-locality/i);
  assert.match(profile.public_hosting_gate.failure_mode, /cloudflare.*hugging-face/i);
});

test('Mauritius fixtures are synthetic and cannot promote assignments, territories, boundaries, addresses or buildings', () => {
  const fixtures = readJson<Fixtures>('fixtures/mauritius-synthetic.json');
  assert.equal(fixtures.country_code, 'MU');
  assert.equal(fixtures.synthetic, true);
  assert.equal(fixtures.promotion_eligible, false);
  assert.equal(fixtures.fixture_policy.contains_real_addresses, false);
  assert.equal(fixtures.fixture_policy.contains_upstream_rows, false);
  assert.equal(fixtures.fixture_policy.contains_personal_data, false);
  assert.equal(fixtures.fixture_policy.main_island_postcode_value, '99999');
  assert.equal(fixtures.fixture_policy.rodrigues_postcode_value, 'R9999');
  assert.equal(fixtures.fixture_policy.agalega_postcode_value, 'A9999');
  assert.equal(fixtures.fixture_policy.postcodes_match_reviewed_shapes, true);
  assert.equal(fixtures.fixture_policy.synthetic_values_not_assignment_evidence, true);
  assert.equal(fixtures.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.equal(fixtures.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(fixtures.fixture_policy.identifiers_are_assignment_evidence, false);
  const prohibited = new Set(fixtures.fixtures.flatMap(fixture => fixture.expected.must_not_assert));
  for (const claim of ['current_mauritius_post_assignment', 'postcode_polygon', 'district_or_vca', 'deliverability', 'building', 'current_rodrigues_assignment', 'current_agalega_assignment', 'outer_island_postcode_polygon', 'real_address', 'real_building', 'cadastral_title', 'owner_or_occupant']) assert.ok(prohibited.has(claim), claim);
});

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
    postcode_matches_phase1_shape: boolean;
    third_character_is_zero: boolean;
    synthetic_value_not_checked_against_live_nampost: boolean;
    collision_requires_replacement_before_promotion: boolean;
    coordinates_are_upstream_observations: boolean;
    identifiers_are_assignment_evidence: boolean;
  };
  fixtures: Array<{ fixture_id: string; expected: { must_not_assert: string[] } }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/na/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Namibia seed keeps Phase 1 delivery codes non-geographic and separates address, building, cadastre, privacy, hosting and AGID', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-na');
  assert.equal(manifest.repository.country_code, 'NA');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.canonical_postcode_format, 'NNNNN');
  assert.match(String(manifest.postal_system.third_character_rule), /third character.*zero.*Phase 1.*service-type/i);
  assert.match(String(manifest.postal_system.geometry_rule), /do not cover administrative or geographic.*default geometry is none.*Voronoi.*AGID.*never official/i);
  assert.match(String(manifest.postal_system.address_rule), /PO Box.*Private Bag.*rural six-digit delivery-point.*separate/i);
  assert.match(String(manifest.postal_system.building_rule), /rights-cleared civic address point.*explicit address-to-building.*insufficient/i);
  assert.match(String(manifest.postal_system.cadastre_rule), /parcels.*owners.*separate/i);
  assert.match(String(manifest.postal_system.privacy_rule), /Article 13.*Access to Information.*recipients.*query trails.*not public/i);
  assert.match(String(manifest.postal_system.realtime_rule), /bounded receipts.*terms version.*no unverified live fallback/i);
  assert.match(String(manifest.postal_system.hosting_rule), /Cloudflare.*Hugging Face.*rights-cleared.*controlled infrastructure/i);
  assert.match(String(manifest.postal_system.agid_rule), /independent spatial index.*not a NamPost code.*building/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.length >= 8);
});

test('Namibia source profile gates delivery observations, geography, cadastre, buildings, privacy, realtime hosting and ODbL independently', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('nampost-postal-codes')?.assignment_authority, 'official_postal_operator');
  assert.equal(sources.get('nampost-postal-codes')?.geometry_authority, 'none');
  assert.equal(sources.get('nampost-postal-codes')?.redistribution_class, 'R3_terms_unresolved');
  assert.equal(sources.get('nsa-namibia-geo-portal')?.geometry_authority, 'official_administrative_geometry');
  assert.equal(sources.get('mawlr-namibia-survey-mapping')?.redistribution_class, 'R5_private_restricted');
  assert.equal(sources.get('namibia-constitution-article-13')?.geometry_authority, 'none');
  assert.equal(sources.get('namibia-access-to-information-act-2022')?.geometry_authority, 'none');
  assert.equal(sources.get('namibia-data-protection-status-2026')?.geometry_authority, 'none');
  assert.equal(sources.get('osm-namibia')?.redistribution_class, 'R6_odbl_separate_partition');
  for (const id of ['postal-delivery-network-observations', 'administrative-context', 'cadastral-restricted', 'civic-address-and-building', 'derived-or-virtual-candidates', 'community-odbl', 'private-and-query', 'synthetic-conformance']) {
    assert.ok(profile.artifact_partitions.some(item => item.id === id), id);
  }
  assert.ok(profile.postal_assignment_promotion_gate.required.includes('current-nampost-observation'));
  assert.match(profile.postal_assignment_promotion_gate.failure_mode, /syntax-only-or-stale/i);
  assert.ok(profile.postal_geometry_promotion_gate.required.includes('future-nampost-phase-explicitly-defines-geographic-assignment'));
  assert.match(profile.postal_geometry_promotion_gate.failure_mode, /no-canonical-geometry/i);
  assert.ok(profile.building_resolution_gate.required.includes('explicit-address-building-relation'));
  assert.match(profile.building_resolution_gate.failure_mode, /without-exact-building/i);
  assert.ok(profile.public_hosting_gate.required.includes('non-personal-minimized-artifact'));
  assert.match(profile.public_hosting_gate.failure_mode, /cloudflare-and-hugging-face/i);
});

test('Namibia fixtures are synthetic and cannot promote delivery codes, polygons, admin/cadastral joins, addresses or buildings', () => {
  const pack = readJson<Fixtures>('fixtures/namibia-synthetic.json');
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'NA');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.postcode_value, '99099');
  assert.equal(pack.fixture_policy.postcode_matches_phase1_shape, true);
  assert.equal(pack.fixture_policy.third_character_is_zero, true);
  assert.equal(pack.fixture_policy.synthetic_value_not_checked_against_live_nampost, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.identifiers_are_assignment_evidence, false);
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('na-syn-')));
  for (const claim of ['phase1-code-is-postal-polygon', 'political-region-or-office-point-is-postal-catchment', 'postcode-proves-address', 'nearest-parcel-text-or-model-proves-building', 'admin-or-census-boundary-is-postal-polygon', 'parcel-is-postal-address-or-building', 'agid-is-nampost-code-cadastre-address-or-building', 'derived-surface-is-official-nampost-polygon']) {
    assert.ok(prohibited.has(claim), claim);
  }
});

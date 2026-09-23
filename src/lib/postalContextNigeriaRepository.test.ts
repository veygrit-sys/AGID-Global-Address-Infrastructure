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
  digital_code_promotion_gate: { effective_not_before: string; required: string[]; failure_mode: string };
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
    digital_postcode_value: string;
    district_or_delivery_value: string;
    civic_address_value: string;
    building_value: string;
    coordinates_are_upstream_observations: boolean;
    identifiers_are_assignment_evidence: boolean;
    synthetic_values_not_checked_against_live_nipost: boolean;
    future_code_is_intentionally_not_syntax_shaped: boolean;
    collision_requires_replacement_before_promotion: boolean;
  };
  fixtures: Array<{ fixture_id: string; expected: { must_not_assert: string[] } }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/ng/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Nigeria seed time-gates six-digit and eleven-character systems and separates geometry, address, building, cadastre, privacy and AGID', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-ng');
  assert.equal(manifest.repository.country_code, 'NG');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.release_scope.contains_live_eleven_character_assignments, false);
  assert.match(manifest.postal_system.canonical_postcode_format, /NNNNNN.*11_character.*effective_assignment/i);
  assert.match(manifest.postal_system.transition_rule, /2026-08-27.*2026-10-01.*not.*before.*effective/i);
  assert.match(manifest.postal_system.geometry_rule, /No verified reusable nationwide NIPOST.*ward.*EA.*derived review surface.*canonical geometry/i);
  assert.match(manifest.postal_system.address_rule, /2017.*UPU.*P\.O\. Box.*PMB.*not current public address rows/i);
  assert.match(manifest.postal_system.building_rule, /Before 2026-10-01.*cannot.*live.*explicit authoritative address-to-building/i);
  assert.match(manifest.postal_system.cadastre_rule, /FCT AGIS.*jurisdiction.*not.*national NIPOST/i);
  assert.match(manifest.postal_system.privacy_rule, /Data Protection Act 2023.*GAID 2025.*cross-border/i);
  assert.match(manifest.postal_system.hosting_rule, /Cloudflare.*Hugging Face.*non-personal.*controlled infrastructure/i);
  assert.match(manifest.postal_system.agid_rule, /AGID remains an independent.*does not become.*NIPOST.*building/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.length >= 8);
});

test('Nigeria source profile independently gates current assignments, future launch, census/admin, cadastre, buildings, privacy and ODbL', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('nipost-postcode')?.assignment_authority, 'official_numeric_postal_reference_observation');
  assert.equal(sources.get('nipost-postcode')?.redistribution_class, 'R4_validation_only');
  assert.equal(sources.get('nipost-national-digital-postcode-2026')?.redistribution_class, 'R3_terms_unresolved');
  assert.equal(sources.get('nipost-addressing-standard-2017')?.geometry_authority, 'none');
  assert.equal(sources.get('npc-nigeria-ead-2023')?.redistribution_class, 'R5_private_restricted');
  assert.equal(sources.get('fcta-nigeria-agis')?.redistribution_class, 'R5_private_restricted');
  assert.equal(sources.get('osm-nigeria')?.redistribution_class, 'R6_odbl_separate_partition');
  for (const id of ['current-numeric-postcode-assignment', 'future-digital-postcode-assignment', 'administrative-and-census-context', 'official-postal-surface', 'derived-postal-review-surface', 'civic-address-components', 'jurisdictional-cadastral-context', 'address-linked-building', 'agid-crosswalk', 'community-odbl', 'private-and-restricted']) {
    assert.ok(profile.artifact_partitions.some(item => item.id === id), id);
  }
  assert.ok(profile.administrative_geometry_promotion_gate.required.includes('dataset-specific-contract-and-redistribution-licence'));
  assert.match(profile.administrative_geometry_promotion_gate.failure_mode, /no-canonical-geometry/i);
  assert.match(profile.digital_code_promotion_gate.effective_not_before, /^2026-10-01/);
  assert.ok(profile.digital_code_promotion_gate.required.includes('current-official-eleven-character-assignment-response'));
  assert.match(profile.digital_code_promotion_gate.failure_mode, /prelaunch-or-unverified/i);
  assert.ok(profile.building_resolution_gate.required.includes('explicit-address-building-relation'));
  assert.match(profile.building_resolution_gate.failure_mode, /without-exact-building/i);
});

test('Nigeria fixtures are synthetic and cannot promote assignments, future codes, polygons, census/cadastral links, addresses or buildings', () => {
  const pack = readJson<Fixtures>('fixtures/nigeria-synthetic.json');
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'NG');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.postcode_value, '999996');
  assert.match(pack.fixture_policy.digital_postcode_value, /^NG-SYN-/);
  assert.match(pack.fixture_policy.district_or_delivery_value, /^NG-SYN-/);
  assert.match(pack.fixture_policy.civic_address_value, /^NG-SYN-/);
  assert.match(pack.fixture_policy.building_value, /^NG-SYN-/);
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.identifiers_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.synthetic_values_not_checked_against_live_nipost, true);
  assert.equal(pack.fixture_policy.future_code_is_intentionally_not_syntax_shaped, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('ng-syn-')));
  for (const claim of ['six-digit-text-is-exclusive-postal-area', 'future-code-is-live-before-launch', 'synthetic-derived-surface-is-official-nipost-postcode-polygon', 'state-lga-ward-ea-or-district-is-postcode-polygon', 'postcode-admin-census-parcel-address-text-containment-nearest-footprint-or-model-is-address-building-link', 'agid-is-nipost-code-cadastre-address-or-building']) {
    assert.ok(prohibited.has(claim), claim);
  }
});

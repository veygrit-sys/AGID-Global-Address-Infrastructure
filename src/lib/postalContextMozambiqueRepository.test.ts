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
  postal_assignment_promotion_gate: { required: string[]; failure_mode: string };
  postal_geometry_promotion_gate: { required: string[]; failure_mode: string };
  building_resolution_gate: { required: string[]; failure_mode: string };
  public_hosting_gate: { required: string[]; failure_mode: string };
};
type Fixtures = {
  country_code: string;
  synthetic: boolean;
  promotion_eligible: boolean;
  fixture_policy: Record<string, boolean | string>;
  fixtures: Array<{ expected: { must_not_assert: string[] } }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/mz/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Mozambique seed separates current CEP, migration, operators, geometry, administration, buildings, land, privacy, hosting and AGID', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-mz');
  assert.equal(manifest.repository.country_code, 'MZ');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_upstream_rows, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.canonical_postcode_format, 'NNNNN-NNN');
  assert.match(manifest.postal_system.current_rule, /74\/2024.*eight digits.*five and three.*territorial.*urban.*capital/i);
  assert.match(manifest.postal_system.migration_rule, /revokes.*28\/2019.*six-digit.*four-digit.*legacy.*never.*padded.*truncated/i);
  assert.match(manifest.postal_system.authority_rule, /INCM.*regulator.*1\/2016.*Correios.*extinguished.*32\/2021.*CORRE.*universal.*2024.*separate/i);
  assert.match(manifest.postal_system.assignment_rule, /digest-pinned.*74\/2024.*INCM.*code.*unit.*variant.*edition.*valid-time.*insufficient/i);
  assert.match(manifest.postal_system.geometry_rule, /no canonical boundary coordinates.*default geometry.*none.*official-derived.*administrative map.*AGID.*never.*official/i);
  assert.match(manifest.postal_system.address_rule, /Street.*house number.*entrance.*unit.*separate.*2019-2022.*not.*current.*national/i);
  assert.match(manifest.postal_system.building_rule, /rights-cleared civic address point.*explicit address-to-building.*insufficient/i);
  assert.match(manifest.postal_system.land_rule, /land.*Terra Segura.*parcel.*DUAT.*neither postcode.*restricted/i);
  assert.match(manifest.postal_system.privacy_rule, /2026.*bill.*legislative.*constitutional.*exclude.*recipients.*query/i);
  assert.match(manifest.postal_system.hosting_rule, /Cloudflare.*Hugging Face.*rights-cleared.*non-personal.*controlled/i);
  assert.match(manifest.postal_system.agid_rule, /independent spatial index.*not an INCM.*building/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.length >= 10);
});

test('Mozambique source profile gates current law, operator transition, legacy systems, administration, land, privacy and ODbL independently', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('incm-mozambique-cep-2024')?.assignment_authority ?? '', /authoritative_current/i);
  assert.match(sources.get('incm-mozambique-cep-2024')?.geometry_authority ?? '', /none.*without.boundary/i);
  assert.match(sources.get('incm-mozambique-corre-universal-2024')?.assignment_authority ?? '', /none_without-exact/i);
  assert.match(sources.get('correios-mocambique-codigos-postais')?.assignment_authority ?? '', /legacy_only.*not-current/i);
  assert.match(sources.get('incm-mozambique-cep-rollout-2019-2022')?.assignment_authority ?? '', /legacy_six_digit.*pilot/i);
  assert.match(sources.get('ine-mozambique-admin-cartography')?.geometry_authority ?? '', /admin.*not-postal/i);
  assert.equal(sources.get('fnds-mozambique-land-cadastre')?.redistribution_class, 'R5_private_restricted');
  assert.match(sources.get('intic-mozambique-data-protection-status-2026')?.assignment_authority ?? '', /none/);
  assert.equal(sources.get('osm-mozambique')?.redistribution_class, 'R6_odbl_separate_partition');
  for (const id of ['current-eight-digit-assignments', 'legacy-four-digit-directory', 'legacy-six-digit-cep-and-pilots', 'operator-and-facility-context', 'versioned-admin-context', 'civic-address-and-building', 'land-and-personal-restricted', 'derived-or-virtual-candidates', 'community-odbl', 'synthetic-conformance']) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === id), id);
  assert.match(profile.postal_assignment_promotion_gate.failure_mode, /legacy-four-or-six-digit.*operator-address.*rollout-report.*unpinned-table/i);
  assert.match(profile.postal_geometry_promotion_gate.failure_mode, /no-canonical-geometry/i);
  assert.match(profile.building_resolution_gate.failure_mode, /stop-at-locality-or-bairro/i);
  assert.match(profile.public_hosting_gate.failure_mode, /cloudflare.*hugging-face/i);
});

test('Mozambique fixtures are synthetic and cannot promote current assignments, migration, polygons, addresses or buildings', () => {
  const fixtures = readJson<Fixtures>('fixtures/mozambique-synthetic.json');
  assert.equal(fixtures.country_code, 'MZ');
  assert.equal(fixtures.synthetic, true);
  assert.equal(fixtures.promotion_eligible, false);
  assert.equal(fixtures.fixture_policy.contains_real_addresses, false);
  assert.equal(fixtures.fixture_policy.contains_upstream_rows, false);
  assert.equal(fixtures.fixture_policy.contains_personal_data, false);
  assert.equal(fixtures.fixture_policy.current_cep_value, '99999-999');
  assert.equal(fixtures.fixture_policy.legacy_four_digit_value, '9999');
  assert.equal(fixtures.fixture_policy.legacy_six_digit_value, '9999-99');
  assert.equal(fixtures.fixture_policy.values_are_assignment_evidence, false);
  assert.equal(fixtures.fixture_policy.collision_requires_replacement_before_promotion, true);
  const prohibited = new Set(fixtures.fixtures.flatMap(fixture => fixture.expected.must_not_assert));
  for (const claim of ['current_incm_assignment', 'official_postcode_polygon', 'deliverability', 'automatic_migration', 'real_address', 'real_building', 'owner_or_occupant', 'land_right']) assert.ok(prohibited.has(claim), claim);
});

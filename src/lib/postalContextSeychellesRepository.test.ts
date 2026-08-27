import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>; artifact_partitions: Array<{ id: string }> };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; authoritative_postcode_value: null; rejected_placeholder_value: string; national_address_value: string; po_box_value: string; parcel_value: string; building_value: string; coordinates_are_upstream_observations: boolean; identifiers_are_assignment_evidence: boolean; synthetic_values_not_checked_against_live_registry: boolean; collision_requires_replacement_before_promotion: boolean }; fixtures: Array<{ fixture_id: string; expected: { must_not_assert: string[] } }> };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/sc/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Seychelles seed models no current postcode, NAS transition, P.O. Box, building, cadastre, privacy and AGID separately', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-sc');
  assert.equal(manifest.repository.country_code, 'SC');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.canonical_postcode_format, 'none_currently_assigned_0000_placeholder_invalid_nas_postcode_structure_pending');
  assert.match(manifest.postal_system.postcode_rule, /coming soon.*four zero.*placeholder.*not accepted.*future postcode.*authoritative.*release/i);
  assert.match(manifest.postal_system.identifier_split_rule, /P\.O\. Box.*National Address.*parcel.*building.*future postcode.*AGID.*separate/i);
  assert.match(manifest.postal_system.geometry_rule, /no canonical current.*postcode polygon.*enumeration area.*WebGIS.*AGID.*not official/i);
  assert.match(manifest.postal_system.building_rule, /authoritative National Address-to-building.*P\.O\. Box.*2018 import.*candidate context only/i);
  assert.match(manifest.postal_system.cadastre_rule, /informational.*licensed surveys.*Parcel identifiers.*ownership.*separate/i);
  assert.match(manifest.postal_system.privacy_rule, /Data Protection Act 2023.*privacy by design.*cross-border/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
});

test('Seychelles source profile separates transition, operator, statistics, WebGIS, cadastre, privacy and ODbL evidence', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('seychelles-postal-regulator-nas')?.assignment_authority, 'official_transition_status_only');
  assert.equal(sources.get('seychelles-statehouse-nas-bill-2026')?.assignment_authority, 'official_no_postcode_and_bill_status_only');
  assert.equal(sources.get('seychelles-postal-regulator-operators')?.redistribution_class, 'R4_validation_only');
  assert.match(sources.get('seychelles-nbs-gis')?.geometry_authority ?? '', /statistical_geometry_artifact_specific/i);
  assert.match(sources.get('seychelles-lands-webgis')?.geometry_authority ?? '', /cadastral_geometry_artifact_specific/i);
  assert.equal(sources.get('seychelles-data-protection-act-2023')?.assignment_authority, 'privacy_governance_only');
  assert.equal(sources.get('osm-seychelles')?.redistribution_class, 'R2_odbl_separate_partition');
  assert.equal(sources.get('osm-seychelles-building-import')?.redistribution_class, 'R2_odbl_separate_partition');
  for (const id of ['no-current-postcode-state', 'nas-transition', 'po-box-and-recipient', 'national-address', 'cadastre-and-title', 'address-linked-building', 'official-postal-surface', 'agid-and-virtual-fallback', 'community-odbl', 'private-and-restricted']) assert.ok(profile.artifact_partitions.some(item => item.id === id));
});

test('Seychelles fixtures are synthetic and cannot promote 0000, NAS, P.O. Box, parcel or building claims', () => {
  const pack = readJson<Fixtures>('fixtures/seychelles-synthetic.json');
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'SC');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.authoritative_postcode_value, null);
  assert.equal(pack.fixture_policy.rejected_placeholder_value, '0000');
  assert.match(pack.fixture_policy.national_address_value, /^SC-SYN-/);
  assert.match(pack.fixture_policy.po_box_value, /^SC-SYN-/);
  assert.match(pack.fixture_policy.parcel_value, /^SC-SYN-/);
  assert.match(pack.fixture_policy.building_value, /^SC-SYN-/);
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.identifiers_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.synthetic_values_not_checked_against_live_registry, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('sc-syn-')));
  for (const claim of ['0000-is-authoritative-postcode', 'po-box-is-postcode-or-residence', 'national-address-is-postcode', 'parcel-or-footprint-is-national-address-link']) assert.ok(prohibited.has(claim));
});

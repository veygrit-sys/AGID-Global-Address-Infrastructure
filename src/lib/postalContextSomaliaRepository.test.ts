import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>; artifact_partitions: Array<{ id: string }> };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; observed_structure: string; synthetic_postcode_value: string; po_box_value: string; civic_address_value: string; building_value: string; nira_value: null; coordinates_are_upstream_observations: boolean; identifiers_are_assignment_evidence: boolean; synthetic_values_not_checked_against_live_registry: boolean; collision_requires_replacement_before_promotion: boolean }; fixtures: Array<{ fixture_id: string; expected: { must_not_assert: string[] } }> };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/so/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Somalia seed separates observed syntax, service revival, P.O. Box, jurisdiction, building, privacy and AGID', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-so');
  assert.equal(manifest.repository.country_code, 'SO');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.canonical_postcode_format, 'AA_NNNNN_observed_shape_only_optional_non_universal');
  assert.match(manifest.postal_system.postcode_rule, /BN03010.*observed structure.*does not prove.*assigned.*geographic/i);
  assert.match(manifest.postal_system.service_rule, /resumed in May 2025.*policy.*January 2026.*not a postcode registry.*polygon/i);
  assert.match(manifest.postal_system.identifier_split_rule, /P\.O\. Box.*postcode.*NIRA identity number.*AGID.*separate/i);
  assert.match(manifest.postal_system.geometry_rule, /No public authoritative.*postcode.*geometry.*AGID cell.*not official/i);
  assert.match(manifest.postal_system.building_rule, /explicit rights-cleared authoritative civic-address-to-building.*postcode.*candidate context only/i);
  assert.match(manifest.postal_system.jurisdiction_rule, /federal.*member-state.*territorial scope.*does not silently merge/i);
  assert.match(manifest.postal_system.hosting_rule, /Cloudflare.*Hugging Face.*rights-cleared non-personal.*Identity.*controlled/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
});

test('Somalia source profile separates postal operations, one code observation, GIS, identity and ODbL evidence', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('somalia-moct-postal-revival-2025')?.assignment_authority, 'official_service_resumption_only');
  assert.equal(sources.get('somalia-national-postal-policy-2026')?.assignment_authority, 'official_policy_approval_only');
  assert.equal(sources.get('somalia-sobs-address-observation')?.redistribution_class, 'R4_validation_only');
  assert.match(sources.get('somalia-snbs-gis')?.geometry_authority ?? '', /statistical_geometry_artifact_specific/i);
  assert.equal(sources.get('somalia-nira-principles')?.assignment_authority, 'identity_governance_only');
  assert.equal(sources.get('somalia-nca-privacy')?.assignment_authority, 'privacy_notice_only');
  assert.equal(sources.get('osm-somalia')?.redistribution_class, 'R2_odbl_separate_partition');
  for (const id of ['service-and-policy-status', 'observed-postcode-structure', 'po-box-and-recipient', 'jurisdiction-and-administration', 'civic-address', 'address-linked-building', 'official-postal-surface', 'agid-and-virtual-fallback', 'community-odbl', 'private-and-restricted']) assert.ok(profile.artifact_partitions.some(item => item.id === id));
});

test('Somalia fixtures are synthetic and cannot promote code, P.O. Box, identity or building claims', () => {
  const pack = readJson<Fixtures>('fixtures/somalia-synthetic.json');
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'SO');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.observed_structure, 'AA NNNNN');
  assert.equal(pack.fixture_policy.synthetic_postcode_value, 'BN 99999');
  assert.match(pack.fixture_policy.po_box_value, /^SO-SYN-/);
  assert.match(pack.fixture_policy.civic_address_value, /^SO-SYN-/);
  assert.match(pack.fixture_policy.building_value, /^SO-SYN-/);
  assert.equal(pack.fixture_policy.nira_value, null);
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.identifiers_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.synthetic_values_not_checked_against_live_registry, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('so-syn-')));
  for (const claim of ['synthetic-code-is-live-assignment', 'po-box-is-postcode-or-residence', 'nira-number-is-postcode-address-or-building', 'postcode-po-box-nearest-footprint-or-overlap-is-address-building-link']) assert.ok(prohibited.has(claim));
});

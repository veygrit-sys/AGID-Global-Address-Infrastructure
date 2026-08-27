import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postcode_value: string; po_box_value: string; civic_address_value: string; nicad_value: string; coordinates_are_upstream_observations: boolean; identifiers_are_assignment_evidence: boolean; synthetic_values_not_checked_against_live_operator: boolean; collision_requires_replacement_before_promotion: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string }; expected: { must_not_assert: string[] } }> };
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/sn/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Senegal seed separates five-digit evidence, BP, delivery office, geometry, civic address, NICAD, buildings and privacy', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-sn');
  assert.equal(manifest.repository.country_code, 'SN');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.canonical_postcode_format, 'NNNNN_before_delivery_office');
  assert.match(manifest.postal_system.postcode_rule, /current La Poste.*five-digit.*UPU.*current assignment.*permitted successful operator observation/i);
  assert.match(manifest.postal_system.identifier_split_rule, /BP.*five-digit postcode.*delivery post office.*NICAD.*building identifier.*AGID.*separate/i);
  assert.match(manifest.postal_system.geometry_rule, /No rights-cleared nationwide.*post-office.*routing digits.*BaseGeo.*NICAD.*not official postcode polygons.*derived non-canonical/i);
  assert.match(manifest.postal_system.building_rule, /rights-cleared.*explicit authoritative civic-address-to-building.*NICAD-parcel-to-building.*candidate context only/i);
  assert.match(manifest.postal_system.licence_rule, /BaseGeo.*ANAT attribution.*commercial-derived-product approval.*annual.*deletion/i);
  assert.match(manifest.postal_system.privacy_rule, /Law No. 2008-12.*identifying personal data.*third-country transfers/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
});

test('Senegal source profile keeps postal, BP, regulation, licensed geodata, NICAD, privacy and ODbL evidence separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('la-poste-senegal-codes')?.assignment_authority, 'official_postal_operator_observation');
  assert.equal(sources.get('la-poste-senegal-po-box')?.redistribution_class, 'R5_private_restricted');
  assert.equal(sources.get('upu-senegal-addressing-2015')?.assignment_authority, 'dated_postal_system_semantics_only');
  assert.match(sources.get('geosenegal-basegeo')?.geometry_authority ?? '', /dataset_specific/i);
  assert.equal(sources.get('geosenegal-urban-buildings-2019')?.geometry_authority, 'official_building_geometry_dataset_specific');
  assert.equal(sources.get('dgid-senegal-nicad')?.redistribution_class, 'R5_private_restricted');
  assert.equal(sources.get('osm-senegal')?.redistribution_class, 'R2_odbl_separate_partition');
  for (const id of ['typed-five-digit-observation', 'po-box-and-subscriber', 'official-postal-surface', 'derived-postal-review-surface', 'administrative-and-toponymic-context', 'civic-address', 'nicad-cadastre', 'licensed-building', 'community-odbl', 'private-and-restricted']) assert.ok(profile.artifact_partitions.some(item => item.id === id));
});

test('Senegal fixtures are synthetic and cannot promote codes, BP, civic addresses, NICAD or buildings', () => {
  const pack = readJson<Fixtures>('fixtures/senegal-synthetic.json');
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'SN');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.postcode_value, '09997');
  assert.match(pack.fixture_policy.po_box_value, /^SN-SYN-/);
  assert.match(pack.fixture_policy.civic_address_value, /^SN-CIVIC-ADDRESS-SYN-/);
  assert.match(pack.fixture_policy.nicad_value, /^SN-SYN-NICAD-/);
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.identifiers_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.synthetic_values_not_checked_against_live_operator, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('sn-syn-')));
  for (const claim of ['five-digit-text-is-official-postcode-polygon', 'bp-is-postcode', 'derived-surface-is-official-senegal-postcode-polygon', 'postcode-bp-civic-or-nicad-syntax-identifies-exact-building']) assert.ok(prohibited.has(claim));
});

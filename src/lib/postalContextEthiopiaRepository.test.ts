import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean; prohibited_claims: string[] }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postal_value: string; coordinates_are_upstream_observations: boolean; postcodes_are_assignment_evidence: boolean; synthetic_values_not_checked_against_live_operator: boolean; collision_requires_replacement_before_promotion: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string }; expected: { must_not_assert: string[] } }> };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/et/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Ethiopia seed separates postal objects, derived surfaces, eDAS addresses, buildings, licensing, and privacy', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-et');
  assert.equal(manifest.repository.country_code, 'ET');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.full_code_format, 'NNNN');
  assert.match(manifest.postal_system.assignment_rule, /Ethiopost.*branch.*UPU.*four-digit.*current assignment.*pinned/i);
  assert.match(manifest.postal_system.historical_semantics_rule, /July 2002.*region.*central[- ]office.*delivery[- ]office.*historical.*not.*current.*polygon/i);
  assert.match(manifest.postal_system.geometry_rule, /No rights-cleared nationwide.*office.*region.*eDAS.*not.*official postal polygons.*derived non-canonical/i);
  assert.match(manifest.postal_system.address_rule, /Ethiopost.*sub-city.*woreda.*house number.*eDAS.*reusable address row/i);
  assert.match(manifest.postal_system.building_rule, /eDAS.*rights-cleared.*stable explicit.*address-to-building.*candidates only/i);
  assert.match(manifest.postal_system.licence_rule, /website.*UPU.*NSDI.*exact terms.*ODbL/i);
  assert.match(manifest.postal_system.hosting_rule, /Cloudflare.*Hugging Face.*rights-cleared.*pin.*digests.*Restricted/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  for (const blocker of ['branch-office-point-or-four-digit-syntax-presented-as-postal-polygon', 'region-zone-woreda-kebele-or-edas-area-presented-as-official-postal-polygon', 'postcode-address-text-coordinate-containment-overlap-or-proximity-presented-as-exact-building-link', 'timeout-empty-or-blocked-response-treated-as-no-assignment']) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('Ethiopia source profile keeps operator, dated UPU, eDAS, NSDI, land-registration, and community evidence separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('ethiopost-branches')?.assignment_authority, 'official_postal_branch_observation');
  assert.equal(sources.get('ethiopost-branches')?.geometry_authority, 'branch_point_only_when_explicitly_published');
  assert.equal(sources.get('upu-ethiopia-addressing-2002')?.assignment_authority, 'dated_postal_system_semantics_only');
  assert.match(sources.get('ethiopia-ssgi-edas')?.geometry_authority ?? '', /none_until_exact_rights_cleared/i);
  assert.match(sources.get('ethiopia-nsdi-geoportal')?.geometry_authority ?? '', /dataset_specific_only/i);
  assert.equal(sources.get('ethiopia-addis-land-registration-edas')?.assignment_authority, 'none_institutional_context_only');
  assert.equal(sources.get('osm-ethiopia')?.redistribution_class, 'R2_odbl_separate_partition');
  for (const partition of ['typed-four-digit-postal-object', 'official-postal-surface', 'derived-postal-review-surface', 'administrative-context', 'edas-address-and-building', 'official-geospatial-context', 'community-odbl', 'private-and-restricted']) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('Ethiopia fixtures use a synthetic four-digit string and no upstream rows', () => {
  const pack = readJson<Fixtures>('fixtures/ethiopia-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'ET');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.synthetic_values_not_checked_against_live_operator, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.equal(pack.fixture_policy.postal_value, '0999');
  assert.ok(postcodes.every(code => /^\d{4}$/.test(code)));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('et-syn-')));
  for (const claim of ['four-digit-object-is-official-polygon', 'derived-surface-is-official-ethiopian-postal-polygon', 'postcode-identifies-exact-building', 'recipient-owner-title-or-query-data']) assert.ok(prohibited.has(claim));
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postcode_value: string; po_box_value: string; private_bag_value: string; postnet_value: string; national_address_value: string; coordinates_are_upstream_observations: boolean; identifiers_are_assignment_evidence: boolean; synthetic_values_not_checked_against_live_operator: boolean; collision_requires_replacement_before_promotion: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string }; expected: { must_not_assert: string[] } }> };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/zm/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Zambia seed separates five-digit evidence, holder objects, national addresses, geometry, parcels, buildings and privacy', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-zm');
  assert.equal(manifest.repository.country_code, 'ZM');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.canonical_postcode_format, 'NNNNN_reference');
  assert.match(manifest.postal_system.postcode_rule, /UPU.*five-digit.*10101.*proposal.*ZICTA.*project.*current assignment.*pinned/i);
  assert.match(manifest.postal_system.identifier_split_rule, /P.O. Box.*private bag.*Postnet.*poste restante.*national.*ZILAS.*ZNSDI.*AGID.*separate/i);
  assert.match(manifest.postal_system.geometry_rule, /No rights-cleared nationwide.*post-office.*routing.*ZNSDI.*parcels.*not official postcode polygons.*derived non-canonical/i);
  assert.match(manifest.postal_system.building_rule, /rights-cleared.*explicit operational national-address-to-building.*cadastral.*candidate context only/i);
  assert.match(manifest.postal_system.privacy_rule, /Data Protection Act.*location data.*personal data.*cross-border/i);
  assert.match(manifest.postal_system.hosting_rule, /Cloudflare.*Hugging Face.*non-personal.*Zambia-hosted.*cross-border/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  for (const blocker of ['po-box-private-bag-postnet-poste-restante-national-address-plot-id-or-agid-conflated-with-postcode', 'post-office-point-routing-digit-administration-pilot-area-parcel-buffer-voronoi-route-or-model-presented-as-official-postcode-polygon', 'postcode-box-bag-address-text-parcel-containment-overlap-proximity-or-model-presented-as-exact-building-link']) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('Zambia source profile keeps postal, project, spatial, land, privacy and community evidence separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('zampost')?.assignment_authority, 'official_postal_operator_observation');
  assert.equal(sources.get('upu-zambia-addressing-2013')?.assignment_authority, 'dated_postal_system_semantics_only');
  assert.equal(sources.get('zicta-zambia-national-addressing-postcode')?.assignment_authority, 'national_addressing_project_context_only');
  assert.equal(sources.get('zambia-parliament-addressing-statement-2013')?.assignment_authority, 'dated_government_status_only');
  assert.match(sources.get('znsdi-zambia-policy-2026')?.geometry_authority ?? '', /dataset_specific/i);
  assert.equal(sources.get('znsdi-zambia-cadastre-lots')?.geometry_authority, 'official_parcel_geometry_dataset_specific');
  assert.equal(sources.get('zilas-zambia')?.redistribution_class, 'R5_private_restricted');
  assert.equal(sources.get('osm-zambia')?.redistribution_class, 'R2_odbl_separate_partition');
  for (const partition of ['typed-five-digit-observation', 'po-box-private-bag-and-agency', 'official-postal-surface', 'derived-postal-review-surface', 'administrative-and-toponymic-context', 'national-and-civic-address', 'cadastre-and-building', 'community-odbl', 'private-and-restricted']) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('Zambia fixtures are synthetic and cannot promote codes, holders, national addresses or buildings', () => {
  const pack = readJson<Fixtures>('fixtures/zambia-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'ZM');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.identifiers_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.synthetic_values_not_checked_against_live_operator, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.equal(pack.fixture_policy.postcode_value, '09998');
  assert.match(pack.fixture_policy.po_box_value, /^ZM-SYN-/);
  assert.match(pack.fixture_policy.private_bag_value, /^ZM-SYN-/);
  assert.match(pack.fixture_policy.postnet_value, /^ZM-SYN-/);
  assert.match(pack.fixture_policy.national_address_value, /^ZM-NATIONAL-ADDRESS-SYN-/);
  assert.ok(postcodes.every(code => /^\d{5}$/.test(code)));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('zm-syn-')));
  for (const claim of ['five-digit-text-is-official-postcode-polygon', 'box-bag-or-agency-is-postcode', 'derived-surface-is-official-zambia-postcode-polygon', 'postcode-box-bag-or-national-address-syntax-identifies-exact-building']) assert.ok(prohibited.has(claim));
});

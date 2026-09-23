import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postal_prefix: string; coordinates_are_geographic: boolean; postcodes_are_assignment_evidence: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string; assignment_class?: string }; expected: { must_not_assert: string[] } }> };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/pk/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Pakistan seed separates typed office assignment, geometry, census context, mapping law, buildings, and privacy', () => {
  const value = readJson<Manifest>('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-pk');
  assert.equal(value.repository.country_code, 'PK');
  assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, true);
  assert.equal(value.release_scope.contains_raw_source_data, false);
  assert.equal(value.release_scope.contains_real_addresses, false);
  assert.equal(value.release_scope.contains_personal_data, false);
  assert.equal(value.release_scope.contains_production_geometry, false);
  assert.equal(value.postal_system.current_code_format, 'NNNNN');
  assert.match(value.postal_system.legal_rule, /UPU.*five digits.*first two.*routing district.*last three.*delivery post office.*Pakistan Post.*not.*polygon/i);
  assert.match(value.postal_system.assignment_rule, /Delivery post office.*non-delivery.*account office.*branch.*five-character.*leading zeroes.*not.*postal area/i);
  assert.match(value.postal_system.geometry_rule, /No reviewed.*canonical national.*polygon.*Survey of Pakistan.*generated.*derived.*never.*official/i);
  assert.match(value.postal_system.administration_rule, /PBS.*census blocks.*workload units.*not postal/i);
  assert.match(value.postal_system.building_rule, /civic-address.*building geometry.*stable relation.*candidates only/i);
  assert.match(value.postal_system.licence_rule, /Survey of Pakistan.*registration.*base-map.*vetting.*licensing.*not.*redistribution/i);
  assert.match(value.postal_system.privacy_rule, /Recipients.*box holders.*tracking.*owners.*occupants.*identifiers.*excluded/i);
  assert.equal(value.promotion.current_stage, 'M1_metadata');
  for (const blocker of ['directory-or-amendment-row-presented-as-official-postcode-polygon', 'pbs-census-block-or-administrative-boundary-presented-as-postal-area', 'applicable-mapping-registration-vetting-licence-or-official-base-map-requirement-omitted']) assert.ok(value.promotion.hard_blockers.includes(blocker));
});

test('Pakistan source profile keeps postal, legal, mapping-product, NSDI, and census authorities separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('pakistan-post-postcode-directory')?.assignment_authority ?? '', /official_postal_office_assignment/i);
  assert.equal(sources.get('pakistan-post-postcode-directory')?.geometry_authority, 'none');
  assert.equal(sources.get('upu-pakistan-addressing')?.geometry_authority, 'none');
  assert.match(sources.get('pakistan-post-postcode-amendments')?.assignment_authority ?? '', /official_incremental/i);
  assert.match(sources.get('survey-of-pakistan-mapping-law')?.geometry_authority ?? '', /none_legal_governance/i);
  assert.equal(sources.get('survey-of-pakistan-geospatial-products')?.redistribution_class, 'R3_controlled_approval_or_contract');
  assert.match(sources.get('pakistan-nsdi')?.geometry_authority ?? '', /catalog_or_viewer.*exact_permitted_layer/i);
  assert.match(sources.get('pakistan-pbs-census-gis')?.geometry_authority ?? '', /census_or_administrative.*not_postal_or_building/i);
  for (const partition of ['official-postcode-office-assignments', 'non-delivery-routing-evidence', 'official-postal-surface', 'derived-postal-surface', 'civic-address-and-building', 'administrative-and-census-context', 'territory-and-private-restricted']) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('Pakistan fixtures preserve synthetic leading-zero strings and non-delivery evidence', () => {
  const pack = readJson<Fixtures>('fixtures/pakistan-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'PK');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '00000');
  assert.ok(postcodes.every(postcode => /^\d{5}$/.test(postcode)));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('pk-syn-')));
  assert.ok(pack.fixtures.some(item => item.synthetic_address.assignment_class === 'non_delivery_post_office'));
  for (const claim of ['directory-row-is-official-postal-boundary', 'non-delivery-office-is-home-or-catchment', 'pbs-census-block-is-postal-boundary', 'containment-or-proximity-is-exact-building-link', 'map-or-model-output-is-automatically-licensed']) assert.ok(prohibited.has(claim));
});

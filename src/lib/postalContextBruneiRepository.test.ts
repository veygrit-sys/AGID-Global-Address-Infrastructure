import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postal_prefix: string; coordinates_are_geographic: boolean; postcodes_are_assignment_evidence: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string; assignment_class?: string }; expected: { must_not_assert: string[] } }> };
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/bn/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Brunei seed separates routing, geometry, house numbering, mapping, census, land, and privacy', () => {
  const value = readJson<Manifest>('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-bn'); assert.equal(value.repository.country_code, 'BN'); assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, true); assert.equal(value.release_scope.contains_raw_source_data, false); assert.equal(value.release_scope.contains_real_addresses, false); assert.equal(value.release_scope.contains_personal_data, false); assert.equal(value.release_scope.contains_production_geometry, false);
  assert.equal(value.postal_system.current_code_format, 'AANNNN');
  assert.match(value.postal_system.legal_rule, /UPU.*six alphanumeric.*district.*Mukim.*village.*delivery-point.*Postal Services.*Kampong.*not canonical polygons.*building/i);
  assert.match(value.postal_system.assignment_rule, /uppercase six-character text.*B, K, P or T.*booklet row.*retrieval time.*not create a postal area.*delivery/i);
  assert.match(value.postal_system.geometry_rule, /No reviewed.*canonical national.*polygon.*derived.*Survey.*Geoportal.*DEPS.*Land Department.*never become official/i);
  assert.match(value.postal_system.building_rule, /Survey Department house-numbering.*civic-address.*building geometry.*stable relation.*topographic buildings.*Geoportal lots.*candidates.*never establish/i);
  assert.match(value.postal_system.licence_rule, /Postal Services.*UPU.*reference.*Survey digital maps.*paid.*Geoportal.*restriction-of-use.*House Numbering.*identity.*Census.*land records.*never grants blanket/i);
  assert.match(value.postal_system.privacy_rule, /Addressees.*box holders.*applicants.*identity-card.*site plans.*titles.*owners.*occupiers.*mortgages.*households.*census microdata.*excluded/i);
  assert.equal(value.promotion.current_stage, 'M1_metadata');
  for (const blocker of ['postcode-booklet-row-upu-prefix-or-post-office-point-presented-as-official-postcode-polygon', 'district-mukim-kampong-lot-or-enumeration-area-presented-as-postal-area', 'survey-map-building-geoportal-lot-land-title-or-census-housing-unit-presented-as-civic-address-link', 'house-numbering-applicant-identity-title-tol-site-plan-owner-occupier-or-transaction-data-published']) assert.ok(value.promotion.hard_blockers.includes(blocker));
});

test('Brunei source profile keeps postal, address, map, portal, statistical, land, and rights authorities separate', () => {
  const profile = readJson<Profile>('source-profile.json'); const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed'); assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('brunei-post-postcode-booklet')?.assignment_authority ?? '', /official_postal_routing_assignment/i); assert.equal(sources.get('brunei-post-postcode-booklet')?.geometry_authority, 'none'); assert.equal(sources.get('upu-brunei-addressing')?.geometry_authority, 'none');
  assert.match(sources.get('brunei-survey-house-numbering')?.assignment_authority ?? '', /civic_address_authority.*authorized_result/i); assert.equal(sources.get('brunei-survey-house-numbering')?.redistribution_class, 'R3_controlled_approval_or_contract'); assert.match(sources.get('brunei-survey-digital-map-products')?.geometry_authority ?? '', /official_map_geometry.*exact_permitted_product_layer/i); assert.equal(sources.get('brunei-survey-geoportal')?.redistribution_class, 'R3_controlled_approval_or_contract'); assert.equal(sources.get('brunei-survey-geoportal-user-guide')?.geometry_authority, 'none'); assert.equal(sources.get('brunei-deps-bpp-2021')?.redistribution_class, 'R4_validation_only'); assert.equal(sources.get('brunei-land-registration-framework')?.redistribution_class, 'R4_validation_only');
  for (const partition of ['official-postcode-routing-assignments', 'official-postal-surface', 'derived-delivery-surface', 'civic-address-and-building', 'administrative-topographic-and-portal-context', 'statistical-land-title-and-private-restricted', 'territory-and-private-restricted']) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('Brunei fixtures keep synthetic postcodes and non-postal evidence non-authoritative', () => {
  const pack = readJson<Fixtures>('fixtures/brunei-synthetic.json'); const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value)); const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'BN'); assert.equal(pack.synthetic, true); assert.equal(pack.promotion_eligible, false); assert.equal(pack.fixture_policy.contains_real_addresses, false); assert.equal(pack.fixture_policy.contains_upstream_rows, false); assert.equal(pack.fixture_policy.contains_personal_data, false); assert.equal(pack.fixture_policy.coordinates_are_geographic, false); assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false); assert.equal(pack.fixture_policy.postal_prefix, 'BZ9999'); assert.ok(postcodes.every(postcode => /^[BKPT][A-Z]\d{4}$/.test(postcode))); assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('bn-syn-')));
  for (const claim of ['booklet-row-is-official-postal-boundary', 'delivery-point-routing-role-is-exact-coordinate', 'district-mukim-kampong-prefix-is-boundary', 'mukim-or-kampong-is-postal-boundary', 'census-housing-unit-is-public-address', 'map-building-lot-title-or-census-unit-is-civic-address-link', 'containment-or-proximity-is-exact-building-link', 'portal-search-purchase-registration-or-payment-is-redistribution-right']) assert.ok(prohibited.has(claim));
});

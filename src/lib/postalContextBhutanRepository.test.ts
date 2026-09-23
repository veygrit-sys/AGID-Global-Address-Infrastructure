import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postal_prefix: string; coordinates_are_geographic: boolean; postcodes_are_assignment_evidence: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string; assignment_class?: string }; expected: { must_not_assert: string[] } }> };
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/bt/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Bhutan seed separates routing, geometry, administration, mapping, statistics, cadastre, transactions, and privacy', () => {
  const value = readJson<Manifest>('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-bt'); assert.equal(value.repository.country_code, 'BT'); assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, true); assert.equal(value.release_scope.contains_raw_source_data, false); assert.equal(value.release_scope.contains_real_addresses, false); assert.equal(value.release_scope.contains_personal_data, false); assert.equal(value.release_scope.contains_production_geometry, false);
  assert.equal(value.postal_system.current_code_format, 'NNNNN');
  assert.match(value.postal_system.legal_rule, /UPU.*five digits.*Dzongdey.*Dzongkhag.*Dungkhag.*Bhutan Post.*Gewog.*Post Office.*not canonical polygons.*building/i);
  assert.match(value.postal_system.assignment_rule, /five-character text.*leading zeroes.*Bhutan Post.*retrieval time.*not create a postal area.*delivery/i);
  assert.match(value.postal_system.geometry_rule, /No reviewed.*canonical national.*polygon.*derived.*NLCS.*NSB.*eSakor.*never become official/i);
  assert.match(value.postal_system.building_rule, /civic-address.*building geometry.*stable relation.*NLCS.*NSB.*candidates.*never establish/i);
  assert.match(value.postal_system.licence_rule, /Bhutan Post.*UPU.*reference.*NLCS.*application.*approval.*payment.*cadastral maps are not public.*NSB.*eSakor.*never grants blanket/i);
  assert.match(value.postal_system.privacy_rule, /Recipients.*box holders.*citizenship.*NDI.*biometrics.*parties.*witnesses.*Thrams.*owners.*occupants.*census microdata.*excluded/i);
  assert.equal(value.promotion.current_stage, 'M1_metadata');
  for (const blocker of ['bhutan-post-locator-row-office-point-or-upu-prefix-presented-as-official-postcode-polygon', 'dzongdey-dzongkhag-dungkhag-gewog-thromde-or-enumeration-area-presented-as-postal-area', 'nlcs-parcel-thram-topographic-feature-or-census-structure-presented-as-civic-address-or-building-link', 'esakor-identity-property-transaction-or-consent-data-published']) assert.ok(value.promotion.hard_blockers.includes(blocker));
});

test('Bhutan source profile keeps postal, administrative, topographic, statistical, cadastral, transaction, and rights authorities separate', () => {
  const profile = readJson<Profile>('source-profile.json'); const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed'); assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('bhutan-post-postcode-finder')?.assignment_authority ?? '', /official_postal_routing_assignment/i); assert.equal(sources.get('bhutan-post-postcode-finder')?.geometry_authority, 'none'); assert.match(sources.get('bhutan-post-domestic-footprint')?.geometry_authority ?? '', /point.*not_catchment/i); assert.equal(sources.get('upu-bhutan-addressing')?.geometry_authority, 'none');
  assert.match(sources.get('bhutan-nlcs-geoportal')?.geometry_authority ?? '', /none.*exact_permitted_provider_layer/i); assert.equal(sources.get('bhutan-nlcs-map-products')?.redistribution_class, 'R3_controlled_approval_or_contract'); assert.match(sources.get('bhutan-nlcs-map-products')?.geometry_authority ?? '', /official_map_geometry.*exact_permitted_product/i); assert.equal(sources.get('bhutan-nlcs-cadastral-information')?.redistribution_class, 'R4_validation_only'); assert.equal(sources.get('bhutan-nsb-phcb-2017')?.redistribution_class, 'R4_validation_only'); assert.equal(sources.get('bhutan-esakor-land-building-transactions')?.redistribution_class, 'R4_validation_only');
  for (const partition of ['official-postcode-routing-assignments', 'official-postal-surface', 'derived-delivery-surface', 'civic-address-and-building', 'administrative-and-topographic-context', 'statistical-cadastral-transaction-and-private-restricted', 'territory-and-private-restricted']) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('Bhutan fixtures keep synthetic postcodes and non-postal evidence non-authoritative', () => {
  const pack = readJson<Fixtures>('fixtures/bhutan-synthetic.json'); const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value)); const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'BT'); assert.equal(pack.synthetic, true); assert.equal(pack.promotion_eligible, false); assert.equal(pack.fixture_policy.contains_real_addresses, false); assert.equal(pack.fixture_policy.contains_upstream_rows, false); assert.equal(pack.fixture_policy.contains_personal_data, false); assert.equal(pack.fixture_policy.coordinates_are_geographic, false); assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false); assert.equal(pack.fixture_policy.postal_prefix, '99999'); assert.ok(postcodes.every(postcode => /^\d{5}$/.test(postcode))); assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('bt-syn-')));
  for (const claim of ['locator-row-is-official-postal-boundary', 'post-office-point-is-catchment', 'upu-digit-hierarchy-is-boundary', 'dzongkhag-gewog-is-postal-boundary', 'census-enumeration-area-is-public-address', 'cadastral-census-or-topographic-building-is-civic-address-link', 'containment-or-proximity-is-exact-building-link', 'portal-access-payment-login-or-transaction-is-redistribution-right']) assert.ok(prohibited.has(claim));
});

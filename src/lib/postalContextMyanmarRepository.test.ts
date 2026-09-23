import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postal_prefix: string; coordinates_are_geographic: boolean; postcodes_are_assignment_evidence: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string }; expected: { must_not_assert: string[] } }> };
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/mm/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Myanmar seed separates assignments, UPU syntax, administration, PCodes, buildings, rights, and privacy', () => {
  const value = readJson<Manifest>('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-mm'); assert.equal(value.repository.country_code, 'MM'); assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, true); assert.equal(value.release_scope.contains_raw_source_data, false); assert.equal(value.release_scope.contains_real_addresses, false); assert.equal(value.release_scope.contains_personal_data, false); assert.equal(value.release_scope.contains_production_geometry, false);
  assert.equal(value.postal_system.current_code_format, 'NNNNNNN');
  assert.match(value.postal_system.legal_rule, /Myanmar Post.*seven-digit.*UPU.*Quarter or Village Tract.*not canonical polygons.*building/i);
  assert.match(value.postal_system.assignment_rule, /seven-character digit string.*leading zeroes.*Myanmar Post.*validity.*MIMU PCodes.*do not create.*postal area/i);
  assert.match(value.postal_system.geometry_rule, /No reviewed.*canonical national.*polygon.*administrative join surface.*not a postal-authority polygon.*MIMU PCodes.*never become official/i);
  assert.match(value.postal_system.building_rule, /civic-address identifier.*building geometry.*stable relation.*YCDC.*MIMU.*never establish/i);
  assert.match(value.postal_system.licence_rule, /Myanmar Post.*UPU.*MIMU.*prohibit sale.*written permission.*never grants blanket/i);
  assert.match(value.postal_system.privacy_rule, /Recipients.*P.O. Box holders.*query.*owners.*occupants.*property-tax.*excluded/i);
  for (const blocker of ['myanmar-post-upu-or-service-row-presented-as-official-postcode-polygon','mimu-pcode-presented-as-myanmar-post-postcode','administrative-boundary-join-presented-as-postal-authority-polygon','ycdc-form-tax-or-property-record-published-as-public-national-address-data']) assert.ok(value.promotion.hard_blockers.includes(blocker));
});

test('Myanmar source profile keeps postal, address, administrative, PCode, geospatial, building, and licence authorities separate', () => {
  const profile = readJson<Profile>('source-profile.json'); const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed'); assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('myanmar-post-postcode-lookup')?.assignment_authority ?? '', /official_postcode_assignment/i); assert.equal(sources.get('myanmar-post-postcode-lookup')?.geometry_authority, 'none');
  assert.equal(sources.get('upu-myanmar-addressing-2022')?.geometry_authority, 'none'); assert.match(sources.get('mimu-place-codes-v9-6-2025')?.assignment_authority ?? '', /none_administrative_identifier/i);
  assert.match(sources.get('mimu-geospatial-data')?.geometry_authority ?? '', /mimu_operational_geometry/i); assert.equal(sources.get('mimu-geospatial-data')?.redistribution_class, 'R3_controlled_approval_or_contract');
  assert.match(sources.get('mimu-terms-and-conditions')?.assignment_authority ?? '', /none_licensing_framework/i); assert.equal(sources.get('ycdc-land-building-services')?.redistribution_class, 'R4_validation_only');
  for (const partition of ['official-postcode-assignments','official-postal-surface','administrative-join-surface','derived-delivery-surface','postal-service-and-civic-address','civic-address-and-building','administrative-geospatial-and-private-restricted','territory-and-private-restricted']) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('Myanmar fixtures keep synthetic seven-digit codes and non-postal evidence non-authoritative', () => {
  const pack = readJson<Fixtures>('fixtures/myanmar-synthetic.json'); const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value)); const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'MM'); assert.equal(pack.synthetic, true); assert.equal(pack.promotion_eligible, false); assert.equal(pack.fixture_policy.contains_real_addresses, false); assert.equal(pack.fixture_policy.contains_upstream_rows, false); assert.equal(pack.fixture_policy.contains_personal_data, false); assert.equal(pack.fixture_policy.coordinates_are_geographic, false); assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false); assert.equal(pack.fixture_policy.postal_prefix, '9999999'); assert.ok(postcodes.every(postcode => /^\d{7}$/.test(postcode))); assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('mm-syn-')));
  for (const claim of ['myanmar-post-upu-or-service-row-is-official-postal-boundary','postal-service-object-is-area','mimu-pcode-is-myanmar-post-postcode','administrative-boundary-join-is-postal-authority-polygon','ycdc-form-tax-or-property-record-is-public-address-data','containment-or-proximity-is-exact-building-link','portal-query-request-registration-payment-or-attribution-is-redistribution-right']) assert.ok(prohibited.has(claim));
});

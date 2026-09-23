import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postal_prefix: string; coordinates_are_geographic: boolean; postcodes_are_assignment_evidence: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string }; expected: { must_not_assert: string[] } }> };
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/my/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Malaysia seed separates assignments, postal services, administration, parcels, buildings, rights, and privacy', () => {
  const value = readJson<Manifest>('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-my'); assert.equal(value.repository.country_code, 'MY'); assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, true); assert.equal(value.release_scope.contains_raw_source_data, false); assert.equal(value.release_scope.contains_real_addresses, false); assert.equal(value.release_scope.contains_personal_data, false); assert.equal(value.release_scope.contains_production_geometry, false);
  assert.equal(value.postal_system.current_code_format, 'NNNNN');
  assert.match(value.postal_system.legal_rule, /Pos Malaysia.*five-digit.*MyGDX.*UPU.*locked bag.*not canonical polygons.*building/i);
  assert.match(value.postal_system.assignment_rule, /five-character digit string.*leading zeroes.*Pos Malaysia.*MyGDX.*validity.*UPI.*do not create.*postal area/i);
  assert.match(value.postal_system.geometry_rule, /No reviewed.*canonical national.*polygon.*administrative join surface.*not a postal-authority polygon.*UPI.*MyGOS.*never become official/i);
  assert.match(value.postal_system.building_rule, /civic-address identifier.*building geometry.*stable relation.*MyGOS.*UPI parcels.*never establish/i);
  assert.match(value.postal_system.licence_rule, /Pos Malaysia.*UPU.*MyGDX.*MyGOS.*provider approval.*G2G.*copyright.*never grants blanket/i);
  assert.match(value.postal_system.privacy_rule, /Recipients.*locked-bag holders.*query.*households.*owners.*occupants.*cadastral.*excluded/i);
  for (const blocker of ['postcode-finder-mygdx-upu-row-or-postal-service-object-presented-as-official-postcode-polygon','administrative-boundary-join-presented-as-postal-authority-polygon','upi-parcel-presented-as-postcode-civic-address-building-owner-or-occupant','mygos-map-building-or-parcel-presented-as-exact-address-link']) assert.ok(value.promotion.hard_blockers.includes(blocker));
});

test('Malaysia source profile keeps postal, address, administrative, parcel, geospatial, and licence authorities separate', () => {
  const profile = readJson<Profile>('source-profile.json'); const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed'); assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('pos-malaysia-postcode-finder')?.assignment_authority ?? '', /official_postcode_assignment/i); assert.equal(sources.get('pos-malaysia-postcode-finder')?.geometry_authority, 'none');
  assert.equal(sources.get('upu-malaysia-addressing')?.geometry_authority, 'none'); assert.equal(sources.get('malaysia-mygdx-postcode-catalog')?.redistribution_class, 'R3_controlled_approval_or_contract');
  assert.match(sources.get('malaysia-mygeo-fundamental-data-2026')?.geometry_authority ?? '', /official_administrative_geometry/i); assert.equal(sources.get('malaysia-mygos-data-services')?.redistribution_class, 'R3_controlled_approval_or_contract');
  assert.match(sources.get('malaysia-mygeo-upi')?.assignment_authority ?? '', /none_parcel_identifier/i); assert.match(sources.get('malaysia-mygdi-licensing-2024')?.assignment_authority ?? '', /none_licensing_framework/i); assert.equal(sources.get('malaysia-mygeoname')?.geometry_authority, 'none');
  for (const partition of ['official-postcode-assignments','official-postal-surface','administrative-join-surface','derived-delivery-surface','postal-service-and-civic-address','civic-address-and-building','administrative-geospatial-parcel-and-private-restricted','territory-and-private-restricted']) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('Malaysia fixtures keep synthetic five-digit codes and non-postal evidence non-authoritative', () => {
  const pack = readJson<Fixtures>('fixtures/malaysia-synthetic.json'); const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value)); const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'MY'); assert.equal(pack.synthetic, true); assert.equal(pack.promotion_eligible, false); assert.equal(pack.fixture_policy.contains_real_addresses, false); assert.equal(pack.fixture_policy.contains_upstream_rows, false); assert.equal(pack.fixture_policy.contains_personal_data, false); assert.equal(pack.fixture_policy.coordinates_are_geographic, false); assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false); assert.equal(pack.fixture_policy.postal_prefix, '99999'); assert.ok(postcodes.every(postcode => /^\d{5}$/.test(postcode))); assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('my-syn-')));
  for (const claim of ['postcode-finder-mygdx-or-upu-row-is-official-postal-boundary','postal-service-object-is-area','administrative-boundary-join-is-postal-authority-polygon','upi-parcel-is-civic-address-or-building','mygos-map-building-or-parcel-is-civic-address-link','containment-or-proximity-is-exact-building-link','portal-query-registration-request-or-payment-is-redistribution-right']) assert.ok(prohibited.has(claim));
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postal_prefix: string; coordinates_are_geographic: boolean; postcodes_are_assignment_evidence: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string; assignment_class?: string }; expected: { must_not_assert: string[] } }> };
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/vn/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Vietnam seed separates current assignments, two-tier administration, digital addresses, map products, buildings, and privacy', () => {
  const value = readJson<Manifest>('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-vn'); assert.equal(value.repository.country_code, 'VN'); assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, true); assert.equal(value.release_scope.contains_raw_source_data, false); assert.equal(value.release_scope.contains_real_addresses, false); assert.equal(value.release_scope.contains_personal_data, false); assert.equal(value.release_scope.contains_production_geometry, false);
  assert.equal(value.postal_system.current_code_format, 'NNNNN');
  assert.match(value.postal_system.legal_rule, /Decision 2334.*five-character.*wards.*communes.*two-tier.*UPU.*home.*rural.*post-office.*not canonical polygons.*building/i);
  assert.match(value.postal_system.assignment_rule, /five-character digit string.*leading zeroes.*portal.*Decision 2334.*validity.*NSO.*legacy district.*do not create.*postal area/i);
  assert.match(value.postal_system.geometry_rule, /No reviewed.*canonical national.*polygon.*administrative join surface.*not a postal-authority polygon.*Vpostcode.*NSDI.*never become official/i);
  assert.match(value.postal_system.building_rule, /civic or digital-address identifier.*building geometry.*stable relation.*Vpostcode points.*NSDI.*cadastral parcels.*never establish/i);
  assert.match(value.postal_system.licence_rule, /National postcode.*Decision 2334.*Vietnam Post.*UPU.*NSO.*Vpostcode.*NSDI.*registration.*request.*fee.*never grants blanket/i);
  assert.match(value.postal_system.privacy_rule, /Recipients.*box holders.*Vpostcode.*query.*households.*owners.*occupants.*cadastral.*excluded/i);
  assert.equal(value.promotion.current_stage, 'M1_metadata');
  for (const blocker of ['postcode-portal-decision-upu-row-or-post-office-object-presented-as-official-postcode-polygon', 'province-ward-commune-legacy-district-or-nso-row-presented-as-postal-boundary', 'administrative-boundary-join-presented-as-postal-authority-polygon', 'vpostcode-location-code-presented-as-legal-civic-address-building-or-occupant-relation', 'nsdi-map-building-or-cadastral-parcel-presented-as-exact-address-link']) assert.ok(value.promotion.hard_blockers.includes(blocker));
});

test('Vietnam source profile keeps postal, legal, address, administrative, geospatial, and rights authorities separate', () => {
  const profile = readJson<Profile>('source-profile.json'); const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed'); assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('vietnam-national-postcode-portal')?.assignment_authority ?? '', /official_postcode_assignment/i); assert.equal(sources.get('vietnam-national-postcode-portal')?.geometry_authority, 'none');
  assert.match(sources.get('vietnam-postcode-decision-2334-2025')?.assignment_authority ?? '', /legal_assignment_framework/i); assert.equal(sources.get('vnpost-two-tier-postcode-notice')?.geometry_authority, 'none'); assert.equal(sources.get('upu-vietnam-addressing')?.geometry_authority, 'none');
  assert.match(sources.get('vnpost-vpostcode-digital-address')?.geometry_authority ?? '', /point_only.*permitted/i); assert.equal(sources.get('vnpost-vpostcode-digital-address')?.redistribution_class, 'R3_controlled_approval_or_contract');
  assert.match(sources.get('vietnam-nso-administrative-units')?.assignment_authority ?? '', /none_administrative_identifier/i); assert.equal(sources.get('vietnam-nsdi-portal')?.redistribution_class, 'R3_controlled_approval_or_contract'); assert.match(sources.get('vietnam-survey-map-data-service')?.geometry_authority ?? '', /official_map_geometry.*exact_supplied_product/i);
  for (const partition of ['official-postcode-assignments', 'official-postal-surface', 'administrative-join-surface', 'derived-delivery-surface', 'digital-address-and-civic-address', 'civic-address-and-building', 'administrative-geospatial-and-private-restricted', 'territory-and-private-restricted']) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('Vietnam fixtures keep synthetic five-digit codes and non-postal evidence non-authoritative', () => {
  const pack = readJson<Fixtures>('fixtures/vietnam-synthetic.json'); const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value)); const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'VN'); assert.equal(pack.synthetic, true); assert.equal(pack.promotion_eligible, false); assert.equal(pack.fixture_policy.contains_real_addresses, false); assert.equal(pack.fixture_policy.contains_upstream_rows, false); assert.equal(pack.fixture_policy.contains_personal_data, false); assert.equal(pack.fixture_policy.coordinates_are_geographic, false); assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false); assert.equal(pack.fixture_policy.postal_prefix, '99999'); assert.ok(postcodes.every(postcode => /^\d{5}$/.test(postcode))); assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('vn-syn-')));
  for (const claim of ['portal-or-decision-row-is-official-postal-boundary', 'ward-or-commune-code-is-canonical-polygon', 'post-office-or-special-delivery-object-is-area', 'administrative-boundary-join-is-postal-authority-polygon', 'vpostcode-point-is-legal-address-or-building-footprint', 'nsdi-map-building-or-parcel-is-civic-address-link', 'containment-or-proximity-is-exact-building-link', 'portal-query-registration-request-or-payment-is-redistribution-right']) assert.ok(prohibited.has(claim));
});

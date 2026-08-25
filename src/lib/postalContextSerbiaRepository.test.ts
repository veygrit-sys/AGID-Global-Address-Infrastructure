import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type SourceProfile = {
  artifact_scope: string;
  sources: Array<{
    source_id: string;
    assignment_authority: string;
    geometry_authority: string;
    redistribution_class: string;
    bundled_here: boolean;
    prohibited_claims: string[];
  }>;
  artifact_partitions: Array<{ id: string }>;
};

type RepositoryManifest = {
  repository: { name: string; country_code: string; maturity: string };
  release_scope: {
    metadata_only: boolean;
    contains_raw_source_data: boolean;
    contains_real_addresses: boolean;
    contains_personal_data: boolean;
    contains_production_geometry: boolean;
    fixtures_are_synthetic: boolean;
    publication_claim: string;
  };
  postal_system: {
    full_code_name: string;
    full_code_format: string;
    pak_name: string;
    pak_format: string;
    full_code_default_geometry: string;
    assignment_rule: string;
    pak_rule: string;
    lookup_rule: string;
    api_rule: string;
    perimeter_rule: string;
    address_rule: string;
    building_rule: string;
    parcel_rule: string;
    administrative_rule: string;
    licence_rule: string;
    crs_rule: string;
    territorial_rule: string;
  };
  promotion: { current_stage: string; hard_blockers: string[] };
};

type SyntheticFixturePack = {
  country_code: string;
  synthetic: boolean;
  promotion_eligible: boolean;
  fixture_policy: {
    contains_real_addresses: boolean;
    contains_upstream_rows: boolean;
    contains_personal_data: boolean;
    postal_prefix: string;
    pak_prefix: string;
    coordinates_are_geographic: boolean;
    postcodes_are_assignment_evidence: boolean;
  };
  fixtures: Array<{
    fixture_id: string;
    synthetic_address: { postcode?: string; pak?: string };
    evidence: Array<{ assignment_authority: string; geometry_authority: string }>;
    expected: { must_not_assert: string[] };
  }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/rs/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Serbia seed separates postcode, PAK, address point, building, parcel, administration, and territory evidence', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-rs');
  assert.equal(manifest.repository.country_code, 'RS');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.deepEqual(manifest.release_scope, {
    metadata_only: true,
    contains_raw_source_data: false,
    contains_real_addresses: false,
    contains_personal_data: false,
    contains_production_geometry: false,
    fixtures_are_synthetic: true,
    publication_claim: 'contract-seed-only',
  });
  assert.equal(manifest.postal_system.full_code_name, 'Poštanski broj');
  assert.equal(manifest.postal_system.full_code_format, 'NNNNN');
  assert.match(manifest.postal_system.pak_name, /Poštanski adresni kod.*PAK/i);
  assert.equal(manifest.postal_system.pak_format, 'NNNNNN');
  assert.match(manifest.postal_system.full_code_default_geometry, /operator_routing_assignment.*derived_address_membership_surface.*point.*non_area/i);
  assert.match(manifest.postal_system.assignment_rule, /Pošta Srbije.*five-digit.*destination post office.*does not establish.*perimeter.*deliverability/i);
  assert.match(manifest.postal_system.pak_rule, /six-digit.*part of a street.*side.*house-number range.*not automatically a polygon.*building.*resident/i);
  assert.match(manifest.postal_system.lookup_rule, /public PAK lookup.*map display.*not grant bulk extraction.*redistribution/i);
  assert.match(manifest.postal_system.api_rule, /WSP WebAPI.*registered users.*Credentials.*never enter.*endpoint version.*digest/i);
  assert.match(manifest.postal_system.perimeter_rule, /No nationwide official.*postcode or PAK polygon.*derived.*Street buffers.*nearest offices.*Voronoi/i);
  assert.match(manifest.postal_system.address_rule, /RGZ Address Register.*unique address codes.*Serbian Open Data License.*postcode and PAK.*separately/i);
  assert.match(manifest.postal_system.building_rule, /source-defined.*common authoritative cadastral identifier.*parcel reference.*candidate/i);
  assert.match(manifest.postal_system.parcel_rule, /parcel is not a building.*PAK.*postcode perimeter.*owners.*title/i);
  assert.match(manifest.postal_system.administrative_rule, /spatial units.*do not create.*PAK membership.*sovereignty/i);
  assert.match(manifest.postal_system.licence_rule, /source.*download date.*download URL.*transformations.*dataset-specific/i);
  assert.match(manifest.postal_system.crs_rule, /source CRS.*WGS84.*reviewed transform/i);
  assert.match(manifest.postal_system.territorial_rule, /coverage.*not a sovereignty assertion.*RS and XK.*never silently merged/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  for (const blocker of [
    'post-office-point-presented-as-postcode-polygon',
    'pak-presented-as-five-digit-postcode-or-universal-polygon',
    'rgz-house-number-point-presented-as-building-footprint',
    'coverage-presented-as-sovereignty-determination',
    'postcode-or-pak-stored-as-number',
  ]) {
    assert.ok(manifest.promotion.hard_blockers.includes(blocker));
  }
});

test('Serbia source policy separates operator, open address, building, cadastral, administrative, and territory authority', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const offices = sources.get('posta-srbije-post-office-list');
  const pak = sources.get('posta-srbije-pak-definition');
  const lookup = sources.get('posta-srbije-pak-lookup');
  const api = sources.get('posta-srbije-wsp-address-api');
  const address = sources.get('rgz-serbia-address-register-open-data');
  const administration = sources.get('rgz-serbia-spatial-unit-register');
  const buildings = sources.get('rgz-serbia-geosrbija-buildings');
  const cadastre = sources.get('rgz-serbia-real-estate-cadastre');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(offices?.assignment_authority, 'official_postal_operator');
  assert.equal(offices?.geometry_authority, 'office_point_or_address_only');
  assert.ok(offices?.prohibited_claims.includes('post-office-point-is-postcode-polygon'));
  assert.equal(pak?.geometry_authority, 'route_or_address_range_not_polygon');
  assert.ok(pak?.prohibited_claims.includes('pak-is-five-digit-postcode'));
  assert.equal(lookup?.geometry_authority, 'query_map_reference_only');
  assert.ok(lookup?.prohibited_claims.includes('map-display-is-bulk-geometry-license'));
  assert.equal(api?.assignment_authority, 'official_postal_operator_api');
  assert.ok(api?.prohibited_claims.includes('public-documentation-is-api-authorization'));
  assert.equal(address?.redistribution_class, 'R2_serbian_open_data');
  assert.equal(address?.geometry_authority, 'official_house_number_point_and_street_geometry');
  assert.ok(address?.prohibited_claims.includes('house-number-point-is-building-footprint'));
  assert.equal(administration?.geometry_authority, 'official_administrative_geometry');
  assert.ok(administration?.prohibited_claims.includes('coverage-determines-sovereignty'));
  assert.match(buildings?.geometry_authority ?? '', /official_building_geometry.*separately_licensed/);
  assert.ok(buildings?.prohibited_claims.includes('nearest-building-is-exact-link'));
  assert.equal(cadastre?.redistribution_class, 'R4_validation_only');
  assert.ok(cadastre?.prohibited_claims.includes('parcel-is-building'));
  for (const partition of [
    'five-digit-postal-assignment',
    'six-digit-pak-routing',
    'operator-query-and-api',
    'official-open-address',
    'building-and-cadastral-context',
    'derived-postal-or-pak-surface',
    'administration-coverage-and-territory',
    'private-and-restricted',
  ]) {
    assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
  }
});

test('Serbia fixtures use synthetic five-digit postcode and six-digit PAK strings and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/serbia-synthetic.json');
  const postcodes = pack.fixtures.map(fixture => fixture.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const paks = pack.fixtures.map(fixture => fixture.synthetic_address.pak).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'RS');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '0000');
  assert.equal(pack.fixture_policy.pak_prefix, '00000');
  assert.ok(postcodes.every(code => /^0000[0-3]$/.test(code)));
  assert.ok(paks.every(pak => /^00000[0-3]$/.test(pak)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('rs-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('official-posta-srbije-polygon'));
  assert.ok(prohibited.has('pak-is-five-digit-postcode'));
  assert.ok(prohibited.has('house-number-point-is-building-footprint'));
  assert.ok(prohibited.has('nearest-office-is-postcode-area'));
  assert.ok(prohibited.has('coverage-determines-sovereignty'));
});

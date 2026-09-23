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
    full_code_default_geometry: string;
    special_code_rule: string;
    postal_district_rule: string;
    delivery_area_rule: string;
    address_rule: string;
    building_rule: string;
    parcel_rule: string;
    crs_rule: string;
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
    coordinates_are_geographic: boolean;
    postcodes_are_assignment_evidence: boolean;
  };
  fixtures: Array<{
    fixture_id: string;
    synthetic_address: { postcode?: string };
    evidence: Array<{ assignment_authority: string; geometry_authority: string }>;
    expected: { must_not_assert: string[] };
  }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/si/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Slovenia seed separates normal codes, special codes, postal districts, addresses, buildings, parcels, and service areas', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-si');
  assert.equal(manifest.repository.country_code, 'SI');
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
  assert.equal(manifest.postal_system.full_code_name, 'Poštna številka');
  assert.equal(manifest.postal_system.full_code_format, 'NNNN');
  assert.match(manifest.postal_system.full_code_default_geometry, /postal_district.*explicit_crosswalk.*derived_address_membership_surface.*non_area/);
  assert.match(manifest.postal_system.special_code_rule, /organizations.*non-area.*residential polygons/i);
  assert.match(manifest.postal_system.postal_district_rule, /GURS.*poštni okoliš.*not automatically.*explicit.*crosswalk.*Voronoi/i);
  assert.match(manifest.postal_system.delivery_area_rule, /WebGIS.*unaddressed direct mail.*operational.*separate/i);
  assert.match(manifest.postal_system.address_rule, /Register naslovov.*unique address number.*centroid.*EPSG:3794.*separate/i);
  assert.match(manifest.postal_system.building_rule, /address-building relationship.*common authoritative identifier.*centroid.*candidate/i);
  assert.match(manifest.postal_system.parcel_rule, /parcel is not a building.*postal district.*owners.*title/i);
  assert.match(manifest.postal_system.crs_rule, /EPSG:3794.*reviewed transform.*WGS84/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('special-postcode-presented-as-residential-area'));
  assert.ok(manifest.promotion.hard_blockers.includes('gurs-postal-district-used-without-explicit-operator-crosswalk'));
  assert.ok(manifest.promotion.hard_blockers.includes('unaddressed-mail-webgis-area-presented-as-normal-postcode-perimeter'));
  assert.ok(manifest.promotion.hard_blockers.includes('address-centroid-presented-as-building-footprint'));
  assert.ok(manifest.promotion.hard_blockers.includes('epsg-3794-geometry-published-as-wgs84-without-reviewed-transform'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number'));
});

test('Slovenia source policy separates operator assignment, government geometry, address, building, parcel, and service authority', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const postal = sources.get('posta-slovenije-postcode-csv');
  const special = sources.get('posta-slovenije-special-postcodes');
  const serviceArea = sources.get('posta-slovenije-delivery-area-webgis');
  const postalDistrict = sources.get('gurs-slovenia-postal-districts');
  const address = sources.get('gurs-slovenia-address-register');
  const api = sources.get('gurs-slovenia-public-features-api');
  const buildings = sources.get('gurs-slovenia-real-estate-cadastre-buildings');
  const administration = sources.get('gurs-slovenia-spatial-unit-register');
  const parcels = sources.get('gurs-slovenia-cadastral-parcels');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(postal?.assignment_authority, 'official_postal_operator');
  assert.equal(postal?.geometry_authority, 'none');
  assert.ok(postal?.prohibited_claims.includes('post-office-is-postcode-polygon'));
  assert.equal(special?.geometry_authority, 'non_area_by_default');
  assert.ok(special?.prohibited_claims.includes('special-code-is-residential-postcode-area'));
  assert.match(serviceArea?.geometry_authority ?? '', /unaddressed_mail_delivery_area_only/);
  assert.ok(serviceArea?.prohibited_claims.includes('unaddressed-mail-area-is-normal-postcode-perimeter'));
  assert.equal(postalDistrict?.geometry_authority, 'official_government_postal_district_geometry');
  assert.ok(postalDistrict?.prohibited_claims.includes('name-match-is-explicit-crosswalk'));
  assert.equal(address?.assignment_authority, 'official_address_register');
  assert.equal(address?.geometry_authority, 'official_address_centroid');
  assert.ok(address?.prohibited_claims.includes('address-centroid-is-building-footprint'));
  assert.equal(api?.redistribution_class, 'R2_cc_by_4_gurs');
  assert.match(buildings?.geometry_authority ?? '', /official_cadastral_building_geometry/);
  assert.ok(buildings?.prohibited_claims.includes('centroid-containment-is-exact-address-link'));
  assert.equal(administration?.geometry_authority, 'official_administrative_geometry');
  assert.equal(parcels?.redistribution_class, 'R4_validation_only');
  assert.ok(parcels?.prohibited_claims.includes('parcel-is-building'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'postal-district'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'unaddressed-mail-service-area'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'building-and-cadastral-context'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'private-and-restricted'));
});

test('Slovenia fixtures use four-character synthetic codes and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/slovenia-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'SI');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '000');
  assert.ok(postcodes.every(code => /^000[0-3]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('si-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('official-posta-slovenije-polygon'));
  assert.ok(prohibited.has('special-code-is-residential-area'));
  assert.ok(prohibited.has('address-centroid-is-building-footprint'));
  assert.ok(prohibited.has('name-match-is-explicit-postal-district-crosswalk'));
  assert.ok(prohibited.has('unaddressed-mail-area-is-postcode'));
});

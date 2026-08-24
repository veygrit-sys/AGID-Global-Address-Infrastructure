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
    postcode_area_rule: string;
    address_rule: string;
    building_rule: string;
    parcel_rule: string;
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
const seedRoot = resolve(root, 'data/postal_country_packs/sk/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Slovakia seed separates operator assignment, address identity, buildings, parcels, and administration', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-sk');
  assert.equal(manifest.repository.country_code, 'SK');
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
  assert.equal(manifest.postal_system.full_code_name, 'PSČ');
  assert.equal(manifest.postal_system.full_code_format, 'NNN NN');
  assert.match(manifest.postal_system.full_code_default_geometry, /routing_assignment.*derived_address_membership_surface.*non_area/);
  assert.match(manifest.postal_system.postcode_area_rule, /No nationwide official.*derived.*Voronoi/i);
  assert.match(manifest.postal_system.address_rule, /Register adries.*building identifier.*PSČ assignment evidence/i);
  assert.match(manifest.postal_system.building_rule, /Register adries building relationship.*common authoritative building identifier.*nearest.*candidate/i);
  assert.match(manifest.postal_system.parcel_rule, /parcel is not a building.*address relationship.*PSČ perimeter.*owners/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('post-office-or-access-point-presented-as-postcode-area'));
  assert.ok(manifest.promotion.hard_blockers.includes('derived-surface-presented-as-official-slovenska-posta-boundary'));
  assert.ok(manifest.promotion.hard_blockers.includes('address-point-presented-as-building-footprint'));
  assert.ok(manifest.promotion.hard_blockers.includes('building-proximity-presented-as-exact-register-link'));
  assert.ok(manifest.promotion.hard_blockers.includes('cadastral-parcel-presented-as-address-building-or-postcode-area'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number'));
});

test('Slovakia source policy separates postal, service, address, building, parcel, and administration authority', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const postal = sources.get('slovak-post-postcode-search');
  const accessPoints = sources.get('slovak-post-access-point-xml');
  const registry = sources.get('slovakia-register-addresses-portal');
  const api = sources.get('slovakia-register-addresses-openapi');
  const buildings = sources.get('zbgis-slovakia-inspire-buildings');
  const administration = sources.get('zbgis-slovakia-administrative-units');
  const parcels = sources.get('zbgis-slovakia-cadastral-parcels');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(postal?.assignment_authority, 'official_postal_operator');
  assert.equal(postal?.geometry_authority, 'none');
  assert.ok(postal?.prohibited_claims.includes('post-office-or-municipality-is-official-psc-polygon'));
  assert.match(accessPoints?.geometry_authority ?? '', /access_point_only/);
  assert.ok(accessPoints?.prohibited_claims.includes('nearest-post-office-determines-psc'));
  assert.equal(registry?.assignment_authority, 'official_address_register');
  assert.ok(registry?.prohibited_claims.includes('address-identity-is-building-footprint'));
  assert.match(api?.geometry_authority ?? '', /official_address_point.*explicit_register_relation/);
  assert.ok(api?.prohibited_claims.includes('nearest-building-is-exact-link'));
  assert.match(buildings?.geometry_authority ?? '', /official_inspire_building_geometry/);
  assert.ok(buildings?.prohibited_claims.includes('containment-is-exact-address-link'));
  assert.equal(administration?.geometry_authority, 'official_administrative_geometry');
  assert.ok(administration?.prohibited_claims.includes('administrative-unit-is-psc-perimeter'));
  assert.equal(parcels?.redistribution_class, 'R4_validation_only');
  assert.ok(parcels?.prohibited_claims.includes('parcel-is-building'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'derived-psc-surface'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'building-and-cadastral-context'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'private-and-restricted'));
});

test('Slovakia fixtures use spaced synthetic PSČ strings and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/slovakia-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'SK');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '000');
  assert.ok(postcodes.every(code => /^000 0[0-3]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('sk-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('official-slovenska-posta-polygon'));
  assert.ok(prohibited.has('address-point-is-building-footprint'));
  assert.ok(prohibited.has('nearest-building-is-exact-link'));
  assert.ok(prohibited.has('access-point-is-postcode-area'));
  assert.ok(prohibited.has('parcel-is-building'));
});

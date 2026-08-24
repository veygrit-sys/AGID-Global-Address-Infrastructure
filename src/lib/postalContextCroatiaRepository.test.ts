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
    assignment_rule: string;
    perimeter_rule: string;
    address_rule: string;
    building_rule: string;
    administrative_rule: string;
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
const seedRoot = resolve(root, 'data/postal_country_packs/hr/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Croatia seed separates operator assignment, DGU delivery area, address, building, parcel, and administration', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-hr');
  assert.equal(manifest.repository.country_code, 'HR');
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
  assert.match(manifest.postal_system.full_code_format, /NNNNN.*HR-NNNNN/i);
  assert.match(manifest.postal_system.full_code_default_geometry, /operator_assignment.*dgu_delivery_office_area.*explicit_crosswalk.*derived_surface.*point.*non_area/i);
  assert.match(manifest.postal_system.assignment_rule, /Hrvatska pošta.*destination post office.*does not establish current allocation.*deliverability/i);
  assert.match(manifest.postal_system.perimeter_rule, /DGU Spatial Unit Register.*not automatically.*postcode perimeter.*crosswalk.*GISCO.*Voronoi/i);
  assert.match(manifest.postal_system.address_rule, /DGU INSPIRE address identifier.*separately pinned postal assignment/i);
  assert.match(manifest.postal_system.building_rule, /explicit distributable address-building relation.*cadastral parcel.*proximity.*candidate-only/i);
  assert.match(manifest.postal_system.administrative_rule, /City of Zagreb.*do not create postcode membership/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('croatian-post-download-presented-as-open-redistribution-license'));
  assert.ok(manifest.promotion.hard_blockers.includes('dgu-delivery-area-used-without-explicit-operator-office-crosswalk'));
  assert.ok(manifest.promotion.hard_blockers.includes('parcel-or-footprint-presented-as-exact-address-building-link'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number'));
});

test('Croatia source policy separates operator, register, open address/building, parcel, administration, and point evidence', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const postal = sources.get('croatian-post-postcode-downloads');
  const upu = sources.get('upu-croatia-addressing');
  const deliveryArea = sources.get('dgu-croatia-spatial-unit-register');
  const address = sources.get('dgu-croatia-inspire-addresses');
  const building = sources.get('dgu-croatia-inspire-buildings');
  const administration = sources.get('dgu-croatia-inspire-administrative-units');
  const parcel = sources.get('dgu-croatia-cadastral-parcels');
  const point = sources.get('gisco-croatia-postcode-points');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(postal?.assignment_authority, 'official_postal_operator');
  assert.equal(postal?.geometry_authority, 'none');
  assert.equal(postal?.redistribution_class, 'R3_controlled_or_contract');
  assert.ok(postal?.prohibited_claims.includes('download-is-open-redistribution-license'));
  assert.equal(upu?.geometry_authority, 'none');
  assert.equal(deliveryArea?.geometry_authority, 'official_government_delivery_office_area');
  assert.ok(deliveryArea?.prohibited_claims.includes('delivery-office-area-is-operator-authored-postcode-perimeter'));
  assert.equal(address?.geometry_authority, 'official_address_geometry');
  assert.ok(address?.prohibited_claims.includes('address-feature-proves-current-postcode'));
  assert.equal(building?.geometry_authority, 'official_building_geometry');
  assert.ok(building?.prohibited_claims.includes('nearest-building-is-exact-link'));
  assert.equal(administration?.geometry_authority, 'official_administrative_geometry');
  assert.equal(parcel?.redistribution_class, 'R4_validation_only');
  assert.ok(parcel?.prohibited_claims.includes('parcel-is-address-link'));
  assert.equal(point?.geometry_authority, 'official_derived_point_only');
  assert.ok(point?.prohibited_claims.includes('point-is-operator-or-dgu-perimeter'));
  for (const partition of [
    'postal-assignment',
    'delivery-office-area',
    'official-derived-postcode-point',
    'official-address',
    'building-and-cadastral-context',
    'derived-postal-surface',
    'administration-and-service',
    'private-and-restricted',
  ]) {
    assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
  }
});

test('Croatia fixtures use synthetic 0000N strings and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/croatia-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'HR');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '0000');
  assert.ok(postcodes.every(code => /^0000[0-3]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('hr-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('operator-official-postcode-polygon'));
  assert.ok(prohibited.has('dgu-delivery-area-crosswalk'));
  assert.ok(prohibited.has('nearest-building-is-exact-link'));
  assert.ok(prohibited.has('operator-or-dgu-official-perimeter'));
  assert.ok(prohibited.has('po-box-is-residential-area'));
});

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
    perimeter_rule: string;
    address_rule: string;
    building_rule: string;
    territory_rule: string;
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
const seedRoot = resolve(root, 'data/postal_country_packs/ge/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Georgia seed separates operator assignment, derived surfaces, addresses, buildings, parcels, and territory', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-ge');
  assert.equal(manifest.repository.country_code, 'GE');
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
  assert.match(manifest.postal_system.full_code_name, /postal code/);
  assert.equal(manifest.postal_system.full_code_format, 'NNNN');
  assert.match(manifest.postal_system.full_code_default_geometry, /operator_assignment.*derived_address_membership_surface.*non_area/);
  assert.match(manifest.postal_system.perimeter_rule, /No nationwide official.*derived.*Voronoi/i);
  assert.match(manifest.postal_system.address_rule, /NAPR.*NSDI Address Layer.*licence.*assignment evidence/i);
  assert.match(manifest.postal_system.building_rule, /explicit distributable.*common authoritative identifier.*proximity.*candidate/i);
  assert.match(manifest.postal_system.territory_rule, /never determine sovereignty.*coverage-limited.*explicit gaps/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('post-office-point-or-locality-presented-as-postcode-area'));
  assert.ok(manifest.promotion.hard_blockers.includes('derived-surface-presented-as-official-postcode-boundary'));
  assert.ok(manifest.promotion.hard_blockers.includes('nsdi-portal-access-substituted-for-resource-specific-license'));
  assert.ok(manifest.promotion.hard_blockers.includes('building-proximity-presented-as-exact-identifier-link'));
  assert.ok(manifest.promotion.hard_blockers.includes('coverage-gap-filled-from-nearest-postal-or-geospatial-feature'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number'));
});

test('Georgia source policy separates postal, address, building, parcel, administration, and statistics authority', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const postal = sources.get('georgian-post-postcode-finder');
  const guide = sources.get('georgian-post-addressing-guide');
  const registry = sources.get('napr-georgia-address-registry');
  const address = sources.get('nsdi-georgia-address-layer');
  const building = sources.get('nsdi-georgia-registered-buildings');
  const parcel = sources.get('nsdi-georgia-registered-parcels');
  const admin = sources.get('nsdi-georgia-administrative-boundaries');
  const statistics = sources.get('geostat-georgia-administrative-classification');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(postal?.assignment_authority, 'official_postal_operator');
  assert.equal(postal?.geometry_authority, 'none');
  assert.ok(postal?.prohibited_claims.includes('post-office-or-locality-is-postcode-polygon'));
  assert.equal(guide?.geometry_authority, 'none');
  assert.ok(guide?.prohibited_claims.includes('format-proves-current-allocation'));
  assert.equal(registry?.assignment_authority, 'official_address_register');
  assert.ok(registry?.prohibited_claims.includes('address-identity-is-building-footprint'));
  assert.match(address?.geometry_authority ?? '', /official_address_geometry/);
  assert.ok(address?.prohibited_claims.includes('geoportal-access-is-blanket-open-license'));
  assert.match(building?.geometry_authority ?? '', /registered_building_geometry/);
  assert.ok(building?.prohibited_claims.includes('nearest-building-is-exact-link'));
  assert.equal(parcel?.redistribution_class, 'R4_validation_only');
  assert.ok(parcel?.prohibited_claims.includes('parcel-is-building'));
  assert.ok(admin?.prohibited_claims.includes('nearest-boundary-fills-coverage-gap'));
  assert.ok(statistics?.prohibited_claims.includes('statistical-unit-is-postcode-area'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'derived-postal-surface'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'administration-and-coverage'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'private-and-restricted'));
});

test('Georgia fixtures use synthetic 000x strings and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/georgia-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'GE');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '000');
  assert.ok(postcodes.every(code => /^000[0-3]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('ge-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('official-postcode-polygon'));
  assert.ok(prohibited.has('nearest-building-is-exact-link'));
  assert.ok(prohibited.has('post-office-or-locality-is-postcode-area'));
  assert.ok(prohibited.has('coverage-gap-filled-from-nearest-feature'));
  assert.ok(prohibited.has('postal-evidence-proves-sovereignty'));
});

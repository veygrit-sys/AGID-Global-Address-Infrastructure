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
  release_scope: Record<string, boolean | string>;
  postal_system: Record<string, string>;
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
  };
  fixtures: Array<{
    fixture_id: string;
    synthetic_address: { postcode?: string };
    evidence: Array<{ assignment_authority: string; geometry_authority: string }>;
    expected: { must_not_assert: string[] };
  }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/bg/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Bulgaria seed separates operator assignment, derived surface, address, cadastre, and EKATTE evidence', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-bg');
  assert.equal(manifest.repository.country_code, 'BG');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.release_scope.fixtures_are_synthetic, true);
  assert.equal(manifest.postal_system.full_code_format, 'NNNN');
  assert.match(manifest.postal_system.assignment_rule, /Bulgarian Posts.*four-digit.*routing.*does not establish.*deliverability.*polygon/i);
  assert.match(manifest.postal_system.geometry_rule, /No nationwide.*Posts-authored.*noncanonical derived.*EKATTE.*Voronoi/i);
  assert.match(manifest.postal_system.special_code_rule, /PO-box.*organization.*non-area.*service-point.*polygon/i);
  assert.match(manifest.postal_system.address_rule, /GRAO.*CAIS.*exact released.*planning documents.*residence.*person/i);
  assert.match(manifest.postal_system.building_rule, /cadastral building identifier.*AGCC.*parcel.*independent object.*owner.*title/i);
  assert.match(manifest.postal_system.administrative_rule, /NSI EKATTE.*context only.*postcode.*address.*building/i);
  assert.match(manifest.postal_system.licence_rule, /Bulgarian Posts.*GRAO.*AGCC.*NSI.*INSPIRE.*not by itself unrestricted/i);
  assert.match(manifest.postal_system.crs_rule, /EPSG:9391.*WGS84.*reviewed versioned transform/i);
  assert.match(manifest.postal_system.territory_rule, /Bulgarian territory.*Postal assignment never determines sovereignty.*cross-border.*cannot fill/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('bulgarian-posts-presented-as-official-polygon-without-artifact'));
  assert.ok(manifest.promotion.hard_blockers.includes('address-register-roadmap-presented-as-production-receipt'));
  assert.ok(manifest.promotion.hard_blockers.includes('parcel-or-independent-object-presented-as-building'));
  assert.ok(manifest.promotion.hard_blockers.includes('owner-rightsholder-title-residence-or-person-data-published'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number'));
});

test('Bulgaria source policy separates Posts, GRAO, AGCC, INSPIRE, EKATTE and spatial administration', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const postcodes = sources.get('bulgarian-posts-postcode-reference');
  const offices = sources.get('bulgarian-posts-post-office-directory');
  const gisco = sources.get('eurostat-gisco-bulgaria-postcode-points-2025');
  const address = sources.get('grao-bulgaria-address-classifier');
  const cadastre = sources.get('agcc-bulgaria-cadastral-map');
  const buildings = sources.get('agcc-bulgaria-inspire-buildings');
  const ekatte = sources.get('nsi-bulgaria-ekatte');
  const administration = sources.get('nsi-bulgaria-administrative-spatial-data');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(postcodes?.assignment_authority, 'official_postal_operator_historical_open_data');
  assert.equal(postcodes?.geometry_authority, 'none');
  assert.ok(postcodes?.prohibited_claims.includes('postcode-row-is-polygon'));
  assert.equal(offices?.geometry_authority, 'service_point_only');
  assert.ok(offices?.prohibited_claims.includes('post-office-point-is-postcode-area'));
  assert.equal(gisco?.geometry_authority, 'postcode_point_only');
  assert.ok(gisco?.prohibited_claims.includes('gisco-point-is-postcode-polygon'));
  assert.equal(address?.redistribution_class, 'R3_controlled_or_contract');
  assert.ok(address?.prohibited_claims.includes('roadmap-is-production-address-record'));
  assert.equal(cadastre?.geometry_authority, 'source_qualified_cadastral_building_geometry');
  assert.ok(cadastre?.prohibited_claims.includes('parcel-is-building'));
  assert.ok(cadastre?.prohibited_claims.includes('owner-or-title-is-public-output'));
  assert.equal(buildings?.redistribution_class, 'R3_controlled_or_contract');
  assert.ok(buildings?.prohibited_claims.includes('inspire-label-is-unrestricted-license'));
  assert.equal(ekatte?.geometry_authority, 'none_or_separate_spatial_artifact');
  assert.ok(ekatte?.prohibited_claims.includes('ekatte-settlement-is-postcode-area'));
  assert.equal(administration?.geometry_authority, 'official_administrative_geometry');
  assert.ok(administration?.prohibited_claims.includes('administrative-polygon-is-postcode-polygon'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'postal-assignment'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'derived-postcode-surface'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'postal-point-validation'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'address'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'building'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'administration'));
});

test('Bulgaria fixtures use synthetic four-digit strings and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/bulgaria-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'BG');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_prefix, '000');
  assert.ok(postcodes.every(code => /^000[0-3]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('bg-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('bulgarian-posts-official-polygon'));
  assert.ok(prohibited.has('ekatte-settlement-is-postcode-area'));
  assert.ok(prohibited.has('postbox-has-polygon'));
  assert.ok(prohibited.has('address-access-point-is-building-footprint'));
  assert.ok(prohibited.has('nearest-building-is-exact-link'));
  assert.ok(prohibited.has('unit-identifies-person'));
  assert.ok(prohibited.has('owner-rightsholder-title-or-residence'));
});

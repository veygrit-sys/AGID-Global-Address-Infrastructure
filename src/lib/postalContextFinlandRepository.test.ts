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
const seedRoot = resolve(root, 'data/postal_country_packs/fi/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Finland seed separates Posti assignment, Paavo statistical geometry, address, building, and FI/AX evidence', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-fi');
  assert.equal(manifest.repository.country_code, 'FI');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.release_scope.fixtures_are_synthetic, true);
  assert.equal(manifest.postal_system.full_code_format, 'NNNNN');
  assert.match(manifest.postal_system.assignment_rule, /Posti.*five-digit.*Basic Address File.*Aland.*does not establish.*deliverability/i);
  assert.match(manifest.postal_system.paavo_rule, /annual statistical.*building-address.*may differ.*never a Posti delivery perimeter.*variant/i);
  assert.match(manifest.postal_system.special_code_rule, /PO-box.*corporate.*non-area.*Voronoi/i);
  assert.match(manifest.postal_system.address_rule, /DVV.*NLS.*interpolated.*not exact entrances.*resident.*owner/i);
  assert.match(manifest.postal_system.building_rule, /permanent building identifier.*Ryhti.*transition.*NLS.*proximity.*candidates/i);
  assert.match(manifest.postal_system.licence_rule, /Posti.*Statistics Finland.*DVV.*Ryhti.*NLS.*CC BY 4.0.*not by itself unrestricted/i);
  assert.match(manifest.postal_system.crs_rule, /EPSG:3067.*reviewed versioned transform.*Coastline-clipped.*sea-extended/i);
  assert.match(manifest.postal_system.territory_rule, /mainland Finland.*Aland.*excludes.*AX.*never.*silently merges/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('paavo-presented-as-posti-official-polygon'));
  assert.ok(manifest.promotion.hard_blockers.includes('nls-interpolated-road-address-presented-as-exact-entrance'));
  assert.ok(manifest.promotion.hard_blockers.includes('fi-and-ax-scope-silently-merged'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number'));
});

test('Finland source policy separates Posti, Paavo, DVV, Ryhti, NLS, administration, and Aland Post', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const postcodes = sources.get('posti-finland-postal-code-services');
  const basicAddress = sources.get('posti-finland-basic-address-file');
  const paavo = sources.get('statistics-finland-paavo-postal-areas');
  const dvv = sources.get('dvv-finland-building-dwelling-register');
  const ryhti = sources.get('syke-finland-ryhti-building-addresses');
  const road = sources.get('nls-finland-topographic-road-addresses');
  const building = sources.get('nls-finland-topographic-buildings');
  const administration = sources.get('nls-finland-municipal-division');
  const aland = sources.get('aland-post-postal-services');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(postcodes?.assignment_authority, 'official_postal_operator');
  assert.equal(postcodes?.geometry_authority, 'none');
  assert.ok(postcodes?.prohibited_claims.includes('postcode-row-is-polygon'));
  assert.equal(basicAddress?.geometry_authority, 'none');
  assert.ok(basicAddress?.prohibited_claims.includes('basic-address-file-covers-aland'));
  assert.equal(paavo?.geometry_authority, 'official_derived_statistical_geometry');
  assert.ok(paavo?.prohibited_claims.includes('paavo-is-delivery-perimeter'));
  assert.equal(dvv?.redistribution_class, 'R3_controlled_or_contract');
  assert.ok(dvv?.prohibited_claims.includes('dwelling-identifies-occupant'));
  assert.equal(ryhti?.geometry_authority, 'official_source_qualified_building_geometry');
  assert.ok(ryhti?.prohibited_claims.includes('transition-coverage-is-national-completeness'));
  assert.equal(road?.geometry_authority, 'calculated_or_interpolated_road_location');
  assert.ok(road?.prohibited_claims.includes('road-interpolation-is-exact-entrance'));
  assert.equal(building?.geometry_authority, 'official_topographic_building_geometry');
  assert.ok(building?.prohibited_claims.includes('nearest-building-is-exact-address-link'));
  assert.equal(administration?.geometry_authority, 'official_administrative_geometry');
  assert.ok(administration?.prohibited_claims.includes('municipality-is-postcode-area'));
  assert.equal(aland?.geometry_authority, 'none');
  assert.ok(aland?.prohibited_claims.includes('fi-and-ax-silently-merged'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'postal-assignment'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'statistical-postcode-area'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'address-and-unit'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'building'));
});

test('Finland fixtures use synthetic five-digit strings and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/finland-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'FI');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_prefix, '0000');
  assert.ok(postcodes.every(code => /^0000[0-3]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('fi-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('posti-official-polygon'));
  assert.ok(prohibited.has('paavo-is-delivery-perimeter'));
  assert.ok(prohibited.has('postbox-has-polygon'));
  assert.ok(prohibited.has('road-interpolation-is-entrance'));
  assert.ok(prohibited.has('nearest-building-is-exact-link'));
  assert.ok(prohibited.has('unit-identifies-occupant'));
  assert.ok(prohibited.has('fi-and-ax-silently-merged'));
});

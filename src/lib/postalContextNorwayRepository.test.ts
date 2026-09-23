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
    category_rule: string;
    postcode_area_rule: string;
    address_rule: string;
    unit_rule: string;
    building_point_rule: string;
    building_footprint_rule: string;
    licence_rule: string;
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
  };
  fixtures: Array<{
    fixture_id: string;
    synthetic_address: { postcode?: string };
    evidence: Array<{ assignment_authority: string; geometry_authority: string }>;
    expected: { must_not_assert: string[] };
  }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/no/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Norway seed separates postcode category, official area, address, unit, building point, and footprint', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-no');
  assert.equal(manifest.repository.country_code, 'NO');
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
  assert.equal(manifest.postal_system.full_code_name, 'Postnummer');
  assert.equal(manifest.postal_system.full_code_format, 'NNNN');
  assert.equal(manifest.postal_system.full_code_default_geometry, 'official_kartverket_postcode_area_or_postbox_or_special_non_area');
  assert.match(manifest.postal_system.category_rule, /G.*street addresses.*P.*post-office boxes.*B.*both.*S.*special service.*no area/i);
  assert.match(manifest.postal_system.postcode_area_rule, /official areal extent.*post-office-box codes are additional.*municipality.*Voronoi.*never substitute/i);
  assert.match(manifest.postal_system.address_rule, /official address identity.*postcode-district.*address point is not a building footprint/i);
  assert.match(manifest.postal_system.unit_rule, /addressId plus bruksenhetId.*composite.*not occupant.*household/i);
  assert.match(manifest.postal_system.building_point_rule, /building number.*representation point.*not footprint/i);
  assert.match(manifest.postal_system.building_footprint_rule, /FKB-Bygning.*1:1.*building number.*private-purchase.*proximity.*candidate/i);
  assert.match(manifest.postal_system.licence_rule, /CC BY 4\.0.*NLOD is not assumed.*Posten.*FKB.*separately/i);
  assert.match(manifest.postal_system.territory_rule, /mainland Norway.*Svalbard.*Jan Mayen.*21.*22.*ISO SJ.*NO/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('post-office-box-or-special-code-given-invented-polygon'));
  assert.ok(manifest.promotion.hard_blockers.includes('fkb-visibility-presented-as-open-redistribution-right'));
  assert.ok(manifest.promotion.hard_blockers.includes('no-and-sj-records-silently-merged'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number'));
});

test('Norway source policy separates Posten, postcode areas, address API, Matrikkelen, FKB, and administration', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const posten = sources.get('posten-bring-norway-postcode-register');
  const areas = sources.get('kartverket-norway-postcode-areas');
  const api = sources.get('kartverket-norway-address-api');
  const address = sources.get('kartverket-norway-matrikkelen-address');
  const unit = sources.get('kartverket-norway-matrikkelen-address-unit');
  const buildingPoint = sources.get('kartverket-norway-matrikkelen-building-points');
  const fkb = sources.get('geovekst-norway-fkb-buildings');
  const administration = sources.get('kartverket-norway-administrative-units');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(posten?.assignment_authority, 'official_postal_operator');
  assert.equal(posten?.geometry_authority, 'none');
  assert.equal(posten?.redistribution_class, 'R3_controlled_or_contract');
  assert.ok(posten?.prohibited_claims.includes('postcode-row-is-polygon'));
  assert.equal(areas?.geometry_authority, 'official_kartverket_postcode_area');
  assert.equal(areas?.redistribution_class, 'R2_cc_by_4_0');
  assert.ok(areas?.prohibited_claims.includes('all-postcodes-have-area'));
  assert.equal(api?.geometry_authority, 'official_address_point');
  assert.ok(api?.prohibited_claims.includes('api-query-is-bulk-redistribution-right'));
  assert.equal(address?.assignment_authority, 'official_matrikkelen_address');
  assert.ok(address?.prohibited_claims.includes('address-point-is-building-footprint'));
  assert.equal(unit?.assignment_authority, 'official_matrikkelen_unit_address');
  assert.ok(unit?.prohibited_claims.includes('unit-number-identifies-occupant'));
  assert.equal(buildingPoint?.geometry_authority, 'official_building_representation_point');
  assert.ok(buildingPoint?.prohibited_claims.includes('building-point-is-footprint'));
  assert.equal(fkb?.geometry_authority, 'licensed_fkb_building_geometry');
  assert.equal(fkb?.redistribution_class, 'R3_controlled_or_contract');
  assert.ok(fkb?.prohibited_claims.includes('private-actor-access-is-free'));
  assert.equal(administration?.geometry_authority, 'official_administrative_geometry');
  assert.ok(administration?.prohibited_claims.includes('municipality-is-postcode-area'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'official-postcode-area-or-non-area'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'building-point-and-footprint'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'administration-and-territory'));
});

test('Norway fixtures use synthetic four-digit strings and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/norway-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'NO');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_prefix, '000');
  assert.ok(postcodes.every(code => /^000[0-3]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('no-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('postbox-code-has-polygon'));
  assert.ok(prohibited.has('building-point-is-footprint'));
  assert.ok(prohibited.has('nearest-footprint-is-exact-link'));
  assert.ok(prohibited.has('unit-identifies-occupant'));
  assert.ok(prohibited.has('no-and-sj-silently-merged'));
  assert.ok(prohibited.has('deliverability'));
});

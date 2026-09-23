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
const seedRoot = resolve(root, 'data/postal_country_packs/de/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Germany seed remains metadata-only with postcode, address point, and building separated', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-de');
  assert.equal(manifest.repository.country_code, 'DE');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.deepEqual(
    manifest.release_scope,
    {
      metadata_only: true,
      contains_raw_source_data: false,
      contains_real_addresses: false,
      contains_personal_data: false,
      contains_production_geometry: false,
      fixtures_are_synthetic: true,
      publication_claim: 'contract-seed-only',
    },
  );
  assert.equal(manifest.postal_system.full_code_name, 'PLZ5');
  assert.equal(manifest.postal_system.full_code_format, 'NNNNN');
  assert.equal(
    manifest.postal_system.full_code_default_geometry,
    'licensed_delivery_postcode_area_or_non_area',
  );
  assert.match(manifest.postal_system.postcode_area_rule, /Deutsche Post Direkt.*BKG PLZ/i);
  assert.match(manifest.postal_system.address_rule, /GA or HK-DE.*not a building footprint/i);
  assert.match(manifest.postal_system.building_rule, /object identifier.*explicit crosswalk/i);
  assert.match(manifest.postal_system.territory_rule, /Austrian.*cross-border/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('special-postcode-given-invented-polygon'));
  assert.ok(manifest.promotion.hard_blockers.includes('building-proximity-presented-as-exact-link'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number'));
});

test('Germany source policy separates operator, PLZ geometry, address, building, and admin authority', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const datafactory = sources.get('deutsche-post-datafactory');
  const postcodeAreas = sources.get('bkg-postleitzahlgebiete');
  const addresses = sources.get('bkg-georeferenced-addresses');
  const houseCoordinates = sources.get('adv-hk-de');
  const footprints = sources.get('adv-hu-de');
  const lod2 = sources.get('bkg-lod2-de');
  const boundaries = sources.get('bkg-vg25');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(datafactory?.assignment_authority, 'official_postal_operator');
  assert.equal(datafactory?.redistribution_class, 'R5_contract_partitioned');
  assert.ok(datafactory?.prohibited_claims.includes('unrestricted-datafactory-redistribution'));
  assert.equal(postcodeAreas?.geometry_authority, 'licensed_operator_delivery_postcode_geometry');
  assert.ok(postcodeAreas?.prohibited_claims.includes('all-valid-postcodes-have-area'));
  assert.equal(addresses?.geometry_authority, 'official_house_coordinate_point');
  assert.ok(addresses?.prohibited_claims.includes('house-coordinate-is-building-footprint'));
  assert.equal(houseCoordinates?.geometry_authority, 'official_cadastral_house_coordinate');
  assert.ok(houseCoordinates?.prohibited_claims.includes('coordinate-proximity-is-building-identity'));
  assert.equal(footprints?.assignment_authority, 'none');
  assert.ok(footprints?.prohibited_claims.includes('same-ags-means-same-building'));
  assert.equal(lod2?.geometry_authority, 'official_3d_building_geometry');
  assert.ok(lod2?.prohibited_claims.includes('nearby-model-is-exact-address-link'));
  assert.equal(boundaries?.geometry_authority, 'official_administrative_geometry');
  assert.ok(boundaries?.prohibited_claims.includes('postcode-area-geometry'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'deutsche-post-contract-products'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'germany-state-rights-matrix'));
});

test('Germany fixtures use test-only five-digit codes and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/germany-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'DE');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_prefix, '0000');
  assert.ok(postcodes.every(code => /^0000[0-4]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('de-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('synthetic-residential-polygon'));
  assert.ok(prohibited.has('house-coordinate-is-building-footprint'));
  assert.ok(prohibited.has('deutsche-post-official-polygon'));
  assert.ok(prohibited.has('foreign-routing-area-is-german-territory'));
  assert.ok(prohibited.has('deliverability'));
});

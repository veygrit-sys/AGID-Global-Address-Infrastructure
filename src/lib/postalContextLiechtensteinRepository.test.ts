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
    observed_release?: {
      version: string;
      retrieved_at: string;
      shapefile_zip_digest: string;
      csv_zip_digest: string;
      source_polygon_records: number;
      li_csv_rows: number;
      li_domicile_polygons: number;
    };
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
    plz6_rule: string;
    m2_geometry_rule: string;
    address_rule: string;
    building_rule: string;
    territory_rule: string;
  };
  promotion: { current_stage: string; stages: Array<{ id: string; definition: string }>; hard_blockers: string[] };
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
const seedRoot = resolve(root, 'data/postal_country_packs/li/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Liechtenstein M2 repository publishes only current LI domicile postcode areas', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-li');
  assert.equal(manifest.repository.country_code, 'LI');
  assert.equal(manifest.repository.maturity, 'M2_experimental');
  assert.deepEqual(manifest.release_scope, {
    metadata_only: false,
    contains_raw_source_data: false,
    contains_real_addresses: false,
    contains_personal_data: false,
    contains_production_geometry: true,
    fixtures_are_synthetic: true,
    publication_claim: 'current-swisstopo-plzo-li-domicile-area-runtime',
  });
  assert.equal(manifest.postal_system.full_code_name, 'Postleitzahl (PLZ4)');
  assert.equal(manifest.postal_system.full_code_format, '94NN');
  assert.equal(manifest.postal_system.full_code_default_geometry, 'official_domicile_postcode_perimeter_or_non_area');
  assert.match(manifest.postal_system.plz6_rule, /PLZ6.*separately/i);
  assert.match(manifest.postal_system.m2_geometry_rule, /2026-08-11.*13.*BFS.*7001-7011.*ZIP_ID.*EPSG:4326/i);
  assert.match(manifest.postal_system.address_rule, /Gebäudeidentifikator.*does not replace Swiss Post/i);
  assert.match(manifest.postal_system.building_rule, /official building identifier.*proximity.*candidates/i);
  assert.match(manifest.postal_system.territory_rule, /Switzerland.*Austria.*LI/i);
  assert.equal(manifest.promotion.current_stage, 'M2_current_swisstopo_plzo_li_domicile_visualization');
  assert.ok(manifest.promotion.stages.some(stage => stage.id === manifest.promotion.current_stage && /API.*map.*translucent/i.test(stage.definition)));
  assert.ok(manifest.promotion.hard_blockers.includes('swiss-or-austrian-feature-published-in-li-pack'));
  assert.ok(manifest.promotion.hard_blockers.includes('building-proximity-presented-as-exact-identifier-link'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number'));
});

test('Liechtenstein source policy separates postal, PLZO, address, building, and boundary authority', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const swissPost = sources.get('swiss-post-postcodes');
  const plzo = sources.get('swisstopo-plzo-postal-localities');
  const localPost = sources.get('liechtenstein-post-access-points');
  const addresses = sources.get('llv-liechtenstein-building-addresses');
  const gwr = sources.get('llv-liechtenstein-gwr-public');
  const survey = sources.get('llv-liechtenstein-official-survey');
  const boundary = sources.get('llv-liechtenstein-sovereign-boundaries');

  assert.equal(profile.artifact_scope, 'current-swisstopo-plzo-li-domicile-area-runtime');
  assert.equal(profile.sources.filter(source => source.bundled_here).map(source => source.source_id).join(','), 'swisstopo-plzo-postal-localities');
  assert.equal(swissPost?.assignment_authority, 'official_postal_operator');
  assert.equal(swissPost?.redistribution_class, 'R4_contract_partitioned');
  assert.ok(swissPost?.prohibited_claims.includes('unrestricted-geopost-redistribution'));
  assert.equal(plzo?.geometry_authority, 'official_public_postal_locality_geometry');
  assert.equal(plzo?.observed_release?.version, 'STAC item 2026-08-11; assets updated 2026-08-11');
  assert.equal(plzo?.observed_release?.shapefile_zip_digest, 'sha256:a58e105be27c1b4f4797ccbb5765861711ada593163059969c49a33489e0a60a');
  assert.equal(plzo?.observed_release?.csv_zip_digest, 'sha256:0542e70aaf2890a5e48d8bb22e2aec233a413bc26a8420d506551ac3a1af1e26');
  assert.equal(plzo?.observed_release?.source_polygon_records, 4073);
  assert.equal(plzo?.observed_release?.li_csv_rows, 20);
  assert.equal(plzo?.observed_release?.li_domicile_polygons, 13);
  assert.ok(plzo?.prohibited_claims.includes('ch-row-is-li-from-shared-source-alone'));
  assert.equal(localPost?.geometry_authority, 'official_facility_point_when_published');
  assert.ok(localPost?.prohibited_claims.includes('facility-is-residential-area'));
  assert.equal(addresses?.geometry_authority, 'official_cadastral_address_point');
  assert.ok(addresses?.prohibited_claims.includes('address-point-is-building-footprint'));
  assert.equal(gwr?.assignment_authority, 'official_national_building_register');
  assert.ok(gwr?.prohibited_claims.includes('dwelling-or-occupant-context'));
  assert.equal(survey?.geometry_authority, 'official_cadastral_geometry');
  assert.ok(survey?.prohibited_claims.includes('nearest-building-is-exact-address-link'));
  assert.equal(boundary?.geometry_authority, 'official_sovereign_geometry');
  assert.ok(boundary?.prohibited_claims.includes('postcode-boundary'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'ch-li-at-territory-boundary'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'private-and-sensitive'));
});

test('Liechtenstein fixtures use synthetic 94xx strings and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/liechtenstein-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'LI');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '940');
  assert.ok(postcodes.every(code => /^940[0-3]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('li-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('deliverability'));
  assert.ok(prohibited.has('nearest-building-is-exact-link'));
  assert.ok(prohibited.has('endpoint-is-residential-area'));
  assert.ok(prohibited.has('switzerland-is-liechtenstein'));
  assert.ok(prohibited.has('austria-is-liechtenstein'));
});

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
  repository: {
    name: string;
    country_code: string;
    maturity: string;
  };
  release_scope: {
    metadata_only: boolean;
    contains_raw_source_data: boolean;
    contains_real_addresses: boolean;
    contains_personal_data: boolean;
    contains_production_geometry: boolean;
    fixtures_are_synthetic: boolean;
  };
  postal_system: {
    full_code_name: string;
    full_code_format: string;
    full_code_default_geometry: string;
    ons_coordinate_rule: string;
    northern_ireland_rule: string;
  };
  promotion: {
    current_stage: string;
    stages: Array<{ id: string; definition: string }>;
    hard_blockers: string[];
  };
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
    synthetic_address: { postal_code?: string };
    evidence: Array<{
      assignment_authority: string;
      geometry_authority: string;
    }>;
    expected: { must_not_assert: string[] };
  }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/gb/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('United Kingdom seed remains metadata-only with unit assignment and geometry separated', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-gb');
  assert.equal(manifest.repository.country_code, 'GB');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.deepEqual(
    {
      metadata_only: manifest.release_scope.metadata_only,
      contains_raw_source_data: manifest.release_scope.contains_raw_source_data,
      contains_real_addresses: manifest.release_scope.contains_real_addresses,
      contains_personal_data: manifest.release_scope.contains_personal_data,
      contains_production_geometry: manifest.release_scope.contains_production_geometry,
      fixtures_are_synthetic: manifest.release_scope.fixtures_are_synthetic,
    },
    {
      metadata_only: true,
      contains_raw_source_data: false,
      contains_real_addresses: false,
      contains_personal_data: false,
      contains_production_geometry: false,
      fixtures_are_synthetic: true,
    },
  );
  assert.equal(manifest.postal_system.full_code_name, 'unit_postcode');
  assert.equal(manifest.postal_system.full_code_format, 'OUTWARD INWARD');
  assert.equal(
    manifest.postal_system.full_code_default_geometry,
    'delivery_point_group_with_optional_derived_area',
  );
  assert.match(manifest.postal_system.ons_coordinate_rule, /not exact delivery points/i);
  assert.match(manifest.postal_system.northern_ireland_rule, /separate.*rights gate/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes(
    'derived-area-presented-as-royal-mail-boundary',
  ));
});

test('United Kingdom source policy separates assignment, centroid, UPRN, and building authority', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const paf = sources.get('royal-mail-paf');
  const onspd = sources.get('ons-postcode-directory');
  const uprn = sources.get('ordnance-survey-open-uprn');
  const buildings = sources.get('ordnance-survey-openmap-local');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(paf?.assignment_authority, 'official_postal_operator');
  assert.equal(paf?.geometry_authority, 'none');
  assert.equal(paf?.redistribution_class, 'R3_licensed_product');
  assert.ok(paf?.prohibited_claims.includes('official-royal-mail-polygon'));
  assert.equal(onspd?.geometry_authority, 'official_mapping_geometry');
  assert.ok(onspd?.prohibited_claims.includes('exact-delivery-point'));
  assert.equal(uprn?.assignment_authority, 'official_address_registry');
  assert.ok(uprn?.prohibited_claims.includes('full-address-record'));
  assert.equal(buildings?.assignment_authority, 'none');
  assert.ok(buildings?.prohibited_claims.includes('exact-uprn-building-link'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'onspd-bt-rights-gated'));
});

test('United Kingdom fixtures are non-geographic and never promotion evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/united-kingdom-synthetic.json');
  const postalCodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postal_code)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'GB');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_prefix, 'ZZ0');
  assert.ok(postalCodes.every(code => /^ZZ0 0Z[A-Z]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('gb-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('official-royal-mail-polygon'));
  assert.ok(prohibited.has('derived-is-royal-mail-official'));
  assert.ok(prohibited.has('bt-commercial-reuse-authorized'));
  assert.ok(prohibited.has('occupant-or-recipient'));
  assert.ok(prohibited.has('deliverability'));
});


test('United Kingdom M2 source audit keeps points, licensed GB polygons, and BT scope separate', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const openPoints = sources.get('ordnance-survey-code-point-open');
  const licensedPolygons = sources.get('ordnance-survey-code-point-with-polygons');
  const niPoints = sources.get('ordnance-survey-ni-postcodes');

  assert.equal(openPoints?.redistribution_class, 'R1_open_attribution');
  assert.equal(openPoints?.geometry_authority, 'official_mapping_geometry');
  assert.ok(openPoints?.prohibited_claims.includes('unit-postcode-polygon'));
  assert.equal(licensedPolygons?.redistribution_class, 'R3_licensed_product');
  assert.equal(licensedPolygons?.geometry_authority, 'derived_geometry');
  assert.ok(licensedPolygons?.prohibited_claims.includes('northern-ireland-coverage'));
  assert.equal(niPoints?.redistribution_class, 'R3_licensed_product');
  assert.ok(niPoints?.prohibited_claims.includes('unit-postcode-polygon'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'os-unit-postcode-polygons-licensed-gb'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'bt-unit-postcode-polygon-unavailable'));
  assert.ok(manifest.promotion.hard_blockers.includes('open-postcode-point-presented-as-polygon'));
  assert.ok(manifest.promotion.hard_blockers.includes('licensed-code-point-polygons-published-without-rights'));
  assert.ok(manifest.promotion.hard_blockers.includes('northern-ireland-polygon-coverage-assumed'));
});

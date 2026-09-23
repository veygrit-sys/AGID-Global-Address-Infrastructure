import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Authority =
  | 'official_postal_operator'
  | 'official_address_registry'
  | 'official_municipal_civic_address'
  | 'official_land_registry'
  | 'derived_spatial_assignment'
  | 'synthetic_fixture_assignment'
  | 'none';

type GeometryAuthority =
  | 'official_postal_geometry'
  | 'official_address_registry_geometry'
  | 'official_municipal_civic_geometry'
  | 'official_cadastral_geometry'
  | 'official_mapping_geometry'
  | 'official_3d_city_model_geometry'
  | 'derived_geometry'
  | 'synthetic_fixture_geometry'
  | 'none';

type RepositoryManifest = {
  repository: {
    name: string;
    country_code: string;
    lifecycle: string;
  };
  release_scope: {
    metadata_only: boolean;
    contains_raw_source_data: boolean;
    contains_real_addresses: boolean;
    contains_personal_data: boolean;
    contains_production_geometry: boolean;
    fixtures_are_synthetic: boolean;
  };
  authority_model: {
    required_fields: string[];
    assignment_authority_values: string[];
    geometry_authority_values: string[];
  };
  exception_classes: Array<{ id: string; rule: string }>;
  promotion: {
    current_stage: string;
    hard_blockers: string[];
  };
};

type SourceProfile = {
  artifact_scope: string;
  sources: Array<{
    source_id: string;
    assignment_authority: Authority;
    geometry_authority: GeometryAuthority;
    bundled_here: boolean;
    prohibited_claims: string[];
  }>;
};

type FixturePack = {
  synthetic: boolean;
  promotion_eligible: boolean;
  fixture_policy: {
    contains_real_addresses: boolean;
    contains_upstream_rows: boolean;
    contains_personal_data: boolean;
    coordinates_are_geographic: boolean;
  };
  fixtures: Array<{
    fixture_id: string;
    exception_class: string;
    evidence: Array<{
      assignment_authority: Authority;
      geometry_authority: GeometryAuthority;
    }>;
    expected: {
      must_not_assert: string[];
    };
  }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/jp/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Japan Postal Context seed remains metadata-only and external-repository ready', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-jp');
  assert.equal(manifest.repository.country_code, 'JP');
  assert.equal(manifest.repository.lifecycle, 'planned_external_repository');
  assert.deepEqual(manifest.release_scope, {
    metadata_only: true,
    contains_raw_source_data: false,
    contains_real_addresses: false,
    contains_personal_data: false,
    contains_production_geometry: false,
    fixtures_are_synthetic: true,
    publication_claim: 'contract-seed-only',
  });
  assert.ok(manifest.authority_model.required_fields.includes('assignment_authority'));
  assert.ok(manifest.authority_model.required_fields.includes('geometry_authority'));
  assert.ok(manifest.authority_model.assignment_authority_values.includes('virtual_assignment'));
  assert.ok(manifest.authority_model.geometry_authority_values.includes('virtual_geometry'));
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('building_name_inferred_from_proximity_only'));
});

test('Japan source roles never copy assignment authority into geometry authority', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const byId = new Map(profile.sources.map(source => [source.source_id, source]));

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.deepEqual(
    [
      byId.get('jp-post-postal-code-data')?.assignment_authority,
      byId.get('jp-post-postal-code-data')?.geometry_authority,
    ],
    ['official_postal_operator', 'none'],
  );
  assert.deepEqual(
    [
      byId.get('mlit-plateau-building-models')?.assignment_authority,
      byId.get('mlit-plateau-building-models')?.geometry_authority,
    ],
    ['none', 'official_3d_city_model_geometry'],
  );
  assert.ok(
    byId.get('jp-post-postal-code-data')?.prohibited_claims.includes('official_postal_polygon'),
  );
  assert.ok(
    byId.get('mlit-plateau-building-models')?.prohibited_claims.includes(
      'building_name_when-name-attribute-is-absent',
    ),
  );
});

test('Tokyo-like fixtures are synthetic, non-geographic, and never promotion evidence', () => {
  const fixturePack = readJson<FixturePack>('fixtures/tokyo-synthetic.json');

  assert.equal(fixturePack.synthetic, true);
  assert.equal(fixturePack.promotion_eligible, false);
  assert.deepEqual(fixturePack.fixture_policy, {
    contains_real_addresses: false,
    contains_upstream_rows: false,
    contains_personal_data: false,
    postal_prefix: '000',
    postal_prefix_is_test_only: true,
    coordinate_reference_system: 'AGID_SYNTHETIC_LOCAL_GRID_V1',
    coordinates_are_geographic: false,
    names_with_prefix: '架空',
    rule: 'No value in this fixture may be interpreted as a real Japanese address, official assignment, or production geometry.',
  });

  const classes = new Set(fixturePack.fixtures.map(fixture => fixture.exception_class));
  assert.deepEqual(
    [...classes].sort(),
    ['cadastral', 'large_user', 'partial_town', 'regular_whole_town', 'residential_display'],
  );
  assert.ok(fixturePack.fixtures.every(fixture => fixture.fixture_id.startsWith('jp-syn-')));
  assert.ok(fixturePack.fixtures.every(fixture =>
    fixture.evidence.every(evidence =>
      ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
      && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority)),
  ));

  const prohibitedClaims = new Set(
    fixturePack.fixtures.flatMap(fixture => fixture.expected.must_not_assert),
  );
  assert.ok(prohibitedClaims.has('neighborhood_postal_area'));
  assert.ok(prohibitedClaims.has('residence_number_equals_land_number'));
  assert.ok(prohibitedClaims.has('building_name_when_source_name_is_absent'));
  assert.ok(prohibitedClaims.has('deliverability'));
});

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
    full_code_format: string;
    full_code_default_geometry: string;
    postal_sector_prefix_digits: number;
    voronoi_rule: string;
  };
  promotion: {
    current_stage: string;
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
    exception_class: string;
    synthetic_address: {
      postal_code?: string;
      member_postal_codes?: string[];
      postal_code_candidates?: string[];
    };
    evidence: Array<{
      assignment_authority: string;
      geometry_authority: string;
    }>;
    expected: {
      must_not_assert: string[];
    };
  }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/sg/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Singapore seed remains metadata-only and delivery-point-first', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-sg');
  assert.equal(manifest.repository.country_code, 'SG');
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
  assert.equal(manifest.postal_system.full_code_format, 'NNNNNN');
  assert.equal(manifest.postal_system.full_code_default_geometry, 'point_or_none');
  assert.equal(manifest.postal_system.postal_sector_prefix_digits, 2);
  assert.match(manifest.postal_system.voronoi_rule, /never official postal geometry/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes(
    'six-digit-delivery-point-expanded-to-neighborhood-polygon',
  ));
});

test('Singapore source policy separates SingPost subscription and OneMap API rights', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const singPost = sources.get('singpost-six-digit-postal-database');
  const oneMap = sources.get('sla-onemap-search-and-reverse-geocode');
  const openDwelling = sources.get('data-gov-sg-sla-dwelling-information');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(singPost?.assignment_authority, 'official_postal_operator');
  assert.equal(singPost?.geometry_authority, 'none');
  assert.equal(singPost?.redistribution_class, 'R4_contract_or-validation-only');
  assert.ok(singPost?.prohibited_claims.includes('official-postal-polygon'));
  assert.equal(oneMap?.assignment_authority, 'official_address_registry');
  assert.equal(oneMap?.geometry_authority, 'official_mapping_geometry');
  assert.equal(oneMap?.redistribution_class, 'R3_api_agreement_required');
  assert.ok(oneMap?.prohibited_claims.includes('nearest-result-is-exact'));
  assert.equal(openDwelling?.redistribution_class, 'R1_open_attribution');
  assert.ok(openDwelling?.prohibited_claims.includes('complete-six-digit-postal-database'));
});

test('Singapore fixtures are non-geographic synthetic codes and never promotion evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/singapore-synthetic.json');
  const postalCodes = pack.fixtures.flatMap(fixture => [
    fixture.synthetic_address.postal_code,
    ...(fixture.synthetic_address.member_postal_codes ?? []),
    ...(fixture.synthetic_address.postal_code_candidates ?? []),
  ]).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'SG');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_prefix, '000');
  assert.ok(postalCodes.every(code => /^000\d{3}$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('sg-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('official-full-code-polygon'));
  assert.ok(prohibited.has('unit-or-occupant'));
  assert.ok(prohibited.has('nearest-is-exact'));
  assert.ok(prohibited.has('deliverability'));
});

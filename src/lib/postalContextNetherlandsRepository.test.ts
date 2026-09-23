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
    full_code_name: string;
    full_code_format: string;
    full_code_default_geometry: string;
    pc4_prefix_digits: number;
    cbs_geometry_rule: string;
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
    synthetic_address: {
      postal_code?: string;
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
const seedRoot = resolve(root, 'data/postal_country_packs/nl/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Netherlands seed remains metadata-only with PC6 and PC4 separated', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-nl');
  assert.equal(manifest.repository.country_code, 'NL');
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
  assert.equal(manifest.postal_system.full_code_name, 'PC6');
  assert.equal(manifest.postal_system.full_code_format, 'NNNN AA');
  assert.equal(
    manifest.postal_system.full_code_default_geometry,
    'address_range_with_optional_derived_area',
  );
  assert.equal(manifest.postal_system.pc4_prefix_digits, 4);
  assert.match(manifest.postal_system.cbs_geometry_rule, /derived geometry/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes(
    'cbs-derived-area-presented-as-official-postnl-boundary',
  ));
});

test('Netherlands source policy separates PostNL, BAG, and CBS authority', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const postnl = sources.get('postnl-postcode-table');
  const bag = sources.get('kadaster-pdok-bag-ogc-v2');
  const cbs = sources.get('cbs-esri-postcode-statistics-areas');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(postnl?.assignment_authority, 'official_postal_operator');
  assert.equal(postnl?.geometry_authority, 'none');
  assert.equal(postnl?.redistribution_class, 'R4_contract_or-validation-only');
  assert.ok(postnl?.prohibited_claims.includes('official-postnl-polygon'));
  assert.equal(bag?.assignment_authority, 'official_address_registry');
  assert.equal(bag?.geometry_authority, 'official_address_registry_geometry');
  assert.equal(bag?.redistribution_class, 'R1_public_domain');
  assert.ok(bag?.prohibited_claims.includes('official-postnl-assignment'));
  assert.equal(cbs?.assignment_authority, 'none');
  assert.equal(cbs?.geometry_authority, 'derived_geometry');
  assert.equal(cbs?.redistribution_class, 'R2_open_attribution');
  assert.ok(cbs?.prohibited_claims.includes('official-postnl-polygon'));
});

test('Netherlands fixtures are non-geographic and never promotion evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/netherlands-synthetic.json');
  const postalCodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postal_code)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'NL');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_prefix, '0000');
  assert.ok(postalCodes.every(code => /^0000 [A-Z]{2}$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('nl-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('official-postnl-polygon'));
  assert.ok(prohibited.has('cbs-derived-is-postnl-official'));
  assert.ok(prohibited.has('occupant-or-recipient'));
  assert.ok(prohibited.has('deliverability'));
});

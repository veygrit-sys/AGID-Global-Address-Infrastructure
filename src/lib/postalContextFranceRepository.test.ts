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
  };
  postal_system: {
    full_code_name: string;
    full_code_format: string;
    full_code_default_geometry: string;
    commune_rule: string;
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
    synthetic_address: { postal_code?: string };
    evidence: Array<{ assignment_authority: string; geometry_authority: string }>;
    expected: { must_not_assert: string[] };
  }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/fr/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('France seed remains metadata-only with postal assignment and geometry separated', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-fr');
  assert.equal(manifest.repository.country_code, 'FR');
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
  assert.equal(manifest.postal_system.full_code_name, 'code_postal');
  assert.equal(manifest.postal_system.full_code_format, 'NNNNN');
  assert.equal(
    manifest.postal_system.full_code_default_geometry,
    'routing_locality_with_optional_derived_area',
  );
  assert.match(manifest.postal_system.commune_rule, /separate evidence/i);
  assert.match(manifest.postal_system.territory_rule, /separate from overseas/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes(
    'derived-area-presented-as-la-poste-boundary',
  ));
});

test('France source policy separates La Poste, BAN, BD TOPO, and COG authority', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const laPoste = sources.get('la-poste-base-officielle-codes-postaux');
  const ban = sources.get('ban-fr');
  const bdTopo = sources.get('ign-bd-topo-ban-links');
  const cog = sources.get('insee-cog');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(laPoste?.assignment_authority, 'official_postal_operator');
  assert.equal(laPoste?.geometry_authority, 'none');
  assert.ok(laPoste?.prohibited_claims.includes('official-la-poste-polygon'));
  assert.equal(ban?.assignment_authority, 'official_address_registry');
  assert.equal(ban?.geometry_authority, 'official_address_registry_geometry');
  assert.ok(ban?.prohibited_claims.includes('exact-building-from-nearest-point'));
  assert.equal(bdTopo?.geometry_authority, 'official_mapping_geometry');
  assert.ok(bdTopo?.prohibited_claims.includes('exact-link-from-proximity-only'));
  assert.equal(cog?.geometry_authority, 'none');
  assert.ok(cog?.prohibited_claims.includes('postal-assignment-authority'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'overseas-and-monaco'));
});

test('France fixtures are non-geographic and never promotion evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/france-synthetic.json');
  const postalCodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postal_code)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'FR');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_prefix, '000');
  assert.ok(postalCodes.every(code => /^0000[0-4]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('fr-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('official-la-poste-polygon'));
  assert.ok(prohibited.has('derived-is-la-poste-official'));
  assert.ok(prohibited.has('commune-centroid-is-address'));
  assert.ok(prohibited.has('occupant-or-recipient'));
  assert.ok(prohibited.has('deliverability'));
});

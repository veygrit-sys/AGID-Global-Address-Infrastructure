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
    rural_delivery_rule: string;
    box_bag_rule: string;
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
const seedRoot = resolve(root, 'data/postal_country_packs/nz/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('New Zealand seed remains metadata-only with network and premise evidence separated', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-nz');
  assert.equal(manifest.repository.country_code, 'NZ');
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
  assert.equal(manifest.postal_system.full_code_name, 'postcode');
  assert.equal(manifest.postal_system.full_code_format, 'NNNN');
  assert.equal(
    manifest.postal_system.full_code_default_geometry,
    'delivery_network_area_or_non_area',
  );
  assert.match(manifest.postal_system.rural_delivery_rule, /mailtown.*physical locality/i);
  assert.match(manifest.postal_system.box_bag_rule, /non-areal/i);
  assert.match(manifest.postal_system.territory_rule, /independent ISO packs/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('unlicensed-pnf-or-paf-published'));
  assert.ok(manifest.promotion.hard_blockers.includes('leading-zero-dropped'));
});

test('New Zealand source policy separates NZ Post, LINZ, and Stats NZ authority', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const pnf = sources.get('nz-post-pnf');
  const paf = sources.get('nz-post-paf-address-checker');
  const addresses = sources.get('linz-nz-addresses');
  const buildings = sources.get('linz-nz-building-outlines');
  const stats = sources.get('stats-nz-geographic-boundaries');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(pnf?.assignment_authority, 'official_postal_operator');
  assert.equal(pnf?.geometry_authority, 'official_postal_network_geometry');
  assert.equal(pnf?.redistribution_class, 'R2_nz_post_licensed');
  assert.equal(paf?.redistribution_class, 'R3_api_restricted_validation');
  assert.ok(paf?.prohibited_claims.includes('unrestricted-api-cache'));
  assert.equal(addresses?.assignment_authority, 'official_address_registry');
  assert.equal(addresses?.geometry_authority, 'official_address_registry_geometry');
  assert.ok(addresses?.prohibited_claims.includes('nz-post-postcode-assignment'));
  assert.equal(buildings?.assignment_authority, 'none');
  assert.ok(buildings?.prohibited_claims.includes('exact-address-link-from-proximity'));
  assert.equal(stats?.geometry_authority, 'official_statistical_geometry');
  assert.ok(stats?.prohibited_claims.includes('postcode-boundary'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'separate-pacific-territories'));
});

test('New Zealand fixtures preserve leading zeroes and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/new-zealand-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'NZ');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_prefix, '000');
  assert.ok(postcodes.every(code => /^000[0-4]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('nz-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('leading-zero-dropped'));
  assert.ok(prohibited.has('rd-number-is-house-number'));
  assert.ok(prohibited.has('mailtown-is-physical-locality'));
  assert.ok(prohibited.has('occupant-or-recipient'));
  assert.ok(prohibited.has('deliverability'));
});

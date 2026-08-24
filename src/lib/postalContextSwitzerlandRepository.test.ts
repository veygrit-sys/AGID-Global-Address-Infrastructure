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
    npa6_rule: string;
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
const seedRoot = resolve(root, 'data/postal_country_packs/ch/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Switzerland seed remains metadata-only with postcode, entrance, and building identity separated', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-ch');
  assert.equal(manifest.repository.country_code, 'CH');
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
  assert.equal(manifest.postal_system.full_code_name, 'NPA4');
  assert.equal(manifest.postal_system.full_code_format, 'NNNN');
  assert.equal(
    manifest.postal_system.full_code_default_geometry,
    'official_domicile_postcode_perimeter_or_non_area',
  );
  assert.match(manifest.postal_system.npa6_rule, /separately.*NPA6/i);
  assert.match(manifest.postal_system.address_rule, /EGAID.*EGID plus EDID/i);
  assert.match(manifest.postal_system.building_rule, /same EGID/i);
  assert.match(manifest.postal_system.territory_rule, /Liechtenstein.*LI/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('special-postcode-given-invented-polygon'));
  assert.ok(manifest.promotion.hard_blockers.includes('building-proximity-presented-as-same-egid-link'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number'));
});

test('Switzerland source policy separates operator, PLZO, address, GWR, building, and admin authority', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const swissPost = sources.get('swiss-post-postcodes');
  const plzo = sources.get('swisstopo-plzo-postal-localities');
  const addresses = sources.get('swisstopo-building-address-directory');
  const gwr = sources.get('swiss-federal-gwr');
  const buildings = sources.get('swisstopo-swissbuildings3d');
  const boundaries = sources.get('swisstopo-swissboundaries3d');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(swissPost?.assignment_authority, 'official_postal_operator');
  assert.equal(swissPost?.redistribution_class, 'R5_contract_partitioned');
  assert.ok(swissPost?.prohibited_claims.includes('unrestricted-geopost-redistribution'));
  assert.equal(plzo?.geometry_authority, 'official_public_postal_locality_geometry');
  assert.ok(plzo?.prohibited_claims.includes('all-swiss-post-codes-have-plzo-area'));
  assert.equal(addresses?.geometry_authority, 'official_cadastral_entrance_point');
  assert.ok(addresses?.prohibited_claims.includes('entrance-point-is-building-footprint'));
  assert.equal(gwr?.assignment_authority, 'official_federal_building_register');
  assert.ok(gwr?.prohibited_claims.includes('public-private-dwelling-context'));
  assert.equal(buildings?.assignment_authority, 'none');
  assert.ok(buildings?.prohibited_claims.includes('exact-address-link-from-proximity'));
  assert.equal(boundaries?.geometry_authority, 'official_administrative_geometry');
  assert.ok(boundaries?.prohibited_claims.includes('plzo-postcode-boundary'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'swiss-post-contract-products'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'ch-li-territory-boundary'));
});

test('Switzerland fixtures use test-only four-digit codes and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/switzerland-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'CH');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_prefix, '000');
  assert.ok(postcodes.every(code => /^000[0-4]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('ch-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('synthetic-residential-polygon'));
  assert.ok(prohibited.has('entrance-point-is-building-footprint'));
  assert.ok(prohibited.has('private-ewid-context'));
  assert.ok(prohibited.has('liechtenstein-is-switzerland'));
  assert.ok(prohibited.has('deliverability'));
});

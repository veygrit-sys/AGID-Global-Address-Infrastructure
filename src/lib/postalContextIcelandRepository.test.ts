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
    address_rule: string;
    building_rule: string;
    postbox_rule: string;
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
const seedRoot = resolve(root, 'data/postal_country_packs/is/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Iceland seed remains metadata-only with postcode, address, and building evidence separated', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-is');
  assert.equal(manifest.repository.country_code, 'IS');
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
  assert.equal(manifest.postal_system.full_code_name, 'póstnúmer');
  assert.equal(manifest.postal_system.full_code_format, 'NNN');
  assert.equal(manifest.postal_system.full_code_default_geometry, 'official_postcode_area');
  assert.match(manifest.postal_system.address_rule, /coordinate type/i);
  assert.match(manifest.postal_system.building_rule, /proximity.*exact/i);
  assert.match(manifest.postal_system.postbox_rule, /does not change.*postcode/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('unpinned-postcode-layer'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number'));
});

test('Iceland source policy separates Pósturinn, IS 50V, HMS, and Statistics Iceland authority', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const posturinn = sources.get('posturinn-iceland-postcodes');
  const postcodeAreas = sources.get('natt-is50v-postcode-boundaries');
  const addresses = sources.get('hms-iceland-address-register');
  const buildings = sources.get('natt-is50v-buildings');
  const statistics = sources.get('statistics-iceland-geography');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(posturinn?.assignment_authority, 'official_postal_operator');
  assert.equal(posturinn?.geometry_authority, 'none');
  assert.ok(posturinn?.prohibited_claims.includes('postcode-polygon-authority'));
  assert.equal(postcodeAreas?.geometry_authority, 'official_mapping_geometry');
  assert.equal(postcodeAreas?.redistribution_class, 'R1_public_sector_reuse');
  assert.equal(addresses?.assignment_authority, 'official_address_registry');
  assert.ok(addresses?.prohibited_claims.includes('exact-building-footprint-from-address-point'));
  assert.equal(buildings?.assignment_authority, 'none');
  assert.ok(buildings?.prohibited_claims.includes('exact-address-link-from-proximity'));
  assert.equal(statistics?.geometry_authority, 'official_statistical_geometry');
  assert.ok(statistics?.prohibited_claims.includes('postcode-boundary'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'is50v-postcode-geometry'));
});

test('Iceland fixtures use test-only three-digit codes and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/iceland-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'IS');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_prefix, '00');
  assert.ok(postcodes.every(code => /^00[0-4]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('is-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('exact-address-link-from-proximity'));
  assert.ok(prohibited.has('facility-is-residence'));
  assert.ok(prohibited.has('recipient-or-occupant'));
  assert.ok(prohibited.has('deliverability'));
});

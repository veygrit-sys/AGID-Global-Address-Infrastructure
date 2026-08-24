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
    validation_readiness: string;
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
    transition_rule: string;
    privacy_rule: string;
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
const seedRoot = resolve(root, 'data/postal_country_packs/mt/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Malta seed keeps postcode assignment, address identity, and building geometry separated', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-mt');
  assert.equal(manifest.repository.country_code, 'MT');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.deepEqual(manifest.release_scope, {
    metadata_only: true,
    contains_raw_source_data: false,
    contains_real_addresses: false,
    contains_personal_data: false,
    contains_production_geometry: false,
    fixtures_are_synthetic: true,
    publication_claim: 'contract-seed-only',
  });
  assert.equal(manifest.postal_system.full_code_name, 'Postcode');
  assert.equal(manifest.postal_system.full_code_format, 'AAA NNNN');
  assert.equal(manifest.postal_system.full_code_default_geometry, 'operator_assignment_or_derived_noncanonical_surface');
  assert.match(manifest.postal_system.postcode_area_rule, /no.*official.*nationwide.*polygon.*derived_geometry/i);
  assert.match(manifest.postal_system.address_rule, /Office of the Address Registrar.*confirmation.*work-in-progress/i);
  assert.match(manifest.postal_system.building_rule, /explicit.*identifier.*proximity.*candidate/i);
  assert.match(manifest.postal_system.transition_rule, /Address Management Unit.*1 January 2026.*history/i);
  assert.match(manifest.postal_system.privacy_rule, /electoral.*person.*resident.*outside/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('derived-surface-presented-as-maltapost-boundary'));
  assert.ok(manifest.promotion.hard_blockers.includes('portal-work-in-progress-record-presented-as-confirmed'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-without-leading-zero-preservation'));
});

test('Malta source policy separates MaltaPost, OAR, PA buildings, and statistics geography', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const post = sources.get('maltapost-postcode-finder');
  const oar = sources.get('malta-office-address-registrar');
  const locations = sources.get('malta-oar-location-registers');
  const buildings = sources.get('malta-pa-large-scale-topography-buildings');
  const statistics = sources.get('nso-malta-spatial-divisions');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(post?.assignment_authority, 'official_postal_operator');
  assert.equal(post?.geometry_authority, 'none');
  assert.ok(post?.prohibited_claims.includes('finder-result-is-postcode-polygon'));
  assert.equal(oar?.assignment_authority, 'official_address_registrar');
  assert.equal(oar?.validation_readiness, 'metadata_only_until_confirmed_release');
  assert.ok(oar?.prohibited_claims.includes('work-in-progress-entry-is-confirmed-record'));
  assert.equal(locations?.geometry_authority, 'official_location_register_geometry_when_confirmed');
  assert.ok(locations?.prohibited_claims.includes('locality-is-postcode-area'));
  assert.equal(buildings?.geometry_authority, 'official_pa_large_scale_topography_building');
  assert.ok(buildings?.prohibited_claims.includes('nearest-building-is-exact-address-link'));
  assert.equal(statistics?.geometry_authority, 'official_statistical_geography');
  assert.ok(statistics?.prohibited_claims.includes('statistical-area-is-postcode-area'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'oar-confirmed-address-release'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'private-electoral-person-and-household-data'));
});

test('Malta fixtures use test-only postcodes and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/malta-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'MT');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_prefix, 'ZZZ');
  assert.ok(postcodes.every(code => /^ZZZ 000[0-4]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('mt-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('official-maltapost-polygon'));
  assert.ok(prohibited.has('work-in-progress-entry-is-confirmed'));
  assert.ok(prohibited.has('nearest-building-is-exact-link'));
  assert.ok(prohibited.has('deliverability'));
});

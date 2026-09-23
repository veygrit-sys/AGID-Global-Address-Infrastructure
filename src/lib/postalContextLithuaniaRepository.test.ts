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
    assignment_rule: string;
    endpoint_rule: string;
    address_rule: string;
    postal_surface_rule: string;
    building_rule: string;
    administrative_rule: string;
    territory_rule: string;
  };
  temporal_model: { history_rule: string };
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
    postal_codes_are_assignment_evidence: boolean;
  };
  fixtures: Array<{
    fixture_id: string;
    synthetic_address: { postal_code?: string };
    evidence: Array<{ assignment_authority: string; geometry_authority: string }>;
    expected: { must_not_assert: string[] };
  }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/lt/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Lithuania seed separates postal membership, civic addresses, derived surfaces, and buildings', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-lt');
  assert.equal(manifest.repository.country_code, 'LT');
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
  assert.equal(manifest.postal_system.full_code_name, 'pašto kodas');
  assert.equal(manifest.postal_system.full_code_format, 'LT-NNNNN');
  assert.equal(manifest.postal_system.full_code_default_geometry, 'address_membership_or_non_area');
  assert.match(manifest.postal_system.assignment_rule, /house number.*not an official polygon/i);
  assert.match(manifest.postal_system.endpoint_rule, /PO boxes.*parcel terminals.*non-areal/i);
  assert.match(manifest.postal_system.address_rule, /Registrų centras.*does not replace Lietuvos paštas/i);
  assert.match(manifest.postal_system.postal_surface_rule, /complete postal membership.*derived.*noncanonical/i);
  assert.match(manifest.postal_system.building_rule, /explicit registry identifier.*nearest.*candidate/i);
  assert.match(manifest.postal_system.administrative_rule, /cannot create.*postcode/i);
  assert.match(manifest.postal_system.territory_rule, /Latvia.*Belarus.*Poland.*Russia/i);
  assert.match(manifest.temporal_model.history_rule, /never rewrites/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('address-lookup-presented-as-official-postcode-boundary'));
  assert.ok(manifest.promotion.hard_blockers.includes('nearest-building-presented-as-exact-link'));
  assert.ok(manifest.promotion.hard_blockers.includes('foreign-border-geometry-absorbed-into-lt'));
});

test('Lithuania source policy keeps Lietuvos paštas and Registrų centras roles distinct', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const post = sources.get('lietuvos-pastas-postcode-search');
  const addresses = sources.get('registru-centras-address-register');
  const buildings = sources.get('registru-centras-ntr-buildings');
  const boundaries = sources.get('registru-centras-address-boundaries');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(post?.assignment_authority, 'official_postal_operator');
  assert.equal(post?.geometry_authority, 'none');
  assert.ok(post?.prohibited_claims.includes('official-postcode-polygon'));
  assert.equal(addresses?.assignment_authority, 'official_address_registry');
  assert.equal(addresses?.geometry_authority, 'official_address_registry_geometry');
  assert.ok(addresses?.prohibited_claims.includes('postal-operator-validation-from-address-register-alone'));
  assert.equal(buildings?.geometry_authority, 'official_cadastral_geometry');
  assert.ok(buildings?.prohibited_claims.includes('nearest-building-is-exact-address-link'));
  assert.equal(boundaries?.geometry_authority, 'official_administrative_geometry');
  assert.ok(boundaries?.prohibited_claims.includes('postcode-boundary'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'delivery-endpoint'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'private-and-sensitive'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'border-partition'));
});

test('Lithuania fixtures are synthetic and never prove real assignment or geometry', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/lithuania-synthetic.json');
  const postalCodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postal_code)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'LT');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_codes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, 'LT-000');
  assert.ok(postalCodes.every(code => /^LT-\d{5}$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('lt-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('official-lietuvos-pastas-boundary'));
  assert.ok(prohibited.has('address-is-mail-deliverable'));
  assert.ok(prohibited.has('nearest-building-is-exact-link'));
  assert.ok(prohibited.has('endpoint-code-is-residential-area'));
});

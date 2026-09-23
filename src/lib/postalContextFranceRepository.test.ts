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
    source_digest?: string;
    prohibited_claims: string[];
  }>;
  artifact_partitions: Array<{ id: string; public_output: string }>;
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
    m2_scope_rule: string;
    commune_rule: string;
    territory_rule: string;
  };
  promotion: { current_stage: string; hard_blockers: string[] };
  non_guarantees: string[];
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

type Descriptor = {
  countryCode: string;
  maturity: string;
  synthetic: boolean;
  promotionEligible: boolean;
  containsResidentialAddressPoints: boolean;
  artifacts: Array<{ role: string; digest: string; recordCounts: Record<string, number> }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/fr/postal-context');

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, path), 'utf8')) as T;
}

test('France M2 is a scoped real-data pack with assignment and geometry separated', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-fr');
  assert.equal(manifest.repository.country_code, 'FR');
  assert.equal(manifest.repository.maturity, 'M2_experimental');
  assert.deepEqual(
    {
      metadataOnly: manifest.release_scope.metadata_only,
      raw: manifest.release_scope.contains_raw_source_data,
      addresses: manifest.release_scope.contains_real_addresses,
      personal: manifest.release_scope.contains_personal_data,
      geometry: manifest.release_scope.contains_production_geometry,
      fixturesSynthetic: manifest.release_scope.fixtures_are_synthetic,
    },
    { metadataOnly: false, raw: false, addresses: false, personal: false, geometry: true, fixturesSynthetic: true },
  );
  assert.equal(manifest.release_scope.publication_claim, '75001-75020-derived-paris-arrondissement-display-surfaces');
  assert.equal(manifest.postal_system.full_code_name, 'code_postal');
  assert.equal(manifest.postal_system.full_code_format, 'NNNNN');
  assert.equal(manifest.postal_system.full_code_default_geometry, 'routing_locality_with_optional_derived_area');
  assert.match(manifest.postal_system.m2_scope_rule, /75001-75020.*derived display surface.*never as a La Poste boundary/iu);
  assert.match(manifest.postal_system.commune_rule, /separate evidence/i);
  assert.match(manifest.postal_system.territory_rule, /separate from overseas/i);
  assert.equal(manifest.promotion.current_stage, 'M2_experimental_paris_arrondissement_visualization');
  assert.ok(manifest.promotion.hard_blockers.includes('derived-area-presented-as-la-poste-boundary'));
  assert.ok(manifest.promotion.hard_blockers.includes('national-coverage-inferred-from-paris-scope'));
  assert.ok(manifest.non_guarantees.includes('official-la-poste-polygon'));
  assert.ok(manifest.non_guarantees.includes('national-france-coverage'));
});

test('France source policy pins official inputs and labels the joined surface derived', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const laPoste = sources.get('la-poste-base-officielle-codes-postaux');
  const administrative = sources.get('geo-api-gouv-commune-contours-via-laposte-data-fair');
  const derived = sources.get('fr-paris-arrondissement-postcode-display-surface');
  const ban = sources.get('ban-fr');
  const bdTopo = sources.get('ign-bd-topo-ban-links');

  assert.equal(profile.artifact_scope, 'm2-experimental-paris-arrondissement-runtime');
  assert.equal(laPoste?.assignment_authority, 'official_postal_operator');
  assert.equal(laPoste?.geometry_authority, 'none');
  assert.equal(laPoste?.source_digest, 'sha256:f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22');
  assert.ok(laPoste?.prohibited_claims.includes('official-la-poste-polygon'));
  assert.equal(administrative?.assignment_authority, 'none');
  assert.equal(administrative?.geometry_authority, 'official_mapping_geometry');
  assert.equal(administrative?.source_digest, 'sha256:76d9f52e38386339a15d3becc6f4ed6eb3605af3cb82669cea772feb8fd586ec');
  assert.equal(derived?.assignment_authority, 'official_postal_operator');
  assert.equal(derived?.geometry_authority, 'official_mapping_geometry');
  assert.ok(derived?.prohibited_claims.includes('national-france-coverage'));
  assert.equal(ban?.bundled_here, false);
  assert.equal(bdTopo?.bundled_here, false);
  assert.ok(profile.artifact_partitions.some(partition =>
    partition.id === 'derived-postcode-display' && /20 explicitly derived/iu.test(partition.public_output)));
});

test('France committed descriptor is real M2 and contains only graph plus geometry', () => {
  const descriptor = readJson<Descriptor>('m2/descriptor.json');
  assert.equal(descriptor.countryCode, 'FR');
  assert.equal(descriptor.maturity, 'M2_experimental');
  assert.equal(descriptor.synthetic, false);
  assert.equal(descriptor.promotionEligible, true);
  assert.equal(descriptor.containsResidentialAddressPoints, false);
  assert.deepEqual(descriptor.artifacts.map(artifact => artifact.role).sort(), ['geometry', 'graph']);
  assert.ok(descriptor.artifacts.every(artifact => /^sha256:[a-f0-9]{64}$/u.test(artifact.digest)));
  assert.equal(descriptor.artifacts.find(artifact => artifact.role === 'geometry')?.recordCounts.features, 20);
});

test('France legacy fixtures remain non-geographic and never promotion evidence', () => {
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
  assert.ok(prohibited.has('official-la-poste-polygon'));
  assert.ok(prohibited.has('derived-is-la-poste-official'));
  assert.ok(prohibited.has('occupant-or-recipient'));
});

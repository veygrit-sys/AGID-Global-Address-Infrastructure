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
    building_part_rule: string;
    service_migration_rule: string;
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
const seedRoot = resolve(root, 'data/postal_country_packs/ee/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Estonia seed remains metadata-only with postal, address, and building identity separated', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-ee');
  assert.equal(manifest.repository.country_code, 'EE');
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
  assert.equal(manifest.postal_system.full_code_name, 'sihtnumber');
  assert.equal(manifest.postal_system.full_code_format, 'NNNNN');
  assert.equal(manifest.postal_system.full_code_default_geometry, 'official_postal_area_or_facility_point');
  assert.match(manifest.postal_system.address_rule, /ADS_OID.*ADOB_ID/i);
  assert.match(manifest.postal_system.building_rule, /source identifiers/i);
  assert.match(manifest.postal_system.building_part_rule, /public.*building/i);
  assert.match(manifest.postal_system.service_migration_rule, /27 April 2026.*end of 2026/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('unpinned-aks-postal-area-layer'));
  assert.ok(manifest.promotion.hard_blockers.includes('ads-oid-or-adob-id-dropped'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number'));
});

test('Estonia source policy separates Omniva, AKS postal, ADS object, building, and EHAK authority', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const omniva = sources.get('omniva-estonia-postcodes');
  const assignments = sources.get('estonia-aks-postal-codes');
  const areas = sources.get('estonia-aks-postal-areas');
  const addresses = sources.get('estonia-aks-address-objects');
  const buildings = sources.get('estonia-aks-building-shapes');
  const ehak = sources.get('estonia-ehak-admin-boundaries');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(omniva?.assignment_authority, 'official_postal_operator');
  assert.equal(omniva?.geometry_authority, 'none');
  assert.ok(omniva?.prohibited_claims.includes('postal-area-geometry-authority'));
  assert.equal(assignments?.geometry_authority, 'official_address_reference_point');
  assert.ok(assignments?.prohibited_claims.includes('historical-completeness-from-current-only-extract'));
  assert.equal(areas?.geometry_authority, 'official_public_postal_geometry');
  assert.ok(areas?.prohibited_claims.includes('building-identity-from-postal-containment'));
  assert.equal(addresses?.assignment_authority, 'official_address_registry');
  assert.ok(addresses?.prohibited_claims.includes('recipient-occupant-or-owner'));
  assert.equal(buildings?.geometry_authority, 'official_addressed_building_geometry');
  assert.ok(buildings?.prohibited_claims.includes('exact-address-link-from-proximity'));
  assert.equal(ehak?.geometry_authority, 'official_administrative_geometry');
  assert.ok(ehak?.prohibited_claims.includes('postal-code-boundary'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'aks-postal-area-geometry'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'public-private-boundary'));
});

test('Estonia fixtures use test-only five-digit codes and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/estonia-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'EE');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_prefix, '0000');
  assert.ok(postcodes.every(code => /^0000[0-4]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('ee-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('private-building-part'));
  assert.ok(prohibited.has('historical-completeness'));
  assert.ok(prohibited.has('public-private-unit-context'));
  assert.ok(prohibited.has('facility-is-residence'));
  assert.ok(prohibited.has('deliverability'));
});

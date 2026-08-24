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
    postcode_area_rule: string;
    address_rule: string;
    building_rule: string;
    reference_status_rule: string;
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
const seedRoot = resolve(root, 'data/postal_country_packs/cz/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Czechia seed keeps PSČ, address point, building, and derived geometry separated', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-cz');
  assert.equal(manifest.repository.country_code, 'CZ');
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
  assert.equal(manifest.postal_system.full_code_name, 'PSČ');
  assert.equal(manifest.postal_system.full_code_format, 'NNN NN');
  assert.equal(manifest.postal_system.full_code_default_geometry, 'routing_assignment_or_derived_address_surface');
  assert.match(manifest.postal_system.postcode_area_rule, /not nationwide official postal polygons.*derived_geometry/i);
  assert.match(manifest.postal_system.address_rule, /RÚIAN address-place code.*not a building footprint/i);
  assert.match(manifest.postal_system.building_rule, /Stavební objekt code.*candidate evidence only/i);
  assert.match(manifest.postal_system.reference_status_rule, /informational.*referenceable/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('derived-surface-presented-as-official-ceska-posta-boundary'));
  assert.ok(manifest.promotion.hard_blockers.includes('building-proximity-presented-as-exact-ruian-link'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number'));
});

test('Czechia source policy separates postal assignment, address, building, administration, and reference status', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const search = sources.get('ceska-posta-psc');
  const outputs = sources.get('ceska-posta-customer-outputs');
  const ruian = sources.get('cuzk-ruian');
  const addresses = sources.get('cuzk-ruian-addresses');
  const vfr = sources.get('cuzk-ruian-vfr');
  const buildings = sources.get('cuzk-inspire-buildings');
  const boundaries = sources.get('cuzk-ruian-boundaries');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(search?.assignment_authority, 'official_postal_operator');
  assert.equal(search?.geometry_authority, 'none');
  assert.ok(search?.prohibited_claims.includes('search-result-is-official-psc-polygon'));
  assert.equal(outputs?.assignment_authority, 'official_postal_operator');
  assert.ok(outputs?.prohibited_claims.includes('csv-assignment-is-official-psc-polygon'));
  assert.ok(ruian?.prohibited_claims.includes('informational-vdp-is-reference-system-proof'));
  assert.equal(addresses?.geometry_authority, 'official_address_definition_point');
  assert.ok(addresses?.prohibited_claims.includes('address-point-is-building-footprint'));
  assert.equal(vfr?.geometry_authority, 'official_ruian_feature_geometry');
  assert.ok(vfr?.prohibited_claims.includes('nearest-building-is-exact-link'));
  assert.equal(buildings?.assignment_authority, 'none');
  assert.ok(buildings?.prohibited_claims.includes('nearest-footprint-is-exact-address-link'));
  assert.equal(boundaries?.geometry_authority, 'official_administrative_geometry');
  assert.ok(boundaries?.prohibited_claims.includes('official-psc-boundary'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'derived-psc-geometry'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'czechia-reference-status-ledger'));
});

test('Czechia fixtures use spaced test-only PSČ and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/czechia-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'CZ');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_prefix, '000');
  assert.ok(postcodes.every(code => /^000 0[0-4]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('cz-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('official-ceska-posta-polygon'));
  assert.ok(prohibited.has('address-point-is-building-footprint'));
  assert.ok(prohibited.has('nearest-building-is-exact-link'));
  assert.ok(prohibited.has('deliverability'));
});

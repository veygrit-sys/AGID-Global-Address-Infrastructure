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
    assignment_rule: string;
    perimeter_rule: string;
    address_rule: string;
    building_rule: string;
    cross_border_rule: string;
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
    postcodes_are_assignment_evidence: boolean;
  };
  fixtures: Array<{
    fixture_id: string;
    synthetic_address: { postcode?: string };
    evidence: Array<{ assignment_authority: string; geometry_authority: string }>;
    expected: { must_not_assert: string[] };
  }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/at/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Austria seed separates Post assignment, statistical geometry, BEV identity, and country', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-at');
  assert.equal(manifest.repository.country_code, 'AT');
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
  assert.equal(manifest.postal_system.full_code_name, 'Postleitzahl');
  assert.equal(manifest.postal_system.full_code_format, 'NNNN');
  assert.match(manifest.postal_system.full_code_default_geometry, /area_or_non_area.*official_statistical.*derived_surface/);
  assert.match(manifest.postal_system.assignment_rule, /Österreichische Post.*four-digit.*not establish current allocation or deliverability/i);
  assert.match(manifest.postal_system.perimeter_rule, /Statistik Austria.*official statistical geometry.*explicitly derived/i);
  assert.match(manifest.postal_system.address_rule, /BEV Address Register.*PAC.*Interactive search.*not establish bulk/i);
  assert.match(manifest.postal_system.building_rule, /seven-digit Adresscode.*three-digit Subcode.*proximity is candidate-only/i);
  assert.match(manifest.postal_system.cross_border_rule, /German.*Swiss.*routing.*never changes Austrian country identity/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('statistical-postcode-region-presented-as-postal-operator-perimeter'));
  assert.ok(manifest.promotion.hard_blockers.includes('one-bev-product-license-generalized-to-another-product'));
  assert.ok(manifest.promotion.hard_blockers.includes('building-proximity-presented-as-exact-identifier-link'));
  assert.ok(manifest.promotion.hard_blockers.includes('foreign-routing-or-border-clip-presented-as-austrian-country-identity'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number'));
});

test('Austria source policy separates Post, BEV, statistical geometry, boundaries, and GWR', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const postal = sources.get('austrian-post-postcode');
  const postAddress = sources.get('austrian-post-address-data');
  const upu = sources.get('upu-austria-addressing');
  const bevAddress = sources.get('bev-austria-address-register');
  const postcodeRegions = sources.get('statistics-austria-postcode-regions');
  const boundaries = sources.get('bev-austria-administrative-boundaries');
  const gwr = sources.get('statistics-austria-gwr');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(postal?.assignment_authority, 'official_postal_operator');
  assert.match(postal?.geometry_authority ?? '', /none_unless/);
  assert.ok(postal?.prohibited_claims.includes('destination-location-is-postcode-polygon'));
  assert.equal(postAddress?.redistribution_class, 'R3_controlled_service');
  assert.ok(postAddress?.prohibited_claims.includes('household-or-person-data-is-public-address-data'));
  assert.equal(upu?.geometry_authority, 'none');
  assert.ok(upu?.prohibited_claims.includes('format-proves-current-allocation'));
  assert.equal(bevAddress?.assignment_authority, 'official_state_address_register');
  assert.ok(bevAddress?.prohibited_claims.includes('nearest-building-is-exact-link'));
  assert.equal(postcodeRegions?.geometry_authority, 'official_statistical_postcode_region_geometry');
  assert.ok(postcodeRegions?.prohibited_claims.includes('statistical-region-is-postal-operator-perimeter'));
  assert.equal(boundaries?.geometry_authority, 'official_administrative_geometry');
  assert.equal(gwr?.redistribution_class, 'R4_validation_only');
  assert.ok(gwr?.prohibited_claims.includes('individual-records-may-be-published'));
  for (const partition of [
    'postal-operator-address',
    'official-address-and-building',
    'official-statistical-postcode-region',
    'derived-postal-surface',
    'administrative-and-cross-border',
    'private-and-restricted',
  ]) {
    assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
  }
});

test('Austria fixtures use synthetic 000x strings and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/austria-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'AT');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '000');
  assert.ok(postcodes.every(code => /^000[0-3]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('at-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('official-postcode-polygon'));
  assert.ok(prohibited.has('nearest-building-is-exact-link'));
  assert.ok(prohibited.has('austrian-post-official-perimeter'));
  assert.ok(prohibited.has('foreign-routing-determines-country'));
});

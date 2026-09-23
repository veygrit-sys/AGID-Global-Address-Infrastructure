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
    administrative_rule: string;
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
const seedRoot = resolve(root, 'data/postal_country_packs/gr/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Greece seed separates ELTA assignment, GISCO points, address, building, and administration', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-gr');
  assert.equal(manifest.repository.country_code, 'GR');
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
  assert.equal(manifest.postal_system.full_code_name, 'Postal code');
  assert.equal(manifest.postal_system.full_code_format, 'NNN NN');
  assert.match(manifest.postal_system.full_code_default_geometry, /operator_assignment.*official_derived_point.*derived_surface/);
  assert.match(manifest.postal_system.assignment_rule, /ELTA.*five-digit.*do not establish current allocation or deliverability/i);
  assert.match(manifest.postal_system.perimeter_rule, /GISCO.*not ELTA polygons.*derived/i);
  assert.match(manifest.postal_system.address_rule, /municipal or national street-number identifier.*project page.*not a live nationwide/i);
  assert.match(manifest.postal_system.building_rule, /explicit distributable address-to-building relationship.*proximity.*candidate-only/i);
  assert.match(manifest.postal_system.administrative_rule, /Mount Athos.*do not create postcode membership/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('elta-web-search-presented-as-bulk-license'));
  assert.ok(manifest.promotion.hard_blockers.includes('gisco-point-or-nuts-match-presented-as-elta-perimeter'));
  assert.ok(manifest.promotion.hard_blockers.includes('planned-register-presented-as-live-address-data'));
  assert.ok(manifest.promotion.hard_blockers.includes('building-proximity-presented-as-exact-identifier-link'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number'));
});

test('Greece source policy separates operator, point, cadastral, census, and planned-register evidence', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const postal = sources.get('elta-gr');
  const upu = sources.get('upu-greece-addressing');
  const point = sources.get('gisco-greece-postcode-points');
  const cadastre = sources.get('ktimatologio-greece');
  const cartography = sources.get('elstat-greece-digital-cartography');
  const registerPlan = sources.get('greece-national-streets-numbers-plan');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(postal?.assignment_authority, 'official_postal_operator');
  assert.equal(postal?.geometry_authority, 'none');
  assert.ok(postal?.prohibited_claims.includes('web-search-is-bulk-license'));
  assert.equal(upu?.geometry_authority, 'none');
  assert.equal(point?.geometry_authority, 'official_derived_point_only');
  assert.ok(point?.prohibited_claims.includes('point-is-elta-perimeter'));
  assert.equal(cadastre?.redistribution_class, 'R4_validation_only');
  assert.ok(cadastre?.prohibited_claims.includes('parcel-is-building-or-address'));
  assert.equal(cartography?.geometry_authority, 'official_census_cartography');
  assert.ok(cartography?.prohibited_claims.includes('building-outline-proves-address-or-occupancy'));
  assert.equal(registerPlan?.geometry_authority, 'none');
  assert.ok(registerPlan?.prohibited_claims.includes('project-page-is-live-national-register'));
  for (const partition of [
    'operator-search',
    'official-derived-postcode-point',
    'official-or-municipal-address',
    'building-and-cadastral-context',
    'derived-postal-surface',
    'administration-islands-and-service',
    'private-and-restricted',
  ]) {
    assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
  }
});

test('Greece fixtures use synthetic 000 NN strings and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/greece-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'GR');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '000');
  assert.ok(postcodes.every(code => /^000 0[0-3]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('gr-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('official-postcode-polygon'));
  assert.ok(prohibited.has('nearest-building-is-exact-link'));
  assert.ok(prohibited.has('gisco-point-is-elta-perimeter'));
  assert.ok(prohibited.has('service-state-determines-autonomy'));
});

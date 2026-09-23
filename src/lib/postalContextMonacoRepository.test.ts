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
    ordinary_code_rule: string;
    cedex_rule: string;
    postcode_area_rule: string;
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
const seedRoot = resolve(root, 'data/postal_country_packs/mc/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Monaco seed keeps postal routing, address identity, and building geometry separated', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-mc');
  assert.equal(manifest.repository.country_code, 'MC');
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
  assert.equal(manifest.postal_system.full_code_name, 'code_postal_or_cedex');
  assert.equal(manifest.postal_system.full_code_format, '980NN');
  assert.equal(manifest.postal_system.full_code_default_geometry, 'routing_designator_or_derived_noncanonical_surface');
  assert.match(manifest.postal_system.ordinary_code_rule, /98000.*not prove.*every 980xx.*contours/i);
  assert.match(manifest.postal_system.cedex_rule, /CEDEX.*non-areal.*residential/i);
  assert.match(manifest.postal_system.postcode_area_rule, /contours.*not supplied.*derived_geometry.*never.*official/i);
  assert.match(manifest.postal_system.address_rule, /licensed.*DPUM.*excluding.*resident/i);
  assert.match(manifest.postal_system.building_rule, /shared official identifier.*proximity.*candidate/i);
  assert.match(manifest.postal_system.territory_rule, /separate from.*FR.*French/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('derived-surface-presented-as-la-poste-boundary'));
  assert.ok(manifest.promotion.hard_blockers.includes('structurally-valid-980xx-presented-as-currently-allocated'));
  assert.ok(manifest.promotion.hard_blockers.includes('french-address-or-geometry-merged-into-monaco'));
});

test('Monaco source policy separates La Poste, DPUM, planning, and IMSEE evidence', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const postal = sources.get('la-poste-official-postal-codes-monaco');
  const operator = sources.get('la-poste-monaco-addressing');
  const addresses = sources.get('monaco-dpum-address-base');
  const buildings = sources.get('monaco-dpum-building-topography');
  const plans = sources.get('monaco-dpum-urban-plans');
  const statistics = sources.get('monaco-imsee-territory');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(postal?.assignment_authority, 'official_postal_operator');
  assert.equal(postal?.geometry_authority, 'none');
  assert.ok(postal?.prohibited_claims.includes('official-la-poste-polygon'));
  assert.ok(operator?.prohibited_claims.includes('example-proves-complete-cedex-range'));
  assert.equal(addresses?.validation_readiness, 'metadata_only_until_licensed_extract');
  assert.ok(addresses?.prohibited_claims.includes('address-geocode-is-building-footprint'));
  assert.equal(buildings?.geometry_authority, 'official_government_building_geometry_when_licensed');
  assert.ok(buildings?.prohibited_claims.includes('nearest-building-is-exact-address-link'));
  assert.equal(plans?.geometry_authority, 'official_regulatory_plan_geometry');
  assert.ok(plans?.prohibited_claims.includes('urban-zone-is-postcode-area'));
  assert.equal(statistics?.geometry_authority, 'official_statistical_or_published_district_context');
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'derived-postcode-surfaces'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'private-housing-person-property-and-delivery-data'));
});

test('Monaco fixtures are synthetic and never prove real 980xx allocation', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/monaco-synthetic.json');
  const postalCodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postal_code)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'MC');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_codes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '980');
  assert.ok(postalCodes.every(code => /^980\d{2}$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('mc-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('official-la-poste-polygon'));
  assert.ok(prohibited.has('currently-allocated-cedex'));
  assert.ok(prohibited.has('nearest-building-is-exact-link'));
  assert.ok(prohibited.has('deliverability'));
});

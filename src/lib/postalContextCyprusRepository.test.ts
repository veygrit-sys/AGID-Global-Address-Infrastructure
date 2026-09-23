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
    international_display_format: string;
    full_code_default_geometry: string;
    assignment_rule: string;
    perimeter_rule: string;
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
const seedRoot = resolve(root, 'data/postal_country_packs/cy/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Cyprus seed separates Post assignment, statistical sectors, DLS identity, and territory', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-cy');
  assert.equal(manifest.repository.country_code, 'CY');
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
  assert.equal(manifest.postal_system.full_code_format, 'NNNN');
  assert.equal(manifest.postal_system.international_display_format, 'CY-NNNN');
  assert.match(manifest.postal_system.full_code_default_geometry, /street_or_locality.*statistical_postal_sector.*derived_surface/);
  assert.match(manifest.postal_system.assignment_rule, /Cyprus Post.*four-digit.*CY-.*not establish current allocation or deliverability/i);
  assert.match(manifest.postal_system.perimeter_rule, /CYSTAT.*official statistical geometry.*explicitly derived/i);
  assert.match(manifest.postal_system.address_rule, /DLS INSPIRE Address.*CC BY.*API rights.*not establish bulk/i);
  assert.match(manifest.postal_system.building_rule, /explicit DLS address-to-building relationship.*proximity is candidate-only/i);
  assert.match(manifest.postal_system.territory_rule, /Green Line.*Sovereign Base Area.*separate pinned assertions/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('statistical-postal-sector-presented-as-cyprus-post-perimeter'));
  assert.ok(manifest.promotion.hard_blockers.includes('api-access-presented-as-bulk-license'));
  assert.ok(manifest.promotion.hard_blockers.includes('building-proximity-presented-as-exact-identifier-link'));
  assert.ok(manifest.promotion.hard_blockers.includes('green-line-trnc-or-sba-feature-silently-merged-into-standard-cy-service-coverage'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number'));
});

test('Cyprus source policy separates Post, DLS address/building/admin, CYSTAT, and legal context', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const postal = sources.get('cyprus-post-postcode-directory');
  const api = sources.get('cyprus-post-postcode-api');
  const upu = sources.get('upu-cyprus-addressing');
  const address = sources.get('cyprus-dls-inspire-addresses');
  const building = sources.get('cyprus-dls-inspire-buildings');
  const admin = sources.get('cyprus-dls-administrative-units');
  const sector = sources.get('cystat-postal-sectors');
  const protocol = sources.get('eu-cyprus-protocol-10');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(postal?.assignment_authority, 'official_postal_operator');
  assert.equal(postal?.geometry_authority, 'none');
  assert.ok(postal?.prohibited_claims.includes('street-range-is-postcode-polygon'));
  assert.equal(api?.redistribution_class, 'R3_controlled_service');
  assert.ok(api?.prohibited_claims.includes('api-request-approval-is-bulk-license'));
  assert.equal(upu?.geometry_authority, 'none');
  assert.ok(upu?.prohibited_claims.includes('format-or-prefix-proves-current-allocation'));
  assert.equal(address?.geometry_authority, 'official_address_point_and_explicit_relationship');
  assert.ok(address?.prohibited_claims.includes('parcel-relation-is-building-relation'));
  assert.equal(building?.geometry_authority, 'official_building_geometry');
  assert.ok(building?.prohibited_claims.includes('nearest-footprint-is-addressed-building'));
  assert.equal(admin?.geometry_authority, 'official_administrative_geometry');
  assert.equal(sector?.geometry_authority, 'official_statistical_postal_sector_geometry');
  assert.ok(sector?.prohibited_claims.includes('statistical-sector-is-cyprus-post-perimeter'));
  assert.equal(protocol?.redistribution_class, 'R1_public_reference');
  assert.ok(protocol?.prohibited_claims.includes('effective-control-status-is-sovereignty-decision'));
  for (const partition of [
    'operational-api',
    'official-address',
    'official-building',
    'official-statistical-postal-sector',
    'derived-postal-surface',
    'territory-control-and-service',
    'private-and-restricted',
  ]) {
    assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
  }
});

test('Cyprus fixtures use synthetic 000x strings and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/cyprus-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'CY');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '000');
  assert.ok(postcodes.every(code => /^000[0-3]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('cy-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('official-postcode-polygon'));
  assert.ok(prohibited.has('nearest-building-is-exact-link'));
  assert.ok(prohibited.has('cyprus-post-official-perimeter'));
  assert.ok(prohibited.has('service-coverage-determines-effective-control'));
  assert.ok(prohibited.has('sba-is-standard-cy-postal-area'));
});

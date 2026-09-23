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
  release_scope: Record<string, boolean | string>;
  postal_system: Record<string, string>;
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
const seedRoot = resolve(root, 'data/postal_country_packs/kr/postal-context');
function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Korea seed separates five-digit assignment, National Basic District, Juso addresses, buildings, cadastre, licensing, and privacy', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-kr');
  assert.equal(manifest.repository.country_code, 'KR');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.release_scope.fixtures_are_synthetic, true);
  assert.equal(manifest.postal_system.full_code_format, 'NNNNN');
  assert.match(manifest.postal_system.assignment_rule, /Korea Post.*National Basic District.*1 August 2015.*leading zeroes.*valid syntax.*does not/i);
  assert.match(manifest.postal_system.assignment_granularity_rule, /first three.*province.*city.*county.*district.*final two.*smaller than.*eup.*myeon.*dong.*P\.O\. box.*non-area/i);
  assert.match(manifest.postal_system.geometry_rule, /MOIS National Basic District.*same five-digit.*canonical.*topology.*administrative boundary.*Voronoi.*never substitutes.*gap/i);
  assert.match(manifest.postal_system.address_rule, /Juso.*25-digit building management number.*address evidence, not geometry.*dong.*floor.*ho.*never inferred/i);
  assert.match(manifest.postal_system.building_rule, /Juso electronic-map.*MOLIT.*source-defined building management number.*crosswalk.*containment.*candidates.*multiple buildings/i);
  assert.match(manifest.postal_system.cadastral_rule, /MOLIT.*validation.*not survey.*does not prove.*ownership.*rightsholder.*valu.*tax/i);
  assert.match(manifest.postal_system.licence_rule, /Open Government Licence.*application.*service keys.*do not imply.*redistribution rights.*allowed public fields/i);
  assert.match(manifest.postal_system.crs_rule, /product-specific.*EPSG:5179.*EPSG:5186.*reviewed versioned transform.*EPSG:4326/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  for (const blocker of [
    'postcode-query-or-valid-syntax-presented-as-national-basic-district-polygon',
    'address-result-entrance-point-or-cadastral-parcel-presented-as-building-footprint',
    'application-service-key-viewer-public-metadata-or-kogl-label-presented-as-unrestricted-redistribution-right',
    'resident-household-owner-rightsholder-occupant-recipient-title-encumbrance-value-tax-shipment-or-query-data-published',
    'postcode-or-building-management-number-stored-as-number',
  ]) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('Korea source policy keeps postal, district, address, building, and cadastral evidence separate', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('korea-post-postcode-system')?.assignment_authority, 'official_postal_system_semantics_only');
  assert.equal(sources.get('korea-post-postcode-api')?.assignment_authority, 'official_postal_operator');
  assert.equal(sources.get('korea-post-postcode-api')?.geometry_authority, 'none');
  assert.equal(sources.get('mois-juso-basic-districts')?.geometry_authority, 'official_national_basic_district_polygon_or_multipolygon');
  assert.equal(sources.get('mois-juso-basic-districts')?.redistribution_class, 'R3_controlled_approval_or_contract');
  assert.equal(sources.get('mois-juso-road-address-api')?.geometry_authority, 'none');
  assert.equal(sources.get('mois-juso-building-db')?.assignment_authority, 'official_address_and_building_identifier_authority');
  assert.equal(sources.get('mois-juso-electronic-map')?.geometry_authority, 'official_layer_specific_geometry_when_exactly_approved_and_linked');
  assert.ok(sources.get('mois-juso-electronic-map')?.prohibited_claims.includes('entrance-point-is-building-footprint'));
  assert.equal(sources.get('molit-korea-gis-integrated-buildings')?.geometry_authority, 'official_building_geometry_when_exactly_pinned_and_explicitly_crosswalked');
  assert.equal(sources.get('molit-korea-continuous-cadastral-map')?.redistribution_class, 'R4_validation_only');
  for (const partition of [
    'five-digit-postal-assignment',
    'national-basic-district-geometry',
    'official-road-address-and-identifiers',
    'address-linked-building-geometry',
    'administrative-and-cadastral-context',
    'derived-and-model-output',
    'private-and-restricted',
  ]) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('Korea fixtures use synthetic five-digit postcode strings and no upstream rows', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/korea-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));
  assert.equal(pack.country_code, 'KR');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '0000');
  assert.ok(postcodes.every(code => /^0000[0-3]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('kr-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  for (const claim of [
    'real-mois-national-basic-district',
    'postcode-query-is-polygon',
    'entrance-point-is-building-footprint',
    'nearest-building-is-exact-link',
    'resident-household-owner-rightsholder-title-value-or-tax',
  ]) assert.ok(prohibited.has(claim));
});

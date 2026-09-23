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
const seedRoot = resolve(root, 'data/postal_country_packs/tw/postal-context');
function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Taiwan seed separates 3+3 assignment, derived geometry, doorplates, NLSC buildings, administration, licensing, and privacy', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-tw');
  assert.equal(manifest.repository.country_code, 'TW');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.release_scope.fixtures_are_synthetic, true);
  assert.equal(manifest.postal_system.full_code_format, 'NNNNNN');
  assert.match(manifest.postal_system.assignment_rule, /Chunghwa Post.*six-digit.*leading zeroes.*three-digit.*centre point.*does not establish.*perimeter.*deliverability/i);
  assert.match(manifest.postal_system.assignment_granularity_rule, /first three.*administrative district.*last three.*delivery district.*delivery-specific.*P\.O\. box.*non-area/i);
  assert.match(manifest.postal_system.geometry_rule, /No nationwide.*Chunghwa Post-authored.*doorplate members.*derived.*centre points.*Voronoi.*never.*official/i);
  assert.match(manifest.postal_system.address_rule, /MOI.*doorplate.*point.*not a building footprint.*resident.*occupant/i);
  assert.match(manifest.postal_system.building_rule, /rights-cleared NLSC.*source-defined.*common stable.*crosswalk.*proximity.*candidates/i);
  assert.match(manifest.postal_system.cadastral_rule, /NLSC cadastral.*validation.*Parcel.*does not prove.*ownership.*rightsholder.*valu.*tax/i);
  assert.match(manifest.postal_system.administration_rule, /NLSC.*county.*township.*village.*does not create.*3\+3.*building.*sovereignty/i);
  assert.match(manifest.postal_system.licence_rule, /Open Government Data License.*public lookup.*WMS.*does not imply.*redistribution rights.*allowed public fields/i);
  assert.match(manifest.postal_system.crs_rule, /EPSG:3824.*EPSG:3826.*EPSG:3825.*reviewed versioned transform.*EPSG:4326/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  for (const blocker of [
    'three-digit-centre-or-lookup-row-presented-as-six-digit-polygon',
    'doorplate-point-or-cadastral-parcel-presented-as-building-footprint',
    'lookup-viewer-wms-wmts-government-wfs-paid-subscription-or-statutory-access-presented-as-redistribution-right',
    'household-resident-owner-rightsholder-occupant-domicile-organization-title-encumbrance-value-or-tax-data-published',
    'postcode-stored-as-number',
  ]) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('Taiwan source policy keeps Chunghwa Post, MOI doorplate, NLSC building, administration, and cadastral evidence separate', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('chunghwa-post-3plus3-data')?.assignment_authority, 'official_postal_operator');
  assert.equal(sources.get('chunghwa-post-3plus3-data')?.geometry_authority, 'address_range_or_delivery_specific_assignment_without_polygon');
  assert.ok(sources.get('chunghwa-post-3plus3-data')?.prohibited_claims.includes('data-row-is-official-postcode-polygon'));
  assert.equal(sources.get('chunghwa-post-3plus3-lookup')?.geometry_authority, 'lookup_result_and_address_range_only');
  assert.equal(sources.get('chunghwa-post-3plus3-license')?.assignment_authority, 'legal_framework_only');
  assert.equal(sources.get('moi-taiwan-national-doorplate-location')?.geometry_authority, 'official_doorplate_point_when_explicitly_supplied');
  assert.ok(sources.get('moi-taiwan-national-doorplate-location')?.prohibited_claims.includes('doorplate-point-is-building-footprint'));
  assert.equal(sources.get('nlsc-taiwan-emap-buildings')?.geometry_authority, 'official_building_geometry_only_when_exactly_licensed_and_linked');
  assert.equal(sources.get('nlsc-taiwan-emap-buildings')?.redistribution_class, 'R3_controlled_fee_or_contract');
  assert.equal(sources.get('nlsc-taiwan-cadastral-map')?.redistribution_class, 'R4_validation_only');
  assert.equal(sources.get('nlsc-taiwan-administrative-boundaries')?.geometry_authority, 'official_administrative_geometry_when_exactly_pinned');
  for (const partition of [
    'six-digit-postal-assignment',
    'postal-license-and-system-semantics',
    'official-doorplate-address',
    'emap-building-validation',
    'administrative-and-cadastral-context',
    'derived-postal-surface',
    'private-and-restricted',
  ]) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('Taiwan fixtures use synthetic six-digit postcode strings and no upstream rows', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/taiwan-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));
  assert.equal(pack.country_code, 'TW');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '00000');
  assert.ok(postcodes.every(code => /^00000[0-3]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('tw-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  for (const claim of [
    'official-chunghwa-post-polygon',
    'three-digit-centre-is-postal-boundary',
    'doorplate-point-is-building-footprint',
    'nearest-building-is-exact-link',
    'household-resident-owner-rightsholder-title-value-or-tax',
  ]) assert.ok(prohibited.has(claim));
});

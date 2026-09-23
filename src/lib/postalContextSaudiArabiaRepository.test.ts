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
const seedRoot = resolve(root, 'data/postal_country_packs/sa/postal-context');
function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Saudi Arabia seed separates SPL assignment, National Address identifiers, derived surfaces, buildings, cadastre, licensing, and privacy', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-sa');
  assert.equal(manifest.repository.country_code, 'SA');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.release_scope.fixtures_are_synthetic, true);
  assert.equal(manifest.postal_system.full_code_format, 'NNNNN');
  assert.match(manifest.postal_system.assignment_rule, /SPL.*five-digit.*National Address.*leading zeroes.*pinned current.*valid syntax.*does not/i);
  assert.match(manifest.postal_system.assignment_granularity_rule, /Building Number.*Street.*District.*City.*Postal Code.*Secondary or Additional Number.*Short Address.*lookup identifier.*identifiers.*postal polygon.*footprint.*unit/i);
  assert.match(manifest.postal_system.geometry_rule, /No nationwide.*official SPL postcode polygon.*API point.*PolygonString.*Voronoi.*never becomes official.*derived.*uncertainty.*non-canonical.*gap/i);
  assert.match(manifest.postal_system.address_rule, /SPL National Address API.*BuildingNumber.*AdditionalNumber.*PKAddressID.*UnitNumber.*typed address evidence.*PolygonString.*Account.*excluded/i);
  assert.match(manifest.postal_system.building_rule, /BuildingNumber.*PKAddressID.*neither is a footprint.*GEOSA.*source-defined stable relationship.*crosswalk.*containment.*candidates/i);
  assert.match(manifest.postal_system.cadastral_rule, /REGA.*cadastral.*plot does not prove.*owner.*rightsholder.*valu.*transaction.*tax/i);
  assert.match(manifest.postal_system.licence_rule, /SPL API.*credentialed.*purpose.*retention.*deletion.*redistribution.*portal visibility.*never implies/i);
  assert.match(manifest.postal_system.crs_rule, /Spatial Reference System.*source CRS.*epoch.*SANSRS.*guessed.*reviewed versioned transform.*EPSG:4326/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  for (const blocker of [
    'api-point-nullable-polygonstring-or-valid-syntax-presented-as-official-postal-polygon',
    'buildingnumber-pkaddressid-address-point-or-cadastral-plot-presented-as-building-footprint',
    'credential-api-viewer-open-data-request-law-governance-or-theme-metadata-presented-as-redistribution-right',
    'subscriber-account-proof-contact-resident-owner-rightsholder-occupant-title-value-transaction-tax-or-query-data-published',
    'postcode-buildingnumber-additionalnumber-shortaddress-or-pkaddressid-stored-as-number-or-derived-by-concatenation',
  ]) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('Saudi Arabia source policy keeps postal, address, point, building, cadastral, and legal evidence separate', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('spl-national-address-components')?.assignment_authority, 'official_postal_system_semantics_only');
  assert.equal(sources.get('spl-national-address-components')?.geometry_authority, 'none');
  assert.equal(sources.get('spl-national-address-api-v31')?.assignment_authority, 'official_postal_operator_address_result');
  assert.equal(sources.get('spl-national-address-api-v31')?.geometry_authority, 'official_address_point_only_when_exact_response_is_pinned');
  assert.ok(sources.get('spl-national-address-api-v31')?.prohibited_claims.includes('nullable-polygonstring-is-geometry'));
  assert.equal(sources.get('spl-national-address-api-terms')?.redistribution_class, 'R4_validation_only');
  assert.equal(sources.get('spl-national-address-short-address')?.geometry_authority, 'none');
  assert.equal(sources.get('geosa-saudi-geospatial-foundation-themes')?.geometry_authority, 'none_until_exact_theme_artifact_is_separately_licensed_and_pinned');
  assert.equal(sources.get('rega-saudi-geospatial-real-estate-portal')?.redistribution_class, 'R4_validation_only');
  assert.equal(sources.get('rega-saudi-real-estate-registration-framework')?.assignment_authority, 'official_cadastral_legal_framework_only');
  for (const partition of [
    'five-digit-postal-assignment',
    'national-address-components-and-identifiers',
    'official-address-point',
    'derived-postal-membership-surface',
    'address-linked-building-geometry',
    'administrative-and-cadastral-context',
    'private-and-restricted',
  ]) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('Saudi Arabia fixtures use synthetic five-digit postcode strings and no upstream rows', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/saudi-arabia-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));
  assert.equal(pack.country_code, 'SA');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '0000');
  assert.ok(postcodes.every(code => /^0000[0-3]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('sa-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  for (const claim of [
    'api-point-is-postal-polygon',
    'derived-surface-is-official-or-canonical',
    'buildingnumber-is-footprint',
    'nearest-building-is-exact-link',
    'owner-rightsholder-title-value-transaction-or-tax',
  ]) assert.ok(prohibited.has(claim));
});

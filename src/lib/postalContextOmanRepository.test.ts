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
const seedRoot = resolve(root, 'data/postal_country_packs/om/postal-context');
function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Oman seed separates office codes, P.O. boxes, physical addresses, derived surfaces, buildings, licensing, and privacy', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-om');
  assert.equal(manifest.repository.country_code, 'OM');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.release_scope.fixtures_are_synthetic, true);
  assert.equal(manifest.postal_system.full_code_format, 'NNN');
  assert.equal(manifest.postal_system.full_code_default_geometry, 'point_or_none_not_area');
  assert.match(manifest.postal_system.assignment_rule, /UPU Oman.*three-digit.*post office.*region.*P\.O\. box.*text.*does not prove.*polygon/i);
  assert.match(manifest.postal_system.office_rule, /Oman Post.*office-locator.*code.*point.*does not establish.*catchment.*subscriber.*polygon/i);
  assert.match(manifest.postal_system.geometry_rule, /point or none.*office coordinate.*wilayat.*Voronoi.*never becomes official.*derived.*non-canonical/i);
  assert.match(manifest.postal_system.address_rule, /P\.O\. box.*separate physical-address.*does not identify.*occupant/i);
  assert.match(manifest.postal_system.building_rule, /rights-cleared.*source-defined stable relation.*crosswalk.*building-numbering service.*not reusable.*candidates/i);
  assert.match(manifest.postal_system.licence_rule, /website visibility.*download tool.*never.*redistribution.*Oman Post.*harvesting/i);
  assert.match(manifest.postal_system.crs_rule, /source CRS.*axis order.*epoch.*ONGD17.*never relabelled WGS84.*reviewed/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  for (const blocker of [
    'three-digit-office-code-or-point-presented-as-official-postal-polygon',
    'po-box-or-postcode-presented-as-building-recipient-or-delivery-entitlement',
    'website-viewer-download-tool-open-data-policy-or-service-form-presented-as-redistribution-right',
    'subscriber-recipient-contact-correspondence-resident-occupant-owner-title-right-or-query-data-published',
    'postcode-or-po-box-stored-as-number-or-inferred-from-location',
  ]) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('Oman source policy keeps postal, office, address, administrative, geodetic, and legal evidence separate', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('upu-oman-postal-addressing')?.assignment_authority, 'official_postal_system_semantics_only');
  assert.equal(sources.get('upu-oman-postal-addressing')?.geometry_authority, 'none');
  assert.equal(sources.get('oman-post-office-locator')?.assignment_authority, 'official_post_office_record_only');
  assert.equal(sources.get('oman-post-office-locator')?.redistribution_class, 'R4_validation_only');
  assert.ok(sources.get('oman-post-office-locator')?.prohibited_claims.includes('office-point-is-service-area'));
  assert.equal(sources.get('oman-post-website-terms')?.redistribution_class, 'R4_validation_only');
  assert.equal(sources.get('gov-oman-building-addressing-service')?.assignment_authority, 'official_civic_address_workflow_only');
  assert.match(sources.get('ncsi-oman-wilayat-boundaries')?.geometry_authority ?? '', /administrative_geometry_only/i);
  assert.equal(sources.get('ncsi-oman-open-government-data-policy')?.geometry_authority, 'none');
  assert.equal(sources.get('nsgia-oman-geospatial-governance')?.assignment_authority, 'official_geospatial_governance_only');
  assert.equal(sources.get('nsgia-oman-portal-terms')?.redistribution_class, 'R4_validation_only');
  for (const partition of [
    'three-digit-office-code',
    'official-office-point',
    'po-box-and-postal-address',
    'derived-postal-service-surface',
    'physical-address-and-building',
    'administrative-context',
    'private-and-restricted',
  ]) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('Oman fixtures use a synthetic three-digit code and no upstream rows', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/oman-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));
  assert.equal(pack.country_code, 'OM');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '000');
  assert.ok(postcodes.every(code => code === '000'));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('om-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  for (const claim of [
    'office-point-is-postal-polygon',
    'po-box-identifies-building',
    'building-number-is-footprint',
    'containment-or-proximity-is-exact-building-link',
    'resident-owner-title-or-correspondence-data',
  ]) assert.ok(prohibited.has(claim));
});

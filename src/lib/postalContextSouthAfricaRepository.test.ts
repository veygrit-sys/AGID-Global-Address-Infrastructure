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
const seedRoot = resolve(root, 'data/postal_country_packs/za/postal-context');
function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('South Africa seed separates delivery types, geometry, buildings, licensing, and privacy', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-za');
  assert.equal(manifest.repository.country_code, 'ZA');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.release_scope.fixtures_are_synthetic, true);
  assert.equal(manifest.postal_system.full_code_format, 'NNNN');
  assert.equal(manifest.postal_system.full_code_default_geometry, 'typed_area_point_or_none');
  assert.match(manifest.postal_system.assignment_rule, /UPU South Africa.*four digits.*physical.*delivery locality.*rural.*Post Office.*not automatic polygon/i);
  assert.match(manifest.postal_system.delivery_type_rule, /physical.*rural.*PO Box.*Private Bag.*never collapsed/i);
  assert.match(manifest.postal_system.geometry_rule, /official rights-cleared.*otherwise.*office point.*no canonical geometry.*Voronoi.*derived.*non-canonical/i);
  assert.match(manifest.postal_system.building_rule, /rights-cleared.*source-defined stable relation.*crosswalk.*candidates only/i);
  assert.match(manifest.postal_system.licence_rule, /website visibility.*Spatial Data Infrastructure Act.*never.*redistribution/i);
  assert.match(manifest.postal_system.crs_rule, /source CRS.*Hartebeesthoek94.*Lo zones.*never relabelled WGS84.*reviewed/i);
  assert.match(manifest.postal_system.assignment_rule, /downloadable.*Excel.*TXT.*digest-pinned.*delivery type.*not.*polygon/i);
  assert.match(manifest.postal_system.cadastre_rule, /Surveyor-General.*parcel.*sectional-title.*neither postcode.*building.*holder/i);
  assert.match(manifest.postal_system.privacy_rule, /POPIA.*physical address.*location information.*personal information.*minimisation.*query/i);
  assert.match(manifest.postal_system.hosting_rule, /Cloudflare.*Hugging Face.*rights-cleared.*non-personal.*SAPO.*CSG/i);
  assert.match(manifest.postal_system.agid_rule, /independent spatial index.*never.*SAPO.*postal polygon.*building.*delivery/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  for (const blocker of [
    'four-digit-code-office-point-locality-or-administrative-boundary-presented-as-official-postal-polygon',
    'street-rural-po-box-or-private-bag-assignments-collapsed-without-official-relation',
    'website-search-viewer-sdi-law-or-custodianship-presented-as-redistribution-right',
    'holder-recipient-contact-correspondence-resident-occupant-owner-title-right-or-query-data-published',
    'postcode-or-delivery-point-stored-as-number-or-inferred-from-location',
  ]) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('South Africa source policy keeps postal, mapping, administration, legal, and fallback evidence separate', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('upu-south-africa-postal-addressing')?.assignment_authority, 'official_postal_system_semantics_only');
  assert.equal(sources.get('upu-south-africa-postal-addressing')?.geometry_authority, 'none');
  assert.match(sources.get('sapo-postcodes')?.assignment_authority ?? '', /official_postal_assignment/i);
  assert.equal(sources.get('sapo-postcodes')?.redistribution_class, 'R4_validation_only');
  assert.equal(sources.get('postafind-za')?.assignment_authority, 'third_party_candidate_only');
  assert.equal(sources.get('ngi-south-africa')?.assignment_authority, 'official_geospatial_governance_only');
  assert.match(sources.get('stats-sa-geography')?.geometry_authority ?? '', /statistical_geometry_only/i);
  assert.equal(sources.get('sasdi-south-africa')?.geometry_authority, 'none');
  assert.equal(sources.get('nspdr-south-africa-terms')?.redistribution_class, 'R4_validation_only');
  assert.equal(sources.get('sapo-website-terms')?.assignment_authority, 'none');
  assert.match(sources.get('stats-sa-census-2022-geography')?.geometry_authority ?? '', /statistical_geometry_only/i);
  assert.match(sources.get('mdb-south-africa-wards-2025')?.geometry_authority ?? '', /ward_geometry_only/i);
  assert.equal(sources.get('csg-south-africa-cadastre')?.redistribution_class, 'R3_controlled_approval_or_contract');
  assert.equal(sources.get('south-africa-popia-2013')?.assignment_authority, 'none');
  assert.equal(sources.get('osm-south-africa')?.redistribution_class, 'R5_odbl_separate_partition');
  for (const partition of [
    'four-digit-postal-assignment',
    'postal-office-point',
    'street-rural-and-postal-delivery',
    'derived-postal-surface',
    'physical-address-and-building',
    'administrative-context',
    'private-and-restricted',
    'cadastral-and-land',
    'community-odbl',
  ]) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('South Africa fixtures use synthetic four-digit codes and no upstream rows', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/south-africa-synthetic.json');
  const postcodes = pack.fixtures.map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));
  assert.equal(pack.country_code, 'ZA');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '0000');
  assert.ok(postcodes.every(code => code === '0000'));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('za-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  for (const claim of [
    'street-code-is-polygon',
    'office-point-is-postal-polygon',
    'po-box-identifies-building',
    'private-bag-identifies-building',
    'containment-or-proximity-is-exact-building-link',
    'resident-owner-title-or-correspondence-data',
  ]) assert.ok(prohibited.has(claim));
});

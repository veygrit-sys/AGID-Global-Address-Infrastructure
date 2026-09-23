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
    postcode_geometry_rule: string;
    special_code_rule: string;
    address_rule: string;
    unit_rule: string;
    eha_rule: string;
    building_rule: string;
    administrative_rule: string;
    licence_rule: string;
    crs_rule: string;
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
  };
  fixtures: Array<{
    fixture_id: string;
    synthetic_address: { postcode?: string };
    evidence: Array<{ assignment_authority: string; geometry_authority: string }>;
    expected: { must_not_assert: string[] };
  }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/hu/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Hungary seed separates operator assignment, derived geometry, KCR address, unit, and building evidence', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-hu');
  assert.equal(manifest.repository.country_code, 'HU');
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
  assert.equal(manifest.postal_system.full_code_name, 'Irányítószám');
  assert.equal(manifest.postal_system.full_code_format, 'NNNN');
  assert.equal(manifest.postal_system.full_code_default_geometry, 'operator_assignment_with_derived_or_non_area_geometry');
  assert.match(manifest.postal_system.assignment_rule, /Partner Extra.*four-digit.*syntax.*does not establish.*deliverability/i);
  assert.match(manifest.postal_system.postcode_geometry_rule, /No nationwide operator-authored.*complete.*rights-cleared.*derived.*noncanonical.*Voronoi.*never/i);
  assert.match(manifest.postal_system.special_code_rule, /post-office-box.*dedicated.*routing.*non-area/i);
  assert.match(manifest.postal_system.address_rule, /Központi Címregiszter.*building.*staircase.*floor.*door.*not a building footprint.*resident/i);
  assert.match(manifest.postal_system.unit_rule, /exact KCR address identifier.*never identify.*occupant.*owner/i);
  assert.match(manifest.postal_system.eha_rule, /inside the parcel.*entrance or geometric centre.*not automatically a building footprint/i);
  assert.match(manifest.postal_system.building_rule, /common authoritative identifier.*rights-cleared building.*NTA.*generalized.*nearest.*candidates/i);
  assert.match(manifest.postal_system.administrative_rule, /region.*county.*district.*municipality.*never creates postcode/i);
  assert.match(manifest.postal_system.licence_rule, /exact access terms.*schema.*CRS.*digest.*not by itself unrestricted redistribution/i);
  assert.match(manifest.postal_system.crs_rule, /EOV.*Web Mercator.*reviewed versioned transform.*never relabelled/i);
  assert.match(manifest.postal_system.territory_rule, /Hungary.*cross-border.*never determines sovereignty/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('partner-extra-row-presented-as-official-polygon'));
  assert.ok(manifest.promotion.hard_blockers.includes('kcr-statutory-access-presented-as-public-redistribution'));
  assert.ok(manifest.promotion.hard_blockers.includes('nta-generalized-or-tile-building-presented-as-exact-vector-footprint'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number'));
});

test('Hungary source policy separates Magyar Posta, KCR, EHA, building distributions, cadastre, and administration', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const postcodes = sources.get('magyar-posta-partner-extra-postcodes');
  const addressing = sources.get('magyar-posta-addressing-database');
  const kcr = sources.get('hungary-central-address-register-kcr');
  const eha = sources.get('lechner-hungary-eha');
  const inspire = sources.get('lechner-hungary-inspire-buildings');
  const nta = sources.get('lechner-hungary-nta-buildings');
  const cadastre = sources.get('hungary-land-registry-cadastral-map');
  const administration = sources.get('ksh-hungary-administrative-units');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(postcodes?.assignment_authority, 'official_postal_operator');
  assert.equal(postcodes?.geometry_authority, 'none');
  assert.equal(postcodes?.redistribution_class, 'R2_explicit_public_reuse');
  assert.ok(postcodes?.prohibited_claims.includes('postcode-row-is-polygon'));
  assert.equal(addressing?.geometry_authority, 'none');
  assert.ok(addressing?.prohibited_claims.includes('addressing-guide-is-bulk-address-dataset'));
  assert.equal(kcr?.assignment_authority, 'authoritative_central_address_register');
  assert.equal(kcr?.redistribution_class, 'R3_controlled_or_contract');
  assert.ok(kcr?.prohibited_claims.includes('statutory-data-transfer-is-public-redistribution'));
  assert.equal(eha?.geometry_authority, 'official_address_location_geometry');
  assert.ok(eha?.prohibited_claims.includes('point-is-building-footprint'));
  assert.equal(inspire?.geometry_authority, 'official_or_source_qualified_building_geometry');
  assert.ok(inspire?.prohibited_claims.includes('sample-coverage-is-national'));
  assert.equal(nta?.geometry_authority, 'generalized_map_display_only');
  assert.ok(nta?.prohibited_claims.includes('wmts-tile-is-editable-building-vector'));
  assert.equal(cadastre?.geometry_authority, 'authoritative_cadastral_map_geometry');
  assert.ok(cadastre?.prohibited_claims.includes('parcel-is-building'));
  assert.equal(administration?.geometry_authority, 'official_administrative_geometry');
  assert.ok(administration?.prohibited_claims.includes('municipality-is-postcode-area'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'derived-postcode-surface-or-non-area'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'address-and-unit'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'building-and-cadastre'));
});

test('Hungary fixtures use synthetic four-digit strings and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/hungary-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'HU');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_prefix, '000');
  assert.ok(postcodes.every(code => /^000[0-3]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('hu-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('magyar-posta-official-polygon'));
  assert.ok(prohibited.has('postbox-has-polygon'));
  assert.ok(prohibited.has('address-point-is-building-footprint'));
  assert.ok(prohibited.has('nta-tile-is-exact-footprint'));
  assert.ok(prohibited.has('nearest-footprint-is-exact-link'));
  assert.ok(prohibited.has('owner-or-title'));
});

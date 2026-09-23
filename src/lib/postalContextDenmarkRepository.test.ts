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
    postcode_area_rule: string;
    address_rule: string;
    building_rule: string;
    change_rule: string;
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
const seedRoot = resolve(root, 'data/postal_country_packs/dk/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Denmark seed keeps official postcode area, DAR address, and building evidence separated', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-dk');
  assert.equal(manifest.repository.country_code, 'DK');
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
  assert.equal(manifest.postal_system.full_code_name, 'Postnummer');
  assert.equal(manifest.postal_system.full_code_format, 'NNNN');
  assert.equal(manifest.postal_system.full_code_default_geometry, 'official_dagi_multisurface_or_non_area');
  assert.match(manifest.postal_system.postcode_area_rule, /DAGI Postnummerinddeling.*ErGadepostnummer/i);
  assert.match(manifest.postal_system.address_rule, /DAR address or Husnummer UUID.*not a building footprint/i);
  assert.match(manifest.postal_system.building_rule, /adgangTilBygning.*geoDanmarkBygning.*candidate evidence only/i);
  assert.match(manifest.postal_system.change_rule, /15 January 2027.*history/i);
  assert.match(manifest.postal_system.territory_rule, /Greenland.*Faroe Islands.*GL.*FO/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('special-postcode-given-invented-polygon'));
  assert.ok(manifest.promotion.hard_blockers.includes('building-proximity-presented-as-exact-dar-link'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number'));
});

test('Denmark source policy separates PostNord, DAGI, DAR, BBR, GeoDanmark, and administration', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const postnord = sources.get('postnord-dk-postcode-finder');
  const postcodeAreas = sources.get('dagi-denmark-postcode-areas');
  const dawa = sources.get('dataforsyningen-denmark');
  const dar = sources.get('danish-address-register-dar');
  const bbr = sources.get('bbr-denmark-buildings');
  const buildings = sources.get('geodanmark-buildings');
  const boundaries = sources.get('dagi-denmark-boundaries');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(postnord?.assignment_authority, 'official_postal_operator');
  assert.equal(postnord?.geometry_authority, 'none');
  assert.ok(postnord?.prohibited_claims.includes('search-result-is-postcode-polygon'));
  assert.equal(postcodeAreas?.geometry_authority, 'official_dagi_postcode_multisurface');
  assert.ok(postcodeAreas?.prohibited_claims.includes('all-routing-codes-have-area'));
  assert.equal(dawa?.assignment_authority, 'official_address_and_postcode_distribution');
  assert.ok(dawa?.prohibited_claims.includes('api-convenience-view-is-new-authority'));
  assert.equal(dar?.geometry_authority, 'official_address_access_point');
  assert.ok(dar?.prohibited_claims.includes('access-point-is-building-footprint'));
  assert.equal(bbr?.assignment_authority, 'official_building_registry');
  assert.ok(bbr?.prohibited_claims.includes('bbr-point-is-building-footprint'));
  assert.equal(buildings?.geometry_authority, 'official_geodanmark_building_footprint');
  assert.ok(buildings?.prohibited_claims.includes('nearest-footprint-is-exact-address-link'));
  assert.equal(boundaries?.geometry_authority, 'official_administrative_geometry');
  assert.ok(boundaries?.prohibited_claims.includes('postcode-area-geometry'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'datafordeler-service-transition'));
  assert.ok(profile.artifact_partitions.some(partition => partition.id === 'dk-gl-fo-territory-boundary'));
});

test('Denmark fixtures use test-only four-digit codes and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/denmark-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'DK');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_prefix, '000');
  assert.ok(postcodes.every(code => /^000[0-4]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('dk-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('municipality-sized-area'));
  assert.ok(prohibited.has('access-point-is-building-footprint'));
  assert.ok(prohibited.has('point-containment-is-building-identity'));
  assert.ok(prohibited.has('deliverability'));
});

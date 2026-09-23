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
  };
  fixtures: Array<{
    fixture_id: string;
    synthetic_address: { postcode?: string };
    evidence: Array<{ assignment_authority: string; geometry_authority: string }>;
    expected: { must_not_assert: string[] };
  }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/by/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Belarus seed separates Belpost assignment, NCA official-derived zone, address, real estate, and administration', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-by');
  assert.equal(manifest.repository.country_code, 'BY');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.release_scope.fixtures_are_synthetic, true);
  assert.equal(manifest.postal_system.full_code_format, 'NNNNNN');
  assert.match(manifest.postal_system.assignment_rule, /Belpost.*six-digit.*does not establish.*deliverability.*geometry/i);
  assert.match(manifest.postal_system.geometry_rule, /nationwide.*2020.*six months.*official-derived.*not.*Belpost-authored.*public-map.*Voronoi/i);
  assert.match(manifest.postal_system.special_code_rule, /PO-box.*poste-restante.*non-area.*service point.*polygon/i);
  assert.match(manifest.postal_system.address_rule, /Address Register.*land parcels.*capital structures.*isolated premises.*geocode is not a footprint.*person/i);
  assert.match(manifest.postal_system.building_rule, /capital-structure.*real-estate identifier.*parcel.*parking space.*owner.*transaction.*valuation/i);
  assert.match(manifest.postal_system.administrative_rule, /ATE\/TE.*SOATO.*context only.*postcode.*address.*building/i);
  assert.match(manifest.postal_system.licence_rule, /Belpost.*NCA.*paid receipt.*public cadastral-map.*do not grant reuse/i);
  assert.match(manifest.postal_system.crs_rule, /source CRS.*WGS84.*reviewed versioned transform.*EPSG:4326/i);
  assert.match(manifest.postal_system.territory_rule, /Belarus coverage.*Postal assignment never determines sovereignty.*cannot fill/i);
  assert.match(manifest.postal_system.freshness_rule, /six-month.*stale.*fails closed/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('nca-official-derived-zone-presented-as-belpost-authored-delivery-perimeter'));
  assert.ok(manifest.promotion.hard_blockers.includes('public-cadastral-map-view-presented-as-bulk-redistribution-right'));
  assert.ok(manifest.promotion.hard_blockers.includes('parcel-isolated-premise-or-parking-space-presented-as-building'));
  assert.ok(manifest.promotion.hard_blockers.includes('owner-rightsholder-title-transaction-valuation-residence-or-person-data-published'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number'));
});

test('Belarus source policy separates operator, zone, address, structures, real estate, administration, and viewer evidence', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const postcodes = sources.get('belpost-belarus-postcode-reference');
  const zones = sources.get('nca-belarus-postal-code-zones');
  const address = sources.get('nca-belarus-address-register');
  const structures = sources.get('nca-belarus-capital-structure-addresses');
  const realEstate = sources.get('nca-belarus-real-estate-register');
  const characteristics = sources.get('nca-belarus-property-characteristics-register');
  const ate = sources.get('nca-belarus-ate-register');
  const soato = sources.get('nca-belarus-soato-classifier');
  const viewer = sources.get('nca-belarus-public-cadastral-map');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(postcodes?.assignment_authority, 'official_postal_operator_reference');
  assert.equal(postcodes?.geometry_authority, 'none');
  assert.ok(postcodes?.prohibited_claims.includes('postcode-row-is-polygon'));
  assert.equal(zones?.geometry_authority, 'official_derived_postal_zone_geometry');
  assert.equal(zones?.redistribution_class, 'R3_controlled_or_contract');
  assert.ok(zones?.prohibited_claims.includes('nca-zone-is-belpost-authored-delivery-perimeter'));
  assert.equal(address?.geometry_authority, 'official_address_registry_geometry');
  assert.ok(address?.prohibited_claims.includes('address-geocode-is-building-footprint'));
  assert.equal(structures?.redistribution_class, 'R3_controlled_or_contract');
  assert.ok(structures?.prohibited_claims.includes('district-export-is-national-open-data'));
  assert.equal(realEstate?.geometry_authority, 'source_qualified_real_estate_building_geometry');
  assert.ok(realEstate?.prohibited_claims.includes('parcel-is-building'));
  assert.ok(realEstate?.prohibited_claims.includes('owner-rightsholder-title-or-transaction-is-public-output'));
  assert.equal(characteristics?.geometry_authority, 'none_or_separately_licensed_geometry');
  assert.ok(characteristics?.prohibited_claims.includes('valuation-is-public-output'));
  assert.equal(ate?.geometry_authority, 'official_administrative_geometry_when_separately_pinned');
  assert.ok(ate?.prohibited_claims.includes('administrative-boundary-is-postcode-zone'));
  assert.equal(soato?.geometry_authority, 'none');
  assert.ok(soato?.prohibited_claims.includes('soato-row-is-postcode-assignment'));
  assert.equal(viewer?.redistribution_class, 'R1_public_reference_only');
  assert.ok(viewer?.prohibited_claims.includes('public-map-is-bulk-license'));
  for (const partition of ['postal-assignment', 'official-derived-postal-zone', 'address', 'building', 'administration', 'viewer-reference']) {
    assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
  }
});

test('Belarus fixtures use synthetic six-digit strings and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/belarus-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'BY');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_prefix, '00000');
  assert.ok(postcodes.every(code => /^00000[0-3]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('by-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('belpost-authored-delivery-perimeter'));
  assert.ok(prohibited.has('public-map-is-bulk-license'));
  assert.ok(prohibited.has('postbox-has-polygon'));
  assert.ok(prohibited.has('address-geocode-is-building-footprint'));
  assert.ok(prohibited.has('isolated-premise-is-building'));
  assert.ok(prohibited.has('nearest-building-is-exact-link'));
  assert.ok(prohibited.has('unit-identifies-person'));
  assert.ok(prohibited.has('owner-rightsholder-title-transaction-or-valuation'));
});

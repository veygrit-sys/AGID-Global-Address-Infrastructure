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
const seedRoot = resolve(root, 'data/postal_country_packs/be/postal-context');

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;
}

test('Belgium seed separates bpost postal cantons, BeSt addresses, regional buildings, cadastre, and administration', () => {
  const manifest = readJson<RepositoryManifest>('repository-manifest.json');

  assert.equal(manifest.repository.name, 'agid-postal-be');
  assert.equal(manifest.repository.country_code, 'BE');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.release_scope.fixtures_are_synthetic, true);
  assert.equal(manifest.postal_system.full_code_format, 'NNNN');
  assert.match(manifest.postal_system.assignment_rule, /bpost.*four-digit.*leading zeroes.*no B- or BE-.*does not.*deliverability.*geometry/i);
  assert.match(manifest.postal_system.geometry_rule, /bpost postal-canton vector.*canonical.*metadata.*topology.*WMS pixels.*Voronoi.*gap filling/i);
  assert.match(manifest.postal_system.special_code_rule, /special.*exact code.*otherwise.*non-area.*0612.*delivery perimeter/i);
  assert.match(manifest.postal_system.address_rule, /BOSA BeSt Address.*Brussels.*Flanders.*Wallonia.*source ID.*coordinate.*not a building footprint.*person/i);
  assert.match(manifest.postal_system.building_rule, /Address Register.*Building Register.*ICAR.*PICC.*UrbIS.*common stable.*parcel.*centroid.*owner.*tax.*valuation/i);
  assert.match(manifest.postal_system.regional_rule, /Flanders.*Wallonia.*Brussels.*separate partitions.*building unit.*parcel.*centroid/i);
  assert.match(manifest.postal_system.administrative_rule, /FPS Finance.*region.*province or Brussels-Capital.*arrondissement.*municipality.*does not replace a postal canton/i);
  assert.match(manifest.postal_system.licence_rule, /bpost.*BOSA.*Digitaal Vlaanderen.*SPW.*Paradigm.*FPS Finance.*CC BY 4.0.*separately attributable/i);
  assert.match(manifest.postal_system.crs_rule, /source CRS.*WGS84.*reviewed versioned transform.*EPSG:4326/i);
  assert.match(manifest.postal_system.territory_rule, /Belgium only.*Postal membership does not determine sovereignty.*cannot fill/i);
  assert.match(manifest.postal_system.freshness_rule, /BeSt weekly.*independent refresh.*mixed-edition.*fails closed/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-list-row-presented-as-polygon'));
  assert.ok(manifest.promotion.hard_blockers.includes('wms-pixel-municipality-buffer-voronoi-or-interpolation-presented-as-postal-canton'));
  assert.ok(manifest.promotion.hard_blockers.includes('address-point-or-icar-centroid-presented-as-building-footprint'));
  assert.ok(manifest.promotion.hard_blockers.includes('best-consolidation-used-without-regional-source-lineage'));
  assert.ok(manifest.promotion.hard_blockers.includes('owner-rightsholder-title-transaction-tax-income-valuation-residence-or-person-data-published'));
  assert.ok(manifest.promotion.hard_blockers.includes('postcode-stored-as-number-or-prefixed-with-b-or-be'));
});

test('Belgium source policy preserves national and three-region evidence partitions', () => {
  const profile = readJson<SourceProfile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  const postcode = sources.get('bpost-belgium-postcode-reference');
  const cantons = sources.get('bpost-belgium-postal-cantons');
  const validation = sources.get('bpost-address-validation');
  const best = sources.get('bosa-belgium-best-address');
  const flandersAddress = sources.get('digitaal-vlaanderen-address-register');
  const flandersBuilding = sources.get('digitaal-vlaanderen-building-register');
  const grb = sources.get('digitaal-vlaanderen-grb');
  const icar = sources.get('spw-wallonia-icar-addresses');
  const picc = sources.get('spw-wallonia-picc-buildings');
  const urbis = sources.get('paradigm-brussels-urbis-buildings-addresses');
  const cadastre = sources.get('fps-finance-belgium-cadastral-plan');
  const administration = sources.get('fps-finance-belgium-administrative-units');

  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(postcode?.assignment_authority, 'official_postal_operator_reference');
  assert.equal(postcode?.geometry_authority, 'none');
  assert.ok(postcode?.prohibited_claims.includes('postcode-row-is-polygon'));
  assert.equal(cantons?.geometry_authority, 'official_postal_canton_geometry');
  assert.equal(cantons?.redistribution_class, 'R2_source_specific_open_terms');
  assert.ok(cantons?.prohibited_claims.includes('wms-pixel-is-vector-feature'));
  assert.equal(validation?.geometry_authority, 'none');
  assert.ok(validation?.prohibited_claims.includes('validated-address-is-building-footprint'));
  assert.equal(best?.geometry_authority, 'source_qualified_address_point');
  assert.ok(best?.prohibited_claims.includes('federal-consolidation-erases-regional-lineage'));
  assert.equal(flandersAddress?.assignment_authority, 'authentic_regional_address_register');
  assert.ok(flandersAddress?.prohibited_claims.includes('parcel-berth-or-stand-is-building'));
  assert.equal(flandersBuilding?.geometry_authority, 'official_regional_building_geometry');
  assert.ok(flandersBuilding?.prohibited_claims.includes('building-unit-is-footprint'));
  assert.equal(grb?.redistribution_class, 'R2_vlaanderen_open_data');
  assert.ok(grb?.prohibited_claims.includes('grb-containment-is-address-link'));
  assert.equal(icar?.geometry_authority, 'official_address_centroid_when_exactly_matched');
  assert.ok(icar?.prohibited_claims.includes('icar-centroid-is-building-footprint'));
  assert.equal(picc?.redistribution_class, 'R2_cc_by_4_0_public_partition');
  assert.ok(picc?.prohibited_claims.includes('restricted-picc-vtopo-is-open'));
  assert.equal(urbis?.redistribution_class, 'R2_urbis_source_specific_open_terms');
  assert.ok(urbis?.prohibited_claims.includes('urbis-licence-covers-all-third-party-cadastre'));
  assert.equal(cadastre?.geometry_authority, 'official_public_cadastral_building_geometry');
  assert.ok(cadastre?.prohibited_claims.includes('owner-rightsholder-title-tax-income-or-valuation-is-public-output'));
  assert.equal(administration?.geometry_authority, 'official_administrative_geometry');
  assert.ok(administration?.prohibited_claims.includes('administrative-boundary-is-postal-canton'));
  for (const partition of ['postal-assignment', 'official-postal-canton', 'federal-address-crosswalk', 'flanders-address-building', 'wallonia-address-building', 'brussels-address-building', 'federal-cadastre', 'administration']) {
    assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
  }
});

test('Belgium fixtures use synthetic four-digit strings and never become production evidence', () => {
  const pack = readJson<SyntheticFixturePack>('fixtures/belgium-synthetic.json');
  const postcodes = pack.fixtures
    .map(fixture => fixture.synthetic_address.postcode)
    .filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(fixture => fixture.expected.must_not_assert));

  assert.equal(pack.country_code, 'BE');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postal_prefix, '000');
  assert.ok(postcodes.every(code => /^000[0-3]$/.test(code)));
  assert.ok(pack.fixtures.every(fixture => fixture.fixture_id.startsWith('be-syn-')));
  assert.ok(pack.fixtures.every(fixture => fixture.evidence.every(evidence =>
    ['synthetic_fixture_assignment', 'none'].includes(evidence.assignment_authority)
    && ['synthetic_fixture_geometry', 'none'].includes(evidence.geometry_authority))));
  assert.ok(prohibited.has('production-bpost-postal-canton'));
  assert.ok(prohibited.has('wms-pixel-is-vector-feature'));
  assert.ok(prohibited.has('special-code-has-invented-polygon'));
  assert.ok(prohibited.has('best-point-is-building-footprint'));
  assert.ok(prohibited.has('icar-centroid-is-building-footprint'));
  assert.ok(prohibited.has('building-unit-is-footprint'));
  assert.ok(prohibited.has('nearest-building-is-exact-link'));
  assert.ok(prohibited.has('owner-rightsholder-title-tax-income-or-valuation'));
});

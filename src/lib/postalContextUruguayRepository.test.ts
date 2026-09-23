import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Manifest = {
  repository: { name: string; country_code: string; maturity: string };
  release_scope: Record<string, boolean>;
  postal_system: Record<string, string>;
  promotion: { current_stage: string; hard_blockers: string[] };
};
type Profile = {
  artifact_scope: string;
  sources: Array<Record<string, any>>;
  artifact_partitions: Array<{ id: string }>;
};
type Fixtures = {
  country_code: string;
  synthetic: boolean;
  promotion_eligible: boolean;
  fixture_policy: Record<string, any>;
  fixtures: Array<{
    fixture_id: string;
    synthetic_address: { postcode?: string };
    expected: { must_not_assert: string[] };
  }>;
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/uy/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Uruguay seed separates official releases, observations, addresses, buildings, cadastre, models, jurisdiction, and AGID', () => {
  const value = readJson<Manifest>('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-uy');
  assert.equal(value.repository.country_code, 'UY');
  assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, false);
  assert.equal(value.release_scope.contains_raw_source_data, false);
  assert.equal(value.release_scope.contains_real_addresses, false);
  assert.equal(value.release_scope.contains_personal_data, false);
  assert.equal(value.release_scope.contains_production_geometry, true);
  assert.equal(value.postal_system.code_format, 'NNNNN');
  assert.match(value.postal_system.assignment_rule, /Correo Uruguayo.*five-digit.*delivery point.*set of delivery points.*time-dependent/i);
  assert.match(value.postal_system.geometry_rule, /official.*SHP.*KML.*EPSG:4326.*resource.*digest.*cannot be substituted.*unknown/i);
  assert.match(value.postal_system.address_format_rule, /recipient.*building.*door number.*block.*lot.*floor.*unit.*no real example/i);
  assert.match(value.postal_system.postal_object_rule, /postal_area.*delivery_point.*delivery_point_set.*unknown.*Polygon.*not prove/i);
  assert.match(value.postal_system.building_rule, /SuDir.*stable reviewed relation.*postal polygon.*DNC parcel.*not/i);
  assert.match(value.postal_system.cadastre_rule, /Catastro.*monthly.*parcels.*owner.*occupant/i);
  assert.match(value.postal_system.derived_and_realtime_rule, /machine learning.*release.*cache TTL.*official or derived.*never overwrites/i);
  assert.match(value.postal_system.agid_rule, /independent spatial index.*versioned crosswalk.*official Correo/i);
  assert.match(value.postal_system.licence_rule, /Datos Abiertos de Uruguay.*origin.*provider.*modifications.*ODbL/i);
  assert.match(value.postal_system.jurisdiction_rule, /ISO UY.*does not silently.*maritime.*boundary/i);
  assert.match(value.postal_system.temporal_rule, /Postal assignments.*web-service.*IDE.*DNC.*resource UUID.*timeless/i);
  for (const blocker of [
    'valid-five-digit-text-presented-as-current-assignment',
    'catalog-page-or-unpinned-resource-presented-as-official-postal-geometry',
    'live-lookup-ide-admin-cadastre-or-osm-evidence-presented-as-canonical-postal-polygon',
    'coordinate-address-point-parcel-containment-or-proximity-presented-as-exact-building-relation',
    'derived-api-or-model-surface-presented-as-official-or-used-to-fill-unknown-coverage',
    'postal-release-coverage-silently-extended-beyond-declared-uy-scope',
  ]) assert.ok(value.promotion.hard_blockers.includes(blocker));
});

test('Uruguay source profile keeps postal geometry, service, IDE, DNC, and community authority separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'fixed-official-august-2023-postal-polygon-research-pack-currentness-blocked');
  assert.equal(sources.get('correo-uruguayo-postal-polygons')?.bundled_here, true);
  assert.ok(profile.sources.filter(source => source.source_id !== 'correo-uruguayo-postal-polygons').every(source => source.bundled_here === false));
  assert.match(sources.get('correo-uruguayo-postal-polygons')?.assignment_authority ?? '', /official_postal_operator/i);
  assert.match(sources.get('correo-uruguayo-postal-polygons')?.geometry_authority ?? '', /official_postal_operator_release_polygon/i);
  assert.match(sources.get('correo-uruguayo-postal-polygons')?.redistribution_class ?? '', /Uruguay_DAG/i);
  assert.match(sources.get('correo-uruguayo-address-services')?.geometry_authority ?? '', /address_point.*not_bulk_postal_polygon.*building/i);
  assert.match(sources.get('ide-uy-addresses')?.geometry_authority ?? '', /address_point.*not_postal.*building/i);
  assert.match(sources.get('dnc-uy-parcels')?.geometry_authority ?? '', /parcel.*not_postal.*building/i);
  assert.match(sources.get('osm-uruguay')?.redistribution_class ?? '', /ODbL/i);
  for (const id of [
    'official-postal-assignments-and-release-polygons', 'operator-service-observations',
    'typed-postal-objects', 'historical-postal-releases', 'derived-postal-validation-surfaces',
    'administrative-identities-and-boundaries', 'civic-address-identities-and-points',
    'explicit-civic-address-to-building-relation', 'dnc-cadastre-context', 'community-validation',
    'agid-crosswalk',
  ]) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === id));
});

test('Uruguay fixtures are synthetic and keep release geometry, buildings, property, jurisdiction, and AGID non-authoritative', () => {
  const pack = readJson<Fixtures>('fixtures/uruguay-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'UY');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.postal_value, '99999');
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.synthetic_value_not_checked_against_live_lookup, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.ok(postcodes.every(postcode => /^\d{5}$/.test(postcode)));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('uy-syn-')));
  for (const claim of [
    'synthetic-code-is-current-postal-assignment',
    'synthetic-polygon-is-official-correo-release-geometry',
    'catalog-or-unpinned-resource-is-official-postal-geometry',
    'ide-address-or-dnc-parcel-is-postal-assignment',
    'coordinate-address-point-parcel-containment-or-proximity-is-exact-building-link',
    'owner-occupant-person-or-property-data-is-public-address-data',
    'postal-release-coverage-extends-beyond-declared-uy-scope',
    'agid-cell-is-official-postal-geometry',
  ]) assert.ok(prohibited.has(claim));
});

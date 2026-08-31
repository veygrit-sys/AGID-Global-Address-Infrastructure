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
  official_polygon_promotion_gate: { required_checks: string[]; maximum_claim: string; failure_mode: string };
  hugging_face: Record<string, any>;
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
const seedRoot = resolve(root, 'data/postal_country_packs/co/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Colombia seed separates official polygons, layer rights, addresses, constructions, time, AGID, and Hub artifacts', () => {
  const value = readJson<Manifest>('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-co');
  assert.equal(value.repository.country_code, 'CO');
  assert.equal(value.repository.maturity, 'M2_national_derived_visualization');
  assert.equal(value.promotion.current_stage, 'M2_national_derived_visualization');
  assert.equal(value.release_scope.metadata_only, false);
  assert.equal(value.release_scope.contains_raw_source_data, false);
  assert.equal(value.release_scope.contains_real_addresses, false);
  assert.equal(value.release_scope.contains_personal_data, false);
  assert.equal(value.release_scope.contains_production_geometry, true);
  assert.equal(value.postal_system.code_format, 'NNNNNN');
  assert.match(value.postal_system.assignment_rule, /department.*postal zone.*district.*represents an area.*not proof/i);
  assert.match(value.postal_system.geometry_rule, /Shapefile.*CSV.*normal-code.*expanded-code.*official release.*all-rights-reserved.*cannot fill/i);
  assert.match(value.postal_system.address_format_rule, /primary thoroughfare.*placa.*building.*P\.O\. Box.*never production/i);
  assert.match(value.postal_system.postal_object_rule, /six_digit_postal_area.*expanded_postal_area.*must never be collapsed/i);
  assert.match(value.postal_system.building_rule, /civic-address.*explicit reviewed relation.*construction identifier.*not an exact/i);
  assert.match(value.postal_system.administrative_rule, /DANE DIVIPOLA.*MGN.*distinct from 4-72/i);
  assert.match(value.postal_system.cadastre_rule, /IGAC.*SINIC.*construction-unit.*field-level authority.*privacy/i);
  assert.match(value.postal_system.derived_and_realtime_rule, /compress reviewed geometry.*machine-learning.*cache TTL.*never overwrites/i);
  assert.match(value.postal_system.agid_rule, /independent spatial index.*Versioned crosswalks.*official Colombian/i);
  assert.match(value.postal_system.licence_rule, /permits use.*redistribution.*all rights reserved.*CC BY-SA.*ODbL/i);
  assert.match(value.postal_system.temporal_rule, /2022 UPU.*DANE MGN.*IGAC monthly.*SINIC bimonthly.*supersession/i);
  assert.match(value.postal_system.hugging_face_rule, /Dataset.*Parquet.*GeoParquet.*pin a Hub commit.*digests/i);
  for (const blocker of [
    'valid-six-digit-text-presented-as-current-postal-assignment',
    'unversioned-or-undigested-download-presented-as-official-postal-geometry',
    'open-clause-assumed-to-cover-artifact-without-resolving-all-rights-reserved-metadata',
    'normal-expanded-site-property-and-parcel-layers-conflated',
    'dane-igac-sinic-cadastre-community-api-or-model-geometry-presented-as-4-72-postal-geometry',
    'coordinate-address-text-property-point-parcel-containment-or-proximity-presented-as-exact-building-relation',
    'person-owner-occupant-reserved-property-or-query-data-published-without-authority',
    'derived-api-or-model-surface-presented-as-official-or-used-to-fill-unknown-coverage',
  ]) assert.ok(value.promotion.hard_blockers.includes(blocker), blocker);
});

test('Colombia source profile implements the official release polygon promotion gate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'M2-national-derived-display-artifact');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('codigo-postal-colombia-472')?.assignment_authority ?? '', /official_postal_operator.*observation/i);
  assert.match(sources.get('codigo-postal-colombia-bulk')?.geometry_authority ?? '', /official_postal_operator_release_polygon_source_for_derived_display/i);
  assert.match(sources.get('codigo-postal-colombia-open-license')?.redistribution_class ?? '', /open_reuse.*transformation.*attribution/i);
  assert.match(sources.get('codigo-postal-colombia-arcgis')?.redistribution_class ?? '', /government_catalog_CC_BY_SA_4_0.*viewer_open_clause/i);
  assert.match(sources.get('dane-colombia-divipola-mgn-2025')?.geometry_authority ?? '', /mgn.*not_postal/i);
  assert.match(sources.get('igac-colombia-open-cadastre')?.redistribution_class ?? '', /CC_BY_SA_4_0/i);
  assert.match(sources.get('osm-colombia')?.redistribution_class ?? '', /ODbL/i);
  assert.equal(profile.official_polygon_promotion_gate.maximum_claim, 'official-release');
  assert.match(profile.official_polygon_promotion_gate.failure_mode, /non-geometric.*derived review.*failed gate/i);
  assert.equal((profile.official_polygon_promotion_gate as any).verification?.status, 'passed-for-derived-display-artifact');
  assert.equal((profile.official_polygon_promotion_gate as any).verification?.current_assignment_records, 3681);
  assert.equal((profile.official_polygon_promotion_gate as any).verification?.official_polygon_records, 3681);
  assert.equal((profile.official_polygon_promotion_gate as any).verification?.output_provenance, 'derived');
  for (const check of [
    'exact-official-shapefile-bytes-and-digest',
    'artifact-level-open-licence-applicability-proved',
    'all-rights-reserved-service-metadata-conflict-resolved',
    'normal-six-digit-layer-not-expanded-site-property-or-parcel-layer',
    'epsg-and-crs-pinned',
    'topology-valid-and-country-scope-reviewed',
  ]) assert.ok(profile.official_polygon_promotion_gate.required_checks.includes(check), check);
  assert.deepEqual(profile.hugging_face.preferred_formats, ['parquet', 'geoparquet']);
  assert.match(profile.hugging_face.production_read_rule, /pin-hub-commit.*digests/i);
  for (const id of [
    'official-postal-operator-observations', 'official-postal-csv-release',
    'official-postal-shapefile-release', 'normal-six-digit-postal-areas',
    'expanded-postal-objects', 'postal-open-licence-snapshot',
    'administrative-identities-and-geometry', 'civic-address-and-nomenclature-context',
    'explicit-civic-address-to-construction-relation',
    'cadastral-land-construction-and-unit-context', 'derived-postal-review-surfaces',
    'community-validation', 'agid-crosswalk', 'hugging-face-public-parquet',
    'hugging-face-gated-restricted-inputs', 'hugging-face-derived-review-surfaces',
  ]) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === id), id);
});

test('Colombia fixtures are synthetic and keep postal, layer, construction, person, and AGID claims non-authoritative', () => {
  const pack = readJson<Fixtures>('fixtures/colombia-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'CO');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.postal_value, '999999');
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.synthetic_value_not_checked_against_live_operator, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.ok(postcodes.every(postcode => /^\d{6}$/.test(postcode)));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('co-syn-')));
  for (const claim of [
    'synthetic-code-is-current-postal-assignment',
    'synthetic-polygon-is-official-4-72-postal-geometry',
    'unversioned-download-or-service-layer-is-official-release',
    'normal-expanded-site-property-and-parcel-layers-are-interchangeable',
    'dane-igac-sinic-cadastre-community-api-or-model-object-is-4-72-postal-geometry',
    'coordinate-address-text-property-point-parcel-containment-or-proximity-is-exact-building-link',
    'person-household-owner-occupant-organization-or-query-log-is-public-address-data',
    'postal-source-coverage-extends-beyond-declared-co-scope',
    'agid-cell-is-official-postal-geometry',
  ]) assert.ok(prohibited.has(claim), claim);
});

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
const seedRoot = resolve(root, 'data/postal_country_packs/cu/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Cuba seed separates postal semantics, administration, cartography, buildings, models, time, AGID, and Hub artifacts', () => {
  const value = readJson<Manifest>('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-cu');
  assert.equal(value.repository.country_code, 'CU');
  assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, true);
  assert.equal(value.release_scope.contains_raw_source_data, false);
  assert.equal(value.release_scope.contains_real_addresses, false);
  assert.equal(value.release_scope.contains_personal_data, false);
  assert.equal(value.release_scope.contains_production_geometry, false);
  assert.equal(value.postal_system.code_format, 'NNNNN');
  assert.match(value.postal_system.assignment_rule, /five numeric digits.*current assignment.*licensed.*not proof/i);
  assert.match(value.postal_system.geometry_rule, /not guaranteed.*polygon.*IDERC.*Voronoi.*cannot be presented.*reuse rights/i);
  assert.match(value.postal_system.address_format_rule, /recipient.*building.*s\/n.*between streets.*postal zone.*no real/i);
  assert.match(value.postal_system.postal_object_rule, /postal_area.*route.*unknown.*must not be forced/i);
  assert.match(value.postal_system.building_rule, /civic-address identifier.*stable reviewed explicit relation.*not an exact/i);
  assert.match(value.postal_system.administrative_rule, /IDERC.*ONEI.*contextual.*not.*postal/i);
  assert.match(value.postal_system.derived_and_realtime_rule, /machine-learning.*cache TTL.*derived status.*never overwrites/i);
  assert.match(value.postal_system.agid_rule, /independent spatial index.*Versioned crosswalks.*official Cuban/i);
  assert.match(value.postal_system.licence_rule, /not bulk-data licences.*UPU.*IDERC.*GEOCUBA.*ODbL/i);
  assert.match(value.postal_system.temporal_rule, /2004 UPU.*source version.*digest.*supersession/i);
  assert.match(value.postal_system.hugging_face_rule, /Dataset.*Parquet.*GeoParquet.*pin a Hub commit.*digests.*derived review/i);
  for (const blocker of [
    'valid-five-digit-text-presented-as-current-assignment',
    'postal-zone-or-locality-label-presented-as-official-reusable-postal-polygon',
    'iderc-onei-geocuba-admin-statistical-cartographic-or-osm-evidence-presented-as-canonical-postal-polygon',
    'coordinate-parcel-street-locality-containment-or-proximity-presented-as-exact-building-relation',
    'derived-api-or-model-surface-presented-as-official-or-used-to-fill-unknown-coverage',
    'hugging-face-artifact-published-without-source-release-licence-crs-and-digest',
  ]) assert.ok(value.promotion.hard_blockers.includes(blocker));
});

test('Cuba source profile keeps operator, UPU, law, IDERC, ONEI, GEOCUBA, OSM, and Hugging Face partitions separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('correos-cuba-postal')?.assignment_authority ?? '', /official_postal_operator.*observation/i);
  assert.match(sources.get('correos-cuba-postal')?.geometry_authority ?? '', /none.*no_public.*polygon/i);
  assert.match(sources.get('upu-cuba-addressing-2004')?.assignment_authority ?? '', /dated_intergovernmental_semantics/i);
  assert.match(sources.get('upu-cuba-postcode-data')?.redistribution_class ?? '', /contract_NDA/i);
  assert.match(sources.get('iderc-cuba-geoportal')?.geometry_authority ?? '', /reference_geometry_not_postal/i);
  assert.match(sources.get('onei-cuba-dpa')?.geometry_authority ?? '', /statistical_or_administrative_context_not_postal/i);
  assert.match(sources.get('geocuba-cartography')?.redistribution_class ?? '', /commercial_or_restricted/i);
  assert.match(sources.get('osm-cuba')?.redistribution_class ?? '', /ODbL/i);
  assert.deepEqual(profile.hugging_face.preferred_formats, ['parquet', 'geoparquet']);
  assert.match(profile.hugging_face.production_read_rule, /pin-hub-commit.*digests/i);
  for (const id of [
    'official-postal-operator-observations', 'dated-postal-semantics', 'licensed-postcode-observations',
    'typed-postal-objects', 'derived-postal-validation-surfaces', 'administrative-identities-and-boundaries',
    'statistical-geographic-identities', 'civic-address-context',
    'explicit-civic-address-to-building-relation', 'restricted-cartographic-cadastre-building-context',
    'community-validation', 'agid-crosswalk', 'hugging-face-public-parquet',
    'hugging-face-gated-restricted-inputs', 'hugging-face-derived-review-surfaces',
  ]) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === id));
});

test('Cuba fixtures are synthetic and keep postal, admin, building, person, and AGID claims non-authoritative', () => {
  const pack = readJson<Fixtures>('fixtures/cuba-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'CU');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.postal_value, '99999');
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.synthetic_value_not_checked_against_live_operator, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.ok(postcodes.every(postcode => /^\d{5}$/.test(postcode)));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('cu-syn-')));
  for (const claim of [
    'synthetic-code-is-current-postal-assignment',
    'synthetic-polygon-is-official-correos-de-cuba-reusable-postal-geometry',
    'postal-zone-or-locality-label-is-official-reusable-postal-geometry',
    'iderc-onei-geocuba-admin-statistical-cartographic-or-osm-object-is-postal-assignment',
    'coordinate-parcel-street-locality-containment-or-proximity-is-exact-building-link',
    'person-household-occupant-owner-organization-or-query-log-is-public-address-data',
    'postal-source-coverage-extends-beyond-declared-cu-scope',
    'agid-cell-is-official-postal-geometry',
  ]) assert.ok(prohibited.has(claim));
});

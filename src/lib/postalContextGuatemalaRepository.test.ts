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
const seedRoot = resolve(root, 'data/postal_country_packs/gt/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Guatemala seed separates assignments, postal objects, administration, cadastre, buildings, models, time, AGID, and Hub artifacts', () => {
  const value = readJson<Manifest>('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-gt');
  assert.equal(value.repository.country_code, 'GT');
  assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, true);
  assert.equal(value.release_scope.contains_raw_source_data, false);
  assert.equal(value.release_scope.contains_real_addresses, false);
  assert.equal(value.release_scope.contains_personal_data, false);
  assert.equal(value.release_scope.contains_production_geometry, false);
  assert.equal(value.postal_system.code_format, 'NNNNN');
  assert.match(value.postal_system.assignment_rule, /five numeric digits.*department directories.*UPU.*not proof/i);
  assert.match(value.postal_system.geometry_rule, /not guaranteed.*polygon.*directory tables do not publish geometry.*SEGEPLAN.*RIC.*cannot be presented/i);
  assert.match(value.postal_system.address_format_rule, /recipient.*house number.*building.*finca.*P\.O\. Box.*no real/i);
  assert.match(value.postal_system.postal_object_rule, /urban_zone.*municipality.*routing_area.*unknown.*must not be forced/i);
  assert.match(value.postal_system.building_rule, /civic-address identifier.*stable reviewed explicit relation.*not an exact/i);
  assert.match(value.postal_system.administrative_rule, /SEGEPLAN.*INE.*IGN.*RIC.*contextual.*not.*postal/i);
  assert.match(value.postal_system.derived_and_realtime_rule, /machine-learning.*cache TTL.*derived status.*never overwrites/i);
  assert.match(value.postal_system.agid_rule, /independent spatial index.*Versioned crosswalks.*official Guatemalan/i);
  assert.match(value.postal_system.licence_rule, /not blanket open bulk-data licences.*SEGEPLAN.*RIC.*CC BY.*ODbL/i);
  assert.match(value.postal_system.temporal_rule, /November 2025.*2018 INE.*digest.*supersession/i);
  assert.match(value.postal_system.hugging_face_rule, /Dataset.*Parquet.*GeoParquet.*pin a Hub commit.*digests.*derived review/i);
  for (const blocker of [
    'valid-five-digit-text-presented-as-current-assignment',
    'official-directory-label-presented-as-official-reusable-postal-polygon',
    'segeplan-ine-ign-ric-admin-statistical-cartographic-cadastral-or-osm-evidence-presented-as-canonical-postal-polygon',
    'coordinate-parcel-zone-locality-containment-or-proximity-presented-as-exact-building-relation',
    'department-directory-set-not-inventoried-versioned-and-digested',
    'derived-api-or-model-surface-presented-as-official-or-used-to-fill-unknown-coverage',
    'hugging-face-artifact-published-without-source-release-licence-crs-and-digest',
  ]) assert.ok(value.promotion.hard_blockers.includes(blocker), blocker);
});

test('Guatemala source profile keeps operator, directory, UPU, spatial, census, cadastral, OSM, and Hugging Face partitions separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('correos-guatemala-postal')?.assignment_authority ?? '', /official_postal_operator.*observation/i);
  assert.match(sources.get('correos-guatemala-postcode-directory')?.assignment_authority ?? '', /official_postal_operator.*directory_row/i);
  assert.match(sources.get('correos-guatemala-postcode-directory')?.geometry_authority ?? '', /none.*tabular.*not_geometry/i);
  assert.match(sources.get('upu-guatemala-addressing-2025')?.assignment_authority ?? '', /semantics_not_assignment/i);
  assert.match(sources.get('segeplan-gt-ide')?.geometry_authority ?? '', /reference_geometry_not_postal/i);
  assert.match(sources.get('ine-guatemala-census-settlements')?.redistribution_class ?? '', /CC_BY/i);
  assert.match(sources.get('ric-guatemala-cadastre')?.redistribution_class ?? '', /registered_paid_or_restricted/i);
  assert.match(sources.get('osm-guatemala')?.redistribution_class ?? '', /ODbL/i);
  assert.deepEqual(profile.hugging_face.preferred_formats, ['parquet', 'geoparquet']);
  assert.match(profile.hugging_face.production_read_rule, /pin-hub-commit.*digests/i);
  for (const id of [
    'official-postal-operator-observations', 'official-postcode-directory-assignments',
    'current-postal-semantics', 'typed-postal-objects', 'derived-postal-validation-surfaces',
    'administrative-identities-and-boundaries', 'statistical-populated-place-context',
    'civic-address-context', 'explicit-civic-address-to-building-relation',
    'restricted-cartographic-cadastre-building-context', 'community-validation', 'agid-crosswalk',
    'hugging-face-public-parquet', 'hugging-face-gated-restricted-inputs',
    'hugging-face-derived-review-surfaces',
  ]) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === id), id);
});

test('Guatemala fixtures are synthetic and keep postal, admin, building, person, and AGID claims non-authoritative', () => {
  const pack = readJson<Fixtures>('fixtures/guatemala-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'GT');
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
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('gt-syn-')));
  for (const claim of [
    'synthetic-code-is-current-postal-assignment',
    'synthetic-polygon-is-official-correos-guatemala-reusable-postal-geometry',
    'official-directory-label-is-official-reusable-postal-geometry',
    'segeplan-ine-ign-ric-admin-statistical-cartographic-cadastral-or-osm-object-is-postal-assignment',
    'coordinate-parcel-zone-locality-containment-or-proximity-is-exact-building-link',
    'person-household-occupant-owner-organization-or-query-log-is-public-address-data',
    'postal-source-coverage-extends-beyond-declared-gt-scope',
    'agid-cell-is-official-postal-geometry',
  ]) assert.ok(prohibited.has(claim), claim);
});

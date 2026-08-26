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
  polygon_derivation_gate: { join_key: string; required_checks: string[]; maximum_claim: string; failure_mode: string };
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
const seedRoot = resolve(root, 'data/postal_country_packs/cr/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Costa Rica seed separates assignments, district derivation, SNIT rights, addresses, buildings, time, AGID, and Hub artifacts', () => {
  const value = readJson<Manifest>('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-cr');
  assert.equal(value.repository.country_code, 'CR');
  assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, true);
  assert.equal(value.release_scope.contains_raw_source_data, false);
  assert.equal(value.release_scope.contains_real_addresses, false);
  assert.equal(value.release_scope.contains_personal_data, false);
  assert.equal(value.release_scope.contains_production_geometry, false);
  assert.equal(value.postal_system.code_format, 'NNNNN');
  assert.match(value.postal_system.assignment_rule, /province digit.*canton digits.*district digits.*each district.*not proof/i);
  assert.match(value.postal_system.geometry_rule, /official-derived.*one-to-one.*time-compatible.*UGED.*SNIT.*cannot be presented/i);
  assert.match(value.postal_system.address_format_rule, /exact directions.*landmark.*building.*P\.O\. Box.*no real/i);
  assert.match(value.postal_system.postal_object_rule, /administrative_district_postcode.*delivery_point_19_digit_internal.*must not be reconstructed/i);
  assert.match(value.postal_system.building_rule, /civic-address identifier.*stable reviewed explicit relation.*not an exact/i);
  assert.match(value.postal_system.administrative_rule, /INEC DTA.*UGED.*IGN.*SNIT.*not.*Correos-issued/i);
  assert.match(value.postal_system.derived_and_realtime_rule, /strict code joins.*machine-learning.*cache TTL.*never overwrites/i);
  assert.match(value.postal_system.agid_rule, /independent spatial index.*Versioned crosswalks.*official Costa Rican/i);
  assert.match(value.postal_system.licence_rule, /not blanket open bulk-data licences.*SNIT.*prohibit.*ODbL/i);
  assert.match(value.postal_system.temporal_rule, /April 2009.*UGED 2024.*digest.*supersession/i);
  assert.match(value.postal_system.hugging_face_rule, /Dataset.*Parquet.*GeoParquet.*pin a Hub commit.*digests.*derived review/i);
  for (const blocker of [
    'valid-five-digit-or-dta-code-presented-as-current-postal-assignment',
    'district-geometry-presented-as-operator-issued-postal-polygon',
    'inec-uged-dta-ign-snit-osm-or-model-geometry-promoted-without-one-to-one-versioned-rights-cleared-crosswalk',
    'snit-direct-or-derived-geography-used-commercially-without-separate-rights',
    'coordinate-district-parcel-landmark-directions-containment-or-proximity-presented-as-exact-building-relation',
    'internal-19-digit-delivery-point-reconstructed-or-published',
    'derived-api-or-model-surface-presented-as-official-or-used-to-fill-unknown-coverage',
    'hugging-face-artifact-published-without-source-release-licence-crs-and-digest',
  ]) assert.ok(value.promotion.hard_blockers.includes(blocker), blocker);
});

test('Costa Rica source profile implements the strict postcode-to-district polygon derivation gate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('correos-costa-rica-postal')?.assignment_authority ?? '', /official_postal_operator.*observation/i);
  assert.match(sources.get('correos-costa-rica-postal')?.geometry_authority ?? '', /none.*no_public.*polygon/i);
  assert.match(sources.get('upu-costa-rica-addressing-2009')?.assignment_authority ?? '', /historical.*not_current_assignment/i);
  assert.match(sources.get('inec-cr-uged-2024')?.geometry_authority ?? '', /geostatistical.*strict_official_derived_crosswalk/i);
  assert.match(sources.get('snit-cr')?.redistribution_class ?? '', /prohibit_commercial.*derived/i);
  assert.match(sources.get('osm-costa-rica')?.redistribution_class ?? '', /ODbL/i);
  assert.match(profile.polygon_derivation_gate.join_key, /province_digit.*canton_code.*district_code/i);
  assert.equal(profile.polygon_derivation_gate.maximum_claim, 'official-derived');
  assert.match(profile.polygon_derivation_gate.failure_mode, /non-geometric.*failed gate/i);
  for (const check of [
    'pinned-correos-assignment-observation', 'one-to-one-code-to-district-join',
    'assignment-and-geometry-validity-overlap', 'resource-level-licence-allows-output',
    'crs-and-topology-valid', 'source-and-output-digests-pinned',
  ]) assert.ok(profile.polygon_derivation_gate.required_checks.includes(check), check);
  assert.deepEqual(profile.hugging_face.preferred_formats, ['parquet', 'geoparquet']);
  assert.match(profile.hugging_face.production_read_rule, /pin-hub-commit.*digests/i);
  for (const id of [
    'official-postal-operator-observations', 'historical-postal-semantics', 'typed-postal-objects',
    'administrative-identities-and-codes', 'versioned-administrative-crosswalks',
    'official-geostatistical-district-reference', 'restricted-snit-reference-metadata',
    'derived-district-postcode-review-surfaces', 'civic-address-context',
    'explicit-civic-address-to-building-relation', 'community-validation', 'agid-crosswalk',
    'hugging-face-public-parquet', 'hugging-face-gated-restricted-inputs',
    'hugging-face-derived-review-surfaces',
  ]) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === id), id);
});

test('Costa Rica fixtures are synthetic and keep postal, district, building, person, and AGID claims non-authoritative', () => {
  const pack = readJson<Fixtures>('fixtures/costa-rica-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'CR');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.postal_value, '79999');
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.synthetic_value_not_checked_against_live_operator, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.ok(postcodes.every(postcode => /^[1-7]\d{4}$/.test(postcode)));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('cr-syn-')));
  for (const claim of [
    'synthetic-code-is-current-postal-assignment',
    'synthetic-polygon-is-official-correos-costa-rica-postal-geometry',
    'inec-uged-dta-ign-snit-osm-or-model-object-is-operator-issued-postal-geometry',
    'snit-direct-or-derived-geography-is-commercially-reusable',
    'internal-19-digit-delivery-point-can-be-reconstructed',
    'coordinate-district-parcel-landmark-directions-containment-or-proximity-is-exact-building-link',
    'person-household-occupant-owner-organization-or-query-log-is-public-address-data',
    'postal-source-coverage-extends-beyond-declared-cr-scope',
    'agid-cell-is-official-postal-geometry',
  ]) assert.ok(prohibited.has(claim), claim);
});

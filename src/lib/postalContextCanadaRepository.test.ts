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
const seedRoot = resolve(root, 'data/postal_country_packs/ca/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Canada seed separates FSA/LDU semantics, census geometry, addresses, buildings, licences, models, and AGID', () => {
  const value = readJson<Manifest>('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-ca');
  assert.equal(value.repository.country_code, 'CA');
  assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, true);
  assert.equal(value.release_scope.contains_raw_source_data, false);
  assert.equal(value.release_scope.contains_real_addresses, false);
  assert.equal(value.release_scope.contains_personal_data, false);
  assert.equal(value.release_scope.contains_production_geometry, false);
  assert.equal(value.postal_system.code_format, 'ANA NAN');
  assert.match(value.postal_system.assignment_rule, /Forward Sortation Area.*Local Delivery Unit.*block face.*single building.*valid syntax.*not proof/i);
  assert.match(value.postal_system.geometry_rule, /delivery-unit-first.*not guaranteed.*polygon.*respondent-reported.*not necessarily equivalent.*no LDU/i);
  assert.match(value.postal_system.address_format_rule, /recipient.*unit.*civic number.*street direction.*rural route.*province or territory.*no real/i);
  assert.match(value.postal_system.postal_object_rule, /block_face.*building.*large_volume_receiver.*rural_community.*unknown/i);
  assert.match(value.postal_system.building_rule, /civic address identifier.*stable explicit relation.*PCCF.*NAR.*ODB.*not an exact/i);
  assert.match(value.postal_system.address_register_rule, /National Address Register.*non-confidential.*address and location identifiers.*not establish/i);
  assert.match(value.postal_system.derived_and_realtime_rule, /licensed-data observations.*cache TTL.*derived status.*never overwrites/i);
  assert.match(value.postal_system.agid_rule, /independent spatial index.*Versioned crosswalks.*Canada Post postal geometry/i);
  assert.match(value.postal_system.licence_rule, /licensed products.*AddressComplete.*CFSA.*NAR.*ODB.*ODbL/i);
  assert.match(value.postal_system.temporal_rule, /monthly licensed releases.*2021 CFSA.*semi-annual NAR.*timeless delivery truth/i);
  for (const blocker of [
    'valid-six-character-text-presented-as-current-canada-post-assignment',
    'full-postal-code-or-ldu-presented-as-universal-polygon',
    'census-fsa-presented-as-current-canada-post-fsa-or-full-code-boundary',
    'pccf-coordinate-nar-point-odb-footprint-containment-or-proximity-presented-as-exact-building-relation',
    'licensed-canada-post-or-pccf-content-published-or-derived-beyond-terms',
    'derived-api-or-model-surface-presented-as-official-or-used-to-fill-unknown-coverage',
  ]) assert.ok(value.promotion.hard_blockers.includes(blocker));
});

test('Canada source profile keeps Canada Post, PCCF, CFSA, NAR, buildings, and community authority separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('canada-post-postal')?.assignment_authority ?? '', /postal_operator.*lookup/i);
  assert.match(sources.get('canada-post-addresscomplete')?.redistribution_class ?? '', /authenticated_commercial/i);
  assert.match(sources.get('canada-post-licensed-postal-data')?.assignment_authority ?? '', /licensed_assignment_release/i);
  assert.match(sources.get('statcan-pccf-licensed')?.geometry_authority ?? '', /coordinate_and_census_link.*not_postal_boundary/i);
  assert.match(sources.get('statcan-census-fsa-2021')?.geometry_authority ?? '', /census_fsa_reference.*not_canada_post/i);
  assert.match(sources.get('statcan-national-address-register')?.geometry_authority ?? '', /address_location_point.*not_postal_polygon/i);
  assert.match(sources.get('statcan-open-database-buildings')?.geometry_authority ?? '', /building_footprint.*not_postal/i);
  assert.match(sources.get('osm-canada')?.redistribution_class ?? '', /ODbL/i);
  for (const id of [
    'official-postal-semantics-and-lookup-observations', 'licensed-postal-assignment-releases',
    'credentialed-address-observations', 'typed-postal-objects', 'historical-postal-observations',
    'licensed-pccf-crosswalks', 'census-fsa-reference-geometry', 'derived-postal-validation-surfaces',
    'administrative-identities-and-boundaries', 'nar-civic-address-context',
    'explicit-civic-address-to-building-relation', 'open-building-context',
    'community-validation', 'agid-crosswalk',
  ]) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === id));
});

test('Canada fixtures are synthetic and keep assignment, census, building, licence, and AGID claims non-authoritative', () => {
  const pack = readJson<Fixtures>('fixtures/canada-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'CA');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.postal_value, 'H9H 9H9');
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.synthetic_value_not_checked_against_live_operator, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.ok(postcodes.every(postcode => /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTVWXYZ] \d[ABCEGHJ-NPRSTVWXYZ]\d$/.test(postcode)));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('ca-syn-')));
  for (const claim of [
    'synthetic-code-is-current-canada-post-assignment',
    'synthetic-polygon-is-official-canada-post-reusable-postal-geometry',
    'census-fsa-is-current-canada-post-fsa-or-full-code-geometry',
    'pccf-nar-odb-or-osm-object-is-postal-assignment',
    'pccf-coordinate-nar-point-odb-containment-or-proximity-is-exact-building-link',
    'resident-occupant-organization-or-property-data-is-public-address-data',
    'postal-source-coverage-extends-beyond-declared-ca-scope',
    'agid-cell-is-official-postal-geometry',
  ]) assert.ok(prohibited.has(claim));
});

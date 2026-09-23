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
const seedRoot = resolve(root, 'data/postal_country_packs/sv/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('El Salvador seed separates postal semantics, administration, cadastre, buildings, models, time, and AGID', () => {
  const value = readJson<Manifest>('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-sv');
  assert.equal(value.repository.country_code, 'SV');
  assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, true);
  assert.equal(value.release_scope.contains_raw_source_data, false);
  assert.equal(value.release_scope.contains_real_addresses, false);
  assert.equal(value.release_scope.contains_personal_data, false);
  assert.equal(value.release_scope.contains_production_geometry, false);
  assert.equal(value.postal_system.code_format, 'NNNN');
  assert.match(value.postal_system.assignment_rule, /four numeric digits.*region.*department.*locality or delivery area.*syntax.*not proof/i);
  assert.match(value.postal_system.geometry_rule, /not guaranteed.*polygon.*CNR.*Voronoi.*cannot be presented.*reuse rights/i);
  assert.match(value.postal_system.address_format_rule, /recipient.*building.*passage.*poligono.*caserio.*district.*no real example/i);
  assert.match(value.postal_system.postal_object_rule, /postal_area.*route.*unknown.*must not be forced/i);
  assert.match(value.postal_system.building_rule, /civic-address identifier.*stable reviewed relation.*not an exact/i);
  assert.match(value.postal_system.cadastre_rule, /CNR.*paid.*Parcels remain separate.*Owner.*neighbor/i);
  assert.match(value.postal_system.derived_and_realtime_rule, /machine learning.*cache TTL.*derived status.*never overwrites/i);
  assert.match(value.postal_system.agid_rule, /independent spatial index.*Versioned crosswalks.*official El Salvador/i);
  assert.match(value.postal_system.licence_rule, /no blanket bulk.*CNR.*ONEC.*ODbL/i);
  assert.match(value.postal_system.temporal_rule, /2019 UPU.*post-2023.*source version.*legacy municipalities.*districts/i);
  for (const blocker of [
    'valid-four-digit-text-presented-as-current-assignment',
    'locality-or-delivery-area-label-presented-as-official-reusable-postal-polygon',
    'cnr-onec-admin-census-cadastre-or-osm-evidence-presented-as-canonical-postal-polygon',
    'coordinate-parcel-canton-containment-or-proximity-presented-as-exact-building-relation',
    'derived-api-or-model-surface-presented-as-official-or-used-to-fill-unknown-coverage',
    'legacy-municipality-and-current-district-identities-merged-without-versioned-crosswalk',
  ]) assert.ok(value.promotion.hard_blockers.includes(blocker));
});

test('El Salvador source profile keeps Correos, UPU, CNR, ONEC, cadastre, and community authority separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('correos-el-salvador')?.assignment_authority ?? '', /official_postal_operator.*reference/i);
  assert.match(sources.get('correos-el-salvador')?.geometry_authority ?? '', /none.*no_versioned.*polygon/i);
  assert.match(sources.get('upu-el-salvador-addressing-2019')?.assignment_authority ?? '', /dated_intergovernmental_semantics/i);
  assert.match(sources.get('cnr-el-salvador-geographic-codes')?.geometry_authority ?? '', /administrative_geometry.*not_postal/i);
  assert.match(sources.get('onec-el-salvador-geographic-catalog')?.geometry_authority ?? '', /catalog_identifiers.*not_postal/i);
  assert.match(sources.get('cnr-el-salvador-cadastre')?.redistribution_class ?? '', /commercial_or_restricted/i);
  assert.match(sources.get('osm-el-salvador')?.redistribution_class ?? '', /ODbL/i);
  for (const id of [
    'official-postal-operator-observations', 'dated-postal-semantics', 'typed-postal-objects',
    'historical-postal-observations', 'derived-postal-validation-surfaces',
    'administrative-identities-and-boundaries', 'statistical-geographic-identities',
    'versioned-administrative-crosswalks', 'civic-address-context',
    'explicit-civic-address-to-building-relation', 'restricted-cadastre-context',
    'community-validation', 'agid-crosswalk',
  ]) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === id));
});

test('El Salvador fixtures are synthetic and keep postal, admin, building, property, and AGID claims non-authoritative', () => {
  const pack = readJson<Fixtures>('fixtures/el-salvador-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'SV');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.postal_value, '9999');
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.synthetic_value_not_checked_against_live_operator, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.ok(postcodes.every(postcode => /^\d{4}$/.test(postcode)));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('sv-syn-')));
  for (const claim of [
    'synthetic-code-is-current-postal-assignment',
    'synthetic-polygon-is-official-correos-reusable-postal-geometry',
    'locality-or-delivery-area-label-is-official-reusable-postal-geometry',
    'cnr-onec-admin-census-cadastre-or-osm-object-is-postal-assignment',
    'coordinate-parcel-canton-containment-or-proximity-is-exact-building-link',
    'owner-possessor-neighbor-person-property-or-registration-data-is-public-address-data',
    'postal-source-coverage-extends-beyond-declared-sv-scope',
    'agid-cell-is-official-postal-geometry',
  ]) assert.ok(prohibited.has(claim));
});

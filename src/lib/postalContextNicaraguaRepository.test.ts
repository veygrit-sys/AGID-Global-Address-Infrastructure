import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/ni/postal-context');
const readJson = (name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as any;

test('Nicaraguan seed separates typed postal objects, geometry, administration, directions, buildings, cadastre, privacy, and AGID', () => {
  const value = readJson('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-ni');
  assert.equal(value.repository.country_code, 'NI');
  assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, true);
  assert.equal(value.release_scope.contains_raw_source_data, false);
  assert.equal(value.release_scope.contains_real_addresses, false);
  assert.equal(value.release_scope.contains_personal_data, false);
  assert.equal(value.release_scope.contains_production_geometry, false);
  assert.equal(value.postal_system.code_format, 'NNNNN');
  assert.match(value.postal_system.assignment_rule, /Correos de Nicaragua.*five numeric digits.*geopostal region.*municipality.*Managua-quadrant.*barrio or rural comarca.*Código Maestro.*not syntax/i);
  assert.match(value.postal_system.geometry_rule, /area-or-non-area.*Código Maestro.*not an area.*No reusable national official.*derived-review.*cannot fill/i);
  assert.match(value.postal_system.address_format_rule, /directional reference.*house number.*barrio or comarca.*P\.O\. box.*never production/i);
  assert.match(value.postal_system.postal_object_rule, /barrio_or_comarca.*municipality_master.*post_office.*must never be collapsed/i);
  assert.match(value.postal_system.building_rule, /stable civic-address.*explicit reviewed relation.*directional reference.*not an exact/i);
  assert.match(value.postal_system.administrative_rule, /INIDE.*fifteen departments.*two autonomous.*153 municipalities.*INETER.*not Correos/i);
  assert.match(value.postal_system.cadastre_rule, /INETER cadastral.*restrict.*substitute dataset.*cannot be inferred/i);
  assert.match(value.postal_system.derived_and_realtime_rule, /Correos observations.*barrio-or-comarca review surfaces.*train or run review models.*never overwrites.*Código Maestro/i);
  assert.match(value.postal_system.agid_rule, /independent spatial index.*Versioned crosswalks.*official Nicaraguan postal geometry/i);
  assert.match(value.postal_system.licence_rule, /Public Correos.*does not.*bulk.*INETER cadastral.*ODbL/i);
  assert.match(value.postal_system.temporal_rule, /May 2014 UPU.*INIDE territorial editions.*INETER layers.*supersession/i);
  assert.match(value.postal_system.hugging_face_rule, /Dataset.*Parquet.*GeoParquet.*pin a Hub commit.*digests/i);
  for (const blocker of [
    'valid-five-digit-text-presented-as-current-correos-assignment',
    'municipality-master-code-presented-as-a-postal-area-polygon',
    'postcode-barrio-comarca-or-locality-presented-as-an-automatic-polygon',
    'interactive-search-response-republished-as-a-bulk-address-dataset',
    'barrio-comarca-master-code-route-post-office-and-po-box-conflated',
    'inide-ineter-cadastral-community-api-cache-or-model-geometry-presented-as-correos-postal-geometry',
    'postcode-direction-landmark-parcel-coordinate-containment-interpolation-or-proximity-presented-as-exact-building-relation',
    'owner-recipient-occupant-credential-or-query-data-published-without-authority',
    'derived-buffer-voronoi-interpolation-or-model-surface-presented-as-official-or-used-to-fill-unknown-coverage',
  ]) assert.ok(value.promotion.hard_blockers.includes(blocker), blocker);
});

test('Nicaraguan source profile gates official observations and caps postal geometry at derived review', () => {
  const profile = readJson('source-profile.json');
  const sources = new Map<string, any>(profile.sources.map((source: any) => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every((source: any) => source.bundled_here === false));
  assert.match(sources.get('correos-nicaragua-postcode-search')?.assignment_authority ?? '', /official_postal_operator.*observation/i);
  assert.match(sources.get('correos-nicaragua-postcode-search')?.geometry_authority ?? '', /none.*no_verified.*polygon/i);
  assert.match(sources.get('inide-nicaragua-territorial-2023')?.geometry_authority ?? '', /publication_context/i);
  assert.match(sources.get('ineter-ni-ide')?.geometry_authority ?? '', /administrative.*not_postal/i);
  assert.match(sources.get('ineter-nicaragua-cadastral-ide')?.redistribution_class ?? '', /noncommercial.*authorization/i);
  assert.match(sources.get('osm-nicaragua')?.redistribution_class ?? '', /ODbL/i);
  assert.equal(profile.assignment_observation_gate.maximum_claim, 'official-observation');
  assert.equal(profile.geometry_promotion_gate.maximum_claim, 'derived-review');
  assert.match(profile.geometry_promotion_gate.failure_mode, /non-geometric.*failed gate/i);
  for (const check of [
    'authorized-code-barrio-comarca-or-municipality-query',
    'operator-detail-response-and-service-version-pinned',
    'observed-at-and-response-digest-recorded',
    'municipality-master-code-distinguished-from-area-code',
    'addresses-directions-credentials-and-query-logs-minimized-and-protected',
  ]) assert.ok(profile.assignment_observation_gate.required_checks.includes(check), check);
  for (const check of [
    'source-postal-area-evidence-rights-cleared',
    'barrio-or-comarca-and-postal-object-join-reviewed',
    'municipality-master-post-office-route-po-box-and-organization-objects-excluded',
    'administrative-boundary-version-time-compatible',
    'derived-status-never-upgraded-by-model-confidence',
  ]) assert.ok(profile.geometry_promotion_gate.required_checks.includes(check), check);
  assert.deepEqual(profile.hugging_face.preferred_formats, ['parquet', 'geoparquet']);
  assert.match(profile.hugging_face.production_read_rule, /pin-hub-commit.*digests/i);
  for (const id of [
    'official-postal-operator-observations', 'typed-postal-objects',
    'barrio-comarca-and-locality-context', 'municipality-master-codes',
    'post-office-route-and-po-box-objects', 'administrative-identities-and-geometry',
    'official-cartographic-context', 'civic-address-context',
    'explicit-civic-address-to-building-relation', 'restricted-cadastral-context',
    'derived-postal-area-review-geometry', 'community-validation', 'agid-crosswalk',
    'hugging-face-public-parquet', 'hugging-face-gated-restricted-inputs',
  ]) assert.ok(profile.artifact_partitions.some((candidate: any) => candidate.id === id), id);
});

test('Nicaraguan fixtures are synthetic and keep postal, directional, cadastral, person, building, and AGID claims non-authoritative', () => {
  const pack = readJson('fixtures/nicaragua-synthetic.json');
  const postcodes = pack.fixtures.map((item: any) => item.synthetic_address.postcode).filter(Boolean);
  const prohibited = new Set(pack.fixtures.flatMap((item: any) => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'NI');
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
  assert.ok(postcodes.every((postcode: string) => /^\d{5}$/.test(postcode)));
  assert.ok(pack.fixtures.every((item: any) => item.fixture_id.startsWith('ni-syn-')));
  for (const claim of [
    'synthetic-code-is-current-correos-assignment',
    'synthetic-polygon-is-official-correos-postal-geometry',
    'municipality-master-code-is-a-postal-area-polygon',
    'postcode-barrio-comarca-or-locality-is-automatically-a-polygon',
    'barrio-comarca-master-code-route-post-office-and-po-box-are-interchangeable',
    'inide-ineter-cadastral-community-api-cache-or-model-object-is-correos-postal-geometry',
    'postcode-direction-landmark-parcel-coordinate-containment-interpolation-or-proximity-is-exact-building-link',
    'person-household-owner-occupant-organization-credential-or-query-log-is-public-address-data',
    'postal-source-coverage-extends-beyond-declared-ni-scope',
    'agid-cell-is-official-postal-geometry',
  ]) assert.ok(prohibited.has(claim), claim);
});

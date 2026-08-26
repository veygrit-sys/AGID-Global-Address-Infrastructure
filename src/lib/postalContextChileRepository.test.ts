import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/cl/postal-context');
const readJson = (name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as any;

test('Chile seed separates block-face semantics, observations, derived geometry, buildings, cadastre, privacy, and AGID', () => {
  const value = readJson('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-cl');
  assert.equal(value.repository.country_code, 'CL');
  assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, true);
  assert.equal(value.release_scope.contains_raw_source_data, false);
  assert.equal(value.release_scope.contains_real_addresses, false);
  assert.equal(value.release_scope.contains_personal_data, false);
  assert.equal(value.release_scope.contains_production_geometry, false);
  assert.equal(value.postal_system.code_format, 'NNNNNNN');
  assert.match(value.postal_system.assignment_rule, /commune.*street.*municipal number.*first three.*distribution area.*final four.*block face.*not proof/i);
  assert.match(value.postal_system.geometry_rule, /address-range-first.*not automatically a polygon.*No reusable national official.*derived review.*cannot fill/i);
  assert.match(value.postal_system.address_format_rule, /municipal number.*address remainder.*floor.*P\.O\. box.*Rural no-number.*never production/i);
  assert.match(value.postal_system.postal_object_rule, /block_face.*commune_fallback.*post_office.*must never be collapsed/i);
  assert.match(value.postal_system.building_rule, /stable civic-address.*explicit reviewed relation.*not an exact/i);
  assert.match(value.postal_system.administrative_rule, /IDE Chile DPA.*SUBDERE CUT.*INE.*distinct from CorreosChile/i);
  assert.match(value.postal_system.cadastre_rule, /SII.*owner RUT.*publicly replicated without authority/i);
  assert.match(value.postal_system.derived_and_realtime_rule, /normalization responses.*block-face review segments.*train or run review models.*never overwrites/i);
  assert.match(value.postal_system.agid_rule, /independent spatial index.*Versioned crosswalks.*official Chilean postal geometry/i);
  assert.match(value.postal_system.licence_rule, /Public CorreosChile.*do not grant bulk.*SII.*ODbL/i);
  assert.match(value.postal_system.temporal_rule, /March 2017 UPU.*Census 2024.*SII revaluations.*supersession/i);
  assert.match(value.postal_system.hugging_face_rule, /Dataset.*Parquet.*GeoParquet.*pin a Hub commit.*digests/i);
  for (const blocker of [
    'valid-seven-digit-text-presented-as-current-correoschile-assignment',
    'block-face-or-commune-fallback-presented-as-an-automatic-polygon',
    'interactive-or-credentialed-response-republished-as-a-bulk-address-dataset',
    'distribution-area-block-face-commune-fallback-post-office-and-po-box-conflated',
    'ide-subdere-ine-sii-community-api-cache-or-model-geometry-presented-as-correoschile-postal-geometry',
    'postcode-address-text-sii-role-parcel-coordinate-containment-or-proximity-presented-as-exact-building-relation',
    'owner-rut-valuation-recipient-occupant-credential-or-query-data-published-without-authority',
    'derived-range-buffer-voronoi-or-model-surface-presented-as-official-or-used-to-fill-unknown-coverage',
  ]) assert.ok(value.promotion.hard_blockers.includes(blocker), blocker);
});

test('Chile source profile gates official observations and caps postal geometry at derived review', () => {
  const profile = readJson('source-profile.json');
  const sources = new Map<string, any>(profile.sources.map((source: any) => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every((source: any) => source.bundled_here === false));
  assert.match(sources.get('correos-chile-postcode')?.assignment_authority ?? '', /official_postal_operator.*observation/i);
  assert.match(sources.get('correos-chile-postcode')?.geometry_authority ?? '', /none.*block_face.*not_geometry_release/i);
  assert.match(sources.get('correos-chile-normalization-api')?.redistribution_class ?? '', /customer_contract.*credentials/i);
  assert.match(sources.get('ide-chile-dpa-2023')?.geometry_authority ?? '', /dpa.*not_postal/i);
  assert.match(sources.get('ine-chile-open-geodata')?.geometry_authority ?? '', /statistical.*not_postal/i);
  assert.match(sources.get('sii-chile-digital-cadastre')?.redistribution_class ?? '', /public_query.*restricted.*not_bulk/i);
  assert.match(sources.get('osm-chile')?.redistribution_class ?? '', /ODbL/i);
  assert.equal(profile.assignment_observation_gate.maximum_claim, 'official-observation');
  assert.equal(profile.geometry_promotion_gate.maximum_claim, 'derived-review');
  assert.match(profile.geometry_promotion_gate.failure_mode, /non-geometric.*failed gate/i);
  for (const check of [
    'exact-address-and-commune-input-purpose-authorized',
    'operator-response-and-service-version-pinned',
    'observed-at-and-response-digest-recorded',
    'credentials-addresses-and-query-logs-minimized-and-protected',
  ]) assert.ok(profile.assignment_observation_gate.required_checks.includes(check), check);
  for (const check of [
    'source-address-range-or-road-side-evidence-rights-cleared',
    'block-face-side-and-range-direction-reviewed',
    'commune-fallback-and-post-office-objects-excluded',
    'derived-status-never-upgraded-by-model-confidence',
  ]) assert.ok(profile.geometry_promotion_gate.required_checks.includes(check), check);
  assert.deepEqual(profile.hugging_face.preferred_formats, ['parquet', 'geoparquet']);
  assert.match(profile.hugging_face.production_read_rule, /pin-hub-commit.*digests/i);
  for (const id of [
    'official-postal-operator-observations', 'credentialed-address-normalization-observations',
    'postal-distribution-area-objects', 'block-face-postal-objects',
    'commune-fallback-postal-objects', 'post-office-and-po-box-objects',
    'administrative-identities-and-geometry', 'statistical-block-and-entity-context',
    'civic-address-context', 'explicit-civic-address-to-building-relation',
    'restricted-cadastral-and-property-context', 'derived-block-face-review-geometry',
    'community-validation', 'agid-crosswalk', 'hugging-face-public-parquet',
    'hugging-face-gated-restricted-inputs',
  ]) assert.ok(profile.artifact_partitions.some((candidate: any) => candidate.id === id), id);
});

test('Chile fixtures are synthetic and keep postal, cadastral, person, building, and AGID claims non-authoritative', () => {
  const pack = readJson('fixtures/chile-synthetic.json');
  const postcodes = pack.fixtures.map((item: any) => item.synthetic_address.postcode).filter(Boolean);
  const prohibited = new Set(pack.fixtures.flatMap((item: any) => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'CL');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.postal_value, '9999999');
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.synthetic_value_not_checked_against_live_operator, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.ok(postcodes.every((postcode: string) => /^\d{7}$/.test(postcode)));
  assert.ok(pack.fixtures.every((item: any) => item.fixture_id.startsWith('cl-syn-')));
  for (const claim of [
    'synthetic-code-is-current-correoschile-assignment',
    'synthetic-polygon-is-official-correoschile-postal-geometry',
    'block-face-or-commune-fallback-is-automatically-a-polygon',
    'distribution-area-block-face-commune-fallback-post-office-and-po-box-are-interchangeable',
    'ide-subdere-ine-sii-community-api-cache-or-model-object-is-correoschile-postal-geometry',
    'postcode-address-text-sii-role-parcel-coordinate-containment-or-proximity-is-exact-building-link',
    'person-household-owner-rut-occupant-valuation-organization-or-query-log-is-public-address-data',
    'postal-source-coverage-extends-beyond-declared-cl-scope',
    'agid-cell-is-official-postal-geometry',
  ]) assert.ok(prohibited.has(claim), claim);
});

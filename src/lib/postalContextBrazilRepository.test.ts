import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/br/postal-context');
const readJson = (name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as any;

test('Brazilian seed separates typed CEP objects, geometry, CNEFE, administration, buildings, privacy, and AGID', () => {
  const value = readJson('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-br'); assert.equal(value.repository.country_code, 'BR');
  assert.equal(value.repository.maturity, 'M1_metadata'); assert.equal(value.release_scope.metadata_only, true);
  assert.equal(value.release_scope.contains_raw_source_data, false); assert.equal(value.release_scope.contains_real_addresses, false);
  assert.equal(value.release_scope.contains_personal_data, false); assert.equal(value.release_scope.contains_production_geometry, false);
  assert.match(value.postal_system.code_format, /NNNNN-NNN.*NNNNNNNN/i);
  assert.match(value.postal_system.assignment_rule, /Correios.*eight-digit.*syntax alone.*Busca CEP.*DNE.*logradouro.*building.*large user.*P\.O\. box/i);
  assert.match(value.postal_system.geometry_rule, /area-or-non-area.*locality.*Street.*Voronoi.*CNEFE.*not an official.*No reusable nationwide/i);
  assert.match(value.postal_system.postal_object_rule, /logradouro_or_range.*locality_or_area.*large_user.*community_mailbox.*must never be collapsed/i);
  assert.match(value.postal_system.building_rule, /CNEFE.*NV_GEO_COORD.*street-face midpoint.*census-sector centroid.*stable civic-address.*not an exact/i);
  assert.match(value.postal_system.administrative_rule, /IBGE.*federative units.*municipal.*not Correios/i);
  assert.match(value.postal_system.cnefe_rule, /CNEFE 2022.*logradouro.*CEP.*positional-quality.*never.*building footprint/i);
  assert.match(value.postal_system.derived_and_realtime_rule, /Correios.*DNE.*rank candidates.*train or run review models.*never upgrades.*unknown/i);
  assert.match(value.postal_system.agid_rule, /independent spatial index.*Versioned crosswalks.*official Brazilian postal geometry/i);
  assert.match(value.postal_system.licence_rule, /contract.*DNE.*commercially licensed.*UPU.*ViaCEP.*ODbL/i);
  assert.match(value.postal_system.hugging_face_rule, /Dataset.*Parquet.*GeoParquet.*CNEFE.*pin a Hub commit.*digests/i);
  for (const blocker of [
    'valid-eight-digit-text-presented-as-current-correios-assignment', 'typed-cep-object-presented-as-an-automatic-polygon',
    'street-range-building-large-user-unit-locker-po-box-community-mailbox-or-organization-cep-presented-as-area',
    'correios-api-or-dne-record-republished-without-contractual-authority',
    'cnefe-point-cep-aggregate-administrative-boundary-api-cache-or-model-geometry-presented-as-correios-postal-geometry',
    'postcode-address-point-parcel-coordinate-containment-interpolation-or-proximity-presented-as-exact-building-relation',
    'derived-buffer-voronoi-interpolation-or-model-surface-presented-as-official-or-used-to-fill-unknown-coverage',
  ]) assert.ok(value.promotion.hard_blockers.includes(blocker), blocker);
});

test('Brazilian source profile gates official evidence and caps postal geometry at derived review', () => {
  const profile = readJson('source-profile.json'); const sources = new Map<string, any>(profile.sources.map((source: any) => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed'); assert.ok(profile.sources.every((source: any) => source.bundled_here === false));
  assert.match(sources.get('correios-cep-api')?.assignment_authority ?? '', /official_postal_operator.*observation/i);
  assert.match(sources.get('correios-cep-api')?.redistribution_class ?? '', /contract.*credentials/i);
  assert.match(sources.get('correios-dne-licensing')?.redistribution_class ?? '', /commercial.*purpose/i);
  assert.match(sources.get('ibge-cnefe-2022')?.geometry_authority ?? '', /points.*not_postal.*building/i);
  assert.match(sources.get('ibge-municipal-mesh-2024')?.geometry_authority ?? '', /administrative.*not_postal/i);
  assert.match(sources.get('osm-brazil')?.redistribution_class ?? '', /ODbL/i);
  assert.equal(profile.assignment_observation_gate.maximum_claim, 'official-observation'); assert.equal(profile.geometry_promotion_gate.maximum_claim, 'derived-review');
  assert.match(profile.geometry_promotion_gate.failure_mode, /non-geometric CEP object.*failed gate/i);
  for (const check of ['authorized-eight-digit-correios-query-or-licensed-dne-row', 'api-or-dne-version-and-contractual-scope-pinned', 'typed-cep-object-distinguished-from-area-capability', 'addresses-credentials-personal-data-and-query-logs-minimized-and-protected']) assert.ok(profile.assignment_observation_gate.required_checks.includes(check), check);
  for (const check of ['source-postal-area-evidence-rights-cleared', 'locality-area-capability-and-boundary-crosswalk-reviewed', 'street-range-building-large-user-unit-locker-po-box-community-mailbox-organization-and-unknown-objects-excluded', 'cnefe-and-administrative-context-not-promoted-to-postal-authority', 'derived-status-never-upgraded-by-model-confidence']) assert.ok(profile.geometry_promotion_gate.required_checks.includes(check), check);
  assert.deepEqual(profile.hugging_face.preferred_formats, ['parquet', 'geoparquet']); assert.match(profile.hugging_face.production_read_rule, /pin-hub-commit.*digests/i);
});

test('Brazilian fixtures are synthetic and keep postal, CNEFE, person, building, and AGID claims non-authoritative', () => {
  const pack = readJson('fixtures/brazil-synthetic.json'); const prohibited = new Set(pack.fixtures.flatMap((item: any) => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'BR'); assert.equal(pack.synthetic, true); assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false); assert.equal(pack.fixture_policy.contains_upstream_rows, false); assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.postal_value, '99999-999'); assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.synthetic_value_not_checked_against_live_operator, true); assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.ok(pack.fixtures.every((item: any) => item.fixture_id.startsWith('br-syn-')));
  for (const claim of ['synthetic-code-is-current-correios-assignment', 'synthetic-polygon-is-official-correios-postal-geometry', 'typed-cep-object-is-automatically-a-polygon', 'cnefe-administrative-third-party-api-cache-or-model-object-is-correios-postal-geometry', 'postcode-cnefe-point-parcel-coordinate-containment-interpolation-or-proximity-is-exact-building-link', 'person-household-owner-occupant-organization-credential-query-log-or-fine-address-is-public-data', 'postal-source-coverage-extends-beyond-declared-br-scope', 'agid-cell-is-official-postal-geometry']) assert.ok(prohibited.has(claim), claim);
});

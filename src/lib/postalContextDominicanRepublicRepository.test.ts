import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/do/postal-context');
const readJson = (name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as any;

test('Dominican seed separates postal observations, area geometry, administration, buildings, cadastre, privacy, and AGID', () => {
  const value = readJson('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-do');
  assert.equal(value.repository.country_code, 'DO');
  assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, true);
  assert.equal(value.release_scope.contains_raw_source_data, false);
  assert.equal(value.release_scope.contains_real_addresses, false);
  assert.equal(value.release_scope.contains_personal_data, false);
  assert.equal(value.release_scope.contains_production_geometry, false);
  assert.equal(value.postal_system.code_format, 'NNNNN');
  assert.match(value.postal_system.assignment_rule, /INPOSDOM.*address.*sector.*five-digit.*UPU.*dated.*not proof/i);
  assert.match(value.postal_system.geometry_rule, /postal-area-first.*not automatically a polygon.*polygon\.php.*valid closed finite rings.*complete denominator.*official\/derived\/virtual.*cannot fill/i);
  assert.match(value.postal_system.address_format_rule, /house number.*building name.*sector or barrio.*P\.O\. box.*never production/i);
  assert.match(value.postal_system.postal_object_rule, /postal_area.*sector_or_barrio.*post_office.*must never be collapsed/i);
  assert.match(value.postal_system.building_rule, /stable civic-address.*explicit reviewed relation.*not an exact/i);
  assert.match(value.postal_system.administrative_rule, /ONE División Territorial.*IDE-RD.*IGN-JJHM.*distinct from INPOSDOM/i);
  assert.match(value.postal_system.cadastre_rule, /Registro Inmobiliario.*do not grant bulk.*cannot be inferred/i);
  assert.match(value.postal_system.derived_and_realtime_rule, /INPOSDOM observations.*review surfaces.*train or run review models.*never overwrites/i);
  assert.match(value.postal_system.agid_rule, /independent spatial index.*Versioned crosswalks.*official Dominican postal geometry/i);
  assert.match(value.postal_system.licence_rule, /INPOSDOM terms.*intellectual property.*bulk extraction.*UPU POST\*CODE.*contract.*non-disclosure.*Registro Inmobiliario.*ODbL/i);
  assert.match(value.postal_system.temporal_rule, /March 2005 UPU.*ONE territorial editions.*RI parcel states.*supersession/i);
  assert.match(value.postal_system.hugging_face_rule, /Dataset.*Parquet.*GeoParquet.*pin a Hub commit.*digests/i);
  for (const blocker of [
    'public-search-index-last-modified-2021-without-current-complete-release-version-validity-alias-correction-exception-or-object-class-denominator',
    'public-polygon-endpoint-without-complete-coverage-release-provenance-official-derived-virtual-class-crs-method-confidence-or-compatible-licence',
    'upu-2026-1-complete-database-requires-contract-nda-data-use-declaration-and-rates',
    'inposdom-terms-protect-content-without-bulk-processing-derivation-redistribution-or-public-serving-permission',
    'valid-five-digit-text-presented-as-current-inposdom-assignment',
    'postcode-sector-or-locality-presented-as-an-automatic-polygon',
    'interactive-search-response-republished-as-a-bulk-address-dataset',
    'postal-area-sector-locality-post-office-and-po-box-conflated',
    'one-iderd-ign-ri-community-api-cache-or-model-geometry-presented-as-inposdom-postal-geometry',
    'postcode-address-text-ri-parcel-coordinate-containment-or-proximity-presented-as-exact-building-relation',
    'owner-recipient-occupant-condominium-credential-or-query-data-published-without-authority',
    'derived-buffer-voronoi-interpolation-or-model-surface-presented-as-official-or-used-to-fill-unknown-coverage',
  ]) assert.ok(value.promotion.hard_blockers.includes(blocker), blocker);
  assert.equal(value.promotion.target_stage, 'M2_current_inposdom_assignment_and_postal_area_visualization');
  assert.equal(value.promotion.data_completion_verified, false);
  assert.match(value.promotion.stages.at(-1)?.definition ?? '', /1,403 rows.*528 unique.*Polygon.*10100.*2026\.1.*approved immutable artifact.*real DO API\/app/i);
});

test('Dominican source profile gates official observations and caps postal geometry at derived review', () => {
  const profile = readJson('source-profile.json');
  const sources = new Map<string, any>(profile.sources.map((source: any) => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every((source: any) => source.bundled_here === false));
  assert.match(sources.get('inposdom-postcode-search')?.assignment_authority ?? '', /official_postal_operator.*observation/i);
  assert.match(sources.get('inposdom-postcode-search')?.geometry_authority ?? '', /interactive_polygon_response.*official_derived_virtual_class_unpublished/i);
  assert.match(sources.get('inposdom-postcode-search')?.redistribution_class ?? '', /content_ip_protected.*no_bulk_derivation_redistribution_or_public_serving/i);
  assert.match(sources.get('one-dominican-territorial-division-2021')?.geometry_authority ?? '', /territorial.*not_postal/i);
  assert.match(sources.get('iderd-dominican-geoservices')?.geometry_authority ?? '', /source_specific.*item_review/i);
  assert.match(sources.get('registro-inmobiliario-dominican-cadastre')?.redistribution_class ?? '', /restrict.*commercial.*bulk/i);
  assert.match(sources.get('osm-dominican-republic')?.redistribution_class ?? '', /ODbL/i);
  assert.equal(profile.assignment_observation_gate.maximum_claim, 'official-observation');
  assert.equal(profile.geometry_promotion_gate.maximum_claim, 'derived-review');
  assert.match(profile.geometry_promotion_gate.failure_mode, /non-geometric.*failed gate/i);
  for (const check of [
    'authorized-address-sector-locality-or-code-query',
    'operator-response-and-service-version-pinned',
    'observed-at-and-response-digest-recorded',
    'addresses-credentials-and-query-logs-minimized-and-protected',
  ]) assert.ok(profile.assignment_observation_gate.required_checks.includes(check), check);
  for (const check of [
    'source-postal-area-evidence-rights-cleared',
    'sector-locality-and-postal-object-joins-reviewed',
    'post-office-po-box-and-organization-objects-excluded',
    'derived-status-never-upgraded-by-model-confidence',
  ]) assert.ok(profile.geometry_promotion_gate.required_checks.includes(check), check);
  assert.deepEqual(profile.hugging_face.preferred_formats, ['parquet', 'geoparquet']);
  assert.match(profile.hugging_face.production_read_rule, /pin-hub-commit.*digests/i);
  for (const id of [
    'official-postal-operator-observations', 'postal-area-objects',
    'sector-barrio-and-locality-context', 'post-office-and-po-box-objects',
    'administrative-identities-and-geometry', 'official-cartographic-context',
    'civic-address-context', 'explicit-civic-address-to-building-relation',
    'restricted-cadastral-and-property-context', 'derived-postal-area-review-geometry',
    'community-validation', 'agid-crosswalk', 'hugging-face-public-parquet',
    'hugging-face-gated-restricted-inputs',
  ]) assert.ok(profile.artifact_partitions.some((candidate: any) => candidate.id === id), id);
});

test('Dominican fixtures are synthetic and keep postal, cadastral, person, building, and AGID claims non-authoritative', () => {
  const pack = readJson('fixtures/dominican-republic-synthetic.json');
  const postcodes = pack.fixtures.map((item: any) => item.synthetic_address.postcode).filter(Boolean);
  const prohibited = new Set(pack.fixtures.flatMap((item: any) => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'DO');
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
  assert.ok(pack.fixtures.every((item: any) => item.fixture_id.startsWith('do-syn-')));
  for (const claim of [
    'synthetic-code-is-current-inposdom-assignment',
    'synthetic-polygon-is-official-inposdom-postal-geometry',
    'postcode-sector-or-locality-is-automatically-a-polygon',
    'postal-area-sector-locality-post-office-and-po-box-are-interchangeable',
    'one-iderd-ign-ri-community-api-cache-or-model-object-is-inposdom-postal-geometry',
    'postcode-address-text-ri-parcel-coordinate-containment-or-proximity-is-exact-building-link',
    'person-household-owner-occupant-condominium-organization-or-query-log-is-public-address-data',
    'postal-source-coverage-extends-beyond-declared-do-scope',
    'agid-cell-is-official-postal-geometry',
  ]) assert.ok(prohibited.has(claim), claim);
});

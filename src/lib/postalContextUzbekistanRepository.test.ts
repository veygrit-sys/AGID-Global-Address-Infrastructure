import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postal_value: string; coordinates_are_upstream_observations: boolean; postcodes_are_assignment_evidence: boolean; synthetic_value_not_checked_against_live_lookup: boolean; collision_requires_replacement_before_promotion: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string }; expected: { must_not_assert: string[] } }> };
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/uz/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Uzbekistan seed separates six-digit indices, offices, dated data, buildings, time, jurisdiction, rights, and privacy', () => {
  const value = readJson<Manifest>('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-uz');
  assert.equal(value.repository.country_code, 'UZ');
  assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, true);
  assert.equal(value.release_scope.contains_raw_source_data, false);
  assert.equal(value.release_scope.contains_real_addresses, false);
  assert.equal(value.release_scope.contains_personal_data, false);
  assert.equal(value.release_scope.contains_production_geometry, false);
  assert.equal(value.postal_system.current_code_format, 'NNNNNN');
  assert.equal(value.postal_system.current_code_default_geometry, 'delivery_network_or_post_office_no_polygon_presumption');
  assert.match(value.postal_system.assignment_rule, /UPU.*07\/2019.*six digits.*delivery post office.*Tashkent.*exact current UzPost.*does not create/i);
  assert.match(value.postal_system.geometry_rule, /not guaranteed.*Never generate.*office point.*official geometry.*derived surfaces/i);
  assert.match(value.postal_system.open_data_rule, /2019.*dated list.*not current.*not geometry.*reuse.*attribution.*2026.*discovery/i);
  assert.match(value.postal_system.operator_map_rule, /operational.*address and index search.*not permission.*harvest/i);
  assert.match(value.postal_system.building_rule, /explicit rights-cleared civic-address identifier.*stable reviewed relation.*permitted building.*not an automatic/i);
  assert.match(value.postal_system.agid_rule, /AGID.*independent spatial index.*versioned crosswalk.*without relabelling/i);
  assert.match(value.postal_system.licence_rule, /do not.*grant bulk.*open-data portal terms.*Cadastre.*ODbL/i);
  assert.match(value.postal_system.privacy_rule, /real-estate.*property or personal.*excluded/i);
  assert.match(value.postal_system.temporal_rule, /time-dependent.*valid_from.*supersession.*2019/i);
  assert.match(value.postal_system.territorial_rule, /not a sovereignty.*jurisdiction.*No postal/i);
  for (const blocker of ['six-digit-delivery-index-presented-as-guaranteed-polygon', 'dated-2019-open-data-row-presented-as-current-without-validation', 'uzpost-map-search-presented-as-open-bulk-address-or-geometry-data', 'postcode-office-coordinate-parcel-or-proximity-presented-as-exact-address-building-relation', 'one-source-presented-as-universal-jurisdiction-coverage-or-sovereignty-evidence']) assert.ok(value.promotion.hard_blockers.includes(blocker));
});

test('Uzbekistan source profile keeps operator, lookup, format, dated open data, rights, cadastre, property, and community evidence separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('pochta-uz')?.redistribution_class ?? '', /restricted_reference/i);
  assert.match(sources.get('uzpost-index-map')?.assignment_authority ?? '', /response_only/i);
  assert.equal(sources.get('upu-uzbekistan-addressing-2019')?.geometry_authority, 'none');
  assert.match(sources.get('uzbekistan-postal-index-open-data-2019')?.assignment_authority ?? '', /dated_requires_current_validation/i);
  assert.match(sources.get('uzbekistan-open-data-terms')?.redistribution_class ?? '', /legal_framework/i);
  assert.match(sources.get('uzbekistan-open-data-registry-2026')?.assignment_authority ?? '', /catalog_discovery/i);
  assert.match(sources.get('uzbekistan-cadastre-agency')?.geometry_authority ?? '', /spatial_candidate.*exact_terms/i);
  assert.match(sources.get('uzbekistan-state-real-estate-register')?.redistribution_class ?? '', /restricted_property/i);
  assert.match(sources.get('osm-uzbekistan')?.redistribution_class ?? '', /ODbL/i);
  for (const partition of ['official-six-digit-postal-indices', 'post-office-hub-and-delivery-network-objects', 'dated-2019-open-data-assignments', 'current-operator-query-private', 'government-administrative-cadastral-and-property-context', 'derived-postal-context-surface', 'civic-address-and-building', 'temporal-jurisdiction-language-and-territorial-scope', 'agid-crosswalk']) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('Uzbekistan fixtures are synthetic and keep office, dated data, building, privacy, and jurisdiction evidence non-authoritative', () => {
  const pack = readJson<Fixtures>('fixtures/uzbekistan-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'UZ');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_value, '999999');
  assert.equal(pack.fixture_policy.synthetic_value_not_checked_against_live_lookup, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.ok(postcodes.every(postcode => /^\d{6}$/.test(postcode)));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('uz-syn-')));
  for (const claim of ['synthetic-code-is-current-uzpost-assignment', 'six-digit-index-is-always-a-polygon', 'dated-2019-row-is-current-without-validation', 'uzpost-map-response-is-open-bulk-data', 'office-point-or-search-result-is-delivery-polygon', 'postcode-office-coordinate-parcel-or-proximity-is-exact-building-link', 'property-rights-or-residential-registration-data-is-public-address-data', 'single-source-is-universal-jurisdiction-boundary-or-sovereignty-evidence']) assert.ok(prohibited.has(claim));
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postal_value: string; coordinates_are_upstream_observations: boolean; postcodes_are_assignment_evidence: boolean; synthetic_value_not_checked_against_live_lookup: boolean; collision_requires_replacement_before_promotion: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string }; expected: { must_not_assert: string[] } }> };
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/ir/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Iran seed separates ten-digit IDs, prefixes, GNAF, P.O. exceptions, buildings, time, jurisdiction, rights, and privacy', () => {
  const value = readJson<Manifest>('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-ir');
  assert.equal(value.repository.country_code, 'IR');
  assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, true);
  assert.equal(value.release_scope.contains_raw_source_data, false);
  assert.equal(value.release_scope.contains_real_addresses, false);
  assert.equal(value.release_scope.contains_personal_data, false);
  assert.equal(value.release_scope.contains_production_geometry, false);
  assert.equal(value.postal_system.current_code_format, 'NNNNNNNNNN');
  assert.equal(value.postal_system.current_code_default_geometry, 'delivery_location_or_non_area_no_polygon_presumption');
  assert.match(value.postal_system.assignment_rule, /UPU.*10\/2023.*ten digits.*zone.*forwarding-code.*P\.O\. Box.*poste restante.*exact current Iran Post.*does not create/i);
  assert.match(value.postal_system.geometry_rule, /not a guaranteed area.*Never generate.*five-digit forwarding prefix.*official geometry.*derived surfaces/i);
  assert.match(value.postal_system.gnaf_rule, /operational Iran Post.*not.*open bulk.*service terms.*privacy.*written authority/i);
  assert.match(value.postal_system.building_rule, /explicit rights-cleared civic-address identifier.*stable reviewed relation.*permitted building.*not an automatic/i);
  assert.match(value.postal_system.agid_rule, /AGID.*independent spatial index.*versioned crosswalk.*without relabelling/i);
  assert.match(value.postal_system.licence_rule, /do not grant bulk.*NSDI.*independent reference.*ODbL/i);
  assert.match(value.postal_system.privacy_rule, /ten-digit place identifier.*household or personal.*excluded/i);
  assert.match(value.postal_system.temporal_rule, /time-dependent.*valid_from.*supersession/i);
  assert.match(value.postal_system.territorial_rule, /not a sovereignty.*jurisdiction.*No postal/i);
  for (const blocker of ['ten-digit-place-identifier-presented-as-guaranteed-polygon', 'po-box-or-poste-restante-forced-to-use-a-ten-digit-postcode', 'gnaf-query-certificate-address-or-coordinate-presented-as-open-bulk-data', 'one-source-presented-as-universal-jurisdiction-coverage-or-sovereignty-evidence']) assert.ok(value.promotion.hard_blockers.includes(blocker));
});

test('Iran source profile keeps operator, GNAF, certificate, format, government, independent, and community evidence separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('iran-post')?.redistribution_class ?? '', /restricted_reference/i);
  assert.match(sources.get('iran-post-gnaf')?.assignment_authority ?? '', /response_only/i);
  assert.match(sources.get('gavahi-post-ir')?.redistribution_class ?? '', /operational_restricted/i);
  assert.equal(sources.get('upu-iran-addressing-2023')?.geometry_authority, 'none');
  assert.match(sources.get('iran-nsdi')?.geometry_authority ?? '', /spatial_candidate.*exact_terms/i);
  assert.match(sources.get('iran-open-data')?.assignment_authority ?? '', /independent_reference/i);
  assert.match(sources.get('osm-iran')?.redistribution_class ?? '', /ODbL/i);
  for (const partition of ['official-ten-digit-place-identifiers', 'five-digit-forwarding-prefix-context', 'po-box-poste-restante-and-post-office-objects', 'operator-gnaf-query-and-certificate-private', 'government-administrative-and-spatial-context', 'derived-postal-context-surface', 'civic-address-and-building', 'temporal-jurisdiction-language-and-territorial-scope', 'agid-crosswalk']) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('Iran fixtures are synthetic and keep prefix, GNAF, building, privacy, and jurisdiction evidence non-authoritative', () => {
  const pack = readJson<Fixtures>('fixtures/iran-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'IR');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_value, '9999999999');
  assert.equal(pack.fixture_policy.synthetic_value_not_checked_against_live_lookup, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.ok(postcodes.every(postcode => /^\d{10}$/.test(postcode)));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('ir-syn-')));
  for (const claim of ['synthetic-code-is-current-iran-post-assignment', 'ten-digit-place-identifier-is-always-a-polygon', 'five-digit-prefix-is-exact-official-postal-area', 'po-box-or-poste-restante-requires-ten-digit-postcode', 'gnaf-query-certificate-address-or-coordinate-is-public-data', 'postcode-coordinate-parcel-or-proximity-is-exact-building-link', 'single-source-is-universal-jurisdiction-boundary-or-sovereignty-evidence']) assert.ok(prohibited.has(claim));
});

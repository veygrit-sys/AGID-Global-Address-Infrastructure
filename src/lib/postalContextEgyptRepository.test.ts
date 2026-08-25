import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean; prohibited_claims: string[] }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postal_prefix: string; coordinates_are_geographic: boolean; postcodes_are_assignment_evidence: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string }; evidence: Array<{ assignment_authority: string; geometry_authority: string }>; expected: { must_not_assert: string[] } }> };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/eg/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Egypt seed separates seven-digit assignment, migration, derived surfaces, buildings, licensing, and privacy', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-eg');
  assert.equal(manifest.repository.country_code, 'EG');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.full_code_format, 'NNNNNNN');
  assert.match(manifest.postal_system.assignment_rule, /July 2023.*seven digits.*province.*locality.*neighbourhood.*community.*GPS.*text.*does not prove/i);
  assert.match(manifest.postal_system.legacy_rule, /five- or six-digit.*crosswalk.*never padded.*truncated.*guessed/i);
  assert.match(manifest.postal_system.geometry_rule, /group of buildings.*official rights-cleared.*GPS.*CAPMAS.*Voronoi.*derived non-canonical/i);
  assert.match(manifest.postal_system.building_rule, /rights-cleared.*source-defined stable relation.*crosswalk.*candidates only/i);
  assert.match(manifest.postal_system.licence_rule, /app access.*government-hosted guide.*free viewing.*never.*redistribution/i);
  assert.match(manifest.postal_system.crs_rule, /source CRS.*Egypt 1907.*Belt.*never relabelled WGS84.*reviewed/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  for (const blocker of [
    'five-or-six-digit-legacy-code-silently-padded-truncated-or-treated-as-current-seven-digit-code',
    'seven-digit-code-gps-result-building-group-or-administrative-boundary-presented-as-official-postal-polygon',
    'app-guide-search-viewer-free-service-or-government-authorship-presented-as-redistribution-right',
    'recipient-contact-correspondence-saved-location-resident-occupant-owner-title-right-or-query-data-published',
  ]) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('Egypt source profile keeps postal, lookup, statistical, survey, and community evidence separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('upu-egypt-postal-addressing-2023')?.assignment_authority, 'official_postal_system_semantics_only');
  assert.equal(sources.get('upu-egypt-postal-addressing-2023')?.geometry_authority, 'none');
  assert.match(sources.get('egypt-post-new-postcode-guide')?.assignment_authority ?? '', /official_lookup_workflow/i);
  assert.equal(sources.get('egypt-post-new-postcode-guide')?.redistribution_class, 'R4_validation_only');
  assert.match(sources.get('capmas-egypt-gis')?.geometry_authority ?? '', /official_product_geometry_only/i);
  assert.equal(sources.get('esa-egypt-geoportal')?.redistribution_class, 'R4_validation_only');
  assert.equal(sources.get('egy-list')?.assignment_authority, 'community_candidate_only');
  for (const partition of ['seven-digit-postal-assignment', 'legacy-code-crosswalk', 'official-lookup-point', 'derived-building-group-surface', 'physical-address-and-building', 'administrative-and-survey-context', 'private-and-restricted']) {
    assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
  }
});

test('Egypt fixtures use synthetic seven-digit strings and no upstream rows', () => {
  const pack = readJson<Fixtures>('fixtures/egypt-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'EG');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '0000000');
  assert.ok(postcodes.every(code => code === '0000000'));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('eg-syn-')));
  for (const claim of ['seven-digit-code-is-official-polygon', 'legacy-code-is-current-code-with-padding', 'derived-surface-is-official-postal-polygon', 'building-group-code-identifies-exact-building', 'recipient-owner-title-or-query-data']) assert.ok(prohibited.has(claim));
});

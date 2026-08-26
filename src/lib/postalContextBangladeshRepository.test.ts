import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postal_prefix: string; coordinates_are_geographic: boolean; postcodes_are_assignment_evidence: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string; assignment_class?: string }; expected: { must_not_assert: string[] } }> };
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/bd/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Bangladesh seed separates typed offices, geometry, census, mapping, cadastre, buildings, and privacy', () => {
  const value = readJson<Manifest>('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-bd'); assert.equal(value.repository.country_code, 'BD'); assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, true); assert.equal(value.release_scope.contains_raw_source_data, false); assert.equal(value.release_scope.contains_real_addresses, false); assert.equal(value.release_scope.contains_personal_data, false); assert.equal(value.release_scope.contains_production_geometry, false);
  assert.equal(value.postal_system.current_code_format, 'NNNN (1000-9999)');
  assert.match(value.postal_system.legal_rule, /UPU.*four digits.*regional head office.*thana.*secondary post office.*Bangladesh Post.*not.*polygon/i);
  assert.match(value.postal_system.assignment_rule, /GPO.*HO.*TSO.*UPO.*SO.*EDSO.*EDBO.*text.*blank.*never inherits.*not create a postal area/i);
  assert.match(value.postal_system.geometry_rule, /No reviewed.*canonical national.*polygon/i);
  assert.match(value.postal_system.geometry_rule, /derived.*SoB.*BBS enumeration.*DLRS/i);
  assert.match(value.postal_system.geometry_rule, /never become official postcode polygons/i);
  assert.match(value.postal_system.building_rule, /civic-address.*building geometry.*stable relation.*topographic evidence.*candidates only/i);
  assert.match(value.postal_system.licence_rule, /NSDI FAQ.*provider-specific.*SoB.*DLRS.*not.*blanket.*redistribution/i);
  assert.match(value.postal_system.privacy_rule, /Recipients.*box holders.*tracking.*census microdata.*landholders.*owners.*excluded/i);
  assert.equal(value.promotion.current_stage, 'M1_metadata');
  for (const blocker of ['district-page-row-or-office-point-presented-as-official-postcode-polygon', 'blank-code-row-inherits-neighbor-postcode-without-explicit-source-relation', 'bbs-enumeration-area-or-administrative-boundary-presented-as-postal-area', 'sob-topographic-building-presented-as-exact-civic-address-link']) assert.ok(value.promotion.hard_blockers.includes(blocker));
});

test('Bangladesh source profile keeps postal, mapping, NSDI, census, and cadastral authorities separate', () => {
  const profile = readJson<Profile>('source-profile.json'); const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed'); assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('bangladesh-post-postcode-tables')?.assignment_authority ?? '', /official_postal_office_assignment/i); assert.equal(sources.get('bangladesh-post-postcode-tables')?.geometry_authority, 'none'); assert.equal(sources.get('upu-bangladesh-addressing')?.geometry_authority, 'none');
  assert.match(sources.get('survey-of-bangladesh-gis-services')?.geometry_authority ?? '', /official_topographic_geometry.*permitted_product/i); assert.equal(sources.get('survey-of-bangladesh-gis-services')?.redistribution_class, 'R3_controlled_approval_or_contract');
  assert.match(sources.get('bangladesh-nsdi-geoportal')?.geometry_authority ?? '', /portal_or_api.*exact_permitted_layer/i); assert.match(sources.get('bangladesh-nsdi-data-catalog')?.geometry_authority ?? '', /none.*exact_permitted_cataloged_artifact/i); assert.match(sources.get('bbs-bangladesh-census-2022')?.geometry_authority ?? '', /census_geometry.*not_postal_address_or_building/i); assert.match(sources.get('dlrs-bangladesh-map-portal')?.geometry_authority ?? '', /cadastral_or_mouza.*permitted_map/i);
  for (const partition of ['official-postcode-office-assignments', 'blank-code-and-subordinate-office-evidence', 'official-postal-surface', 'derived-delivery-surface', 'civic-address-and-building', 'administrative-census-and-land-context', 'territory-and-private-restricted']) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('Bangladesh fixtures keep synthetic four-digit codes and blank-code offices non-spatial', () => {
  const pack = readJson<Fixtures>('fixtures/bangladesh-synthetic.json'); const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value)); const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'BD'); assert.equal(pack.synthetic, true); assert.equal(pack.promotion_eligible, false); assert.equal(pack.fixture_policy.contains_real_addresses, false); assert.equal(pack.fixture_policy.contains_upstream_rows, false); assert.equal(pack.fixture_policy.contains_personal_data, false); assert.equal(pack.fixture_policy.coordinates_are_geographic, false); assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false); assert.equal(pack.fixture_policy.postal_prefix, '9999'); assert.ok(postcodes.every(postcode => /^[1-9]\d{3}$/.test(postcode))); assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('bd-syn-'))); assert.ok(pack.fixtures.some(item => item.synthetic_address.assignment_class === 'blank_code_subordinate_office'));
  for (const claim of ['district-page-row-is-official-postal-boundary', 'blank-code-inherits-neighbor-postcode', 'enumeration-area-is-postal-boundary', 'topographic-building-is-civic-address-link', 'containment-or-proximity-is-exact-building-link', 'portal-or-paid-map-is-automatic-redistribution-right']) assert.ok(prohibited.has(claim));
});

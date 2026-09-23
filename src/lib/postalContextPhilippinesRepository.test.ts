import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postal_prefix: string; coordinates_are_geographic: boolean; postcodes_are_assignment_evidence: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string; assignment_class?: string }; expected: { must_not_assert: string[] } }> };
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/ph/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Philippines seed separates routing, geometry, administration, mapping, statistics, land, buildings, and privacy', () => {
  const value = readJson<Manifest>('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-ph'); assert.equal(value.repository.country_code, 'PH'); assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, true); assert.equal(value.release_scope.contains_raw_source_data, false); assert.equal(value.release_scope.contains_real_addresses, false); assert.equal(value.release_scope.contains_personal_data, false); assert.equal(value.release_scope.contains_production_geometry, false);
  assert.equal(value.postal_system.current_code_format, 'NNNN');
  assert.match(value.postal_system.legal_rule, /UPU.*four digits.*locality.*province.*PHLPost.*Region.*City\/Municipality.*not.*polygon.*building/i);
  assert.match(value.postal_system.assignment_rule, /four-character text.*leading zeroes.*PHLPost.*retrieval time.*not create a postal area.*delivery/i);
  assert.match(value.postal_system.geometry_rule, /No reviewed.*canonical national.*polygon.*derived.*PSGC.*Geoportal.*NAMRIA.*PSA.*LRA.*never become official/i);
  assert.match(value.postal_system.building_rule, /civic-address.*building geometry.*stable relation.*NAMRIA.*PSA.*LRA.*candidates only/i);
  assert.match(value.postal_system.licence_rule, /PHLPost.*no reviewed bulk.*PSA.*CC BY 4.0.*Geoportal.*conditional.*privacy.*not blanket/i);
  assert.match(value.postal_system.privacy_rule, /Recipients.*tracking.*CBMS respondents.*building serial.*landowners.*title holders.*excluded/i);
  assert.equal(value.promotion.current_stage, 'M1_metadata');
  for (const blocker of ['phlpost-locator-row-or-city-label-presented-as-official-zip-polygon', 'psgc-barangay-city-municipality-province-or-region-presented-as-postal-area', 'psa-popcen-cbms-building-facility-project-or-respondent-data-published-as-address-or-building-register', 'namria-topographic-feature-presented-as-civic-address-link']) assert.ok(value.promotion.hard_blockers.includes(blocker));
});

test('Philippines source profile keeps postal, administrative, topographic, statistical, land, and rights authorities separate', () => {
  const profile = readJson<Profile>('source-profile.json'); const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed'); assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('phlpost-zip-code-locator')?.assignment_authority ?? '', /official_postal_routing_assignment/i); assert.equal(sources.get('phlpost-zip-code-locator')?.geometry_authority, 'none'); assert.equal(sources.get('upu-philippines-addressing')?.geometry_authority, 'none');
  assert.match(sources.get('psa-philippine-standard-geographic-code')?.assignment_authority ?? '', /administrative_classification_only/i); assert.equal(sources.get('psa-philippine-standard-geographic-code')?.redistribution_class, 'R2_source_specific_reuse');
  assert.match(sources.get('geoportal-philippines-data-inventory')?.geometry_authority ?? '', /none.*exact_permitted_provider_layer/i); assert.equal(sources.get('geoportal-philippines-download-policy')?.redistribution_class, 'R3_controlled_approval_or_contract'); assert.match(sources.get('namria-topographic-mapping')?.geometry_authority ?? '', /official_topographic_geometry.*permitted_product/i); assert.equal(sources.get('psa-popcen-cbms-geotagging')?.redistribution_class, 'R4_validation_only'); assert.equal(sources.get('philippines-lra-land-registration')?.redistribution_class, 'R4_validation_only');
  for (const partition of ['official-zip-routing-assignments', 'official-postal-surface', 'derived-delivery-surface', 'civic-address-and-building', 'administrative-and-topographic-context', 'statistical-land-and-private-restricted', 'territory-and-private-restricted']) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('Philippines fixtures keep synthetic ZIPs and non-postal evidence non-authoritative', () => {
  const pack = readJson<Fixtures>('fixtures/philippines-synthetic.json'); const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value)); const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'PH'); assert.equal(pack.synthetic, true); assert.equal(pack.promotion_eligible, false); assert.equal(pack.fixture_policy.contains_real_addresses, false); assert.equal(pack.fixture_policy.contains_upstream_rows, false); assert.equal(pack.fixture_policy.contains_personal_data, false); assert.equal(pack.fixture_policy.coordinates_are_geographic, false); assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false); assert.equal(pack.fixture_policy.postal_prefix, '9999'); assert.ok(postcodes.every(postcode => /^\d{4}$/.test(postcode))); assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('ph-syn-')));
  for (const claim of ['locator-row-is-official-postal-boundary', 'psgc-barangay-is-postal-boundary', 'census-or-cbms-feature-is-public-address', 'topographic-or-statistical-building-is-civic-address-link', 'containment-or-proximity-is-exact-building-link', 'portal-download-or-title-is-automatic-redistribution-right']) assert.ok(prohibited.has(claim));
});

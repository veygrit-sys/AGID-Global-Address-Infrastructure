import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postal_prefix: string; coordinates_are_geographic: boolean; postcodes_are_assignment_evidence: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string }; expected: { must_not_assert: string[] } }> };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/in/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('India seed separates PIN assignments, office network, boundaries, DIGIPIN, buildings, licensing, and privacy', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-in');
  assert.equal(manifest.repository.country_code, 'IN');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.full_code_format, 'NNNNNN');
  assert.match(manifest.postal_system.assignment_rule, /six-digit.*particular area.*post office.*first digit.*nine.*first two.*first three.*final three.*does not.*polygon/i);
  assert.match(manifest.postal_system.office_rule, /circle.*region.*division.*office type.*delivery.*multiple.*Delivery.*Non Delivery.*not interchangeable.*boundary/i);
  assert.match(manifest.postal_system.geometry_rule, /exact Department of Posts.*GeoJSON.*resource URL.*GODL.*CRS.*digest.*Catalog metadata.*not.*boundary file.*derived.*never.*official/i);
  assert.match(manifest.postal_system.digipin_rule, /ten-character.*approximately four-metre.*EPSG:4326.*epoch.*complements.*not.*PIN.*building.*person/i);
  assert.match(manifest.postal_system.building_rule, /rights-cleared.*stable relation.*crosswalk.*candidates only/i);
  assert.match(manifest.postal_system.administration_rule, /Local Government Directory.*Survey of India.*not PIN boundaries/i);
  assert.match(manifest.postal_system.licence_rule, /Government Open Data License.*exact dataset.*metadata declares.*never.*redistribution/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  for (const blocker of [
    'directory-row-or-office-point-presented-as-official-pin-polygon',
    'catalog-metadata-presented-as-the-official-pin-boundary-artifact',
    'lgd-or-survey-of-india-administrative-boundary-presented-as-pin-boundary',
    'digipin-presented-as-pin-address-building-person-or-booking-entitlement',
  ]) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('India source profile keeps postal regulation, directory, boundary catalog, GODL, DIGIPIN, admin, and third-party API separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('india-post-regulations-2024')?.assignment_authority, 'official_postal_system_semantics_only');
  assert.equal(sources.get('data-gov-in-pincode')?.geometry_authority, 'none');
  assert.match(sources.get('data-gov-in-pincode-boundary')?.geometry_authority ?? '', /official_postal_geometry_only/i);
  assert.equal(sources.get('data-gov-in-pincode-boundary')?.redistribution_class, 'R1_public_reference');
  assert.equal(sources.get('data-gov-in-godl')?.assignment_authority, 'none_legal_framework_only');
  assert.match(sources.get('india-digipin')?.geometry_authority ?? '', /official_grid_cell_only/i);
  assert.match(sources.get('survey-of-india-abdb')?.geometry_authority ?? '', /official_administrative_geometry_only/i);
  assert.equal(sources.get('postalpincode-in')?.redistribution_class, 'R4_validation_only');
  for (const partition of ['pin-code-and-office-assignments', 'official-pin-boundary', 'derived-pin-surface', 'delivery-and-nondelivery-offices', 'digipin-grid', 'lgd-and-administrative-context', 'civic-address-and-building', 'territory-and-private-restricted']) {
    assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
  }
});

test('India fixtures use synthetic six-digit PIN strings and no upstream rows', () => {
  const pack = readJson<Fixtures>('fixtures/india-synthetic.json');
  const pins = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'IN');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '100000');
  assert.ok(pins.every(pin => /^[1-9]\d{5}$/.test(pin)));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('in-syn-')));
  for (const claim of ['office-row-is-pin-polygon', 'derived-surface-is-official-pin-boundary', 'delivery-and-nondelivery-are-equivalent', 'digipin-is-pin-or-building', 'pin-or-digipin-identifies-exact-building', 'recipient-owner-or-query-data']) assert.ok(prohibited.has(claim));
});

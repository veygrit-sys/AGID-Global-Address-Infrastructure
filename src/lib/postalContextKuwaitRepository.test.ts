import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postal_prefix: string; coordinates_are_geographic: boolean; postcodes_are_assignment_evidence: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string; assignment_class?: string }; expected: { must_not_assert: string[] } }> };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/kw/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Kuwait seed separates block and P.O. box assignments, derived surfaces, PACI identifiers, buildings, licensing, and privacy', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-kw');
  assert.equal(manifest.repository.country_code, 'KW');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.current_code_format, 'NNNNN');
  assert.match(manifest.postal_system.legal_rule, /Ministry.*five-digit.*governorate.*area.*block.*P.O. box.*UPU.*not.*area.*polygon/i);
  assert.match(manifest.postal_system.assignment_rule, /block.*P.O. box.*distinct.*derived.*non-spatial.*never.*building/i);
  assert.match(manifest.postal_system.geometry_rule, /No reviewed.*canonical national.*polygon.*exact.*edition.*licence.*CRS.*digest.*derived.*never.*official/i);
  assert.match(manifest.postal_system.address_rule, /governorate.*area.*block.*street.*building.*PACI automated.*postcode.*P.O. box.*does not.*occupant.*footprint/i);
  assert.match(manifest.postal_system.building_rule, /rights-cleared.*stable relation.*PACI.*Municipality.*crosswalk.*candidates only/i);
  assert.match(manifest.postal_system.licence_rule, /artifact-specific.*webpage.*viewer.*service endpoint.*never.*redistribution/i);
  assert.match(manifest.postal_system.privacy_rule, /Civil IDs.*recipients.*tracking.*owners.*tenants.*residents.*excluded/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  for (const blocker of [
    'ministry-web-table-presented-as-bulk-redistributable-directory',
    'po-box-range-presented-as-polygon-catchment-or-building',
    'block-row-paci-boundary-parcel-or-census-block-presented-as-official-postal-polygon',
    'kuwait-finder-boundary-presented-as-legal-survey-or-canonical-postal-geometry',
  ]) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('Kuwait source profile keeps postal, PACI address, building, municipal, and statistical authorities separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('kuwait-post')?.assignment_authority ?? '', /official_government_postal_assignment/i);
  assert.equal(sources.get('kuwait-post')?.geometry_authority, 'none');
  assert.equal(sources.get('kuwait-post')?.redistribution_class, 'R4_validation_only');
  assert.equal(sources.get('upu-kuwait-addressing')?.geometry_authority, 'none');
  assert.match(sources.get('paci-kuwait-finder')?.geometry_authority ?? '', /informational_map.*disclaimer/i);
  assert.match(sources.get('paci-kuwait-address-services')?.assignment_authority ?? '', /civil_address_identifier/i);
  assert.match(sources.get('paci-kuwait-building-register')?.geometry_authority ?? '', /none.*permitted.*stable[_ ]relation/i);
  assert.match(sources.get('kuwait-municipality-parcels')?.geometry_authority ?? '', /municipal_parcel.*only/i);
  assert.match(sources.get('kuwait-csb-census-gis')?.assignment_authority ?? '', /historical_statistical_context/i);
  for (const partition of ['official-block-postcode-assignments', 'official-po-box-range-assignments', 'official-postal-surface', 'derived-block-postal-surface', 'paci-civic-address-and-automated-number', 'parcel-and-building-geometry', 'administrative-and-statistical-context', 'territory-and-private-restricted']) {
    assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
  }
});

test('Kuwait fixtures use synthetic five-digit strings and keep P.O. boxes non-spatial', () => {
  const pack = readJson<Fixtures>('fixtures/kuwait-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'KW');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '00000');
  assert.ok(postcodes.every(postcode => /^\d{5}$/.test(postcode)));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('kw-syn-')));
  assert.ok(pack.fixtures.some(item => item.synthetic_address.assignment_class === 'po_box_range'));
  for (const claim of ['block-row-is-official-postal-polygon', 'derived-surface-is-official-postal-boundary', 'po-box-range-is-polygon-catchment-or-building', 'paci-or-municipality-boundary-is-postal-boundary', 'automated-number-identifies-occupant-owner-or-tenant', 'containment-or-proximity-is-exact-building-link']) assert.ok(prohibited.has(claim));
});

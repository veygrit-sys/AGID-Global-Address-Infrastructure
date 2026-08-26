import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postal_prefix: string; coordinates_are_geographic: boolean; postcodes_are_assignment_evidence: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string; assignment_class?: string }; expected: { must_not_assert: string[] } }> };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/bh/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Bahrain seed separates postcode-block assignment, P.O. box delivery, geometry, iGA buildings, licensing, and privacy', () => {
  const value = readJson<Manifest>('repository-manifest.json');
  assert.equal(value.repository.name, 'agid-postal-bh');
  assert.equal(value.repository.country_code, 'BH');
  assert.equal(value.repository.maturity, 'M1_metadata');
  assert.equal(value.release_scope.metadata_only, true);
  assert.equal(value.release_scope.contains_raw_source_data, false);
  assert.equal(value.release_scope.contains_real_addresses, false);
  assert.equal(value.release_scope.contains_personal_data, false);
  assert.equal(value.release_scope.contains_production_geometry, false);
  assert.equal(value.postal_system.current_code_format, 'NNN or NNNN (1XX-12XX)');
  assert.match(value.postal_system.legal_rule, /UPU.*three or four.*1XX.*12XX.*Bahrain Post.*not.*complete.*polygon/i);
  assert.match(value.postal_system.assignment_rule, /postcode.*block.*same geographic routing namespace.*explicit.*P.O. box.*non-spatial.*does not.*building/i);
  assert.match(value.postal_system.geometry_rule, /No reviewed.*canonical national.*polygon.*rights-cleared block.*derived.*never.*official/i);
  assert.match(value.postal_system.address_rule, /Governorate.*locality.*block.*road.*building.*unit.*postcode.*P.O. box.*does not.*person.*footprint/i);
  assert.match(value.postal_system.building_rule, /iGA address certificate.*rights-cleared building geometry.*stable relation.*candidates only/i);
  assert.match(value.postal_system.licence_rule, /Open Data Portal.*royalty-free.*attribution.*transformation.*disclaimer.*sublicence.*removal.*do not cover/i);
  assert.match(value.postal_system.privacy_rule, /CPR.*recipients.*subscribers.*tracking.*owners.*occupants.*deeds.*excluded/i);
  assert.equal(value.promotion.current_stage, 'M1_metadata');
  for (const blocker of [
    'upu-or-service-directory-presented-as-complete-current-postcode-directory',
    'postcode-block-syntax-or-equal-digits-presented-as-canonical-polygon',
    'po-box-presented-as-home-subscriber-catchment-or-building',
    'portal-terms-applied-to-non-portal-artifact',
  ]) assert.ok(value.promotion.hard_blockers.includes(blocker));
});

test('Bahrain source profile keeps postal, iGA, open-data, municipal, and cadastral authorities separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.match(sources.get('bahrain-post-services-directory')?.assignment_authority ?? '', /official_postal_example/i);
  assert.equal(sources.get('bahrain-post-services-directory')?.geometry_authority, 'none');
  assert.equal(sources.get('upu-bahrain-addressing')?.geometry_authority, 'none');
  assert.match(sources.get('iga-bahrain-address-services')?.assignment_authority ?? '', /official_civic_address.*building_identifier/i);
  assert.match(sources.get('iga-bahrain-address-services')?.geometry_authority ?? '', /none.*permitted.*stable[_ ]relation/i);
  assert.equal(sources.get('bahrain-open-data-geographic-locations')?.redistribution_class, 'R2_source_specific_reuse');
  assert.match(sources.get('bahrain-open-data-geographic-locations')?.geometry_authority ?? '', /point_geometry.*not.*boundary.*footprint/i);
  assert.match(sources.get('bahrain-municipal-geographic-explorer')?.geometry_authority ?? '', /viewer_reference.*permitted_layer/i);
  assert.match(sources.get('slrb-bahrain-cadastre')?.geometry_authority ?? '', /official_cadastral_parcel.*permitted_product/i);
  for (const partition of ['official-postcode-block-assignments', 'po-box-delivery-evidence', 'official-postal-or-block-surface', 'derived-block-postal-surface', 'iga-civic-address-certificate', 'building-and-parcel-geometry', 'administrative-open-data-context', 'territory-and-private-restricted']) {
    assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
  }
});

test('Bahrain fixtures use synthetic in-range strings and keep P.O. boxes non-spatial', () => {
  const pack = readJson<Fixtures>('fixtures/bahrain-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'BH');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '100');
  assert.ok(postcodes.every(postcode => /^(?:[1-9]\d{2}|1[0-2]\d{2})$/.test(postcode)));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('bh-syn-')));
  assert.ok(pack.fixtures.some(item => item.synthetic_address.assignment_class === 'po_box_delivery'));
  for (const claim of ['syntax-or-equal-digits-prove-current-assignment', 'derived-surface-is-official-postal-boundary', 'po-box-is-home-subscriber-catchment-or-building', 'open-data-or-municipal-block-is-postal-boundary', 'address-certificate-identifies-owner-occupant-or-tenant', 'containment-or-proximity-is-exact-building-link']) assert.ok(prohibited.has(claim));
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postcode_value: string; po_box_value: string; virtual_address_value: string; nask_address_value: string; coordinates_are_upstream_observations: boolean; identifiers_are_assignment_evidence: boolean; synthetic_values_not_checked_against_live_operator: boolean; collision_requires_replacement_before_promotion: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string }; expected: { must_not_assert: string[] } }> };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/ke/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Kenya seed separates post-office code, P.O. Box, virtual address, NASK, surfaces, buildings and privacy', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-ke');
  assert.equal(manifest.repository.country_code, 'KE');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.canonical_postcode_format, 'NNNNN');
  assert.match(manifest.postal_system.postcode_rule, /Posta Kenya.*five-digit.*individual post office.*current assignment.*pinned/i);
  assert.match(manifest.postal_system.identifier_split_rule, /P\.O\. Box.*post-office code.*MPost.*NASK.*AGID.*separately.*34567-00100.*not.*postcode/i);
  assert.match(manifest.postal_system.geometry_rule, /No rights-cleared nationwide.*post-office.*count(?:y|ies).*NASK.*not official postcode polygons.*derived non-canonical/i);
  assert.match(manifest.postal_system.building_rule, /rights-cleared.*explicit NASK.*address-to-building.*cadastral.*candidates only/i);
  assert.match(manifest.postal_system.privacy_rule, /ODPC.*physical and postal address.*location.*personal data.*property.*sensitive/i);
  assert.match(manifest.postal_system.hosting_rule, /Cloudflare.*Hugging Face.*rights-cleared.*digests.*Customer.*gated/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  for (const blocker of ['po-box-mpost-enjiwa-telephone-nask-property-or-agid-conflated-with-postcode', 'post-office-property-point-region-prefix-county-ward-locality-cadastre-or-nask-proposal-presented-as-official-postcode-polygon', 'postcode-box-virtual-address-address-text-coordinate-containment-overlap-proximity-or-model-presented-as-exact-building-link']) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('Kenya source profile keeps postal, NASK, mapping, land, privacy and community evidence separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('posta-kenya')?.assignment_authority, 'official_postal_operator_observation');
  assert.equal(sources.get('posta-kenya-properties-2026')?.assignment_authority, 'official_operator_property_observation');
  assert.equal(sources.get('upu-kenya-addressing-2004')?.assignment_authority, 'dated_postal_system_semantics_only');
  assert.equal(sources.get('ca-kenya-national-addressing-system')?.assignment_authority, 'planned_nask_context_only');
  assert.match(sources.get('survey-of-kenya-mapping-policy-2021')?.geometry_authority ?? '', /dataset_specific/i);
  assert.equal(sources.get('ardhisasa-kenya')?.redistribution_class, 'R5_private_restricted');
  assert.equal(sources.get('osm-kenya')?.redistribution_class, 'R2_odbl_separate_partition');
  for (const partition of ['typed-delivery-post-office-code', 'po-box-and-virtual-address', 'official-postal-surface', 'derived-postal-review-surface', 'administrative-and-toponymic-context', 'nask-and-civic-address', 'cadastre-and-building', 'community-odbl', 'private-and-restricted']) assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
});

test('Kenya fixtures use synthetic postcode, box, virtual and NASK values with no upstream rows', () => {
  const pack = readJson<Fixtures>('fixtures/kenya-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'KE');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_upstream_observations, false);
  assert.equal(pack.fixture_policy.identifiers_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.synthetic_values_not_checked_against_live_operator, true);
  assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true);
  assert.equal(pack.fixture_policy.postcode_value, '09999');
  assert.match(pack.fixture_policy.po_box_value, /^KE-SYN-/);
  assert.match(pack.fixture_policy.virtual_address_value, /^KE-MPOST-SYN-/);
  assert.match(pack.fixture_policy.nask_address_value, /^KE-NASK-SYN-/);
  assert.ok(postcodes.every(code => /^\d{5}$/.test(code)));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('ke-syn-')));
  for (const claim of ['five-digit-postcode-is-official-polygon', 'box-or-virtual-address-is-postcode', 'derived-surface-is-official-kenya-postcode-polygon', 'postcode-box-virtual-or-nask-syntax-identifies-exact-building']) assert.ok(prohibited.has(claim));
});
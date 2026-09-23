import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type Profile = { artifact_scope: string; sources: Array<{ source_id: string; assignment_authority: string; geometry_authority: string; redistribution_class: string; bundled_here: boolean }>; artifact_partitions: Array<{ id: string }> };
type Manifest = { repository: { name: string; country_code: string; maturity: string }; release_scope: Record<string, boolean | string>; postal_system: Record<string, string>; promotion: { current_stage: string; hard_blockers: string[] } };
type Fixtures = { country_code: string; synthetic: boolean; promotion_eligible: boolean; fixture_policy: { contains_real_addresses: boolean; contains_upstream_rows: boolean; contains_personal_data: boolean; postal_prefix: string; coordinates_are_geographic: boolean; postcodes_are_assignment_evidence: boolean }; fixtures: Array<{ fixture_id: string; synthetic_address: { postcode?: string }; expected: { must_not_assert: string[] } }> };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const seedRoot = resolve(root, 'data/postal_country_packs/id/postal-context');
const readJson = <T>(name: string) => JSON.parse(readFileSync(resolve(seedRoot, name), 'utf8')) as T;

test('Indonesia seed separates current codes, legal future formats, locality surfaces, RT/RW, buildings, licensing, and privacy', () => {
  const manifest = readJson<Manifest>('repository-manifest.json');
  assert.equal(manifest.repository.name, 'agid-postal-id');
  assert.equal(manifest.repository.country_code, 'ID');
  assert.equal(manifest.repository.maturity, 'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only, true);
  assert.equal(manifest.release_scope.contains_raw_source_data, false);
  assert.equal(manifest.release_scope.contains_real_addresses, false);
  assert.equal(manifest.release_scope.contains_personal_data, false);
  assert.equal(manifest.release_scope.contains_production_geometry, false);
  assert.equal(manifest.postal_system.current_code_format, 'NNNNN');
  assert.match(manifest.postal_system.legal_rule, /Law 38\/2009.*numbers.*letters.*combination.*address or area.*Regulation 15\/2013.*administrative-area.*Regulation 8\/2025.*numeric.*alphabetic.*combined.*future.*five/i);
  assert.match(manifest.postal_system.assignment_rule, /five-digit.*province.*city or regency.*district.*village.*lookup.*does not.*polygon/i);
  assert.match(manifest.postal_system.geometry_rule, /No reviewed national.*boundary.*Canonical.*exact.*edition.*licence.*CRS.*digest.*derived.*Thiessen.*never.*official/i);
  assert.match(manifest.postal_system.address_rule, /RT\/RW.*no administrative power.*(?:does not|none .* identifies).*occupant.*building/i);
  assert.match(manifest.postal_system.building_rule, /rights-cleared.*stable relation.*crosswalk.*candidates only/i);
  assert.match(manifest.postal_system.administration_rule, /Kemendagri.*BPS.*BIG.*explicit editioned crosswalks.*non-definitive.*equal-distance/i);
  assert.match(manifest.postal_system.licence_rule, /artifact-specific.*public lookup.*WMS.*WFS.*never.*redistribution/i);
  assert.equal(manifest.promotion.current_stage, 'M1_metadata');
  for (const blocker of [
    'pos-indonesia-search-result-presented-as-bulk-redistributable-directory',
    'locality-row-or-administrative-boundary-presented-as-official-postal-polygon',
    'big-nondefinitive-or-thiessen-filled-boundary-presented-as-official-postal-geometry',
    'current-five-digit-runtime-presented-as-the-only-future-legal-code-format',
  ]) assert.ok(manifest.promotion.hard_blockers.includes(blocker));
});

test('Indonesia source profile keeps law, regulation, operator lookup, UPU, crosswalks, boundaries, and buildings separate', () => {
  const profile = readJson<Profile>('source-profile.json');
  const sources = new Map(profile.sources.map(source => [source.source_id, source]));
  assert.equal(profile.artifact_scope, 'metadata-only-contract-seed');
  assert.ok(profile.sources.every(source => source.bundled_here === false));
  assert.equal(sources.get('indonesia-post-law-2009')?.geometry_authority, 'none');
  assert.match(sources.get('indonesia-post-regulation-2025')?.assignment_authority ?? '', /scheme_governance/i);
  assert.match(sources.get('pos-indonesia')?.assignment_authority ?? '', /official_operator_record/i);
  assert.equal(sources.get('pos-indonesia')?.redistribution_class, 'R4_validation_only');
  assert.equal(sources.get('upu-indonesia-addressing')?.geometry_authority, 'none');
  assert.equal(sources.get('sdi-indonesia-village-postcode')?.redistribution_class, 'R4_validation_only');
  assert.match(sources.get('big-indonesia-village-boundaries')?.geometry_authority ?? '', /administrative_geometry.*disclaimer/i);
  assert.match(sources.get('big-indonesia-rbi-buildings')?.geometry_authority ?? '', /topographic_feature_only/i);
  for (const partition of ['current-postcode-and-locality-assignments', 'future-ministerial-code-schemes', 'official-postal-surface', 'derived-locality-postal-surface', 'administrative-and-statistical-crosswalks', 'rt-rw-and-civic-address', 'building-and-facility-geometry', 'territory-and-private-restricted']) {
    assert.ok(profile.artifact_partitions.some(candidate => candidate.id === partition));
  }
});

test('Indonesia fixtures use synthetic five-digit strings and no upstream rows', () => {
  const pack = readJson<Fixtures>('fixtures/indonesia-synthetic.json');
  const postcodes = pack.fixtures.map(item => item.synthetic_address.postcode).filter((value): value is string => Boolean(value));
  const prohibited = new Set(pack.fixtures.flatMap(item => item.expected.must_not_assert));
  assert.equal(pack.country_code, 'ID');
  assert.equal(pack.synthetic, true);
  assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false);
  assert.equal(pack.fixture_policy.contains_upstream_rows, false);
  assert.equal(pack.fixture_policy.contains_personal_data, false);
  assert.equal(pack.fixture_policy.coordinates_are_geographic, false);
  assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false);
  assert.equal(pack.fixture_policy.postal_prefix, '10000');
  assert.ok(postcodes.every(postcode => /^[1-9]\d{4}$/.test(postcode)));
  assert.ok(pack.fixtures.every(item => item.fixture_id.startsWith('id-syn-')));
  for (const claim of ['locality-row-is-official-postal-polygon', 'derived-surface-is-official-postal-boundary', 'thiessen-filled-gap-is-official', 'rt-rw-is-administrative-or-postal-polygon', 'postcode-or-locality-identifies-exact-building', 'recipient-household-owner-or-query-data']) assert.ok(prohibited.has(claim));
});

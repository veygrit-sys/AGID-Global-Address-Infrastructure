import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../data/postal_country_packs/mx/postal-context');
const readJson = (name: string) => JSON.parse(readFileSync(resolve(root, name), 'utf8'));

test('Mexican seed separates official postal geometry, administration, addresses, establishments, privacy, time, and AGID', () => {
  const value = readJson('repository-manifest.json'); assert.equal(value.repository.country_code, 'MX'); assert.equal(value.repository.maturity, 'M1_metadata'); assert.equal(value.release_scope.contains_raw_source_data, false); assert.equal(value.release_scope.contains_real_addresses, false); assert.equal(value.release_scope.contains_production_geometry, false);
  assert.match(value.postal_system.assignment_rule, /SEPOMEX.*five-digit.*UPU.*not proof/i);
  assert.match(value.postal_system.geometry_rule, /2025.*32 state SHP.*Creative Commons Attribution 4.0/i);
  assert.match(value.postal_system.geometry_rule, /official-source postal Polygon or MultiPolygon/i);
  assert.match(value.postal_system.geometry_rule, /Repairs.*generalisation.*derived-review/i);
  assert.match(value.postal_system.address_format_rule, /exterior.*interior.*building.*settlement.*postcode/i);
  assert.match(value.postal_system.building_rule, /stable civic-address identifier.*explicit reviewed relation.*not an exact residential/i);
  assert.match(value.postal_system.administrative_rule, /INEGI.*municipalities.*AGEBs.*distinct from SEPOMEX/i);
  assert.match(value.postal_system.establishment_rule, /DENUE.*businesses.*rural positions.*not postcode geometry/i);
  assert.match(value.postal_system.derived_and_realtime_rule, /machine-learning.*preserves.*never fills unknown coverage/i);
  assert.match(value.postal_system.agid_rule, /AGID remains an independent.*without relabelling/i);
  assert.match(value.postal_system.licence_rule, /Creative Commons Attribution 4.0.*32 resource/i);
  assert.match(value.postal_system.privacy_rule, /addresses.*queries.*purpose limitation/i);
  assert.match(value.postal_system.temporal_rule, /2025.*2017.*2024.*valid_from.*supersession/i);
  assert.equal(value.promotion.current_stage, 'M1_metadata'); assert.ok(value.promotion.hard_blockers.length >= 10);
});

test('Mexican source profile gates official source geometry and keeps modified geometry derived', () => {
  const profile = readJson('source-profile.json'); assert.equal(profile.country_code, 'MX'); assert.equal(profile.sources.length, 9);
  assert.equal(profile.sources.some((item: any) => item.source_id === 'sepomex-postal-polygons-2025' && /CC_BY_4_0/.test(item.redistribution_class)), true);
  assert.equal(profile.sources.some((item: any) => item.source_id === 'inegi-mexico-denue-2025' && item.geometry_authority.includes('not_postal')), true);
  assert.equal(profile.assignment_observation_gate.maximum_claim, 'official-release'); assert.equal(profile.geometry_promotion_gate.maximum_claim, 'official-source-geometry');
  assert.match(profile.geometry_promotion_gate.failure_mode, /without geometry.*derived-review.*failed gate/i);
  assert.equal(profile.hugging_face.production_read_rule, 'pin-hub-commit-and-verify-shard-digests');
});

test('Mexican fixtures are synthetic and keep postal, person, territorial, building, establishment, and AGID claims non-authoritative', () => {
  const pack = readJson('fixtures/mexico-synthetic.json'); const prohibited = new Set(pack.fixtures.flatMap((item: any) => item.expected.must_not_assert)); assert.equal(pack.country_code, 'MX'); assert.equal(pack.synthetic, true); assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false); assert.equal(pack.fixture_policy.contains_upstream_rows, false); assert.equal(pack.fixture_policy.contains_personal_data, false); assert.equal(pack.fixture_policy.postal_value, '99999'); assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false); assert.equal(pack.fixture_policy.synthetic_value_not_checked_against_live_operator, true); assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true); assert.ok(pack.fixtures.every((item: any) => item.fixture_id.startsWith('mx-syn-')));
  for (const claim of ['synthetic-code-is-current-sepomex-assignment', 'synthetic-polygon-is-official-sepomex-postal-geometry', 'catalog-row-settlement-locality-municipality-or-state-is-automatically-a-polygon', 'inegi-denue-cadastral-community-or-model-object-is-sepomex-postal-geometry', 'derived-repaired-generalized-or-compressed-surface-is-unmodified-official-source-geometry', 'territorial-representation-resolves-a-boundary-or-sovereignty', 'postcode-settlement-block-establishment-point-parcel-coordinate-or-proximity-is-exact-building-link', 'person-household-owner-occupant-organization-credential-query-log-or-private-address-is-public-data', 'denue-establishment-point-is-an-exact-residential-building-footprint', 'postal-source-coverage-extends-beyond-declared-mx-scope', 'agid-cell-is-official-postal-geometry']) assert.ok(prohibited.has(claim), claim);
});

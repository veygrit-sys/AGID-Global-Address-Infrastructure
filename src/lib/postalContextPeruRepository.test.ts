import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../data/postal_country_packs/pe/postal-context');
const readJson = (name: string) => JSON.parse(readFileSync(resolve(root, name), 'utf8'));
test('Peruvian seed separates routing, geometry, administration, buildings, cadastre, privacy, time, and AGID', () => {
  const value = readJson('repository-manifest.json'); assert.equal(value.repository.country_code, 'PE'); assert.equal(value.repository.maturity, 'M1_metadata'); assert.equal(value.release_scope.contains_raw_source_data, false); assert.equal(value.release_scope.contains_real_addresses, false); assert.equal(value.release_scope.contains_production_geometry, false);
  assert.match(value.postal_system.assignment_rule, /MTC.*five digits.*one and two.*digit three.*four and five.*not proof/i);
  const geometryRule = value.postal_system.geometry_rule;
  assert.match(geometryRule, /boundaries as referential/i);
  assert.match(geometryRule, /2018.*not a polygon release/i);
  assert.match(geometryRule, /No reusable current nationwide/i);
  assert.match(geometryRule, /non-geometric routing\/locality object/i);
  assert.match(value.postal_system.address_format_rule, /block.*lot.*building.*district.*province.*postcode/i);
  assert.match(value.postal_system.building_rule, /stable civic-address identifier.*explicit reviewed relation.*not an exact/i);
  assert.match(value.postal_system.administrative_rule, /INEI.*Ubigeo.*IGN.*distinct from MTC/i);
  assert.match(value.postal_system.cadastre_and_building_rule, /GeoVivienda.*COFOPRI.*not establish.*postal assignment/i);
  assert.match(value.postal_system.derived_and_realtime_rule, /machine-learning.*preserves.*never fills unknown coverage/i);
  assert.match(value.postal_system.agid_rule, /AGID remains an independent.*without relabelling/i);
  assert.match(value.postal_system.licence_rule, /Open Data Commons Attribution.*pin.*Current lookup automation/i);
  assert.match(value.postal_system.privacy_rule, /addresses.*lookup queries.*purpose limitation/i);
  assert.match(value.postal_system.temporal_rule, /2018.*2011.*2017.*valid_from.*supersession/i);
  assert.equal(value.promotion.current_stage, 'M1_metadata'); assert.ok(value.promotion.hard_blockers.length >= 10);
});
test('Peruvian source profile gates current observations, dated release rows, and derived geometry', () => {
  const profile = readJson('source-profile.json'); assert.equal(profile.country_code, 'PE'); assert.equal(profile.sources.length, 10);
  assert.equal(profile.sources.some((item: any) => item.source_id === 'mtc-peru-postcode-open-data-2018' && /ODC_BY/.test(item.redistribution_class)), true);
  assert.equal(profile.sources.some((item: any) => item.source_id === 'cofopri-peru-geo-llaqta' && item.geometry_authority.includes('not_postal')), true);
  assert.equal(profile.assignment_observation_gate.maximum_claim, 'official-release-or-observation'); assert.equal(profile.geometry_promotion_gate.maximum_claim, 'derived-review');
  assert.match(profile.geometry_promotion_gate.failure_mode, /non-geometric routing or locality object.*failed gate/i);
  assert.equal(profile.hugging_face.production_read_rule, 'pin-hub-commit-and-verify-shard-digests');
});
test('Peruvian fixtures are synthetic and keep postal, person, territorial, building, and AGID claims non-authoritative', () => {
  const pack = readJson('fixtures/peru-synthetic.json'); const prohibited = new Set(pack.fixtures.flatMap((item: any) => item.expected.must_not_assert)); assert.equal(pack.country_code, 'PE'); assert.equal(pack.synthetic, true); assert.equal(pack.promotion_eligible, false);
  assert.equal(pack.fixture_policy.contains_real_addresses, false); assert.equal(pack.fixture_policy.contains_upstream_rows, false); assert.equal(pack.fixture_policy.contains_personal_data, false); assert.equal(pack.fixture_policy.postal_value, '99999'); assert.equal(pack.fixture_policy.postcodes_are_assignment_evidence, false); assert.equal(pack.fixture_policy.synthetic_value_not_checked_against_live_operator, true); assert.equal(pack.fixture_policy.collision_requires_replacement_before_promotion, true); assert.ok(pack.fixtures.every((item: any) => item.fixture_id.startsWith('pe-syn-')));
  for (const claim of ['synthetic-code-is-current-mtc-assignment', 'synthetic-polygon-is-official-mtc-postal-geometry', 'routing-zone-district-locality-populated-centre-or-urban-concentration-is-automatically-a-polygon', 'mtc-viewer-inei-ign-geovivienda-cofopri-cadastral-community-or-model-object-is-official-postal-geometry', 'territorial-representation-resolves-a-boundary-or-sovereignty', 'postcode-reference-point-of-interest-parcel-coordinate-containment-interpolation-or-proximity-is-exact-building-link', 'person-household-owner-occupant-organization-credential-query-log-or-fine-address-is-public-data', 'postal-source-coverage-extends-beyond-declared-pe-scope', 'agid-cell-is-official-postal-geometry']) assert.ok(prohibited.has(claim), claim);
});

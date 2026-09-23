import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESSQL_DB_GIS_LOGISTICS_VERSION,
  ADDRESSQL_OPTIMIZER_RULES,
  ADDRESSQL_SYNTHESIS_CAPABILITIES,
  ADDRESSQL_SYNTHESIS_PILLARS,
  buildAddressQlSynthesisCoverage,
  validateAddressQlDbGisLogisticsSynthesis,
} from './addressQlDbGisLogistics';

test('AddressQL DB/GIS/logistics synthesis validates three research pillars', () => {
  assert.equal(ADDRESSQL_DB_GIS_LOGISTICS_VERSION, 'addressql-db-gis-logistics-v0.1');
  assert.deepEqual(validateAddressQlDbGisLogisticsSynthesis(), []);

  const pillarIds = new Set(ADDRESSQL_SYNTHESIS_PILLARS.map(pillar => pillar.id));
  assert.ok(pillarIds.has('database_research'));
  assert.ok(pillarIds.has('gis_research'));
  assert.ok(pillarIds.has('logistics_research'));

  const coverage = buildAddressQlSynthesisCoverage();
  assert.equal(coverage.length, 3);
  assert.ok(coverage.every(row => row.capabilityCount >= 3));
  assert.ok(coverage.every(row => row.functionCount >= 8));
  assert.ok(coverage.every(row => row.artifactCount >= 9));
});

test('AddressQL synthesis capabilities include spatial, logistics, and privacy kernels', () => {
  const capabilityIds = new Set(ADDRESSQL_SYNTHESIS_CAPABILITIES.map(capability => capability.id));

  assert.ok(capabilityIds.has('spatial_predicate_kernel'));
  assert.ok(capabilityIds.has('multi_resolution_spatial_index'));
  assert.ok(capabilityIds.has('network_reachability_and_map_matching'));
  assert.ok(capabilityIds.has('congestion_mobility_kernel'));
  assert.ok(capabilityIds.has('delivery_service_area_model'));
  assert.ok(capabilityIds.has('last_mile_constraint_optimizer'));
  assert.ok(capabilityIds.has('handoff_and_acknowledgement_protocol'));
  assert.ok(capabilityIds.has('privacy_preserving_query_boundary'));

  const integrated = ADDRESSQL_SYNTHESIS_CAPABILITIES.find(capability => capability.id === 'last_mile_constraint_optimizer');
  assert.deepEqual(integrated?.pillars, ['database_research', 'gis_research', 'logistics_research']);
  assert.ok(integrated?.addressQlOperators.includes('DELIVERY_AVAILABLE'));
  assert.ok(integrated?.addressQlOperators.includes('ADDRESS_TRAVEL_TIME'));
  assert.ok(integrated?.addressQlOperators.includes('ADDRESS_POLICY_CHECK'));
});

test('AddressQL optimizer rules separate stable and volatile address decisions', () => {
  assert.equal(ADDRESSQL_OPTIMIZER_RULES.length, 6);

  const postal = ADDRESSQL_OPTIMIZER_RULES.find(rule => rule.id === 'postal_before_fuzzy_match');
  const estimate = ADDRESSQL_OPTIMIZER_RULES.find(rule => rule.id === 'separate_delivery_estimate_from_deliverability');
  const delay = ADDRESSQL_OPTIMIZER_RULES.find(rule => rule.id === 'prefer_delay_metric_over_geometric_distance_for_delivery');
  const proof = ADDRESSQL_OPTIMIZER_RULES.find(rule => rule.id === 'proof_after_policy_check');

  assert.match(postal?.after ?? '', /POSTAL_LOOKUP/);
  assert.match(estimate?.after ?? '', /DELIVERY_AVAILABLE/);
  assert.match(estimate?.after ?? '', /DELIVERY_ESTIMATE/);
  assert.match(delay?.after ?? '', /ADDRESS_TRAVEL_TIME/);
  assert.match(delay?.after ?? '', /ADDRESS_DELIVERY_DIFFICULTY/);
  assert.match(proof?.after ?? '', /ADDRESS_POLICY_CHECK/);
  assert.ok(ADDRESSQL_OPTIMIZER_RULES.every(rule => rule.safeOnlyWhen.length > 0));
  assert.ok(ADDRESSQL_OPTIMIZER_RULES.every(rule => rule.blockedWhen.length > 0));
});

test('AddressQL synthesis doc exposes database, GIS, and logistics implementation wisdom', () => {
  const readme = readFileSync('docs/addressql/README.md', 'utf8');
  const spec = readFileSync('docs/addressql/specification-v0.1.md', 'utf8');
  const synthesis = readFileSync('docs/addressql/database-gis-logistics-synthesis.md', 'utf8');

  assert.match(readme, /database-gis-logistics-synthesis\.md/);
  assert.match(spec, /Database\/GIS\/Logistics Synthesis/);
  assert.match(synthesis, /cost-based query optimization/);
  assert.match(synthesis, /spatial predicates/);
  assert.match(synthesis, /vehicle routing/);
  assert.match(synthesis, /congestion/i);
  assert.match(synthesis, /ADDRESS_ACK/);
  assert.match(synthesis, /PostgreSQL/);
  assert.match(synthesis, /SQLite/);
});

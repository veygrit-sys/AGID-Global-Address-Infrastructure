import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { ADDRESSQL_FUNCTION_SPECS } from './addressQlResearch';
import {
  ADDRESSQL_CONGESTION_CONCEPTS,
  ADDRESSQL_CONGESTION_REQUIRED_FUNCTIONS,
  ADDRESSQL_CONGESTION_VERSION,
  ADDRESSQL_CONGESTION_WORKFLOWS,
  buildAddressQlCongestionCoverage,
  validateAddressQlCongestionModel,
} from './addressQlCongestion';

test('AddressQL congestion model validates traffic-theory concepts and functions', () => {
  assert.equal(ADDRESSQL_CONGESTION_VERSION, 'addressql-congestion-v0.1');
  assert.deepEqual(validateAddressQlCongestionModel(), []);

  assert.equal(ADDRESSQL_CONGESTION_CONCEPTS.length, 7);
  assert.equal(ADDRESSQL_CONGESTION_WORKFLOWS.length, 5);

  const functionNames = new Set(ADDRESSQL_FUNCTION_SPECS.map(spec => spec.name));
  for (const functionName of ADDRESSQL_CONGESTION_REQUIRED_FUNCTIONS) {
    assert.ok(functionNames.has(functionName), `${functionName} missing from AddressQL registry`);
  }
});

test('AddressQL congestion coverage ties each concept to executable artifacts', () => {
  const coverage = buildAddressQlCongestionCoverage();

  assert.equal(coverage.length, 7);
  assert.ok(coverage.every(row => row.functionCount >= 3));
  assert.ok(coverage.every(row => row.artifactCount >= 3));
  assert.ok(coverage.every(row => row.nonClaimCount >= 1));

  const bottleneck = ADDRESSQL_CONGESTION_CONCEPTS.find(concept => concept.id === 'bottleneck');
  const network = ADDRESSQL_CONGESTION_CONCEPTS.find(concept => concept.id === 'network_theory');

  assert.ok(bottleneck?.functions.includes('ADDRESS_BOTTLENECKS'));
  assert.ok(network?.functions.includes('ADDRESS_REACHABLE_WITHIN'));
  assert.ok(network?.requiredArtifacts.some(artifact => /ferry|entrance|road graph/i.test(artifact)));
});

test('AddressQL congestion functions remain volatile except source-versioned bottlenecks', () => {
  const travelTime = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'ADDRESS_TRAVEL_TIME');
  const congestionScore = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'ADDRESS_CONGESTION_SCORE');
  const deliveryDifficulty = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'ADDRESS_DELIVERY_DIFFICULTY');
  const reachable = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'ADDRESS_REACHABLE_WITHIN');
  const bottlenecks = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'ADDRESS_BOTTLENECKS');

  assert.equal(travelTime?.determinism, 'volatile');
  assert.equal(congestionScore?.determinism, 'volatile');
  assert.equal(deliveryDifficulty?.determinism, 'volatile');
  assert.equal(reachable?.determinism, 'volatile');
  assert.equal(bottlenecks?.determinism, 'stable_by_source_version');
  assert.match(deliveryDifficulty?.nonClaims.join(' ') ?? '', /not a blacklist/);
});

test('AddressQL congestion documentation is linked and registry-backed', () => {
  const readme = readFileSync('docs/addressql/README.md', 'utf8');
  const registry = readFileSync('docs/addressql/function-registry-v0.1.md', 'utf8');
  const congestion = readFileSync('docs/addressql/congestion-mobility-functions.md', 'utf8');

  assert.match(readme, /congestion-mobility-functions\.md/);
  assert.match(congestion, /traffic congestion theory/i);
  assert.match(congestion, /ADDRESS_TRAVEL_TIME/);
  assert.match(congestion, /ADDRESS_BOTTLENECKS/);
  assert.match(congestion, /not a route, SLA, or delivery guarantee/i);

  for (const functionName of ADDRESSQL_CONGESTION_REQUIRED_FUNCTIONS) {
    assert.ok(registry.includes(`\`${functionName}\``), `registry doc missing ${functionName}`);
  }
});

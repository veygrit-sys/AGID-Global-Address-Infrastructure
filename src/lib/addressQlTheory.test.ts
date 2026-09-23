import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { ADDRESSQL_FUNCTION_SPECS } from './addressQlResearch';
import {
  ADDRESSQL_MATHEMATICAL_FOUNDATIONS,
  ADDRESSQL_THEORY_DOMAINS,
  ADDRESSQL_THEORY_VERSION,
  buildAddressQlTheoryCoverageMatrix,
  validateAddressQlTheory,
  type AddressQlMathFoundationId,
  type AddressQlResearchDomainId,
} from './addressQlTheory';

test('AddressQL theory map covers the requested research domains', () => {
  assert.equal(ADDRESSQL_THEORY_VERSION, 'addressql-theory-v0.1');
  assert.deepEqual(validateAddressQlTheory(), []);

  const domainIds = new Set(ADDRESSQL_THEORY_DOMAINS.map(domain => domain.id));
  const requested: AddressQlResearchDomainId[] = [
    'address_morphism_normalization',
    'address_search_multilingual',
    'address_proof_authentication',
    'geo_delivery_optimization',
    'address_version_history',
    'distributed_address_database',
    'addressql_query_theory',
    'address_index_theory',
  ];

  for (const id of requested) assert.ok(domainIds.has(id), `missing ${id}`);
});

test('AddressQL mathematical foundations map SQL theory to address-specific usage', () => {
  const foundationIds = new Set(ADDRESSQL_MATHEMATICAL_FOUNDATIONS.map(foundation => foundation.id));
  const required: AddressQlMathFoundationId[] = [
    'set_theory',
    'predicate_logic',
    'discrete_mathematics',
    'graph_theory',
    'algebra',
    'formal_language_theory',
    'automata_theory',
    'computational_complexity',
    'optimization_theory',
    'probability_theory',
    'statistics',
    'information_theory',
    'cryptography',
    'number_theory',
    'geometry',
    'topology',
  ];

  for (const id of required) assert.ok(foundationIds.has(id), `missing ${id}`);

  const predicateLogic = ADDRESSQL_MATHEMATICAL_FOUNDATIONS.find(foundation => foundation.id === 'predicate_logic');
  const geometry = ADDRESSQL_MATHEMATICAL_FOUNDATIONS.find(foundation => foundation.id === 'geometry');

  assert.match(predicateLogic?.sqlUse ?? '', /WHERE/);
  assert.match(predicateLogic?.addressQlUse ?? '', /deliverable/);
  assert.match(geometry?.addressQlUse ?? '', /region membership/);
});

test('AddressQL theory domains reference real functions and executable artifacts', () => {
  const functionNames = new Set(ADDRESSQL_FUNCTION_SPECS.map(spec => spec.name));
  const coverage = buildAddressQlTheoryCoverageMatrix();

  assert.equal(coverage.length, ADDRESSQL_THEORY_DOMAINS.length);
  assert.ok(coverage.every(row => row.artifactCount >= 3));

  for (const domain of ADDRESSQL_THEORY_DOMAINS) {
    for (const functionName of domain.addressQlFunctions) {
      assert.ok(functionNames.has(functionName), `${domain.id} references unknown function ${functionName}`);
    }
  }

  const proof = ADDRESSQL_THEORY_DOMAINS.find(domain => domain.id === 'address_proof_authentication');
  const index = ADDRESSQL_THEORY_DOMAINS.find(domain => domain.id === 'address_index_theory');

  assert.ok(proof?.addressQlFunctions.includes('ADDRESS_COMMIT'));
  assert.ok(proof?.addressQlFunctions.includes('ADDRESS_HASH'));
  assert.ok(index?.formalObject.includes('I_postal'));
  assert.ok(index?.mathFoundations.includes('information_theory'));
});

test('AddressQL research docs expose the theory map and mathematical model', () => {
  const readme = readFileSync('docs/addressql/README.md', 'utf8');
  const research = readFileSync('docs/addressql/research-plan.md', 'utf8');
  const foundations = readFileSync('docs/addressql/theory-foundations.md', 'utf8');

  assert.match(readme, /theory-foundations\.md/);
  assert.match(research, /AddressQL Theory Map/);
  assert.match(foundations, /AddressQL Theory Map/);
  assert.match(foundations, /Address index theory/);
  assert.match(foundations, /predicate logic/);
  assert.match(foundations, /ADDRESS_COMMIT/);
  assert.match(foundations, /unsafe hash/);
});

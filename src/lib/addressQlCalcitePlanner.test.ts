import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESSQL_CALCITE_ACTIVATION_GATES,
  ADDRESSQL_CALCITE_COMPONENTS,
  ADDRESSQL_CALCITE_DIALECT_EXAMPLES,
  ADDRESSQL_CALCITE_PLANNER_VERSION,
  ADDRESSQL_CALCITE_REWRITE_RULES,
  shouldActivateAddressQlCalcite,
  validateAddressQlCalcitePlannerPlan,
} from './addressQlCalcitePlanner';

test('AddressQL Calcite v0.5 remains deferred until enough gates are true', () => {
  assert.equal(ADDRESSQL_CALCITE_PLANNER_VERSION, 'addressql-calcite-v0.5-deferred');
  assert.deepEqual(validateAddressQlCalcitePlannerPlan(), []);
  assert.equal(ADDRESSQL_CALCITE_ACTIVATION_GATES.length, 5);
  assert.equal(shouldActivateAddressQlCalcite(['custom_sql_dialect_required', 'multi_database_federation_required']), false);
  assert.equal(shouldActivateAddressQlCalcite(['custom_sql_dialect_required', 'multi_database_federation_required', 'adapter_sql_generation_required']), true);
});

test('AddressQL Calcite planner defines components and safety-first rewrite rules', () => {
  const componentNames = new Set(ADDRESSQL_CALCITE_COMPONENTS.map(component => component.name));
  const ruleIds = new Set(ADDRESSQL_CALCITE_REWRITE_RULES.map(rule => rule.id));

  assert.ok(componentNames.has('AddressQlDialectParser'));
  assert.ok(componentNames.has('AddressQlValidator'));
  assert.ok(componentNames.has('AddressQlRewritePlanner'));
  assert.ok(componentNames.has('AddressQlAdapterEmitter'));
  assert.ok(ruleIds.has('source_version_literal_lock'));
  assert.ok(ruleIds.has('postal_predicate_pushdown'));
  assert.ok(ruleIds.has('privacy_proof_barrier'));
  assert.ok(ruleIds.has('non_claim_preservation'));
});

test('AddressQL Calcite dialect examples cover source version, adapters, and non-claims', () => {
  assert.ok(ADDRESSQL_CALCITE_DIALECT_EXAMPLES.some(example => example.sql.includes('POSTAL_VALIDATE')));
  assert.ok(ADDRESSQL_CALCITE_DIALECT_EXAMPLES.some(example => example.targetAdapters.includes('DuckDB')));
  assert.ok(ADDRESSQL_CALCITE_DIALECT_EXAMPLES.some(example => example.nonClaim.includes('not proof')));
});

test('AddressQL Calcite docs and placeholder avoid premature Java dependency', () => {
  const doc = readFileSync('docs/addressql/calcite-v0.5.md', 'utf8');
  const placeholder = readFileSync('integrations/addressql-calcite/README.md', 'utf8');
  const stack = readFileSync('docs/addressql/technical-stack.md', 'utf8');
  const readme = readFileSync('docs/addressql/README.md', 'utf8');

  assert.ok(existsSync('integrations/addressql-calcite/README.md'));
  assert.match(doc, /Status: deferred planner and dialect design/);
  assert.match(doc, /Do not build the Calcite package until at least three/);
  assert.match(doc, /privacy and non-claim preservation/);
  assert.match(doc, /Do not add Maven, Gradle, or Calcite runtime dependency/);
  assert.match(placeholder, /intentionally contains no Maven, Gradle, or Apache Calcite/);
  assert.match(stack, /addressql-calcite-planner/);
  assert.match(readme, /Calcite v0\.5/);
});

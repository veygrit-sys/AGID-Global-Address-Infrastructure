import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESSQL_A_GRADE_READINESS_VERSION,
  buildAddressQlAGradeReadinessReport,
  validateAddressQlAGradeReadiness,
  type AddressQlAGradeCriterionId,
} from './addressQlAGradeReadiness';

test('AddressQL A-grade readiness report reaches A with no blocking gates', () => {
  const report = buildAddressQlAGradeReadinessReport();

  assert.equal(report.version, ADDRESSQL_A_GRADE_READINESS_VERSION);
  assert.equal(report.target, 'AddressQL A-grade implementation readiness');
  assert.equal(report.grade, 'A', report.blockingGates.join('\n'));
  assert.equal(report.score, 100);
  assert.equal(report.readyForAGrade, true);
  assert.deepEqual(validateAddressQlAGradeReadiness(), []);
});

test('AddressQL A-grade readiness covers all release-critical implementation layers', () => {
  const report = buildAddressQlAGradeReadinessReport();
  const ids = new Set(report.criteria.map(criterion => criterion.id));

  const expected: AddressQlAGradeCriterionId[] = [
    'postgres_real_function_surface',
    'rust_core_portable_kernel',
    'duckdb_research_and_cli_gate',
    'sdk_fixture_parity',
    'zk_hook_boundary',
    'global_country_postal_preload',
    'oss_publication_boundary',
    'release_verification_commands',
  ];

  for (const id of expected) assert.ok(ids.has(id), `${id} missing`);
  assert.equal(report.criteria.reduce((sum, criterion) => sum + criterion.weight, 0), 100);
  assert.ok(report.criteria.every(criterion => criterion.passed), report.blockingGates.join('\n'));
});

test('AddressQL A-grade readiness keeps proof, postal, and runtime non-claims explicit', () => {
  const report = buildAddressQlAGradeReadinessReport();
  const text = report.nonClaims.join('\n');
  const commands = report.recommendedCommands.join('\n');
  const doc = readFileSync('docs/addressql/a-grade-readiness-v0.8.md', 'utf8');

  assert.ok(existsSync('docs/addressql/a-grade-readiness-v0.8.md'));
  assert.match(text, /not proof of global address completeness/i);
  assert.match(text, /separate from residence, identity, and carrier SLA/i);
  assert.match(text, /until real circuits are implemented and audited/i);
  assert.match(text, /cargo and DuckDB CLI hard gates require those tools/i);
  assert.match(doc, /score >= 90/);
  assert.match(doc, /blockingGates\.length == 0/);
  assert.match(doc, /Production source licensing clearance/);
  assert.match(commands, /verify:addressql-a-grade/);
  assert.match(commands, /verify:addressql-core:cargo/);
  assert.match(commands, /verify:addressql-duckdb:cli -- --require-cli/);
});

test('AddressQL A-grade criteria expose actionable next fixes and evidence', () => {
  const report = buildAddressQlAGradeReadinessReport();

  for (const criterion of report.criteria) {
    assert.ok(criterion.title.length > 10, `${criterion.id}: missing title`);
    assert.ok(criterion.evidence.length >= 2, `${criterion.id}: thin evidence`);
    assert.ok(criterion.nextFix.length > 20, `${criterion.id}: missing next fix`);
  }
});

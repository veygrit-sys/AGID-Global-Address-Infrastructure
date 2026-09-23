import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { ADDRESSQL_FUNCTION_SPECS } from './addressQlResearch';
import {
  ADDRESSQL_ADAPTER_TARGETS,
  ADDRESSQL_OUTPUT_KIND_DEFINITIONS,
  ADDRESSQL_SCHEMA_BINDINGS,
  ADDRESSQL_SPECIFICATION_VERSION,
  ADDRESSQL_TECH_STACK,
  buildAddressQlFunctionRegistryRows,
  findMissingAddressQlOutputDefinitions,
  validateAddressQlSpecification,
} from './addressQlSpecification';

function extractAddressQlSqlJson(sql: string, functionName: string): Record<string, unknown> {
  const pattern = new RegExp(
    `/\\* addressql-json:${functionName} \\*/[\\s\\S]*?'(\\{[\\s\\S]*?\\})' AS result_json;[\\s\\S]*?/\\* end-addressql-json \\*/`,
    'm',
  );
  const match = sql.match(pattern);
  assert.ok(match, `missing SQL JSON fixture for ${functionName}`);
  return JSON.parse(match[1]) as Record<string, unknown>;
}

test('AddressQL specification has complete stack, adapter, and output schema coverage', () => {
  assert.equal(ADDRESSQL_SPECIFICATION_VERSION, 'addressql-specification-v0.1');
  assert.deepEqual(validateAddressQlSpecification(), []);
  assert.deepEqual(findMissingAddressQlOutputDefinitions(), []);
  assert.equal(ADDRESSQL_OUTPUT_KIND_DEFINITIONS.length, new Set(ADDRESSQL_FUNCTION_SPECS.map(spec => spec.outputKind)).size);
});

test('AddressQL technical stack prioritizes PostgreSQL full adapter and SQLite local adapter', () => {
  const postgres = ADDRESSQL_ADAPTER_TARGETS.find(item => item.target === 'PostgreSQL');
  const sqlite = ADDRESSQL_ADAPTER_TARGETS.find(item => item.target === 'SQLite');
  const layers = new Set(ADDRESSQL_TECH_STACK.map(item => item.layer));

  assert.equal(postgres?.targetLevel, 'L4_proof_privacy');
  assert.match(postgres?.executionModel ?? '', /JSONB/);
  assert.equal(sqlite?.targetLevel, 'L3_delivery_communication');
  assert.match(sqlite?.firstReleaseRole ?? '', /Offline\/local/);
  assert.ok(layers.has('proof_privacy'));
  assert.ok(layers.has('mobility_logistics'));
  assert.ok(layers.has('conformance'));
});

test('AddressQL function registry rows expose signatures and unsafe boundaries', () => {
  const rows = buildAddressQlFunctionRegistryRows();
  const hash = rows.find(row => row.name === 'ADDRESS_HASH');
  const prove = rows.find(row => row.name === 'ADDRESS_PROVE');
  const ack = rows.find(row => row.name === 'ADDRESS_ACK');

  assert.equal(rows.length, ADDRESSQL_FUNCTION_SPECS.length);
  assert.match(prove?.sqlSignature ?? '', /ADDRESS_PROVE\(envelope, claim, proof_policy\) -> AddressProofBundle/);
  assert.equal(hash?.phase, 'discouraged');
  assert.equal(hash?.privacyRisk, 'unsafe_by_default');
  assert.match(ack?.sqlSignature ?? '', /SemanticAck/);
});

test('AddressQL canonical and postal validation outputs are bound to executable schemas', () => {
  const canonical = ADDRESSQL_OUTPUT_KIND_DEFINITIONS.find(item => item.outputKind === 'CanonicalAddressObject');
  const postal = ADDRESSQL_OUTPUT_KIND_DEFINITIONS.find(item => item.outputKind === 'PostalValidationResult');
  const addressObjectSchema = JSON.parse(readFileSync(ADDRESSQL_SCHEMA_BINDINGS.canonicalAddressObject, 'utf8')) as { required: string[] };
  const validationResultSchema = JSON.parse(readFileSync(ADDRESSQL_SCHEMA_BINDINGS.postalValidationResult, 'utf8')) as { required: string[] };

  assert.equal(canonical?.schemaRef, ADDRESSQL_SCHEMA_BINDINGS.canonicalAddressObject);
  assert.equal(postal?.schemaRef, ADDRESSQL_SCHEMA_BINDINGS.postalValidationResult);
  for (const required of addressObjectSchema.required) {
    assert.ok(canonical?.resultShape.includes(required), `CanonicalAddressObject missing schema field ${required}`);
  }
  for (const required of validationResultSchema.required) {
    assert.ok(postal?.resultShape.includes(required), `PostalValidationResult missing schema field ${required}`);
  }
  assert.match(postal?.privacyBoundary ?? '', /not full address identity/);
  assert.match(postal?.privacyBoundary ?? '', /delivery availability/);
  assert.match(canonical?.privacyBoundary ?? '', /tokenized|policy-bound/);
});

test('AddressQL SQL return-shape fixture matches canonical schema fixtures', () => {
  const sql = readFileSync('docs/specs/fixtures/addressql-return-shapes-v0.1.sql', 'utf8');
  const canonicalSqlJson = extractAddressQlSqlJson(sql, 'ADDRESS_CANONICAL');
  const postalSqlJson = extractAddressQlSqlJson(sql, 'POSTAL_VALIDATE');
  const canonicalFixture = JSON.parse(readFileSync('docs/specs/fixtures/address-object-v0.1.json', 'utf8')) as Record<string, unknown>;
  const postalFixture = JSON.parse(readFileSync('docs/specs/fixtures/address-validation-result-v0.1.json', 'utf8')) as Record<string, unknown>;
  const addressObjectSchema = JSON.parse(readFileSync(ADDRESSQL_SCHEMA_BINDINGS.canonicalAddressObject, 'utf8')) as { required: string[] };
  const validationResultSchema = JSON.parse(readFileSync(ADDRESSQL_SCHEMA_BINDINGS.postalValidationResult, 'utf8')) as { required: string[] };

  assert.deepEqual(Object.keys(canonicalSqlJson).sort(), Object.keys(canonicalFixture).sort());
  assert.deepEqual(Object.keys(postalSqlJson).sort(), Object.keys(postalFixture).sort());
  for (const required of addressObjectSchema.required) {
    assert.ok(Object.hasOwn(canonicalSqlJson, required), `ADDRESS_CANONICAL SQL JSON missing ${required}`);
  }
  for (const required of validationResultSchema.required) {
    assert.ok(Object.hasOwn(postalSqlJson, required), `POSTAL_VALIDATE SQL JSON missing ${required}`);
  }
  assert.equal((canonicalSqlJson.privacy as { contains_raw_address?: boolean }).contains_raw_address, false);
  assert.equal((postalSqlJson.privacy as { contains_raw_address?: boolean }).contains_raw_address, false);
  assert.match((postalSqlJson.non_claims as string[]).join(' '), /does not claim that the address exists/);
  assert.doesNotMatch(sql, /sk_live_|BEGIN PRIVATE KEY|PRODUCTION_CREDENTIAL_VALUE|PRIVATE_KEY_VALUE/i);
});

test('AddressQL detailed docs cover stack, adapter matrix, registry, and result schemas', () => {
  const readme = readFileSync('docs/addressql/README.md', 'utf8');
  const spec = readFileSync('docs/addressql/specification-v0.1.md', 'utf8');
  const stack = readFileSync('docs/addressql/technical-stack.md', 'utf8');
  const registry = readFileSync('docs/addressql/function-registry-v0.1.md', 'utf8');

  assert.match(readme, /technical-stack\.md/);
  assert.match(readme, /function-registry-v0\.1\.md/);
  assert.match(spec, /Canonical Function Registry/);
  assert.match(stack, /PostgreSQL/);
  assert.match(stack, /SQLite/);
  assert.match(stack, /L4_proof_privacy/);
  assert.match(registry, /ADDRESS_PARSE/);
  assert.match(registry, /ADDRESS_HASH/);
  assert.match(registry, /unsafe_by_default/);
  assert.match(registry, /address-object-v0\.1\.schema\.json/);
  assert.match(registry, /address-validation-result-v0\.1\.schema\.json/);
  assert.match(registry, /not full address identity, delivery availability, or residence proof/);

  for (const specItem of ADDRESSQL_FUNCTION_SPECS) {
    assert.ok(registry.includes(`\`${specItem.name}\``), `registry doc missing ${specItem.name}`);
  }
});

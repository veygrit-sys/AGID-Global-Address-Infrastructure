import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

type JsonSchema = {
  title?: string;
  type?: string;
  required?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  enum?: string[];
  const?: unknown;
  additionalProperties?: boolean;
  minItems?: number;
  minLength?: number;
};

function readSchema(path: string): JsonSchema {
  return JSON.parse(readFileSync(path, 'utf8')) as JsonSchema;
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

function validateFixtureAgainstSchema(value: unknown, schema: JsonSchema, path = '$'): string[] {
  const errors: string[] = [];

  if (Object.hasOwn(schema, 'const') && value !== schema.const) {
    errors.push(`${path}: expected const ${String(schema.const)}`);
  }
  if (schema.enum && !schema.enum.includes(value as string)) {
    errors.push(`${path}: expected one of ${schema.enum.join(', ')}`);
  }
  if (schema.type === 'object') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return [`${path}: expected object`];
    }
    const record = value as Record<string, unknown>;
    for (const required of schema.required ?? []) {
      if (!Object.hasOwn(record, required)) {
        errors.push(`${path}: missing required ${required}`);
      }
    }
    if (schema.additionalProperties === false && schema.properties) {
      for (const key of Object.keys(record)) {
        if (!Object.hasOwn(schema.properties, key)) {
          errors.push(`${path}.${key}: additional property not allowed`);
        }
      }
    }
    for (const [key, childSchema] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(record, key)) {
        errors.push(...validateFixtureAgainstSchema(record[key], childSchema, `${path}.${key}`));
      }
    }
  }
  if (schema.type === 'array') {
    if (!Array.isArray(value)) {
      return [`${path}: expected array`];
    }
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${path}: expected at least ${schema.minItems} items`);
    }
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateFixtureAgainstSchema(item, schema.items!, `${path}[${index}]`));
      });
    }
  }
  if (schema.type === 'string') {
    if (typeof value !== 'string') {
      errors.push(`${path}: expected string`);
    } else if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${path}: expected minLength ${schema.minLength}`);
    }
  }
  if (schema.type === 'number' && typeof value !== 'number') {
    errors.push(`${path}: expected number`);
  }
  if (schema.type === 'boolean' && typeof value !== 'boolean') {
    errors.push(`${path}: expected boolean`);
  }

  return errors;
}

const addressObjectSchemaPath = 'docs/specs/schemas/address-object-v0.1.schema.json';
const validationResultSchemaPath = 'docs/specs/schemas/address-validation-result-v0.1.schema.json';
const addressObjectFixturePath = 'docs/specs/fixtures/address-object-v0.1.json';
const validationResultFixturePath = 'docs/specs/fixtures/address-validation-result-v0.1.json';

test('AddressObject schema separates expression, referent, evidence, quality, and privacy', () => {
  const schema = readSchema(addressObjectSchemaPath);

  assert.equal(schema.title, 'AddressObject v0.1');
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.required, [
    'version',
    'object_kind',
    'expression',
    'country',
    'quality_state',
    'evidence',
    'privacy',
  ]);
  assert.deepEqual(schema.properties?.version?.const, 'address-object-v0.1');
  assert.ok(schema.properties?.object_kind?.enum?.includes('address_expression'));
  assert.ok(schema.properties?.object_kind?.enum?.includes('address_referent'));
  assert.ok(schema.properties?.object_kind?.enum?.includes('delivery_point'));
  assert.ok(schema.properties?.referent);
  assert.ok(schema.properties?.identifiers);
});

test('AddressObject schema is raw-address-free by construction', () => {
  const schema = readSchema(addressObjectSchemaPath);
  const expression = schema.properties?.expression;
  const privacy = schema.properties?.privacy;

  assert.equal(expression?.properties?.raw_text_present?.const, false);
  assert.equal(privacy?.properties?.contains_raw_address?.const, false);
  assert.ok(expression?.properties?.display_text_redacted);
  assert.equal(expression?.properties?.raw_address, undefined);
  assert.equal(schema.properties?.raw_address, undefined);
});

test('AddressValidationResult schema separates format, existence, delivery, and identity relationship', () => {
  const schema = readSchema(validationResultSchemaPath);
  const purpose = schema.properties?.purpose;
  const boundaries = schema.properties?.result_boundaries;

  assert.equal(schema.title, 'AddressValidationResult v0.1');
  assert.deepEqual(purpose?.enum, ['format', 'existence', 'delivery', 'identity_relationship']);
  assert.deepEqual(boundaries?.required, [
    'format_pass_does_not_imply_existence',
    'existence_pass_does_not_imply_delivery',
    'delivery_pass_does_not_imply_identity',
    'identity_pass_does_not_disclose_full_address',
  ]);
  assert.equal(boundaries?.properties?.format_pass_does_not_imply_existence?.const, true);
  assert.equal(boundaries?.properties?.existence_pass_does_not_imply_delivery?.const, true);
  assert.equal(boundaries?.properties?.delivery_pass_does_not_imply_identity?.const, true);
  assert.equal(boundaries?.properties?.identity_pass_does_not_disclose_full_address?.const, true);
});

test('AddressValidationResult schema preserves source, non-claim, and log-safety boundaries', () => {
  const schema = readSchema(validationResultSchemaPath);
  const privacy = schema.properties?.privacy;

  assert.ok(schema.required?.includes('source_refs'));
  assert.ok(schema.required?.includes('non_claims'));
  assert.equal(schema.properties?.source_refs?.properties, undefined);
  assert.equal(privacy?.properties?.contains_raw_address?.const, false);
  assert.equal(privacy?.properties?.log_safe?.const, true);
  assert.ok(privacy?.properties?.disclosure_scope?.enum?.includes('status_only'));
  assert.ok(privacy?.properties?.disclosure_scope?.enum?.includes('authorized_processor'));
});

test('synthetic AddressObject fixture validates against the schema subset used by the contract', () => {
  const schema = readSchema(addressObjectSchemaPath);
  const fixture = readJson(addressObjectFixturePath);

  assert.deepEqual(validateFixtureAgainstSchema(fixture, schema), []);
  assert.doesNotMatch(JSON.stringify(fixture), /recipient|private[_-]?key|proof[_-]?secret|production/i);
  assert.match(JSON.stringify(fixture), /SYNTHETIC_FIXTURE_ADDRESS_TOKEN/);
});

test('synthetic AddressValidationResult fixture validates and preserves purpose boundaries', () => {
  const schema = readSchema(validationResultSchemaPath);
  const fixture = readJson(validationResultFixturePath) as {
    purpose: string;
    result_boundaries: Record<string, boolean>;
    non_claims: string[];
  };

  assert.deepEqual(validateFixtureAgainstSchema(fixture, schema), []);
  assert.equal(fixture.purpose, 'format');
  assert.equal(fixture.result_boundaries.format_pass_does_not_imply_existence, true);
  assert.equal(fixture.result_boundaries.delivery_pass_does_not_imply_identity, true);
  assert.match(fixture.non_claims.join(' '), /does not claim that the address exists/);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

type JsonSchema = {
  $schema: string;
  $id: string;
  properties: {
    schemaVersion: { const: string };
  };
  $defs: {
    releaseArtifact: {
      properties: {
        path: {
          pattern: string;
        };
      };
    };
    node: {
      required: string[];
      properties: {
        kind: { enum: string[] };
      };
    };
    source: {
      required: string[];
      properties: {
        assignmentAuthority: { enum: string[] };
        geometryAuthority: { enum: string[] };
      };
    };
    assertion: {
      required: string[];
      properties: {
        relation: { enum: string[] };
        purposes: { items: { enum: string[] } };
      };
    };
  };
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const schema = JSON.parse(readFileSync(
  resolve(root, 'docs/schemas/postal-context-graph-v0.1.schema.json'),
  'utf8',
)) as JsonSchema;

test('Postal Context JSON Schema pins the language-independent v0.1 contract', () => {
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.$id, 'urn:agid:schema:postal-context-graph:v0.1');
  assert.equal(schema.properties.schemaVersion.const, 'postal-context-graph/v0.1');
  assert.ok(schema.$defs.node.required.includes('geometryType'));
  assert.ok(schema.$defs.node.properties.kind.enum.includes('postal_feature'));
  assert.ok(schema.$defs.node.properties.kind.enum.includes('address_record'));
  assert.ok(schema.$defs.node.properties.kind.enum.includes('building'));
  assert.ok(schema.$defs.node.properties.kind.enum.includes('entrance'));
});

test('JSON Schema preserves authority separation, purpose, and privacy-sensitive kinds', () => {
  assert.ok(schema.$defs.source.required.includes('assignmentAuthority'));
  assert.ok(schema.$defs.source.required.includes('geometryAuthority'));
  assert.ok(schema.$defs.source.properties.assignmentAuthority.enum.includes('none'));
  assert.ok(schema.$defs.source.properties.assignmentAuthority.enum.includes('official_postal_dictionary'));
  assert.ok(schema.$defs.source.properties.assignmentAuthority.enum.includes('official_postal_mapping_authority'));
  assert.ok(schema.$defs.source.properties.geometryAuthority.enum.includes('none'));
  assert.ok(schema.$defs.assertion.properties.relation.enum.includes('postal_assigned'));
  assert.ok(schema.$defs.assertion.properties.relation.enum.includes('postal_contains'));
  assert.ok(schema.$defs.assertion.properties.purposes.items.enum.includes('display'));
  assert.ok(schema.$defs.assertion.properties.purposes.items.enum.includes('delivery'));
  assert.ok(schema.$defs.assertion.properties.purposes.items.enum.includes('navigation'));
  assert.ok(schema.$defs.assertion.properties.purposes.items.enum.includes('cadastral'));
  assert.ok(schema.$defs.node.properties.kind.enum.includes('unit'));
  assert.ok(schema.$defs.node.properties.kind.enum.includes('recipient'));
});

test('JSON Schema artifact paths remain relative on POSIX and Windows', () => {
  const pattern = new RegExp(schema.$defs.releaseArtifact.properties.path.pattern);

  assert.equal(pattern.test('context/postal.fgb'), true);
  assert.equal(pattern.test('../outside/postal.fgb'), false);
  assert.equal(pattern.test('C:/outside/postal.fgb'), false);
});

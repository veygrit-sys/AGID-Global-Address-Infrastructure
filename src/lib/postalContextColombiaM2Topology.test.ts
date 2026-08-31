import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import type { PostalContextGeometryCollection } from './postalContextSpatial';
import { validatePostalContextGeometryTopology } from './postalContextTopology';
import { loadPostalContextPack } from '../server/postalContextPackStore';

const descriptorPath = resolve('data/postal_country_packs/co/postal-context/m2/descriptor.json');
const geometryPath = resolve('data/postal_country_packs/co/postal-context/m2/geometry.json');
const descriptorDigest = 'sha256:e43c1aea64e128eecc999ff33c898b99113bb2f07c84f521fcac47f8951d354a';

function digest(path: string) {
  return `sha256:${createHash('sha256').update(readFileSync(path)).digest('hex')}`;
}

test('CO descriptor loads the complete real national derived display pack', () => {
  assert.equal(digest(descriptorPath), descriptorDigest);
  const loaded = loadPostalContextPack(descriptorPath, descriptorDigest, {
    expectedCountryCode: 'CO', allowExperimental: true,
  });
  assert.equal(loaded.descriptor.countryCode, 'CO');
  assert.equal(loaded.descriptor.releaseId, 'co-472-national-postal-areas-20260901');
  assert.equal(loaded.descriptor.synthetic, false);
  assert.deepEqual(loaded.warnings, []);
  assert.deepEqual(loaded.runtime.status().counts, {
    nodes: 3682, assertions: 3681, geometries: 3681, postalCodes: 3681, excludedByQualityOrPublication: 0,
  });
});

test('CO output contains 3,681 valid MultiPolygon surfaces and no non-area or private rows', () => {
  const geometry = JSON.parse(readFileSync(geometryPath, 'utf8')) as PostalContextGeometryCollection;
  const topology = validatePostalContextGeometryTopology(geometry);
  assert.equal(topology.valid, true, topology.errors.join('\n'));
  assert.deepEqual(topology.errors, []);
  assert.equal(topology.positionCount, 312937);
  assert.equal(geometry.features.length, 3681);
  assert.equal(new Set(geometry.features.map(item => item.nodeId)).size, 3681);
  assert.ok(geometry.features.every(item => item.geometry.type === 'MultiPolygon'));
  assert.ok(geometry.features.every(item => item.role === 'postal_area'));
  assert.ok(geometry.features.every(item => item.publicationClass === 'public_context'));
  assert.ok(geometry.features.every(item => item.source.sourceType === 'derived'));
  assert.ok(geometry.features.every(item => item.source.assignmentAuthority === 'official_postal_operator'));
  assert.ok(geometry.features.every(item => item.source.geometryAuthority === 'derived_geometry'));
  assert.ok(geometry.features.every(item => item.quality.status === 'derived'));
  assert.ok(geometry.features.every(item => item.quality.confidence === 0.97));
  assert.ok(geometry.features.every(item => item.quality.accuracyMeters === 120));
});

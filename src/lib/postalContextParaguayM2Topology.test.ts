import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import type { PostalContextGeometryCollection } from './postalContextSpatial';
import { validatePostalContextGeometryTopology } from './postalContextTopology';
import { loadPostalContextPack } from '../server/postalContextPackStore';

const descriptorPath = resolve('data/postal_country_packs/py/postal-context/m2/descriptor.json');
const geometryPath = resolve('data/postal_country_packs/py/postal-context/m2/geometry.json');
const descriptorDigest = 'sha256:d12690e3f4a6cf79cab02e756bc7b6b49203561110b8a68c14002ed10d151c99';
const validAt = '2026-09-02T05:02:03.144Z';

function digest(path: string) {
  return `sha256:${createHash('sha256').update(readFileSync(path)).digest('hex')}`;
}

test('PY descriptor loads the complete real DINACOPA national derived display pack', () => {
  assert.equal(digest(descriptorPath), descriptorDigest);
  const loaded = loadPostalContextPack(descriptorPath, descriptorDigest, {
    expectedCountryCode: 'PY', allowExperimental: true,
  });
  assert.equal(loaded.descriptor.countryCode, 'PY');
  assert.equal(loaded.descriptor.releaseId, 'py-dinacopa-national-postal-zones-20260902');
  assert.equal(loaded.descriptor.synthetic, false);
  assert.deepEqual(loaded.warnings, []);
  assert.deepEqual(loaded.runtime.status().counts, {
    nodes: 11811, assertions: 17569, geometries: 2887, postalCodes: 2887,
    excludedByQualityOrPublication: 0,
  });

  const found = loaded.runtime.lookupPostalCode('００１ ５１８', validAt, validAt, true);
  assert.equal(found.status, 'unique');
  assert.equal(found.normalizedPostalCode, '001518');
  assert.equal(found.geometries.length, 1);
  assert.equal(found.geometries[0]?.geometry.type, 'MultiPolygon');
  assert.ok(found.alternatives[0]?.contexts.some(item => item.id === 'locality-py-001518-0000052-052-row-00001'
    && item.label?.includes('SANTA ROSA — postal 001518; cod_bar 0000052; BARLOC 052')));
  assert.ok(found.alternatives[0]?.contexts.some(item => item.id === 'admin-py-district-0015'));
  assert.ok(found.alternatives[0]?.contexts.some(item => item.id === 'admin-py-department-00'));
  assert.ok(found.alternatives[0]?.contexts.some(item => item.id === 'country-py'));
});

test('PY output contains 2,887 valid MultiPolygon surfaces and no non-area or private rows', () => {
  const geometry = JSON.parse(readFileSync(geometryPath, 'utf8')) as PostalContextGeometryCollection;
  const topology = validatePostalContextGeometryTopology(geometry);
  assert.equal(topology.valid, true, topology.errors.join('\n'));
  assert.deepEqual(topology.errors, []);
  assert.equal(topology.positionCount, 339723);
  assert.equal(geometry.features.length, 2887);
  assert.equal(new Set(geometry.features.map(item => item.nodeId)).size, 2887);
  assert.ok(geometry.features.every(item => item.geometry.type === 'MultiPolygon'));
  assert.ok(geometry.features.every(item => item.role === 'postal_area'));
  assert.ok(geometry.features.every(item => item.publicationClass === 'public_context'));
  assert.ok(geometry.features.every(item => item.source.sourceType === 'derived'));
  assert.ok(geometry.features.every(item => item.source.assignmentAuthority === 'official_postal_operator'));
  assert.ok(geometry.features.every(item => item.source.geometryAuthority === 'derived_geometry'));
  assert.ok(geometry.features.every(item => item.quality.status === 'derived'));
  assert.ok(geometry.features.every(item => item.quality.confidence === 0.98));
  assert.ok(geometry.features.every(item => item.quality.accuracyMeters === 25));
});

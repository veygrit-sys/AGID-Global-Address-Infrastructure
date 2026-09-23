import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import area from '@turf/area';
import bbox from '@turf/bbox';
import booleanValid from '@turf/boolean-valid';
import jsts from 'jsts';
import type { PostalContextGeometryCollection } from './postalContextSpatial';
import { validatePostalContextGeometryTopology } from './postalContextTopology';
import { loadPostalContextPack } from '../server/postalContextPackStore';

const descriptorPath = resolve('data/postal_country_packs/fk/postal-context/m2/descriptor.json');
const geometryPath = resolve('data/postal_country_packs/fk/postal-context/m2/geometry.json');

function digest(path: string) {
  return `sha256:${createHash('sha256').update(readFileSync(path)).digest('hex')}`;
}

function jstsValid(geometry: unknown) {
  return new jsts.operation.valid.IsValidOp(new jsts.io.GeoJSONReader().read(geometry)).isValid();
}

test('FK descriptor loads through the shared runtime with one real postal node and two surfaces', () => {
  const descriptorDigest = digest(descriptorPath);
  assert.equal(descriptorDigest, 'sha256:355cf5ecc1bfaf4532e0c01c69a67119d4f46da7d9723114a21e9f87b8af9a0f');
  const loaded = loadPostalContextPack(descriptorPath, descriptorDigest, {
    expectedCountryCode: 'FK', allowExperimental: true,
  });
  assert.equal(loaded.descriptor.countryCode, 'FK');
  assert.equal(loaded.descriptor.releaseId, 'fk-upu-geoboundaries-20260901');
  assert.equal(loaded.descriptor.synthetic, false);
  assert.deepEqual(loaded.warnings, []);
  const counts = loaded.runtime.status().counts;
  assert.equal(counts.nodes, 2);
  assert.equal(counts.assertions, 1);
  assert.equal(counts.geometries, 2);
  assert.equal(counts.postalCodes, 1);
});

test('FK output preserves all source outer-ring positions in two independently valid derived MultiPolygons', () => {
  const geometry = JSON.parse(readFileSync(geometryPath, 'utf8')) as PostalContextGeometryCollection;
  const topology = validatePostalContextGeometryTopology(geometry);
  assert.equal(topology.valid, true, topology.errors.join('\n'));
  assert.deepEqual(topology.errors, []);
  assert.equal(topology.positionCount, 13250);
  assert.equal(geometry.features.length, 2);
  assert.ok(geometry.features.every(item => item.geometry.type === 'MultiPolygon'));
  assert.ok(geometry.features.every(item => booleanValid({ type: 'Feature', properties: {}, geometry: item.geometry })));
  assert.ok(geometry.features.every(item => jstsValid(item.geometry)));
  assert.ok(geometry.features.every(item => item.nodeId === 'postal-fk-fiqq-1zz'));
  const turfFeatures = geometry.features.map(item => ({
    type: 'Feature' as const, properties: {}, geometry: item.geometry,
  }));
  const boxes = turfFeatures.map(item => bbox(item as never));
  const combinedBounds = [
    Math.min(...boxes.map(item => item[0])), Math.min(...boxes.map(item => item[1])),
    Math.max(...boxes.map(item => item[2])), Math.max(...boxes.map(item => item[3])),
  ];
  const totalArea = turfFeatures.reduce((sum, item) => sum + area(item as never), 0);
  assert.deepEqual(combinedBounds, [-61.45701982833657, -52.91753437962251, -57.7172582353046, -50.99732409384637]);
  assert.ok(Math.abs(totalArea / 1e6 - 11872.946669672881) < 1e-9);
});

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

const descriptorPath = resolve('data/postal_country_packs/tc/postal-context/m2/descriptor.json');
const geometryPath = resolve('data/postal_country_packs/tc/postal-context/m2/geometry.json');

function digest(path: string) {
  return `sha256:${createHash('sha256').update(readFileSync(path)).digest('hex')}`;
}

function jstsValid(geometry: unknown) {
  return new jsts.operation.valid.IsValidOp(new jsts.io.GeoJSONReader().read(geometry)).isValid();
}

test('TC descriptor loads through the shared runtime with one postal node, 27 linked regions and two real geometry bundles', () => {
  const descriptorDigest = digest(descriptorPath);
  assert.equal(descriptorDigest, 'sha256:bae55b493e9303a8d47bc20ef34371d56fbbcfcd9e012e0b8629b5ce8f4437ac');
  const loaded = loadPostalContextPack(descriptorPath, descriptorDigest, {
    expectedCountryCode: 'TC', allowExperimental: true,
  });
  assert.equal(loaded.descriptor.countryCode, 'TC');
  assert.equal(loaded.descriptor.releaseId, 'tc-upu-decr-shoreline-20260902');
  assert.equal(loaded.descriptor.synthetic, false);
  assert.deepEqual(loaded.warnings, []);
  const counts = loaded.runtime.status().counts;
  assert.equal(counts.nodes, 29);
  assert.equal(counts.assertions, 28);
  assert.equal(counts.geometries, 2);
  assert.equal(counts.postalCodes, 1);
});

test('TC derived output stays within the measured quality envelope and every surface is independently valid', () => {
  const geometry = JSON.parse(readFileSync(geometryPath, 'utf8')) as PostalContextGeometryCollection;
  const topology = validatePostalContextGeometryTopology(geometry);
  assert.equal(topology.valid, true, topology.errors.join('\n'));
  assert.deepEqual(topology.errors, []);
  assert.equal(topology.positionCount, 7838);
  assert.equal(geometry.features.length, 2);
  assert.ok(geometry.features.every(item => item.geometry.type === 'MultiPolygon'));
  assert.ok(geometry.features.every(item => booleanValid({ type: 'Feature', properties: {}, geometry: item.geometry })));
  assert.ok(geometry.features.every(item => jstsValid(item.geometry)));
  assert.ok(geometry.features.every(item => item.nodeId === 'postal-tc-tkca-1zz'));
  assert.equal(new Set(geometry.features.map(item => item.id)).size, 2);
  const turfFeatures = geometry.features.map(item => ({
    type: 'Feature' as const, properties: {}, geometry: item.geometry,
  }));
  const boxes = turfFeatures.map(item => bbox(item as never));
  const combinedBounds = [
    Math.min(...boxes.map(item => item[0])), Math.min(...boxes.map(item => item[1])),
    Math.max(...boxes.map(item => item[2])), Math.max(...boxes.map(item => item[3])),
  ];
  const totalArea = turfFeatures.reduce((sum, item) => sum + area(item as never), 0);
  assert.deepEqual(combinedBounds, [-72.48277771282113, 21.17765818467751, -71.07836651670135, 21.962492454937887]);
  assert.ok(Math.abs(totalArea / 1e6 - 933.8372453090698) < 1e-9);
});

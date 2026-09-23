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

const descriptorPath = resolve('data/postal_country_packs/mf/postal-context/m2/descriptor.json');
const geometryPath = resolve('data/postal_country_packs/mf/postal-context/m2/geometry.json');
const descriptorDigest = 'sha256:73b833176a1638cc7de680ad5874d76d9519dca780b9e87ad5a42e26ec5112e4';
const digest = (path: string) => 'sha256:' + createHash('sha256').update(readFileSync(path)).digest('hex');

test('MF descriptor loads through the shared runtime with one real postal node and surface', () => {
  assert.equal(digest(descriptorPath), descriptorDigest);
  const loaded = loadPostalContextPack(descriptorPath, descriptorDigest, { expectedCountryCode: 'MF', allowExperimental: true });
  assert.equal(loaded.descriptor.countryCode, 'MF');
  assert.equal(loaded.descriptor.releaseId, 'mf-laposte-geoapi-single-postcode-20260901');
  assert.equal(loaded.descriptor.synthetic, false);
  assert.deepEqual(loaded.warnings, []);
  assert.deepEqual(loaded.runtime.status().counts, {
    nodes: 2, assertions: 1, geometries: 1, postalCodes: 1, excludedByQualityOrPublication: 0,
  });
});

test('MF output is a closed valid coordinate-preserving real MultiPolygon', () => {
  const collection = JSON.parse(readFileSync(geometryPath, 'utf8')) as PostalContextGeometryCollection;
  const topology = validatePostalContextGeometryTopology(collection);
  assert.equal(topology.valid, true, topology.errors.join('\n'));
  assert.deepEqual(topology.errors, []);
  assert.equal(topology.positionCount, 2136);
  assert.equal(collection.features.length, 1);
  const item = collection.features[0];
  assert.equal(item.geometry.type, 'MultiPolygon');
  assert.equal(item.geometry.coordinates.length, 11);
  assert.ok(booleanValid({ type: 'Feature', properties: {}, geometry: item.geometry }));
  assert.ok(new jsts.operation.valid.IsValidOp(new jsts.io.GeoJSONReader().read(item.geometry)).isValid());
  assert.deepEqual(bbox({ type: 'Feature', properties: {}, geometry: item.geometry } as never), [-63.15332, 18.045903, -62.970711, 18.125195]);
  assert.ok(Math.abs(area({ type: 'Feature', properties: {}, geometry: item.geometry } as never) / 1e6 - 53.649431807733244) < 1e-9);
});

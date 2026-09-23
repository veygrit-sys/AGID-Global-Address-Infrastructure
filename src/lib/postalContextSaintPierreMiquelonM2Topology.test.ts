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

const descriptorPath = resolve('data/postal_country_packs/pm/postal-context/m2/descriptor.json');
const geometryPath = resolve('data/postal_country_packs/pm/postal-context/m2/geometry.json');
const descriptorDigest = 'sha256:eefdebc10d77d0adb486c788f9c8a2c6b2129e247b18cec2c6d69f3815b64f1d';
const digest = (path: string) => 'sha256:' + createHash('sha256').update(readFileSync(path)).digest('hex');

test('PM descriptor loads through shared runtime with one real postal surface and two admin IDs', () => {
  assert.equal(digest(descriptorPath), descriptorDigest);
  const loaded = loadPostalContextPack(descriptorPath, descriptorDigest, { expectedCountryCode: 'PM', allowExperimental: true });
  assert.equal(loaded.descriptor.countryCode, 'PM');
  assert.equal(loaded.descriptor.releaseId, 'pm-laposte-geoapi-single-postcode-20260901');
  assert.equal(loaded.descriptor.synthetic, false);
  assert.deepEqual(loaded.warnings, []);
  assert.deepEqual(loaded.runtime.status().counts, {
    nodes: 3, assertions: 2, geometries: 1, postalCodes: 1, excludedByQualityOrPublication: 0,
  });
});

test('PM output is a closed valid coordinate-preserving real MultiPolygon', () => {
  const collection = JSON.parse(readFileSync(geometryPath, 'utf8')) as PostalContextGeometryCollection;
  const topology = validatePostalContextGeometryTopology(collection);
  assert.equal(topology.valid, true, topology.errors.join('\n'));
  assert.deepEqual(topology.errors, []);
  assert.equal(topology.positionCount, 9097);
  assert.equal(collection.features.length, 1);
  const item = collection.features[0];
  assert.equal(item.geometry.type, 'MultiPolygon');
  assert.equal(item.geometry.coordinates.length, 78);
  assert.ok(booleanValid({ type: 'Feature', properties: {}, geometry: item.geometry }));
  assert.ok(new jsts.operation.valid.IsValidOp(new jsts.io.GeoJSONReader().read(item.geometry)).isValid());
  assert.deepEqual(bbox({ type: 'Feature', properties: {}, geometry: item.geometry } as never), [-56.518569, 46.749454, -56.119017, 47.144249]);
  assert.ok(Math.abs(area({ type: 'Feature', properties: {}, geometry: item.geometry } as never) / 1e6 - 219.09697358099386) < 1e-9);
});

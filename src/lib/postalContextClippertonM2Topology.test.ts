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

const descriptorPath = resolve('data/postal_country_packs/cp/postal-context/m2/descriptor.json');
const geometryPath = resolve('data/postal_country_packs/cp/postal-context/m2/geometry.json');
const descriptorDigest = 'sha256:763153bb5e2621e60bdebf3c337820da301f79ff9e4f40623f23341b45d97eda';
const digest = (path: string) => 'sha256:' + createHash('sha256').update(readFileSync(path)).digest('hex');

test('CP descriptor loads through the shared runtime with one real postal node and surface', () => {
  assert.equal(digest(descriptorPath), descriptorDigest);
  const loaded = loadPostalContextPack(descriptorPath, descriptorDigest, { expectedCountryCode: 'CP', allowExperimental: true });
  assert.equal(loaded.descriptor.countryCode, 'CP');
  assert.equal(loaded.descriptor.releaseId, 'cp-laposte-geoapi-single-postcode-20260901');
  assert.equal(loaded.descriptor.synthetic, false);
  assert.deepEqual(loaded.warnings, []);
  assert.deepEqual(loaded.runtime.status().counts, {
    nodes: 2, assertions: 1, geometries: 1, postalCodes: 1, excludedByQualityOrPublication: 0,
  });
});

test('CP output is a closed valid coordinate-preserving real Polygon', () => {
  const collection = JSON.parse(readFileSync(geometryPath, 'utf8')) as PostalContextGeometryCollection;
  const topology = validatePostalContextGeometryTopology(collection);
  assert.equal(topology.valid, true, topology.errors.join('\n'));
  assert.deepEqual(topology.errors, []);
  assert.equal(topology.positionCount, 110);
  assert.equal(collection.features.length, 1);
  const item = collection.features[0];
  assert.equal(item.geometry.type, 'Polygon');
  assert.equal(item.geometry.coordinates.length, 1);
  assert.ok(booleanValid({ type: 'Feature', properties: {}, geometry: item.geometry }));
  assert.ok(new jsts.operation.valid.IsValidOp(new jsts.io.GeoJSONReader().read(item.geometry)).isValid());
  assert.deepEqual(bbox({ type: 'Feature', properties: {}, geometry: item.geometry } as never), [-109.234607, 10.287154, -109.19979, 10.31957]);
  assert.ok(Math.abs(area({ type: 'Feature', properties: {}, geometry: item.geometry } as never) / 1e6 - 8.889080340032724) < 1e-9);
});

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

const descriptorPath = resolve('data/postal_country_packs/bl/postal-context/m2/descriptor.json');
const geometryPath = resolve('data/postal_country_packs/bl/postal-context/m2/geometry.json');
const descriptorDigest = 'sha256:688cf43fd1a928f08517e18c7d7b2ecab0a9013a8ba2659fe72f64e09aa9c6d8';
const digest = (path: string) => 'sha256:' + createHash('sha256').update(readFileSync(path)).digest('hex');

test('BL descriptor loads through the shared runtime with one real postal node and surface', () => {
  assert.equal(digest(descriptorPath), descriptorDigest);
  const loaded = loadPostalContextPack(descriptorPath, descriptorDigest, { expectedCountryCode: 'BL', allowExperimental: true });
  assert.equal(loaded.descriptor.countryCode, 'BL');
  assert.equal(loaded.descriptor.releaseId, 'bl-laposte-geoapi-single-postcode-20260831');
  assert.equal(loaded.descriptor.synthetic, false);
  assert.deepEqual(loaded.warnings, []);
  assert.deepEqual(loaded.runtime.status().counts, {
    nodes: 2, assertions: 1, geometries: 1, postalCodes: 1, excludedByQualityOrPublication: 0,
  });
});

test('BL output is a closed valid coordinate-preserving real MultiPolygon', () => {
  const collection = JSON.parse(readFileSync(geometryPath, 'utf8')) as PostalContextGeometryCollection;
  const topology = validatePostalContextGeometryTopology(collection);
  assert.equal(topology.valid, true, topology.errors.join('\n'));
  assert.deepEqual(topology.errors, []);
  assert.equal(topology.positionCount, 2912);
  assert.equal(collection.features.length, 1);
  const item = collection.features[0];
  assert.equal(item.geometry.type, 'MultiPolygon');
  assert.equal(item.geometry.coordinates.length, 21);
  assert.ok(booleanValid({ type: 'Feature', properties: {}, geometry: item.geometry }));
  assert.ok(new jsts.operation.valid.IsValidOp(new jsts.io.GeoJSONReader().read(item.geometry)).isValid());
  assert.deepEqual(bbox({ type: 'Feature', properties: {}, geometry: item.geometry } as never), [-62.926554, 17.870779, -62.789086, 17.974092]);
  assert.ok(Math.abs(area({ type: 'Feature', properties: {}, geometry: item.geometry } as never) / 1e6 - 20.439471117282295) < 1e-9);
});

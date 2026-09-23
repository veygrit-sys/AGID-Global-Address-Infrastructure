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

const descriptorPath = resolve('data/postal_country_packs/pr/postal-context/m2/descriptor.json');
const geometryPath = resolve('data/postal_country_packs/pr/postal-context/m2/geometry.json');
const descriptorDigest = 'sha256:876abe3dafe711d950d6de645103355d2bdaecbe48f92d48ec70e0df40864309';
const digest = (path: string) => 'sha256:' + createHash('sha256').update(readFileSync(path)).digest('hex');

test('PR descriptor loads 132 real Census ZCTA surfaces through the shared runtime', () => {
  assert.equal(digest(descriptorPath), descriptorDigest);
  const loaded = loadPostalContextPack(descriptorPath, descriptorDigest, {
    expectedCountryCode: 'PR', allowExperimental: true,
  });
  assert.equal(loaded.descriptor.releaseId, 'pr-census-zcta-2020-20260902');
  assert.equal(loaded.descriptor.synthetic, false);
  assert.deepEqual(loaded.warnings, []);
  assert.deepEqual(loaded.runtime.status().counts, {
    nodes: 133, assertions: 132, geometries: 132, postalCodes: 132, excludedByQualityOrPublication: 0,
  });
});

test('PR output is coordinate-preserving, valid and spans the fixed Census query', () => {
  const collection = JSON.parse(readFileSync(geometryPath, 'utf8')) as PostalContextGeometryCollection;
  const topology = validatePostalContextGeometryTopology(collection);
  assert.equal(topology.valid, true, topology.errors.join('\n'));
  assert.equal(topology.positionCount, 168582);
  assert.equal(collection.features.length, 132);
  assert.equal(collection.features.filter(item => item.geometry.type === 'MultiPolygon').length, 8);
  for (const item of collection.features) {
    const feature = { type: 'Feature', properties: {}, geometry: item.geometry };
    assert.ok(booleanValid(feature as never), item.id);
    assert.ok(new jsts.operation.valid.IsValidOp(new jsts.io.GeoJSONReader().read(item.geometry)).isValid(), item.id);
    assert.equal(item.source.sourceType, 'derived');
    assert.equal(item.source.geometryAuthority, 'official_mapping_geometry');
  }
  const turfCollection = {
    type: 'FeatureCollection',
    features: collection.features.map(item => ({ type: 'Feature', properties: {}, geometry: item.geometry })),
  };
  assert.deepEqual(bbox(turfCollection as never), [-67.95179799957432, 17.910816999983286, -65.2210270004101, 18.51870700012846]);
  assert.ok(Math.abs(area(turfCollection as never) / 1e6 - 9487.290179349711) < 1e-9);
});

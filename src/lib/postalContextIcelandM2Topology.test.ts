import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import type { PostalContextGeometryCollection } from './postalContextSpatial';
import { validatePostalContextGeometryTopology } from './postalContextTopology';
import { loadPostalContextPack } from '../server/postalContextPackStore';

const descriptorPath = resolve('data/postal_country_packs/is/postal-context/m2/descriptor.json');
const geometryPath = resolve('data/postal_country_packs/is/postal-context/m2/geometry.json');
const descriptorDigest = 'sha256:b3a5e96401d075f70cf3c82d9dbb0c4661cfa4a120b02e2c8055c024c13a6545';

test('Iceland M2 descriptor binds the complete current runtime artifact', () => {
  const bytes = readFileSync(descriptorPath);
  const digest = `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
  assert.equal(digest, descriptorDigest);

  const loaded = loadPostalContextPack(descriptorPath, descriptorDigest, {
    expectedCountryCode: 'IS',
    allowExperimental: true,
  });
  assert.equal(loaded.descriptor.countryCode, 'IS');
  assert.equal(loaded.descriptor.releaseId, 'is-byggdastofnun-postnumer-20260830');
  assert.equal(loaded.descriptor.synthetic, false);
  assert.equal(loaded.descriptor.containsResidentialAddressPoints, false);
  assert.deepEqual(loaded.warnings, []);
  assert.equal(loaded.runtime.status().counts.nodes, 175);
  assert.equal(loaded.runtime.status().counts.assertions, 174);
  assert.equal(loaded.runtime.status().counts.geometries, 174);
});

test('Iceland M2 full geometry completes shared topology validation within the unchanged budget', () => {
  const geometry = JSON.parse(readFileSync(geometryPath, 'utf8')) as PostalContextGeometryCollection;
  const result = validatePostalContextGeometryTopology(geometry);

  assert.equal(geometry.countryCode, 'IS');
  assert.equal(geometry.features.length, 174);
  assert.equal(result.valid, true, result.errors.join('\n'));
  assert.deepEqual(result.errors, []);
  assert.equal(result.positionCount, 261851);
  assert.equal(geometry.features.filter(feature => feature.quality.status === 'authoritative').length, 112);
  assert.equal(geometry.features.filter(feature => feature.quality.status === 'derived').length, 62);
  assert.ok(geometry.features.every(feature => ['Polygon', 'MultiPolygon'].includes(feature.geometry.type)));
  assert.ok(geometry.features.every(feature => feature.role === 'postal_area'));
});

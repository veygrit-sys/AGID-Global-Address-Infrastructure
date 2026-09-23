import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import type { PostalContextGeometryCollection } from './postalContextSpatial';
import { validatePostalContextGeometryTopology } from './postalContextTopology';
import { loadPostalContextPack } from '../server/postalContextPackStore';

const descriptorPath = resolve('data/postal_country_packs/li/postal-context/m2/descriptor.json');
const geometryPath = resolve('data/postal_country_packs/li/postal-context/m2/geometry.json');
const descriptorDigest = 'sha256:3860959238e86ad87a9377b0640f08d1c98cb788fd66ef08f41e5a5c858ec06b';

test('Liechtenstein M2 descriptor binds the complete current official runtime artifact', () => {
  const bytes = readFileSync(descriptorPath);
  const digest = `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
  assert.equal(digest, descriptorDigest);

  const loaded = loadPostalContextPack(descriptorPath, descriptorDigest, {
    expectedCountryCode: 'LI',
    allowExperimental: true,
  });
  assert.equal(loaded.descriptor.countryCode, 'LI');
  assert.equal(loaded.descriptor.releaseId, 'li-swisstopo-plzo-20260811');
  assert.equal(loaded.descriptor.synthetic, false);
  assert.equal(loaded.descriptor.containsResidentialAddressPoints, false);
  assert.deepEqual(loaded.warnings, []);
  assert.equal(loaded.runtime.status().counts.nodes, 14);
  assert.equal(loaded.runtime.status().counts.assertions, 13);
  assert.equal(loaded.runtime.status().counts.geometries, 13);
});

test('Liechtenstein M2 geometry passes the unchanged shared topology budget', () => {
  const geometry = JSON.parse(readFileSync(geometryPath, 'utf8')) as PostalContextGeometryCollection;
  const result = validatePostalContextGeometryTopology(geometry);

  assert.equal(geometry.countryCode, 'LI');
  assert.equal(geometry.features.length, 13);
  assert.equal(result.valid, true, result.errors.join('\n'));
  assert.deepEqual(result.errors, []);
  assert.equal(result.positionCount, 10598);
  assert.ok(geometry.features.every(feature => feature.geometry.type === 'Polygon'));
  assert.ok(geometry.features.every(feature => feature.quality.status === 'authoritative'));
  assert.ok(geometry.features.every(feature => feature.source.sourceType === 'official'));
  assert.ok(geometry.features.every(feature => feature.role === 'postal_area'));
});

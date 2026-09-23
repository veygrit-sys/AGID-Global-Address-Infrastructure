import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  LOW_BANDWIDTH_VECTOR_STYLE,
  getMapBandwidthProfile,
  normalizeMapBandwidthMode,
  resolveBandwidthSafeMapStyle,
  shouldLoadMapOverlayInBandwidthMode,
} from './mapBandwidthMode';

test('normalizes low bandwidth map mode aliases', () => {
  assert.equal(normalizeMapBandwidthMode('low'), 'low');
  assert.equal(normalizeMapBandwidthMode('low-bandwidth'), 'low');
  assert.equal(normalizeMapBandwidthMode(true), 'low');
  assert.equal(normalizeMapBandwidthMode('standard'), 'standard');
  assert.equal(normalizeMapBandwidthMode(undefined), 'standard');
});

test('low bandwidth profile reduces tile pressure and disables heavy overlays', () => {
  const profile = getMapBandwidthProfile('low');

  assert.equal(profile.lowBandwidth, true);
  assert.equal(profile.maxParallelImageRequests, 4);
  assert.equal(profile.maxTileCacheSize, 48);
  assert.equal(profile.refreshExpiredTiles, false);
  assert.deepEqual(profile.prioritySurfaces, ['agid-grid', 'address-candidates']);
  assert.equal(shouldLoadMapOverlayInBandwidthMode('satellite', 'low'), false);
  assert.equal(shouldLoadMapOverlayInBandwidthMode('terrain-dem', 'low'), false);
  assert.equal(shouldLoadMapOverlayInBandwidthMode('overpass-poi', 'low'), false);
});

test('standard bandwidth keeps normal map overlays available', () => {
  const profile = getMapBandwidthProfile('standard');

  assert.equal(profile.lowBandwidth, false);
  assert.equal(profile.maxParallelImageRequests, 16);
  assert.equal(profile.refreshExpiredTiles, true);
  assert.deepEqual(profile.prioritySurfaces, []);
  assert.equal(shouldLoadMapOverlayInBandwidthMode('satellite', 'standard'), true);
});

test('low bandwidth replaces satellite with a vector style', () => {
  assert.equal(resolveBandwidthSafeMapStyle('satellite', 'low'), LOW_BANDWIDTH_VECTOR_STYLE);
  assert.equal(resolveBandwidthSafeMapStyle('https://tiles.openfreemap.org/styles/liberty', 'low'), 'https://tiles.openfreemap.org/styles/liberty');
});

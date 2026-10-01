import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveInitialMapView } from './initialMapView';

test('URL coordinates take precedence over regional startup view', () => {
  const view = resolveInitialMapView({
    search: '?lat=51.5074&lng=-0.1278&zoom=15',
    width: 1280,
    timeZone: 'Asia/Tokyo',
    languages: ['ja-JP'],
    detailZoom: 19.5,
  });

  assert.equal(view.source, 'url');
  assert.equal(view.lat, 51.5074);
  assert.equal(view.lng, -0.1278);
  assert.equal(view.zoom, 15);
  assert.equal(view.shouldSelectInitialPoint, true);
});

test('Japan users start from a country overview instead of Tokyo Station', () => {
  const view = resolveInitialMapView({
    search: '',
    width: 1280,
    timeZone: 'Asia/Tokyo',
    languages: ['ja-JP'],
    detailZoom: 19.5,
  });

  assert.equal(view.source, 'regional');
  assert.equal(view.regionCode, 'JP');
  assert.notEqual(view.lat, 35.6812);
  assert.notEqual(view.lng, 139.7671);
  assert.ok(view.zoom < 6);
  assert.equal(view.shouldSelectInitialPoint, false);
});

test('zoom-only URLs do not force an address-level startup zoom', () => {
  const view = resolveInitialMapView({
    search: '?gridfix=1&zoom=18',
    width: 390,
    timeZone: 'UTC',
    languages: [],
    detailZoom: 20.2,
  });

  assert.equal(view.source, 'world');
  assert.ok(view.zoom < 3);
  assert.equal(view.shouldSelectInitialPoint, false);
});

test('locale region can choose an overview when timezone is not specific', () => {
  const view = resolveInitialMapView({
    search: '',
    width: 1024,
    timeZone: 'UTC',
    languages: ['en-US'],
    detailZoom: 19.5,
  });

  assert.equal(view.source, 'regional');
  assert.equal(view.regionCode, 'US');
});

test('unknown region opens a world overview without selecting Mali', () => {
  for (const width of [390, 800, 1280]) {
    const view = resolveInitialMapView({ search: '', width, timeZone: 'UTC', languages: [], detailZoom: 19.5 });
    assert.equal(view.source, 'world');
    assert.equal(view.lat, 0);
    assert.equal(view.lng, 0);
    assert.ok(view.zoom <= 1);
    assert.equal(view.shouldSelectInitialPoint, false);
  }
});

test('bare Japanese locale opens Japan even when timezone is UTC', () => {
  const view = resolveInitialMapView({ search: '', width: 1280, timeZone: 'UTC', languages: ['ja'], detailZoom: 19.5 });
  assert.equal(view.regionCode, 'JP');
  assert.equal(view.shouldSelectInitialPoint, false);
});

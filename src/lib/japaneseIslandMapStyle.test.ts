import assert from 'node:assert/strict';
import test from 'node:test';
import { featureFilter, type Feature, type ICanonicalTileID } from '@maplibre/maplibre-gl-style-spec';
import type { LayerSpecification } from 'maplibre-gl';
import { matchJapaneseIslandView, matchJapaneseRemoteIsland } from './japaneseIslandView';
import { islandMapLabels, japaneseIslandStyleFilter, viewportShowsJapanIslands } from './japaneseIslandMapStyle';

type XY = readonly [number, number];

function accepts(layer: LayerSpecification, coords: XY[], properties: Record<string, string>) {
  const mask = japaneseIslandStyleFilter(layer);
  assert.ok(mask);
  const zoom = 12, n = 2 ** zoom;
  const projected = coords.map(([lon, lat]) => {
    const sin = Math.sin(lat * Math.PI / 180);
    return [(lon + 180) / 360 * n, (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * n];
  });
  const x = Math.floor(projected[0][0]), y = Math.floor(projected[0][1]);
  const feature: Feature = {
    type: coords.length === 1 ? 1 : 2, properties,
    geometry: [projected.map(([u,v]) => ({ x: Math.round((u - x) * 8192), y: Math.round((v - y) * 8192) }))],
  };
  return featureFilter(mask).filter({zoom}, feature, { x, y, z: zoom } as ICanonicalTileID);
}

test('Japanese island labels are anchored on the correct official land polygons', () => {
  for (const { at: [lon, lat], subgroup } of islandMapLabels) {
    assert.equal(matchJapaneseIslandView(lat, lon)?.subgroup ?? matchJapaneseRemoteIsland(lat, lon)?.territory, subgroup);
    assert.equal(viewportShowsJapanIslands(lon - 0.01, lat - 0.01, lon + 0.01, lat + 0.01), true);
    assert.equal(viewportShowsJapanIslands(lon + 359.99, lat - 0.01, lon + 360.01, lat + 0.01), true);
  }
  assert.equal(matchJapaneseIslandView(25.8,124.2), undefined);
  assert.equal(viewportShowsJapanIslands(-3,49,0,51), false);
});

test('placement mask composes with the provider filter and keeps settlements and transport visible', () => {
  const label: LayerSpecification = { id: 'label_other', type: 'symbol', source: 'v', 'source-layer': 'place', filter: ['!=', 'class', 'suburb'] };
  const land: XY = [131.864725,37.242029];
  assert.equal(accepts(label, [land], { class: 'island' }), false);
  assert.equal(accepts(label, [land], { class: 'country' }), false);
  assert.equal(accepts(label, [land], { class: 'town' }), true);
  assert.equal(accepts(label, [[139,35]], { class: 'country' }), true);
  assert.equal(accepts(label, [[139,35]], { class: 'suburb' }), false);
  assert.equal(japaneseIslandStyleFilter({ id: 'road', type: 'line', source: 'v', 'source-layer': 'transportation' }), undefined);
});

test('a provider border crossing a review window is suppressed even if both endpoints are outside', () => {
  const border: LayerSpecification = { id: 'boundary_country', type: 'line', source: 'v', 'source-layer': 'boundary' };
  assert.equal(accepts(border, [[131.8,37.242],[131.92,37.242]], {}), false);
  assert.equal(accepts(border, [[130,38],[131,38]], {}), true);
  assert.equal(accepts(border, [[136.0691,20.425],[136.0698,20.425]], {}), true);
});

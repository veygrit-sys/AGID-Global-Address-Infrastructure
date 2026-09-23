import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildTopographicExploreMapGeoJson,
  canApplyTopographicExploreViewport,
  topographicExploreAreaKm2,
  topographicExploreBoundsFromViewport,
} from './topographicExploreMap';

test('local Explore Map renders a bounded selection grid without personal payloads', () => {
  const data = buildTopographicExploreMapGeoJson({
    south: 0,
    west: 0,
    north: 0.01,
    east: 0.01,
  });

  assert.equal(data.features.filter(feature => feature.properties.kind === 'selection').length, 1);
  assert.equal(data.features.filter(feature => feature.properties.kind === 'grid').length, 4);
  assert.equal(data.features.filter(feature => feature.properties.kind === 'focus').length, 1);
  assert.doesNotMatch(JSON.stringify(data), /address|recipient|aoid|credential|secret/i);
  assert.equal(canApplyTopographicExploreViewport({
    south: 0,
    west: 0,
    north: 0.01,
    east: 0.01,
  }, 50), true);
});

test('local Explore Map splits antimeridian selections and rejects unrepresentable viewports', () => {
  const data = buildTopographicExploreMapGeoJson({
    south: 10,
    west: 179.9,
    north: 10.01,
    east: -179.9,
  });
  const selections = data.features.filter(feature => feature.properties.kind === 'selection');
  assert.equal(selections.length, 2);
  for (const feature of data.features) {
    if (feature.geometry.type !== 'LineString') continue;
    const [first, second] = feature.geometry.coordinates as [number, number][];
    assert.ok(Math.abs(first[0] - second[0]) <= 180);
  }
  const normalizedViewport = topographicExploreBoundsFromViewport({
    south: 10,
    west: 179.9,
    north: 10.01,
    east: 180.1,
  });
  assert.ok(normalizedViewport);
  assert.equal(normalizedViewport.south, 10);
  assert.ok(Math.abs(normalizedViewport.west - 179.9) < 1e-9);
  assert.equal(normalizedViewport.north, 10.01);
  assert.ok(Math.abs(normalizedViewport.east + 179.9) < 1e-9);
  assert.equal(topographicExploreBoundsFromViewport({
    south: 86,
    west: 0,
    north: 87,
    east: 1,
  }), null);
  assert.ok(topographicExploreAreaKm2({
    south: 10,
    west: 179.9,
    north: 10.01,
    east: -179.9,
  })! > 0);
});

test('local Explore Map keeps over-limit viewports from changing the export selection', () => {
  const globalViewport = {
    south: -20,
    west: -20,
    north: 20,
    east: 20,
  };
  assert.equal(canApplyTopographicExploreViewport(globalViewport, 50), false);
});

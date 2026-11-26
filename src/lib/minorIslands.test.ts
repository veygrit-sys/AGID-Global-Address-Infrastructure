import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyMapPolygon, indexMapPolygon } from './indexedMapPolygon';
import { matchMinorIsland, queryMinorIslandPolygons } from './minorIslands';
import manifest from '../data/minorIslands/manifest.json';

test('tiny oceanic islands retain evidence for the territory and its sovereign when the shapes agree', () => {
  for (const [lat, lon, territory, sovereign] of [
    [-22.174371, 155.460849, 'AU', 'AU'],
    [-15.953139, -173.766749, 'TO', 'TO'],
    [-9.1821835, -171.837823, 'TK', 'NZ'],
    [22.3054875, 113.9311646, 'HK', 'CN'],
  ] as const) {
    const m = matchMinorIsland(lat, lon);
    assert.equal(m?.relation, 'inside');
    assert.deepEqual(m.codes, [territory]);
    assert.deepEqual(m.sovereignCodes, [sovereign]);
    assert.match(m.source, /fieldmaps/);
    assert.deepEqual(matchMinorIsland(lat, lon + 360)?.codes, [territory]);
    const candidates = queryMinorIslandPolygons([lon - 0.01, lat - 0.01, lon + 0.01, lat + 0.01]);
    assert.ok(candidates.some(p => p.featureId === m.featureId && p.codes.includes(territory)));
  }
});

test('small islands survive without an administrative match; water receives no island assignment', () => {
  const knownLand = matchMinorIsland(-56.509698, -68.712745);
  assert.ok(knownLand);
  assert.equal(knownLand.relation, 'inside');
  assert.deepEqual(knownLand.codes, []);
  assert.deepEqual(knownLand.sovereignCodes, []);
  assert.doesNotMatch(knownLand.source, /fieldmaps/);
  assert.equal(matchMinorIsland(-9.1821835, -171.82), undefined);
  assert.equal(matchMinorIsland(0, 0), undefined);
});

test('each physical source polygon is accessible through the spatial index', () => {
  const world = queryMinorIslandPolygons([-180, -90, 180, 90]);
  const ids = new Set(world.map(p => p.featureId));
  assert.equal(ids.size, manifest.minorPhysicalFeatures + manifest.additionalPhysicalFeatures);
  const seen = new Set<number>();
  for (const polygon of world) {
    if (seen.has(polygon.featureId)) continue;
    seen.add(polygon.featureId);
    const [lon, lat] = polygon.rings[0][0];
    assert.ok(queryMinorIslandPolygons([lon, lat, lon, lat]).some(p => p.featureId === polygon.featureId));
    assert.ok(matchMinorIsland(lat, lon), String(polygon.featureId));
  }
});

test('an unattributed part of a partially overlapped coastline never inherits the country of the island interior', () => {
  // Feature 2797 is the Galápagos detached outline present in the physical map
  // without a matching Natural Earth map unit. Independent FieldMaps overlap is partial.
  const shapes = queryMinorIslandPolygons([-89.98, 0.3, -89.93, 0.35]).filter(p => p.featureId === 2797);
  assert.ok(shapes.length > 1);
  const [shell, ...areas] = shapes;
  assert.deepEqual(shell.codes, []);
  assert.ok(areas.every(p => p.codes.includes('EC')));
  const indices = areas.map(indexMapPolygon);
  const exposed = shell.rings[0].find(([x, y]) => indices.every(i => classifyMapPolygon(x, y, i) === 'outside'));
  assert.ok(exposed);
  assert.deepEqual(matchMinorIsland(exposed[1], exposed[0])?.codes, []);
});

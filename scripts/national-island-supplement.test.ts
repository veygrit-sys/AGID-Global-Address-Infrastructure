import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assessPackPoint, packPointResult, type PackHit } from './national-island-supplement';

const canada = [69.2804165, -133.95786937131547] as const;
const japan = [32.7145415, 130.6160601592332] as const;
const hit: PackHit = {
  islandId: 'gshhg:8361', kind: 'ocean-island', codes: [], sovereignCodes: [], disputed: false,
  source: 'gshhg-full+fieldmaps-usgs-lsib', version: '2.3.7+2025-07-29', relation: 'inside',
};

test('whole-island proof fills only unclassified points on a single pinned physical feature', () => {
  const result = assessPackPoint(...canada, hit, false, true);
  assert.deepEqual(result?.countryCodes, ['CA']);
  assert.deepEqual(result?.sovereignCodes, ['CA']);
  assert.equal(result?.source, 'statcan-cbf-pr');
  assert.deepEqual(assessPackPoint(...japan, { ...hit, islandId: 'gshhg:87717' }, false, true)?.countryCodes, ['JP']);
  for (const delta of [
    { islandId: 'gshhg:8361,8362' }, { islandId: 'gshhg:1234567' }, { sovereignCodes: ['US'] },
    { source: 'different' }, { version: 'later' }, { kind: 'shoreline-island' }, { relation: 'boundary' },
    { disputed: true },
  ] satisfies Partial<PackHit>[]) {
    assert.deepEqual(assessPackPoint(...canada, { ...hit, ...delta }, false, true)?.countryCodes, []);
  }
  assert.deepEqual(assessPackPoint(...canada, hit, false, false)?.countryCodes, []);
  assert.deepEqual(assessPackPoint(...canada, null, true, true), undefined);
  assert.deepEqual(assessPackPoint(...canada, { ...hit, codes: ['US'] }, false, true)?.countryCodes, ['US']);
});

test('official supplements preserve reviewed shores, dispute controls, and positive bundled evidence', () => {
  const unknownReef = assessPackPoint(9.5, 113, hit, false, true);
  assert.deepEqual(unknownReef?.countryCodes, []);
  assert.equal(assessPackPoint(37.24, 131.86, hit, false, true), undefined);
  assert.deepEqual(assessPackPoint(25.7445, 123.4745, hit, false, true)?.countryCodes, ['JP']);
  assert.equal(assessPackPoint(-51.794, -58.61, hit, false, true)?.status, 'disputed');
  assert.equal(assessPackPoint(34.535208, 133.6979022899733, { ...hit, islandId: 'gshhg:22533' },
    false, true)?.source, 'natural-earth-global-island-map-units');
});

test('the precise physical ID controls sharing and water does not acquire adjacent territorial labels', () => {
  const bornean = { ...hit, islandId: 'gshhg:9', codes: ['BN'], sovereignCodes: ['BN'] };
  const result = packPointResult(4.56, 115.13, bornean, false, true);
  assert.deepEqual(result.territorialTopology?.sharedIslandCountryCodes, ['BN', 'ID', 'MY']);
  assert.equal(result.territorialTopology?.administration?.code, 'BN');
  assert.deepEqual(result.territorialTopology?.physicalSource, { source: 'gshhg-full', version: '2.3.7' });
  // A different small island in a generalized Borneo polygon cannot inherit its three neighbours.
  const satellite = packPointResult(4.56, 115.13, { ...bornean, islandId: 'gshhg:99999' }, false, true);
  assert.equal(satellite.territorialTopology?.sharedIslandCountryCodes, undefined);
  assert.equal(satellite.territorialTopology?.administration, undefined);
  const conflict = packPointResult(4.56, 115.13, { ...bornean, codes: ['MY'] }, false, true);
  assert.equal(conflict.territorialTopology?.administration, undefined);
  assert.equal(packPointResult(4.56, 115.13, bornean, false, false).territorialTopology?.sharedIslandCountryCodes, undefined);
  assert.equal(packPointResult(-51.794, -58.61, null, true, true).territorialTopology, null);
  assert.equal(packPointResult(-51.794, -58.61, null, true, true).island, null);
  assert.deepEqual(packPointResult(25.7445, 123.4745, null, true, true).island?.countryCodes, ['JP']);
});

test('reviewed Great Lakes islands and water agree across local pack and bundled evidence', () => {
  // The published GSHHG pack reports lake water at both Middle Island and this
  // nearby open-water control. The reviewed island shoreline separates them.
  const middle = packPointResult(41.6828, -82.683149, null, true, true);
  assert.deepEqual(middle.island?.countryCodes, ['CA']);
  assert.equal(middle.territorialTopology?.landform, 'island');
  assert.equal(middle.physicalIslandId, undefined);
  const water = packPointResult(41.665, -82.683149, { ...hit, codes: ['US'] }, false, true);
  assert.equal(water.island, null);
  assert.equal(water.territorialTopology, null);
  assert.equal(water.physicalIslandId, undefined);

  // The full pack has no physical ID for Boldt Castle on Heart Island.
  const heart = packPointResult(44.344525, -75.922575, null, false, true);
  assert.deepEqual(heart.island?.countryCodes, ['US']);
  assert.equal(heart.territorialTopology?.landform, 'island');
  const mainland = packPointResult(48.984, -123.075, { ...hit, codes: ['US'] }, false, true);
  assert.equal(mainland.island, null);
  assert.equal(mainland.physicalIslandId, undefined);
  assert.equal(mainland.territorialTopology?.landform, 'mainland');

  const pelee = [41.77827, -82.656032] as const;
  const physical = { ...hit, islandId: 'gshhg:187373', kind: 'lake-island' as const };
  const confirmed = packPointResult(...pelee, physical, false, true);
  assert.deepEqual(confirmed.island?.countryCodes, ['CA']);
  assert.equal(confirmed.physicalIslandId, physical.islandId);
  for (const conflicting of [{ codes: ['US'] }, { disputed: true }, { relation: 'boundary' }] satisfies Partial<PackHit>[]) {
    const result = packPointResult(...pelee, { ...physical, ...conflicting }, false, true);
    assert.equal(result.island?.status, 'unresolved');
    assert.deepEqual(result.island?.countryCodes, []);
  }
});

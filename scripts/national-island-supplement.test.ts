import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assessPackPoint, type PackHit } from './national-island-supplement';

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

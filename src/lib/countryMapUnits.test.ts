import assert from 'node:assert/strict';
import { test } from 'node:test';

import samples from '../testFixtures/southernAfricaCountryMapUnits.json';
import { decodeAGID, encodeAGID, encodeAGID16, getRegionInfo } from './agid';
import { matchCountryMapUnits } from './countryMapUnits';

test('classifies the southern Africa country, enclave, coast and island fixtures through both writers', () => {
  for (const point of samples) {
    const region = getRegionInfo(point.lat, point.lon);
    assert.equal(region.isSea ? 'sea' : region.prefix, point.expected, point.name);
    const covered = ['ZA', 'LS', 'SZ'].includes(point.expected);
    assert.equal('mapUnitMatch' in region, covered, point.name);
    for (const encode of [encodeAGID, encodeAGID16]) {
      const encoded = encode(point.lat, point.lon);
      assert.equal(encoded.isSea ? 'sea' : encoded.regionCode, point.expected, point.name);
      assert.equal('mapUnitMatch' in encoded, covered, point.name);
      assert.deepEqual(encoded.mapUnitMatch, region.mapUnitMatch, point.name);
      assert.equal(decodeAGID(encoded.id)?.qx, encoded.qx, point.name);
    }
  }
});

test('preserves shared edge and vertex evidence and issues a stable prefix', () => {
  // Vertex and midpoint of the first LS segment in the pinned source.
  for (const [lat, lon] of [[-28.909035, 28.980846], [-28.9086735, 28.988132]]) {
    const evidence = {
      source: 'natural-earth-10m-admin-0-map-units', version: 'natural-earth-vector v5.1.2',
      relation: 'boundary', codes: ['LS', 'ZA'],
    };
    assert.deepEqual(matchCountryMapUnits(lat, lon), evidence);
    for (const encode of [encodeAGID, encodeAGID16]) {
      const encoded = encode(lat, lon);
      assert.equal(encoded.prefix, 'LS');
      assert.deepEqual(encoded.mapUnitMatch, evidence);
    }
  }
});

test('adjacent points on opposite sides of a shared edge cannot inherit a cached region', () => {
  const lat = -28.9086735, lon = 28.988132;
  for (let i = 0; i < 3; i++) {
    assert.equal(getRegionInfo(lat + 2e-10, lon).prefix, 'ZA');
    assert.equal(getRegionInfo(lat - 2e-10, lon).prefix, 'LS');
  }
});

test('callers cannot modify later region lookups by editing a previous result', () => {
  const lat = -28.909035, lon = 28.980846;
  const edge = getRegionInfo(lat, lon);
  edge.prefix = 'XX';
  edge.mapUnitMatch!.codes.pop();
  const fresh = getRegionInfo(lat, lon);
  assert.equal(fresh.prefix, 'LS');
  assert.deepEqual(fresh.mapUnitMatch?.codes, ['LS', 'ZA']);

  const ocean = getRegionInfo(-45, -120);
  const original = structuredClone(ocean);
  if (ocean.polygon) ocean.polygon[0][0] = NaN;
  ocean.name = 'changed';
  assert.deepEqual(getRegionInfo(-45, -120), original);
});

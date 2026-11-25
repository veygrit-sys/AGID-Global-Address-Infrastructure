import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mayHaveReviewedGeography } from './reviewedGeographyCoverage';
import { encodeAGID, encodeAGID16, getRegionInfo } from './agid';
import { hasCountryMapUnit, hasReviewedCoastalCoverage, matchCountryMapUnits, matchReviewedCoastalWater } from './countryMapUnits';

const mapUnits = 'natural-earth-10m-admin-0-map-units';
const ocean = 'natural-earth-10m-ocean';
const version = 'natural-earth-vector v5.1.2';

test('Taveuni is continuous through the cartographic cut but actual shoreline edges remain boundaries', () => {
  for (const lon of [179.98, 179.999999, 180, -180, -179.999999, -179.98]) {
    assert.deepEqual(matchCountryMapUnits(-16.85, lon), { source: mapUnits, version, relation: 'inside', codes: ['FJ'] });
    assert.equal(matchReviewedCoastalWater(-16.85, lon), undefined);
    const location = getRegionInfo(-16.85, lon);
    assert.equal(location.prefix, 'FJ');
    assert.equal(location.isSea, false);
  }
  for (const lon of [180, -180]) {
    assert.equal(matchCountryMapUnits(-16.785349, lon)?.relation, 'boundary');
    assert.equal(matchReviewedCoastalWater(-16.785349, lon), undefined);
    assert.deepEqual(matchReviewedCoastalWater(-16.6, lon), { source: ocean, version });
  }
});

test('coastal windows preserve dry land and nearby named waters through both issuers', () => {
  const samples = [
    { name: 'Tokyo waterfront city land', lat: 35.454, lon: 139.635, code: 'JP' },
    { name: 'Tokyo Bay water', lat: 35.35, lon: 139.76 },
    { name: 'Seto Inland Sea island land', lat: 34.234, lon: 133.035, code: 'JP' },
    { name: 'Seto Inland Sea water', lat: 34.2, lon: 133.5 },
    { name: 'Chichijima', lat: 27.076, lon: 142.213, code: 'JP' },
    { name: 'Water west of Chichijima', lat: 27, lon: 141.98 },
    { name: 'Hahajima', lat: 26.65, lon: 142.164, code: 'JP' },
    { name: 'Suva', lat: -18.1248, lon: 178.4501, code: 'FJ' },
    { name: 'Water east of Taveuni', lat: -16.85, lon: -179.70 },
  ];
  for (const { name, lat, lon, code } of samples) {
    for (const issue of [encodeAGID, encodeAGID16]) {
      const record = issue(lat, lon);
      assert.equal(record.isSea, !code, name);
      if (code) {
        assert.equal(record.prefix, code, name);
        assert.equal(record.mapUnitMatch?.source, mapUnits, name);
        assert.equal(record.waterMatch, undefined, name);
      } else {
        assert.deepEqual(record.waterMatch, { source: ocean, version }, name);
        assert.equal(record.mapUnitMatch, undefined, name);
      }
    }
  }
});

test('partial Japanese coverage neither suppresses the complete legacy region nor extrapolates water', () => {
  assert.equal(hasCountryMapUnit('JP'), false);
  assert.equal(hasCountryMapUnit('FJ'), true);
  assert.equal(hasReviewedCoastalCoverage('JP', 35.35, 139.76), true);
  assert.equal(hasReviewedCoastalCoverage('JP', 43.06, 141.35), false);
  assert.equal(matchCountryMapUnits(43.06, 141.35), undefined);
  assert.equal(matchReviewedCoastalWater(43.06, 141.35), undefined);
  assert.equal(getRegionInfo(43.06, 141.35).prefix, 'JP');
  assert.equal(matchReviewedCoastalWater(-16.85, 0), undefined);
});

test('coarse geography index retains overseas islands, both antimeridian sides and scoped overlays', () => {
  for (const [lat, lon] of [
    [-46.9, 37.75], [-16.85, -180], [-16.85, 179.99999999999997],
    [35.35, 139.76], [27, 141.98], [47.7, 8.68333], [22.533333, 114], [22.215834, 113.548975],
  ]) assert.equal(mayHaveReviewedGeography(lat, lon), true, `${lat},${lon}`);
  for (const [lat, lon] of [[48.85, 2.35], [0, 0], [0, 179.99999999999997]]) {
    assert.equal(mayHaveReviewedGeography(lat, lon), false, `${lat},${lon}`);
  }
});

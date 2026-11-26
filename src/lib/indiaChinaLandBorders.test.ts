import assert from 'node:assert/strict';
import test from 'node:test';
import pins from '../testFixtures/indiaChinaLandBorderPins.json';
import { decodeAGID, encodeAGID, encodeAGID16, getAGIDCellKey } from './agid';
import { assessAgidGeography } from './geographicAssessment';

// Input longitude/latitude pairs are independent FieldMaps source points.
// Edge pins are midpoints on the source segment after rounding its endpoints
// to the extract's 1e-7° precision. Each side pin is inside its own polygon.
const pin = (lat: number, lon: number, accuracyMeters = 0) =>
  assessAgidGeography({ kind: 'pin', lat, lon, accuracyMeters });

test('the two sides, shared edge and accuracy disk are distinguished at 18 surveyed crossings', () => {
  for (const { name, sides, edge } of pins.crossings) {
    const entries = Object.entries(sides) as [string, number[]][];
    const countries = entries.map(([code]) => code).sort();
    for (const [code, [lon, lat]] of entries) {
      const result = pin(lat, lon);
      assert.equal(result.status, 'mapped', name);
      assert.deepEqual(result.regionCandidates, [code], name);
      assert.equal(result.landBorder?.source, 'fieldmaps-usgs-lsib', name);
      assert.equal(result.deliveryRegion, null, name);
      for (const issue of [encodeAGID, encodeAGID16]) {
        assert.equal(issue(lat, lon).regionCode, code, name);
      }
    }
    const [lon, lat] = edge;
    const boundary = pin(lat, lon);
    assert.deepEqual(boundary.regionCandidates, countries, name);
    assert.equal(boundary.landBorder?.relation, 'boundary', name);
    assert.equal(boundary.status, 'needs-confirmation', name);
    assert.equal(encodeAGID16(lat, lon).regionCode, 'BORDER_UNRESOLVED', name);
    // Start inside just one country, then expand the measurement across the border.
    const [x, y] = entries[0][1];
    const device = assessAgidGeography({ kind: 'pin', method: 'device', lat: y, lon: x, accuracyMeters: 350 });
    assert.deepEqual(device.regionCandidates, countries, name);
    assert.equal(device.status, 'needs-confirmation', name);
    assert.equal(device.deliveryRegion, null, name);
  }
});

test('14 disputed polygons retain their own parties even far from a shared edge', () => {
  for (const { name, lat, lon, codes } of pins.disputes) {
    const result = pin(lat, lon);
    assert.deepEqual(result.landBorder?.disputedAreas, [name], name);
    assert.deepEqual(result.regionCandidates, codes, name);
    assert.equal(result.landBorder?.relation, 'inside', name);
    assert.equal(result.status, 'needs-confirmation', name);
    assert.ok(result.landBorder.evidenceUrls?.length, name);
    assert.equal(encodeAGID(lat, lon).regionCode, 'BORDER_UNRESOLVED', name);
    assert.equal(result.deliveryRegion, null, name);
  }
});

test('three parties meet only on the shared edge or within a disk that reaches both dispute polygons', () => {
  const lon = 78.4933785;
  const lat = 34.5625685;
  const north = pin(lat + 0.0001, lon);
  const south = pin(lat - 0.0001, lon);
  assert.deepEqual(north.regionCandidates, ['CN', 'IN']);
  assert.deepEqual(south.regionCandidates, ['IN', 'PK']);
  for (const both of [pin(lat, lon), pin(lat + 0.0001, lon, 25)]) {
    assert.deepEqual(both.regionCandidates, ['CN', 'IN', 'PK']);
    assert.deepEqual(both.landBorder?.disputedAreas, ['Aksai Chin', 'Jammu and Kashmir']);
    assert.equal(both.status, 'needs-confirmation');
    assert.equal(both.deliveryRegion, null);
  }
  assert.equal(pin(35.798463, 80.150244).landBorder?.disputedAreas, undefined);
});

test('a nearby ordinary country stays outside the parties listed for an individual dispute', () => {
  const footprint = pin(30.219811, 80.947225, 10000);
  assert.deepEqual(footprint.regionCandidates, ['CN', 'IN', 'NP']);
  assert.deepEqual(footprint.landBorder?.disputeCodes, ['IN', 'NP']);
  assert.deepEqual(footprint.landBorder?.disputedAreas, ['Near Om Parvat']);
  assert.equal(footprint.status, 'needs-confirmation');

  const original = encodeAGID(30.219811, 80.947225);
  original.landBorder?.disputeCodes?.pop();
  assert.deepEqual(encodeAGID16(30.219811, 80.947225).landBorder?.disputeCodes, ['IN', 'NP']);
});

test('source-review areas withhold ordinary country codes and delivery defaults', () => {
  const locations = [
    ['Tin Bigha corridor vicinity', 26.30028, 88.94528],
    ['Sakteng Wildlife Sanctuary vicinity', 27.306, 91.95],
    ['Sir Creek mouth vicinity', 23.64, 68.1],
    ['Susta village and adjacent river', 27.357, 83.875],
    ['Limpiyadhura to Lipulekh and Kalapani vicinity', 30.38, 80.67],
  ] as const;
  for (const [name, lat, lon] of locations) {
    const result = pin(lat, lon);
    assert.deepEqual(result.regionCandidates, [], name);
    assert.deepEqual(result.landBorder?.reviewAreas, [name], name);
    assert.equal(result.landBorder?.disputedAreas, undefined, name);
    assert.equal(result.status, 'needs-confirmation', name);
    assert.equal(result.deliveryRegion, null, name);
    assert.equal(encodeAGID16(lat, lon).regionCode, 'BORDER_UNRESOLVED', name);
  }
});

test('source-window outlines retain the finer source without creating a national border', () => {
  const crossing = pin(31.664, 74.525);
  assert.deepEqual(crossing.regionCandidates, ['PK']);
  assert.equal(crossing.landBorder?.source, 'fieldmaps-usgs-lsib');
  assert.equal(crossing.landBorder?.relation, 'inside');
  assert.equal(crossing.status, 'mapped');

  const review = pin(26.29618, 88.941);
  assert.deepEqual(review.regionCandidates, []);
  assert.deepEqual(review.landBorder?.reviewAreas, ['Tin Bigha corridor vicinity']);
  assert.equal(review.landBorder?.source, 'agid-border-source-review');
  assert.equal(review.status, 'needs-confirmation');
});

test('source edge midpoints remain shared after clipping at a neighbouring higher-tier survey', () => {
  for (const [lat, lon, codes] of [
    [30.1567135, 80.8430545, ['IN', 'NP']], [37.056757, 74.4999275, ['AF', 'CN']],
  ] as const) {
    const point = pin(lat, lon);
    assert.deepEqual(point.regionCandidates, codes);
    assert.equal(point.landBorder?.relation, 'boundary');
    assert.equal(point.status, 'needs-confirmation');
  }
});

test('survey limits add only the covered side to an otherwise unassessed footprint', () => {
  assert.equal(pin(31.8, 73.998).landBorder, undefined);
  assert.deepEqual(pin(31.8, 73.998).regionCandidates, []);
  for (const result of [pin(31.8, 74), pin(31.8, 73.998, 500), pin(31.8, 74.002, 500)]) {
    assert.equal(result.landBorder?.partialCoverage, true);
    assert.equal(result.landBorder.relation, 'inside');
    assert.deepEqual(result.regionCandidates, ['PK']);
    assert.equal(result.status, 'needs-confirmation');
  }
  assert.equal(pin(31.8, 74.2, 500).status, 'mapped');
});

test('old 12- and 16-character IDs retain the cell when a border prefix is corrected', () => {
  const lat = 31.6049325, lon = 74.57333;
  for (const oldId of ['AF09HCMT223N', 'AF09HCMT223N1TF4']) {
    assert.equal(decodeAGID(oldId)?.prefix, 'AF');
    assert.ok(getAGIDCellKey(oldId));
    assert.equal(getAGIDCellKey(oldId), getAGIDCellKey(encodeAGID16(lat, lon).id));
    assert.deepEqual(assessAgidGeography({ kind: 'cell', id: oldId }).regionCandidates, ['IN']);
  }
});

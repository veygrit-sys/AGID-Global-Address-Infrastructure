import assert from 'node:assert/strict';
import test from 'node:test';
import { encodeAGID16 } from './agid';
import { assessAgidGeography as assess } from './geographicAssessment';

const lat = -28.9086735, lon = 28.988132;

test('an exact pin on each side of one border cell uses the original coordinates', () => {
  const a = { kind: 'pin' as const, lat: lat - 0.000001, lon };
  const b = { ...a, lat: lat + 0.000001 };
  assert.deepEqual(assess(a).regionCandidates, ['LS']);
  assert.deepEqual(assess(b).regionCandidates, ['ZA']);
  assert.equal(assess(a).status, 'mapped');
  assert.equal(assess(a).surface, 'land');
  for (const point of [a, b]) {
    const byId = assess({kind: 'cell', id: encodeAGID16(point.lat, point.lon).id});
    assert.deepEqual(byId.regionCandidates, ['LS', 'ZA']);
    assert.equal(byId.status, 'needs-confirmation');
    assert.equal(byId.surface, 'land');
    assert.equal(byId.footprint.kind, 'cell');
    assert.ok(byId.footprint.radiusMeters! > 0);
    assert.equal(byId.deliveryRegion, null);
  }
});

test('device accuracy and map allowance widen the mapped border independently', () => {
  const pin = { kind: 'pin' as const, lat: lat + 0.00003, lon, method: 'device' as const };
  assert.equal(assess(pin).status, 'needs-confirmation');
  assert.equal(assess(pin).footprint.radiusMeters, null);
  const tight = assess({ ...pin, accuracyMeters: 0.5 });
  assert.deepEqual(tight.regionCandidates, ['ZA']);
  assert.equal(tight.status, 'mapped');
  const loose = assess({ ...pin, accuracyMeters: 10 });
  assert.deepEqual(loose.regionCandidates, ['LS', 'ZA']);
  assert.equal(loose.status, 'needs-confirmation');
  const mapError = assess({ ...pin, accuracyMeters: 0.5 }, { boundaryAllowanceMeters: 10 });
  assert.deepEqual(mapError.regionCandidates, loose.regionCandidates);
  assert.equal(mapError.footprint.radiusMeters, 0.5);
  assert.equal(mapError.boundaryAllowanceMeters, 10);
});

test('an uncovered pin does not inherit a region from a coarse prefix or claim open water', () => {
  const result = assess({kind: 'pin', lat: 48.85, lon: 2.35, accuracyMeters: 20});
  assert.equal(result.status, 'unassessed');
  assert.equal(result.surface, 'unknown');
  assert.deepEqual(result.regionCandidates, []);
  assert.deepEqual(result.sources, []);
  assert.equal(result.deliveryRegion, null);
});

test('Fiji interior across the cartographic seam and positive offshore water remain distinguishable', () => {
  for (const lng of [180, -180]) {
    const pin = assess({kind:'pin', lat:-16.85, lon:lng, accuracyMeters:30});
    assert.deepEqual(pin.regionCandidates, ['FJ']);
    assert.equal(pin.surface, 'land');
    assert.equal(pin.status, 'mapped');
  }
  const water = assess({kind:'pin', lat:-16.85, lon:-179.7, accuracyMeters:30});
  assert.equal(water.surface, 'water');
  assert.equal(water.status, 'mapped');
  assert.deepEqual(water.regionCandidates, []);
});

test('an administrative shape can establish DE in Büsingen without claiming land or the postal route', () => {
  const admin = assess({kind:'pin', lat:47.7, lon:8.68333, accuracyMeters:10});
  assert.deepEqual(admin.regionCandidates, ['DE']);
  assert.equal(admin.surface, 'unknown');
  assert.equal(admin.status, 'mapped');
  assert.equal(admin.deliveryRegion, null);
  assert.ok(admin.sources.some(s => s.attribution?.includes('swisstopo')));
});

test('invalid coordinates, reported accuracy and malformed IDs are rejected', () => {
  for (const accuracyMeters of [NaN, Infinity, -1]) {
    assert.throws(() => assess({kind:'pin',lat,lon,accuracyMeters}), RangeError);
  }
  assert.throws(() => assess({kind:'pin',lat:110,lon}), RangeError);
  assert.throws(() => assess({kind:'cell',id:'bad'}), RangeError);
  assert.throws(() => assess({kind:'pin',lat,lon}, {boundaryAllowanceMeters:-1}), RangeError);
});

test('an explicit Japanese shoreline separates a surface boundary from a shared national border', () => {
  for (const accuracyMeters of [0, 30]) {
    const r = assess({kind:'pin', lat:35.1706, lon:139.822113, accuracyMeters});
    assert.equal(r.surface, 'boundary');
    assert.equal(r.status, 'needs-confirmation');
    assert.deepEqual(r.regionCandidates, ['JP']);
    assert.equal(r.sources.length, 2);
    assert.equal(r.deliveryRegion, null);
  }
});

test('a window-edge footprint retains provenance even with its centre outside reviewed bounds', () => {
  const edge = assess({kind:'pin', lat:35.09999, lon:139.76, accuracyMeters:10});
  assert.equal(edge.status, 'needs-confirmation');
  assert.equal(edge.surface, 'unknown');
  assert.ok(edge.sources.some(s => s.source === 'natural-earth-10m-ocean'));
});

test('the far side of an exposed land edge needs independent evidence', () => {
  const r = assess({kind:'pin', lat:-26.582252, lon:32.117398, accuracyMeters:10});
  assert.equal(r.status, 'needs-confirmation');
  assert.equal(r.surface, 'unknown');
  assert.deepEqual(r.regionCandidates, ['SZ']);
});

test('Hong Kong and Shenzhen share a sourced land edge and keep both candidates within device accuracy', () => {
  const lat = 22.5170484, lon = 114.0655888;
  assert.deepEqual(assess({kind:'pin', lat:lat + 0.00005, lon, accuracyMeters:0.1}).regionCandidates, ['CN']);
  assert.deepEqual(assess({kind:'pin', lat:lat - 0.00005, lon, accuracyMeters:0.1}).regionCandidates, ['HK']);
  for (const entry of [{lat, accuracyMeters:0}, {lat:lat + 0.00005, accuracyMeters:8}]) {
    const r = assess({kind:'pin', lon, ...entry});
    assert.equal(r.status, 'needs-confirmation');
    assert.equal(r.surface, 'land');
    assert.deepEqual(r.regionCandidates, ['CN','HK']);
    assert.equal(r.deliveryRegion, null);
  }
  const gap = assess({kind:'pin', lat:22.1581, lon:114.2541, accuracyMeters:1});
  assert.equal(gap.surface, 'unknown');
  assert.equal(gap.status, 'unassessed');
});

test('Swiss administrative border has multiple candidates while surface remains unknown', () => {
  const r = assess({kind:'pin', lat:47.69133884, lon:8.658607827, accuracyMeters:8});
  assert.equal(r.surface, 'unknown');
  assert.equal(r.status, 'needs-confirmation');
  assert.deepEqual(r.regionCandidates, ['CH','DE']);
  assert.ok(r.sources.some(s => s.attribution?.includes('swisstopo')));
});

test('a partial Macao window retains observed regions while a disk outside the Tokyo window stays unassessed', () => {
  const delta = assess({kind:'pin', lat:22.08, lon:113.47, accuracyMeters:30_000});
  assert.equal(delta.status, 'needs-confirmation');
  assert.equal(delta.surface, 'unknown');
  assert.deepEqual(delta.regionCandidates, ['CN', 'MO']);
  // The disk's bounding rectangle intersects the Tokyo window, but its circular footprint does not.
  const miss = assess({kind:'pin', lat:35.09994, lon:139.44994, accuracyMeters:7});
  assert.equal(miss.status, 'unassessed');
});

test('finite accuracy and allowance can exceed a hemisphere without overflowing the globe assessment', () => {
  const r = assess({kind:'pin', lat:0, lon:0, accuracyMeters:Number.MAX_VALUE}, {boundaryAllowanceMeters:Number.MAX_VALUE});
  assert.equal(r.status, 'needs-confirmation');
  assert.equal(r.surface, 'unknown');
  assert.ok(['CH','CN','DE','FJ','HK','JP','LS','MO','SZ','ZA'].every(code => r.regionCandidates.includes(code)));
});

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
  const result = assess({kind: 'pin', lat: -23.55, lon: -46.63, accuracyMeters: 20});
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

test('independent evidence identifies dry mainland and German administration in Büsingen', () => {
  const admin = assess({kind:'pin', lat:47.7, lon:8.68333, accuracyMeters:10});
  assert.deepEqual(admin.regionCandidates, ['DE']);
  assert.equal(admin.surface, 'land');
  assert.equal(admin.territorialTopology?.landform, 'mainland');
  assert.equal(admin.territorialTopology?.administration?.kind, 'enclave');
  assert.equal(admin.status, 'mapped');
  assert.equal(admin.deliveryRegion, null);
  assert.ok(admin.sources.some(s => s.attribution?.includes('swisstopo')));
  assert.ok(admin.sources.some(s => s.attribution?.includes('ESA WorldCover')));
});

test('German administration over the Rhine does not establish a terrestrial surface or postal route', () => {
  const river = assess({kind:'pin', lat:47.6905, lon:8.682, accuracyMeters:3});
  assert.deepEqual(river.regionCandidates, ['DE']);
  assert.equal(river.surface, 'unknown');
  assert.equal(river.territorialTopology?.landform, 'unknown');
  assert.equal(river.territorialTopology?.administration?.id, 'buesingen');
  assert.equal(river.island, undefined);
  assert.equal(river.deliveryRegion, null);
  assert.deepEqual(river.sources.map(s => s.source), ['swisstopo-swissboundaries3d-buesingen']);
});

test('Lake Toba and Lake Taupō require water throughout a pin, device footprint or cell', () => {
  for (const [lat, lon] of [[2.425,98.975], [-38.82,175.93]]) {
    const pin = {kind:'pin' as const, lat, lon};
    const cell = {kind:'cell' as const, id:encodeAGID16(lat, lon).id};
    for (const input of [pin, {...pin, accuracyMeters:30}, cell]) {
      const lake = assess(input);
      assert.equal(lake.surface, 'water');
      assert.equal(lake.status, 'mapped');
      assert.deepEqual(lake.regionCandidates, []);
      assert.equal(lake.territorialTopology, undefined);
      assert.equal(lake.island, undefined);
      assert.equal(lake.deliveryRegion, null);
      assert.ok(lake.sources.some(source => source.source === 'gshhg-inland-water'));
    }
    for (const wide of [
      assess({...pin, accuracyMeters:20_000}), assess({...pin, accuracyMeters:30}, {boundaryAllowanceMeters:20_000}),
      assess({...pin, method:'device'}),
    ]) {
      assert.equal(wide.surface, 'unknown');
      assert.equal(wide.status, 'needs-confirmation');
      assert.equal(wide.deliveryRegion, null);
    }
  }
  const bank = {kind:'pin' as const, lat:-38.686, lon:176.076};
  assert.equal(assess(bank).surface, 'land');
  const shore = assess({...bank, accuracyMeters:20_000});
  assert.equal(shore.status, 'needs-confirmation');
  assert.equal(shore.surface, 'unknown');
  assert.equal(shore.island?.status, 'unresolved');
});

test('a reviewed lake island and an official Japanese island retain their own shorelines', () => {
  const pin = {kind:'pin' as const, lat:-12.065, lon:34.731};
  const island = assess({...pin, accuracyMeters:30});
  assert.equal(island.surface, 'land');
  assert.equal(island.territorialTopology?.landform, 'island');
  assert.equal(island.territorialTopology?.administration?.id, 'likoma');
  assert.deepEqual(island.island?.countryCodes, ['MW']);
  const lakeShore = assess({...pin, accuracyMeters:20_000});
  assert.equal(lakeShore.surface, 'unknown');
  assert.equal(lakeShore.island?.status, 'unresolved');
  assert.equal(lakeShore.territorialTopology?.status, 'uncertain');
  const takeshima = assess({kind:'pin', lat:37.24002, lon:131.87016, accuracyMeters:1});
  assert.deepEqual(takeshima.regionCandidates, ['JP']);
  assert.deepEqual(takeshima.island?.countryCodes, ['JP']);
  assert.equal(takeshima.island?.status, 'japan-position');
  assert.equal(takeshima.surface, 'land');
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
    for (const source of ['natural-earth-10m-ocean','natural-earth-10m-admin-0-map-units']) {
      assert.ok(r.sources.some(s => s.source === source));
    }
    assert.equal(r.deliveryRegion, null);
  }
});

test('a window-edge footprint retains provenance even with its centre outside reviewed bounds', () => {
  const edge = assess({kind:'pin', lat:35.09999, lon:139.76, accuracyMeters:10});
  assert.equal(edge.status, 'needs-confirmation');
  assert.equal(edge.surface, 'unknown');
  assert.ok(edge.sources.some(s => s.source === 'natural-earth-10m-ocean'));
});

test('physical mainland evidence covers both sides of a partially mapped Eswatini border', () => {
  const r = assess({kind:'pin', lat:-26.582252, lon:32.117398, accuracyMeters:10});
  assert.equal(r.status, 'needs-confirmation');
  assert.equal(r.surface, 'land');
  assert.deepEqual(r.regionCandidates, ['SZ']);
  assert.ok(r.sources.some(s => s.source === 'natural-earth-physical-land+hydrography'));
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

test('Swiss administrative border keeps both candidates on independently surveyed dry land', () => {
  const r = assess({kind:'pin', lat:47.69133884, lon:8.658607827, accuracyMeters:8});
  assert.equal(r.surface, 'land');
  assert.equal(r.status, 'needs-confirmation');
  assert.deepEqual(r.regionCandidates, ['CH','DE']);
  assert.ok(r.sources.some(s => s.attribution?.includes('swisstopo')));
  assert.ok(r.sources.some(s => s.attribution?.includes('ESA WorldCover')));
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

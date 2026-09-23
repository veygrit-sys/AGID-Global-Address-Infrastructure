import assert from 'node:assert/strict';
import { describe,it } from 'node:test';

import { decodeAGID,encodeAGID,getRegionInfo } from './agid';

const EARTH_RADIUS_METERS = 6371008.8;
const MAX_CELL_ROUNDTRIP_METERS = 8;
const MAX_COMPACT_LON_SPAN_DEGREES = 0.001;

function haversineMeters(aLat: number, aLon: number, bLat: number, bLon: number) {
  const toRad = Math.PI / 180;
  const dLat = (bLat - aLat) * toRad;
  const dLon = (bLon - aLon) * toRad;
  const lat1 = aLat * toRad;
  const lat2 = bLat * toRad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

function assertFiniteNumber(value: number, label: string) {
  assert.ok(Number.isFinite(value), `${label} should be finite`);
}

function assertFiniteCellGeometry(agid: ReturnType<typeof encodeAGID>, label: string) {
  for (const key of ['minLat', 'maxLat', 'minLon', 'maxLon'] as const) {
    assertFiniteNumber(agid.bounds[key], `${label} bounds.${key}`);
  }
  assert.ok(agid.bounds.minLat <= agid.bounds.maxLat, `${label} latitude bounds should be ordered`);
  assert.ok(agid.bounds.minLon <= agid.bounds.maxLon, `${label} longitude bounds should be ordered`);
  assert.equal(agid.polygon.length, 5, `${label} cell polygon should be closed`);
  assert.deepEqual(agid.polygon[0], agid.polygon[agid.polygon.length - 1], `${label} polygon should close`);

  for (const [index, point] of agid.polygon.entries()) {
    assertFiniteNumber(point[0], `${label} polygon[${index}].lon`);
    assertFiniteNumber(point[1], `${label} polygon[${index}].lat`);
  }
}

function assertRoundTripsToSameCell(lat: number, lon: number, label: string, allowWideLonBounds = false) {
  const agid = encodeAGID(lat, lon);
  const decoded = decodeAGID(agid.id);

  assert.ok(decoded, `${label} should decode`);
  assert.equal(decoded.face, agid.face, `${label} face should round-trip`);
  assert.equal(decoded.qx, agid.qx, `${label} qx should round-trip`);
  assert.equal(decoded.qy, agid.qy, `${label} qy should round-trip`);
  assertFiniteCellGeometry(agid, label);

  const meters = haversineMeters(lat, lon, decoded.lat, decoded.lon);
  assert.ok(
    meters <= MAX_CELL_ROUNDTRIP_METERS,
    `${label} decoded corner should stay within one AGID cell, got ${meters.toFixed(3)}m`,
  );

  const lonSpan = agid.bounds.maxLon - agid.bounds.minLon;
  if (!allowWideLonBounds) {
    assert.ok(
      lonSpan <= MAX_COMPACT_LON_SPAN_DEGREES,
      `${label} longitude span should remain compact, got ${lonSpan}`,
    );
  }
}

describe('AGID cell edge validation', () => {
  it('keeps cell precision stable for cities, seas, face boundaries, and date-line cells', () => {
    const precisionCases = [
      ['Tokyo Station', 35.6812, 139.7671],
      ['Null Island ocean cell', 0, 0],
      ['Atlantic open ocean', 0, -30],
      ['date-line east cell', 0, 179.999999],
      ['date-line west cell', 0, -179.999999],
      ['cubed-sphere east face seam', 0, 45],
      ['cubed-sphere west face seam', 0, -45],
      ['cubed-sphere north-east face seam', 0, 135],
      ['cubed-sphere north-west face seam', 0, -135],
      ['Web Mercator north display limit', 85.05112878, 0],
      ['Web Mercator south display limit', -85.05112878, 0],
    ] as const;

    for (const [label, lat, lon] of precisionCases) {
      assertRoundTripsToSameCell(lat, lon, label);
    }
  });

  it('keeps polar cells finite while preserving north-pole sea and south-pole Antarctica semantics', () => {
    const north = encodeAGID(89.999999, 0);
    const south = encodeAGID(-89.999999, 0);

    assertRoundTripsToSameCell(89.999999, 0, 'north pole', true);
    assertRoundTripsToSameCell(-89.999999, 0, 'south pole', true);
    assert.equal(north.isSea, true);
    assert.equal(north.regionCode, 'ARCT');
    assert.equal(north.regionName, 'North Pole');
    assert.equal(south.isSea, false);
    assert.equal(south.regionCode, 'AQ');
    assert.equal(south.regionName, 'Antarctica');
  });

  it('does not expand antimeridian cell bounds to a near-global longitude range', () => {
    const east = encodeAGID(0, 179.999999);
    const west = encodeAGID(0, -179.999999);

    assert.ok(east.bounds.maxLon - east.bounds.minLon <= MAX_COMPACT_LON_SPAN_DEGREES);
    assert.ok(west.bounds.maxLon - west.bounds.minLon <= MAX_COMPACT_LON_SPAN_DEGREES);
    assert.ok(Math.max(...east.polygon.map(([lon]) => lon)) - Math.min(...east.polygon.map(([lon]) => lon)) <= MAX_COMPACT_LON_SPAN_DEGREES);
    assert.ok(Math.max(...west.polygon.map(([lon]) => lon)) - Math.min(...west.polygon.map(([lon]) => lon)) <= MAX_COMPACT_LON_SPAN_DEGREES);
  });

  it('classifies open sea and named sea samples as sea without relying on land fallback', () => {
    const seaCases = [
      ['North Atlantic open ocean', 0, -30],
      ['South Pacific open ocean', -45, -120],
      ['South Indian Ocean', -30, 80],
      ['Lazarev Sea', -60.1, 10],
      ['Arctic Ocean', 85, 0],
    ] as const;

    for (const [label, lat, lon] of seaCases) {
      const agid = encodeAGID(lat, lon);
      assert.equal(agid.isSea, true, `${label} should be classified as sea`);
      assert.ok(agid.regionName.length > 0, `${label} should keep a region name`);
      assertRoundTripsToSameCell(lat, lon, label, Math.abs(lat) > 89.95);
    }
  });

  it('recomputes very close border-adjacent points instead of reusing stale region cache', () => {
    const samples = [
      ['inside Gibraltar south edge', 36.10001, -5.35, 'GI', false],
      ['just south of Gibraltar edge', 36.09999, -5.35, 'ES', false],
      ['inside Gibraltar west edge', 36.14, -5.37999, 'GI', false],
      ['just west of Gibraltar edge', 36.14, -5.38001, 'ES', false],
      ['inside Gibraltar east edge', 36.14, -5.32001, 'GI', false],
      ['just east of Gibraltar edge', 36.14, -5.31999, 'ES', false],
    ] as const;

    for (const [label, lat, lon, prefix, isSea] of samples) {
      const region = getRegionInfo(lat, lon);
      assert.equal(region.prefix, prefix, label);
      assert.equal(region.isSea, isSea, label);
    }
  });
});

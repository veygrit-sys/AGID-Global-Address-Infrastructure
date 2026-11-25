import { decodeAGID, getCellCorners, getRegionInfo } from './agid';
import { issuanceLongitude } from './agidProjection';
import {
  countryMapUnitGeometry, matchReviewedCoastalWater, reviewedCoastalWaterGeometry, reviewedCoastalWindows,
} from './countryMapUnits';
import mapUnits from '../data/countryMapUnits.json';
import buesingen from '../data/buesingenBoundary.json';
import deltaData from '../data/pearlRiverDelta.json';
import { pearlRiverDeltaWindows } from './pearlRiverDelta';
import { classifyMapPolygon } from './indexedMapPolygon';
import { haversineDistanceMeters, type PostalContextPosition } from './postalContextSpatial';

export type AgidGeographyInput =
  | { kind: 'pin'; lat: number; lon: number; accuracyMeters?: number; method?: 'manual' | 'device' }
  | { kind: 'cell'; id: string };

type Source = { source: string; version: string; attribution?: string };
export interface AgidGeographicAssessment {
  status: 'mapped' | 'needs-confirmation' | 'unassessed';
  surface: 'land' | 'water' | 'boundary' | 'unknown';
  regionCandidates: string[];
  sources: Source[];
  footprint: { kind: 'manual-pin' | 'device-pin' | 'cell'; radiusMeters: number | null };
  boundaryAllowanceMeters: number;
  deliveryRegion: null;
}

const mapSource = { source: mapUnits.manifest.source_id, version: mapUnits.manifest.source_version };
const oceanSource = { source: mapUnits.manifest.ocean.source_id, version: mapUnits.manifest.ocean.source_version };
const deltaLand = { source: deltaData.manifest.source_id, version: deltaData.manifest.source_version };
const deltaWater = {
  source: `${deltaLand.source}+${deltaData.manifest.ocean.source_id}`,
  version: `${deltaLand.version}+${deltaData.manifest.ocean.source_version}`,
};
const enclaveSource = {
  source: buesingen.manifest.source_id, version: buesingen.manifest.source_version,
  attribution: buesingen.manifest.attribution,
};
const DEG = Math.PI / 180;
const EARTH_RADIUS = 6_371_008.8;

function footprint(input: AgidGeographyInput) {
  if (input?.kind === 'pin') {
    const { lat, lon, accuracyMeters, method = 'manual' } = input;
    if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon)
      || !['manual', 'device'].includes(method)
      || (accuracyMeters !== undefined && (!Number.isFinite(accuracyMeters) || accuracyMeters < 0))) {
      throw new RangeError('Invalid location or accuracy radius');
    }
    return {
      center: [issuanceLongitude(lat, lon), lat] as PostalContextPosition,
      kind: method === 'device' ? 'device-pin' as const : 'manual-pin' as const,
      radiusMeters: accuracyMeters ?? (method === 'device' ? null : 0),
    };
  }
  const cell = input?.kind === 'cell' && decodeAGID(input.id);
  if (!cell) throw new RangeError('Invalid AGID cell');
  const corners = getCellCorners(cell.face, cell.qx, cell.qy);
  // The normalized vector mean stays inside this convex cubed-sphere cell, even at ±180°.
  let x = 0, y = 0, z = 0;
  for (const {lat, lon} of corners) {
    x += Math.cos(lat * DEG) * Math.cos(lon * DEG);
    y += Math.cos(lat * DEG) * Math.sin(lon * DEG);
    z += Math.sin(lat * DEG);
  }
  const center: PostalContextPosition = [Math.atan2(y, x) / DEG, Math.atan2(z, Math.hypot(x, y)) / DEG];
  const radiusMeters = Math.max(...corners.map(c => haversineDistanceMeters(center, [c.lon, c.lat])));
  return { center, kind: 'cell' as const, radiusMeters };
}

// Bounds are longitude intervals in an unwrapped chart, aligned to the query meridian.
function diskBounds([lon, lat]: PostalContextPosition, radius: number) {
  const angular = radius / EARTH_RADIUS;
  const dy = Math.min(180, angular / DEG);
  const dx = Math.abs(lat) + dy >= 90 ? 180 : Math.asin(Math.min(1, Math.sin(angular) / Math.cos(lat * DEG))) / DEG;
  return [lon - dx, Math.max(-90, lat - dy), lon + dx, Math.min(90, lat + dy)];
}

function boxRelation(box: number[], disk: number[]) {
  const [w, s, rawEast, n] = box;
  const e = rawEast < w ? rawEast + 360 : rawEast;
  const shift = 360 * Math.round((disk[0] + disk[2] - w - e) / 720);
  if (disk[0] > e + shift || disk[2] < w + shift || disk[1] > n || disk[3] < s) return 'outside';
  if (disk[0] >= w + shift && disk[2] <= e + shift && disk[1] >= s && disk[3] <= n) return 'inside';
  return 'crosses';
}

// Nearest point in a geographic rectangle on a sphere. At fixed longitude the
// dot product with the query is A cos(latitude) + B sin(latitude).
function nearestInWindow(box: number[], [lon, lat]: PostalContextPosition): PostalContextPosition {
  const [w, s, rawEast, n] = box;
  const e = rawEast < w ? rawEast + 360 : rawEast;
  const x = lon + 360 * Math.round(((w + e) / 2 - lon) / 360);
  const nearLon = Math.max(w, Math.min(e, x));
  const optimum = Math.atan2(Math.sin(lat * DEG), Math.cos(lat * DEG) * Math.cos((nearLon - x) * DEG)) / DEG;
  const nearLat = Math.max(s, Math.min(n, optimum));
  // The constrained maximum can also be at the opposite endpoint when the optimum
  // is over a pole; consider both endpoints explicitly.
  const latitudes = [nearLat, s, n];
  const nearest = latitudes.reduce((a, b) => haversineDistanceMeters([lon, lat], [nearLon, a])
    <= haversineDistanceMeters([lon, lat], [nearLon, b]) ? a : b);
  return [nearLon, nearest];
}

// GeoJSON edges are linear in lon/lat. A great-circle segment for the same endpoints
// can differ, particularly near high-latitude shores. Bound distance to the true
// interpolated segment with the spherical triangle inequality, to one centimetre.
function touchesEdge(center: PostalContextPosition, radius: number, ax: number, ay: number, bx: number, by: number): boolean {
  const midpoint: PostalContextPosition = [(ax + bx) / 2, (ay + by) / 2];
  const closestEquator = Math.max(0, Math.min(ay, by), -Math.max(ay, by));
  const halfLength = EARTH_RADIUS * DEG / 2 * Math.hypot(by - ay, (bx - ax) * Math.cos(closestEquator * DEG));
  const distance = haversineDistanceMeters(center, midpoint);
  if (distance - halfLength > radius + 1e-6) return false;
  if (distance <= radius || halfLength <= 0.01) return true;
  return touchesEdge(center, radius, ax, ay, midpoint[0], midpoint[1])
    || touchesEdge(center, radius, midpoint[0], midpoint[1], bx, by);
}

function contactEdges(rings: number[][][], disk: number[], center: PostalContextPosition, radius: number,
  onTouch: (a: number[], b: number[]) => void) {
  for (const ring of rings) {
    for (let i = 1; i < ring.length; i++) {
      const a = ring[i - 1], b = ring[i];
      if (Math.min(a[1], b[1]) > disk[3] || Math.max(a[1], b[1]) < disk[1]) continue;
      const box = [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])];
      if (boxRelation(box, disk) !== 'outside' && touchesEdge(center, radius, a[0], a[1], b[0], b[1])) onTouch(a, b);
    }
  }
}

/** Assess only the cartographic footprint. No carrier path or postal destination is inferred. */
export function assessAgidGeography(
  input: AgidGeographyInput, { boundaryAllowanceMeters = 0 }: { boundaryAllowanceMeters?: number } = {},
): AgidGeographicAssessment {
  if (!Number.isFinite(boundaryAllowanceMeters) || boundaryAllowanceMeters < 0) throw new RangeError('Invalid boundary allowance');
  const { center, kind, radiusMeters } = footprint(input);
  const [lon, lat] = center;
  const point = getRegionInfo(lat, lon);
  const land = point.mapUnitMatch;
  const water = point.waterMatch;
  const admin = point.administrativeMatch;
  const candidates = new Set([...(land?.codes ?? []), ...(admin?.codes ?? [])]);
  const sources = new Map<string, Source>();
  const addSource = (s: Source | undefined) => {
    if (!s) return;
    sources.set(s.source, { source: s.source, version: s.version, ...(s.attribution && { attribution: s.attribution }) });
  };
  addSource(land); addSource(water); addSource(admin);
  const finish = (surface: AgidGeographicAssessment['surface'], review: boolean): AgidGeographicAssessment => ({
    status: !sources.size ? 'unassessed' : review ? 'needs-confirmation' : 'mapped',
    surface, regionCandidates: [...candidates].sort(), sources: [...sources.values()],
    footprint: { kind, radiusMeters }, boundaryAllowanceMeters, deliveryRegion: null,
  });
  const pointSurface = land && water ? 'boundary' : land ? 'land' : water ? 'water' : 'unknown';
  if (radiusMeters === null) return finish('unknown', true);
  // The default assesses the map as drawn. A separately calibrated source allowance
  // can widen the query without altering the device-reported precision.
  const radius = Math.min(Math.PI * EARTH_RADIUS, radiusMeters + boundaryAllowanceMeters);
  if (radius === 0 && land?.relation !== 'boundary') {
    return finish(pointSurface, admin?.relation === 'boundary' || candidates.size > 1 || pointSurface === 'boundary');
  }

  const disk = diskBounds(center, radius);
  let partialCoverage = false;
  let touchesWater = false;
  let touchesAdmin = admin?.relation === 'boundary';
  const crossedEdges = new Map<string, Set<string>>();
  function recordLand(code: string, source: Source, a: number[], b: number[]) {
    candidates.add(code);
    addSource(source);
    const ka = a.join(','), kb = b.join(',');
    const key = ka < kb ? `${ka};${kb}` : `${kb};${ka}`;
    const codes = crossedEdges.get(key) ?? new Set<string>();
    codes.add(code);
    crossedEdges.set(key, codes);
  }

  // Partial coverage cannot establish a surface for the whole disk. Retain
  // affirmative evidence from its nearest in-window point and actual mapped
  // vertices inside the overlap, including islands enclosed by a large disk.
  function partialWindow(box: number[], source: Source) {
    const [x, y] = nearestInWindow(box, center);
    if (haversineDistanceMeters(center, [x, y]) > radius + 1e-6) return false;
    partialCoverage = true;
    addSource(source);
    const evidence = getRegionInfo(y, issuanceLongitude(y, x));
    for (const match of [evidence.mapUnitMatch, evidence.administrativeMatch]) {
      if (match) {
        addSource(match);
        match.codes.forEach(code => candidates.add(code));
      }
    }
    return true;
  }
  function hasMappedVertex(rings: number[][][], box: number[]) {
    return rings.some(ring => ring.some(([x, y]) =>
      boxRelation(box, [x, y, x, y]) === 'inside'
      && haversineDistanceMeters(center, [x, y]) <= radius));
  }

  for (const { code, polygons } of countryMapUnitGeometry) {
    // Japanese rings are complete but only their documented windows were reviewed.
    if (code === 'JP' && !reviewedCoastalWindows.some(w => w.code === code && boxRelation(w.bbox, disk) === 'inside')) continue;
    for (const polygon of polygons) {
      if (boxRelation(polygon.bbox, disk) !== 'outside') {
        contactEdges(polygon.rings, disk, center, radius, (a, b) => recordLand(code, mapSource, a, b));
      }
    }
  }
  for (const window of reviewedCoastalWaterGeometry) {
    const relation = boxRelation(window.bbox, disk);
    if (relation === 'crosses') {
      if (partialWindow(window.bbox, oceanSource) && !candidates.has(window.code)) {
        const unit = countryMapUnitGeometry.find(u => u.code === window.code);
        if (unit?.polygons.some(p => boxRelation(p.bbox, disk) !== 'outside' && hasMappedVertex(p.rings, window.bbox))) {
          candidates.add(window.code);
          addSource(mapSource);
        }
      }
    }
    if (relation !== 'inside') continue;
    for (const polygon of window.polygons) {
      if (boxRelation(polygon.bbox, disk) !== 'outside') {
        contactEdges(polygon.rings, disk, center, radius, () => {
          touchesWater = true;
          addSource(oceanSource);
        });
      }
    }
    if (crossedEdges.size && matchReviewedCoastalWater(lat, lon)) {
      touchesWater = true;
      addSource(oceanSource);
    }
  }

  for (const window of pearlRiverDeltaWindows) {
    const relation = boxRelation(window.bbox, disk);
    if (relation === 'crosses') {
      if (partialWindow(window.bbox, deltaWater)) {
        for (const polygon of window.polygons) {
          if (polygon.code === 'water' || candidates.has(polygon.code) || boxRelation(polygon.bbox, disk) === 'outside') continue;
          if (hasMappedVertex(polygon.geometry().rings.map(r => r.points), window.bbox)) {
            candidates.add(polygon.code);
            addSource(deltaLand);
          }
        }
      }
    }
    if (relation !== 'inside') continue;
    // First resolve the higher-resolution land. A continuous land footprint takes
    // precedence over the less detailed ocean layer even where the layers overlap.
    for (const polygon of window.polygons) {
      if (polygon.code === 'water' || boxRelation(polygon.bbox, disk) === 'outside') continue;
      contactEdges(polygon.geometry().rings.map(r => r.points), disk, center, radius,
        (a, b) => recordLand(polygon.code, deltaLand, a, b));
    }
    const continuousLand = crossedEdges.size
      ? [...crossedEdges.values()].every(codes => codes.size >= 2)
      : land?.relation === 'inside';
    if (land && continuousLand) continue;
    for (const polygon of window.polygons) {
      if (polygon.code !== 'water' || boxRelation(polygon.bbox, disk) === 'outside') continue;
      const geometry = polygon.geometry();
      if (crossedEdges.size && classifyMapPolygon(lon, lat, geometry) === 'inside') {
        addSource(deltaWater);
        touchesWater = true;
      }
      contactEdges(geometry.rings.map(r => r.points), disk, center, radius, () => {
        addSource(deltaWater);
        touchesWater = true;
      });
    }
  }

  const enclaveCoverage = boxRelation(buesingen.bounds, disk);
  if (enclaveCoverage === 'crosses') {
    partialWindow(buesingen.bounds, enclaveSource);
  }
  if (enclaveCoverage !== 'outside') {
    contactEdges([buesingen.ring], disk, center, radius, () => {
      candidates.add('DE');
      candidates.add('CH');
      addSource(enclaveSource);
      touchesAdmin = true;
    });
  }

  const touchesLand = crossedEdges.size > 0 || land?.relation === 'boundary';
  let surface: AgidGeographicAssessment['surface'] = pointSurface;
  if (touchesLand) {
    // A shared national border remains mapped land. For an exposed edge the
    // opposite side can only be identified as water with independent evidence.
    const sharedLand = land && crossedEdges.size > 0 && [...crossedEdges.values()].every(codes => codes.size >= 2);
    surface = sharedLand ? 'land' : touchesWater || water ? 'boundary' : 'unknown';
  } else if (touchesWater) {
    surface = 'unknown';
  }
  if (partialCoverage) surface = 'unknown';
  return finish(surface, partialCoverage || touchesLand || touchesWater || touchesAdmin || candidates.size > 1);
}

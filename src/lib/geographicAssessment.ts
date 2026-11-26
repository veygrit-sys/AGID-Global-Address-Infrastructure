import frontierSources from '../data/europe-frontiers/sources.json';
import { europeanFrontiersTouching, type FrontierFeature } from './europeFrontierAtlas';
import {
  europeLandSource, europeLandWindows, europeOceanSource, inEuropeLandWindow, isEuropeanOpenWater, matchEuropeLandUnits, queryEuropeLandUnits,
} from './europeOverview';
import { matchReviewedShoreline, queryReviewedShorelinePolygons, reviewedShorelineWindows } from './reviewedShorelines';
import { chelemReviewSource, chelemSurveySource, isReviewedNaturalEarthIsland, queryIslandBorderReviewPolygons } from './islandBorderDisagreement';
import { pointTerritorialTopology, type TerritorialTopology } from './territorialTopology';
import { matchTerritorialAdministration, queryTerritorialExclavePolygons, type TerritorialExclaveMatch } from './territorialExclaves';
import { type AgidIslandAssessment, applyIslandPolicyToEvidence } from './islandPolicy';
import {
  queryGlobalIslandPolygons, globalIslandSource, globalInlandWaterSource, isGlobalInlandWater,
  matchGlobalLandform, mayTouchGlobalInlandWater,
} from './globalIslands';
import { queryMinorIslandPolygons, minorIslandSource } from './minorIslands';
import { queryJapaneseIslandPolygons, isJapaneseIslandReviewArea } from './japaneseIslandView';
import { queryDisputedIslandPolygons, queryRevisedIslandPolygons } from './disputedIslands';
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
  administrativeSourceDisagreement?: true;
  frontiers?: FrontierFeature[];
  frontierSearch?: 'unknown-accuracy' | 'large-footprint';
  island?: AgidIslandAssessment;
  territorialTopology?: TerritorialTopology;
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
      corners: undefined,
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
  const vertices = corners.map(({lat,lon}) => [lon + 360 * Math.round((center[0]-lon)/360), lat] as PostalContextPosition);
  return { center, corners: vertices, kind: 'cell' as const, radiusMeters };
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
function contactOnEdge(center: PostalContextPosition, radius: number, ax: number, ay: number, bx: number, by: number): PostalContextPosition | undefined {
  const midpoint: PostalContextPosition = [(ax + bx) / 2, (ay + by) / 2];
  const closestEquator = Math.max(0, Math.min(ay, by), -Math.max(ay, by));
  const halfLength = EARTH_RADIUS * DEG / 2 * Math.hypot(by - ay, (bx - ax) * Math.cos(closestEquator * DEG));
  const distance = haversineDistanceMeters(center, midpoint);
  if (distance - halfLength > radius + 1e-6) return undefined;
  if (distance <= radius || halfLength <= 0.01) return midpoint;
  return contactOnEdge(center, radius, ax, ay, midpoint[0], midpoint[1])
    ?? contactOnEdge(center, radius, midpoint[0], midpoint[1], bx, by);
}

function contactEdges(rings: number[][][], disk: number[], center: PostalContextPosition, radius: number,
  corners: PostalContextPosition[] | undefined, onTouch: (a: number[], b: number[], witness: PostalContextPosition) => void | boolean) {
  for (const ring of rings) {
    for (let i = 1; i < ring.length; i++) {
      const a = ring[i - 1], b = ring[i];
      if (Math.min(a[1], b[1]) > disk[3] || Math.max(a[1], b[1]) < disk[1]) continue;
      const box = [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])];
      if (boxRelation(box, disk) === 'outside') continue;
      const witness = corners ? contactWithCell(corners, a[0], a[1], b[0], b[1], 1e-12) : contactOnEdge(center, radius, a[0], a[1], b[0], b[1]);
      if (witness && onTouch(a, b, witness) === true) return;
    }
  }
}

type GeographicFootprint = ReturnType<typeof footprint>;

function assessReviewedShorelineFootprint(location: GeographicFootprint, radius: number | null,
  boundaryAllowanceMeters: number): AgidGeographicAssessment | undefined {
  const { center, kind, radiusMeters } = location;
  const [lon, lat] = center;
  const point = matchReviewedShoreline(lat, lon);
  if (!point && (radius === null || radius === 0 || radius > 500_000)) return;
  const disk = diskBounds(center, radius ?? 0);
  const windows = reviewedShorelineWindows.filter(w => boxRelation(w.bbox, disk) !== 'outside'
    && haversineDistanceMeters(center, nearestInWindow(w.bbox, center)) <= (radius ?? 0) + 1e-6);
  if (!point && !windows.length) return;
  const covered = windows.some(w => boxRelation(w.bbox, disk) === 'inside');
  const candidates = new Set(point?.codes);
  const sources = new Map<string, Source>();
  function addSource(s: Source | undefined) {
    if (s) sources.set(s.source, { source: s.source, version: s.version, attribution: s.attribution });
  }
  addSource(point);
  addSource(point?.physicalSource);
  const policyIsland = point && getRegionInfo(lat, lon).island;
  const disputed = policyIsland?.status === 'disputed' || Boolean(policyIsland?.claimantCodes?.length);
  if (disputed) { candidates.clear(); addSource(policyIsland); }
  let touchesShore = point?.surface === 'boundary';
  let touchesAdmin = point?.relation === 'boundary';
  let touchesDispute = Boolean(disputed);
  if (radius !== null && radius > 0 && radius <= 500_000) {
    // Keep the observed point on the intersecting edge. The midpoint of a long
    // edge may be outside both the accuracy disk and the reviewed window.
    // A bounding box only rules out an owner. Add a candidate exclusively
    // after contacting its mapped land within the disk.
    const shapes = [...queryReviewedShorelinePolygons(disk)];
    const possible = new Set(shapes.flatMap(s => s.codes));
    const foundAll = () => [...possible].every(code => candidates.has(code));
    for (const shape of shapes) {
      if (foundAll() && (shape.kind === 'physical' ? touchesShore : touchesAdmin)) continue;
      contactEdges(shape.rings, disk, center, radius, boundaryAllowanceMeters === 0 ? location.corners : undefined, (_a, _b, [x, y]) => {
        const at = matchReviewedShoreline(y, issuanceLongitude(y, x));
        if (!at || at.surface === 'water') return;
        // An older shoreline or political line can run through the interior of
        // a newer survey. Only the effective boundary at the contact contributes.
        if (shape.kind === 'physical' && at.surface === 'land') return;
        if (shape.kind === 'admin' && at.surface === 'land' && at.relation === 'inside') return;
        addSource(at);
        addSource(at.physicalSource);
        if (shape.kind === 'physical') touchesShore = true;
        else touchesAdmin = true;
        if (at.surface === 'land' || at.surface === 'boundary') {
          for (const code of at.codes) candidates.add(code);
        }
        return foundAll() || (shape.kind === 'admin' && shape.codes.every(code => candidates.has(code)));
      });
    }
    for (const shape of queryDisputedIslandPolygons(disk)) {
      contactEdges(shape.rings, disk, center, radius, boundaryAllowanceMeters === 0 ? location.corners : undefined, () => {
        addSource(shape);
        touchesDispute = true;
      });
    }
  }
  if (!covered && radius !== null && radius > 0) {
    for (const w of windows) {
      const [x, y] = nearestInWindow(w.bbox, center);
      const near = matchReviewedShoreline(y, issuanceLongitude(y, x));
      addSource(near);
      near?.codes.forEach(code => candidates.add(code));
    }
  }
  if (!point && !sources.size) return;
  let surface: AgidGeographicAssessment['surface'] = point?.surface ?? 'unknown';
  if (radius === null || !covered || radius > 500_000) surface = 'unknown';
  else if (touchesShore && radius > 0) surface = 'unknown';
  const review = surface === 'unknown' || surface === 'boundary' || touchesAdmin || touchesDispute
    || (surface === 'land' && candidates.size !== 1);
  const topology = point && pointTerritorialTopology(lat, lon, policyIsland);
  const island = policyIsland?.status === 'mapped' && review
    && !(policyIsland.administrationKind === 'condominium' && surface === 'land')
    ? { ...policyIsland, status: 'unresolved' as const, countryCodes: [], sovereignCodes: [] } : policyIsland;
  return {
    status: review ? 'needs-confirmation' : 'mapped', surface, regionCandidates: [...candidates].sort(),
    sources: [...sources.values()], footprint: { kind, radiusMeters }, boundaryAllowanceMeters,
    ...(point?.administrativeSourceDisagreement && { administrativeSourceDisagreement: true }),
    ...(island && { island }), ...(topology && { territorialTopology: review && radius !== 0
      ? { ...topology, status: 'uncertain' } : topology }), deliveryRegion: null,
  };
}

/** Assess only the cartographic footprint. No carrier path or postal destination is inferred. */
export function assessAgidGeography(
  input: AgidGeographyInput, { boundaryAllowanceMeters = 0 }: { boundaryAllowanceMeters?: number } = {},
): AgidGeographicAssessment {
  if (!Number.isFinite(boundaryAllowanceMeters) || boundaryAllowanceMeters < 0) throw new RangeError('Invalid boundary allowance');
  const location = footprint(input);
  const radius = location.radiusMeters === null ? null : Math.min(Math.PI * EARTH_RADIUS, location.radiusMeters + boundaryAllowanceMeters);
  const reviewed = assessReviewedShorelineFootprint(location, radius, boundaryAllowanceMeters);
  if (!reviewed) return assessBaseGeography(location, boundaryAllowanceMeters);
  // A disk that extends outside the review can also reach independently mapped
  // territory on the other side. Only retain those extra candidates as possibilities.
  if (radius !== null && radius > 0 && reviewed.surface === 'unknown'
      && !reviewedShorelineWindows.some(w => boxRelation(w.bbox, diskBounds(location.center, radius)) === 'inside')) {
    const outside = assessBaseGeography(location, boundaryAllowanceMeters);
    reviewed.regionCandidates = [...new Set([...reviewed.regionCandidates, ...outside.regionCandidates])].sort();
    for (const source of outside.sources) {
      if (!reviewed.sources.some(s => s.source === source.source)) reviewed.sources.push(source);
    }
  }
  return reviewed;
}

function assessBaseGeography(location: GeographicFootprint, boundaryAllowanceMeters: number): AgidGeographicAssessment {
  const { center, kind, radiusMeters } = location;
  const [lon, lat] = center;
  const point = getRegionInfo(lat, lon);
  // The reviewed Japanese shoreline and surveyed lake-island intersection are
  // finer than the water grid. An administrative outline alone cannot override it.
  const specificIsland = point.island?.status === 'japan-position'
    || point.island?.source === 'mlit-n03-tokyo-remote-islands' || point.island?.source === 'gshhg-full-lake-islands';
  const inlandWater = !specificIsland && isGlobalInlandWater(lat, lon);
  const island = inlandWater ? undefined : point.island;
  const land = inlandWater ? undefined : point.mapUnitMatch;
  const water = inlandWater ? globalInlandWaterSource : point.waterMatch;
  const admin = !inlandWater || point.administrativeMatch?.source === enclaveSource.source
    ? point.administrativeMatch : undefined;
  const candidates = new Set(admin?.codes ?? land?.codes ?? []);
  const sources = new Map<string, Source>();
  const addSource = (s: Source | undefined) => {
    if (!s) return;
    sources.set(s.source, { source: s.source, version: s.version, ...(s.attribution && { attribution: s.attribution }) });
  };
  addSource(land); addSource(water); addSource(admin); addSource(island);
  const radius = radiusMeters === null ? null : Math.min(Math.PI * EARTH_RADIUS, radiusMeters + boundaryAllowanceMeters);
  const fullInlandWater = inlandWater && radius !== null && (radius === 0 || isGlobalInlandWater(lat, lon, radius));
  let topology = water && !land ? undefined : pointTerritorialTopology(lat, lon, island);
  const conflictingShore = island?.source === chelemReviewSource;
  const centerTopology = topology;
  let touchesTerritory = false;
  // A confirmed landform supplies physical evidence independently of ownership.
  // For a cell/device footprint require proof over the entire disk, not its center.
  let fullLandform: Source | undefined;
  if (!water && radius !== null && topology && topology.landform !== 'unknown') {
    if (radius === 0 && topology.status === 'inside') fullLandform = topology.physicalSource;
    else if (radius > 0 && radius <= 500_000) {
      const diskLandform = matchGlobalLandform(lat, lon, radius);
      if (diskLandform?.kind === topology.landform) fullLandform = diskLandform;
    }
  }
  const finish = (surface: AgidGeographicAssessment['surface'], review: boolean): AgidGeographicAssessment => {
    if (fullLandform) {
      addSource(fullLandform);
      if (surface === 'unknown') surface = 'land';
    }
    return {
      status: !sources.size ? 'unassessed' : review || island?.status === 'disputed' || island?.status === 'unresolved' ? 'needs-confirmation' : 'mapped',
      ...(topology && { territorialTopology: {
        ...topology,
        status: radius === null || (radius > 0 && (review || touchesTerritory || topology.status === 'boundary'))
          ? 'uncertain' : topology.status,
      } }),
      ...(island && { island: review && island.status === 'mapped' && (candidates.size !== 1 || surface !== 'land')
        ? { ...island, status: 'unresolved' as const, countryCodes: [], sovereignCodes: [] } : island }),
      surface, regionCandidates: [...candidates].sort(), sources: [...sources.values()],
      footprint: { kind, radiusMeters }, boundaryAllowanceMeters, deliveryRegion: null,
    };
  };
  const pointSurface = conflictingShore ? 'unknown' : land && water ? 'boundary' : land ? 'land' : water ? 'water' : 'unknown';
  if (radius === null) return finish('unknown', true);
  if (fullInlandWater && !admin) return finish('water', false);
  // The default assesses the map as drawn. A separately calibrated source allowance
  // can widen the query without altering the device-reported precision.
  if (radius === 0 && land?.relation !== 'boundary') {
    return finish(pointSurface, admin?.relation === 'boundary' || candidates.size > 1 || pointSurface === 'boundary');
  }

  const disk = diskBounds(center, radius);
  let partialCoverage = inlandWater && !fullInlandWater;
  let touchesWater = false;
  let touchesAdmin = admin?.relation === 'boundary';
  let reachesReviewEdge = false;
  if (radius <= 500_000) {
    for (const shape of queryIslandBorderReviewPolygons(disk)) {
      contactEdges(shape.rings, disk, center, radius, boundaryAllowanceMeters === 0 ? location.corners : undefined, () => {
        reachesReviewEdge = true;
        addSource(shape);
        if (shape.source === chelemSurveySource) candidates.add('MX');
      });
    }
    if (reachesReviewEdge) {
      partialCoverage = true;
      fullLandform = undefined;
    } else if (island?.source === chelemSurveySource && island.relation === 'inside') {
      return finish('land', false);
    } else if (conflictingShore) {
      return finish('unknown', true);
    }
  }
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

  if (water?.source === europeOceanSource.source) {
    if (isEuropeanOpenWater(disk)) return finish('water', false);
    // A certificate ending at a tile edge says nothing about the adjacent tile.
    partialCoverage = true;
  }
  for (const window of europeLandWindows) {
    if (boxRelation(window.bbox, disk) === 'crosses') partialWindow(window.bbox, europeLandSource);
  }
  for (const unit of queryEuropeLandUnits(disk)) {
    contactEdges(unit.feature.rings, disk, center, radius, boundaryAllowanceMeters === 0 ? location.corners : undefined, (a, b, [x, y]) => {
      if (!inEuropeLandWindow(unit.coverage, x, y)) return;
      // Preserve finer enclave and host polygons (e.g. Baarle) within their reviewed extent.
      const local = matchTerritorialAdministration(y, x);
      if (local && !local.codes.includes(unit.code)) return;
      recordLand(unit.code, europeLandSource, a, b);
    });
  }
  for (const { code, polygons } of countryMapUnitGeometry) {
    // Japanese rings are complete but only their documented windows were reviewed.
    if (code === 'JP' && !reviewedCoastalWindows.some(w => w.code === code && boxRelation(w.bbox, disk) === 'inside')) continue;
    for (const polygon of polygons) {
      if (boxRelation(polygon.bbox, disk) !== 'outside') {
        contactEdges(polygon.rings, disk, center, radius, boundaryAllowanceMeters === 0 ? location.corners : undefined, (a, b, [x, y]) => {
          // A previously bundled line can lie well inside a newer continental polygon.
          if (matchEuropeLandUnits(y, issuanceLongitude(y, x))) return;
          recordLand(code, mapSource, a, b);
        });
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
        contactEdges(polygon.rings, disk, center, radius, boundaryAllowanceMeters === 0 ? location.corners : undefined, () => {
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
      contactEdges(polygon.geometry().rings.map(r => r.points), disk, center, radius, boundaryAllowanceMeters === 0 ? location.corners : undefined,
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
      contactEdges(geometry.rings.map(r => r.points), disk, center, radius, boundaryAllowanceMeters === 0 ? location.corners : undefined, () => {
        addSource(deltaWater);
        touchesWater = true;
      });
    }
  }

  // A disk that covers large regions is necessarily unsuitable for choosing an
  // island address. Avoid materializing a world atlas for a single uncertain fix.
  if (radius > 500_000) {
    partialCoverage = true;
  } else {
    // Physical proof for a whole footprint is independent of an administrative edge.
    // Global mainland coastlines deliberately omit areas with insufficient hydrography.
    if (radius > 0 && topology?.landform === 'mainland' && !fullLandform) {
      topology = { ...topology, status: 'uncertain' };
    }
    const contacted = new Map<string, TerritorialExclaveMatch>();
    for (const shape of queryTerritorialExclavePolygons(disk)) {
      contactEdges(shape.rings, disk, center, radius, boundaryAllowanceMeters === 0 ? location.corners : undefined, (_a, _b, [x, y]) => {
        touchesTerritory = true;
        touchesAdmin = true;
        const { feature } = shape;
        // A reviewed lake island is clipped to its physical shoreline. Crossing
        // that outline cannot establish land over the entire accuracy circle.
        if (radius > 0 && feature.physicalIslandSource && !fullLandform) partialCoverage = true;
        addSource(feature);
        candidates.add(feature.code);
        const atEdge = matchTerritorialAdministration(y, issuanceLongitude(y, x));
        for (const code of atEdge?.codes ?? []) candidates.add(code);
        if (!centerTopology?.administration && !contacted.has(feature.id)) {
          contacted.set(feature.id, { ...feature, relation: 'boundary', boundaryCodes: atEdge?.codes ?? [feature.code] });
        }
      });
    }
    if (contacted.size && !centerTopology?.administration) {
      topology = {
        ...(topology ?? { landform: 'unknown' as const }),
        status: 'uncertain',
        ...(contacted.size === 1 && { administration: [...contacted.values()][0] }),
      };
    }
    function inspectIslandEdges(
      features: Iterable<{bbox: number[]; rings: number[][][]; codes?: string[]; source?: string; version?: string; disputed?: boolean}>,
      tier: 'ordinary' | 'policy', defaultSource?: Source,
    ) {
      for (const feature of features) {
        if (reachesReviewEdge && defaultSource === globalIslandSource && isReviewedNaturalEarthIsland(feature.bbox, feature.codes)) continue;
        contactEdges(feature.rings, disk, center, radius, boundaryAllowanceMeters === 0 ? location.corners : undefined, (a, b) => {
          const x = issuanceLongitude((a[1] + b[1]) / 2, (a[0] + b[0]) / 2);
          const y = (a[1] + b[1]) / 2;
          if (tier === 'ordinary' && isJapaneseIslandReviewArea(y, x)) return;
          const rawSource = feature.source && feature.version ? {source: feature.source, version: feature.version} : defaultSource;
          const match = applyIslandPolicyToEvidence(y, x, rawSource ? {
            codes: feature.codes ?? [], ...rawSource,
            disputed: feature.disputed, relation: 'boundary',
          } : undefined);
          const codes = match?.countryCodes ?? feature.codes ?? [];
          if (match) addSource(match);
          if (codes.length) {
            const source = match ?? rawSource;
            if (!source) { partialCoverage = true; return; }
            for (const code of codes) recordLand(code, source, a, b);
          } else {
            partialCoverage = true;
          }
        });
      }
    }
    inspectIslandEdges(queryJapaneseIslandPolygons(disk), 'policy');
    inspectIslandEdges(queryDisputedIslandPolygons(disk), 'policy');
    inspectIslandEdges(queryRevisedIslandPolygons(disk), 'policy');
    // Regional data already inspected above has the more detailed shore and border here.
    const regional = pearlRiverDeltaWindows.some(w => boxRelation(w.bbox, disk) === 'inside') ||
      reviewedCoastalWindows.some(w => boxRelation(w.bbox, disk) === 'inside');
    if (!regional && island?.status !== 'japan-position') {
      // These political rings can fill lakes in an otherwise continuous island.
      // A footprint near inland water needs independent dry-land evidence.
      if (island?.source === globalIslandSource.source && !fullLandform && mayTouchGlobalInlandWater(lat, lon, radius)) {
        partialCoverage = true;
      }
      inspectIslandEdges(queryGlobalIslandPolygons(disk), 'ordinary', globalIslandSource);
    }
    if (island?.status !== 'japan-position') inspectIslandEdges(queryMinorIslandPolygons(disk), 'ordinary', minorIslandSource);
  }

  const enclaveCoverage = boxRelation(buesingen.bounds, disk);
  if (enclaveCoverage === 'crosses') {
    partialWindow(buesingen.bounds, enclaveSource);
  }
  if (enclaveCoverage !== 'outside') {
    contactEdges([buesingen.ring], disk, center, radius, boundaryAllowanceMeters === 0 ? location.corners : undefined, () => {
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

const frontierEpsilon = 1e-7;
function onFrontier(x: number, y: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx-ax, dy = by-ay;
  return x >= Math.min(ax,bx)-frontierEpsilon && x <= Math.max(ax,bx)+frontierEpsilon
    && y >= Math.min(ay,by)-frontierEpsilon && y <= Math.max(ay,by)+frontierEpsilon
    && Math.abs(dx*(y-ay)-dy*(x-ax)) <= frontierEpsilon*(Math.abs(dx)+Math.abs(dy));
}

/** Clip against all four real cell edges, including a corner-only contact. */
function contactWithCell(corners: PostalContextPosition[], ax: number, ay: number, bx: number, by: number,
  epsilon = frontierEpsilon): PostalContextPosition | undefined {
  const shift = 360 * Math.round((corners[0][0] - (ax+bx)/2) / 360);
  ax += shift;
  bx += shift;
  let low = 0, high = 1;
  const [p,q,r] = corners;
  const winding = Math.sign((q[0]-p[0])*(r[1]-q[1])-(q[1]-p[1])*(r[0]-q[0]));
  for (let i = 0; i < corners.length; i++) {
    const [x,y] = corners[i], [u,v] = corners[(i+1)%corners.length];
    const dx = u-x, dy = v-y;
    const start = winding*(dx*(ay-y)-dy*(ax-x)) + epsilon*(Math.abs(dx)+Math.abs(dy));
    const change = winding*(dx*(by-ay)-dy*(bx-ax));
    if (change === 0) {
      if (start < 0) return;
    } else if (change > 0) {
      low = Math.max(low,-start/change);
    } else {
      high = Math.min(high,-start/change);
    }
    if (low > high) return;
  }
  const t = (low+high)/2;
  return [ax+t*(bx-ax),ay+t*(by-ay)];
}

export async function assessAgidGeographyWithFrontiers(input: AgidGeographyInput, base = assessAgidGeography(input)): Promise<AgidGeographicAssessment> {
  const { center, corners, radiusMeters } = footprint(input);
  if (radiusMeters === null) return {...base, frontierSearch: 'unknown-accuracy'};
  if (radiusMeters > 500000) return {...base, frontierSearch: 'large-footprint'};
  const box = diskBounds(center,radiusMeters);
  const hits = await europeanFrontiersTouching(box, (ax,ay,bx,by) => {
    if (corners) return Boolean(contactWithCell(corners,ax,ay,bx,by));
    if (!radiusMeters) return onFrontier(center[0],center[1],ax,ay,bx,by);
    return Boolean(contactOnEdge(center,radiusMeters,ax,ay,bx,by));
  });
  if (!hits.length) return base;
  const candidates = new Set(base.regionCandidates);
  const fine = base.territorialTopology?.administration || base.administrativeSourceDisagreement
    || base.island?.status === 'disputed' || base.island?.status === 'japan-position'
    || base.sources.some(s => ['vennbahn-cadgis-nrw','jungholz-bev-bavaria','medjurecje-geoboundaries','market-2006-demarcation','swisstopo-swissboundaries3d-buesingen'].includes(s.source));
  const credits = new Map(base.sources.map(s => [s.source,s]));
  for (const hit of hits) {
    const source = frontierSources[hit.source as keyof typeof frontierSources];
    if (source) credits.set(source.source,source);
    if (base.surface === 'land' && !fine && ['international','demarcation','signed-agreement','survey','joint-limit'].includes(hit.kind)) {
      hit.codes.forEach(code => candidates.add(code));
    }
  }
  return {...base, frontiers: hits, sources: [...credits.values()], regionCandidates: [...candidates].sort(),
    status: candidates.size > 1 || base.status === 'unassessed' ? 'needs-confirmation' : base.status};
}

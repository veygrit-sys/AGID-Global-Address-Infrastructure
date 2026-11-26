import geometry from '../data/disputedIslandGeometry.json';
import records from '../data/islandDisputePolicies.json';
import { northRockDryPolygon, northRockSource, northRockWindow } from './northRockShoreline';
import { normalizeLongitude } from './agidProjection';
import { classifyMapPolygon, indexMapPolygon } from './indexedMapPolygon';

interface PolicyEvidence {
  territory: string;
  territoryJa: string;
  source: string;
  version: string;
  evidenceUrls: string[];
}

export interface DisputedIslandPolicy extends PolicyEvidence {
  status: 'disputed' | 'review-required';
  claimantCodes: string[];
  administeringCode: string | null;
  /** Group-wide candidates can claim only a subset of the individual islands. */
  claimScope: 'feature' | 'island-group';
}

export interface RevisedIslandPolicy extends PolicyEvidence {
  status: 'revised';
  /** Cartographic attribution based on the cited later instrument; distinct from administration. */
  code: string;
}

export type DisputedIslandMatch = DisputedIslandPolicy & { relation: 'inside' | 'boundary' };
export type RevisedIslandMatch = RevisedIslandPolicy & { relation: 'inside' | 'boundary' };

type BoundsAndRings = { bbox: number[]; rings: number[][][] };
type Policy = DisputedIslandPolicy | RevisedIslandPolicy;
type PolicyPolygon<T extends Policy> = T & BoundsAndRings;

/** Policy metadata applies exclusively to the intersection of a reviewed feature and mapped land. */
const { source, version } = geometry.manifest;
const unitDegrees = 5;
const { floor } = Math;
const bin = (lat: number, lon: number) => (floor((lat + 90) / unitDegrees) * 72) + floor((lon + 180) / unitDegrees);

function buildIndex<T extends Policy>(items: PolicyPolygon<T>[]) {
  const bins = new Map<number, { polygon: PolicyPolygon<T>; indexed: ReturnType<typeof indexMapPolygon> }[]>();
  for (const polygon of items) {
    const entry = { polygon, indexed: indexMapPolygon(polygon) };
    const [west, south, east, north] = polygon.bbox;
    for (let y = floor(south / unitDegrees); y <= floor(north / unitDegrees); y++) {
      for (let x = floor(west / unitDegrees); x <= floor(east / unitDegrees); x++) {
        const k = bin(y * unitDegrees, x * unitDegrees);
        const bucket = bins.get(k);
        if (bucket) bucket.push(entry);
        else bins.set(k, [entry]);
      }
    }
  }
  return {
    at(lat: number, lon: number) {
      const x = normalizeLongitude(lon);
      const candidates = bins.get(bin(lat, x));
      if (!candidates) return undefined;
      for (const { polygon, indexed } of candidates) {
        const relation = classifyMapPolygon(x, lat, indexed);
        if (relation === 'outside') continue;
        const { bbox, rings, ...metadata } = polygon;
        return { ...metadata, relation };
      }
      return undefined;
    },
    within([w, s, e, n]: number[]) {
      // A disk's longitudes are unwrapped around its centre. Shift each source
      // extent into that domain; a date-line disk never intersects Greenwich by accident.
      return items.filter(({ bbox: [west, south, east, north] }) => {
        if (south > n || north < s) return false;
        const shift = 360 * Math.round((w + e - west - east) / 720);
        return east + shift >= w && west + shift <= e;
      });
    },
  };
}

const disputed: PolicyPolygon<DisputedIslandPolicy>[] = [];
const revised: PolicyPolygon<RevisedIslandPolicy>[] = [];
for (const group of geometry.groups) {
  const label = records[group.id as keyof typeof records];
  if (label.status === 'revised' && 'code' in label) {
    for (const piece of group.polygons) revised.push({ ...label, status: 'revised', source, version, ...piece });
  } else if ('claimantCodes' in label) {
    for (const piece of group.polygons) disputed.push({
      ...label,
      status: label.status === 'review-required' ? 'review-required' : 'disputed',
      claimScope: label.claimScope === 'island-group' ? 'island-group' : 'feature',
      source, version, ...piece,
    });
  }
}

// CanVec identifies a much smaller exposed rock inside the intertidal reef.
disputed.push({
  ...records.MACHIAS, ...northRockDryPolygon,
  source: northRockSource.source, version: northRockSource.version,
  territory: 'North Rock', territoryJa: 'ノースロック', status: 'disputed', claimScope: 'feature',
  evidenceUrls: [...new Set([...records.MACHIAS.evidenceUrls, ...northRockSource.evidenceUrls])],
});
const disputes = buildIndex(disputed);
const revisions = buildIndex(revised);

export function matchDisputedIsland(lat: number, lon: number): DisputedIslandMatch | undefined {
  const match = disputes.at(lat, lon);
  if (match) return { ...match, claimantCodes: [...match.claimantCodes], evidenceUrls: [...match.evidenceUrls] };
}

export function matchRevisedIslandRegion(lat: number, lon: number): RevisedIslandMatch | undefined {
  const match = revisions.at(lat, lon);
  if (match) return { ...match, evidenceUrls: [...match.evidenceUrls] };
}

export function queryDisputedIslandPolygons(disk: number[]): PolicyPolygon<DisputedIslandPolicy>[] {
  return disputes.within(disk);
}

export function queryRevisedIslandPolygons(disk: number[]): PolicyPolygon<RevisedIslandPolicy>[] {
  return revisions.within(disk);
}

// A coarse search envelope can withhold a country assignment for a separately
// evidenced islet. It cannot provide evidence of land, a claimant, or a border.
// Keep Taiwan, northern Cyprus, North Borneo, and coast-adjacent islands split
// into their individual outlines so nearby mainland regions are unaffected.
const offshoreGroups = new Set(['B12', 'B24', 'B32', 'B33', 'B44', 'B46', 'B47', 'B59', 'B66', 'B69', 'B70', 'B80', 'IMIA', 'MACHIAS']);
const reviewBins = new Map<number, number[][]>();
function addReviewBounds([w, s, e, n]: number[]) {
  // Two kilometres cope with differences between coast representations.
  // This padding is a review trigger only and is never an error-radius estimate.
  const dy = 2 / 110;
  const dx = dy / Math.cos(Math.max(Math.abs(n), Math.abs(s)) * Math.PI / 180);
  const box = [w - dx, s - dy, e + dx, n + dy];
  for (let y = floor(box[1] / unitDegrees); y <= floor(box[3] / unitDegrees); y++) {
    for (let x = floor(box[0] / unitDegrees); x <= floor(box[2] / unitDegrees); x++) {
      const k = bin(y * unitDegrees, x * unitDegrees);
      const bucket = reviewBins.get(k);
      if (bucket) bucket.push(box);
      else reviewBins.set(k, [box]);
    }
  }
}
for (const group of geometry.groups) {
  const boxes = [...group.polygons.map(p => p.bbox), ...group.previousBounds];
  for (const box of boxes) addReviewBounds(box);
  if (offshoreGroups.has(group.id)) {
    addReviewBounds([Math.min(...boxes.map(b => b[0])), Math.min(...boxes.map(b => b[1])),
      Math.max(...boxes.map(b => b[2])), Math.max(...boxes.map(b => b[3]))]);
  }
}

/** Call only after establishing island land; a true result alone establishes no claim or surface. */
export function needsIslandPolicyReview(lat: number, lon: number): boolean {
  const x = normalizeLongitude(lon);
  // Even optional island packs cannot assign Canadian or US ownership to this rock or reef.
  const [w, s, e, n] = northRockWindow.bbox;
  if (x >= w && x <= e && lat >= s && lat <= n) return true;
  return reviewBins.get(bin(lat, x))?.some(([w, s, e, n]) => x >= w && x <= e && lat >= s && lat <= n) ?? false;
}

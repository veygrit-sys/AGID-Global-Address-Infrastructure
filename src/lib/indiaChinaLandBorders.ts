import data from '../data/indiaChinaLandBorders.json';
import { classifyMapPolygon, indexMapPolygon } from './indexedMapPolygon';
import { unpackRing } from './packedMapRing';

type Tier = 'regional' | 'crossing' | 'dispute' | 'review';
const pointPriority: Record<Tier, number> = { regional: 0, review: 1, crossing: 2, dispute: 3 };
interface Part { bbox: number[]; rings: string[] }
interface BorderRecord {
  tier: Tier;
  codes: string[];
  name?: string;
  evidenceUrls?: string[];
  parts: Part[];
}
export interface LandBorderMatch {
  codes: string[];
  relation: 'inside' | 'boundary';
  source: string;
  version: string;
  disputedAreas?: string[];
  disputeCodes?: string[];
  reviewAreas?: string[];
  evidenceUrls?: string[];
  partialCoverage?: boolean;
}

const tiers = {
  regional: ['natural-earth-10m-admin-0-map-units', 'natural-earth-vector v5.1.2'],
  crossing: ['fieldmaps-usgs-lsib', '2025-07-29'],
  dispute: ['natural-earth-10m-admin-0-disputed-areas', 'natural-earth-vector v5.1.2'],
  review: ['agid-border-source-review', '1'],
} as const;

function lazy(part: Part) {
  let cache: ReturnType<typeof indexMapPolygon> | undefined;
  return { bbox: part.bbox, get geometry() {
    return cache ??= indexMapPolygon({ bbox: part.bbox, rings: part.rings.map(ring => unpackRing(ring, data.scale)) });
  } };
}
const parts = (data.records as BorderRecord[]).flatMap(record => record.parts.map(part => ({ record, shape: lazy(part) })));
const coverage = data.coverage.map(lazy);
const extent = [Math.min(...coverage.map(p => p.bbox[0])), Math.min(...coverage.map(p => p.bbox[1])),
  Math.max(...coverage.map(p => p.bbox[2])), Math.max(...coverage.map(p => p.bbox[3]))];

function contains(bbox: number[], lon: number, lat: number) {
  return lon >= bbox[0] && lon <= bbox[2] && lat >= bbox[1] && lat <= bbox[3];
}

function summarize(records: Set<BorderRecord>, boundary: boolean, partial: boolean): LandBorderMatch | undefined {
  if (!records.size) return undefined;
  const rows = [...records];
  const codes = [...new Set(rows.flatMap(r => r.codes))].sort();
  const sources = [...new Set(rows.map(r => tiers[r.tier][0]))].sort();
  const versions = [...new Set(rows.map(r => tiers[r.tier][1]))].sort();
  const disputes = rows.filter(r => r.tier === 'dispute');
  const reviews = rows.filter(r => r.tier === 'review').map(r => r.name!);
  const urls = [...new Set(rows.flatMap(r => r.evidenceUrls ?? []))];
  return {
    codes, relation: boundary ? 'boundary' : 'inside', source: sources.join('+'), version: versions.join('+'),
    ...(partial && { partialCoverage: true }),
    ...(disputes.length && {
      disputedAreas: disputes.map(r => r.name!).sort(),
      disputeCodes: [...new Set(disputes.flatMap(r => r.codes))].sort(),
    }),
    ...(reviews.length && { reviewAreas: reviews.sort() }), ...(urls.length && { evidenceUrls: urls }),
  };
}

export function matchLandBorderPoint(lat: number, lon: number): LandBorderMatch | undefined {
  if (!contains(extent, lon, lat)) return undefined;
  const hits = new Set<BorderRecord>();
  let edge = false;
  let priority = -1;
  for (const { shape, record } of parts) {
    const level = pointPriority[record.tier];
    if (level < priority || !contains(shape.bbox, lon, lat)) continue;
    const hit = classifyMapPolygon(lon, lat, shape.geometry);
    if (hit === 'outside') continue;
    // Clipped tiers both include their shared survey outline. At a point
    // on that outline, use the same source as the survey interior. Preserve
    // multiple records at that tier when the countries share an actual edge.
    if (level > priority) {
      hits.clear();
      priority = level;
      edge = false;
    }
    hits.add(record);
    edge ||= hit === 'boundary';
  }
  if (!hits.size) return undefined;
  // Only a shared edge between different candidates is a country boundary.
  // Internal source-window edges and the outer survey limit are not borders.
  const codes = new Set([...hits].flatMap(r => r.codes));
  const partial = edge && coverage.some(p => contains(p.bbox, lon, lat)
    && classifyMapPolygon(lon, lat, p.geometry) === 'boundary');
  return summarize(hits, edge && codes.size > 1, partial);
}

/** The compiled polygons form a mosaic. A disk meets a polygon if its centre
 * lies inside or it reaches a real polygon edge, including an interior hole. */
export function matchLandBorderDisk(lat: number, lon: number, overlaps: (box: number[]) => boolean,
  touchesRing: (ring: number[][]) => boolean): LandBorderMatch | undefined {
  if (!overlaps(extent)) return undefined;
  const hits = new Set<BorderRecord>();
  let centerCovered = false;
  for (const { shape, record } of parts) {
    if (!overlaps(shape.bbox)) continue;
    if (contains(shape.bbox, lon, lat) && classifyMapPolygon(lon, lat, shape.geometry) !== 'outside') {
      centerCovered = true;
      hits.add(record);
    } else if (!hits.has(record) && shape.geometry.rings.some(ring => touchesRing(ring.points))) {
      hits.add(record);
    }
  }
  if (!hits.size) return undefined;
  const partial = !centerCovered || coverage.some(p => overlaps(p.bbox) && p.geometry.rings.some(ring => touchesRing(ring.points)));
  const codeSets = new Set([...hits].map(record => record.codes.join('/')));
  return summarize(hits, codeSets.size > 1, partial);
}

export function needsBorderConfirmation(match: LandBorderMatch | undefined): boolean {
  return Boolean(match && (match.codes.length !== 1 || match.relation === 'boundary' || match.partialCoverage || match.reviewAreas || match.disputedAreas));
}

export function copyLandBorder(match: LandBorderMatch): LandBorderMatch {
  return { ...match, codes: [...match.codes],
    ...(match.disputedAreas && { disputedAreas: [...match.disputedAreas] }),
    ...(match.disputeCodes && { disputeCodes: [...match.disputeCodes] }),
    ...(match.reviewAreas && { reviewAreas: [...match.reviewAreas] }),
    ...(match.evidenceUrls && { evidenceUrls: [...match.evidenceUrls] }) };
}

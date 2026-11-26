import { matchBundledIsland, copyIslandAssessment, type AgidIslandAssessment } from './islandPolicy';
import { isJapaneseIslandReviewArea } from './japaneseIslandView';
/**
 * AGID (Address Grid ID) Complete Mathematical Definition Implementation
 * Global, CORDIC-rotated, Polar-ready, 12-character format.
 */

import namedSeaPrefixes from '../data/namedSeaPrefixes.json';
import { COUNTRIES } from '../constants/countries';
import { combineWasmU32Pair, getAgidWasmCore } from './agidWasm';
import { issuanceLongitude, quantizeAgidCell } from './agidProjection';
import { AGID_HASH_ALPHABET } from './agidSecurity';
import { parseAGIDCode, wrapCanonicalAGID } from './agid16';
export { normalizeAGIDCode, toAGID16, toLegacyAGID } from './agid16';
import { COUNTRY_REGIONS, LAND_REGIONS, SEA_REGIONS } from './regions';
import { hasCountryMapUnit, matchCountryMapUnits, matchReviewedCoastalWater, type CountryMapUnitMatch } from './countryMapUnits';
import { matchRegionalCoast } from './pearlRiverDelta';
import { matchBuesingenBoundary } from './buesingenBoundary';
import { mayHaveReviewedGeography } from './reviewedGeographyCoverage';
export { COUNTRY_REGIONS, LAND_REGIONS, SEA_REGIONS };

const BASE32_ALPHABET = AGID_HASH_ALPHABET;
const SEA_PREFIX_BY_ID = new Map(Object.entries(namedSeaPrefixes));
const OCEAN_IDS = ['NPAC', 'NEPC', 'SPAC', 'SEPC', 'NATL', 'SATL', 'NIND', 'SIND', 'SOUT', 'ARCT'] as const;
const PREFIX_LETTERS = 'ABCDEFGHJKMNPQRSTVWXYZ';

export const AGID_GRID_AXIS_BITS = 21;
export const AGID_GRID_AXIS_CELLS = 2 ** AGID_GRID_AXIS_BITS;
const K = AGID_GRID_AXIS_CELLS;
const M = AGID_GRID_AXIS_CELLS - 1;

/**
 * Equal-Area Transformation (E)
 * Based on the Tangent transformation to achieve near-uniform area on the sphere.
 */
function applyEqualArea(val: number): number {
  return Math.tan(val * Math.PI / 4);
}

function getQuantized(lat: number, lon: number) {
  const wasmCore = getAgidWasmCore();
  // Exact seams also run correctly if a browser still has a previous WASM binary cached.
  if (!wasmCore || lon === -180 || Math.abs(lat) === 90) return quantizeAgidCell(lat, lon);
  return {
    face: wasmCore.agid_get_quantized_face(lat, lon),
    qx: wasmCore.agid_get_quantized_qx(lat, lon),
    qy: wasmCore.agid_get_quantized_qy(lat, lon),
  };
}

/**
 * Inverse Cubed Sphere Projection
 */
function getFromQuantized(face: number, qx: number, qy: number) {
  const wasmCore = getAgidWasmCore();
  // The WASM ABI clamps to valid cell origins. Edge vertices and neighbor probes
  // can lie outside that domain and need the unclamped inverse projection.
  if (wasmCore && Number.isInteger(qx) && Number.isInteger(qy)
    && qx >= 0 && qx <= M && qy >= 0 && qy <= M) {
    return {
      lat: wasmCore.agid_get_lat(face, qx, qy),
      lon: wasmCore.agid_get_lon(face, qx, qy),
    };
  }

  const u = (qx / K) * 2.0 - 1.0;
  const v = (qy / K) * 2.0 - 1.0;

  // Apply Equal-Area correction (Tangent Map)
  const xi = applyEqualArea(u);
  const eta = applyEqualArea(v);

  let x = 0, y = 0, z = 0;
  switch (face) {
    case 0: x = 1; y = xi; z = eta; break;
    case 1: x = -1; y = -xi; z = eta; break;
    case 2: x = -xi; y = 1; z = eta; break;
    case 3: x = xi; y = -1; z = eta; break;
    case 4: x = -xi; y = -eta; z = 1; break;
    case 5: x = -xi; y = eta; z = -1; break;
  }

  const length = Math.sqrt(x * x + y * y + z * z);
  x /= length; y /= length; z /= length;

  const lat = (Math.asin(z) * 180) / Math.PI;
  const lon = (Math.atan2(y, x) * 180) / Math.PI;

  return { lat, lon };
}

/** Geographic prefixes are routing hints. Existing IDs keep their original prefix. */
export function generatePrefix(code: string, isSea: boolean, name: string): string {
  if (!isSea) {
    const upperCode = code.toUpperCase();
    if (/^[A-Z]{2}$/.test(upperCode)) return upperCode;
    const sum = (name + code).split('').reduce((total, char) => total + char.charCodeAt(0), 0);
    return `${sum % 10}${Math.floor(sum / 10) % 10}`;
  }

  const registered = SEA_PREFIX_BY_ID.get(code);
  if (registered) return registered;
  // Registered ocean subdivisions share the prefix of their parent ocean.
  for (const id of OCEAN_IDS) {
    if (code.includes(id)) return namedSeaPrefixes[id];
  }

  // Unregistered extensions get a deterministic hint without reserving a registered prefix.
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = (Math.imul(hash, 31) + code.charCodeAt(i)) | 0;
  const value = Math.abs(hash) % (10 * PREFIX_LETTERS.length);
  const coastal = !code.startsWith('O_') && /Sea|Coast|Strait|Bay|Gulf|Inlet|Channel|Pacific|Atlantic|Indian|Arctic|Southern/.test(name);
  return coastal
    ? `${Math.floor(value / PREFIX_LETTERS.length)}${PREFIX_LETTERS[value % PREFIX_LETTERS.length]}`
    : `${PREFIX_LETTERS[Math.floor(value / 10)]}${value % 10}`;
}

/**
 * Hilbert Curve Encoding
 * Interleaves x and y into a single 1D index.
 */
function rot(n: number, x: number, y: number, rx: number, ry: number) {
  if (ry === 0) {
    if (rx === 1) {
      x = n - 1 - x;
      y = n - 1 - y;
    }
    return [y, x];
  }
  return [x, y];
}

function encodeHilbert(n: number, x: number, y: number): bigint {
  const wasmCore = getAgidWasmCore();
  if (wasmCore && n === K) {
    const hi = wasmCore.agid_encode_hilbert_hi(x, y);
    const lo = wasmCore.agid_encode_hilbert_lo(x, y);
    return combineWasmU32Pair(hi, lo);
  }

  let d = 0n;
  for (let s = n / 2; s > 0; s = Math.floor(s / 2)) {
    const rx = (x & s) > 0 ? 1 : 0;
    const ry = (y & s) > 0 ? 1 : 0;
    d += BigInt(s) * BigInt(s) * BigInt((3 * rx) ^ ry);
    [x, y] = rot(s, x, y, rx, ry);
  }
  return d;
}

function decodeHilbert(n: number, d: bigint): { x: number, y: number } {
  const wasmCore = getAgidWasmCore();
  if (wasmCore && n === K) {
    const hi = Number((d >> 32n) & 0xFFFF_FFFFn);
    const lo = Number(d & 0xFFFF_FFFFn);
    return {
      x: wasmCore.agid_decode_hilbert_x(hi, lo),
      y: wasmCore.agid_decode_hilbert_y(hi, lo),
    };
  }

  let x = 0;
  let y = 0;
  let t = d;
  for (let s = 1; s < n; s *= 2) {
    const rx = Number(1n & (t / 2n));
    const ry = Number(1n & (t ^ BigInt(rx)));
    [x, y] = rot(s, x, y, rx, ry);
    x += s * rx;
    y += s * ry;
    t /= 4n;
  }
  return { x, y };
}

/**
 * 45-bit Packing: Face (3 bits) + Hilbert (42 bits)
 */
function packAGID(face: number, h: bigint): bigint {
  return (BigInt(face) << 42n) | h;
}

function unpackAGID(packed: bigint): { face: number, h: bigint } {
  const face = Number(packed >> 42n);
  const h = packed & ((1n << 42n) - 1n);
  return { face, h };
}

/**
 * Mountain Class (UNEP-WCMC) Definition
 * Based on "地理構造.pdf" Page 30
 */
export function calculateMountainClass(elevation: number, slope: number = 0, relief: number = 0): number {
  if (elevation > 4500) return 1;
  if (elevation > 3500) return 2;
  if (elevation > 2500) return 3;
  if (elevation > 1500 && slope > 2) return 4;
  if (elevation > 1000 && (slope >= 5 || relief > 300)) return 5;
  if (elevation > 300 && relief > 300) return 6;
  return 0;
}

/**
 * Consensus Metrics (Entropy & Confidence)
 * Based on "合意.pdf" Page 9
 */
export function calculateConsensusMetrics(probabilities: Map<string, number>): { entropy: number, confidence: number } {
  let entropy = 0;
  const size = probabilities.size;
  if (size <= 1) return { entropy: 0, confidence: 1 };

  probabilities.forEach((p) => {
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  });

  const maxEntropy = Math.log2(size);
  const confidence = 1 - (entropy / maxEntropy);

  return { entropy, confidence };
}

/**
 * Base32 Encoding (Fixed length)
 */
function encodeBase32(value: bigint, length: number): string {
  let result = "";
  let temp = value;
  for (let i = 0; i < length; i++) {
    const index = Number(temp % 32n);
    result = BASE32_ALPHABET[index] + result;
    temp /= 32n;
  }
  return result;
}

export interface AGIDResult {
  id: string; // Prefix + hash, optionally followed by version + checksum
  coordinateSource?: 'pin' | 'device' | 'cell';
  accuracyMeters?: number;
  prefix: string; // The 2-char alphanumeric prefix
  regionCode: string; // Internal country/territory code, including non-ISO disputed regions.
  hash: string; // 10-char hash
  isSea: boolean;
  gridSize: number;
  regionName: string;
  regionPolygon?: number[][];
  island?: AgidIslandAssessment;
  mapUnitMatch?: CountryMapUnitMatch;
  waterMatch?: Pick<CountryMapUnitMatch, 'source' | 'version' | 'attribution'>;
  coastalUncertainty?: Pick<CountryMapUnitMatch, 'source' | 'version' | 'attribution'>;
  administrativeMatch?: CountryMapUnitMatch;
  face: number;
  quantX: number;
  quantY: number;
  qx: number;
  qy: number;
  lat: number;
  lon: number;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  polygon: number[][];
}


export type AGIDCellInput = string | Pick<AGIDResult, 'id' | 'face' | 'qx' | 'qy'>;

export type AGIDAdjacentCell = {
  relation: 'edge-adjacent' | 'corner-adjacent';
  sourceCellKey: string;
  cellKey: string;
  agid: AGIDResult;
};

export type AGIDGridRelation =
  | 'same-cell'
  | 'edge-adjacent'
  | 'corner-adjacent'
  | 'separate'
  | 'invalid';

export type AGIDGridNeighborhoodMatch = {
  version: 'agid-grid-neighborhood-v0.1';
  gridAxisBits: typeof AGID_GRID_AXIS_BITS;
  relation: AGIDGridRelation;
  acceptedAsSameOrNearArea: boolean;
  boundaryMatch: boolean;
  leftCellKey: string | null;
  rightCellKey: string | null;
  nonClaims: string[];
};

/**
 * Core AGID Encoding
 * Redesigned for Cubed Sphere (21-bit precision per face axis).
 * This ensures near-uniform cell size (~4.78m) globally.
 */
export function encodeAGID(lat: number, lon: number): AGIDResult {
  const region = getRegionInfo(lat, lon);
  const normLon = issuanceLongitude(lat, lon);
  const regionCode = region.prefix.toUpperCase();
  const prefixCode = regionCode.startsWith("JP_") ? "JP" : region.prefix;
  const prefix = generatePrefix(prefixCode, region.isSea, region.name);

  // 1. Quantization: Cubed Sphere mapping with Equal-Area correction
  const { face, qx, qy } = getQuantized(lat, normLon);

  // 2. Hilbert & Base32
  // 10 characters Base32 = 50 bits.
  // 3 bits for face + 42 bits for Hilbert (L=21) = 45 bits.
  const hilbert = encodeHilbert(K, qx, qy);
  const packedValue = packAGID(face, hilbert);
  const hash = encodeBase32(packedValue, 10);

  return {
    id: prefix + hash,
    prefix,
    regionCode,
    hash,
    isSea: region.isSea,
    gridSize: 4.4, // ~4.4m average resolution (2^21 divisions per face)
    regionName: region.name,
    regionPolygon: region.polygon,
    ...(region.island && { island: region.island }),
    ...(region.mapUnitMatch && { mapUnitMatch: region.mapUnitMatch }),
    ...(region.waterMatch && { waterMatch: region.waterMatch }),
    ...(region.coastalUncertainty && { coastalUncertainty: region.coastalUncertainty }),
    ...(region.administrativeMatch && { administrativeMatch: region.administrativeMatch }),
    face,
    quantX: qx,
    quantY: qy,
    qx,
    qy,
    lat,
    lon,
    bounds: getCellBounds(face, qx, qy),
    polygon: getCellPolygon(face, qx, qy)
  };
}

/** Issue the opt-in checksummed form using the same grid, coordinates and prefix. */
export function encodeAGID16(lat: number, lon: number): AGIDResult {
  const result = encodeAGID(lat, lon);
  result.id = wrapCanonicalAGID(result.id);
  return result;
}

/**
 * Bounds Calculation for Cubed Sphere
 */
export function getCellPolygon(face: number, quantX: number, quantY: number, step: number = 1): number[][] {
  const adjusted = getAdjustedCellCorners(face, quantX, quantY, step);

  return [
    [adjusted[0].lon, adjusted[0].lat],
    [adjusted[1].lon, adjusted[1].lat],
    [adjusted[2].lon, adjusted[2].lat],
    [adjusted[3].lon, adjusted[3].lat],
    [adjusted[0].lon, adjusted[0].lat]
  ];
}

export function getCellCorners(face: number, quantX: number, quantY: number, step: number = 1) {
  const p1 = getFromQuantized(face, quantX, quantY);
  const p2 = getFromQuantized(face, quantX + step, quantY);
  const p3 = getFromQuantized(face, quantX + step, quantY + step);
  const p4 = getFromQuantized(face, quantX, quantY + step);

  return [p1, p2, p3, p4];
}

function getAdjustedCellCorners(face: number, quantX: number, quantY: number, step: number = 1) {
  const corners = getCellCorners(face, quantX, quantY, step);
  const refLon = corners[0].lon;

  return corners.map(corner => {
    let lon = corner.lon;
    if (lon - refLon > 180) lon -= 360;
    else if (lon - refLon < -180) lon += 360;
    return { ...corner, lon };
  });
}

export function getCellBounds(face: number, quantX: number, quantY: number, step: number = 1) {
  const corners = getAdjustedCellCorners(face, quantX, quantY, step);

  return {
    minLat: Math.min(...corners.map(c => c.lat)),
    maxLat: Math.max(...corners.map(c => c.lat)),
    minLon: Math.min(...corners.map(c => c.lon)),
    maxLon: Math.max(...corners.map(c => c.lon))
  };
}

/**
 * Core AGID Decoding
 */
export function decodeAGID(id: string): {
  lat: number;
  lon: number;
  isSea: boolean;
  prefix: string;
  face: number;
  qx: number;
  qy: number;
  bounds: AGIDResult['bounds'];
} | null {
  const code = parseAGIDCode(id);
  if (!code) return null;
  const prefix = code.legacyId.slice(0, 2);

  try {
    const { face, h } = unpackAGID(code.packed);
    const { x: quantX, y: quantY } = decodeHilbert(K, h);

    const { lat, lon } = getFromQuantized(face, quantX, quantY);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    return {
      lat,
      lon,
      isSea: false,
      prefix,
      face,
      qx: quantX,
      qy: quantY,
      bounds: getCellBounds(face, quantX, quantY),
    };
  } catch (e) {
    return null;
  }
}

function resolveAGIDCell(input: AGIDCellInput) {
  const id = typeof input === 'string' ? input : input.id;
  const decoded = decodeAGID(id);
  if (!decoded) return null;
  if (
    typeof input !== 'string'
    && (
      input.face !== decoded.face
      || input.qx !== decoded.qx
      || input.qy !== decoded.qy
    )
  ) {
    return null;
  }
  return decoded;
}

function agidCellKey(face: number, qx: number, qy: number) {
  return `${face}:${qx}:${qy}`;
}

export function getAGIDCellKey(input: AGIDCellInput): string | null {
  const cell = resolveAGIDCell(input);
  return cell ? agidCellKey(cell.face, cell.qx, cell.qy) : null;
}

/**
 * Returns the eight immediate cells around an AGID cell.
 *
 * Sampling through the sphere and re-encoding is intentional. Direct qx/qy
 * arithmetic is insufficient at cubed-sphere face edges, corners, poles, and
 * the antimeridian.
 */
export function getAdjacentAGIDCells(input: AGIDCellInput): AGIDAdjacentCell[] {
  const source = resolveAGIDCell(input);
  if (!source) return [];
  const sourceCellKey = agidCellKey(source.face, source.qx, source.qy);
  const neighbors = new Map<string, AGIDAdjacentCell>();

  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const center = getFromQuantized(
        source.face,
        source.qx + dx + 0.5,
        source.qy + dy + 0.5,
      );
      const agid = encodeAGID(center.lat, center.lon);
      const cellKey = agidCellKey(agid.face, agid.qx, agid.qy);
      if (cellKey === sourceCellKey) continue;
      const relation: AGIDAdjacentCell['relation'] =
        dx === 0 || dy === 0 ? 'edge-adjacent' : 'corner-adjacent';
      const existing = neighbors.get(cellKey);
      if (!existing || (
        existing.relation === 'corner-adjacent'
        && relation === 'edge-adjacent'
      )) {
        neighbors.set(cellKey, {
          relation,
          sourceCellKey,
          cellKey,
          agid,
        });
      }
    }
  }

  return [...neighbors.values()].sort((left, right) => {
    if (left.relation !== right.relation) {
      return left.relation === 'edge-adjacent' ? -1 : 1;
    }
    return left.cellKey.localeCompare(right.cellKey);
  });
}

export function matchAGIDGridNeighborhood(
  left: AGIDCellInput,
  right: AGIDCellInput,
): AGIDGridNeighborhoodMatch {
  const leftCellKey = getAGIDCellKey(left);
  const rightCellKey = getAGIDCellKey(right);
  let relation: AGIDGridRelation = 'invalid';

  if (leftCellKey && rightCellKey) {
    if (leftCellKey === rightCellKey) {
      relation = 'same-cell';
    } else {
      const neighbor = getAdjacentAGIDCells(left)
        .find(candidate => candidate.cellKey === rightCellKey);
      relation = neighbor?.relation || 'separate';
    }
  }

  return {
    version: 'agid-grid-neighborhood-v0.1',
    gridAxisBits: AGID_GRID_AXIS_BITS,
    relation,
    acceptedAsSameOrNearArea:
      relation === 'same-cell'
      || relation === 'edge-adjacent'
      || relation === 'corner-adjacent',
    boundaryMatch:
      relation === 'edge-adjacent'
      || relation === 'corner-adjacent',
    leftCellKey,
    rightCellKey,
    nonClaims: [
      'Cell proximity does not prove that two address records have the same referent.',
      'Adjacent cells do not prove a traversable entrance or carrier delivery route.',
      'Public AGID proximity must not disclose a unit, room, recipient, or access instruction.',
    ],
  };
}

// Spatial Cache for faster lookup (Grid Index)
// Grid Index Level (L1)
const GRID_INDEX: { [key: string]: { seas: any[], countries: any[], continents: any[] } } = {};
const GRID_SIZE = 2; // 2 degree cells as requested

// Rank is invariant across queries and spatial cells.
const HIGH_PRIORITY_CODES = [
  "EH", "BT_T", "CRIM", "DONB", "KASH", "SCSD", "EEBD", "TRNC", "SLND", "PMR",
  "PHIS", "BAAR", "CYGL", "XU", "XD", "EA", "JP_NT", "JP_TK", "JP_SK",
  "IS", "AX", "GL", "FO", "SJ_SVA", "SJ_JAN", "BQ", "GG", "JE", "IM", "GI", "XK",
  "SH", "AC", "TA", "PM",
];
const highPriorityRank = new Map(HIGH_PRIORITY_CODES.map((code, index) => [code, index]));

// Last Result Cache (L0)
let LAST_LAT = -999;
let LAST_LON = -999;
interface RegionInfo {
  prefix: string;
  isSea: boolean;
  gridSize: number;
  name: string;
  polygon?: number[][];
  island?: AgidIslandAssessment;
  mapUnitMatch?: CountryMapUnitMatch;
  waterMatch?: Pick<CountryMapUnitMatch, 'source' | 'version' | 'attribution'>;
  coastalUncertainty?: Pick<CountryMapUnitMatch, 'source' | 'version' | 'attribution'>;
  administrativeMatch?: CountryMapUnitMatch;
}

let LAST_RESULT: RegionInfo | null = null;
const mapUnitNames = new Map(COUNTRIES.map(c => [c.code, c.name]));

function copyRegionInfo(result: RegionInfo): RegionInfo {
  const copy = { ...result };
  if (copy.polygon) copy.polygon = copy.polygon.map(point => [...point]);
  if (copy.island) copy.island = copyIslandAssessment(copy.island);
  if (copy.mapUnitMatch) copy.mapUnitMatch = { ...copy.mapUnitMatch, codes: [...copy.mapUnitMatch.codes] };
  if (copy.coastalUncertainty) copy.coastalUncertainty = { ...copy.coastalUncertainty };
  if (copy.waterMatch) copy.waterMatch = { ...copy.waterMatch };
  if (copy.administrativeMatch) copy.administrativeMatch = { ...copy.administrativeMatch, codes: [...copy.administrativeMatch.codes] };
  return copy;
}

function rememberRegion(lat: number, lon: number, result: RegionInfo): RegionInfo {
  LAST_LAT = lat;
  LAST_LON = lon;
  LAST_RESULT = result;
  return copyRegionInfo(result);
}

function getSpatialKey(lat: number, lon: number) {
  const latIdx = Math.floor(lat / GRID_SIZE);
  const lonIdx = Math.floor(lon / GRID_SIZE);
  return `${latIdx},${lonIdx}`;
}

function getSpatialCell(lat: number, lon: number) {
  const key = getSpatialKey(lat, lon);
  if (GRID_INDEX[key]) return GRID_INDEX[key];

  const latIdx = Math.floor(lat / GRID_SIZE);
  const lonIdx = Math.floor(lon / GRID_SIZE);
  const s = latIdx * GRID_SIZE;
  const n = s + GRID_SIZE;
  const w = lonIdx * GRID_SIZE;
  const e = w + GRID_SIZE;

  const cell = {
    seas: SEA_REGIONS.filter(reg => {
      const latOverlap = Math.max(s, reg.s) <= Math.min(n, reg.n);
      let lonOverlap = false;
      if (reg.w > reg.e) { // Wrap
        lonOverlap = Math.max(w, reg.w) <= Math.min(e, 180) || Math.max(w, -180) <= Math.min(e, reg.e);
      } else {
        lonOverlap = Math.max(w, reg.w) <= Math.min(e, reg.e);
      }
      return latOverlap && lonOverlap;
    }),
    countries: COUNTRY_REGIONS.filter(reg => {
      // Map units replace these coarse rectangles, including on polygon misses.
      if (hasCountryMapUnit(reg.code) || ['JP_NT', 'JP_TK', 'JP_SK'].includes(reg.code ?? '')) return false;
      // Oceania's repository-placement alias duplicates the CL-EA address-format region.
      if (reg.code === 'CL-EI') return false;
      const latOverlap = Math.max(s, reg.s) <= Math.min(n, reg.n);
      let lonOverlap = false;
      if (reg.w > reg.e) { // Wrap
        lonOverlap = Math.max(w, reg.w) <= Math.min(e, 180) || Math.max(w, -180) <= Math.min(e, reg.e);
      } else {
        lonOverlap = Math.max(w, reg.w) <= Math.min(e, reg.e);
      }
      return latOverlap && lonOverlap;
    }),
    continents: LAND_REGIONS.filter(reg => {
      const latOverlap = Math.max(s, reg.s) <= Math.min(n, reg.n);
      let lonOverlap = false;
      if (reg.w > reg.e) { // Wrap
        lonOverlap = Math.max(w, reg.w) <= Math.min(e, 180) || Math.max(w, -180) <= Math.min(e, reg.e);
      } else {
        lonOverlap = Math.max(w, reg.w) <= Math.min(e, reg.e);
      }
      return latOverlap && lonOverlap;
    })
  };

  GRID_INDEX[key] = cell;
  return cell;
}

/**
 * Utility to check if a point is inside a polygon using ray-casting algorithm.
 * Includes a bounding box pre-check for performance.
 */
function isPointInPolygon(lat: number, lon: number, polygon: [number, number][] | [number, number][][], bounds?: { n: number, s: number, w: number, e: number }) {
  const EPS = 1e-10;

  // Bounding box pre-check
  if (bounds) {
    const inLon = bounds.w <= bounds.e
      ? (lon >= bounds.w - EPS && lon <= bounds.e + EPS)
      : (lon >= bounds.w - EPS || lon <= bounds.e + EPS);
    if (lat < bounds.s - EPS || lat > bounds.n + EPS || !inLon) return false;
  }

  // If no polygon data is provided but we matched the bounds, we treat it as a hit.
  if (!polygon) return true;

  const polygons = (Array.isArray(polygon) && Array.isArray(polygon[0]) && Array.isArray(polygon[0][0]))
    ? polygon as [number, number][][]
    : [polygon as [number, number][]];

  for (const poly of polygons) {
    const longitudes = poly.map(point => point[1]);
    const crossesAntimeridian = Math.max(...longitudes) - Math.min(...longitudes) > 180;
    const testLon = crossesAntimeridian && lon < 0 ? lon + 360 : lon;
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      // Data in JSON is [LAT, LON]
      const yi = poly[i][0], xi = crossesAntimeridian && poly[i][1] < 0 ? poly[i][1] + 360 : poly[i][1];
      const yj = poly[j][0], xj = crossesAntimeridian && poly[j][1] < 0 ? poly[j][1] + 360 : poly[j][1];

      const intersect = ((yi > lat) !== (yj > lat)) &&
        (testLon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}

/**
 * Optimized Country/Ocean detection with Sea-First logic.
 * Determination is based on the center of the 4m grid cell at high tide.
 */
const OCEANS = [
  // Polar Oceans first (Highest priority to avoid overlap with mid-latitude fallbacks)
  { id: "ARCT", n: 90, s: 66.5, w: -180, e: 180, name: "Arctic Ocean" },
  { id: "SOUT", n: -60, s: -90, w: -180, e: 180, name: "Southern Ocean" },

  // Atlantic
  { id: "NATL", n: 66.5, s: 0, w: -70, e: 20, name: "North Atlantic" },
  { id: "SATL", n: 0, s: -60, w: -67, e: 20, name: "South Atlantic" },

  // Indian
  { id: "NIND", n: 30, s: 0, w: 20, e: 100, name: "North Indian Ocean" },
  { id: "SIND", n: 0, s: -60, w: 20, e: 147, name: "South Indian Ocean" },

  // Pacific (split by IDL and Atlantic boundaries)
  { id: "NPAC", n: 66.5, s: 0, w: 100, e: 180, name: "North Pacific" },
  { id: "NEPC", n: 66.5, s: 0, w: -180, e: -70, name: "North Pacific" },
  { id: "SPAC", n: 0, s: -60, w: 147, e: 180, name: "South Pacific" },
  { id: "SEPC", n: 0, s: -60, w: -180, e: -67, name: "South Pacific" },
];

const COARSE_URBAN_ANCHORS = [
  { code: "KR", lat: 37.5665, lon: 126.9780, radiusKm: 80 },
  { code: "KP", lat: 39.0392, lon: 125.7625, radiusKm: 80 },
  { code: "VN", lat: 21.0278, lon: 105.8342, radiusKm: 100 },
  { code: "IN", lat: 28.6139, lon: 77.2090, radiusKm: 120 },
  { code: "PK", lat: 33.6844, lon: 73.0479, radiusKm: 120 },
  { code: "UZ", lat: 41.2995, lon: 69.2401, radiusKm: 100 },
  { code: "SY", lat: 33.5138, lon: 36.2765, radiusKm: 100 },
  { code: "AT", lat: 48.2082, lon: 16.3738, radiusKm: 35 },
  { code: "SK", lat: 48.1486, lon: 17.1077, radiusKm: 60 },
  { code: "SI", lat: 46.0569, lon: 14.5058, radiusKm: 70 },
  { code: "HR", lat: 45.8150, lon: 15.9819, radiusKm: 80 },
  { code: "IS", lat: 64.1466, lon: -21.9426, radiusKm: 100 },
  { code: "EE", lat: 59.4370, lon: 24.7536, radiusKm: 80 },
  { code: "LV", lat: 56.9496, lon: 24.1052, radiusKm: 80 },
  { code: "LT", lat: 54.6872, lon: 25.2797, radiusKm: 80 },
  { code: "MK", lat: 41.9981, lon: 21.4254, radiusKm: 80 },
  { code: "RU", lat: 55.7558, lon: 37.6173, radiusKm: 150 },
  { code: "CY", lat: 34.7071, lon: 33.0226, radiusKm: 80 },
  { code: "ES_CAN", lat: 28.2916, lon: -16.6291, radiusKm: 130 },
  { code: "PT_MAD", lat: 32.7607, lon: -16.9595, radiusKm: 80 },
  { code: "PT_AZO", lat: 37.7412, lon: -25.6756, radiusKm: 220 },
  { code: "DZ", lat: 36.7538, lon: 3.0588, radiusKm: 80 },
  { code: "SD", lat: 15.5007, lon: 32.5599, radiusKm: 100 },
  { code: "SS", lat: 4.8594, lon: 31.5713, radiusKm: 100 },
  { code: "CV", lat: 14.9330, lon: -23.5133, radiusKm: 120 },
  { code: "ML", lat: 12.6392, lon: -8.0029, radiusKm: 80 },
  { code: "NE", lat: 13.5116, lon: 2.1254, radiusKm: 80 },
  { code: "ZA", lat: -25.7479, lon: 28.2293, radiusKm: 90 },
  { code: "MW", lat: -13.9626, lon: 33.7741, radiusKm: 80 },
  { code: "CD", lat: -4.4419, lon: 15.2663, radiusKm: 35 },
  { code: "CG", lat: -4.2634, lon: 15.2429, radiusKm: 35 },
  { code: "TD", lat: 12.1348, lon: 15.0557, radiusKm: 80 },
  { code: "KM", lat: -11.7172, lon: 43.2473, radiusKm: 80 },
  { code: "RE", lat: -20.8823, lon: 55.4504, radiusKm: 80 },
  { code: "YT", lat: -12.7806, lon: 45.2279, radiusKm: 50 },
  { code: "IO", lat: -7.3195, lon: 72.4229, radiusKm: 160 },
  { code: "ST", lat: 0.3365, lon: 6.7273, radiusKm: 60 },
  { code: "HN", lat: 14.0723, lon: -87.1921, radiusKm: 80 },
  { code: "BM", lat: 32.2948, lon: -64.7814, radiusKm: 80 },
  { code: "AR", lat: -34.6037, lon: -58.3816, radiusKm: 90 },
  { code: "UY", lat: -34.9011, lon: -56.1645, radiusKm: 80 },
  { code: "CL-SG", lat: -26.4667, lon: -105.35, radiusKm: 50 },
  { code: "CP", lat: 10.2833, lon: -109.2167, radiusKm: 50 },
] as const;

const PRECISE_SEA_PRIORITY_IDS = new Set([
  "CASP", "BLCK", "BALT", "HUDS_L", "PGUL", "REDM", "MARM", "AZOV",
  "SETO", "TKYB", "OSKB", "ISEB", "ARIA", "OMUR",
  "CALI", "GMXC", "ENGC", "BISC", "ADRI", "AEGE", "GOMA", "BENG", "ANDM",
  "LACC", "ADEN", "KUTC", "KHAM",
  "LABR", "STLA", "FUND",
  "ESCH", "YELW", "BOHI", "SJPN", "BERI", "CORL", "SOLO", "BISM", "ARAF", "TIMR",
  "MALA", "GBRL", "COOK_S1", "BASS", "MGLN",
]);

const COARSE_OCEANIC_ARCHIPELAGO_CODES = new Set([
  "BM", "CV", "ES_CAN", "FK", "GS", "PT", "PT_AZO", "PT_MAD",
  "CC", "CX", "ID", "IO", "KM", "MU", "MV", "RE", "SC", "YT",
  "AS", "CK", "FJ", "FM", "GU", "KI", "MH", "MP", "NC", "PF",
  "PW", "SB", "TO", "TV", "UM", "VU", "WS",
]);

const COASTAL_LAND_ANCHORS = [
  { code: "JP", lat: 35.6812, lon: 139.7671, radiusKm: 16 },
  { code: "JP", lat: 35.4437, lon: 139.6380, radiusKm: 16 },
  { code: "JP", lat: 34.6937, lon: 135.5023, radiusKm: 16 },
  { code: "JP", lat: 35.1815, lon: 136.9066, radiusKm: 16 },
  { code: "JP", lat: 34.3853, lon: 132.4553, radiusKm: 16 },
  { code: "JP", lat: 33.5902, lon: 130.4017, radiusKm: 16 },
  { code: "TR", lat: 41.0082, lon: 28.9784, radiusKm: 18 },
  { code: "GR", lat: 37.9838, lon: 23.7275, radiusKm: 18 },
  { code: "SE", lat: 59.3293, lon: 18.0686, radiusKm: 18 },
  { code: "DK", lat: 55.6761, lon: 12.5683, radiusKm: 18 },
  { code: "FI", lat: 60.1699, lon: 24.9384, radiusKm: 18 },
  { code: "EE", lat: 59.4370, lon: 24.7536, radiusKm: 18 },
  { code: "LV", lat: 56.9496, lon: 24.1052, radiusKm: 18 },
  { code: "AX", lat: 60.0973, lon: 19.9348, radiusKm: 18 },
  { code: "HK", lat: 22.3193, lon: 114.1694, radiusKm: 18 },
  { code: "MO", lat: 22.1987, lon: 113.5439, radiusKm: 18 },
  { code: "TW", lat: 25.0330, lon: 121.5654, radiusKm: 18 },
  { code: "PH", lat: 14.5995, lon: 120.9842, radiusKm: 18 },
  { code: "SG", lat: 1.3521, lon: 103.8198, radiusKm: 18 },
  { code: "ID", lat: -6.2088, lon: 106.8456, radiusKm: 18 },
  { code: "TL", lat: -8.5569, lon: 125.5603, radiusKm: 18 },
  { code: "IN", lat: 15.4909, lon: 73.8278, radiusKm: 24 },
  { code: "IN", lat: 10.5593, lon: 72.6358, radiusKm: 35 },
  { code: "IN", lat: 9.9312, lon: 76.2673, radiusKm: 22 },
  { code: "IN", lat: 8.5241, lon: 76.9366, radiusKm: 22 },
  { code: "IN", lat: 23.2419, lon: 69.6669, radiusKm: 28 },
  { code: "IN", lat: 22.4707, lon: 70.0577, radiusKm: 28 },
  { code: "IN", lat: 21.7645, lon: 72.1519, radiusKm: 24 },
  { code: "IN", lat: 21.1702, lon: 72.8311, radiusKm: 28 },
  { code: "MV", lat: 6.7693, lon: 73.1700, radiusKm: 45 },
  { code: "MV", lat: 4.1755, lon: 73.5093, radiusKm: 45 },
  { code: "MV", lat: -0.6301, lon: 73.1587, radiusKm: 45 },
  { code: "SC", lat: -4.6200, lon: 55.4500, radiusKm: 55 },
  { code: "SC", lat: -9.4200, lon: 46.3500, radiusKm: 80 },
  { code: "MU", lat: -20.1609, lon: 57.5012, radiusKm: 45 },
  { code: "KM", lat: -11.7042, lon: 43.2402, radiusKm: 40 },
  { code: "KM", lat: -12.1696, lon: 44.3999, radiusKm: 35 },
  { code: "YT", lat: -12.7806, lon: 45.2279, radiusKm: 35 },
  { code: "RE", lat: -20.8823, lon: 55.4504, radiusKm: 45 },
  { code: "IO", lat: -7.3195, lon: 72.4229, radiusKm: 80 },
  { code: "CC", lat: -12.1888, lon: 96.8293, radiusKm: 18 },
  { code: "CX", lat: -10.4475, lon: 105.6904, radiusKm: 18 },
  { code: "YE", lat: 12.7855, lon: 45.0187, radiusKm: 35 },
  { code: "DJ", lat: 11.5721, lon: 43.1456, radiusKm: 30 },
  { code: "SO", lat: 10.4396, lon: 45.0143, radiusKm: 45 },
  { code: "FJ", lat: -18.1248, lon: 178.4501, radiusKm: 80 },
  { code: "VU", lat: -17.7333, lon: 168.3273, radiusKm: 70 },
  { code: "SB", lat: -9.4456, lon: 159.9729, radiusKm: 80 },
  { code: "NC", lat: -22.2758, lon: 166.4580, radiusKm: 70 },
  { code: "WS", lat: -13.8507, lon: -171.7514, radiusKm: 45 },
  { code: "KI", lat: 1.3278, lon: 172.9769, radiusKm: 45 },
  { code: "KI", lat: 1.8721, lon: -157.4278, radiusKm: 65 },
  { code: "TO", lat: -21.1394, lon: -175.2049, radiusKm: 55 },
  { code: "FM", lat: 6.9178, lon: 158.1850, radiusKm: 60 },
  { code: "PW", lat: 7.5006, lon: 134.6242, radiusKm: 45 },
  { code: "MH", lat: 7.1164, lon: 171.1858, radiusKm: 50 },
  { code: "TV", lat: -8.5243, lon: 179.1942, radiusKm: 45 },
  { code: "GU", lat: 13.4763, lon: 144.7502, radiusKm: 35 },
  { code: "MP", lat: 15.1778, lon: 145.7509, radiusKm: 45 },
  { code: "UM", lat: 19.2823, lon: 166.6470, radiusKm: 25 },
  { code: "AS", lat: -14.2756, lon: -170.7020, radiusKm: 55 },
  { code: "CK", lat: -21.2129, lon: -159.7823, radiusKm: 60 },
  { code: "PF", lat: -17.5516, lon: -149.5585, radiusKm: 70 },
  { code: "MY", lat: 3.1390, lon: 101.6869, radiusKm: 18 },
  { code: "MM", lat: 16.8409, lon: 96.1735, radiusKm: 18 },
  { code: "IN", lat: 19.0760, lon: 72.8777, radiusKm: 18 },
  { code: "LK", lat: 6.9271, lon: 79.8612, radiusKm: 18 },
  { code: "BD", lat: 23.8103, lon: 90.4125, radiusKm: 18 },
  { code: "OM", lat: 23.5880, lon: 58.3829, radiusKm: 18 },
  { code: "AE", lat: 25.2048, lon: 55.2708, radiusKm: 18 },
  { code: "QA", lat: 25.2854, lon: 51.5310, radiusKm: 18 },
  { code: "BH", lat: 26.2235, lon: 50.5876, radiusKm: 18 },
  { code: "KW", lat: 29.3759, lon: 47.9774, radiusKm: 18 },
  { code: "AZ", lat: 40.4093, lon: 49.8671, radiusKm: 35 },
  { code: "BM", lat: 32.2948, lon: -64.7814, radiusKm: 35 },
  { code: "CV", lat: 14.9330, lon: -23.5133, radiusKm: 60 },
  { code: "ES_CAN", lat: 28.2916, lon: -16.6291, radiusKm: 90 },
  { code: "PT", lat: 38.7223, lon: -9.1393, radiusKm: 320 },
  { code: "PT_MAD", lat: 32.7607, lon: -16.9595, radiusKm: 55 },
  { code: "PT_AZO", lat: 37.7412, lon: -25.6756, radiusKm: 110 },
  { code: "FK", lat: -51.6977, lon: -57.8517, radiusKm: 80 },
  { code: "GS", lat: -54.2811, lon: -36.5080, radiusKm: 60 },
  { code: "CA", lat: 44.6488, lon: -63.5752, radiusKm: 45 },
  { code: "CA", lat: 45.2733, lon: -66.0633, radiusKm: 35 },
  { code: "CA", lat: 47.5615, lon: -52.7126, radiusKm: 45 },
  { code: "PM", lat: 46.7811, lon: -56.1764, radiusKm: 20 },
  { code: "CRIM", lat: 44.9521, lon: 34.1024, radiusKm: 35 },
  { code: "GG", lat: 49.4657, lon: -2.5853, radiusKm: 12 },
  { code: "JE", lat: 49.2138, lon: -2.1358, radiusKm: 12 },
  { code: "GI", lat: 36.1408, lon: -5.3536, radiusKm: 8 },
  { code: "NZ", lat: -41.2865, lon: 174.7762, radiusKm: 18 },
  { code: "JP_SK", lat: 25.75, lon: 123.55, radiusKm: 25 },
  { code: "JP_NT", lat: 44.5, lon: 146.8, radiusKm: 90 },
  { code: "JP_TK", lat: 37.24, lon: 131.86, radiusKm: 8 },
  { code: "US", lat: 37.7749, lon: -122.4194, radiusKm: 18 },
  { code: "US", lat: 29.9511, lon: -90.0715, radiusKm: 18 },
] as const;

const COARSE_ARCHIPELAGO_LAND_ANCHORS = [
  { code: "ID", lat: 5.5483, lon: 95.3238, radiusKm: 95 },
  { code: "ID", lat: 3.5952, lon: 98.6722, radiusKm: 110 },
  { code: "ID", lat: -0.9471, lon: 100.4172, radiusKm: 110 },
  { code: "ID", lat: -2.9761, lon: 104.7754, radiusKm: 130 },
  { code: "ID", lat: -6.2088, lon: 106.8456, radiusKm: 120 },
  { code: "ID", lat: -6.9904, lon: 110.4229, radiusKm: 120 },
  { code: "ID", lat: -7.2575, lon: 112.7521, radiusKm: 130 },
  { code: "ID", lat: -8.6500, lon: 115.2167, radiusKm: 90 },
  { code: "ID", lat: -8.5831, lon: 116.1167, radiusKm: 80 },
  { code: "ID", lat: -10.1772, lon: 123.6070, radiusKm: 90 },
  { code: "ID", lat: -0.0263, lon: 109.3425, radiusKm: 140 },
  { code: "ID", lat: -1.2379, lon: 116.8529, radiusKm: 180 },
  { code: "ID", lat: -5.1477, lon: 119.4327, radiusKm: 130 },
  { code: "ID", lat: 1.4748, lon: 124.8421, radiusKm: 100 },
  { code: "ID", lat: -3.6954, lon: 128.1814, radiusKm: 120 },
  { code: "ID", lat: -2.5489, lon: 140.7195, radiusKm: 170 },
] as const;

const POLAR_COARSE_COUNTRY_CODES = new Set(["CA", "RU", "US"]);
const ANTARCTIC_INTERIOR_LATITUDE = -72;

const POLAR_LAND_ANCHORS = [
  { code: "CA", name: "Alert, Nunavut", lat: 82.5018, lon: -62.3481, radiusKm: 45 },
  { code: "CA", name: "Eureka, Nunavut", lat: 79.9900, lon: -85.9400, radiusKm: 55 },
  { code: "CA", name: "Resolute, Nunavut", lat: 74.6973, lon: -94.8297, radiusKm: 55 },
  { code: "CA", name: "Pond Inlet, Nunavut", lat: 72.6992, lon: -77.9592, radiusKm: 45 },
  { code: "US", name: "Utqiagvik, Alaska", lat: 71.2906, lon: -156.7886, radiusKm: 45 },
  { code: "US", name: "Deadhorse, Alaska", lat: 70.2002, lon: -148.4597, radiusKm: 45 },
  { code: "RU", name: "Tiksi", lat: 71.6872, lon: 128.8694, radiusKm: 70 },
  { code: "RU", name: "Pevek", lat: 69.7018, lon: 170.2999, radiusKm: 65 },
  { code: "RU", name: "Dikson", lat: 73.5071, lon: 80.5451, radiusKm: 70 },
  { code: "GL", name: "Nuuk", lat: 64.1835, lon: -51.7216, radiusKm: 70 },
  { code: "GL", name: "Qaanaaq", lat: 77.4670, lon: -69.2300, radiusKm: 75 },
  { code: "GL", name: "Station Nord", lat: 81.6000, lon: -16.6700, radiusKm: 80 },
  { code: "GL", name: "North Greenland coast", lat: 82.5000, lon: -40.0000, radiusKm: 120 },
  { code: "SJ_SVA", name: "Longyearbyen", lat: 78.2232, lon: 15.6469, radiusKm: 45 },
  { code: "SJ_JAN", name: "Jan Mayen", lat: 70.9820, lon: -8.5360, radiusKm: 30 },
  { code: "AQ", name: "McMurdo Station", lat: -77.8500, lon: 166.6700, radiusKm: 45 },
  { code: "AQ", name: "Amundsen-Scott South Pole Station", lat: -89.9990, lon: 0.0000, radiusKm: 80 },
  { code: "AQ", name: "Rothera Research Station", lat: -67.5680, lon: -68.1300, radiusKm: 35 },
  { code: "AQ", name: "Palmer Station", lat: -64.7740, lon: -64.0540, radiusKm: 30 },
  { code: "AQ", name: "Belgrano II Antarctic Base", lat: -77.8739, lon: -34.6278, radiusKm: 35 },
  { code: "AQ", name: "Casey Station", lat: -66.2825, lon: 110.5267, radiusKm: 45 },
  { code: "AQ", name: "Syowa Station", lat: -69.0060, lon: 39.5900, radiusKm: 45 },
  { code: "AQ", name: "Vostok Station", lat: -78.4640, lon: 106.8370, radiusKm: 55 },
  { code: "AQ", name: "Concordia Station", lat: -75.1000, lon: 123.3333, radiusKm: 55 },
  { code: "AQ", name: "Davis Station", lat: -68.5766, lon: 77.9674, radiusKm: 45 },
  { code: "AQ", name: "Mawson Station", lat: -67.6033, lon: 62.8738, radiusKm: 45 },
  { code: "AQ", name: "Halley Research Station", lat: -75.6050, lon: -26.2100, radiusKm: 65 },
  { code: "BV", name: "Bouvet Island", lat: -54.4208, lon: 3.3464, radiusKm: 25 },
  { code: "TF", name: "Kerguelen Islands", lat: -49.3500, lon: 70.2167, radiusKm: 90 },
  { code: "TF", name: "Crozet Islands", lat: -46.4300, lon: 51.8500, radiusKm: 85 },
  { code: "TF", name: "Amsterdam Island", lat: -37.8333, lon: 77.5500, radiusKm: 35 },
  { code: "TF", name: "Saint Paul Island", lat: -38.7200, lon: 77.5300, radiusKm: 30 },
] as const;

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const toRad = Math.PI / 180;
  const dLat = (bLat - aLat) * toRad;
  const dLon = (bLon - aLon) * toRad;
  const lat1 = aLat * toRad;
  const lat2 = bLat * toRad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * 6371.0088 * Math.asin(Math.sqrt(h));
}

function disambiguateCoarseCountryByAnchor(lat: number, lon: number, candidates: any[]) {
  if (candidates.length <= 1) return null;
  const candidateCodes = new Set(candidates.map(candidate => candidate.code));
  let best: { code: string; normalizedDistance: number } | null = null;

  for (const anchor of COARSE_URBAN_ANCHORS) {
    if (!candidateCodes.has(anchor.code)) continue;
    const distance = haversineKm(lat, lon, anchor.lat, anchor.lon);
    if (distance > anchor.radiusKm) continue;

    const normalizedDistance = distance / anchor.radiusKm;
    if (!best || normalizedDistance < best.normalizedDistance) {
      best = { code: anchor.code, normalizedDistance };
    }
  }

  return best ? candidates.find(candidate => candidate.code === best?.code) || null : null;
}

function isProtectedCoastalLandAnchor(lat: number, lon: number, candidates: any[]) {
  const candidateCodes = new Set(candidates.map(candidate => candidate.code));

  for (const anchor of COASTAL_LAND_ANCHORS) {
    if (!candidateCodes.has(anchor.code)) continue;
    if (haversineKm(lat, lon, anchor.lat, anchor.lon) <= anchor.radiusKm) return true;
  }

  return false;
}

function getPolarLandAnchor(lat: number, lon: number, candidates?: any[]) {
  const candidateCodes = candidates ? new Set(candidates.map(candidate => candidate.code)) : null;

  for (const anchor of POLAR_LAND_ANCHORS) {
    if (candidateCodes && !candidateCodes.has(anchor.code)) continue;
    if (haversineKm(lat, lon, anchor.lat, anchor.lon) <= anchor.radiusKm) return anchor;
  }

  return null;
}

function isProtectedCoarseArchipelagoLandAnchor(lat: number, lon: number, country: any) {
  for (const anchor of COARSE_ARCHIPELAGO_LAND_ANCHORS) {
    if (anchor.code !== country.code) continue;
    if (haversineKm(lat, lon, anchor.lat, anchor.lon) <= anchor.radiusKm) return true;
  }

  return false;
}

function isUnanchoredCoarseOceanicArchipelago(lat: number, lon: number, country: any) {
  return (
    COARSE_OCEANIC_ARCHIPELAGO_CODES.has(country.code) &&
    !isProtectedCoastalLandAnchor(lat, lon, [country]) &&
    !isProtectedCoarseArchipelagoLandAnchor(lat, lon, country)
  );
}

function isUnanchoredCoarsePolarCountry(lat: number, lon: number, country: any) {
  return (
    lat >= 80 &&
    POLAR_COARSE_COUNTRY_CODES.has(country.code) &&
    !getPolarLandAnchor(lat, lon, [country])
  );
}

/** Return a deterministic issuance hint plus any independently sourced map evidence. */
export function getRegionInfo(lat: number, lon: number): RegionInfo {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon)) {
    throw new RangeError('Latitude must be within [-90, 90] and longitude must be finite.');
  }
  const normLon = issuanceLongitude(lat, lon);

  if (LAST_RESULT && lat === LAST_LAT && normLon === LAST_LON) return copyRegionInfo(LAST_RESULT);
  const coast = mayHaveReviewedGeography(lat, normLon) ? matchRegionalCoast(lat, normLon) : undefined;
  if (coast?.requiresAgreement && coast.surface === 'unknown') {
    const { source, version, attribution } = coast;
    return rememberRegion(lat, normLon, {
      prefix: 'ISLAND_UNRESOLVED', name: 'Coastal source disagreement', gridSize: 4.4, isSea: false,
      coastalUncertainty: { source, version, attribution },
    });
  }
  const island = matchBundledIsland(lat, normLon, coast ?? null);
  if (!island && isJapaneseIslandReviewArea(lat, normLon)) {
    return rememberRegion(lat, normLon, lookupRegionalHint(lat, normLon, true));
  }
  const region = baseRegion(lat, normLon, coast);
  // The detailed regional shoreline surveys take priority over a generalized shoreline.
  if (!island || (coast && coast.surface !== 'land') ||
      (region.waterMatch && island.source.startsWith('natural-earth-global-island'))) {
    return rememberRegion(lat, normLon, region);
  }
  if (island.status === 'mapped' && region.mapUnitMatch && region.mapUnitMatch.codes.length === 1
      && !island.countryCodes.includes(region.mapUnitMatch.codes[0])) {
    island.countryCodes = [...region.mapUnitMatch.codes];
    delete island.sovereignCodes;
    island.source = region.mapUnitMatch.source;
    island.version = region.mapUnitMatch.version;
    island.relation = region.mapUnitMatch.relation;
  }
  return rememberRegion(lat, normLon, islandRegion(region, island));
}

// Existing address-format/QR hints for territories with their own postal conventions.
const parentOfIslandAddressRegion: Record<string,string> = { CP: 'FR', SJ_JAN: 'NO', SJ_SVA: 'NO', AC: 'SH', TA: 'SH' };
const islandTerritoryHints = new Set(['IO','FK','GS','UM','YT','AQ','TRNC','XU','XD','CYGL','TW','SCSD','EH']);

function islandRegion(region: RegionInfo, island: AgidIslandAssessment): RegionInfo {
  const groupCodes: Record<string,string> = { 'northern-territories': 'JP_NT', takeshima: 'JP_TK', senkaku: 'JP_SK' };
  const codes = island.countryCodes;
  const known = codes[0];
  const hint = region.prefix;
  const sameAddressRegion = !region.isSea && (codes.includes(hint)
    || codes.includes(hint.split(/[-_]/)[0]) || codes.includes(parentOfIslandAddressRegion[hint]));
  let prefix: string;
  if (island.status === 'japan-position') prefix = groupCodes[island.territory!];
  else if (known) prefix = sameAddressRegion ? hint : known;
  else prefix = !region.isSea && islandTerritoryHints.has(hint) ? hint : 'ISLAND_UNRESOLVED';
  const mapUnitMatch = region.mapUnitMatch && island.status === 'mapped' ? region.mapUnitMatch
    : { codes: [...codes], source: island.source, version: island.version, relation: island.relation };
  return {
    isSea: false, gridSize: region.gridSize, prefix, island, mapUnitMatch,
    name: island.territoryJa && island.status === 'japan-position' ? island.territoryJa
      : sameAddressRegion ? region.name : island.territory ?? mapUnitNames.get(prefix) ?? (known || 'Island'),
    ...(region.administrativeMatch && { administrativeMatch: region.administrativeMatch }),
  };
}

function baseRegion(lat: number, normLon: number, coast: ReturnType<typeof matchRegionalCoast>): RegionInfo {
  // 1. POLAR SPECIAL RULE (Fast exit)
  if (lat > 89.95) return { prefix: "ARCT", isSea: true, gridSize: 4.4, name: "North Pole", polygon: [[-180, 89.9],[-180, 90],[180, 90],[180, 89.9],[-180, 89.9]] };
  if (lat < -85.0) return { prefix: "AQ", isSea: false, gridSize: 4.4, name: "Antarctica" };

  const polarLandAnchor = getPolarLandAnchor(lat, normLon);
  if (polarLandAnchor) {
    return { prefix: polarLandAnchor.code, isSea: false, gridSize: 4.4, name: polarLandAnchor.name };
  }

  if (lat <= ANTARCTIC_INTERIOR_LATITUDE) {
    return { prefix: "AQ", isSea: false, gridSize: 4.4, name: "Antarctica" };
  }



  if (!mayHaveReviewedGeography(lat, normLon)) {
    return lookupRegionalHint(lat, normLon, false);
  }

  // Positive polygon evidence takes precedence over rectangular land and sea
  // hints. An exact shared edge retains all matching units and uses the first
  // ISO code for the deterministic prefix required by the legacy wire format.
  const mapUnitMatch = coast?.surface === 'land' && coast.codes.length > 0
    ? { source: coast.source, version: coast.version, codes: coast.codes, relation: coast.relation,
        ...(coast.attribution && { attribution: coast.attribution }) }
    : matchCountryMapUnits(lat, normLon);
  if (mapUnitMatch) {
    const prefix = mapUnitMatch.codes[0];
    return {
      prefix, isSea: false, gridSize: 4.4, name: mapUnitNames.get(prefix) ?? prefix, mapUnitMatch
    };
  }

  const waterMatch = coast?.surface === 'water'
    ? { source: coast.source, version: coast.version, ...(coast.attribution && { attribution: coast.attribution }) }
    : matchReviewedCoastalWater(lat, normLon);
  const result = lookupRegionalHint(lat, normLon, Boolean(waterMatch));
  if (waterMatch) result.waterMatch = waterMatch;

  // An administrative outline may include rivers. Preserve independent surface evidence.
  const administration = matchBuesingenBoundary(lat, normLon);
  if (administration) {
    result.administrativeMatch = administration;
    if (!result.isSea && result.prefix !== administration.codes[0]) {
      result.prefix = administration.codes[0];
      result.name = mapUnitNames.get(result.prefix) ?? result.prefix;
      delete result.polygon;
    }
  }
  return result;
}

function lookupRegionalHint(lat: number, normLon: number, skipLand: boolean): RegionInfo {
  const cell = getSpatialCell(lat, normLon);
  const landCandidates = skipLand ? [] : cell.countries;

  // Helper for smallest polygon logic
  const getArea = (n: number, s: number, w: number, e: number) => (n - s) * (w > e ? (180 - w + e + 180) : (e - w));
  const seaResult = (sea: any) => {
    const polyRaw = sea.polygons?.[0] || sea.polygon;
    let polySet = polyRaw;
    while (Array.isArray(polySet) && Array.isArray(polySet[0]) && Array.isArray(polySet[0][0])) {
      polySet = polySet[0];
    }

    return {
      prefix: sea.id,
      isSea: true,
      gridSize: 4.4,
      name: sea.name,
      polygon: polySet ? (polySet as [number, number][]).map(p => [p[1], p[0]]) : undefined
    };
  };

  if (!isProtectedCoastalLandAnchor(lat, normLon, landCandidates)) {
    let prioritySeaMatch: any = null;
    let prioritySeaMinArea = Infinity;

    for (const s of cell.seas) {
      if (!PRECISE_SEA_PRIORITY_IDS.has(s.id)) continue;
      const polyRaw = (s as any).polygons || s.polygon;
      if (!polyRaw || !isPointInPolygon(lat, normLon, polyRaw, s)) continue;

      const area = getArea(s.n, s.s, s.w, s.e);
      if (area < prioritySeaMinArea) {
        prioritySeaMinArea = area;
        prioritySeaMatch = s;
      }
    }

    if (prioritySeaMatch) {
      return seaResult(prioritySeaMatch);
    }
  }

  let countryMatch: any = null;
  let countryMinArea = Infinity;

  // 4. LAND CHECK (Countries) - Strict Polygon Check
  // [PRIORITIZE JAPAN, DISPUTED AREAS, OVERSEAS TERRITORIES & AUTONOMOUS REGIONS]
  const prioritized = landCandidates
    .filter(c => highPriorityRank.has(c.code))
    .sort((a, b) => (highPriorityRank.get(a.code) ?? Infinity) - (highPriorityRank.get(b.code) ?? Infinity));
  const others = landCandidates.filter(c => !highPriorityRank.has(c.code));
  const countryCandidates: any[] = [];

  for (const c of prioritized) {
    const polyRaw = (c as any).polygons || c.polygon;
    if (isPointInPolygon(lat, normLon, polyRaw, c)) {
      if (isUnanchoredCoarsePolarCountry(lat, normLon, c)) continue;
      if (!polyRaw) {
        if (isUnanchoredCoarseOceanicArchipelago(lat, normLon, c)) continue;
        countryCandidates.push(c);
        continue;
      }
      // Extract the first ring of the first polygon
      let polySet = polyRaw;
      while (Array.isArray(polySet) && Array.isArray(polySet[0]) && Array.isArray(polySet[0][0])) {
        polySet = polySet[0];
      }

      const res = {
        prefix: c.code,
        isSea: false,
        gridSize: 4.4,
        name: c.name,
        polygon: polySet ? (polySet as [number, number][]).map(p => [p[1], p[0]]) : undefined
      };
      return res;
    }
  }

  for (const c of others) {
    const polyRaw = (c as any).polygons || c.polygon;
    if (isPointInPolygon(lat, normLon, polyRaw, c)) {
      if (isUnanchoredCoarsePolarCountry(lat, normLon, c)) continue;
      if (!polyRaw && isUnanchoredCoarseOceanicArchipelago(lat, normLon, c)) continue;
      countryCandidates.push(c);
    }
  }

  const anchoredCountryMatch = disambiguateCoarseCountryByAnchor(lat, normLon, countryCandidates);
  if (anchoredCountryMatch) {
    countryMatch = anchoredCountryMatch;
  } else {
    for (const c of countryCandidates) {
      const area = getArea(c.n, c.s, c.w, c.e);
      if (area < countryMinArea) {
        countryMinArea = area;
        countryMatch = c;
      }
    }
  }

  if (countryMatch) {
    const polyRaw = countryMatch.polygons?.[0] || countryMatch.polygon;
    let polySet = polyRaw;
    while (Array.isArray(polySet) && Array.isArray(polySet[0]) && Array.isArray(polySet[0][0])) {
      polySet = polySet[0];
    }

    const res = {
      prefix: countryMatch.code,
      isSea: false,
      gridSize: 4.4,
      name: countryMatch.name,
      polygon: polySet ? (polySet as [number, number][]).map(p => [p[1], p[0]]) : undefined
    };
    return res;
  }

  // 5. SEA CHECK (Specific Major Seas)
  let seaMatch: any = null;
  let seaMinArea = Infinity;

  for (const s of cell.seas) {
    const polyRaw = (s as any).polygons || s.polygon;
    if (isPointInPolygon(lat, normLon, polyRaw, s)) {
      const area = getArea(s.n, s.s, s.w, s.e);
      if (area < seaMinArea) {
        seaMinArea = area;
        seaMatch = s;
      }
    }
  }

  if (seaMatch) {
    const res = seaResult(seaMatch);
    return res;
  }

  // 6. FALLBACK (Open Ocean / Ocean Grid with 1000km Subdivision)
  // Ensure the fallback covers all coordinate space for non-land areas
  let fallbackOcean = OCEANS.find(o => {
    const inLon = o.w <= o.e ? (normLon >= o.w && normLon <= o.e) : (normLon >= o.w || normLon <= o.e);
    return lat >= o.s && lat <= o.n && inLon;
  });

  // Emergency Global Fallback if no specific ocean matches (e.g. at boundaries)
  if (!fallbackOcean) {
    if (lat >= 0) fallbackOcean = { id: "NPAC", n: 90, s: 0, w: 0, e: 0, name: "North Pacific" };
    else fallbackOcean = { id: "SPAC", n: 0, s: -90, w: 0, e: 0, name: "South Pacific" };
  }

  const o = fallbackOcean;
  // 1000km Subdivision Logic
  const latBand = Math.floor(lat / 9) * 9;
  const cosLat = Math.cos(Math.abs(lat) * Math.PI / 180);
  const lonStep = cosLat > 0 ? Math.min(60, 9 / cosLat) : 60;
  const lonBand = Math.floor(normLon / lonStep) * lonStep;

  const subCode = `O_${o.id}_${latBand}_${Math.floor(lonBand)}`;
  const normalizeLon = (l: number) => {
    while (l > 180) l -= 360;
    while (l < -180) l += 360;
    return l;
  };

  const res = {
    prefix: subCode,
    isSea: true,
    gridSize: 4.4,
    name: `${o.name} (${Math.abs(latBand)}${latBand >= 0 ? 'N' : 'S'} ${Math.abs(Math.floor(lonBand))}${lonBand >= 0 ? 'E' : 'W'})`,
    polygon: [
      [lonBand, latBand],
      [lonBand, latBand + 9],
      [normalizeLon(lonBand + lonStep), latBand + 9],
      [normalizeLon(lonBand + lonStep), latBand],
      [lonBand, latBand]
    ]
  };
  return res;
}

/**
 * Utility to get continent for a country based on bounding box
 */
function getContinentForCountry(lat: number, lon: number): string {
  for (const l of LAND_REGIONS) {
    const inLon = l.w <= l.e ? (lon >= l.w && lon <= l.e) : (lon >= l.w || lon <= l.e);
    if (lat >= l.s && lat <= l.n && inLon) return l.name;
  }
  return "Other";
}

/**
 * Generates the full list of all countries for the registry.
 */
export function generateFullCountryRegistry(): any[] {
  const seen = new Set();
  const result: any[] = [];

  for (const c of COUNTRY_REGIONS) {
    if (seen.has(c.code)) continue;
    seen.add(c.code);

    const parentInfo = COUNTRIES.find(cnt => cnt.code === c.code);
    result.push({
      id: c.code,
      name: c.name,
      prefix: c.code,
      lat: (c.n + c.s) / 2,
      lon: (c.w + c.e) / 2,
      type: parentInfo?.type || 'Country',
      area: parentInfo?.region || getContinentForCountry((c.n + c.s) / 2, (c.w + c.e) / 2)
    });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Generates the full list of all sea areas including grid subdivisions.
 */
export function generateFullSeaRegistry(): any[] {
  const result: any[] = [];
  const seenIds = new Set();

  // 1. Add all IHO named regions
  for (const s of SEA_REGIONS) {
    if (seenIds.has(s.id)) continue;
    seenIds.add(s.id);

    const prefix = generatePrefix(s.id, true, s.name);
    const parentOcean = OCEANS.find(o => {
      const inLon = o.w <= o.e ? (s.w >= o.w && s.w <= o.e) : (s.w >= o.w || s.w <= o.e);
      return s.n >= o.s && s.n <= o.n && inLon;
    })?.name || "Other";

    result.push({
      id: s.id,
      name: s.name,
      prefix: prefix,
      lat: s.n,
      lon: s.w,
      type: 'Named Sea',
      area: parentOcean
    });
  }

  // 2. Add all Ocean Grid segments
  for (const o of OCEANS) {
    for (let lat = o.s; lat < o.n; lat += 9) {
      const cosLat = Math.cos(Math.abs(lat) * Math.PI / 180);
      const lonStep = cosLat > 0 ? Math.min(60, 9 / cosLat) : 60;

      const startLon = o.w;
      const endLon = o.e;
      const totalWidth = endLon >= startLon ? (endLon - startLon) : (180 - startLon + endLon + 180);

      for (let offset = 0; offset < totalWidth; offset += lonStep) {
        let lon = startLon + offset;
        while (lon > 180) lon -= 360;
        while (lon < -180) lon += 360;

        const subCode = `O_${o.id}_${lat}_${Math.floor(lon)}`;
        const name = `${o.name} (${Math.abs(lat)}${lat >= 0 ? 'N' : 'S'} ${Math.abs(Math.floor(lon))}${lon >= 0 ? 'E' : 'W'})`;
        const prefix = generatePrefix(subCode, true, name);

        result.push({
          id: subCode,
          name: name,
          prefix: prefix,
          lat: lat + 4.5,
          lon: lon + lonStep / 2,
          type: 'Ocean Segment',
          area: o.name
        });
      }
    }
  }

  return result;
}

/**
 * Calculates the total number of distinct sea areas including grid subdivisions.
 */
export function calculateTotalSeaAreas(): number {
  return generateFullSeaRegistry().length;
}

const gridCache = new Map<string, { gridLines: any[][], gridCells: any[] }>();

/**
 * Generates grid features for map visualization based on the new AGID spec.
 */
export function getGridFeatures(lat: number, lon: number, range: number) {
  const centerResult = encodeAGID(lat, lon);
  const { face, qx: quantX, qy: quantY } = centerResult;

  // Cache key
  const cacheKey = `${centerResult.id}_${range}`;
  if (gridCache.has(cacheKey)) {
    return gridCache.get(cacheKey)!;
  }

  const gridLines: any[][] = [];
  const gridCells: any[] = [];
  const seenIds = new Set<string>();

  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      const qx = quantX + dx;
      const qy = quantY + dy;

      const polyCoords = getCellPolygon(face, qx, qy);
      const cellId = `${face},${qx},${qy}`;
      if (seenIds.has(cellId)) continue;
      seenIds.add(cellId);

      gridLines.push([polyCoords[0], polyCoords[1]]);
      gridLines.push([polyCoords[1], polyCoords[2]]);
      gridLines.push([polyCoords[2], polyCoords[3]]);
      gridLines.push([polyCoords[3], polyCoords[0]]);

      gridCells.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [polyCoords] },
        properties: { id: cellId, isSea: centerResult.isSea }
      });
    }
  }

  const result = { gridLines, gridCells };
  gridCache.set(cacheKey, result);
  return result;
}

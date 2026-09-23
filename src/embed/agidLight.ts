import {
  AGID_BASE32_ALPHABET,
  AGID_FACE_AXIS_DIVISIONS,
  AGID_FACE_AXIS_MAX,
} from '../lib/agidContract';

const BASE32_ALPHABET = AGID_BASE32_ALPHABET;
const K = AGID_FACE_AXIS_DIVISIONS;
const M = AGID_FACE_AXIS_MAX;

export type AgidLightPoint = {
  lat: number;
  lon: number;
};

export type AgidLightBounds = {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
};

export type AgidLightResult = {
  id: string;
  prefix: string;
  hash: string;
  lat: number;
  lon: number;
  face: number;
  qx: number;
  qy: number;
  bounds: AgidLightBounds;
  polygon: number[][];
};

function applyEqualArea(value: number): number {
  return Math.tan((value * Math.PI) / 4);
}

function invertEqualArea(value: number): number {
  return (Math.atan(value) * 4) / Math.PI;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizeLon(lon: number): number {
  let normalized = lon;
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;
  return normalized;
}

export function isValidCoordinate(lat: number, lon: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90;
}

function sanitizePrefix(prefix: string | undefined): string {
  const normalized = (prefix || 'AG').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `${normalized}AG`.slice(0, 2);
}

function getQuantized(lat: number, lon: number) {
  const phi = (lat * Math.PI) / 180;
  const theta = (normalizeLon(lon) * Math.PI) / 180;

  const x = Math.cos(phi) * Math.cos(theta);
  const y = Math.cos(phi) * Math.sin(theta);
  const z = Math.sin(phi);

  const absX = Math.abs(x);
  const absY = Math.abs(y);
  const absZ = Math.abs(z);

  let face = 0;
  let uc = 0;
  let vc = 0;

  if (absX >= absY && absX >= absZ) {
    if (x > 0) {
      face = 0;
      uc = y;
      vc = z;
    } else {
      face = 1;
      uc = -y;
      vc = z;
    }
  } else if (absY >= absX && absY >= absZ) {
    if (y > 0) {
      face = 2;
      uc = -x;
      vc = z;
    } else {
      face = 3;
      uc = x;
      vc = z;
    }
  } else if (z > 0) {
    face = 4;
    uc = -x;
    vc = -y;
  } else {
    face = 5;
    uc = -x;
    vc = y;
  }

  const maxValue = Math.max(absX, absY, absZ);
  const xi = uc / maxValue;
  const eta = vc / maxValue;
  const u = 0.5 * (invertEqualArea(xi) + 1);
  const v = 0.5 * (invertEqualArea(eta) + 1);

  return {
    face,
    qx: clamp(Math.floor(u * K), 0, M),
    qy: clamp(Math.floor(v * K), 0, M),
  };
}

function getFromQuantized(face: number, qx: number, qy: number): AgidLightPoint {
  const u = (qx / K) * 2 - 1;
  const v = (qy / K) * 2 - 1;
  const xi = applyEqualArea(u);
  const eta = applyEqualArea(v);

  let x = 0;
  let y = 0;
  let z = 0;

  switch (face) {
    case 0:
      x = 1;
      y = xi;
      z = eta;
      break;
    case 1:
      x = -1;
      y = -xi;
      z = eta;
      break;
    case 2:
      x = -xi;
      y = 1;
      z = eta;
      break;
    case 3:
      x = xi;
      y = -1;
      z = eta;
      break;
    case 4:
      x = -xi;
      y = -eta;
      z = 1;
      break;
    case 5:
      x = -xi;
      y = eta;
      z = -1;
      break;
    default:
      throw new Error(`Invalid AGID face: ${face}`);
  }

  const length = Math.sqrt(x * x + y * y + z * z);
  x /= length;
  y /= length;
  z /= length;

  return {
    lat: (Math.asin(z) * 180) / Math.PI,
    lon: normalizeLon((Math.atan2(y, x) * 180) / Math.PI),
  };
}

function rotateHilbert(n: number, x: number, y: number, rx: number, ry: number) {
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
  let d = 0n;
  for (let s = n / 2; s > 0; s = Math.floor(s / 2)) {
    const rx = (x & s) > 0 ? 1 : 0;
    const ry = (y & s) > 0 ? 1 : 0;
    d += BigInt(s) * BigInt(s) * BigInt((3 * rx) ^ ry);
    [x, y] = rotateHilbert(s, x, y, rx, ry);
  }
  return d;
}

function decodeHilbert(n: number, d: bigint) {
  let x = 0;
  let y = 0;
  let t = d;

  for (let s = 1; s < n; s *= 2) {
    const rx = Number(1n & (t / 2n));
    const ry = Number(1n & (t ^ BigInt(rx)));
    [x, y] = rotateHilbert(s, x, y, rx, ry);
    x += s * rx;
    y += s * ry;
    t /= 4n;
  }

  return { x, y };
}

function encodeBase32(value: bigint, length: number): string {
  let result = '';
  let temp = value;
  for (let i = 0; i < length; i++) {
    const index = Number(temp % 32n);
    result = BASE32_ALPHABET[index] + result;
    temp /= 32n;
  }
  return result;
}

function decodeBase32(hash: string): bigint {
  let result = 0n;
  for (const char of hash) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index < 0) throw new Error(`Invalid AGID hash character: ${char}`);
    result = result * 32n + BigInt(index);
  }
  return result;
}

function packAgid(face: number, h: bigint): bigint {
  return (BigInt(face) << 42n) | h;
}

function unpackAgid(packed: bigint) {
  return {
    face: Number(packed >> 42n),
    h: packed & ((1n << 42n) - 1n),
  };
}

function getCellCorners(face: number, qx: number, qy: number) {
  return [
    getFromQuantized(face, qx, qy),
    getFromQuantized(face, qx + 1, qy),
    getFromQuantized(face, qx + 1, qy + 1),
    getFromQuantized(face, qx, qy + 1),
  ];
}

function getAdjustedCellCorners(face: number, qx: number, qy: number) {
  const corners = getCellCorners(face, qx, qy);
  const refLon = corners[0].lon;

  return corners.map((corner) => {
    let lon = corner.lon;
    if (lon - refLon > 180) lon -= 360;
    if (lon - refLon < -180) lon += 360;
    return { ...corner, lon };
  });
}

export function getCellBounds(face: number, qx: number, qy: number): AgidLightBounds {
  const corners = getAdjustedCellCorners(face, qx, qy);
  return {
    minLat: Math.min(...corners.map((corner) => corner.lat)),
    maxLat: Math.max(...corners.map((corner) => corner.lat)),
    minLon: Math.min(...corners.map((corner) => corner.lon)),
    maxLon: Math.max(...corners.map((corner) => corner.lon)),
  };
}

export function getCellPolygon(face: number, qx: number, qy: number): number[][] {
  const corners = getAdjustedCellCorners(face, qx, qy);
  const adjusted = corners.map((corner) => [corner.lon, corner.lat]);

  return [adjusted[0], adjusted[1], adjusted[2], adjusted[3], adjusted[0]];
}

export function encodeAgidLight(lat: number, lon: number, prefix?: string): AgidLightResult {
  if (!isValidCoordinate(lat, lon)) {
    throw new Error('Invalid coordinates for AGID embed');
  }

  const normalizedLon = normalizeLon(lon);
  const { face, qx, qy } = getQuantized(lat, normalizedLon);
  const hilbert = encodeHilbert(K, qx, qy);
  const hash = encodeBase32(packAgid(face, hilbert), 10);
  const cleanPrefix = sanitizePrefix(prefix);

  return {
    id: cleanPrefix + hash,
    prefix: cleanPrefix,
    hash,
    lat,
    lon: normalizedLon,
    face,
    qx,
    qy,
    bounds: getCellBounds(face, qx, qy),
    polygon: getCellPolygon(face, qx, qy),
  };
}

export function decodeAgidLight(rawId: string): AgidLightResult | null {
  const id = rawId.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (id.length !== 12) return null;

  const prefix = id.slice(0, 2);
  const hash = id.slice(2);

  try {
    const packed = decodeBase32(hash);
    const { face, h } = unpackAgid(packed);
    if (face < 0 || face > 5) return null;
    const { x: qx, y: qy } = decodeHilbert(K, h);
    const { lat, lon } = getFromQuantized(face, qx, qy);

    return {
      id,
      prefix,
      hash,
      lat,
      lon,
      face,
      qx,
      qy,
      bounds: getCellBounds(face, qx, qy),
      polygon: getCellPolygon(face, qx, qy),
    };
  } catch {
    return null;
  }
}

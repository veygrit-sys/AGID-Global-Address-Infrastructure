import { decodeAGID, encodeAGID, getCellPolygon, normalizeAGIDCode, type AGIDResult } from './agid';
import { AGID_TOTAL_LENGTH } from './agidContract';

type AgidLike = {
  id?: string;
  lat?: number;
  lon?: number;
};

export function getAgidCoordinates(agid: AgidLike | null | undefined): { lat: number; lon: number } | null {
  if (!agid) return null;

  if (agid.id) {
    const decoded = decodeAGID(agid.id);
    if (decoded) {
      return { lat: decoded.lat, lon: decoded.lon };
    }
  }

  if (Number.isFinite(agid.lat) && Number.isFinite(agid.lon)) {
    return { lat: agid.lat as number, lon: agid.lon as number };
  }

  return null;
}

// Recognize code-shaped queries before falling back to a place-name search.
// A valid packed cell starts with 0 and a version-1 suffix starts with 1.
export function looksLikeAGID16(query: string): boolean {
  const input = query.trim();
  return /^(?:[A-Za-z0-9]{2}0[A-Za-z0-9]{13}|[A-Za-z0-9]{12}1[A-Za-z0-9]{3}|[A-Za-z0-9]{4}(?:-[A-Za-z0-9]{4}){3})$/.test(input);
}

export function decodeAgidToResult(agidId: string): AGIDResult | null {
  const decoded = decodeAGID(agidId);
  if (!decoded) return null;
  const normalizedId = normalizeAGIDCode(agidId);
  if (!normalizedId) return null;
  const approximate = encodeAGID(decoded.lat, decoded.lon);
  const prefix = normalizedId.slice(0, 2);
  const hash = normalizedId.slice(2, AGID_TOTAL_LENGTH);
  return {
    ...approximate,
    id: normalizedId,
    prefix,
    hash,
    face: decoded.face,
    quantX: decoded.qx,
    quantY: decoded.qy,
    qx: decoded.qx,
    qy: decoded.qy,
    lat: decoded.lat,
    lon: decoded.lon,
    bounds: decoded.bounds,
    polygon: getCellPolygon(decoded.face, decoded.qx, decoded.qy),
  };
}

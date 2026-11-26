import { decodeAGID, encodeAGID, getCellPolygon, normalizeAGIDCode, type AGIDResult } from './agid';
import { AGID_TOTAL_LENGTH } from './agidContract';
import type { AgidGeographyInput } from './geographicAssessment';

type AgidLike = {
  id?: string;
  lat?: number;
  lon?: number;
  coordinateSource?: AGIDResult['coordinateSource'];
  accuracyMeters?: number;
};

export function getAgidCoordinates(agid: AgidLike | null | undefined): { lat: number; lon: number } | null {
  if (!agid) return null;
  const { lat, lon } = agid;
  if (agid.coordinateSource !== 'cell' && typeof lat === 'number' && Math.abs(lat) <= 90
    && typeof lon === 'number' && Number.isFinite(lon)) {
    return { lat, lon };
  }
  if (agid.id) {
    const decoded = decodeAGID(agid.id);
    if (decoded) {
      return { lat: decoded.lat, lon: decoded.lon };
    }
  }

  return null;
}

export function deviceAgidSelection({ latitude, longitude, accuracy }: Pick<GeolocationCoordinates, 'latitude' | 'longitude' | 'accuracy'>): AGIDResult {
  return {
    ...encodeAGID(latitude, longitude),
    coordinateSource: 'device',
    ...(Number.isFinite(accuracy) && accuracy >= 0 && { accuracyMeters: accuracy }),
  };
}

export function selectedGeographyInput(result: AGIDResult): AgidGeographyInput {
  if (result.coordinateSource === 'cell') return { kind: 'cell', id: result.id };
  return {
    kind: 'pin', lat: result.lat, lon: result.lon,
    method: result.coordinateSource === 'device' ? 'device' : 'manual',
    accuracyMeters: result.accuracyMeters,
  };
}

export function restoreAgidSelection(saved: AgidLike): AGIDResult | null {
  const cell = saved.id ? decodeAgidToResult(saved.id) : null;
  const coordinates = getAgidCoordinates({ lat: saved.lat, lon: saved.lon });
  if (!coordinates || saved.coordinateSource === 'cell') return cell;
  const { lat, lon } = coordinates;
  // Older records containing only a decoded representative cannot establish an original pin.
  if (cell && !saved.coordinateSource && cell.lat === lat && cell.lon === lon) return cell;
  const pin = encodeAGID(lat, lon);
  if (cell && cell.hash !== pin.hash) return cell;
  const accuracy = saved.accuracyMeters;
  return {
    ...pin, ...(cell && { id: cell.id, hash: cell.hash, prefix: cell.prefix }),
    coordinateSource: saved.coordinateSource === 'device' ? 'device' : 'pin',
    ...(saved.coordinateSource === 'device' && typeof accuracy === 'number' && Number.isFinite(accuracy) && accuracy >= 0
      && { accuracyMeters: accuracy }),
  };
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
  // These properties describe an observed point. An issued cell does not preserve that pin.
  delete approximate.island;
  delete approximate.mapUnitMatch;
  delete approximate.waterMatch;
  delete approximate.administrativeMatch;
  const prefix = normalizedId.slice(0, 2);
  const hash = normalizedId.slice(2, AGID_TOTAL_LENGTH);
  return {
    ...approximate,
    coordinateSource: 'cell',
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

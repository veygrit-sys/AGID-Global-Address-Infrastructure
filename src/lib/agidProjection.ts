import { AGID_FACE_AXIS_DIVISIONS as K, AGID_FACE_AXIS_MAX as M } from './agidContract';

/** Normalize only the representation of a longitude, without rounding nearby coordinates. */
export function normalizeLongitude(lon: number): number {
  if (lon >= -180 && lon < 180) return lon;
  const remainder = lon % 360;
  if (remainder >= 180) return remainder - 360;
  if (remainder < -180) return remainder + 360;
  return remainder;
}

export function issuanceLongitude(lat: number, lon: number): number {
  return Math.abs(lat) === 90 ? 0 : normalizeLongitude(lon);
}

function invertEqualArea(value: number): number {
  return Math.atan(value) * 4 / Math.PI;
}

/** Project a validated latitude and a canonical issuance longitude to the cubed sphere. */
export function quantizeAgidCell(lat: number, lon: number) {
  // The exact poles are face centers. cos(±π/2) has rounding residue.
  if (Math.abs(lat) === 90) return { face: lat > 0 ? 4 : 5, qx: K / 2, qy: K / 2 };
  const phi = (lat * Math.PI) / 180;
  const theta = (lon * Math.PI) / 180;

  const x = Math.cos(phi) * Math.cos(theta);
  // Sin(−π) is mathematically zero on the canonical antimeridian.
  const y = lon === -180 ? 0 : Math.cos(phi) * Math.sin(theta);
  const z = Math.sin(phi);

  const absX = Math.abs(x);
  const absY = Math.abs(y);
  const absZ = Math.abs(z);

  let face = 0;
  let uc = 0;
  let vc = 0;

  if (absX >= absY && absX >= absZ) {
    if (x > 0) { face = 0; uc = y; vc = z; }
    else { face = 1; uc = -y; vc = z; }
  } else if (absY >= absX && absY >= absZ) {
    if (y > 0) { face = 2; uc = -x; vc = z; }
    else { face = 3; uc = x; vc = z; }
  } else {
    if (z > 0) { face = 4; uc = -x; vc = -y; }
    else { face = 5; uc = -x; vc = y; }
  }

  const maxVal = Math.max(absX, absY, absZ);
  const xi = uc / maxVal;
  const eta = vc / maxVal;

  // Apply Equal-Area correction
  const u = 0.5 * (invertEqualArea(xi) + 1.0);
  const v = 0.5 * (invertEqualArea(eta) + 1.0);

  return {
    face,
    qx: Math.max(0, Math.min(M, Math.floor(u * K))),
    qy: Math.max(0, Math.min(M, Math.floor(v * K)))
  };
}

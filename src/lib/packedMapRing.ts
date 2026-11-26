/** Decode a WGS84 line from base64-encoded, zigzag-varint coordinate deltas. */
export function unpackMapLine(encoded: string, scale: number): number[][] {
  const bytes = atob(encoded);
  const points: number[][] = [];
  let offset = 0, x = 0, y = 0;
  function next() {
    let total = 0, factor = 1, byte: number;
    do {
      byte = bytes.charCodeAt(offset++);
      total += (byte & 127) * factor;
      factor *= 128;
    } while (byte >= 128);
    return total % 2 ? -(total + 1) / 2 : total / 2;
  }
  while (offset < bytes.length) {
    x += next();
    y += next();
    points.push([x / scale, y / scale]);
  }
  return points;
}

export function unpackMapRing(encoded: string, scale: number): number[][] {
  const points = unpackMapLine(encoded, scale);
  if (points.length) points.push(points[0]);
  return points;
}

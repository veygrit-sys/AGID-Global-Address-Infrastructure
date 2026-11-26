/** Decode a closed WGS84 ring from base64-encoded, zigzag-varint coordinate deltas. */
export function unpackMapRing(encoded: string, scale: number): number[][] {
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
  points.push(points[0]);
  return points;
}

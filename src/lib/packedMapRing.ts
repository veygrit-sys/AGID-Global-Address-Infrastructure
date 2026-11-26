// Base-32 signed deltas, [longitude, latitude], dataset-specific scale. Keep
// arithmetic outside JS signed bitwise overflow for the first longitude.
export function unpackRing(text: string, scale: number): number[][] {
  const ring: number[][] = [];
  let offset = 0;
  let x = 0;
  let y = 0;
  function nextDelta() {
    let packed = 0;
    let multiplier = 1;
    let digit: number;
    do {
      digit = text.charCodeAt(offset++) - 63;
      packed += (digit & 31) * multiplier;
      multiplier *= 32;
    } while (digit >= 32);
    return packed % 2 === 1 ? -(packed + 1) / 2 : packed / 2;
  }
  while (offset < text.length) {
    x += nextDelta();
    y += nextDelta();
    ring.push([x / scale, y / scale]);
  }
  return ring;
}

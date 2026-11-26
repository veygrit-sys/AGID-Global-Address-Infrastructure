import regional from '../data/global-islands/landform-regions.json';
import north from '../data/global-islands/landform-grid-0.json';
import south from '../data/global-islands/landform-grid-1.json';

const grid = 16;
const columns = 360 * grid;
const rowCount = 180 * grid;
const cache = new Map<number, { ends: number[]; values: number[] }>();

function rowAt(index: number) {
  const hit = cache.get(index);
  if (hit) return hit;
  const hemisphere = index < north.length ? north : south;
  const bytes = atob(hemisphere[index % north.length]);
  const ends: number[] = [], values: number[] = [];
  let pos = 0, end = 0;
  function integer() {
    let total = 0, factor = 1, byte: number;
    do {
      byte = bytes.charCodeAt(pos++);
      total += (byte & 127) * factor;
      factor *= 128;
    } while (byte >= 128);
    return total;
  }
  while (pos < bytes.length) {
    end += integer();
    ends.push(end);
    values.push(integer());
  }
  const row = { ends, values };
  if (cache.size >= 24) cache.delete(cache.keys().next().value!);
  cache.set(index, row);
  return row;
}

function cellValue(y: number, x: number) {
  const row = rowAt(y);
  const column = ((x % columns) + columns) % columns;
  let low = 0, high = row.ends.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (column < row.ends[mid]) high = mid;
    else low = mid + 1;
  }
  return row.values[low];
}

export function landformBounds(lat: number, lon: number, meters: number) {
  const angular = meters / 6_371_008.8;
  const dy = angular * 180 / Math.PI;
  const dx = Math.abs(lat) + dy >= 90 ? 180 :
    Math.asin(Math.min(1, Math.sin(angular) / Math.cos(lat * Math.PI / 180))) * 180 / Math.PI;
  return [lon - dx, Math.max(-90, lat - dy), lon + dx, Math.min(90, lat + dy)];
}

/** Each >=2 value certifies the interior of a single physical source component.
 * A value of 1 guards mapped hydrography, and 0 carries no positive land evidence. */
export function landformCertificate(bounds: number[]) {
  const [west, south, east, north] = bounds;
  const firstX = Math.ceil((west + 180) * grid) - 1, lastX = Math.floor((east + 180) * grid);
  const indexY = (lat: number) => Math.min(rowCount - 1, Math.max(0, Math.floor((90 - lat) * grid)));
  const firstY = Math.max(0, Math.ceil((90 - north) * grid) - 1), lastY = indexY(south);
  // Large footprints would require a disproportionate scan and rarely prove a single landform.
  if ((lastX - firstX + 1) * (lastY - firstY + 1) > 4096) return { guarded: true };
  let member: number | undefined;
  let hydroContact = false;
  for (let y = firstY; y <= lastY; y++) {
    for (let x = firstX; x <= lastX; x++) {
      const value = cellValue(y,x);
      hydroContact ||= value === 1 || value === 65535;
      member = member === undefined ? value : member === value ? value : -1;
    }
  }
  return { guarded: hydroContact, inlandWater: member === 65535,
    component: !hydroContact && member !== undefined && member >= 2 ? member - 2 : undefined };
}

const localBits = new Map<string, string>();
export const regionalLandformSource = {
  source: 'worldcover-dry-land+gshhg+natural-earth',
  version: regional.version, attribution: regional.attribution,
};

/** A regional window takes precedence wherever it has more specific land-cover
 * evidence. The clipped footprint must be fully covered by dry, continental cells. */
export function regionalLandformCertificate(bounds: number[]) {
  const [w,s,e,n] = bounds;
  const k = regional.scale;
  for (const area of regional.windows) {
    const [west,north] = area.origin, [width,height] = area.dim;
    if (west > e*k || west + width < w*k || north - height > n*k || north < s*k) continue;
    const left = Math.floor(w*k - west), right = Math.floor(e*k - west);
    const top = Math.floor(north - n*k), bottom = Math.floor(north - s*k);
    if (left < 0 || right >= width || top < 0 || bottom >= height ||
        (right-left+1)*(bottom-top+1) > 65536) return { guarded: true };
    let bytes = localBits.get(area.name);
    if (!bytes) { bytes = atob(area.bits); localBits.set(area.name, bytes); }
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const bit = y*width + x;
        if (!(bytes.charCodeAt(bit >>> 3) & (1 << (bit & 7)))) return { guarded: true };
      }
    }
    return { guarded: false, component: area.component };
  }
}

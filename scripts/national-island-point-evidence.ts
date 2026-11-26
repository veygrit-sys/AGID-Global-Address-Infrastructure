import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { classifyMapPolygon, indexMapPolygon } from '../src/lib/indexedMapPolygon';
import manifest from './data/national-island-points/manifest.json';

type EncodedIsland = [string, number[][][]];
type Shard = Record<string, EncodedIsland>;
let cached: { index: number; rows: Shard } | undefined;

function shardFor(id: number): Shard {
  const index = id % manifest.shardCount;
  if (cached?.index === index) return cached.rows;
  const meta = manifest.shards[index];
  const compressed = readFileSync(new URL(`./data/national-island-points/${meta.file}`, import.meta.url));
  if (createHash('sha256').update(compressed).digest('hex') !== meta.sha256) {
    throw new Error('National island point evidence failed its integrity check');
  }
  const rows: Shard = JSON.parse(gunzipSync(compressed).toString('utf8'));
  cached = { index, rows };
  return rows;
}

function unpackPolygon(encoded: number[][]) {
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
  const rings = encoded.map(deltas => {
    let x = 0, y = 0;
    const points: number[][] = [];
    for (let i = 0; i < deltas.length; i += 2) {
      x += deltas[i];
      y += deltas[i + 1];
      const lon = x / manifest.scale, lat = y / manifest.scale;
      west = Math.min(west, lon);
      east = Math.max(east, lon);
      south = Math.min(south, lat);
      north = Math.max(north, lat);
      points.push([lon, lat]);
    }
    points.push(points[0]);
    return points;
  });
  return indexMapPolygon({ bbox: [west, south, east, north], rings });
}

/** The caller must already have excluded water, disputed evidence and policy review areas. */
export function matchNationalIslandPoint(lat: number, lon: number, physicalId: string, physicalVersion: string) {
  if (physicalVersion !== manifest.physicalVersion || !Number.isFinite(lat) || !Number.isFinite(lon)
    || Math.abs(lat) > 90 || Math.abs(lon) > 180 || !/^gshhg:(?:0|[1-9]\d{0,6})$/.test(physicalId)) return;
  const key = physicalId.slice(6);
  const entry = shardFor(Number(key))[key];
  if (!entry) return;
  const [code, pieces] = entry;
  const source = manifest.sources.find(row => row.code === code);
  if (!source || !pieces.some(part => classifyMapPolygon(lon, lat, unpackPolygon(part)) === 'inside')) return;
  return { code: source.code, sovereignCode: source.sovereignCode, source: source.source, version: source.version,
    attribution: source.attribution, sourcePage: source.sourcePage, evidenceUrls: [source.sourcePage] };
}

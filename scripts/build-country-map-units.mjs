// node scripts/build-country-map-units.mjs [map-units.geojson] [ocean.geojson]
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { bboxPolygon, featureCollection, intersect, multiPolygon, polygon, union } from '@turf/turf';

const version = 'natural-earth-vector v5.1.2';
const upstream = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/';
const countryUrl = upstream + 'ne_10m_admin_0_map_units.geojson';
const oceanUrl = upstream + 'ne_10m_ocean.geojson';
const countryDigest = '57da82be755f4afccd8f3b14251bb2752f5df1395f47d2d86f817470c4a48862';
const oceanDigest = 'f9696a1337c746a0f6c8c13bc60d0f230d2ef8d105198d5657726c8f8e763fc2';
const completeUnits = ['LS', 'SZ', 'ZA', 'FJ', 'MF', 'SX', 'AI', 'BL', 'VG', 'VI', 'GU', 'MP', 'WS', 'AS'];
const windows = [
  { name: 'Fiji archipelago', code: 'FJ', bbox: [175, -22, -177, -12] },
  { name: 'Saint Martin and neighbouring channels', code: 'MF', bbox: [-63.22, 17.97, -62.93, 18.18] },
  { name: 'Anguilla and Saint Barthelemy passage', code: 'AI', bbox: [-63.25, 17.82, -62.75, 18.32] },
  { name: 'Virgin Islands channels', code: 'VG', bbox: [-65.12, 18.24, -64.25, 18.78] },
  { name: 'Guam and Rota channel', code: 'GU', bbox: [144.52, 13.2, 145.36, 14.22] },
  { name: 'Tinian and Saipan strait', code: 'MP', bbox: [145.55, 14.88, 145.91, 15.34] },
  { name: 'Samoan islands and passages', code: 'WS', bbox: [-172.85, -14.42, -170.48, -13.4] },
  { name: 'Tokyo Bay', code: 'JP', bbox: [139.45, 35.1, 140.15, 35.75] },
  { name: 'Seto Inland Sea', code: 'JP', bbox: [132.1, 33.75, 134.8, 34.6] },
  { name: 'Chichijima and Hahajima', code: 'JP', bbox: [141.85, 26.45, 142.35, 27.25] },
];

async function verifiedFeatures(file, url, digest) {
  let bytes;
  if (file) bytes = await readFile(file);
  else {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Source download failed (HTTP ${response.status}): ${url}`);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  if (createHash('sha256').update(bytes).digest('hex') !== digest) throw new Error(`Unexpected digest: ${url}`);
  return JSON.parse(bytes).features;
}

function polygonsOf(geometry) {
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  throw new Error(`Unexpected geometry: ${geometry.type}`);
}

function bounds(points) {
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
  for (const [x, y] of points) {
    west = Math.min(west, x); south = Math.min(south, y);
    east = Math.max(east, x); north = Math.max(north, y);
  }
  return [west, south, east, north];
}

function overlaps([w, s, e, n], [w2, s2, e2, n2]) {
  return w <= e2 && e >= w2 && s <= n2 && n >= s2;
}

// The source already cuts polygons at ±180. Lift the two sides into one plane
// and dissolve their shared edges *within one map unit or surface*. Real coast
// edges (including unmatched portions on the meridian) survive this union.
function joinDateline(parts) {
  const lifted = parts.map(rings => polygon(rings.map(ring => ring.map(([x, y]) => [x < 0 ? x + 360 : x, y]))));
  if (lifted.length === 1) return [lifted[0].geometry.coordinates];
  return polygonsOf(union(featureCollection(lifted)).geometry);
}

function packed(rings) {
  const bbox = bounds(rings[0]);
  if (bbox[2] - bbox[0] >= 180) throw new Error('Unresolved antimeridian crossing');
  return { bbox, rings };
}

const [countries, oceans] = await Promise.all([
  verifiedFeatures(process.argv[2], countryUrl, countryDigest),
  verifiedFeatures(process.argv[3], oceanUrl, oceanDigest),
]);
const units = [...completeUnits, 'JP'].map(code => {
  const matches = countries.filter(f => f.properties.ISO_A2 === code);
  if (matches.length !== 1) throw new Error(`Expected one map unit for ${code}`);
  let parts = polygonsOf(matches[0].geometry);
  if (code === 'FJ') parts = joinDateline(parts);
  if (code === 'JP') {
    // Retain whole rings; clipped country rings would introduce artificial borders.
    const jpWindows = windows.filter(w => w.code === code);
    parts = parts.filter(rings => jpWindows.some(w => overlaps(bounds(rings[0]), w.bbox)));
  }
  return { code, polygons: parts.map(packed) };
});

// Use the ocean product as positive evidence. A country polygon miss alone
// cannot distinguish water, a small island missing from the source, or a gap.
const oceanPolygons = oceans.flatMap(f => polygonsOf(f.geometry)).map(rings =>
  rings.map(points => ({ points, bbox: bounds(points) })));
function oceanWithin(box) {
  const filtered = oceanPolygons.filter(rings => overlaps(rings[0].bbox, box)).map(rings =>
    rings.filter((ring, i) => i === 0 || overlaps(ring.bbox, box)).map(ring => ring.points));
  const clipped = intersect(featureCollection([multiPolygon(filtered), bboxPolygon(box)]));
  return clipped ? polygonsOf(clipped.geometry) : [];
}
const water = windows.map(window => {
  const [w, s, e, n] = window.bbox;
  // Place the extraction edge outside the query window. It never determines
  // a coastal-water result on the rectangular window boundary.
  const margin = 0.05;
  const boxes = w > e
    ? [[w - margin, s - margin, 180, n + margin], [-180, s - margin, e + margin, n + margin]]
    : [[w - margin, s - margin, e + margin, n + margin]];
  const pieces = boxes.flatMap(oceanWithin);
  const parts = w > e ? joinDateline(pieces) : pieces;
  return { ...window, polygons: parts.map(packed) };
});

const manifest = {
  source_id: 'natural-earth-10m-admin-0-map-units',
  source_name: 'Natural Earth 1:10m Admin 0 – Map Units',
  source_url: countryUrl, source_version: version, source_sha256: countryDigest,
  provider: 'Natural Earth', coverage_region: [...completeUnits, 'JP'], complete_units: completeUnits,
  license_or_terms: 'Public domain, https://www.naturalearthdata.com/about/terms-of-use/',
  redistribution_status: 'Public domain', allowed_use: 'Cartographic hints, including commercial use',
  transformed_fields: 'Original country rings with computed bounds. Fiji parts are dissolved in an unwrapped longitude domain. Japan records are limited to the documented windows.',
  freshness: 'Pinned snapshot. Rebuild and review regional fixtures when changing versions.',
  confidence_notes: 'Generalized cartographic boundaries at 1:10,000,000; no local shoreline precision, legal jurisdiction or deliverability claim.',
  ocean: { source_id: 'natural-earth-10m-ocean', source_url: oceanUrl, source_sha256: oceanDigest, source_version: version },
};

function serializeArea(area) {
  const { polygons, ...header } = area;
  return `${JSON.stringify(header).slice(0, -1)},"polygons":[\n${polygons.map(p => JSON.stringify(p)).join(',\n')}\n]}`;
}
const text = `{\n"manifest": ${JSON.stringify(manifest, null, 2)},\n"units":[\n${units.map(serializeArea).join(',\n')}\n],\n"water":[\n${water.map(serializeArea).join(',\n')}\n]\n}\n`;
await writeFile(new URL('../src/data/countryMapUnits.json', import.meta.url), text);

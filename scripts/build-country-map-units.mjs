// Regenerate the checked-in subset using Node.js, optionally from a local copy
// of the pinned upstream GeoJSON: node scripts/build-country-map-units.mjs [file]
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const source = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_map_units.geojson';
const digest = '57da82be755f4afccd8f3b14251bb2752f5df1395f47d2d86f817470c4a48862';
const codes = ['LS', 'SZ', 'ZA'];

async function download() {
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Source download failed (HTTP ${response.status})`);
  return Buffer.from(await response.arrayBuffer());
}

const bytes = process.argv[2] ? await readFile(process.argv[2]) : await download();
if (createHash('sha256').update(bytes).digest('hex') !== digest) {
  throw new Error('Unexpected Natural Earth source digest');
}

const features = JSON.parse(bytes).features;
const units = codes.map(code => {
  const matches = features.filter(feature => feature.properties.ISO_A2 === code);
  if (matches.length !== 1) throw new Error(`Expected one map unit for ${code}`);
  const geometry = matches[0].geometry;
  if (!['Polygon', 'MultiPolygon'].includes(geometry.type)) throw new Error('Expected polygonal data');
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  return { code, polygons: polygons.map(rings => {
    const lons = rings[0].map(p => p[0]);
    const lats = rings[0].map(p => p[1]);
    const bbox = [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
    if (bbox[2] - bbox[0] >= 180) throw new Error('Split antimeridian-crossing polygons before indexing');
    return { bbox, rings };
  }) };
});

const manifest = {
  source_id: 'natural-earth-10m-admin-0-map-units',
  source_name: 'Natural Earth 1:10m Admin 0 – Map Units',
  source_url: source,
  source_version: 'natural-earth-vector v5.1.2',
  source_sha256: digest,
  provider: 'Natural Earth',
  coverage_region: codes,
  license_or_terms: 'Public domain, https://www.naturalearthdata.com/about/terms-of-use/',
  redistribution_status: 'Public domain',
  allowed_use: 'Cartographic country hints, including commercial use',
  transformed_fields: 'ISO_A2 and original [longitude, latitude] coordinates, grouped into polygons with exterior and interior rings; computed polygon bounds.',
  freshness: 'Pinned snapshot. Rebuild and review regional fixtures when changing versions.',
  confidence_notes: 'Generalized cartographic boundaries at 1:10,000,000. Shared edges use a stable ISO-code tie break. Does not establish legal jurisdiction, exact coastlines or deliverability.'
};

const target = new URL('../src/data/countryMapUnits.json', import.meta.url);
// Keep each polygon on its own line for a compact, deterministic artifact.
const serialized = units.map(unit => `{"code":${JSON.stringify(unit.code)},"polygons":[\n${unit.polygons.map(p => JSON.stringify(p)).join(',\n')}\n]}`);
await writeFile(target, `{\n"manifest": ${JSON.stringify(manifest, null, 2)},\n"units":[\n${serialized.join(',\n')}\n]\n}\n`);

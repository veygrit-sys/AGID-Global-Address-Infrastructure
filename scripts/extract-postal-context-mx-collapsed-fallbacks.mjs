import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const sourceRoot = resolve('.m2-sources-mx');
const convertedRoot = join(sourceRoot, 'converted100');
const fallbackRoot = join(sourceRoot, 'fallback-original100');
mkdirSync(fallbackRoot, { recursive: true });
const hasSurface = geometry => geometry && (
  ['Polygon', 'MultiPolygon'].includes(geometry.type)
  || (geometry.type === 'GeometryCollection' && geometry.geometries.some(hasSurface))
);
let requested = 0; let written = 0; let mixedDimension = 0;
for (const fileName of readdirSync(convertedRoot).filter(name => /^CP_.+\.geojson$/u.test(name)).sort()) {
  const stem = fileName.slice(0, -'.geojson'.length);
  const simplified = JSON.parse(readFileSync(join(convertedRoot, fileName), 'utf8'));
  const codes = simplified.features
    .filter(feature => !feature.geometry || !['Polygon', 'MultiPolygon'].includes(feature.geometry.type))
    .map(feature => String(feature.properties.d_cp));
  if (!codes.length) continue;
  requested += codes.length;
  const source = `/vsizip/${join(sourceRoot, `${stem}.zip`).replaceAll('\\', '/')}/${stem}.shp`;
  const destination = join(fallbackRoot, fileName);
  const where = `d_cp IN (${codes.map(code => `'${code}'`).join(',')})`;
  const process = spawnSync('C:\\Program Files\\GDAL\\ogr2ogr.exe', [
    '-f', 'GeoJSON', destination, source, '-where', where, '-t_srs', 'EPSG:4326',
    '-nlt', 'PROMOTE_TO_MULTI', '-lco', 'COORDINATE_PRECISION=6', '-lco', 'RFC7946=YES',
  ], { encoding: 'utf8' });
  if (process.status !== 0) throw new Error(`${stem}: ${process.stderr}`);
  const fallback = JSON.parse(readFileSync(destination, 'utf8'));
  if (fallback.features.length !== codes.length || fallback.features.some(feature => !hasSurface(feature.geometry))) {
    throw new Error(`${stem}: fallback completeness or surface validation failed`);
  }
  mixedDimension += fallback.features.filter(feature => feature.geometry.type === 'GeometryCollection').length;
  written += fallback.features.length;
  console.log(`${stem}: ${fallback.features.length}`);
}
console.log(JSON.stringify({ requested, written, mixedDimension }));

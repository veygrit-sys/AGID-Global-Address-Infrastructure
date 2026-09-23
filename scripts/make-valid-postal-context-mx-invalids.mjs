import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = resolve('.m2-sources-mx'); const inputRoot = join(root, 'invalid-original100b');
const outputRoot = join(root, 'invalid-makevalid-polygons'); mkdirSync(outputRoot, { recursive: true });
let requested = 0; let written = 0;
for (const fileName of readdirSync(inputRoot).filter(name => /^CP_.+\.geojson$/u.test(name)).sort()) {
  const stem = basename(fileName, '.geojson'); const requestedFeatures = JSON.parse(readFileSync(join(inputRoot, fileName), 'utf8')).features;
  const codes = requestedFeatures.map(feature => String(feature.properties.d_cp)); requested += codes.length;
  const source = `/vsizip/${join(root, `${stem}.zip`).replaceAll('\\', '/')}/${stem}.shp`;
  const destination = join(outputRoot, fileName); const where = `d_cp IN (${codes.map(code => `'${code}'`).join(',')})`;
  const process = spawnSync('C:\\Program Files\\GDAL\\ogr2ogr.exe', [
    '-f', 'GeoJSON', destination, source, '-where', where, '-t_srs', 'EPSG:4326', '-makevalid',
    '-explodecollections', '-nlt', 'POLYGON', '-skipfailures',
    '-lco', 'COORDINATE_PRECISION=7', '-lco', 'RFC7946=YES',
  ], { encoding: 'utf8' });
  if (process.status !== 0) throw new Error(`${stem}: ${process.stderr}`);
  const extracted = JSON.parse(readFileSync(destination, 'utf8')).features;
  const outputCodes = new Set(extracted.filter(feature => ['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)).map(feature => String(feature.properties.d_cp)));
  const missing = codes.filter(code => !outputCodes.has(code)); if (missing.length) throw new Error(`${stem}: missing polygon surfaces ${missing.join(',')}`);
  written += extracted.length; console.log(`${stem}: ${codes.length} codes -> ${extracted.length} polygon parts`);
}
console.log(JSON.stringify({ requested, written }));

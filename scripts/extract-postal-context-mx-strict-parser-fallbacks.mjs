import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import jsts from 'jsts';

const selected = new Set(['24088', '33000', '35320', '35977', '74740', '79080', '85227', '89675']);
const sourceRoot = resolve('.m2-sources-mx');
const originalRoot = join(sourceRoot, 'parser-invalid-original');
const outputRoot = join(sourceRoot, 'parser-geos-selected');
mkdirSync(originalRoot, { recursive: true });
mkdirSync(outputRoot, { recursive: true });
const geometry = JSON.parse(readFileSync('data/postal_country_packs/mx/postal-context/m2/geometry.json', 'utf8'));
const grouped = new Map();
for (const item of geometry.features) {
  const code = item.nodeId.slice('postal-mx-'.length);
  if (!selected.has(code)) continue;
  const stem = item.source.sourceVersion.split('/')[0];
  const codes = grouped.get(stem) ?? [];
  codes.push(code); grouped.set(stem, codes);
}
const reader = new jsts.io.GeoJSONReader();
let written = 0;
for (const [stem, codes] of [...grouped.entries()].sort()) {
  const source = `/vsizip/${join(sourceRoot, `${stem}.zip`).replaceAll('\\', '/')}/${stem}.shp`;
  const preserveOriginalDetail = codes.includes('24088');
  const original = join(originalRoot, `${stem}.${preserveOriginalDetail ? 'geojson' : 'gpkg'}`);
  const output = join(outputRoot, `${stem}.geojson`);
  const where = `d_cp IN (${codes.map(code => `'${code}'`).join(',')})`;
  rmSync(original, { force: true });
  const initialArguments = preserveOriginalDetail
    ? ['-f', 'GeoJSON', original, source, '-where', where, '-t_srs', 'EPSG:4326', '-makevalid', '-explodecollections', '-nlt', 'POLYGON', '-skipfailures', '-lco', 'COORDINATE_PRECISION=7', '-lco', 'RFC7946=YES']
    : ['-overwrite', '-f', 'GPKG', original, source, '-where', where, '-makevalid', '-explodecollections', '-nlt', 'POLYGON', '-skipfailures'];
  let process = spawnSync('C:\\Program Files\\GDAL\\ogr2ogr.exe', initialArguments, { encoding: 'utf8' });
  if (process.status !== 0) throw new Error(`${stem}: ${process.stderr}`);
  rmSync(output, { force: true });
  process = spawnSync('C:\\Program Files\\GDAL\\ogr2ogr.exe', [
    '-f', 'GeoJSON', output, original, '-dialect', 'sqlite',
    '-sql', preserveOriginalDetail
      ? `SELECT d_cp, ST_Buffer(geometry, 0) AS geometry FROM ${stem}`
      : `SELECT d_cp, ST_SimplifyPreserveTopology(ST_Buffer(geom, 0), 100) AS geometry FROM ${stem}`,
    '-overwrite', '-t_srs', 'EPSG:4326', '-explodecollections', '-nlt', 'POLYGON', '-skipfailures',
    '-lco', preserveOriginalDetail ? 'COORDINATE_PRECISION=9' : 'COORDINATE_PRECISION=6', '-lco', 'RFC7946=YES',
  ], { encoding: 'utf8' });
  if (process.status !== 0) throw new Error(`${stem}: ${process.stderr}`);
  const result = JSON.parse(readFileSync(output, 'utf8')).features;
  const outputCodes = new Set();
  for (const feature of result) {
    const code = String(feature.properties.d_cp); outputCodes.add(code);
  }
  const missing = codes.filter(code => !outputCodes.has(code));
  if (missing.length) throw new Error(`${stem}: missing ${missing.join(',')}`);
  written += outputCodes.size;
}
if (written !== selected.size) throw new Error(`expected ${selected.size}; found ${written}`);
console.log(JSON.stringify({ written, states: grouped.size }));

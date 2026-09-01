import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import jsts from 'jsts';
const selected = new Set(['49228','20330','47987','64924','84796','84905','77877','85748','62513','97835']);
const inputRoot = resolve('.m2-sources-mx/invalid-makevalid-polygons'); const outputRoot = resolve('.m2-sources-mx/invalid-geos-selected');
mkdirSync(outputRoot, { recursive: true }); const reader = new jsts.io.GeoJSONReader(); let codes = 0; let parts = 0;
for (const fileName of readdirSync(inputRoot).filter(name => /^CP_.+\.geojson$/u.test(name) && !/-pass|-buffer/u.test(name)).sort()) {
  const stem = basename(fileName, '.geojson'); const input = join(inputRoot, fileName);
  const requestedCodes = new Set(JSON.parse(readFileSync(input, 'utf8')).features.map(feature => String(feature.properties.d_cp)).filter(code => selected.has(code)));
  if (!requestedCodes.size) continue;
  const output = join(outputRoot, fileName); const where = [...requestedCodes].map(code => `'${code}'`).join(',');
  const process = spawnSync('C:\\Program Files\\GDAL\\ogr2ogr.exe', [
    '-f', 'GeoJSON', output, input, '-dialect', 'sqlite', '-sql', `SELECT d_cp, ST_Buffer(geometry, 0) AS geometry FROM ${stem} WHERE d_cp IN (${where})`,
    '-explodecollections', '-nlt', 'POLYGON', '-skipfailures', '-lco', 'COORDINATE_PRECISION=9', '-lco', 'RFC7946=YES',
  ], { encoding: 'utf8' });
  if (process.status !== 0) throw new Error(`${stem}: ${process.stderr}`);
  const result = JSON.parse(readFileSync(output, 'utf8')).features; const outputCodes = new Set();
  for (const feature of result) { const code = String(feature.properties.d_cp); outputCodes.add(code); if (!new jsts.operation.valid.IsValidOp(reader.read(feature.geometry)).isValid()) throw new Error(`${stem}/${code}: invalid`); }
  const missing = [...requestedCodes].filter(code => !outputCodes.has(code)); if (missing.length) throw new Error(`${stem}: missing ${missing.join(',')}`);
  codes += requestedCodes.size; parts += result.length; console.log(`${stem}: ${requestedCodes.size} codes -> ${result.length} valid parts`);
}
if (codes !== selected.size) throw new Error(`expected ${selected.size} selected codes; found ${codes}`);
console.log(JSON.stringify({ codes, parts }));

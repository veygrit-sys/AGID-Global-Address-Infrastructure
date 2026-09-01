import { mkdirSync, readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const sourceRoot = resolve(process.argv[2] ?? '.m2-sources-mx');
const outputRoot = join(sourceRoot, 'converted100');
mkdirSync(outputRoot, { recursive: true });
const zipNames = readdirSync(sourceRoot).filter(name => /^CP_.+\.zip$/u.test(name)).sort();
if (zipNames.length !== 32) throw new Error(`expected 32 official state ZIPs; found ${zipNames.length}`);
for (const zipName of zipNames) {
  const stem = basename(zipName, '.zip');
  const source = `/vsizip/${join(sourceRoot, zipName).replaceAll('\\', '/')}/${stem}.shp`;
  const output = join(outputRoot, `${stem}.geojson`);
  const process = spawnSync('C:\\Program Files\\GDAL\\ogr2ogr.exe', [
    '-overwrite', '-f', 'GeoJSON', output, source, '-t_srs', 'EPSG:4326',
    '-simplify', '100', '-makevalid', '-lco', 'COORDINATE_PRECISION=6', '-lco', 'RFC7946=YES',
  ], { encoding: 'utf8' });
  if (process.status !== 0) throw new Error(`${stem}: ${process.stderr}`);
}
console.log(JSON.stringify({ resources: zipNames.length, outputRoot }));

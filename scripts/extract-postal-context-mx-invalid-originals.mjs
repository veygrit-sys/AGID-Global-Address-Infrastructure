import { mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import jsts from 'jsts';
const sourceRoot = resolve('.m2-sources-mx'); const outputRoot = join(sourceRoot, 'invalid-original100b'); mkdirSync(outputRoot, { recursive: true });
const geometry = JSON.parse(readFileSync('data/postal_country_packs/mx/postal-context/m2/geometry.json', 'utf8'));
const reader = new jsts.io.GeoJSONReader(); const grouped = new Map();
for (const item of geometry.features) {
  if (new jsts.operation.valid.IsValidOp(reader.read(item.geometry)).isValid()) continue;
  const stem = item.source.sourceVersion.split('/')[0]; const codes = grouped.get(stem) ?? [];
  codes.push(item.nodeId.slice('postal-mx-'.length)); grouped.set(stem, codes);
}
let requested = 0; let written = 0;
for (const [stem, codes] of [...grouped.entries()].sort()) {
  requested += codes.length; const source = `/vsizip/${join(sourceRoot, `${stem}.zip`).replaceAll('\\', '/')}/${stem}.shp`;
  const destination = join(outputRoot, `${stem}.geojson`); const where = `d_cp IN (${codes.map(code => `'${code}'`).join(',')})`;
  const process = spawnSync('C:\\Program Files\\GDAL\\ogr2ogr.exe', ['-f', 'GeoJSON', destination, source, '-where', where, '-t_srs', 'EPSG:4326', '-lco', 'COORDINATE_PRECISION=7', '-lco', 'RFC7946=YES'], { encoding: 'utf8' });
  if (process.status !== 0) throw new Error(`${stem}: ${process.stderr}`);
  const extracted = JSON.parse(readFileSync(destination, 'utf8')); if (extracted.features.length !== codes.length) throw new Error(`${stem}: incomplete invalid fallback`);
  written += extracted.features.length; console.log(`${stem}: ${extracted.features.length}`);
}
console.log(JSON.stringify({ requested, written, states: grouped.size }));

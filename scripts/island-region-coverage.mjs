// Emit the country/territory scope of the bundled geometry as a reproducible CSV.
// Counts are raw source coverage before the point-specific territorial display policy.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const data = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/data');
function read(file) {
  return JSON.parse(fs.readFileSync(path.join(data, file), 'utf8'));
}
const coverage = new Map();
function forRegion(code) {
  let row = coverage.get(code);
  if (!row) {
    row = { politicalPieces: 0, minorFeatureIds: new Set() };
    coverage.set(code, row);
  }
  return row;
}
const world = read('global-islands/manifest.json');
for (const file of fs.readdirSync(path.join(data, 'global-islands')).filter(f => /^part-.*\.json$/.test(f))) {
  for (const [unitId] of read('global-islands/' + file)) {
    const unit = world.units[unitId];
    if (unit.code && !unit.disputed) forRegion(unit.code).politicalPieces++;
  }
}
const minor = read('minorIslands/manifest.json');
for (const file of fs.readdirSync(path.join(data, 'minorIslands')).filter(f => /^band\d+\.json$/.test(f))) {
  for (const [id, , , areas] of read('minorIslands/' + file)) {
    for (const [unitId] of areas) {
      const [territory] = minor.units[unitId];
      forRegion(territory).minorFeatureIds.add(id);
    }
  }
}
console.log('source_territory_code,natural_earth_political_pieces,minor_features_with_fieldmaps_overlap');
for (const code of [...coverage.keys()].sort()) {
  const row = coverage.get(code);
  console.log([code, row.politicalPieces, row.minorFeatureIds.size].join(','));
}

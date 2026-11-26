#!/usr/bin/env node
import { readFile, mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { packFrontiers } from './lib/pack-europe-frontiers.mjs';

export function supplementTreaties(input) {
  const rows = [
    ['saint-martin-2023','Saint-Martin / Sint Maarten',['MF','SX'],'signed-agreement','Signed 2023 agreement, terrestrial zone, Annex A',input.saintMartin],
    ['market-2006','Märket',['AX','SE'],'demarcation','2006 bilateral demarcation, map 49',input.market.map(p => p.slice(1))],
    ['tartupaluk-2022','Tartupaluk / Hans Island',['CA','GL'],'signed-agreement','Article 4, geodesics between T1, T2 and T3',densifyGeodesics(input.tartupaluk)]
  ];
  return rows.map(([id,name,codes,kind,classification,points]) => ({id,source:id,name,codes,kind,classification,paths:[points]}));
}

// Spherical interpolation of short surveyed geodesics; original GRS80/ITRF2014 endpoints are preserved.
// Preserve the three treaty stations as anchors while sampling the short segments for map intersections.
function densifyGeodesics(points) {
  const radians = Math.PI / 180;
  const vector = ([lon,lat]) => [Math.cos(lat*radians)*Math.cos(lon*radians),Math.cos(lat*radians)*Math.sin(lon*radians),Math.sin(lat*radians)];
  const output = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const a = vector(points[i-1]), b = vector(points[i]);
    for (let j = 1; j <= 100; j++) {
      const t = j / 101;
      const [x,y,z] = a.map((v,k) => v * (1-t) + b[k] * t);
      output.push([Math.atan2(y,x)/radians, Math.atan2(z,Math.hypot(x,y))/radians]);
    }
    output.push(points[i]);
  }
  return output;
}

async function main() {
  const [, , rawFile, directory] = process.argv;
  if (!rawFile || !directory) throw new Error('Usage: node scripts/build-europe-frontiers.mjs source.json output-directory');
  const folder = new URL('./data/europe-frontiers/',import.meta.url);
  const scope = JSON.parse(await readFile(new URL('scope.json',folder),'utf8'));
  const treaties = JSON.parse(await readFile(new URL('treaty-coordinates.json',folder),'utf8'));
  const records = JSON.parse(await readFile(rawFile,'utf8'));
  const data = packFrontiers([...records,...supplementTreaties(treaties)],scope.expectedLandPairs);
  await mkdir(directory,{recursive:true});
  for (const [file,content] of Object.entries(data)) await writeFile(directory+'/'+file,content);
  for (const file of await readdir(directory)) if (/^lines-\d+\.json$/.test(file) && !Object.hasOwn(data,file)) await unlink(directory+'/'+file);
  const catalog = JSON.parse(data['catalog.json']);
  console.log(catalog.length+' source records, '+catalog.reduce((n,f) => n+f.vertices,0)+' source and treaty vertices');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();

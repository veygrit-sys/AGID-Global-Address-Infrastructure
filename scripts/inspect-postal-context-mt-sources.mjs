import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

const args = process.argv.slice(2);
const sourceDirIndex = args.indexOf('--source-dir');
if (sourceDirIndex < 0 || !args[sourceDirIndex + 1]) {
  throw new Error('usage: node scripts/inspect-postal-context-mt-sources.mjs --source-dir <directory>');
}
const sourceDir = args[sourceDirIndex + 1];

const sha256 = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const read = name => readFileSync(join(sourceDir, name), 'utf8');
const exactBody = name => {
  const path = join(sourceDir, name);
  const bytes = readFileSync(path);
  return { name: basename(path), byteLength: statSync(path).size, sha256: sha256(bytes) };
};
const tokenCounts = text => Object.fromEntries(
  ['GeoJSON', 'FeatureCollection', 'Polygon', 'MultiPolygon', 'coordinates', 'latitude', 'longitude']
    .map(token => [token, [...text.matchAll(new RegExp(token, 'gi'))].length])
);
const decodeText = value => value
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)))
  .replace(/&#x([0-9a-f]+);/gi, (_, hexadecimal) => String.fromCodePoint(Number.parseInt(hexadecimal, 16)))
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/\s+/g, ' ')
  .trim();

const mainBundle = read('maltapost-main.js');
const townsText = read('maltapost-towns.json');
const streetsText = read('maltapost-hamrun-streets.json');
const searchText = read('maltapost-search-hmr2042.json');
const terms = decodeText(read('maltapost-terms-conditions.html'));
const localities = read('oar-localities.html');
const towns = JSON.parse(townsText);
const streets = JSON.parse(streetsText);
const search = JSON.parse(searchText);
if (!Array.isArray(towns) || !Array.isArray(streets) || !Array.isArray(search)) {
  throw new Error('MaltaPost API snapshots must be arrays');
}

const endpointNames = ['Search', 'GetTowns', 'GetAllTowns', 'GetStreets', 'GetAllStreets', 'GetAddresses'];
for (const endpoint of endpointNames) {
  if (!mainBundle.includes('/Address/' + endpoint)) throw new Error('missing ' + endpoint + ' endpoint in bundle');
}
if (!mainBundle.includes('this.version="v1"') || !mainBundle.includes('this.maxResult=50')) {
  throw new Error('unexpected MaltaPost finder API version or maxResult');
}

const postcodePattern = /^[A-Z]{3} \d{4}$/;
const samplePostcodes = [...new Set(search.map(row => String(row.postCode ?? '').trim()))].sort();
if (samplePostcodes.some(postcode => !postcodePattern.test(postcode))) {
  throw new Error('sample search includes a noncanonical postcode');
}
const sampleFields = [...new Set(search.flatMap(row => Object.keys(row)))].sort();

const htmlRows = [...localities.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
const parsedRows = htmlRows.map(row => [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
  .map(cell => decodeText(cell[1])))
  .filter(row => row.length > 0);
const headers = parsedRows[0] ?? [];
const postcodeTokens = [...localities.matchAll(/post\s*code/gi)].length;

const files = [
  'maltapost-finder.html',
  'maltapost-detail.html',
  'maltapost-main.js',
  'maltapost-terms-conditions.html',
  'maltapost-terms-and-conditions.html',
  'maltapost-privacy.html',
  'maltapost-news-postcodes.html',
  'maltapost-towns.json',
  'maltapost-hamrun-streets.json',
  'maltapost-search-hmr2042.json',
  'oar-localities.html',
  'oar-locate-street.html'
];

const result = {
  schemaVersion: 'postal-context-mt-source-inspection/v1',
  operatorApplication: {
    baseUrlObserved: mainBundle.includes('https://www.maltapost.com/postcode'),
    apiVersion: 'v1',
    maximumSearchResults: 50,
    endpointNames,
    endpointCount: endpointNames.length,
    geometryTokens: tokenCounts(mainBundle)
  },
  operatorTowns: {
    entries: towns.length,
    distinctIds: new Set(towns.map(row => String(row.id))).size,
    hamrunEntries: towns.filter(row => /hamrun/i.test(String(row.nameSanitized ?? ''))).length,
    fields: [...new Set(towns.flatMap(row => Object.keys(row)))].sort(),
    geometryTokens: tokenCounts(townsText)
  },
  operatorHamrunStreets: {
    entries: streets.length,
    distinctIds: new Set(streets.map(row => String(row.id))).size,
    townIds: [...new Set(streets.map(row => String(row.townId)))].sort(),
    fields: [...new Set(streets.flatMap(row => Object.keys(row)))].sort(),
    geometryTokens: tokenCounts(streetsText)
  },
  operatorSampleSearch: {
    query: 'HMR 2042',
    entries: search.length,
    distinctPostcodes: samplePostcodes.length,
    postcodes: samplePostcodes,
    fields: sampleFields,
    geometryTokens: tokenCounts(searchText)
  },
  oarLocalities: {
    rowsIncludingHeader: parsedRows.length,
    dataRows: Math.max(0, parsedRows.length - 1),
    columnCounts: [...new Set(parsedRows.map(row => row.length))].sort(),
    headers,
    postcodeTokens,
    geometryTokens: tokenCounts(localities)
  },
  rights: {
    websiteCopyrightObserved: /copyright of maltapost/i.test(terms),
    personalNonCommercialOrInternalOnlyObserved: /personal,\s*non-commercial use or for internal circulation/i.test(terms),
    datasetSpecificBulkProcessingDerivationPublicServingAndRedistributionGrantEstablished: false
  },
  geometry: {
    officialPostcodePolygonRecords: 0,
    rightsClearedDerivedPostcodePolygonRecords: 0,
    productionEligibleRecords: 0
  },
  completeOrdinaryAndExceptionAllocationDenominatorEstablished: false,
  exactBodies: files.map(exactBody)
};

process.stdout.write(JSON.stringify(result, null, 2) + '\n');

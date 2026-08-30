import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

const args = process.argv.slice(2);
const sourceDirIndex = args.indexOf('--source-dir');
if (sourceDirIndex < 0 || !args[sourceDirIndex + 1]) {
  throw new Error('usage: node scripts/inspect-postal-context-mk-sources.mjs --source-dir <directory>');
}
const sourceDir = args[sourceDirIndex + 1];

const sha256 = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const exactBody = name => {
  const path = join(sourceDir, name);
  const bytes = readFileSync(path);
  return { name: basename(path), byteLength: statSync(path).size, sha256: sha256(bytes) };
};
const read = name => readFileSync(join(sourceDir, name), 'utf8');
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
const normalized = value => decodeText(value).normalize('NFKC').toLocaleLowerCase('mk').replace(/\s+/g, ' ').trim();

const addressing = read('operator-addressing.html');
const tables = [...addressing.matchAll(/<table\b[\s\S]*?<\/table>/gi)].map(match => match[0]);
const mainTable = tables
  .map(table => ({
    table,
    rows: [...table.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map(match => match[0])
  }))
  .sort((left, right) => right.rows.length - left.rows.length)[0];
if (!mainTable) throw new Error('no table found in operator-addressing.html');
const parsedRows = mainTable.rows.map(row => [...row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(match => decodeText(match[1])));
const dataRows = parsedRows.filter(cells => cells.length === 5 && /^\d{4}$/.test(cells[1]));
const distinct = index => new Set(dataRows.map(cells => normalized(cells[index]))).size;
const codes = new Set(dataRows.map(cells => cells[1]));

const locator = JSON.parse(read('operator-locator-all.json'));
if (!Array.isArray(locator)) throw new Error('operator-locator-all.json must be an array');
const headers = locator.filter(row => Object.hasOwn(row, 'header'));
const facilities = locator.filter(row => Object.hasOwn(row, 'lat') && Object.hasOwn(row, 'lng'));
const finiteCoordinate = row => Number.isFinite(Number(row.lat)) && Number.isFinite(Number(row.lng));
const locatorCodes = new Set(facilities.flatMap(row => {
  const match = String(row.display ?? '').match(/<br>(\d{4})\s*-/i);
  return match ? [match[1]] : [];
}));
const sharedCodes = [...codes].filter(code => locatorCodes.has(code));

const tokens = text => Object.fromEntries(['GeoJSON', 'FeatureCollection', 'Polygon', 'MultiPolygon'].map(token => [token, text.split(token).length - 1]));
const files = [
  'operator-addressing.html',
  'operator-offices.html',
  'operator-about.html',
  'operator-privacy.html',
  'operator-contact.html',
  'locator-lpr.js',
  'locator-front.js',
  'operator-locator-all.json'
];

const result = {
  schemaVersion: 'postal-context-mk-source-inspection/v1',
  addressingTable: {
    htmlTables: tables.length,
    rowsIncludingHeader: mainTable.rows.length,
    dataRows: dataRows.length,
    exactDuplicateRows: dataRows.length - new Set(dataRows.map(row => JSON.stringify(row))).size,
    distinctPostcodes: codes.size,
    distinctLocalities: distinct(0),
    distinctDeliveryOffices: distinct(2),
    distinctMunicipalities: distinct(3),
    distinctBranches: distinct(4),
    minimumPostcode: [...codes].sort()[0],
    maximumPostcode: [...codes].sort().at(-1),
    geometryTokens: tokens(mainTable.table)
  },
  locator: {
    arrayEntries: locator.length,
    headerEntries: headers.length,
    facilityEntries: facilities.length,
    validCoordinateEntries: facilities.filter(finiteCoordinate).length,
    distinctFacilityIds: new Set(facilities.map(row => String(row.id))).size,
    distinctRenderedPostcodes: locatorCodes.size,
    geometryTypes: { Point: facilities.length, Polygon: 0, MultiPolygon: 0 },
    geometryTokens: tokens(JSON.stringify(locator))
  },
  reconciliation: {
    addressingPostcodes: codes.size,
    locatorPostcodes: locatorCodes.size,
    sharedPostcodes: sharedCodes.length,
    addressingOnlyPostcodes: [...codes].filter(code => !locatorCodes.has(code)).length,
    locatorOnlyPostcodes: [...locatorCodes].filter(code => !codes.has(code)).length,
    completeOrdinaryAndExceptionAllocationDenominatorEstablished: false
  },
  exactBodies: files.map(exactBody)
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

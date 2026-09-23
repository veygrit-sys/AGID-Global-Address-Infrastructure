import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const sourceIndex = args.indexOf('--source-dir');
assert.notEqual(sourceIndex, -1, 'pass --source-dir');
const sourceDir = args[sourceIndex + 1];

const expected = {
  'slovak-post-psc.html': ['a28e42b9c644636e17de1503b662896f582daf5ef94d005dd3c4cb7c7b575e05', 120263],
  'slovak-post-developer.html': ['1f6ff0a0a951ef243e2eb5b56f97f54a3475716e83f53b102cd998f9dc70ce5e', 105551],
  'slovak-post-access-points.xml': ['2f88693b2680f28ab32cf4f76556f7edf0178b5969d2f936c1290bbf4c421ad8', 3485769],
  'posta-Page-DKzZxB77.js': ['09628e69e0d6e86b1b7d09a99bb42cdf34e0f66d52438c322c529d46be65be30', 218291],
  'slovak-post-address-search-americke.json': ['9c72d70858825ae0c2261fd5ca3decba97741831ef53b522936bdabfe01508d7', 149],
  'slovak-post-address-search-81108.json': ['47007141027261f487a8a3de541000ccd05353f3c29d389c4f04739fa9dd7d45', 16],
  'register-addresses-home.html': ['f70a6b3e502b39b4853454f93d3a1df58fb22962aa5b816f194a159fbcfd923b', 367015],
  'register-addresses-catalog.json': ['5ff7ce838b1bb99284a3d3fda193c9da34329b01be527ec99204cd8c24bf562d', 823127],
  'register-addresses-help.html': ['1569bd6b0fbf1ef7de7520ab9005d068707cdd71dbddb5faabb2d48b70d0cef1', 2501266],
  'register-addresses-ministry.html': ['2478a72f5e1ffe1a3e07a8a82bac97528cfdefb2070c08fe0a6448fd4c1cc164', 186915],
  'register-addresses-openapi-docs.html': ['3d1f21ff983b7b71c5cf152d3134374ba8a0050ddbd97a9cb1b4b8cfb9d308b2', 3106],
  'address_by_nuts3_SK010.json': ['5c9aa29592cf267e4ad94b958fb16964eefd9286e400562f6d53f901926bfbaf', 3169],
  'address_by_nuts3_SK021.json': ['e2518a700ef7c59bfdeed1f77f09ae27885bbb2da60872acf43bd124f2005bae', 3161],
  'address_by_nuts3_SK022.json': ['035c5a112e2e0a7d9087a8d2f759cd2d2cfd90ed2be30a0ec6f7da595ba6cd5d', 3167],
  'address_by_nuts3_SK023.json': ['3cefa8d883aad80311128fb878b5b861ee722ad360340aa9d483fea8fca2b056', 3163],
  'address_by_nuts3_SK031.json': ['f8b79ad6ba68e7b99907a9c477b1f6f9bed4542b8299d32aa8318186d1a74c5c', 3163],
  'address_by_nuts3_SK032.json': ['96334716b5f4f228f47ef3fd87d99e29232abc8c1ff97726e824c4ad176d7d3d', 3175],
  'address_by_nuts3_SK041.json': ['6b487b53802b2a2c78c96c1f23a24210ec6dcc6131e32bed0baffb054eb4fae7', 3165],
  'address_by_nuts3_SK042.json': ['3c174342ca70ebb347fa7f0573d2e817e5e954d0f50206e1c0ae97858e83b559', 3161],
  'address_by_nuts3_SK010.range.geojson': ['692d795ff513d73dc380e4c00174b0d2708eb641d03b961ead078a03a8fc57a8', 127488925]
};

const bodies = Object.entries(expected).map(([file, [sha256, bytes]]) => {
  const body = readFileSync(join(sourceDir, file));
  assert.equal(body.length, bytes, `${file} byte length`);
  assert.equal(createHash('sha256').update(body).digest('hex'), sha256, `${file} sha256`);
  return { file, bytes, sha256 };
});

const pscHtml = readFileSync(join(sourceDir, 'slovak-post-psc.html'), 'utf8');
const pageJs = readFileSync(join(sourceDir, 'posta-Page-DKzZxB77.js'), 'utf8');
assert.match(pscHtml, /api\.posta\.sk\/private\/web\/addresses/);
assert.match(pageJs, /scope:\s*"zip"/);
assert.match(pageJs, /limit:\s*5/);
const streetSearch = JSON.parse(readFileSync(join(sourceDir, 'slovak-post-address-search-americke.json'), 'utf8'));
const codeSearch = JSON.parse(readFileSync(join(sourceDir, 'slovak-post-address-search-81108.json'), 'utf8'));
assert.deepEqual(streetSearch.addresses.map(row => row.zip), ['81107', '81108']);
assert.deepEqual(codeSearch.addresses, []);

const xml = readFileSync(join(sourceDir, 'slovak-post-access-points.xml'), 'utf8');
assert.match(xml, /<GENEROVANE>2026-08-30T18:00:00<\/GENEROVANE>/);
const officeBlocks = [...xml.matchAll(/<POSTA>([\s\S]*?)<\/POSTA>/g)].map(match => match[1]);
const officeCodes = officeBlocks.map(block => block.match(/<PSC>(\d{5})<\/PSC>/)?.[1] ?? null);
const officeGps = officeBlocks.filter(block => /<LONGITUDE>[^<]+<\/LONGITUDE>\s*<LATITUDE>[^<]+<\/LATITUDE>/.test(block)).length;
assert.equal(officeBlocks.length, 2449);
assert.ok(officeCodes.every(code => code !== null));

const nutsCodes = ['SK010', 'SK021', 'SK022', 'SK023', 'SK031', 'SK032', 'SK041', 'SK042'];
const metadataModified = {};
for (const code of nutsCodes) {
  const metadata = JSON.parse(readFileSync(join(sourceDir, `address_by_nuts3_${code}.json`), 'utf8'));
  const graph = metadata['@graph'];
  const distribution = graph.find(node => node['@type'] === 'dcat:Distribution');
  const terms = graph.find(node => node['@type'] === 'leg:TermsOfUse');
  const dataset = graph.find(node => node['@type'] === 'dcat:Dataset');
  assert.equal(distribution['dct:accessRights'].iri.endsWith('/noLimitations'), true);
  assert.equal(dataset['dct:accrualPeriodicity'].iri.endsWith('/DAILY'), true);
  assert.equal(terms['leg:authorsWorkType'].iri.endsWith('/CC_BY_4_0'), true);
  assert.equal(terms['leg:databaseProtectedBySpecialRightsType'].iri.endsWith('/CC_BY_4_0'), true);
  assert.equal(terms['leg:originalDatabaseType'].iri.endsWith('/CC_BY_4_0'), true);
  assert.equal(terms['leg:personalDataContainmentType'].iri.endsWith('/2'), true);
  metadataModified[code] = dataset['dct:modified']['@value'];
}

const geojson = JSON.parse(readFileSync(join(sourceDir, 'address_by_nuts3_SK010.range.geojson'), 'utf8'));
assert.equal(geojson.type, 'FeatureCollection');
const geometryTypes = {};
const postalCodes = new Set();
let nullPostalCodes = 0;
let malformedPostalCodes = 0;
let invalidPointCoordinates = 0;
let polygonFeatures = 0;
let multiPolygonFeatures = 0;
let minValidFrom = null;
let maxValidFrom = null;
for (const feature of geojson.features) {
  const kind = feature.geometry?.type ?? 'null';
  geometryTypes[kind] = (geometryTypes[kind] ?? 0) + 1;
  if (kind === 'Polygon') polygonFeatures += 1;
  if (kind === 'MultiPolygon') multiPolygonFeatures += 1;
  if (kind === 'Point') {
    const [x, y] = feature.geometry.coordinates ?? [];
    if (!Number.isFinite(x) || !Number.isFinite(y)) invalidPointCoordinates += 1;
  }
  const code = feature.properties?.postalcode;
  if (code == null || code === '') nullPostalCodes += 1;
  else if (!/^\d{5}$/.test(String(code))) malformedPostalCodes += 1;
  else postalCodes.add(String(code));
  const validFrom = feature.properties?.validfrom;
  if (validFrom != null) {
    minValidFrom = minValidFrom == null || validFrom < minValidFrom ? validFrom : minValidFrom;
    maxValidFrom = maxValidFrom == null || validFrom > maxValidFrom ? validFrom : maxValidFrom;
  }
}
assert.equal(geojson.features.length, 160897);
assert.deepEqual(geometryTypes, { Point: 158803, null: 2094 });
assert.equal(polygonFeatures + multiPolygonFeatures, 0);
assert.equal(invalidPointCoordinates, 0);

const result = {
  schemaVersion: 'postal-context-sk-source-inspection/v1',
  exactBodies: bodies,
  exactBodiesByteAndSha256Bound: bodies.length,
  exactOfficialBodiesBytes: bodies.reduce((sum, body) => sum + body.bytes, 0),
  operatorSearch: {
    endpoint: 'https://api.posta.sk/private/web/addresses',
    sampleStreetResultCount: streetSearch.addresses.length,
    sampleStreetPostcodes: streetSearch.addresses.map(row => row.zip),
    directPostcodeResultCount: codeSearch.addresses.length,
    completeAssignmentDenominatorEstablished: false
  },
  accessPoints: {
    generatedAt: '2026-08-30T18:00:00',
    records: officeBlocks.length,
    uniquePostcodes: new Set(officeCodes).size,
    gpsRecords: officeGps,
    polygonOrMultiPolygonRecords: 0
  },
  registerAddresses: {
    nuts3MetadataDatasets: nutsCodes.length,
    nuts3Codes: nutsCodes,
    metadataModified,
    dailyFrequency: true,
    noAccessLimitations: true,
    ccBy4ForWorkAndDatabaseRights: true,
    personalDataOccurrenceType: 2,
    inspectedDataset: 'address_by_nuts3_SK010',
    features: geojson.features.length,
    geometryTypes,
    uniquePostalCodes: postalCodes.size,
    nullPostalCodes,
    malformedPostalCodes,
    invalidPointCoordinates,
    polygonFeatures,
    multiPolygonFeatures,
    minValidFrom,
    maxValidFrom
  }
};

console.log(JSON.stringify(result, null, 2));

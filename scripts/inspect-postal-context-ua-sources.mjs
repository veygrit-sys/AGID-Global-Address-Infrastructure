import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const sourceIndex = args.indexOf('--source-dir');
assert.notEqual(sourceIndex, -1, 'pass --source-dir');
const sourceDir = args[sourceIndex + 1];

const expected = {
  'address-classifier-v3.20-2026-02-11.pdf': ['e503072b5d8af473632f56cb16f99e2a005a4de4cef73663302ee8bfb8b7398b', 523408],
  'api-documentation-2026-03-09-eng.pdf': ['4e8d81806db25edbf95183a0b737e4aee2eb5790fb81538bcaeaec9e038d8d9a', 5265729],
  'datapackage.json': ['73881ae02dbd4b6ba6bb71d15b18f579eb8908a2020753563be6a946f5ed968a', 31894],
  'dataset.html': ['9807b2232858dbb75ef4c14a5976aabf3ae20d5576e39b25eef0ad7e0cf76fa3', 83841],
  'postcodes-2025-08.7z': ['1c30e02ddd47e5fec1b3a930913b06336e76f40bb1e3d8b124540d23de19455b', 7193464],
  'ukrposhta-public-info.html': ['7288d4e7d5f16afdc3153db0309e0636684ecfedb6ab6210d54f13e1d6eecee1', 182660]
};

const bodies = Object.entries(expected).map(([file, [sha256, bytes]]) => {
  const body = readFileSync(join(sourceDir, file));
  assert.equal(body.length, bytes, `${file} byte length`);
  assert.equal(createHash('sha256').update(body).digest('hex'), sha256, `${file} sha256`);
  return { file, bytes, sha256 };
});

const extractedDir = join(sourceDir, 'extracted');
const csvFiles = readdirSync(extractedDir).filter(file => file.endsWith('.csv'));
assert.equal(csvFiles.length, 1, 'official archive contains one CSV');
const csvFile = csvFiles[0];
const csvBytes = readFileSync(join(extractedDir, csvFile));
const csvSha256 = createHash('sha256').update(csvBytes).digest('hex');
const csvText = new TextDecoder('windows-1251').decode(csvBytes);
const lines = csvText.split(/\r?\n/);
if (lines.at(-1) === '') lines.pop();
const header = lines.shift().split(';');
assert.equal(header.length, 16, 'official CSV column count');

const geometryLikeColumns = header.filter(name => /(lat|lon|coord|geom|polygon|wkt|geojson)/i.test(name));
const localityCodes = new Set();
const officeCodes = new Set();
let localityBlankRows = 0;
let officeBlankRows = 0;
let invalidNonblankLocalityCodes = 0;
let invalidNonblankOfficeCodes = 0;
let unexpectedColumnRows = 0;
for (const line of lines) {
  const columns = line.split(';');
  if (columns.length !== 16) {
    unexpectedColumnRows += 1;
    continue;
  }
  const localityCode = columns[3].trim();
  const officeCode = columns[7].trim();
  if (!localityCode) localityBlankRows += 1;
  else if (/^\d{5}$/.test(localityCode)) localityCodes.add(localityCode);
  else invalidNonblankLocalityCodes += 1;
  if (!officeCode) officeBlankRows += 1;
  else if (/^\d{5}$/.test(officeCode)) officeCodes.add(officeCode);
  else invalidNonblankOfficeCodes += 1;
}
const allCodes = new Set([...localityCodes, ...officeCodes]);
assert.equal(csvBytes.length, 117904566, 'extracted CSV byte length');
assert.equal(csvSha256, '46e0a2992a23d32a8165e9bf2fa6f0b83c8f261585da72717bbbf7020d22d512', 'extracted CSV sha256');
assert.equal(lines.length, 320249, 'official CSV data row count');
assert.equal(unexpectedColumnRows, 0, 'every official CSV row has sixteen columns');
assert.equal(localityBlankRows, 0, 'locality postcode is present on every row');
assert.equal(officeBlankRows, 134712, 'office postcode blank row count');
assert.equal(invalidNonblankLocalityCodes, 0, 'nonblank locality postcodes are five digits');
assert.equal(invalidNonblankOfficeCodes, 0, 'nonblank office postcodes are five digits');
assert.equal(localityCodes.size, 28796, 'distinct locality postcode count');
assert.equal(officeCodes.size, 5101, 'distinct office postcode count');
assert.equal(allCodes.size, 28796, 'distinct union postcode count');
assert.equal([...allCodes].sort()[0], '01001', 'minimum postcode');
assert.equal([...allCodes].sort().at(-1), '93891', 'maximum postcode');
assert.equal([...allCodes].filter(code => code.startsWith('0')).length, 1435, 'leading-zero postcode count');
assert.deepEqual(geometryLikeColumns, [], 'official CSV has no geometry-like columns');

const datapackage = JSON.parse(readFileSync(join(sourceDir, 'datapackage.json'), 'utf8'));
const latest = datapackage.resources.find(resource => resource.name === 'Відомості на серпень 2025');
assert.ok(latest, 'August 2025 resource is present in data package');
assert.equal(latest.path, 'https://data.gov.ua/dataset/e9b0cd40-a227-4e3f-9c05-1ec4b3f65115/resource/bf23bd63-eb69-44c6-869d-e857ee214968/download/zvit-dlia-miu-perelik-poshtovikh-indeksiv-ta-viddilen_08-08-2025-csv.7z');
assert.equal(datapackage.licenses[0].name, 'cc-by');
const datasetHtml = readFileSync(join(sourceDir, 'dataset.html'), 'utf8');
assert.match(datasetHtml, /Creative Commons Attribution/);
assert.match(datasetHtml, /2025/);
const publicInfo = readFileSync(join(sourceDir, 'ukrposhta-public-info.html'), 'utf8');
assert.match(publicInfo, /data\.gov\.ua/);

const result = {
  schemaVersion: 'postal-context-ua-source-inspection/v1',
  exactBodies: bodies,
  exactBodiesByteAndSha256Bound: bodies.length,
  exactOfficialBodiesBytes: bodies.reduce((sum, body) => sum + body.bytes, 0),
  officialCsv: {
    file: csvFile,
    bytes: csvBytes.length,
    sha256: csvSha256,
    encoding: 'windows-1251',
    rows: lines.length,
    columns: header,
    columnCount: header.length,
    unexpectedColumnRows,
    localityBlankRows,
    officeBlankRows,
    invalidNonblankLocalityCodes,
    invalidNonblankOfficeCodes,
    distinctValidLocalityCodes: localityCodes.size,
    distinctValidOfficeCodes: officeCodes.size,
    distinctValidCodesUnion: allCodes.size,
    minCode: [...allCodes].sort()[0],
    maxCode: [...allCodes].sort().at(-1),
    leadingZeroCodes: [...allCodes].filter(code => code.startsWith('0')).length,
    geometryLikeColumns,
    polygonOrMultiPolygonColumns: 0
  },
  rights: {
    datasetLicense: datapackage.licenses[0].name,
    datasetLicenseTitle: datapackage.licenses[0].title,
    attributionRequired: true,
    publicReuseAndRedistributionStatementObserved: true
  },
  promotion: {
    fixedAuthorizedPostcodeGeometryArtifacts: 0,
    assignmentsReconciledToAreaOrExplicitNonArea: 0,
    productionEligibleRecords: 0,
    approvedAgidRuntimeArtifacts: 0,
    addressOrOfficeRowsPromotedAsAreas: 0,
    pointBuffers: 0,
    convexOrConcaveHulls: 0,
    voronoiOrRasterCells: 0,
    syntheticFixturesPromoted: false
  }
};

console.log(JSON.stringify(result, null, 2));

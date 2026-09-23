import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const EXPECTED_FILES = {
  'bring-postcodes.html': '883e2a17385a45cadff574252f13778bd0995e87beac4dda2882e8f0aed02755',
  'bring-postcode-manual.html': '876cf7c762f81d76f64cbe7c97b2c65a35dc3da26a1686daa6ad85b14624ddc9',
  'bring-postcode-register.txt': '7a9f175cfcaa4d2229b0af904098b2cc8ac0825cbd6535949e0571ae887c3538',
  'data-norge-postcode-areas.html': '4c2efa23e992ecf404737c36a5f0bd48a2ca2b1c846ad445e98b5d3a9e071925',
  'cc-by-4.0-legalcode.html': '6d55b998ed5c54f43426d059a8c549ed58a3321e5463e6a6af1c6b56ab78c333',
};

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--source-dir' || argv[index] === '--output') {
      result[argv[index].slice(2)] = argv[index + 1];
      index += 1;
    }
  }
  if (!result['source-dir']) throw new Error('--source-dir is required');
  return result;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

const args = parseArgs(process.argv.slice(2));
const sourceDir = path.resolve(args['source-dir']);
const buffers = new Map();
const files = [];

for (const [name, expectedSha256] of Object.entries(EXPECTED_FILES)) {
  const buffer = await readFile(path.join(sourceDir, name));
  const actualSha256 = sha256(buffer);
  assert(actualSha256 === expectedSha256, `${name}: expected ${expectedSha256}, got ${actualSha256}`);
  buffers.set(name, buffer);
  files.push({ file: name, bytes: buffer.length, sha256: actualSha256 });
}

const register = new TextDecoder('windows-1252').decode(buffers.get('bring-postcode-register.txt'));
const rows = register.split(/\r?\n/).filter(Boolean).map((line, index) => {
  const cells = line.split('\t');
  assert(cells.length === 5, `row ${index + 1} does not have five fields`);
  const [postcode, postalPlace, municipalityCode, municipalityName, category] = cells;
  assert(/^\d{4}$/.test(postcode), `invalid postcode at row ${index + 1}: ${postcode}`);
  assert(/^\d{4}$/.test(municipalityCode), `invalid municipality at row ${index + 1}: ${municipalityCode}`);
  assert(/^[GPBS]$/.test(category), `invalid category at row ${index + 1}: ${category}`);
  return { postcode, postalPlace, municipalityCode, municipalityName, category };
});

const postcodeSet = new Set(rows.map(row => row.postcode));
const categoryCounts = Object.fromEntries(['G', 'P', 'B', 'S'].map(category => [
  category,
  rows.filter(row => row.category === category).length,
]));
const sjRows = rows.filter(row => /^(21|22)/.test(row.municipalityCode));
const expectedSjRows = [
  ['8099', 'JAN MAYEN', '2211', 'JAN MAYEN', 'G'],
  ['9170', 'LONGYEARBYEN', '2100', 'SVALBARD', 'G'],
  ['9171', 'LONGYEARBYEN', '2100', 'SVALBARD', 'P'],
  ['9173', 'NY-ÅLESUND', '2100', 'SVALBARD', 'B'],
  ['9174', 'HOPEN', '2100', 'SVALBARD', 'G'],
  ['9175', 'SVEAGRUVA', '2100', 'SVALBARD', 'G'],
  ['9176', 'BJØRNØYA', '2100', 'SVALBARD', 'G'],
  ['9178', 'BARENTSBURG', '2100', 'SVALBARD', 'G'],
].map(([postcode, postalPlace, municipalityCode, municipalityName, category]) => ({
  postcode,
  postalPlace,
  municipalityCode,
  municipalityName,
  category,
}));

assert(rows.length === 5122, `expected 5,122 register rows, got ${rows.length}`);
assert(postcodeSet.size === 5122, `expected 5,122 unique postcodes, got ${postcodeSet.size}`);
assert(JSON.stringify(categoryCounts) === JSON.stringify({ G: 3318, P: 1740, B: 60, S: 4 }), `unexpected categories: ${JSON.stringify(categoryCounts)}`);
assert(JSON.stringify(sjRows) === JSON.stringify(expectedSjRows), `unexpected SJ rows: ${JSON.stringify(sjRows)}`);

const utf8 = name => buffers.get(name).toString('utf8');
const signals = {
  registerEffectiveFrom20251001: utf8('bring-postcodes.html').includes('2025/10/01'),
  registerClaimsAllAddressingPostcodes: /contain all postcodes that are used for addressing mail/i.test(utf8('bring-postcodes.html')),
  manualDefinesAllCategories: ['G = Street addresses', 'P = P.O. Boxes', 'B = Both street addresses and P.O.Boxes', 'S = Postcode for special service'].every(value => utf8('bring-postcode-manual.html').includes(value)),
  manualClassifiesSvalbardAndJanMayenSeparately: ['21 Svalbard', '22 Jan Mayen'].every(value => utf8('bring-postcode-manual.html').includes(value))
    && /not(?:&nbsp;|\s)+ordinary counties/i.test(utf8('bring-postcode-manual.html')),
  areaMetadataNamesOfficialExtent: utf8('data-norge-postcode-areas.html').includes('offisielle postnumrenes utstrekning i areal'),
  areaMetadataNotesPostboxCodesAdditional: utf8('data-norge-postcode-areas.html').includes('Postnummer for postboksanlegg kommer i tillegg'),
  areaMetadataModified20260828: utf8('data-norge-postcode-areas.html').includes('2026-08-28'),
  areaMetadataNamesCcBy4: utf8('data-norge-postcode-areas.html').includes('Creative Commons Attribution 4.0 International'),
  areaMetadataNamesWfs: utf8('data-norge-postcode-areas.html').includes('Postnummerområder WFS'),
  ccByLegalCodeCaptured: /Attribution 4\.0 International/i.test(utf8('cc-by-4.0-legalcode.html')),
};
assert(Object.values(signals).every(Boolean), `missing official signal: ${JSON.stringify(signals)}`);

const result = {
  schemaVersion: 'postal-context-sj-source-inspection/v1',
  countryCode: 'SJ',
  inspectedAt: '2026-08-31T01:38:01.0709376Z',
  result: 'pass',
  files,
  exactOfficialBodiesBytes: files.reduce((sum, file) => sum + file.bytes, 0),
  postenRegister: {
    effectiveFrom: '2025-10-01',
    encoding: 'Windows-1252',
    delimiter: 'TAB',
    rows: rows.length,
    uniqueCodes: postcodeSet.size,
    duplicateCodes: rows.length - postcodeSet.size,
    malformedRows: 0,
    categoryCounts,
  },
  sjAssignments: {
    rows: sjRows.length,
    uniqueCodes: new Set(sjRows.map(row => row.postcode)).size,
    countyLike21SvalbardRows: sjRows.filter(row => row.municipalityCode.startsWith('21')).length,
    countyLike22JanMayenRows: sjRows.filter(row => row.municipalityCode.startsWith('22')).length,
    categoryCounts: Object.fromEntries(['G', 'P', 'B', 'S'].map(category => [category, sjRows.filter(row => row.category === category).length])),
    rowsExact: sjRows,
  },
  kartverketAreaMetadata: {
    dataset: 'Postnummerområder',
    metadataModified: '2026-08-28',
    officialPostcodeExtentClaimObserved: true,
    postOfficeBoxCodesAdditionalNoticeObserved: true,
    advertisedLicense: 'CC BY 4.0',
    fixedGeometryArtifactDownloaded: false,
    polygonOrMultiPolygonFeaturesValidated: 0,
    sjAssignmentsReconciledToAreaOrExplicitNonArea: 0,
  },
  authorityGap: {
    postenExplicitAgidProcessingStorageDerivationRedistributionAndPublicServingPermissionEstablished: false,
    fixedCurrentKartverketGeometryAndDigestPinned: false,
    completeSjAreaAndSourceDefinedNonAreaReconciliationProduced: false,
    approvedAgidRuntimeArtifacts: 0,
    productionEligibleRecords: 0,
  },
  identity: {
    repositoryCountryCode: 'SJ',
    sourceClassificationsRetained: ['21 Svalbard', '22 Jan Mayen'],
    noAndSjSilentlyMerged: false,
  },
  signals,
};

assert(result.exactOfficialBodiesBytes === 723960, `expected 723,960 exact bytes, got ${result.exactOfficialBodiesBytes}`);
const serialized = `${JSON.stringify(result, null, 2)}\n`;
if (args.output) await writeFile(path.resolve(args.output), serialized, 'utf8');
process.stdout.write(serialized);

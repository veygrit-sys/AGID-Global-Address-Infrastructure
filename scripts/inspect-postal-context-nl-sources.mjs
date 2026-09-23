import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const sourceDirIndex = args.indexOf('--source-dir');
if (sourceDirIndex < 0 || !args[sourceDirIndex + 1]) {
  throw new Error('usage: node scripts/inspect-postal-context-nl-sources.mjs --source-dir <directory>');
}
const sourceDir = args[sourceDirIndex + 1];

const sha256 = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
const bodySpec = [
  ['2026-cbs_pc6_2025_v1.zip', '53c399212f68c195dcfbf8d94df2442a5dec55cc748b32d663dbb4c347482520'],
  ['cbs-pc6-2025-v1/cbs_pc6_2025_v1.gpkg', '33ec2f9fa874b2937c9d6b84c99812fc950c6b0501c273b8d69f7174b2487948'],
  ['cbs-pc6-2025-v1/pc6_2025_v1.xlsx', 'ae2a8c0816aa3831f63be29b1a0c28b4f79651ce957233c63920fd3e0ea4374f'],
  ['cbs_postcode_page.html', '658cbe9bb48be1b07ff00714b81bfaa3c17f81dc73b6398525f903cd515c55f1'],
  ['cbs_rights_2025.html', '7e73269fb1ac58215024354c7900697eebfc93d15066eae2a58e23b9a6352c63'],
  ['pdok_html.html', 'ecff7ee47f003db1d5d198591f61b4bfd88bc1c4162b2dbfe6b6d51fd8cf61ec'],
  ['root.json', 'd8b70ba643c4e05e35615327bcad7ca8bcb7f3675f53110d389845bff7b0a3e6'],
  ['collections.json', '0a3f6d5c4b938d83488bd1a350a428bc110b6611361e558da8bbffcc99d37250'],
  ['conformance.json', 'cad6e33d63069dba80c4c23eca2c1863ec767058131295db8a5644fb1bb59d53'],
  ['collection.json', '391a26fe77f3d9b73511b020674e18858f5176cdd9bf19ca0363b93eb902bc91'],
  ['sample.json', '76ab9bceffce2e9534c80f86d24c9c890f9c07c1edc04728b47a0d43ee9dce0e'],
  ['schema.json', '91e3341c87e2d8876e6cbc21bec2d0b712ac39d88437e1d160a6f26cc32c13f2']
];

const exactBodies = bodySpec.map(([name, expected]) => {
  const path = join(sourceDir, ...name.split('/'));
  const bytes = readFileSync(path);
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== expected) throw new Error('digest mismatch for ' + name + ': ' + actual);
  return { name: basename(path), relativePath: name, byteLength: statSync(path).size, sha256: 'sha256:' + actual };
});

const gpkg = join(sourceDir, 'cbs-pc6-2025-v1', 'cbs_pc6_2025_v1.gpkg');
const windowsOgrInfo = 'C:\\Program Files\\GDAL\\ogrinfo.exe';
const ogrInfo = process.env.OGRINFO || (existsSync(windowsOgrInfo) ? windowsOgrInfo : 'ogrinfo');
const runOgr = ogrArgs => {
  const result = spawnSync(ogrInfo, ogrArgs, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error('ogrinfo failed: ' + (result.stderr || result.stdout));
  return result.stdout;
};
const parseInteger = (output, name) => {
  const match = output.match(new RegExp(name + ' \\(Integer(?:64)?\\) = (\\d+)'));
  if (!match) throw new Error('missing ' + name + ' in ogrinfo output');
  return Number(match[1]);
};

const summary = runOgr(['-ro', '-so', gpkg, 'cbs_pc6_2025']);
const featureCountMatch = summary.match(/Feature Count: (\d+)/);
const geometryMatch = summary.match(/Geometry: ([^\r\n]+)/);
const extentMatch = summary.match(/Extent: \(([-\d.]+), ([-\d.]+)\) - \(([-\d.]+), ([-\d.]+)\)/);
if (!featureCountMatch || !geometryMatch || !extentMatch || !summary.includes('ID["EPSG",28992]')) {
  throw new Error('unexpected CBS PC6 layer metadata');
}

const metricsSql = "SELECT COUNT(*) AS feature_count, COUNT(DISTINCT postcode6) AS distinct_codes, SUM(CASE WHEN postcode6 GLOB '[0-9][0-9][0-9][0-9][A-Z][A-Z]' THEN 0 ELSE 1 END) AS malformed_codes, SUM(CASE WHEN geom IS NULL OR ST_IsEmpty(geom) THEN 1 ELSE 0 END) AS empty_geometry, SUM(CASE WHEN ST_IsValid(geom)=0 THEN 1 ELSE 0 END) AS invalid_geometry, SUM(ST_NumGeometries(geom)) AS polygon_parts, SUM(ST_NPoints(geom)) AS positions FROM cbs_pc6_2025";
const metricsOutput = runOgr(['-ro', gpkg, '-dialect', 'SQLite', '-sql', metricsSql]);
const crosscheckSql = "SELECT SUM(CASE WHEN postcode6='2521CA' THEN 1 ELSE 0 END) AS headquarters_area_records, SUM(CASE WHEN postcode6='2500GG' THEN 1 ELSE 0 END) AS po_box_area_records, SUM(CASE WHEN postcode6='2500CC' THEN 1 ELSE 0 END) AS second_po_box_area_records FROM cbs_pc6_2025";
const crosscheckOutput = runOgr(['-ro', gpkg, '-dialect', 'SQLite', '-sql', crosscheckSql]);

const cbsPage = readFileSync(join(sourceDir, 'cbs_postcode_page.html'), 'utf8');
const cbsRights = readFileSync(join(sourceDir, 'cbs_rights_2025.html'), 'utf8');
if (!/18 augustus 2026/i.test(cbsPage) || !/alle postcodes ongeacht/i.test(cbsPage)) {
  throw new Error('CBS current page no longer matches the pinned correction and coverage notices');
}
if (!/zonder kosten/i.test(cbsRights) || !/ESRI Nederland/i.test(cbsRights)) {
  throw new Error('CBS rights page no longer matches the pinned reuse and attribution notices');
}

const root = JSON.parse(readFileSync(join(sourceDir, 'root.json'), 'utf8'));
const collections = JSON.parse(readFileSync(join(sourceDir, 'collections.json'), 'utf8'));
const collection = JSON.parse(readFileSync(join(sourceDir, 'collection.json'), 'utf8'));
const sample = JSON.parse(readFileSync(join(sourceDir, 'sample.json'), 'utf8'));
const schema = JSON.parse(readFileSync(join(sourceDir, 'schema.json'), 'utf8'));
if (collections.collections?.length !== 1 || collection.id !== 'postcode6') {
  throw new Error('unexpected PDOK collection inventory');
}
const sampleGeometryTypes = [...new Set(sample.features.map(feature => feature.geometry?.type))].sort();
const sampleYears = [...new Set(sample.features.map(feature => feature.properties?.jaarcode))].sort();

const result = {
  schemaVersion: 'postal-context-nl-source-inspection/v1',
  cbsCorrectedRelease: {
    reportingYear: 2025,
    version: 'v1 corrected 2026-08-18',
    zipBytes: exactBodies.find(body => body.relativePath.endsWith('.zip')).byteLength,
    geopackageBytes: exactBodies.find(body => body.relativePath.endsWith('.gpkg')).byteLength,
    workbookBytes: exactBodies.find(body => body.relativePath.endsWith('.xlsx')).byteLength,
    layer: 'cbs_pc6_2025',
    geometryType: geometryMatch[1].trim(),
    crs: 'EPSG:28992',
    extent: extentMatch.slice(1).map(Number),
    featureCount: parseInteger(metricsOutput, 'feature_count'),
    distinctCodes: parseInteger(metricsOutput, 'distinct_codes'),
    malformedCodes: parseInteger(metricsOutput, 'malformed_codes'),
    emptyGeometry: parseInteger(metricsOutput, 'empty_geometry'),
    invalidGeometry: parseInteger(metricsOutput, 'invalid_geometry'),
    polygonParts: parseInteger(metricsOutput, 'polygon_parts'),
    positions: parseInteger(metricsOutput, 'positions'),
    headquartersAreaRecords: parseInteger(crosscheckOutput, 'headquarters_area_records'),
    publicPoBox2500GgAreaRecords: parseInteger(crosscheckOutput, 'po_box_area_records'),
    publicPoBox2500CcAreaRecords: parseInteger(crosscheckOutput, 'second_po_box_area_records'),
    allPostcodesNoticeObserved: true,
    correctionNoticeObserved: true,
    freeUseNoticeObserved: true,
    cbsAndEsriAttributionObserved: true,
    geometryAuthority: 'derived_geometry'
  },
  pdokService: {
    title: root.title,
    collectionCount: collections.collections.length,
    collectionId: collection.id,
    collectionTitle: collection.title,
    collectionDescription: collection.description,
    sampleFeatures: sample.features.length,
    sampleGeometryTypes,
    sampleYears,
    schemaType: schema.type,
    authenticationRequired: false,
    license: 'CC BY 4.0'
  },
  authorityGap: {
    postnlCompleteOrdinaryAndExceptionDenominatorInspected: false,
    cbsGeometryEstablishesPostnlAssignment: false,
    publicPostnlHeadquartersAddressCodePresent: true,
    publicPostnlPoBoxCodePresent: false,
    eligibleProductionRecords: 0
  },
  exactBodies
};

if (Number(featureCountMatch[1]) !== result.cbsCorrectedRelease.featureCount) {
  throw new Error('feature count mismatch between layer metadata and SQL audit');
}
process.stdout.write(JSON.stringify(result, null, 2) + '\n');

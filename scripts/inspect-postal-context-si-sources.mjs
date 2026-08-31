import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const EXPECTED_FILES = {
  'gurs-public-access.html': '57485253c39e46ea5be309b2d9067fe41a059c312f9569da548fb18b1a5dcbb4',
  'gurs-rpe.html': '397edb778fccbd066f0a4bc75bf4341f506e0aa307a7830eeddf606a6f64bea1',
  'gurs-terms.html': '188648a7c37bb87076a76f25b7c69fd1a45343a91fddf363d1356feeeb8d3dec',
  'gurs-wfs-capabilities.xml': '5d904721c92cc789706a3ff91df8b042982fd74251c71c18d0d3890cf85a88e2',
  'gurs-wfs-describe.xml': '8d6e4243ec2bd09fae22dad3a13bc0a4990e5e3b08c4b9226013b4a8c88318c7',
  'gurs-wfs-index.json': 'ef967ac4e48b6cef87c89d73987f33e4b350f0de2916d505c255efc84a6fa77c',
  'posta-csv.headers': 'e68ec55e3c9887c12bc74689e216618c4e475533047ba01e2145336d2b1175e7',
  'posta-naslavljanje.html': '5ee545ff0408b1fcb8ed5d0a3a400d837f21d48854702a6bd2a29051e9072d33',
  'posta-postcodes.csv': 'a57f54f546e0782942f13be0d4c7f2766fe280e2a9639a05bddff199641eb54e',
  'posta-special.headers': 'c0ef362200cefc710bea78a340ed739024ad49a9abebd83f93fa21c77c6ba390',
  'gurs-wfs-page-000.json': 'b33a6213454e8b78462748ad36dd33eb07bc3b0e662e197524d37a32eb3e2fa8',
  'gurs-wfs-page-050.json': '7d6c88f104229ba6577003f79890087869cb873bb86d62aab3178b4a0574ff1c',
  'gurs-wfs-page-100.json': 'c1d3d8cbf01aa1e8cc929071125025ec7e448659624c8199f87a20ed149aed0c',
  'gurs-wfs-page-150.json': 'adc34f7f9bf4d83335f0b40cac9d603be98464188d9e340dd93cbf78b111a2df',
  'gurs-wfs-page-200.json': 'b56a33411b8ec1f0b20838f1b6a3bb9849965b28df646fc4a384ee19347e525a',
  'gurs-wfs-page-250.json': 'c88a18ac1735676d2584926da189e57186916c78acf18524a2676df890ae0701',
  'gurs-wfs-page-300.json': '28145d3c78c5631498c0dd274cbcb9fa152483ccc889aa821a5de4d924a40415',
  'gurs-wfs-page-350.json': '1c119f0074a8236f3e28f3bd4e248d5fea6a70c599792f78ebb92050494d4937',
  'gurs-wfs-page-400.json': '2f69b137518ad1314e2ea359be3de176f8af6002fa9d35b40a848a6f35e1a3bc',
  'gurs-wfs-page-450.json': 'ce7b2a2898b5dbed18657907e841ea2ecde224112013619ed118976880cbe8ea',
};

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--source-dir' || value === '--output') {
      result[value.slice(2)] = argv[index + 1];
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

function normalizedName(value) {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function inspectGeometry(geometry, stats) {
  assert(geometry && ['Polygon', 'MultiPolygon'].includes(geometry.type), `unsupported geometry: ${geometry?.type}`);
  stats.geometryTypes[geometry.type] = (stats.geometryTypes[geometry.type] ?? 0) + 1;
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  assert(polygons.length > 0, 'geometry has no polygon');
  for (const polygon of polygons) {
    assert(Array.isArray(polygon) && polygon.length > 0, 'polygon has no ring');
    stats.polygons += 1;
    for (const ring of polygon) {
      assert(Array.isArray(ring) && ring.length >= 4, 'ring has fewer than four positions');
      stats.rings += 1;
      stats.positions += ring.length;
      const first = ring[0];
      const last = ring.at(-1);
      assert(first[0] === last[0] && first[1] === last[1], 'ring is not closed');
      for (const position of ring) {
        assert(Array.isArray(position) && position.length >= 2, 'invalid position');
        const [longitude, latitude] = position;
        assert(Number.isFinite(longitude) && longitude >= -180 && longitude <= 180, `invalid longitude: ${longitude}`);
        assert(Number.isFinite(latitude) && latitude >= -90 && latitude <= 90, `invalid latitude: ${latitude}`);
        stats.bbox[0] = Math.min(stats.bbox[0], longitude);
        stats.bbox[1] = Math.min(stats.bbox[1], latitude);
        stats.bbox[2] = Math.max(stats.bbox[2], longitude);
        stats.bbox[3] = Math.max(stats.bbox[3], latitude);
      }
    }
  }
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
  files.push({ name, bytes: buffer.length, sha256: actualSha256 });
}

const decoder = new TextDecoder('windows-1250');
const csvText = decoder.decode(buffers.get('posta-postcodes.csv'));
const csvRows = [];
for (const line of csvText.split(/\r?\n/)) {
  const match = line.match(/;"?(\d{4})"?;"?([^";]+)"?;/);
  if (match) csvRows.push({ code: match[1], name: match[2].trim() });
}
assert(csvRows.length === 570, `expected 570 operator rows, got ${csvRows.length}`);
const operatorByCode = new Map();
for (const row of csvRows) {
  const rows = operatorByCode.get(row.code) ?? [];
  rows.push(row);
  operatorByCode.set(row.code, rows);
}
const duplicateOperatorCodes = [...operatorByCode].filter(([, rows]) => rows.length > 1).map(([code]) => code);
assert(operatorByCode.size === 569, `expected 569 operator codes, got ${operatorByCode.size}`);
assert(JSON.stringify(duplicateOperatorCodes) === JSON.stringify(['1002']), `unexpected duplicate codes: ${duplicateOperatorCodes.join(',')}`);

const index = JSON.parse(buffers.get('gurs-wfs-index.json').toString('utf8'));
assert(index.numberMatched === 466 || index.totalFeatures === 466, 'index does not declare 466 matched features');
assert(index.features.length === 466, `expected 466 index features, got ${index.features.length}`);
const indexCodes = new Set(index.features.map((feature) => String(feature.properties.SIFRA)));
assert(indexCodes.size === 466, `expected 466 unique index codes, got ${indexCodes.size}`);

const pageNames = Object.keys(EXPECTED_FILES).filter((name) => name.startsWith('gurs-wfs-page-')).sort();
const features = pageNames.flatMap((name) => JSON.parse(buffers.get(name).toString('utf8')).features);
assert(features.length === 466, `expected 466 geometry features, got ${features.length}`);
const featureIds = new Set();
const geometryCodes = new Set();
const geometryStats = {
  geometryTypes: {},
  polygons: 0,
  rings: 0,
  positions: 0,
  bbox: [Infinity, Infinity, -Infinity, -Infinity],
};
for (const feature of features) {
  assert(!featureIds.has(feature.id), `duplicate feature id: ${feature.id}`);
  featureIds.add(feature.id);
  const code = String(feature.properties.SIFRA);
  assert(!geometryCodes.has(code), `duplicate geometry code: ${code}`);
  geometryCodes.add(code);
  assert(indexCodes.has(code), `geometry code absent from index: ${code}`);
  inspectGeometry(feature.geometry, geometryStats);
}
assert(geometryCodes.size === 466, `expected 466 unique geometry codes, got ${geometryCodes.size}`);

const operatorOnlyCodes = [...operatorByCode.keys()].filter((code) => !geometryCodes.has(code)).sort();
const geometryOnlyCodes = [...geometryCodes].filter((code) => !operatorByCode.has(code)).sort();
assert(operatorOnlyCodes.length === 103, `expected 103 operator-only codes, got ${operatorOnlyCodes.length}`);
assert(geometryOnlyCodes.length === 0, `expected no geometry-only codes, got ${geometryOnlyCodes.length}`);

const nameMismatches = index.features
  .map((feature) => {
    const code = String(feature.properties.SIFRA);
    const gursName = String(feature.properties.NAZIV);
    const operatorNames = operatorByCode.get(code).map((row) => row.name);
    return operatorNames.some((name) => normalizedName(name) === normalizedName(gursName))
      ? null
      : { code, gursName, operatorNames };
  })
  .filter(Boolean);
assert(nameMismatches.length === 6, `expected 6 normalized name mismatches, got ${nameMismatches.length}`);

const utf8 = (name) => buffers.get(name).toString('utf8');
const signals = {
  operatorCsvHttp200: /HTTP\/\S+ 200 OK/i.test(utf8('posta-csv.headers')),
  operatorCsvLastModified20260701: /Last-Modified:\s*Wed, 01 Jul 2026 09:45:14 GMT/i.test(utf8('posta-csv.headers')),
  specialPdfHttp404: /HTTP\/\S+ 404 NOT FOUND/i.test(utf8('posta-special.headers')),
  specialPdfContentLength744: /Content-Length:\s*744/i.test(utf8('posta-special.headers')),
  wfsPostalLayerDeclared: utf8('gurs-wfs-capabilities.xml').includes('SI.GURS.RPE:POSTNI_OKOLISI'),
  wfsDefaultCrsDeclared: utf8('gurs-wfs-capabilities.xml').includes('urn:ogc:def:crs:EPSG::3794'),
  wfsSchemaHasCodeAndGeometry: ['SIFRA', 'GEOM', 'EID_POSTNI_OKOLIS'].every((value) => utf8('gurs-wfs-describe.xml').includes(value)),
  publicAccessNamesPostalLayer: utf8('gurs-public-access.html').includes('SI.GURS.RPE:POSTNI_OKOLISI'),
  publicAccessNamesCcBy4: /Creative Commons[^<]{0,80}4\.0/i.test(utf8('gurs-public-access.html')),
  rpeNamesPostalDistrict: /po(?:š|&scaron;)tni okoli(?:š|&scaron;)/i.test(utf8('gurs-rpe.html')),
};
assert(Object.values(signals).every(Boolean), `missing official-page signal: ${JSON.stringify(signals)}`);

const result = {
  countryCode: 'SI',
  inspectedAt: '2026-08-31T00:58:18.436Z',
  result: 'pass',
  files,
  operatorAssignments: {
    rows: csvRows.length,
    uniqueCodes: operatorByCode.size,
    duplicateCodes: duplicateOperatorCodes,
  },
  officialPostalDistrictGeometry: {
    features: features.length,
    uniqueCodes: geometryCodes.size,
    ...geometryStats,
  },
  crosswalk: {
    operatorOnlyCount: operatorOnlyCodes.length,
    operatorOnlyCodes,
    geometryOnlyCount: geometryOnlyCodes.length,
    normalizedNameMismatchCount: nameMismatches.length,
    normalizedNameMismatches: nameMismatches,
  },
  signals,
  conclusion: {
    geometryUsableForMatchedCodes: true,
    completeCurrentOperatorClassification: false,
    blocker: 'The current official special-code PDF returns HTTP 404, so 103 operator-only codes cannot be classified as source-defined non-area exceptions.',
  },
};

const serialized = `${JSON.stringify(result, null, 2)}\n`;
if (args.output) await writeFile(path.resolve(args.output), serialized, 'utf8');
process.stdout.write(serialized);

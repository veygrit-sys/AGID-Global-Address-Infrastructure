import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import area from '@turf/area';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import booleanValid from '@turf/boolean-valid';
import cleanCoords from '@turf/clean-coords';
import { feature, point } from '@turf/helpers';
import rewind from '@turf/rewind';
import jsts from 'jsts';
import proj4 from 'proj4';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHP_DIGEST = 'sha256:b596bce5b254d68a783a1c0d3e3dc62d3ba336756c026588b9f43af41d7501cc';
const DBF_DIGEST = 'sha256:7601027b8f1954f8bc273533108fa8c7395f437dafe34be657569d5627532929';
const CSV_DIGEST = 'sha256:9e0559fb7882a7fcd1cf0b71786f8d7b269da1636365bbc91c934665346f5ab8';
const SHP_ZIP_DIGEST = 'sha256:a58e105be27c1b4f4797ccbb5765861711ada593163059969c49a33489e0a60a';
const CSV_ZIP_DIGEST = 'sha256:0542e70aaf2890a5e48d8bb22e2aec233a413bc26a8420d506551ac3a1af1e26';
const RELEASE_ID = 'li-swisstopo-plzo-20260811';
const RELEASE_INSTANT = '2026-08-30T14:39:53.180Z';
const SOURCE_DATE = '2026-08-11';
const LICENSE_ID = 'swisstopo-ogd-terms-v1.3.2021';
const EXPECTED_DBF_RECORDS = 4073;
const EXPECTED_CSV_ROWS = 5716;
const EXPECTED_LI_ROWS = 20;
const EXPECTED_CODES = ['9485', '9486', '9487', '9488', '9490', '9491', '9492', '9493', '9494', '9495', '9496', '9497', '9498'];
const LI_BFS_MIN = 7001;
const LI_BFS_MAX = 7011;
const LI_BOUNDS = [9.45, 47.03, 9.65, 47.31];
const EPSG_2056 = '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs';

function fail(message) {
  throw new Error(`li-m2-${message}`);
}

function sha256(bytes) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function canonicalJson(value) {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') {
    if (typeof value === 'number' && !Number.isFinite(value)) fail('canonical-number');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (!value || typeof value !== 'object') fail('canonical-value');
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
}

function parseCsv(bytes) {
  if (sha256(bytes) !== CSV_DIGEST) fail('csv-digest');
  const lines = bytes.toString('utf8').replace(/^\uFEFF/u, '').trimEnd().split(/\r?\n/u);
  const headers = lines.shift().split(';');
  const rows = lines.map((line, index) => {
    const values = line.split(';');
    if (values.length !== headers.length) fail(`csv-column-count-${index + 2}`);
    return Object.fromEntries(headers.map((header, offset) => [header, values[offset]]));
  });
  if (rows.length !== EXPECTED_CSV_ROWS) fail(`csv-row-count-${rows.length}`);
  const liRows = rows.filter(row => {
    const bfs = Number(row['BFS-Nr']);
    return Number.isInteger(bfs) && bfs >= LI_BFS_MIN && bfs <= LI_BFS_MAX;
  });
  if (liRows.length !== EXPECTED_LI_ROWS) fail(`li-csv-row-count-${liRows.length}`);
  if (liRows.some(row => row['Kantonskürzel'] !== '' || row.Zusatzziffer !== '00')) {
    fail('li-country-or-plz6-profile');
  }
  const zipIds = new Set(liRows.map(row => row.ZIP_ID));
  const codes = [...new Set(liRows.map(row => row.PLZ4))].sort();
  if (codes.join(',') !== EXPECTED_CODES.join(',') || zipIds.size !== EXPECTED_CODES.length) {
    fail(`li-code-profile-${codes.join('-')}`);
  }
  for (const row of rows.filter(candidate => zipIds.has(candidate.ZIP_ID))) {
    const bfs = Number(row['BFS-Nr']);
    if (!Number.isInteger(bfs) || bfs < LI_BFS_MIN || bfs > LI_BFS_MAX || row['Kantonskürzel'] !== '') {
      fail(`cross-border-csv-row-${row.ZIP_ID}-${row['BFS-Nr']}-${row['Kantonskürzel']}`);
    }
  }
  return { rows, liRows, zipIds };
}

function parseDbf(bytes) {
  if (sha256(bytes) !== DBF_DIGEST) fail('dbf-digest');
  const recordCount = bytes.readUInt32LE(4);
  const headerLength = bytes.readUInt16LE(8);
  const recordLength = bytes.readUInt16LE(10);
  if (recordCount !== EXPECTED_DBF_RECORDS) fail(`dbf-record-count-${recordCount}`);
  const fields = [];
  let offset = 1;
  for (let cursor = 32; cursor < headerLength - 1; cursor += 32) {
    const name = bytes.subarray(cursor, cursor + 11).toString('ascii').replace(/\0.*$/u, '').trim();
    const length = bytes[cursor + 16];
    fields.push({ name, offset, length });
    offset += length;
  }
  if (offset !== recordLength) fail('dbf-record-length');
  const expectedFields = ['FK_LOCALIT', 'ZIP_ID', 'ZIP4', 'ADDITIONAL', 'STATUS', 'INMODIFICA', 'MODIFIED', 'SHAPE_AREA', 'SHAPE_LEN'];
  if (fields.map(field => field.name).join(',') !== expectedFields.join(',')) fail('dbf-field-profile');
  return Array.from({ length: recordCount }, (_, index) => {
    const start = headerLength + index * recordLength;
    if (bytes[start] === 0x2a) fail(`dbf-deleted-record-${index + 1}`);
    return Object.fromEntries(fields.map(field => [
      field.name,
      bytes.subarray(start + field.offset, start + field.offset + field.length).toString('latin1').trim(),
    ]));
  });
}

function signedArea(ring) {
  let sum = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    sum += ring[index][0] * ring[index + 1][1] - ring[index + 1][0] * ring[index][1];
  }
  return sum / 2;
}

function ringBounds(ring) {
  return ring.reduce((bbox, [x, y]) => [
    Math.min(bbox[0], x), Math.min(bbox[1], y), Math.max(bbox[2], x), Math.max(bbox[3], y),
  ], [Infinity, Infinity, -Infinity, -Infinity]);
}

function pointInRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function parseShp(bytes) {
  if (sha256(bytes) !== SHP_DIGEST) fail('shp-digest');
  if (bytes.readInt32BE(0) !== 9994 || bytes.readInt32LE(28) !== 1000 || bytes.readInt32LE(32) !== 5) {
    fail('shp-header');
  }
  if (bytes.readInt32BE(24) * 2 !== bytes.length) fail('shp-file-length');
  const records = [];
  let cursor = 100;
  while (cursor < bytes.length) {
    const recordNumber = bytes.readInt32BE(cursor);
    const contentBytes = bytes.readInt32BE(cursor + 4) * 2;
    const start = cursor + 8;
    const end = start + contentBytes;
    if (end > bytes.length || bytes.readInt32LE(start) !== 5) fail(`shp-record-${recordNumber}`);
    const partCount = bytes.readInt32LE(start + 36);
    const pointCount = bytes.readInt32LE(start + 40);
    const partOffsets = Array.from({ length: partCount }, (_, index) => bytes.readInt32LE(start + 44 + index * 4));
    const pointsStart = start + 44 + partCount * 4;
    const points = Array.from({ length: pointCount }, (_, index) => [
      bytes.readDoubleLE(pointsStart + index * 16),
      bytes.readDoubleLE(pointsStart + index * 16 + 8),
    ]);
    const rings = partOffsets.map((partStart, index) => points.slice(partStart, partOffsets[index + 1] ?? pointCount));
    if (rings.some(ring => ring.length < 4 || ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1])) {
      fail(`shp-ring-${recordNumber}`);
    }
    records.push({ recordNumber, rings });
    cursor = end;
  }
  if (records.length !== EXPECTED_DBF_RECORDS || cursor !== bytes.length) fail(`shp-record-count-${records.length}`);
  return records;
}

function convertGeometry(rings, code) {
  const enriched = rings.map((ring, index) => ({
    index,
    ring,
    area: Math.abs(signedArea(ring)),
    bbox: ringBounds(ring),
    parent: null,
    depth: null,
  }));
  for (const child of enriched) {
    const [x, y] = child.ring[0];
    const candidates = enriched.filter(candidate => candidate.area > child.area
      && x >= candidate.bbox[0] && x <= candidate.bbox[2]
      && y >= candidate.bbox[1] && y <= candidate.bbox[3]
      && pointInRing(child.ring[0], candidate.ring));
    candidates.sort((left, right) => left.area - right.area);
    child.parent = candidates[0]?.index ?? null;
  }
  const depthOf = ring => {
    if (ring.depth !== null) return ring.depth;
    ring.depth = ring.parent === null ? 0 : depthOf(enriched[ring.parent]) + 1;
    return ring.depth;
  };
  enriched.forEach(depthOf);
  const projectRing = ring => ring.map(([x, y]) => {
    const [longitude, latitude] = proj4(EPSG_2056, 'EPSG:4326', [x, y]);
    return [Number(longitude.toFixed(8)), Number(latitude.toFixed(8))];
  });
  const polygons = enriched
    .filter(ring => ring.depth % 2 === 0)
    .map(outer => [
      projectRing(outer.ring),
      ...enriched.filter(hole => hole.parent === outer.index && hole.depth % 2 === 1).map(hole => projectRing(hole.ring)),
    ]);
  const rawGeometry = polygons.length === 1
    ? { type: 'Polygon', coordinates: polygons[0] }
    : { type: 'MultiPolygon', coordinates: polygons };
  const rewound = cleanCoords(rewind(feature(rawGeometry), { reverse: false }), { mutate: false });
  if (!booleanValid(rewound) || !new jsts.operation.valid.IsValidOp(new jsts.io.GeoJSONReader().read(rewound.geometry)).isValid()) {
    fail(`geometry-invalid-${code}`);
  }
  if (!(area(rewound) > 0)) fail(`geometry-area-${code}`);
  return rewound.geometry;
}

function countPositions(geometry) {
  let count = 0;
  const visit = value => {
    if (Array.isArray(value) && value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      const [longitude, latitude] = value;
      if (longitude < LI_BOUNDS[0] || longitude > LI_BOUNDS[2] || latitude < LI_BOUNDS[1] || latitude > LI_BOUNDS[3]) {
        fail(`coordinate-outside-li-envelope-${longitude}-${latitude}`);
      }
      count += 1;
      return;
    }
    if (!Array.isArray(value)) fail('geometry-coordinate');
    value.forEach(visit);
  };
  visit(geometry.coordinates);
  return count;
}

function parseSources({ shpBytes, dbfBytes, csvBytes }) {
  const csv = parseCsv(csvBytes);
  const dbfRows = parseDbf(dbfBytes);
  const shapes = parseShp(shpBytes);
  const byZipId = new Map();
  for (let index = 0; index < dbfRows.length; index += 1) {
    const row = dbfRows[index];
    if (!csv.zipIds.has(row.ZIP_ID)) continue;
    if (row.STATUS !== 'REAL' || row.INMODIFICA !== 'FALSE' || row.ADDITIONAL !== '00') {
      fail(`li-polygon-status-${row.ZIP_ID}`);
    }
    if (byZipId.has(row.ZIP_ID)) fail(`duplicate-li-polygon-${row.ZIP_ID}`);
    byZipId.set(row.ZIP_ID, { row, shape: shapes[index] });
  }
  if (byZipId.size !== EXPECTED_CODES.length) fail(`li-polygon-count-${byZipId.size}`);
  const rows = [...byZipId].map(([zipId, item]) => {
    const csvRows = csv.liRows.filter(row => row.ZIP_ID === zipId);
    const codes = [...new Set(csvRows.map(row => row.PLZ4))];
    const names = [...new Set(csvRows.map(row => row.Ortschaftsname))];
    if (codes.length !== 1 || names.length !== 1 || item.row.ZIP4 !== codes[0]) fail(`li-identity-${zipId}`);
    const geometry = convertGeometry(item.shape.rings, codes[0]);
    for (const csvRow of csvRows) {
      if (!booleanPointInPolygon(point([Number(csvRow.E), Number(csvRow.N)]), feature(geometry), { ignoreBoundary: false })) {
        fail(`li-centroid-outside-${zipId}-${csvRow['BFS-Nr']}`);
      }
    }
    return {
      code: codes[0],
      label: names[0],
      zipId,
      modified: `${item.row.MODIFIED.slice(0, 4)}-${item.row.MODIFIED.slice(4, 6)}-${item.row.MODIFIED.slice(6, 8)}`,
      municipalityCodes: [...new Set(csvRows.map(row => row['BFS-Nr']))].sort(),
      geometry,
      positions: countPositions(geometry),
    };
  }).sort((left, right) => left.code.localeCompare(right.code));
  if (rows.map(row => row.code).join(',') !== EXPECTED_CODES.join(',')) fail('published-code-profile');
  return { rows, csvRows: csv.rows.length, liCsvRows: csv.liRows.length };
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value)}\n`, 'utf8');
}

function writeJson(path, value) {
  const bytes = jsonBytes(value);
  writeFileSync(path, bytes);
  return { digest: sha256(bytes), byteLength: bytes.length };
}

function build({ shpPath, dbfPath, csvPath, outputDirectory, reportPath }) {
  const parsed = parseSources({
    shpBytes: readFileSync(shpPath),
    dbfBytes: readFileSync(dbfPath),
    csvBytes: readFileSync(csvPath),
  });
  const geometrySource = {
    sourceId: 'li-swisstopo-plzo-20260811',
    sourceType: 'official',
    assignmentAuthority: 'official_postal_mapping_authority',
    geometryAuthority: 'official_postal_geometry',
    sourceVersion: 'Official directory of towns and cities; STAC item datetime 2026-08-11; AMTOVZ_ZIP EPSG:2056; status REAL; PLZ6 suffix 00; transformed to EPSG:4326',
    sourceDate: SOURCE_DATE,
    licenseId: LICENSE_ID,
    digest: SHP_ZIP_DIGEST,
  };
  const assignmentSource = {
    ...geometrySource,
    sourceId: 'li-swisstopo-plzo-20260811-bfs-country-partition',
    geometryAuthority: 'none',
    sourceVersion: 'Official directory CSV EPSG:4326; municipality BFS 7001-7011; blank Swiss canton field; ZIP_ID join to AMTOVZ_ZIP',
    digest: CSV_ZIP_DIGEST,
  };
  const validTime = { from: '2026-08-11T00:00:00.000Z', to: null };
  const knownTime = { from: RELEASE_INSTANT, to: null };
  const countryNode = {
    id: 'country-li', kind: 'administrative_area', featureKind: 'country', geometryType: 'none',
    countryCode: 'LI', label: 'Liechtenstein', visibility: 'public',
  };
  const postalNodes = parsed.rows.map(row => ({
    id: `postal-li-${row.code}`, kind: 'postal_feature', featureKind: 'standard_area',
    geometryType: row.geometry.type.toLowerCase(), countryCode: 'LI', postalCode: row.code,
    label: `${row.code} ${row.label}`, visibility: 'public',
  }));
  const nodes = [countryNode, ...postalNodes];
  const assertions = parsed.rows.map(row => ({
    id: `swisstopo-li-20260811-${row.code}-part-of-li`,
    fromNodeId: `postal-li-${row.code}`, toNodeId: countryNode.id, relation: 'part_of',
    validTime, knownTime, source: assignmentSource, method: 'explicit_assignment',
    quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT },
  }));
  const features = parsed.rows.map(row => ({
    id: `swisstopo-li-20260811-${row.code}`, nodeId: `postal-li-${row.code}`,
    role: 'postal_area', publicationClass: 'public_context', geometry: row.geometry,
    source: geometrySource, validTime, knownTime,
    quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT },
  }));
  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, {
    schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'LI', releaseId: RELEASE_ID, features,
  });
  const graphRelease = {
    schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-li-swisstopo-plzo',
    repositoryUrl: 'https://github.com/veygrit-sys/Address-Grid-ID', countryCode: 'LI',
    releaseId: RELEASE_ID, policyVersion: 'liechtenstein-swisstopo-plzo-domicile-postcodes-v1',
    releasedAt: RELEASE_INSTANT, validTime, manifestDigest: `sha256:${'0'.repeat(64)}`,
    artifacts: [{
      path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json',
      digest: geometryArtifact.digest, byteLength: geometryArtifact.byteLength,
      recordCount: features.length, licenseRefs: [LICENSE_ID],
    }],
  };
  const { manifestDigest: _placeholder, ...manifestPayload } = graphRelease;
  graphRelease.manifestDigest = sha256(Buffer.from(canonicalJson(manifestPayload), 'utf8'));
  const graphPath = join(outputDirectory, 'graph.json');
  const graphArtifact = writeJson(graphPath, {
    schemaVersion: 'postal-context-graph/v0.1', release: graphRelease, nodes, assertions,
  });
  const descriptorPath = join(outputDirectory, 'descriptor.json');
  const descriptorArtifact = writeJson(descriptorPath, {
    schemaVersion: 'postal-context-pack-descriptor/v0.1', repositoryId: graphRelease.repositoryId,
    countryCode: 'LI', releaseId: RELEASE_ID, policyVersion: graphRelease.policyVersion,
    sequence: 1, previousDescriptorDigest: null, graphManifestDigest: graphRelease.manifestDigest,
    createdAt: RELEASE_INSTANT, maturity: 'M2_experimental', synthetic: false,
    promotionEligible: true, containsResidentialAddressPoints: false,
    artifacts: [
      { role: 'graph', path: basename(graphPath), mediaType: 'application/vnd.agid.postal-context-graph+json',
        schemaVersion: 'postal-context-graph/v0.1', byteLength: graphArtifact.byteLength,
        digest: graphArtifact.digest, recordCounts: { nodes: nodes.length, assertions: assertions.length } },
      { role: 'geometry', path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json',
        schemaVersion: 'postal-context-geometry/v0.1', byteLength: geometryArtifact.byteLength,
        digest: geometryArtifact.digest,
        recordCounts: { features: features.length, positions: parsed.rows.reduce((sum, row) => sum + row.positions, 0) } },
    ],
  });
  const report = {
    schemaVersion: 'postal-context-li-m2-build/v1', countryCode: 'LI', generatedAt: RELEASE_INSTANT,
    releaseId: RELEASE_ID,
    input: {
      stacItemDate: SOURCE_DATE,
      shapefileZipDigest: SHP_ZIP_DIGEST,
      csvZipDigest: CSV_ZIP_DIGEST,
      componentDigests: { shp: SHP_DIGEST, dbf: DBF_DIGEST, csv: CSV_DIGEST },
      sourceDbfRecords: EXPECTED_DBF_RECORDS,
      sourceCsvRows: parsed.csvRows,
    },
    identity: {
      countryPartition: 'official municipality BFS 7001-7011 and blank Swiss canton field, joined by ZIP_ID',
      liCsvRows: parsed.liCsvRows,
      domicilePlz6Rows: parsed.rows.length,
      domicilePlz4Codes: parsed.rows.map(row => row.code),
      excludedSwissAndAustrianRows: true,
      selectedRowsHaveOnlyLiMunicipalities: true,
    },
    geometry: {
      publishedFeatures: features.length,
      polygonFeatures: parsed.rows.filter(row => row.geometry.type === 'Polygon').length,
      multiPolygonFeatures: parsed.rows.filter(row => row.geometry.type === 'MultiPolygon').length,
      positions: parsed.rows.reduce((sum, row) => sum + row.positions, 0),
      allStatusReal: true,
      allNotInModification: true,
      allRingsClosed: true,
      allTurfAndJstsValid: true,
      allCsvCentroidsInsidePublishedGeometry: true,
      allCoordinatesWithinLiEnvelope: true,
      crsTransformation: 'EPSG:2056 to EPSG:4326 using PROJ somerc definition; coordinates rounded to 8 decimals; RFC 7946 ring winding',
      sourceModificationDates: Object.fromEntries(parsed.rows.map(row => [row.code, row.modified])),
    },
    policy: {
      onlyDomicilePostcodeTypes10And20RepresentedByPlzo: true,
      specialCompanyAdministrativeAndPoBoxAreasInvented: 0,
      addressBuildingRecipientCustomerOrLandRightsRowsPublished: 0,
      assignmentGeometryAndAddressContextRemainSeparated: true,
    },
    artifacts: { graph: graphArtifact, geometry: geometryArtifact, descriptor: descriptorArtifact },
  };
  if (reportPath) writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

export { build, parseCsv, parseDbf, parseShp, parseSources };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const shpPath = resolve(process.argv[2] ?? '');
  const dbfPath = resolve(process.argv[3] ?? '');
  const csvPath = resolve(process.argv[4] ?? '');
  const outputDirectory = resolve(process.argv[5] ?? join(ROOT, 'data/postal_country_packs/li/postal-context/m2'));
  const reportPath = process.argv[6] ? resolve(process.argv[6]) : undefined;
  if (!process.argv[2] || !process.argv[3] || !process.argv[4]) fail('usage-shp-dbf-csv-required');
  console.log(JSON.stringify(build({ shpPath, dbfPath, csvPath, outputDirectory, reportPath }), null, 2));
}

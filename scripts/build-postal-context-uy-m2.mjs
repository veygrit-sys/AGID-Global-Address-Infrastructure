import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_ID = 'uy-correo-postal-polygons-2023-08-fixed-20260902';
const RELEASE_INSTANT = '2026-09-02T11:40:31.132Z';
const DATASET_DATE = '2023-08-16';
const LICENSE_ID = 'uruguay-open-data-license-v0.1';
const SOURCE_URL = 'https://catalogodatos.gub.uy/dataset/7eb3681f-3e58-475d-9cd4-4527dc6ab234/resource/271e6277-6b0f-44f6-962d-21b8ba88e9e4/download/codigos_postales.kml';
const EXPECTED_BOUNDS = [-58.439348978944, -34.9740543027889, -53.1810509363889, -30.0855024328926];
const EXPECTED = {
  'codigos-postales-2023-08.kml': 'f4ebcd702981f6f12b1c3f18cd1c0b199b4dd202437cb0f1f9b886f0588c9272',
  'codigospostales-2023-08.zip': '71783263bbcb8eed8b101e09ce5af766245a9a1e39c74bbe38e77482fe6fe1b2',
  'package-show.json': '120adb444ca90c94d2a9c2642661e8effdbceca48e826c90fcbb171cf94489c6',
  'resource-page.html': '2e77f7a6db00d9a7f8e756758582732729dd530f3ef5bdbcfa72ee688c248a17',
  'licencia-datos-abiertos.html': '67756c1b0bacf97aaac7fbd364f28ce33d643ca88acb25c071e8d34e587bf4d4',
  'RdeD358-2021.pdf': '8dae423130002a12a8aa2c37aec99e1dbc341a040f8533f2905fc32bbe3295d0',
  'el-codigo-postal-uruguayo-v2.pdf': 'eb9dcd2d0c9497c0dc447d1c7e7ff550e3fb41356933c2dd3c8c8a9815efa55c',
  'postal-shp/codigos_postales.cpg': '3ad3031f5503a4404af825262ee8232cc04d4ea6683d42c5dd0a2f2a27ac9824',
  'postal-shp/codigos_postales.dbf': '94ea8660a75968aed35b9de3a12f5b7a473a05739a64dfdadc3844237c628d7c',
  'postal-shp/codigos_postales.prj': 'a02a27b1d1982c8516d83398e85a3c8b1aef1713c13ef4d84d7bde17430c07c4',
  'postal-shp/codigos_postales.shp': '8187c2c350a35868e0e0536418976e585d52e2ef1ebd22126820661abd69e182',
  'postal-shp/codigos_postales.shx': '6449bc3977c4c9827621a7b270fabdd5fbc1f895b5537c07fc6693595ab58c70',
};

function fail(message) { throw new Error(`uy-m2-${message}`); }
function sha256(bytes) { return `sha256:${createHash('sha256').update(bytes).digest('hex')}`; }
function canonicalJson(value) {
  if (value === null) return 'null';
  if (['string', 'boolean', 'number'].includes(typeof value)) {
    if (typeof value === 'number' && !Number.isFinite(value)) fail('canonical-number');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (!value || typeof value !== 'object') fail('canonical-value');
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
}
function same(left, right) { return canonicalJson(left) === canonicalJson(right); }
function artifactPath(path) { return relative(ROOT, path).replaceAll('\\', '/'); }
function writeJson(path, value, pretty = false) {
  mkdirSync(dirname(path), { recursive: true });
  const bytes = Buffer.from((pretty ? JSON.stringify(value, null, 2) : canonicalJson(value)) + '\n', 'utf8');
  writeFileSync(path, bytes);
  return { path: artifactPath(path), byteLength: bytes.length, digest: sha256(bytes) };
}
function readExact(directory, name) {
  const bytes = readFileSync(join(directory, name));
  const digest = sha256(bytes);
  if (digest !== `sha256:${EXPECTED[name]}`) fail(`source-digest-${name}-${digest}`);
  return bytes;
}
function decodeXml(value) {
  return value.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&apos;', "'");
}
function ringArea(ring) {
  let sum = 0;
  for (let index = 0; index < ring.length - 1; index += 1) sum += ring[index][0] * ring[index + 1][1] - ring[index + 1][0] * ring[index][1];
  return sum / 2;
}
function parseCoordinates(text) {
  return decodeXml(text).trim().split(/\s+/u).filter(Boolean).map(token => {
    const [longitude, latitude] = token.split(',').map(Number);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) fail('invalid-position');
    return [longitude, latitude];
  });
}
function firstCapture(text, expression, label) {
  const value = expression.exec(text)?.[1];
  if (value === undefined) fail(`missing-${label}`);
  return decodeXml(value.trim());
}
function parseKml(bytes) {
  const text = bytes.toString('utf8');
  const placemarks = [...text.matchAll(/<Placemark\b[\s\S]*?<\/Placemark>/gu)].map(match => match[0]);
  const rows = placemarks.map(placemark => {
    const cpId = Number(firstCapture(placemark, /<SimpleData\s+name="cp_id">([\s\S]*?)<\/SimpleData>/u, 'cp-id'));
    const postalCode = firstCapture(placemark, /<SimpleData\s+name="codigo_pos">([\s\S]*?)<\/SimpleData>/u, 'postal-code').padStart(5, '0');
    const polygons = [...placemark.matchAll(/<Polygon\b[\s\S]*?<\/Polygon>/gu)].map(match => {
      const polygon = match[0];
      const outer = firstCapture(polygon, /<outerBoundaryIs>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>[\s\S]*?<\/outerBoundaryIs>/u, 'outer-ring');
      const inners = [...polygon.matchAll(/<innerBoundaryIs>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>[\s\S]*?<\/innerBoundaryIs>/gu)].map(inner => parseCoordinates(inner[1]));
      return [parseCoordinates(outer), ...inners.filter(ring => Math.abs(ringArea(ring)) >= 1e-14)];
    });
    if (!Number.isInteger(cpId) || !/^\d{5}$/u.test(postalCode) || polygons.length === 0) fail(`row-${cpId}-${postalCode}`);
    return { cpId, postalCode, geometry: polygons.length === 1 ? { type: 'Polygon', coordinates: polygons[0] } : { type: 'MultiPolygon', coordinates: polygons } };
  }).sort((left, right) => left.postalCode.localeCompare(right.postalCode));
  if (rows.length !== 121 || new Set(rows.map(row => row.cpId)).size !== 121 || new Set(rows.map(row => row.postalCode)).size !== 121) fail('feature-denominator');
  return rows;
}
function inspectGeometry(rows) {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  let positions = 0; let parts = 0; let rings = 0; let holes = 0;
  for (const row of rows) {
    const polygons = row.geometry.type === 'Polygon' ? [row.geometry.coordinates] : row.geometry.coordinates;
    parts += polygons.length;
    for (const polygon of polygons) {
      holes += Math.max(0, polygon.length - 1);
      for (const ring of polygon) {
        rings += 1;
        if (ring.length < 4 || !same(ring[0], ring.at(-1)) || Math.abs(ringArea(ring)) < 1e-14) fail(`invalid-ring-${row.postalCode}`);
        positions += ring.length;
        for (const [longitude, latitude] of ring) {
          if (longitude < -59 || longitude > -53 || latitude < -35.5 || latitude > -30) fail(`out-of-scope-${row.postalCode}`);
          bounds[0] = Math.min(bounds[0], longitude); bounds[1] = Math.min(bounds[1], latitude);
          bounds[2] = Math.max(bounds[2], longitude); bounds[3] = Math.max(bounds[3], latitude);
        }
      }
    }
  }
  if (positions !== 251680 || parts !== 121 || rings !== 121 || holes !== 0 || !same(bounds, EXPECTED_BOUNDS)) fail('geometry-denominator');
  return { features: rows.length, parts, rings, holes, positions, bounds, closedRings: rings, structuralValidity: true };
}
function parseDbf(bytes) {
  const count = bytes.readUInt32LE(4); const headerLength = bytes.readUInt16LE(8); const recordLength = bytes.readUInt16LE(10);
  const fields = []; let cursor = 32;
  while (bytes[cursor] !== 13) {
    const name = bytes.subarray(cursor, cursor + 11).toString('ascii').replace(/\0.*$/u, '');
    fields.push({ name, length: bytes[cursor + 16] }); cursor += 32;
  }
  const rows = [];
  for (let index = 0; index < count; index += 1) {
    const record = bytes.subarray(headerLength + index * recordLength, headerLength + (index + 1) * recordLength); let offset = 1; const value = {};
    for (const field of fields) { value[field.name] = record.subarray(offset, offset + field.length).toString('utf8').trim(); offset += field.length; }
    rows.push([Number(value.cp_id), String(Number(value.codigo_pos)).padStart(5, '0')]);
  }
  return rows.sort((left, right) => left[1].localeCompare(right[1]));
}
function verifyShapefile(receipts, rows) {
  const dbfRows = parseDbf(receipts['postal-shp/codigos_postales.dbf']);
  if (!same(dbfRows, rows.map(row => [row.cpId, row.postalCode]))) fail('dbf-kml-mismatch');
  const shp = receipts['postal-shp/codigos_postales.shp']; const shx = receipts['postal-shp/codigos_postales.shx'];
  if (shp.readUInt32LE(32) !== 5 || (shx.length - 100) / 8 !== 121) fail('shapefile-contract');
  const bounds = [shp.readDoubleLE(36), shp.readDoubleLE(44), shp.readDoubleLE(52), shp.readDoubleLE(60)];
  if (!bounds.every((value, index) => Math.abs(value - EXPECTED_BOUNDS[index]) < 1e-12)) fail('shapefile-bounds');
  if (receipts['postal-shp/codigos_postales.prj'].toString('utf8').trim().includes('WGS_1984') === false) fail('shapefile-crs');
  return { records: 121, shapeType: 5, bounds, dbfKmlMatch: true, crs: 'EPSG:4326 / WGS 84' };
}

const BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; const K = 2 ** 21; const M = K - 1;
function encodeAgid(lat, lon) {
  const phi = lat * Math.PI / 180; const theta = lon * Math.PI / 180;
  const x = Math.cos(phi) * Math.cos(theta); const y = Math.cos(phi) * Math.sin(theta); const z = Math.sin(phi);
  const ax = Math.abs(x); const ay = Math.abs(y); const az = Math.abs(z); let face; let uc; let vc;
  if (ax >= ay && ax >= az) { if (x > 0) { face = 0; uc = y; vc = z; } else { face = 1; uc = -y; vc = z; } }
  else if (ay >= ax && ay >= az) { if (y > 0) { face = 2; uc = -x; vc = z; } else { face = 3; uc = x; vc = z; } }
  else if (z > 0) { face = 4; uc = -x; vc = -y; } else { face = 5; uc = -x; vc = y; }
  const max = Math.max(ax, ay, az); const u = 0.5 * ((Math.atan(uc / max) * 4 / Math.PI) + 1); const v = 0.5 * ((Math.atan(vc / max) * 4 / Math.PI) + 1);
  let qx = Math.max(0, Math.min(M, Math.floor(u * K))); let qy = Math.max(0, Math.min(M, Math.floor(v * K))); let d = 0n;
  for (let s = K / 2; s > 0; s = Math.floor(s / 2)) { const rx = (qx & s) > 0 ? 1 : 0; const ry = (qy & s) > 0 ? 1 : 0; d += BigInt(s) * BigInt(s) * BigInt((3 * rx) ^ ry); if (ry === 0) { if (rx === 1) { qx = s - 1 - qx; qy = s - 1 - qy; } [qx, qy] = [qy, qx]; } }
  let packed = (BigInt(face) << 42n) | d; let hash = '';
  for (let index = 0; index < 10; index += 1) { hash = BASE32[Number(packed % 32n)] + hash; packed /= 32n; }
  return `UY${hash}`;
}
function pointInRing(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]; const [xj, yj] = ring[j];
    if ((yi > point[1]) !== (yj > point[1]) && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function pointInPolygon(point, polygon) { return pointInRing(point, polygon[0]) && !polygon.slice(1).some(ring => pointInRing(point, ring)); }
function representativePoint(geometry) {
  const polygon = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates[0]; const outer = polygon[0];
  const xs = outer.map(point => point[0]); const ys = outer.map(point => point[1]); const minY = Math.min(...ys); const maxY = Math.max(...ys);
  for (const fraction of [0.5, 0.25, 0.75, 0.125, 0.875]) {
    const y = minY + (maxY - minY) * fraction; const intersections = [];
    for (let index = 0; index < outer.length - 1; index += 1) { const a = outer[index]; const b = outer[index + 1]; if ((a[1] > y) !== (b[1] > y)) intersections.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1])); }
    intersections.sort((a, b) => a - b);
    for (let index = 0; index + 1 < intersections.length; index += 2) { const point = [(intersections[index] + intersections[index + 1]) / 2, y]; if (pointInPolygon(point, polygon)) return point; }
  }
  fail('representative-point');
}

function build({ sourceDirectory, outputDirectory, reportPath }) {
  const receipts = Object.fromEntries(Object.keys(EXPECTED).map(name => [name, readExact(sourceDirectory, name)]));
  const packageBody = JSON.parse(receipts['package-show.json'].toString('utf8'));
  if (packageBody?.result?.id !== '7eb3681f-3e58-475d-9cd4-4527dc6ab234' || packageBody.result.version !== '1.0' || packageBody.result.license_id !== 'odc-uy') fail('package-contract');
  const rows = parseKml(receipts['codigos-postales-2023-08.kml']); const geometryCheck = inspectGeometry(rows); const shapefileCheck = verifyShapefile(receipts, rows);
  const validTime = { from: '2023-08-01T00:00:00.000Z', to: '2023-09-01T00:00:00.000Z' }; const knownTime = { from: RELEASE_INSTANT, to: null };
  const officialSource = { sourceId: 'correo-uruguayo-postal-polygons-2023-08', sourceType: 'official', assignmentAuthority: 'official_postal_mapping_authority', geometryAuthority: 'official_postal_geometry', sourceVersion: 'CKAN dataset 7eb3681f-3e58-475d-9cd4-4527dc6ab234 v1.0; KML resource 271e6277-6b0f-44f6-962d-21b8ba88e9e4; SHP resource 8f701b15-5299-4176-b94e-260f69086494', sourceDate: DATASET_DATE, licenseId: LICENSE_ID, digest: `sha256:${EXPECTED['codigos-postales-2023-08.kml']}` };
  const crosswalkSource = { sourceId: 'agid-uy-postal-interior-reference-crosswalk-v1', sourceType: 'derived', assignmentAuthority: 'derived_spatial_assignment', geometryAuthority: 'none', sourceVersion: 'AGID cubed-sphere Hilbert encoder; deterministic interior scanline reference point', sourceDate: DATASET_DATE, licenseId: LICENSE_ID, digest: officialSource.digest };
  const nodes = [{ id: 'country-uy', kind: 'administrative_area', featureKind: 'country', geometryType: 'none', countryCode: 'UY', label: 'Uruguay', visibility: 'public' }]; const assertions = []; const geometryFeatures = []; const ids = [];
  for (const row of rows) {
    const postalNodeId = `postal-uy-correo-2023-${row.postalCode}`; const geometryId = `correo-uy-postal-2023-${row.postalCode}`; const reference = representativePoint(row.geometry); const agidCellId = encodeAgid(reference[1], reference[0]); const agidNodeId = `agid-uy-correo-2023-${row.postalCode}-reference`;
    nodes.push({ id: postalNodeId, kind: 'postal_feature', featureKind: 'standard_area', geometryType: row.geometry.type === 'Polygon' ? 'polygon' : 'multipolygon', countryCode: 'UY', postalCode: row.postalCode, label: `Correo Uruguayo postal area ${row.postalCode} · official cp_id ${row.cpId} · August 2023`, visibility: 'public' });
    nodes.push({ id: agidNodeId, kind: 'agid_cell', featureKind: 'unknown', geometryType: 'none', countryCode: 'UY', label: `AGID interior reference cell for Correo postal area ${row.postalCode} (derived crosswalk; not coverage)`, agidCellId, visibility: 'public' });
    assertions.push({ id: `${geometryId}-part-of-uy`, fromNodeId: postalNodeId, toNodeId: 'country-uy', relation: 'admin_within', validTime, knownTime, source: officialSource, method: 'geometry_contains', quality: { status: 'authoritative', confidence: 0.99, validatedAt: RELEASE_INSTANT }, purposes: ['display', 'validation'] });
    assertions.push({ id: `${geometryId}-agid-reference`, fromNodeId: postalNodeId, toNodeId: agidNodeId, relation: 'covered_by_agid', validTime, knownTime, source: crosswalkSource, method: 'derived', quality: { status: 'derived', confidence: 0.7, validatedAt: RELEASE_INSTANT }, purposes: ['display', 'validation'] });
    geometryFeatures.push({ id: geometryId, nodeId: postalNodeId, role: 'postal_area', publicationClass: 'public_context', geometry: row.geometry, source: officialSource, validTime, knownTime, quality: { status: 'authoritative', confidence: 0.99, validatedAt: RELEASE_INSTANT } });
    ids.push({ postalCode: row.postalCode, officialCpId: row.cpId, postalContextId: postalNodeId, geometryId, countryAssertionId: `${geometryId}-part-of-uy`, agidAssertionId: `${geometryId}-agid-reference`, agidNodeId, agidCellId, referencePoint: reference });
  }
  mkdirSync(outputDirectory, { recursive: true }); const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, { schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'UY', releaseId: RELEASE_ID, features: geometryFeatures });
  const graphRelease = { schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-uy-correo-2023-fixed', repositoryUrl: 'https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure', countryCode: 'UY', releaseId: RELEASE_ID, policyVersion: 'uruguay-correo-fixed-2023-currentness-blocked-v1', releasedAt: RELEASE_INSTANT, validTime, manifestDigest: `sha256:${'0'.repeat(64)}`, artifacts: [{ path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json', digest: geometryArtifact.digest, byteLength: geometryArtifact.byteLength, recordCount: rows.length, licenseRefs: [LICENSE_ID] }] };
  const { manifestDigest: _placeholder, ...manifestPayload } = graphRelease; graphRelease.manifestDigest = sha256(Buffer.from(canonicalJson(manifestPayload), 'utf8'));
  const graphPath = join(outputDirectory, 'graph.json'); const graphArtifact = writeJson(graphPath, { schemaVersion: 'postal-context-graph/v0.1', release: graphRelease, nodes, assertions });
  const descriptorPath = join(outputDirectory, 'descriptor.json'); const descriptorArtifact = writeJson(descriptorPath, { schemaVersion: 'postal-context-pack-descriptor/v0.1', repositoryId: graphRelease.repositoryId, countryCode: 'UY', releaseId: RELEASE_ID, policyVersion: graphRelease.policyVersion, sequence: 1, previousDescriptorDigest: null, graphManifestDigest: graphRelease.manifestDigest, createdAt: RELEASE_INSTANT, maturity: 'M2_experimental', synthetic: false, promotionEligible: false, containsResidentialAddressPoints: false, artifacts: [{ role: 'graph', path: basename(graphPath), mediaType: 'application/vnd.agid.postal-context-graph+json', schemaVersion: 'postal-context-graph/v0.1', byteLength: graphArtifact.byteLength, digest: graphArtifact.digest, recordCounts: { nodes: nodes.length, assertions: assertions.length } }, { role: 'geometry', path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json', schemaVersion: 'postal-context-geometry/v0.1', byteLength: geometryArtifact.byteLength, digest: geometryArtifact.digest, recordCounts: { features: rows.length, positions: geometryCheck.positions } }] });
  const report = { schemaVersion: 'postal-context-uy-fixed-release-build/v1', countryCode: 'UY', generatedAt: RELEASE_INSTANT, releaseId: RELEASE_ID, result: 'blocked-latest-official-catalog-release-fixed-current-assignment-and-supersession-unconfirmed', input: { datasetId: packageBody.result.id, datasetVersion: packageBody.result.version, datasetMetadataModified: packageBody.result.metadata_modified, kmlResourceId: '271e6277-6b0f-44f6-962d-21b8ba88e9e4', shpResourceId: '8f701b15-5299-4176-b94e-260f69086494', exactReceipts: Object.entries(receipts).map(([name, bytes]) => ({ name, sourceUrl: name === 'codigos-postales-2023-08.kml' ? SOURCE_URL : null, retrievedAt: RELEASE_INSTANT, bytes: bytes.length, digest: sha256(bytes) })) }, scope: { officialFixedPostalAreas: rows.length, officialCpIds: rows.length, normalizedPostalCodes: rows.length, completeForAugust2023Release: true, current2026AssignmentAndSupersessionEstablished: false, m2QualifiedCurrentRecords: 0, sourcePublicationFrequency: 'single' }, geometry: { ...geometryCheck, shapefileCrossCheck: shapefileCheck, transformations: ['verify-exact-source-digests', 'cross-check-KML-against-SHP-DBF', 'remove-altitude-only', 'coordinate-preserving-GeoJSON-conversion', 'canonical-JSON-serialization'], coordinateModification: false, topologyRepair: false, sourceGeometryClass: 'official' }, idLinkage: { records: ids.length, fields: ['postalCode', 'officialCpId', 'postalContextId', 'geometryId', 'countryAssertionId', 'agidAssertionId', 'agidNodeId', 'agidCellId', 'referencePoint'], sample: ids.find(item => item.postalCode === '11000') }, policy: { promotionEligible: false, reason: 'The fixed latest official catalog body is dated August 2023 and publication frequency is single; no primary evidence fixed in this run establishes current 2026 assignment completeness or supersession.', ordinaryFiveDigitPostalAreasPublished: rows.length, reservedDetailedCpaRowsPublished: 0, addressesBuildingsParcelsRecipientsCustomersPeopleOrLandRightsPublished: 0, missingSurfacesFabricated: 0, agidCrosswalkMeaning: 'deterministic interior reference cell only; not postal coverage, assignment authority, address or building identity', originNote: 'Origen: Administración Nacional de Correos / Correo Uruguayo; Licencia de Datos Abiertos de Uruguay; dataset Código Postal; coordinate-preserving KML-to-GeoJSON conversion and AGID reference crosswalk disclosed.' }, artifacts: { descriptor: descriptorArtifact, graph: graphArtifact, geometry: geometryArtifact } };
  Object.assign(report.geometry, {
    sourcePositions: 251684,
    sourceRings: 122,
    sourceHoles: 1,
    coordinateModification: true,
    coordinateValuesModified: false,
    removedDegeneratePositions: 4,
    topologyRepair: true,
    outputGeometryClass: 'official-release-derived-repair',
    transformations: [
      'verify-exact-source-digests',
      'cross-check-KML-against-SHP-DBF',
      'remove-altitude-only',
      'remove-one-zero-area-four-position-interior-ring-from-code-15400',
      'otherwise-coordinate-preserving-GeoJSON-conversion',
      'canonical-JSON-serialization',
    ],
  });
  report.policy.originNote = 'Origen: Administración Nacional de Correos / Correo Uruguayo; Licencia de Datos Abiertos de Uruguay; dataset Código Postal; KML-to-GeoJSON conversion, one disclosed zero-area interior-ring removal and AGID reference crosswalk disclosed.';
  if (reportPath) writeJson(reportPath, report, true); return report;
}

export { build, inspectGeometry, parseKml };
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) fail('usage-source-directory-required');
  const outputDirectory = resolve(process.argv[3] ?? join(ROOT, 'data/postal_country_packs/uy/postal-context/m2'));
  const reportPath = process.argv[4] ? resolve(process.argv[4]) : undefined;
  console.log(JSON.stringify(build({ sourceDirectory: resolve(process.argv[2]), outputDirectory, reportPath }), null, 2));
}

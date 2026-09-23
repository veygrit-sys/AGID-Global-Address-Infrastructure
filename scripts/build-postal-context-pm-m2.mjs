import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import area from '@turf/area';
import bbox from '@turf/bbox';
import booleanValid from '@turf/boolean-valid';
import jsts from 'jsts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_ID = 'pm-laposte-geoapi-single-postcode-20260901';
const RELEASE_INSTANT = '2026-09-01T19:06:03.583Z';
const DATASET_DATE = '2026-08-08';
const LICENSE_ID = 'etalab-open-licence-2.0';
const EXPECTED_BOUNDS = [-56.518569, 46.749454, -56.119017, 47.144249];
const EXPECTED = {
  'laposte-datagouv-metadata.json': '453a8cd0168191503ae7e949f89523206d921ab67c67370f3a6fd97fc3da45a2',
  'laposte-dataset-metadata.json': 'b5d6b5dcb421ece75d41b5903ded715a88df97ff1b4fa1f070e9fa7535167d65',
  'laposte-hexasmal.csv': 'f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22',
  'geoapi-97501.geojson': 'baf289ef9c951d28bb8e902b81bc0be21b23cc7c7db1377a72ed6d7974c265b1',
  'geoapi-97502.geojson': 'cdd11e84eb7dbd892a3a864540cb60327c577a162715da9df8be8e1139942902',
  'geoapi-97500.geojson': 'c32727b4d867d974a10ac19aba25e24591368f203e6a1a70013dae43a5ada790',
  'geoapi-communes-doc.html': 'c05f57f48ae4b3adacacf868ed5814ce6152f839c80082c5edeb0571ee0884f4',
  'etalab-open-licence.html': '055988f69abf3c34d29ecd026b0156e66ea8edc20a894938fc376ea11fc30993',
};
function fail(message) { throw new Error('pm-m2-' + message); }
function sha256(bytes) { return 'sha256:' + createHash('sha256').update(bytes).digest('hex'); }
function canonicalJson(value) {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') {
    if (typeof value === 'number' && !Number.isFinite(value)) fail('canonical-number');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (!value || typeof value !== 'object') fail('canonical-value');
  return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonicalJson(value[key])).join(',') + '}';
}
function artifactPath(path) { return relative(ROOT, path).replaceAll('\\', '/'); }
function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const bytes = Buffer.from(canonicalJson(value) + '\n', 'utf8');
  writeFileSync(path, bytes);
  return { path: artifactPath(path), byteLength: bytes.length, digest: sha256(bytes) };
}
function readExact(directory, name) {
  const bytes = readFileSync(join(directory, name));
  const digest = sha256(bytes);
  if (digest !== 'sha256:' + EXPECTED[name]) fail('source-digest-' + name + '-' + digest);
  return bytes;
}
function parseJson(bytes, name) {
  try { return JSON.parse(bytes.toString('utf8')); } catch { fail('invalid-json-' + name); }
}
function same(left, right) { return canonicalJson(left) === canonicalJson(right); }
function inspectGeometry(geometry) {
  if (geometry?.type !== 'MultiPolygon' || geometry.coordinates.length !== 78) fail('geometry-type-or-parts');
  let rings = 0;
  let positions = 0;
  for (const polygon of geometry.coordinates) {
    if (!Array.isArray(polygon) || polygon.length !== 1) fail('geometry-polygon-rings');
    for (const ring of polygon) {
      rings += 1;
      positions += ring.length;
      if (ring.length < 4 || ring.length > 10_000 || !same(ring[0], ring.at(-1))) fail('geometry-ring');
      for (const position of ring) {
        const [longitude, latitude] = position;
        if (!Array.isArray(position) || !Number.isFinite(longitude) || !Number.isFinite(latitude)
          || longitude < -56.6 || longitude > -56.0 || latitude < 46.7 || latitude > 47.2) fail('geometry-position');
      }
    }
  }
  const feature = { type: 'Feature', properties: {}, geometry };
  if (!booleanValid(feature)) fail('geometry-turf-invalid');
  const jstsGeometry = new jsts.io.GeoJSONReader().read(geometry);
  if (!new jsts.operation.valid.IsValidOp(jstsGeometry).isValid()) fail('geometry-jsts-invalid');
  const bounds = bbox(feature);
  if (!same(bounds, EXPECTED_BOUNDS)) fail('geometry-bounds-' + canonicalJson(bounds));
  if (rings !== 78 || positions !== 9_097) fail('geometry-structure-' + rings + '-' + positions);
  const squareMeters = area(feature);
  if (Math.abs(squareMeters - 219_096_973.58099386) > 1e-6) fail('geometry-area-' + squareMeters);
  return { parts: 78, rings, positions, bounds, squareMeters };
}
function parseOfficialCsv(bytes) {
  const text = new TextDecoder('windows-1252', { fatal: true }).decode(bytes);
  const lines = text.split(/\r?\n/u).filter(Boolean);
  if (lines.shift() !== '#Code_commune_INSEE;Nom_de_la_commune;Code_postal;Libellé_d_acheminement;Ligne_5') fail('csv-header');
  const rows = lines.map((line, index) => {
    const fields = line.split(';');
    if (fields.length !== 5) fail('csv-fields-' + (index + 2));
    const [insee, commune, postalCode, routingLabel, line5] = fields;
    return { insee, commune, postalCode, routingLabel, line5 };
  });
  if (rows.length !== 39_192 || new Set(rows.map(canonicalJson)).size !== rows.length) fail('csv-size-or-duplicate');
  const match = rows.filter(row => row.insee.startsWith('975') || row.postalCode === '97500');
  const expected = [
    { insee: '97501', commune: 'MIQUELON LANGLADE', postalCode: '97500', routingLabel: 'ST PIERRE ET MIQUELON', line5: 'LANGLADE' },
    { insee: '97501', commune: 'MIQUELON LANGLADE', postalCode: '97500', routingLabel: 'ST PIERRE ET MIQUELON', line5: 'MIQUELON LANGLADE' },
    { insee: '97502', commune: 'ST PIERRE', postalCode: '97500', routingLabel: 'ST PIERRE ET MIQUELON', line5: 'ST PIERRE' },
  ];
  if (!same(match, expected)) fail('csv-pm-denominator-' + canonicalJson(match));
  return { rows, match, distinctPostcodes: new Set(rows.map(row => row.postalCode)).size,
    distinctCommunes: new Set(rows.map(row => row.insee)).size };
}
function build({ sourceDirectory, outputDirectory, reportPath }) {
  const receipts = Object.fromEntries(Object.keys(EXPECTED).map(name => [name, readExact(sourceDirectory, name)]));
  const dataset = parseJson(receipts['laposte-dataset-metadata.json'], 'dataset-metadata');
  const dataGouv = parseJson(receipts['laposte-datagouv-metadata.json'], 'datagouv-metadata');
  if (dataset.title !== 'Base officielle des codes postaux' || dataset.id !== 'laposte-hexasmal'
    || dataset.updatedAt !== '2026-08-31T23:11:18.251Z' || dataset.dataUpdatedAt !== '2026-08-08T02:02:09.846Z'
    || dataset.count !== 39_192 || dataset.frequency !== 'semiannual'
    || dataset.license?.title !== 'Licence Ouverte / Open Licence' || dataset.file?.size !== 1_555_485
    || dataset.file?.encoding !== 'ISO-8859-1') fail('dataset-metadata-contract');
  if (dataGouv.title !== 'Base officielle des codes postaux' || dataGouv.license !== 'lov2'
    || dataGouv.access_type !== 'open' || !/COM/u.test(dataGouv.description)
    || !/contours géographiques des codes postaux ne sont pas fournis en open data/iu.test(dataGouv.description)) fail('datagouv-contract');
  const csv = parseOfficialCsv(receipts['laposte-hexasmal.csv']);
  const exacts = ['97501', '97502'].map(code => parseJson(receipts['geoapi-' + code + '.geojson'], 'geoapi-' + code));
  const byPostcode = parseJson(receipts['geoapi-97500.geojson'], 'geoapi-postcode');
  const expectedProperties = [
    { nom: 'Miquelon-Langlade', code: '97501', codesPostaux: ['97500'], surface: 19277.71 },
    { nom: 'Saint-Pierre', code: '97502', codesPostaux: ['97500'], surface: 2681.04 },
  ];
  if (exacts.some(item => item.type !== 'Feature') || byPostcode.type !== 'FeatureCollection'
    || byPostcode.features?.length !== 2 || !same(exacts.map(item => item.properties), expectedProperties)
    || !same(byPostcode.features.map(item => item.properties), expectedProperties)
    || exacts.some((item, index) => !same(item.geometry, byPostcode.features[index].geometry))) fail('geoapi-identity-or-postcode-join');
  const geometry = { type: 'MultiPolygon', coordinates: exacts.flatMap(item => item.geometry.coordinates) };
  const geometryCheck = inspectGeometry(geometry);
  const docs = receipts['geoapi-communes-doc.html'].toString('utf8');
  const licence = receipts['etalab-open-licence.html'].toString('utf8');
  if (!/communes\/\{code\}/iu.test(docs) || !/code postal/iu.test(docs) || !/contour/iu.test(docs) || !/geojson/iu.test(docs)) fail('geoapi-doc-contract');
  if (!/Licence Ouverte/iu.test(licence) || !/réutilis/iu.test(licence) || !/attribu/iu.test(licence)) fail('licence-contract');
  const validTime = { from: DATASET_DATE + 'T00:00:00.000Z', to: null };
  const knownTime = { from: RELEASE_INSTANT, to: null };
  const assignmentSource = { sourceId: 'laposte-hexasmal-20260808-pm-97501-97502', sourceType: 'official',
    assignmentAuthority: 'official_postal_dictionary', geometryAuthority: 'none',
    sourceVersion: 'Base officielle des codes postaux; data updated 2026-08-08; exact 97501/97502 to 97500 rows',
    sourceDate: DATASET_DATE, licenseId: LICENSE_ID, digest: 'sha256:' + EXPECTED['laposte-hexasmal.csv'] };
  const combinedSourceDigest = sha256(Buffer.concat([receipts['geoapi-97501.geojson'], Buffer.from('\n'), receipts['geoapi-97502.geojson']]));
  const geometrySource = { sourceId: 'geo-api-gouv-fr-communes-97501-97502-20260901-derived-single-postcode', sourceType: 'derived',
    assignmentAuthority: 'derived_spatial_assignment', geometryAuthority: 'derived_geometry',
    sourceVersion: 'geo.api.gouv.fr current commune contours; exact code and postal-code responses; stable 97501 then 97502 concatenation',
    sourceDate: '2026-09-01', licenseId: LICENSE_ID, digest: combinedSourceDigest };
  const postalNode = { id: 'postal-pm-97500', kind: 'postal_feature', featureKind: 'standard_area', geometryType: 'multipolygon',
    countryCode: 'PM', postalCode: '97500', label: '97500 derived two-commune display surface', visibility: 'public' };
  const communeNodes = expectedProperties.map(item => ({ id: 'admin-pm-insee-' + item.code, kind: 'administrative_area',
    featureKind: 'administrative', geometryType: 'none', countryCode: 'PM', label: item.nom, visibility: 'public' }));
  const nodes = [postalNode, ...communeNodes];
  const assertions = communeNodes.map((node, index) => ({ id: `laposte-pm-20260808-97500-admin-within-${expectedProperties[index].code}`,
    fromNodeId: postalNode.id, toNodeId: node.id, relation: 'admin_within', validTime, knownTime, source: assignmentSource,
    method: 'source_relation', quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT } }));
  const features = [{ id: 'geoapi-pm-20260901-97500-two-commune-surface-1', nodeId: postalNode.id, role: 'postal_area',
    publicationClass: 'public_context', geometry, source: geometrySource, validTime, knownTime,
    quality: { status: 'derived', confidence: 0.95, validatedAt: RELEASE_INSTANT } }];
  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, { schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'PM', releaseId: RELEASE_ID, features });
  const graphRelease = { schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-pm-laposte-geoapi',
    repositoryUrl: 'https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure', countryCode: 'PM', releaseId: RELEASE_ID,
    policyVersion: 'saint-pierre-miquelon-laposte-single-postcode-two-commune-v1', releasedAt: RELEASE_INSTANT,
    validTime, manifestDigest: 'sha256:' + '0'.repeat(64), artifacts: [{ path: basename(geometryPath),
      mediaType: 'application/vnd.agid.postal-context-geometry+json', digest: geometryArtifact.digest,
      byteLength: geometryArtifact.byteLength, recordCount: 1, licenseRefs: [LICENSE_ID] }] };
  const { manifestDigest: _placeholder, ...manifestPayload } = graphRelease;
  graphRelease.manifestDigest = sha256(Buffer.from(canonicalJson(manifestPayload), 'utf8'));
  const graphPath = join(outputDirectory, 'graph.json');
  const graphArtifact = writeJson(graphPath, { schemaVersion: 'postal-context-graph/v0.1', release: graphRelease, nodes, assertions });
  const descriptorPath = join(outputDirectory, 'descriptor.json');
  const descriptorArtifact = writeJson(descriptorPath, { schemaVersion: 'postal-context-pack-descriptor/v0.1',
    repositoryId: graphRelease.repositoryId, countryCode: 'PM', releaseId: RELEASE_ID, policyVersion: graphRelease.policyVersion,
    sequence: 1, previousDescriptorDigest: null, graphManifestDigest: graphRelease.manifestDigest, createdAt: RELEASE_INSTANT,
    maturity: 'M2_experimental', synthetic: false, promotionEligible: true, containsResidentialAddressPoints: false,
    artifacts: [
      { role: 'graph', path: basename(graphPath), mediaType: 'application/vnd.agid.postal-context-graph+json', schemaVersion: 'postal-context-graph/v0.1',
        byteLength: graphArtifact.byteLength, digest: graphArtifact.digest, recordCounts: { nodes: nodes.length, assertions: assertions.length } },
      { role: 'geometry', path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json', schemaVersion: 'postal-context-geometry/v0.1',
        byteLength: geometryArtifact.byteLength, digest: geometryArtifact.digest, recordCounts: { features: 1, positions: geometryCheck.positions } },
    ] });
  const sourceReceipts = Object.entries(receipts).map(([name, bytes]) => ({ name, bytes: bytes.length, digest: sha256(bytes) }));
  const report = { schemaVersion: 'postal-context-pm-m2-build/v1', countryCode: 'PM', generatedAt: RELEASE_INSTANT, releaseId: RELEASE_ID,
    input: { exactReceipts: sourceReceipts, exactReceiptBytes: sourceReceipts.reduce((sum, item) => sum + item.bytes, 0),
      officialDataset: { rows: csv.rows.length, distinctPostalCodes: csv.distinctPostcodes, distinctCommuneCodes: csv.distinctCommunes,
        pmDenominatorRows: csv.match.length, rows97500: csv.match, updatedAt: dataset.updatedAt, dataUpdatedAt: dataset.dataUpdatedAt },
      geoApi: { exactCodeResponseDigests: exacts.map((_, index) => sha256(receipts[`geoapi-${97501 + index}.geojson`])),
        postcodeResponseDigest: sha256(receipts['geoapi-97500.geojson']), exactGeometryEquality: true, properties: expectedProperties } },
    scope: { publishedPostalCodes: ['97500'], publishedGeometries: 1, linkedAdministrativeIds: ['97501', '97502'],
      scopeStatement: 'The complete official snapshot has exactly three PM rows: two 97501 routing-line variants and one 97502 row, all assigned to 97500.',
      officialPostalBoundaryClaimed: false },
    geometry: { type: geometry.type, ...geometryCheck, apiSurfaceHectares: expectedProperties.reduce((sum, item) => sum + item.surface, 0),
      transformations: ['decode-fixed-GeoJSON', 'exact-97500-to-97501-and-97502-equality-join', 'stable-97501-then-97502-multipolygon-concatenation', 'canonical-JSON-serialization'],
      geometricModification: false, provenance: 'derived', confidence: 0.95 },
    policy: { officialAssignment: true, officialPostalGeometry: false, officialAdministrativeGeometry: true,
      outputProvenance: 'derived', addressOrBuildingRowsPublished: 0, recipientCustomerOrLandRightsRowsPublished: 0, inventedAreaRowsPublished: 0 },
    artifacts: { graph: graphArtifact, geometry: geometryArtifact, descriptor: descriptorArtifact } };
  if (reportPath) { mkdirSync(dirname(reportPath), { recursive: true }); writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8'); }
  return report;
}
export { build, inspectGeometry, parseOfficialCsv };
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sourceDirectory = resolve(process.argv[2] ?? '');
  const outputDirectory = resolve(process.argv[3] ?? join(ROOT, 'data/postal_country_packs/pm/postal-context/m2'));
  const reportPath = process.argv[4] ? resolve(process.argv[4]) : undefined;
  if (!process.argv[2]) fail('usage-source-directory-required');
  console.log(JSON.stringify(build({ sourceDirectory, outputDirectory, reportPath }), null, 2));
}

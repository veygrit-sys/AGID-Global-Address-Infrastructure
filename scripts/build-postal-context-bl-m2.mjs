import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import area from '@turf/area';
import bbox from '@turf/bbox';
import booleanValid from '@turf/boolean-valid';
import jsts from 'jsts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_ID = 'bl-laposte-geoapi-single-postcode-20260831';
const RELEASE_INSTANT = '2026-08-31T10:26:19.045Z';
const DATASET_DATE = '2026-08-08';
const LICENSE_ID = 'etalab-open-licence-2.0';
const EXPECTED_BOUNDS = [-62.926554, 17.870779, -62.789086, 17.974092];
const EXPECTED = {
  'laposte-datagouv-metadata.json': '5d4bc801437980e23b550903832097ac39ba0994dd37d83a80dfc1e83e2b1311',
  'laposte-dataset-metadata.json': '1715e9fbe79c398f5619ef4b68b72a8a79c4c6491e43355288f1abee8b99ea1e',
  'laposte-hexasmal.csv': 'f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22',
  'geoapi-97701.geojson': 'c533f3763f6157fd8c6591da66f79309b0d7983dc452782529febf561bc20b4d',
  'geoapi-97133.geojson': '1f85da8a2f7a5d9882cb920c5cc18dfaf723689badb80ea4e481b6eac2b1de62',
  'geoapi-communes-doc.html': 'c05f57f48ae4b3adacacf868ed5814ce6152f839c80082c5edeb0571ee0884f4',
  'etalab-open-licence.html': '6ec2b985b8f4585dd33f3ff4f3772379db2a1e3ab9945a83b5d976909379bc1c',
};
function fail(message) { throw new Error('bl-m2-' + message); }
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
  if (geometry?.type !== 'MultiPolygon' || geometry.coordinates.length !== 21) fail('geometry-type-or-parts');
  let rings = 0;
  let positions = 0;
  for (const polygon of geometry.coordinates) {
    if (!Array.isArray(polygon) || polygon.length !== 1) fail('geometry-polygon-rings');
    for (const ring of polygon) {
      rings += 1;
      positions += ring.length;
      if (ring.length < 4 || ring.length > 2_000 || !same(ring[0], ring.at(-1))) fail('geometry-ring');
      for (const position of ring) {
        const [longitude, latitude] = position;
        if (!Array.isArray(position) || !Number.isFinite(longitude) || !Number.isFinite(latitude)
          || longitude < -63 || longitude > -62.7 || latitude < 17.8 || latitude > 18.1) fail('geometry-position');
      }
    }
  }
  const feature = { type: 'Feature', properties: {}, geometry };
  if (!booleanValid(feature)) fail('geometry-turf-invalid');
  const jstsGeometry = new jsts.io.GeoJSONReader().read(geometry);
  if (!new jsts.operation.valid.IsValidOp(jstsGeometry).isValid()) fail('geometry-jsts-invalid');
  const bounds = bbox(feature);
  if (!same(bounds, EXPECTED_BOUNDS)) fail('geometry-bounds-' + canonicalJson(bounds));
  if (rings !== 21 || positions !== 2_912) fail('geometry-structure-' + rings + '-' + positions);
  const squareMeters = area(feature);
  if (Math.abs(squareMeters / 1e6 - 20.439471117282295) > 1e-9) fail('geometry-area');
  return { parts: 21, rings, positions, bounds, squareMeters };
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
  const match = rows.filter(row => row.insee.startsWith('977') || row.postalCode === '97133');
  const expected = { insee: '97701', commune: 'ST BARTHELEMY', postalCode: '97133', routingLabel: 'ST BARTHELEMY', line5: '' };
  if (match.length !== 1 || !same(match[0], expected)) fail('csv-bl-denominator-' + canonicalJson(match));
  if (rows.filter(row => row.insee === '97701').length !== 1 || rows.filter(row => row.postalCode === '97133').length !== 1) fail('csv-bl-cardinality');
  return { rows, match: match[0], distinctPostcodes: new Set(rows.map(row => row.postalCode)).size,
    distinctCommunes: new Set(rows.map(row => row.insee)).size };
}
function build({ sourceDirectory, outputDirectory, reportPath }) {
  const receipts = Object.fromEntries(Object.keys(EXPECTED).map(name => [name, readExact(sourceDirectory, name)]));
  const dataset = parseJson(receipts['laposte-dataset-metadata.json'], 'dataset-metadata');
  const dataGouv = parseJson(receipts['laposte-datagouv-metadata.json'], 'datagouv-metadata');
  if (dataset.title !== 'Base officielle des codes postaux' || dataset.id !== 'laposte-hexasmal'
    || dataset.updatedAt !== '2026-08-08T07:04:29.824Z' || dataset.dataUpdatedAt !== '2026-08-08T02:02:09.846Z'
    || dataset.count !== 39_192 || dataset.frequency !== 'semiannual'
    || dataset.license?.title !== 'Licence Ouverte / Open Licence' || dataset.file?.size !== 1_555_485
    || dataset.file?.encoding !== 'ISO-8859-1') fail('dataset-metadata-contract');
  if (dataGouv.title !== 'Base officielle des codes postaux' || dataGouv.license !== 'lov2'
    || dataGouv.access_type !== 'open' || !/COM/u.test(dataGouv.description)
    || !/contours géographiques des codes postaux ne sont pas fournis en open data/iu.test(dataGouv.description)) fail('datagouv-contract');
  const csv = parseOfficialCsv(receipts['laposte-hexasmal.csv']);
  const exact = parseJson(receipts['geoapi-97701.geojson'], 'geoapi-code');
  const byPostcode = parseJson(receipts['geoapi-97133.geojson'], 'geoapi-postcode');
  if (exact.type !== 'Feature' || byPostcode.type !== 'FeatureCollection' || byPostcode.features?.length !== 1) fail('geoapi-envelope');
  const expectedProperties = { nom: 'Saint-Barthélemy', code: '97701', codesPostaux: ['97133'], surface: 2048.52 };
  if (!same(exact.properties, expectedProperties) || !same(byPostcode.features[0].properties, expectedProperties)
    || !same(exact.geometry, byPostcode.features[0].geometry)) fail('geoapi-identity-or-postcode-join');
  const geometryCheck = inspectGeometry(exact.geometry);
  const docs = receipts['geoapi-communes-doc.html'].toString('utf8');
  const licence = receipts['etalab-open-licence.html'].toString('utf8');
  if (!/communes\/\{code\}/iu.test(docs) || !/code postal/iu.test(docs)
    || !/contour/iu.test(docs) || !/geojson/iu.test(docs)) fail('geoapi-doc-contract');
  if (!/Licence Ouverte/iu.test(licence) || !/réutilis/iu.test(licence) || !/attribu/iu.test(licence)) fail('licence-contract');
  const validTime = { from: DATASET_DATE + 'T00:00:00.000Z', to: null };
  const knownTime = { from: RELEASE_INSTANT, to: null };
  const assignmentSource = {
    sourceId: 'laposte-hexasmal-20260808-bl-97701', sourceType: 'official',
    assignmentAuthority: 'official_postal_dictionary', geometryAuthority: 'none',
    sourceVersion: 'Base officielle des codes postaux; data updated 2026-08-08; exact 97701/97133 row',
    sourceDate: DATASET_DATE, licenseId: LICENSE_ID, digest: 'sha256:' + EXPECTED['laposte-hexasmal.csv'],
  };
  const geometrySource = {
    sourceId: 'geo-api-gouv-fr-commune-97701-20260831-derived-single-postcode', sourceType: 'derived',
    assignmentAuthority: 'derived_spatial_assignment', geometryAuthority: 'derived_geometry',
    sourceVersion: 'geo.api.gouv.fr current commune contour; exact code and postal-code responses; COG 2026 context',
    sourceDate: '2026-08-31', licenseId: LICENSE_ID, digest: 'sha256:' + EXPECTED['geoapi-97701.geojson'],
  };
  const countryNode = { id: 'country-bl', kind: 'administrative_area', featureKind: 'country', geometryType: 'none',
    countryCode: 'BL', label: 'Saint Barthélemy', visibility: 'public' };
  const postalNode = { id: 'postal-bl-97133', kind: 'postal_feature', featureKind: 'standard_area', geometryType: 'multipolygon',
    countryCode: 'BL', postalCode: '97133', label: '97133 single-postcode derived collectivity display surface', visibility: 'public' };
  const nodes = [countryNode, postalNode];
  const assertions = [{ id: 'laposte-bl-20260808-97133-admin-within-bl', fromNodeId: postalNode.id, toNodeId: countryNode.id,
    relation: 'admin_within', validTime, knownTime, source: assignmentSource, method: 'source_relation',
    quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT } }];
  const features = [{ id: 'geoapi-bl-20260831-97133-surface-1', nodeId: postalNode.id, role: 'postal_area',
    publicationClass: 'public_context', geometry: exact.geometry, source: geometrySource, validTime, knownTime,
    quality: { status: 'derived', confidence: 0.97, validatedAt: RELEASE_INSTANT } }];
  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, { schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'BL', releaseId: RELEASE_ID, features });
  const graphRelease = { schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-bl-laposte-geoapi',
    repositoryUrl: 'https://github.com/veygrit-sys/Address-Grid-ID', countryCode: 'BL', releaseId: RELEASE_ID,
    policyVersion: 'saint-barthelemy-laposte-single-postcode-derived-collectivity-v1', releasedAt: RELEASE_INSTANT,
    validTime, manifestDigest: 'sha256:' + '0'.repeat(64), artifacts: [{ path: basename(geometryPath),
      mediaType: 'application/vnd.agid.postal-context-geometry+json', digest: geometryArtifact.digest,
      byteLength: geometryArtifact.byteLength, recordCount: 1, licenseRefs: [LICENSE_ID] }] };
  const { manifestDigest: _placeholder, ...manifestPayload } = graphRelease;
  graphRelease.manifestDigest = sha256(Buffer.from(canonicalJson(manifestPayload), 'utf8'));
  const graphPath = join(outputDirectory, 'graph.json');
  const graphArtifact = writeJson(graphPath, { schemaVersion: 'postal-context-graph/v0.1', release: graphRelease, nodes, assertions });
  const descriptorPath = join(outputDirectory, 'descriptor.json');
  const descriptorArtifact = writeJson(descriptorPath, { schemaVersion: 'postal-context-pack-descriptor/v0.1',
    repositoryId: graphRelease.repositoryId, countryCode: 'BL', releaseId: RELEASE_ID, policyVersion: graphRelease.policyVersion,
    sequence: 1, previousDescriptorDigest: null, graphManifestDigest: graphRelease.manifestDigest, createdAt: RELEASE_INSTANT,
    maturity: 'M2_experimental', synthetic: false, promotionEligible: true, containsResidentialAddressPoints: false,
    artifacts: [
      { role: 'graph', path: basename(graphPath), mediaType: 'application/vnd.agid.postal-context-graph+json',
        schemaVersion: 'postal-context-graph/v0.1', byteLength: graphArtifact.byteLength, digest: graphArtifact.digest,
        recordCounts: { nodes: nodes.length, assertions: assertions.length } },
      { role: 'geometry', path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json',
        schemaVersion: 'postal-context-geometry/v0.1', byteLength: geometryArtifact.byteLength, digest: geometryArtifact.digest,
        recordCounts: { features: 1, positions: geometryCheck.positions } },
    ] });
  const sourceReceipts = Object.entries(receipts).map(([name, bytes]) => ({ name, bytes: bytes.length, digest: sha256(bytes) }));
  const report = { schemaVersion: 'postal-context-bl-m2-build/v1', countryCode: 'BL', generatedAt: RELEASE_INSTANT,
    releaseId: RELEASE_ID, input: { exactReceipts: sourceReceipts, exactReceiptBytes: sourceReceipts.reduce((sum, item) => sum + item.bytes, 0),
      officialDataset: { rows: csv.rows.length, distinctPostalCodes: csv.distinctPostcodes, distinctCommuneCodes: csv.distinctCommunes,
        blDenominatorRows: 1, row: csv.match, updatedAt: dataset.updatedAt, dataUpdatedAt: dataset.dataUpdatedAt },
      geoApi: { codeResponseDigest: sha256(receipts['geoapi-97701.geojson']), postcodeResponseDigest: sha256(receipts['geoapi-97133.geojson']),
        exactGeometryEquality: true, properties: exact.properties } },
    scope: { publishedPostalCodes: ['97133'], publishedGeometries: 1,
      scopeStatement: 'The complete official snapshot has exactly one 977-prefix commune row and exactly one 97133 row: 97701 Saint-Barthélemy -> 97133.',
      officialPostalBoundaryClaimed: false },
    geometry: { type: exact.geometry.type, ...geometryCheck, apiSurfaceHectares: exact.properties.surface,
      transformations: ['decode-fixed-GeoJSON', 'exact-97133-to-97701-equality-join', 'canonical-JSON-serialization'],
      geometricModification: false, provenance: 'derived', confidence: 0.97 },
    policy: { officialAssignment: true, officialPostalGeometry: false, officialAdministrativeGeometry: true,
      outputProvenance: 'derived', addressOrBuildingRowsPublished: 0, recipientCustomerOrLandRightsRowsPublished: 0,
      inventedAreaRowsPublished: 0 }, artifacts: { graph: graphArtifact, geometry: geometryArtifact, descriptor: descriptorArtifact } };
  if (reportPath) { mkdirSync(dirname(reportPath), { recursive: true }); writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8'); }
  return report;
}
export { build, inspectGeometry, parseOfficialCsv };
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sourceDirectory = resolve(process.argv[2] ?? '');
  const outputDirectory = resolve(process.argv[3] ?? join(ROOT, 'data/postal_country_packs/bl/postal-context/m2'));
  const reportPath = process.argv[4] ? resolve(process.argv[4]) : undefined;
  if (!process.argv[2]) fail('usage-source-directory-required');
  console.log(JSON.stringify(build({ sourceDirectory, outputDirectory, reportPath }), null, 2));
}

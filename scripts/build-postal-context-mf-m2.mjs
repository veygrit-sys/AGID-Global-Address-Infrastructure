import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import area from '@turf/area';
import bbox from '@turf/bbox';
import booleanValid from '@turf/boolean-valid';
import jsts from 'jsts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_ID = 'mf-laposte-geoapi-single-postcode-20260901';
const RELEASE_INSTANT = '2026-09-01T12:10:26.118Z';
const DATASET_DATE = '2026-08-08';
const LICENSE_ID = 'etalab-open-licence-2.0';
const EXPECTED_BOUNDS = [-63.15332, 18.045903, -62.970711, 18.125195];
const EXPECTED = {
  'laposte-datagouv-metadata.json': '453a8cd0168191503ae7e949f89523206d921ab67c67370f3a6fd97fc3da45a2',
  'laposte-dataset-metadata.json': 'b5d6b5dcb421ece75d41b5903ded715a88df97ff1b4fa1f070e9fa7535167d65',
  'laposte-hexasmal.csv': 'f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22',
  'geoapi-97801.geojson': 'a9bb4fe9659f892b9e4261de5a7f397302f7b221a8eab0f9fd523303b995c483',
  'geoapi-97150.geojson': '63c17509fd85d75e220878e17157d5361af4beed91b035d8308c2db5c841c26f',
  'geoapi-communes-doc.html': 'c05f57f48ae4b3adacacf868ed5814ce6152f839c80082c5edeb0571ee0884f4',
  'etalab-open-licence.html': 'dc47285333558593b1d0d163c9ca52708503419af0e99e3204a93b7f1eb9e821',
};
function fail(message) { throw new Error('mf-m2-' + message); }
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
  if (geometry?.type !== 'MultiPolygon' || geometry.coordinates.length !== 11) fail('geometry-type-or-parts');
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
          || longitude < -63.3 || longitude > -62.8 || latitude < 18.0 || latitude > 18.2) fail('geometry-position');
      }
    }
  }
  const feature = { type: 'Feature', properties: {}, geometry };
  if (!booleanValid(feature)) fail('geometry-turf-invalid');
  const jstsGeometry = new jsts.io.GeoJSONReader().read(geometry);
  if (!new jsts.operation.valid.IsValidOp(jstsGeometry).isValid()) fail('geometry-jsts-invalid');
  const bounds = bbox(feature);
  if (!same(bounds, EXPECTED_BOUNDS)) fail('geometry-bounds-' + canonicalJson(bounds));
  if (rings !== 11 || positions !== 2_136) fail('geometry-structure-' + rings + '-' + positions);
  const squareMeters = area(feature);
  if (Math.abs(squareMeters / 1e6 - 53.649431807733244) > 1e-9) fail('geometry-area');
  return { parts: 11, rings, positions, bounds, squareMeters };
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
  const match = rows.filter(row => row.insee.startsWith('978') || row.postalCode === '97150');
  const expected = { insee: '97801', commune: 'ST MARTIN', postalCode: '97150', routingLabel: 'ST MARTIN', line5: '' };
  if (match.length !== 1 || !same(match[0], expected)) fail('csv-mf-denominator-' + canonicalJson(match));
  if (rows.filter(row => row.insee === '97801').length !== 1 || rows.filter(row => row.postalCode === '97150').length !== 1) fail('csv-mf-cardinality');
  return { rows, match: match[0], distinctPostcodes: new Set(rows.map(row => row.postalCode)).size,
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
  const exact = parseJson(receipts['geoapi-97801.geojson'], 'geoapi-code');
  const byPostcode = parseJson(receipts['geoapi-97150.geojson'], 'geoapi-postcode');
  if (exact.type !== 'Feature' || byPostcode.type !== 'FeatureCollection' || byPostcode.features?.length !== 1) fail('geoapi-envelope');
  const expectedProperties = { nom: 'Saint-Martin', code: '97801', codesPostaux: ['97150'], surface: 5376.96 };
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
    sourceId: 'laposte-hexasmal-20260808-mf-97801', sourceType: 'official',
    assignmentAuthority: 'official_postal_dictionary', geometryAuthority: 'none',
    sourceVersion: 'Base officielle des codes postaux; data updated 2026-08-08; exact 97801/97150 row',
    sourceDate: DATASET_DATE, licenseId: LICENSE_ID, digest: 'sha256:' + EXPECTED['laposte-hexasmal.csv'],
  };
  const geometrySource = {
    sourceId: 'geo-api-gouv-fr-commune-97801-20260901-derived-single-postcode', sourceType: 'derived',
    assignmentAuthority: 'derived_spatial_assignment', geometryAuthority: 'derived_geometry',
    sourceVersion: 'geo.api.gouv.fr current commune contour; exact code and postal-code responses; COG 2026 context',
    sourceDate: '2026-09-01', licenseId: LICENSE_ID, digest: 'sha256:' + EXPECTED['geoapi-97801.geojson'],
  };
  const countryNode = { id: 'country-mf', kind: 'administrative_area', featureKind: 'country', geometryType: 'none',
    countryCode: 'MF', label: 'Saint Martin', visibility: 'public' };
  const postalNode = { id: 'postal-mf-97150', kind: 'postal_feature', featureKind: 'standard_area', geometryType: 'multipolygon',
    countryCode: 'MF', postalCode: '97150', label: '97150 single-postcode derived collectivity display surface', visibility: 'public' };
  const nodes = [countryNode, postalNode];
  const assertions = [{ id: 'laposte-mf-20260808-97150-admin-within-mf', fromNodeId: postalNode.id, toNodeId: countryNode.id,
    relation: 'admin_within', validTime, knownTime, source: assignmentSource, method: 'source_relation',
    quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT } }];
  const features = [{ id: 'geoapi-mf-20260901-97150-surface-1', nodeId: postalNode.id, role: 'postal_area',
    publicationClass: 'public_context', geometry: exact.geometry, source: geometrySource, validTime, knownTime,
    quality: { status: 'derived', confidence: 0.97, validatedAt: RELEASE_INSTANT } }];
  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, { schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'MF', releaseId: RELEASE_ID, features });
  const graphRelease = { schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-mf-laposte-geoapi',
    repositoryUrl: 'https://github.com/veygrit-sys/Address-Grid-ID', countryCode: 'MF', releaseId: RELEASE_ID,
    policyVersion: 'saint-martin-laposte-single-postcode-derived-collectivity-v1', releasedAt: RELEASE_INSTANT,
    validTime, manifestDigest: 'sha256:' + '0'.repeat(64), artifacts: [{ path: basename(geometryPath),
      mediaType: 'application/vnd.agid.postal-context-geometry+json', digest: geometryArtifact.digest,
      byteLength: geometryArtifact.byteLength, recordCount: 1, licenseRefs: [LICENSE_ID] }] };
  const { manifestDigest: _placeholder, ...manifestPayload } = graphRelease;
  graphRelease.manifestDigest = sha256(Buffer.from(canonicalJson(manifestPayload), 'utf8'));
  const graphPath = join(outputDirectory, 'graph.json');
  const graphArtifact = writeJson(graphPath, { schemaVersion: 'postal-context-graph/v0.1', release: graphRelease, nodes, assertions });
  const descriptorPath = join(outputDirectory, 'descriptor.json');
  const descriptorArtifact = writeJson(descriptorPath, { schemaVersion: 'postal-context-pack-descriptor/v0.1',
    repositoryId: graphRelease.repositoryId, countryCode: 'MF', releaseId: RELEASE_ID, policyVersion: graphRelease.policyVersion,
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
  const report = { schemaVersion: 'postal-context-mf-m2-build/v1', countryCode: 'MF', generatedAt: RELEASE_INSTANT,
    releaseId: RELEASE_ID, input: { exactReceipts: sourceReceipts, exactReceiptBytes: sourceReceipts.reduce((sum, item) => sum + item.bytes, 0),
      officialDataset: { rows: csv.rows.length, distinctPostalCodes: csv.distinctPostcodes, distinctCommuneCodes: csv.distinctCommunes,
        mfDenominatorRows: 1, row: csv.match, updatedAt: dataset.updatedAt, dataUpdatedAt: dataset.dataUpdatedAt },
      geoApi: { codeResponseDigest: sha256(receipts['geoapi-97801.geojson']), postcodeResponseDigest: sha256(receipts['geoapi-97150.geojson']),
        exactGeometryEquality: true, properties: exact.properties } },
    scope: { publishedPostalCodes: ['97150'], publishedGeometries: 1,
      scopeStatement: 'The complete official snapshot has exactly one 978-prefix commune row and exactly one 97150 row: 97801 Saint-Martin -> 97150.',
      officialPostalBoundaryClaimed: false },
    geometry: { type: exact.geometry.type, ...geometryCheck, apiSurfaceHectares: exact.properties.surface,
      transformations: ['decode-fixed-GeoJSON', 'exact-97150-to-97801-equality-join', 'canonical-JSON-serialization'],
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
  const outputDirectory = resolve(process.argv[3] ?? join(ROOT, 'data/postal_country_packs/mf/postal-context/m2'));
  const reportPath = process.argv[4] ? resolve(process.argv[4]) : undefined;
  if (!process.argv[2]) fail('usage-source-directory-required');
  console.log(JSON.stringify(build({ sourceDirectory, outputDirectory, reportPath }), null, 2));
}

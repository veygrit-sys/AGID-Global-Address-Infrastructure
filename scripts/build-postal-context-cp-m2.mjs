import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import area from '@turf/area';
import bbox from '@turf/bbox';
import booleanValid from '@turf/boolean-valid';
import jsts from 'jsts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_ID = 'cp-laposte-geoapi-single-postcode-20260901';
const RELEASE_INSTANT = '2026-08-31T19:42:34.212Z';
const DATASET_DATE = '2026-08-08';
const LICENSE_ID = 'etalab-open-licence-2.0';
const EXPECTED_BOUNDS = [-109.234607, 10.287154, -109.19979, 10.31957];
const EXPECTED = {
  'datagouv-dataset.json': '9e4ed9260b58e7c7e8e0654d794e670b8144f3e299704f0eb18e3ed3be193fa9',
  'laposte-metadata.json': '1715e9fbe79c398f5619ef4b68b72a8a79c4c6491e43355288f1abee8b99ea1e',
  'laposte-raw.csv': 'f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22',
  'laposte-98799.json': '276668cd0607355e35bf8abb27602857be5820b5cb8cca45426466817bcac077',
  'laposte-98901.json': '276668cd0607355e35bf8abb27602857be5820b5cb8cca45426466817bcac077',
  'laposte-clipperton.json': 'd44b0e7964cdc9234adea99cebe356f105f44059fe9cfbc504139174ab905a75',
  'geoapi-98901.json': '7ccf2420ff6b59a73b5ff2275d83758080b288ada3b8ebadec1ef7bfc8a740c8',
  'geoapi-postal-98799.json': '5dcb3cf3c6564be2fb53cebc5319b618540c39d9747bc5d9a6eb7e925d08dacd',
  'geoapi-doc.html': 'c05f57f48ae4b3adacacf868ed5814ce6152f839c80082c5edeb0571ee0884f4',
  'etalab-open-licence.html': '5c9f219a2566f7aeea5ada10df8b96131ea319853750beee06645b40cc8bdc8f',
  'insee-codification.html': 'ec23138e796e6d7256f4b3b83240af759f19a6632fefed53d01c5a6d0039ac8c',
  'insee-cog-2026.html': '938614efb397f2ebbeb11337d44a21995154d2bfaee159fc397cb16143fb1318',
  'defense-clipperton.html': '707cf5b57e73034e2fc1e3e2f66f2a59d24ca8e6627a6f02f09635582f08b7c2',
  'upu-france.pdf': '54c80b84d6f5a7480887b8e9a1848758ddf9e91cfa899fb259e6ddea110b2ae0',
  'upu-general-addressing.pdf': 'ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d',
};
function fail(message) { throw new Error('cp-m2-' + message); }
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
  if (geometry?.type !== 'Polygon' || geometry.coordinates.length !== 1) fail('geometry-type-or-rings');
  let positions = 0;
  for (const ring of geometry.coordinates) {
    positions += ring.length;
    if (ring.length !== 110 || !same(ring[0], ring.at(-1))) fail('geometry-ring');
    for (const position of ring) {
      const [longitude, latitude] = position;
      if (!Array.isArray(position) || !Number.isFinite(longitude) || !Number.isFinite(latitude)
        || longitude < -109.3 || longitude > -109.1 || latitude < 10.2 || latitude > 10.4) fail('geometry-position');
    }
  }
  const feature = { type: 'Feature', properties: {}, geometry };
  if (!booleanValid(feature)) fail('geometry-turf-invalid');
  const jstsGeometry = new jsts.io.GeoJSONReader().read(geometry);
  if (!new jsts.operation.valid.IsValidOp(jstsGeometry).isValid()) fail('geometry-jsts-invalid');
  const bounds = bbox(feature);
  if (!same(bounds, EXPECTED_BOUNDS)) fail('geometry-bounds-' + canonicalJson(bounds));
  const squareMeters = area(feature);
  if (Math.abs(squareMeters / 1e6 - 8.889080340032724) > 1e-9) fail('geometry-area');
  return { parts: 1, rings: 1, positions, bounds, squareMeters };
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
  const match = rows.filter(row => row.insee === '98901' || row.postalCode === '98799');
  const expected = { insee: '98901', commune: 'ILE DE CLIPPERTON', postalCode: '98799', routingLabel: 'ILE DE CLIPPERTON', line5: '' };
  if (match.length !== 1 || !same(match[0], expected)) fail('csv-cp-denominator-' + canonicalJson(match));
  if (rows.filter(row => row.insee === '98901').length !== 1 || rows.filter(row => row.postalCode === '98799').length !== 1) fail('csv-cp-cardinality');
  return { rows, match: match[0], distinctPostcodes: new Set(rows.map(row => row.postalCode)).size,
    distinctCommunes: new Set(rows.map(row => row.insee)).size };
}
function exactSearchRow(receipts, name) {
  const body = parseJson(receipts[name], name);
  if (body.total !== 1 || body.results?.length !== 1) fail('laposte-search-cardinality-' + name);
  return body.results[0];
}
function build({ sourceDirectory, outputDirectory, reportPath }) {
  const receipts = Object.fromEntries(Object.keys(EXPECTED).map(name => [name, readExact(sourceDirectory, name)]));
  const dataset = parseJson(receipts['laposte-metadata.json'], 'dataset-metadata');
  const dataGouv = parseJson(receipts['datagouv-dataset.json'], 'datagouv-metadata');
  if (dataset.title !== 'Base officielle des codes postaux' || dataset.id !== 'laposte-hexasmal'
    || dataset.updatedAt !== '2026-08-08T07:04:29.824Z' || dataset.dataUpdatedAt !== '2026-08-08T02:02:09.846Z'
    || dataset.count !== 39_192 || dataset.frequency !== 'semiannual'
    || dataset.license?.title !== 'Licence Ouverte / Open Licence' || dataset.file?.size !== 1_555_485
    || dataset.file?.encoding !== 'ISO-8859-1') fail('dataset-metadata-contract');
  if (dataGouv.title !== 'Base officielle des codes postaux' || dataGouv.license !== 'lov2'
    || dataGouv.access_type !== 'open' || !/COM/u.test(dataGouv.description)
    || !/contours géographiques des codes postaux ne sont pas fournis en open data/iu.test(dataGouv.description)) fail('datagouv-contract');
  const csv = parseOfficialCsv(receipts['laposte-raw.csv']);
  const searched = ['laposte-98799.json', 'laposte-98901.json', 'laposte-clipperton.json'].map(name => {
    const row = exactSearchRow(receipts, name);
    return { code_commune_insee: row.code_commune_insee, nom_de_la_commune: row.nom_de_la_commune,
      code_postal: row.code_postal, libelle_d_acheminement: row.libelle_d_acheminement };
  });
  const expectedRow = { code_commune_insee: '98901', nom_de_la_commune: 'ILE DE CLIPPERTON',
    code_postal: '98799', libelle_d_acheminement: 'ILE DE CLIPPERTON' };
  if (!searched.every(row => same(row, expectedRow))) fail('laposte-search-row');
  const exact = parseJson(receipts['geoapi-98901.json'], 'geoapi-code');
  const byPostcode = parseJson(receipts['geoapi-postal-98799.json'], 'geoapi-postcode');
  if (exact.type !== 'Feature' || byPostcode.type !== 'FeatureCollection' || byPostcode.features?.length !== 1) fail('geoapi-envelope');
  const expectedProperties = { nom: 'Île de Clipperton', code: '98901', codeDepartement: '989', codeRegion: '989', codesPostaux: ['98799'] };
  if (!same(exact.properties, expectedProperties) || !same(byPostcode.features[0].properties, expectedProperties)
    || !same(exact.geometry, byPostcode.features[0].geometry)) fail('geoapi-identity-or-postcode-join');
  const geometryCheck = inspectGeometry(exact.geometry);
  const docs = receipts['geoapi-doc.html'].toString('utf8');
  const licence = receipts['etalab-open-licence.html'].toString('utf8');
  const inseeCodification = receipts['insee-codification.html'].toString('utf8');
  const inseeCog = receipts['insee-cog-2026.html'].toString('utf8');
  const defense = receipts['defense-clipperton.html'].toString('utf8');
  if (!/communes\/\{code\}/iu.test(docs) || !/code postal/iu.test(docs)
    || !/contour/iu.test(docs) || !/geojson/iu.test(docs)) fail('geoapi-doc-contract');
  if (!/Licence Ouverte/iu.test(licence) || !/réutilis/iu.test(licence) || !/attribu/iu.test(licence)) fail('licence-contract');
  if (!/98\s+9\s+01/u.test(inseeCodification) || !/La Passion-Clipperton/iu.test(inseeCodification)
    || !/Code officiel géographique/iu.test(inseeCog) || !/cog_ensemble_2026_csv\.zip/u.test(inseeCog)) fail('insee-contract');
  if (!/aucun habitant/iu.test(defense) || !/aucune habitation/iu.test(defense)) fail('uninhabited-contract');
  for (const name of ['upu-france.pdf', 'upu-general-addressing.pdf']) {
    if (!receipts[name].subarray(0, 4).equals(Buffer.from('%PDF'))) fail('pdf-header-' + name);
  }
  const validTime = { from: DATASET_DATE + 'T00:00:00.000Z', to: null };
  const knownTime = { from: RELEASE_INSTANT, to: null };
  const assignmentSource = {
    sourceId: 'laposte-hexasmal-20260808-cp-98901', sourceType: 'official',
    assignmentAuthority: 'official_postal_dictionary', geometryAuthority: 'none',
    sourceVersion: 'Base officielle des codes postaux; data updated 2026-08-08; exact 98901/98799 row',
    sourceDate: DATASET_DATE, licenseId: LICENSE_ID, digest: 'sha256:' + EXPECTED['laposte-raw.csv'],
  };
  const geometrySource = {
    sourceId: 'geo-api-gouv-fr-commune-98901-20260831-derived-single-postcode', sourceType: 'derived',
    assignmentAuthority: 'derived_spatial_assignment', geometryAuthority: 'derived_geometry',
    sourceVersion: 'geo.api.gouv.fr current commune contour; exact code and postal-code responses; COG 2026 context',
    sourceDate: '2026-08-31', licenseId: LICENSE_ID, digest: 'sha256:' + EXPECTED['geoapi-98901.json'],
  };
  const countryNode = { id: 'country-cp', kind: 'administrative_area', featureKind: 'country', geometryType: 'none',
    countryCode: 'CP', label: 'Clipperton Island (La Passion-Clipperton)', visibility: 'public' };
  const postalNode = { id: 'postal-cp-98799', kind: 'postal_feature', featureKind: 'standard_area', geometryType: 'polygon',
    countryCode: 'CP', postalCode: '98799', label: '98799 single-postcode derived territory display surface', visibility: 'public' };
  const nodes = [countryNode, postalNode];
  const assertions = [{ id: 'laposte-cp-20260808-98799-admin-within-cp', fromNodeId: postalNode.id, toNodeId: countryNode.id,
    relation: 'admin_within', validTime, knownTime, source: assignmentSource, method: 'source_relation',
    quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT } }];
  const features = [{ id: 'geoapi-cp-20260831-98799-surface-1', nodeId: postalNode.id, role: 'postal_area',
    publicationClass: 'public_context', geometry: exact.geometry, source: geometrySource, validTime, knownTime,
    quality: { status: 'derived', confidence: 0.97, validatedAt: RELEASE_INSTANT } }];
  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, { schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'CP', releaseId: RELEASE_ID, features });
  const graphRelease = { schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-cp-laposte-geoapi',
    repositoryUrl: 'https://github.com/veygrit-sys/Address-Grid-ID', countryCode: 'CP', releaseId: RELEASE_ID,
    policyVersion: 'clipperton-laposte-single-postcode-derived-territory-v1', releasedAt: RELEASE_INSTANT,
    validTime, manifestDigest: 'sha256:' + '0'.repeat(64), artifacts: [{ path: basename(geometryPath),
      mediaType: 'application/vnd.agid.postal-context-geometry+json', digest: geometryArtifact.digest,
      byteLength: geometryArtifact.byteLength, recordCount: 1, licenseRefs: [LICENSE_ID] }] };
  const { manifestDigest: _placeholder, ...manifestPayload } = graphRelease;
  graphRelease.manifestDigest = sha256(Buffer.from(canonicalJson(manifestPayload), 'utf8'));
  const graphPath = join(outputDirectory, 'graph.json');
  const graphArtifact = writeJson(graphPath, { schemaVersion: 'postal-context-graph/v0.1', release: graphRelease, nodes, assertions });
  const descriptorPath = join(outputDirectory, 'descriptor.json');
  const descriptorArtifact = writeJson(descriptorPath, { schemaVersion: 'postal-context-pack-descriptor/v0.1',
    repositoryId: graphRelease.repositoryId, countryCode: 'CP', releaseId: RELEASE_ID, policyVersion: graphRelease.policyVersion,
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
  const report = { schemaVersion: 'postal-context-cp-m2-build/v1', countryCode: 'CP', generatedAt: RELEASE_INSTANT,
    releaseId: RELEASE_ID, input: { exactReceipts: sourceReceipts, exactReceiptBytes: sourceReceipts.reduce((sum, item) => sum + item.bytes, 0),
      officialDataset: { rows: csv.rows.length, distinctPostalCodes: csv.distinctPostcodes, distinctCommuneCodes: csv.distinctCommunes,
        cpDenominatorRows: 1, row: csv.match, updatedAt: dataset.updatedAt, dataUpdatedAt: dataset.dataUpdatedAt,
        exactSearchQueries: ['code_postal:98799', 'code_commune_insee:98901', 'CLIPPERTON'], exactSearchRowsEqual: true },
      geoApi: { codeResponseDigest: sha256(receipts['geoapi-98901.json']), postcodeResponseDigest: sha256(receipts['geoapi-postal-98799.json']),
        exactGeometryEquality: true, properties: exact.properties } },
    scope: { publishedPostalCodes: ['98799'], publishedGeometries: 1,
      scopeStatement: 'The complete official snapshot has exactly one 98901 row and exactly one 98799 row: Île de Clipperton -> 98799.',
      officialPostalBoundaryClaimed: false },
    geometry: { type: exact.geometry.type, ...geometryCheck,
      transformations: ['decode-fixed-GeoJSON', 'exact-98799-to-98901-equality-join', 'canonical-JSON-serialization'],
      geometricModification: false, provenance: 'derived', confidence: 0.97 },
    policy: { officialAssignment: true, officialPostalGeometry: false, officialAdministrativeGeometry: true,
      outputProvenance: 'derived', addressOrBuildingRowsPublished: 0, recipientCustomerOrLandRightsRowsPublished: 0,
      inventedAreaRowsPublished: 0, uninhabitedPrimaryEvidence: true },
    artifacts: { graph: graphArtifact, geometry: geometryArtifact, descriptor: descriptorArtifact } };
  if (reportPath) { mkdirSync(dirname(reportPath), { recursive: true }); writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8'); }
  return report;
}
export { build, inspectGeometry, parseOfficialCsv };
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sourceDirectory = resolve(process.argv[2] ?? '');
  const outputDirectory = resolve(process.argv[3] ?? join(ROOT, 'data/postal_country_packs/cp/postal-context/m2'));
  const reportPath = process.argv[4] ? resolve(process.argv[4]) : undefined;
  if (!process.argv[2]) fail('usage-source-directory-required');
  console.log(JSON.stringify(build({ sourceDirectory, outputDirectory, reportPath }), null, 2));
}

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import area from '@turf/area';
import booleanValid from '@turf/boolean-valid';
import jsts from 'jsts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_ID = 'gf-laposte-geoapi-20260901';
const RELEASE_INSTANT = '2026-09-01T02:54:50.355Z';
const SOURCE_DATE = '2026-08-08';
const VALID_FROM = `${SOURCE_DATE}T00:00:00.000Z`;
const LICENSE_ID = 'etalab-open-licence-2.0';
const CONFIDENCE = 0.90;
const MAX_RESPONSE_POSITIONS = 20_000;
const BASE_RECEIPTS = {
  'laposte-dataset-metadata.json': ['b5d6b5dcb421ece75d41b5903ded715a88df97ff1b4fa1f070e9fa7535167d65', 11203],
  'laposte-datagouv-metadata.json': ['c42a15c49ea9591e66270d0a6dad43e2b947c8e29a9013466f03ddd9514d6b08', 8388],
  'laposte-hexasmal.csv': ['f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22', 1555485],
  'geoapi-973-communes.geojson': ['d4fba56670e484cdbed767862263b959546d6aa515ea9fc5690a3c500ad9b724', 2085903],
  'geoapi-communes-doc.html': ['c05f57f48ae4b3adacacf868ed5814ce6152f839c80082c5edeb0571ee0884f4', 89716],
  'etalab-open-licence.html': ['85c8dd8ecfeb60531069a9e8e6208946778360fcb925673b1de39a20bd3d309c', 81733],
  'insee-guyane-973.html': ['61672057759d4ab6c9157eb5ca3914bdd4a236662adde1aad16747aedd18f227', 54140],
};
const POSTCODE_RECEIPTS = {
  '97300': ['f32036450610b792af425da0ef4a0211b5b6bfd548efd25a90838360d1c92c47', 37134],
  '97310': ['6c5a6c843c482101f9bdee7495f2a976d95918fbe981047c0c469f9470e6c16e', 86892],
  '97311': ['d5b512f252bdf67de4cf4a65b7095089ea55b470986aeac5d4fe6617424b17cf', 104320],
  '97312': ['eca5945f739e50f63b6d95d40afb4559807af8fd25bc9b558c6cab47aec2a7c0', 97286],
  '97313': ['b94c5199be62853fdc1196076a89b9732a99d626ba825c65fdce3f3b75b29449', 64664],
  '97314': ['ca8c4024b038023bbf90e866f4ec4a391cbfe2e5d5bb805ca175105895c6aab1', 85172],
  '97315': ['9b4cdfdf328c2ba547e7455452fd6a6f5fbb64064c4a1a6c491a1fd486b0ed1e', 126187],
  '97316': ['fedd63a10e25848de5f1ef78a77a4fe1ee59fd14b94164d6af4ae82bc6973a05', 82784],
  '97317': ['a90da681c9ecc2af51e6983d25741bde3896979b2c5518df94769176762dd433', 98292],
  '97318': ['fa51c5c02920ffa4e15d38836ddb1e4553fa397b302165eeff9b181bf2609e3d', 247814],
  '97319': ['d3abec8c4fe4ef1acf506a8624b0bf3047b7f59f5373d508a1e53208b58e507c', 13944],
  '97320': ['0a60d977e56b7f20c1c13ffeaffc2b2e36d3eebdcfdfec1d8287fd64117e0f21', 178599],
  '97330': ['13c34fbc44de21a0bbd6c0cf6c29a44eb5185741e1e941703b164bc8e19b5138', 105251],
  '97340': ['7d187c34b8ad2d92f3b29dbfb811686f5a0a6205da17ba77b2b08a6fbabfc473', 99254],
  '97350': ['5d0cb847ffac593d720f00ae4f329e09927a6a0dfe28cd0e8a5693d39a4da4b0', 105199],
  '97351': ['a3df26782e7cb51c1fa9ad89fbf3c40c9ff1acbeb1f6df8d4eb487464e6b857b', 18203],
  '97352': ['d5b512f252bdf67de4cf4a65b7095089ea55b470986aeac5d4fe6617424b17cf', 104320],
  '97353': ['90f08013e0217fced4fbc4d17892cdb2f0d04b71e15ea02eb1f4276f133a3e37', 148077],
  '97354': ['0a0871a7690d26c8364466e38e9235a1542c40c067a3d2722bedd42fa863c0b5', 18768],
  '97355': ['4174ae1928164f5cd9a28962954d308574f334044d7e9f042df64fe05c96eb3f', 34280],
  '97356': ['fd05c8416149f95bdd5f7228e7a49297fc8418b6f12cf9f45f41c9de154de089', 50697],
  '97360': ['fa51c5c02920ffa4e15d38836ddb1e4553fa397b302165eeff9b181bf2609e3d', 247814],
  '97370': ['2cc112f6602b6aa1928270a397c7fee6522ae5284deac2052870c3a6527a0d56', 208105],
  '97380': ['e4496bba4c60b4ca8d05bad9e7d9b86c35c5cb762b41c2947b547789bb777800', 75842],
  '97390': ['90f08013e0217fced4fbc4d17892cdb2f0d04b71e15ea02eb1f4276f133a3e37', 148077],
};
const EXPECTED = [
  ['97300', '97302', 'CAYENNE', ''], ['97310', '97304', 'KOUROU', ''],
  ['97311', '97310', 'ROURA', ''], ['97312', '97358', 'ST ELIE', ''],
  ['97313', '97308', 'ST GEORGES', ''], ['97314', '97352', 'SAUL', ''],
  ['97315', '97312', 'SINNAMARY', ''], ['97316', '97362', 'POMPIDOU PAPA ICHTON', ''],
  ['97317', '97360', 'APATOU', ''], ['97318', '97306', 'MANA', 'JAVOUHEY'],
  ['97319', '97361', 'AWALA YALIMAPO', ''], ['97320', '97311', 'ST LAURENT DU MARONI', ''],
  ['97330', '97356', 'CAMOPI', ''], ['97340', '97357', 'GRAND SANTI', ''],
  ['97350', '97303', 'IRACOUBO', ''], ['97351', '97307', 'MATOURY', ''],
  ['97352', '97310', 'ROURA', 'CACAO'], ['97353', '97301', 'REGINA', 'KAW'],
  ['97354', '97309', 'REMIRE MONTJOLY', ''], ['97355', '97305', 'MACOURIA TONATE', ''],
  ['97356', '97313', 'MONTSINERY TONNEGRANDE', ''], ['97360', '97306', 'MANA', ''],
  ['97370', '97353', 'MARIPASOULA', ''], ['97380', '97314', 'OUANARY', ''],
  ['97390', '97301', 'REGINA', ''],
].map(([postalCode, insee, routingLabel, line5]) => ({ postalCode, insee, routingLabel, line5 }));

function fail(message) { throw new Error(`gf-m2-${message}`); }
function sha256(bytes) { return `sha256:${createHash('sha256').update(bytes).digest('hex')}`; }
function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
}
function exactReceipt(path, expected) {
  const bytes = readFileSync(path);
  if (bytes.length !== expected[1] || sha256(bytes) !== `sha256:${expected[0]}`) fail(`receipt-${basename(path)}`);
  return { path, bytes, digest: sha256(bytes), byteLength: bytes.length };
}
function parseCsv(bytes) {
  const lines = new TextDecoder('windows-1252', { fatal: true }).decode(bytes).split(/\r?\n/u).filter(Boolean);
  if (lines.shift() !== '#Code_commune_INSEE;Nom_de_la_commune;Code_postal;Libellé_d_acheminement;Ligne_5') fail('csv-header');
  const rows = lines.map((line, index) => {
    const [insee, commune, postalCode, routingLabel, line5, ...rest] = line.split(';');
    if (rest.length || !/^[0-9A-Z]{5}$/u.test(insee) || !/^\d{5}$/u.test(postalCode)) fail(`csv-row-${index + 2}`);
    return { insee, commune, postalCode, routingLabel, line5 };
  });
  if (rows.length !== 39_192 || new Set(rows.map(canonicalJson)).size !== rows.length) fail('csv-denominator');
  const gf = rows.filter(row => row.postalCode.startsWith('973'));
  if (gf.length !== 25 || new Set(gf.map(row => row.postalCode)).size !== 25 || new Set(gf.map(row => row.insee)).size !== 22) fail('csv-gf-denominator');
  for (const expected of EXPECTED) {
    const row = gf.find(item => item.postalCode === expected.postalCode);
    if (!row || row.insee !== expected.insee || row.routingLabel !== expected.routingLabel || row.line5 !== expected.line5) fail(`csv-identity-${expected.postalCode}`);
  }
  return { rows, gf: gf.sort((a, b) => a.postalCode.localeCompare(b.postalCode)) };
}
function polygonsFor(geometry) { return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates; }
function inspectGeometry(geometry, code) {
  if (!geometry || !['Polygon', 'MultiPolygon'].includes(geometry.type)) fail(`geometry-type-${code}`);
  let positions = 0; let rings = 0;
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  for (const polygon of polygonsFor(geometry)) for (const ring of polygon) {
    if (!Array.isArray(ring) || ring.length < 4) fail(`geometry-ring-${code}`);
    rings += 1;
    if (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1]) fail(`geometry-open-${code}`);
    for (const position of ring) {
      const [longitude, latitude] = position;
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -55 || longitude > -51 || latitude < 2 || latitude > 6) fail(`geometry-range-${code}`);
      positions += 1;
      bounds[0] = Math.min(bounds[0], longitude); bounds[1] = Math.min(bounds[1], latitude);
      bounds[2] = Math.max(bounds[2], longitude); bounds[3] = Math.max(bounds[3], latitude);
    }
  }
  const feature = { type: 'Feature', properties: {}, geometry };
  if (!booleanValid(feature)) fail(`geometry-turf-${code}`);
  if (!new jsts.operation.valid.IsValidOp(new jsts.io.GeoJSONReader().read(geometry)).isValid()) fail(`geometry-jsts-${code}`);
  const squareMeters = area(feature);
  if (!(squareMeters > 0) || positions > MAX_RESPONSE_POSITIONS) fail(`geometry-budget-${code}`);
  return { positions, rings, bounds, squareMeters };
}
function writeJson(path, value, pretty = false) {
  const bytes = Buffer.from(`${JSON.stringify(value, null, pretty ? 2 : 0)}\n`, 'utf8');
  writeFileSync(path, bytes);
  return { digest: sha256(bytes), byteLength: bytes.length };
}

function build({ sourceDirectory, outputDirectory, reportPath }) {
  const receipts = Object.entries(BASE_RECEIPTS).map(([name, expected]) => exactReceipt(join(sourceDirectory, name), expected));
  const metadata = JSON.parse(receipts[0].bytes.toString('utf8'));
  const dataGouv = JSON.parse(receipts[1].bytes.toString('utf8'));
  if (metadata.id !== 'laposte-hexasmal' || metadata.count !== 39192 || metadata.frequency !== 'semiannual'
    || !String(metadata.dataUpdatedAt).startsWith('2026-08-08') || metadata.license?.title !== 'Licence Ouverte / Open Licence') fail('metadata-contract');
  if (dataGouv.license !== 'lov2' || !JSON.stringify(dataGouv).includes('008a2dda-2c60-4b63-b910-998f6f818089')) fail('datagouv-contract');
  const csv = parseCsv(receipts[2].bytes);
  const department = JSON.parse(receipts[3].bytes.toString('utf8'));
  if (department.type !== 'FeatureCollection' || department.features.length !== 22) fail('department-cardinality');
  const inseeHtml = receipts[6].bytes.toString('utf8');
  if (!/Code Officiel Géographique au 1er janvier 2026/u.test(inseeHtml)
    || !/Guyane est 973/u.test(inseeHtml)
    || !/Liste des 22[\s\S]{0,500}niveau-COM/u.test(inseeHtml)) fail('insee-cog');
  const docsHtml = receipts[4].bytes.toString('utf8');
  if (!/code postal/iu.test(docsHtml) || !/geometry=contour/iu.test(docsHtml) || !/GeoJSON/iu.test(docsHtml)) fail('geoapi-doc');
  const licenceHtml = receipts[5].bytes.toString('utf8');
  if (!/Licence Ouverte/iu.test(licenceHtml) || !/réutilis/iu.test(licenceHtml) || !/date/iu.test(licenceHtml)) fail('licence-contract');
  const communes = new Map();
  for (const feature of department.features) {
    const code = feature.properties?.code;
    if (!/^973\d{2}$/.test(code) || communes.has(code)) fail(`department-identity-${code}`);
    const checks = inspectGeometry(feature.geometry, code);
    communes.set(code, { ...feature, checks });
  }
  if (canonicalJson([...communes.keys()].sort()) !== canonicalJson([...new Set(csv.gf.map(row => row.insee))].sort())) fail('department-code-set');
  const expectedPostcodeFiles = Object.keys(POSTCODE_RECEIPTS).map(code => `${code}.geojson`).sort();
  if (canonicalJson(readdirSync(join(sourceDirectory, 'postal-codes')).sort()) !== canonicalJson(expectedPostcodeFiles)) fail('postcode-file-set');
  const queryReceipts = csv.gf.map(row => {
    const receipt = exactReceipt(join(sourceDirectory, 'postal-codes', `${row.postalCode}.geojson`), POSTCODE_RECEIPTS[row.postalCode]);
    const body = JSON.parse(receipt.bytes.toString('utf8'));
    if (body.type !== 'FeatureCollection' || body.features.length !== 1) fail(`postcode-cardinality-${row.postalCode}`);
    const feature = body.features[0]; const commune = communes.get(row.insee);
    if (feature.properties?.code !== row.insee || canonicalJson(feature.geometry) !== canonicalJson(commune.geometry)) fail(`postcode-join-${row.postalCode}`);
    if (!feature.properties.codesPostaux.includes(row.postalCode)) fail(`postcode-property-${row.postalCode}`);
    return { ...receipt, postalCode: row.postalCode, insee: row.insee };
  });
  receipts.push(...queryReceipts);
  const assignmentSource = {
    sourceId: 'gf-la-poste-hexasmal-20260808', sourceType: 'official', assignmentAuthority: 'official_postal_operator',
    geometryAuthority: 'none', sourceVersion: 'Base officielle des codes postaux / resource 008a2dda-2c60-4b63-b910-998f6f818089',
    sourceDate: SOURCE_DATE, licenseId: LICENSE_ID, digest: `sha256:${BASE_RECEIPTS['laposte-hexasmal.csv'][0]}`,
  };
  const adminSource = {
    sourceId: 'gf-geo-api-gouv-973-communes-20260901', sourceType: 'official', assignmentAuthority: 'none',
    geometryAuthority: 'official_mapping_geometry', sourceVersion: 'COG 2026 Guyane department 973; 22 commune contours',
    sourceDate: '2026-01-01', licenseId: LICENSE_ID, digest: `sha256:${BASE_RECEIPTS['geoapi-973-communes.geojson'][0]}`,
  };
  const derivedSource = {
    sourceId: 'gf-postcode-commune-display-surfaces-20260901', sourceType: 'derived',
    assignmentAuthority: 'official_postal_operator', geometryAuthority: 'official_mapping_geometry',
    sourceVersion: '25 exact La Poste postcode-to-INSEE joins; three shared-commune postcode pairs retain identical commune geometry without modification',
    sourceDate: SOURCE_DATE, licenseId: LICENSE_ID,
    digest: sha256(Buffer.from(canonicalJson({ assignment: assignmentSource.digest, geometry: adminSource.digest, queries: queryReceipts.map(item => item.digest) }), 'utf8')),
  };
  const validTime = { from: VALID_FROM, to: null }; const knownTime = { from: RELEASE_INSTANT, to: null };
  const countryNode = { id: 'country-gf', kind: 'administrative_area', featureKind: 'country', geometryType: 'none', countryCode: 'GF', label: 'French Guiana', visibility: 'public' };
  const administrativeNodes = [...communes.values()].sort((a, b) => a.properties.code.localeCompare(b.properties.code)).map(feature => ({
    id: `administrative-gf-${feature.properties.code}`, kind: 'administrative_area', featureKind: 'administrative',
    geometryType: feature.geometry.type.toLowerCase(), countryCode: 'GF', label: feature.properties.nom, visibility: 'public',
  }));
  const postalNodes = csv.gf.map(row => ({
    id: `postal-gf-${row.postalCode}`, kind: 'postal_feature', featureKind: 'standard_area',
    geometryType: communes.get(row.insee).geometry.type.toLowerCase(), countryCode: 'GF', postalCode: row.postalCode,
    label: `${row.postalCode} ${row.routingLabel}${row.line5 ? ` (${row.line5})` : ''} — derived commune display surface`, visibility: 'public',
  }));
  const assertions = [
    ...csv.gf.map(row => ({ id: `laposte-gf-20260808-${row.postalCode}-assigned-${row.insee}`, fromNodeId: `administrative-gf-${row.insee}`, toNodeId: `postal-gf-${row.postalCode}`, relation: 'postal_assigned', validTime, knownTime, source: assignmentSource, method: 'official_crosswalk', quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT } })),
    ...[...communes.keys()].sort().map(code => ({ id: `geo-api-gf-20260901-${code}-part-of-gf`, fromNodeId: `administrative-gf-${code}`, toNodeId: countryNode.id, relation: 'part_of', validTime, knownTime, source: adminSource, method: 'source_relation', quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT } })),
  ];
  const features = csv.gf.map(row => ({
    id: `gf-derived-${row.postalCode}`, nodeId: `postal-gf-${row.postalCode}`, role: 'postal_area', publicationClass: 'public_context',
    geometry: communes.get(row.insee).geometry, source: derivedSource, validTime, knownTime,
    quality: { status: 'derived', confidence: CONFIDENCE, validatedAt: RELEASE_INSTANT },
  }));
  const positions = csv.gf.reduce((sum, row) => sum + communes.get(row.insee).checks.positions, 0);
  const rings = csv.gf.reduce((sum, row) => sum + communes.get(row.insee).checks.rings, 0);
  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, { schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'GF', releaseId: RELEASE_ID, features });
  const graphRelease = { schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-gf-laposte-geoapi', repositoryUrl: 'https://github.com/veygrit-sys/Address-Grid-ID', countryCode: 'GF', releaseId: RELEASE_ID, policyVersion: 'gf-current-derived-commune-display-v1', releasedAt: RELEASE_INSTANT, validTime, manifestDigest: `sha256:${'0'.repeat(64)}`, artifacts: [{ path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json', digest: geometryArtifact.digest, byteLength: geometryArtifact.byteLength, recordCount: features.length, licenseRefs: [LICENSE_ID] }] };
  const { manifestDigest: _placeholder, ...manifestPayload } = graphRelease;
  graphRelease.manifestDigest = sha256(Buffer.from(canonicalJson(manifestPayload), 'utf8'));
  const graphPath = join(outputDirectory, 'graph.json');
  const graphArtifact = writeJson(graphPath, { schemaVersion: 'postal-context-graph/v0.1', release: graphRelease, nodes: [countryNode, ...administrativeNodes, ...postalNodes], assertions });
  const descriptorPath = join(outputDirectory, 'descriptor.json');
  const descriptorArtifact = writeJson(descriptorPath, { schemaVersion: 'postal-context-pack-descriptor/v0.1', repositoryId: graphRelease.repositoryId, countryCode: 'GF', releaseId: RELEASE_ID, policyVersion: graphRelease.policyVersion, sequence: 1, previousDescriptorDigest: null, graphManifestDigest: graphRelease.manifestDigest, createdAt: RELEASE_INSTANT, maturity: 'M2_experimental', synthetic: false, promotionEligible: true, containsResidentialAddressPoints: false, artifacts: [
    { role: 'graph', path: basename(graphPath), mediaType: 'application/vnd.agid.postal-context-graph+json', schemaVersion: 'postal-context-graph/v0.1', byteLength: graphArtifact.byteLength, digest: graphArtifact.digest, recordCounts: { nodes: 48, assertions: 47 } },
    { role: 'geometry', path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json', schemaVersion: 'postal-context-geometry/v0.1', byteLength: geometryArtifact.byteLength, digest: geometryArtifact.digest, recordCounts: { features: 25, positions } },
  ] });
  const sharedSurfaceGroups = [...communes.values()].filter(feature => feature.properties.codesPostaux.length > 1).map(feature => ({ insee: feature.properties.code, commune: feature.properties.nom, postalCodes: feature.properties.codesPostaux.slice().sort() }));
  const report = {
    schemaVersion: 'postal-context-gf-m2-build/v1', countryCode: 'GF', generatedAt: RELEASE_INSTANT, releaseId: RELEASE_ID,
    evidence: { exactBodies: receipts.length, exactBytes: receipts.reduce((sum, item) => sum + item.byteLength, 0), receipts: receipts.map(item => ({ path: relative(sourceDirectory, item.path).replaceAll('\\', '/'), digest: item.digest, byteLength: item.byteLength })) },
    denominator: { officialRows: csv.rows.length, gfRows: 25, distinctPostalCodes: 25, distinctCommuneCodes: 22, geoApiDepartmentFeatures: 22, exactPostcodeQueries: 25 },
    scope: { publishedPostalCodes: csv.gf.map(row => row.postalCode), publishedGeometries: 25, nationalCoverageClaimed: true, officialPostalBoundaryClaimed: false, sharedSurfaceGroups },
    geometry: { polygonFeatures: features.filter(item => item.geometry.type === 'Polygon').length, multiPolygonFeatures: features.filter(item => item.geometry.type === 'MultiPolygon').length, positions, rings, allTurfValid: true, allJstsValid: true, allRingsClosed: true, allCoordinatesWithinFrenchGuianaBounds: true, maxResponsePositions: Math.max(...[...communes.values()].map(item => item.checks.positions)), transformations: ['windows-1252-decode', 'exact-postcode-to-INSEE-equality-join', 'copy-matching-commune-geometry-without-coordinate-modification', 'sort-by-postal-code'], geometricModification: false, provenance: 'derived', confidence: CONFIDENCE },
    policy: { officialAssignment: true, officialAdministrativeGeometry: true, officialPostalBoundary: false, deliveryAddressBuildingParcelOrLandRightClaimed: false, addressBuildingRecipientCustomerOrLandRightsRowsPublished: 0, inventedAreaRowsPublished: 0 },
    artifacts: { graph: graphArtifact, geometry: geometryArtifact, descriptor: descriptorArtifact },
  };
  if (reportPath) writeJson(reportPath, report, true);
  return report;
}

export { build, inspectGeometry, parseCsv };
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) fail('usage-source-directory-required');
  const sourceDirectory = resolve(process.argv[2]);
  const outputDirectory = resolve(process.argv[3] ?? join(ROOT, 'data/postal_country_packs/gf/postal-context/m2'));
  const reportPath = process.argv[4] ? resolve(process.argv[4]) : undefined;
  console.log(JSON.stringify(build({ sourceDirectory, outputDirectory, reportPath }), null, 2));
}

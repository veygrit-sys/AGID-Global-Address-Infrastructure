import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import area from '@turf/area';
import booleanValid from '@turf/boolean-valid';
import jsts from 'jsts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_ID = 'mq-laposte-geoapi-20260901';
const RELEASE_INSTANT = '2026-09-01T13:07:27.205Z';
const SOURCE_DATE = '2026-08-08';
const VALID_FROM = `${SOURCE_DATE}T00:00:00.000Z`;
const LICENSE_ID = 'etalab-open-licence-2.0';
const CONFIDENCE = 0.90;
const MAX_RESPONSE_POSITIONS = 20_000;
const BASE_RECEIPTS = {
  'laposte-dataset-metadata.json': ['b5d6b5dcb421ece75d41b5903ded715a88df97ff1b4fa1f070e9fa7535167d65', 11203],
  'laposte-datagouv-metadata.json': ['453a8cd0168191503ae7e949f89523206d921ab67c67370f3a6fd97fc3da45a2', 8388],
  'laposte-hexasmal.csv': ['f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22', 1555485],
  'geoapi-972-communes.geojson': ['b7a30e913a752fe828d3619095187aae1d42cbc7cf06d9aedfac77110e9e30dd', 884808],
  'geoapi-communes-doc.html': ['c05f57f48ae4b3adacacf868ed5814ce6152f839c80082c5edeb0571ee0884f4', 89716],
  'etalab-open-licence.html': ['706f075457bc6106c64b4040bceb0c63926b67192145e669a278ec72723e2ca3', 81691],
  'insee-martinique-972.html': ['3cc336c9ac01e1496cbac460b7ebc37ede0fd7526fad73a510a3cc3490e7560b', 56318],
};
const POSTCODE_RECEIPTS = {
  '97200': ['6576b6009f42f5ca438d2c02e7bf72438d8ce0aa8101364cd7e94d86e7970897', 34754],
  '97211': ['1fead8e1c09b4c461ec4107fdb89b0d927b6113c18f1fb3f7884a5a5323fcfa4', 13504],
  '97212': ['f55f71f8b34a9b529ee93a261e979f9ae0268c557c0c47a5b43fc36379f20b2b', 23868],
  '97213': ['08949901ff52df7970c45396cce4886ab798e20ceb6273ea8d1cb7d1dd33f295', 20958],
  '97214': ['a46ff649c9dc09721f12ddd28685366c7e8d385b86bc317835262b3bbda49f6c', 22532],
  '97215': ['e078bca4f83db8388c7eb40704de934166f436fe3059b2c4c68d05d06996ea69', 19442],
  '97216': ['fbd01a1774cdb141b24ae1b2e871cc7b19a73759031dbc728b55ef4a0c2e00f1', 15822],
  '97217': ['5c1e1a6423c8b69a0d9d3dd995eeebe28b7343246243c9f881fce6b3e4c3f309', 20594],
  '97218': ['17345e89b6f760912b738f8c957e79083531ca23933f7b4b1ec07cae0e4bf02b', 45676],
  '97220': ['b7f5838c1a52490717c53d6e8e97ed250bac2aaee563ce167171328ab64c6c80', 65636],
  '97221': ['19b332431d52fabec3c4b65e3140165a7ec2352c4694275ea0712951d550563d', 16890],
  '97222': ['8faa5572237699fa7a1ae702f348d0262b2847032ed009f126060313b063edb2', 28873],
  '97223': ['ad8b3254ecb90bf922b9c0acb2370a4e21d9fb8c8c1604c76c53f424540f8832', 24352],
  '97224': ['6b1b41668ea4628ac7a48a6c8bb5c01a660c7302f6a57ba3d0aee25659c459b2', 23991],
  '97225': ['9f85ef396b05f49a7bb4226358844308601d8044f0ede5ad1ee9f25b6bb16847', 23128],
  '97226': ['546a70aed31bedf5f3fa1004bb9a0443019d502921ee76b9d1f306ec242002e4', 10958],
  '97227': ['073c7a0a7745334144f72b356026405032fc5a2cf9c072b1931939134fca127a', 52348],
  '97228': ['37580f7fc0fb6e74f5d4f6651c1491927ca6a4ca498fad55b1339801994ba5f2', 20150],
  '97229': ['499a6208df919cb0e57ba606ff80641f545e5f4d3ebb0076a8d2b0a813ba967e', 26148],
  '97230': ['236d72a27b2c195ce239c35782810a0b4716b99edf894656e3b6c0f594683916', 30366],
  '97231': ['0fdbe1c1a59acb7da9f20d22dbbeb18ae5de0767c4bccb2ec034477df5eeb631', 64488],
  '97232': ['c34090fbefcb87f39e0877a60e604f79c9d803d22c636b3acae5d14179a57b0c', 48001],
  '97233': ['9013d3d0383688cd0d7cdef344bf32d5491c085e0ddf3a82604c47a201a9ec34', 20186],
  '97234': ['6576b6009f42f5ca438d2c02e7bf72438d8ce0aa8101364cd7e94d86e7970897', 34754],
  '97240': ['e01e004a2f4f8b4544d450ba8c37261d3bc92ab617bf10b19277ee7f3105138c', 51342],
  '97250': ['cc91c99e1b61a94d6bec218f41bd5a3919f5ec67f29c45466234b64deb5cc74b', 62291],
  '97260': ['8b431157c97150a2dc0f548a106083f17c7510c42a991228bdfd2bdd727c1129', 21834],
  '97270': ['fbfc7e42bfd6525d71ad8ad064876163e82b66ffb8707e48e2b65921c187d339', 12332],
  '97280': ['c65680ec118624f20ded409163947719585b60d41264b46cac327dc81b23c3aa', 43483],
  '97290': ['dfc532c1b0e6d75180d41b9737220334dfc7d00bbc50d3125f6361a7654dc9fb', 22009],
};
const EXPECTED = [
  ['97200', '97209', 'FORT DE FRANCE', ['']], ['97211', '97220', 'RIVIERE PILOTE', ['']],
  ['97212', '97224', 'ST JOSEPH', ['']], ['97213', '97212', 'GROS MORNE', ['']],
  ['97214', '97214', 'LE LORRAIN', ['']], ['97215', '97221', 'RIVIERE SALEE', ['', 'RIVIERE SALEE PETIT BOURG']],
  ['97216', '97201', 'L AJOUPA BOUILLON', ['']], ['97217', '97202', 'LES ANSES D ARLET', ['']],
  ['97218', '97203', 'BASSE POINTE', ['']], ['97218', '97211', 'GRAND RIVIERE', ['']],
  ['97218', '97215', 'MACOUBA', ['']], ['97220', '97230', 'LA TRINITE', ['']],
  ['97221', '97204', 'LE CARBET', ['']], ['97222', '97205', 'CASE PILOTE', ['']],
  ['97222', '97234', 'BELLEFONTAINE', ['']], ['97223', '97206', 'LE DIAMANT', ['']],
  ['97224', '97207', 'DUCOS', ['']], ['97225', '97216', 'LE MARIGOT', ['']],
  ['97226', '97233', 'LE MORNE VERT', ['']], ['97227', '97226', 'STE ANNE', ['']],
  ['97228', '97227', 'STE LUCE', ['']], ['97229', '97231', 'LES TROIS ILETS', ['']],
  ['97230', '97228', 'STE MARIE', ['', 'STE MARIE MORNE DES ESSES']],
  ['97231', '97222', 'LE ROBERT', ['', 'ROBERT VERT PRE']], ['97232', '97213', 'LE LAMENTIN', ['']],
  ['97233', '97229', 'SCHOELCHER', ['']], ['97234', '97209', 'FORT DE FRANCE', ['']],
  ['97240', '97210', 'LE FRANCOIS', ['']], ['97250', '97208', 'FONDS ST DENIS', ['']],
  ['97250', '97219', 'LE PRECHEUR', ['']], ['97250', '97225', 'ST PIERRE', ['']],
  ['97260', '97218', 'LE MORNE ROUGE', ['']], ['97270', '97223', 'ST ESPRIT', ['']],
  ['97280', '97232', 'LE VAUCLIN', ['']], ['97290', '97217', 'LE MARIN', ['']],
].map(([postalCode, insee, routingLabel, line5]) => ({ postalCode, insee, routingLabel, line5 }));

function fail(message) { throw new Error(`mq-m2-${message}`); }
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
  const mqRows = rows.filter(row => /^972\d{2}$/u.test(row.insee));
  const excluded = rows.filter(row => /^972\d{2}$/u.test(row.postalCode) && !/^972\d{2}$/u.test(row.insee))
    .map(row => ({ postalCode: row.postalCode, insee: row.insee })).sort((a, b) => a.postalCode.localeCompare(b.postalCode));
  if (mqRows.length !== 38 || new Set(mqRows.map(row => row.postalCode)).size !== 30 || new Set(mqRows.map(row => row.insee)).size !== 34) fail('csv-mq-denominator');
  if (excluded.length !== 0) fail('csv-territory-exclusions');
  const mq = EXPECTED.map(expected => {
    const matches = mqRows.filter(row => row.postalCode === expected.postalCode && row.insee === expected.insee);
    const line5 = [...new Set(matches.map(row => row.line5))].sort();
    if (!matches.length || matches.some(row => row.routingLabel !== expected.routingLabel)
      || canonicalJson(line5) !== canonicalJson(expected.line5)) fail(`csv-identity-${expected.postalCode}-${expected.insee}`);
    return { postalCode: expected.postalCode, insee: expected.insee, routingLabel: expected.routingLabel, line5 };
  });
  if (new Set(mq.map(row => `${row.postalCode}/${row.insee}`)).size !== 35
    || mqRows.some(row => !mq.some(pair => pair.postalCode === row.postalCode && pair.insee === row.insee))) fail('csv-pair-denominator');
  return { rows, mqRows, mq, excluded };
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
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -62 || longitude > -60 || latitude < 13 || latitude > 16) fail(`geometry-range-${code}`);
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
  if (department.type !== 'FeatureCollection' || department.features.length !== 34) fail('department-cardinality');
  const inseeHtml = receipts[6].bytes.toString('utf8');
  if (!/Code Officiel Géographique au 1er janvier 2026/u.test(inseeHtml)
    || !/Martinique est 972/u.test(inseeHtml)
    || !/Liste des 34[\s\S]{0,500}niveau-COM/u.test(inseeHtml)) fail('insee-cog');
  const docsHtml = receipts[4].bytes.toString('utf8');
  if (!/code postal/iu.test(docsHtml) || !/geometry=contour/iu.test(docsHtml) || !/GeoJSON/iu.test(docsHtml)) fail('geoapi-doc');
  const licenceHtml = receipts[5].bytes.toString('utf8');
  if (!/Licence Ouverte/iu.test(licenceHtml) || !/réutilis/iu.test(licenceHtml) || !/date/iu.test(licenceHtml)) fail('licence-contract');
  const communes = new Map();
  for (const feature of department.features) {
    const code = feature.properties?.code;
    if (!/^972\d{2}$/.test(code) || communes.has(code)) fail(`department-identity-${code}`);
    const checks = inspectGeometry(feature.geometry, code);
    communes.set(code, { ...feature, checks });
  }
  if (canonicalJson([...communes.keys()].sort()) !== canonicalJson([...new Set(csv.mq.map(row => row.insee))].sort())) fail('department-code-set');
  const expectedPostcodeFiles = Object.keys(POSTCODE_RECEIPTS).map(code => `${code}.geojson`).sort();
  if (canonicalJson(readdirSync(join(sourceDirectory, 'postal-codes')).sort()) !== canonicalJson(expectedPostcodeFiles)) fail('postcode-file-set');
  const queryReceipts = Object.keys(POSTCODE_RECEIPTS).map(postalCode => {
    const receipt = exactReceipt(join(sourceDirectory, 'postal-codes', `${postalCode}.geojson`), POSTCODE_RECEIPTS[postalCode]);
    const body = JSON.parse(receipt.bytes.toString('utf8'));
    const expectedPairs = csv.mq.filter(row => row.postalCode === postalCode);
    if (body.type !== 'FeatureCollection' || body.features.length !== expectedPairs.length) fail(`postcode-cardinality-${postalCode}`);
    const actualCodes = body.features.map(feature => feature.properties?.code).sort();
    if (canonicalJson(actualCodes) !== canonicalJson(expectedPairs.map(row => row.insee).sort())) fail(`postcode-identities-${postalCode}`);
    let positions = 0;
    for (const feature of body.features) {
      const commune = communes.get(feature.properties.code);
      if (!commune || canonicalJson(feature.geometry) !== canonicalJson(commune.geometry)) fail(`postcode-join-${postalCode}-${feature.properties.code}`);
      if (!feature.properties.codesPostaux.includes(postalCode)) fail(`postcode-property-${postalCode}-${feature.properties.code}`);
      positions += commune.checks.positions;
    }
    if (positions > MAX_RESPONSE_POSITIONS) fail(`postcode-response-budget-${postalCode}`);
    return { ...receipt, postalCode, insee: actualCodes, positions };
  });
  receipts.push(...queryReceipts);
  const assignmentSource = {
    sourceId: 'mq-la-poste-hexasmal-20260808', sourceType: 'official', assignmentAuthority: 'official_postal_operator',
    geometryAuthority: 'none', sourceVersion: 'Base officielle des codes postaux / resource 008a2dda-2c60-4b63-b910-998f6f818089',
    sourceDate: SOURCE_DATE, licenseId: LICENSE_ID, digest: `sha256:${BASE_RECEIPTS['laposte-hexasmal.csv'][0]}`,
  };
  const adminSource = {
    sourceId: 'mq-geo-api-gouv-972-communes-20260901', sourceType: 'official', assignmentAuthority: 'none',
    geometryAuthority: 'official_mapping_geometry', sourceVersion: 'COG 2026 Martinique department 972; 34 commune contours',
    sourceDate: '2026-01-01', licenseId: LICENSE_ID, digest: `sha256:${BASE_RECEIPTS['geoapi-972-communes.geojson'][0]}`,
  };
  const derivedSource = {
    sourceId: 'mq-postcode-commune-display-surfaces-20260901', sourceType: 'derived',
    assignmentAuthority: 'official_postal_operator', geometryAuthority: 'official_mapping_geometry',
    sourceVersion: '35 exact joins/30 codes; 97218, 97222 and 97250 stay multiple; 97200/97234 share Fort-de-France; Ligne 5 labels retained; coordinates unchanged',
    sourceDate: SOURCE_DATE, licenseId: LICENSE_ID,
    digest: sha256(Buffer.from(canonicalJson({ assignment: assignmentSource.digest, geometry: adminSource.digest, queries: queryReceipts.map(item => item.digest) }), 'utf8')),
  };
  const validTime = { from: VALID_FROM, to: null }; const knownTime = { from: RELEASE_INSTANT, to: null };
  const countryNode = { id: 'country-mq', kind: 'administrative_area', featureKind: 'country', geometryType: 'none', countryCode: 'MQ', label: 'Martinique', visibility: 'public' };
  const administrativeNodes = [...communes.values()].sort((a, b) => a.properties.code.localeCompare(b.properties.code)).map(feature => ({
    id: `administrative-mq-${feature.properties.code}`, kind: 'administrative_area', featureKind: 'administrative',
    geometryType: feature.geometry.type.toLowerCase(), countryCode: 'MQ', label: feature.properties.nom, visibility: 'public',
  }));
  const postalCodes = [...new Set(csv.mq.map(row => row.postalCode))].sort();
  const postalNodes = csv.mq.map(row => ({
    id: `postal-mq-${row.postalCode}-${row.insee}`, kind: 'postal_feature', featureKind: 'standard_area',
    geometryType: communes.get(row.insee).geometry.type.toLowerCase(), countryCode: 'MQ', postalCode: row.postalCode,
    label: `${row.postalCode} ${row.routingLabel}${row.line5.filter(Boolean).length ? ` (${row.line5.filter(Boolean).join(', ')})` : ''} — derived commune display surface`,
    visibility: 'public',
  }));
  const assertions = [
    ...csv.mq.map(row => ({ id: `laposte-mq-20260808-${row.postalCode}-assigned-${row.insee}`, fromNodeId: `administrative-mq-${row.insee}`, toNodeId: `postal-mq-${row.postalCode}-${row.insee}`, relation: 'postal_assigned', validTime, knownTime, source: assignmentSource, method: 'official_crosswalk', quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT } })),
    ...[...communes.keys()].sort().map(code => ({ id: `geo-api-mq-20260901-${code}-part-of-mq`, fromNodeId: `administrative-mq-${code}`, toNodeId: countryNode.id, relation: 'part_of', validTime, knownTime, source: adminSource, method: 'source_relation', quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT } })),
  ];
  const features = csv.mq.map(row => ({
    id: `mq-derived-${row.postalCode}-${row.insee}`, nodeId: `postal-mq-${row.postalCode}-${row.insee}`, role: 'postal_area', publicationClass: 'public_context',
    geometry: communes.get(row.insee).geometry, source: derivedSource, validTime, knownTime,
    quality: { status: 'derived', confidence: CONFIDENCE, validatedAt: RELEASE_INSTANT },
  }));
  const positions = csv.mq.reduce((sum, row) => sum + communes.get(row.insee).checks.positions, 0);
  const rings = csv.mq.reduce((sum, row) => sum + communes.get(row.insee).checks.rings, 0);
  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, { schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'MQ', releaseId: RELEASE_ID, features });
  const graphRelease = { schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-mq-laposte-geoapi', repositoryUrl: 'https://github.com/veygrit-sys/Address-Grid-ID', countryCode: 'MQ', releaseId: RELEASE_ID, policyVersion: 'mq-current-derived-commune-display-v1', releasedAt: RELEASE_INSTANT, validTime, manifestDigest: `sha256:${'0'.repeat(64)}`, artifacts: [{ path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json', digest: geometryArtifact.digest, byteLength: geometryArtifact.byteLength, recordCount: features.length, licenseRefs: [LICENSE_ID] }] };
  const { manifestDigest: _placeholder, ...manifestPayload } = graphRelease;
  graphRelease.manifestDigest = sha256(Buffer.from(canonicalJson(manifestPayload), 'utf8'));
  const graphPath = join(outputDirectory, 'graph.json');
  const graphArtifact = writeJson(graphPath, { schemaVersion: 'postal-context-graph/v0.1', release: graphRelease, nodes: [countryNode, ...administrativeNodes, ...postalNodes], assertions });
  const descriptorPath = join(outputDirectory, 'descriptor.json');
  const descriptorArtifact = writeJson(descriptorPath, { schemaVersion: 'postal-context-pack-descriptor/v0.1', repositoryId: graphRelease.repositoryId, countryCode: 'MQ', releaseId: RELEASE_ID, policyVersion: graphRelease.policyVersion, sequence: 1, previousDescriptorDigest: null, graphManifestDigest: graphRelease.manifestDigest, createdAt: RELEASE_INSTANT, maturity: 'M2_experimental', synthetic: false, promotionEligible: true, containsResidentialAddressPoints: false, artifacts: [
    { role: 'graph', path: basename(graphPath), mediaType: 'application/vnd.agid.postal-context-graph+json', schemaVersion: 'postal-context-graph/v0.1', byteLength: graphArtifact.byteLength, digest: graphArtifact.digest, recordCounts: { nodes: 1 + administrativeNodes.length + postalNodes.length, assertions: assertions.length } },
    { role: 'geometry', path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json', schemaVersion: 'postal-context-geometry/v0.1', byteLength: geometryArtifact.byteLength, digest: geometryArtifact.digest, recordCounts: { features: features.length, positions } },
  ] });
  const sharedSurfaceGroups = [...communes.values()].map(feature => ({ insee: feature.properties.code, commune: feature.properties.nom, postalCodes: postalCodes.filter(code => csv.mq.some(row => row.postalCode === code && row.insee === feature.properties.code)) })).filter(group => group.postalCodes.length > 1);
  const multiCommuneGroups = postalCodes.map(postalCode => ({ postalCode, insee: csv.mq.filter(row => row.postalCode === postalCode).map(row => row.insee) })).filter(group => group.insee.length > 1);
  const multiLine5Groups = csv.mq.filter(row => row.line5.some(Boolean)).map(row => ({ postalCode: row.postalCode, insee: row.insee, line5: row.line5 }));
  const report = {
    schemaVersion: 'postal-context-mq-m2-build/v1', countryCode: 'MQ', generatedAt: RELEASE_INSTANT, releaseId: RELEASE_ID,
    evidence: { exactBodies: receipts.length, exactBytes: receipts.reduce((sum, item) => sum + item.byteLength, 0), receipts: receipts.map(item => ({ path: relative(sourceDirectory, item.path).replaceAll('\\', '/'), digest: item.digest, byteLength: item.byteLength })) },
    denominator: { officialRows: csv.rows.length, mqRows: csv.mqRows.length, distinctPostalCodes: postalCodes.length, distinctCommuneCodes: communes.size, distinctPostcodeCommunePairs: csv.mq.length, geoApiDepartmentFeatures: department.features.length, exactPostcodeQueries: queryReceipts.length, excludedSamePrefixTerritories: csv.excluded },
    scope: { publishedPostalCodes: postalCodes, publishedGeometries: features.length, territoryCoverageClaimed: true, officialPostalBoundaryClaimed: false, sharedSurfaceGroups, multiCommuneGroups, multiLine5Groups },
    geometry: { polygonFeatures: features.filter(item => item.geometry.type === 'Polygon').length, multiPolygonFeatures: features.filter(item => item.geometry.type === 'MultiPolygon').length, positions, rings, allTurfValid: true, allJstsValid: true, allRingsClosed: true, allCoordinatesWithinMartiniqueBounds: true, maxResponsePositions: Math.max(...queryReceipts.map(item => item.positions)), transformations: ['windows-1252-decode', 'exact-postcode-to-INSEE-equality-join', 'preserve-multiple-commune-features-without-union', 'copy-matching-commune-geometry-without-coordinate-modification', 'sort-by-postal-code-then-INSEE'], geometricModification: false, provenance: 'derived', confidence: CONFIDENCE },
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
  const outputDirectory = resolve(process.argv[3] ?? join(ROOT, 'data/postal_country_packs/mq/postal-context/m2'));
  const reportPath = process.argv[4] ? resolve(process.argv[4]) : undefined;
  console.log(JSON.stringify(build({ sourceDirectory, outputDirectory, reportPath }), null, 2));
}

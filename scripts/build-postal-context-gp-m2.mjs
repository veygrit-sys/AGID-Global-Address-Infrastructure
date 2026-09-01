import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import area from '@turf/area';
import booleanValid from '@turf/boolean-valid';
import jsts from 'jsts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_ID = 'gp-laposte-geoapi-20260901';
const RELEASE_INSTANT = '2026-09-01T04:04:46.227Z';
const SOURCE_DATE = '2026-08-08';
const VALID_FROM = `${SOURCE_DATE}T00:00:00.000Z`;
const LICENSE_ID = 'etalab-open-licence-2.0';
const CONFIDENCE = 0.90;
const MAX_RESPONSE_POSITIONS = 20_000;
const BASE_RECEIPTS = {
  'laposte-dataset-metadata.json': ['b5d6b5dcb421ece75d41b5903ded715a88df97ff1b4fa1f070e9fa7535167d65', 11203],
  'laposte-datagouv-metadata.json': ['c42a15c49ea9591e66270d0a6dad43e2b947c8e29a9013466f03ddd9514d6b08', 8388],
  'laposte-hexasmal.csv': ['f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22', 1555485],
  'geoapi-971-communes.geojson': ['b307845f32aa358bad7df3b2219e3029329748598aa02e52d47656da98ab26db', 914218],
  'geoapi-communes-doc.html': ['c05f57f48ae4b3adacacf868ed5814ce6152f839c80082c5edeb0571ee0884f4', 89716],
  'etalab-open-licence.html': ['86a7ee68dd19febfe782f8f3081ade6eedd8911044d6784355fa13ac456100f2', 81769],
  'insee-guadeloupe-971.html': ['0c331ecfc4f70632d09da63d70f13bac9717df52d324ecd31ee0698a16804ad4', 55725],
};
const POSTCODE_RECEIPTS = {
  '97100': ['29e6193224cb64dab1bbe0c149d4121c715ed6b3168d20c95aed857084ed2f45', 6716],
  '97110': ['6e858aad046845ca474174cf5e10aeae441175ef702066908326d56bdcd6a87c', 13360],
  '97111': ['233d0830047a272a55c461e93f4dd1b751f2e27c1d4d1dc341537c9cfab8fca5', 34762],
  '97112': ['1c73a46c75315cf52f2d8ad74a5412d72ce0a75bbf07c62746affd5fdf8ece1b', 25257],
  '97113': ['20b7f68820d0f0e9d4406d8303bc8e405a5f416a9fab0f88021686051786e873', 19772],
  '97114': ['0b20d81d57365f94659f80ec86e87535d31dd736c0f2d1d35d7012b699f09dbb', 22747],
  '97115': ['f912d8dafb9509b6640740207d753c3c26ad29e21c84c0131ea08ba0e6be1914', 55930],
  '97116': ['b53354c595b66bea04b8bd2afdeb31cfad158d04089884e25b993a368dd8edc3', 24722],
  '97117': ['6e4e2c49c4680ae56192ab1d534c9b2da6cbb273085bbb65071ba5289d695bd9', 19214],
  '97118': ['015910fe783a95b4f47695c354f64d066efc5b3b9f559f287cd966d55eaaa388', 42875],
  '97119': ['f8c0350f09b390fa7a061862ad08d27da344fb78faf720abe14d86ccbe2307cd', 24042],
  '97120': ['163e7fc3369fd7110c36092ea845b30683c3b99db0eae024858196cd57f03e23', 23870],
  '97121': ['22aafccd62b8552cc25b3c9190d2f94ef603ea52ee01d1d9242540d40d07c8d9', 42101],
  '97122': ['15c1a36170015a2746323efd27cccd59b2f2838d21fe7fd16d641016a4ce8fb6', 48432],
  '97123': ['e77bcad62db5c41e0c742a6ba5d18bf4f7044309fdcfc29107bb5bfdd4d3d2af', 21232],
  '97125': ['2f771fec8f2e129dad2b0ff9b7cc86e98f9582854eb9fd340a12539dad322133', 23784],
  '97126': ['5b99e711483207aec80e35725190a93ade4155f60a50e1b83ea1eeb6d46ead17', 23617],
  '97127': ['c4805494f69718a6a57f81909274cc9cec681cb830aaaa58c3f2cc59384189f6', 45029],
  '97128': ['ab7b8854104d4c5d5a35127e62649e1b9bfb163a16da148dea61199075696f6e', 24494],
  '97129': ['a2e6a2dfa9b2810b8b4f9ab184ffecf046e283a2248549f8741212314b82c24d', 37021],
  '97130': ['89eeec5d3db6787d13d3e6846969f997b8d7a2e6ddab332d26b749c6474e8622', 32076],
  '97131': ['79f3dd2193d2326a43fa012aec8d36ab4683b2981017c7e4c0f5ab72cc7f662b', 30556],
  '97134': ['bd8d5874755f195dfe0504d913318cbf5dc5740bad1489928875ec59f72e5a51', 32533],
  '97136': ['3b3e7312cde103fe6bb6c1d918670a743b30c15f7204620a0ec95a7198047a26', 12338],
  '97137': ['99fa63781fda4a17c981c749b631bdbde27661bb2a63bb23098601a2f002c69a', 30736],
  '97139': ['ddf1335a335e7fdb3795a3df6286a3ccd05739a2a2f93491a9e45becd01df961', 31826],
  '97140': ['b4b7ee7ba93bdf86b59180d5c3df055bd5cda0e68b0ed9f3087b0d5e8a5c8928', 24902],
  '97141': ['e676f904202313e229c7cc6062f0468932e7e85fd56d5594176a13d0159c8c0a', 8879],
  '97142': ['ddf1335a335e7fdb3795a3df6286a3ccd05739a2a2f93491a9e45becd01df961', 31826],
  '97160': ['c0e9760924412646602bf93796b1be47960db086934fe1e4447203ef8e4f43b2', 40959],
  '97170': ['fbd592401fa25df38cd604e0c5802d829a72b5189e06f52ebf7f32050e364067', 40306],
  '97180': ['b927908483470577585b8ac8dbfd028abf3a80029d66d758d6673fc6e86b3527', 23322],
  '97190': ['dec52a96a33fc74108dcf561093a3e83b58c26a2cdee2354cc11f6480227f9f4', 28079],
};
const EXPECTED = [
  ['97100', '97105', 'BASSE TERRE', ['']], ['97110', '97120', 'POINTE A PITRE', ['']],
  ['97111', '97116', 'MORNE A L EAU', ['']], ['97112', '97112', 'GRAND BOURG', ['']],
  ['97113', '97109', 'GOURBEYRE', ['']], ['97114', '97132', 'TROIS RIVIERES', ['']],
  ['97115', '97129', 'STE ROSE', ['']], ['97116', '97121', 'POINTE NOIRE', ['']],
  ['97117', '97122', 'PORT LOUIS', ['']], ['97118', '97125', 'ST FRANCOIS', ['']],
  ['97119', '97134', 'VIEUX HABITANTS', ['']], ['97120', '97124', 'ST CLAUDE', ['']],
  ['97121', '97102', 'ANSE BERTRAND', ['']], ['97122', '97103', 'BAIE MAHAULT', ['']],
  ['97123', '97104', 'BAILLIF', ['']], ['97125', '97106', 'BOUILLANTE', ['', 'PIGEON']],
  ['97126', '97111', 'DESHAIES', ['']], ['97127', '97110', 'LA DESIRADE', ['']],
  ['97128', '97114', 'GOYAVE', ['']], ['97129', '97115', 'LAMENTIN', ['']],
  ['97130', '97107', 'CAPESTERRE BELLE EAU', ['', 'BANANIER', 'STE MARIE']],
  ['97131', '97119', 'PETIT CANAL', ['', 'LES MANGLES']], ['97134', '97126', 'ST LOUIS', ['']],
  ['97136', '97130', 'TERRE DE BAS', ['']], ['97137', '97131', 'TERRE DE HAUT', ['']],
  ['97139', '97101', 'LES ABYMES', ['']], ['97140', '97108', 'CAPESTERRE DE MARIE GALANTE', ['']],
  ['97141', '97133', 'VIEUX FORT', ['']], ['97142', '97101', 'LES ABYMES', ['']],
  ['97160', '97117', 'LE MOULE', ['']], ['97170', '97118', 'PETIT BOURG', ['']],
  ['97180', '97128', 'STE ANNE', ['', 'DOUVILLE']], ['97190', '97113', 'LE GOSIER', ['']],
].map(([postalCode, insee, routingLabel, line5]) => ({ postalCode, insee, routingLabel, line5 }));

function fail(message) { throw new Error(`gp-m2-${message}`); }
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
  const gpRows = rows.filter(row => /^971\d{2}$/u.test(row.insee));
  const excluded = rows.filter(row => /^971\d{2}$/u.test(row.postalCode) && !/^971\d{2}$/u.test(row.insee))
    .map(row => ({ postalCode: row.postalCode, insee: row.insee })).sort((a, b) => a.postalCode.localeCompare(b.postalCode));
  if (gpRows.length !== 38 || new Set(gpRows.map(row => row.postalCode)).size !== 33 || new Set(gpRows.map(row => row.insee)).size !== 32) fail('csv-gp-denominator');
  if (canonicalJson(excluded) !== canonicalJson([{ postalCode: '97133', insee: '97701' }, { postalCode: '97150', insee: '97801' }])) fail('csv-territory-exclusions');
  const gp = EXPECTED.map(expected => {
    const matches = gpRows.filter(row => row.postalCode === expected.postalCode);
    const line5 = [...new Set(matches.map(row => row.line5))].sort();
    if (!matches.length || matches.some(row => row.insee !== expected.insee || row.routingLabel !== expected.routingLabel)
      || canonicalJson(line5) !== canonicalJson(expected.line5)) fail(`csv-identity-${expected.postalCode}`);
    return { postalCode: expected.postalCode, insee: expected.insee, routingLabel: expected.routingLabel, line5 };
  });
  return { rows, gpRows, gp, excluded };
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
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -63 || longitude > -60 || latitude < 15 || latitude > 18) fail(`geometry-range-${code}`);
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
  if (department.type !== 'FeatureCollection' || department.features.length !== 32) fail('department-cardinality');
  const inseeHtml = receipts[6].bytes.toString('utf8');
  if (!/Code Officiel Géographique au 1er janvier 2026/u.test(inseeHtml)
    || !/Guadeloupe est 971/u.test(inseeHtml)
    || !/Liste des 32[\s\S]{0,500}niveau-COM/u.test(inseeHtml)) fail('insee-cog');
  const docsHtml = receipts[4].bytes.toString('utf8');
  if (!/code postal/iu.test(docsHtml) || !/geometry=contour/iu.test(docsHtml) || !/GeoJSON/iu.test(docsHtml)) fail('geoapi-doc');
  const licenceHtml = receipts[5].bytes.toString('utf8');
  if (!/Licence Ouverte/iu.test(licenceHtml) || !/réutilis/iu.test(licenceHtml) || !/date/iu.test(licenceHtml)) fail('licence-contract');
  const communes = new Map();
  for (const feature of department.features) {
    const code = feature.properties?.code;
    if (!/^971\d{2}$/.test(code) || communes.has(code)) fail(`department-identity-${code}`);
    const checks = inspectGeometry(feature.geometry, code);
    communes.set(code, { ...feature, checks });
  }
  if (canonicalJson([...communes.keys()].sort()) !== canonicalJson([...new Set(csv.gp.map(row => row.insee))].sort())) fail('department-code-set');
  const expectedPostcodeFiles = Object.keys(POSTCODE_RECEIPTS).map(code => `${code}.geojson`).sort();
  if (canonicalJson(readdirSync(join(sourceDirectory, 'postal-codes')).sort()) !== canonicalJson(expectedPostcodeFiles)) fail('postcode-file-set');
  const queryReceipts = csv.gp.map(row => {
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
    sourceId: 'gp-la-poste-hexasmal-20260808', sourceType: 'official', assignmentAuthority: 'official_postal_operator',
    geometryAuthority: 'none', sourceVersion: 'Base officielle des codes postaux / resource 008a2dda-2c60-4b63-b910-998f6f818089',
    sourceDate: SOURCE_DATE, licenseId: LICENSE_ID, digest: `sha256:${BASE_RECEIPTS['laposte-hexasmal.csv'][0]}`,
  };
  const adminSource = {
    sourceId: 'gp-geo-api-gouv-971-communes-20260901', sourceType: 'official', assignmentAuthority: 'none',
    geometryAuthority: 'official_mapping_geometry', sourceVersion: 'COG 2026 Guadeloupe department 971; 32 commune contours',
    sourceDate: '2026-01-01', licenseId: LICENSE_ID, digest: `sha256:${BASE_RECEIPTS['geoapi-971-communes.geojson'][0]}`,
  };
  const derivedSource = {
    sourceId: 'gp-postcode-commune-display-surfaces-20260901', sourceType: 'derived',
    assignmentAuthority: 'official_postal_operator', geometryAuthority: 'official_mapping_geometry',
    sourceVersion: '33 exact La Poste postcode-to-INSEE joins; one shared-commune postcode pair retains identical commune geometry and four multi-Ligne-5 postcode groups retain one whole-commune surface without modification',
    sourceDate: SOURCE_DATE, licenseId: LICENSE_ID,
    digest: sha256(Buffer.from(canonicalJson({ assignment: assignmentSource.digest, geometry: adminSource.digest, queries: queryReceipts.map(item => item.digest) }), 'utf8')),
  };
  const validTime = { from: VALID_FROM, to: null }; const knownTime = { from: RELEASE_INSTANT, to: null };
  const countryNode = { id: 'country-gp', kind: 'administrative_area', featureKind: 'country', geometryType: 'none', countryCode: 'GP', label: 'Guadeloupe', visibility: 'public' };
  const administrativeNodes = [...communes.values()].sort((a, b) => a.properties.code.localeCompare(b.properties.code)).map(feature => ({
    id: `administrative-gp-${feature.properties.code}`, kind: 'administrative_area', featureKind: 'administrative',
    geometryType: feature.geometry.type.toLowerCase(), countryCode: 'GP', label: feature.properties.nom, visibility: 'public',
  }));
  const postalNodes = csv.gp.map(row => ({
    id: `postal-gp-${row.postalCode}`, kind: 'postal_feature', featureKind: 'standard_area',
    geometryType: communes.get(row.insee).geometry.type.toLowerCase(), countryCode: 'GP', postalCode: row.postalCode,
    label: `${row.postalCode} ${row.routingLabel}${row.line5.filter(Boolean).length ? ` (${row.line5.filter(Boolean).join(', ')})` : ''} — derived commune display surface`, visibility: 'public',
  }));
  const assertions = [
    ...csv.gp.map(row => ({ id: `laposte-gp-20260808-${row.postalCode}-assigned-${row.insee}`, fromNodeId: `administrative-gp-${row.insee}`, toNodeId: `postal-gp-${row.postalCode}`, relation: 'postal_assigned', validTime, knownTime, source: assignmentSource, method: 'official_crosswalk', quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT } })),
    ...[...communes.keys()].sort().map(code => ({ id: `geo-api-gp-20260901-${code}-part-of-gp`, fromNodeId: `administrative-gp-${code}`, toNodeId: countryNode.id, relation: 'part_of', validTime, knownTime, source: adminSource, method: 'source_relation', quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT } })),
  ];
  const features = csv.gp.map(row => ({
    id: `gp-derived-${row.postalCode}`, nodeId: `postal-gp-${row.postalCode}`, role: 'postal_area', publicationClass: 'public_context',
    geometry: communes.get(row.insee).geometry, source: derivedSource, validTime, knownTime,
    quality: { status: 'derived', confidence: CONFIDENCE, validatedAt: RELEASE_INSTANT },
  }));
  const positions = csv.gp.reduce((sum, row) => sum + communes.get(row.insee).checks.positions, 0);
  const rings = csv.gp.reduce((sum, row) => sum + communes.get(row.insee).checks.rings, 0);
  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, { schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'GP', releaseId: RELEASE_ID, features });
  const graphRelease = { schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-gp-laposte-geoapi', repositoryUrl: 'https://github.com/veygrit-sys/Address-Grid-ID', countryCode: 'GP', releaseId: RELEASE_ID, policyVersion: 'gp-current-derived-commune-display-v1', releasedAt: RELEASE_INSTANT, validTime, manifestDigest: `sha256:${'0'.repeat(64)}`, artifacts: [{ path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json', digest: geometryArtifact.digest, byteLength: geometryArtifact.byteLength, recordCount: features.length, licenseRefs: [LICENSE_ID] }] };
  const { manifestDigest: _placeholder, ...manifestPayload } = graphRelease;
  graphRelease.manifestDigest = sha256(Buffer.from(canonicalJson(manifestPayload), 'utf8'));
  const graphPath = join(outputDirectory, 'graph.json');
  const graphArtifact = writeJson(graphPath, { schemaVersion: 'postal-context-graph/v0.1', release: graphRelease, nodes: [countryNode, ...administrativeNodes, ...postalNodes], assertions });
  const descriptorPath = join(outputDirectory, 'descriptor.json');
  const descriptorArtifact = writeJson(descriptorPath, { schemaVersion: 'postal-context-pack-descriptor/v0.1', repositoryId: graphRelease.repositoryId, countryCode: 'GP', releaseId: RELEASE_ID, policyVersion: graphRelease.policyVersion, sequence: 1, previousDescriptorDigest: null, graphManifestDigest: graphRelease.manifestDigest, createdAt: RELEASE_INSTANT, maturity: 'M2_experimental', synthetic: false, promotionEligible: true, containsResidentialAddressPoints: false, artifacts: [
    { role: 'graph', path: basename(graphPath), mediaType: 'application/vnd.agid.postal-context-graph+json', schemaVersion: 'postal-context-graph/v0.1', byteLength: graphArtifact.byteLength, digest: graphArtifact.digest, recordCounts: { nodes: 66, assertions: 65 } },
    { role: 'geometry', path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json', schemaVersion: 'postal-context-geometry/v0.1', byteLength: geometryArtifact.byteLength, digest: geometryArtifact.digest, recordCounts: { features: 33, positions } },
  ] });
  const sharedSurfaceGroups = [...communes.values()].filter(feature => feature.properties.codesPostaux.length > 1).map(feature => ({ insee: feature.properties.code, commune: feature.properties.nom, postalCodes: feature.properties.codesPostaux.slice().sort() }));
  const report = {
    schemaVersion: 'postal-context-gp-m2-build/v1', countryCode: 'GP', generatedAt: RELEASE_INSTANT, releaseId: RELEASE_ID,
    evidence: { exactBodies: receipts.length, exactBytes: receipts.reduce((sum, item) => sum + item.byteLength, 0), receipts: receipts.map(item => ({ path: relative(sourceDirectory, item.path).replaceAll('\\', '/'), digest: item.digest, byteLength: item.byteLength })) },
    denominator: { officialRows: csv.rows.length, gpRows: csv.gpRows.length, distinctPostalCodes: 33, distinctCommuneCodes: 32, geoApiDepartmentFeatures: 32, exactPostcodeQueries: 33, excludedSamePrefixTerritories: csv.excluded },
    scope: { publishedPostalCodes: csv.gp.map(row => row.postalCode), publishedGeometries: 33, territoryCoverageClaimed: true, officialPostalBoundaryClaimed: false, sharedSurfaceGroups },
    geometry: { polygonFeatures: features.filter(item => item.geometry.type === 'Polygon').length, multiPolygonFeatures: features.filter(item => item.geometry.type === 'MultiPolygon').length, positions, rings, allTurfValid: true, allJstsValid: true, allRingsClosed: true, allCoordinatesWithinGuadeloupeBounds: true, maxResponsePositions: Math.max(...[...communes.values()].map(item => item.checks.positions)), transformations: ['windows-1252-decode', 'exact-postcode-to-INSEE-equality-join', 'copy-matching-commune-geometry-without-coordinate-modification', 'sort-by-postal-code'], geometricModification: false, provenance: 'derived', confidence: CONFIDENCE },
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
  const outputDirectory = resolve(process.argv[3] ?? join(ROOT, 'data/postal_country_packs/gp/postal-context/m2'));
  const reportPath = process.argv[4] ? resolve(process.argv[4]) : undefined;
  console.log(JSON.stringify(build({ sourceDirectory, outputDirectory, reportPath }), null, 2));
}

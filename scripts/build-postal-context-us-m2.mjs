import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_ID = 'us-census-zcta-10001-validation-20260902';
const RELEASE_INSTANT = '2026-09-02T11:00:00.000Z';
const DATASET_DATE = '2020-01-01';
const AGID_CELL_ID = 'USARPV8JCJET';
const LICENSE_ID = 'us-census-public-use-attribution';
const EXPECTED_BOUNDS = [-74.00994700020514, 40.74345100004846, -73.98407599972285, 40.75968600024119];
const EXPECTED = {
  'census-service.json': '50c30be03cffa1bf5de3179fee69f96b349e7c7f7f2f55bcacf3fcdda12b0335',
  'census-zcta-layer.json': '6b25dded7b9537c0807c06f335bb6bf33d2d9e7a1ebe20577d1d65ac9ebbcc7b',
  'census-zcta-object-ids.json': 'aa6579f1b50e43d8177581fbed88739be39cc0ba710489b366d79fdd127c6452',
  'census-zcta-10001.geojson': 'bb16b0907fe2b43a9cbe045d10e0b7518e5218a39d904df5c1567d54fc704a58',
  'census-citation.html': '0d89de0717ac7042df431a78f69925397e4fc4a0ca58dcf0de7e1412331d940b',
  'zcta-guidance.html': '8c6d8c579ea0d4f61daa21193cb2b94e6922ac1cf0ee94fec438ad768b54a19c',
  'postalpro-city-state.html': '186b8456c67705b260c4e2db5ed8aaa9fce75dcef9537e9761d4658ac74939e5',
  'postalpro-license.html': 'cccd26cd306018465243dcf2206e8c87aa07dd48d90955fbe4d4631b3098765d',
  'LIC001_03.pdf': '16c3a28f2c16062551cc33917a7d858a9bfa6b4535a882751064c273d0ddba68',
  'postal-101-zip-codes.pdf': 'a02b611d3d1896d90fa02e4c22c1244af86d0517b1855fd15b6cb4f0aae6ba24',
  'pub28.pdf': '9a46a66b43c2f26f0f732038f5d20ef70400fdf755b91a87a51164a5dfbb4db6',
};
const SOURCE_PAGES = {
  'census-service.json': 'https://tigerweb.geo.census.gov/arcgis/rest/services/Census2020/PUMA_TAD_TAZ_UGA_ZCTA/MapServer?f=pjson',
  'census-zcta-layer.json': 'https://tigerweb.geo.census.gov/arcgis/rest/services/Census2020/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/2?f=pjson',
  'census-zcta-object-ids.json': 'https://tigerweb.geo.census.gov/arcgis/rest/services/Census2020/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/2/query?where=1%3D1&returnIdsOnly=true&f=json',
  'census-zcta-10001.geojson': "https://tigerweb.geo.census.gov/arcgis/rest/services/Census2020/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/2/query?where=ZCTA5%3D%2710001%27&outFields=*&returnGeometry=true&f=geojson",
  'census-citation.html': 'https://www.census.gov/about/policies/citation.html',
  'zcta-guidance.html': 'https://www.census.gov/programs-surveys/geography/guidance/geo-areas/zctas.html',
  'postalpro-city-state.html': 'https://postalpro.usps.com/address-quality/city-state-product',
  'postalpro-license.html': 'https://postalpro.usps.com/address-quality/city-state-product',
  'LIC001_03.pdf': 'https://postalpro.usps.com/address-quality/city-state-product',
  'postal-101-zip-codes.pdf': 'https://about.usps.com/what/business-services/delivery-growth-management/assets/pdf/postal-101-zip-codes.pdf',
  'pub28.pdf': 'https://pe.usps.com/cpim/ftp/pubs/Pub28/pub28.pdf',
};

function fail(message) { throw new Error(`us-m2-${message}`); }
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
function parseJson(bytes, name) {
  try { return JSON.parse(bytes.toString('utf8')); } catch { fail(`invalid-json-${name}`); }
}
function ringArea(ring) {
  let sum = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    sum += ring[index][0] * ring[index + 1][1] - ring[index + 1][0] * ring[index][1];
  }
  return sum / 2;
}
function inspectGeometry(geometry) {
  if (geometry?.type !== 'Polygon' || !Array.isArray(geometry.coordinates)) fail('geometry-type');
  let positions = 0;
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  for (const ring of geometry.coordinates) {
    if (!Array.isArray(ring) || ring.length < 4 || !same(ring[0], ring.at(-1))) fail('geometry-ring');
    if (Math.abs(ringArea(ring)) < 1e-14) fail('geometry-zero-area-ring');
    positions += ring.length;
    for (const position of ring) {
      if (!Array.isArray(position) || position.length < 2 || !position.slice(0, 2).every(Number.isFinite)) fail('geometry-position');
      const [longitude, latitude] = position;
      if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) fail('geometry-range');
      bounds[0] = Math.min(bounds[0], longitude); bounds[1] = Math.min(bounds[1], latitude);
      bounds[2] = Math.max(bounds[2], longitude); bounds[3] = Math.max(bounds[3], latitude);
    }
  }
  if (geometry.coordinates.length !== 3 || positions !== 124 || !same(bounds, EXPECTED_BOUNDS)) {
    fail(`geometry-structure-${geometry.coordinates.length}-${positions}-${canonicalJson(bounds)}`);
  }
  return { type: geometry.type, parts: 1, rings: geometry.coordinates.length, positions, bounds, closedRings: 3, structuralValidity: true };
}

function build({ sourceDirectory, outputDirectory, reportPath }) {
  const receipts = Object.fromEntries(Object.keys(EXPECTED).map(name => [name, readExact(sourceDirectory, name)]));
  const service = parseJson(receipts['census-service.json'], 'service');
  const layer = parseJson(receipts['census-zcta-layer.json'], 'layer');
  const objectIds = parseJson(receipts['census-zcta-object-ids.json'], 'object-ids');
  const source = parseJson(receipts['census-zcta-10001.geojson'], 'zcta-10001');
  if (layer.id !== 2 || layer.name !== 'ZIP Code Tabulation Areas'
    || layer.description !== 'ZIP Code Tabulation Areas; January 1, 2020 vintage'
    || layer.geometryType !== 'esriGeometryPolygon' || layer.copyrightText !== 'Source: U.S. Census Bureau') fail('layer-contract');
  if (!service.serviceDescription?.includes('ZIP Code Tabulation Areas')) fail('service-contract');
  if (!Array.isArray(objectIds.objectIds) || objectIds.objectIds.length !== 33791) fail('national-denominator');
  if (source.type !== 'FeatureCollection' || source.features?.length !== 1) fail('sample-count');
  const feature = source.features[0];
  const p = feature.properties;
  if (p.ZCTA5 !== '10001' || p.GEOID !== '10001' || Number(p.POP100) !== 32612 || Number(p.HU100) !== 18926
    || Number(p.AREALAND) !== 1615692 || Number(p.AREAWATER) !== 0 || Number(p.OBJECTID) !== 26939) fail('sample-attributes');
  const geometryCheck = inspectGeometry(feature.geometry);
  const guidance = receipts['zcta-guidance.html'].toString('utf8');
  if (!/ZIP Code Tabulation Areas/iu.test(guidance) || !/not all valid ZIP Codes/iu.test(guidance)) fail('zcta-semantics');

  const validTime = { from: `${DATASET_DATE}T00:00:00.000Z`, to: null };
  const knownTime = { from: RELEASE_INSTANT, to: null };
  const censusSource = {
    sourceId: 'us-census-tigerweb-zcta-2020-fixed-validation', sourceType: 'derived',
    assignmentAuthority: 'derived_spatial_assignment', geometryAuthority: 'official_mapping_geometry',
    sourceVersion: 'TIGERweb layer 2; January 1, 2020 vintage; fixed OBJECTID 26939 receipt',
    sourceDate: DATASET_DATE, licenseId: LICENSE_ID, digest: `sha256:${EXPECTED['census-zcta-10001.geojson']}`,
  };
  const derivedSource = {
    sourceId: 'agid-zcta-centroid-cell-crosswalk-v1', sourceType: 'derived',
    assignmentAuthority: 'derived_spatial_assignment', geometryAuthority: 'none',
    sourceVersion: 'AGID cubed-sphere Hilbert encoder; Census INTPT 40.7506496,-73.9972929',
    sourceDate: DATASET_DATE, licenseId: LICENSE_ID, digest: `sha256:${EXPECTED['census-zcta-10001.geojson']}`,
  };
  const postalNodeId = 'postal-us-census-zcta-10001';
  const nodes = [
    { id: 'country-us', kind: 'administrative_area', featureKind: 'country', geometryType: 'none', countryCode: 'US', label: 'United States', visibility: 'public' },
    { id: postalNodeId, kind: 'postal_feature', featureKind: 'standard_area', geometryType: 'polygon', countryCode: 'US', postalCode: '10001',
      label: '2020 Census ZCTA 10001 · population 32,612 · housing 18,926 · land 1.62 km² · water 0.00 km²', visibility: 'public' },
    { id: 'agid-us-census-zcta-10001-centroid', kind: 'agid_cell', featureKind: 'unknown', geometryType: 'none', countryCode: 'US',
      label: 'AGID centroid cell for Census ZCTA 10001 (derived crosswalk)', agidCellId: AGID_CELL_ID, visibility: 'public' },
  ];
  const assertions = [
    { id: 'census-us-zcta-2020-10001-part-of-us', fromNodeId: postalNodeId, toNodeId: 'country-us', relation: 'admin_within', validTime, knownTime,
      source: censusSource, method: 'geometry_contains', quality: { status: 'verified', confidence: 0.9, validatedAt: RELEASE_INSTANT }, purposes: ['display', 'validation'] },
    { id: 'census-us-zcta-2020-10001-centroid-agid-crosswalk', fromNodeId: postalNodeId, toNodeId: 'agid-us-census-zcta-10001-centroid', relation: 'covered_by_agid', validTime, knownTime,
      source: derivedSource, method: 'derived', quality: { status: 'derived', confidence: 0.8, validatedAt: RELEASE_INSTANT }, purposes: ['display', 'validation'] },
  ];
  const geometryFeatures = [{
    id: 'census-us-zcta-2020-10001', nodeId: postalNodeId, role: 'postal_area', publicationClass: 'public_context', geometry: feature.geometry,
    source: censusSource, validTime, knownTime, quality: { status: 'derived', confidence: 0.9, validatedAt: RELEASE_INSTANT },
  }];
  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, { schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'US', releaseId: RELEASE_ID, features: geometryFeatures });
  const graphRelease = {
    schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-us-census-zcta-validation',
    repositoryUrl: 'https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure', countryCode: 'US', releaseId: RELEASE_ID,
    policyVersion: 'united-states-census-zcta-derived-validation-v1', releasedAt: RELEASE_INSTANT, validTime,
    manifestDigest: `sha256:${'0'.repeat(64)}`, artifacts: [{ path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json',
      digest: geometryArtifact.digest, byteLength: geometryArtifact.byteLength, recordCount: 1, licenseRefs: [LICENSE_ID] }],
  };
  const { manifestDigest: _placeholder, ...manifestPayload } = graphRelease;
  graphRelease.manifestDigest = sha256(Buffer.from(canonicalJson(manifestPayload), 'utf8'));
  const graphPath = join(outputDirectory, 'graph.json');
  const graphArtifact = writeJson(graphPath, { schemaVersion: 'postal-context-graph/v0.1', release: graphRelease, nodes, assertions });
  const descriptorPath = join(outputDirectory, 'descriptor.json');
  const descriptorArtifact = writeJson(descriptorPath, {
    schemaVersion: 'postal-context-pack-descriptor/v0.1', repositoryId: graphRelease.repositoryId, countryCode: 'US', releaseId: RELEASE_ID,
    policyVersion: graphRelease.policyVersion, sequence: 1, previousDescriptorDigest: null, graphManifestDigest: graphRelease.manifestDigest,
    createdAt: RELEASE_INSTANT, maturity: 'M2_experimental', synthetic: false, promotionEligible: false, containsResidentialAddressPoints: false,
    artifacts: [
      { role: 'graph', path: basename(graphPath), mediaType: 'application/vnd.agid.postal-context-graph+json', schemaVersion: 'postal-context-graph/v0.1',
        byteLength: graphArtifact.byteLength, digest: graphArtifact.digest, recordCounts: { nodes: nodes.length, assertions: assertions.length } },
      { role: 'geometry', path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json', schemaVersion: 'postal-context-geometry/v0.1',
        byteLength: geometryArtifact.byteLength, digest: geometryArtifact.digest, recordCounts: { features: 1, positions: geometryCheck.positions } },
    ],
  });
  const sourceReceipts = Object.entries(receipts).map(([name, bytes]) => ({
    name, sourcePageUrl: SOURCE_PAGES[name], retrievedAt: '2026-09-02T10:58:00.504Z', bytes: bytes.length, digest: sha256(bytes),
  }));
  const report = {
    schemaVersion: 'postal-context-us-zcta-validation-build/v1', countryCode: 'US', generatedAt: RELEASE_INSTANT, releaseId: RELEASE_ID,
    result: 'blocked-complete-current-usps-assignment-denominator-unavailable-one-real-zcta-validation-sample-published',
    input: { exactReceipts: sourceReceipts, censusLayer: { id: layer.id, name: layer.name, description: layer.description, copyrightText: layer.copyrightText } },
    scope: { nationalCensusObjectIdDenominator: objectIds.objectIds.length, publishedValidationSamples: 1, publishedPostalCodes: ['10001'],
      completeCurrentUspsAssignmentRecords: 0, m2QualifiedRecords: 0, currentUspsAssignmentCompletenessClaimed: false,
      officialPostalBoundaryClaimed: false, scopeStatement: 'One coordinate-preserving 2020 Census ZCTA sample validates the real-data API/UI/ID path; it is not a complete current USPS assignment or boundary dataset.' },
    detail: { postalContextId: postalNodeId, geometryFeatureId: geometryFeatures[0].id, countryId: 'country-us', agidNodeId: nodes[2].id,
      agidCellId: AGID_CELL_ID, assertionIds: assertions.map(item => item.id), population: p.POP100, housing: p.HU100,
      landSquareMeters: p.AREALAND, waterSquareMeters: p.AREAWATER, internalPoint: [Number(p.INTPTLON), Number(p.INTPTLAT)] },
    geometry: { ...geometryCheck, transformations: ['verify-exact-source-digest', 'coordinate-preserving-copy', 'canonical-JSON-serialization'],
      geometricModification: false, provenance: 'derived', confidence: 0.9 },
    policy: { officialPostalAssignment: false, officialPostalGeometry: false, officialCensusMappingGeometry: true, outputProvenance: 'derived',
      promotionEligible: false, uspsLicensedRowsPublished: 0, inventedAreaRowsPublished: 0,
      addressBuildingParcelRecipientCustomerOrLandRightsRowsPublished: 0 },
    artifacts: { graph: graphArtifact, geometry: geometryArtifact, descriptor: descriptorArtifact },
  };
  if (reportPath) writeJson(reportPath, report, true);
  return report;
}

export { build, inspectGeometry };
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) fail('usage-source-directory-required');
  const outputDirectory = resolve(process.argv[3] ?? join(ROOT, 'data/postal_country_packs/us/postal-context/m2'));
  const reportPath = process.argv[4] ? resolve(process.argv[4]) : undefined;
  console.log(JSON.stringify(build({ sourceDirectory: resolve(process.argv[2]), outputDirectory, reportPath }), null, 2));
}

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import area from '@turf/area';
import bbox from '@turf/bbox';
import booleanValid from '@turf/boolean-valid';
import jsts from 'jsts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_ID = 'pr-census-zcta-2020-20260902';
const RELEASE_INSTANT = '2026-09-02T01:30:00.000Z';
const DATASET_DATE = '2020-01-01';
const LICENSE_ID = 'us-census-public-use-attribution';
const EXPECTED_BOUNDS = [-67.95179799957432, 17.910816999983286, -65.2210270004101, 18.51870700012846];
const EXPECTED = {
  'AREA_DIST_ZIP_3.TXT': '4c0bda79a140b1c9077ff91f7ae92b976a873793b0e847078d130223b3cc4ab4',
  'LIC001_03.pdf': '16c3a28f2c16062551cc33917a7d858a9bfa6b4535a882751064c273d0ddba68',
  'postalpro-area.html': 'd3f9c5a6fd288c85f2b04a128dfc640bc2e73b03d2ffb048dad8e0b5c9466f88',
  'postalpro-license.html': 'cccd26cd306018465243dcf2206e8c87aa07dd48d90955fbe4d4631b3098765d',
  'postalpro-ais.html': '3c74caaa20d04eedd0f6e0e26d1ddf9eec4f2c598a7bbafe63eba579d68c7f2f',
  'pub28.pdf': '9a46a66b43c2f26f0f732038f5d20ef70400fdf755b91a87a51164a5dfbb4db6',
  'zcta-guidance.html': '77c4e4fe231f15c90bab31efcc745dd4427c5f33f31b279978d6ba814443b9a6',
  'tigerweb-service.json': 'd3b0572a8b392ca4f9a5754811a749521025b31faceec86bce71cd7105c0d268',
  'tigerweb-zcta-layer.json': '49a543f4dab89a79318cea1362edfc8fbb855527060a23c82d0f230c6ecf7655',
  'census-citation.html': '49545cc525bf00a275b482069134a08f866cbe29f5800b44d3f2567c63bbc46f',
  'pr-zcta-current.geojson': '0438e99e895e732299d76ba85c2d7a0727a22ffa79f5ea886d1317ba13c20d31',
};
function fail(message) { throw new Error('pr-m2-' + message); }
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
function inspectGeometry(features) {
  let parts = 0, rings = 0, positions = 0;
  for (const feature of features) {
    if (!['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)) fail('geometry-type');
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    parts += polygons.length;
    for (const polygon of polygons) {
      if (!Array.isArray(polygon) || polygon.length < 1) fail('geometry-polygon');
      for (const ring of polygon) {
        rings += 1;
        positions += ring.length;
        if (ring.length < 4 || !same(ring[0], ring.at(-1))) fail('geometry-ring');
        for (const position of ring) {
          const [longitude, latitude] = position;
          if (!Array.isArray(position) || !Number.isFinite(longitude) || !Number.isFinite(latitude)
            || longitude < -68.1 || longitude > -65.0 || latitude < 17.8 || latitude > 18.7) fail('geometry-position');
        }
      }
    }
    const turfFeature = { type: 'Feature', properties: {}, geometry: feature.geometry };
    if (!booleanValid(turfFeature)) fail('geometry-turf-invalid-' + feature.properties.ZCTA5);
    if (!new jsts.operation.valid.IsValidOp(new jsts.io.GeoJSONReader().read(feature.geometry)).isValid()) {
      fail('geometry-jsts-invalid-' + feature.properties.ZCTA5);
    }
  }
  const collection = { type: 'FeatureCollection', features };
  const bounds = bbox(collection);
  if (!same(bounds, EXPECTED_BOUNDS)) fail('geometry-bounds-' + canonicalJson(bounds));
  if (parts !== 142 || rings !== 152 || positions !== 168_582) fail('geometry-structure-' + parts + '-' + rings + '-' + positions);
  const squareMeters = area(collection);
  if (Math.abs(squareMeters - 9_487_290_179.34971) > 0.01) fail('geometry-area-' + squareMeters);
  return { parts, rings, positions, bounds, squareMeters };
}
function build({ sourceDirectory, outputDirectory, reportPath }) {
  const receipts = Object.fromEntries(Object.keys(EXPECTED).map(name => [name, readExact(sourceDirectory, name)]));
  const service = parseJson(receipts['tigerweb-service.json'], 'service');
  const layer = parseJson(receipts['tigerweb-zcta-layer.json'], 'layer');
  const source = parseJson(receipts['pr-zcta-current.geojson'], 'zcta-geojson');
  if (service.copyrightText !== 'Source: U.S. Census Bureau'
    || !service.layers?.some(item => item.id === 1 && item.name === '2020 Census ZIP Code Tabulation Areas')) fail('service-contract');
  if (layer.id !== 1 || layer.name !== '2020 Census ZIP Code Tabulation Areas'
    || layer.description !== 'ZIP Code Tabulation Areas; 2020 Census - January 1, 2020 vintage'
    || layer.geometryType !== 'esriGeometryPolygon' || layer.copyrightText !== 'Source: U.S. Census Bureau') fail('layer-contract');
  if (source.type !== 'FeatureCollection' || source.features?.length !== 132) fail('feature-count');
  const features = [...source.features].sort((a, b) => a.properties.ZCTA5.localeCompare(b.properties.ZCTA5));
  const codes = features.map(item => item.properties.ZCTA5);
  if (new Set(codes).size !== 132 || codes.some(code => !/^00[6-9]\d{2}$/.test(code))) fail('code-denominator');
  const geometryCheck = inspectGeometry(features);
  const guidance = receipts['zcta-guidance.html'].toString('utf8');
  const citation = receipts['census-citation.html'].toString('utf8');
  if (!/ZIP Code Tabulation Areas/iu.test(guidance) || !/not all valid ZIP Codes/iu.test(guidance)) fail('zcta-semantics');
  if (!/cite the Census Bureau as the source of the original data only/iu.test(citation)) fail('citation-contract');
  const validTime = { from: DATASET_DATE + 'T00:00:00.000Z', to: null };
  const knownTime = { from: RELEASE_INSTANT, to: null };
  const censusSource = {
    sourceId: 'us-census-tigerweb-zcta-2020-pr-fixed-20260902',
    sourceType: 'derived',
    assignmentAuthority: 'derived_spatial_assignment',
    geometryAuthority: 'official_mapping_geometry',
    sourceVersion: 'TIGERweb current layer 1; 2020 Census ZCTA January 1, 2020 vintage; fixed query receipt',
    sourceDate: DATASET_DATE,
    licenseId: LICENSE_ID,
    digest: 'sha256:' + EXPECTED['pr-zcta-current.geojson'],
  };
  const countryNode = {
    id: 'country-pr', kind: 'administrative_area', featureKind: 'administrative',
    geometryType: 'none', countryCode: 'PR', label: 'Puerto Rico', visibility: 'public',
  };
  const nodes = [countryNode];
  const assertions = [];
  const geometryFeatures = [];
  for (const feature of features) {
    const p = feature.properties;
    const code = p.ZCTA5;
    const population = Number(p.POP100);
    const housing = Number(p.HU100);
    const landKm2 = Number(p.AREALAND) / 1e6;
    const waterKm2 = Number(p.AREAWATER) / 1e6;
    const nodeId = 'postal-pr-census-zcta-' + code;
    const label = `2020 Census ZCTA ${code} · population ${population.toLocaleString('en-US')} · housing ${housing.toLocaleString('en-US')} · land ${landKm2.toFixed(2)} km² · water ${waterKm2.toFixed(2)} km²`;
    nodes.push({
      id: nodeId, kind: 'postal_feature', featureKind: 'standard_area',
      geometryType: feature.geometry.type.toLowerCase(), countryCode: 'PR', postalCode: code,
      label, visibility: 'public',
    });
    assertions.push({
      id: `census-pr-zcta-2020-${code}-part-of-pr`, fromNodeId: nodeId, toNodeId: countryNode.id,
      relation: 'admin_within', validTime, knownTime, source: censusSource, method: 'geometry_contains',
      quality: { status: 'verified', confidence: 0.9, validatedAt: RELEASE_INSTANT },
    });
    geometryFeatures.push({
      id: `census-pr-zcta-2020-${code}`, nodeId, role: 'postal_area',
      publicationClass: 'public_context', geometry: feature.geometry, source: censusSource,
      validTime, knownTime, quality: { status: 'derived', confidence: 0.9, validatedAt: RELEASE_INSTANT },
    });
  }
  const population = features.reduce((sum, item) => sum + Number(item.properties.POP100), 0);
  const housing = features.reduce((sum, item) => sum + Number(item.properties.HU100), 0);
  const landSquareMeters = features.reduce((sum, item) => sum + Number(item.properties.AREALAND), 0);
  const waterSquareMeters = features.reduce((sum, item) => sum + Number(item.properties.AREAWATER), 0);
  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, {
    schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'PR', releaseId: RELEASE_ID, features: geometryFeatures,
  });
  const graphRelease = {
    schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-pr-census-zcta',
    repositoryUrl: 'https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure', countryCode: 'PR',
    releaseId: RELEASE_ID, policyVersion: 'puerto-rico-census-zcta-derived-display-v1',
    releasedAt: RELEASE_INSTANT, validTime, manifestDigest: 'sha256:' + '0'.repeat(64),
    artifacts: [{ path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json',
      digest: geometryArtifact.digest, byteLength: geometryArtifact.byteLength, recordCount: geometryFeatures.length,
      licenseRefs: [LICENSE_ID] }],
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
    countryCode: 'PR', releaseId: RELEASE_ID, policyVersion: graphRelease.policyVersion,
    sequence: 1, previousDescriptorDigest: null, graphManifestDigest: graphRelease.manifestDigest,
    createdAt: RELEASE_INSTANT, maturity: 'M2_experimental', synthetic: false, promotionEligible: true,
    containsResidentialAddressPoints: false,
    artifacts: [
      { role: 'graph', path: basename(graphPath), mediaType: 'application/vnd.agid.postal-context-graph+json',
        schemaVersion: 'postal-context-graph/v0.1', byteLength: graphArtifact.byteLength, digest: graphArtifact.digest,
        recordCounts: { nodes: nodes.length, assertions: assertions.length } },
      { role: 'geometry', path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json',
        schemaVersion: 'postal-context-geometry/v0.1', byteLength: geometryArtifact.byteLength, digest: geometryArtifact.digest,
        recordCounts: { features: geometryFeatures.length, positions: geometryCheck.positions } },
    ],
  });
  const sourceReceipts = Object.entries(receipts).map(([name, bytes]) => ({ name, bytes: bytes.length, digest: sha256(bytes) }));
  const report = {
    schemaVersion: 'postal-context-pr-m2-build/v1', countryCode: 'PR', generatedAt: RELEASE_INSTANT, releaseId: RELEASE_ID,
    input: { exactReceipts: sourceReceipts, exactReceiptBytes: sourceReceipts.reduce((sum, item) => sum + item.bytes, 0),
      censusLayer: { id: layer.id, name: layer.name, description: layer.description, copyrightText: layer.copyrightText } },
    scope: { publishedPostalCodes: codes, publishedGeometries: geometryFeatures.length,
      scopeStatement: 'All 132 Puerto Rico 2020 Census ZCTAs returned by the fixed TIGERweb query are published as derived statistical display contexts.',
      currentUspsAssignmentCompletenessClaimed: false, officialPostalBoundaryClaimed: false },
    attributes: { population, housing, landSquareMeters, waterSquareMeters },
    geometry: { ...geometryCheck, types: [...new Set(features.map(item => item.geometry.type))],
      transformations: ['verify-exact-source-digest', 'stable-ZCTA5-sort', 'coordinate-preserving-copy', 'canonical-JSON-serialization'],
      geometricModification: false, provenance: 'derived', confidence: 0.9 },
    policy: { officialPostalAssignment: false, officialPostalGeometry: false, officialCensusMappingGeometry: true,
      outputProvenance: 'derived', addressOrBuildingRowsPublished: 0, recipientCustomerOrLandRightsRowsPublished: 0,
      uspsLicensedRowsPublished: 0, inventedAreaRowsPublished: 0 },
    artifacts: { graph: graphArtifact, geometry: geometryArtifact, descriptor: descriptorArtifact },
  };
  if (reportPath) {
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  }
  return report;
}
export { build, inspectGeometry };
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sourceDirectory = resolve(process.argv[2] ?? '');
  const outputDirectory = resolve(process.argv[3] ?? join(ROOT, 'data/postal_country_packs/pr/postal-context/m2'));
  const reportPath = process.argv[4] ? resolve(process.argv[4]) : undefined;
  if (!process.argv[2]) fail('usage-source-directory-required');
  console.log(JSON.stringify(build({ sourceDirectory, outputDirectory, reportPath }), null, 2));
}

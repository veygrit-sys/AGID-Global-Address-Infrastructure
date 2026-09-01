import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const RELEASED_AT = '2026-09-01T14:44:58.852Z';
const VALID_FROM = '2025-01-01T00:00:00.000Z';
const RELEASE_ID = 'mx-sepomex-postal-polygons-2025-20260901';
const REPOSITORY_ID = 'agid-postal-mx-sepomex';
const REPOSITORY_URL = 'https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure';
const POLICY_VERSION = 'mx-sepomex-2025-derived-display-v1';
const PACKAGE_SHA256 = 'c523637ff6ebf6a417bd277d637b7a628d759e68c65bcc2c1e8c17cc5d230da1';
const SOURCE_DIR = resolve(process.argv[2] ?? '.m2-sources-mx');
const OUTPUT_ROOT = resolve('data/postal_country_packs/mx/postal-context');
const M2_ROOT = join(OUTPUT_ROOT, 'm2');
const SIMPLIFIED_ROOT = join(SOURCE_DIR, 'converted100');
const FALLBACK_ROOT = join(SOURCE_DIR, 'fallback-original100');
const PACKAGE_PATH = join(SOURCE_DIR, 'package_show.json');

const sha256 = body => createHash('sha256').update(body).digest('hex');
const digest = body => `sha256:${sha256(body)}`;
const minified = value => Buffer.from(`${JSON.stringify(value)}\n`, 'utf8');
const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const canonicalJson = value => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
};

const packageBody = readFileSync(PACKAGE_PATH);
if (sha256(packageBody) !== PACKAGE_SHA256) throw new Error('package_show digest mismatch');
const packageResult = JSON.parse(packageBody).result;
if (packageResult.id !== 'd0074e50-d661-44d4-a1a3-73a89e671e1f'
  || packageResult.license_id !== 'CC-BY-4.0'
  || packageResult.resources.length !== 32) throw new Error('unexpected official package metadata');

const resourcesByFile = new Map(packageResult.resources.map(resource => [basename(new URL(resource.url).pathname), resource]));
const zipNames = readdirSync(SOURCE_DIR).filter(name => /^CP_.+\.zip$/u.test(name)).sort();
if (zipNames.length !== 32) throw new Error(`expected 32 state ZIPs; found ${zipNames.length}`);

const resourceReceipts = zipNames.map(fileName => {
  const body = readFileSync(join(SOURCE_DIR, fileName));
  const resource = resourcesByFile.get(fileName);
  if (!resource) throw new Error(`official resource missing for ${fileName}`);
  return {
    state_file: fileName,
    resource_id: resource.id,
    resource_name: resource.name,
    resource_url: resource.url,
    resource_metadata_modified: resource.metadata_modified,
    format: resource.format,
    mimetype: resource.mimetype,
    byte_length: body.length,
    sha256: sha256(body),
    source_dbf_date: '2026-01-05',
  };
});
const receiptByStem = new Map(resourceReceipts.map(receipt => [basename(receipt.state_file, '.zip'), receipt]));
const sourceCompositeDigest = digest(Buffer.from(canonicalJson({
  package_sha256: PACKAGE_SHA256,
  resources: resourceReceipts.map(({ state_file, byte_length, sha256 }) => ({ state_file, byte_length, sha256 })),
  transform: {
    target_crs: 'EPSG:4326', coordinate_precision: 6, simplify_tolerance_meters: 100,
    validity_repair: 'GDAL makevalid', collapsed_feature_fallback: 'original transformed surface components only',
  },
}), 'utf8'));

const surfacePolygons = geometry => {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  if (geometry.type === 'GeometryCollection') return geometry.geometries.flatMap(surfacePolygons);
  return [];
};
const normalizedSurface = geometry => {
  const polygons = surfacePolygons(geometry).filter(polygon => Array.isArray(polygon) && polygon.length > 0);
  if (!polygons.length) throw new Error('source geometry has no polygonal surface component');
  return polygons.length === 1 ? { type: 'Polygon', coordinates: polygons[0] } : { type: 'MultiPolygon', coordinates: polygons };
};
const validateGeometry = (geometry, code) => {
  let positions = 0; let maxRingPositions = 0;
  for (const polygon of surfacePolygons(geometry)) {
    if (!polygon.length) throw new Error(`${code}: empty polygon`);
    for (const ring of polygon) {
      if (!Array.isArray(ring) || ring.length < 4) throw new Error(`${code}: short ring`);
      const [first, ...rest] = ring;
      const last = rest.at(-1);
      if (!last || first[0] !== last[0] || first[1] !== last[1]) throw new Error(`${code}: open ring`);
      for (const position of ring) {
        if (!Array.isArray(position) || position.length < 2 || !Number.isFinite(position[0]) || !Number.isFinite(position[1])
          || position[0] < -180 || position[0] > 180 || position[1] < -90 || position[1] > 90) {
          throw new Error(`${code}: invalid position`);
        }
      }
      positions += ring.length; maxRingPositions = Math.max(maxRingPositions, ring.length);
    }
  }
  return { positions, maxRingPositions };
};

const nodes = [{ id: 'country-mx', kind: 'administrative_area', featureKind: 'country', geometryType: 'none', countryCode: 'MX', label: 'México', visibility: 'public' }];
const assertions = [];
const features = [];
const codes = new Set();
const stateStats = [];
let sourceFeatures = 0; let fallbackFeatures = 0; let positionCount = 0; let maxRingPositions = 0;
for (const fileName of readdirSync(SIMPLIFIED_ROOT).filter(name => /^CP_.+\.geojson$/u.test(name)).sort()) {
  const stem = basename(fileName, '.geojson');
  const receipt = receiptByStem.get(stem);
  if (!receipt) throw new Error(`${stem}: receipt missing`);
  const simplified = readJson(join(SIMPLIFIED_ROOT, fileName));
  const fallbackPath = join(FALLBACK_ROOT, fileName);
  const fallbackByCode = new Map();
  if (statSafe(fallbackPath)) {
    for (const feature of readJson(fallbackPath).features) fallbackByCode.set(String(feature.properties.d_cp), feature.geometry);
  }
  let stateFallbacks = 0; let statePositions = 0;
  for (const feature of simplified.features) {
    sourceFeatures += 1;
    const code = String(feature.properties?.d_cp ?? '');
    if (!/^\d{5}$/u.test(code) || codes.has(code)) throw new Error(`${stem}: invalid or duplicate postal code ${code}`);
    codes.add(code);
    let sourceGeometry = feature.geometry;
    if (!sourceGeometry || !['Polygon', 'MultiPolygon'].includes(sourceGeometry.type)) {
      sourceGeometry = fallbackByCode.get(code);
      if (!sourceGeometry) throw new Error(`${stem}/${code}: fallback missing`);
      stateFallbacks += 1; fallbackFeatures += 1;
    }
    const geometry = normalizedSurface(sourceGeometry);
    const geometryCounts = validateGeometry(geometry, code);
    positionCount += geometryCounts.positions; statePositions += geometryCounts.positions;
    maxRingPositions = Math.max(maxRingPositions, geometryCounts.maxRingPositions);
    const nodeId = `postal-mx-${code}`;
    const geometryType = geometry.type.toLowerCase();
    nodes.push({ id: nodeId, kind: 'postal_feature', featureKind: 'standard_area', geometryType, countryCode: 'MX', postalCode: code, label: `${code} — SEPOMEX 2025 derived display area`, visibility: 'public' });
    assertions.push({
      id: `sepomex-mx-2025-${code}-part-of-mx`, fromNodeId: nodeId, toNodeId: 'country-mx', relation: 'part_of',
      validTime: { from: VALID_FROM, to: null }, knownTime: { from: RELEASED_AT, to: null },
      source: { sourceId: 'mx-sepomex-postal-polygons-2025', sourceType: 'official', assignmentAuthority: 'official_postal_mapping_authority', geometryAuthority: 'official_postal_geometry', sourceVersion: `${stem}/2025`, sourceDate: '2025-01-01', licenseId: 'cc-by-4.0', digest: sourceCompositeDigest },
      method: 'direct_source_link', quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASED_AT },
    });
    features.push({
      id: `mx-derived-${code}`, nodeId, role: 'postal_area', publicationClass: 'public_context', geometry,
      source: { sourceId: 'mx-sepomex-derived-display-2025', sourceType: 'derived', assignmentAuthority: 'official_postal_mapping_authority', geometryAuthority: 'official_postal_geometry', sourceVersion: `${stem}/100m-v1`, sourceDate: '2025-01-01', licenseId: 'cc-by-4.0', digest: sourceCompositeDigest },
      validTime: { from: VALID_FROM, to: null }, knownTime: { from: RELEASED_AT, to: null },
      quality: { status: 'derived', confidence: 0.94, accuracyMeters: 100, validatedAt: RELEASED_AT },
    });
  }
  if (stateFallbacks !== fallbackByCode.size) throw new Error(`${stem}: unused fallback geometry`);
  stateStats.push({ stem, features: simplified.features.length, fallbacks: stateFallbacks, positions: statePositions, resource_sha256: receipt.sha256 });
}
function statSafe(path) { try { return statSync(path); } catch { return null; } }
if (features.length !== 35898 || codes.size !== 35898 || sourceFeatures !== 35898) throw new Error('national feature denominator mismatch');
if (positionCount > 2_000_000 || maxRingPositions > 100_000) throw new Error('runtime position limit exceeded');

const geometry = { schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'MX', releaseId: RELEASE_ID, features };
const geometryBody = minified(geometry);
if (geometryBody.length > 64 * 1024 * 1024) throw new Error(`geometry artifact too large: ${geometryBody.length}`);
const graphRelease = {
  schemaVersion: 'postal-context-graph/v0.1', repositoryId: REPOSITORY_ID, repositoryUrl: REPOSITORY_URL,
  countryCode: 'MX', releaseId: RELEASE_ID, policyVersion: POLICY_VERSION, releasedAt: RELEASED_AT,
  validTime: { from: VALID_FROM, to: null }, manifestDigest: `sha256:${'0'.repeat(64)}`,
  artifacts: [{ path: 'geometry.json', mediaType: 'application/vnd.agid.postal-context-geometry+json', digest: digest(geometryBody), byteLength: geometryBody.length, recordCount: features.length, licenseRefs: ['cc-by-4.0'] }],
};
graphRelease.manifestDigest = digest(Buffer.from(canonicalJson(Object.fromEntries(Object.entries(graphRelease).filter(([key]) => key !== 'manifestDigest'))), 'utf8'));
const graph = { schemaVersion: 'postal-context-graph/v0.1', release: graphRelease, nodes, assertions };
const graphBody = minified(graph);
if (graphBody.length > 32 * 1024 * 1024) throw new Error(`graph artifact too large: ${graphBody.length}`);
const descriptor = {
  schemaVersion: 'postal-context-pack-descriptor/v0.1', repositoryId: REPOSITORY_ID, countryCode: 'MX', releaseId: RELEASE_ID,
  policyVersion: POLICY_VERSION, sequence: 1, previousDescriptorDigest: null, graphManifestDigest: graphRelease.manifestDigest,
  createdAt: RELEASED_AT, maturity: 'M2_experimental', synthetic: false, promotionEligible: true, containsResidentialAddressPoints: false,
  artifacts: [
    { role: 'graph', path: 'graph.json', mediaType: 'application/vnd.agid.postal-context-graph+json', schemaVersion: 'postal-context-graph/v0.1', byteLength: graphBody.length, digest: digest(graphBody), recordCounts: { nodes: nodes.length, assertions: assertions.length } },
    { role: 'geometry', path: 'geometry.json', mediaType: 'application/vnd.agid.postal-context-geometry+json', schemaVersion: 'postal-context-geometry/v0.1', byteLength: geometryBody.length, digest: digest(geometryBody), recordCounts: { features: features.length, positions: positionCount } },
  ],
};
const descriptorBody = minified(descriptor);
const profile = {
  country_code: 'MX', artifact_scope: 'M2-national-official-postal-polygons-derived-display',
  dataset: { provider: 'Servicio Postal Mexicano (SEPOMEX)', title: packageResult.title, dataset_id: packageResult.id, dataset_url: 'https://www.datos.gob.mx/es/dataset/codigos_postales_entidad_federativa', api_url: 'https://www.datos.gob.mx/api/3/action/package_show?id=codigos_postales_entidad_federativa', package_metadata_modified: packageResult.metadata_modified, package_byte_length: packageBody.length, package_sha256: PACKAGE_SHA256, license_id: packageResult.license_id, license_title: packageResult.license_title },
  resources: resourceReceipts,
  transformation: { target_crs: 'EPSG:4326', coordinate_precision: 6, simplify_tolerance_meters: 100, validity_repair: 'GDAL makevalid', collapsed_feature_fallback: 'original transformed polygonal surface components only; non-surface members discarded', invented_surfaces: false, source_composite_digest: sourceCompositeDigest },
  validation: { state_resources: 32, source_features: sourceFeatures, distinct_postal_codes: codes.size, derived_features: features.length, fallback_features: fallbackFeatures, positions: positionCount, max_ring_positions: maxRingPositions, graph_bytes: graphBody.length, geometry_bytes: geometryBody.length, descriptor_sha256: sha256(descriptorBody), state_stats: stateStats },
  receipt_summary: { exact_bodies: 33, exact_bytes: packageBody.length + resourceReceipts.reduce((sum, receipt) => sum + receipt.byte_length, 0), all_sha256_bound: true, raw_source_bodies_in_git: 0 },
};
mkdirSync(M2_ROOT, { recursive: true });
writeFileSync(join(M2_ROOT, 'geometry.json'), geometryBody);
writeFileSync(join(M2_ROOT, 'graph.json'), graphBody);
writeFileSync(join(M2_ROOT, 'descriptor.json'), descriptorBody);
writeFileSync(join(OUTPUT_ROOT, 'source-profile.json'), `${JSON.stringify(profile, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ releaseId: RELEASE_ID, sourceCompositeDigest, descriptorDigest: digest(descriptorBody), graphBytes: graphBody.length, geometryBytes: geometryBody.length, nodes: nodes.length, assertions: assertions.length, features: features.length, positions: positionCount, fallbackFeatures }, null, 2));

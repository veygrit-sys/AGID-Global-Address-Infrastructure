import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import area from '@turf/area';
import booleanValid from '@turf/boolean-valid';
import buffer from '@turf/buffer';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIGEST = 'sha256:952d2b52d358cd2671673ea1bc5ee3e9161eacd6b15981a9c97f9fc08709ced2';
const RELEASE_ID = 'fo-umhvorvisstovan-postoki-20260830';
const RELEASE_INSTANT = '2026-08-30T05:59:44.058Z';
const LICENSE_ID = 'umhvorvisstovan-free-map-data-terms-2019-06';
const REPAIRED_CODE = '476';
const REPAIR_BUFFER_METERS = 0.000001;
const MAX_POSITIONS = 250_000;
const MAX_POSITIONS_PER_RING = 20_000;

function fail(message) {
  throw new Error(`fo-m2-${message}`);
}

function sha256(bytes) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function canonicalJson(value) {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') {
    if (typeof value === 'number' && !Number.isFinite(value)) fail('canonical-number');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (!value || typeof value !== 'object') fail('canonical-value');
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
}

function countGeometryPositions(geometry) {
  let positions = 0;
  const visit = value => {
    if (!Array.isArray(value)) fail('geometry-coordinates');
    if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      const [longitude, latitude] = value;
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)
        || longitude < -8 || longitude > -6 || latitude < 61 || latitude > 63) {
        fail('geometry-position-range');
      }
      positions += 1;
      return;
    }
    value.forEach(visit);
  };
  visit(geometry.coordinates);
  return positions;
}

function polygonsFor(geometry) {
  return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
}

function countGeometryRings(geometry) {
  return polygonsFor(geometry).reduce((sum, polygon) => sum + polygon.length, 0);
}

function validateRings(geometry, code) {
  const polygons = polygonsFor(geometry);
  if (!polygons.length) fail(`geometry-empty-${code}`);
  for (const polygon of polygons) {
    if (!Array.isArray(polygon) || !polygon.length) fail(`geometry-empty-polygon-${code}`);
    for (const ring of polygon) {
      if (!Array.isArray(ring) || ring.length < 4 || ring.length > MAX_POSITIONS_PER_RING) {
        fail(`geometry-ring-size-${code}`);
      }
      const first = ring[0];
      const last = ring.at(-1);
      if (first[0] !== last[0] || first[1] !== last[1]) fail(`geometry-open-ring-${code}`);
    }
  }
}

function parsePostnr(bytes) {
  if (sha256(bytes) !== SOURCE_DIGEST) fail('source-digest');
  const collection = JSON.parse(bytes.toString('utf8'));
  if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
    fail('source-feature-collection');
  }
  if (collection.features.length !== 117) fail(`source-feature-count-${collection.features.length}`);
  const rows = [];
  const codes = new Set();
  const objectIds = new Set();
  let positions = 0;
  let rings = 0;
  let polygonFeatures = 0;
  let multiPolygonFeatures = 0;
  let sourcePositions = 0;
  let sourcePolygonFeatures = 0;
  let sourceMultiPolygonFeatures = 0;
  let repairAreaDeltaRatio = null;
  for (const feature of collection.features) {
    const objectId = feature.properties?.OBJECTID;
    const numericCode = feature.properties?.postnr;
    const code = String(numericCode ?? '').padStart(3, '0');
    const label = String(feature.properties?.stad ?? '').trim();
    if (!Number.isInteger(objectId) || objectIds.has(objectId)) fail(`source-objectid-${objectId}`);
    if (!Number.isInteger(numericCode) || !/^\d{3}$/u.test(code) || codes.has(code)) fail(`source-postcode-${code}`);
    if (!label) fail(`source-label-${code}`);
    if (!['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)) fail(`geometry-type-${code}`);
    validateRings(feature.geometry, code);
    sourcePositions += countGeometryPositions(feature.geometry);
    feature.geometry.type === 'Polygon' ? sourcePolygonFeatures += 1 : sourceMultiPolygonFeatures += 1;
    let publishedFeature = feature;
    let repaired = false;
    if (!booleanValid(feature)) {
      if (code !== REPAIRED_CODE) fail(`geometry-invalid-${code}`);
      const repairedFeature = buffer(feature, REPAIR_BUFFER_METERS, { units: 'meters', steps: 8 });
      if (!repairedFeature || !booleanValid(repairedFeature)) fail(`geometry-repair-invalid-${code}`);
      repairAreaDeltaRatio = Math.abs(area(repairedFeature) - area(feature)) / area(feature);
      if (repairAreaDeltaRatio > 0.00000001) fail(`geometry-repair-area-delta-${code}`);
      publishedFeature = repairedFeature;
      repaired = true;
    }
    validateRings(publishedFeature.geometry, code);
    positions += countGeometryPositions(publishedFeature.geometry);
    rings += countGeometryRings(publishedFeature.geometry);
    publishedFeature.geometry.type === 'Polygon' ? polygonFeatures += 1 : multiPolygonFeatures += 1;
    objectIds.add(objectId);
    codes.add(code);
    rows.push({ code, label, objectId, geometry: publishedFeature.geometry, repaired });
  }
  if (positions > MAX_POSITIONS) fail(`geometry-position-budget-${positions}`);
  if (sourcePolygonFeatures !== 115 || sourceMultiPolygonFeatures !== 2) {
    fail(`source-geometry-type-count-${sourcePolygonFeatures}-${sourceMultiPolygonFeatures}`);
  }
  if (polygonFeatures !== 116 || multiPolygonFeatures !== 1 || repairAreaDeltaRatio === null) {
    fail(`published-geometry-type-count-${polygonFeatures}-${multiPolygonFeatures}`);
  }
  for (const expectedCode of ['100', '285', '480', '796']) {
    if (!codes.has(expectedCode)) fail(`source-known-code-${expectedCode}`);
  }
  return {
    rows: rows.sort((a, b) => a.code.localeCompare(b.code)),
    positions,
    rings,
    polygonFeatures,
    multiPolygonFeatures,
    sourcePositions,
    sourcePolygonFeatures,
    sourceMultiPolygonFeatures,
    repairAreaDeltaRatio,
  };
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value)}\n`, 'utf8');
}

function writeJson(path, value) {
  const bytes = jsonBytes(value);
  writeFileSync(path, bytes);
  return { digest: sha256(bytes), byteLength: bytes.length };
}

function build({ sourcePath, outputDirectory, reportPath }) {
  const parsed = parsePostnr(readFileSync(sourcePath));
  const officialGeometrySource = {
    sourceId: 'fo-umhvorvisstovan-postoki-20260830',
    sourceType: 'official',
    assignmentAuthority: 'official_postal_mapping_authority',
    geometryAuthority: 'official_postal_geometry',
    sourceVersion: 'ArcGIS MapServer 11.4 / document 2.9.0 live snapshot 2026-08-30',
    sourceDate: '2026-08-30',
    licenseId: LICENSE_ID,
    digest: SOURCE_DIGEST,
  };
  const repairedGeometrySource = {
    ...officialGeometrySource,
    sourceId: 'fo-umhvorvisstovan-postoki-20260830-topology-repair-476',
    sourceType: 'derived',
    geometryAuthority: 'derived_geometry',
    sourceVersion: `${officialGeometrySource.sourceVersion}; code 476 repaired with deterministic 0.000001 metre buffer`,
  };
  const assignmentSource = { ...officialGeometrySource, geometryAuthority: 'none' };
  const validTime = { from: RELEASE_INSTANT, to: null };
  const knownTime = { from: RELEASE_INSTANT, to: null };
  const countryNode = {
    id: 'country-fo', kind: 'administrative_area', featureKind: 'country', geometryType: 'none',
    countryCode: 'FO', label: 'Føroyar / Faroe Islands', visibility: 'public',
  };
  const postalNodes = parsed.rows.map(row => ({
    id: `postal-fo-${row.code}`, kind: 'postal_feature', featureKind: 'standard_area',
    geometryType: row.geometry.type.toLowerCase(), countryCode: 'FO', postalCode: row.code,
    label: row.label, visibility: 'public',
  }));
  const nodes = [countryNode, ...postalNodes];
  const assertions = parsed.rows.map(row => ({
    id: `umhvorvisstovan-fo-20260830-${row.code}-part-of-fo`,
    fromNodeId: `postal-fo-${row.code}`, toNodeId: countryNode.id, relation: 'part_of',
    validTime, knownTime, source: assignmentSource, method: 'explicit_assignment',
    quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT },
  }));
  const features = parsed.rows.map(row => ({
    id: `umhvorvisstovan-fo-20260830-${row.code}`, nodeId: `postal-fo-${row.code}`,
    role: 'postal_area', publicationClass: 'public_context', geometry: row.geometry,
    source: row.repaired ? repairedGeometrySource : officialGeometrySource,
    validTime, knownTime,
    quality: row.repaired
      ? { status: 'derived', confidence: 0.999999, validatedAt: RELEASE_INSTANT }
      : { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT },
  }));

  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, {
    schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'FO', releaseId: RELEASE_ID, features,
  });
  const graphRelease = {
    schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-fo-umhvorvisstovan',
    repositoryUrl: 'https://github.com/veygrit-sys/Address-Grid-ID', countryCode: 'FO',
    releaseId: RELEASE_ID, policyVersion: 'faroe-islands-umhvorvisstovan-official-postoki-v1',
    releasedAt: RELEASE_INSTANT, validTime, manifestDigest: `sha256:${'0'.repeat(64)}`,
    artifacts: [{
      path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json',
      digest: geometryArtifact.digest, byteLength: geometryArtifact.byteLength,
      recordCount: features.length, licenseRefs: [LICENSE_ID],
    }],
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
    countryCode: 'FO', releaseId: RELEASE_ID, policyVersion: graphRelease.policyVersion,
    sequence: 1, previousDescriptorDigest: null, graphManifestDigest: graphRelease.manifestDigest,
    createdAt: RELEASE_INSTANT, maturity: 'M2_experimental', synthetic: false,
    promotionEligible: true, containsResidentialAddressPoints: false,
    artifacts: [
      { role: 'graph', path: basename(graphPath), mediaType: 'application/vnd.agid.postal-context-graph+json',
        schemaVersion: 'postal-context-graph/v0.1', byteLength: graphArtifact.byteLength,
        digest: graphArtifact.digest, recordCounts: { nodes: nodes.length, assertions: assertions.length } },
      { role: 'geometry', path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json',
        schemaVersion: 'postal-context-geometry/v0.1', byteLength: geometryArtifact.byteLength,
        digest: geometryArtifact.digest, recordCounts: { features: features.length, positions: parsed.positions } },
    ],
  });
  const report = {
    schemaVersion: 'postal-context-fo-m2-build/v1', countryCode: 'FO', generatedAt: RELEASE_INSTANT,
    releaseId: RELEASE_ID,
    input: { sourceId: officialGeometrySource.sourceId, digest: SOURCE_DIGEST,
      serviceVersion: officialGeometrySource.sourceVersion, features: parsed.rows.length },
    identity: { distinctCodes: parsed.rows.length, codeFormat: 'NNN', sourceObjectIdsDistinct: true },
    geometry: {
      publishedFeatures: features.length, polygonFeatures: parsed.polygonFeatures,
      multiPolygonFeatures: parsed.multiPolygonFeatures, positions: parsed.positions, rings: parsed.rings,
      allFeaturesBooleanValid: true, allRingsClosed: true, allCoordinatesWithinFaroeBounds: true,
      sourcePolygonFeatures: parsed.sourcePolygonFeatures,
      sourceMultiPolygonFeatures: parsed.sourceMultiPolygonFeatures, sourcePositions: parsed.sourcePositions,
      topologyRepairs: [{ postalCode: REPAIRED_CODE,
        method: 'turf-buffer-0.000001-metre-steps-8', sourceKinksObserved: 8,
        outputGeometryType: parsed.rows.find(row => row.code === REPAIRED_CODE)?.geometry.type,
        relativeAreaDelta: parsed.repairAreaDeltaRatio, provenance: 'derived' }],
    },
    policy: { officialPostokiGeometry: true, operatorDeliverabilityClaimed: false,
      addressOrBuildingRowsPublished: 0, recipientCustomerOrLandRightsRowsPublished: 0,
      inventedAreaRowsPublished: 0 },
    artifacts: { graph: graphArtifact, geometry: geometryArtifact, descriptor: descriptorArtifact },
  };
  if (reportPath) writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

export { build, parsePostnr };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sourcePath = resolve(process.argv[2] ?? '');
  const outputDirectory = resolve(process.argv[3] ?? join(ROOT, 'data/postal_country_packs/fo/postal-context/m2'));
  const reportPath = process.argv[4] ? resolve(process.argv[4]) : undefined;
  if (!process.argv[2]) fail('usage-source-geojson-required');
  console.log(JSON.stringify(build({ sourcePath, outputDirectory, reportPath }), null, 2));
}

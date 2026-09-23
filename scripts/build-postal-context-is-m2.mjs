import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import area from '@turf/area';
import booleanValid from '@turf/boolean-valid';
import buffer from '@turf/buffer';
import cleanCoords from '@turf/clean-coords';
import { feature, featureCollection } from '@turf/helpers';
import intersect from '@turf/intersect';
import simplify from '@turf/simplify';
import union from '@turf/union';
import jsts from 'jsts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIGEST = 'sha256:5a5fb67232ce16d6023204dd45b4004930db0858e9788b78ae97a0d601d2f76a';
const RELEASE_ID = 'is-byggdastofnun-postnumer-20260830';
const RELEASE_INSTANT = '2026-08-30T12:20:57.000Z';
const LICENSE_ID = 'byggdastofnun-open-reuse-attribution-v1';
const MAX_POSITIONS = 1_000_000;
const MAX_POSITIONS_PER_RING = 20_000;
const MAX_REPAIR_RELATIVE_AREA_DELTA = 0.00001;
const OVERLAP_REPORT_THRESHOLD_SQUARE_METRES = 0.01;
const EXPECTED_SOURCE_FEATURES = 175;
const EXPECTED_POSTAL_CODES = 174;
const EXPECTED_REPAIR_CODES = 62;
const EPSILON_REPAIR_CODES = new Set(['611', '900']);

function fail(message) {
  throw new Error(`is-m2-${message}`);
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

function polygonsFor(geometry) {
  return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
}

function countGeometryPositions(geometry) {
  let positions = 0;
  const visit = value => {
    if (!Array.isArray(value)) fail('geometry-coordinates');
    if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      const [longitude, latitude] = value;
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)
        || longitude < -25 || longitude > -13 || latitude < 63 || latitude > 67) {
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

const geoJsonReader = new jsts.io.GeoJSONReader();
const geoJsonWriter = new jsts.io.GeoJSONWriter();

function jstsValid(geometry) {
  return new jsts.operation.valid.IsValidOp(geoJsonReader.read(geometry)).isValid();
}

function topologyNormalize(sourceFeature, code) {
  const cleaned = cleanCoords(sourceFeature, { mutate: false });
  const sourceValid = jstsValid(sourceFeature.geometry);
  let normalized = cleaned;
  let repaired = false;
  if (!sourceValid) {
    const repairedGeometry = jsts.operation.buffer.BufferOp.bufferOp(
      geoJsonReader.read(cleaned.geometry),
      0,
    );
    normalized = cleanCoords(feature(geoJsonWriter.write(repairedGeometry), sourceFeature.properties), {
      mutate: false,
    });
    repaired = true;
  }
  if (EPSILON_REPAIR_CODES.has(code)) {
    const epsilonRepaired = buffer(normalized, 0.000001, { units: 'meters', steps: 8 });
    if (!epsilonRepaired) fail(`geometry-epsilon-repair-null-${code}`);
    normalized = cleanCoords(epsilonRepaired, { mutate: false });
    repaired = true;
  }
  if (code === '900') {
    normalized = cleanCoords(simplify(normalized, {
      tolerance: 0.00000001, highQuality: true, mutate: false,
    }), { mutate: false });
    repaired = true;
  }
  if (code === '806') {
    const separated = buffer(normalized, 0.001, { units: 'meters', steps: 8 });
    if (!separated) fail('geometry-shared-topology-repair-null-806');
    normalized = cleanCoords(simplify(separated, {
      tolerance: 0.0000001, highQuality: true, mutate: false,
    }), { mutate: false });
    repaired = true;
  }
  if (!jstsValid(normalized.geometry)) fail(`geometry-jsts-invalid-${code}`);
  validateRings(normalized.geometry, code);
  const sourceArea = area(sourceFeature);
  const normalizedArea = area(normalized);
  if (!(sourceArea > 0) || !(normalizedArea > 0)) fail(`geometry-area-${code}`);
  const relativeAreaDelta = Math.abs(normalizedArea - sourceArea) / sourceArea;
  if (repaired && relativeAreaDelta > MAX_REPAIR_RELATIVE_AREA_DELTA) {
    fail(`geometry-repair-area-delta-${code}-${relativeAreaDelta}`);
  }
  return { feature: normalized, repaired, relativeAreaDelta };
}

function aggregateGeometry(group, code) {
  if (group.length === 1) return group[0].normalized.feature.geometry;
  const merged = union(featureCollection(group.map(row => row.normalized.feature)));
  if (!merged) fail(`geometry-union-null-${code}`);
  const normalized = cleanCoords(merged, { mutate: false });
  if (!jstsValid(normalized.geometry)) fail(`geometry-union-invalid-${code}`);
  return normalized.geometry;
}

function boundingBox(geometry) {
  let west = Number.POSITIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;
  const visit = value => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      west = Math.min(west, value[0]);
      south = Math.min(south, value[1]);
      east = Math.max(east, value[0]);
      north = Math.max(north, value[1]);
      return;
    }
    value.forEach(visit);
  };
  visit(geometry.coordinates);
  return [west, south, east, north];
}

function auditOverlaps(rows) {
  const overlaps = [];
  let bboxCandidatePairs = 0;
  const bboxes = rows.map(row => boundingBox(row.geometry));
  for (let left = 0; left < rows.length; left += 1) {
    for (let right = left + 1; right < rows.length; right += 1) {
      const a = bboxes[left];
      const b = bboxes[right];
      if (a[2] < b[0] || b[2] < a[0] || a[3] < b[1] || b[3] < a[1]) continue;
      bboxCandidatePairs += 1;
      const overlap = intersect(featureCollection([
        feature(rows[left].geometry),
        feature(rows[right].geometry),
      ]));
      if (!overlap) continue;
      const overlapArea = area(overlap);
      if (overlapArea <= OVERLAP_REPORT_THRESHOLD_SQUARE_METRES) continue;
      overlaps.push({
        postalCodes: [rows[left].code, rows[right].code],
        areaSquareMetres: overlapArea,
        disposition: 'source-preserved-multiple-candidate',
      });
    }
  }
  overlaps.sort((left, right) => right.areaSquareMetres - left.areaSquareMetres
    || left.postalCodes.join('').localeCompare(right.postalCodes.join('')));
  return {
    bboxCandidatePairs,
    reportedPairs: overlaps.length,
    totalAreaSquareMetres: overlaps.reduce((sum, row) => sum + row.areaSquareMetres, 0),
    maximumAreaSquareMetres: overlaps[0]?.areaSquareMetres ?? 0,
    pairs: overlaps,
  };
}

function parsePostnumer(bytes) {
  if (sha256(bytes) !== SOURCE_DIGEST) fail('source-digest');
  const collection = JSON.parse(bytes.toString('utf8'));
  if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
    fail('source-feature-collection');
  }
  if (collection.features.length !== EXPECTED_SOURCE_FEATURES) {
    fail(`source-feature-count-${collection.features.length}`);
  }
  const featureIds = new Set();
  const byCode = new Map();
  const uuidToCodes = new Map();
  const correctionDates = [];
  let missingSourceDates = 0;
  let missingCorrectionDates = 0;
  let sourcePositions = 0;
  let sourceRings = 0;
  let sourceJstsValidFeatures = 0;
  let sourceTurfValidFeatures = 0;
  for (const sourceFeature of collection.features) {
    const sourceId = String(sourceFeature.id ?? '').trim();
    const numericCode = sourceFeature.properties?.postnumer;
    const code = String(numericCode ?? '').padStart(3, '0');
    const label = String(sourceFeature.properties?.stadur ?? '').trim();
    const classification = String(sourceFeature.properties?.flokkun_postnumera ?? '').trim();
    const sourceName = String(sourceFeature.properties?.heimild ?? '').trim();
    const sourceDateValue = sourceFeature.properties?.dagsheimildar;
    const sourceDate = sourceDateValue === null || sourceDateValue === undefined
      ? null
      : String(sourceDateValue).trim().replace(/Z$/u, '');
    const correctionDateValue = sourceFeature.properties?.dagsleidrettingar;
    const correctionDate = correctionDateValue === null || correctionDateValue === undefined
      ? null
      : String(correctionDateValue).trim().replace(/Z$/u, '');
    const uuid = String(sourceFeature.properties?.uuid ?? '').trim();
    if (!sourceId || featureIds.has(sourceId)) fail(`source-feature-id-${sourceId}`);
    if (!Number.isInteger(numericCode) || !/^\d{3}$/u.test(code)) fail(`source-postcode-${code}`);
    if (!label || !['Dreifbýli', 'Þéttbýli'].includes(classification)) fail(`source-label-or-class-${code}`);
    if (sourceName !== 'Byggðastofnun, LMÍ') fail(`source-author-${code}`);
    if ((sourceDate !== null && !/^\d{4}-\d{2}-\d{2}$/u.test(sourceDate))
      || (correctionDate !== null && !/^\d{4}-\d{2}-\d{2}$/u.test(correctionDate))) {
      fail(`source-date-${code}`);
    }
    if (!uuid) fail(`source-uuid-${code}`);
    if (!['Polygon', 'MultiPolygon'].includes(sourceFeature.geometry?.type)) fail(`geometry-type-${code}`);
    validateRings(sourceFeature.geometry, code);
    sourcePositions += countGeometryPositions(sourceFeature.geometry);
    sourceRings += countGeometryRings(sourceFeature.geometry);
    if (jstsValid(sourceFeature.geometry)) sourceJstsValidFeatures += 1;
    if (booleanValid(sourceFeature)) sourceTurfValidFeatures += 1;
    const normalized = topologyNormalize(sourceFeature, code);
    const group = byCode.get(code) ?? [];
    group.push({ sourceId, code, label, classification, sourceDate, correctionDate, normalized });
    byCode.set(code, group);
    const uuidCodes = uuidToCodes.get(uuid) ?? new Set();
    uuidCodes.add(code);
    uuidToCodes.set(uuid, uuidCodes);
    if (sourceDate === null) missingSourceDates += 1;
    if (correctionDate === null) missingCorrectionDates += 1;
    if (correctionDate !== null) correctionDates.push(correctionDate);
    featureIds.add(sourceId);
  }
  if (byCode.size !== EXPECTED_POSTAL_CODES) fail(`source-code-count-${byCode.size}`);
  const duplicateCodes = [...byCode].filter(([, group]) => group.length > 1).map(([code]) => code);
  if (duplicateCodes.length !== 1 || duplicateCodes[0] !== '310' || byCode.get('310').length !== 2) {
    fail(`source-duplicate-codes-${duplicateCodes.join('-')}`);
  }
  const uuidCollisions = [...uuidToCodes.values()]
    .map(codes => [...codes].sort())
    .filter(codes => codes.length > 1);
  if (uuidCollisions.length !== 1 || uuidCollisions[0].join(',') !== '815,816') {
    fail('source-uuid-collision-profile');
  }
  const rows = [...byCode].map(([code, group]) => {
    const labels = [...new Set(group.map(row => row.label))];
    const classifications = [...new Set(group.map(row => row.classification))];
    if (labels.length !== 1 || classifications.length !== 1) fail(`source-group-conflict-${code}`);
    const geometry = aggregateGeometry(group, code);
    validateRings(geometry, code);
    countGeometryPositions(geometry);
    const repaired = group.some(row => row.normalized.repaired);
    return {
      code,
      label: labels[0],
      classification: classifications[0],
      geometry,
      repaired,
      sourceFeatureCount: group.length,
      maximumRepairRelativeAreaDelta: Math.max(...group.map(row => row.normalized.relativeAreaDelta)),
    };
  }).sort((left, right) => left.code.localeCompare(right.code));
  const repairs = rows.filter(row => row.repaired);
  if (repairs.length !== EXPECTED_REPAIR_CODES) fail(`repair-code-count-${repairs.length}`);
  for (const expectedCode of ['101', '310', '815', '816', '900']) {
    if (!byCode.has(expectedCode)) fail(`source-known-code-${expectedCode}`);
  }
  const positions = rows.reduce((sum, row) => sum + countGeometryPositions(row.geometry), 0);
  const rings = rows.reduce((sum, row) => sum + countGeometryRings(row.geometry), 0);
  if (positions > MAX_POSITIONS) fail(`geometry-position-budget-${positions}`);
  const overlapAudit = auditOverlaps(rows);
  return {
    rows,
    positions,
    rings,
    sourcePositions,
    sourceRings,
    sourceJstsValidFeatures,
    sourceTurfValidFeatures,
    repairedCodes: repairs.map(row => row.code),
    maximumRepairRelativeAreaDelta: Math.max(...repairs.map(row => row.maximumRepairRelativeAreaDelta)),
    uuidCollisions,
    correctionDateRange: [correctionDates.sort()[0], correctionDates.sort().at(-1)],
    missingSourceDates,
    missingCorrectionDates,
    overlapAudit,
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
  const parsed = parsePostnumer(readFileSync(sourcePath));
  const officialGeometrySource = {
    sourceId: 'is-byggdastofnun-postnumer-20260830',
    sourceType: 'official',
    assignmentAuthority: 'official_postal_mapping_authority',
    geometryAuthority: 'official_postal_geometry',
    sourceVersion: 'GeoServer WFS 2.0.0 live snapshot 2026-08-30; layer update 2024-08-19; metadata edition 1.0',
    sourceDate: '2025-05-18',
    licenseId: LICENSE_ID,
    digest: SOURCE_DIGEST,
  };
  const repairedGeometrySource = {
    ...officialGeometrySource,
    sourceId: 'is-byggdastofnun-postnumer-20260830-topology-repair',
    sourceType: 'derived',
    geometryAuthority: 'derived_geometry',
    sourceVersion: `${officialGeometrySource.sourceVersion}; JSTS 2.7.1 buffer zero repair after deterministic coordinate cleaning`,
  };
  const assignmentSource = { ...officialGeometrySource, geometryAuthority: 'none' };
  const validTime = { from: RELEASE_INSTANT, to: null };
  const knownTime = { from: RELEASE_INSTANT, to: null };
  const countryNode = {
    id: 'country-is', kind: 'administrative_area', featureKind: 'country', geometryType: 'none',
    countryCode: 'IS', label: 'Ísland / Iceland', visibility: 'public',
  };
  const postalNodes = parsed.rows.map(row => ({
    id: `postal-is-${row.code}`, kind: 'postal_feature', featureKind: 'standard_area',
    geometryType: row.geometry.type.toLowerCase(), countryCode: 'IS', postalCode: row.code,
    label: `${row.code} ${row.label}`, visibility: 'public',
  }));
  const nodes = [countryNode, ...postalNodes];
  const assertions = parsed.rows.map(row => ({
    id: `byggdastofnun-is-20260830-${row.code}-part-of-is`,
    fromNodeId: `postal-is-${row.code}`, toNodeId: countryNode.id, relation: 'part_of',
    validTime, knownTime, source: assignmentSource, method: 'explicit_assignment',
    quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT },
  }));
  const features = parsed.rows.map(row => ({
    id: `byggdastofnun-is-20260830-${row.code}`, nodeId: `postal-is-${row.code}`,
    role: 'postal_area', publicationClass: 'public_context', geometry: row.geometry,
    source: row.repaired ? repairedGeometrySource : officialGeometrySource,
    validTime, knownTime,
    quality: row.repaired
      ? { status: 'derived', confidence: 0.99999, validatedAt: RELEASE_INSTANT }
      : { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT },
  }));

  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, {
    schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'IS', releaseId: RELEASE_ID, features,
  });
  const graphRelease = {
    schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-is-byggdastofnun',
    repositoryUrl: 'https://github.com/veygrit-sys/Address-Grid-ID', countryCode: 'IS',
    releaseId: RELEASE_ID, policyVersion: 'iceland-byggdastofnun-official-postnumer-v1',
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
    countryCode: 'IS', releaseId: RELEASE_ID, policyVersion: graphRelease.policyVersion,
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
    schemaVersion: 'postal-context-is-m2-build/v1', countryCode: 'IS', generatedAt: RELEASE_INSTANT,
    releaseId: RELEASE_ID,
    input: {
      sourceId: officialGeometrySource.sourceId, digest: SOURCE_DIGEST,
      serviceVersion: officialGeometrySource.sourceVersion,
      responseTimestamp: RELEASE_INSTANT,
      sourceFeatures: EXPECTED_SOURCE_FEATURES,
    },
    identity: {
      distinctCodes: parsed.rows.length, codeFormat: 'NNN', duplicateSourceCode: '310',
      duplicateSourceCodeFeatureCount: 2, sourceUuidCollisionGroups: parsed.uuidCollisions,
      correctionDateRange: parsed.correctionDateRange,
      sourceDateNullFeatures: parsed.missingSourceDates,
      correctionDateNullFeatures: parsed.missingCorrectionDates,
    },
    geometry: {
      publishedFeatures: features.length,
      polygonFeatures: parsed.rows.filter(row => row.geometry.type === 'Polygon').length,
      multiPolygonFeatures: parsed.rows.filter(row => row.geometry.type === 'MultiPolygon').length,
      positions: parsed.positions, rings: parsed.rings, sourcePositions: parsed.sourcePositions,
      sourceRings: parsed.sourceRings, sourceJstsValidFeatures: parsed.sourceJstsValidFeatures,
      sourceTurfBooleanValidFeatures: parsed.sourceTurfValidFeatures,
      topologyRepairMethod: 'clean-coordinates; JSTS 2.7.1 buffer zero for invalid input; 611 Turf buffer 0.000001 metre; 806 Turf buffer 0.001 metre then high-quality simplify 0.0000001 degree; 900 Turf buffer 0.000001 metre then high-quality simplify 0.00000001 degree',
      topologyRepairCodes: parsed.repairedCodes,
      topologyRepairCodeCount: parsed.repairedCodes.length,
      maximumRepairRelativeAreaDelta: parsed.maximumRepairRelativeAreaDelta,
      allPublishedJstsValid: true, allRingsClosed: true, allCoordinatesWithinIcelandBounds: true,
      overlapAudit: parsed.overlapAudit,
    },
    crs: {
      requestedAndPublished: 'EPSG:4326',
      metadataDeclaredSource: 'EPSG:8086',
      serviceCaveat: 'The EPSG:8086 request returned longitude/latitude degree values while labelling them EPSG:8086; the pinned publication query explicitly requests EPSG:4326 and matches the WGS84 service bbox.',
    },
    policy: {
      officialPostcodeRegisterAndGeometry: true, operatorDeliverabilityClaimed: false,
      addressOrBuildingRowsPublished: 0, recipientCustomerOrLandRightsRowsPublished: 0,
      inventedAreaRowsPublished: 0,
      sourceOverlapDisposition: 'preserve-source-surfaces-and-return-multiple-candidates',
    },
    artifacts: { graph: graphArtifact, geometry: geometryArtifact, descriptor: descriptorArtifact },
  };
  if (reportPath) writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

export { build, parsePostnumer };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sourcePath = resolve(process.argv[2] ?? '');
  const outputDirectory = resolve(process.argv[3] ?? join(ROOT, 'data/postal_country_packs/is/postal-context/m2'));
  const reportPath = process.argv[4] ? resolve(process.argv[4]) : undefined;
  if (!process.argv[2]) fail('usage-source-geojson-required');
  console.log(JSON.stringify(build({ sourcePath, outputDirectory, reportPath }), null, 2));
}

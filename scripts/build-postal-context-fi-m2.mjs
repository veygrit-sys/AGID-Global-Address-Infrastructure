import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import booleanValid from '@turf/boolean-valid';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PCF_DIGEST = 'sha256:becf89ecaa809ce66c2f6ca4316f01ab85bb107367416eb64b44d7f2ff5d039c';
const PAAVO_DIGEST = 'sha256:8cf635b677887906651a9612e69493905e8ff703b8030a9530b2023c2092868f';
const RELEASE_ID = 'fi-posti-pcf-20260829-paavo-pno-2026';
const RELEASE_INSTANT = '2026-08-29T00:00:00.000Z';
const KNOWN_INSTANT = '2026-08-30T05:10:43.249Z';
const LICENSE_ID = 'posti-pcf-terms-and-statistics-finland-cc-by-4.0';
const MAX_POSITIONS = 2_000_000;
const MAX_POSITIONS_PER_RING = 20_000;

function fail(message) {
  throw new Error(`fi-m2-${message}`);
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

function parsePcf(bytes) {
  if (sha256(bytes) !== PCF_DIGEST) fail('pcf-digest');
  const lines = bytes.toString('latin1').split(/\r?\n/u).filter(Boolean);
  const rows = lines.map((line, index) => {
    if (line.length !== 220) fail(`pcf-record-length-${index + 1}-${line.length}`);
    const row = {
      recordId: line.slice(0, 5),
      runningDate: line.slice(5, 13),
      code: line.slice(13, 18),
      nameFi: line.slice(18, 48).trim(),
      nameSv: line.slice(48, 78).trim(),
      effectiveDate: line.slice(102, 110),
      type: line.slice(110, 111),
      region: line.slice(111, 116),
      municipality: line.slice(176, 179),
    };
    if (row.recordId !== 'PONOT' || !/^\d{8}$/u.test(row.runningDate)
      || !/^\d{5}$/u.test(row.code) || !/^\d{8}$/u.test(row.effectiveDate)
      || !/^[1-8]$/u.test(row.type)) fail(`pcf-schema-${index + 1}`);
    return row;
  });
  if (new Set(rows.map(row => row.code)).size !== rows.length) fail('pcf-duplicate-code');
  if (new Set(rows.map(row => row.runningDate)).size !== 1 || rows[0]?.runningDate !== '20260829') {
    fail('pcf-running-date');
  }
  return rows;
}

function isAland(row) {
  return row.region === 'FI200' && /^22\d{3}$/u.test(row.code);
}

function nodeFeatureKind(type) {
  if (type === '1') return 'standard_area';
  if (type === '2') return 'po_box';
  if (type === '3') return 'organization';
  return 'route';
}

function countGeometryPositions(geometry) {
  let positions = 0;
  const visit = value => {
    if (!Array.isArray(value)) fail('geometry-coordinates');
    if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      if (!Number.isFinite(value[0]) || !Number.isFinite(value[1])
        || value[0] < -180 || value[0] > 180 || value[1] < -90 || value[1] > 90) {
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

function validateRings(geometry) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  for (const polygon of polygons) {
    if (!Array.isArray(polygon) || !polygon.length) fail('geometry-empty-polygon');
    for (const ring of polygon) {
      if (!Array.isArray(ring) || ring.length < 4 || ring.length > MAX_POSITIONS_PER_RING) fail('geometry-ring-size');
      const first = ring[0];
      const last = ring.at(-1);
      if (first[0] !== last[0] || first[1] !== last[1]) fail('geometry-open-ring');
    }
  }
}

function parsePaavo(bytes) {
  if (sha256(bytes) !== PAAVO_DIGEST) fail('paavo-digest');
  const collection = JSON.parse(bytes.toString('utf8'));
  if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) fail('paavo-feature-collection');
  const byCode = new Map();
  let positions = 0;
  let polygonFeatures = 0;
  let multiPolygonFeatures = 0;
  for (const feature of collection.features) {
    const code = String(feature.properties?.posti_alue ?? '');
    if (!/^\d{5}$/u.test(code) || feature.properties?.vuosi !== 2026 || byCode.has(code)) fail(`paavo-identity-${code}`);
    if (!['Polygon', 'MultiPolygon'].includes(feature.geometry?.type)) fail(`paavo-geometry-type-${code}`);
    validateRings(feature.geometry);
    positions += countGeometryPositions(feature.geometry);
    if (!booleanValid(feature)) fail(`paavo-invalid-geometry-${code}`);
    feature.geometry.type === 'Polygon' ? polygonFeatures += 1 : multiPolygonFeatures += 1;
    byCode.set(code, feature);
  }
  if (positions > MAX_POSITIONS) fail('paavo-position-budget');
  return { byCode, positions, polygonFeatures, multiPolygonFeatures };
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value)}\n`, 'utf8');
}

function writeJson(path, value) {
  const bytes = jsonBytes(value);
  writeFileSync(path, bytes);
  return { bytes, digest: sha256(bytes), byteLength: bytes.length };
}

function build({ pcfPath, paavoPath, outputDirectory, reportPath }) {
  const allPcf = parsePcf(readFileSync(pcfPath));
  const pcf = allPcf.filter(row => !isAland(row));
  const aland = allPcf.filter(isAland);
  const paavo = parsePaavo(readFileSync(paavoPath));
  const currentByCode = new Map(pcf.map(row => [row.code, row]));
  const normalCodes = new Set(pcf.filter(row => row.type === '1').map(row => row.code));
  const joinedCodes = [...normalCodes].filter(code => paavo.byCode.has(code)).sort();
  const normalCodesWithoutGeometry = [...normalCodes].filter(code => !paavo.byCode.has(code)).sort();
  const nonNormalCodes = pcf.filter(row => row.type !== '1').map(row => row.code).sort();
  const paavoCodesNotCurrentFi = [...paavo.byCode.keys()].filter(code => !currentByCode.has(code)).sort();
  const sourceDigest = sha256(Buffer.from(canonicalJson({ paavo: PAAVO_DIGEST, pcf: PCF_DIGEST }), 'utf8'));
  const source = {
    sourceId: 'fi-posti-pcf-20260829-paavo-pno-2026-display-derived',
    sourceType: 'derived',
    assignmentAuthority: 'official_postal_operator',
    geometryAuthority: 'derived_geometry',
    sourceVersion: 'Posti PCF 20260829 joined to Statistics Finland pno_2026 sea-extended statistical areas',
    sourceDate: '2026-08-29',
    licenseId: LICENSE_ID,
    digest: sourceDigest,
  };
  const validTime = { from: RELEASE_INSTANT, to: null };
  const knownTime = { from: KNOWN_INSTANT, to: null };
  const assignmentSource = {
    sourceId: 'fi-posti-pcf-20260829-assignment',
    sourceType: 'official',
    assignmentAuthority: 'official_postal_operator',
    geometryAuthority: 'none',
    sourceVersion: 'Posti PCF 20260829',
    sourceDate: '2026-08-29',
    licenseId: 'posti-postal-code-services-terms-2015-01-01',
    digest: PCF_DIGEST,
  };
  const countryNode = { id: 'country-fi', kind: 'administrative_area', featureKind: 'country', geometryType: 'none', countryCode: 'FI', label: 'Suomi / Finland', visibility: 'public' };
  const postalNodes = pcf.sort((a, b) => a.code.localeCompare(b.code)).map(row => {
    const geometry = paavo.byCode.get(row.code)?.geometry;
    const labels = [...new Set([row.nameFi, row.nameSv].filter(Boolean))];
    return {
      id: `postal-fi-${row.code}`,
      kind: 'postal_feature',
      featureKind: nodeFeatureKind(row.type),
      geometryType: row.type === '1' && geometry ? geometry.type.toLowerCase() : 'none',
      countryCode: 'FI',
      postalCode: row.code,
      label: labels.join(' / '),
      visibility: 'public',
    };
  });
  const nodes = [countryNode, ...postalNodes];
  const assertions = pcf.map(row => ({
    id: `posti-fi-20260829-${row.code}-part-of-fi`,
    fromNodeId: `postal-fi-${row.code}`,
    toNodeId: countryNode.id,
    relation: 'part_of',
    validTime,
    knownTime,
    source: assignmentSource,
    method: 'explicit_assignment',
    quality: { status: 'authoritative', confidence: 1, validatedAt: KNOWN_INSTANT },
  }));
  const features = joinedCodes.map(code => {
    const feature = paavo.byCode.get(code);
    return {
      id: `paavo-fi-2026-${code}`,
      nodeId: `postal-fi-${code}`,
      role: 'postal_area',
      publicationClass: 'public_context',
      geometry: feature.geometry,
      source,
      validTime,
      knownTime,
      quality: {
        status: 'derived',
        confidence: 0.95,
        validatedAt: KNOWN_INSTANT,
      },
    };
  });
  const publishedPositions = features.reduce((total, feature) => total + countGeometryPositions(feature.geometry), 0);
  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, {
    schemaVersion: 'postal-context-geometry/v0.1',
    countryCode: 'FI',
    releaseId: RELEASE_ID,
    features,
  });
  const graphRelease = {
    schemaVersion: 'postal-context-graph/v0.1',
    repositoryId: 'agid-postal-fi-posti-paavo',
    repositoryUrl: 'https://github.com/veygrit-sys/Address-Grid-ID',
    countryCode: 'FI',
    releaseId: RELEASE_ID,
    policyVersion: 'finland-posti-assignment-paavo-statistical-area-v1',
    releasedAt: RELEASE_INSTANT,
    validTime,
    manifestDigest: `sha256:${'0'.repeat(64)}`,
    artifacts: [{
      path: basename(geometryPath),
      mediaType: 'application/vnd.agid.postal-context-geometry+json',
      digest: geometryArtifact.digest,
      byteLength: geometryArtifact.byteLength,
      recordCount: features.length,
      licenseRefs: [LICENSE_ID],
    }],
  };
  const { manifestDigest: _placeholder, ...manifestPayload } = graphRelease;
  graphRelease.manifestDigest = sha256(Buffer.from(canonicalJson(manifestPayload), 'utf8'));
  const graphPath = join(outputDirectory, 'graph.json');
  const graphArtifact = writeJson(graphPath, {
    schemaVersion: 'postal-context-graph/v0.1',
    release: graphRelease,
    nodes,
    assertions,
  });
  const descriptorPath = join(outputDirectory, 'descriptor.json');
  const descriptorArtifact = writeJson(descriptorPath, {
    schemaVersion: 'postal-context-pack-descriptor/v0.1',
    repositoryId: graphRelease.repositoryId,
    countryCode: 'FI',
    releaseId: RELEASE_ID,
    policyVersion: graphRelease.policyVersion,
    sequence: 1,
    previousDescriptorDigest: null,
    graphManifestDigest: graphRelease.manifestDigest,
    createdAt: KNOWN_INSTANT,
    maturity: 'M2_experimental',
    synthetic: false,
    promotionEligible: true,
    containsResidentialAddressPoints: false,
    artifacts: [
      {
        role: 'graph',
        path: basename(graphPath),
        mediaType: 'application/vnd.agid.postal-context-graph+json',
        schemaVersion: 'postal-context-graph/v0.1',
        byteLength: graphArtifact.byteLength,
        digest: graphArtifact.digest,
        recordCounts: { nodes: nodes.length, assertions: assertions.length },
      },
      {
        role: 'geometry',
        path: basename(geometryPath),
        mediaType: 'application/vnd.agid.postal-context-geometry+json',
        schemaVersion: 'postal-context-geometry/v0.1',
        byteLength: geometryArtifact.byteLength,
        digest: geometryArtifact.digest,
        recordCounts: { features: features.length, positions: publishedPositions },
      },
    ],
  });
  const typeCounts = Object.fromEntries([...new Set(pcf.map(row => row.type))].sort()
    .map(type => [type, pcf.filter(row => row.type === type).length]));
  const report = {
    schemaVersion: 'postal-context-fi-m2-build/v1',
    countryCode: 'FI',
    generatedAt: KNOWN_INSTANT,
    releaseId: RELEASE_ID,
    inputs: {
      pcf: { digest: PCF_DIGEST, rows: allPcf.length, releaseDate: '20260829' },
      paavo: { digest: PAAVO_DIGEST, features: paavo.byCode.size, basisYear: 2026, variant: 'sea-extended' },
    },
    partition: { fiRows: pcf.length, alandRowsExcluded: aland.length, alandIdentityPreserved: true },
    assignment: { distinctCodes: pcf.length, typeCounts },
    geometry: {
      publishedFeatures: features.length,
      polygonFeatures: features.filter(feature => feature.geometry.type === 'Polygon').length,
      multiPolygonFeatures: features.filter(feature => feature.geometry.type === 'MultiPolygon').length,
      positions: publishedPositions,
      allPaavoFeaturesValidated: paavo.byCode.size,
      allPaavoPositionsValidated: paavo.positions,
      allPaavoPolygonFeatures: paavo.polygonFeatures,
      allPaavoMultiPolygonFeatures: paavo.multiPolygonFeatures,
    },
    join: {
      normalCodesWithGeometry: joinedCodes.length,
      normalCodesWithoutGeometry,
      nonNormalCodesWithoutGeometry: nonNormalCodes.length,
      paavoCodesNotCurrentFi,
    },
    policy: {
      paavoIsPostiDeliveryPerimeter: false,
      paavoIsOfficialDerivedStatisticalArea: true,
      nonAreaCodesReceiveInventedArea: false,
      addressOrBuildingRowsPublished: 0,
    },
    artifacts: {
      graph: { digest: graphArtifact.digest, byteLength: graphArtifact.byteLength },
      geometry: { digest: geometryArtifact.digest, byteLength: geometryArtifact.byteLength },
      descriptor: { digest: descriptorArtifact.digest, byteLength: descriptorArtifact.byteLength },
    },
  };
  if (reportPath) writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

export { build, parsePcf, parsePaavo };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const pcfPath = resolve(process.argv[2] ?? '');
  const paavoPath = resolve(process.argv[3] ?? '');
  const outputDirectory = resolve(process.argv[4] ?? join(ROOT, 'data/postal_country_packs/fi/postal-context/m2'));
  const reportPath = process.argv[5] ? resolve(process.argv[5]) : undefined;
  if (!process.argv[2] || !process.argv[3]) fail('usage-pcf-and-paavo-required');
  console.log(JSON.stringify(build({ pcfPath, paavoPath, outputDirectory, reportPath }), null, 2));
}

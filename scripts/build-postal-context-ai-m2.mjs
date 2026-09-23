import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  area,
  bbox,
  booleanDisjoint,
  booleanValid,
  feature,
  multiPolygon,
  polygon,
} from '@turf/turf';
import jsts from 'jsts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_ID = 'ai-upu-geoboundaries-20260831';
const RELEASE_INSTANT = '2026-08-31T06:30:16.139Z';
const POSTAL_VALID_FROM = '2026-08-01T00:00:00.000Z';
const SOURCE_COMMIT = '9469f09592ced973a3448cf66b6100b741b64c0d';
const SOURCE_DIGEST = 'sha256:6fa5dff75ac3ab9d8064c46a5b6ec1d4e307e67d033d100f0a4a6f4b3aac1237';
const UPU_GENERAL_DIGEST = 'sha256:ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d';
const EXPECTED_BOUNDS = [-63.42901273399514, 18.155156419596608, -62.926366790615475, 18.595112128484345];
const EXPECTED_PARTS = 28;
const EXPECTED_POSITIONS = 10606;
const EXPECTED_CONFLICTS = [[4, 5], [6, 15], [18, 19]];
const SECONDARY_PARTS = new Set([5, 15, 19]);
const GEOMETRY_LICENSE = 'CC-BY-4.0-geoboundaries';

function fail(message) {
  throw new Error(`ai-m2-${message}`);
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

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const bytes = Buffer.from(`${canonicalJson(value)}\n`, 'utf8');
  writeFileSync(path, bytes);
  return { path, byteLength: bytes.length, digest: sha256(bytes) };
}

function countPositions(geometry) {
  let positions = 0;
  const visit = value => {
    if (Array.isArray(value) && value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      positions += 1;
      return;
    }
    if (!Array.isArray(value)) fail('invalid-coordinate-tree');
    value.forEach(visit);
  };
  visit(geometry.coordinates);
  return positions;
}

function jstsValid(geometry) {
  return new jsts.operation.valid.IsValidOp(new jsts.io.GeoJSONReader().read(geometry)).isValid();
}

function arraysEqual(left, right, tolerance = 1e-12) {
  return left.length === right.length && left.every((value, index) => Math.abs(value - right[index]) <= tolerance);
}

function partIdentity(coordinates) {
  return JSON.stringify(coordinates);
}

function parseSource(bytes) {
  if (sha256(bytes) !== SOURCE_DIGEST) fail('source-digest');
  const collection = JSON.parse(bytes.toString('utf8'));
  if (collection?.type !== 'FeatureCollection' || collection.features?.length !== 1) fail('source-feature-collection');
  const source = collection.features[0];
  if (source?.geometry?.type !== 'MultiPolygon') fail('source-not-multipolygon');
  if (source.properties?.shapeName !== 'Anguilla'
    || source.properties?.shapeISO !== 'AIA'
    || source.properties?.shapeID !== '96724787B47890879031639'
    || source.properties?.shapeGroup !== 'AIA'
    || source.properties?.shapeType !== 'ADM0') fail('source-identity');

  const parts = source.geometry.coordinates;
  if (parts.length !== EXPECTED_PARTS) fail(`source-part-count-${parts.length}`);
  if (countPositions(source.geometry) !== EXPECTED_POSITIONS) fail('source-position-count');
  if (!arraysEqual(bbox(source), EXPECTED_BOUNDS)) fail('source-bounds');
  if (booleanValid(source)) fail('expected-source-turf-invalid');
  if (!jstsValid(source.geometry)) fail('expected-source-jsts-valid');

  const partFeatures = parts.map((coordinates, index) => {
    const item = polygon(coordinates, { sourcePart: index });
    if (!booleanValid(item) || !jstsValid(item.geometry)) fail(`source-part-invalid-${index}`);
    return item;
  });
  const conflicts = [];
  for (let left = 0; left < partFeatures.length; left += 1) {
    for (let right = left + 1; right < partFeatures.length; right += 1) {
      if (!booleanDisjoint(partFeatures[left], partFeatures[right])) conflicts.push([left, right]);
    }
  }
  if (JSON.stringify(conflicts) !== JSON.stringify(EXPECTED_CONFLICTS)) fail(`source-conflicts-${JSON.stringify(conflicts)}`);

  const primaryCoordinates = parts.filter((_part, index) => !SECONDARY_PARTS.has(index));
  const secondaryCoordinates = parts.filter((_part, index) => SECONDARY_PARTS.has(index));
  const primary = multiPolygon(primaryCoordinates);
  const secondary = multiPolygon(secondaryCoordinates);
  for (const [name, item] of [['primary', primary], ['secondary', secondary]]) {
    if (!booleanValid(item) || !jstsValid(item.geometry)) fail(`${name}-invalid`);
  }
  const outputParts = [...primary.geometry.coordinates, ...secondary.geometry.coordinates].map(partIdentity).sort();
  const inputParts = parts.map(partIdentity).sort();
  if (JSON.stringify(outputParts) !== JSON.stringify(inputParts)) fail('coordinate-or-part-mutation');
  if (countPositions(primary.geometry) + countPositions(secondary.geometry) !== EXPECTED_POSITIONS) fail('output-position-count');
  const sourceArea = area(source);
  const outputArea = area(primary) + area(secondary);
  if (Math.abs(sourceArea - outputArea) > 0.01) fail('area-preservation');
  const outputBounds = bbox(feature({
    type: 'MultiPolygon',
    coordinates: [...primary.geometry.coordinates, ...secondary.geometry.coordinates],
  }));
  if (!arraysEqual(outputBounds, EXPECTED_BOUNDS)) fail('output-bounds');

  return {
    geometries: [primary.geometry, secondary.geometry],
    conflicts,
    sourceArea,
    outputArea,
    sourceParts: parts.length,
    positions: EXPECTED_POSITIONS,
    bounds: outputBounds,
  };
}

function build({ sourcePath, outputDirectory, reportPath }) {
  const parsed = parseSource(readFileSync(sourcePath));
  const validTime = { from: POSTAL_VALID_FROM, to: null };
  const knownTime = { from: RELEASE_INSTANT, to: null };
  const assignmentSource = {
    sourceId: 'upu-universal-postcode-database-2026-08-ai',
    sourceType: 'official',
    assignmentAuthority: 'official_postal_dictionary',
    geometryAuthority: 'none',
    sourceVersion: 'Universal POST*CODE DataBase August 2026; Anguilla sheet 09/2017 corroborated current',
    sourceDate: '2026-08-20',
    licenseId: 'UPU-reference-only-no-redistribution',
    digest: UPU_GENERAL_DIGEST,
  };
  const geometrySource = {
    sourceId: 'geoboundaries-gbopen-aia-adm0-9469f095-derived-whole-territory',
    sourceType: 'derived',
    assignmentAuthority: 'derived_spatial_assignment',
    geometryAuthority: 'derived_geometry',
    sourceVersion: `AIA-ADM0-96724787; boundary year 2021; build 2023-12-12; commit ${SOURCE_COMMIT}; UPU AI-2640 whole-territory scope; coordinate-preserving multipart partition`,
    sourceDate: '2021',
    licenseId: GEOMETRY_LICENSE,
    digest: SOURCE_DIGEST,
  };
  const countryNode = {
    id: 'country-ai', kind: 'administrative_area', featureKind: 'country', geometryType: 'none',
    countryCode: 'AI', label: 'Anguilla', visibility: 'public',
  };
  const postalNode = {
    id: 'postal-ai-ai-2640', kind: 'postal_feature', featureKind: 'standard_area', geometryType: 'multipolygon',
    countryCode: 'AI', postalCode: 'AI-2640', label: 'AI-2640 whole-territory derived display surface', visibility: 'public',
  };
  const nodes = [countryNode, postalNode];
  const assertions = [{
    id: 'upu-ai-20260820-ai-2640-admin-within-ai', fromNodeId: postalNode.id, toNodeId: countryNode.id,
    relation: 'admin_within', validTime, knownTime, source: assignmentSource,
    method: 'source_relation', quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT },
  }];
  const features = parsed.geometries.map((geometry, index) => ({
    id: `geoboundaries-ai-2021-ai-2640-surface-${index + 1}`,
    nodeId: postalNode.id, role: 'postal_area', publicationClass: 'public_context', geometry,
    source: geometrySource, validTime, knownTime,
    quality: { status: 'derived', confidence: 0.92, accuracyMeters: 10, validatedAt: RELEASE_INSTANT },
  }));

  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, {
    schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'AI', releaseId: RELEASE_ID, features,
  });
  const graphRelease = {
    schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-ai-upu-geoboundaries',
    repositoryUrl: 'https://github.com/veygrit-sys/Address-Grid-ID', countryCode: 'AI', releaseId: RELEASE_ID,
    policyVersion: 'anguilla-upu-whole-territory-derived-display-v1', releasedAt: RELEASE_INSTANT,
    validTime, manifestDigest: `sha256:${'0'.repeat(64)}`,
    artifacts: [{
      path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json',
      digest: geometryArtifact.digest, byteLength: geometryArtifact.byteLength,
      recordCount: features.length, licenseRefs: [GEOMETRY_LICENSE],
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
    countryCode: 'AI', releaseId: RELEASE_ID, policyVersion: graphRelease.policyVersion,
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
    schemaVersion: 'postal-context-ai-m2-build/v1', countryCode: 'AI', generatedAt: RELEASE_INSTANT,
    releaseId: RELEASE_ID,
    input: { sourceId: geometrySource.sourceId, digest: SOURCE_DIGEST, commit: SOURCE_COMMIT,
      boundaryId: 'AIA-ADM0-96724787', boundaryYear: 2021, sourceParts: parsed.sourceParts,
      positions: parsed.positions, bounds: parsed.bounds },
    officialPostalEvidence: { postalCode: 'AI-2640', scope: 'single-postcode-for-whole-territory',
      currentEdition: 'Universal POST*CODE DataBase August 2026', digest: UPU_GENERAL_DIGEST,
      authority: 'official_postal_dictionary', geometryAuthority: 'none' },
    transformation: { method: 'coordinate-preserving-multipart-partition',
      sourceConflictPairs: parsed.conflicts, secondaryPartIndices: [...SECONDARY_PARTS],
      outputMultiPolygons: features.length, sourceAreaSquareKilometres: parsed.sourceArea / 1e6,
      outputAreaSquareKilometres: parsed.outputArea / 1e6,
      areaDeltaSquareMetres: Math.abs(parsed.sourceArea - parsed.outputArea),
      allCoordinatesPreserved: true, allOutputTurfValid: true, allOutputJstsValid: true },
    policy: { outputProvenance: 'derived', officialPostalGeometryClaimed: false,
      addressOrBuildingRowsPublished: 0, recipientCustomerOrLandRightsRowsPublished: 0,
      pocdsZonesPublishedAsPostcodes: 0, inventedAreaRowsPublished: 0 },
    artifacts: { graph: graphArtifact, geometry: geometryArtifact, descriptor: descriptorArtifact },
  };
  if (reportPath) {
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }
  return report;
}

export { build, parseSource };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sourcePath = resolve(process.argv[2] ?? '');
  const outputDirectory = resolve(process.argv[3] ?? join(ROOT, 'data/postal_country_packs/ai/postal-context/m2'));
  const reportPath = process.argv[4] ? resolve(process.argv[4]) : undefined;
  if (!process.argv[2]) fail('usage-source-geojson-required');
  console.log(JSON.stringify(build({ sourcePath, outputDirectory, reportPath }), null, 2));
}

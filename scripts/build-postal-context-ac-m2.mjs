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
const RELEASE_ID = 'ac-upu-geoboundaries-20260903';
const RELEASE_INSTANT = '2026-09-02T18:44:27.714Z';
const POSTAL_VALID_FROM = '2026-08-01T00:00:00.000Z';
const SOURCE_COMMIT = '9469f09592ced973a3448cf66b6100b741b64c0d';
const SOURCE_DIGEST = 'sha256:94c9e525d8f9c12fc1f643f8c61b5f03323587e10d01b8c3109269b4349aa27e';
const UPU_GENERAL_DIGEST = 'sha256:ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d';
const EXPECTED_SOURCE_PARTS = 47;
const EXPECTED_SOURCE_POSITIONS = 7854;
const EXPECTED_AC_PART_INDICES = [44, 45, 46];
const EXPECTED_AC_POSITIONS = 1261;
const EXPECTED_AC_BOUNDS = [-14.420263125670147, -7.992611073283626, -14.294916449140885, -7.88966415023782];
const EXPECTED_CONFLICTS = [[44, 46]];
const SECONDARY_PARTS = new Set([44]);
const GEOMETRY_LICENSE = 'CC-BY-4.0-geoboundaries';

function fail(message) {
  throw new Error(`ac-m2-${message}`);
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

function inAscensionEnvelope(coordinates) {
  const bounds = bbox(polygon(coordinates));
  return bounds[0] > -15 && bounds[2] < -14 && bounds[1] > -9 && bounds[3] < -7;
}

function parseSource(bytes) {
  if (sha256(bytes) !== SOURCE_DIGEST) fail('source-digest');
  const collection = JSON.parse(bytes.toString('utf8'));
  if (collection?.type !== 'FeatureCollection' || collection.features?.length !== 1) fail('source-feature-collection');
  const source = collection.features[0];
  if (source?.geometry?.type !== 'MultiPolygon') fail('source-not-multipolygon');
  if (source.properties?.shapeName !== 'Saint Helena, Ascension, and Tristan da Cunha'
    || source.properties?.shapeISO !== 'SHN'
    || source.properties?.shapeID !== '31036641B33738317050801'
    || source.properties?.shapeGroup !== 'SHN'
    || source.properties?.shapeType !== 'ADM0') fail('source-identity');

  const parts = source.geometry.coordinates;
  if (parts.length !== EXPECTED_SOURCE_PARTS) fail(`source-part-count-${parts.length}`);
  if (countPositions(source.geometry) !== EXPECTED_SOURCE_POSITIONS) fail('source-position-count');
  const ascensionIndices = parts.flatMap((coordinates, index) => inAscensionEnvelope(coordinates) ? [index] : []);
  if (JSON.stringify(ascensionIndices) !== JSON.stringify(EXPECTED_AC_PART_INDICES)) {
    fail(`ascension-parts-${JSON.stringify(ascensionIndices)}`);
  }
  const selectedParts = ascensionIndices.map(index => parts[index]);
  const selectedGeometry = multiPolygon(selectedParts);
  if (countPositions(selectedGeometry.geometry) !== EXPECTED_AC_POSITIONS) fail('ascension-position-count');
  if (!arraysEqual(bbox(selectedGeometry), EXPECTED_AC_BOUNDS)) fail('ascension-bounds');
  if (booleanValid(selectedGeometry)) fail('expected-cross-part-conflict');
  if (!jstsValid(selectedGeometry.geometry)) fail('expected-selected-jsts-valid');

  const partFeatures = ascensionIndices.map(index => {
    const item = polygon(parts[index], { sourcePart: index });
    if (!booleanValid(item) || !jstsValid(item.geometry)) fail(`source-part-invalid-${index}`);
    return item;
  });
  const conflicts = [];
  for (let left = 0; left < partFeatures.length; left += 1) {
    for (let right = left + 1; right < partFeatures.length; right += 1) {
      if (!booleanDisjoint(partFeatures[left], partFeatures[right])) {
        conflicts.push([ascensionIndices[left], ascensionIndices[right]]);
      }
    }
  }
  if (JSON.stringify(conflicts) !== JSON.stringify(EXPECTED_CONFLICTS)) fail(`source-conflicts-${JSON.stringify(conflicts)}`);

  const primaryIndices = ascensionIndices.filter(index => !SECONDARY_PARTS.has(index));
  const secondaryIndices = ascensionIndices.filter(index => SECONDARY_PARTS.has(index));
  const primary = multiPolygon(primaryIndices.map(index => parts[index]));
  const secondary = multiPolygon(secondaryIndices.map(index => parts[index]));
  for (const [name, item] of [['primary', primary], ['secondary', secondary]]) {
    if (!booleanValid(item) || !jstsValid(item.geometry)) fail(`${name}-invalid`);
  }
  const outputParts = [...primary.geometry.coordinates, ...secondary.geometry.coordinates].map(partIdentity).sort();
  const inputParts = selectedParts.map(partIdentity).sort();
  if (JSON.stringify(outputParts) !== JSON.stringify(inputParts)) fail('coordinate-or-part-mutation');
  if (countPositions(primary.geometry) + countPositions(secondary.geometry) !== EXPECTED_AC_POSITIONS) fail('output-position-count');
  const sourceArea = area(selectedGeometry);
  const outputArea = area(primary) + area(secondary);
  if (Math.abs(sourceArea - outputArea) > 0.01) fail('area-preservation');
  const outputBounds = bbox(feature({
    type: 'MultiPolygon',
    coordinates: [...primary.geometry.coordinates, ...secondary.geometry.coordinates],
  }));
  if (!arraysEqual(outputBounds, EXPECTED_AC_BOUNDS)) fail('output-bounds');

  return {
    geometries: [primary.geometry, secondary.geometry],
    conflicts,
    selectedIndices: ascensionIndices,
    sourceArea,
    outputArea,
    sourceParts: parts.length,
    selectedParts: selectedParts.length,
    sourcePositions: EXPECTED_SOURCE_POSITIONS,
    positions: EXPECTED_AC_POSITIONS,
    bounds: outputBounds,
  };
}

function build({ sourcePath, outputDirectory, reportPath }) {
  const parsed = parseSource(readFileSync(sourcePath));
  const validTime = { from: POSTAL_VALID_FROM, to: null };
  const knownTime = { from: RELEASE_INSTANT, to: null };
  const assignmentSource = {
    sourceId: 'upu-universal-postcode-database-2026-08-ac',
    sourceType: 'official',
    assignmentAuthority: 'official_postal_dictionary',
    geometryAuthority: 'none',
    sourceVersion: 'Universal POST*CODE DataBase August 2026; Ascension Island Government current use corroborated',
    sourceDate: '2026-08-20',
    licenseId: 'UPU-reference-only-no-redistribution',
    digest: UPU_GENERAL_DIGEST,
  };
  const geometrySource = {
    sourceId: 'geoboundaries-gbopen-shn-adm0-9469f095-ac-subset',
    sourceType: 'derived',
    assignmentAuthority: 'derived_spatial_assignment',
    geometryAuthority: 'derived_geometry',
    sourceVersion: `SHN-ADM0-31036641; Ascension source parts 44-46; boundary year 2021; build 2023-12-12; commit ${SOURCE_COMMIT}; coordinate-preserving geographic subset and multipart partition`,
    sourceDate: '2021',
    licenseId: GEOMETRY_LICENSE,
    digest: SOURCE_DIGEST,
  };
  const countryNode = {
    id: 'country-ac', kind: 'administrative_area', featureKind: 'country', geometryType: 'none',
    countryCode: 'AC', label: 'Ascension Island', visibility: 'public',
  };
  const postalNode = {
    id: 'postal-ac-ascn-1zz', kind: 'postal_feature', featureKind: 'standard_area', geometryType: 'multipolygon',
    countryCode: 'AC', postalCode: 'ASCN 1ZZ', label: 'ASCN 1ZZ whole-territory derived display surface', visibility: 'public',
  };
  const nodes = [countryNode, postalNode];
  const assertions = [{
    id: 'upu-ac-20260820-ascn-1zz-admin-within-ac', fromNodeId: postalNode.id, toNodeId: countryNode.id,
    relation: 'admin_within', validTime, knownTime, source: assignmentSource,
    method: 'source_relation', quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT },
  }];
  const features = parsed.geometries.map((geometry, index) => ({
    id: `geoboundaries-ac-2021-ascn-1zz-surface-${index + 1}`,
    nodeId: postalNode.id, role: 'postal_area', publicationClass: 'public_context', geometry,
    source: geometrySource, validTime, knownTime,
    quality: { status: 'derived', confidence: 0.91, accuracyMeters: 10, validatedAt: RELEASE_INSTANT },
  }));

  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, {
    schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'AC', releaseId: RELEASE_ID, features,
  });
  const graphRelease = {
    schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-ac-upu-geoboundaries',
    repositoryUrl: 'https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure', countryCode: 'AC', releaseId: RELEASE_ID,
    policyVersion: 'ascension-upu-whole-territory-derived-display-v1', releasedAt: RELEASE_INSTANT,
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
    countryCode: 'AC', releaseId: RELEASE_ID, policyVersion: graphRelease.policyVersion,
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
    schemaVersion: 'postal-context-ac-m2-build/v1', countryCode: 'AC', generatedAt: RELEASE_INSTANT,
    releaseId: RELEASE_ID,
    input: { sourceId: geometrySource.sourceId, digest: SOURCE_DIGEST, commit: SOURCE_COMMIT,
      boundaryId: 'SHN-ADM0-31036641', boundaryYear: 2021, sourceParts: parsed.sourceParts,
      sourcePositions: parsed.sourcePositions, selectedPartIndices: parsed.selectedIndices,
      selectedParts: parsed.selectedParts, positions: parsed.positions, bounds: parsed.bounds },
    officialPostalEvidence: { postalCode: 'ASCN 1ZZ', scope: 'single-postcode-for-whole-territory',
      currentEdition: 'Universal POST*CODE DataBase August 2026', digest: UPU_GENERAL_DIGEST,
      authority: 'official_postal_dictionary', geometryAuthority: 'none' },
    transformation: { method: 'coordinate-preserving-geographic-subset-and-multipart-partition',
      sourceConflictPairs: parsed.conflicts, secondaryPartIndices: [...SECONDARY_PARTS],
      outputMultiPolygons: features.length, sourceAreaSquareKilometres: parsed.sourceArea / 1e6,
      outputAreaSquareKilometres: parsed.outputArea / 1e6,
      areaDeltaSquareMetres: Math.abs(parsed.sourceArea - parsed.outputArea),
      allCoordinatesPreserved: true, allOutputTurfValid: true, allOutputJstsValid: true },
    policy: { outputProvenance: 'derived', officialPostalGeometryClaimed: false,
      addressOrBuildingRowsPublished: 0, recipientCustomerOrLandRightsRowsPublished: 0,
      inventedAreaRowsPublished: 0, shnIdentityMergedIntoAc: false },
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
  const outputDirectory = resolve(process.argv[3] ?? join(ROOT, 'data/postal_country_packs/ac/postal-context/m2'));
  const reportPath = process.argv[4] ? resolve(process.argv[4]) : undefined;
  if (!process.argv[2]) fail('usage-source-geojson-required');
  console.log(JSON.stringify(build({ sourcePath, outputDirectory, reportPath }), null, 2));
}

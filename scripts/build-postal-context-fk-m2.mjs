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
const RELEASE_ID = 'fk-upu-geoboundaries-20260901';
const RELEASE_INSTANT = '2026-09-01T01:11:41.684Z';
const POSTAL_VALID_FROM = '2026-08-01T00:00:00.000Z';
const SOURCE_COMMIT = '9469f09592ced973a3448cf66b6100b741b64c0d';
const SOURCE_DIGEST = 'sha256:4f584a9a08910fe7b3dd3fd7f279f84928646c37045ec3d199c184093b3c231b';
const UPU_GENERAL_DIGEST = 'sha256:ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d';
const UPU_FK_SHEET_DIGEST = 'sha256:315549e7306f606adf348c33bc2abaf3e474001e9a4146138b5e829f7d353a5d';
const EXPECTED_BOUNDS = [-61.45701982833657, -52.91753437962251, -57.7172582353046, -50.99732409384637];
const EXPECTED_PARTS = 394;
const EXPECTED_POSITIONS = 16194;
const EXPECTED_OUTER_POSITIONS = 13250;
const EXPECTED_INTERIOR_RINGS = 488;
const EXPECTED_INTERIOR_POSITIONS = 2944;
const SOURCE_CONFLICTS = [[155, 348], [221, 222], [382, 383]];
const EXPECTED_DISPLAY_CONFLICTS = [[150, 348], [155, 348], [169, 348], [179, 348], [221, 222], [382, 383]];
const SECONDARY_PARTS = new Set([222, 348, 383]);
const GEOMETRY_LICENSE = 'CC-BY-4.0-geoboundaries';

function fail(message) {
  throw new Error(`fk-m2-${message}`);
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
  return { path: basename(path), byteLength: bytes.length, digest: sha256(bytes) };
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
  if (source.properties?.shapeName !== 'Falkland Islands'
    || source.properties?.shapeISO !== 'FLK'
    || source.properties?.shapeID !== '20895774B50741851066463'
    || source.properties?.shapeGroup !== 'FLK'
    || source.properties?.shapeType !== 'ADM0') fail('source-identity');

  const parts = source.geometry.coordinates;
  if (parts.length !== EXPECTED_PARTS) fail(`source-part-count-${parts.length}`);
  if (countPositions(source.geometry) !== EXPECTED_POSITIONS) fail('source-position-count');
  if (!arraysEqual(bbox(source), EXPECTED_BOUNDS)) fail('source-bounds');
  if (booleanValid(source)) fail('expected-source-turf-invalid');
  if (!jstsValid(source.geometry)) fail('expected-source-jsts-valid');

  const interiorRings = parts.reduce((sum, item) => sum + Math.max(0, item.length - 1), 0);
  const interiorPositions = parts.reduce((sum, item) => sum
    + countPositions({ coordinates: item.slice(1) }), 0);
  if (interiorRings !== EXPECTED_INTERIOR_RINGS) fail(`source-interior-ring-count-${interiorRings}`);
  if (interiorPositions !== EXPECTED_INTERIOR_POSITIONS) fail(`source-interior-position-count-${interiorPositions}`);
  const displayParts = parts.map(item => [item[0]]);
  if (countPositions({ coordinates: displayParts }) !== EXPECTED_OUTER_POSITIONS) fail('source-outer-position-count');

  const partFeatures = displayParts.map((coordinates, index) => {
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
  if (JSON.stringify(conflicts) !== JSON.stringify(EXPECTED_DISPLAY_CONFLICTS)) fail(`source-conflicts-${JSON.stringify(conflicts)}`);

  const primaryCoordinates = displayParts.filter((_part, index) => !SECONDARY_PARTS.has(index));
  const secondaryCoordinates = displayParts.filter((_part, index) => SECONDARY_PARTS.has(index));
  const primary = multiPolygon(primaryCoordinates);
  const secondary = multiPolygon(secondaryCoordinates);
  for (const [name, item] of [['primary', primary], ['secondary', secondary]]) {
    if (!booleanValid(item) || !jstsValid(item.geometry)) fail(`${name}-invalid`);
  }
  const outputParts = [...primary.geometry.coordinates, ...secondary.geometry.coordinates].map(partIdentity).sort();
  const inputDisplayParts = displayParts.map(partIdentity).sort();
  if (JSON.stringify(outputParts) !== JSON.stringify(inputDisplayParts)) fail('outer-coordinate-or-part-mutation');
  if (countPositions(primary.geometry) + countPositions(secondary.geometry) !== EXPECTED_OUTER_POSITIONS) fail('output-position-count');
  const sourceArea = area(source);
  const outputArea = area(primary) + area(secondary);
  if (outputArea <= sourceArea) fail('expected-interior-water-fill-area');
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
    sourcePositions: EXPECTED_POSITIONS,
    outputPositions: EXPECTED_OUTER_POSITIONS,
    omittedInteriorRings: EXPECTED_INTERIOR_RINGS,
    omittedInteriorPositions: EXPECTED_INTERIOR_POSITIONS,
    bounds: outputBounds,
  };
}

function build({ sourcePath, outputDirectory, reportPath }) {
  const parsed = parseSource(readFileSync(sourcePath));
  const validTime = { from: POSTAL_VALID_FROM, to: null };
  const knownTime = { from: RELEASE_INSTANT, to: null };
  const assignmentSource = {
    sourceId: 'upu-fk-single-postcode-fiqq-resolution-2026-09',
    sourceType: 'official',
    assignmentAuthority: 'official_postal_dictionary',
    geometryAuthority: 'none',
    sourceVersion: 'Universal POST*CODE DataBase August 2026 whole-territory scope; FK sheet 08/2005 and current official addresses resolve FIQQ 1ZZ; general-table F1QQ 1ZZ retained as a source exception',
    sourceDate: '2026-08-20',
    licenseId: 'UPU-reference-only-no-redistribution',
    digest: UPU_FK_SHEET_DIGEST,
  };
  const geometrySource = {
    sourceId: 'geoboundaries-gbopen-flk-adm0-9469f095-simplified-derived-whole-territory',
    sourceType: 'derived',
    assignmentAuthority: 'derived_spatial_assignment',
    geometryAuthority: 'derived_geometry',
    sourceVersion: `FLK-ADM0-20895774; gbOpen 2021; commit ${SOURCE_COMMIT}; FIQQ 1ZZ whole-territory; source outer rings only; multipart partition`,
    sourceDate: '2021',
    licenseId: GEOMETRY_LICENSE,
    digest: SOURCE_DIGEST,
  };
  const countryNode = {
    id: 'country-fk', kind: 'administrative_area', featureKind: 'country', geometryType: 'none',
    countryCode: 'FK', label: 'Falkland Islands', visibility: 'public',
  };
  const postalNode = {
    id: 'postal-fk-fiqq-1zz', kind: 'postal_feature', featureKind: 'standard_area', geometryType: 'multipolygon',
    countryCode: 'FK', postalCode: 'FIQQ 1ZZ', label: 'FIQQ 1ZZ whole-territory derived display surface', visibility: 'public',
  };
  const nodes = [countryNode, postalNode];
  const assertions = [{
    id: 'upu-fk-20260820-fiqq-1zz-admin-within-fk', fromNodeId: postalNode.id, toNodeId: countryNode.id,
    relation: 'admin_within', validTime, knownTime, source: assignmentSource,
    method: 'source_relation', quality: { status: 'authoritative', confidence: 0.99, validatedAt: RELEASE_INSTANT },
  }];
  const features = parsed.geometries.map((geometry, index) => ({
    id: `geoboundaries-fk-2021-fiqq-1zz-surface-${index + 1}`,
    nodeId: postalNode.id, role: 'postal_area', publicationClass: 'public_context', geometry,
    source: geometrySource, validTime, knownTime,
    quality: { status: 'derived', confidence: 0.9, validatedAt: RELEASE_INSTANT },
  }));

  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, {
    schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'FK', releaseId: RELEASE_ID, features,
  });
  const graphRelease = {
    schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-fk-upu-geoboundaries',
    repositoryUrl: 'https://github.com/veygrit-sys/Address-Grid-ID', countryCode: 'FK', releaseId: RELEASE_ID,
    policyVersion: 'falkland-islands-upu-whole-territory-derived-display-v1', releasedAt: RELEASE_INSTANT,
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
    countryCode: 'FK', releaseId: RELEASE_ID, policyVersion: graphRelease.policyVersion,
    sequence: 1, previousDescriptorDigest: null, graphManifestDigest: graphRelease.manifestDigest,
    createdAt: RELEASE_INSTANT, maturity: 'M2_experimental', synthetic: false,
    promotionEligible: true, containsResidentialAddressPoints: false,
    artifacts: [
      { role: 'graph', path: basename(graphPath), mediaType: 'application/vnd.agid.postal-context-graph+json',
        schemaVersion: 'postal-context-graph/v0.1', byteLength: graphArtifact.byteLength,
        digest: graphArtifact.digest, recordCounts: { nodes: nodes.length, assertions: assertions.length } },
      { role: 'geometry', path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json',
        schemaVersion: 'postal-context-geometry/v0.1', byteLength: geometryArtifact.byteLength,
        digest: geometryArtifact.digest, recordCounts: { features: features.length, positions: parsed.outputPositions } },
    ],
  });
  const report = {
    schemaVersion: 'postal-context-fk-m2-build/v1', countryCode: 'FK', generatedAt: RELEASE_INSTANT,
    releaseId: RELEASE_ID,
    input: { sourceId: geometrySource.sourceId, digest: SOURCE_DIGEST, commit: SOURCE_COMMIT,
      boundaryId: 'FLK-ADM0-20895774', boundaryYear: 2021, sourceParts: parsed.sourceParts,
      sourcePositions: parsed.sourcePositions, bounds: parsed.bounds, representation: 'simplified-geojson' },
    officialPostalEvidence: { postalCode: 'FIQQ 1ZZ', scope: 'single-postcode-for-whole-territory',
      currentEdition: 'Universal POST*CODE DataBase August 2026', generalDigest: UPU_GENERAL_DIGEST,
      countrySheetEdition: '08/2005', countrySheetDigest: UPU_FK_SHEET_DIGEST,
      catalogException: 'The August 2026 general table prints F1QQ 1ZZ; the country sheet and current official government addresses consistently use FIQQ 1ZZ, which is retained as canonical.',
      authority: 'official_postal_dictionary', geometryAuthority: 'none' },
    transformation: { method: 'outer-ring-only-and-coordinate-preserving-multipart-partition',
      sourceConflictPairs: SOURCE_CONFLICTS, displayConflictPairsAfterInteriorWaterFill: parsed.conflicts, secondaryPartIndices: [...SECONDARY_PARTS].sort((a, b) => a - b),
      outputMultiPolygons: features.length, sourceAreaSquareKilometres: parsed.sourceArea / 1e6,
      outputAreaSquareKilometres: parsed.outputArea / 1e6,
      interiorWaterFillSquareKilometres: (parsed.outputArea - parsed.sourceArea) / 1e6,
      outputPositions: parsed.outputPositions,
      omittedInteriorRings: parsed.omittedInteriorRings,
      omittedInteriorPositions: parsed.omittedInteriorPositions,
      allOutputCoordinatesFromSource: true, allSourceOuterCoordinatesPreserved: true,
      allOutputTurfValid: true, allOutputJstsValid: true },
    policy: { outputProvenance: 'derived', officialPostalGeometryClaimed: false,
      addressOrBuildingRowsPublished: 0, recipientCustomerOrLandRightsRowsPublished: 0,
      administrativeIdentityChangedOrMerged: false, inventedAreaRowsPublished: 0 },
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
  const outputDirectory = resolve(process.argv[3] ?? join(ROOT, 'data/postal_country_packs/fk/postal-context/m2'));
  const reportPath = process.argv[4] ? resolve(process.argv[4]) : undefined;
  if (!process.argv[2]) fail('usage-source-geojson-required');
  console.log(JSON.stringify(build({ sourcePath, outputDirectory, reportPath }), null, 2));
}

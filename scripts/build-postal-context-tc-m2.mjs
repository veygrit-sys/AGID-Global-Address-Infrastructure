import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { area, bbox, booleanValid, feature } from '@turf/turf';
import jsts from 'jsts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_ID = 'tc-upu-decr-shoreline-20260902';
const RELEASE_INSTANT = '2026-09-02T08:30:58.215Z';
const POSTAL_VALID_FROM = '2025-10-01T00:00:00.000Z';
const SOURCE_DIGEST = 'sha256:92a1fc68840bd3bd049e10e262610db31e92cb77e693b078dd74a1824149ba94';
const CKAN_METADATA_DIGEST = 'sha256:15f214ae2c43e62f6aa514b1f94373c1a5a7e2d27d6fbfaeadeea4e03c5bd1f7';
const UPU_TC_DIGEST = 'sha256:81411e006295b278736bdde53996cfcfa193ee3b27f6ea9b6764ef5f7f19cb48';
const UPU_GENERAL_DIGEST = 'sha256:ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d';
const EXPECTED_BOUNDS = [-72.48277771282113, 21.17765818467751, -71.07836651670135, 21.96261140975546];
const EXPECTED_OUTPUT_BOUNDS = [-72.48277771282113, 21.17765818467751, -71.07836651670135, 21.962492454937887];
const EXPECTED_FEATURES = 861;
const EXPECTED_PARTS = 861;
const EXPECTED_RINGS = 871;
const EXPECTED_POSITIONS = 253775;
const EXPECTED_REGIONS = 27;
const SOURCE_INVALID_OBJECT_IDS = [717];
const SIMPLIFICATION_TOLERANCE_DEGREES = 0.0005;
const GEOMETRY_LICENSE = 'CC-BY-SA-UNVERSIONED-dataportal.gov.tc';
const RING_AREA_EPSILON = 1e-12;

function fail(message) {
  throw new Error(`tc-m2-${message}`);
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

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function arraysEqual(left, right, tolerance = 1e-12) {
  return left.length === right.length && left.every((value, index) => Math.abs(value - right[index]) <= tolerance);
}

function toMultiPolygon(value) {
  const geometry = value.type === 'Polygon'
    ? { type: 'MultiPolygon', coordinates: [value.coordinates] }
    : value;
  if (geometry.type !== 'MultiPolygon') fail(`unexpected-output-${geometry.type}`);
  return geometry;
}

function jstsValid(geometry) {
  return new jsts.operation.valid.IsValidOp(new jsts.io.GeoJSONReader().read(geometry)).isValid();
}

function signedRingArea(ring) {
  let twiceArea = 0;
  for (let index = 1; index < ring.length; index += 1) {
    const previous = ring[index - 1];
    const current = ring[index];
    twiceArea += previous[0] * current[1] - current[0] * previous[1];
  }
  return twiceArea / 2;
}

function removeSimplificationDegeneracies(geometry, identity, removed) {
  const coordinates = [];
  for (const [partIndex, polygon] of geometry.coordinates.entries()) {
    const rings = polygon.filter((ring, ringIndex) => {
      const keep = Math.abs(signedRingArea(ring)) > RING_AREA_EPSILON;
      if (!keep) removed.push(`${identity}:${partIndex}:${ringIndex}`);
      return keep;
    });
    if (rings.length > 0 && rings[0] === polygon[0]) coordinates.push(rings);
  }
  if (coordinates.length === 0) return null;
  return { type: 'MultiPolygon', coordinates };
}

function coordinateStats(geometry) {
  let positions = 0;
  let rings = 0;
  let parts = 0;
  let maximumRingPositions = 0;
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  for (const polygon of geometry.coordinates) {
    parts += 1;
    for (const ring of polygon) {
      rings += 1;
      maximumRingPositions = Math.max(maximumRingPositions, ring.length);
      if (ring.length < 4 || JSON.stringify(ring[0]) !== JSON.stringify(ring.at(-1))) fail('open-or-short-ring');
      for (const position of ring) {
        if (!Array.isArray(position) || position.length < 2 || !position.slice(0, 2).every(Number.isFinite)) fail('non-finite-position');
        positions += 1;
        bounds[0] = Math.min(bounds[0], position[0]);
        bounds[1] = Math.min(bounds[1], position[1]);
        bounds[2] = Math.max(bounds[2], position[0]);
        bounds[3] = Math.max(bounds[3], position[1]);
      }
    }
  }
  return { positions, rings, parts, maximumRingPositions, bounds };
}

function repairAndSimplify(jstsGeometry, objectId, outputRepairs, removedDegenerateRings) {
  let geometry = jstsGeometry;
  if (!new jsts.operation.valid.IsValidOp(geometry).isValid()) geometry = geometry.buffer(0);
  geometry = jsts.simplify.TopologyPreservingSimplifier.simplify(
    geometry,
    SIMPLIFICATION_TOLERANCE_DEGREES,
  );
  let output = toMultiPolygon(new jsts.io.GeoJSONWriter().write(geometry));
  output = removeSimplificationDegeneracies(output, objectId, removedDegenerateRings);
  if (!output) return null;
  const outputFeature = () => feature(output);
  if (!booleanValid(outputFeature()) || !jstsValid(output)) {
    output = toMultiPolygon(new jsts.io.GeoJSONWriter().write(
      new jsts.io.GeoJSONReader().read(output).buffer(0),
    ));
    outputRepairs.push(objectId);
  }
  if (!booleanValid(outputFeature()) || !jstsValid(output)) fail(`invalid-output-${objectId}`);
  return output;
}

function bundleRuntimeGeometry(output) {
  const groups = [];
  for (const item of output) {
    let placed = false;
    const candidates = groups.map((items, index) => ({ items, index }))
      .sort((left, right) => left.items.length - right.items.length || left.index - right.index);
    for (const candidate of candidates) {
      const proposed = [...candidate.items, item];
      const geometry = { type: 'MultiPolygon', coordinates: proposed.flatMap(entry => entry.geometry.coordinates) };
      if (booleanValid(feature(geometry)) && jstsValid(geometry)) {
        candidate.items.push(item);
        placed = true;
        break;
      }
    }
    if (!placed) groups.push([item]);
  }
  if (groups.length > 16) fail(`runtime-geometry-bundle-limit-${groups.length}`);
  return groups.map((items, index) => ({
    id: `decr-tc-2020-derived-display-bundle-${String(index + 1).padStart(2, '0')}`,
    geometry: { type: 'MultiPolygon', coordinates: items.flatMap(item => item.geometry.coordinates) },
    sourceFeatureIds: items.map(item => item.id),
    sourceRefs: items.flatMap(item => item.sourceRefs),
  }));
}

function parseSource(bytes) {
  if (sha256(bytes) !== SOURCE_DIGEST) fail('source-digest');
  const collection = JSON.parse(bytes.toString('utf8'));
  if (collection?.type !== 'FeatureCollection' || collection.features?.length !== EXPECTED_FEATURES) fail('source-feature-collection');
  const regions = new Map();
  const reader = new jsts.io.GeoJSONReader();
  const invalidObjectIds = [];
  const invalidSourceIndices = [];
  const objectIdCounts = new Map();
  let sourceParts = 0;
  let sourceRings = 0;
  let sourcePositions = 0;
  let sourceArea = 0;
  let repairedSourceArea = 0;
  let maximumSourceRingPositions = 0;
  const sourceBounds = [Infinity, Infinity, -Infinity, -Infinity];

  for (const [sourceIndex, source] of collection.features.entries()) {
    const objectId = source.properties?.OBJECTID;
    const region = source.properties?.Region;
    if (objectId !== null && objectId !== undefined && (!Number.isInteger(objectId) || objectId < 1)) fail('source-object-id');
    if (typeof region !== 'string' || !region.trim()) fail(`source-region-${objectId}`);
    if (source?.geometry?.type !== 'MultiPolygon') fail(`source-geometry-${objectId}`);
    objectIdCounts.set(objectId ?? null, (objectIdCounts.get(objectId ?? null) ?? 0) + 1);
    const stats = coordinateStats(source.geometry);
    sourceParts += stats.parts;
    sourceRings += stats.rings;
    sourcePositions += stats.positions;
    maximumSourceRingPositions = Math.max(maximumSourceRingPositions, stats.maximumRingPositions);
    for (let index = 0; index < 4; index += 1) {
      sourceBounds[index] = index < 2
        ? Math.min(sourceBounds[index], stats.bounds[index])
        : Math.max(sourceBounds[index], stats.bounds[index]);
    }
    sourceArea += area(source);
    let jstsGeometry = reader.read(source.geometry);
    if (!new jsts.operation.valid.IsValidOp(jstsGeometry).isValid()) {
      invalidObjectIds.push(objectId);
      invalidSourceIndices.push(sourceIndex);
      jstsGeometry = jstsGeometry.buffer(0);
    }
    if (!new jsts.operation.valid.IsValidOp(jstsGeometry).isValid()) fail(`source-repair-${objectId}`);
    repairedSourceArea += area(feature(toMultiPolygon(new jsts.io.GeoJSONWriter().write(jstsGeometry))));
    const items = regions.get(region) ?? [];
    items.push({ sourceIndex, objectId: objectId ?? null, geometry: jstsGeometry });
    regions.set(region, items);
  }

  if (sourceParts !== EXPECTED_PARTS || sourceRings !== EXPECTED_RINGS || sourcePositions !== EXPECTED_POSITIONS) fail('source-counts');
  if (regions.size !== EXPECTED_REGIONS) fail(`source-regions-${regions.size}`);
  if (!arraysEqual(sourceBounds, EXPECTED_BOUNDS)) fail('source-bounds');
  if (JSON.stringify(invalidObjectIds) !== JSON.stringify(SOURCE_INVALID_OBJECT_IDS)) fail(`source-invalid-${invalidObjectIds}`);
  if (JSON.stringify(invalidSourceIndices) !== JSON.stringify([716])) fail(`source-invalid-index-${invalidSourceIndices}`);

  const outputRepairs = [];
  const removedDegenerateRings = [];
  const droppedDegenerateFeatures = [];
  const output = [];
  for (const [region, items] of regions) {
    if (region === 'Grand Turk') {
      for (const item of items) {
        const geometry = repairAndSimplify(item.geometry, `source-${item.sourceIndex}`, outputRepairs, removedDegenerateRings);
        if (!geometry) {
          droppedDegenerateFeatures.push({ sourceIndex: item.sourceIndex, objectId: item.objectId, region });
          continue;
        }
        output.push({
          id: `decr-tc-2020-${slug(region)}-surface-source-${item.sourceIndex + 1}-object-${item.objectId ?? 'none'}`,
          region,
          sourceRefs: [{ sourceIndex: item.sourceIndex, objectId: item.objectId }],
          geometry,
        });
      }
      continue;
    }
    let union = items[0].geometry;
    for (const item of items.slice(1)) union = union.union(item.geometry);
    const geometry = repairAndSimplify(union, `region-${slug(region)}`, outputRepairs, removedDegenerateRings);
    if (!geometry) fail(`simplification-collapsed-region-${slug(region)}`);
    output.push({
      id: `decr-tc-2020-${slug(region)}-surface`,
      region,
      sourceRefs: items.map(item => ({ sourceIndex: item.sourceIndex, objectId: item.objectId })),
      geometry,
    });
  }

  const outputStats = output.reduce((summary, item) => {
    const stats = coordinateStats(item.geometry);
    summary.parts += stats.parts;
    summary.rings += stats.rings;
    summary.positions += stats.positions;
    summary.maximumRingPositions = Math.max(summary.maximumRingPositions, stats.maximumRingPositions);
    summary.area += area(feature(item.geometry));
    for (let index = 0; index < 4; index += 1) {
      summary.bounds[index] = index < 2
        ? Math.min(summary.bounds[index], stats.bounds[index])
        : Math.max(summary.bounds[index], stats.bounds[index]);
    }
    return summary;
  }, { parts: 0, rings: 0, positions: 0, maximumRingPositions: 0, area: 0, bounds: [Infinity, Infinity, -Infinity, -Infinity] });
  if (!arraysEqual(outputStats.bounds, EXPECTED_OUTPUT_BOUNDS)) fail('output-bounds');
  if (outputStats.positions > 20_000 || outputStats.maximumRingPositions > 2_000) fail('output-complexity');
  if (Math.abs(outputStats.area - repairedSourceArea) / repairedSourceArea > 0.001) fail('output-area-delta');

  return {
    output,
    regionNames: [...regions.keys()],
    source: {
      features: EXPECTED_FEATURES,
      parts: sourceParts,
      rings: sourceRings,
      positions: sourcePositions,
      maximumRingPositions: maximumSourceRingPositions,
      bounds: sourceBounds,
      areaSquareKilometres: sourceArea / 1e6,
      repairedAreaSquareKilometres: repairedSourceArea / 1e6,
      invalidObjectIds,
      invalidSourceIndices,
      missingObjectIds: objectIdCounts.get(null) ?? 0,
      duplicateObjectIds: [...objectIdCounts].filter(([objectId, count]) => objectId !== null && count > 1),
    },
    transformation: {
      toleranceDegrees: SIMPLIFICATION_TOLERANCE_DEGREES,
      outputFeatures: output.length,
      outputParts: outputStats.parts,
      outputRings: outputStats.rings,
      outputPositions: outputStats.positions,
      maximumOutputRingPositions: outputStats.maximumRingPositions,
      outputBounds: outputStats.bounds,
      outputAreaSquareKilometres: outputStats.area / 1e6,
      repairedSourceAreaDeltaPercent: (outputStats.area - repairedSourceArea) / repairedSourceArea * 100,
      postSimplificationRepairs: outputRepairs,
      removedDegenerateRings,
      droppedDegenerateFeatures,
    },
  };
}

function build({ sourcePath, outputDirectory, reportPath }) {
  const parsed = parseSource(readFileSync(sourcePath));
  const runtimeBundles = bundleRuntimeGeometry(parsed.output);
  const validTime = { from: POSTAL_VALID_FROM, to: null };
  const knownTime = { from: RELEASE_INSTANT, to: null };
  const assignmentSource = {
    sourceId: 'upu-tc-addressing-sheet-2025-10', sourceType: 'official',
    assignmentAuthority: 'official_postal_dictionary', geometryAuthority: 'none',
    sourceVersion: 'Turks and Caicos Islands addressing sheet 10/2025; single postcode for the whole territory',
    sourceDate: '2025-10', licenseId: 'UPU-reference-only-no-redistribution', digest: UPU_TC_DIGEST,
  };
  const geometrySource = {
    sourceId: 'tc-decr-shoreline-land-extent-2020-derived-regions', sourceType: 'derived',
    assignmentAuthority: 'derived_spatial_assignment', geometryAuthority: 'derived_geometry',
    sourceVersion: 'Shoreline and land exent of Turks and Caicos, 2020; CKAN package 2dcdda81-48c8-4135-b233-c70e34b9c432; GeoJSON resource df348511-c995-413c-ac79-cf8b99e16ff2; region dissolve plus topology-preserving 0.0005 degree simplification',
    sourceDate: '2020-12-02', licenseId: GEOMETRY_LICENSE, digest: SOURCE_DIGEST,
  };
  const countryNode = {
    id: 'country-tc', kind: 'administrative_area', featureKind: 'country', geometryType: 'none',
    countryCode: 'TC', label: 'Turks and Caicos Islands', visibility: 'public',
  };
  const postalNode = {
    id: 'postal-tc-tkca-1zz', kind: 'postal_feature', featureKind: 'standard_area', geometryType: 'multipolygon',
    countryCode: 'TC', postalCode: 'TKCA 1ZZ', label: 'TKCA 1ZZ whole-territory derived regional display surface', visibility: 'public',
  };
  const regionNodes = parsed.regionNames.map(region => ({
    id: `admin-tc-decr-region-${slug(region)}`, kind: 'administrative_area', featureKind: 'administrative', geometryType: 'none',
    countryCode: 'TC', label: region, visibility: 'public',
  }));
  const nodes = [countryNode, postalNode, ...regionNodes];
  const assertions = [{
    id: 'upu-tc-202510-tkca-1zz-admin-within-tc', fromNodeId: postalNode.id, toNodeId: countryNode.id,
    relation: 'admin_within', validTime, knownTime, source: assignmentSource,
    method: 'source_relation', quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT },
  }, ...regionNodes.map(node => ({
    id: `decr-tc-2020-tkca-1zz-admin-within-${node.id.slice('admin-tc-decr-region-'.length)}`,
    fromNodeId: postalNode.id, toNodeId: node.id, relation: 'admin_within', validTime, knownTime,
    source: geometrySource, method: 'geometry_intersects',
    quality: { status: 'derived', confidence: 0.9, accuracyMeters: 60, validatedAt: RELEASE_INSTANT },
  }))];
  const features = runtimeBundles.map(item => ({
    id: item.id, nodeId: postalNode.id, role: 'postal_area', publicationClass: 'public_context', geometry: item.geometry,
    source: geometrySource, validTime, knownTime,
    quality: { status: 'derived', confidence: 0.9, accuracyMeters: 60, validatedAt: RELEASE_INSTANT },
  }));

  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, {
    schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'TC', releaseId: RELEASE_ID, features,
  });
  const graphRelease = {
    schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-tc-upu-decr-shoreline',
    repositoryUrl: 'https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure', countryCode: 'TC', releaseId: RELEASE_ID,
    policyVersion: 'turks-caicos-upu-single-postcode-decr-regions-v1', releasedAt: RELEASE_INSTANT,
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
    countryCode: 'TC', releaseId: RELEASE_ID, policyVersion: graphRelease.policyVersion,
    sequence: 1, previousDescriptorDigest: null, graphManifestDigest: graphRelease.manifestDigest,
    createdAt: RELEASE_INSTANT, maturity: 'M2_experimental', synthetic: false,
    promotionEligible: true, containsResidentialAddressPoints: false,
    artifacts: [
      { role: 'graph', path: basename(graphPath), mediaType: 'application/vnd.agid.postal-context-graph+json',
        schemaVersion: 'postal-context-graph/v0.1', byteLength: graphArtifact.byteLength,
        digest: graphArtifact.digest, recordCounts: { nodes: nodes.length, assertions: assertions.length } },
      { role: 'geometry', path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json',
        schemaVersion: 'postal-context-geometry/v0.1', byteLength: geometryArtifact.byteLength,
        digest: geometryArtifact.digest, recordCounts: { features: features.length, positions: parsed.transformation.outputPositions } },
    ],
  });
  const report = {
    schemaVersion: 'postal-context-tc-m2-build/v1', countryCode: 'TC', generatedAt: RELEASE_INSTANT,
    releaseId: RELEASE_ID,
    input: {
      sourceId: geometrySource.sourceId, digest: SOURCE_DIGEST, metadataDigest: CKAN_METADATA_DIGEST,
      sourceFeatures: parsed.source.features, sourceParts: parsed.source.parts, sourceRings: parsed.source.rings,
      sourcePositions: parsed.source.positions, sourceBounds: parsed.source.bounds,
      sourceAreaSquareKilometres: parsed.source.areaSquareKilometres,
      repairedSourceAreaSquareKilometres: parsed.source.repairedAreaSquareKilometres,
      invalidObjectIds: parsed.source.invalidObjectIds, invalidSourceIndices: parsed.source.invalidSourceIndices,
      missingObjectIds: parsed.source.missingObjectIds, duplicateObjectIds: parsed.source.duplicateObjectIds,
    },
    officialPostalEvidence: {
      postalCode: 'TKCA 1ZZ', scope: 'single-postcode-for-whole-territory', currentEdition: 'Turks and Caicos Islands addressing sheet 10/2025',
      digest: UPU_TC_DIGEST, corroboratingGeneralDigest: UPU_GENERAL_DIGEST,
      authority: 'official_postal_dictionary', geometryAuthority: 'none',
    },
    transformation: {
      method: 'source-invalid-buffer-zero-then-region-dissolve-and-topology-preserving-simplification',
      groupingException: 'Grand Turk source features remain separate because their dissolved result fails Turf validity; every output remains linked to the Grand Turk region ID.',
      ...parsed.transformation,
      runtimeGeometryFeatures: runtimeBundles.length,
      runtimeGeometryBundleSizes: runtimeBundles.map(item => item.sourceFeatureIds.length),
      allOutputTurfValid: true, allOutputJstsValid: true,
    },
    policy: {
      outputProvenance: 'derived', officialPostalGeometryClaimed: false,
      sourcePopulationPropertiesPublished: 0, addressOrBuildingRowsPublished: 0,
      recipientCustomerOrLandRightsRowsPublished: 0, inventedAreaRowsPublished: 0,
    },
    artifacts: {
      graph: { ...graphArtifact, path: 'data/postal_country_packs/tc/postal-context/m2/graph.json' },
      geometry: { ...geometryArtifact, path: 'data/postal_country_packs/tc/postal-context/m2/geometry.json' },
      descriptor: { ...descriptorArtifact, path: 'data/postal_country_packs/tc/postal-context/m2/descriptor.json' },
    },
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
  const outputDirectory = resolve(process.argv[3] ?? join(ROOT, 'data/postal_country_packs/tc/postal-context/m2'));
  const reportPath = process.argv[4] ? resolve(process.argv[4]) : undefined;
  if (!process.argv[2]) fail('usage-source-geojson-required');
  console.log(JSON.stringify(build({ sourcePath, outputDirectory, reportPath }), null, 2));
}

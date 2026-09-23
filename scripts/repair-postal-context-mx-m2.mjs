import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import area from '@turf/area';
import { feature, featureCollection } from '@turf/helpers';
import union from '@turf/union';
import unkinkPolygon from '@turf/unkink-polygon';
import booleanValid from '@turf/boolean-valid';
import jsts from 'jsts';

const root = resolve('data/postal_country_packs/mx/postal-context');
const graphPath = resolve(root, 'm2/graph.json'); const geometryPath = resolve(root, 'm2/geometry.json');
const descriptorPath = resolve(root, 'm2/descriptor.json'); const profilePath = resolve(root, 'source-profile.json');
const sha256 = body => createHash('sha256').update(body).digest('hex'); const digest = body => `sha256:${sha256(body)}`;
const minified = value => Buffer.from(`${JSON.stringify(value)}\n`, 'utf8');
const canonicalJson = value => value === null || typeof value !== 'object' ? JSON.stringify(value)
  : Array.isArray(value) ? `[${value.map(canonicalJson).join(',')}]`
    : `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
const polygons = geometry => geometry?.type === 'Polygon' ? [geometry.coordinates]
  : geometry?.type === 'MultiPolygon' ? geometry.coordinates
    : geometry?.type === 'GeometryCollection' ? geometry.geometries.flatMap(polygons) : [];
const surface = geometry => {
  const parts = polygons(geometry).filter(part => part.length > 0);
  if (!parts.length) throw new Error('repair removed every polygon surface');
  return parts.length === 1 ? { type: 'Polygon', coordinates: parts[0] } : { type: 'MultiPolygon', coordinates: parts };
};
const reader = new jsts.io.GeoJSONReader(); const writer = new jsts.io.GeoJSONWriter();
const isValid = geometry => new jsts.operation.valid.IsValidOp(reader.read(geometry)).isValid();
const clean = geometry => {
  const cleanedPolygons = polygons(surface(geometry)).map(polygon => polygon.map(ring => {
    const output = []; const seen = new Set();
    for (const [index, position] of ring.entries()) {
      const key = `${position[0]},${position[1]}`;
      const isClosing = index === ring.length - 1 && output.length > 0 && position[0] === output[0][0] && position[1] === output[0][1];
      if (isClosing) continue;
      if (seen.has(key)) continue;
      seen.add(key); output.push(position);
    }
    if (output.length && (output[0][0] !== output.at(-1)[0] || output[0][1] !== output.at(-1)[1])) output.push(output[0]);
    return output;
  }).filter(ring => ring.length >= 4)).filter(polygon => polygon.length > 0);
  if (!cleanedPolygons.length) throw new Error('repair removed every non-degenerate surface');
  return cleanedPolygons.length === 1 ? { type: 'Polygon', coordinates: cleanedPolygons[0] } : { type: 'MultiPolygon', coordinates: cleanedPolygons };
};
const signedRingArea = ring => ring.slice(1).reduce((sum, point, index) => sum + ring[index][0] * point[1] - point[0] * ring[index][1], 0) / 2;
const snapToFiveDecimals = geometry => ({
  ...geometry,
  coordinates: geometry.type === 'Polygon'
    ? geometry.coordinates.map(ring => ring.map(position => position.map(value => Number(value.toFixed(5)))))
    : geometry.coordinates.map(polygon => polygon.map(ring => ring.map(position => position.map(value => Number(value.toFixed(5))))))
});
const strictClean = geometry => {
  const source = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  const result = source.map(polygon => polygon.map(ring => {
    const seen = new Set(); const output = [];
    for (const position of ring.slice(0, -1)) { const key = position.join(','); if (!seen.has(key)) { seen.add(key); output.push(position); } }
    if (output.length) output.push(output[0]); return output;
  }).filter((ring, index) => ring.length >= 4 && (index === 0 || Math.abs(signedRingArea(ring)) > 1e-12)))
    .filter(polygon => polygon[0]?.length >= 4 && Math.abs(signedRingArea(polygon[0])) > 1e-12);
  if (!result.length) throw new Error('strict repair removed every surface');
  return result.length === 1 ? { type: 'Polygon', coordinates: result[0] } : { type: 'MultiPolygon', coordinates: result };
};
const strictRepairCodes = new Set(['33000', '35320', '35977', '79080']);
const strictRepair = (geometry, code) => {
  let result = strictClean(['33000', '79080'].includes(code) ? snapToFiveDecimals(geometry) : geometry);
  if (code !== '33000' && code !== '79080') return result;
  const source = result.type === 'Polygon' ? [result.coordinates] : result.coordinates; const output = [];
  for (const polygon of source) {
    let surfaceGeometry = reader.read({ type: 'Polygon', coordinates: [polygon[0]] });
    for (const hole of polygon.slice(1)) {
      const insetHole = jsts.operation.buffer.BufferOp.bufferOp(reader.read({ type: 'Polygon', coordinates: [hole] }), -0.000002);
      surfaceGeometry = jsts.operation.overlay.OverlayOp.difference(surfaceGeometry, insetHole);
    }
    const repaired = writer.write(surfaceGeometry); output.push(...(repaired.type === 'Polygon' ? [repaired.coordinates] : repaired.coordinates));
  }
  return strictClean({ type: 'MultiPolygon', coordinates: output });
};
const geometryCollection = JSON.parse(readFileSync(geometryPath, 'utf8'));
const graph = JSON.parse(readFileSync(graphPath, 'utf8')); const descriptor = JSON.parse(readFileSync(descriptorPath, 'utf8'));
const profile = JSON.parse(readFileSync(profilePath, 'utf8'));
const invalidOriginalByCode = new Map();
for (const fileName of readdirSync(resolve('.m2-sources-mx/invalid-original100b')).filter(name => /^CP_.+\.geojson$/u.test(name))) {
  for (const item of JSON.parse(readFileSync(resolve('.m2-sources-mx/invalid-original100b', fileName), 'utf8')).features) {
    invalidOriginalByCode.set(String(item.properties.d_cp), surface(item.geometry));
  }
}
const geosSelectedPartsByCode = new Map();
for (const fileName of readdirSync(resolve('.m2-sources-mx/invalid-geos-selected')).filter(name => /^CP_.+\.geojson$/u.test(name))) {
  for (const item of JSON.parse(readFileSync(resolve('.m2-sources-mx/invalid-geos-selected', fileName), 'utf8')).features) {
    if (!polygons(item.geometry).length) continue;
    const code = String(item.properties.d_cp); const parts = geosSelectedPartsByCode.get(code) ?? [];
    parts.push(item.geometry); geosSelectedPartsByCode.set(code, parts);
  }
}
const geosSelectedByCode = new Map([...geosSelectedPartsByCode].map(([code, parts]) => [code, surface({ type: 'GeometryCollection', geometries: parts })]));
const parserSelectedPartsByCode = new Map();
for (const fileName of readdirSync(resolve('.m2-sources-mx/parser-geos-selected')).filter(name => /^CP_.+\.geojson$/u.test(name))) {
  for (const item of JSON.parse(readFileSync(resolve('.m2-sources-mx/parser-geos-selected', fileName), 'utf8')).features) {
    const code = String(item.properties.d_cp); const parts = parserSelectedPartsByCode.get(code) ?? [];
    parts.push(item.geometry); parserSelectedPartsByCode.set(code, parts);
  }
}
const parserSelectedByCode = new Map([...parserSelectedPartsByCode].map(([code, parts]) => [code, surface({ type: 'GeometryCollection', geometries: parts })]));
const repairDeltas = []; const displaySimplificationDeltas = []; const strictRepairDeltas = []; let displaySimplificationSkipped = 0; let repaired = 0; let positions = 0; let maxRingPositions = 0;
let invalidOriginalFallbacks = 0; let geosSelectedFallbacks = 0; let parserSelectedFallbacks = 0;
for (const item of geometryCollection.features) {
  const code = item.nodeId.slice('postal-mx-'.length);
  let before = parserSelectedByCode.has(code) ? surface(parserSelectedByCode.get(code)) : surface(item.geometry); let after = before;
  if (parserSelectedByCode.has(code)) parserSelectedFallbacks += 1;
  if (!parserSelectedByCode.has(code) && !isValid(before)) {
    const original = geosSelectedByCode.get(code) ?? invalidOriginalByCode.get(code);
    if (!original) throw new Error(`${item.id}: invalid original fallback missing`);
    before = surface(original); after = before; invalidOriginalFallbacks += 1;
    if (geosSelectedByCode.has(code)) geosSelectedFallbacks += 1;
  }
  if (!isValid(before)) {
    const beforeArea = area(feature(before, {}));
    const fixed = jsts.operation.buffer.BufferOp.bufferOp(reader.read(before), 0);
    try {
      after = clean(writer.write(fixed));
    } catch {
      let pieces; try { pieces = unkinkPolygon(feature(clean(before), {})); } catch (error) { throw new Error(`${item.id}: unkink failed: ${error.message}`); }
      const merged = pieces.features.length === 1 ? pieces.features[0] : union(featureCollection(pieces.features));
      if (!merged) throw new Error(`${item.id}: polygon repair produced no surface`);
      after = clean(merged.geometry);
    }
    const afterArea = area(feature(after, {}));
    const relativeAreaDelta = Math.abs(afterArea - beforeArea) / beforeArea;
    repairDeltas.push({ id: item.id, relativeAreaDelta }); repaired += 1;
  } else {
    after = clean(before);
  }
  if (code === '24088') displaySimplificationSkipped += 1;
  else {
    const beforeDisplayGeometry = after; const beforeDisplayArea = area(feature(after, {}));
    after = clean(writer.write(jsts.simplify.TopologyPreservingSimplifier.simplify(reader.read(after), 0.0012)));
    const displayRelativeAreaDelta = Math.abs(area(feature(after, {})) - beforeDisplayArea) / beforeDisplayArea;
    if (displayRelativeAreaDelta > 0.01) { after = beforeDisplayGeometry; displaySimplificationSkipped += 1; }
    else displaySimplificationDeltas.push(displayRelativeAreaDelta);
  }  if (strictRepairCodes.has(code)) {
    const beforeStrictArea = area(feature(after, {})); after = strictRepair(after, code);
    const relativeAreaDelta = Math.abs(area(feature(after, {})) - beforeStrictArea) / beforeStrictArea;
    if (relativeAreaDelta > 0.001) throw new Error(`${item.id}: strict repair area delta ${relativeAreaDelta}`);
    strictRepairDeltas.push({ id: item.id, relativeAreaDelta });
  }
  if (!isValid(after)) throw new Error(`${item.id}: final geometry invalid`);
  item.geometry = after; item.quality.accuracyMeters = 250; item.quality.confidence = 0.92;
  item.source.sourceVersion = item.source.sourceVersion.replace('/100m-v1', '/250m-derived-repaired-v3');
  for (const polygon of polygons(after)) for (const ring of polygon) { positions += ring.length; maxRingPositions = Math.max(maxRingPositions, ring.length); }
}
if (positions > 2_000_000 || maxRingPositions > 100_000) throw new Error('repaired geometry exceeds runtime limits');
const finalRepairDescription = 'duplicate-coordinate and degenerate-ring cleanup; raw-original surface fallback; GEOS zero-buffer fallback for selected high-area-delta and strict-parser-invalid source surfaces; an additional topology-preserving 0.0012-degree display simplification stays below a 1% per-feature area delta; four strict runtime repairs remove zero-area components and inset touching/overlapping holes by about 0.2 m; JSTS BufferOp zero only when still invalid';
const finalCompositeDigest = digest(Buffer.from(canonicalJson({
  previous: profile.transformation.source_composite_digest,
  final_repair: finalRepairDescription,
}), 'utf8'));
for (const item of geometryCollection.features) item.source.digest = finalCompositeDigest;
for (const assertion of graph.assertions) assertion.source.digest = finalCompositeDigest;
const featureByNode = new Map(geometryCollection.features.map(featureItem => [featureItem.nodeId, featureItem]));
for (const node of graph.nodes) {
  if (node.kind !== 'postal_feature') continue;
  const item = featureByNode.get(node.id);
  if (!item) throw new Error(`${node.id}: geometry missing`);
  node.geometryType = item.geometry.type.toLowerCase();
}
const geometryBody = minified(geometryCollection); if (geometryBody.length > 64 * 1024 * 1024) throw new Error('repaired geometry exceeds bytes limit');
graph.release.artifacts[0].digest = digest(geometryBody); graph.release.artifacts[0].byteLength = geometryBody.length;
const { manifestDigest: _discarded, ...releasePayload } = graph.release;
graph.release.manifestDigest = digest(Buffer.from(canonicalJson(releasePayload), 'utf8'));
const graphBody = minified(graph); if (graphBody.length > 32 * 1024 * 1024) throw new Error('repaired graph exceeds bytes limit');
descriptor.graphManifestDigest = graph.release.manifestDigest;
const graphArtifact = descriptor.artifacts.find(artifact => artifact.role === 'graph'); const geometryArtifact = descriptor.artifacts.find(artifact => artifact.role === 'geometry');
graphArtifact.byteLength = graphBody.length; graphArtifact.digest = digest(graphBody);
geometryArtifact.byteLength = geometryBody.length; geometryArtifact.digest = digest(geometryBody); geometryArtifact.recordCounts.positions = positions;
const descriptorBody = minified(descriptor);
profile.transformation.final_topology_repair = finalRepairDescription; profile.transformation.effective_display_accuracy_meters = 250;
profile.transformation.source_composite_digest = finalCompositeDigest;
profile.validation.topology_repaired_features = repaired; profile.validation.additional_display_simplification_tolerance_degrees = 0.0012; profile.validation.additional_display_simplification_max_relative_area_delta = Math.max(0, ...displaySimplificationDeltas); profile.validation.additional_display_simplification_applied_features = displaySimplificationDeltas.length; profile.validation.additional_display_simplification_skipped_features = displaySimplificationSkipped; profile.validation.invalid_original_fallback_features = invalidOriginalFallbacks; profile.validation.geos_selected_fallback_features = geosSelectedFallbacks; profile.validation.strict_topology_repaired_features = strictRepairDeltas.length; profile.validation.strict_topology_max_relative_area_delta = Math.max(0, ...strictRepairDeltas.map(item => item.relativeAreaDelta)); profile.validation.strict_parser_geos_fallback_features = parserSelectedFallbacks; profile.validation.positions = positions; profile.validation.max_ring_positions = maxRingPositions;
profile.validation.max_repair_relative_area_delta = Math.max(0, ...repairDeltas.map(item => item.relativeAreaDelta));
profile.validation.geometry_bytes = geometryBody.length; profile.validation.graph_bytes = graphBody.length; profile.validation.descriptor_sha256 = sha256(descriptorBody);
writeFileSync(geometryPath, geometryBody); writeFileSync(graphPath, graphBody); writeFileSync(descriptorPath, descriptorBody);
writeFileSync(profilePath, `${JSON.stringify(profile, null, 2)}\n`, 'utf8');
writeFileSync(resolve('.m2-sources-mx/repair-audit.json'), `${JSON.stringify({ repaired, invalidOriginalFallbacks, positions, maxRingPositions, maxRelativeAreaDelta: profile.validation.max_repair_relative_area_delta, repairDeltas }, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ descriptorDigest: digest(descriptorBody), graphBytes: graphBody.length, geometryBytes: geometryBody.length, repaired, invalidOriginalFallbacks, positions, maxRingPositions, maxRelativeAreaDelta: profile.validation.max_repair_relative_area_delta }, null, 2));

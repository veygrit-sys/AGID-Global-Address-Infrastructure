import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { area, bbox, booleanValid, feature, multiPolygon } from '@turf/turf';
import jsts from 'jsts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_ID = 'gs-upu-sggis-bas-20260901';
const RELEASE_INSTANT = '2026-09-01T04:46:46.948Z';
const POSTAL_VALID_FROM = '2026-08-01T00:00:00.000Z';
const GEOMETRY_SOURCE_DATE = '2020-11-03';
const GEOMETRY_LICENSE = 'CC-BY-4.0-BAS-South-Georgia-GIS';
const CONFIDENCE = 0.90;
const EXPECTED_BOUNDS = [-42.010362430401265, -59.462019286868944, -26.263554479353903, -53.5409753944407];
const EXPECTED_FEATURES = 357;
const EXPECTED_RINGS = 357;
const EXPECTED_POSITIONS = 90_610;
const EXPECTED_GROUPS = {
  southGeorgia: { features: 340, positions: 80_951 },
  southSandwich: { features: 17, positions: 9_659 },
};
const RECEIPTS = {
  'sub_antarctic_coastline_high_res_polygon_v1.0.zip': ['27b4cd2085b9c845abf7928c336cf82f0d37492bbe2c21522ac4c670750f6cff', 1_267_481],
  'sggis-source-wgs84-full.geojson': ['5da93ae838fbdb0ad216a946e492391c5cdf8176c9b00eea49e0a0f4cd5aa1f8', 4_205_021],
  'bas-dataset-metadata.json': ['0d5f7c6c4e89a1339f18346d218bfee1a2a178524227b85423a953a4131981e2', 18_374],
  'bas-dataset-page.html': ['75c1d9800d90bfd7059ce053ff4462b7f7a60bacf687c75931cdb673c7d07b3c', 67_390],
  'gsgssi-gis.html': ['9b0a8ff529df950c8ee129761c39073c2893294b7b905ce14ef92ea8b0fe8cdb', 189_821],
  'sggis-readme.html': ['6380e2f985bf88f85e3062943e7416b68cf58d1a972f71c5910fb72550636dfb', 1_073],
  'upu-general-addressing-issues.pdf': ['ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d', 631_050],
  'upu-gs-addressing.pdf': ['b301ba2e6f28548adcb193cda244c07e0003ec7be209913c9acea6a02ebcd928', 115_044],
  'upu-copyright.html': ['3b564088a5a8655d5b71dca7f8226b48b1f444f90088140e8422ac9fdf3d85d9', 110_811],
  'cc-by-4.0-legalcode.html': ['6d55b998ed5c54f43426d059a8c549ed58a3321e5463e6a6af1c6b56ab78c333', 48_970],
};

function fail(message) {
  throw new Error(`gs-m2-${message}`);
}

function sha256(bytes) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
}

function canonicalJson(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail('canonical-number');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (!value || typeof value !== 'object') fail('canonical-value');
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
}

function exactReceipt(sourceDirectory, name) {
  const bytes = readFileSync(join(sourceDirectory, name));
  const [digest, byteLength] = RECEIPTS[name];
  if (bytes.length !== byteLength || sha256(bytes) !== `sha256:${digest}`) fail(`receipt-${name}`);
  return { name, bytes, digest: sha256(bytes), byteLength: bytes.length };
}

function writeJson(path, value, pretty = false) {
  mkdirSync(dirname(path), { recursive: true });
  const text = pretty ? JSON.stringify(value, null, 2) : canonicalJson(value);
  const bytes = Buffer.from(`${text}\n`, 'utf8');
  writeFileSync(path, bytes);
  return { path: basename(path), byteLength: bytes.length, digest: sha256(bytes) };
}

function countPositions(coordinates) {
  let positions = 0;
  const visit = value => {
    if (Array.isArray(value) && value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      positions += 1;
      return;
    }
    if (!Array.isArray(value)) fail('coordinate-tree');
    value.forEach(visit);
  };
  visit(coordinates);
  return positions;
}

function ringCount(geometry) {
  return geometry.type === 'Polygon'
    ? geometry.coordinates.length
    : geometry.coordinates.reduce((sum, polygon) => sum + polygon.length, 0);
}

function jstsValid(geometry) {
  return new jsts.operation.valid.IsValidOp(new jsts.io.GeoJSONReader().read(geometry)).isValid();
}

function sameNumbers(left, right, tolerance = 1e-12) {
  return left.length === right.length && left.every((value, index) => Math.abs(value - right[index]) <= tolerance);
}

function inspectFeature(item, index) {
  if (item?.type !== 'Feature' || item.geometry?.type !== 'Polygon') fail(`source-feature-${index}`);
  if (item.properties?.source !== 'South Georgia GIS' || item.properties?.location !== 'South Georgia') fail(`source-identity-${index}`);
  let minimumLongitude = Infinity;
  let maximumLongitude = -Infinity;
  for (const ring of item.geometry.coordinates) {
    if (ring.length < 4 || ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1]) fail(`source-ring-${index}`);
    for (const position of ring) {
      if (!Array.isArray(position) || position.length < 2 || !Number.isFinite(position[0]) || !Number.isFinite(position[1])) fail(`source-position-${index}`);
      minimumLongitude = Math.min(minimumLongitude, position[0]);
      maximumLongitude = Math.max(maximumLongitude, position[0]);
    }
  }
  if (!booleanValid(item) || !jstsValid(item.geometry)) fail(`source-validity-${index}`);
  const group = maximumLongitude < -30 ? 'southGeorgia' : minimumLongitude > -30 ? 'southSandwich' : null;
  if (!group) fail(`source-region-gap-${index}`);
  return { group, positions: countPositions(item.geometry.coordinates) };
}

function parseSource(bytes) {
  if (sha256(bytes) !== `sha256:${RECEIPTS['sggis-source-wgs84-full.geojson'][0]}`) fail('source-digest');
  const collection = JSON.parse(bytes.toString('utf8'));
  if (collection?.type !== 'FeatureCollection' || collection.name !== 'sub_antarctic_coastline_high_res_polygon_v1.0'
    || collection.features?.length !== EXPECTED_FEATURES) fail('source-collection');
  const groups = { southGeorgia: [], southSandwich: [] };
  const counts = { southGeorgia: { features: 0, positions: 0 }, southSandwich: { features: 0, positions: 0 } };
  for (const [index, item] of collection.features.entries()) {
    const inspected = inspectFeature(item, index);
    groups[inspected.group].push(item.geometry.coordinates);
    counts[inspected.group].features += 1;
    counts[inspected.group].positions += inspected.positions;
  }
  if (JSON.stringify(counts) !== JSON.stringify(EXPECTED_GROUPS)) fail(`source-groups-${JSON.stringify(counts)}`);
  const geometries = [multiPolygon(groups.southGeorgia).geometry, multiPolygon(groups.southSandwich).geometry];
  for (const [index, geometry] of geometries.entries()) {
    const item = feature(geometry);
    if (!booleanValid(item) || !jstsValid(geometry)) fail(`output-validity-${index}`);
  }
  const combined = feature({ type: 'MultiPolygon', coordinates: geometries.flatMap(item => item.coordinates) });
  if (!booleanValid(combined) || !jstsValid(combined.geometry)) fail('combined-validity');
  if (!sameNumbers(bbox(combined), EXPECTED_BOUNDS)) fail('source-bounds');
  if (countPositions(combined.geometry.coordinates) !== EXPECTED_POSITIONS || ringCount(combined.geometry) !== EXPECTED_RINGS) fail('source-counts');
  const sourceParts = collection.features.map(item => canonicalJson(item.geometry.coordinates)).sort();
  const outputParts = geometries.flatMap(item => item.coordinates).map(canonicalJson).sort();
  if (JSON.stringify(sourceParts) !== JSON.stringify(outputParts)) fail('coordinate-or-part-mutation');
  return { geometries, counts, bounds: bbox(combined), positions: EXPECTED_POSITIONS, rings: EXPECTED_RINGS, squareKilometres: area(combined) / 1e6 };
}

function inspectMetadata(receipts) {
  const metadata = JSON.parse(receipts.find(item => item.name === 'bas-dataset-metadata.json').bytes.toString('utf8'));
  if (metadata.file_identifier !== 'c1d83502-8799-4e3c-bdca-21db6a4405d4'
    || metadata.identification?.edition !== '1.0'
    || !/South Georgia and the South Sandwich Islands taken from the South Georgia GIS/u.test(metadata.identification?.lineage?.statement ?? '')
    || !metadata.identification?.constraints?.some(item => /Creative Commons Attribution 4\.0/u.test(item.statement ?? ''))
    || !metadata.distribution?.some(item => item.format?.format === 'Shapefile' && item.transfer_option?.size?.magnitude === 1_267_481)) fail('bas-metadata');
  const readme = receipts.find(item => item.name === 'sggis-readme.html').bytes.toString('utf8');
  if (!/South Georgia GIS/u.test(readme) || !/Creative Commons Attribution 4\.0 International Licence \(CC BY 4\.0\)/u.test(readme)
    || !/South Georgia GIS, accessed \[year\]/u.test(readme)) fail('sggis-licence');
  const basPage = receipts.find(item => item.name === 'bas-dataset-page.html').bytes.toString('utf8');
  if (!/Vector polygons of the Sub-Antarctic coastline/u.test(basPage) || !/CC BY 4\.0/u.test(basPage)
    || !/South Sandwich Islands/u.test(basPage)) fail('bas-page');
}

function build({ sourceDirectory, outputDirectory, reportPath }) {
  const receipts = Object.keys(RECEIPTS).map(name => exactReceipt(sourceDirectory, name));
  inspectMetadata(receipts);
  const parsed = parseSource(receipts.find(item => item.name === 'sggis-source-wgs84-full.geojson').bytes);
  const validTime = { from: POSTAL_VALID_FROM, to: null };
  const knownTime = { from: RELEASE_INSTANT, to: null };
  const assignmentSource = {
    sourceId: 'upu-gs-siqq-1zz-whole-territory-202608', sourceType: 'official',
    assignmentAuthority: 'official_postal_dictionary', geometryAuthority: 'none',
    sourceVersion: 'Universal POST*CODE DataBase August 2026 and GS addressing sheet 08/2005: SIQQ 1ZZ is the single postcode for the whole territory',
    sourceDate: '2026-08-20', licenseId: 'UPU-reference-only-no-redistribution',
    digest: `sha256:${RECEIPTS['upu-gs-addressing.pdf'][0]}`,
  };
  const geometrySource = {
    sourceId: 'bas-sggis-gs-edition-1.0-derived-whole-territory', sourceType: 'derived',
    assignmentAuthority: 'derived_spatial_assignment', geometryAuthority: 'official_mapping_geometry',
    sourceVersion: 'BAS Sub-Antarctic coastline 1.0; South Georgia GIS source features only; EPSG:3031 to EPSG:4326 without coordinate rounding; natural longitude-gap partition',
    sourceDate: GEOMETRY_SOURCE_DATE, licenseId: GEOMETRY_LICENSE,
    digest: `sha256:${RECEIPTS['sggis-source-wgs84-full.geojson'][0]}`,
  };
  const countryNode = {
    id: 'country-gs', kind: 'administrative_area', featureKind: 'country', geometryType: 'none', countryCode: 'GS',
    label: 'South Georgia and the South Sandwich Islands', visibility: 'public',
  };
  const postalNode = {
    id: 'postal-gs-siqq-1zz', kind: 'postal_feature', featureKind: 'standard_area', geometryType: 'multipolygon', countryCode: 'GS',
    postalCode: 'SIQQ 1ZZ', label: 'SIQQ 1ZZ whole-territory derived display surface', visibility: 'public',
  };
  const nodes = [countryNode, postalNode];
  const assertions = [{
    id: 'upu-gs-202608-siqq-1zz-admin-within-gs', fromNodeId: postalNode.id, toNodeId: countryNode.id,
    relation: 'admin_within', validTime, knownTime, source: assignmentSource,
    method: 'source_relation', quality: { status: 'authoritative', confidence: 0.99, validatedAt: RELEASE_INSTANT },
  }];
  const features = parsed.geometries.map((geometry, index) => ({
    id: `bas-sggis-gs-siqq-1zz-${index + 1}`, nodeId: postalNode.id, role: 'postal_area', publicationClass: 'public_context', geometry,
    source: geometrySource, validTime, knownTime,
    quality: { status: 'derived', confidence: CONFIDENCE, validatedAt: RELEASE_INSTANT },
  }));
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, { schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'GS', releaseId: RELEASE_ID, features });
  const graphRelease = {
    schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-gs-upu-sggis-bas', repositoryUrl: 'https://github.com/veygrit-sys/Address-Grid-ID',
    countryCode: 'GS', releaseId: RELEASE_ID, policyVersion: 'gs-upu-whole-territory-derived-display-v1', releasedAt: RELEASE_INSTANT,
    validTime, manifestDigest: `sha256:${'0'.repeat(64)}`, artifacts: [{
      path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json', digest: geometryArtifact.digest,
      byteLength: geometryArtifact.byteLength, recordCount: features.length, licenseRefs: [GEOMETRY_LICENSE],
    }],
  };
  const { manifestDigest: _placeholder, ...manifestPayload } = graphRelease;
  graphRelease.manifestDigest = sha256(Buffer.from(canonicalJson(manifestPayload), 'utf8'));
  const graphPath = join(outputDirectory, 'graph.json');
  const graphArtifact = writeJson(graphPath, { schemaVersion: 'postal-context-graph/v0.1', release: graphRelease, nodes, assertions });
  const descriptorPath = join(outputDirectory, 'descriptor.json');
  const descriptorArtifact = writeJson(descriptorPath, {
    schemaVersion: 'postal-context-pack-descriptor/v0.1', repositoryId: graphRelease.repositoryId, countryCode: 'GS', releaseId: RELEASE_ID,
    policyVersion: graphRelease.policyVersion, sequence: 1, previousDescriptorDigest: null, graphManifestDigest: graphRelease.manifestDigest,
    createdAt: RELEASE_INSTANT, maturity: 'M2_experimental', synthetic: false, promotionEligible: true, containsResidentialAddressPoints: false,
    artifacts: [
      { role: 'graph', path: basename(graphPath), mediaType: 'application/vnd.agid.postal-context-graph+json', schemaVersion: 'postal-context-graph/v0.1',
        byteLength: graphArtifact.byteLength, digest: graphArtifact.digest, recordCounts: { nodes: nodes.length, assertions: assertions.length } },
      { role: 'geometry', path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json', schemaVersion: 'postal-context-geometry/v0.1',
        byteLength: geometryArtifact.byteLength, digest: geometryArtifact.digest, recordCounts: { features: features.length, positions: parsed.positions } },
    ],
  });
  const report = {
    schemaVersion: 'postal-context-gs-m2-build/v1', countryCode: 'GS', generatedAt: RELEASE_INSTANT, releaseId: RELEASE_ID,
    evidence: { exactBodies: receipts.length, exactBytes: receipts.reduce((sum, item) => sum + item.byteLength, 0),
      receipts: receipts.map(item => ({ path: relative(sourceDirectory, join(sourceDirectory, item.name)).replaceAll('\\', '/'), digest: item.digest, byteLength: item.byteLength })) },
    officialPostalEvidence: { postalCode: 'SIQQ 1ZZ', scope: 'single-postcode-for-whole-territory',
      currentEdition: 'Universal POST*CODE DataBase August 2026', generalDigest: `sha256:${RECEIPTS['upu-general-addressing-issues.pdf'][0]}`,
      countrySheetEdition: '08/2005', countrySheetDigest: `sha256:${RECEIPTS['upu-gs-addressing.pdf'][0]}`,
      authority: 'official_postal_dictionary', geometryAuthority: 'none' },
    geometryInput: { dataset: 'Vector polygons of the Sub-Antarctic coastline', edition: '1.0', doi: '10.5285/c1d83502-8799-4e3c-bdca-21db6a4405d4',
      archiveDigest: `sha256:${RECEIPTS['sub_antarctic_coastline_high_res_polygon_v1.0.zip'][0]}`, convertedDigest: geometrySource.digest,
      sourceFeatures: EXPECTED_FEATURES, sourceRings: parsed.rings, sourcePositions: parsed.positions, bounds: parsed.bounds },
    transformation: { command: 'ogr2ogr -f GeoJSON -t_srs EPSG:4326 -where "source=South Georgia GIS" output.geojson source.shp',
      method: 'exact-source-filter-crs-reprojection-and-natural-longitude-gap-partition', longitudePartition: -30,
      groups: parsed.counts, outputMultiPolygons: features.length, outputSquareKilometres: parsed.squareKilometres,
      coordinateRounding: false, coordinateSimplification: false, polygonPartsPreservedExactlyOnce: true,
      allSourceFeaturesTurfValid: true, allSourceFeaturesJstsValid: true, allOutputTurfValid: true, allOutputJstsValid: true },
    policy: { outputProvenance: 'derived', officialPostalGeometryClaimed: false, addressOrBuildingRowsPublished: 0,
      recipientCustomerOrLandRightsRowsPublished: 0, administrativeIdentityChangedOrMerged: false, inventedAreaRowsPublished: 0 },
    artifacts: { graph: graphArtifact, geometry: geometryArtifact, descriptor: descriptorArtifact },
  };
  if (reportPath) writeJson(reportPath, report, true);
  return report;
}

export { build, parseSource };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) fail('usage-source-directory-required');
  const sourceDirectory = resolve(process.argv[2]);
  const outputDirectory = resolve(process.argv[3] ?? join(ROOT, 'data/postal_country_packs/gs/postal-context/m2'));
  const reportPath = process.argv[4] ? resolve(process.argv[4]) : undefined;
  console.log(JSON.stringify(build({ sourceDirectory, outputDirectory, reportPath }), null, 2));
}

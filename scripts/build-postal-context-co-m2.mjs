import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_ID = 'co-472-national-postal-areas-20260901';
const RELEASE_INSTANT = '2026-08-31T18:08:30.995Z';
const ASSIGNMENT_DATE = '2025-05-20';
const SHAPEFILE_DATE = '2016-06-28';
const CSV_DIGEST = 'sha256:e2fc2c40402481282ab700366b7692031c57f118eb01e07212779333ba72bf6e';
const SHAPEFILE_ARCHIVE_DIGEST = 'sha256:121d26a488ae9b2dd73e72e2d9495a9b892ca3068b95fe969fc64610d7615ff8';
const DISPLAY_INPUT_DIGEST = 'sha256:d8c2cc3da30a5da4cfb1f8e6e91fe88d1cd7d1ea618ce90e45b5322ca711e7e9';
const DATASET_METADATA_DIGEST = 'sha256:4772bdfea1e93c037b31ae1928bf60fb86c9303b7d1d28cfee78d5d0796cc928';
const OPEN_CLAUSE_DIGEST = 'sha256:78a301079fdd0ef473b264123185ff3ddf70a84d3f26cfa5669d2aa3bcac9198';
const LAYER_SCHEMA_DIGEST = 'sha256:8780c7f6c5051b8c6e4fb6dad90186a3003a607fa9f3110ae1e2d9549ec8faa2';
const EXPECTED_RECORDS = 3_681;
const EXPECTED_BOUNDS = [-81.735813, -4.227887, -66.847339, 13.393803];
const SIMPLIFICATION_TOLERANCE_DEGREES = 0.001;
const LICENSE_ID = 'CC-BY-SA-4.0-datos-gov-co-and-472-open-clause';

function fail(message) {
  throw new Error(`co-m2-${message}`);
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

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/u, ''));
      rows.push(row);
      row = [];
      field = '';
    } else field += character;
  }
  if (quoted) fail('csv-unclosed-quote');
  if (field || row.length) {
    row.push(field.replace(/\r$/u, ''));
    rows.push(row);
  }
  const header = rows.shift();
  if (!header || !header.includes('codigo_postal') || header.length !== 14) fail('csv-header');
  return rows.filter(item => item.some(Boolean)).map((values, index) => {
    if (values.length !== header.length) fail(`csv-columns-${index + 2}`);
    return Object.fromEntries(header.map((key, column) => [key, values[column]]));
  });
}

function normalizeSocrataPostalNumber(value) {
  if (!/^\d{1,3}(?:\.\d{1,3})?$/u.test(value)) fail(`csv-postal-number-${value}`);
  const [whole, fraction = ''] = value.split('.');
  const code = `${whole.padStart(3, '0')}${fraction.padEnd(3, '0')}`;
  if (!/^\d{6}$/u.test(code)) fail(`csv-postal-code-${value}`);
  return code;
}

function parseAssignments(bytes) {
  if (sha256(bytes) !== CSV_DIGEST) fail('csv-digest');
  const rows = parseCsv(bytes.toString('utf8')).map(row => ({
    postalCode: normalizeSocrataPostalNumber(row.codigo_postal),
    departmentCode: String(row.codigo_departamento).padStart(2, '0'),
    departmentName: row.nombre_departamento.trim(),
    municipalityCode: String(row.codigo_municipio).padStart(5, '0'),
    municipalityName: row.nombre_municipio.trim(),
    areaType: row.tipo.trim(),
  }));
  if (rows.length !== EXPECTED_RECORDS) fail(`csv-record-count-${rows.length}`);
  if (new Set(rows.map(row => row.postalCode)).size !== EXPECTED_RECORDS) fail('csv-duplicate-postal-code');
  if (rows.some(row => !/^\d{6}$/u.test(row.postalCode)
    || !/^\d{2}$/u.test(row.departmentCode)
    || !/^\d{5}$/u.test(row.municipalityCode)
    || !row.departmentName || !row.municipalityName
    || !['Rural', 'Urbano'].includes(row.areaType))) fail('csv-row-contract');
  return rows.sort((left, right) => left.postalCode.localeCompare(right.postalCode));
}

function polygonsFor(geometry) {
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  fail(`non-polygon-${geometry.type}`);
}

function normalizeDisplayGeometry(input, postalCode) {
  let droppedNonAreaParts = 0;
  let geometries = [input];
  if (input?.type === 'GeometryCollection') {
    geometries = input.geometries.filter(item => ['Polygon', 'MultiPolygon'].includes(item?.type));
    droppedNonAreaParts = input.geometries.length - geometries.length;
  }
  const polygons = geometries.flatMap(polygonsFor);
  if (!polygons.length) fail(`missing-polygon-${postalCode}`);
  const geometry = { type: 'MultiPolygon', coordinates: polygons };
  let positions = 0;
  let rings = 0;
  for (const polygon of polygons) {
    if (!polygon.length) fail(`empty-polygon-${postalCode}`);
    for (const ring of polygon) {
      if (!Array.isArray(ring) || ring.length < 4) fail(`short-ring-${postalCode}`);
      const first = ring[0];
      const last = ring.at(-1);
      if (first[0] !== last[0] || first[1] !== last[1]) fail(`open-ring-${postalCode}`);
      for (const position of ring) {
        if (!Array.isArray(position) || position.length < 2
          || !Number.isFinite(position[0]) || !Number.isFinite(position[1])
          || position[0] < -82 || position[0] > -66
          || position[1] < -5 || position[1] > 14) fail(`position-${postalCode}`);
        positions += 1;
      }
      rings += 1;
    }
  }
  return { geometry, positions, rings, droppedNonAreaParts };
}

function parseDisplay(bytes, assignments) {
  if (sha256(bytes) !== DISPLAY_INPUT_DIGEST) fail('display-input-digest');
  const collection = JSON.parse(bytes.toString('utf8'));
  if (collection?.type !== 'FeatureCollection' || collection.features?.length !== EXPECTED_RECORDS) {
    fail('display-feature-collection');
  }
  const assignmentCodes = new Set(assignments.map(row => row.postalCode));
  const seen = new Set();
  let positions = 0;
  let rings = 0;
  let geometryCollections = 0;
  let droppedNonAreaParts = 0;
  const features = collection.features.map(item => {
    const postalCode = String(item?.properties?.Codigo_Pos ?? '');
    if (!assignmentCodes.has(postalCode) || seen.has(postalCode)) fail(`display-code-${postalCode}`);
    seen.add(postalCode);
    if (item.geometry?.type === 'GeometryCollection') geometryCollections += 1;
    const normalized = normalizeDisplayGeometry(item.geometry, postalCode);
    positions += normalized.positions;
    rings += normalized.rings;
    droppedNonAreaParts += normalized.droppedNonAreaParts;
    return { postalCode, geometry: normalized.geometry };
  }).sort((left, right) => left.postalCode.localeCompare(right.postalCode));
  if (seen.size !== assignmentCodes.size) fail('display-code-set');
  if (geometryCollections !== 1 || droppedNonAreaParts !== 1) fail('display-non-area-normalization');
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  const visit = value => {
    if (Array.isArray(value) && value.length >= 2
      && typeof value[0] === 'number' && typeof value[1] === 'number') {
      bounds[0] = Math.min(bounds[0], value[0]);
      bounds[1] = Math.min(bounds[1], value[1]);
      bounds[2] = Math.max(bounds[2], value[0]);
      bounds[3] = Math.max(bounds[3], value[1]);
      return;
    }
    if (!Array.isArray(value)) fail('display-coordinate-tree');
    value.forEach(visit);
  };
  features.forEach(item => visit(item.geometry.coordinates));
  if (canonicalJson(bounds) !== canonicalJson(EXPECTED_BOUNDS)) fail(`display-bounds-${bounds.join('-')}`);
  return { features, positions, rings, geometryCollections, droppedNonAreaParts };
}

function build({ csvPath, displayPath, outputDirectory, reportPath }) {
  const assignments = parseAssignments(readFileSync(csvPath));
  const display = parseDisplay(readFileSync(displayPath), assignments);
  const assignmentByCode = new Map(assignments.map(row => [row.postalCode, row]));
  const validTime = { from: `${ASSIGNMENT_DATE}T20:24:15.000Z`, to: null };
  const knownTime = { from: RELEASE_INSTANT, to: null };
  const assignmentSource = {
    sourceId: 'datos-gov-co-ixig-z8b5-20250520', sourceType: 'official',
    assignmentAuthority: 'official_postal_operator', geometryAuthority: 'none',
    sourceVersion: 'Códigos Postales Nacionales ixig-z8b5; rowsUpdatedAt 2025-05-20T20:24:15Z; 3,681 distinct national rows',
    sourceDate: ASSIGNMENT_DATE, licenseId: LICENSE_ID, digest: CSV_DIGEST,
  };
  const geometrySource = {
    sourceId: 'co-472-shapefile-20160628-derived-display-20260901', sourceType: 'derived',
    assignmentAuthority: 'official_postal_operator',
    geometryAuthority: 'derived_geometry',
    sourceVersion: `4-72 Shapefile ${SHAPEFILE_DATE}; GDAL 3.12.1 simplify-preserve-topology ${SIMPLIFICATION_TOLERANCE_DEGREES} degrees, make-valid, RFC7946 6 decimals; exact 3,681-code equality with 2025 assignments; one collapsed non-area line discarded, no area created`,
    sourceDate: SHAPEFILE_DATE, licenseId: LICENSE_ID,
    digest: DISPLAY_INPUT_DIGEST,
  };
  const countryNode = {
    id: 'country-co', kind: 'administrative_area', featureKind: 'country', geometryType: 'none',
    countryCode: 'CO', label: 'Colombia', visibility: 'public',
  };
  const postalNodes = display.features.map(item => {
    const row = assignmentByCode.get(item.postalCode);
    return {
      id: `postal-co-${item.postalCode}`, kind: 'postal_feature', featureKind: 'standard_area',
      geometryType: 'multipolygon', countryCode: 'CO', postalCode: item.postalCode,
      label: `${item.postalCode} ${row.municipalityName}, ${row.departmentName} — ${row.areaType} derived display surface`,
      visibility: 'public',
    };
  });
  const assertions = display.features.map(item => ({
    id: `co-472-20250520-${item.postalCode}-within-co`,
    fromNodeId: `postal-co-${item.postalCode}`, toNodeId: countryNode.id,
    relation: 'admin_within', validTime, knownTime, source: assignmentSource,
    method: 'official_crosswalk',
    quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT },
  }));
  const features = display.features.map(item => ({
    id: `co-472-derived-${item.postalCode}`, nodeId: `postal-co-${item.postalCode}`,
    role: 'postal_area', publicationClass: 'public_context', geometry: item.geometry,
    source: geometrySource, validTime, knownTime,
    quality: { status: 'derived', confidence: 0.97, accuracyMeters: 120, validatedAt: RELEASE_INSTANT },
  }));

  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, {
    schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'CO', releaseId: RELEASE_ID, features,
  });
  const graphRelease = {
    schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-co-472-national',
    repositoryUrl: 'https://github.com/veygrit-sys/Address-Grid-ID', countryCode: 'CO',
    releaseId: RELEASE_ID, policyVersion: 'co-472-national-derived-display-v1',
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
    schemaVersion: 'postal-context-graph/v0.1', release: graphRelease,
    nodes: [countryNode, ...postalNodes], assertions,
  });
  const descriptorPath = join(outputDirectory, 'descriptor.json');
  const descriptorArtifact = writeJson(descriptorPath, {
    schemaVersion: 'postal-context-pack-descriptor/v0.1', repositoryId: graphRelease.repositoryId,
    countryCode: 'CO', releaseId: RELEASE_ID, policyVersion: graphRelease.policyVersion,
    sequence: 1, previousDescriptorDigest: null, graphManifestDigest: graphRelease.manifestDigest,
    createdAt: RELEASE_INSTANT, maturity: 'M2_experimental', synthetic: false,
    promotionEligible: true, containsResidentialAddressPoints: false,
    artifacts: [
      { role: 'graph', path: basename(graphPath), mediaType: 'application/vnd.agid.postal-context-graph+json',
        schemaVersion: 'postal-context-graph/v0.1', byteLength: graphArtifact.byteLength,
        digest: graphArtifact.digest, recordCounts: { nodes: postalNodes.length + 1, assertions: assertions.length } },
      { role: 'geometry', path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json',
        schemaVersion: 'postal-context-geometry/v0.1', byteLength: geometryArtifact.byteLength,
        digest: geometryArtifact.digest, recordCounts: { features: features.length, positions: display.positions } },
    ],
  });
  const report = {
    schemaVersion: 'postal-context-co-m2-build/v1', countryCode: 'CO', generatedAt: RELEASE_INSTANT,
    releaseId: RELEASE_ID,
    input: {
      assignmentCsv: { digest: CSV_DIGEST, records: assignments.length, distinctPostalCodes: assignments.length,
        sourceDate: ASSIGNMENT_DATE, metadataDigest: DATASET_METADATA_DIGEST },
      postalShapefileArchive: { digest: SHAPEFILE_ARCHIVE_DIGEST, sourceDate: SHAPEFILE_DATE,
        records: display.features.length, displayInputDigest: DISPLAY_INPUT_DIGEST,
        layerSchemaDigest: LAYER_SCHEMA_DIGEST },
      rights: { datosGovCoLicense: 'CC BY-SA 4.0', openClauseDigest: OPEN_CLAUSE_DIGEST,
        requiredAttribution: 'Fuente: MINTIC-Servicios Postales Nacionales 4-72 (Unidad Código Postal Colombia)' },
    },
    scope: { nationalCoverageClaimed: true, assignmentRecords: assignments.length,
      assignmentOnlyCodes: 0, geometryOnlyCodes: 0, urbanRecords: assignments.filter(row => row.areaType === 'Urbano').length,
      ruralRecords: assignments.filter(row => row.areaType === 'Rural').length,
      excludedObjectTypes: ['expanded-postcode', 'site-of-interest', 'property', 'address', 'building', 'po-box', 'organization', 'route'] },
    geometry: { outputProvenance: 'derived', officialSourcePolygons: display.features.length,
      outputMultiPolygons: features.length, positions: display.positions, rings: display.rings,
      bounds: EXPECTED_BOUNDS, simplificationToleranceDegrees: SIMPLIFICATION_TOLERANCE_DEGREES,
      coordinatePrecision: 6, allOgrValidBeforeAndAfterTransform: true, allRingsClosed: true,
      sourceGeometryCollections: display.geometryCollections,
      droppedCollapsedNonAreaParts: display.droppedNonAreaParts,
      inventedAreaRows: 0, confidence: 0.97, accuracyMeters: 120 },
    policy: { officialPostalGeometryClaimed: false, derivedFromOfficialPostalGeometry: true,
      addressOrBuildingRowsPublished: 0, recipientCustomerPropertyOrLandRightsRowsPublished: 0,
      expandedSitePropertyAdministrativeBufferHullVoronoiModelOrAgidProxyRows: 0 },
    artifacts: {
      graph: { ...graphArtifact, path: 'graph.json' },
      geometry: { ...geometryArtifact, path: 'geometry.json' },
      descriptor: { ...descriptorArtifact, path: 'descriptor.json' },
    },
  };
  if (reportPath) writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

export { build, normalizeSocrataPostalNumber, parseAssignments, parseDisplay };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const csvPath = resolve(process.argv[2] ?? '');
  const displayPath = resolve(process.argv[3] ?? '');
  const outputDirectory = resolve(process.argv[4] ?? join(ROOT, 'data/postal_country_packs/co/postal-context/m2'));
  const reportPath = process.argv[5] ? resolve(process.argv[5]) : undefined;
  if (!process.argv[2] || !process.argv[3]) fail('usage-csv-display-required');
  console.log(JSON.stringify(build({ csvPath, displayPath, outputDirectory, reportPath }), null, 2));
}

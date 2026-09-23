import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_ID = 'py-dinacopa-national-postal-zones-20260902';
const RELEASE_INSTANT = '2026-09-02T05:02:03.144Z';
const SOURCE_DATE = '2018-02-19';
const METADATA_MODIFIED = '2023-11-08';
const ASSIGNMENT_DIGEST = 'sha256:31582c1fec56d3d2d21215c8c7472a8d56bddb97ac8ca29d5cd4690abf12a208';
const DISPLAY_INPUT_DIGEST = 'sha256:6ce1239d15c20e80393c0c1457090095ff82df151f44f596aa36796d47340640';
const SHP_DIGEST = 'sha256:abc2c58b04ab7de61436f01938e7c8a2e8d561738ff8392629a40815d55699e7';
const DBF_DIGEST = 'sha256:f513bddb1ccd368843c1da5968f254ebe85c546eba53fef581d6d556df9d8589';
const SHX_DIGEST = 'sha256:4ef8bea2dd8e9a3b07be77beb9eee017cb7262ab9364eef3c4eb47c6c9041324';
const PRJ_DIGEST = 'sha256:d26a953b5eb0782c31f0c8148f48177508cd0bf977e8667eaf7bf36b0ce97a5e';
const CSV_DIGEST = 'sha256:fe1d54c15d2d1e4c5ea4a170960397989105f45306e9a0a3e4b25afdd57945dd';
const DICTIONARY_DIGEST = 'sha256:ac8d2303aec3309d02bac672d8dc789ea868b7d58159c11f0951362f6dea588d';
const METADATA_DIGEST = 'sha256:29a677eff064f7426ea48350d0e43df653f63d39002f5bc4a410d07d294f358f';
const LICENSE_SHELL_DIGEST = 'sha256:b6a6ca4ed6be1d9103434cec14f193580747cbf6fec8a2c82e73b0c2e3d442d7';
const LICENSE_BUNDLE_DIGEST = 'sha256:2d5d19e86534e3f815ddc1b569143c86ed3fa553baec9ed162ed5b8f48477ade';
const CURRENT_SYSTEM_DIGEST = 'sha256:4e7f6fc0549080ca97955a51d96c94398c1f71c7b8ec79d17313f891060d1c01';
const EXPECTED_SOURCE_ROWS = 8_646;
const EXPECTED_POSTAL_CODES = 2_887;
const EXPECTED_DEPARTMENTS = 18;
const EXPECTED_DISTRICTS = 259;
const EXPECTED_BOUNDS = [-62.6446174, -27.5918336, -54.2589239, -19.2896];
const EXPECTED_POSITIONS = 339_723;
const EXPECTED_RINGS = 8_058;
const EXPECTED_REMOVED_NUMERICAL_HOLES = 63;
const EXPECTED_REMOVED_CONSECUTIVE_DUPLICATES = 1;
const RING_AREA_EPSILON = 1e-12;
const LICENSE_ID = 'PY-PUBLIC-INFORMATION-USE-DECREE-4064-LAW-5282-2014';

function fail(message) {
  throw new Error(`py-m2-${message}`);
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
  const expected = [
    'department_code', 'department_name', 'district_code', 'district_name', 'area_class',
    'barrio_locality_code', 'barrio_locality_name', 'dwellings_2014', 'postal_division',
    'postal_zone', 'postal_code', 'observation', 'source_barrio_id',
  ];
  if (!header || canonicalJson(header) !== canonicalJson(expected)) fail('csv-header');
  return rows.filter(item => item.some(Boolean)).map((values, index) => {
    if (values.length !== header.length) fail(`csv-columns-${index + 2}`);
    return Object.fromEntries(header.map((key, column) => [key, values[column]]));
  });
}

function parseAssignments(bytes) {
  if (sha256(bytes) !== ASSIGNMENT_DIGEST) fail('assignment-digest');
  const rows = parseCsv(bytes.toString('utf8')).map((row, index) => ({
    sourceRow: index + 1,
    departmentCode: row.department_code,
    departmentName: row.department_name.trim(),
    districtCode: row.district_code,
    districtName: row.district_name.trim(),
    areaClass: row.area_class,
    barrioLocalityCode: row.barrio_locality_code,
    barrioLocalityName: row.barrio_locality_name.trim(),
    postalDivision: row.postal_division,
    postalZone: row.postal_zone,
    postalCode: row.postal_code,
    observation: row.observation.trim(),
    sourceBarrioId: row.source_barrio_id,
  }));
  if (rows.length !== EXPECTED_SOURCE_ROWS) fail(`assignment-record-count-${rows.length}`);
  for (const row of rows) {
    if (!/^\d{2}$/u.test(row.departmentCode) || !/^\d{2}$/u.test(row.districtCode)
      || !/^\d{2}$/u.test(row.postalDivision) || !/^(?:\d{2})?$/u.test(row.postalZone)
      || !/^\d{6}$/u.test(row.postalCode) || !row.departmentName || !row.districtName
      || !row.barrioLocalityName || row.postalCode.slice(0, 2) !== row.departmentCode
      || row.postalCode.slice(2, 4) !== row.districtCode
      || row.postalCode.slice(4, 6) !== row.postalDivision) fail(`assignment-contract-${row.sourceRow}`);
  }
  if (new Set(rows.map(row => row.postalCode)).size !== EXPECTED_POSTAL_CODES) fail('postal-code-count');
  if (new Set(rows.map(row => row.departmentCode)).size !== EXPECTED_DEPARTMENTS) fail('department-count');
  if (new Set(rows.map(row => `${row.departmentCode}${row.districtCode}`)).size !== EXPECTED_DISTRICTS) fail('district-count');
  return rows;
}

function parseDisplay(bytes, assignmentCodes) {
  if (sha256(bytes) !== DISPLAY_INPUT_DIGEST) fail('display-input-digest');
  const collection = JSON.parse(bytes.toString('utf8'));
  if (collection?.type !== 'FeatureCollection' || collection.features?.length !== EXPECTED_POSTAL_CODES) {
    fail('display-feature-collection');
  }
  const seen = new Set();
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  let positions = 0;
  let rings = 0;
  let removedNumericalHoles = 0;
  let removedConsecutiveDuplicates = 0;
  let promotedPolygons = 0;
  const signedArea = ring => {
    let twiceArea = 0;
    for (let index = 1; index < ring.length; index += 1) {
      const previous = ring[index - 1];
      const current = ring[index];
      twiceArea += previous[0] * current[1] - current[0] * previous[1];
    }
    return twiceArea / 2;
  };
  const normalizeRing = ring => {
    const normalized = [];
    for (const position of ring) {
      const previous = normalized.at(-1);
      if (previous && previous[0] === position[0] && previous[1] === position[1]) {
        removedConsecutiveDuplicates += 1;
      } else normalized.push(position);
    }
    const first = normalized[0];
    const last = normalized.at(-1);
    if (first && last && (first[0] !== last[0] || first[1] !== last[1])) normalized.push([...first]);
    return normalized;
  };
  const visitPosition = position => {
    if (!Array.isArray(position) || position.length < 2
      || !Number.isFinite(position[0]) || !Number.isFinite(position[1])
      || position[0] < -63 || position[0] > -54
      || position[1] < -28 || position[1] > -19) fail('display-position');
    bounds[0] = Math.min(bounds[0], position[0]);
    bounds[1] = Math.min(bounds[1], position[1]);
    bounds[2] = Math.max(bounds[2], position[0]);
    bounds[3] = Math.max(bounds[3], position[1]);
    positions += 1;
  };
  const features = collection.features.map(item => {
    const postalCode = String(item?.properties?.COD_POST ?? '');
    if (!assignmentCodes.has(postalCode) || seen.has(postalCode)) fail(`display-code-${postalCode}`);
    seen.add(postalCode);
    let coordinates;
    if (item.geometry?.type === 'MultiPolygon') coordinates = item.geometry.coordinates;
    else if (item.geometry?.type === 'Polygon') {
      coordinates = [item.geometry.coordinates];
      promotedPolygons += 1;
    } else fail(`display-type-${postalCode}`);
    if (!Array.isArray(coordinates) || !coordinates.length) fail(`display-type-${postalCode}`);
    const normalizedPolygons = [];
    for (const polygon of coordinates) {
      if (!Array.isArray(polygon) || !polygon.length) fail(`display-polygon-${postalCode}`);
      const normalizedPolygon = [];
      for (let ringIndex = 0; ringIndex < polygon.length; ringIndex += 1) {
        const ring = normalizeRing(polygon[ringIndex]);
        if (!Array.isArray(ring) || ring.length < 4) fail(`display-ring-${postalCode}`);
        const first = ring[0];
        const last = ring.at(-1);
        if (first[0] !== last[0] || first[1] !== last[1]) fail(`display-open-ring-${postalCode}`);
        if (ringIndex > 0 && Math.abs(signedArea(ring)) <= RING_AREA_EPSILON) {
          removedNumericalHoles += 1;
          continue;
        }
        if (Math.abs(signedArea(ring)) <= RING_AREA_EPSILON) fail(`display-zero-area-outer-${postalCode}`);
        ring.forEach(visitPosition);
        rings += 1;
        normalizedPolygon.push(ring);
      }
      if (!normalizedPolygon.length) fail(`display-empty-polygon-${postalCode}`);
      normalizedPolygons.push(normalizedPolygon);
    }
    return { postalCode, geometry: { type: 'MultiPolygon', coordinates: normalizedPolygons } };
  }).sort((left, right) => left.postalCode.localeCompare(right.postalCode));
  if (seen.size !== assignmentCodes.size || canonicalJson(bounds) !== canonicalJson(EXPECTED_BOUNDS)
    || positions !== EXPECTED_POSITIONS || rings !== EXPECTED_RINGS
    || removedNumericalHoles !== EXPECTED_REMOVED_NUMERICAL_HOLES
    || removedConsecutiveDuplicates !== EXPECTED_REMOVED_CONSECUTIVE_DUPLICATES
    || promotedPolygons !== 1) fail('display-metrics');
  return { features, bounds, positions, rings, removedNumericalHoles,
    removedConsecutiveDuplicates, promotedPolygons };
}

function sourceRowLabel(row) {
  const sourceId = row.sourceBarrioId && row.sourceBarrioId !== '0000'
    ? `cod_bar ${row.sourceBarrioId}`
    : `sin cod_bar; BARLOC ${row.barrioLocalityCode || 'none'}`;
  const note = row.observation ? `; ${row.observation}` : '';
  return `${row.barrioLocalityName} [${sourceId}; BARLOC ${row.barrioLocalityCode || 'none'}${note}]`;
}

function localityNodeId(row) {
  return `locality-py-${row.postalCode}-${row.sourceBarrioId || 'none'}-${row.barrioLocalityCode || 'none'}-row-${String(row.sourceRow).padStart(5, '0')}`;
}

function build({ assignmentPath, displayPath, outputDirectory, reportPath }) {
  const assignments = parseAssignments(readFileSync(assignmentPath));
  const assignmentCodes = new Set(assignments.map(row => row.postalCode));
  const display = parseDisplay(readFileSync(displayPath), assignmentCodes);
  const rowsByCode = new Map();
  for (const row of assignments) {
    const rows = rowsByCode.get(row.postalCode) ?? [];
    rows.push(row);
    rowsByCode.set(row.postalCode, rows);
  }
  const departments = [...new Map(assignments.map(row => [row.departmentCode, {
    code: row.departmentCode, name: row.departmentName,
  }])).values()].sort((left, right) => left.code.localeCompare(right.code));
  const districts = [...new Map(assignments.map(row => [`${row.departmentCode}${row.districtCode}`, {
    code: `${row.departmentCode}${row.districtCode}`,
    departmentCode: row.departmentCode,
    districtCode: row.districtCode,
    name: row.districtName,
  }])).values()].sort((left, right) => left.code.localeCompare(right.code));
  const validTime = { from: `${SOURCE_DATE}T00:00:00.000Z`, to: null };
  const knownTime = { from: RELEASE_INSTANT, to: null };
  const source = {
    sourceId: 'datos-gov-py-dinacopa-zona-postal-paraguay-20180219', sourceType: 'official',
    assignmentAuthority: 'official_postal_operator', geometryAuthority: 'none',
    sourceVersion: `DINACOPA ZONA POSTAL PARAGUAY; DBF_DATE_LAST_UPDATE=${SOURCE_DATE}; datos.gov.py metadata modified ${METADATA_MODIFIED}`,
    sourceDate: SOURCE_DATE, licenseId: LICENSE_ID, digest: SHP_DIGEST,
  };
  const geometrySource = {
    ...source,
    sourceId: 'datos-gov-py-dinacopa-zona-postal-paraguay-derived-display-20260902',
    sourceType: 'derived', geometryAuthority: 'derived_geometry', digest: DISPLAY_INPUT_DIGEST,
    sourceVersion: `DINACOPA ${SOURCE_DATE}; MakeValid; union by code before 20m simplify; EPSG:32721 to 4326; grid 1e-7; 9 decimals; 63 sub-epsilon holes removed; derived display; 2,887 valid MultiPolygons`,
  };
  const countryNode = {
    id: 'country-py', kind: 'administrative_area', featureKind: 'country', geometryType: 'none',
    countryCode: 'PY', label: 'Paraguay', visibility: 'public',
  };
  const departmentNodes = departments.map(item => ({
    id: `admin-py-department-${item.code}`, kind: 'administrative_area', featureKind: 'administrative',
    geometryType: 'none', countryCode: 'PY', label: `${item.name} — DINACOPA DPTO ${item.code}`,
    visibility: 'public',
  }));
  const districtNodes = districts.map(item => ({
    id: `admin-py-district-${item.code}`, kind: 'administrative_area', featureKind: 'administrative',
    geometryType: 'none', countryCode: 'PY', label: `${item.name} — DINACOPA distrito ${item.districtCode}, DPTO ${item.departmentCode}`,
    visibility: 'public',
  }));
  const localityNodes = assignments.map(row => ({
    id: localityNodeId(row), kind: 'locality', featureKind: 'locality',
    geometryType: 'none', countryCode: 'PY',
    label: `${row.barrioLocalityName} — postal ${row.postalCode}; ${sourceRowLabel(row).slice(sourceRowLabel(row).indexOf('[') + 1, -1)}; DIV_POST ${row.postalDivision}`,
    visibility: 'public',
  }));
  const postalNodes = display.features.map(item => {
    const rows = rowsByCode.get(item.postalCode);
    const first = rows[0];
    return {
      id: `postal-py-${item.postalCode}`, kind: 'postal_feature', featureKind: 'standard_area',
      geometryType: 'multipolygon', countryCode: 'PY', postalCode: item.postalCode,
      label: `${item.postalCode} ${first.districtName}, ${first.departmentName} — ${rows.length} official barrio/locality context${rows.length === 1 ? '' : 's'}`,
      visibility: 'public',
    };
  });
  const quality = { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT };
  const postalToLocality = assignments.map(row => ({
    id: `dinacopa-py-${row.postalCode}-row-${String(row.sourceRow).padStart(5, '0')}-part-of-locality`,
    fromNodeId: `postal-py-${row.postalCode}`, toNodeId: localityNodeId(row),
    relation: 'part_of', validTime, knownTime,
    source, method: 'direct_source_link', quality,
  }));
  const localityToDistrict = assignments.map(row => ({
      id: `dinacopa-py-locality-row-${String(row.sourceRow).padStart(5, '0')}-within-district-${row.departmentCode}${row.districtCode}`,
      fromNodeId: localityNodeId(row),
      toNodeId: `admin-py-district-${row.departmentCode}${row.districtCode}`,
      relation: 'admin_within', validTime, knownTime, source, method: 'official_crosswalk', quality,
  }));
  const districtToDepartment = districts.map(item => ({
    id: `dinacopa-py-district-${item.code}-within-department-${item.departmentCode}`,
    fromNodeId: `admin-py-district-${item.code}`, toNodeId: `admin-py-department-${item.departmentCode}`,
    relation: 'admin_within', validTime, knownTime, source, method: 'official_crosswalk', quality,
  }));
  const departmentToCountry = departments.map(item => ({
    id: `dinacopa-py-department-${item.code}-within-country`, fromNodeId: `admin-py-department-${item.code}`,
    toNodeId: countryNode.id, relation: 'admin_within', validTime, knownTime, source,
    method: 'official_crosswalk', quality,
  }));
  const assertions = [...postalToLocality, ...localityToDistrict, ...districtToDepartment, ...departmentToCountry];
  const features = display.features.map(item => ({
    id: `dinacopa-py-derived-${item.postalCode}`, nodeId: `postal-py-${item.postalCode}`,
    role: 'postal_area', publicationClass: 'public_context', geometry: item.geometry,
    source: geometrySource, validTime, knownTime,
    quality: { status: 'derived', confidence: 0.98, accuracyMeters: 25, validatedAt: RELEASE_INSTANT },
  }));

  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, {
    schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'PY', releaseId: RELEASE_ID, features,
  });
  const graphRelease = {
    schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-py-dinacopa-national',
    repositoryUrl: 'https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure', countryCode: 'PY',
    releaseId: RELEASE_ID, policyVersion: 'py-dinacopa-national-derived-display-v1',
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
  const graphNodes = [countryNode, ...departmentNodes, ...districtNodes, ...localityNodes, ...postalNodes];
  const graphArtifact = writeJson(graphPath, {
    schemaVersion: 'postal-context-graph/v0.1', release: graphRelease, nodes: graphNodes, assertions,
  });
  const descriptorPath = join(outputDirectory, 'descriptor.json');
  const descriptorArtifact = writeJson(descriptorPath, {
    schemaVersion: 'postal-context-pack-descriptor/v0.1', repositoryId: graphRelease.repositoryId,
    countryCode: 'PY', releaseId: RELEASE_ID, policyVersion: graphRelease.policyVersion,
    sequence: 1, previousDescriptorDigest: null, graphManifestDigest: graphRelease.manifestDigest,
    createdAt: RELEASE_INSTANT, maturity: 'M2_experimental', synthetic: false,
    promotionEligible: true, containsResidentialAddressPoints: false,
    artifacts: [
      { role: 'graph', path: basename(graphPath), mediaType: 'application/vnd.agid.postal-context-graph+json',
        schemaVersion: 'postal-context-graph/v0.1', byteLength: graphArtifact.byteLength,
        digest: graphArtifact.digest, recordCounts: { nodes: graphNodes.length, assertions: assertions.length } },
      { role: 'geometry', path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json',
        schemaVersion: 'postal-context-geometry/v0.1', byteLength: geometryArtifact.byteLength,
        digest: geometryArtifact.digest, recordCounts: { features: features.length, positions: display.positions } },
    ],
  });
  const largestContext = [...rowsByCode.entries()].sort((left, right) => right[1].length - left[1].length)[0];
  const report = {
    schemaVersion: 'postal-context-py-m2-build/v1', countryCode: 'PY', generatedAt: RELEASE_INSTANT,
    releaseId: RELEASE_ID,
    input: {
      dataset: { id: '2ba6d169-85d9-433e-ad44-aefa320ceff7', author: 'DINACOPA',
        metadataModified: METADATA_MODIFIED, metadataDigest: METADATA_DIGEST,
        url: 'https://www.datos.gov.py/dataset/nuevo-codigo-postal-del-paraguay' },
      sourceFiles: { shp: SHP_DIGEST, dbf: DBF_DIGEST, shx: SHX_DIGEST, prj: PRJ_DIGEST,
        csv: CSV_DIGEST, dictionary: DICTIONARY_DIGEST, normalizedAttributes: ASSIGNMENT_DIGEST,
        displayInput: DISPLAY_INPUT_DIGEST },
      currentSystemEvidence: { observedAt: RELEASE_INSTANT, digest: CURRENT_SYSTEM_DIGEST,
        url: 'https://correoparaguayo.gov.py/sitio/la-importancia-del-codigo-postal-para-ubicar-las-direcciones-7/',
        statement: 'Correo Paraguayo documents the current six-digit department/district/barrio structure and example 001518.' },
      rights: { licenseId: LICENSE_ID, shellDigest: LICENSE_SHELL_DIGEST,
        bundleDigest: LICENSE_BUNDLE_DIGEST, url: 'https://www.paraguay.gov.py/datos-abiertos/licencias',
        permission: 'Free, perpetual, non-exclusive copying, extraction, reproduction, distribution, public communication, adaptation and transformation.',
        conditions: ['cite public source and this license', 'cite last update when known', 'do not imply official or state-sponsored use'] },
    },
    scope: { sourceRows: assignments.length, distinctPostalCodes: display.features.length,
      departments: departments.length, districts: districts.length, sourceBarrioLocalityContexts: assignments.length,
      largestContext: { postalCode: largestContext[0], rows: largestContext[1].length },
      codeStructureMismatches: 0, missingRequiredLabels: 0,
      rowsWithoutLegacyPostalZoneField: assignments.filter(row => !row.postalZone).length,
      exceptionalIndustrialIslandRowsWithoutBarrioCode: assignments.filter(row => row.sourceBarrioId === '0000').length,
      excludedObjectTypes: ['point', 'route', 'po-box', 'organization', 'property', 'address', 'building', 'recipient', 'customer', 'land-right'],
    },
    geometry: { outputProvenance: 'derived', officialSourceRows: assignments.length,
      officialDistinctPostalCodes: display.features.length, outputMultiPolygons: features.length,
      positions: display.positions, rings: display.rings, bounds: display.bounds,
      sourceCrs: 'EPSG:32721', outputCrs: 'EPSG:4326', sourceInvalidPolygonsRepaired: 5,
      simplificationOrder: 'postal-code-union-before-simplify',
      simplificationToleranceMeters: 20, outputSnapGridDegrees: 0.0000001, coordinatePrecision: 9,
      removedSubEpsilonNumericalHoles: display.removedNumericalHoles,
      removedConsecutiveDuplicatePositions: display.removedConsecutiveDuplicates,
      promotedPolygonFeatures: display.promotedPolygons,
      allOgrValid: true, allNonEmpty: true, allRingsClosed: true, inventedAreaRows: 0,
      confidence: 0.98, accuracyMeters: 25 },
    identity: { countryNodes: 1, departmentNodes: departmentNodes.length, districtNodes: districtNodes.length,
      postalLocalityContextNodes: localityNodes.length, postalNodes: postalNodes.length,
      sourceBarrioIdMayRepeatAcrossPostalCodes: true,
      stableContextIdentity: 'one source-row locality context node keyed by postal code, cod_bar, BARLOC and fixed digest-pinned row number; label preserves name and exception note' },
    policy: { officialPostalGeometryClaimed: false, derivedFromOfficialPostalGeometry: true,
      addressOrBuildingRowsPublished: 0, recipientCustomerPropertyOrLandRightsRowsPublished: 0,
      pointRoutePoBoxOrganizationAreaInvented: 0 },
    artifacts: { graph: { ...graphArtifact, path: 'graph.json' },
      geometry: { ...geometryArtifact, path: 'geometry.json' },
      descriptor: { ...descriptorArtifact, path: 'descriptor.json' } },
  };
  if (reportPath) writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

export { build, parseAssignments, parseDisplay };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const assignmentPath = resolve(process.argv[2] ?? '');
  const displayPath = resolve(process.argv[3] ?? '');
  const outputDirectory = resolve(process.argv[4] ?? join(ROOT, 'data/postal_country_packs/py/postal-context/m2'));
  const reportPath = process.argv[5] ? resolve(process.argv[5]) : undefined;
  if (!process.argv[2] || !process.argv[3]) fail('usage-assignment-display-required');
  console.log(JSON.stringify(build({ assignmentPath, displayPath, outputDirectory, reportPath }), null, 2));
}

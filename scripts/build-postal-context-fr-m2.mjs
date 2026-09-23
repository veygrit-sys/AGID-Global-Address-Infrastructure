import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import area from '@turf/area';
import booleanValid from '@turf/boolean-valid';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CSV_DIGEST = 'sha256:f921ac020ca3b9efebd8f0d01782555fb70d63d1ae36535109c67e4a74bd6e22';
const API_SET_DIGEST = 'sha256:76d9f52e38386339a15d3becc6f4ed6eb3605af3cb82669cea772feb8fd586ec';
const DATASET_METADATA_DIGEST = 'sha256:1715e9fbe79c398f5619ef4b68b72a8a79c4c6491e43355288f1abee8b99ea1e';
const RELEASE_ID = 'fr-laposte-paris-arrondissements-20260830';
const RELEASE_INSTANT = '2026-08-30T06:52:44.942Z';
const DATASET_DATE = '2026-08-08';
const LICENSE_ID = 'etalab-open-licence-2.0';
const EXPECTED_CODES = Array.from({ length: 20 }, (_, index) => `75${String(index + 1).padStart(3, '0')}`);
const MAX_POSITIONS = 20_000;
const MAX_POSITIONS_PER_RING = 5_000;

function fail(message) {
  throw new Error(`fr-m2-${message}`);
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

function parseOfficialCsv(bytes) {
  if (sha256(bytes) !== CSV_DIGEST) fail('csv-digest');
  const text = new TextDecoder('windows-1252', { fatal: true }).decode(bytes);
  const lines = text.split(/\r?\n/u).filter(Boolean);
  if (lines.shift() !== '#Code_commune_INSEE;Nom_de_la_commune;Code_postal;Libellé_d_acheminement;Ligne_5') {
    fail('csv-header');
  }
  const rows = lines.map((line, index) => {
    const fields = line.split(';');
    if (fields.length !== 5) fail(`csv-field-count-${index + 2}`);
    const [insee, commune, postalCode, routingLabel, line5] = fields;
    if (!/^[0-9A-Z]{5}$/u.test(insee) || !/^\d{5}$/u.test(postalCode) || !commune || !routingLabel) {
      fail(`csv-row-${index + 2}`);
    }
    return { insee, commune, postalCode, routingLabel, line5 };
  });
  if (rows.length !== 39_192) fail(`csv-row-count-${rows.length}`);
  const postcodes = new Set(rows.map(row => row.postalCode));
  const communes = new Set(rows.map(row => row.insee));
  if (postcodes.size !== 6_328) fail(`csv-postcode-count-${postcodes.size}`);
  if (communes.size !== 35_007) fail(`csv-commune-count-${communes.size}`);
  const exactRows = new Set(rows.map(row => canonicalJson(row)));
  if (exactRows.size !== rows.length) fail('csv-exact-duplicate');

  const parisRows = EXPECTED_CODES.map((postalCode, index) => {
    const matches = rows.filter(row => row.postalCode === postalCode);
    if (matches.length !== 1) fail(`csv-paris-cardinality-${postalCode}-${matches.length}`);
    const expectedInsee = `751${String(index + 1).padStart(2, '0')}`;
    const expectedCommune = `PARIS ${String(index + 1).padStart(2, '0')}`;
    if (matches[0].insee !== expectedInsee || matches[0].commune !== expectedCommune) {
      fail(`csv-paris-identity-${postalCode}`);
    }
    return matches[0];
  });
  return { rows, parisRows, distinctPostcodes: postcodes.size, distinctCommunes: communes.size };
}

function polygonsFor(geometry) {
  return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
}

function inspectGeometry(geometry, code) {
  if (!geometry || !['Polygon', 'MultiPolygon'].includes(geometry.type)) fail(`geometry-type-${code}`);
  let positions = 0;
  let rings = 0;
  for (const polygon of polygonsFor(geometry)) {
    if (!Array.isArray(polygon) || !polygon.length) fail(`geometry-empty-polygon-${code}`);
    for (const ring of polygon) {
      if (!Array.isArray(ring) || ring.length < 4 || ring.length > MAX_POSITIONS_PER_RING) {
        fail(`geometry-ring-size-${code}`);
      }
      rings += 1;
      const first = ring[0];
      const last = ring.at(-1);
      if (first[0] !== last[0] || first[1] !== last[1]) fail(`geometry-open-ring-${code}`);
      for (const position of ring) {
        if (!Array.isArray(position) || position.length < 2) fail(`geometry-position-${code}`);
        const [longitude, latitude] = position;
        if (!Number.isFinite(longitude) || !Number.isFinite(latitude)
          || longitude < 2.2 || longitude > 2.5 || latitude < 48.7 || latitude > 49.0) {
          fail(`geometry-position-range-${code}`);
        }
        positions += 1;
      }
    }
  }
  const feature = { type: 'Feature', properties: {}, geometry };
  if (!booleanValid(feature)) fail(`geometry-invalid-${code}`);
  const squareMeters = area(feature);
  if (!Number.isFinite(squareMeters) || squareMeters <= 0) fail(`geometry-area-${code}`);
  return { positions, rings, squareMeters };
}

function parseApiRows(directory, csvParisRows) {
  const names = readdirSync(directory).filter(name => name.endsWith('.json')).sort();
  const expectedNames = EXPECTED_CODES.map(code => `${code}.json`);
  if (canonicalJson(names) !== canonicalJson(expectedNames)) fail('api-file-set');
  const aggregate = createHash('sha256');
  const rows = names.map((name, index) => {
    const bytes = readFileSync(join(directory, name));
    aggregate.update(bytes);
    const payload = JSON.parse(bytes.toString('utf8'));
    if (payload.total !== 1 || !Array.isArray(payload.results) || payload.results.length !== 1) {
      fail(`api-cardinality-${name}`);
    }
    const row = payload.results[0];
    const expected = csvParisRows[index];
    if (row.code_postal !== expected.postalCode
      || row.code_commune_insee !== expected.insee
      || row.nom_de_la_commune !== expected.commune) fail(`api-identity-${name}`);
    if (typeof row._id !== 'string' || !row._id) fail(`api-id-${name}`);
    if (typeof row['_contours_commune.geometry'] !== 'string') fail(`api-geometry-${name}`);
    const geometry = JSON.parse(row['_contours_commune.geometry']);
    const geometryChecks = inspectGeometry(geometry, expected.postalCode);
    return {
      ...expected,
      sourceRecordId: row._id,
      geometry,
      geometryChecks,
      responseDigest: sha256(bytes),
      responseBytes: bytes.length,
    };
  });
  const aggregateDigest = `sha256:${aggregate.digest('hex')}`;
  if (aggregateDigest !== API_SET_DIGEST) fail('api-set-digest');
  const positions = rows.reduce((sum, row) => sum + row.geometryChecks.positions, 0);
  const rings = rows.reduce((sum, row) => sum + row.geometryChecks.rings, 0);
  if (positions > MAX_POSITIONS) fail(`geometry-position-budget-${positions}`);
  return { rows, aggregateDigest, positions, rings };
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value)}\n`, 'utf8');
}

function writeJson(path, value) {
  const bytes = jsonBytes(value);
  writeFileSync(path, bytes);
  return { digest: sha256(bytes), byteLength: bytes.length };
}

function build({ csvPath, apiDirectory, outputDirectory, reportPath }) {
  const csv = parseOfficialCsv(readFileSync(csvPath));
  const api = parseApiRows(apiDirectory, csv.parisRows);
  const compositeDigest = sha256(Buffer.from(canonicalJson({
    csv: CSV_DIGEST,
    apiSet: API_SET_DIGEST,
    metadata: DATASET_METADATA_DIGEST,
  }), 'utf8'));
  const officialAssignmentSource = {
    sourceId: 'fr-la-poste-hexasmal-20260808',
    sourceType: 'official',
    assignmentAuthority: 'official_postal_operator',
    geometryAuthority: 'none',
    sourceVersion: 'Base officielle des codes postaux / resource 008a2dda-2c60-4b63-b910-998f6f818089',
    sourceDate: DATASET_DATE,
    licenseId: LICENSE_ID,
    digest: CSV_DIGEST,
  };
  const officialAdministrativeSource = {
    sourceId: 'fr-geo-api-gouv-commune-contours-via-laposte-data-fair-20260830',
    sourceType: 'official',
    assignmentAuthority: 'none',
    geometryAuthority: 'official_mapping_geometry',
    sourceVersion: 'La Poste Data Fair laposte-hexasmal extension _contours_commune.geometry; 20 exact-query receipts',
    sourceDate: DATASET_DATE,
    licenseId: LICENSE_ID,
    digest: API_SET_DIGEST,
  };
  const derivedDisplaySource = {
    sourceId: 'fr-paris-arrondissement-postcode-display-surface-20260830',
    sourceType: 'derived',
    assignmentAuthority: 'official_postal_operator',
    geometryAuthority: 'official_mapping_geometry',
    sourceVersion: 'Exact one-to-one 75001-75020 La Poste assignment joined to the matching official arrondissement contour; no geometric modification',
    sourceDate: DATASET_DATE,
    licenseId: LICENSE_ID,
    digest: compositeDigest,
  };
  const validTime = { from: RELEASE_INSTANT, to: null };
  const knownTime = { from: RELEASE_INSTANT, to: null };
  const countryNode = {
    id: 'country-fr', kind: 'administrative_area', featureKind: 'country', geometryType: 'none',
    countryCode: 'FR', label: 'France', visibility: 'public',
  };
  const communeNodes = api.rows.map(row => ({
    id: `administrative-fr-${row.insee}`, kind: 'administrative_area', featureKind: 'administrative',
    geometryType: row.geometry.type.toLowerCase(), countryCode: 'FR', label: row.commune,
    visibility: 'public',
  }));
  const postalNodes = api.rows.map(row => ({
    id: `postal-fr-${row.postalCode}`, kind: 'postal_feature', featureKind: 'standard_area',
    geometryType: row.geometry.type.toLowerCase(), countryCode: 'FR', postalCode: row.postalCode,
    label: `${row.postalCode} ${row.commune} — derived administrative display surface`,
    visibility: 'public',
  }));
  const nodes = [countryNode, ...communeNodes, ...postalNodes];
  const assertions = api.rows.flatMap(row => [
    {
      id: `laposte-fr-20260808-${row.postalCode}-assigned-${row.insee}`,
      fromNodeId: `administrative-fr-${row.insee}`, toNodeId: `postal-fr-${row.postalCode}`,
      relation: 'postal_assigned', validTime, knownTime, source: officialAssignmentSource,
      method: 'official_crosswalk',
      quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT },
    },
    {
      id: `geo-api-fr-20260830-${row.insee}-part-of-fr`,
      fromNodeId: `administrative-fr-${row.insee}`, toNodeId: countryNode.id,
      relation: 'part_of', validTime, knownTime, source: officialAdministrativeSource,
      method: 'source_relation',
      quality: { status: 'authoritative', confidence: 1, validatedAt: RELEASE_INSTANT },
    },
  ]);
  const features = api.rows.map(row => ({
    id: `fr-paris-derived-${row.postalCode}`, nodeId: `postal-fr-${row.postalCode}`,
    role: 'postal_area', publicationClass: 'public_context', geometry: row.geometry,
    source: derivedDisplaySource, validTime, knownTime,
    quality: { status: 'derived', confidence: 0.99, validatedAt: RELEASE_INSTANT },
  }));

  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, {
    schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'FR', releaseId: RELEASE_ID, features,
  });
  const graphRelease = {
    schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-fr-laposte-paris',
    repositoryUrl: 'https://github.com/veygrit-sys/Address-Grid-ID', countryCode: 'FR',
    releaseId: RELEASE_ID, policyVersion: 'fr-paris-arrondissement-derived-display-v1',
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
    countryCode: 'FR', releaseId: RELEASE_ID, policyVersion: graphRelease.policyVersion,
    sequence: 1, previousDescriptorDigest: null, graphManifestDigest: graphRelease.manifestDigest,
    createdAt: RELEASE_INSTANT, maturity: 'M2_experimental', synthetic: false,
    promotionEligible: true, containsResidentialAddressPoints: false,
    artifacts: [
      { role: 'graph', path: basename(graphPath), mediaType: 'application/vnd.agid.postal-context-graph+json',
        schemaVersion: 'postal-context-graph/v0.1', byteLength: graphArtifact.byteLength,
        digest: graphArtifact.digest, recordCounts: { nodes: nodes.length, assertions: assertions.length } },
      { role: 'geometry', path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json',
        schemaVersion: 'postal-context-geometry/v0.1', byteLength: geometryArtifact.byteLength,
        digest: geometryArtifact.digest, recordCounts: { features: features.length, positions: api.positions } },
    ],
  });
  const report = {
    schemaVersion: 'postal-context-fr-m2-build/v1', countryCode: 'FR', generatedAt: RELEASE_INSTANT,
    releaseId: RELEASE_ID,
    input: {
      csv: { digest: CSV_DIGEST, bytes: readFileSync(csvPath).length, rows: csv.rows.length,
        distinctPostalCodes: csv.distinctPostcodes, distinctCommuneCodes: csv.distinctCommunes },
      api: { digest: api.aggregateDigest, responses: api.rows.length,
        responseDigests: api.rows.map(row => ({ postalCode: row.postalCode, sourceRecordId: row.sourceRecordId,
          digest: row.responseDigest, byteLength: row.responseBytes })) },
      metadataDigest: DATASET_METADATA_DIGEST,
      compositeDigest,
    },
    scope: {
      publishedPostalCodes: EXPECTED_CODES, publishedGeometries: features.length,
      scopeStatement: '75001-75020 only; each official La Poste postcode has exactly one matching Paris arrondissement/INSEE row in the pinned snapshot',
      nationalCoverageClaimed: false, officialPostalBoundaryClaimed: false,
    },
    geometry: {
      polygonFeatures: features.filter(feature => feature.geometry.type === 'Polygon').length,
      multiPolygonFeatures: features.filter(feature => feature.geometry.type === 'MultiPolygon').length,
      positions: api.positions, rings: api.rings,
      allBooleanValid: true, allRingsClosed: true, allCoordinatesWithinParisBounds: true,
      totalSquareMeters: api.rows.reduce((sum, row) => sum + row.geometryChecks.squareMeters, 0),
      transformations: ['decode-La-Poste-JSON-geometry-string', 'exact-postcode-to-INSEE-equality-join', 'sort-by-postal-code'],
      geometricModification: false, provenance: 'derived', confidence: 0.99,
    },
    policy: {
      officialAssignment: true, administrativeGeometry: true, officialLaPostePolygon: false,
      deliveryOrAddressClaimed: false, addressOrBuildingRowsPublished: 0,
      recipientCustomerOrLandRightsRowsPublished: 0, inventedAreaRowsPublished: 0,
    },
    artifacts: { graph: graphArtifact, geometry: geometryArtifact, descriptor: descriptorArtifact },
  };
  if (reportPath) writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

export { build, parseApiRows, parseOfficialCsv };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const csvPath = resolve(process.argv[2] ?? '');
  const apiDirectory = resolve(process.argv[3] ?? '');
  const outputDirectory = resolve(process.argv[4] ?? join(ROOT, 'data/postal_country_packs/fr/postal-context/m2'));
  const reportPath = process.argv[5] ? resolve(process.argv[5]) : undefined;
  if (!process.argv[2] || !process.argv[3]) fail('usage-csv-and-api-directory-required');
  console.log(JSON.stringify(build({ csvPath, apiDirectory, outputDirectory, reportPath }), null, 2));
}

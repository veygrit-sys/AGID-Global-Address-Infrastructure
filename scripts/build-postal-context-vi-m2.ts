import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { encodeAGID } from '../src/lib/agid.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RELEASE_ID = 'vi-census-zcta-validation-20260903';
const RELEASE_INSTANT = '2026-09-02T18:08:57.070Z';
const DATASET_DATE = '2020-01-01';
const LICENSE_ID = 'us-census-public-domain-release-attribution';
const EXPECTED_CODES = ['00802', '00820', '00830', '00840', '00850', '00851'];
const EXPECTED_BOUNDS = [-65.05690199974936, 17.673931000010842, -64.56519299973563, 18.401857000205986];
const EXPECTED = {
  'census-vi-zctas.geojson': '04a2191b67e5e8a4257be868d5050c4e4ea0f52848cde5840085cd4354fbbeeb',
  'census-zcta-guidance.html': 'c29151c84aa2e7c9957e79fdb067285763c90a808e55554db7faa071bad9fcf5',
  'census-zcta-layer.json': '66a028f243db2b442220ae0de6414cbbd7e1299d9c4f6279a4c08510d987bb36',
  'census-zcta-service.json': '8f2c3cf7d6e95e4025363c44ec46a486a3094e48c6c5d44c7ec670ff49cfcec0',
  'usps-city-state.html': '186b8456c67705b260c4e2db5ed8aaa9fce75dcef9537e9761d4658ac74939e5',
  'usps-ais-license.html': 'cccd26cd306018465243dcf2206e8c87aa07dd48d90955fbe4d4631b3098765d',
  'LIC001_03.pdf': '16c3a28f2c16062551cc33917a7d858a9bfa6b4535a882751064c273d0ddba68',
  'usps-pub28-vi.html': '7b3cfeecc7f43a66ff1ab29795eef553128ce9c02257e25dcd1daf940e3d3032',
  'usps-pub28.pdf': '9a46a66b43c2f26f0f732038f5d20ef70400fdf755b91a87a51164a5dfbb4db6',
};
const SOURCE_URLS = {
  'census-vi-zctas.geojson': "https://tigerweb.geo.census.gov/arcgis/rest/services/Census2020/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/2/query?where=ZCTA5%20LIKE%20%27008%25%27&outFields=*&returnGeometry=true&outSR=4326&f=geojson",
  'census-zcta-guidance.html': 'https://www.census.gov/programs-surveys/geography/guidance/geo-areas/zctas.html',
  'census-zcta-layer.json': 'https://tigerweb.geo.census.gov/arcgis/rest/services/Census2020/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/2?f=pjson',
  'census-zcta-service.json': 'https://tigerweb.geo.census.gov/arcgis/rest/services/Census2020/PUMA_TAD_TAZ_UGA_ZCTA/MapServer?f=pjson',
  'usps-city-state.html': 'https://postalpro.usps.com/address-quality/city-state-product',
  'usps-ais-license.html': 'https://postalpro.usps.com/AISCopyright_License',
  'LIC001_03.pdf': 'https://postalpro.usps.com/mnt/glusterfs/2026-07/LIC001_03.pdf',
  'usps-pub28-vi.html': 'https://pe.usps.com/text/pub28/28apj_002.htm',
  'usps-pub28.pdf': 'https://pe.usps.com/cpim/ftp/pubs/Pub28/pub28.pdf',
};

function fail(message) { throw new Error(`vi-m2-${message}`); }
function sha256(bytes) { return `sha256:${createHash('sha256').update(bytes).digest('hex')}`; }
function canonicalJson(value) {
  if (value === null) return 'null';
  if (['string', 'boolean', 'number'].includes(typeof value)) {
    if (typeof value === 'number' && !Number.isFinite(value)) fail('canonical-number');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (!value || typeof value !== 'object') fail('canonical-value');
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
}
function same(left, right) { return canonicalJson(left) === canonicalJson(right); }
function artifactPath(path) { return relative(ROOT, path).replaceAll('\\', '/'); }
function writeJson(path, value, pretty = false) {
  mkdirSync(dirname(path), { recursive: true });
  const bytes = Buffer.from((pretty ? JSON.stringify(value, null, 2) : canonicalJson(value)) + '\n', 'utf8');
  writeFileSync(path, bytes);
  return { path: artifactPath(path), byteLength: bytes.length, digest: sha256(bytes) };
}
function readExact(directory, name) {
  const bytes = readFileSync(join(directory, name));
  const digest = sha256(bytes);
  if (digest !== `sha256:${EXPECTED[name]}`) fail(`source-digest-${name}-${digest}`);
  return bytes;
}
function ringArea(ring) {
  let sum = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    sum += ring[index][0] * ring[index + 1][1] - ring[index + 1][0] * ring[index][1];
  }
  return sum / 2;
}
function polygons(geometry) {
  if (geometry?.type === 'Polygon') return [geometry.coordinates];
  if (geometry?.type === 'MultiPolygon') return geometry.coordinates;
  fail(`geometry-type-${geometry?.type ?? 'missing'}`);
}
function pointInRing(point, ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [x, y] = ring[index]; const [px, py] = ring[previous];
    if ((y > point[1]) !== (py > point[1]) && point[0] < ((px - x) * (point[1] - y)) / (py - y) + x) inside = !inside;
  }
  return inside;
}
function pointInGeometry(point, geometry) {
  return polygons(geometry).some(polygon => pointInRing(point, polygon[0]) && !polygon.slice(1).some(ring => pointInRing(point, ring)));
}
function inspectGeometry(features) {
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  const typeCounts = {}; let parts = 0; let rings = 0; let holes = 0; let positions = 0;
  for (const feature of features) {
    typeCounts[feature.geometry.type] = (typeCounts[feature.geometry.type] ?? 0) + 1;
    const featurePolygons = polygons(feature.geometry); parts += featurePolygons.length;
    for (const polygon of featurePolygons) {
      holes += Math.max(0, polygon.length - 1);
      for (const ring of polygon) {
        rings += 1; positions += ring.length;
        if (ring.length < 4 || !same(ring[0], ring.at(-1)) || Math.abs(ringArea(ring)) < 1e-14) fail(`invalid-ring-${feature.properties.ZCTA5}`);
        for (const position of ring) {
          if (!Array.isArray(position) || position.length < 2 || !position.slice(0, 2).every(Number.isFinite)) fail('invalid-position');
          const [longitude, latitude] = position;
          if (longitude < -66 || longitude > -64 || latitude < 17 || latitude > 19) fail(`out-of-scope-${feature.properties.ZCTA5}`);
          bounds[0] = Math.min(bounds[0], longitude); bounds[1] = Math.min(bounds[1], latitude);
          bounds[2] = Math.max(bounds[2], longitude); bounds[3] = Math.max(bounds[3], latitude);
        }
      }
    }
  }
  if (features.length !== 6 || parts !== 8 || rings !== 8 || holes !== 0 || positions !== 11767 || !same(bounds, EXPECTED_BOUNDS)
    || !same(typeCounts, { MultiPolygon: 2, Polygon: 4 })) fail('geometry-denominator');
  return { features: 6, typeCounts, parts, rings, holes, positions, bounds, closedRings: rings, zeroAreaRings: 0, structuralValidity: true };
}

function build({ sourceDirectory, outputDirectory, reportPath }) {
  const receipts = Object.fromEntries(Object.keys(EXPECTED).map(name => [name, readExact(sourceDirectory, name)]));
  const service = JSON.parse(receipts['census-zcta-service.json'].toString('utf8'));
  const layer = JSON.parse(receipts['census-zcta-layer.json'].toString('utf8'));
  const collection = JSON.parse(receipts['census-vi-zctas.geojson'].toString('utf8'));
  if (!service.serviceDescription?.includes('ZIP Code Tabulation Areas')) fail('service-contract');
  if (layer.id !== 2 || layer.name !== 'ZIP Code Tabulation Areas' || layer.description !== 'ZIP Code Tabulation Areas; January 1, 2020 vintage'
    || layer.geometryType !== 'esriGeometryPolygon' || layer.copyrightText !== 'Source: U.S. Census Bureau') fail('layer-contract');
  if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) fail('feature-collection');
  const rows = collection.features.sort((left, right) => left.properties.ZCTA5.localeCompare(right.properties.ZCTA5));
  if (!same(rows.map(row => row.properties.ZCTA5), EXPECTED_CODES) || new Set(rows.map(row => row.properties.OBJECTID)).size !== 6) fail('code-denominator');
  const guidance = receipts['census-zcta-guidance.html'].toString('utf8');
  if (!/not all valid ZIP Codes/iu.test(guidance) || !/generalized areal representations/iu.test(guidance)) fail('zcta-semantics');
  const pub28 = receipts['usps-pub28-vi.html'].toString('utf8');
  if (!/correct abbreviation for the Virgin Islands is VI/iu.test(pub28) || !/KINGSHILL/iu.test(pub28)) fail('pub28-vi-contract');
  const cityState = receipts['usps-city-state.html'].toString('utf8');
  if (!/comprehensive list of ZIP Codes/iu.test(cityState) || !/encrypted and cannot be exported/iu.test(cityState)) fail('city-state-contract');
  const geometryCheck = inspectGeometry(rows);
  const validTime = { from: `${DATASET_DATE}T00:00:00.000Z`, to: null };
  const knownTime = { from: RELEASE_INSTANT, to: null };
  const censusSource = { sourceId: 'us-census-tigerweb-zcta-2020-vi-fixed', sourceType: 'derived', assignmentAuthority: 'derived_spatial_assignment',
    geometryAuthority: 'official_mapping_geometry', sourceVersion: 'TIGERweb layer 2; January 1, 2020 vintage; exact ZCTA5 LIKE 008% receipt',
    sourceDate: DATASET_DATE, licenseId: LICENSE_ID, digest: `sha256:${EXPECTED['census-vi-zctas.geojson']}` };
  const crosswalkSource = { sourceId: 'agid-vi-zcta-internal-point-crosswalk-v1', sourceType: 'derived', assignmentAuthority: 'derived_spatial_assignment',
    geometryAuthority: 'none', sourceVersion: 'AGID encoder applied to Census INTPT; crosswalk withheld when jurisdiction prefix differs',
    sourceDate: DATASET_DATE, licenseId: LICENSE_ID, digest: censusSource.digest };
  const nodes: Array<Record<string, unknown>> = [{ id: 'country-vi', kind: 'administrative_area', featureKind: 'country', geometryType: 'none', countryCode: 'VI', label: 'U.S. Virgin Islands', visibility: 'public' }];
  const assertions = []; const geometryFeatures = []; const ids = [];
  for (const row of rows) {
    const p = row.properties; const code = p.ZCTA5; const postalNodeId = `postal-vi-census-zcta-${code}`; const geometryId = `census-vi-zcta-2020-${code}`;
    const point = [Number(p.INTPTLON), Number(p.INTPTLAT)];
    if (!point.every(Number.isFinite) || !pointInGeometry(point, row.geometry)) fail(`internal-point-${code}`);
    const encoded = encodeAGID(point[1], point[0]).id; const prefixMatches = encoded.startsWith('VI');
    nodes.push({ id: postalNodeId, kind: 'postal_feature', featureKind: 'standard_area', geometryType: row.geometry.type === 'Polygon' ? 'polygon' : 'multipolygon',
      countryCode: 'VI', postalCode: code, label: `2020 Census ZCTA ${code} · GEOID ${p.GEOID} · OBJECTID ${p.OBJECTID} · land ${(Number(p.AREALAND) / 1e6).toFixed(2)} km² · water ${(Number(p.AREAWATER) / 1e6).toFixed(2)} km²`, visibility: 'public' });
    assertions.push({ id: `${geometryId}-part-of-vi`, fromNodeId: postalNodeId, toNodeId: 'country-vi', relation: 'admin_within', validTime, knownTime,
      source: censusSource, method: 'geometry_contains', quality: { status: 'verified', confidence: 0.9, validatedAt: RELEASE_INSTANT }, purposes: ['display', 'validation'] });
    let agidNodeId = null; let agidAssertionId = null;
    if (prefixMatches) {
      agidNodeId = `agid-vi-census-zcta-${code}-internal-point`; agidAssertionId = `${geometryId}-agid-internal-point`;
      nodes.push({ id: agidNodeId, kind: 'agid_cell', featureKind: 'unknown', geometryType: 'none', countryCode: 'VI',
        label: `AGID cell for Census ZCTA ${code} internal point (derived reference; not area coverage)`, agidCellId: encoded, visibility: 'public' });
      assertions.push({ id: agidAssertionId, fromNodeId: postalNodeId, toNodeId: agidNodeId, relation: 'covered_by_agid', validTime, knownTime,
        source: crosswalkSource, method: 'derived', quality: { status: 'derived', confidence: 0.7, validatedAt: RELEASE_INSTANT }, purposes: ['display', 'validation'] });
    }
    geometryFeatures.push({ id: geometryId, nodeId: postalNodeId, role: 'postal_area', publicationClass: 'public_context', geometry: row.geometry,
      source: censusSource, validTime, knownTime, quality: { status: 'derived', confidence: 0.9, validatedAt: RELEASE_INSTANT } });
    ids.push({ postalCode: code, censusOid: p.OID, censusGeoid: p.GEOID, censusObjectId: p.OBJECTID, postalContextId: postalNodeId, geometryId,
      countryAssertionId: `${geometryId}-part-of-vi`, agidAssertionId, agidNodeId, agidCellId: prefixMatches ? encoded : null,
      computedAgidCellId: encoded, agidJurisdictionPrefixMatchesSource: prefixMatches, internalPoint: point });
  }
  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryArtifact = writeJson(geometryPath, { schemaVersion: 'postal-context-geometry/v0.1', countryCode: 'VI', releaseId: RELEASE_ID, features: geometryFeatures });
  const graphRelease = { schemaVersion: 'postal-context-graph/v0.1', repositoryId: 'agid-postal-vi-census-zcta-validation',
    repositoryUrl: 'https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure', countryCode: 'VI', releaseId: RELEASE_ID,
    policyVersion: 'us-virgin-islands-census-zcta-derived-validation-v1', releasedAt: RELEASE_INSTANT, validTime,
    manifestDigest: `sha256:${'0'.repeat(64)}`, artifacts: [{ path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json',
      digest: geometryArtifact.digest, byteLength: geometryArtifact.byteLength, recordCount: rows.length, licenseRefs: [LICENSE_ID] }] };
  const { manifestDigest: _placeholder, ...manifestPayload } = graphRelease;
  graphRelease.manifestDigest = sha256(Buffer.from(canonicalJson(manifestPayload), 'utf8'));
  const graphPath = join(outputDirectory, 'graph.json');
  const graphArtifact = writeJson(graphPath, { schemaVersion: 'postal-context-graph/v0.1', release: graphRelease, nodes, assertions });
  const descriptorPath = join(outputDirectory, 'descriptor.json');
  const descriptorArtifact = writeJson(descriptorPath, { schemaVersion: 'postal-context-pack-descriptor/v0.1', repositoryId: graphRelease.repositoryId,
    countryCode: 'VI', releaseId: RELEASE_ID, policyVersion: graphRelease.policyVersion, sequence: 1, previousDescriptorDigest: null,
    graphManifestDigest: graphRelease.manifestDigest, createdAt: RELEASE_INSTANT, maturity: 'M2_experimental', synthetic: false, promotionEligible: false,
    containsResidentialAddressPoints: false, artifacts: [
      { role: 'graph', path: basename(graphPath), mediaType: 'application/vnd.agid.postal-context-graph+json', schemaVersion: 'postal-context-graph/v0.1',
        byteLength: graphArtifact.byteLength, digest: graphArtifact.digest, recordCounts: { nodes: nodes.length, assertions: assertions.length } },
      { role: 'geometry', path: basename(geometryPath), mediaType: 'application/vnd.agid.postal-context-geometry+json', schemaVersion: 'postal-context-geometry/v0.1',
        byteLength: geometryArtifact.byteLength, digest: geometryArtifact.digest, recordCounts: { features: rows.length, positions: geometryCheck.positions } },
    ] });
  const report = { schemaVersion: 'postal-context-vi-zcta-validation-build/v1', countryCode: 'VI', generatedAt: RELEASE_INSTANT, releaseId: RELEASE_ID,
    result: 'blocked-complete-current-usps-vi-assignment-denominator-unavailable-six-real-2020-zcta-validation-surfaces-published',
    input: { exactReceipts: Object.entries(receipts).map(([name, bytes]) => ({ name, sourceUrl: SOURCE_URLS[name], retrievedAt: RELEASE_INSTANT,
      bytes: bytes.length, digest: sha256(bytes) })), censusLayer: { id: layer.id, name: layer.name, description: layer.description, copyrightText: layer.copyrightText } },
    scope: { publishedValidationSurfaces: rows.length, publishedPostalCodes: EXPECTED_CODES, completeForExact2020Census008PrefixQuery: true,
      completeCurrentUspsViAssignmentRecords: 0, m2QualifiedRecords: 0, currentUspsAssignmentCompletenessClaimed: false, officialPostalBoundaryClaimed: false,
      scopeStatement: 'Six coordinate-preserving 2020 Census ZCTAs validate VI real-data geometry and ID linkage; they are not current complete USPS assignments or delivery boundaries.' },
    geometry: { ...geometryCheck, transformations: ['verify-exact-source-digests', 'sort-by-ZCTA5', 'coordinate-preserving-copy', 'canonical-JSON-serialization'],
      geometricModification: false, sourceGeometryClass: 'official-derived Census statistical', outputProvenance: 'derived', confidence: 0.9 },
    idLinkage: { records: ids.length, fields: ['postalCode', 'censusOid', 'censusGeoid', 'censusObjectId', 'postalContextId', 'geometryId', 'countryAssertionId',
      'agidAssertionId', 'agidNodeId', 'agidCellId', 'computedAgidCellId', 'agidJurisdictionPrefixMatchesSource', 'internalPoint'], recordsDetail: ids,
      agidCrosswalksPublished: ids.filter(item => item.agidCellId).length, agidCrosswalksWithheld: ids.filter(item => !item.agidCellId).length,
      withheldReason: '00830 computed to a VG-prefixed AGID cell; its crosswalk is withheld instead of changing VI postal identity or merging territories.' },
    policy: { promotionEligible: false, reason: 'USPS current complete VI five-digit and ZIP+4 assignment, object-type, validity, correction, exception and non-area denominator is licensed/encrypted and unavailable for open AGID serving; Census states not every valid ZIP has a ZCTA.',
      censusZctaRowsPublished: rows.length, uspsLicensedRowsPublished: 0, officialPostalPolygonsClaimed: 0, inventedAreaRowsPublished: 0,
      addressBuildingParcelRecipientCustomerPersonOwnerOccupantOrLandRightsRowsPublished: 0, viIdentityPreserved: true },
    artifacts: { descriptor: descriptorArtifact, graph: graphArtifact, geometry: geometryArtifact } };
  if (reportPath) writeJson(reportPath, report, true);
  return report;
}

export { build, inspectGeometry };
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) fail('usage-source-directory-required');
  const outputDirectory = resolve(process.argv[3] ?? join(ROOT, 'data/postal_country_packs/vi/postal-context/m2'));
  const reportPath = process.argv[4] ? resolve(process.argv[4]) : undefined;
  console.log(JSON.stringify(build({ sourceDirectory: resolve(process.argv[2]), outputDirectory, reportPath }), null, 2));
}

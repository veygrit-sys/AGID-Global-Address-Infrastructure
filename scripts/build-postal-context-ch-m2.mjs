import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import proj4 from 'proj4';
import { feature as turfFeature } from '@turf/helpers';
import kinks from '@turf/kinks';
import unkinkPolygon from '@turf/unkink-polygon';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIGEST = 'sha256:a58e105be27c1b4f4797ccbb5765861711ada593163059969c49a33489e0a60a';
const RELEASE_ID = 'ch-swisstopo-plzo-2026-08-11';
const RELEASE_INSTANT = '2026-08-11T00:00:00.000Z';
const KNOWN_INSTANT = '2026-08-29T12:17:58.307Z';
const LICENSE_ID = 'swisstopo-ogd-conditions';
const SIMPLIFY_TOLERANCE_METERS = 5;
const MAX_POSITIONS_PER_POSTCODE = 20_000;
const REVIEWED_KINK_REPAIR_POSTCODES = new Set(['6072', '6073', '6976']);

proj4.defs('EPSG:2056', '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs');

function fail(message) {
  throw new Error(`ch-m2-${message}`);
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

function parseDbf(path) {
  const bytes = readFileSync(path);
  const recordCount = bytes.readUInt32LE(4);
  const headerLength = bytes.readUInt16LE(8);
  const recordLength = bytes.readUInt16LE(10);
  const fields = [];
  for (let offset = 32; bytes[offset] !== 0x0d; offset += 32) {
    fields.push({
      name: bytes.subarray(offset, offset + 11).toString('ascii').replace(/\0.*$/u, ''),
      length: bytes[offset + 16],
    });
  }
  const rows = [];
  for (let index = 0; index < recordCount; index += 1) {
    let offset = headerLength + index * recordLength;
    if (bytes[offset] === 0x2a) fail(`deleted-dbf-record-${index}`);
    offset += 1;
    const row = {};
    for (const field of fields) {
      row[field.name] = bytes.subarray(offset, offset + field.length).toString('utf8').trim();
      offset += field.length;
    }
    rows.push(row);
  }
  return rows;
}

function parseSemicolonCsv(path) {
  const lines = readFileSync(path, 'utf8').replace(/^\uFEFF/u, '').trimEnd().split(/\r?\n/u);
  const headers = lines.shift().split(';');
  return lines.map((line, index) => {
    const values = line.split(';');
    if (values.length !== headers.length) fail(`csv-column-count-${index + 2}`);
    return Object.fromEntries(headers.map((header, column) => [header, values[column]]));
  });
}

function parseShapefile(path) {
  const bytes = readFileSync(path);
  if (bytes.readInt32BE(0) !== 9994 || bytes.readInt32LE(28) !== 1000 || bytes.readInt32LE(32) !== 5) {
    fail('unsupported-shapefile');
  }
  const shapes = [];
  let offset = 100;
  while (offset < bytes.length) {
    const contentBytes = bytes.readInt32BE(offset + 4) * 2;
    const content = offset + 8;
    if (bytes.readInt32LE(content) !== 5) fail(`unsupported-record-shape-${shapes.length}`);
    const partCount = bytes.readInt32LE(content + 36);
    const pointCount = bytes.readInt32LE(content + 40);
    const parts = [];
    const pointsOffset = content + 44 + partCount * 4;
    for (let part = 0; part < partCount; part += 1) {
      const first = bytes.readInt32LE(content + 44 + part * 4);
      const last = part + 1 < partCount
        ? bytes.readInt32LE(content + 44 + (part + 1) * 4)
        : pointCount;
      const ring = [];
      for (let point = first; point < last; point += 1) {
        ring.push([
          bytes.readDoubleLE(pointsOffset + point * 16),
          bytes.readDoubleLE(pointsOffset + point * 16 + 8),
        ]);
      }
      parts.push(ring);
    }
    shapes.push(parts);
    offset = content + contentBytes;
  }
  if (offset !== bytes.length) fail('shapefile-length');
  return shapes;
}

function signedArea(ring) {
  let area = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    area += ring[index][0] * ring[index + 1][1] - ring[index + 1][0] * ring[index][1];
  }
  return area / 2;
}

function distanceSquaredToSegment(point, start, end) {
  let x = start[0];
  let y = start[1];
  let dx = end[0] - x;
  let dy = end[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = end[0];
      y = end[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = point[0] - x;
  dy = point[1] - y;
  return dx * dx + dy * dy;
}

function simplifyOpen(points, tolerance) {
  if (points.length <= 3) return points;
  const squaredTolerance = tolerance * tolerance;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let bestDistance = squaredTolerance;
    let bestIndex = -1;
    for (let index = first + 1; index < last; index += 1) {
      const distance = distanceSquaredToSegment(points[index], points[first], points[last]);
      if (distance > bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }
    if (bestIndex >= 0) {
      keep[bestIndex] = 1;
      stack.push([first, bestIndex], [bestIndex, last]);
    }
  }
  const simplified = points.filter((_, index) => keep[index] === 1);
  return simplified.length >= 3 ? simplified : points;
}

function simplifyClosedRing(ring, tolerance) {
  if (ring.length < 4) fail('short-source-ring');
  const open = ring.slice(0, -1);
  let farthest = 1;
  let farthestDistance = -1;
  for (let index = 1; index < open.length; index += 1) {
    const dx = open[index][0] - open[0][0];
    const dy = open[index][1] - open[0][1];
    const distance = dx * dx + dy * dy;
    if (distance > farthestDistance) {
      farthestDistance = distance;
      farthest = index;
    }
  }
  const firstArc = simplifyOpen(open.slice(0, farthest + 1), tolerance);
  const secondArc = simplifyOpen([...open.slice(farthest), open[0]], tolerance);
  const simplified = [...firstArc.slice(0, -1), ...secondArc.slice(0, -1)];
  simplified.push(simplified[0]);
  return simplified;
}

function transformRing(ring) {
  const transformed = ring.map(([easting, northing]) => {
    const [longitude, latitude] = proj4('EPSG:2056', 'EPSG:4326', [easting, northing]);
    return [Number(longitude.toFixed(6)), Number(latitude.toFixed(6))];
  });
  const deduplicated = transformed.filter((position, index) => index === 0
    || position[0] !== transformed[index - 1][0]
    || position[1] !== transformed[index - 1][1]);
  if (deduplicated.length > 1
    && deduplicated[0][0] === deduplicated.at(-1)[0]
    && deduplicated[0][1] === deduplicated.at(-1)[1]) deduplicated.pop();
  if (deduplicated.length < 3) fail('quantized-ring-too-short');
  deduplicated.push(deduplicated[0]);
  return deduplicated;
}

function shapeToPolygons(parts) {
  const polygons = [];
  for (const sourceRing of parts) {
    const sourceArea = signedArea(sourceRing);
    const ring = transformRing(simplifyClosedRing(sourceRing, SIMPLIFY_TOLERANCE_METERS));
    if (sourceArea < 0 || polygons.length === 0) {
      if (signedArea(ring) < 0) ring.reverse();
      polygons.push([ring]);
    } else {
      if (signedArea(ring) > 0) ring.reverse();
      polygons.at(-1).push(ring);
    }
  }
  return polygons;
}

function haversineMeters(a, b) {
  const radians = value => value * Math.PI / 180;
  const dLat = radians(b[1] - a[1]);
  const dLon = radians(b[0] - a[0]);
  const lat1 = radians(a[1]);
  const lat2 = radians(b[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6_371_008.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function positionCount(polygons) {
  return polygons.reduce((total, polygon) => total + polygon.reduce((sum, ring) => sum + ring.length, 0), 0);
}

function repairReviewedKinks(postalCode, polygons) {
  const repaired = [];
  let intersections = 0;
  for (const coordinates of polygons) {
    const feature = turfFeature({ type: 'Polygon', coordinates });
    const found = kinks(feature).features.length;
    intersections += found;
    if (!found) {
      repaired.push(coordinates);
      continue;
    }
    if (!REVIEWED_KINK_REPAIR_POSTCODES.has(postalCode)) fail(`unreviewed-kink-${postalCode}`);
    repaired.push(...unkinkPolygon(feature).features.map(item => item.geometry.coordinates));
  }
  return { polygons: repaired, intersections };
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value)}\n`, 'utf8');
}

function writeJson(path, value) {
  const bytes = jsonBytes(value);
  writeFileSync(path, bytes);
  return { bytes, digest: sha256(bytes), byteLength: bytes.length };
}

function build({ sourceDirectory, outputDirectory, reportPath }) {
  const shpRoot = join(sourceDirectory, 'shp', 'AMTOVZ_SHP_LV95');
  const csv2056Path = join(sourceDirectory, 'csv', 'AMTOVZ_CSV_LV95', 'AMTOVZ_CSV_LV95.csv');
  const csv4326Path = join(sourceDirectory, 'csv4326', 'AMTOVZ_CSV_WGS84', 'AMTOVZ_CSV_WGS84.csv');
  const dbfRows = parseDbf(join(shpRoot, 'AMTOVZ_ZIP.dbf'));
  const shapes = parseShapefile(join(shpRoot, 'AMTOVZ_ZIP.shp'));
  const rows2056 = parseSemicolonCsv(csv2056Path);
  const rows4326 = parseSemicolonCsv(csv4326Path);
  if (dbfRows.length !== shapes.length || rows2056.length !== rows4326.length) fail('record-count-mismatch');

  const csvByKey = new Map();
  const wgs84IdentitySeen = new Set();
  const wgs84ByIdentity = new Map(rows4326.map(row => {
    const identity = [
      row.Ortschaftsname,
      row.PLZ4,
      row.Zusatzziffer,
      row.ZIP_ID,
      row.Gemeindename,
      row['BFS-Nr'],
      row['Adressenanteil'],
    ].join('\u001f');
    if (wgs84IdentitySeen.has(identity)) fail(`duplicate-wgs84-identity-${row.ZIP_ID}`);
    wgs84IdentitySeen.add(identity);
    return [identity, row];
  }));
  const countryByZipId = new Map();
  const labelsByZip4 = new Map();
  const validationDistances = [];
  for (let index = 0; index < rows2056.length; index += 1) {
    const lv95 = rows2056[index];
    const identity = [
      lv95.Ortschaftsname,
      lv95.PLZ4,
      lv95.Zusatzziffer,
      lv95.ZIP_ID,
      lv95.Gemeindename,
      lv95['BFS-Nr'],
      lv95['Adressenanteil'],
    ].join('\u001f');
    const wgs84 = wgs84ByIdentity.get(identity);
    if (!wgs84) fail(`missing-wgs84-identity-${lv95.ZIP_ID}-${index}`);
    const key = `${lv95.ZIP_ID}:${lv95['BFS-Nr']}:${lv95.E}:${lv95.N}`;
    if (csvByKey.has(key)) fail(`duplicate-csv-key-${key}`);
    csvByKey.set(key, lv95);
    const isSwiss = Boolean(lv95['Kantonskürzel']);
    const previous = countryByZipId.get(lv95.ZIP_ID);
    if (previous !== undefined && previous !== isSwiss) fail(`mixed-country-zip-id-${lv95.ZIP_ID}`);
    countryByZipId.set(lv95.ZIP_ID, isSwiss);
    if (isSwiss) {
      const labels = labelsByZip4.get(lv95.PLZ4) ?? new Set();
      labels.add(lv95.Ortschaftsname);
      labelsByZip4.set(lv95.PLZ4, labels);
    }
    const transformed = proj4('EPSG:2056', 'EPSG:4326', [Number(lv95.E), Number(lv95.N)]);
    validationDistances.push(haversineMeters(transformed, [Number(wgs84.E), Number(wgs84.N)]));
  }

  const byZip4 = new Map();
  let sourcePositions = 0;
  let simplifiedPositions = 0;
  let swissZip6Features = 0;
  let liechtensteinZip6Features = 0;
  let sourceRings = 0;
  for (let index = 0; index < dbfRows.length; index += 1) {
    const row = dbfRows[index];
    const zipId = row.ZIP_ID;
    const isSwiss = countryByZipId.get(zipId);
    if (isSwiss === undefined) fail(`dbf-zip-id-without-csv-${zipId}`);
    sourcePositions += shapes[index].reduce((sum, ring) => sum + ring.length, 0);
    sourceRings += shapes[index].length;
    if (!isSwiss) {
      liechtensteinZip6Features += 1;
      continue;
    }
    if (!/^\d{4}$/u.test(row.ZIP4) || !/^\d{2}$/u.test(row.ADDITIONAL)) fail(`postcode-format-${index}`);
    const polygons = shapeToPolygons(shapes[index]);
    simplifiedPositions += positionCount(polygons);
    const entry = byZip4.get(row.ZIP4) ?? { polygons: [], zipIds: [], npa6: [] };
    entry.polygons.push(...polygons);
    entry.zipIds.push(zipId);
    entry.npa6.push(`${row.ZIP4}${row.ADDITIONAL}`);
    byZip4.set(row.ZIP4, entry);
    swissZip6Features += 1;
  }

  const source = {
    sourceId: 'ch-swisstopo-plzo-2026-08-11-display-derived',
    sourceType: 'derived',
    assignmentAuthority: 'official_address_registry',
    geometryAuthority: 'derived_geometry',
    sourceVersion: 'STAC ortschaftenverzeichnis_plz @ 2026-08-11T00:00:00Z',
    sourceDate: '2026-08-11',
    licenseId: LICENSE_ID,
    digest: SOURCE_DIGEST,
  };
  const validTime = { from: RELEASE_INSTANT, to: null };
  const knownTime = { from: KNOWN_INSTANT, to: null };
  const nodes = [];
  const features = [];
  let maximumPositionsPerPostcode = 0;
  let repairedKinkIntersections = 0;
  const repairedPostcodes = [];
  for (const [postalCode, entry] of [...byZip4].sort(([a], [b]) => a.localeCompare(b))) {
    const repair = repairReviewedKinks(postalCode, entry.polygons);
    entry.polygons = repair.polygons;
    if (repair.intersections) {
      repairedKinkIntersections += repair.intersections;
      repairedPostcodes.push(postalCode);
    }
    const positions = positionCount(entry.polygons);
    maximumPositionsPerPostcode = Math.max(maximumPositionsPerPostcode, positions);
    if (positions > MAX_POSITIONS_PER_POSTCODE) fail(`postcode-position-limit-${postalCode}-${positions}`);
    const nodeId = `postal-ch-${postalCode}`;
    const geometry = entry.polygons.length === 1
      ? { type: 'Polygon', coordinates: entry.polygons[0] }
      : { type: 'MultiPolygon', coordinates: entry.polygons };
    nodes.push({
      id: nodeId,
      kind: 'postal_feature',
      featureKind: 'standard_area',
      geometryType: geometry.type.toLowerCase(),
      countryCode: 'CH',
      postalCode,
      label: [...(labelsByZip4.get(postalCode) ?? [])].sort().join(' / '),
      visibility: 'public',
    });
    features.push({
      id: `plzo-ch-${postalCode}`,
      nodeId,
      role: 'postal_area',
      publicationClass: 'public_context',
      geometry,
      source,
      validTime,
      knownTime,
      quality: {
        status: 'derived',
        confidence: 0.99,
        accuracyMeters: 7,
        validatedAt: KNOWN_INSTANT,
      },
    });
  }
  const publishedPositions = features.reduce(
    (total, feature) => total + positionCount(
      feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates,
    ),
    0,
  );
  if (simplifiedPositions >= sourcePositions || simplifiedPositions > 2_000_000) fail('simplification-budget');

  mkdirSync(outputDirectory, { recursive: true });
  const geometryPath = join(outputDirectory, 'geometry.json');
  const geometryValue = {
    schemaVersion: 'postal-context-geometry/v0.1',
    countryCode: 'CH',
    releaseId: RELEASE_ID,
    features,
  };
  const geometryArtifact = writeJson(geometryPath, geometryValue);
  const graphRelease = {
    schemaVersion: 'postal-context-graph/v0.1',
    repositoryId: 'agid-postal-ch-swisstopo-plzo',
    repositoryUrl: 'https://github.com/veygrit-sys/Address-Grid-ID',
    countryCode: 'CH',
    releaseId: RELEASE_ID,
    policyVersion: 'switzerland-plzo-postal-area-v1',
    releasedAt: RELEASE_INSTANT,
    validTime,
    manifestDigest: `sha256:${'0'.repeat(64)}`,
    artifacts: [{
      path: basename(geometryPath),
      mediaType: 'application/vnd.agid.postal-context-geometry+json',
      digest: geometryArtifact.digest,
      byteLength: geometryArtifact.byteLength,
      recordCount: features.length,
      licenseRefs: [LICENSE_ID],
    }],
  };
  const { manifestDigest: _placeholder, ...manifestPayload } = graphRelease;
  graphRelease.manifestDigest = sha256(Buffer.from(canonicalJson(manifestPayload), 'utf8'));
  const graphValue = {
    schemaVersion: 'postal-context-graph/v0.1',
    release: graphRelease,
    nodes,
    assertions: [],
  };
  const graphPath = join(outputDirectory, 'graph.json');
  const graphArtifact = writeJson(graphPath, graphValue);
  const descriptorValue = {
    schemaVersion: 'postal-context-pack-descriptor/v0.1',
    repositoryId: graphRelease.repositoryId,
    countryCode: 'CH',
    releaseId: RELEASE_ID,
    policyVersion: graphRelease.policyVersion,
    sequence: 1,
    previousDescriptorDigest: null,
    graphManifestDigest: graphRelease.manifestDigest,
    createdAt: KNOWN_INSTANT,
    maturity: 'M2_experimental',
    synthetic: false,
    promotionEligible: true,
    containsResidentialAddressPoints: false,
    artifacts: [
      {
        role: 'graph',
        path: basename(graphPath),
        mediaType: 'application/vnd.agid.postal-context-graph+json',
        schemaVersion: 'postal-context-graph/v0.1',
        byteLength: graphArtifact.byteLength,
        digest: graphArtifact.digest,
        recordCounts: { nodes: nodes.length, assertions: 0 },
      },
      {
        role: 'geometry',
        path: basename(geometryPath),
        mediaType: 'application/vnd.agid.postal-context-geometry+json',
        schemaVersion: 'postal-context-geometry/v0.1',
        byteLength: geometryArtifact.byteLength,
        digest: geometryArtifact.digest,
        recordCounts: { features: features.length, positions: publishedPositions },
      },
    ],
  };
  const descriptorPath = join(outputDirectory, 'descriptor.json');
  const descriptorArtifact = writeJson(descriptorPath, descriptorValue);
  const meanTransformDifferenceMeters = validationDistances.reduce((sum, value) => sum + value, 0) / validationDistances.length;
  const report = {
    sourceZipDigest: SOURCE_DIGEST,
    releaseId: RELEASE_ID,
    sourceDbfFeatures: dbfRows.length,
    sourceCsvRows: rows2056.length,
    swissZip6Features,
    liechtensteinZip6Features,
    swissNpa4Features: features.length,
    sourceRings,
    sourcePositions,
    preRepairSimplifiedPositions: simplifiedPositions,
    simplifiedPositions: publishedPositions,
    simplificationToleranceMeters: SIMPLIFY_TOLERANCE_METERS,
    coordinateDecimals: 6,
    maximumPositionsPerPostcode,
    repairedPostcodes,
    repairedKinkIntersections,
    transformValidationRows: validationDistances.length,
    meanTransformDifferenceMeters: Number(meanTransformDifferenceMeters.toFixed(6)),
    maximumTransformDifferenceMeters: Number(Math.max(...validationDistances).toFixed(6)),
    graph: { path: graphPath, digest: graphArtifact.digest, byteLength: graphArtifact.byteLength },
    geometry: { path: geometryPath, digest: geometryArtifact.digest, byteLength: geometryArtifact.byteLength },
    descriptor: { path: descriptorPath, digest: descriptorArtifact.digest, byteLength: descriptorArtifact.byteLength },
  };
  if (reportPath) writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

export { build, parseDbf, parseSemicolonCsv, parseShapefile, shapeToPolygons };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sourceDirectory = resolve(process.argv[2] ?? '');
  const outputDirectory = resolve(process.argv[3] ?? join(ROOT, 'data/postal_country_packs/ch/postal-context/m2'));
  const reportPath = process.argv[4] ? resolve(process.argv[4]) : undefined;
  if (!process.argv[2]) fail('usage-source-directory-required');
  console.log(JSON.stringify(build({ sourceDirectory, outputDirectory, reportPath }), null, 2));
}

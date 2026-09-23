import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const sourceIndex = args.indexOf('--source-dir');
assert.notEqual(sourceIndex, -1, 'pass --source-dir');
const sourceDir = args[sourceIndex + 1];

const expected = {
  'castelli-layer.json': ['f49b971f684ed5800a18b52e0ae9147199862815e876c14a0f367530fb20c215', 7540],
  'castelli.geojson': ['3baa9bd83e3ca1b60814f318063a5c340c4807986f3ca6bff5b2aa25f3a13ff4', 1094474],
  'gov-autonomous-entities.html': ['0314f41e2834345ffe2e878b597f86fe43e0debc212a39d55fe6ac85017a433b', 24325],
  'gov-catasto.html': ['0ddc6e62dcf258fc2a1cb61462eb3eeabbf87fe1c6702f1f23fa879268e3b862', 27870],
  'interni-castelli.html': ['66d073626ce53be6ceb57ffa4885ee671551bd0801f97060aa062d7819f98ee6', 14797],
  'poste-branches.html': ['ad0fc068db699ba43119e139f0760407f468cc70fc0656093fba4d2533d48dcd', 112395],
  'poste-home.html': ['8b002c2ec439fd49d6152d12b62e03f4b0a2d9901845e6ca53d2b4eeede8641e', 144913],
  'poste-offices.html': ['d00bedd7600fc61db3eabfa936fe2597aee4e4396e35f3df3aa3262daf782d50', 149119],
  'poste-privacy.html': ['5ca36cd4acdeb7d9e01403e36630604ab5eac9df95efaea37077c618b063296a', 113626],
  'territory-maps.html': ['f9ec1115e768b91719121977a0e380907723e2df87d39725715b57b6a17cc72b', 10175]
};

const bodies = Object.entries(expected).map(([file, [sha256, bytes]]) => {
  const body = readFileSync(join(sourceDir, file));
  assert.equal(body.length, bytes, `${file} byte length`);
  assert.equal(createHash('sha256').update(body).digest('hex'), sha256, `${file} sha256`);
  return { file, bytes, sha256 };
});

const offices = readFileSync(join(sourceDir, 'poste-offices.html'), 'utf8');
assert.match(offices, /article:modified_time[^>]+2026-03-26T12:29:48\+00:00/);
const officeCodes = [...new Set([...offices.matchAll(/\b(4789\d)\b/g)].map(match => match[1]))].sort();
assert.deepEqual(officeCodes, ['47890', '47891', '47892', '47893', '47894', '47895', '47896', '47897', '47898', '47899']);
for (const pair of [
  ['47890', 'San Marino'], ['47891', 'Dogana'], ['47892', 'Acquaviva'],
  ['47893', 'Borgo Maggiore'], ['47894', 'Chiesanuova'], ['47895', 'Domagnano'],
  ['47896', 'Faetano'], ['47897', 'Fiorentino'], ['47898', 'Montegiardino'],
  ['47899', 'Serravalle']
]) {
  assert.match(offices, new RegExp(`${pair[0]}[\\s\\S]{0,100}${pair[1]}|${pair[1]}[\\s\\S]{0,100}${pair[0]}`, 'i'));
}

const services = readFileSync(join(sourceDir, 'poste-branches.html'), 'utf8');
assert.match(services, /presenza e la nostra professionalit.+tutti i Castelli/i);
const privacy = readFileSync(join(sourceDir, 'poste-privacy.html'), 'utf8');
assert.match(privacy, /Privacy Policy/i);

const officialCastelli = readFileSync(join(sourceDir, 'interni-castelli.html'), 'utf8').replaceAll('&agrave;', 'à');
for (const name of ['Città di San Marino', 'Borgo Maggiore', 'Serravalle', 'Acquaviva', 'Chiesanuova', 'Domagnano', 'Faetano', 'Fiorentino', 'Montegiardino']) {
  assert.match(officialCastelli, new RegExp(name, 'i'));
}

const catasto = readFileSync(join(sourceDir, 'gov-catasto.html'), 'utf8');
assert.match(catasto, /Sistema Integrato GIS/i);
assert.match(catasto, /cartografia territoriale di base/i);

const layer = JSON.parse(readFileSync(join(sourceDir, 'castelli-layer.json'), 'utf8'));
assert.equal(layer.name, 'CASTELLI');
assert.equal(layer.geometryType, 'esriGeometryPolygon');
assert.equal(layer.copyrightText, '');
assert.equal(layer.sourceSpatialReference.wkt.includes('Cassini_RSM_GR'), true);
assert.equal(layer.capabilities, 'Map,Query,Data');

const geojson = JSON.parse(readFileSync(join(sourceDir, 'castelli.geojson'), 'utf8'));
assert.equal(geojson.type, 'FeatureCollection');
assert.equal(geojson.crs?.properties?.name, 'EPSG:4326');
assert.equal(geojson.features.length, 12);
const castelloCounts = {};
const geometryTypes = {};
let rings = 0;
let closedRings = 0;
let invalidCoordinates = 0;
let positions = 0;
let bbox = [Infinity, Infinity, -Infinity, -Infinity];
for (const feature of geojson.features) {
  const kind = feature.geometry?.type ?? 'null';
  geometryTypes[kind] = (geometryTypes[kind] ?? 0) + 1;
  const castello = feature.properties?.CAST_CASTELLO;
  castelloCounts[castello] = (castelloCounts[castello] ?? 0) + 1;
  assert.equal(kind, 'Polygon');
  for (const ring of feature.geometry.coordinates) {
    rings += 1;
    assert.ok(ring.length >= 4);
    const first = ring[0];
    const last = ring.at(-1);
    if (first[0] === last[0] && first[1] === last[1]) closedRings += 1;
    for (const position of ring) {
      positions += 1;
      const [x, y] = position;
      if (!Number.isFinite(x) || !Number.isFinite(y)) invalidCoordinates += 1;
      bbox = [Math.min(bbox[0], x), Math.min(bbox[1], y), Math.max(bbox[2], x), Math.max(bbox[3], y)];
    }
  }
}
assert.deepEqual(geometryTypes, { Polygon: 12 });
assert.equal(Object.keys(castelloCounts).length, 9);
assert.equal(castelloCounts.SERRAVALLE, 3);
assert.equal(castelloCounts['BORGO MAGGIORE'], 2);
assert.equal(rings, 12);
assert.equal(closedRings, 12);
assert.equal(invalidCoordinates, 0);
assert.deepEqual(bbox, [21.323725593156, 43.893070393566646, 21.43696086931257, 43.991501832913926]);
const bboxIntersectsExpectedSanMarino = bbox[0] <= 12.6 && bbox[2] >= 12.3;
assert.equal(bboxIntersectsExpectedSanMarino, false);

const result = {
  schemaVersion: 'postal-context-sm-source-inspection/v1',
  exactBodies: bodies,
  exactBodiesByteAndSha256Bound: bodies.length,
  exactOfficialBodiesBytes: bodies.reduce((sum, body) => sum + body.bytes, 0),
  operatorEvidence: {
    pageModifiedAt: '2026-03-26T12:29:48+00:00',
    observedOfficeCodes: officeCodes,
    observedOfficeCodeCount: officeCodes.length,
    completeAssignmentAndExceptionDenominatorEstablished: false,
    explicitAgidProcessingStorageDerivationRedistributionAndPublicServingPermissionEstablished: false
  },
  administrativeGeometry: {
    layer: 'CASTELLI',
    sourceCrs: 'Cassini_RSM_GR',
    returnedCrsDeclaration: 'EPSG:4326',
    geometryTypes,
    features: geojson.features.length,
    distinctCastelli: Object.keys(castelloCounts).length,
    castelloCounts,
    rings,
    closedRings,
    positions,
    invalidCoordinates,
    bbox,
    bboxIntersectsExpectedSanMarino,
    copyrightText: layer.copyrightText,
    capAreaAuthority: false
  },
  promotion: {
    fixedAuthorizedCapGeometryArtifacts: 0,
    assignmentsReconciledToAreaOrExplicitNonArea: 0,
    productionEligibleRecords: 0,
    approvedAgidRuntimeArtifacts: 0,
    administrativeOrOfficeProxiesPromoted: 0,
    pointBuffers: 0,
    convexOrConcaveHulls: 0,
    voronoiOrRasterCells: 0,
    syntheticFixturesPromoted: false
  }
};

console.log(JSON.stringify(result, null, 2));

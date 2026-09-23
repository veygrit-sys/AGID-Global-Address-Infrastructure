import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const sourceDirIndex = process.argv.indexOf('--source-dir');
assert.ok(sourceDirIndex >= 0 && process.argv[sourceDirIndex + 1], 'usage: --source-dir <directory>');
const sourceDir = process.argv[sourceDirIndex + 1];
const expected = new Map([
  ['posta-home.html', [222430, 'ae8f58050e552d2354b6a1945bb369ae05d159d09e36f3b2c8878a3822ad0253']],
  ['posta-postal-codes.html', [132695, '71518f0ba424d46c6c92238720b809af7ab3473721f46e13c2d69c7cd9a3c569']],
  ['posta-terms-page.html', [123372, '75654c4e8215b0561f04188385d7b8e55a410db7035067d89cb2a328d1e872e3']],
  ['geoportal-main.html', [87126, '38bbc50d4d7af4d442fe11923f4eafc1c83740df47d01f35470ad1b7c0965591']],
  ['geoportal-config.json', [162, '72866e7cf399cee4321c0aa01840cfc3da8d600488a5ffb16cec2c956b7e5195']],
  ['geoportal-layers.json', [75933, '7200ad74671b24404d2bc4dd451526f82cfefffe1e74fcdb129845a856ba0a59']],
  ['feature-prishtina.json', [65251, 'c7020c1ecabc832bd3d23c918049c48366a2eb50cbcc144121c41a8fdf52f32d']],
  ['probe-2.bin', [153775, '9db78c6ca52ac6bb92fdecdfa0def3736576122a95ee1ec2f8b16663763b909a']]
]);
const bodies = {};
for (const [name, [bytes, sha256]] of expected) {
  const body = readFileSync(path.join(sourceDir, name));
  assert.equal(body.length, bytes, `${name} byte mismatch`);
  assert.equal(createHash('sha256').update(body).digest('hex'), sha256, `${name} digest mismatch`);
  bodies[name] = body;
}
const postalHtml = bodies['posta-postal-codes.html'].toString('utf8');
const entriesMatch = postalHtml.match(/const entries = (\[[\s\S]*?\]);/);
assert.ok(entriesMatch, 'embedded postal-code entries missing');
const assignments = JSON.parse(entriesMatch[1]);
assert.equal(assignments.length, 133);
assert.equal(new Set(assignments.map(entry => entry.code)).size, 133);
assert.equal(new Set(assignments.map(entry => entry.region)).size, 7);
assert.ok(assignments.every(entry => /^\d{5}$/.test(entry.code)));
assert.ok(assignments.some(entry => entry.code === '10000' && /Prisht/i.test(entry.subregion)));
assert.match(bodies['posta-home.html'].toString('utf8'), /Copyright\s*2026/i);

const config = JSON.parse(bodies['geoportal-config.json']);
assert.equal(config.apiUrl, '/kgp');
const layers = JSON.parse(bodies['geoportal-layers.json']);
assert.equal(layers.length, 98);
const postalZone = layers.find(layer => layer.key === 'postalZone');
const postalOffice = layers.find(layer => layer.layerName === 'ZyratPostare');
assert.equal(postalZone.layerName, 'PostalZone');
assert.equal(postalOffice.parentId, postalZone.parentId);

const featureInfo = JSON.parse(bodies['feature-prishtina.json']);
assert.equal(featureInfo.features.length, 2);
assert.equal(featureInfo.crs.properties.name, 'urn:ogc:def:crs:EPSG::4326');
const positions = [];
for (const feature of featureInfo.features) {
  assert.equal(feature.geometry.type, 'MultiPolygon');
  assert.equal(feature.properties.PostalZoneCode, 10000);
  assert.equal(feature.properties.Level, 1);
  assert.equal(feature.properties.ParentPostalZoneId, null);
  for (const polygon of feature.geometry.coordinates) for (const ring of polygon) {
    assert.ok(ring.length >= 4);
    assert.deepEqual(ring[0], ring.at(-1));
    for (const position of ring) {
      assert.equal(position.length, 2);
      assert.ok(position.every(Number.isFinite));
      positions.push(position);
    }
  }
}
assert.equal(featureInfo.features[0].properties.PostalZoneCode, featureInfo.features[1].properties.PostalZoneCode);
assert.ok(positions.length > 2000);
assert.deepEqual([...bodies['probe-2.bin'].subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);

console.log(JSON.stringify({ result: 'pass', exactBodies: expected.size,
  exactBytes: [...expected.values()].reduce((sum, [bytes]) => sum + bytes, 0),
  operatorAssignments: assignments.length, uniqueCodes: 133, regions: 7, geoportalLayerRecords: layers.length,
  representativeFeatures: featureInfo.features.length, representativeCode: '10000', geometryType: 'MultiPolygon',
  representativeLevel: 1, finitePositions: positions.length, duplicateRepresentativeCodeFeatures: 2,
  fixedCompleteAuthorizedArtifacts: 0 }));

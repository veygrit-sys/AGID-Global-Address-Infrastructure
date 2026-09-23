import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  parseDbf,
  parseShp,
  sourceDigest,
  validateGermanyAuditReport,
} from './inspect-postal-context-de-sources.mjs';

const report = JSON.parse(readFileSync(new URL('../reports/postal-context-m2/de-source-review-2026-08-30.json', import.meta.url), 'utf8'));

function fixtureDbf() {
  const bytes = Buffer.alloc(72, 0);
  bytes[0] = 3;
  bytes.writeUInt32LE(1, 4);
  bytes.writeUInt16LE(65, 8);
  bytes.writeUInt16LE(6, 10);
  bytes.write('PLZ_5', 32, 'ascii');
  bytes[43] = 'C'.charCodeAt(0);
  bytes[48] = 5;
  bytes[64] = 0x0d;
  bytes[65] = 0x20;
  bytes.write('01234', 66, 'ascii');
  bytes[71] = 0x1a;
  return bytes;
}

function fixtureShp() {
  const contentBytes = 128;
  const bytes = Buffer.alloc(100 + 8 + contentBytes, 0);
  bytes.writeInt32BE(9994, 0);
  bytes.writeInt32BE(bytes.length / 2, 24);
  bytes.writeInt32LE(1000, 28);
  bytes.writeInt32LE(5, 32);
  [0, 0, 1, 1].forEach((value, index) => bytes.writeDoubleLE(value, 36 + index * 8));
  bytes.writeInt32BE(1, 100);
  bytes.writeInt32BE(contentBytes / 2, 104);
  bytes.writeInt32LE(5, 108);
  [0, 0, 1, 1].forEach((value, index) => bytes.writeDoubleLE(value, 112 + index * 8));
  bytes.writeInt32LE(1, 144);
  bytes.writeInt32LE(5, 148);
  bytes.writeInt32LE(0, 152);
  [[0,0],[1,0],[1,1],[0,1],[0,0]].forEach(([x,y], index) => {
    bytes.writeDoubleLE(x, 156 + index * 16);
    bytes.writeDoubleLE(y, 164 + index * 16);
  });
  return bytes;
}

test('German source digests are deterministic', () => {
  assert.equal(sourceDigest(Buffer.from('de')), 'sha256:959a45d44e6fcf58361ed004681556fe50129f2109e817dec098c00c9e5d2578');
});

test('DBF parser preserves five-digit leading-zero postcodes', () => {
  const parsed = parseDbf(fixtureDbf());
  assert.deepEqual(parsed.fields, [{ name: 'PLZ_5', type: 'C', length: 5 }]);
  assert.deepEqual(parsed.rows, [{ PLZ_5: '01234' }]);
});

test('Shapefile parser accepts a closed Polygon and rejects an open ring', () => {
  const bytes = fixtureShp();
  assert.deepEqual(parseShp(bytes).records.map(({ shapeType, parts, points }) => ({ shapeType, parts, points })), [{ shapeType: 5, parts: 1, points: 5 }]);
  const broken = Buffer.from(bytes);
  broken.writeDoubleLE(0.5, 156 + 4 * 16);
  assert.throws(() => parseShp(broken), /de-shp-ring-closure/);
});

test('fixed Germany report remains fail-closed without authorized national polygons', () => {
  assert.deepEqual(validateGermanyAuditReport(report), {
    references: 10,
    documentedAreas: 8169,
    testPolygons: 3,
    productionEligibleRecords: 0,
    countryM2Achieved: false,
  });
});

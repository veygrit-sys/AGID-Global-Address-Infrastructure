import assert from 'node:assert/strict';
import { cpus } from 'node:os';
import { performance } from 'node:perf_hooks';
import { decodeAGID, encodeAGID, encodeAGID16, toAGID16, toLegacyAGID } from '../src/lib/agid';
import { getAgidWasmCore } from '../src/lib/agidWasm';

// Run with: node --import tsx scripts/benchmark-agid16.ts
const pointCount = 4096;
const rounds = 8;
const passes = 3;
const seed = 0x25a61d;
let state = seed;
function random() {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state / 2 ** 32;
}

// Uniform on the sphere, shared by both writers and readers.
const points = Array.from({ length: pointCount }, () => ({
  lat: Math.asin(2 * random() - 1) * 180 / Math.PI,
  lon: 360 * random() - 180,
}));

const faceSet = new Set<number>();
const ids = points.map(({ lat, lon }) => {
  const legacy = encodeAGID(lat, lon);
  const checked = encodeAGID16(lat, lon);
  assert.equal(legacy.id.length, 12);
  assert.equal(checked.id.length, 16);
  assert.equal(checked.id.slice(0, 12), legacy.id);
  assert.equal(toAGID16(legacy.id), checked.id);
  assert.equal(toLegacyAGID(checked.id), legacy.id);
  assert.equal(checked.face, legacy.face);
  assert.equal(checked.qx, legacy.qx);
  assert.equal(checked.qy, legacy.qy);
  assert.deepEqual(checked.bounds, legacy.bounds);
  const decoded = decodeAGID(checked.id);
  assert.ok(decoded);
  assert.equal(decoded.face, legacy.face);
  assert.equal(decoded.qx, legacy.qx);
  assert.equal(decoded.qy, legacy.qy);
  assert.deepEqual(decoded, decodeAGID(legacy.id));
  faceSet.add(legacy.face);
  return { legacy: legacy.id, checked: checked.id };
});
assert.equal(faceSet.size, 6);

type Operation = (index: number) => number;
let checksum = 0;
function batch(operation: Operation) {
  const started = performance.now();
  for (let pass = 0; pass < passes; pass++) {
    for (let index = 0; index < pointCount; index++) {
      checksum = (Math.imul(checksum, 31) + operation(index)) >>> 0;
    }
  }
  return (performance.now() - started) * 1000 / (passes * pointCount);
}

function median(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return (sorted[mid] + sorted[Math.floor((sorted.length - 1) / 2)]) / 2;
}

function compare(legacy: Operation, checked: Operation) {
  const legacySamples: number[] = [];
  const checkedSamples: number[] = [];
  batch(legacy);
  batch(checked);
  for (let round = 0; round < rounds; round++) {
    // Both variants see whole batches in alternating order to balance warmup and load.
    if (round % 2 === 0) {
      legacySamples.push(batch(legacy));
      checkedSamples.push(batch(checked));
    } else {
      checkedSamples.push(batch(checked));
      legacySamples.push(batch(legacy));
    }
  }
  return {
    legacy12MedianUs: median(legacySamples),
    agid16MedianUs: median(checkedSamples),
    legacy12SamplesUs: legacySamples,
    agid16SamplesUs: checkedSamples,
  };
}

const encode = compare(
  i => encodeAGID(points[i].lat, points[i].lon).id.charCodeAt(11),
  i => encodeAGID16(points[i].lat, points[i].lon).id.charCodeAt(15),
);
const decode = compare(
  i => decodeAGID(ids[i].legacy)!.qx,
  i => decodeAGID(ids[i].checked)!.qx,
);
console.log(JSON.stringify({
  runtime: process.version,
  platform: process.platform,
  arch: process.arch,
  cpu: cpus()[0]?.model,
  wasm: getAgidWasmCore() !== null,
  seed,
  verifiedSameCell: pointCount,
  facesChecked: faceSet.size,
  rounds,
  operationsPerBatch: pointCount * passes,
  statistic: 'Median of warmed batch averages in microseconds per operation',
  encode,
  decode,
  checksum,
}, null, 2));

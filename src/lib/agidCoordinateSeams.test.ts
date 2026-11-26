import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { decodeAgidLight, encodeAgidLight } from '../embed/agidLight';
import { decodeAGID, encodeAGID, encodeAGID16, getAGIDCellKey, getRegionInfo, toAGID16 } from './agid';

const center = 2 ** 20;

function cell(value: { face: number; qx: number; qy: number }) {
  return [value.face, value.qx, value.qy];
}

test('identical antimeridian longitudes issue one ID through both writers and the embed', () => {
  assert.deepEqual(cell(encodeAGID(-16.8, 180)), [1, center, 657107]);
  assert.deepEqual(cell(encodeAGID(66, 180)), [4, 1607816, center]);
  for (const lat of [-66, -45, -16.8, 0, 45, 66]) {
    const original = encodeAGID(lat, -180);
    for (const alias of [-540, -180, 180, 540, 900]) {
      const encoded = encodeAGID(lat, alias);
      assert.equal(encoded.id, original.id);
      assert.equal(encodeAGID16(lat, alias).id, toAGID16(original.id));
      assert.deepEqual(getRegionInfo(lat, alias), getRegionInfo(lat, -180));
      assert.equal(encodeAgidLight(lat, alias, encoded.prefix).id, original.id);
    }
  }
  // Do not round nearby longitudes on opposite sides into the same location.
  assert.notEqual(encodeAGID(-16.8, -179.9999).hash, encodeAGID(-16.8, 179.9999).hash);
});

test('exact poles issue the center cell of the polar face at every valid longitude', () => {
  for (const [lat, face] of [[90, 4], [-90, 5]]) {
    const id = encodeAGID(lat, 0).id;
    for (const lon of [-900, -180, -72, 0, 102, 180, 540, Number.MAX_VALUE]) {
      const encoded = encodeAGID(lat, lon);
      assert.equal(encoded.id, id);
      assert.deepEqual(cell(encoded), [face, center, center]);
      assert.equal(encodeAgidLight(lat, lon, encoded.prefix).id, id);
    }
  }
  assert.notEqual(encodeAGID(89.999, 0).hash, encodeAGID(89.999, 100).hash);
});

test('old antimeridian and polar aliases decode to their originally issued cells', () => {
  for (const [legacy, expected] of [
    ['P304K5APK9JT', [1, center - 1, 657107]],
    ['P207CTN9CPD5', [1, center, 657107]],
    ['R00HZZZZZZZZ', [4, center - 1, center]],
    ['AQ0NZZZZZZZZ', [5, center - 1, center]],
  ] as const) {
    const checked = toAGID16(legacy);
    assert.ok(checked);
    assert.equal(getAGIDCellKey(checked), expected.join(':'));
    assert.deepEqual(decodeAGID(legacy), decodeAGID(checked));
    assert.deepEqual(cell(decodeAgidLight(legacy)!), expected);
  }
});

test('standalone shipped WASM directly quantizes seam, pole and ordinary inputs like TypeScript', async () => {
  const bytes = await readFile(new URL('../../public/wasm/agid_core.wasm', import.meta.url));
  const { instance } = await WebAssembly.instantiate(new Uint8Array(bytes), {});
  const wasm = instance.exports as unknown as Record<string, (lat: number, lon: number) => number>;
  for (const lat of [-90, -89.999, -66, -45, -16.8, 0, 45, 66, 89.999, 90]) {
    for (const lon of [-540, -180, -179.9999, -0.25, 0, 120, 179.9999, 180, 540]) {
      const result = [wasm.agid_get_quantized_face(lat, lon), wasm.agid_get_quantized_qx(lat, lon), wasm.agid_get_quantized_qy(lat, lon)];
      assert.deepEqual(result, cell(encodeAGID(lat, lon)), `WASM mismatch at ${lat},${lon}`);
    }
  }
});

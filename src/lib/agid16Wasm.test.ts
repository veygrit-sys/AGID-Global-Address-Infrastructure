import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { test } from 'node:test';

test('bundled WASM and TypeScript agree on cell IDs and non-degenerate face-edge bounds', async (t) => {
  // Let the normal browser loader start, then capture reference geometry before it resolves.
  const bytes = await readFile(new URL('../../public/wasm/agid_core.wasm', import.meta.url));
  let finishFetch!: (response: Response) => void;
  const response = new Promise<Response>((resolve) => { finishFetch = resolve; });
  Object.defineProperty(globalThis, 'window', { value: {}, configurable: true });
  t.after(() => { Reflect.deleteProperty(globalThis, 'window'); });
  t.mock.method(globalThis, 'fetch', (url: string) => {
    assert.equal(url, '/wasm/agid_core.wasm');
    return response;
  });

  const { encodeAGID16, decodeAGID } = await import('./agid');
  const { getAgidWasmCore } = await import('./agidWasm');
  assert.equal(getAgidWasmCore(), null);
  const points = [[0, 45], [0, 135], [45, 0], [45, -90], [45, 180], [-45, 90], [35, 139]];
  const expected = points.map(([lat, lon]) => encodeAGID16(lat, lon));
  finishFetch(new Response(new Uint8Array(bytes)));
  const deadline = Date.now() + 5000;
  while (!getAgidWasmCore() && Date.now() < deadline) await delay(5);
  assert.ok(getAgidWasmCore(), 'expected bundled WASM to load');

  for (const [index, [lat, lon]] of points.entries()) {
    const actual = encodeAGID16(lat, lon);
    assert.equal(actual.id, expected[index].id);
    const decoded = decodeAGID(actual.id);
    assert.ok(decoded);
    for (const key of ['minLon', 'maxLon', 'minLat', 'maxLat'] as const) {
      assert.ok(Math.abs(decoded.bounds[key] - expected[index].bounds[key]) < 1e-9,
        `WASM changed ${key} at ${lat},${lon}`);
    }
  }
});

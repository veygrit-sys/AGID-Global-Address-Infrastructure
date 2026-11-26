import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { localIslandPackMiddleware } from './local-island-pack-plugin';

test('loopback pack route accepts only opted-in manual points, and is inert without a pack', async () => {
  const configFile = fileURLToPath(import.meta.url);
  let count = 0;
  const lookup = async (_:string, lat:number, lon:number) => {
    count++;
    return { island: { countryCodes: ['JP'] }, deliveryRegion: null, observed: [lat, lon] };
  };
  const absent = localIslandPackMiddleware(undefined, lookup);
  const ready = localIslandPackMiddleware(configFile, lookup);
  let active = absent;
  const server = createServer((req, res) => active(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise<void>((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  try {
    const host = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const url = host + '/api/local/island-pack';
    const post = (body: object, origin = host) => fetch(url, {
      method: 'POST', headers: { 'content-type': 'application/json', origin }, body: JSON.stringify(body),
    });
    const pin = { kind: 'pin', lat: 25.7445, lon: 123.4745 };
    assert.deepEqual(await (await fetch(url)).json(), { enabled: false });
    assert.equal((await post(pin)).status, 404);
    active = ready;
    assert.deepEqual(await (await fetch(url)).json(), { enabled: true });
    for (const bad of [{ kind: 'cell', id: 'JP05AV8TJGHD' }, { ...pin, accuracyMeters: 5 },
      { ...pin, lat: 91 }, { ...pin, lon: '123' }]) assert.equal((await post(bad)).status, 400);
    assert.equal((await post(pin, 'https://example.org')).status, 404);
    assert.equal((await fetch(url, { headers: { 'x-forwarded-for': '198.51.100.8' } })).status, 404);
    assert.equal((await fetch(url + '?lat=25')).status, 404);
    assert.equal(count, 0);
    const result = await post(pin);
    assert.match(result.headers.get('cache-control') ?? '', /no-store/);
    assert.deepEqual(await result.json(), { island: { countryCodes: ['JP'] }, deliveryRegion: null,
      observed: [25.7445, 123.4745] });
    assert.equal(count, 1);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fetchNatureContext } from './NatureService';

test('nature context separates named rivers and waterfalls from generic water features', async (t) => {
  const originalFetch = globalThis.fetch;
  let queryBody = '';

  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    queryBody = String(init?.body || '');
    return {
      ok: true,
      status: 200,
      json: async () => ({
        elements: [
          {
            tags: {
              name: 'Shinano River',
              waterway: 'river',
            },
          },
          {
            tags: {
              name: 'Kegon Falls',
              natural: 'waterfall',
            },
          },
          {
            tags: {
              name: 'Lake Chuzenji',
              natural: 'water',
              water: 'lake',
            },
          },
        ],
      }),
    } as Response;
  }) as typeof fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const context = await fetchNatureContext(36.7378, 139.5037);

  assert.match(queryBody, /\["waterway"~"river\|stream\|canal\|brook\|creek\|wadi"\]/);
  assert.match(queryBody, /\["natural"="waterfall"\]/);
  assert.equal(context.rivers?.[0]?.name, 'Shinano River');
  assert.equal(context.rivers?.[0]?.type, 'river');
  assert.equal(context.waterfalls?.[0]?.name, 'Kegon Falls');
  assert.equal(context.waterfalls?.[0]?.type, 'waterfall');
  assert.equal(context.lakes?.[0]?.name, 'Lake Chuzenji');
});

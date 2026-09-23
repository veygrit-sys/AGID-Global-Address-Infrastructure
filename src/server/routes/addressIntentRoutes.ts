import type { Express } from 'express';

import {
  createInMemoryAddressIntentStore,
  listAddressIntentCapabilities,
  type AddressIntentInput,
} from '../../lib/addressIntent';
import { sendAgidResult } from '../agidResult';
import { objectBody } from '../requestParsing';

export function registerAddressIntentRoutes(app: Express) {
  const store = createInMemoryAddressIntentStore();

  app.get('/api/address-intents/capabilities', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: listAddressIntentCapabilities(),
      confidence: 1,
      sources: ['agid-address-intent'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/address-intents', (req, res) => {
    const intent = store.create(objectBody(req.body) as AddressIntentInput);
    const ok = intent.status !== 'rejected' && intent.status !== 'expired';
    sendAgidResult(req, res, {
      ok,
      data: intent,
      error: ok ? undefined : intent.errors[0] ?? 'Address intent was not accepted',
      confidence: ok ? 1 : 0.2,
      sources: ['agid-address-intent'],
      warnings: intent.warnings,
      cache: 'none',
    }, ok ? 200 : 409);
  });

  app.get('/api/address-intents/recent', (req, res) => {
    const limit = typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : undefined;
    sendAgidResult(req, res, {
      ok: true,
      data: {
        intents: store.listRecent(Number.isFinite(limit) ? limit : undefined),
        rawAddressStorage: false,
      },
      confidence: 1,
      sources: ['agid-address-intent'],
      warnings: [],
      cache: 'none',
    });
  });

  app.get('/api/address-intents/:intentId', (req, res) => {
    const intent = store.get(req.params.intentId);
    if (!intent) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Address intent not found',
        sources: ['agid-address-intent'],
        warnings: [],
        cache: 'none',
      }, 404);
    }

    return sendAgidResult(req, res, {
      ok: true,
      data: intent,
      confidence: 1,
      sources: ['agid-address-intent'],
      warnings: intent.warnings,
      cache: 'none',
    });
  });

  app.post('/api/address-intents/:intentId/update', (req, res) => {
    const intent = store.update(req.params.intentId, objectBody(req.body) as AddressIntentInput & { appendEvidence?: boolean });
    if (!intent) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Address intent not found',
        sources: ['agid-address-intent'],
        warnings: [],
        cache: 'none',
      }, 404);
    }

    const ok = intent.status !== 'rejected' && intent.status !== 'expired';
    return sendAgidResult(req, res, {
      ok,
      data: intent,
      error: ok ? undefined : intent.errors[0] ?? 'Address intent update was not accepted',
      confidence: ok ? 1 : 0.2,
      sources: ['agid-address-intent'],
      warnings: intent.warnings,
      cache: 'none',
    }, ok ? 200 : 409);
  });
}

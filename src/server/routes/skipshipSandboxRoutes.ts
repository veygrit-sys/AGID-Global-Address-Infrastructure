import type { Express, Request, Response } from 'express';

import { createShipmentIntentSandbox } from '../../lib/addressStripeFoundation';
import type { VeygritShipMetrics } from '../observability/veygritShipObservability';
import {
  handleSkipshipMockRequest,
  type TrackingWebhookRequest,
  verifyTrackingWebhookSignature,
} from '../../lib/deliveryGatewayCarrierApi';
import { runHexashipMvpV01Sandbox } from '../../lib/hexashipDeliveryGateway';
import { createMerchantConsoleOnboardingMock } from '../../lib/merchantConsoleEcPlugin';
import { buildSkipshipMerchantConsoleWebhookLedger } from '../../lib/skipshipMerchantConsoleWebhookLedger';
import { createInMemorySkipshipWebhookEventStore } from '../../lib/skipshipWebhookEventStore';
import { requireGuestCapability, type GuestAccessProvider } from './veygritShipGuestRoutes';

type SandboxRouteResult = {
  status: number;
  body: Record<string, unknown>;
};

type IdempotencyCacheEntry = SandboxRouteResult & {
  bodyFingerprint: string;
};

function hasTestBearer(req: Request) {
  return req.headers.authorization?.startsWith('Bearer pk_test_') === true;
}

function rejectMissingTestBearer(res: Response) {
  return res.status(401).json({
    ok: false,
    error: 'auth_required',
    message: 'Skipship sandbox routes require a test publishable key.',
  });
}

function echoIdempotencyHeader(req: Request, res: Response) {
  const idempotencyKey = req.headers['idempotency-key'];
  if (typeof idempotencyKey === 'string' && idempotencyKey.length > 0) {
    res.setHeader('skipship-idempotency-key', idempotencyKey);
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (!value || typeof value !== 'object') return JSON.stringify(value);
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(',')}}`;
}

function idempotencyCacheKey(req: Request) {
  const idempotencyKey = req.headers['idempotency-key'];
  if (typeof idempotencyKey !== 'string' || idempotencyKey.length === 0) return undefined;
  return `${req.method} ${req.path} ${idempotencyKey}`;
}

function sendIdempotent(
  req: Request,
  res: Response,
  cache: Map<string, IdempotencyCacheEntry>,
  compute: () => SandboxRouteResult,
) {
  echoIdempotencyHeader(req, res);
  const cacheKey = idempotencyCacheKey(req);
  const bodyFingerprint = stableJson(req.body);
  if (!cacheKey) {
    const response = compute();
    return res.status(response.status).json(response.body);
  }

  const cached = cache.get(cacheKey);
  if (cached) {
    if (cached.bodyFingerprint !== bodyFingerprint) {
      res.setHeader('skipship-idempotency-replayed', 'false');
      return res.status(409).json({
        ok: false,
        error: 'idempotency_key_conflict',
        message: 'The same idempotency key was reused with a different request body.',
      });
    }
    res.setHeader('skipship-idempotency-replayed', 'true');
    return res.status(cached.status).json(cached.body);
  }

  const response = compute();
  cache.set(cacheKey, {
    ...response,
    bodyFingerprint,
  });
  res.setHeader('skipship-idempotency-replayed', 'false');
  return res.status(response.status).json(response.body);
}

function relaySkipshipMock(req: Request, res: Response, cache: Map<string, IdempotencyCacheEntry>) {
  return sendIdempotent(req, res, cache, () => handleSkipshipMockRequest({
    method: req.method,
    path: req.path,
    headers: {
      authorization: 'Bearer pk_test_guest_or_key_authorized',
    },
    body: req.body as Record<string, unknown>,
  }));
}

function isTrackingWebhookRequest(body: unknown): body is TrackingWebhookRequest {
  if (!body || typeof body !== 'object') return false;
  const record = body as Record<string, unknown>;
  return typeof record.eventId === 'string'
    && typeof record.carrierAlias === 'string'
    && typeof record.trackingAlias === 'string'
    && typeof record.occurredAt === 'string'
    && (
      record.status === 'label_created'
      || record.status === 'in_transit'
      || record.status === 'delivered'
      || record.status === 'failed'
      || record.status === 'returned'
    );
}

export function registerSkipshipSandboxRoutes(app: Express, options: { guestAccess?: GuestAccessProvider; metrics?: VeygritShipMetrics } = {}) {
  const idempotencyCache = new Map<string, IdempotencyCacheEntry>();
  const trackingWebhookEvents = createInMemorySkipshipWebhookEventStore();

  app.get('/v1/merchant-console/webhook-ledger', (req, res) => {
    if (!hasTestBearer(req)) return rejectMissingTestBearer(res);
    return res.status(200).json(buildSkipshipMerchantConsoleWebhookLedger({
      snapshot: trackingWebhookEvents.snapshot(),
    }));
  });

  app.post('/v1/shipment-intents', requireGuestCapability(options.guestAccess, 'shipment_draft', { allowTestBearer: true }), (req, res) => {
    return sendIdempotent(req, res, idempotencyCache, () => {
      const result = createShipmentIntentSandbox(req.body as Record<string, unknown>);
      if (!result.ok) return { status: result.status, body: result as unknown as Record<string, unknown> };
      return { status: result.status, body: result.body as unknown as Record<string, unknown> };
    });
  });

  app.post('/v1/delivery/rates', requireGuestCapability(options.guestAccess, 'rate_simulation', { allowTestBearer: true }), (req, res) => relaySkipshipMock(req, res, idempotencyCache));
  app.post('/v1/delivery/allocate', requireGuestCapability(options.guestAccess, 'sandbox_shipment', { allowTestBearer: true }), (req, res) => relaySkipshipMock(req, res, idempotencyCache));
  app.post('/v1/shipments', requireGuestCapability(options.guestAccess, 'sandbox_shipment', { allowTestBearer: true }), (req, res) => relaySkipshipMock(req, res, idempotencyCache));
  app.post('/v1/hexaship/mvp-v0.1/shipments', requireGuestCapability(options.guestAccess, 'sandbox_shipment', { allowTestBearer: true }), (req, res) => {
    return sendIdempotent(req, res, idempotencyCache, () => {
      const result = runHexashipMvpV01Sandbox(req.body as Record<string, unknown>);
      if (result.ok === false) {
        return {
          status: result.status,
          body: result as unknown as Record<string, unknown>,
        };
      }
      return {
        status: 201,
        body: result as unknown as Record<string, unknown>,
      };
    });
  });
  app.post('/v1/merchant-console/onboarding', (req, res) => {
    if (!hasTestBearer(req)) return rejectMissingTestBearer(res);
    return sendIdempotent(req, res, idempotencyCache, () => {
      const result = createMerchantConsoleOnboardingMock(req.body as Record<string, unknown>);
      return {
        status: result.status,
        body: result as unknown as Record<string, unknown>,
      };
    });
  });
  app.post('/v1/delivery/webhooks/tracking', (req, res) => {
    const unsafe = handleSkipshipMockRequest({
      method: req.method,
      path: req.path,
      headers: { authorization: 'Bearer pk_test_webhook_internal' },
      body: req.body as Record<string, unknown>,
    });
    if (unsafe.status === 400) return res.status(unsafe.status).json(unsafe.body);
    if (!isTrackingWebhookRequest(req.body)) {
      return res.status(400).json({
        ok: false,
        error: 'invalid_tracking_webhook_body',
        message: 'Tracking webhook sandbox requires eventId, carrierAlias, trackingAlias, status, and occurredAt refs.',
      });
    }

    const signature = typeof req.headers['skipship-signature'] === 'string'
      ? req.headers['skipship-signature']
      : undefined;
    const timestamp = typeof req.headers['skipship-timestamp'] === 'string'
      ? req.headers['skipship-timestamp']
      : '';
    const verification = verifyTrackingWebhookSignature(signature, {
      timestamp,
      body: req.body,
    });

    if (!verification.ok) {
      return res.status(401).json({
        ok: false,
        error: verification.error,
        message: 'Tracking webhook sandbox signature verification failed.',
      });
    }

    const bodyFingerprint = stableJson(req.body);
    const response: SandboxRouteResult = {
      status: 202,
      body: {
        ok: true,
        accepted: true,
        trackingReceiptRef: req.body.trackingAlias,
        eventFingerprint: verification.eventFingerprint,
        eventId: req.body.eventId,
        status: req.body.status,
        localOnly: true,
        rawAddressStored: false,
        productionTraffic: false,
      },
    };
    const stored = trackingWebhookEvents.accept({
      eventId: req.body.eventId,
      bodyFingerprint,
      response,
    });
    const carrier = String(req.body.carrierAlias).toLowerCase();
    if ((carrier === 'ups' || carrier === 'dhl') && stored.kind !== 'replayed') {
      const occurredAt = Date.parse(req.body.occurredAt);
      if (Number.isFinite(occurredAt)) options.metrics?.recordWebhookDelay(carrier, Date.now() - occurredAt);
    }

    res.setHeader('skipship-webhook-event-replayed', stored.kind === 'replayed' ? 'true' : 'false');
    res.setHeader('skipship-webhook-event-attempt', String(stored.audit.attemptCount));
    res.setHeader('skipship-webhook-event-expires-at', stored.audit.expiresAt);
    return res.status(stored.response.status).json(stored.response.body);
  });
}

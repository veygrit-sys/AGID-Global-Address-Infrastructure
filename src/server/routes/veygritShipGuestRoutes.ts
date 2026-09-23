import type { Express, NextFunction, Request, RequestHandler, Response } from 'express';

import { createShipmentIntentSandbox } from '../../lib/addressStripeFoundation';
import { convertRegisteredAddressToCarrierWaybill, type RegisteredCarrierAddressInput } from '../../lib/carrierWaybillAddress';
import { getVeygritShipReleaseGateStatus } from '../../lib/veygritShipReleaseGateStatus';
import {
  ACCOUNT_REQUIRED_OPERATIONS,
  GUEST_CAPABILITIES,
  GUEST_FORBIDDEN_OPERATIONS,
  GuestSessionIssuanceError,
  PUBLIC_SITES_CARRIER_SECRET_BOUNDARY,
  type GuestCapability,
  type VeygritShipGuestAccessService,
  VEYGRIT_SHIP_GUEST_ACCESS_VERSION,
} from '../auth/veygritShipGuestAccess';

export type GuestAccessProvider = VeygritShipGuestAccessService | (() => Promise<VeygritShipGuestAccessService>);

function privateHeaders(res: Response): void {
  res.setHeader('cache-control', 'no-store, private');
  res.setHeader('pragma', 'no-cache');
  res.setHeader('x-content-type-options', 'nosniff');
}

function guestToken(req: Request): string {
  const direct = req.header('x-veygrit-guest-token')?.trim();
  if (direct) return direct;
  const authorization = req.header('authorization')?.trim() ?? '';
  return authorization.startsWith('Guest ') ? authorization.slice('Guest '.length).trim() : '';
}

function hasTestBearer(req: Request): boolean {
  return req.headers.authorization?.startsWith('Bearer pk_test_') === true;
}

async function resolveProvider(provider: GuestAccessProvider): Promise<VeygritShipGuestAccessService> {
  return typeof provider === 'function' ? provider() : provider;
}

function denialStatus(reason: string): 401 | 403 | 429 {
  if (reason === 'rate_limited') return 429;
  if (reason === 'capability_denied') return 403;
  return 401;
}

export function requireGuestCapability(
  provider: GuestAccessProvider | undefined,
  capability: GuestCapability,
  options: { allowTestBearer?: boolean } = {},
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    privateHeaders(res);
    if (options.allowTestBearer && hasTestBearer(req)) {
      res.locals.veygritAccess = { mode: 'test_key', capability };
      next();
      return;
    }
    const token = guestToken(req);
    if (!token) {
      res.status(401).json(options.allowTestBearer
        ? { ok: false, error: 'auth_required', message: 'Sandbox route requires a test publishable key or Guest token.' }
        : { ok: false, error: 'guest_session_required', capability });
      return;
    }
    if (!provider) {
      res.status(503).json({ ok: false, error: 'guest_access_not_configured' });
      return;
    }
    void resolveProvider(provider).then(service => service.authorize(token, capability)).then(decision => {
      if ('reason' in decision) {
        res.status(denialStatus(decision.reason)).json({ ok: false, error: `guest_${decision.reason}`, capability });
        return;
      }
      res.setHeader('veygrit-guest-remaining', String(decision.remaining));
      res.setHeader('veygrit-guest-expires-at', decision.expiresAt);
      res.locals.veygritAccess = { mode: 'guest', capability, sessionRef: decision.sessionRef };
      next();
    }).catch(() => {
      res.status(503).json({ ok: false, error: 'guest_access_unavailable' });
    });
  };
}

export function registerVeygritShipGuestRoutes(app: Express, provider?: GuestAccessProvider): void {
  app.get('/v1/guest/access-policy', (_req, res) => {
    privateHeaders(res);
    return res.status(200).json({
      ok: true,
      version: VEYGRIT_SHIP_GUEST_ACCESS_VERSION,
      loginRequired: false,
      environment: 'sandbox',
      allowedCapabilities: GUEST_CAPABILITIES,
      forbiddenOperations: GUEST_FORBIDDEN_OPERATIONS,
      accountRequiredOperations: ACCOUNT_REQUIRED_OPERATIONS,
      carrierCredentialStorage: {
        guestAllowed: false,
        storage: 'secret_manager_reference_only',
      },
      publicSitesCarrierSecretBoundary: PUBLIC_SITES_CARRIER_SECRET_BOUNDARY,
      productionTraffic: false,
    });
  });

  app.get('/v1/guest/release-gates/status', (_req, res) => {
    privateHeaders(res);
    return res.status(200).json({
      ok: true,
      ...getVeygritShipReleaseGateStatus(),
    });
  });

  app.post('/v1/guest/sessions', async (req, res) => {
    privateHeaders(res);
    if (!provider) return res.status(503).json({ ok: false, error: 'guest_access_not_configured' });
    try {
      const service = await resolveProvider(provider);
      const session = await service.issueSession(req.socket.remoteAddress ?? 'unknown');
      return res.status(201).json({
        ok: true,
        version: VEYGRIT_SHIP_GUEST_ACCESS_VERSION,
        tokenType: 'Guest',
        ...session,
        productionTraffic: false,
      });
    } catch (error) {
      if (error instanceof GuestSessionIssuanceError) {
        res.setHeader('retry-after', '3600');
        return res.status(429).json({ ok: false, error: 'guest_session_rate_limited' });
      }
      return res.status(503).json({ ok: false, error: 'guest_access_unavailable' });
    }
  });

  app.get('/v1/guest/session', requireGuestCapability(provider, 'test_api'), (req, res) => {
    return res.status(200).json({
      ok: true,
      access: res.locals.veygritAccess,
      allowedCapabilities: GUEST_CAPABILITIES,
      forbiddenOperations: GUEST_FORBIDDEN_OPERATIONS,
      accountRequiredOperations: ACCOUNT_REQUIRED_OPERATIONS,
      productionTraffic: false,
    });
  });

  app.get('/v1/guest/test-api/ping', requireGuestCapability(provider, 'test_api'), (_req, res) => {
    return res.status(200).json({ ok: true, environment: 'sandbox', productionTraffic: false });
  });

  app.post('/v1/guest/shipment-drafts', requireGuestCapability(provider, 'shipment_draft'), (req, res) => {
    const result = createShipmentIntentSandbox(req.body as Record<string, unknown>);
    if (!result.ok) return res.status(result.status).json(result);
    return res.status(201).json({
      ok: true,
      draft: result.body,
      guestSessionRef: res.locals.veygritAccess?.sessionRef,
      productionTraffic: false,
    });
  });

  app.post('/v1/guest/address-input', requireGuestCapability(provider, 'address_input'), (req, res) => {
    const body = req.body as { role?: unknown; address?: unknown } | undefined;
    if ((body?.role !== 'shipper' && body?.role !== 'receiver') || !body.address || typeof body.address !== 'object' || Array.isArray(body.address)) {
      return res.status(400).json({ ok: false, error: 'bad_request', message: 'role and address object are required.' });
    }
    const result = convertRegisteredAddressToCarrierWaybill(body.role, body.address as RegisteredCarrierAddressInput);
    return res.status(result.ok ? 200 : 422).json({
      ...result,
      guestSessionRef: res.locals.veygritAccess?.sessionRef,
      persisted: false,
      productionTraffic: false,
    });
  });
}

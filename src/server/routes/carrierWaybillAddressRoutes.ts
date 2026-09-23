import { timingSafeEqual } from 'node:crypto';
import type { Express, Request, Response } from 'express';

import {
  convertRegisteredAddressToCarrierWaybill,
  type CarrierWaybillAddressRole,
  type RegisteredCarrierAddressInput,
} from '../../lib/carrierWaybillAddress';

export type CarrierWaybillAddressRouteOptions = {
  internalApiKey?: string;
};

function constantTimeMatch(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

function privateResponseHeaders(res: Response) {
  res.setHeader('cache-control', 'no-store, private');
  res.setHeader('pragma', 'no-cache');
  res.setHeader('x-content-type-options', 'nosniff');
}

function requestApiKey(req: Request): string {
  const value = req.headers['x-veygrit-internal-key'];
  return typeof value === 'string' ? value : '';
}

export function registerCarrierWaybillAddressRoutes(
  app: Express,
  options: CarrierWaybillAddressRouteOptions = {},
) {
  const configuredApiKey = options.internalApiKey ?? process.env.VEYGRIT_CARRIER_INTERNAL_API_KEY ?? '';

  app.post('/api/internal/carriers/waybill-address/convert', (req, res) => {
    privateResponseHeaders(res);
    if (!configuredApiKey) {
      return res.status(503).json({
        ok: false,
        error: 'internal_carrier_api_not_configured',
      });
    }
    if (!constantTimeMatch(requestApiKey(req), configuredApiKey)) {
      return res.status(401).json({ ok: false, error: 'internal_auth_required' });
    }

    const body = req.body as { role?: unknown; address?: unknown } | undefined;
    const role = body?.role;
    if ((role !== 'shipper' && role !== 'receiver') || !body?.address || typeof body.address !== 'object' || Array.isArray(body.address)) {
      return res.status(400).json({
        ok: false,
        error: 'bad_request',
        message: 'role (shipper or receiver) and address object are required.',
      });
    }

    const result = convertRegisteredAddressToCarrierWaybill(
      role as CarrierWaybillAddressRole,
      body.address as RegisteredCarrierAddressInput,
    );
    return res.status(result.ok ? 200 : 422).json(result);
  });
}

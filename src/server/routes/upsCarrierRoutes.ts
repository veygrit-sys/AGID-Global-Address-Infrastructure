import { timingSafeEqual } from 'node:crypto';
import type { Express, NextFunction, Request, Response } from 'express';

import {
  createUpsConnectorFromEnv,
  UpsConfigurationError,
  UpsConnector,
  UpsConnectorError,
  type UpsCommonError,
} from '../carriers/ups/upsConnector';
import { VeygritShipMetrics, type ShipOperation } from '../observability/veygritShipObservability';

type UpsCarrierRouteOptions = {
  internalApiKey?: string;
  connector?: UpsConnector;
  connectorFactory?: () => UpsConnector;
  metrics?: VeygritShipMetrics;
};

function constantTimeMatch(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

function privateResponseHeaders(res: Response): void {
  res.setHeader('cache-control', 'no-store, private');
  res.setHeader('pragma', 'no-cache');
  res.setHeader('x-content-type-options', 'nosniff');
}

function requestApiKey(req: Request): string {
  const value = req.headers['x-veygrit-internal-key'];
  return typeof value === 'string' ? value : '';
}

function jsonObject(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function routeStatus(error: UpsCommonError): number {
  if (error.error.category === 'validation' || error.error.category === 'not_found') return error.status;
  if (error.error.category === 'rate_limited') return 429;
  return 503;
}

function sendError(res: Response, error: unknown): Response {
  if (error instanceof UpsConnectorError) {
    if (error.common.error.retryAfterMs !== undefined) {
      res.setHeader('retry-after', String(Math.ceil(error.common.error.retryAfterMs / 1000)));
    }
    return res.status(routeStatus(error.common)).json(error.common);
  }
  if (error instanceof UpsConfigurationError) {
    return res.status(503).json({
      ok: false,
      carrier: 'ups',
      error: 'ups_connector_not_configured',
      missingKeys: error.missingKeys,
    });
  }
  if (error instanceof TypeError) {
    return res.status(400).json({ ok: false, carrier: 'ups', error: 'bad_request', message: error.message });
  }
  return res.status(500).json({ ok: false, carrier: 'ups', error: 'internal_error' });
}

function asyncRoute(handler: (req: Request, res: Response) => Promise<Response>): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    handler(req, res).catch(next);
  };
}

export function registerUpsCarrierRoutes(app: Express, options: UpsCarrierRouteOptions = {}): void {
  const configuredApiKey = options.internalApiKey ?? process.env.VEYGRIT_CARRIER_INTERNAL_API_KEY ?? '';
  let connector = options.connector;
  const connectorFactory = options.connectorFactory ?? createUpsConnectorFromEnv;
  const observe = <T>(operation: ShipOperation, task: () => Promise<T>) => options.metrics
    ? options.metrics.observeCarrier('ups', operation, task)
    : task();

  const authorize = (req: Request, res: Response, next: NextFunction) => {
    privateResponseHeaders(res);
    if (!configuredApiKey) return res.status(503).json({ ok: false, error: 'internal_carrier_api_not_configured' });
    if (!constantTimeMatch(requestApiKey(req), configuredApiKey)) {
      return res.status(401).json({ ok: false, error: 'internal_auth_required' });
    }
    return next();
  };

  const getConnector = (): UpsConnector => {
    connector ??= connectorFactory();
    return connector;
  };

  app.post('/api/internal/carriers/ups/address-validation', authorize, asyncRoute(async (req, res) => {
    try {
      const body = jsonObject(req.body);
      const payload = body ? jsonObject(body.payload) : undefined;
      const rawOptions = body ? jsonObject(body.options) : undefined;
      if (!payload) throw new TypeError('payload object is required.');
      const requestOption = rawOptions?.requestOption;
      if (requestOption !== undefined && requestOption !== 1 && requestOption !== 2 && requestOption !== 3) {
        throw new TypeError('requestOption must be 1, 2, or 3.');
      }
      const validatedRequestOption = requestOption as 1 | 2 | 3 | undefined;
      const maximumCandidateListSize = rawOptions?.maximumCandidateListSize;
      if (maximumCandidateListSize !== undefined && (!Number.isInteger(maximumCandidateListSize) || Number(maximumCandidateListSize) < 0 || Number(maximumCandidateListSize) > 50)) {
        throw new TypeError('maximumCandidateListSize must be an integer from 0 to 50.');
      }
      const result = await observe('address_validation', () => getConnector().validateAddress(payload, {
        ...(validatedRequestOption !== undefined ? { requestOption: validatedRequestOption } : {}),
        ...(typeof rawOptions?.regionalRequestIndicator === 'boolean' ? { regionalRequestIndicator: rawOptions.regionalRequestIndicator } : {}),
        ...(maximumCandidateListSize !== undefined ? { maximumCandidateListSize: Number(maximumCandidateListSize) } : {}),
      }));
      return res.status(result.status).json(result);
    } catch (error) {
      return sendError(res, error);
    }
  }));

  app.post('/api/internal/carriers/ups/rates', authorize, asyncRoute(async (req, res) => {
    try {
      const body = jsonObject(req.body);
      const payload = body ? jsonObject(body.payload) : undefined;
      const rawOptions = body ? jsonObject(body.options) : undefined;
      if (!payload) throw new TypeError('payload object is required.');
      const allowedOptions = ['Rate', 'Shop', 'Ratetimeintransit', 'Shoptimeintransit'];
      if (rawOptions?.requestOption !== undefined && !allowedOptions.includes(String(rawOptions.requestOption))) {
        throw new TypeError('Unsupported UPS rating requestOption.');
      }
      const result = await observe('rate', () => getConnector().getRates(payload, {
        ...(rawOptions?.requestOption ? { requestOption: rawOptions.requestOption as 'Rate' | 'Shop' | 'Ratetimeintransit' | 'Shoptimeintransit' } : {}),
        ...(rawOptions?.additionalInfo === 'timeintransit' ? { additionalInfo: 'timeintransit' as const } : {}),
      }));
      return res.status(result.status).json(result);
    } catch (error) {
      return sendError(res, error);
    }
  }));

  app.post('/api/internal/carriers/ups/shipments', authorize, asyncRoute(async (req, res) => {
    try {
      const body = jsonObject(req.body);
      const payload = body ? jsonObject(body.payload) : undefined;
      const rawOptions = body ? jsonObject(body.options) : undefined;
      if (!payload) throw new TypeError('payload object is required.');
      const result = await observe('label', () => getConnector().createShipment(payload, {
        ...(rawOptions?.additionalAddressValidation === 'city' ? { additionalAddressValidation: 'city' as const } : {}),
      }));
      return res.status(result.status).json(result);
    } catch (error) {
      return sendError(res, error);
    }
  }));

  app.delete('/api/internal/carriers/ups/shipments/:shipmentIdentificationNumber', authorize, asyncRoute(async (req, res) => {
    try {
      const body = jsonObject(req.body);
      const trackingNumbers = Array.isArray(body?.trackingNumbers)
        ? body.trackingNumbers.filter((value): value is string => typeof value === 'string')
        : undefined;
      const result = await observe('void', () => getConnector().voidShipment(req.params.shipmentIdentificationNumber, { trackingNumbers }));
      return res.status(result.status).json(result);
    } catch (error) {
      return sendError(res, error);
    }
  }));

  app.get('/api/internal/carriers/ups/tracking/:inquiryNumber', authorize, asyncRoute(async (req, res) => {
    try {
      const result = await observe('tracking', () => getConnector().track(req.params.inquiryNumber, {
        ...(typeof req.query.locale === 'string' ? { locale: req.query.locale } : {}),
        ...(req.query.returnSignature !== undefined ? { returnSignature: req.query.returnSignature === 'true' } : {}),
        ...(req.query.returnMilestones !== undefined ? { returnMilestones: req.query.returnMilestones === 'true' } : {}),
        ...(req.query.returnPOD !== undefined ? { returnPOD: req.query.returnPOD === 'true' } : {}),
      }));
      return res.status(result.status).json(result);
    } catch (error) {
      return sendError(res, error);
    }
  }));
}

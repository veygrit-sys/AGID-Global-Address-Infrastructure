import { timingSafeEqual } from 'node:crypto';
import type { Express, NextFunction, Request, Response } from 'express';

import { createDhlEcommerceAdapterFromEnv, createMyDhlExpressAdapterFromEnv } from '../carriers/dhl/dhlAdapters';
import { DhlAdapterError, DhlConfigurationError } from '../carriers/dhl/dhlHttp';
import { DhlShipmentRouter, createDhlProductCodeStoreFromEnv, type DhlRoutingMode, type UnifiedDhlShipmentInput } from '../carriers/dhl/dhlShipmentRouter';
import { VeygritShipMetrics, type ShipOperation } from '../observability/veygritShipObservability';

type DhlCarrierRouteOptions = {
  internalApiKey?: string;
  router?: DhlShipmentRouter;
  routerFactory?: () => DhlShipmentRouter;
  metrics?: VeygritShipMetrics;
};

function privateHeaders(res: Response): void {
  res.setHeader('cache-control', 'no-store, private');
  res.setHeader('pragma', 'no-cache');
  res.setHeader('x-content-type-options', 'nosniff');
}

function equal(actual: string, expected: string): boolean {
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function object(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${key} is required.`);
  return value;
}

function commonShipmentInput(body: Record<string, unknown>): UnifiedDhlShipmentInput {
  if ('productName' in body) throw new TypeError('productName is not accepted; store productIdCode instead.');
  const payload = object(body.payload);
  if (!payload) throw new TypeError('payload object is required.');
  const routingMode = body.routingMode;
  if (routingMode !== undefined && routingMode !== 'auto' && routingMode !== 'mydhl-express' && routingMode !== 'ecommerce-americas-v4') {
    throw new TypeError('routingMode is invalid.');
  }
  const labelFormat = body.labelFormat;
  if (labelFormat !== undefined && labelFormat !== 'ZPL' && labelFormat !== 'PNG' && labelFormat !== 'PDF') throw new TypeError('labelFormat is invalid.');
  return {
    merchantRef: requiredString(body, 'merchantRef'),
    shipmentRef: requiredString(body, 'shipmentRef'),
    originCountryCode: requiredString(body, 'originCountryCode'),
    destinationCountryCode: requiredString(body, 'destinationCountryCode'),
    productIdCode: requiredString(body, 'productIdCode'),
    payload,
    ...(routingMode ? { routingMode: routingMode as DhlRoutingMode } : {}),
    ...(labelFormat ? { labelFormat: labelFormat as 'ZPL' | 'PNG' | 'PDF' } : {}),
  };
}

function statusFor(error: DhlAdapterError): number {
  const category = error.common.error.category;
  if (category === 'validation' || category === 'not_found' || category === 'unsupported') return error.common.status;
  if (category === 'rate_limited') return 429;
  return 503;
}

function sendError(res: Response, error: unknown): Response {
  if (error instanceof DhlAdapterError) {
    if (error.common.error.retryAfterMs !== undefined) res.setHeader('retry-after', String(Math.ceil(error.common.error.retryAfterMs / 1000)));
    return res.status(statusFor(error)).json(error.common);
  }
  if (error instanceof DhlConfigurationError) return res.status(503).json({ ok: false, carrier: 'dhl', error: 'dhl_connector_not_configured', missingKeys: error.missingKeys });
  if (error instanceof TypeError) return res.status(400).json({ ok: false, carrier: 'dhl', error: 'bad_request', message: error.message });
  return res.status(500).json({ ok: false, carrier: 'dhl', error: 'internal_error' });
}

function asyncRoute(handler: (req: Request, res: Response) => Promise<Response>) {
  return (req: Request, res: Response, next: NextFunction) => { handler(req, res).catch(next); };
}

export function registerDhlCarrierRoutes(app: Express, options: DhlCarrierRouteOptions = {}): void {
  const apiKey = options.internalApiKey ?? process.env.VEYGRIT_CARRIER_INTERNAL_API_KEY ?? '';
  let router = options.router;
  const factory = options.routerFactory ?? (() => new DhlShipmentRouter(
    createMyDhlExpressAdapterFromEnv(),
    createDhlEcommerceAdapterFromEnv(),
    createDhlProductCodeStoreFromEnv(),
  ));
  const getRouter = () => (router ??= factory());
  const observe = <T>(operation: ShipOperation, task: () => Promise<T>) => options.metrics
    ? options.metrics.observeCarrier('dhl', operation, task)
    : task();
  const authorize = (req: Request, res: Response, next: NextFunction) => {
    privateHeaders(res);
    const supplied = typeof req.headers['x-veygrit-internal-key'] === 'string' ? req.headers['x-veygrit-internal-key'] : '';
    if (!apiKey) return res.status(503).json({ ok: false, error: 'internal_carrier_api_not_configured' });
    if (!equal(supplied, apiKey)) return res.status(401).json({ ok: false, error: 'internal_auth_required' });
    return next();
  };

  app.post('/api/internal/carriers/dhl/shipments', authorize, asyncRoute(async (req, res) => {
    try {
      const body = object(req.body);
      if (!body) throw new TypeError('JSON body is required.');
      const result = await observe('label', () => getRouter().createShipment(commonShipmentInput(body)));
      return res.status(result.upstream.status).json(result);
    } catch (error) { return sendError(res, error); }
  }));

  app.post('/api/internal/carriers/dhl/shipments/returns', authorize, asyncRoute(async (req, res) => {
    try {
      const body = object(req.body);
      if (!body) throw new TypeError('JSON body is required.');
      const returnFormat = body.returnFormat;
      if (returnFormat !== undefined && returnFormat !== 'ZPL' && returnFormat !== 'PNG' && returnFormat !== 'PDF' && returnFormat !== 'QR') throw new TypeError('returnFormat is invalid.');
      const result = await observe('return_label', () => getRouter().createReturnLabel({ ...commonShipmentInput(body), ...(returnFormat ? { returnFormat: returnFormat as 'ZPL' | 'PNG' | 'PDF' | 'QR' } : {}) }));
      return res.status(result.upstream.status).json(result);
    } catch (error) { return sendError(res, error); }
  }));

  app.delete('/api/internal/carriers/dhl/shipments/:shipmentRef', authorize, asyncRoute(async (req, res) => {
    try {
      const body = object(req.body) ?? {};
      const result = await observe('void', () => getRouter().voidShipment(req.params.shipmentRef, requiredString(body, 'packageId'), typeof body.dhlPackageId === 'string' ? body.dhlPackageId : undefined));
      return res.status(result.status).json(result);
    } catch (error) { return sendError(res, error); }
  }));

  app.post('/api/internal/carriers/dhl/ecommerce/products', authorize, asyncRoute(async (req, res) => {
    try {
      const body = object(req.body);
      const payload = body ? object(body.payload) : undefined;
      if (!payload) throw new TypeError('payload object is required.');
      const result = await observe('product', () => getRouter().findEcommerceProducts(payload));
      return res.status(result.status).json(result);
    } catch (error) { return sendError(res, error); }
  }));

  app.post('/api/internal/carriers/dhl/ecommerce/manifests', authorize, asyncRoute(async (req, res) => {
    try {
      const body = object(req.body);
      const payload = body ? object(body.payload) : undefined;
      if (!payload) throw new TypeError('payload object is required.');
      const result = await observe('manifest', () => getRouter().createManifest(payload));
      return res.status(result.status).json(result);
    } catch (error) { return sendError(res, error); }
  }));

  app.get('/api/internal/carriers/dhl/ecommerce/manifests/:requestId', authorize, asyncRoute(async (req, res) => {
    try {
      const result = await observe('manifest', () => getRouter().getManifest(req.params.requestId));
      return res.status(result.status).json(result);
    } catch (error) { return sendError(res, error); }
  }));
}

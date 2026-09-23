import type { Express, Request, Response } from 'express';

import {
  VEY_TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE,
  buildVeyTradeGatewayIdempotencyFixture,
} from '../../lib/veyTrading';
import { TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE } from '../../lib/veyTradeGatewayTestVectorClient';

export { TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE };

function hasTestBearer(req: Request) {
  return req.headers.authorization?.startsWith('Bearer pk_test_') === true;
}

function setTradeGatewayTestVectorHeaders(res: Response) {
  res.setHeader('cache-control', 'no-store');
  res.setHeader('x-agid-local-only', 'true');
  res.setHeader('x-agid-boundary-gate', VEY_TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE);
}

function rejectMissingTestBearer(res: Response) {
  setTradeGatewayTestVectorHeaders(res);
  return res.status(401).json({
    ok: false,
    error: 'auth_required',
    message: 'Trade Gateway idempotency test vectors require a test publishable key.',
    localOnly: true,
    productionTraffic: false,
  });
}

function rejectQueryMaterial(res: Response) {
  setTradeGatewayTestVectorHeaders(res);
  return res.status(400).json({
    ok: false,
    error: 'query_not_allowed',
    message: 'Trade Gateway idempotency test vectors are deterministic and do not accept query material.',
    localOnly: true,
    productionTraffic: false,
  });
}

export function registerTradeGatewayRoutes(app: Express) {
  app.get(TRADE_GATEWAY_IDEMPOTENCY_TEST_VECTOR_ROUTE, (req, res) => {
    if (!hasTestBearer(req)) return rejectMissingTestBearer(res);
    if (Object.keys(req.query).length > 0) return rejectQueryMaterial(res);

    setTradeGatewayTestVectorHeaders(res);
    return res.status(200).json(buildVeyTradeGatewayIdempotencyFixture());
  });
}

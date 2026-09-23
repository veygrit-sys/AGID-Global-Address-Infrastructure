import type { Request, Response } from 'express';

import { sanitizeRequestId } from './proxySecurity';

export type AgidServerResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
  confidence?: number;
  sources: string[];
  warnings: string[];
  cache?: 'hit' | 'miss' | 'stale' | 'none';
  requestId: string;
};

export function requestIdFor(req: Request) {
  const fromHeader = sanitizeRequestId(req.header('X-AGID-Request-ID'));
  if (fromHeader) return fromHeader;
  return `srv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function sendAgidResult<T>(
  req: Request,
  res: Response,
  result: Omit<AgidServerResult<T>, 'requestId'> & { requestId?: string },
  status = result.ok ? 200 : 500,
) {
  const requestId = result.requestId || requestIdFor(req);
  res.setHeader('X-AGID-Request-ID', requestId);
  res.status(status).json({
    ...result,
    requestId,
    sources: Array.isArray(result.sources) ? result.sources : [],
    warnings: Array.isArray(result.warnings) ? result.warnings : [],
  } satisfies AgidServerResult<T>);
}

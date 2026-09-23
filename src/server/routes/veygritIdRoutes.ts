import type { Express, NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

import type { VerifiedSocialIdentity, VeygritIdService } from '../auth/veygritIdService';
import { assertNoPrivateMaterialBodyKeys } from '../security/privateMaterialBodyGuard';

export type VeygritIdRouteOptions = {
  service?: VeygritIdService;
  verifySocialCallback?: (input: { provider: string; body: unknown; request: Request }) => Promise<VerifiedSocialIdentity>;
  secureCookies?: boolean;
};

function requestId(req: Request) {
  const value = req.headers['x-request-id'] ?? req.headers['x-agid-request-id'];
  return typeof value === 'string' ? value.slice(0, 160) : undefined;
}
function bearer(req: Request) {
  const value = req.headers.authorization;
  return value?.startsWith('Bearer ') ? value.slice(7) : undefined;
}
function basicClient(req: Request) {
  const value = req.headers.authorization;
  if (!value?.startsWith('Basic ')) return {};
  try {
    const [clientId, clientSecret] = Buffer.from(value.slice(6), 'base64').toString('utf8').split(':', 2);
    return { clientId, clientSecret };
  } catch { return {}; }
}
function cookie(req: Request, name: string) {
  const pair = String(req.headers.cookie ?? '').split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : undefined;
}
function unavailable(res: Response) {
  res.setHeader('cache-control', 'no-store');
  return res.status(503).json({ error: 'temporarily_unavailable', error_description: 'Veygrit ID runtime is not configured.' });
}
function oauthError(res: Response, error: unknown) {
  const code = error instanceof TypeError ? error.message : 'server_error';
  const status = ['invalid_client', 'client_authentication_failed'].includes(code) ? 401 : 400;
  res.setHeader('cache-control', 'no-store');
  return res.status(status).json({ error: code, error_description: 'Veygrit ID rejected the request.' });
}
function asyncRoute(handler: (req: Request, res: Response) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => { handler(req, res).catch(next); };
}

export function registerVeygritIdRoutes(app: Express, options: VeygritIdRouteOptions = {}) {
  const limiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false });
  app.use(['/veygrit/oauth', '/veygrit/social', '/v1/navigation-handoffs'], limiter);

  app.get('/.well-known/openid-configuration', (_req, res) => options.service ? res.status(200).json(options.service.discovery()) : unavailable(res));
  app.get('/.well-known/jwks.json', (_req, res) => {
    if (!options.service) return unavailable(res);
    res.setHeader('cache-control', 'public, max-age=300, stale-while-revalidate=3600');
    return res.status(200).json(options.service.jwks());
  });

  app.get('/veygrit/oauth/authorize', asyncRoute(async (req, res) => {
    if (!options.service) return unavailable(res);
    try {
      if (req.query.response_type !== 'code') throw new TypeError('unsupported_response_type');
      const result = await options.service.startAuthorization({
        clientId: String(req.query.client_id ?? ''), redirectUri: String(req.query.redirect_uri ?? ''), origin: req.query.origin ? String(req.query.origin) : undefined,
        scope: String(req.query.scope ?? ''), state: String(req.query.state ?? ''), nonce: String(req.query.nonce ?? ''), codeChallenge: String(req.query.code_challenge ?? ''),
        codeChallengeMethod: String(req.query.code_challenge_method ?? '') as 'S256', requestId: requestId(req),
      });
      res.setHeader('cache-control', 'no-store');
      return res.redirect(302, result.continueUrl);
    } catch (error) { return oauthError(res, error); }
  }));

  app.post('/veygrit/social/:provider/callback', asyncRoute(async (req, res) => {
    if (!options.service || !options.verifySocialCallback) return unavailable(res);
    try {
      assertNoPrivateMaterialBodyKeys(req.body);
      await options.service.verifyAuthorizationRequestState(String(req.body?.request_ref ?? ''), String(req.body?.state ?? ''));
      const identity = await options.verifySocialCallback({ provider: req.params.provider, body: req.body, request: req });
      const session = await options.service.establishSocialSession(identity, requestId(req));
      res.setHeader('cache-control', 'no-store');
      res.cookie('veygrit_session', session.sessionToken, { httpOnly: true, secure: options.secureCookies ?? true, sameSite: 'lax', maxAge: Math.max(1, Date.parse(session.expiresAt) - Date.now()), path: '/veygrit' });
      return res.status(200).json({ sessionRef: session.sessionRef, expiresAt: session.expiresAt, provider: session.provider });
    } catch (error) { return oauthError(res, error); }
  }));

  app.post('/veygrit/oauth/approve', asyncRoute(async (req, res) => {
    if (!options.service) return unavailable(res);
    try {
      const sessionToken = cookie(req, 'veygrit_session');
      if (!sessionToken) throw new TypeError('session_invalid');
      const result = await options.service.approveAuthorization({ requestRef: String(req.body?.request_ref ?? ''), sessionToken, state: String(req.body?.state ?? ''), walletConsentRef: req.body?.wallet_consent_ref ? String(req.body.wallet_consent_ref) : undefined, requestId: requestId(req) });
      res.setHeader('cache-control', 'no-store');
      return res.redirect(302, result.redirectUri);
    } catch (error) { return oauthError(res, error); }
  }));

  app.post('/veygrit/oauth/token', asyncRoute(async (req, res) => {
    if (!options.service) return unavailable(res);
    try {
      const basic = basicClient(req);
      const clientId = basic.clientId ?? String(req.body?.client_id ?? '');
      const clientSecret = basic.clientSecret ?? (req.body?.client_secret ? String(req.body.client_secret) : undefined);
      const grantType = String(req.body?.grant_type ?? '');
      const result = grantType === 'authorization_code'
        ? await options.service.exchangeAuthorizationCode({ code: String(req.body?.code ?? ''), clientId, clientSecret, redirectUri: String(req.body?.redirect_uri ?? ''), codeVerifier: String(req.body?.code_verifier ?? ''), requestId: requestId(req) })
        : grantType === 'refresh_token'
          ? await options.service.refresh({ refreshToken: String(req.body?.refresh_token ?? ''), clientId, clientSecret, requestId: requestId(req) })
          : (() => { throw new TypeError('unsupported_grant_type'); })();
      res.setHeader('cache-control', 'no-store');
      return res.status(200).json(result);
    } catch (error) { return oauthError(res, error); }
  }));

  app.get('/veygrit/oauth/userinfo', asyncRoute(async (req, res) => {
    if (!options.service) return unavailable(res);
    const token = bearer(req); if (!token) return res.status(401).json({ error: 'invalid_token' });
    const result = await options.service.introspect(token);
    if (!result.active) return res.status(401).json({ error: 'invalid_token' });
    res.setHeader('cache-control', 'no-store');
    return res.status(200).json({ sub: result.sub, client_id: result.client_id, scope: result.scope });
  }));

  app.post('/veygrit/oauth/introspect', asyncRoute(async (req, res) => {
    if (!options.service) return unavailable(res);
    try {
      const basic = basicClient(req); const clientId = basic.clientId ?? String(req.body?.client_id ?? '');
      const result = await options.service.introspectForClient(String(req.body?.token ?? ''), clientId, basic.clientSecret ?? (req.body?.client_secret ? String(req.body.client_secret) : undefined));
      res.setHeader('cache-control', 'no-store');
      return res.status(200).json(result);
    } catch (error) { return oauthError(res, error); }
  }));
  app.post('/veygrit/oauth/revoke', asyncRoute(async (req, res) => {
    if (!options.service) return unavailable(res);
    try { const basic = basicClient(req); const clientId = basic.clientId ?? String(req.body?.client_id ?? ''); await options.service.revokeForClient(String(req.body?.token ?? ''), clientId, basic.clientSecret ?? (req.body?.client_secret ? String(req.body.client_secret) : undefined), requestId(req)); res.setHeader('cache-control', 'no-store'); return res.status(200).json({ revoked: true }); }
    catch (error) { return oauthError(res, error); }
  }));

  app.post('/v1/navigation-handoffs', asyncRoute(async (req, res) => {
    if (!options.service) return unavailable(res);
    const token = bearer(req); if (!token) return res.status(401).json({ error: 'invalid_token' });
    try {
      const result = await options.service.createNavigationHandoff({ accessToken: token, source: req.body?.source, target: req.body?.target, returnPath: String(req.body?.returnPath ?? '/'), requestId: requestId(req) });
      res.setHeader('cache-control', 'no-store'); return res.status(201).json(result);
    } catch (error) { return oauthError(res, error); }
  }));
  app.post('/v1/navigation-handoffs/consume', asyncRoute(async (req, res) => {
    if (!options.service) return unavailable(res);
    try { const result = await options.service.consumeNavigationHandoff(String(req.body?.handoffToken ?? ''), requestId(req)); res.setHeader('cache-control', 'no-store'); return res.status(200).json(result); }
    catch (error) { return oauthError(res, error); }
  }));
}

import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync } from 'node:crypto';
import type { Server } from 'node:http';
import { after, before, test } from 'node:test';
import express from 'express';

import { createEd25519IdTokenSigner, InMemoryVeygritIdStore, VeygritIdService } from '../auth/veygritIdService';
import { registerVeygritIdRoutes } from './veygritIdRoutes';

let server: Server; let baseUrl = ''; let service: VeygritIdService; let authorizationStateChecks = 0; let socialCallbackVerifications = 0;

before(async () => {
  const { privateKey } = generateKeyPairSync('ed25519');
  const signer = createEd25519IdTokenSigner(privateKey.export({ format: 'pem', type: 'pkcs8' }).toString(), 'route-key');
  service = new VeygritIdService(new InMemoryVeygritIdStore(), { issuer: 'https://id.veygrit.test', signer, pairwiseSubjectSecret: 'route-pairwise-secret-at-least-32-characters', providerSubjectPepper: 'route-provider-pepper-at-least-32-characters', now: () => new Date('2026-07-18T05:00:00.000Z') });
  const verifyAuthorizationRequestState = service.verifyAuthorizationRequestState.bind(service);
  service.verifyAuthorizationRequestState = async (requestRef, state) => { authorizationStateChecks += 1; return verifyAuthorizationRequestState(requestRef, state); };
  await service.registerClient({ clientId: 'route-store', displayName: 'Route Store', clientType: 'public', sectorIdentifier: 'route-store.example', redirectUris: ['https://route-store.example/callback'], allowedOrigins: ['https://route-store.example'], allowedScopes: ['openid', 'address_wallet'] });
  const app = express(); app.use(express.json()); app.use(express.urlencoded({ extended: false }));
  registerVeygritIdRoutes(app, { service, secureCookies: false, verifySocialCallback: async ({ provider }) => { socialCallbackVerifications += 1; return { provider: provider as 'google', providerSubject: 'verified-route-user', emailVerified: true, authenticatedAt: '2026-07-18T05:00:00.000Z', verification: 'provider-jwks-verified' }; } });
  await new Promise<void>(resolve => { server = app.listen(0, () => { const address = server.address(); if (address && typeof address === 'object') baseUrl = `http://127.0.0.1:${address.port}`; resolve(); }); });
});
after(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });

test('OIDC discovery and JWKS expose pairwise + authorization-code capabilities', async () => {
  const discovery = await fetch(`${baseUrl}/.well-known/openid-configuration`).then(response => response.json()) as any;
  assert.deepEqual(discovery.subject_types_supported, ['pairwise']); assert.deepEqual(discovery.code_challenge_methods_supported, ['S256']);
  const jwks = await fetch(`${baseUrl}/.well-known/jwks.json`).then(response => response.json()) as any;
  assert.equal(jwks.keys[0].alg, 'EdDSA'); assert.equal(jwks.keys[0].d, undefined);
});

test('HTTP authorization flow sets HttpOnly session, redirects with code, and exchanges once', async () => {
  const verifier = 'r'.repeat(64); const challenge = createHash('sha256').update(verifier).digest('base64url');
  const query = new URLSearchParams({ client_id: 'route-store', redirect_uri: 'https://route-store.example/callback', response_type: 'code', scope: 'openid address_wallet', state: 'route-state-1234567890', nonce: 'route-nonce-1234567890', code_challenge: challenge, code_challenge_method: 'S256', origin: 'https://route-store.example' });
  const authorization = await fetch(`${baseUrl}/veygrit/oauth/authorize?${query}`, { redirect: 'manual' });
  assert.equal(authorization.status, 302); const requestRef = new URL(authorization.headers.get('location')!).searchParams.get('request_ref')!;
  const social = await fetch(`${baseUrl}/veygrit/social/google/callback`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ request_ref: requestRef, state: 'route-state-1234567890' }) });
  assert.equal(social.status, 200); const sessionCookie = social.headers.get('set-cookie')!; assert.match(sessionCookie, /HttpOnly/i); const socialBody = await social.json() as any; assert.equal(socialBody.sessionToken, undefined); assert.match(socialBody.sessionRef, /^vey_session_/);
  const approval = await fetch(`${baseUrl}/veygrit/oauth/approve`, { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/json', cookie: sessionCookie.split(';')[0] }, body: JSON.stringify({ request_ref: requestRef, state: 'route-state-1234567890', wallet_consent_ref: 'wallet_consent_route' }) });
  assert.equal(approval.status, 302); const code = new URL(approval.headers.get('location')!).searchParams.get('code')!;
  const tokenResponse = await fetch(`${baseUrl}/veygrit/oauth/token`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code, client_id: 'route-store', redirect_uri: 'https://route-store.example/callback', code_verifier: verifier }) });
  const token = await tokenResponse.json() as any; assert.equal(tokenResponse.status, 200); assert.equal(token.token_type, 'Bearer'); assert.match(token.id_token, /^[^.]+\.[^.]+\.[^.]+$/);
  const replay = await fetch(`${baseUrl}/veygrit/oauth/token`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code, client_id: 'route-store', redirect_uri: 'https://route-store.example/callback', code_verifier: verifier }) });
  assert.equal(replay.status, 400); assert.equal((await replay.json() as any).error, 'invalid_or_replayed_authorization_code');
});

test('HTTP social callback rejects unsupported provider before session cookie issuance', async () => {
  const verifier = 'g'.repeat(64); const challenge = createHash('sha256').update(verifier).digest('base64url');
  const state = 'github-state-1234567890';
  const query = new URLSearchParams({ client_id: 'route-store', redirect_uri: 'https://route-store.example/callback', response_type: 'code', scope: 'openid address_wallet', state, nonce: 'github-nonce-1234567890', code_challenge: challenge, code_challenge_method: 'S256', origin: 'https://route-store.example' });
  const authorization = await fetch(`${baseUrl}/veygrit/oauth/authorize?${query}`, { redirect: 'manual' });
  assert.equal(authorization.status, 302);
  const requestRef = new URL(authorization.headers.get('location')!).searchParams.get('request_ref')!;

  const social = await fetch(`${baseUrl}/veygrit/social/github/callback`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ request_ref: requestRef, state }) });
  const body = await social.json() as any;

  assert.equal(social.status, 400);
  assert.equal(body.error, 'unsupported_social_provider');
  assert.equal(social.headers.get('set-cookie'), null);
});

test('HTTP social callback rejects private material fields before service or provider verification', async () => {
  const beforeStateChecks = authorizationStateChecks;
  const beforeProviderVerifications = socialCallbackVerifications;
  const social = await fetch(`${baseUrl}/veygrit/social/google/callback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      request_ref: 'vey_auth_req_field_name_only',
      state: 'private-material-state-1234567890',
      privateKey: null,
      proof_secret: null,
      rawRecipient: null,
    }),
  });
  const body = await social.json() as any;
  const serialized = JSON.stringify(body);

  assert.equal(social.status, 400);
  assert.equal(body.error, 'private_material_not_allowed');
  assert.equal(social.headers.get('set-cookie'), null);
  assert.equal(authorizationStateChecks, beforeStateChecks);
  assert.equal(socialCallbackVerifications, beforeProviderVerifications);
  assert.doesNotMatch(serialized, /privateKey|proof_secret|rawRecipient|field_name_only/i);
});

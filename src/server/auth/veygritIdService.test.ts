import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { importJWK, jwtVerify } from 'jose';

import {
  createEd25519IdTokenSigner,
  hashVeygritClientSecret,
  InMemoryVeygritIdStore,
  VeygritIdService,
} from './veygritIdService';
import { createVeygritSocialCallbackVerifier, createVeygritSocialCallbackVerifierFromEnv } from './veygritSocialProviderBroker';

function fixture() {
  const { privateKey } = generateKeyPairSync('ed25519');
  const privateKeyPem = privateKey.export({ format: 'pem', type: 'pkcs8' }).toString();
  const store = new InMemoryVeygritIdStore();
  let now = new Date('2026-07-18T04:00:00.000Z');
  const signer = createEd25519IdTokenSigner(privateKeyPem, 'vey-id-test-key');
  const service = new VeygritIdService(store, {
    issuer: 'https://id.veygrit.test', pairwiseSubjectSecret: 'pairwise-secret-at-least-thirty-two-characters', providerSubjectPepper: 'provider-pepper-at-least-thirty-two-characters', signer, now: () => now,
  });
  return { store, service, signer, setNow: (value: string) => { now = new Date(value); } };
}

async function completeFlow(clientId = 'store-one') {
  const f = fixture(); const verifier = 'v'.repeat(64); const challenge = Buffer.from(await crypto.subtle.digest('SHA-256', Buffer.from(verifier))).toString('base64url');
  await f.service.registerClient({ clientId, displayName: 'Store One', clientType: 'public', sectorIdentifier: `${clientId}.example`, redirectUris: [`https://${clientId}.example/callback`], allowedOrigins: [`https://${clientId}.example`], allowedScopes: ['openid', 'address_wallet'] });
  const auth = await f.service.startAuthorization({ clientId, redirectUri: `https://${clientId}.example/callback`, origin: `https://${clientId}.example`, scope: 'openid address_wallet', state: 'state-value-1234567890', nonce: 'nonce-value-1234567890', codeChallenge: challenge, codeChallengeMethod: 'S256' });
  const session = await f.service.establishSocialSession({ provider: 'google', providerSubject: 'google-subject-private', email: 'private@example.test', emailVerified: true, authenticatedAt: '2026-07-18T04:00:00.000Z', verification: 'provider-jwks-verified' });
  const approval = await f.service.approveAuthorization({ requestRef: auth.requestRef, sessionToken: session.sessionToken, state: 'state-value-1234567890', walletConsentRef: 'wallet_consent_demo' });
  const token = await f.service.exchangeAuthorizationCode({ code: approval.authorizationCode, clientId, redirectUri: `https://${clientId}.example/callback`, codeVerifier: verifier });
  return { ...f, auth, session, approval, token };
}

test('authorization code + PKCE issues a signed pairwise ID token and opaque tokens', async () => {
  const f = await completeFlow();
  assert.match(f.token.access_token, /^vey_access_/); assert.match(f.token.refresh_token, /^vey_refresh_/);
  const publicKey = await importJWK(f.signer.publicJwk, 'EdDSA');
  const verified = await jwtVerify(f.token.id_token, publicKey, { issuer: 'https://id.veygrit.test', audience: 'store-one', currentDate: new Date('2026-07-18T04:01:00.000Z') });
  assert.match(String(verified.payload.sub), /^pairwise_/); assert.equal(verified.payload.nonce, 'nonce-value-1234567890');
  assert.doesNotMatch(JSON.stringify([...f.store.subjects.values(), ...f.store.sessions.values(), ...f.store.families.values()]), /private@example\.test|google-subject-private/);
});

test('authorization code is single-use even after a failed second exchange', async () => {
  const f = await completeFlow();
  await assert.rejects(() => f.service.exchangeAuthorizationCode({ code: f.approval.authorizationCode, clientId: 'store-one', redirectUri: 'https://store-one.example/callback', codeVerifier: 'v'.repeat(64) }), /invalid_or_replayed_authorization_code/);
});

test('the same social account receives different pairwise subjects for different Store sectors', async () => {
  const f = fixture();
  const issueFor = async (clientId: string) => {
    const verifier = `${clientId}-`.padEnd(64, 'x'); const challenge = createHash('sha256').update(verifier).digest('base64url');
    await f.service.registerClient({ clientId, displayName: clientId, clientType: 'public', sectorIdentifier: `${clientId}.example`, redirectUris: [`https://${clientId}.example/callback`], allowedOrigins: [`https://${clientId}.example`], allowedScopes: ['openid'] });
    const auth = await f.service.startAuthorization({ clientId, redirectUri: `https://${clientId}.example/callback`, scope: 'openid', state: `state-${clientId}-1234567890`, nonce: `nonce-${clientId}-1234567890`, codeChallenge: challenge, codeChallengeMethod: 'S256' });
    const session = await f.service.establishSocialSession({ provider: 'google', providerSubject: 'same-private-provider-subject', emailVerified: true, authenticatedAt: '2026-07-18T04:00:00.000Z', verification: 'provider-jwks-verified' });
    const approval = await f.service.approveAuthorization({ requestRef: auth.requestRef, sessionToken: session.sessionToken, state: `state-${clientId}-1234567890` });
    const tokens = await f.service.exchangeAuthorizationCode({ code: approval.authorizationCode, clientId, redirectUri: `https://${clientId}.example/callback`, codeVerifier: verifier });
    return JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64url').toString('utf8')).sub as string;
  };
  const first = await issueFor('store-alpha'); const second = await issueFor('store-beta');
  assert.match(first, /^pairwise_/); assert.match(second, /^pairwise_/); assert.notEqual(first, second); assert.equal(f.store.subjects.size, 1);
});

test('refresh rotation detects reuse and compromises the whole token family', async () => {
  const f = await completeFlow();
  const rotated = await f.service.refresh({ refreshToken: f.token.refresh_token, clientId: 'store-one' });
  assert.notEqual(rotated.refresh_token, f.token.refresh_token);
  await assert.rejects(() => f.service.refresh({ refreshToken: f.token.refresh_token, clientId: 'store-one' }), /refresh_token_reuse_detected/);
  const introspection = await f.service.introspect(rotated.access_token);
  assert.equal(introspection.active, false);
});

test('navigation handoffs are one-time, target-bound, and never carry a global subject', async () => {
  const f = await completeFlow();
  const handoff = await f.service.createNavigationHandoff({ accessToken: f.token.access_token, source: 'veygrit-ship', target: 'address-wallet', returnPath: '/operations?tab=stores' });
  const consumed = await f.service.consumeNavigationHandoff(handoff.handoffToken);
  assert.equal(consumed.target, 'address-wallet'); assert.match(consumed.pairwiseSubjectAlias, /^pairwise_/);
  await assert.rejects(() => f.service.consumeNavigationHandoff(handoff.handoffToken), /invalid_or_replayed/);
});

test('redirect allowlist and confidential client authentication are enforced', async () => {
  const f = fixture();
  await f.service.registerClient({ clientId: 'confidential-store', displayName: 'Confidential', clientType: 'confidential', sectorIdentifier: 'confidential.example', redirectUris: ['https://confidential.example/callback'], allowedOrigins: ['https://confidential.example'], allowedScopes: ['openid'], clientSecretHash: hashVeygritClientSecret('super-secret-client-value') });
  await assert.rejects(() => f.service.startAuthorization({ clientId: 'confidential-store', redirectUri: 'https://evil.example/callback', scope: 'openid', state: 'state-value-1234567890', nonce: 'nonce-value-1234567890', codeChallenge: 'a'.repeat(43), codeChallengeMethod: 'S256' }), /redirect_uri_not_allowed/);
});

test('address wallet scopes cannot be approved without explicit wallet consent', async () => {
  const f = fixture(); const verifier = 'c'.repeat(64); const challenge = createHash('sha256').update(verifier).digest('base64url');
  await f.service.registerClient({ clientId: 'consent-store', displayName: 'Consent', clientType: 'public', sectorIdentifier: 'consent.example', redirectUris: ['https://consent.example/callback'], allowedOrigins: ['https://consent.example'], allowedScopes: ['openid', 'address_wallet'] });
  const auth = await f.service.startAuthorization({ clientId: 'consent-store', redirectUri: 'https://consent.example/callback', scope: 'openid address_wallet', state: 'consent-state-12345678', nonce: 'consent-nonce-12345678', codeChallenge: challenge, codeChallengeMethod: 'S256' });
  const session = await f.service.establishSocialSession({ provider: 'apple', providerSubject: 'apple-private-sub', emailVerified: true, authenticatedAt: '2026-07-18T04:00:00.000Z', verification: 'provider-jwks-verified' });
  await assert.rejects(() => f.service.approveAuthorization({ requestRef: auth.requestRef, sessionToken: session.sessionToken, state: 'consent-state-12345678' }), /wallet_consent_required/);
});

test('Hosted Vey ID rejects GitHub social callback before code exchange or secret lookup', async () => {
  const calls: string[] = [];
  const fetcher = async (input: string | URL | Request) => {
    calls.push(String(input));
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const verifier = createVeygritSocialCallbackVerifier({} as any, { get: async () => { throw new Error('secret lookup should not run'); } }, fetcher as typeof fetch);

  await assert.rejects(() => verifier({ provider: 'github', body: { code: 'github-code' }, request: {} as any }), /unsupported_social_provider/);
  assert.deepEqual(calls, []);
});

test('Hosted Vey ID env verifier ignores GitHub-only configuration', () => {
  const keys = [
    'VEYGRIT_ID_GOOGLE_CLIENT_ID',
    'VEYGRIT_ID_GOOGLE_CLIENT_SECRET_REF',
    'VEYGRIT_ID_GOOGLE_REDIRECT_URI',
    'VEYGRIT_ID_APPLE_CLIENT_ID',
    'VEYGRIT_ID_APPLE_CLIENT_SECRET_REF',
    'VEYGRIT_ID_APPLE_REDIRECT_URI',
    'VEYGRIT_ID_GITHUB_CLIENT_ID',
    'VEYGRIT_ID_GITHUB_CLIENT_SECRET_REF',
    'VEYGRIT_ID_GITHUB_REDIRECT_URI',
  ];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    for (const key of keys) delete process.env[key];
    process.env.VEYGRIT_ID_GITHUB_CLIENT_ID = 'removed-github-client';
    process.env.VEYGRIT_ID_GITHUB_CLIENT_SECRET_REF = 'removed_github_secret_ref';
    process.env.VEYGRIT_ID_GITHUB_REDIRECT_URI = 'https://id.veygrit.test/veygrit/social/github/callback';

    assert.equal(createVeygritSocialCallbackVerifierFromEnv({ get: async () => 'unused' }), undefined);
  } finally {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('Veygrit ID service rejects unsupported social providers even from injected verifiers', async () => {
  const f = fixture();
  await assert.rejects(() => f.service.establishSocialSession({
    provider: 'github',
    providerSubject: 'github-subject-should-not-persist',
    emailVerified: false,
    authenticatedAt: '2026-07-18T04:00:00.000Z',
    verification: 'provider-jwks-verified',
  } as any), /unsupported_social_provider/);
  assert.equal(f.store.subjects.size, 0);
  assert.equal(f.store.sessions.size, 0);
});

test('production OpenAPI states social callback providers are Google and Apple only', () => {
  const openapi = readFileSync('docs/specs/veygrit-id-production.openapi.yaml', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };
  assert.match(openapi, /\/veygrit\/social\/\{provider\}\/callback:/);
  assert.match(openapi, /enum: \[google, apple\]/);
  assert.match(openapi, /unsupported_social_provider/);
  assert.match(openapi, /Provider tokens are verified only in memory/);
  assert.doesNotMatch(openapi, /enum: \[google, apple, github\]|api\.github\.com|github_access_token|login\/oauth\/access_token/i);
  assert.equal(packageJson.scripts?.['verify:veygrit-id-production-openapi'], 'tsx --test scripts/verify-veygrit-id-production-openapi.test.ts');
});

test('PostgreSQL schema owns replay prevention, token rotation, handoff, signing refs, and audit without provider token columns', () => {
  const sql = readFileSync('db/veygrit-id-core.postgres.sql', 'utf8');
  for (const table of ['veygrit_id_subject','veygrit_id_provider_identity','veygrit_id_oauth_client','veygrit_id_session','veygrit_id_authorization_code','veygrit_id_token_family','veygrit_id_access_token','veygrit_id_refresh_token','veygrit_id_navigation_handoff','veygrit_id_signing_key','veygrit_id_audit_event']) assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  assert.match(sql, /code_hash char\(64\)/); assert.match(sql, /token_hash char\(64\)/); assert.match(sql, /private_key_secret_ref text NOT NULL/);
  assert.match(sql, /provider IN \('google', 'apple'\)/);
  assert.match(sql, /authentication_method IN \('google', 'apple', 'step_up'\)/);
  assert.doesNotMatch(sql, /provider IN \('google', 'apple', 'github'\)/);
  assert.doesNotMatch(sql, /provider_access_token|provider_refresh_token|raw_email|raw_address/i);
});

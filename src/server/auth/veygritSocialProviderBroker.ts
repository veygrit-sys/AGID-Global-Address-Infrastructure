import type { Request } from 'express';

import type { VeygritIdSecretResolver } from './veygritIdRuntime';
import { assertSupportedSocialProvider, verifyAppleIdentityToken, verifyGoogleIdentityToken } from './socialIdentityVerification';
import type { VerifiedSocialIdentity } from './veygritIdService';

type ProviderConfig = { clientId: string; clientSecretRef: string; redirectUri: string };
export type VeygritSocialProviderConfig = { google?: ProviderConfig; apple?: ProviderConfig };

function bodyRecord(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new TypeError('invalid_social_callback_body');
  return body as Record<string, unknown>;
}
function required(value: unknown, name: string) {
  if (typeof value !== 'string' || !value) throw new TypeError(`${name}_required`);
  return value;
}
async function postForm(url: string, values: Record<string, string>, fetcher: typeof fetch) {
  const response = await fetcher(url, { method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(values), signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new TypeError('provider_code_exchange_failed');
  return response.json() as Promise<Record<string, unknown>>;
}

export function createVeygritSocialCallbackVerifier(config: VeygritSocialProviderConfig, secrets: VeygritIdSecretResolver, fetcher: typeof fetch = fetch) {
  return async ({ provider, body }: { provider: string; body: unknown; request: Request }): Promise<VerifiedSocialIdentity> => {
    assertSupportedSocialProvider(provider);
    const providerConfig = config[provider];
    if (!providerConfig) throw new TypeError('social_provider_not_configured');
    const input = bodyRecord(body); const code = required(input.code, 'authorization_code');
    const clientSecret = await secrets.get(providerConfig.clientSecretRef);
    if (provider === 'google') {
      const token = await postForm('https://oauth2.googleapis.com/token', { grant_type: 'authorization_code', code, client_id: providerConfig.clientId, client_secret: clientSecret, redirect_uri: providerConfig.redirectUri, ...(typeof input.code_verifier === 'string' ? { code_verifier: input.code_verifier } : {}) }, fetcher);
      return verifyGoogleIdentityToken(required(token.id_token, 'google_id_token'), providerConfig.clientId);
    }
    if (provider === 'apple') {
      const token = await postForm('https://appleid.apple.com/auth/token', { grant_type: 'authorization_code', code, client_id: providerConfig.clientId, client_secret: clientSecret, redirect_uri: providerConfig.redirectUri }, fetcher);
      return verifyAppleIdentityToken(required(token.id_token, 'apple_id_token'), providerConfig.clientId, typeof input.nonce === 'string' ? input.nonce : undefined);
    }
    throw new TypeError('unsupported_social_provider');
  };
}

function providerConfig(prefix: 'GOOGLE' | 'APPLE'): ProviderConfig | undefined {
  const clientId = process.env[`VEYGRIT_ID_${prefix}_CLIENT_ID`];
  const clientSecretRef = process.env[`VEYGRIT_ID_${prefix}_CLIENT_SECRET_REF`];
  const redirectUri = process.env[`VEYGRIT_ID_${prefix}_REDIRECT_URI`];
  return clientId && clientSecretRef && redirectUri ? { clientId, clientSecretRef, redirectUri } : undefined;
}

export function createVeygritSocialCallbackVerifierFromEnv(secrets: VeygritIdSecretResolver) {
  const config = { google: providerConfig('GOOGLE'), apple: providerConfig('APPLE') };
  if (!config.google && !config.apple) return undefined;
  return createVeygritSocialCallbackVerifier(config, secrets);
}

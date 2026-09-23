import { createRemoteJWKSet, jwtVerify } from 'jose';

import type { SocialProvider, VerifiedSocialIdentity } from './veygritIdService';

const googleJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const appleJwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

function verifiedAt() { return new Date().toISOString(); }
function requiredString(value: unknown, name: string) {
  if (typeof value !== 'string' || !value) throw new TypeError(`${name}_missing`);
  return value;
}

export async function verifyGoogleIdentityToken(idToken: string, clientId: string): Promise<VerifiedSocialIdentity> {
  const { payload } = await jwtVerify(idToken, googleJwks, { issuer: ['https://accounts.google.com', 'accounts.google.com'], audience: clientId, algorithms: ['RS256'] });
  return { provider: 'google', providerSubject: requiredString(payload.sub, 'provider_subject'), email: typeof payload.email === 'string' ? payload.email : undefined, emailVerified: payload.email_verified === true, authenticatedAt: payload.auth_time ? new Date(Number(payload.auth_time) * 1000).toISOString() : verifiedAt(), verification: 'provider-jwks-verified' };
}

export async function verifyAppleIdentityToken(idToken: string, clientId: string, nonce?: string): Promise<VerifiedSocialIdentity> {
  const { payload } = await jwtVerify(idToken, appleJwks, { issuer: 'https://appleid.apple.com', audience: clientId, algorithms: ['RS256'] });
  if (nonce && payload.nonce !== nonce) throw new TypeError('apple_nonce_mismatch');
  return { provider: 'apple', providerSubject: requiredString(payload.sub, 'provider_subject'), email: typeof payload.email === 'string' ? payload.email : undefined, emailVerified: payload.email_verified === true || payload.email_verified === 'true', authenticatedAt: payload.auth_time ? new Date(Number(payload.auth_time) * 1000).toISOString() : verifiedAt(), verification: 'provider-jwks-verified' };
}

export function assertSupportedSocialProvider(value: string): asserts value is SocialProvider {
  if (!['google', 'apple'].includes(value)) throw new TypeError('unsupported_social_provider');
}

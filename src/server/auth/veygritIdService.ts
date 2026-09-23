import {
  createHash,
  createHmac,
  createPrivateKey,
  createPublicKey,
  randomBytes,
  sign,
  timingSafeEqual,
  type KeyObject,
} from 'node:crypto';

export type SocialProvider = 'google' | 'apple';
export type VeygritSurface = 'address-wallet' | 'veygrit-store' | 'veygrit-ship';

export type OAuthClient = {
  clientId: string;
  displayName: string;
  clientType: 'public' | 'confidential';
  sectorIdentifier: string;
  redirectUris: string[];
  allowedOrigins: string[];
  allowedScopes: string[];
  clientSecretHash?: string;
  status: 'active' | 'disabled';
};

export type VerifiedSocialIdentity = {
  provider: SocialProvider;
  providerSubject: string;
  email?: string;
  emailVerified: boolean;
  authenticatedAt: string;
  verification: 'provider-jwks-verified';
};

export type IdentitySubject = { subjectRef: string; status: 'active' | 'locked' | 'closed' };
export type IdentitySession = {
  sessionRef: string;
  sessionTokenHash: string;
  subjectRef: string;
  provider: SocialProvider | 'step_up';
  authTime: string;
  expiresAt: string;
  revokedAt?: string;
};
export type AuthorizationRequest = {
  requestRef: string;
  clientId: string;
  redirectUri: string;
  origin?: string;
  scopes: string[];
  stateHash: string;
  nonceHash: string;
  nonce: string;
  pkceChallenge: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  createdAt: string;
  expiresAt: string;
};
export type AuthorizationCodeRecord = {
  codeRef: string;
  codeHash: string;
  requestRef: string;
  clientId: string;
  pairwiseSubjectAlias: string;
  subjectRef: string;
  sessionRef: string;
  authTime: string;
  redirectUri: string;
  scopes: string[];
  nonce: string;
  pkceChallenge: string;
  walletConsentRef?: string;
  expiresAt: string;
  consumedAt?: string;
};
export type TokenFamily = {
  familyRef: string;
  clientId: string;
  pairwiseSubjectAlias: string;
  subjectRef: string;
  scopes: string[];
  status: 'active' | 'revoked' | 'compromised';
};
export type AccessTokenRecord = { tokenRef: string; tokenHash: string; familyRef: string; issuedAt: string; expiresAt: string; revokedAt?: string };
export type RefreshTokenRecord = { tokenRef: string; tokenHash: string; familyRef: string; rotationCounter: number; issuedAt: string; expiresAt: string; consumedAt?: string; replacedByRef?: string };
export type NavigationHandoffRecord = {
  handoffRef: string;
  tokenHash: string;
  pairwiseSubjectAlias: string;
  source: VeygritSurface;
  target: VeygritSurface;
  returnPath: string;
  expiresAt: string;
  consumedAt?: string;
};

export interface VeygritIdStore {
  getClient(clientId: string): Promise<OAuthClient | undefined>;
  saveClient(client: OAuthClient): Promise<void>;
  saveAuthorizationRequest(request: AuthorizationRequest): Promise<void>;
  getAuthorizationRequest(requestRef: string): Promise<AuthorizationRequest | undefined>;
  updateAuthorizationRequest(request: AuthorizationRequest): Promise<void>;
  findOrCreateSubject(input: { provider: SocialProvider; providerSubjectHash: string; emailHash?: string; emailVerified: boolean; subjectRef: string; authenticatedAt: string }): Promise<IdentitySubject>;
  saveSession(session: IdentitySession): Promise<void>;
  findSessionByTokenHash(tokenHash: string): Promise<IdentitySession | undefined>;
  getOrCreatePairwiseSubject(input: { subjectRef: string; clientId: string; alias: string }): Promise<string>;
  saveAuthorizationCode(code: AuthorizationCodeRecord): Promise<void>;
  consumeAuthorizationCode(codeHash: string, consumedAt: string): Promise<AuthorizationCodeRecord | undefined>;
  saveTokenFamily(family: TokenFamily): Promise<void>;
  getTokenFamily(familyRef: string): Promise<TokenFamily | undefined>;
  updateTokenFamily(family: TokenFamily): Promise<void>;
  saveAccessToken(token: AccessTokenRecord): Promise<void>;
  findAccessToken(tokenHash: string): Promise<AccessTokenRecord | undefined>;
  saveRefreshToken(token: RefreshTokenRecord): Promise<void>;
  consumeRefreshToken(tokenHash: string, consumedAt: string, replacementRef: string): Promise<RefreshTokenRecord | undefined>;
  findRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | undefined>;
  revokeFamily(familyRef: string, status: 'revoked' | 'compromised'): Promise<void>;
  saveNavigationHandoff(handoff: NavigationHandoffRecord): Promise<void>;
  consumeNavigationHandoff(tokenHash: string, consumedAt: string): Promise<NavigationHandoffRecord | undefined>;
  appendAudit(event: { eventRef: string; actorType: 'subject' | 'client' | 'system' | 'admin'; actorRef?: string; action: string; aggregateType: string; aggregateRef: string; outcome: 'success' | 'failure' | 'denied'; requestId?: string; details?: Record<string, unknown>; occurredAt: string }): Promise<void>;
}

export type IdTokenSigner = {
  algorithm: 'EdDSA';
  keyId: string;
  publicJwk: Record<string, unknown>;
  sign(claims: Record<string, unknown>): string;
};

function b64url(value: Buffer | string): string {
  return Buffer.from(value).toString('base64url');
}

export function createEd25519IdTokenSigner(privateKeyPem: string, keyId: string): IdTokenSigner {
  const privateKey: KeyObject = createPrivateKey(privateKeyPem);
  if (privateKey.asymmetricKeyType !== 'ed25519') throw new TypeError('Veygrit ID signing key must be Ed25519.');
  const publicKey = createPublicKey(privateKey);
  const publicJwk = { ...(publicKey.export({ format: 'jwk' }) as Record<string, unknown>), use: 'sig', alg: 'EdDSA', kid: keyId };
  return {
    algorithm: 'EdDSA',
    keyId,
    publicJwk,
    sign(claims) {
      const encodedHeader = b64url(JSON.stringify({ alg: 'EdDSA', typ: 'JWT', kid: keyId }));
      const encodedPayload = b64url(JSON.stringify(claims));
      const signingInput = `${encodedHeader}.${encodedPayload}`;
      const signature = sign(null, Buffer.from(signingInput), privateKey);
      return `${signingInput}.${b64url(signature)}`;
    },
  };
}

function sha256(value: string): string { return createHash('sha256').update(value, 'utf8').digest('hex'); }
function opaque(prefix: string): { ref: string; secret: string; hash: string } {
  const random = randomBytes(32).toString('base64url');
  const secret = `${prefix}_${random}`;
  return { ref: `${prefix}_ref_${randomBytes(18).toString('base64url')}`, secret, hash: sha256(secret) };
}
function safeEqualHex(a: string, b: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(a) || !/^[a-f0-9]{64}$/.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
function normalizeUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) throw new TypeError('https_required');
  url.hash = '';
  return url.toString();
}
function relativePath(value: string): string {
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) throw new TypeError('relative_return_path_required');
  return value;
}
function uniqueScopes(value: string | string[]): string[] {
  const scopes = [...new Set((Array.isArray(value) ? value : value.split(/\s+/)).filter(Boolean))];
  if (!scopes.includes('openid')) throw new TypeError('openid_scope_required');
  return scopes;
}
function epochSeconds(value: string): number { return Math.floor(Date.parse(value) / 1000); }
function isSocialProvider(value: unknown): value is SocialProvider {
  return value === 'google' || value === 'apple';
}

export type VeygritIdServiceOptions = {
  issuer: string;
  pairwiseSubjectSecret: string;
  providerSubjectPepper: string;
  signer: IdTokenSigner;
  now?: () => Date;
  authorizationRequestTtlSeconds?: number;
  authorizationCodeTtlSeconds?: number;
  sessionTtlSeconds?: number;
  accessTokenTtlSeconds?: number;
  refreshTokenTtlSeconds?: number;
  navigationHandoffTtlSeconds?: number;
};

export class VeygritIdService {
  private readonly now: () => Date;
  private readonly issuer: string;
  constructor(private readonly store: VeygritIdStore, private readonly options: VeygritIdServiceOptions) {
    this.now = options.now ?? (() => new Date());
    this.issuer = normalizeUrl(options.issuer).replace(/\/$/, '');
    if (options.pairwiseSubjectSecret.length < 32 || options.providerSubjectPepper.length < 32) throw new TypeError('identity_peppers_must_be_at_least_32_characters');
  }

  discovery() {
    return {
      issuer: this.issuer,
      authorization_endpoint: `${this.issuer}/veygrit/oauth/authorize`,
      token_endpoint: `${this.issuer}/veygrit/oauth/token`,
      userinfo_endpoint: `${this.issuer}/veygrit/oauth/userinfo`,
      revocation_endpoint: `${this.issuer}/veygrit/oauth/revoke`,
      introspection_endpoint: `${this.issuer}/veygrit/oauth/introspect`,
      jwks_uri: `${this.issuer}/.well-known/jwks.json`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      subject_types_supported: ['pairwise'],
      id_token_signing_alg_values_supported: ['EdDSA'],
      code_challenge_methods_supported: ['S256'],
      scopes_supported: ['openid', 'profile', 'address_wallet', 'friend_delivery:request'],
    };
  }

  jwks() { return { keys: [this.options.signer.publicJwk] }; }

  async registerClient(input: Omit<OAuthClient, 'status'> & { status?: OAuthClient['status'] }): Promise<void> {
    const redirectUris = input.redirectUris.map(normalizeUrl);
    const allowedOrigins = input.allowedOrigins.map(origin => new URL(normalizeUrl(origin)).origin);
    if (!input.clientId || !input.displayName || !input.sectorIdentifier || !redirectUris.length) throw new TypeError('invalid_client_registration');
    if (input.clientType === 'confidential' && !input.clientSecretHash) throw new TypeError('confidential_client_secret_hash_required');
    await this.store.saveClient({ ...input, redirectUris, allowedOrigins, allowedScopes: [...new Set(input.allowedScopes)], status: input.status ?? 'active' });
  }

  async startAuthorization(input: { clientId: string; redirectUri: string; origin?: string; scope: string | string[]; state: string; nonce: string; codeChallenge: string; codeChallengeMethod: 'S256'; requestId?: string }) {
    const client = await this.store.getClient(input.clientId);
    if (!client || client.status !== 'active') throw new TypeError('invalid_client');
    const redirectUri = normalizeUrl(input.redirectUri);
    if (!client.redirectUris.includes(redirectUri)) throw new TypeError('redirect_uri_not_allowed');
    if (input.origin) {
      const origin = new URL(normalizeUrl(input.origin)).origin;
      if (!client.allowedOrigins.includes(origin)) throw new TypeError('origin_not_allowed');
    }
    const scopes = uniqueScopes(input.scope);
    if (scopes.some(scope => !client.allowedScopes.includes(scope))) throw new TypeError('scope_not_allowed');
    if (input.state.length < 16 || input.nonce.length < 16) throw new TypeError('state_and_nonce_too_short');
    if (input.codeChallengeMethod !== 'S256' || !/^[A-Za-z0-9_-]{43,128}$/.test(input.codeChallenge)) throw new TypeError('pkce_s256_required');
    const now = this.now();
    const requestRef = `vey_auth_req_${randomBytes(24).toString('base64url')}`;
    const request: AuthorizationRequest = {
      requestRef, clientId: client.clientId, redirectUri, origin: input.origin ? new URL(input.origin).origin : undefined,
      scopes, stateHash: sha256(input.state), nonceHash: sha256(input.nonce), nonce: input.nonce, pkceChallenge: input.codeChallenge,
      status: 'pending', createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + (this.options.authorizationRequestTtlSeconds ?? 600) * 1000).toISOString(),
    };
    await this.store.saveAuthorizationRequest(request);
    await this.audit('client', client.clientId, 'authorization.started', 'authorization_request', requestRef, 'success', input.requestId, { scopes });
    return { requestRef, continueUrl: `${this.issuer}/veygrit/login?request_ref=${encodeURIComponent(requestRef)}`, expiresAt: request.expiresAt };
  }

  async establishSocialSession(identity: VerifiedSocialIdentity, requestId?: string) {
    if (!isSocialProvider(identity.provider)) throw new TypeError('unsupported_social_provider');
    if (identity.verification !== 'provider-jwks-verified') throw new TypeError('unverified_social_identity');
    if (!identity.providerSubject || !Number.isFinite(Date.parse(identity.authenticatedAt))) throw new TypeError('invalid_social_identity');
    const providerSubjectHash = createHmac('sha256', this.options.providerSubjectPepper).update(`${identity.provider}\0${identity.providerSubject}`).digest('hex');
    const emailHash = identity.email ? createHmac('sha256', this.options.providerSubjectPepper).update(identity.email.trim().toLowerCase()).digest('hex') : undefined;
    const subject = await this.store.findOrCreateSubject({ provider: identity.provider, providerSubjectHash, emailHash, emailVerified: identity.emailVerified, subjectRef: `vey_subject_${randomBytes(24).toString('base64url')}`, authenticatedAt: identity.authenticatedAt });
    if (subject.status !== 'active') throw new TypeError('subject_not_active');
    const token = opaque('vey_session');
    const authTime = new Date(identity.authenticatedAt);
    const session: IdentitySession = { sessionRef: token.ref.replace('_ref_', '_'), sessionTokenHash: token.hash, subjectRef: subject.subjectRef, provider: identity.provider, authTime: authTime.toISOString(), expiresAt: new Date(this.now().getTime() + (this.options.sessionTtlSeconds ?? 43_200) * 1000).toISOString() };
    await this.store.saveSession(session);
    await this.audit('subject', subject.subjectRef, 'session.created', 'session', session.sessionRef, 'success', requestId, { provider: identity.provider });
    return { sessionRef: session.sessionRef, sessionToken: token.secret, expiresAt: session.expiresAt, provider: identity.provider };
  }

  async verifyAuthorizationRequestState(requestRef: string, state: string) {
    const request = await this.store.getAuthorizationRequest(requestRef);
    if (!request || request.status !== 'pending' || Date.parse(request.expiresAt) <= this.now().getTime()) throw new TypeError('authorization_request_not_pending');
    if (!safeEqualHex(request.stateHash, sha256(state))) throw new TypeError('state_mismatch');
    return { clientId: request.clientId, requestRef: request.requestRef };
  }

  async approveAuthorization(input: { requestRef: string; sessionToken: string; state: string; walletConsentRef?: string; requestId?: string }) {
    const request = await this.store.getAuthorizationRequest(input.requestRef);
    if (!request || request.status !== 'pending') throw new TypeError('authorization_request_not_pending');
    if (Date.parse(request.expiresAt) <= this.now().getTime()) throw new TypeError('authorization_request_expired');
    if (!safeEqualHex(request.stateHash, sha256(input.state))) throw new TypeError('state_mismatch');
    const session = await this.store.findSessionByTokenHash(sha256(input.sessionToken));
    if (!session || session.revokedAt || Date.parse(session.expiresAt) <= this.now().getTime()) throw new TypeError('session_invalid');
    const client = await this.store.getClient(request.clientId);
    if (!client) throw new TypeError('client_not_found');
    if (request.scopes.some(scope => scope === 'address_wallet' || scope === 'friend_delivery:request') && !input.walletConsentRef) throw new TypeError('wallet_consent_required');
    const digest = createHmac('sha256', this.options.pairwiseSubjectSecret).update(`${session.subjectRef}\0${client.sectorIdentifier}`).digest('base64url');
    const pairwiseSubjectAlias = await this.store.getOrCreatePairwiseSubject({ subjectRef: session.subjectRef, clientId: client.clientId, alias: `pairwise_${digest}` });
    const code = opaque('vey_code');
    const now = this.now();
    await this.store.saveAuthorizationCode({ codeRef: code.ref, codeHash: code.hash, requestRef: request.requestRef, clientId: client.clientId, pairwiseSubjectAlias, subjectRef: session.subjectRef, sessionRef: session.sessionRef, authTime: session.authTime, redirectUri: request.redirectUri, scopes: request.scopes, nonce: request.nonce, pkceChallenge: request.pkceChallenge, walletConsentRef: input.walletConsentRef, expiresAt: new Date(now.getTime() + (this.options.authorizationCodeTtlSeconds ?? 120) * 1000).toISOString() });
    await this.store.updateAuthorizationRequest({ ...request, status: 'approved' });
    await this.audit('subject', session.subjectRef, 'authorization.approved', 'authorization_request', request.requestRef, 'success', input.requestId, { clientId: client.clientId });
    const callback = new URL(request.redirectUri); callback.searchParams.set('code', code.secret); callback.searchParams.set('state', input.state);
    return { redirectUri: callback.toString(), authorizationCode: code.secret, expiresIn: this.options.authorizationCodeTtlSeconds ?? 120 };
  }

  async exchangeAuthorizationCode(input: { code: string; clientId: string; redirectUri: string; codeVerifier: string; clientSecret?: string; requestId?: string }) {
    await this.authenticateClient(input.clientId, input.clientSecret);
    if (!/^[A-Za-z0-9._~-]{43,128}$/.test(input.codeVerifier)) throw new TypeError('invalid_code_verifier');
    const expectedChallenge = createHash('sha256').update(input.codeVerifier).digest('base64url');
    const record = await this.store.consumeAuthorizationCode(sha256(input.code), this.now().toISOString());
    if (!record) throw new TypeError('invalid_or_replayed_authorization_code');
    if (record.clientId !== input.clientId || record.redirectUri !== normalizeUrl(input.redirectUri) || record.pkceChallenge !== expectedChallenge || Date.parse(record.expiresAt) <= this.now().getTime()) {
      await this.audit('client', input.clientId, 'token.exchange', 'authorization_code', record.codeRef, 'denied', input.requestId);
      throw new TypeError('authorization_code_binding_failed');
    }
    return this.issueTokenFamily(record, input.requestId);
  }

  private async issueTokenFamily(record: AuthorizationCodeRecord, requestId?: string) {
    const now = this.now();
    const family: TokenFamily = { familyRef: `vey_token_family_${randomBytes(24).toString('base64url')}`, clientId: record.clientId, pairwiseSubjectAlias: record.pairwiseSubjectAlias, subjectRef: record.subjectRef, scopes: record.scopes, status: 'active' };
    const access = opaque('vey_access'); const refresh = opaque('vey_refresh');
    const accessExpiresAt = new Date(now.getTime() + (this.options.accessTokenTtlSeconds ?? 900) * 1000).toISOString();
    const refreshExpiresAt = new Date(now.getTime() + (this.options.refreshTokenTtlSeconds ?? 2_592_000) * 1000).toISOString();
    await this.store.saveTokenFamily(family);
    await this.store.saveAccessToken({ tokenRef: access.ref, tokenHash: access.hash, familyRef: family.familyRef, issuedAt: now.toISOString(), expiresAt: accessExpiresAt });
    await this.store.saveRefreshToken({ tokenRef: refresh.ref, tokenHash: refresh.hash, familyRef: family.familyRef, rotationCounter: 0, issuedAt: now.toISOString(), expiresAt: refreshExpiresAt });
    const idToken = this.options.signer.sign({ iss: this.issuer, sub: family.pairwiseSubjectAlias, aud: family.clientId, iat: epochSeconds(now.toISOString()), exp: epochSeconds(accessExpiresAt), auth_time: epochSeconds(record.authTime), nonce: record.nonce, sid: record.sessionRef, address_wallet_linked: Boolean(record.walletConsentRef) });
    await this.audit('client', family.clientId, 'token.issued', 'token_family', family.familyRef, 'success', requestId, { scopes: family.scopes });
    return { token_type: 'Bearer', access_token: access.secret, expires_in: this.options.accessTokenTtlSeconds ?? 900, refresh_token: refresh.secret, refresh_expires_in: this.options.refreshTokenTtlSeconds ?? 2_592_000, id_token: idToken, scope: family.scopes.join(' ') };
  }

  async refresh(input: { refreshToken: string; clientId: string; clientSecret?: string; requestId?: string }) {
    await this.authenticateClient(input.clientId, input.clientSecret);
    const tokenHash = sha256(input.refreshToken);
    const existing = await this.store.findRefreshToken(tokenHash);
    if (!existing) throw new TypeError('invalid_refresh_token');
    const family = await this.store.getTokenFamily(existing.familyRef);
    if (!family || family.clientId !== input.clientId || family.status !== 'active' || Date.parse(existing.expiresAt) <= this.now().getTime()) throw new TypeError('refresh_token_inactive');
    if (existing.consumedAt) {
      await this.store.revokeFamily(family.familyRef, 'compromised');
      await this.audit('client', input.clientId, 'refresh.reuse_detected', 'token_family', family.familyRef, 'denied', input.requestId);
      throw new TypeError('refresh_token_reuse_detected');
    }
    const replacement = opaque('vey_refresh');
    const consumed = await this.store.consumeRefreshToken(tokenHash, this.now().toISOString(), replacement.ref);
    if (!consumed) {
      await this.store.revokeFamily(family.familyRef, 'compromised');
      await this.audit('client', input.clientId, 'refresh.replay_race', 'token_family', family.familyRef, 'denied', input.requestId);
      throw new TypeError('refresh_token_replay_race');
    }
    const access = opaque('vey_access'); const now = this.now();
    const accessExpiresAt = new Date(now.getTime() + (this.options.accessTokenTtlSeconds ?? 900) * 1000).toISOString();
    const refreshExpiresAt = new Date(now.getTime() + (this.options.refreshTokenTtlSeconds ?? 2_592_000) * 1000).toISOString();
    await this.store.saveAccessToken({ tokenRef: access.ref, tokenHash: access.hash, familyRef: family.familyRef, issuedAt: now.toISOString(), expiresAt: accessExpiresAt });
    await this.store.saveRefreshToken({ tokenRef: replacement.ref, tokenHash: replacement.hash, familyRef: family.familyRef, rotationCounter: consumed.rotationCounter + 1, issuedAt: now.toISOString(), expiresAt: refreshExpiresAt });
    await this.audit('client', input.clientId, 'refresh.rotated', 'token_family', family.familyRef, 'success', input.requestId, { rotationCounter: consumed.rotationCounter + 1 });
    return { token_type: 'Bearer', access_token: access.secret, expires_in: this.options.accessTokenTtlSeconds ?? 900, refresh_token: replacement.secret, refresh_expires_in: this.options.refreshTokenTtlSeconds ?? 2_592_000, scope: family.scopes.join(' ') };
  }

  async introspect(accessToken: string) {
    const token = await this.store.findAccessToken(sha256(accessToken));
    if (!token || token.revokedAt || Date.parse(token.expiresAt) <= this.now().getTime()) return { active: false };
    const family = await this.store.getTokenFamily(token.familyRef);
    if (!family || family.status !== 'active') return { active: false };
    return { active: true, client_id: family.clientId, sub: family.pairwiseSubjectAlias, scope: family.scopes.join(' '), exp: epochSeconds(token.expiresAt), token_type: 'Bearer' };
  }

  async introspectForClient(accessToken: string, clientId: string, clientSecret?: string) {
    await this.authenticateClient(clientId, clientSecret);
    const result = await this.introspect(accessToken);
    return result.active && result.client_id !== clientId ? { active: false as const } : result;
  }

  async revoke(token: string, requestId?: string) {
    const tokenHash = sha256(token);
    const access = await this.store.findAccessToken(tokenHash);
    const refresh = access ? undefined : await this.store.findRefreshToken(tokenHash);
    const familyRef = access?.familyRef ?? refresh?.familyRef;
    if (familyRef) await this.store.revokeFamily(familyRef, 'revoked');
    await this.audit('system', undefined, 'token.revoked', 'token_family', familyRef ?? 'unknown', 'success', requestId);
    return { revoked: true };
  }

  async revokeForClient(token: string, clientId: string, clientSecret?: string, requestId?: string) {
    await this.authenticateClient(clientId, clientSecret);
    const tokenHash = sha256(token);
    const access = await this.store.findAccessToken(tokenHash);
    const refresh = access ? undefined : await this.store.findRefreshToken(tokenHash);
    const familyRef = access?.familyRef ?? refresh?.familyRef;
    if (familyRef) {
      const family = await this.store.getTokenFamily(familyRef);
      if (family?.clientId === clientId) await this.store.revokeFamily(familyRef, 'revoked');
    }
    await this.audit('client', clientId, 'token.revoked', 'token_family', familyRef ?? 'unknown', 'success', requestId);
    return { revoked: true };
  }

  async createNavigationHandoff(input: { accessToken: string; source: VeygritSurface; target: VeygritSurface; returnPath: string; requestId?: string }) {
    if (input.source === input.target) throw new TypeError('source_and_target_must_differ');
    const claims = await this.introspect(input.accessToken);
    if (!claims.active || !claims.sub) throw new TypeError('access_token_invalid');
    const handoff = opaque('nav_handoff'); const now = this.now();
    const record: NavigationHandoffRecord = { handoffRef: handoff.ref, tokenHash: handoff.hash, pairwiseSubjectAlias: claims.sub, source: input.source, target: input.target, returnPath: relativePath(input.returnPath), expiresAt: new Date(now.getTime() + (this.options.navigationHandoffTtlSeconds ?? 120) * 1000).toISOString() };
    await this.store.saveNavigationHandoff(record);
    await this.audit('subject', claims.sub, 'navigation_handoff.created', 'navigation_handoff', record.handoffRef, 'success', input.requestId, { source: input.source, target: input.target });
    return { handoffToken: handoff.secret, expiresAt: record.expiresAt, target: record.target };
  }

  async consumeNavigationHandoff(handoffToken: string, requestId?: string) {
    const record = await this.store.consumeNavigationHandoff(sha256(handoffToken), this.now().toISOString());
    if (!record || Date.parse(record.expiresAt) <= this.now().getTime()) throw new TypeError('navigation_handoff_invalid_or_replayed');
    await this.audit('subject', record.pairwiseSubjectAlias, 'navigation_handoff.consumed', 'navigation_handoff', record.handoffRef, 'success', requestId);
    return { pairwiseSubjectAlias: record.pairwiseSubjectAlias, source: record.source, target: record.target, returnPath: record.returnPath };
  }

  private async authenticateClient(clientId: string, clientSecret?: string) {
    const client = await this.store.getClient(clientId);
    if (!client || client.status !== 'active') throw new TypeError('invalid_client');
    if (client.clientType === 'confidential') {
      if (!clientSecret || !client.clientSecretHash || !safeEqualHex(client.clientSecretHash, sha256(clientSecret))) throw new TypeError('client_authentication_failed');
    }
    return client;
  }

  private audit(actorType: 'subject' | 'client' | 'system' | 'admin', actorRef: string | undefined, action: string, aggregateType: string, aggregateRef: string, outcome: 'success' | 'failure' | 'denied', requestId?: string, details?: Record<string, unknown>) {
    return this.store.appendAudit({ eventRef: `vey_audit_${randomBytes(18).toString('base64url')}`, actorType, actorRef, action, aggregateType, aggregateRef, outcome, requestId, details, occurredAt: this.now().toISOString() });
  }
}

export class InMemoryVeygritIdStore implements VeygritIdStore {
  readonly clients = new Map<string, OAuthClient>(); readonly requests = new Map<string, AuthorizationRequest>(); readonly subjects = new Map<string, IdentitySubject>(); readonly identities = new Map<string, string>(); readonly sessions = new Map<string, IdentitySession>(); readonly pairwise = new Map<string, string>(); readonly codes = new Map<string, AuthorizationCodeRecord>(); readonly families = new Map<string, TokenFamily>(); readonly access = new Map<string, AccessTokenRecord>(); readonly refreshTokens = new Map<string, RefreshTokenRecord>(); readonly handoffs = new Map<string, NavigationHandoffRecord>(); readonly audits: Array<Record<string, unknown>> = [];
  async getClient(id: string) { return this.clients.get(id); } async saveClient(v: OAuthClient) { this.clients.set(v.clientId, v); }
  async saveAuthorizationRequest(v: AuthorizationRequest) { this.requests.set(v.requestRef, v); } async getAuthorizationRequest(id: string) { return this.requests.get(id); } async updateAuthorizationRequest(v: AuthorizationRequest) { this.requests.set(v.requestRef, v); }
  async findOrCreateSubject(v: { provider: SocialProvider; providerSubjectHash: string; subjectRef: string }) { const key = `${v.provider}:${v.providerSubjectHash}`; const found = this.identities.get(key); if (found) return this.subjects.get(found)!; const subject = { subjectRef: v.subjectRef, status: 'active' as const }; this.subjects.set(v.subjectRef, subject); this.identities.set(key, v.subjectRef); return subject; }
  async saveSession(v: IdentitySession) { this.sessions.set(v.sessionTokenHash, v); } async findSessionByTokenHash(h: string) { return this.sessions.get(h); }
  async getOrCreatePairwiseSubject(v: { subjectRef: string; clientId: string; alias: string }) { const key = `${v.subjectRef}:${v.clientId}`; const found = this.pairwise.get(key); if (found) return found; this.pairwise.set(key, v.alias); return v.alias; }
  async saveAuthorizationCode(v: AuthorizationCodeRecord) { this.codes.set(v.codeHash, v); } async consumeAuthorizationCode(h: string, at: string) { const v = this.codes.get(h); if (!v || v.consumedAt) return undefined; v.consumedAt = at; return { ...v }; }
  async saveTokenFamily(v: TokenFamily) { this.families.set(v.familyRef, v); } async getTokenFamily(r: string) { return this.families.get(r); } async updateTokenFamily(v: TokenFamily) { this.families.set(v.familyRef, v); }
  async saveAccessToken(v: AccessTokenRecord) { this.access.set(v.tokenHash, v); } async findAccessToken(h: string) { return this.access.get(h); }
  async saveRefreshToken(v: RefreshTokenRecord) { this.refreshTokens.set(v.tokenHash, v); } async findRefreshToken(h: string) { return this.refreshTokens.get(h); } async consumeRefreshToken(h: string, at: string, ref: string) { const v = this.refreshTokens.get(h); if (!v || v.consumedAt) return undefined; v.consumedAt = at; v.replacedByRef = ref; return { ...v }; }
  async revokeFamily(r: string, status: 'revoked' | 'compromised') { const v = this.families.get(r); if (v) this.families.set(r, { ...v, status }); }
  async saveNavigationHandoff(v: NavigationHandoffRecord) { this.handoffs.set(v.tokenHash, v); } async consumeNavigationHandoff(h: string, at: string) { const v = this.handoffs.get(h); if (!v || v.consumedAt) return undefined; v.consumedAt = at; return { ...v }; }
  async appendAudit(v: Record<string, unknown>) { this.audits.push(v); }
}

export const hashVeygritClientSecret = sha256;

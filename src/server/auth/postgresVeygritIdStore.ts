import type { SqlClient, SqlPool } from '../shipping/veygritShipStore';
import type {
  AccessTokenRecord,
  AuthorizationCodeRecord,
  AuthorizationRequest,
  IdentitySession,
  IdentitySubject,
  NavigationHandoffRecord,
  OAuthClient,
  RefreshTokenRecord,
  SocialProvider,
  TokenFamily,
  VeygritIdStore,
} from './veygritIdService';

async function transaction<T>(pool: SqlPool, work: (client: SqlClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try { await client.query('BEGIN'); const result = await work(client); await client.query('COMMIT'); return result; }
  catch (error) { try { await client.query('ROLLBACK'); } catch { /* preserve original */ } throw error; }
  finally { client.release(); }
}

function clientFromRow(row: any): OAuthClient {
  return { clientId: row.client_ref, displayName: row.display_name, clientType: row.client_type, sectorIdentifier: row.sector_identifier, redirectUris: row.redirect_uris, allowedOrigins: row.allowed_origins, allowedScopes: row.allowed_scopes, clientSecretHash: row.client_secret_hash ?? undefined, status: row.status };
}
function requestFromRow(row: any): AuthorizationRequest {
  return { requestRef: row.request_ref, clientId: row.client_ref, redirectUri: row.redirect_uri, origin: row.origin ?? undefined, scopes: row.scope, stateHash: row.state_hash, nonceHash: row.nonce_hash, nonce: row.nonce_value, pkceChallenge: row.pkce_challenge, status: row.status, createdAt: new Date(row.created_at).toISOString(), expiresAt: new Date(row.expires_at).toISOString() };
}

export class PostgresVeygritIdStore implements VeygritIdStore {
  constructor(private readonly pool: SqlPool) {}
  async close() { await this.pool.end?.(); }

  async getClient(clientId: string) {
    const result = await this.pool.query(`SELECT * FROM veygrit_id_oauth_client WHERE client_ref=$1`, [clientId]);
    return result.rows[0] ? clientFromRow(result.rows[0]) : undefined;
  }
  async saveClient(client: OAuthClient) {
    await this.pool.query(
      `INSERT INTO veygrit_id_oauth_client (client_ref,display_name,client_type,sector_identifier,redirect_uris,allowed_origins,allowed_scopes,client_secret_hash,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (client_ref) DO UPDATE SET display_name=EXCLUDED.display_name,client_type=EXCLUDED.client_type,sector_identifier=EXCLUDED.sector_identifier,redirect_uris=EXCLUDED.redirect_uris,allowed_origins=EXCLUDED.allowed_origins,allowed_scopes=EXCLUDED.allowed_scopes,client_secret_hash=EXCLUDED.client_secret_hash,status=EXCLUDED.status,updated_at=now()`,
      [client.clientId, client.displayName, client.clientType, client.sectorIdentifier, client.redirectUris, client.allowedOrigins, client.allowedScopes, client.clientSecretHash ?? null, client.status],
    );
  }
  async saveAuthorizationRequest(request: AuthorizationRequest) {
    await this.pool.query(
      `INSERT INTO veygrit_id_authorization_request (request_ref,client_id,redirect_uri,origin,scope,state_hash,nonce_hash,nonce_value,pkce_challenge,pkce_method,status,created_at,expires_at)
       SELECT $1,id,$3,$4,$5,$6,$7,$8,$9,'S256',$10,$11,$12 FROM veygrit_id_oauth_client WHERE client_ref=$2`,
      [request.requestRef, request.clientId, request.redirectUri, request.origin ?? null, request.scopes, request.stateHash, request.nonceHash, request.nonce, request.pkceChallenge, request.status, request.createdAt, request.expiresAt],
    );
  }
  async getAuthorizationRequest(requestRef: string) {
    const result = await this.pool.query(`SELECT r.*,c.client_ref FROM veygrit_id_authorization_request r JOIN veygrit_id_oauth_client c ON c.id=r.client_id WHERE r.request_ref=$1`, [requestRef]);
    return result.rows[0] ? requestFromRow(result.rows[0]) : undefined;
  }
  async updateAuthorizationRequest(request: AuthorizationRequest) {
    await this.pool.query(`UPDATE veygrit_id_authorization_request SET status=$2,completed_at=CASE WHEN $2 IN ('approved','denied') THEN now() ELSE completed_at END WHERE request_ref=$1`, [request.requestRef, request.status]);
  }

  async findOrCreateSubject(input: { provider: SocialProvider; providerSubjectHash: string; emailHash?: string; emailVerified: boolean; subjectRef: string; authenticatedAt: string }): Promise<IdentitySubject> {
    return transaction(this.pool, async client => {
      const found = await client.query(`SELECT s.subject_ref,s.status FROM veygrit_id_provider_identity p JOIN veygrit_id_subject s ON s.id=p.subject_id WHERE p.provider=$1 AND p.provider_subject_hash=$2 FOR UPDATE`, [input.provider, input.providerSubjectHash]);
      if (found.rows[0]) {
        await client.query(`UPDATE veygrit_id_provider_identity SET last_authenticated_at=$3,email_verified=email_verified OR $4 WHERE provider=$1 AND provider_subject_hash=$2`, [input.provider, input.providerSubjectHash, input.authenticatedAt, input.emailVerified]);
        return { subjectRef: String(found.rows[0].subject_ref), status: found.rows[0].status as IdentitySubject['status'] };
      }
      const subject = await client.query<{ id: string }>(`INSERT INTO veygrit_id_subject (subject_ref) VALUES ($1) RETURNING id`, [input.subjectRef]);
      await client.query(`INSERT INTO veygrit_id_provider_identity (subject_id,provider,provider_subject_hash,email_hash,email_verified,last_authenticated_at) VALUES ($1,$2,$3,$4,$5,$6)`, [subject.rows[0].id, input.provider, input.providerSubjectHash, input.emailHash ?? null, input.emailVerified, input.authenticatedAt]);
      return { subjectRef: input.subjectRef, status: 'active' };
    });
  }
  async saveSession(session: IdentitySession) {
    await this.pool.query(
      `INSERT INTO veygrit_id_session (session_ref,session_token_hash,subject_id,authentication_method,auth_time,expires_at)
       SELECT $1,$2,id,$4,$5,$6 FROM veygrit_id_subject WHERE subject_ref=$3`,
      [session.sessionRef, session.sessionTokenHash, session.subjectRef, session.provider, session.authTime, session.expiresAt],
    );
  }
  async findSessionByTokenHash(tokenHash: string) {
    const result = await this.pool.query(
      `SELECT se.*,s.subject_ref FROM veygrit_id_session se JOIN veygrit_id_subject s ON s.id=se.subject_id WHERE se.session_token_hash=$1`, [tokenHash],
    );
    const row: any = result.rows[0];
    return row ? { sessionRef: row.session_ref, sessionTokenHash: row.session_token_hash, subjectRef: row.subject_ref, provider: row.authentication_method, authTime: new Date(row.auth_time).toISOString(), expiresAt: new Date(row.expires_at).toISOString(), revokedAt: row.revoked_at ? new Date(row.revoked_at).toISOString() : undefined } as IdentitySession : undefined;
  }
  async getOrCreatePairwiseSubject(input: { subjectRef: string; clientId: string; alias: string }) {
    const result = await this.pool.query<{ pairwise_subject_alias: string }>(
      `INSERT INTO veygrit_id_pairwise_subject (subject_id,client_id,pairwise_subject_alias)
       SELECT s.id,c.id,$3 FROM veygrit_id_subject s CROSS JOIN veygrit_id_oauth_client c WHERE s.subject_ref=$1 AND c.client_ref=$2
       ON CONFLICT (subject_id,client_id) DO UPDATE SET status='active',revoked_at=NULL
       RETURNING pairwise_subject_alias`, [input.subjectRef, input.clientId, input.alias],
    );
    if (!result.rows[0]) throw new Error('pairwise_subject_owner_not_found');
    return result.rows[0].pairwise_subject_alias;
  }
  async saveAuthorizationCode(code: AuthorizationCodeRecord) {
    await this.pool.query(
      `INSERT INTO veygrit_id_authorization_code (code_ref,code_hash,request_id,pairwise_subject_id,session_id,wallet_consent_ref,expires_at)
       SELECT $1,$2,r.id,p.id,se.id,$7,$8 FROM veygrit_id_authorization_request r
       JOIN veygrit_id_pairwise_subject p ON p.pairwise_subject_alias=$4
       JOIN veygrit_id_session se ON se.session_ref=$6 WHERE r.request_ref=$3`,
      [code.codeRef, code.codeHash, code.requestRef, code.pairwiseSubjectAlias, code.subjectRef, code.sessionRef, code.walletConsentRef ?? null, code.expiresAt],
    );
  }
  async consumeAuthorizationCode(codeHash: string, consumedAt: string) {
    return transaction(this.pool, async client => {
      const result = await client.query(
        `UPDATE veygrit_id_authorization_code SET consumed_at=$2 WHERE code_hash=$1 AND consumed_at IS NULL RETURNING request_id,pairwise_subject_id,session_id,code_ref,wallet_consent_ref,expires_at`, [codeHash, consumedAt],
      );
      const row: any = result.rows[0]; if (!row) return undefined;
      const context = await client.query(
        `SELECT r.request_ref,c.client_ref,r.redirect_uri,r.scope,r.nonce_value,r.pkce_challenge,p.pairwise_subject_alias,s.subject_ref,se.session_ref,se.auth_time
         FROM veygrit_id_authorization_request r JOIN veygrit_id_oauth_client c ON c.id=r.client_id
         JOIN veygrit_id_pairwise_subject p ON p.id=$2 JOIN veygrit_id_subject s ON s.id=p.subject_id
         JOIN veygrit_id_session se ON se.id=$3 WHERE r.id=$1`, [row.request_id, row.pairwise_subject_id, row.session_id],
      );
      const c: any = context.rows[0];
      return { codeRef: row.code_ref, codeHash, requestRef: c.request_ref, clientId: c.client_ref, pairwiseSubjectAlias: c.pairwise_subject_alias, subjectRef: c.subject_ref, sessionRef: c.session_ref, authTime: new Date(c.auth_time).toISOString(), redirectUri: c.redirect_uri, scopes: c.scope, nonce: c.nonce_value, pkceChallenge: c.pkce_challenge, walletConsentRef: row.wallet_consent_ref ?? undefined, expiresAt: new Date(row.expires_at).toISOString(), consumedAt } as AuthorizationCodeRecord;
    });
  }
  async saveTokenFamily(family: TokenFamily) {
    await this.pool.query(
      `INSERT INTO veygrit_id_token_family (family_ref,pairwise_subject_id,client_id,granted_scopes,status)
       SELECT $1,p.id,c.id,$4,$5 FROM veygrit_id_pairwise_subject p CROSS JOIN veygrit_id_oauth_client c WHERE p.pairwise_subject_alias=$2 AND c.client_ref=$3`,
      [family.familyRef, family.pairwiseSubjectAlias, family.clientId, family.scopes, family.status],
    );
  }
  async getTokenFamily(familyRef: string) {
    const result = await this.pool.query(
      `SELECT f.*,c.client_ref,p.pairwise_subject_alias,s.subject_ref FROM veygrit_id_token_family f JOIN veygrit_id_oauth_client c ON c.id=f.client_id JOIN veygrit_id_pairwise_subject p ON p.id=f.pairwise_subject_id JOIN veygrit_id_subject s ON s.id=p.subject_id WHERE f.family_ref=$1`, [familyRef],
    );
    const r: any = result.rows[0]; return r ? { familyRef: r.family_ref, clientId: r.client_ref, pairwiseSubjectAlias: r.pairwise_subject_alias, subjectRef: r.subject_ref, scopes: r.granted_scopes, status: r.status } as TokenFamily : undefined;
  }
  async updateTokenFamily(family: TokenFamily) { await this.pool.query(`UPDATE veygrit_id_token_family SET status=$2,revoked_at=CASE WHEN $2='active' THEN NULL ELSE now() END WHERE family_ref=$1`, [family.familyRef, family.status]); }
  async saveAccessToken(token: AccessTokenRecord) { await this.pool.query(`INSERT INTO veygrit_id_access_token (token_ref,token_hash,family_id,issued_at,expires_at) SELECT $1,$2,id,$4,$5 FROM veygrit_id_token_family WHERE family_ref=$3`, [token.tokenRef, token.tokenHash, token.familyRef, token.issuedAt, token.expiresAt]); }
  async findAccessToken(tokenHash: string) {
    const result = await this.pool.query(`SELECT t.*,f.family_ref FROM veygrit_id_access_token t JOIN veygrit_id_token_family f ON f.id=t.family_id WHERE t.token_hash=$1`, [tokenHash]);
    const r: any = result.rows[0]; return r ? { tokenRef: r.token_ref, tokenHash: r.token_hash, familyRef: r.family_ref, issuedAt: new Date(r.issued_at).toISOString(), expiresAt: new Date(r.expires_at).toISOString(), revokedAt: r.revoked_at ? new Date(r.revoked_at).toISOString() : undefined } as AccessTokenRecord : undefined;
  }
  async saveRefreshToken(token: RefreshTokenRecord) { await this.pool.query(`INSERT INTO veygrit_id_refresh_token (token_ref,token_hash,family_id,rotation_counter,issued_at,expires_at) SELECT $1,$2,id,$4,$5,$6 FROM veygrit_id_token_family WHERE family_ref=$3`, [token.tokenRef, token.tokenHash, token.familyRef, token.rotationCounter, token.issuedAt, token.expiresAt]); }
  async findRefreshToken(tokenHash: string) {
    const result = await this.pool.query(`SELECT t.*,f.family_ref FROM veygrit_id_refresh_token t JOIN veygrit_id_token_family f ON f.id=t.family_id WHERE t.token_hash=$1`, [tokenHash]);
    const r: any = result.rows[0]; return r ? { tokenRef: r.token_ref, tokenHash: r.token_hash, familyRef: r.family_ref, rotationCounter: r.rotation_counter, issuedAt: new Date(r.issued_at).toISOString(), expiresAt: new Date(r.expires_at).toISOString(), consumedAt: r.consumed_at ? new Date(r.consumed_at).toISOString() : undefined, replacedByRef: r.replaced_by_ref ?? undefined } as RefreshTokenRecord : undefined;
  }
  async consumeRefreshToken(tokenHash: string, consumedAt: string, replacementRef: string) {
    const result = await this.pool.query(`UPDATE veygrit_id_refresh_token SET consumed_at=$2,replaced_by_ref=$3 WHERE token_hash=$1 AND consumed_at IS NULL RETURNING *`, [tokenHash, consumedAt, replacementRef]);
    const r: any = result.rows[0]; if (!r) return undefined;
    const family = await this.pool.query<{ family_ref: string }>(`SELECT family_ref FROM veygrit_id_token_family WHERE id=$1`, [r.family_id]);
    return { tokenRef: r.token_ref, tokenHash: r.token_hash, familyRef: family.rows[0].family_ref, rotationCounter: r.rotation_counter, issuedAt: new Date(r.issued_at).toISOString(), expiresAt: new Date(r.expires_at).toISOString(), consumedAt, replacedByRef: replacementRef } as RefreshTokenRecord;
  }
  async revokeFamily(familyRef: string, status: 'revoked' | 'compromised') {
    await transaction(this.pool, async client => {
      await client.query(`UPDATE veygrit_id_token_family SET status=$2,revoked_at=now() WHERE family_ref=$1`, [familyRef, status]);
      await client.query(`UPDATE veygrit_id_access_token SET revoked_at=COALESCE(revoked_at,now()) WHERE family_id=(SELECT id FROM veygrit_id_token_family WHERE family_ref=$1)`, [familyRef]);
    });
  }
  async saveNavigationHandoff(handoff: NavigationHandoffRecord) {
    await this.pool.query(
      `INSERT INTO veygrit_id_navigation_handoff (handoff_ref,handoff_token_hash,pairwise_subject_id,source_surface,target_surface,return_path,expires_at)
       SELECT $1,$2,id,$4,$5,$6,$7 FROM veygrit_id_pairwise_subject WHERE pairwise_subject_alias=$3`,
      [handoff.handoffRef, handoff.tokenHash, handoff.pairwiseSubjectAlias, handoff.source, handoff.target, handoff.returnPath, handoff.expiresAt],
    );
  }
  async consumeNavigationHandoff(tokenHash: string, consumedAt: string) {
    const result = await this.pool.query(
      `UPDATE veygrit_id_navigation_handoff h SET consumed_at=$2 FROM veygrit_id_pairwise_subject p WHERE h.handoff_token_hash=$1 AND h.consumed_at IS NULL AND p.id=h.pairwise_subject_id RETURNING h.*,p.pairwise_subject_alias`, [tokenHash, consumedAt],
    );
    const r: any = result.rows[0]; return r ? { handoffRef: r.handoff_ref, tokenHash: r.handoff_token_hash, pairwiseSubjectAlias: r.pairwise_subject_alias, source: r.source_surface, target: r.target_surface, returnPath: r.return_path, expiresAt: new Date(r.expires_at).toISOString(), consumedAt } as NavigationHandoffRecord : undefined;
  }
  async appendAudit(event: { eventRef: string; actorType: 'subject' | 'client' | 'system' | 'admin'; actorRef?: string; action: string; aggregateType: string; aggregateRef: string; outcome: 'success' | 'failure' | 'denied'; requestId?: string; details?: Record<string, unknown>; occurredAt: string }) {
    await this.pool.query(`INSERT INTO veygrit_id_audit_event (event_ref,actor_type,actor_ref,action,aggregate_type,aggregate_ref,outcome,request_id,details,occurred_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [event.eventRef, event.actorType, event.actorRef ?? null, event.action, event.aggregateType, event.aggregateRef, event.outcome, event.requestId ?? null, event.details ?? {}, event.occurredAt]);
  }
}

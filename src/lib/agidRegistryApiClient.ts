import { agidFetch, type AgidApiResult, type AgidFetchOptions } from './agidHttpClient';
import type {
  AgidRegistryCapabilities,
  AgidRegistryFreshnessRootRecord,
  AgidRegistryIssuerRecord,
  AgidRegistryMutationResult,
  AgidRegistryNullifierRecord,
  AgidRegistryRevocationRecord,
  AgidRegistrySnapshot,
  AgidRegistryVerifyInput,
  AgidRegistryVerifyResult,
} from './agidRegistryApi';

export type AgidRegistryApiClientOptions = {
  baseUrl?: string;
  adminToken?: string;
  fetchOptions?: AgidFetchOptions;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '');
}

function jsonHeaders(adminToken?: string) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (adminToken) headers.set('X-AGID-Registry-Admin-Token', adminToken);
  return headers;
}

export class AgidRegistryApiClient {
  private readonly baseUrl: string;
  private readonly adminToken?: string;
  private readonly fetchOptions: AgidFetchOptions;

  constructor(options: AgidRegistryApiClientOptions = {}) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? '');
    this.adminToken = options.adminToken;
    this.fetchOptions = options.fetchOptions ?? {};
  }

  capabilities(): Promise<AgidApiResult<AgidRegistryCapabilities>> {
    return this.get('/api/registry/mode1/capabilities');
  }

  status(): Promise<AgidApiResult<AgidRegistrySnapshot>> {
    return this.get('/api/registry/mode1/status');
  }

  audit(limit = 100): Promise<AgidApiResult<{ events: AgidRegistrySnapshot['audit'] }>> {
    return this.get(`/api/registry/mode1/audit?limit=${encodeURIComponent(String(limit))}`);
  }

  registerIssuer(input: Partial<AgidRegistryIssuerRecord>): Promise<AgidApiResult<AgidRegistryMutationResult<AgidRegistryIssuerRecord>>> {
    return this.post('/api/registry/mode1/issuer/register', input, true);
  }

  revokeCommitment(input: Partial<AgidRegistryRevocationRecord>): Promise<AgidApiResult<AgidRegistryMutationResult<AgidRegistryRevocationRecord>>> {
    return this.post('/api/registry/mode1/revocation/revoke-commitment', input, true);
  }

  anchorFreshnessRoot(input: Partial<AgidRegistryFreshnessRootRecord>): Promise<AgidApiResult<AgidRegistryMutationResult<AgidRegistryFreshnessRootRecord>>> {
    return this.post('/api/registry/mode1/freshness/anchor', input, true);
  }

  verify(input: AgidRegistryVerifyInput): Promise<AgidApiResult<AgidRegistryVerifyResult>> {
    return this.post('/api/registry/mode1/verify', input);
  }

  markNullifierUsed(input: Partial<AgidRegistryNullifierRecord>): Promise<AgidApiResult<AgidRegistryMutationResult<AgidRegistryNullifierRecord>>> {
    return this.post('/api/registry/mode1/nullifier/mark-used', input);
  }

  private get<T>(path: string): Promise<AgidApiResult<T>> {
    return agidFetch<T>(`${this.baseUrl}${path}`, {
      ...this.fetchOptions,
      method: 'GET',
      source: this.fetchOptions.source ?? 'agid-registry-api-mode1',
    });
  }

  private post<T>(path: string, body: unknown, withAdminToken = false): Promise<AgidApiResult<T>> {
    return agidFetch<T>(`${this.baseUrl}${path}`, {
      ...this.fetchOptions,
      method: 'POST',
      headers: jsonHeaders(withAdminToken ? this.adminToken : undefined),
      body: JSON.stringify(body ?? {}),
      source: this.fetchOptions.source ?? 'agid-registry-api-mode1',
      retryUnsafe: this.fetchOptions.retryUnsafe ?? false,
    });
  }
}

export function createAgidRegistryApiClient(options: AgidRegistryApiClientOptions = {}) {
  return new AgidRegistryApiClient(options);
}

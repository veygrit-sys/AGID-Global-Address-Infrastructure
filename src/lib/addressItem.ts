import {
  ADDRESS_LINK_SCOPES,
  type AddressLinkScope,
  type AddressLinkSession,
} from './addressLink';
import { sha256Hex } from './sha256';

export const ADDRESS_ITEM_MODEL_VERSION = 'agid-address-item-v1';

export const ADDRESS_ITEM_STATUSES = [
  'requires_credential',
  'active',
  'requires_reverification',
  'suspended',
  'revoked',
  'expired',
  'error',
] as const;

export const ADDRESS_ITEM_REVOCATION_STATES = [
  'not_checked',
  'active',
  'revoked',
  'suspended',
  'stale',
] as const;

export const ADDRESS_ITEM_CREDENTIAL_REF_TYPES = [
  'commitment',
  'vc-ref',
  'zk-ref',
  'server-ref',
  'local-ref',
] as const;

export const ADDRESS_ITEM_NEXT_ACTIONS = [
  'attach_credential',
  'refresh_credential',
  'check_revocation',
  'reduce_scope',
  'manual_review',
  'none',
] as const;

const FORBIDDEN_PRIVATE_KEYS = new Set([
  'address',
  'rawaddress',
  'addresstext',
  'plaintextaddress',
  'formattedaddress',
  'recipient',
  'recipientname',
  'phone',
  'phonenumber',
  'unit',
  'room',
  'roomnumber',
  'building',
  'street',
  'road',
  'housenumber',
  'house_number',
  'lat',
  'latitude',
  'lon',
  'lng',
  'longitude',
  'coordinates',
  'agid',
  'rawagid',
  'aoid',
  'rawaoid',
  'proofcode',
  'recipientsecret',
  'credentialsecret',
  'privatekey',
  'secret',
]);

export type AddressItemStatus = typeof ADDRESS_ITEM_STATUSES[number];
export type AddressItemRevocationState = typeof ADDRESS_ITEM_REVOCATION_STATES[number];
export type AddressItemCredentialRefType = typeof ADDRESS_ITEM_CREDENTIAL_REF_TYPES[number];
export type AddressItemNextAction = typeof ADDRESS_ITEM_NEXT_ACTIONS[number];

export type AddressItemCredentialRefInput = {
  type?: AddressItemCredentialRefType | string;
  ref?: string;
  fingerprint?: string;
  issuerCredentialRef?: string;
};

export type AddressItemCredentialRef = {
  type: AddressItemCredentialRefType;
  ref: string;
  fingerprint: string;
};

export type AddressItemInput = {
  addressItemId?: unknown;
  issuerId?: unknown;
  credentialRef?: unknown;
  scopes?: unknown;
  status?: unknown;
  revocationState?: unknown;
  lastVerifiedAt?: unknown;
  createdAt?: unknown;
  expiresAt?: unknown;
  linkSession?: AddressLinkSession;
  metadata?: unknown;
};

export type AddressItemPrivacyBoundary = {
  plaintextAddressStored: false;
  rawAgidStored: false;
  rawAoidStored: false;
  credentialSecretStored: false;
  storesRefsAndCommitmentsOnly: true;
  publicSurface: 'address-item-status-scopes-credential-ref-and-roots-only';
};

export type AddressItem = {
  modelVersion: typeof ADDRESS_ITEM_MODEL_VERSION;
  addressItemId: string;
  issuerId: string | null;
  credentialRef: AddressItemCredentialRef | null;
  scopes: AddressLinkScope[];
  status: AddressItemStatus;
  revocationState: AddressItemRevocationState;
  createdAt: string;
  lastVerifiedAt: string | null;
  expiresAt?: string;
  itemRoot: string;
  nextAction: AddressItemNextAction;
  errors: string[];
  warnings: string[];
  privacy: AddressItemPrivacyBoundary;
};

export type AddressItemScopeEvaluation = {
  accepted: boolean;
  addressItemId: string;
  status: AddressItemStatus;
  grantedScopes: AddressLinkScope[];
  deniedScopes: Array<{
    scope: AddressLinkScope;
    reason: string;
  }>;
  nextAction: AddressItemNextAction;
  warnings: string[];
};

export type AddressItemStore = {
  create(input: AddressItemInput): AddressItem;
  get(addressItemId: string): AddressItem | undefined;
  update(addressItemId: string, patch: AddressItemInput): AddressItem | undefined;
  listRecent(limit?: number): AddressItem[];
  evaluate(addressItemId: string, requestedScopes: Array<AddressLinkScope | string>): AddressItemScopeEvaluation | undefined;
};

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const entries = Object.keys(value as Record<string, unknown>)
    .sort()
    .map(key => [key, (value as Record<string, unknown>)[key]] as const);
  return `{${entries.map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`).join(',')}}`;
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function normalizeIdentifier(value: unknown, fallbackSeed: string, prefix: string): string {
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (/^[a-z0-9][a-z0-9:_./-]{2,96}$/i.test(normalized)) return normalized;
  }

  return `${prefix}-${sha256Hex(fallbackSeed).slice(0, 20).toUpperCase()}`;
}

function normalizeIssuerId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return normalized.replace(/[^a-z0-9:_./-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 96) || null;
}

function validIsoOrNow(value: unknown): string {
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) return value;
  return new Date().toISOString();
}

function optionalIso(value: unknown): string | undefined {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : undefined;
}

function normalizeScopes(value: unknown, linkSession?: AddressLinkSession): AddressLinkScope[] {
  const requested = Array.isArray(value) ? value : linkSession?.grantedScopes ?? linkSession?.scopes ?? [];
  return unique(
    requested
      .map(scope => typeof scope === 'string' ? scope.trim().toLowerCase().replace(/_/g, ':') : '')
      .filter((scope): scope is AddressLinkScope => ADDRESS_LINK_SCOPES.includes(scope as AddressLinkScope)),
  );
}

function normalizeRevocationState(value: unknown): AddressItemRevocationState {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase().replace(/-/g, '_') : '';
  return ADDRESS_ITEM_REVOCATION_STATES.includes(normalized as AddressItemRevocationState)
    ? normalized as AddressItemRevocationState
    : 'not_checked';
}

function normalizeCredentialRefType(value: unknown): AddressItemCredentialRefType {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase().replace(/_/g, '-') : '';
  return ADDRESS_ITEM_CREDENTIAL_REF_TYPES.includes(normalized as AddressItemCredentialRefType)
    ? normalized as AddressItemCredentialRefType
    : 'commitment';
}

function credentialRefFromInput(value: unknown, linkSession?: AddressLinkSession): AddressItemCredentialRef | null {
  const input = value && typeof value === 'object'
    ? value as AddressItemCredentialRefInput
    : {};
  const explicitRef = typeof input.ref === 'string' ? input.ref.trim() : '';
  const explicitFingerprint = typeof input.fingerprint === 'string' ? input.fingerprint.trim() : '';
  const issuerRef = typeof input.issuerCredentialRef === 'string' ? input.issuerCredentialRef.trim() : '';
  const linkCredential = typeof linkSession?.commitments?.credential === 'string'
    ? linkSession.commitments.credential.trim()
    : '';
  const linkAddress = typeof linkSession?.commitments?.address === 'string'
    ? linkSession.commitments.address.trim()
    : '';
  const ref = explicitRef || issuerRef || linkCredential || linkAddress;
  if (!ref) return null;

  return {
    type: normalizeCredentialRefType(input.type),
    ref,
    fingerprint: explicitFingerprint || sha256Hex(ref).slice(0, 32),
  };
}

function isExpired(expiresAt: string | undefined, now = Date.now()): boolean {
  if (!expiresAt) return false;
  const timestamp = Date.parse(expiresAt);
  return Number.isFinite(timestamp) && timestamp <= now;
}

function findForbiddenPrivateKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findForbiddenPrivateKeys(item, `${prefix}[${index}]`));
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const findings: string[] = [];
  for (const [key, nested] of entries) {
    const path = prefix ? `${prefix}.${key}` : key;
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (FORBIDDEN_PRIVATE_KEYS.has(normalizedKey)) findings.push(path);
    findings.push(...findForbiddenPrivateKeys(nested, path));
  }

  return findings;
}

function deriveStatus(input: {
  requestedStatus: unknown;
  credentialRef: AddressItemCredentialRef | null;
  revocationState: AddressItemRevocationState;
  lastVerifiedAt: string | null;
  expiresAt?: string;
  errors: string[];
}): AddressItemStatus {
  const requested = typeof input.requestedStatus === 'string'
    ? input.requestedStatus.trim().toLowerCase().replace(/-/g, '_')
    : '';
  if (ADDRESS_ITEM_STATUSES.includes(requested as AddressItemStatus) && requested === 'suspended') {
    return 'suspended';
  }
  if (input.errors.length > 0) return 'error';
  if (isExpired(input.expiresAt)) return 'expired';
  if (input.revocationState === 'revoked') return 'revoked';
  if (input.revocationState === 'suspended') return 'suspended';
  if (!input.credentialRef) return 'requires_credential';
  if (!input.lastVerifiedAt || input.revocationState === 'not_checked' || input.revocationState === 'stale') {
    return 'requires_reverification';
  }
  return 'active';
}

function nextActionForStatus(status: AddressItemStatus): AddressItemNextAction {
  if (status === 'requires_credential') return 'attach_credential';
  if (status === 'requires_reverification') return 'check_revocation';
  if (status === 'suspended' || status === 'revoked' || status === 'expired') return 'manual_review';
  if (status === 'error') return 'manual_review';
  return 'none';
}

function warningForRevocationState(revocationState: AddressItemRevocationState): string | undefined {
  if (revocationState === 'not_checked') return 'address-item-revocation-not-checked';
  if (revocationState === 'stale') return 'address-item-revocation-state-stale';
  return undefined;
}

export function buildAddressItem(input: AddressItemInput): AddressItem {
  const linkSession = input.linkSession;
  const createdAt = validIsoOrNow(input.createdAt ?? linkSession?.createdAt);
  const expiresAt = optionalIso(input.expiresAt ?? linkSession?.expiresAt);
  const issuerId = normalizeIssuerId(input.issuerId);
  const scopes = normalizeScopes(input.scopes, linkSession);
  const revocationState = normalizeRevocationState(input.revocationState);
  const credentialRef = credentialRefFromInput(input.credentialRef, linkSession);
  const lastVerifiedAt = optionalIso(input.lastVerifiedAt) ?? null;
  const errors: string[] = [];
  const warnings: string[] = [];
  const { linkSession: _linkSessionForLeakScan, ...leakScanInput } = input as Record<string, unknown>;
  const privateFindings = findForbiddenPrivateKeys(leakScanInput);

  if (privateFindings.length > 0) {
    errors.push('address-item-input-contains-private-material');
    warnings.push(`address-item-private-material-paths:${privateFindings.join(',')}`);
  }
  if (scopes.length === 0) warnings.push('address-item-has-no-granted-scopes');
  const revocationWarning = warningForRevocationState(revocationState);
  if (revocationWarning) warnings.push(revocationWarning);

  const fallbackSeed = stableJson({
    issuerId,
    scopes,
    createdAt,
    credentialFingerprint: credentialRef?.fingerprint,
  });
  const addressItemId = normalizeIdentifier(input.addressItemId, fallbackSeed, 'ADI');
  const status = deriveStatus({
    requestedStatus: input.status,
    credentialRef,
    revocationState,
    lastVerifiedAt,
    expiresAt,
    errors,
  });

  const rootMaterial = {
    modelVersion: ADDRESS_ITEM_MODEL_VERSION,
    addressItemId,
    issuerId,
    credentialRef,
    scopes,
    status,
    revocationState,
    createdAt,
    lastVerifiedAt,
    expiresAt,
  };

  return {
    modelVersion: ADDRESS_ITEM_MODEL_VERSION,
    addressItemId,
    issuerId,
    credentialRef,
    scopes,
    status,
    revocationState,
    createdAt,
    lastVerifiedAt,
    expiresAt,
    itemRoot: sha256Hex(stableJson(rootMaterial)),
    nextAction: nextActionForStatus(status),
    errors,
    warnings: unique(warnings),
    privacy: {
      plaintextAddressStored: false,
      rawAgidStored: false,
      rawAoidStored: false,
      credentialSecretStored: false,
      storesRefsAndCommitmentsOnly: true,
      publicSurface: 'address-item-status-scopes-credential-ref-and-roots-only',
    },
  };
}

export function evaluateAddressItemScope(
  item: AddressItem,
  requestedScopes: Array<AddressLinkScope | string>,
): AddressItemScopeEvaluation {
  const requested = normalizeScopes(requestedScopes);
  const warnings: string[] = [];
  const deniedScopes: AddressItemScopeEvaluation['deniedScopes'] = [];

  if (requested.length === 0) warnings.push('address-item-scope-evaluation-has-no-requested-scopes');

  for (const scope of requested) {
    if (item.status !== 'active') {
      deniedScopes.push({ scope, reason: `address-item-status-${item.status}` });
    } else if (item.revocationState !== 'active') {
      deniedScopes.push({ scope, reason: `address-item-revocation-${item.revocationState}` });
    } else if (!item.scopes.includes(scope)) {
      deniedScopes.push({ scope, reason: 'address-item-scope-not-granted' });
    }
  }

  const denied = new Set(deniedScopes.map(scope => scope.scope));
  const grantedScopes = requested.filter(scope => !denied.has(scope));

  return {
    accepted: requested.length > 0 && deniedScopes.length === 0,
    addressItemId: item.addressItemId,
    status: item.status,
    grantedScopes,
    deniedScopes,
    nextAction: deniedScopes.length > 0 ? item.nextAction : 'none',
    warnings,
  };
}

export function listAddressItemCapabilities() {
  return {
    modelVersion: ADDRESS_ITEM_MODEL_VERSION,
    statuses: [...ADDRESS_ITEM_STATUSES],
    revocationStates: [...ADDRESS_ITEM_REVOCATION_STATES],
    credentialRefTypes: [...ADDRESS_ITEM_CREDENTIAL_REF_TYPES],
    nextActions: [...ADDRESS_ITEM_NEXT_ACTIONS],
    linkScopes: [...ADDRESS_LINK_SCOPES],
    privacy: {
      plaintextAddressStored: false,
      rawAgidStored: false,
      rawAoidStored: false,
      credentialSecretStored: false,
      storesRefsAndCommitmentsOnly: true,
    } satisfies Omit<AddressItemPrivacyBoundary, 'publicSurface'>,
  };
}

export function createInMemoryAddressItemStore(): AddressItemStore {
  const items = new Map<string, AddressItem>();

  return {
    create(input: AddressItemInput) {
      const item = buildAddressItem(input);
      items.set(item.addressItemId, item);
      return item;
    },
    get(addressItemId: string) {
      return items.get(addressItemId);
    },
    update(addressItemId: string, patch: AddressItemInput) {
      const current = items.get(addressItemId);
      if (!current) return undefined;
      const updated = buildAddressItem({
        addressItemId,
        issuerId: patch.issuerId ?? current.issuerId,
        credentialRef: patch.credentialRef ?? current.credentialRef ?? undefined,
        scopes: patch.scopes ?? current.scopes,
        status: patch.status ?? current.status,
        revocationState: patch.revocationState ?? current.revocationState,
        lastVerifiedAt: patch.lastVerifiedAt ?? current.lastVerifiedAt ?? undefined,
        createdAt: patch.createdAt ?? current.createdAt,
        expiresAt: patch.expiresAt ?? current.expiresAt,
        linkSession: patch.linkSession,
        metadata: patch.metadata,
      });
      items.set(addressItemId, updated);
      return updated;
    },
    listRecent(limit = 20) {
      return Array.from(items.values())
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, Math.max(0, limit));
    },
    evaluate(addressItemId: string, requestedScopes: Array<AddressLinkScope | string>) {
      const item = items.get(addressItemId);
      return item ? evaluateAddressItemScope(item, requestedScopes) : undefined;
    },
  };
}

export const AGID_REGISTRY_API_VERSION = 'agid-registry-api-v1';
export const AGID_REGISTRY_MODE = 'local-server-registry';

const AUDIT_LIMIT = 500;

export type AgidRegistryIssuerStatus = 'active' | 'suspended' | 'revoked';
export type AgidRegistryOperation =
  | 'register-issuer'
  | 'revoke-commitment'
  | 'anchor-freshness-root'
  | 'verify'
  | 'mark-nullifier-used';
export type AgidRegistryMutationStatus =
  | 'recorded'
  | 'already_recorded'
  | 'duplicate'
  | 'rejected';

export type AgidRegistryPrivacyPosture = {
  rawAddressStored: false;
  rawAgidStored: false;
  rawAoidStored: false;
  agidSecureCiphertextStored: false;
  zkProofRequired: false;
  ethereumRequired: false;
  gasRequired: false;
  serverTrusted: true;
  acceptedMaterial: string[];
  rejectedMaterial: string[];
};

export type AgidRegistryCapabilities = {
  mode: typeof AGID_REGISTRY_MODE;
  modeVersion: typeof AGID_REGISTRY_API_VERSION;
  zkProofRequired: false;
  ethereumRequired: false;
  gasRequired: false;
  offlineCapableAfterCache: true;
  publicReads: string[];
  adminWrites: string[];
  publicWrites: string[];
  privacy: AgidRegistryPrivacyPosture;
};

export type AgidRegistryIssuerRecord = {
  issuerId: string;
  status: AgidRegistryIssuerStatus;
  displayName?: string;
  trustScore: number;
  publicKeyCommitment?: string;
  metadataHash?: string;
  registeredAt: string;
  updatedAt: string;
  sourceIds: string[];
};

export type AgidRegistryRevocationRecord = {
  commitment: string;
  commitmentType: 'credential' | 'address-reference' | 'aoid' | 'agid' | 'issuer-scoped' | 'unknown';
  reason?: string;
  issuerId?: string;
  revokedAt: string;
  sourceIds: string[];
};

export type AgidRegistryFreshnessRootRecord = {
  freshnessRoot: string;
  registryId: string;
  issuerId?: string;
  anchoredAt: string;
  freshUntil: string;
  sourceIds: string[];
};

export type AgidRegistryNullifierRecord = {
  nullifierHash: string;
  scope: string;
  issuerId?: string;
  usedAt: string;
  expiresAt?: string;
  sourceIds: string[];
};

export type AgidRegistryAuditEvent = {
  eventId: string;
  operation: AgidRegistryOperation;
  status: AgidRegistryMutationStatus | 'verified' | 'invalid';
  recordedAt: string;
  subjectCommitment?: string;
  issuerId?: string;
  scope?: string;
  errors: string[];
  warnings: string[];
};

export type AgidRegistryMutationResult<TRecord> = {
  mode: typeof AGID_REGISTRY_MODE;
  modeVersion: typeof AGID_REGISTRY_API_VERSION;
  status: AgidRegistryMutationStatus;
  record?: TRecord;
  errors: string[];
  warnings: string[];
  privacy: AgidRegistryPrivacyPosture;
  event: AgidRegistryAuditEvent;
};

export type AgidRegistryVerifyInput = {
  issuerId?: string;
  credentialCommitment?: string;
  addressReferenceCommitment?: string;
  aoidCommitment?: string;
  agidCommitment?: string;
  revocationCommitment?: string;
  commitments?: string[];
  freshnessRoot?: string;
  requireAnchoredFreshnessRoot?: boolean;
  freshUntil?: string;
  nullifierHash?: string;
  scope?: string;
  now?: string;
  localResolverStatus?: string;
};

export type AgidRegistryVerifyResult = {
  mode: typeof AGID_REGISTRY_MODE;
  modeVersion: typeof AGID_REGISTRY_API_VERSION;
  valid: boolean;
  checkedAt: string;
  errors: string[];
  warnings: string[];
  issuer?: Pick<AgidRegistryIssuerRecord, 'issuerId' | 'status' | 'trustScore'>;
  revokedCommitments: string[];
  freshness: {
    root?: string;
    anchored: boolean;
    fresh: boolean;
    freshUntil?: string;
  };
  nullifier?: {
    scope: string;
    used: boolean;
    usedAt?: string;
  };
  matchedRecords: {
    commitmentCount: number;
    revokedCount: number;
  };
  privacy: AgidRegistryPrivacyPosture;
};

export type AgidRegistrySnapshot = {
  mode: typeof AGID_REGISTRY_MODE;
  modeVersion: typeof AGID_REGISTRY_API_VERSION;
  issuers: AgidRegistryIssuerRecord[];
  revokedCommitments: AgidRegistryRevocationRecord[];
  freshnessRoots: AgidRegistryFreshnessRootRecord[];
  usedNullifiers: AgidRegistryNullifierRecord[];
  audit: AgidRegistryAuditEvent[];
  privacy: AgidRegistryPrivacyPosture;
};

type Awaitable<T> = T | Promise<T>;

export type AgidRegistryApiStoreAdapter = {
  capabilities(): Awaitable<AgidRegistryCapabilities>;
  snapshot(): Awaitable<AgidRegistrySnapshot>;
  auditEvents(limit?: number): Awaitable<AgidRegistryAuditEvent[]>;
  registerIssuer(input: RegisterIssuerInput): Awaitable<AgidRegistryMutationResult<AgidRegistryIssuerRecord>>;
  revokeCommitment(input: RevokeCommitmentInput): Awaitable<AgidRegistryMutationResult<AgidRegistryRevocationRecord>>;
  anchorFreshnessRoot(input: AnchorFreshnessRootInput): Awaitable<AgidRegistryMutationResult<AgidRegistryFreshnessRootRecord>>;
  verify(input: AgidRegistryVerifyInput & Record<string, unknown>): Awaitable<AgidRegistryVerifyResult>;
  markNullifierUsed(input: MarkNullifierUsedInput): Awaitable<AgidRegistryMutationResult<AgidRegistryNullifierRecord>>;
};

type RegisterIssuerInput = Partial<AgidRegistryIssuerRecord> & Record<string, unknown>;
type RevokeCommitmentInput = Partial<AgidRegistryRevocationRecord> & Record<string, unknown>;
type AnchorFreshnessRootInput = Partial<AgidRegistryFreshnessRootRecord> & Record<string, unknown>;
type MarkNullifierUsedInput = Partial<AgidRegistryNullifierRecord> & Record<string, unknown>;

const FORBIDDEN_PRIVATE_KEYS = new Set([
  'address',
  'addresstext',
  'addressline',
  'addresslines',
  'fulladdress',
  'rawaddress',
  'streetaddress',
  'physicaladdress',
  'agid',
  'rawagid',
  'aoid',
  'rawaoid',
  'agids',
  'agidsecure',
  'ciphertext',
  'encryptedpayload',
  'recipient',
  'recipientname',
  'name',
  'fullname',
  'phone',
  'telephone',
  'email',
  'building',
  'room',
  'unit',
  'apartment',
  'postcode',
  'postalcode',
  'zip',
  'latitude',
  'longitude',
  'lat',
  'lng',
  'lon',
  'coordinates',
]);

const PUBLIC_KEY_PATTERN = /(commitment|hash|root|nullifier|issuerid|issuerstatus|scope|sourceids|checkedat|freshuntil|expiresat|jtitail|jti|keyid|registryid|version|policy|trustscore|terminalid|operatorid|requestid|reason|metadatahash|publickeycommitment|localresolverstatus|required|now)/i;

function canonicalKey(key: string) {
  return key.normalize('NFKC').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function isPublicMaterialKey(key: string) {
  return PUBLIC_KEY_PATTERN.test(key);
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.normalize('NFKC').trim() : '';
}

function normalizeId(value: unknown) {
  return normalizeText(value).replace(/\s+/g, '-');
}

function normalizeCommitment(value: unknown) {
  const text = normalizeText(value);
  if (!text) return '';
  return text.startsWith('0x') ? `0x${text.slice(2).toLowerCase()}` : text.toLowerCase();
}

function normalizeSourceIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => normalizeText(item))
    .filter(Boolean)
    .slice(0, 20);
}

function normalizeTrustScore(value: unknown) {
  const score = typeof value === 'number' && Number.isFinite(value) ? value : 0.5;
  return Math.max(0, Math.min(1, score));
}

function normalizeIso(value: unknown, fallback = new Date()) {
  const text = normalizeText(value);
  const date = text ? new Date(text) : fallback;
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback.toISOString();
}

function parseDate(value: unknown) {
  const text = normalizeText(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isFinite(date.getTime()) ? date : null;
}

function createEventId(operation: AgidRegistryOperation, recordedAt: string, subject = '') {
  const random = Math.random().toString(36).slice(2, 8);
  return `${operation}-${Date.parse(recordedAt).toString(36)}-${subject.slice(0, 8)}-${random}`;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function safePrivacy(): AgidRegistryPrivacyPosture {
  return {
    rawAddressStored: false,
    rawAgidStored: false,
    rawAoidStored: false,
    agidSecureCiphertextStored: false,
    zkProofRequired: false,
    ethereumRequired: false,
    gasRequired: false,
    serverTrusted: true,
    acceptedMaterial: [
      'issuerId',
      'publicKeyCommitment',
      'metadataHash',
      'credentialCommitment',
      'addressReferenceCommitment',
      'aoidCommitment',
      'agidCommitment',
      'freshnessRoot',
      'nullifierHash',
    ],
    rejectedMaterial: [
      'raw address',
      'raw AGID',
      'raw AOID',
      'AGID-S ciphertext',
      'latitude/longitude',
      'recipient name',
      'phone number',
      'email',
      'room or unit number',
    ],
  };
}

export function getAgidRegistryCapabilities(): AgidRegistryCapabilities {
  return {
    mode: AGID_REGISTRY_MODE,
    modeVersion: AGID_REGISTRY_API_VERSION,
    zkProofRequired: false,
    ethereumRequired: false,
    gasRequired: false,
    offlineCapableAfterCache: true,
    publicReads: [
      'capabilities',
      'status',
      'audit',
      'verify public commitments',
    ],
    adminWrites: [
      'register issuer',
      'revoke commitment',
      'anchor freshness root',
    ],
    publicWrites: [
      'mark nullifier used',
    ],
    privacy: safePrivacy(),
  };
}

function isAgidLike(text: string) {
  const compact = text.normalize('NFKC').trim().toUpperCase().replace(/[\s-]+/g, '');
  return /^AGID[A-Z0-9]{8,}$/.test(compact) || /^[A-Z0-9]{10,16}$/.test(compact);
}

function isCoordinateLike(text: string) {
  return /^-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+$/.test(text.trim());
}

export function collectAgidRegistryPrivateMaterialErrors(value: unknown, path = 'input'): string[] {
  const errors: string[] = [];
  const visit = (item: unknown, itemPath: string, parentKey = '') => {
    if (item === null || item === undefined) return;

    if (typeof item === 'string') {
      if (!isPublicMaterialKey(parentKey) && (isAgidLike(item) || isCoordinateLike(item))) {
        errors.push(`${itemPath} appears to contain raw location material; submit a commitment/hash/root instead.`);
      }
      return;
    }

    if (typeof item !== 'object') return;
    if (Array.isArray(item)) {
      item.forEach((entry, index) => visit(entry, `${itemPath}[${index}]`, parentKey));
      return;
    }

    for (const [key, entry] of Object.entries(item as Record<string, unknown>)) {
      const canonical = canonicalKey(key);
      const publicKey = isPublicMaterialKey(key);
      if (!publicKey && FORBIDDEN_PRIVATE_KEYS.has(canonical)) {
        errors.push(`${itemPath}.${key} is private material; submit only commitments, hashes, roots, or nullifiers.`);
        continue;
      }
      visit(entry, `${itemPath}.${key}`, key);
    }
  };

  visit(value, path);
  return unique(errors);
}

function mutationEvent(
  operation: AgidRegistryOperation,
  status: AgidRegistryAuditEvent['status'],
  options: {
    subjectCommitment?: string;
    issuerId?: string;
    scope?: string;
    errors?: string[];
    warnings?: string[];
    recordedAt?: string;
  } = {},
): AgidRegistryAuditEvent {
  const recordedAt = options.recordedAt ?? new Date().toISOString();
  return {
    eventId: createEventId(operation, recordedAt, options.subjectCommitment || options.issuerId || options.scope || ''),
    operation,
    status,
    recordedAt,
    subjectCommitment: options.subjectCommitment,
    issuerId: options.issuerId,
    scope: options.scope,
    errors: options.errors ?? [],
    warnings: options.warnings ?? [],
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nullifierKey(scope: string, nullifierHash: string) {
  return `${scope}::${nullifierHash}`;
}

function mutationResult<TRecord>(
  operation: AgidRegistryOperation,
  status: AgidRegistryMutationStatus,
  record: TRecord | undefined,
  eventOptions: Parameters<typeof mutationEvent>[2],
): AgidRegistryMutationResult<TRecord> {
  return {
    mode: AGID_REGISTRY_MODE,
    modeVersion: AGID_REGISTRY_API_VERSION,
    status,
    record,
    errors: eventOptions.errors ?? [],
    warnings: eventOptions.warnings ?? [],
    privacy: safePrivacy(),
    event: mutationEvent(operation, status, eventOptions),
  };
}

export class InMemoryAgidRegistryApiStore {
  private issuers = new Map<string, AgidRegistryIssuerRecord>();
  private revoked = new Map<string, AgidRegistryRevocationRecord>();
  private freshnessRoots = new Map<string, AgidRegistryFreshnessRootRecord>();
  private nullifiers = new Map<string, AgidRegistryNullifierRecord>();
  private audit: AgidRegistryAuditEvent[] = [];

  constructor(snapshot?: Partial<AgidRegistrySnapshot>) {
    if (snapshot) this.replaceSnapshot(snapshot);
  }

  capabilities() {
    return getAgidRegistryCapabilities();
  }

  snapshot(): AgidRegistrySnapshot {
    return {
      mode: AGID_REGISTRY_MODE,
      modeVersion: AGID_REGISTRY_API_VERSION,
      issuers: clone(Array.from(this.issuers.values())),
      revokedCommitments: clone(Array.from(this.revoked.values())),
      freshnessRoots: clone(Array.from(this.freshnessRoots.values())),
      usedNullifiers: clone(Array.from(this.nullifiers.values())),
      audit: clone(this.audit),
      privacy: safePrivacy(),
    };
  }

  replaceSnapshot(snapshot: Partial<AgidRegistrySnapshot>) {
    this.issuers.clear();
    this.revoked.clear();
    this.freshnessRoots.clear();
    this.nullifiers.clear();
    this.audit = [];

    if (Array.isArray(snapshot.issuers)) {
      snapshot.issuers.forEach(record => {
        const issuerId = normalizeId(record?.issuerId);
        if (!issuerId) return;
        const now = new Date().toISOString();
        this.issuers.set(issuerId, {
          issuerId,
          status: ['active', 'suspended', 'revoked'].includes(normalizeText(record.status))
            ? normalizeText(record.status) as AgidRegistryIssuerStatus
            : 'active',
          displayName: normalizeText(record.displayName) || undefined,
          trustScore: normalizeTrustScore(record.trustScore),
          publicKeyCommitment: normalizeCommitment(record.publicKeyCommitment) || undefined,
          metadataHash: normalizeCommitment(record.metadataHash) || undefined,
          registeredAt: normalizeIso(record.registeredAt, new Date(now)),
          updatedAt: normalizeIso(record.updatedAt, new Date(now)),
          sourceIds: normalizeSourceIds(record.sourceIds),
        });
      });
    }

    if (Array.isArray(snapshot.revokedCommitments)) {
      snapshot.revokedCommitments.forEach(record => {
        const commitment = normalizeCommitment(record?.commitment);
        if (!commitment) return;
        const requestedType = normalizeText(record.commitmentType);
        this.revoked.set(commitment, {
          commitment,
          commitmentType: ['credential', 'address-reference', 'aoid', 'agid', 'issuer-scoped'].includes(requestedType)
            ? requestedType as AgidRegistryRevocationRecord['commitmentType']
            : 'unknown',
          reason: normalizeText(record.reason) || undefined,
          issuerId: normalizeId(record.issuerId) || undefined,
          revokedAt: normalizeIso(record.revokedAt),
          sourceIds: normalizeSourceIds(record.sourceIds),
        });
      });
    }

    if (Array.isArray(snapshot.freshnessRoots)) {
      snapshot.freshnessRoots.forEach(record => {
        const freshnessRoot = normalizeCommitment(record?.freshnessRoot);
        const freshUntil = parseDate(record?.freshUntil);
        if (!freshnessRoot || !freshUntil) return;
        this.freshnessRoots.set(freshnessRoot, {
          freshnessRoot,
          registryId: normalizeId(record.registryId) || 'default',
          issuerId: normalizeId(record.issuerId) || undefined,
          anchoredAt: normalizeIso(record.anchoredAt),
          freshUntil: freshUntil.toISOString(),
          sourceIds: normalizeSourceIds(record.sourceIds),
        });
      });
    }

    if (Array.isArray(snapshot.usedNullifiers)) {
      snapshot.usedNullifiers.forEach(record => {
        const nullifierHash = normalizeCommitment(record?.nullifierHash);
        const scope = normalizeId(record?.scope) || 'default';
        if (!nullifierHash) return;
        this.nullifiers.set(nullifierKey(scope, nullifierHash), {
          nullifierHash,
          scope,
          issuerId: normalizeId(record.issuerId) || undefined,
          usedAt: normalizeIso(record.usedAt),
          expiresAt: parseDate(record.expiresAt)?.toISOString(),
          sourceIds: normalizeSourceIds(record.sourceIds),
        });
      });
    }

    if (Array.isArray(snapshot.audit)) {
      this.audit = snapshot.audit
        .filter(event => event && typeof event.eventId === 'string' && typeof event.operation === 'string')
        .slice(-AUDIT_LIMIT)
        .map(event => ({
          eventId: normalizeText(event.eventId) || createEventId('verify', new Date().toISOString()),
          operation: ['register-issuer', 'revoke-commitment', 'anchor-freshness-root', 'verify', 'mark-nullifier-used'].includes(event.operation)
            ? event.operation
            : 'verify',
          status: event.status,
          recordedAt: normalizeIso(event.recordedAt),
          subjectCommitment: normalizeCommitment(event.subjectCommitment) || undefined,
          issuerId: normalizeId(event.issuerId) || undefined,
          scope: normalizeId(event.scope) || undefined,
          errors: Array.isArray(event.errors) ? event.errors.map(normalizeText).filter(Boolean) : [],
          warnings: Array.isArray(event.warnings) ? event.warnings.map(normalizeText).filter(Boolean) : [],
        } as AgidRegistryAuditEvent));
    }
  }

  auditEvents(limit = 100) {
    const bounded = Math.max(1, Math.min(500, Math.floor(limit)));
    return clone(this.audit.slice(-bounded).reverse());
  }

  registerIssuer(input: RegisterIssuerInput): AgidRegistryMutationResult<AgidRegistryIssuerRecord> {
    const privateErrors = collectAgidRegistryPrivateMaterialErrors(input);
    const issuerId = normalizeId(input.issuerId);
    const now = new Date();
    const warnings: string[] = [];
    const errors = [...privateErrors];
    if (!issuerId) errors.push('issuerId is required');

    const status = ['active', 'suspended', 'revoked'].includes(normalizeText(input.status))
      ? normalizeText(input.status) as AgidRegistryIssuerStatus
      : 'active';

    if (errors.length > 0) {
      const result = mutationResult<AgidRegistryIssuerRecord>('register-issuer', 'rejected', undefined, {
        issuerId,
        errors,
        warnings,
        recordedAt: now.toISOString(),
      });
      this.recordAudit(result.event);
      return result;
    }

    const existing = this.issuers.get(issuerId);
    const record: AgidRegistryIssuerRecord = {
      issuerId,
      status,
      displayName: normalizeText(input.displayName) || undefined,
      trustScore: normalizeTrustScore(input.trustScore),
      publicKeyCommitment: normalizeCommitment(input.publicKeyCommitment) || undefined,
      metadataHash: normalizeCommitment(input.metadataHash) || undefined,
      registeredAt: existing?.registeredAt ?? now.toISOString(),
      updatedAt: now.toISOString(),
      sourceIds: normalizeSourceIds(input.sourceIds),
    };
    this.issuers.set(issuerId, record);

    const result = mutationResult('register-issuer', existing ? 'already_recorded' : 'recorded', clone(record), {
      issuerId,
      warnings,
      recordedAt: now.toISOString(),
    });
    this.recordAudit(result.event);
    return result;
  }

  revokeCommitment(input: RevokeCommitmentInput): AgidRegistryMutationResult<AgidRegistryRevocationRecord> {
    const privateErrors = collectAgidRegistryPrivateMaterialErrors(input);
    const commitment = normalizeCommitment(input.commitment ?? input.revocationCommitment);
    const now = new Date();
    const errors = [...privateErrors];
    if (!commitment) errors.push('commitment is required');

    if (errors.length > 0) {
      const result = mutationResult<AgidRegistryRevocationRecord>('revoke-commitment', 'rejected', undefined, {
        subjectCommitment: commitment,
        errors,
        recordedAt: now.toISOString(),
      });
      this.recordAudit(result.event);
      return result;
    }

    const existing = this.revoked.get(commitment);
    const requestedType = normalizeText(input.commitmentType);
    const commitmentType = ['credential', 'address-reference', 'aoid', 'agid', 'issuer-scoped'].includes(requestedType)
      ? requestedType as AgidRegistryRevocationRecord['commitmentType']
      : 'unknown';
    const record: AgidRegistryRevocationRecord = {
      commitment,
      commitmentType,
      reason: normalizeText(input.reason) || undefined,
      issuerId: normalizeId(input.issuerId) || undefined,
      revokedAt: existing?.revokedAt ?? normalizeIso(input.revokedAt, now),
      sourceIds: normalizeSourceIds(input.sourceIds),
    };
    this.revoked.set(commitment, record);

    const result = mutationResult('revoke-commitment', existing ? 'already_recorded' : 'recorded', clone(record), {
      subjectCommitment: commitment,
      issuerId: record.issuerId,
      recordedAt: now.toISOString(),
    });
    this.recordAudit(result.event);
    return result;
  }

  anchorFreshnessRoot(input: AnchorFreshnessRootInput): AgidRegistryMutationResult<AgidRegistryFreshnessRootRecord> {
    const privateErrors = collectAgidRegistryPrivateMaterialErrors(input);
    const freshnessRoot = normalizeCommitment(input.freshnessRoot ?? input.root);
    const registryId = normalizeId(input.registryId) || 'default';
    const now = new Date();
    const freshUntilDate = parseDate(input.freshUntil);
    const errors = [...privateErrors];
    if (!freshnessRoot) errors.push('freshnessRoot is required');
    if (!freshUntilDate) errors.push('freshUntil is required and must be an ISO date');

    if (errors.length > 0) {
      const result = mutationResult<AgidRegistryFreshnessRootRecord>('anchor-freshness-root', 'rejected', undefined, {
        subjectCommitment: freshnessRoot,
        issuerId: normalizeId(input.issuerId) || undefined,
        errors,
        recordedAt: now.toISOString(),
      });
      this.recordAudit(result.event);
      return result;
    }

    const existing = this.freshnessRoots.get(freshnessRoot);
    const record: AgidRegistryFreshnessRootRecord = {
      freshnessRoot,
      registryId,
      issuerId: normalizeId(input.issuerId) || undefined,
      anchoredAt: existing?.anchoredAt ?? normalizeIso(input.anchoredAt, now),
      freshUntil: freshUntilDate!.toISOString(),
      sourceIds: normalizeSourceIds(input.sourceIds),
    };
    this.freshnessRoots.set(freshnessRoot, record);

    const result = mutationResult('anchor-freshness-root', existing ? 'already_recorded' : 'recorded', clone(record), {
      subjectCommitment: freshnessRoot,
      issuerId: record.issuerId,
      recordedAt: now.toISOString(),
    });
    this.recordAudit(result.event);
    return result;
  }

  verify(input: AgidRegistryVerifyInput & Record<string, unknown>): AgidRegistryVerifyResult {
    const privateErrors = collectAgidRegistryPrivateMaterialErrors(input);
    const checkedAtDate = parseDate(input.now) ?? new Date();
    const checkedAt = checkedAtDate.toISOString();
    const errors = [...privateErrors];
    const warnings: string[] = [];
    const issuerId = normalizeId(input.issuerId);
    const issuer = issuerId ? this.issuers.get(issuerId) : undefined;

    if (issuerId && !issuer) {
      errors.push('issuer-not-registered');
    } else if (issuer?.status === 'suspended') {
      errors.push('issuer-suspended');
    } else if (issuer?.status === 'revoked') {
      errors.push('issuer-revoked');
    }

    const commitments = unique([
      normalizeCommitment(input.credentialCommitment),
      normalizeCommitment(input.addressReferenceCommitment),
      normalizeCommitment(input.aoidCommitment),
      normalizeCommitment(input.agidCommitment),
      normalizeCommitment(input.revocationCommitment),
      ...(Array.isArray(input.commitments) ? input.commitments.map(normalizeCommitment) : []),
    ]);

    if (commitments.length === 0 && !issuerId && !input.freshnessRoot && !input.nullifierHash) {
      errors.push('registry-check-public-identifier-required');
    }

    const revokedCommitments = commitments.filter(commitment => this.revoked.has(commitment));
    if (revokedCommitments.length > 0) errors.push('commitment-revoked');

    const freshnessRoot = normalizeCommitment(input.freshnessRoot);
    const anchoredFreshness = freshnessRoot ? this.freshnessRoots.get(freshnessRoot) : undefined;
    const providedFreshUntil = parseDate(input.freshUntil);
    const effectiveFreshUntil = providedFreshUntil ?? (anchoredFreshness ? parseDate(anchoredFreshness.freshUntil) : null);
    const freshness = {
      root: freshnessRoot || undefined,
      anchored: Boolean(anchoredFreshness),
      fresh: effectiveFreshUntil ? effectiveFreshUntil.getTime() >= checkedAtDate.getTime() : !freshnessRoot,
      freshUntil: effectiveFreshUntil?.toISOString(),
    };
    if (freshnessRoot && !anchoredFreshness) {
      if (input.requireAnchoredFreshnessRoot) errors.push('freshness-root-not-anchored');
      else warnings.push('freshness-root-not-anchored');
    }
    if (!freshness.fresh) errors.push('freshness-window-stale');

    const scope = normalizeId(input.scope) || 'default';
    const nullifierHash = normalizeCommitment(input.nullifierHash);
    const nullifier = nullifierHash ? this.nullifiers.get(nullifierKey(scope, nullifierHash)) : undefined;
    if (nullifier) errors.push('nullifier-already-used');

    const valid = errors.length === 0;
    const event = mutationEvent('verify', valid ? 'verified' : 'invalid', {
      subjectCommitment: commitments[0] ?? freshnessRoot ?? nullifierHash,
      issuerId: issuerId || undefined,
      scope: nullifierHash ? scope : undefined,
      errors,
      warnings,
      recordedAt: checkedAt,
    });
    this.recordAudit(event);

    return {
      mode: AGID_REGISTRY_MODE,
      modeVersion: AGID_REGISTRY_API_VERSION,
      valid,
      checkedAt,
      errors: unique(errors),
      warnings: unique(warnings),
      issuer: issuer ? {
        issuerId: issuer.issuerId,
        status: issuer.status,
        trustScore: issuer.trustScore,
      } : undefined,
      revokedCommitments,
      freshness,
      nullifier: nullifierHash ? {
        scope,
        used: Boolean(nullifier),
        usedAt: nullifier?.usedAt,
      } : undefined,
      matchedRecords: {
        commitmentCount: commitments.length,
        revokedCount: revokedCommitments.length,
      },
      privacy: safePrivacy(),
    };
  }

  markNullifierUsed(input: MarkNullifierUsedInput): AgidRegistryMutationResult<AgidRegistryNullifierRecord> {
    const privateErrors = collectAgidRegistryPrivateMaterialErrors(input);
    const nullifierHash = normalizeCommitment(input.nullifierHash);
    const scope = normalizeId(input.scope) || 'default';
    const now = new Date();
    const errors = [...privateErrors];
    if (!nullifierHash) errors.push('nullifierHash is required');

    if (errors.length > 0) {
      const result = mutationResult<AgidRegistryNullifierRecord>('mark-nullifier-used', 'rejected', undefined, {
        subjectCommitment: nullifierHash,
        scope,
        errors,
        recordedAt: now.toISOString(),
      });
      this.recordAudit(result.event);
      return result;
    }

    const key = nullifierKey(scope, nullifierHash);
    const existing = this.nullifiers.get(key);
    if (existing) {
      const result = mutationResult('mark-nullifier-used', 'duplicate', clone(existing), {
        subjectCommitment: nullifierHash,
        issuerId: existing.issuerId,
        scope,
        errors: ['nullifier-already-used'],
        recordedAt: now.toISOString(),
      });
      this.recordAudit(result.event);
      return result;
    }

    const record: AgidRegistryNullifierRecord = {
      nullifierHash,
      scope,
      issuerId: normalizeId(input.issuerId) || undefined,
      usedAt: normalizeIso(input.usedAt, now),
      expiresAt: parseDate(input.expiresAt)?.toISOString(),
      sourceIds: normalizeSourceIds(input.sourceIds),
    };
    this.nullifiers.set(key, record);

    const result = mutationResult('mark-nullifier-used', 'recorded', clone(record), {
      subjectCommitment: nullifierHash,
      issuerId: record.issuerId,
      scope,
      recordedAt: now.toISOString(),
    });
    this.recordAudit(result.event);
    return result;
  }

  private recordAudit(event: AgidRegistryAuditEvent) {
    this.audit.push(event);
    if (this.audit.length > AUDIT_LIMIT) {
      this.audit = this.audit.slice(-AUDIT_LIMIT);
    }
  }
}

export function createInMemoryAgidRegistryApiStore(snapshot?: Partial<AgidRegistrySnapshot>) {
  return new InMemoryAgidRegistryApiStore(snapshot);
}

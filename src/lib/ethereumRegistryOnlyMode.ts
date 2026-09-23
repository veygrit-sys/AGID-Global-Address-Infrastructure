import { sha256Hex } from './sha256';

export const ETHEREUM_REGISTRY_ONLY_MODE_VERSION = 'ethereum-registry-only-mode-v1';

export type EthereumRegistryOnlyMode = 'ethereum-registry-only';
export type EthereumRegistryOnlyExecutionMode = 'planned' | 'observed';
export type EthereumRegistryOnlyOperationKind =
  | 'register-issuer'
  | 'anchor-revocation-root'
  | 'mark-nullifier-used'
  | 'record-payment';
export type EthereumRegistryOnlyContractRole =
  | 'issuer-registry'
  | 'revocation-registry'
  | 'nullifier-registry'
  | 'payment-escrow';
export type EthereumRegistryOnlyRecordStatus =
  | 'recorded'
  | 'already_recorded'
  | 'duplicate'
  | 'rejected';
export type EthereumIssuerStatus = 'active' | 'suspended' | 'revoked';
export type EthereumPaymentStatus = 'authorized' | 'escrowed' | 'released' | 'refunded' | 'cancelled';

export type EthereumRegistryOnlyCapabilities = {
  modeVersion: typeof ETHEREUM_REGISTRY_ONLY_MODE_VERSION;
  mode: EthereumRegistryOnlyMode;
  zkEnabled: false;
  ethereumEnabled: true;
  publicLedgerEnabled: true;
  localOnly: false;
  serverRegistryRequired: false;
  gasRequired: true;
  supportedContracts: EthereumRegistryOnlyContractRole[];
  supportedOperations: EthereumRegistryOnlyOperationKind[];
  storesRawAddress: false;
  storesRawAgid: false;
  storesRawAoid: false;
  storesAgidSecureCiphertext: false;
  privacyModel: {
    publishOnly: string[];
    neverPublish: string[];
    knownRisks: string[];
    mitigations: string[];
  };
};

export type EthereumRegistryOnlyPrivacy = {
  modeVersion: typeof ETHEREUM_REGISTRY_ONLY_MODE_VERSION;
  rawAddressStored: false;
  rawAgidStored: false;
  rawAoidStored: false;
  rawPhoneStored: false;
  rawPersonalNameStored: false;
  agidSecureCiphertextStored: false;
  zkProofRequired: false;
  publicLedgerWritten: boolean;
  allowedPublicMaterial: string[];
  forbiddenPrivateMaterial: string[];
  metadataLeakageRisks: string[];
  mitigations: string[];
};

export type EthereumRegistryOnlyTxPlan = {
  modeVersion: typeof ETHEREUM_REGISTRY_ONLY_MODE_VERSION;
  mode: EthereumRegistryOnlyMode;
  operationId: string;
  operation: EthereumRegistryOnlyOperationKind;
  networkId: string;
  contractRole: EthereumRegistryOnlyContractRole;
  contractAddress: string | null;
  method: string;
  publicArguments: Record<string, string | number | boolean | null>;
  callDataHash: string;
  estimatedGasUnits: number;
  gasRequired: true;
  zkProofRequired: false;
  chainWriteRequired: true;
  executionMode: EthereumRegistryOnlyExecutionMode;
  observedTxHash: string | null;
  warnings: string[];
  privacy: EthereumRegistryOnlyPrivacy;
};

export type EthereumIssuerRegistryRecord = {
  modeVersion: typeof ETHEREUM_REGISTRY_ONLY_MODE_VERSION;
  issuerId: string;
  issuerAddress: string;
  issuerStatus: EthereumIssuerStatus;
  issuerPublicKeyCommitment: string | null;
  metadataHash: string | null;
  policyHash: string | null;
  registeredAt: string;
  updatedAt: string;
  operationId: string;
  observedTxHash: string | null;
};

export type EthereumRevocationAnchorRecord = {
  modeVersion: typeof ETHEREUM_REGISTRY_ONLY_MODE_VERSION;
  anchorId: string;
  registryId: string;
  issuerId: string | null;
  revocationRoot: string;
  freshnessRoot: string | null;
  validUntil: string | null;
  anchoredAt: string;
  operationId: string;
  observedTxHash: string | null;
};

export type EthereumNullifierRecord = {
  modeVersion: typeof ETHEREUM_REGISTRY_ONLY_MODE_VERSION;
  nullifierHash: string;
  scope: string;
  usedAt: string;
  operationId: string;
  observedTxHash: string | null;
};

export type EthereumPaymentRecord = {
  modeVersion: typeof ETHEREUM_REGISTRY_ONLY_MODE_VERSION;
  paymentId: string;
  escrowId: string;
  payerCommitment: string;
  payeeCommitment: string;
  purposeHash: string | null;
  tokenSymbol: string | null;
  tokenContract: string | null;
  amount: string | null;
  paymentStatus: EthereumPaymentStatus;
  recordedAt: string;
  operationId: string;
  observedTxHash: string | null;
};

export type EthereumRegistryOnlySnapshot = {
  modeVersion: typeof ETHEREUM_REGISTRY_ONLY_MODE_VERSION;
  mode: EthereumRegistryOnlyMode;
  issuers: EthereumIssuerRegistryRecord[];
  revocationAnchors: EthereumRevocationAnchorRecord[];
  nullifiers: EthereumNullifierRecord[];
  payments: EthereumPaymentRecord[];
  privacy: EthereumRegistryOnlyPrivacy;
};

export type EthereumRegistryOnlyResult<TRecord> = {
  modeVersion: typeof ETHEREUM_REGISTRY_ONLY_MODE_VERSION;
  mode: EthereumRegistryOnlyMode;
  status: EthereumRegistryOnlyRecordStatus;
  record: TRecord | null;
  txPlan: EthereumRegistryOnlyTxPlan | null;
  errors: string[];
  warnings: string[];
  privacy: EthereumRegistryOnlyPrivacy;
};

export type EthereumRegistryOnlyBaseInput = {
  networkId?: string;
  contractAddress?: string;
  observedTxHash?: string;
  now?: Date | string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type EthereumIssuerRegistrationInput = EthereumRegistryOnlyBaseInput & {
  issuerId?: string;
  issuerAddress?: string;
  issuerStatus?: EthereumIssuerStatus;
  issuerPublicKeyCommitment?: string;
  metadataHash?: string;
  policyHash?: string;
};

export type EthereumRevocationAnchorInput = EthereumRegistryOnlyBaseInput & {
  registryId?: string;
  issuerId?: string;
  revocationRoot?: string;
  freshnessRoot?: string;
  validUntil?: Date | string;
};

export type EthereumNullifierMarkUsedInput = EthereumRegistryOnlyBaseInput & {
  nullifierHash?: string;
  scope?: string;
};

export type EthereumPaymentRecordInput = EthereumRegistryOnlyBaseInput & {
  paymentId?: string;
  escrowId?: string;
  payerCommitment?: string;
  payeeCommitment?: string;
  purposeHash?: string;
  tokenSymbol?: string;
  tokenContract?: string;
  amount?: string | number;
  paymentStatus?: EthereumPaymentStatus;
};

const DEFAULT_NETWORK_ID = 'ethereum-l2-generic';

const GAS_ESTIMATES: Record<EthereumRegistryOnlyOperationKind, number> = {
  'register-issuer': 90_000,
  'anchor-revocation-root': 75_000,
  'mark-nullifier-used': 55_000,
  'record-payment': 110_000,
};

const OPERATION_CONTRACTS: Record<EthereumRegistryOnlyOperationKind, EthereumRegistryOnlyContractRole> = {
  'register-issuer': 'issuer-registry',
  'anchor-revocation-root': 'revocation-registry',
  'mark-nullifier-used': 'nullifier-registry',
  'record-payment': 'payment-escrow',
};

const OPERATION_METHODS: Record<EthereumRegistryOnlyOperationKind, string> = {
  'register-issuer': 'registerIssuer',
  'anchor-revocation-root': 'anchorRevocationFreshnessRoot',
  'mark-nullifier-used': 'markNullifierUsed',
  'record-payment': 'recordPayment',
};

const FORBIDDEN_PRIVATE_KEYS = new Set([
  'address',
  'addresstext',
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
  'agidsecureciphertext',
  'ciphertext',
  'encryptedpayload',
  'recipient',
  'recipientname',
  'name',
  'fullname',
  'phone',
  'telephone',
  'phonenumber',
  'email',
  'building',
  'room',
  'unit',
  'apartment',
  'postcode',
  'postalcode',
  'latitude',
  'longitude',
  'lat',
  'lng',
  'lon',
  'coordinates',
]);

const PUBLIC_TEXT_VALUE_KEYS = new Set([
  'issuerid',
  'issuerstatus',
  'registryid',
  'networkid',
  'scope',
  'paymentid',
  'escrowid',
  'tokensymbol',
  'contractaddress',
  'observedtxhash',
]);

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value: unknown) {
  const text = String(value ?? '').normalize('NFKC').trim();
  return text.length > 0 ? text : null;
}

function normalizeIsoDate(value: unknown, fallback = new Date().toISOString()) {
  if (value === undefined || value === null || value === '') return fallback;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function normalizeNetworkId(value: unknown) {
  return normalizeText(value) ?? DEFAULT_NETWORK_ID;
}

function normalizeHashLike(value: unknown) {
  const text = normalizeText(value);
  if (!text) return null;
  return text.startsWith('0x') ? text.toLowerCase() : text;
}

function normalizeIssuerStatus(value: unknown): EthereumIssuerStatus {
  const text = normalizeText(value)?.toLowerCase();
  if (text === 'suspended' || text === 'revoked') return text;
  return 'active';
}

function normalizePaymentStatus(value: unknown): EthereumPaymentStatus {
  const text = normalizeText(value)?.toLowerCase();
  if (text === 'escrowed' || text === 'released' || text === 'refunded' || text === 'cancelled') {
    return text;
  }
  return 'authorized';
}

function forbiddenKeyName(key: string) {
  return key.normalize('NFKC').replace(/[\s_-]/g, '').toLowerCase();
}

function lastPathKey(path: string) {
  const match = path.match(/(?:^|\.)([^.[\]]+)$/u);
  return match ? forbiddenKeyName(match[1]) : '';
}

function collectPrivateMaterialErrors(value: unknown, path = 'input'): string[] {
  const errors: string[] = [];

  if (typeof value === 'string') {
    if (PUBLIC_TEXT_VALUE_KEYS.has(lastPathKey(path))) return errors;
    const text = value.trim();
    if (/\bA(?:GID|OID)[-_][A-Z0-9]/i.test(text)) errors.push(`${path}:raw-agid-or-aoid-like-value`);
    if (/^\s*[-+]?\d{1,2}\.\d+\s*,\s*[-+]?\d{1,3}\.\d+\s*$/.test(text)) errors.push(`${path}:raw-coordinate-like-value`);
    return errors;
  }

  if (Array.isArray(value)) {
    value.forEach((child, index) => {
      errors.push(...collectPrivateMaterialErrors(child, `${path}[${index}]`));
    });
    return errors;
  }

  if (!isRecord(value)) return errors;

  Object.entries(value).forEach(([key, child]) => {
    const keyName = forbiddenKeyName(key);
    const childPath = `${path}.${key}`;
    if (FORBIDDEN_PRIVATE_KEYS.has(keyName)) {
      errors.push(`${childPath}:private-material-field-not-allowed`);
      return;
    }
    errors.push(...collectPrivateMaterialErrors(child, childPath));
  });

  return errors;
}

function publicPrivacy(publicLedgerWritten: boolean): EthereumRegistryOnlyPrivacy {
  return {
    modeVersion: ETHEREUM_REGISTRY_ONLY_MODE_VERSION,
    rawAddressStored: false,
    rawAgidStored: false,
    rawAoidStored: false,
    rawPhoneStored: false,
    rawPersonalNameStored: false,
    agidSecureCiphertextStored: false,
    zkProofRequired: false,
    publicLedgerWritten,
    allowedPublicMaterial: [
      'issuer addresses and issuer status',
      'salted commitments',
      'revocation and freshness roots',
      'nullifier hashes',
      'payment or escrow metadata commitments',
      'transaction hashes',
    ],
    forbiddenPrivateMaterial: [
      'raw address text',
      'raw AGID',
      'raw AOID',
      'AGID-S ciphertext',
      'latitude/longitude',
      'building, room, postal code, recipient name, phone, email',
    ],
    metadataLeakageRisks: [
      'issuer activity timing can be observed',
      'nullifier use timing can reveal operational volume',
      'payment flows can reveal counterparties when wallet hygiene is weak',
      'gas cost and congestion can slow critical flows',
    ],
    mitigations: [
      'batch registry writes when possible',
      'use relayers or paymasters for sensitive operations',
      'rotate operational wallets by domain',
      'store only commitments and roots on-chain',
      'keep AGID/AOID/AGID-S material off-chain',
    ],
  };
}

function buildOperationId(kind: EthereumRegistryOnlyOperationKind, args: Record<string, unknown>) {
  const hash = sha256Hex(stableJson({
    modeVersion: ETHEREUM_REGISTRY_ONLY_MODE_VERSION,
    kind,
    args,
  }));
  return `ETH3-${hash.slice(0, 24).toUpperCase()}`;
}

function buildTxPlan(input: {
  kind: EthereumRegistryOnlyOperationKind;
  networkId?: string;
  contractAddress?: string | null;
  observedTxHash?: string | null;
  publicArguments: Record<string, string | number | boolean | null>;
  warnings?: string[];
}): EthereumRegistryOnlyTxPlan {
  const operationId = buildOperationId(input.kind, input.publicArguments);
  const observedTxHash = normalizeHashLike(input.observedTxHash);
  const callDataHash = sha256Hex(stableJson({
    operation: input.kind,
    method: OPERATION_METHODS[input.kind],
    publicArguments: input.publicArguments,
  }));

  return {
    modeVersion: ETHEREUM_REGISTRY_ONLY_MODE_VERSION,
    mode: 'ethereum-registry-only',
    operationId,
    operation: input.kind,
    networkId: normalizeNetworkId(input.networkId),
    contractRole: OPERATION_CONTRACTS[input.kind],
    contractAddress: normalizeText(input.contractAddress),
    method: OPERATION_METHODS[input.kind],
    publicArguments: clone(input.publicArguments),
    callDataHash,
    estimatedGasUnits: GAS_ESTIMATES[input.kind],
    gasRequired: true,
    zkProofRequired: false,
    chainWriteRequired: true,
    executionMode: observedTxHash ? 'observed' : 'planned',
    observedTxHash,
    warnings: [...(input.warnings ?? [])],
    privacy: publicPrivacy(Boolean(observedTxHash)),
  };
}

function rejectedResult<TRecord>(errors: string[], warnings: string[] = []): EthereumRegistryOnlyResult<TRecord> {
  return {
    modeVersion: ETHEREUM_REGISTRY_ONLY_MODE_VERSION,
    mode: 'ethereum-registry-only',
    status: 'rejected',
    record: null,
    txPlan: null,
    errors: Array.from(new Set(errors)),
    warnings,
    privacy: publicPrivacy(false),
  };
}

function requirePublicOnly(input: unknown) {
  const errors = collectPrivateMaterialErrors(input);
  return errors.length > 0 ? ['raw-private-material-not-allowed-in-mode3', ...errors] : [];
}

export function getEthereumRegistryOnlyCapabilities(): EthereumRegistryOnlyCapabilities {
  return {
    modeVersion: ETHEREUM_REGISTRY_ONLY_MODE_VERSION,
    mode: 'ethereum-registry-only',
    zkEnabled: false,
    ethereumEnabled: true,
    publicLedgerEnabled: true,
    localOnly: false,
    serverRegistryRequired: false,
    gasRequired: true,
    supportedContracts: [
      'issuer-registry',
      'revocation-registry',
      'nullifier-registry',
      'payment-escrow',
    ],
    supportedOperations: [
      'register-issuer',
      'anchor-revocation-root',
      'mark-nullifier-used',
      'record-payment',
    ],
    storesRawAddress: false,
    storesRawAgid: false,
    storesRawAoid: false,
    storesAgidSecureCiphertext: false,
    privacyModel: {
      publishOnly: publicPrivacy(true).allowedPublicMaterial,
      neverPublish: publicPrivacy(true).forbiddenPrivateMaterial,
      knownRisks: publicPrivacy(true).metadataLeakageRisks,
      mitigations: publicPrivacy(true).mitigations,
    },
  };
}

export class InMemoryEthereumRegistryOnlyStore {
  private readonly issuers = new Map<string, EthereumIssuerRegistryRecord>();
  private readonly revocationAnchors = new Map<string, EthereumRevocationAnchorRecord>();
  private readonly nullifiers = new Map<string, EthereumNullifierRecord>();
  private readonly payments = new Map<string, EthereumPaymentRecord>();

  getSnapshot(): EthereumRegistryOnlySnapshot {
    return {
      modeVersion: ETHEREUM_REGISTRY_ONLY_MODE_VERSION,
      mode: 'ethereum-registry-only',
      issuers: Array.from(this.issuers.values()).map(clone),
      revocationAnchors: Array.from(this.revocationAnchors.values()).map(clone),
      nullifiers: Array.from(this.nullifiers.values()).map(clone),
      payments: Array.from(this.payments.values()).map(clone),
      privacy: publicPrivacy(false),
    };
  }

  registerIssuer(input: EthereumIssuerRegistrationInput): EthereumRegistryOnlyResult<EthereumIssuerRegistryRecord> {
    const privateMaterialErrors = requirePublicOnly(input);
    if (privateMaterialErrors.length > 0) return rejectedResult(privateMaterialErrors);

    const issuerId = normalizeText(input.issuerId);
    const issuerAddress = normalizeText(input.issuerAddress);
    if (!issuerId || !issuerAddress) {
      return rejectedResult(['issuerId-and-issuerAddress-required']);
    }

    const nowIso = normalizeIsoDate(input.now);
    const status = normalizeIssuerStatus(input.issuerStatus);
    const publicArguments = {
      issuerId,
      issuerAddress,
      issuerStatus: status,
      issuerPublicKeyCommitment: normalizeHashLike(input.issuerPublicKeyCommitment),
      metadataHash: normalizeHashLike(input.metadataHash),
      policyHash: normalizeHashLike(input.policyHash),
    };
    const txPlan = buildTxPlan({
      kind: 'register-issuer',
      networkId: input.networkId,
      contractAddress: input.contractAddress,
      observedTxHash: input.observedTxHash,
      publicArguments,
    });

    const existing = this.issuers.get(issuerId);
    const record: EthereumIssuerRegistryRecord = {
      modeVersion: ETHEREUM_REGISTRY_ONLY_MODE_VERSION,
      issuerId,
      issuerAddress,
      issuerStatus: status,
      issuerPublicKeyCommitment: normalizeHashLike(input.issuerPublicKeyCommitment),
      metadataHash: normalizeHashLike(input.metadataHash),
      policyHash: normalizeHashLike(input.policyHash),
      registeredAt: existing?.registeredAt ?? nowIso,
      updatedAt: nowIso,
      operationId: txPlan.operationId,
      observedTxHash: txPlan.observedTxHash,
    };

    this.issuers.set(issuerId, record);

    return {
      modeVersion: ETHEREUM_REGISTRY_ONLY_MODE_VERSION,
      mode: 'ethereum-registry-only',
      status: existing ? 'already_recorded' : 'recorded',
      record: clone(record),
      txPlan,
      errors: [],
      warnings: txPlan.executionMode === 'planned'
        ? ['ethereum-transaction-not-submitted-yet']
        : [],
      privacy: txPlan.privacy,
    };
  }

  anchorRevocationRoot(input: EthereumRevocationAnchorInput): EthereumRegistryOnlyResult<EthereumRevocationAnchorRecord> {
    const privateMaterialErrors = requirePublicOnly(input);
    if (privateMaterialErrors.length > 0) return rejectedResult(privateMaterialErrors);

    const registryId = normalizeText(input.registryId) ?? 'default-revocation-registry';
    const revocationRoot = normalizeHashLike(input.revocationRoot);
    if (!revocationRoot) return rejectedResult(['revocationRoot-required']);

    const issuerId = normalizeText(input.issuerId);
    const freshnessRoot = normalizeHashLike(input.freshnessRoot);
    const validUntil = input.validUntil ? normalizeIsoDate(input.validUntil, '') : null;
    const publicArguments = {
      registryId,
      issuerId,
      revocationRoot,
      freshnessRoot,
      validUntil,
    };
    const txPlan = buildTxPlan({
      kind: 'anchor-revocation-root',
      networkId: input.networkId,
      contractAddress: input.contractAddress,
      observedTxHash: input.observedTxHash,
      publicArguments,
    });
    const anchorHash = sha256Hex(stableJson(publicArguments));
    const record: EthereumRevocationAnchorRecord = {
      modeVersion: ETHEREUM_REGISTRY_ONLY_MODE_VERSION,
      anchorId: `ETH3-ANCHOR-${anchorHash.slice(0, 20).toUpperCase()}`,
      registryId,
      issuerId,
      revocationRoot,
      freshnessRoot,
      validUntil,
      anchoredAt: normalizeIsoDate(input.now),
      operationId: txPlan.operationId,
      observedTxHash: txPlan.observedTxHash,
    };

    const existing = this.revocationAnchors.get(record.anchorId);
    this.revocationAnchors.set(record.anchorId, record);

    return {
      modeVersion: ETHEREUM_REGISTRY_ONLY_MODE_VERSION,
      mode: 'ethereum-registry-only',
      status: existing ? 'already_recorded' : 'recorded',
      record: clone(record),
      txPlan,
      errors: [],
      warnings: txPlan.executionMode === 'planned'
        ? ['ethereum-transaction-not-submitted-yet']
        : [],
      privacy: txPlan.privacy,
    };
  }

  markNullifierUsed(input: EthereumNullifierMarkUsedInput): EthereumRegistryOnlyResult<EthereumNullifierRecord> {
    const privateMaterialErrors = requirePublicOnly(input);
    if (privateMaterialErrors.length > 0) return rejectedResult(privateMaterialErrors);

    const nullifierHash = normalizeHashLike(input.nullifierHash);
    const scope = normalizeText(input.scope);
    if (!nullifierHash || !scope) return rejectedResult(['nullifierHash-and-scope-required']);

    const registryKey = sha256Hex(`${ETHEREUM_REGISTRY_ONLY_MODE_VERSION}:nullifier:${scope}:${nullifierHash}`);
    const existing = this.nullifiers.get(registryKey);
    const publicArguments = {
      nullifierHash,
      scope,
      registryKeyHash: registryKey,
    };
    const txPlan = buildTxPlan({
      kind: 'mark-nullifier-used',
      networkId: input.networkId,
      contractAddress: input.contractAddress,
      observedTxHash: input.observedTxHash,
      publicArguments,
    });

    if (existing) {
      return {
        modeVersion: ETHEREUM_REGISTRY_ONLY_MODE_VERSION,
        mode: 'ethereum-registry-only',
        status: 'duplicate',
        record: clone(existing),
        txPlan,
        errors: ['nullifier-already-used'],
        warnings: ['duplicate-nullifier-rejected'],
        privacy: txPlan.privacy,
      };
    }

    const record: EthereumNullifierRecord = {
      modeVersion: ETHEREUM_REGISTRY_ONLY_MODE_VERSION,
      nullifierHash,
      scope,
      usedAt: normalizeIsoDate(input.now),
      operationId: txPlan.operationId,
      observedTxHash: txPlan.observedTxHash,
    };

    this.nullifiers.set(registryKey, record);

    return {
      modeVersion: ETHEREUM_REGISTRY_ONLY_MODE_VERSION,
      mode: 'ethereum-registry-only',
      status: 'recorded',
      record: clone(record),
      txPlan,
      errors: [],
      warnings: txPlan.executionMode === 'planned'
        ? ['ethereum-transaction-not-submitted-yet']
        : [],
      privacy: txPlan.privacy,
    };
  }

  recordPayment(input: EthereumPaymentRecordInput): EthereumRegistryOnlyResult<EthereumPaymentRecord> {
    const privateMaterialErrors = requirePublicOnly(input);
    if (privateMaterialErrors.length > 0) return rejectedResult(privateMaterialErrors);

    const payerCommitment = normalizeHashLike(input.payerCommitment);
    const payeeCommitment = normalizeHashLike(input.payeeCommitment);
    if (!payerCommitment || !payeeCommitment) {
      return rejectedResult(['payerCommitment-and-payeeCommitment-required']);
    }

    const escrowId = normalizeText(input.escrowId)
      ?? `ESCROW-${sha256Hex(`${payerCommitment}:${payeeCommitment}`).slice(0, 16).toUpperCase()}`;
    const paymentId = normalizeText(input.paymentId)
      ?? `PAY-${sha256Hex(`${escrowId}:${input.amount ?? ''}:${input.tokenSymbol ?? ''}`).slice(0, 16).toUpperCase()}`;
    const paymentStatus = normalizePaymentStatus(input.paymentStatus);
    const publicArguments = {
      paymentId,
      escrowId,
      payerCommitment,
      payeeCommitment,
      purposeHash: normalizeHashLike(input.purposeHash),
      tokenSymbol: normalizeText(input.tokenSymbol),
      tokenContract: normalizeHashLike(input.tokenContract),
      amount: input.amount === undefined || input.amount === null ? null : String(input.amount),
      paymentStatus,
    };
    const txPlan = buildTxPlan({
      kind: 'record-payment',
      networkId: input.networkId,
      contractAddress: input.contractAddress,
      observedTxHash: input.observedTxHash,
      publicArguments,
    });
    const existing = this.payments.get(paymentId);
    const record: EthereumPaymentRecord = {
      modeVersion: ETHEREUM_REGISTRY_ONLY_MODE_VERSION,
      paymentId,
      escrowId,
      payerCommitment,
      payeeCommitment,
      purposeHash: normalizeHashLike(input.purposeHash),
      tokenSymbol: normalizeText(input.tokenSymbol),
      tokenContract: normalizeHashLike(input.tokenContract),
      amount: input.amount === undefined || input.amount === null ? null : String(input.amount),
      paymentStatus,
      recordedAt: normalizeIsoDate(input.now),
      operationId: txPlan.operationId,
      observedTxHash: txPlan.observedTxHash,
    };

    this.payments.set(paymentId, record);

    return {
      modeVersion: ETHEREUM_REGISTRY_ONLY_MODE_VERSION,
      mode: 'ethereum-registry-only',
      status: existing ? 'already_recorded' : 'recorded',
      record: clone(record),
      txPlan,
      errors: [],
      warnings: [
        ...(txPlan.executionMode === 'planned' ? ['ethereum-transaction-not-submitted-yet'] : []),
        'payment-wallet-metadata-can-still-leak-on-public-ledgers',
      ],
      privacy: txPlan.privacy,
    };
  }
}

export function createInMemoryEthereumRegistryOnlyStore() {
  return new InMemoryEthereumRegistryOnlyStore();
}

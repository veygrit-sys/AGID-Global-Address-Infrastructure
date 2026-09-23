import { sha256Hex } from './sha256';
import { VEY_FINANCE_VERSION } from './veyFinance';

export const VEY_TRADING_VERSION = 'agid-vey-trading-market-execution-v1';
export const VEY_TRADE_GATEWAY_IDEMPOTENCY_VERSION = 'agid-vey-trade-gateway-idempotency-v1';
export const VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_SCHEMA_REF = '../schemas/vey-trade-gateway-idempotency-v0.1.schema.json';
export const VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_ID = 'vey-trade-gateway-idempotency-v0.1';
export const VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_STATUS = 'synthetic-local-fixture';
export const VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_BUILDER = 'buildVeyTradeGatewayIdempotencyFixture';
export const VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VERIFIER = 'npm run verify:vey-trade-gateway-idempotency-fixture-schema';
export const VEY_TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE = 'trade-gateway-local-idempotent-intent';
export const VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VECTOR_IDS = [
  'trade_gateway_intent_created_positive',
  'trade_gateway_intent_replayed_positive',
  'trade_gateway_intent_conflict_negative',
  'trade_gateway_intent_private_material_negative',
] as const;

export const VEY_TRADING_STATUSES = [
  'requires-listing',
  'requires-counterparty-kyc',
  'requires-compliance-screening',
  'requires-market-data',
  'quoted',
  'rfq-open',
  'match-ready',
  'requires-finance-intent',
  'requires-escrow',
  'ready-to-contract',
  'contract-pending',
  'in-escrow',
  'fulfilled',
  'settled',
  'requires-licensed-venue',
  'requires-review',
  'disputed',
  'rejected',
] as const;

export const VEY_TRADING_NEXT_ACTIONS = [
  'create-listing',
  'collect-counterparty-kyc',
  'run-compliance-screening',
  'attach-market-data',
  'open-rfq',
  'match-order',
  'create-finance-intent',
  'fund-escrow',
  'draft-contract',
  'sign-contract',
  'wait-for-fulfillment',
  'settle-trade',
  'route-to-licensed-venue',
  'manual-review',
  'none',
] as const;

export type VeyTradingStatus = typeof VEY_TRADING_STATUSES[number];
export type VeyTradingNextAction = typeof VEY_TRADING_NEXT_ACTIONS[number];
export type VeyTradingSide = 'buy' | 'sell' | 'broker';
export type VeyTradingAssetKind =
  | 'physical-goods'
  | 'resource-energy'
  | 'resource-mineral'
  | 'agricultural-commodity'
  | 'metal'
  | 'digital-asset'
  | 'license-ip'
  | 'futures-contract'
  | 'derivative'
  | 'escrow-only';
export type VeyTradingMarketMode =
  | 'catalog'
  | 'rfq'
  | 'spot-order'
  | 'auction'
  | 'order-book'
  | 'forward-contract'
  | 'futures-simulation'
  | 'licensed-futures-venue'
  | 'escrow';
export type VeyTradingEvidenceStatus = 'pending' | 'passed' | 'warning' | 'failed';
export type VeyTradingEvidenceType =
  | 'listing'
  | 'inventory'
  | 'market-data'
  | 'counterparty-kyc'
  | 'sanctions-screen'
  | 'export-control'
  | 'title-of-goods'
  | 'warehouse-receipt'
  | 'digital-asset-ownership'
  | 'license-rights'
  | 'licensed-venue'
  | 'finance-intent'
  | 'escrow'
  | 'delivery-pod'
  | 'manual-review';
export type VeyTradingRiskLevel = 'low' | 'medium' | 'high' | 'blocked';

export type VeyTradingEvidenceInput = {
  type?: unknown;
  status?: unknown;
  sourceId?: unknown;
  evidenceRef?: unknown;
  safeFingerprint?: unknown;
  observedAt?: unknown;
  signed?: unknown;
  rawAddress?: unknown;
  rawAgid?: unknown;
  rawAoid?: unknown;
  recipientName?: unknown;
  counterpartyName?: unknown;
  phone?: unknown;
  email?: unknown;
  privateKey?: unknown;
  seedPhrase?: unknown;
  walletPrivateKey?: unknown;
  bankAccount?: unknown;
  cardPan?: unknown;
  contractBody?: unknown;
  customsDocumentBody?: unknown;
};

export type VeyTradingInput = {
  id?: unknown;
  side?: unknown;
  assetKind?: unknown;
  marketMode?: unknown;
  listingAlias?: unknown;
  orderAlias?: unknown;
  assetAlias?: unknown;
  assetCommitment?: unknown;
  originCountry?: unknown;
  destinationCountry?: unknown;
  quantity?: unknown;
  unit?: unknown;
  unitPrice?: unknown;
  currency?: unknown;
  notionalLimit?: unknown;
  hsCode?: unknown;
  resourceGrade?: unknown;
  deliveryRequired?: unknown;
  financeIntentRef?: unknown;
  financeIntentVersion?: unknown;
  escrowRequired?: unknown;
  escrowFunded?: unknown;
  contractSigned?: unknown;
  fulfillmentConfirmed?: unknown;
  settlementConfirmed?: unknown;
  disputeOpen?: unknown;
  executionRequested?: unknown;
  highRiskMode?: unknown;
  evidence?: readonly VeyTradingEvidenceInput[];
  createdAt?: unknown;
  updatedAt?: unknown;
  rawAddress?: unknown;
  rawAgid?: unknown;
  rawAoid?: unknown;
  recipientName?: unknown;
  counterpartyName?: unknown;
  phone?: unknown;
  email?: unknown;
  privateKey?: unknown;
  seedPhrase?: unknown;
  walletPrivateKey?: unknown;
  bankAccount?: unknown;
  cardPan?: unknown;
  contractBody?: unknown;
  customsDocumentBody?: unknown;
};

export type VeyTradingEvidence = {
  type: VeyTradingEvidenceType;
  status: VeyTradingEvidenceStatus;
  sourceId?: string;
  evidenceRef?: string;
  safeFingerprint?: string;
  observedAt: string;
  signed: boolean;
};

export type VeyTradingQuote = {
  quantity: number;
  unit: string;
  unitPrice: number;
  currency: string;
  notional: number;
  notionalLimit?: number;
  priceIsExecutable: boolean;
};

export type VeyTradingComplianceProfile = {
  kycRequired: boolean;
  sanctionsScreenRequired: boolean;
  exportControlRequired: boolean;
  titleEvidenceRequired: boolean;
  warehouseReceiptRecommended: boolean;
  digitalOwnershipRequired: boolean;
  licensedVenueRequired: boolean;
  financeIntentRequired: boolean;
  escrowRequired: boolean;
  manualReviewRequired: boolean;
  prohibitedInLocalMode: boolean;
};

export type VeyTradingPrivacy = {
  rawAddressStored: false;
  rawAgidStored: false;
  rawAoidStored: false;
  rawCounterpartyStored: false;
  rawContactStored: false;
  privateKeyStored: false;
  bankAccountStored: false;
  cardPanStored: false;
  contractBodyStored: false;
  customsDocumentBodyStored: false;
  publicSurface: 'aliases-commitments-evidence-refs-quotes-state-and-risk-only';
};

export type VeyTradingIntent = {
  modelVersion: typeof VEY_TRADING_VERSION;
  id: string;
  concept: 'electronic-trading-company-not-retail-payment-app';
  side: VeyTradingSide;
  assetKind: VeyTradingAssetKind;
  marketMode: VeyTradingMarketMode;
  status: VeyTradingStatus;
  nextAction: VeyTradingNextAction;
  riskLevel: VeyTradingRiskLevel;
  createdAt: string;
  updatedAt: string;
  listingAlias?: string;
  orderAlias?: string;
  assetAlias?: string;
  assetCommitment?: string;
  originCountry: string;
  destinationCountry: string;
  hsCode?: string;
  resourceGrade?: string;
  quote: VeyTradingQuote;
  compliance: VeyTradingComplianceProfile;
  evidence: VeyTradingEvidence[];
  financeLink: {
    required: boolean;
    expectedVersion: typeof VEY_FINANCE_VERSION;
    financeIntentRef?: string;
    financeIntentVersion?: string;
  };
  lifecycle: {
    escrowFunded: boolean;
    contractSigned: boolean;
    fulfillmentConfirmed: boolean;
    settlementConfirmed: boolean;
    disputeOpen: boolean;
  };
  errors: string[];
  warnings: string[];
  manualReviewReasons: string[];
  requiredControls: string[];
  privacy: VeyTradingPrivacy;
};

export type VeyTradeGatewayIntentRequest = VeyTradingInput & {
  idempotencyKey?: unknown;
  operatorWorkspaceRef?: unknown;
  deliveryGatewayShipmentRef?: unknown;
  playlistCommerceIntentRef?: unknown;
  requestedAt?: unknown;
};

export type VeyTradeGatewaySafeRefs = {
  tradingIntentId: string;
  operatorWorkspaceRef?: string;
  deliveryGatewayShipmentRef?: string;
  playlistCommerceIntentRef?: string;
  financeIntentRef?: string;
  listingAlias?: string;
  orderAlias?: string;
};

export type VeyTradeGatewayIntentIdempotencyDecision = 'created' | 'replayed' | 'conflict' | 'rejected';
export type VeyTradeGatewayIdempotencyFixtureVectorId = typeof VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VECTOR_IDS[number];

export type VeyTradeGatewayIntentIdempotencyResult = {
  version: typeof VEY_TRADE_GATEWAY_IDEMPOTENCY_VERSION;
  ok: boolean;
  status: 201 | 400 | 409;
  decision: VeyTradeGatewayIntentIdempotencyDecision;
  replayed: boolean;
  attemptCount: number;
  idempotencyKey?: string;
  tradeGatewayIntentRef?: string;
  bodyFingerprintRef?: string;
  conflictRef?: string;
  safeRefs?: VeyTradeGatewaySafeRefs;
  intent?: VeyTradingIntent;
  errors: string[];
  warnings: string[];
  privacy: VeyTradingPrivacy;
  localOnly: true;
  productionTraffic: false;
  nonClaims: string[];
};

export type VeyTradeGatewayIdempotencyFixtureVector = {
  vectorId: VeyTradeGatewayIdempotencyFixtureVectorId;
  ok: boolean;
  decision: VeyTradeGatewayIntentIdempotencyDecision;
  httpStatus: 201 | 400 | 409;
  replayed: boolean;
  attemptCount: number;
  tradeGatewayIntentRef?: string;
  bodyFingerprintRef?: string;
  conflictRef?: string;
  safeRefs?: VeyTradeGatewaySafeRefs;
  errors: string[];
  warnings: string[];
  localOnly: true;
  productionTraffic: false;
  privateMaterialExposed: false;
  forbiddenValueMarkersFound: [];
  nonClaims: string[];
};

export type VeyTradeGatewayIdempotencyFixture = {
  $schema: typeof VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_SCHEMA_REF;
  fixtureId: typeof VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_ID;
  status: typeof VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_STATUS;
  source: {
    builder: typeof VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_BUILDER;
    verifier: typeof VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VERIFIER;
  };
  boundaryGateId: typeof VEY_TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE;
  privacy: {
    localOnly: true;
    productionTraffic: false;
    containsRawAddress: false;
    privateMaterialExposed: false;
  };
  vectors: VeyTradeGatewayIdempotencyFixtureVector[];
  forbiddenValueMarkers: string[];
  localOnly: true;
  productionTraffic: false;
  privateMaterialExposed: false;
  nonClaims: string[];
  validationErrors: [];
};

const DEFAULT_CREATED_AT = '2026-06-20T00:00:00.000Z';
const FORBIDDEN_INPUT_KEYS = [
  'rawAddress',
  'rawAgid',
  'rawAoid',
  'recipientName',
  'counterpartyName',
  'phone',
  'email',
  'privateKey',
  'seedPhrase',
  'walletPrivateKey',
  'bankAccount',
  'cardPan',
  'contractBody',
  'customsDocumentBody',
] as const;
const PRIVATE_ID_VALUE_RE = /\bA(?:GID|OID)[-_][A-Z0-9]{6,}\b/;
const PRIVATE_CONTACT_OR_COORD_VALUE_RE = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d ().-]{7,}\d|\b-?\d{1,2}\.\d{4,}[ \t]*,[ \t]*-?\d{1,3}\.\d{4,})/i;
const PUBLIC_TIMESTAMP_KEYS = ['createdAt', 'updatedAt', 'requestedAt', 'observedAt'] as const;
export const VEY_TRADE_GATEWAY_IDEMPOTENCY_FORBIDDEN_VALUE_MARKERS = [
  'rawAddressValue',
  'rawAgidValue',
  'rawAoidValue',
  'recipientNameValue',
  'counterpartyNameValue',
  'phoneValue',
  'emailValue',
  'privateKeyValue',
  'seedPhraseValue',
  'walletPrivateKeyValue',
  'bankAccountValue',
  'cardPanValue',
  'contractBodyValue',
  'customsDocumentBodyValue',
  'raw_address_value',
  'raw_agid_value',
  'raw_aoid_value',
  'recipient_name_value',
  'counterparty_name_value',
  'private_key_value',
  'wallet_private_key_value',
  'bank_account_value',
  'card_pan_value',
  'contract_body_value',
  'customs_document_body_value',
] as const;
const TRADE_GATEWAY_IDEMPOTENCY_NON_CLAIMS = [
  'local-only-idempotency-fixture-not-a-production-trading-venue',
  'does-not-execute-payments-settle-funds-clear-customs-or-provide-legal-or-financial-advice',
  'does-not-verify-identity-truth-or-sanctions-outcomes-beyond-caller-supplied-evidence-refs',
];

function clean(value: unknown, maxLength = 180) {
  const text = String(value ?? '').normalize('NFKC').trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function normalizeCountry(value: unknown) {
  const text = clean(value, 8).toUpperCase();
  return /^[A-Z]{2,3}$/.test(text) ? text : '';
}

function normalizeCurrency(value: unknown) {
  const text = clean(value, 12).toUpperCase();
  return /^[A-Z0-9]{2,12}$/.test(text) ? text : '';
}

function normalizeSide(value: unknown): VeyTradingSide {
  const text = clean(value).toLowerCase();
  if (text === 'sell' || text === 'broker') return text;
  return 'buy';
}

function normalizeAssetKind(value: unknown): VeyTradingAssetKind {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (
    text === 'resource-energy'
    || text === 'resource-mineral'
    || text === 'agricultural-commodity'
    || text === 'metal'
    || text === 'digital-asset'
    || text === 'license-ip'
    || text === 'futures-contract'
    || text === 'derivative'
    || text === 'escrow-only'
  ) return text;
  return 'physical-goods';
}

function normalizeMarketMode(value: unknown): VeyTradingMarketMode {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (
    text === 'rfq'
    || text === 'spot-order'
    || text === 'auction'
    || text === 'order-book'
    || text === 'forward-contract'
    || text === 'futures-simulation'
    || text === 'licensed-futures-venue'
    || text === 'escrow'
  ) return text;
  return 'catalog';
}

function validIsoOrDefault(value: unknown, fallback = DEFAULT_CREATED_AT) {
  const text = clean(value, 64);
  return text && !Number.isNaN(Date.parse(text)) ? text : fallback;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`)
    .join(',')}}`;
}

function compactHash(value: unknown, prefix: string) {
  return `${prefix}_${sha256Hex(stableJson(value)).slice(0, 24).toUpperCase()}`;
}

function numberInput(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return Math.round(value * 1000000) / 1000000;
  const text = clean(value, 40).replace(/,/g, '');
  if (!text) return 0;
  return /^(?:0|[1-9]\d*)(?:\.\d{1,8})?$/.test(text) ? Math.round(Number(text) * 1000000) / 1000000 : Number.NaN;
}

function money(value: unknown) {
  const amount = numberInput(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : amount;
}

function normalizeEvidenceType(value: unknown): VeyTradingEvidenceType | undefined {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (
    text === 'listing'
    || text === 'inventory'
    || text === 'market-data'
    || text === 'counterparty-kyc'
    || text === 'sanctions-screen'
    || text === 'export-control'
    || text === 'title-of-goods'
    || text === 'warehouse-receipt'
    || text === 'digital-asset-ownership'
    || text === 'license-rights'
    || text === 'licensed-venue'
    || text === 'finance-intent'
    || text === 'escrow'
    || text === 'delivery-pod'
    || text === 'manual-review'
  ) return text;
  if (text === 'kyc' || text === 'kyb') return 'counterparty-kyc';
  if (text === 'price' || text === 'oracle') return 'market-data';
  if (text === 'pod') return 'delivery-pod';
  return undefined;
}

function normalizeEvidenceStatus(value: unknown): VeyTradingEvidenceStatus {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (text === 'ok' || text === 'accepted' || text === 'verified' || text === 'complete') return 'passed';
  if (text === 'review' || text === 'needs-review' || text === 'partial') return 'warning';
  if (text === 'failed' || text === 'rejected' || text === 'invalid' || text === 'error' || text === 'blocked') return 'failed';
  if (text === 'pending') return 'pending';
  return 'passed';
}

function hasForbiddenValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return PRIVATE_ID_VALUE_RE.test(value) || PRIVATE_CONTACT_OR_COORD_VALUE_RE.test(value);
  if (typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasForbiddenValue);
  return Object.entries(value as Record<string, unknown>).some(([key, child]) => (
    (FORBIDDEN_INPUT_KEYS as readonly string[]).includes(key)
    || hasForbiddenValue(child)
  ));
}

function collectForbiddenInputPaths(value: unknown, path: string[] = []): string[] {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string') {
    const key = path[path.length - 1];
    if ((PUBLIC_TIMESTAMP_KEYS as readonly string[]).includes(key) && !Number.isNaN(Date.parse(value))) {
      return [];
    }
    return PRIVATE_ID_VALUE_RE.test(value) || PRIVATE_CONTACT_OR_COORD_VALUE_RE.test(value)
      ? [path.join('.') || 'value']
      : [];
  }
  if (typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((child, index) => collectForbiddenInputPaths(child, [...path, String(index)]));
  }

  const paths: string[] = [];
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const nextPath = [...path, key];
    if ((FORBIDDEN_INPUT_KEYS as readonly string[]).includes(key)) {
      paths.push(nextPath.join('.'));
      continue;
    }
    paths.push(...collectForbiddenInputPaths(child, nextPath));
  }
  return paths;
}

function normalizeEvidence(input: readonly VeyTradingEvidenceInput[] | undefined, now: string) {
  const evidence: VeyTradingEvidence[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const item of input ?? []) {
    if (hasForbiddenValue(item)) {
      errors.push('vey-trading-private-evidence-rejected');
      continue;
    }
    const type = normalizeEvidenceType(item.type);
    if (!type) {
      warnings.push('vey-trading-unknown-evidence-ignored');
      continue;
    }
    evidence.push({
      type,
      status: normalizeEvidenceStatus(item.status),
      ...(clean(item.sourceId, 80) ? { sourceId: clean(item.sourceId, 80) } : {}),
      ...(clean(item.evidenceRef, 120) ? { evidenceRef: clean(item.evidenceRef, 120) } : {}),
      ...(clean(item.safeFingerprint, 120) ? { safeFingerprint: clean(item.safeFingerprint, 120) } : {}),
      observedAt: validIsoOrDefault(item.observedAt, now),
      signed: Boolean(item.signed),
    });
  }

  return {
    evidence,
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings)),
  };
}

function evidencePassed(evidence: readonly VeyTradingEvidence[], type: VeyTradingEvidenceType) {
  return evidence.some((item) => item.type === type && item.status === 'passed');
}

function evidenceFailed(evidence: readonly VeyTradingEvidence[], type?: VeyTradingEvidenceType) {
  return evidence.some((item) => item.status === 'failed' && (!type || item.type === type));
}

function evidenceWarningOrPending(evidence: readonly VeyTradingEvidence[]) {
  return evidence.some((item) => item.status === 'warning' || item.status === 'pending');
}

function buildCompliance(input: {
  assetKind: VeyTradingAssetKind;
  marketMode: VeyTradingMarketMode;
  deliveryRequired: boolean;
  escrowRequired: boolean;
  notional: number;
  highRiskMode: boolean;
}): VeyTradingComplianceProfile {
  const futuresLike = input.assetKind === 'futures-contract'
    || input.assetKind === 'derivative'
    || input.marketMode === 'licensed-futures-venue'
    || input.marketMode === 'futures-simulation';
  const resourceLike = input.assetKind === 'resource-energy'
    || input.assetKind === 'resource-mineral'
    || input.assetKind === 'metal'
    || input.assetKind === 'agricultural-commodity';
  const digitalLike = input.assetKind === 'digital-asset' || input.assetKind === 'license-ip';
  const highValue = Number.isFinite(input.notional) && input.notional >= 10000;

  return {
    kycRequired: true,
    sanctionsScreenRequired: true,
    exportControlRequired: resourceLike
      || input.deliveryRequired
      || highValue && !futuresLike && !digitalLike && input.assetKind !== 'escrow-only',
    titleEvidenceRequired: input.assetKind !== 'escrow-only' && !futuresLike && !digitalLike,
    warehouseReceiptRecommended: resourceLike || input.assetKind === 'physical-goods',
    digitalOwnershipRequired: digitalLike,
    licensedVenueRequired: futuresLike && input.marketMode !== 'futures-simulation',
    financeIntentRequired: input.deliveryRequired || input.escrowRequired || resourceLike || highValue,
    escrowRequired: input.escrowRequired || highValue || input.assetKind === 'escrow-only',
    manualReviewRequired: input.highRiskMode || resourceLike || digitalLike || futuresLike || highValue,
    prohibitedInLocalMode: futuresLike && input.marketMode !== 'futures-simulation' && input.marketMode !== 'licensed-futures-venue',
  };
}

function riskLevel(input: {
  compliance: VeyTradingComplianceProfile;
  evidence: readonly VeyTradingEvidence[];
  errors: readonly string[];
}): VeyTradingRiskLevel {
  if (input.errors.length > 0 || evidenceFailed(input.evidence, 'sanctions-screen')) return 'blocked';
  if (input.compliance.licensedVenueRequired || input.compliance.manualReviewRequired) return 'high';
  if (input.compliance.financeIntentRequired || input.compliance.escrowRequired) return 'medium';
  return 'low';
}

function statusFor(input: {
  errors: readonly string[];
  compliance: VeyTradingComplianceProfile;
  evidence: readonly VeyTradingEvidence[];
  listingReady: boolean;
  quoteReady: boolean;
  financeReady: boolean;
  escrowFunded: boolean;
  contractSigned: boolean;
  fulfillmentConfirmed: boolean;
  settlementConfirmed: boolean;
  disputeOpen: boolean;
  executionRequested: boolean;
  marketMode: VeyTradingMarketMode;
}): VeyTradingStatus {
  if (input.errors.length > 0) return 'rejected';
  if (input.disputeOpen) return 'disputed';
  if (input.compliance.prohibitedInLocalMode && input.executionRequested) return 'rejected';
  if (input.compliance.licensedVenueRequired && !evidencePassed(input.evidence, 'licensed-venue')) {
    return 'requires-licensed-venue';
  }
  if (!input.listingReady) return 'requires-listing';
  if (!evidencePassed(input.evidence, 'counterparty-kyc')) return 'requires-counterparty-kyc';
  if (input.compliance.sanctionsScreenRequired && !evidencePassed(input.evidence, 'sanctions-screen')) {
    return 'requires-compliance-screening';
  }
  if (input.compliance.exportControlRequired && !evidencePassed(input.evidence, 'export-control')) {
    return 'requires-compliance-screening';
  }
  if (input.compliance.titleEvidenceRequired && !evidencePassed(input.evidence, 'title-of-goods')) {
    return 'requires-compliance-screening';
  }
  if (input.compliance.digitalOwnershipRequired
    && !evidencePassed(input.evidence, 'digital-asset-ownership')
    && !evidencePassed(input.evidence, 'license-rights')) {
    return 'requires-compliance-screening';
  }
  if (!input.quoteReady) return 'requires-market-data';
  if (evidenceFailed(input.evidence) || evidenceWarningOrPending(input.evidence) || input.compliance.manualReviewRequired && !evidencePassed(input.evidence, 'manual-review')) {
    return 'requires-review';
  }
  if (input.compliance.financeIntentRequired && !input.financeReady) return 'requires-finance-intent';
  if (input.compliance.escrowRequired && !input.escrowFunded) return 'requires-escrow';
  if (input.settlementConfirmed) return 'settled';
  if (input.fulfillmentConfirmed) return 'fulfilled';
  if (input.contractSigned && input.escrowFunded) return 'in-escrow';
  if (input.contractSigned) return 'contract-pending';
  if (input.marketMode === 'rfq') return 'rfq-open';
  if (input.marketMode === 'order-book' || input.marketMode === 'auction' || input.marketMode === 'spot-order') return 'match-ready';
  return 'ready-to-contract';
}

function nextActionFor(status: VeyTradingStatus): VeyTradingNextAction {
  switch (status) {
    case 'requires-listing': return 'create-listing';
    case 'requires-counterparty-kyc': return 'collect-counterparty-kyc';
    case 'requires-compliance-screening': return 'run-compliance-screening';
    case 'requires-market-data': return 'attach-market-data';
    case 'rfq-open': return 'open-rfq';
    case 'match-ready': return 'match-order';
    case 'requires-finance-intent': return 'create-finance-intent';
    case 'requires-escrow': return 'fund-escrow';
    case 'ready-to-contract': return 'draft-contract';
    case 'contract-pending': return 'sign-contract';
    case 'in-escrow':
    case 'fulfilled': return 'settle-trade';
    case 'requires-licensed-venue': return 'route-to-licensed-venue';
    case 'requires-review':
    case 'disputed': return 'manual-review';
    default: return 'none';
  }
}

function privacy(): VeyTradingPrivacy {
  return {
    rawAddressStored: false,
    rawAgidStored: false,
    rawAoidStored: false,
    rawCounterpartyStored: false,
    rawContactStored: false,
    privateKeyStored: false,
    bankAccountStored: false,
    cardPanStored: false,
    contractBodyStored: false,
    customsDocumentBodyStored: false,
    publicSurface: 'aliases-commitments-evidence-refs-quotes-state-and-risk-only',
  };
}

function buildIntentId(input: VeyTradingInput, createdAt: string) {
  const explicit = clean(input.id, 80).toUpperCase();
  if (/^VT-[A-F0-9]{16,32}$/.test(explicit)) return explicit;
  return `VT-${sha256Hex(stableJson({
    createdAt,
    side: input.side,
    assetKind: input.assetKind,
    marketMode: input.marketMode,
    listingAlias: input.listingAlias,
    orderAlias: input.orderAlias,
    assetAlias: input.assetAlias,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
  })).slice(0, 24).toUpperCase()}`;
}

function normalizeIdempotencyKey(value: unknown) {
  const text = clean(value, 120);
  return /^[A-Za-z0-9._:-]{8,120}$/.test(text) ? text : '';
}

function tradeGatewayBodyFingerprint(request: VeyTradeGatewayIntentRequest) {
  const { idempotencyKey: _idempotencyKey, requestedAt: _requestedAt, ...body } = request as Record<string, unknown>;
  return sha256Hex(stableJson({
    modelVersion: VEY_TRADING_VERSION,
    body,
  }));
}

function buildTradeGatewayIntentRef(input: {
  idempotencyKey: string;
  intent: VeyTradingIntent;
}) {
  return compactHash({
    idempotencyKey: input.idempotencyKey,
    intentId: input.intent.id,
    modelVersion: input.intent.modelVersion,
  }, 'trade_gateway_intent');
}

function safeRef(value: unknown, maxLength = 120) {
  const text = clean(value, maxLength);
  if (!text) return undefined;
  return PRIVATE_ID_VALUE_RE.test(text) || PRIVATE_CONTACT_OR_COORD_VALUE_RE.test(text) ? undefined : text;
}

function tradeGatewaySafeRefs(
  request: VeyTradeGatewayIntentRequest,
  intent: VeyTradingIntent,
): VeyTradeGatewaySafeRefs {
  return {
    tradingIntentId: intent.id,
    ...(safeRef(request.operatorWorkspaceRef) ? { operatorWorkspaceRef: safeRef(request.operatorWorkspaceRef) } : {}),
    ...(safeRef(request.deliveryGatewayShipmentRef) ? { deliveryGatewayShipmentRef: safeRef(request.deliveryGatewayShipmentRef) } : {}),
    ...(safeRef(request.playlistCommerceIntentRef) ? { playlistCommerceIntentRef: safeRef(request.playlistCommerceIntentRef) } : {}),
    ...(safeRef(intent.financeLink.financeIntentRef) ? { financeIntentRef: safeRef(intent.financeLink.financeIntentRef) } : {}),
    ...(safeRef(intent.listingAlias) ? { listingAlias: safeRef(intent.listingAlias) } : {}),
    ...(safeRef(intent.orderAlias) ? { orderAlias: safeRef(intent.orderAlias) } : {}),
  };
}

function rejectedTradeGatewayIntent(input: {
  status: 400 | 409;
  decision: 'conflict' | 'rejected';
  idempotencyKey?: string;
  attemptCount: number;
  tradeGatewayIntentRef?: string;
  bodyFingerprintRef?: string;
  conflictRef?: string;
  errors: string[];
  warnings?: string[];
}): VeyTradeGatewayIntentIdempotencyResult {
  return {
    version: VEY_TRADE_GATEWAY_IDEMPOTENCY_VERSION,
    ok: false,
    status: input.status,
    decision: input.decision,
    replayed: false,
    attemptCount: input.attemptCount,
    ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
    ...(input.tradeGatewayIntentRef ? { tradeGatewayIntentRef: input.tradeGatewayIntentRef } : {}),
    ...(input.bodyFingerprintRef ? { bodyFingerprintRef: input.bodyFingerprintRef } : {}),
    ...(input.conflictRef ? { conflictRef: input.conflictRef } : {}),
    errors: Array.from(new Set(input.errors)),
    warnings: Array.from(new Set(input.warnings ?? [])),
    privacy: privacy(),
    localOnly: true,
    productionTraffic: false,
    nonClaims: TRADE_GATEWAY_IDEMPOTENCY_NON_CLAIMS,
  };
}

type StoredTradeGatewayIntent = {
  bodyFingerprint: string;
  bodyFingerprintRef: string;
  tradeGatewayIntentRef: string;
  safeRefs: VeyTradeGatewaySafeRefs;
  intent: VeyTradingIntent;
  attemptCount: number;
};

export function createVeyTradeGatewayIntentStore() {
  const cache = new Map<string, StoredTradeGatewayIntent>();

  return {
    get size() {
      return cache.size;
    },
    create(request: VeyTradeGatewayIntentRequest = {}): VeyTradeGatewayIntentIdempotencyResult {
      const idempotencyKey = normalizeIdempotencyKey(request.idempotencyKey);
      const forbiddenPaths = collectForbiddenInputPaths(request);
      const earlyErrors = [
        ...(idempotencyKey ? [] : ['idempotency-key-required']),
        ...forbiddenPaths.map((path) => `${path}-not-allowed-in-trade-gateway-intent`),
      ];

      if (earlyErrors.length > 0) {
        return rejectedTradeGatewayIntent({
          status: 400,
          decision: 'rejected',
          idempotencyKey,
          attemptCount: 0,
          errors: earlyErrors,
        });
      }

      const bodyFingerprint = tradeGatewayBodyFingerprint(request);
      const bodyFingerprintRef = compactHash({ bodyFingerprint }, 'trade_gateway_body');
      const cached = cache.get(idempotencyKey);
      if (cached && cached.bodyFingerprint !== bodyFingerprint) {
        cached.attemptCount += 1;
        return rejectedTradeGatewayIntent({
          status: 409,
          decision: 'conflict',
          idempotencyKey,
          attemptCount: cached.attemptCount,
          tradeGatewayIntentRef: cached.tradeGatewayIntentRef,
          bodyFingerprintRef: cached.bodyFingerprintRef,
          conflictRef: compactHash({
            idempotencyKey,
            previousBodyFingerprint: cached.bodyFingerprint,
            attemptedBodyFingerprint: bodyFingerprint,
          }, 'trade_gateway_conflict'),
          errors: ['idempotency-key-body-mismatch'],
        });
      }
      if (cached) {
        cached.attemptCount += 1;
        return {
          version: VEY_TRADE_GATEWAY_IDEMPOTENCY_VERSION,
          ok: true,
          status: 201,
          decision: 'replayed',
          replayed: true,
          attemptCount: cached.attemptCount,
          idempotencyKey,
          tradeGatewayIntentRef: cached.tradeGatewayIntentRef,
          bodyFingerprintRef: cached.bodyFingerprintRef,
          safeRefs: cached.safeRefs,
          intent: cached.intent,
          errors: [],
          warnings: cached.intent.warnings,
          privacy: cached.intent.privacy,
          localOnly: true,
          productionTraffic: false,
          nonClaims: TRADE_GATEWAY_IDEMPOTENCY_NON_CLAIMS,
        };
      }

      const intent = buildVeyTradingIntent(request);
      const validation = validateVeyTradingIntent(intent);
      if (!validation.ok) {
        return rejectedTradeGatewayIntent({
          status: 400,
          decision: 'rejected',
          idempotencyKey,
          attemptCount: 0,
          bodyFingerprintRef,
          errors: validation.errors.length > 0 ? validation.errors : intent.errors,
          warnings: [...intent.warnings, ...validation.warnings],
        });
      }

      const record: StoredTradeGatewayIntent = {
        bodyFingerprint,
        bodyFingerprintRef,
        tradeGatewayIntentRef: buildTradeGatewayIntentRef({ idempotencyKey, intent }),
        safeRefs: tradeGatewaySafeRefs(request, intent),
        intent,
        attemptCount: 1,
      };
      cache.set(idempotencyKey, record);

      return {
        version: VEY_TRADE_GATEWAY_IDEMPOTENCY_VERSION,
        ok: true,
        status: 201,
        decision: 'created',
        replayed: false,
        attemptCount: record.attemptCount,
        idempotencyKey,
        tradeGatewayIntentRef: record.tradeGatewayIntentRef,
        bodyFingerprintRef: record.bodyFingerprintRef,
        safeRefs: record.safeRefs,
        intent,
        errors: [],
        warnings: intent.warnings,
        privacy: intent.privacy,
        localOnly: true,
        productionTraffic: false,
        nonClaims: TRADE_GATEWAY_IDEMPOTENCY_NON_CLAIMS,
      };
    },
  };
}

function tradeGatewayFixtureVector(
  vectorId: VeyTradeGatewayIdempotencyFixtureVectorId,
  result: VeyTradeGatewayIntentIdempotencyResult,
): VeyTradeGatewayIdempotencyFixtureVector {
  return {
    vectorId,
    ok: result.ok,
    decision: result.decision,
    httpStatus: result.status,
    replayed: result.replayed,
    attemptCount: result.attemptCount,
    ...(result.tradeGatewayIntentRef ? { tradeGatewayIntentRef: result.tradeGatewayIntentRef } : {}),
    ...(result.bodyFingerprintRef ? { bodyFingerprintRef: result.bodyFingerprintRef } : {}),
    ...(result.conflictRef ? { conflictRef: result.conflictRef } : {}),
    ...(result.safeRefs ? { safeRefs: result.safeRefs } : {}),
    errors: result.errors,
    warnings: result.warnings,
    localOnly: true,
    productionTraffic: false,
    privateMaterialExposed: false,
    forbiddenValueMarkersFound: [],
    nonClaims: result.nonClaims,
  };
}

export function buildVeyTradeGatewayIdempotencyFixture(): VeyTradeGatewayIdempotencyFixture {
  const store = createVeyTradeGatewayIntentStore();
  const request = {
    idempotencyKey: 'trade-gateway-fixture-key-001',
    operatorWorkspaceRef: 'workspace_ref_ops_tyo_fixture_001',
    deliveryGatewayShipmentRef: 'delivery_gateway_shipment_ref_tyo_fixture_001',
    playlistCommerceIntentRef: 'playlist_intent_ref_tyo_fixture_001',
    side: 'sell',
    assetKind: 'physical-goods',
    marketMode: 'catalog',
    listingAlias: 'LIST-FIXTURE-001',
    orderAlias: 'ORD-FIXTURE-001',
    originCountry: 'JP',
    destinationCountry: 'JP',
    quantity: 8,
    unit: 'case',
    unitPrice: 30,
    currency: 'USD',
    evidence: [
      { type: 'listing', status: 'passed', evidenceRef: 'listing_ev_trade_gateway_fixture', signed: true },
      { type: 'market-data', status: 'passed', evidenceRef: 'market_ev_trade_gateway_fixture', signed: true },
      { type: 'counterparty-kyc', status: 'passed', evidenceRef: 'kyc_ev_trade_gateway_fixture', signed: true },
      { type: 'sanctions-screen', status: 'passed', evidenceRef: 'sanctions_ev_trade_gateway_fixture', signed: true },
      { type: 'title-of-goods', status: 'passed', evidenceRef: 'title_ev_trade_gateway_fixture', signed: true },
    ],
  } as const;
  const created = store.create(request);
  const replayed = store.create({ ...request, requestedAt: '2026-06-21T00:00:00.000Z' });
  const conflict = store.create({ ...request, quantity: 9 });
  const rejected = store.create({
    idempotencyKey: 'trade-gateway-fixture-key-002',
    assetKind: 'physical-goods',
    marketMode: 'catalog',
    listingAlias: 'LIST-FIXTURE-PRIVATE-MATERIAL-NEGATIVE',
    quantity: 1,
    unitPrice: 10,
    currency: 'USD',
    rawAddress: 'blocked',
    privateKey: 'blocked',
    evidence: [
      { type: 'listing', status: 'passed', rawAoid: 'blocked' },
    ],
  });

  return {
    $schema: VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_SCHEMA_REF,
    fixtureId: VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_ID,
    status: VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_STATUS,
    source: {
      builder: VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_BUILDER,
      verifier: VEY_TRADE_GATEWAY_IDEMPOTENCY_FIXTURE_VERIFIER,
    },
    boundaryGateId: VEY_TRADE_GATEWAY_IDEMPOTENCY_BOUNDARY_GATE,
    privacy: {
      localOnly: true,
      productionTraffic: false,
      containsRawAddress: false,
      privateMaterialExposed: false,
    },
    vectors: [
      tradeGatewayFixtureVector('trade_gateway_intent_created_positive', created),
      tradeGatewayFixtureVector('trade_gateway_intent_replayed_positive', replayed),
      tradeGatewayFixtureVector('trade_gateway_intent_conflict_negative', conflict),
      tradeGatewayFixtureVector('trade_gateway_intent_private_material_negative', rejected),
    ],
    forbiddenValueMarkers: [...VEY_TRADE_GATEWAY_IDEMPOTENCY_FORBIDDEN_VALUE_MARKERS],
    localOnly: true,
    productionTraffic: false,
    privateMaterialExposed: false,
    nonClaims: TRADE_GATEWAY_IDEMPOTENCY_NON_CLAIMS,
    validationErrors: [],
  };
}

export function buildVeyTradingIntent(input: VeyTradingInput = {}): VeyTradingIntent {
  const createdAt = validIsoOrDefault(input.createdAt);
  const updatedAt = validIsoOrDefault(input.updatedAt, createdAt);
  const errors: string[] = [];
  const warnings: string[] = [
    'vey-trading-is-a-market-and-contract-execution-layer-not-a-payment-app',
    'futures-derivatives-and-energy-markets-require-licensed-venue-or-operator-review',
    'digital-asset-trading-may-trigger-vasp-securities-consumer-protection-or-ip-review',
    'do-not-store-raw-address-agid-aoid-counterparty-contact-private-keys-or-contract-body',
  ];
  const manualReviewReasons: string[] = [];
  const requiredControls = new Set<string>([
    'counterparty-kyc-kyb',
    'sanctions-screening',
    'market-data-evidence',
    'trade-audit-log',
    'no-private-key-custody-in-local-mode',
  ]);

  for (const key of FORBIDDEN_INPUT_KEYS) {
    if (clean(input[key])) errors.push(`${key}-not-allowed-in-vey-trading`);
  }

  const side = normalizeSide(input.side);
  const assetKind = normalizeAssetKind(input.assetKind);
  const marketMode = normalizeMarketMode(input.marketMode);
  const originCountry = normalizeCountry(input.originCountry);
  const destinationCountry = normalizeCountry(input.destinationCountry);
  const quantity = numberInput(input.quantity);
  const unit = clean(input.unit, 24) || 'unit';
  const unitPrice = money(input.unitPrice);
  const currency = normalizeCurrency(input.currency);
  const notionalLimit = money(input.notionalLimit);
  const notional = Number.isFinite(quantity) && Number.isFinite(unitPrice)
    ? Math.round(quantity * unitPrice * 100) / 100
    : Number.NaN;
  const evidenceResult = normalizeEvidence(input.evidence, updatedAt);
  errors.push(...evidenceResult.errors);
  warnings.push(...evidenceResult.warnings);

  if (!Number.isFinite(quantity) || quantity <= 0) errors.push('quantity-invalid');
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) errors.push('unit-price-invalid');
  if (!currency) errors.push('currency-required');
  if (Number.isFinite(notionalLimit) && notional > notionalLimit) {
    manualReviewReasons.push('notional-exceeds-limit');
  }
  const deliveryRequired = Boolean(input.deliveryRequired || originCountry && destinationCountry && originCountry !== destinationCountry);
  const escrowRequired = Boolean(input.escrowRequired);
  const highRiskMode = Boolean(input.highRiskMode);
  const compliance = buildCompliance({
    assetKind,
    marketMode,
    deliveryRequired,
    escrowRequired,
    notional,
    highRiskMode,
  });
  if (assetKind === 'resource-energy') {
    manualReviewReasons.push('energy-market-regulatory-review-required');
    requiredControls.add('commodity-and-energy-market-compliance');
  }
  if (assetKind === 'resource-mineral' || assetKind === 'metal') {
    manualReviewReasons.push('resource-origin-sanctions-and-conflict-minerals-review-required');
    requiredControls.add('resource-origin-evidence');
  }
  if (assetKind === 'digital-asset') {
    manualReviewReasons.push('digital-asset-ownership-ip-vasp-review-required');
    requiredControls.add('digital-asset-ownership-proof');
    requiredControls.add('wallet-risk-screening-without-private-key-custody');
  }
  if (assetKind === 'futures-contract' || assetKind === 'derivative') {
    manualReviewReasons.push('futures-or-derivatives-licensed-venue-required');
    requiredControls.add('licensed-futures-or-derivatives-venue');
  }
  if (compliance.prohibitedInLocalMode && input.executionRequested) {
    errors.push('futures-or-derivatives-execution-not-allowed-in-local-mode');
  }
  if (evidenceFailed(evidenceResult.evidence, 'sanctions-screen')) {
    errors.push('sanctions-screen-failed');
  }
  if (evidenceFailed(evidenceResult.evidence, 'export-control')) {
    errors.push('export-control-screen-failed');
  }

  const listingReady = Boolean(
    clean(input.listingAlias, 120)
    || clean(input.assetAlias, 120)
    || clean(input.assetCommitment, 120)
    || evidencePassed(evidenceResult.evidence, 'listing')
  );
  const quoteReady = Number.isFinite(notional)
    && notional > 0
    && Boolean(currency)
    && evidencePassed(evidenceResult.evidence, 'market-data');
  const financeReady = Boolean(clean(input.financeIntentRef, 120) || evidencePassed(evidenceResult.evidence, 'finance-intent'));
  const escrowFunded = Boolean(input.escrowFunded || evidencePassed(evidenceResult.evidence, 'escrow'));
  const contractSigned = Boolean(input.contractSigned);
  const fulfillmentConfirmed = Boolean(input.fulfillmentConfirmed || evidencePassed(evidenceResult.evidence, 'delivery-pod'));
  const settlementConfirmed = Boolean(input.settlementConfirmed);
  const disputeOpen = Boolean(input.disputeOpen);
  const risk = riskLevel({ compliance, evidence: evidenceResult.evidence, errors });
  const status = statusFor({
    errors,
    compliance,
    evidence: evidenceResult.evidence,
    listingReady,
    quoteReady,
    financeReady,
    escrowFunded,
    contractSigned,
    fulfillmentConfirmed,
    settlementConfirmed,
    disputeOpen,
    executionRequested: Boolean(input.executionRequested),
    marketMode,
  });

  return {
    modelVersion: VEY_TRADING_VERSION,
    id: buildIntentId(input, createdAt),
    concept: 'electronic-trading-company-not-retail-payment-app',
    side,
    assetKind,
    marketMode,
    status,
    nextAction: nextActionFor(status),
    riskLevel: risk,
    createdAt,
    updatedAt,
    ...(clean(input.listingAlias, 120) ? { listingAlias: clean(input.listingAlias, 120) } : {}),
    ...(clean(input.orderAlias, 120) ? { orderAlias: clean(input.orderAlias, 120) } : {}),
    ...(clean(input.assetAlias, 120) ? { assetAlias: clean(input.assetAlias, 120) } : {}),
    ...(clean(input.assetCommitment, 120) ? { assetCommitment: clean(input.assetCommitment, 120) } : {}),
    originCountry,
    destinationCountry,
    ...(clean(input.hsCode, 16) ? { hsCode: clean(input.hsCode, 16).replace(/\s+/g, '') } : {}),
    ...(clean(input.resourceGrade, 80) ? { resourceGrade: clean(input.resourceGrade, 80) } : {}),
    quote: {
      quantity: Number.isFinite(quantity) ? quantity : 0,
      unit,
      unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
      currency,
      notional: Number.isFinite(notional) ? notional : 0,
      ...(Number.isFinite(notionalLimit) && notionalLimit > 0 ? { notionalLimit } : {}),
      priceIsExecutable: quoteReady && status !== 'requires-review' && status !== 'requires-licensed-venue' && status !== 'rejected',
    },
    compliance,
    evidence: evidenceResult.evidence,
    financeLink: {
      required: compliance.financeIntentRequired,
      expectedVersion: VEY_FINANCE_VERSION,
      ...(clean(input.financeIntentRef, 120) ? { financeIntentRef: clean(input.financeIntentRef, 120) } : {}),
      ...(clean(input.financeIntentVersion, 80) ? { financeIntentVersion: clean(input.financeIntentVersion, 80) } : {}),
    },
    lifecycle: {
      escrowFunded,
      contractSigned,
      fulfillmentConfirmed,
      settlementConfirmed,
      disputeOpen,
    },
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings)),
    manualReviewReasons: Array.from(new Set(manualReviewReasons)),
    requiredControls: Array.from(requiredControls),
    privacy: privacy(),
  };
}

export function validateVeyTradingIntent(intent: VeyTradingIntent) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (intent.modelVersion !== VEY_TRADING_VERSION) errors.push('vey-trading-version-mismatch');
  if (intent.concept !== 'electronic-trading-company-not-retail-payment-app') {
    errors.push('vey-trading-concept-mismatch');
  }
  if (intent.privacy.rawAddressStored !== false) errors.push('vey-trading-raw-address-stored');
  if (intent.privacy.rawAgidStored !== false) errors.push('vey-trading-raw-agid-stored');
  if (intent.privacy.rawAoidStored !== false) errors.push('vey-trading-raw-aoid-stored');
  if (intent.privacy.privateKeyStored !== false) errors.push('vey-trading-private-key-stored');
  if (intent.privacy.bankAccountStored !== false) errors.push('vey-trading-bank-account-stored');
  if (intent.privacy.cardPanStored !== false) errors.push('vey-trading-card-pan-stored');
  if (intent.compliance.prohibitedInLocalMode && intent.status !== 'rejected' && intent.status !== 'requires-licensed-venue') {
    errors.push('vey-trading-local-mode-allowed-prohibited-market');
  }
  if (intent.compliance.financeIntentRequired && intent.financeLink.required !== true) {
    errors.push('vey-trading-finance-link-required-mismatch');
  }
  if (intent.status === 'settled' && !intent.lifecycle.settlementConfirmed) {
    warnings.push('vey-trading-settled-status-without-settlement-confirmed');
  }

  const publicText = [
    intent.id,
    intent.listingAlias,
    intent.orderAlias,
    intent.assetAlias,
    intent.assetCommitment,
    intent.hsCode,
    intent.resourceGrade,
    intent.financeLink.financeIntentRef,
    ...intent.evidence.flatMap((item) => [item.sourceId, item.evidenceRef, item.safeFingerprint]),
    ...intent.errors,
    ...intent.warnings,
    ...intent.manualReviewReasons,
  ].filter(Boolean).join('\n');
  if (PRIVATE_ID_VALUE_RE.test(publicText) || PRIVATE_CONTACT_OR_COORD_VALUE_RE.test(publicText)) {
    errors.push('vey-trading-public-surface-contains-private-token');
  }

  return {
    ok: errors.length === 0 && intent.status !== 'rejected',
    errors,
    warnings,
    auditRef: compactHash({
      modelVersion: intent.modelVersion,
      id: intent.id,
      status: intent.status,
      assetKind: intent.assetKind,
      marketMode: intent.marketMode,
      quote: intent.quote,
      evidence: intent.evidence,
    }, 'veytrading_audit'),
  };
}

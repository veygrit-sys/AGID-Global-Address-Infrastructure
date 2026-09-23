import { sha256Hex } from './sha256';
import {
  estimateTaxFromOpenEvidence,
  getTaxOpenSourceDataPlan,
  type TaxEstimateResult,
  type TaxEvidenceRate,
} from './taxOpenSourceData';
import {
  getRecommendedFullyFreeTradeComplianceSources,
  getTradeComplianceDataPlan,
} from './tradeComplianceDataPlan';

export const VEY_FINANCE_VERSION = 'agid-vey-finance-trade-execution-v1';

export const VEY_FINANCE_STATUSES = [
  'requires-product-classification',
  'requires-address-evidence',
  'requires-tax-evidence',
  'estimated',
  'requires-review',
  'ready-to-collect',
  'collected',
  'tax-reserved',
  'customs-cleared',
  'in-transit',
  'pod-confirmed',
  'release-ready',
  'released',
  'refund-required',
  'disputed',
  'rejected',
] as const;

export const VEY_FINANCE_NEXT_ACTIONS = [
  'classify-product',
  'verify-address-and-trade-corridor',
  'import-tax-evidence',
  'manual-trade-review',
  'show-landed-cost',
  'collect-funds',
  'reserve-tax-and-duty',
  'wait-for-customs-clearance',
  'wait-for-pod',
  'release-escrow',
  'refund-or-claim-insurance',
  'none',
] as const;

export type VeyFinanceStatus = typeof VEY_FINANCE_STATUSES[number];
export type VeyFinanceNextAction = typeof VEY_FINANCE_NEXT_ACTIONS[number];
export type VeyFinancePurpose =
  | 'cross-border-commerce'
  | 'carrier-ddp'
  | 'customs-preclearance'
  | 'trade-escrow'
  | 'invoice-receivables'
  | 'general-payment'
  | 'domestic-pos';
export type VeyFinanceIncoterm = 'DDP' | 'DAP' | 'DDU' | 'EXW' | 'FOB' | 'CIF' | 'unknown';
export type VeyFinancePaymentProvider = 'stripe' | 'ethereum' | 'bank-transfer' | 'internal-ledger' | 'manual';
export type VeyFinancePaymentStatus = 'none' | 'authorized' | 'collected' | 'escrowed' | 'released' | 'refunded' | 'failed';
export type VeyFinanceEscrowStatus = 'none' | 'not-required' | 'required' | 'funded' | 'release-ready' | 'released' | 'refund-required' | 'disputed';
export type VeyFinanceShipmentStatus = 'not-shipped' | 'label-issued' | 'customs-cleared' | 'in-transit' | 'pod-confirmed' | 'damaged' | 'lost';
export type VeyFinanceEvidenceStatus = 'pending' | 'passed' | 'warning' | 'failed';
export type VeyFinanceEvidenceType =
  | 'address-validation'
  | 'agid-aoid-check'
  | 'hs-classification'
  | 'tariff-snapshot'
  | 'vat-gst-rate'
  | 'fx-rate'
  | 'carrier-acceptance'
  | 'customs-clearance'
  | 'pod'
  | 'insurance-claim'
  | 'manual-review';

export type VeyFinanceEvidenceInput = {
  type?: unknown;
  status?: unknown;
  sourceId?: unknown;
  evidenceRef?: unknown;
  safeFingerprint?: unknown;
  observedAt?: unknown;
  confidence?: unknown;
  signed?: unknown;
  rawAddress?: unknown;
  rawAgid?: unknown;
  rawAoid?: unknown;
  recipientName?: unknown;
  phone?: unknown;
  email?: unknown;
  customsDocumentBody?: unknown;
  taxDocumentBody?: unknown;
  proofCode?: unknown;
  secret?: unknown;
};

export type VeyFinanceInput = {
  id?: unknown;
  purpose?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  orderAlias?: unknown;
  shipmentAlias?: unknown;
  shipmentCommitment?: unknown;
  originCountry?: unknown;
  destinationCountry?: unknown;
  currency?: unknown;
  goodsValue?: unknown;
  shippingCost?: unknown;
  insuranceCost?: unknown;
  customsBrokerFee?: unknown;
  otherFees?: unknown;
  hsCode?: unknown;
  productCategory?: unknown;
  productDescription?: unknown;
  incoterm?: unknown;
  paymentProvider?: unknown;
  paymentStatus?: unknown;
  escrowStatus?: unknown;
  shipmentStatus?: unknown;
  podReceiptRef?: unknown;
  podSigned?: unknown;
  damageDetected?: unknown;
  insuranceClaimRef?: unknown;
  disputeOpen?: unknown;
  customsCleared?: unknown;
  highRiskMode?: unknown;
  taxEvidence?: TaxEvidenceRate[];
  evidence?: readonly VeyFinanceEvidenceInput[];
  now?: unknown;
  rawAddress?: unknown;
  rawAgid?: unknown;
  rawAoid?: unknown;
  recipientName?: unknown;
  phone?: unknown;
  email?: unknown;
  cardPan?: unknown;
  privateKey?: unknown;
  seedPhrase?: unknown;
  bankAccount?: unknown;
  customsDocumentBody?: unknown;
  taxDocumentBody?: unknown;
};

export type VeyFinanceEvidence = {
  type: VeyFinanceEvidenceType;
  status: VeyFinanceEvidenceStatus;
  sourceId?: string;
  evidenceRef?: string;
  safeFingerprint?: string;
  observedAt: string;
  confidence: 'official' | 'operator-import' | 'open-source' | 'manual' | 'unknown';
  signed: boolean;
};

export type VeyFinanceLandedCost = {
  goodsValue: number;
  shippingCost: number;
  insuranceCost: number;
  customsBrokerFee: number;
  otherFees: number;
  taxableAmount: number;
  estimatedTaxAndDuty: number;
  totalLandedCost: number;
  currency: string;
};

export type VeyFinanceRemittancePlan = {
  mode: 'evidence-only' | 'tax-reserve' | 'licensed-remittance-adapter-required';
  reserveAmount: number;
  authorityPaymentInstructionStored: false;
  finalFilingPerformed: false;
  requiredLicenseChecks: string[];
  explanation: string;
};

export type VeyFinanceEscrowPlan = {
  required: boolean;
  status: VeyFinanceEscrowStatus;
  releaseCondition: 'pod-signed-and-no-dispute' | 'customs-cleared-and-pod-signed' | 'not-required';
  refundCondition: 'damage-lost-dispute-or-expiry' | 'not-required';
  canReleaseNow: boolean;
  canRefundNow: boolean;
};

export type VeyFinancePrivacy = {
  rawAddressStored: false;
  rawAgidStored: false;
  rawAoidStored: false;
  rawRecipientStored: false;
  rawPhoneStored: false;
  rawEmailStored: false;
  cardPanStored: false;
  bankAccountStored: false;
  privateKeyStored: false;
  customsDocumentBodyStored: false;
  taxDocumentBodyStored: false;
  publicSurface: 'aliases-commitments-evidence-refs-state-and-amounts-only';
};

export type VeyFinanceIntent = {
  modelVersion: typeof VEY_FINANCE_VERSION;
  id: string;
  concept: 'trade-execution-robot-not-general-payment-app';
  purpose: VeyFinancePurpose;
  status: VeyFinanceStatus;
  nextAction: VeyFinanceNextAction;
  createdAt: string;
  updatedAt: string;
  originCountry: string;
  destinationCountry: string;
  orderAlias?: string;
  shipmentAlias?: string;
  shipmentCommitment?: string;
  hsCode?: string;
  productCategory?: string;
  productDescription?: string;
  incoterm: VeyFinanceIncoterm;
  paymentProvider: VeyFinancePaymentProvider;
  paymentStatus: VeyFinancePaymentStatus;
  shipmentStatus: VeyFinanceShipmentStatus;
  highRiskMode: boolean;
  landedCost: VeyFinanceLandedCost;
  taxEstimate: TaxEstimateResult;
  remittancePlan: VeyFinanceRemittancePlan;
  escrowPlan: VeyFinanceEscrowPlan;
  evidence: VeyFinanceEvidence[];
  dataSources: {
    taxPlanVersion: string;
    tradePlanVersion: string;
    defaultTradeSourceIds: string[];
  };
  errors: string[];
  warnings: string[];
  manualReviewReasons: string[];
  requiredControls: string[];
  privacy: VeyFinancePrivacy;
};

const DEFAULT_CREATED_AT = '2026-06-20T00:00:00.000Z';
const FORBIDDEN_INPUT_KEYS = [
  'rawAddress',
  'rawAgid',
  'rawAoid',
  'recipientName',
  'phone',
  'email',
  'cardPan',
  'privateKey',
  'seedPhrase',
  'bankAccount',
  'customsDocumentBody',
  'taxDocumentBody',
] as const;
const EVIDENCE_PRIVATE_KEYS = [
  ...FORBIDDEN_INPUT_KEYS,
  'proofCode',
  'secret',
] as const;
const PRIVATE_ID_VALUE_RE = /\bA(?:GID|OID)[-_][A-Z0-9]{6,}\b/;
const PRIVATE_CONTACT_OR_COORD_VALUE_RE = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d ().-]{7,}\d|\b-?\d{1,2}\.\d{4,}[ \t]*,[ \t]*-?\d{1,3}\.\d{4,})/i;

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

function money(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.round(value * 100) / 100;
  }
  const text = clean(value, 40).replace(/,/g, '');
  if (!text) return 0;
  return /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(text) ? Math.round(Number(text) * 100) / 100 : Number.NaN;
}

function normalizePurpose(value: unknown): VeyFinancePurpose {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (
    text === 'carrier-ddp'
    || text === 'customs-preclearance'
    || text === 'trade-escrow'
    || text === 'invoice-receivables'
    || text === 'general-payment'
    || text === 'domestic-pos'
  ) return text;
  return 'cross-border-commerce';
}

function normalizeIncoterm(value: unknown): VeyFinanceIncoterm {
  const text = clean(value, 16).toUpperCase();
  if (text === 'DDP' || text === 'DAP' || text === 'DDU' || text === 'EXW' || text === 'FOB' || text === 'CIF') {
    return text;
  }
  return 'unknown';
}

function normalizePaymentProvider(value: unknown): VeyFinancePaymentProvider {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (text === 'stripe' || text === 'ethereum' || text === 'bank-transfer' || text === 'internal-ledger' || text === 'manual') {
    return text;
  }
  return 'manual';
}

function normalizePaymentStatus(value: unknown): VeyFinancePaymentStatus {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (
    text === 'authorized'
    || text === 'collected'
    || text === 'escrowed'
    || text === 'released'
    || text === 'refunded'
    || text === 'failed'
  ) return text;
  return 'none';
}

function normalizeEscrowStatus(value: unknown, required: boolean): VeyFinanceEscrowStatus {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (
    text === 'not-required'
    || text === 'required'
    || text === 'funded'
    || text === 'release-ready'
    || text === 'released'
    || text === 'refund-required'
    || text === 'disputed'
  ) return text;
  return required ? 'required' : 'not-required';
}

function normalizeShipmentStatus(value: unknown, customsCleared: boolean, podSigned: boolean, damageDetected: boolean): VeyFinanceShipmentStatus {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (text === 'damaged' || damageDetected) return 'damaged';
  if (text === 'lost') return 'lost';
  if (text === 'pod-confirmed' || podSigned) return 'pod-confirmed';
  if (text === 'in-transit') return 'in-transit';
  if (text === 'customs-cleared' || customsCleared) return 'customs-cleared';
  if (text === 'label-issued') return 'label-issued';
  return 'not-shipped';
}

function normalizeEvidenceType(value: unknown): VeyFinanceEvidenceType | undefined {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (
    text === 'address-validation'
    || text === 'agid-aoid-check'
    || text === 'hs-classification'
    || text === 'tariff-snapshot'
    || text === 'vat-gst-rate'
    || text === 'fx-rate'
    || text === 'carrier-acceptance'
    || text === 'customs-clearance'
    || text === 'pod'
    || text === 'insurance-claim'
    || text === 'manual-review'
  ) return text;
  if (text === 'tax' || text === 'vat' || text === 'gst') return 'vat-gst-rate';
  if (text === 'tariff' || text === 'duty') return 'tariff-snapshot';
  return undefined;
}

function normalizeEvidenceStatus(value: unknown): VeyFinanceEvidenceStatus {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (text === 'ok' || text === 'accepted' || text === 'verified' || text === 'complete') return 'passed';
  if (text === 'review' || text === 'needs-review' || text === 'partial') return 'warning';
  if (text === 'rejected' || text === 'invalid' || text === 'error') return 'failed';
  if (text === 'pending') return 'pending';
  return 'passed';
}

function normalizeConfidence(value: unknown): VeyFinanceEvidence['confidence'] {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (text === 'official' || text === 'operator-import' || text === 'open-source' || text === 'manual') return text;
  return 'unknown';
}

function hasForbiddenEvidenceValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return PRIVATE_ID_VALUE_RE.test(value) || PRIVATE_CONTACT_OR_COORD_VALUE_RE.test(value);
  if (typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasForbiddenEvidenceValue);
  return Object.entries(value as Record<string, unknown>).some(([key, child]) => (
    (EVIDENCE_PRIVATE_KEYS as readonly string[]).includes(key)
    || hasForbiddenEvidenceValue(child)
  ));
}

function normalizeEvidence(input: readonly VeyFinanceEvidenceInput[] | undefined, now: string) {
  const evidence: VeyFinanceEvidence[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const item of input ?? []) {
    if (hasForbiddenEvidenceValue(item)) {
      errors.push('vey-finance-private-evidence-rejected');
      continue;
    }
    const type = normalizeEvidenceType(item.type);
    if (!type) {
      warnings.push('vey-finance-unknown-evidence-ignored');
      continue;
    }
    evidence.push({
      type,
      status: normalizeEvidenceStatus(item.status),
      ...(clean(item.sourceId, 80) ? { sourceId: clean(item.sourceId, 80) } : {}),
      ...(clean(item.evidenceRef, 120) ? { evidenceRef: clean(item.evidenceRef, 120) } : {}),
      ...(clean(item.safeFingerprint, 120) ? { safeFingerprint: clean(item.safeFingerprint, 120) } : {}),
      observedAt: validIsoOrDefault(item.observedAt, now),
      confidence: normalizeConfidence(item.confidence),
      signed: Boolean(item.signed),
    });
  }

  return {
    evidence,
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings)),
  };
}

function evidencePassed(evidence: readonly VeyFinanceEvidence[], type: VeyFinanceEvidenceType) {
  return evidence.some((item) => item.type === type && item.status === 'passed');
}

function evidenceFailed(evidence: readonly VeyFinanceEvidence[]) {
  return evidence.some((item) => item.status === 'failed');
}

function evidencePendingOrWarning(evidence: readonly VeyFinanceEvidence[]) {
  return evidence.some((item) => item.status === 'pending' || item.status === 'warning');
}

function privacy(): VeyFinancePrivacy {
  return {
    rawAddressStored: false,
    rawAgidStored: false,
    rawAoidStored: false,
    rawRecipientStored: false,
    rawPhoneStored: false,
    rawEmailStored: false,
    cardPanStored: false,
    bankAccountStored: false,
    privateKeyStored: false,
    customsDocumentBodyStored: false,
    taxDocumentBodyStored: false,
    publicSurface: 'aliases-commitments-evidence-refs-state-and-amounts-only',
  };
}

function buildIntentId(input: VeyFinanceInput, createdAt: string) {
  const explicit = clean(input.id, 80).toUpperCase();
  if (/^VF-[A-F0-9]{16,32}$/.test(explicit)) return explicit;
  return `VF-${sha256Hex(stableJson({
    createdAt,
    purpose: input.purpose,
    orderAlias: input.orderAlias,
    shipmentAlias: input.shipmentAlias,
    originCountry: input.originCountry,
    destinationCountry: input.destinationCountry,
    goodsValue: input.goodsValue,
    hsCode: input.hsCode,
  })).slice(0, 24).toUpperCase()}`;
}

function buildRemittancePlan(input: {
  taxEstimate: TaxEstimateResult;
  paymentStatus: VeyFinancePaymentStatus;
  highRiskMode: boolean;
}): VeyFinanceRemittancePlan {
  if (input.taxEstimate.status !== 'estimated') {
    return {
      mode: 'evidence-only',
      reserveAmount: 0,
      authorityPaymentInstructionStored: false,
      finalFilingPerformed: false,
      requiredLicenseChecks: [
        'jurisdiction-specific-tax-registration',
        'customs-broker-or-tax-remittance-authority',
      ],
      explanation: 'No tax reserve is created until source-versioned tax and duty evidence is present.',
    };
  }
  if (input.paymentStatus === 'collected' || input.paymentStatus === 'escrowed' || input.paymentStatus === 'authorized') {
    return {
      mode: 'tax-reserve',
      reserveAmount: input.taxEstimate.taxAmount,
      authorityPaymentInstructionStored: false,
      finalFilingPerformed: false,
      requiredLicenseChecks: [
        'licensed-money-movement-provider',
        'customs-broker-or-tax-agent-review',
        ...(input.highRiskMode ? ['enhanced-kyb-aml-screening'] : []),
      ],
      explanation: 'Finance may reserve the estimated tax/duty and generate remittance instructions; actual filing/payment requires a licensed adapter or operator approval.',
    };
  }
  return {
    mode: 'licensed-remittance-adapter-required',
    reserveAmount: input.taxEstimate.taxAmount,
    authorityPaymentInstructionStored: false,
    finalFilingPerformed: false,
    requiredLicenseChecks: [
      'payment-collection-before-tax-remittance',
      'licensed-money-movement-provider',
      'tax-authority-or-customs-adapter',
    ],
    explanation: 'Tax and duty are estimated, but collection and remittance are not executed by the local model.',
  };
}

function buildEscrowPlan(input: {
  purpose: VeyFinancePurpose;
  paymentStatus: VeyFinancePaymentStatus;
  escrowStatus: VeyFinanceEscrowStatus;
  shipmentStatus: VeyFinanceShipmentStatus;
  customsCleared: boolean;
  podSigned: boolean;
  damageDetected: boolean;
  disputeOpen: boolean;
}) {
  const required = input.purpose === 'trade-escrow'
    || input.paymentStatus === 'escrowed'
    || input.escrowStatus === 'funded'
    || input.escrowStatus === 'required'
    || input.escrowStatus === 'release-ready';
  const releaseCondition: VeyFinanceEscrowPlan['releaseCondition'] = required
    ? 'customs-cleared-and-pod-signed'
    : 'not-required';
  const refundCondition: VeyFinanceEscrowPlan['refundCondition'] = required
    ? 'damage-lost-dispute-or-expiry'
    : 'not-required';
  const damageOrDispute = input.damageDetected || input.disputeOpen || input.shipmentStatus === 'damaged' || input.shipmentStatus === 'lost';
  const canReleaseNow = required
    && (input.escrowStatus === 'funded' || input.escrowStatus === 'release-ready')
    && input.customsCleared
    && input.podSigned
    && !damageOrDispute;
  const canRefundNow = required && damageOrDispute;
  const status: VeyFinanceEscrowStatus = canRefundNow
    ? 'refund-required'
    : canReleaseNow
      ? 'release-ready'
      : input.escrowStatus;

  return {
    required,
    status,
    releaseCondition,
    refundCondition,
    canReleaseNow,
    canRefundNow,
  };
}

function statusFor(input: {
  errors: readonly string[];
  purpose: VeyFinancePurpose;
  originCountry: string;
  destinationCountry: string;
  currency: string;
  goodsValue: number;
  hsCode: string;
  productCategory: string;
  addressEvidenceReady: boolean;
  taxEstimate: TaxEstimateResult;
  evidence: readonly VeyFinanceEvidence[];
  manualReviewReasons: readonly string[];
  paymentStatus: VeyFinancePaymentStatus;
  shipmentStatus: VeyFinanceShipmentStatus;
  customsCleared: boolean;
  podSigned: boolean;
  escrowPlan: VeyFinanceEscrowPlan;
  disputeOpen: boolean;
}): VeyFinanceStatus {
  if (input.errors.length > 0) return 'rejected';
  if (input.purpose === 'general-payment' || input.purpose === 'domestic-pos') return 'rejected';
  if (!input.originCountry || !input.destinationCountry || !input.currency || !Number.isFinite(input.goodsValue) || input.goodsValue <= 0) {
    return 'requires-address-evidence';
  }
  if (input.originCountry === input.destinationCountry) return 'requires-review';
  if (!input.hsCode && !input.productCategory) return 'requires-product-classification';
  if (!input.addressEvidenceReady) return 'requires-address-evidence';
  if (input.taxEstimate.status !== 'estimated') return 'requires-tax-evidence';
  if (evidenceFailed(input.evidence) || evidencePendingOrWarning(input.evidence) || input.manualReviewReasons.length > 0) {
    return 'requires-review';
  }
  if (input.disputeOpen || input.escrowPlan.status === 'disputed') return 'disputed';
  if (input.escrowPlan.canRefundNow || input.shipmentStatus === 'damaged' || input.shipmentStatus === 'lost') return 'refund-required';
  if (input.paymentStatus === 'released' || input.escrowPlan.status === 'released') return 'released';
  if (input.escrowPlan.canReleaseNow) return 'release-ready';
  if (input.podSigned || input.shipmentStatus === 'pod-confirmed') return 'pod-confirmed';
  if (input.shipmentStatus === 'in-transit') return 'in-transit';
  if (input.customsCleared || input.shipmentStatus === 'customs-cleared') return 'customs-cleared';
  if (input.paymentStatus === 'escrowed') return 'tax-reserved';
  if (input.paymentStatus === 'collected' || input.paymentStatus === 'authorized') return 'collected';
  return 'ready-to-collect';
}

function nextActionFor(status: VeyFinanceStatus): VeyFinanceNextAction {
  switch (status) {
    case 'requires-product-classification': return 'classify-product';
    case 'requires-address-evidence': return 'verify-address-and-trade-corridor';
    case 'requires-tax-evidence': return 'import-tax-evidence';
    case 'requires-review': return 'manual-trade-review';
    case 'estimated': return 'show-landed-cost';
    case 'ready-to-collect': return 'collect-funds';
    case 'collected': return 'reserve-tax-and-duty';
    case 'tax-reserved':
    case 'customs-cleared': return 'wait-for-pod';
    case 'in-transit': return 'wait-for-pod';
    case 'pod-confirmed':
    case 'release-ready': return 'release-escrow';
    case 'refund-required':
    case 'disputed': return 'refund-or-claim-insurance';
    default: return 'none';
  }
}

export function buildVeyFinanceTradeIntent(input: VeyFinanceInput): VeyFinanceIntent {
  const createdAt = validIsoOrDefault(input.createdAt);
  const updatedAt = validIsoOrDefault(input.updatedAt, createdAt);
  const now = validIsoOrDefault(input.now, updatedAt);
  const errors: string[] = [];
  const warnings: string[] = [
    'vey-finance-is-a-trade-execution-layer-not-a-general-payment-app',
    'tax-and-duty-output-is-estimate-or-evidence-until-licensed-adapter-confirms-filing',
    'do-not-store-raw-address-agid-aoid-recipient-card-or-bank-data',
  ];
  const manualReviewReasons: string[] = [];
  const requiredControls = new Set<string>([
    'source-versioned-tax-and-tariff-evidence',
    'hs-classification-review',
    'no-raw-address-or-agid-storage',
    'pod-before-escrow-release',
    'licensed-adapter-before-real-money-movement',
  ]);

  for (const key of FORBIDDEN_INPUT_KEYS) {
    if (clean(input[key])) errors.push(`${key}-not-allowed-in-vey-finance`);
  }

  const purpose = normalizePurpose(input.purpose);
  const originCountry = normalizeCountry(input.originCountry);
  const destinationCountry = normalizeCountry(input.destinationCountry);
  const currency = normalizeCurrency(input.currency);
  const goodsValue = money(input.goodsValue);
  const shippingCost = money(input.shippingCost);
  const insuranceCost = money(input.insuranceCost);
  const customsBrokerFee = money(input.customsBrokerFee);
  const otherFees = money(input.otherFees);
  const numericValues = { goodsValue, shippingCost, insuranceCost, customsBrokerFee, otherFees };
  for (const [key, value] of Object.entries(numericValues)) {
    if (!Number.isFinite(value)) errors.push(`${key}-invalid`);
  }

  const hsCode = clean(input.hsCode, 16).replace(/\s+/g, '');
  const productCategory = clean(input.productCategory, 80);
  const productDescription = clean(input.productDescription, 120);
  const incoterm = normalizeIncoterm(input.incoterm);
  const paymentProvider = normalizePaymentProvider(input.paymentProvider);
  const paymentStatus = normalizePaymentStatus(input.paymentStatus);
  const customsCleared = Boolean(input.customsCleared);
  const podSigned = Boolean(input.podSigned || clean(input.podReceiptRef));
  const damageDetected = Boolean(input.damageDetected || clean(input.insuranceClaimRef));
  const shipmentStatus = normalizeShipmentStatus(input.shipmentStatus, customsCleared, podSigned, damageDetected);
  const highRiskMode = Boolean(input.highRiskMode);
  const evidenceResult = normalizeEvidence(input.evidence, now);
  errors.push(...evidenceResult.errors);
  warnings.push(...evidenceResult.warnings);

  if (purpose === 'general-payment' || purpose === 'domestic-pos') {
    errors.push('vey-finance-does-not-handle-general-or-domestic-pos-payments');
  }
  if (originCountry && destinationCountry && originCountry === destinationCountry) {
    manualReviewReasons.push('trade-corridor-is-not-cross-border');
  }
  if (!hsCode && !productCategory) manualReviewReasons.push('hs-code-or-product-category-required');
  if (incoterm === 'unknown') manualReviewReasons.push('incoterm-required-for-landed-cost-and-ddp-decision');
  if (/^(93|36|30|90)/.test(hsCode)) manualReviewReasons.push('controlled-or-regulated-goods-review-required');
  if (goodsValue >= 2500) manualReviewReasons.push('high-value-shipment-review-required');
  if (highRiskMode) requiredControls.add('enhanced-kyb-aml-and-manual-review');

  const addressEvidenceReady = evidencePassed(evidenceResult.evidence, 'address-validation')
    || evidencePassed(evidenceResult.evidence, 'agid-aoid-check')
    || Boolean(clean(input.shipmentCommitment));
  const taxableAmount = Math.max(0, goodsValue + shippingCost + insuranceCost + customsBrokerFee + otherFees);
  const taxEstimate = estimateTaxFromOpenEvidence({
    destinationCountry,
    originCountry,
    taxableAmount,
    currency,
    category: productCategory || hsCode,
    taxEvidence: input.taxEvidence,
    now,
  });
  warnings.push(...taxEstimate.warnings);
  manualReviewReasons.push(...taxEstimate.manualReviewReasons.filter((reason) => reason !== 'tax-rate-evidence-missing'));

  const landedCost: VeyFinanceLandedCost = {
    goodsValue: Number.isFinite(goodsValue) ? goodsValue : 0,
    shippingCost: Number.isFinite(shippingCost) ? shippingCost : 0,
    insuranceCost: Number.isFinite(insuranceCost) ? insuranceCost : 0,
    customsBrokerFee: Number.isFinite(customsBrokerFee) ? customsBrokerFee : 0,
    otherFees: Number.isFinite(otherFees) ? otherFees : 0,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    estimatedTaxAndDuty: taxEstimate.taxAmount,
    totalLandedCost: Math.round((taxableAmount + taxEstimate.taxAmount) * 100) / 100,
    currency,
  };
  const remittancePlan = buildRemittancePlan({ taxEstimate, paymentStatus, highRiskMode });
  const escrowRequired = purpose === 'trade-escrow' || paymentStatus === 'escrowed';
  const escrowStatus = normalizeEscrowStatus(input.escrowStatus, escrowRequired);
  const escrowPlan = buildEscrowPlan({
    purpose,
    paymentStatus,
    escrowStatus,
    shipmentStatus,
    customsCleared: customsCleared || evidencePassed(evidenceResult.evidence, 'customs-clearance'),
    podSigned: podSigned || evidencePassed(evidenceResult.evidence, 'pod'),
    damageDetected,
    disputeOpen: Boolean(input.disputeOpen),
  });
  const status = statusFor({
    errors,
    purpose,
    originCountry,
    destinationCountry,
    currency,
    goodsValue,
    hsCode,
    productCategory,
    addressEvidenceReady,
    taxEstimate,
    evidence: evidenceResult.evidence,
    manualReviewReasons,
    paymentStatus,
    shipmentStatus,
    customsCleared: customsCleared || evidencePassed(evidenceResult.evidence, 'customs-clearance'),
    podSigned: podSigned || evidencePassed(evidenceResult.evidence, 'pod'),
    escrowPlan,
    disputeOpen: Boolean(input.disputeOpen),
  });

  return {
    modelVersion: VEY_FINANCE_VERSION,
    id: buildIntentId(input, createdAt),
    concept: 'trade-execution-robot-not-general-payment-app',
    purpose,
    status,
    nextAction: nextActionFor(status),
    createdAt,
    updatedAt,
    originCountry,
    destinationCountry,
    ...(clean(input.orderAlias, 120) ? { orderAlias: clean(input.orderAlias, 120) } : {}),
    ...(clean(input.shipmentAlias, 120) ? { shipmentAlias: clean(input.shipmentAlias, 120) } : {}),
    ...(clean(input.shipmentCommitment, 120) ? { shipmentCommitment: clean(input.shipmentCommitment, 120) } : {}),
    ...(hsCode ? { hsCode } : {}),
    ...(productCategory ? { productCategory } : {}),
    ...(productDescription ? { productDescription } : {}),
    incoterm,
    paymentProvider,
    paymentStatus,
    shipmentStatus,
    highRiskMode,
    landedCost,
    taxEstimate,
    remittancePlan,
    escrowPlan,
    evidence: evidenceResult.evidence,
    dataSources: {
      taxPlanVersion: getTaxOpenSourceDataPlan().version,
      tradePlanVersion: getTradeComplianceDataPlan().version,
      defaultTradeSourceIds: getRecommendedFullyFreeTradeComplianceSources().map((source) => source.id),
    },
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings)),
    manualReviewReasons: Array.from(new Set(manualReviewReasons)),
    requiredControls: Array.from(requiredControls),
    privacy: privacy(),
  };
}

export function validateVeyFinanceTradeIntent(intent: VeyFinanceIntent) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (intent.modelVersion !== VEY_FINANCE_VERSION) errors.push('vey-finance-version-mismatch');
  if (intent.concept !== 'trade-execution-robot-not-general-payment-app') {
    errors.push('vey-finance-concept-must-not-be-general-payment-app');
  }
  if (intent.purpose === 'general-payment' || intent.purpose === 'domestic-pos') {
    errors.push('vey-finance-general-payment-purpose-not-allowed');
  }
  if (intent.privacy.rawAddressStored !== false) errors.push('vey-finance-raw-address-stored');
  if (intent.privacy.rawAgidStored !== false) errors.push('vey-finance-raw-agid-stored');
  if (intent.privacy.rawAoidStored !== false) errors.push('vey-finance-raw-aoid-stored');
  if (intent.privacy.cardPanStored !== false) errors.push('vey-finance-card-pan-stored');
  if (intent.privacy.bankAccountStored !== false) errors.push('vey-finance-bank-account-stored');
  if (intent.remittancePlan.finalFilingPerformed !== false) errors.push('vey-finance-local-model-must-not-mark-final-filing-performed');
  if (intent.remittancePlan.authorityPaymentInstructionStored !== false) {
    errors.push('vey-finance-authority-payment-instruction-must-not-be-stored-in-local-model');
  }
  if (intent.status === 'released' && !intent.escrowPlan.canReleaseNow && intent.escrowPlan.status !== 'released') {
    warnings.push('vey-finance-released-status-without-current-release-condition');
  }

  const publicText = [
    intent.id,
    intent.orderAlias,
    intent.shipmentAlias,
    intent.shipmentCommitment,
    intent.hsCode,
    intent.productCategory,
    intent.productDescription,
    ...intent.evidence.flatMap((item) => [item.sourceId, item.evidenceRef, item.safeFingerprint]),
    ...intent.errors,
    ...intent.warnings,
    ...intent.manualReviewReasons,
  ].filter(Boolean).join('\n');
  if (PRIVATE_ID_VALUE_RE.test(publicText) || PRIVATE_CONTACT_OR_COORD_VALUE_RE.test(publicText)) {
    errors.push('vey-finance-public-surface-contains-private-token');
  }

  return {
    ok: errors.length === 0 && intent.status !== 'rejected',
    errors,
    warnings,
    auditRef: compactHash({
      modelVersion: intent.modelVersion,
      id: intent.id,
      status: intent.status,
      landedCost: intent.landedCost,
      taxLines: intent.taxEstimate.lines,
      evidence: intent.evidence,
    }, 'veyfinance_audit'),
  };
}

import {
  createInMemoryEthereumRegistryOnlyStore,
  type EthereumPaymentRecord,
  type EthereumPaymentStatus,
  type EthereumRegistryOnlyTxPlan,
} from './ethereumRegistryOnlyMode';
import { sha256Hex } from './sha256';

export const POS_ETHEREUM_PAYMENT_VERSION = 'agid-pos-ethereum-payment-v1';

export type PosEthereumPaymentKind = 'prepaid' | 'collect-on-delivery';
export type PosEthereumSettlementMode = 'offchain-observed' | 'ethereum-registry' | 'ethereum-escrow';
export type PosEthereumPaymentStatus =
  | 'requires-payment'
  | 'authorized'
  | 'escrowed'
  | 'paid'
  | 'released'
  | 'refunded'
  | 'cancelled'
  | 'rejected'
  | 'review';

export type PosEthereumPaymentInput = {
  paymentKind?: unknown;
  settlementMode?: unknown;
  paymentId?: unknown;
  escrowId?: unknown;
  waybillAlias?: unknown;
  waybillCommitment?: unknown;
  payerCommitment?: unknown;
  payeeCommitment?: unknown;
  purpose?: unknown;
  amount?: unknown;
  currency?: unknown;
  tokenSymbol?: unknown;
  tokenContract?: unknown;
  networkId?: unknown;
  paymentContractAddress?: unknown;
  observedTxHash?: unknown;
  paymentStatus?: unknown;
  dueAt?: unknown;
  paidAt?: unknown;
  releaseAfterHandoff?: unknown;
  highRiskMode?: unknown;
  rawAddress?: unknown;
  rawAgid?: unknown;
  rawAoid?: unknown;
  privateKey?: unknown;
  seedPhrase?: unknown;
  cardPan?: unknown;
  phone?: unknown;
};

export type PosEthereumHandoffGate = {
  canAcceptCarrierScan: boolean;
  canReleasePackage: boolean;
  canCompleteHandoff: boolean;
  reason: string;
};

export type PosEthereumPaymentDecision = {
  modelVersion: typeof POS_ETHEREUM_PAYMENT_VERSION;
  paymentId: string;
  escrowId: string;
  paymentKind: PosEthereumPaymentKind;
  settlementMode: PosEthereumSettlementMode;
  status: PosEthereumPaymentStatus;
  accepted: boolean;
  requiredAction: string;
  amount: string | null;
  currency: string | null;
  tokenSymbol: string | null;
  tokenContract: string | null;
  networkId: string;
  publicPaymentRef: string;
  ethereumRecord?: EthereumPaymentRecord;
  txPlan?: EthereumRegistryOnlyTxPlan;
  handoffGate: PosEthereumHandoffGate;
  requiredControls: string[];
  errors: string[];
  warnings: string[];
  privacy: {
    rawAddressStored: false;
    rawAgidStored: false;
    rawAoidStored: false;
    privateKeyStored: false;
    walletAddressRequired: false;
    publicLedgerWritePlanned: boolean;
    publicLedgerWriteObserved: boolean;
    forbiddenMaterial: string[];
    storedMaterial: string[];
  };
};

const DEFAULT_NETWORK_ID = 'base-sepolia';
const FORBIDDEN_INPUT_KEYS = [
  'rawAddress',
  'rawAgid',
  'rawAoid',
  'privateKey',
  'seedPhrase',
  'cardPan',
  'phone',
] as const;

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

function cleanText(value: unknown) {
  const text = String(value ?? '').normalize('NFKC').trim();
  return text.length > 0 ? text : '';
}

function cleanBoundedText(value: unknown, maxLength = 160) {
  return cleanText(value).slice(0, maxLength);
}

function cleanAmount(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return String(Math.round(value * 1000000) / 1000000);
  }
  const text = cleanText(value);
  if (!text) return null;
  const normalized = text.replace(/,/g, '');
  return /^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(normalized) ? normalized : null;
}

function cleanCurrency(value: unknown) {
  const text = cleanText(value).toUpperCase();
  return /^[A-Z0-9]{2,12}$/.test(text) ? text : null;
}

function cleanTokenContract(value: unknown) {
  const text = cleanText(value);
  if (!text) return null;
  return /^0x[a-fA-F0-9]{40}$/.test(text) ? text.toLowerCase() : null;
}

function bytes32Hash(value: unknown) {
  return `0x${sha256Hex(stableJson(value))}`.toLowerCase();
}

function isBytes32(value: string) {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

function cleanTxHash(value: unknown) {
  const text = cleanText(value);
  if (!text) return null;
  return /^0x[a-fA-F0-9]{64}$/.test(text) ? text.toLowerCase() : null;
}

function cleanCommitment(value: unknown, fallbackSeed?: unknown) {
  const text = cleanBoundedText(value, 256);
  if (!text) return fallbackSeed === undefined ? null : bytes32Hash(fallbackSeed);
  if (isBytes32(text)) return text.toLowerCase();
  if (/\bA(?:GID|OID)[-_][A-Z0-9]/i.test(text)) return null;
  if (/^\s*[-+]?\d{1,2}\.\d+\s*,\s*[-+]?\d{1,3}\.\d+\s*$/.test(text)) return null;
  return bytes32Hash({
    kind: 'agid-pos-public-commitment-alias',
    text,
  });
}

function normalizePaymentKind(value: unknown): PosEthereumPaymentKind {
  const text = cleanText(value).toLowerCase();
  if (text === 'collect' || text === 'cod' || text === 'cash-on-delivery' || text === '着払' || text === '着払い') {
    return 'collect-on-delivery';
  }
  if (text === 'collect-on-delivery') return text;
  return 'prepaid';
}

function normalizeSettlementMode(value: unknown): PosEthereumSettlementMode {
  const text = cleanText(value).toLowerCase();
  if (text === 'ethereum-registry' || text === 'ethereum-escrow' || text === 'offchain-observed') return text;
  if (text === 'escrow') return 'ethereum-escrow';
  if (text === 'registry' || text === 'ethereum') return 'ethereum-registry';
  return 'ethereum-registry';
}

function normalizePaymentStatus(value: unknown): PosEthereumPaymentStatus {
  const text = cleanText(value).toLowerCase();
  if (
    text === 'authorized'
    || text === 'escrowed'
    || text === 'paid'
    || text === 'released'
    || text === 'refunded'
    || text === 'cancelled'
    || text === 'rejected'
    || text === 'review'
  ) {
    return text;
  }
  return 'requires-payment';
}

function toEthereumPaymentStatus(status: PosEthereumPaymentStatus): EthereumPaymentStatus {
  if (status === 'escrowed' || status === 'released' || status === 'refunded' || status === 'cancelled') return status;
  return 'authorized';
}

function isPaymentSettled(status: PosEthereumPaymentStatus, observedTxHash: string | null) {
  return Boolean(observedTxHash)
    || status === 'authorized'
    || status === 'escrowed'
    || status === 'paid'
    || status === 'released';
}

function buildPublicRef(input: {
  paymentId: string;
  escrowId: string;
  paymentKind: PosEthereumPaymentKind;
  amount: string | null;
  currency: string | null;
  observedTxHash: string | null;
}) {
  return `PEP-${sha256Hex(stableJson(input)).slice(0, 24).toUpperCase()}`;
}

function amountDecimals(symbol: string | null) {
  if (!symbol) return 0;
  if (symbol === 'ETH' || symbol === 'WETH' || symbol === 'DAI') return 18;
  if (symbol === 'USDC' || symbol === 'USDT') return 6;
  if (symbol === 'USD' || symbol === 'EUR' || symbol === 'GBP') return 2;
  return 0;
}

function amountToBaseUnits(amount: string | null, symbol: string | null) {
  if (!amount) return null;
  const decimals = amountDecimals(symbol);
  const [whole, fractional = ''] = amount.split('.');
  const paddedFractional = (fractional + '0'.repeat(decimals)).slice(0, decimals);
  const normalized = `${whole}${paddedFractional}`.replace(/^0+(?=\d)/, '');
  return normalized || '0';
}

function hasAnyPaymentSignal(input: PosEthereumPaymentInput) {
  return Boolean(
    cleanText(input.paymentKind)
    || cleanText(input.settlementMode)
    || cleanText(input.paymentId)
    || cleanText(input.escrowId)
    || cleanText(input.payerCommitment)
    || cleanText(input.payeeCommitment)
    || cleanText(input.tokenSymbol)
    || cleanText(input.tokenContract)
    || cleanText(input.observedTxHash)
    || cleanText(input.paymentStatus)
  );
}

export function hasPosEthereumPaymentSignal(input: PosEthereumPaymentInput) {
  return hasAnyPaymentSignal(input);
}

export function evaluatePosEthereumPayment(input: PosEthereumPaymentInput): PosEthereumPaymentDecision {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredControls = new Set<string>([
    'domain-separated-payment-id',
    'no-raw-address-or-agid-on-chain',
    'receipt-before-release',
  ]);

  for (const key of FORBIDDEN_INPUT_KEYS) {
    if (cleanText(input[key])) {
      errors.push(`${key}-not-allowed-in-pos-ethereum-payment`);
    }
  }

  const paymentKind = normalizePaymentKind(input.paymentKind);
  const settlementMode = normalizeSettlementMode(input.settlementMode);
  const amount = cleanAmount(input.amount);
  const currency = cleanCurrency(input.currency) ?? cleanCurrency(input.tokenSymbol);
  const tokenSymbol = cleanCurrency(input.tokenSymbol) ?? currency;
  const tokenContract = cleanTokenContract(input.tokenContract);
  const observedTxHash = cleanTxHash(input.observedTxHash);
  const networkId = cleanBoundedText(input.networkId, 64) || DEFAULT_NETWORK_ID;
  const contractAddress = cleanTokenContract(input.paymentContractAddress);
  const purpose = cleanBoundedText(input.purpose, 120) || 'delivery-pos-payment';
  const waybillAlias = cleanBoundedText(input.waybillAlias, 120);
  const waybillCommitment = cleanCommitment(input.waybillCommitment);
  const paymentStatus = normalizePaymentStatus(input.paymentStatus);
  const status = observedTxHash && paymentStatus === 'requires-payment'
    ? 'paid'
    : paymentStatus;
  const settled = isPaymentSettled(status, observedTxHash);
  const releaseAfterHandoff = input.releaseAfterHandoff !== false;
  const highRiskMode = Boolean(input.highRiskMode);

  if (cleanText(input.observedTxHash) && !observedTxHash) errors.push('observed-payment-tx-hash-invalid');
  if (cleanText(input.tokenContract) && !tokenContract) errors.push('token-contract-address-invalid');
  if (cleanText(input.paymentContractAddress) && !contractAddress) errors.push('payment-contract-address-invalid');
  if (input.amount !== undefined && input.amount !== null && cleanText(input.amount) && !amount) errors.push('payment-amount-invalid');
  if ((input.currency !== undefined || input.tokenSymbol !== undefined) && !currency && !tokenSymbol) errors.push('payment-currency-or-token-symbol-invalid');
  if (!amount) warnings.push('payment-amount-not-captured');
  if (!currency && !tokenSymbol) warnings.push('payment-currency-not-captured');
  if (settlementMode !== 'offchain-observed') requiredControls.add('ethereum-registry-receipt-check');
  if (settlementMode === 'ethereum-escrow') requiredControls.add('escrow-release-after-handoff');
  if (paymentKind === 'collect-on-delivery') requiredControls.add('recipient-payment-before-release');
  if (highRiskMode) {
    requiredControls.add('short-expiry-and-post-receipt-revocation');
    warnings.push('high-risk-payment-mode-use-aliases-and-short-ttl');
  }

  const payerSeed = {
      paymentKind,
      waybillAlias,
      waybillCommitment,
      purpose,
  };
  const payeeSeed = {
      settlementMode,
      networkId,
      purpose,
  };
  const payerCommitment = cleanCommitment(input.payerCommitment, payerSeed);
  const payeeCommitment = cleanCommitment(input.payeeCommitment, payeeSeed);
  if (cleanText(input.payerCommitment) && !cleanCommitment(input.payerCommitment)) errors.push('payer-commitment-invalid-or-private');
  if (cleanText(input.payeeCommitment) && !cleanCommitment(input.payeeCommitment)) errors.push('payee-commitment-invalid-or-private');

  const escrowId = cleanBoundedText(input.escrowId, 120)
    || `ESCROW-${sha256Hex(stableJson({ payerCommitment, payeeCommitment, waybillCommitment, purpose })).slice(0, 16).toUpperCase()}`;
  const paymentId = cleanBoundedText(input.paymentId, 120)
    || `PAY-${sha256Hex(stableJson({ escrowId, paymentKind, amount, currency, tokenSymbol })).slice(0, 16).toUpperCase()}`;
  const publicPaymentRef = buildPublicRef({
    paymentId,
    escrowId,
    paymentKind,
    amount,
    currency: tokenSymbol ?? currency,
    observedTxHash,
  });
  const purposeHash = bytes32Hash({
    purpose,
    paymentKind,
    waybillAlias,
    waybillCommitment,
  });
  const chainAmount = amountToBaseUnits(amount, tokenSymbol ?? currency);
  if (amount && chainAmount !== amount) warnings.push('payment-amount-converted-to-base-units-for-ethereum');

  let ethereumRecord: EthereumPaymentRecord | undefined;
  let txPlan: EthereumRegistryOnlyTxPlan | undefined;
  if (settlementMode !== 'offchain-observed' && errors.length === 0) {
    const store = createInMemoryEthereumRegistryOnlyStore();
    const result = store.recordPayment({
      paymentId,
      escrowId,
      payerCommitment,
      payeeCommitment,
      purposeHash,
      tokenSymbol: tokenSymbol ?? currency ?? undefined,
      tokenContract: tokenContract ?? undefined,
      amount: chainAmount ?? undefined,
      paymentStatus: toEthereumPaymentStatus(status),
      networkId,
      contractAddress: contractAddress ?? undefined,
      observedTxHash: observedTxHash ?? undefined,
      now: cleanText(input.paidAt) || undefined,
    });
    if (result.record) ethereumRecord = result.record;
    if (result.txPlan) txPlan = result.txPlan;
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  let requiredAction = 'payment-ready-for-pos-handoff';
  let handoffGate: PosEthereumHandoffGate = {
    canAcceptCarrierScan: true,
    canReleasePackage: true,
    canCompleteHandoff: true,
    reason: 'payment-confirmed',
  };

  if (status === 'rejected' || status === 'cancelled') {
    requiredAction = 'reject-payment-before-handoff';
    handoffGate = {
      canAcceptCarrierScan: false,
      canReleasePackage: false,
      canCompleteHandoff: false,
      reason: 'payment-rejected-or-cancelled',
    };
  } else if (status === 'refunded') {
    requiredAction = 'review-refunded-payment-before-release';
    handoffGate = {
      canAcceptCarrierScan: true,
      canReleasePackage: false,
      canCompleteHandoff: false,
      reason: 'payment-refunded',
    };
  } else if (!settled) {
    requiredAction = paymentKind === 'collect-on-delivery'
      ? 'collect-payment-from-recipient-before-release'
      : 'confirm-prepayment-or-escrow-before-release';
    handoffGate = {
      canAcceptCarrierScan: true,
      canReleasePackage: false,
      canCompleteHandoff: false,
      reason: paymentKind === 'collect-on-delivery'
        ? 'collect-on-delivery-payment-pending'
        : 'prepayment-pending',
    };
  } else if (settlementMode === 'ethereum-escrow' && releaseAfterHandoff && status !== 'released') {
    requiredAction = 'release-escrow-after-recipient-proof';
    handoffGate = {
      canAcceptCarrierScan: true,
      canReleasePackage: true,
      canCompleteHandoff: true,
      reason: 'escrow-funded-release-after-handoff',
    };
  }

  return {
    modelVersion: POS_ETHEREUM_PAYMENT_VERSION,
    paymentId,
    escrowId,
    paymentKind,
    settlementMode,
    status,
    accepted: errors.length === 0 && handoffGate.canAcceptCarrierScan,
    requiredAction,
    amount,
    currency,
    tokenSymbol,
    tokenContract,
    networkId,
    publicPaymentRef,
    ...(ethereumRecord ? { ethereumRecord } : {}),
    ...(txPlan ? { txPlan } : {}),
    handoffGate,
    requiredControls: Array.from(requiredControls),
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings)),
    privacy: {
      rawAddressStored: false,
      rawAgidStored: false,
      rawAoidStored: false,
      privateKeyStored: false,
      walletAddressRequired: false,
      publicLedgerWritePlanned: settlementMode !== 'offchain-observed' && Boolean(txPlan),
      publicLedgerWriteObserved: Boolean(observedTxHash),
      forbiddenMaterial: [
        'raw address',
        'raw AGID',
        'raw AOID',
        'private key',
        'seed phrase',
        'full card number',
        'phone number',
      ],
      storedMaterial: [
        'payment id',
        'escrow id',
        'payer/payee commitments',
        'amount and token symbol',
        'transaction hash tail or registry tx plan',
      ],
    },
  };
}

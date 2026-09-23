import { hashStable } from './redactedWorkflowCore';
import type { Web3ZkMode } from './web3ZkSdkPlan';
import { validateZkPublicSignalSet } from './zkBaselineHardening';

export const WEB3_ZK_ETHEREUM_HARDENING_VERSION = 'web3-zk-ethereum-hardening-v1';

export type Web3ZkEthereumTarget = 'pilot' | 'production';
export type Web3ZkEthereumReleaseStatus =
  | 'blocked'
  | 'review-required'
  | 'ready-for-pilot'
  | 'ready-for-production';

export type Web3ZkEthereumChainCategory =
  | 'local-dev'
  | 'ethereum-mainnet'
  | 'ethereum-testnet'
  | 'l2-mainnet'
  | 'l2-testnet';

export type Web3ZkEthereumContractRole =
  | 'issuer-registry'
  | 'revocation-registry'
  | 'nullifier-registry'
  | 'payment-escrow'
  | 'zk-verifier';

export type Web3ZkEthereumProofSource =
  | 'none'
  | 'typescript-envelope'
  | 'fixture-circuit'
  | 'circom-snarkjs'
  | 'external-audited-prover';

export type Web3ZkEthereumAuditStatus =
  | 'none'
  | 'internal-review'
  | 'external-audit'
  | 'production-approved';

export type Web3ZkEthereumControlId =
  | 'chain-allowlist'
  | 'registry-contracts'
  | 'zk-proof-provenance'
  | 'no-raw-public-payload'
  | 'nullifier-domain-separation'
  | 'transport-and-secret-policy'
  | 'onchain-evidence'
  | 'sdk-boundary';

export type Web3ZkChainProfile = {
  chainId: number;
  slug: string;
  displayName: string;
  category: Web3ZkEthereumChainCategory;
  settlementLayer: 'local-dev' | 'ethereum-l1' | 'ethereum-l2';
  productionAllowed: boolean;
  pilotAllowed: boolean;
  defaultConfirmations: number;
  walletUiSupported: boolean;
  canonicalClient: 'viem';
  notes: string[];
};

export type Web3ZkEthereumHardeningControl = {
  id: Web3ZkEthereumControlId;
  title: string;
  requirement: string;
  productionBlockerIfMissing: boolean;
};

export type Web3ZkEthereumHardeningPlan = {
  version: typeof WEB3_ZK_ETHEREUM_HARDENING_VERSION;
  principle: string;
  defaultClient: 'viem';
  optionalWalletUi: 'wagmi';
  controls: Web3ZkEthereumHardeningControl[];
  chainProfiles: Web3ZkChainProfile[];
  releaseCommands: string[];
  forbiddenPublicPayloadKeys: string[];
};

export type Web3ZkEthereumProverEvidence = {
  proofGeneratedBy?: Web3ZkEthereumProofSource;
  auditStatus?: Web3ZkEthereumAuditStatus;
  circuitId?: unknown;
  verifierKeyReference?: unknown;
  publicSignals?: readonly string[];
  witnessStored?: unknown;
  witnessLogged?: unknown;
};

export type Web3ZkEthereumNullifierPolicy = {
  domainSeparated?: unknown;
  replayProtected?: unknown;
  purposeScoped?: unknown;
  chainScoped?: unknown;
  registryScoped?: unknown;
  terminalSigned?: unknown;
};

export type Web3ZkEthereumTransportPolicy = {
  connectorFetchNoCache?: unknown;
  noUnsafeRetry?: unknown;
  httpsOnly?: unknown;
  gatewayAllowlist?: unknown;
  encryptedSecretStorage?: unknown;
  circuitBreaker?: unknown;
  deadLetterQueue?: unknown;
};

export type Web3ZkEthereumOnchainEvidence = {
  required?: unknown;
  confirmations?: unknown;
  observedTxHashes?: readonly unknown[];
};

export type Web3ZkEthereumTxPayload = {
  chainId?: unknown;
  contractAddress?: unknown;
  publicArguments?: unknown;
  observedTxHash?: unknown;
  confirmations?: unknown;
};

export type Web3ZkEthereumReleaseInput = {
  mode: Web3ZkMode;
  target?: Web3ZkEthereumTarget;
  chainId?: unknown;
  registryContracts?: Partial<Record<Web3ZkEthereumContractRole, unknown>>;
  prover?: Web3ZkEthereumProverEvidence;
  publicPayload?: unknown;
  txPayloads?: Web3ZkEthereumTxPayload[];
  nullifierPolicy?: Web3ZkEthereumNullifierPolicy;
  transportPolicy?: Web3ZkEthereumTransportPolicy;
  onchainEvidence?: Web3ZkEthereumOnchainEvidence;
};

export type Web3ZkRedactedPayload = {
  safe: boolean;
  redacted: unknown;
  findings: string[];
  redactionCount: number;
  publicPayloadHash: string;
};

export type Web3ZkEthereumControlStatus = {
  id: Web3ZkEthereumControlId;
  passed: boolean;
  findings: string[];
};

export type Web3ZkEthereumReleaseEvaluation = {
  version: typeof WEB3_ZK_ETHEREUM_HARDENING_VERSION;
  mode: Web3ZkMode;
  target: Web3ZkEthereumTarget;
  status: Web3ZkEthereumReleaseStatus;
  chainProfile: Web3ZkChainProfile | null;
  controls: Web3ZkEthereumControlStatus[];
  blockers: string[];
  warnings: string[];
  redactedPublicPayload: Web3ZkRedactedPayload;
};

export const WEB3_ZK_CHAIN_PROFILES: Web3ZkChainProfile[] = [
  {
    chainId: 31337,
    slug: 'anvil-local',
    displayName: 'Anvil / Foundry local',
    category: 'local-dev',
    settlementLayer: 'local-dev',
    productionAllowed: false,
    pilotAllowed: true,
    defaultConfirmations: 1,
    walletUiSupported: true,
    canonicalClient: 'viem',
    notes: ['Use for local contract tests only.', 'Never present local-chain state as public settlement.'],
  },
  {
    chainId: 11155111,
    slug: 'sepolia',
    displayName: 'Ethereum Sepolia',
    category: 'ethereum-testnet',
    settlementLayer: 'ethereum-l1',
    productionAllowed: false,
    pilotAllowed: true,
    defaultConfirmations: 12,
    walletUiSupported: true,
    canonicalClient: 'viem',
    notes: ['Use for public test deployments and verifier dry-runs.'],
  },
  {
    chainId: 84532,
    slug: 'base-sepolia',
    displayName: 'Base Sepolia',
    category: 'l2-testnet',
    settlementLayer: 'ethereum-l2',
    productionAllowed: false,
    pilotAllowed: true,
    defaultConfirmations: 12,
    walletUiSupported: true,
    canonicalClient: 'viem',
    notes: ['Good default L2 testnet for wallet-gated pilots.'],
  },
  {
    chainId: 1,
    slug: 'ethereum-mainnet',
    displayName: 'Ethereum Mainnet',
    category: 'ethereum-mainnet',
    settlementLayer: 'ethereum-l1',
    productionAllowed: true,
    pilotAllowed: true,
    defaultConfirmations: 12,
    walletUiSupported: true,
    canonicalClient: 'viem',
    notes: ['Use only for high-assurance public settlement where L1 cost is acceptable.'],
  },
  {
    chainId: 8453,
    slug: 'base-mainnet',
    displayName: 'Base Mainnet',
    category: 'l2-mainnet',
    settlementLayer: 'ethereum-l2',
    productionAllowed: true,
    pilotAllowed: true,
    defaultConfirmations: 12,
    walletUiSupported: true,
    canonicalClient: 'viem',
    notes: ['Preferred low-cost Ethereum L2 profile for registry pilots and production candidates.'],
  },
  {
    chainId: 10,
    slug: 'optimism-mainnet',
    displayName: 'OP Mainnet',
    category: 'l2-mainnet',
    settlementLayer: 'ethereum-l2',
    productionAllowed: true,
    pilotAllowed: true,
    defaultConfirmations: 12,
    walletUiSupported: false,
    canonicalClient: 'viem',
    notes: ['Server-side viem integration is allowed after registry deployment configuration is present.'],
  },
  {
    chainId: 11155420,
    slug: 'optimism-sepolia',
    displayName: 'OP Sepolia',
    category: 'l2-testnet',
    settlementLayer: 'ethereum-l2',
    productionAllowed: false,
    pilotAllowed: true,
    defaultConfirmations: 12,
    walletUiSupported: false,
    canonicalClient: 'viem',
    notes: ['Testnet candidate for OP Stack deployments.'],
  },
  {
    chainId: 42161,
    slug: 'arbitrum-one',
    displayName: 'Arbitrum One',
    category: 'l2-mainnet',
    settlementLayer: 'ethereum-l2',
    productionAllowed: true,
    pilotAllowed: true,
    defaultConfirmations: 12,
    walletUiSupported: false,
    canonicalClient: 'viem',
    notes: ['Server-side viem integration is allowed after registry deployment configuration is present.'],
  },
  {
    chainId: 421614,
    slug: 'arbitrum-sepolia',
    displayName: 'Arbitrum Sepolia',
    category: 'l2-testnet',
    settlementLayer: 'ethereum-l2',
    productionAllowed: false,
    pilotAllowed: true,
    defaultConfirmations: 12,
    walletUiSupported: false,
    canonicalClient: 'viem',
    notes: ['Testnet candidate for Arbitrum deployments.'],
  },
  {
    chainId: 137,
    slug: 'polygon-pos',
    displayName: 'Polygon PoS',
    category: 'l2-mainnet',
    settlementLayer: 'ethereum-l2',
    productionAllowed: true,
    pilotAllowed: true,
    defaultConfirmations: 128,
    walletUiSupported: false,
    canonicalClient: 'viem',
    notes: ['Use only when partners need Polygon compatibility and confirmation policy is explicit.'],
  },
  {
    chainId: 80002,
    slug: 'polygon-amoy',
    displayName: 'Polygon Amoy',
    category: 'l2-testnet',
    settlementLayer: 'ethereum-l2',
    productionAllowed: false,
    pilotAllowed: true,
    defaultConfirmations: 32,
    walletUiSupported: false,
    canonicalClient: 'viem',
    notes: ['Testnet candidate for Polygon compatibility checks.'],
  },
];

export const WEB3_ZK_ETHEREUM_CONTROLS: Web3ZkEthereumHardeningControl[] = [
  {
    id: 'chain-allowlist',
    title: 'Chain allowlist',
    requirement: 'Mode 3/4 must use an explicit AGID chain profile instead of accepting arbitrary chain ids.',
    productionBlockerIfMissing: true,
  },
  {
    id: 'registry-contracts',
    title: 'Registry contract mapping',
    requirement: 'Issuer, revocation, nullifier, and full-ZK verifier contracts must be configured before public writes.',
    productionBlockerIfMissing: true,
  },
  {
    id: 'zk-proof-provenance',
    title: 'ZK proof provenance',
    requirement: 'Full-ZK Ethereum must distinguish TypeScript envelopes, fixtures, reviewed circuits, and audited production proofs.',
    productionBlockerIfMissing: true,
  },
  {
    id: 'no-raw-public-payload',
    title: 'No raw public payload',
    requirement: 'Transactions, public signals, logs, and release metadata must not contain raw address, AGID, AOID, witness, or secret material.',
    productionBlockerIfMissing: true,
  },
  {
    id: 'nullifier-domain-separation',
    title: 'Nullifier domain separation',
    requirement: 'Nullifiers must be replay-protected and scoped by purpose, chain, registry, and proof domain.',
    productionBlockerIfMissing: true,
  },
  {
    id: 'transport-and-secret-policy',
    title: 'Transport and secret policy',
    requirement: 'Ethereum connectors must use no-cache, no unsafe retry, HTTPS, gateway allowlists, encrypted secrets, circuit breakers, and dead-letter handling.',
    productionBlockerIfMissing: true,
  },
  {
    id: 'onchain-evidence',
    title: 'On-chain evidence',
    requirement: 'Production releases must know whether transactions are merely planned or have enough observed confirmations.',
    productionBlockerIfMissing: true,
  },
  {
    id: 'sdk-boundary',
    title: 'SDK boundary',
    requirement: 'viem stays the canonical server client, wagmi remains optional wallet UI, and non-TS SDKs are generated adapters.',
    productionBlockerIfMissing: false,
  },
];

const PRIVATE_PUBLIC_PAYLOAD_KEYS = [
  'address',
  'addresstext',
  'inputaddress',
  'addressline',
  'addresslines',
  'streetaddress',
  'fulladdress',
  'deliveryaddress',
  'rawaddress',
  'rawagid',
  'agid',
  'rawaoid',
  'aoid',
  'agids',
  'agidsecure',
  'agidsciphertext',
  'ciphertext',
  'encryptedpayload',
  'recipient',
  'recipientname',
  'name',
  'fullname',
  'phone',
  'phonenumber',
  'telephone',
  'email',
  'building',
  'buildingname',
  'room',
  'unit',
  'apartment',
  'floor',
  'postcode',
  'postalcode',
  'proofcode',
  'witness',
  'privateinput',
  'privateproofsalt',
  'credentialsecret',
  'holdersecret',
  'ownersecret',
  'ownerprivatekey',
  'secret',
] as const;

const PRIVATE_PUBLIC_PAYLOAD_KEY_SET = new Set<string>(PRIVATE_PUBLIC_PAYLOAD_KEYS);
const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;
const AGID_AOID_VALUE_RE = /\bA(?:GID|OID)[-_][A-Z0-9]/i;
const PRECISE_COORDINATE_VALUE_RE = /^\s*[-+]?\d{1,2}\.\d{5,}\s*,\s*[-+]?\d{1,3}\.\d{5,}\s*$/;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function cleanBoolean(value: unknown) {
  return value === true;
}

function cleanText(value: unknown) {
  const text = String(value ?? '').normalize('NFKC').trim();
  return text ? text : null;
}

function cleanNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeChainId(value: unknown) {
  const chainId = cleanNumber(value);
  return chainId === null ? null : Math.floor(chainId);
}

function normalizeKey(key: string) {
  return key.normalize('NFKC').replace(/[\s_-]/g, '').toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function modeNeedsEthereum(mode: Web3ZkMode) {
  return mode === 'mode-3-ethereum-registry-only' || mode === 'mode-4-full-zk-ethereum';
}

function modeNeedsZk(mode: Web3ZkMode) {
  return mode === 'mode-2-zk-only' || mode === 'mode-4-full-zk-ethereum';
}

function requiredContractsForMode(mode: Web3ZkMode): Web3ZkEthereumContractRole[] {
  if (mode === 'mode-4-full-zk-ethereum') {
    return ['issuer-registry', 'revocation-registry', 'nullifier-registry', 'zk-verifier'];
  }
  if (mode === 'mode-3-ethereum-registry-only') {
    return ['issuer-registry', 'revocation-registry', 'nullifier-registry'];
  }
  return [];
}

function isContractAddress(value: unknown) {
  const text = cleanText(value);
  return Boolean(text && ADDRESS_RE.test(text));
}

function redactValue(value: unknown, path: string, findings: string[]): unknown {
  if (typeof value === 'string') {
    if (AGID_AOID_VALUE_RE.test(value) || PRECISE_COORDINATE_VALUE_RE.test(value)) {
      findings.push(`private-public-payload-value:${path}`);
      return '[REDACTED:private-public-payload-value]';
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => redactValue(item, `${path}[${index}]`, findings));
  }

  if (!isRecord(value)) return value;

  const redacted: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (PRIVATE_PUBLIC_PAYLOAD_KEY_SET.has(normalizeKey(key))) {
      findings.push(`private-public-payload-field:${childPath}`);
      redacted[key] = '[REDACTED:private-public-payload-field]';
      continue;
    }
    redacted[key] = redactValue(child, childPath, findings);
  }
  return redacted;
}

function collectPayloads(input: Web3ZkEthereumReleaseInput): unknown[] {
  return [
    input.publicPayload,
    ...(input.txPayloads ?? []).map((payload) => payload.publicArguments),
  ].filter((payload) => payload !== undefined);
}

function buildCombinedPayload(input: Web3ZkEthereumReleaseInput) {
  const payloads = collectPayloads(input);
  if (payloads.length === 0) return {};
  if (payloads.length === 1) return payloads[0];
  return { payloads };
}

function passControl(id: Web3ZkEthereumControlId, findings: string[] = []): Web3ZkEthereumControlStatus {
  return { id, passed: findings.length === 0, findings: unique(findings) };
}

function addFindings(target: string[], findings: string[]) {
  target.push(...findings.filter(Boolean));
}

function requiredTransportKeys(): Array<keyof Web3ZkEthereumTransportPolicy> {
  return [
    'connectorFetchNoCache',
    'noUnsafeRetry',
    'httpsOnly',
    'gatewayAllowlist',
    'encryptedSecretStorage',
    'circuitBreaker',
    'deadLetterQueue',
  ];
}

function productionZkAuditOk(status: Web3ZkEthereumAuditStatus | undefined) {
  return status === 'external-audit' || status === 'production-approved';
}

function proofSourceOkForProduction(source: Web3ZkEthereumProofSource | undefined) {
  return source === 'circom-snarkjs' || source === 'external-audited-prover';
}

export function getWeb3ZkChainProfile(chainId: unknown): Web3ZkChainProfile | null {
  const normalized = normalizeChainId(chainId);
  if (normalized === null) return null;
  return WEB3_ZK_CHAIN_PROFILES.find((profile) => profile.chainId === normalized) ?? null;
}

export function redactWeb3ZkPublicPayload(payload: unknown): Web3ZkRedactedPayload {
  const findings: string[] = [];
  const redacted = redactValue(payload ?? {}, '$', findings);
  const uniqueFindings = unique(findings);

  return {
    safe: uniqueFindings.length === 0,
    redacted,
    findings: uniqueFindings,
    redactionCount: uniqueFindings.length,
    publicPayloadHash: hashStable(redacted),
  };
}

export function getWeb3ZkEthereumHardeningPlan(): Web3ZkEthereumHardeningPlan {
  return {
    version: WEB3_ZK_ETHEREUM_HARDENING_VERSION,
    principle: 'Keep Ethereum optional, publish only commitments/roots/nullifiers/public verifier signals, and require explicit proof, chain, transport, and no-raw gates before Mode 3 or Mode 4 production use.',
    defaultClient: 'viem',
    optionalWalletUi: 'wagmi',
    controls: WEB3_ZK_ETHEREUM_CONTROLS.map((control) => ({ ...control })),
    chainProfiles: WEB3_ZK_CHAIN_PROFILES.map((profile) => ({
      ...profile,
      notes: [...profile.notes],
    })),
    releaseCommands: [
      'npm run verify:web3-zk-stack',
      'npm run verify:zk-baseline',
      'npm run verify:no-raw-address-kit',
      'npm run lint',
    ],
    forbiddenPublicPayloadKeys: [...PRIVATE_PUBLIC_PAYLOAD_KEYS],
  };
}

export function evaluateWeb3ZkEthereumRelease(
  input: Web3ZkEthereumReleaseInput,
): Web3ZkEthereumReleaseEvaluation {
  const target = input.target ?? 'production';
  const blockers: string[] = [];
  const warnings: string[] = [];
  const controls: Web3ZkEthereumControlStatus[] = [];
  const redactedPublicPayload = redactWeb3ZkPublicPayload(buildCombinedPayload(input));

  addFindings(blockers, redactedPublicPayload.findings);
  controls.push(passControl('no-raw-public-payload', redactedPublicPayload.findings));

  let chainProfile: Web3ZkChainProfile | null = null;
  const chainFindings: string[] = [];
  if (modeNeedsEthereum(input.mode)) {
    chainProfile = getWeb3ZkChainProfile(input.chainId);
    if (!chainProfile) {
      chainFindings.push('unsupported-chain');
    } else if (target === 'production' && !chainProfile.productionAllowed) {
      chainFindings.push(`chain-not-production-allowed:${chainProfile.slug}`);
    } else if (target === 'pilot' && !chainProfile.pilotAllowed) {
      chainFindings.push(`chain-not-pilot-allowed:${chainProfile.slug}`);
    }

    for (const payload of input.txPayloads ?? []) {
      const txChainId = normalizeChainId(payload.chainId);
      if (txChainId !== null && chainProfile && txChainId !== chainProfile.chainId) {
        chainFindings.push(`tx-chain-mismatch:${txChainId}`);
      }
    }
  } else if (input.chainId !== undefined) {
    warnings.push('chain-id-ignored-for-non-ethereum-mode');
  }
  addFindings(blockers, chainFindings);
  controls.push(passControl('chain-allowlist', chainFindings));

  const registryFindings: string[] = [];
  for (const role of requiredContractsForMode(input.mode)) {
    const contract = input.registryContracts?.[role];
    if (!contract) {
      registryFindings.push(`missing-contract:${role}`);
    } else if (!isContractAddress(contract)) {
      registryFindings.push(`invalid-contract-address:${role}`);
    }
  }
  addFindings(blockers, registryFindings);
  controls.push(passControl('registry-contracts', registryFindings));

  const proverFindings: string[] = [];
  const proverWarnings: string[] = [];
  if (modeNeedsZk(input.mode)) {
    const prover = input.prover ?? {};
    const proofGeneratedBy = prover.proofGeneratedBy ?? 'none';
    const auditStatus = prover.auditStatus ?? 'none';

    if (input.mode === 'mode-4-full-zk-ethereum') {
      if (target === 'production') {
        if (!proofSourceOkForProduction(proofGeneratedBy)) {
          proverFindings.push('zk-production-proof-not-generated-by-reviewed-prover');
        }
        if (!productionZkAuditOk(auditStatus)) {
          proverFindings.push('zk-production-audit-required');
        }
      } else if (proofGeneratedBy === 'none' || proofGeneratedBy === 'typescript-envelope') {
        proverWarnings.push('pilot-zk-proof-is-envelope-only');
      }
    }

    if (proofGeneratedBy === 'fixture-circuit' && target === 'production') {
      proverFindings.push('fixture-circuit-cannot-be-production-proof');
    }
    if (!cleanText(prover.circuitId)) proverFindings.push('missing-circuit-id');
    if (!cleanText(prover.verifierKeyReference)) proverFindings.push('missing-verifier-key-reference');
    if (cleanBoolean(prover.witnessStored) || cleanBoolean(prover.witnessLogged)) {
      proverFindings.push('witness-material-cannot-be-stored-or-logged');
    }

    const signalValidation = validateZkPublicSignalSet(prover.publicSignals ?? []);
    addFindings(proverFindings, signalValidation.errors);
    addFindings(proverWarnings, signalValidation.warnings);
    if ((prover.publicSignals ?? []).length === 0) proverFindings.push('missing-public-signal-review');
  }
  addFindings(blockers, proverFindings);
  addFindings(warnings, proverWarnings);
  controls.push(passControl('zk-proof-provenance', proverFindings));

  const nullifierFindings: string[] = [];
  if (input.mode === 'mode-4-full-zk-ethereum') {
    if (!cleanBoolean(input.nullifierPolicy?.domainSeparated)) nullifierFindings.push('domain-separated-nullifier-required');
  }
  if (modeNeedsEthereum(input.mode) || input.mode === 'mode-2-zk-only') {
    if (!cleanBoolean(input.nullifierPolicy?.replayProtected)) nullifierFindings.push('replay-protected-nullifier-required');
    if (!cleanBoolean(input.nullifierPolicy?.purposeScoped)) nullifierFindings.push('purpose-scoped-nullifier-required');
    if (modeNeedsEthereum(input.mode) && !cleanBoolean(input.nullifierPolicy?.chainScoped)) {
      nullifierFindings.push('chain-scoped-nullifier-required');
    }
    if (modeNeedsEthereum(input.mode) && !cleanBoolean(input.nullifierPolicy?.registryScoped)) {
      nullifierFindings.push('registry-scoped-nullifier-required');
    }
  }
  addFindings(blockers, nullifierFindings);
  controls.push(passControl('nullifier-domain-separation', nullifierFindings));

  const transportFindings: string[] = [];
  const transportWarnings: string[] = [];
  if (modeNeedsEthereum(input.mode)) {
    for (const key of requiredTransportKeys()) {
      if (!cleanBoolean(input.transportPolicy?.[key])) {
        const code = `missing-transport-policy:${key}`;
        if (target === 'production') transportFindings.push(code);
        else transportWarnings.push(code);
      }
    }
  }
  addFindings(blockers, transportFindings);
  addFindings(warnings, transportWarnings);
  controls.push(passControl('transport-and-secret-policy', transportFindings));

  const onchainFindings: string[] = [];
  const onchainWarnings: string[] = [];
  if (modeNeedsEthereum(input.mode)) {
    const evidenceRequired = cleanBoolean(input.onchainEvidence?.required) || target === 'production';
    const confirmations = cleanNumber(input.onchainEvidence?.confirmations) ?? 0;
    const requiredConfirmations = chainProfile?.defaultConfirmations ?? 1;
    const observedTxHashes = input.onchainEvidence?.observedTxHashes ?? [];
    const invalidTxHashes = observedTxHashes
      .map(cleanText)
      .filter((hash): hash is string => Boolean(hash && !TX_HASH_RE.test(hash)));

    if (evidenceRequired) {
      if (observedTxHashes.length === 0) onchainFindings.push('onchain-observed-tx-required');
      if (confirmations < requiredConfirmations) {
        onchainFindings.push(`insufficient-confirmations:${confirmations}/${requiredConfirmations}`);
      }
    } else {
      onchainWarnings.push('onchain-evidence-not-required-for-pilot');
    }
    for (const hash of invalidTxHashes) onchainFindings.push(`invalid-observed-tx-hash:${hash}`);
  }
  addFindings(blockers, onchainFindings);
  addFindings(warnings, onchainWarnings);
  controls.push(passControl('onchain-evidence', onchainFindings));

  controls.push(passControl('sdk-boundary'));

  const uniqueBlockers = unique(blockers);
  const uniqueWarnings = unique(warnings);
  let status: Web3ZkEthereumReleaseStatus;
  if (uniqueBlockers.length > 0) {
    status = 'blocked';
  } else if (target === 'pilot') {
    status = 'ready-for-pilot';
  } else if (uniqueWarnings.length > 0 || controls.some((control) => !control.passed)) {
    status = 'review-required';
  } else {
    status = 'ready-for-production';
  }

  return {
    version: WEB3_ZK_ETHEREUM_HARDENING_VERSION,
    mode: input.mode,
    target,
    status,
    chainProfile,
    controls,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    redactedPublicPayload,
  };
}

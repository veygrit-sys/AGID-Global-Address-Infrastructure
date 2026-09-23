export const CRYPTO_BUSINESS_DEVELOPMENT_VERSION = 'agid-crypto-business-development-v1';

export type CryptoBusinessType =
  | 'exchange'
  | 'wallet-provider'
  | 'custody-provider'
  | 'payment-processor'
  | 'stablecoin-or-token-issuer'
  | 'relayer-or-node-operator'
  | 'zk-proof-provider'
  | 'security-auditor'
  | 'carrier-or-pos-integrator';

export type CryptoBusinessContributionTrackId =
  | 'registry-read-adapter'
  | 'registry-write-adapter'
  | 'payment-escrow-gate'
  | 'wallet-operator-ui'
  | 'zk-proof-workflow'
  | 'external-sdk'
  | 'relayer-worker'
  | 'security-audit'
  | 'documentation-and-conformance';

export type CryptoBusinessRiskLevel = 'low' | 'medium' | 'high';

export type CryptoBusinessContributionTrack = {
  id: CryptoBusinessContributionTrackId;
  label: string;
  recommendedFor: CryptoBusinessType[];
  openSourceScope: string[];
  commercialScope: string[];
  publicChainPayload: string[];
  forbiddenPayload: string[];
  requiredTests: string[];
  riskLevel: CryptoBusinessRiskLevel;
  firstIssue: string;
};

export type CryptoBusinessReadinessChecklistItem = {
  id: string;
  label: string;
  required: boolean;
  evidence: string;
};

export type CryptoBusinessDeveloperProgram = {
  version: typeof CRYPTO_BUSINESS_DEVELOPMENT_VERSION;
  positioning: string;
  defaultMode: 'mode-0-local-only' | 'mode-1-server-registry' | 'mode-3-ethereum-registry-only';
  contributionTracks: CryptoBusinessContributionTrack[];
  readinessChecklist: CryptoBusinessReadinessChecklistItem[];
  hardRules: string[];
  recommendedFirstPullRequests: string[];
};

const COMMON_FORBIDDEN_PAYLOAD = [
  'raw address text',
  'raw AGID in public or high-risk contexts',
  'raw AOID',
  'AGID-S ciphertext or decrypted AGID-S payload',
  'recipient name',
  'phone number',
  'room, unit, floor, access note, or private delivery instruction',
  'private keys, seed phrases, passkeys, proof codes, or ZK witnesses',
  'detailed delivery history',
];

const COMMON_PUBLIC_CHAIN_PAYLOAD = [
  'issuer identifier or issuer status',
  'credential commitment',
  'revocation or freshness root',
  'nullifier hash',
  'payment commitment and public settlement status',
  'scope, purpose, verifier metadata, or audit receipt hash',
];

export const CRYPTO_BUSINESS_CONTRIBUTION_TRACKS: CryptoBusinessContributionTrack[] = [
  {
    id: 'registry-read-adapter',
    label: 'Registry read adapter',
    recommendedFor: ['exchange', 'wallet-provider', 'custody-provider', 'carrier-or-pos-integrator', 'relayer-or-node-operator'],
    openSourceScope: [
      'read-only viem examples',
      'generated ABI constants',
      'receipt and event parsing helpers',
      'commitment-only response schemas',
    ],
    commercialScope: [
      'hosted dashboard monitoring',
      'SLA-backed registry availability checks',
      'enterprise alerting and support',
    ],
    publicChainPayload: [...COMMON_PUBLIC_CHAIN_PAYLOAD],
    forbiddenPayload: [...COMMON_FORBIDDEN_PAYLOAD],
    requiredTests: [
      'src/lib/web3ZkSdkPlan.test.ts',
      'src/server/ethereumRegistryClient.test.ts',
      'src/lib/publicPrivateSeparation.test.ts',
    ],
    riskLevel: 'low',
    firstIssue: 'Add a read-only registry example that fetches issuer, revocation, nullifier, and payment status without raw address fields.',
  },
  {
    id: 'registry-write-adapter',
    label: 'Registry write adapter',
    recommendedFor: ['relayer-or-node-operator', 'custody-provider', 'security-auditor'],
    openSourceScope: [
      'signed transaction plan schema',
      'server-side viem submission path',
      'receipt confirmation helpers',
      'no-raw-address event tests',
    ],
    commercialScope: [
      'managed relayer operations',
      'multi-tenant API key management',
      'production custody and approval workflow',
    ],
    publicChainPayload: [...COMMON_PUBLIC_CHAIN_PAYLOAD],
    forbiddenPayload: [...COMMON_FORBIDDEN_PAYLOAD],
    requiredTests: [
      'src/server/ethereumRegistryClient.test.ts',
      'src/server/routes/ethereumRegistryOnlyModeRoutes.test.ts',
      'src/lib/publicPrivateSeparation.test.ts',
    ],
    riskLevel: 'high',
    firstIssue: 'Add a tx-plan allowlist test before adding new write calls.',
  },
  {
    id: 'payment-escrow-gate',
    label: 'POS payment escrow gate',
    recommendedFor: ['payment-processor', 'stablecoin-or-token-issuer', 'exchange', 'carrier-or-pos-integrator'],
    openSourceScope: [
      'payment gate data model',
      'prepaid and collect-on-delivery receipt semantics',
      'payment commitment tests',
      'optional Ethereum settlement mode',
    ],
    commercialScope: [
      'settlement operations',
      'merchant reconciliation',
      'managed dispute workflow',
      'stablecoin treasury and compliance operations',
    ],
    publicChainPayload: [
      'payment commitment',
      'escrow id or short alias',
      'token contract address',
      'token symbol',
      'amount',
      'public payment status',
      'receipt hash',
    ],
    forbiddenPayload: [...COMMON_FORBIDDEN_PAYLOAD],
    requiredTests: [
      'src/lib/posEthereumPayment.test.ts',
      'src/lib/posAcceptance.test.ts',
      'src/lib/carrierLabelIntent.test.ts',
    ],
    riskLevel: 'medium',
    firstIssue: 'Add a POS acceptance test for prepaid and collect-on-delivery with redacted payment receipts.',
  },
  {
    id: 'wallet-operator-ui',
    label: 'Operator wallet UI',
    recommendedFor: ['wallet-provider', 'exchange', 'custody-provider'],
    openSourceScope: [
      'optional wagmi configuration',
      'chain and network labels',
      'transaction purpose preview',
      'wallet privacy rules',
    ],
    commercialScope: [
      'enterprise wallet policy',
      'multi-approver wallet operations',
      'managed API key and wallet environment segregation',
    ],
    publicChainPayload: [...COMMON_PUBLIC_CHAIN_PAYLOAD],
    forbiddenPayload: [...COMMON_FORBIDDEN_PAYLOAD],
    requiredTests: [
      'src/lib/agidWalletConfig.test.ts',
      'src/lib/web3ZkSdkPlan.test.ts',
      'src/lib/publicPrivateSeparation.test.ts',
    ],
    riskLevel: 'medium',
    firstIssue: 'Add a wallet transaction preview that shows purpose, network, contract, and public fields before signing.',
  },
  {
    id: 'zk-proof-workflow',
    label: 'ZK proof workflow',
    recommendedFor: ['zk-proof-provider', 'security-auditor', 'relayer-or-node-operator'],
    openSourceScope: [
      'baseline circuits',
      'proof input schemas',
      'public signal review tests',
      'witness fixture verification scripts',
    ],
    commercialScope: [
      'managed proof generation server',
      'proof queue operations',
      'hardware-backed prover infrastructure',
    ],
    publicChainPayload: [
      'proof type',
      'public signals',
      'verifier metadata',
      'nullifier hash',
      'roots and commitments',
    ],
    forbiddenPayload: [...COMMON_FORBIDDEN_PAYLOAD],
    requiredTests: [
      'src/lib/zkProofRuntime.test.ts',
      'src/lib/zkProofCompatibility.test.ts',
      'scripts/verify-zk-circuit-fixture.test.ts',
    ],
    riskLevel: 'high',
    firstIssue: 'Add a public-signal leakage test before introducing a new circuit.',
  },
  {
    id: 'external-sdk',
    label: 'External SDK and ABI examples',
    recommendedFor: ['exchange', 'wallet-provider', 'custody-provider', 'payment-processor', 'carrier-or-pos-integrator'],
    openSourceScope: [
      'ABI export fixtures',
      'web3.py, Web3j, Nethereum, Alloy examples',
      'test vectors',
      'no-private-field conformance tests',
    ],
    commercialScope: [
      'enterprise integration support',
      'certified connector packages',
      'managed partner onboarding',
    ],
    publicChainPayload: [...COMMON_PUBLIC_CHAIN_PAYLOAD],
    forbiddenPayload: [...COMMON_FORBIDDEN_PAYLOAD],
    requiredTests: [
      'scripts/generate-agid-sdks.test.ts',
      'src/lib/web3ZkSdkPlan.test.ts',
      'src/lib/openApiSpec.test.ts',
    ],
    riskLevel: 'low',
    firstIssue: 'Generate a registry ABI fixture and one read-only example per partner language.',
  },
  {
    id: 'relayer-worker',
    label: 'Relayer and batch anchoring worker',
    recommendedFor: ['relayer-or-node-operator', 'custody-provider', 'security-auditor'],
    openSourceScope: [
      'batch root anchoring model',
      'allowlisted transaction plans',
      'receipt monitor reference worker',
    ],
    commercialScope: [
      'managed relayer fleet',
      'HSM/KMS-backed signing',
      'production monitoring and incident response',
    ],
    publicChainPayload: [...COMMON_PUBLIC_CHAIN_PAYLOAD],
    forbiddenPayload: [...COMMON_FORBIDDEN_PAYLOAD],
    requiredTests: [
      'src/lib/revocationFreshnessRootAnchoring.test.ts',
      'src/lib/ethereumRegistryOnlyMode.test.ts',
      'src/lib/publicPrivateSeparation.test.ts',
    ],
    riskLevel: 'high',
    firstIssue: 'Add a dry-run relayer mode that validates public payloads without signing.',
  },
  {
    id: 'security-audit',
    label: 'Security audit and threat-model contribution',
    recommendedFor: ['security-auditor', 'exchange', 'custody-provider', 'zk-proof-provider'],
    openSourceScope: [
      'threat model updates',
      'privacy boundary tests',
      'contract event review',
      'ZK witness and public signal review',
    ],
    commercialScope: [
      'formal third-party audit engagement',
      'private deployment assessment',
      'incident response retainer',
    ],
    publicChainPayload: [...COMMON_PUBLIC_CHAIN_PAYLOAD],
    forbiddenPayload: [...COMMON_FORBIDDEN_PAYLOAD],
    requiredTests: [
      'src/lib/securityPrivacyDesign.test.ts',
      'src/lib/privacyLeakageRoleVerification.test.ts',
      'src/lib/publicPrivateSeparation.test.ts',
    ],
    riskLevel: 'medium',
    firstIssue: 'Add an attack-path test for raw address leakage through public registry or logs.',
  },
  {
    id: 'documentation-and-conformance',
    label: 'Documentation and conformance',
    recommendedFor: ['exchange', 'wallet-provider', 'payment-processor', 'carrier-or-pos-integrator', 'security-auditor'],
    openSourceScope: [
      'developer onboarding guide',
      'mode selection guide',
      'privacy-safe contribution checklist',
      'conformance test index',
    ],
    commercialScope: [
      'partner certification',
      'enterprise launch review',
      'training and implementation workshops',
    ],
    publicChainPayload: [...COMMON_PUBLIC_CHAIN_PAYLOAD],
    forbiddenPayload: [...COMMON_FORBIDDEN_PAYLOAD],
    requiredTests: [
      'src/lib/cryptoBusinessDevelopment.test.ts',
      'src/lib/frontendImplementationPreparation.test.ts',
      'src/lib/web3ZkSdkPlan.test.ts',
    ],
    riskLevel: 'low',
    firstIssue: 'Create a crypto-business contributor guide that separates protocol contributions from token or custody operations.',
  },
];

export const CRYPTO_BUSINESS_READINESS_CHECKLIST: CryptoBusinessReadinessChecklistItem[] = [
  {
    id: 'mode-selection',
    label: 'Select the minimum mode needed: local/server first, Ethereum/ZK only when required.',
    required: true,
    evidence: 'Mode table in the implementation plan or pull request description.',
  },
  {
    id: 'public-private-separation',
    label: 'Run public/private separation before any registry, event, webhook, QR, or chain export.',
    required: true,
    evidence: 'Passing publicPrivateSeparation tests and a listed payload allowlist.',
  },
  {
    id: 'no-raw-on-chain',
    label: 'Do not put raw address, raw AGID, raw AOID, AGID-S, recipient identity, or witness data on-chain.',
    required: true,
    evidence: 'Contract event and transaction tests showing commitment-only public fields.',
  },
  {
    id: 'wallet-purpose-preview',
    label: 'Wallet signing screens show transaction purpose, contract, network, and public fields before signing.',
    required: true,
    evidence: 'Wallet UI test or screenshot plus agidWalletConfig privacy-rule coverage.',
  },
  {
    id: 'legal-review-not-encoded',
    label: 'Business/legal obligations are handled outside protocol code and documented as deployment responsibilities.',
    required: true,
    evidence: 'README or deployment note that avoids claiming automatic regulatory compliance.',
  },
  {
    id: 'test-vector-conformance',
    label: 'SDKs and adapters use canonical ABI, OpenAPI, and AGID/AOID test vectors.',
    required: true,
    evidence: 'Conformance tests or generated SDK parity vectors.',
  },
  {
    id: 'security-review',
    label: 'High-risk write paths, relayers, escrow, custody, and ZK flows receive security review before production.',
    required: true,
    evidence: 'Threat-model section and listed tests for the affected track.',
  },
];

export const CRYPTO_BUSINESS_HARD_RULES = [
  'AGID/AOID is a privacy-preserving address infrastructure project, not a token-launch requirement.',
  'Crypto integrations are optional verification, payment, registry, and proof layers.',
  'Mode 0 and Mode 1 must remain usable without wallets, ZK, Ethereum, gas, or custody assumptions.',
  'Never use a fixed public AOID as a cross-service identifier.',
  'Never ask a wallet to sign raw address text, raw AOID records, AGID-S payloads, recipient identity, or private delivery notes.',
  'Every public chain or registry payload must be commitment-only for private fields.',
  'Commercial hosted operations must not be required to verify the public standard.',
];

export function getCryptoBusinessDeveloperProgram(): CryptoBusinessDeveloperProgram {
  return {
    version: CRYPTO_BUSINESS_DEVELOPMENT_VERSION,
    positioning: 'Enable crypto businesses to contribute registry, payment, wallet, ZK, SDK, relayer, and audit features while keeping AGID/AOID local-first and privacy-preserving.',
    defaultMode: 'mode-0-local-only',
    contributionTracks: CRYPTO_BUSINESS_CONTRIBUTION_TRACKS.map(track => ({
      ...track,
      recommendedFor: [...track.recommendedFor],
      openSourceScope: [...track.openSourceScope],
      commercialScope: [...track.commercialScope],
      publicChainPayload: [...track.publicChainPayload],
      forbiddenPayload: [...track.forbiddenPayload],
      requiredTests: [...track.requiredTests],
    })),
    readinessChecklist: CRYPTO_BUSINESS_READINESS_CHECKLIST.map(item => ({ ...item })),
    hardRules: [...CRYPTO_BUSINESS_HARD_RULES],
    recommendedFirstPullRequests: [
      'Add a read-only registry adapter example with commitment-only response tests.',
      'Add a wallet transaction purpose preview that blocks private payload signing.',
      'Add POS payment gate conformance examples for prepaid and collect-on-delivery.',
      'Add public-signal leakage tests before adding production ZK circuits.',
      'Add SDK ABI generation examples for one external language at a time.',
    ],
  };
}

export function getCryptoBusinessTracksForBusinessType(
  businessType: CryptoBusinessType,
): CryptoBusinessContributionTrack[] {
  return getCryptoBusinessDeveloperProgram().contributionTracks
    .filter(track => track.recommendedFor.includes(businessType));
}

export function validateCryptoBusinessDeveloperProgram(
  program = getCryptoBusinessDeveloperProgram(),
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<CryptoBusinessContributionTrackId>();

  for (const track of program.contributionTracks) {
    if (ids.has(track.id)) errors.push(`duplicate-track:${track.id}`);
    ids.add(track.id);
    if (track.openSourceScope.length === 0) errors.push(`missing-open-source-scope:${track.id}`);
    if (track.commercialScope.length === 0) errors.push(`missing-commercial-scope:${track.id}`);
    if (track.publicChainPayload.length === 0) errors.push(`missing-public-chain-payload:${track.id}`);
    if (track.forbiddenPayload.length === 0) errors.push(`missing-forbidden-payload:${track.id}`);
    if (!track.forbiddenPayload.some(item => /raw address/i.test(item))) {
      errors.push(`track-does-not-forbid-raw-address:${track.id}`);
    }
    if (!track.forbiddenPayload.some(item => /raw AOID/i.test(item))) {
      errors.push(`track-does-not-forbid-raw-aoid:${track.id}`);
    }
    if (track.requiredTests.length === 0) errors.push(`missing-required-tests:${track.id}`);
    if (track.riskLevel === 'high' && !track.requiredTests.some(test => /publicPrivateSeparation|zk|ethereum|route/i.test(test))) {
      errors.push(`high-risk-track-without-boundary-tests:${track.id}`);
    }
  }

  for (const item of program.readinessChecklist) {
    if (item.required && !item.evidence.trim()) errors.push(`required-checklist-item-without-evidence:${item.id}`);
  }

  if (!program.hardRules.some(rule => /not a token-launch requirement/i.test(rule))) {
    warnings.push('positioning-should-avoid-token-first-language');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

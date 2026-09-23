export const WEB3_ZK_SDK_PLAN_VERSION = 'web3-zk-sdk-plan-v1';

export type Web3ZkSdkName =
  | 'viem'
  | 'wagmi'
  | 'ethers.js'
  | 'web3.py'
  | 'Web3j'
  | 'Nethereum'
  | 'Alloy'
  | 'Circom'
  | 'snarkjs';

export type Web3ZkSupportToolName =
  | 'abitype'
  | '@tanstack/react-query'
  | 'OpenZeppelin Contracts'
  | 'Foundry'
  | 'Anvil'
  | 'Hardhat'
  | 'Solidity verifier exports'
  | 'Poseidon hash library'
  | 'Noir'
  | 'Halo2'
  | 'RISC Zero'
  | 'SP1';

export type Web3ZkLayer =
  | 'browser-wallet-ui'
  | 'server-rpc-client'
  | 'external-sdk'
  | 'zk-circuit'
  | 'zk-tooling';

export type Web3ZkMode =
  | 'mode-0-local-only'
  | 'mode-1-server-registry'
  | 'mode-2-zk-only'
  | 'mode-3-ethereum-registry-only'
  | 'mode-4-full-zk-ethereum';

export type Web3ZkSdkRole = {
  sdk: Web3ZkSdkName;
  layer: Web3ZkLayer;
  primaryUse: string;
  preferredFor: Web3ZkMode[];
  repositoryStatus: 'implemented' | 'recommended' | 'optional-adapter' | 'future-work';
  installByDefault: boolean;
  privacyBoundary: string;
  notes: string[];
};

export type Web3ZkAdoptionPhase =
  | 'already-installed'
  | 'install-now'
  | 'install-when-feature-starts'
  | 'generate-external-sdk'
  | 'research-first'
  | 'avoid-for-now';

export type Web3ZkAdoptionDecision = {
  name: Web3ZkSdkName | Web3ZkSupportToolName;
  phase: Web3ZkAdoptionPhase;
  target: 'app-runtime' | 'server-runtime' | 'dev-tooling' | 'external-sdk' | 'zk-circuit' | 'zk-prover';
  useWhen: string;
  doNotUseFor: string;
  concreteNextStep: string;
};

export type Web3ZkSdkPlan = {
  version: typeof WEB3_ZK_SDK_PLAN_VERSION;
  rule: string;
  roles: Web3ZkSdkRole[];
  adoption: Web3ZkAdoptionDecision[];
};

export const WEB3_ZK_SDK_ROLES: Web3ZkSdkRole[] = [
  {
    sdk: 'viem',
    layer: 'server-rpc-client',
    primaryUse: 'Default TypeScript RPC, ABI, signing, transaction submission, and receipt confirmation for AGID registry contracts.',
    preferredFor: ['mode-3-ethereum-registry-only', 'mode-4-full-zk-ethereum'],
    repositoryStatus: 'implemented',
    installByDefault: true,
    privacyBoundary: 'Submit only issuer, commitment, revocation/freshness root, nullifier, payment, and verifier metadata. Never submit raw AGID, AOID, address, AGID-S ciphertext, or delivery history.',
    notes: [
      'Already used by AgidEthereumRegistryClient.',
      'Keep this as the canonical TypeScript server client because it is small, typed, and ABI-first.',
    ],
  },
  {
    sdk: 'wagmi',
    layer: 'browser-wallet-ui',
    primaryUse: 'Optional React wallet connection, chain switching, account display, and user-authorized transactions in the AGID/POS operator UI.',
    preferredFor: ['mode-3-ethereum-registry-only', 'mode-4-full-zk-ethereum'],
    repositoryStatus: 'recommended',
    installByDefault: false,
    privacyBoundary: 'Browser wallet flows must show public transaction intent and must not ask users to sign payloads containing raw addresses, AOIDs, or AGID-S payloads.',
    notes: [
      'Use only in screens where an operator or issuer explicitly connects a wallet.',
      'Keep POS local-only and server-registry modes free of wallet dependencies.',
    ],
  },
  {
    sdk: 'ethers.js',
    layer: 'server-rpc-client',
    primaryUse: 'Compatibility adapter for teams that already standardize on ethers.js, especially legacy contract tooling and scripts.',
    preferredFor: ['mode-3-ethereum-registry-only', 'mode-4-full-zk-ethereum'],
    repositoryStatus: 'optional-adapter',
    installByDefault: false,
    privacyBoundary: 'The adapter must use the same public-field allowlist as the viem client.',
    notes: [
      'Do not maintain viem and ethers as equal first-class paths unless partner integration requires it.',
      'Prefer generating the same ABI constants into an ethers adapter package.',
    ],
  },
  {
    sdk: 'web3.py',
    layer: 'external-sdk',
    primaryUse: 'Python integration for NGOs, GIS validation notebooks, postal-source pipelines, data science checks, and operational batch jobs.',
    preferredFor: ['mode-1-server-registry', 'mode-3-ethereum-registry-only', 'mode-4-full-zk-ethereum'],
    repositoryStatus: 'recommended',
    installByDefault: false,
    privacyBoundary: 'Python batch jobs should operate on commitments, area roots, and redacted address-quality records unless explicitly running local-only private preparation.',
    notes: [
      'Best for scripts that combine GIS datasets, official postal sources, and chain registry reads.',
      'Publish as a separate Python SDK or examples folder, not inside the browser bundle.',
    ],
  },
  {
    sdk: 'Web3j',
    layer: 'external-sdk',
    primaryUse: 'Java/Kotlin logistics, Android, enterprise POS, and warehouse-system integration.',
    preferredFor: ['mode-1-server-registry', 'mode-3-ethereum-registry-only'],
    repositoryStatus: 'optional-adapter',
    installByDefault: false,
    privacyBoundary: 'Mobile and enterprise adapters should receive scoped credentials or commitments rather than full AOID records.',
    notes: [
      'Useful for carrier integrations that already run JVM stacks.',
      'Generate Java wrappers from the canonical ABI rather than hand-writing contract calls.',
    ],
  },
  {
    sdk: 'Nethereum',
    layer: 'external-sdk',
    primaryUse: '.NET, Windows POS, kiosk, warehouse, and government/enterprise integration.',
    preferredFor: ['mode-1-server-registry', 'mode-3-ethereum-registry-only'],
    repositoryStatus: 'optional-adapter',
    installByDefault: false,
    privacyBoundary: 'Windows POS integrations must keep decrypted AGID-S and raw AOID material local to the terminal unless an explicit disclosure policy allows export.',
    notes: [
      'Matches existing .NET SDK direction in this repository.',
      'Use generated C# contract clients from the canonical ABI.',
    ],
  },
  {
    sdk: 'Alloy',
    layer: 'server-rpc-client',
    primaryUse: 'Rust high-throughput registry workers, relayers, batch anchoring, and deterministic bridge services.',
    preferredFor: ['mode-3-ethereum-registry-only', 'mode-4-full-zk-ethereum'],
    repositoryStatus: 'recommended',
    installByDefault: false,
    privacyBoundary: 'Rust relayers must enforce the same no-raw-address allowlist before signing or submitting transactions.',
    notes: [
      'Best next step when viem server submission becomes a throughput bottleneck.',
      'Pairs well with Rust/WASM deterministic predicate code already planned for AGID.',
    ],
  },
  {
    sdk: 'Circom',
    layer: 'zk-circuit',
    primaryUse: 'Formal ZK circuits for private address predicates, AOID ownership, duplicate-prevention nullifiers, quality thresholds, and PID audit proofs.',
    preferredFor: ['mode-2-zk-only', 'mode-4-full-zk-ethereum'],
    repositoryStatus: 'future-work',
    installByDefault: false,
    privacyBoundary: 'Circuits must expose only public predicates, roots, nullifiers, scopes, and proof metadata; witnesses must contain private address/AGID/AOID material and never be logged.',
    notes: [
      'Use Circom for stable, small circuits first: nullifier, ownership, freshness, and threshold checks.',
      'Keep AMT semantics outside the circuit unless the predicate is small enough to audit.',
    ],
  },
  {
    sdk: 'snarkjs',
    layer: 'zk-tooling',
    primaryUse: 'Local circuit compilation, witness generation, proof generation, verifier export, and test vectors for Circom circuits.',
    preferredFor: ['mode-2-zk-only', 'mode-4-full-zk-ethereum'],
    repositoryStatus: 'future-work',
    installByDefault: false,
    privacyBoundary: 'Witness files, proving keys, and local proof inputs must be ignored from git and cleared from temporary storage after proof generation.',
    notes: [
      'Use in scripts and CI for test circuits, not in the main browser bundle.',
      'Export Solidity verifier artifacts only after test-vector and leakage checks pass.',
    ],
  },
];

export const WEB3_ZK_ADOPTION_DECISIONS: Web3ZkAdoptionDecision[] = [
  {
    name: 'viem',
    phase: 'already-installed',
    target: 'server-runtime',
    useWhen: 'Submitting Mode 3/4 issuer, revocation, nullifier, payment, or verifier transactions from the AGID server.',
    doNotUseFor: 'Local address display, AGID-S decryption, POS-only scans, or ZK witness generation.',
    concreteNextStep: 'Keep AgidEthereumRegistryClient as the canonical client and add generated ABI export tests.',
  },
  {
    name: 'abitype',
    phase: 'install-when-feature-starts',
    target: 'dev-tooling',
    useWhen: 'ABI constants start being generated for viem, ethers, Web3j, Nethereum, Alloy, and documentation from one source.',
    doNotUseFor: 'Runtime address resolution or POS scanning.',
    concreteNextStep: 'Introduce only when the ABI generator is added; viem already includes ABI typing for the current hand-written client.',
  },
  {
    name: 'wagmi',
    phase: 'install-when-feature-starts',
    target: 'app-runtime',
    useWhen: 'A dedicated issuer/operator wallet settings screen is implemented.',
    doNotUseFor: 'Default POS flow, Mode 0, Mode 1, or background chain submission.',
    concreteNextStep: 'Add a wallet-gated route such as /registry/wallet before installing wagmi.',
  },
  {
    name: '@tanstack/react-query',
    phase: 'install-when-feature-starts',
    target: 'app-runtime',
    useWhen: 'wagmi is introduced, because wagmi uses query-style wallet and chain state patterns.',
    doNotUseFor: 'Replacing existing local React state in map, POS, or address panels without a wallet feature.',
    concreteNextStep: 'Install together with wagmi only for wallet UI; keep it out of POS local-only mode.',
  },
  {
    name: 'OpenZeppelin Contracts',
    phase: 'install-now',
    target: 'dev-tooling',
    useWhen: 'Writing Solidity registries for issuer status, revocation roots, nullifiers, payment escrow, and verifier governance.',
    doNotUseFor: 'Client-side address logic.',
    concreteNextStep: 'Create contracts/ with minimal registries using AccessControl, Pausable, and ReentrancyGuard where needed.',
  },
  {
    name: 'Foundry',
    phase: 'install-now',
    target: 'dev-tooling',
    useWhen: 'Compiling, testing, fuzzing, and gas-measuring AGID registry contracts.',
    doNotUseFor: 'Frontend build or address data processing.',
    concreteNextStep: 'Add a contracts test harness for nullifier duplicate rejection and no-raw-address event policy.',
  },
  {
    name: 'Anvil',
    phase: 'install-now',
    target: 'dev-tooling',
    useWhen: 'Running local chain integration tests for viem submission, receipt confirmation, and registry event checks.',
    doNotUseFor: 'Production L2 operations.',
    concreteNextStep: 'Add an integration script that starts a local chain, deploys registries, submits a tx plan, and checks receipt status.',
  },
  {
    name: 'Hardhat',
    phase: 'avoid-for-now',
    target: 'dev-tooling',
    useWhen: 'Only if a partner already requires a Hardhat plugin pipeline.',
    doNotUseFor: 'Duplicating Foundry compile/test/deploy flow.',
    concreteNextStep: 'Do not add unless Foundry cannot cover a required plugin or deployment workflow.',
  },
  {
    name: 'ethers.js',
    phase: 'avoid-for-now',
    target: 'server-runtime',
    useWhen: 'Only when an integration partner requires ethers-compatible examples.',
    doNotUseFor: 'A second internal Ethereum client competing with viem.',
    concreteNextStep: 'Generate examples from ABI later; do not add to package.json now.',
  },
  {
    name: 'web3.py',
    phase: 'generate-external-sdk',
    target: 'external-sdk',
    useWhen: 'Python GIS, NGO, postal-source, and batch registry workflows need chain reads/writes.',
    doNotUseFor: 'Browser app or Node server runtime.',
    concreteNextStep: 'Create sdk/agid-web3-py examples after ABI artifacts are generated.',
  },
  {
    name: 'Web3j',
    phase: 'generate-external-sdk',
    target: 'external-sdk',
    useWhen: 'JVM carriers, warehouse systems, Android enterprise devices, or Kotlin backends integrate with registries.',
    doNotUseFor: 'The React app or Node server.',
    concreteNextStep: 'Generate Java/Kotlin contract wrappers from the canonical ABI.',
  },
  {
    name: 'Nethereum',
    phase: 'generate-external-sdk',
    target: 'external-sdk',
    useWhen: 'Windows POS, kiosk, .NET enterprise, or government systems need registry integration.',
    doNotUseFor: 'The React app or Node server.',
    concreteNextStep: 'Add C# examples under sdk/agid-dotnet once contracts are finalized.',
  },
  {
    name: 'Alloy',
    phase: 'install-when-feature-starts',
    target: 'server-runtime',
    useWhen: 'A Rust relayer, high-volume receipt monitor, or batch root-anchoring worker is implemented.',
    doNotUseFor: 'Replacing viem before there is a throughput bottleneck.',
    concreteNextStep: 'Add native/agid-relayer only after contract ABIs and local-chain tests exist.',
  },
  {
    name: 'Circom',
    phase: 'install-when-feature-starts',
    target: 'zk-circuit',
    useWhen: 'Building first production-oriented circuits for nullifier, AOID ownership, freshness, threshold, and coarse region membership.',
    doNotUseFor: 'Full address resolution, address display, or POS UI.',
    concreteNextStep: 'Create circuits/nullifier_v1.circom with fixed public/private signal policy.',
  },
  {
    name: 'snarkjs',
    phase: 'install-when-feature-starts',
    target: 'zk-prover',
    useWhen: 'Compiling Circom circuits and generating test witnesses, proofs, verifier contracts, and vectors.',
    doNotUseFor: 'Main browser bundle or normal POS operation.',
    concreteNextStep: 'Add scripts/zk:nullifier:test after the first Circom circuit exists.',
  },
  {
    name: 'Solidity verifier exports',
    phase: 'install-when-feature-starts',
    target: 'dev-tooling',
    useWhen: 'Mode 4 needs on-chain verification of a stable, audited ZK predicate.',
    doNotUseFor: 'Unaudited experimental circuits or Mode 2 server-only verification.',
    concreteNextStep: 'Export verifier only after witness-leakage tests and public-signal review pass.',
  },
  {
    name: 'Poseidon hash library',
    phase: 'research-first',
    target: 'zk-circuit',
    useWhen: 'Nullifier and commitment circuits need SNARK-friendly hashing.',
    doNotUseFor: 'Replacing standard hashes in non-ZK APIs without a migration plan.',
    concreteNextStep: 'Document hash-domain separation before choosing the library and parameters.',
  },
  {
    name: 'Noir',
    phase: 'research-first',
    target: 'zk-circuit',
    useWhen: 'Developer ergonomics or auditability looks better than Circom for the first address predicates.',
    doNotUseFor: 'Adding a second ZK stack after Circom is selected unless a clear reason appears.',
    concreteNextStep: 'Prototype the same nullifier relation in Noir and Circom, then compare proof time, verifier cost, and readability.',
  },
  {
    name: 'Halo2',
    phase: 'research-first',
    target: 'zk-circuit',
    useWhen: 'Custom circuits require more control than Circom/Noir and the team can support Rust cryptography audits.',
    doNotUseFor: 'Early MVP proof work.',
    concreteNextStep: 'Keep as a later option for audited high-assurance circuits.',
  },
  {
    name: 'RISC Zero',
    phase: 'research-first',
    target: 'zk-prover',
    useWhen: 'A larger existing Rust predicate or resolver needs verifiable execution instead of a small hand-written circuit.',
    doNotUseFor: 'Small nullifier or threshold circuits.',
    concreteNextStep: 'Evaluate only if AMT resolution audit proof becomes too large for Circom.',
  },
  {
    name: 'SP1',
    phase: 'research-first',
    target: 'zk-prover',
    useWhen: 'A zkVM path is needed for Rust-based AGID predicate execution and proof aggregation.',
    doNotUseFor: 'Initial Mode 2/4 MVP.',
    concreteNextStep: 'Compare with RISC Zero after Rust predicate APIs stabilize.',
  },
];

export function getWeb3ZkSdkPlan(): Web3ZkSdkPlan {
  return {
    version: WEB3_ZK_SDK_PLAN_VERSION,
    rule: 'Use viem as the canonical TypeScript chain client; keep wallet UI optional through wagmi; expose other language SDKs as generated adapters; implement real ZK with circuits and tooling outside the browser bundle.',
    roles: WEB3_ZK_SDK_ROLES,
    adoption: WEB3_ZK_ADOPTION_DECISIONS,
  };
}

export function getWeb3ZkSdkRole(sdk: Web3ZkSdkName): Web3ZkSdkRole {
  const role = WEB3_ZK_SDK_ROLES.find((item) => item.sdk === sdk);
  if (!role) throw new Error(`unsupported-sdk:${sdk}`);
  return role;
}

export function getWeb3ZkSdkRolesForMode(mode: Web3ZkMode): Web3ZkSdkRole[] {
  return WEB3_ZK_SDK_ROLES.filter((role) => role.preferredFor.includes(mode));
}

export function getDefaultInstallSdks(): Web3ZkSdkName[] {
  return WEB3_ZK_SDK_ROLES.filter((role) => role.installByDefault).map((role) => role.sdk);
}

export function getAdoptionDecisionsByPhase(phase: Web3ZkAdoptionPhase): Web3ZkAdoptionDecision[] {
  return WEB3_ZK_ADOPTION_DECISIONS.filter((decision) => decision.phase === phase);
}

export function getInstallNowDecisions(): Web3ZkAdoptionDecision[] {
  return getAdoptionDecisionsByPhase('install-now');
}

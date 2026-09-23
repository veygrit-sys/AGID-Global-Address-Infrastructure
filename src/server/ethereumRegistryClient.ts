import {
  createPublicClient,
  createWalletClient,
  getAddress,
  http,
  isAddress,
  isHex,
  type Address,
  type Hex,
  type TransactionReceipt,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import {
  ETHEREUM_REGISTRY_ONLY_MODE_VERSION,
  type EthereumRegistryOnlyContractRole,
  type EthereumRegistryOnlyOperationKind,
  type EthereumRegistryOnlyTxPlan,
} from '../lib/ethereumRegistryOnlyMode';

export const AGID_ETHEREUM_REGISTRY_ABI_VERSION = 'agid-ethereum-registry-abi-v1';

export const AGID_ETHEREUM_REGISTRY_ABIS = {
  issuerRegistry: [
    {
      type: 'function',
      name: 'registerIssuer',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'issuerId', type: 'string' },
        { name: 'issuerAddress', type: 'address' },
        { name: 'issuerStatus', type: 'uint8' },
        { name: 'issuerPublicKeyCommitment', type: 'bytes32' },
        { name: 'metadataHash', type: 'bytes32' },
        { name: 'policyHash', type: 'bytes32' },
      ],
      outputs: [],
    },
    {
      type: 'event',
      name: 'IssuerRegistered',
      inputs: [
        { name: 'issuerId', type: 'string', indexed: true },
        { name: 'issuerAddress', type: 'address', indexed: true },
        { name: 'issuerStatus', type: 'uint8', indexed: false },
      ],
    },
  ],
  revocationRegistry: [
    {
      type: 'function',
      name: 'anchorRevocationFreshnessRoot',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'registryId', type: 'string' },
        { name: 'issuerId', type: 'string' },
        { name: 'revocationRoot', type: 'bytes32' },
        { name: 'freshnessRoot', type: 'bytes32' },
        { name: 'validUntil', type: 'uint64' },
      ],
      outputs: [],
    },
    {
      type: 'event',
      name: 'RevocationFreshnessRootAnchored',
      inputs: [
        { name: 'registryId', type: 'string', indexed: true },
        { name: 'issuerId', type: 'string', indexed: true },
        { name: 'revocationRoot', type: 'bytes32', indexed: false },
        { name: 'freshnessRoot', type: 'bytes32', indexed: false },
        { name: 'validUntil', type: 'uint64', indexed: false },
      ],
    },
  ],
  nullifierRegistry: [
    {
      type: 'function',
      name: 'markNullifierUsed',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'nullifierHash', type: 'bytes32' },
        { name: 'scope', type: 'string' },
        { name: 'registryKeyHash', type: 'bytes32' },
      ],
      outputs: [],
    },
    {
      type: 'event',
      name: 'NullifierUsed',
      inputs: [
        { name: 'registryKeyHash', type: 'bytes32', indexed: true },
        { name: 'scope', type: 'string', indexed: true },
      ],
    },
  ],
  paymentEscrow: [
    {
      type: 'function',
      name: 'recordPayment',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'paymentId', type: 'string' },
        { name: 'escrowId', type: 'string' },
        { name: 'payerCommitment', type: 'bytes32' },
        { name: 'payeeCommitment', type: 'bytes32' },
        { name: 'purposeHash', type: 'bytes32' },
        { name: 'tokenContract', type: 'address' },
        { name: 'tokenSymbol', type: 'string' },
        { name: 'amount', type: 'uint256' },
        { name: 'paymentStatus', type: 'uint8' },
      ],
      outputs: [],
    },
    {
      type: 'event',
      name: 'PaymentRecorded',
      inputs: [
        { name: 'paymentId', type: 'string', indexed: true },
        { name: 'escrowId', type: 'string', indexed: true },
        { name: 'paymentStatus', type: 'uint8', indexed: false },
      ],
    },
  ],
} as const;

export type AgidEthereumRegistryRoleAddresses = Partial<Record<EthereumRegistryOnlyContractRole, string>>;

export type AgidEthereumRegistryClientConfig = {
  rpcUrl: string;
  privateKey?: string;
  chainId?: number;
  requiredConfirmations?: number;
  contracts?: AgidEthereumRegistryRoleAddresses;
};

export type AgidEthereumReceiptSummary = {
  txHash: Hex;
  status: 'success' | 'reverted' | 'pending';
  blockNumber: string | null;
  confirmations: number;
  gasUsed: string | null;
  effectiveGasPrice: string | null;
  contractAddress: string | null;
};

export type AgidEthereumRegistrySubmission = {
  modeVersion: typeof ETHEREUM_REGISTRY_ONLY_MODE_VERSION;
  abiVersion: typeof AGID_ETHEREUM_REGISTRY_ABI_VERSION;
  operation: EthereumRegistryOnlyOperationKind;
  contractRole: EthereumRegistryOnlyContractRole;
  contractAddress: Address;
  functionName: string;
  txHash: Hex;
  receipt: AgidEthereumReceiptSummary;
  requiredConfirmations: number;
  submittedAt: string;
  warnings: string[];
};

const ZERO_BYTES32 = `0x${'0'.repeat(64)}` as Hex;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

const ROLE_ABI = {
  'issuer-registry': AGID_ETHEREUM_REGISTRY_ABIS.issuerRegistry,
  'revocation-registry': AGID_ETHEREUM_REGISTRY_ABIS.revocationRegistry,
  'nullifier-registry': AGID_ETHEREUM_REGISTRY_ABIS.nullifierRegistry,
  'payment-escrow': AGID_ETHEREUM_REGISTRY_ABIS.paymentEscrow,
} as const;

const ISSUER_STATUS_CODE: Record<string, number> = {
  active: 1,
  suspended: 2,
  revoked: 3,
};

const PAYMENT_STATUS_CODE: Record<string, number> = {
  authorized: 1,
  escrowed: 2,
  released: 3,
  refunded: 4,
  cancelled: 5,
};

function normalizePrivateKey(value: string | undefined): Hex | null {
  const text = value?.trim();
  if (!text) return null;
  const hex = text.startsWith('0x') ? text : `0x${text}`;
  return /^0x[0-9a-fA-F]{64}$/.test(hex) ? hex as Hex : null;
}

function bytes32(value: unknown, field: string): Hex {
  if (value === null || value === undefined || value === '') return ZERO_BYTES32;
  const text = String(value).trim();
  if (!isHex(text) || text.length !== 66) {
    throw new Error(`${field}-must-be-32-byte-hex-commitment`);
  }
  return text.toLowerCase() as Hex;
}

function address(value: unknown, field: string, fallback?: Address): Address {
  if ((value === null || value === undefined || value === '') && fallback) return fallback;
  const text = String(value ?? '').trim();
  if (!isAddress(text)) throw new Error(`${field}-must-be-ethereum-address`);
  return getAddress(text);
}

function text(value: unknown, field: string, fallback = '') {
  const normalized = String(value ?? fallback).normalize('NFKC').trim();
  if (!normalized && !fallback) throw new Error(`${field}-required`);
  return normalized;
}

function unixSeconds(value: unknown): bigint {
  if (value === null || value === undefined || value === '') return 0n;
  const parsed = Date.parse(String(value));
  if (!Number.isFinite(parsed)) throw new Error('validUntil-must-be-iso-date');
  return BigInt(Math.floor(parsed / 1000));
}

function integerAmount(value: unknown): bigint {
  if (value === null || value === undefined || value === '') return 0n;
  const textValue = String(value).trim();
  if (!/^\d+$/.test(textValue)) {
    throw new Error('amount-must-be-integer-base-units');
  }
  return BigInt(textValue);
}

function configuredContract(role: EthereumRegistryOnlyContractRole, contracts: AgidEthereumRegistryRoleAddresses) {
  return contracts[role] || process.env[`AGID_ETHEREUM_${role.toUpperCase().replace(/-/g, '_')}_ADDRESS`];
}

function configuredContractAddress(
  role: EthereumRegistryOnlyContractRole,
  contracts: AgidEthereumRegistryRoleAddresses,
  planContractAddress: string | null | undefined,
) {
  const configured = configuredContract(role, contracts);
  if (!configured) {
    throw new Error(`${role}-contractAddress-must-be-configured-on-server`);
  }
  const expected = address(configured, `${role}-configuredContractAddress`);
  if (planContractAddress) {
    const planned = address(planContractAddress, `${role}-txPlanContractAddress`);
    if (planned !== expected) {
      throw new Error(`${role}-contractAddress-mismatch`);
    }
  }
  return expected;
}

function roleFunctionArguments(txPlan: EthereumRegistryOnlyTxPlan) {
  const args = txPlan.publicArguments;
  if (txPlan.contractRole === 'issuer-registry') {
    return {
      functionName: 'registerIssuer',
      args: [
        text(args.issuerId, 'issuerId'),
        address(args.issuerAddress, 'issuerAddress'),
        ISSUER_STATUS_CODE[String(args.issuerStatus ?? 'active')] ?? ISSUER_STATUS_CODE.active,
        bytes32(args.issuerPublicKeyCommitment, 'issuerPublicKeyCommitment'),
        bytes32(args.metadataHash, 'metadataHash'),
        bytes32(args.policyHash, 'policyHash'),
      ] as const,
    };
  }
  if (txPlan.contractRole === 'revocation-registry') {
    return {
      functionName: 'anchorRevocationFreshnessRoot',
      args: [
        text(args.registryId, 'registryId', 'default-revocation-registry'),
        text(args.issuerId, 'issuerId', ''),
        bytes32(args.revocationRoot, 'revocationRoot'),
        bytes32(args.freshnessRoot, 'freshnessRoot'),
        unixSeconds(args.validUntil),
      ] as const,
    };
  }
  if (txPlan.contractRole === 'nullifier-registry') {
    return {
      functionName: 'markNullifierUsed',
      args: [
        bytes32(args.nullifierHash, 'nullifierHash'),
        text(args.scope, 'scope'),
        bytes32(args.registryKeyHash, 'registryKeyHash'),
      ] as const,
    };
  }
  return {
    functionName: 'recordPayment',
    args: [
      text(args.paymentId, 'paymentId'),
      text(args.escrowId, 'escrowId'),
      bytes32(args.payerCommitment, 'payerCommitment'),
      bytes32(args.payeeCommitment, 'payeeCommitment'),
      bytes32(args.purposeHash, 'purposeHash'),
      address(args.tokenContract, 'tokenContract', ZERO_ADDRESS),
      text(args.tokenSymbol, 'tokenSymbol', ''),
      integerAmount(args.amount),
      PAYMENT_STATUS_CODE[String(args.paymentStatus ?? 'authorized')] ?? PAYMENT_STATUS_CODE.authorized,
    ] as const,
  };
}

function chainFor(rpcUrl: string, chainId?: number) {
  if (!chainId) return undefined;
  return {
    id: chainId,
    name: `AGID configured chain ${chainId}`,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [rpcUrl] },
    },
  } as const;
}

function summarizeReceipt(receipt: TransactionReceipt | null, latestBlock: bigint | null): AgidEthereumReceiptSummary {
  if (!receipt) {
    return {
      txHash: ZERO_BYTES32,
      status: 'pending',
      blockNumber: null,
      confirmations: 0,
      gasUsed: null,
      effectiveGasPrice: null,
      contractAddress: null,
    };
  }
  const confirmations = receipt.blockNumber && latestBlock && latestBlock >= receipt.blockNumber
    ? Number(latestBlock - receipt.blockNumber + 1n)
    : 0;
  return {
    txHash: receipt.transactionHash,
    status: receipt.status === 'success' ? 'success' : 'reverted',
    blockNumber: receipt.blockNumber?.toString() ?? null,
    confirmations,
    gasUsed: receipt.gasUsed?.toString() ?? null,
    effectiveGasPrice: receipt.effectiveGasPrice?.toString() ?? null,
    contractAddress: receipt.contractAddress ?? null,
  };
}

export class AgidEthereumRegistryClient {
  private readonly privateKey: Hex | null;
  private readonly contracts: AgidEthereumRegistryRoleAddresses;
  private readonly requiredConfirmations: number;

  constructor(private readonly config: AgidEthereumRegistryClientConfig) {
    this.privateKey = normalizePrivateKey(config.privateKey);
    this.contracts = config.contracts ?? {};
    this.requiredConfirmations = Math.max(1, config.requiredConfirmations ?? 1);
    if (!config.rpcUrl?.trim()) {
      throw new Error('AGID_ETHEREUM_RPC_URL is required for Ethereum registry submission.');
    }
  }

  async submitTxPlan(
    txPlan: EthereumRegistryOnlyTxPlan,
    options: { requiredConfirmations?: number } = {},
  ): Promise<AgidEthereumRegistrySubmission> {
    if (!this.privateKey) {
      throw new Error('AGID_ETHEREUM_PRIVATE_KEY is required for signed Ethereum registry submission.');
    }
    const contractAddress = configuredContractAddress(
      txPlan.contractRole,
      this.contracts,
      txPlan.contractAddress,
    );
    const { functionName, args } = roleFunctionArguments(txPlan);
    const chain = chainFor(this.config.rpcUrl, this.config.chainId);
    const account = privateKeyToAccount(this.privateKey);
    const publicClient = createPublicClient({
      chain,
      transport: http(this.config.rpcUrl),
    });
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(this.config.rpcUrl),
    });

    const txHash = await walletClient.writeContract({
      account,
      address: contractAddress,
      abi: ROLE_ABI[txPlan.contractRole],
      functionName,
      args,
    } as any);
    const requiredConfirmations = Math.max(1, options.requiredConfirmations ?? this.requiredConfirmations);
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: requiredConfirmations,
    });
    const latestBlock = await publicClient.getBlockNumber();
    const receiptSummary = summarizeReceipt(receipt, latestBlock);

    return {
      modeVersion: ETHEREUM_REGISTRY_ONLY_MODE_VERSION,
      abiVersion: AGID_ETHEREUM_REGISTRY_ABI_VERSION,
      operation: txPlan.operation,
      contractRole: txPlan.contractRole,
      contractAddress,
      functionName,
      txHash,
      receipt: receiptSummary,
      requiredConfirmations,
      submittedAt: new Date().toISOString(),
      warnings: receiptSummary.status === 'success' ? [] : ['ethereum-transaction-reverted'],
    };
  }

  async receipt(txHash: string): Promise<AgidEthereumReceiptSummary> {
    if (!isHex(txHash)) throw new Error('txHash-must-be-hex');
    const publicClient = createPublicClient({
      chain: chainFor(this.config.rpcUrl, this.config.chainId),
      transport: http(this.config.rpcUrl),
    });
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash as Hex }).catch(() => null);
    const latestBlock = await publicClient.getBlockNumber().catch(() => null);
    const summary = summarizeReceipt(receipt, latestBlock);
    return receipt ? summary : { ...summary, txHash: txHash as Hex };
  }
}

export function createAgidEthereumRegistryClientFromEnv(input: Partial<AgidEthereumRegistryClientConfig> = {}) {
  return new AgidEthereumRegistryClient({
    rpcUrl: input.rpcUrl || process.env.AGID_ETHEREUM_RPC_URL || '',
    privateKey: input.privateKey || process.env.AGID_ETHEREUM_PRIVATE_KEY,
    chainId: input.chainId ?? (Number(process.env.AGID_ETHEREUM_CHAIN_ID || '') || undefined),
    requiredConfirmations: input.requiredConfirmations
      ?? (Number(process.env.AGID_ETHEREUM_CONFIRMATIONS || '') || undefined),
    contracts: {
      ...input.contracts,
      'issuer-registry': input.contracts?.['issuer-registry'] || process.env.AGID_ETHEREUM_ISSUER_REGISTRY_ADDRESS,
      'revocation-registry': input.contracts?.['revocation-registry'] || process.env.AGID_ETHEREUM_REVOCATION_REGISTRY_ADDRESS,
      'nullifier-registry': input.contracts?.['nullifier-registry'] || process.env.AGID_ETHEREUM_NULLIFIER_REGISTRY_ADDRESS,
      'payment-escrow': input.contracts?.['payment-escrow'] || process.env.AGID_ETHEREUM_PAYMENT_ESCROW_ADDRESS,
    },
  });
}

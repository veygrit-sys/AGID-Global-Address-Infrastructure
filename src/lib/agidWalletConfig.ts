import { createConfig, http, type CreateConfigParameters } from 'wagmi';
import { base, baseSepolia, foundry, mainnet, sepolia } from 'wagmi/chains';

export const AGID_WALLET_CONFIG_VERSION = 'agid-wallet-config-v1';

export const AGID_WALLET_PRIVACY_RULES = [
  'Wallet UI is optional and must not be required by Mode 0 or Mode 1 POS flows.',
  'Wallet signatures must never include raw address text, raw AOID records, or AGID-S ciphertext.',
  'Transactions should contain only issuer metadata hashes, credential commitments, roots, nullifiers, verifier metadata, or payment state.',
] as const;

export const AGID_SUPPORTED_WALLET_CHAINS = [foundry, baseSepolia, sepolia, base, mainnet] as const;

export type AgidWalletChainId = typeof AGID_SUPPORTED_WALLET_CHAINS[number]['id'];

export type AgidWalletRpcUrls = Partial<Record<AgidWalletChainId, string>>;

export type AgidWalletConfigOptions = {
  rpcUrls?: AgidWalletRpcUrls;
  enableInjectedDiscovery?: boolean;
  ssr?: boolean;
};

const DEFAULT_RPC_URLS: Record<AgidWalletChainId, string> = {
  [foundry.id]: 'http://127.0.0.1:8545',
  [baseSepolia.id]: 'https://sepolia.base.org',
  [sepolia.id]: 'https://ethereum-sepolia-rpc.publicnode.com',
  [base.id]: 'https://mainnet.base.org',
  [mainnet.id]: 'https://ethereum-rpc.publicnode.com',
};

export function getAgidWalletChainIds(): AgidWalletChainId[] {
  return AGID_SUPPORTED_WALLET_CHAINS.map((chain) => chain.id);
}

export function getAgidWalletRpcUrl(chainId: AgidWalletChainId, overrides: AgidWalletRpcUrls = {}): string {
  return overrides[chainId] || DEFAULT_RPC_URLS[chainId];
}

export function createAgidWalletConfig(options: AgidWalletConfigOptions = {}) {
  const transports = Object.fromEntries(
    AGID_SUPPORTED_WALLET_CHAINS.map((chain) => [
      chain.id,
      http(getAgidWalletRpcUrl(chain.id, options.rpcUrls)),
    ]),
  ) as CreateConfigParameters['transports'];

  return createConfig({
    chains: AGID_SUPPORTED_WALLET_CHAINS,
    transports,
    multiInjectedProviderDiscovery: options.enableInjectedDiscovery ?? true,
    ssr: options.ssr ?? true,
  });
}

export function describeAgidWalletConfig() {
  return {
    version: AGID_WALLET_CONFIG_VERSION,
    chainIds: getAgidWalletChainIds(),
    defaultMode: 'optional-wallet-ui',
    canonicalServerClient: 'viem',
    privacyRules: [...AGID_WALLET_PRIVACY_RULES],
  };
}

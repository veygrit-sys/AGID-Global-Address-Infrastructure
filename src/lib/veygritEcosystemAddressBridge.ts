export const VEYGRIT_ECOSYSTEM_ADDRESS_BRIDGE_VERSION = 'veygrit-ecosystem-address-bridge-v0.1';

export type VeygritServiceId =
  | 'veygrit-id'
  | 'address-wallet'
  | 'veygrit-store'
  | 'veygrit-ship'
  | 'integration-gateway';

export type VeygritEcosystemAddressBridge = {
  version: typeof VEYGRIT_ECOSYSTEM_ADDRESS_BRIDGE_VERSION;
  recommendedDeployables: 5;
  services: Array<{
    id: VeygritServiceId;
    owns: string[];
    neverOwns: string[];
  }>;
  identifiers: Array<{
    name: string;
    owner: VeygritServiceId;
    scope: string;
    reusable: string;
    exposedTo: VeygritServiceId[];
  }>;
  flows: Array<{
    id: string;
    steps: string[];
  }>;
  commerceAdapters: Array<{
    platform: 'shopify' | 'woocommerce' | 'custom-ec';
    storefrontSurface: string;
    secureRuntime: string;
    language: string;
  }>;
  apiSurfaces: Array<{ method: 'GET' | 'POST' | 'PATCH'; path: string; purpose: string }>;
  blockedMaterial: string[];
  nonClaims: string[];
};

export type StorePublicationSelectionInput = {
  merchantRef: string;
  storeRef: string;
  connectionRef: string;
  publishToVeygritStore: boolean;
  catalogScope: 'all' | 'selected_collections' | 'selected_products';
};

export type StorePublicationSelection = StorePublicationSelectionInput & {
  version: typeof VEYGRIT_ECOSYSTEM_ADDRESS_BRIDGE_VERSION;
  status: 'enabled' | 'disabled';
  carriesRawAddress: false;
};

export type NavigationHandoffInput = {
  handoffRef: string;
  from: 'address-wallet' | 'veygrit-store' | 'veygrit-ship';
  to: 'address-wallet' | 'veygrit-store' | 'veygrit-ship';
  pairwiseSubjectAlias: string;
  returnPath: string;
  expiresAt: string;
};

export const VEYGRIT_ECOSYSTEM_BLOCKED_MATERIAL = [
  'rawAddress',
  'addressLine1',
  'postalCode',
  'recipientName',
  'recipientPhone',
  'providerAccessToken',
  'providerRefreshToken',
  'carrierCredential',
  'privateKey',
] as const;

export function buildVeygritEcosystemAddressBridge(): VeygritEcosystemAddressBridge {
  return {
    version: VEYGRIT_ECOSYSTEM_ADDRESS_BRIDGE_VERSION,
    recommendedDeployables: 5,
    services: [
      { id: 'veygrit-id', owns: ['OIDC authorization', 'social provider linking', 'pairwise subject aliases'], neverOwns: ['raw address', 'carrier credentials'] },
      { id: 'address-wallet', owns: ['encrypted address credentials', 'recipient IDs', 'friend graph', 'delivery consent', 'carrier handoff release'], neverOwns: ['store catalog', 'carrier account secret'] },
      { id: 'veygrit-store', owns: ['store discovery', 'catalog projections', 'store navigation'], neverOwns: ['raw address', 'provider token', 'carrier credential'] },
      { id: 'veygrit-ship', owns: ['merchant shipment', 'rate', 'label', 'tracking', 'publication selection'], neverOwns: ['social provider token', 'wallet address credential body'] },
      { id: 'integration-gateway', owns: ['Shopify adapter', 'WooCommerce adapter', 'custom EC webhooks', 'platform order mapping'], neverOwns: ['long-lived wallet address', 'social provider token'] },
    ],
    identifiers: [
      { name: 'pairwise_subject_alias', owner: 'veygrit-id', scope: 'one client or store connection', reusable: 'within that client only', exposedTo: ['address-wallet', 'veygrit-store', 'veygrit-ship', 'integration-gateway'] },
      { name: 'address_credential_ref', owner: 'address-wallet', scope: 'wallet internal', reusable: 'never outside wallet', exposedTo: [] },
      { name: 'recipient_id', owner: 'address-wallet', scope: 'merchant/store + purpose + recipient + expiry', reusable: 'self: consented scope; friend: one request/order by default', exposedTo: ['veygrit-ship', 'integration-gateway'] },
      { name: 'wallet_consent_ref', owner: 'address-wallet', scope: 'recipient + purpose + merchant + expiry', reusable: 'only while scope remains valid', exposedTo: ['veygrit-ship', 'integration-gateway'] },
      { name: 'store_ref', owner: 'veygrit-store', scope: 'one commerce storefront', reusable: 'ecosystem public reference', exposedTo: ['address-wallet', 'veygrit-ship', 'integration-gateway'] },
      { name: 'navigation_handoff_ref', owner: 'veygrit-id', scope: 'one target + return path + short expiry', reusable: 'single use', exposedTo: ['address-wallet', 'veygrit-store', 'veygrit-ship'] },
      { name: 'shipment_ref', owner: 'veygrit-ship', scope: 'one shipment aggregate', reusable: 'shipment lifecycle only', exposedTo: ['address-wallet', 'veygrit-store', 'integration-gateway'] },
    ],
    flows: [
      { id: 'wallet-store-navigation', steps: ['request one-time navigation handoff', 'OIDC authorize with PKCE', 'exchange server-side', 'open target with pairwise subject alias', 'consume handoff once'] },
      { id: 'friend-delivery', steps: ['buyer selects friend alias', 'wallet sends recipient approval request', 'friend selects address and consents', 'wallet issues order-scoped recipient_id', 'Ship requests carrier handoff', 'UPS or DHL receives address server-side'] },
      { id: 'ship-store-publication', steps: ['Ship lists merchant store connections', 'merchant chooses catalog scope', 'Ship saves publication selection', 'integration gateway projects selected catalog', 'Store publishes projection without address data'] },
    ],
    commerceAdapters: [
      { platform: 'shopify', storefrontSurface: 'Theme app extension for Veygrit entry UI', secureRuntime: 'Shopify app backend + Functions/CarrierService/fulfillment APIs as eligible', language: 'TypeScript/JavaScript' },
      { platform: 'woocommerce', storefrontSurface: 'Checkout block extension and optional theme-facing block', secureRuntime: 'WordPress plugin + WC_Shipping_Method + Store API extension', language: 'PHP + TypeScript/JavaScript' },
      { platform: 'custom-ec', storefrontSurface: 'Hosted login/recipient chooser or client SDK', secureRuntime: 'Veygrit REST/OpenAPI + signed webhooks', language: 'Any language; first-party PHP and TS/JS SDKs' },
    ],
    apiSurfaces: [
      { method: 'GET', path: '/v1/wallet/recipients', purpose: 'List safe recipient aliases without raw address' },
      { method: 'POST', path: '/v1/wallet/friend-delivery/requests', purpose: 'Request one-order recipient consent' },
      { method: 'POST', path: '/v1/navigation-handoffs', purpose: 'Create short-lived Wallet/Store/Ship navigation handoff' },
      { method: 'GET', path: '/v1/store-connections', purpose: 'List merchant-owned EC connections' },
      { method: 'PATCH', path: '/v1/store-connections/{store_ref}/publication', purpose: 'Select whether and what to publish to Veygrit Store' },
    ],
    blockedMaterial: [...VEYGRIT_ECOSYSTEM_BLOCKED_MATERIAL],
    nonClaims: [
      'Recipient ID is a revocable delivery capability, not a public user identifier or address.',
      'Original social login brokers Google or Apple identity; provider tokens are not ecosystem credentials.',
      'A Store publication does not grant delivery consent.',
    ],
  };
}

function hasBlockedKey(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasBlockedKey);
  const record = value as Record<string, unknown>;
  return Object.entries(record).some(([key, nested]) =>
    (VEYGRIT_ECOSYSTEM_BLOCKED_MATERIAL as readonly string[]).includes(key) || hasBlockedKey(nested));
}

export function createStorePublicationSelection(input: StorePublicationSelectionInput): StorePublicationSelection {
  if (hasBlockedKey(input)) throw new Error('private_material_rejected');
  if (!input.merchantRef || !input.storeRef || !input.connectionRef) throw new Error('missing_required_ref');
  return {
    version: VEYGRIT_ECOSYSTEM_ADDRESS_BRIDGE_VERSION,
    ...input,
    status: input.publishToVeygritStore ? 'enabled' : 'disabled',
    carriesRawAddress: false,
  };
}

export function validateNavigationHandoff(input: NavigationHandoffInput, now = new Date()): string[] {
  const errors: string[] = [];
  if (!/^nav_handoff_[A-Za-z0-9_-]{8,}$/.test(input.handoffRef)) errors.push('invalid-handoff-ref');
  if (input.from === input.to) errors.push('source-and-target-must-differ');
  if (!input.pairwiseSubjectAlias.startsWith('pairwise_')) errors.push('pairwise-subject-required');
  if (!input.returnPath.startsWith('/') || input.returnPath.startsWith('//')) errors.push('relative-return-path-required');
  if (!Number.isFinite(Date.parse(input.expiresAt)) || Date.parse(input.expiresAt) <= now.getTime()) errors.push('handoff-expired');
  return errors;
}

export function validateVeygritEcosystemAddressBridge(bridge = buildVeygritEcosystemAddressBridge()): string[] {
  const errors: string[] = [];
  if (bridge.services.length !== bridge.recommendedDeployables) errors.push('deployable-count-mismatch');
  if (new Set(bridge.services.map(service => service.id)).size !== 5) errors.push('service-id-mismatch');
  if (!bridge.identifiers.some(id => id.name === 'recipient_id' && id.owner === 'address-wallet')) errors.push('recipient-id-owner-mismatch');
  if (!bridge.flows.some(flow => flow.id === 'friend-delivery')) errors.push('missing-friend-delivery-flow');
  if (!bridge.flows.some(flow => flow.id === 'ship-store-publication')) errors.push('missing-store-publication-flow');
  if (hasBlockedKey({ safe: bridge })) errors.push('blocked-material-key-present-in-public-contract');
  return errors;
}

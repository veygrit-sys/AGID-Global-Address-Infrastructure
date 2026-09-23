export const VEY_ECOSYSTEM_RESEARCH_VERSION = 'vey-ecosystem-research-v0.1';

export type VeyEcosystemBoundary = 'oss' | 'shared-contract' | 'commercial';
export type VeyEcosystemLayer =
  | 'identity'
  | 'commerce'
  | 'logistics'
  | 'operations'
  | 'trade'
  | 'finance'
  | 'developer-platform'
  | 'governance';

export type VeyEcosystemActorId =
  | 'consumer'
  | 'creator'
  | 'ec-merchant'
  | 'developer'
  | 'carrier'
  | 'operator'
  | 'enterprise-admin'
  | 'public-sector-reviewer';

export type VeyEcosystemProductId =
  | 'identity-wallet'
  | 'address-login'
  | 'playlist-commerce'
  | 'delivery-gateway'
  | 'carrier-api-stripe'
  | 'merchant-console'
  | 'developer-platform'
  | 'vey-workspace'
  | 'vey-trading'
  | 'vey-finance'
  | 'evidence-vault'
  | 'managed-zk-proof-generation';

export type VeyEcosystemProduct = {
  id: VeyEcosystemProductId;
  name: string;
  layer: VeyEcosystemLayer;
  boundary: VeyEcosystemBoundary;
  thesis: string;
  primaryActors: VeyEcosystemActorId[];
  dependsOn: VeyEcosystemProductId[];
  exposes: string[];
  blockedData: string[];
  revenueModel: string;
  maturity: 'mvp-now' | 'next-build' | 'scale-later';
};

export type VeyEcosystemApiSurface = {
  id: string;
  owner: VeyEcosystemProductId;
  audience: VeyEcosystemActorId[];
  integrationMode:
    | 'drop-in-sdk'
    | 'hosted-redirect'
    | 'server-api'
    | 'webhook'
    | 'cms-plugin'
    | 'wallet-pass'
    | 'operator-console';
  purpose: string;
  mustHave: string[];
  nonClaims: string[];
};

export type VeyEcosystemJourney = {
  id: string;
  label: string;
  actor: VeyEcosystemActorId;
  steps: string[];
  products: VeyEcosystemProductId[];
  valueMetric: string;
  riskGate: string;
};

export type VeyEcosystemBuildUnit = {
  id: string;
  packageName: string;
  boundary: VeyEcosystemBoundary;
  owns: VeyEcosystemProductId[];
  firstReleaseGate: string;
  verificationCommand: string;
};

export type VeyEcosystemResearch = {
  version: typeof VEY_ECOSYSTEM_RESEARCH_VERSION;
  thesis: string;
  actors: VeyEcosystemActorId[];
  products: VeyEcosystemProduct[];
  apiSurfaces: VeyEcosystemApiSurface[];
  journeys: VeyEcosystemJourney[];
  buildUnits: VeyEcosystemBuildUnit[];
  sequencing: string[];
  nonClaims: string[];
};

export const VEY_ECOSYSTEM_ACTORS: VeyEcosystemActorId[] = [
  'consumer',
  'creator',
  'ec-merchant',
  'developer',
  'carrier',
  'operator',
  'enterprise-admin',
  'public-sector-reviewer',
];

export const VEY_ECOSYSTEM_PRODUCTS: VeyEcosystemProduct[] = [
  {
    id: 'identity-wallet',
    name: 'Vey Wallet',
    layer: 'identity',
    boundary: 'commercial',
    thesis: 'The user controls address aliases, credentials, consent, delivery preferences, QR handoff, and revocation from one wallet surface.',
    primaryActors: ['consumer'],
    dependsOn: ['address-login'],
    exposes: ['wallet consent', 'address alias selector', 'fastest-or-cheapest delivery preference', 'Apple/Google wallet QR pass export'],
    blockedData: ['private key', 'proof witness', 'raw address to merchant by default'],
    revenueModel: 'consumer trust surface that increases hosted Address Login, delivery routing, and premium wallet adoption',
    maturity: 'mvp-now',
  },
  {
    id: 'address-login',
    name: 'Veygrit ID / Address Login',
    layer: 'identity',
    boundary: 'shared-contract',
    thesis: 'A Clerk-like address consent layer: developers add a button, users approve, merchants receive proof or carrier-only handoff instead of raw address storage.',
    primaryActors: ['consumer', 'developer', 'ec-merchant'],
    dependsOn: [],
    exposes: ['React button', 'Next.js callback helper', 'hosted redirect', 'webhook verification', 'synthetic conformance tests'],
    blockedData: ['recipient phone in callback', 'unscoped decrypt material', 'long-lived address token'],
    revenueModel: 'hosted login, merchant console, verified partner onboarding, and enterprise support',
    maturity: 'mvp-now',
  },
  {
    id: 'playlist-commerce',
    name: 'Playlist Commerce',
    layer: 'commerce',
    boundary: 'commercial',
    thesis: 'Commerce is organized by intent playlists, then connected to identity, delivery, and settlement only at checkout time.',
    primaryActors: ['consumer', 'creator', 'ec-merchant', 'developer'],
    dependsOn: ['identity-wallet', 'address-login', 'delivery-gateway'],
    exposes: ['playlist checkout SDK', 'alias-first checkout', 'webhook evidence preflight', 'merchant widget'],
    blockedData: ['raw address analytics', 'creator-visible recipient data', 'private credential material'],
    revenueModel: 'merchant SaaS, checkout fee, creator/merchant tooling, and commercial webhook operations',
    maturity: 'mvp-now',
  },
  {
    id: 'delivery-gateway',
    name: 'Delivery Gateway',
    layer: 'logistics',
    boundary: 'commercial',
    thesis: 'Apps and EC systems call one delivery gateway to compare carriers, issue labels, track evidence, and route by fastest or cheapest policy.',
    primaryActors: ['consumer', 'ec-merchant', 'carrier', 'operator'],
    dependsOn: ['address-login', 'carrier-api-stripe', 'evidence-vault'],
    exposes: ['rate shopping', 'carrier allocation', 'tracking alias', 'delivery proof receipt', 'delivery exception hooks'],
    blockedData: ['merchant-visible raw address unless explicitly approved', 'carrier credentials in client apps', 'unredacted proof of delivery'],
    revenueModel: 'per-label fee, carrier integration fee, routing optimization tier, settlement operations',
    maturity: 'next-build',
  },
  {
    id: 'carrier-api-stripe',
    name: 'Carrier API Stripe',
    layer: 'logistics',
    boundary: 'shared-contract',
    thesis: 'A Stripe-like integration layer for carriers: one API for rates, label creation, pickup, tracking, delivery proof, refunds, and disputes.',
    primaryActors: ['developer', 'ec-merchant', 'carrier'],
    dependsOn: ['delivery-gateway'],
    exposes: ['carrier adapter contract', 'sandbox carrier simulator', 'label API', 'tracking webhook', 'carrier capability matrix'],
    blockedData: ['production carrier keys in fixtures', 'raw label payload in OSS tests', 'recipient private data in webhooks'],
    revenueModel: 'commercial adapters and managed carrier operations, with OSS contracts and local simulators',
    maturity: 'next-build',
  },
  {
    id: 'merchant-console',
    name: 'Merchant Console',
    layer: 'developer-platform',
    boundary: 'commercial',
    thesis: 'Merchants manage API keys, redirect URIs, webhooks, Address Login policy, Playlist Commerce checkout, carrier routing, logs, and billing.',
    primaryActors: ['ec-merchant', 'enterprise-admin', 'developer'],
    dependsOn: ['address-login', 'playlist-commerce', 'delivery-gateway'],
    exposes: ['project setup', 'API key management', 'webhook events', 'policy toggles', 'billing view'],
    blockedData: ['raw address exports', 'proof witnesses', 'carrier secret display'],
    revenueModel: 'SaaS subscription and usage billing',
    maturity: 'mvp-now',
  },
  {
    id: 'developer-platform',
    name: 'Developer Platform',
    layer: 'developer-platform',
    boundary: 'shared-contract',
    thesis: 'Developers adopt Vey through SDKs, CLI checks, OpenAPI specs, mocks, fixtures, CMS plugins, and framework-specific packages.',
    primaryActors: ['developer'],
    dependsOn: ['address-login', 'carrier-api-stripe', 'playlist-commerce'],
    exposes: ['React SDK', 'Next.js SDK', 'TypeScript SDK', 'Python tools', 'CMS checkout plugins', 'local sandbox'],
    blockedData: ['production traffic in test commands', 'production keys in examples', 'private address examples'],
    revenueModel: 'OSS adoption funnel into hosted services, support, and enterprise contracts',
    maturity: 'mvp-now',
  },
  {
    id: 'vey-workspace',
    name: 'Vey Workspace',
    layer: 'operations',
    boundary: 'commercial',
    thesis: 'B2B teams coordinate orders, inventory, shipments, invoices, tasks, and partner workflows without exposing private recipient data.',
    primaryActors: ['operator', 'enterprise-admin', 'ec-merchant'],
    dependsOn: ['delivery-gateway', 'vey-finance'],
    exposes: ['operations dashboard', 'workspace tasks', 'partner channels', 'shipment exceptions', 'invoice attention queue'],
    blockedData: ['customer PII in tasks', 'bank account in invoices', 'raw webhook secrets'],
    revenueModel: 'seat-based SaaS and enterprise operations package',
    maturity: 'next-build',
  },
  {
    id: 'vey-trading',
    name: 'Vey Trading',
    layer: 'trade',
    boundary: 'commercial',
    thesis: 'Trade Gateway handles RFQ, listings, compliance gates, escrow routing, and contract readiness for physical goods and controlled trade flows.',
    primaryActors: ['operator', 'enterprise-admin', 'public-sector-reviewer'],
    dependsOn: ['vey-finance', 'evidence-vault'],
    exposes: ['RFQ workflow', 'sanctions/export-control gates', 'market data evidence', 'escrow readiness'],
    blockedData: ['private contract body in public logs', 'unlicensed derivatives execution', 'counterparty private identifiers'],
    revenueModel: 'transaction workflow fee, compliance package, private deployment',
    maturity: 'scale-later',
  },
  {
    id: 'vey-finance',
    name: 'Vey Finance',
    layer: 'finance',
    boundary: 'commercial',
    thesis: 'Finance translates checkout, trade, customs, taxes, escrow, settlement, and refunds into auditable safe intents.',
    primaryActors: ['ec-merchant', 'operator', 'enterprise-admin'],
    dependsOn: ['delivery-gateway', 'evidence-vault'],
    exposes: ['landed cost estimate', 'tax evidence import', 'escrow release gate', 'settlement state'],
    blockedData: ['card PAN', 'bank account', 'tax document body in logs'],
    revenueModel: 'payment/settlement operations, enterprise finance module, support',
    maturity: 'scale-later',
  },
  {
    id: 'evidence-vault',
    name: 'Managed Evidence Vault',
    layer: 'governance',
    boundary: 'commercial',
    thesis: 'A managed audit and evidence store keeps source evidence, webhook receipts, delivery proof, revocation, and compliance events safely redacted.',
    primaryActors: ['operator', 'enterprise-admin', 'public-sector-reviewer'],
    dependsOn: [],
    exposes: ['redacted evidence record', 'retention policy', 'audit receipt', 'source fingerprint'],
    blockedData: ['raw address evidence dump', 'document body by default', 'private proof material'],
    revenueModel: 'regulated storage, audit retention, enterprise SLA',
    maturity: 'next-build',
  },
  {
    id: 'managed-zk-proof-generation',
    name: 'Managed ZK Proof Generation',
    layer: 'governance',
    boundary: 'commercial',
    thesis: 'Managed proof generation offers proof input schemas, verifier hooks, circuit lifecycle, key operations, and audit controls.',
    primaryActors: ['developer', 'enterprise-admin', 'public-sector-reviewer'],
    dependsOn: ['identity-wallet', 'evidence-vault'],
    exposes: ['proof input schema', 'verifier hook', 'non-claim tests', 'proof job receipt'],
    blockedData: ['proof witness logs', 'private proving key leakage', 'claim without issuer policy'],
    revenueModel: 'managed proof jobs, enterprise key/circuit operations, regulated deployment',
    maturity: 'scale-later',
  },
];

export const VEY_ECOSYSTEM_API_SURFACES: VeyEcosystemApiSurface[] = [
  {
    id: 'address-login-drop-in',
    owner: 'address-login',
    audience: ['developer', 'ec-merchant'],
    integrationMode: 'drop-in-sdk',
    purpose: 'Add Address Login to checkout with a React button or headless hook.',
    mustHave: ['publishable key', 'purpose', 'requested claims', 'callback verification', 'local sandbox mock'],
    nonClaims: ['Does not replace general authentication providers.', 'Does not prove residence unless the requested claim and issuer policy say so.'],
  },
  {
    id: 'carrier-routing-api',
    owner: 'carrier-api-stripe',
    audience: ['developer', 'ec-merchant', 'carrier'],
    integrationMode: 'server-api',
    purpose: 'Expose one normalized API for carrier rates, fastest/cheapest choice, label creation, tracking, and exceptions.',
    mustHave: ['carrier capability matrix', 'sandbox adapter', 'rate quote schema', 'label request schema', 'tracking webhook'],
    nonClaims: ['Does not guarantee every carrier supports every feature.', 'Does not expose production carrier credentials to client applications.'],
  },
  {
    id: 'playlist-checkout-widget',
    owner: 'playlist-commerce',
    audience: ['developer', 'ec-merchant', 'creator'],
    integrationMode: 'drop-in-sdk',
    purpose: 'Embed intent-based playlist checkout that requests wallet consent only when purchase or delivery starts.',
    mustHave: ['playlist item schema', 'checkout alias', 'merchant webhook preflight', 'privacy-safe analytics'],
    nonClaims: ['Does not let creators see delivery addresses.', 'Does not make playlist recommendations financial advice.'],
  },
  {
    id: 'cms-commerce-plugins',
    owner: 'developer-platform',
    audience: ['developer', 'ec-merchant'],
    integrationMode: 'cms-plugin',
    purpose: 'Package Address Login, Playlist Commerce, and Delivery Gateway for Shopify-like, WooCommerce-like, and custom EC stacks.',
    mustHave: ['plugin settings page', 'webhook verifier', 'checkout block', 'safe rollback path'],
    nonClaims: ['Does not bypass each CMS platform review.', 'Does not store raw address data in plugin logs.'],
  },
  {
    id: 'wallet-delivery-pass',
    owner: 'identity-wallet',
    audience: ['consumer', 'carrier'],
    integrationMode: 'wallet-pass',
    purpose: 'Export QR handoff for Apple/Google wallet style scanning, pickup, locker, travel, or delivery receipt flows.',
    mustHave: ['short-lived QR', 'audience restriction', 'revocation status', 'offline-safe display mode'],
    nonClaims: ['QR alone is not identity proof.', 'Pass export must not reveal private address material.'],
  },
  {
    id: 'merchant-operator-console',
    owner: 'merchant-console',
    audience: ['ec-merchant', 'operator', 'enterprise-admin'],
    integrationMode: 'operator-console',
    purpose: 'Manage keys, policies, carrier routing, webhook health, evidence, billing, and rollout status.',
    mustHave: ['role-based access', 'audit log', 'test/live separation', 'billing usage view'],
    nonClaims: ['Console access does not grant raw address exports by default.', 'Admin role does not bypass user consent.'],
  },
];

export const VEY_ECOSYSTEM_JOURNEYS: VeyEcosystemJourney[] = [
  {
    id: 'consumer-super-app-delivery',
    label: 'Consumer wallet orders across carriers',
    actor: 'consumer',
    steps: [
      'Choose a playlist, EC item, travel item, or direct delivery request.',
      'Approve Address Login in Vey Wallet.',
      'Select fastest or cheapest delivery policy.',
      'Receive a QR/pass and tracking alias without exposing raw address to the merchant by default.',
    ],
    products: ['identity-wallet', 'address-login', 'playlist-commerce', 'delivery-gateway', 'carrier-api-stripe'],
    valueMetric: 'checkout completion with lower address re-entry and lower failed-delivery rate',
    riskGate: 'wallet consent, carrier-only handoff, QR expiry, and revocation status must pass',
  },
  {
    id: 'developer-clerk-like-install',
    label: 'Developer installs Vey like an auth provider',
    actor: 'developer',
    steps: [
      'Install React or Next.js package.',
      'Create project in Developer Platform.',
      'Add AddressLoginButton or callback handler.',
      'Run local mock and webhook preflight before live enablement.',
    ],
    products: ['developer-platform', 'address-login', 'merchant-console'],
    valueMetric: 'time from npm install to sandbox checkout success',
    riskGate: 'redirect URI, state, nonce, PKCE, webhook signature, and no-raw-address tests must pass',
  },
  {
    id: 'ec-carrier-stripe',
    label: 'EC merchant uses one delivery API across carriers',
    actor: 'ec-merchant',
    steps: [
      'Call rate quote API with safe address alias and delivery constraints.',
      'Compare fastest and cheapest options.',
      'Create label through the selected carrier adapter.',
      'Receive tracking and proof receipts through webhooks.',
    ],
    products: ['delivery-gateway', 'carrier-api-stripe', 'evidence-vault', 'merchant-console'],
    valueMetric: 'carrier onboarding time, label success rate, exception recovery rate',
    riskGate: 'no production carrier key in app code; carrier-specific payloads remain behind server-side adapter',
  },
  {
    id: 'operator-b2b-trade',
    label: 'B2B operator moves from workspace to trade and settlement',
    actor: 'operator',
    steps: [
      'Manage orders and inventory in Vey Workspace.',
      'Route shipment through Delivery Gateway.',
      'Attach trade evidence and finance intent when cross-border or escrow is needed.',
      'Retain redacted evidence for audit.',
    ],
    products: ['vey-workspace', 'delivery-gateway', 'vey-trading', 'vey-finance', 'evidence-vault'],
    valueMetric: 'order-to-cash cycle time and reviewed exception count',
    riskGate: 'sanctions/export-control, tax evidence, escrow, and private-data blockers must pass',
  },
];

export const VEY_ECOSYSTEM_BUILD_UNITS: VeyEcosystemBuildUnit[] = [
  {
    id: 'oss-contracts-and-sdks',
    packageName: 'vey-oss-contracts',
    boundary: 'oss',
    owns: ['address-login', 'carrier-api-stripe', 'developer-platform'],
    firstReleaseGate: 'OpenAPI specs, SDK skeletons, synthetic fixtures, and no-raw-address tests pass locally.',
    verificationCommand: 'npm run verify:address-login-spec && npm run verify:playlist-commerce',
  },
  {
    id: 'hosted-identity-and-wallet',
    packageName: 'veygrit-hosted-identity',
    boundary: 'commercial',
    owns: ['identity-wallet', 'address-login', 'merchant-console'],
    firstReleaseGate: 'Hosted redirect, wallet consent, callback verification, and merchant console setup are testable.',
    verificationCommand: 'npm run verify:address-login-spec && npm run verify:veygrit-address-login-hosted',
  },
  {
    id: 'commerce-and-delivery',
    packageName: 'vey-commerce-delivery',
    boundary: 'commercial',
    owns: ['playlist-commerce', 'delivery-gateway', 'carrier-api-stripe'],
    firstReleaseGate: 'Playlist checkout, delivery rate selection, label sandbox, and webhook evidence preflight pass.',
    verificationCommand: 'npm run verify:playlist-commerce && npm run verify:delivery-gateway-carrier-api',
  },
  {
    id: 'operations-trade-finance',
    packageName: 'vey-operations-suite',
    boundary: 'commercial',
    owns: ['vey-workspace', 'vey-trading', 'vey-finance', 'evidence-vault'],
    firstReleaseGate: 'Workspace, trading, finance, and evidence models reject private material and produce auditable states.',
    verificationCommand: 'npm run verify:commerce-ops',
  },
  {
    id: 'zk-and-regulated-deployment',
    packageName: 'vey-regulated-trust',
    boundary: 'commercial',
    owns: ['managed-zk-proof-generation', 'evidence-vault'],
    firstReleaseGate: 'Proof input schema, verifier hook, non-claim tests, retention policy, and private deployment runbooks exist.',
    verificationCommand: 'npm run verify:addressql-zk && npm run verify:zk-baseline',
  },
];

export function buildVeyEcosystemResearch(): VeyEcosystemResearch {
  return {
    version: VEY_ECOSYSTEM_RESEARCH_VERSION,
    thesis:
      'Vey is an address-native commerce and logistics ecosystem: Wallet controls identity and consent, Address Login removes repeated address entry, Playlist Commerce creates intent-based demand, Delivery Gateway abstracts carriers, and Workspace/Trading/Finance turn execution into auditable operations.',
    actors: VEY_ECOSYSTEM_ACTORS,
    products: VEY_ECOSYSTEM_PRODUCTS,
    apiSurfaces: VEY_ECOSYSTEM_API_SURFACES,
    journeys: VEY_ECOSYSTEM_JOURNEYS,
    buildUnits: VEY_ECOSYSTEM_BUILD_UNITS,
    sequencing: [
      '1. Lock OSS contracts: Address Login SDKs, webhook verification, synthetic fixtures, and no-raw-address gates.',
      '2. Ship hosted Address Login plus Wallet consent as the first commercial wedge.',
      '3. Add Playlist Commerce checkout and merchant console as demand aggregation.',
      '4. Build Delivery Gateway and Carrier API Stripe for rate, label, tracking, and proof-of-delivery operations.',
      '5. Expand into Workspace, Trading, Finance, Evidence Vault, and Managed ZK where operational liability justifies commercial deployment.',
    ],
    nonClaims: [
      'Vey does not replace general authentication providers such as Clerk/Auth0/Auth.js/Firebase.',
      'Vey does not claim all countries, carriers, postal codes, islands, or POIs are complete until source gates prove coverage.',
      'Carrier API Stripe is an abstraction and adapter program, not a guarantee that every carrier exposes identical features.',
      'Wallet QR/pass export is a handoff artifact, not identity proof by itself.',
      'Commercial modules must not weaken OSS privacy, no-raw-address, and non-claim boundaries.',
    ],
  };
}

export function validateVeyEcosystemResearch(research = buildVeyEcosystemResearch()): string[] {
  const errors: string[] = [];
  const productIds = new Set(research.products.map(product => product.id));
  const actorIds = new Set(research.actors);

  for (const required of [
    'identity-wallet',
    'address-login',
    'playlist-commerce',
    'delivery-gateway',
    'carrier-api-stripe',
    'vey-workspace',
    'vey-trading',
    'vey-finance',
  ] satisfies VeyEcosystemProductId[]) {
    if (!productIds.has(required)) errors.push(`missing-product:${required}`);
  }

  for (const product of research.products) {
    if (product.blockedData.length === 0) errors.push(`product-missing-blocked-data:${product.id}`);
    if (product.exposes.length === 0) errors.push(`product-missing-surface:${product.id}`);
    if (!product.revenueModel) errors.push(`product-missing-revenue-model:${product.id}`);
    for (const actor of product.primaryActors) {
      if (!actorIds.has(actor)) errors.push(`unknown-product-actor:${product.id}:${actor}`);
    }
    for (const dependency of product.dependsOn) {
      if (!productIds.has(dependency)) errors.push(`unknown-dependency:${product.id}:${dependency}`);
    }
  }

  for (const api of research.apiSurfaces) {
    if (!productIds.has(api.owner)) errors.push(`unknown-api-owner:${api.id}:${api.owner}`);
    if (api.mustHave.length < 3) errors.push(`api-too-thin:${api.id}`);
    if (api.nonClaims.length === 0) errors.push(`api-missing-non-claim:${api.id}`);
  }

  for (const journey of research.journeys) {
    if (!actorIds.has(journey.actor)) errors.push(`unknown-journey-actor:${journey.id}:${journey.actor}`);
    if (journey.steps.length < 3) errors.push(`journey-too-short:${journey.id}`);
    if (!journey.riskGate) errors.push(`journey-missing-risk-gate:${journey.id}`);
    for (const product of journey.products) {
      if (!productIds.has(product)) errors.push(`unknown-journey-product:${journey.id}:${product}`);
    }
  }

  if (!research.apiSurfaces.some(api => api.id === 'carrier-routing-api')) errors.push('missing-carrier-routing-api');
  if (!research.apiSurfaces.some(api => api.id === 'wallet-delivery-pass')) errors.push('missing-wallet-pass-api');
  if (!research.apiSurfaces.some(api => api.integrationMode === 'cms-plugin')) errors.push('missing-cms-plugin-surface');
  if (!research.journeys.some(journey => /fastest or cheapest/i.test(journey.steps.join(' ')))) {
    errors.push('missing-fastest-cheapest-wallet-choice');
  }
  if (!research.buildUnits.some(unit => unit.boundary === 'oss')) errors.push('missing-oss-build-unit');
  if (!research.buildUnits.some(unit => unit.boundary === 'commercial')) errors.push('missing-commercial-build-unit');
  if (!research.nonClaims.some(nonClaim => /does not replace general authentication/i.test(nonClaim))) {
    errors.push('missing-auth-non-replacement-non-claim');
  }

  return errors;
}

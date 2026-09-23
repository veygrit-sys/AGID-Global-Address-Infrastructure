export const OPEN_CORE_PRODUCT_STRATEGY_VERSION = 'agid-open-core-product-strategy-v1';

export type ProductBoundary =
  | 'open-source-core'
  | 'open-source-reference-app'
  | 'commercial-managed-service'
  | 'commercial-enterprise-extension';

export type AppPartitionId =
  | 'map-registration-app'
  | 'pos-terminal-app'
  | 'address-portal-app'
  | 'address-console-app'
  | 'address-element-component';

export type ServiceOfferingId =
  | 'agid-resolver-service'
  | 'address-validation-service'
  | 'agid-address-element'
  | 'agid-pos-terminal'
  | 'address-portal'
  | 'address-console-dashboard'
  | 'hosted-registry-api'
  | 'address-review-console'
  | 'address-evidence-vault'
  | 'address-radar-signal'
  | 'managed-zk-proof-service'
  | 'payment-settlement-carrier-label-service';

export type OpenSourceFeatureArea = {
  id: string;
  label: string;
  boundary: Extract<ProductBoundary, 'open-source-core' | 'open-source-reference-app'>;
  shouldInclude: string[];
  reasonToOpen: string;
  releaseGate: string[];
};

export type OpenSourceNonNegotiableFeature = {
  id: string;
  label: string;
  areaId: string;
  mustRemainOpenSource: string[];
  cannotChargeFor: string[];
  releaseGate: string[];
};

export type CommercialFeatureArea = {
  id: string;
  label: string;
  boundary: Extract<ProductBoundary, 'commercial-managed-service' | 'commercial-enterprise-extension'>;
  canCommercialize: string[];
  dependsOnOpenSource: string[];
  reasonToCommercialize: string;
  guardrails: string[];
};

export type AppPartition = {
  id: AppPartitionId;
  label: string;
  route: string | null;
  boundary: ProductBoundary;
  role: string;
  ownsServices: ServiceOfferingId[];
  deploymentShape: 'single-route-reference' | 'separate-deployable-app' | 'dashboard-app' | 'embedded-sdk-component';
};

export type ServiceOffering = {
  id: ServiceOfferingId;
  label: string;
  boundary: ProductBoundary;
  appPartition: AppPartitionId | null;
  purpose: string;
  openSourceBaseline: string[];
  commercialExtension: string[];
  privacyRule: string;
};

export type OpenCoreProductStrategy = {
  version: typeof OPEN_CORE_PRODUCT_STRATEGY_VERSION;
  principle: string;
  openSourceFeatures: OpenSourceFeatureArea[];
  nonNegotiableOpenSourceFeatures: OpenSourceNonNegotiableFeature[];
  commercialFeatures: CommercialFeatureArea[];
  appPartitions: AppPartition[];
  serviceOfferings: ServiceOffering[];
  mvpServiceIds: ServiceOfferingId[];
  hardRules: string[];
};

export const OPEN_SOURCE_FEATURE_AREAS: OpenSourceFeatureArea[] = [
  {
    id: 'agid-aoid-standards',
    label: 'AGID/AOID standards',
    boundary: 'open-source-core',
    shouldInclude: ['AGID specification', 'AOID public specification', 'AGID-S specification', 'test vectors'],
    reasonToOpen: 'The identifiers and wire formats must be independently implementable and auditable.',
    releaseGate: ['spec versioning', 'test vector parity', 'no private AOID fields in public examples'],
  },
  {
    id: 'sdk-cli',
    label: 'SDK and CLI',
    boundary: 'open-source-core',
    shouldInclude: ['AGID generation', 'AGID encode/decode', 'AGID decode', 'AOID validation', 'AGID-S encrypt/decrypt', 'AGID-S local decrypt', 'OpenAPI', 'CLI'],
    reasonToOpen: 'Developers need a self-hostable path that does not depend on the hosted business.',
    releaseGate: ['parity tests', 'OpenAPI schema tests', 'no secret material in examples'],
  },
  {
    id: 'local-resolver',
    label: 'Local Resolver',
    boundary: 'open-source-core',
    shouldInclude: ['local address resolution', 'address rendering', 'language tabs', 'postal-code autocomplete', 'basic address validation'],
    reasonToOpen: 'The project remains trustworthy only if address resolution works without a central service.',
    releaseGate: ['country-format tests', 'language rendering tests', 'offline-mode tests'],
  },
  {
    id: 'address-element',
    label: 'Address Element',
    boundary: 'open-source-core',
    shouldInclude: ['Address Element embeddable UI', 'embeddable address intake UI', 'EC/CMS/shopping-agent integration events', 'quality decision states'],
    reasonToOpen: 'The embedded component is the main adoption surface and must be inspectable by integrators.',
    releaseGate: ['privacy-safe event tests', 'host integration examples', 'language propagation tests'],
  },
  {
    id: 'basic-pos',
    label: 'Basic POS',
    boundary: 'open-source-reference-app',
    shouldInclude: ['QR/NFC intake', 'AGID-S decryption', 'local validation', 'basic receipt', 'offline queue'],
    reasonToOpen: 'Stores, field teams, and disaster deployments need a usable reference POS without paid dependencies.',
    releaseGate: ['scan-to-decision tests', 'local receipt tests', 'offline queue tests'],
  },
  {
    id: 'privacy-security',
    label: 'Privacy and Security',
    boundary: 'open-source-core',
    shouldInclude: ['public/private separation', 'threat model', 'no-raw-address tests', 'high-risk mode rules', 'redaction', 'security fixes'],
    reasonToOpen: 'Security claims must be verifiable from source and tests, not hidden service behavior.',
    releaseGate: ['public/private separation tests', 'threat model review', 'high-risk mode tests'],
  },
  {
    id: 'zk-baseline',
    label: 'ZK baseline',
    boundary: 'open-source-core',
    shouldInclude: ['baseline circuits', 'public signal schema', 'nullifier proof interface', 'ownership/freshness verification specifications'],
    reasonToOpen: 'ZK proof relations must be inspectable before anyone can trust private address predicates.',
    releaseGate: ['public signal leakage tests', 'witness handling tests', 'circuit fixture verification'],
  },
  {
    id: 'docs-research',
    label: 'Docs and research',
    boundary: 'open-source-core',
    shouldInclude: ['papers', 'mathematical models', 'verification notes', 'developer guides', 'deployment guides'],
    reasonToOpen: 'The theory, limits, and verification status should be public to avoid overclaiming.',
    releaseGate: ['claim verification status', 'license attribution', 'metadata scrub for release artifacts'],
  },
];

export const NON_NEGOTIABLE_OPEN_SOURCE_FEATURES: OpenSourceNonNegotiableFeature[] = [
  {
    id: 'agid-local-codecs',
    label: 'AGID generation, AGID decode, and AGID-S local decryption',
    areaId: 'sdk-cli',
    mustRemainOpenSource: ['AGID generation', 'AGID decode', 'AGID-S local decrypt'],
    cannotChargeFor: ['local AGID generation', 'local AGID decode', 'local AGID-S decryption'],
    releaseGate: ['cross-language test vectors', 'local decrypt fixtures', 'no secret material in examples'],
  },
  {
    id: 'local-address-display-validation',
    label: 'Local address display, language tabs, postal assist, and basic validation',
    areaId: 'local-resolver',
    mustRemainOpenSource: ['local address display', 'language tabs', 'postal-code autocomplete', 'basic address validation'],
    cannotChargeFor: ['local address rendering', 'language tab switching', 'postal-code autocomplete', 'basic validation'],
    releaseGate: ['language rendering tests', 'postal assist tests', 'country-format validation tests'],
  },
  {
    id: 'basic-pos-local-handoff',
    label: 'QR/NFC intake, basic POS, offline queue, and basic receipt',
    areaId: 'basic-pos',
    mustRemainOpenSource: ['QR/NFC intake', 'basic POS', 'offline queue', 'basic receipt'],
    cannotChargeFor: ['local QR/NFC scan', 'basic POS operation', 'offline queue', 'basic receipt'],
    releaseGate: ['scan-to-decision tests', 'offline queue tests', 'local receipt tests'],
  },
  {
    id: 'address-element-embed',
    label: 'Address Element embeddable UI',
    areaId: 'address-element',
    mustRemainOpenSource: ['Address Element embeddable UI'],
    cannotChargeFor: ['embeddable address input UI', 'self-hosted Address Element'],
    releaseGate: ['host integration examples', 'privacy-safe event tests', 'language propagation tests'],
  },
  {
    id: 'user-control-portal',
    label: 'User consent review, revoke, delete, and export',
    areaId: 'privacy-security',
    mustRemainOpenSource: ['user consent review', 'revoke', 'delete', 'export'],
    cannotChargeFor: ['consent review', 'revocation', 'deletion', 'export'],
    releaseGate: ['portal consent tests', 'revoke/delete/export tests', 'no raw private fields in portal events'],
  },
  {
    id: 'privacy-safety-core',
    label: 'High-risk mode, redaction, no-raw-address tests, and security fixes',
    areaId: 'privacy-security',
    mustRemainOpenSource: ['high-risk mode', 'redaction', 'no-raw-address tests', 'security fixes'],
    cannotChargeFor: ['high-risk mode', 'redaction', 'privacy regression tests', 'security fixes'],
    releaseGate: ['high-risk mode tests', 'redaction tests', 'security patch release notes'],
  },
];

export const COMMERCIAL_FEATURE_AREAS: CommercialFeatureArea[] = [
  {
    id: 'hosted-registry-api',
    label: 'Hosted Registry API',
    boundary: 'commercial-managed-service',
    canCommercialize: ['issuer operations', 'revocation operations', 'freshness operations', 'nullifier operations', 'used-state operations'],
    dependsOnOpenSource: ['OpenAPI', 'registry schemas', 'public/private separation', 'test vectors'],
    reasonToCommercialize: 'Operating a reliable registry is an availability, monitoring, and support burden.',
    guardrails: ['self-hosting contract remains public', 'no raw address storage', 'commitment-only public payloads'],
  },
  {
    id: 'enterprise-dashboard',
    label: 'Enterprise Dashboard',
    boundary: 'commercial-enterprise-extension',
    canCommercialize: ['audit views', 'webhook operations', 'API keys', 'SLA status', 'organization permissions', 'long-term logs'],
    dependsOnOpenSource: ['dashboard reference UI', 'redacted event schema', 'launch checklist'],
    reasonToCommercialize: 'Large organizations pay for multi-tenant operations, retention, and support rather than the standard itself.',
    guardrails: ['redacted logs by default', 'private payloads blocked upstream', 'role and audit reason for sensitive escalation'],
  },
  {
    id: 'advanced-pos-management',
    label: 'Advanced POS management',
    boundary: 'commercial-enterprise-extension',
    canCommercialize: ['terminal fleet management', 'staff permissions', 'printer diagnostics', 'measurement device diagnostics', 'site management'],
    dependsOnOpenSource: ['basic POS', 'terminal event schema', 'offline queue model'],
    reasonToCommercialize: 'Fleet operations and certified device support are ongoing managed operations.',
    guardrails: ['basic local POS remains usable', 'device telemetry excludes raw address and AGID-S payloads'],
  },
  {
    id: 'advanced-review-console',
    label: 'Advanced Review Console',
    boundary: 'commercial-enterprise-extension',
    canCommercialize: ['human review queue', 'disputes', 'advanced Address Radar risk scoring', 'case escalation'],
    dependsOnOpenSource: ['review case model', 'redacted evidence references', 'manual decision receipt format'],
    reasonToCommercialize: 'Human review, escalation, and tuned risk operations are service-heavy.',
    guardrails: ['reason codes remain explainable', 'raw evidence access requires scope and audit reason'],
  },
  {
    id: 'managed-zk',
    label: 'Managed ZK',
    boundary: 'commercial-managed-service',
    canCommercialize: ['proof generation server', 'proof queue', 'prover infrastructure', 'verifier deployment support'],
    dependsOnOpenSource: ['baseline circuits', 'public signal schema', 'proof compatibility tests'],
    reasonToCommercialize: 'Reliable proving infrastructure needs operations, capacity planning, and security review.',
    guardrails: ['witnesses are never logged', 'public signals are leakage-tested', 'self-hosted prover path remains possible'],
  },
  {
    id: 'managed-evidence-vault',
    label: 'Managed Evidence Vault',
    boundary: 'commercial-managed-service',
    canCommercialize: ['encrypted evidence storage', 'OCR operations', 'legal hold', 'retention policy management'],
    dependsOnOpenSource: ['evidence envelope format', 'redaction workflow', 'local evidence review UI'],
    reasonToCommercialize: 'Evidence retention and legal hold are operational and compliance-heavy.',
    guardrails: ['local/private-first default', 'no automatic external OCR upload', 'redaction before sync'],
  },
  {
    id: 'private-deployment',
    label: 'Private Deployment',
    boundary: 'commercial-enterprise-extension',
    canCommercialize: ['municipality deployment', 'NGO deployment', 'carrier deployment', 'warehouse deployment', 'large retailer deployment'],
    dependsOnOpenSource: ['open standards', 'local resolver', 'basic POS', 'security model'],
    reasonToCommercialize: 'High-risk and enterprise deployments need environment-specific support, hardening, and training.',
    guardrails: ['public standard remains independently usable', 'deployment notes avoid automatic compliance claims'],
  },
  {
    id: 'commercial-support',
    label: 'Commercial support',
    boundary: 'commercial-enterprise-extension',
    canCommercialize: ['implementation support', 'audit readiness support', 'SLA', 'custom integrations', 'training'],
    dependsOnOpenSource: ['docs', 'SDKs', 'reference apps', 'conformance tests'],
    reasonToCommercialize: 'Support monetizes expertise without closing the standard.',
    guardrails: ['support is not required to verify the protocol', 'public docs remain sufficient for independent adoption'],
  },
];

export const APP_PARTITIONS: AppPartition[] = [
  {
    id: 'map-registration-app',
    label: 'AGID Map / Registration App',
    route: '/',
    boundary: 'open-source-reference-app',
    role: 'Map search, address display, registration, correction, and feedback.',
    ownsServices: ['agid-resolver-service', 'address-validation-service'],
    deploymentShape: 'single-route-reference',
  },
  {
    id: 'pos-terminal-app',
    label: 'AGID POS Terminal App',
    route: '/pos',
    boundary: 'open-source-reference-app',
    role: 'Delivery intake, QR/NFC, AGID-S decryption, recipient proof, waybill, device diagnostics, and handoff.',
    ownsServices: ['agid-pos-terminal', 'payment-settlement-carrier-label-service'],
    deploymentShape: 'separate-deployable-app',
  },
  {
    id: 'address-portal-app',
    label: 'Address Portal App',
    route: '/portal',
    boundary: 'open-source-reference-app',
    role: 'User consent, scope, revocation, deletion, and connection management.',
    ownsServices: ['address-portal'],
    deploymentShape: 'separate-deployable-app',
  },
  {
    id: 'address-console-app',
    label: 'Address Console App',
    route: '/dashboard',
    boundary: 'commercial-enterprise-extension',
    role: 'Dashboard, Review Console, Developer Console, audit, webhooks, issuers, terminals, and operations.',
    ownsServices: ['address-console-dashboard', 'hosted-registry-api', 'address-review-console', 'address-radar-signal', 'managed-zk-proof-service', 'address-evidence-vault'],
    deploymentShape: 'dashboard-app',
  },
  {
    id: 'address-element-component',
    label: 'AGID Address Element',
    route: null,
    boundary: 'open-source-core',
    role: 'Embeddable address entry and AddressIntent component for EC, CMS, POS, and shopping agents.',
    ownsServices: ['agid-address-element'],
    deploymentShape: 'embedded-sdk-component',
  },
];

export const SERVICE_OFFERINGS: ServiceOffering[] = [
  {
    id: 'agid-resolver-service',
    label: 'AGID Resolver Service',
    boundary: 'open-source-core',
    appPartition: 'map-registration-app',
    purpose: 'AGID generation, reverse lookup, address display, and place-name search.',
    openSourceBaseline: ['AGID generation', 'AGID decode', 'local resolver', 'address rendering', 'language-aware output', 'self-hostable indexes'],
    commercialExtension: ['hosted resolver cache', 'SLA-backed high-volume resolver endpoint'],
    privacyRule: 'Raw AGID is allowed only for explicit public/local contexts; high-risk and registry contexts use commitments.',
  },
  {
    id: 'address-validation-service',
    label: 'Address Validation Service',
    boundary: 'open-source-core',
    appPartition: 'map-registration-app',
    purpose: 'Postal-code, country-rule, delivery feasibility, and quality decision checks.',
    openSourceBaseline: ['postal-code assist', 'postal-code autocomplete', 'country address rules', 'basic validation', 'quality status mapping'],
    commercialExtension: ['managed official-source update monitoring', 'carrier acceptance rule operations'],
    privacyRule: 'User-facing output is action state, not raw internal score; private corrections remain local or consented.',
  },
  {
    id: 'agid-address-element',
    label: 'AGID Address Element',
    boundary: 'open-source-core',
    appPartition: 'address-element-component',
    purpose: 'Embeddable address intake for EC, CMS, POS, and shopping agents.',
    openSourceBaseline: ['Address Element embeddable UI', 'component UI', 'event contract', 'AddressIntent creation', 'QR/NFC request hooks'],
    commercialExtension: ['merchant analytics', 'enterprise checkout support', 'advanced anti-abuse configuration'],
    privacyRule: 'Host events must not contain raw AOID, raw AGID-S payload, proof code, or recipient secret.',
  },
  {
    id: 'agid-pos-terminal',
    label: 'AGID POS Terminal',
    boundary: 'open-source-reference-app',
    appPartition: 'pos-terminal-app',
    purpose: 'QR/NFC intake, waybill, recipient proof, and delivery handoff.',
    openSourceBaseline: ['QR/NFC intake', 'basic POS', 'basic scan flow', 'AGID-S local decrypt', 'basic receipt', 'local receipt', 'offline queue'],
    commercialExtension: ['fleet management', 'device certification', 'managed registry sync', 'advanced audit retention'],
    privacyRule: 'Receipts store commitments, device signatures, and state, not raw QR/NFC payloads.',
  },
  {
    id: 'address-portal',
    label: 'Address Portal',
    boundary: 'open-source-reference-app',
    appPartition: 'address-portal-app',
    purpose: 'User consent, scopes, revocation, and deletion management.',
    openSourceBaseline: ['connection list', 'user consent review', 'scope review', 'revoke/delete/export reference flows', 'revoke', 'delete', 'export'],
    commercialExtension: ['hosted account operations', 'managed notifications', 'enterprise deletion workflow'],
    privacyRule: 'Portal lists organizations, scopes, aliases, and status, not raw address or raw AOID details.',
  },
  {
    id: 'address-console-dashboard',
    label: 'Address Console / Dashboard',
    boundary: 'commercial-enterprise-extension',
    appPartition: 'address-console-app',
    purpose: 'API, webhook, terminal, issuer, audit, and log management.',
    openSourceBaseline: ['minimal reference dashboard', 'redacted event viewer', 'launch checklist schema'],
    commercialExtension: ['multi-tenant dashboard', 'SLA monitoring', 'long-term logs', 'organization permissions'],
    privacyRule: 'Dashboard ingests metrics, references, commitments, and statuses only.',
  },
  {
    id: 'hosted-registry-api',
    label: 'Hosted Registry API',
    boundary: 'commercial-managed-service',
    appPartition: 'address-console-app',
    purpose: 'Issuer, revocation, freshness, nullifier, and used-state operations.',
    openSourceBaseline: ['OpenAPI', 'self-hostable schemas', 'registry client tests'],
    commercialExtension: ['hosted registry operations', 'availability monitoring', 'support and incident response'],
    privacyRule: 'Registry records use commitments, roots, nullifiers, status, and issuer metadata only.',
  },
  {
    id: 'address-review-console',
    label: 'Address Review Console',
    boundary: 'commercial-enterprise-extension',
    appPartition: 'address-console-app',
    purpose: 'Needs-review, rejection, dispute, address conflict, and re-verification workflows.',
    openSourceBaseline: ['case model', 'redacted viewer reference', 'decision receipt format'],
    commercialExtension: ['human review queue', 'SLA escalation', 'advanced Address Radar signals'],
    privacyRule: 'Review starts from redacted evidence; raw escalation requires scope, role, and audit reason.',
  },
  {
    id: 'address-evidence-vault',
    label: 'Address Evidence Vault',
    boundary: 'commercial-managed-service',
    appPartition: 'address-console-app',
    purpose: 'Photo/PDF/OCR, redaction, and encrypted evidence.',
    openSourceBaseline: ['local evidence envelope', 'editable OCR candidates', 'redaction workflow'],
    commercialExtension: ['encrypted storage', 'managed OCR', 'legal hold', 'retention policy'],
    privacyRule: 'Evidence is local/encrypted by default and must be redacted before sync.',
  },
  {
    id: 'address-radar-signal',
    label: 'Address Radar / Signal',
    boundary: 'commercial-enterprise-extension',
    appPartition: 'address-console-app',
    purpose: 'Fraud, QR reuse, suspicious handoff, and risk decision support.',
    openSourceBaseline: ['basic rule model', 'reason-code schema', 'safe signal tests'],
    commercialExtension: ['advanced risk models', 'merchant/carrier tuning', 'review queue integration'],
    privacyRule: 'Risk output uses explainable reason codes; raw fraud features are not exposed to public payloads.',
  },
  {
    id: 'managed-zk-proof-service',
    label: 'Managed ZK Proof Service',
    boundary: 'commercial-managed-service',
    appPartition: 'address-console-app',
    purpose: 'ZK proof generation, proof queue, and verifier integration.',
    openSourceBaseline: ['baseline circuits', 'proof schema', 'public signal tests'],
    commercialExtension: ['managed prover', 'proof queue', 'prover infrastructure', 'verifier deployment support'],
    privacyRule: 'Witnesses and private inputs never enter logs, public signals, or public chain payloads.',
  },
  {
    id: 'payment-settlement-carrier-label-service',
    label: 'Payment / Settlement / Carrier Label Service',
    boundary: 'commercial-managed-service',
    appPartition: 'pos-terminal-app',
    purpose: 'Prepaid, collect-on-delivery, escrow, waybill, and carrier integration.',
    openSourceBaseline: ['payment gate model', 'waybill QR format', 'carrier intent status model'],
    commercialExtension: ['settlement operations', 'merchant reconciliation', 'carrier API operations', 'dispute handling'],
    privacyRule: 'Payment and label records use payment commitments, short aliases, receipt hashes, and public status.',
  },
];

export const OPEN_CORE_HARD_RULES = [
  'Commercial services must not be required to verify the public AGID/AOID standard.',
  'Mode 0 local operation must work without Hosted Registry, ZK, Ethereum, or managed services.',
  'AGID generation, AGID decode, AGID-S local decryption, local address display, language tabs, postal-code autocomplete, basic validation, QR/NFC intake, basic POS, offline queue, basic receipt, Address Element, consent review, revoke, delete, export, high-risk mode, redaction, no-raw-address tests, and security fixes are non-negotiable open-source features.',
  'Open-source code should include enough reference apps and tests to detect privacy regressions.',
  'Commercial features monetize operations, SLA, retention, support, and advanced review, not the right to implement AGID/AOID.',
  'Raw address, raw AOID, AGID-S payloads, recipient identity, proof secrets, and precise high-risk coordinates stay out of public payloads.',
];

export function getOpenCoreProductStrategy(): OpenCoreProductStrategy {
  return {
    version: OPEN_CORE_PRODUCT_STRATEGY_VERSION,
    principle: 'Keep AGID/AOID codecs, local resolver, Address Element, basic POS, user controls, privacy tests, and reference apps open; commercialize only managed operations, SLA, review, proof generation infrastructure, evidence retention operations, and enterprise deployment.',
    openSourceFeatures: OPEN_SOURCE_FEATURE_AREAS.map(item => ({
      ...item,
      shouldInclude: [...item.shouldInclude],
      releaseGate: [...item.releaseGate],
    })),
    nonNegotiableOpenSourceFeatures: NON_NEGOTIABLE_OPEN_SOURCE_FEATURES.map(item => ({
      ...item,
      mustRemainOpenSource: [...item.mustRemainOpenSource],
      cannotChargeFor: [...item.cannotChargeFor],
      releaseGate: [...item.releaseGate],
    })),
    commercialFeatures: COMMERCIAL_FEATURE_AREAS.map(item => ({
      ...item,
      canCommercialize: [...item.canCommercialize],
      dependsOnOpenSource: [...item.dependsOnOpenSource],
      guardrails: [...item.guardrails],
    })),
    appPartitions: APP_PARTITIONS.map(item => ({
      ...item,
      ownsServices: [...item.ownsServices],
    })),
    serviceOfferings: SERVICE_OFFERINGS.map(item => ({
      ...item,
      openSourceBaseline: [...item.openSourceBaseline],
      commercialExtension: [...item.commercialExtension],
    })),
    mvpServiceIds: [
      'agid-resolver-service',
      'address-validation-service',
      'agid-address-element',
      'agid-pos-terminal',
      'hosted-registry-api',
    ],
    hardRules: [...OPEN_CORE_HARD_RULES],
  };
}

export function summarizeOpenCoreProductStrategy() {
  const strategy = getOpenCoreProductStrategy();
  return {
    version: strategy.version,
    openSourceFeatureAreas: strategy.openSourceFeatures.length,
    commercialFeatureAreas: strategy.commercialFeatures.length,
    appPartitions: strategy.appPartitions.length,
    serviceOfferings: strategy.serviceOfferings.length,
    mvpServices: strategy.mvpServiceIds.length,
    nonNegotiableOpenSourceFeatures: strategy.nonNegotiableOpenSourceFeatures.length,
    appIds: strategy.appPartitions.map(app => app.id),
    serviceIds: strategy.serviceOfferings.map(service => service.id),
  };
}

export function getServicesForApp(appId: AppPartitionId): ServiceOffering[] {
  const strategy = getOpenCoreProductStrategy();
  return strategy.serviceOfferings.filter(service => service.appPartition === appId);
}

export function validateOpenCoreProductStrategy(
  strategy = getOpenCoreProductStrategy(),
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const appIds = new Set(strategy.appPartitions.map(app => app.id));
  const serviceIds = new Set<ServiceOfferingId>();

  if (strategy.openSourceFeatures.length !== 8) errors.push(`expected-8-open-source-features:${strategy.openSourceFeatures.length}`);
  if (strategy.nonNegotiableOpenSourceFeatures.length !== 6) errors.push(`expected-6-non-negotiable-oss-features:${strategy.nonNegotiableOpenSourceFeatures.length}`);
  if (strategy.commercialFeatures.length !== 8) errors.push(`expected-8-commercial-features:${strategy.commercialFeatures.length}`);
  if (strategy.appPartitions.length !== 5) errors.push(`expected-5-app-partitions:${strategy.appPartitions.length}`);
  if (strategy.serviceOfferings.length !== 12) errors.push(`expected-12-service-offerings:${strategy.serviceOfferings.length}`);

  for (const area of strategy.openSourceFeatures) {
    if (!area.shouldInclude.length) errors.push(`missing-oss-scope:${area.id}`);
    if (!area.releaseGate.length) errors.push(`missing-release-gate:${area.id}`);
  }

  const openSourceAreaIds = new Set(strategy.openSourceFeatures.map(area => area.id));
  const openSourceSurfaceText = [
    ...strategy.openSourceFeatures.flatMap(area => area.shouldInclude),
    ...strategy.serviceOfferings.flatMap(service => service.openSourceBaseline),
    ...strategy.hardRules,
  ].join(' | ').toLowerCase();

  for (const feature of strategy.nonNegotiableOpenSourceFeatures) {
    if (!openSourceAreaIds.has(feature.areaId)) errors.push(`non-negotiable-feature-area-unknown:${feature.id}:${feature.areaId}`);
    if (!feature.mustRemainOpenSource.length) errors.push(`missing-non-negotiable-scope:${feature.id}`);
    if (!feature.cannotChargeFor.length) errors.push(`missing-non-negotiable-free-scope:${feature.id}`);
    if (!feature.releaseGate.length) errors.push(`missing-non-negotiable-release-gate:${feature.id}`);
    for (const term of feature.mustRemainOpenSource) {
      if (!openSourceSurfaceText.includes(term.toLowerCase())) {
        errors.push(`non-negotiable-feature-not-in-oss-surface:${feature.id}:${term}`);
      }
    }
  }

  for (const area of strategy.commercialFeatures) {
    if (!area.canCommercialize.length) errors.push(`missing-commercial-scope:${area.id}`);
    if (!area.dependsOnOpenSource.length) errors.push(`missing-open-source-dependency:${area.id}`);
    if (!area.guardrails.length) errors.push(`missing-commercial-guardrails:${area.id}`);
  }

  for (const app of strategy.appPartitions) {
    if (!app.ownsServices.length) errors.push(`app-without-services:${app.id}`);
  }

  for (const service of strategy.serviceOfferings) {
    if (serviceIds.has(service.id)) errors.push(`duplicate-service:${service.id}`);
    serviceIds.add(service.id);
    if (service.appPartition && !appIds.has(service.appPartition)) {
      errors.push(`service-app-unknown:${service.id}:${service.appPartition}`);
    }
    if (!service.openSourceBaseline.length) errors.push(`missing-service-oss-baseline:${service.id}`);
    if (!service.commercialExtension.length) errors.push(`missing-service-commercial-extension:${service.id}`);
    if (!service.privacyRule.trim()) errors.push(`missing-service-privacy-rule:${service.id}`);
  }

  const ownedServiceIds = new Set(strategy.appPartitions.flatMap(app => app.ownsServices));
  for (const service of strategy.serviceOfferings) {
    if (!ownedServiceIds.has(service.id)) warnings.push(`service-not-owned-by-app:${service.id}`);
  }

  if (!strategy.hardRules.some(rule => /Mode 0 local operation/i.test(rule))) {
    errors.push('missing-mode-0-hard-rule');
  }
  if (!strategy.mvpServiceIds.includes('hosted-registry-api')) {
    warnings.push('mvp-without-hosted-registry-api');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

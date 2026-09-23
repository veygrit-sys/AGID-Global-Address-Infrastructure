import type { AppPartitionId } from './openCoreProductStrategy';

export const APP_FEATURE_MONETIZATION_VERSION = 'agid-app-feature-monetization-v1';

export type MonetizationTier =
  | 'never-paywalled'
  | 'free-local'
  | 'free-self-hosted'
  | 'paid-pro'
  | 'paid-business'
  | 'paid-enterprise';

export type AppFeatureMonetizationEntry = {
  id: string;
  appId: AppPartitionId;
  label: string;
  tier: MonetizationTier;
  freeBaseline: string[];
  paidUpgrade: string[];
  boundaryReason: string;
  privacyGuardrail: string;
};

export type AppMonetizationSummary = {
  version: typeof APP_FEATURE_MONETIZATION_VERSION;
  principle: string;
  entries: AppFeatureMonetizationEntry[];
  neverPaywallFeatureIds: string[];
  recommendedTierOrder: MonetizationTier[];
  launchRules: string[];
};

export const RECOMMENDED_TIER_ORDER: MonetizationTier[] = [
  'never-paywalled',
  'free-local',
  'free-self-hosted',
  'paid-pro',
  'paid-business',
  'paid-enterprise',
];

export const APP_FEATURE_MONETIZATION_ENTRIES: AppFeatureMonetizationEntry[] = [
  {
    id: 'map-local-resolution',
    appId: 'map-registration-app',
    label: 'Map search, AGID generation, and local address display',
    tier: 'free-local',
    freeBaseline: ['AGID generation', 'AGID encode/decode', 'AGID decode', 'map search', 'local address display', 'reverse display', 'language tabs', 'postal-code autocomplete', 'postal-code assist', 'basic address validation'],
    paidUpgrade: ['hosted resolver cache', 'high-volume SLA endpoint', 'managed official-source update operations'],
    boundaryReason: 'Core address resolution must be usable without an account or hosted dependency.',
    privacyGuardrail: 'Local map and address rendering must not upload raw address, AOID, or AGID-S payloads.',
  },
  {
    id: 'registration-correction-feedback',
    appId: 'map-registration-app',
    label: 'Address registration, correction, and feedback',
    tier: 'free-local',
    freeBaseline: ['manual correction', 'local feedback capture', 'quality state', 'editable address registration'],
    paidUpgrade: ['managed feedback review queue', 'organization-level training workflow', 'cross-site quality analytics'],
    boundaryReason: 'Corrections are necessary for data quality and should not require payment.',
    privacyGuardrail: 'Feedback learning is opt-in, redacted, and local-first unless explicit sync consent exists.',
  },
  {
    id: 'address-element-embed',
    appId: 'address-element-component',
    label: 'AGID Address Element embed',
    tier: 'free-self-hosted',
    freeBaseline: ['Address Element embeddable UI', 'embeddable input UI', 'AddressIntent events', 'AGID and postal assist', 'language-aware formatting'],
    paidUpgrade: ['merchant analytics', 'managed checkout support', 'enterprise anti-abuse rule packs'],
    boundaryReason: 'The embed is the adoption surface and should remain inspectable and self-hostable.',
    privacyGuardrail: 'Host events must be redacted and must not expose raw AOID, proof code, or recipient secret.',
  },
  {
    id: 'pos-scan-local-handoff',
    appId: 'pos-terminal-app',
    label: 'POS QR/NFC intake and local handoff',
    tier: 'free-local',
    freeBaseline: ['QR/NFC intake', 'QR/NFC scan', 'basic POS', 'AGID-S local decrypt', 'local validation', 'basic receipt', 'offline queue'],
    paidUpgrade: ['managed registry sync', 'fleet dashboards', 'long-term audit retention'],
    boundaryReason: 'Stores, small operators, and disaster teams need a no-cost local POS path.',
    privacyGuardrail: 'Receipts store commitments and signatures, not raw QR, raw address, or recipient proof code.',
  },
  {
    id: 'pos-device-diagnostics-basic',
    appId: 'pos-terminal-app',
    label: 'Basic POS device diagnostics',
    tier: 'free-local',
    freeBaseline: ['scanner test', 'printer test stub', 'cash drawer test stub', 'measurement-device readiness state'],
    paidUpgrade: ['certified device profiles', 'fleet diagnostics', 'remote device health monitoring'],
    boundaryReason: 'Basic field troubleshooting should not require enterprise fleet tooling.',
    privacyGuardrail: 'Device telemetry excludes address text, AGID-S payloads, and recipient identifiers.',
  },
  {
    id: 'portal-consent-revocation',
    appId: 'address-portal-app',
    label: 'User consent, scope, revocation, export, and deletion',
    tier: 'never-paywalled',
    freeBaseline: ['connection list', 'scope review', 'revoke', 'delete', 'export', 'local credential visibility'],
    paidUpgrade: ['managed organization notification workflows', 'enterprise deletion ticketing', 'audit-certified export bundles'],
    boundaryReason: 'Users must always be able to see, revoke, export, and delete their address permissions.',
    privacyGuardrail: 'Portal displays organizations, scopes, aliases, and state without exposing raw private address fields.',
  },
  {
    id: 'console-developer-baseline',
    appId: 'address-console-app',
    label: 'Developer console baseline',
    tier: 'free-self-hosted',
    freeBaseline: ['local API docs', 'OpenAPI viewer', 'redacted event viewer', 'webhook signature examples'],
    paidUpgrade: ['hosted API keys', 'webhook delivery operations', 'organization dashboards', 'SLA monitoring'],
    boundaryReason: 'Developers should be able to build and self-host from public docs and redacted test events.',
    privacyGuardrail: 'Developer logs are redacted by default and must reject raw address payloads.',
  },
  {
    id: 'console-enterprise-operations',
    appId: 'address-console-app',
    label: 'Enterprise operations dashboard',
    tier: 'paid-business',
    freeBaseline: ['minimal self-hosted dashboard shell', 'redacted local logs', 'manual launch checklist'],
    paidUpgrade: ['multi-tenant organizations', 'RBAC', 'API keys', 'webhook operations', 'long-term logs', 'review queues'],
    boundaryReason: 'Multi-tenant operations, retention, and support are service-heavy and fair to monetize.',
    privacyGuardrail: 'Enterprise views use commitments, aliases, and evidence references; raw escalation requires role and reason.',
  },
  {
    id: 'hosted-registry-and-sync',
    appId: 'address-console-app',
    label: 'Hosted registry, freshness, revocation, nullifier, and sync',
    tier: 'paid-pro',
    freeBaseline: ['self-host schemas', 'local registry fixtures', 'registry client tests'],
    paidUpgrade: ['hosted issuer registry', 'revocation API', 'freshness API', 'nullifier API', 'used-state sync'],
    boundaryReason: 'Reliable registry uptime and monitoring are operational costs, not protocol requirements.',
    privacyGuardrail: 'Hosted registry stores commitments, roots, nullifiers, status, and issuer metadata only.',
  },
  {
    id: 'managed-evidence-review',
    appId: 'address-console-app',
    label: 'Managed evidence vault and advanced review',
    tier: 'paid-business',
    freeBaseline: ['local evidence envelope', 'editable OCR candidates', 'manual redaction workflow'],
    paidUpgrade: ['encrypted evidence storage', 'managed OCR', 'legal hold', 'retention policy', 'review escalation'],
    boundaryReason: 'Evidence retention, legal hold, and review operations are compliance-heavy services.',
    privacyGuardrail: 'Evidence is encrypted and redacted before managed sync; external OCR is opt-in.',
  },
  {
    id: 'managed-zk-proof-operations',
    appId: 'address-console-app',
    label: 'Managed ZK proof generation',
    tier: 'paid-enterprise',
    freeBaseline: ['baseline circuits', 'public signal schema', 'self-host prover path', 'verifier fixtures'],
    paidUpgrade: ['proof queue', 'managed prover capacity', 'verifier deployment support', 'proof SLA'],
    boundaryReason: 'Proof infrastructure can be expensive, but the proof relation must remain public.',
    privacyGuardrail: 'Witnesses and private inputs are never logged or exposed to public signals.',
  },
  {
    id: 'privacy-safety-controls',
    appId: 'map-registration-app',
    label: 'Privacy, high-risk mode, local verification, and security patches',
    tier: 'never-paywalled',
    freeBaseline: ['high-risk mode', 'no-raw-address tests', 'local verification', 'redaction', 'security fixes', 'security updates'],
    paidUpgrade: ['managed policy reporting', 'enterprise audit assistance'],
    boundaryReason: 'Safety controls must never be used as a paywall.',
    privacyGuardrail: 'High-risk mode keeps precise AGID, raw address, history, and recipient identity out of shared payloads.',
  },
];

export const MONETIZATION_LAUNCH_RULES = [
  'Do not charge for local AGID generation, local AGID decode, local AGID-S decryption, local address display, language tabs, postal-code autocomplete, basic address validation, QR/NFC intake, basic POS, offline queue, basic receipt, Address Element, user consent review, user revocation, export, deletion, high-risk mode, redaction, no-raw-address tests, or security fixes.',
  'Charge for operations, scale, SLA, retention, multi-tenant governance, managed proof generation, device fleets, and dedicated support.',
  'A paid feature may improve convenience or availability, but it must not be the only way to verify the public standard.',
  'Free tiers must avoid free-tier SaaS dependencies in core scan-time paths; prefer local, self-hosted, or operator-imported data.',
  'Paid analytics and review features must consume redacted events, commitments, aliases, and evidence references by default.',
];

export function getAppFeatureMonetizationBoundary(): AppMonetizationSummary {
  return {
    version: APP_FEATURE_MONETIZATION_VERSION,
    principle: 'Charge for managed operations and scale, not for local safety, verification, user control, or the public AGID/AOID standard.',
    entries: APP_FEATURE_MONETIZATION_ENTRIES.map(entry => ({
      ...entry,
      freeBaseline: [...entry.freeBaseline],
      paidUpgrade: [...entry.paidUpgrade],
    })),
    neverPaywallFeatureIds: APP_FEATURE_MONETIZATION_ENTRIES
      .filter(entry => entry.tier === 'never-paywalled')
      .map(entry => entry.id),
    recommendedTierOrder: [...RECOMMENDED_TIER_ORDER],
    launchRules: [...MONETIZATION_LAUNCH_RULES],
  };
}

export function getMonetizationEntriesForApp(appId: AppPartitionId): AppFeatureMonetizationEntry[] {
  return getAppFeatureMonetizationBoundary().entries.filter(entry => entry.appId === appId);
}

export function summarizeAppFeatureMonetizationBoundary() {
  const boundary = getAppFeatureMonetizationBoundary();
  return {
    version: boundary.version,
    totalEntries: boundary.entries.length,
    neverPaywalledEntries: boundary.entries.filter(entry => entry.tier === 'never-paywalled').length,
    freeEntries: boundary.entries.filter(entry => entry.tier === 'free-local' || entry.tier === 'free-self-hosted').length,
    paidEntries: boundary.entries.filter(entry => entry.tier.startsWith('paid-')).length,
    tiers: boundary.recommendedTierOrder,
  };
}

export function validateAppFeatureMonetizationBoundary(
  boundary = getAppFeatureMonetizationBoundary(),
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const appIds = new Set<AppPartitionId>();
  const featureIds = new Set<string>();

  for (const entry of boundary.entries) {
    if (featureIds.has(entry.id)) errors.push(`duplicate-feature:${entry.id}`);
    featureIds.add(entry.id);
    appIds.add(entry.appId);
    if (!entry.freeBaseline.length) errors.push(`missing-free-baseline:${entry.id}`);
    if (!entry.boundaryReason.trim()) errors.push(`missing-boundary-reason:${entry.id}`);
    if (!entry.privacyGuardrail.trim()) errors.push(`missing-privacy-guardrail:${entry.id}`);
    if (entry.tier === 'never-paywalled' && !entry.freeBaseline.length) errors.push(`empty-never-paywalled-baseline:${entry.id}`);
  }

  for (const appId of ['map-registration-app', 'pos-terminal-app', 'address-portal-app', 'address-console-app', 'address-element-component'] satisfies AppPartitionId[]) {
    if (!appIds.has(appId)) errors.push(`missing-app-boundary:${appId}`);
  }

  for (const id of ['portal-consent-revocation', 'privacy-safety-controls']) {
    const entry = boundary.entries.find(item => item.id === id);
    if (!entry) {
      errors.push(`missing-required-never-paywalled:${id}`);
    } else if (entry.tier !== 'never-paywalled') {
      errors.push(`required-feature-paywalled:${id}:${entry.tier}`);
    }
  }

  const safetyTerms = ['revoke', 'delete', 'export', 'high-risk mode', 'security updates', 'local verification'];
  const paidSafetyLeak = boundary.entries.filter(entry => (
    entry.tier.startsWith('paid-')
    && safetyTerms.some(term => [...entry.freeBaseline, ...entry.paidUpgrade].join(' ').toLowerCase().includes(term))
  ));
  if (paidSafetyLeak.length) {
    warnings.push(`paid-entry-mentions-safety-control:${paidSafetyLeak.map(entry => entry.id).join(',')}`);
  }

  if (!boundary.launchRules.some(rule => /Do not charge for local AGID generation/i.test(rule))) {
    errors.push('missing-local-free-launch-rule');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

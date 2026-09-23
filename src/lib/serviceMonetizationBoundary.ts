import {
  getOpenCoreProductStrategy,
  type ServiceOfferingId,
} from './openCoreProductStrategy';

export const SERVICE_MONETIZATION_BOUNDARY_VERSION = 'agid-service-monetization-boundary-v1';

export type PaidExceptionReason =
  | 'hosted-infrastructure-cost'
  | 'external-pass-through-cost'
  | 'human-review-cost'
  | 'legal-retention-cost'
  | 'zk-compute-cost'
  | 'sla-support-cost'
  | 'private-deployment-cost'
  | 'carrier-integration-cost';

export type PaidException = {
  id: string;
  label: string;
  reason: PaidExceptionReason;
  chargeOnlyFor: string[];
  freeFallback: string;
};

export type ServiceMonetizationBoundaryEntry = {
  serviceId: ServiceOfferingId;
  label: string;
  defaultAccess: 'free';
  freeScope: string[];
  paidOnlyWhen: PaidException[];
  neverChargeFor: string[];
  privacyGuardrail: string;
};

export type ServiceMonetizationBoundary = {
  version: typeof SERVICE_MONETIZATION_BOUNDARY_VERSION;
  principle: string;
  entries: ServiceMonetizationBoundaryEntry[];
  hardRules: string[];
};

export const SERVICE_MONETIZATION_HARD_RULES = [
  'Every listed AGID/AOID service has a free baseline.',
  'A paid feature must be tied to unavoidable hosting, compute, external pass-through fees, legal retention, SLA, private deployment, or human operations.',
  'A paid feature must have a free local or self-hosted fallback whenever the protocol can reasonably support one.',
  'Never charge for user consent review, user revocation, revocation, deletion, export, local AGID generation, local AGID decode, local AGID-S decryption, local address display, language tabs, postal-code autocomplete, basic address validation, QR/NFC intake, basic POS, offline queue, basic receipt, Address Element, redaction, no-raw-address tests, security fixes, security patches, public test vectors, or high-risk privacy controls.',
  'Do not make paid features the only path for warning, rejection, needs-review, revocation, used-state, or privacy-safe receipt decisions.',
];

export const SERVICE_MONETIZATION_BOUNDARY_ENTRIES: ServiceMonetizationBoundaryEntry[] = [
  {
    serviceId: 'agid-resolver-service',
    label: 'AGID Resolver Service',
    defaultAccess: 'free',
    freeScope: ['AGID generation', 'AGID decode', 'AGID reverse lookup', 'local address display', 'address display', 'place-name search', 'local/self-hosted indexes'],
    paidOnlyWhen: [
      {
        id: 'hosted-high-volume-resolver',
        label: 'Hosted high-volume resolver endpoint',
        reason: 'hosted-infrastructure-cost',
        chargeOnlyFor: ['hosted cache operations', 'traffic beyond community limits', 'SLA-backed uptime', 'managed index updates'],
        freeFallback: 'Use the local resolver, self-hosted indexes, or operator-imported data packs.',
      },
    ],
    neverChargeFor: ['local AGID generation', 'local AGID decode', 'test vectors', 'basic reverse display', 'language tab rendering'],
    privacyGuardrail: 'Hosted resolver inputs should use redaction or commitments for high-risk contexts.',
  },
  {
    serviceId: 'address-validation-service',
    label: 'Address Validation Service',
    defaultAccess: 'free',
    freeScope: ['postal-code assist', 'postal-code autocomplete', 'country address rules', 'basic address validation', 'delivery feasibility decision state', 'quality decision mapping'],
    paidOnlyWhen: [
      {
        id: 'managed-official-source-maintenance',
        label: 'Managed official-source maintenance',
        reason: 'sla-support-cost',
        chargeOnlyFor: ['official-source monitoring', 'carrier-rule operations', 'curated update delivery', 'enterprise validation support'],
        freeFallback: 'Use bundled rules, self-hosted source packs, and operator-imported official datasets.',
      },
    ],
    neverChargeFor: ['basic validation', 'basic address validation', 'postal-code autocomplete', 'partial/needs-review states', 'user correction flow', 'internal quality status mapping'],
    privacyGuardrail: 'Expose action states to users, not raw internal quality scores or private address signals.',
  },
  {
    serviceId: 'agid-address-element',
    label: 'AGID Address Element',
    defaultAccess: 'free',
    freeScope: ['Address Element embeddable UI', 'embeddable address input', 'postal-code assist', 'AGID assist', 'language tabs', 'AddressIntent events'],
    paidOnlyWhen: [
      {
        id: 'managed-merchant-integration',
        label: 'Managed merchant integration support',
        reason: 'sla-support-cost',
        chargeOnlyFor: ['implementation support', 'enterprise checkout certification', 'custom anti-abuse rule packs'],
        freeFallback: 'Use the OSS component, OpenAPI, test vectors, and self-hosted examples.',
      },
    ],
    neverChargeFor: ['Address Element', 'embeddable UI', 'privacy-safe host events', 'basic address correction', 'AGID and postal assist'],
    privacyGuardrail: 'Host events must not contain raw AOID, AGID-S payload, proof code, or recipient secret.',
  },
  {
    serviceId: 'agid-pos-terminal',
    label: 'AGID POS Terminal',
    defaultAccess: 'free',
    freeScope: ['QR/NFC intake', 'basic POS', 'AGID-S local decrypt', 'waybill QR intake', 'recipient proof check', 'delivery handoff', 'basic receipt', 'offline queue'],
    paidOnlyWhen: [
      {
        id: 'managed-pos-fleet',
        label: 'Managed POS fleet operations',
        reason: 'hosted-infrastructure-cost',
        chargeOnlyFor: ['remote terminal fleet monitoring', 'certified device profiles', 'managed sync', 'long-term audit retention'],
        freeFallback: 'Use local POS, local diagnostics, local receipts, and deferred offline sync.',
      },
    ],
    neverChargeFor: ['local scan', 'local decrypt', 'local AGID-S decryption', 'local receipt', 'basic receipt', 'offline queue', 'basic POS', 'basic warning/reject/needs-review states'],
    privacyGuardrail: 'POS receipts store commitments, device signatures, and state, not raw QR/NFC payloads.',
  },
  {
    serviceId: 'address-portal',
    label: 'Address Portal',
    defaultAccess: 'free',
    freeScope: ['user consent review', 'consent review', 'scope display', 'revocation', 'deletion', 'export', 'connection management'],
    paidOnlyWhen: [
      {
        id: 'managed-organization-privacy-workflow',
        label: 'Managed organization privacy workflow',
        reason: 'sla-support-cost',
        chargeOnlyFor: ['enterprise deletion ticketing', 'organization notifications', 'audit-certified export bundles'],
        freeFallback: 'Users can still revoke, delete, and export from the local/self-hosted portal.',
      },
    ],
    neverChargeFor: ['user consent review', 'consent review', 'revoke', 'delete', 'export', 'scope view', 'connection view'],
    privacyGuardrail: 'Portal displays organizations, scopes, aliases, and status without exposing raw address fields.',
  },
  {
    serviceId: 'address-console-dashboard',
    label: 'Address Console / Dashboard',
    defaultAccess: 'free',
    freeScope: ['self-hosted API view', 'webhook configuration', 'terminal overview', 'issuer overview', 'redacted audit logs'],
    paidOnlyWhen: [
      {
        id: 'hosted-enterprise-console',
        label: 'Hosted enterprise console',
        reason: 'hosted-infrastructure-cost',
        chargeOnlyFor: ['multi-tenant hosting', 'RBAC operations', 'API-key operations', 'SLA monitoring', 'long-term log storage'],
        freeFallback: 'Use the self-hosted dashboard, local logs, and local launch checklist.',
      },
    ],
    neverChargeFor: ['redacted event viewing', 'OpenAPI docs', 'webhook signature examples', 'local audit log export', 'no-raw-address tests'],
    privacyGuardrail: 'Dashboard views use commitments, aliases, metrics, and redacted evidence references.',
  },
  {
    serviceId: 'hosted-registry-api',
    label: 'Hosted Registry API',
    defaultAccess: 'free',
    freeScope: ['registry schema', 'self-hosted issuer registry', 'self-hosted revocation registry', 'self-hosted freshness roots', 'self-hosted nullifier/used-state checks'],
    paidOnlyWhen: [
      {
        id: 'public-hosted-registry-operations',
        label: 'Public hosted registry operations',
        reason: 'hosted-infrastructure-cost',
        chargeOnlyFor: ['public uptime', 'traffic', 'abuse protection', 'monitoring', 'incident response', 'operator support'],
        freeFallback: 'Run the registry locally or self-host the same OpenAPI-compatible registry.',
      },
    ],
    neverChargeFor: ['registry schema', 'test fixtures', 'self-host conformance', 'local nullifier validation'],
    privacyGuardrail: 'Registry records are commitments, roots, nullifiers, statuses, and issuer metadata only.',
  },
  {
    serviceId: 'address-review-console',
    label: 'Address Review Console',
    defaultAccess: 'free',
    freeScope: ['needs-review cases', 'rejection reason codes', 'dispute case schema', 'address conflict view', 're-verification workflow'],
    paidOnlyWhen: [
      {
        id: 'managed-human-review',
        label: 'Managed human review operations',
        reason: 'human-review-cost',
        chargeOnlyFor: ['review staffing', 'case SLA', 'dispute escalation', 'organization-specific review policies'],
        freeFallback: 'Self-host the review console and run manual review inside the operator organization.',
      },
    ],
    neverChargeFor: ['reason-code schema', 'local needs-review flow', 'local rejection handling', 'self-hosted disputes'],
    privacyGuardrail: 'Review starts from redacted evidence; raw escalation requires scope, role, and audit reason.',
  },
  {
    serviceId: 'address-evidence-vault',
    label: 'Address Evidence Vault',
    defaultAccess: 'free',
    freeScope: ['local photo/PDF import', 'local OCR candidate editing', 'redaction', 'encrypted local evidence envelope'],
    paidOnlyWhen: [
      {
        id: 'managed-evidence-retention',
        label: 'Managed evidence retention',
        reason: 'legal-retention-cost',
        chargeOnlyFor: ['encrypted cloud storage', 'managed OCR compute', 'legal hold', 'retention policy operations', 'audit export support'],
        freeFallback: 'Use local encrypted evidence envelopes and operator-managed storage.',
      },
    ],
    neverChargeFor: ['local import', 'local redaction', 'redaction', 'editable OCR candidates', 'local encrypted envelope format'],
    privacyGuardrail: 'Evidence is local/encrypted by default and redacted before any managed sync.',
  },
  {
    serviceId: 'address-radar-signal',
    label: 'Address Radar / Signal',
    defaultAccess: 'free',
    freeScope: ['basic fraud rules', 'QR age rule', 'nullifier reuse rule', 'device trust rule', 'quality review rule', 'reason-code output'],
    paidOnlyWhen: [
      {
        id: 'managed-risk-operations',
        label: 'Managed risk operations',
        reason: 'human-review-cost',
        chargeOnlyFor: ['merchant/carrier tuning', 'managed rule monitoring', 'risk analyst review', 'large-scale abuse response'],
        freeFallback: 'Use OSS rules, local reason codes, and self-hosted review workflows.',
      },
    ],
    neverChargeFor: ['basic safety rules', 'high-risk privacy controls', 'explainable reason codes', 'local block/review/pass decision', 'QR reuse detection rule'],
    privacyGuardrail: 'Risk signals must be explainable and derived from redacted events by default.',
  },
  {
    serviceId: 'managed-zk-proof-service',
    label: 'Managed ZK Proof Service',
    defaultAccess: 'free',
    freeScope: ['baseline circuits', 'public signal schema', 'self-host prover path', 'verifier fixtures', 'proof compatibility tests'],
    paidOnlyWhen: [
      {
        id: 'managed-prover-capacity',
        label: 'Managed prover capacity',
        reason: 'zk-compute-cost',
        chargeOnlyFor: ['proof queue operations', 'GPU/CPU prover capacity', 'prover uptime', 'verifier deployment support', 'proof SLA'],
        freeFallback: 'Generate proofs locally or run a self-hosted prover using the public circuits.',
      },
    ],
    neverChargeFor: ['circuit source', 'public signal schema', 'verifier fixtures', 'self-host prover instructions'],
    privacyGuardrail: 'Witnesses and private inputs never enter logs, public signals, or public chain payloads.',
  },
  {
    serviceId: 'payment-settlement-carrier-label-service',
    label: 'Payment / Settlement / Carrier Label Service',
    defaultAccess: 'free',
    freeScope: ['payment intent model', 'prepaid/collect-on-delivery state model', 'escrow interface schema', 'waybill QR format', 'carrier label intent schema'],
    paidOnlyWhen: [
      {
        id: 'payment-and-carrier-pass-through',
        label: 'Payment, escrow, and carrier pass-through operations',
        reason: 'external-pass-through-cost',
        chargeOnlyFor: ['payment network fees', 'escrow operations', 'carrier label API fees', 'settlement reconciliation', 'carrier integration support'],
        freeFallback: 'Use local payment status records, manual carrier label workflows, and open waybill QR formats.',
      },
    ],
    neverChargeFor: ['waybill QR schema', 'local receipt state', 'carrier intent format', 'redacted payment receipt model'],
    privacyGuardrail: 'Payment and label records use payment commitments, short aliases, receipt hashes, and public status.',
  },
];

export function getServiceMonetizationBoundary(): ServiceMonetizationBoundary {
  return {
    version: SERVICE_MONETIZATION_BOUNDARY_VERSION,
    principle: 'All AGID/AOID services have a free baseline; charge only for unavoidable hosted infrastructure, external pass-through fees, heavy compute, legal retention, SLA, private deployment, or human operations.',
    entries: SERVICE_MONETIZATION_BOUNDARY_ENTRIES.map(entry => ({
      ...entry,
      freeScope: [...entry.freeScope],
      paidOnlyWhen: entry.paidOnlyWhen.map(exception => ({
        ...exception,
        chargeOnlyFor: [...exception.chargeOnlyFor],
      })),
      neverChargeFor: [...entry.neverChargeFor],
    })),
    hardRules: [...SERVICE_MONETIZATION_HARD_RULES],
  };
}

export function getServiceMonetizationEntry(serviceId: ServiceOfferingId): ServiceMonetizationBoundaryEntry | undefined {
  return getServiceMonetizationBoundary().entries.find(entry => entry.serviceId === serviceId);
}

export function summarizeServiceMonetizationBoundary() {
  const boundary = getServiceMonetizationBoundary();
  const paidExceptionCount = boundary.entries.reduce((total, entry) => total + entry.paidOnlyWhen.length, 0);
  return {
    version: boundary.version,
    services: boundary.entries.length,
    freeDefaultServices: boundary.entries.filter(entry => entry.defaultAccess === 'free').length,
    paidExceptionCount,
    fullyPaidServices: boundary.entries.filter(entry => entry.freeScope.length === 0).length,
    neverChargeItems: boundary.entries.reduce((total, entry) => total + entry.neverChargeFor.length, 0),
  };
}

export function validateServiceMonetizationBoundary(
  boundary = getServiceMonetizationBoundary(),
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const expectedServiceIds = new Set(getOpenCoreProductStrategy().serviceOfferings.map(service => service.id));
  const actualServiceIds = new Set<ServiceOfferingId>();

  for (const entry of boundary.entries) {
    if (actualServiceIds.has(entry.serviceId)) errors.push(`duplicate-service-boundary:${entry.serviceId}`);
    actualServiceIds.add(entry.serviceId);
    if (entry.defaultAccess !== 'free') errors.push(`service-not-free-by-default:${entry.serviceId}`);
    if (!entry.freeScope.length) errors.push(`missing-free-scope:${entry.serviceId}`);
    if (!entry.neverChargeFor.length) errors.push(`missing-never-charge-list:${entry.serviceId}`);
    if (!entry.privacyGuardrail.trim()) errors.push(`missing-privacy-guardrail:${entry.serviceId}`);
    for (const exception of entry.paidOnlyWhen) {
      if (!exception.chargeOnlyFor.length) errors.push(`missing-paid-exception-scope:${entry.serviceId}:${exception.id}`);
      if (!exception.freeFallback.trim()) errors.push(`missing-free-fallback:${entry.serviceId}:${exception.id}`);
    }
  }

  for (const expected of expectedServiceIds) {
    if (!actualServiceIds.has(expected)) errors.push(`missing-service-boundary:${expected}`);
  }
  for (const actual of actualServiceIds) {
    if (!expectedServiceIds.has(actual)) errors.push(`unknown-service-boundary:${actual}`);
  }

  for (const phrase of ['local AGID generation', 'local AGID-S decryption', 'user revocation', 'security patches']) {
    if (!boundary.hardRules.some(rule => rule.includes(phrase))) {
      errors.push(`missing-hard-rule:${phrase}`);
    }
  }

  const fullyPaid = boundary.entries.filter(entry => entry.freeScope.length === 0);
  if (fullyPaid.length) warnings.push(`fully-paid-services:${fullyPaid.map(entry => entry.serviceId).join(',')}`);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

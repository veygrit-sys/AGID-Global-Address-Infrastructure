import {
  buildCarrierLabelIntent,
  CARRIER_LABEL_INTENT_EVIDENCE_TYPES,
  CARRIER_LABEL_INTENT_STATUSES,
  type CarrierLabelIntent,
} from './carrierLabelIntent';
import { sha256Hex } from './sha256';

export const DELIVERY_GATEWAY_CARRIER_API_VERSION = 'delivery-gateway-carrier-api-v0.1';

export type DeliveryGatewayBoundary = 'oss-contract' | 'shared-contract' | 'commercial-managed';
export type DeliveryGatewayActor = 'merchant' | 'developer' | 'carrier' | 'wallet' | 'operator' | 'auditor';
export type DeliveryGatewayObjective = 'fastest' | 'cheapest' | 'balanced' | 'risk-minimized';
export type DeliveryGatewaySurfaceId =
  | 'rate-quote'
  | 'carrier-allocation'
  | 'label-create'
  | 'pickup-schedule'
  | 'tracking-webhook'
  | 'delivery-proof'
  | 'refund-dispute'
  | 'carrier-capability';

export type DeliveryGatewayApiSurface = {
  id: DeliveryGatewaySurfaceId;
  method: 'GET' | 'POST';
  path: string;
  boundary: DeliveryGatewayBoundary;
  actors: DeliveryGatewayActor[];
  purpose: string;
  requiredInputs: string[];
  safeOutputs: string[];
  blockedFields: string[];
  nonClaims: string[];
};

export type CarrierCapability = {
  id: string;
  adapter: 'sandbox' | 'easypost-compatible' | 'carrier-rest-compatible' | 'manual-ops';
  supports: DeliveryGatewaySurfaceId[];
  objectives: DeliveryGatewayObjective[];
  requiresServerSideCredential: true;
  publicClientAllowed: false;
  limitations: string[];
};

export type DeliveryGatewayLifecycleState = {
  id: string;
  label: string;
  mapsToIntentStatuses: string[];
  requiredEvidence: string[];
  safeReceipt: string;
};

export type DeliveryGatewayBuildPlan = {
  packageName: string;
  boundary: DeliveryGatewayBoundary;
  firstReleaseGate: string;
  verificationCommand: string;
  ownedSurfaces: DeliveryGatewaySurfaceId[];
};

export type DeliveryGatewayCarrierApiRegistry = {
  version: typeof DELIVERY_GATEWAY_CARRIER_API_VERSION;
  thesis: string;
  objectives: DeliveryGatewayObjective[];
  apiSurfaces: DeliveryGatewayApiSurface[];
  carrierCapabilities: CarrierCapability[];
  lifecycle: DeliveryGatewayLifecycleState[];
  buildPlan: DeliveryGatewayBuildPlan;
  safety: {
    rawAddressAllowedInMerchantCallback: false;
    carrierCredentialsAllowedInClient: false;
    rawLabelPayloadStored: false;
    proofWitnessStored: false;
  };
  nonClaims: string[];
};

export const DELIVERY_GATEWAY_PRIVATE_MATERIAL_KEYS = [
  'rawAddress',
  'addressLine1',
  'addressLine2',
  'recipientName',
  'recipientPhone',
  'phone',
  'privateDeliveryNotes',
  'carrierApiKey',
  'carrierCredential',
  'commercialRateSecret',
  'rawLabelPayload',
  'proofWitness',
  'privateKey',
  'proofSecret',
  'rawTrackingPayload',
  'rawCarrierPayload',
  'rawQrPayload',
] as const;

export const DELIVERY_GATEWAY_HANDOFF_PREREQUISITE_REFS = [
  'addressAliasRef',
  'walletConsentRef',
  'carrierCapabilityRef',
  'allocationRef',
  'labelRef',
] as const;

export type DeliveryGatewayPrivateMaterialKey = typeof DELIVERY_GATEWAY_PRIVATE_MATERIAL_KEYS[number];
export type DeliveryGatewayHandoffPrerequisiteRef = typeof DELIVERY_GATEWAY_HANDOFF_PREREQUISITE_REFS[number];

export type SandboxCarrierGatewaySmokeInput = {
  merchantRef?: string;
  addressAliasRef?: string;
  addressFormVersion?: string;
  parcelProfileRef?: string;
  walletConsentRef?: string;
  objective?: DeliveryGatewayObjective;
  createdAt?: string;
};

export type SandboxCarrierGatewaySmokeStep = {
  surface: DeliveryGatewaySurfaceId;
  ref: string;
  status: 'passed';
  safeOutputKeys: string[];
};

export type SandboxCarrierGatewaySmokeResult = {
  id: string;
  carrierId: 'sandbox-carrier';
  objective: DeliveryGatewayObjective;
  steps: SandboxCarrierGatewaySmokeStep[];
  labelIntent: CarrierLabelIntent;
  merchantVisible: {
    rateRef: string;
    allocationRef: string;
    labelRef: string;
    trackingReceiptRef: string;
    deliveryProofRef: string;
  };
  blockedMaterial: string[];
  localOnly: true;
  productionTraffic: false;
  rawAddressFixtures: false;
  validationErrors: string[];
};

export type CarrierOnlyHandoffRefInput = {
  carrierAlias?: string;
  addressAliasRef?: string;
  walletConsentRef?: string;
  carrierCapabilityRef?: string;
  allocationRef?: string;
  labelRef?: string;
  trackingReceiptRef?: string;
  deliveryProofRef?: string;
  createdAt?: string;
};

export type CarrierOnlyHandoffRefEvidence = {
  version: typeof DELIVERY_GATEWAY_CARRIER_API_VERSION;
  carrierHandoffRef: string;
  carrierAlias: string;
  visibleTo: 'carrier-adapter-only';
  carrierOnly: true;
  prerequisiteRefs: Record<DeliveryGatewayHandoffPrerequisiteRef, string>;
  merchantVisibleRefs: {
    allocationRef: string;
    labelRef: string;
    trackingReceiptRef?: string;
    deliveryProofRef?: string;
  };
  blockedMaterial: DeliveryGatewayPrivateMaterialKey[];
  localOnly: true;
  productionTraffic: false;
  rawAddressFixtures: false;
  nonClaims: string[];
  validationErrors: string[];
};

export type SkipshipServicePreference = 'fastest' | 'cheapest' | 'balanced';

export type SkipshipShipmentCreateInput = {
  merchantRef?: string;
  recipientId: string;
  addressFormVersion?: string;
  parcelProfileRef: string;
  walletConsentRef: string;
  servicePreference?: SkipshipServicePreference;
  requestedAt?: string;
};

export type SkipshipShipmentCreateResult = {
  shipmentId: string;
  apiVersion: typeof DELIVERY_GATEWAY_CARRIER_API_VERSION;
  developerCall: 'shipping.createShipment';
  status: 'sandbox_label_ready';
  servicePreference: SkipshipServicePreference;
  carrierAlias: 'sandbox-carrier';
  recipientId: string;
  safeRefs: {
    rateRef: string;
    allocationRef: string;
    labelRef: string;
    trackingReceiptRef: string;
    deliveryProofRef: string;
  };
  webhookEvents: string[];
  blockedMaterial: string[];
  localOnly: true;
  productionTraffic: false;
  rawAddressFixtures: false;
  nonClaims: string[];
  validationErrors: string[];
};

export type SkipshipMockRequest = {
  method: 'POST' | string;
  path: string;
  headers?: Record<string, string | undefined>;
  body?: Record<string, unknown>;
};

export type SkipshipMockResponse = {
  status: number;
  body: Record<string, unknown>;
};

export type TrackingWebhookStatus = 'label_created' | 'in_transit' | 'delivered' | 'failed' | 'returned';

export type TrackingWebhookRequest = {
  eventId: string;
  carrierAlias: string;
  trackingAlias: string;
  status: TrackingWebhookStatus;
  occurredAt: string;
};

export type TrackingWebhookSignatureInput = {
  timestamp: string;
  body: TrackingWebhookRequest;
  sandboxSecret?: string;
};

export type TrackingWebhookSignatureVerification = {
  ok: boolean;
  error?: 'missing_signature' | 'malformed_signature' | 'timestamp_mismatch' | 'signature_mismatch';
  eventFingerprint?: string;
};

export const SKIPSHIP_SANDBOX_WEBHOOK_SECRET = 'skipship_sandbox_webhook_secret_v0';

export const DELIVERY_GATEWAY_API_SURFACES: DeliveryGatewayApiSurface[] = [
  {
    id: 'rate-quote',
    method: 'POST',
    path: '/v1/delivery/rates',
    boundary: 'shared-contract',
    actors: ['merchant', 'developer', 'carrier'],
    purpose: 'Return normalized carrier rates and ETA windows from a safe address alias, parcel profile, and delivery constraints.',
    requiredInputs: ['addressAliasRef', 'parcelProfileRef', 'objective', 'requestedServiceLevels'],
    safeOutputs: ['rateRef', 'carrierAlias', 'serviceLevel', 'priceQuote', 'etaWindow', 'capabilityWarnings'],
    blockedFields: ['rawAddress', 'recipientName', 'phone', 'carrierApiKey', 'proofWitness'],
    nonClaims: ['Rate quote does not reserve capacity or prove deliverability.', 'ETA is a bounded estimate, not a guaranteed arrival time.'],
  },
  {
    id: 'carrier-allocation',
    method: 'POST',
    path: '/v1/delivery/allocate',
    boundary: 'commercial-managed',
    actors: ['merchant', 'wallet', 'operator'],
    purpose: 'Choose fastest, cheapest, balanced, or risk-minimized carrier option under wallet and merchant policy.',
    requiredInputs: ['rateRef', 'walletConsentRef', 'objective', 'merchantPolicyRef'],
    safeOutputs: ['allocationRef', 'selectedCarrierAlias', 'objective', 'selectionReasonCodes'],
    blockedFields: ['rawAddress', 'unscopedDecryptMaterial', 'carrierCredential', 'privatePolicyBody'],
    nonClaims: ['Cheapest or fastest choice can be blocked by policy, carrier capability, or risk.', 'Allocation is not a label purchase.'],
  },
  {
    id: 'label-create',
    method: 'POST',
    path: '/v1/delivery/labels',
    boundary: 'commercial-managed',
    actors: ['merchant', 'carrier', 'operator'],
    purpose: 'Create a label or QR handoff through a server-side carrier adapter after carrier acceptance.',
    requiredInputs: ['allocationRef', 'carrierAcceptanceRef', 'labelFormat', 'handoffPolicyRef'],
    safeOutputs: ['labelRef', 'waybillAlias', 'labelQrCommitment', 'carrierReceiptRef'],
    blockedFields: ['rawLabelPayload', 'rawQrPayload', 'carrierApiKey', 'recipientPhone'],
    nonClaims: ['Label reference is not proof of delivery.', 'Raw carrier label payload is not stored in OSS fixtures.'],
  },
  {
    id: 'pickup-schedule',
    method: 'POST',
    path: '/v1/delivery/pickups',
    boundary: 'commercial-managed',
    actors: ['merchant', 'carrier', 'operator'],
    purpose: 'Schedule pickup, locker, PUDO, counter, or field handoff using carrier capability constraints.',
    requiredInputs: ['labelRef', 'pickupWindow', 'handoffPoint', 'carrierCapabilityRef'],
    safeOutputs: ['pickupRef', 'handoffPointAlias', 'scheduledWindow', 'carrierInstructionRef'],
    blockedFields: ['doorCode', 'recipientPhone', 'rawAddress', 'privateAccessNotes'],
    nonClaims: ['Pickup scheduling does not guarantee first-attempt success.', 'Private access notes require a separate scoped channel.'],
  },
  {
    id: 'tracking-webhook',
    method: 'POST',
    path: '/v1/delivery/webhooks/tracking',
    boundary: 'shared-contract',
    actors: ['carrier', 'operator', 'auditor'],
    purpose: 'Receive signed carrier tracking events and convert them to redacted lifecycle receipts.',
    requiredInputs: ['eventId', 'carrierAlias', 'trackingAlias', 'status', 'signature'],
    safeOutputs: ['trackingReceiptRef', 'eventFingerprint', 'status', 'nextAction'],
    blockedFields: ['rawTrackingPayload', 'rawAddress', 'recipientName', 'phone', 'carrierSecret'],
    nonClaims: ['Tracking event is carrier-reported evidence, not final proof of delivery by itself.'],
  },
  {
    id: 'delivery-proof',
    method: 'POST',
    path: '/v1/delivery/proofs',
    boundary: 'commercial-managed',
    actors: ['carrier', 'wallet', 'operator', 'auditor'],
    purpose: 'Attach delivery proof receipt, QR scan, recipient proof, terminal receipt, or POD commitment.',
    requiredInputs: ['labelRef', 'proofType', 'receiptRef', 'signature', 'revocationStatus'],
    safeOutputs: ['deliveryProofRef', 'proofLevel', 'receiptFingerprint', 'redactedAuditStatus'],
    blockedFields: ['proofWitness', 'rawPODImage', 'recipientBiometric', 'privateKey'],
    nonClaims: ['Proof receipt does not reveal the recipient identity by default.', 'A disputed proof may require manual review.'],
  },
  {
    id: 'refund-dispute',
    method: 'POST',
    path: '/v1/delivery/disputes',
    boundary: 'commercial-managed',
    actors: ['merchant', 'carrier', 'operator', 'auditor'],
    purpose: 'Open refund, failed delivery, damaged parcel, lost shipment, or SLA dispute using redacted evidence references.',
    requiredInputs: ['shipmentRef', 'reasonCode', 'evidenceRefs', 'claimAmount'],
    safeOutputs: ['disputeRef', 'state', 'requiredNextEvidence', 'settlementImpactRef'],
    blockedFields: ['rawEvidenceBody', 'rawAddress', 'proofWitness', 'cardPan', 'bankAccount', 'privateConversation'],
    nonClaims: ['Dispute creation does not determine liability.', 'Financial settlement belongs behind regulated commercial operations.'],
  },
  {
    id: 'carrier-capability',
    method: 'GET',
    path: '/v1/delivery/carriers/{carrierAlias}/capabilities',
    boundary: 'oss-contract',
    actors: ['developer', 'merchant', 'carrier'],
    purpose: 'Expose safe carrier capability metadata for sandboxing, feature detection, and integration planning.',
    requiredInputs: ['carrierAlias', 'countryHint', 'serviceLevelHint'],
    safeOutputs: ['capabilityRef', 'supportedSurfaces', 'objectives', 'limitations'],
    blockedFields: ['carrierApiKey', 'commercialRateSecret', 'privateContractTerms'],
    nonClaims: ['Capability metadata is not a live carrier contract.', 'OSS capability fixtures are not production carrier credentials.'],
  },
];

export const DELIVERY_GATEWAY_CARRIER_CAPABILITIES: CarrierCapability[] = [
  {
    id: 'sandbox-carrier',
    adapter: 'sandbox',
    supports: ['rate-quote', 'carrier-allocation', 'label-create', 'tracking-webhook', 'delivery-proof', 'carrier-capability'],
    objectives: ['fastest', 'cheapest', 'balanced', 'risk-minimized'],
    requiresServerSideCredential: true,
    publicClientAllowed: false,
    limitations: ['Synthetic only', 'No production traffic', 'No real labels'],
  },
  {
    id: 'parcel-rest-carrier',
    adapter: 'carrier-rest-compatible',
    supports: ['rate-quote', 'carrier-allocation', 'label-create', 'pickup-schedule', 'tracking-webhook', 'delivery-proof', 'refund-dispute', 'carrier-capability'],
    objectives: ['fastest', 'cheapest', 'balanced'],
    requiresServerSideCredential: true,
    publicClientAllowed: false,
    limitations: ['Feature set varies by carrier', 'Server-side adapter required', 'Carrier contract required'],
  },
  {
    id: 'manual-ops-carrier',
    adapter: 'manual-ops',
    supports: ['carrier-allocation', 'pickup-schedule', 'tracking-webhook', 'delivery-proof', 'refund-dispute', 'carrier-capability'],
    objectives: ['balanced', 'risk-minimized'],
    requiresServerSideCredential: true,
    publicClientAllowed: false,
    limitations: ['Manual review required', 'No automatic label purchase', 'Useful for early private deployments'],
  },
];

export const DELIVERY_GATEWAY_LIFECYCLE: DeliveryGatewayLifecycleState[] = [
  {
    id: 'quoted',
    label: 'Rates quoted',
    mapsToIntentStatuses: ['requires_carrier_acceptance'],
    requiredEvidence: ['address-verification', 'agid-aoid-check'],
    safeReceipt: 'rateRef and capabilityWarnings',
  },
  {
    id: 'allocated',
    label: 'Carrier allocated',
    mapsToIntentStatuses: ['requires_carrier_acceptance'],
    requiredEvidence: ['carrier-policy-check'],
    safeReceipt: 'allocationRef and selectionReasonCodes',
  },
  {
    id: 'label-ready',
    label: 'Label or QR ready',
    mapsToIntentStatuses: ['requires_label_qr', 'label_qr_ready'],
    requiredEvidence: ['carrier-acceptance', 'label-qr-issued'],
    safeReceipt: 'labelRef and labelQrCommitment',
  },
  {
    id: 'in-transit',
    label: 'Carrier scan and tracking active',
    mapsToIntentStatuses: ['handoff_ready'],
    requiredEvidence: ['carrier-scan', 'webhook-event', 'freshness-check'],
    safeReceipt: 'trackingReceiptRef',
  },
  {
    id: 'completed-or-disputed',
    label: 'Delivery proof, completion, refund, or dispute',
    mapsToIntentStatuses: ['completed', 'requires_review', 'rejected'],
    requiredEvidence: ['recipient-proof', 'terminal-receipt', 'revocation-check'],
    safeReceipt: 'deliveryProofRef or disputeRef',
  },
];

export function buildDeliveryGatewayCarrierApiRegistry(): DeliveryGatewayCarrierApiRegistry {
  return {
    version: DELIVERY_GATEWAY_CARRIER_API_VERSION,
    thesis:
      'Delivery Gateway is a Stripe-like carrier integration layer: merchants and apps call one safe API for rates, carrier allocation, labels, tracking, proof, refunds, and disputes while carrier credentials and private address material stay server-side.',
    objectives: ['fastest', 'cheapest', 'balanced', 'risk-minimized'],
    apiSurfaces: DELIVERY_GATEWAY_API_SURFACES,
    carrierCapabilities: DELIVERY_GATEWAY_CARRIER_CAPABILITIES,
    lifecycle: DELIVERY_GATEWAY_LIFECYCLE,
    buildPlan: {
      packageName: 'vey-commerce-delivery',
      boundary: 'commercial-managed',
      firstReleaseGate: 'Sandbox carrier supports rate, allocation, label, tracking, proof, and capability surfaces with no raw address fixtures.',
      verificationCommand: 'npm run verify:delivery-gateway-carrier-api',
      ownedSurfaces: ['rate-quote', 'carrier-allocation', 'label-create', 'tracking-webhook', 'delivery-proof', 'carrier-capability'],
    },
    safety: {
      rawAddressAllowedInMerchantCallback: false,
      carrierCredentialsAllowedInClient: false,
      rawLabelPayloadStored: false,
      proofWitnessStored: false,
    },
    nonClaims: [
      'Delivery Gateway is not a guarantee that every carrier supports every feature.',
      'Carrier API Stripe is an adapter contract and managed operations layer, not a public client-side carrier credential store.',
      'Rate quotes, tracking events, and labels are evidence states, not proof of final delivery by themselves.',
      'OSS fixtures must remain synthetic and must not send production carrier traffic.',
    ],
  };
}

export function validateDeliveryGatewayCarrierApiRegistry(
  registry = buildDeliveryGatewayCarrierApiRegistry(),
): string[] {
  const errors: string[] = [];
  const surfaceIds = new Set(registry.apiSurfaces.map(surface => surface.id));
  const intentStatuses = new Set(CARRIER_LABEL_INTENT_STATUSES);
  const evidenceTypes = new Set(CARRIER_LABEL_INTENT_EVIDENCE_TYPES);

  for (const required of [
    'rate-quote',
    'carrier-allocation',
    'label-create',
    'tracking-webhook',
    'delivery-proof',
    'refund-dispute',
    'carrier-capability',
  ] satisfies DeliveryGatewaySurfaceId[]) {
    if (!surfaceIds.has(required)) errors.push(`missing-surface:${required}`);
  }

  for (const surface of registry.apiSurfaces) {
    if (surface.blockedFields.length === 0) errors.push(`surface-missing-blocked-fields:${surface.id}`);
    if (surface.nonClaims.length === 0) errors.push(`surface-missing-non-claims:${surface.id}`);
    if (surface.safeOutputs.length === 0) errors.push(`surface-missing-safe-outputs:${surface.id}`);
    if (surface.blockedFields.some(field => /carrierApiKey|carrierCredential|proofWitness|rawAddress/i.test(field)) === false) {
      errors.push(`surface-missing-core-private-blocker:${surface.id}`);
    }
  }

  for (const carrier of registry.carrierCapabilities) {
    if (!carrier.requiresServerSideCredential) errors.push(`carrier-missing-server-credential-boundary:${carrier.id}`);
    if (carrier.publicClientAllowed) errors.push(`carrier-allows-public-client:${carrier.id}`);
    for (const surface of carrier.supports) {
      if (!surfaceIds.has(surface)) errors.push(`carrier-unknown-surface:${carrier.id}:${surface}`);
    }
  }

  for (const state of registry.lifecycle) {
    if (state.mapsToIntentStatuses.some(status => !intentStatuses.has(status as never))) {
      errors.push(`lifecycle-unknown-intent-status:${state.id}`);
    }
    if (state.requiredEvidence.some(evidence => !evidenceTypes.has(evidence as never))) {
      errors.push(`lifecycle-unknown-evidence:${state.id}`);
    }
  }

  if (!registry.objectives.includes('fastest')) errors.push('missing-fastest-objective');
  if (!registry.objectives.includes('cheapest')) errors.push('missing-cheapest-objective');
  if (registry.safety.rawAddressAllowedInMerchantCallback !== false) errors.push('merchant-callback-raw-address-not-blocked');
  if (registry.safety.carrierCredentialsAllowedInClient !== false) errors.push('client-carrier-credentials-not-blocked');
  if (!registry.nonClaims.some(nonClaim => /not a guarantee that every carrier supports every feature/i.test(nonClaim))) {
    errors.push('missing-carrier-feature-non-claim');
  }

  return errors;
}

function ref(prefix: string, value: unknown) {
  return `${prefix}_${sha256Hex(JSON.stringify(value, Object.keys(value as object).sort())).slice(0, 24)}`;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (!value || typeof value !== 'object') return JSON.stringify(value);
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(',')}}`;
}

function normalizeObjective(value: unknown): DeliveryGatewayObjective {
  return value === 'fastest' || value === 'cheapest' || value === 'risk-minimized' ? value : 'balanced';
}

function normalizeServicePreference(value: unknown): SkipshipServicePreference {
  return value === 'fastest' || value === 'cheapest' ? value : 'balanced';
}

function collectPayloadKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(collectPayloadKeys);
  const record = value as Record<string, unknown>;
  return [
    ...Object.keys(record),
    ...Object.values(record).flatMap(collectPayloadKeys),
  ];
}

function containsPrivateMaterialKey(value: unknown): boolean {
  const keys = new Set(collectPayloadKeys(value));
  return DELIVERY_GATEWAY_PRIVATE_MATERIAL_KEYS.some(key => keys.has(key));
}

function containsPrivateMaterialMarker(value: unknown): boolean {
  const text = JSON.stringify(value);
  return DELIVERY_GATEWAY_PRIVATE_MATERIAL_KEYS.some(key => text.includes(key));
}

export function validateCarrierOnlyHandoffRefEvidence(evidence: CarrierOnlyHandoffRefEvidence): string[] {
  const errors: string[] = [];

  if (!/^carrier_handoff_[0-9a-f]{24}$/.test(evidence.carrierHandoffRef)) {
    errors.push('carrier-handoff-ref-pattern-mismatch');
  }
  if (evidence.visibleTo !== 'carrier-adapter-only') errors.push('carrier-handoff-visibility-mismatch');
  if (evidence.carrierOnly !== true) errors.push('carrier-handoff-not-carrier-only');
  if (evidence.localOnly !== true) errors.push('carrier-handoff-not-local-only');
  if (evidence.productionTraffic !== false) errors.push('carrier-handoff-production-traffic-not-false');
  if (evidence.rawAddressFixtures !== false) errors.push('carrier-handoff-raw-address-fixtures-not-false');

  for (const prerequisite of DELIVERY_GATEWAY_HANDOFF_PREREQUISITE_REFS) {
    const value = evidence.prerequisiteRefs[prerequisite];
    if (typeof value !== 'string' || value.trim().length === 0) {
      errors.push(`carrier-handoff-prerequisite-missing:${prerequisite}`);
    }
  }

  if ('carrierHandoffRef' in (evidence.merchantVisibleRefs as Record<string, unknown>)) {
    errors.push('carrier-handoff-ref-merchant-visible');
  }
  if (containsPrivateMaterialKey(evidence.merchantVisibleRefs)) {
    errors.push('carrier-handoff-merchant-visible-private-material-key');
  }
  if (containsPrivateMaterialMarker(evidence.prerequisiteRefs)) {
    errors.push('carrier-handoff-prerequisite-private-material-marker');
  }

  for (const key of DELIVERY_GATEWAY_PRIVATE_MATERIAL_KEYS) {
    if (!evidence.blockedMaterial.includes(key)) errors.push(`carrier-handoff-blocked-material-missing:${key}`);
  }

  if (!evidence.nonClaims.some(nonClaim => /not raw address or recipient contact material/i.test(nonClaim))) {
    errors.push('carrier-handoff-missing-private-material-non-claim');
  }

  return errors;
}

export function buildCarrierOnlyHandoffRefEvidence(
  input: CarrierOnlyHandoffRefInput = {},
): CarrierOnlyHandoffRefEvidence {
  const createdAt = input.createdAt ?? '2026-07-03T00:00:00.000Z';
  const carrierAlias = input.carrierAlias ?? 'sandbox-carrier';
  const prerequisiteRefs: Record<DeliveryGatewayHandoffPrerequisiteRef, string> = {
    addressAliasRef: input.addressAliasRef ?? 'addr_alias_handoff_synthetic_only',
    walletConsentRef: input.walletConsentRef ?? 'consent_handoff_synthetic_only',
    carrierCapabilityRef: input.carrierCapabilityRef ?? 'carrier_capability_handoff_synthetic_only',
    allocationRef: input.allocationRef ?? 'alloc_handoff_synthetic_only',
    labelRef: input.labelRef ?? 'label_handoff_synthetic_only',
  };
  const merchantVisibleRefs = {
    allocationRef: prerequisiteRefs.allocationRef,
    labelRef: prerequisiteRefs.labelRef,
    trackingReceiptRef: input.trackingReceiptRef ?? 'tracking_receipt_handoff_synthetic_only',
    deliveryProofRef: input.deliveryProofRef ?? 'delivery_proof_handoff_synthetic_only',
  };
  const evidence: CarrierOnlyHandoffRefEvidence = {
    version: DELIVERY_GATEWAY_CARRIER_API_VERSION,
    carrierHandoffRef: ref('carrier_handoff', { carrierAlias, createdAt, ...prerequisiteRefs }),
    carrierAlias,
    visibleTo: 'carrier-adapter-only',
    carrierOnly: true,
    prerequisiteRefs,
    merchantVisibleRefs,
    blockedMaterial: [...DELIVERY_GATEWAY_PRIVATE_MATERIAL_KEYS],
    localOnly: true,
    productionTraffic: false,
    rawAddressFixtures: false,
    nonClaims: [
      'carrierHandoffRef is a server-side adapter reference, not a merchant-visible receipt.',
      'carrierHandoffRef is not raw address or recipient contact material.',
      'Carrier-only handoff evidence is synthetic and does not purchase a live label.',
    ],
    validationErrors: [],
  };

  return {
    ...evidence,
    validationErrors: validateCarrierOnlyHandoffRefEvidence(evidence),
  };
}

function rejectSkipshipPrivateMaterial(request: SkipshipMockRequest): SkipshipMockResponse | undefined {
  const keys = new Set(collectPayloadKeys(request.body));
  const rejectedKeys = DELIVERY_GATEWAY_PRIVATE_MATERIAL_KEYS.filter(key => keys.has(key));
  if (rejectedKeys.length === 0) return undefined;

  return {
    status: 400,
    body: {
      ok: false,
      error: 'private_material_rejected',
      rejectedKeys,
      message: 'Skipship mock accepts recipient, parcel, consent, and policy refs only.',
    },
  };
}

export function signTrackingWebhookSandbox(input: TrackingWebhookSignatureInput): string {
  const secret = input.sandboxSecret ?? SKIPSHIP_SANDBOX_WEBHOOK_SECRET;
  const digest = sha256Hex(`${secret}.${input.timestamp}.${stableJson(input.body)}`);
  return `t=${input.timestamp},v1=${digest}`;
}

export function verifyTrackingWebhookSignature(
  signature: string | undefined,
  input: TrackingWebhookSignatureInput,
): TrackingWebhookSignatureVerification {
  if (!signature) return { ok: false, error: 'missing_signature' };

  const expected = signTrackingWebhookSandbox(input);
  const match = signature.match(/^t=([0-9]+),v1=([A-Fa-f0-9]{64})$/);
  if (!match) return { ok: false, error: 'malformed_signature' };
  if (match[1] !== input.timestamp) return { ok: false, error: 'timestamp_mismatch' };
  if (signature !== expected) return { ok: false, error: 'signature_mismatch' };

  return {
    ok: true,
    eventFingerprint: ref('evtfp', {
      eventId: input.body.eventId,
      carrierAlias: input.body.carrierAlias,
      trackingAlias: input.body.trackingAlias,
      status: input.body.status,
      occurredAt: input.body.occurredAt,
    }),
  };
}

export function runSandboxCarrierGatewaySmoke(
  input: SandboxCarrierGatewaySmokeInput = {},
): SandboxCarrierGatewaySmokeResult {
  const createdAt = input.createdAt ?? '2026-07-03T00:00:00.000Z';
  const objective = normalizeObjective(input.objective);
  const merchantRef = input.merchantRef ?? 'merchant_demo';
  const addressAliasRef = input.addressAliasRef ?? 'addr_alias_demo';
  const addressFormVersion = input.addressFormVersion ?? 'wallet_country_form_ref_demo';
  const parcelProfileRef = input.parcelProfileRef ?? 'parcel_profile_demo';
  const walletConsentRef = input.walletConsentRef ?? 'consent_demo';
  const smokeSeed = { merchantRef, addressAliasRef, addressFormVersion, parcelProfileRef, walletConsentRef, objective, createdAt };
  const rateRef = ref('rate', { ...smokeSeed, surface: 'rate-quote' });
  const allocationRef = ref('alloc', { rateRef, walletConsentRef, objective });
  const carrierAcceptanceRef = ref('carrier_receipt', { allocationRef, carrierId: 'sandbox-carrier' });
  const labelRef = ref('label', { allocationRef, carrierAcceptanceRef });
  const trackingReceiptRef = ref('tracking_receipt', { labelRef, status: 'in-transit' });
  const deliveryProofRef = ref('delivery_proof', { labelRef, trackingReceiptRef, status: 'completed' });
  const labelQrCommitment = ref('labelqr', { labelRef, format: 'qr' });

  const labelIntent = buildCarrierLabelIntent({
    carrier: {
      carrierId: 'sandbox-carrier',
      adapter: 'carrier-rest-compatible',
      externalRateRef: rateRef,
      externalShipmentRef: allocationRef,
      externalTrackingRef: trackingReceiptRef,
      externalLabelRef: labelRef,
      carrierReceiptRef: carrierAcceptanceRef,
      webhookEventRef: trackingReceiptRef,
      acceptanceStatus: 'accepted',
      plaintextShipmentRequired: false,
    },
    label: {
      waybillAlias: labelRef,
      waybillCommitment: ref('waybill_cmt', { labelRef }),
      labelQrCommitment,
      labelFormat: 'qr',
    },
    evidence: [
      { type: 'address-verification', status: 'passed', safeFingerprint: ref('addr_cmt', { addressAliasRef }) },
      { type: 'agid-aoid-check', status: 'passed', safeFingerprint: ref('agid_aoid_cmt', { addressAliasRef }) },
      { type: 'carrier-policy-check', status: 'passed', receiptRef: ref('policy_receipt', { objective }), signed: true },
      { type: 'carrier-acceptance', status: 'passed', receiptRef: carrierAcceptanceRef, signed: true },
      { type: 'label-qr-issued', status: 'passed', safeFingerprint: labelQrCommitment },
      { type: 'carrier-scan', status: 'passed', receiptRef: trackingReceiptRef, signed: true },
      { type: 'webhook-event', status: 'passed', receiptRef: trackingReceiptRef, signed: true },
      { type: 'freshness-check', status: 'passed', safeFingerprint: ref('freshness_cmt', { trackingReceiptRef }) },
      { type: 'recipient-proof', status: 'passed', safeFingerprint: ref('recipient_proof_cmt', { deliveryProofRef }) },
      { type: 'terminal-receipt', status: 'passed', receiptRef: deliveryProofRef, signed: true },
      { type: 'revocation-check', status: 'passed', safeFingerprint: ref('revocation_cmt', { deliveryProofRef }) },
    ],
    recipientProofRequired: true,
    createdAt,
    updatedAt: createdAt,
  });

  const steps: SandboxCarrierGatewaySmokeStep[] = [
    { surface: 'rate-quote', ref: rateRef, status: 'passed', safeOutputKeys: ['rateRef', 'carrierAlias', 'etaWindow'] },
    { surface: 'carrier-allocation', ref: allocationRef, status: 'passed', safeOutputKeys: ['allocationRef', 'selectedCarrierAlias', 'selectionReasonCodes'] },
    { surface: 'label-create', ref: labelRef, status: 'passed', safeOutputKeys: ['labelRef', 'waybillAlias', 'labelQrCommitment'] },
    { surface: 'tracking-webhook', ref: trackingReceiptRef, status: 'passed', safeOutputKeys: ['trackingReceiptRef', 'eventFingerprint', 'nextAction'] },
    { surface: 'delivery-proof', ref: deliveryProofRef, status: 'passed', safeOutputKeys: ['deliveryProofRef', 'proofLevel', 'receiptFingerprint'] },
  ];

  return {
    id: ref('sandbox_gateway_smoke', smokeSeed),
    carrierId: 'sandbox-carrier',
    objective,
    steps,
    labelIntent,
    merchantVisible: {
      rateRef,
      allocationRef,
      labelRef,
      trackingReceiptRef,
      deliveryProofRef,
    },
    blockedMaterial: ['rawAddress', 'recipientName', 'phone', 'carrierApiKey', 'rawLabelPayload', 'proofWitness'],
    localOnly: true,
    productionTraffic: false,
    rawAddressFixtures: false,
    validationErrors: validateDeliveryGatewayCarrierApiRegistry(),
  };
}

export function createSkipshipShipment(input: SkipshipShipmentCreateInput): SkipshipShipmentCreateResult {
  const servicePreference = normalizeServicePreference(input.servicePreference);
  const smoke = runSandboxCarrierGatewaySmoke({
    merchantRef: input.merchantRef ?? 'skipship_merchant_demo',
    addressAliasRef: input.recipientId,
    addressFormVersion: input.addressFormVersion,
    parcelProfileRef: input.parcelProfileRef,
    walletConsentRef: input.walletConsentRef,
    objective: servicePreference,
    createdAt: input.requestedAt,
  });

  return {
    shipmentId: ref('ship', {
      recipientId: input.recipientId,
      parcelProfileRef: input.parcelProfileRef,
      walletConsentRef: input.walletConsentRef,
      servicePreference,
    }),
    apiVersion: DELIVERY_GATEWAY_CARRIER_API_VERSION,
    developerCall: 'shipping.createShipment',
    status: 'sandbox_label_ready',
    servicePreference,
    carrierAlias: smoke.carrierId,
    recipientId: input.recipientId,
    safeRefs: smoke.merchantVisible,
    webhookEvents: [
      'shipment.created',
      'shipment.rated',
      'shipment.label_created',
      'shipment.in_transit',
      'shipment.delivered',
    ],
    blockedMaterial: smoke.blockedMaterial,
    localOnly: true,
    productionTraffic: false,
    rawAddressFixtures: false,
    nonClaims: [
      'Skipship sandbox shipment is not a production carrier purchase.',
      'recipientId is an address-wallet or shipping identity reference, not raw address material.',
      'Cheapest or fastest routing is a policy objective, not a guaranteed carrier SLA.',
    ],
    validationErrors: smoke.validationErrors,
  };
}

function createMockRateQuote(body: Record<string, unknown>): SkipshipMockResponse {
  if (
    typeof body.addressAliasRef !== 'string'
    || typeof body.parcelProfileRef !== 'string'
    || typeof body.objective !== 'string'
    || !Array.isArray(body.requestedServiceLevels)
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        error: 'bad_request',
        message: 'addressAliasRef, parcelProfileRef, objective, and requestedServiceLevels are required.',
      },
    };
  }

  const objective = normalizeObjective(body.objective);
  const serviceLevel = typeof body.requestedServiceLevels[0] === 'string' ? body.requestedServiceLevels[0] : 'standard';
  const rateRef = ref('rate', {
    addressAliasRef: body.addressAliasRef,
    parcelProfileRef: body.parcelProfileRef,
    objective,
    serviceLevel,
  });

  return {
    status: 200,
    body: {
      rateRef,
      carrierAlias: 'sandbox-carrier',
      serviceLevel,
      objective,
      etaWindow: {
        earliest: '2026-07-04T09:00:00.000Z',
        latest: '2026-07-05T18:00:00.000Z',
      },
      priceQuote: {
        amount: objective === 'cheapest' ? 499 : 799,
        currency: 'USD',
      },
      capabilityWarnings: [
        'Synthetic sandbox quote only',
        'Rate quote does not reserve live carrier capacity',
      ],
    },
  };
}

function createMockCarrierAllocation(body: Record<string, unknown>): SkipshipMockResponse {
  if (
    typeof body.rateRef !== 'string'
    || typeof body.walletConsentRef !== 'string'
    || typeof body.objective !== 'string'
    || typeof body.merchantPolicyRef !== 'string'
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        error: 'bad_request',
        message: 'rateRef, walletConsentRef, objective, and merchantPolicyRef are required.',
      },
    };
  }

  const objective = normalizeObjective(body.objective);
  return {
    status: 200,
    body: {
      allocationRef: ref('alloc', {
        rateRef: body.rateRef,
        walletConsentRef: body.walletConsentRef,
        objective,
        merchantPolicyRef: body.merchantPolicyRef,
      }),
      selectedCarrierAlias: 'sandbox-carrier',
      objective,
      selectionReasonCodes: [
        `objective_${objective}`,
        'wallet_consent_ref_present',
        'sandbox_capability_match',
      ],
    },
  };
}

export function handleSkipshipMockRequest(request: SkipshipMockRequest): SkipshipMockResponse {
  const privateMaterialRejection = rejectSkipshipPrivateMaterial(request);
  if (privateMaterialRejection) return privateMaterialRejection;

  if (request.path !== '/v1/shipments' && request.path !== '/v1/delivery/rates' && request.path !== '/v1/delivery/allocate') {
    return {
      status: 404,
      body: {
        ok: false,
        error: 'not_found',
        path: request.path,
      },
    };
  }

  if (request.method !== 'POST') {
    return {
      status: 405,
      body: {
        ok: false,
        error: 'method_not_allowed',
        method: request.method,
      },
    };
  }

  if (!request.headers?.authorization?.startsWith('Bearer pk_test_')) {
    return {
      status: 401,
      body: {
        ok: false,
        error: 'auth_required',
        message: 'Skipship sandbox mock requires a test publishable key.',
      },
    };
  }

  const body = request.body ?? {};
  if (request.path === '/v1/delivery/rates') return createMockRateQuote(body);
  if (request.path === '/v1/delivery/allocate') return createMockCarrierAllocation(body);

  if (
    typeof body.recipientId !== 'string'
    || typeof body.parcelProfileRef !== 'string'
    || typeof body.walletConsentRef !== 'string'
  ) {
    return {
      status: 400,
      body: {
        ok: false,
        error: 'bad_request',
        message: 'recipientId, parcelProfileRef, and walletConsentRef are required.',
      },
    };
  }

  return {
    status: 201,
    body: createSkipshipShipment({
      merchantRef: typeof body.merchantRef === 'string' ? body.merchantRef : undefined,
      recipientId: body.recipientId,
      addressFormVersion: typeof body.addressFormVersion === 'string' ? body.addressFormVersion : undefined,
      parcelProfileRef: body.parcelProfileRef,
      walletConsentRef: body.walletConsentRef,
      servicePreference: normalizeServicePreference(body.servicePreference),
      requestedAt: typeof body.requestedAt === 'string' ? body.requestedAt : undefined,
    }) as unknown as Record<string, unknown>,
  };
}

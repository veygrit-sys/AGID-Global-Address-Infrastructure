import {
  buildAddressLoginMerchantIntegration,
  type AddressLoginMerchantSetupPreflight,
} from './addressLoginSpec';
import {
  buildCarrierConnectorLayerPlan,
  runCarrierCapabilityPreflight,
  type CarrierCapabilityPreflightResponse,
  type CarrierConnectorId,
} from './carrierConnectorLayer';
import {
  buildDeliveryGatewayCarrierApiRegistry,
  DELIVERY_GATEWAY_CARRIER_API_VERSION,
  type DeliveryGatewayApiSurface,
} from './deliveryGatewayCarrierApi';
import {
  buildHexashipDeliveryGatewayPlan,
  preflightHexashipMvpV01Shipment,
  type HexashipMvpV01Preflight,
  type HexashipMvpV01Result,
} from './hexashipDeliveryGateway';
import { sha256Hex } from './sha256';
import {
  SKIPSHIP_COMMERCE_INTEGRATION_PLACEMENTS,
  type SkipshipCommerceIntegrationPlacement,
} from './skipshipStripeStrategy';
import { createInMemorySkipshipWebhookEventStore, type SkipshipWebhookEventStoreResult } from './skipshipWebhookEventStore';

export const MERCHANT_CONSOLE_EC_PLUGIN_VERSION = 'merchant-console-ec-plugin-v0.1';

export type MerchantEcPlatformId = 'shopify-like' | 'woocommerce' | 'ec-cube' | 'custom-ec';
export type MerchantConsoleSurfaceId =
  | 'carrier-selection'
  | 'shipment-history'
  | 'webhook-history'
  | 'plugin-settings'
  | 'redaction-policy'
  | 'vey-id-adoption';
export type MerchantIntegrationModeId = 'hosted-checkout-widget' | 'rest-api' | 'sdk' | 'plugin';
export type MerchantOnboardingStepId =
  | 'merchant-account'
  | 'store-ec-platform'
  | 'shipping-preferences'
  | 'address-wallet-settings'
  | 'api-keys-webhooks';

export type MerchantIntegrationMode = {
  id: MerchantIntegrationModeId;
  title: string;
  target: string;
  primaryInstallArtifact: string;
  requiredRefs: string[];
  blockedMaterial: string[];
};

export type MerchantCommerceIntegrationChoice = {
  id: SkipshipCommerceIntegrationPlacement['id'] | 'both';
  title: string;
  purpose: string;
  installTargets: SkipshipCommerceIntegrationPlacement['installTarget'][];
  startPoints: SkipshipCommerceIntegrationPlacement['startPoint'][];
  productQuestions: SkipshipCommerceIntegrationPlacement['productQuestion'][];
  loginButtonRequiredToShop: boolean | 'mixed';
  continueWithVeygritRequired: boolean | 'mixed';
  addressWalletReuse: SkipshipCommerceIntegrationPlacement['addressWalletReuse'][];
  requiredSetupRefs: string[];
  merchantVisibleRefs: string[];
  safeOutputs: string[];
  blockedMaterial: string[];
};

export type MerchantOnboardingField = {
  id: string;
  label: string;
  required: boolean;
  dataKind: 'business_profile' | 'store_profile' | 'shipping_policy' | 'wallet_policy' | 'security_ref';
  options?: string[];
  secretHandling?: 'never_collect' | 'server_side_only' | 'ref_only';
};

export type MerchantOnboardingFieldGroup = {
  title: string;
  fields: MerchantOnboardingField[];
};

export type MerchantOnboardingStep = {
  id: MerchantOnboardingStepId;
  title: string;
  purpose: string;
  fieldGroups: MerchantOnboardingFieldGroup[];
  completionGate: string;
  safeOutputRefs: string[];
  blockedMaterial: string[];
};

export type MerchantApiKeyPolicy = {
  keyRefs: Array<'test_publishable_key_ref' | 'test_secret_key_ref' | 'live_publishable_key_ref' | 'live_secret_key_ref'>;
  defaultMode: 'test';
  serverSidePrimary: true;
  publishableKeyScope: 'hosted_widget_only';
  liveKeysBlockedUntil: string[];
  rotationActions: string[];
  blockedMaterial: string[];
};

export type MerchantWebhookSetup = {
  requiredUrlScheme: 'https';
  events: string[];
  retryPolicy: {
    mode: 'exponential_backoff';
    maxAttempts: number;
  };
  testSendButton: true;
  signatureSecretHandling: 'stored_as_ref_only';
  blockedMaterial: string[];
};

export type MerchantProductionReviewGate = {
  id: string;
  label: string;
  required: boolean;
};

export type MerchantEcPluginProfile = {
  id: MerchantEcPlatformId;
  displayName: string;
  integrationMode: 'app-embed' | 'wordpress-plugin' | 'php-plugin' | 'typescript-sdk';
  primaryAudience: 'merchant-admin' | 'developer';
  installSurface: string;
  sdkPackage: string;
  requiredRefs: string[];
  blockedStorage: string[];
  releaseGate: string[];
};

export type MerchantConsoleSurface = {
  id: MerchantConsoleSurfaceId;
  title: string;
  purpose: string;
  visibleColumns: string[];
  hiddenByDefault: string[];
  actions: string[];
};

export type MerchantConsoleVeyIdAdoptionCheck = {
  id: 'vey-id-core-adoption';
  title: 'Vey ID Core adoption check';
  status: 'ready';
  accountCreationProviders: Array<'google' | 'apple'>;
  requiredSdkPackages: string[];
  requiredSpecs: string[];
  requiredRoutes: string[];
  requiredControls: string[];
  merchantVisibleRefs: string[];
  browserOnlyRefs: string[];
  serverOnlyRefs: string[];
  walletRevocationRefs: string[];
  blockedMaterial: string[];
  verifierCommands: string[];
  localOnly: true;
  productionTraffic: false;
};

export type MerchantShipmentHistoryRow = {
  shipmentRef: string;
  orderRef: string;
  recipientDisplayRef: string;
  carrierAlias: CarrierConnectorId | 'auto';
  servicePreference: 'fastest' | 'cheapest' | 'balanced';
  status: 'created' | 'rated' | 'label_created' | 'in_transit' | 'delivered' | 'exception' | 'return_created';
  labelRef?: string;
  trackingAlias?: string;
  walletConsentRef: string;
  carrierCapabilityRef: string;
  createdAt: string;
  blockedMaterial: string[];
};

export type MerchantWebhookHistoryRow = {
  eventRef: string;
  eventType: 'shipment.created' | 'rates.created' | 'label.created' | 'shipment.in_transit' | 'shipment.delivered' | 'return.created';
  status: 'ok' | 'retrying' | 'failed' | 'expired';
  attemptCount: number;
  lastAttemptAt: string;
  nextRetryAt?: string;
  safeRefs: string[];
  blockedMaterial: string[];
};

export type MerchantConsoleEcPluginPlan = {
  version: typeof MERCHANT_CONSOLE_EC_PLUGIN_VERSION;
  productName: 'Merchant Console / EC Plugin';
  thesis: string;
  integrationModes: MerchantIntegrationMode[];
  commerceIntegrationChoices: MerchantCommerceIntegrationChoice[];
  onboardingSteps: MerchantOnboardingStep[];
  apiKeyPolicy: MerchantApiKeyPolicy;
  webhookSetup: MerchantWebhookSetup;
  productionReviewGates: MerchantProductionReviewGate[];
  ecCreateShipmentExample: {
    sdkCall: string;
    hiddenBackendPipeline: string[];
    merchantVisibleRefs: string[];
    merchantHiddenMaterial: string[];
  };
  pluginProfiles: MerchantEcPluginProfile[];
  surfaces: MerchantConsoleSurface[];
  veyIdAdoptionCheck: MerchantConsoleVeyIdAdoptionCheck;
  carrierOptions: Array<{
    carrier: CarrierConnectorId | 'auto';
    label: string;
    availableInMvp: boolean;
    selectionModes: Array<'fastest' | 'cheapest' | 'balanced'>;
  }>;
  sampleShipmentHistory: MerchantShipmentHistoryRow[];
  sampleWebhookHistory: MerchantWebhookHistoryRow[];
  redactionPolicy: {
    addressVisibleByDefault: false;
    merchantStoresRecipientId: true;
    publicRowsUseRefsOnly: true;
    blockedMaterial: string[];
  };
  validationGates: string[];
  nonClaims: string[];
};

export type MerchantShipmentCreationReadinessInput = {
  orderRef?: string;
  recipientDisplayRef?: string;
  recipientId?: string;
  addressFormVersion?: string;
  parcelProfileRef?: string;
  walletConsentRef?: string;
  carrierCapabilityRef?: string;
  carrierAlias?: CarrierConnectorId | 'auto';
  servicePreference?: 'fastest' | 'cheapest' | 'balanced';
  [key: string]: unknown;
};

export type MerchantShipmentCreationReadiness = {
  version: typeof MERCHANT_CONSOLE_EC_PLUGIN_VERSION;
  orderRef: string;
  canCreateShipment: boolean;
  status:
    | 'ready_for_hexaship_createShipment'
    | 'blocked_missing_address_wallet_preflight'
    | 'blocked_missing_carrier_capability'
    | 'blocked_private_material';
  disabledActions: string[];
  missingRefs: string[];
  rejectedKeys: string[];
  safeRefs: {
    recipientId?: string;
    recipientDisplayRef?: string;
    addressFormVersion?: string;
    parcelProfileRef?: string;
    walletConsentRef?: string;
    carrierCapabilityRef?: string;
  };
  servicePreference: 'fastest' | 'cheapest' | 'balanced';
  nextStep: 'run_address_wallet_preflight' | 'run_carrier_capability_preflight' | 'call_hexaship_createShipment' | 'remove_private_material';
  gatewayPreflight: HexashipMvpV01Preflight;
  blockedMaterial: string[];
  localOnly: true;
  productionTraffic: false;
};

export type MerchantConsoleLocalHexashipShipmentRecord = {
  idempotencyKey: string;
  duplicateClickCount: number;
  result: HexashipMvpV01Result;
};

export type MerchantConsoleDeliveryGatewayCarrierCapabilitySurface = {
  apiVersion: typeof DELIVERY_GATEWAY_CARRIER_API_VERSION;
  id: 'carrier-capability';
  path: string;
  boundary: DeliveryGatewayApiSurface['boundary'];
  safeOutputs: string[];
  blockedFields: string[];
  nonClaims: string[];
  productionCarrierAvailabilityClaim: false;
};

export type MerchantConsoleCarrierCapabilityPreflight = {
  orderRef: string;
  connectorId: 'dhl' | 'ups';
  countryCode: string;
  response: CarrierCapabilityPreflightResponse;
  carrierCapabilityRef?: string;
  deliveryGatewayCarrierCapabilitySurface: MerchantConsoleDeliveryGatewayCarrierCapabilitySurface;
  requiredNextAction: 'apply_carrierCapabilityRef' | 'run_address_wallet_preflight' | 'connector_not_active' | 'remove_private_material';
  localOnly: true;
  productionTraffic: false;
};

export type MerchantConsoleGuidedShipmentStep = {
  orderRef: string;
  currentStep: 'run_capability_preflight' | 'create_shipment' | 'repair_address_wallet_refs' | 'remove_private_material';
  primaryAction: 'Capability preflight' | 'Create shipment' | 'Address Wallet preflight' | 'Remove private material';
  helperText: string;
  canRunCapabilityPreflight: boolean;
  canCreateShipment: boolean;
  localOnly: true;
  productionTraffic: false;
};

export type MerchantConsoleLocalHexashipRequestFixture = {
  method: 'POST';
  path: '/v1/hexaship/mvp-v0.1/shipments';
  sdkRequestOptions: {
    idempotencyKey: string;
  };
  headers: {
    'idempotency-key': string;
    'x-hexaship-local-only': 'true';
  };
  bodyRefs: {
    merchantRef: string;
    ecOrderRef: string;
    recipientId: string;
    addressFormVersion: string;
    parcelProfileRef: string;
    walletConsentRef: string;
    carrierCapabilityRef: string;
    selectionMode: 'fastest' | 'cheapest';
    selectedBy: 'ec' | 'user';
  };
  forbiddenPublicMaterial: string[];
  productionTraffic: false;
};

export type MerchantConsoleLocalHexashipReplayPreview = {
  idempotencyKey: string;
  replayed: boolean;
  replayStatus: 'not_replayed_yet' | 'would_replay_same_request';
  duplicateClickCount: number;
  routePath: MerchantConsoleLocalHexashipRequestFixture['path'];
  safeReplayRef: string;
  productionTraffic: false;
};

export type MerchantConsoleLocalHexashipIdempotencyLedgerRow = {
  shipmentRef: string;
  ecOrderRef: string;
  idempotencyKey: string;
  createReplayStatus: MerchantConsoleLocalHexashipReplayPreview['replayStatus'];
  webhookReplayStatus: 'not_replayed_yet' | 'accepted_exact_replay' | 'conflict_if_payload_changes';
  duplicateClickCount: number;
  webhookEventCount: number;
  latestWebhookEventRef: string;
  latestWebhookStatus: string;
  safeWebhookReplayRef: string;
  selectedCarrier: string;
  addressExposure: 'ref_only';
  productionTraffic: false;
};

export type MerchantConsoleLocalHexashipWebhookReplayFixture = {
  latestWebhookEventRef: string;
  safeBodyFingerprintRef: string;
  safeConflictFingerprintRef: string;
  acceptedReplayKind: SkipshipWebhookEventStoreResult['kind'];
  conflictReplayKind: SkipshipWebhookEventStoreResult['kind'];
  acceptedResponseStatus: number;
  conflictResponseStatus: number;
  privateMaterialExposed: false;
  productionTraffic: false;
};

export type MerchantConsoleOnboardingMockRequest = {
  merchantAccount?: {
    displayName?: string;
    adminUserRef?: string;
    businessProfileRef?: string;
    billingProfileRef?: string;
    twoFactorEnabled?: boolean;
  };
  storeEcPlatform?: {
    storeRef?: string;
    platformStoreRef?: string;
    platform?: MerchantEcPlatformId;
    orderSchemaRef?: string;
    addressLoginClientRef?: string;
    addressLoginCallbackUrl?: string;
  };
  shippingPreferences?: {
    carrierPolicyRef?: string;
    enabledCarriers?: Array<'dhl' | 'ups'>;
    selectionRule?: 'cheapest' | 'fastest' | 'balanced' | 'merchant-manual' | 'user-choice';
    parcelProfileRefs?: string[];
  };
  addressWalletSettings?: {
    walletPolicyRef?: string;
    recipientApprovalPolicyRef?: string;
    addressFormVersionRef?: string;
    carrierSpecificAddressShapeBlocked?: boolean;
    hideAddressFromBuyer?: boolean;
    friendDeliveryEnabled?: boolean;
    addressWalletLoginEnabled?: boolean;
    qrRailPolicyRef?: string;
  };
  apiKeysAndWebhooks?: {
    apiKeySetRef?: string;
    testPublishableKeyRef?: string;
    testSecretKeyRef?: string;
    webhookEndpointRef?: string;
    webhookEventRefs?: string[];
    productionReviewRef?: string;
  };
  [key: string]: unknown;
};

export type MerchantConsoleOnboardingMockResult =
  | {
      ok: true;
      status: 201;
      onboardingRef: string;
      merchantRef: string;
      safeOutputRefs: string[];
      requiredNextAction: 'issue_test_keys' | 'run_sandbox_shipment' | 'submit_limited_production_review';
      walletBoundary: {
        addressFormVersionRef: string;
        carrierSpecificAddressShapeBlocked: true;
        rawAddressVisibleToEc: false;
        carrierSpecificAddressShapeCollectedByEc: false;
      };
      addressLoginBoundary: {
        addressLoginClientRef: string;
        addressLoginCallbackUrl: string;
        addressLoginCallbackPreflightRef: string;
        callbackContractVersion: AddressLoginMerchantSetupPreflight['callbackContractVersion'];
        callbackUrlHttps: boolean;
        forbiddenCallbackParamsAbsent: boolean;
        preflightChecks: AddressLoginMerchantSetupPreflight['checks'];
        testVectorCommand: AddressLoginMerchantSetupPreflight['testVectorCommand'];
        rawAddressCallbackBlocked: true;
      };
      blockedMaterial: string[];
      localOnly: true;
      productionTraffic: false;
    }
  | {
      ok: false;
      status: 400;
      error: 'private_material_rejected' | 'missing_wallet_form_boundary' | 'missing_address_login_boundary';
      rejectedKeys: string[];
      missingRefs: string[];
      blockedMaterial: string[];
      localOnly: true;
      productionTraffic: false;
    };

export type MerchantConsoleOnboardingFixtureContractInput = {
  request?: {
    storeEcPlatform?: {
      addressLoginClientRef?: string;
      addressLoginCallbackUrl?: string;
    };
    shippingPreferences?: {
      enabledCarriers?: string[];
    };
    addressWalletSettings?: {
      addressFormVersionRef?: string;
      carrierSpecificAddressShapeBlocked?: boolean;
    };
  };
  expected?: {
    requiredWalletBoundaryFields?: string[];
    safeOutputRefs?: string[];
    forbiddenPublicMaterial?: string[];
    nonClaims?: string[];
  };
};

export type MerchantConsoleOnboardingFixtureContract = {
  enabledCarriers: Array<'dhl' | 'ups'>;
  addressLoginClientRef: string | null;
  addressLoginCallbackUrl: string | null;
  addressLoginCallbackPreflightRef: string | null;
  callbackContractVersion: AddressLoginMerchantSetupPreflight['callbackContractVersion'] | null;
  callbackPreflightChecks: AddressLoginMerchantSetupPreflight['checks'];
  addressFormVersionRef: string | null;
  carrierSpecificAddressShapeBlocked: boolean;
  requiredWalletBoundaryFields: string[];
  safeOutputRefs: string[];
  forbiddenPublicMaterial: string[];
  nonClaims: string[];
  sdkCopyLabel: string;
  sdkCopyLocalOnly: true;
  sdkCopyProductionTraffic: false;
  rawAddressVisibleToEc: false;
  carrierSpecificAddressShapeCollectedByEc: false;
};

export type MerchantConsoleOnboardingOpenApiContractStatus = {
  path: '/v1/merchant-console/onboarding';
  fixture: 'docs/specs/fixtures/merchant-console-onboarding-v0.1.json';
  verifier: 'npm run verify:merchant-console-ec-plugin';
  contractState: 'README / fixture / OpenAPI aligned';
  enabledCarriers: Array<'dhl' | 'ups'>;
  addressLoginClientRef: string | null;
  addressLoginCallbackPreflightRef: string | null;
  callbackContractVersion: AddressLoginMerchantSetupPreflight['callbackContractVersion'] | null;
  callbackPreflightPassed: boolean;
  addressFormVersionRef: string | null;
  requiredWalletBoundaryFields: string[];
  safetyFlags: string[];
};

export type MerchantConsoleOnboardingOpenApiContractCopyPayload = {
  label: 'Merchant onboarding OpenAPI contract';
  buttonLabel: 'Copy contract';
  successLabel: 'Copied contract';
  clipboardText: string;
  localOnly: true;
  productionTraffic: false;
};

export type MerchantConsoleCallbackPreflightRepairAction = {
  checkId: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  primaryAction:
    | 'no_repair_needed'
    | 'replace_with_https_callback_url'
    | 'pin_callback_contract_version'
    | 'remove_forbidden_callback_params'
    | 'run_synthetic_test_vectors';
  helperText: string;
  safeInputRef: string;
  testVectorIds: string[];
  blocksLiveMode: boolean;
};

export type MerchantConsoleCallbackPreflightNegativeFixture = {
  fixtureId: 'merchant-console-callback-preflight-negative-v0.1';
  addressLoginClientRef: string;
  callbackUrl: string;
  expectedError: 'missing_address_login_boundary';
  expectedMissingRefs: string[];
  expectedFailingCheckIds: string[];
  forbiddenParams: string[];
  forbiddenValueParamRefs: string[];
  callbackValidationVectorIds: string[];
  repairActionIds: MerchantConsoleCallbackPreflightRepairAction['primaryAction'][];
  exportCommand: 'npm run verify:merchant-console-ec-plugin';
  blockedMaterial: string[];
  nonClaims: string[];
  localOnly: true;
  productionTraffic: false;
};

const MERCHANT_CONSOLE_CALLBACK_HOSTED_VALIDATION_VECTOR_IDS = [
  'callback_forbidden_param_negative',
  'callback_forbidden_value_negative',
] as const;

function merchantConsoleCallbackRepairVectorIds(preflight: AddressLoginMerchantSetupPreflight) {
  return uniqueStrings([
    ...preflight.testVectorIds.filter(vectorId => vectorId.includes('forbidden')),
    ...MERCHANT_CONSOLE_CALLBACK_HOSTED_VALIDATION_VECTOR_IDS,
  ]);
}

function merchantConsoleCallbackValidationVectorIds() {
  return [...MERCHANT_CONSOLE_CALLBACK_HOSTED_VALIDATION_VECTOR_IDS];
}

export type MerchantConsoleLocalHexashipLedgerLayoutAudit = {
  rowCount: number;
  usesCompactSummaryGrid: true;
  maxSummaryColumns: 4;
  requiresWrappedRefs: true;
  requiredVisibleFields: string[];
  requiredWrappedRefFields: string[];
  privateMaterialExposed: false;
  productionTraffic: false;
};

export type MerchantConsoleClipboardRedactionAuditCandidate = {
  id: string;
  label: string;
  clipboardText: string;
  localOnly: boolean;
  productionTraffic: boolean;
};

export type MerchantConsoleClipboardRedactionAuditEntry = {
  id: string;
  label: string;
  byteLength: number;
  localOnly: boolean;
  productionTraffic: boolean;
  forbiddenValueMarkersFound: string[];
};

export type MerchantConsoleClipboardRedactionAudit = {
  version: typeof MERCHANT_CONSOLE_EC_PLUGIN_VERSION;
  candidateCount: number;
  candidates: MerchantConsoleClipboardRedactionAuditEntry[];
  forbiddenValueMarkers: string[];
  localOnly: boolean;
  productionTraffic: boolean;
  privateMaterialExposed: boolean;
  validationErrors: string[];
};

export type MerchantConsoleClipboardRedactionAuditInput = {
  onboardingFixture: MerchantConsoleOnboardingFixtureContractInput;
  callbackNegativeFixture?: MerchantConsoleCallbackPreflightNegativeFixture;
  localHexashipShipmentRecords?: MerchantConsoleLocalHexashipShipmentRecord[];
};

export const MERCHANT_CONSOLE_BLOCKED_MATERIAL = [
  'rawAddress',
  'addressLine1',
  'addressLine2',
  'recipientName',
  'recipientPhone',
  'phone',
  'privateDeliveryNotes',
  'selectedAddressBody',
  'proofWitness',
  'proofSecret',
  'privateKey',
  'carrierApiKey',
  'carrierCredential',
  'rawCarrierPayload',
  'providerIdToken',
  'providerAccessToken',
  'providerRefreshToken',
  'rawProviderProfile',
  'rawVeyIdToken',
  'webhookSecret',
  'rawWebhookPayload',
  'rawLabelPayload',
] as const;

export const MERCHANT_CONSOLE_CLIPBOARD_FORBIDDEN_VALUE_MARKERS = [
  'rawAddressValue',
  'addressLine1Value',
  'addressLine2Value',
  'recipientNameValue',
  'recipientPhoneValue',
  'phoneValue',
  'privateDeliveryNotesValue',
  'selectedAddressBodyValue',
  'proofWitnessValue',
  'proofSecretValue',
  'privateKeyValue',
  'carrierApiKeyValue',
  'carrierCredentialValue',
  'rawCarrierPayloadValue',
  'providerIdTokenValue',
  'providerAccessTokenValue',
  'providerRefreshTokenValue',
  'rawProviderProfileValue',
  'rawVeyIdTokenValue',
  'webhookSecretValue',
  'rawWebhookPayloadValue',
  'rawLabelPayloadValue',
  'raw_address_value',
  'recipient_phone_value',
  'proof_secret_value',
  'proof_secret_fixture_value',
  'private_key_value',
  'carrier_api_key_value',
  'carrier_credential_value',
  'raw_carrier_payload_value',
  'provider_id_token_value',
  'provider_access_token_value',
  'provider_refresh_token_value',
  'raw_provider_profile_value',
  'webhook_secret_value',
  'raw_webhook_payload_value',
  'raw_label_payload_value',
  'sk_live_',
  'pk_live_',
] as const;

function blockedMaterial() {
  return [...MERCHANT_CONSOLE_BLOCKED_MATERIAL];
}

function findForbiddenClipboardValueMarkers(value: string) {
  const normalized = value.toLowerCase();
  return MERCHANT_CONSOLE_CLIPBOARD_FORBIDDEN_VALUE_MARKERS.filter(marker => (
    normalized.includes(marker.toLowerCase())
  ));
}

export function validateMerchantConsoleClipboardRedactionAudit(
  audit: MerchantConsoleClipboardRedactionAudit,
) {
  const errors: string[] = [];
  if (audit.version !== MERCHANT_CONSOLE_EC_PLUGIN_VERSION) errors.push('clipboard-version-mismatch');
  if (audit.candidateCount !== audit.candidates.length) errors.push('clipboard-candidate-count-mismatch');
  if (audit.candidateCount === 0) errors.push('clipboard-candidates-required');
  if (audit.localOnly !== true) errors.push('clipboard-local-only-required');
  if (audit.productionTraffic !== false) errors.push('clipboard-production-traffic-must-be-false');

  for (const candidate of audit.candidates) {
    const id = candidate.id || 'missing-id';
    if (!candidate.id) errors.push('clipboard-candidate-id-required');
    if (!candidate.label) errors.push(`clipboard-label-required:${id}`);
    if (candidate.byteLength <= 0) errors.push(`clipboard-text-required:${id}`);
    if (candidate.localOnly !== true) errors.push(`clipboard-local-only-required:${id}`);
    if (candidate.productionTraffic !== false) errors.push(`clipboard-production-traffic-must-be-false:${id}`);
    for (const marker of candidate.forbiddenValueMarkersFound) {
      errors.push(`clipboard-private-value-marker:${id}:${marker}`);
    }
  }

  if (audit.privateMaterialExposed !== audit.candidates.some(candidate => candidate.forbiddenValueMarkersFound.length > 0)) {
    errors.push('clipboard-private-material-flag-mismatch');
  }

  return errors;
}

export function auditMerchantConsoleClipboardRedaction(
  candidates: MerchantConsoleClipboardRedactionAuditCandidate[],
): MerchantConsoleClipboardRedactionAudit {
  const auditedCandidates = candidates.map(candidate => ({
    id: candidate.id,
    label: candidate.label,
    byteLength: new TextEncoder().encode(candidate.clipboardText).length,
    localOnly: candidate.localOnly,
    productionTraffic: candidate.productionTraffic,
    forbiddenValueMarkersFound: findForbiddenClipboardValueMarkers(candidate.clipboardText),
  }));
  const audit: MerchantConsoleClipboardRedactionAudit = {
    version: MERCHANT_CONSOLE_EC_PLUGIN_VERSION,
    candidateCount: auditedCandidates.length,
    candidates: auditedCandidates,
    forbiddenValueMarkers: [...MERCHANT_CONSOLE_CLIPBOARD_FORBIDDEN_VALUE_MARKERS],
    localOnly: auditedCandidates.every(candidate => candidate.localOnly === true),
    productionTraffic: auditedCandidates.some(candidate => candidate.productionTraffic !== false),
    privateMaterialExposed: auditedCandidates.some(candidate => candidate.forbiddenValueMarkersFound.length > 0),
    validationErrors: [],
  };

  return {
    ...audit,
    validationErrors: validateMerchantConsoleClipboardRedactionAudit(audit),
  };
}

export function buildMerchantConsoleClipboardRedactionAuditCandidates(
  input: MerchantConsoleClipboardRedactionAuditInput,
): MerchantConsoleClipboardRedactionAuditCandidate[] {
  const sdkCopyPayload = buildMerchantConsoleMerchantOnboardingSdkCopyPayload();
  const openApiCopyPayload = buildMerchantConsoleOnboardingOpenApiContractCopyPayload(
    buildMerchantConsoleOnboardingOpenApiContractStatus(input.onboardingFixture),
  );
  const callbackNegativeFixture = input.callbackNegativeFixture ?? buildMerchantConsoleCallbackPreflightNegativeFixture();
  const localHexashipCandidates = (input.localHexashipShipmentRecords ?? []).map(record => {
    const fixture = buildMerchantConsoleLocalHexashipRequestFixture(record);
    return {
      id: `local-hexaship-request-fixture:${record.result.shipment.shipmentRef}`,
      label: 'Local Hexaship request fixture',
      clipboardText: buildMerchantConsoleLocalHexashipRequestFixtureCopyText(fixture),
      localOnly: true,
      productionTraffic: fixture.productionTraffic,
    };
  });

  return [
    {
      id: 'merchant-onboarding-sdk',
      label: sdkCopyPayload.label,
      clipboardText: sdkCopyPayload.clipboardText,
      localOnly: sdkCopyPayload.localOnly,
      productionTraffic: sdkCopyPayload.productionTraffic,
    },
    {
      id: 'merchant-onboarding-openapi-contract',
      label: openApiCopyPayload.label,
      clipboardText: openApiCopyPayload.clipboardText,
      localOnly: openApiCopyPayload.localOnly,
      productionTraffic: openApiCopyPayload.productionTraffic,
    },
    {
      id: 'callback-preflight-negative-fixture',
      label: 'Callback preflight negative fixture',
      clipboardText: buildMerchantConsoleCallbackPreflightNegativeFixtureCopyText(callbackNegativeFixture),
      localOnly: callbackNegativeFixture.localOnly,
      productionTraffic: callbackNegativeFixture.productionTraffic,
    },
    ...localHexashipCandidates,
  ];
}

export function buildMerchantConsoleClipboardRedactionAudit(
  input: MerchantConsoleClipboardRedactionAuditInput,
): MerchantConsoleClipboardRedactionAudit {
  return auditMerchantConsoleClipboardRedaction(buildMerchantConsoleClipboardRedactionAuditCandidates(input));
}

function collectRejectedKeys(value: unknown, path: string[] = []): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap((item, index) => collectRejectedKeys(item, [...path, String(index)]));

  return Object.entries(value).flatMap(([key, nested]) => {
    const fullPath = [...path, key].join('.');
    const rejected = MERCHANT_CONSOLE_BLOCKED_MATERIAL.includes(key as typeof MERCHANT_CONSOLE_BLOCKED_MATERIAL[number])
      ? [fullPath]
      : [];
    return [...rejected, ...collectRejectedKeys(nested, [...path, key])];
  });
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function deterministicMerchantRef(prefix: string, value: unknown) {
  return `${prefix}_${sha256Hex(stableJson(value)).slice(0, 24)}`;
}

function requireCommercePlacement(id: SkipshipCommerceIntegrationPlacement['id']) {
  const placement = SKIPSHIP_COMMERCE_INTEGRATION_PLACEMENTS.find(item => item.id === id);
  if (!placement) throw new Error(`missing commerce integration placement: ${id}`);
  return placement;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}

export function buildMerchantConsoleVeyIdAdoptionCheck(): MerchantConsoleVeyIdAdoptionCheck {
  return {
    id: 'vey-id-core-adoption',
    title: 'Vey ID Core adoption check',
    status: 'ready',
    accountCreationProviders: ['google', 'apple'],
    requiredSdkPackages: [
      '@veygrit/address-login-react',
      '@veygrit/address-login-nextjs',
    ],
    requiredSpecs: [
      'docs/specs/veygrit-id-core.openapi.yaml',
      'docs/specs/veygrit-id-core-v0.1.md',
    ],
    requiredRoutes: [
      'GET /veygrit/oauth/authorize',
      'POST /veygrit/oauth/token',
      'POST /veygrit/connections/revoke',
    ],
    requiredControls: [
      'google-apple-only-account-creation',
      'pkce-s256-required',
      'pairwise-subject-alias',
      'server-side-token-exchange',
      'address-wallet-credential-reuse',
      'wallet-side-revocation',
    ],
    merchantVisibleRefs: [
      'authorizationCodeRef',
      'pairwiseSubjectAlias',
      'walletSessionRef',
      'addressCredentialRef',
      'revocationRef',
    ],
    browserOnlyRefs: [
      'authorizationCodeRef',
      'pairwiseSubjectAlias',
      'walletSessionRef',
    ],
    serverOnlyRefs: [
      'pkceVerifierRef',
      'tokenExchangeRef',
      'accessTokenRef',
      'idTokenRef',
      'addressCredentialRef',
      'revocationRef',
    ],
    walletRevocationRefs: [
      'connectionRef',
      'merchantRef',
      'revocationRef',
    ],
    blockedMaterial: uniqueStrings([
      'providerIdToken',
      'providerAccessToken',
      'providerRefreshToken',
      'rawProviderProfile',
      'rawAddressCredential',
      'rawVeyIdToken',
      ...blockedMaterial(),
    ]),
    verifierCommands: [
      'npm run verify:veygrit-id-core-openapi',
      'npm run verify:veygrit-address-login-react',
      'npm run verify:veygrit-address-login-nextjs',
    ],
    localOnly: true,
    productionTraffic: false,
  };
}

export function buildMerchantCommerceIntegrationChoices(): MerchantCommerceIntegrationChoice[] {
  const playlist = requireCommercePlacement('playlist-commerce');
  const ecSocialLogin = requireCommercePlacement('ec-social-login');

  return [
    {
      id: playlist.id,
      title: playlist.label,
      purpose: 'List the merchant in Veygrit Playlist Commerce so shoppers can discover, save, and choose the store from the wallet app without pressing an EC login button first.',
      installTargets: [playlist.installTarget],
      startPoints: [playlist.startPoint],
      productQuestions: [playlist.productQuestion],
      loginButtonRequiredToShop: playlist.loginButtonRequiredToShop,
      continueWithVeygritRequired: playlist.continueWithVeygritRequired,
      addressWalletReuse: [playlist.addressWalletReuse],
      requiredSetupRefs: ['merchantRef', 'storeRef', 'playlistParticipationRef', 'storePreferenceAlias', 'walletConsentRef'],
      merchantVisibleRefs: ['merchantRef', 'storeRef', 'playlistParticipationRef', 'storePreferenceAlias'],
      safeOutputs: playlist.safeOutputs,
      blockedMaterial: uniqueStrings([...playlist.blockedMaterial, ...blockedMaterial()]),
    },
    {
      id: ecSocialLogin.id,
      title: ecSocialLogin.label,
      purpose: 'Install Continue with Veygrit on the merchant EC checkout so shoppers can reuse Address Wallet addresses and complete purchase flows without retyping address fields.',
      installTargets: [ecSocialLogin.installTarget],
      startPoints: [ecSocialLogin.startPoint],
      productQuestions: [ecSocialLogin.productQuestion],
      loginButtonRequiredToShop: ecSocialLogin.loginButtonRequiredToShop,
      continueWithVeygritRequired: ecSocialLogin.continueWithVeygritRequired,
      addressWalletReuse: [ecSocialLogin.addressWalletReuse],
      requiredSetupRefs: ['merchantRef', 'addressLoginClientRef', 'pairwiseSubjectAlias', 'recipientId', 'walletConsentRef', 'webhookEndpointRef'],
      merchantVisibleRefs: ['pairwiseSubjectAlias', 'recipientId', 'addressCredentialRef', 'walletConsentRef'],
      safeOutputs: ecSocialLogin.safeOutputs,
      blockedMaterial: uniqueStrings([...ecSocialLogin.blockedMaterial, ...blockedMaterial()]),
    },
    {
      id: 'both',
      title: 'Playlist Commerce + EC Social Login',
      purpose: 'Enable Veygrit-side store discovery and EC-side Continue with Veygrit checkout together while keeping their login, consent, and address reuse boundaries separate.',
      installTargets: [playlist.installTarget, ecSocialLogin.installTarget],
      startPoints: [playlist.startPoint, ecSocialLogin.startPoint],
      productQuestions: [playlist.productQuestion, ecSocialLogin.productQuestion],
      loginButtonRequiredToShop: 'mixed',
      continueWithVeygritRequired: 'mixed',
      addressWalletReuse: [playlist.addressWalletReuse, ecSocialLogin.addressWalletReuse],
      requiredSetupRefs: uniqueStrings([
        'merchantRef',
        'storeRef',
        'playlistParticipationRef',
        'storePreferenceAlias',
        'addressLoginClientRef',
        'pairwiseSubjectAlias',
        'recipientId',
        'walletConsentRef',
        'webhookEndpointRef',
      ]),
      merchantVisibleRefs: uniqueStrings([
        'merchantRef',
        'storeRef',
        'playlistParticipationRef',
        'storePreferenceAlias',
        'pairwiseSubjectAlias',
        'recipientId',
        'addressCredentialRef',
        'walletConsentRef',
      ]),
      safeOutputs: uniqueStrings([...playlist.safeOutputs, ...ecSocialLogin.safeOutputs]),
      blockedMaterial: uniqueStrings([...playlist.blockedMaterial, ...ecSocialLogin.blockedMaterial, ...blockedMaterial()]),
    },
  ];
}

function buildMerchantConsoleAddressLoginSetupPreflight(clientRef: string | undefined, callbackUrl: string | undefined) {
  return buildAddressLoginMerchantIntegration({
    clientId: clientRef ?? 'address_login_client_ref_missing',
    redirectUri: callbackUrl ?? 'about:blank',
  }).setupPreflight;
}

export function createMerchantConsoleOnboardingMock(
  request: MerchantConsoleOnboardingMockRequest,
): MerchantConsoleOnboardingMockResult {
  const rejectedKeys = collectRejectedKeys(request);
  if (rejectedKeys.length > 0) {
    return {
      ok: false,
      status: 400,
      error: 'private_material_rejected',
      rejectedKeys,
      missingRefs: [],
      blockedMaterial: blockedMaterial(),
      localOnly: true,
      productionTraffic: false,
    };
  }

  const addressFormVersionRef = request.addressWalletSettings?.addressFormVersionRef;
  const carrierSpecificAddressShapeBlocked = request.addressWalletSettings?.carrierSpecificAddressShapeBlocked;
  const missingRefs = [
    ...(typeof addressFormVersionRef !== 'string' || !/^wallet_country_form_ref_[a-z0-9_:-]+$/.test(addressFormVersionRef)
      ? ['addressWalletSettings.addressFormVersionRef']
      : []),
    ...(carrierSpecificAddressShapeBlocked !== true
      ? ['addressWalletSettings.carrierSpecificAddressShapeBlocked']
      : []),
  ];

  if (missingRefs.length > 0) {
    return {
      ok: false,
      status: 400,
      error: 'missing_wallet_form_boundary',
      rejectedKeys: [],
      missingRefs,
      blockedMaterial: blockedMaterial(),
      localOnly: true,
      productionTraffic: false,
    };
  }
  const safeAddressFormVersionRef = addressFormVersionRef as string;
  const addressLoginClientRef = request.storeEcPlatform?.addressLoginClientRef;
  const addressLoginCallbackUrl = request.storeEcPlatform?.addressLoginCallbackUrl;
  const addressLoginPreflight = buildMerchantConsoleAddressLoginSetupPreflight(addressLoginClientRef, addressLoginCallbackUrl);
  const callbackPreflightPassed = addressLoginPreflight.checks.every(check => check.status === 'pass');
  const addressLoginMissingRefs = [
    ...(typeof addressLoginClientRef !== 'string' || !/^address_login_client_ref_[a-z0-9_:-]+$/.test(addressLoginClientRef)
      ? ['storeEcPlatform.addressLoginClientRef']
      : []),
    ...(typeof addressLoginCallbackUrl !== 'string' || !callbackPreflightPassed
      ? ['storeEcPlatform.addressLoginCallbackPreflight']
      : []),
  ];

  if (addressLoginMissingRefs.length > 0) {
    return {
      ok: false,
      status: 400,
      error: 'missing_address_login_boundary',
      rejectedKeys: [],
      missingRefs: addressLoginMissingRefs,
      blockedMaterial: blockedMaterial(),
      localOnly: true,
      productionTraffic: false,
    };
  }
  const safeAddressLoginClientRef = addressLoginClientRef as string;
  const safeAddressLoginCallbackUrl = addressLoginCallbackUrl as string;
  const addressLoginCallbackPreflightRef = deterministicMerchantRef('address_login_callback_preflight_ref', {
    addressLoginClientRef: safeAddressLoginClientRef,
    addressLoginCallbackUrl: safeAddressLoginCallbackUrl,
    callbackContractVersion: addressLoginPreflight.callbackContractVersion,
  });

  const seed = {
    merchantAccount: request.merchantAccount,
    storeEcPlatform: request.storeEcPlatform,
    shippingPreferences: request.shippingPreferences,
    addressWalletSettings: request.addressWalletSettings,
    apiKeysAndWebhooks: request.apiKeysAndWebhooks,
  };

  return {
    ok: true,
    status: 201,
    onboardingRef: deterministicMerchantRef('merchant_onboarding_ref', seed),
    merchantRef: deterministicMerchantRef('merchant', request.merchantAccount?.displayName ?? seed),
    safeOutputRefs: [
      'merchantRef',
      'storeRef',
      'carrierPolicyRef',
      'walletPolicyRef',
      'addressFormVersionRef',
      'addressLoginClientRef',
      'addressLoginCallbackPreflightRef',
      'apiKeySetRef',
      'webhookEndpointRef',
    ],
    requiredNextAction: 'run_sandbox_shipment',
    walletBoundary: {
      addressFormVersionRef: safeAddressFormVersionRef,
      carrierSpecificAddressShapeBlocked: true,
      rawAddressVisibleToEc: false,
      carrierSpecificAddressShapeCollectedByEc: false,
    },
    addressLoginBoundary: {
      addressLoginClientRef: safeAddressLoginClientRef,
      addressLoginCallbackUrl: safeAddressLoginCallbackUrl,
      addressLoginCallbackPreflightRef,
      callbackContractVersion: addressLoginPreflight.callbackContractVersion,
      callbackUrlHttps: addressLoginPreflight.checks.find(check => check.id === 'callback-url-https')?.status === 'pass',
      forbiddenCallbackParamsAbsent: addressLoginPreflight.checks.find(check => check.id === 'callback-url-forbidden-param-scan')?.status === 'pass',
      preflightChecks: addressLoginPreflight.checks,
      testVectorCommand: addressLoginPreflight.testVectorCommand,
      rawAddressCallbackBlocked: true,
    },
    blockedMaterial: blockedMaterial(),
    localOnly: true,
    productionTraffic: false,
  };
}

export function evaluateMerchantShipmentCreationReadiness(
  input: MerchantShipmentCreationReadinessInput,
): MerchantShipmentCreationReadiness {
  const rejectedKeys = collectRejectedKeys(input);
  const requiredAddressWalletRefs = ['recipientId', 'parcelProfileRef', 'walletConsentRef'] as const;
  const missingAddressWalletRefs = requiredAddressWalletRefs.filter(ref => typeof input[ref] !== 'string' || (input[ref] as string).length === 0);
  const missingCapability = typeof input.carrierCapabilityRef !== 'string' || input.carrierCapabilityRef.length === 0;
  const missingRefs = [...missingAddressWalletRefs, ...(missingCapability ? ['carrierCapabilityRef'] : [])];
  let status: MerchantShipmentCreationReadiness['status'] = 'ready_for_hexaship_createShipment';
  let nextStep: MerchantShipmentCreationReadiness['nextStep'] = 'call_hexaship_createShipment';

  if (rejectedKeys.length > 0) {
    status = 'blocked_private_material';
    nextStep = 'remove_private_material';
  } else if (missingAddressWalletRefs.length > 0) {
    status = 'blocked_missing_address_wallet_preflight';
    nextStep = 'run_address_wallet_preflight';
  } else if (missingCapability) {
    status = 'blocked_missing_carrier_capability';
    nextStep = 'run_carrier_capability_preflight';
  }

  const gatewayPreflight = preflightHexashipMvpV01Shipment({
    merchantRef: 'merchant_demo',
    ecOrderRef: input.orderRef ?? 'order_ref_missing',
    recipientId: input.recipientId,
    parcelProfileRef: input.parcelProfileRef,
    walletConsentRef: input.walletConsentRef,
    carrierCapabilityRef: input.carrierCapabilityRef,
    ...(rejectedKeys.length > 0 ? input : {}),
  });
  const canCreateShipment = status === 'ready_for_hexaship_createShipment' && gatewayPreflight.ok;
  return {
    version: MERCHANT_CONSOLE_EC_PLUGIN_VERSION,
    orderRef: input.orderRef ?? 'order_ref_missing',
    canCreateShipment,
    status,
    disabledActions: canCreateShipment ? [] : ['create-shipment', 'create-label', 'buy-label'],
    missingRefs,
    rejectedKeys,
    safeRefs: {
      recipientId: input.recipientId,
      recipientDisplayRef: input.recipientDisplayRef,
      addressFormVersion: input.addressFormVersion,
      parcelProfileRef: input.parcelProfileRef,
      walletConsentRef: input.walletConsentRef,
      carrierCapabilityRef: input.carrierCapabilityRef,
    },
    servicePreference: input.servicePreference ?? 'cheapest',
    nextStep,
    gatewayPreflight,
    blockedMaterial: blockedMaterial(),
    localOnly: true,
    productionTraffic: false,
  };
}

function buildMerchantConsoleDeliveryGatewayCarrierCapabilitySurface(): MerchantConsoleDeliveryGatewayCarrierCapabilitySurface {
  const surface = buildDeliveryGatewayCarrierApiRegistry().apiSurfaces.find(candidate => candidate.id === 'carrier-capability');
  if (!surface) {
    throw new Error('delivery-gateway-carrier-capability-surface-missing');
  }

  return {
    apiVersion: DELIVERY_GATEWAY_CARRIER_API_VERSION,
    id: 'carrier-capability',
    path: surface.path,
    boundary: surface.boundary,
    safeOutputs: [...surface.safeOutputs],
    blockedFields: [...surface.blockedFields],
    nonClaims: [...surface.nonClaims],
    productionCarrierAvailabilityClaim: false,
  };
}

export function buildMerchantConsoleCarrierCapabilityPreflight(
  readiness: MerchantShipmentCreationReadiness,
  countryCode: string,
  connectorOverride?: 'dhl' | 'ups',
): MerchantConsoleCarrierCapabilityPreflight {
  const connectorId = connectorOverride ?? (readiness.servicePreference === 'fastest' ? 'dhl' : 'ups');
  const response = runCarrierCapabilityPreflight({
    connectorId,
    countryCode,
    recipientId: readiness.safeRefs.recipientId,
    parcelProfileRef: readiness.safeRefs.parcelProfileRef,
    walletConsentRef: readiness.safeRefs.walletConsentRef,
    servicePreference: readiness.servicePreference,
  });

  let requiredNextAction: MerchantConsoleCarrierCapabilityPreflight['requiredNextAction'] = 'run_address_wallet_preflight';
  if (response.ok === true) {
    requiredNextAction = 'apply_carrierCapabilityRef';
  } else if (response.error === 'connector_not_active') {
    requiredNextAction = 'connector_not_active';
  } else if (response.error === 'private_material_rejected') {
    requiredNextAction = 'remove_private_material';
  }

  return {
    orderRef: readiness.orderRef,
    connectorId,
    countryCode: countryCode.trim().toUpperCase(),
    response,
    ...(response.ok ? { carrierCapabilityRef: response.body.carrierCapabilityRef } : {}),
    deliveryGatewayCarrierCapabilitySurface: buildMerchantConsoleDeliveryGatewayCarrierCapabilitySurface(),
    requiredNextAction,
    localOnly: true,
    productionTraffic: false,
  };
}

export function buildMerchantConsoleGuidedShipmentStep(
  readiness: MerchantShipmentCreationReadiness,
  capabilityPreflight?: MerchantConsoleCarrierCapabilityPreflight,
): MerchantConsoleGuidedShipmentStep {
  if (readiness.nextStep === 'remove_private_material') {
    return {
      orderRef: readiness.orderRef,
      currentStep: 'remove_private_material',
      primaryAction: 'Remove private material',
      helperText: 'Remove private address, proof, label, or carrier credential fields before any shipment action.',
      canRunCapabilityPreflight: false,
      canCreateShipment: false,
      localOnly: true,
      productionTraffic: false,
    };
  }

  if (readiness.nextStep === 'run_address_wallet_preflight') {
    return {
      orderRef: readiness.orderRef,
      currentStep: 'repair_address_wallet_refs',
      primaryAction: 'Address Wallet preflight',
      helperText: 'Collect recipientId, parcelProfileRef, and walletConsentRef from Address Wallet before carrier checks.',
      canRunCapabilityPreflight: false,
      canCreateShipment: false,
      localOnly: true,
      productionTraffic: false,
    };
  }

  if (capabilityPreflight?.requiredNextAction === 'apply_carrierCapabilityRef' || readiness.canCreateShipment) {
    return {
      orderRef: readiness.orderRef,
      currentStep: 'create_shipment',
      primaryAction: 'Create shipment',
      helperText: 'Carrier capability is ready; create the local Hexaship sandbox shipment next.',
      canRunCapabilityPreflight: false,
      canCreateShipment: true,
      localOnly: true,
      productionTraffic: false,
    };
  }

  return {
    orderRef: readiness.orderRef,
    currentStep: 'run_capability_preflight',
    primaryAction: 'Capability preflight',
    helperText: 'Run carrier capability preflight to issue a synthetic carrierCapabilityRef for the selected country and carrier.',
    canRunCapabilityPreflight: readiness.nextStep === 'run_carrier_capability_preflight',
    canCreateShipment: false,
    localOnly: true,
    productionTraffic: false,
  };
}

export function buildMerchantConsoleLocalHexashipIdempotencyKey(orderRef: string) {
  return `idem_hexaship_console_${orderRef.replace(/[^a-zA-Z0-9]+/g, '_')}`;
}

export function buildMerchantConsoleMerchantOnboardingSdkSnippet() {
  return `import { createHexashipMerchantOnboardingFetchClient } from '@hexaship/js';

const onboarding = createHexashipMerchantOnboardingFetchClient({
  baseUrl: 'https://hexaship.local',
  publishableKey: 'pk_test_synthetic',
});

await onboarding.createOnboarding({
  merchantAccount: {
    displayName: 'Synthetic Demo Store',
    adminUserRef: 'admin_user_ref_synthetic_001',
    businessProfileRef: 'business_profile_ref_synthetic_001',
    billingProfileRef: 'billing_profile_ref_synthetic_001',
    twoFactorEnabled: true,
  },
  storeEcPlatform: {
    storeRef: 'store_ref_synthetic_001',
    platformStoreRef: 'platform_store_ref_synthetic_shopify_like_001',
    platform: 'shopify-like',
    orderSchemaRef: 'order_schema_ref_synthetic_001',
    addressLoginClientRef: 'address_login_client_ref_synthetic_001',
    addressLoginCallbackUrl: 'https://merchant.example/veygrit/callback',
  },
  shippingPreferences: {
    carrierPolicyRef: 'carrier_policy_ref_synthetic_dhl_ups_001',
    enabledCarriers: ['dhl', 'ups'],
    selectionRule: 'cheapest',
    parcelProfileRefs: ['parcel_profile_ref_small_box'],
  },
  addressWalletSettings: {
    walletPolicyRef: 'wallet_policy_ref_synthetic_001',
    recipientApprovalPolicyRef: 'recipient_approval_policy_ref_required_001',
    addressFormVersionRef: 'wallet_country_form_ref_us_en_v1',
    carrierSpecificAddressShapeBlocked: true,
    hideAddressFromBuyer: true,
    friendDeliveryEnabled: true,
    addressWalletLoginEnabled: true,
    qrRailPolicyRef: 'qr_rail_policy_ref_synthetic_001',
  },
  apiKeysAndWebhooks: {
    apiKeySetRef: 'api_key_set_ref_test_only_001',
    testPublishableKeyRef: 'pk_test_ref_synthetic_001',
    testSecretKeyRef: 'sk_test_ref_synthetic_001',
    webhookEndpointRef: 'webhook_endpoint_ref_synthetic_001',
    webhookEventRefs: ['webhook_event_ref_shipment_created'],
    productionReviewRef: 'production_review_ref_pending_001',
  },
}, { idempotencyKey: 'idem_merchant_onboarding_demo_001' });`;
}

export function buildMerchantConsoleMerchantOnboardingSdkCopyPayload() {
  return {
    label: 'Merchant onboarding SDK',
    clipboardText: buildMerchantConsoleMerchantOnboardingSdkSnippet(),
    buttonLabel: 'Copy SDK',
    successLabel: 'Copied SDK',
    forbiddenPublicMaterial: blockedMaterial(),
    localOnly: true,
    productionTraffic: false,
  } as const;
}

export function buildMerchantConsoleMerchantOnboardingFixtureContract(
  fixture: MerchantConsoleOnboardingFixtureContractInput,
): MerchantConsoleOnboardingFixtureContract {
  const copyPayload = buildMerchantConsoleMerchantOnboardingSdkCopyPayload();
  const storeEcPlatform = fixture.request?.storeEcPlatform;
  const addressWalletSettings = fixture.request?.addressWalletSettings;
  const addressLoginPreflight = buildMerchantConsoleAddressLoginSetupPreflight(
    storeEcPlatform?.addressLoginClientRef,
    storeEcPlatform?.addressLoginCallbackUrl,
  );
  const addressLoginCallbackPreflightRef = storeEcPlatform?.addressLoginClientRef && storeEcPlatform?.addressLoginCallbackUrl
    ? deterministicMerchantRef('address_login_callback_preflight_ref', {
        addressLoginClientRef: storeEcPlatform.addressLoginClientRef,
        addressLoginCallbackUrl: storeEcPlatform.addressLoginCallbackUrl,
        callbackContractVersion: addressLoginPreflight.callbackContractVersion,
      })
    : null;
  return {
    enabledCarriers: (fixture.request?.shippingPreferences?.enabledCarriers ?? []).filter(carrier => (
      carrier === 'dhl' || carrier === 'ups'
    )),
    addressLoginClientRef: storeEcPlatform?.addressLoginClientRef ?? null,
    addressLoginCallbackUrl: storeEcPlatform?.addressLoginCallbackUrl ?? null,
    addressLoginCallbackPreflightRef,
    callbackContractVersion: addressLoginPreflight.callbackContractVersion,
    callbackPreflightChecks: addressLoginPreflight.checks,
    addressFormVersionRef: addressWalletSettings?.addressFormVersionRef ?? null,
    carrierSpecificAddressShapeBlocked: addressWalletSettings?.carrierSpecificAddressShapeBlocked === true,
    requiredWalletBoundaryFields: fixture.expected?.requiredWalletBoundaryFields ?? [],
    safeOutputRefs: fixture.expected?.safeOutputRefs ?? [],
    forbiddenPublicMaterial: fixture.expected?.forbiddenPublicMaterial ?? [],
    nonClaims: fixture.expected?.nonClaims ?? [],
    sdkCopyLabel: copyPayload.label,
    sdkCopyLocalOnly: copyPayload.localOnly,
    sdkCopyProductionTraffic: copyPayload.productionTraffic,
    rawAddressVisibleToEc: false,
    carrierSpecificAddressShapeCollectedByEc: false,
  };
}

export function buildMerchantConsoleOnboardingOpenApiContractStatus(
  fixture: MerchantConsoleOnboardingFixtureContractInput,
): MerchantConsoleOnboardingOpenApiContractStatus {
  const contract = buildMerchantConsoleMerchantOnboardingFixtureContract(fixture);
  return {
    path: '/v1/merchant-console/onboarding',
    fixture: 'docs/specs/fixtures/merchant-console-onboarding-v0.1.json',
    verifier: 'npm run verify:merchant-console-ec-plugin',
    contractState: 'README / fixture / OpenAPI aligned',
    enabledCarriers: contract.enabledCarriers,
    addressLoginClientRef: contract.addressLoginClientRef,
    addressLoginCallbackPreflightRef: contract.addressLoginCallbackPreflightRef,
    callbackContractVersion: contract.callbackContractVersion,
    callbackPreflightPassed: contract.callbackPreflightChecks.every(check => check.status === 'pass'),
    addressFormVersionRef: contract.addressFormVersionRef,
    requiredWalletBoundaryFields: contract.requiredWalletBoundaryFields,
    safetyFlags: [
      `enabledCarriers: ${contract.enabledCarriers.join('+')}`,
      `addressLoginClientRef: ${contract.addressLoginClientRef ?? 'missing'}`,
      `callbackPreflightRef: ${contract.addressLoginCallbackPreflightRef ?? 'missing'}`,
      `callbackContractVersion: ${contract.callbackContractVersion ?? 'missing'}`,
      `callbackPreflightPassed: ${contract.callbackPreflightChecks.every(check => check.status === 'pass')}`,
      `addressFormVersionRef: ${contract.addressFormVersionRef ?? 'missing'}`,
      `walletBoundaryFields: ${contract.requiredWalletBoundaryFields.join('+')}`,
      `localOnly: ${contract.sdkCopyLocalOnly}`,
      `productionTraffic: ${contract.sdkCopyProductionTraffic}`,
      `rawAddressVisibleToEc: ${contract.rawAddressVisibleToEc}`,
      `carrierSpecificAddressShapeCollectedByEc: ${contract.carrierSpecificAddressShapeCollectedByEc}`,
    ],
  };
}

export function buildMerchantConsoleOnboardingOpenApiContractCopyPayload(
  status: MerchantConsoleOnboardingOpenApiContractStatus,
): MerchantConsoleOnboardingOpenApiContractCopyPayload {
  return {
    label: 'Merchant onboarding OpenAPI contract',
    buttonLabel: 'Copy contract',
    successLabel: 'Copied contract',
    clipboardText: [
      `path: ${status.path}`,
      `fixture: ${status.fixture}`,
      `verifier: ${status.verifier}`,
      `contractState: ${status.contractState}`,
      `enabledCarriers: ${status.enabledCarriers.join('+')}`,
      `addressLoginClientRef: ${status.addressLoginClientRef ?? 'missing'}`,
      `callbackPreflightRef: ${status.addressLoginCallbackPreflightRef ?? 'missing'}`,
      `callbackContractVersion: ${status.callbackContractVersion ?? 'missing'}`,
      `callbackPreflightPassed: ${status.callbackPreflightPassed}`,
      `addressFormVersionRef: ${status.addressFormVersionRef ?? 'missing'}`,
      `walletBoundaryFields: ${status.requiredWalletBoundaryFields.join('+')}`,
      ...status.safetyFlags,
    ].join('\n'),
    localOnly: true,
    productionTraffic: false,
  };
}

export function buildMerchantConsoleCallbackPreflightRepairActions(
  preflight: AddressLoginMerchantSetupPreflight,
): MerchantConsoleCallbackPreflightRepairAction[] {
  return preflight.checks.map(check => {
    let primaryAction: MerchantConsoleCallbackPreflightRepairAction['primaryAction'] = 'no_repair_needed';
    let helperText = 'This setup check is already satisfied for local sandbox onboarding.';
    let testVectorIds: string[] = [];

    if (check.id === 'callback-url-https') {
      primaryAction = check.status === 'pass' ? 'no_repair_needed' : 'replace_with_https_callback_url';
      helperText = check.status === 'pass'
        ? 'Keep the HTTPS callback URL on the allowlist before requesting live mode.'
        : 'Replace the callback URL with an HTTPS endpoint before issuing an Address Login client ref.';
    } else if (check.id === 'callback-contract-version-pinned') {
      primaryAction = check.status === 'pass' ? 'no_repair_needed' : 'pin_callback_contract_version';
      helperText = check.status === 'pass'
        ? 'Keep this callback contract version pinned in Merchant Console onboarding.'
        : 'Pin the callback contract version before sharing the setup with EC developers.';
    } else if (check.id === 'callback-url-forbidden-param-scan') {
      primaryAction = check.status === 'pass' ? 'no_repair_needed' : 'remove_forbidden_callback_params';
      testVectorIds = merchantConsoleCallbackRepairVectorIds(preflight);
      helperText = check.status === 'pass'
        ? `No forbidden callback params or values were found; keep ${testVectorIds.join(', ')} in the local and hosted vector gates.`
        : `Remove forbidden callback params and forbidden-value refs before any Address Wallet credential can be returned. Local and hosted vectors: ${testVectorIds.join(', ')}.`;
    } else if (check.id === 'synthetic-test-vectors-ready') {
      primaryAction = check.status === 'pass' ? 'run_synthetic_test_vectors' : 'run_synthetic_test_vectors';
      testVectorIds = [...preflight.testVectorIds];
      helperText = 'Run the synthetic test vector command before limited production review.';
    }

    return {
      checkId: check.id,
      label: check.label,
      status: check.status,
      primaryAction,
      helperText,
      safeInputRef: check.safeInputRef,
      testVectorIds,
      blocksLiveMode: check.status === 'fail',
    };
  });
}

export function buildMerchantConsoleCallbackPreflightNegativeFixture(): MerchantConsoleCallbackPreflightNegativeFixture {
  const addressLoginClientRef = 'address_login_client_ref_synthetic_negative_001';
  const callbackUrl = 'http://merchant.example/veygrit/callback?raw_address&private_key&proof_secret';
  const preflight = buildMerchantConsoleAddressLoginSetupPreflight(addressLoginClientRef, callbackUrl);
  const repairActions = buildMerchantConsoleCallbackPreflightRepairActions(preflight);

  return {
    fixtureId: 'merchant-console-callback-preflight-negative-v0.1',
    addressLoginClientRef,
    callbackUrl,
    expectedError: 'missing_address_login_boundary',
    expectedMissingRefs: ['storeEcPlatform.addressLoginCallbackPreflight'],
    expectedFailingCheckIds: preflight.checks.filter(check => check.status === 'fail').map(check => check.id),
    forbiddenParams: ['raw_address', 'private_key', 'proof_secret'],
    forbiddenValueParamRefs: ['credential_ref'],
    callbackValidationVectorIds: merchantConsoleCallbackValidationVectorIds(),
    repairActionIds: uniqueStrings(
      repairActions.filter(action => action.blocksLiveMode).map(action => action.primaryAction),
    ) as MerchantConsoleCallbackPreflightRepairAction['primaryAction'][],
    exportCommand: 'npm run verify:merchant-console-ec-plugin',
    blockedMaterial: blockedMaterial(),
    nonClaims: [
      'negative-fixture-only',
      'not-production-traffic',
      'not-raw-address-callback',
      'not-private-key-callback',
      'not-proof-secret-callback',
      'not-provider-token-material',
    ],
    localOnly: true,
    productionTraffic: false,
  };
}

export function buildMerchantConsoleCallbackPreflightNegativeFixtureCopyText(
  fixture = buildMerchantConsoleCallbackPreflightNegativeFixture(),
) {
  return JSON.stringify({
    fixtureId: fixture.fixtureId,
    localOnly: fixture.localOnly,
    productionTraffic: fixture.productionTraffic,
    request: {
      storeEcPlatform: {
        addressLoginClientRef: fixture.addressLoginClientRef,
        addressLoginCallbackUrl: fixture.callbackUrl,
      },
    },
    expected: {
      error: fixture.expectedError,
      missingRefs: fixture.expectedMissingRefs,
      failingCheckIds: fixture.expectedFailingCheckIds,
      forbiddenParams: fixture.forbiddenParams,
      forbiddenValueParamRefs: fixture.forbiddenValueParamRefs,
      callbackValidationVectorIds: fixture.callbackValidationVectorIds,
      repairActionIds: fixture.repairActionIds,
    },
    nonClaims: fixture.nonClaims,
  }, null, 2);
}

export function upsertMerchantConsoleLocalHexashipShipmentRecord(
  current: MerchantConsoleLocalHexashipShipmentRecord | undefined,
  orderRef: string,
  result: HexashipMvpV01Result,
): MerchantConsoleLocalHexashipShipmentRecord {
  return {
    idempotencyKey: current?.idempotencyKey ?? buildMerchantConsoleLocalHexashipIdempotencyKey(orderRef),
    duplicateClickCount: (current?.duplicateClickCount ?? 0) + 1,
    result,
  };
}

export function buildMerchantConsoleLocalHexashipRequestFixture(
  record: MerchantConsoleLocalHexashipShipmentRecord,
): MerchantConsoleLocalHexashipRequestFixture {
  return {
    method: 'POST',
    path: '/v1/hexaship/mvp-v0.1/shipments',
    sdkRequestOptions: {
      idempotencyKey: record.idempotencyKey,
    },
    headers: {
      'idempotency-key': record.idempotencyKey,
      'x-hexaship-local-only': 'true',
    },
    bodyRefs: {
      merchantRef: 'merchant_demo',
      ecOrderRef: record.result.ecOrderRef,
      recipientId: record.result.recipientResolution.recipientId,
      addressFormVersion: `wallet_country_form_ref_${record.result.recipientResolution.recipientId.replace(/^ship_recipient_/, '')}`,
      parcelProfileRef: `parcel_profile_ref_${record.result.ecOrderRef}`,
      walletConsentRef: record.result.recipientResolution.walletConsentRef,
      carrierCapabilityRef: record.result.capability.carrierCapabilityRef,
      selectionMode: record.result.selection.selectionMode,
      selectedBy: record.result.selection.selectedBy,
    },
    forbiddenPublicMaterial: blockedMaterial(),
    productionTraffic: false,
  };
}

export function buildMerchantConsoleLocalHexashipRequestFixtureCopyText(
  fixture: MerchantConsoleLocalHexashipRequestFixture,
) {
  return JSON.stringify({
    method: fixture.method,
    path: fixture.path,
    sdkRequestOptions: fixture.sdkRequestOptions,
    headers: fixture.headers,
    bodyRefs: fixture.bodyRefs,
    productionTraffic: fixture.productionTraffic,
  }, null, 2);
}

export function buildMerchantConsoleLocalHexashipReplayPreview(
  record: MerchantConsoleLocalHexashipShipmentRecord,
  fixture = buildMerchantConsoleLocalHexashipRequestFixture(record),
): MerchantConsoleLocalHexashipReplayPreview {
  return {
    idempotencyKey: fixture.headers['idempotency-key'],
    replayed: record.duplicateClickCount > 1,
    replayStatus: record.duplicateClickCount > 1 ? 'would_replay_same_request' : 'not_replayed_yet',
    duplicateClickCount: record.duplicateClickCount,
    routePath: fixture.path,
    safeReplayRef: `replay_ref_${fixture.sdkRequestOptions.idempotencyKey}`,
    productionTraffic: false,
  };
}

export function buildMerchantConsoleLocalHexashipIdempotencyLedgerRows(
  records: MerchantConsoleLocalHexashipShipmentRecord[],
): MerchantConsoleLocalHexashipIdempotencyLedgerRow[] {
  return records.map(record => {
    const replayPreview = buildMerchantConsoleLocalHexashipReplayPreview(record);
    const latestWebhook = record.result.webhookLedger[record.result.webhookLedger.length - 1];

    return {
      shipmentRef: record.result.shipment.shipmentRef,
      ecOrderRef: record.result.ecOrderRef,
      idempotencyKey: record.idempotencyKey,
      createReplayStatus: replayPreview.replayStatus,
      webhookReplayStatus: replayPreview.replayed ? 'accepted_exact_replay' : 'not_replayed_yet',
      duplicateClickCount: replayPreview.duplicateClickCount,
      webhookEventCount: record.result.webhookLedger.length,
      latestWebhookEventRef: latestWebhook?.eventRef ?? 'webhook_event_ref_missing',
      latestWebhookStatus: latestWebhook?.status ?? 'missing',
      safeWebhookReplayRef: `webhook_replay_ref_${latestWebhook?.eventRef ?? 'missing'}`,
      selectedCarrier: record.result.selection.selectedCarrier,
      addressExposure: 'ref_only',
      productionTraffic: false,
    };
  });
}

export function buildMerchantConsoleLocalHexashipWebhookReplayFixture(
  row: MerchantConsoleLocalHexashipIdempotencyLedgerRow,
): MerchantConsoleLocalHexashipWebhookReplayFixture {
  const store = createInMemorySkipshipWebhookEventStore();
  const safeBodyFingerprintRef = `bodyfp_ref_${row.latestWebhookEventRef}`;
  const safeConflictFingerprintRef = `bodyfp_conflict_ref_${row.latestWebhookEventRef}`;
  const response = {
    status: 202,
    body: {
      ok: true,
      eventId: row.latestWebhookEventRef,
      shipmentRef: row.shipmentRef,
      productionTraffic: false,
    },
  };

  store.accept({
    eventId: row.latestWebhookEventRef,
    bodyFingerprint: safeBodyFingerprintRef,
    response,
    receivedAt: '2026-07-05T00:55:13.504Z',
  });
  const acceptedReplay = store.accept({
    eventId: row.latestWebhookEventRef,
    bodyFingerprint: safeBodyFingerprintRef,
    response,
    receivedAt: '2026-07-05T00:56:13.504Z',
  });
  const conflictReplay = store.accept({
    eventId: row.latestWebhookEventRef,
    bodyFingerprint: safeConflictFingerprintRef,
    response,
    receivedAt: '2026-07-05T00:57:13.504Z',
  });

  return {
    latestWebhookEventRef: row.latestWebhookEventRef,
    safeBodyFingerprintRef,
    safeConflictFingerprintRef,
    acceptedReplayKind: acceptedReplay.kind,
    conflictReplayKind: conflictReplay.kind,
    acceptedResponseStatus: acceptedReplay.response.status,
    conflictResponseStatus: conflictReplay.response.status,
    privateMaterialExposed: false,
    productionTraffic: false,
  };
}

export function buildMerchantConsoleLocalHexashipLedgerLayoutAudit(
  rows: MerchantConsoleLocalHexashipIdempotencyLedgerRow[],
): MerchantConsoleLocalHexashipLedgerLayoutAudit {
  return {
    rowCount: rows.length,
    usesCompactSummaryGrid: true,
    maxSummaryColumns: 4,
    requiresWrappedRefs: true,
    requiredVisibleFields: [
      'shipmentRef',
      'ecOrderRef',
      'idempotencyKey',
      'createReplayStatus',
      'webhookReplayStatus',
      'webhookEventCount',
      'addressExposure',
    ],
    requiredWrappedRefFields: [
      'safeBodyFingerprintRef',
      'safeWebhookReplayRef',
      'latestWebhookEventRef',
    ],
    privateMaterialExposed: false,
    productionTraffic: false,
  };
}

export function buildMerchantConsoleEcPluginPlan(): MerchantConsoleEcPluginPlan {
  const connectorPlan = buildCarrierConnectorLayerPlan();
  const gatewayPlan = buildHexashipDeliveryGatewayPlan();
  const veyIdAdoptionCheck = buildMerchantConsoleVeyIdAdoptionCheck();

  return {
    version: MERCHANT_CONSOLE_EC_PLUGIN_VERSION,
    productName: 'Merchant Console / EC Plugin',
    thesis:
      'Merchant Console gives Shopify-like operations for Hexaship shipping while EC plugins and SDKs keep recipient addresses hidden behind refs by default.',
    integrationModes: [
      {
        id: 'hosted-checkout-widget',
        title: 'Hosted Checkout Widget',
        target: 'small merchants and no-code EC teams',
        primaryInstallArtifact: 'hosted widget script plus merchantRef',
        requiredRefs: ['merchantRef', 'recipient_id', 'parcelProfileRef', 'walletConsentRef'],
        blockedMaterial: blockedMaterial(),
      },
      {
        id: 'rest-api',
        title: 'REST API',
        target: 'custom EC backends',
        primaryInstallArtifact: 'server-side HTTPS API with idempotency keys',
        requiredRefs: ['merchantRef', 'orderRef', 'recipient_id', 'parcelProfileRef', 'carrierCapabilityRef'],
        blockedMaterial: blockedMaterial(),
      },
      {
        id: 'sdk',
        title: 'SDK',
        target: 'Next.js, React, and Node.js developers',
        primaryInstallArtifact: '@hexaship/js with typed createShipment helpers',
        requiredRefs: ['merchantRef', 'recipient_id', 'parcelProfileRef', 'walletConsentRef', 'webhookEndpointRef'],
        blockedMaterial: blockedMaterial(),
      },
      {
        id: 'plugin',
        title: 'Plugin',
        target: 'Shopify, WooCommerce, EC-CUBE, and packaged commerce platforms',
        primaryInstallArtifact: 'platform plugin with admin settings and checkout extension',
        requiredRefs: ['merchantRef', 'platformStoreRef', 'recipient_id', 'carrierPolicyRef', 'webhookEndpointRef'],
        blockedMaterial: blockedMaterial(),
      },
    ],
    commerceIntegrationChoices: buildMerchantCommerceIntegrationChoices(),
    onboardingSteps: [
      {
        id: 'merchant-account',
        title: 'Merchant Account',
        purpose: 'Create the merchant identity, admin login, country scope, and 2FA baseline.',
        fieldGroups: [
          {
            title: 'Account information',
            fields: [
              { id: 'displayName', label: 'Company or store name', required: true, dataKind: 'business_profile' },
              { id: 'adminName', label: 'Primary contact name', required: true, dataKind: 'business_profile' },
              { id: 'adminEmail', label: 'Email address', required: true, dataKind: 'business_profile' },
              { id: 'adminPhoneRef', label: 'Phone ref', required: true, dataKind: 'security_ref', secretHandling: 'ref_only' },
              { id: 'passwordCredentialRef', label: 'Password credential ref', required: true, dataKind: 'security_ref', secretHandling: 'server_side_only' },
              { id: 'twoFactorEnabled', label: '2FA enabled', required: true, dataKind: 'security_ref' },
              { id: 'operatingCountries', label: 'Operating countries', required: true, dataKind: 'business_profile' },
            ],
          },
          {
            title: 'Business profile',
            fields: [
              { id: 'legalName', label: 'Legal business name', required: true, dataKind: 'business_profile' },
              { id: 'registrationNumberRef', label: 'Registration number ref', required: true, dataKind: 'security_ref', secretHandling: 'ref_only' },
              { id: 'businessAddressRef', label: 'Business address ref', required: true, dataKind: 'security_ref', secretHandling: 'ref_only' },
              { id: 'businessType', label: 'Business type', required: true, dataKind: 'business_profile', options: ['ec', 'marketplace', 'd2c', 'warehouse-logistics', 'saas', 'sole-proprietor'] },
              { id: 'monthlyShipmentBand', label: 'Monthly shipment band', required: true, dataKind: 'business_profile' },
            ],
          },
        ],
        completionGate: 'merchant_identity_created_and_2fa_enabled',
        safeOutputRefs: ['merchantRef', 'adminUserRef', 'billingProfileRef'],
        blockedMaterial: blockedMaterial(),
      },
      {
        id: 'store-ec-platform',
        title: 'Store / EC Platform',
        purpose: 'Register the storefront, platform, order shape, currency, and environment URLs.',
        fieldGroups: [
          {
            title: 'Store information',
            fields: [
              { id: 'storeName', label: 'EC site name', required: true, dataKind: 'store_profile' },
              { id: 'storeUrl', label: 'EC URL', required: true, dataKind: 'store_profile' },
              { id: 'platform', label: 'Platform', required: true, dataKind: 'store_profile', options: ['shopify', 'woocommerce', 'ec-cube', 'base', 'stores', 'custom-ec', 'other'] },
              { id: 'developmentUrl', label: 'Development URL', required: false, dataKind: 'store_profile' },
              { id: 'productionUrl', label: 'Production URL', required: true, dataKind: 'store_profile' },
              { id: 'addressLoginClientRef', label: 'Vey ID client ref', required: true, dataKind: 'security_ref', secretHandling: 'ref_only' },
              { id: 'addressLoginCallbackUrl', label: 'Vey ID callback URL', required: true, dataKind: 'store_profile' },
              { id: 'orderIdFormat', label: 'Order ID format', required: true, dataKind: 'store_profile' },
              { id: 'currency', label: 'Currency', required: true, dataKind: 'store_profile' },
              { id: 'timezone', label: 'Timezone', required: true, dataKind: 'store_profile' },
            ],
          },
        ],
        completionGate: 'store_profile_validated',
        safeOutputRefs: ['storeRef', 'platformStoreRef', 'orderSchemaRef', 'addressLoginClientRef', 'addressLoginCallbackPreflightRef'],
        blockedMaterial: blockedMaterial(),
      },
      {
        id: 'shipping-preferences',
        title: 'Shipping Preferences',
        purpose: 'Configure DHL/UPS use, carrier allocation rules, returns, pickup, labels, and parcel templates.',
        fieldGroups: [
          {
            title: 'Carrier and routing',
            fields: [
              { id: 'enabledCarriers', label: 'Enabled carriers', required: true, dataKind: 'shipping_policy', options: ['dhl', 'ups', 'future-fedex', 'future-yamato', 'future-japan-post'] },
              { id: 'selectionRule', label: 'Carrier selection rule', required: true, dataKind: 'shipping_policy', options: ['cheapest', 'fastest', 'balanced', 'merchant-manual', 'user-choice'] },
              { id: 'shippingRegions', label: 'Main shipping regions', required: true, dataKind: 'shipping_policy', options: ['domestic', 'cross-border', 'us-domestic', 'canada-domestic', 'us-canada', 'japan-us'] },
              { id: 'returnsEnabled', label: 'Returns enabled', required: true, dataKind: 'shipping_policy' },
              { id: 'pickupEnabled', label: 'Pickup enabled', required: false, dataKind: 'shipping_policy' },
              { id: 'labelFormat', label: 'Label format', required: true, dataKind: 'shipping_policy', options: ['pdf', 'zpl', 'qr'] },
              { id: 'parcelTemplateRefs', label: 'Parcel size template refs', required: true, dataKind: 'shipping_policy' },
            ],
          },
        ],
        completionGate: 'carrier_policy_ref_created',
        safeOutputRefs: ['carrierPolicyRef', 'parcelProfileRefs', 'returnPolicyRef'],
        blockedMaterial: blockedMaterial(),
      },
      {
        id: 'address-wallet-settings',
        title: 'Address Wallet Settings',
        purpose: 'Decide whether checkout uses Address Wallet login, friend delivery, recipient approval, hidden address display, and wallet QR rails.',
        fieldGroups: [
          {
            title: 'Wallet policy',
            fields: [
              { id: 'addressWalletLoginEnabled', label: 'Use Address Wallet login', required: true, dataKind: 'wallet_policy' },
              { id: 'friendDeliveryEnabled', label: 'Enable friend delivery', required: true, dataKind: 'wallet_policy' },
              { id: 'recipientApprovalRequired', label: 'Recipient approval required', required: true, dataKind: 'wallet_policy' },
              { id: 'hideAddressFromBuyer', label: 'Hide recipient address from buyer', required: true, dataKind: 'wallet_policy' },
              { id: 'addressFormVersionRef', label: 'Country address form version ref', required: true, dataKind: 'wallet_policy', secretHandling: 'ref_only' },
              { id: 'carrierSpecificAddressShapeBlocked', label: 'Block carrier-specific address forms in EC', required: true, dataKind: 'wallet_policy' },
              { id: 'appleWalletQrEnabled', label: 'Apple Wallet QR base enabled', required: false, dataKind: 'wallet_policy' },
              { id: 'googleWalletQrEnabled', label: 'Google Wallet QR base enabled', required: false, dataKind: 'wallet_policy' },
            ],
          },
        ],
        completionGate: 'wallet_consent_policy_ref_created',
        safeOutputRefs: ['walletPolicyRef', 'recipientApprovalPolicyRef', 'addressFormVersionRef', 'qrRailPolicyRef'],
        blockedMaterial: blockedMaterial(),
      },
      {
        id: 'api-keys-webhooks',
        title: 'API Keys & Webhooks',
        purpose: 'Issue test keys, register webhook URLs, test delivery events, and prepare limited production review.',
        fieldGroups: [
          {
            title: 'Keys and webhook endpoint',
            fields: [
              { id: 'testPublishableKeyRef', label: 'Test publishable key ref', required: true, dataKind: 'security_ref', secretHandling: 'ref_only' },
              { id: 'testSecretKeyRef', label: 'Test secret key ref', required: true, dataKind: 'security_ref', secretHandling: 'server_side_only' },
              { id: 'webhookUrl', label: 'Webhook URL', required: true, dataKind: 'store_profile' },
              { id: 'webhookSigningSecretRef', label: 'Webhook signing secret ref', required: true, dataKind: 'security_ref', secretHandling: 'server_side_only' },
              { id: 'webhookEvents', label: 'Webhook events', required: true, dataKind: 'shipping_policy' },
              { id: 'sandboxShipmentTest', label: 'Sandbox shipment test', required: true, dataKind: 'shipping_policy' },
              { id: 'productionReviewSubmitted', label: 'Production review submitted', required: true, dataKind: 'business_profile' },
            ],
          },
        ],
        completionGate: 'test_shipment_created_and_live_review_submitted',
        safeOutputRefs: ['apiKeySetRef', 'webhookEndpointRef', 'sandboxShipmentRef', 'productionReviewRef'],
        blockedMaterial: blockedMaterial(),
      },
    ],
    apiKeyPolicy: {
      keyRefs: ['test_publishable_key_ref', 'test_secret_key_ref', 'live_publishable_key_ref', 'live_secret_key_ref'],
      defaultMode: 'test',
      serverSidePrimary: true,
      publishableKeyScope: 'hosted_widget_only',
      liveKeysBlockedUntil: ['business_review_passed', 'carrier_sandbox_passed', 'privacy_boundary_signed', 'limited_production_approved'],
      rotationActions: ['create-test-key', 'rotate-webhook-secret-ref', 'request-live-keys', 'revoke-compromised-key-ref'],
      blockedMaterial: blockedMaterial(),
    },
    webhookSetup: {
      requiredUrlScheme: 'https',
      events: [
        'shipment.created',
        'rates.created',
        'label.created',
        'shipment.in_transit',
        'shipment.delivered',
        'shipment.failed',
        'return.created',
      ],
      retryPolicy: {
        mode: 'exponential_backoff',
        maxAttempts: 8,
      },
      testSendButton: true,
      signatureSecretHandling: 'stored_as_ref_only',
      blockedMaterial: blockedMaterial(),
    },
    productionReviewGates: [
      { id: 'business-verification', label: 'Business verification', required: true },
      { id: 'product-category-review', label: 'Shipping product category review', required: true },
      { id: 'prohibited-goods-attestation', label: 'Prohibited goods attestation', required: true },
      { id: 'privacy-handling-consent', label: 'Personal data handling consent', required: true },
      { id: 'dhl-ups-account-linkage', label: 'DHL/UPS account or sandbox linkage', required: true },
      { id: 'returns-policy', label: 'Returns policy', required: true },
      { id: 'support-contact', label: 'Support contact', required: true },
      { id: 'incident-liability-boundary', label: 'Delivery incident responsibility boundary', required: true },
    ],
    ecCreateShipmentExample: {
      sdkCall: "hexaship.createShipment({ recipientId: 'ship_recipient_xxx', addressFormVersion: 'wallet_country_form_ref_xxx', parcelProfileRef: 'parcel_small_box', preference: 'cheapest' })",
      hiddenBackendPipeline: [
        'resolve_address_wallet_recipient_id',
        'verify_recipient_consent',
        'check_dhl_ups_capability',
        'fetch_rates_and_eta',
        'allocate_cheapest_fastest_or_balanced_carrier',
        'create_label',
        'store_tracking_alias',
        'notify_merchant_webhook',
      ],
      merchantVisibleRefs: ['recipientId', 'shipmentRef', 'labelRef', 'trackingAlias'],
      merchantHiddenMaterial: ['rawAddress', 'recipientPhone', 'carrierApiKey', 'rawCarrierPayload', 'privateDeliveryNotes', 'proofSecret'],
    },
    pluginProfiles: [
      {
        id: 'shopify-like',
        displayName: 'Shopify-style Admin App',
        integrationMode: 'app-embed',
        primaryAudience: 'merchant-admin',
        installSurface: 'embedded admin app plus checkout extension',
        sdkPackage: '@hexaship/shopify-like',
        requiredRefs: ['merchantRef', 'orderRef', 'recipient_id', 'walletConsentRef', 'carrierCapabilityRef'],
        blockedStorage: blockedMaterial(),
        releaseGate: ['app-review-copy-ready', 'checkout-extension-sandbox-tested', 'no-raw-address-admin-view'],
      },
      {
        id: 'woocommerce',
        displayName: 'WooCommerce Plugin',
        integrationMode: 'wordpress-plugin',
        primaryAudience: 'merchant-admin',
        installSurface: 'WordPress plugin settings page and WooCommerce shipping method',
        sdkPackage: '@hexaship/woocommerce',
        requiredRefs: ['merchantRef', 'orderRef', 'recipient_id', 'walletConsentRef', 'carrierCapabilityRef', 'webhookEndpointRef'],
        blockedStorage: blockedMaterial(),
        releaseGate: ['wordpress-nonce-tested', 'webhook-signature-tested', 'no-raw-address-order-meta'],
      },
      {
        id: 'ec-cube',
        displayName: 'EC-CUBE Plugin',
        integrationMode: 'php-plugin',
        primaryAudience: 'merchant-admin',
        installSurface: 'EC-CUBE admin plugin and checkout delivery extension',
        sdkPackage: '@hexaship/ec-cube',
        requiredRefs: ['merchantRef', 'orderRef', 'recipient_id', 'walletConsentRef', 'carrierCapabilityRef', 'carrierAllocationRef'],
        blockedStorage: blockedMaterial(),
        releaseGate: ['ec-cube-plugin-sandbox-tested', 'carrier-selection-tested', 'no-raw-address-admin-view'],
      },
      {
        id: 'custom-ec',
        displayName: 'Custom EC SDK',
        integrationMode: 'typescript-sdk',
        primaryAudience: 'developer',
        installSurface: 'server SDK plus optional admin console widgets',
        sdkPackage: '@hexaship/js',
        requiredRefs: ['merchantRef', 'orderRef', 'recipient_id', 'parcelProfileRef', 'walletConsentRef', 'carrierCapabilityRef'],
        blockedStorage: blockedMaterial(),
        releaseGate: ['typescript-examples-tested', 'idempotency-key-tested', 'no-production-traffic-in-fixtures'],
      },
    ],
    surfaces: [
      {
        id: 'carrier-selection',
        title: 'Carrier selection',
        purpose: 'Let merchants choose auto, DHL, UPS, fastest, cheapest, or balanced routing without seeing the recipient address.',
        visibleColumns: ['orderRef', 'recipientDisplayRef', 'carrierAlias', 'servicePreference', 'carrierCapabilityRef', 'status'],
        hiddenByDefault: ['rawAddress', 'recipientName', 'recipientPhone', 'carrierApiKey'],
        actions: ['select-auto', 'select-dhl', 'select-ups', 'choose-fastest', 'choose-cheapest', 'create-shipment'],
      },
      {
        id: 'shipment-history',
        title: 'Shipment history',
        purpose: 'Show shipment refs, label refs, tracking aliases, returns, and status history.',
        visibleColumns: ['shipmentRef', 'orderRef', 'recipientDisplayRef', 'carrierAlias', 'status', 'labelRef', 'trackingAlias', 'createdAt'],
        hiddenByDefault: ['rawAddress', 'rawLabelPayload', 'proofWitness', 'privateDeliveryNotes'],
        actions: ['open-shipment', 'create-label', 'track-shipment', 'create-return'],
      },
      {
        id: 'webhook-history',
        title: 'Webhook history',
        purpose: 'Show delivery webhook attempts and retry state using event refs only.',
        visibleColumns: ['eventRef', 'eventType', 'status', 'attemptCount', 'lastAttemptAt', 'nextRetryAt'],
        hiddenByDefault: ['rawWebhookPayload', 'webhookSecret', 'rawAddress', 'recipientPhone'],
        actions: ['replay-test-event', 'copy-event-ref', 'open-redacted-evidence'],
      },
      {
        id: 'plugin-settings',
        title: 'Plugin settings',
        purpose: 'Configure API keys by ref, webhook endpoints, test/live mode, carrier routing, and CMS integration status.',
        visibleColumns: ['platform', 'mode', 'publishableKeyRef', 'webhookEndpointRef', 'carrierPolicyRef', 'lastPreflightAt'],
        hiddenByDefault: ['secretKey', 'webhookSecret', 'carrierCredential'],
        actions: ['run-preflight', 'rotate-key-ref', 'configure-webhook', 'enable-carrier'],
      },
      {
        id: 'redaction-policy',
        title: 'Address redaction policy',
        purpose: 'Explain and enforce that merchant views store refs rather than recipient address bodies by default.',
        visibleColumns: ['policyRef', 'addressVisibleByDefault', 'merchantStoresRecipientId', 'retentionPolicyRef'],
        hiddenByDefault: ['selectedAddressBody', 'recipientName', 'recipientPhone', 'proofWitness'],
        actions: ['review-policy', 'export-redacted-audit', 'request-elevated-disclosure'],
      },
      {
        id: 'vey-id-adoption',
        title: 'Vey ID adoption',
        purpose: 'Show whether the merchant can add Continue with Veygrit using Google/Apple account creation, PKCE server exchange, Address Wallet reuse, and wallet-side revocation.',
        visibleColumns: ['providerPolicy', 'requiredRoute', 'sdkPackage', 'merchantVisibleRef', 'verifierCommand'],
        hiddenByDefault: ['rawAddress', 'providerIdToken', 'providerAccessToken', 'rawProviderProfile', 'rawVeyIdToken'],
        actions: ['copy-authorize-url', 'run-vey-id-openapi-check', 'verify-react-sdk', 'verify-nextjs-sdk', 'open-wallet-revocation'],
      },
    ],
    veyIdAdoptionCheck,
    carrierOptions: [
      { carrier: 'auto', label: 'Auto allocation', availableInMvp: true, selectionModes: ['fastest', 'cheapest', 'balanced'] },
      { carrier: 'dhl', label: 'DHL', availableInMvp: true, selectionModes: ['fastest', 'balanced'] },
      { carrier: 'ups', label: 'UPS', availableInMvp: true, selectionModes: ['fastest', 'cheapest', 'balanced'] },
      ...connectorPlan.plannedConnectors.map(carrier => ({
        carrier,
        label: carrier === 'yamato' ? 'Yamato' : carrier === 'japan-post' ? 'Japan Post' : carrier === 'sf-express' ? 'SF Express' : 'FedEx',
        availableInMvp: false,
        selectionModes: ['balanced'] as Array<'fastest' | 'cheapest' | 'balanced'>,
      })),
    ],
    sampleShipmentHistory: [
      {
        shipmentRef: 'hx_ship_synthetic_console_001',
        orderRef: 'order_ref_synthetic_shop_001',
        recipientDisplayRef: 'aw_rec_friend_synthetic_display_001',
        carrierAlias: 'dhl',
        servicePreference: 'fastest',
        status: 'label_created',
        labelRef: 'hx_label_synthetic_console_001',
        trackingAlias: 'hx_track_synthetic_console_001',
        walletConsentRef: 'wallet_consent_ref_synthetic_001',
        carrierCapabilityRef: 'carrier_capability_synthetic_console_001',
        createdAt: '2026-07-05T09:00:00.000Z',
        blockedMaterial: blockedMaterial(),
      },
      {
        shipmentRef: 'hx_ship_synthetic_console_002',
        orderRef: 'order_ref_synthetic_shop_002',
        recipientDisplayRef: 'aw_rec_self_synthetic_display_002',
        carrierAlias: 'ups',
        servicePreference: 'cheapest',
        status: 'in_transit',
        labelRef: 'hx_label_synthetic_console_002',
        trackingAlias: 'hx_track_synthetic_console_002',
        walletConsentRef: 'wallet_consent_ref_synthetic_002',
        carrierCapabilityRef: 'carrier_capability_synthetic_console_002',
        createdAt: '2026-07-05T09:15:00.000Z',
        blockedMaterial: blockedMaterial(),
      },
    ],
    sampleWebhookHistory: gatewayPlan.webhookEvents.slice(0, 4).map((eventType, index) => ({
      eventRef: `webhook_event_ref_synthetic_${index + 1}`,
      eventType: eventType as MerchantWebhookHistoryRow['eventType'],
      status: index === 3 ? 'retrying' : 'ok',
      attemptCount: index === 3 ? 4 : 1,
      lastAttemptAt: `2026-07-05T09:${String(index * 5).padStart(2, '0')}:00.000Z`,
      nextRetryAt: index === 3 ? '2026-07-05T09:30:00.000Z' : undefined,
      safeRefs: [`event_ref_synthetic_${index + 1}`],
      blockedMaterial: blockedMaterial(),
    })),
    redactionPolicy: {
      addressVisibleByDefault: false,
      merchantStoresRecipientId: true,
      publicRowsUseRefsOnly: true,
      blockedMaterial: blockedMaterial(),
    },
    validationGates: [
      'npm run verify:merchant-console-ec-plugin',
      'npm run verify:hexaship-delivery-gateway',
      'npm run verify:carrier-connector-layer',
      'npm run verify:skipship-strategy',
      ...veyIdAdoptionCheck.verifierCommands,
    ],
    nonClaims: [
      'Merchant Console is not a raw address export tool by default.',
      'Plugin profiles are integration plans, not approval by Shopify, WooCommerce, EC-CUBE, or any marketplace.',
      'Carrier choice in the console is not a DHL/UPS service guarantee until runtime capability checks pass.',
    ],
  };
}

export function buildMerchantConsoleRedactedShipmentRows(rows = buildMerchantConsoleEcPluginPlan().sampleShipmentHistory) {
  return rows.map(row => ({
    shipmentRef: row.shipmentRef,
    orderRef: row.orderRef,
    recipientDisplayRef: row.recipientDisplayRef,
    carrierAlias: row.carrierAlias,
    servicePreference: row.servicePreference,
    status: row.status,
    labelRef: row.labelRef,
    trackingAlias: row.trackingAlias,
    carrierCapabilityRef: row.carrierCapabilityRef,
    createdAt: row.createdAt,
    blockedMaterial: row.blockedMaterial,
  }));
}

export function validateMerchantConsoleEcPluginPlan(plan: MerchantConsoleEcPluginPlan): string[] {
  const errors: string[] = [];
  const platforms = new Set(plan.pluginProfiles.map(profile => profile.id));
  const surfaces = new Set(plan.surfaces.map(surface => surface.id));
  const integrationModes = new Set(plan.integrationModes.map(mode => mode.id));
  const onboardingSteps = new Set(plan.onboardingSteps.map(step => step.id));
  const commerceChoices = new Set(plan.commerceIntegrationChoices.map(choice => choice.id));
  const playlistChoice = plan.commerceIntegrationChoices.find(choice => choice.id === 'playlist-commerce');
  const ecSocialLoginChoice = plan.commerceIntegrationChoices.find(choice => choice.id === 'ec-social-login');
  const bothChoice = plan.commerceIntegrationChoices.find(choice => choice.id === 'both');
  const veyIdAdoptionCheck = plan.veyIdAdoptionCheck;
  const text = JSON.stringify(plan);

  if (plan.version !== MERCHANT_CONSOLE_EC_PLUGIN_VERSION) errors.push('version-mismatch');
  for (const mode of ['hosted-checkout-widget', 'rest-api', 'sdk', 'plugin'] satisfies MerchantIntegrationModeId[]) {
    if (!integrationModes.has(mode)) errors.push(`missing-integration-mode:${mode}`);
  }
  for (const choice of ['playlist-commerce', 'ec-social-login', 'both'] satisfies MerchantCommerceIntegrationChoice['id'][]) {
    if (!commerceChoices.has(choice)) errors.push(`missing-commerce-integration-choice:${choice}`);
  }
  if (playlistChoice) {
    if (!playlistChoice.installTargets.includes('veygrit-app')) errors.push('playlist-commerce-install-target-mismatch');
    if (playlistChoice.loginButtonRequiredToShop !== false) errors.push('playlist-commerce-login-button-required');
    if (playlistChoice.continueWithVeygritRequired !== false) errors.push('playlist-commerce-continue-with-veygrit-required');
    if (!playlistChoice.requiredSetupRefs.includes('playlistParticipationRef')) errors.push('playlist-commerce-missing-participation-ref');
  }
  if (ecSocialLoginChoice) {
    if (!ecSocialLoginChoice.installTargets.includes('merchant-ec-plugin-or-sdk')) errors.push('ec-social-login-install-target-mismatch');
    if (ecSocialLoginChoice.loginButtonRequiredToShop !== true) errors.push('ec-social-login-missing-login-button');
    if (ecSocialLoginChoice.continueWithVeygritRequired !== true) errors.push('ec-social-login-missing-continue-with-veygrit');
    if (!ecSocialLoginChoice.requiredSetupRefs.includes('addressLoginClientRef')) errors.push('ec-social-login-missing-client-ref');
  }
  if (bothChoice) {
    if (bothChoice.loginButtonRequiredToShop !== 'mixed') errors.push('both-choice-login-policy-not-mixed');
    if (bothChoice.continueWithVeygritRequired !== 'mixed') errors.push('both-choice-continue-policy-not-mixed');
    for (const target of ['veygrit-app', 'merchant-ec-plugin-or-sdk'] satisfies SkipshipCommerceIntegrationPlacement['installTarget'][]) {
      if (!bothChoice.installTargets.includes(target)) errors.push(`both-choice-missing-install-target:${target}`);
    }
  }
  for (const choice of plan.commerceIntegrationChoices) {
    for (const blocked of ['rawAddress', 'recipientPhone', 'privateKey', 'proofSecret']) {
      if (!choice.blockedMaterial.includes(blocked)) errors.push(`commerce-choice-missing-blocked-material:${choice.id}:${blocked}`);
    }
    if (JSON.stringify(choice.merchantVisibleRefs).match(/rawAddress|recipientPhone|privateKey|proofSecret/i)) {
      errors.push(`commerce-choice-visible-private-material:${choice.id}`);
    }
  }
  for (const step of ['merchant-account', 'store-ec-platform', 'shipping-preferences', 'address-wallet-settings', 'api-keys-webhooks'] satisfies MerchantOnboardingStepId[]) {
    if (!onboardingSteps.has(step)) errors.push(`missing-onboarding-step:${step}`);
  }
  for (const step of plan.onboardingSteps) {
    if (step.fieldGroups.length === 0) errors.push(`onboarding-step-missing-fields:${step.id}`);
    if (!step.safeOutputRefs.every(ref => /Ref$/.test(ref) || ref.endsWith('Refs'))) errors.push(`onboarding-step-output-not-ref:${step.id}`);
    for (const blocked of ['rawAddress', 'recipientPhone', 'carrierApiKey', 'webhookSecret']) {
      if (!step.blockedMaterial.includes(blocked)) errors.push(`onboarding-step-missing-blocked-material:${step.id}:${blocked}`);
    }
  }
  if (!plan.apiKeyPolicy.serverSidePrimary) errors.push('api-keys-not-server-side-primary');
  if (!plan.apiKeyPolicy.keyRefs.includes('test_secret_key_ref')) errors.push('missing-test-secret-key-ref');
  if (!plan.apiKeyPolicy.liveKeysBlockedUntil.includes('limited_production_approved')) errors.push('live-keys-not-gated');
  if (plan.webhookSetup.requiredUrlScheme !== 'https') errors.push('webhook-not-https-only');
  for (const event of ['shipment.created', 'rates.created', 'label.created', 'shipment.in_transit', 'shipment.delivered', 'shipment.failed', 'return.created']) {
    if (!plan.webhookSetup.events.includes(event)) errors.push(`missing-webhook-event:${event}`);
  }
  if (!plan.productionReviewGates.some(gate => gate.id === 'dhl-ups-account-linkage')) errors.push('missing-dhl-ups-review-gate');
  if (!plan.ecCreateShipmentExample.sdkCall.includes('hexaship.createShipment')) errors.push('missing-create-shipment-example');
  if (!plan.ecCreateShipmentExample.sdkCall.includes('addressFormVersion')) errors.push('missing-address-form-version-example');
  const walletStepFields = plan.onboardingSteps
    .find(step => step.id === 'address-wallet-settings')
    ?.fieldGroups.flatMap(group => group.fields) ?? [];
  if (!walletStepFields.some(field => field.id === 'addressFormVersionRef' && field.secretHandling === 'ref_only')) {
    errors.push('missing-address-form-version-ref-field');
  }
  if (!walletStepFields.some(field => field.id === 'carrierSpecificAddressShapeBlocked' && field.required)) {
    errors.push('missing-carrier-specific-address-shape-block-field');
  }
  const storeStepFields = plan.onboardingSteps
    .find(step => step.id === 'store-ec-platform')
    ?.fieldGroups.flatMap(group => group.fields) ?? [];
  if (!storeStepFields.some(field => field.id === 'addressLoginClientRef' && field.required && field.secretHandling === 'ref_only')) {
    errors.push('missing-address-login-client-ref-field');
  }
  if (!storeStepFields.some(field => field.id === 'addressLoginCallbackUrl' && field.required)) {
    errors.push('missing-address-login-callback-url-field');
  }
  const storeStep = plan.onboardingSteps.find(step => step.id === 'store-ec-platform');
  if (!storeStep?.safeOutputRefs.includes('addressLoginCallbackPreflightRef')) {
    errors.push('missing-address-login-callback-preflight-ref-output');
  }
  for (const visibleRef of ['recipientId', 'shipmentRef', 'labelRef', 'trackingAlias']) {
    if (!plan.ecCreateShipmentExample.merchantVisibleRefs.includes(visibleRef)) errors.push(`missing-merchant-visible-ref:${visibleRef}`);
  }
  for (const hidden of ['rawAddress', 'recipientPhone', 'carrierApiKey', 'rawCarrierPayload', 'proofSecret']) {
    if (!plan.ecCreateShipmentExample.merchantHiddenMaterial.includes(hidden)) errors.push(`missing-hidden-material:${hidden}`);
  }
  for (const platform of ['shopify-like', 'woocommerce', 'ec-cube', 'custom-ec'] satisfies MerchantEcPlatformId[]) {
    if (!platforms.has(platform)) errors.push(`missing-platform:${platform}`);
  }
  for (const surface of ['carrier-selection', 'shipment-history', 'webhook-history', 'plugin-settings', 'redaction-policy', 'vey-id-adoption'] satisfies MerchantConsoleSurfaceId[]) {
    if (!surfaces.has(surface)) errors.push(`missing-surface:${surface}`);
  }
  if (!veyIdAdoptionCheck) {
    errors.push('missing-vey-id-adoption-check');
  } else {
    if (veyIdAdoptionCheck.status !== 'ready') errors.push('vey-id-adoption-not-ready');
    if (veyIdAdoptionCheck.localOnly !== true) errors.push('vey-id-adoption-not-local-only');
    if (veyIdAdoptionCheck.productionTraffic !== false) errors.push('vey-id-adoption-production-traffic');
    if (veyIdAdoptionCheck.accountCreationProviders.join('+') !== 'google+apple') errors.push('vey-id-provider-policy-mismatch');
    for (const sdkPackage of ['@veygrit/address-login-react', '@veygrit/address-login-nextjs']) {
      if (!veyIdAdoptionCheck.requiredSdkPackages.includes(sdkPackage)) errors.push(`vey-id-missing-sdk:${sdkPackage}`);
    }
    for (const route of ['GET /veygrit/oauth/authorize', 'POST /veygrit/oauth/token', 'POST /veygrit/connections/revoke']) {
      if (!veyIdAdoptionCheck.requiredRoutes.includes(route)) errors.push(`vey-id-missing-route:${route}`);
    }
    for (const control of ['google-apple-only-account-creation', 'pkce-s256-required', 'pairwise-subject-alias', 'server-side-token-exchange', 'address-wallet-credential-reuse', 'wallet-side-revocation']) {
      if (!veyIdAdoptionCheck.requiredControls.includes(control)) errors.push(`vey-id-missing-control:${control}`);
    }
    for (const visibleRef of ['authorizationCodeRef', 'pairwiseSubjectAlias', 'walletSessionRef', 'addressCredentialRef', 'revocationRef']) {
      if (!veyIdAdoptionCheck.merchantVisibleRefs.includes(visibleRef)) errors.push(`vey-id-missing-visible-ref:${visibleRef}`);
    }
    for (const serverOnlyRef of ['pkceVerifierRef', 'tokenExchangeRef', 'accessTokenRef', 'idTokenRef']) {
      if (!veyIdAdoptionCheck.serverOnlyRefs.includes(serverOnlyRef)) errors.push(`vey-id-missing-server-only-ref:${serverOnlyRef}`);
    }
    for (const blocked of ['rawAddress', 'providerIdToken', 'providerAccessToken', 'providerRefreshToken', 'rawProviderProfile', 'rawVeyIdToken']) {
      if (!veyIdAdoptionCheck.blockedMaterial.includes(blocked)) errors.push(`vey-id-missing-blocked-material:${blocked}`);
    }
    if (JSON.stringify(veyIdAdoptionCheck.merchantVisibleRefs).match(/rawAddress|provider(Id|Access|Refresh)Token|rawProviderProfile|rawVeyIdToken|recipientPhone|privateKey|proofSecret/i)) {
      errors.push('vey-id-visible-private-material');
    }
    for (const command of veyIdAdoptionCheck.verifierCommands) {
      if (!plan.validationGates.includes(command)) errors.push(`vey-id-verifier-not-in-plan:${command}`);
    }
  }
  for (const profile of plan.pluginProfiles) {
    if (!profile.requiredRefs.includes('recipient_id')) errors.push(`plugin-missing-recipient-id:${profile.id}`);
    if (!profile.requiredRefs.includes('carrierCapabilityRef')) errors.push(`plugin-missing-carrier-capability:${profile.id}`);
    for (const blocked of ['rawAddress', 'recipientPhone', 'carrierApiKey', 'webhookSecret']) {
      if (!profile.blockedStorage.includes(blocked)) errors.push(`plugin-missing-blocked-storage:${profile.id}:${blocked}`);
    }
  }
  if (!plan.carrierOptions.some(option => option.carrier === 'dhl' && option.availableInMvp)) errors.push('missing-dhl-option');
  if (!plan.carrierOptions.some(option => option.carrier === 'ups' && option.availableInMvp)) errors.push('missing-ups-option');
  if (!plan.sampleShipmentHistory.every(row => row.recipientDisplayRef.startsWith('aw_rec_'))) errors.push('shipment-row-not-recipient-ref');
  if (!plan.sampleShipmentHistory.every(row => row.carrierCapabilityRef.startsWith('carrier_capability_'))) errors.push('shipment-row-not-carrier-capability-ref');
  if (!plan.sampleWebhookHistory.every(row => row.eventRef.startsWith('webhook_event_ref_'))) errors.push('webhook-row-not-event-ref');
  if (plan.redactionPolicy.addressVisibleByDefault !== false) errors.push('address-visible-by-default');
  if (plan.redactionPolicy.publicRowsUseRefsOnly !== true) errors.push('public-rows-not-ref-only');
  if (text.match(/rawAddressValue|recipientPhoneValue|carrierSecretValue|proofWitnessValue/i)) errors.push('secret-like-value');
  if (!plan.validationGates.includes('npm run verify:carrier-connector-layer')) errors.push('missing-connector-gate');
  if (!plan.validationGates.includes('npm run verify:skipship-strategy')) errors.push('missing-skipship-strategy-gate');
  if (!plan.validationGates.includes('npm run verify:veygrit-id-core-openapi')) errors.push('missing-vey-id-core-gate');
  if (!plan.nonClaims.some(nonClaim => /not a raw address export tool/i.test(nonClaim))) errors.push('missing-raw-export-non-claim');

  return errors;
}

import { buildAddressWalletFriendDeliveryPlan } from './addressWalletFriendDelivery';
import {
  ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION,
  buildAddressWalletCarrierPreflightPreview,
  type AddressWalletCarrierPreflightPreview,
} from './addressWalletCarrierCountryForms';
import { buildAddressWalletRecipientIdSpec } from './addressWalletRecipientId';

export const VEY_ID_ADDRESS_WALLET_FOUNDATION_VERSION = 'vey-id-address-wallet-foundation-v0.1';

export type VeyIdAddressWalletCapabilityId =
  | 'user-authentication'
  | 'address-id-management'
  | 'friend-delivery'
  | 'address-disclosure-approval'
  | 'apple-wallet-pass-foundation'
  | 'google-wallet-pass-foundation'
  | 'qr-handoff-foundation';

export type VeyIdAddressWalletLayer = 'vey-id' | 'address-wallet' | 'hexaship' | 'merchant-app' | 'wallet-pass';

export type VeyIdAddressWalletCapability = {
  id: VeyIdAddressWalletCapabilityId;
  owningLayer: VeyIdAddressWalletLayer;
  purpose: string;
  safeInputs: string[];
  safeOutputs: string[];
  blockedMaterial: string[];
  firstApiSurfaces: string[];
  releaseGates: string[];
  nonClaims: string[];
};

export type VeyIdAddressWalletPassArtifact = {
  id: 'apple-wallet-pass' | 'google-wallet-pass' | 'qr-token';
  displayName: string;
  purpose: 'pickup_or_delivery_handoff' | 'address_wallet_open' | 'recipient_approval';
  safePayloadRefs: string[];
  blockedPayload: string[];
  expiryPolicy: string;
  rotationPolicy: string;
};

export type VeyIdAddressWalletPrivacyThreatBoundaryGate = {
  id:
    | 'merchant-visible-redaction'
    | 'consent-bound-carrier-handoff'
    | 'wallet-pass-short-lived-ref'
    | 'carrier-preflight-sandbox-only';
  owningLayer: VeyIdAddressWalletLayer;
  appliesTo: VeyIdAddressWalletCapabilityId[];
  requiredBlockedMaterial: string[];
  safeEvidenceRefs: string[];
  releaseGates: string[];
  nonClaims: string[];
};

export type VeyIdAddressWalletFoundation = {
  version: typeof VEY_ID_ADDRESS_WALLET_FOUNDATION_VERSION;
  productName: 'Vey ID / Address Wallet';
  thesis: string;
  accountCreationPolicy: {
    allowedProviders: ['google', 'apple'];
    passwordSignupEnabled: false;
    emailPasswordSignupEnabled: false;
    phoneSignupEnabled: false;
    passkeyPurpose: 'step-up-only';
  };
  walletOsNavigation: {
    sideMenu: ['Home', 'Friends', 'Store', 'My Page'];
    homeSections: string[];
    storeSections: ['Topics', 'Discover', 'My Stores'];
    myPageSections: string[];
  };
  layers: Array<{
    id: VeyIdAddressWalletLayer;
    role: string;
    owns: string[];
    mustNotOwn: string[];
  }>;
  capabilities: VeyIdAddressWalletCapability[];
  walletPassArtifacts: VeyIdAddressWalletPassArtifact[];
  privacyThreatBoundaryGates: VeyIdAddressWalletPrivacyThreatBoundaryGate[];
  endToEndFlow: string[];
  linkedPrimitives: {
    recipientIdVersion: string;
    friendDeliveryVersion: string;
    carrierCountryFormsVersion: string;
  };
  carrierPreflightReadinessPreview: AddressWalletCarrierPreflightPreview[];
  validationGates: string[];
  nonClaims: string[];
};

export type VeyIdAddressWalletPassExportAuditArtifact = {
  artifactId: VeyIdAddressWalletPassArtifact['id'];
  displayName: string;
  safePayloadRefs: string[];
  blockedPayload: string[];
  expiryPolicy: string;
  rotationPolicy: string;
  nonClaims: string[];
  localOnly: true;
  productionTraffic: false;
  privateMaterialExposed: boolean;
  forbiddenValueMarkersFound: string[];
};

export type VeyIdAddressWalletPassExportAudit = {
  version: typeof VEY_ID_ADDRESS_WALLET_FOUNDATION_VERSION;
  artifactCount: number;
  artifacts: VeyIdAddressWalletPassExportAuditArtifact[];
  forbiddenValueMarkers: string[];
  localOnly: boolean;
  productionTraffic: boolean;
  privateMaterialExposed: boolean;
  validationErrors: string[];
};

export const VEY_ID_ADDRESS_WALLET_BLOCKED_MATERIAL = [
  'rawAddress',
  'recipientName',
  'recipientPhone',
  'privateDeliveryNotes',
  'selectedAddressBody',
  'proofWitness',
  'proofSecret',
  'privateKey',
  'devicePrivateKey',
  'carrierApiKey',
  'carrierCredential',
  'rawQrPayload',
  'unscopedPassPayload',
] as const;

export const VEY_ID_ADDRESS_WALLET_PASS_EXPORT_FORBIDDEN_VALUE_MARKERS = [
  'rawAddressValue',
  'recipientNameValue',
  'recipientPhoneValue',
  'privateDeliveryNotesValue',
  'selectedAddressBodyValue',
  'proofWitnessValue',
  'proofSecretValue',
  'privateKeyValue',
  'devicePrivateKeyValue',
  'carrierApiKeyValue',
  'carrierCredentialValue',
  'rawQrPayloadValue',
  'unscopedPassPayloadValue',
  'raw_address_value',
  'recipient_phone_value',
  'proof_secret_value',
  'private_key_value',
  'device_private_key_value',
  'carrier_api_key_value',
  'carrier_credential_value',
  'raw_qr_payload_value',
  'unscoped_pass_payload_value',
  'sk_live_',
  'pk_live_',
] as const;

function blockedMaterial() {
  return [...VEY_ID_ADDRESS_WALLET_BLOCKED_MATERIAL];
}

function findPassExportForbiddenValueMarkers(value: string) {
  const normalized = value.toLowerCase();
  return VEY_ID_ADDRESS_WALLET_PASS_EXPORT_FORBIDDEN_VALUE_MARKERS.filter(marker => (
    normalized.includes(marker.toLowerCase())
  ));
}

export function buildVeyIdAddressWalletFoundation(): VeyIdAddressWalletFoundation {
  const recipientSpec = buildAddressWalletRecipientIdSpec();
  const friendDelivery = buildAddressWalletFriendDeliveryPlan();

  return {
    version: VEY_ID_ADDRESS_WALLET_FOUNDATION_VERSION,
    productName: 'Vey ID / Address Wallet',
    thesis:
      'Vey ID authenticates the user, Address Wallet manages recipient IDs, friends, approvals, and wallet pass artifacts, and Hexaship receives only scoped shipment refs for carrier execution.',
    accountCreationPolicy: {
      allowedProviders: ['google', 'apple'],
      passwordSignupEnabled: false,
      emailPasswordSignupEnabled: false,
      phoneSignupEnabled: false,
      passkeyPurpose: 'step-up-only',
    },
    walletOsNavigation: {
      sideMenu: ['Home', 'Friends', 'Store', 'My Page'],
      homeSections: ['My Address', 'Spare Address', 'QR', 'Recent Deliveries', 'Recent Stores'],
      storeSections: ['Topics', 'Discover', 'My Stores'],
      myPageSections: ['Profile', 'Payment Methods', 'Notifications', 'Help', 'Settings'],
    },
    layers: [
      {
        id: 'vey-id',
        role: 'Create and authenticate accounts with Google/Apple only, plus OAuth/OIDC-style session binding, state, nonce, PKCE, and passkey/device step-up for risky approvals.',
        owns: ['pairwise subject alias', 'login session freshness', 'merchant client binding', 'authorization code exchange'],
        mustNotOwn: ['raw address vault', 'carrier production credentials', 'recipient private delivery notes'],
      },
      {
        id: 'address-wallet',
        role: 'Hold address refs, recipient IDs, friend graph aliases, consent history, approval sheets, revocation, and pass/QR issuance.',
        owns: ['recipient_id', 'addressFormVersion', 'friend aliases', 'walletConsentRef', 'approval history', 'pass artifact refs'],
        mustNotOwn: ['merchant order settlement', 'carrier rate card', 'customs final decision'],
      },
      {
        id: 'hexaship',
        role: 'Convert recipient_id and parcel refs into ShipmentIntent, rate quote, carrier allocation, and carrier handoff refs.',
        owns: ['ShipmentIntent', 'carrierCapabilityRef', 'carrierAllocationRef', 'carrierHandoffRef'],
        mustNotOwn: ['wallet private keys', 'recipient social graph', 'unapproved address release'],
      },
      {
        id: 'merchant-app',
        role: 'Use Vey ID login and Address Wallet refs inside EC checkout, CMS plugins, and custom storefronts.',
        owns: ['cartRef', 'merchantOrderRef', 'clientId', 'redirectUri'],
        mustNotOwn: ['recipient raw address by default', 'recipient phone by default', 'carrier credentials'],
      },
      {
        id: 'wallet-pass',
        role: 'Expose short-lived Apple Wallet, Google Wallet, or QR handoff artifacts that open wallet flows or identify approved pickup/delivery refs.',
        owns: ['passRef', 'qrTokenRef', 'expiry', 'rotation counter'],
        mustNotOwn: ['raw QR payload text', 'proof witness', 'long-lived bearer address token'],
      },
    ],
    capabilities: [
      {
        id: 'user-authentication',
        owningLayer: 'vey-id',
        purpose: 'Let EC/app users create or open Vey ID with Google/Apple only and reuse Address Wallet addresses at checkout.',
        safeInputs: ['clientId', 'redirectUri', 'state', 'nonce', 'pkceChallenge', 'scope', 'accountProvider'],
        safeOutputs: ['pairwiseSubjectAlias', 'walletSessionRef', 'sessionFreshUntil', 'authorizationCodeRef', 'accessTokenRef', 'idTokenRef', 'addressCredentialRef'],
        blockedMaterial: blockedMaterial(),
        firstApiSurfaces: ['GET /v1/auth/authorize', 'POST /v1/auth/token', 'POST /v1/auth/logout', 'POST /v1/auth/connections/revoke'],
        releaseGates: ['redirect-uri-allowlist', 'state-nonce-required', 'pkce-required', 'pairwise-subject-alias-required', 'passkey-step-up-policy'],
        nonClaims: ['Vey ID login is not proof of residence unless a separate approved claim says so.'],
      },
      {
        id: 'address-id-management',
        owningLayer: 'address-wallet',
        purpose: 'Create, list, revoke, and rotate recipient IDs without exposing raw address bodies to merchants.',
        safeInputs: ['walletSubjectAlias', 'relationshipRef', 'deliveryPurpose', 'recipientKind', 'consentPolicyRef'],
        safeOutputs: ['recipient_id', 'status', 'required_next_action', 'addressFormVersion'],
        blockedMaterial: blockedMaterial(),
        firstApiSurfaces: ['POST /v1/wallet/recipients', 'GET /v1/wallet/recipients', 'POST /v1/wallet/recipients/{recipient_id}/revoke'],
        releaseGates: ['no-raw-address-default', 'recipient-id-rotation-tested', 'revoked-id-rejected-by-shipment-intent'],
        nonClaims: ['A recipient_id is not a shipping address, address proof, or marketing consent.'],
      },
      {
        id: 'friend-delivery',
        owningLayer: 'address-wallet',
        purpose: 'Let a signed-in purchaser select an Address Wallet friend and ask that recipient to approve delivery material for one order.',
        safeInputs: ['purchaserSubjectAlias', 'friendAlias', 'cartRef', 'merchantOrderRef', 'requestedDisclosureMode'],
        safeOutputs: ['friendDeliveryRequestRef', 'notificationRef', 'approvalRef', 'carrierHandoffRef'],
        blockedMaterial: blockedMaterial(),
        firstApiSurfaces: ['/v1/wallet/friends', '/v1/wallet/friend-delivery/requests', '/v1/wallet/friend-delivery/approvals'],
        releaseGates: ['recipient-approval-required', 'purchaser-never-sees-recipient-address', 'fresh-session-or-step-up'],
        nonClaims: ['Friendship is not proof of residence and approval for one order is not reusable marketing consent.'],
      },
      {
        id: 'address-disclosure-approval',
        owningLayer: 'address-wallet',
        purpose: 'Show who is asking, why, what will be shared, expiry, and revocation before any address material is released.',
        safeInputs: ['approvalRequestRef', 'merchantAlias', 'purpose', 'disclosureMode', 'expiry'],
        safeOutputs: ['walletConsentRef', 'consentEnvelopeRef', 'selectedAddressRef', 'auditReceiptRef'],
        blockedMaterial: blockedMaterial(),
        firstApiSurfaces: ['POST /v1/wallet/approvals', 'POST /v1/wallet/approvals/{approval_ref}/deny', 'POST /v1/wallet/consents/{walletConsentRef}/revoke'],
        releaseGates: ['approval-screen-redaction-scan', 'revocation-history-tested', 'purpose-bound-release'],
        nonClaims: ['Approval does not guarantee carrier acceptance, customs clearance, or final delivery.'],
      },
      {
        id: 'apple-wallet-pass-foundation',
        owningLayer: 'wallet-pass',
        purpose: 'Prepare short-lived Apple Wallet pass references for wallet opening, pickup, or approved delivery handoff.',
        safeInputs: ['walletSubjectAlias', 'passPurpose', 'recipient_id', 'expiry', 'rotationCounter'],
        safeOutputs: ['applePassRef', 'passInstallUrlRef', 'qrTokenRef'],
        blockedMaterial: blockedMaterial(),
        firstApiSurfaces: ['POST /v1/wallet/passes/apple', 'POST /v1/wallet/passes/apple/{passRef}/rotate'],
        releaseGates: ['short-expiry-required', 'pass-payload-redacted', 'device-binding-or-step-up'],
        nonClaims: ['An Apple Wallet pass is a handoff artifact, not legal identity or proof of residence.'],
      },
      {
        id: 'google-wallet-pass-foundation',
        owningLayer: 'wallet-pass',
        purpose: 'Prepare short-lived Google Wallet pass references for wallet opening, pickup, or approved delivery handoff.',
        safeInputs: ['walletSubjectAlias', 'passPurpose', 'recipient_id', 'expiry', 'rotationCounter'],
        safeOutputs: ['googlePassRef', 'saveToGoogleWalletUrlRef', 'qrTokenRef'],
        blockedMaterial: blockedMaterial(),
        firstApiSurfaces: ['POST /v1/wallet/passes/google', 'POST /v1/wallet/passes/google/{passRef}/rotate'],
        releaseGates: ['short-expiry-required', 'pass-payload-redacted', 'device-binding-or-step-up'],
        nonClaims: ['A Google Wallet pass is a handoff artifact, not legal identity or proof of residence.'],
      },
      {
        id: 'qr-handoff-foundation',
        owningLayer: 'wallet-pass',
        purpose: 'Issue rotating QR token refs for pickup, delivery confirmation, wallet opening, or recipient approval entry.',
        safeInputs: ['walletSubjectAlias', 'recipient_id', 'walletConsentRef', 'expiry', 'rotationCounter'],
        safeOutputs: ['qrTokenRef', 'qrDisplayRef', 'requiredNextAction'],
        blockedMaterial: blockedMaterial(),
        firstApiSurfaces: ['POST /v1/wallet/qr-tokens', 'POST /v1/wallet/qr-tokens/{qrTokenRef}/rotate', 'POST /v1/wallet/qr-tokens/{qrTokenRef}/revoke'],
        releaseGates: ['no-raw-qr-payload', 'short-expiry-required', 'revocation-tested'],
        nonClaims: ['A QR token is not a long-lived bearer address token and must not encode raw address text.'],
      },
    ],
    walletPassArtifacts: [
      {
        id: 'apple-wallet-pass',
        displayName: 'Apple Wallet Address Wallet Pass',
        purpose: 'pickup_or_delivery_handoff',
        safePayloadRefs: ['applePassRef', 'walletSubjectAlias', 'recipient_id', 'expiry', 'qrTokenRef'],
        blockedPayload: blockedMaterial(),
        expiryPolicy: 'Short-lived by default; rotate on approval, delivery event, or risk signal.',
        rotationPolicy: 'Every pass update receives a new qrTokenRef and invalidates prior unredeemed handoff tokens.',
      },
      {
        id: 'google-wallet-pass',
        displayName: 'Google Wallet Address Wallet Pass',
        purpose: 'pickup_or_delivery_handoff',
        safePayloadRefs: ['googlePassRef', 'walletSubjectAlias', 'recipient_id', 'expiry', 'qrTokenRef'],
        blockedPayload: blockedMaterial(),
        expiryPolicy: 'Short-lived by default; rotate on approval, delivery event, or risk signal.',
        rotationPolicy: 'Every pass update receives a new qrTokenRef and invalidates prior unredeemed handoff tokens.',
      },
      {
        id: 'qr-token',
        displayName: 'Address Wallet QR Token',
        purpose: 'recipient_approval',
        safePayloadRefs: ['qrTokenRef', 'walletOpenRef', 'approvalRequestRef', 'expiry'],
        blockedPayload: blockedMaterial(),
        expiryPolicy: 'Minutes to hours depending on use case; never indefinite.',
        rotationPolicy: 'Rotate after scan, approval, denial, expiry, or wallet risk step-up.',
      },
    ],
    privacyThreatBoundaryGates: [
      {
        id: 'merchant-visible-redaction',
        owningLayer: 'merchant-app',
        appliesTo: ['user-authentication', 'address-id-management', 'friend-delivery', 'address-disclosure-approval'],
        requiredBlockedMaterial: ['rawAddress', 'recipientName', 'recipientPhone', 'privateDeliveryNotes', 'proofWitness', 'proofSecret', 'privateKey'],
        safeEvidenceRefs: ['pairwiseSubjectAlias', 'recipient_id', 'walletConsentRef', 'addressCredentialRef', 'auditReceiptRef'],
        releaseGates: ['no-raw-address-default', 'purchaser-never-sees-recipient-address', 'approval-screen-redaction-scan'],
        nonClaims: ['Merchant-visible refs are not raw address disclosure, residence proof, or reusable marketing consent.'],
      },
      {
        id: 'consent-bound-carrier-handoff',
        owningLayer: 'hexaship',
        appliesTo: ['friend-delivery', 'address-disclosure-approval'],
        requiredBlockedMaterial: ['rawAddress', 'recipientPhone', 'carrierApiKey', 'carrierCredential', 'proofWitness'],
        safeEvidenceRefs: ['walletConsentRef', 'consentEnvelopeRef', 'carrierHandoffRef', 'ShipmentIntent'],
        releaseGates: ['recipient-approval-required', 'purpose-bound-release', 'revocation-history-tested'],
        nonClaims: ['A consent-bound carrier handoff is not a delivery guarantee, customs clearance, or production carrier credential exchange.'],
      },
      {
        id: 'wallet-pass-short-lived-ref',
        owningLayer: 'wallet-pass',
        appliesTo: ['apple-wallet-pass-foundation', 'google-wallet-pass-foundation', 'qr-handoff-foundation'],
        requiredBlockedMaterial: ['rawQrPayload', 'unscopedPassPayload', 'rawAddress', 'proofWitness', 'privateKey'],
        safeEvidenceRefs: ['applePassRef', 'googlePassRef', 'qrTokenRef', 'walletOpenRef', 'expiry', 'rotationCounter'],
        releaseGates: ['short-expiry-required', 'pass-payload-redacted', 'no-raw-qr-payload', 'revocation-tested'],
        nonClaims: ['Wallet pass and QR artifacts are short-lived refs, not raw address containers or long-lived bearer address tokens.'],
      },
      {
        id: 'carrier-preflight-sandbox-only',
        owningLayer: 'address-wallet',
        appliesTo: ['address-id-management', 'address-disclosure-approval'],
        requiredBlockedMaterial: ['rawAddress', 'recipientPhone', 'carrierApiKey', 'carrierCredential', 'proofWitness', 'privateKey'],
        safeEvidenceRefs: ['countryCode', 'carrier', 'activeNextAction', 'carrierCapabilityRef', 'productionTraffic:false'],
        releaseGates: ['no-raw-address-default', 'purpose-bound-release', 'approval-screen-redaction-scan'],
        nonClaims: ['Carrier preflight previews are fixture-safe readiness refs, not production traffic, rate purchases, labels, or carrier acceptance.'],
      },
    ],
    endToEndFlow: [
      'User creates or opens Vey ID with Google or Apple from the merchant checkout.',
      'Address Wallet returns pairwiseSubjectAlias and walletSessionRef.',
      'Vey ID issues authorizationCodeRef and exchanges it with PKCE for accessTokenRef, idTokenRef, and optional addressCredentialRef.',
      'User chooses self recipient_id, friend recipient_id, or creates a friend-delivery request.',
      'Address Wallet renders a DHL/UPS country form and previews the carrier capability next action.',
      'Recipient approval creates walletConsentRef and consentEnvelopeRef.',
      'Optional Apple Wallet, Google Wallet, or QR token ref is issued as a short-lived handoff artifact.',
      'Hexaship creates ShipmentIntent from recipient_id, parcelProfileRef, carrierCapabilityRef, and walletConsentRef.',
    ],
    linkedPrimitives: {
      recipientIdVersion: recipientSpec.version,
      friendDeliveryVersion: friendDelivery.version,
      carrierCountryFormsVersion: ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION,
    },
    carrierPreflightReadinessPreview: [
      buildAddressWalletCarrierPreflightPreview({ carrier: 'dhl', countryCode: 'JP', includeCarrierCapabilityRef: true }),
      buildAddressWalletCarrierPreflightPreview({ carrier: 'ups', countryCode: 'US' }),
    ],
    validationGates: [
      'npm run verify:vey-id-address-wallet-foundation',
      'npm run verify:vey-id-address-wallet-pass-export-fixture-schema',
      'npm run verify:address-wallet-recipient-id',
      'npm run verify:address-wallet-friend-delivery',
      'npm run verify:address-wallet-carrier-country-forms',
    ],
    nonClaims: [
      'Vey ID / Address Wallet is not a general KYC provider by default.',
      'Wallet pass and QR artifacts are handoff refs, not raw address containers.',
      'Address approval is not a DHL/UPS service guarantee, customs clearance, or final delivery proof.',
    ],
  };
}

export function validateVeyIdAddressWalletPassExportAudit(
  audit: VeyIdAddressWalletPassExportAudit,
): string[] {
  const errors: string[] = [];
  const requiredArtifactIds: VeyIdAddressWalletPassArtifact['id'][] = [
    'apple-wallet-pass',
    'google-wallet-pass',
    'qr-token',
  ];
  const artifactIds = new Set(audit.artifacts.map(artifact => artifact.artifactId));

  if (audit.version !== VEY_ID_ADDRESS_WALLET_FOUNDATION_VERSION) errors.push('pass-export-version-mismatch');
  if (audit.artifactCount !== audit.artifacts.length) errors.push('pass-export-artifact-count-mismatch');
  if (audit.artifactCount === 0) errors.push('pass-export-artifacts-required');
  if (audit.localOnly !== true) errors.push('pass-export-local-only-required');
  if (audit.productionTraffic !== false) errors.push('pass-export-production-traffic-must-be-false');
  for (const artifactId of requiredArtifactIds) {
    if (!artifactIds.has(artifactId)) errors.push(`pass-export-missing-artifact:${artifactId}`);
  }

  for (const artifact of audit.artifacts) {
    if (!artifact.displayName) errors.push(`pass-export-display-name-required:${artifact.artifactId}`);
    if (artifact.localOnly !== true) errors.push(`pass-export-local-only-required:${artifact.artifactId}`);
    if (artifact.productionTraffic !== false) errors.push(`pass-export-production-traffic-must-be-false:${artifact.artifactId}`);
    if (artifact.privateMaterialExposed !== (artifact.forbiddenValueMarkersFound.length > 0)) {
      errors.push(`pass-export-private-material-flag-mismatch:${artifact.artifactId}`);
    }
    if (!artifact.safePayloadRefs.includes('expiry')) errors.push(`pass-export-missing-expiry:${artifact.artifactId}`);
    if (!artifact.blockedPayload.includes('rawQrPayload')) errors.push(`pass-export-missing-raw-qr-block:${artifact.artifactId}`);
    if (!artifact.nonClaims.some(nonClaim => /not raw address disclosure|long-lived bearer address token/i.test(nonClaim))) {
      errors.push(`pass-export-missing-non-claim:${artifact.artifactId}`);
    }
    for (const safeRef of artifact.safePayloadRefs) {
      if (/rawAddress|recipientName|recipientPhone|privateDeliveryNotes|selectedAddressBody|proofWitness|proofSecret|privateKey|devicePrivateKey|carrierApiKey|carrierCredential|rawQrPayload|unscopedPassPayload/i.test(safeRef)) {
        errors.push(`pass-export-unsafe-safe-payload-ref:${artifact.artifactId}:${safeRef}`);
      }
    }
    for (const marker of artifact.forbiddenValueMarkersFound) {
      errors.push(`pass-export-private-value-marker:${artifact.artifactId}:${marker}`);
    }
  }

  if (audit.privateMaterialExposed !== audit.artifacts.some(artifact => artifact.privateMaterialExposed)) {
    errors.push('pass-export-private-material-flag-mismatch');
  }

  return errors;
}

export function buildVeyIdAddressWalletPassExportAudit(
  plan = buildVeyIdAddressWalletFoundation(),
): VeyIdAddressWalletPassExportAudit {
  const artifacts = plan.walletPassArtifacts.map(artifact => {
    const exportPayload = {
      artifactId: artifact.id,
      displayName: artifact.displayName,
      safePayloadRefs: artifact.safePayloadRefs,
      blockedPayload: artifact.blockedPayload,
      expiryPolicy: artifact.expiryPolicy,
      rotationPolicy: artifact.rotationPolicy,
      nonClaims: [
        `${artifact.displayName} export is local-only evidence, not production wallet issuance.`,
        `${artifact.displayName} export is not raw address disclosure, proof of residence, or a long-lived bearer address token.`,
      ],
      localOnly: true,
      productionTraffic: false,
    } as const;
    const forbiddenValueMarkersFound = findPassExportForbiddenValueMarkers(JSON.stringify(exportPayload));

    return {
      ...exportPayload,
      safePayloadRefs: [...artifact.safePayloadRefs],
      blockedPayload: [...artifact.blockedPayload],
      nonClaims: [...exportPayload.nonClaims],
      privateMaterialExposed: forbiddenValueMarkersFound.length > 0,
      forbiddenValueMarkersFound,
    };
  });
  const audit: VeyIdAddressWalletPassExportAudit = {
    version: VEY_ID_ADDRESS_WALLET_FOUNDATION_VERSION,
    artifactCount: artifacts.length,
    artifacts,
    forbiddenValueMarkers: [...VEY_ID_ADDRESS_WALLET_PASS_EXPORT_FORBIDDEN_VALUE_MARKERS],
    localOnly: artifacts.every(artifact => artifact.localOnly === true),
    productionTraffic: artifacts.some(artifact => artifact.productionTraffic !== false),
    privateMaterialExposed: artifacts.some(artifact => artifact.privateMaterialExposed),
    validationErrors: [],
  };

  return {
    ...audit,
    validationErrors: validateVeyIdAddressWalletPassExportAudit(audit),
  };
}

export function validateVeyIdAddressWalletFoundation(plan: VeyIdAddressWalletFoundation): string[] {
  const errors: string[] = [];
  const capabilityIds = new Set(plan.capabilities.map(capability => capability.id));
  const layerIds = new Set(plan.layers.map(layer => layer.id));
  const publicText = JSON.stringify(plan);

  if (plan.version !== VEY_ID_ADDRESS_WALLET_FOUNDATION_VERSION) errors.push('version-mismatch');
  if (plan.productName !== 'Vey ID / Address Wallet') errors.push('product-name-mismatch');
  if (plan.accountCreationPolicy.allowedProviders.join(',') !== 'google,apple') errors.push('account-creation-must-be-google-apple-only');
  if (
    plan.accountCreationPolicy.passwordSignupEnabled
    || plan.accountCreationPolicy.emailPasswordSignupEnabled
    || plan.accountCreationPolicy.phoneSignupEnabled
  ) {
    errors.push('password-email-phone-signup-must-stay-disabled');
  }
  if (plan.accountCreationPolicy.passkeyPurpose !== 'step-up-only') errors.push('passkey-must-be-step-up-only');
  if (plan.walletOsNavigation.sideMenu.join(',') !== 'Home,Friends,Store,My Page') errors.push('wallet-os-side-menu-mismatch');
  for (const section of ['My Address', 'Spare Address', 'QR', 'Recent Deliveries', 'Recent Stores']) {
    if (!plan.walletOsNavigation.homeSections.includes(section)) errors.push(`wallet-os-missing-home-section:${section}`);
  }
  if (plan.walletOsNavigation.storeSections.join(',') !== 'Topics,Discover,My Stores') errors.push('wallet-os-store-section-mismatch');
  for (const section of ['Profile', 'Payment Methods', 'Notifications', 'Help', 'Settings']) {
    if (!plan.walletOsNavigation.myPageSections.includes(section)) errors.push(`wallet-os-missing-my-page-section:${section}`);
  }

  for (const layer of ['vey-id', 'address-wallet', 'hexaship', 'merchant-app', 'wallet-pass'] satisfies VeyIdAddressWalletLayer[]) {
    if (!layerIds.has(layer)) errors.push(`missing-layer:${layer}`);
  }
  for (const capability of [
    'user-authentication',
    'address-id-management',
    'friend-delivery',
    'address-disclosure-approval',
    'apple-wallet-pass-foundation',
    'google-wallet-pass-foundation',
    'qr-handoff-foundation',
  ] satisfies VeyIdAddressWalletCapabilityId[]) {
    if (!capabilityIds.has(capability)) errors.push(`missing-capability:${capability}`);
  }

  for (const capability of plan.capabilities) {
    if (!layerIds.has(capability.owningLayer)) errors.push(`capability-unknown-layer:${capability.id}`);
    if (!capability.firstApiSurfaces.length) errors.push(`capability-missing-api:${capability.id}`);
    if (!capability.releaseGates.length) errors.push(`capability-missing-release-gate:${capability.id}`);
    for (const key of ['rawAddress', 'recipientPhone', 'proofWitness', 'privateKey', 'carrierApiKey']) {
      if (!capability.blockedMaterial.includes(key)) errors.push(`capability-missing-blocked-material:${capability.id}:${key}`);
    }
  }

  const boundaryIds = new Set(plan.privacyThreatBoundaryGates.map(boundary => boundary.id));
  for (const boundary of [
    'merchant-visible-redaction',
    'consent-bound-carrier-handoff',
    'wallet-pass-short-lived-ref',
    'carrier-preflight-sandbox-only',
  ] satisfies VeyIdAddressWalletPrivacyThreatBoundaryGate['id'][]) {
    if (!boundaryIds.has(boundary)) errors.push(`missing-privacy-threat-boundary:${boundary}`);
  }
  for (const boundary of plan.privacyThreatBoundaryGates) {
    if (!layerIds.has(boundary.owningLayer)) errors.push(`boundary-unknown-layer:${boundary.id}`);
    if (!boundary.appliesTo.length) errors.push(`boundary-missing-capability:${boundary.id}`);
    if (!boundary.nonClaims.length) errors.push(`boundary-missing-non-claim:${boundary.id}`);
    if (boundary.safeEvidenceRefs.some(ref => /rawAddress|recipientPhone|proofWitness|privateKey|carrierApiKey|proofSecret/i.test(ref))) {
      errors.push(`boundary-unsafe-evidence-ref:${boundary.id}`);
    }
    for (const capabilityId of boundary.appliesTo) {
      const capability = plan.capabilities.find(item => item.id === capabilityId);
      if (!capability) {
        errors.push(`boundary-unknown-capability:${boundary.id}:${capabilityId}`);
        continue;
      }
      for (const material of boundary.requiredBlockedMaterial) {
        if (!capability.blockedMaterial.includes(material)) {
          errors.push(`boundary-capability-missing-blocked-material:${boundary.id}:${capabilityId}:${material}`);
        }
      }
    }
  }

  for (const artifact of plan.walletPassArtifacts) {
    if (!artifact.safePayloadRefs.some(ref => /Ref|Alias|recipient_id|expiry/.test(ref))) errors.push(`pass-missing-safe-ref:${artifact.id}`);
    if (!artifact.expiryPolicy.match(/Short-lived|Minutes/i)) errors.push(`pass-missing-short-expiry:${artifact.id}`);
    if (!artifact.rotationPolicy.match(/Rotate|rotat|invalidates/i)) errors.push(`pass-missing-rotation:${artifact.id}`);
    if (!artifact.blockedPayload.includes('rawQrPayload')) errors.push(`pass-missing-raw-qr-block:${artifact.id}`);
  }

  if (!plan.validationGates.includes('npm run verify:address-wallet-recipient-id')) errors.push('missing-recipient-id-gate');
  if (!plan.validationGates.includes('npm run verify:address-wallet-friend-delivery')) errors.push('missing-friend-delivery-gate');
  if (!plan.validationGates.includes('npm run verify:address-wallet-carrier-country-forms')) errors.push('missing-carrier-country-forms-gate');
  if (!plan.validationGates.includes('npm run verify:vey-id-address-wallet-pass-export-fixture-schema')) errors.push('missing-pass-export-fixture-schema-gate');
  if (plan.linkedPrimitives.carrierCountryFormsVersion !== ADDRESS_WALLET_CARRIER_COUNTRY_FORMS_VERSION) errors.push('carrier-country-forms-version-mismatch');
  if (!plan.carrierPreflightReadinessPreview.some(preview => preview.activeNextAction === 'ready_for_hexaship_createShipment')) errors.push('missing-ready-carrier-preflight-preview');
  if (!plan.carrierPreflightReadinessPreview.some(preview => preview.activeNextAction === 'run_carrier_capability_check')) errors.push('missing-capability-check-preview');
  if (plan.carrierPreflightReadinessPreview.some(preview => preview.productionTraffic || preview.privateMaterialExposed)) errors.push('unsafe-carrier-preflight-preview');
  for (const error of buildVeyIdAddressWalletPassExportAudit(plan).validationErrors) {
    errors.push(`pass-export:${error}`);
  }
  if (!plan.nonClaims.some(nonClaim => /handoff refs/i.test(nonClaim))) errors.push('missing-pass-non-claim');
  if (publicText.match(/sk_live|proofSecretValue|privateKeyValue|carrierSecretValue/i)) errors.push('secret-like-value');

  return errors;
}

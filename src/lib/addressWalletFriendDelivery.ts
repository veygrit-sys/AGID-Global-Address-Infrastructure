export const ADDRESS_WALLET_FRIEND_DELIVERY_VERSION = 'address-wallet-friend-delivery-v0.1';

export type FriendDeliveryActor = 'purchaser' | 'recipient' | 'address-wallet' | 'merchant' | 'carrier';
export type FriendDeliveryDisclosureMode = 'carrier_decryptable_preferred' | 'merchant_visible_legacy_label';
export type FriendDeliveryStepId =
  | 'wallet-sso'
  | 'cart'
  | 'select-wallet-friend'
  | 'create-address-request'
  | 'recipient-push'
  | 'recipient-approval'
  | 'address-release'
  | 'label-or-handoff'
  | 'carrier-delivery'
  | 'audit-history';

export type FriendDeliveryApiSurface = {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  purpose: string;
  actor: FriendDeliveryActor;
  safeInputs: string[];
  safeOutputs: string[];
  blockedMaterial: string[];
};

export type FriendDeliveryFlowStep = {
  id: FriendDeliveryStepId;
  actor: FriendDeliveryActor;
  title: string;
  description: string;
  safeVisibleData: string[];
  blockedVisibleData: string[];
  requiresFreshLogin: boolean;
};

export type FriendDeliveryConsentState = {
  state: 'requested' | 'notified' | 'approved' | 'released' | 'revoked' | 'expired' | 'denied';
  allowedNext: Array<FriendDeliveryConsentState['state']>;
  invariant: string;
};

export type AddressWalletFriendDeliveryPlan = {
  version: typeof ADDRESS_WALLET_FRIEND_DELIVERY_VERSION;
  productName: 'Address Wallet Friend Delivery';
  thesis: string;
  defaultDisclosureMode: FriendDeliveryDisclosureMode;
  supportedDisclosureModes: Array<{
    mode: FriendDeliveryDisclosureMode;
    useWhen: string;
    merchantReceives: string[];
    purchaserNeverSees: string[];
    safeguards: string[];
    nonClaims: string[];
  }>;
  ssoPolicy: {
    socialLoginSurface: 'Address Wallet';
    checkoutReauthRequiredWhenWalletSessionFresh: false;
    freshnessWindowSeconds: number;
    mustReauthWhen: string[];
  };
  flow: FriendDeliveryFlowStep[];
  apiSurfaces: FriendDeliveryApiSurface[];
  consentStateMachine: FriendDeliveryConsentState[];
  userBenefits: Record<'purchaser' | 'recipient' | 'merchant', string[]>;
  securityAndPrivacyBoundaries: string[];
  nonClaims: string[];
};

export type FriendDeliveryMerchantScenarioStep = {
  id:
    | 'checkout-select-friend'
    | 'server-create-request'
    | 'wallet-notify'
    | 'wallet-approve'
    | 'server-receive-handoff';
  actor: FriendDeliveryActor;
  inputRefs: string[];
  outputRefs: string[];
  invariant: string;
};

export type FriendDeliveryMerchantScenario = {
  id: string;
  purpose: 'anonymous_shipping';
  disclosureMode: 'carrier_decryptable_preferred';
  purchaserSubjectAlias: string;
  friendAlias: string;
  cartRef: string;
  friendDeliveryRequestRef: string;
  notificationRef: string;
  approvalRef: string;
  selectedAddressRef: string;
  consentEnvelopeRef: string;
  carrierHandoffRef: string;
  deliveryReceiptRef: string;
  merchantVisibleRefs: string[];
  purchaserNeverSees: string[];
  steps: FriendDeliveryMerchantScenarioStep[];
};

export function buildAddressWalletFriendDeliveryPlan(): AddressWalletFriendDeliveryPlan {
  return {
    version: ADDRESS_WALLET_FRIEND_DELIVERY_VERSION,
    productName: 'Address Wallet Friend Delivery',
    thesis:
      'Address Wallet Friend Delivery turns checkout shipping from address entry into people selection: a wallet-authenticated purchaser selects a friend, the recipient approves the request in their wallet, and only the authorized merchant or carrier execution channel receives the delivery material needed for that order.',
    defaultDisclosureMode: 'carrier_decryptable_preferred',
    supportedDisclosureModes: [
      {
        mode: 'carrier_decryptable_preferred',
        useWhen: 'The merchant can route shipping through Delivery Gateway or a carrier handoff adapter.',
        merchantReceives: ['friendDeliveryRequestRef', 'recipientAlias', 'deliverabilityClaim', 'carrierHandoffRef', 'deliveryReceiptRef'],
        purchaserNeverSees: ['recipientAddress', 'recipientPhone', 'privateDeliveryNotes', 'addressCredentialBody'],
        safeguards: ['recipient approval required', 'carrier scope required', 'short expiry', 'revocation receipt', 'redacted merchant callback'],
        nonClaims: ['Carrier decryptable mode is not proof of residence.', 'Carrier handoff does not guarantee final delivery.'],
      },
      {
        mode: 'merchant_visible_legacy_label',
        useWhen: 'The EC already has a legacy warehouse or label system that requires a full shipping address after explicit recipient approval.',
        merchantReceives: ['shippingAddressReleaseRef', 'labelAllowedPurpose', 'recipientSelectedAddressRef', 'auditReceiptRef'],
        purchaserNeverSees: ['recipientAddress', 'recipientPhone', 'privateDeliveryNotes', 'addressCredentialBody'],
        safeguards: ['recipient approval required', 'merchant role limited to fulfillment', 'address display hidden from purchaser UI', 'retention policy required', 'audit event required'],
        nonClaims: ['Merchant-visible legacy label mode is an elevated disclosure mode.', 'Recipient approval for one order is not reusable marketing consent.'],
      },
    ],
    ssoPolicy: {
      socialLoginSurface: 'Address Wallet',
      checkoutReauthRequiredWhenWalletSessionFresh: false,
      freshnessWindowSeconds: 1800,
      mustReauthWhen: ['wallet session expired', 'risk step-up required', 'friend request amount or item policy changes', 'device binding mismatch'],
    },
    flow: [
      {
        id: 'wallet-sso',
        actor: 'purchaser',
        title: 'Purchaser signs in to EC with Address Wallet',
        description: 'The wallet session acts as the social login session for checkout.',
        safeVisibleData: ['pairwise purchaser alias', 'wallet session freshness', 'merchant client id'],
        blockedVisibleData: ['recipient address', 'recipient phone', 'recipient private notes'],
        requiresFreshLogin: false,
      },
      {
        id: 'cart',
        actor: 'purchaser',
        title: 'Purchaser adds products to cart',
        description: 'The merchant keeps ordinary cart and payment flow while shipping stays alias-first.',
        safeVisibleData: ['cart item summary', 'merchant order alias'],
        blockedVisibleData: ['recipient address', 'recipient proof witness'],
        requiresFreshLogin: false,
      },
      {
        id: 'select-wallet-friend',
        actor: 'purchaser',
        title: 'Purchaser selects an Address Wallet friend',
        description: 'The checkout destination is a friend alias, not a visible address.',
        safeVisibleData: ['friend display name', 'friend avatar or alias', 'deliverability region hint'],
        blockedVisibleData: ['friend raw address', 'friend phone', 'friend saved address list'],
        requiresFreshLogin: false,
      },
      {
        id: 'create-address-request',
        actor: 'merchant',
        title: 'Merchant creates an address release request',
        description: 'The request binds order alias, item summary, purpose, expiry, and disclosure mode.',
        safeVisibleData: ['friendDeliveryRequestRef', 'orderAlias', 'purpose', 'expiry', 'requestedDisclosureMode'],
        blockedVisibleData: ['raw address', 'recipient contact', 'private key'],
        requiresFreshLogin: false,
      },
      {
        id: 'recipient-push',
        actor: 'address-wallet',
        title: 'Recipient receives a wallet push notification',
        description: 'The notification contains item and sender context but no address body.',
        safeVisibleData: ['sender alias', 'merchant alias', 'item summary', 'approval expiry'],
        blockedVisibleData: ['selected address', 'phone', 'private delivery notes'],
        requiresFreshLogin: false,
      },
      {
        id: 'recipient-approval',
        actor: 'recipient',
        title: 'Recipient chooses an address and approves',
        description: 'The recipient selects which saved address can be used for this one delivery.',
        safeVisibleData: ['address nickname', 'city or region hint', 'delivery window policy', 'who receives disclosure'],
        blockedVisibleData: ['address shown to purchaser', 'long-lived merchant token', 'marketing consent'],
        requiresFreshLogin: true,
      },
      {
        id: 'address-release',
        actor: 'address-wallet',
        title: 'Wallet releases only the approved delivery material',
        description: 'The release follows either carrier-decryptable preferred mode or explicit merchant-visible legacy label mode.',
        safeVisibleData: ['releaseRef', 'consentEnvelopeId', 'disclosureMode', 'auditReceiptRef'],
        blockedVisibleData: ['address to purchaser', 'unscoped decrypt material', 'proof witness'],
        requiresFreshLogin: false,
      },
      {
        id: 'label-or-handoff',
        actor: 'merchant',
        title: 'Merchant creates label or carrier handoff',
        description: 'Existing logistics can continue, but the UI must keep recipient address hidden from purchaser.',
        safeVisibleData: ['labelRef', 'carrierHandoffRef', 'deliveryGatewayRateRef'],
        blockedVisibleData: ['buyer-visible recipient address', 'carrier API key in client', 'raw label payload in public logs'],
        requiresFreshLogin: false,
      },
      {
        id: 'carrier-delivery',
        actor: 'carrier',
        title: 'Carrier delivers the parcel',
        description: 'Delivery events return redacted receipts to merchant and wallet.',
        safeVisibleData: ['trackingReceiptRef', 'deliveryProofRef', 'status'],
        blockedVisibleData: ['recipient address in analytics', 'proof witness in webhook'],
        requiresFreshLogin: false,
      },
      {
        id: 'audit-history',
        actor: 'recipient',
        title: 'Recipient can review disclosure history',
        description: 'The wallet shows who requested address use, when it was approved, and what was disclosed.',
        safeVisibleData: ['merchant alias', 'sender alias', 'purpose', 'timestamp', 'disclosure mode', 'revocation state'],
        blockedVisibleData: ['unbounded address export', 'hidden reuse by merchant'],
        requiresFreshLogin: false,
      },
    ],
    apiSurfaces: [
      {
        id: 'friend-list',
        method: 'GET',
        path: '/v1/wallet/friends',
        purpose: 'Return wallet friend aliases available for checkout destination selection.',
        actor: 'purchaser',
        safeInputs: ['walletSessionRef', 'merchantClientId'],
        safeOutputs: ['friendAlias', 'displayName', 'avatarRef', 'deliverabilityRegionHint'],
        blockedMaterial: ['friendRawAddress', 'friendPhone', 'friendAddressList'],
      },
      {
        id: 'friend-delivery-request',
        method: 'POST',
        path: '/v1/wallet/friend-delivery/requests',
        purpose: 'Create a recipient approval request bound to order alias, item summary, purpose, expiry, and disclosure mode.',
        actor: 'merchant',
        safeInputs: ['purchaserSubjectAlias', 'recipientFriendAlias', 'orderAlias', 'itemSummaryRef', 'requestedDisclosureMode'],
        safeOutputs: ['friendDeliveryRequestRef', 'recipientNotificationRef', 'expiresAt'],
        blockedMaterial: ['rawAddress', 'recipientPhone', 'proofWitness', 'privateKey'],
      },
      {
        id: 'recipient-approval',
        method: 'POST',
        path: '/v1/wallet/friend-delivery/approvals',
        purpose: 'Recipient approves or denies the request and selects an address reference for one delivery.',
        actor: 'recipient',
        safeInputs: ['friendDeliveryRequestRef', 'selectedAddressRef', 'approvalDecision', 'deviceApprovalRef'],
        safeOutputs: ['consentEnvelopeId', 'releaseRef', 'auditReceiptRef'],
        blockedMaterial: ['addressShownToPurchaser', 'proofSecret', 'privateKey'],
      },
      {
        id: 'release-or-handoff',
        method: 'POST',
        path: '/v1/wallet/friend-delivery/releases',
        purpose: 'Return either a carrier handoff ref or an elevated merchant-visible release ref after approval.',
        actor: 'address-wallet',
        safeInputs: ['releaseRef', 'merchantClientId', 'carrierId', 'fulfillmentPurpose'],
        safeOutputs: ['carrierHandoffRef', 'shippingAddressReleaseRef', 'redactedReceiptRef'],
        blockedMaterial: ['buyerVisibleAddress', 'unscopedDecryptMaterial', 'rawAddressInPublicLogs'],
      },
    ],
    consentStateMachine: [
      { state: 'requested', allowedNext: ['notified', 'expired', 'denied'], invariant: 'Request has order alias, recipient alias, purpose, disclosure mode, and expiry.' },
      { state: 'notified', allowedNext: ['approved', 'denied', 'expired'], invariant: 'Push notification does not contain raw address or phone.' },
      { state: 'approved', allowedNext: ['released', 'revoked', 'expired'], invariant: 'Recipient selected an address ref and device approval is fresh.' },
      { state: 'released', allowedNext: ['revoked'], invariant: 'Release is scoped to one order and one fulfillment purpose.' },
      { state: 'revoked', allowedNext: [], invariant: 'Future reuse is blocked and merchant receives a revocation receipt.' },
      { state: 'expired', allowedNext: [], invariant: 'No address release occurs after expiry.' },
      { state: 'denied', allowedNext: [], invariant: 'Merchant receives denial state without recipient address.' },
    ],
    userBenefits: {
      purchaser: ['No need to ask for a friend address.', 'No checkout re-login when Address Wallet session is fresh.', 'One-tap friend destination selection.'],
      recipient: ['Address remains hidden from purchaser.', 'Recipient selects the address per delivery.', 'Recipient can audit who received disclosure and revoke future reuse.'],
      merchant: ['Simpler checkout destination UX.', 'Fewer address entry errors.', 'Gift delivery becomes addressless for the buyer.', 'Legacy logistics can keep label creation after explicit recipient approval.'],
    },
    securityAndPrivacyBoundaries: [
      'Purchaser never sees recipient raw address, phone, private notes, proof witness, or address credential body.',
      'Recipient approval is mandatory before merchant-visible legacy release or carrier handoff.',
      'Checkout SSO avoids repeat login only while the wallet session is fresh and device binding still matches.',
      'Merchant-visible address release is elevated and must be purpose-bound, audited, retained narrowly, and hidden from purchaser UI.',
      'Carrier-decryptable handoff remains the preferred mode for merchants that can use Delivery Gateway.',
    ],
    nonClaims: [
      'Address Wallet friendship is not proof of residence.',
      'Recipient approval for a delivery is not reusable marketing consent.',
      'Friend delivery does not guarantee carrier acceptance or final delivery.',
      'SSO freshness is not a substitute for recipient-side approval.',
    ],
  };
}

export function buildFriendDeliveryMerchantScenario(): FriendDeliveryMerchantScenario {
  return {
    id: 'synthetic-friend-delivery-merchant-scenario-v0.1',
    purpose: 'anonymous_shipping',
    disclosureMode: 'carrier_decryptable_preferred',
    purchaserSubjectAlias: 'pairwise_sub_synthetic_buyer_001',
    friendAlias: 'friend_alias_synthetic_001',
    cartRef: 'cart_ref_synthetic_gift_001',
    friendDeliveryRequestRef: 'fdr_synthetic_gift_001',
    notificationRef: 'wallet_notification_ref_synthetic_gift_001',
    approvalRef: 'approval_ref_synthetic_gift_001',
    selectedAddressRef: 'address_ref_synthetic_friend_selected_001',
    consentEnvelopeRef: 'ace_synthetic_friend_delivery_001',
    carrierHandoffRef: 'handoff_ref_synthetic_friend_delivery_001',
    deliveryReceiptRef: 'delivery_receipt_ref_synthetic_friend_delivery_001',
    merchantVisibleRefs: [
      'fdr_synthetic_gift_001',
      'ace_synthetic_friend_delivery_001',
      'handoff_ref_synthetic_friend_delivery_001',
      'delivery_receipt_ref_synthetic_friend_delivery_001',
    ],
    purchaserNeverSees: [
      'selectedAddressRef',
      'carrierHandoffRef',
      'deliveryReceiptRef',
      'addressCredentialBody',
    ],
    steps: [
      {
        id: 'checkout-select-friend',
        actor: 'purchaser',
        inputRefs: ['pairwise_sub_synthetic_buyer_001', 'cart_ref_synthetic_gift_001'],
        outputRefs: ['friend_alias_synthetic_001'],
        invariant: 'Purchaser selects a friend alias and does not see address refs or carrier handoff refs.',
      },
      {
        id: 'server-create-request',
        actor: 'merchant',
        inputRefs: ['pairwise_sub_synthetic_buyer_001', 'friend_alias_synthetic_001', 'cart_ref_synthetic_gift_001'],
        outputRefs: ['fdr_synthetic_gift_001'],
        invariant: 'Merchant server creates a request with server authorization, not browser credentials.',
      },
      {
        id: 'wallet-notify',
        actor: 'address-wallet',
        inputRefs: ['fdr_synthetic_gift_001'],
        outputRefs: ['wallet_notification_ref_synthetic_gift_001'],
        invariant: 'Wallet notification carries order context and refs only.',
      },
      {
        id: 'wallet-approve',
        actor: 'recipient',
        inputRefs: ['fdr_synthetic_gift_001', 'address_ref_synthetic_friend_selected_001'],
        outputRefs: ['approval_ref_synthetic_gift_001', 'ace_synthetic_friend_delivery_001'],
        invariant: 'Approval binds one selected address ref to one request ref.',
      },
      {
        id: 'server-receive-handoff',
        actor: 'merchant',
        inputRefs: ['approval_ref_synthetic_gift_001', 'ace_synthetic_friend_delivery_001'],
        outputRefs: ['handoff_ref_synthetic_friend_delivery_001', 'delivery_receipt_ref_synthetic_friend_delivery_001'],
        invariant: 'Merchant receives fulfillment refs and still does not reveal delivery material to purchaser UI.',
      },
    ],
  };
}

export function validateAddressWalletFriendDeliveryPlan(
  plan = buildAddressWalletFriendDeliveryPlan(),
): string[] {
  const errors: string[] = [];
  const stepIds = new Set(plan.flow.map(step => step.id));
  const states = new Set(plan.consentStateMachine.map(state => state.state));

  for (const required of ['wallet-sso', 'select-wallet-friend', 'recipient-approval', 'address-release', 'audit-history'] satisfies FriendDeliveryStepId[]) {
    if (!stepIds.has(required)) errors.push(`missing-flow-step:${required}`);
  }
  for (const required of ['requested', 'notified', 'approved', 'released', 'denied']) {
    if (!states.has(required as never)) errors.push(`missing-consent-state:${required}`);
  }
  if (plan.ssoPolicy.checkoutReauthRequiredWhenWalletSessionFresh !== false) errors.push('checkout-reauth-not-disabled-for-fresh-wallet-session');
  if (!plan.supportedDisclosureModes.some(mode => mode.mode === 'merchant_visible_legacy_label')) errors.push('missing-legacy-merchant-visible-mode');
  if (!plan.supportedDisclosureModes.some(mode => mode.mode === plan.defaultDisclosureMode)) errors.push('default-disclosure-mode-not-supported');

  const purchaserVisible = plan.flow
    .filter(step => step.actor === 'purchaser')
    .flatMap(step => step.safeVisibleData)
    .join(' ');
  if (/address|phone|delivery notes/i.test(purchaserVisible)) errors.push('purchaser-safe-visible-data-leaks-recipient-material');

  const allBlocked = [
    ...plan.apiSurfaces.flatMap(surface => surface.blockedMaterial),
    ...plan.flow.flatMap(step => step.blockedVisibleData),
    ...plan.securityAndPrivacyBoundaries,
  ].join(' ');
  for (const required of ['rawAddress', 'recipientPhone', 'proofWitness', 'privateKey']) {
    if (!new RegExp(required, 'i').test(allBlocked)) errors.push(`missing-blocked-material:${required}`);
  }

  const approved = plan.consentStateMachine.find(state => state.state === 'approved');
  if (!approved?.allowedNext.includes('released')) errors.push('approval-does-not-allow-release');
  const requested = plan.consentStateMachine.find(state => state.state === 'requested');
  if (requested?.allowedNext.includes('released')) errors.push('request-can-release-without-approval');
  if (!plan.nonClaims.some(nonClaim => /not reusable marketing consent/i.test(nonClaim))) errors.push('missing-marketing-consent-non-claim');

  return errors;
}

export function validateFriendDeliveryMerchantScenario(
  scenario = buildFriendDeliveryMerchantScenario(),
): string[] {
  const errors: string[] = [];
  const refs = new Set<string>();
  for (const step of scenario.steps) {
    for (const ref of step.inputRefs) refs.add(ref);
    for (const ref of step.outputRefs) refs.add(ref);
  }

  for (const required of [
    scenario.purchaserSubjectAlias,
    scenario.friendAlias,
    scenario.cartRef,
    scenario.friendDeliveryRequestRef,
    scenario.notificationRef,
    scenario.approvalRef,
    scenario.selectedAddressRef,
    scenario.consentEnvelopeRef,
    scenario.carrierHandoffRef,
    scenario.deliveryReceiptRef,
  ]) {
    if (!refs.has(required)) errors.push(`scenario-ref-not-linked:${required}`);
  }

  if (scenario.purpose !== 'anonymous_shipping') errors.push('scenario-purpose-not-anonymous-shipping');
  if (scenario.disclosureMode !== 'carrier_decryptable_preferred') errors.push('scenario-not-carrier-decryptable-preferred');
  if (!scenario.merchantVisibleRefs.includes(scenario.carrierHandoffRef)) errors.push('scenario-missing-carrier-handoff-merchant-ref');
  if (!scenario.purchaserNeverSees.includes('selectedAddressRef')) errors.push('scenario-purchaser-may-see-selected-address-ref');
  if (scenario.steps.findIndex(step => step.id === 'wallet-approve') > scenario.steps.findIndex(step => step.id === 'server-receive-handoff')) {
    errors.push('scenario-handoff-before-approval');
  }

  const publicText = JSON.stringify({
    ...scenario,
    // Names of intentionally blocked symbolic fields are allowed in purchaserNeverSees.
    purchaserNeverSees: [],
  });
  if (/rawAddress|recipientPhone|proofWitness|privateKey|proofSecret|sk_live/i.test(publicText)) {
    errors.push('scenario-contains-forbidden-material');
  }

  return errors;
}

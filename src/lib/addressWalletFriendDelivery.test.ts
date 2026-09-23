import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildAddressWalletFriendDeliveryPlan,
  buildFriendDeliveryMerchantScenario,
  validateAddressWalletFriendDeliveryPlan,
  validateFriendDeliveryMerchantScenario,
} from './addressWalletFriendDelivery';

test('Address Wallet friend delivery validates as SSO checkout design', () => {
  const plan = buildAddressWalletFriendDeliveryPlan();

  assert.deepEqual(validateAddressWalletFriendDeliveryPlan(plan), []);
  assert.equal(plan.productName, 'Address Wallet Friend Delivery');
  assert.equal(plan.ssoPolicy.socialLoginSurface, 'Address Wallet');
  assert.equal(plan.ssoPolicy.checkoutReauthRequiredWhenWalletSessionFresh, false);
  assert.equal(plan.defaultDisclosureMode, 'carrier_decryptable_preferred');
});

test('friend delivery flow keeps purchaser selection addressless while recipient approves disclosure', () => {
  const plan = buildAddressWalletFriendDeliveryPlan();
  const friendSelection = plan.flow.find(step => step.id === 'select-wallet-friend');
  const recipientApproval = plan.flow.find(step => step.id === 'recipient-approval');
  const release = plan.flow.find(step => step.id === 'address-release');

  assert.ok(friendSelection);
  assert.match(friendSelection.safeVisibleData.join(' '), /friend display name/i);
  assert.doesNotMatch(friendSelection.safeVisibleData.join(' '), /raw address|phone/i);
  assert.ok(recipientApproval?.requiresFreshLogin);
  assert.match(recipientApproval?.description ?? '', /selects which saved address/i);
  assert.match(release?.description ?? '', /carrier-decryptable preferred mode|merchant-visible legacy label mode/i);
});

test('friend delivery state machine cannot release before recipient approval', () => {
  const plan = buildAddressWalletFriendDeliveryPlan();
  const requested = plan.consentStateMachine.find(state => state.state === 'requested');
  const notified = plan.consentStateMachine.find(state => state.state === 'notified');
  const approved = plan.consentStateMachine.find(state => state.state === 'approved');
  const denied = plan.consentStateMachine.find(state => state.state === 'denied');

  assert.ok(requested);
  assert.ok(notified);
  assert.ok(approved);
  assert.deepEqual(denied?.allowedNext, []);
  assert.ok(!requested.allowedNext.includes('released'));
  assert.ok(!notified.allowedNext.includes('released'));
  assert.ok(approved.allowedNext.includes('released'));
});

test('friend delivery supports legacy EC label systems without exposing recipient address to purchaser', () => {
  const plan = buildAddressWalletFriendDeliveryPlan();
  const legacy = plan.supportedDisclosureModes.find(mode => mode.mode === 'merchant_visible_legacy_label');
  const carrier = plan.supportedDisclosureModes.find(mode => mode.mode === 'carrier_decryptable_preferred');

  assert.ok(legacy);
  assert.ok(carrier);
  assert.match(legacy.useWhen, /legacy warehouse or label system/i);
  assert.ok(legacy.merchantReceives.includes('shippingAddressReleaseRef'));
  assert.ok(legacy.purchaserNeverSees.includes('recipientAddress'));
  assert.match(legacy.nonClaims.join(' '), /elevated disclosure mode/i);
});

test('friend delivery API surfaces are ref-only and block private material', () => {
  const plan = buildAddressWalletFriendDeliveryPlan();
  const requestSurface = plan.apiSurfaces.find(surface => surface.id === 'friend-delivery-request');
  const approvalSurface = plan.apiSurfaces.find(surface => surface.id === 'recipient-approval');

  assert.ok(requestSurface);
  assert.ok(approvalSurface);
  assert.equal(requestSurface.path, '/v1/wallet/friend-delivery/requests');
  assert.ok(requestSurface.safeInputs.includes('recipientFriendAlias'));
  assert.ok(approvalSurface.safeInputs.includes('selectedAddressRef'));
  assert.ok(plan.apiSurfaces.every(surface => surface.blockedMaterial.length > 0));
  assert.doesNotMatch(JSON.stringify(plan.apiSurfaces.map(surface => surface.safeOutputs)), /rawAddress|recipientPhone|proofWitness|privateKey/);
});

test('merchant-side friend delivery scenario links friend alias to carrier handoff refs', () => {
  const scenario = buildFriendDeliveryMerchantScenario();

  assert.deepEqual(validateFriendDeliveryMerchantScenario(scenario), []);
  assert.equal(scenario.purpose, 'anonymous_shipping');
  assert.equal(scenario.disclosureMode, 'carrier_decryptable_preferred');
  assert.equal(scenario.friendAlias, 'friend_alias_synthetic_001');
  assert.equal(scenario.friendDeliveryRequestRef, 'fdr_synthetic_gift_001');
  assert.equal(scenario.approvalRef, 'approval_ref_synthetic_gift_001');
  assert.equal(scenario.carrierHandoffRef, 'handoff_ref_synthetic_friend_delivery_001');
  assert.ok(scenario.merchantVisibleRefs.includes(scenario.deliveryReceiptRef));
  assert.ok(scenario.purchaserNeverSees.includes('selectedAddressRef'));

  const stepIds = scenario.steps.map(step => step.id);
  assert.ok(stepIds.indexOf('wallet-approve') < stepIds.indexOf('server-receive-handoff'));
  assert.doesNotMatch(JSON.stringify(scenario), /rawAddress|recipientPhone|proofWitness|privateKey|proofSecret|sk_live/i);
});

test('friend delivery is documented and has a package verification gate', () => {
  const doc = readFileSync('docs/product/address-wallet-friend-delivery.md', 'utf8');
  const integrationDoc = readFileSync('docs/product/address-wallet-friend-delivery-integration.md', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };

  assert.match(doc, /Address Wallet Friend Delivery/);
  assert.match(doc, /SSO/);
  assert.match(doc, /友達/);
  assert.match(doc, /購入者には住所を表示しない/);
  assert.match(doc, /merchant_visible_legacy_label/);
  assert.match(integrationDoc, /CheckoutFriendDelivery\.tsx/);
  assert.match(integrationDoc, /friend-delivery\/request\/route\.ts/);
  assert.match(integrationDoc, /friend-delivery\/approval\/route\.ts/);
  assert.match(integrationDoc, /VEYGRIT_SERVER_ACCESS_TOKEN/);
  assert.match(integrationDoc, /carrier_decryptable_preferred/);
  assert.doesNotMatch(integrationDoc, /sk_live|proofSecret|privateKey/);
  assert.equal(packageJson.scripts?.['verify:address-wallet-friend-delivery'], 'tsx --test src/lib/addressWalletFriendDelivery.test.ts');
});

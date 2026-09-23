import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'AddressLoginExperienceScreen.tsx'), 'utf8');
const rootSource = readFileSync(join(here, '..', 'RootApp.tsx'), 'utf8');
const navigationSource = readFileSync(join(here, '..', 'lib', 'appNavigation.ts'), 'utf8');

test('Address Login screen presents user consent and merchant control plane surfaces', () => {
  assert.match(source, /Address Login/);
  assert.match(source, /Wallet consent flow/);
  assert.match(source, /Merchant-side control plane/);
  assert.match(source, /Hosted button and callback/);
  assert.match(source, /Callback contract/);
  assert.match(source, /Callback URL validator/);
  assert.match(source, /Safe callback preview/);
  assert.match(source, /Privacy contract/);
  assert.match(source, /Country form capability/);
  assert.match(source, /Coverage map/);
  assert.match(source, /areas linked/);
  assert.match(source, /privacy boundaries/);
  assert.match(source, /Guest checkout/);
  assert.match(source, /Google \/ Apple sign-up/);
  assert.match(source, /EC-ready Vey ID/);
  assert.match(source, /Wallet address reuse/);
  assert.match(source, /EC Social Login/);
  assert.match(source, /Developer quickstart/);
  assert.match(source, /Vey ID \+ Address Login/);
  assert.match(source, /Playlist Commerceではログインボタンなし/);
  assert.match(source, /Continue with Veygritが必要/);
});

test('Address Login screen is driven by executable spec helpers', () => {
  assert.match(source, /addressLoginCoverageMap/);
  assert.match(source, /buildAddressLoginMerchantIntegration/);
  assert.match(source, /integration\.callbackContract/);
  assert.match(source, /integration\.setupPreflight/);
  assert.match(source, /buildAddressLoginFormCapability/);
  assert.match(source, /requiredClaimsForAddressLogin/);
  assert.match(source, /getAddressFormat\(countryCode\)/);
  assert.match(source, /VEYGRIT_ID_DEVELOPER_ADOPTION/);
  assert.match(source, /VEYGRIT_ID_GUEST_CHECKOUT_POLICY/);
  assert.match(source, /VEYGRIT_ID_COMMERCE_BOUNDARY/);
  assert.match(source, /reactPackage/);
  assert.match(source, /nextPackage/);
  assert.match(source, /carrier_decryptable/);
  assert.match(source, /native_and_english/);
});

test('Address Login UI keeps merchant and carrier visibility separated', () => {
  assert.match(source, /Merchant receives no address lines by default/);
  assert.match(source, /Carrier decrypt is purpose and time bound/);
  assert.match(source, /Callbacks use pairwise subject aliases/);
  assert.match(source, /Webhook payloads are redacted/);
  assert.match(source, /Merchant sees/);
  assert.match(source, /Carrier sees/);
});

test('Address Login coverage map surfaces tested areas and privacy boundaries', () => {
  assert.match(source, /visibleCoverage/);
  assert.match(source, /coverageAreaCount/);
  assert.match(source, /coverageBoundaryCount/);
  assert.match(source, /item\.executableEvidence\.length/);
  assert.match(source, /item\.privacyBoundary/);
});

test('Address Login design presents a Vey ID developer adoption path', () => {
  assert.match(source, /Offer guest checkout/);
  assert.match(source, /Enable Vey ID/);
  assert.match(source, /Drop in VeyIdSignInButton/);
  assert.match(source, /Continue with Veygrit required/);
  assert.match(source, /no login button to shop/);
  assert.match(source, /Reuse wallet address/);
  assert.match(source, /Hand off to carrier/);
  assert.match(source, /Google\/Appleだけ/);
  assert.match(source, /guestCheckoutRef/);
  assert.match(source, /no account required/);
  assert.match(source, /Canonical params/);
  assert.match(source, /Compatibility aliases/);
  assert.match(source, /Forbidden params/);
  assert.match(source, /Non-claims/);
  assert.match(source, /Run synthetic test vectors/);
  assert.match(source, /Copied test command/);
  assert.match(source, /testVectorCommand/);
  assert.match(source, /@veygrit\/address-login-react/);
  assert.match(source, /@veygrit\/address-login-nextjs/);
  assert.match(source, /VeyIdSignInButton/);
  assert.match(source, /useAddressLogin/);
  assert.match(source, /verifyAddressLoginCallback/);
  assert.match(source, /VEYGRIT_ID_DEVELOPER_ADOPTION\.nonClaims\[0\]/);
});

test('Address Login is routed as a standalone app screen', () => {
  assert.match(rootSource, /AddressLoginExperienceScreen/);
  assert.match(rootSource, /isAddressLoginRoute/);
  assert.match(rootSource, /window\.location\.pathname === '\/address-login'/);
  assert.match(rootSource, /route\.addressLogin/);
  assert.match(navigationSource, /id: 'address-login'/);
  assert.match(navigationSource, /route: '\/address-login'/);
});

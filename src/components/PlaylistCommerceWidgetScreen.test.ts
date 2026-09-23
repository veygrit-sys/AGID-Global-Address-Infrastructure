import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'PlaylistCommerceWidgetScreen.tsx'), 'utf8');
const rootSource = readFileSync(join(here, '..', 'RootApp.tsx'), 'utf8');
const navigationSource = readFileSync(join(here, '..', 'lib', 'appNavigation.ts'), 'utf8');
const designRulesSource = readFileSync(join(here, '..', 'design', 'agidDesignRules.ts'), 'utf8');

test('Playlist Commerce widget presents SDK, checkout, webhook, and privacy surfaces', () => {
  assert.match(source, /Playlist Commerce/);
  assert.match(source, /Purpose-based shopping/);
  assert.match(source, /Read by role/);
  assert.match(source, /Presentation coverage/);
  assert.match(source, /diagrams linked/);
  assert.match(source, /Investor view/);
  assert.match(source, /Merchant view/);
  assert.match(source, /Developer view/);
  assert.match(source, /Developer method surface/);
  assert.match(source, /Merchant event contract/);
  assert.match(source, /Checkout response/);
  assert.match(source, /Privacy boundary/);
  assert.match(source, /Merchant participation/);
  assert.match(source, /id="topics"/);
  assert.match(source, /id="discover"/);
  assert.match(source, /id="my-stores"/);
  assert.match(source, /Spotify-like search, recommendations, and history/);
  assert.match(source, /Search results/);
  assert.match(source, /Recommended shelves/);
  assert.match(source, /Recently viewed/);
  assert.match(source, /Choose whether the store appears in Playlist Commerce/);
  assert.match(source, /which EC to use/);
  assert.match(source, /how to buy at that EC/);
  assert.match(source, /EC Social Login/);
  assert.match(source, /Login button to shop/);
  assert.match(source, /Continue with Veygrit/);
  assert.match(source, /not required/);
  assert.match(source, /Wallet-controlled解除/);
  assert.match(source, /Vey ID \+ Address Wallet reuse/);
  assert.match(source, /Guest checkout contract/);
  assert.match(source, /guestCheckoutRef/);
  assert.match(source, /no account required/);
  assert.match(source, /Account providers/);
  assert.match(source, /Google\/Appleのみ/);
  assert.match(source, /Merchant never receives/);
});

test('Playlist Commerce widget is driven by executable SDK and checkout helpers', () => {
  assert.match(source, /buildPlaylistCommerceSdkContract/);
  assert.match(source, /buildPlaylistCommerceSdkQuickstart/);
  assert.match(source, /createPlaylistCommerceSdkTestClient/);
  assert.match(source, /buildPlaylistCommerceMerchantParticipation/);
  assert.match(source, /buildAddressWalletSocialLoginAddressReusePlan/);
  assert.match(source, /buildVeygritCommerceIntegrationDecisionPlan/);
  assert.match(source, /buildPlaylistCommerceSpec/);
  assert.match(source, /summarizePlaylistCommerceSpec/);
  assert.match(source, /client\.startCheckout\('self_delivery'\)/);
  assert.match(source, /client\.buildDiscoveryHome\('new apartment'\)/);
  assert.match(source, /discoveryHome\.home\.searchResults\.map/);
  assert.match(source, /discoveryHome\.home\.recommendationShelves\.map/);
  assert.match(source, /discoveryHome\.home\.history\.map/);
  assert.match(source, /merchantParticipation\.participationAction/);
  assert.match(source, /merchantParticipation\.directoryVisibility/);
  assert.match(source, /merchantParticipation\.userLoginRequiredToChooseStore/);
  assert.match(source, /merchantParticipation\.walletControlledActions\.map/);
  assert.match(source, /addressWalletReuse\.loginProvider/);
  assert.match(source, /addressWalletReuse\.guestCheckout/);
  assert.match(source, /integrationDecision\.placements\.find/);
  assert.match(source, /playlistIntegration/);
  assert.match(source, /ecSocialLoginIntegration/);
  assert.match(source, /addressWalletReuse\.accountCreationProviders\.join\(' \/ '\)/);
  assert.match(source, /addressWalletReuse\.entryPoints\.map/);
  assert.match(source, /guestCheckout\.allowedGuestActions\.map/);
  assert.match(source, /addressWalletReuse\.merchantNeverReceives\.map/);
  assert.match(source, /summary\.capabilityCount/);
  assert.match(source, /testVectors\.webhooks\.length/);
  assert.match(source, /contract\.methods\.length/);
});

test('Playlist Commerce widget surfaces presentation coverage from the tested map', () => {
  assert.match(source, /playlistCommercePresentationMap/);
  assert.match(source, /visiblePresentationCoverage/);
  assert.match(source, /coverageAudienceCount/);
  assert.match(source, /item\.diagramSection/);
  assert.match(source, /item\.nonClaimBoundary/);
});

test('Playlist Commerce widget keeps merchant output alias-first and no-raw-address', () => {
  assert.match(source, /no raw address SDK/);
  assert.match(source, /hiddenFromMerchant/);
  assert.match(source, /orderAlias/);
  assert.match(source, /carrierHandoffRef/);
  assert.match(source, /proof_witness/);
  assert.match(source, /private_key/);
});

test('Playlist Commerce widget keeps the mobile reading order and JSON panel bounded', () => {
  assert.match(source, /order-2 space-y-4 xl:order-1/);
  assert.match(source, /order-1 space-y-4 xl:order-2/);
  assert.match(source, /order-3 space-y-4 xl:sticky/);
  assert.match(source, /max-h-\[360px\]/);
  assert.match(source, /sm:max-h-\[520px\]/);
});

test('Playlist Commerce implementation is retained but retired from the AGID runtime', () => {
  assert.doesNotMatch(rootSource, /import\('\.\/components\/PlaylistCommerceWidgetScreen'\)/);
  assert.doesNotMatch(rootSource, /isPlaylistCommerceRoute/);
  assert.doesNotMatch(rootSource, /route\.playlistCommerce/);
  assert.match(rootSource, /pathname === '\/playlist-commerce'/);
  assert.match(rootSource, /window\.history\.replaceState\(window\.history\.state, '', '\/\?action=aoid'\)/);
  assert.match(navigationSource, /id: 'playlist-commerce'/);
  assert.match(navigationSource, /route: '\/playlist-commerce'/);
  assert.match(navigationSource, /id: 'store-topics'/);
  assert.match(navigationSource, /route: '\/playlist-commerce#topics'/);
  assert.match(navigationSource, /id: 'store-discover'/);
  assert.match(navigationSource, /route: '\/playlist-commerce#discover'/);
  assert.match(navigationSource, /id: 'store-my-stores'/);
  assert.match(navigationSource, /route: '\/playlist-commerce#my-stores'/);
  assert.match(navigationSource, /AGID_RETIRED_CONSUMER_SURFACE_IDS/);
  assert.match(designRulesSource, /'playlist-commerce': 'hidden'/);
});

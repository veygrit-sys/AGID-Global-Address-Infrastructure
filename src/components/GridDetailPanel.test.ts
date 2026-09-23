import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'GridDetailPanel.tsx'), 'utf8');
const addressLanguageTabsSource = readFileSync(join(here, 'AddressLanguageTabs.tsx'), 'utf8');
const addressQualitySummarySource = readFileSync(join(here, 'AddressQualitySummary.tsx'), 'utf8');

test('grid detail address language tabs use native-script labels', () => {
  assert.match(source, /<AddressLanguageTabs/);
  assert.match(addressLanguageTabsSource, /getAddressLanguageTabLabel\(langCode/);
  assert.match(addressLanguageTabsSource, /getEnglishAddressCircle\(countryCode\)/);
  assert.doesNotMatch(source, /font-black uppercase tracking-widest/);
});

test('English address tab renders international shipping English from canonical data', () => {
  assert.match(source, /const canonicalClickedAddress = React\.useMemo/);
  assert.match(source, /isInternationalEnglishDisplayTab\(tab\)[\s\S]*?AddressRenderer\.renderInternationalShippingEnglish\(canonicalClickedAddress\)/);
  assert.match(source, /collectOpenSourceAddressEvidenceSources\(clickedAddressDetails\)/);
  assert.match(source, /assessAddressDisplayQuality\(rawAddressDisplay/);
  assert.match(source, /AddressRenderer\.renderPartialAddress\(clickedAddressTab, canonicalClickedAddress\)/);
  assert.match(source, /formatAddressDisplayText\(resolvedAddressDisplay, \{ tab: clickedAddressTab, countryCode \}\)/);
  assert.match(source, /shouldPreserveAddressDisplayLines\(clickedAddressTab, countryCode\)/);
});

test('grid detail panel guards address metadata and rendering errors', () => {
  assert.match(source, /getAddressFormat\(countryCode\)[\s\S]*?\.catch\(\(\) => \{/);
  assert.match(source, /generateInternationalShippingLabel\(clickedAddressDetails\)[\s\S]*?\.catch\(\(\) => \{/);
  assert.match(source, /const safeAddressDisplay = \(\) => \{/);
  assert.match(source, /catch \(error\) \{[\s\S]*?console\.warn\('Address display fallback:'/);
});

test('disputed territory address display exposes selectable claim views', () => {
  assert.match(source, /TERRITORY_CLAIM_DISPLAY_POLICIES/);
  assert.match(source, /territoryClaimDisplayPolicy/);
  assert.match(source, /setTerritoryClaimDisplayPolicy/);
  assert.match(source, /claimPolicyRef/);
  assert.match(source, /getTerritoryClaimOptions/);
  assert.match(source, /selectedTerritoryClaimId/);
  assert.match(source, /territoryClaimOptions\[0\]\.id/);
  assert.match(source, /TERRITORY_CLAIM_DISPLAY_POLICIES\.map/);
  assert.match(source, /territoryClaimOptions\.map/);
  assert.match(source, /formatTerritoryClaimSummary\(selectedTerritoryClaim\)/);
});

test('grid detail panel shows postal and geodata verification quality policy', () => {
  assert.match(source, /executeVerifiedAddressTranslationSync/);
  assert.match(source, /const addressValidation = verifiedAddressTranslation\?\.validation \|\| null/);
  assert.match(source, /getAddressQualityPublicCopy/);
  assert.match(source, /qualityCopy\.shortLabel/);
  assert.match(source, /missingRequiredFields\.slice\(0, 3\)\.join/);
  assert.doesNotMatch(source, /<AddressQualitySummary/);
});

test('grid detail panel scores address-language tabs before display', () => {
  assert.match(source, /scoreAddressTabs\(displayTabs/);
  assert.match(source, /selectVisibleAddressTabs\(displayTabs, addressTabQualities\)/);
  assert.match(source, /const alwaysVisibleTabs = displayTabs\.filter/);
  assert.match(source, /tab === 'en'/);
  assert.match(source, /tabs=\{visibleDisplayTabs\}/);
  assert.match(source, /qualityByTab=\{addressTabQualities\}/);
  assert.match(addressLanguageTabsSource, /qualityByTab\?: Record<string, AddressTabQualityScore>/);
  assert.doesNotMatch(addressLanguageTabsSource, /AlertTriangle/);
});

test('address tab quality score stays internal and is not rendered to users', () => {
  assert.doesNotMatch(source, /activeAddressTabQuality\.score/);
  assert.doesNotMatch(source, /\/100/);
  assert.doesNotMatch(addressLanguageTabsSource, /quality\.score/);
  assert.doesNotMatch(addressLanguageTabsSource, /\/100/);
});

test('address quality summary hides open-source provider chips from the user panel', () => {
  assert.doesNotMatch(addressQualitySummarySource, /summary\.sources\.map/);
  assert.doesNotMatch(addressQualitySummarySource, /\{source\}/);
  assert.match(addressQualitySummarySource, /summary\.postalLabel/);
  assert.match(addressQualitySummarySource, /summary\.confidenceLabel/);
});

test('grid detail panel opens address feedback from the address action row', () => {
  assert.match(source, /AddressFeedbackPanel/);
  assert.match(source, /isAddressFeedbackOpen/);
  assert.match(source, /setIsGridVisible\?: \(visible: boolean\) => void/);
  assert.match(source, /const openAddressFeedbackPanel = React\.useCallback/);
  assert.match(source, /setIsGridVisible\?\.\(true\)/);
  assert.match(source, /title="Address feedback"/);
  assert.match(source, /onClick=\{openAddressFeedbackPanel\}/);
  assert.match(source, /presentation="map-left"/);
  assert.match(source, /closeOnSaved/);
  assert.match(source, /onLearningSaved=\{\(summary\) => showAlert/);
  assert.match(source, /onFieldFeedbackSubmitted=\{\(result\) => showAlert/);
  assert.match(source, /sourceIds=\{addressFeedbackSourceIds\}/);
});

test('grid detail panel keeps the user panel concise and does not render Geo address cards', () => {
  assert.doesNotMatch(source, /buildNaturalAddressDisplayProfile/);
  assert.doesNotMatch(source, /Geo address/);
  assert.doesNotMatch(source, /AddressQualityDecisionBar/);
  assert.match(source, /grid grid-cols-3 gap-2/);
  assert.match(source, />Save<\/button>/);
  assert.match(source, />QR<\/button>/);
  assert.match(source, />Report<\/button>/);
});

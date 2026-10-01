import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'GridDetailPanel.tsx'), 'utf8');
const appSource = readFileSync(join(here, '..', 'App.tsx'), 'utf8');
const addressQualitySummarySource = readFileSync(join(here, 'AddressQualitySummary.tsx'), 'utf8');

test('grid detail address language uses a two-mode dropdown', () => {
  assert.doesNotMatch(source, /<AddressLanguageTabs/);
  assert.match(source, /id="agid-address-language"/);
  assert.match(source, /getAddressLanguageTabLabel\(domesticAddressTab/);
  assert.match(source, /label: 'Intl\. English'/);
  assert.match(source, /addressLanguageOptions\.map/);
  assert.match(source, /onChange=\{\(event\) => handleAddressLanguageChange\(event\.target\.value\)\}/);
});

test('changing the address language fetches and displays the selected language address', () => {
  assert.match(source, /const handleAddressLanguageChange = React\.useCallback/);
  assert.match(source, /setClickedAddressTab\(tab\)/);
  assert.match(source, /fetchAddressForLang\(lat, lon, tab, true, countryCode, true\)/);
  assert.match(source, /\{addressDisplayText\}/);
  assert.match(appSource, /setClickedAddressMap\(prev => \{[\s\S]*?\[langCode\]: formatted/);
  assert.doesNotMatch(appSource, /setClickedAddressTranslated/);
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
  assert.match(source, /selectedTerritoryClaim\.sourceUrl/);
  assert.match(source, /selectedTerritoryClaim\.sourceLabel/);
  assert.match(source, /selectedTerritoryClaim\?\.status === 'country'/);
  assert.match(source, /territoryClaimOptions\.length > 0 && !isRegularCountryTerritory/);
  assert.match(source, /selectedTerritoryClaim && !isRegularCountryTerritory/);
});

test('grid detail panel keeps address validation without showing confirmation notices', () => {
  assert.match(source, /executeVerifiedAddressTranslationSync/);
  assert.match(source, /const addressValidation = verifiedAddressTranslation\?\.validation \|\| null/);
  assert.doesNotMatch(source, /qualityCopy/);
  assert.doesNotMatch(source, /<AddressQualitySummary/);
});

test('grid detail panel scores address-language tabs before display', () => {
  assert.match(source, /scoreAddressTabs\(displayTabs/);
  assert.match(source, /selectVisibleAddressTabs\(displayTabs, addressTabQualities\)/);
  assert.match(source, /const alwaysVisibleTabs = displayTabs\.filter/);
  assert.match(source, /tab === 'en'/);
  assert.match(source, /const domesticAddressTab = React\.useMemo/);
  assert.match(source, /const internationalEnglishTab = React\.useMemo/);
  assert.match(source, /const selectableTabs = \[domesticAddressTab, internationalEnglishTab\]/);
});

test('address tab quality score stays internal and is not rendered to users', () => {
  assert.doesNotMatch(source, /activeAddressTabQuality\.score/);
  assert.doesNotMatch(source, /\/100/);
});

test('clicking the AGID ID preserves the ID and announces copy status separately', () => {
  assert.match(source, /navigator\.clipboard\.writeText\(clickedAgid\.id\)/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /<span>\{clickedAgid\.id\}<\/span>/);
  assert.match(source, /role="status"/);
  assert.match(source, /await navigator\.clipboard\.writeText/);
  assert.doesNotMatch(source, /copied === 'agid' \? 'コピーされました' : clickedAgid\.id/);
  assert.doesNotMatch(source, /Copy ID & Address/);
  assert.doesNotMatch(source, /<Copy/);
});

test('address quality summary hides open-source provider chips from the user panel', () => {
  assert.doesNotMatch(addressQualitySummarySource, /summary\.sources\.map/);
  assert.doesNotMatch(addressQualitySummarySource, /\{source\}/);
  assert.match(addressQualitySummarySource, /summary\.postalLabel/);
  assert.match(addressQualitySummarySource, /summary\.confidenceLabel/);
});

test('grid detail panel opens address feedback directly below the address', () => {
  assert.match(source, /AddressFeedbackPanel/);
  assert.match(source, /isAddressFeedbackOpen/);
  assert.match(source, /setIsGridVisible\?: \(visible: boolean\) => void/);
  assert.match(source, /const openAddressFeedbackPanel = React\.useCallback/);
  assert.match(source, /setIsGridVisible\?\.\(true\)/);
  assert.match(source, /title="Address feedback"/);
  assert.match(source, /onClick=\{openAddressFeedbackPanel\}/);
  assert.match(source, /\{addressDisplayText\}[\s\S]*?title="Address feedback"[\s\S]*?grid grid-cols-3/);
  assert.match(source, /presentation="map-left"/);
  assert.doesNotMatch(source, /closeOnSaved/);
  assert.match(source, /onApplyCorrection=\{\(text\) => setFeedbackCorrection/);
  assert.match(source, /sourceIds=\{addressFeedbackSourceIds\}/);
});

test('grid detail panel keeps the user panel concise and does not render Geo address cards', () => {
  assert.doesNotMatch(source, /buildNaturalAddressDisplayProfile/);
  assert.doesNotMatch(source, /Geo address/);
  assert.doesNotMatch(source, /AddressQualityDecisionBar/);
  assert.match(source, /grid grid-cols-3 gap-2/);
  assert.match(source, />Save<\/button>/);
  assert.match(source, />QR<\/button>/);
  assert.match(source, /title="Get Directions"[\s\S]*?<Bookmark className="w-3 h-3" \/>Save/);
});

test('grid detail panel keeps one outer panel while inner address and QR sections stay unboxed', () => {
  assert.match(source, /className="group relative py-1"/);
  assert.match(source, /className="flex items-center gap-3 py-2"/);
  assert.doesNotMatch(source, /group relative rounded-2xl border border-slate-200 bg-white p-3/);
  assert.doesNotMatch(source, /items-center gap-3 rounded-xl border border-slate-200 bg-white p-2/);
  assert.doesNotMatch(source, /grid grid-cols-3 gap-2 mt-2 pt-2 border-t/);
});

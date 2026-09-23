import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'AddressRegistration.tsx'), 'utf8');

test('Address Registration header does not render the app language shortcut tabs', () => {
  assert.doesNotMatch(source, /App Language Toggle/);
  assert.doesNotMatch(source, /setAppLanguage\(lang\)/);
  assert.doesNotMatch(source, /\(\['en', 'ja', 'de', 'zh-Hant', 'zh-Hans', 'es', 'pt', 'fr', 'ar'\] as const\)\.map/);
});

test('Address Registration exposes an explicit AGID or AOID save mode', () => {
  assert.match(source, /identifierMode: '保存するID'/);
  assert.match(source, /identifierMode: 'Identifier to save'/);
  assert.match(source, /aria-pressed=\{!isAoidMode\}/);
  assert.match(source, /onClick=\{\(\) => setIsAoidMode\(false\)\}/);
  assert.match(source, /onClick=\{\(\) => setIsAoidMode\(true\)\}/);
  assert.match(source, /\{isAoidMode \? t\('aoidTip'\) : t\('agidSaveTip'\)\}/);
});

test('Address Registration opens as a full-screen surface instead of a centered modal', () => {
  assert.match(source, /className="fixed inset-0 z-\[101\] overflow-y-auto bg-slate-50 text-slate-950/);
  assert.doesNotMatch(source, /Local-first Address Workspace/);
  assert.match(source, /registrationWorkflowSteps\.map/);
  assert.match(source, /data-address-registration-form-first/);
  assert.match(source, /id="address-registration-primary-form"/);
  assert.match(source, /max-w-3xl/);
  assert.doesNotMatch(source, /xl:grid-cols-\[260px_minmax\(0,1fr\)\]/);
  assert.match(source, /sticky bottom-2/);
  assert.match(source, /sm:w-auto sm:min-w-\[180px\]/);
  assert.doesNotMatch(source, /AGID Algorithm Metadata/);
  assert.doesNotMatch(source, /Mountain Class/);
  assert.doesNotMatch(source, /top-1\/2 left-1\/2 -translate-x-1\/2 -translate-y-1\/2/);
  assert.doesNotMatch(source, /bg-slate-900\/60 backdrop-blur-sm z-\[100\]/);
  assert.doesNotMatch(source, /max-h-\[90vh\]/);
});

test('Address Registration defaults to a compact input-first layout with expandable evidence', () => {
  assert.match(source, /showRegistrationDetails/);
  assert.match(source, /setShowRegistrationDetails\(false\)/);
  assert.match(source, /aria-expanded=\{showRegistrationDetails\}/);
  assert.match(source, /showRegistrationDetails \? t\('hideDetails'\) : t\('showDetails'\)/);
  assert.match(source, /className="order-1 space-y-1\.5 rounded-lg border border-slate-200 bg-white p-2 shadow-sm"/);
  assert.match(source, /className="order-2 mx-auto w-full max-w-3xl space-y-2\.5 rounded-lg/);
  assert.match(source, /!showRegistrationDetails && "hidden"/);
  assert.match(source, /className="grid grid-cols-2 gap-x-2\.5 gap-y-2\.5 sm:gap-x-3"/);
  assert.match(source, /field\.key === 'organization'[\s\S]*field\.key === 'street'[\s\S]*field\.key === 'postcode'[\s\S]*&& "col-span-2"/);
  assert.match(source, /rows=\{1\}/);
  assert.match(source, /className="h-9 w-full resize-none/);
  assert.match(source, /className="h-9 w-full rounded-lg/);
  assert.match(source, /className="group flex h-9 w-full/);
  assert.match(source, /className="sticky bottom-2 z-10 flex justify-center sm:justify-end"/);
});

test('Address Registration keeps app language, address language, and country selection as separate inputs', () => {
  assert.match(source, /appLanguage\?: string;/);
  assert.match(source, /addressLanguage\?: string;/);
  assert.doesNotMatch(source, /const \[appLanguage\]\s*=\s*useState/);
  assert.match(source, /normalizeRegistrationUiLanguage\(appLanguage\)/);
  assert.match(source, /normalizeRegistrationAddressLanguage\(addressLanguage\)/);
  assert.match(source, /selectRegistrationCountry\(formData,/);
  assert.doesNotMatch(source, /setActiveTab\(c\.code\)/);
  assert.doesNotMatch(source, /setActiveTab\(t\.code\)/);
});

test('Address Language tabs come from the selected country address format only', () => {
  assert.match(source, /buildRegistrationAddressLanguageTabs\(localFormat, formData\.country\)/);
  assert.match(source, /selectRegistrationAddressFormat\(localFormat, activeTab\)/);
  assert.doesNotMatch(source, /const quickLangs\s*=\s*useMemo/);
  assert.doesNotMatch(source, /setViewMode\('language-select'\)/);
  assert.doesNotMatch(source, /Other\.\.\./);
});

test('Address Registration localizes non-form UI with app language strings', () => {
  assert.match(source, /registrationStepsSafety:/);
  assert.match(source, /qrIntakeTitle:/);
  assert.match(source, /postalCoveragePolicyLabel:/);
  assert.match(source, /nativeInternationalCompatibility:/);
  assert.match(source, /inputAssistance:/);
  assert.match(source, /professionalReadiness:/);
  assert.match(source, /addressLanguageLabel:/);
  assert.match(source, /selectCountryRegion:/);
  assert.match(source, /t\('registrationStepsSafety'\)/);
  assert.match(source, /t\('qrIntakeTitle'\)/);
  assert.match(source, /t\('postalCoveragePolicyLabel'\)/);
  assert.match(source, /t\('nativeInternationalCompatibility'\)/);
  assert.match(source, /t\('inputAssistance'\)/);
  assert.match(source, /t\('professionalReadiness'\)/);
  assert.match(source, /t\('addressLanguageLabel'\)/);
  assert.match(source, /t\('selectCountryRegion'\)/);
  assert.match(source, /field\.label/);
});

test('international English preview uses the shipping renderer while domestic English stays domestic', () => {
  assert.match(source, /function renderRegistrationAddressPreview/);
  assert.match(source, /tabCode === 'en'\s*\?\s*'intl_en'\s*:\s*tabCode/);
  assert.match(source, /renderRegistrationAddressPreview\(formData, activeTab, localFormat\)/);
  assert.match(source, /activeTab === 'en'\s*\?\s*t\('internationalShippingLabel'\)\s*:\s*t\('domesticDeliveryFormat'\)/);
});

test('postcode field uses country postal-code metadata instead of a hard-coded pattern', () => {
  assert.match(source, /getPostcodeInputConfig\(localFormat\)/);
  assert.match(source, /format=\{postcodeInputConfig\.pattern/);
  assert.match(source, /fixedValue=\{postcodeInputConfig\.fixedValue/);
  assert.doesNotMatch(source, /format="7-digit"/);
});

test('postcode input triggers open-source autofill when the country postcode is complete', () => {
  assert.match(source, /isPostcodeReadyForAutofill\(localFormat, formData\.postcode\)/);
  assert.match(source, /classifyAddressCoveragePolicy\(localFormat\)/);
  assert.match(source, /getPostcodeAutofillModeForCoverage\(addressCoveragePolicy\)/);
  assert.match(source, /lookupPostcodeAutofillCandidates\(formData\.country, formData\.postcode\)/);
  assert.match(source, /mergePostcodeAutofill\(prev, patch\)/);
  assert.match(source, /buildPostcodeRegistrationAssistanceCandidate/);
  assert.match(source, /rememberAssistedDraft\(next, candidate\.id\)/);
  assert.match(source, /postcodeLookupStatus === 'candidates'/);
  assert.match(source, /applyPostcodeAutofillCandidate/);
});

test('Address Registration classifies postal coverage into auto-fill, candidates, and AGID primary modes', () => {
  assert.match(source, /id="postal-coverage-policy"/);
  assert.match(source, /t\('postalCoverageReliableTitle'\)/);
  assert.match(source, /t\('postalCoverageWeakTitle'\)/);
  assert.match(source, /t\('postalCoverageStrongGeoTitle'\)/);
  assert.match(source, /t\('postalCoverageManualTitle'\)/);
  assert.match(source, /addressCoveragePolicy\.id === 'no-postal-strong-geo'/);
  assert.match(source, /addressCoveragePolicy\.id === 'no-postal-weak-geo'/);
  assert.match(source, /t\('noPostalAgidPrimary'\)/);
});

test('AGID can assist address registration without fabricating full street addresses', () => {
  assert.match(source, /buildAgidRegistrationAutofillCandidate\(\{/);
  assert.match(source, /supportedCountryCodes/);
  assert.match(source, /t\('applyAgidHint'\)/);
  assert.match(source, /mergeRegistrationAssistancePatch\(prev, candidate\.patch, \{ overwrite: true \}\)/);
});

test('manual corrections after address assistance are stored as local learning references on registration', () => {
  assert.match(source, /assistedDraftRef/);
  assert.match(source, /buildRegistrationCorrectionSample\(\{/);
  assert.match(source, /appendRegistrationCorrectionSample\(correctionSample\)/);
  assert.match(source, /feedbackConsent && assistedDraftRef\.current/);
  assert.match(source, /feedbackConsent: \{/);
  assert.match(source, /learningMode: 'closed-device-local'/);
  assert.match(source, /registrationAssistance/);
});

test('Address Registration compares postal-code and AGID autofill with reasons, history, and feedback consent', () => {
  assert.match(source, /postcodeAssistanceCandidate/);
  assert.match(source, /buildRegistrationAssistanceComparison\(\{/);
  assert.match(source, /listRegistrationCorrectionSamples\(undefined, 4\)/);
  assert.match(source, /t\('inputAssistanceDesc'\)/);
  assert.match(source, /t\('autofillComparison'\)/);
  assert.match(source, /assistanceComparison\.candidates\.map/);
  assert.match(source, /t\('qualityReasons'\)/);
  assert.match(source, /t\('correctionHistory'\)/);
  assert.match(source, /t\('feedbackConsent'\)/);
  assert.match(source, /checked=\{feedbackConsent\}/);
  assert.match(source, /externalTransmission: 'blocked'/);
  assert.match(source, /t\('changedFieldsPrefix'\)/);
});

test('Address Registration keeps feedback and privacy controls close to the address form', () => {
  assert.match(source, /id="address-registration-feedback-ui"/);
  assert.match(source, /t\('feedbackConsent'\)/);
  assert.match(source, /checked=\{feedbackConsent\}/);
  assert.match(source, /setFeedbackConsent\(event\.currentTarget\.checked\)/);
  assert.match(source, /t\('noRawExport'\)/);
  assert.match(source, /t\('nativeInternationalCompatibility'\)/);
  assert.match(source, /t\('qrQualityMetadata'\)/);
});

test('address language tab clicks translate form fields automatically', () => {
  assert.match(source, /handleAddressLanguageTabClick/);
  assert.match(source, /translateRegistrationFormFields\(/);
  assert.match(source, /onClick=\{\(\) => handleAddressLanguageTabClick\(tab\.code\)\}/);
});

test('address translation feedback is saved as closed local learning only', () => {
  assert.match(source, /translationFeedbackRef/);
  assert.match(source, /buildAddressTranslationFeedbackSample\(\{/);
  assert.match(source, /appendAddressTranslationFeedbackSample\(sample\)/);
  assert.match(source, /t\('closedTranslationLearning'\)/);
  assert.match(source, /t\('translationFeedbackDesc'\)/);
  assert.match(source, /t\('useEditsForLearning'\)/);
});

test('postcode autofill and language tabs do not keep stale drafts', () => {
  assert.match(source, /buildPostcodeAutofillLanguageDrafts\(\{/);
  assert.match(source, /languageTabs: addressLanguageTabs\.map\(tab => tab\.code\)/);
  assert.match(source, /languageDraftsRef\.current = \{[\s\S]*\.\.\.drafts,[\s\S]*\[activeTab\]: next,[\s\S]*\};/);
  assert.match(source, /languageDraftsRef\.current = \{\};/);
  assert.match(source, /if \(tabCode === 'local' && savedDraft\)/);
  assert.doesNotMatch(source, /if \(savedDraft\) \{\s*setFormData\(savedDraft\)/);
});

test('Address Registration can prefill building names from reverse geocode details', () => {
  assert.match(source, /initialAddressDetails\?: any;/);
  assert.match(source, /initialAddressDetails\?\.address_analysis\?\.canonical/);
  assert.match(source, /organization: details\.building \|\| details\.building_en \|\| details\.organization \|\| details\.poi \|\| prev\.organization/);
});

test('Address Registration uploads photos and PDFs for local address document autofill', () => {
  assert.match(source, /address-document-reading-ai/);
  assert.match(source, /accept="image\/\*,application\/pdf,text\/plain,\.txt,\.csv"/);
  assert.match(source, /handleAddressDocumentFile/);
  assert.match(source, /readAddressDocument\(\{/);
  assert.match(source, /extractPrintableTextFromBinary/);
  assert.match(source, /mergeRegistrationAssistancePatch\(prev, candidate\.patch, \{ overwrite \}\)/);
  assert.match(source, /applyDocumentAddress/);
  assert.match(source, /documentPrivacy/);
});

test('Address Registration can open from QR autofill and hotel check-in sessions', () => {
  assert.match(source, /initialQrRecord\?: RegisteredAddressRecord \| null;/);
  assert.match(source, /initialHotelCheckInSession\?: HotelCheckInSession \| null;/);
  assert.match(source, /buildAddressInputPatchFromRegisteredQr\(initialQrRecord\)/);
  assert.match(source, /qr-autofill:\$\{initialQrRecord\.id\}/);
  assert.match(source, /id="qr-address-intake"/);
  assert.match(source, /t\('qrIntakeTitle'\)/);
  assert.match(source, /t\('hotelCheckIn'\)/);
});

test('Address Registration runs professional readiness checks from Address Element without exposing raw fields', () => {
  assert.match(source, /buildAddressElementSession\(\{/);
  assert.match(source, /assessAddressRegistrationReadiness\(\{/);
  assert.match(source, /t\('professionalReadiness'\)/);
  assert.match(source, /t\('registrationOperationalCheck'\)/);
  assert.match(source, /registrationReadiness\.roleSummaries\.map/);
  assert.match(source, /registrationReadiness: registrationReadiness\.publicMetadata/);
  assert.match(source, /registrationReadiness\.publicMetadata\.privacyBoundary/);
});

test('Address Registration exports safe QR quality metadata with registered records', () => {
  assert.match(source, /buildRegisteredAddressQualitySnapshot\(\{/);
  assert.match(source, /registeredQualitySnapshotToDecision\(registrationQualitySnapshot\)/);
  assert.match(source, /id="registration-qr-quality"/);
  assert.match(source, /AddressQualityDecisionBar/);
  assert.match(source, /quality: registrationQualitySnapshot/);
  assert.match(source, /t\('qrQualityPublicDesc'\)/);
});

test('Address Registration exposes AGID primary mode and OSM/Overture building candidates', () => {
  assert.match(source, /addressElementSession\.primaryIdentifier\.kind === 'agid'/);
  assert.match(source, /t\('postalCoverageAgidBadge'\)/);
  assert.match(source, /fetchNearbyBuildingNameCandidates/);
  assert.match(source, /buildingNameCandidates\.map/);
  assert.match(source, /applyBuildingNameCandidate/);
  assert.match(source, /t\('buildingCandidatesLabel'\)/);
});

test('Address Registration shows multilingual compatibility and source agreement evidence', () => {
  assert.match(source, /addressCompatibilityReport/);
  assert.match(source, /nativeInternationalPreview/);
  assert.match(source, /id="native-international-compat-preview"/);
  assert.match(source, /t\('nativeInternationalCompatibility'\)/);
  assert.match(source, /t\('nativeAddressLabel'\)/);
  assert.match(source, /t\('internationalShippingEnglish'\)/);
  assert.match(source, /compactRenderedAddress/);
  assert.match(source, /t\('languageCompatibility'\)/);
  assert.match(source, /t\('instantTabSwitch'\)/);
  assert.match(source, /t\('englishInternationalOrder'\)/);
  assert.match(source, /sourceAgreementMatrix/);
  assert.match(source, /t\('trustedAddressSources'\)/);
  assert.match(source, /OSM \/ Overture/);
  assert.match(source, /t\('sourcePostalCode'\)/);
  assert.match(source, /t\('sourceAdministrativeData'\)/);
});

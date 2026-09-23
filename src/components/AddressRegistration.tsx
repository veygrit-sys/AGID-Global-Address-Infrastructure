import {
Square as AgidIcon,
AlertCircle,
Building2,
CheckCircle2,
ChevronRight,
FileText,
Globe,
Hash,
ListFilter,
Loader2,
Mail,
MapPin,
QrCode,
ShieldCheck as ShieldIcon,
UploadCloud,
Wand2,
X
} from 'lucide-react';
import { AnimatePresence,motion } from 'motion/react';
import React,{ useEffect,useMemo,useState } from 'react';
import { COUNTRIES } from '../constants/countries';
import { AddressFormat,getAddressFormat } from '../data/address_formats';
import { buildAddressElementSession } from '../lib/addressElement';
import {
appendAddressTranslationFeedbackSample,
appendRegistrationCorrectionSample,
buildAddressTranslationFeedbackSample,
buildAgidRegistrationAutofillCandidate,
buildPostcodeAutofillLanguageDrafts,
buildPostcodeRegistrationAssistanceCandidate,
buildRegistrationAssistanceComparison,
buildRegistrationCorrectionSample,
formatPostcodeAutofillCandidateLabel,
getPostcodeAutofillModeForCoverage,
isPostcodeReadyForAutofill,
listRegistrationCorrectionSamples,
lookupPostcodeAutofillCandidates,
mergeRegistrationAssistancePatch,
mergePostcodeAutofill,
translateRegistrationFormFields,
type PostcodeAutofillMode,
type RegistrationAssistanceCandidate,
type RegistrationCorrectionSample,
type AddressTranslationFeedback,
} from '../lib/addressRegistrationAutomation';
import { classifyAddressCoveragePolicy } from '../lib/addressCoveragePolicy';
import {
addressDocumentResultToAssistanceCandidate,
extractPrintableTextFromBinary,
readAddressDocument,
type AddressDocumentReadResult,
} from '../lib/addressDocumentReading';
import {
buildAddressInputPatchFromRegisteredQr,
type HotelCheckInSession,
} from '../lib/addressQrIntake';
import { assessAddressRegistrationReadiness } from '../lib/addressRegistrationReadiness';
import { formatPublicConfidenceBand } from '../lib/publicDecisionDisplay';
import {
buildRegistrationAddressLanguageTabs,
normalizeRegistrationAddressLanguage,
normalizeRegistrationUiLanguage,
selectRegistrationAddressFormat,
selectRegistrationCountry,
} from '../lib/addressRegistrationState';
import {
ANGLOSPHERE_TERRITORIES,
ARABIC_TERRITORIES,
AUSTRALIAN_TERRITORIES,
BALKAN_TERRITORIES,
BALTIC_TERRITORIES,
BRITISH_TERRITORIES,
CANADIAN_TERRITORIES,
CARIBBEAN_TERRITORIES,
CENTRAL_EUROPE_TERRITORIES,
CENTRAL_SOUTH_ASIA_TERRITORIES,
CHILE_TERRITORIES,
DANISH_TERRITORIES,
DUTCH_TERRITORIES,
EURASIAN_TERRITORIES,
FRANCOPHONIE_TERRITORIES,
FRENCH_TERRITORIES,
GERMAN_REGIONS,
GREATER_CHINA_TERRITORIES,
HISPANOSPHERE_TERRITORIES,
ITALIAN_TERRITORIES,
LUSOSPHERE_TERRITORIES,
MICROSTATES_TERRITORIES,
NEW_ZEALAND_TERRITORIES,
NORDIC_TERRITORIES,
NORWEGIAN_TERRITORIES,
OCEANIA_TERRITORIES,
PORTUGUESE_TERRITORIES,
SOUTHEAST_ASIA_TERRITORIES,
SPANISH_TERRITORIES,
US_TERRITORIES,
} from '../lib/addressRegistrationTerritories';
import { AddressRenderer,createCanonicalAddress } from '../lib/addressRendering';
import { normalizeAddressText } from '../lib/addressUtils';
import type { BuildingNameCandidate } from '../lib/buildingName';
import { decodeAGID } from '../lib/agid';
import { generateAOID } from '../lib/aoid';
import { detectChineseScript,toSimplified,toTraditional } from '../lib/chineseAddressUtils';
import { getPostcodeInputConfig } from '../lib/postcodeControl';
import {
buildRegisteredAddressRecord,
type RegisteredAddressRecord,
} from '../lib/registeredAddressQr';
import {
buildRegisteredAddressQualitySnapshot,
registeredQualitySnapshotToDecision,
} from '../lib/registeredAddressQuality';
import {
REGISTRATION_COUNTRY_TABS,
RegistrationCountryTabId,
getRegistrationCountryTabId,
groupRegistrationCountriesByTab,
} from '../lib/registrationCountryTabs';
import { cn } from '../lib/utils';
import { AddressQualityDecisionBar } from './AddressQualityDecisionBar';
import { CountryFlag } from './CountryFlag';
import { PostcodeInput } from './PostcodeInput';

interface AddressRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (data: any) => void;
  initialAgid?: string;
  initialAddress?: string;
  initialAddressDetails?: any;
  currentCoords?: { lat: number; lon: number };
  forceAoidMode?: boolean;
  appLanguage?: string;
  addressLanguage?: string;
  initialQrRecord?: RegisteredAddressRecord | null;
  initialHotelCheckInSession?: HotelCheckInSession | null;
}

type PostcodeLookupStatus = 'idle' | 'loading' | 'filled' | 'candidates' | 'empty' | 'error';

const READINESS_ROLE_LABEL_KEYS: Record<string, string> = {
  'addressing-specialist': 'readinessRoleAddressing',
  'carrier-ops': 'readinessRoleCarrierOps',
  'privacy-security': 'readinessRolePrivacy',
  'accessibility-i18n': 'readinessRoleA11y',
  'support-review': 'readinessRoleSupport',
  'developer-platform': 'readinessRoleDeveloper',
};

const READINESS_STATUS_STYLES: Record<string, string> = {
  ready: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  usable: 'bg-blue-100 text-blue-700 border-blue-200',
  needs_review: 'bg-amber-100 text-amber-700 border-amber-200',
  blocked: 'bg-rose-100 text-rose-700 border-rose-200',
};

const ADDRESS_COMPATIBILITY_FIELDS = [
  'country',
  'postcode',
  'state',
  'city',
  'suburb',
  'street',
  'organization',
  'building',
  'room',
  'recipient',
] as const;

const STRICT_COMPATIBILITY_FIELDS = new Set(['country', 'postcode', 'phone']);

function normalizeCompatibilityValue(value: unknown) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function formatPercent(value: number) {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

function compactRenderedAddress(value: string) {
  return value
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .join(', ');
}

function renderRegistrationAddressPreview(
  data: Record<string, unknown>,
  tabCode: string,
  format: AddressFormat | null | undefined,
) {
  if (!data.country) return '';
  const canonical = createCanonicalAddress(data);
  const renderTab = tabCode === 'en' ? 'intl_en' : tabCode;

  if (data.country === 'CN') {
    const simplifiedData = { ...canonical };
    const fields = ['state', 'city', 'district', 'subdistrict', 'road', 'building'] as const;
    fields.forEach(field => {
      if (simplifiedData[field]) simplifiedData[field] = toSimplified(simplifiedData[field]);
    });
    return AddressRenderer.render(renderTab, simplifiedData, format);
  }

  if (['TW', 'HK', 'MO'].includes(String(data.country))) {
    const traditionalData = { ...canonical };
    const fields = ['state', 'city', 'district', 'subdistrict', 'road', 'building'] as const;
    fields.forEach(field => {
      if (traditionalData[field]) {
        traditionalData[field] = toTraditional(traditionalData[field], data.country as any);
      }
    });
    return AddressRenderer.render(renderTab, traditionalData, format);
  }

  return AddressRenderer.render(renderTab, canonical, format);
}

function fieldValueFilled(record: Record<string, unknown> | null | undefined, field: string) {
  return Boolean(normalizeCompatibilityValue(record?.[field]));
}


const UI_STRINGS: Record<string, Record<string, string>> = {
  ja: {
    quickLookup: 'クイック検索',
    addressRegistration: '住所登録',
    globalAddressInput: 'グローバル住所入力 (libaddressinput)',
    registerAddress: '住所を登録する',
    countryRegion: '国 / 地域',
    phone: '電話番号',
    agid: 'AGID',
    lookupSuccess: '住所が入力されました！',
    lookupError: '検索に失敗しました',
    recipient: '氏名',
    organization: '会社・団体名',
    street: '住所',
    city: '市区町村',
    state: '都道府県',
    suburb: '町名・番地',
    postcode: '郵便番号',
    phonePlaceholder: '電話番号（国番号を含む）',
    agidPlaceholder: 'AGID（例: JP12345678）',
    postcodeLookup: '郵便番号検索',
    postcodePlaceholder: '7桁の郵便番号',
    jpAdminDetails: '日本国内行政詳細',
    prefecture: '都道府県',
    cityWard: '市区',
    townVillage: '町村',
    chome: '丁目',
    historicalName: '旧地名・歴史的名称',
    province: '省・州',
    district: '地区・郡',
    ward: '区',
    town: '町',
    village: '村',
    commune: 'コミューン',
    parish: '教区',
    quarter: 'クォーター',
    neighborhood: '近隣地域',
    governorate: '県・ガバノレート',
    emirate: '首長国',
    municipality: '自治体',
    county: '郡',
    oblast: '州 (Oblast)',
    viloyat: '州 (Viloyat)',
    region: '地域',
    department: '県 (Department)',
    canton: 'カントン',
    island: '島',
    atoll: '環礁',
    soum: 'ソム',
    bag: 'バグ',
    block: 'ブロック',
    lot: 'ロット',
    section: 'セクション',
    lane: 'レーン',
    alley: 'アレイ',
    floor: '階',
    room: '部屋',
    registerAoid: 'AOIDを生成・登録する',
    aoidTip: 'AOIDは自分だけが管理できるプライベートな住所IDです。建物名や部屋番号、連絡先を含みます。',
    registerAsAoid: 'AOIDとしてプライベート登録する',
    identifierMode: '保存するID',
    agidSaveTip: 'AGIDを公開ロケーションIDとしてこの端末に保存します。',
    showDetails: '詳細',
    hideDetails: '詳細を隠す',
    phoneRequired: '電話番号は必須です',
    nameRequired: '氏名は必須です',
    documentAutofill: '写真/PDFから自動入力',
    documentAutofillDesc: '送り状やPDF内の住所候補を端末内で読み取り、空欄に自動入力します。後から編集できます。',
    uploadDocument: '写真・PDFを選択',
    readingDocument: '住所を読み取り中',
    documentReady: '住所候補を読み取りました',
    documentNeedsReview: '候補を確認してください',
    documentNeedsOcr: '画像やスキャンPDFはOCRエンジンが必要です',
    applyDocumentAddress: '読み取り結果を反映',
    documentPrivacy: 'ファイルはこの端末内で処理され、自動送信されません。',
    extractedAddressText: '読み取りテキスト',
    documentAi: '住所読み取りAI',
    registrationStepsSafety: '登録ステップと安全情報',
    workflowLabel: 'ワークフロー',
    registrationStepsLabel: '登録ステップ',
    noRawExport: '生住所を外部出力しない',
    noRawExportDesc: '入力値はローカルで編集し、外部には状態・fingerprint・Intentだけを渡します。',
    statusReady: '準備完了',
    statusUsable: '利用可能',
    statusNeedsReview: '要確認',
    statusBlocked: 'ブロック中',
    qrIntakeLabel: 'QR入力',
    qrIntakeTitle: 'QRから住所入力できます',
    qrIntakeDesc: '読み取った内容は確定せず、編集可能な下書きとして反映します。ホテルチェックインでは、宿泊者住所をこの端末内で確認してから登録します。',
    localReview: 'ローカル確認',
    addressQrFilled: '住所QRを反映',
    addressQrReviewDesc: '保存やチェックイン利用の前に、下の項目を確認してください。',
    hotelCheckIn: 'ホテルチェックイン',
    postalCoveragePolicyLabel: '郵便番号 / AGID ルーティング方針',
    postalCoverageAutoBadge: '自動補完',
    postalCoverageReliableTitle: '郵便番号が強い国',
    postalCoverageReliableDesc: '郵便番号メタデータで行政区を自動補完し、登録前に根拠を確認できます。',
    postalCoverageCandidatesBadge: '候補表示',
    postalCoverageWeakTitle: '郵便番号APIが弱い国',
    postalCoverageWeakDesc: '郵便番号形式は検証しますが、API範囲が限定的です。候補から選び、手入力を優先します。',
    postalCoverageAgidBadge: 'AGID主識別',
    postalCoverageStrongGeoTitle: '郵便番号なし / 地理OSS強',
    postalCoverageStrongGeoDesc: '郵便番号ではなく、AGID・座標・行政階層・オープン地物を使ってGeo Verified表示を行います。',
    postalCoverageManualTitle: '郵便番号なし / 手動確認',
    postalCoverageManualDesc: '郵便番号がなく地理データも弱い地域です。AGIDと座標を主識別子にし、手動確認を必須にします。',
    internationalShippingLabel: '国際配送ラベル',
    domesticDeliveryFormat: '国内配送形式',
    waitingForInput: '入力待ち',
    modularChineseEngineActive: '中国語圏エンジン有効',
    simplifiedCanonical: '簡体字正規化',
    traditionalCanonical: '繁体字正規化',
    nativeInternationalCompatibility: '母国語 / 国際配送の互換性',
    nativeInternationalCompatibilityDesc: '母国語住所と国際配送英語は同じ住所要素を使い、英語は配送順で表示します。',
    nativeAddressLabel: '母国語住所',
    waitingForNativeAddress: '母国語住所の入力待ち',
    internationalShippingEnglish: '国際配送英語',
    waitingForEnglishShipping: '国際配送英語の入力待ち',
    compatibleFieldsCount: '{compatible}/{total} 項目互換',
    englishInternationalOrder: '英語は国際配送順',
    missingFieldsPrefix: '不足:',
    languageCompatibility: '言語互換性',
    languageCompatibilityDesc: '母国語タブと英語タブは同じ住所要素を保持し、英語のみ国際配送順に整形します。',
    instantTabSwitch: '即時タブ切替',
    fieldsCount: '{compatible}/{total} 項目',
    missingCurrentTabPrefix: '現在のタブで不足:',
    trustedAddressSources: '住所ソース一致度',
    trustedAddressSourcesDesc: 'OSM、郵便番号、行政データの一致度を分けて表示します。',
    sourceStatusMatched: '一致',
    sourceStatusCandidate: '候補',
    sourceStatusMissing: '不足',
    sourcePostalCode: '郵便番号',
    sourceAdministrativeData: '行政データ',
    applyFix: '修正を適用',
    inputAssistance: '入力補助',
    inputAssistanceDesc: '郵便番号とAGIDの自動補完比較、品質理由、修正履歴、同意状態をローカルで管理します。',
    reviewable: '確認可能',
    autofillComparison: '自動補完比較',
    recommendedPrefix: '推奨:',
    manualReview: '手動確認',
    sourcesCount: '{count} ソース',
    oneSource: '1 ソース',
    sourceLabel: '{source} ソース',
    applied: '適用済み',
    review: '確認',
    trust: '信頼度',
    fields: '項目',
    proof: '根拠',
    applyAgidHint: 'AGIDヒントを適用',
    trustWithValue: '信頼度 {value}',
    postcodeAssistance: '郵便番号補助',
    postcodeChecking: '設定済み郵便番号APIを確認中です。',
    postcodeFilled: '郵便番号APIで住所項目を補完しました。登録前に確認・編集してください。',
    postcodeCandidatesMode: 'この国では郵便番号APIが弱いため、候補を選んでから項目に反映します。',
    postcodeNoMatch: 'この国とコードに一致する郵便番号API結果はありません。',
    postcodeLookupFailed: '郵便番号API検索に失敗しました。手動登録は利用できます。',
    qualityReasons: '品質理由',
    feedbackConsent: 'フィードバック同意',
    localLearning: 'ローカル学習',
    feedbackConsentDesc: '修正と翻訳フィードバックは端末内の閉じた参照としてのみ保存します。外部送信はブロックされます。',
    consentEnabled: '同意あり: 修正履歴をローカル保存できます。',
    consentDisabled: '同意なし: 修正は学習用に保存されません。',
    correctionHistory: '修正履歴',
    correctionHistoryDesc: '住所補助編集のローカル匿名化履歴です。',
    localCount: '{count} ローカル',
    unknownCountry: '不明な国',
    changedFieldsPrefix: '変更:',
    assistanceSourceRefs: '{count} 補助ソース参照',
    noCorrectionHistory: 'ローカル修正履歴はまだありません。',
    professionalReadiness: '運用準備状況',
    registrationOperationalCheck: '住所登録の運用チェック',
    registrationOperationalDesc: '住所専門、配送、プライバシー、アクセシビリティ、レビュー、開発基盤の確認を同じNo raw addressセッションで実行します。',
    qrQualityMetadata: 'QR品質メタデータ',
    postalEvidence: '郵便根拠',
    manualPostal: '手動郵便',
    agidEvidence: 'AGID根拠',
    addressOnly: '住所のみ',
    qrQualityPublicDesc: '公開QRには状態、ソースフラグ、理由コードだけを保持します。',
    roleFix: '修正',
    roleReview: '確認',
    roleOk: 'OK',
    roleSummary: '{pass} pass / {review} review / {fix} fix',
    nextAction: '次のアクション',
    intentLabel: 'Intent',
    readinessRoleAddressing: '住所',
    readinessRoleCarrierOps: '配送',
    readinessRolePrivacy: 'プライバシー',
    readinessRoleA11y: 'A11y / i18n',
    readinessRoleSupport: 'レビュー',
    readinessRoleDeveloper: '開発',
    addressLanguageLabel: '住所言語',
    translatingAddressFields: '住所項目を翻訳中',
    translationFallbackKept: '翻訳できないため現在の項目を維持しました',
    closedTranslationLearning: '閉じた翻訳学習',
    translationFeedbackDesc: 'フィードバックはこの端末内に残り、自動アップロードや同期はされません。同意がある場合だけサンプルを保存します。',
    translationLooksGood: '翻訳は問題ない',
    useEditsForLearning: '編集内容を学習に使う',
    savedLocally: 'ローカル保存済み',
    nothingToSave: '保存対象なし',
    regionsBadge: '地域',
    buildingLookupLoading: 'OSM / Overture の建物候補を検索中',
    buildingCandidatesLabel: 'OSM / Overture 建物候補',
    buildingNoCandidate: '近くに名前付き建物候補はありません',
    buildingLookupUnavailable: '建物候補検索は利用できません',
    postcodeLookupLoading: '郵便番号を検索中',
    postalFieldsFilled: '郵便データから住所項目を補完しました',
    postalCandidates: '郵便番号候補',
    noPostalMatchFound: '郵便番号の一致がありません',
    noPostalAgidPrimary: '郵便番号なし / AGID主識別',
    noPostalAgidPrimaryDesc: 'この地域では信頼できる郵便番号項目を使いません。AGID、座標、行政項目、手動確認で登録します。',
    registrationLoadingFormat: '形式を読み込み中...',
    selectCountryRegion: '国 / 地域を選択',
    selectCountryRegionDesc: 'この住所の配送先を選択してください',
    unknownRegion: '不明な地域',
    countriesTerritories: '国・地域',
    countryStepLabel: '国',
    addressStepLabel: '住所',
    evidenceStepLabel: '根拠',
    reviewStepLabel: '確認',
    selectDestination: '配送先を選択',
    requiredFieldsComplete: '必須項目は入力済み',
    requiredFieldsLeft: '{count} 個の必須項目が未入力',
    compatibilityCompatible: '互換',
    compatibilityNeedsReview: '要確認',
    compatibilityWeak: '互換性が弱い',
    convertToSimplifiedChinese: '簡体字に変換 (中国本土標準)',
    convertToTraditionalChinese: '繁体字に変換 ({country} 標準)',
    addColombiaHousePrefix: '家屋番号に "#" を追加 (コロンビア標準)',
    normalizeFullwidth: '全角英数字を正規化',
    tab_indian_langs: 'インド諸語',
    tab_sa_langs: '南アフリカ諸語',
    tab_de_langs: 'ゲルマン諸語',
    tab_regional_langs: '地域言語',
    tab_es_regional: 'スペイン諸州',
    tab_it_regional: 'イタリア諸州',
    tab_latam_es: 'スペイン語 (グローバル)',
    tab_lusosphere: 'ポルトガル語 (グローバル)',
    tab_arabic_global: 'アラビア語 (グローバル)',
    tab_mena_langs: '中東・北アフリカ (他諸語)',
    tab_anglosphere: '英語圏 (グローバル)',
    tab_greater_china: '大中華圏',
    tab_francophonie: 'フランス語圏',
    tab_zh_hans: '簡体字中国語',
    tab_zh_hant: '繁体字中国語'
  },
  de: {
    quickLookup: 'Schnellsuche',
    addressRegistration: 'Adressregistrierung',
    globalAddressInput: 'Globale Adresseingabe',
    registerAddress: 'Adresse registrieren',
    countryRegion: 'Land / Region',
    phone: 'Telefon',
    agid: 'AGID',
    lookupSuccess: 'Adressfelder ausgefüllt!',
    postcodePlaceholder: 'Postleitzahl',
    jpAdminDetails: 'Verwaltungsdetails',
    prefecture: 'Bundesland',
    cityWard: 'Stadt / Bezirk',
    townVillage: 'Gemeinde / Dorf',
    chome: 'Chome',
    historicalName: 'Historischer Name',
    province: 'Provinz',
    district: 'Regierungsbezirk',
    ward: 'Stadtteil / Bezirk',
    town: 'Stadt',
    village: 'Dorf',
    commune: 'Kommune',
    parish: 'Gemeinde (Pfarrei)',
    quarter: 'Quartier',
    neighborhood: 'Viertel',
    governorate: 'Gouvernement',
    emirate: 'Emirat',
    municipality: 'Gemeinde',
    county: 'Landkreis',
    oblast: 'Oblast',
    viloyat: 'Viloyat',
    region: 'Region',
    department: 'Abteilung / Bezirk',
    canton: 'Kanton',
    island: 'Insel',
    atoll: 'Atoll',
    soum: 'Soum',
    bag: 'Bag',
    block: 'Block',
    lot: 'Lot',
    section: 'Sektion',
    lane: 'Gasse',
    alley: 'Allee',
    floor: 'Etage',
    room: 'Zimmer',
    registerAoid: 'AOID generieren & registrieren',
    aoidTip: 'AOID ist eine private Adress-ID. Sie enthält Gebäudenamen, Zimmernummern und Kontaktinfo.',
    registerAsAoid: 'Privat als AOID registrieren',
    phoneRequired: 'Telefonnummer ist erforderlich',
    nameRequired: 'Name ist erforderlich',
    tab_indian_langs: 'Indische Sprachen',
    tab_sa_langs: 'Südafrikanische Sprachen',
    tab_de_langs: 'Germanische Sprachen',
    tab_regional_langs: 'Regionalsprachen',
    tab_es_regional: 'Regionen Spanien',
    tab_it_regional: 'Regionen Italien',
    tab_latam_es: 'Spanisch (Global)',
    tab_lusosphere: 'Portugiesisch (Global)',
    tab_arabic_global: 'Arabisch (Global)',
    tab_mena_langs: 'MENA-Sprachen',
    tab_anglosphere: 'Anglosphäre',
    tab_greater_china: 'Großchina',
    tab_francophonie: 'Frankophonie',
    tab_zh_hans: 'Vereinfachtes Chinesisch',
    tab_zh_hant: 'Traditionelles Chinesisch'
  },
  en: {
    quickLookup: 'Quick Lookup',
    addressRegistration: 'Address Registration',
    globalAddressInput: 'Global Address Input (libaddressinput)',
    registerAddress: 'Register Address',
    countryRegion: 'Country / Region',
    phone: 'Phone',
    agid: 'AGID',
    lookupSuccess: 'Address fields populated!',
    lookupError: 'Lookup failed',
    recipient: 'Recipient Name',
    organization: 'Organization',
    street: 'Street Address',
    city: 'City / Town',
    state: 'State / Province',
    suburb: 'Suburb / District',
    postcode: 'Postal Code',
    phonePlaceholder: 'Phone Number (with country code)',
    agidPlaceholder: 'AGID (e.g. JP12345678)',
    postcodeLookup: 'Postcode Lookup',
    postcodePlaceholder: '7-digit postcode',
    jpAdminDetails: 'Japanese Administrative Details',
    prefecture: 'Prefecture',
    cityWard: 'City / Ward',
    townVillage: 'Town / Village',
    chome: 'Chome',
    historicalName: 'Historical Name',
    province: 'Province',
    district: 'District',
    ward: 'Ward',
    town: 'Town',
    village: 'Village',
    commune: 'Commune',
    parish: 'Parish',
    quarter: 'Quarter',
    neighborhood: 'Neighborhood',
    governorate: 'Governorate',
    emirate: 'Emirate',
    municipality: 'Municipality',
    county: 'County',
    oblast: 'Oblast',
    viloyat: 'Viloyat',
    region: 'Region',
    department: 'Department',
    canton: 'Canton',
    island: 'Island',
    atoll: 'Atoll',
    soum: 'Soum',
    bag: 'Bag',
    block: 'Block',
    lot: 'Lot',
    section: 'Section',
    lane: 'Lane',
    alley: 'Alley',
    floor: 'Floor',
    room: 'Room',
    registerAoid: 'Generate & Register AOID',
    aoidTip: 'AOID is a private ID containing fixed details like building, room, and phone. Not searchable by others.',
    registerAsAoid: 'Register as Private AOID',
    identifierMode: 'Identifier to save',
    agidSaveTip: 'Save the AGID as a public location ID on this device.',
    showDetails: 'Details',
    hideDetails: 'Hide details',
    phoneRequired: 'Phone is required for AOID',
    nameRequired: 'Name is required for AOID',
    documentAutofill: 'Autofill from photo/PDF',
    documentAutofillDesc: 'Read address candidates from shipping labels, photos, or PDFs locally, fill empty fields, then edit before registration.',
    uploadDocument: 'Choose photo or PDF',
    readingDocument: 'Reading address',
    documentReady: 'Address candidates detected',
    documentNeedsReview: 'Review detected candidates',
    documentNeedsOcr: 'Image or scanned PDF needs an OCR engine',
    applyDocumentAddress: 'Apply detected address',
    documentPrivacy: 'Files are processed on this device and are not uploaded automatically.',
    extractedAddressText: 'Extracted text',
    documentAi: 'Address Reading AI',
    registrationStepsSafety: 'Registration steps and safety',
    workflowLabel: 'Workflow',
    registrationStepsLabel: 'Registration steps',
    noRawExport: 'No raw export',
    noRawExportDesc: 'Inputs stay editable locally. External handoff only receives status, fingerprint, and intent.',
    statusReady: 'Ready',
    statusUsable: 'Usable',
    statusNeedsReview: 'Needs review',
    statusBlocked: 'Blocked',
    qrIntakeLabel: 'QR intake',
    qrIntakeTitle: 'Address can be filled from QR',
    qrIntakeDesc: 'Scanned content is not finalized automatically. It is applied as an editable draft. For hotel check-in, guest address details are reviewed on this device before registration.',
    localReview: 'Local review',
    addressQrFilled: 'Address QR filled',
    addressQrReviewDesc: 'Review the fields below before saving or using this address for check-in.',
    hotelCheckIn: 'Hotel check-in',
    postalCoveragePolicyLabel: 'Postal / AGID routing policy',
    postalCoverageAutoBadge: 'Auto-complete',
    postalCoverageReliableTitle: 'Postal code strong country',
    postalCoverageReliableDesc: 'Postal-code metadata is reliable enough to autofill administrative fields, then show review evidence before registration.',
    postalCoverageCandidatesBadge: 'Candidates only',
    postalCoverageWeakTitle: 'Postal code weak country',
    postalCoverageWeakDesc: 'Postal-code format is checked, but API coverage is limited. Candidates are shown for selection and manual input remains authoritative.',
    postalCoverageAgidBadge: 'AGID primary',
    postalCoverageStrongGeoTitle: 'No postal code / strong geo OSS',
    postalCoverageStrongGeoDesc: 'Postal code is not the primary identifier. AGID, coordinates, administrative hierarchy, and open geographic features drive Geo Verified display.',
    postalCoverageManualTitle: 'No postal code / manual required',
    postalCoverageManualDesc: 'Postal code is unavailable and geo data is weak. AGID and coordinates are the primary identifier, with manual confirmation required.',
    internationalShippingLabel: 'International Shipping Label',
    domesticDeliveryFormat: 'Domestic Delivery Format',
    waitingForInput: 'Waiting for input...',
    modularChineseEngineActive: 'Modular Chinese Engine Active',
    simplifiedCanonical: 'Simplified Canonical',
    traditionalCanonical: 'Traditional Canonical',
    nativeInternationalCompatibility: 'Native / international compatibility',
    nativeInternationalCompatibilityDesc: 'Mother-language address and international shipping English use the same address elements, then English is rendered in shipping order.',
    nativeAddressLabel: 'Native address',
    waitingForNativeAddress: 'Waiting for native address fields',
    internationalShippingEnglish: 'International shipping English',
    waitingForEnglishShipping: 'Waiting for English shipping fields',
    compatibleFieldsCount: '{compatible}/{total} compatible fields',
    englishInternationalOrder: 'English international order',
    missingFieldsPrefix: 'Missing:',
    languageCompatibility: 'Language compatibility',
    languageCompatibilityDesc: 'Native and English tabs keep the same address elements while English uses international order.',
    instantTabSwitch: 'Instant tab switch',
    fieldsCount: '{compatible}/{total} fields',
    missingCurrentTabPrefix: 'Missing in current tab:',
    trustedAddressSources: 'Trusted address sources',
    trustedAddressSourcesDesc: 'OSM, postal code, and administrative data agreement is shown separately.',
    sourceStatusMatched: 'Matched',
    sourceStatusCandidate: 'Candidate',
    sourceStatusMissing: 'Missing',
    sourcePostalCode: 'Postal code',
    sourceAdministrativeData: 'Administrative data',
    applyFix: 'Apply Fix',
    inputAssistance: 'Input Assistance',
    inputAssistanceDesc: 'Postal code vs AGID autofill comparison, quality reasons, correction history, and feedback consent stay local-first.',
    reviewable: 'Reviewable',
    autofillComparison: 'Autofill comparison',
    recommendedPrefix: 'Recommended:',
    manualReview: 'manual review',
    sourcesCount: '{count} sources',
    oneSource: '1 source',
    sourceLabel: '{source} source',
    applied: 'Applied',
    review: 'Review',
    trust: 'Trust',
    fields: 'Fields',
    proof: 'Proof',
    applyAgidHint: 'Apply AGID hint',
    trustWithValue: 'Trust {value}',
    postcodeAssistance: 'Postal-code assistance',
    postcodeChecking: 'Checking the configured postal-code API.',
    postcodeFilled: 'Postal-code API filled address fields. Review and edit before registering.',
    postcodeCandidatesMode: 'Postal-code API is weak for this country; choose a candidate before fields are filled.',
    postcodeNoMatch: 'No postal-code API match was found for this country and code.',
    postcodeLookupFailed: 'Postal-code API lookup failed; manual registration remains available.',
    qualityReasons: 'Quality reasons',
    feedbackConsent: 'Feedback consent',
    localLearning: 'Local learning',
    feedbackConsentDesc: 'Corrections and translation feedback are saved only as closed-device-local references. External transmission is blocked.',
    consentEnabled: 'Consent enabled: correction history can be saved locally.',
    consentDisabled: 'Consent disabled: corrections are not saved for learning.',
    correctionHistory: 'Correction history',
    correctionHistoryDesc: 'Local redacted history for assisted address edits.',
    localCount: '{count} local',
    unknownCountry: 'Unknown country',
    changedFieldsPrefix: 'Changed:',
    assistanceSourceRefs: '{count} assistance source refs',
    noCorrectionHistory: 'No local correction history yet.',
    professionalReadiness: 'Professional readiness',
    registrationOperationalCheck: 'Address Registration operational check',
    registrationOperationalDesc: 'Addressing, carrier, privacy, accessibility, review, and developer platform checks run from the same no-raw-address session.',
    qrQualityMetadata: 'QR quality metadata',
    postalEvidence: 'postal evidence',
    manualPostal: 'manual postal',
    agidEvidence: 'agid evidence',
    addressOnly: 'address only',
    qrQualityPublicDesc: 'Public QR keeps status, source flags, and reason codes only.',
    roleFix: 'Fix',
    roleReview: 'Review',
    roleOk: 'OK',
    roleSummary: '{pass} pass / {review} review / {fix} fix',
    nextAction: 'Next action',
    intentLabel: 'Intent',
    readinessRoleAddressing: 'Addressing',
    readinessRoleCarrierOps: 'Carrier ops',
    readinessRolePrivacy: 'Privacy',
    readinessRoleA11y: 'A11y / i18n',
    readinessRoleSupport: 'Review',
    readinessRoleDeveloper: 'Developer',
    addressLanguageLabel: 'Address Language',
    translatingAddressFields: 'Translating address fields',
    translationFallbackKept: 'Translation fallback kept the current fields',
    closedTranslationLearning: 'Closed translation learning',
    translationFeedbackDesc: 'Feedback stays on this device. It is not uploaded or synced automatically. Feedback consent controls whether this sample is saved.',
    translationLooksGood: 'Translation looks good',
    useEditsForLearning: 'Use my edits for learning',
    savedLocally: 'Saved locally',
    nothingToSave: 'Nothing to save',
    regionsBadge: 'Regions',
    buildingLookupLoading: 'Looking up OSM / Overture building candidates',
    buildingCandidatesLabel: 'OSM / Overture building candidates',
    buildingNoCandidate: 'No nearby named building candidate found',
    buildingLookupUnavailable: 'Building candidate lookup is unavailable',
    postcodeLookupLoading: 'Looking up postal code',
    postalFieldsFilled: 'Address fields filled from postal data',
    postalCandidates: 'Postal candidates',
    noPostalMatchFound: 'No postal match found',
    noPostalAgidPrimary: 'No postal code / AGID primary',
    noPostalAgidPrimaryDesc: 'This region does not use a reliable postal-code field. Registration will use AGID, coordinates, administrative fields, and manual review instead.',
    registrationLoadingFormat: 'Loading format...',
    selectCountryRegion: 'Select Country / Region',
    selectCountryRegionDesc: 'Choose the destination for this address',
    unknownRegion: 'Unknown region',
    countriesTerritories: 'Countries / Territories',
    countryStepLabel: 'Country',
    addressStepLabel: 'Address',
    evidenceStepLabel: 'Evidence',
    reviewStepLabel: 'Review',
    selectDestination: 'Select destination',
    requiredFieldsComplete: 'Required fields complete',
    requiredFieldsLeft: '{count} required left',
    compatibilityCompatible: 'Compatible',
    compatibilityNeedsReview: 'Needs review',
    compatibilityWeak: 'Weak compatibility',
    convertToSimplifiedChinese: 'Convert to Simplified Chinese (Mainland Standard)',
    convertToTraditionalChinese: 'Convert to Traditional Chinese ({country} Standard)',
    addColombiaHousePrefix: 'Add "#" prefix to house number (Colombia standard)',
    normalizeFullwidth: 'Normalize full-width alphanumeric characters',
    tab_indian_langs: 'Indian Languages',
    tab_sa_langs: 'South African Languages',
    tab_de_langs: 'Germanic Languages',
    tab_regional_langs: 'Regional Languages',
    tab_es_regional: 'Spain Regions',
    tab_it_regional: 'Italy Regions',
    tab_latam_es: 'Spanish (Global)',
    tab_lusosphere: 'Portuguese (Global)',
    tab_arabic_global: 'Arabic (Global)',
    tab_mena_langs: 'MENA (Other Languages)',
    tab_anglosphere: 'Anglosphere (Global)',
    tab_greater_china: 'Greater China',
    tab_francophonie: 'Francophonie',
    tab_zh_hans: 'Simplified Chinese',
    tab_zh_hant: 'Traditional Chinese'
  },
  'zh-Hant': {
    quickLookup: '快速搜索',
    addressRegistration: '地址註冊',
    globalAddressInput: '全球地址輸入',
    registerAddress: '註冊地址',
    countryRegion: '國家 / 地區',
    phone: '電話',
    agid: 'AGID',
    lookupSuccess: '地址已填充！',
    lookupError: '搜索失敗',
    recipient: '收件人姓名',
    organization: '組織 / 公司',
    street: '街道地址',
    city: '城市 / 鎮',
    state: '省 / 州',
    suburb: '地區 / 郊區',
    postcode: '郵政編碼',
    phonePlaceholder: '電話號碼（含國家代碼）',
    agidPlaceholder: 'AGID（例如 JP12345678）',
    postcodeLookup: '郵編搜索',
    postcodePlaceholder: '郵政編碼',
    jpAdminDetails: '日本行政詳情',
    prefecture: '都道府縣',
    cityWard: '市 / 區',
    townVillage: '町 / 村',
    chome: '丁目',
    historicalName: '歷史名稱',
    province: '省',
    district: '區 / 縣',
    ward: '區',
    town: '鎮',
    village: '村',
    commune: '市鎮',
    parish: '教區',
    quarter: '地區',
    neighborhood: '鄰里',
    governorate: '省 / 縣',
    emirate: '酋長國',
    municipality: '自治市',
    county: '郡 / 縣',
    oblast: '州 (Oblast)',
    viloyat: '州 (Viloyat)',
    region: '區域',
    department: '省 (Department)',
    canton: '州 (Canton)',
    island: '島嶼',
    atoll: '環礁',
    soum: '蘇木',
    bag: '巴格',
    block: '街區',
    lot: '地號',
    section: '部分',
    lane: '巷',
    alley: '弄',
    floor: '樓層',
    room: '房間',
    registerAoid: '生成並註冊 AOID',
    aoidTip: 'AOID 是一個私人 ID，包含建築、房間和電話等固定詳情。其他人無法搜索。',
    registerAsAoid: '註冊為私人 AOID',
    phoneRequired: 'AOID 需要電話號碼',
    nameRequired: 'AOID 需要姓名',
    tab_indian_langs: '印度語言',
    tab_sa_langs: '南非語言',
    tab_de_langs: '日耳曼語言',
    tab_regional_langs: '地區語言',
    tab_es_regional: '西班牙地區',
    tab_it_regional: '意大利地區',
    tab_latam_es: '西班牙語 (全球)',
    tab_lusosphere: '葡萄牙語 (全球)',
    tab_arabic_global: '阿拉伯語 (全球)',
    tab_mena_langs: '中東北非語系',
    tab_anglosphere: '英語圈 (全球)',
    tab_greater_china: '大中華地區',
    tab_francophonie: '法語圈',
    tab_zh_hans: '簡體中文',
    tab_zh_hant: '繁體中文'
  },
  'zh-Hans': {
    quickLookup: '快速搜索',
    addressRegistration: '地址注册',
    globalAddressInput: '全球地址输入',
    registerAddress: '注册地址',
    countryRegion: '国家 / 地区',
    phone: '电话',
    agid: 'AGID',
    lookupSuccess: '地址已填充！',
    lookupError: '搜索失败',
    recipient: '收件人姓名',
    organization: '组织 / 公司',
    street: '街道地址',
    city: '城市 / 镇',
    state: '省 / 市',
    suburb: '地区 / 街道',
    postcode: '邮政编码',
    phonePlaceholder: '电话号码（含国家代码）',
    agidPlaceholder: 'AGID（例如 JP12345678）',
    postcodeLookup: '邮编搜索',
    postcodePlaceholder: '邮政编码',
    jpAdminDetails: '日本行政详情',
    prefecture: '都道府县',
    cityWard: '市 / 区',
    townVillage: '町 / 村',
    chome: '丁目',
    historicalName: '历史名称',
    province: '省',
    district: '地区 / 县',
    ward: '区',
    town: '镇',
    village: '村',
    commune: '市镇',
    parish: '教区',
    quarter: '地区',
    neighborhood: '邻里',
    governorate: '省 / 县',
    emirate: '酋长国',
    municipality: '自治市',
    county: '郡 / 县',
    oblast: '州 (Oblast)',
    viloyat: '州 (Viloyat)',
    region: '区域',
    department: '省 (Department)',
    canton: '州 (Canton)',
    island: '岛屿',
    atoll: '环礁',
    soum: '苏木',
    bag: '巴格',
    block: '街区',
    lot: '地号',
    section: '部分',
    lane: '巷',
    alley: '弄',
    floor: '楼层',
    room: '房间',
    registerAoid: '生成并注册 AOID',
    aoidTip: 'AOID 是一个私人 ID，包含建筑、房间和电话等固定详情。其他人无法搜索。',
    registerAsAoid: '注册为私人 AOID',
    phoneRequired: 'AOID 需要电话号码',
    nameRequired: 'AOID 需要姓名',
    tab_indian_langs: '印度语言',
    tab_sa_langs: '南非语言',
    tab_de_langs: '日耳曼语言',
    tab_regional_langs: '地区语言',
    tab_es_regional: '西班牙地区',
    tab_it_regional: '意大利地区',
    tab_latam_es: '西班牙语 (全球)',
    tab_lusosphere: '葡萄牙语 (全球)',
    tab_arabic_global: '阿拉伯语 (全球)',
    tab_mena_langs: '中东北非语系',
    tab_anglosphere: '英语圈 (全球)',
    tab_greater_china: '大中华地区',
    tab_francophonie: '法语圈',
    tab_zh_hans: '简体中文',
    tab_zh_hant: '繁体中文'
  },
  'es': {
    quickLookup: 'Búsqueda Rápida',
    addressRegistration: 'Registro de Dirección',
    globalAddressInput: 'Entrada de Dirección Global',
    registerAddress: 'Registrar Dirección',
    countryRegion: 'País / Región',
    phone: 'Teléfono',
    agid: 'AGID',
    lookupSuccess: '¡Campos de dirección completados!',
    lookupError: 'Error en la búsqueda',
    recipient: 'Nombre del Destinatario',
    organization: 'Organización / Empresa',
    street: 'Dirección (Calle)',
    city: 'Ciudad / Población',
    state: 'Estado / Provincia',
    suburb: 'Suburbio / Barrio',
    postcode: 'Código Postal',
    phonePlaceholder: 'Número de Teléfono (con código de país)',
    agidPlaceholder: 'AGID (ej. JP12345678)',
    postcodeLookup: 'Buscar por CP',
    postcodePlaceholder: 'Código postal',
    jpAdminDetails: 'Detalles Adm. Japoneses',
    prefecture: 'Prefectura',
    cityWard: 'Ciudad / Distrito',
    townVillage: 'Pueblo / Aldea',
    chome: 'Chome',
    historicalName: 'Nombre Histórico',
    province: 'Provincia',
    district: 'Distrito',
    ward: 'Distrito / Barrio',
    town: 'Pueblo',
    village: 'Aldea / Villa',
    commune: 'Comuna',
    parish: 'Parroquia',
    quarter: 'Barrio / Cuartel',
    neighborhood: 'Vecindario',
    governorate: 'Gobernación',
    emirate: 'Emirato',
    municipality: 'Municipio',
    county: 'Condado',
    oblast: 'Óblast',
    viloyat: 'Viloyat',
    region: 'Región',
    department: 'Departamento',
    canton: 'Cantón',
    island: 'Isla',
    atoll: 'Atolón',
    soum: 'Soum',
    bag: 'Bag',
    block: 'Bloque',
    lot: 'Lote',
    section: 'Sección',
    lane: 'Callejón / Senda',
    alley: 'Callejón',
    floor: 'Piso',
    room: 'Habitación',
    registerAoid: 'Generar y Registrar AOID',
    aoidTip: 'AOID es un ID privado con detalles fijos como edificio, habitación y teléfono. No es público.',
    registerAsAoid: 'Registrar como AOID Privado',
    phoneRequired: 'El teléfono es obligatorio para AOID',
    nameRequired: 'El nombre es obligatorio para AOID',
    tab_indian_langs: 'Lenguas Indias',
    tab_sa_langs: 'Lenguas Sudafricanas',
    tab_de_langs: 'Lenguas Germánicas',
    tab_regional_langs: 'Lenguas Regionales',
    tab_es_regional: 'Regiones de España',
    tab_it_regional: 'Regiones de Italia',
    tab_latam_es: 'Español (Global)',
    tab_lusosphere: 'Português (Global)',
    tab_arabic_global: 'Árabe (Global)',
    tab_mena_langs: 'Lenguas MENA',
    tab_anglosphere: 'Anglosfera',
    tab_greater_china: 'Gran China',
    tab_francophonie: 'Francofonía',
    tab_zh_hans: 'Chino Simplificado',
    tab_zh_hant: 'Chino Tradicional'
  },
  'pt': {
    quickLookup: 'Busca Rápida',
    addressRegistration: 'Registro de Endereço',
    globalAddressInput: 'Entrada de Endereço Global',
    registerAddress: 'Registrar Endereço',
    countryRegion: 'País / Região',
    phone: 'Telefone',
    agid: 'AGID',
    lookupSuccess: 'Campos de endereço preenchidos!',
    lookupError: 'Falha na busca',
    recipient: 'Nome do Destinatário',
    organization: 'Organização / Empresa',
    street: 'Endereço (Rua)',
    city: 'Cidade / Localidade',
    state: 'Estado / Província',
    suburb: 'Bairro / Distrito',
    postcode: 'Código Postal',
    phonePlaceholder: 'Número de Telefone (com código de país)',
    agidPlaceholder: 'AGID (ex. JP12345678)',
    postcodeLookup: 'Buscar CEP',
    postcodePlaceholder: 'Código postal',
    jpAdminDetails: 'Detalhes Adm. Japoneses',
    prefecture: 'Prefeitura',
    cityWard: 'Cidade / Distrito',
    townVillage: 'Vila / Aldeia',
    chome: 'Chome',
    historicalName: 'Nome Histórico',
    province: 'Província',
    district: 'Distrito',
    ward: 'Distrito / Bairro',
    town: 'Vila',
    village: 'Aldeia',
    commune: 'Comuna',
    parish: 'Freguesia',
    quarter: 'Bairro',
    neighborhood: 'Vizinhança',
    governorate: 'Província / Município',
    emirate: 'Emirado',
    municipality: 'Município',
    county: 'Condado',
    oblast: 'Oblast',
    viloyat: 'Viloyat',
    region: 'Região',
    department: 'Departamento',
    canton: 'Cantão',
    island: 'Ilha',
    atoll: 'Atol',
    soum: 'Soum',
    bag: 'Bag',
    block: 'Bloco',
    lot: 'Lote',
    section: 'Seção',
    lane: 'Travessa',
    alley: 'Beco',
    floor: 'Andar',
    room: 'Sala',
    registerAoid: 'Gerar e Registrar AOID',
    aoidTip: 'AOID é um ID privado com detalhes fixos como prédio, sala e telefone. Não é público.',
    registerAsAoid: 'Registrar como AOID Privado',
    phoneRequired: 'Telefone é obrigatório para AOID',
    nameRequired: 'Nome é obrigatório para AOID',
    tab_indian_langs: 'Línguas Indianas',
    tab_sa_langs: 'Línguas Sul-Africanas',
    tab_de_langs: 'Línguas Germânicas',
    tab_regional_langs: 'Línguas Regionais',
    tab_es_regional: 'Regiões da Espanha',
    tab_it_regional: 'Regiões da Itália',
    tab_latam_es: 'Espanhol (Global)',
    tab_lusosphere: 'Português (Global)',
    tab_arabic_global: 'Árabe (Global)',
    tab_mena_langs: 'Línguas MENA',
    tab_anglosphere: 'Anglosfera',
    tab_greater_china: 'Grande China',
    tab_francophonie: 'Francofonia',
    tab_zh_hans: 'Chinês Simplificado',
    tab_zh_hant: 'Chinês Tradicional'
  },
  'fr': {
    quickLookup: 'Recherche Rapide',
    addressRegistration: 'Enregistrement d\'Adresse',
    globalAddressInput: 'Saisie d\'Adresse Globale',
    registerAddress: 'Enregistrer l\'Adresse',
    countryRegion: 'Pays / Région',
    phone: 'Téléphone',
    agid: 'AGID',
    lookupSuccess: 'Champs d\'adresse remplis !',
    lookupError: 'Échec de la recherche',
    recipient: 'Nom du Destinataire',
    organization: 'Organisation / Entreprise',
    street: 'Adresse (Rue)',
    city: 'Ville / Localité',
    state: 'État / Province',
    suburb: 'Quartier / Banlieue',
    postcode: 'Code Postal',
    phonePlaceholder: 'Numéro de téléphone (avec code pays)',
    agidPlaceholder: 'AGID (ex. JP12345678)',
    postcodeLookup: 'Recherche Code Postal',
    postcodePlaceholder: 'Code postal',
    jpAdminDetails: 'Détails Adm. Japonais',
    prefecture: 'Préfecture',
    cityWard: 'Ville / Arrondissement',
    townVillage: 'Commune / Village',
    chome: 'Chome',
    historicalName: 'Nom Historique',
    province: 'Province',
    district: 'District',
    ward: 'Arrondissement',
    town: 'Ville',
    village: 'Village',
    commune: 'Commune',
    parish: 'Paroisse',
    quarter: 'Quartier',
    neighborhood: 'Voisinage',
    governorate: 'Gouvernorat',
    emirate: 'Émirat',
    municipality: 'Municipalité',
    county: 'Comté',
    oblast: 'Oblast',
    viloyat: 'Viloyat',
    region: 'Région',
    department: 'Département',
    canton: 'Canton',
    island: 'Île',
    atoll: 'Atoll',
    soum: 'Soum',
    bag: 'Bag',
    block: 'Bloc',
    lot: 'Lot',
    section: 'Section',
    lane: 'Allée',
    alley: 'Ruelle',
    floor: 'Étage',
    room: 'Appartement / Chambre',
    registerAoid: 'Générer & Enregistrer AOID',
    aoidTip: 'AOID est un identifiant privé contenant des détails comme le bâtiment et le téléphone. Non public.',
    registerAsAoid: 'Enregistrer comme AOID Privé',
    phoneRequired: 'Téléphone requis pour AOID',
    nameRequired: 'Nom requis pour AOID',
    tab_indian_langs: 'Langues Indiennes',
    tab_sa_langs: 'Langues Sud-Africaines',
    tab_de_langs: 'Langues Germaniques',
    tab_regional_langs: 'Langues Régionales',
    tab_es_regional: 'Régions d\'Espagne',
    tab_it_regional: 'Régions d\'Italie',
    tab_latam_es: 'Espagnol (Global)',
    tab_lusosphere: 'Portugais (Global)',
    tab_arabic_global: 'Arabe (Global)',
    tab_mena_langs: 'Langues MENA',
    tab_anglosphere: 'Anglosphère',
    tab_greater_china: 'Grand Chine',
    tab_francophonie: 'Francophonie',
    tab_zh_hans: 'Chinois Simplifié',
    tab_zh_hant: 'Chinois Traditionnel'
  },
  'ar': {
    quickLookup: 'بحث سريع',
    addressRegistration: 'تسجيل العنوان',
    globalAddressInput: 'إدخال العنوان العالمي',
    registerAddress: 'تسجيل العنوان',
    countryRegion: 'البلد / المنطقة',
    phone: 'الهاتف',
    agid: 'AGID',
    lookupSuccess: 'تم ملء حقول العنوان!',
    lookupError: 'فشل البحث',
    recipient: 'اسم المستلم',
    organization: 'المنظمة / الشركة',
    street: 'عنوان الشارع',
    city: 'المدينة',
    state: 'الولاية / المقاطعة',
    suburb: 'الضاحية / الحي',
    postcode: 'الرمز البريدي',
    phonePlaceholder: 'رقم الهاتف (مع رمز البلد)',
    agidPlaceholder: 'AGID (مثلاً JP12345678)',
    postcodeLookup: 'بحث بالرمز البريدي',
    postcodePlaceholder: 'الرمز البريدي',
    jpAdminDetails: 'التفاصيل الإدارية اليابانية',
    prefecture: 'محافظة',
    cityWard: 'مدينة / حي',
    townVillage: 'بلدة / قرية',
    chome: 'تشومي',
    historicalName: 'الاسم التاريخي',
    province: 'مقاطعة',
    district: 'مديرية / حي',
    ward: 'جناح',
    town: 'بلدة',
    village: 'قرية',
    commune: 'بلدية',
    parish: 'أبرشية',
    quarter: 'ربع',
    neighborhood: 'جوار',
    governorate: 'محافظة',
    emirate: 'إمارة',
    municipality: 'بلدية',
    county: 'مقاطعة',
    oblast: 'أوبلاست',
    viloyat: 'فيلايت',
    region: 'منطقة',
    department: 'قسم',
    canton: 'كانتون',
    island: 'جزيرة',
    atoll: 'شعب حلقي',
    soum: 'سوم',
    bag: 'باغ',
    block: 'كتلة',
    lot: 'قطعة أرض',
    section: 'قسم',
    lane: 'ممر',
    alley: 'زقاق',
    floor: 'طابق',
    room: 'غرفة',
    registerAoid: 'توليد وتسجيل AOID',
    aoidTip: 'AOID هو معرف خاص يحتوي على تفاصيل المبنى والهاتف. ليس علنياً.',
    registerAsAoid: 'تسجيل كـ AOID خاص',
    phoneRequired: 'الهاتف مطلوب لـ AOID',
    nameRequired: 'الاسم مطلوب لـ AOID',
    tab_indian_langs: 'اللغات الهندية',
    tab_sa_langs: 'لغات جنوب أفريقيا',
    tab_de_langs: 'اللغات الجرمانية',
    tab_regional_langs: 'اللغات الإقليمية',
    tab_es_regional: 'مناطق إسبانيا',
    tab_it_regional: 'مناطق إيطاليا',
    tab_latam_es: 'الإسبانية (عالمي)',
    tab_lusosphere: 'البرتغالية (عالمي)',
    tab_arabic_global: 'العربية (عالمي)',
    tab_mena_langs: 'لغات الشرق الأوسط',
    tab_anglosphere: 'الأنجلوسفير',
    tab_greater_china: 'الصين الكبرى',
    tab_francophonie: 'الفرنكوفونية',
    tab_zh_hans: 'الصينية المبسطة',
    tab_zh_hant: 'الصينية التقليدية'
  }
};



export const AddressRegistration: React.FC<AddressRegistrationProps> = ({
  isOpen,
  onClose,
  onRegister,
  initialAgid,
  initialAddressDetails,
  currentCoords,
  forceAoidMode,
  appLanguage = 'en',
  addressLanguage = 'local',
  initialQrRecord,
  initialHotelCheckInSession,
}) => {
  const [agidInput] = useState(initialAgid || '');
  const [, setError] = useState<string | null>(null);
  const [, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    country: 'JP',
    recipient: '',
    organization: '',
    street: '',
    city: '',
    state: '',
    postcode: '',
    suburb: '',
    phone: '',
    building: '',
    room: '',
  });

  const [isAoidMode, setIsAoidMode] = useState(forceAoidMode || false);
  const [showRegistrationDetails, setShowRegistrationDetails] = useState(false);
  const registrationUiLanguage = useMemo(() => normalizeRegistrationUiLanguage(appLanguage), [appLanguage]);
  const [activeTab, setActiveTab] = useState<string>(() => normalizeRegistrationAddressLanguage(addressLanguage));
  const [viewMode, setViewMode] = useState<'form' | 'country-select'>('form');
  const [selectedCountryTab, setSelectedCountryTab] = useState<RegistrationCountryTabId>('asia');
  const [localFormat, setLocalFormat] = useState<AddressFormat | null>(null);
  const [postcodeLookupStatus, setPostcodeLookupStatus] = useState<PostcodeLookupStatus>('idle');
  const [addressTranslationStatus, setAddressTranslationStatus] = useState<'idle' | 'translating' | 'translated' | 'error'>('idle');
  const [agidData, setAgidData] = useState<any>(null);
  const languageDraftsRef = React.useRef<Record<string, typeof formData>>({});
  const lastPostcodeLookupRef = React.useRef('');
  const previousCountryRef = React.useRef(formData.country);
  const appliedInitialAddressDetailsRef = React.useRef('');
  const appliedInitialQrRecordRef = React.useRef('');
  const assistedDraftRef = React.useRef<typeof formData | null>(null);
  const appliedAssistanceIdsRef = React.useRef<string[]>([]);
  const translationFeedbackRef = React.useRef<{
    sourceDraft: typeof formData;
    translatedDraft: typeof formData;
    sourceLanguage: string;
    targetLanguage: string;
    sampleId?: string;
  } | null>(null);
  const supportedCountryCodes = useMemo(() => COUNTRIES.map(country => country.code), []);
  const [agidAssistanceCandidate, setAgidAssistanceCandidate] = useState<RegistrationAssistanceCandidate<typeof formData> | null>(null);
  const [postcodeAssistanceCandidate, setPostcodeAssistanceCandidate] = useState<RegistrationAssistanceCandidate<typeof formData> | null>(null);
  const [postcodeAutofillCandidates, setPostcodeAutofillCandidates] = useState<RegistrationAssistanceCandidate<typeof formData>[]>([]);
  const [correctionHistory, setCorrectionHistory] = useState<RegistrationCorrectionSample[]>([]);
  const [feedbackConsent, setFeedbackConsent] = useState(true);
  const [translationFeedbackStatus, setTranslationFeedbackStatus] = useState<'idle' | 'ready' | 'saved' | 'error'>('idle');
  const addressDocumentInputRef = React.useRef<HTMLInputElement | null>(null);
  const [documentReadResult, setDocumentReadResult] = useState<AddressDocumentReadResult | null>(null);
  const [documentReadStatus, setDocumentReadStatus] = useState<'idle' | 'reading' | 'ready' | 'review' | 'needs-ocr' | 'error'>('idle');
  const [documentReadError, setDocumentReadError] = useState('');
  const [buildingNameCandidates, setBuildingNameCandidates] = useState<BuildingNameCandidate[]>([]);
  const [buildingNameStatus, setBuildingNameStatus] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle');
  const lastBuildingNameLookupRef = React.useRef('');

  useEffect(() => {
    if (initialAgid) {
      const decoded = decodeAGID(initialAgid);
      setAgidData(decoded);
    }
  }, [initialAgid]);

  useEffect(() => {
    if (!isOpen) return;
    setShowRegistrationDetails(false);
    setCorrectionHistory(listRegistrationCorrectionSamples(undefined, 4));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setAgidAssistanceCandidate(null);
      setPostcodeAssistanceCandidate(null);
      setPostcodeAutofillCandidates([]);
      setPostcodeLookupStatus('idle');
      setBuildingNameCandidates([]);
      setBuildingNameStatus('idle');
      lastBuildingNameLookupRef.current = '';
      return;
    }
    setAgidAssistanceCandidate(buildAgidRegistrationAutofillCandidate({
      agid: agidInput || initialAgid,
      decoded: agidData,
      coords: currentCoords,
      supportedCountryCodes,
    }));
  }, [
    agidData,
    agidInput,
    currentCoords,
    initialAgid,
    isOpen,
    supportedCountryCodes,
  ]);

  useEffect(() => {
    if (!isOpen) {
      appliedInitialAddressDetailsRef.current = '';
      appliedInitialQrRecordRef.current = '';
      assistedDraftRef.current = null;
      appliedAssistanceIdsRef.current = [];
      translationFeedbackRef.current = null;
      setTranslationFeedbackStatus('idle');
      setAgidAssistanceCandidate(null);
      setPostcodeAssistanceCandidate(null);
      setCorrectionHistory([]);
      setDocumentReadResult(null);
      setDocumentReadStatus('idle');
      setDocumentReadError('');
      setBuildingNameCandidates([]);
      setBuildingNameStatus('idle');
      lastBuildingNameLookupRef.current = '';
      return;
    }

    const details = initialAddressDetails?.address_analysis?.canonical
      ? { ...initialAddressDetails, ...initialAddressDetails.address_analysis.canonical }
      : initialAddressDetails;
    if (!details) return;

    const key = [
      initialAgid,
      details.country_code,
      details.postcode,
      details.building,
      details.building_en,
      details.road || details.street,
      details.house_number || details.houseNumber,
    ].filter(Boolean).join('|');
    if (!key || key === appliedInitialAddressDetailsRef.current) return;
    appliedInitialAddressDetailsRef.current = key;

    setFormData(prev => {
      const next = {
        ...prev,
        country: String(details.country_code || prev.country).toUpperCase(),
        organization: details.building || details.building_en || details.organization || details.poi || prev.organization,
        street: [
          details.house_number || details.houseNumber,
          details.road || details.street,
        ].filter(Boolean).join(' ') || prev.street,
        city: details.city || details.town || details.village || prev.city,
        state: details.state || details.province || details.region || prev.state,
        postcode: details.postcode || prev.postcode,
        suburb: details.suburb || details.neighbourhood || details.district || prev.suburb,
      };
      assistedDraftRef.current = next;
      appliedAssistanceIdsRef.current = Array.from(new Set([
        ...appliedAssistanceIdsRef.current,
        `reverse-geocode:${key.slice(0, 64)}`,
      ]));
      return next;
    });
  }, [initialAddressDetails, initialAgid, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      appliedInitialQrRecordRef.current = '';
      return;
    }
    if (!initialQrRecord) return;

    const key = [
      initialQrRecord.id,
      initialQrRecord.updatedAt,
      initialQrRecord.registeredAt,
      initialQrRecord.type,
    ].filter(Boolean).join('|');
    if (!key || key === appliedInitialQrRecordRef.current) return;
    appliedInitialQrRecordRef.current = key;

    const patch = buildAddressInputPatchFromRegisteredQr(initialQrRecord);
    setFormData(prev => {
      const next = {
        ...prev,
        country: patch.country || prev.country,
        recipient: patch.recipient || prev.recipient,
        organization: patch.organization || prev.organization,
        street: patch.street || prev.street,
        suburb: patch.suburb || prev.suburb,
        city: patch.city || prev.city,
        state: patch.state || prev.state,
        postcode: patch.postcode || prev.postcode,
        phone: patch.phone || prev.phone,
        building: patch.building || prev.building,
        room: patch.room || prev.room,
      };
      assistedDraftRef.current = next;
      appliedAssistanceIdsRef.current = Array.from(new Set([
        ...appliedAssistanceIdsRef.current,
        `qr-autofill:${initialQrRecord.id}`,
      ]));
      return next;
    });

    if (
      initialQrRecord.type === 'AOID'
      && (initialQrRecord as { privacy?: unknown }).privacy !== 'public-reference'
    ) {
      setIsAoidMode(true);
    }
  }, [initialQrRecord, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(normalizeRegistrationAddressLanguage(addressLanguage));
    }
  }, [addressLanguage, isOpen]);

  useEffect(() => {
    const loadFormat = async () => {
      const format = await getAddressFormat(formData.country);
      setLocalFormat(format);
    };
    loadFormat();
  }, [formData.country]);

  useEffect(() => {
    if (!isOpen || !currentCoords) {
      setBuildingNameCandidates([]);
      setBuildingNameStatus('idle');
      return;
    }

    const lookupKey = [
      formData.country,
      activeTab,
      currentCoords.lat.toFixed(6),
      currentCoords.lon.toFixed(6),
    ].join(':');
    if (lookupKey === lastBuildingNameLookupRef.current) return;

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      lastBuildingNameLookupRef.current = lookupKey;
      setBuildingNameStatus('loading');

      try {
        const { fetchNearbyBuildingNameCandidates } = await import('../services/GeocodingService');
        const candidates = await fetchNearbyBuildingNameCandidates(
          currentCoords.lat,
          currentCoords.lon,
          activeTab,
          120,
        );
        if (cancelled) return;
        setBuildingNameCandidates(candidates.slice(0, 5));
        setBuildingNameStatus(candidates.length ? 'ready' : 'empty');
      } catch {
        if (cancelled) return;
        setBuildingNameCandidates([]);
        setBuildingNameStatus('error');
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [activeTab, currentCoords, formData.country, isOpen]);

  useEffect(() => {
    if (previousCountryRef.current === formData.country) return;
    previousCountryRef.current = formData.country;
    languageDraftsRef.current = { [activeTab]: formData };
    translationFeedbackRef.current = null;
    lastPostcodeLookupRef.current = '';
    setPostcodeAssistanceCandidate(null);
    setPostcodeAutofillCandidates([]);
    setPostcodeLookupStatus('idle');
    setBuildingNameCandidates([]);
    setBuildingNameStatus('idle');
    lastBuildingNameLookupRef.current = '';
    setAddressTranslationStatus('idle');
    setTranslationFeedbackStatus('idle');
  }, [activeTab, formData]);

  const addressLanguageTabs = useMemo(
    () => buildRegistrationAddressLanguageTabs(localFormat, formData.country),
    [localFormat, formData.country]
  );

  useEffect(() => {
    if (!addressLanguageTabs.length) return;
    if (!addressLanguageTabs.some(tab => tab.code === activeTab)) {
      setActiveTab(addressLanguageTabs[0].code);
    }
  }, [activeTab, addressLanguageTabs]);

  const t = (key: string) => {
    return UI_STRINGS[registrationUiLanguage]?.[key] || UI_STRINGS['en'][key] || key;
  };

  const formatUiString = (key: string, values: Record<string, string | number>) => {
    return Object.entries(values).reduce(
      (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
      t(key),
    );
  };

  const statusLabel = (status: string) => {
    if (status === 'ready') return t('statusReady');
    if (status === 'usable') return t('statusUsable');
    if (status === 'needs_review') return t('statusNeedsReview');
    if (status === 'blocked') return t('statusBlocked');
    return status.replace(/_/g, ' ');
  };

  const sourceAgreementStatusLabel = (status: string) => {
    if (status === 'matched') return t('sourceStatusMatched');
    if (status === 'candidate') return t('sourceStatusCandidate');
    return t('sourceStatusMissing');
  };

  const postcodeLookupMessage = (status: PostcodeLookupStatus) => {
    if (status === 'loading') return t('postcodeChecking');
    if (status === 'filled') return t('postcodeFilled');
    if (status === 'candidates') return t('postcodeCandidatesMode');
    if (status === 'empty') return t('postcodeNoMatch');
    if (status === 'error') return t('postcodeLookupFailed');
    return '';
  };

  const rememberAssistedDraft = React.useCallback((next: typeof formData, sourceId: string) => {
    assistedDraftRef.current = next;
    appliedAssistanceIdsRef.current = Array.from(new Set([
      ...appliedAssistanceIdsRef.current,
      sourceId,
    ]));
  }, []);

  const applyRegistrationAssistance = React.useCallback((candidate: RegistrationAssistanceCandidate<typeof formData>) => {
    languageDraftsRef.current = {};
    setAddressTranslationStatus('idle');
    translationFeedbackRef.current = null;
    setTranslationFeedbackStatus('idle');
    setFormData(prev => {
      const next = mergeRegistrationAssistancePatch(prev, candidate.patch, { overwrite: true });
      rememberAssistedDraft(next, candidate.id);
      return next;
    });
  }, [rememberAssistedDraft]);

  const applyDocumentReadCandidate = React.useCallback((
    candidate: RegistrationAssistanceCandidate<typeof formData>,
    overwrite = false,
  ) => {
    languageDraftsRef.current = {};
    setAddressTranslationStatus('idle');
    translationFeedbackRef.current = null;
    setTranslationFeedbackStatus('idle');
    setFormData(prev => {
      const next = mergeRegistrationAssistancePatch(prev, candidate.patch, { overwrite });
      rememberAssistedDraft(next, candidate.id);
      return next;
    });
  }, [rememberAssistedDraft]);

  const applyPostcodeAutofillCandidate = React.useCallback((
    candidate: RegistrationAssistanceCandidate<typeof formData>,
  ) => {
    languageDraftsRef.current = {};
    setAddressTranslationStatus('idle');
    translationFeedbackRef.current = null;
    setTranslationFeedbackStatus('idle');
    setPostcodeAssistanceCandidate(candidate);
    setPostcodeAutofillCandidates([]);
    setPostcodeLookupStatus('filled');
    setFormData(prev => {
      const next = mergeRegistrationAssistancePatch(prev, candidate.patch, { overwrite: true });
      rememberAssistedDraft(next, candidate.id);
      return next;
    });
  }, [rememberAssistedDraft]);

  const applyBuildingNameCandidate = React.useCallback((candidate: BuildingNameCandidate) => {
    languageDraftsRef.current = {};
    setAddressTranslationStatus('idle');
    translationFeedbackRef.current = null;
    setTranslationFeedbackStatus('idle');
    const buildingName = activeTab === 'en' && candidate.nameEn ? candidate.nameEn : candidate.name;
    setFormData(prev => {
      const next = {
        ...prev,
        organization: buildingName,
        building: buildingName,
      };
      rememberAssistedDraft(next, `building-name:${candidate.source}:${candidate.osmType || 'feature'}:${candidate.osmId || buildingName}`);
      return next;
    });
  }, [activeTab, rememberAssistedDraft]);

  const handleAddressDocumentFile = React.useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    setDocumentReadStatus('reading');
    setDocumentReadResult(null);
    setDocumentReadError('');

    try {
      const isTextLike = file.type.startsWith('text/')
        || /\.(txt|csv|json|md|text)$/i.test(file.name);
      const isPdfLike = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      const text = isTextLike
        ? await file.text()
        : isPdfLike
          ? extractPrintableTextFromBinary(await file.arrayBuffer())
          : '';

      const result = readAddressDocument({
        fileName: file.name,
        mimeType: file.type,
        text,
        countryHint: formData.country,
        supportedCountryCodes,
      });
      const candidate = addressDocumentResultToAssistanceCandidate<typeof formData>(result);

      setDocumentReadResult(result);
      setDocumentReadStatus(
        result.status === 'ready'
          ? 'ready'
          : result.status === 'needs-review'
            ? 'review'
            : result.status === 'needs-ocr-engine'
              ? 'needs-ocr'
              : 'error',
      );

      if (candidate) {
        applyDocumentReadCandidate(candidate, false);
      }
    } catch (error) {
      setDocumentReadStatus('error');
      setDocumentReadError(error instanceof Error ? error.message : 'Document reading failed');
    }
  }, [applyDocumentReadCandidate, formData.country, supportedCountryCodes]);

  const handleFieldChange = React.useCallback((fieldKey: string, value: string) => {
    const canKeepTranslationFeedback = translationFeedbackRef.current?.targetLanguage === activeTab
      && !['recipient', 'phone'].includes(fieldKey);
    languageDraftsRef.current = {};
    setAddressTranslationStatus('idle');
    setTranslationFeedbackStatus(canKeepTranslationFeedback ? 'ready' : 'idle');
    setFormData(prev => ({ ...prev, [fieldKey]: value }));
  }, [activeTab]);

  const buildCurrentTranslationFeedbackSample = React.useCallback((feedback: AddressTranslationFeedback) => {
    const context = translationFeedbackRef.current;
    if (!context || context.targetLanguage !== activeTab) return null;
    return buildAddressTranslationFeedbackSample({
      source: context.sourceDraft,
      translated: context.translatedDraft,
      corrected: formData,
      feedback,
      countryCode: formData.country,
      sourceLanguage: context.sourceLanguage,
      targetLanguage: context.targetLanguage,
      agid: agidInput || initialAgid,
    });
  }, [activeTab, agidInput, formData, initialAgid]);

  const persistTranslationFeedback = React.useCallback((feedback: AddressTranslationFeedback) => {
    if (!feedbackConsent) {
      setTranslationFeedbackStatus('idle');
      return null;
    }
    const context = translationFeedbackRef.current;
    const sample = buildCurrentTranslationFeedbackSample(feedback);
    if (!context || !sample) {
      setTranslationFeedbackStatus('error');
      return null;
    }
    appendAddressTranslationFeedbackSample(sample);
    translationFeedbackRef.current = { ...context, sampleId: sample.id };
    setTranslationFeedbackStatus('saved');
    return sample.id;
  }, [buildCurrentTranslationFeedbackSample, feedbackConsent]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAoidMode && !formData.phone) {
      setError(t('phoneRequired'));
      return;
    }

    const correctionSample = feedbackConsent && assistedDraftRef.current
      ? buildRegistrationCorrectionSample({
          before: assistedDraftRef.current,
          after: formData,
          assistanceSourceIds: appliedAssistanceIdsRef.current,
          agid: agidInput || initialAgid,
          addressLanguage: activeTab,
        })
      : null;
    if (correctionSample) {
      appendRegistrationCorrectionSample(correctionSample);
      setCorrectionHistory(listRegistrationCorrectionSamples(undefined, 4));
    }
    const translationFeedbackSample = feedbackConsent && translationFeedbackStatus !== 'saved'
      ? buildCurrentTranslationFeedbackSample('corrected')
      : null;
    if (translationFeedbackSample) appendAddressTranslationFeedbackSample(translationFeedbackSample);

    onRegister(buildRegisteredAddressRecord({
      ...formData,
      registrationAssistance: {
        sourceIds: appliedAssistanceIdsRef.current,
        correctionSampleId: correctionSample?.id,
        translationFeedbackSampleId: translationFeedbackRef.current?.sampleId || translationFeedbackSample?.id,
        learningMode: 'closed-device-local',
        feedbackConsent: {
          localLearning: feedbackConsent,
          storageScope: 'closed-device-local-rl-reference',
          externalTransmission: 'blocked',
        },
      },
      registrationReadiness: registrationReadiness.publicMetadata,
    }, {
      mode: isAoidMode ? 'AOID' : 'ADDRESS',
      id: isAoidMode ? generateAOID(agidInput || initialAgid) : undefined,
      agid: agidInput || initialAgid,
      coords: currentCoords,
      quality: registrationQualitySnapshot,
    }));
    setSuccess(true);
    setTimeout(onClose, 1500);
  };

  const renderedAddress = useMemo(
    () => renderRegistrationAddressPreview(formData, activeTab, localFormat),
    [formData, activeTab, localFormat],
  );

  const currentCountry = React.useMemo(() => {
    return COUNTRIES.find(c => c.code === formData.country);
  }, [formData.country]);

  const countryGroups = useMemo(() => groupRegistrationCountriesByTab(COUNTRIES), []);
  const postcodeInputConfig = useMemo(() => getPostcodeInputConfig(localFormat), [localFormat]);
  const addressCoveragePolicy = useMemo(
    () => classifyAddressCoveragePolicy(localFormat),
    [localFormat],
  );
  const postcodeAutofillMode = useMemo<PostcodeAutofillMode>(
    () => getPostcodeAutofillModeForCoverage(addressCoveragePolicy),
    [addressCoveragePolicy],
  );
  const documentReadCandidate = useMemo(
    () => documentReadResult ? addressDocumentResultToAssistanceCandidate<typeof formData>(documentReadResult) : null,
    [documentReadResult],
  );
  const addressElementSession = useMemo(() => buildAddressElementSession({
    purpose: isAoidMode ? 'identity' : 'delivery',
    mode: 'local',
    countryCode: formData.country,
    selectedLanguage: activeTab,
    fields: {
      countryCode: formData.country,
      postcode: formData.postcode,
      state: formData.state,
      city: formData.city,
      district: formData.suburb,
      street: formData.street,
      building: formData.organization,
      recipient: formData.recipient,
      phone: formData.phone,
    },
    fieldPresence: {
      countryCode: Boolean(formData.country),
      postcode: Boolean(formData.postcode),
      state: Boolean(formData.state),
      city: Boolean(formData.city),
      district: Boolean(formData.suburb),
      street: Boolean(formData.street),
      building: Boolean(formData.organization),
      recipient: Boolean(formData.recipient),
      phone: Boolean(formData.phone),
      agid: Boolean(agidInput || initialAgid || agidAssistanceCandidate),
    },
    format: localFormat,
    languageTabs: addressLanguageTabs.map(tab => ({
      language: tab.code,
      label: tab.label,
      source: tab.kind === 'international' ? 'english-shipping' : 'native',
    })),
    postalCandidates: postcodeLookupStatus === 'filled'
      ? [{
          source: 'registration-postcode-autofill',
          countryCode: formData.country,
          postalCode: formData.postcode,
          state: formData.state,
          city: formData.city,
          district: formData.suburb,
          confidence: 0.84,
        }]
      : [],
    agidCandidate: agidInput || initialAgid || agidAssistanceCandidate
      ? {
          present: true,
          exposure: 'commitment',
          safeFingerprint: agidAssistanceCandidate?.id
            ? `registration-agid:${agidAssistanceCandidate.id}`
            : 'registration-agid:present',
          confidence: agidAssistanceCandidate?.confidence ?? 0.72,
          source: agidAssistanceCandidate?.id ? 'registration-agid-assistance' : 'registration-initial-agid',
        }
      : undefined,
  }), [
    activeTab,
    addressLanguageTabs,
    agidAssistanceCandidate,
    agidInput,
    formData,
    initialAgid,
    isAoidMode,
    localFormat,
    postcodeLookupStatus,
  ]);
  const isAgidPrimaryIdentifier = addressElementSession.primaryIdentifier.kind === 'agid'
    || addressCoveragePolicy.id === 'no-postal-strong-geo'
    || addressCoveragePolicy.id === 'no-postal-weak-geo';
  const postalCoverageDisplay = useMemo(() => {
    if (addressCoveragePolicy.id === 'postal-reliable-api') {
      return {
        badge: t('postalCoverageAutoBadge'),
        title: t('postalCoverageReliableTitle'),
        description: t('postalCoverageReliableDesc'),
        tone: 'emerald',
      };
    }
    if (addressCoveragePolicy.id === 'postal-weak-api') {
      return {
        badge: t('postalCoverageCandidatesBadge'),
        title: t('postalCoverageWeakTitle'),
        description: t('postalCoverageWeakDesc'),
        tone: 'amber',
      };
    }
    if (addressCoveragePolicy.id === 'no-postal-strong-geo') {
      return {
        badge: t('postalCoverageAgidBadge'),
        title: t('postalCoverageStrongGeoTitle'),
        description: t('postalCoverageStrongGeoDesc'),
        tone: 'blue',
      };
    }
    return {
      badge: t('postalCoverageAgidBadge'),
      title: t('postalCoverageManualTitle'),
      description: t('postalCoverageManualDesc'),
      tone: 'orange',
    };
  }, [addressCoveragePolicy.id, registrationUiLanguage]);
  const registrationReadiness = useMemo(() => assessAddressRegistrationReadiness({
    session: addressElementSession,
    renderedPreview: renderedAddress,
    addressLanguageTabs,
    selectedAddressLanguage: activeTab,
    hasPostalAutofill: postcodeLookupStatus === 'filled',
    hasAgidAutofill: Boolean(agidAssistanceCandidate || agidInput || initialAgid),
    hasDocumentCandidate: Boolean(documentReadCandidate),
    hasClosedCorrectionFeedback: feedbackConsent && Boolean(assistedDraftRef.current || appliedAssistanceIdsRef.current.length),
    hasTranslationFeedback: feedbackConsent && Boolean(translationFeedbackRef.current || translationFeedbackStatus === 'saved'),
    hasAoidMode: isAoidMode,
  }), [
    activeTab,
    addressElementSession,
    addressLanguageTabs,
    agidAssistanceCandidate,
    agidInput,
    documentReadCandidate,
    initialAgid,
    isAoidMode,
    feedbackConsent,
    postcodeLookupStatus,
    renderedAddress,
    translationFeedbackStatus,
  ]);

  const registrationQualityReasons = useMemo(() => Array.from(new Set([
    `quality-decision:${addressElementSession.quality.decision}`,
    ...addressElementSession.missingRequiredFields.map(field => `missing-required:${field}`),
    ...addressElementSession.warnings.slice(0, 4).map(warning => `warning:${warning}`),
    ...registrationReadiness.checks
      .filter(check => check.status !== 'pass')
      .slice(0, 4)
      .map(check => `${check.status}:${check.id}`),
  ])), [
    addressElementSession.missingRequiredFields,
    addressElementSession.quality.decision,
    addressElementSession.warnings,
    registrationReadiness.checks,
  ]);

  const registrationQualitySnapshot = useMemo(() => buildRegisteredAddressQualitySnapshot({
    addressElement: addressElementSession,
    readiness: registrationReadiness,
    reasonCodes: registrationQualityReasons,
    hasPostalAutofill: postcodeLookupStatus === 'filled',
    hasAgidAssistance: Boolean(agidAssistanceCandidate || agidInput || initialAgid),
    hasDocumentAssistance: Boolean(documentReadCandidate),
    hasTranslationFeedback: feedbackConsent && Boolean(translationFeedbackRef.current || translationFeedbackStatus === 'saved'),
  }), [
    addressElementSession,
    agidAssistanceCandidate,
    agidInput,
    documentReadCandidate,
    feedbackConsent,
    initialAgid,
    postcodeLookupStatus,
    registrationQualityReasons,
    registrationReadiness,
    translationFeedbackStatus,
  ]);

  const registrationQualityDecision = useMemo(
    () => registeredQualitySnapshotToDecision(registrationQualitySnapshot),
    [registrationQualitySnapshot],
  );

  const assistanceComparison = useMemo(() => buildRegistrationAssistanceComparison({
    postcodeCandidate: postcodeAssistanceCandidate,
    agidCandidate: agidAssistanceCandidate,
    appliedSourceIds: appliedAssistanceIdsRef.current,
    feedbackConsent,
    qualityDecision: addressElementSession.quality.decision,
    qualityReasons: registrationQualityReasons,
  }), [
    addressElementSession.quality.decision,
    agidAssistanceCandidate,
    feedbackConsent,
    postcodeAssistanceCandidate,
    registrationQualityReasons,
  ]);

  const addressCompatibilityReport = useMemo(() => {
    const nativeTab = addressLanguageTabs.find(tab => tab.kind !== 'international')?.code || 'local';
    const nativeDraft = languageDraftsRef.current.local
      || languageDraftsRef.current[nativeTab]
      || translationFeedbackRef.current?.sourceDraft
      || assistedDraftRef.current
      || formData;
    const formatFieldKeys = new Set<string>([
      ...(localFormat?.fields || []).map(field => field.key),
      ...(localFormat?.native?.fields || []).map(field => field.key),
      ...(localFormat?.english?.fields || []).map(field => field.key),
      ...Object.values(localFormat?.domestic || {}).flatMap(format => format.fields.map(field => field.key)),
      ...Object.values(localFormat?.international || {}).flatMap(format => format.fields.map(field => field.key)),
    ]);
    const sharedFields = ADDRESS_COMPATIBILITY_FIELDS.filter(field => (
      formatFieldKeys.has(field)
      || fieldValueFilled(nativeDraft, field)
      || fieldValueFilled(formData, field)
    ));
    const expectedFields = sharedFields.filter(field => (
      fieldValueFilled(nativeDraft, field)
      || fieldValueFilled(formData, field)
      || field === 'country'
    ));
    const compatibleFields = expectedFields.filter(field => {
      const nativeValue = normalizeCompatibilityValue(nativeDraft[field]);
      const currentValue = normalizeCompatibilityValue(formData[field]);
      if (!nativeValue && !currentValue) return false;
      if (STRICT_COMPATIBILITY_FIELDS.has(field)) return nativeValue === currentValue;
      return Boolean(nativeValue && currentValue);
    });
    const missingFields = expectedFields.filter(field => (
      fieldValueFilled(nativeDraft, field) && !fieldValueFilled(formData, field)
    ));
    const score = expectedFields.length ? compatibleFields.length / expectedFields.length : 1;
    return {
      score,
      label: score >= 0.84
        ? t('compatibilityCompatible')
        : score >= 0.6
          ? t('compatibilityNeedsReview')
          : t('compatibilityWeak'),
      status: score >= 0.84 ? 'ready' : score >= 0.6 ? 'needs_review' : 'blocked',
      sharedFieldCount: expectedFields.length,
      compatibleFieldCount: compatibleFields.length,
      missingFields: missingFields.slice(0, 4),
      nativeTab,
      englishInternationalOrder: activeTab === 'en',
      instantTabSwitch: addressLanguageTabs.length > 1,
      renderedPreviewReady: Boolean(renderedAddress.trim()),
    };
  }, [activeTab, addressLanguageTabs, formData, localFormat, registrationUiLanguage, renderedAddress]);

  const nativeInternationalPreview = useMemo(() => {
    const nativeTab = addressLanguageTabs.find(tab => tab.kind !== 'international')?.code || 'local';
    const nativeDraft = languageDraftsRef.current.local
      || languageDraftsRef.current[nativeTab]
      || translationFeedbackRef.current?.sourceDraft
      || formData;
    const englishDraft = languageDraftsRef.current.en
      || languageDraftsRef.current['en-intl']
      || (activeTab === 'en' ? formData : translationFeedbackRef.current?.translatedDraft)
      || formData;
    const nativeAddress = renderRegistrationAddressPreview(nativeDraft, nativeTab, localFormat);
    const internationalEnglishAddress = renderRegistrationAddressPreview(englishDraft, 'en', localFormat);

    return {
      nativeTab,
      nativeAddress: compactRenderedAddress(nativeAddress),
      internationalEnglishAddress: compactRenderedAddress(internationalEnglishAddress),
    };
  }, [activeTab, addressLanguageTabs, formData, localFormat]);

  const sourceAgreementMatrix = useMemo(() => {
    const postalEvidence = postcodeAssistanceCandidate?.evidence || [];
    const postalScore = postcodeLookupStatus === 'filled'
      ? 0.9
      : postcodeLookupStatus === 'candidates'
        ? 0.64
        : formData.postcode
          ? 0.46
          : 0;
    const adminFieldCount = ['state', 'city', 'suburb'].filter(field => fieldValueFilled(formData, field)).length;
    const openSourceCount = new Set([
      ...(localFormat?.openSourceIds || []),
      ...(localFormat?.addressRules?.openSourceIds || []),
    ]).size;
    const adminScore = Math.min(0.92, (adminFieldCount / 3) * 0.72 + (openSourceCount > 0 ? 0.14 : 0));
    const selectedBuilding = normalizeCompatibilityValue(formData.organization || formData.building);
    const buildingMatchesCandidate = Boolean(selectedBuilding) && buildingNameCandidates.some(candidate => (
      normalizeCompatibilityValue(candidate.name) === selectedBuilding
      || normalizeCompatibilityValue(candidate.nameEn) === selectedBuilding
    ));
    const osmScore = buildingMatchesCandidate
      ? 0.88
      : buildingNameCandidates.length > 0
        ? Math.min(0.82, 0.52 + buildingNameCandidates.length * 0.06)
        : buildingNameStatus === 'ready'
          ? 0.4
          : 0;
    const checks = [
      {
        id: 'osm-overture',
        label: 'OSM / Overture',
        score: osmScore,
        status: osmScore >= 0.7 ? 'matched' : osmScore > 0 ? 'candidate' : 'missing',
        evidence: buildingNameCandidates.slice(0, 2).map(candidate => candidate.nameEn || candidate.name),
      },
      {
        id: 'postal-code',
        label: t('sourcePostalCode'),
        score: postalScore,
        status: postalScore >= 0.8 ? 'matched' : postalScore > 0 ? 'candidate' : 'missing',
        evidence: postalEvidence.slice(0, 2),
      },
      {
        id: 'administrative-data',
        label: t('sourceAdministrativeData'),
        score: adminScore,
        status: adminScore >= 0.7 ? 'matched' : adminScore > 0 ? 'candidate' : 'missing',
        evidence: [
          formData.state,
          formData.city,
          formData.suburb,
          ...(localFormat?.openSourceIds || []).slice(0, 2),
        ].filter(Boolean) as string[],
      },
    ];
    const activeChecks = checks.filter(check => check.score > 0);
    const overallScore = activeChecks.length
      ? activeChecks.reduce((sum, check) => sum + check.score, 0) / activeChecks.length
      : 0;
    return {
      checks,
      overallScore,
      activeSourceCount: activeChecks.length,
      sourceIds: Array.from(new Set([
        ...(localFormat?.openSourceIds || []),
        ...(localFormat?.addressRules?.openSourceIds || []),
        ...(buildingNameCandidates.length ? ['osm-overpass', 'overture-maps'] : []),
        ...(postcodeLookupStatus !== 'idle' ? ['postal-code-api'] : []),
      ])).slice(0, 6),
    };
  }, [
    buildingNameCandidates,
    buildingNameStatus,
    formData,
    localFormat,
    postcodeAssistanceCandidate,
    postcodeLookupStatus,
    registrationUiLanguage,
  ]);

  const registrationWorkflowSteps = useMemo(() => [
    {
      id: 'country',
      label: t('countryStepLabel'),
      detail: currentCountry?.name || formData.country || t('selectDestination'),
      icon: Globe,
      status: formData.country ? 'complete' : 'active',
    },
    {
      id: 'address',
      label: t('addressStepLabel'),
      detail: addressElementSession.missingRequiredFields.length === 0
        ? t('requiredFieldsComplete')
        : formatUiString('requiredFieldsLeft', { count: addressElementSession.missingRequiredFields.length }),
      icon: MapPin,
      status: addressElementSession.missingRequiredFields.length === 0 ? 'complete' : 'active',
    },
    {
      id: 'evidence',
      label: t('evidenceStepLabel'),
      detail: registrationReadiness.publicMetadata.intentStatus,
      icon: FileText,
      status: registrationReadiness.status === 'blocked'
        ? 'blocked'
        : registrationReadiness.status === 'ready'
          ? 'complete'
          : 'review',
    },
    {
      id: 'review',
      label: t('reviewStepLabel'),
      detail: registrationReadiness.publicMetadata.privacyBoundary,
      icon: ShieldIcon,
      status: registrationReadiness.status === 'blocked'
        ? 'blocked'
        : registrationReadiness.status === 'needs_review'
          ? 'review'
          : 'complete',
    },
  ], [
    addressElementSession.missingRequiredFields.length,
    currentCountry?.name,
    formData.country,
    registrationUiLanguage,
    registrationReadiness.publicMetadata.intentStatus,
    registrationReadiness.publicMetadata.privacyBoundary,
    registrationReadiness.status,
  ]);

  useEffect(() => {
    if (!isOpen || !isPostcodeReadyForAutofill(localFormat, formData.postcode)) {
      if (!formData.postcode) setPostcodeLookupStatus('idle');
      setPostcodeAssistanceCandidate(null);
      setPostcodeAutofillCandidates([]);
      return;
    }

    const lookupKey = `${formData.country}:${formData.postcode.trim().toUpperCase()}`;
    if (lookupKey === lastPostcodeLookupRef.current) return;

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      lastPostcodeLookupRef.current = lookupKey;
      setPostcodeLookupStatus('loading');

      try {
        const patches = await lookupPostcodeAutofillCandidates(formData.country, formData.postcode);
        if (cancelled) return;

        if (patches.length > 0) {
          const candidates = patches
            .slice(0, 5)
            .map((patch, candidateIndex) => buildPostcodeRegistrationAssistanceCandidate<typeof formData>({
              countryCode: formData.country,
              postcode: formData.postcode,
              patch,
              candidateIndex,
              mode: postcodeAutofillMode,
            }))
            .filter((candidate): candidate is RegistrationAssistanceCandidate<typeof formData> => Boolean(candidate));

          const candidate = candidates[0] || null;
          const patch = patches[0];

          if (postcodeAutofillMode === 'candidates') {
            setPostcodeAutofillCandidates(candidates);
            setPostcodeAssistanceCandidate(candidate);
            setPostcodeLookupStatus(candidates.length ? 'candidates' : 'empty');
            return;
          }

          const autofillCandidate = candidate || buildPostcodeRegistrationAssistanceCandidate<typeof formData>({
            countryCode: formData.country,
            postcode: formData.postcode,
            patch,
          });
          const drafts = await buildPostcodeAutofillLanguageDrafts({
            formData,
            patch,
            countryCode: formData.country,
            languageTabs: addressLanguageTabs.map(tab => tab.code),
          });
          if (cancelled) return;

          setFormData(prev => {
            const merged = mergePostcodeAutofill(prev, patch);
            const next = drafts[activeTab] || drafts[normalizeRegistrationAddressLanguage(activeTab)] || merged;
            languageDraftsRef.current = {
              ...languageDraftsRef.current,
              ...drafts,
              [activeTab]: next,
            };
            if (autofillCandidate) rememberAssistedDraft(next, autofillCandidate.id);
            return next;
          });
          setPostcodeAutofillCandidates([]);
          setPostcodeAssistanceCandidate(autofillCandidate);
          setPostcodeLookupStatus('filled');
        } else {
          setPostcodeAssistanceCandidate(null);
          setPostcodeAutofillCandidates([]);
          setPostcodeLookupStatus('empty');
        }
      } catch {
        if (!cancelled) {
          setPostcodeAssistanceCandidate(null);
          setPostcodeAutofillCandidates([]);
          setPostcodeLookupStatus('error');
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [activeTab, addressLanguageTabs, formData, isOpen, localFormat, postcodeAutofillMode, rememberAssistedDraft]);

  const handleAddressLanguageTabClick = React.useCallback(async (tabCode: string) => {
    if (tabCode === activeTab) return;

    const sourceDraft = formData;
    const sourceLanguage = activeTab;
    languageDraftsRef.current[activeTab] = formData;
    const savedDraft = languageDraftsRef.current[tabCode];

    setActiveTab(tabCode);
    if (tabCode === 'local' && savedDraft) {
      setFormData(savedDraft);
      setAddressTranslationStatus('translated');
      translationFeedbackRef.current = null;
      setTranslationFeedbackStatus('idle');
      return;
    }

    setAddressTranslationStatus('translating');
    setTranslationFeedbackStatus('idle');
    try {
      const translated = await translateRegistrationFormFields({
        formData: sourceDraft,
        targetLanguage: tabCode,
        countryCode: sourceDraft.country,
        sourceLanguage,
      });
      languageDraftsRef.current[tabCode] = translated;
      translationFeedbackRef.current = {
        sourceDraft,
        translatedDraft: translated,
        sourceLanguage,
        targetLanguage: tabCode,
      };
      setFormData(translated);
      setAddressTranslationStatus('translated');
      setTranslationFeedbackStatus('ready');
    } catch {
      translationFeedbackRef.current = null;
      setAddressTranslationStatus('error');
      setTranslationFeedbackStatus('idle');
    }
  }, [activeTab, formData]);

  const handlePostcodeChange = React.useCallback((value: string) => {
    lastPostcodeLookupRef.current = '';
    languageDraftsRef.current = {};
    translationFeedbackRef.current = null;
    setPostcodeAssistanceCandidate(null);
    setPostcodeAutofillCandidates([]);
    setPostcodeLookupStatus('idle');
    setAddressTranslationStatus('idle');
    setTranslationFeedbackStatus('idle');
    setFormData(prev => ({ ...prev, postcode: value }));
  }, []);

  useEffect(() => {
    if (viewMode === 'country-select' && currentCountry) {
      setSelectedCountryTab(getRegistrationCountryTabId(currentCountry));
    }
  }, [viewMode, currentCountry]);

  const isBritishTerritoryMode = BRITISH_TERRITORIES.some(t => t.code === formData.country);
  const isFrenchTerritoryMode = FRENCH_TERRITORIES.some(t => t.code === formData.country);
  const isNorwegianTerritoryMode = NORWEGIAN_TERRITORIES.some(t => t.code === formData.country);
  const isSpanishTerritoryMode = SPANISH_TERRITORIES.some(t => t.code === formData.country);
  const isPortugueseTerritoryMode = PORTUGUESE_TERRITORIES.some(t => t.code === formData.country);
  const isSEAterritoryMode = SOUTHEAST_ASIA_TERRITORIES.some(t => t.code === formData.country);
  const isCETerritoryMode = CENTRAL_EUROPE_TERRITORIES.some(t => t.code === formData.country);
  const isBalkanTerritoryMode = BALKAN_TERRITORIES.some(t => t.code === formData.country);
  const isBalticTerritoryMode = BALTIC_TERRITORIES.some(t => t.code === formData.country);
  const isEurasianTerritoryMode = EURASIAN_TERRITORIES.some(t => t.code === formData.country);
  const isNordicTerritoryMode = NORDIC_TERRITORIES.some(t => t.code === formData.country);
  const isCSAsianTerritoryMode = CENTRAL_SOUTH_ASIA_TERRITORIES.some(t => t.code === formData.country);
  const isDutchTerritoryMode = DUTCH_TERRITORIES.some(t => t.code === formData.country);
  const isDanishTerritoryMode = DANISH_TERRITORIES.some(t => t.code === formData.country);
  const isAustralianTerritoryMode = AUSTRALIAN_TERRITORIES.some(t => t.code === formData.country);
  const isNewZealandTerritoryMode = NEW_ZEALAND_TERRITORIES.some(t => t.code === formData.country);
  const isUSTerritoryMode = US_TERRITORIES.some(t => t.code === formData.country);
  const isArabicTerritoryMode = ARABIC_TERRITORIES.some(t => t.code === formData.country);
  const isItalianTerritoryMode = ITALIAN_TERRITORIES.some(t => t.code === formData.country);
  const isChileTerritoryMode = CHILE_TERRITORIES.some(t => t.code === formData.country);
  const isMicrostateMode = MICROSTATES_TERRITORIES.some(t => t.code === formData.country);
  const isAnglosphereMode = ANGLOSPHERE_TERRITORIES.some(t => t.code === formData.country);
  const isCanadianTerritoryMode = CANADIAN_TERRITORIES.some(t => t.code === formData.country);
  const isNZTerritoryMode = NEW_ZEALAND_TERRITORIES.some(t => t.code === formData.country);
  const isGermanRegionMode = GERMAN_REGIONS.some(t => t.code === formData.country);
  const isHispanosphereMode = HISPANOSPHERE_TERRITORIES.some(t => t.code === formData.country);
  const isLusosphereMode = LUSOSPHERE_TERRITORIES.some(t => t.code === formData.country);
  const isCaribbeanMode = CARIBBEAN_TERRITORIES.some(t => t.code === formData.country);
  const isOceaniaMode = OCEANIA_TERRITORIES.some(t => t.code === formData.country);
  const isGreaterChinaMode = GREATER_CHINA_TERRITORIES.some(t => t.code === formData.country);
  const isFrancophonieMode = FRANCOPHONIE_TERRITORIES.some(t => t.code === formData.country);

  // Address Smart Fix Logic
  const smartFixes = useMemo(() => {
    const fixes: { label: string, action: () => void, icon: any, type: 'warning' | 'info' }[] = [];

    // 1. Chinese Script Fix
    if (isGreaterChinaMode) {
      const allText = Object.values(formData).join('');
      const script = detectChineseScript(allText);
      const isMainland = formData.country === 'CN';

      if (isMainland && (script === 'traditional' || script === 'mixed')) {
        fixes.push({
          label: t('convertToSimplifiedChinese'),
          icon: Wand2,
          type: 'warning',
          action: () => {
            const newFields = { ...formData };
            Object.keys(newFields).forEach(k => {
              const key = k as keyof typeof formData;
              if (typeof newFields[key] === 'string' && key !== 'country' && key !== 'phone') {
                newFields[key] = toSimplified(newFields[key] as string) as any;
              }
            });
            setFormData(newFields);
          }
        });
      } else if (!isMainland && (script === 'simplified' || script === 'mixed')) {
        fixes.push({
          label: formatUiString('convertToTraditionalChinese', { country: formData.country }),
          icon: Wand2,
          type: 'warning',
          action: () => {
            const newFields = { ...formData };
            Object.keys(newFields).forEach(k => {
              const key = k as keyof typeof formData;
              if (typeof newFields[key] === 'string' && key !== 'country' && key !== 'phone') {
                newFields[key] = toTraditional(newFields[key] as string, formData.country as any) as any;
              }
            });
            setFormData(newFields);
          }
        });
      }
    }

    // 2. Colombia Numbering Fix
    const houseNum = (formData as any).houseNumber || (formData as any).house_number;
    if (formData.country === 'CO' && houseNum && !houseNum.includes('#') && /^\d/.test(houseNum)) {
      fixes.push({
        label: t('addColombiaHousePrefix'),
        icon: Hash,
        type: 'info',
        action: () => {
          const key = (formData as any).houseNumber ? 'houseNumber' : 'house_number';
          setFormData(prev => ({ ...prev, [key]: `# ${houseNum}` }));
        }
      });
    }

    // 3. Unicode Normalization Fix (Fullwidth characters)
    const hasFullwidth = /[Ａ-Ｚａ-ｚ０-９]/.test(Object.values(formData).join(''));
    if (hasFullwidth) {
      fixes.push({
        label: t('normalizeFullwidth'),
        icon: ListFilter,
        type: 'info',
        action: () => {
          const newFields = { ...formData };
          Object.keys(newFields).forEach(k => {
            const key = k as keyof typeof formData;
            if (typeof newFields[key] === 'string') {
              newFields[key] = normalizeAddressText(newFields[key] as string) as any;
            }
          });
          setFormData(newFields);
        }
      });
    }

    return fixes;
  }, [formData, isGreaterChinaMode, registrationUiLanguage]);

  const isAnyRegionMode = useMemo(() => {
    return isBritishTerritoryMode || isFrenchTerritoryMode || isNorwegianTerritoryMode ||
           isSpanishTerritoryMode || isPortugueseTerritoryMode || isSEAterritoryMode ||
           isCETerritoryMode || isBalkanTerritoryMode || isBalticTerritoryMode ||
           isEurasianTerritoryMode || isNordicTerritoryMode || isCSAsianTerritoryMode ||
           isDutchTerritoryMode || isDanishTerritoryMode || isAustralianTerritoryMode ||
           isNewZealandTerritoryMode || isUSTerritoryMode || isArabicTerritoryMode ||
           isItalianTerritoryMode || isChileTerritoryMode || isMicrostateMode ||
           isAnglosphereMode || isCanadianTerritoryMode || isNZTerritoryMode ||
           isGermanRegionMode || isHispanosphereMode || isLusosphereMode ||
           isCaribbeanMode || isOceaniaMode || isGreaterChinaMode || isFrancophonieMode;
  }, [
    isBritishTerritoryMode, isFrenchTerritoryMode, isNorwegianTerritoryMode,
    isSpanishTerritoryMode, isPortugueseTerritoryMode, isSEAterritoryMode,
    isCETerritoryMode, isBalkanTerritoryMode, isBalticTerritoryMode,
    isEurasianTerritoryMode, isNordicTerritoryMode, isCSAsianTerritoryMode,
    isDutchTerritoryMode, isDanishTerritoryMode, isAustralianTerritoryMode,
    isNewZealandTerritoryMode, isUSTerritoryMode, isArabicTerritoryMode,
    isItalianTerritoryMode, isChileTerritoryMode, isMicrostateMode,
    isAnglosphereMode, isCanadianTerritoryMode, isNZTerritoryMode,
    isGermanRegionMode, isHispanosphereMode, isLusosphereMode,
    isCaribbeanMode, isOceaniaMode, isGreaterChinaMode, isFrancophonieMode
  ]);

  return (
    <AnimatePresence>
      {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed inset-0 z-[101] overflow-y-auto bg-slate-50 text-slate-950"
          >
            <div
              className="min-h-screen w-full bg-slate-50 px-3 py-3 sm:px-5"
              style={{
                paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)'
              }}
            >
              <div className="mx-auto w-full max-w-5xl">
                <div className="sticky top-0 z-20 mb-3 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-600 text-white shadow-sm">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-black tracking-tight text-slate-950">
                          {t('addressRegistration')}
                        </h2>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowRegistrationDetails(previous => !previous)}
                        aria-expanded={showRegistrationDetails}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-black text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        <ListFilter className="h-3.5 w-3.5" />
                        {showRegistrationDetails ? t('hideDetails') : t('showDetails')}
                      </button>
                      <span className={cn(
                        "hidden h-9 items-center gap-1.5 rounded-md border px-2.5 text-[9px] font-black uppercase sm:inline-flex",
                        READINESS_STATUS_STYLES[registrationReadiness.status] || READINESS_STATUS_STYLES.needs_review,
                      )}>
                        <ShieldIcon className="h-3.5 w-3.5" />
                        {statusLabel(registrationReadiness.status)}
                      </span>
                      <button
                        onClick={onClose}
                        className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                        aria-label="Close address registration"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

              <AnimatePresence mode="wait">
                {viewMode === 'form' ? (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleRegister}
                    className="mx-auto flex w-full max-w-3xl flex-col gap-3"
                  >
                    <aside className={cn("order-30", !showRegistrationDetails && "hidden")}>
                      <details className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm shadow-slate-200/70">
                        <summary className="cursor-pointer list-none text-sm font-black text-slate-800">
                          {t('registrationStepsSafety')}
                        </summary>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {t('workflowLabel')}
                            </div>
                            <div className="mt-1 text-sm font-black text-slate-900">
                              {t('registrationStepsLabel')}
                            </div>
                          </div>
                          <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">
                            {activeTab.toUpperCase()}
                          </span>
                        </div>
                        <ol className="space-y-2">
                          {registrationWorkflowSteps.map((step, index) => (
                            <li key={step.id} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={cn(
                                  "grid h-9 w-9 place-items-center rounded-xl border text-sm",
                                  step.status === 'complete'
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : step.status === 'blocked'
                                      ? "border-rose-200 bg-rose-50 text-rose-700"
                                      : step.status === 'review'
                                        ? "border-amber-200 bg-amber-50 text-amber-700"
                                        : "border-blue-200 bg-blue-50 text-blue-700",
                                )}>
                                  <step.icon className="h-4 w-4" />
                                </div>
                                {index < registrationWorkflowSteps.length - 1 && (
                                  <div className="my-1 h-7 w-px bg-slate-200" />
                                )}
                              </div>
                              <div className="min-w-0 pb-3">
                                <div className="text-xs font-black text-slate-800">
                                  {step.label}
                                </div>
                                <div className="mt-1 line-clamp-2 text-[10px] font-bold leading-4 text-slate-500">
                                  {step.detail}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ol>
                        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-700">
                            <ShieldIcon className="h-3.5 w-3.5" />
                            {t('noRawExport')}
                          </div>
                          <p className="mt-2 text-[11px] font-bold leading-5 text-blue-900/70">
                            {t('noRawExportDesc')}
                          </p>
                        </div>
                      </details>
                    </aside>

                    <div className="order-1 flex min-w-0 flex-col gap-2" data-address-registration-form-first>
                {/* AOID Mode Toggle */}
                <div className="order-1 space-y-1.5 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700 font-black text-[10px] uppercase tracking-widest">
                      <ShieldIcon className="w-3 h-3" />
                      {t('identifierMode')}
                    </div>
                    <div
                      className="grid grid-cols-2 border border-slate-200 bg-slate-100 p-1"
                      role="group"
                      aria-label={t('identifierMode')}
                    >
                      <button
                        type="button"
                        aria-pressed={!isAoidMode}
                        onClick={() => setIsAoidMode(false)}
                        className={cn(
                          "h-8 min-w-[68px] px-3 text-xs font-black transition-colors",
                          !isAoidMode ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                        )}
                      >
                        AGID
                      </button>
                      <button
                        type="button"
                        aria-pressed={isAoidMode}
                        onClick={() => setIsAoidMode(true)}
                        className={cn(
                          "h-8 min-w-[68px] px-3 text-xs font-black transition-colors",
                          isAoidMode ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                        )}
                      >
                        AOID
                      </button>
                    </div>
                  </div>
                  <p className={cn(
                    "text-[10px] font-bold leading-relaxed",
                    isAoidMode ? "text-emerald-700" : "text-blue-700",
                    !showRegistrationDetails && "hidden"
                  )}>
                    {isAoidMode ? t('aoidTip') : t('agidSaveTip')}
                  </p>
                </div>

                {(initialQrRecord || initialHotelCheckInSession) && (
                  <div id="qr-address-intake" className="order-2 rounded-lg border border-blue-100 bg-blue-50/80 p-3 shadow-sm shadow-blue-100/60">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
                          <QrCode className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                            {t('qrIntakeLabel')}
                          </div>
                          <h4 className="mt-1 text-sm font-black text-slate-800">
                            {t('qrIntakeTitle')}
                          </h4>
                          <p className="mt-1 text-[11px] font-bold leading-5 text-blue-900/70">
                            {t('qrIntakeDesc')}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center justify-center gap-1 rounded-full bg-white px-3 py-1 text-[10px] font-black text-blue-700">
                        <ShieldIcon className="h-3 w-3" />
                        {t('localReview')}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {initialQrRecord && (
                        <div className="rounded-xl border border-blue-100 bg-white/85 px-3 py-3">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t('addressQrFilled')}
                          </div>
                          <div className="mt-1 truncate text-xs font-black text-slate-800">
                            {initialQrRecord.country || 'AGID'} / {initialQrRecord.id}
                          </div>
                          <div className="mt-1 text-[10px] font-bold leading-4 text-slate-500">
                            {t('addressQrReviewDesc')}
                          </div>
                        </div>
                      )}

                      {initialHotelCheckInSession && (
                        <div className="rounded-xl border border-emerald-100 bg-white/85 px-3 py-3">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                            <Building2 className="h-3.5 w-3.5" />
                            {t('hotelCheckIn')}
                          </div>
                          <div className="mt-1 truncate text-xs font-black text-slate-800">
                            {initialHotelCheckInSession.hotel.propertyName || initialHotelCheckInSession.hotel.hotelAlias}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-700">
                              {initialHotelCheckInSession.status.replace(/_/g, ' ')}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase text-slate-600">
                              {initialHotelCheckInSession.nextAction.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div id="postal-coverage-policy" className="order-3 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                        postalCoverageDisplay.tone === 'emerald' && "bg-emerald-50 text-emerald-700",
                        postalCoverageDisplay.tone === 'amber' && "bg-amber-50 text-amber-700",
                        postalCoverageDisplay.tone === 'blue' && "bg-blue-50 text-blue-700",
                        postalCoverageDisplay.tone === 'orange' && "bg-orange-50 text-orange-700",
                      )}>
                        {isAgidPrimaryIdentifier ? (
                          <AgidIcon className="h-4 w-4" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {t('postalCoveragePolicyLabel')}
                        </div>
                        <h4 className="truncate text-xs font-black text-slate-900">
                          {postalCoverageDisplay.title}
                        </h4>
                        <p className={cn(
                          "mt-1 max-w-2xl text-[11px] font-bold leading-5 text-slate-500",
                          !showRegistrationDetails && "hidden",
                        )}>
                          {postalCoverageDisplay.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-black uppercase",
                        postalCoverageDisplay.tone === 'emerald' && "bg-emerald-100 text-emerald-700",
                        postalCoverageDisplay.tone === 'amber' && "bg-amber-100 text-amber-700",
                        postalCoverageDisplay.tone === 'blue' && "bg-blue-100 text-blue-700",
                        postalCoverageDisplay.tone === 'orange' && "bg-orange-100 text-orange-700",
                      )}>
                        {postalCoverageDisplay.badge}
                      </span>
                      <span className={cn(
                        "rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase text-slate-600",
                        !showRegistrationDetails && "hidden",
                      )}>
                        {addressCoveragePolicy.label}
                      </span>
                      <span className={cn(
                        "rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase text-slate-600",
                        !showRegistrationDetails && "hidden",
                      )}>
                        {addressCoveragePolicy.validationMode}
                      </span>
                    </div>
                  </div>
                </div>

                    <div className="order-10 flex flex-col gap-2">
                      {/* Address Rendering Preview (Carrier Label Style) */}
                      <div className={cn(
                        "order-20 overflow-hidden rounded-lg bg-slate-900 p-4 text-white shadow-inner relative group",
                        !showRegistrationDetails && "hidden",
                      )}>
                        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <QrCode className="w-12 h-12" />
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className={cn(
                            "w-2 h-2 rounded-full animate-pulse",
                            renderedAddress ? "bg-emerald-500" : "bg-slate-500"
                          )} />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            {activeTab === 'en' ? t('internationalShippingLabel') : t('domesticDeliveryFormat')}
                          </span>
                        </div>
                        <div className="relative">
                          <pre className="text-sm font-mono whitespace-pre-wrap break-words leading-relaxed min-h-[4em] selection:bg-emerald-500/30">
                            {renderedAddress || t('waitingForInput')}
                          </pre>
                        </div>

                        {/* Regional Logic Tag */}
                        {['CN', 'TW', 'HK', 'MO'].includes(formData.country) && (
                          <div className="mt-4 flex items-center gap-2">
                             <div className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 uppercase tracking-tight">
                               {t('modularChineseEngineActive')}
                             </div>
                             {formData.country === 'CN' && activeTab !== 'en' && (
                               <div className="text-[9px] font-black bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 uppercase tracking-tight">
                                 {t('simplifiedCanonical')}
                               </div>
                             )}
                             {['TW', 'HK', 'MO'].includes(formData.country) && !activeTab.startsWith('en') && (
                               <div className="text-[9px] font-black bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 uppercase tracking-tight">
                                 {t('traditionalCanonical')}
                               </div>
                             )}
                          </div>
                        )}
                      </div>

                      <div id="native-international-compat-preview" className={cn(
                        "order-21 rounded-lg border border-slate-200 bg-white p-4 shadow-sm",
                        !showRegistrationDetails && "hidden",
                      )}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {t('nativeInternationalCompatibility')}
                            </div>
                            <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">
                              {t('nativeInternationalCompatibilityDesc')}
                            </p>
                          </div>
                          <span className={cn(
                            "w-fit rounded-full border px-3 py-1 text-[9px] font-black uppercase",
                            READINESS_STATUS_STYLES[addressCompatibilityReport.status as keyof typeof READINESS_STATUS_STYLES],
                          )}>
                            {addressCompatibilityReport.label} / {formatPercent(addressCompatibilityReport.score)}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-3 lg:grid-cols-2">
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                              {t('nativeAddressLabel')} ({nativeInternationalPreview.nativeTab})
                            </div>
                            <p className="mt-2 min-h-10 text-xs font-bold leading-5 text-slate-800">
                              {nativeInternationalPreview.nativeAddress || t('waitingForNativeAddress')}
                            </p>
                          </div>
                          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                            <div className="text-[9px] font-black uppercase tracking-widest text-blue-500">
                              {t('internationalShippingEnglish')}
                            </div>
                            <p className="mt-2 min-h-10 text-xs font-bold leading-5 text-blue-950">
                              {nativeInternationalPreview.internationalEnglishAddress || t('waitingForEnglishShipping')}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase text-slate-600">
                            {formatUiString('compatibleFieldsCount', {
                              compatible: addressCompatibilityReport.compatibleFieldCount,
                              total: addressCompatibilityReport.sharedFieldCount,
                            })}
                          </span>
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[9px] font-black uppercase text-blue-700">
                            {t('englishInternationalOrder')}
                          </span>
                          {addressCompatibilityReport.missingFields.length > 0 && (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[9px] font-black uppercase text-amber-700">
                              {t('missingFieldsPrefix')} {addressCompatibilityReport.missingFields.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={cn(
                        "order-22 grid gap-3 xl:grid-cols-2",
                        !showRegistrationDetails && "hidden",
                      )}>
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {t('languageCompatibility')}
                              </div>
                              <div className="mt-1 text-[11px] font-bold leading-5 text-slate-500">
                                {t('languageCompatibilityDesc')}
                              </div>
                            </div>
                            <span className={cn(
                              "shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase",
                              READINESS_STATUS_STYLES[addressCompatibilityReport.status as keyof typeof READINESS_STATUS_STYLES],
                            )}>
                              {formatPercent(addressCompatibilityReport.score)}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase text-slate-600">
                              {t('instantTabSwitch')}
                            </span>
                            <span className={cn(
                              "rounded-full px-2.5 py-1 text-[9px] font-black uppercase",
                              addressCompatibilityReport.englishInternationalOrder
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-600",
                            )}>
                              {t('englishInternationalOrder')}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase text-slate-600">
                              {formatUiString('fieldsCount', {
                                compatible: addressCompatibilityReport.compatibleFieldCount,
                                total: addressCompatibilityReport.sharedFieldCount,
                              })}
                            </span>
                          </div>
                          {addressCompatibilityReport.missingFields.length > 0 && (
                            <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[10px] font-bold leading-5 text-amber-800">
                              {t('missingCurrentTabPrefix')} {addressCompatibilityReport.missingFields.join(', ')}
                            </div>
                          )}
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {t('trustedAddressSources')}
                              </div>
                              <div className="mt-1 text-[11px] font-bold leading-5 text-slate-500">
                                {t('trustedAddressSourcesDesc')}
                              </div>
                            </div>
                            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase text-slate-600">
                              {formatPercent(sourceAgreementMatrix.overallScore)}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            {sourceAgreementMatrix.checks.map(check => (
                              <div key={check.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                  {check.label}
                                </div>
                                <div className="mt-1 flex items-center justify-between gap-2">
                                  <span className={cn(
                                    "rounded-full px-2 py-0.5 text-[8px] font-black uppercase",
                                    check.status === 'matched'
                                      ? "bg-emerald-100 text-emerald-700"
                                      : check.status === 'candidate'
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-slate-200 text-slate-500",
                                  )}>
                                    {sourceAgreementStatusLabel(check.status)}
                                  </span>
                                  <span className="text-[10px] font-black text-slate-700">
                                    {formatPercent(check.score)}
                                  </span>
                                </div>
                                {check.evidence.length > 0 && (
                                  <div className="mt-1 truncate text-[9px] font-bold text-slate-400">
                                    {check.evidence.join(' / ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {sourceAgreementMatrix.sourceIds.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {sourceAgreementMatrix.sourceIds.map(sourceId => (
                                <span key={sourceId} className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black text-slate-500">
                                  {sourceId}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                        {/* Smart Fix Notification */}
                        <AnimatePresence>
                          {smartFixes.length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="order-3 mt-2 space-y-2"
                            >
                              {smartFixes.map((fix, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={fix.action}
                                  className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                    fix.type === 'warning'
                                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                  )}
                                >
                                  <fix.icon className="w-4 h-4 shrink-0" />
                                  <span className="text-[11px] font-black tracking-tight">{fix.label}</span>
                                  <div className="ml-auto bg-white/10 px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-black">
                                    {t('applyFix')}
                                  </div>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                      {(agidAssistanceCandidate || postcodeLookupStatus !== 'idle' || assistanceComparison.candidates.length > 0) && (
                        <div className={cn(
                          "order-30 space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm",
                          !showRegistrationDetails && "hidden",
                        )}>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {t('inputAssistance')}
                              </div>
                              <div className="text-[11px] font-bold text-slate-500 mt-1">
                                {t('inputAssistanceDesc')}
                              </div>
                            </div>
                            <div className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-full uppercase">
                              {t('reviewable')}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                  {t('autofillComparison')}
                                </div>
                                <div className="mt-1 text-[11px] font-bold text-slate-600">
                                  {t('recommendedPrefix')} {assistanceComparison.recommendedSource === 'none' ? t('manualReview') : assistanceComparison.recommendedSource}
                                </div>
                              </div>
                              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-600">
                                <ListFilter className="h-3 w-3" />
                                {formatUiString(
                                  assistanceComparison.candidates.length === 1 ? 'oneSource' : 'sourcesCount',
                                  { count: assistanceComparison.candidates.length },
                                )}
                              </span>
                            </div>
                            <p className="mt-2 text-[10px] font-bold leading-5 text-slate-500">
                              {assistanceComparison.recommendationReason}
                            </p>
                            {assistanceComparison.candidates.length > 0 && (
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {assistanceComparison.candidates.map(candidate => (
                                  <div key={candidate.id} className="rounded-xl border border-white bg-white px-3 py-3 shadow-sm">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          {candidate.source === 'agid' ? (
                                            <AgidIcon className="h-3.5 w-3.5 text-emerald-600" />
                                          ) : (
                                            <Mail className="h-3.5 w-3.5 text-blue-600" />
                                          )}
                                          <span className="truncate text-[11px] font-black text-slate-800">
                                            {candidate.label}
                                          </span>
                                        </div>
                                        <div className="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                          {formatUiString('sourceLabel', { source: candidate.source })}
                                        </div>
                                      </div>
                                      <span className={cn(
                                        "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase",
                                        candidate.applied ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
                                      )}>
                                        {candidate.applied ? t('applied') : t('review')}
                                      </span>
                                    </div>
                                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                                      <div className="rounded-lg bg-slate-50 px-2 py-2">
                                        <div className="text-[9px] font-black text-slate-400 uppercase">{t('trust')}</div>
                                        <div className="mt-0.5 text-[11px] font-black text-slate-700">
                                          {formatPublicConfidenceBand(candidate.confidence, appLanguage)}
                                        </div>
                                      </div>
                                      <div className="rounded-lg bg-slate-50 px-2 py-2">
                                        <div className="text-[9px] font-black text-slate-400 uppercase">{t('fields')}</div>
                                        <div className="mt-0.5 text-[11px] font-black text-slate-700">
                                          {candidate.fieldCount}
                                        </div>
                                      </div>
                                      <div className="rounded-lg bg-slate-50 px-2 py-2">
                                        <div className="text-[9px] font-black text-slate-400 uppercase">{t('proof')}</div>
                                        <div className="mt-0.5 text-[11px] font-black text-slate-700">
                                          {candidate.evidenceCount}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {agidAssistanceCandidate && (
                            <button
                              type="button"
                              onClick={() => applyRegistrationAssistance(agidAssistanceCandidate)}
                              className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left transition-colors hover:bg-emerald-100"
                            >
                              <div className="flex items-center gap-3">
                                <AgidIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-black text-emerald-800">
                                      {t('applyAgidHint')}
                                    </span>
                                    <span className="text-[9px] font-black text-emerald-700 bg-white/70 px-2 py-0.5 rounded-full uppercase">
                                      {formatUiString('trustWithValue', {
                                        value: formatPublicConfidenceBand(agidAssistanceCandidate.confidence, appLanguage),
                                      })}
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-bold text-emerald-700/80 mt-1 truncate">
                                    {agidAssistanceCandidate.evidence.join(' / ')}
                                  </div>
                                </div>
                              </div>
                            </button>
                          )}

                          {postcodeLookupStatus !== 'idle' && (
                            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                              <div className="flex items-center gap-2 text-[11px] font-black text-slate-600">
                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                {t('postcodeAssistance')}
                              </div>
                              <div className="mt-1 text-[10px] font-bold text-slate-500">
                                {postcodeLookupMessage(postcodeLookupStatus)}
                              </div>
                            </div>
                          )}

                          <div className="grid gap-3 lg:grid-cols-2">
                            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                {t('qualityReasons')}
                              </div>
                              <ul className="mt-2 space-y-1">
                                {assistanceComparison.qualityReasons.slice(0, 5).map(reason => (
                                  <li key={reason} className="text-[10px] font-bold leading-5 text-slate-600">
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                  <ShieldIcon className="h-3.5 w-3.5 text-slate-500" />
                                  {t('feedbackConsent')}
                                </div>
                                <label className="inline-flex cursor-pointer items-center gap-2 text-[10px] font-black text-slate-600">
                                  <input
                                    type="checkbox"
                                    checked={feedbackConsent}
                                    onChange={event => setFeedbackConsent(event.currentTarget.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-slate-900"
                                  />
                                  {t('localLearning')}
                                </label>
                              </div>
                              <p className="mt-2 text-[10px] font-bold leading-5 text-slate-500">
                                {t('feedbackConsentDesc')}
                              </p>
                              <div className="mt-2 rounded-lg bg-white px-3 py-2 text-[10px] font-black text-slate-600">
                                {assistanceComparison.feedbackConsent.enabled
                                  ? t('consentEnabled')
                                  : t('consentDisabled')}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                  {t('correctionHistory')}
                                </div>
                                <div className="mt-1 text-[10px] font-bold text-slate-500">
                                  {t('correctionHistoryDesc')}
                                </div>
                              </div>
                              <span className="rounded-full bg-white px-2 py-1 text-[9px] font-black uppercase text-slate-500">
                                {formatUiString('localCount', { count: correctionHistory.length })}
                              </span>
                            </div>
                            {correctionHistory.length > 0 ? (
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {correctionHistory.slice(0, 4).map(sample => (
                                  <div key={sample.id} className="rounded-xl border border-white bg-white px-3 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-black text-slate-700">
                                        {sample.country || t('unknownCountry')}
                                      </span>
                                      <span className="text-[9px] font-black uppercase text-slate-400">
                                        {sample.createdAt.slice(0, 10)}
                                      </span>
                                    </div>
                                    <div className="mt-1 text-[10px] font-bold text-slate-500">
                                      {t('changedFieldsPrefix')} {sample.changedFields.map(field => field.field).join(', ')}
                                    </div>
                                    <div className="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                      {formatUiString('assistanceSourceRefs', { count: sample.assistanceSourceIds.length })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-[10px] font-bold text-slate-500">
                                {t('noCorrectionHistory')}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div id="address-document-reading-ai" className={cn(
                        "order-40 space-y-4 rounded-lg border border-blue-100 bg-blue-50/70 p-4 shadow-sm",
                        !showRegistrationDetails && "hidden",
                      )}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                                {t('documentAi')}
                              </div>
                              <h4 className="mt-1 text-sm font-black text-slate-800">
                                {t('documentAutofill')}
                              </h4>
                              <p className="mt-1 text-[11px] font-bold leading-5 text-blue-900/70">
                                {t('documentAutofillDesc')}
                              </p>
                            </div>
                          </div>
                          <input
                            ref={addressDocumentInputRef}
                            type="file"
                            accept="image/*,application/pdf,text/plain,.txt,.csv"
                            className="hidden"
                            onChange={handleAddressDocumentFile}
                          />
                          <button
                            type="button"
                            onClick={() => addressDocumentInputRef.current?.click()}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-[11px] font-black text-blue-700 shadow-sm transition-colors hover:bg-blue-100"
                          >
                            {documentReadStatus === 'reading' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UploadCloud className="h-4 w-4" />
                            )}
                            {documentReadStatus === 'reading' ? t('readingDocument') : t('uploadDocument')}
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[10px] font-black text-blue-700">
                            <ShieldIcon className="h-3 w-3" />
                            {t('documentPrivacy')}
                          </span>
                          {documentReadResult && (
                            <span className={cn(
                              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black",
                              documentReadStatus === 'ready'
                                ? "bg-emerald-100 text-emerald-700"
                                : documentReadStatus === 'needs-ocr' || documentReadStatus === 'error'
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-white text-slate-600",
                            )}>
                              {documentReadStatus === 'ready' && <CheckCircle2 className="h-3 w-3" />}
                              {(documentReadStatus === 'review' || documentReadStatus === 'needs-ocr' || documentReadStatus === 'error') && <AlertCircle className="h-3 w-3" />}
                              {documentReadStatus === 'ready' && `${t('documentReady')} (${formatPublicConfidenceBand(documentReadResult.confidence, appLanguage)})`}
                              {documentReadStatus === 'review' && t('documentNeedsReview')}
                              {documentReadStatus === 'needs-ocr' && t('documentNeedsOcr')}
                              {documentReadStatus === 'error' && (documentReadError || t('lookupError'))}
                            </span>
                          )}
                        </div>

                        {documentReadResult && documentReadResult.candidates.length > 0 && (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {Object.entries(documentReadResult.patch).map(([field, value]) => (
                              <div key={field} className="rounded-xl border border-blue-100 bg-white/80 px-3 py-2">
                                <div className="text-[9px] font-black uppercase tracking-widest text-blue-400">
                                  {t(field)}
                                </div>
                                <div className="mt-1 truncate text-[11px] font-black text-slate-700">
                                  {value}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {documentReadCandidate && (
                          <button
                            type="button"
                            onClick={() => applyDocumentReadCandidate(documentReadCandidate, true)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-100 transition-colors hover:bg-blue-700"
                          >
                            <Wand2 className="h-4 w-4" />
                            {t('applyDocumentAddress')}
                          </button>
                        )}

                        {documentReadResult?.extractedText && (
                          <details className="rounded-xl border border-blue-100 bg-white/70 p-3">
                            <summary className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-blue-600">
                              {t('extractedAddressText')}
                            </summary>
                            <pre className="mt-3 max-h-36 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-900 p-3 text-[10px] font-mono leading-4 text-slate-100">
                              {documentReadResult.extractedText}
                            </pre>
                          </details>
                        )}
                      </div>

                      <div id="address-registration-readiness" className={cn(
                        "order-50 space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm",
                        !showRegistrationDetails && "hidden",
                      )}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              {t('professionalReadiness')}
                            </div>
                            <h4 className="mt-1 text-sm font-black text-slate-800">
                              {t('registrationOperationalCheck')}
                            </h4>
                            <p className="mt-1 text-[11px] font-bold leading-5 text-slate-500">
                              {t('registrationOperationalDesc')}
                            </p>
                          </div>
                          <span className={cn(
                            "inline-flex shrink-0 items-center justify-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                            READINESS_STATUS_STYLES[registrationReadiness.status] || READINESS_STATUS_STYLES.needs_review,
                          )}>
                            {statusLabel(registrationReadiness.status)}
                          </span>
                        </div>

                        <div id="registration-qr-quality" className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                          <AddressQualityDecisionBar
                            decision={registrationQualityDecision}
                            compact
                            language={appLanguage}
                          />
                          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                              {t('qrQualityMetadata')}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className="rounded-full bg-white px-2 py-1 text-[9px] font-black uppercase text-slate-600">
                                {registrationQualitySnapshot.confidenceBand}
                              </span>
                              <span className="rounded-full bg-white px-2 py-1 text-[9px] font-black uppercase text-slate-600">
                                {isAgidPrimaryIdentifier ? t('postalCoverageAgidBadge') : registrationQualitySnapshot.sourceFlags.postalAutofill ? t('postalEvidence') : t('manualPostal')}
                              </span>
                              <span className="rounded-full bg-white px-2 py-1 text-[9px] font-black uppercase text-slate-600">
                                {registrationQualitySnapshot.sourceFlags.agidAssistance ? t('agidEvidence') : t('addressOnly')}
                              </span>
                            </div>
                            <div className="mt-2 text-[10px] font-bold leading-4 text-slate-500">
                              {t('qrQualityPublicDesc')}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3">
                          {registrationReadiness.roleSummaries.map(role => (
                            <div key={role.role} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-[10px] font-black uppercase tracking-widest text-slate-500">
                                  {READINESS_ROLE_LABEL_KEYS[role.role] ? t(READINESS_ROLE_LABEL_KEYS[role.role]) : role.role}
                                </span>
                                <span className={cn(
                                  "rounded-full px-2 py-0.5 text-[9px] font-black uppercase",
                                  role.failures > 0
                                    ? "bg-rose-100 text-rose-700"
                                    : role.warnings > 0
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-emerald-100 text-emerald-700",
                                )}>
                                  {role.failures > 0 ? t('roleFix') : role.warnings > 0 ? t('roleReview') : t('roleOk')}
                                </span>
                              </div>
                              <div className="mt-1 text-[10px] font-bold text-slate-400">
                                {formatUiString('roleSummary', {
                                  pass: role.passed,
                                  review: role.warnings,
                                  fix: role.failures,
                                })}
                              </div>
                            </div>
                          ))}
                        </div>

                        {registrationReadiness.nextActions.length > 0 && (
                          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-700">
                              <AlertCircle className="h-3.5 w-3.5" />
                              {t('nextAction')}
                            </div>
                            <ul className="mt-2 space-y-1">
                              {registrationReadiness.nextActions.slice(0, 3).map(action => (
                                <li key={action} className="text-[11px] font-bold leading-5 text-amber-800">
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600">
                            <ShieldIcon className="h-3 w-3" />
                            {registrationReadiness.publicMetadata.privacyBoundary}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600">
                            {t('intentLabel')} {registrationReadiness.publicMetadata.intentStatus}
                          </span>
                        </div>
                      </div>

                      {/* Language Selection */}
                      <div className="order-1 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="shrink-0 text-[9px] font-black uppercase tracking-widest text-slate-400">
                            {t('addressLanguageLabel')}
                          </label>
                          {addressLanguageTabs.map(tab => (
                            <button
                              key={tab.code}
                              type="button"
                              onClick={() => handleAddressLanguageTabClick(tab.code)}
                              className={cn(
                                "h-8 rounded-md border px-2.5 text-[11px] font-black transition-all",
                                activeTab === tab.code
                                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                  : "bg-slate-100 text-slate-500 border-slate-100 hover:text-slate-700"
                              )}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                        {addressTranslationStatus === 'translating' && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {t('translatingAddressFields')}
                          </div>
                        )}
                        {addressTranslationStatus === 'error' && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-rose-500">
                            <AlertCircle className="h-3 w-3" />
                            {t('translationFallbackKept')}
                          </div>
                        )}
                        {translationFeedbackRef.current?.targetLanguage === activeTab && addressTranslationStatus !== 'translating' && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-start gap-2">
                              <ShieldIcon className="mt-0.5 h-3.5 w-3.5 text-slate-500" />
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                  {t('closedTranslationLearning')}
                                </div>
                                <div className="mt-1 text-[10px] font-bold leading-4 text-slate-400">
                                  {t('translationFeedbackDesc')}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={!feedbackConsent}
                                    onClick={() => persistTranslationFeedback('accepted')}
                                    className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[10px] font-black text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {t('translationLooksGood')}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!feedbackConsent}
                                    onClick={() => persistTranslationFeedback('corrected')}
                                    className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-[10px] font-black text-amber-700 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {t('useEditsForLearning')}
                                  </button>
                                  {translationFeedbackStatus === 'saved' && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-3 py-2 text-[10px] font-black text-emerald-700">
                                      <CheckCircle2 className="h-3 w-3" />
                                      {t('savedLocally')}
                                    </span>
                                  )}
                                  {translationFeedbackStatus === 'error' && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-rose-100 px-3 py-2 text-[10px] font-black text-rose-700">
                                      <AlertCircle className="h-3 w-3" />
                                      {t('nothingToSave')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div id="address-registration-primary-form" className="order-2 mx-auto w-full max-w-3xl space-y-2.5 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
                      <div id="address-registration-feedback-ui" className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                              <ShieldIcon className="h-4 w-4 text-emerald-600" />
                              {t('feedbackConsent')}
                            </div>
                            <p className={cn(
                              "mt-1 text-[11px] font-bold leading-5 text-slate-500",
                              !showRegistrationDetails && "hidden",
                            )}>
                              {t('feedbackConsentDesc')}
                            </p>
                          </div>
                          <label className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-black text-slate-700">
                            <input
                              type="checkbox"
                              checked={feedbackConsent}
                              onChange={event => setFeedbackConsent(event.currentTarget.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-slate-900"
                            />
                            {t('localLearning')}
                          </label>
                        </div>
                        <div className={cn(
                          "mt-3 flex flex-wrap gap-1.5",
                          !showRegistrationDetails && "hidden",
                        )}>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-slate-600">
                            {t('noRawExport')}
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-slate-600">
                            {t('nativeInternationalCompatibility')}
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-slate-600">
                            {t('qrQualityMetadata')}
                          </span>
                        </div>
                      </div>
                      {/* Country Selector */}
                      <div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                            {t('countryRegion')}
                          </label>
                          <button
                            type="button"
                            onClick={() => setViewMode('country-select')}
                            className="group flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2.5 transition-all hover:bg-white"
                          >
                            <div className="flex items-center gap-3">
                              <CountryFlag
                                code={currentCountry?.code || formData.country}
                                name={currentCountry?.name || formData.country || t('unknownRegion')}
                                fallback={currentCountry?.flag || '🌐'}
                              />
                              <span className="text-sm font-black text-slate-700">
                                {currentCountry?.name || formData.country}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Territory indicator */}
                              {isAnyRegionMode && (
                                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">{t('regionsBadge')}</span>
                              )}
                              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Ordered Fields */}
                  <div className="grid grid-cols-2 gap-x-2.5 gap-y-2.5 sm:gap-x-3">
                    {localFormat ? (
                      (() => {
                        const currentFormat = selectRegistrationAddressFormat(localFormat, activeTab);
                        const fields = currentFormat?.fields || localFormat.fields || [];

                        return fields.map(field => (
                          <div
                            key={field.key}
                            className={cn(
                              "space-y-1",
                              (
                                field.key === 'organization'
                                || field.key === 'street'
                                || field.key === 'postcode'
                              ) && "col-span-2",
                            )}
                          >
                            <label className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                              {field.key === 'postcode' && <Mail className="w-3 h-3" />}
                              {field.key === 'organization' && <Building2 className="w-3 h-3" />}
                              {field.label}
                            </label>
                            {field.key === 'street' || field.key === 'organization' ? (
                              <>
                                <textarea
                                  rows={1}
                                  value={(formData as any)[field.key] || ''}
                                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                  placeholder={field.placeholder}
                                  autoFocus={field.key === fields[0]?.key}
                                  className="h-9 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                {field.key === 'organization' && (
                                  <div className="space-y-2">
                                    {buildingNameStatus === 'loading' && (
                                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        {t('buildingLookupLoading')}
                                      </div>
                                    )}
                                    {buildingNameCandidates.length > 0 && (
                                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                        <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                          <Building2 className="h-3 w-3" />
                                          {t('buildingCandidatesLabel')}
                                        </div>
                                        <div className="space-y-2">
                                          {buildingNameCandidates.map(candidate => (
                                            <button
                                              key={`${candidate.source}:${candidate.osmType || 'feature'}:${candidate.osmId || candidate.name}`}
                                              type="button"
                                              onClick={() => applyBuildingNameCandidate(candidate)}
                                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                                            >
                                              <div className="text-xs font-black text-slate-800">
                                                {activeTab === 'en' && candidate.nameEn ? candidate.nameEn : candidate.name}
                                              </div>
                                              <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-500">
                                                <span>{candidate.source}</span>
                                                {candidate.category && <span>{candidate.category}</span>}
                                                {typeof candidate.distanceMeters === 'number' && <span>{candidate.distanceMeters}m</span>}
                                              </div>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {buildingNameStatus === 'empty' && !formData.organization && showRegistrationDetails && (
                                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                        <AlertCircle className="h-3 w-3" />
                                        {t('buildingNoCandidate')}
                                      </div>
                                    )}
                                    {buildingNameStatus === 'error' && (
                                      <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600">
                                        <AlertCircle className="h-3 w-3" />
                                        {t('buildingLookupUnavailable')}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            ) : field.key === 'postcode' ? (
                              postcodeInputConfig.kind !== 'none' ? (
                                <>
                                  <PostcodeInput
                                    format={postcodeInputConfig.pattern}
                                    value={formData.postcode}
                                    onChange={handlePostcodeChange}
                                    className="flex-wrap"
                                    countryCode={formData.country}
                                    fixedValue={postcodeInputConfig.fixedValue}
                                    source={postcodeInputConfig.source}
                                  />
                                  {postcodeLookupStatus === 'loading' && (
                                    <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      {t('postcodeLookupLoading')}
                                    </div>
                                  )}
                                  {postcodeLookupStatus === 'filled' && (
                                    <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-emerald-600">
                                      <CheckCircle2 className="h-3 w-3" />
                                      {t('postalFieldsFilled')}
                                    </div>
                                  )}
                                  {postcodeLookupStatus === 'candidates' && postcodeAutofillCandidates.length > 0 && (
                                    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                                      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-700">
                                        <ListFilter className="h-3 w-3" />
                                        {t('postalCandidates')}
                                      </div>
                                      <div className="space-y-2">
                                        {postcodeAutofillCandidates.map(candidate => (
                                          <button
                                            key={candidate.id}
                                            type="button"
                                            onClick={() => applyPostcodeAutofillCandidate(candidate)}
                                            className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                                          >
                                            <div className="text-xs font-black text-slate-800">
                                              {formatPostcodeAutofillCandidateLabel(candidate.patch, candidate.label)}
                                            </div>
                                            <div className="mt-1 text-[10px] font-bold text-slate-500">
                                              {candidate.evidence.slice(0, 3).join(' / ')}
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {postcodeLookupStatus === 'empty' && (
                                    <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-amber-600">
                                      <AlertCircle className="h-3 w-3" />
                                      {t('noPostalMatchFound')}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-700">
                                    <AgidIcon className="h-3.5 w-3.5" />
                                    {t('noPostalAgidPrimary')}
                                  </div>
                                  <p className="mt-1 text-[11px] font-bold leading-5 text-blue-900/70">
                                    {t('noPostalAgidPrimaryDesc')}
                                  </p>
                                </div>
                              )
                            ) : (
                              <input
                                type={field.type || 'text'}
                                value={(formData as any)[field.key] || ''}
                                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                autoFocus={field.key === fields[0]?.key}
                                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            )}
                          </div>
                        ));
                      })()
                    ) : (
                      <div className="p-8 text-center text-slate-400">{t('registrationLoadingFormat')}</div>
                    )}
                  </div>
                </div>
                </div>

                    <div className="sticky bottom-2 z-10 flex justify-center sm:justify-end">
                      <button
                        type="submit"
                        className={cn(
                          "flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-xs font-black uppercase tracking-wider shadow-lg transition-all active:scale-95 sm:w-auto sm:min-w-[180px]",
                          isAoidMode
                            ? "bg-slate-950 text-white shadow-slate-300"
                            : "bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700"
                        )}
                      >
                        {isAoidMode ? <ShieldIcon className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        {isAoidMode ? t('registerAsAoid') : t('registerAddress')}
                      </button>
                    </div>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="country-select"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 min-h-[500px]"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <button
                        onClick={() => setViewMode('form')}
                        className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 rotate-180" />
                      </button>
                      <div>
                        <h3 className="text-xl font-black text-slate-800">{t('selectCountryRegion')}</h3>
                        <p className="text-xs font-bold text-slate-400">{t('selectCountryRegionDesc')}</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* Main Countries */}
                      <div className="space-y-4">
                        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                          {REGISTRATION_COUNTRY_TABS.map(tab => {
                            const count = countryGroups[tab.id].length;
                            return (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() => setSelectedCountryTab(tab.id)}
                                className={cn(
                                  "shrink-0 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all",
                                  selectedCountryTab === tab.id
                                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                    : "bg-white text-slate-500 border-slate-100 hover:border-emerald-200 hover:text-emerald-700"
                                )}
                              >
                                {tab.label}
                                <span className={cn(
                                  "ml-2 rounded-md px-1.5 py-0.5 text-[9px]",
                                  selectedCountryTab === tab.id ? "bg-white/15 text-white" : "bg-slate-100 text-slate-400"
                                )}>
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                          {REGISTRATION_COUNTRY_TABS.find(tab => tab.id === selectedCountryTab)?.label} {t('countriesTerritories')}
                        </label>
                        <div
                          className="grid gap-2"
                          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
                        >
                          {countryGroups[selectedCountryTab].map(c => (
                            <button
                              key={c.code}
                              onClick={() => {
                                setFormData(selectRegistrationCountry(formData, c, { storeRegionName: false }));
                                setViewMode('form');
                              }}
                              className={cn(
                                "flex items-center justify-between gap-3 p-3 rounded-lg border transition-all group",
                                formData.country === c.code
                                  ? "bg-emerald-600 border-emerald-600 text-white shadow-lg"
                                  : "bg-slate-50 border-slate-100 hover:bg-white hover:border-emerald-200"
                              )}
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <CountryFlag
                                  code={c.code}
                                  name={c.name}
                                  fallback={c.flag}
                                  selected={formData.country === c.code}
                                />
                                <div className="min-w-0 text-left">
                                  <span className={cn(
                                    "block truncate text-xs font-black",
                                    formData.country === c.code ? "text-white" : "text-slate-700"
                                  )}>
                                    {c.name}
                                  </span>
                                  {c.nativeName && c.nativeName !== c.name && (
                                    <span className={cn(
                                      "block truncate text-[10px] font-bold",
                                      formData.country === c.code ? "text-emerald-50" : "text-slate-400"
                                    )}>
                                      {c.nativeName}
                                    </span>
                                  )}
                                  <span className={cn(
                                    "block truncate text-[9px] font-black uppercase tracking-wider",
                                    formData.country === c.code ? "text-emerald-100" : "text-slate-300"
                                  )}>
                                    {c.region}{c.type ? ` / ${c.type}` : ''}
                                  </span>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className={cn(
                                  "rounded-md px-2 py-1 text-[10px] font-black",
                                  formData.country === c.code ? "bg-white/15 text-white" : "bg-white text-slate-400"
                                )}>
                                  {c.code}
                                </span>
                                <CheckCircle2 className={cn(
                                  "w-4 h-4 transition-opacity",
                                  formData.country === c.code ? "opacity-100" : "opacity-0"
                                )} />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </div>
          </motion.div>
      )}
    </AnimatePresence>
  );
};

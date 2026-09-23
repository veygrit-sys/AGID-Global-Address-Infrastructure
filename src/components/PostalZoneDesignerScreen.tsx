import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  FileCheck2,
  DraftingCompass,
  GitBranch,
  Globe2,
  Grid3X3,
  Layers3,
  MapPinned,
  Merge,
  MousePointer2,
  Plus,
  Route,
  Scissors,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import React from 'react';

import {
  buildPostalZoneLocalityChoices,
  buildPostalZoneDesignerWorkspace,
  listPostalZoneDesignerCountries,
  listPostalZoneDesignerTemplates,
  type PostalZoneDesignerSafetyBoundary,
  type PostalZoneDesignerWorkspace,
} from '../lib/postalZoneDesigner';
import { getLanguageDirection } from '../lib/i18n';
import {
  APP_LANGUAGES,
  APP_LANGUAGE_STORAGE_KEY,
  normalizeAppLanguage,
} from '../lib/languageSettings';
import { buildAgidPostalForgeProgramPlan } from '../lib/agidPostalForgeProgram';
import { formatPublicConfidenceBand } from '../lib/publicDecisionDisplay';
import { cn } from '../lib/utils';

type PostalZoneDesignerCopyKey =
  | 'returnToMap'
  | 'subtitle'
  | 'language'
  | 'country'
  | 'template'
  | 'possibleFormats'
  | 'chooseFormat'
  | 'recommended'
  | 'simulationOnly'
  | 'metrics'
  | 'addressCount'
  | 'population'
  | 'area'
  | 'municipalities'
  | 'ambiguity'
  | 'routeRadius'
  | 'governance'
  | 'dataTrust'
  | 'privacy'
  | 'sensitive'
  | 'highRisk'
  | 'stage'
  | 'classification'
  | 'countryProfile'
  | 'terrain'
  | 'sourceNote'
  | 'publication'
  | 'notOfficial'
  | 'guidedProposal'
  | 'recommendedFormat'
  | 'scopeBuilder'
  | 'boundaryCheck'
  | 'boundaryPass'
  | 'boundaryFail'
  | 'simulateCrossMunicipality'
  | 'formatPreview'
  | 'exampleCode'
  | 'municipality'
  | 'town'
  | 'chome'
  | 'candidatePostalCode'
  | 'sameMunicipalityOnly'
  | 'createAllowed'
  | 'createBlocked'
  | 'stepCountry'
  | 'stepArea'
  | 'stepReview'
  | 'stepPilot'
  | 'aiQuality'
  | 'aiGrade'
  | 'aiConfidence'
  | 'nextActions'
  | 'mathChecks'
  | 'gisChecks'
  | 'vpl'
  | 'vplDesign'
  | 'vplRationale'
  | 'nonAdministrative'
  | 'editLedger'
  | 'safeExport'
  | 'copyExport'
  | 'minimumCodes'
  | 'existence'
  | 'capacity'
  | 'generatedCode'
  | 'adaptiveHierarchy'
  | 'learnedSystems'
  | 'source'
  | 'integrated'
  | 'excluded'
  | 'rejected'
  | 'warnings'
  | 'officialGuard'
  | 'draftOnly'
  | 'codes'
  | 'creationConsole'
  | 'createDraft'
  | 'draftCreated'
  | 'copyCandidate'
  | 'currentDecision'
  | 'nextAction'
  | 'selectedScope'
  | 'creationHistory'
  | 'noDraftYet'
  | 'draftOnlyDecision'
  | 'blockedDecision'
  | 'pilotDecision'
  | 'officialDecision'
  | 'realCountryExample'
  | 'loadFijiExample'
  | 'generatedExamples'
  | 'method'
  | 'usabilityImprovements'
  | 'noPostalBasis'
  | 'rawAddressFree'
  | 'exampleDraft'
  | 'exampleSupplemental'
  | 'exampleBlocked'
  | 'mapBuilder'
  | 'mapBuilderHint'
  | 'mapClickToSelect'
  | 'agidCellLayer'
  | 'vplLayer'
  | 'safetyLayer'
  | 'selectedMapZone'
  | 'mapBoundaryOk'
  | 'mapBoundaryBlocked'
  | 'mapCoordinate'
  | 'mapFirstWorkspace'
  | 'mapFirstWorkbench'
  | 'countryPackDashboard'
  | 'centralIndex'
  | 'repository'
  | 'lazyLoad'
  | 'updateCadence'
  | 'coveragePolicy'
  | 'releaseStage'
  | 'noRawData'
  | 'splitMergePlanner'
  | 'currentZones'
  | 'splitScenario'
  | 'mergeScenario'
  | 'avgArea'
  | 'minArea'
  | 'maxArea'
  | 'avgPopulation'
  | 'collisionRisk'
  | 'codePreview'
  | 'domesticDisplay'
  | 'internationalDisplay'
  | 'countryPackDisplay'
  | 'qualityGate'
  | 'qualityScore'
  | 'blockers'
  | 'releaseReady'
  | 'reviewRequired'
  | 'publishBlocked';

const COPY: Record<'en' | 'ja', Record<PostalZoneDesignerCopyKey, string>> = {
  en: {
    returnToMap: 'Return to map',
    subtitle: 'Design AGID postal zones for countries with missing or weak postal code systems, with math, GIS, privacy, and governance gates.',
    language: 'Language',
    country: 'Country',
    template: 'Format',
    possibleFormats: 'Possible formats',
    chooseFormat: 'Choose format',
    recommended: 'Recommended',
    simulationOnly: 'Simulation only',
    metrics: 'Planning metrics',
    addressCount: 'Delivery points',
    population: 'Population',
    area: 'Area km2',
    municipalities: 'Municipalities',
    ambiguity: 'Ambiguity',
    routeRadius: 'Route radius',
    governance: 'Governance',
    dataTrust: 'Data trust',
    privacy: 'Privacy',
    sensitive: 'Sensitive zone',
    highRisk: 'High-risk mode',
    stage: 'Design stage',
    classification: 'Country class',
    countryProfile: 'Country profile',
    terrain: 'Terrain',
    sourceNote: 'Source note',
    publication: 'Publication gate',
    guidedProposal: 'Guided proposal',
    recommendedFormat: 'Recommended format',
    scopeBuilder: 'Choose area',
    boundaryCheck: 'Municipality boundary check',
    boundaryPass: 'Inside one municipality',
    boundaryFail: 'Cross-municipality blocked',
    simulateCrossMunicipality: 'Test cross-municipality block',
    formatPreview: 'Format',
    exampleCode: 'Example',
    municipality: 'Municipality',
    town: 'Town / quarter',
    chome: 'Block / chome',
    candidatePostalCode: 'Candidate postal code',
    sameMunicipalityOnly: 'One postal code must stay inside one municipality.',
    createAllowed: 'Draft creation allowed',
    createBlocked: 'Use existing official code',
    stepCountry: 'Choose country',
    stepArea: 'Choose municipality and town',
    stepReview: 'Review candidate',
    stepPilot: 'Pilot before publication',
    aiQuality: 'AtlasWeaver AI quality',
    aiGrade: 'AI grade',
    aiConfidence: 'Proof status',
    nextActions: 'Next actions',
    notOfficial: 'This screen creates simulation, draft, pilot, or supplementary postal zones. It does not claim official national status unless governance, data, privacy, issuer, and transition gates are satisfied.',
    mathChecks: 'Readiness checks',
    gisChecks: 'GIS validation',
    vpl: 'Virtual Postal Locality',
    vplDesign: 'VPL design',
    vplRationale: 'Design reasons',
    nonAdministrative: 'Non-administrative postal locality',
    editLedger: 'AGID edit ledger',
    safeExport: 'Safe export',
    copyExport: 'Copy safe export',
    minimumCodes: 'Minimum areas',
    existence: 'Unique code check',
    capacity: 'Available codes',
    generatedCode: 'Generated code',
    adaptiveHierarchy: 'Recommended scope',
    learnedSystems: 'References',
    source: 'Edit source',
    integrated: 'Integrated',
    excluded: 'Excluded',
    rejected: 'Rejected',
    warnings: 'Warnings',
    officialGuard: 'Official guard',
    draftOnly: 'Draft until approved',
    codes: 'Candidate codes',
    creationConsole: 'Postal code creator',
    createDraft: 'Create draft',
    draftCreated: 'Draft created',
    copyCandidate: 'Copy candidate',
    currentDecision: 'Decision',
    nextAction: 'Next action',
    selectedScope: 'Selected scope',
    creationHistory: 'Draft history',
    noDraftYet: 'No local draft has been created yet.',
    draftOnlyDecision: 'Draft only',
    blockedDecision: 'Blocked',
    pilotDecision: 'Pilot-ready',
    officialDecision: 'Official-ready',
    realCountryExample: 'Real no-postal-country example',
    loadFijiExample: 'Load Fiji example',
    generatedExamples: 'Generated examples',
    method: 'Method',
    usabilityImprovements: 'Usability improvements',
    noPostalBasis: 'No-postal basis',
    rawAddressFree: 'No raw address stored',
    exampleDraft: 'Draft postal code',
    exampleSupplemental: 'Supplemental draft',
    exampleBlocked: 'Blocked',
    mapBuilder: 'Map-assisted forge',
    mapBuilderHint: 'Select a municipality on the map, then refine town or block below. AGID cells, VPL hints, and safety boundaries stay visible while drafting.',
    mapClickToSelect: 'Click a zone to select',
    agidCellLayer: 'AGID cells',
    vplLayer: 'VPL hints',
    safetyLayer: 'Safety boundary',
    selectedMapZone: 'Selected zone',
    mapBoundaryOk: 'Map boundary OK',
    mapBoundaryBlocked: 'Map boundary blocked',
    mapCoordinate: 'Planning centroid',
    mapFirstWorkspace: 'Map-first postal zone workspace',
    mapFirstWorkbench: 'Draft postal codes from the map',
    countryPackDashboard: 'Country Pack Dashboard',
    centralIndex: 'Central index',
    repository: 'Repository',
    lazyLoad: 'Lazy load',
    updateCadence: 'Update cadence',
    coveragePolicy: 'Coverage policy',
    releaseStage: 'Release stage',
    noRawData: 'No raw data',
    splitMergePlanner: 'Split / Merge Planner',
    currentZones: 'Current zones',
    splitScenario: 'Split scenario',
    mergeScenario: 'Merge scenario',
    avgArea: 'Average area',
    minArea: 'Minimum area',
    maxArea: 'Maximum area',
    avgPopulation: 'Average population',
    collisionRisk: 'Collision risk',
    codePreview: 'Code Preview',
    domesticDisplay: 'Domestic display',
    internationalDisplay: 'International display',
    countryPackDisplay: 'Country pack display',
    qualityGate: 'Quality Gate',
    qualityScore: 'Quality score',
    blockers: 'Blockers',
    releaseReady: 'Release ready',
    reviewRequired: 'Review required',
    publishBlocked: 'Publication blocked',
  },
  ja: {
    returnToMap: '地図へ戻る',
    subtitle: '郵便番号がない・弱い国向けに、AGID郵便区画を数理、GIS、プライバシー、ガバナンスのゲート付きで設計します。',
    language: '言語',
    country: '国',
    template: '形式',
    possibleFormats: '可能な形式',
    chooseFormat: '形式を選ぶ',
    recommended: 'おすすめ',
    simulationOnly: 'シミュレーションのみ',
    metrics: '計画指標',
    addressCount: '配送地点数',
    population: '人口',
    area: '面積 km2',
    municipalities: '自治体数',
    ambiguity: '曖昧性',
    routeRadius: '配送半径',
    governance: 'ガバナンス',
    dataTrust: 'データ信頼度',
    privacy: 'プライバシー',
    sensitive: '機微区画',
    highRisk: '高リスクモード',
    stage: '設計段階',
    classification: '国分類',
    countryProfile: '国プロファイル',
    terrain: '地形',
    sourceNote: '資料メモ',
    publication: '公開ゲート',
    guidedProposal: 'かんたん提案',
    recommendedFormat: 'おすすめ形式',
    scopeBuilder: '範囲を選ぶ',
    boundaryCheck: '自治体境界チェック',
    boundaryPass: '1市町村内',
    boundaryFail: '市町村またぎをブロック',
    simulateCrossMunicipality: '市町村またぎブロックを試す',
    formatPreview: '形式',
    exampleCode: '例',
    municipality: '市町村',
    town: '町・地区',
    chome: '丁目・区画',
    candidatePostalCode: '候補郵便番号',
    sameMunicipalityOnly: '1つの郵便番号は1つの市町村内に収めます。',
    createAllowed: '下書き作成可',
    createBlocked: '既存公式番号を使用',
    stepCountry: '国を選ぶ',
    stepArea: '市町村・町丁目を選ぶ',
    stepReview: '候補を確認',
    stepPilot: '公開前に試験運用',
    aiQuality: 'AtlasWeaver AI品質',
    aiGrade: 'AI評価',
    aiConfidence: '証明状態',
    nextActions: '次の改善',
    notOfficial: 'この画面は simulation、draft、pilot、supplementary の郵便区画を設計します。政府・自治体・配送業者・データ品質・匿名性・移行写像が満たされない限り、公式国家郵便番号とは表示しません。',
    mathChecks: '準備チェック',
    gisChecks: 'GIS検証',
    vpl: '仮想郵便ローカリティ',
    vplDesign: 'VPL設計',
    vplRationale: '設計理由',
    nonAdministrative: '非行政の郵便地域',
    editLedger: 'AGID編集台帳',
    safeExport: '安全なexport',
    copyExport: '安全なexportをコピー',
    minimumCodes: '必要区画数',
    existence: '一意コード可',
    capacity: '利用可能コード',
    generatedCode: '生成コード',
    adaptiveHierarchy: '推奨範囲',
    learnedSystems: '参考',
    source: '編集元',
    integrated: '統合',
    excluded: '除外',
    rejected: '拒否',
    warnings: '警告',
    officialGuard: '公式化ガード',
    draftOnly: '承認まではdraft',
    codes: '候補コード',
    creationConsole: '郵便番号作成',
    createDraft: '下書きを作成',
    draftCreated: '下書き作成済み',
    copyCandidate: '候補をコピー',
    currentDecision: '判定',
    nextAction: '次の操作',
    selectedScope: '選択範囲',
    creationHistory: '下書き履歴',
    noDraftYet: 'まだローカル下書きは作成されていません。',
    draftOnlyDecision: '下書きのみ',
    blockedDecision: 'ブロック',
    pilotDecision: '試験運用可',
    officialDecision: '公式化可',
    realCountryExample: '郵便番号なし国の実例',
    loadFijiExample: 'Fijiの実例を読み込む',
    generatedExamples: '生成例',
    method: '手法',
    usabilityImprovements: '使いやすさ改善',
    noPostalBasis: '郵便番号なし扱いの根拠',
    rawAddressFree: '実住所は保存しない',
    exampleDraft: '下書き郵便番号',
    exampleSupplemental: '補助下書き',
    exampleBlocked: 'ブロック',
    mapBuilder: '地図を見ながら作成',
    mapBuilderHint: '地図上の市町村を選び、下で町・丁目を絞り込みます。AGIDセル、VPL候補、安全境界を見ながら下書きできます。',
    mapClickToSelect: '区画をクリックして選択',
    agidCellLayer: 'AGIDセル',
    vplLayer: 'VPL候補',
    safetyLayer: '安全境界',
    selectedMapZone: '選択中の区画',
    mapBoundaryOk: '地図境界OK',
    mapBoundaryBlocked: '地図境界ブロック',
    mapCoordinate: '計画中心点',
    mapFirstWorkspace: '地図を見ながら作る郵便番号ワークスペース',
    mapFirstWorkbench: '地図から郵便番号を下書き',
    countryPackDashboard: '国別Packダッシュボード',
    centralIndex: '中央インデックス',
    repository: 'リポジトリ',
    lazyLoad: '遅延読み込み',
    updateCadence: '更新頻度',
    coveragePolicy: 'カバレッジ分類',
    releaseStage: '公開状態',
    noRawData: '生データなし',
    splitMergePlanner: '分割・統合プランナー',
    currentZones: '現在の区画数',
    splitScenario: '分割案',
    mergeScenario: '統合案',
    avgArea: '平均面積',
    minArea: '最小面積',
    maxArea: '最大面積',
    avgPopulation: '平均人口',
    collisionRisk: '衝突リスク',
    codePreview: 'コードプレビュー',
    domesticDisplay: '国内表示',
    internationalDisplay: '国際配送表示',
    countryPackDisplay: '国別Pack表示',
    qualityGate: '品質ゲート',
    qualityScore: '品質スコア',
    blockers: 'ブロッカー',
    releaseReady: '公開準備OK',
    reviewRequired: 'レビュー必要',
    publishBlocked: '公開ブロック',
  },
};

const countries = listPostalZoneDesignerCountries();
const templates = listPostalZoneDesignerTemplates();

function defaultTemplateForCountry(country: typeof countries[number]) {
  if (country.code === 'JP') return 'japan-like';
  if (country.code === 'US') return 'us-like';
  if (country.code === 'GH') return 'ghana-like';
  if (country.terrain === 'archipelago') return 'agid-native';
  if (country.terrain === 'desert') return 'france-like';
  if (country.population > 50_000_000) return 'india-like';
  return 'us-like';
}

function readInitialLanguage() {
  if (typeof window === 'undefined') return 'en';
  return normalizeAppLanguage(window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY) || navigator.language || 'en');
}

function copyFor(language: string) {
  return COPY[normalizeAppLanguage(language)];
}

const STUDIO_COPY = {
  en: {
    studioTitle: 'Postcode Builder',
    studioSubtitle: 'Postal zone generation studio',
    projectName: 'AGID Postal Zone Plan',
    saving: 'Drafting',
    savedAt: 'Last saved: local draft',
    searchPlaceholder: 'Search address, place, or postal zone',
    selectTool: 'Select',
    splitTool: 'Split',
    mergeTool: 'Merge',
    deleteTool: 'Delete',
    addVirtualTown: 'Add virtual town',
    generationMode: 'Generation mode',
    byIsland: 'By island',
    byCity: 'By city',
    byTown: 'By town',
    byRoad: 'By road',
    byRoute: 'By delivery route',
    byVirtualTown: 'By virtual town',
    digitCount: 'Postal code digits',
    loadAddressData: 'Load address data',
    loadCarrierData: 'Load carrier data',
    displayLayers: 'Display layers',
    boundaryLayer: 'Boundaries',
    populationDensityLayer: 'Population density',
    deliveryDepotLayer: 'Delivery depots',
    roadNetworkLayer: 'Road network',
    islandTownLayer: 'Island / town / settlement',
    terrainLayer: 'Terrain reference',
    autoSimulation: 'Run auto-generation simulation',
    selectedAreaInfo: 'Selected area',
    households: 'Households',
    deliveryRouteCount: 'Delivery routes',
    deliveryDensity: 'Delivery density',
    regionType: 'Region type',
    timezone: 'Time zone',
    verificationChecks: 'Verification checks',
    overlapCheck: 'Overlap check',
    neighborConflict: 'Neighbor conflict',
    adminConsistency: 'Administrative consistency',
    addressFormat: 'Address format',
    deliveryCoverage: 'Delivery coverage',
    multilingualPreview: 'Multilingual address preview',
    confirmPostalCode: 'Confirm this postal zone',
    apiPreview: 'API preview',
    postalCodeList: 'Postal zone list',
    bulkExport: 'Bulk export',
    postcode: 'Postcode',
    localityName: 'Locality',
    addressRows: 'Address rows',
    density: 'Density',
    status: 'Status',
    minimumSimulator: 'Minimum code simulator',
    minimumRequired: 'Minimum required',
    recommendedCount: 'Recommended',
    highPrecisionDelivery: 'High precision delivery',
    projectProgress: 'Project progress',
    approvalFlow: 'Approval flow',
    draftStep: 'Draft',
    carrierReviewStep: 'Carrier review',
    municipalReviewStep: 'Local review',
    residentReviewStep: 'Resident / operator check',
    publicReleaseStep: 'Public release',
    apiDistributionStep: 'API distribution',
    satellitePhoto: 'Satellite view',
    distanceFromDepot: 'Distance from depot',
    noIssue: 'No issue',
    review: 'Review',
    valid: 'Valid',
    created: 'Drafting',
  },
  ja: {
    studioTitle: 'Postcode Builder',
    studioSubtitle: '郵便番号生成スタジオ',
    projectName: 'AGID 郵便番号計画',
    saving: '作成中',
    savedAt: '最終保存: ローカル下書き',
    searchPlaceholder: '住所、地域名、郵便番号を検索',
    selectTool: '選択',
    splitTool: '分割',
    mergeTool: '結合',
    deleteTool: '削除',
    addVirtualTown: '仮想タウン追加',
    generationMode: '生成方式',
    byIsland: '島ごと',
    byCity: '都市ごと',
    byTown: '町ごと',
    byRoad: '道路ごと',
    byRoute: '配送ルートごと',
    byVirtualTown: '仮想タウンごと',
    digitCount: '郵便番号の桁数',
    loadAddressData: '住所データを読み込み',
    loadCarrierData: '配送会社データを読み込み',
    displayLayers: '表示レイヤー',
    boundaryLayer: '境界線',
    populationDensityLayer: '人口密度',
    deliveryDepotLayer: '配送拠点',
    roadNetworkLayer: '道路網',
    islandTownLayer: '島・町・集落',
    terrainLayer: '地形参照',
    autoSimulation: '自動生成シミュレーション',
    selectedAreaInfo: '選択中エリア',
    households: '世帯数',
    deliveryRouteCount: '配送ルート数',
    deliveryDensity: '配送難易度',
    regionType: '地域タイプ',
    timezone: 'タイムゾーン',
    verificationChecks: '検証チェック',
    overlapCheck: '重複チェック',
    neighborConflict: '隣接地域との衝突',
    adminConsistency: '行政区分との整合性',
    addressFormat: '住所フォーマット',
    deliveryCoverage: '配送カバー率',
    multilingualPreview: '多言語住所表記プレビュー',
    confirmPostalCode: 'この郵便番号を確定',
    apiPreview: 'APIプレビュー',
    postalCodeList: '郵便番号一覧',
    bulkExport: '一括エクスポート',
    postcode: '郵便番号',
    localityName: '地域名',
    addressRows: '住所数',
    density: '密度',
    status: 'ステータス',
    minimumSimulator: '最小郵便番号数シミュレーター',
    minimumRequired: '最低必要数',
    recommendedCount: '推奨数',
    highPrecisionDelivery: '高精度配送向け',
    projectProgress: 'プロジェクト進捗',
    approvalFlow: '承認フロー',
    draftStep: '下書き作成',
    carrierReviewStep: '配送会社レビュー',
    municipalReviewStep: '自治体レビュー',
    residentReviewStep: '住民・事業者確認',
    publicReleaseStep: '正式公開',
    apiDistributionStep: 'API配信',
    satellitePhoto: '衛星写真',
    distanceFromDepot: '配送拠点からの距離',
    noIssue: '問題なし',
    review: '要確認',
    valid: '有効',
    created: '作成中',
  },
} as const;

function studioCopyFor(language: string) {
  return STUDIO_COPY[normalizeAppLanguage(language)];
}

function statusTone(value: string | boolean) {
  if (value === true || ['publishable', 'official', 'supplementary', 'pilot', 'C', 'excellent', 'good'].includes(String(value))) return 'good';
  if (value === false || ['blocked', 'simulation', 'A'].includes(String(value))) return 'bad';
  return 'warn';
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

function formatDecimal(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(value);
}

function copySafeExport(workspace: PostalZoneDesignerWorkspace) {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return;
  navigator.clipboard.writeText(JSON.stringify(workspace.exportSafe, null, 2)).catch(() => undefined);
}

function copyCandidatePostalCode(workspace: PostalZoneDesignerWorkspace) {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return;
  const code = workspace.localityProposal.code || workspace.formatSuggestion.exampleCode;
  navigator.clipboard.writeText(code).catch(() => undefined);
}

function creationDecision(workspace: PostalZoneDesignerWorkspace, language: string) {
  const t = copyFor(language);
  if (!workspace.localityProposal.ok || !workspace.formatSuggestion.canCreateNewCode) {
    return {
      label: t.blockedDecision,
      tone: 'bad' as const,
      nextAction: proposalMessage(workspace, language),
    };
  }
  if (workspace.stage === 'official') {
    return {
      label: t.officialDecision,
      tone: 'good' as const,
      nextAction: language.startsWith('ja')
        ? '公式化前に公開範囲、移行写像、監査ログを最終確認してください。'
        : 'Confirm public scope, transition mapping, and audit logs before publication.',
    };
  }
  if (workspace.stage === 'pilot' || workspace.stage === 'supplementary') {
    return {
      label: t.pilotDecision,
      tone: 'good' as const,
      nextAction: language.startsWith('ja')
        ? '配送業者・自治体レビューに回し、限定地域で試験運用してください。'
        : 'Route this to carrier and local review, then pilot it in a limited area.',
    };
  }
  return {
    label: t.draftOnlyDecision,
    tone: 'warn' as const,
    nextAction: language.startsWith('ja')
      ? '下書きを作成できます。公開前に承認、データ品質、匿名性を満たしてください。'
      : 'You can create a draft. Approval, data trust, and anonymity gates are required before publication.',
  };
}

function exampleCandidateLabel(
  decision: PostalZoneDesignerWorkspace['exampleGeneration']['candidates'][number]['decision'],
  language: string,
) {
  const t = copyFor(language);
  if (decision === 'draft-primary') return t.exampleDraft;
  if (decision === 'supplemental-draft') return t.exampleSupplemental;
  return t.exampleBlocked;
}

function exampleCandidateTone(
  decision: PostalZoneDesignerWorkspace['exampleGeneration']['candidates'][number]['decision'],
) {
  if (decision === 'blocked') return 'bad' as const;
  if (decision === 'supplemental-draft') return 'warn' as const;
  return 'good' as const;
}

function readyLabel(value: boolean, language: string) {
  const normalized = normalizeAppLanguage(language);
  return value ? (normalized === 'ja' ? '準備OK' : 'Ready') : (normalized === 'ja' ? '要確認' : 'Review');
}

function friendlyQualityLabel(id: string, language: string) {
  const normalized = normalizeAppLanguage(language);
  const ja: Record<string, string> = {
    source_coverage: 'データのそろい具合',
    governance: '承認の準備',
    privacy: '公開安全性',
    route_fit: '配送しやすさ',
    readability: '読みやすさ',
    compatibility: '既存制度との相性',
    data_trust: 'データ信頼度',
    transition: '変更時の追跡',
  };
  const en: Record<string, string> = {
    source_coverage: 'Data coverage',
    governance: 'Approval readiness',
    privacy: 'Public safety',
    route_fit: 'Delivery fit',
    readability: 'Readable code',
    compatibility: 'Existing-system fit',
    data_trust: 'Data trust',
    transition: 'Change tracking',
  };
  const table = normalized === 'ja' ? ja : en;
  return table[id] || (normalized === 'ja' ? '確認項目' : 'Readiness item');
}

function friendlyQualityStatus(status: string, language: string) {
  const normalized = normalizeAppLanguage(language);
  if (status === 'pass') return normalized === 'ja' ? '良好' : 'Good';
  if (status === 'review') return normalized === 'ja' ? '確認' : 'Review';
  return normalized === 'ja' ? '停止' : 'Blocked';
}

function proposalMessage(workspace: PostalZoneDesignerWorkspace, language: string) {
  const normalized = normalizeAppLanguage(language);
  if (workspace.localityProposal.ok) {
    return normalized === 'ja'
      ? 'この範囲で下書き郵便番号を作れます。公開前に自治体・配送業者の確認が必要です。'
      : 'A draft postal code can be created for this scope. Local and carrier review is still required before publication.';
  }
  if (workspace.localityProposal.blockedReason === 'mature-postal-country-new-code-replacement-blocked') {
    return normalized === 'ja'
      ? 'この国では既存の公式郵便番号を優先します。AGIDは補助情報として使います。'
      : 'Existing official postal codes stay primary in this country. AGID is used as supplemental metadata.';
  }
  if (workspace.localityProposal.blockedReason === 'postal-zone-cannot-cross-municipalities') {
    return normalized === 'ja'
      ? '市町村をまたいだ1つの郵便番号は作れません。範囲を1つの市町村内にしてください。'
      : 'One postal code cannot span multiple municipalities. Keep the scope inside one municipality.';
  }
  return normalized === 'ja'
    ? '範囲を選ぶと候補郵便番号を提案します。'
    : 'Choose an area to get a candidate postal code.';
}

function friendlyTheoremLabel(key: string, language: string) {
  const normalized = normalizeAppLanguage(language);
  const ja: Record<string, string> = {
    selectedMunicipality: '市町村が選択されている',
    withinSingleMunicipality: '1つの郵便番号が1市町村内に収まる',
    townBelongsToMunicipality: '町・地区が選択市町村に属する',
    chomeBelongsToTown: '丁目・区画が選択町区に属する',
    classAllowsCreation: '国分類上、新規AGID郵便区画を作れる',
  };
  const en: Record<string, string> = {
    selectedMunicipality: 'Municipality is selected',
    withinSingleMunicipality: 'One postal code stays inside one municipality',
    townBelongsToMunicipality: 'Town belongs to selected municipality',
    chomeBelongsToTown: 'Block belongs to selected town',
    classAllowsCreation: 'Country class allows AGID postal drafting',
  };
  return (normalized === 'ja' ? ja : en)[key] || key;
}

function Field(props: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1 text-xs font-bold text-slate-500">
      <span>{props.label}</span>
      <input
        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        min={props.min}
        max={props.max}
        step={props.step}
        type="number"
        value={props.value}
        onChange={event => props.onChange(Number(event.target.value))}
      />
    </label>
  );
}

function Panel(props: { title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-2xl border border-slate-200 bg-white p-4 shadow-sm', props.className)}>
      <div className="mb-3 flex items-center gap-2">
        {props.icon}
        <h2 className="text-sm font-black text-slate-950">{props.title}</h2>
      </div>
      {props.children}
    </section>
  );
}

function Pill(props: { label: string; tone?: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const tone = props.tone || 'neutral';
  return (
    <span className={cn(
      'inline-flex min-h-7 items-center rounded-full border px-2.5 text-[11px] font-black uppercase tracking-[0.08em]',
      tone === 'good' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
      tone === 'warn' && 'border-amber-200 bg-amber-50 text-amber-700',
      tone === 'bad' && 'border-rose-200 bg-rose-50 text-rose-700',
      tone === 'neutral' && 'border-slate-200 bg-slate-50 text-slate-600',
    )}>
      {props.label}
    </span>
  );
}

function Progress(props: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(props.value * 100)));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={cn(
        'h-full rounded-full',
        pct >= 70 ? 'bg-emerald-500' : pct >= 45 ? 'bg-amber-500' : 'bg-rose-500',
      )} style={{ width: `${pct}%` }} />
    </div>
  );
}

function BoundaryRow({ boundary }: { boundary: PostalZoneDesignerSafetyBoundary }) {
  return (
    <li className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
      {boundary.satisfied
        ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
        : <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />}
      <div>
        <p className="text-xs font-black text-slate-800">{boundary.id}</p>
        <p className="text-xs font-semibold leading-5 text-slate-500">{boundary.label}</p>
      </div>
    </li>
  );
}

type PostalForgeMapZone = {
  id: string;
  name: string;
  codePart: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

function buildPostalForgeMapZones(workspace: PostalZoneDesignerWorkspace): PostalForgeMapZone[] {
  const choices = workspace.localityChoices.slice(0, 6);
  const archipelagoLayout = [
    { left: 7, top: 12, width: 28, height: 25 },
    { left: 41, top: 15, width: 23, height: 21 },
    { left: 68, top: 31, width: 22, height: 25 },
    { left: 17, top: 50, width: 29, height: 24 },
    { left: 52, top: 59, width: 34, height: 23 },
    { left: 8, top: 77, width: 23, height: 15 },
  ];
  return choices.map((choice, index) => {
    if (workspace.country.terrain === 'archipelago') {
      return { ...archipelagoLayout[index], id: choice.id, name: choice.name, codePart: choice.codePart };
    }
    const columns = choices.length <= 4 ? 2 : 3;
    const gap = 4;
    const width = (86 - gap * (columns - 1)) / columns;
    const height = choices.length <= 3 ? 34 : 27;
    const row = Math.floor(index / columns);
    const column = index % columns;
    return {
      id: choice.id,
      name: choice.name,
      codePart: choice.codePart,
      left: 7 + column * (width + gap),
      top: 15 + row * (height + gap),
      width,
      height,
    };
  });
}

const mapZoneTones = [
  'border-violet-200 bg-violet-400/42 text-violet-950',
  'border-emerald-200 bg-emerald-400/42 text-emerald-950',
  'border-amber-200 bg-amber-300/48 text-amber-950',
  'border-sky-200 bg-sky-400/42 text-sky-950',
  'border-rose-200 bg-rose-300/45 text-rose-950',
  'border-cyan-200 bg-cyan-300/42 text-cyan-950',
];

function PostalForgeMapCanvas(props: {
  workspace: PostalZoneDesignerWorkspace;
  language: string;
  simulateCrossMunicipality: boolean;
  crossMunicipalityId: string;
  onSelectMunicipality: (id: string) => void;
  className?: string;
  mapClassName?: string;
}) {
  const t = copyFor(props.language);
  const studio = studioCopyFor(props.language);
  const zones = React.useMemo(() => buildPostalForgeMapZones(props.workspace), [props.workspace]);
  const selectedId = props.workspace.localityProposal.selection.municipalityId || zones[0]?.id || '';
  const selectedZone = zones.find(zone => zone.id === selectedId) || zones[0];
  const boundaryOk = props.workspace.localityProposal.theoremChecks.withinSingleMunicipality;
  const selectedIndex = Math.max(0, zones.findIndex(zone => zone.id === selectedId));
  const routeDistanceKm = props.workspace.country.terrain === 'archipelago'
    ? 10
    : props.workspace.country.terrain === 'desert'
      ? 14
      : 5;

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-white', props.className)}>
      <div className="flex flex-col gap-3 border-b border-white/10 p-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-200">{t.mapBuilder}</p>
          <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-200">{t.mapBuilderHint}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Pill label={boundaryOk ? t.mapBoundaryOk : t.mapBoundaryBlocked} tone={boundaryOk ? 'good' : 'bad'} />
          <Pill label={t.mapClickToSelect} />
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
        <div
          className={cn('relative min-h-[330px] overflow-hidden bg-[#082033]', props.mapClassName)}
          aria-label={t.mapBuilder}
          style={{
            backgroundImage:
              'radial-gradient(circle at 34% 22%, rgba(72,209,204,0.45), transparent 18%), radial-gradient(circle at 60% 52%, rgba(6,95,70,0.38), transparent 29%), linear-gradient(145deg, #073047 0%, #0b3d55 42%, #061827 100%)',
          }}
        >
          <div className="absolute inset-0 opacity-40" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }} />
          <div
            className="absolute left-[12%] top-[8%] h-[78%] w-[76%] rounded-[44%_56%_48%_52%] border border-white/35 bg-[radial-gradient(circle_at_28%_22%,rgba(244,225,173,0.9),transparent_16%),radial-gradient(circle_at_62%_48%,rgba(78,124,67,0.88),transparent_35%),linear-gradient(135deg,rgba(169,132,91,0.86),rgba(67,118,79,0.88)_45%,rgba(216,184,128,0.82))] shadow-2xl shadow-black/40"
            style={{ clipPath: 'polygon(8% 19%, 28% 7%, 59% 10%, 82% 22%, 94% 47%, 88% 72%, 66% 90%, 34% 86%, 12% 68%, 4% 42%)' }}
          />
          <div className="absolute left-[18%] top-[19%] h-[58%] w-[64%] rounded-full border-2 border-dashed border-yellow-200/65" />
          <div className="absolute left-[24%] top-[35%] h-[30%] w-[50%] rotate-[-9deg] rounded-full border border-yellow-100/55" />
          <div className="absolute bottom-[18%] left-[16%] right-[12%] h-1 rotate-[-14deg] rounded-full border-t-2 border-dashed border-yellow-200/70" />
          <div className="absolute bottom-[33%] left-[23%] right-[18%] h-1 rotate-[16deg] rounded-full border-t-2 border-dashed border-yellow-200/65" />

          <div className="absolute left-4 top-4 z-30 grid gap-2">
            {['+', '-', '⤢', '▣', '⌖', '✎'].map(label => (
              <button
                key={label}
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/30 bg-white/95 text-sm font-black text-slate-900 shadow-sm"
                aria-label={`map-control-${label}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="absolute right-4 top-4 z-20 rounded-xl border border-white/30 bg-white/90 px-3 py-2 text-xs font-black text-slate-800 shadow-sm">
            {studio.satellitePhoto}
          </div>

          {zones.map((zone, index) => {
            const selected = zone.id === selectedId;
            const cross = props.simulateCrossMunicipality && zone.id === props.crossMunicipalityId;
            return (
              <button
                key={zone.id}
                type="button"
                className={cn(
                  'absolute z-20 rounded-[24px] border-2 p-3 text-left shadow-sm backdrop-blur-[1px] transition focus:outline-none focus:ring-4 focus:ring-blue-300/40',
                  mapZoneTones[index % mapZoneTones.length],
                  selected && 'border-white bg-blue-600/78 text-white shadow-xl shadow-blue-950/40',
                  cross && !selected && 'border-amber-400 bg-amber-300/90 text-amber-950',
                  !selected && !cross && 'hover:border-white hover:bg-white/70',
                )}
                style={{
                  left: `${zone.left}%`,
                  top: `${zone.top}%`,
                  width: `${zone.width}%`,
                  height: `${zone.height}%`,
                }}
                onClick={() => props.onSelectMunicipality(zone.id)}
              >
                <span className="block font-mono text-sm font-black">{props.workspace.country.code}-{zone.codePart}</span>
                <span className="mt-1 block truncate text-xs font-black">{zone.name}</span>
                <span className="mt-1 block text-[11px] font-bold opacity-80">
                  {formatNumber(Math.max(120, Math.round(props.workspace.country.population / Math.max(1, zones.length) * (0.72 + index * 0.08))))} {t.population}
                </span>
                {selected && (
                  <span className="mt-2 block rounded-lg border border-white/25 bg-white/15 px-2 py-1 text-[10px] font-black">
                    {studio.deliveryRouteCount}: {Math.max(1, index + 1)}
                  </span>
                )}
                {cross && <span className="mt-2 block text-[10px] font-black uppercase">{t.boundaryFail}</span>}
              </button>
            );
          })}

          {selectedZone && (
            <div
              className="pointer-events-none absolute z-30 rounded-[22px] border-2 border-pink-300/90"
              style={{
                left: `${Math.max(3, selectedZone.left - 1.5)}%`,
                top: `${Math.max(3, selectedZone.top - 1.5)}%`,
                width: `${Math.min(94, selectedZone.width + 3)}%`,
                height: `${Math.min(92, selectedZone.height + 3)}%`,
              }}
            />
          )}

          <div className="absolute bottom-4 left-4 z-30 w-[210px] rounded-2xl border border-white/25 bg-slate-950/78 p-3 text-white shadow-xl backdrop-blur">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-300">{studio.populationDensityLayer}</p>
            <div className="mt-2 grid gap-1.5 text-[11px] font-bold">
              {['0 - 25', '25 - 100', '100 - 500', '500 - 1,000', '1,000+'].map((label, index) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={cn('h-3 w-3 rounded-sm', ['bg-sky-400', 'bg-emerald-400', 'bg-yellow-300', 'bg-orange-400', 'bg-rose-400'][index])} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <label className="mt-3 grid gap-2 text-[11px] font-bold text-slate-200">
              <span className="flex items-center justify-between">
                <span>{studio.distanceFromDepot}</span>
                <span>{routeDistanceKm}km</span>
              </span>
              <input type="range" min="1" max="20" readOnly value={routeDistanceKm} />
            </label>
          </div>

          <div className="absolute bottom-4 right-4 z-30 h-24 w-36 overflow-hidden rounded-xl border border-white/40 bg-white/20 p-1 shadow-xl backdrop-blur">
            <div className="relative h-full rounded-lg bg-[radial-gradient(circle_at_50%_45%,rgba(125,211,252,0.35),transparent_25%),linear-gradient(135deg,rgba(22,101,52,0.75),rgba(245,158,11,0.35))]">
              <span
                className="absolute h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow"
                style={{ left: `${Math.min(82, Math.max(8, 16 + selectedIndex * 12))}%`, top: `${Math.min(74, Math.max(10, 20 + selectedIndex * 8))}%` }}
              />
            </div>
          </div>
        </div>

        <aside className="border-t border-white/10 bg-slate-900 p-4 lg:border-l lg:border-t-0">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-200">{t.selectedMapZone}</p>
          <p className="mt-2 text-lg font-black leading-6 text-white">{selectedZone?.name || props.workspace.country.name}</p>
          <p className="mt-2 font-mono text-sm font-black text-blue-100">
            {props.workspace.localityProposal.code || props.workspace.formatSuggestion.exampleCode}
          </p>
          <div className="mt-4 grid gap-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] font-black uppercase text-slate-400">{t.mapCoordinate}</p>
              <p className="mt-1 font-mono text-xs font-black text-slate-100">
                {props.workspace.country.lat.toFixed(3)}, {props.workspace.country.lng.toFixed(3)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] font-black uppercase text-slate-400">{t.boundaryCheck}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-200">
                {boundaryOk ? t.sameMunicipalityOnly : props.workspace.localityProposal.blockedReason || t.boundaryFail}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] font-black uppercase text-slate-400">{t.rawAddressFree}</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-200">
                {props.workspace.exportSafe.privateLocationTextIncluded === false
                  ? (normalizeAppLanguage(props.language) === 'ja' ? '地図編集は区画IDと候補コードだけを使います。' : 'Map drafting uses zone IDs and candidate codes only.')
                  : t.warnings}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function PostalZoneDesignerScreen() {
  const [language, setLanguage] = React.useState(readInitialLanguage);
  const [countryCode, setCountryCode] = React.useState('FJ');
  const selectedCountry = countries.find(country => country.code === countryCode) || countries[0];
  const [templateId, setTemplateId] = React.useState(defaultTemplateForCountry(selectedCountry));
  const [population, setPopulation] = React.useState(selectedCountry.population);
  const [areaKm2, setAreaKm2] = React.useState(selectedCountry.areaKm2);
  const [municipalityCount, setMunicipalityCount] = React.useState(selectedCountry.municipalityCount);
  const [addressCount, setAddressCount] = React.useState(Math.round(selectedCountry.population / 4));
  const [ambiguityScore, setAmbiguityScore] = React.useState(0.74);
  const [routeRadiusMinutes, setRouteRadiusMinutes] = React.useState(180);
  const [governanceScore, setGovernanceScore] = React.useState(0.25);
  const [dataQuality, setDataQuality] = React.useState(0.58);
  const [privacyFloor, setPrivacyFloor] = React.useState(42);
  const [sensitive, setSensitive] = React.useState(false);
  const [highRisk, setHighRisk] = React.useState(false);
  const [selectedMunicipalityId, setSelectedMunicipalityId] = React.useState('');
  const [selectedTownId, setSelectedTownId] = React.useState('');
  const [selectedChomeId, setSelectedChomeId] = React.useState('');
  const [simulateCrossMunicipality, setSimulateCrossMunicipality] = React.useState(false);
  const [draftHistory, setDraftHistory] = React.useState<Array<{
    id: string;
    code: string;
    country: string;
    scope: string;
    stage: string;
    createdAt: string;
  }>>([]);
  const t = React.useMemo(() => copyFor(language), [language]);
  const countryLocalityChoices = React.useMemo(
    () => buildPostalZoneLocalityChoices(selectedCountry),
    [selectedCountry],
  );
  const effectiveMunicipalityId = selectedMunicipalityId || countryLocalityChoices[0]?.id || '';
  const crossMunicipalityId = countryLocalityChoices.find(choice => choice.id !== effectiveMunicipalityId)?.id || '';

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, normalizeAppLanguage(language));
      document.documentElement.lang = normalizeAppLanguage(language) === 'ja' ? 'ja-JP' : 'en';
      document.documentElement.dir = getLanguageDirection(language);
    }
  }, [language]);

  React.useEffect(() => {
    const country = countries.find(item => item.code === countryCode) || countries[0];
    setPopulation(country.population);
    setAreaKm2(country.areaKm2);
    setMunicipalityCount(country.municipalityCount);
    setAddressCount(Math.round(country.population / 4));
    setRouteRadiusMinutes(country.terrain === 'archipelago' ? 180 : country.terrain === 'desert' ? 240 : 55);
    setTemplateId(defaultTemplateForCountry(country));
    setSelectedMunicipalityId('');
    setSelectedTownId('');
    setSelectedChomeId('');
    setSimulateCrossMunicipality(false);
  }, [countryCode]);

  const workspace = React.useMemo(() => buildPostalZoneDesignerWorkspace({
    countryCode,
    templateId: templateId as never,
    selectedMunicipalityId: selectedMunicipalityId || undefined,
    selectedTownId: selectedTownId || undefined,
    selectedChomeId: selectedChomeId || undefined,
    extraMunicipalityIds: simulateCrossMunicipality && crossMunicipalityId ? [crossMunicipalityId] : undefined,
    population,
    areaKm2,
    municipalityCount,
    addressCount,
    ambiguityScore,
    routeRadiusMinutes,
    connectedComponentCount: selectedCountry.terrain === 'archipelago' ? 4 : 1,
    timeCoverCount: selectedCountry.terrain === 'desert' || selectedCountry.terrain === 'archipelago' ? 3 : 1,
    governance: {
      government: governanceScore,
      municipality: governanceScore,
      carrier: Math.max(governanceScore, 0.45),
      platform: 0.8,
      threshold: 0.7,
    },
    dataQuality: {
      address: dataQuality,
      road: dataQuality,
      admin: Math.min(1, dataQuality + 0.1),
      population: dataQuality,
      boundary: Math.min(1, dataQuality + 0.12),
      threshold: 0.7,
    },
    privacy: {
      addressEntitiesPerArea: privacyFloor,
      populationPerArea: Math.max(privacyFloor * 3, 50),
      minimumAddressEntities: 10,
      minimumPopulation: 50,
      sensitive,
      highRisk,
    },
    sourceKind: 'gis-import',
  }), [
    addressCount,
    ambiguityScore,
    areaKm2,
    countryCode,
    crossMunicipalityId,
    dataQuality,
    governanceScore,
    highRisk,
    municipalityCount,
    population,
    privacyFloor,
    routeRadiusMinutes,
    selectedChomeId,
    selectedMunicipalityId,
    selectedCountry.terrain,
    selectedTownId,
    simulateCrossMunicipality,
    sensitive,
    templateId,
  ]);

  const safeExportText = React.useMemo(() => JSON.stringify(workspace.exportSafe, null, 2), [workspace.exportSafe]);
  const selectedMunicipality = workspace.localityChoices.find(choice => choice.id === workspace.localityProposal.selection.municipalityId)
    || workspace.localityChoices[0];
  const townOptions = selectedMunicipality?.towns || [];
  const selectedTown = townOptions.find(choice => choice.id === workspace.localityProposal.selection.townId)
    || townOptions[0];
  const chomeOptions = selectedTown?.chomes || [];
  const selectedChome = chomeOptions.find(choice => choice.id === workspace.localityProposal.selection.chomeId)
    || chomeOptions[0];
  const decision = creationDecision(workspace, language);
  const candidatePostalCode = workspace.localityProposal.code || workspace.formatSuggestion.exampleCode;
  const selectedScopeText = workspace.localityProposal.displayPath.join(' / ') || `${workspace.country.code} / ${workspace.country.name}`;
  const canCreateDraft = workspace.localityProposal.ok && workspace.formatSuggestion.canCreateNewCode;
  const boundaryOk = workspace.localityProposal.theoremChecks.withinSingleMunicipality;
  const postalForgePlan = React.useMemo(() => buildAgidPostalForgeProgramPlan({
    countryCodes: [workspace.country.code],
    maxCountriesPerRun: 1,
  }), [workspace.country.code]);
  const countryPackRecord = postalForgePlan.countryRepositories[0];
  const qualityGates = countryPackRecord?.release.gates || [];
  const zoneCount = Math.max(1, workspace.minimumCodeCount.operationalLowerBound);
  const splitMergeStats = React.useMemo(() => {
    const splitZones = zoneCount + 1;
    const mergeZones = Math.max(1, zoneCount - 1);
    const avgArea = areaKm2 / zoneCount;
    const avgPopulation = population / zoneCount;
    return {
      currentZones: zoneCount,
      splitZones,
      mergeZones,
      avgArea,
      minArea: avgArea * 0.64,
      maxArea: avgArea * 1.36,
      avgPopulation,
      splitAvgArea: areaKm2 / splitZones,
      mergeAvgArea: areaKm2 / mergeZones,
      collisionRisk: workspace.designPlan.existence.mathematicallyConstructible
        ? (workspace.localityProposal.theoremChecks.withinSingleMunicipality ? 0.04 : 0.42)
        : 0.76,
    };
  }, [
    areaKm2,
    population,
    workspace.designPlan.existence.mathematicallyConstructible,
    workspace.localityProposal.theoremChecks.withinSingleMunicipality,
    zoneCount,
  ]);
  const codePreviewRows = React.useMemo(() => [
    {
      label: t.domesticDisplay,
      value: candidatePostalCode,
      helper: selectedScopeText,
    },
    {
      label: t.internationalDisplay,
      value: `${workspace.country.code} ${candidatePostalCode}`,
      helper: `${workspace.country.name} / ${workspace.formatSuggestion.label}`,
    },
    {
      label: t.countryPackDisplay,
      value: `${countryPackRecord?.packageName || '@agid/country-pack'}:${candidatePostalCode}`,
      helper: countryPackRecord?.lazyLoad.countryPackPath || 'data/postal_country_packs/{country}/agid-postal-country-pack.json',
    },
  ], [
    candidatePostalCode,
    countryPackRecord?.lazyLoad.countryPackPath,
    countryPackRecord?.packageName,
    selectedScopeText,
    t.countryPackDisplay,
    t.domesticDisplay,
    t.internationalDisplay,
    workspace.country.code,
    workspace.country.name,
    workspace.formatSuggestion.label,
  ]);
  const studio = React.useMemo(() => studioCopyFor(language), [language]);
  const postalAreaRows = React.useMemo(() => {
    const baseAddressCount = Math.max(1, Math.round(addressCount / Math.max(1, workspace.localityChoices.length)));
    const basePopulation = Math.max(1, Math.round(population / Math.max(1, workspace.localityChoices.length)));
    return workspace.localityChoices.slice(0, 5).map((choice, index) => ({
      code: `${workspace.country.code}-${choice.codePart}`,
      name: choice.name,
      population: Math.round(basePopulation * (0.72 + index * 0.12)),
      households: Math.round(basePopulation * (0.72 + index * 0.12) / 2.6),
      addresses: Math.round(baseAddressCount * (0.68 + index * 0.1)),
      area: Math.max(0.8, areaKm2 / Math.max(4, workspace.localityChoices.length * 1.8) * (0.72 + index * 0.09)),
      density: index % 3 === 0 ? (normalizeAppLanguage(language) === 'ja' ? '中' : 'medium') : index % 3 === 1 ? (normalizeAppLanguage(language) === 'ja' ? '低' : 'low') : (normalizeAppLanguage(language) === 'ja' ? '高' : 'high'),
      status: studio.created,
    }));
  }, [addressCount, areaKm2, language, population, studio.created, workspace.country.code, workspace.localityChoices]);
  const selectedAreaRow = postalAreaRows.find(row => selectedMunicipality?.codePart && row.code.endsWith(selectedMunicipality.codePart))
    || postalAreaRows[0];
  const progressPercent = Math.round((
    Number(workspace.localityProposal.ok)
    + Number(qualityGates.filter(gate => gate.passed).length / Math.max(1, qualityGates.length))
    + Number(dataQuality >= 0.7)
    + Number(governanceScore >= 0.7)
    + Number(!sensitive && !highRisk)
  ) / 5 * 100);
  const approvalSteps = [
    { label: studio.draftStep, done: draftHistory.length > 0 || workspace.localityProposal.ok },
    { label: studio.carrierReviewStep, done: dataQuality >= 0.7 },
    { label: studio.municipalReviewStep, done: governanceScore >= 0.7 },
    { label: studio.residentReviewStep, done: !sensitive && !highRisk },
    { label: studio.publicReleaseStep, done: workspace.stage === 'pilot' || workspace.stage === 'official' },
    { label: studio.apiDistributionStep, done: countryPackRecord?.release.canPublish || false },
  ];

  const createDraft = React.useCallback(() => {
    if (!canCreateDraft) return;
    const createdAt = new Date().toISOString();
    setDraftHistory(history => [
      {
        id: `${workspace.country.code}-${candidatePostalCode}-${createdAt}`,
        code: candidatePostalCode,
        country: workspace.country.name,
        scope: selectedScopeText,
        stage: workspace.stage,
        createdAt,
      },
      ...history,
    ].slice(0, 5));
  }, [canCreateDraft, candidatePostalCode, selectedScopeText, workspace.country.code, workspace.country.name, workspace.stage]);

  const loadFijiExample = React.useCallback(() => {
    const fiji = countries.find(country => country.code === 'FJ');
    if (!fiji) return;
    setCountryCode('FJ');
    setPopulation(fiji.population);
    setAreaKm2(fiji.areaKm2);
    setMunicipalityCount(fiji.municipalityCount);
    setAddressCount(Math.round(fiji.population / 4));
    setAmbiguityScore(0.74);
    setRouteRadiusMinutes(180);
    setGovernanceScore(0.25);
    setDataQuality(0.58);
    setPrivacyFloor(42);
    setSensitive(false);
    setHighRisk(false);
    setTemplateId(defaultTemplateForCountry(fiji));
    setSelectedMunicipalityId('');
    setSelectedTownId('');
    setSelectedChomeId('');
    setSimulateCrossMunicipality(false);
  }, []);

  return (
    <main className="agid-page-scroll bg-[#eef4f8] text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 lg:px-6">
        <header className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <a
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              href="/"
              aria-label={t.returnToMap}
            >
              <ArrowLeft className="h-5 w-5" />
            </a>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-700">AGID Labs</p>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">{workspace.systemName}</h1>
              <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                {workspace.aiName} - {t.subtitle}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="grid gap-1 text-xs font-bold text-slate-500">
              <span>{t.language}</span>
              <select
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-950"
                value={normalizeAppLanguage(language)}
                onChange={event => setLanguage(event.target.value)}
              >
                {APP_LANGUAGES.map(option => (
                  <option key={option.code} value={option.code}>{option.name}</option>
                ))}
              </select>
            </label>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-950 px-3 text-xs font-black text-white hover:bg-slate-800"
              type="button"
              onClick={() => copySafeExport(workspace)}
            >
              <Copy className="h-4 w-4" />
              {t.copyExport}
            </button>
          </div>
        </header>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-900">
          <div className="flex gap-2">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{t.notOfficial}</p>
          </div>
        </section>

        <section
          aria-label={t.mapFirstWorkspace}
          className="grid gap-4 rounded-2xl border border-blue-100 bg-white p-3 shadow-sm xl:grid-cols-[260px_minmax(0,1fr)_320px]"
        >
          <aside className="grid content-start gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black tracking-tight">{studio.studioTitle}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-300">{studio.studioSubtitle}</p>
              </div>
              <Layers3 className="h-5 w-5 text-blue-300" />
            </div>

            <div className="grid gap-3">
              <label className="grid gap-1 text-xs font-bold text-slate-300">
                <span>{t.country}</span>
                <select
                  className="h-10 rounded-lg border border-white/10 bg-white/10 px-3 text-sm font-black text-white outline-none"
                  value={countryCode}
                  onChange={event => setCountryCode(event.target.value)}
                >
                  {countries.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.code} - {country.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-bold text-slate-300">
                <span>{t.municipality}</span>
                <select
                  className="h-10 rounded-lg border border-white/10 bg-white/10 px-3 text-sm font-black text-white outline-none"
                  value={selectedMunicipality?.id || ''}
                  onChange={event => {
                    setSelectedMunicipalityId(event.target.value);
                    setSelectedTownId('');
                    setSelectedChomeId('');
                  }}
                >
                  {workspace.localityChoices.map(choice => (
                    <option key={choice.id} value={choice.id}>{choice.name}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-bold text-slate-300">
                <span>{t.town}</span>
                <select
                  className="h-10 rounded-lg border border-white/10 bg-white/10 px-3 text-sm font-black text-white outline-none"
                  value={selectedTown?.id || ''}
                  onChange={event => {
                    setSelectedTownId(event.target.value);
                    setSelectedChomeId('');
                  }}
                >
                  {townOptions.map(choice => (
                    <option key={choice.id} value={choice.id}>{choice.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="mb-3 flex items-center gap-2">
                <Route className="h-4 w-4 text-blue-300" />
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-300">{studio.generationMode}</p>
              </div>
              <div className="grid gap-2 text-sm font-bold text-slate-200">
                {[studio.byIsland, studio.byCity, studio.byTown, studio.byRoad, studio.byRoute, studio.byVirtualTown].map((label, index) => (
                  <label key={label} className="flex items-center gap-2">
                    <input readOnly checked={index === 0} type="radio" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-slate-300">{studio.digitCount}</p>
              <div className="grid grid-cols-4 gap-2">
                {['4', '5', '6', 'A-Z'].map((label, index) => (
                  <button
                    key={label}
                    className={cn(
                      'h-9 rounded-lg border text-xs font-black',
                      index === 1 ? 'border-blue-400 bg-blue-600 text-white' : 'border-white/10 bg-white/10 text-slate-200',
                    )}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2 border-t border-white/10 pt-4">
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 text-xs font-black text-white" type="button">
                <Upload className="h-4 w-4" />
                {studio.loadAddressData}
              </button>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 text-xs font-black text-white" type="button">
                <Upload className="h-4 w-4" />
                {studio.loadCarrierData}
              </button>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.12em] text-slate-300">{studio.displayLayers}</p>
              <div className="grid gap-2 text-sm font-bold text-slate-200">
                {[studio.boundaryLayer, studio.populationDensityLayer, studio.deliveryDepotLayer, studio.roadNetworkLayer, studio.islandTownLayer, studio.terrainLayer].map((label, index) => (
                  <label key={label} className="flex items-center gap-2">
                    <input readOnly checked={index < 5} type="checkbox" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button className="mt-2 inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-950/30" type="button">
              {studio.autoSimulation}
            </button>
          </aside>

          <div className="min-w-0">
            <div className="mb-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
              <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-500">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder={studio.searchPlaceholder}
                  type="search"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: studio.selectTool, icon: <MousePointer2 className="h-4 w-4" />, active: true },
                  { label: studio.splitTool, icon: <Scissors className="h-4 w-4" /> },
                  { label: studio.mergeTool, icon: <Merge className="h-4 w-4" /> },
                  { label: studio.deleteTool, icon: <Trash2 className="h-4 w-4" /> },
                  { label: studio.addVirtualTown, icon: <Plus className="h-4 w-4" /> },
                ].map(action => (
                  <button
                    key={action.label}
                    className={cn(
                      'inline-flex h-11 items-center gap-2 rounded-lg border px-3 text-xs font-black shadow-sm',
                      action.active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700',
                    )}
                    type="button"
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
            <PostalForgeMapCanvas
              workspace={workspace}
              language={language}
              simulateCrossMunicipality={simulateCrossMunicipality}
              crossMunicipalityId={crossMunicipalityId}
              className="h-full"
              mapClassName="min-h-[430px] md:min-h-[520px] xl:min-h-[620px]"
              onSelectMunicipality={(municipalityId) => {
                setSelectedMunicipalityId(municipalityId);
                setSelectedTownId('');
                setSelectedChomeId('');
              }}
            />
          </div>

          <aside className="grid content-start gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-black text-slate-950">{studio.selectedAreaInfo}</p>
              <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xl font-black text-blue-800">{selectedAreaRow?.code || candidatePostalCode}</p>
                    <p className="mt-1 text-sm font-black text-slate-950">{selectedAreaRow?.name || selectedScopeText}</p>
                  </div>
                  <span className="h-3 w-3 rounded bg-violet-400" />
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {[
                  [t.population, formatNumber(selectedAreaRow?.population || population)],
                  [studio.households, formatNumber(selectedAreaRow?.households || Math.round(population / 3))],
                  [studio.addressRows, formatNumber(selectedAreaRow?.addresses || addressCount)],
                  [t.area, `${formatDecimal(selectedAreaRow?.area || areaKm2)} km2`],
                  [studio.deliveryRouteCount, String(Math.max(1, Math.round(routeRadiusMinutes / 60)))],
                  [studio.deliveryDensity, selectedAreaRow?.density || studio.review],
                  [studio.regionType, selectedCountry.terrain],
                  [studio.timezone, selectedCountry.lng >= 0 ? 'UTC+' : 'UTC-'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-bold text-slate-500">{label}</span>
                    <span className="text-right font-black text-slate-950">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-black text-slate-950">{studio.verificationChecks}</p>
              <div className="mt-3 grid gap-2">
                {[
                  [studio.overlapCheck, studio.noIssue, true],
                  [studio.neighborConflict, boundaryOk ? studio.noIssue : studio.review, boundaryOk],
                  [studio.adminConsistency, workspace.localityProposal.ok ? studio.valid : studio.review, workspace.localityProposal.ok],
                  [studio.addressFormat, workspace.formatSuggestion.formatPreview, true],
                  [studio.deliveryCoverage, `${Math.min(98, Math.max(62, Math.round(dataQuality * 100)))}%`, dataQuality >= 0.7],
                ].map(([label, value, ok]) => (
                  <div key={label as string} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <span className="text-xs font-black text-slate-700">{label}</span>
                    <Pill label={String(value)} tone={ok ? 'good' : 'warn'} />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-black text-slate-950">{studio.multilingualPreview}</p>
                <Pill label={normalizeAppLanguage(language) === 'ja' ? '日本語' : 'EN'} />
              </div>
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold leading-6 text-slate-700">
                {selectedAreaRow?.name || selectedScopeText}, {workspace.country.name}<br />
                {candidatePostalCode}
              </p>
              <button
                className={cn(
                  'mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-black',
                  canCreateDraft ? 'bg-blue-600 text-white hover:bg-blue-700' : 'cursor-not-allowed bg-slate-200 text-slate-500',
                )}
                disabled={!canCreateDraft}
                type="button"
                onClick={createDraft}
              >
                {studio.confirmPostalCode}
              </button>
              <button className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800" type="button">
                {studio.apiPreview}
              </button>
            </div>

            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="grid gap-1 text-xs font-bold text-slate-500">
                <span>{t.country}</span>
                <select
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-950"
                  value={countryCode}
                  onChange={event => setCountryCode(event.target.value)}
                >
                  {countries.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.code} - {country.name} ({country.classHint})
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-bold text-slate-500">
                <span>{t.template}</span>
                <select
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-950"
                  value={templateId}
                  onChange={event => setTemplateId(event.target.value)}
                >
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>{template.label}</option>
                  ))}
                </select>
              </label>
              <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                <label className="grid gap-1 text-xs font-bold text-slate-500">
                  <span>{t.municipality}</span>
                  <select
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-950"
                    value={selectedMunicipality?.id || ''}
                    onChange={event => {
                      setSelectedMunicipalityId(event.target.value);
                      setSelectedTownId('');
                      setSelectedChomeId('');
                    }}
                  >
                    {workspace.localityChoices.map(choice => (
                      <option key={choice.id} value={choice.id}>{choice.name}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-bold text-slate-500">
                  <span>{t.town}</span>
                  <select
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-950"
                    value={selectedTown?.id || ''}
                    onChange={event => {
                      setSelectedTownId(event.target.value);
                      setSelectedChomeId('');
                    }}
                  >
                    {townOptions.map(choice => (
                      <option key={choice.id} value={choice.id}>{choice.name}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-bold text-slate-500">
                  <span>{t.chome}</span>
                  <select
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-950"
                    value={selectedChome?.id || ''}
                    onChange={event => setSelectedChomeId(event.target.value)}
                  >
                    {chomeOptions.map(choice => (
                      <option key={choice.id} value={choice.id}>{choice.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">
                <span>{t.simulateCrossMunicipality}</span>
                <input
                  checked={simulateCrossMunicipality}
                  type="checkbox"
                  onChange={event => setSimulateCrossMunicipality(event.target.checked)}
                />
              </label>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-700">{t.creationConsole}</p>
              <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase text-slate-500">{t.candidatePostalCode}</p>
                  <p className="mt-1 break-all font-mono text-3xl font-black tracking-tight text-slate-950">
                    {candidatePostalCode}
                  </p>
                </div>
                <Pill label={decision.label} tone={decision.tone} />
              </div>
              <p className="mt-3 text-sm font-black leading-6 text-slate-900">{selectedScopeText}</p>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{decision.nextAction}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <button
                  className={cn(
                    'inline-flex h-11 items-center justify-center rounded-lg px-3 text-sm font-black transition',
                    canCreateDraft
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'cursor-not-allowed bg-slate-200 text-slate-500',
                  )}
                  disabled={!canCreateDraft}
                  type="button"
                  onClick={createDraft}
                >
                  {canCreateDraft ? (draftHistory.length > 0 ? t.draftCreated : t.createDraft) : t.createBlocked}
                </button>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-900 hover:bg-slate-50"
                  type="button"
                  onClick={() => copyCandidatePostalCode(workspace)}
                >
                  <Copy className="h-4 w-4" />
                  {t.copyCandidate}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-200">{t.creationHistory}</p>
              {draftHistory.length === 0 ? (
                <p className="mt-3 text-sm font-bold leading-6 text-slate-300">{t.noDraftYet}</p>
              ) : (
                <div className="mt-3 grid gap-2">
                  {draftHistory.map(item => (
                    <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="font-mono text-sm font-black text-white">{item.code}</p>
                      <p className="mt-1 text-xs font-bold leading-5 text-slate-300">{item.scope}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-black uppercase text-slate-200">{item.stage}</span>
                        <span className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-black uppercase text-slate-200">{item.createdAt.slice(0, 19)}Z</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_230px_250px]">
          <Panel title={studio.postalCodeList} icon={<Grid3X3 className="h-4 w-4 text-blue-600" />}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr className="text-xs font-black text-slate-500">
                    <th className="border-b border-slate-100 pb-2 pr-3">{studio.postcode}</th>
                    <th className="border-b border-slate-100 pb-2 pr-3">{studio.localityName}</th>
                    <th className="border-b border-slate-100 pb-2 pr-3">{t.population}</th>
                    <th className="border-b border-slate-100 pb-2 pr-3">{studio.addressRows}</th>
                    <th className="border-b border-slate-100 pb-2 pr-3">{t.area}</th>
                    <th className="border-b border-slate-100 pb-2 pr-3">{studio.density}</th>
                    <th className="border-b border-slate-100 pb-2">{studio.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {postalAreaRows.map(row => (
                    <tr key={row.code} className="text-xs font-bold text-slate-700">
                      <td className="border-b border-slate-50 py-2 pr-3 font-mono font-black text-blue-700">{row.code}</td>
                      <td className="border-b border-slate-50 py-2 pr-3">{row.name}</td>
                      <td className="border-b border-slate-50 py-2 pr-3">{formatNumber(row.population)}</td>
                      <td className="border-b border-slate-50 py-2 pr-3">{formatNumber(row.addresses)}</td>
                      <td className="border-b border-slate-50 py-2 pr-3">{formatDecimal(row.area)} km2</td>
                      <td className="border-b border-slate-50 py-2 pr-3">{row.density}</td>
                      <td className="border-b border-slate-50 py-2"><Pill label={row.status} tone="warn" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="mt-3 inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-800" type="button">
              {studio.bulkExport}
            </button>
          </Panel>

          <Panel title={studio.minimumSimulator} icon={<Users className="h-4 w-4 text-blue-600" />}>
            <div className="grid gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-black text-slate-500">{studio.minimumRequired}</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{formatNumber(workspace.minimumCodeCount.operationalLowerBound)}</p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs font-black text-blue-700">{studio.recommendedCount}</p>
                <p className="mt-1 text-2xl font-black text-blue-950">{formatNumber(Math.max(workspace.minimumCodeCount.operationalLowerBound, zoneCount + 2))}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-xs font-black text-emerald-700">{studio.highPrecisionDelivery}</p>
                <p className="mt-1 text-2xl font-black text-emerald-950">{formatNumber(Math.max(zoneCount + 8, workspace.minimumCodeCount.operationalLowerBound * 2))}</p>
              </div>
            </div>
          </Panel>

          <Panel title={studio.projectProgress} icon={<Clock3 className="h-4 w-4 text-blue-600" />}>
            <div className="grid gap-4">
              <div className="grid place-items-center">
                <div className="grid h-28 w-28 place-items-center rounded-full border-[12px] border-blue-100 bg-white text-center shadow-inner" style={{ borderTopColor: '#2563eb' }}>
                  <span className="text-2xl font-black text-slate-950">{progressPercent}%</span>
                </div>
              </div>
              <div className="grid gap-2">
                <p className="text-xs font-black uppercase text-slate-500">{studio.approvalFlow}</p>
                {approvalSteps.map((step, index) => (
                  <div key={step.label} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <span className={cn(
                      'grid h-6 w-6 place-items-center rounded-full text-xs font-black',
                      step.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600',
                    )}>
                      {index + 1}
                    </span>
                    <span className="text-xs font-black text-slate-700">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          <Panel title={t.countryPackDashboard} icon={<Layers3 className="h-4 w-4 text-blue-600" />}>
            <div className="grid gap-3">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="text-[11px] font-black uppercase text-blue-700">{t.centralIndex}</p>
                <p className="mt-1 break-all font-mono text-xs font-black text-blue-950">
                  {postalForgePlan.centralIndex.packageName}
                </p>
              </div>
              <div className="grid gap-2">
                <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <span className="text-xs font-black text-slate-500">{t.repository}</span>
                  <span className="max-w-[190px] break-all text-right font-mono text-xs font-black text-slate-900">
                    {countryPackRecord?.repositoryName}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <span className="text-xs font-black text-slate-500">{t.coveragePolicy}</span>
                  <span className="text-right text-xs font-black text-slate-900">{countryPackRecord?.coverageLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <span className="text-xs font-black text-slate-500">{t.updateCadence}</span>
                  <Pill label={countryPackRecord?.updateCadence || 'manual-review'} tone="neutral" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill label={countryPackRecord?.publicationStage || 'draft'} tone={statusTone(countryPackRecord?.publicationStage || 'draft')} />
                <Pill label={t.noRawData} tone="good" />
              </div>
              <p className="break-all rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 font-mono text-[11px] font-bold leading-5 text-slate-600">
                {t.lazyLoad}: {countryPackRecord?.lazyLoad.countryPackPath}
              </p>
            </div>
          </Panel>

          <Panel title={t.splitMergePlanner} icon={<GitBranch className="h-4 w-4 text-blue-600" />}>
            <div className="grid gap-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase text-slate-400">{t.currentZones}</p>
                  <p className="mt-1 text-xl font-black text-slate-950">{formatNumber(splitMergeStats.currentZones)}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3">
                  <p className="text-[10px] font-black uppercase text-emerald-600">{t.splitScenario}</p>
                  <p className="mt-1 text-xl font-black text-emerald-900">{formatNumber(splitMergeStats.splitZones)}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3">
                  <p className="text-[10px] font-black uppercase text-amber-600">{t.mergeScenario}</p>
                  <p className="mt-1 text-xl font-black text-amber-900">{formatNumber(splitMergeStats.mergeZones)}</p>
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold">
                  <span className="text-slate-500">{t.avgArea}</span>
                  <span className="text-slate-950">{formatDecimal(splitMergeStats.avgArea)} km2</span>
                </div>
                <div className="flex justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold">
                  <span className="text-slate-500">{t.minArea} / {t.maxArea}</span>
                  <span className="text-slate-950">
                    {formatDecimal(splitMergeStats.minArea)} / {formatDecimal(splitMergeStats.maxArea)} km2
                  </span>
                </div>
                <div className="flex justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold">
                  <span className="text-slate-500">{t.avgPopulation}</span>
                  <span className="text-slate-950">{formatNumber(splitMergeStats.avgPopulation)}</span>
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-500">
                  <span>{t.collisionRisk}</span>
                  <span>{formatDecimal(splitMergeStats.collisionRisk * 100, 0)}%</span>
                </div>
                <Progress value={1 - splitMergeStats.collisionRisk} />
              </div>
            </div>
          </Panel>

          <Panel title={t.codePreview} icon={<Grid3X3 className="h-4 w-4 text-blue-600" />}>
            <div className="grid gap-2">
              {codePreviewRows.map(row => (
                <div key={row.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase text-slate-400">{row.label}</p>
                  <p className="mt-1 break-all font-mono text-sm font-black text-slate-950">{row.value}</p>
                  <p className="mt-1 break-all text-[11px] font-bold leading-5 text-slate-500">{row.helper}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={t.qualityGate} icon={<FileCheck2 className="h-4 w-4 text-blue-600" />}>
            <div className="grid gap-3">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase text-slate-500">{t.qualityScore}</p>
                  <Pill
                    label={formatPublicConfidenceBand(countryPackRecord?.release.qualityScore || 0, language)}
                    tone={(countryPackRecord?.release.qualityScore || 0) >= 0.7 ? 'good' : 'warn'}
                  />
                </div>
                <Progress value={countryPackRecord?.release.qualityScore || 0} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill
                  label={countryPackRecord?.release.canPublish ? t.releaseReady : countryPackRecord?.release.blockers.length ? t.publishBlocked : t.reviewRequired}
                  tone={countryPackRecord?.release.canPublish ? 'good' : countryPackRecord?.release.blockers.length ? 'bad' : 'warn'}
                />
                <Pill label={`${t.blockers}: ${countryPackRecord?.release.blockers.length || 0}`} tone={countryPackRecord?.release.blockers.length ? 'bad' : 'good'} />
              </div>
              <div className="grid gap-2">
                {qualityGates.slice(0, 5).map(gate => (
                  <div key={gate.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-black leading-5 text-slate-800">{gate.label}</p>
                      <Pill label={gate.passed ? 'pass' : gate.severity} tone={gate.passed ? 'good' : gate.severity === 'block' ? 'bad' : 'warn'} />
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] font-bold leading-5 text-slate-500">
                      {gate.evidence.join(' / ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-700">{t.realCountryExample}</p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                  {workspace.exampleGeneration.countryName} / Class {workspace.exampleGeneration.countryClass}
                </h2>
                <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-600">
                  {workspace.exampleGeneration.sourceNote}
                </p>
              </div>
              <button
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-black text-blue-800 hover:bg-blue-100"
                type="button"
                onClick={loadFijiExample}
              >
                {t.loadFijiExample}
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {workspace.exampleGeneration.candidates.map(candidate => (
                <div key={candidate.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 text-xs font-black leading-5 text-slate-700">{candidate.label}</p>
                    <Pill
                      label={exampleCandidateLabel(candidate.decision, language)}
                      tone={exampleCandidateTone(candidate.decision)}
                    />
                  </div>
                  <p className="mt-3 break-all font-mono text-lg font-black text-slate-950">
                    {candidate.code || '-'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {candidate.displayPath.slice(0, 3).map(part => (
                      <span key={part} className="rounded-md bg-white px-2 py-1 text-[10px] font-black text-slate-500">
                        {part}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Pill
                      label={candidate.boundarySafe ? t.boundaryPass : t.boundaryFail}
                      tone={candidate.boundarySafe ? 'good' : 'bad'}
                    />
                    <Pill label={t.rawAddressFree} tone="good" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-black uppercase text-slate-400">{t.method}</p>
              <ul className="mt-3 grid gap-2 text-xs font-bold leading-5 text-slate-600">
                {workspace.exampleGeneration.methodSteps.map(step => (
                  <li key={step} className="rounded-xl border border-slate-100 bg-white px-3 py-2">{step}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-200">{t.usabilityImprovements}</p>
              <ul className="mt-3 grid gap-2 text-xs font-bold leading-5 text-slate-200">
                {workspace.exampleGeneration.usabilityImprovements.map(item => (
                  <li key={item} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">{item}</li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill label={`${t.generatedExamples}: ${workspace.exampleGeneration.summary.generatedCandidateCount}`} tone="good" />
                <Pill
                  label={workspace.exampleGeneration.summary.allCandidatesStayInsideOneMunicipality ? t.boundaryPass : t.boundaryFail}
                  tone={workspace.exampleGeneration.summary.allCandidatesStayInsideOneMunicipality ? 'good' : 'bad'}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <aside className="flex flex-col gap-4">
            <Panel title={t.metrics} icon={<DraftingCompass className="h-4 w-4 text-blue-600" />}>
              <div className="grid gap-3">
                <label className="grid gap-1 text-xs font-bold text-slate-500">
                  <span>{t.country}</span>
                  <select
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-950"
                    value={countryCode}
                    onChange={event => setCountryCode(event.target.value)}
                  >
                    {countries.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.code} - {country.name} ({country.classHint})
                      </option>
                    ))}
                  </select>
                </label>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <p className="mb-2 text-[11px] font-black uppercase text-blue-700">{t.countryProfile}</p>
                  <div className="flex flex-wrap gap-2">
                    <Pill label={`Class ${selectedCountry.classHint}`} tone={statusTone(selectedCountry.classHint)} />
                    <Pill label={`${t.terrain}: ${selectedCountry.terrain}`} />
                    <Pill label={selectedCountry.region} />
                  </div>
                  <p className="mt-2 text-[11px] font-black uppercase text-blue-700">{t.sourceNote}</p>
                  <p className="mt-2 text-xs font-bold leading-5 text-blue-900">
                    {selectedCountry.sourceNote}
                  </p>
                </div>
                <label className="grid gap-1 text-xs font-bold text-slate-500">
                  <span>{t.template}</span>
                  <select
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-950"
                    value={templateId}
                    onChange={event => setTemplateId(event.target.value)}
                  >
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>{template.label}</option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t.population} value={population} min={1} onChange={setPopulation} />
                  <Field label={t.area} value={areaKm2} min={1} onChange={setAreaKm2} />
                  <Field label={t.municipalities} value={municipalityCount} min={1} onChange={setMunicipalityCount} />
                  <Field label={t.addressCount} value={addressCount} min={1} onChange={setAddressCount} />
                  <Field label={t.ambiguity} value={ambiguityScore} min={0} max={1} step={0.01} onChange={setAmbiguityScore} />
                  <Field label={t.routeRadius} value={routeRadiusMinutes} min={1} onChange={setRouteRadiusMinutes} />
                </div>
              </div>
            </Panel>

            <Panel title={t.governance} icon={<Globe2 className="h-4 w-4 text-blue-600" />}>
              <div className="grid gap-3">
                <Field label="approval signal" value={governanceScore} min={0} max={1} step={0.01} onChange={setGovernanceScore} />
                <Progress value={workspace.designPlan.governance.approvalScore} />
                <p className="text-xs font-bold text-slate-500">
                  {workspace.designPlan.governance.approvalScore} / {workspace.designPlan.governance.threshold}
                </p>
              </div>
            </Panel>

            <Panel title={t.dataTrust} icon={<Layers3 className="h-4 w-4 text-blue-600" />}>
              <div className="grid gap-3">
                <Field label="Q score baseline" value={dataQuality} min={0} max={1} step={0.01} onChange={setDataQuality} />
                <Progress value={workspace.designPlan.dataTrust.trustScore} />
                <p className="text-xs font-bold text-slate-500">
                  {workspace.designPlan.dataTrust.mode} - {workspace.designPlan.dataTrust.trustScore}
                </p>
              </div>
            </Panel>

            <Panel title={t.privacy} icon={<ShieldCheck className="h-4 w-4 text-blue-600" />}>
              <div className="grid gap-3">
                <Field label="address entities / area" value={privacyFloor} min={0} onChange={setPrivacyFloor} />
                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
                  {t.sensitive}
                  <input checked={sensitive} type="checkbox" onChange={event => setSensitive(event.target.checked)} />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
                  {t.highRisk}
                  <input checked={highRisk} type="checkbox" onChange={event => setHighRisk(event.target.checked)} />
                </label>
              </div>
            </Panel>
          </aside>

          <div className="grid gap-4">
            <section className="grid gap-3 md:grid-cols-5">
              <Panel title={t.stage}>
                <Pill label={workspace.stage} tone={statusTone(workspace.stage)} />
              </Panel>
              <Panel title={t.classification}>
                <Pill label={`Class ${workspace.designPlan.classification.class}`} tone={statusTone(workspace.designPlan.classification.class)} />
              </Panel>
              <Panel title={t.publication}>
                <Pill label={workspace.designPlan.publication.status} tone={statusTone(workspace.designPlan.publication.status)} />
              </Panel>
              <Panel title={t.generatedCode}>
                <p className="truncate text-lg font-black tracking-tight text-slate-950">
                  {workspace.designPlan.generated?.code || t.draftOnly}
                </p>
              </Panel>
              <Panel title={t.aiGrade}>
                <Pill label={workspace.aiQuality.grade} tone={statusTone(workspace.aiQuality.grade)} />
                <p className="mt-2 text-xs font-black text-slate-500">
                  {t.aiConfidence} {formatPublicConfidenceBand(workspace.aiQuality.confidence, language)}
                </p>
              </Panel>
            </section>

            <section className="grid gap-4">
              <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-700">{t.guidedProposal}</p>
                    <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
                      {proposalMessage(workspace, language)}
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-4 lg:min-w-[620px]">
                    {[t.stepCountry, t.stepArea, t.stepReview, t.stepPilot].map((step, index) => (
                      <div key={step} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                          {index + 1}
                        </span>
                        <span className="text-xs font-black text-slate-700">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <Panel title={t.recommendedFormat} icon={<Grid3X3 className="h-4 w-4 text-blue-600" />}>
                <div className="grid gap-3">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-black uppercase text-blue-700">{workspace.country.code} - {workspace.country.name}</p>
                    <p className="mt-2 text-xl font-black text-slate-950">{workspace.formatSuggestion.label}</p>
                    <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{workspace.formatSuggestion.notice}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-black uppercase text-slate-400">{t.formatPreview}</p>
                      <p className="mt-1 font-mono text-sm font-black text-slate-900">{workspace.formatSuggestion.formatPreview}</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-black uppercase text-slate-400">{t.exampleCode}</p>
                      <p className="mt-1 font-mono text-sm font-black text-slate-900">{workspace.formatSuggestion.exampleCode}</p>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-[11px] font-black uppercase text-slate-400">{t.possibleFormats}</p>
                    <div className="grid gap-2">
                      {workspace.formatOptions.slice(0, 6).map(option => {
                        const selected = option.templateId === workspace.templateId;
                        return (
                          <button
                            key={option.templateId}
                            type="button"
                            disabled={!option.selectable}
                            onClick={() => setTemplateId(option.templateId)}
                            className={cn(
                              'min-h-[72px] rounded-xl border px-3 py-2 text-left transition',
                              selected ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50',
                              !option.selectable && 'cursor-not-allowed opacity-55 hover:border-slate-200 hover:bg-white',
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-slate-950">{option.label}</p>
                                <p className="mt-1 font-mono text-xs font-black text-slate-500">{option.format}</p>
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1">
                                {option.recommended && <Pill label={t.recommended} tone="good" />}
                                {!option.selectable && <Pill label={t.simulationOnly} tone="warn" />}
                              </div>
                            </div>
                            <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-slate-600">
                              {option.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill
                      label={workspace.formatSuggestion.canCreateNewCode ? t.createAllowed : t.createBlocked}
                      tone={workspace.formatSuggestion.canCreateNewCode ? 'good' : 'bad'}
                    />
                    {workspace.formatSuggestion.simpleReasons.slice(0, 2).map(reason => (
                      <Pill key={reason} label={reason} tone="neutral" />
                    ))}
                  </div>
                </div>
                </Panel>

                <Panel title={t.scopeBuilder} icon={<MapPinned className="h-4 w-4 text-blue-600" />}>
                <div className="grid gap-4">
                  <div className={cn(
                    'rounded-2xl border p-4',
                    workspace.localityProposal.ok ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50',
                  )}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase text-slate-500">{t.candidatePostalCode}</p>
                        <p className="mt-1 font-mono text-2xl font-black tracking-tight text-slate-950">
                          {workspace.localityProposal.code || workspace.formatSuggestion.exampleCode}
                        </p>
                      </div>
                      <Pill
                        label={workspace.localityProposal.ok ? t.createAllowed : t.createBlocked}
                        tone={workspace.localityProposal.ok ? 'good' : 'warn'}
                      />
                    </div>
                    <p className="mt-3 text-sm font-bold leading-6 text-slate-700">
                      {proposalMessage(workspace, language)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {workspace.localityProposal.displayPath.map(part => (
                        <Pill key={part} label={part} tone="neutral" />
                      ))}
                    </div>
                    <p className="mt-3 rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-xs font-black text-slate-700">
                      {t.sameMunicipalityOnly}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-black uppercase text-slate-500">{t.boundaryCheck}</p>
                      <Pill
                        label={workspace.localityProposal.theoremChecks.withinSingleMunicipality ? t.boundaryPass : t.boundaryFail}
                        tone={workspace.localityProposal.theoremChecks.withinSingleMunicipality ? 'good' : 'bad'}
                      />
                    </div>
                    <div className="grid gap-2">
                      {Object.entries(workspace.localityProposal.theoremChecks).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                          <span className="text-xs font-bold text-slate-600">{friendlyTheoremLabel(key, language)}</span>
                          <Pill label={value ? 'pass' : 'fail'} tone={statusTone(value)} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                </Panel>
              </div>
            </section>

            <div className="grid gap-4 xl:grid-cols-2">
              <Panel title={t.aiQuality} icon={<ShieldCheck className="h-4 w-4 text-blue-600" />}>
                <div className="grid gap-3">
                  <Progress value={workspace.aiQuality.overallScore} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {workspace.aiQuality.dimensions.slice(0, 6).map(dimension => (
                      <div key={dimension.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-black text-slate-700">{friendlyQualityLabel(dimension.id, language)}</p>
                          <Pill
                            label={friendlyQualityStatus(dimension.status, language)}
                            tone={dimension.status === 'pass' ? 'good' : dimension.status === 'review' ? 'warn' : 'bad'}
                          />
                        </div>
                        <p className="mt-2 text-[11px] font-bold text-slate-500">{formatPublicConfidenceBand(dimension.score, language)}</p>
                      </div>
                    ))}
                  </div>
                  {workspace.aiQuality.nextActions.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-[11px] font-black uppercase text-amber-800">{t.nextActions}</p>
                      <ul className="mt-2 grid gap-1 text-xs font-bold leading-5 text-amber-900">
                        {workspace.aiQuality.nextActions.slice(0, 3).map(action => (
                          <li key={action}>- {action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Panel>

              <Panel title={t.mathChecks} icon={<Grid3X3 className="h-4 w-4 text-blue-600" />}>
                <div className="grid gap-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[11px] font-black uppercase text-slate-400">{t.minimumCodes}</p>
                      <p className="mt-1 text-2xl font-black text-slate-950">{workspace.minimumCodeCount.operationalLowerBound}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[11px] font-black uppercase text-slate-400">{t.capacity}</p>
                      <p className="mt-1 text-2xl font-black text-slate-950">{formatNumber(workspace.designPlan.existence.capacity)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[11px] font-black uppercase text-slate-400">{t.existence}</p>
                      <Pill
                        label={workspace.designPlan.existence.mathematicallyConstructible ? 'constructible' : 'blocked'}
                        tone={statusTone(workspace.designPlan.existence.mathematicallyConstructible)}
                      />
                    </div>
                  </div>
                  <ul className="grid gap-2">
                    {Object.entries(workspace.designPlan.existence.theoremChecks).map(([key, value]) => (
                      <li key={key} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold">
                        <span className="text-slate-600">{key}</span>
                        <Pill label={value ? 'pass' : 'fail'} tone={statusTone(value)} />
                      </li>
                    ))}
                  </ul>
                </div>
              </Panel>

              <Panel title={t.vpl} icon={<MapPinned className="h-4 w-4 text-blue-600" />}>
                <div className="grid gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Pill label={workspace.virtualLocalityNeed.shouldCreate ? 'VPL required' : 'not required'} tone={workspace.virtualLocalityNeed.shouldCreate ? 'warn' : 'good'} />
                    <Pill label={`lower bound ${workspace.virtualLocalityNeed.lowerBound}`} />
                    <Pill label={t.nonAdministrative} />
                    <Pill
                      label={workspace.virtualLocalityNeed.publicSafeByAverageAddressCount ? 'public-safe average' : 'privacy review'}
                      tone={workspace.virtualLocalityNeed.publicSafeByAverageAddressCount ? 'good' : 'warn'}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {workspace.virtualLocalityNeed.triggers.map(trigger => (
                      <Pill key={trigger} label={trigger} tone="warn" />
                    ))}
                    {workspace.virtualLocalityNeed.triggers.length === 0 && <Pill label="no trigger" tone="good" />}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-black uppercase text-slate-400">{t.vplDesign}</p>
                      <p className="mt-1 text-sm font-black text-slate-900">
                        {workspace.virtualLocalityNeed.dataModel.synthetic ? 'synthetic postal locality' : 'official locality'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-black uppercase text-slate-400">Hamming d</p>
                      <p className="mt-1 text-sm font-black text-slate-900">
                        {workspace.virtualLocalityCodes.observedMinHammingDistance} / {workspace.virtualLocalityCodes.minHammingDistance}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-black uppercase text-slate-400">adjacency</p>
                      <Pill
                        label={workspace.virtualLocalityCodes.adjacencySatisfied ? 'separated' : 'review'}
                        tone={workspace.virtualLocalityCodes.adjacencySatisfied ? 'good' : 'warn'}
                      />
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[11px] font-black uppercase text-slate-400">{t.vplRationale}</p>
                    <ul className="mt-2 grid gap-1 text-xs font-bold leading-5 text-slate-600">
                      {workspace.virtualLocalityNeed.rationale.slice(0, 3).map(reason => (
                        <li key={reason}>- {reason}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-black uppercase text-slate-400">{t.codes}</p>
                    <div className="flex flex-wrap gap-2">
                      {workspace.virtualLocalityCodes.codes.map(code => (
                        <span key={code} className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 font-mono text-xs font-black text-blue-800">
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Panel title={t.gisChecks} icon={<GitBranch className="h-4 w-4 text-blue-600" />}>
                <ul className="grid gap-2">
                  {workspace.gisChecklist.map(item => (
                    <li key={item} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-600">
                      {item}
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel title={t.officialGuard} icon={<ShieldCheck className="h-4 w-4 text-blue-600" />}>
                <ul className="grid gap-2">
                  {workspace.safetyBoundaries.map(boundary => <BoundaryRow key={boundary.id} boundary={boundary} />)}
                </ul>
              </Panel>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
              <Panel title={t.editLedger} icon={<DraftingCompass className="h-4 w-4 text-blue-600" />}>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-black uppercase text-slate-400">{t.source}</p>
                    <p className="mt-1 text-sm font-black text-slate-950">{workspace.editSummary.sourceKind}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-black uppercase text-slate-400">{t.integrated}</p>
                    <p className="mt-1 text-xl font-black text-slate-950">{workspace.editSummary.integratedCount}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-black uppercase text-slate-400">{t.excluded}</p>
                    <p className="mt-1 text-xl font-black text-slate-950">{workspace.editSummary.excludedCount}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-black uppercase text-slate-400">{t.rejected}</p>
                    <p className="mt-1 text-xl font-black text-slate-950">{workspace.editSummary.rejectedCount}</p>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-black text-slate-500">revision</p>
                  <p className="mt-1 break-all font-mono text-xs font-bold text-slate-700">{workspace.editSummary.revisionId}</p>
                </div>
                <div className="mt-3">
                  <p className="mb-2 text-xs font-black uppercase text-slate-400">{t.adaptiveHierarchy}</p>
                  <div className="flex flex-wrap gap-2">
                    {workspace.designPlan.adaptiveHierarchy.recommendedPathKinds.map(kind => <Pill key={kind} label={kind} />)}
                  </div>
                </div>
              </Panel>

              <Panel title={t.safeExport}>
                <pre className="max-h-80 overflow-auto rounded-xl bg-slate-950 p-3 text-xs font-bold leading-5 text-slate-100">
                  {safeExportText}
                </pre>
              </Panel>
            </div>

            <Panel title={t.learnedSystems}>
              <div className="grid gap-2 md:grid-cols-2">
                {workspace.designPlan.learnedSystems.slice(0, 6).map(system => (
                  <p key={system} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-600">
                    {system}
                  </p>
                ))}
              </div>
            </Panel>

            {workspace.designPlan.warnings.length > 0 && (
              <Panel title={t.warnings} icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}>
                <div className="flex flex-wrap gap-2">
                  {workspace.designPlan.warnings.map(warning => <Pill key={warning} label={warning} tone="warn" />)}
                </div>
              </Panel>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

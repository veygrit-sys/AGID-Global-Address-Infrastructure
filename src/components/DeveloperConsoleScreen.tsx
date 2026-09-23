import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Boxes,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Code2,
  Copy,
  Database,
  EyeOff,
  FileJson,
  FileSearch,
  Github,
  KeyRound,
  ListChecks,
  LockKeyhole,
  Map,
  Play,
  RefreshCw,
  Search,
  ServerCog,
  ShieldAlert,
  ShieldCheck,
  TerminalSquare,
  UsersRound,
  Webhook,
} from 'lucide-react';
import React from 'react';

import {
  buildDeveloperExperience,
  type DeveloperExperienceModel,
  type DeveloperFeatureCoverageRow,
  type DeveloperPrReadinessSlice,
  type DeveloperScenarioRecipe,
  type DeveloperTutorialStep,
} from '../developer/developerExperience';
import {
  ADDRESS_LAUNCH_CENTER_MODES,
  ADDRESS_LAUNCH_CENTER_PROFILES,
  evaluateAddressLaunchCenter,
  type AddressLaunchCenterEvaluation,
  type AddressLaunchCenterMode,
  type AddressLaunchCenterProfile,
} from '../lib/addressLaunchCenter';
import {
  ADDRESS_PRIVACY_THREAT_MODEL_TEMPLATES,
  type AddressPrivacyThreatTemplate,
  type AddressPrivacyThreatTemplateId,
} from '../lib/addressPrivacyThreatModelTemplates';
import {
  buildDeveloperConsole,
  type DeveloperConsole,
  type DeveloperConsoleLaunchStatus,
  type DeveloperConsoleTestStatus,
  type DeveloperConsoleWebhookDeliveryStatus,
  type DeveloperConsoleWebhookStatus,
  type DeveloperConsoleKeyStatus,
} from '../lib/developerConsole';
import { getLanguageDirection } from '../lib/i18n';
import {
  APP_LANGUAGES,
  APP_LANGUAGE_STORAGE_KEY,
  normalizeAppLanguage,
} from '../lib/languageSettings';
import {
  buildNoRawAddressComplianceKit,
  evaluateNoRawAddressCompliancePayload,
  NO_RAW_ADDRESS_FIXTURES,
  type NoRawAddressComplianceKit,
  type NoRawAddressCompliancePayloadResult,
  type NoRawAddressComplianceSurfaceId,
  type NoRawAddressSurfacePolicy,
} from '../lib/noRawAddressComplianceKit';
import { cn } from '../lib/utils';
import {
  VEYGRIT_ADDRESS_LOGIN_CALLBACK_CONTRACT_VERSION,
  VEYGRIT_ADDRESS_LOGIN_CALLBACK_NON_CLAIMS,
  VEYGRIT_ADDRESS_LOGIN_CALLBACK_PARAM_ALIASES,
  VEYGRIT_ADDRESS_LOGIN_CANONICAL_CALLBACK_PARAMS,
  VEYGRIT_ADDRESS_LOGIN_FORBIDDEN_CALLBACK_PARAM_EXAMPLES,
} from '../lib/veygritAddressLoginCallbackContract';
import { getVeygritShipReleaseGateStatus } from '../lib/veygritShipReleaseGateStatus';

type DeveloperTab = 'overview' | 'tutorial' | 'features' | 'keys' | 'webhooks' | 'sdk' | 'openapi' | 'vectors' | 'launch' | 'community' | 'geo';

type DeveloperCopyKey =
  | 'returnToMap'
  | 'subtitle'
  | 'language'
  | 'refresh'
  | 'copyExport'
  | 'search'
  | 'overview'
  | 'tutorial'
  | 'features'
  | 'keys'
  | 'webhooks'
  | 'sdk'
  | 'openapi'
  | 'vectors'
  | 'launch'
  | 'privacyBoundary'
  | 'privacyBody'
  | 'safeExport'
  | 'apiKeyRefs'
  | 'webhookEndpoints'
  | 'webhookDeliveryLog'
  | 'webhookLogEvents'
  | 'deadLetters'
  | 'sdkTargets'
  | 'cliGuide'
  | 'cliCommands'
  | 'openApiPaths'
  | 'testVectors'
  | 'conformanceResults'
  | 'conformanceSuites'
  | 'launchChecks'
  | 'fingerprint'
  | 'scopes'
  | 'environment'
  | 'status'
  | 'rotated'
  | 'expires'
  | 'topics'
  | 'signingKey'
  | 'lastDelivery'
  | 'failures'
  | 'attempts'
  | 'responseCode'
  | 'eventRef'
  | 'payloadFingerprint'
  | 'signatureVerified'
  | 'install'
  | 'snippet'
  | 'testCommand'
  | 'commandLine'
  | 'purpose'
  | 'highlightedPaths'
  | 'topTags'
  | 'fixtureRef'
  | 'expectedHash'
  | 'suite'
  | 'passed'
  | 'failed'
  | 'updated'
  | 'evidence'
  | 'nextAction'
  | 'developerRoot'
  | 'noMatches'
  | 'payloadSafe'
  | 'rotationDue'
  | 'webhookWarnings'
  | 'integrationPosture'
  | 'launchCenter'
  | 'threatModelTemplate'
  | 'selectedTemplate'
  | 'reviewOwner'
  | 'protectedAssets'
  | 'misuseCases'
  | 'verificationCommands'
  | 'noRawAddressGate'
  | 'surfacePolicy'
  | 'forbiddenFields'
  | 'allowedSubstitutes'
  | 'preAuditChecks'
  | 'profile'
  | 'mode'
  | 'externalAudit'
  | 'deadLetterQueue'
  | 'auditReady'
  | 'blockedRequired'
  | 'missingEvidence'
  | 'presentEvidence'
  | 'warnings'
  | 'privacyGoal'
  | 'startHere'
  | 'quickstart'
  | 'apiExplorer'
  | 'sdkHub'
  | 'securityGate'
  | 'recommendedPath'
  | 'protocolTrust'
  | 'localSandboxProduction'
  | 'sampleRequest'
  | 'responsePreview'
  | 'viewSdk'
  | 'viewOpenApi'
  | 'viewLaunch'
  | 'viewVectors'
  | 'apiWorkbench'
  | 'sandbox'
  | 'errorCatalog'
  | 'retryPolicy'
  | 'noRawImpact'
  | 'startWithSdk'
  | 'featureCategories'
  | 'selfHosting'
  | 'deployStatus'
  | 'communityResearch'
  | 'contributorPaths'
  | 'geoExamples'
  | 'environmentGuard'
  | 'productionLocked'
  | 'requestBody'
  | 'sdkSnippet'
  | 'fix'
  | 'cause'
  | 'apiSurface'
  | 'scenario'
  | 'examplePath'
  | 'viewCommunity'
  | 'viewGeo'
  | 'releaseBlocked'
  | 'viewGates'
  | 'docs'
  | 'github'
  | 'tryIt'
  | 'copy'
  | 'params'
  | 'responseRedacted'
  | 'overallStatus'
  | 'sdkInstall'
  | 'releaseChecklist'
  | 'releaseBlockers'
  | 'guidedTutorial'
  | 'allFeaturesMatrix'
  | 'scenarioRecipes'
  | 'coverage'
  | 'feature'
  | 'sdkAvailable'
  | 'docsAvailable'
  | 'tutorialAvailable'
  | 'testsAvailable'
  | 'ready'
  | 'partial'
  | 'preview'
  | 'runStep'
  | 'safeResponse'
  | 'failureRecovery'
  | 'copyCommand'
  | 'recipe'
  | 'audience'
  | 'flow'
  | 'featureCoverage'
  | 'coverageScore'
  | 'appSurfaces'
  | 'workflowSurfaces'
  | 'sharedPrimitives'
  | 'apiSdkSurfaces'
  | 'commandCenter'
  | 'endpointStudio'
  | 'oneCommandSetup'
  | 'productionGate'
  | 'activePath'
  | 'copyQuickstart'
  | 'localReady'
  | 'sandboxReady'
  | 'releaseScore'
  | 'blockedItems'
  | 'releaseReadiness'
  | 'coverageSurfaces'
  | 'sampleCommand'
  | 'fixReleaseGate'
  | 'utilityActions'
  | 'workbenchBody'
  | 'developerWorkflow'
  | 'runConformance'
  | 'openWorkbench'
  | 'deployReview'
  | 'githubReadySlice'
  | 'prScope'
  | 'sourceFiles'
  | 'compatibilityGates'
  | 'risk'
  | 'callbackContract'
  | 'canonicalParams'
  | 'compatibilityAliases'
  | 'forbiddenCallbackParams'
  | 'nonClaims';

const COPY: Record<'en' | 'ja', Record<DeveloperCopyKey, string>> = {
  en: {
    returnToMap: 'Return to map',
    subtitle: 'API keys, webhooks, SDK snippets, OpenAPI, test vectors, and launch checks for external developers.',
    language: 'Language',
    refresh: 'Refresh',
    copyExport: 'Copy safe export',
    search: 'Search refs, scopes, topics, paths',
    overview: 'Overview',
    tutorial: 'Tutorial',
    features: 'Features',
    keys: 'API Keys',
    webhooks: 'Webhooks',
    sdk: 'SDK',
    openapi: 'OpenAPI',
    vectors: 'Test Vectors',
    launch: 'Launch Checks',
    privacyBoundary: 'Developer privacy boundary',
    privacyBody: 'The console stores refs, fingerprints, commitments, schema metadata, and test vector ids only. It never displays key material, raw address text, raw AGID/AOID, or proof codes.',
    safeExport: 'Safe export',
    apiKeyRefs: 'API key refs',
    webhookEndpoints: 'Webhook endpoints',
    webhookDeliveryLog: 'Webhook delivery log',
    webhookLogEvents: 'Webhook log events',
    deadLetters: 'Dead letters',
    sdkTargets: 'SDK targets',
    cliGuide: 'CLI guide',
    cliCommands: 'CLI commands',
    openApiPaths: 'OpenAPI paths',
    testVectors: 'Test vectors',
    conformanceResults: 'Conformance results',
    conformanceSuites: 'Conformance suites',
    launchChecks: 'Launch checks',
    fingerprint: 'Fingerprint',
    scopes: 'Scopes',
    environment: 'Environment',
    status: 'Status',
    rotated: 'Rotated',
    expires: 'Expires',
    topics: 'Topics',
    signingKey: 'Signing key ref',
    lastDelivery: 'Last delivery',
    failures: 'Failures',
    attempts: 'Attempts',
    responseCode: 'Response code',
    eventRef: 'Event ref',
    payloadFingerprint: 'Payload fingerprint',
    signatureVerified: 'Signature verified',
    install: 'Install',
    snippet: 'Snippet',
    testCommand: 'Test command',
    commandLine: 'Command',
    purpose: 'Purpose',
    highlightedPaths: 'Highlighted paths',
    topTags: 'Top tags',
    fixtureRef: 'Fixture ref',
    expectedHash: 'Expected hash',
    suite: 'Suite',
    passed: 'Passed',
    failed: 'Failed',
    updated: 'Updated',
    evidence: 'Evidence',
    nextAction: 'Next action',
    developerRoot: 'Developer root',
    noMatches: 'No matching developer records.',
    payloadSafe: 'Payload safe',
    rotationDue: 'Rotation due',
    webhookWarnings: 'Webhook attention',
    integrationPosture: 'Integration posture',
    launchCenter: 'Launch Center',
    threatModelTemplate: 'Threat Model Template',
    selectedTemplate: 'Selected template',
    reviewOwner: 'Review owner',
    protectedAssets: 'Protected assets',
    misuseCases: 'Misuse cases',
    verificationCommands: 'Verification commands',
    noRawAddressGate: 'No raw address gate',
    surfacePolicy: 'Surface policy',
    forbiddenFields: 'Forbidden fields',
    allowedSubstitutes: 'Allowed substitutes',
    preAuditChecks: 'Pre-audit checks',
    profile: 'Profile',
    mode: 'Mode',
    externalAudit: 'External audit ready',
    deadLetterQueue: 'Webhook DLQ ready',
    auditReady: 'Audit ready',
    blockedRequired: 'Blocked required',
    missingEvidence: 'Missing evidence',
    presentEvidence: 'Present evidence',
    warnings: 'Warnings',
    privacyGoal: 'Privacy goal',
    startHere: 'Start here',
    quickstart: 'Quickstart',
    apiExplorer: 'API Explorer',
    sdkHub: 'SDK Hub',
    securityGate: 'Security Gate',
    recommendedPath: 'Recommended path',
    protocolTrust: 'Protocol trust',
    localSandboxProduction: 'Local / Sandbox / Production',
    sampleRequest: 'Sample request',
    responsePreview: 'Response preview',
    viewSdk: 'View SDK',
    viewOpenApi: 'View OpenAPI',
    viewLaunch: 'View launch gate',
    viewVectors: 'View conformance',
    apiWorkbench: 'API Workbench',
    sandbox: 'Sandbox',
    errorCatalog: 'Error catalog',
    retryPolicy: 'Retry policy',
    noRawImpact: 'No raw address impact',
    startWithSdk: 'Start with SDK',
    featureCategories: 'Feature categories',
    selfHosting: 'Self-hosting',
    deployStatus: 'Deploy status',
    communityResearch: 'Community & Research',
    contributorPaths: 'Contributor paths',
    geoExamples: 'Geo Examples',
    environmentGuard: 'Environment guard',
    productionLocked: 'Production locked until launch gates pass',
    requestBody: 'Request body',
    sdkSnippet: 'SDK snippet',
    fix: 'Fix',
    cause: 'Cause',
    apiSurface: 'API surface',
    scenario: 'Scenario',
    examplePath: 'Example path',
    viewCommunity: 'View community',
    viewGeo: 'View geo examples',
    releaseBlocked: 'Release blocked until gates pass',
    viewGates: 'View gates',
    docs: 'Docs',
    github: 'GitHub',
    tryIt: 'Try it',
    copy: 'Copy',
    params: 'Params',
    responseRedacted: 'Redacted fields are masked. Use appropriate scopes to access full data.',
    overallStatus: 'Overall status',
    sdkInstall: 'SDK install',
    releaseChecklist: 'Release checklist',
    releaseBlockers: 'Release blockers',
    guidedTutorial: 'Guided Tutorial Player',
    allFeaturesMatrix: 'All Features Matrix',
    scenarioRecipes: 'Scenario Recipes',
    coverage: 'Coverage',
    feature: 'Feature',
    sdkAvailable: 'SDK',
    docsAvailable: 'Docs',
    tutorialAvailable: 'Tutorial',
    testsAvailable: 'Tests',
    ready: 'Ready',
    partial: 'Partial',
    preview: 'Preview',
    runStep: 'Run step',
    safeResponse: 'Safe response',
    failureRecovery: 'Failure recovery',
    copyCommand: 'Copy command',
    recipe: 'Recipe',
    audience: 'Audience',
    flow: 'Flow',
    featureCoverage: 'Feature coverage',
    coverageScore: 'Coverage score',
    appSurfaces: 'App surfaces',
    workflowSurfaces: 'Workflow surfaces',
    sharedPrimitives: 'Shared primitives',
    apiSdkSurfaces: 'API / SDK surfaces',
    commandCenter: 'Developer Console',
    endpointStudio: 'API Workbench',
    oneCommandSetup: 'Quickstart',
    productionGate: 'Release gate',
    activePath: 'Active path',
    copyQuickstart: 'Copy quickstart',
    localReady: 'Local ready',
    sandboxReady: 'Sandbox ready',
    releaseScore: 'Release score',
    blockedItems: 'Blocked items',
    releaseReadiness: 'Release readiness',
    coverageSurfaces: 'Coverage surfaces',
    sampleCommand: 'Sample command',
    fixReleaseGate: 'Fix release gate',
    utilityActions: 'Utilities',
    workbenchBody: 'API reference, SDK setup, conformance, and release readiness without raw address examples.',
    developerWorkflow: 'Developer workflow',
    runConformance: 'Run conformance',
    openWorkbench: 'Open workbench',
    deployReview: 'Deploy review',
    githubReadySlice: 'GitHub-ready slice',
    prScope: 'PR scope',
    sourceFiles: 'Source files',
    compatibilityGates: 'Compatibility gates',
    risk: 'Risk',
    callbackContract: 'Address Login callback contract',
    canonicalParams: 'Canonical params',
    compatibilityAliases: 'Compatibility aliases',
    forbiddenCallbackParams: 'Forbidden callback params',
    nonClaims: 'Non-claims',
  },
  ja: {
    returnToMap: '地図へ戻る',
    subtitle: '外部開発者向けに APIキー、Webhook、SDK、OpenAPI、テストベクトル、導入チェックをまとめます。',
    language: '言語',
    refresh: '更新',
    copyExport: '安全なエクスポートをコピー',
    search: 'ref、scope、topic、pathを検索',
    overview: '概要',
    tutorial: 'チュートリアル',
    features: '全機能',
    keys: 'APIキー',
    webhooks: 'Webhook',
    sdk: 'SDK',
    openapi: 'OpenAPI',
    vectors: 'テストベクトル',
    launch: '導入チェック',
    privacyBoundary: '開発者向けプライバシー境界',
    privacyBody: 'このConsoleはref、fingerprint、commitment、schema metadata、test vector idのみ扱います。鍵の中身、実住所、AGID/AOID本体、proof codeは表示しません。',
    safeExport: '安全なエクスポート',
    apiKeyRefs: 'APIキー参照',
    webhookEndpoints: 'Webhookエンドポイント',
    webhookDeliveryLog: 'Webhook配信ログ',
    webhookLogEvents: 'Webhookログ',
    deadLetters: 'デッドレター',
    sdkTargets: 'SDK targets',
    cliGuide: 'CLIガイド',
    cliCommands: 'CLIコマンド',
    openApiPaths: 'OpenAPIパス',
    testVectors: 'テストベクトル',
    conformanceResults: '互換テスト結果',
    conformanceSuites: '互換テストスイート',
    launchChecks: '導入チェック',
    fingerprint: 'Fingerprint',
    scopes: 'Scopes',
    environment: 'Environment',
    status: 'Status',
    rotated: 'Rotated',
    expires: 'Expires',
    topics: 'Topics',
    signingKey: 'Signing key ref',
    lastDelivery: 'Last delivery',
    failures: 'Failures',
    attempts: 'Attempts',
    responseCode: 'Response code',
    eventRef: 'Event ref',
    payloadFingerprint: 'Payload fingerprint',
    signatureVerified: 'Signature verified',
    install: 'Install',
    snippet: 'Snippet',
    testCommand: 'Test command',
    commandLine: 'Command',
    purpose: 'Purpose',
    highlightedPaths: 'Highlighted paths',
    topTags: 'Top tags',
    fixtureRef: 'Fixture ref',
    expectedHash: 'Expected hash',
    suite: 'Suite',
    passed: 'Passed',
    failed: 'Failed',
    updated: 'Updated',
    evidence: 'Evidence',
    nextAction: '次の対応',
    developerRoot: '開発ルート',
    noMatches: '一致する開発者レコードはありません。',
    payloadSafe: 'ペイロード安全',
    rotationDue: 'ローテーション必要',
    webhookWarnings: 'Webhook注意',
    integrationPosture: '連携状態',
    launchCenter: 'Launch Center',
    threatModelTemplate: 'Threat Model Template',
    selectedTemplate: '選択中テンプレート',
    reviewOwner: 'レビュー担当',
    protectedAssets: '保護対象',
    misuseCases: '悪用ケース',
    verificationCommands: '検証コマンド',
    noRawAddressGate: 'No raw address gate',
    surfacePolicy: 'Surface policy',
    forbiddenFields: '禁止フィールド',
    allowedSubstitutes: '公開代替値',
    preAuditChecks: '監査前チェック',
    profile: 'Profile',
    mode: 'Mode',
    externalAudit: '外部監査ready',
    deadLetterQueue: 'Webhook DLQ ready',
    auditReady: '監査準備完了',
    blockedRequired: '必須ブロック',
    missingEvidence: '不足証跡',
    presentEvidence: '確認済み証跡',
    warnings: '警告',
    privacyGoal: 'プライバシー目標',
    startHere: 'ここから開始',
    quickstart: 'クイックスタート',
    apiExplorer: 'API探索',
    sdkHub: 'SDKハブ',
    securityGate: 'セキュリティゲート',
    recommendedPath: '推奨ルート',
    protocolTrust: 'プロトコル信頼',
    localSandboxProduction: 'Local / Sandbox / Production',
    sampleRequest: 'サンプルリクエスト',
    responsePreview: 'レスポンスプレビュー',
    viewSdk: 'SDKを見る',
    viewOpenApi: 'OpenAPIを見る',
    viewLaunch: '導入ゲートを見る',
    viewVectors: 'Conformanceを見る',
    apiWorkbench: 'APIワークベンチ',
    sandbox: 'Sandbox',
    errorCatalog: 'エラーカタログ',
    retryPolicy: 'リトライ方針',
    noRawImpact: '実住所非表示の影響',
    startWithSdk: 'SDKから開始',
    featureCategories: '機能カテゴリ',
    selfHosting: 'セルフホスティング',
    deployStatus: 'デプロイ状態',
    communityResearch: 'コミュニティと研究',
    contributorPaths: '貢献パス',
    geoExamples: '地理サンプル',
    environmentGuard: '環境ガード',
    productionLocked: 'Production は導入ゲート通過までロック',
    requestBody: 'リクエスト本文',
    sdkSnippet: 'SDKスニペット',
    fix: '修正',
    cause: '原因',
    apiSurface: 'API面',
    scenario: 'シナリオ',
    examplePath: 'サンプルパス',
    viewCommunity: 'Communityを見る',
    viewGeo: 'Geo examplesを見る',
    releaseBlocked: 'ゲート通過までリリース不可',
    viewGates: 'ゲートを見る',
    docs: 'Docs',
    github: 'GitHub',
    tryIt: '試す',
    copy: 'コピー',
    params: 'Params',
    responseRedacted: 'マスク済みフィールドは非表示です。詳細データには適切なscopeが必要です。',
    overallStatus: '全体状態',
    sdkInstall: 'SDKインストール',
    releaseChecklist: 'リリースチェックリスト',
    releaseBlockers: 'リリースブロッカー',
    guidedTutorial: 'ガイド付きチュートリアル',
    allFeaturesMatrix: '全機能マトリクス',
    scenarioRecipes: 'シナリオレシピ',
    coverage: 'カバレッジ',
    feature: '機能',
    sdkAvailable: 'SDK',
    docsAvailable: 'Docs',
    tutorialAvailable: 'Tutorial',
    testsAvailable: 'Tests',
    ready: '準備完了',
    partial: '一部対応',
    preview: 'プレビュー',
    runStep: '実行',
    safeResponse: '安全なレスポンス',
    failureRecovery: '失敗時の復旧',
    copyCommand: 'コマンドをコピー',
    recipe: 'レシピ',
    audience: '対象者',
    flow: 'フロー',
    featureCoverage: '機能カバレッジ',
    coverageScore: 'カバレッジ',
    appSurfaces: 'アプリ画面',
    workflowSurfaces: 'ワークフロー画面',
    sharedPrimitives: '共通プリミティブ',
    apiSdkSurfaces: 'API / SDK surfaces',
    commandCenter: '開発コンソール',
    endpointStudio: 'APIワークベンチ',
    oneCommandSetup: 'クイックスタート',
    productionGate: 'リリースゲート',
    activePath: '現在の対象',
    copyQuickstart: 'Quickstartをコピー',
    localReady: 'ローカル準備',
    sandboxReady: 'Sandbox準備',
    releaseScore: 'リリーススコア',
    blockedItems: 'ブロック項目',
    releaseReadiness: 'リリース準備度',
    coverageSurfaces: '対応画面',
    sampleCommand: 'サンプルコマンド',
    fixReleaseGate: 'リリースゲートを修正',
    utilityActions: 'ユーティリティ',
    workbenchBody: '実住所の例を出さずに、API参照、SDK設定、互換テスト、リリース準備を確認します。',
    developerWorkflow: '開発フロー',
    runConformance: 'Conformanceを実行',
    openWorkbench: 'APIを開く',
    deployReview: '導入レビュー',
    githubReadySlice: 'GitHub公開準備スライス',
    prScope: 'PR範囲',
    sourceFiles: '対象ファイル',
    compatibilityGates: '互換ゲート',
    risk: 'リスク',
    callbackContract: 'Address Login callback contract',
    canonicalParams: '正規パラメータ',
    compatibilityAliases: '互換エイリアス',
    forbiddenCallbackParams: '禁止callback params',
    nonClaims: '非主張',
  },
};

const ADDRESS_LOGIN_CALLBACK_ALIAS_ROWS = Object.entries(VEYGRIT_ADDRESS_LOGIN_CALLBACK_PARAM_ALIASES)
  .map(([field, aliases]) => `${field}: ${aliases.join(', ')}`);

const ADDRESS_LOGIN_CALLBACK_CONTRACT_SUMMARY = [
  VEYGRIT_ADDRESS_LOGIN_CALLBACK_CONTRACT_VERSION,
  'SDK callback parsing accepts canonical params plus documented legacy aliases.',
  'Forbidden callback params are rejected before merchant code receives a result.',
] as const;

const VEYGRIT_SHIP_RELEASE_GATE_STATUS = getVeygritShipReleaseGateStatus();

const THREAT_TEMPLATE_SURFACE_MAP: Record<AddressPrivacyThreatTemplateId, NoRawAddressComplianceSurfaceId> = {
  'address-element-registration': 'address-registration-element',
  'address-portal-consent': 'address-portal',
  'pos-terminal-handoff': 'pos-terminal',
  'field-handoff-offline': 'field-handoff',
  'evidence-vault-local-ocr': 'evidence-vault',
  'hosted-registry-webhooks': 'hosted-registry-api-webhooks',
  'zk-address-predicate': 'zk-ethereum-optional',
  'agid-s-qr-nfc': 'pos-terminal',
  'locker-pudo-simulator': 'drone-locker-ops',
  'developer-console-fixtures': 'developer-console',
};

const TAB_DEFINITIONS: Array<{ id: DeveloperTab; icon: React.ComponentType<{ className?: string }>; labelKey: DeveloperCopyKey }> = [
  { id: 'overview', icon: ShieldCheck, labelKey: 'overview' },
  { id: 'tutorial', icon: Play, labelKey: 'tutorial' },
  { id: 'features', icon: Boxes, labelKey: 'features' },
  { id: 'keys', icon: KeyRound, labelKey: 'keys' },
  { id: 'webhooks', icon: Webhook, labelKey: 'webhooks' },
  { id: 'sdk', icon: Code2, labelKey: 'sdk' },
  { id: 'openapi', icon: FileJson, labelKey: 'openapi' },
  { id: 'vectors', icon: TerminalSquare, labelKey: 'vectors' },
  { id: 'launch', icon: ClipboardCheck, labelKey: 'launch' },
  { id: 'community', icon: UsersRound, labelKey: 'communityResearch' },
  { id: 'geo', icon: Map, labelKey: 'geoExamples' },
];

const DEVELOPER_HASH_TO_TAB: Record<string, DeveloperTab> = {
  '#start': 'overview',
  '#tutorial': 'tutorial',
  '#features': 'features',
  '#all-features': 'features',
  '#api': 'openapi',
  '#sandbox': 'openapi',
  '#keys': 'keys',
  '#webhooks': 'webhooks',
  '#sdk': 'sdk',
  '#vectors': 'vectors',
  '#conformance': 'vectors',
  '#deploy': 'launch',
  '#launch': 'launch',
  '#community': 'community',
  '#geo-examples': 'geo',
};

const DEVELOPER_TAB_TO_HASH: Record<DeveloperTab, string> = {
  overview: '#start',
  tutorial: '#tutorial',
  features: '#features',
  keys: '#keys',
  webhooks: '#webhooks',
  sdk: '#sdk',
  openapi: '#api',
  vectors: '#vectors',
  launch: '#deploy',
  community: '#community',
  geo: '#geo-examples',
};

function readInitialLanguage() {
  if (typeof window === 'undefined') return 'en';
  return normalizeAppLanguage(window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY) || navigator.language || 'en');
}

function readInitialDeveloperTab(): DeveloperTab {
  if (typeof window === 'undefined') return 'overview';
  return DEVELOPER_HASH_TO_TAB[window.location.hash] ?? 'overview';
}

function dateShort(value: string) {
  return value.slice(0, 10);
}

function copyFor(language: string) {
  return COPY[normalizeAppLanguage(language)];
}

function StatusPill({ status }: { status: DeveloperConsoleKeyStatus | DeveloperConsoleWebhookStatus | DeveloperConsoleWebhookDeliveryStatus | DeveloperConsoleTestStatus | DeveloperConsoleLaunchStatus | 'safe' }) {
  const good = ['active', 'healthy', 'delivered', 'pass', 'safe'].includes(status);
  const warn = ['rotation-due', 'warning', 'retrying', 'warn'].includes(status);
  return (
    <span className={cn(
      'inline-flex min-h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] font-black uppercase tracking-[0.12em]',
      good && 'border-emerald-300/70 bg-emerald-50 text-emerald-700',
      warn && 'border-amber-300/70 bg-amber-50 text-amber-700',
      !good && !warn && 'border-rose-300/70 bg-rose-50 text-rose-700',
    )}>
      {good ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {status}
    </span>
  );
}

function ReferenceStatusPill({ status }: { status: 'ready' | 'preview' }) {
  return (
    <span className={cn(
      'inline-flex min-h-6 items-center rounded-full border px-2 text-[10px] font-black uppercase tracking-[0.12em]',
      status === 'ready'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-slate-200 bg-white text-slate-600',
    )}>
      {status}
    </span>
  );
}

function MetricCard({ label, value, tone = 'neutral' }: { label: string; value: string | number; tone?: 'neutral' | 'good' | 'warn' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className={cn(
        'text-[11px] font-black uppercase tracking-[0.18em]',
        tone === 'good' && 'text-emerald-600',
        tone === 'warn' && 'text-amber-600',
        tone === 'neutral' && 'text-slate-400',
      )}>{label}</p>
      <p className="mt-2 text-2xl font-black tabular-nums text-slate-950">{value}</p>
    </div>
  );
}

function safeExportText(consoleModel: DeveloperConsole) {
  return JSON.stringify(consoleModel.safeExport, null, 2);
}

function getFilterText(consoleModel: DeveloperConsole, tab: DeveloperTab, developerExperience?: DeveloperExperienceModel) {
  if (tab === 'tutorial') {
    return [
      ...(developerExperience?.tutorialSteps ?? []).map(step => `${step.title} ${step.goal} ${step.command} ${step.docsRef} ${step.featureIds.join(' ')}`),
      ...(developerExperience?.scenarioRecipes ?? []).map(recipe => `${recipe.label} ${recipe.audience} ${recipe.flow} ${recipe.command} ${recipe.surfaces.join(' ')}`),
    ].join(' ');
  }
  if (tab === 'features') {
    return (developerExperience?.coverageRows ?? [])
      .map(row => `${row.id} ${row.label} ${row.group} ${row.summary} ${row.status} ${row.routeRef}`)
      .join(' ');
  }
  if (tab === 'keys') {
    return consoleModel.apiKeys.map(key => `${key.keyId} ${key.environment} ${key.scopes.join(' ')} ${key.status}`).join(' ');
  }
  if (tab === 'webhooks') {
    return [
      ...consoleModel.webhooks.map(webhook => `${webhook.endpointId} ${webhook.urlRef} ${webhook.topics.join(' ')} ${webhook.status}`),
      ...consoleModel.webhookLogs.map(log => `${log.deliveryId} ${log.endpointId} ${log.topic} ${log.status} ${log.eventRef}`),
    ].join(' ');
  }
  if (tab === 'sdk') {
    return [
      ...consoleModel.sdkSnippets.map(snippet => `${snippet.language} ${snippet.packageName} ${snippet.install}`),
      ...consoleModel.cliCommands.map(command => `${command.label} ${command.command} ${command.purpose}`),
    ].join(' ');
  }
  if (tab === 'openapi') {
    return `${consoleModel.openApi.topTags.join(' ')} ${consoleModel.openApi.highlightedPaths.join(' ')}`;
  }
  if (tab === 'vectors') {
    return [
      ...consoleModel.testVectors.map(vector => `${vector.vectorId} ${vector.surface} ${vector.fixtureRef}`),
      ...consoleModel.conformanceResults.map(result => `${result.suiteId} ${result.label} ${result.command} ${result.status}`),
    ].join(' ');
  }
  if (tab === 'launch') {
    return consoleModel.launchChecks.map(check => `${check.id} ${check.label} ${check.evidenceRef}`).join(' ');
  }
  if (tab === 'community') {
    return consoleModel.communityLinks.map(link => `${link.id} ${link.label} ${link.track} ${link.hrefRef} ${link.detail}`).join(' ');
  }
  if (tab === 'geo') {
    return consoleModel.geoExamples.map(example => `${example.id} ${example.label} ${example.apiSurface} ${example.examplePath} ${example.scenario}`).join(' ');
  }
  return consoleModel.developerRoot;
}

function DeveloperLaunchpad({
  t,
  model,
  launchCenter,
  noRawAddressGate,
  developerExperience,
  onTabSelect,
}: {
  t: Record<DeveloperCopyKey, string>;
  model: DeveloperConsole;
  launchCenter: AddressLaunchCenterEvaluation;
  noRawAddressGate: NoRawAddressCompliancePayloadResult;
  developerExperience: DeveloperExperienceModel;
  onTabSelect: (tab: DeveloperTab) => void;
}) {
  const quickstartCommand = model.cliCommands.find(command => command.purpose === 'quickstart')?.command
    ?? 'npm run agid -- --help';
  const conformanceCommand = model.conformanceResults.find(result => result.suiteId === 'agid-resolver-conformance')?.command
    ?? 'npm run verify:agid-resolver-conformance';
  const primarySdk = model.sdkSnippets.find(snippet => snippet.language === 'typescript') ?? model.sdkSnippets[0];
  const highlightedPath = model.openApi.highlightedPaths.find(path => path.includes('address'))
    ?? model.openApi.highlightedPaths[0]
    ?? '/openapi.json';
  const safeSampleRequest = {
    path: highlightedPath,
    method: highlightedPath === '/openapi.json' ? 'GET' : 'POST',
    body: {
      addressReferenceCommitment: 'arc_demo_ref',
      purpose: 'delivery-preview',
      locale: 'en',
    },
  };
  const safeSampleResponse = {
    ok: true,
    status: noRawAddressGate.valid ? 'ok' : 'review-required',
    alias: 'alias_demo_local',
    commitment: 'cm_demo_response_001',
    receipt: 'rcpt_demo_response',
    scope: 'delivery-preview',
    formatted: 'REDACTED_COMMITMENT_REF',
    meta: {
      source: 'fixture',
      verified: noRawAddressGate.valid,
      rawAddressReturned: false,
    },
    root: model.developerRoot,
  };
  const productionLocked = launchCenter.status !== 'ready';
  const launchItems = [
    { label: 'Security', status: launchCenter.items.find(item => item.id.includes('security') || item.id.includes('rate'))?.status ?? 'pass', detail: 'No critical issues' },
    { label: 'Privacy', status: noRawAddressGate.valid ? 'pass' : 'fail', detail: 'PII redaction enabled' },
    { label: 'Conformance', status: model.totals.failingConformance ? 'warn' : 'pass', detail: `${model.totals.conformanceSuites} suites tracked` },
    { label: 'SDK Parity', status: model.totals.failingTests ? 'warn' : 'pass', detail: `${model.totals.sdkTargets} targets` },
    { label: 'OpenAPI', status: 'pass', detail: `${model.openApi.version} valid` },
    { label: 'Webhooks', status: model.totals.webhookDeadLetters ? 'warn' : 'pass', detail: `${model.totals.webhookEndpoints} endpoints` },
    { label: 'DB', status: launchCenter.items.find(item => item.id.includes('storage'))?.status ?? 'pass', detail: 'Audit policy visible' },
    { label: 'Secrets', status: productionLocked ? 'fail' : 'pass', detail: productionLocked ? 'Production locked' : 'Rotation ready' },
  ] as const;
  const pathCards: Array<{
    id: string;
    title: string;
    detail: string;
    button: string;
    tab: DeveloperTab;
    icon: React.ComponentType<{ className?: string }>;
    tone: string;
  }> = [
    {
      id: 'api-workbench',
      title: t.apiWorkbench,
      detail: `${safeSampleRequest.method} ${safeSampleRequest.path}`,
      button: t.viewOpenApi,
      tab: 'openapi',
      icon: FileJson,
      tone: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    },
    {
      id: 'guided-tutorial',
      title: t.guidedTutorial,
      detail: `${developerExperience.summary.tutorialSteps} steps / local sandbox to safe deploy`,
      button: t.runStep,
      tab: 'tutorial',
      icon: Play,
      tone: 'border-blue-200 bg-blue-50 text-blue-700',
    },
    {
      id: 'all-features-matrix',
      title: t.allFeaturesMatrix,
      detail: `${developerExperience.summary.coverageRows} rows / ${developerExperience.summary.noRawReady} no-raw gates`,
      button: t.features,
      tab: 'features',
      icon: Boxes,
      tone: 'border-slate-200 bg-slate-100 text-slate-700',
    },
    {
      id: 'sdk-hub',
      title: t.startWithSdk,
      detail: `${model.totals.sdkTargets} SDK targets / ${model.totals.cliCommands} CLI commands`,
      button: t.viewSdk,
      tab: 'sdk',
      icon: Code2,
      tone: 'border-violet-200 bg-violet-50 text-violet-700',
    },
    {
      id: 'deploy-status',
      title: t.deployStatus,
      detail: conformanceCommand,
      button: t.viewLaunch,
      tab: 'launch',
      icon: ShieldCheck,
      tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      id: 'community-research',
      title: t.communityResearch,
      detail: 'Spec / AMT / Secure Address QR / ZK-ready / grants',
      button: t.viewCommunity,
      tab: 'community',
      icon: UsersRound,
      tone: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    },
    {
      id: 'geo-examples',
      title: t.geoExamples,
      detail: 'Grid / postal / building / sea / mountain / POS / drone',
      button: t.viewGeo,
      tab: 'geo',
      icon: Map,
      tone: 'border-teal-200 bg-teal-50 text-teal-700',
    },
  ];
  const trustItems = [
    { label: t.payloadSafe, value: model.accepted ? 'OK' : 'BLOCKED', status: model.accepted ? 'pass' : 'fail' },
    { label: t.noRawAddressGate, value: noRawAddressGate.valid ? 'PASS' : 'FAIL', status: noRawAddressGate.valid ? 'pass' : 'fail' },
    { label: t.launchCenter, value: launchCenter.status.toUpperCase(), status: launchCenter.status },
    { label: t.conformanceSuites, value: String(model.totals.conformanceSuites), status: model.totals.failingConformance ? 'warn' : 'pass' },
    { label: t.featureCoverage, value: String(developerExperience.summary.coverageRows), status: 'pass' },
  ] as const;

  return (
    <section className="mb-4 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-100 bg-rose-50/80 px-4 py-3">
        <div className="inline-flex items-center gap-2 text-sm font-black text-rose-700">
          <ShieldAlert className="h-4 w-4" />
          {productionLocked ? t.releaseBlocked : 'Ready for release'}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {launchItems.slice(0, 8).map(item => (
            <span key={item.label} className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-700 shadow-sm">
              {item.status === 'pass' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
              {item.label}
            </span>
          ))}
          <button
            type="button"
            onClick={() => onTabSelect('launch')}
            className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
          >
            {t.viewGates}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[240px_minmax(0,1fr)_410px]">
        <aside className="bg-slate-950 p-4 text-white">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <FileJson className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{t.apiWorkbench}</p>
              <p className="text-sm font-black text-white">API surfaces</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 xl:grid xl:overflow-visible xl:pb-0">
            {model.featureCategories.map((category, index) => {
              const icons = [ShieldCheck, FileJson, Webhook, ClipboardCheck, ServerCog, Database, LockKeyhole];
              const Icon = icons[index % icons.length];
              const active = index === 0;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onTabSelect(category.id === 'webhooks' ? 'webhooks' : category.id === 'country-packs' ? 'geo' : category.id === 'zk' ? 'vectors' : category.id === 'address-element' ? 'sdk' : 'openapi')}
                  className={cn(
                    'flex min-w-[190px] items-start gap-3 rounded-xl p-3 text-left transition xl:min-w-0',
                    active ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/20' : 'text-slate-200 hover:bg-white/10',
                  )}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <span className="block text-sm font-black">{category.label}</span>
                    <span className={cn('mt-0.5 hidden text-xs font-semibold leading-4 sm:block', active ? 'text-blue-50' : 'text-slate-400')}>
                      {category.summary}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 hidden border-t border-white/10 pt-4 xl:block">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Resources</p>
            <div className="mt-3 grid gap-2">
              {[
                { label: 'OpenAPI', icon: FileJson, tab: 'openapi' as DeveloperTab },
                { label: 'SDKs', icon: Code2, tab: 'sdk' as DeveloperTab },
                { label: 'Status', icon: ServerCog, tab: 'launch' as DeveloperTab },
                { label: 'GitHub', icon: Github, tab: 'community' as DeveloperTab },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => onTabSelect(item.tab)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="grid gap-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-slate-950">Resolver</h2>
                    <span className="rounded-md bg-emerald-50 px-2 py-1 font-mono text-xs font-black text-emerald-700">POST</span>
                    <span className="font-mono text-sm font-black text-slate-600">{safeSampleRequest.path}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    Resolve an AGID, alias, or commitment into privacy-preserving delivery metadata. Samples never require raw address text.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onTabSelect('openapi')}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm hover:bg-blue-700"
                >
                  <Play className="h-4 w-4" />
                  {t.tryIt}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  ['Auth', 'Bearer / API key ref'],
                  ['Rate limit', '100 req/min'],
                  ['Caching', '60s'],
                  ['Idempotent', 'yes'],
                ].map(([label, value]) => (
                  <span key={label} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                    <span className="text-slate-400">{label}</span>
                    <span className="text-slate-800">{value}</span>
                  </span>
                ))}
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div>
                  <div className="flex items-center gap-4 border-b border-slate-200">
                    {['Params', 'Headers', 'Body', 'Auth'].map((label, index) => (
                      <button
                        key={label}
                        type="button"
                        className={cn(
                          'h-10 border-b-2 text-sm font-black',
                          index === 0 ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500',
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="mt-3 w-full min-w-[520px] text-left text-sm">
                      <thead>
                        <tr className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                          <th className="py-2">Parameter</th>
                          <th className="py-2">Type</th>
                          <th className="py-2">Required</th>
                          <th className="py-2">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-650">
                        {[
                          ['id', 'string', 'yes', 'AGID, DID, alias, or commitment to resolve'],
                          ['include', 'string[]', 'no', 'Fields to include in redacted output'],
                          ['redact', 'boolean', 'no', 'Apply privacy redaction'],
                          ['lang', 'string', 'no', 'Response language BCP-47'],
                        ].map(row => (
                          <tr key={row[0]}>
                            <td className="py-2 font-mono font-black text-slate-900">{row[0]}</td>
                            <td className="py-2"><span className="rounded-md bg-violet-50 px-2 py-1 font-mono text-xs font-black text-violet-700">{row[1]}</span></td>
                            <td className="py-2">{row[2] === 'yes' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <span className="text-slate-400">-</span>}</td>
                            <td className="py-2 text-slate-600">{row[3]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <CodeBlock label={t.sdkInstall} value={primarySdk?.install ?? 'npm install @agid/sdk'} />
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">SDKs</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {model.sdkSnippets.slice(0, 8).map(snippet => (
                        <span key={snippet.language} className="rounded-md bg-white px-2 py-1 text-[11px] font-black uppercase text-slate-700 shadow-sm">
                          {snippet.language}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <CodeBlock label={t.sdkSnippet} value={primarySdk?.snippet ?? quickstartCommand} />
              </div>
            </section>

            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {pathCards.map(card => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => onTabSelect(card.tab)}
                    className="group grid min-h-[118px] gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl border', card.tone)}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-950">{card.title}</h3>
                      <p className="mt-1 line-clamp-2 font-mono text-xs font-bold leading-5 text-slate-500">{card.detail}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="grid gap-4 border-t border-slate-200 bg-slate-50 p-4 xl:border-l xl:border-t-0">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-950">{t.responsePreview}</p>
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-mono text-xs font-black text-emerald-700">200 OK</span>
            </div>
            <CodeBlock label="" value={JSON.stringify(safeSampleResponse, null, 2)} />
            <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs font-bold leading-5 text-blue-700">
              {t.responseRedacted}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-slate-950">{t.errorCatalog}</p>
              <button type="button" onClick={() => onTabSelect('openapi')} className="text-xs font-black text-blue-700 hover:text-blue-900">
                View all
              </button>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[330px] text-left text-xs">
                <thead className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  <tr>
                    <th className="py-2">HTTP</th>
                    <th className="py-2">Code</th>
                    <th className="py-2">Retry</th>
                    <th className="py-2">Privacy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                  {model.apiErrorExamples.map(error => (
                    <tr key={error.code}>
                      <td className="py-2"><span className="rounded-md bg-rose-50 px-2 py-1 font-mono font-black text-rose-700">{error.statusCode}</span></td>
                      <td className="py-2 font-mono text-[11px] font-black">{error.code}</td>
                      <td className="py-2">{error.retryable ? 'yes' : 'no'}</td>
                      <td className="py-2">{error.noRawAddressImpact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{t.releaseChecklist}</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">{t.overallStatus}</h3>
              </div>
              <span className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-black uppercase',
                productionLocked ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700',
              )}>
                {productionLocked ? 'blocked' : 'ready'}
              </span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {launchItems.map(item => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    {item.status === 'pass' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    <p className="text-sm font-black text-slate-900">{item.label}</p>
                  </div>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <ServerCog className="h-5 w-5 text-blue-600" />
                <p className="text-sm font-black text-slate-950">{t.selfHosting}</p>
              </div>
              <div className="mt-3 grid gap-2">
                {model.selfHostingOptions.map(option => (
                  <div key={option.mode} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black text-slate-950">{option.label}</p>
                      <ReferenceStatusPill status={option.status} />
                    </div>
                    <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{option.requirements.slice(0, 3).join(' / ')}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Map className="h-5 w-5 text-teal-600" />
                <p className="text-sm font-black text-slate-950">{t.geoExamples}</p>
              </div>
              <div className="mt-3 grid gap-2">
                {model.geoExamples.slice(0, 5).map(example => (
                  <button
                    key={example.id}
                    type="button"
                    onClick={() => onTabSelect('geo')}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-left text-xs font-black text-slate-700 hover:border-teal-200 hover:text-teal-700"
                  >
                    {example.label}
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

function DeveloperCommandCenter({
  t,
  model,
  launchCenter,
  noRawAddressGate,
  developerExperience,
  activeTab,
  onTabSelect,
}: {
  t: Record<DeveloperCopyKey, string>;
  model: DeveloperConsole;
  launchCenter: AddressLaunchCenterEvaluation;
  noRawAddressGate: NoRawAddressCompliancePayloadResult;
  developerExperience: DeveloperExperienceModel;
  activeTab: DeveloperTab;
  onTabSelect: (tab: DeveloperTab) => void;
}) {
  const quickstartCommand = model.cliCommands.find(command => command.purpose === 'quickstart')?.command
    ?? 'npm run agid -- --help';
  const conformanceCommand = model.conformanceResults.find(result => result.suiteId === 'agid-resolver-conformance')?.command
    ?? 'npm run verify:agid-resolver-conformance';
  const primarySdk = model.sdkSnippets.find(snippet => snippet.language === 'typescript') ?? model.sdkSnippets[0];
  const activePath = activeTab === 'launch'
    ? '/launch-checks'
    : activeTab === 'sdk'
      ? primarySdk?.packageName ?? '@agid/sdk'
      : activeTab === 'vectors'
        ? conformanceCommand
        : model.openApi.highlightedPaths[0] ?? '/openapi.json';
  const blockedRequired = launchCenter.totals.blockedRequired;
  const releaseReady = launchCenter.status === 'ready' && noRawAddressGate.valid && model.accepted;
  const statusCards = [
    {
      label: t.localReady,
      value: 'local',
      detail: quickstartCommand,
      status: 'pass',
      tab: 'tutorial' as DeveloperTab,
      icon: TerminalSquare,
    },
    {
      label: t.sandboxReady,
      value: `${model.openApi.pathCount} paths`,
      detail: `${model.totals.webhookEndpoints} ${t.webhookEndpoints} / ${model.totals.sdkTargets} ${t.sdkTargets}`,
      status: model.totals.webhookFailures ? 'warn' : 'pass',
      tab: 'openapi' as DeveloperTab,
      icon: FileJson,
    },
    {
      label: t.productionGate,
      value: releaseReady ? t.ready : t.releaseBlocked,
      detail: blockedRequired > 0 ? `${blockedRequired} ${t.blockedItems}` : t.auditReady,
      status: releaseReady ? 'pass' : 'fail',
      tab: 'launch' as DeveloperTab,
      icon: ShieldAlert,
    },
  ];
  const workflowCards: Array<{
    label: string;
    detail: string;
    tab: DeveloperTab;
    icon: typeof Play;
    href?: string;
  }> = [
    { label: t.openWorkbench, detail: model.openApi.highlightedPaths[0] ?? '/openapi.json', tab: 'openapi' as DeveloperTab, icon: Play },
    { label: t.viewSdk, detail: primarySdk?.install ?? 'npm install @agid/sdk', tab: 'sdk' as DeveloperTab, icon: Code2 },
    { label: 'Vey Ecosystem', detail: 'Wallet + Delivery Gateway + Carrier API Stripe', tab: 'sdk' as DeveloperTab, icon: ServerCog, href: '/merchant-console' },
    { label: t.runConformance, detail: conformanceCommand, tab: 'vectors' as DeveloperTab, icon: ListChecks },
    { label: t.deployReview, detail: launchCenter.nextActions[0] ?? t.auditReady, tab: 'launch' as DeveloperTab, icon: ClipboardCheck },
  ];
  const primaryPrSlice = developerExperience.prReadinessSlices.find(slice => slice.id === 'developer-console-app-shell')
    ?? developerExperience.prReadinessSlices[0];

  return (
    <section
      className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      data-developer-command-center
    >
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-white p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
            <Code2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-500">{t.commandCenter}</p>
            <h2 className="mt-0.5 text-2xl font-black tracking-tight text-slate-950">{t.endpointStudio}</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              {t.workbenchBody}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onTabSelect('openapi')}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-blue-700"
          >
            <Play className="h-4 w-4" />
            {t.openWorkbench}
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(quickstartCommand)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:border-blue-300 hover:text-blue-700"
          >
            <Copy className="h-4 w-4" />
            {t.copyQuickstart}
          </button>
        </div>
      </div>

      <div className="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.55fr)]">
            <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-slate-950">{t.activePath}</p>
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">{t.noRawAddressGate}</span>
              </div>
              <p className="mt-2 break-all font-mono text-sm font-black text-slate-900">{activePath}</p>
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-black text-slate-500">{t.oneCommandSetup}</p>
                  <span className="text-xs font-bold text-slate-400">{t.sampleCommand}</span>
                </div>
                <pre className="mt-2 overflow-auto rounded-md bg-slate-100 px-3 py-2 font-mono text-xs font-bold leading-6 text-slate-800">{quickstartCommand}</pre>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">{t.productionGate}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{launchCenter.nextActions[0] ?? t.auditReady}</p>
                </div>
                <span className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-black uppercase',
                  releaseReady ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
                )}>
                  {releaseReady ? 'ready' : 'blocked'}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-500">{t.releaseScore}</p>
                  <p className="mt-1 text-3xl font-black tabular-nums text-slate-950">{launchCenter.score}<span className="text-sm font-black text-slate-400">/100</span></p>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">{t.releaseReadiness}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">{t.coverageScore}</p>
                  <p className="mt-1 text-3xl font-black tabular-nums text-slate-950">{developerExperience.summary.coverageRows}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">{t.coverageSurfaces}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onTabSelect('launch')}
                className={cn(
                  'mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-black transition',
                  releaseReady
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300'
                    : 'bg-rose-600 text-white hover:bg-rose-700',
                )}
              >
                <ClipboardCheck className="h-4 w-4" />
                {releaseReady ? t.viewGates : t.fixReleaseGate}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2 2xl:grid-cols-4">
            {workflowCards.map(card => {
              const Icon = card.icon;
              return (
                <button
                  key={card.label}
                  type="button"
                  onClick={() => {
                    if (card.href) {
                      window.location.href = card.href;
                      return;
                    }
                    onTabSelect(card.tab);
                  }}
                  className="group flex min-h-[76px] items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:shadow-sm"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-slate-950">{card.label}</span>
                    <span className="mt-0.5 block truncate font-mono text-[11px] font-bold text-slate-500">{card.detail}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                </button>
              );
            })}
          </div>

          {primaryPrSlice && (
            <PrReadinessPanel
              t={t}
              slice={primaryPrSlice}
            />
          )}
        </div>

        <aside className="min-w-0 border-t border-slate-200 bg-slate-50 p-4 sm:p-5 xl:border-l xl:border-t-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-slate-950">{t.releaseChecklist}</p>
            <span className={cn(
              'rounded-md px-2.5 py-1 text-xs font-black uppercase',
              releaseReady ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
            )}>
              {launchCenter.status}
            </span>
          </div>
          <div className="mt-3 grid gap-2">
            {statusCards.map(card => {
              const Icon = card.icon;
              return (
                <button
                  key={card.label}
                  type="button"
                  onClick={() => onTabSelect(card.tab)}
                  className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-blue-300 hover:shadow-sm"
                >
                  <span className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg',
                    card.status === 'pass' && 'bg-emerald-50 text-emerald-700',
                    card.status === 'warn' && 'bg-amber-50 text-amber-700',
                    card.status === 'fail' && 'bg-rose-50 text-rose-700',
                  )}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-slate-950">{card.label}</span>
                    <span className="block truncate text-xs font-semibold text-slate-500">{card.detail}</span>
                  </span>
                  <span className={cn(
                    'rounded-md px-2 py-1 text-[10px] font-black uppercase',
                    card.status === 'pass' && 'bg-emerald-100 text-emerald-700',
                    card.status === 'warn' && 'bg-amber-100 text-amber-700',
                    card.status === 'fail' && 'bg-rose-100 text-rose-700',
                  )}>
                    {card.status}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}

function PrReadinessPanel({
  t,
  slice,
}: {
  t: Record<DeveloperCopyKey, string>;
  slice: DeveloperPrReadinessSlice;
}) {
  return (
    <section
      className="mt-4 rounded-lg border border-slate-200 bg-white p-4"
      data-developer-pr-readiness
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-950">{t.githubReadySlice}</p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950">{slice.label}</h3>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            {slice.scope}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={cn(
            'rounded-md px-2.5 py-1 text-xs font-black uppercase',
            slice.status === 'ready' && 'bg-emerald-50 text-emerald-700',
            slice.status === 'partial' && 'bg-amber-50 text-amber-700',
            slice.status === 'preview' && 'bg-blue-50 text-blue-700',
          )}>
            {slice.status}
          </span>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-black uppercase text-slate-700">
            {t.risk}: {slice.risk}
          </span>
          {slice.noRawGate && (
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
              {t.noRawAddressGate}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-black text-slate-500">{t.sourceFiles}</p>
          <div className="mt-2 grid gap-2">
            {slice.files.map(file => (
              <code key={file} className="block truncate rounded-md bg-white px-2.5 py-1.5 text-xs font-black text-slate-700 shadow-sm">
                {file}
              </code>
            ))}
          </div>
        </div>
        <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-black text-slate-500">{t.compatibilityGates}</p>
          <div className="mt-2 grid gap-2">
            {slice.gates.map(gate => (
              <code key={gate} className="block truncate rounded-md bg-white px-2.5 py-1.5 text-xs font-black text-slate-700 shadow-sm">
                {gate}
              </code>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatConsoleNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

function DeveloperAdminSidebar({
  t,
  activeTab,
  model,
  launchCenter,
  onTabSelect,
}: {
  t: Record<DeveloperCopyKey, string>;
  activeTab: DeveloperTab;
  model: DeveloperConsole;
  launchCenter: AddressLaunchCenterEvaluation;
  onTabSelect: (tab: DeveloperTab) => void;
}) {
  const releaseReady = launchCenter.status === 'ready' && model.accepted;
  return (
    <aside
      className="hidden min-h-[calc(100dvh-92px)] rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-sm lg:block"
      data-developer-admin-sidebar
    >
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Code2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-black leading-5">AGID</p>
            <p className="mt-1 text-xs font-bold text-slate-300">Developer Console</p>
          </div>
        </div>
      </div>

      <nav className="grid gap-1 p-3" aria-label="Developer Console sidebar">
        {TAB_DEFINITIONS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabSelect(tab.id)}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-black transition',
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="min-w-0 flex-1 truncate">{t[tab.labelKey]}</span>
              {tab.id === 'tutorial' && (
                <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-black text-slate-950">6</span>
              )}
              {tab.id === 'launch' && (
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-black',
                  releaseReady ? 'bg-emerald-400 text-slate-950' : 'bg-amber-300 text-slate-950',
                )}>
                  {launchCenter.score}%
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mx-3 mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Current plan</p>
          <button type="button" className="text-xs font-black text-blue-300 hover:text-white">Change</button>
        </div>
        <p className="mt-3 text-lg font-black">Local OSS</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-blue-500"
            style={{ width: `${Math.min(100, Math.max(0, launchCenter.score))}%` }}
          />
        </div>
        <p className="mt-2 text-xs font-bold text-slate-300">
          {launchCenter.score}% {t.releaseReadiness}
        </p>
      </div>
    </aside>
  );
}

function DeveloperAdminOverview({
  t,
  model,
  launchCenter,
  developerExperience,
  onTabSelect,
}: {
  t: Record<DeveloperCopyKey, string>;
  model: DeveloperConsole;
  launchCenter: AddressLaunchCenterEvaluation;
  developerExperience: DeveloperExperienceModel;
  onTabSelect: (tab: DeveloperTab) => void;
}) {
  const delivered = model.webhookLogs.filter(log => log.status === 'delivered').length;
  const webhookSuccess = model.webhookLogs.length ? Math.round((delivered / model.webhookLogs.length) * 10000) / 100 : 100;
  const readyFeatures = developerExperience.coverageRows.filter(row => row.status === 'ready').length;
  const dashboardStats = [
    { label: 'API request fixtures', value: formatConsoleNumber(model.openApi.pathCount * 12848), trend: `${model.openApi.pathCount} OpenAPI paths`, tone: 'blue' },
    { label: 'Verified surfaces', value: formatConsoleNumber(readyFeatures), trend: `${developerExperience.summary.coverageRows} coverage rows`, tone: 'emerald' },
    { label: 'SDK targets', value: formatConsoleNumber(model.totals.sdkTargets), trend: `${model.totals.cliCommands} CLI commands`, tone: 'violet' },
    { label: 'Webhook success', value: `${webhookSuccess}%`, trend: `${model.totals.webhookDeadLetters} dead letters`, tone: model.totals.webhookDeadLetters ? 'amber' : 'emerald' },
    { label: 'Launch score', value: `${launchCenter.score}%`, trend: launchCenter.status, tone: launchCenter.status === 'ready' ? 'emerald' : 'amber' },
  ];
  const quickstartSteps = [
    { label: 'Create API ref', tab: 'keys' as DeveloperTab, done: model.totals.activeKeys > 0 },
    { label: 'Resolve AGID', tab: 'openapi' as DeveloperTab, done: true },
    { label: 'Issue Secure QR', tab: 'tutorial' as DeveloperTab, done: true },
    { label: 'Receive webhook', tab: 'webhooks' as DeveloperTab, done: model.totals.webhookEndpoints > 0 },
    { label: 'Install SDK', tab: 'sdk' as DeveloperTab, done: model.totals.sdkTargets > 0 },
    { label: 'Run conformance', tab: 'vectors' as DeveloperTab, done: model.totals.failingConformance === 0 },
  ];
  const usageRows = [
    { label: 'Resolver', value: '52%', count: model.openApi.pathCount * 3901, color: 'bg-blue-500' },
    { label: 'Secure QR', value: '24%', count: model.totals.testVectors * 1800, color: 'bg-violet-500' },
    { label: 'Geo / Postal', value: '12%', count: model.totals.geoExamples * 2100, color: 'bg-cyan-500' },
    { label: 'Webhooks', value: '6%', count: model.totals.webhookLogEvents * 1200, color: 'bg-orange-400' },
    { label: 'Other', value: '6%', count: developerExperience.summary.sharedPrimitives * 900, color: 'bg-slate-400' },
  ];

  return (
    <div className="grid gap-4" data-developer-admin-dashboard>
      <section className="grid gap-3 xl:grid-cols-5">
        {dashboardStats.map(stat => (
          <article key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{stat.value}</p>
            <p className={cn(
              'mt-2 text-xs font-black',
              stat.tone === 'blue' && 'text-blue-600',
              stat.tone === 'emerald' && 'text-emerald-600',
              stat.tone === 'violet' && 'text-violet-600',
              stat.tone === 'amber' && 'text-amber-600',
            )}>
              {stat.trend}
            </p>
            <div className="mt-3 flex h-8 items-end gap-1">
              {[28, 34, 30, 42, 38, 50, 45, 58, 53, 64, 59, 70].map((height, index) => (
                <span
                  key={`${stat.label}-${index}`}
                  className={cn(
                    'flex-1 rounded-t',
                    stat.tone === 'blue' && 'bg-blue-100',
                    stat.tone === 'emerald' && 'bg-emerald-100',
                    stat.tone === 'violet' && 'bg-violet-100',
                    stat.tone === 'amber' && 'bg-amber-100',
                  )}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950">{t.quickstart}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">A compact path from local sandbox to safe release, without raw address examples.</p>
            </div>
            <button
              type="button"
              onClick={() => onTabSelect('tutorial')}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-black text-white hover:bg-blue-700"
            >
              {t.runStep}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-6">
            {quickstartSteps.map((step, index) => (
              <button
                key={step.label}
                type="button"
                onClick={() => onTabSelect(step.tab)}
                className="group min-h-[96px] rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-blue-300 hover:bg-white hover:shadow-sm"
              >
                <span className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-black',
                  step.done ? 'bg-blue-600 text-white' : 'bg-white text-slate-500',
                )}>
                  {index + 1}
                </span>
                <span className="mt-3 block text-sm font-black text-slate-950">{step.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <CodeBlock label={t.sampleRequest} value={model.cliCommands.find(command => command.purpose === 'quickstart')?.command ?? 'npm run dev'} />
            <CodeBlock label={t.responsePreview} value={'{\n  "status": "valid",\n  "rawAddressReturned": false,\n  "commitment": "REDACTED_COMMITMENT_REF",\n  "receipt": "rcpt_dev_0123"\n}'} />
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-950">Usage snapshot</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Local fixture mix by developer surface.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{t.overallStatus}</span>
          </div>
          <div className="mt-5 grid gap-3">
            {usageRows.map(row => (
              <div key={row.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-800">{row.label}</p>
                    <p className="text-sm font-black text-slate-500">{row.value}</p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={cn('h-full rounded-full', row.color)} style={{ width: row.value }} />
                  </div>
                </div>
                <p className="font-mono text-xs font-black text-slate-500">{formatConsoleNumber(row.count)}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black tracking-tight text-slate-950">Recent activity</h2>
            <button type="button" onClick={() => onTabSelect('webhooks')} className="text-sm font-black text-blue-600 hover:text-blue-800">View all</button>
          </div>
          <div className="mt-4 grid gap-3">
            {model.webhookLogs.slice(0, 5).map(log => (
              <button
                key={log.deliveryId}
                type="button"
                onClick={() => onTabSelect('webhooks')}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-left hover:border-blue-300 hover:bg-white"
              >
                <span className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full',
                  log.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                )}>
                  {log.status === 'delivered' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-mono text-sm font-black text-slate-950">{log.topic}</span>
                  <span className="block truncate text-xs font-semibold text-slate-500">{log.eventRef}</span>
                </span>
                <span className="text-xs font-bold text-slate-500">{dateShort(log.occurredAt)}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black tracking-tight text-slate-950">Support & resources</h2>
          <div className="mt-4 grid gap-2">
            {[
              { label: t.docs, detail: 'API reference and tutorials', tab: 'community' as DeveloperTab, icon: BookOpen },
              { label: t.apiWorkbench, detail: 'Redacted request and response preview', tab: 'openapi' as DeveloperTab, icon: FileJson },
              { label: t.sdkHub, detail: `${model.totals.sdkTargets} SDK targets`, tab: 'sdk' as DeveloperTab, icon: Code2 },
              { label: t.releaseChecklist, detail: launchCenter.nextActions[0] ?? t.auditReady, tab: 'launch' as DeveloperTab, icon: ShieldCheck },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onTabSelect(item.tab)}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-left hover:border-blue-300 hover:bg-white"
                >
                  <Icon className="h-5 w-5 text-blue-600" />
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-slate-950">{item.label}</span>
                    <span className="block truncate text-xs font-semibold text-slate-500">{item.detail}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}

function DeveloperApiKeysAdminPanel({
  t,
  model,
}: {
  t: Record<DeveloperCopyKey, string>;
  model: DeveloperConsole;
}) {
  const successRate = model.webhookLogs.length
    ? Math.round((model.webhookLogs.filter(log => log.status === 'delivered').length / model.webhookLogs.length) * 10000) / 100
    : 100;
  const remainingRequests = 5000000 - 2450892;
  const securityScore = model.totals.rotationDueKeys > 0 ? 92 : 98;
  const apiKeyMetrics = [
    { label: 'Monthly requests', value: '2,450,892', detail: '+12.5%', tone: 'blue' },
    { label: 'Success rate', value: `${successRate}%`, detail: '+0.4%', tone: 'emerald' },
    { label: 'Remaining quota', value: formatConsoleNumber(remainingRequests), detail: '49% used', tone: 'blue' },
    { label: 'Active keys', value: `${model.totals.activeKeys} / ${model.apiKeys.length + 8}`, detail: `${model.totals.rotationDueKeys} rotation due`, tone: model.totals.rotationDueKeys ? 'amber' : 'emerald' },
    { label: 'Webhook links', value: `${model.totals.webhookEndpoints}`, detail: `${model.totals.webhookFailures} failures`, tone: model.totals.webhookFailures ? 'amber' : 'emerald' },
    { label: 'Security score', value: `${securityScore} /100`, detail: securityScore >= 90 ? 'good' : 'review', tone: securityScore >= 90 ? 'emerald' : 'amber' },
  ];
  const recentAccess = model.webhookLogs.slice(0, 5).map(log => ({
    method: log.topic === 'handoff.completed' ? 'POST' : log.topic === 'credential.revoked' ? 'PATCH' : 'GET',
    path: log.topic === 'handoff.completed' ? '/v1/handoff/verify' : log.topic === 'credential.revoked' ? '/v1/credential/revoke' : '/v1/address/verify',
    status: log.responseCode,
    ip: log.status === 'delivered' ? '203.0.113.10' : '198.51.100.11',
  }));

  return (
    <div className="grid gap-4" data-developer-api-key-admin>
      <section className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">API keys</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Create, scope, rotate, and audit AGID API key references without exposing key material.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-blue-700"
        >
          <KeyRound className="h-4 w-4" />
          Create new API key
        </button>
      </section>

      <section className="grid gap-3 xl:grid-cols-6">
        {apiKeyMetrics.map(metric => (
          <article key={metric.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-slate-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{metric.value}</p>
            <p className={cn(
              'mt-2 text-xs font-black',
              metric.tone === 'blue' && 'text-blue-600',
              metric.tone === 'emerald' && 'text-emerald-600',
              metric.tone === 'amber' && 'text-amber-600',
            )}>
              {metric.detail}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="border-b border-slate-200 pb-3">
            <div className="flex flex-wrap gap-2">
              {['API key list', 'Permissions', 'Usage', 'Access logs', 'Security'].map((tab, index) => (
                <button
                  key={tab}
                  type="button"
                  className={cn(
                    'min-h-9 rounded-lg px-3 text-sm font-black',
                    index === 0 ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950',
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <label className="flex min-h-10 min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
              <Search className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-400">Search key refs or notes</span>
            </label>
            <select className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700" defaultValue="all">
              <option value="all">All environments</option>
              <option value="local">Local</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
            <select className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700" defaultValue="all">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="rotation-due">Rotation due</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <div className="hidden grid-cols-[minmax(220px,1.4fr)_110px_1fr_110px_110px_110px] gap-3 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400 lg:grid">
              <span>Key ref / note</span>
              <span>Environment</span>
              <span>Scopes</span>
              <span>Rotated</span>
              <span>Expires</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-slate-200">
              {model.apiKeys.map((key, index) => (
                <article
                  key={key.keyId}
                  className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(220px,1.4fr)_110px_1fr_110px_110px_110px] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        key.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                      )}>
                        <KeyRound className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-black text-slate-950">{key.label}</h3>
                        <p className="truncate font-mono text-xs font-bold text-slate-500">{key.keyId}</p>
                      </div>
                    </div>
                    <p className="mt-2 truncate rounded-md bg-slate-50 px-2 py-1 font-mono text-xs font-bold text-slate-600">
                      {key.fingerprint}
                    </p>
                  </div>
                  <span className={cn(
                    'w-fit rounded-md px-2.5 py-1 text-xs font-black uppercase',
                    key.environment === 'production' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700',
                  )}>
                    {key.environment}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {key.scopes.slice(0, 3).map(scope => (
                      <span key={scope} className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-black text-blue-700">{scope}</span>
                    ))}
                    {key.scopes.length > 3 && (
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">+{key.scopes.length - 3}</span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-600">{dateShort(key.rotatedAt)}</span>
                  <span className="text-sm font-bold text-slate-600">{dateShort(key.expiresAt)}</span>
                  <div className="flex items-center gap-2">
                    <StatusPill status={key.status} />
                    <button type="button" className="rounded-md px-2 py-1 text-sm font-black text-slate-500 hover:bg-slate-100">...</button>
                  </div>
                  {index === model.apiKeys.length - 1 && (
                    <div className="lg:col-span-6">
                      <button
                        type="button"
                        className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-blue-300 bg-blue-50/40 text-sm font-black text-blue-700 hover:bg-blue-50"
                      >
                        <KeyRound className="h-4 w-4" />
                        Create another API key ref
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </article>

        <aside className="grid gap-4">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black text-slate-950">Create new API key</h3>
            <div className="mt-4 grid gap-3">
              <Info label="Key name" value="Production shipping connector" />
              <Info label="Environment" value="Production" />
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-black text-slate-500">Selected scopes</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['Address API', 'Postcode API', 'GeoID API', 'Validation API'].map(scope => (
                    <span key={scope} className="rounded-md bg-blue-100 px-2 py-1 text-xs font-black text-blue-700">{scope}</span>
                  ))}
                </div>
              </div>
              <button type="button" className="min-h-11 rounded-lg bg-blue-600 text-sm font-black text-white hover:bg-blue-700">
                Create API key ref
              </button>
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-slate-950">IP allowlist</h3>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">on</span>
            </div>
            <div className="mt-4 grid gap-2">
              {['203.0.113.0/24', '198.51.100.10', '198.51.100.11'].map((ip, index) => (
                <div key={ip} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                  <span className="font-mono text-xs font-black text-slate-700">{ip}</span>
                  <span className="text-xs font-bold text-slate-500">{['Production', 'Office', 'CI/CD'][index]}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black text-slate-950">Security settings</h3>
            <div className="mt-4 grid gap-2">
              {[
                ['Rotation', '90 days'],
                ['Rate limit', '5,000 req/min'],
                ['Anomaly detection', 'enabled'],
                ['Two-factor review', 'enabled'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-sm font-bold text-slate-600">{label}</span>
                  <span className="text-sm font-black text-emerald-700">{value}</span>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-black text-slate-950">Usage this month</h3>
            <button type="button" className="text-sm font-black text-blue-600 hover:text-blue-800">Detailed report</button>
          </div>
          <div className="mt-5 flex h-48 items-end gap-1 rounded-xl bg-slate-50 p-4">
            {[38, 45, 42, 50, 48, 54, 58, 52, 64, 61, 68, 78, 72, 80, 76, 66].map((height, index) => (
              <span key={index} className="flex-1 rounded-t bg-blue-400/70" style={{ height: `${height}%` }} />
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-black text-slate-950">Recent access</h3>
            <button type="button" className="text-sm font-black text-blue-600 hover:text-blue-800">View all</button>
          </div>
          <div className="mt-4 grid gap-2">
            {recentAccess.map(access => (
              <div key={`${access.method}-${access.path}-${access.ip}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="min-w-0 truncate font-mono text-xs font-black text-slate-700">{access.method} {access.path}</span>
                <span className="font-mono text-xs font-bold text-slate-500">{access.ip}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function CoverageStatusPill({ status }: { status: DeveloperFeatureCoverageRow['status'] | DeveloperTutorialStep['status'] | DeveloperScenarioRecipe['status'] }) {
  return (
    <span className={cn(
      'inline-flex min-h-6 items-center rounded-full border px-2 text-[10px] font-black uppercase tracking-[0.12em]',
      status === 'ready' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
      status === 'partial' && 'border-amber-200 bg-amber-50 text-amber-700',
      status === 'preview' && 'border-slate-200 bg-white text-slate-600',
    )}>
      {status}
    </span>
  );
}

function CoverageCheck({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center justify-center gap-1 rounded-full border px-2 text-[10px] font-black uppercase tracking-[0.1em]',
        active
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-slate-50 text-slate-400',
      )}
      title={label}
    >
      {active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5 text-center">-</span>}
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

function TutorialStepCard({
  t,
  step,
  featured = false,
}: {
  t: Record<DeveloperCopyKey, string>;
  step: DeveloperTutorialStep;
  featured?: boolean;
}) {
  return (
    <article id={step.id} className={cn(
      'rounded-xl border bg-white p-5 shadow-sm',
      featured ? 'border-blue-200' : 'border-slate-200',
    )}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
              {step.step}
            </span>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">{t.guidedTutorial}</p>
            <CoverageStatusPill status={step.status} />
          </div>
          <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950">{step.title}</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{step.goal}</p>
        </div>
        <button
          type="button"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-black text-blue-700 hover:border-blue-300 hover:bg-blue-100"
        >
          <Play className="h-4 w-4" />
          {t.runStep}
        </button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid gap-3">
          <CodeBlock label={t.copyCommand} value={step.command} />
          <CodeBlock label={t.requestBody} value={step.request} />
        </div>
        <div className="grid gap-3">
          <CodeBlock label={t.safeResponse} value={step.expectedResponse} />
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs font-bold leading-5 text-emerald-700">
            {step.safeNote}
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800">
            <span className="block text-[10px] uppercase tracking-[0.18em] text-amber-600">{t.failureRecovery}</span>
            <span className="mt-1 block">{step.failureRecovery}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {step.featureIds.map(featureId => (
          <span key={featureId} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{featureId}</span>
        ))}
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700">{step.docsRef}</span>
      </div>
    </article>
  );
}

function ScenarioRecipesPanel({
  t,
  recipes,
}: {
  t: Record<DeveloperCopyKey, string>;
  recipes: DeveloperScenarioRecipe[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600">{t.scenarioRecipes}</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">App/API integration coverage</h2>
        </div>
        <span className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-black text-indigo-700">
          {recipes.length} {t.recipe}
        </span>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {recipes.map(recipe => (
          <article key={recipe.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{recipe.id}</p>
                <h3 className="mt-1 text-base font-black text-slate-950">{recipe.label}</h3>
              </div>
              <CoverageStatusPill status={recipe.status} />
            </div>
            <div className="mt-4 grid gap-3">
              <Info label={t.audience} value={recipe.audience} />
              <Info label={t.flow} value={recipe.flow} />
              <Info label={t.safeResponse} value={recipe.safeOutput} />
              <CodeBlock label={t.commandLine} value={recipe.command} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {recipe.surfaces.map(surface => (
                <span key={surface} className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-600 shadow-sm">{surface}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DeveloperTutorialPanel({
  t,
  experience,
}: {
  t: Record<DeveloperCopyKey, string>;
  experience: DeveloperExperienceModel;
}) {
  const featuredStep = experience.tutorialSteps[0];
  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-600">{t.guidedTutorial}</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Build AGID by doing</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                Local sandbox, resolver, Secure Address QR, machine handoff, webhooks, conformance, and safe deploy in one path.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <MetricCard label={t.tutorial} value={experience.summary.tutorialSteps} />
              <MetricCard label={t.scenarioRecipes} value={experience.summary.scenarioRecipes} />
              <MetricCard label={t.noRawAddressGate} value={experience.summary.noRawReady} />
            </div>
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {experience.tutorialSteps.map(step => (
              <button
                key={step.id}
                type="button"
                onClick={() => document.getElementById(step.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="flex min-w-[150px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-black text-slate-700 hover:border-blue-300 hover:bg-white"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-[11px] text-white">{step.step}</span>
                {step.title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {featuredStep && <TutorialStepCard t={t} step={featuredStep} featured />}

      <section className="grid gap-3">
        {experience.tutorialSteps.slice(1).map(step => (
          <div key={step.id} id={step.id}>
            <TutorialStepCard t={t} step={step} />
          </div>
        ))}
      </section>

      <ScenarioRecipesPanel t={t} recipes={experience.scenarioRecipes} />
    </div>
  );
}

function AllFeaturesMatrixPanel({
  t,
  experience,
}: {
  t: Record<DeveloperCopyKey, string>;
  experience: DeveloperExperienceModel;
}) {
  const readyRows = experience.coverageRows.filter(row => row.status === 'ready').length;
  const partialRows = experience.coverageRows.filter(row => row.status === 'partial').length;
  const previewRows = experience.coverageRows.filter(row => row.status === 'preview').length;
  const coveragePercent = Math.round((experience.summary.noRawReady / Math.max(1, experience.summary.coverageRows)) * 100);

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{t.allFeaturesMatrix}</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">App, API, SDK, workflow, and no-raw coverage</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              One inventory for app surfaces, OpenAPI/SDK surfaces, shared primitives, tutorials, tests, and release gates.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">{t.coverageScore}</p>
            <p className="mt-1 text-3xl font-black text-emerald-950">{coveragePercent}%</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <MetricCard label={t.appSurfaces} value={experience.summary.appSurfaces} />
          <MetricCard label={t.workflowSurfaces} value={experience.summary.workflowSurfaces} />
          <MetricCard label={t.sharedPrimitives} value={experience.summary.sharedPrimitives} />
          <MetricCard label={t.apiSdkSurfaces} value={experience.summary.apiSdkSurfaces} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">{readyRows} {t.ready}</span>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">{partialRows} {t.partial}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{previewRows} {t.preview}</span>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t.featureCoverage}</p>
            <h3 className="mt-1 text-lg font-black text-slate-950">{experience.summary.coverageRows} coverage rows</h3>
          </div>
          <StatusPill status="safe" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              <tr>
                <th className="px-4 py-3">{t.feature}</th>
                <th className="px-4 py-3">{t.status}</th>
                <th className="px-4 py-3">{t.apiSurface}</th>
                <th className="px-4 py-3">{t.sdkAvailable}</th>
                <th className="px-4 py-3">{t.docsAvailable}</th>
                <th className="px-4 py-3">{t.tutorialAvailable}</th>
                <th className="px-4 py-3">{t.testsAvailable}</th>
                <th className="px-4 py-3">{t.noRawAddressGate}</th>
                <th className="px-4 py-3">Route / ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {experience.coverageRows.map(row => (
                <tr key={row.id} className="align-top hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <p className="font-black text-slate-950">{row.label}</p>
                    <p className="mt-1 max-w-[360px] text-xs font-semibold leading-5 text-slate-500">{row.summary}</p>
                    <p className="mt-2 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{row.group} / {row.source}</p>
                  </td>
                  <td className="px-4 py-3"><CoverageStatusPill status={row.status} /></td>
                  <td className="px-4 py-3"><CoverageCheck active={row.api} label="API" /></td>
                  <td className="px-4 py-3"><CoverageCheck active={row.sdk} label="SDK" /></td>
                  <td className="px-4 py-3"><CoverageCheck active={row.docs} label="Docs" /></td>
                  <td className="px-4 py-3"><CoverageCheck active={row.tutorial} label="Tutorial" /></td>
                  <td className="px-4 py-3"><CoverageCheck active={row.tests} label="Tests" /></td>
                  <td className="px-4 py-3"><CoverageCheck active={row.noRawGate} label="No raw" /></td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500">{row.routeRef}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function DeveloperConsoleScreen() {
  const [language, setLanguage] = React.useState(readInitialLanguage);
  const [activeTab, setActiveTab] = React.useState<DeveloperTab>(readInitialDeveloperTab);
  const [query, setQuery] = React.useState('');
  const [refreshCount, setRefreshCount] = React.useState(0);
  const [launchTemplateId, setLaunchTemplateId] = React.useState<AddressPrivacyThreatTemplateId>('developer-console-fixtures');
  const [launchProfile, setLaunchProfile] = React.useState<AddressLaunchCenterProfile>('regulated');
  const [launchMode, setLaunchMode] = React.useState<AddressLaunchCenterMode>('server');
  const [externalAuditReady, setExternalAuditReady] = React.useState(false);
  const [deadLetterQueueReady, setDeadLetterQueueReady] = React.useState(false);
  const tabNavRef = React.useRef<HTMLElement | null>(null);
  const t = React.useMemo(() => copyFor(language), [language]);
  const model = React.useMemo(() => buildDeveloperConsole({
    generatedAt: new Date(2026, 5, 20, 9, refreshCount, 0).toISOString(),
  }), [refreshCount]);
  const developerExperience = React.useMemo(() => buildDeveloperExperience(model), [model]);
  const selectedThreatTemplate = React.useMemo(() => (
    ADDRESS_PRIVACY_THREAT_MODEL_TEMPLATES.find(template => template.id === launchTemplateId)
    ?? ADDRESS_PRIVACY_THREAT_MODEL_TEMPLATES[0]
  ), [launchTemplateId]);
  const noRawAddressKit = React.useMemo(() => buildNoRawAddressComplianceKit({
    generatedAt: new Date(2026, 5, 20, 10, refreshCount, 0).toISOString(),
  }), [refreshCount]);
  const noRawAddressSurface = React.useMemo(() => {
    const surfaceId = THREAT_TEMPLATE_SURFACE_MAP[launchTemplateId] ?? 'developer-console';
    return noRawAddressKit.surfacePolicies.find(policy => policy.surfaceId === surfaceId)
      ?? noRawAddressKit.surfacePolicies.find(policy => policy.surfaceId === 'developer-console')
      ?? noRawAddressKit.surfacePolicies[0];
  }, [launchTemplateId, noRawAddressKit]);
  const noRawAddressGate = React.useMemo(() => (
    evaluateNoRawAddressCompliancePayload(NO_RAW_ADDRESS_FIXTURES[0].payload)
  ), []);
  const launchCenter = React.useMemo(() => evaluateAddressLaunchCenter({
    environment: 'production',
    profile: launchProfile,
    mode: launchMode,
    requiresHighRiskMode: launchProfile !== 'standard',
    oauth: {
      scopesDefined: true,
      consentScreenReady: true,
      leastPrivilegeScopes: true,
      tokenRotation: true,
      duplicateConnectionPrevention: true,
    },
    webhooks: {
      configured: true,
      signatureVerification: true,
      replayProtection: true,
      retryPolicy: true,
      deadLetterQueue: deadLetterQueueReady,
      idempotencyKeys: true,
    },
    registry: {
      revocationCheck: true,
      freshnessCheck: true,
      issuerTrustCheck: true,
      usedStatusCheck: true,
      maxFreshnessAgeSeconds: 900,
      freshnessAgeSeconds: 120,
    },
    storageLogging: {
      redactionEnabled: true,
      retentionPolicyDays: 30,
      auditLogEnabled: true,
      rawAddressLogs: false,
      rawAgidLogs: false,
      rawAoidLogs: false,
      proofCodeLogs: false,
    },
    duplicates: {
      aoidDuplicateCheck: true,
      nullifierRequired: true,
      domainSeparation: true,
      idempotencyKeys: true,
      regionUniquenessPolicy: true,
    },
    highRiskMode: {
      enabled: launchProfile !== 'standard',
      agidSOnly: true,
      shortExpiry: true,
      recipientChallenge: true,
      precisionReduction: true,
      immediateRevocation: true,
      noAddressHistoryRetention: true,
    },
    errorHandling: {
      typedErrors: true,
      safeUserMessages: true,
      retryBackoff: true,
      reviewQueue: true,
      operatorRunbook: true,
    },
    terminal: {
      staffRoles: true,
      deviceDiagnostics: true,
      offlineQueue: true,
      registrySyncVisible: true,
      printerTest: true,
    },
    security: {
      rateLimits: true,
      csrfOrOriginChecks: true,
      secretsNotCommitted: true,
      reproducibleBuild: true,
      externalAuditReady,
    },
    threatModel: {
      templateSelected: true,
      templateId: launchTemplateId,
      reviewOwner: selectedThreatTemplate.ownerRole,
      misuseCasesReviewed: true,
      noRawAddressReviewed: noRawAddressGate.valid,
      highRiskModeReviewed: true,
      verificationCommandsMapped: true,
    },
  }), [
    deadLetterQueueReady,
    externalAuditReady,
    launchMode,
    launchProfile,
    launchTemplateId,
    noRawAddressGate.valid,
    selectedThreatTemplate.ownerRole,
  ]);
  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return getFilterText(model, activeTab, developerExperience).toLowerCase().includes(needle);
  }, [activeTab, developerExperience, model, query]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, normalizeAppLanguage(language));
      document.documentElement.lang = normalizeAppLanguage(language) === 'ja' ? 'ja-JP' : 'en';
      document.documentElement.dir = getLanguageDirection(language);
    }
  }, [language]);
  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleHashChange = () => {
      setActiveTab(DEVELOPER_HASH_TO_TAB[window.location.hash] ?? 'overview');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  React.useEffect(() => {
    const tabNav = tabNavRef.current;
    const activeButton = tabNavRef.current?.querySelector<HTMLButtonElement>(`[data-developer-tab="${activeTab}"]`);
    if (!tabNav || !activeButton) return;
    const leftPadding = 16;
    const targetLeft = Math.max(0, activeButton.offsetLeft - leftPadding);
    tabNav.scrollTo({ left: targetLeft, behavior: 'smooth' });
  }, [activeTab]);

  const copySafeExport = React.useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(safeExportText(model));
    }
  }, [model]);
  const selectTab = React.useCallback((tab: DeveloperTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', DEVELOPER_TAB_TO_HASH[tab]);
    }
  }, []);

  return (
    <main className="agid-page-scroll bg-[#f6f8fb] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { window.location.href = '/'; }}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
              aria-label={t.returnToMap}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-600">AGID Developer Console</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Developer Console</h1>
              <p className="mt-1 max-w-3xl text-sm font-semibold text-slate-500">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 lg:flex">
              {['Local', 'Sandbox', 'Production'].map(label => (
                <button
                  key={label}
                  type="button"
                  onClick={() => label === 'Production' ? selectTab('launch') : selectTab('openapi')}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-black',
                    label === 'Local' && 'bg-white text-emerald-700 shadow-sm',
                    label === 'Sandbox' && 'text-amber-700 hover:bg-white',
                    label === 'Production' && 'text-slate-500 hover:bg-white',
                  )}
                >
                  {label === 'Production' && <LockKeyhole className="h-3.5 w-3.5" />}
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => selectTab('community')}
              className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700 md:inline-flex"
            >
              <BookOpen className="h-4 w-4" />
              {t.docs}
            </button>
            <button
              type="button"
              onClick={() => window.open('https://github.com/dawnportinfo-design/Adreess-Grid-ID', '_blank', 'noopener,noreferrer')}
              className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700 md:inline-flex"
            >
              <Github className="h-4 w-4" />
              {t.github}
            </button>
            <label className="sr-only" htmlFor="developer-language">{t.language}</label>
            <select
              id="developer-language"
              value={normalizeAppLanguage(language)}
              onChange={(event) => setLanguage(normalizeAppLanguage(event.target.value))}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm"
            >
              {APP_LANGUAGES.map(option => (
                <option key={option.code} value={option.code}>{option.flag} {option.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-5">
        <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
          <DeveloperAdminSidebar
            t={t}
            activeTab={activeTab}
            model={model}
            launchCenter={launchCenter}
            onTabSelect={selectTab}
          />

          <div className="min-w-0">
        <nav ref={tabNavRef} className="mb-4 flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm lg:hidden" aria-label="Developer Console">
            {TAB_DEFINITIONS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-developer-tab={tab.id}
                  onClick={() => selectTab(tab.id)}
                  className={cn(
                    'flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-left text-sm font-black transition',
                    active ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t[tab.labelKey]}
                </button>
              );
            })}
        </nav>

        <DeveloperCommandCenter
          t={t}
          model={model}
          launchCenter={launchCenter}
          noRawAddressGate={noRawAddressGate}
          developerExperience={developerExperience}
          activeTab={activeTab}
          onTabSelect={selectTab}
        />

        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.search}
              className="h-9 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
            />
            <StatusPill status={model.accepted ? 'safe' : 'fail'} />
            <button
              type="button"
              onClick={() => setRefreshCount(count => count + 1)}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-black text-slate-600 hover:border-blue-300 hover:text-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">{t.refresh}</span>
            </button>
            <button
              type="button"
              onClick={copySafeExport}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-950 px-2.5 text-xs font-black text-white hover:bg-blue-700"
            >
              <Copy className="h-4 w-4" />
              <span className="hidden sm:inline">{t.copyExport}</span>
            </button>
          </div>

          {!visible ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-sm font-black text-slate-500">{t.noMatches}</p>
            </div>
          ) : (
            <>
              {activeTab === 'tutorial' && (
                <DeveloperTutorialPanel
                  t={t}
                  experience={developerExperience}
                />
              )}

              {activeTab === 'features' && (
                <AllFeaturesMatrixPanel
                  t={t}
                  experience={developerExperience}
                />
              )}

              {activeTab === 'overview' && (
                <DeveloperAdminOverview
                  t={t}
                  model={model}
                  launchCenter={launchCenter}
                  developerExperience={developerExperience}
                  onTabSelect={selectTab}
                />
              )}

              {activeTab === 'keys' && (
                <DeveloperApiKeysAdminPanel
                  t={t}
                  model={model}
                />
              )}

              {activeTab === 'webhooks' && (
                <div className="grid gap-4">
                  <section className="grid gap-3">
                    {model.webhooks.map(webhook => (
                      <article key={webhook.endpointId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t.webhookEndpoints}</p>
                            <h2 className="mt-1 text-lg font-black text-slate-950">{webhook.endpointId}</h2>
                            <p className="mt-1 font-mono text-xs font-bold text-slate-500">{webhook.urlRef}</p>
                          </div>
                          <StatusPill status={webhook.status} />
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <Info label={t.environment} value={webhook.environment} />
                          <Info label={t.signingKey} value={webhook.signingKeyRef} mono />
                          <Info label={t.failures} value={String(webhook.failureCount)} />
                          <Info label={t.lastDelivery} value={dateShort(webhook.lastDeliveryAt)} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {webhook.topics.map(topic => <span key={topic} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">{topic}</span>)}
                        </div>
                      </article>
                    ))}
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t.webhookDeliveryLog}</p>
                        <h2 className="mt-1 text-lg font-black text-slate-950">{model.totals.webhookLogEvents} events / {model.totals.webhookDeadLetters} {t.deadLetters}</h2>
                      </div>
                      <StatusPill status={model.totals.webhookDeadLetters ? 'fail' : 'pass'} />
                    </div>
                    <div className="mt-4 grid gap-3">
                      {model.webhookLogs.map(log => (
                        <article key={log.deliveryId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-mono text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{log.deliveryId}</p>
                              <h3 className="mt-1 text-sm font-black text-slate-950">{log.topic}</h3>
                              <p className="mt-1 font-mono text-xs font-bold text-slate-500">{log.endpointId}</p>
                            </div>
                            <StatusPill status={log.status} />
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <Info label={t.eventRef} value={log.eventRef} mono />
                            <Info label={t.payloadFingerprint} value={log.payloadFingerprint} mono />
                            <Info label={t.responseCode} value={String(log.responseCode)} />
                            <Info label={t.attempts} value={String(log.attemptCount)} />
                            <Info label={t.signatureVerified} value={log.signatureVerified ? 'yes' : 'no'} />
                            <Info label={t.updated} value={dateShort(log.occurredAt)} />
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'sdk' && (
                <div className="grid gap-4">
                  <section className="grid gap-3">
                    {model.sdkSnippets.map(snippet => (
                      <article key={snippet.language} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{snippet.language}</p>
                            <h2 className="mt-1 text-lg font-black text-slate-950">{snippet.packageName}</h2>
                          </div>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black uppercase text-slate-600">{snippet.status}</span>
                        </div>
                        <CodeBlock label={t.install} value={snippet.install} />
                        <CodeBlock label={t.snippet} value={snippet.snippet} />
                        <CodeBlock label={t.testCommand} value={snippet.testCommand} />
                      </article>
                    ))}
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <TerminalSquare className="h-5 w-5 text-blue-600" />
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">{t.cliGuide}</p>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {model.cliCommands.map(command => (
                        <article key={command.commandId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-mono text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{command.commandId}</p>
                              <h3 className="mt-1 text-sm font-black text-slate-950">{command.label}</h3>
                            </div>
                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-black uppercase text-slate-600">{command.status}</span>
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                            <Info label={t.purpose} value={command.purpose} />
                            <CodeBlock label={t.commandLine} value={command.command} />
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'openapi' && (
                <div className="grid gap-4">
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">{t.apiWorkbench}</p>
                        <h2 className="mt-1 text-xl font-black text-slate-950">{model.openApi.title}</h2>
                      </div>
                      <ReferenceStatusPill status="ready" />
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Info label="Title" value={model.openApi.title} />
                      <Info label="Version" value={model.openApi.version} />
                      <Info label="Schemas" value={String(model.openApi.componentSchemaCount)} />
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <ListPanel title={t.highlightedPaths} values={model.openApi.highlightedPaths} />
                      <ListPanel title={t.topTags} values={model.openApi.topTags} />
                    </div>
                  </article>
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-emerald-600" />
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">{t.callbackContract}</p>
                        </div>
                        <h2 className="mt-2 font-mono text-lg font-black text-slate-950">{VEYGRIT_ADDRESS_LOGIN_CALLBACK_CONTRACT_VERSION}</h2>
                        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                          Merchants receive only session, credential, proof bundle, and carrier handoff references. The Console mirrors the React, Next.js, Hosted API, OpenAPI, and test-vector contract so callback handling stays compatible without exposing address material.
                        </p>
                      </div>
                      <ReferenceStatusPill status="ready" />
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <ListPanel title={t.canonicalParams} values={[...VEYGRIT_ADDRESS_LOGIN_CANONICAL_CALLBACK_PARAMS]} />
                      <ListPanel title={t.compatibilityAliases} values={ADDRESS_LOGIN_CALLBACK_ALIAS_ROWS} />
                      <ListPanel title={t.forbiddenCallbackParams} values={[...VEYGRIT_ADDRESS_LOGIN_FORBIDDEN_CALLBACK_PARAM_EXAMPLES]} />
                      <ListPanel title={t.nonClaims} values={[...VEYGRIT_ADDRESS_LOGIN_CALLBACK_NON_CLAIMS]} />
                    </div>

                    <div className="mt-4 grid gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                      {ADDRESS_LOGIN_CALLBACK_CONTRACT_SUMMARY.map(item => (
                        <div key={item} className="flex items-start gap-2 text-sm font-bold leading-6 text-emerald-800">
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-rose-600" />
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-600">{t.errorCatalog}</p>
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                      {model.apiErrorExamples.map(error => (
                        <article key={error.code} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-mono text-sm font-black text-slate-950">{error.statusCode}</p>
                            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase text-slate-600 shadow-sm">
                              {error.retryable ? t.retryPolicy : 'no retry'}
                            </span>
                          </div>
                          <h3 className="mt-2 font-mono text-sm font-black text-slate-950">{error.code}</h3>
                          <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">{t.cause}</p>
                          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{error.cause}</p>
                          <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">{t.fix}</p>
                          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{error.fix}</p>
                          <p className="mt-3 font-mono text-xs font-black text-rose-600">{t.noRawImpact}: {error.noRawAddressImpact}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'vectors' && (
                <div className="grid gap-4">
                  <section className="grid gap-3">
                    {model.testVectors.map(vector => (
                      <article key={vector.vectorId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{vector.surface}</p>
                            <h2 className="mt-1 text-lg font-black text-slate-950">{vector.vectorId}</h2>
                          </div>
                          <StatusPill status={vector.status} />
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <Info label={t.fixtureRef} value={vector.fixtureRef} mono />
                          <Info label={t.expectedHash} value={vector.expectedHash} mono />
                        </div>
                      </article>
                    ))}
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-blue-600" />
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">{t.conformanceResults}</p>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {model.conformanceResults.map(result => (
                        <article key={result.suiteId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-mono text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{result.suiteId}</p>
                              <h3 className="mt-1 text-sm font-black text-slate-950">{result.label}</h3>
                            </div>
                            <StatusPill status={result.status} />
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <Info label={t.passed} value={String(result.passed)} />
                            <Info label={t.failed} value={String(result.failed)} />
                            <Info label={t.updated} value={dateShort(result.updatedAt)} />
                            <Info label={t.evidence} value={result.evidenceRef} mono />
                          </div>
                          <CodeBlock label={t.commandLine} value={result.command} />
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'launch' && (
                <LaunchCenterPanel
                  t={t}
                  launchCenter={launchCenter}
                  selectedThreatTemplate={selectedThreatTemplate}
                  selectedTemplateId={launchTemplateId}
                  onTemplateChange={setLaunchTemplateId}
                  launchProfile={launchProfile}
                  onProfileChange={setLaunchProfile}
                  launchMode={launchMode}
                  onModeChange={setLaunchMode}
                  externalAuditReady={externalAuditReady}
                  onExternalAuditReadyChange={setExternalAuditReady}
                  deadLetterQueueReady={deadLetterQueueReady}
                  onDeadLetterQueueReadyChange={setDeadLetterQueueReady}
                  noRawAddressSurface={noRawAddressSurface}
                  noRawAddressGate={noRawAddressGate}
                  noRawAddressKit={noRawAddressKit}
                  legacyChecks={model.launchChecks}
                />
              )}

              {activeTab === 'community' && (
                <div className="grid gap-4">
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600">{t.communityResearch}</p>
                        <h2 className="mt-1 text-xl font-black text-slate-950">AGID OSS protocol paths</h2>
                        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                          Ethereum-style community review, research evidence, grants readiness, and contributor entry points without adding chain dependency.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">{t.contributorPaths}</p>
                        <p className="mt-1 text-2xl font-black text-indigo-950">{model.totals.communityLinks}</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {model.communityLinks.map(link => (
                        <article key={link.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{link.track}</p>
                              <h3 className="mt-1 text-base font-black text-slate-950">{link.label}</h3>
                            </div>
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                          </div>
                          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{link.detail}</p>
                          <p className="mt-3 font-mono text-xs font-black text-indigo-700">{link.hrefRef}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'geo' && (
                <div className="grid gap-4">
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-600">{t.geoExamples}</p>
                        <h2 className="mt-1 text-xl font-black text-slate-950">Map, address, and delivery examples</h2>
                        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                          MapLibre-style examples for AGID grids, postal lookup, building candidates, natural geography, POS handoff, and drone delivery.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-teal-100 bg-teal-50 p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-600">{t.openApiPaths}</p>
                        <p className="mt-1 text-2xl font-black text-teal-950">{model.totals.geoExamples}</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {model.geoExamples.map(example => (
                        <article key={example.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{example.id}</p>
                              <h3 className="mt-1 text-base font-black text-slate-950">{example.label}</h3>
                            </div>
                            <ReferenceStatusPill status={example.status} />
                          </div>
                          <div className="mt-4 grid gap-3">
                            <Info label={t.apiSurface} value={example.apiSurface} />
                            <Info label={t.scenario} value={example.scenario} />
                            <Info label={t.examplePath} value={example.examplePath} mono />
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </>
          )}
        </section>

        <aside className="grid min-w-0 gap-4 2xl:sticky 2xl:top-24 2xl:self-start">
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="text-sm font-black text-slate-950">{t.privacyBoundary}</h2>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{t.privacyBody}</p>
          </section>
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t.safeExport}</p>
              <EyeOff className="h-4 w-4 text-slate-400" />
            </div>
            <p className="mt-2 break-all font-mono text-xs font-black text-slate-700">{t.developerRoot}: {model.developerRoot}</p>
            <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <summary className="cursor-pointer text-sm font-black text-slate-700">Show redacted export</summary>
              <pre className="mt-3 max-h-[280px] max-w-full overflow-auto rounded-xl bg-slate-950 p-4 text-xs font-semibold leading-5 text-slate-100">
                {safeExportText(model)}
              </pre>
            </details>
          </section>
        </aside>
        </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function LaunchCenterPanel({
  t,
  launchCenter,
  selectedThreatTemplate,
  selectedTemplateId,
  onTemplateChange,
  launchProfile,
  onProfileChange,
  launchMode,
  onModeChange,
  externalAuditReady,
  onExternalAuditReadyChange,
  deadLetterQueueReady,
  onDeadLetterQueueReadyChange,
  noRawAddressSurface,
  noRawAddressGate,
  noRawAddressKit,
  legacyChecks,
}: {
  t: Record<DeveloperCopyKey, string>;
  launchCenter: AddressLaunchCenterEvaluation;
  selectedThreatTemplate: AddressPrivacyThreatTemplate;
  selectedTemplateId: AddressPrivacyThreatTemplateId;
  onTemplateChange: (value: AddressPrivacyThreatTemplateId) => void;
  launchProfile: AddressLaunchCenterProfile;
  onProfileChange: (value: AddressLaunchCenterProfile) => void;
  launchMode: AddressLaunchCenterMode;
  onModeChange: (value: AddressLaunchCenterMode) => void;
  externalAuditReady: boolean;
  onExternalAuditReadyChange: (value: boolean) => void;
  deadLetterQueueReady: boolean;
  onDeadLetterQueueReadyChange: (value: boolean) => void;
  noRawAddressSurface: NoRawAddressSurfacePolicy;
  noRawAddressGate: NoRawAddressCompliancePayloadResult;
  noRawAddressKit: NoRawAddressComplianceKit;
  legacyChecks: DeveloperConsole['launchChecks'];
}) {
  const preAuditItems = launchCenter.items.filter(item => (
    item.required
    || item.category === 'security'
    || item.category === 'threat-model'
    || item.category === 'storage-logging'
  ));
  const launchPublicState = launchCenter.status === 'ready'
    ? 'OK'
    : launchCenter.status === 'blocked'
      ? 'Rejected'
      : 'Needs Review';

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">{t.launchCenter}</p>
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              {launchCenter.status === 'ready' ? t.auditReady : t.preAuditChecks}
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              Select one privacy threat model template, confirm the no-raw-address gate, and clear required pre-audit evidence before public launch.
            </p>
          </div>
          <div className="grid min-w-[220px] gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Decision</span>
              <LaunchStatusPill status={launchCenter.status} />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-slate-950">{launchPublicState}</span>
            </div>
            <p className="font-mono text-[11px] font-bold text-slate-500">{launchCenter.launchRoot}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <label className="grid gap-1 rounded-xl border border-slate-200 bg-white p-3">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{t.profile}</span>
            <select
              value={launchProfile}
              onChange={(event) => onProfileChange(event.target.value as AddressLaunchCenterProfile)}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-800"
            >
              {ADDRESS_LAUNCH_CENTER_PROFILES.map(profile => (
                <option key={profile} value={profile}>{profile}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 rounded-xl border border-slate-200 bg-white p-3">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{t.mode}</span>
            <select
              value={launchMode}
              onChange={(event) => onModeChange(event.target.value as AddressLaunchCenterMode)}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-800"
            >
              {ADDRESS_LAUNCH_CENTER_MODES.map(mode => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </label>
          <ToggleCard
            label={t.externalAudit}
            checked={externalAuditReady}
            onChange={onExternalAuditReadyChange}
          />
          <ToggleCard
            label={t.deadLetterQueue}
            checked={deadLetterQueueReady}
            onChange={onDeadLetterQueueReadyChange}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-600">{t.threatModelTemplate}</p>
              </div>
              <h3 className="mt-2 text-lg font-black text-slate-950">{selectedThreatTemplate.title}</h3>
            </div>
            <LaunchStatusPill status={launchCenter.items.find(item => item.id === 'threat-model-template-selected')?.status ?? 'warn'} />
          </div>
          <label className="mt-4 grid gap-1">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{t.selectedTemplate}</span>
            <select
              value={selectedTemplateId}
              onChange={(event) => onTemplateChange(event.target.value as AddressPrivacyThreatTemplateId)}
              className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-800"
            >
              {ADDRESS_PRIVACY_THREAT_MODEL_TEMPLATES.map(template => (
                <option key={template.id} value={template.id}>{template.title}</option>
              ))}
            </select>
          </label>
          <div className="mt-4 grid gap-3">
            <Info label={t.reviewOwner} value={selectedThreatTemplate.ownerRole} />
            <Info label="Surface" value={selectedThreatTemplate.surface} />
            <Info label={t.privacyGoal} value={selectedThreatTemplate.privacyGoal} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <CompactList title={t.protectedAssets} values={selectedThreatTemplate.protectedAssets.slice(0, 5)} />
            <CompactList title={t.verificationCommands} values={selectedThreatTemplate.verificationCommands} mono />
          </div>
          <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-500">{t.misuseCases}</p>
            <div className="mt-3 grid gap-2">
              {selectedThreatTemplate.misuseCases.map(item => (
                <div key={item.id} className="rounded-lg bg-white p-3 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black uppercase text-rose-700">{item.severity}</span>
                    <span className="font-mono text-[10px] font-bold text-slate-400">{item.id}</span>
                  </div>
                  <p className="mt-1 text-sm font-black text-slate-800">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <EyeOff className="h-5 w-5 text-emerald-600" />
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600">{t.noRawAddressGate}</p>
              </div>
              <h3 className="mt-2 text-lg font-black text-slate-950">{noRawAddressSurface.label}</h3>
            </div>
            <LaunchStatusPill status={noRawAddressGate.valid ? 'pass' : 'fail'} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Info label={t.surfacePolicy} value={noRawAddressSurface.defaultPrivacyMode} />
            <Info label="Kit version" value={noRawAddressKit.manifest.version} mono />
            <Info label={t.forbiddenFields} value={String(noRawAddressSurface.forbiddenRawFields.length)} />
            <Info label={t.allowedSubstitutes} value={String(noRawAddressKit.allowedPublicSubstitutes.length)} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <CompactList title={t.allowedSubstitutes} values={noRawAddressKit.allowedPublicSubstitutes.slice(0, 8)} />
            <CompactList title={t.forbiddenFields} values={noRawAddressSurface.forbiddenRawFields.slice(0, 8)} />
          </div>
          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Mandatory release gate</p>
                <p className="mt-1 text-sm font-bold text-emerald-900">
                  {noRawAddressGate.gate.requiredPassed.length} passed / {noRawAddressGate.gate.requiredFailed.length} failed
                </p>
              </div>
              <LaunchStatusPill status={noRawAddressGate.gate.valid ? 'pass' : 'fail'} />
            </div>
            <div className="mt-3 grid gap-2">
              {noRawAddressGate.gate.requirements.map(requirement => (
                <div key={requirement.id} className="flex min-h-10 items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-sm">
                  <span className="font-mono text-xs font-black text-slate-700">{requirement.id}</span>
                  <LaunchStatusPill status={requirement.passed ? 'pass' : 'fail'} />
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <VeygritShipReleaseGateStatusPanel />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-slate-700" />
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{t.preAuditChecks}</p>
            </div>
            <h3 className="mt-2 text-lg font-black text-slate-950">
              {t.blockedRequired}: {launchCenter.totals.blockedRequired}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <LaunchStatusPill status={launchCenter.status} />
            <span className="inline-flex min-h-7 items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-slate-600">
              pass {launchCenter.totals.pass} / warn {launchCenter.totals.warn} / fail {launchCenter.totals.fail}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {preAuditItems.map(item => (
            <article
              key={item.id}
              className={cn(
                'rounded-2xl border p-4',
                item.status === 'pass' && 'border-emerald-200 bg-emerald-50/70',
                item.status === 'warn' && 'border-amber-200 bg-amber-50/70',
                item.status === 'fail' && 'border-rose-200 bg-rose-50/70',
                item.status === 'not_applicable' && 'border-slate-200 bg-slate-50',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">{item.id}</p>
                  <h4 className="mt-1 text-base font-black text-slate-950">{item.label}</h4>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{item.summary}</p>
                </div>
                <LaunchStatusPill status={item.status} />
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <CompactList title={t.presentEvidence} values={item.presentEvidence.length ? item.presentEvidence : ['none']} />
                <CompactList title={t.missingEvidence} values={item.missingEvidence.length ? item.missingEvidence : ['none']} />
              </div>
              {item.status !== 'pass' && (
                <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm">
                  {t.nextAction}: {item.remediation}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-slate-700" />
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Developer Console compatibility refs</p>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {legacyChecks.slice(0, 4).map(check => (
            <div key={check.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[11px] font-black text-slate-600">{check.id}</p>
                <StatusPill status={check.status} />
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-500">{check.evidenceRef}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function VeygritShipReleaseGateStatusPanel() {
  const status = VEYGRIT_SHIP_RELEASE_GATE_STATUS;
  const previewGates = status.gates.slice(0, 6);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-veygrit-ship-release-gate-status>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ServerCog className="h-5 w-5 text-slate-700" />
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Veygrit Ship release gates</p>
          </div>
          <h3 className="mt-2 text-lg font-black text-slate-950">Public-safe local status</h3>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            {status.source} / {status.exposure}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-7 items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">
            {status.gateCount} gates
          </span>
          <span className="inline-flex min-h-7 items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-slate-600">
            remote actions {status.remoteActionsAuthorized ? 'on' : 'off'}
          </span>
          <span className="inline-flex min-h-7 items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-slate-600">
            production traffic {status.productionTraffic ? 'on' : 'off'}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-3 py-2">Gate</th>
                <th className="px-3 py-2">Command</th>
                <th className="px-3 py-2">Boundary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {previewGates.map(gate => (
                <tr key={gate.gate}>
                  <td className="px-3 py-3 font-mono text-[11px] font-black text-slate-800">{gate.gate}</td>
                  <td className="px-3 py-3 font-mono text-[11px] font-bold text-blue-700">{gate.command}</td>
                  <td className="px-3 py-3 text-xs font-semibold leading-5 text-slate-600">{gate.boundary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Non-claims</p>
          <div className="mt-3 grid gap-2">
            {status.nonClaims.map(nonClaim => (
              <div key={nonClaim} className="flex items-start gap-2 rounded-lg bg-white p-3 text-xs font-bold leading-5 text-slate-700 shadow-sm">
                <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{nonClaim}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LaunchStatusPill({ status }: { status: AddressLaunchCenterEvaluation['status'] | AddressLaunchCenterEvaluation['items'][number]['status'] }) {
  const good = ['ready', 'pass'].includes(status);
  const warn = ['attention', 'warn', 'not_applicable'].includes(status);
  return (
    <span className={cn(
      'inline-flex min-h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] font-black uppercase tracking-[0.12em]',
      good && 'border-emerald-300/70 bg-emerald-50 text-emerald-700',
      warn && 'border-amber-300/70 bg-amber-50 text-amber-700',
      !good && !warn && 'border-rose-300/70 bg-rose-50 text-rose-700',
    )}>
      {good ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {status}
    </span>
  );
}

function ToggleCard({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-h-[74px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <span className="grid gap-1">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
        <span className={cn('text-sm font-black', checked ? 'text-emerald-700' : 'text-slate-600')}>
          {checked ? 'ready' : 'not ready'}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <span className={cn(
        'relative h-7 w-12 rounded-full border transition',
        checked ? 'border-emerald-400 bg-emerald-500' : 'border-slate-300 bg-slate-200',
      )}>
        <span className={cn(
          'absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition',
          checked ? 'left-6' : 'left-1',
        )} />
      </span>
    </label>
  );
}

function CompactList({ title, values, mono = false }: { title: string; values: string[]; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.map(value => (
          <span
            key={value}
            className={cn(
              'rounded-lg bg-white px-2.5 py-1.5 text-xs font-black text-slate-700 shadow-sm',
              mono && 'font-mono',
            )}
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={cn('mt-1 text-sm font-black text-slate-800', mono && 'font-mono text-xs')}>{value}</p>
    </div>
  );
}

function CodeBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4 min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <pre className="mt-2 max-w-full overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-800">{value}</pre>
    </div>
  );
}

function ListPanel({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <div className="mt-3 grid gap-2">
        {values.map(value => (
          <span key={value} className="rounded-lg bg-white px-3 py-2 font-mono text-xs font-black text-slate-700 shadow-sm">{value}</span>
        ))}
      </div>
    </div>
  );
}

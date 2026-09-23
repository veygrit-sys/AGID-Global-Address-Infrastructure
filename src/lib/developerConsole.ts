import {
  ADDRESS_CONNECT_WEBHOOK_TOPICS,
  addressConnectPrivateMaterialPaths,
  type AddressConnectWebhookTopic,
} from './addressConnect';
import { evaluateAddressLaunchCenter } from './addressLaunchCenter';
import { AGID_OPENAPI_SPEC } from './openApiSpec';
import {
  cleanBoolean,
  cleanNonNegativeInteger,
  cleanText,
  cleanTextArray,
  stableId,
} from './redactedWorkflowCore';

export const DEVELOPER_CONSOLE_MODEL_VERSION = 'agid-developer-console-v1';

export const DEVELOPER_CONSOLE_ENVIRONMENTS = ['local', 'staging', 'production'] as const;
export const DEVELOPER_CONSOLE_KEY_STATUSES = ['active', 'rotation-due', 'revoked'] as const;
export const DEVELOPER_CONSOLE_WEBHOOK_STATUSES = ['healthy', 'warning', 'failing'] as const;
export const DEVELOPER_CONSOLE_WEBHOOK_DELIVERY_STATUSES = ['delivered', 'retrying', 'failed', 'dead-lettered'] as const;
export const DEVELOPER_CONSOLE_TEST_STATUSES = ['pass', 'warn', 'fail'] as const;
export const DEVELOPER_CONSOLE_LAUNCH_STATUSES = ['pass', 'warn', 'fail'] as const;

export type DeveloperConsoleEnvironment = (typeof DEVELOPER_CONSOLE_ENVIRONMENTS)[number];
export type DeveloperConsoleKeyStatus = (typeof DEVELOPER_CONSOLE_KEY_STATUSES)[number];
export type DeveloperConsoleWebhookStatus = (typeof DEVELOPER_CONSOLE_WEBHOOK_STATUSES)[number];
export type DeveloperConsoleWebhookDeliveryStatus = (typeof DEVELOPER_CONSOLE_WEBHOOK_DELIVERY_STATUSES)[number];
export type DeveloperConsoleTestStatus = (typeof DEVELOPER_CONSOLE_TEST_STATUSES)[number];
export type DeveloperConsoleLaunchStatus = (typeof DEVELOPER_CONSOLE_LAUNCH_STATUSES)[number];

export type DeveloperApiKeyRef = {
  keyId: string;
  environment: DeveloperConsoleEnvironment;
  label: string;
  scopes: string[];
  fingerprint: string;
  status: DeveloperConsoleKeyStatus;
  rotatedAt: string;
  expiresAt: string;
};

export type DeveloperWebhookEndpoint = {
  endpointId: string;
  environment: DeveloperConsoleEnvironment;
  urlRef: string;
  topics: AddressConnectWebhookTopic[];
  status: DeveloperConsoleWebhookStatus;
  signingKeyRef: string;
  lastDeliveryAt: string;
  failureCount: number;
};

export type DeveloperWebhookDeliveryLog = {
  deliveryId: string;
  endpointId: string;
  topic: AddressConnectWebhookTopic;
  status: DeveloperConsoleWebhookDeliveryStatus;
  occurredAt: string;
  attemptCount: number;
  responseCode: number;
  eventRef: string;
  payloadFingerprint: string;
  signatureVerified: boolean;
};

export type DeveloperSdkSnippet = {
  language:
    | 'typescript'
    | 'rust'
    | 'python'
    | 'go'
    | 'swift'
    | 'kotlin'
    | 'java'
    | 'c'
    | 'cpp'
    | 'php'
    | 'dotnet'
    | 'ruby'
    | 'dart'
    | 'spec'
    | 'wasm'
    | 'r'
    | 'julia'
    | 'elixir'
    | 'lua'
    | 'zig'
    | 'nim';
  packageName: string;
  install: string;
  snippet: string;
  testCommand: string;
  status: 'ready' | 'preview';
};

export type DeveloperCliCommand = {
  commandId: string;
  label: string;
  command: string;
  purpose: 'quickstart' | 'batch' | 'conformance' | 'privacy' | 'openapi';
  status: 'ready' | 'preview';
};

export type DeveloperTestVector = {
  vectorId: string;
  surface: 'agid-core' | 'agid-s' | 'address-element' | 'webhook' | 'no-raw-address' | 'zk-proof';
  fixtureRef: string;
  expectedHash: string;
  status: DeveloperConsoleTestStatus;
};

export type DeveloperConformanceResult = {
  suiteId: string;
  label: string;
  status: DeveloperConsoleTestStatus;
  command: string;
  passed: number;
  failed: number;
  evidenceRef: string;
  updatedAt: string;
};

export type DeveloperLaunchCheck = {
  id: string;
  label: string;
  status: DeveloperConsoleLaunchStatus;
  evidenceRef: string;
  nextAction: string;
};

export type DeveloperOpenApiSummary = {
  title: string;
  version: string;
  pathCount: number;
  tagCount: number;
  componentSchemaCount: number;
  topTags: string[];
  highlightedPaths: string[];
};

export type DeveloperApiErrorExample = {
  statusCode: number;
  code: string;
  cause: string;
  fix: string;
  retryable: boolean;
  noRawAddressImpact: 'safe' | 'blocked' | 'review';
};

export type DeveloperFeatureCategory = {
  id: string;
  label: string;
  summary: string;
  status: 'ready' | 'preview';
};

export type DeveloperSelfHostingOption = {
  mode: 'local-only' | 'self-hosted' | 'managed-integration';
  label: string;
  summary: string;
  requirements: string[];
  status: 'ready' | 'preview';
};

export type DeveloperCommunityLink = {
  id: string;
  label: string;
  track: 'protocol' | 'sdk' | 'geo-data' | 'security' | 'docs' | 'research';
  detail: string;
  hrefRef: string;
};

export type DeveloperGeoExample = {
  id: string;
  label: string;
  scenario: string;
  apiSurface: string;
  examplePath: string;
  status: 'ready' | 'preview';
};

export type DeveloperConsoleInput = {
  generatedAt?: string;
  apiKeys?: Partial<DeveloperApiKeyRef>[];
  webhooks?: Partial<DeveloperWebhookEndpoint>[];
  webhookLogs?: Partial<DeveloperWebhookDeliveryLog>[];
  sdkSnippets?: Partial<DeveloperSdkSnippet>[];
  cliCommands?: Partial<DeveloperCliCommand>[];
  testVectors?: Partial<DeveloperTestVector>[];
  conformanceResults?: Partial<DeveloperConformanceResult>[];
  launchChecks?: Partial<DeveloperLaunchCheck>[];
  apiErrorExamples?: Partial<DeveloperApiErrorExample>[];
  featureCategories?: Partial<DeveloperFeatureCategory>[];
  selfHostingOptions?: Partial<DeveloperSelfHostingOption>[];
  communityLinks?: Partial<DeveloperCommunityLink>[];
  geoExamples?: Partial<DeveloperGeoExample>[];
};

export type DeveloperConsole = {
  modelVersion: typeof DEVELOPER_CONSOLE_MODEL_VERSION;
  accepted: boolean;
  generatedAt: string;
  developerRoot: string;
  apiKeys: DeveloperApiKeyRef[];
  webhooks: DeveloperWebhookEndpoint[];
  webhookLogs: DeveloperWebhookDeliveryLog[];
  sdkSnippets: DeveloperSdkSnippet[];
  cliCommands: DeveloperCliCommand[];
  openApi: DeveloperOpenApiSummary;
  testVectors: DeveloperTestVector[];
  conformanceResults: DeveloperConformanceResult[];
  launchChecks: DeveloperLaunchCheck[];
  apiErrorExamples: DeveloperApiErrorExample[];
  featureCategories: DeveloperFeatureCategory[];
  selfHostingOptions: DeveloperSelfHostingOption[];
  communityLinks: DeveloperCommunityLink[];
  geoExamples: DeveloperGeoExample[];
  totals: {
    activeKeys: number;
    rotationDueKeys: number;
    webhookEndpoints: number;
    webhookFailures: number;
    webhookLogEvents: number;
    webhookDeadLetters: number;
    sdkTargets: number;
    cliCommands: number;
    openApiPaths: number;
    testVectors: number;
    failingTests: number;
    conformanceSuites: number;
    failingConformance: number;
    failingLaunchChecks: number;
    communityLinks: number;
    geoExamples: number;
  };
  safeExport: {
    developerRoot: string;
    apiKeyRefs: Array<Pick<DeveloperApiKeyRef, 'keyId' | 'environment' | 'scopes' | 'fingerprint' | 'status'>>;
    webhookRefs: Array<Pick<DeveloperWebhookEndpoint, 'endpointId' | 'environment' | 'topics' | 'status' | 'signingKeyRef'>>;
    webhookLogRefs: Array<Pick<DeveloperWebhookDeliveryLog, 'deliveryId' | 'endpointId' | 'topic' | 'status' | 'eventRef' | 'payloadFingerprint' | 'signatureVerified'>>;
    sdkTargets: Array<Pick<DeveloperSdkSnippet, 'language' | 'packageName' | 'status'>>;
    cliCommandRefs: Array<Pick<DeveloperCliCommand, 'commandId' | 'command' | 'purpose' | 'status'>>;
    openApi: DeveloperOpenApiSummary;
    testVectorRefs: Array<Pick<DeveloperTestVector, 'vectorId' | 'surface' | 'fixtureRef' | 'expectedHash' | 'status'>>;
    conformanceRefs: Array<Pick<DeveloperConformanceResult, 'suiteId' | 'status' | 'command' | 'passed' | 'failed' | 'evidenceRef'>>;
    launchCheckRefs: Array<Pick<DeveloperLaunchCheck, 'id' | 'status' | 'evidenceRef'>>;
    apiErrorRefs: Array<Pick<DeveloperApiErrorExample, 'statusCode' | 'code' | 'retryable' | 'noRawAddressImpact'>>;
    featureCategoryRefs: Array<Pick<DeveloperFeatureCategory, 'id' | 'label' | 'status'>>;
    selfHostingRefs: Array<Pick<DeveloperSelfHostingOption, 'mode' | 'label' | 'status'>>;
    communityRefs: Array<Pick<DeveloperCommunityLink, 'id' | 'track' | 'hrefRef'>>;
    geoExampleRefs: Array<Pick<DeveloperGeoExample, 'id' | 'label' | 'apiSurface' | 'status'>>;
    privacy: {
      rawAddressAccepted: false;
      rawAgidAccepted: false;
      rawAoidAccepted: false;
      proofCodeAccepted: false;
      keyMaterialAccepted: false;
    };
  };
  errors: string[];
  warnings: string[];
};

function normalizeEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const cleaned = cleanText(value) as T;
  return allowed.includes(cleaned) ? cleaned : fallback;
}

function normalizeTimestamp(value: unknown, fallback: string) {
  const text = cleanText(value);
  const date = text ? new Date(text) : new Date(fallback);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function normalizeFingerprint(value: unknown, seed: unknown) {
  const text = cleanText(value, '', 96);
  return text || `fp:${stableId('DEV', seed, { length: 24, separator: '_' }).toLowerCase()}`;
}

function normalizeTopics(value: unknown): AddressConnectWebhookTopic[] {
  const selected = cleanTextArray(value).filter((topic): topic is AddressConnectWebhookTopic => (
    ADDRESS_CONNECT_WEBHOOK_TOPICS.includes(topic as AddressConnectWebhookTopic)
  ));
  return selected.length > 0
    ? Array.from(new Set(selected))
    : ['address_intent.verified', 'handoff.completed', 'credential.revoked'];
}

function defaultApiKeys(generatedAt: string): DeveloperApiKeyRef[] {
  return [
    normalizeApiKey({
      label: 'Server integration ref',
      environment: 'staging',
      scopes: ['resolver:read', 'address-element:write', 'webhook:subscribe'],
      status: 'active',
      rotatedAt: generatedAt,
      expiresAt: '2026-09-18T00:00:00.000Z',
    }, 0, generatedAt),
    normalizeApiKey({
      label: 'POS terminal fleet ref',
      environment: 'production',
      scopes: ['terminal:read', 'terminal:write', 'handoff:verify'],
      status: 'rotation-due',
      rotatedAt: '2026-05-01T00:00:00.000Z',
      expiresAt: '2026-07-01T00:00:00.000Z',
    }, 1, generatedAt),
  ];
}

function normalizeApiKey(input: Partial<DeveloperApiKeyRef>, index: number, generatedAt: string): DeveloperApiKeyRef {
  const environment = normalizeEnum(input.environment, DEVELOPER_CONSOLE_ENVIRONMENTS, 'local');
  const scopes = cleanTextArray(input.scopes).map(scope => scope.slice(0, 80));
  const label = cleanText(input.label, `Integration key ${index + 1}`, 80);
  const keyId = cleanText(input.keyId, '', 80) || stableId('DKEY', { environment, label, index }, { length: 14 });
  return {
    keyId,
    environment,
    label,
    scopes: scopes.length > 0 ? Array.from(new Set(scopes)) : ['resolver:read'],
    fingerprint: normalizeFingerprint(input.fingerprint, { keyId, environment, label }),
    status: normalizeEnum(input.status, DEVELOPER_CONSOLE_KEY_STATUSES, 'active'),
    rotatedAt: normalizeTimestamp(input.rotatedAt, generatedAt),
    expiresAt: normalizeTimestamp(input.expiresAt, '2026-09-18T00:00:00.000Z'),
  };
}

function defaultWebhooks(generatedAt: string): DeveloperWebhookEndpoint[] {
  return [
    normalizeWebhook({
      environment: 'staging',
      urlRef: 'https://example.dev/agid/webhooks#ref',
      topics: ['address_intent.verified', 'handoff.completed', 'qr.used'],
      status: 'healthy',
      signingKeyRef: 'whsec-ref-staging-01',
      lastDeliveryAt: generatedAt,
      failureCount: 0,
    }, 0, generatedAt),
    normalizeWebhook({
      environment: 'production',
      urlRef: 'https://ops.example.org/address-events#ref',
      topics: ['credential.revoked', 'revocation.updated', 'audit.case.opened'],
      status: 'warning',
      signingKeyRef: 'whsec-ref-prod-02',
      lastDeliveryAt: '2026-06-19T08:00:00.000Z',
      failureCount: 2,
    }, 1, generatedAt),
  ];
}

function normalizeWebhook(
  input: Partial<DeveloperWebhookEndpoint>,
  index: number,
  generatedAt: string,
): DeveloperWebhookEndpoint {
  const environment = normalizeEnum(input.environment, DEVELOPER_CONSOLE_ENVIRONMENTS, 'local');
  const urlRef = cleanText(input.urlRef, `webhook-endpoint-ref-${index + 1}`, 160);
  const endpointId = cleanText(input.endpointId, '', 80)
    || stableId('DWEB', { environment, urlRef, index }, { length: 14 });
  return {
    endpointId,
    environment,
    urlRef,
    topics: normalizeTopics(input.topics),
    status: normalizeEnum(input.status, DEVELOPER_CONSOLE_WEBHOOK_STATUSES, 'healthy'),
    signingKeyRef: cleanText(input.signingKeyRef, `signing-key-ref-${index + 1}`, 120),
    lastDeliveryAt: normalizeTimestamp(input.lastDeliveryAt, generatedAt),
    failureCount: cleanNonNegativeInteger(input.failureCount, 0),
  };
}

function defaultWebhookLogs(generatedAt: string, webhooks: DeveloperWebhookEndpoint[]): DeveloperWebhookDeliveryLog[] {
  const primaryEndpoint = webhooks[0]?.endpointId ?? 'DWEB-LOCAL-01';
  const secondaryEndpoint = webhooks[1]?.endpointId ?? primaryEndpoint;
  return [
    normalizeWebhookLog({
      endpointId: primaryEndpoint,
      topic: 'address_intent.verified',
      status: 'delivered',
      occurredAt: generatedAt,
      attemptCount: 1,
      responseCode: 200,
      eventRef: 'evt:address-intent-verified:sample',
      payloadFingerprint: 'payload:0f0bb8e9e7f22f0a',
      signatureVerified: true,
    }, 0, generatedAt),
    normalizeWebhookLog({
      endpointId: primaryEndpoint,
      topic: 'handoff.completed',
      status: 'delivered',
      occurredAt: '2026-06-20T08:45:00.000Z',
      attemptCount: 1,
      responseCode: 204,
      eventRef: 'evt:handoff-completed:sample',
      payloadFingerprint: 'payload:62bc340f58f2d01e',
      signatureVerified: true,
    }, 1, generatedAt),
    normalizeWebhookLog({
      endpointId: secondaryEndpoint,
      topic: 'credential.revoked',
      status: 'retrying',
      occurredAt: '2026-06-20T08:35:00.000Z',
      attemptCount: 2,
      responseCode: 503,
      eventRef: 'evt:credential-revoked:sample',
      payloadFingerprint: 'payload:a4872ce10f7b6b22',
      signatureVerified: true,
    }, 2, generatedAt),
    normalizeWebhookLog({
      endpointId: secondaryEndpoint,
      topic: 'audit.case.opened',
      status: 'dead-lettered',
      occurredAt: '2026-06-19T22:15:00.000Z',
      attemptCount: 6,
      responseCode: 410,
      eventRef: 'evt:audit-case-opened:sample',
      payloadFingerprint: 'payload:ce39a29d4a1447ef',
      signatureVerified: true,
    }, 3, generatedAt),
  ];
}

function normalizeWebhookLog(
  input: Partial<DeveloperWebhookDeliveryLog>,
  index: number,
  generatedAt: string,
): DeveloperWebhookDeliveryLog {
  const endpointId = cleanText(input.endpointId, `webhook-endpoint-ref-${index + 1}`, 80);
  const topic = normalizeEnum(input.topic, ADDRESS_CONNECT_WEBHOOK_TOPICS, 'address_intent.verified');
  const eventRef = cleanText(input.eventRef, `evt:developer-console:${index + 1}`, 120);
  return {
    deliveryId: cleanText(input.deliveryId, '', 80) || stableId('DLOG', { endpointId, eventRef, index }, { length: 14 }),
    endpointId,
    topic,
    status: normalizeEnum(input.status, DEVELOPER_CONSOLE_WEBHOOK_DELIVERY_STATUSES, 'delivered'),
    occurredAt: normalizeTimestamp(input.occurredAt, generatedAt),
    attemptCount: cleanNonNegativeInteger(input.attemptCount, 1),
    responseCode: cleanNonNegativeInteger(input.responseCode, 200),
    eventRef,
    payloadFingerprint: normalizeFingerprint(input.payloadFingerprint, { endpointId, eventRef, topic }),
    signatureVerified: cleanBoolean(input.signatureVerified, true),
  };
}

function defaultSdkSnippets(): DeveloperSdkSnippet[] {
  return [
    {
      language: 'typescript',
      packageName: '@agid/address',
      install: 'npm install @agid/address',
      snippet: 'const client = createAgidClient({ apiKeyRef: "env:AGID_API_KEY" });',
      testCommand: 'npm run verify:address-element',
      status: 'ready',
    },
    {
      language: 'rust',
      packageName: 'agid-address',
      install: 'cargo add agid-address',
      snippet: 'let client = AgidClient::from_key_ref("env:AGID_API_KEY")?;',
      testCommand: 'cargo test agid_vectors',
      status: 'preview',
    },
    {
      language: 'python',
      packageName: 'agid-address',
      install: 'pip install agid-address',
      snippet: 'client = AgidClient(api_key_ref="env:AGID_API_KEY")',
      testCommand: 'python -m agid.verify_vectors',
      status: 'preview',
    },
    {
      language: 'go',
      packageName: 'agid-address',
      install: 'go get github.com/agid/address-go',
      snippet: 'client := agid.NewClient(agid.WithKeyRef("env:AGID_API_KEY"))',
      testCommand: 'go test ./...',
      status: 'preview',
    },
    {
      language: 'swift',
      packageName: 'AGID',
      install: 'swift package add https://github.com/agid/agid-swift',
      snippet: 'let client = AGIDClient(keyRef: "env:AGID_API_KEY")',
      testCommand: 'swift test',
      status: 'preview',
    },
    {
      language: 'kotlin',
      packageName: 'org.agid:agid-kotlin',
      install: 'implementation("org.agid:agid-kotlin:0.1.0")',
      snippet: 'val client = AgidClient(keyRef = "env:AGID_API_KEY")',
      testCommand: './gradlew test',
      status: 'preview',
    },
    {
      language: 'java',
      packageName: 'org.agid:agid-java',
      install: '<dependency><groupId>org.agid</groupId><artifactId>agid-java</artifactId><version>0.1.0</version></dependency>',
      snippet: 'AgidClient client = AgidClient.fromKeyRef("env:AGID_API_KEY");',
      testCommand: 'mvn test',
      status: 'preview',
    },
    {
      language: 'c',
      packageName: 'agid-c',
      install: 'cmake --build sdk/agid-c',
      snippet: 'agid_client_from_key_ref("env:AGID_API_KEY");',
      testCommand: 'ctest --test-dir sdk/agid-c',
      status: 'preview',
    },
    {
      language: 'cpp',
      packageName: 'agid-cpp',
      install: 'cmake --build sdk/agid-cpp',
      snippet: 'auto client = agid::Client::fromKeyRef("env:AGID_API_KEY");',
      testCommand: 'ctest --test-dir sdk/agid-cpp',
      status: 'preview',
    },
    {
      language: 'php',
      packageName: 'agid/address',
      install: 'composer require agid/address',
      snippet: '$client = AgidClient::fromKeyRef("env:AGID_API_KEY");',
      testCommand: 'composer test',
      status: 'preview',
    },
    {
      language: 'dotnet',
      packageName: 'Agid.Address',
      install: 'dotnet add package Agid.Address',
      snippet: 'var client = AgidClient.FromKeyRef("env:AGID_API_KEY");',
      testCommand: 'dotnet test sdk/agid-dotnet',
      status: 'preview',
    },
    {
      language: 'ruby',
      packageName: 'agid-address',
      install: 'gem install agid-address',
      snippet: 'client = Agid::Client.from_key_ref("env:AGID_API_KEY")',
      testCommand: 'bundle exec ruby -Itest sdk/agid-ruby/test/*',
      status: 'preview',
    },
    {
      language: 'dart',
      packageName: 'agid_address',
      install: 'dart pub add agid_address',
      snippet: "final client = AgidClient.fromKeyRef('env:AGID_API_KEY');",
      testCommand: 'dart test sdk/agid-dart',
      status: 'preview',
    },
    {
      language: 'spec',
      packageName: 'agid-spec',
      install: 'npm run export:agid-resolver-conformance',
      snippet: 'Use sdk/agid-spec/agid-spec.json as the source contract.',
      testCommand: 'npm run verify:agid-resolver-conformance',
      status: 'ready',
    },
    {
      language: 'wasm',
      packageName: '@agid/wasm',
      install: 'npm install @agid/wasm',
      snippet: 'const agid = await initAgidWasm();',
      testCommand: 'npm test --workspace sdk/agid-wasm',
      status: 'preview',
    },
    {
      language: 'r',
      packageName: 'agid',
      install: 'R CMD check sdk/agid-r',
      snippet: 'client <- agid::agid_client("env:AGID_API_KEY")',
      testCommand: 'R CMD check sdk/agid-r',
      status: 'preview',
    },
    {
      language: 'julia',
      packageName: 'AGID.jl',
      install: 'julia --project=sdk/agid-julia -e "using Pkg; Pkg.instantiate()"',
      snippet: 'using AGID',
      testCommand: 'julia --project=sdk/agid-julia -e "using Pkg; Pkg.test()"',
      status: 'preview',
    },
    {
      language: 'elixir',
      packageName: 'agid',
      install: 'mix deps.get',
      snippet: 'Agid.Client.from_key_ref("env:AGID_API_KEY")',
      testCommand: 'mix test',
      status: 'preview',
    },
    {
      language: 'lua',
      packageName: 'agid',
      install: 'luarocks make sdk/agid-lua/agid-1.0.0-1.rockspec',
      snippet: 'local agid = require("agid")',
      testCommand: 'lua sdk/agid-lua/test/agid_test.lua',
      status: 'preview',
    },
    {
      language: 'zig',
      packageName: 'agid-zig',
      install: 'zig build test',
      snippet: 'const agid = @import("agid");',
      testCommand: 'zig build test',
      status: 'preview',
    },
    {
      language: 'nim',
      packageName: 'agid',
      install: 'nimble test',
      snippet: 'import agid',
      testCommand: 'nimble test',
      status: 'preview',
    },
  ];
}

function normalizeSdkSnippet(input: Partial<DeveloperSdkSnippet>, index: number): DeveloperSdkSnippet {
  const language = normalizeEnum(
    input.language,
    ['typescript', 'rust', 'python', 'go', 'swift', 'kotlin', 'java', 'c', 'cpp', 'php', 'dotnet', 'ruby', 'dart', 'spec', 'wasm', 'r', 'julia', 'elixir', 'lua', 'zig', 'nim'] as const,
    index === 1 ? 'rust' : index === 2 ? 'python' : 'typescript',
  );
  const defaults = defaultSdkSnippets().find(snippet => snippet.language === language) ?? defaultSdkSnippets()[0];
  return {
    language,
    packageName: cleanText(input.packageName, defaults.packageName, 80),
    install: cleanText(input.install, defaults.install, 160),
    snippet: cleanText(input.snippet, defaults.snippet, 220),
    testCommand: cleanText(input.testCommand, defaults.testCommand, 160),
    status: normalizeEnum(input.status, ['ready', 'preview'] as const, defaults.status),
  };
}

function defaultCliCommands(): DeveloperCliCommand[] {
  return [
    normalizeCliCommand({
      label: 'Encode one AGID',
      command: 'npm run agid -- encode --lat 35.681236 --lon 139.767125 --json',
      purpose: 'quickstart',
      status: 'ready',
    }, 0),
    normalizeCliCommand({
      label: 'Batch process AGID records',
      command: 'npm run agid -- batch encode --file examples/agid-batch.jsonl --input-format jsonl --json',
      purpose: 'batch',
      status: 'ready',
    }, 1),
    normalizeCliCommand({
      label: 'Run resolver conformance',
      command: 'npm run agid -- conformance --suite all --json',
      purpose: 'conformance',
      status: 'ready',
    }, 2),
    normalizeCliCommand({
      label: 'Run no-raw-address gate',
      command: 'npm run verify:no-raw-address-kit',
      purpose: 'privacy',
      status: 'ready',
    }, 3),
    normalizeCliCommand({
      label: 'Inspect OpenAPI contract',
      command: 'curl http://127.0.0.1:3000/openapi.json',
      purpose: 'openapi',
      status: 'preview',
    }, 4),
  ];
}

function normalizeCliCommand(input: Partial<DeveloperCliCommand>, index: number): DeveloperCliCommand {
  const purpose = normalizeEnum(
    input.purpose,
    ['quickstart', 'batch', 'conformance', 'privacy', 'openapi'] as const,
    index === 1 ? 'batch' : index === 2 ? 'conformance' : index === 3 ? 'privacy' : 'quickstart',
  );
  const label = cleanText(input.label, `CLI command ${index + 1}`, 100);
  const command = cleanText(input.command, 'npm run agid -- --help', 180);
  return {
    commandId: cleanText(input.commandId, '', 80) || stableId('DCLI', { purpose, command, index }, { length: 12 }),
    label,
    command,
    purpose,
    status: normalizeEnum(input.status, ['ready', 'preview'] as const, 'ready'),
  };
}

function buildOpenApiSummary(): DeveloperOpenApiSummary {
  const paths = Object.keys(AGID_OPENAPI_SPEC.paths);
  const tags = AGID_OPENAPI_SPEC.tags.map(tag => tag.name);
  const schemas = Object.keys(AGID_OPENAPI_SPEC.components?.schemas ?? {});
  const highlightedPaths = [
    '/health',
    '/openapi.json',
    '/address-element/state',
    '/address-webhooks/event',
    '/address-launch-center/evaluate',
    '/address-operations/capabilities',
  ].filter(path => paths.includes(path));

  return {
    title: AGID_OPENAPI_SPEC.info.title,
    version: AGID_OPENAPI_SPEC.info.version,
    pathCount: paths.length,
    tagCount: tags.length,
    componentSchemaCount: schemas.length,
    topTags: tags.slice(0, 12),
    highlightedPaths: highlightedPaths.length > 0 ? highlightedPaths : paths.slice(0, 6),
  };
}

function defaultTestVectors(): DeveloperTestVector[] {
  return [
    normalizeTestVector({
      surface: 'agid-core',
      fixtureRef: 'fixtures/agid-core/cell-resolution-v1.json',
      expectedHash: 'vec:8f83a1d7b7e8d355',
      status: 'pass',
    }, 0),
    normalizeTestVector({
      surface: 'agid-s',
      fixtureRef: 'fixtures/agid-s/encrypted-qr-envelope-v1.json',
      expectedHash: 'vec:b4f4cba9bc1929a2',
      status: 'pass',
    }, 1),
    normalizeTestVector({
      surface: 'webhook',
      fixtureRef: 'fixtures/webhooks/signature-envelope-v1.json',
      expectedHash: 'vec:c4910d5bd7a83490',
      status: 'warn',
    }, 2),
    normalizeTestVector({
      surface: 'no-raw-address',
      fixtureRef: 'fixtures/security/no-raw-address-release-suite.json',
      expectedHash: 'vec:7b9f0e2437c87ec1',
      status: 'pass',
    }, 3),
  ];
}

function normalizeTestVector(input: Partial<DeveloperTestVector>, index: number): DeveloperTestVector {
  const surface = normalizeEnum(
    input.surface,
    ['agid-core', 'agid-s', 'address-element', 'webhook', 'no-raw-address', 'zk-proof'] as const,
    'agid-core',
  );
  const fixtureRef = cleanText(input.fixtureRef, `fixtures/developer/vector-${index + 1}.json`, 160);
  return {
    vectorId: cleanText(input.vectorId, '', 80) || stableId('DVEC', { surface, fixtureRef, index }, { length: 14 }),
    surface,
    fixtureRef,
    expectedHash: cleanText(input.expectedHash, `vec:${stableId('HASH', { surface, fixtureRef }, { length: 16, separator: '_' }).toLowerCase()}`, 80),
    status: normalizeEnum(input.status, DEVELOPER_CONSOLE_TEST_STATUSES, 'pass'),
  };
}

function defaultConformanceResults(generatedAt: string): DeveloperConformanceResult[] {
  return [
    normalizeConformanceResult({
      suiteId: 'agid-resolver-conformance',
      label: 'AGID Resolver Conformance Tests',
      status: 'pass',
      command: 'npm run verify:agid-resolver-conformance',
      passed: 48,
      failed: 0,
      evidenceRef: 'reports/conformance/agid-resolver/latest.json',
      updatedAt: generatedAt,
    }, 0, generatedAt),
    normalizeConformanceResult({
      suiteId: 'address-test-vector-suite',
      label: 'Address Test Vector Suite',
      status: 'pass',
      command: 'npm run verify:address-test-vectors',
      passed: 64,
      failed: 0,
      evidenceRef: 'reports/conformance/address-test-vectors/latest.json',
      updatedAt: generatedAt,
    }, 1, generatedAt),
    normalizeConformanceResult({
      suiteId: 'agid-cli-conformance',
      label: 'AGID CLI Conformance',
      status: 'pass',
      command: 'npm run verify:agid-cli',
      passed: 29,
      failed: 0,
      evidenceRef: 'reports/conformance/agid-cli/latest.json',
      updatedAt: generatedAt,
    }, 2, generatedAt),
    normalizeConformanceResult({
      suiteId: 'no-raw-address-kit',
      label: 'No Raw Address Compliance Kit',
      status: 'pass',
      command: 'npm run verify:no-raw-address-kit',
      passed: 22,
      failed: 0,
      evidenceRef: 'reports/conformance/no-raw-address/latest.json',
      updatedAt: generatedAt,
    }, 3, generatedAt),
    normalizeConformanceResult({
      suiteId: 'address-element-web-components',
      label: 'Address Element Web Components',
      status: 'warn',
      command: 'npm run verify:address-element-web-components',
      passed: 18,
      failed: 0,
      evidenceRef: 'reports/conformance/address-element-web-components/latest.json',
      updatedAt: generatedAt,
    }, 4, generatedAt),
  ];
}

function normalizeConformanceResult(
  input: Partial<DeveloperConformanceResult>,
  index: number,
  generatedAt: string,
): DeveloperConformanceResult {
  const suiteId = cleanText(input.suiteId, '', 90) || stableId('DSUITE', input, { length: 12 });
  return {
    suiteId,
    label: cleanText(input.label, `Conformance suite ${index + 1}`, 120),
    status: normalizeEnum(input.status, DEVELOPER_CONSOLE_TEST_STATUSES, 'pass'),
    command: cleanText(input.command, 'npm run verify:agid-resolver-conformance', 180),
    passed: cleanNonNegativeInteger(input.passed, 0),
    failed: cleanNonNegativeInteger(input.failed, 0),
    evidenceRef: cleanText(input.evidenceRef, `reports/conformance/${suiteId}.json`, 180),
    updatedAt: normalizeTimestamp(input.updatedAt, generatedAt),
  };
}

function defaultLaunchChecks(): DeveloperLaunchCheck[] {
  const evaluation = evaluateAddressLaunchCenter({
    environment: 'production',
    profile: 'ec-pos',
    mode: 'server',
    requiresHighRiskMode: true,
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
      deadLetterQueue: true,
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
      enabled: true,
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
      externalAuditReady: false,
    },
  });

  return evaluation.items.slice(0, 8).map(item => ({
    id: item.id,
    label: item.label,
    status: item.status === 'pass' ? 'pass' : item.status === 'warn' ? 'warn' : 'fail',
    evidenceRef: item.presentEvidence[0] ?? 'launch-center:evidence-ref-required',
    nextAction: item.remediation,
  }));
}

function normalizeLaunchCheck(input: Partial<DeveloperLaunchCheck>, index: number): DeveloperLaunchCheck {
  const id = cleanText(input.id, '', 80) || stableId('DCHK', input, { length: 12 });
  return {
    id,
    label: cleanText(input.label, `Launch check ${index + 1}`, 120),
    status: normalizeEnum(input.status, DEVELOPER_CONSOLE_LAUNCH_STATUSES, 'warn'),
    evidenceRef: cleanText(input.evidenceRef, `launch-center:${id}`, 160),
    nextAction: cleanText(input.nextAction, 'Attach evidence and rerun launch checks.', 200),
  };
}

function defaultApiErrorExamples(): DeveloperApiErrorExample[] {
  return [
    normalizeApiErrorExample({
      statusCode: 400,
      code: 'invalid_commitment_payload',
      cause: 'The request body included an unsupported field or malformed commitment reference.',
      fix: 'Send refs, fingerprints, or commitments only; remove private address bodies before retrying.',
      retryable: false,
      noRawAddressImpact: 'blocked',
    }, 0),
    normalizeApiErrorExample({
      statusCode: 401,
      code: 'api_key_ref_not_authorized',
      cause: 'The key reference is missing a required scope for the selected API surface.',
      fix: 'Rotate or re-issue a scoped key reference, then rerun conformance tests.',
      retryable: false,
      noRawAddressImpact: 'safe',
    }, 1),
    normalizeApiErrorExample({
      statusCode: 429,
      code: 'rate_limited',
      cause: 'The sandbox or connector budget is temporarily exhausted.',
      fix: 'Honor Retry-After, use idempotency keys, and keep the request in the dead-letter queue if needed.',
      retryable: true,
      noRawAddressImpact: 'safe',
    }, 2),
  ];
}

function normalizeApiErrorExample(input: Partial<DeveloperApiErrorExample>, index: number): DeveloperApiErrorExample {
  const defaults = defaultApiErrorDefaults[index] ?? defaultApiErrorDefaults[0];
  return {
    statusCode: cleanNonNegativeInteger(input.statusCode, defaults.statusCode),
    code: cleanText(input.code, defaults.code, 80),
    cause: cleanText(input.cause, defaults.cause, 180),
    fix: cleanText(input.fix, defaults.fix, 220),
    retryable: cleanBoolean(input.retryable, defaults.retryable),
    noRawAddressImpact: normalizeEnum(input.noRawAddressImpact, ['safe', 'blocked', 'review'] as const, defaults.noRawAddressImpact),
  };
}

const defaultApiErrorDefaults: DeveloperApiErrorExample[] = [
  {
    statusCode: 400,
    code: 'invalid_commitment_payload',
    cause: 'The request body included an unsupported field or malformed commitment reference.',
    fix: 'Send refs, fingerprints, or commitments only; remove private address bodies before retrying.',
    retryable: false,
    noRawAddressImpact: 'blocked',
  },
  {
    statusCode: 401,
    code: 'api_key_ref_not_authorized',
    cause: 'The key reference is missing a required scope for the selected API surface.',
    fix: 'Rotate or re-issue a scoped key reference, then rerun conformance tests.',
    retryable: false,
    noRawAddressImpact: 'safe',
  },
  {
    statusCode: 429,
    code: 'rate_limited',
    cause: 'The sandbox or connector budget is temporarily exhausted.',
    fix: 'Honor Retry-After, use idempotency keys, and keep the request in the dead-letter queue if needed.',
    retryable: true,
    noRawAddressImpact: 'safe',
  },
];

function defaultFeatureCategories(): DeveloperFeatureCategory[] {
  return [
    normalizeFeatureCategory({ id: 'resolver', label: 'Resolver', summary: 'Resolve AGID/AOID refs into safe operational handoff metadata.', status: 'ready' }, 0),
    normalizeFeatureCategory({ id: 'secure-qr', label: 'Secure QR', summary: 'Create private address QR envelopes without exposing raw address text.', status: 'ready' }, 1),
    normalizeFeatureCategory({ id: 'machine-handoff', label: 'Machine Handoff', summary: 'Verify POS, hotel, locker, drone, and vehicle handoff envelopes.', status: 'preview' }, 2),
    normalizeFeatureCategory({ id: 'address-element', label: 'Address Element', summary: 'Embed country-aware address registration and quality display.', status: 'ready' }, 3),
    normalizeFeatureCategory({ id: 'webhooks', label: 'Webhooks', summary: 'Subscribe to delivery, registry, revocation, and handoff events.', status: 'ready' }, 4),
    normalizeFeatureCategory({ id: 'country-packs', label: 'Country Packs', summary: 'Lazy-load address, postal, language, and geography metadata by region.', status: 'preview' }, 5),
    normalizeFeatureCategory({ id: 'zk', label: 'ZK', summary: 'Prepare proof-friendly predicates while keeping blockchain optional.', status: 'preview' }, 6),
  ];
}

function normalizeFeatureCategory(input: Partial<DeveloperFeatureCategory>, index: number): DeveloperFeatureCategory {
  const id = cleanText(input.id, `category-${index + 1}`, 80);
  return {
    id,
    label: cleanText(input.label, id, 80),
    summary: cleanText(input.summary, 'Developer category', 180),
    status: normalizeEnum(input.status, ['ready', 'preview'] as const, 'preview'),
  };
}

function defaultSelfHostingOptions(): DeveloperSelfHostingOption[] {
  return [
    normalizeSelfHostingOption({
      mode: 'local-only',
      label: 'Local-only sandbox',
      summary: 'Run AGID samples with static fixtures, no external traffic, and no production secrets.',
      requirements: ['OpenAPI fixture', 'conformance vectors', 'no-raw-address scan'],
      status: 'ready',
    }, 0),
    normalizeSelfHostingOption({
      mode: 'self-hosted',
      label: 'Self-hosted gateway',
      summary: 'Operate the resolver, registry, queue, audit log, and country-pack cache inside your own boundary.',
      requirements: ['Postgres or MongoDB', 'queue or DLQ', 'TLS', 'audit log', 'secret encryption'],
      status: 'preview',
    }, 1),
    normalizeSelfHostingOption({
      mode: 'managed-integration',
      label: 'Managed integration',
      summary: 'Connect OPERA, POS, postal lookup, translation, and validation through connector-specific policies.',
      requirements: ['connector auth', 'allowlist', 'rate limits', 'typed error mapper'],
      status: 'preview',
    }, 2),
  ];
}

function normalizeSelfHostingOption(input: Partial<DeveloperSelfHostingOption>, index: number): DeveloperSelfHostingOption {
  const mode = normalizeEnum(input.mode, ['local-only', 'self-hosted', 'managed-integration'] as const, index === 1 ? 'self-hosted' : index === 2 ? 'managed-integration' : 'local-only');
  return {
    mode,
    label: cleanText(input.label, mode, 100),
    summary: cleanText(input.summary, 'Deployment option', 200),
    requirements: cleanTextArray(input.requirements).slice(0, 8),
    status: normalizeEnum(input.status, ['ready', 'preview'] as const, mode === 'local-only' ? 'ready' : 'preview'),
  };
}

function defaultCommunityLinks(): DeveloperCommunityLink[] {
  return [
    normalizeCommunityLink({ id: 'agid-aoid-spec', label: 'AGID/AOID Spec', track: 'protocol', detail: 'Protocol contract, resolver semantics, and parity vectors.', hrefRef: 'docs/specs/agid-aoid-spec.md' }, 0),
    normalizeCommunityLink({ id: 'address-morphism-theory', label: 'Address Morphism Theory', track: 'research', detail: 'Research notes for address transformation and regional rendering.', hrefRef: 'docs/research/address-morphism-theory.md' }, 1),
    normalizeCommunityLink({ id: 'secure-address-qr', label: 'Secure Address QR', track: 'security', detail: 'Private QR envelope and no-raw-address release gate.', hrefRef: 'docs/specs/secure-address-qr.md' }, 2),
    normalizeCommunityLink({ id: 'sdk-parity', label: 'SDK parity', track: 'sdk', detail: 'Generated SDK targets verified against shared conformance fixtures.', hrefRef: 'sdk/README.md' }, 3),
    normalizeCommunityLink({ id: 'geo-data', label: 'Geo data packs', track: 'geo-data', detail: 'Country and region packs for address, postal, building, sea, mountain, and nature data.', hrefRef: 'docs/ops/country-packs.md' }, 4),
    normalizeCommunityLink({ id: 'grant-readiness', label: 'Grant readiness', track: 'docs', detail: 'OSS donation, grant, and ecosystem review evidence.', hrefRef: 'docs/product/open-source-readiness.md' }, 5),
  ];
}

function normalizeCommunityLink(input: Partial<DeveloperCommunityLink>, index: number): DeveloperCommunityLink {
  const track = normalizeEnum(
    input.track,
    ['protocol', 'sdk', 'geo-data', 'security', 'docs', 'research'] as const,
    index === 1 ? 'research' : index === 2 ? 'security' : 'protocol',
  );
  const id = cleanText(input.id, `community-${index + 1}`, 80);
  return {
    id,
    label: cleanText(input.label, id, 100),
    track,
    detail: cleanText(input.detail, 'Contributor path', 200),
    hrefRef: cleanText(input.hrefRef, `docs/${id}.md`, 180),
  };
}

function defaultGeoExamples(): DeveloperGeoExample[] {
  return [
    normalizeGeoExample({ id: 'agid-grid', label: 'AGID Grid', scenario: 'Render absolute grid cells and selected-cell overlays from the same mathematical bounds.', apiSurface: 'grid', examplePath: '/developer#geo-examples/grid', status: 'ready' }, 0),
    normalizeGeoExample({ id: 'postal-lookup', label: 'Postal lookup', scenario: 'Autofill administrative candidates when a reliable postal source exists.', apiSurface: 'postal', examplePath: '/developer#geo-examples/postal', status: 'preview' }, 1),
    normalizeGeoExample({ id: 'building-lookup', label: 'Building lookup', scenario: 'Fetch building-name candidates from OSM, OpenFreeMap, or Overture-style references.', apiSurface: 'buildings', examplePath: '/developer#geo-examples/buildings', status: 'preview' }, 2),
    normalizeGeoExample({ id: 'sea-mountain-nature', label: 'Sea/Mountain/Nature', scenario: 'Explain addresses around water, terrain, protected areas, islands, and remote features.', apiSurface: 'natural-geo', examplePath: '/developer#geo-examples/nature', status: 'preview' }, 3),
    normalizeGeoExample({ id: 'pos-handoff', label: 'POS handoff', scenario: 'Read a secure address QR and verify delivery handoff without exposing address bodies.', apiSurface: 'pos', examplePath: '/developer#geo-examples/pos', status: 'ready' }, 4),
    normalizeGeoExample({ id: 'drone-handoff', label: 'Drone handoff', scenario: 'Prepare landing, height, precision, and obstacle-aware delivery constraints.', apiSurface: 'drone', examplePath: '/developer#geo-examples/drone', status: 'preview' }, 5),
  ];
}

function normalizeGeoExample(input: Partial<DeveloperGeoExample>, index: number): DeveloperGeoExample {
  const id = cleanText(input.id, `geo-example-${index + 1}`, 80);
  return {
    id,
    label: cleanText(input.label, id, 100),
    scenario: cleanText(input.scenario, 'Geo developer example', 220),
    apiSurface: cleanText(input.apiSurface, 'geo', 80),
    examplePath: cleanText(input.examplePath, `/developer#geo-examples/${id}`, 160),
    status: normalizeEnum(input.status, ['ready', 'preview'] as const, 'preview'),
  };
}

export function validateDeveloperConsolePayloadIsSafe(value: unknown) {
  const forbiddenPaths = addressConnectPrivateMaterialPaths(value);
  return {
    safe: forbiddenPaths.length === 0,
    forbiddenPaths,
  };
}

export function buildDeveloperConsole(input: DeveloperConsoleInput = {}): DeveloperConsole {
  const generatedAt = normalizeTimestamp(input.generatedAt, new Date().toISOString());
  const forbiddenPaths = validateDeveloperConsolePayloadIsSafe(input).forbiddenPaths;
  const errors = forbiddenPaths.map(path => `private-material-not-accepted:${path}`);
  const warnings: string[] = [];

  const apiKeys = (input.apiKeys?.length ? input.apiKeys : undefined)?.map((key, index) => normalizeApiKey(key, index, generatedAt))
    ?? defaultApiKeys(generatedAt);
  const webhooks = (input.webhooks?.length ? input.webhooks : undefined)?.map((webhook, index) => normalizeWebhook(webhook, index, generatedAt))
    ?? defaultWebhooks(generatedAt);
  const webhookLogs = (input.webhookLogs?.length ? input.webhookLogs : undefined)?.map((log, index) => normalizeWebhookLog(log, index, generatedAt))
    ?? defaultWebhookLogs(generatedAt, webhooks);
  const sdkSnippets = (input.sdkSnippets?.length ? input.sdkSnippets : undefined)?.map(normalizeSdkSnippet)
    ?? defaultSdkSnippets();
  const cliCommands = (input.cliCommands?.length ? input.cliCommands : undefined)?.map(normalizeCliCommand)
    ?? defaultCliCommands();
  const testVectors = (input.testVectors?.length ? input.testVectors : undefined)?.map(normalizeTestVector)
    ?? defaultTestVectors();
  const conformanceResults = (input.conformanceResults?.length ? input.conformanceResults : undefined)?.map((result, index) => normalizeConformanceResult(result, index, generatedAt))
    ?? defaultConformanceResults(generatedAt);
  const launchChecks = (input.launchChecks?.length ? input.launchChecks : undefined)?.map(normalizeLaunchCheck)
    ?? defaultLaunchChecks();
  const apiErrorExamples = (input.apiErrorExamples?.length ? input.apiErrorExamples : undefined)?.map(normalizeApiErrorExample)
    ?? defaultApiErrorExamples();
  const featureCategories = (input.featureCategories?.length ? input.featureCategories : undefined)?.map(normalizeFeatureCategory)
    ?? defaultFeatureCategories();
  const selfHostingOptions = (input.selfHostingOptions?.length ? input.selfHostingOptions : undefined)?.map(normalizeSelfHostingOption)
    ?? defaultSelfHostingOptions();
  const communityLinks = (input.communityLinks?.length ? input.communityLinks : undefined)?.map(normalizeCommunityLink)
    ?? defaultCommunityLinks();
  const geoExamples = (input.geoExamples?.length ? input.geoExamples : undefined)?.map(normalizeGeoExample)
    ?? defaultGeoExamples();
  const openApi = buildOpenApiSummary();

  if (webhooks.some(webhook => webhook.failureCount > 0)) warnings.push('webhook-delivery-failures-present');
  if (webhookLogs.some(log => log.status === 'failed' || log.status === 'dead-lettered')) warnings.push('webhook-log-failures-present');
  if (apiKeys.some(key => key.status === 'rotation-due')) warnings.push('api-key-rotation-due');
  if (testVectors.some(vector => vector.status !== 'pass')) warnings.push('test-vector-attention-required');
  if (conformanceResults.some(result => result.status !== 'pass' || result.failed > 0)) warnings.push('conformance-attention-required');
  if (errors.length > 0) warnings.push('developer-console-input-contained-private-material');

  const developerRoot = stableId('DCR', {
    generatedAt,
    apiKeys: apiKeys.map(key => [key.keyId, key.status, key.fingerprint]),
    webhooks: webhooks.map(webhook => [webhook.endpointId, webhook.status, webhook.signingKeyRef]),
    webhookLogs: webhookLogs.map(log => [log.deliveryId, log.status, log.payloadFingerprint]),
    cli: cliCommands.map(command => [command.commandId, command.purpose, command.status]),
    vectors: testVectors.map(vector => [vector.vectorId, vector.status, vector.expectedHash]),
    conformance: conformanceResults.map(result => [result.suiteId, result.status, result.failed, result.evidenceRef]),
    launch: launchChecks.map(check => [check.id, check.status, check.evidenceRef]),
    apiErrors: apiErrorExamples.map(error => [error.statusCode, error.code, error.retryable, error.noRawAddressImpact]),
    categories: featureCategories.map(category => [category.id, category.status]),
    hosting: selfHostingOptions.map(option => [option.mode, option.status]),
    community: communityLinks.map(link => [link.id, link.track, link.hrefRef]),
    geo: geoExamples.map(example => [example.id, example.status, example.apiSurface]),
  }, { length: 24 });

  const safeExport: DeveloperConsole['safeExport'] = {
    developerRoot,
    apiKeyRefs: apiKeys.map(({ keyId, environment, scopes, fingerprint, status }) => ({
      keyId,
      environment,
      scopes,
      fingerprint,
      status,
    })),
    webhookRefs: webhooks.map(({ endpointId, environment, topics, status, signingKeyRef }) => ({
      endpointId,
      environment,
      topics,
      status,
      signingKeyRef,
    })),
    webhookLogRefs: webhookLogs.map(({
      deliveryId,
      endpointId,
      topic,
      status,
      eventRef,
      payloadFingerprint,
      signatureVerified,
    }) => ({
      deliveryId,
      endpointId,
      topic,
      status,
      eventRef,
      payloadFingerprint,
      signatureVerified,
    })),
    sdkTargets: sdkSnippets.map(({ language, packageName, status }) => ({ language, packageName, status })),
    cliCommandRefs: cliCommands.map(({ commandId, command, purpose, status }) => ({
      commandId,
      command,
      purpose,
      status,
    })),
    openApi,
    testVectorRefs: testVectors.map(({ vectorId, surface, fixtureRef, expectedHash, status }) => ({
      vectorId,
      surface,
      fixtureRef,
      expectedHash,
      status,
    })),
    conformanceRefs: conformanceResults.map(({ suiteId, status, command, passed, failed, evidenceRef }) => ({
      suiteId,
      status,
      command,
      passed,
      failed,
      evidenceRef,
    })),
    launchCheckRefs: launchChecks.map(({ id, status, evidenceRef }) => ({ id, status, evidenceRef })),
    apiErrorRefs: apiErrorExamples.map(({ statusCode, code, retryable, noRawAddressImpact }) => ({
      statusCode,
      code,
      retryable,
      noRawAddressImpact,
    })),
    featureCategoryRefs: featureCategories.map(({ id, label, status }) => ({ id, label, status })),
    selfHostingRefs: selfHostingOptions.map(({ mode, label, status }) => ({ mode, label, status })),
    communityRefs: communityLinks.map(({ id, track, hrefRef }) => ({ id, track, hrefRef })),
    geoExampleRefs: geoExamples.map(({ id, label, apiSurface, status }) => ({ id, label, apiSurface, status })),
    privacy: {
      rawAddressAccepted: false,
      rawAgidAccepted: false,
      rawAoidAccepted: false,
      proofCodeAccepted: false,
      keyMaterialAccepted: false,
    },
  };

  return {
    modelVersion: DEVELOPER_CONSOLE_MODEL_VERSION,
    accepted: errors.length === 0,
    generatedAt,
    developerRoot,
    apiKeys,
    webhooks,
    webhookLogs,
    sdkSnippets,
    cliCommands,
    openApi,
    testVectors,
    conformanceResults,
    launchChecks,
    apiErrorExamples,
    featureCategories,
    selfHostingOptions,
    communityLinks,
    geoExamples,
    totals: {
      activeKeys: apiKeys.filter(key => key.status === 'active').length,
      rotationDueKeys: apiKeys.filter(key => key.status === 'rotation-due').length,
      webhookEndpoints: webhooks.length,
      webhookFailures: webhooks.reduce((sum, webhook) => sum + webhook.failureCount, 0),
      webhookLogEvents: webhookLogs.length,
      webhookDeadLetters: webhookLogs.filter(log => log.status === 'dead-lettered').length,
      sdkTargets: sdkSnippets.length,
      cliCommands: cliCommands.length,
      openApiPaths: openApi.pathCount,
      testVectors: testVectors.length,
      failingTests: testVectors.filter(vector => vector.status === 'fail').length,
      conformanceSuites: conformanceResults.length,
      failingConformance: conformanceResults.filter(result => result.status === 'fail' || result.failed > 0).length,
      failingLaunchChecks: launchChecks.filter(check => check.status === 'fail').length,
      communityLinks: communityLinks.length,
      geoExamples: geoExamples.length,
    },
    safeExport,
    errors,
    warnings,
  };
}

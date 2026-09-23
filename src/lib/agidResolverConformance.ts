import { encodeAGID } from './agid';
import {
  AGID_LOCAL_RESOLVER_VERSION,
  resolveAgidLocal,
  type AgidLocalResolverAction,
  type AgidLocalResolverInput,
  type AgidLocalResolverInputKind,
  type AgidLocalResolverStatus,
} from './agidLocalResolver';
import {
  ADDRESS_STANDARD_LIBRARY_RESOLUTION_VERSION,
  buildAddressStandardLibraryResolution,
  type AddressStandardLibraryResolutionInput,
  type AddressStandardLibraryStage,
} from './addressStandardLibraryResolver';
import {
  FEDERATED_RESOLVER_VERSION,
  createStaticFederatedResolverSource,
  resolveFederatedAddress,
  type FederatedResolverDecision,
  type FederatedResolverMode,
  type FederatedResolverSourceKind,
  type FederatedResolverSourceResponse,
  type FederatedResolverStatus,
} from './federatedResolver';
import { stableCommitment, stableJson } from './redactedWorkflowCore';

export const AGID_RESOLVER_CONFORMANCE_VERSION = 'agid-resolver-conformance-tests-v0.1';

export type AgidResolverConformanceSurface =
  | 'agid-local-resolver'
  | 'standard-library-resolver'
  | 'federated-resolver'
  | 'privacy-boundary';

export type AgidResolverConformanceCaseKind =
  | 'coordinates-to-agid'
  | 'agid-to-cell'
  | 'agid-s-needs-key'
  | 'address-text-partial'
  | 'standard-library-plan'
  | 'federated-consensus'
  | 'federated-private-material-block';

export type AgidResolverConformancePrivacyClass =
  | 'synthetic-public'
  | 'negative-synthetic-private-sentinel';

export type AgidResolverConformanceSourceFixture = {
  sourceId: string;
  sourceKind?: FederatedResolverSourceKind;
  trustScore?: number;
  response: FederatedResolverSourceResponse;
};

export type AgidResolverConformanceFederatedInput = {
  mode: FederatedResolverMode;
  domain: string;
  salt?: string;
  now?: string;
  highRiskMode?: boolean;
  allowPublicAgid?: boolean;
  quorum?: number;
  minTrustScore?: number;
  minResolvedConfidence?: number;
  payload: Record<string, unknown>;
  sources: AgidResolverConformanceSourceFixture[];
};

export type AgidResolverConformanceInput = {
  local?: AgidLocalResolverInput;
  standardLibrary?: AddressStandardLibraryResolutionInput;
  federated?: AgidResolverConformanceFederatedInput;
};

export type AgidResolverConformanceExpected = {
  resolverVersionsInclude: string[];
  status?: AgidLocalResolverStatus | FederatedResolverStatus;
  statusIn?: Array<AgidLocalResolverStatus | FederatedResolverStatus>;
  decision?: FederatedResolverDecision;
  inputKind?: AgidLocalResolverInputKind;
  agidId?: string;
  mode?: 'local-only' | FederatedResolverMode;
  actionsInclude?: Array<AgidLocalResolverAction | string>;
  auditStepsInclude?: string[];
  noRawPrivateMaterial: true;
  expectedRejectsPrivateMaterial?: true;
  standardLibrary?: {
    freeOnly?: boolean;
    canParseLocally?: boolean;
    primaryIdsInclude?: string[];
    requestedCapabilitiesInclude?: AddressStandardLibraryStage[];
  };
  federated?: {
    quorumMet?: boolean;
    agreementCount?: number;
    sourceCount?: number;
    winningTargetKey?: string;
    privacy: {
      rawAddressSentToFederation: false;
      rawAgidSentToFederation: false;
      rawAoidSentToFederation: false;
      rawCoordinatesSentToFederation: false;
      privatePayloadKeptLocal: true;
    };
  };
  expectedFingerprint: string;
};

export type AgidResolverConformanceCase = {
  caseId: string;
  kind: AgidResolverConformanceCaseKind;
  title: string;
  surfaces: AgidResolverConformanceSurface[];
  privacyClass: AgidResolverConformancePrivacyClass;
  license: 'CC0';
  description: string;
  input: AgidResolverConformanceInput;
  expected: AgidResolverConformanceExpected;
  requiredAssertions: string[];
};

export type AgidResolverConformanceManifest = {
  suiteId: 'agid-resolver-conformance-tests';
  version: typeof AGID_RESOLVER_CONFORMANCE_VERSION;
  generatedAt: string;
  license: 'CC0 for synthetic test cases; Apache-2.0 for harness code';
  redistributionPolicy: string;
  privacyPolicy: string;
  counts: {
    cases: number;
    surfaces: Record<AgidResolverConformanceSurface, number>;
    negativeCases: number;
  };
  files: Array<{
    path: string;
    role: 'manifest' | 'suite' | 'cases' | 'checklists' | 'documentation';
    mediaType: 'application/json' | 'text/markdown';
    containsPersonalData: false;
    containsThirdPartyData: false;
    containsRealRawAddressData: false;
  }>;
};

export type AgidResolverConformanceSuite = {
  manifest: AgidResolverConformanceManifest;
  cases: AgidResolverConformanceCase[];
  checklists: AgidResolverConformanceChecklist[];
  conformance: {
    requiredChecks: string[];
    forbiddenPrivateKeys: string[];
    implementationNotes: string[];
  };
};

export type AgidResolverConformanceChecklist = {
  checklistId: string;
  title: string;
  appliesTo: AgidResolverConformanceSurface[];
  items: string[];
};

export type AgidResolverConformanceCaseResult = {
  caseId: string;
  kind: AgidResolverConformanceCaseKind;
  passed: boolean;
  errors: string[];
  observed: {
    resolverVersions: string[];
    status?: string;
    decision?: string;
    inputKind?: string;
    agidId?: string;
    mode?: string;
    actions?: string[];
    auditSteps?: string[];
    standardLibrary?: {
      freeOnly: boolean;
      canParseLocally: boolean;
      primaryIds: string[];
      requestedCapabilities: string[];
    };
    federated?: {
      quorumMet: boolean;
      agreementCount: number;
      sourceCount: number;
      winningTargetKey?: string;
      privacy: {
        rawAddressSentToFederation: false;
        rawAgidSentToFederation: false;
        rawAoidSentToFederation: false;
        rawCoordinatesSentToFederation: false;
        privatePayloadKeptLocal: true;
      };
    };
  };
};

export type AgidResolverConformanceSuiteRun = {
  version: typeof AGID_RESOLVER_CONFORMANCE_VERSION;
  passed: boolean;
  results: AgidResolverConformanceCaseResult[];
};

export type AgidResolverConformanceValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

type AgidResolverConformanceSeed = Omit<AgidResolverConformanceCase, 'expected' | 'license'> & {
  expected: Omit<AgidResolverConformanceExpected, 'expectedFingerprint'>;
};

const GENERATED_AT = '2026-06-20T00:00:00.000Z';

const FORBIDDEN_PRIVATE_KEYS = [
  'address',
  'addressText',
  'rawAddress',
  'recipientName',
  'phone',
  'phoneNumber',
  'email',
  'proofCode',
  'passkeyChallenge',
  'aoidSecret',
  'privateKey',
  'secret',
  'agidSPlaintext',
  'credentialBody',
  'passportNumber',
  'lat',
  'lon',
  'lng',
  'coordinates',
];

const CONFORMANCE_COORDINATE = {
  lat: 1.25,
  lon: 1.75,
} as const;

const BASE_AGID = encodeAGID(CONFORMANCE_COORDINATE.lat, CONFORMANCE_COORDINATE.lon);

const FEDERATED_CONSENSUS_KEY = 'addr_commitment_resolver_case_alpha';

function expectedFingerprint(expected: Omit<AgidResolverConformanceExpected, 'expectedFingerprint'>) {
  return stableCommitment('agid-resolver-conformance', expected, { length: 24 });
}

function caseExpected(expected: Omit<AgidResolverConformanceExpected, 'expectedFingerprint'>): AgidResolverConformanceExpected {
  return {
    ...expected,
    expectedFingerprint: expectedFingerprint(expected),
  };
}

const CASE_SEEDS: AgidResolverConformanceSeed[] = [
  {
    caseId: 'resolver-local-coordinates-to-agid-v1',
    kind: 'coordinates-to-agid',
    title: 'Local coordinates resolve to a deterministic AGID',
    surfaces: ['agid-local-resolver', 'privacy-boundary'],
    privacyClass: 'synthetic-public',
    description: 'A local resolver must encode public synthetic coordinates without requiring network, ZK, Ethereum, or server registry calls.',
    input: {
      local: {
        coordinates: CONFORMANCE_COORDINATE,
      },
    },
    expected: {
      resolverVersionsInclude: [AGID_LOCAL_RESOLVER_VERSION],
      statusIn: ['resolved', 'partial'],
      inputKind: 'coordinates',
      agidId: BASE_AGID.id,
      mode: 'local-only',
      actionsInclude: ['do-not-send-private-fields'],
      auditStepsInclude: ['detect-input', 'decode-agid', 'evaluate-address-intelligence'],
      noRawPrivateMaterial: true,
    },
    requiredAssertions: [
      'AGID id must match the deterministic encoder output',
      'resolver mode must remain local-only',
      'private-field egress action must be present',
    ],
  },
  {
    caseId: 'resolver-local-agid-to-cell-v1',
    kind: 'agid-to-cell',
    title: 'Public AGID resolves back to cell coordinates',
    surfaces: ['agid-local-resolver', 'privacy-boundary'],
    privacyClass: 'synthetic-public',
    description: 'A public AGID query must decode locally and expose the decoded cell result without server dependency.',
    input: {
      local: {
        query: BASE_AGID.id,
      },
    },
    expected: {
      resolverVersionsInclude: [AGID_LOCAL_RESOLVER_VERSION],
      statusIn: ['resolved', 'partial'],
      inputKind: 'agid',
      agidId: BASE_AGID.id,
      mode: 'local-only',
      actionsInclude: ['do-not-send-private-fields'],
      auditStepsInclude: ['detect-input', 'decode-agid'],
      noRawPrivateMaterial: true,
    },
    requiredAssertions: [
      'AGID input must be detected as agid',
      'decoded AGID id must equal the query id',
      'local audit must include a decode step',
    ],
  },
  {
    caseId: 'resolver-agid-s-needs-key-v1',
    kind: 'agid-s-needs-key',
    title: 'AGID-S never opens without a local key',
    surfaces: ['agid-local-resolver', 'privacy-boundary'],
    privacyClass: 'synthetic-public',
    description: 'An encrypted AGID-S token-like value must return needs-key unless the local key ring can decrypt it.',
    input: {
      local: {
        query: 'AGIDS1-INVALIDTOKEN',
      },
    },
    expected: {
      resolverVersionsInclude: [AGID_LOCAL_RESOLVER_VERSION],
      status: 'needs-key',
      inputKind: 'agid-s',
      mode: 'local-only',
      actionsInclude: ['request-agid-s-key', 'do-not-send-private-fields'],
      auditStepsInclude: ['detect-input', 'open-agid-s'],
      noRawPrivateMaterial: true,
    },
    requiredAssertions: [
      'AGID-S input must be detected as encrypted',
      'resolver must request a local key',
      'resolver must not expose a plaintext AGID',
    ],
  },
  {
    caseId: 'resolver-address-text-partial-v1',
    kind: 'address-text-partial',
    title: 'Free-form text stays partial until confirmed',
    surfaces: ['agid-local-resolver', 'privacy-boundary'],
    privacyClass: 'synthetic-public',
    description: 'A synthetic free-form locality label must not be treated as a fully verified delivery address without evidence.',
    input: {
      local: {
        query: 'Synthetic Central District',
        countryCode: 'JP',
      },
    },
    expected: {
      resolverVersionsInclude: [AGID_LOCAL_RESOLVER_VERSION],
      statusIn: ['partial', 'resolved'],
      inputKind: 'address-text',
      mode: 'local-only',
      actionsInclude: ['do-not-send-private-fields'],
      auditStepsInclude: ['detect-input', 'load-address-format', 'evaluate-address-intelligence'],
      noRawPrivateMaterial: true,
    },
    requiredAssertions: [
      'free-form text must be detected as address-text',
      'private-field egress action must be present',
      'implementations must not claim strong verification from text alone',
    ],
  },
  {
    caseId: 'resolver-standard-library-free-local-first-v1',
    kind: 'standard-library-plan',
    title: 'Standard library plan is free and local-first',
    surfaces: ['standard-library-resolver', 'privacy-boundary'],
    privacyClass: 'synthetic-public',
    description: 'The resolver plan must prefer local parser and Unicode normalizer before optional postal, geodata, and translation lookups.',
    input: {
      standardLibrary: {
        countryCode: 'JP',
        targetCountries: ['JP'],
        hasPostcode: true,
        hasCoordinates: true,
        lookupRequired: true,
        includeGlobalFallbacks: true,
        sourceLanguage: 'ja',
        targetLanguage: 'en',
        allowCredentialedSources: false,
        libpostalEndpointConfigured: false,
      },
    },
    expected: {
      resolverVersionsInclude: [ADDRESS_STANDARD_LIBRARY_RESOLUTION_VERSION],
      noRawPrivateMaterial: true,
      standardLibrary: {
        freeOnly: true,
        canParseLocally: true,
        primaryIdsInclude: ['local-address-parser', 'local-unicode-address-normalizer'],
        requestedCapabilitiesInclude: ['parse', 'normalize', 'format', 'postal', 'geodata', 'translation', 'transliteration'],
      },
    },
    requiredAssertions: [
      'local parser must be primary',
      'local Unicode normalizer must be primary',
      'credentialed sources must not be required',
    ],
  },
  {
    caseId: 'resolver-federated-consensus-v1',
    kind: 'federated-consensus',
    title: 'Federated resolver accepts matching public commitments',
    surfaces: ['federated-resolver', 'privacy-boundary'],
    privacyClass: 'synthetic-public',
    description: 'Two independent synthetic sources agree on a public address-reference commitment without seeing raw address, raw AGID, raw AOID, or coordinates.',
    input: {
      federated: {
        mode: 'hybrid',
        domain: 'resolver-conformance:delivery',
        salt: 'resolver-conformance-salt',
        now: '2026-06-20T00:00:00.000Z',
        quorum: 2,
        minResolvedConfidence: 0.55,
        payload: {
          addressReferenceCommitment: FEDERATED_CONSENSUS_KEY,
          countryCode: 'JP',
          purpose: 'delivery',
          issuerId: 'issuer-synthetic',
        },
        sources: [
          {
            sourceId: 'local-cache-alpha',
            sourceKind: 'local-cache',
            trustScore: 0.9,
            response: {
              status: 'resolved',
              confidence: 0.9,
              addressReferenceCommitment: FEDERATED_CONSENSUS_KEY,
              freshnessRoot: 'fresh_root_alpha',
            },
          },
          {
            sourceId: 'official-source-beta',
            sourceKind: 'official-source',
            trustScore: 0.82,
            response: {
              status: 'resolved',
              confidence: 0.84,
              addressReferenceCommitment: FEDERATED_CONSENSUS_KEY.toUpperCase(),
              revocationRoot: 'rev_root_beta',
            },
          },
        ],
      },
    },
    expected: {
      resolverVersionsInclude: [FEDERATED_RESOLVER_VERSION],
      status: 'resolved',
      decision: 'accept',
      mode: 'hybrid',
      actionsInclude: ['use-federated-result', 'do-not-send-private-fields'],
      noRawPrivateMaterial: true,
      federated: {
        quorumMet: true,
        agreementCount: 2,
        sourceCount: 2,
        winningTargetKey: FEDERATED_CONSENSUS_KEY,
        privacy: {
          rawAddressSentToFederation: false,
          rawAgidSentToFederation: false,
          rawAoidSentToFederation: false,
          rawCoordinatesSentToFederation: false,
          privatePayloadKeptLocal: true,
        },
      },
    },
    requiredAssertions: [
      'federated consensus must accept matching public commitments',
      'raw address material must not be sent to resolver sources',
      'quorum must be met before accepting',
    ],
  },
  {
    caseId: 'resolver-federated-private-material-block-v1',
    kind: 'federated-private-material-block',
    title: 'Federated resolver blocks private material without commitment salt',
    surfaces: ['federated-resolver', 'privacy-boundary'],
    privacyClass: 'negative-synthetic-private-sentinel',
    description: 'A negative synthetic sentinel verifies that public or federated modes reject private address fields when commitment salt is missing.',
    input: {
      federated: {
        mode: 'server-registry',
        domain: 'resolver-conformance:block-private',
        now: '2026-06-20T00:00:00.000Z',
        payload: {
          address: 'synthetic private payload sentinel',
          issuerId: 'issuer-synthetic',
        },
        sources: [
          {
            sourceId: 'registry-unused',
            sourceKind: 'registry-api',
            response: {
              status: 'resolved',
              confidence: 0.8,
              addressReferenceCommitment: 'unused_commitment',
            },
          },
        ],
      },
    },
    expected: {
      resolverVersionsInclude: [FEDERATED_RESOLVER_VERSION],
      status: 'blocked',
      decision: 'reject',
      mode: 'server-registry',
      actionsInclude: ['do-not-send-private-fields', 'request-more-evidence', 'queue-manual-review'],
      noRawPrivateMaterial: true,
      expectedRejectsPrivateMaterial: true,
      federated: {
        quorumMet: false,
        agreementCount: 0,
        sourceCount: 0,
        privacy: {
          rawAddressSentToFederation: false,
          rawAgidSentToFederation: false,
          rawAoidSentToFederation: false,
          rawCoordinatesSentToFederation: false,
          privatePayloadKeptLocal: true,
        },
      },
    },
    requiredAssertions: [
      'private material must block server-registry mode when salt is absent',
      'sources must not be called after blocked separation',
      'privacy flags must remain false for all raw material egress',
    ],
  },
];

function createCase(seed: AgidResolverConformanceSeed): AgidResolverConformanceCase {
  return {
    ...seed,
    license: 'CC0',
    expected: caseExpected(seed.expected),
  };
}

function surfaceCounts(cases: AgidResolverConformanceCase[]) {
  const counts = {
    'agid-local-resolver': 0,
    'standard-library-resolver': 0,
    'federated-resolver': 0,
    'privacy-boundary': 0,
  } satisfies Record<AgidResolverConformanceSurface, number>;

  for (const testCase of cases) {
    for (const surface of testCase.surfaces) counts[surface] += 1;
  }

  return counts;
}

function hasForbiddenPrivateKey(
  value: unknown,
  options: { allowNegativeSentinel: boolean; allowSyntheticCoordinates: boolean },
  path = '$',
): string[] {
  if (value === null || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => hasForbiddenPrivateKey(item, options, `${path}[${index}]`));
  }

  const record = value as Record<string, unknown>;
  const findings: string[] = [];
  for (const [key, nested] of Object.entries(record)) {
    const nextPath = `${path}.${key}`;
    if (FORBIDDEN_PRIVATE_KEYS.includes(key)) {
      const coordinateFixtureKey = ['coordinates', 'lat', 'lon', 'lng'].includes(key);
      if (!options.allowNegativeSentinel && !(options.allowSyntheticCoordinates && coordinateFixtureKey)) {
        findings.push(nextPath);
      }
    }
    findings.push(...hasForbiddenPrivateKey(nested, options, nextPath));
  }
  return findings;
}

function includesAll(actual: readonly string[] | undefined, required: readonly string[] | undefined) {
  if (!required?.length) return true;
  const actualSet = new Set(actual || []);
  return required.every(item => actualSet.has(item));
}

function buildChecklists(): AgidResolverConformanceChecklist[] {
  return [
    {
      checklistId: 'local-resolver-minimum-behavior',
      title: 'Local Resolver Minimum Behavior',
      appliesTo: ['agid-local-resolver'],
      items: [
        'Coordinates can be encoded to AGID without network access.',
        'Public AGID can be decoded locally.',
        'AGID-S requires a matching local key before plaintext access.',
        'Free-form text does not become strong verification by itself.',
        'Resolver actions include do-not-send-private-fields.',
      ],
    },
    {
      checklistId: 'standard-library-local-first',
      title: 'Standard Library Local-First Contract',
      appliesTo: ['standard-library-resolver'],
      items: [
        'Built-in parser and Unicode normalizer run before networked lookups.',
        'Credentialed sources are never required for the default OSS plan.',
        'Postal, geodata, translation, and transliteration capabilities are explicit.',
      ],
    },
    {
      checklistId: 'federated-resolver-privacy-consensus',
      title: 'Federated Resolver Privacy and Consensus',
      appliesTo: ['federated-resolver', 'privacy-boundary'],
      items: [
        'Federated sources receive commitments, roots, and metadata instead of raw private fields.',
        'Quorum is required before an accept decision.',
        'Private fields without commitment salt block public or server-registry modes.',
        'Blocked requests do not call external resolver sources.',
      ],
    },
  ];
}

export function buildAgidResolverConformanceSuite(input: {
  generatedAt?: string;
  cases?: AgidResolverConformanceSeed[];
} = {}): AgidResolverConformanceSuite {
  const generatedAt = input.generatedAt || GENERATED_AT;
  const cases = (input.cases || CASE_SEEDS).map(createCase);
  const negativeCases = cases.filter(testCase => testCase.expected.expectedRejectsPrivateMaterial).length;

  return {
    manifest: {
      suiteId: 'agid-resolver-conformance-tests',
      version: AGID_RESOLVER_CONFORMANCE_VERSION,
      generatedAt,
      license: 'CC0 for synthetic test cases; Apache-2.0 for harness code',
      redistributionPolicy: 'The suite contains synthetic public fixtures and negative sentinels only. It does not bundle real user addresses, AGID-S plaintext, AOID secrets, phone numbers, emails, or third-party datasets.',
      privacyPolicy: 'Resolver conformance fixtures must keep raw private address material local, expose only commitments where appropriate, and reject private material in public/server modes unless a domain-separated commitment path is available.',
      counts: {
        cases: cases.length,
        surfaces: surfaceCounts(cases),
        negativeCases,
      },
      files: [
        {
          path: 'data/agid_resolver_conformance/manifest.json',
          role: 'manifest',
          mediaType: 'application/json',
          containsPersonalData: false,
          containsThirdPartyData: false,
          containsRealRawAddressData: false,
        },
        {
          path: 'data/agid_resolver_conformance/agid-resolver-conformance-suite.json',
          role: 'suite',
          mediaType: 'application/json',
          containsPersonalData: false,
          containsThirdPartyData: false,
          containsRealRawAddressData: false,
        },
        {
          path: 'data/agid_resolver_conformance/test-cases.json',
          role: 'cases',
          mediaType: 'application/json',
          containsPersonalData: false,
          containsThirdPartyData: false,
          containsRealRawAddressData: false,
        },
        {
          path: 'data/agid_resolver_conformance/checklists.json',
          role: 'checklists',
          mediaType: 'application/json',
          containsPersonalData: false,
          containsThirdPartyData: false,
          containsRealRawAddressData: false,
        },
        {
          path: 'data/agid_resolver_conformance/README.md',
          role: 'documentation',
          mediaType: 'text/markdown',
          containsPersonalData: false,
          containsThirdPartyData: false,
          containsRealRawAddressData: false,
        },
      ],
    },
    cases,
    checklists: buildChecklists(),
    conformance: {
      requiredChecks: [
        'local coordinate encoding returns the expected AGID id',
        'local AGID decoding returns the expected AGID id and audit steps',
        'AGID-S token-like inputs require a local key',
        'standard-library resolver uses a free local-first plan',
        'federated resolver accepts only quorum-backed commitment consensus',
        'federated resolver blocks private material without commitment salt',
        'no real raw address material appears in distributable fixtures',
      ],
      forbiddenPrivateKeys: [...FORBIDDEN_PRIVATE_KEYS],
      implementationNotes: [
        'Use the complete JSON suite for automated SDK conformance and the checklists for manual audits.',
        'Negative sentinel cases intentionally contain a private-field key with synthetic text and must be rejected by conforming implementations.',
        'The suite is not a benchmark; latency, cache, and external registry behavior should be measured separately.',
      ],
    },
  };
}

export function filterAgidResolverConformanceSuite(
  suite: AgidResolverConformanceSuite,
  predicate: (testCase: AgidResolverConformanceCase) => boolean,
): AgidResolverConformanceSuite {
  const cases = suite.cases.filter(predicate);
  return {
    ...suite,
    manifest: {
      ...suite.manifest,
      counts: {
        cases: cases.length,
        surfaces: surfaceCounts(cases),
        negativeCases: cases.filter(testCase => testCase.expected.expectedRejectsPrivateMaterial).length,
      },
    },
    cases,
  };
}

export function validateAgidResolverConformanceSuite(
  suite = buildAgidResolverConformanceSuite(),
): AgidResolverConformanceValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const caseIds = new Set<string>();

  if (suite.manifest.version !== AGID_RESOLVER_CONFORMANCE_VERSION) errors.push('version-mismatch');
  if (suite.manifest.counts.cases !== suite.cases.length) errors.push('case-count-mismatch');
  if (!suite.manifest.redistributionPolicy.includes('synthetic')) errors.push('missing-synthetic-redistribution-policy');
  if (!suite.manifest.privacyPolicy.includes('commitment')) errors.push('missing-commitment-privacy-policy');

  for (const file of suite.manifest.files) {
    if (file.containsPersonalData !== false) errors.push(`file-personal-data-not-false:${file.path}`);
    if (file.containsThirdPartyData !== false) errors.push(`file-third-party-data-not-false:${file.path}`);
    if (file.containsRealRawAddressData !== false) errors.push(`file-raw-address-data-not-false:${file.path}`);
  }

  for (const testCase of suite.cases) {
    if (caseIds.has(testCase.caseId)) errors.push(`duplicate-case:${testCase.caseId}`);
    caseIds.add(testCase.caseId);

    if (testCase.license !== 'CC0') errors.push(`case-license-not-cc0:${testCase.caseId}`);
    if (!testCase.surfaces.includes('privacy-boundary')) {
      warnings.push(`case-missing-privacy-boundary-surface:${testCase.caseId}`);
    }

    const allowNegativeSentinel = Boolean(testCase.expected.expectedRejectsPrivateMaterial);
    const allowSyntheticCoordinates = testCase.kind === 'coordinates-to-agid';
    const forbiddenKeyPaths = hasForbiddenPrivateKey(testCase.input, {
      allowNegativeSentinel,
      allowSyntheticCoordinates,
    });
    for (const finding of forbiddenKeyPaths) {
      errors.push(`forbidden-private-key:${testCase.caseId}:${finding}`);
    }

    const expectedWithoutFingerprint = { ...testCase.expected };
    delete (expectedWithoutFingerprint as Partial<AgidResolverConformanceExpected>).expectedFingerprint;
    if (expectedFingerprint(expectedWithoutFingerprint) !== testCase.expected.expectedFingerprint) {
      errors.push(`expected-fingerprint-mismatch:${testCase.caseId}`);
    }

    if (!testCase.expected.noRawPrivateMaterial) {
      errors.push(`no-raw-private-material-not-true:${testCase.caseId}`);
    }
    if (!testCase.requiredAssertions.length) errors.push(`missing-required-assertions:${testCase.caseId}`);
  }

  if (!suite.cases.some(testCase => testCase.expected.expectedRejectsPrivateMaterial)) {
    warnings.push('no-negative-private-material-case');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function assertExpected(result: AgidResolverConformanceCaseResult, expected: AgidResolverConformanceExpected) {
  const errors: string[] = [];
  const observed = result.observed;

  if (!includesAll(observed.resolverVersions, expected.resolverVersionsInclude)) {
    errors.push(`resolver-version-missing:${expected.resolverVersionsInclude.join(',')}`);
  }
  if (expected.status && observed.status !== expected.status) {
    errors.push(`status:${observed.status}!=${expected.status}`);
  }
  if (expected.statusIn?.length && !expected.statusIn.includes(observed.status as never)) {
    errors.push(`status-not-in:${observed.status}`);
  }
  if (expected.decision && observed.decision !== expected.decision) {
    errors.push(`decision:${observed.decision}!=${expected.decision}`);
  }
  if (expected.inputKind && observed.inputKind !== expected.inputKind) {
    errors.push(`input-kind:${observed.inputKind}!=${expected.inputKind}`);
  }
  if (expected.agidId && observed.agidId !== expected.agidId) {
    errors.push(`agid-id:${observed.agidId}!=${expected.agidId}`);
  }
  if (expected.mode && observed.mode !== expected.mode) {
    errors.push(`mode:${observed.mode}!=${expected.mode}`);
  }
  if (!includesAll(observed.actions, expected.actionsInclude)) {
    errors.push(`actions-missing:${(expected.actionsInclude || []).join(',')}`);
  }
  if (!includesAll(observed.auditSteps, expected.auditStepsInclude)) {
    errors.push(`audit-steps-missing:${(expected.auditStepsInclude || []).join(',')}`);
  }

  if (expected.standardLibrary) {
    if (!observed.standardLibrary) {
      errors.push('standard-library-observed-missing');
    } else {
      if (expected.standardLibrary.freeOnly !== undefined && observed.standardLibrary.freeOnly !== expected.standardLibrary.freeOnly) {
        errors.push(`standard-library-free-only:${observed.standardLibrary.freeOnly}!=${expected.standardLibrary.freeOnly}`);
      }
      if (expected.standardLibrary.canParseLocally !== undefined && observed.standardLibrary.canParseLocally !== expected.standardLibrary.canParseLocally) {
        errors.push(`standard-library-can-parse-locally:${observed.standardLibrary.canParseLocally}!=${expected.standardLibrary.canParseLocally}`);
      }
      if (!includesAll(observed.standardLibrary.primaryIds, expected.standardLibrary.primaryIdsInclude)) {
        errors.push(`standard-library-primary-missing:${(expected.standardLibrary.primaryIdsInclude || []).join(',')}`);
      }
      if (!includesAll(observed.standardLibrary.requestedCapabilities, expected.standardLibrary.requestedCapabilitiesInclude)) {
        errors.push(`standard-library-capability-missing:${(expected.standardLibrary.requestedCapabilitiesInclude || []).join(',')}`);
      }
    }
  }

  if (expected.federated) {
    if (!observed.federated) {
      errors.push('federated-observed-missing');
    } else {
      if (expected.federated.quorumMet !== undefined && observed.federated.quorumMet !== expected.federated.quorumMet) {
        errors.push(`federated-quorum:${observed.federated.quorumMet}!=${expected.federated.quorumMet}`);
      }
      if (expected.federated.agreementCount !== undefined && observed.federated.agreementCount !== expected.federated.agreementCount) {
        errors.push(`federated-agreement:${observed.federated.agreementCount}!=${expected.federated.agreementCount}`);
      }
      if (expected.federated.sourceCount !== undefined && observed.federated.sourceCount !== expected.federated.sourceCount) {
        errors.push(`federated-source-count:${observed.federated.sourceCount}!=${expected.federated.sourceCount}`);
      }
      if (expected.federated.winningTargetKey && observed.federated.winningTargetKey !== expected.federated.winningTargetKey) {
        errors.push(`federated-winning-key:${observed.federated.winningTargetKey}!=${expected.federated.winningTargetKey}`);
      }
      if (stableJson(observed.federated.privacy) !== stableJson(expected.federated.privacy)) {
        errors.push('federated-privacy-mismatch');
      }
    }
  }

  return errors;
}

export async function runAgidResolverConformanceCase(
  testCase: AgidResolverConformanceCase,
): Promise<AgidResolverConformanceCaseResult> {
  const observed: AgidResolverConformanceCaseResult['observed'] = {
    resolverVersions: [],
  };

  if (testCase.input.local) {
    const localInput = testCase.input.local.addressFormat === undefined
      && testCase.input.local.addressFormatResolver === undefined
      ? { ...testCase.input.local, addressFormat: null }
      : testCase.input.local;
    const local = await resolveAgidLocal(localInput);
    observed.resolverVersions.push(local.resolverVersion);
    observed.status = local.status;
    observed.inputKind = local.inputKind;
    observed.agidId = local.agidId;
    observed.mode = local.mode;
    observed.actions = local.actions;
    observed.auditSteps = local.audit.map(item => item.step);
  }

  if (testCase.input.standardLibrary) {
    const plan = buildAddressStandardLibraryResolution(testCase.input.standardLibrary);
    observed.resolverVersions.push(plan.modelVersion);
    observed.standardLibrary = {
      freeOnly: plan.freeOnly,
      canParseLocally: plan.canParseLocally,
      primaryIds: plan.primary.map(entry => entry.id),
      requestedCapabilities: plan.requestedCapabilities,
    };
  }

  if (testCase.input.federated) {
    const fixture = testCase.input.federated;
    const result = await resolveFederatedAddress({
      mode: fixture.mode,
      domain: fixture.domain,
      salt: fixture.salt,
      now: fixture.now,
      highRiskMode: fixture.highRiskMode,
      allowPublicAgid: fixture.allowPublicAgid,
      quorum: fixture.quorum,
      minTrustScore: fixture.minTrustScore,
      minResolvedConfidence: fixture.minResolvedConfidence,
      payload: fixture.payload,
      sources: fixture.sources.map(source => createStaticFederatedResolverSource(source)),
    });
    observed.resolverVersions.push(result.version);
    observed.status = result.status;
    observed.decision = result.decision;
    observed.mode = result.mode;
    observed.actions = result.actions;
    observed.federated = {
      quorumMet: result.consensus.quorumMet,
      agreementCount: result.consensus.agreementCount,
      sourceCount: result.sourceResults.length,
      winningTargetKey: result.consensus.winningTargetKey,
      privacy: {
        rawAddressSentToFederation: result.privacy.rawAddressSentToFederation,
        rawAgidSentToFederation: result.privacy.rawAgidSentToFederation,
        rawAoidSentToFederation: result.privacy.rawAoidSentToFederation,
        rawCoordinatesSentToFederation: result.privacy.rawCoordinatesSentToFederation,
        privatePayloadKeptLocal: result.privacy.privatePayloadKeptLocal,
      },
    };
  }

  const errors = assertExpected({ caseId: testCase.caseId, kind: testCase.kind, passed: false, errors: [], observed }, testCase.expected);
  return {
    caseId: testCase.caseId,
    kind: testCase.kind,
    passed: errors.length === 0,
    errors,
    observed,
  };
}

export async function runAgidResolverConformanceSuite(
  suite = buildAgidResolverConformanceSuite(),
): Promise<AgidResolverConformanceSuiteRun> {
  const results: AgidResolverConformanceCaseResult[] = [];
  for (const testCase of suite.cases) {
    results.push(await runAgidResolverConformanceCase(testCase));
  }

  return {
    version: AGID_RESOLVER_CONFORMANCE_VERSION,
    passed: results.every(result => result.passed),
    results,
  };
}

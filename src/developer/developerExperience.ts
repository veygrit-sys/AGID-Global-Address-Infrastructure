import {
  getAppSurfaceCopy,
  getAppSurfaces,
  type AppSurfaceDefinition,
  type AppSurfaceGroup,
  type AppSurfaceStatus,
} from '../lib/appNavigation';
import {
  getAddressSharedPrimitives,
  getAddressSurfaceCompatibilityDefinitions,
} from '../lib/addressSurfaceCompatibility';
import type { DeveloperConsole } from '../lib/developerConsole';

export type DeveloperExperienceStatus = 'ready' | 'partial' | 'preview';

export type DeveloperFeatureGroup =
  | 'core-app'
  | 'operations'
  | 'admin'
  | 'developer'
  | 'labs'
  | 'api-sdk';

export type DeveloperFeatureCoverageRow = {
  id: string;
  label: string;
  group: DeveloperFeatureGroup;
  summary: string;
  status: DeveloperExperienceStatus;
  api: boolean;
  sdk: boolean;
  docs: boolean;
  tutorial: boolean;
  tests: boolean;
  noRawGate: boolean;
  routeRef: string;
  source: 'app-surface' | 'api-sdk' | 'workflow';
};

export type DeveloperTutorialStep = {
  id: string;
  step: number;
  title: string;
  goal: string;
  command: string;
  request: string;
  expectedResponse: string;
  safeNote: string;
  failureRecovery: string;
  featureIds: string[];
  docsRef: string;
  status: DeveloperExperienceStatus;
};

export type DeveloperScenarioRecipe = {
  id: string;
  label: string;
  audience: string;
  flow: string;
  surfaces: string[];
  command: string;
  safeOutput: string;
  status: DeveloperExperienceStatus;
};

export type DeveloperPrReadinessSlice = {
  id: string;
  label: string;
  scope: string;
  files: string[];
  gates: string[];
  risk: 'low' | 'medium' | 'high';
  status: DeveloperExperienceStatus;
  noRawGate: boolean;
};

export type DeveloperExperienceModel = {
  coverageRows: DeveloperFeatureCoverageRow[];
  tutorialSteps: DeveloperTutorialStep[];
  scenarioRecipes: DeveloperScenarioRecipe[];
  prReadinessSlices: DeveloperPrReadinessSlice[];
  summary: {
    appSurfaces: number;
    workflowSurfaces: number;
    sharedPrimitives: number;
    apiSdkSurfaces: number;
    tutorialSteps: number;
    scenarioRecipes: number;
    coverageRows: number;
    noRawReady: number;
    prReadinessSlices: number;
  };
};

const API_SURFACE_IDS = new Set([
  'developer-console',
  'agid-address-element',
  'address-dashboard',
  'address-review-console',
  'machine-comms',
  'oracle-opera-hotel-address',
  'pos-terminal',
  'field-handoff',
  'address-portal',
  'evidence-vault',
  'postal-zone-designer',
  'open-locker-pudo-simulator',
  'drone-locker-ops',
]);

const SDK_SURFACE_IDS = new Set([
  'developer-console',
  'agid-address-element',
  'machine-comms',
  'pos-terminal',
  'field-handoff',
  'map-workspace',
  'address-registration',
  'address-portal',
  'postal-zone-designer',
  'drone-locker-ops',
]);

const TEST_SURFACE_IDS = new Set([
  'open-source-home',
  'map-workspace',
  'address-registration',
  'address-portal',
  'pos-terminal',
  'hotel-checkin',
  'oracle-opera-hotel-address',
  'field-handoff',
  'machine-comms',
  'settings-policy',
  'address-dashboard',
  'address-review-console',
  'developer-console',
  'agid-address-element',
  'evidence-vault',
  'research-design-hub',
  'postal-zone-designer',
  'open-locker-pudo-simulator',
  'drone-locker-ops',
]);

function mapSurfaceGroup(group: AppSurfaceGroup): DeveloperFeatureGroup {
  if (group === 'core') return 'core-app';
  if (group === 'operations') return 'operations';
  if (group === 'admin') return 'admin';
  if (group === 'developer') return 'developer';
  return 'labs';
}

function mapSurfaceStatus(status: AppSurfaceStatus): DeveloperExperienceStatus {
  if (status === 'ready') return 'ready';
  if (status === 'partial') return 'partial';
  return 'preview';
}

function appSurfaceToCoverageRow(surface: AppSurfaceDefinition): DeveloperFeatureCoverageRow {
  const copy = getAppSurfaceCopy(surface, 'en');
  const routeRef = surface.route ?? surface.action;
  return {
    id: surface.id,
    label: copy.label,
    group: mapSurfaceGroup(surface.group),
    summary: copy.description,
    status: mapSurfaceStatus(surface.status),
    api: API_SURFACE_IDS.has(surface.id),
    sdk: SDK_SURFACE_IDS.has(surface.id),
    docs: true,
    tutorial: surface.status !== 'planned',
    tests: TEST_SURFACE_IDS.has(surface.id),
    noRawGate: surface.privacyBoundary !== 'planned',
    routeRef,
    source: 'app-surface',
  };
}

function apiSdkCoverageRows(consoleModel: DeveloperConsole): DeveloperFeatureCoverageRow[] {
  const sdkTargets = consoleModel.sdkSnippets.length;
  const paths = consoleModel.openApi.pathCount;
  const rows: Array<Omit<DeveloperFeatureCoverageRow, 'group'>> = [
    {
      id: 'api-resolver',
      label: 'Resolver API',
      summary: 'Resolve AGID, AOID, alias, or commitment refs into redacted delivery metadata.',
      status: 'ready',
      api: true,
      sdk: true,
      docs: true,
      tutorial: true,
      tests: true,
      noRawGate: true,
      routeRef: '/api/resolve',
      source: 'api-sdk',
    },
    {
      id: 'api-secure-qr',
      label: 'Secure Address QR',
      summary: 'Create private QR/NFC envelopes with alias, scope, expiry, receipt, and commitment refs.',
      status: 'ready',
      api: true,
      sdk: true,
      docs: true,
      tutorial: true,
      tests: true,
      noRawGate: true,
      routeRef: '/api/qr/create',
      source: 'api-sdk',
    },
    {
      id: 'api-webhooks',
      label: 'Webhooks',
      summary: 'Subscribe to verified intent, handoff, receipt, review, and revocation events.',
      status: 'ready',
      api: true,
      sdk: true,
      docs: true,
      tutorial: true,
      tests: true,
      noRawGate: true,
      routeRef: `${consoleModel.totals.webhookEndpoints} endpoint refs`,
      source: 'api-sdk',
    },
    {
      id: 'api-country-packs',
      label: 'Country Packs',
      summary: 'Load country-specific address formats, postal strength class, and open-data source refs.',
      status: 'partial',
      api: true,
      sdk: true,
      docs: true,
      tutorial: true,
      tests: true,
      noRawGate: true,
      routeRef: '/country-packs/{country}',
      source: 'api-sdk',
    },
    {
      id: 'api-db-registry',
      label: 'DB / Registry',
      summary: 'Connect ledger, registry, audit log, revocation roots, and receipt indexes.',
      status: 'partial',
      api: true,
      sdk: true,
      docs: true,
      tutorial: false,
      tests: true,
      noRawGate: true,
      routeRef: '/registry',
      source: 'api-sdk',
    },
    {
      id: 'api-zk-web3',
      label: 'ZK / Web3',
      summary: 'Verify private address predicates and optional Ethereum-compatible proofs.',
      status: 'preview',
      api: true,
      sdk: true,
      docs: true,
      tutorial: true,
      tests: true,
      noRawGate: true,
      routeRef: '/zk/verify',
      source: 'api-sdk',
    },
    {
      id: 'api-cli',
      label: 'CLI',
      summary: 'Run local resolver, privacy gates, batch checks, and conformance suites.',
      status: 'ready',
      api: false,
      sdk: true,
      docs: true,
      tutorial: true,
      tests: true,
      noRawGate: true,
      routeRef: `${consoleModel.totals.cliCommands} commands`,
      source: 'api-sdk',
    },
    {
      id: 'api-conformance',
      label: 'Conformance',
      summary: 'Parity vectors for AGID resolver, no-raw-address kit, webhooks, QR, SDKs, and CLI.',
      status: 'ready',
      api: false,
      sdk: true,
      docs: true,
      tutorial: true,
      tests: true,
      noRawGate: true,
      routeRef: `${consoleModel.totals.conformanceSuites} suites`,
      source: 'api-sdk',
    },
    {
      id: 'api-openapi',
      label: 'OpenAPI',
      summary: `Versioned API contract with ${paths} paths and redacted examples.`,
      status: 'ready',
      api: true,
      sdk: false,
      docs: true,
      tutorial: true,
      tests: true,
      noRawGate: true,
      routeRef: consoleModel.openApi.version,
      source: 'api-sdk',
    },
    {
      id: 'api-sdk-parity',
      label: 'SDK Parity',
      summary: `${sdkTargets} SDK/spec targets generated from agid-spec and parity vectors.`,
      status: sdkTargets >= 20 ? 'ready' : 'partial',
      api: false,
      sdk: true,
      docs: true,
      tutorial: true,
      tests: true,
      noRawGate: true,
      routeRef: `${sdkTargets} targets`,
      source: 'api-sdk',
    },
    {
      id: 'api-postal-forge',
      label: 'Postal Forge',
      summary: 'Design postal zones from maps, population, roads, admin boundaries, and AGID fallback.',
      status: 'partial',
      api: true,
      sdk: true,
      docs: true,
      tutorial: true,
      tests: true,
      noRawGate: true,
      routeRef: '/postal-zones',
      source: 'api-sdk',
    },
    {
      id: 'api-geo-data',
      label: 'Geo Data Packs',
      summary: 'Lazy-load region and country packs for postal, building, sea, mountain, and natural features.',
      status: 'partial',
      api: true,
      sdk: true,
      docs: true,
      tutorial: true,
      tests: true,
      noRawGate: true,
      routeRef: '/geo/examples',
      source: 'api-sdk',
    },
  ];
  return rows.map(row => ({ group: 'api-sdk', ...row }));
}

function safeResponse(value: Record<string, unknown>) {
  return JSON.stringify({
    ok: true,
    rawAddressReturned: false,
    ...value,
  }, null, 2);
}

function defaultTutorialSteps(consoleModel: DeveloperConsole): DeveloperTutorialStep[] {
  const resolverCommand = consoleModel.cliCommands.find(command => command.purpose === 'quickstart')?.command
    ?? 'npm run agid -- encode --lat 0 --lon 0 --json';
  const conformanceCommand = consoleModel.conformanceResults.find(result => result.suiteId === 'agid-resolver-conformance')?.command
    ?? 'npm run verify:agid-resolver-conformance';
  const firstWebhook = consoleModel.webhooks[0]?.endpointId ?? 'DWEB-LOCAL-01';

  return [
    {
      id: 'tutorial-local-sandbox',
      step: 1,
      title: 'Local sandbox',
      goal: 'Boot the local shell and verify that no production connector is used.',
      command: 'npm run dev',
      request: 'GET /health/local-sandbox',
      expectedResponse: safeResponse({
        status: 'local-only',
        scope: 'developer-sandbox',
        commitment: 'cm_demo_local_001',
        alias: 'alias_demo_local',
        receipt: 'rcpt_demo_local_boot',
      }),
      safeNote: 'No production traffic, no plaintext connector, no private key material.',
      failureRecovery: 'If the shell does not start, check local env only, rerun npm install, and keep production connectors disabled.',
      featureIds: ['developer-console', 'api-openapi'],
      docsRef: 'docs/agid-standard.md',
      status: 'ready',
    },
    {
      id: 'tutorial-resolve-agid',
      step: 2,
      title: 'Resolve AGID',
      goal: 'Resolve a demo identifier into redacted route and quality metadata.',
      command: resolverCommand,
      request: 'POST /api/resolve { "id": "alias_demo_local", "scope": "delivery-preview" }',
      expectedResponse: safeResponse({
        status: 'resolved',
        scope: 'delivery-preview',
        alias: 'alias_demo_local',
        commitment: 'cm_demo_resolver_002',
        receipt: 'rcpt_demo_resolver',
        quality: 'Partial',
      }),
      safeNote: 'Response returns identifiers and status only; formatted address body remains redacted.',
      failureRecovery: 'If resolution fails, verify the demo alias, rerun resolver conformance, and keep unresolved as the safe output.',
      featureIds: ['api-resolver', 'map-workspace'],
      docsRef: 'docs/agid-resolver-conformance-tests.md',
      status: 'ready',
    },
    {
      id: 'tutorial-secure-address-qr',
      step: 3,
      title: 'Create Secure Address QR',
      goal: 'Create a QR envelope with alias, scope, expiry, and commitment refs.',
      command: 'npm run verify:secure-address-qr',
      request: 'POST /api/qr/create { "alias": "alias_demo_local", "scope": "handoff:single-use" }',
      expectedResponse: safeResponse({
        status: 'qr-created',
        scope: 'handoff:single-use',
        alias: 'alias_demo_local',
        commitment: 'cm_demo_qr_003',
        receipt: 'rcpt_demo_qr',
        expiresInSeconds: 900,
      }),
      safeNote: 'QR payload stores no raw recipient data and is single-use by default.',
      failureRecovery: 'If QR creation fails, rotate the demo receipt, keep the payload redacted, and rerun the secure QR gate.',
      featureIds: ['api-secure-qr', 'pos-terminal'],
      docsRef: 'docs/agid-s-secure-agid-qr-en.md',
      status: 'ready',
    },
    {
      id: 'tutorial-machine-pos-handoff',
      step: 4,
      title: 'Verify Machine/POS handoff',
      goal: 'Validate a machine-readable handoff envelope before a terminal accepts it.',
      command: 'npm run verify:pos-ui',
      request: 'POST /api/machine/verify { "receipt": "rcpt_demo_qr", "terminal": "terminal_ref_demo" }',
      expectedResponse: safeResponse({
        status: 'handoff-accepted',
        alias: 'alias_demo_local',
        receipt: 'rcpt_demo_pos_handoff',
        decision: 'accept',
        scope: 'terminal-handoff',
      }),
      safeNote: 'Terminal view shows decision, alias, and receipt; it does not reveal private address text.',
      failureRecovery: 'If handoff verification fails, hold for review, preserve the redacted receipt, and rerun POS UI checks.',
      featureIds: ['machine-comms', 'pos-terminal'],
      docsRef: 'docs/machine-to-machine-agid-aoid-communication-ja.md',
      status: 'ready',
    },
    {
      id: 'tutorial-webhook',
      step: 5,
      title: 'Add webhook',
      goal: 'Subscribe to redacted lifecycle events and verify signature/replay controls.',
      command: 'npm run verify:developer-console',
      request: `POST /api/webhooks/${firstWebhook}/test { "topic": "handoff.completed" }`,
      expectedResponse: safeResponse({
        status: 'queued',
        eventRef: 'evt_demo_handoff_completed',
        payloadFingerprint: 'payload_demo_fingerprint',
        receipt: 'rcpt_demo_webhook',
      }),
      safeNote: 'Webhook events carry event refs and fingerprints instead of address bodies.',
      failureRecovery: 'If delivery fails, inspect signature and replay status, then send a redacted test event to the dead-letter path.',
      featureIds: ['api-webhooks', 'developer-console'],
      docsRef: 'docs/address-connect-terminal.md',
      status: 'ready',
    },
    {
      id: 'tutorial-conformance',
      step: 6,
      title: 'Run conformance',
      goal: 'Run parity vectors across resolver, SDK, QR, webhook, and privacy gates.',
      command: conformanceCommand,
      request: 'CLI conformance run',
      expectedResponse: safeResponse({
        status: 'passed',
        suite: 'agid-resolver-conformance',
        receipt: 'rcpt_demo_conformance',
        commitment: 'cm_demo_vectors_root',
        failed: 0,
      }),
      safeNote: 'Fixtures use commitments and stable hashes only.',
      failureRecovery: 'If conformance fails, keep the failing vector redacted, fix parity first, and do not update SDK samples by hand.',
      featureIds: ['api-conformance', 'api-sdk-parity'],
      docsRef: 'docs/agid-resolver-conformance-tests.md',
      status: 'ready',
    },
    {
      id: 'tutorial-deploy-safely',
      step: 7,
      title: 'Deploy safely',
      goal: 'Clear launch readiness gates before enabling production connectors.',
      command: 'npm run verify:no-raw-address-kit && npm run build',
      request: 'Release gate review',
      expectedResponse: safeResponse({
        status: 'blocked-or-ready-by-gate',
        launchRoot: consoleModel.developerRoot,
        nextAction: 'clear_required_release_gates',
        receipt: 'rcpt_demo_release_review',
      }),
      safeNote: 'Production stays locked until no-raw, secrets, audit, retry, and conformance gates pass.',
      failureRecovery: 'If a release gate fails, keep production locked, fix the first required gate, and append redacted evidence only.',
      featureIds: ['api-openapi', 'api-db-registry', 'developer-console'],
      docsRef: 'docs/mandatory-security-release-gates-ja.md',
      status: 'partial',
    },
  ];
}

function defaultScenarioRecipes(): DeveloperScenarioRecipe[] {
  return [
    {
      id: 'recipe-ecommerce-checkout',
      label: 'E-commerce checkout',
      audience: 'Storefront, marketplace, and payment teams',
      flow: 'Address Element -> Secure QR -> delivery alias -> receipt.',
      surfaces: ['address-registration', 'agid-address-element', 'api-secure-qr'],
      command: 'npm run verify:address-element',
      safeOutput: 'alias + commitment + quality status + receipt',
      status: 'ready',
    },
    {
      id: 'recipe-hotel-opera',
      label: 'Hotel check-in / OPERA',
      audience: 'Hotel front desk and PMS integrators',
      flow: 'Hotel QR -> guest QR check -> OHIP mapper preview -> audit receipt.',
      surfaces: ['hotel-checkin', 'oracle-opera-hotel-address'],
      command: 'npm run verify:hotel-opera',
      safeOutput: 'profile/ref code + PMS mapper status + audit receipt',
      status: 'partial',
    },
    {
      id: 'recipe-pos-handoff',
      label: 'POS handoff',
      audience: 'Retail counter and parcel acceptance teams',
      flow: 'Scan -> decision -> handoff -> receipt.',
      surfaces: ['pos-terminal', 'machine-comms'],
      command: 'npm run verify:pos-ui',
      safeOutput: 'accept/review/reject + alias + signed receipt',
      status: 'ready',
    },
    {
      id: 'recipe-field-delivery',
      label: 'Field delivery',
      audience: 'Drivers, couriers, and field operators',
      flow: 'Arrived -> delivered/not-home/cannot-reach -> offline receipt -> later sync.',
      surfaces: ['field-handoff', 'address-dashboard'],
      command: 'npm run verify:field-handoff',
      safeOutput: 'field decision + reachability reason + sync receipt',
      status: 'ready',
    },
    {
      id: 'recipe-locker-pudo',
      label: 'Locker / PUDO',
      audience: 'Pickup points, lockers, and staffed counters',
      flow: 'QR/NFC -> locker selection -> unlock decision -> receipt.',
      surfaces: ['open-locker-pudo-simulator', 'pos-terminal'],
      command: 'npm run verify:open-locker-pudo',
      safeOutput: 'locker status + alias + pickup conditions + receipt',
      status: 'partial',
    },
    {
      id: 'recipe-drone-reachability',
      label: 'Drone reachability',
      audience: 'Drone logistics and safety review teams',
      flow: 'Constraint review -> safe handoff / hold / cannot reach.',
      surfaces: ['drone-locker-ops', 'field-handoff'],
      command: 'npm run verify:drone-locker',
      safeOutput: 'constraint decision + coarse reachability receipt',
      status: 'preview',
    },
    {
      id: 'recipe-postal-zone-designer',
      label: 'Postal Zone Designer',
      audience: 'Postal data, government, and carrier planning teams',
      flow: 'Map-based zone draft -> split/merge -> quality gate -> country pack export.',
      surfaces: ['postal-zone-designer', 'api-postal-forge'],
      command: 'npm run verify:postal-zone-designer',
      safeOutput: 'zone ids + quality summary + source refs',
      status: 'partial',
    },
    {
      id: 'recipe-country-geo-data',
      label: 'Country Pack / Geo data integration',
      audience: 'Open-data maintainers and regional integrators',
      flow: 'Source refs -> country pack -> lazy load -> compatibility matrix.',
      surfaces: ['api-country-packs', 'api-geo-data'],
      command: 'npm run verify:external-oss-geo-postal',
      safeOutput: 'source refs + license refs + coverage state',
      status: 'partial',
    },
    {
      id: 'recipe-zk-web3-proof',
      label: 'ZK/Web3 private proof',
      audience: 'Protocol, wallet, and grant reviewers',
      flow: 'Private predicate -> proof bundle -> verifier -> optional registry anchor.',
      surfaces: ['api-zk-web3', 'evidence-vault'],
      command: 'npm run verify:web3-zk-stack',
      safeOutput: 'proof receipt + verifier status + nullifier ref',
      status: 'preview',
    },
  ];
}

function defaultPrReadinessSlices(): DeveloperPrReadinessSlice[] {
  return [
    {
      id: 'developer-console-app-shell',
      label: 'Developer Console / App Shell',
      scope: 'Route policy, scroll shell, developer command center, safe samples, and app navigation compatibility.',
      files: [
        'src/components/DeveloperConsoleScreen.tsx',
        'src/RootApp.tsx',
        'src/lib/appNavigation.ts',
        'src/design/agidDesignRules.ts',
      ],
      gates: [
        'npm run verify:developer-console',
        'npm run verify:app-shell',
        'npm run verify:no-raw-address',
        'npm run lint',
        'npm run build',
      ],
      risk: 'low',
      status: 'ready',
      noRawGate: true,
    },
  ];
}

export function buildDeveloperExperience(consoleModel: DeveloperConsole): DeveloperExperienceModel {
  const appRows = getAppSurfaces().map(appSurfaceToCoverageRow);
  const workflowSurfaces = getAddressSurfaceCompatibilityDefinitions();
  const workflowRows: DeveloperFeatureCoverageRow[] = workflowSurfaces.map(surface => ({
    id: `workflow-${surface.id}`,
    label: `${surface.label} workflow`,
    group: 'api-sdk',
    summary: surface.primaryWorkflow,
    status: surface.maturity === 'ready' ? 'ready' : surface.maturity === 'partial' ? 'partial' : 'preview',
    api: surface.capabilities.includes('webhook-and-openapi') || surface.capabilities.includes('sdk-test-vectors'),
    sdk: surface.capabilities.includes('sdk-test-vectors') || surface.id === 'developer-console',
    docs: true,
    tutorial: surface.priority !== 'P2',
    tests: surface.testsToKeep.length > 0,
    noRawGate: surface.privacyRules.length > 0,
    routeRef: surface.testsToKeep[0] ?? surface.nextRefactor,
    source: 'workflow',
  }));
  const apiRows = apiSdkCoverageRows(consoleModel);
  const coverageRows = [...appRows, ...apiRows, ...workflowRows];
  const tutorialSteps = defaultTutorialSteps(consoleModel);
  const scenarioRecipes = defaultScenarioRecipes();
  const prReadinessSlices = defaultPrReadinessSlices();

  return {
    coverageRows,
    tutorialSteps,
    scenarioRecipes,
    prReadinessSlices,
    summary: {
      appSurfaces: appRows.length,
      workflowSurfaces: workflowSurfaces.length,
      sharedPrimitives: getAddressSharedPrimitives().length,
      apiSdkSurfaces: apiRows.length,
      tutorialSteps: tutorialSteps.length,
      scenarioRecipes: scenarioRecipes.length,
      coverageRows: coverageRows.length,
      noRawReady: coverageRows.filter(row => row.noRawGate).length,
      prReadinessSlices: prReadinessSlices.length,
    },
  };
}

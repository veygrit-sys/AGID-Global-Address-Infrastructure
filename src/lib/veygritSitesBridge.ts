export const VEYGRIT_SITES_BRIDGE_VERSION = 'veygrit-sites-bridge-v0.1';

export type VeygritSitesBridge = {
  version: typeof VEYGRIT_SITES_BRIDGE_VERSION;
  purpose: string;
  codexThread: {
    id: string;
    uri: string;
    localRoot: string;
  };
  sitesProject: {
    projectId: string;
    title: string;
    slug: string;
    currentLiveUrl: string;
    accessMode: 'custom';
    latestObservedVersion: number;
  };
  githubConnection: {
    authenticatedLogin: string;
    installedAccounts: string[];
    siteRepositoryCandidate: string;
    remoteMutationAllowedThisTurn: false;
  };
  ownership: {
    agidOwns: string[];
    sitesAppOwns: string[];
  };
  sourceMappings: Array<{
    agidSource: string;
    siteTarget: string;
    syncPurpose: string;
  }>;
  targetSiteSurfaces: Array<{
    id: string;
    currentStatus: 'present' | 'planned';
    agidSource: string;
    nextLocalAction: string;
  }>;
  safetyBoundaries: {
    productionDeployRequiresExplicitApproval: true;
    createRemoteRepositoryRequiresExplicitApproval: true;
    pushRequiresExplicitApproval: true;
    createSiteAllowed: false;
    persistSitesBypassToken: false;
    persistSourceRepositoryCredential: false;
    rawAddressMaterialAllowedInBridge: false;
  };
  blockedMaterial: string[];
  syncPlan: Array<{
    id: string;
    label: string;
    requiredBefore: string[];
    verifier: string;
  }>;
  validationGates: string[];
  warnings: string[];
  nonClaims: string[];
};

export type VeygritSitesBridgeValidation = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

const THREAD_ID = '019f6ff7-fa0f-7610-b709-8f1b6bb42f0b';
const SITE_LOCAL_ROOT = 'C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit';
const SITE_APP_ROOT = `${SITE_LOCAL_ROOT}/work/veygrit-app`;
const SITES_PROJECT_ID = 'appgprj_6a5a1e0e8f188191917daebf20db70f0';
const CURRENT_LIVE_URL = 'https://veygrit-address-wallet.cool-globe-6298.chatgpt.site';

export function buildVeygritSitesBridge(): VeygritSitesBridge {
  return {
    version: VEYGRIT_SITES_BRIDGE_VERSION,
    purpose:
      'Connect the AGID/Veygrit executable specs to the existing Veygrit Address Wallet Sites app without moving raw address material, credentials, or production deployment authority.',
    codexThread: {
      id: THREAD_ID,
      uri: `codex://threads/${THREAD_ID}`,
      localRoot: SITE_LOCAL_ROOT,
    },
    sitesProject: {
      projectId: SITES_PROJECT_ID,
      title: 'Veygrit Address Wallet',
      slug: 'veygrit-address-wallet',
      currentLiveUrl: CURRENT_LIVE_URL,
      accessMode: 'custom',
      latestObservedVersion: 15,
    },
    githubConnection: {
      authenticatedLogin: 'rei-k',
      installedAccounts: ['rei-k'],
      siteRepositoryCandidate: 'rei-k/Veygrit-US',
      remoteMutationAllowedThisTurn: false,
    },
    ownership: {
      agidOwns: [
        'Vey ID and Address Wallet contracts',
        'no-raw-address and non-claim gates',
        'OpenAPI fixtures and SDK-ready test vectors',
        'product boundary between Playlist Commerce and EC Social Login',
      ],
      sitesAppOwns: [
        'Veygrit Address Wallet user interface',
        'Home/Friends/Store/My Page navigation',
        'Settings interaction model',
        'local Vite build output for Sites',
      ],
    },
    sourceMappings: [
      {
        agidSource: 'src/lib/veyIdAddressWalletFoundation.ts',
        siteTarget: `${SITE_APP_ROOT}/src/main.jsx`,
        syncPurpose: 'Keep the Address Wallet OS menu, Home sections, Store sections, and account-provider policy aligned.',
      },
      {
        agidSource: 'src/lib/veyIdDemoEcFlow.ts',
        siteTarget: `${SITE_APP_ROOT}/src/main.jsx`,
        syncPurpose: 'Add a Demo EC checkout panel that shows guest checkout, Continue with Veygrit, Wallet consent, and carrier handoff refs.',
      },
      {
        agidSource: 'docs/product/vey-id-demo-ec-flow.md',
        siteTarget: `${SITE_APP_ROOT}/src/main.jsx`,
        syncPurpose: 'Use the same product wording for Playlist Commerce vs EC Social Login.',
      },
      {
        agidSource: 'docs/specs/veygrit-id-core.openapi.yaml',
        siteTarget: `${SITE_APP_ROOT}/src/main.jsx`,
        syncPurpose: 'Expose only API concepts and public refs; do not embed server credentials or token values.',
      },
      {
        agidSource: 'src/lib/veygritSitesRefFixtures.ts',
        siteTarget: `${SITE_APP_ROOT}/src/veygritRefFixtures.js`,
        syncPurpose: 'Generate ref-only fixture constants for the Sites app without carrying raw address/contact material.',
      },
      {
        agidSource: 'src/lib/veygritSitesTransitionButtons.ts',
        siteTarget: `${SITE_APP_ROOT}/src/veygritTransitionButtons.js`,
        syncPurpose: 'Generate Sites commerce entry buttons from the AGID transition map and Veygrit product boundaries.',
      },
      {
        agidSource: 'src/lib/veygritSitesAppShell.ts',
        siteTarget: `${SITE_APP_ROOT}/src/main.jsx`,
        syncPurpose: 'Check that the Sites app shell exposes AGID Home, Store, and navigation sections.',
      },
      {
        agidSource: 'src/lib/veygritSitesStoreCatalog.ts',
        siteTarget: `${SITE_APP_ROOT}/src/veygritStoreCatalog.js`,
        syncPurpose: 'Generate Store Topics, all 32 Discover genres, and My Stores display rows with address-reuse, visible-ref, hidden-label, revoke, revoked-state, reconnect, ref-key local storage, and unknown-ref repair boundaries from the AGID app model.',
      },
    ],
    targetSiteSurfaces: [
      {
        id: 'address-wallet-home',
        currentStatus: 'present',
        agidSource: 'src/lib/veyIdAddressWalletFoundation.ts',
        nextLocalAction: 'Bind displayed Home sections to the AGID foundation constants.',
      },
      {
        id: 'store-discovery',
        currentStatus: 'present',
        agidSource: 'docs/product/playlist-commerce-platform.md',
        nextLocalAction: 'Keep Store as Topics, Discover, and My Stores rather than a generic marketplace.',
      },
      {
        id: 'vey-id-demo-ec-checkout',
        currentStatus: 'planned',
        agidSource: 'src/lib/veyIdDemoEcFlow.ts',
        nextLocalAction: 'Render the executable demo flow as a local UI panel with refs only.',
      },
      {
        id: 'merchant-connection-safety',
        currentStatus: 'planned',
        agidSource: 'docs/product/veygrit-id-address-login-plan.md',
        nextLocalAction: 'Add a Connected Store detail view with revoke and permission boundaries.',
      },
    ],
    safetyBoundaries: {
      productionDeployRequiresExplicitApproval: true,
      createRemoteRepositoryRequiresExplicitApproval: true,
      pushRequiresExplicitApproval: true,
      createSiteAllowed: false,
      persistSitesBypassToken: false,
      persistSourceRepositoryCredential: false,
      rawAddressMaterialAllowedInBridge: false,
    },
    blockedMaterial: [
      'rawAddress',
      'recipientName',
      'recipientPhone',
      'selectedAddressBody',
      'providerIdToken',
      'providerAccessToken',
      'providerRefreshToken',
      'siwc_bypass_bearer_token',
      'sourceRepositoryCredential',
      'privateKey',
      'proofSecret',
      'carrierCredential',
      'productionCredential',
    ],
    syncPlan: [
      {
        id: 'agid-to-sites-constants',
        label: 'Export AGID Veygrit product constants into the Sites app as ref-only UI data.',
        requiredBefore: ['site-ui-edit'],
        verifier: 'npm run verify:veygrit-sites-bridge',
      },
      {
        id: 'agid-to-sites-ref-fixtures',
        label: 'Generate the Sites app ref-only fixture module from the AGID fixture contract.',
        requiredBefore: ['site-ui-edit', 'site-save-version'],
        verifier: 'npm run verify:veygrit-sites-ref-fixtures',
      },
      {
        id: 'agid-to-sites-transition-buttons',
        label: 'Generate Sites commerce entry buttons from AGID transition edges.',
        requiredBefore: ['site-ui-edit', 'site-save-version'],
        verifier: 'npm run verify:veygrit-sites-transition-buttons',
      },
      {
        id: 'agid-to-sites-app-shell',
        label: 'Verify the Sites app shell keeps the AGID Home and Store navigation sections visible.',
        requiredBefore: ['site-ui-edit', 'site-save-version'],
        verifier: 'npm run verify:veygrit-sites-app-shell',
      },
      {
        id: 'agid-to-sites-store-catalog',
        label: 'Generate Sites Store Topics and Discover genres from the AGID app model.',
        requiredBefore: ['site-ui-edit', 'site-save-version'],
        verifier: 'npm run verify:veygrit-sites-store-catalog',
      },
      {
        id: 'sites-store-state-test-harness',
        label: 'Run the Sites app My Stores revoke/reconnect state tests before save or deploy review.',
        requiredBefore: ['site-save-version', 'site-deploy'],
        verifier: 'npm run verify:veygrit-sites-store-state',
      },
      {
        id: 'sites-presave-aggregate-gate',
        label: 'Run the local Sites pre-save aggregate gate before save or deploy review.',
        requiredBefore: ['site-save-version', 'site-deploy'],
        verifier: 'npm run verify:veygrit-sites-presave',
      },
      {
        id: 'redact-current-site-fixtures',
        label: 'Keep Sites app address/contact placeholders in ref-only fixtures before treating the site as a product source of truth.',
        requiredBefore: ['site-save-version', 'site-deploy'],
        verifier: 'npm run verify:veygrit-sites-predeploy-redaction',
      },
      {
        id: 'render-demo-ec-flow',
        label: 'Add the Vey ID demo EC checkout surface from src/lib/veyIdDemoEcFlow.ts.',
        requiredBefore: ['site-save-version'],
        verifier: 'npm run verify:vey-id-demo-ec-flow',
      },
      {
        id: 'sites-save-or-deploy',
        label: 'Save or deploy only after a pushed source commit and an explicit user request for that exact action.',
        requiredBefore: [],
        verifier: 'Sites project/version checks plus explicit approval record',
      },
    ],
    validationGates: [
      'npm run verify:veygrit-sites-bridge',
      'npm run verify:veygrit-sites-app-shell',
      'npm run verify:veygrit-sites-ref-fixtures',
      'npm run check:veygrit-sites-ref-fixtures',
      'npm run verify:veygrit-sites-store-catalog',
      'npm run check:veygrit-sites-store-catalog',
      'npm run verify:veygrit-sites-transition-buttons',
      'npm run check:veygrit-sites-transition-buttons',
      'npm run verify:veygrit-sites-link',
      'npm run verify:veygrit-sites-ui-smoke',
      'npm run verify:veygrit-sites-store-state',
      'npm run verify:veygrit-sites-presave',
      'npm run verify:veygrit-sites-ci-boundary',
      'npm run verify:vey-id-demo-ec-flow',
      'npm run verify:veygrit-id',
      'npm run verify:address-login-spec',
      'cd C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app && npm run build',
    ],
    warnings: [
      'Future Sites fixture edits must remain ref-only and pass the predeploy redaction gate before save or deploy.',
      'Sites deployment is production-facing even when access is custom, so save/deploy must be explicit.',
      'The Veygrit Sites pre-save aggregate gate is local-only until CI has the linked Sites app source at the bridge localRoot path and an explicitly marked multi-source, no-remote-mutation workflow.',
    ],
    nonClaims: [
      'This bridge does not create or delete GitHub repositories.',
      'This bridge does not push, open pull requests, save a Sites version, or deploy production.',
      'The Sites app is a UI surface, not the source of truth for address privacy or identity claims.',
      'Vey ID remains Google/Apple-only for account creation in the current plan.',
    ],
  };
}

function publicBridgeSurface(bridge: VeygritSitesBridge) {
  return {
    version: bridge.version,
    codexThread: bridge.codexThread,
    sitesProject: bridge.sitesProject,
    githubConnection: bridge.githubConnection,
    ownership: bridge.ownership,
    sourceMappings: bridge.sourceMappings,
    targetSiteSurfaces: bridge.targetSiteSurfaces,
    safetyBoundaries: bridge.safetyBoundaries,
    syncPlan: bridge.syncPlan,
    validationGates: bridge.validationGates,
    nonClaims: bridge.nonClaims,
  };
}

export function validateVeygritSitesBridge(bridge = buildVeygritSitesBridge()): VeygritSitesBridgeValidation {
  const errors: string[] = [];
  const warnings: string[] = [...bridge.warnings];
  const publicSurfaceJson = JSON.stringify(publicBridgeSurface(bridge));

  if (bridge.version !== VEYGRIT_SITES_BRIDGE_VERSION) errors.push('version-mismatch');
  if (bridge.codexThread.id !== THREAD_ID) errors.push('thread-id-mismatch');
  if (bridge.codexThread.uri !== `codex://threads/${THREAD_ID}`) errors.push('thread-uri-mismatch');
  if (bridge.sitesProject.projectId !== SITES_PROJECT_ID) errors.push('sites-project-id-mismatch');
  if (!bridge.sitesProject.projectId.startsWith('appgprj_')) errors.push('invalid-sites-project-id-prefix');
  if (!/^https:\/\/[a-z0-9-]+\.cool-globe-6298\.chatgpt\.site$/.test(bridge.sitesProject.currentLiveUrl)) {
    errors.push('unexpected-sites-live-url-shape');
  }
  if (bridge.safetyBoundaries.createSiteAllowed) errors.push('create-site-must-remain-disabled-for-existing-hosting-json');
  if (!bridge.safetyBoundaries.productionDeployRequiresExplicitApproval) errors.push('production-deploy-must-require-explicit-approval');
  if (!bridge.safetyBoundaries.pushRequiresExplicitApproval) errors.push('git-push-must-require-explicit-approval');
  if (bridge.safetyBoundaries.rawAddressMaterialAllowedInBridge) errors.push('raw-address-material-must-not-be-allowed-in-bridge');
  if (!bridge.githubConnection.installedAccounts.includes(bridge.githubConnection.authenticatedLogin)) {
    errors.push('authenticated-github-login-not-installed-account');
  }
  if (bridge.githubConnection.remoteMutationAllowedThisTurn) errors.push('remote-mutation-must-remain-disabled');
  if (!bridge.sourceMappings.some(mapping => mapping.agidSource === 'src/lib/veyIdDemoEcFlow.ts')) {
    errors.push('missing-demo-ec-flow-source-mapping');
  }
  if (!bridge.sourceMappings.some(mapping => mapping.agidSource === 'src/lib/veygritSitesRefFixtures.ts' && mapping.siteTarget.endsWith('/src/veygritRefFixtures.js'))) {
    errors.push('missing-sites-ref-fixture-source-mapping');
  }
  if (!bridge.sourceMappings.some(mapping => mapping.agidSource === 'src/lib/veygritSitesTransitionButtons.ts' && mapping.siteTarget.endsWith('/src/veygritTransitionButtons.js'))) {
    errors.push('missing-sites-transition-buttons-source-mapping');
  }
  if (!bridge.sourceMappings.some(mapping => mapping.agidSource === 'src/lib/veygritSitesAppShell.ts' && mapping.siteTarget.endsWith('/src/main.jsx'))) {
    errors.push('missing-sites-app-shell-source-mapping');
  }
  if (!bridge.sourceMappings.some(mapping => mapping.agidSource === 'src/lib/veygritSitesStoreCatalog.ts' && mapping.siteTarget.endsWith('/src/veygritStoreCatalog.js'))) {
    errors.push('missing-sites-store-catalog-source-mapping');
  }
  if (!bridge.targetSiteSurfaces.some(surface => surface.id === 'vey-id-demo-ec-checkout')) {
    errors.push('missing-vey-id-demo-ec-checkout-surface');
  }
  if (!bridge.syncPlan.some(step => step.id === 'redact-current-site-fixtures' && step.requiredBefore.includes('site-deploy'))) {
    errors.push('missing-site-fixture-redaction-before-deploy');
  }
  if (!bridge.syncPlan.some(step => step.id === 'redact-current-site-fixtures' && step.verifier === 'npm run verify:veygrit-sites-predeploy-redaction')) {
    errors.push('missing-site-predeploy-redaction-verifier');
  }
  if (!bridge.syncPlan.some(step => step.id === 'agid-to-sites-ref-fixtures' && step.verifier === 'npm run verify:veygrit-sites-ref-fixtures')) {
    errors.push('missing-sites-ref-fixture-verifier');
  }
  if (!bridge.syncPlan.some(step => step.id === 'agid-to-sites-transition-buttons' && step.verifier === 'npm run verify:veygrit-sites-transition-buttons')) {
    errors.push('missing-sites-transition-buttons-verifier');
  }
  if (!bridge.syncPlan.some(step => step.id === 'agid-to-sites-app-shell' && step.verifier === 'npm run verify:veygrit-sites-app-shell')) {
    errors.push('missing-sites-app-shell-verifier');
  }
  if (!bridge.syncPlan.some(step => step.id === 'agid-to-sites-store-catalog' && step.verifier === 'npm run verify:veygrit-sites-store-catalog')) {
    errors.push('missing-sites-store-catalog-verifier');
  }
  if (!bridge.syncPlan.some(step => step.id === 'sites-store-state-test-harness' && step.verifier === 'npm run verify:veygrit-sites-store-state' && step.requiredBefore.includes('site-deploy'))) {
    errors.push('missing-sites-store-state-test-harness-verifier');
  }
  if (!bridge.syncPlan.some(step => step.id === 'sites-presave-aggregate-gate' && step.verifier === 'npm run verify:veygrit-sites-presave' && step.requiredBefore.includes('site-deploy'))) {
    errors.push('missing-sites-presave-aggregate-gate');
  }
  if (!bridge.validationGates.includes('npm run verify:veygrit-sites-bridge')) {
    errors.push('missing-bridge-verifier');
  }
  if (!bridge.validationGates.includes('npm run verify:veygrit-sites-app-shell')) {
    errors.push('missing-sites-app-shell-validation-gate');
  }
  if (!bridge.validationGates.includes('npm run verify:veygrit-sites-store-catalog')) {
    errors.push('missing-sites-store-catalog-validation-gate');
  }
  if (!bridge.validationGates.includes('npm run check:veygrit-sites-store-catalog')) {
    errors.push('missing-sites-store-catalog-check-gate');
  }
  if (!bridge.validationGates.includes('npm run verify:veygrit-sites-ref-fixtures')) {
    errors.push('missing-sites-ref-fixture-validation-gate');
  }
  if (!bridge.validationGates.includes('npm run check:veygrit-sites-ref-fixtures')) {
    errors.push('missing-sites-ref-fixture-check-gate');
  }
  if (!bridge.validationGates.includes('npm run verify:veygrit-sites-transition-buttons')) {
    errors.push('missing-sites-transition-buttons-validation-gate');
  }
  if (!bridge.validationGates.includes('npm run check:veygrit-sites-transition-buttons')) {
    errors.push('missing-sites-transition-buttons-check-gate');
  }
  if (!bridge.validationGates.includes('npm run verify:veygrit-sites-link')) {
    errors.push('missing-sites-link-verifier');
  }
  if (!bridge.validationGates.includes('npm run verify:veygrit-sites-ui-smoke')) {
    errors.push('missing-sites-ui-smoke-verifier');
  }
  if (!bridge.validationGates.includes('npm run verify:veygrit-sites-store-state')) {
    errors.push('missing-sites-store-state-verifier');
  }
  if (!bridge.validationGates.includes('npm run verify:veygrit-sites-presave')) {
    errors.push('missing-sites-presave-verifier');
  }
  if (!bridge.validationGates.includes('npm run verify:veygrit-sites-ci-boundary')) {
    errors.push('missing-sites-ci-boundary-verifier');
  }
  if (!bridge.warnings.some(warning => /pre-save aggregate gate is local-only/i.test(warning))) {
    errors.push('missing-sites-presave-ci-boundary-warning');
  }
  if (/siwc_bypass_bearer_token"\s*:|sourceRepositoryCredential"\s*:|providerIdToken"\s*:|rawAddress"\s*:|sk_live_|ghp_[A-Za-z0-9_]+/.test(publicSurfaceJson)) {
    errors.push('public-bridge-surface-persists-private-or-secret-material');
  }

  return { ok: errors.length === 0, errors, warnings };
}

export const VEYGRIT_BOUNDARY_GATE_INDEX_VERSION = 'veygrit-boundary-gate-index-v0.1';

export type VeygritBoundaryGate = {
  id: string;
  protectedSurface: string;
  boundary: 'no-script-fixtures';
  testFile: string;
  verificationCommands: string[];
  protectedModules: string[];
  remoteMutationAllowed: false;
  productionTrafficAllowed: false;
  reviewerNote: string;
};

export type VeygritBoundaryGateIndex = {
  version: typeof VEYGRIT_BOUNDARY_GATE_INDEX_VERSION;
  status: 'local-review-index-no-remote-mutation';
  purpose: string;
  gates: VeygritBoundaryGate[];
  nonClaims: string[];
};

export type VeygritBoundaryGateIndexValidation = {
  ok: boolean;
  errors: string[];
};

const RemoteMutationCommandPattern = /\b(git\s+push|gh\s+pr\s+create|gh\s+repo\s+create|npm\s+publish|sites\s+save|deploy\s+production)\b/i;

export function buildVeygritBoundaryGateIndex(): VeygritBoundaryGateIndex {
  return {
    version: VEYGRIT_BOUNDARY_GATE_INDEX_VERSION,
    status: 'local-review-index-no-remote-mutation',
    purpose:
      'List the Veygrit no-script-fixture import-boundary gates so OSS and grant reviewers can see which local verifier protects each surface.',
    gates: [
      {
        id: 'veygrit-repository-handoff',
        protectedSurface: 'GitHub handoff and release-readiness contracts',
        boundary: 'no-script-fixtures',
        testFile: 'src/lib/veygritRepositoryHandoff.test.ts',
        verificationCommands: ['npm run verify:veygrit-github-handoff'],
        protectedModules: [
          'src/lib/veygritRepositoryHandoff.ts',
          'src/lib/veygritHandoffBundleManifest.ts',
          'src/lib/veygritReleaseReadinessDiscoveryContract.ts',
        ],
        remoteMutationAllowed: false,
        productionTrafficAllowed: false,
        reviewerNote: 'Keeps handoff contracts local-only and separate from script fixtures.',
      },
      {
        id: 'veygrit-sites-contracts',
        protectedSurface: 'Sites bridge, app shell, ref fixtures, store catalog, and transition buttons',
        boundary: 'no-script-fixtures',
        testFile: 'src/lib/veygritSitesBridge.test.ts',
        verificationCommands: ['npm run verify:veygrit-sites-bridge'],
        protectedModules: [
          'src/lib/veygritSitesBridge.ts',
          'src/lib/veygritSitesAppShell.ts',
          'src/lib/veygritSitesRefFixtures.ts',
          'src/lib/veygritSitesStoreCatalog.ts',
          'src/lib/veygritSitesTransitionButtons.ts',
        ],
        remoteMutationAllowed: false,
        productionTrafficAllowed: false,
        reviewerNote: 'Keeps Sites-facing contracts reviewable without generated script coupling.',
      },
      {
        id: 'veygrit-id-address-login-contracts',
        protectedSurface: 'Vey ID, Address Login, hosted callback, and SDK-facing contracts',
        boundary: 'no-script-fixtures',
        testFile: 'src/lib/veygritIdAddressLoginPlan.test.ts',
        verificationCommands: ['npm run verify:address-login-spec'],
        protectedModules: [
          'src/lib/addressLoginSpec.ts',
          'src/lib/addressLoginCoverageMap.ts',
          'src/lib/veygritIdAddressLoginPlan.ts',
          'src/lib/veygritAddressLoginCallbackContract.ts',
          'src/lib/veygritHostedAddressLoginContract.ts',
          'src/lib/veygritHostedAddressLoginMock.ts',
        ],
        remoteMutationAllowed: false,
        productionTrafficAllowed: false,
        reviewerNote: 'Keeps Address Login and hosted Vey ID contracts independent from local script fixtures.',
      },
      {
        id: 'carrier-lib-delivery-contracts',
        protectedSurface: 'Carrier connector, waybill, UPS/DHL feature, label, QR, and accuracy contracts',
        boundary: 'no-script-fixtures',
        testFile: 'src/lib/carrierConnectorLayer.test.ts',
        verificationCommands: ['npm run verify:carrier-connector-layer'],
        protectedModules: [
          'src/lib/carrierConnectorLayer.ts',
          'src/lib/carrierWaybillAddress.ts',
          'src/lib/upsCarrierFeatures.ts',
          'src/lib/dhlCarrierFeatures.ts',
          'src/lib/deliveryGatewayCarrierApi.ts',
          'src/lib/carrierLabelIntent.ts',
          'src/lib/shippingLabelQr.ts',
          'src/lib/shippingAddressAccuracy.ts',
        ],
        remoteMutationAllowed: false,
        productionTrafficAllowed: false,
        reviewerNote: 'Keeps lib-side delivery abstractions independent from script fixtures.',
      },
      {
        id: 'veygrit-ship-delivery-contracts',
        protectedSurface: 'Veygrit Ship guest access, public test routes, shipping store, workers, secrets, and labels',
        boundary: 'no-script-fixtures',
        testFile: 'src/server/auth/veygritShipGuestAccess.test.ts',
        verificationCommands: ['npm run verify:veygrit-ship-guest-access'],
        protectedModules: [
          'src/server/auth/veygritShipGuestAccess.ts',
          'src/server/routes/veygritShipGuestRoutes.ts',
          'src/server/routes/skipshipSandboxRoutes.ts',
          'src/server/shipping/veygritShipStore.ts',
          'src/server/shipping/veygritShipWorkers.ts',
          'src/server/shipping/carrierSecretManagement.ts',
          'src/server/shipping/labelManagement.ts',
          'src/server/shipping/multiCloudCarrierSecretVault.ts',
          'src/server/shipping/multiCloudLabelObjectStorage.ts',
        ],
        remoteMutationAllowed: false,
        productionTrafficAllowed: false,
        reviewerNote: 'Keeps guest/test-facing shipping entrypoints and persistence contracts fixture-independent.',
      },
      {
        id: 'server-carrier-route-adapters',
        protectedSurface: 'UPS/DHL internal routes, waybill route, and concrete server adapters',
        boundary: 'no-script-fixtures',
        testFile: 'src/server/routes/dhlCarrierRoutes.test.ts',
        verificationCommands: ['npm run verify:dhl-live-connectors', 'npm run verify:ups-live-connector'],
        protectedModules: [
          'src/server/routes/upsCarrierRoutes.ts',
          'src/server/routes/dhlCarrierRoutes.ts',
          'src/server/routes/carrierWaybillAddressRoutes.ts',
          'src/server/carriers/ups/upsConnector.ts',
          'src/server/carriers/dhl/dhlAdapters.ts',
          'src/server/carriers/dhl/dhlHttp.ts',
          'src/server/carriers/dhl/dhlShipmentRouter.ts',
        ],
        remoteMutationAllowed: false,
        productionTrafficAllowed: false,
        reviewerNote: 'Keeps concrete carrier route and adapter code independent from script fixtures.',
      },
    ],
    nonClaims: [
      'This index is a local review aid, not a release, deploy, GitHub push, pull request, or remote repository creation.',
      'Passing these gates does not prove production carrier readiness or authorize production traffic.',
      'The index names only file paths and local verification commands; it must not contain private delivery material or credentials.',
    ],
  };
}

export function validateVeygritBoundaryGateIndex(index: VeygritBoundaryGateIndex): VeygritBoundaryGateIndexValidation {
  const errors: string[] = [];
  const ids = new Set<string>();

  if (index.version !== VEYGRIT_BOUNDARY_GATE_INDEX_VERSION) errors.push('version-mismatch');
  if (index.status !== 'local-review-index-no-remote-mutation') errors.push('status-not-local-review');
  if (index.gates.length < 6) errors.push('missing-boundary-gates');

  for (const gate of index.gates) {
    if (ids.has(gate.id)) errors.push(`duplicate-gate:${gate.id}`);
    ids.add(gate.id);
    if (gate.boundary !== 'no-script-fixtures') errors.push(`wrong-boundary:${gate.id}`);
    if (!gate.testFile.endsWith('.test.ts')) errors.push(`missing-test-file:${gate.id}`);
    if (!gate.verificationCommands.length) errors.push(`missing-verification-command:${gate.id}`);
    if (!gate.protectedModules.length) errors.push(`missing-protected-modules:${gate.id}`);
    if (gate.remoteMutationAllowed !== false) errors.push(`remote-mutation-allowed:${gate.id}`);
    if (gate.productionTrafficAllowed !== false) errors.push(`production-traffic-allowed:${gate.id}`);

    for (const command of gate.verificationCommands) {
      if (!command.startsWith('npm run ')) errors.push(`non-npm-verifier:${gate.id}`);
      if (RemoteMutationCommandPattern.test(command)) errors.push(`remote-mutation-command:${gate.id}`);
    }

    for (const modulePath of gate.protectedModules) {
      if (!modulePath.startsWith('src/')) errors.push(`non-src-protected-module:${gate.id}:${modulePath}`);
      if (modulePath.includes('/scripts/') || modulePath.startsWith('scripts/')) {
        errors.push(`script-fixture-listed-as-production-module:${gate.id}:${modulePath}`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

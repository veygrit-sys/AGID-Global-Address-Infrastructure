export type VeygritReleaseReadinessDiscoveryStep = {
  label: string;
  args: string[];
};

export type VeygritReleaseReadinessDiscoverySummary = {
  status: 'pass';
  verifier: 'run-veygrit-app-release-readiness';
  mode: 'list-steps';
  steps: VeygritReleaseReadinessDiscoveryStep[];
  remoteMutationAllowedThisTurn: false;
};

export const EXPECTED_VEYGRIT_RELEASE_READINESS_DISCOVERY_STEPS: VeygritReleaseReadinessDiscoveryStep[] = [
  {
    label: 'Veygrit app release readiness fixture tests',
    args: ['node_modules/tsx/dist/cli.mjs', '--test', 'scripts/verify-veygrit-app-release-readiness.test.ts'],
  },
  {
    label: 'Veygrit app release readiness live package check',
    args: ['node_modules/tsx/dist/cli.mjs', 'scripts/verify-veygrit-app-release-readiness.ts'],
  },
  {
    label: 'Hosted Vey ID production OpenAPI verifier tests',
    args: ['node_modules/tsx/dist/cli.mjs', '--test', 'scripts/verify-veygrit-id-production-openapi.test.ts'],
  },
  {
    label: 'Hosted Vey ID production OpenAPI CLI check',
    args: ['node_modules/tsx/dist/cli.mjs', 'scripts/verify-veygrit-id-production-openapi.ts'],
  },
  {
    label: 'Hosted Address Login contract fixture smoke',
    args: ['node_modules/tsx/dist/cli.mjs', 'scripts/verify-veygrit-address-login-hosted.ts'],
  },
  {
    label: 'Vey ID Address Wallet pass export fixture/schema verifier',
    args: ['node_modules/tsx/dist/cli.mjs', 'scripts/verify-vey-id-address-wallet-pass-export-fixture-schema.ts'],
  },
  {
    label: 'Veygrit handoff bundle coverage report',
    args: ['node_modules/tsx/dist/cli.mjs', 'scripts/print-veygrit-handoff-bundle-manifest.ts', '--compact'],
  },
  {
    label: 'Veygrit Sites handoff link verifier',
    args: ['node_modules/tsx/dist/cli.mjs', 'scripts/verify-veygrit-sites-link.ts'],
  },
];

export const EXPECTED_VEYGRIT_RELEASE_READINESS_DISCOVERY_SUMMARY: VeygritReleaseReadinessDiscoverySummary = {
  status: 'pass',
  verifier: 'run-veygrit-app-release-readiness',
  mode: 'list-steps',
  steps: EXPECTED_VEYGRIT_RELEASE_READINESS_DISCOVERY_STEPS,
  remoteMutationAllowedThisTurn: false,
};

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function renderVeygritReleaseReadinessDiscoveryTableRows(
  steps: VeygritReleaseReadinessDiscoveryStep[] = EXPECTED_VEYGRIT_RELEASE_READINESS_DISCOVERY_STEPS,
): string[] {
  return steps.map(step => `| ${step.label} | \`${step.args.join(' ')}\` |`);
}

export function renderVeygritReleaseReadinessDiscoveryTable(
  steps: VeygritReleaseReadinessDiscoveryStep[] = EXPECTED_VEYGRIT_RELEASE_READINESS_DISCOVERY_STEPS,
): string {
  return [
    '| Gate | Args |',
    '| --- | --- |',
    ...renderVeygritReleaseReadinessDiscoveryTableRows(steps),
  ].join('\n');
}

export function renderVeygritReleaseReadinessDiscoveryBulletRows(
  steps: VeygritReleaseReadinessDiscoveryStep[] = EXPECTED_VEYGRIT_RELEASE_READINESS_DISCOVERY_STEPS,
): string[] {
  return steps.map(step => `- \`${step.label}\`: \`${step.args.join(' ')}\``);
}

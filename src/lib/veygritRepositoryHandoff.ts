import { buildVeygritSitesBridge } from './veygritSitesBridge';
import { renderVeygritReleaseReadinessDiscoveryTableRows } from './veygritReleaseReadinessDiscoveryContract';

export const VEYGRIT_REPOSITORY_HANDOFF_VERSION = 'veygrit-repository-handoff-v0.1';

export type VeygritGitHubUpdateMode = {
  id: string;
  label: string;
  allowedThisTurn: boolean;
  requiredBeforeUse: string[];
};

export type VeygritRepositoryHandoff = {
  version: typeof VEYGRIT_REPOSITORY_HANDOFF_VERSION;
  status: 'local-ready-no-remote-mutation';
  targetRepository: {
    owner: string;
    name: string;
    fullName: string;
    role: 'separate-veygrit-address-wallet-ui-repository';
  };
  codexTask: {
    id: string;
    uri: string;
  };
  localRoots: {
    sitesWorkspace: string;
    sitesApp: string;
  };
  handoffExport: {
    generatedFile: string;
    readmeFile: string;
    releaseChecklistFile: string;
    syncScript: string;
    checkScript: string;
    appCheckScript: string;
    appTestScript: string;
    generatedBy: string;
  };
  sourceOfTruth: {
    agidOwns: string[];
    veygritRepoOwns: string[];
  };
  handoffArtifacts: string[];
  requiredLocalGates: string[];
  githubUpdateModes: VeygritGitHubUpdateMode[];
  blockedActions: string[];
  nonClaims: string[];
};

export type VeygritRepositoryHandoffValidation = {
  ok: boolean;
  errors: string[];
};

const VeygritRepoName = 'Veygrit-US';

export function buildVeygritRepositoryHandoff(): VeygritRepositoryHandoff {
  const bridge = buildVeygritSitesBridge();
  const [owner, name] = bridge.githubConnection.siteRepositoryCandidate.split('/');

  return {
    version: VEYGRIT_REPOSITORY_HANDOFF_VERSION,
    status: 'local-ready-no-remote-mutation',
    targetRepository: {
      owner,
      name,
      fullName: bridge.githubConnection.siteRepositoryCandidate,
      role: 'separate-veygrit-address-wallet-ui-repository',
    },
    codexTask: {
      id: bridge.codexThread.id,
      uri: bridge.codexThread.uri,
    },
    localRoots: {
      sitesWorkspace: bridge.codexThread.localRoot,
      sitesApp: `${bridge.codexThread.localRoot}/work/veygrit-app`,
    },
    handoffExport: {
      generatedFile: `${bridge.codexThread.localRoot}/work/veygrit-app/AGID_HANDOFF.md`,
      readmeFile: `${bridge.codexThread.localRoot}/work/veygrit-app/README.md`,
      releaseChecklistFile: `${bridge.codexThread.localRoot}/work/veygrit-app/RELEASE_UPDATE_CHECKLIST.md`,
      syncScript: 'npm run sync:veygrit-github-handoff',
      checkScript: 'npm run check:veygrit-github-handoff',
      appCheckScript: 'npm run check:agid-handoff',
      appTestScript: 'npm run test:agid-handoff',
      generatedBy: 'scripts/sync-veygrit-github-handoff.ts',
    },
    sourceOfTruth: {
      agidOwns: [
        'Vey ID contracts',
        'Address Wallet privacy and consent boundaries',
        'Address Login and Playlist Commerce product separation',
        'OpenAPI fixtures, SDK plans, and no-secret gates',
      ],
      veygritRepoOwns: [
        'Veygrit Address Wallet UI source',
        'local Vite app build',
        'Sites-compatible static assets',
        'screen implementation for Home, Friends, Store, My Page, and Settings',
      ],
    },
    handoffArtifacts: [
      'docs/product/veygrit-sites-codex-link.md',
      'docs/product/veygrit-handoff-bundle-manifest.md',
      'docs/product/veygrit-boundary-gate-index.md',
      'src/lib/veygritSitesBridge.ts',
      'src/lib/veygritRepositoryHandoff.ts',
      'src/lib/veygritHandoffBundleManifest.ts',
      'src/lib/veygritBoundaryGateIndex.ts',
      'src/lib/veygritBoundaryGateIndex.test.ts',
      'scripts/verify-veygrit-app-release-readiness.ts',
      'scripts/verify-veygrit-app-release-readiness.test.ts',
      'scripts/run-veygrit-app-release-readiness.ts',
      'src/lib/veygritReleaseReadinessDiscoveryContract.ts',
      'scripts/sync-veygrit-github-handoff.ts',
      'C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/AGID_HANDOFF.md',
      'C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/README.md',
      'C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/RELEASE_UPDATE_CHECKLIST.md',
      'C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/scripts/check-agid-handoff.mjs',
      'C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/scripts/check-agid-handoff.test.mjs',
      'C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/scripts/release-readiness.mjs',
      'C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app/scripts/release-readiness.test.mjs',
      'docs/specs/fixtures/veygrit-sites-ci-boundary/allowed-multi-source-presave.yml',
      'docs/specs/fixtures/veygrit-sites-ci-boundary/blocked-unmarked-presave.yml',
      'scripts/run-veygrit-sites-ci-boundary.ts',
      'scripts/verify-veygrit-sites-ci-boundary.ts',
    ],
    requiredLocalGates: [
      'npm run verify:veygrit-github-handoff',
      'npm run verify:veygrit-handoff-bundle-manifest',
      'npm run verify:veygrit-boundary-gate-index',
      'npm run verify:veygrit-app-release-readiness',
      'npm run check:veygrit-github-handoff',
      'npm run verify:veygrit-sites-bridge',
      'npm run verify:veygrit-sites-ci-boundary',
      'npm run verify:veygrit-sites-presave',
      'npm run verify:preaudit-secrets',
    ],
    githubUpdateModes: [
      {
        id: 'local-prep-only',
        label: 'Prepare and verify handoff artifacts locally.',
        allowedThisTurn: true,
        requiredBeforeUse: [],
      },
      {
        id: 'push-existing-veygrit-repository',
        label: `Push local Veygrit app source to ${bridge.githubConnection.siteRepositoryCandidate}.`,
        allowedThisTurn: false,
        requiredBeforeUse: [
          'explicit user request for push in the current turn',
          'reviewed git status for the target repository',
          'passing required local gates',
          'no production deploy or Sites save bundled with the push',
        ],
      },
      {
        id: 'open-pull-request',
        label: `Open a pull request against ${bridge.githubConnection.siteRepositoryCandidate}.`,
        allowedThisTurn: false,
        requiredBeforeUse: [
          'explicit user request for pull request creation in the current turn',
          'pushed branch already exists',
          'PR body states non-claims and no production deploy',
        ],
      },
      {
        id: 'create-new-repository',
        label: 'Create a new remote Veygrit repository.',
        allowedThisTurn: false,
        requiredBeforeUse: [
          'explicit user request naming the new remote repository in the current turn',
          'confirmed owner account',
          'local repository template reviewed before creation',
        ],
      },
    ],
    blockedActions: [
      'create or delete remote GitHub repositories',
      'push commits',
      'open pull requests',
      'save a Sites version',
      'deploy production',
      'send production traffic',
      'persist provider tokens, carrier credentials, or source repository credentials',
      'copy private address, recipient, witness, private-key, or proof-secret material',
    ],
    nonClaims: [
      'This handoff does not prove the remote repository exists.',
      'This handoff does not grant GitHub push permission.',
      'This handoff does not approve Sites save or production deploy.',
      'Vey ID remains Google/Apple-only for account creation in the current plan.',
    ],
  };
}

export function buildVeygritRepositoryHandoffMarkdown(
  handoff = buildVeygritRepositoryHandoff(),
): string {
  const remoteModes = handoff.githubUpdateModes.filter(mode => mode.id !== 'local-prep-only');
  return [
    '# AGID Handoff for Veygrit',
    '',
    '<!-- Generated by scripts/sync-veygrit-github-handoff.ts. Do not add secrets or raw address material. -->',
    '',
    `Target repository candidate: \`${handoff.targetRepository.fullName}\``,
    `Status: \`${handoff.status}\``,
    `Codex task: \`${handoff.codexTask.uri}\``,
    '',
    '## Ownership Boundary',
    '',
    'AGID remains the source of truth for:',
    '',
    ...handoff.sourceOfTruth.agidOwns.map(item => `- ${item}`),
    '',
    'This Veygrit app repository owns:',
    '',
    ...handoff.sourceOfTruth.veygritRepoOwns.map(item => `- ${item}`),
    '',
    '## Required Local Gates',
    '',
    'Run these from AGID before any future GitHub update request:',
    '',
    '```bash',
    ...handoff.requiredLocalGates,
    '```',
    '',
    'Run these from the Veygrit app root after export:',
    '',
    '```bash',
    handoff.handoffExport.appCheckScript,
    handoff.handoffExport.appTestScript,
    '```',
    '',
    `Use \`${handoff.handoffExport.releaseChecklistFile}\` as a local review checklist and PR body seed only after an explicit GitHub update request in the current turn.`,
    '',
    '## Optional Operator Discovery',
    '',
    'Run this from AGID when CI, Codex, or a reviewer needs the bundled release-readiness gate list without executing child verifier processes:',
    '',
    '```bash',
    'npm run verify:veygrit-app-release-readiness:list',
    '```',
    '',
    'Current discovery gate table:',
    '',
    'remoteMutationAllowedThisTurn: `false`',
    '',
    '| Gate | Args |',
    '| --- | --- |',
    ...renderVeygritReleaseReadinessDiscoveryTableRows(),
    '',
    'This discovery command is local-only and does not replace the required release-readiness gate.',
    '',
    '## Remote Action Boundary',
    '',
    'This file is local handoff material only. The following actions remain blocked until the user explicitly requests that exact action in the current turn:',
    '',
    ...handoff.blockedActions.map(action => `- ${action}`),
    '',
    'Remote update modes that remain disabled by default:',
    '',
    ...remoteModes.map(mode => `- \`${mode.id}\`: ${mode.label}`),
    '',
    '## Non-Claims',
    '',
    ...handoff.nonClaims.map(claim => `- ${claim}`),
    '',
  ].join('\n');
}

export function validateVeygritRepositoryHandoff(
  handoff = buildVeygritRepositoryHandoff(),
): VeygritRepositoryHandoffValidation {
  const bridge = buildVeygritSitesBridge();
  const errors: string[] = [];
  const publicJson = JSON.stringify(handoff);

  if (handoff.version !== VEYGRIT_REPOSITORY_HANDOFF_VERSION) errors.push('version-mismatch');
  if (handoff.status !== 'local-ready-no-remote-mutation') errors.push('unexpected-handoff-status');
  if (handoff.targetRepository.fullName !== bridge.githubConnection.siteRepositoryCandidate) {
    errors.push('target-repository-mismatch');
  }
  if (handoff.targetRepository.name !== VeygritRepoName) errors.push('target-repository-name-mismatch');
  if (!bridge.githubConnection.installedAccounts.includes(handoff.targetRepository.owner)) {
    errors.push('target-owner-not-installed');
  }
  if (handoff.codexTask.id !== bridge.codexThread.id) errors.push('codex-task-id-mismatch');
  if (handoff.codexTask.uri !== bridge.codexThread.uri) errors.push('codex-task-uri-mismatch');
  if (handoff.localRoots.sitesWorkspace !== bridge.codexThread.localRoot) {
    errors.push('sites-workspace-root-mismatch');
  }
  if (!handoff.localRoots.sitesApp.endsWith('/work/veygrit-app')) {
    errors.push('sites-app-root-missing');
  }
  if (handoff.handoffExport.generatedFile !== `${handoff.localRoots.sitesApp}/AGID_HANDOFF.md`) {
    errors.push('handoff-export-file-mismatch');
  }
  if (handoff.handoffExport.readmeFile !== `${handoff.localRoots.sitesApp}/README.md`) {
    errors.push('handoff-readme-file-mismatch');
  }
  if (handoff.handoffExport.releaseChecklistFile !== `${handoff.localRoots.sitesApp}/RELEASE_UPDATE_CHECKLIST.md`) {
    errors.push('handoff-release-checklist-file-mismatch');
  }
  if (handoff.handoffExport.syncScript !== 'npm run sync:veygrit-github-handoff') {
    errors.push('handoff-sync-script-mismatch');
  }
  if (handoff.handoffExport.checkScript !== 'npm run check:veygrit-github-handoff') {
    errors.push('handoff-check-script-mismatch');
  }
  if (handoff.handoffExport.appCheckScript !== 'npm run check:agid-handoff') {
    errors.push('handoff-app-check-script-mismatch');
  }
  if (handoff.handoffExport.appTestScript !== 'npm run test:agid-handoff') {
    errors.push('handoff-app-test-script-mismatch');
  }
  for (const gate of [
    'npm run verify:veygrit-github-handoff',
    'npm run verify:veygrit-handoff-bundle-manifest',
    'npm run verify:veygrit-boundary-gate-index',
    'npm run verify:veygrit-app-release-readiness',
    'npm run check:veygrit-github-handoff',
    'npm run verify:veygrit-sites-ci-boundary',
    'npm run verify:veygrit-sites-presave',
    'npm run verify:preaudit-secrets',
  ]) {
    if (!handoff.requiredLocalGates.includes(gate)) errors.push(`missing-required-gate:${gate}`);
  }
  if (!handoff.handoffArtifacts.includes('docs/product/veygrit-sites-codex-link.md')) {
    errors.push('missing-codex-link-artifact');
  }
  if (!handoff.handoffArtifacts.includes('docs/product/veygrit-handoff-bundle-manifest.md')) {
    errors.push('missing-bundle-manifest-doc-artifact');
  }
  if (!handoff.handoffArtifacts.includes('docs/product/veygrit-boundary-gate-index.md')) {
    errors.push('missing-boundary-gate-index-doc-artifact');
  }
  if (!handoff.handoffArtifacts.includes('src/lib/veygritHandoffBundleManifest.ts')) {
    errors.push('missing-bundle-manifest-source-artifact');
  }
  if (!handoff.handoffArtifacts.includes('src/lib/veygritBoundaryGateIndex.ts')) {
    errors.push('missing-boundary-gate-index-source-artifact');
  }
  if (!handoff.handoffArtifacts.includes('src/lib/veygritBoundaryGateIndex.test.ts')) {
    errors.push('missing-boundary-gate-index-test-artifact');
  }
  if (!handoff.handoffArtifacts.includes('scripts/verify-veygrit-app-release-readiness.ts')) {
    errors.push('missing-app-release-readiness-verifier-artifact');
  }
  if (!handoff.handoffArtifacts.includes('scripts/verify-veygrit-app-release-readiness.test.ts')) {
    errors.push('missing-app-release-readiness-verifier-test-artifact');
  }
  if (!handoff.handoffArtifacts.includes('scripts/run-veygrit-app-release-readiness.ts')) {
    errors.push('missing-app-release-readiness-runner-artifact');
  }
  if (!handoff.handoffArtifacts.includes(handoff.handoffExport.generatedFile)) {
    errors.push('missing-generated-handoff-artifact');
  }
  if (!handoff.handoffArtifacts.includes(handoff.handoffExport.readmeFile)) {
    errors.push('missing-app-readme-artifact');
  }
  if (!handoff.handoffArtifacts.includes(handoff.handoffExport.releaseChecklistFile)) {
    errors.push('missing-app-release-checklist-artifact');
  }
  if (!handoff.handoffArtifacts.some(path => path.endsWith('/scripts/check-agid-handoff.mjs'))) {
    errors.push('missing-app-handoff-check-artifact');
  }
  if (!handoff.handoffArtifacts.some(path => path.endsWith('/scripts/check-agid-handoff.test.mjs'))) {
    errors.push('missing-app-handoff-check-test-artifact');
  }
  if (!handoff.handoffArtifacts.some(path => path.endsWith('/scripts/release-readiness.mjs'))) {
    errors.push('missing-app-release-readiness-artifact');
  }
  if (!handoff.handoffArtifacts.some(path => path.endsWith('/scripts/release-readiness.test.mjs'))) {
    errors.push('missing-app-release-readiness-test-artifact');
  }
  if (!handoff.handoffArtifacts.some(path => path.includes('veygrit-sites-ci-boundary'))) {
    errors.push('missing-ci-boundary-fixtures');
  }
  if (handoff.githubUpdateModes.some(mode => mode.id !== 'local-prep-only' && mode.allowedThisTurn)) {
    errors.push('remote-update-mode-must-remain-disabled');
  }
  if (!handoff.blockedActions.some(action => /push commits/i.test(action))) errors.push('missing-push-block');
  if (!handoff.blockedActions.some(action => /deploy production/i.test(action))) errors.push('missing-deploy-block');
  if (!handoff.nonClaims.some(claim => /does not grant GitHub push permission/i.test(claim))) {
    errors.push('missing-github-permission-non-claim');
  }
  if (/sk_live_|ghp_[A-Za-z0-9_]+|providerTokenValue|carrierCredentialValue|privateKeyValue|proofSecretValue|siwc_bypass_bearer_token/i.test(publicJson)) {
    errors.push('handoff-persists-secret-like-material');
  }
  if (/sk_live_|ghp_[A-Za-z0-9_]+|providerTokenValue|carrierCredentialValue|privateKeyValue|proofSecretValue|siwc_bypass_bearer_token/i.test(buildVeygritRepositoryHandoffMarkdown(handoff))) {
    errors.push('handoff-markdown-persists-secret-like-material');
  }

  return { ok: errors.length === 0, errors };
}

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const tsxCli = 'node_modules/tsx/dist/cli.mjs';
export const verifier = 'run-veygrit-app-release-readiness';

export type ReleaseReadinessCommand = {
  label: string;
  args: string[];
};

export const VEYGRIT_RELEASE_READINESS_COMMANDS: ReleaseReadinessCommand[] = [
  {
    label: 'Veygrit app release readiness fixture tests',
    args: ['--test', 'scripts/verify-veygrit-app-release-readiness.test.ts'],
  },
  {
    label: 'Veygrit app release readiness live package check',
    args: ['scripts/verify-veygrit-app-release-readiness.ts'],
  },
  {
    label: 'Hosted Vey ID production OpenAPI verifier tests',
    args: ['--test', 'scripts/verify-veygrit-id-production-openapi.test.ts'],
  },
  {
    label: 'Hosted Vey ID production OpenAPI CLI check',
    args: ['scripts/verify-veygrit-id-production-openapi.ts'],
  },
  {
    label: 'Hosted Address Login contract fixture smoke',
    args: ['scripts/verify-veygrit-address-login-hosted.ts'],
  },
  {
    label: 'Vey ID Address Wallet pass export fixture/schema verifier',
    args: ['scripts/verify-vey-id-address-wallet-pass-export-fixture-schema.ts'],
  },
  {
    label: 'Veygrit handoff bundle coverage report',
    args: ['scripts/print-veygrit-handoff-bundle-manifest.ts', '--compact'],
  },
  {
    label: 'Veygrit Sites handoff link verifier',
    args: ['scripts/verify-veygrit-sites-link.ts'],
  },
];

export type StepSummary = {
  label: string;
  args: string[];
  status: 'pass' | 'blocked';
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  durationMs: number;
};

type SpawnResult = {
  error?: Error;
  status: number | null;
  signal: NodeJS.Signals | null;
};

export type ReleaseReadinessRunSummary = {
  status: 'pass' | 'blocked';
  verifier: typeof verifier;
  executed: string[];
  steps: StepSummary[];
  remoteMutationAllowedThisTurn: false;
  failedStep?: string;
  finding?: 'failed-to-start-tsx' | 'step-exited-nonzero';
  message?: string;
  exitCode?: number | null;
  signal?: NodeJS.Signals | null;
};

export type ReleaseReadinessStepListSummary = {
  status: 'pass';
  verifier: typeof verifier;
  mode: 'list-steps';
  steps: Array<{
    label: string;
    args: string[];
  }>;
  remoteMutationAllowedThisTurn: false;
};

export type ReleaseReadinessRunOptions = {
  commands?: ReleaseReadinessCommand[];
  spawn?: (command: string, args: string[], options: { stdio: 'inherit'; shell: false }) => SpawnResult;
  now?: () => number;
};

function buildSummary(
  status: 'pass' | 'blocked',
  steps: StepSummary[],
  extra: Omit<Partial<ReleaseReadinessRunSummary>, 'status' | 'verifier' | 'executed' | 'steps' | 'remoteMutationAllowedThisTurn'> = {},
): ReleaseReadinessRunSummary {
  return {
    status,
    verifier,
    executed: steps.filter(step => step.status === 'pass').map(step => step.label),
    steps,
    remoteMutationAllowedThisTurn: false,
    ...extra,
  };
}

function emitSummary(summary: ReleaseReadinessRunSummary) {
  const output = JSON.stringify(summary, null, 2);
  if (summary.status === 'pass') console.log(output);
  else console.error(output);
}

export function listVeygritAppReleaseReadinessSteps(
  commands: ReleaseReadinessCommand[] = VEYGRIT_RELEASE_READINESS_COMMANDS,
): ReleaseReadinessStepListSummary {
  return {
    status: 'pass',
    verifier,
    mode: 'list-steps',
    steps: commands.map(command => ({
      label: command.label,
      args: [tsxCli, ...command.args],
    })),
    remoteMutationAllowedThisTurn: false,
  };
}

export function runVeygritAppReleaseReadiness(
  options: ReleaseReadinessRunOptions = {},
): ReleaseReadinessRunSummary {
  const commands = options.commands ?? VEYGRIT_RELEASE_READINESS_COMMANDS;
  const spawnRunner = options.spawn ?? ((command: string, args: string[], spawnOptions: { stdio: 'inherit'; shell: false }) => (
    spawnSync(command, args, spawnOptions)
  ));
  const now = options.now ?? Date.now;
  const steps: StepSummary[] = [];

  for (const command of commands) {
    const startedAt = now();
    const result = spawnRunner(process.execPath, [tsxCli, ...command.args], {
      stdio: 'inherit',
      shell: false,
    });
    const step: StepSummary = {
      label: command.label,
      args: [tsxCli, ...command.args],
      status: result.error || result.status !== 0 ? 'blocked' : 'pass',
      exitCode: result.status,
      signal: result.signal,
      durationMs: Math.max(0, now() - startedAt),
    };
    steps.push(step);

    if (result.error) {
      return buildSummary('blocked', steps, {
        failedStep: command.label,
        finding: 'failed-to-start-tsx',
        message: result.error.message,
      });
    }

    if (result.status !== 0) {
      return buildSummary('blocked', steps, {
        failedStep: command.label,
        finding: 'step-exited-nonzero',
        exitCode: result.status,
        signal: result.signal,
      });
    }
  }

  return buildSummary('pass', steps);
}

function main() {
  if (process.argv.includes('--list-steps')) {
    console.log(JSON.stringify(listVeygritAppReleaseReadinessSteps(), null, 2));
    return;
  }

  const summary = runVeygritAppReleaseReadiness();
  emitSummary(summary);
  if (summary.status === 'blocked') {
    process.exit(summary.exitCode ?? 1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main();
}

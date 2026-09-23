import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const WORKFLOW_PATH = join('.github', 'workflows', 'vey-ecosystem.yml');
const VEY_ECOSYSTEM_GATE = 'npm run verify:vey-ecosystem';
const WORKFLOW_GATE = 'npm run verify:vey-ecosystem-workflow';
const NODE_VERSION = '22';
const EXPECTED_PATHS = [
  'docs/product/vey-ecosystem-strategy.md',
  'src/lib/veyEcosystemResearch.ts',
  'src/lib/veyEcosystemResearch.test.ts',
  'scripts/verify-vey-ecosystem-workflow.ts',
  'package.json',
  'package-lock.json',
  '.github/workflows/vey-ecosystem.yml',
];

type WorkflowStep = {
  run?: string;
  uses?: string;
  with?: Record<string, unknown>;
};

type WorkflowJob = {
  'runs-on'?: string;
  'timeout-minutes'?: number;
  steps?: WorkflowStep[];
};

type WorkflowTriggerWithPaths = {
  branches?: string[];
  paths?: string[];
};

type WorkflowDefinition = {
  on?: {
    workflow_dispatch?: unknown;
    pull_request?: WorkflowTriggerWithPaths;
    push?: WorkflowTriggerWithPaths;
  };
  permissions?: Record<string, unknown>;
  jobs?: Record<string, WorkflowJob>;
};

export type VeyEcosystemWorkflowCheckResult = {
  ok: boolean;
  workflowPath: string;
  jobs: string[];
  errors: string[];
};

function readWorkflow(path: string): { value?: WorkflowDefinition; errors: string[] } {
  if (!existsSync(path)) return { errors: [`missing-workflow:${path}`] };

  try {
    return { value: parseYaml(readFileSync(path, 'utf8')) as WorkflowDefinition, errors: [] };
  } catch (error) {
    return { errors: [`invalid-workflow-yaml:${error instanceof Error ? error.message : String(error)}`] };
  }
}

function runCommands(job: WorkflowJob | undefined) {
  return job?.steps?.map(step => step.run).filter((run): run is string => Boolean(run)) ?? [];
}

function hasUses(job: WorkflowJob | undefined, uses: string) {
  return job?.steps?.some(step => step.uses === uses) ?? false;
}

function hasSetupNode(job: WorkflowJob | undefined) {
  return job?.steps?.some(step => (
    step.uses === 'actions/setup-node@v4' &&
    step.with?.['node-version'] === NODE_VERSION &&
    step.with?.cache === 'npm'
  )) ?? false;
}

function includesAll<T>(actual: T[] | undefined, expected: T[]) {
  return expected.every(value => actual?.includes(value));
}

export function verifyVeyEcosystemWorkflow(root = process.cwd()): VeyEcosystemWorkflowCheckResult {
  const workflowPath = join(root, WORKFLOW_PATH);
  const workflowRead = readWorkflow(workflowPath);
  const workflow = workflowRead.value;
  const errors = [...workflowRead.errors];
  const jobs = Object.keys(workflow?.jobs ?? {});
  const ecosystemJob = workflow?.jobs?.['vey-ecosystem-registry'];
  const ecosystemRuns = runCommands(ecosystemJob);

  if (workflow) {
    if (workflow.on?.workflow_dispatch === undefined) errors.push('missing-workflow-dispatch-trigger');
    if (workflow.on?.pull_request === undefined) errors.push('missing-pull-request-trigger');
    if (!includesAll(workflow.on?.push?.branches, ['main', 'master'])) errors.push('push-branches-missing-main-master');
    if (workflow.permissions?.contents !== 'read' || Object.keys(workflow.permissions ?? {}).length !== 1) {
      errors.push('workflow-permissions-not-read-only');
    }
    if (!includesAll(workflow.on?.pull_request?.paths, EXPECTED_PATHS)) {
      errors.push('pull-request-paths-missing-vey-ecosystem-inputs');
    }
    if (!includesAll(workflow.on?.push?.paths, EXPECTED_PATHS)) {
      errors.push('push-paths-missing-vey-ecosystem-inputs');
    }
  }

  if (!ecosystemJob) errors.push('missing-vey-ecosystem-registry-job');
  if (ecosystemJob?.['runs-on'] !== 'ubuntu-latest') errors.push('vey-ecosystem-registry:runner-not-ubuntu-latest');
  if (ecosystemJob?.['timeout-minutes'] !== 8) errors.push('vey-ecosystem-registry:timeout-mismatch');
  if (!hasUses(ecosystemJob, 'actions/checkout@v4')) errors.push('vey-ecosystem-registry:missing-checkout-v4');
  if (!hasSetupNode(ecosystemJob)) errors.push('vey-ecosystem-registry:missing-node-22-npm-cache');
  if (!ecosystemRuns.includes('npm ci')) errors.push('vey-ecosystem-registry:missing-npm-ci');
  if (!ecosystemRuns.includes(VEY_ECOSYSTEM_GATE)) errors.push('vey-ecosystem-registry:missing-vey-ecosystem-gate');
  if (!ecosystemRuns.includes(WORKFLOW_GATE)) errors.push('vey-ecosystem-registry:missing-workflow-gate');

  return {
    ok: errors.length === 0,
    workflowPath,
    jobs,
    errors,
  };
}

function main() {
  const result = verifyVeyEcosystemWorkflow();

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`[verify-vey-ecosystem-workflow] status=${result.ok ? 'pass' : 'fail'}`);
    console.log(`workflowPath=${result.workflowPath}`);
    console.log(`jobs=${result.jobs.join(',')}`);
    for (const error of result.errors) console.error(`error=${error}`);
  }

  if (!result.ok) process.exitCode = 1;
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  main();
}

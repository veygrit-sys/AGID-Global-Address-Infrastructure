import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const WORKFLOW_PATH = join('.github', 'workflows', 'address-information-engineering-foundations.yml');
const FOUNDATIONS_GATE = 'npm run verify:address-information-engineering-foundations';
const WORKFLOW_GATE = 'npm run verify:address-information-engineering-foundations-workflow';
const NODE_VERSION = '22';
const EXPECTED_PATHS = [
  'docs/research/address-information-engineering-foundations-for-address-research-ja.md',
  'src/lib/addressInformationEngineeringFoundations.ts',
  'src/lib/addressInformationEngineeringFoundations.test.ts',
  'scripts/verify-address-information-engineering-foundations-workflow.ts',
  'package.json',
  'package-lock.json',
  '.github/workflows/address-information-engineering-foundations.yml',
];

type WorkflowStep = {
  name?: string;
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

export type AddressInformationEngineeringFoundationsWorkflowCheckResult = {
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

function hasRun(job: WorkflowJob | undefined, run: string) {
  return runCommands(job).includes(run);
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

function validateWorkflowHardening(workflow: WorkflowDefinition | undefined) {
  const errors: string[] = [];

  if (!workflow) return errors;
  if (workflow.permissions?.contents !== 'read' || Object.keys(workflow.permissions ?? {}).length !== 1) {
    errors.push('workflow-permissions-not-read-only');
  }

  return errors;
}

function validateJobHardening(job: WorkflowJob | undefined, jobId: string, expectedTimeoutMinutes: number) {
  const errors: string[] = [];

  if (!job) return errors;
  if (job['runs-on'] !== 'ubuntu-latest') errors.push(`${jobId}:runner-not-ubuntu-latest`);
  if (job['timeout-minutes'] !== expectedTimeoutMinutes) errors.push(`${jobId}:timeout-mismatch`);
  if (!hasUses(job, 'actions/checkout@v4')) errors.push(`${jobId}:missing-checkout-v4`);
  if (!hasSetupNode(job)) errors.push(`${jobId}:missing-node-22-npm-cache`);
  if (!hasRun(job, 'npm ci')) errors.push(`${jobId}:missing-npm-ci`);

  return errors;
}

function validatePathFilters(workflow: WorkflowDefinition | undefined) {
  const errors: string[] = [];

  if (!workflow) return errors;
  if (!includesAll(workflow.on?.pull_request?.paths, EXPECTED_PATHS)) {
    errors.push('pull-request-paths-missing-foundation-inputs');
  }
  if (!includesAll(workflow.on?.push?.paths, EXPECTED_PATHS)) {
    errors.push('push-paths-missing-foundation-inputs');
  }

  return errors;
}

export function verifyAddressInformationEngineeringFoundationsWorkflow(
  root = process.cwd(),
): AddressInformationEngineeringFoundationsWorkflowCheckResult {
  const workflowPath = join(root, WORKFLOW_PATH);
  const workflowRead = readWorkflow(workflowPath);
  const workflow = workflowRead.value;
  const errors = [...workflowRead.errors];
  const jobs = Object.keys(workflow?.jobs ?? {});
  const foundationsJob = workflow?.jobs?.['foundations-registry'];
  const foundationsRuns = runCommands(foundationsJob);

  if (workflow) {
    if (workflow.on?.workflow_dispatch === undefined) errors.push('missing-workflow-dispatch-trigger');
    if (workflow.on?.pull_request === undefined) errors.push('missing-pull-request-trigger');
    if (!includesAll(workflow.on?.push?.branches, ['main', 'master'])) errors.push('push-branches-missing-main-master');
    errors.push(...validateWorkflowHardening(workflow));
    errors.push(...validatePathFilters(workflow));
  }

  if (!foundationsJob) errors.push('missing-foundations-registry-job');
  errors.push(...validateJobHardening(foundationsJob, 'foundations-registry', 8));
  if (!foundationsRuns.includes(FOUNDATIONS_GATE)) errors.push('foundations-job-missing-foundations-gate');
  if (!foundationsRuns.includes(WORKFLOW_GATE)) errors.push('foundations-job-missing-workflow-gate');

  return {
    ok: errors.length === 0,
    workflowPath,
    jobs,
    errors,
  };
}

function main() {
  const result = verifyAddressInformationEngineeringFoundationsWorkflow();

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`[verify-address-information-engineering-foundations-workflow] status=${result.ok ? 'pass' : 'fail'}`);
    console.log(`workflowPath=${result.workflowPath}`);
    console.log(`jobs=${result.jobs.join(',')}`);
    for (const error of result.errors) console.error(`error=${error}`);
  }

  if (!result.ok) process.exitCode = 1;
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  main();
}


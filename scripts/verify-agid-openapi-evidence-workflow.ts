import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const WORKFLOW_PATH = join('.github', 'workflows', 'agid-openapi-evidence.yml');
const LIGHTWEIGHT_GATE = 'npm run verify:agid-openapi-evidence-extensions';
const LINKED_GATE = 'npm run verify:agid-openapi-evidence-extensions:linked';
const NODE_VERSION = '22';

type WorkflowStep = {
  name?: string;
  run?: string;
  uses?: string;
  with?: Record<string, unknown>;
};

type WorkflowJob = {
  if?: string;
  'runs-on'?: string;
  'timeout-minutes'?: number;
  steps?: WorkflowStep[];
};

type WorkflowDefinition = {
  on?: {
    workflow_dispatch?: unknown;
    pull_request?: unknown;
    push?: { branches?: string[] };
    schedule?: Array<{ cron?: string }>;
  };
  permissions?: Record<string, unknown>;
  jobs?: Record<string, WorkflowJob>;
};

export type AgidOpenApiEvidenceWorkflowCheckResult = {
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

export function verifyAgidOpenApiEvidenceWorkflow(root = process.cwd()): AgidOpenApiEvidenceWorkflowCheckResult {
  const workflowPath = join(root, WORKFLOW_PATH);
  const workflowRead = readWorkflow(workflowPath);
  const workflow = workflowRead.value;
  const errors = [...workflowRead.errors];
  const jobs = Object.keys(workflow?.jobs ?? {});
  const scanJob = workflow?.jobs?.['evidence-extension-scan'];
  const linkedJob = workflow?.jobs?.['linked-evidence-verifiers'];
  const scanRuns = runCommands(scanJob);
  const linkedRuns = runCommands(linkedJob);

  if (workflow) {
    if (workflow.on?.workflow_dispatch === undefined) errors.push('missing-workflow-dispatch-trigger');
    if (workflow.on?.pull_request === undefined) errors.push('missing-pull-request-trigger');
    if (!includesAll(workflow.on?.push?.branches, ['main', 'master'])) errors.push('push-branches-missing-main-master');
    if (!workflow.on?.schedule?.some(entry => entry.cron === '27 3 * * *')) errors.push('missing-nightly-schedule');
    errors.push(...validateWorkflowHardening(workflow));
  }

  if (!scanJob) errors.push('missing-evidence-extension-scan-job');
  if (!linkedJob) errors.push('missing-linked-evidence-verifiers-job');
  errors.push(...validateJobHardening(scanJob, 'evidence-extension-scan', 10));
  errors.push(...validateJobHardening(linkedJob, 'linked-evidence-verifiers', 12));
  if (linkedJob?.if !== "github.event_name != 'pull_request'") errors.push('linked-job-not-disabled-on-pull-request');
  if (!scanRuns.includes(LIGHTWEIGHT_GATE)) errors.push('scan-job-missing-lightweight-gate');
  if (scanRuns.includes(LINKED_GATE)) errors.push('scan-job-must-not-run-linked-gate');
  if (!linkedRuns.includes(LINKED_GATE)) errors.push('linked-job-missing-linked-gate');

  return {
    ok: errors.length === 0,
    workflowPath,
    jobs,
    errors,
  };
}

function main() {
  const result = verifyAgidOpenApiEvidenceWorkflow();

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`[verify-agid-openapi-evidence-workflow] status=${result.ok ? 'pass' : 'fail'}`);
    console.log(`workflowPath=${result.workflowPath}`);
    console.log(`jobs=${result.jobs.join(',')}`);
    for (const error of result.errors) console.error(`error=${error}`);
  }

  if (!result.ok) process.exitCode = 1;
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  main();
}

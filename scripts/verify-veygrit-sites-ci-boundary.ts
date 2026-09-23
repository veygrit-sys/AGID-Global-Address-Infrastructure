import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  buildVeygritSitesBridge,
  validateVeygritSitesBridge,
} from '../src/lib/veygritSitesBridge';

type Finding = {
  file: string;
  ruleId: string;
};

export const VEYGRIT_SITES_MULTI_SOURCE_PRESAVE_MARKER = 'veygrit-sites-presave: multi-source';

const PRESAVE_COMMAND_PATTERN = /verify:veygrit-sites-presave/;
const MULTI_SOURCE_MARKER_PATTERN = /veygrit-sites-presave:\s*multi-source/i;
const MULTI_SOURCE_ENV_PATTERN = /VEYGRIT_SITES_PRESAVE_MULTI_SOURCE\s*:\s*['"]?true['"]?/i;
const SITES_SOURCE_ROOT_ENV_PATTERN = /VEYGRIT_SITES_SOURCE_ROOT\s*:/i;
const PROHIBITED_REMOTE_MUTATION_PATTERN =
  /\b(?:git\s+push|gh\s+pr\s+create|gh\s+repo\s+create|create_site|sites\s+(?:save|deploy)|npm\s+run\s+deploy|vercel\s+--prod)\b/i;

const root = process.cwd();
const workflowRoot = join(root, '.github', 'workflows');
const fixtureRoot = join(root, 'docs', 'specs', 'fixtures', 'veygrit-sites-ci-boundary');
const docsPath = join(root, 'docs', 'product', 'veygrit-sites-codex-link.md');
const packageJsonPath = join(root, 'package.json');
const fixtureExpectations: Array<{ file: string; allowed: boolean }> = [
  { file: 'allowed-multi-source-presave.yml', allowed: true },
  { file: 'blocked-missing-source-root.yml', allowed: false },
  { file: 'blocked-persisted-credentials.yml', allowed: false },
  { file: 'blocked-remote-mutation.yml', allowed: false },
  { file: 'blocked-unmarked-presave.yml', allowed: false },
];

export function workflowReferencesVeygritSitesPresave(workflow: string): boolean {
  return PRESAVE_COMMAND_PATTERN.test(workflow);
}

export function workflowCheckoutsDisablePersistedCredentials(workflow: string): boolean {
  const lines = workflow.split(/\r?\n/);
  let checkoutCount = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const checkoutMatch = lines[index].match(/^(\s*)-\s+uses:\s*actions\/checkout@/i);
    if (!checkoutMatch) continue;

    checkoutCount += 1;
    const stepIndent = checkoutMatch[1].length;
    const block: string[] = [lines[index]];

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const nextStep = lines[cursor].match(/^(\s*)-\s+/);
      if (nextStep && nextStep[1].length <= stepIndent) break;
      block.push(lines[cursor]);
    }

    if (!/persist-credentials\s*:\s*false/i.test(block.join('\n'))) return false;
  }

  return checkoutCount > 0;
}

export function workflowAllowsVeygritSitesPresave(workflow: string): boolean {
  if (!workflowReferencesVeygritSitesPresave(workflow)) return false;
  return (
    MULTI_SOURCE_MARKER_PATTERN.test(workflow) &&
    MULTI_SOURCE_ENV_PATTERN.test(workflow) &&
    SITES_SOURCE_ROOT_ENV_PATTERN.test(workflow) &&
    workflowCheckoutsDisablePersistedCredentials(workflow) &&
    !PROHIBITED_REMOTE_MUTATION_PATTERN.test(workflow)
  );
}

function reportPath(path: string): string {
  return relative(root, path).split(sep).join('/');
}

function collectWorkflowFiles(): string[] {
  if (!existsSync(workflowRoot)) return [];
  return readdirSync(workflowRoot, { withFileTypes: true })
    .filter(entry => entry.isFile() && /\.(?:ya?ml)$/i.test(entry.name))
    .map(entry => join(workflowRoot, entry.name))
    .sort();
}

function main() {
  const bridge = buildVeygritSitesBridge();
  const validation = validateVeygritSitesBridge(bridge);
  const findings: Finding[] = [];

  if (!validation.ok) {
    findings.push(...validation.errors.map(ruleId => ({ file: 'src/lib/veygritSitesBridge.ts', ruleId })));
  }

  if (!existsSync(docsPath)) {
    findings.push({ file: reportPath(docsPath), ruleId: 'missing-veygrit-sites-link-doc' });
  } else {
    const docs = readFileSync(docsPath, 'utf8');
    const requiredPatterns: Array<[string, RegExp]> = [
      ['missing-ci-actions-note', /CI \/ GitHub Actions Note/],
      ['missing-required-local-presave-copy', /required local pre-save check/],
      ['missing-linked-sites-source-condition', /linked Sites app source at (?:the )?bridge `codexThread\.localRoot`\s+path/],
      ['missing-no-remote-mutation-copy', /must not push, open pull requests, save Sites\s+versions, deploy production/],
      ['missing-local-transcript-requirement', /require a local `verify:veygrit-sites-presave` transcript/],
      ['missing-multi-source-marker-doc', /veygrit-sites-presave:\s*multi-source/],
      ['missing-multi-source-env-doc', /VEYGRIT_SITES_PRESAVE_MULTI_SOURCE/],
      ['missing-sites-source-root-env-doc', /VEYGRIT_SITES_SOURCE_ROOT/],
      ['missing-ci-boundary-fixture-doc', /docs\/specs\/fixtures\/veygrit-sites-ci-boundary/],
    ];

    for (const [ruleId, pattern] of requiredPatterns) {
      if (!pattern.test(docs)) findings.push({ file: reportPath(docsPath), ruleId });
    }
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    scripts?: Record<string, string>;
  };

  if (
    packageJson.scripts?.['verify:veygrit-sites-ci-boundary'] !==
    'tsx scripts/run-veygrit-sites-ci-boundary.ts'
  ) {
    findings.push({ file: 'package.json', ruleId: 'missing-ci-boundary-package-script' });
  }

  if (!bridge.validationGates.includes('npm run verify:veygrit-sites-ci-boundary')) {
    findings.push({ file: 'src/lib/veygritSitesBridge.ts', ruleId: 'missing-ci-boundary-validation-gate' });
  }

  if (!bridge.warnings.some(warning => /pre-save aggregate gate is local-only/i.test(warning))) {
    findings.push({ file: 'src/lib/veygritSitesBridge.ts', ruleId: 'missing-local-presave-warning' });
  }

  for (const fixture of fixtureExpectations) {
    const fixturePath = join(fixtureRoot, fixture.file);
    if (!existsSync(fixturePath)) {
      findings.push({ file: reportPath(fixturePath), ruleId: 'missing-ci-boundary-fixture' });
      continue;
    }

    const workflow = readFileSync(fixturePath, 'utf8');
    const allowed = workflowAllowsVeygritSitesPresave(workflow);
    if (allowed !== fixture.allowed) {
      findings.push({
        file: reportPath(fixturePath),
        ruleId: fixture.allowed ? 'allowed-ci-boundary-fixture-rejected' : 'blocked-ci-boundary-fixture-allowed',
      });
    }
  }

  const workflowFiles = collectWorkflowFiles();
  let presaveWorkflowReferences = 0;
  let allowedPresaveWorkflowReferences = 0;
  for (const workflowFile of workflowFiles) {
    const workflow = readFileSync(workflowFile, 'utf8');
    if (workflowReferencesVeygritSitesPresave(workflow)) {
      presaveWorkflowReferences += 1;
    }
    if (workflowReferencesVeygritSitesPresave(workflow) && workflowAllowsVeygritSitesPresave(workflow)) {
      allowedPresaveWorkflowReferences += 1;
    }
    if (workflowReferencesVeygritSitesPresave(workflow) && !workflowAllowsVeygritSitesPresave(workflow)) {
      findings.push({
        file: reportPath(workflowFile),
        ruleId: 'workflow-must-not-call-local-sites-presave-without-marked-multi-source',
      });
    }
  }

  const findingsByRule = findings.reduce<Record<string, number>>((counts, finding) => {
    counts[finding.ruleId] = (counts[finding.ruleId] ?? 0) + 1;
    return counts;
  }, {});

  if (findings.length > 0) {
    console.error(JSON.stringify({
      status: 'blocked',
      verifier: 'verify-veygrit-sites-ci-boundary',
      checkedWorkflowFiles: workflowFiles.map(reportPath),
      checkedFixtureFiles: fixtureExpectations.map(fixture => reportPath(join(fixtureRoot, fixture.file))),
      findingsByRule,
      remediation:
        'Keep verify:veygrit-sites-presave as a required local transcript unless CI is explicitly marked as a multi-source, no-remote-mutation workflow.',
    }));
    process.exit(1);
  }

  console.log(JSON.stringify({
    status: 'pass',
    verifier: 'verify-veygrit-sites-ci-boundary',
    checkedWorkflowFiles: workflowFiles.map(reportPath),
    checkedFixtureFiles: fixtureExpectations.map(fixture => reportPath(join(fixtureRoot, fixture.file))),
    presaveWorkflowReferences,
    allowedPresaveWorkflowReferences,
    requiredLocalPresaveCheck: true,
    multiSourcePresaveMarker: VEYGRIT_SITES_MULTI_SOURCE_PRESAVE_MARKER,
    remoteMutationAllowedThisTurn: bridge.githubConnection.remoteMutationAllowedThisTurn,
    productionDeployRequiresExplicitApproval: bridge.safetyBoundaries.productionDeployRequiresExplicitApproval,
  }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

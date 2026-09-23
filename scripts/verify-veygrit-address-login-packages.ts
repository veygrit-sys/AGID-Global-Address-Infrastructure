import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  buildVeygritIdAddressLoginPlan,
  validateVeygritIdAddressLoginPlan,
} from '../src/lib/veygritIdAddressLoginPlan';

type PackageManifest = {
  name: string;
  packagePath: string;
  runtime: string;
  entrypoints: string[];
  readme: string;
  examples: string[];
  verifyCommand: string;
  publishReadiness: string;
  publicSurfaces: string[];
  safetyControls: string[];
};

type IntegrationContract = {
  name: string;
  reactExample: string;
  nextjsRoute: string;
  testCoverage: string[];
};

type Manifest = {
  version: string;
  status: string;
  packages: PackageManifest[];
  integrationContracts: IntegrationContract[];
};

const root = process.cwd();
const shouldReportCommitCandidates = process.argv.includes('--report-commit-candidates');
const shouldReportCommitSummary = process.argv.includes('--report-commit-summary');
const shouldReportStagePlan = process.argv.includes('--report-stage-plan');
const shouldReportDiffScope = process.argv.includes('--report-diff-scope');
const shouldReportGithubUpdateMemo = process.argv.includes('--report-github-update-memo');
const shouldReportFinalLocalCheck = process.argv.includes('--report-final-local-check');
const manifestPath = join(root, 'sdk/veygrit-address-login-packages.manifest.json');
const productPlanPath = 'docs/product/veygrit-id-address-login-plan.md';
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
const rootPackageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  scripts?: Record<string, string>;
};

const errors: string[] = [];
const requiredSharedSafetyControls = [
  'no-raw-address-material',
  'no-recipient-material',
  'no-witness-material',
  'no-private-key-material',
  'no-proof-secret-material',
  'no-production-credentials',
];
const expectedCommitCandidatePaths = [
  'docs/product/veygrit-id-address-login-plan.md',
  'src/lib/veygritIdAddressLoginPlan.ts',
  'src/lib/veygritIdAddressLoginPlan.test.ts',
  'scripts/verify-veygrit-address-login-test-helpers.ts',
  'scripts/verify-veygrit-address-login-packages.ts',
  'sdk/veygrit-address-login-test-helpers/README.md',
  'sdk/veygrit-address-login-test-helpers/hostedCallbackValidationVectors.ts',
  'sdk/veygrit-address-login-test-helpers/merchantVisibleRedactionFixtures.ts',
  'sdk/veygrit-address-login-react/README.md',
  'sdk/veygrit-address-login-nextjs/README.md',
];
const excludedRootFiles = ['package.json'];
const highConfidenceSecretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:sk|pk)_live_[A-Za-z0-9]{16,}\b/,
  /\bgh[opsu]_[A-Za-z0-9_]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    errors.push(message);
  }
}

function pathExists(relativePath: string): boolean {
  return existsSync(join(root, relativePath));
}

function readPackageJson(packagePath: string): { name?: string; scripts?: Record<string, string>; files?: string[] } {
  return JSON.parse(readFileSync(join(root, packagePath, 'package.json'), 'utf8')) as {
    name?: string;
    scripts?: Record<string, string>;
    files?: string[];
  };
}

function readText(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8');
}

function gitOutput(args: string[]): string {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    shell: false,
  });

  if (result.error) {
    errors.push(`git-error:${result.error.message}`);
    return '';
  }

  if (result.status !== 0) {
    errors.push(`git-failed:${args.join(' ')}:${result.stderr.trim()}`);
    return '';
  }

  return result.stdout;
}

assert(manifest.version === '0.1.0', 'manifest version must remain explicit at 0.1.0');
assert(manifest.status === 'oss-prep-local', 'manifest status must stay local until release gates exist');
assert(Array.isArray(manifest.packages) && manifest.packages.length === 2, 'manifest must describe the React and Next.js packages');
assert(pathExists(productPlanPath), 'Veygrit ID Address Login product plan must exist');
assert(
  rootPackageJson.scripts?.['verify:address-login-spec']?.includes('src/lib/veygritIdAddressLoginPlan.test.ts') === true,
  'verify:address-login-spec must include the Veygrit ID Address Login product plan test',
);

const productPlanText = pathExists(productPlanPath) ? readFileSync(join(root, productPlanPath), 'utf8') : '';
assert(productPlanText.includes('sdk/veygrit-address-login-packages.manifest.json'), 'product plan must link the package manifest');
assert(productPlanText.includes('npm run verify:veygrit-address-login-packages'), 'product plan must document the package manifest verifier');
assert(productPlanText.includes('@veygrit/address-login-react'), 'product plan must name the React SDK package');
assert(productPlanText.includes('@veygrit/address-login-nextjs'), 'product plan must name the Next.js SDK package');
assert(/does not claim production readiness/i.test(productPlanText), 'product plan must keep package readiness as a non-production claim');
assert(productPlanText.includes('The two SDK README entries are part of this traceability set'), 'product plan must explain why SDK README files are commit candidates');
assert(productPlanText.includes('shared SDK callback test helper'), 'product plan must explain why the shared callback helper is a commit candidate');
assert(productPlanText.includes('shared SDK test-helper README'), 'product plan must explain why the helper README is a commit candidate');
assert(/merchant-visible redaction\s+fixture helper/.test(productPlanText), 'product plan must explain why the redaction fixture helper is a commit candidate');
assert(productPlanText.includes('npm run verify:veygrit-address-login-test-helpers'), 'product plan must document the helper verifier');
assert(productPlanText.includes('package-specific gate first'), 'product plan must document SDK README verification order');
assert(productPlanText.includes('cross-package traceability preflight second'), 'product plan must document the cross-package preflight order');
assert(productPlanText.includes('--report-commit-candidates'), 'product plan must document the commit candidate report flag');
assert(productPlanText.includes('--report-commit-summary'), 'product plan must document the human commit summary report flag');
assert(productPlanText.includes('--report-stage-plan'), 'product plan must document the dry-run stage plan report flag');
assert(productPlanText.includes('--report-diff-scope'), 'product plan must document the diff scope report flag');
assert(productPlanText.includes('--report-github-update-memo'), 'product plan must document the GitHub update memo report flag');
assert(productPlanText.includes('--report-final-local-check'), 'product plan must document the final local check report flag');
assert(productPlanText.includes('excluded root file statuses'), 'product plan must document excluded root file statuses');
assert(productPlanText.includes('GitHub Update Preflight copy'), 'product plan must include GitHub update preflight copy');
assert(productPlanText.includes('It does not stage'), 'product plan must say the GitHub preflight is non-mutating');

const plan = buildVeygritIdAddressLoginPlan();
const planErrors = validateVeygritIdAddressLoginPlan(plan);
assert(planErrors.length === 0, `product plan model must validate: ${planErrors.join(', ')}`);
assert(plan.implementationTraceability.productPlanPath === productPlanPath, 'traceability product plan path must match verifier');
assert(plan.implementationTraceability.packageManifestPath === 'sdk/veygrit-address-login-packages.manifest.json', 'traceability package manifest path must match verifier');
assert(plan.implementationTraceability.packageVerifierCommand === 'npm run verify:veygrit-address-login-packages', 'traceability package verifier command must match verifier');
assert(plan.implementationTraceability.aggregateVerifierCommand === 'npm run verify:address-login-spec', 'traceability aggregate verifier command must match package.json');
assert(plan.implementationTraceability.publishReadinessClaim === 'oss-prep-local-not-production-ready', 'traceability readiness claim must stay non-production');
assert(rootPackageJson.scripts?.['verify:veygrit-address-login-test-helpers'] === 'tsx scripts/verify-veygrit-address-login-test-helpers.ts', 'root package.json must expose the helper verifier');
assert(!plan.implementationTraceability.commitCandidatePaths.includes('package.json'), 'commit candidates must not include the mixed root package.json');
for (const excludedRootFile of excludedRootFiles) {
  assert(!plan.implementationTraceability.commitCandidatePaths.includes(excludedRootFile), `commit candidates must not include excluded root file: ${excludedRootFile}`);
}
assert(plan.implementationTraceability.githubUpdatePreflightCommands.includes('npx tsx scripts/verify-veygrit-address-login-packages.ts --report-commit-candidates'), 'traceability must include the commit candidate report command');
assert(plan.implementationTraceability.githubUpdatePreflightCommands.includes('npx tsx scripts/verify-veygrit-address-login-packages.ts --report-commit-summary'), 'traceability must include the human summary report command');
assert(plan.implementationTraceability.githubUpdatePreflightCommands.includes('npx tsx scripts/verify-veygrit-address-login-packages.ts --report-stage-plan'), 'traceability must include the dry-run stage plan command');
assert(plan.implementationTraceability.githubUpdatePreflightCommands.includes('npx tsx scripts/verify-veygrit-address-login-packages.ts --report-diff-scope'), 'traceability must include the diff scope report command');
assert(plan.implementationTraceability.githubUpdatePreflightCommands.includes('npx tsx scripts/verify-veygrit-address-login-packages.ts --report-github-update-memo'), 'traceability must include the GitHub update memo report command');
assert(plan.implementationTraceability.githubUpdatePreflightCommands.includes('npx tsx scripts/verify-veygrit-address-login-packages.ts --report-final-local-check'), 'traceability must include the final local check report command');

for (const expectedPath of expectedCommitCandidatePaths) {
  assert(plan.implementationTraceability.commitCandidatePaths.includes(expectedPath), `traceability missing commit candidate: ${expectedPath}`);
}

for (const candidatePath of plan.implementationTraceability.commitCandidatePaths) {
  assert(expectedCommitCandidatePaths.includes(candidatePath), `traceability has unexpected commit candidate: ${candidatePath}`);
  assert(!candidatePath.startsWith('../') && !candidatePath.includes('/../'), `commit candidate must stay inside repo: ${candidatePath}`);
  assert(pathExists(candidatePath), `commit candidate path must exist: ${candidatePath}`);

  if (pathExists(candidatePath)) {
    const candidateText = readText(candidatePath);
    for (const pattern of highConfidenceSecretPatterns) {
      assert(!pattern.test(candidateText), `commit candidate contains secret-looking material: ${candidatePath}:${pattern}`);
    }
  }
}

const candidateStatus = gitOutput(['status', '--short', '--', ...plan.implementationTraceability.commitCandidatePaths]);
const candidateGitStatusByPath = new Map<string, string>();
for (const line of candidateStatus.split('\n').filter(Boolean)) {
  const statusPath = line.slice(3).replace(/\\/g, '/');
  candidateGitStatusByPath.set(statusPath, line.slice(0, 2).trim() || 'clean');
  assert(plan.implementationTraceability.commitCandidatePaths.includes(statusPath), `git status returned non-candidate path: ${statusPath}`);
}

function commitCandidateStatus(candidatePath: string): string {
  return candidateGitStatusByPath.get(candidatePath) ?? 'clean';
}

const excludedRootStatus = gitOutput(['status', '--short', '--', ...excludedRootFiles]);
const excludedRootGitStatusByPath = new Map<string, string>();
for (const line of excludedRootStatus.split('\n').filter(Boolean)) {
  const statusPath = line.slice(3).replace(/\\/g, '/');
  excludedRootGitStatusByPath.set(statusPath, line.slice(0, 2).trim() || 'clean');
  assert(excludedRootFiles.includes(statusPath), `git status returned non-excluded root path: ${statusPath}`);
}

function excludedRootFileStatus(filePath: string): string {
  return excludedRootGitStatusByPath.get(filePath) ?? 'clean';
}

function buildExcludedRootFileReports(): Array<{
  path: string;
  gitStatus: string;
  excludedFromCommitCandidates: true;
}> {
  return excludedRootFiles.map(filePath => ({
    path: filePath,
    gitStatus: excludedRootFileStatus(filePath),
    excludedFromCommitCandidates: true,
  }));
}

function buildExcludedRootStatusSummary(): string {
  const dirtyReports = buildExcludedRootFileReports().filter(report => report.gitStatus !== 'clean');
  if (dirtyReports.length === 0) {
    return `Excluded root files are clean: ${excludedRootFiles.join(', ')}.`;
  }

  return `Excluded root files currently outside this bundle: ${dirtyReports.map(report => `${report.path} (${report.gitStatus})`).join(', ')}.`;
}

function buildCommitCandidateSummary(): string {
  const paths = plan.implementationTraceability.commitCandidatePaths;
  const modifiedCount = paths.filter(candidatePath => commitCandidateStatus(candidatePath) === 'M').length;
  const untrackedCount = paths.filter(candidatePath => commitCandidateStatus(candidatePath) === '??').length;
  const cleanCount = paths.length - modifiedCount - untrackedCount;
  return [
    `Veygrit Address Login GitHub update preflight has ${paths.length} commit candidates`,
    `(${modifiedCount} modified, ${untrackedCount} untracked, ${cleanCount} clean)`,
    `under docs/product, src/lib, scripts, and sdk; package.json is intentionally excluded`,
    `because the root workspace can carry unrelated script changes.`,
    `The shared SDK callback and merchant-visible redaction fixture helpers are included because callbackValidationVectors and merchant-visible refs drive both React and Next.js parser conformance.`,
    buildExcludedRootStatusSummary(),
    `Run npm run verify:veygrit-address-login-test-helpers, ${plan.implementationTraceability.packageVerifierCommand},`,
    `npx tsx scripts/verify-veygrit-address-login-packages.ts --report-commit-candidates,`,
    `and npx tsx --test src/lib/veygritIdAddressLoginPlan.test.ts before any stage, commit, push, PR, or repository action;`,
    `readiness remains ${plan.implementationTraceability.publishReadinessClaim}.`,
  ].join(' ');
}

function buildDryRunStagePlan(): {
  dryRunOnly: true;
  command: string;
  candidatePaths: string[];
  excludedRootFiles: string[];
  excludedRootFileStatuses: ReturnType<typeof buildExcludedRootFileReports>;
  summary: string;
} {
  const candidatePaths = plan.implementationTraceability.commitCandidatePaths;
  return {
    dryRunOnly: true,
    command: `git add -- ${candidatePaths.join(' ')}`,
    candidatePaths,
    excludedRootFiles,
    excludedRootFileStatuses: buildExcludedRootFileReports(),
    summary: `Dry-run stage plan includes ${candidatePaths.length} Veygrit Address Login paths and excludes package.json; it does not run git add.`,
  };
}

function countLines(text: string): number {
  if (text.length === 0) return 0;
  return text.split(/\r\n|\n|\r/).length;
}

function buildDiffScopeReport(): {
  noPatchContent: true;
  excludedRootFiles: string[];
  excludedRootFileStatuses: ReturnType<typeof buildExcludedRootFileReports>;
  summary: string;
  files: Array<{
    path: string;
    gitStatus: string;
    addedLines: number | null;
    deletedLines: number | null;
    untrackedLines: number | null;
  }>;
} {
  const numstatByPath = new Map<string, { addedLines: number | null; deletedLines: number | null }>();
  const numstat = gitOutput(['diff', '--numstat', '--', ...plan.implementationTraceability.commitCandidatePaths]);

  for (const line of numstat.split('\n').filter(Boolean)) {
    const [addedText, deletedText, filePath] = line.split('\t');
    if (!filePath) continue;
    numstatByPath.set(filePath.replace(/\\/g, '/'), {
      addedLines: addedText === '-' ? null : Number(addedText),
      deletedLines: deletedText === '-' ? null : Number(deletedText),
    });
  }

  const files = plan.implementationTraceability.commitCandidatePaths.map(candidatePath => {
    const status = commitCandidateStatus(candidatePath);
    const trackedStats = numstatByPath.get(candidatePath);
    const untrackedLines = status === '??' && pathExists(candidatePath) ? countLines(readText(candidatePath)) : null;

    return {
      path: candidatePath,
      gitStatus: status,
      addedLines: trackedStats?.addedLines ?? null,
      deletedLines: trackedStats?.deletedLines ?? null,
      untrackedLines,
    };
  });

  const trackedFiles = files.filter(file => file.gitStatus !== '??').length;
  const untrackedFiles = files.filter(file => file.gitStatus === '??').length;

  return {
    noPatchContent: true,
    excludedRootFiles,
    excludedRootFileStatuses: buildExcludedRootFileReports(),
    summary: `Diff scope covers ${files.length} Veygrit Address Login candidate paths (${trackedFiles} tracked, ${untrackedFiles} untracked) and excludes package.json; it reports line counts only, not patch content.`,
    files,
  };
}

function buildGithubUpdateMemo(): string {
  const diffScope = buildDiffScopeReport();
  return [
    'GitHub update memo: Veygrit Address Login is ready for local review as an OSS-prep-only preflight bundle.',
    diffScope.summary,
    buildDryRunStagePlan().summary,
    buildExcludedRootStatusSummary(),
    `Required local gates are npm run verify:veygrit-address-login-test-helpers, ${plan.implementationTraceability.packageVerifierCommand},`,
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-commit-candidates,',
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-stage-plan,',
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-diff-scope,',
    'and npx tsx --test src/lib/veygritIdAddressLoginPlan.test.ts.',
    'Do not include package.json, raw address material, recipient material, witness material, private keys, proof secrets, or production credentials.',
    'This memo does not stage files, create commits, push branches, open PRs, or create/delete GitHub repositories.',
  ].join(' ');
}

function buildFinalLocalCheck(): {
  finalLocalCheck: true;
  nonMutating: true;
  requiresExplicitUserActionFor: string[];
  checkedByThisCommand: string[];
  stillRunBeforeManualStage: string[];
  candidateCount: number;
  excludedRootFiles: string[];
  excludedRootFileStatuses: ReturnType<typeof buildExcludedRootFileReports>;
  stagePlan: ReturnType<typeof buildDryRunStagePlan>;
  diffScope: ReturnType<typeof buildDiffScopeReport>;
  memo: string;
} {
  return {
    finalLocalCheck: true,
    nonMutating: true,
    requiresExplicitUserActionFor: [
      'staging candidate paths',
      'creating local commits',
      'pushing branches',
      'opening PRs',
      'creating or deleting GitHub repositories',
    ],
    checkedByThisCommand: [
      'package manifest exists and stays oss-prep-local',
      'product plan references the manifest, package gates, and non-production readiness',
      'implementation traceability model validates',
      'commit candidates exist, stay inside the repository, and exclude package.json',
      'commit candidates pass high-confidence secret-pattern checks',
      'shared SDK callback test helper is traced as test-only callback conformance evidence',
      'shared SDK test-helper README and merchant-visible redaction fixture helper are traced as test-only fixture evidence',
      'git status for the candidate set does not include non-candidate paths',
      'SDK README verification order names package-specific gate before cross-package preflight',
    ],
    stillRunBeforeManualStage: [
      'npx tsx --test src/lib/veygritIdAddressLoginPlan.test.ts',
    ],
    candidateCount: plan.implementationTraceability.commitCandidatePaths.length,
    excludedRootFiles,
    excludedRootFileStatuses: buildExcludedRootFileReports(),
    stagePlan: buildDryRunStagePlan(),
    diffScope: buildDiffScopeReport(),
    memo: buildGithubUpdateMemo(),
  };
}

const packageNames = new Set<string>();

for (const sdkPackage of manifest.packages ?? []) {
  packageNames.add(sdkPackage.name);

  assert(sdkPackage.packagePath.startsWith('sdk/veygrit-address-login-'), `${sdkPackage.name} must stay under sdk/veygrit-address-login-*`);
  assert(pathExists(sdkPackage.packagePath), `${sdkPackage.name} package path must exist`);
  assert(pathExists(`${sdkPackage.packagePath}/package.json`), `${sdkPackage.name} package.json must exist`);
  assert(pathExists(`${sdkPackage.packagePath}/${sdkPackage.readme}`), `${sdkPackage.name} README must exist`);
  assert(pathExists(`${sdkPackage.packagePath}/tsconfig.json`), `${sdkPackage.name} tsconfig must exist`);

  const packageJson = readPackageJson(sdkPackage.packagePath);
  const readmeText = readText(`${sdkPackage.packagePath}/${sdkPackage.readme}`);
  const helperGateIndex = readmeText.indexOf('npm run verify:veygrit-address-login-test-helpers');
  const packageSpecificGateIndex = readmeText.indexOf(sdkPackage.verifyCommand);
  const crossPackageGateIndex = readmeText.indexOf('npm run verify:veygrit-address-login-packages');
  assert(packageJson.name === sdkPackage.name, `${sdkPackage.name} manifest name must match package.json`);
  assert(Boolean(packageJson.scripts?.build), `${sdkPackage.name} must expose a build script`);
  assert(Boolean(packageJson.scripts?.test), `${sdkPackage.name} must expose a test script`);
  assert(Boolean(packageJson.scripts?.typecheck), `${sdkPackage.name} must expose a typecheck script`);
  assert(packageJson.files?.includes('dist') === true, `${sdkPackage.name} npm files must include dist`);
  assert(packageJson.files?.includes('examples') === true, `${sdkPackage.name} npm files must include examples`);
  assert(packageJson.files?.includes('README.md') === true, `${sdkPackage.name} npm files must include README.md`);

  const verifyScript = sdkPackage.verifyCommand.replace(/^npm run /, '');
  assert(Boolean(rootPackageJson.scripts?.[verifyScript]), `${sdkPackage.name} verify command must exist in root package.json`);
  assert(readmeText.includes('veygrit-address-login-packages.manifest.json'), `${sdkPackage.name} README must link the package manifest`);
  assert(readmeText.includes('npm run verify:veygrit-address-login-test-helpers'), `${sdkPackage.name} README must document the shared helper gate`);
  assert(readmeText.includes(sdkPackage.verifyCommand), `${sdkPackage.name} README must document its verify command`);
  assert(readmeText.includes('npm run verify:veygrit-address-login-packages'), `${sdkPackage.name} README must document the cross-package gate`);
  assert(helperGateIndex < packageSpecificGateIndex, `${sdkPackage.name} README must list the shared helper gate before the package-specific gate`);
  assert(packageSpecificGateIndex < crossPackageGateIndex, `${sdkPackage.name} README must list the package-specific gate before the cross-package gate`);
  assert(readmeText.includes('Verification order'), `${sdkPackage.name} README must document verification order`);
  assert(readmeText.includes('cross-package traceability preflight'), `${sdkPackage.name} README must name the traceability preflight`);
  assert(readmeText.includes('secret-pattern checks'), `${sdkPackage.name} README must keep secret-pattern checks visible`);
  assert(sdkPackage.publishReadiness !== 'production-ready', `${sdkPackage.name} must not claim production readiness`);
  assert(sdkPackage.publicSurfaces.length >= 8, `${sdkPackage.name} must declare key public SDK surfaces`);

  for (const entrypoint of sdkPackage.entrypoints) {
    assert(pathExists(`${sdkPackage.packagePath}/${entrypoint}`), `${sdkPackage.name} entrypoint missing: ${entrypoint}`);
  }

  for (const example of sdkPackage.examples) {
    assert(pathExists(`${sdkPackage.packagePath}/${example}`), `${sdkPackage.name} example missing: ${example}`);
  }

  for (const control of requiredSharedSafetyControls) {
    assert(sdkPackage.safetyControls.includes(control), `${sdkPackage.name} missing safety control: ${control}`);
  }
}

assert(packageNames.has('@veygrit/address-login-react'), 'React SDK package must be present');
assert(packageNames.has('@veygrit/address-login-nextjs'), 'Next.js SDK package must be present');

for (const contract of manifest.integrationContracts ?? []) {
  assert(pathExists(contract.reactExample), `${contract.name} React example path must exist`);
  assert(pathExists(contract.nextjsRoute), `${contract.name} Next.js route path must exist`);
  assert(contract.testCoverage.length >= 3, `${contract.name} must list covered handoff behavior`);
}

if (errors.length > 0) {
  console.error('verify-veygrit-address-login-packages failed');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

if (shouldReportCommitCandidates) {
  console.log(
    JSON.stringify(
      {
        report: 'veygrit-address-login-commit-candidates',
        productPlanPath,
        packageManifestPath: plan.implementationTraceability.packageManifestPath,
        packageVerifierCommand: plan.implementationTraceability.packageVerifierCommand,
        aggregateVerifierCommand: plan.implementationTraceability.aggregateVerifierCommand,
        publishReadinessClaim: plan.implementationTraceability.publishReadinessClaim,
        githubUpdatePreflightCommands: plan.implementationTraceability.githubUpdatePreflightCommands,
        humanSummary: buildCommitCandidateSummary(),
        githubUpdateMemo: buildGithubUpdateMemo(),
        finalLocalCheck: buildFinalLocalCheck(),
        dryRunStagePlan: buildDryRunStagePlan(),
        diffScope: buildDiffScopeReport(),
        excludedRootFiles,
        excludedRootFileStatuses: buildExcludedRootFileReports(),
        commitCandidates: plan.implementationTraceability.commitCandidatePaths.map(candidatePath => ({
          path: candidatePath,
          exists: pathExists(candidatePath),
          gitStatus: commitCandidateStatus(candidatePath),
        })),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (shouldReportCommitSummary) {
  console.log(buildCommitCandidateSummary());
  process.exit(0);
}

if (shouldReportStagePlan) {
  console.log(JSON.stringify(buildDryRunStagePlan(), null, 2));
  process.exit(0);
}

if (shouldReportDiffScope) {
  console.log(JSON.stringify(buildDiffScopeReport(), null, 2));
  process.exit(0);
}

if (shouldReportGithubUpdateMemo) {
  console.log(buildGithubUpdateMemo());
  process.exit(0);
}

if (shouldReportFinalLocalCheck) {
  console.log(JSON.stringify(buildFinalLocalCheck(), null, 2));
  process.exit(0);
}

console.log('verify-veygrit-address-login-packages passed');

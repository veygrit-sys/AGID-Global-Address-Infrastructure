import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const changeSetPath = 'docs/commercial-boundary-change-set.md';
const commercialSnapshotReadme = 'commercial/veygrit-commercial-products/README.md';
const requiredBoundaryFiles = [
  '.gitignore',
  'GOVERNANCE.md',
  'docs/repository-owner-routing.md',
  'docs/commercial-boundary-change-set.md',
  'src/lib/repositoryOwnerRouting.test.ts',
  'scripts/verify-commercial-boundary-review.ts',
  'scripts/verify-open-source-repository-readiness.ts',
  'scripts/verify-oss-launch.ts',
  'scripts/verify-build-chunk-budget.test.ts',
  'package.json',
  'src/lib/veygritHostedAddressLoginContract.ts',
  'src/lib/veygritHostedAddressLoginMock.ts',
];

function fail(message: string, values: string[] = []) {
  console.error(`[commercial-boundary-review] ${message}`);
  for (const value of values) {
    console.error(`- ${value}`);
  }
  process.exit(1);
}

const missingFiles = requiredBoundaryFiles.filter((path) => !existsSync(join(root, path)));

if (missingFiles.length > 0) {
  fail('missing boundary file(s):', missingFiles);
}

const changeSet = readFileSync(join(root, changeSetPath), 'utf8');
const scopedStatusMatch = changeSet.match(/```bash\n(?<command>git status --short -- (?<files>[^\n]+))\ngit check-ignore -v commercial\/veygrit-commercial-products\/README\.md\n```/);

if (!scopedStatusMatch?.groups?.files) {
  fail(`missing scoped git status command in ${changeSetPath}`);
}

const scopedStatusFiles = scopedStatusMatch.groups.files
  .trim()
  .split(/\s+/)
  .filter(Boolean);
const missingFromScopedStatus = requiredBoundaryFiles.filter((path) => !scopedStatusFiles.includes(path));
const unexpectedScopedStatusFiles = scopedStatusFiles.filter((path) => !requiredBoundaryFiles.includes(path));

if (missingFromScopedStatus.length > 0) {
  fail('scoped git status command is missing boundary file(s):', missingFromScopedStatus);
}

if (unexpectedScopedStatusFiles.length > 0) {
  fail('scoped git status command includes unexpected file(s):', unexpectedScopedStatusFiles);
}

const scopedStatusResult = spawnSync('git', ['status', '--short', '--', ...scopedStatusFiles], {
  cwd: root,
  encoding: 'utf8',
  shell: false,
});

if (scopedStatusResult.error) {
  throw scopedStatusResult.error;
}

if (scopedStatusResult.status !== 0) {
  fail('scoped git status command failed.', [scopedStatusResult.stderr.trim()].filter(Boolean));
}

const scopedStatusOutputFiles = scopedStatusResult.stdout
  .split('\n')
  .filter((line) => line.trim().length > 0)
  .map((line) => line.replace(/^.{2}\s+/, '').replace(/\\/g, '/'));
const unexpectedScopedStatusOutputFiles = scopedStatusOutputFiles.filter(
  (path) => !requiredBoundaryFiles.includes(path),
);

if (unexpectedScopedStatusOutputFiles.length > 0) {
  fail('scoped git status output includes unexpected file(s):', unexpectedScopedStatusOutputFiles);
}

const readyListMatch = changeSet.match(/Ready-to-stage file list for this slice:\n\n```text\n(?<files>[\s\S]*?)\n```/);

if (!readyListMatch?.groups?.files) {
  fail(`missing ready-to-stage file list in ${changeSetPath}`);
}

const readyListFiles = readyListMatch.groups.files
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);
const missingFromReadyList = requiredBoundaryFiles.filter((path) => !readyListFiles.includes(path));
const unexpectedReadyListFiles = readyListFiles.filter((path) => !requiredBoundaryFiles.includes(path));

if (missingFromReadyList.length > 0) {
  fail('ready-to-stage list is missing boundary file(s):', missingFromReadyList);
}

if (unexpectedReadyListFiles.length > 0) {
  fail('ready-to-stage list includes unexpected file(s):', unexpectedReadyListFiles);
}

const stagingCommandMatch = changeSet.match(/Optional local staging command[\s\S]*?```bash\n(?<command>git add -- (?<files>[\s\S]*?))\n```/);

if (!stagingCommandMatch?.groups?.files) {
  fail(`missing optional staging command in ${changeSetPath}`);
}

const stagingCommandFiles = stagingCommandMatch.groups.files
  .trim()
  .split(/\s+/)
  .filter(Boolean);
const missingFromStagingCommand = requiredBoundaryFiles.filter((path) => !stagingCommandFiles.includes(path));
const unexpectedStagingCommandFiles = stagingCommandFiles.filter((path) => !requiredBoundaryFiles.includes(path));

if (missingFromStagingCommand.length > 0) {
  fail('optional staging command is missing boundary file(s):', missingFromStagingCommand);
}

if (unexpectedStagingCommandFiles.length > 0) {
  fail('optional staging command includes unexpected file(s):', unexpectedStagingCommandFiles);
}

const ignoreResult = spawnSync('git', ['check-ignore', '-v', commercialSnapshotReadme], {
  cwd: root,
  encoding: 'utf8',
  shell: false,
});

if (ignoreResult.error) {
  throw ignoreResult.error;
}

if (ignoreResult.status !== 0) {
  console.error(`[commercial-boundary-review] ${commercialSnapshotReadme} is not ignored by git.`);
  process.exit(ignoreResult.status ?? 1);
}

const ignoreEvidence = ignoreResult.stdout.trim();
if (!ignoreEvidence.includes('commercial/')) {
  fail('ignore evidence does not include the commercial/ rule.', [ignoreEvidence]);
}

console.log(
  `[commercial-boundary-review] boundary files, scoped status, ready-to-stage list, and staging command match; ignore evidence: ${ignoreEvidence}`,
);

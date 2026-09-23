import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const root = process.cwd();
const intendedBoundaryFiles = [
  '.gitignore',
  'GOVERNANCE.md',
  'docs/repository-owner-routing.md',
  'src/lib/repositoryOwnerRouting.test.ts',
  'scripts/verify-commercial-boundary-review.ts',
  'scripts/verify-open-source-repository-readiness.ts',
  'scripts/verify-oss-launch.ts',
  'scripts/verify-build-chunk-budget.test.ts',
  'package.json',
  'src/lib/veygritHostedAddressLoginContract.ts',
  'src/lib/veygritHostedAddressLoginMock.ts',
];

function read(path: string) {
  return readFileSync(join(root, path), 'utf8');
}

test('repository owner routing preserves the commercial/private snapshot boundary', () => {
  const routingDoc = read('docs/repository-owner-routing.md');
  const changeSet = read('docs/commercial-boundary-change-set.md');
  const governance = read('GOVERNANCE.md');
  const gitignore = read('.gitignore');

  assert.match(routingDoc, /dawnportinfo-design/);
  assert.match(routingDoc, /veygrit-sys/);
  assert.match(routingDoc, /veygrit-commercial-products/);
  assert.match(routingDoc, /Current Commercial Snapshot/);
  assert.match(routingDoc, /does not claim production readiness/i);
  assert.match(routingDoc, /raw address,?\s*recipient,?\s*witness,?\s*private-key,?\s*proof-secret/i);

  assert.match(governance, /Repository Split Policy/);
  assert.match(governance, /docs\/repository-owner-routing\.md/);
  assert.match(governance, /dawnportinfo-design/);
  assert.match(governance, /veygrit-sys/);

  assert.match(changeSet, /veygrit-commercial-products/);
  assert.match(changeSet, /Intended Commit Scope/);
  assert.match(changeSet, /Scoped Diff Summary/);
  assert.match(changeSet, /\.gitignore` blocks `commercial\/`/);
  assert.match(changeSet, /define the\s+`dawnportinfo-design` public-research boundary/);
  assert.match(changeSet, /make the boundary executable in CI\/local\s+verification/);
  assert.match(changeSet, /do not introduce carrier, wallet, proof, credential, or raw\s+address handling/);
  assert.match(changeSet, /Review Procedure/);
  assert.match(changeSet, /Expected review result for this slice/);
  assert.match(changeSet, /scoped status output lists only the files named in this note/);
  assert.match(
    changeSet,
    /confirms the scoped status\s+command, scoped status output, ready-to-stage list, and optional staging\s+command exactly match the intended boundary files/,
  );
  assert.match(changeSet, /git status --short --/);
  assert.match(changeSet, /git status --short --[\s\S]*scripts\/verify-commercial-boundary-review\.ts/);
  assert.match(changeSet, /git check-ignore -v commercial\/veygrit-commercial-products\/README\.md/);
  assert.match(changeSet, /\.gitignore` through the `commercial\/` rule/);
  assert.match(changeSet, /Ready-to-stage file list for this slice/);
  assert.match(changeSet, /scripts\/verify-commercial-boundary-review\.ts/);
  assert.match(changeSet, /docs\/commercial-boundary-change-set\.md/);
  assert.match(changeSet, /src\/lib\/veygritHostedAddressLoginMock\.ts/);
  assert.match(changeSet, /Optional local staging command/);
  assert.match(changeSet, /git add --[\s\S]*scripts\/verify-commercial-boundary-review\.ts/);
  assert.match(changeSet, /Suggested Commit Message/);
  assert.match(changeSet, /Document commercial repository boundary routing/);
  assert.match(changeSet, /Reviewer Checklist/);
  assert.match(changeSet, /public research, OSS specifications, conformance fixtures/);
  assert.match(changeSet, /commercial product snapshots, hosted operations, enterprise/);
  assert.match(changeSet, /false-positive token-request cleanup/);
  assert.match(changeSet, /npm run verify:commercial-boundary-review/);
  assert.match(changeSet, /npm run verify:oss-launch/);
  assert.match(changeSet, /does not claim.*production-ready/is);
  assert.match(changeSet, /raw address,?\s*recipient,?\s*witness,?\s*private-key,?\s*proof-secret/i);
  for (const path of intendedBoundaryFiles) {
    assert.ok(changeSet.includes(path), `${path} should be listed in the commercial boundary change set`);
    assert.equal(existsSync(join(root, path)), true, `${path} should exist in the AGID workspace`);
  }

  assert.match(gitignore, /commercial\//);
  assert.match(gitignore, /Private commercial product snapshots/);
});

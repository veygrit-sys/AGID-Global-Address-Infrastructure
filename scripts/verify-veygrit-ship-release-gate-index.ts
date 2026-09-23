import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const indexDocPath = 'docs/ops/veygrit-ship-release-gate-index.md';
const operationsGatePath = 'scripts/verify-veygrit-ship-operations.ts';

const forbiddenCommandPattern =
  /\b(npm\s+publish|composer\s+publish|git\s+push|gh\s+pr\s+create|gh\s+repo\s+create|sites\s+save|deploy\s+production|curl|Invoke-WebRequest|iwr|wget)\b/i;

const gateEntries = [
  {
    gate: 'verify:veygrit-ship-credential-surfaces',
    boundary: 'Guest, Merchant, and internal credential-surface separation',
    nonClaim: 'Passing does not prove live carrier credentials, carrier approval, label purchase authority, or production traffic.',
  },
  {
    gate: 'verify:veygrit-ship-sdk-readmes',
    boundary: 'Public SDK README credential-boundary handoff',
    nonClaim: 'Passing does not authorize browser carrier credential handling or public credential input.',
  },
  {
    gate: 'verify:veygrit-ship-sdk-packages',
    boundary: 'JS and PHP package metadata readiness',
    nonClaim: 'Passing does not publish packages, validate registry behavior, or prove live carrier availability.',
  },
  {
    gate: 'verify:veygrit-ship-sdk-build-hygiene',
    boundary: 'JS SDK local typecheck, build, and generated-output scan',
    nonClaim: 'Passing does not prove npm archive contents, registry provenance, or production runtime security.',
  },
  {
    gate: 'verify:veygrit-ship-sdk-package-archives',
    boundary: 'JS dry-run package archive and PHP composer metadata',
    nonClaim: 'Passing does not create package archives, publish packages, or prove Packagist/npm registry readiness.',
  },
  {
    gate: 'verify:veygrit-ship-sdk-release-checklist',
    boundary: 'Public no-publish SDK release checklist',
    nonClaim: 'Passing does not authorize registry publication, hosted deployment, remote mutation, or production carrier traffic.',
  },
  {
    gate: 'verify:veygrit-ship-release-gate-index',
    boundary: 'Operations gate inventory and command wiring',
    nonClaim: 'Passing does not add new operational evidence beyond index completeness.',
  },
  {
    gate: 'verify:veygrit-ship-release-gate-status',
    boundary: 'Public-safe release gate status fixture and Guest route exposure',
    nonClaim: 'Passing does not certify live release state, deployment health, public uptime, or production carrier traffic readiness.',
  },
  {
    gate: 'verify:veygrit-ship-observability',
    boundary: 'Logs, metrics, alerts, and bounded request identifiers',
    nonClaim: 'Passing does not prove production monitoring coverage, pager readiness, or live carrier SLOs.',
  },
  {
    gate: 'verify:veygrit-ship-backup-restore',
    boundary: 'Non-production backup and restore command safety',
    nonClaim: 'Passing does not authorize production restores or prove disaster recovery objectives.',
  },
  {
    gate: 'verify:preaudit-secrets',
    boundary: 'Repository pre-audit secret scan',
    nonClaim: 'Passing does not prove secret absence in every future file, external system, or private runtime.',
  },
  {
    gate: 'verify:veygrit-ship-dependency-lock',
    boundary: 'Critical dependency lockfile policy',
    nonClaim: 'Passing does not prove all transitive dependencies are safe or production-approved.',
  },
  {
    gate: 'verify:dependency-audit',
    boundary: 'npm dependency vulnerability audit',
    nonClaim: 'Passing does not prove non-npm dependencies, cloud services, or carrier integrations are risk-free.',
  },
] as const;

const indexDoc = readFileSync(indexDocPath, 'utf8');
assert.match(indexDoc, /# Veygrit Ship Release Gate Index/);
assert.match(indexDoc, /veygrit-ship-release-gate-index-v0\.1/);
assert.match(indexDoc, /authorizes no registry publication, hosted deployment, remote repository mutation, pull request creation, or production carrier traffic/);
assert.match(indexDoc, /authorizes no raw address, recipient, witness, private-key, proof-secret, carrier credential, or production credential material handling/);
assert.doesNotMatch(indexDoc, forbiddenCommandPattern, `${indexDocPath} must not include remote, publish, deploy, or network-fetch commands`);

const rootPackage = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };
const operationsGate = readFileSync(operationsGatePath, 'utf8');
const checksBlock = operationsGate.match(/const checks = \[([\s\S]*?)\];/);
assert.ok(checksBlock, `${operationsGatePath} must expose a checks array`);
const operationChecks = [...checksBlock[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
assert.deepEqual(operationChecks, gateEntries.map(entry => entry.gate), `${operationsGatePath} checks must match the release gate index order`);

for (const entry of gateEntries) {
  const expectedCommand = `npm run ${entry.gate}`;
  const docRow = `| \`${entry.gate}\` | \`${expectedCommand}\` | ${entry.boundary} | ${entry.nonClaim} |`;
  assert.ok(indexDoc.includes(docRow), `${indexDocPath} must include row for ${entry.gate}`);
  assert.ok(rootPackage.scripts?.[entry.gate], `package.json must define ${entry.gate}`);
}

const fencedBlocks = [...indexDoc.matchAll(/```[\s\S]*?```/g)].map(match => match[0]);
assert.equal(fencedBlocks.length, 1, `${indexDocPath} must keep exactly one status command block`);
assert.ok(fencedBlocks[0].includes('npm run verify:veygrit-ship-release-gate-index'));
assert.ok(fencedBlocks[0].includes('npm run verify:veygrit-ship-release-gate-status'));
assert.ok(fencedBlocks[0].includes('npm run verify:veygrit-ship-operations'));
assert.doesNotMatch(fencedBlocks[0], forbiddenCommandPattern, `${indexDocPath} command block must contain only local verification commands`);

for (const entry of gateEntries) {
  console.log(`${entry.gate} | ${entry.boundary}`);
}
console.log(`Veygrit Ship release gate index checks passed (${gateEntries.length} gates).`);

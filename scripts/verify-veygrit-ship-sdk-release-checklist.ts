import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const checklistPath = 'docs/ops/veygrit-ship-sdk-release-checklist.md';
const operationsGatePath = 'scripts/verify-veygrit-ship-operations.ts';

const requiredChecklistAnchors = [
  '# Veygrit Ship SDK Release Checklist',
  'veygrit-ship-sdk-release-checklist-v0.1',
  'sdk/veygrit-ship-js',
  'sdk/veygrit-ship-php',
  'docs/ops/veygrit-ship-credential-surface-matrix.md',
  'No registry publication is authorized by this checklist.',
  'No production carrier traffic is authorized by this checklist.',
  'No remote repository mutation, pull request creation, hosted deployment, or package publication is authorized by this checklist.',
  'No raw address, recipient, witness, private-key, proof-secret, carrier credential, or production credential material may be handled during these checks.',
  'Do not send carrier credentials through this SDK.',
  'npm run verify:veygrit-ship-sdk-readmes',
  'npm run verify:veygrit-ship-sdk-packages',
  'npm run verify:veygrit-ship-sdk-build-hygiene',
  'npm run verify:veygrit-ship-sdk-package-archives',
  'npm run verify:veygrit-ship-sdk-release-checklist',
  'npm run verify:veygrit-ship-release-gate-index',
  'npm run verify:veygrit-ship-release-gate-status',
  'npm run verify:veygrit-ship-operations',
  'Composer validation is optional when Composer is available locally',
  'The local operations gate inventory lists every aggregate gate with its command, boundary, and non-claim.',
  'The public-safe status fixture and Guest route expose only gate command, boundary, and non-claim metadata with no tenant, request, raw address, recipient, credential, witness, private-key, proof-secret, package archive, or production carrier identifiers.',
  'Passing this checklist is not proof of carrier approval, valid live credentials, label purchase authority, or production carrier availability.',
  'Passing this checklist is not permission to publish packages, push branches, create pull requests, save/deploy hosted Sites, or send production traffic.',
  'Passing this checklist is not proof that cloud IAM, secret rotation, registry provenance, Packagist metadata, or live carrier contracts are production-ready.',
] as const;

const requiredRootScripts = [
  ['verify:veygrit-ship-sdk-readmes', 'tsx scripts/verify-veygrit-ship-sdk-readmes.ts'],
  ['verify:veygrit-ship-sdk-packages', 'tsx scripts/verify-veygrit-ship-sdk-packages.ts'],
  ['verify:veygrit-ship-sdk-build-hygiene', 'tsx scripts/verify-veygrit-ship-sdk-build-hygiene.ts'],
  ['verify:veygrit-ship-sdk-package-archives', 'tsx scripts/verify-veygrit-ship-sdk-package-archives.ts'],
  ['verify:veygrit-ship-sdk-release-checklist', 'tsx scripts/verify-veygrit-ship-sdk-release-checklist.ts'],
  ['verify:veygrit-ship-release-gate-index', 'tsx scripts/verify-veygrit-ship-release-gate-index.ts'],
  ['verify:veygrit-ship-release-gate-status', 'tsx --test src/lib/veygritShipReleaseGateStatus.test.ts src/server/routes/veygritShipGuestRoutes.test.ts'],
] as const;

const checklist = readFileSync(checklistPath, 'utf8');
for (const anchor of requiredChecklistAnchors) {
  assert.ok(checklist.includes(anchor), `${checklistPath} must include ${anchor}`);
}

const fencedBlocks = [...checklist.matchAll(/```[\s\S]*?```/g)].map(match => match[0]);
assert.equal(fencedBlocks.length, 1, `${checklistPath} must keep exactly one command block`);
for (const [scriptName] of requiredRootScripts) {
  assert.ok(
    fencedBlocks[0].includes(`npm run ${scriptName}`),
    `${checklistPath} command block must include npm run ${scriptName}`,
  );
}
assert.doesNotMatch(
  fencedBlocks[0],
  /\b(npm\s+publish|composer\s+publish|git\s+push|gh\s+pr\s+create|gh\s+repo\s+create|sites\s+save|deploy\s+production|curl|Invoke-WebRequest|iwr|wget)\b/i,
  `${checklistPath} command block must contain only local verification commands`,
);

const rootPackage = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };
for (const [scriptName, command] of requiredRootScripts) {
  assert.equal(rootPackage.scripts?.[scriptName], command, `package.json must wire ${scriptName}`);
}

const operationsGate = readFileSync(operationsGatePath, 'utf8');
assert.ok(
  operationsGate.includes("'verify:veygrit-ship-sdk-release-checklist'"),
  `${operationsGatePath} must include verify:veygrit-ship-sdk-release-checklist`,
);

console.log('Veygrit Ship SDK release checklist checks passed.');

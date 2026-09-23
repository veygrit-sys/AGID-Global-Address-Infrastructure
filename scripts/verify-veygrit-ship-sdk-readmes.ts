import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sdkReadmePaths = [
  'sdk/veygrit-ship-js/README.md',
  'sdk/veygrit-ship-php/README.md',
] as const;

const matrixDocPath = 'docs/ops/veygrit-ship-credential-surface-matrix.md';
const releaseChecklistPath = 'docs/ops/veygrit-ship-sdk-release-checklist.md';
const matrixDoc = readFileSync(matrixDocPath, 'utf8');
const releaseChecklist = readFileSync(releaseChecklistPath, 'utf8');

const requiredReadmeAnchors = [
  matrixDocPath,
  releaseChecklistPath,
  'Guest sessions do not create, store, return, or promote carrier credential references.',
  'Guest route success is not proof of Merchant account ownership, carrier account approval, live labels, or production carrier traffic.',
  'Do not send carrier credentials through this SDK.',
  'npm run verify:veygrit-ship-credential-surfaces',
  'npm run verify:veygrit-ship-sdk-readmes',
  'npm run verify:veygrit-ship-sdk-release-checklist',
] as const;

assert.match(matrixDoc, /# Veygrit Ship Credential Surface Matrix/);
assert.match(matrixDoc, /guest-public/);
assert.match(matrixDoc, /merchant-control-plane/);
assert.match(matrixDoc, /internal-carrier-runtime/);
assert.match(releaseChecklist, /# Veygrit Ship SDK Release Checklist/);
assert.match(releaseChecklist, /No registry publication is authorized by this checklist\./);
assert.match(releaseChecklist, /No production carrier traffic is authorized by this checklist\./);

for (const readmePath of sdkReadmePaths) {
  const readme = readFileSync(readmePath, 'utf8');
  for (const anchor of requiredReadmeAnchors) {
    assert.ok(readme.includes(anchor), `${readmePath} must include ${anchor}`);
  }

  assert.match(readme, /server-side/i, `${readmePath} must keep API keys server-side`);
  assert.match(readme, /no credential input/i, `${readmePath} must state the public/Guest surface has no credential input`);
  assert.doesNotMatch(readme, /browser.*carrier credential/i, `${readmePath} must not describe browser carrier credential handling`);
}

console.log(`Veygrit Ship SDK README boundary checks passed (${sdkReadmePaths.length} SDKs).`);

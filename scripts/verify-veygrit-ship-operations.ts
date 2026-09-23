import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { buildDeliveryGatewayCarrierApiRegistry } from '../src/lib/deliveryGatewayCarrierApi';

const secretManagementDocPath = 'docs/ops/veygrit-ship-secret-management.md';
const shippingServerTestRoot = 'src/server/shipping';
const credentialFixtureHelperPath = 'src/server/shipping/testCredentialFixtures.ts';
const printableCredentialFixturePatterns: Array<[string, RegExp]> = [
  ['printable-secret-buffer', /Buffer\.from\(\s*['"][^'"\r\n]*(?:secret|credential|client[_-]?secret)[^'"\r\n]*['"]/i],
  ['inline-secret-reference-sentinel', /['"](?:client[_-]?secret|secret)\s*=\s*[^'"\r\n]+['"]/i],
];

function getCarrierCapabilitySurface() {
  const registry = buildDeliveryGatewayCarrierApiRegistry();
  const surface = registry.apiSurfaces.find(candidate => candidate.id === 'carrier-capability');

  assert.ok(surface, 'Delivery Gateway carrier-capability surface should exist');
  assert.equal(surface.boundary, 'oss-contract');
  assert.ok(surface.safeOutputs.includes('capabilityRef'));
  assert.ok(surface.blockedFields.includes('carrierApiKey'));
  assert.ok(surface.blockedFields.includes('commercialRateSecret'));

  return surface;
}

const carrierCapabilitySurface = getCarrierCapabilitySurface();
const secretManagementDoc = await readFile(secretManagementDocPath, 'utf8');

assert.match(secretManagementDoc, /Delivery Gateway `carrier-capability` surface/);
assert.match(secretManagementDoc, /OSS-contract metadata/);

for (const nonClaim of carrierCapabilitySurface.nonClaims) {
  assert.ok(
    secretManagementDoc.includes(nonClaim),
    `${secretManagementDocPath} must include Delivery Gateway carrier-capability non-claim: ${nonClaim}`,
  );
}

const firstNonClaimIndex = Math.min(
  ...carrierCapabilitySurface.nonClaims
    .map(nonClaim => secretManagementDoc.indexOf(nonClaim))
    .filter(index => index >= 0),
);
const launchReadinessIndex = secretManagementDoc.indexOf('UPS/DHL launch-readiness review');
assert.ok(firstNonClaimIndex >= 0, `${secretManagementDocPath} must include carrier-capability non-claims`);
assert.ok(
  launchReadinessIndex === -1 || firstNonClaimIndex < launchReadinessIndex,
  `${secretManagementDocPath} must state carrier-capability non-claims before launch-readiness language`,
);

const credentialFixtureHelper = await readFile(credentialFixtureHelperPath, 'utf8');
assert.match(credentialFixtureHelper, /export function credentialBytesEndingWith/);
assert.match(credentialFixtureHelper, /Uint8Array\.from\(\[0, 1, 2, 3/);

const shippingTestFiles = (await readdir(shippingServerTestRoot))
  .filter(file => file.endsWith('.test.ts'))
  .map(file => join(shippingServerTestRoot, file).replace(/\\/g, '/'));

for (const file of shippingTestFiles) {
  const source = await readFile(file, 'utf8');
  assert.ok(
    !/function credentialBytesEndingWith/.test(source),
    `${file} must import credentialBytesEndingWith from ${credentialFixtureHelperPath}`,
  );
  for (const [ruleId, pattern] of printableCredentialFixturePatterns) {
    assert.ok(!pattern.test(source), `${file} must not contain ${ruleId}`);
  }
}

const checks = [
  'verify:veygrit-ship-credential-surfaces',
  'verify:veygrit-ship-sdk-readmes',
  'verify:veygrit-ship-sdk-packages',
  'verify:veygrit-ship-sdk-build-hygiene',
  'verify:veygrit-ship-sdk-package-archives',
  'verify:veygrit-ship-sdk-release-checklist',
  'verify:veygrit-ship-release-gate-index',
  'verify:veygrit-ship-release-gate-status',
  'verify:veygrit-ship-observability',
  'verify:veygrit-ship-backup-restore',
  'verify:preaudit-secrets',
  'verify:veygrit-ship-dependency-lock',
  'verify:dependency-audit',
];

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run this release gate through npm so npm_execpath is available.');

for (const check of checks) {
  const exitCode = await new Promise<number>((resolve, reject) => {
    const child = spawn(process.execPath, [npmCli, 'run', check], { stdio: 'inherit', windowsHide: true });
    child.once('error', reject);
    child.once('exit', code => resolve(code ?? 1));
  });
  if (exitCode !== 0) process.exit(exitCode);
}
console.log(`Veygrit -ship operational release gates passed (${checks.length} checks).`);

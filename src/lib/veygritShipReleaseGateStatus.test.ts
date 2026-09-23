import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { getVeygritShipReleaseGateStatus } from './veygritShipReleaseGateStatus';

const indexDocPath = 'docs/ops/veygrit-ship-release-gate-index.md';
const operationsGatePath = 'scripts/verify-veygrit-ship-operations.ts';

const forbiddenKeyFragments = [
  'tenantid',
  'tenantref',
  'requestid',
  'requestref',
  'addressid',
  'addressref',
  'recipientid',
  'recipientref',
  'credentialsecretref',
  'credentialversionref',
  'secretref',
  'versionref',
  'witness',
  'privatekey',
  'proofsecret',
  'carrierapikey',
  'commercialratesecret',
  'rawaddress',
  'addressline1',
  'postalcode',
];

function collectPublicIdentifierLeaks(value: unknown, path = '$'): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectPublicIdentifierLeaks(item, `${path}[${index}]`));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const keyLeaks = forbiddenKeyFragments
        .filter(fragment => normalizedKey === fragment || normalizedKey.includes(fragment))
        .map(fragment => `${path}.${key}<${fragment}>`);
      return [...keyLeaks, ...collectPublicIdentifierLeaks(child, `${path}.${key}`)];
    });
  }
  if (typeof value !== 'string') return [];

  const valueLeakPatterns = [
    /\b(?:tenant|request|req|address|addr|recipient|rcpt|secretref|credentialref|witness|proofsecret|privatekey)_[a-z0-9]+\b/i,
    /\barn:aws:secretsmanager:/i,
    /\bvault:\/\//i,
    /\bprojects\/[^/\s]+\/secrets\/[^/\s]+\/versions\//i,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  ];
  return valueLeakPatterns.some(pattern => pattern.test(value)) ? [path] : [];
}

test('Veygrit Ship release gate status mirrors local operation gates', () => {
  const status = getVeygritShipReleaseGateStatus();
  const operationsGate = readFileSync(operationsGatePath, 'utf8');
  const checksBlock = operationsGate.match(/const checks = \[([\s\S]*?)\];/);
  assert.ok(checksBlock, `${operationsGatePath} must expose a checks array`);
  const operationChecks = [...checksBlock[1].matchAll(/'([^']+)'/g)].map(match => match[1]);

  assert.equal(status.version, 'veygrit-ship-release-gate-status-v0.1');
  assert.equal(status.source, indexDocPath);
  assert.equal(status.exposure, 'public-safe-no-identifiers');
  assert.equal(status.reviewState, 'local-gate-inventory');
  assert.equal(status.remoteActionsAuthorized, false);
  assert.equal(status.productionTraffic, false);
  assert.equal(status.gateCount, status.gates.length);
  assert.deepEqual(status.gates.map(entry => entry.gate), operationChecks);
  assert.equal(status.gates.length, 13);
});

test('Veygrit Ship release gate status rows stay aligned with the release index doc', () => {
  const status = getVeygritShipReleaseGateStatus();
  const indexDoc = readFileSync(indexDocPath, 'utf8');

  for (const entry of status.gates) {
    const docRow = `| \`${entry.gate}\` | \`${entry.command}\` | ${entry.boundary} | ${entry.nonClaim} |`;
    assert.ok(indexDoc.includes(docRow), `${indexDocPath} must include public status row for ${entry.gate}`);
  }
  assert.ok(indexDoc.includes('npm run verify:veygrit-ship-release-gate-status'));
});

test('Veygrit Ship release gate status exposes only public-safe policy metadata', () => {
  const status = getVeygritShipReleaseGateStatus();
  assert.deepEqual(collectPublicIdentifierLeaks(status), []);
  assert.ok(status.nonClaims.some(nonClaim => nonClaim.includes('not production release approval')));
  assert.ok(status.nonClaims.some(nonClaim => nonClaim.includes('includes no tenant, request, raw address, recipient, credential, witness, private-key, proof-secret')));
});

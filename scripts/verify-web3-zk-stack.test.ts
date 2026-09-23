import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const ROOT = process.cwd();

function read(path: string) {
  return readFileSync(`${ROOT}/${path}`, 'utf8');
}

test('Foundry is configured for OpenZeppelin-backed AGID contracts', () => {
  const foundry = read('foundry.toml');

  assert.match(foundry, /src = "contracts"/);
  assert.match(foundry, /libs = \["node_modules", "lib"\]/);
  assert.match(foundry, /solc_version = "0\.8\.24"/);
  assert.match(foundry, /anvil = "http:\/\/127\.0\.0\.1:8545"/);
});

test('contract ABIs keep raw address material out of registry events', () => {
  const files = [
    'contracts/AGIDIssuerRegistry.sol',
    'contracts/AGIDRevocationFreshnessRegistry.sol',
    'contracts/AGIDNullifierRegistry.sol',
    'contracts/AGIDPaymentEscrow.sol',
  ];

  for (const file of files) {
    const source = read(file);
    assert.match(source, /AccessControl/);
    assert.doesNotMatch(source, /rawAddress|rawAOID|phoneNumber|recipientName|AGID-S ciphertext/i);
  }
});

test('nullifier contract rejects duplicate scoped nullifier use', () => {
  const source = read('contracts/AGIDNullifierRegistry.sol');

  assert.match(source, /mapping\(bytes32 => bool\) private usedNullifiers/);
  assert.match(source, /require\(!usedNullifiers\[key\], "nullifier-already-used"\)/);
  assert.match(source, /keccak256\(abi\.encode\(registryKeyHash, scope, nullifierHash\)\)/);
});

test('Circom fixture is clearly marked as non-production and keeps private witness private', () => {
  const readme = read('circuits/README.md');
  const circuit = read('circuits/fixtures/nullifier_linear_fixture.circom');

  assert.match(readme, /not a production privacy circuit/i);
  assert.match(readme, /raw address text/);
  assert.match(circuit, /holderSecret/);
  assert.match(circuit, /component main \{ public \[scopeHash, nullifierHash\] \}/);
});

test('generated ZK and Foundry artifacts are ignored', () => {
  const ignore = read('.gitignore');

  for (const pattern of ['out/', 'cache/', 'broadcast/', 'circuits/build/', 'circuits/**/*.zkey']) {
    assert.match(ignore, new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

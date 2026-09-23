import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyZkCircuitFixture } from './verify-zk-circuit-fixture';

test('verifies the Circom fixture through a temporary CommonJS workspace', async () => {
  const result = await verifyZkCircuitFixture();

  assert.equal(result.artifactDirectoryKept, false);
  assert.equal(result.artifactDirectory, null);
  assert.match(result.r1csInfo, /# of Constraints: 2/);
  assert.match(result.r1csInfo, /# of Private Inputs: 2/);
  assert.match(result.r1csInfo, /# of Public Inputs: 2/);
  assert.match(result.witnessCheck, /WITNESS IS CORRECT/);
});

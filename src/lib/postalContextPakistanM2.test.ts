import assert from 'node:assert/strict';
import {test} from 'node:test';
import {PostalContextPackRuntime,normalizePakistanPostalCode} from './postalContextPackRuntime';
import {createPakistanPostalContextRuntimeTestPack,PAKISTAN_POSTAL_CONTEXT_TEST_INSTANT} from '../testFixtures/postalContextPakistanRuntimeFixture';

// Synthetic conformance only; no production PK assignments or building claims.
test('PK rejects six-digit source anomalies without truncating or inventing an assignment',()=>{
  for(const code of ['000000','0000','PK-00000','00000,00001','Office label'])assert.equal(normalizePakistanPostalCode(code),null);
  assert.equal(normalizePakistanPostalCode('００００１'),'00001');
});
test('PK invalid-code lookup cannot fall back to synthetic postal geometry',()=>{
  const runtime=new PostalContextPackRuntime(createPakistanPostalContextRuntimeTestPack());
  const result=runtime.lookupPostalCode('000000',PAKISTAN_POSTAL_CONTEXT_TEST_INSTANT);
  assert.notEqual(result.status,'unique');assert.deepEqual(result.geometries,[]);
});
test('PK postcode context alone does not resolve a street number or building',()=>{
  const runtime=new PostalContextPackRuntime(createPakistanPostalContextRuntimeTestPack());
  const result=runtime.lookupPostalCode('00000',PAKISTAN_POSTAL_CONTEXT_TEST_INSTANT);
  assert.equal(result.status,'unique');assert.deepEqual(result.geometries,[]);
  assert.ok([...result.postalFeatures,...result.contexts].every(n=>!['building','address_point'].includes(n.kind)));
  assert.ok(result.alternatives.every(a=>a.contexts.every(n=>!['building','address_point'].includes(n.kind))));
});

import assert from 'node:assert/strict';import {test} from 'node:test';
import {PostalContextPackRuntime,validatePostalContextRuntimePack} from './postalContextPackRuntime';
import {createMalaysiaPostalContextRuntimeTestPack} from '../testFixtures/postalContextMalaysiaRuntimeFixture';
test('a postcode dictionary cannot authorize postal, address, building or entrance geometry',()=>{
 const original=createMalaysiaPostalContextRuntimeTestPack();assert.equal(validatePostalContextRuntimePack(original,'MY').valid,true);
 for(let i=0;i<original.geometry.features.length;i++){const pack=structuredClone(original);pack.geometry.features[i].source.assignmentAuthority='official_postal_dictionary';const v=validatePostalContextRuntimePack(pack,'MY');assert.equal(v.valid,false);assert.ok(v.errors.some(e=>e.startsWith('dictionary-cannot-authorize-geometry:')));assert.throws(()=>new PostalContextPackRuntime(pack));}
});

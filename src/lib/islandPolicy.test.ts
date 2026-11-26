import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyIslandPolicyToEvidence } from './islandPolicy';
import { assessAgidGeography } from './geographicAssessment';
import { decodeAGID, encodeAGID16 } from './agid';

const imported = { codes: ['KR'], sovereignCodes: ['KR'], source: 'external-test-map', version: '1', relation: 'inside' as const };

test('the Japanese display rule takes precedence over imported land attributes and an issued prefix', () => {
  for (const lon of [131.87016, 131.87016 - 360]) {
    const evidence = applyIslandPolicyToEvidence(37.24002, lon, imported);
    assert.equal(evidence?.status, 'japan-position');
    assert.deepEqual(evidence.countryCodes, ['JP']);
    assert.deepEqual(evidence.sovereignCodes, ['JP']);
    assert.equal(evidence.administeringCode, undefined);
    assert.equal(evidence.claimantCodes, undefined);
  }
  assert.equal(applyIslandPolicyToEvidence(37.24, 131.86, imported), undefined);
  const current = encodeAGID16(37.24002, 131.87016);
  const historic = 'KR' + current.hash;
  assert.equal(decodeAGID(historic)?.prefix, 'KR');
  const read = assessAgidGeography({ kind: 'cell', id: historic });
  assert.deepEqual(read.island?.countryCodes, ['JP']);
  assert.equal(read.deliveryRegion, null);
});

test('disputed and poorly evidenced land has no automatic owner', () => {
  const fk = applyIslandPolicyToEvidence(-51.794, -58.61, imported);
  assert.equal(fk?.status, 'disputed');
  assert.deepEqual(fk.countryCodes, []);
  assert.deepEqual(fk.claimantCodes?.sort(), ['AR','GB']);
  const unknown = applyIslandPolicyToEvidence(0, 0, {...imported, codes: []});
  assert.equal(unknown?.status, 'unresolved');
  assert.equal(applyIslandPolicyToEvidence(0,0), undefined);
  assert.throws(() => applyIslandPolicyToEvidence(NaN, 12, imported), RangeError);
});

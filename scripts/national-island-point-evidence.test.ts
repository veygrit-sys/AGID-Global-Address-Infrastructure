import assert from 'node:assert/strict';
import { test } from 'node:test';
import { matchNationalIslandPoint } from './national-island-point-evidence';

type Point = readonly [number, number];
const controls: { id: string; code: string; inside: Point; outside: Point; boundary: Point }[] = [
  { id: 'gshhg:100240', code: 'JP', inside: [28.2049683, 129.15143571219784] as const,
    outside: [28.206249999999997, 129.1508475] as const, boundary: [28.2053299, 129.150839] as const },
  { id: 'gshhg:100640', code: 'CA', inside: [64.41089310000001, -74.91332745922395] as const,
    outside: [64.4111805, -74.9117729242126] as const, boundary: [64.4113857, -74.914085] as const },
];

test('partial official land evidence holds on only one part of each reference island', () => {
  for (const { id, code, inside, outside, boundary } of controls) {
    const proof = matchNationalIslandPoint(...inside, id, '2.3.7');
    assert.equal(proof?.code, code);
    assert.equal(proof?.sovereignCode, code);
    assert.match(proof?.evidenceUrls[0] ?? '', /^https:\/\//);
    assert.ok(proof?.attribution);
    // The second point is GSHHG's original interior sample on the SAME island.
    assert.equal(matchNationalIslandPoint(...outside, id, '2.3.7'), undefined);
    assert.equal(matchNationalIslandPoint(...boundary, id, '2.3.7'), undefined);
  }
});

test('point overlays require the matching physical ID and edition', () => {
  const { id, inside } = controls[0];
  assert.equal(matchNationalIslandPoint(...inside, id, '2.3.8'), undefined);
  for (const other of [controls[1].id, 'gshhg:100240,100640', 'gshhg:0100240', 'fieldmaps-20250729:100240']) {
    assert.equal(matchNationalIslandPoint(...inside, other, '2.3.7'), undefined);
  }
  assert.equal(matchNationalIslandPoint(NaN, 129.1, id, '2.3.7'), undefined);
  assert.equal(matchNationalIslandPoint(0, 0, id, '2.3.7'), undefined);
});

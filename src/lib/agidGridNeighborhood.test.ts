import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AGID_GRID_AXIS_BITS,
  encodeAGID,
  getAGIDCellKey,
  getAdjacentAGIDCells,
  matchAGIDGridNeighborhood,
} from './agid';

test('AGID exposes a 21-bit cell axis and eight immediate interior neighbors', () => {
  const source = encodeAGID(12.345678, 23.456789);
  const neighbors = getAdjacentAGIDCells(source);

  assert.equal(AGID_GRID_AXIS_BITS, 21);
  assert.equal(neighbors.length, 8);
  assert.equal(new Set(neighbors.map(neighbor => neighbor.cellKey)).size, 8);
  assert.equal(
    neighbors.filter(neighbor => neighbor.relation === 'edge-adjacent').length,
    4,
  );
  assert.equal(
    neighbors.filter(neighbor => neighbor.relation === 'corner-adjacent').length,
    4,
  );
});

test('AGID adjacency crosses a cubed-sphere face boundary', () => {
  const seamCell = encodeAGID(0, 45);
  const neighbors = getAdjacentAGIDCells(seamCell);
  const crossFace = neighbors.find(neighbor =>
    neighbor.agid.face !== seamCell.face);

  assert.ok(crossFace);
  const match = matchAGIDGridNeighborhood(seamCell, crossFace.agid);
  assert.equal(match.acceptedAsSameOrNearArea, true);
  assert.equal(match.boundaryMatch, true);
  assert.match(match.relation, /adjacent$/);
});

test('AGID seam neighborhoods remain adjacent in both directions', () => {
  const seamPoints = [
    [0, 45],
    [0, 135],
    [0, -45],
    [0, -135],
    [45, 0],
    [-45, 0],
    [45, 90],
    [-45, 90],
    [45, -90],
    [-45, -90],
  ] as const;

  for (const [lat, lon] of seamPoints) {
    const source = encodeAGID(lat, lon);
    const neighbors = getAdjacentAGIDCells(source);
    assert.ok(
      neighbors.some(neighbor => neighbor.agid.face !== source.face),
      `expected a cross-face neighbor at ${lat},${lon}`,
    );
    for (const neighbor of neighbors) {
      const reverse = matchAGIDGridNeighborhood(neighbor.agid, source);
      assert.equal(
        reverse.acceptedAsSameOrNearArea,
        true,
        `expected symmetric adjacency at ${lat},${lon}`,
      );
    }
  }
});

test('AGID cell equality uses spatial bits rather than political prefix text', () => {
  const source = encodeAGID(35.681236, 139.767125);
  const alternatePrefix = `99${source.id.slice(2)}`;
  const match = matchAGIDGridNeighborhood(source.id, alternatePrefix);

  assert.equal(getAGIDCellKey(source.id), getAGIDCellKey(alternatePrefix));
  assert.equal(match.relation, 'same-cell');
  assert.equal(match.acceptedAsSameOrNearArea, true);
});

test('AGID neighborhood matching rejects distant and invalid cells', () => {
  const source = encodeAGID(0, 45);
  const distant = encodeAGID(0, 45.01);
  const separate = matchAGIDGridNeighborhood(source, distant);
  const invalid = matchAGIDGridNeighborhood(source, 'not-an-agid');

  assert.equal(separate.relation, 'separate');
  assert.equal(separate.acceptedAsSameOrNearArea, false);
  assert.equal(invalid.relation, 'invalid');
  assert.equal(invalid.acceptedAsSameOrNearArea, false);
});

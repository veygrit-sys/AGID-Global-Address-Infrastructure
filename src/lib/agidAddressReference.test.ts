import assert from 'node:assert/strict';
import test from 'node:test';

import {
  encodeAGID,
  getAdjacentAGIDCells,
} from './agid';
import {
  buildAgidAddressReference,
  compareAgidBuildingReferences,
  comparePrivateSubPremiseMetadata,
  normalizeAgidPublicAddress,
} from './agidAddressReference';

test('AGID building references keep sub-premise metadata private and separate', () => {
  const agid = encodeAGID(10, 20);
  const bundle = buildAgidAddressReference({
    agid: agid.id,
    buildingId: 'BLDG-SYNTH-001',
    subPremise: {
      unit: 'SYNTH-UNIT-12',
      floor: 'SYNTH-FLOOR-3',
      entrance: 'SYNTH-ENTRY-A',
    },
  });
  const publicText = JSON.stringify(bundle.publicReference);

  assert.equal(bundle.publicReference.gridAxisBits, 21);
  assert.equal(bundle.publicReference.privacy.privateDetailIncluded, false);
  assert.equal(bundle.publicReference.privacy.personalDataIncluded, false);
  assert.equal(bundle.privateMetadata?.classification, 'private-sub-premise');
  assert.equal(bundle.privateMetadata?.unit, 'SYNTH-UNIT-12');
  assert.doesNotMatch(
    publicText,
    /SYNTH-UNIT|SYNTH-FLOOR|SYNTH-ENTRY|sub.?premise|unit|floor|entrance/i,
  );
});

test('same building IDs in adjacent cells become reviewed boundary matches', () => {
  const source = encodeAGID(0, 45);
  const adjacent = getAdjacentAGIDCells(source)[0].agid;
  const left = buildAgidAddressReference({
    agid: source.id,
    buildingId: 'BLDG-BOUNDARY',
  });
  const right = buildAgidAddressReference({
    agid: adjacent.id,
    buildingId: 'BLDG-BOUNDARY',
  });
  const match = compareAgidBuildingReferences(
    left.publicReference,
    right.publicReference,
  );

  assert.equal(match.matchClass, 'same-building-boundary');
  assert.equal(match.sameOrNearArea, true);
  assert.equal(match.samePublicBuilding, true);
  assert.equal(match.reviewRequired, true);
  assert.equal(match.subPremiseCompared, false);
});

test('different buildings may share an area without collapsing identity', () => {
  const agid = encodeAGID(10, 20);
  const left = buildAgidAddressReference({
    agid: agid.id,
    buildingId: 'BLDG-A',
  });
  const right = buildAgidAddressReference({
    agid: agid.id,
    buildingId: 'BLDG-B',
  });
  const match = compareAgidBuildingReferences(
    left.publicReference,
    right.publicReference,
  );

  assert.equal(match.matchClass, 'same-grid-area');
  assert.equal(match.sameOrNearArea, true);
  assert.equal(match.samePublicBuilding, false);
});

test('private sub-premise comparison stays outside public building matching', () => {
  const agid = encodeAGID(10, 20);
  const first = buildAgidAddressReference({
    agid: agid.id,
    buildingId: 'BLDG-A',
    subPremise: { unit: 'SYNTH-101', floor: 'SYNTH-1' },
  });
  const same = buildAgidAddressReference({
    agid: agid.id,
    buildingId: 'BLDG-A',
    subPremise: { unit: 'SYNTH-101', floor: 'SYNTH-1' },
  });
  const different = buildAgidAddressReference({
    agid: agid.id,
    buildingId: 'BLDG-A',
    subPremise: { unit: 'SYNTH-202', floor: 'SYNTH-2' },
  });

  assert.equal(
    comparePrivateSubPremiseMetadata(
      first.privateMetadata,
      same.privateMetadata,
    ),
    'same',
  );
  assert.equal(
    comparePrivateSubPremiseMetadata(
      first.privateMetadata,
      different.privateMetadata,
    ),
    'different',
  );
  assert.equal(comparePrivateSubPremiseMetadata(first.privateMetadata, null), 'unknown');
});

test('public component normalization handles width, digits, punctuation, and accents', () => {
  const normalized = normalizeAgidPublicAddress({
    countryCode: 'ｂｒ',
    adminArea: '  São—Teste ',
    locality: 'Cidade   Teste',
    street: '(Rua Exemplo ١٢)',
    houseNumber: '１２ – ٣',
    buildingId: 'BLDG-SYNTH-1',
  });

  assert.equal(normalized.countryCode, 'BR');
  assert.equal(normalized.adminArea, 'SAO TESTE');
  assert.equal(normalized.locality, 'CIDADE TESTE');
  assert.equal(normalized.street, 'RUA EXEMPLO 12');
  assert.equal(normalized.houseNumber, '12-3');
  assert.deepEqual(normalized.excludedFields, ['sub-premise']);
});

test('building and sub-premise contracts reject ambiguous or excessive metadata', () => {
  const agid = encodeAGID(10, 20);

  assert.throws(
    () => buildAgidAddressReference({
      agid: agid.id,
      buildingId: 'synthetic building name with spaces',
    }),
    /buildingId/,
  );
  assert.throws(
    () => buildAgidAddressReference({
      agid: agid.id,
      buildingId: 'BLDG-A',
      subPremise: { recipient: 'not accepted' },
    }),
    /unsupported fields/,
  );
});

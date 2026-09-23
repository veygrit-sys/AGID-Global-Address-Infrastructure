import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAddressQlOfficialPostalArtifacts,
  extractDenmarkOfficialPostalCodes,
  extractFinlandPostiPostalCodes,
  extractLaPosteOfficialPostalScopes,
  extractOnsOfficialPostalScopes,
  extractSwissOfficialPostalScopes,
  type AddressQlOfficialPostalSource,
} from './addressQlOfficialPostalData';

const source: AddressQlOfficialPostalSource = {
  id: 'synthetic-official-postal-source',
  authority: 'Synthetic official authority',
  sourceVersion: '2026-07-27',
  snapshotUrl: 'https://example.test/postcodes',
  releaseUrl: 'https://example.test/releases',
  termsUrl: 'https://example.test/terms',
  correctionUrl: 'https://example.test/corrections',
  reuseRights: 'Synthetic open-data terms permit redistribution with attribution.',
  reuseVerifiedAt: '2026-07-27T00:00:00Z',
  coverageStatement: 'Synthetic complete postcode scope for tests only.',
  attribution: 'Synthetic official authority',
  updatePolicy: 'Synthetic daily snapshot.',
  coverage: 'complete',
};

const digest = (character: string) => `sha256:${character.repeat(64)}`;

test('La Poste rows produce a parent FR scope and explicit neutral territory scopes', () => {
  const scopes = extractLaPosteOfficialPostalScopes([
    { code_postal: '75001', code_commune_insee: '75101' },
    { code_postal: '20167', code_commune_insee: '2A001' },
    { code_postal: '97100', code_commune_insee: '97101' },
    { code_postal: '98714', code_commune_insee: '98735' },
    { code_postal: '98000', code_commune_insee: '99138' },
  ]);

  assert.deepEqual(scopes.FR, ['20167', '75001', '97100', '98714']);
  assert.deepEqual(scopes.GP, ['97100']);
  assert.deepEqual(scopes.PF, ['98714']);
  assert.deepEqual(scopes.MC, ['98000']);
});

test('Posti fixed-width parser retains only the five-digit postal field', () => {
  const row = (postcode: string, type = '1') => {
    const fields = [
      'PONOT',
      '20260725',
      postcode,
      'HELSINKI'.padEnd(30),
      'HELSINGFORS'.padEnd(30),
      'HKI'.padEnd(12),
      'H:fors'.padEnd(12),
      '20200101',
      type,
      'FI1B1',
      'UUSIMAA'.padEnd(30),
      'NYLAND'.padEnd(30),
      '091',
      'HELSINKI'.padEnd(20),
      'HELSINGFORS'.padEnd(20),
      '2',
    ].join('');
    assert.equal(fields.length, 220);
    return fields;
  };

  assert.deepEqual(
    extractFinlandPostiPostalCodes(`${row('00100')}\n${row('22100', '2')}\n`),
    ['00100', '22100'],
  );
});

test('swisstopo CSV separates Liechtenstein without persisting place data', () => {
  const csv = [
    'Ortschaftsname;PLZ4;Zusatzziffer;ZIP_ID;Gemeindename;BFS-Nr;Kantonskurzel',
    'Bern;3000;00;1;Bern;351;BE',
    'Vaduz;9490;00;2;Vaduz;7001;',
  ].join('\n');

  assert.deepEqual(extractSwissOfficialPostalScopes(csv), {
    CH: ['3000'],
    LI: ['9490'],
  });
});

test('Dataforsyningen parser ignores non-postal response properties', () => {
  assert.deepEqual(
    extractDenmarkOfficialPostalCodes(JSON.stringify([
      { nr: '1050', navn: 'Synthetic', visueltcenter_x: 12.5 },
      { nr: '9990', navn: 'Synthetic', bbox: [1, 2, 3, 4] },
    ])),
    ['1050', '9990'],
  );
});

test('ONS live postcode parser separates neutral shipping scopes and excludes BT', () => {
  assert.deepEqual(
    extractOnsOfficialPostalScopes([
      { attributes: { PCDS: 'SW1A 1AA', DOTERM: null } },
      { attributes: { PCDS: 'sw1a 1aa', DOTERM: null } },
      { attributes: { PCDS: 'IM1 1AA', DOTERM: null } },
      { attributes: { PCDS: 'JE1 1AA', DOTERM: null } },
      { attributes: { PCDS: 'GY1 1AA', DOTERM: null } },
      { attributes: { PCDS: 'BT1 1AA', DOTERM: null } },
    ]),
    {
      GB: ['SW1A 1AA'],
      IM: ['IM1 1AA'],
      JE: ['JE1 1AA'],
      GG: ['GY1 1AA'],
      excludedNorthernIrelandCount: 1,
    },
  );
});

test('ONS parser rejects terminated rows and malformed postcodes', () => {
  assert.throws(
    () =>
      extractOnsOfficialPostalScopes([
        { attributes: { PCDS: 'SW1A 1AA', DOTERM: '202601' } },
      ]),
    /terminated and outside the live-only query/,
  );
  assert.throws(
    () =>
      extractOnsOfficialPostalScopes([
        { attributes: { PCDS: 'NOT-A-POSTCODE', DOTERM: null } },
      ]),
    /invalid postcode/,
  );
});

test('multi-country artifacts are conformance-only and aggregate-only', () => {
  const artifacts = buildAddressQlOfficialPostalArtifacts({
    retrievedAt: '2026-07-27T00:00:00Z',
    validUntil: '2027-01-27T00:00:00Z',
    countries: [
      {
        countryCode: 'FR',
        scopeLabel: 'France synthetic scope',
        scopePolicy: 'Parent scope includes explicit territory aliases.',
        source,
        sourceSnapshotDigest: digest('a'),
        postalCodes: ['75001', '97100'],
      },
      {
        countryCode: 'MC',
        scopeLabel: 'Monaco synthetic scope',
        scopePolicy: 'Sovereign scope remains separate from FR.',
        source,
        sourceSnapshotDigest: digest('a'),
        postalCodes: ['98000'],
      },
    ],
  });

  assert.equal(artifacts.runtimeConfig.adapters.length, 2);
  assert.ok(artifacts.runtimeConfig.adapters.every(adapter => adapter.mode === 'conformance'));
  assert.deepEqual(artifacts.trustStore.keys, {});
  assert.equal(
    (artifacts.sourceLedger.trust as Record<string, unknown>).approvedActivation,
    'blocked',
  );
  assert.doesNotMatch(JSON.stringify(artifacts.countries.FR.qualityReport), /75001/);
  assert.equal(artifacts.countries.FR.postalCodes.length, 2);
});

test('malformed official rows fail closed', () => {
  assert.throws(
    () => extractLaPosteOfficialPostalScopes([
      { code_postal: 'wrong', code_commune_insee: '75101' },
    ]),
    /invalid code/,
  );
  assert.throws(
    () => extractDenmarkOfficialPostalCodes('[{"nr":"ABC"}]'),
    /invalid postcode/,
  );
});

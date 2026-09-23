import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  OFFICIAL_MUNICIPALITY_DATASET_SCHEMA_VERSION,
  buildPostalZoneMunicipalityOptionsFromOfficialDataset,
  summarizeOfficialMunicipalityDataset,
  validateOfficialMunicipalityDataset,
  type OfficialMunicipalityDataset,
} from './officialMunicipalityDataset';

function sampleOfficialMunicipalityDataset(): OfficialMunicipalityDataset {
  return {
    schemaVersion: OFFICIAL_MUNICIPALITY_DATASET_SCHEMA_VERSION,
    countryCode: 'FJ',
    generatedAt: '2026-06-20T00:00:00.000Z',
    sourceCatalog: [{
      sourceId: 'fj-official-admin-fixture',
      sourceName: 'Fiji official administrative unit fixture',
      sourceUrl: 'source-fixture:official-admin',
      provider: 'official-source-fixture',
      licenseOrTerms: 'fixture-only',
      retrievedAt: '2026-06-20',
      redistributionStatus: 'allowed',
      notes: ['test fixture shaped like an official normalized dataset'],
    }],
    records: [
      {
        countryCode: 'FJ',
        officialId: 'ba',
        name: 'Ba',
        kind: 'municipality',
        codePart: 'BA',
        sourceId: 'fj-official-admin-fixture',
      },
      {
        countryCode: 'FJ',
        officialId: 'naitasiri',
        name: 'Naitasiri',
        kind: 'municipality',
        codePart: 'NA',
        sourceId: 'fj-official-admin-fixture',
      },
      {
        countryCode: 'FJ',
        officialId: 'ba-town',
        name: 'Ba Town',
        kind: 'town',
        parentOfficialId: 'ba',
        codePart: '01',
        sourceId: 'fj-official-admin-fixture',
      },
      {
        countryCode: 'FJ',
        officialId: 'ba-town-zone-1',
        name: 'Ba Town planning zone',
        kind: 'block',
        parentOfficialId: 'ba-town',
        codePart: 'A1',
        sourceId: 'fj-official-admin-fixture',
      },
    ],
  };
}

test('validates normalized official municipality datasets', () => {
  const validation = validateOfficialMunicipalityDataset(sampleOfficialMunicipalityDataset(), 'FJ');

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
});

test('converts official municipality records into postal designer locality choices', () => {
  const localityChoices = buildPostalZoneMunicipalityOptionsFromOfficialDataset(sampleOfficialMunicipalityDataset());

  assert.equal(localityChoices.length, 2);
  assert.equal(localityChoices[0].name, 'Ba');
  assert.equal(localityChoices[0].towns[0].name, 'Ba Town');
  assert.equal(localityChoices[0].towns[0].chomes[0].label, 'Ba Town planning zone');
  assert.equal(localityChoices[1].name, 'Naitasiri');
  assert.equal(localityChoices[1].towns[0].name, 'Naitasiri delivery area');
});

test('summarizes official municipality coverage for country pack manifests', () => {
  const summary = summarizeOfficialMunicipalityDataset(sampleOfficialMunicipalityDataset(), 'FJ');

  assert.equal(summary.mode, 'official-dataset');
  assert.equal(summary.recordCount, 4);
  assert.equal(summary.municipalityCount, 2);
  assert.equal(summary.townCount, 1);
  assert.equal(summary.blockCount, 1);
  assert.deepEqual(summary.sourceIds, ['fj-official-admin-fixture']);
});

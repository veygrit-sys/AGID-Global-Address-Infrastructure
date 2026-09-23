import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  AGID_POSTAL_COUNTRY_PACK_SCHEMA_ID,
  buildAllAgidPostalCountryPacks,
  buildAgidPostalCountryPack,
  listAgidPostalCountryPackTargetCountries,
  validateAgidPostalCountryPack,
} from './agidPostalCountryPack';
import {
  OFFICIAL_MUNICIPALITY_DATASET_SCHEMA_VERSION,
  type OfficialMunicipalityDataset,
} from './officialMunicipalityDataset';

function officialMunicipalityDatasetFixture(): OfficialMunicipalityDataset {
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
        officialId: 'rewa',
        name: 'Rewa',
        kind: 'municipality',
        codePart: 'RE',
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
    ],
  };
}

function readOfficialMunicipalityDataset(countryCode: string): OfficialMunicipalityDataset {
  return JSON.parse(
    readFileSync(`data/official_municipalities/${countryCode.toLowerCase()}.json`, 'utf8'),
  ) as OfficialMunicipalityDataset;
}

test('builds a Fiji AGID Postal Country Pack with required country-specific layers', () => {
  const pack = buildAgidPostalCountryPack({ countryCode: 'FJ' });

  assert.equal(pack.manifest.schemaId, AGID_POSTAL_COUNTRY_PACK_SCHEMA_ID);
  assert.equal(pack.manifest.countryCode, 'FJ');
  assert.equal(pack.manifest.repositoryName, 'agid-postal-pack-fj');
  assert.equal(pack.manifest.packageName, '@agid/agid-postal-pack-fj');
  assert.equal(pack.manifest.officialStatus, 'draft');
  assert.equal(pack.manifest.containsPersonalData, false);
  assert.equal(pack.manifest.containsRawThirdPartyData, false);
  assert.ok(pack.manifest.requiredLayers.includes('locality-index'));
  assert.ok(pack.manifest.requiredLayers.includes('ports-airports-and-terminals'));
  assert.ok(pack.manifest.requiredLayers.includes('vpl-seed-regions'));
  assert.ok(pack.manifest.requiredLayers.includes('planning-cell-index'));
  assert.ok(pack.manifest.requiredLayers.includes('route-evidence-index'));
  assert.ok(pack.manifest.requiredLayers.includes('quality-evidence-index'));
  assert.equal(pack.countryProfile.terrain, 'archipelago');
});

test('country pack contains stable locality IDs, aliases, landforms, clusters, and VPL seeds', () => {
  const pack = buildAgidPostalCountryPack({ countryCode: 'FJ' });

  assert.ok(pack.localityIndex.length >= 3);
  assert.ok(pack.localityIndex.every(locality => locality.stableId.startsWith('fj-')));
  assert.ok(pack.localityIndex.some(locality => locality.aliases.some(alias => alias.status === 'synthetic')));
  assert.ok(pack.landformIndex.some(landform => landform.kind === 'island'));
  assert.ok(pack.settlementClusterIndex.every(cluster => cluster.agidCellSeed.startsWith('FJ:')));
  assert.ok(pack.vplSeedRegions.length >= 1);
  assert.ok(pack.vplSeedRegions.every(seed => seed.nonAdministrative));
  assert.ok(pack.planningCellIndex.length >= 144);
  assert.ok(pack.planningCellIndex.every(cell => cell.noRawAddress));
  assert.ok(pack.routeEvidenceIndex.length >= 24);
  assert.ok(pack.qualityEvidenceIndex.length >= 24);
});

test('country pack keeps external source data as metadata-only or license-review slots', () => {
  const pack = buildAgidPostalCountryPack({ countryCode: 'FJ' });

  assert.ok(pack.sourceCatalog.some(source => source.sourceId === 'official-boundary-required'));
  assert.ok(pack.sourceCatalog.some(source => source.redistributionStatus === 'license-review-required'));
  assert.ok(pack.licenseLedger.some(entry => entry.redistribution === 'metadata-only'));
  assert.ok(pack.privacyThreatModel.some(rule => rule.includes('Do not store personal addresses')));
  assert.ok(pack.governanceNotes.some(note => note.includes('not an official postal authority dataset')));
});

test('country pack test vectors are country-prefixed and raw-address free', () => {
  const pack = buildAgidPostalCountryPack({ countryCode: 'FJ' });

  assert.ok(pack.testVectors.length >= 1);
  assert.ok(pack.testVectors.every(vector => vector.input.countryCode === 'FJ'));
  assert.ok(pack.testVectors.every(vector => vector.expected.candidateCodePrefix === 'FJ-'));
  assert.ok(pack.testVectors.every(vector => vector.expected.sameMunicipalityOnly));
  assert.ok(pack.testVectors.every(vector => vector.expected.containsPersonalData === false));
});

test('validates the default country pack without errors', () => {
  const validation = validateAgidPostalCountryPack(buildAgidPostalCountryPack({ countryCode: 'FJ' }));

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
});

test('uses normalized official municipality data when provided', () => {
  const pack = buildAgidPostalCountryPack({
    countryCode: 'FJ',
    officialMunicipalityDataset: officialMunicipalityDatasetFixture(),
  });
  const localityNames = new Set(pack.localityIndex.map(locality => locality.name));

  assert.equal(pack.officialMunicipalitySummary.mode, 'official-dataset');
  assert.equal(pack.manifest.counts.officialMunicipalityRecords, 3);
  assert.ok(pack.sourceCatalog.some(source => source.sourceId === 'fj-official-admin-fixture'));
  assert.ok(localityNames.has('Ba'));
  assert.ok(localityNames.has('Rewa'));
  assert.ok(localityNames.has('Ba Town'));
  assert.equal(validateAgidPostalCountryPack(pack).valid, true);
});

test('lists every Postal Zone Designer target country for country-pack export', () => {
  const targets = listAgidPostalCountryPackTargetCountries();
  const codes = targets.map(target => target.countryCode);

  assert.ok(targets.length >= 78);
  assert.equal(new Set(codes).size, targets.length);
  assert.ok(codes.includes('JP'));
  assert.ok(codes.includes('US'));
  assert.ok(codes.includes('GH'));
  assert.ok(codes.includes('FJ'));
  assert.ok(codes.includes('AE'));
  assert.ok(codes.includes('ZW'));
  assert.ok(targets.some(target => target.recommendationSource === 'postal-zone-designer-fallback'));
});

test('builds mature postal countries as reference packs instead of replacement drafts', () => {
  const pack = buildAgidPostalCountryPack({ countryCode: 'JP' });

  assert.equal(pack.manifest.countryCode, 'JP');
  assert.equal(pack.recommendation.tier, 'mature-reliable-postal-code');
  assert.equal(pack.recommendation.recommendedUse, 'official-postal-reference-pack');
  assert.ok(pack.countryProfile.sourceNote.includes('Mature postal code system'));
  assert.ok(pack.recommendation.preseededRecords.some(record => record.includes('without replacing official codes')));
  assert.ok(pack.postalSystemPriors.every(prior => prior.recommendedUse === 'official-postal-reference-pack'));
  assert.ok(pack.testVectors.length >= 1);
  assert.ok(pack.testVectors.every(vector => vector.expected.candidateCodePrefix === null));
  assert.ok(pack.testVectors.every(vector => vector.expected.replacementBlocked === true));
  assert.ok(pack.testVectors.every(vector => vector.expected.blockedReason === 'mature-postal-country-new-code-replacement-blocked'));
  assert.equal(validateAgidPostalCountryPack(pack).valid, true);
});

test('builds the United States pack from state-level official geography metadata', () => {
  const pack = buildAgidPostalCountryPack({
    countryCode: 'US',
    officialMunicipalityDataset: readOfficialMunicipalityDataset('US'),
  });
  const sourceIds = new Set(pack.sourceCatalog.map(source => source.sourceId));
  const localityNames = new Set(pack.localityIndex.map(locality => locality.name));

  assert.equal(pack.manifest.countryCode, 'US');
  assert.equal(pack.recommendation.tier, 'mature-reliable-postal-code');
  assert.equal(pack.recommendation.recommendedUse, 'official-postal-reference-pack');
  assert.equal(pack.officialMunicipalitySummary.mode, 'official-dataset');
  assert.equal(pack.officialMunicipalitySummary.municipalityCount, 51);
  assert.ok(sourceIds.has('usps-web-tools'));
  assert.ok(sourceIds.has('us-census-tiger-line'));
  assert.ok(sourceIds.has('us-census-geocoder'));
  assert.ok(sourceIds.has('hud-usps-zip-crosswalk'));
  assert.ok(localityNames.has('California'));
  assert.ok(localityNames.has('District of Columbia'));
  assert.ok(pack.testVectors.length >= 3);
  assert.ok(pack.testVectors.every(vector => vector.expected.replacementBlocked === true));
  assert.ok(pack.testVectors.every(vector => vector.expected.officialPostalPattern === '^\\d{5}(-\\d{4})?$'));
  assert.equal(validateAgidPostalCountryPack(pack).valid, true);
});

test('builds all target country packs with no raw address or personal data flags', () => {
  const packs = buildAllAgidPostalCountryPacks();
  const codes = packs.map(pack => pack.manifest.countryCode);

  assert.equal(packs.length, listAgidPostalCountryPackTargetCountries().length);
  assert.equal(new Set(codes).size, packs.length);
  assert.ok(packs.every(pack => pack.manifest.containsPersonalData === false));
  assert.ok(packs.every(pack => pack.manifest.containsRawThirdPartyData === false));
  assert.ok(packs.every(pack => pack.manifest.officialStatus === 'draft'));
  assert.ok(packs.every(pack => pack.manifest.counts.planningCells >= 144));
  assert.ok(packs.every(pack => pack.manifest.counts.routeEvidence >= 24));
  assert.ok(packs.every(pack => pack.manifest.counts.qualityEvidence >= 24));
  assert.ok(packs.every(pack => validateAgidPostalCountryPack(pack).valid));
});

test('rejects unsupported country codes instead of creating ambiguous packs', () => {
  assert.throws(
    () => buildAgidPostalCountryPack({ countryCode: 'ZZ' }),
    /not supported for unknown country code/,
  );
});

test('rejects strategy-only countries until Postal Zone Designer presets exist', () => {
  assert.throws(
    () => buildAgidPostalCountryPack({ countryCode: 'PA' }),
    /no Postal Zone Designer target preset/,
  );
});

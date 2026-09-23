import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAgidPostalForgeOssDatasetPack,
  validateAgidPostalForgeOssDatasetPack,
} from './agidPostalForgeDatasetPack';
import { AGID_POSTAL_TARGET_COUNTRIES, AGID_POSTAL_TEMPLATES } from './agidPostalCodeEngine';

test('builds the AGID Postal Forge OSS Dataset Pack manifest from engine constants', () => {
  const pack = buildAgidPostalForgeOssDatasetPack();

  assert.equal(pack.manifest.packId, 'agid-postal-forge-oss-dataset-pack');
  assert.equal(pack.manifest.systemName, 'AGID Postal Forge');
  assert.equal(pack.manifest.aiName, 'AtlasWeaver AI');
  assert.equal(pack.manifest.counts.countries, pack.countries.length);
  assert.equal(pack.manifest.counts.classC, AGID_POSTAL_TARGET_COUNTRIES.length);
  assert.equal(pack.templates.length, Object.keys(AGID_POSTAL_TEMPLATES).length);
  assert.ok(pack.manifest.files.some(file => file.path.endsWith('agid-postal-forge-oss-dataset-pack.json')));
});

test('keeps default target countries draft-only and not official', () => {
  const pack = buildAgidPostalForgeOssDatasetPack();
  const unitedArabEmirates = pack.countries.find(country => country.countryCode === 'AE');
  const fiji = pack.countries.find(country => country.countryCode === 'FJ');

  assert.ok(unitedArabEmirates);
  assert.equal(unitedArabEmirates.class, 'C');
  assert.equal(unitedArabEmirates.recommendedUse, 'primary-agid-postal-draft');
  assert.equal(unitedArabEmirates.governanceStatus, 'not-official');
  assert.equal(unitedArabEmirates.publicationStatus, 'draft-only');
  assert.equal(unitedArabEmirates.generationPolicy.publicationStage, 'primary-draft');
  assert.equal(unitedArabEmirates.generationPolicy.officialReplacementAllowed, false);
  assert.equal(unitedArabEmirates.generationPolicy.namespace, 'AGID-POSTAL:AE:primary-agid-postal');

  assert.ok(fiji);
  assert.equal(fiji.recommendedTemplateId, 'agid-native');
  assert.ok(fiji.privacyDefaults.includes('coarse-by-default'));
});

test('includes source catalog records without bundling restricted third-party data', () => {
  const pack = buildAgidPostalForgeOssDatasetPack();
  const osm = pack.sources.find(source => source.sourceId === 'openstreetmap-open-geography');
  const synthetic = pack.sources.find(source => source.sourceId === 'agid-synthetic-test-fixtures');

  assert.ok(osm);
  assert.equal(osm.redistributionStatus, 'license-review-required');
  assert.ok(osm.confidenceNotes.some(note => /does not bundle OSM/i.test(note)));

  assert.ok(synthetic);
  assert.equal(synthetic.redistributionStatus, 'agid-metadata-redistributable');
  assert.equal(pack.manifest.files.every(file => file.containsPersonalData === false), true);
});

test('classifies mature postal countries as internal baseline only when included as overrides', () => {
  const pack = buildAgidPostalForgeOssDatasetPack({
    profiles: [
      {
        countryCode: 'JP',
        countryName: 'Japan',
        population: 124000000,
        areaKm2: 377975,
        addressFormat: {
          countryCode: 'JP',
          name: 'Japan',
          postalCode: {
            regex: '^\\d{3}-?\\d{4}$',
            source: 'Japan Post official postal code data',
            api: 'japan-post',
            format: 'NNN-NNNN',
          },
        },
      },
    ],
  });
  const japan = pack.countries.find(country => country.countryCode === 'JP');

  assert.ok(japan);
  assert.equal(japan.class, 'A');
  assert.equal(japan.allowed, false);
  assert.equal(japan.recommendedUse, 'existing-postal-only');
  assert.equal(japan.generationPolicy.publicationStage, 'simulation-only');
  assert.equal(japan.generationPolicy.canGenerateVisibleCode, false);
  assert.equal(japan.generationBlockedByMaturePostalSystem, true);
});

test('validates the dataset pack safety, template, source, and privacy boundaries', () => {
  const validation = validateAgidPostalForgeOssDatasetPack();

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.deepEqual(validation.warnings, []);
});

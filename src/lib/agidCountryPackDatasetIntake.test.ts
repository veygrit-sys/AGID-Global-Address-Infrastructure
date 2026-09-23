import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  AGID_COUNTRY_PACK_DATASET_INTAKE_SCHEMA_ID,
  buildAgidCountryPackDatasetIntakePlan,
  validateAgidCountryPackDatasetIntakePlan,
} from './agidCountryPackDatasetIntake';

test('builds a country pack dataset intake plan across priority address systems', () => {
  const plan = buildAgidCountryPackDatasetIntakePlan();

  assert.equal(plan.schemaId, AGID_COUNTRY_PACK_DATASET_INTAKE_SCHEMA_ID);
  assert.equal(plan.containsPersonalData, false);
  assert.equal(plan.containsRawThirdPartyData, false);
  assert.ok(plan.summary.totalCountries >= 50);
  assert.ok(plan.summary.p0Countries >= 12);
  assert.ok(plan.summary.generatedPackCountries >= 40);
  assert.ok(plan.summary.validPackCountries >= 40);
  assert.ok(plan.summary.byClass['strong-postcode'] >= 5);
  assert.ok(plan.summary.byClass['no-postcode'] >= 3);
  assert.ok(plan.summary.byClass['weak-postcode'] >= 2);
  assert.ok(plan.summary.byClass.island >= 2);
});

test('keeps priority countries in explicit dataset classes and stages', () => {
  const records = new Map(buildAgidCountryPackDatasetIntakePlan().records.map(record => [record.countryCode, record]));

  assert.equal(records.get('JP')?.datasetClass, 'strong-postcode');
  assert.equal(records.get('JP')?.stage, 'open-geodata-ready');
  assert.equal(records.get('JP')?.packGenerated, true);
  assert.equal(records.get('US')?.datasetClass, 'strong-postcode');
  assert.equal(records.get('US')?.packGenerated, true);
  assert.equal(records.get('HK')?.datasetClass, 'no-postcode');
  assert.equal(records.get('AE')?.packGenerated, true);
  assert.equal(records.get('FJ')?.datasetClass, 'island');
  assert.equal(records.get('FJ')?.packValid, true);
  assert.equal(records.get('AQ')?.datasetClass, 'polar');
});

test('country pack dataset intake never treats raw third-party or personal data as bundled', () => {
  const plan = buildAgidCountryPackDatasetIntakePlan();

  assert.ok(plan.records.every(record => record.containsPersonalData === false));
  assert.ok(plan.records.every(record => record.containsRawThirdPartyData === false));
  assert.ok(plan.records.every(record => record.minimumPublicDataset.includes('source-catalog')));
  assert.ok(plan.records.every(record => record.minimumPublicDataset.includes('no-raw-address-policy')));
  assert.ok(plan.records.every(record => !record.minimumPublicDataset.includes('raw-addresses')));
});

test('validation catches structural and coverage regressions', () => {
  const plan = buildAgidCountryPackDatasetIntakePlan();
  const validation = validateAgidCountryPackDatasetIntakePlan(plan);

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
});

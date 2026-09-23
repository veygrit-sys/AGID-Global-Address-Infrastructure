import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ADDRESS_MORPHISM_REPOSITORY_PIPELINE,
  ADDRESS_REPOSITORY_ROLES,
  COUNTRY_ADDRESS_GRAPH_EXAMPLES,
  buildCountryRepositoryContract,
  evaluateRepositoryRoleCoverage,
  listRolesForCapability,
} from './addressRepositoryArchitecture';

test('country repositories define the full AGID address infrastructure role set', () => {
  assert.deepEqual(ADDRESS_REPOSITORY_ROLES.map(role => role.id), [
    'country-address-model',
    'administrative-crosswalk',
    'postal-agid-crosswalk',
    'normalization-rules',
    'translation-rules',
    'validation-rules',
    'conformance-test-data',
  ]);

  for (const role of ADDRESS_REPOSITORY_ROLES) {
    assert.equal(role.storesRawPersonalAddress, false);
    assert.ok(role.githubStorage.length > 0);
    assert.ok(role.externalStorage.length > 0);
    assert.ok(role.supports.length > 0);
  }
});

test('address morphism pipeline keeps local country rules independent from AGID core', () => {
  assert.deepEqual(ADDRESS_MORPHISM_REPOSITORY_PIPELINE.map(step => step.owner), [
    'source-country-repo',
    'source-country-repo',
    'agid-core',
    'target-country-repo',
    'target-country-repo',
  ]);
  assert.equal(ADDRESS_MORPHISM_REPOSITORY_PIPELINE[0].id, 'source-native-address');
  assert.equal(ADDRESS_MORPHISM_REPOSITORY_PIPELINE[2].id, 'agid-common-model');
  assert.equal(ADDRESS_MORPHISM_REPOSITORY_PIPELINE.at(-1)?.id, 'validated-output');
});

test('different national address hierarchies can round-trip through the common AGID graph', () => {
  const japan = COUNTRY_ADDRESS_GRAPH_EXAMPLES.find(example => example.countryCode === 'JP');
  const unitedStates = COUNTRY_ADDRESS_GRAPH_EXAMPLES.find(example => example.countryCode === 'US');

  assert.ok(japan);
  assert.ok(unitedStates);
  assert.notDeepEqual(japan?.nativeHierarchy, unitedStates?.nativeHierarchy);
  assert.ok(japan?.commonGraphNodes.includes('country'));
  assert.ok(unitedStates?.commonGraphNodes.includes('country'));
  assert.ok(japan?.canonicalAgidPath[0] === 'JP');
  assert.ok(unitedStates?.canonicalAgidPath[0] === 'US');
});

test('country repository contract covers morphism, translation, normalization, AGID, and validation', () => {
  const contract = buildCountryRepositoryContract('jp');

  assert.equal(contract.countryCode, 'JP');
  assert.equal(contract.repository, 'agid-country-jp');
  assert.equal(contract.canImproveIndependently, true);
  assert.equal(evaluateRepositoryRoleCoverage(contract.requiredRoles).ready, true);
  assert.ok(contract.privacyGates.includes('no-raw-personal-address-in-github'));
  assert.ok(contract.qualityGates.includes('breadcrumb-round-trip'));

  assert.ok(listRolesForCapability('address-morphism').length >= 4);
  assert.ok(listRolesForCapability('address-translation').some(role => role.id === 'translation-rules'));
  assert.ok(listRolesForCapability('agid-generation').some(role => role.id === 'postal-agid-crosswalk'));
  assert.ok(listRolesForCapability('validation').some(role => role.id === 'validation-rules'));
});

test('repository role coverage reports missing infrastructure before a country pack is publishable', () => {
  const coverage = evaluateRepositoryRoleCoverage([
    'country-address-model',
    'administrative-crosswalk',
    'normalization-rules',
  ]);

  assert.equal(coverage.ready, false);
  assert.equal(coverage.required, ADDRESS_REPOSITORY_ROLES.length);
  assert.deepEqual(coverage.missing, [
    'postal-agid-crosswalk',
    'translation-rules',
    'validation-rules',
    'conformance-test-data',
  ]);
});

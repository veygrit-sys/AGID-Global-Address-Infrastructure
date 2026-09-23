import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  findPostalForgePreparationTarget,
  listPostalForgePreparationTargets,
  POSTAL_FORGE_NO_POSTAL_PREPARATION_COUNTRIES,
  POSTAL_FORGE_WEAK_POSTAL_PREPARATION_COUNTRIES,
  summarizePostalForgePreparationTargets,
} from './postalForgePreparation';
import {
  buildPostalZoneDesignerWorkspace,
  listPostalForgeCoverageCountries,
  listPostalZoneDesignerCountries,
} from '../lib/postalZoneDesigner';

const expectedNoPostalCodes = ['HK', 'MO', 'AE', 'QA', 'BH', 'LC', 'JM', 'DM', 'KI', 'NR', 'TV', 'SB', 'VU', 'WS', 'TO'];
const expectedWeakPostalCodes = ['IE', 'KE', 'TZ', 'NG', 'ET', 'UG', 'GH', 'AO', 'CD', 'PG', 'NP', 'KH', 'LA'];

function loadRepositoryCodes() {
  const placement = JSON.parse(readFileSync('data/global_entities/agid-repository-placement.json', 'utf8')) as {
    continents: Array<{ regions: Array<{ countries: Array<{ code: string; repository: string }> }> }>;
  };
  return new Map(
    placement.continents.flatMap(continent => (
      continent.regions.flatMap(region => region.countries.map(country => [country.code, country.repository] as const))
    )),
  );
}

test('Postal Forge preparation target list covers requested no-postal and weak-postal countries', () => {
  const noPostalCodes = POSTAL_FORGE_NO_POSTAL_PREPARATION_COUNTRIES.map(country => country.code);
  const weakPostalCodes = POSTAL_FORGE_WEAK_POSTAL_PREPARATION_COUNTRIES.map(country => country.code);

  assert.deepEqual(noPostalCodes, expectedNoPostalCodes);
  assert.deepEqual(weakPostalCodes, expectedWeakPostalCodes);
  assert.equal(new Set([...noPostalCodes, ...weakPostalCodes]).size, noPostalCodes.length + weakPostalCodes.length);

  const summary = summarizePostalForgePreparationTargets();
  assert.equal(summary.noPostalCode, 15);
  assert.equal(summary.weakPostalCode, 13);
  assert.equal(summary.total, 28);
  assert.equal(summary.primaryAgidPostal, 15);
  assert.equal(summary.supplementalAgidPostal, 13);
});

test('Postal Forge preparation targets are backed by country repositories and safety gates', () => {
  const repositoryByCode = loadRepositoryCodes();

  for (const target of listPostalForgePreparationTargets()) {
    assert.equal(target.repository, `agid-country-${target.code.toLowerCase()}`);
    assert.equal(repositoryByCode.get(target.code), target.repository, `${target.code} must be present in repository placement`);
    assert.ok(target.requiredEvidence.includes('country-or-territory-repository'));
    assert.ok(target.safetyGates.includes('no-raw-personal-address'));
    assert.ok(target.sourceStrategy.length > 24);
  }
});

test('Postal Forge preparation connects to Postal Zone Designer classes and behavior', () => {
  const countries = listPostalZoneDesignerCountries();
  const coverage = listPostalForgeCoverageCountries();
  const countryByCode = new Map(countries.map(country => [country.code, country]));
  const coverageByCode = new Map(coverage.map(country => [country.code, country]));

  for (const code of expectedNoPostalCodes) {
    assert.equal(countryByCode.get(code)?.classHint, 'C', `${code} must be a primary AGID no-postal workspace`);
    assert.equal(coverageByCode.get(code)?.forgeMode, 'primary-agid-postal');
    assert.match(coverageByCode.get(code)?.coverageClass || '', /^no-postal-code-/);
  }

  for (const code of expectedWeakPostalCodes) {
    assert.equal(countryByCode.get(code)?.classHint, 'B', `${code} must be a weak-postal supplemental workspace`);
    assert.equal(coverageByCode.get(code)?.forgeMode, 'supplemental-agid-postal');
    assert.equal(coverageByCode.get(code)?.coverageClass, 'postal-code-available-weak-api');
    assert.equal(coverageByCode.get(code)?.autoFillBehavior, 'postal-format-and-candidates');
  }
});

test('Postal Forge preparation workspaces expose AGID primary and weak-postal supplemental modes', () => {
  const hongKong = buildPostalZoneDesignerWorkspace({ countryCode: 'HK' });
  const kenya = buildPostalZoneDesignerWorkspace({ countryCode: 'KE' });

  assert.equal(findPostalForgePreparationTarget('HK')?.mode, 'agid-primary-postal-zone-design');
  assert.equal(hongKong.country.code, 'HK');
  assert.equal(hongKong.designPlan.classification.class, 'C');
  assert.equal(hongKong.coverage.forgeMode, 'primary-agid-postal');
  assert.equal(hongKong.exportSafe.privateLocationTextIncluded, false);

  assert.equal(findPostalForgePreparationTarget('KE')?.mode, 'agid-supplemental-postal-zone-design');
  assert.equal(kenya.country.code, 'KE');
  assert.equal(kenya.designPlan.classification.class, 'B');
  assert.equal(kenya.coverage.forgeMode, 'supplemental-agid-postal');
  assert.equal(kenya.coverage.autoFillBehavior, 'postal-format-and-candidates');
  assert.equal(kenya.exportSafe.personalDataIncluded, false);
});

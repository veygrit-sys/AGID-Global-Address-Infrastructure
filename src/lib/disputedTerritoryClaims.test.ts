import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  TERRITORY_CLAIM_DISPLAY_POLICIES,
  formatTerritoryClaimSummary,
  getTerritoryClaimOptions,
  isJapaneseClaimTerritory,
  orderTerritoryClaimOptionsByPolicy,
  orderTerritoryClaimOptionsForDisplay,
  resolveTerritoryClaimKey,
} from './disputedTerritoryClaims';
import type { TerritoryClaimOption } from './disputedTerritoryClaims';

test('Japanese territorial claim areas expose only the Japanese display view', () => {
  for (const code of ['JP_TK', 'JP_SK', 'JP_NT']) {
    const options = getTerritoryClaimOptions(code);
    assert.equal(options.length, 1, `${code} should not expose other country display views`);
    assert.equal(options[0].id, 'jp');
    assert.equal(options[0].label, '日本の主張');
    assert.equal(isJapaneseClaimTerritory(code), true);
  }
});

test('Japanese territorial claim areas always order the Japanese claim first for display', () => {
  const syntheticOptions: TerritoryClaimOption[] = [
    {
      id: 'other-admin',
      label: 'Other display',
      shortLabel: 'Other',
      countryLine: 'Other route',
      status: 'administration',
      note: 'Synthetic alternate route.',
      postalGuidance: 'Synthetic alternate route only.',
    },
    {
      id: 'jp',
      label: '日本の主張',
      shortLabel: '日本',
      countryLine: 'Japan',
      status: 'claim',
      note: 'Synthetic Japanese view.',
      postalGuidance: 'Use AGID and source evidence.',
    },
    {
      id: 'neutral',
      label: '中立表示',
      shortLabel: '中立',
      countryLine: 'Neutral area',
      status: 'neutral',
      note: 'Synthetic neutral view.',
      postalGuidance: 'Use coordinates.',
    },
  ];

  for (const code of ['JP_TK', 'JP_SK', 'JP_NT']) {
    const ordered = orderTerritoryClaimOptionsForDisplay(code, syntheticOptions);
    assert.equal(ordered[0].id, 'jp');
  }

  assert.deepEqual(syntheticOptions.map(option => option.id), ['other-admin', 'jp', 'neutral']);
  assert.equal(orderTerritoryClaimOptionsForDisplay('KASH', syntheticOptions)[0].id, 'other-admin');
});

test('Bir Tawil displays as unclaimed first with Egypt-side and Sudan-side logistics views', () => {
  const options = getTerritoryClaimOptions('BT_T');
  assert.deepEqual(options.map(option => option.id), ['neutral', 'eg-route', 'sd-route']);
  assert.equal(options[0].label, '中立 / 未請求地');
  assert.match(formatTerritoryClaimSummary(options[0]), /No national postal system/);
  assert.match(formatTerritoryClaimSummary(options[1]), /logistics route/);
  assert.match(formatTerritoryClaimSummary(options[2]), /logistics route/);
});

test('disputed territory display policy can switch the preferred claim view', () => {
  assert.deepEqual(
    TERRITORY_CLAIM_DISPLAY_POLICIES.map(policy => policy.id),
    ['neutral-first', 'administration-first', 'claim-first', 'logistics-first'],
  );
  assert.equal(getTerritoryClaimOptions('CRIM', 'neutral-first')[0].id, 'neutral');
  assert.equal(getTerritoryClaimOptions('CRIM', 'administration-first')[0].id, 'ru-admin');
  assert.equal(getTerritoryClaimOptions('CRIM', 'claim-first')[0].id, 'ua');
  assert.equal(getTerritoryClaimOptions('BT_T', 'logistics-first')[0].id, 'eg-route');
});

test('display policy never exposes non-Japanese views for Japanese territorial claim areas', () => {
  const syntheticOptions: TerritoryClaimOption[] = [
    {
      id: 'other-admin',
      label: 'Other display',
      shortLabel: 'Other',
      countryLine: 'Other route',
      status: 'administration',
      note: 'Synthetic alternate route.',
      postalGuidance: 'Synthetic alternate route only.',
    },
    {
      id: 'jp',
      label: '日本の主張',
      shortLabel: '日本',
      countryLine: 'Japan',
      status: 'claim',
      note: 'Synthetic Japanese view.',
      postalGuidance: 'Use AGID and source evidence.',
    },
  ];

  const ordered = orderTerritoryClaimOptionsByPolicy('JP_SK', syntheticOptions, 'administration-first');
  assert.equal(ordered[0].id, 'jp');
  assert.equal(getTerritoryClaimOptions('JP_SK', 'administration-first').length, 1);
});

test('territory claim key can be resolved from AGID region names and codes', () => {
  assert.equal(resolveTerritoryClaimKey({ regionCode: 'BT_T' }), 'BT_T');
  assert.equal(resolveTerritoryClaimKey({ regionName: 'Bir Tawil (Terra Nullius)' }), 'BT_T');
  assert.equal(resolveTerritoryClaimKey({ regionCode: 'JP_TK', regionName: 'Takeshima (Disputed - JP Claim)' }), 'JP_TK');
  assert.equal(resolveTerritoryClaimKey({ countryCode: 'jp_sk' }), 'JP_SK');
});

test('registered disputed territories expose at least one claim-aware display option', () => {
  const codes = ['BT_T', 'EH', 'CRIM', 'DONB', 'KASH', 'SCSD', 'EEBD', 'TRNC', 'SLND', 'PMR', 'CYGL', 'JP_NT', 'JP_TK', 'JP_SK'];
  for (const code of codes) {
    assert.ok(getTerritoryClaimOptions(code).length > 0, `${code} should have claim-aware display options`);
  }
});

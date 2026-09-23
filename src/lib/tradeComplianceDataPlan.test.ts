import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getRecommendedFullyFreeTradeComplianceSources,
  getRecommendedInitialTradeComplianceSources,
  getTradeComplianceDataPlan,
  getTradeComplianceSourcesByDomain,
  getTradeComplianceSourcesByPhase,
} from './tradeComplianceDataPlan';

test('initial trade compliance sources avoid high-risk live dependencies', () => {
  const initial = getRecommendedInitialTradeComplianceSources();
  const ids = initial.map((source) => source.id);

  assert.deepEqual(ids, [
    'datasets-harmonized-system',
    'wto-tariff-data',
    'frankfurter-self-host',
  ]);
  for (const source of initial) {
    assert.notEqual(source.licenseOrTermsCheck, 'high');
    assert.notEqual(source.runtimeAccess, 'public-live-api');
    assert.notEqual(source.runtimeAccess, 'key-gated-api');
  }
  assert.deepEqual(
    getRecommendedFullyFreeTradeComplianceSources().map((source) => source.id),
    ids,
  );
});

test('currency plan prefers self-hosted Frankfurter and avoids public APIs as primary', () => {
  const currency = getTradeComplianceSourcesByDomain('currency');
  const frankfurterSelfHost = currency.find((source) => source.id === 'frankfurter-self-host');
  const frankfurter = currency.find((source) => source.id === 'frankfurter-api');
  const exchangerateHost = currency.find((source) => source.id === 'exchangerate-host');

  assert.equal(frankfurterSelfHost?.phase, 'self-host-or-cache');
  assert.equal(frankfurterSelfHost?.runtimeAccess, 'self-hosted-service');
  assert.equal(frankfurter?.phase, 'optional-reference');
  assert.equal(exchangerateHost?.phase, 'avoid-as-primary');
});

test('customs-party checks remain optional and human-review oriented', () => {
  const partyChecks = getTradeComplianceSourcesByDomain('customs-party-check');

  assert.equal(partyChecks.length, 1);
  assert.equal(partyChecks[0].id, 'opencorporates-api');
  assert.equal(partyChecks[0].phase, 'adopt-after-key-or-terms-review');
  assert.ok(partyChecks[0].doNotUseFor.includes('automatic denial of service'));
});

test('plan forbids automatic legal customs decisions', () => {
  const plan = getTradeComplianceDataPlan();

  assert.match(plan.rule, /never turn trade data into an automatic legal customs decision/i);
  assert.match(plan.rule, /do not depend on free-tier/i);
  assert.ok(getTradeComplianceSourcesByPhase('adopt-after-key-or-terms-review').some((source) => source.id === 'un-comtrade-api'));
});

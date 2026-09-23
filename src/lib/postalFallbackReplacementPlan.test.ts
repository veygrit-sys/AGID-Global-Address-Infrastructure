import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

import {
  buildPostalFallbackReplacementPlan,
  POSTAL_FALLBACK_REPLACEMENT_GATES,
  validatePostalFallbackReplacementPlan,
} from './postalFallbackReplacementPlan';

const root = join(process.cwd(), 'src', 'data', 'address_formats');

function walkJsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walkJsonFiles(path) : path.endsWith('.json') ? [path] : [];
  });
}

function loadAddressFormats() {
  return walkJsonFiles(root).map(file => ({
    relativePath: relative(root, file),
    format: JSON.parse(readFileSync(file, 'utf8')),
  }));
}

test('builds a country-specific replacement plan for global postal fallback dependencies', () => {
  const plan = buildPostalFallbackReplacementPlan(loadAddressFormats());
  const errors = validatePostalFallbackReplacementPlan(plan);

  assert.deepEqual(errors, []);
  assert.equal(plan.summary.fallbackDependentCount, 83);
  assert.equal(plan.summary.fallbackDependentProfileCount, 84);
  assert.equal(plan.entries.length, 83);
  assert.ok(plan.summary.standardCountryCount > plan.summary.territoryOrSubregionCount);
  assert.ok(plan.summary.disputedOrSensitiveCount > 0);
  assert.equal(plan.gates.length, POSTAL_FALLBACK_REPLACEMENT_GATES.length);
});

test('requires national postal, government API, official bulk, or official address-register evidence', () => {
  const plan = buildPostalFallbackReplacementPlan(loadAddressFormats());
  const requiredGateIds = new Set(POSTAL_FALLBACK_REPLACEMENT_GATES.map(gate => gate.id));

  for (const entry of plan.entries) {
    assert.ok(entry.requiredGateIds.includes('country-specific-official-source-required'));
    assert.ok(entry.requiredGateIds.includes('official-authority-required'));
    assert.ok(entry.requiredGateIds.includes('redistribution-policy-recorded'));
    assert.ok(entry.requiredGateIds.every(gateId => requiredGateIds.has(gateId)));
    assert.ok(entry.replacementSourceKinds.some(kind => kind.includes('postal') || kind.includes('government') || kind.includes('official')));
    assert.ok(entry.nextAction.includes(entry.countryCode));
    assert.ok(entry.nonClaims.some(nonClaim => nonClaim.includes('not proof')));
  }
});

test('separates standard countries from territories and sensitive regions', () => {
  const plan = buildPostalFallbackReplacementPlan(loadAddressFormats());
  const byCode = new Map(plan.entries.map(entry => [entry.countryCode, entry]));

  assert.equal(byCode.get('DE')?.specialHandling, 'standard-country');
  assert.equal(byCode.get('CL-EA')?.specialHandling, 'territory-or-subregion');
  assert.equal(byCode.get('EH')?.specialHandling, 'disputed-or-sensitive-region');
  assert.equal(byCode.get('XK')?.specialHandling, 'disputed-or-sensitive-region');
  assert.equal(byCode.get('EH')?.profilePaths.length, 2);

  assert.ok(!byCode.get('DE')?.replacementSourceKinds.includes('official-territory-or-parent-authority-source'));
  assert.ok(byCode.get('CL-EA')?.replacementSourceKinds.includes('official-territory-or-parent-authority-source'));
  assert.ok(byCode.get('EH')?.nextAction.includes('do not claim political recognition'));
  for (const replacedCode of ['BE', 'EE', 'IE', 'IT', 'LU', 'SE']) {
    assert.equal(byCode.has(replacedCode), false, `${replacedCode} should have been replaced by country-specific official evidence`);
  }
});

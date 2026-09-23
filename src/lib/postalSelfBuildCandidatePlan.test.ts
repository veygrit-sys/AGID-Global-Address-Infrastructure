import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

import { collectOfficialPostalSourceCoverage } from './officialPostalSourceCoverage';
import {
  buildPostalSelfBuildCandidatePlan,
  POSTAL_SELF_BUILD_CANDIDATE_GATES,
  validatePostalSelfBuildCandidatePlan,
} from './postalSelfBuildCandidatePlan';

const addressFormatRoot = join(process.cwd(), 'src', 'data', 'address_formats');
const postalCountryPackRoot = join(process.cwd(), 'data', 'postal_country_packs');

function walkJsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walkJsonFiles(path) : path.endsWith('.json') ? [path] : [];
  });
}

function loadAddressFormats() {
  return walkJsonFiles(addressFormatRoot).map(file => ({
    relativePath: relative(addressFormatRoot, file),
    format: JSON.parse(readFileSync(file, 'utf8')),
  }));
}

function loadExistingDraftPackCountryCodes() {
  return readdirSync(postalCountryPackRoot)
    .filter(name => statSync(join(postalCountryPackRoot, name)).isDirectory())
    .map(name => name.toUpperCase());
}

function buildPlan() {
  return buildPostalSelfBuildCandidatePlan(loadAddressFormats(), {
    existingDraftPackCountryCodes: loadExistingDraftPackCountryCodes(),
  });
}

test('builds the postal self-build candidate plan from country-specific official-source gaps', () => {
  const inputs = loadAddressFormats();
  const coverageEntries = collectOfficialPostalSourceCoverage(inputs);
  const coverageCandidateCodes: string[] = [];
  const seen = new Set<string>();

  for (const entry of coverageEntries) {
    const isCandidate = entry.countrySpecificOfficialSourceMissing &&
      (entry.postalCodeRequired || entry.hasPostalCodeMetadata);
    if (!isCandidate || seen.has(entry.countryCode)) continue;
    seen.add(entry.countryCode);
    coverageCandidateCodes.push(entry.countryCode);
  }

  const plan = buildPostalSelfBuildCandidatePlan(inputs, {
    existingDraftPackCountryCodes: loadExistingDraftPackCountryCodes(),
  });
  const errors = validatePostalSelfBuildCandidatePlan(plan);

  assert.deepEqual(errors, []);
  assert.equal(plan.summary.candidateCount, 69);
  assert.equal(plan.summary.strictRequiredCount, 49);
  assert.equal(plan.summary.metadataOnlyCount, 20);
  assert.equal(plan.summary.existingDraftPackCount, 8);
  assert.equal(plan.summary.missingDraftPackCount, 61);
  assert.equal(plan.summary.disputedOrSensitiveCount, 9);
  assert.equal(plan.summary.territoryOrSubregionCount, 2);
  assert.equal(plan.summary.standardCountryCount, 58);
  assert.equal(plan.gates.length, POSTAL_SELF_BUILD_CANDIDATE_GATES.length);
  assert.deepEqual(plan.entries.map(entry => entry.countryCode), coverageCandidateCodes);
});

test('separates existing AGID draft packs from missing self-build packs', () => {
  const plan = buildPlan();
  const byCode = new Map(plan.entries.map(entry => [entry.countryCode, entry]));
  const existingPackCodes = plan.entries
    .filter(entry => entry.existingDraftPackState === 'draft-pack-present')
    .map(entry => entry.countryCode);

  assert.deepEqual(existingPackCodes, ['ER', 'KM', 'BZ', 'KP', 'AF', 'KH', 'LA', 'MM']);
  for (const code of ['AF', 'BZ', 'ER', 'KH', 'KM', 'KP', 'LA', 'MM']) {
    assert.equal(byCode.get(code)?.existingDraftPackState, 'draft-pack-present');
    assert.ok(byCode.get(code)?.nextAction.includes('existing AGID draft postal-equivalent pack'));
  }

  for (const code of ['DE', 'CN', 'GT', 'XK', 'EH']) {
    assert.equal(byCode.get(code)?.existingDraftPackState, 'draft-pack-missing');
    assert.ok(byCode.get(code)?.nextAction.includes('Create'));
  }
});

test('keeps priorities, sensitive handling, and non-claims explicit', () => {
  const plan = buildPlan();
  const byCode = new Map(plan.entries.map(entry => [entry.countryCode, entry]));
  const serializedPlan = JSON.stringify(plan);

  assert.equal(byCode.get('DE')?.priority, 'strict-required');
  assert.equal(byCode.get('BZ')?.priority, 'metadata-only');
  assert.equal(byCode.get('CL-EA')?.specialHandling, 'territory-or-subregion');
  assert.equal(byCode.get('CL-JF')?.specialHandling, 'territory-or-subregion');
  assert.equal(byCode.get('EH')?.specialHandling, 'disputed-or-sensitive-region');
  assert.equal(byCode.get('XK')?.specialHandling, 'disputed-or-sensitive-region');
  assert.ok(byCode.get('EH')?.nextAction.includes('do not claim political recognition'));

  for (const entry of plan.entries) {
    assert.ok(entry.countrySpecificOfficialSourceMissing);
    assert.ok(entry.postalCodeRequired || entry.hasPostalCodeMetadata);
    assert.ok(entry.nonClaims.some(nonClaim => nonClaim.includes('not official')));
    assert.ok(entry.requiredGateIds.includes('draft-pack-is-not-official'));
    assert.ok(entry.requiredGateIds.includes('public-redistributable-fixtures-only'));
  }

  assert.doesNotMatch(serializedPlan, /tenantId|requestId|addressId|recipientId|credentialSecretRef/i);
  assert.doesNotMatch(serializedPlan, /credentialVersionRef|privateKey|proofSecret|witnessSecret/i);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildNoPostalCodeCountryPilotProposal,
  rankNoPostalCodePilotCountries,
  recommendFirstNoPostalCodePilotCountry,
  runNoPostalCodeModelExperiment,
} from './noPostalCodePostalModelResearch';

test('selects Gambia as the first no-postal-code country sample', () => {
  const first = recommendFirstNoPostalCodePilotCountry();
  const ranking = rankNoPostalCodePilotCountries();
  const southSudan = ranking.find(country => country.countryCode === 'SS');

  assert.equal(first.countryCode, 'GM');
  assert.equal(first.terrainProfile, 'route-corridor');
  assert.ok(first.score > 0.8);
  assert.ok(first.rationale.some(reason => reason.includes('route-corridor')));
  assert.ok(southSudan?.blockers.includes('high-risk-country-not-first-sample'));
  assert.ok(ranking.indexOf(first) < ranking.findIndex(country => country.countryCode === 'RW'));
});

test('route-corridor AGID model wins for the Gambia experiment', () => {
  const experiment = runNoPostalCodeModelExperiment('GM');
  const grid = experiment.rankedModels.find(model => model.modelId === 'pure-grid-agid');

  assert.equal(experiment.country.countryCode, 'GM');
  assert.equal(experiment.recommended.modelId, 'route-corridor-agid');
  assert.equal(experiment.recommended.templateId, 'agid-native');
  assert.deepEqual(experiment.recommended.hierarchyPath, ['country', 'region', 'corridor', 'locality', 'delivery-zone']);
  assert.ok(experiment.recommended.dimensions.terrainFit >= 0.85);
  assert.ok(grid);
  assert.ok(experiment.recommended.score > grid.score);
  assert.equal(experiment.safety.noRawAddressIncluded, true);
  assert.equal(experiment.safety.generatedCodesArePilotOnly, true);
});

test('builds an adoptable one-country pilot proposal without official or raw-address claims', () => {
  const proposal = buildNoPostalCodeCountryPilotProposal('GM');

  assert.equal(proposal.countryCode, 'GM');
  assert.equal(proposal.status, 'pilot-ready-review');
  assert.equal(proposal.selectedModelId, 'route-corridor-agid');
  assert.equal(proposal.selectedTemplateId, 'agid-native');
  assert.equal(proposal.designStage, 'pilot');
  assert.equal(proposal.canClaimOfficial, false);
  assert.equal(proposal.outputSafety.rawAddressIncluded, false);
  assert.equal(proposal.outputSafety.personalDataIncluded, false);
  assert.equal(proposal.outputSafety.officialPostalCodeClaimIncluded, false);
  assert.ok(proposal.safeExport.privateLocationTextIncluded === false);
  assert.ok(proposal.safeExport.personalDataIncluded === false);
  assert.ok(proposal.sampleCodes.length >= 4);
  assert.ok(proposal.sampleCodes.every(code => code.startsWith('GM-')));
  assert.ok(proposal.adoptionChecklist.some(item => item.includes('government')));
  assert.ok(proposal.qualityGates.some(item => item.includes('No official postal code claim')));
  assert.ok(proposal.requiredCountryPackFiles.includes('route-evidence-index.json'));
});

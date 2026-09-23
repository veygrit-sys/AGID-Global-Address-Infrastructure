import assert from 'node:assert/strict';
import { test } from 'node:test';

import { encodeAGID } from './agid';
import { AGID_POSTAL_TARGET_COUNTRIES } from './agidPostalCodeEngine';
import { POSTAL_FORGE_WEAK_POSTAL_PREPARATION_COUNTRIES } from '../postal/postalForgePreparation';
import {
  POSTAL_ZONE_DESIGNER_MODEL_VERSION,
  POSTAL_ZONE_AI_NAME,
  POSTAL_ZONE_CREATION_SYSTEM_NAME,
  buildPostalZoneLocalityChoices,
  buildPostalZoneDesignerWorkspace,
  listPostalForgeCoverageCountries,
  listPostalZoneDesignerCountries,
  listPostalZoneDesignerTemplates,
  proposePostalZoneCodeForLocality,
} from './postalZoneDesigner';

test('Postal Zone Designer builds a Class C draft workspace with math, GIS, VPL, and governance gates', () => {
  const workspace = buildPostalZoneDesignerWorkspace({
    countryCode: 'FJ',
    now: '2026-06-20T00:00:00.000Z',
  });

  assert.equal(workspace.modelVersion, POSTAL_ZONE_DESIGNER_MODEL_VERSION);
  assert.equal(workspace.systemName, POSTAL_ZONE_CREATION_SYSTEM_NAME);
  assert.equal(workspace.aiName, POSTAL_ZONE_AI_NAME);
  assert.equal(workspace.country.code, 'FJ');
  assert.equal(workspace.designPlan.classification.class, 'C');
  assert.equal(workspace.designPlan.classification.allowed, true);
  assert.equal(workspace.aiQuality.aiName, POSTAL_ZONE_AI_NAME);
  assert.equal(workspace.exportSafe.systemName, POSTAL_ZONE_CREATION_SYSTEM_NAME);
  assert.equal(workspace.exportSafe.aiName, POSTAL_ZONE_AI_NAME);
  assert.ok(workspace.exportSafe.aiQualityScore >= 0 && workspace.exportSafe.aiQualityScore <= 1);
  assert.equal(workspace.formatSuggestion.canCreateNewCode, true);
  assert.match(workspace.formatSuggestion.formatPreview, /municipality/);
  assert.ok(workspace.formatOptions.length >= 4);
  assert.equal(workspace.formatOptions[0].templateId, workspace.templateId);
  assert.equal(workspace.formatOptions[0].selectable, true);
  assert.equal(workspace.localityProposal.ok, true);
  assert.ok(workspace.localityProposal.code?.startsWith('FJ-'));
  assert.equal(workspace.localityProposal.theoremChecks.withinSingleMunicipality, true);
  assert.equal(workspace.stage, 'draft');
  assert.equal(workspace.canClaimOfficial, false);
  assert.ok(workspace.minimumCodeCount.operationalLowerBound >= 1);
  assert.equal(workspace.designPlan.existence.mathematicallyConstructible, true);
  assert.equal(workspace.virtualLocalityNeed.dataModel.legalStatus, 'non_administrative');
  assert.ok(workspace.virtualLocalityCodes.codes.length >= 1);
  assert.ok(workspace.gisChecklist.some(item => item.includes('national boundary')));
  assert.ok(workspace.governanceChecklist.some(item => item.includes('Do not present')));
});

test('country selection immediately recommends a human-facing postal format', () => {
  const fiji = buildPostalZoneDesignerWorkspace({ countryCode: 'FJ' });
  const japan = buildPostalZoneDesignerWorkspace({ countryCode: 'JP' });

  assert.equal(fiji.formatSuggestion.templateId, 'agid-native');
  assert.equal(fiji.formatSuggestion.canCreateNewCode, true);
  assert.ok(fiji.formatSuggestion.exampleCode.startsWith('FJ-'));
  assert.ok(fiji.formatSuggestion.simpleReasons.some(reason => /Island-aware|Locality-first/.test(reason)));

  assert.equal(japan.formatSuggestion.canCreateNewCode, false);
  assert.match(japan.formatSuggestion.formatPreview, /NNN-NNNN|NNN/);
  assert.equal(japan.localityProposal.ok, false);
  assert.equal(japan.localityProposal.blockedReason, 'mature-postal-country-new-code-replacement-blocked');
});

test('real no-postal-country example generation produces safe Fiji draft candidates', () => {
  const workspace = buildPostalZoneDesignerWorkspace({ countryCode: 'FJ' });

  assert.equal(workspace.exampleGeneration.countryCode, 'FJ');
  assert.equal(workspace.exampleGeneration.countryClass, 'C');
  assert.equal(workspace.exampleGeneration.actualNoPostalCountryExample, true);
  assert.equal(workspace.exampleGeneration.summary.rawAddressIncluded, false);
  assert.equal(workspace.exampleGeneration.summary.personalDataIncluded, false);
  assert.ok(workspace.exampleGeneration.candidates.length >= 3);
  assert.ok(workspace.exampleGeneration.candidates.every(candidate => candidate.code?.startsWith('FJ-')));
  assert.ok(workspace.exampleGeneration.candidates.every(candidate => candidate.boundarySafe));
  assert.ok(workspace.exampleGeneration.methodSteps.some(step => step.includes('stable locality IDs')));
  assert.ok(workspace.exampleGeneration.usabilityImprovements.some(item => item.includes('raw scores')));
  assert.deepEqual(workspace.exportSafe.exampleCodes, workspace.exampleGeneration.candidates.map(candidate => candidate.code));
});

test('postal code designer proposes a format but still lets operators choose other possible formats', () => {
  const workspace = buildPostalZoneDesignerWorkspace({
    countryCode: 'FJ',
    templateId: 'uk-like',
  });

  assert.equal(workspace.templateId, 'uk-like');
  assert.equal(workspace.formatOptions[0].templateId, 'uk-like');
  assert.ok(workspace.formatOptions.some(option => option.templateId === 'agid-native'));
  assert.ok(workspace.formatOptions.some(option => option.templateId === 'ghana-like'));
  assert.ok(workspace.formatOptions.every(option => option.selectable));
  assert.equal(workspace.formatSuggestion.label, 'UK-like outward/inward');
});

test('mature postal countries show possible formats as simulation-only except the existing official choice', () => {
  const workspace = buildPostalZoneDesignerWorkspace({ countryCode: 'JP' });

  assert.equal(workspace.formatOptions[0].selectable, true);
  assert.ok(workspace.formatOptions.some(option => option.selectable === false));
  assert.equal(workspace.formatOptions[0].useAs, 'official-existing');
});

test('municipality, town, and chome selection proposes a scoped postal code without exposing algorithm detail', () => {
  const base = buildPostalZoneDesignerWorkspace({ countryCode: 'FJ' });
  const municipality = base.localityChoices[1];
  const town = municipality.towns[2];
  const chome = town.chomes[2];
  const workspace = buildPostalZoneDesignerWorkspace({
    countryCode: 'FJ',
    selectedMunicipalityId: municipality.id,
    selectedTownId: town.id,
    selectedChomeId: chome.id,
  });

  assert.equal(workspace.localityProposal.ok, true);
  assert.ok(workspace.localityProposal.code);
  assert.deepEqual(workspace.localityProposal.displayPath, [
    'Fiji',
    municipality.name,
    town.name,
    chome.label,
  ]);
  assert.equal(workspace.localityProposal.selection.municipalityId, municipality.id);
  assert.equal(workspace.localityProposal.selection.townId, town.id);
  assert.equal(workspace.localityProposal.selection.chomeId, chome.id);
});

test('postal code proposal cannot span multiple municipalities', () => {
  const country = listPostalZoneDesignerCountries().find(item => item.code === 'FJ');
  assert.ok(country);
  const workspace = buildPostalZoneDesignerWorkspace({ countryCode: 'FJ' });
  const choices = buildPostalZoneLocalityChoices(country);
  const proposal = proposePostalZoneCodeForLocality({
    country,
    designPlan: workspace.designPlan,
    templateId: workspace.templateId,
    localityChoices: choices,
    municipalityId: choices[0].id,
    townId: choices[0].towns[0].id,
    extraMunicipalityIds: [choices[1].id],
  });

  assert.equal(proposal.ok, false);
  assert.equal(proposal.code, null);
  assert.equal(proposal.blockedReason, 'postal-zone-cannot-cross-municipalities');
  assert.equal(proposal.theoremChecks.withinSingleMunicipality, false);
});

test('Class A mature postal countries are simulation-only and non-replacement guarded', () => {
  const workspace = buildPostalZoneDesignerWorkspace({ countryCode: 'JP' });

  assert.equal(workspace.designPlan.classification.class, 'A');
  assert.equal(workspace.designPlan.classification.allowed, false);
  assert.equal(workspace.stage, 'simulation');
  assert.equal(workspace.designPlan.publication.theoremChecks.nonReplacement, false);
  assert.equal(workspace.designPlan.generationPolicy.publicationStage, 'simulation-only');
  assert.equal(workspace.designPlan.generationPolicy.canGenerateVisibleCode, false);
  assert.ok(workspace.safetyBoundaries.some(boundary => boundary.id === 'non-replacement' && boundary.severity === 'block'));
  assert.equal(workspace.exportSafe.publicPublicationStatus, 'blocked');
  assert.equal(workspace.exportSafe.generationPolicy.publicationStage, 'simulation-only');
});

test('Postal Zone Designer exports Postal Forge generation policy without raw address data', () => {
  const workspace = buildPostalZoneDesignerWorkspace({
    countryCode: 'FJ',
    governance: {
      government: 0.8,
      municipality: 0.8,
      carrier: 0.8,
      platform: 0.8,
    },
  });

  assert.equal(workspace.designPlan.generationPolicy.publicationStage, 'primary-draft');
  assert.equal(workspace.designPlan.generationPolicy.officialReplacementAllowed, false);
  assert.equal(workspace.exportSafe.generationPolicy.publicationStage, 'primary-draft');
  assert.equal(workspace.exportSafe.generationPolicy.namespace, 'AGID-POSTAL:FJ:primary-agid-postal');
  assert.equal(workspace.exportSafe.privateLocationTextIncluded, false);
  assert.equal(workspace.exportSafe.personalDataIncluded, false);
});

test('Postal Zone Designer rejects AGID cells whose country prefix does not match the selected country', () => {
  const qatarAgid = encodeAGID(25.2854, 51.531).id;
  const workspace = buildPostalZoneDesignerWorkspace({
    countryCode: 'FJ',
    selectedAgids: [qatarAgid],
    now: '2026-06-20T00:00:00.000Z',
  });

  assert.equal(workspace.editSummary.integratedCount, 0);
  assert.equal(workspace.editSummary.rejectedCount, 1);
  assert.match(workspace.editRecord.rejectedAgids[0]?.reason || '', /country/);
});

test('Postal Zone Designer country and template catalogs include ready planning choices', () => {
  const countries = listPostalZoneDesignerCountries();
  const templates = listPostalZoneDesignerTemplates();

  assert.ok(countries.some(country => country.classHint === 'A'));
  assert.ok(countries.some(country => country.classHint === 'B'));
  assert.ok(countries.some(country => country.classHint === 'C'));
  assert.ok(countries.some(country => country.code === 'NG' && country.classHint === 'B'));
  assert.ok(countries.some(country => country.code === 'FJ' && country.classHint === 'C'));
  assert.ok(templates.some(template => template.id === 'agid-native'));
  assert.ok(templates.some(template => template.id === 'ghana-like'));
});

test('Postal Forge coverage catalog covers all no-postal target countries and weak postal countries', () => {
  const coverage = listPostalForgeCoverageCountries();
  const byCode = new Map(coverage.map(country => [country.code, country]));
  const preparationWeakPostalCodes = new Set(POSTAL_FORGE_WEAK_POSTAL_PREPARATION_COUNTRIES.map(country => country.code));

  for (const target of AGID_POSTAL_TARGET_COUNTRIES) {
    const entry = byCode.get(target.code);
    assert.ok(entry, `missing Postal Forge coverage for ${target.code}`);
    if (preparationWeakPostalCodes.has(target.code)) {
      assert.equal(entry?.coverageClass, 'postal-code-available-weak-api');
      assert.equal(entry?.forgeMode, 'supplemental-agid-postal');
      continue;
    }
    assert.equal(entry?.forgeMode, 'primary-agid-postal');
    assert.match(entry?.coverageClass || '', /^no-postal-code-/);
  }

  for (const weakPostalCountry of ['AF', 'BD', 'IN', 'NG', 'PK', 'PH', 'VN', ...preparationWeakPostalCodes]) {
    const entry = byCode.get(weakPostalCountry);
    assert.ok(entry, `missing weak-postal coverage for ${weakPostalCountry}`);
    assert.equal(entry?.coverageClass, 'postal-code-available-weak-api');
    assert.equal(entry?.autoFillBehavior, 'postal-format-and-candidates');
  }
});

test('Postal Forge exposes weak postal countries as supplemental AGID planning workspaces', () => {
  const workspace = buildPostalZoneDesignerWorkspace({ countryCode: 'NG' });

  assert.equal(workspace.country.code, 'NG');
  assert.equal(workspace.designPlan.classification.class, 'B');
  assert.equal(workspace.coverage.coverageClass, 'postal-code-available-weak-api');
  assert.equal(workspace.coverage.forgeMode, 'supplemental-agid-postal');
  assert.equal(workspace.exportSafe.coverageClass, 'postal-code-available-weak-api');
  assert.equal(workspace.exportSafe.forgeMode, 'supplemental-agid-postal');
  assert.equal(workspace.exportSafe.privateLocationTextIncluded, false);
  assert.equal(workspace.exportSafe.personalDataIncluded, false);
});

test('privacy and data trust gates keep high-risk or weak data designs from public publication', () => {
  const workspace = buildPostalZoneDesignerWorkspace({
    countryCode: 'FJ',
    dataQuality: { address: 0.25, road: 0.25, admin: 0.35, population: 0.3, boundary: 0.35, threshold: 0.7 },
    privacy: {
      addressEntitiesPerArea: 4,
      populationPerArea: 9,
      minimumAddressEntities: 10,
      minimumPopulation: 50,
      highRisk: true,
    },
  });

  assert.equal(workspace.designPlan.dataTrust.readyForPublication, false);
  assert.equal(workspace.designPlan.privacy.publishable, false);
  assert.notEqual(workspace.designPlan.publication.status, 'publishable');
  assert.ok(['blocked', 'draft-only', 'review-required'].includes(workspace.aiQuality.grade));
  assert.ok(workspace.aiQuality.nextActions.length > 0);
  assert.ok(workspace.safetyBoundaries.some(boundary => boundary.id === 'anonymity-floor' && boundary.satisfied === false));
});

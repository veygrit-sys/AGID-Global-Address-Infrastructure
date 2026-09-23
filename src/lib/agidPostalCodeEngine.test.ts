import assert from 'node:assert/strict';
import { test } from 'node:test';

import { encodeAGID } from './agid';
import {
  AGID_POSTAL_TARGET_COUNTRIES,
  AGID_POSTAL_CREATION_AI_NAME,
  AGID_POSTAL_CREATION_SYSTEM_NAME,
  buildAgidPostalDesignPlan,
  buildAgidPostalHierarchicalCode,
  buildAgidPostalVariableHierarchyCode,
  buildAgidVirtualPostalLocalityCode,
  classifyAgidPostalCountries,
  classifyAgidPostalCountry,
  createAgidPostalZoneEditRecord,
  decideAgidPostalOperationalStatus,
  decideAgidPostalPublication,
  evaluateAgidPostalCodeChurnBudget,
  evaluateAgidPostalExistenceCondition,
  evaluateAgidPostalLocalitySeparation,
  evaluateAgidPostalPlaneSeparation,
  evaluateAgidPostalSplitDecision,
  evaluateAgidPostalVirtualLocalityNeed,
  estimateAgidPostalHierarchyCapacity,
  estimateAgidPostalMinimumCodeCount,
  estimateAgidPostalAreas,
  evaluateAgidPostalDataTrust,
  evaluateAgidPostalGovernance,
  evaluateAgidPostalPrivacy,
  generateAgidPostalAreaCode,
  generateAgidVirtualPostalLocalityCodes,
  evaluateAgidPostalAiQuality,
  learnAgidPostalCountryDesign,
  planAgidPostalFutureCapacity,
  recommendAgidPostalAdaptiveHierarchy,
  recommendAgidPostalTemplate,
  summarizeAgidPostalZoneEditRecord,
  updateAgidPostalZoneEditRecord,
} from './agidPostalCodeEngine';

test('classifies UPU postal-code-not-required countries as C and allows AGID postal generation', () => {
  const classification = classifyAgidPostalCountry({ countryCode: 'AE', countryName: 'United Arab Emirates' });
  assert.equal(classification.class, 'C');
  assert.equal(classification.allowed, true);
  assert.equal(classification.generationMode, 'primary-agid-postal');
  assert.ok(AGID_POSTAL_TARGET_COUNTRIES.some(country => country.code === 'AE'));
});

test('classifies reliable postal countries as A and blocks replacement-style generation', () => {
  const classification = classifyAgidPostalCountry({
    countryCode: 'JP',
    countryName: 'Japan',
    addressFormat: {
      countryCode: 'JP',
      name: 'Japan',
      postalCode: {
        regex: '^\\d{3}-\\d{4}$',
        api: 'https://zipcloud.ibsnet.co.jp/api/search?zipcode={{postcode}}',
        source: 'Japan Post / zipcloud / official',
        format: 'NNN-NNNN',
      },
      addressRules: {
        postalCode: { required: true, usage: 'required' },
        openSourceIds: ['japan-postcode-api'],
      },
    },
  });
  assert.equal(classification.class, 'A');
  assert.equal(classification.allowed, false);
});

test('allows weak postal countries only as supplemental AGID postal areas', () => {
  const classification = classifyAgidPostalCountry({
    countryCode: 'ZZ',
    countryName: 'Weak Postal Example',
    addressFormat: {
      countryCode: 'ZZ',
      name: 'Weak Postal Example',
      postalCode: {
        regex: '^\\d{5}$',
        api: null,
        source: 'GeoNames postal / regional table',
        format: 'NNNNN',
      },
      addressRules: {
        postalCode: { required: false, usage: 'used' },
        openSourceIds: ['geonames-postal'],
      },
    },
  });
  assert.equal(classification.class, 'B');
  assert.equal(classification.allowed, true);
  assert.equal(classification.generationMode, 'supplemental-agid-postal');
});

test('builds an A/B/C country classification list and keeps generation eligibility to B/C', () => {
  const list = classifyAgidPostalCountries([
    {
      countryCode: 'JP',
      countryName: 'Japan',
      addressFormat: {
        countryCode: 'JP',
        name: 'Japan',
        postalCode: {
          regex: '^\\d{3}-\\d{4}$',
          api: 'https://zipcloud.ibsnet.co.jp/api/search?zipcode={{postcode}}',
          source: 'Japan Post / zipcloud / official',
          format: 'NNN-NNNN',
        },
      },
    },
    {
      countryCode: 'ZZ',
      countryName: 'Weak Postal Example',
      addressFormat: {
        countryCode: 'ZZ',
        name: 'Weak Postal Example',
        postalCode: {
          regex: '^\\d{5}$',
          api: null,
          source: 'GeoNames postal / regional table',
          format: 'NNNNN',
        },
      },
    },
  ]);

  assert.ok(list.classA.some(country => country.countryCode === 'JP'));
  assert.ok(list.classB.some(country => country.countryCode === 'ZZ'));
  assert.ok(list.classC.some(country => country.countryCode === 'AE'));
  assert.ok(list.eligible.every(country => country.class === 'B' || country.class === 'C'));
  assert.ok(list.blocked.every(country => country.class === 'A'));
});

test('merges target country profiles with live metadata instead of losing UPU-not-required evidence', () => {
  const list = classifyAgidPostalCountries([
    {
      countryCode: 'AE',
      countryName: 'United Arab Emirates',
      population: 9900000,
      areaKm2: 83600,
      evidenceSources: ['local-addressing-profile'],
    },
  ]);
  const ae = list.classC.find(country => country.countryCode === 'AE');
  assert.ok(ae);
  assert.ok(ae.sources.includes('upu-postal-code-not-required-2025-user-supplied'));
  assert.ok(ae.sources.includes('local-addressing-profile'));
});

test('generates a country-prefixed AGID postal area code and prevents cross-country use', () => {
  const aeAgid = encodeAGID(24.4539, 54.3773).id;
  const generated = generateAgidPostalAreaCode({
    countryCode: 'AE',
    agid: aeAgid,
    templateId: 'japan-like',
  });
  assert.equal(generated.ok, true);
  assert.match(generated.code || '', /^AE-\d{3}-\d{4}$/);

  const blocked = generateAgidPostalAreaCode({
    countryCode: 'QA',
    agid: aeAgid,
    templateId: 'japan-like',
  });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.blockedReason, 'agid-prefix-crosses-country-boundary');
});

test('attaches a generation policy that prevents official postal replacement', () => {
  const aeAgid = encodeAGID(24.4539, 54.3773).id;
  const generated = generateAgidPostalAreaCode({
    countryCode: 'AE',
    agid: aeAgid,
    templateId: 'japan-like',
  });

  assert.equal(generated.generationPolicy?.publicationStage, 'primary-draft');
  assert.equal(generated.generationPolicy?.canGenerateVisibleCode, true);
  assert.equal(generated.generationPolicy?.officialReplacementAllowed, false);
  assert.equal(generated.generationPolicy?.canBecomeOfficialAfterApproval, true);
  assert.equal(generated.generationPolicy?.requiresAuthorityApproval, true);
  assert.equal(generated.generationPolicy?.namespace, 'AGID-POSTAL:AE:primary-agid-postal');
  assert.equal(generated.generationPolicy?.visibleCode.countryPrefixRequired, true);
  assert.equal(generated.generationPolicy?.privacyFloor.minimumAddressEntities, 10);

  const jpAgid = encodeAGID(35.6812, 139.7671).id;
  const blocked = generateAgidPostalAreaCode({
    countryCode: 'JP',
    agid: jpAgid,
    templateId: 'japan-like',
    profile: {
      countryCode: 'JP',
      countryName: 'Japan',
      addressFormat: {
        countryCode: 'JP',
        name: 'Japan',
        postalCode: {
          regex: '^\\d{3}-\\d{4}$',
          api: 'https://zipcloud.ibsnet.co.jp/api/search?zipcode={{postcode}}',
          source: 'Japan Post / zipcloud / official',
          format: 'NNN-NNNN',
        },
      },
    },
  });

  assert.equal(blocked.ok, false);
  assert.equal(blocked.generationPolicy?.publicationStage, 'simulation-only');
  assert.equal(blocked.generationPolicy?.canGenerateVisibleCode, false);
  assert.equal(blocked.generationPolicy?.requiresExistingPostalContext, true);
  assert.equal(blocked.generationPolicy?.officialReplacementAllowed, false);
});

test('recommends templates from population, terrain, and country scale', () => {
  const archipelago = recommendAgidPostalTemplate({
    countryCode: 'FJ',
    countryName: 'Fiji archipelago',
    population: 900000,
    areaKm2: 18272,
    evidenceSources: ['archipelago', 'island'],
  });
  assert.equal(archipelago.templateId, 'agid-native');
  assert.equal(archipelago.terrain, 'archipelago');

  const largePopulation = recommendAgidPostalTemplate({
    countryCode: 'NG',
    countryName: 'Large population example',
    population: 220000000,
    areaKm2: 923000,
  });
  assert.equal(largePopulation.templateId, 'india-like');
});

test('prelearns geography, population, and terrain priors for insufficient postal countries', () => {
  const learning = learnAgidPostalCountryDesign({
    countryCode: 'FJ',
    countryName: 'Fiji archipelago',
    population: 900000,
    areaKm2: 18272,
    evidenceSources: ['archipelago', 'island', 'postal-code-not-required'],
  });

  assert.equal(learning.learningRequired, true);
  assert.equal(learning.learningMode, 'missing-postal-design');
  assert.equal(learning.allowedUse, 'primary-design');
  assert.equal(learning.generationBlockedByMaturePostalSystem, false);
  assert.equal(learning.class, 'C');
  assert.equal(learning.terrain, 'archipelago');
  assert.equal(learning.recommendedTemplateId, 'agid-native');
  assert.ok(learning.observedFactors.includes('country-scale:small'));
  const native = learning.comparableSystems.find(system => system.templateId === 'agid-native');
  assert.ok(native);
  assert.equal(native.useAs, 'primary-template');
  assert.ok(native.adoptedReasons.some(reason => /island-first/.test(reason)));
  assert.ok(learning.rationale.includes('prelearn-territory-population-terrain-before-generation'));
});

test('learns existing postal system reasons as design priors instead of direct copies', () => {
  const classification = classifyAgidPostalCountry({
    countryCode: 'ZZ',
    countryName: 'Weak large population example',
    population: 220000000,
    areaKm2: 923000,
    addressFormat: {
      countryCode: 'ZZ',
      name: 'Weak large population example',
      postalCode: {
        regex: '^\\d{5}$',
        api: null,
        source: 'regional postal table / geonames postal',
        format: 'NNNNN',
      },
      addressRules: {
        postalCode: { required: false, usage: 'used' },
        openSourceIds: ['geonames-postal'],
      },
    },
  });
  const learning = learnAgidPostalCountryDesign({
    countryCode: 'ZZ',
    countryName: 'Weak large population example',
    population: 220000000,
    areaKm2: 923000,
    addressFormat: {
      countryCode: 'ZZ',
      name: 'Weak large population example',
      postalCode: {
        regex: '^\\d{5}$',
        api: null,
        source: 'regional postal table / geonames postal',
        format: 'NNNNN',
      },
      addressRules: {
        postalCode: { required: false, usage: 'used' },
        openSourceIds: ['geonames-postal'],
      },
    },
  }, classification);

  assert.equal(learning.class, 'B');
  assert.equal(learning.learningRequired, true);
  assert.equal(learning.learningMode, 'weak-postal-supplement');
  assert.equal(learning.allowedUse, 'supplemental-design');
  assert.equal(learning.recommendedTemplateId, 'india-like');
  const indiaLike = learning.comparableSystems.find(system => system.templateId === 'india-like');
  assert.ok(indiaLike);
  assert.equal(indiaLike.useAs, 'supplemental-inspiration');
  assert.ok(indiaLike.adoptedReasons.some(reason => /large population/.test(reason)));
  assert.ok(indiaLike.caution.includes('learn-as-design-prior-not-direct-copy'));
  assert.ok(indiaLike.caution.includes('use-only-as-supplement-to-existing-postal-code'));
});

test('keeps learning internal-only for mature postal countries', () => {
  const learning = learnAgidPostalCountryDesign({
    countryCode: 'JP',
    countryName: 'Japan',
    population: 125000000,
    areaKm2: 377975,
    addressFormat: {
      countryCode: 'JP',
      name: 'Japan',
      postalCode: {
        regex: '^\\d{3}-\\d{4}$',
        api: 'https://zipcloud.ibsnet.co.jp/api/search?zipcode={{postcode}}',
        source: 'Japan Post / zipcloud / official',
        format: 'NNN-NNNN',
      },
    },
  });

  assert.equal(learning.class, 'A');
  assert.equal(learning.learningRequired, true);
  assert.equal(learning.learningMode, 'mature-postal-baseline');
  assert.equal(learning.allowedUse, 'internal-baseline-only');
  assert.equal(learning.generationBlockedByMaturePostalSystem, true);
  assert.ok(learning.observedFactors.some(factor => factor.startsWith('terrain:')));
  assert.ok(learning.observedFactors.some(factor => factor.startsWith('population-band:')));
  assert.ok(learning.observedFactors.some(factor => factor.startsWith('area-band:')));
  assert.ok(learning.comparableSystems.every(system => system.useAs === 'avoid-direct-copy'));
  assert.ok(learning.rationale.includes('prelearn-territory-population-terrain-before-generation'));
  assert.ok(learning.rationale.includes('mature-postal-system-is-primary-agid-learning-is-internal-only'));
});

test('estimates AGID cells and municipality planning counts without pretending exact enumeration', () => {
  const estimate = estimateAgidPostalAreas({
    countryCode: 'RW',
    population: 13500000,
    areaKm2: 26338,
    municipalityCount: 416,
  });
  assert.ok(estimate.baseAgidCellCount > 1000000000);
  assert.ok(estimate.suggestedPostalAreaCount > estimate.municipalityCount);
  assert.ok(estimate.approximatePostalAreasPerMunicipality > 1);
});

test('builds one plan containing classification, generated code, reshape, and learned templates', () => {
  const agid = encodeAGID(13.4432, -15.3101).id;
  const plan = buildAgidPostalDesignPlan({
    profile: {
      countryCode: 'GM',
      countryName: 'Gambia',
      population: 2700000,
      areaKm2: 11295,
      municipalityCount: 80,
    },
    agid,
    templateId: 'france-like',
    currentTemplateId: 'agid-native',
  });
  assert.equal(plan.classification.class, 'C');
  assert.equal(plan.generated?.ok, true);
  assert.equal(plan.reshapePlan.reversibleByAgid, true);
  assert.equal(plan.publication.status, 'draft-only');
  assert.ok(plan.learnedSystems.some(system => /Japan-like/.test(system)));
  assert.equal(plan.countryLearning.learningRequired, true);
  assert.equal(plan.countryLearning.class, 'C');
  assert.ok(plan.countryLearning.comparableSystems.length > 0);
  assert.equal(plan.qualityReport.systemName, AGID_POSTAL_CREATION_SYSTEM_NAME);
  assert.equal(plan.qualityReport.aiName, AGID_POSTAL_CREATION_AI_NAME);
  assert.ok(plan.qualityReport.overallScore > 0);
  assert.ok(plan.qualityReport.dimensions.some(dimension => dimension.id === 'privacy-safety'));
});

test('keeps public publication as draft-only until governance and data trust thresholds are met', () => {
  const agid = encodeAGID(-1.9403, 29.8739).id;
  const plan = buildAgidPostalDesignPlan({
    profile: {
      countryCode: 'RW',
      countryName: 'Rwanda',
      population: 13500000,
      areaKm2: 26338,
      municipalityCount: 416,
      governance: {
        government: 1,
        municipality: 1,
        carrier: 1,
        platform: 1,
      },
      dataQuality: {
        address: 0.9,
        road: 0.9,
        admin: 0.9,
        population: 0.9,
        boundary: 0.9,
      },
    },
    agid,
    templateId: 'japan-like',
  });

  assert.equal(plan.governance.approved, true);
  assert.equal(plan.dataTrust.readyForPublication, true);
  assert.equal(plan.privacy.publishable, true);
  assert.equal(plan.publication.status, 'publishable');
  assert.ok(['excellent', 'good', 'review-required'].includes(plan.qualityReport.grade));
  assert.ok(plan.qualityReport.dimensions.every(dimension => dimension.score >= 0 && dimension.score <= 1));
});

test('blocks public code publication for sensitive zones even when generation succeeds', () => {
  const agid = encodeAGID(23.4241, 53.8478).id;
  const plan = buildAgidPostalDesignPlan({
    profile: {
      countryCode: 'AE',
      countryName: 'United Arab Emirates',
      population: 9900000,
      areaKm2: 83600,
      privacy: {
        sensitive: true,
      },
      governance: {
        government: 1,
        municipality: 1,
        carrier: 1,
        platform: 1,
      },
      dataQuality: {
        address: 1,
        road: 1,
        admin: 1,
        population: 1,
        boundary: 1,
      },
    },
    agid,
    templateId: 'agid-native',
  });

  assert.equal(plan.generated?.ok, true);
  assert.equal(plan.privacy.sensitiveBlocked, true);
  assert.equal(plan.publication.status, 'blocked');
  assert.equal(plan.qualityReport.grade, 'blocked');
  assert.ok(plan.qualityReport.hardBlocks.includes('sensitive-zone-public-code-blocked'));
});

test('evaluates AtlasWeaver AI quality across safety, trust, collision, and migration dimensions', () => {
  const agid = encodeAGID(25.2854, 51.531).id;
  const plan = buildAgidPostalDesignPlan({
    profile: {
      countryCode: 'QA',
      countryName: 'Qatar',
      population: 2700000,
      areaKm2: 11581,
      governance: {
        government: 0.2,
        municipality: 0.2,
        carrier: 0.5,
        platform: 0.9,
      },
      dataQuality: {
        address: 0.55,
        road: 0.75,
        admin: 0.8,
        population: 0.8,
        boundary: 0.8,
      },
    },
    agid,
    templateId: 'agid-native',
  });
  const report = evaluateAgidPostalAiQuality({
    classification: plan.classification,
    recommendation: plan.recommendation,
    existence: plan.existence,
    generated: plan.generated,
    reshapePlan: plan.reshapePlan,
    governance: plan.governance,
    privacy: plan.privacy,
    dataTrust: plan.dataTrust,
    collisionAvoidance: plan.collisionAvoidance,
    readability: plan.readability,
    publication: plan.publication,
    operationalStatus: plan.operationalStatus,
    countryLearning: plan.countryLearning,
  });

  assert.equal(report.aiName, AGID_POSTAL_CREATION_AI_NAME);
  assert.equal(report.dimensions.length, 10);
  assert.ok(report.dimensions.some(dimension => dimension.id === 'governance-readiness' && dimension.status !== 'pass'));
  assert.ok(report.nextActions.some(action => /government|publication|approval/i.test(action)));
});

test('uses AGID namespace separation for supplemental class B codes', () => {
  const agid = encodeAGID(0.1, 0.1).id.replace(/^../, 'ZZ');
  const generated = generateAgidPostalAreaCode({
    countryCode: 'ZZ',
    agid,
    templateId: 'us-like',
    profile: {
      countryCode: 'ZZ',
      countryName: 'Weak Postal Example',
      addressFormat: {
        countryCode: 'ZZ',
        name: 'Weak Postal Example',
        postalCode: {
          regex: '^\\d{5}$',
          api: null,
          source: 'GeoNames postal / regional table',
          format: 'NNNNN',
        },
      },
    },
  });

  assert.equal(generated.ok, true);
  assert.match(generated.code || '', /^AGID-ZZ-/);
  assert.equal(generated.collisionAvoidance?.strategy, 'agid-prefixed');
  assert.equal(generated.generationPolicy?.publicationStage, 'supplemental-draft');
  assert.equal(generated.generationPolicy?.requiresExistingPostalContext, true);
  assert.equal(generated.generationPolicy?.visibleCode.agidNamespaceRequired, true);
  assert.ok(generated.generationPolicy?.rationale.includes('class-b-supplemental-only'));
});

test('evaluates governance, privacy, data trust, and publication theorem checks independently', () => {
  const profile = {
    countryCode: 'TV',
    countryName: 'Tuvalu',
    population: 11000,
    areaKm2: 26,
    governance: {
      government: 1,
      municipality: 0.5,
      carrier: 1,
      platform: 1,
    },
    dataQuality: {
      address: 0.75,
      road: 0.7,
      admin: 0.8,
      population: 0.8,
      boundary: 0.85,
    },
  };
  const estimate = estimateAgidPostalAreas(profile);
  const governance = evaluateAgidPostalGovernance(profile);
  const dataTrust = evaluateAgidPostalDataTrust(profile);
  const privacy = evaluateAgidPostalPrivacy(profile, estimate);
  const publication = decideAgidPostalPublication({
    classification: classifyAgidPostalCountry(profile),
    generated: {
      ok: true,
      code: 'TV-AAAA-123',
      countryCode: 'TV',
      agid: 'TVAAAA123',
      templateId: 'agid-native',
      warnings: [],
    },
    governance,
    privacy,
    dataTrust,
    collisionAvoidance: {
      collisionFree: true,
      strategy: 'country-prefixed',
      recommendedDisplayCode: 'TV-AAAA-123',
      rationale: [],
    },
  });

  assert.equal(governance.approved, true);
  assert.equal(dataTrust.readyForPublication, true);
  assert.equal(privacy.anonymitySatisfied, true);
  assert.equal(publication.status, 'publishable');
});

test('records tablet-edited AGID cells as a postal zone composition ledger', () => {
  const first = encodeAGID(24.4539, 54.3773).id;
  const second = encodeAGID(24.454, 54.3775).id;
  const record = createAgidPostalZoneEditRecord({
    countryCode: 'AE',
    postalCode: 'AE-123-4567',
    source: {
      kind: 'pen-tablet',
      deviceName: 'Wacom-compatible pen tablet',
      pressureSupported: true,
    },
    integratedAgids: [first, first],
    editedAgids: [{
      originalAgid: first,
      editedAgid: second,
      operation: 'reshape',
      pressureSamples: 12,
    }],
    now: '2026-06-18T00:00:00.000Z',
  });

  assert.equal(record.countryCode, 'AE');
  assert.equal(record.source.kind, 'pen-tablet');
  assert.equal(record.integratedAgids.length, 2);
  assert.equal(record.editedAgids[0].operation, 'reshape');
  assert.ok(record.warnings.includes('tablet-strokes-record-zone-membership-not-raw-private-addresses'));

  const summary = summarizeAgidPostalZoneEditRecord(record);
  assert.equal(summary.integratedCount, 2);
  assert.equal(summary.editedCount, 1);
});

test('rejects AGID postal zone edits that cross the selected country boundary', () => {
  const aeAgid = encodeAGID(24.4539, 54.3773).id;
  const record = createAgidPostalZoneEditRecord({
    countryCode: 'QA',
    postalCode: 'QA-00001',
    source: { kind: 'manual-pointer' },
    integratedAgids: [aeAgid],
    now: '2026-06-18T00:00:00.000Z',
  });

  assert.equal(record.integratedAgids.length, 0);
  assert.equal(record.rejectedAgids[0].reason, 'agid-prefix-crosses-country-boundary');
  assert.ok(record.warnings.includes('some-agids-rejected-by-country-or-format-guard'));
});

test('updates AGID postal zone records while preserving excluded cells and revision history', () => {
  const first = encodeAGID(-1.9403, 29.8739).id;
  const second = encodeAGID(-1.9404, 29.874).id;
  const initial = createAgidPostalZoneEditRecord({
    countryCode: 'RW',
    postalCode: 'RW-001',
    source: { kind: 'gis-import', appName: 'QGIS' },
    integratedAgids: [first],
    now: '2026-06-18T00:00:00.000Z',
  });
  const updated = updateAgidPostalZoneEditRecord(initial, {
    integratedAgids: [second],
    excludedAgids: [first],
    now: '2026-06-18T00:05:00.000Z',
  });

  assert.equal(updated.revision, 2);
  assert.equal(updated.createdAt, initial.createdAt);
  assert.equal(updated.integratedAgids.includes(second), true);
  assert.equal(updated.integratedAgids.includes(first), false);
  assert.equal(updated.excludedAgids.includes(first), true);
  assert.notEqual(updated.revisionId, initial.revisionId);
});

test('keeps Adobe artifact metadata on imported AGID postal zone records', () => {
  const agid = encodeAGID(-13.2543, 34.3015).id;
  const record = createAgidPostalZoneEditRecord({
    countryCode: 'MW',
    postalCode: 'MW-AGID-DRAFT-1',
    source: {
      kind: 'adobe-illustrator',
      appName: 'Adobe Illustrator',
      fileName: 'district-zone.ai',
      artifactHash: 'sha256:example',
    },
    editedAgids: [{
      originalAgid: agid,
      operation: 'adobe-import',
      note: 'Imported from vector boundary layer',
    }],
    now: '2026-06-18T00:00:00.000Z',
  });

  assert.equal(record.source.kind, 'adobe-illustrator');
  assert.equal(record.source.artifactHash, 'sha256:example');
  assert.equal(record.integratedAgids.length, 1);
  assert.equal(record.warnings.includes('adobe-artifact-hash-recommended-for-audit'), false);
});

test('builds island-locality-delivery hierarchical AGID postal codes without using city names', () => {
  const wholeLocality = buildAgidPostalHierarchicalCode({
    countryCode: 'vu',
    islandCode: 3,
    localityCode: 1,
    deliveryZoneCode: 0,
  });
  const firstDeliveryZone = buildAgidPostalHierarchicalCode({
    countryCode: 'VU',
    islandCode: '03',
    localityCode: '02',
    deliveryZoneCode: '01',
    includeCheckCharacter: true,
  });

  assert.equal(wholeLocality.code, 'VU-03-01-00');
  assert.match(firstDeliveryZone.code, /^VU-03-02-01-[A-Z0-9]$/);
  assert.equal(firstDeliveryZone.components.localityCode, '02');
});

test('separates different locality IDs while preserving postal code under locality renaming', () => {
  const renamed = {
    countryCode: 'VU',
    islandCode: '03',
    localityId: 'L-0042',
    localityCode: '02',
    currentName: 'Unity City',
    previousName: 'Port Victoria',
    previousLocalityId: 'L-0042',
    previousLocalityCode: '02',
    nameHistory: [
      { name: 'Port Victoria', language: 'en', from: '1980', to: '2028' },
      { name: 'Unity City', language: 'en', from: '2028', to: null },
    ],
    postalCodes: ['VU-03-02-00', 'VU-03-02-01'],
  };
  const other = {
    countryCode: 'VU',
    islandCode: '03',
    localityId: 'L-0043',
    localityCode: '03',
    currentName: 'Victoria',
    postalCodes: ['VU-03-03-00'],
  };

  const decision = evaluateAgidPostalLocalitySeparation([renamed, other]);

  assert.equal(decision.separated, true);
  assert.equal(decision.renameInvariant, true);
  assert.equal(decision.postalSetsDisjoint, true);
  assert.equal(decision.theoremChecks.localitySeparation, true);
  assert.equal(decision.theoremChecks.renamingInvariance, true);
});

test('flags same postal code reuse across different locality IDs outside delivery-priority mode', () => {
  const decision = evaluateAgidPostalLocalitySeparation([
    {
      countryCode: 'SB',
      islandCode: '01',
      localityId: 'L-A',
      localityCode: '01',
      currentName: 'Victoria',
      postalCodes: ['SB-01-01-00'],
    },
    {
      countryCode: 'SB',
      islandCode: '01',
      localityId: 'L-B',
      localityCode: '02',
      currentName: 'Victoria',
      postalCodes: ['SB-01-01-00'],
    },
  ]);

  assert.equal(decision.separated, false);
  assert.equal(decision.postalSetsDisjoint, false);
  assert.equal(decision.collisions.some(collision => collision.kind === 'postal-code'), true);
});

test('allows shared delivery areas only in delivery-priority mode while keeping locality codes distinct', () => {
  const decision = evaluateAgidPostalLocalitySeparation([
    {
      countryCode: 'TV',
      islandCode: '01',
      localityId: 'L-LOW-DENSITY-A',
      localityCode: '04',
      currentName: 'North Village',
      postalCodes: ['TV-01-04-99'],
    },
    {
      countryCode: 'TV',
      islandCode: '01',
      localityId: 'L-LOW-DENSITY-B',
      localityCode: '05',
      currentName: 'South Village',
      postalCodes: ['TV-01-04-99'],
    },
  ], 'delivery-priority');

  assert.equal(decision.localityCodeInjective, true);
  assert.equal(decision.postalSetsDisjoint, false);
  assert.equal(decision.theoremChecks.localitySeparation, true);
  assert.equal(decision.separated, true);
});

test('rejects postal code churn caused only by locality renaming', () => {
  const decision = evaluateAgidPostalLocalitySeparation([
    {
      countryCode: 'VU',
      islandCode: '03',
      localityId: 'L-0042',
      localityCode: '04',
      currentName: 'Unity City',
      previousName: 'Port Victoria',
      previousLocalityId: 'L-0042',
      previousLocalityCode: '02',
      postalCodes: ['VU-03-04-00'],
    },
  ]);

  assert.equal(decision.renameInvariant, false);
  assert.equal(decision.separated, false);
  assert.equal(decision.collisions.some(collision => collision.kind === 'rename-code-change'), true);
});

test('proves finite postal partitions can be encoded when code capacity is sufficient', () => {
  const oneZone = evaluateAgidPostalExistenceCondition({
    zoneCount: 1,
    alphabetSize: 32,
    codeLength: 1,
  });
  const insufficientLength = evaluateAgidPostalExistenceCondition({
    zoneCount: 10,
    alphabetSize: 2,
    codeLength: 3,
  });

  assert.equal(oneZone.mathematicallyConstructible, true);
  assert.equal(oneZone.injectionConditionSatisfied, true);
  assert.equal(oneZone.canUseSingleCountryCode, true);
  assert.equal(insufficientLength.mathematicallyConstructible, true);
  assert.equal(insufficientLength.injectionConditionSatisfied, false);
  assert.equal(insufficientLength.minimumLength, 4);
});

test('builds variable-depth hierarchy codes for small islands and high-rise cities', () => {
  const shallowIsland = buildAgidPostalVariableHierarchyCode({
    countryCode: 'TV',
    path: [
      { kind: 'island', codePart: 1 },
    ],
  });
  const verticalCity = buildAgidPostalVariableHierarchyCode({
    countryCode: 'SG',
    path: [
      { kind: 'city-district', codePart: 3 },
      { kind: 'block', codePart: 12 },
      { kind: 'building-group', codePart: 'B9' },
    ],
    includeCheckCharacter: true,
  });

  assert.equal(shallowIsland.code, 'TV-01');
  assert.equal(shallowIsland.depth, 2);
  assert.match(verticalCity.code, /^SG-03-12-B9-[A-Z0-9]$/);
  assert.deepEqual(verticalCity.regionKinds, ['city-district', 'block', 'building-group']);
});

test('recommends adaptive postal hierarchies by national geography instead of forcing one format', () => {
  const archipelago = recommendAgidPostalAdaptiveHierarchy({
    countryCode: 'FJ',
    countryName: 'Fiji',
    evidenceSources: ['archipelago', 'island routing'],
  });
  const streetless = recommendAgidPostalAdaptiveHierarchy({
    countryCode: 'ZZ',
    countryName: 'No street names example',
    evidenceSources: ['no street names', 'landmark-only delivery'],
  });
  const highRise = recommendAgidPostalAdaptiveHierarchy({
    countryCode: 'SG',
    countryName: 'High-rise vertical city',
    population: 5600000,
    areaKm2: 734,
    evidenceSources: ['high-rise building-group'],
  });

  assert.equal(archipelago.countryType, 'archipelago');
  assert.deepEqual(archipelago.recommendedPathKinds, ['country', 'island', 'locality', 'delivery-zone']);
  assert.equal(streetless.countryType, 'no-street-name');
  assert.ok(streetless.recommendedPathKinds.includes('landmark'));
  assert.equal(highRise.countryType, 'high-rise-city');
  assert.equal(highRise.publicPrecisionDefault, 'building-group');
});

test('separates identifier, postal partition, and route planes', () => {
  const routeOnly = evaluateAgidPostalPlaneSeparation({
    roadChanged: true,
    depotChanged: true,
  });
  const invalidRouteChurn = evaluateAgidPostalPlaneSeparation({
    carrierChanged: true,
    postalCodeChanged: true,
  });
  const structuralSplit = evaluateAgidPostalPlaneSeparation({
    localitySplitOrMerge: true,
    postalCodeChanged: true,
    hasBackwardCompatibility: true,
  });

  assert.equal(routeOnly.valid, true);
  assert.equal(routeOnly.recommendedChange, 'route-plane-only');
  assert.equal(invalidRouteChurn.valid, false);
  assert.equal(invalidRouteChurn.theoremChecks.routeMutationDoesNotForcePostalMutation, false);
  assert.equal(structuralSplit.valid, true);
  assert.equal(structuralSplit.recommendedChange, 'postal-plane-with-backward-compatibility');
});

test('decides operational status without treating every generated code as official', () => {
  const simulation = decideAgidPostalOperationalStatus({ generated: false });
  const pilot = decideAgidPostalOperationalStatus({
    generated: true,
    dataTrusted: true,
    privacySafe: true,
    carrierPilot: true,
  });
  const official = decideAgidPostalOperationalStatus({
    generated: true,
    classification: 'C',
    governanceApproved: true,
    dataTrusted: true,
    privacySafe: true,
    governmentOfficial: true,
    publicIssuerAvailable: true,
    backwardCompatibilityReady: true,
  });

  assert.equal(simulation.status, 'simulation');
  assert.equal(pilot.status, 'pilot');
  assert.equal(official.status, 'official');
  assert.equal(official.canPresentAsOfficial, true);
});

test('uses MDL-style split decisions and churn budget guards', () => {
  const split = evaluateAgidPostalSplitDecision({
    benefit: 10,
    codeCost: 2,
    migrationCost: 3,
  });
  const noSplit = evaluateAgidPostalSplitDecision({
    benefit: 4,
    codeCost: 2,
    migrationCost: 3,
  });
  const churn = evaluateAgidPostalCodeChurnBudget({
    changedCodeCount: 9,
    totalCodeCount: 1000,
    budgetRate: 0.005,
  });

  assert.equal(split.shouldSplit, true);
  assert.equal(noSplit.shouldSplit, false);
  assert.equal(churn.withinBudget, false);
  assert.equal(churn.churnRate, 0.009);
});

test('estimates minimum practical postal code count from regional constraints', () => {
  const estimate = estimateAgidPostalMinimumCodeCount({
    policy: {
      maxAddressCountPerCode: 40000,
      maxPeakDeliveryDemandPerCode: 10000,
    },
    regions: [
      {
        regionId: 'mainland-central-city',
        addressCount: 95000,
        peakDeliveryDemand: 21000,
        timeCoverCount: 3,
        reserveCode: true,
      },
      {
        regionId: 'inland-north-city',
        addressCount: 35000,
        peakDeliveryDemand: 8000,
        timeCoverCount: 2,
        reserveCode: true,
      },
      {
        regionId: 'inhabited-island-a',
        addressCount: 6000,
        peakDeliveryDemand: 1000,
        timeCoverCount: 1,
        reserveCode: true,
      },
      {
        regionId: 'uninhabited-island-b',
        addressCount: 0,
        peakDeliveryDemand: 0,
        timeCoverCount: 0,
        reserveCode: true,
      },
    ],
  });

  assert.equal(estimate.absoluteMinimum, 1);
  assert.equal(estimate.structuralMinimum, 4);
  assert.equal(estimate.operationalLowerBound, 7);
  assert.equal(estimate.feasibleWithoutAtomicSubdivision, true);
  assert.deepEqual(estimate.regions.map(region => region.lowerBound), [3, 2, 1, 1]);
});

test('flags atomic cells that must be subdivided before exact minimum optimization', () => {
  const estimate = estimateAgidPostalMinimumCodeCount({
    policy: {
      maxAddressCountPerCode: 40000,
    },
    regions: [
      {
        regionId: 'single-mega-facility',
        addressCount: 45000,
        largestAtomicAddressCount: 45000,
      },
    ],
  });

  assert.equal(estimate.operationalLowerBound, 2);
  assert.equal(estimate.feasibleWithoutAtomicSubdivision, false);
  assert.equal(estimate.regions[0].requiresAtomicSubdivision, true);
});

test('plans future code capacity and fixed length from robust minimum count', () => {
  const capacity = planAgidPostalFutureCapacity({
    currentOperationalLowerBound: 7000,
    futureOperationalLowerBounds: [8000],
    reserveRate: 0.25,
    alphabetSize: 10,
    includeCheckCharacter: true,
  });

  assert.equal(capacity.robustFutureMinimum, 8000);
  assert.equal(capacity.requiredCodeSpace, 10000);
  assert.equal(capacity.minimumFixedLength, 4);
  assert.equal(capacity.displayLength, 5);
});

test('computes per-level capacity for hierarchical postal code designs', () => {
  const capacity = estimateAgidPostalHierarchyCapacity({
    alphabetSize: 10,
    levels: [
      { label: 'island', maxChildren: 60 },
      { label: 'city', maxChildren: 80 },
      { label: 'zone', maxChildren: 150 },
    ],
  });

  assert.equal(capacity.totalDisplayLength, 7);
  assert.equal(capacity.formatHint, 'II-CC-ZZZ');
  assert.deepEqual(capacity.levels.map(level => level.minimumLength), [2, 2, 3]);
});

test('minimum code lower bound is monotone under stricter service limits', () => {
  const loose = estimateAgidPostalMinimumCodeCount({
    policy: { maxAddressCountPerCode: 50000 },
    regions: [{ regionId: 'city', addressCount: 90000 }],
  });
  const strict = estimateAgidPostalMinimumCodeCount({
    policy: { maxAddressCountPerCode: 30000 },
    regions: [{ regionId: 'city', addressCount: 90000 }],
  });

  assert.equal(loose.operationalLowerBound, 2);
  assert.equal(strict.operationalLowerBound, 3);
  assert.ok(strict.operationalLowerBound >= loose.operationalLowerBound);
});

test('creates virtual postal localities only for ambiguous or overloaded non-administrative regions', () => {
  const decision = evaluateAgidPostalVirtualLocalityNeed({
    countryCode: 'KN',
    regionId: 'REGION-04',
    administrativeLocalityId: null,
    ambiguityScore: 0.8,
    ambiguityThreshold: 0.65,
    addressCount: 18000,
    maxAddressCountPerVirtualLocality: 5000,
    minimumPublicAddressCount: 10,
    authority: 'National Postal Authority',
  });

  assert.equal(decision.shouldCreate, true);
  assert.equal(decision.lowerBound, 4);
  assert.deepEqual(decision.triggers.sort(), ['address-count', 'ambiguity']);
  assert.equal(decision.dataModel.synthetic, true);
  assert.equal(decision.dataModel.legalStatus, 'non_administrative');
  assert.equal(decision.dataModel.administrativeLocalityId, null);
  assert.equal(decision.publicSafeByAverageAddressCount, true);
});

test('does not create a virtual postal locality for visual code variety alone', () => {
  const decision = evaluateAgidPostalVirtualLocalityNeed({
    countryCode: 'KN',
    regionId: 'REGION-05',
    ambiguityScore: 0.1,
    ambiguityThreshold: 0.65,
    addressCount: 200,
    maxAddressCountPerVirtualLocality: 5000,
    peakDeliveryDemand: 20,
    maxPeakDeliveryDemandPerVirtualLocality: 1000,
    routeRadiusMinutes: 15,
    maxRouteRadiusMinutes: 60,
  });

  assert.equal(decision.shouldCreate, false);
  assert.equal(decision.lowerBound, 1);
  assert.ok(decision.rationale.includes('do-not-create-vpl-for-visual-variety-alone'));
});

test('builds VPL postal codes without implying municipal legal status', () => {
  const code = buildAgidVirtualPostalLocalityCode({
    countryCode: 'KN',
    parentRegionCode: 4,
    virtualLocalityCode: 'K7',
    deliveryZoneCode: 2,
    includeCheckCharacter: true,
  });

  assert.match(code.code, /^KN-04-K7-2-[A-Z0-9]$/);
  assert.equal(code.components.virtualLocalityCode, 'K7');
});

test('generates visually distinct virtual postal locality codes with hamming distance guards', () => {
  const codeSet = generateAgidVirtualPostalLocalityCodes({
    count: 4,
    codeLength: 2,
    minHammingDistance: 3,
    adjacentPairs: [[0, 1], [1, 2], [2, 3]],
    adjacentMinHammingDistance: 3,
    seed: 'kn-region-04',
  });

  assert.equal(codeSet.codes.length, 4);
  assert.equal(codeSet.codeLength, 3);
  assert.ok(codeSet.observedMinHammingDistance >= 3);
  assert.equal(codeSet.adjacencySatisfied, true);
  assert.ok(codeSet.rationale.includes('code-length-raised-to-satisfy-distance-constraint'));
});

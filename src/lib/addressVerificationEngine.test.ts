import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEFAULT_ADDRESS_VERIFICATION_TARGET_COUNTRIES,
  getAddressVerificationTargetPolicy,
  isCountryEnabledForAddressVerification,
  verifyAddressCandidate,
} from './addressVerificationEngine';
import { buildApprovedCountryGeographicMetadataEvaluationIndex } from './countryGeographicMetadataEvaluationCatalog';
import { buildCountryValidationQualityReport } from './countryValidationQualityGate';

const jpFormat = {
  countryCode: 'JP',
  name: 'Japan',
  native: {
    addressFormat: '〒{{postcode}}\n{{state}}{{city}}{{street}}{{houseNumber}}',
    fields: [
      { key: 'postcode', required: true },
      { key: 'state', required: true },
      { key: 'city', required: true },
    ],
  },
  postalCode: {
    regex: '^\\d{3}-?\\d{4}$',
    source: 'agid-country-postal-format-policy',
  },
  addressRules: {
    postalCode: { required: true, usage: 'required' as const },
    openSourceIds: ['agid-address-verification-engine'],
  },
};

test('target countries gate address verification before postcode checks', () => {
  const result = verifyAddressCandidate({
    targetCountries: ['JP'],
    countryCode: 'US',
    postalCode: '100-0001',
    address: {
      city: 'Chiyoda-ku',
      state: 'Tokyo',
      road: 'Marunouchi',
    },
    scope: 'postal',
  });

  assert.equal(result.status, 'country_mismatch');
  assert.equal(result.country.targetAllowed, false);
  assert.ok(result.nextActions.includes('select-the-correct-target-country'));
});

test('postcode-only verification is partial until lookup evidence agrees for lookup countries', () => {
  const result = verifyAddressCandidate({
    targetCountries: ['JP'],
    countryCode: 'JP',
    postalCode: '1000001',
    scope: 'postal',
    format: jpFormat,
  });

  assert.equal(result.status, 'partial');
  assert.equal(result.postal.formatValid, true);
  assert.equal(result.postal.evidence, 'not-provided');
  assert.ok(result.nextActions.includes('run-postal-code-lookup'));
  assert.equal(result.standardLibrary.freeOnly, true);
  assert.ok(result.standardLibrary.primary.some(entry => entry.id === 'local-address-parser'));
  assert.ok(result.audit.some(step => step.step === 'standard-library-resolution'));
});

test('approved synthetic administrative metadata is auditable but cannot satisfy postal lookup', () => {
  const geographicIndex = buildApprovedCountryGeographicMetadataEvaluationIndex({
    now: '2026-07-25T00:00:00Z',
  });
  const countryQuality = buildCountryValidationQualityReport(
    geographicIndex,
    'GT',
    '2026-07-25T00:00:00Z',
  );
  const result = verifyAddressCandidate({
    countryCode: 'GT',
    targetCountries: ['GT'],
    postalCode: '01001',
    scope: 'postal',
    countryPolicies: {
      GT: {
        countryCode: 'GT',
        enabled: true,
        label: 'Synthetic Guatemala policy',
        postalMode: 'format-and-lookup',
        postcodeRegex: '^\\d{5}$',
        postcodeFormat: '#####',
        requiredFields: ['country_code', 'postcode'],
        lookupSources: [],
        notes: [],
      },
    },
    geographicMetadataReadiness: countryQuality.geographicMetadataReadiness,
  });

  assert.equal(countryQuality.syntheticAdministrativeEvaluationEligible, true);
  assert.equal(result.geographicMetadataReadiness.syntheticAdministrativeEvaluationEligible, true);
  assert.equal(result.geographicMetadataReadiness.sources[0]?.sourceId, 'segeplan-gt-nbi-municipal-2018');
  assert.equal(result.geographicMetadataReadiness.sources[0]?.approvedAdministrativeKeyCount, 2);
  assert.equal(result.geographicMetadataReadiness.deliveryClaimsEnabled, false);
  assert.equal(result.postal.lookupRequired, true);
  assert.equal(result.postal.lookupSatisfied, false);
  assert.equal(result.status, 'partial');
  assert.ok(result.audit.some(step => step.step === 'synthetic-geographic-metadata'));
});

test('regional compositions exclude malformed, foreign, duplicate, and delivery-enabled metadata evidence', () => {
  const result = verifyAddressCandidate({
    countryCode: 'BR',
    targetCountries: ['BR'],
    postalCode: '01001-000',
    scope: 'postal',
    countryPolicies: {
      BR: {
        countryCode: 'BR',
        enabled: true,
        label: 'Synthetic Brazil policy',
        postalMode: 'format-and-lookup',
        postcodeRegex: '^\\d{5}-?\\d{3}$',
        postcodeFormat: 'NNNNN-NNN',
        requiredFields: ['country_code', 'postcode'],
        lookupSources: [],
        notes: [],
      },
    },
    geographicMetadataReadiness: [
      {
        countryCode: 'BR',
        sourceId: 'br-safe-synthetic-admin',
        sourceOrigin: 'official-publication',
        approvedAdministrativeKeyCount: 1,
        syntheticAdministrativeEvaluationEligible: true,
        deliveryClaimsEnabled: false,
      },
      {
        countryCode: 'BR',
        sourceId: 'br-delivery-enabled-admin',
        sourceOrigin: 'official-publication',
        approvedAdministrativeKeyCount: 1,
        syntheticAdministrativeEvaluationEligible: true,
        // Runtime JSON is untyped; the engine must reject this forbidden value.
        deliveryClaimsEnabled: true as unknown as false,
      },
      {
        countryCode: 'MX',
        sourceId: 'mx-foreign-admin',
        sourceOrigin: 'official-publication',
        approvedAdministrativeKeyCount: 1,
        syntheticAdministrativeEvaluationEligible: true,
        deliveryClaimsEnabled: false,
      },
      {
        countryCode: 'BR',
        sourceId: 'invalid source id',
        sourceOrigin: 'official-publication',
        approvedAdministrativeKeyCount: 1,
        syntheticAdministrativeEvaluationEligible: true,
        deliveryClaimsEnabled: false,
      },
      {
        countryCode: 'BR',
        sourceId: 'br-duplicate-admin',
        sourceOrigin: 'official-publication',
        approvedAdministrativeKeyCount: 1,
        syntheticAdministrativeEvaluationEligible: true,
        deliveryClaimsEnabled: false,
      },
      {
        countryCode: 'BR',
        sourceId: 'br-duplicate-admin',
        sourceOrigin: 'maintained-open-source',
        approvedAdministrativeKeyCount: 1,
        syntheticAdministrativeEvaluationEligible: true,
        deliveryClaimsEnabled: false,
      },
    ],
  });

  assert.deepEqual(
    result.geographicMetadataReadiness.sources.map(source => source.sourceId),
    ['br-safe-synthetic-admin'],
  );
  assert.deepEqual(
    result.americasGeography?.sourceComposition.components
      .filter(component => component.role === 'country-scoped-metadata')
      .map(component => component.sourceId),
    ['br-safe-synthetic-admin'],
  );
  assert.equal(result.geographicMetadataReadiness.deliveryClaimsEnabled, false);
  assert.equal(result.americasGeography?.sourceComposition.deliveryClaimsEnabled, false);
  assert.equal(result.postal.lookupSatisfied, false);
});

test('postcode lookup evidence can verify a selected target country address', () => {
  const result = verifyAddressCandidate({
    targetCountries: ['JP', 'US'],
    countryCode: 'JP',
    postalCode: '100-0001',
    scope: 'address',
    format: jpFormat,
    address: {
      country: 'Japan',
      state: 'Tokyo',
      city: 'Chiyoda-ku',
      road: 'Marunouchi',
      postcode: '100-0001',
    },
    postalEvidence: [{
      source: 'zipcloud',
      countryCode: 'JP',
      postalCode: '1000001',
      state: 'Tokyo',
      city: 'Chiyoda-ku',
      confidence: 0.91,
    }],
  });

  assert.equal(result.status, 'verified');
  assert.equal(result.postal.evidence, 'matched');
  assert.equal(result.score >= 0.91, true);
  assert.ok(result.sources.includes('zipcloud'));
  assert.equal((result as any).evidence.postalSourceTrust, 'official-derived');
  assert.ok((result as any).evidence.postalSourceCatalogMatches.includes('zipcloud-jp'));
});

test('official postal source catalog evidence can verify without legacy source-name patterns', () => {
  const result = verifyAddressCandidate({
    targetCountries: ['FR'],
    countryCode: 'FR',
    postalCode: '75001',
    scope: 'address',
    address: {
      country: 'France',
      city: 'Paris',
      road: 'Rue de Rivoli',
      house_number: '99',
      postcode: '75001',
    },
    postalEvidence: [{
      source: 'API Adresse Base Adresse Nationale',
      sourceId: 'api-adresse-data-gouv-fr',
      countryCode: 'FR',
      postalCode: '75001',
      city: 'Paris',
      confidence: 0.95,
    }],
  });

  assert.equal(result.status, 'verified');
  assert.equal((result as any).evidence.postalStrength, 'strong');
  assert.equal((result as any).evidence.postalSourceTrust, 'authoritative');
  assert.ok((result as any).evidence.postalSourceCatalogMatches.includes('api-adresse-data-gouv-fr'));
});

test('blocked postal-source readiness keeps catalog evidence candidate-only', () => {
  const result = verifyAddressCandidate({
    targetCountries: ['FR'],
    countryCode: 'FR',
    postalCode: '00000',
    scope: 'postal',
    postalEvidence: [{
      source: 'API Adresse Base Adresse Nationale',
      sourceId: 'api-adresse-data-gouv-fr',
      countryCode: 'FR',
      postalCode: '00000',
      confidence: 0.99,
    }],
    postalSourceReadiness: [{
      sourceId: 'api-adresse-data-gouv-fr',
      officialReferenceValidationEligible: false,
      deliveryClaimsEnabled: false,
    }],
  });

  assert.equal(result.status, 'partial');
  assert.equal(result.postal.strength, 'weak');
  assert.equal(result.evidence.sourceValidationReadiness, 'blocked');
  assert.equal(result.postal.lookupSatisfied, false);
  assert.equal(result.quality.evidenceGrade, 'format-only');
  assert.equal(result.quality.paidApiParityClaimed, false);
  assert.ok(result.quality.upgradeActions.includes('resolve-postal-source-readiness-gates'));
  assert.ok(result.nextActions.includes('resolve-postal-source-readiness-gates'));
  assert.ok(result.audit.some(step => step.message.includes('candidate use only')));
});

test('African geography plan provides source-gated administrative evidence without replacing postal lookup', () => {
  const result = verifyAddressCandidate({
    targetCountries: ['KE'],
    countryCode: 'KE',
    postalCode: '00000',
    scope: 'postal',
    countryPolicies: {
      KE: {
        countryCode: 'KE',
        enabled: true,
        label: 'Kenya',
        postalMode: 'format-and-lookup',
        postcodeRegex: '^\\d{5}$',
        postcodeFormat: 'NNNNN',
        requiredFields: ['country_code', 'postcode', 'city'],
        lookupSources: [],
        notes: ['Synthetic policy fixture only.'],
      },
    },
    geographicMetadataReadiness: [{
      countryCode: 'KE',
      sourceId: 'ke-official-admin-synthetic',
      sourceOrigin: 'official-publication',
      approvedAdministrativeKeyCount: 1,
      syntheticAdministrativeEvaluationEligible: true,
      deliveryClaimsEnabled: false,
    }],
  });

  assert.equal(result.status, 'partial');
  assert.equal(result.africaGeography?.countryCode, 'KE');
  assert.equal(
    result.africaGeography?.capabilities.find(capability => capability.id === 'administrative-hierarchy')?.state,
    'source-gated',
  );
  assert.equal(
    result.africaGeography?.capabilities.find(capability => capability.id === 'delivery-claims')?.state,
    'disabled',
  );
  assert.equal(result.africaGeography?.sourceComposition.state, 'country-source-attached-source-gated');
  assert.ok(result.africaGeography?.sourceComposition.components.some(component => (
    component.sourceId === 'ke-official-admin-synthetic'
    && component.sourceOrigin === 'official-publication'
  )));
  assert.ok(result.nextActions.includes('record-africa-source-license-version-coverage-and-correction-evidence'));
  assert.ok(result.audit.some(step => step.step === 'africa-geography'));
  assert.ok(result.warnings.some(warning => warning.includes('does not replace strong postal lookup')));
});

test('Asian geography plan provides source-gated script-aware metadata without replacing postal lookup', () => {
  const result = verifyAddressCandidate({
    targetCountries: ['JP'],
    countryCode: 'JP',
    postalCode: '100-0001',
    scope: 'postal',
    countryPolicies: {
      JP: {
        countryCode: 'JP',
        enabled: true,
        label: 'Japan',
        postalMode: 'format-and-lookup',
        postcodeRegex: '^\\d{3}-?\\d{4}$',
        postcodeFormat: 'NNN-NNNN',
        requiredFields: ['country_code', 'postcode', 'city'],
        lookupSources: [],
        notes: ['Synthetic policy fixture only.'],
      },
    },
    geographicMetadataReadiness: [{
      countryCode: 'JP',
      sourceId: 'jp-official-admin-synthetic',
      sourceOrigin: 'official-publication',
      approvedAdministrativeKeyCount: 1,
      syntheticAdministrativeEvaluationEligible: true,
      deliveryClaimsEnabled: false,
    }],
  });

  assert.equal(result.status, 'partial');
  assert.equal(result.asiaGeography?.countryCode, 'JP');
  assert.equal(
    result.asiaGeography?.capabilities.find(capability => capability.id === 'script-aware-locality-aliases')?.state,
    'source-gated',
  );
  assert.equal(
    result.asiaGeography?.capabilities.find(capability => capability.id === 'delivery-claims')?.state,
    'disabled',
  );
  assert.equal(result.asiaGeography?.sourceComposition.state, 'country-source-attached-source-gated');
  assert.ok(result.asiaGeography?.sourceComposition.components.some(component => (
    component.sourceId === 'jp-official-admin-synthetic'
    && component.sourceOrigin === 'official-publication'
  )));
  assert.ok(result.nextActions.includes('define-country-script-ambiguity-and-reversible-normalization-policies'));
  assert.ok(result.audit.some(step => step.step === 'asia-geography'));
  assert.ok(result.warnings.some(warning => warning.includes('does not replace strong postal lookup')));
});

test('Oceania geography plan provides source-gated island metadata without replacing postal lookup', () => {
  const result = verifyAddressCandidate({
    targetCountries: ['NZ'],
    countryCode: 'NZ',
    postalCode: '6011',
    scope: 'postal',
    countryPolicies: {
      NZ: {
        countryCode: 'NZ',
        enabled: true,
        label: 'New Zealand',
        postalMode: 'format-and-lookup',
        postcodeRegex: '^\\d{4}$',
        postcodeFormat: 'NNNN',
        requiredFields: ['country_code', 'postcode', 'city'],
        lookupSources: [],
        notes: ['Synthetic policy fixture only.'],
      },
    },
    geographicMetadataReadiness: [{
      countryCode: 'NZ',
      sourceId: 'nz-official-admin-synthetic',
      sourceOrigin: 'official-publication',
      approvedAdministrativeKeyCount: 1,
      syntheticAdministrativeEvaluationEligible: true,
      deliveryClaimsEnabled: false,
    }],
  });

  assert.equal(result.status, 'partial');
  assert.equal(result.oceaniaGeography?.countryCode, 'NZ');
  assert.equal(
    result.oceaniaGeography?.capabilities.find(capability => capability.id === 'island-and-territory-aliases')?.state,
    'source-gated',
  );
  assert.equal(
    result.oceaniaGeography?.capabilities.find(capability => capability.id === 'delivery-claims')?.state,
    'disabled',
  );
  assert.equal(result.oceaniaGeography?.sourceComposition.state, 'country-source-attached-source-gated');
  assert.ok(result.oceaniaGeography?.sourceComposition.components.some(component => (
    component.sourceId === 'nz-official-admin-synthetic'
    && component.sourceOrigin === 'official-publication'
  )));
  assert.ok(result.nextActions.includes('define-country-and-territory-island-scope-policies'));
  assert.ok(result.audit.some(step => step.step === 'oceania-geography'));
  assert.ok(result.warnings.some(warning => warning.includes('does not replace strong postal lookup')));
});

test('Europe geography plan provides source-gated multilingual and territory-scope metadata without replacing postal lookup', () => {
  const result = verifyAddressCandidate({
    targetCountries: ['FI'],
    countryCode: 'FI',
    postalCode: '00100',
    scope: 'postal',
    countryPolicies: {
      FI: {
        countryCode: 'FI',
        enabled: true,
        label: 'Finland',
        postalMode: 'format-and-lookup',
        postcodeRegex: '^\\d{5}$',
        postcodeFormat: 'NNNNN',
        requiredFields: ['country_code', 'postcode', 'city'],
        lookupSources: [],
        notes: ['Synthetic policy fixture only.'],
      },
    },
    geographicMetadataReadiness: [{
      countryCode: 'FI',
      sourceId: 'fi-official-admin-synthetic',
      sourceOrigin: 'official-publication',
      approvedAdministrativeKeyCount: 1,
      syntheticAdministrativeEvaluationEligible: true,
      deliveryClaimsEnabled: false,
    }],
  });

  assert.equal(result.status, 'partial');
  assert.equal(result.europeGeography?.countryCode, 'FI');
  assert.equal(
    result.europeGeography?.capabilities.find(capability => capability.id === 'country-and-territory-scope-aliases')?.state,
    'source-gated',
  );
  assert.equal(
    result.europeGeography?.capabilities.find(capability => capability.id === 'delivery-claims')?.state,
    'disabled',
  );
  assert.equal(result.europeGeography?.sourceComposition.state, 'country-source-attached-source-gated');
  assert.ok(result.europeGeography?.sourceComposition.components.some(component => (
    component.sourceId === 'fi-official-admin-synthetic'
    && component.sourceOrigin === 'official-publication'
  )));
  assert.ok(result.nextActions.includes('define-country-and-territory-script-ambiguity-and-neutral-scope-policies'));
  assert.ok(result.audit.some(step => step.step === 'europe-geography'));
  assert.ok(result.warnings.some(warning => warning.includes('does not replace strong postal lookup')));
});

test('Americas geography plan provides source-gated language and island-scope metadata without replacing postal lookup', () => {
  const result = verifyAddressCandidate({
    targetCountries: ['BR'],
    countryCode: 'BR',
    postalCode: '01001-000',
    scope: 'postal',
    countryPolicies: {
      BR: {
        countryCode: 'BR',
        enabled: true,
        label: 'Brazil',
        postalMode: 'format-and-lookup',
        postcodeRegex: '^\\d{5}-?\\d{3}$',
        postcodeFormat: 'NNNNN-NNN',
        requiredFields: ['country_code', 'postcode', 'city'],
        lookupSources: [],
        notes: ['Synthetic policy fixture only.'],
      },
    },
    geographicMetadataReadiness: [{
      countryCode: 'BR',
      sourceId: 'br-official-admin-synthetic',
      sourceOrigin: 'official-publication',
      approvedAdministrativeKeyCount: 1,
      syntheticAdministrativeEvaluationEligible: true,
      deliveryClaimsEnabled: false,
    }],
  });

  assert.equal(result.status, 'partial');
  assert.equal(result.americasGeography?.countryCode, 'BR');
  assert.equal(
    result.americasGeography?.capabilities.find(capability => capability.id === 'multilingual-locality-aliases')?.state,
    'source-gated',
  );
  assert.equal(
    result.americasGeography?.capabilities.find(capability => capability.id === 'delivery-claims')?.state,
    'disabled',
  );
  assert.equal(result.americasGeography?.sourceComposition.state, 'country-source-attached-source-gated');
  assert.ok(result.americasGeography?.sourceComposition.components.some(component => (
    component.sourceId === 'br-official-admin-synthetic'
    && component.sourceOrigin === 'official-publication'
  )));
  assert.ok(result.nextActions.includes('define-country-and-territory-language-ambiguity-and-neutral-scope-policies'));
  assert.ok(result.audit.some(step => step.step === 'americas-geography'));
  assert.ok(result.warnings.some(warning => warning.includes('does not replace strong postal lookup')));
});

test('ambiguous regional geographic labels remain explicit and cannot select a postal authority', () => {
  const result = verifyAddressCandidate({
    targetCountries: ['GL'],
    countryCode: 'GL',
    postalCode: '0000',
    scope: 'postal',
    countryPolicies: {
      GL: {
        countryCode: 'GL',
        enabled: true,
        label: 'GL registry label',
        postalMode: 'format-and-lookup',
        postcodeRegex: '^\\d{4}$',
        postcodeFormat: 'NNNN',
        requiredFields: ['country_code', 'postcode', 'city'],
        lookupSources: [],
        notes: ['Synthetic policy fixture only.'],
      },
    },
  });

  assert.equal(result.status, 'partial');
  assert.equal(result.geographicRegionScope.status, 'ambiguous');
  assert.deepEqual(result.geographicRegionScope.matches.map(match => match.region), ['europe', 'americas']);
  assert.ok(result.geographicRegionScope.nonClaims.some(nonClaim => nonClaim.includes('does not select')));
  assert.ok(result.nextActions.includes('select-geographic-region-scope-for-ambiguous-country-code'));
  assert.ok(result.audit.some(step => step.step === 'regional-geography'));
  assert.ok(result.warnings.some(warning => warning.includes('does not select a postal authority')));
});

test('invalid postcode format is unresolved even before external lookup', () => {
  const result = verifyAddressCandidate({
    targetCountries: ['US'],
    countryCode: 'US',
    postalCode: 'ABCDE',
    scope: 'postal',
  });

  assert.equal(result.status, 'unresolved');
  assert.equal(result.postal.formatValid, false);
  assert.ok(result.nextActions.includes('correct-postal-code-format'));
});

test('no-postal-code countries switch to geo verification actions', () => {
  const result = verifyAddressCandidate({
    targetCountries: ['HK'],
    countryCode: 'HK',
    scope: 'address',
    address: {
      country: 'Hong Kong',
      district: 'Central and Western',
      road: "Queen's Road Central",
      building: 'IFC',
    },
    sources: ['hk-csdi', 'osm-nominatim'],
  });

  assert.equal(result.status, 'verified');
  assert.equal(result.postal.required, false);
  assert.equal(result.postal.evidence, 'not-required');
  assert.ok(result.nextActions.includes('verify-with-coordinate-and-open-geodata'));
});

test('country policy helpers expose enabled verification targets', () => {
  assert.ok(DEFAULT_ADDRESS_VERIFICATION_TARGET_COUNTRIES.includes('JP'));
  assert.equal(isCountryEnabledForAddressVerification('uk'), true);
  assert.equal(isCountryEnabledForAddressVerification('JP', ['US']), false);
  assert.equal(getAddressVerificationTargetPolicy('NL')?.postcodeFormat, 'NNNN AA');
});

test('weak postal candidates do not upgrade a deliverability-style address to verified', () => {
  const result = verifyAddressCandidate({
    targetCountries: ['US'],
    countryCode: 'US',
    postalCode: '10001',
    scope: 'address',
    address: {
      country: 'United States',
      state: 'NY',
      city: 'New York',
      road: 'Broadway',
      house_number: '1',
      postcode: '10001',
    },
    postalEvidence: [{
      source: 'zippopotam',
      countryCode: 'US',
      postalCode: '10001',
      state: 'New York',
      city: 'New York',
      confidence: 0.96,
    }],
  });

  assert.equal(result.status, 'partial');
  assert.equal((result as any).evidence.postalStrength, 'weak');
  assert.ok(result.nextActions.includes('collect-strong-postal-or-address-reference'));
});

test('synthetic evidence tagged only with a legal framework does not count as postal lookup evidence', () => {
  const result = verifyAddressCandidate({
    targetCountries: ['GT'],
    countryCode: 'GT',
    postalCode: '00000',
    scope: 'postal',
    postalEvidence: [{
      source: 'Correos de Guatemala postal legal framework',
      sourceId: 'correos-guatemala-postal-legal-framework',
      countryCode: 'GT',
      postalCode: '00000',
      confidence: 0.99,
    }],
  });

  assert.equal(result.status, 'unsupported_country');
  assert.equal((result as any).evidence.postalStrength, 'none');
  assert.equal(result.quality.depth, 'geo-only');
  assert.equal(result.quality.paidApiParityClaimed, false);
  assert.ok((result as any).evidence.postalSourceCatalogMatches.includes(
    'correos-guatemala-postal-legal-framework',
  ));
});

test('reference address matches can verify street and house-level addresses', () => {
  const result = verifyAddressCandidate({
    targetCountries: ['US'],
    countryCode: 'US',
    postalCode: '10001',
    scope: 'address',
    address: {
      country: 'United States',
      state: 'NY',
      city: 'New York',
      road: 'Broadway',
      house_number: '1',
      postcode: '10001',
    },
    referenceRecords: [{
      source: 'openaddresses',
      countryCode: 'US',
      state: 'NY',
      city: 'New York',
      street: 'Broadway',
      houseNumber: '1',
      postcode: '10001',
    }],
  } as any);

  assert.equal(result.status, 'verified');
  assert.equal((result as any).evidence.addressReference, 'matched');
  assert.ok(result.sources.includes('openaddresses'));
});

test('caller supplied country formats enable safe global postal verification without default policies', () => {
  const portugalFormat = {
    countryCode: 'PT',
    name: 'Portugal',
    native: {
      addressFormat: '{{street}} {{houseNumber}}\n{{postcode}} {{city}}\n{{country}}',
      fields: [
        { key: 'postcode', required: true },
        { key: 'city', required: true },
      ],
    },
    postalCode: {
      regex: '^\\d{4}-\\d{3}$',
      source: 'CTT / official postal metadata',
      api: 'https://www.ctt.pt/',
    },
    addressRules: {
      postalCode: { required: true, usage: 'required' as const },
      openSourceIds: ['ctt', 'osm-nominatim'],
    },
  };

  const result = verifyAddressCandidate({
    targetCountries: ['PT'],
    countryCode: 'PT',
    postalCode: '1000-001',
    scope: 'postal',
    format: portugalFormat,
  });

  assert.equal(result.status, 'partial');
  assert.equal(result.country.supported, true);
  assert.equal(result.country.policy?.countryCode, 'PT');
  assert.ok(result.nextActions.includes('run-postal-code-lookup'));
  assert.equal(result.quality.readiness, 'format-only');
  assert.equal(result.quality.paidApiParityClaimed, false);
});

test('authoritative delivery point evidence can be labeled paid-grade for the supplied evidence set', () => {
  const result = verifyAddressCandidate({
    targetCountries: ['US'],
    countryCode: 'US',
    postalCode: '10001-0001',
    scope: 'address',
    address: {
      country: 'United States',
      country_code: 'US',
      state: 'NY',
      city: 'New York',
      road: 'Broadway',
      house_number: '1',
      postcode: '10001-0001',
    },
    postalEvidence: [{
      source: 'USPS Web Tools',
      sourceId: 'usps-web-tools',
      countryCode: 'US',
      postalCode: '10001-0001',
      city: 'New York',
      confidence: 0.97,
    }],
  });

  assert.equal(result.status, 'verified');
  assert.equal(result.quality.depth, 'delivery-point');
  assert.equal(result.quality.evidenceGrade, 'authoritative');
  assert.equal(result.quality.readiness, 'paid-grade-for-supplied-evidence');
  assert.equal(result.quality.paidApiParityClaimed, true);
});

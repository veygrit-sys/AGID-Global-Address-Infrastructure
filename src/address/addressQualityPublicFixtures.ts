import {
  ADDRESS_COVERAGE_POLICY_IDS,
  classifyAddressCoveragePolicy,
  type AddressCoverageFormatLike,
  type AddressCoveragePolicyId,
} from '../lib/addressCoveragePolicy';

export type AddressQualityPublicState = 'verified' | 'partial' | 'manual-required';

export type AddressQualityPublicFixture = {
  fixtureId: string;
  countryCode: string;
  countryName: string;
  format: AddressCoverageFormatLike;
  expectedPolicyId: AddressCoveragePolicyId;
  publicDisplay: {
    primaryIdentifier:
      | 'postal-code'
      | 'postal-code-candidate'
      | 'agid-coordinate'
      | 'agid-coordinate-manual';
    qualityState: AddressQualityPublicState;
    userMode:
      | 'autofill-review'
      | 'candidate-selection'
      | 'geo-verified-review'
      | 'manual-confirmation';
    rawAddressIncluded: false;
    privateMaterialIncluded: false;
    allowedFields: string[];
    hiddenFields: string[];
  };
  evidence: {
    sourceRefs: string[];
    uiReason: string;
    operatorNextAction: string;
  };
};

export type AddressQualityPublicFixtureEvaluation = {
  fixtureId: string;
  countryCode: string;
  expectedPolicyId: AddressCoveragePolicyId;
  actualPolicyId: AddressCoveragePolicyId;
  qualityState: AddressQualityPublicState;
  safeForPublicFixture: boolean;
  operatorNextAction: string;
};

export const ADDRESS_QUALITY_PUBLIC_FIXTURES: AddressQualityPublicFixture[] = [
  {
    fixtureId: 'aqf-jp-reliable-postal-autofill',
    countryCode: 'JP',
    countryName: 'Japan',
    format: {
      countryCode: 'JP',
      name: 'Japan',
      postalCode: {
        regex: '^\\d{3}-\\d{4}$',
        api: 'zipcloud-local-fixture',
        source: 'Japan Post / zipcloud / GSI open metadata',
        format: 'NNN-NNNN',
      },
      addressRules: {
        postalCode: { label: '7 digits', required: true, usage: 'required' },
        openSourceIds: ['zipcloud-jp', 'japan-postcode-api', 'gsi-japan-tiles'],
      },
    },
    expectedPolicyId: 'postal-reliable-api',
    publicDisplay: {
      primaryIdentifier: 'postal-code',
      qualityState: 'verified',
      userMode: 'autofill-review',
      rawAddressIncluded: false,
      privateMaterialIncluded: false,
      allowedFields: ['country', 'postal-policy', 'admin-candidate', 'AGID', 'AOID', 'quality-state'],
      hiddenFields: ['address-value', 'person-name', 'contact-channel', 'secret-material'],
    },
    evidence: {
      sourceRefs: ['postal-code-format', 'reliable-postal-api', 'official-geo-metadata'],
      uiReason: 'Postal metadata can auto-fill administrative candidates, but the user still reviews before registration.',
      operatorNextAction: 'Show verified state and keep the editable address form active.',
    },
  },
  {
    fixtureId: 'aqf-ke-weak-postal-candidates',
    countryCode: 'KE',
    countryName: 'Kenya',
    format: {
      countryCode: 'KE',
      name: 'Kenya',
      postalCode: {
        regex: '^\\d{5}$',
        api: null,
        source: 'GeoNames postal / regional table',
        format: 'NNNNN',
      },
      addressRules: {
        postalCode: { label: '5 digits', required: false, usage: 'hint' },
        openSourceIds: ['geoboundaries-ke', 'osm-kenya'],
      },
    },
    expectedPolicyId: 'postal-weak-api',
    publicDisplay: {
      primaryIdentifier: 'postal-code-candidate',
      qualityState: 'partial',
      userMode: 'candidate-selection',
      rawAddressIncluded: false,
      privateMaterialIncluded: false,
      allowedFields: ['country', 'postal-format', 'candidate-count', 'AGID', 'quality-state'],
      hiddenFields: ['address-value', 'person-name', 'contact-channel', 'secret-material'],
    },
    evidence: {
      sourceRefs: ['postal-format', 'admin-candidate-pack', 'manual-delivery-confirmation'],
      uiReason: 'Postal code format is useful as a hint, but candidates must be selected or edited by the user.',
      operatorNextAction: 'Show candidate mode and avoid automatic administrative overwrite.',
    },
  },
  {
    fixtureId: 'aqf-hk-no-postal-geo-verified',
    countryCode: 'HK',
    countryName: 'Hong Kong',
    format: {
      countryCode: 'HK',
      name: 'Hong Kong',
      postalCode: {
        regex: null,
        api: null,
        source: 'Hongkong Post / LandsD / CSDI (No postal codes used)',
        format: 'None',
      },
      addressRules: {
        postalCode: null,
        openSourceIds: ['landsd-hk', 'csdi-hk', 'osm-hong-kong', 'overture-maps'],
      },
    },
    expectedPolicyId: 'no-postal-strong-geo',
    publicDisplay: {
      primaryIdentifier: 'agid-coordinate',
      qualityState: 'verified',
      userMode: 'geo-verified-review',
      rawAddressIncluded: false,
      privateMaterialIncluded: false,
      allowedFields: ['country', 'AGID', 'AOID', 'admin-candidate', 'geo-source', 'quality-state'],
      hiddenFields: ['address-value', 'person-name', 'contact-channel', 'secret-material'],
    },
    evidence: {
      sourceRefs: ['no-postal-code-policy', 'official-geo-metadata', 'open-building-context'],
      uiReason: 'Postal code is not the primary identifier; AGID, administrative hierarchy, and open geography drive display.',
      operatorNextAction: 'Show AGID primary identifier and Geo Verified state without asking for a postcode.',
    },
  },
  {
    fixtureId: 'aqf-cf-no-postal-manual-required',
    countryCode: 'CF',
    countryName: 'Central African Republic',
    format: {
      countryCode: 'CF',
      name: 'Central African Republic',
      postalCode: {
        regex: null,
        api: null,
        source: 'No postal code public fixture',
        format: 'None',
      },
      addressRules: {
        postalCode: null,
        openSourceIds: ['regional-gazetteer', 'limited-local-index'],
      },
    },
    expectedPolicyId: 'no-postal-weak-geo',
    publicDisplay: {
      primaryIdentifier: 'agid-coordinate-manual',
      qualityState: 'manual-required',
      userMode: 'manual-confirmation',
      rawAddressIncluded: false,
      privateMaterialIncluded: false,
      allowedFields: ['country', 'AGID', 'manual-review-state', 'quality-state'],
      hiddenFields: ['address-value', 'person-name', 'contact-channel', 'secret-material'],
    },
    evidence: {
      sourceRefs: ['no-postal-code-policy', 'limited-open-geo-coverage', 'manual-review-required'],
      uiReason: 'AGID can identify the area, but weak source coverage means a person must confirm before delivery use.',
      operatorNextAction: 'Show Manual required and keep delivery, label, and connector actions blocked.',
    },
  },
];

export function evaluateAddressQualityPublicFixture(
  fixture: AddressQualityPublicFixture,
): AddressQualityPublicFixtureEvaluation {
  const policy = classifyAddressCoveragePolicy(fixture.format);
  const safeForPublicFixture = policy.id === fixture.expectedPolicyId
    && fixture.publicDisplay.rawAddressIncluded === false
    && fixture.publicDisplay.privateMaterialIncluded === false;

  return {
    fixtureId: fixture.fixtureId,
    countryCode: fixture.countryCode,
    expectedPolicyId: fixture.expectedPolicyId,
    actualPolicyId: policy.id,
    qualityState: fixture.publicDisplay.qualityState,
    safeForPublicFixture,
    operatorNextAction: fixture.evidence.operatorNextAction,
  };
}

export function summarizeAddressQualityPublicFixtures(fixtures = ADDRESS_QUALITY_PUBLIC_FIXTURES) {
  const evaluations = fixtures.map(evaluateAddressQualityPublicFixture);
  const byPolicy = Object.fromEntries(ADDRESS_COVERAGE_POLICY_IDS.map(id => [id, 0])) as Record<AddressCoveragePolicyId, number>;
  const byQualityState: Record<AddressQualityPublicState, number> = {
    verified: 0,
    partial: 0,
    'manual-required': 0,
  };

  for (const evaluation of evaluations) {
    byPolicy[evaluation.actualPolicyId] += 1;
    byQualityState[evaluation.qualityState] += 1;
  }

  return {
    total: fixtures.length,
    byPolicy,
    byQualityState,
    allExpectedPoliciesMatch: evaluations.every(evaluation => evaluation.actualPolicyId === evaluation.expectedPolicyId),
    allSafeForPublicFixture: evaluations.every(evaluation => evaluation.safeForPublicFixture),
    evaluations,
  };
}

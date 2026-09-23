import { ADDRESSQL_FUNCTION_SPECS, type AddressQlFunctionSpec } from './addressQlResearch';

export const ADDRESSQL_COUNTRY_POSTAL_VERSION = 'addressql-country-postal-v0.1';

export type AddressQlPostalStatusClass =
  | 'official_postal_code'
  | 'no_postal_code'
  | 'weak_or_partial_postal_code'
  | 'carrier_specific_postal_code'
  | 'postal_equivalent_required';

export type AddressQlCountryPostalWorkflowId =
  | 'country_selector'
  | 'country_native_english_form'
  | 'postal_validation'
  | 'no_postal_code_fallback'
  | 'weak_postal_redesign'
  | 'postal_indexing'
  | 'country_source_policy';

export type AddressQlPostalStatusPolicy = {
  status: AddressQlPostalStatusClass;
  queryPlan: string[];
  fallbackFunctions: string[];
  nonClaims: string[];
};

export type AddressQlCountryPostalWorkflow = {
  id: AddressQlCountryPostalWorkflowId;
  purpose: string;
  orderedFunctions: string[];
  expectedResult: string;
  failureBehavior: string;
};

export const ADDRESSQL_POSTAL_STATUS_POLICIES: AddressQlPostalStatusPolicy[] = [
  {
    status: 'official_postal_code',
    queryPlan: ['COUNTRY_POSTAL_STATUS', 'POSTAL_FORMAT', 'POSTAL_NORMALIZE', 'POSTAL_VALIDATE', 'POSTAL_AREA'],
    fallbackFunctions: ['POSTAL_SUGGEST', 'ADDRESS_WITHIN'],
    nonClaims: ['Official postal-code validation is not proof of residence.'],
  },
  {
    status: 'no_postal_code',
    queryPlan: ['COUNTRY_POSTAL_STATUS', 'POSTAL_REQUIRED', 'POSTAL_EQUIVALENT', 'ADDRESS_WITHIN', 'DELIVERY_AVAILABLE'],
    fallbackFunctions: ['COUNTRY_SUBDIVISIONS', 'ADDRESS_MATCH', 'DELIVERY_AREA'],
    nonClaims: ['Postal-equivalent regions are operational fallbacks, not official postal codes.'],
  },
  {
    status: 'weak_or_partial_postal_code',
    queryPlan: ['COUNTRY_POSTAL_STATUS', 'POSTAL_FORMAT', 'POSTAL_VALIDATE', 'POSTAL_SUGGEST', 'POSTAL_EQUIVALENT'],
    fallbackFunctions: ['COUNTRY_SUBDIVISIONS', 'ADDRESS_WITHIN', 'ADDRESS_SCORE'],
    nonClaims: ['Weak postal data must not silently override administrative or delivery evidence.'],
  },
  {
    status: 'carrier_specific_postal_code',
    queryPlan: ['COUNTRY_POSTAL_STATUS', 'DELIVERY_AREA', 'POSTAL_EQUIVALENT', 'DELIVERY_AVAILABLE'],
    fallbackFunctions: ['ADDRESS_POLICY_CHECK', 'ADDRESS_ACK'],
    nonClaims: ['Carrier-specific postal areas are not universal public postal systems.'],
  },
  {
    status: 'postal_equivalent_required',
    queryPlan: ['COUNTRY_SOURCE_POLICY', 'POSTAL_REQUIRED', 'POSTAL_EQUIVALENT', 'ADDRESS_WITHIN', 'ADDRESS_ACK'],
    fallbackFunctions: ['DELIVERY_TOKEN_CREATE', 'DELIVERY_TOKEN_VERIFY'],
    nonClaims: ['Postal-equivalent assignment is purpose-relative and source-versioned.'],
  },
];

export const ADDRESSQL_COUNTRY_POSTAL_WORKFLOWS: AddressQlCountryPostalWorkflow[] = [
  {
    id: 'country_selector',
    purpose: 'Resolve user-entered country name, code, alias, or localized country display text.',
    orderedFunctions: ['COUNTRY_RESOLVE', 'COUNTRY_ADDRESS_PROFILE', 'COUNTRY_LANGUAGES', 'COUNTRY_SOURCE_POLICY'],
    expectedResult: 'A source-versioned country profile with display/input language policy.',
    failureBehavior: 'Return ambiguous_country or unsupported_country without guessing.',
  },
  {
    id: 'country_native_english_form',
    purpose: 'Render a country-specific address form in native language, English, or dual display.',
    orderedFunctions: ['COUNTRY_ADDRESS_PROFILE', 'COUNTRY_LANGUAGES', 'ADDRESS_SCHEMA', 'ADDRESS_FORMAT'],
    expectedResult: 'Ordered fields, required fields, locale labels, transliteration policy, and format examples.',
    failureBehavior: 'Fall back to minimal structured address fields and mark manual_review_required.',
  },
  {
    id: 'postal_validation',
    purpose: 'Validate a postal code against country format, source version, and address components.',
    orderedFunctions: ['COUNTRY_POSTAL_STATUS', 'POSTAL_FORMAT', 'POSTAL_NORMALIZE', 'POSTAL_VALIDATE', 'POSTAL_AREA'],
    expectedResult: 'Postal validation result with warnings, region hints, and non-claims.',
    failureBehavior: 'Return invalid, unknown, or source_missing without changing user input.',
  },
  {
    id: 'no_postal_code_fallback',
    purpose: 'Support countries and territories where postal codes are absent or not operationally useful.',
    orderedFunctions: ['COUNTRY_POSTAL_STATUS', 'POSTAL_REQUIRED', 'POSTAL_EQUIVALENT', 'ADDRESS_WITHIN', 'DELIVERY_AVAILABLE'],
    expectedResult: 'A postal-equivalent AGID/admin/delivery region for operational validation.',
    failureBehavior: 'Do not invent an official postal code; return postal_equivalent_required or manual_review_required.',
  },
  {
    id: 'weak_postal_redesign',
    purpose: 'Use postal data as one signal when postal coverage is incomplete, weak, or inconsistent.',
    orderedFunctions: ['COUNTRY_POSTAL_STATUS', 'POSTAL_VALIDATE', 'POSTAL_SUGGEST', 'ADDRESS_SCORE', 'ADDRESS_ISSUES'],
    expectedResult: 'A scored candidate set with warnings and repair suggestions.',
    failureBehavior: 'Keep address as partial and require extra evidence rather than rejecting solely by postal mismatch.',
  },
  {
    id: 'postal_indexing',
    purpose: 'Combine postal, administrative, spatial, landmark, and commitment indexes safely.',
    orderedFunctions: ['POSTAL_LOOKUP', 'POSTAL_AREA', 'ADDRESS_WITHIN', 'ADDRESS_MATCH', 'ADDRESS_COMMIT'],
    expectedResult: 'A bounded candidate set with source version and leakage-aware index notes.',
    failureBehavior: 'Use coarse-to-fine fallback and avoid raw address logging.',
  },
  {
    id: 'country_source_policy',
    purpose: 'Choose official, open, community, carrier, or AGID fallback sources for each country and purpose.',
    orderedFunctions: ['COUNTRY_SOURCE_POLICY', 'COUNTRY_SUBDIVISIONS', 'COUNTRY_POSTAL_STATUS', 'POSTAL_STATUS', 'ADDRESS_POLICY_CHECK'],
    expectedResult: 'Purpose-specific source ranking, attribution, and allowed fallback behavior.',
    failureBehavior: 'Return source_insufficient and require manual review or additional source pack.',
  },
];

export function getAddressQlCountryFunctions(): AddressQlFunctionSpec[] {
  return ADDRESSQL_FUNCTION_SPECS.filter(spec => spec.category === 'country_metadata');
}

export function getAddressQlPostalFunctions(): AddressQlFunctionSpec[] {
  return ADDRESSQL_FUNCTION_SPECS.filter(spec => spec.name.startsWith('POSTAL_'));
}

export function validateAddressQlCountryPostalModel(): string[] {
  const errors: string[] = [];
  const functions = new Set(ADDRESSQL_FUNCTION_SPECS.map(spec => spec.name));

  if (getAddressQlCountryFunctions().length < 6) errors.push('needs at least six country functions');
  if (getAddressQlPostalFunctions().length < 10) errors.push('needs at least ten postal functions');

  for (const workflow of ADDRESSQL_COUNTRY_POSTAL_WORKFLOWS) {
    if (workflow.orderedFunctions.length < 4) errors.push(`${workflow.id}: needs at least four ordered functions`);
    if (!workflow.failureBehavior) errors.push(`${workflow.id}: missing failure behavior`);
    for (const functionName of workflow.orderedFunctions) {
      if (!functions.has(functionName)) errors.push(`${workflow.id}: unknown function ${functionName}`);
    }
  }

  for (const policy of ADDRESSQL_POSTAL_STATUS_POLICIES) {
    if (policy.queryPlan.length < 4) errors.push(`${policy.status}: weak query plan`);
    if (policy.nonClaims.length === 0) errors.push(`${policy.status}: missing non-claims`);
    for (const functionName of [...policy.queryPlan, ...policy.fallbackFunctions]) {
      if (!functions.has(functionName)) errors.push(`${policy.status}: unknown function ${functionName}`);
    }
  }

  const noPostal = ADDRESSQL_POSTAL_STATUS_POLICIES.find(policy => policy.status === 'no_postal_code');
  if (!noPostal?.queryPlan.includes('POSTAL_EQUIVALENT')) {
    errors.push('no-postal-code policy must use POSTAL_EQUIVALENT');
  }

  const countrySelector = ADDRESSQL_COUNTRY_POSTAL_WORKFLOWS.find(workflow => workflow.id === 'country_selector');
  if (!countrySelector?.orderedFunctions.includes('COUNTRY_RESOLVE')) {
    errors.push('country selector must start from COUNTRY_RESOLVE');
  }

  return errors;
}

export type AddressRepositoryRoleId =
  | 'country-address-model'
  | 'administrative-crosswalk'
  | 'postal-agid-crosswalk'
  | 'normalization-rules'
  | 'translation-rules'
  | 'validation-rules'
  | 'conformance-test-data';

export type AddressRepositoryRole = {
  id: AddressRepositoryRoleId;
  label: string;
  purpose: string;
  githubStorage: string[];
  externalStorage: string[];
  supports: Array<'address-morphism' | 'address-translation' | 'normalization' | 'agid-generation' | 'validation'>;
  storesRawPersonalAddress: false;
};

export type CountryAddressGraphExample = {
  countryCode: string;
  nativeHierarchy: string[];
  commonGraphNodes: string[];
  canonicalAgidPath: string[];
};

export type AddressMorphismPipelineStep = {
  id: string;
  label: string;
  owner: 'source-country-repo' | 'agid-core' | 'target-country-repo';
  output: string;
};

export type CountryRepositoryContract = {
  countryCode: string;
  repository: string;
  requiredRoles: AddressRepositoryRoleId[];
  commonModelBoundary: string;
  qualityGates: string[];
  privacyGates: string[];
  canImproveIndependently: true;
};

export const ADDRESS_REPOSITORY_ROLES: AddressRepositoryRole[] = [
  {
    id: 'country-address-model',
    label: 'Country address model',
    purpose: 'Defines the country-specific breadcrumb hierarchy used to reconstruct local addresses.',
    githubStorage: ['hierarchy schema', 'breadcrumb node types', 'rendering order', 'source metadata'],
    externalStorage: ['large address node dumps', 'building polygons', 'search indexes'],
    supports: ['address-morphism', 'address-translation', 'agid-generation'],
    storesRawPersonalAddress: false,
  },
  {
    id: 'administrative-crosswalk',
    label: 'Administrative crosswalk',
    purpose: 'Maps national administrative units to AGID common graph nodes without forcing one global hierarchy.',
    githubStorage: ['admin code mappings', 'parent-child rules', 'validity intervals', 'source metadata'],
    externalStorage: ['high-resolution boundaries', 'historical geometry packs'],
    supports: ['address-morphism', 'normalization', 'validation'],
    storesRawPersonalAddress: false,
  },
  {
    id: 'postal-agid-crosswalk',
    label: 'Postal and AGID crosswalk',
    purpose: 'Connects existing postal codes or generated AGID postal zones to common address graph nodes.',
    githubStorage: ['postal formats', 'AGID zone rules', 'status flags', 'deprecation mapping'],
    externalStorage: ['bulk postal tables', 'carrier-only route packs'],
    supports: ['agid-generation', 'address-morphism', 'validation'],
    storesRawPersonalAddress: false,
  },
  {
    id: 'normalization-rules',
    label: 'Normalization rules',
    purpose: 'Normalizes scripts, abbreviations, numeric forms, aliases, and country-specific address variants.',
    githubStorage: ['safe rule tables', 'abbreviation policy', 'alias policy', 'locale metadata'],
    externalStorage: ['large search dictionaries', 'token indexes'],
    supports: ['normalization', 'address-morphism', 'validation'],
    storesRawPersonalAddress: false,
  },
  {
    id: 'translation-rules',
    label: 'Translation rules',
    purpose: 'Transforms structured address elements into target-language and international-shipping views.',
    githubStorage: ['transliteration policy', 'field order rules', 'language tabs', 'carrier label templates'],
    externalStorage: ['large machine-translation models', 'locale search indexes'],
    supports: ['address-translation', 'address-morphism', 'validation'],
    storesRawPersonalAddress: false,
  },
  {
    id: 'validation-rules',
    label: 'Validation rules',
    purpose: 'Checks whether a structured address is usable for delivery, identity, maps, forms, or AGID creation.',
    githubStorage: ['required fields', 'confidence thresholds', 'warning catalog', 'quality scoring rules'],
    externalStorage: ['live carrier decisions', 'private audit logs'],
    supports: ['validation', 'normalization', 'agid-generation'],
    storesRawPersonalAddress: false,
  },
  {
    id: 'conformance-test-data',
    label: 'Conformance test data',
    purpose: 'Provides safe fixtures proving that country rules round-trip through AGID without raw personal data.',
    githubStorage: ['synthetic fixtures', 'round-trip vectors', 'edge-case cases', 'expected warnings'],
    externalStorage: ['private operational samples', 'raw recipient records'],
    supports: ['address-morphism', 'address-translation', 'normalization', 'agid-generation', 'validation'],
    storesRawPersonalAddress: false,
  },
];

export const COUNTRY_ADDRESS_GRAPH_EXAMPLES: CountryAddressGraphExample[] = [
  {
    countryCode: 'JP',
    nativeHierarchy: ['prefecture', 'municipality', 'town-chome', 'block', 'building', 'unit'],
    commonGraphNodes: ['country', 'admin-level-1', 'locality', 'sub-locality', 'address-block', 'site', 'unit'],
    canonicalAgidPath: ['JP', 'admin-level-1', 'locality', 'sub-locality', 'site-or-delivery-cell'],
  },
  {
    countryCode: 'US',
    nativeHierarchy: ['state', 'city', 'street', 'house-number', 'building', 'unit'],
    commonGraphNodes: ['country', 'admin-level-1', 'locality', 'route', 'address-point', 'site', 'unit'],
    canonicalAgidPath: ['US', 'admin-level-1', 'locality', 'route', 'address-point-or-delivery-cell'],
  },
];

export const ADDRESS_MORPHISM_REPOSITORY_PIPELINE: AddressMorphismPipelineStep[] = [
  {
    id: 'source-native-address',
    label: 'Source native address graph',
    owner: 'source-country-repo',
    output: 'structured source-country breadcrumb nodes',
  },
  {
    id: 'source-to-common-morphism',
    label: 'Country morphism into AGID common graph',
    owner: 'source-country-repo',
    output: 'common address graph nodes with source provenance',
  },
  {
    id: 'agid-common-model',
    label: 'AGID common model',
    owner: 'agid-core',
    output: 'country-neutral AGID path, AOID link, alias, and confidence metadata',
  },
  {
    id: 'common-to-target-morphism',
    label: 'Target-country rendering morphism',
    owner: 'target-country-repo',
    output: 'target-language and purpose-specific structured address',
  },
  {
    id: 'validated-output',
    label: 'Validated address view',
    owner: 'target-country-repo',
    output: 'shipping, identity, map, form, or privacy-preserving address view',
  },
];

export function buildCountryRepositoryContract(countryCode: string): CountryRepositoryContract {
  const normalized = countryCode.trim().toUpperCase();
  return {
    countryCode: normalized,
    repository: `agid-country-${normalized.toLowerCase()}`,
    requiredRoles: ADDRESS_REPOSITORY_ROLES.map(role => role.id),
    commonModelBoundary: 'Country repos own local rules; AGID core owns the common graph, identifiers, privacy gates, and conformance semantics.',
    qualityGates: [
      'breadcrumb-round-trip',
      'admin-parent-child-consistency',
      'postal-agid-status-explicit',
      'translation-order-preserved',
      'validation-warning-catalog-covered',
      'synthetic-conformance-fixtures-present',
    ],
    privacyGates: [
      'no-raw-personal-address-in-github',
      'no-recipient-fixtures',
      'no-private-coordinate-dumps',
      'safe-synthetic-test-data-only',
    ],
    canImproveIndependently: true,
  };
}

export function listRolesForCapability(capability: AddressRepositoryRole['supports'][number]) {
  return ADDRESS_REPOSITORY_ROLES.filter(role => role.supports.includes(capability));
}

export function evaluateRepositoryRoleCoverage(roleIds: AddressRepositoryRoleId[]) {
  const provided = new Set(roleIds);
  const missing = ADDRESS_REPOSITORY_ROLES
    .map(role => role.id)
    .filter(roleId => !provided.has(roleId));
  return {
    ready: missing.length === 0,
    provided: roleIds.length,
    required: ADDRESS_REPOSITORY_ROLES.length,
    missing,
  };
}

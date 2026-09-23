export const ADDRESSQL_API_SDK_VERSION = 'addressql-api-sdk-v0.4';

export type AddressQlSdkLanguage = 'typescript' | 'python' | 'rust';

export type AddressQlSdkArtifact = {
  language: AddressQlSdkLanguage;
  path: string;
  packageName: string;
  role: string;
  testCommand: string;
  usesHostedApi: boolean;
};

export type AddressQlSdkFunction = {
  canonicalName: string;
  typeScriptName: string;
  pythonName: string;
  rustName: string;
  nonClaimRequired: boolean;
};

export const ADDRESSQL_SDK_ARTIFACTS: AddressQlSdkArtifact[] = [
  {
    language: 'typescript',
    path: 'sdk/addressql-js-ts',
    packageName: '@addressql/sdk',
    role: 'Web, Node.js, Address Login, and developer tooling SDK.',
    testCommand: 'npx tsx --test sdk/addressql-js-ts/test/sdk.test.ts',
    usesHostedApi: false,
  },
  {
    language: 'python',
    path: 'sdk/addressql-py',
    packageName: 'addressql',
    role: 'Research notebooks, data preparation, and benchmark corpus checks.',
    testCommand: 'python -m unittest discover sdk/addressql-py/tests',
    usesHostedApi: false,
  },
  {
    language: 'rust',
    path: 'sdk/addressql-rs',
    packageName: 'addressql-sdk',
    role: 'Native facade over addressql-core for adapters and high-performance embedding.',
    testCommand: 'cargo test --manifest-path sdk/addressql-rs/Cargo.toml',
    usesHostedApi: false,
  },
];

export const ADDRESSQL_SDK_FUNCTIONS: AddressQlSdkFunction[] = [
  { canonicalName: 'COUNTRY_RESOLVE', typeScriptName: 'countryResolve', pythonName: 'country_resolve', rustName: 'country_resolve', nonClaimRequired: true },
  { canonicalName: 'COUNTRY_ADDRESS_PROFILE', typeScriptName: 'countryAddressProfile', pythonName: 'country_address_profile', rustName: 'country_address_profile', nonClaimRequired: false },
  { canonicalName: 'POSTAL_STATUS', typeScriptName: 'postalStatus', pythonName: 'postal_status', rustName: 'postal_status', nonClaimRequired: false },
  { canonicalName: 'POSTAL_NORMALIZE', typeScriptName: 'postalNormalize', pythonName: 'postal_normalize', rustName: 'postal_normalize', nonClaimRequired: false },
  { canonicalName: 'POSTAL_VALIDATE', typeScriptName: 'postalValidate', pythonName: 'postal_validate', rustName: 'postal_validate', nonClaimRequired: true },
  { canonicalName: 'POSTAL_EQUIVALENT', typeScriptName: 'postalEquivalent', pythonName: 'postal_equivalent', rustName: 'postal_equivalent', nonClaimRequired: true },
  { canonicalName: 'ADDRESS_NORMALIZE', typeScriptName: 'normalizeAddress', pythonName: 'normalize_address', rustName: 'address_normalize', nonClaimRequired: true },
  { canonicalName: 'ADDRESS_MATCH', typeScriptName: 'addressMatch', pythonName: 'address_match', rustName: 'address_match', nonClaimRequired: true },
  { canonicalName: 'ADDRESS_DISTANCE', typeScriptName: 'addressDistanceKm', pythonName: 'address_distance_km', rustName: 'address_distance_km', nonClaimRequired: true },
  { canonicalName: 'DELIVERY_AVAILABLE', typeScriptName: 'deliveryAvailable', pythonName: 'delivery_available', rustName: 'delivery_available', nonClaimRequired: true },
];

export function validateAddressQlApiSdkPlan(): string[] {
  const errors: string[] = [];
  const languages = new Set(ADDRESSQL_SDK_ARTIFACTS.map(artifact => artifact.language));
  const canonicalNames = new Set<string>();

  for (const language of ['typescript', 'python', 'rust'] as const) {
    if (!languages.has(language)) errors.push(`missing SDK language: ${language}`);
  }

  for (const artifact of ADDRESSQL_SDK_ARTIFACTS) {
    if (!artifact.path.startsWith('sdk/addressql-')) {
      errors.push(`${artifact.path}: SDK artifacts must stay under sdk/addressql-*`);
    }
    if (artifact.usesHostedApi) {
      errors.push(`${artifact.packageName}: v0.4 SDK must not depend on hosted API`);
    }
  }

  for (const fn of ADDRESSQL_SDK_FUNCTIONS) {
    if (canonicalNames.has(fn.canonicalName)) errors.push(`duplicate SDK function: ${fn.canonicalName}`);
    canonicalNames.add(fn.canonicalName);
    if (!fn.typeScriptName || !fn.pythonName || !fn.rustName) {
      errors.push(`${fn.canonicalName}: missing language binding name`);
    }
  }

  for (const required of ['COUNTRY_RESOLVE', 'POSTAL_VALIDATE', 'POSTAL_EQUIVALENT', 'ADDRESS_NORMALIZE', 'ADDRESS_MATCH', 'ADDRESS_DISTANCE', 'DELIVERY_AVAILABLE']) {
    if (!canonicalNames.has(required)) errors.push(`missing SDK function: ${required}`);
  }

  return errors;
}

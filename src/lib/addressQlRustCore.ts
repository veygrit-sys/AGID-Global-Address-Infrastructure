import { ADDRESSQL_FUNCTION_SPECS } from './addressQlResearch';

export const ADDRESSQL_RUST_CORE_VERSION = 'addressql-rust-core-v0.2';

export type AddressQlRustCoreTarget =
  | 'postgres_pgrx'
  | 'sqlite_extension'
  | 'wasm'
  | 'cli'
  | 'typescript_sdk'
  | 'python_sdk'
  | 'go_sdk'
  | 'rust_sdk';

export type AddressQlRustCoreModule = {
  path: string;
  purpose: string;
  publicBoundary: string;
};

export type AddressQlRustCoreFunction = {
  canonicalName: string;
  rustName: string;
  outputStruct: string;
  pure: boolean;
  postgresIndependent: boolean;
  fixtureCovered: boolean;
};

export type AddressQlRustCoreAdapterContract = {
  target: AddressQlRustCoreTarget;
  adapterPackage: string;
  useCoreFor: string[];
  mustNotDo: string[];
};

export const ADDRESSQL_RUST_CORE_MODULES: AddressQlRustCoreModule[] = [
  {
    path: 'native/addressql-core/Cargo.toml',
    purpose: 'Rust crate manifest for the PostgreSQL-independent core',
    publicBoundary: 'No PostgreSQL, PostGIS, network, or hosted API dependency.',
  },
  {
    path: 'native/addressql-core/src/model.rs',
    purpose: 'Typed Rust structs for AddressQL result semantics',
    publicBoundary: 'Adapters render structs to JSONB/BSON/protobuf/SDK objects.',
  },
  {
    path: 'native/addressql-core/src/fixtures.rs',
    purpose: 'Synthetic country, postal, and postal-area fixtures',
    publicBoundary: 'No raw recipient addresses or production data.',
  },
  {
    path: 'native/addressql-core/src/lib.rs',
    purpose: 'Pure functions for country, postal, matching, distance, and delivery decisions',
    publicBoundary: 'No database-specific side effects.',
  },
  {
    path: 'native/addressql-core/README.md',
    purpose: 'v0.2 adapter boundary and usage notes',
    publicBoundary: 'Documents non-claims and build limitations.',
  },
];

export const ADDRESSQL_RUST_CORE_FUNCTIONS: AddressQlRustCoreFunction[] = [
  { canonicalName: 'COUNTRY_RESOLVE', rustName: 'country_resolve', outputStruct: 'CountryResolution', pure: true, postgresIndependent: true, fixtureCovered: true },
  { canonicalName: 'COUNTRY_ADDRESS_PROFILE', rustName: 'country_address_profile', outputStruct: 'CountryProfile', pure: true, postgresIndependent: true, fixtureCovered: true },
  { canonicalName: 'COUNTRY_PROFILE', rustName: 'country_profile', outputStruct: 'CountryProfile', pure: true, postgresIndependent: true, fixtureCovered: true },
  { canonicalName: 'POSTAL_STATUS', rustName: 'postal_status', outputStruct: 'PostalStatus', pure: true, postgresIndependent: true, fixtureCovered: true },
  { canonicalName: 'POSTAL_NORMALIZE', rustName: 'postal_normalize', outputStruct: 'String', pure: true, postgresIndependent: true, fixtureCovered: true },
  { canonicalName: 'POSTAL_FORMAT_VALIDATE', rustName: 'postal_format_validate', outputStruct: 'bool', pure: true, postgresIndependent: true, fixtureCovered: true },
  { canonicalName: 'POSTAL_EXISTS', rustName: 'postal_exists', outputStruct: 'Option<bool>', pure: true, postgresIndependent: true, fixtureCovered: true },
  { canonicalName: 'POSTAL_VALIDATE', rustName: 'postal_validate', outputStruct: 'PostalValidation', pure: true, postgresIndependent: true, fixtureCovered: true },
  { canonicalName: 'POSTAL_LOOKUP', rustName: 'postal_lookup', outputStruct: 'PostalArea[]', pure: true, postgresIndependent: true, fixtureCovered: true },
  { canonicalName: 'POSTAL_EQUIVALENT', rustName: 'postal_equivalent', outputStruct: 'PostalEquivalent', pure: true, postgresIndependent: true, fixtureCovered: true },
  { canonicalName: 'ADDRESS_NORMALIZE', rustName: 'address_normalize', outputStruct: 'NormalizedAddress', pure: true, postgresIndependent: true, fixtureCovered: true },
  { canonicalName: 'ADDRESS_MATCH', rustName: 'address_match', outputStruct: 'AddressMatchDecision', pure: true, postgresIndependent: true, fixtureCovered: true },
  { canonicalName: 'ADDRESS_DISTANCE', rustName: 'address_distance_km', outputStruct: 'DistanceEstimate', pure: true, postgresIndependent: true, fixtureCovered: true },
  { canonicalName: 'DELIVERY_AVAILABLE', rustName: 'delivery_available', outputStruct: 'DeliveryAvailability', pure: true, postgresIndependent: true, fixtureCovered: true },
];

export const ADDRESSQL_RUST_CORE_ADAPTER_CONTRACTS: AddressQlRustCoreAdapterContract[] = [
  {
    target: 'postgres_pgrx',
    adapterPackage: 'addressql-postgres',
    useCoreFor: ['country functions', 'postal functions', 'normalization', 'matching', 'distance fallback', 'delivery availability'],
    mustNotDo: ['change non-claims', 'store raw address fixtures', 'hide PostGIS fallback warnings'],
  },
  {
    target: 'sqlite_extension',
    adapterPackage: 'addressql-sqlite',
    useCoreFor: ['offline country/postal functions', 'local validation', 'mobile fixture replay'],
    mustNotDo: ['call production APIs', 'require PostGIS', 'depend on PostgreSQL system catalogs'],
  },
  {
    target: 'wasm',
    adapterPackage: 'addressql-wasm',
    useCoreFor: ['browser validation', 'edge workers', 'Address Login offline checks'],
    mustNotDo: ['include production private data', 'expose raw address logs', 'claim audited ZK circuits'],
  },
  {
    target: 'cli',
    adapterPackage: 'addressql-cli',
    useCoreFor: ['fixture validation', 'conformance export', 'local smoke tests'],
    mustNotDo: ['send production traffic', 'read private address books', 'write hidden telemetry'],
  },
  {
    target: 'typescript_sdk',
    adapterPackage: 'addressql-core-js',
    useCoreFor: ['golden fixture parity', 'JSON schema generation', 'developer examples'],
    mustNotDo: ['diverge from Rust source-version semantics', 'silently rewrite user input'],
  },
  {
    target: 'python_sdk',
    adapterPackage: 'addressql-python',
    useCoreFor: ['data preparation', 'research notebooks', 'benchmark corpus checks'],
    mustNotDo: ['ship raw address corpora', 'mix commercial datasets into OSS fixtures'],
  },
  {
    target: 'go_sdk',
    adapterPackage: 'addressql-go',
    useCoreFor: ['server-side validation', 'batch conformance runners'],
    mustNotDo: ['skip non-claim fields', 'treat deliverability as identity'],
  },
  {
    target: 'rust_sdk',
    adapterPackage: 'addressql-core',
    useCoreFor: ['native embedding', 'pgrx bridge', 'SQLite bridge', 'WASM bridge'],
    mustNotDo: ['add database-specific dependencies to core', 'add network calls to core'],
  },
];

export function validateAddressQlRustCorePlan(): string[] {
  const errors: string[] = [];
  const canonicalNames = new Set(ADDRESSQL_FUNCTION_SPECS.map(spec => spec.name));
  const coreOnlyCanonicalNames = new Set(['COUNTRY_PROFILE', 'POSTAL_FORMAT_VALIDATE', 'POSTAL_EXISTS']);
  const rustNames = new Set<string>();
  const targets = new Set<AddressQlRustCoreTarget>();

  for (const module of ADDRESSQL_RUST_CORE_MODULES) {
    if (!module.path.startsWith('native/addressql-core/')) {
      errors.push(`${module.path}: Rust core modules must stay under native/addressql-core`);
    }
    if (!/No |Adapters|Documents/.test(module.publicBoundary)) {
      errors.push(`${module.path}: weak public boundary`);
    }
  }

  for (const fn of ADDRESSQL_RUST_CORE_FUNCTIONS) {
    if (!canonicalNames.has(fn.canonicalName) && !coreOnlyCanonicalNames.has(fn.canonicalName)) {
      errors.push(`${fn.canonicalName}: missing canonical AddressQL registry function`);
    }
    if (rustNames.has(fn.rustName)) errors.push(`duplicate Rust function: ${fn.rustName}`);
    rustNames.add(fn.rustName);
    if (!fn.pure) errors.push(`${fn.rustName}: must be pure`);
    if (!fn.postgresIndependent) errors.push(`${fn.rustName}: must be PostgreSQL independent`);
    if (!fn.fixtureCovered) errors.push(`${fn.rustName}: missing fixture coverage`);
  }

  for (const contract of ADDRESSQL_RUST_CORE_ADAPTER_CONTRACTS) {
    targets.add(contract.target);
    if (contract.useCoreFor.length < 2) errors.push(`${contract.target}: needs core use cases`);
    if (contract.mustNotDo.length < 2) errors.push(`${contract.target}: needs must-not-do boundaries`);
  }

  for (const target of ['postgres_pgrx', 'sqlite_extension', 'wasm', 'cli', 'typescript_sdk', 'python_sdk', 'go_sdk', 'rust_sdk'] as const) {
    if (!targets.has(target)) errors.push(`missing adapter contract: ${target}`);
  }

  return errors;
}

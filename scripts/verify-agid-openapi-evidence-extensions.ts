import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const SPECS_DIR = join('docs', 'specs');
const OPENAPI_EVIDENCE_EXTENSION_SCHEMA_PATH = join(
  'docs',
  'specs',
  'schemas',
  'agid-openapi-evidence-extension-v0.1.schema.json',
);
const LINKED_VERIFIER_ALLOWLIST_PATH = join(
  'docs',
  'specs',
  'fixtures',
  'agid-openapi-linked-verifiers-v0.1.json',
);
const LINKED_VERIFIER_ALLOWLIST_SCHEMA_PATH = join(
  'docs',
  'specs',
  'schemas',
  'agid-openapi-linked-verifiers-v0.1.schema.json',
);
const NON_CLAIMS_PROFILES_PATH = join(
  'docs',
  'specs',
  'fixtures',
  'agid-non-claims-profiles-v0.1.json',
);
const NON_CLAIMS_PROFILES_SCHEMA_PATH = join(
  'docs',
  'specs',
  'schemas',
  'agid-non-claims-profiles-v0.1.schema.json',
);
const DEFAULT_LINKED_VERIFIER_TIMEOUT_MS = 120_000;
const REQUIRED_LINKED_VERIFIER_NON_CLAIMS = [
  'not-raw-address-intake',
  'not-proof-witness-intake',
] as const;

type JsonObject = Record<string, unknown>;

type JsonSchemaSubset = {
  $ref?: string;
  allOf?: JsonSchemaSubset[];
  const?: unknown;
  enum?: unknown[];
  type?: string;
  format?: string;
  pattern?: string;
  minimum?: number;
  minLength?: number;
  minItems?: number;
  required?: string[];
  properties?: Record<string, JsonSchemaSubset>;
  additionalProperties?: boolean | JsonSchemaSubset;
  items?: JsonSchemaSubset;
  contains?: JsonSchemaSubset;
};

type OpenApiEvidenceFixturesExtension = {
  preflightFixture?: string;
  historyFixture?: string;
  evidenceFixture?: string;
  evidenceSchema?: string;
  verifierCommand?: string;
  aggregateVerifierCommand?: string;
  managedServiceBoundary?: string;
  localOnly?: boolean;
  forbiddenMaterial?: string[];
  nonClaims?: string[];
  nonClaimsProfile?: string;
};

type CheckedExtension = {
  openApiPath: string;
  location: string;
  preflightFixture: string;
  historyFixture: string;
  evidenceFixture: string;
  evidenceSchema: string;
  verifierCommand: string;
  aggregateVerifierCommand: string;
  managedServiceBoundary: string;
  nonClaims: string[];
  nonClaimsProfile: string;
};

type LinkedVerifierRun = {
  command: string;
  script: string;
  ok: boolean;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  durationMs: number;
  error?: string;
};

type LinkedVerifierConfig = {
  command?: string;
  script?: string;
  runner?: string[];
  timeoutMs?: number;
  managedServiceBoundary?: string;
};

type LinkedVerifierAllowlist = {
  artifact?: string;
  version?: string;
  localOnly?: boolean;
  nonClaims?: string[];
  verifiers?: LinkedVerifierConfig[];
};

type NonClaimsProfile = {
  id?: string;
  description?: string;
  requiredNonClaims?: string[];
  openApiEvidenceSchema?: string;
};

type NonClaimsProfileSet = {
  artifact?: string;
  version?: string;
  localOnly?: boolean;
  requiredBaseNonClaims?: string[];
  profiles?: NonClaimsProfile[];
};

type ProfileSchemaCacheEntry = {
  schema?: JsonSchemaSubset;
  errors: string[];
};

export type VerifyAgidOpenApiEvidenceExtensionsOptions = {
  runLinkedVerifiers?: boolean;
  linkedVerifierAllowlistPath?: string;
  linkedVerifierTimeoutMs?: number;
};

export type AgidOpenApiEvidenceExtensionScanResult = {
  ok: boolean;
  schemaPath: string;
  openApiFiles: string[];
  checkedExtensions: CheckedExtension[];
  linkedVerifierAllowlistPath: string;
  nonClaimsProfilesPath: string;
  linkedVerifierRuns: LinkedVerifierRun[];
  errors: string[];
};

function toSpecPath(path: string) {
  return path.replace(/\\/g, '/');
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSchemaSubset(value: unknown): value is JsonSchemaSubset {
  return isJsonObject(value);
}

function readJson<T>(path: string): { value?: T; errors: string[] } {
  if (!existsSync(path)) return { errors: [`missing-file:${toSpecPath(path)}`] };

  try {
    return { value: JSON.parse(readFileSync(path, 'utf8')) as T, errors: [] };
  } catch (error) {
    return { errors: [`invalid-json:${toSpecPath(path)}:${error instanceof Error ? error.message : String(error)}`] };
  }
}

function readYaml<T>(path: string): { value?: T; errors: string[] } {
  if (!existsSync(path)) return { errors: [`missing-file:${toSpecPath(path)}`] };

  try {
    return { value: parseYaml(readFileSync(path, 'utf8')) as T, errors: [] };
  } catch (error) {
    return { errors: [`invalid-yaml:${toSpecPath(path)}:${error instanceof Error ? error.message : String(error)}`] };
  }
}

function listOpenApiFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .flatMap(entry => {
      const path = join(dir, entry);
      const stats = statSync(path);
      if (stats.isDirectory()) return listOpenApiFiles(path);
      return /\.openapi\.ya?ml$/.test(entry) ? [path] : [];
    })
    .sort((a, b) => a.localeCompare(b));
}

function schemaTypeMatches(type: string | undefined, value: unknown) {
  if (!type) return true;
  if (type === 'object') return isJsonObject(value);
  if (type === 'array') return Array.isArray(value);
  if (type === 'string') return typeof value === 'string';
  if (type === 'boolean') return typeof value === 'boolean';
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  return true;
}

function resolveSchemaRef(root: JsonSchemaSubset, ref: string): JsonSchemaSubset | undefined {
  if (!ref.startsWith('#/')) return undefined;
  const parts = ref.slice(2).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'));
  let current: unknown = root;

  for (const part of parts) {
    if (!isJsonObject(current)) return undefined;
    current = current[part];
  }

  return isSchemaSubset(current) ? current : undefined;
}

function validateJsonWithSchemaSubset(
  value: unknown,
  schema: JsonSchemaSubset,
  root = schema,
  path = '$',
): string[] {
  const errors: string[] = [];

  if (schema.$ref) {
    const resolved = resolveSchemaRef(root, schema.$ref);
    if (!resolved) return [`${path}:unresolved-ref:${schema.$ref}`];
    return validateJsonWithSchemaSubset(value, resolved, root, path);
  }

  schema.allOf?.forEach((child, index) => {
    errors.push(...validateJsonWithSchemaSubset(value, child, root, `${path}.allOf[${index}]`));
  });

  if ('const' in schema && JSON.stringify(value) !== JSON.stringify(schema.const)) errors.push(`${path}:const-mismatch`);
  if (schema.enum && !schema.enum.some(option => JSON.stringify(option) === JSON.stringify(value))) {
    errors.push(`${path}:enum-mismatch`);
  }
  if (!schemaTypeMatches(schema.type, value)) {
    errors.push(`${path}:type-mismatch:${schema.type}`);
    return errors;
  }
  if (schema.format === 'date-time' && typeof value === 'string' && Number.isNaN(Date.parse(value))) {
    errors.push(`${path}:date-time-format-mismatch`);
  }
  if (schema.pattern && typeof value === 'string' && !new RegExp(schema.pattern).test(value)) {
    errors.push(`${path}:pattern-mismatch`);
  }
  if (typeof schema.minLength === 'number' && typeof value === 'string' && value.length < schema.minLength) {
    errors.push(`${path}:min-length-mismatch`);
  }
  if (typeof schema.minimum === 'number' && typeof value === 'number' && value < schema.minimum) {
    errors.push(`${path}:minimum-mismatch`);
  }

  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) errors.push(`${path}:min-items-mismatch`);
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateJsonWithSchemaSubset(item, schema.items as JsonSchemaSubset, root, `${path}[${index}]`));
      });
    }
    if (
      schema.contains &&
      !value.some(item => validateJsonWithSchemaSubset(item, schema.contains as JsonSchemaSubset, root, path).length === 0)
    ) {
      errors.push(`${path}:contains-mismatch`);
    }
  }

  if (isJsonObject(value)) {
    const properties = schema.properties ?? {};
    for (const requiredKey of schema.required ?? []) {
      if (!(requiredKey in value)) errors.push(`${path}.${requiredKey}:required-missing`);
    }
    for (const [key, childValue] of Object.entries(value)) {
      const childSchema = properties[key];
      if (childSchema) {
        errors.push(...validateJsonWithSchemaSubset(childValue, childSchema, root, `${path}.${key}`));
      } else if (schema.additionalProperties === false) {
        errors.push(`${path}.${key}:additional-property`);
      } else if (isSchemaSubset(schema.additionalProperties)) {
        errors.push(...validateJsonWithSchemaSubset(childValue, schema.additionalProperties, root, `${path}.${key}`));
      }
    }
  }

  return errors;
}

function collectExtensions(
  value: unknown,
  openApiPath: string,
  path = '$',
): Array<{ openApiPath: string; location: string; extension: unknown }> {
  const found: Array<{ openApiPath: string; location: string; extension: unknown }> = [];
  if (Array.isArray(value)) {
    value.forEach((child, index) => {
      found.push(...collectExtensions(child, openApiPath, `${path}[${index}]`));
    });
    return found;
  }
  if (!isJsonObject(value)) return found;

  if ('x-agid-evidence-fixtures' in value) {
    found.push({
      openApiPath,
      location: `${path}.x-agid-evidence-fixtures`,
      extension: value['x-agid-evidence-fixtures'],
    });
  }

  for (const [key, child] of Object.entries(value)) {
    if (key === 'x-agid-evidence-fixtures') continue;
    if (isJsonObject(child) || Array.isArray(child)) {
      found.push(...collectExtensions(child, openApiPath, `${path}.${key}`));
    }
  }

  return found;
}

function npmScriptName(command: string | undefined) {
  return command?.match(/^npm run ([a-z0-9:-]+)$/)?.[1];
}

function validateReferencedFiles(root: string, extension: OpenApiEvidenceFixturesExtension, locationLabel: string) {
  const errors: string[] = [];
  const pathEntries = [
    ['preflightFixture', extension.preflightFixture],
    ['historyFixture', extension.historyFixture],
    ['evidenceFixture', extension.evidenceFixture],
    ['evidenceSchema', extension.evidenceSchema],
  ] as const;

  for (const [key, value] of pathEntries) {
    if (typeof value !== 'string') continue;
    const absolutePath = join(root, value);
    if (!existsSync(absolutePath)) errors.push(`${locationLabel}:${key}:missing-referenced-file:${value}`);
  }

  if (typeof extension.evidenceSchema === 'string') {
    errors.push(...readJson<JsonObject>(join(root, extension.evidenceSchema)).errors.map(error => (
      `${locationLabel}:evidenceSchema:${error}`
    )));
  }

  return errors;
}

function validateEvidenceFixtureAgainstSchema(
  root: string,
  extension: OpenApiEvidenceFixturesExtension,
  locationLabel: string,
) {
  const errors: string[] = [];
  if (typeof extension.evidenceFixture !== 'string' || typeof extension.evidenceSchema !== 'string') return errors;

  const fixturePath = join(root, extension.evidenceFixture);
  const schemaPath = join(root, extension.evidenceSchema);
  if (!existsSync(fixturePath) || !existsSync(schemaPath)) return errors;

  const fixtureRead = readJson<unknown>(fixturePath);
  const schemaRead = readJson<JsonSchemaSubset>(schemaPath);
  errors.push(...fixtureRead.errors.map(error => `${locationLabel}:evidenceFixture:${error}`));
  errors.push(...schemaRead.errors.map(error => `${locationLabel}:evidenceSchema:${error}`));

  if (fixtureRead.value !== undefined && schemaRead.value) {
    errors.push(...validateJsonWithSchemaSubset(fixtureRead.value, schemaRead.value).map(error => (
      `${locationLabel}:evidenceFixtureSchema:${error}`
    )));
  }

  return errors;
}

function validateReferencedScripts(
  extension: OpenApiEvidenceFixturesExtension,
  scripts: Record<string, unknown>,
  locationLabel: string,
) {
  const errors: string[] = [];
  const verifier = npmScriptName(extension.verifierCommand);
  const aggregate = npmScriptName(extension.aggregateVerifierCommand);

  if (!verifier || typeof scripts[verifier] !== 'string') {
    errors.push(`${locationLabel}:verifierCommand:missing-package-script:${extension.verifierCommand ?? '<missing>'}`);
  }
  if (!aggregate || typeof scripts[aggregate] !== 'string') {
    errors.push(`${locationLabel}:aggregateVerifierCommand:missing-package-script:${extension.aggregateVerifierCommand ?? '<missing>'}`);
  }

  return errors;
}

function loadLinkedVerifierAllowlist(root: string, allowlistPath = LINKED_VERIFIER_ALLOWLIST_PATH) {
  const allowlistFullPath = join(root, allowlistPath);
  const schemaFullPath = join(root, LINKED_VERIFIER_ALLOWLIST_SCHEMA_PATH);
  const allowlistRead = readJson<LinkedVerifierAllowlist>(allowlistFullPath);
  const schemaRead = readJson<JsonSchemaSubset>(schemaFullPath);
  const allowlist = allowlistRead.value;
  const errors = [
    ...allowlistRead.errors,
    ...schemaRead.errors,
  ];

  if (allowlist && schemaRead.value) {
    errors.push(...validateJsonWithSchemaSubset(allowlist, schemaRead.value).map(error => (
      `linked-verifier-allowlist-schema:${error}`
    )));
  }

  const commandSet = new Set<string>();
  for (const verifier of allowlist?.verifiers ?? []) {
    const command = verifier.command ?? '';
    const script = verifier.script ?? '';
    if (!command) continue;
    if (commandSet.has(command)) errors.push(`linked-verifier-allowlist:duplicate-command:${command}`);
    commandSet.add(command);
    if (npmScriptName(command) !== script) {
      errors.push(`linked-verifier-allowlist:script-mismatch:${command}`);
    }
    for (const runner of verifier.runner ?? []) {
      if (!existsSync(join(root, runner))) errors.push(`linked-verifier-allowlist:missing-runner:${command}:${runner}`);
    }
  }

  return {
    allowlistPath,
    allowlist,
    errors,
  };
}

function loadNonClaimsProfiles(root: string, profilesPath = NON_CLAIMS_PROFILES_PATH) {
  const profilesFullPath = join(root, profilesPath);
  const schemaFullPath = join(root, NON_CLAIMS_PROFILES_SCHEMA_PATH);
  const profilesRead = readJson<NonClaimsProfileSet>(profilesFullPath);
  const schemaRead = readJson<JsonSchemaSubset>(schemaFullPath);
  const profileSet = profilesRead.value;
  const errors = [
    ...profilesRead.errors,
    ...schemaRead.errors,
  ];

  if (profileSet && schemaRead.value) {
    errors.push(...validateJsonWithSchemaSubset(profileSet, schemaRead.value).map(error => (
      `non-claims-profiles-schema:${error}`
    )));
  }

  for (const nonClaim of REQUIRED_LINKED_VERIFIER_NON_CLAIMS) {
    if (!(profileSet?.requiredBaseNonClaims ?? []).includes(nonClaim)) {
      errors.push(`non-claims-profiles:base-non-claim-missing:${nonClaim}`);
    }
  }

  const profilesById = new Map<string, string[]>();
  const openApiEvidenceSchemaById = new Map<string, string>();
  for (const profile of profileSet?.profiles ?? []) {
    const id = profile.id ?? '';
    if (!id) continue;
    if (profilesById.has(id)) errors.push(`non-claims-profile:duplicate-id:${id}`);
    profilesById.set(id, profile.requiredNonClaims ?? []);
    if (profile.openApiEvidenceSchema) openApiEvidenceSchemaById.set(id, profile.openApiEvidenceSchema);

    for (const nonClaim of profileSet?.requiredBaseNonClaims ?? []) {
      if (!(profile.requiredNonClaims ?? []).includes(nonClaim)) {
        errors.push(`non-claims-profile:base-non-claim-missing:${id}:${nonClaim}`);
      }
    }
  }

  return {
    profilesPath,
    profilesById,
    openApiEvidenceSchemaById,
    errors,
  };
}

function nonClaimsProfileSchemaEnum(schema: JsonSchemaSubset | undefined) {
  const enumValues = schema?.properties?.nonClaimsProfile?.enum ?? [];
  return enumValues.filter((value): value is string => typeof value === 'string');
}

function validateNonClaimsProfileSchemaEnum(
  schema: JsonSchemaSubset | undefined,
  profilesById: Map<string, string[]>,
) {
  const errors: string[] = [];
  const schemaIds = nonClaimsProfileSchemaEnum(schema);
  if (schema && schemaIds.length === 0) {
    errors.push('non-claims-profile-schema-enum-missing');
  }

  const schemaIdSet = new Set(schemaIds);
  const registryIdSet = new Set(profilesById.keys());

  for (const profileId of registryIdSet) {
    if (!schemaIdSet.has(profileId)) {
      errors.push(`non-claims-profile-schema-enum-missing-registry-id:${profileId}`);
    }
  }
  for (const profileId of schemaIdSet) {
    if (!registryIdSet.has(profileId)) {
      errors.push(`non-claims-profile-registry-missing-schema-id:${profileId}`);
    }
  }

  return errors;
}

function validateLinkedVerifierBoundaries(
  checkedExtensions: CheckedExtension[],
  verifierConfigs: LinkedVerifierConfig[],
) {
  const errors: string[] = [];
  const verifierByCommand = new Map(verifierConfigs.map(verifier => [verifier.command ?? '', verifier]));

  for (const extension of checkedExtensions) {
    const verifier = verifierByCommand.get(extension.verifierCommand);
    if (!verifier) continue;
    if (verifier.managedServiceBoundary !== extension.managedServiceBoundary) {
      errors.push(
        [
          'linked-verifier-boundary-mismatch',
          extension.openApiPath,
          extension.location,
          extension.verifierCommand,
          `openapi=${extension.managedServiceBoundary}`,
          `allowlist=${verifier.managedServiceBoundary ?? '<missing>'}`,
        ].join(':'),
      );
    }
  }

  return errors;
}

function validateNonClaimsProfiles(
  checkedExtensions: CheckedExtension[],
  profilesById: Map<string, string[]>,
) {
  const errors: string[] = [];

  for (const extension of checkedExtensions) {
    const requiredNonClaims = profilesById.get(extension.nonClaimsProfile);
    if (!requiredNonClaims) {
      errors.push(
        [
          'non-claims-profile-unknown',
          extension.openApiPath,
          extension.location,
          extension.nonClaimsProfile || '<missing>',
        ].join(':'),
      );
      continue;
    }

    for (const nonClaim of requiredNonClaims) {
      if (!extension.nonClaims.includes(nonClaim)) {
        errors.push(
          [
            'non-claims-profile-missing-non-claim',
            extension.openApiPath,
            extension.location,
            extension.nonClaimsProfile,
            nonClaim,
          ].join(':'),
        );
      }
    }
  }

  return errors;
}

function loadOpenApiEvidenceProfileSchema(
  root: string,
  profileId: string,
  openApiEvidenceSchemaById: Map<string, string>,
  cache: Map<string, ProfileSchemaCacheEntry>,
) {
  const schemaPath = openApiEvidenceSchemaById.get(profileId);
  if (!schemaPath) return { errors: [] };
  const cached = cache.get(profileId);
  if (cached) return cached;

  const schemaRead = readJson<JsonSchemaSubset>(join(root, schemaPath));
  const entry = {
    schema: schemaRead.value,
    errors: schemaRead.errors.map(error => (
      `openapi-evidence-profile-schema:${profileId}:${error}`
    )),
  };
  const schemaProfileId = schemaRead.value?.properties?.nonClaimsProfile?.const;
  if (schemaRead.value && schemaProfileId !== profileId) {
    entry.errors.push(
      `openapi-evidence-profile-schema-profile-mismatch:${profileId}:schema=${String(schemaProfileId ?? '<missing>')}`,
    );
  }
  cache.set(profileId, entry);
  return entry;
}

function validateOpenApiEvidenceProfileSchema(
  root: string,
  extension: OpenApiEvidenceFixturesExtension,
  locationLabel: string,
  openApiEvidenceSchemaById: Map<string, string>,
  cache: Map<string, ProfileSchemaCacheEntry>,
) {
  const profileId = extension.nonClaimsProfile ?? '';
  const profileSchema = loadOpenApiEvidenceProfileSchema(root, profileId, openApiEvidenceSchemaById, cache);
  const errors = [...profileSchema.errors];

  if (profileSchema.schema) {
    errors.push(...validateJsonWithSchemaSubset(extension, profileSchema.schema).map(error => (
      `${locationLabel}:product-profile-schema:${profileId}:${error}`
    )));
  }

  return errors;
}

function validateLinkedVerifierNonClaims(
  checkedExtensions: CheckedExtension[],
  allowlist: LinkedVerifierAllowlist | undefined,
) {
  const errors: string[] = [];

  for (const nonClaim of REQUIRED_LINKED_VERIFIER_NON_CLAIMS) {
    if (!(allowlist?.nonClaims ?? []).includes(nonClaim)) {
      errors.push(`linked-verifier-non-claim-missing:allowlist:${nonClaim}`);
    }
  }

  for (const extension of checkedExtensions) {
    for (const nonClaim of REQUIRED_LINKED_VERIFIER_NON_CLAIMS) {
      if (!extension.nonClaims.includes(nonClaim)) {
        errors.push(
          [
            'linked-verifier-non-claim-missing',
            extension.openApiPath,
            extension.location,
            extension.verifierCommand,
            nonClaim,
          ].join(':'),
        );
      }
    }
  }

  return errors;
}

function runLinkedVerifiers(
  root: string,
  checkedExtensions: CheckedExtension[],
  verifierConfigs: LinkedVerifierConfig[],
  timeoutOverride: number | undefined,
) {
  const errors: string[] = [];
  const runs: LinkedVerifierRun[] = [];
  const uniqueCommands = [...new Set(checkedExtensions.map(extension => extension.verifierCommand).filter(Boolean))];
  const verifierByCommand = new Map(verifierConfigs.map(verifier => [verifier.command ?? '', verifier]));

  for (const command of uniqueCommands) {
    const script = npmScriptName(command);
    const verifier = verifierByCommand.get(command);
    if (!verifier) {
      errors.push(`linked-verifier:not-allowlisted:${command}`);
      continue;
    }
    if (!script) {
      errors.push(`linked-verifier:invalid-command:${command}`);
      continue;
    }
    if (script !== verifier.script) {
      errors.push(`linked-verifier:script-mismatch:${command}`);
      continue;
    }

    const runnerArgs = verifier.runner ?? [];
    const tsxCliPath = join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs');
    if (runnerArgs.length === 0 || !existsSync(tsxCliPath)) {
      errors.push(`linked-verifier:runner-unavailable:${command}`);
      continue;
    }

    const startedAt = Date.now();
    const result = spawnSync(
      process.execPath,
      [tsxCliPath, ...runnerArgs],
      {
        cwd: root,
        encoding: 'utf8',
        timeout: timeoutOverride ?? verifier.timeoutMs ?? DEFAULT_LINKED_VERIFIER_TIMEOUT_MS,
        maxBuffer: 1024 * 1024 * 5,
      },
    );
    const run: LinkedVerifierRun = {
      command,
      script,
      ok: result.status === 0 && !result.signal && !result.error,
      exitCode: result.status,
      signal: result.signal,
      durationMs: Date.now() - startedAt,
      error: result.error instanceof Error ? result.error.message : undefined,
    };
    runs.push(run);

    if (!run.ok) {
      errors.push(
        `linked-verifier:failed:${command}:exit=${String(run.exitCode)}:signal=${String(run.signal)}${run.error ? `:${run.error}` : ''}`,
      );
    }
  }

  return { errors, runs };
}

export function verifyAgidOpenApiEvidenceExtensions(
  root = process.cwd(),
  options: VerifyAgidOpenApiEvidenceExtensionsOptions = {},
): AgidOpenApiEvidenceExtensionScanResult {
  const schemaPath = join(root, OPENAPI_EVIDENCE_EXTENSION_SCHEMA_PATH);
  const schemaRead = readJson<JsonSchemaSubset>(schemaPath);
  const packageRead = readJson<{ scripts?: Record<string, unknown> }>(join(root, 'package.json'));
  const openApiFiles = listOpenApiFiles(join(root, SPECS_DIR));
  const linkedVerifierAllowlistPath = toSpecPath(options.linkedVerifierAllowlistPath ?? LINKED_VERIFIER_ALLOWLIST_PATH);
  const nonClaimsProfiles = loadNonClaimsProfiles(root);
  const nonClaimsProfilesPath = toSpecPath(nonClaimsProfiles.profilesPath);
  const errors = [...schemaRead.errors, ...packageRead.errors];
  const checkedExtensions: CheckedExtension[] = [];
  const linkedVerifierRuns: LinkedVerifierRun[] = [];
  const scripts = packageRead.value?.scripts ?? {};
  const schema = schemaRead.value;
  const profileSchemaCache = new Map<string, ProfileSchemaCacheEntry>();
  errors.push(...nonClaimsProfiles.errors);
  errors.push(...validateNonClaimsProfileSchemaEnum(schema, nonClaimsProfiles.profilesById));

  for (const openApiFile of openApiFiles) {
    const relativeOpenApiPath = toSpecPath(relative(root, openApiFile));
    const openApiRead = readYaml<unknown>(openApiFile);
    errors.push(...openApiRead.errors);

    for (const found of collectExtensions(openApiRead.value, relativeOpenApiPath)) {
      const locationLabel = `${relativeOpenApiPath}:${found.location}`;
      const extension = found.extension as OpenApiEvidenceFixturesExtension;

      if (!isJsonObject(found.extension)) {
        errors.push(`${locationLabel}:extension-not-object`);
        continue;
      }

      if (schema) {
        errors.push(...validateJsonWithSchemaSubset(found.extension, schema).map(error => (
          `${locationLabel}:schema-conformance:${error}`
        )));
      }
      errors.push(...validateOpenApiEvidenceProfileSchema(
        root,
        extension,
        locationLabel,
        nonClaimsProfiles.openApiEvidenceSchemaById,
        profileSchemaCache,
      ));
      errors.push(...validateReferencedFiles(root, extension, locationLabel));
      errors.push(...validateEvidenceFixtureAgainstSchema(root, extension, locationLabel));
      errors.push(...validateReferencedScripts(extension, scripts, locationLabel));

      checkedExtensions.push({
        openApiPath: relativeOpenApiPath,
        location: found.location,
        preflightFixture: extension.preflightFixture ?? '',
        historyFixture: extension.historyFixture ?? '',
        evidenceFixture: extension.evidenceFixture ?? '',
        evidenceSchema: extension.evidenceSchema ?? '',
        verifierCommand: extension.verifierCommand ?? '',
        aggregateVerifierCommand: extension.aggregateVerifierCommand ?? '',
        managedServiceBoundary: extension.managedServiceBoundary ?? '',
        nonClaims: extension.nonClaims ?? [],
        nonClaimsProfile: extension.nonClaimsProfile ?? '',
      });
    }
  }

  if (openApiFiles.length === 0) errors.push('no-openapi-files-found');
  if (checkedExtensions.length === 0) errors.push('no-agid-openapi-evidence-fixtures-found');
  errors.push(...validateNonClaimsProfiles(checkedExtensions, nonClaimsProfiles.profilesById));

  if (options.runLinkedVerifiers) {
    const linkedVerifierAllowlist = loadLinkedVerifierAllowlist(root, linkedVerifierAllowlistPath);
    errors.push(...linkedVerifierAllowlist.errors);
    errors.push(...validateLinkedVerifierBoundaries(
      checkedExtensions,
      linkedVerifierAllowlist.allowlist?.verifiers ?? [],
    ));
    errors.push(...validateLinkedVerifierNonClaims(
      checkedExtensions,
      linkedVerifierAllowlist.allowlist,
    ));
    if (errors.length > 0) {
      errors.push('linked-verifiers-skipped-due-to-prior-errors');
    } else {
      const linked = runLinkedVerifiers(
        root,
        checkedExtensions,
        linkedVerifierAllowlist.allowlist?.verifiers ?? [],
        options.linkedVerifierTimeoutMs,
      );
      linkedVerifierRuns.push(...linked.runs);
      errors.push(...linked.errors);
    }
  }

  return {
    ok: errors.length === 0,
    schemaPath,
    openApiFiles: openApiFiles.map(path => toSpecPath(relative(root, path))),
    checkedExtensions,
    linkedVerifierAllowlistPath,
    nonClaimsProfilesPath,
    linkedVerifierRuns,
    errors,
  };
}

function main() {
  const result = verifyAgidOpenApiEvidenceExtensions(process.cwd(), {
    runLinkedVerifiers: process.argv.includes('--run-linked-verifiers'),
  });

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`[verify-agid-openapi-evidence-extensions] status=${result.ok ? 'pass' : 'fail'}`);
    console.log(`openApiFiles=${result.openApiFiles.length}`);
    console.log(`extensions=${result.checkedExtensions.length}`);
    console.log(`linkedVerifierAllowlist=${result.linkedVerifierAllowlistPath}`);
    console.log(`nonClaimsProfiles=${result.nonClaimsProfilesPath}`);
    console.log(`linkedVerifierRuns=${result.linkedVerifierRuns.length}`);
    for (const extension of result.checkedExtensions) {
      console.log(
        `extension=${extension.openApiPath} ${extension.location} verifier=${extension.verifierCommand}`,
      );
    }
    for (const run of result.linkedVerifierRuns) {
      console.log(
        `linkedVerifier=${run.command} status=${run.ok ? 'pass' : 'fail'} exit=${String(run.exitCode)} durationMs=${run.durationMs}`,
      );
    }
    for (const error of result.errors) console.error(`error=${error}`);
  }

  if (!result.ok) process.exitCode = 1;
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  main();
}

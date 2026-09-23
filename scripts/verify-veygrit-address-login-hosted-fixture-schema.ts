import { existsSync, readFileSync } from 'node:fs';

import {
  validateHostedAddressLoginFixtureAgainstSchema,
  type HostedAddressLoginJsonSchemaSubset,
} from '../src/lib/veygritHostedAddressLoginContract';

const DEFAULT_FIXTURE_PATH = 'docs/specs/fixtures/veygrit-address-login-hosted-v0.1.json';
const DEFAULT_SCHEMA_PATH = 'docs/specs/schemas/veygrit-address-login-hosted-fixture-v0.1.schema.json';

function valueAfter(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

function readJson(path: string, label: string, errors: string[]) {
  if (!existsSync(path)) {
    errors.push(`${label}-not-found:${path}`);
    return undefined;
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as unknown;
  } catch (error) {
    errors.push(`${label}-invalid-json:${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

const fixturePath = valueAfter('--fixture') ?? DEFAULT_FIXTURE_PATH;
const schemaPath = valueAfter('--schema') ?? DEFAULT_SCHEMA_PATH;
const jsonMode = process.argv.includes('--json');
const errors: string[] = [];

const fixture = readJson(fixturePath, 'fixture', errors);
const schema = readJson(schemaPath, 'schema', errors) as HostedAddressLoginJsonSchemaSubset | undefined;

if (fixture !== undefined && schema !== undefined) {
  errors.push(...validateHostedAddressLoginFixtureAgainstSchema(fixture, schema).map(error => `schema:${error}`));
}

const status = errors.length === 0 ? 'pass' : 'fail';
const payload = {
  gate: 'verify-veygrit-address-login-hosted-fixture-schema',
  status,
  fixturePath,
  schemaPath,
  checked: [fixturePath, schemaPath],
  localOnly: true,
  productionTraffic: false,
  errors,
};

if (jsonMode) {
  console.log(JSON.stringify(payload, null, 2));
} else {
  console.log(`[verify-veygrit-address-login-hosted-fixture-schema] status=${status}`);
  console.log(`fixture=${fixturePath}`);
  console.log(`schema=${schemaPath}`);
  console.log('localOnly=true');
  console.log('productionTraffic=false');
  if (errors.length > 0) console.error(`errors=${errors.join('|')}`);
}

if (status !== 'pass') process.exitCode = 1;

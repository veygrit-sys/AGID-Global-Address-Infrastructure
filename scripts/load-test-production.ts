import process from 'node:process';

import {
  createProductionLoadTestPlan,
  PRODUCTION_LOAD_TEST_ACK,
  runProductionLoadTest,
  type ProductionLoadTestEndpoint,
} from '../src/lib/productionLoadTest';

function argValue(name: string) {
  const prefix = `${name}=`;
  const match = process.argv.find(arg => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : undefined;
}

function hasArg(name: string) {
  return process.argv.includes(name);
}

function splitCsv(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
}

function parseNumber(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function endpointName(path: string) {
  return path
    .replace(/^\/+/, '')
    .replace(/[^A-Za-z0-9._:-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'endpoint';
}

function parseEndpoint(value: string): ProductionLoadTestEndpoint {
  const parts = value.split(':');
  if (parts.length >= 2 && parts[1]?.startsWith('/')) {
    return {
      name: parts[0],
      path: parts[1],
      expectedStatus: parseNumber(parts[2]),
      weight: parseNumber(parts[3]),
    };
  }
  return {
    name: endpointName(value),
    path: value,
  };
}

function parseEndpointArgs() {
  const cliEndpoints = process.argv
    .filter(arg => arg.startsWith('--endpoint='))
    .map(arg => parseEndpoint(arg.slice('--endpoint='.length)));
  if (cliEndpoints.length > 0) return cliEndpoints;

  const envEndpoints = process.env.AGID_LOAD_TEST_ENDPOINTS;
  if (!envEndpoints) return undefined;
  const parsed = JSON.parse(envEndpoints) as ProductionLoadTestEndpoint[];
  return parsed;
}

const execute = hasArg('--execute') || process.env.AGID_LOAD_TEST_DRY_RUN === 'false';
const baseUrl = argValue('--base-url') ?? process.env.AGID_LOAD_TEST_BASE_URL;
const allowedHosts = [
  ...splitCsv(process.env.AGID_LOAD_TEST_ALLOWED_HOSTS),
  ...process.argv.filter(arg => arg.startsWith('--allowed-host=')).map(arg => arg.slice('--allowed-host='.length)),
];

const plan = createProductionLoadTestPlan({
  baseUrl,
  allowedHosts,
  ack: process.env.AGID_LOAD_TEST_ACK,
  dryRun: !execute,
  rps: parseNumber(argValue('--rps') ?? process.env.AGID_LOAD_TEST_RPS),
  durationSeconds: parseNumber(argValue('--duration') ?? process.env.AGID_LOAD_TEST_DURATION_SECONDS),
  concurrency: parseNumber(argValue('--concurrency') ?? process.env.AGID_LOAD_TEST_CONCURRENCY),
  requestTimeoutMs: parseNumber(argValue('--timeout-ms') ?? process.env.AGID_LOAD_TEST_REQUEST_TIMEOUT_MS),
  endpoints: parseEndpointArgs(),
});

if (plan.dryRun) {
  console.log('AGID production load test dry-run. No traffic will be sent.');
  console.log(`To execute, set AGID_LOAD_TEST_ACK=${PRODUCTION_LOAD_TEST_ACK} and pass --execute.`);
}

const bearerToken = process.env.AGID_LOAD_TEST_BEARER_TOKEN;
const result = await runProductionLoadTest(plan, {
  headers: bearerToken ? { Authorization: `Bearer ${bearerToken}` } : undefined,
});

console.log(JSON.stringify(result, null, 2));

if (!result.dryRun && (result.stopReason || result.failedRequests > 0)) {
  process.exit(2);
}

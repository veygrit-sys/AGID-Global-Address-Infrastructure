import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { AddressFormat } from '../data/address_formats';
import { encodeAGID } from './agid';
import { AGID_CLI_SCHEMA_VERSION, AGID_CLI_VERSION, runAgidCli } from './agidCli';

function parseStdout<T>(stdout: string): T {
  return JSON.parse(stdout) as T;
}

const jpCliFormat = {
  countryCode: 'JP',
  name: 'Japan',
  native: {
    addressFormat: '{{postcode}}\n{{state}}{{city}}{{street}}{{houseNumber}}\n{{organization}}',
    ordering: 'big-to-small',
    fields: [],
  },
  english: {
    addressFormat: '{{organization}}\n{{houseNumber}} {{street}}, {{city}}, {{state}} {{postcode}}\n{{country}}',
    ordering: 'small-to-big',
    fields: [],
  },
  postalCode: {
    regex: '^\\d{3}-?\\d{4}$',
    source: 'japan-post',
    api: null,
    format: 'NNN-NNNN',
  },
} satisfies AddressFormat;

test('prints help and version', async () => {
  const help = await runAgidCli(['help']);
  const version = await runAgidCli(['version']);

  assert.equal(help.exitCode, 0);
  assert.match(help.stdout, /Usage:/);
  assert.match(help.stdout, /no-raw-address/i);
  assert.equal(version.exitCode, 0);
  assert.equal(version.stdout.trim(), AGID_CLI_VERSION);
});

test('encodes coordinates to AGID with human and JSON output', async () => {
  const human = await runAgidCli(['encode', '--lat', '35.681236', '--lon', '139.767125']);
  const jsonResult = await runAgidCli(['encode', '--lat=35.681236', '--lon=139.767125', '--json']);
  const expected = encodeAGID(35.681236, 139.767125);

  assert.equal(human.exitCode, 0);
  assert.match(human.stdout, new RegExp(`AGID: ${expected.id}`));
  assert.equal(jsonResult.exitCode, 0);

  const body = parseStdout<{ schemaVersion: string; id: string; center: { lat: number; lon: number }; cell: { face: number } }>(jsonResult.stdout);
  assert.equal(body.schemaVersion, AGID_CLI_SCHEMA_VERSION);
  assert.equal(body.id, expected.id);
  assert.equal(body.center.lat, 35.681236);
  assert.equal(body.center.lon, 139.767125);
  assert.equal(body.cell.face, expected.face);
});

test('decodes and validates an AGID', async () => {
  const agid = encodeAGID(35.681236, 139.767125);
  const decoded = await runAgidCli(['decode', agid.id, '--json']);
  const validation = await runAgidCli(['validate', agid.id, '--json']);

  assert.equal(decoded.exitCode, 0);
  assert.equal(validation.exitCode, 0);

  const decodedBody = parseStdout<{ schemaVersion: string; id: string; prefix: string; bounds: unknown }>(decoded.stdout);
  const validationBody = parseStdout<{ schemaVersion: string; normalized: string; valid: boolean; formatValid: boolean; decodable: boolean }>(validation.stdout);

  assert.equal(decodedBody.schemaVersion, AGID_CLI_SCHEMA_VERSION);
  assert.equal(decodedBody.id, agid.id);
  assert.equal(decodedBody.prefix, agid.prefix);
  assert.ok(decodedBody.bounds);
  assert.equal(validationBody.schemaVersion, AGID_CLI_SCHEMA_VERSION);
  assert.equal(validationBody.normalized, agid.id);
  assert.equal(validationBody.valid, true);
  assert.equal(validationBody.formatValid, true);
  assert.equal(validationBody.decodable, true);
});

test('resolve keeps output to a no-raw-address local summary', async () => {
  const agid = encodeAGID(35.681236, 139.767125);
  const result = await runAgidCli(['resolve', agid.id, '--json']);

  assert.equal(result.exitCode, 0);
  const body = parseStdout<{
    schemaVersion: string;
    status: string;
    inputKind: string;
    agid: { id: string };
    actions: string[];
    intelligence?: { decision: string; delivery: { decision: string } };
    registeredAddress?: unknown;
    aoid?: unknown;
  }>(result.stdout);

  assert.equal(body.schemaVersion, AGID_CLI_SCHEMA_VERSION);
  assert.equal(body.inputKind, 'agid');
  assert.equal(body.agid.id, agid.id);
  assert.ok(['resolved', 'partial'].includes(body.status));
  assert.ok(body.actions.includes('do-not-send-private-fields'));
  assert.ok(body.intelligence);
  assert.equal('registeredAddress' in body, false);
  assert.equal('aoid' in body, false);
});

test('resolve can load country address formats through an injected CLI resolver', async () => {
  const result = await runAgidCli(
    ['resolve', 'Synthetic Central District', '--country', 'JP', '--language', 'en', '--json'],
    {
      addressFormatResolver: async countryCode => (countryCode === 'JP' ? jpCliFormat : null),
    },
  );

  assert.equal(result.exitCode, 0);
  const body = parseStdout<{
    schemaVersion: string;
    inputKind: string;
    addressFormat?: { countryCode: string; postalCodeFormat?: string };
    audit: Array<{ step: string; status: string }>;
  }>(result.stdout);

  assert.equal(body.schemaVersion, AGID_CLI_SCHEMA_VERSION);
  assert.equal(body.inputKind, 'address-text');
  assert.equal(body.addressFormat?.countryCode, 'JP');
  assert.equal(body.addressFormat?.postalCodeFormat, 'NNN-NNNN');
  assert.ok(body.audit.some(item => item.step === 'load-address-format' && item.status === 'ok'));
});

test('outputs AGID cell polygon as GeoJSON', async () => {
  const agid = encodeAGID(35.681236, 139.767125);
  const result = await runAgidCli(['polygon', agid.id, '--geojson']);

  assert.equal(result.exitCode, 0);
  const body = parseStdout<{
    schemaVersion: string;
    type: string;
    properties: { agid: string };
    geometry: { type: string; coordinates: number[][][] };
  }>(result.stdout);

  assert.equal(body.schemaVersion, AGID_CLI_SCHEMA_VERSION);
  assert.equal(body.type, 'Feature');
  assert.equal(body.properties.agid, agid.id);
  assert.equal(body.geometry.type, 'Polygon');
  assert.equal(body.geometry.coordinates[0].length, 5);
});

test('processes batch JSONL encode records with stable output schema', async () => {
  const input = [
    JSON.stringify({ id: 'tokyo-station', lat: 35.681236, lon: 139.767125 }),
    JSON.stringify({ id: 'bad-coordinate', lat: 200, lon: 139 }),
    '',
  ].join('\n');
  const result = await runAgidCli(
    ['batch', 'encode', '--stdin', '--input-format', 'jsonl', '--json'],
    { stdin: input },
  );

  assert.equal(result.exitCode, 0);
  const body = parseStdout<{
    schemaVersion: string;
    command: string;
    operation: string;
    inputFormat: string;
    total: number;
    ok: number;
    failed: number;
    results: Array<{ schemaVersion: string; inputRef: string; ok: boolean; result?: { id: string }; error?: string }>;
  }>(result.stdout);

  assert.equal(body.schemaVersion, AGID_CLI_SCHEMA_VERSION);
  assert.equal(body.command, 'batch');
  assert.equal(body.operation, 'encode');
  assert.equal(body.inputFormat, 'jsonl');
  assert.equal(body.total, 2);
  assert.equal(body.ok, 1);
  assert.equal(body.failed, 1);
  assert.equal(body.results[0].schemaVersion, AGID_CLI_SCHEMA_VERSION);
  assert.equal(body.results[0].inputRef, 'tokyo-station');
  assert.equal(body.results[0].ok, true);
  assert.ok(body.results[0].result?.id);
  assert.equal(body.results[1].ok, false);
  assert.match(body.results[1].error || '', /lat\/lon/i);
});

test('processes batch CSV validate records from a file reader', async () => {
  const agid = encodeAGID(35.681236, 139.767125);
  const fileText = `row,agid\nvalid-row,${agid.id}\ninvalid-row,NOT_AN_AGID\n`;
  const result = await runAgidCli(
    ['batch', 'validate', '--file', 'fixture.csv', '--input-format', 'csv', '--json'],
    { readFile: () => fileText },
  );

  assert.equal(result.exitCode, 0);
  const body = parseStdout<{
    schemaVersion: string;
    total: number;
    ok: number;
    failed: number;
    results: Array<{ ok: boolean; result?: { valid: boolean; normalized: string | null } }>;
  }>(result.stdout);

  assert.equal(body.schemaVersion, AGID_CLI_SCHEMA_VERSION);
  assert.equal(body.total, 2);
  assert.equal(body.ok, 2);
  assert.equal(body.failed, 0);
  assert.equal(body.results[0].result?.valid, true);
  assert.equal(body.results[0].result?.normalized, agid.id);
  assert.equal(body.results[1].result?.valid, false);
});

test('runs resolver and address test vector conformance suites', async () => {
  const result = await runAgidCli(['conformance', '--suite', 'all', '--json']);

  assert.equal(result.exitCode, 0);
  const body = parseStdout<{
    schemaVersion: string;
    command: string;
    suite: string;
    passed: boolean;
    resolver: { cases: number; valid: boolean; passed: boolean };
    addressTestVectors: { vectors: number; valid: boolean };
  }>(result.stdout);

  assert.equal(body.schemaVersion, AGID_CLI_SCHEMA_VERSION);
  assert.equal(body.command, 'conformance');
  assert.equal(body.suite, 'all');
  assert.equal(body.passed, true);
  assert.ok(body.resolver.cases > 0);
  assert.equal(body.resolver.valid, true);
  assert.equal(body.resolver.passed, true);
  assert.ok(body.addressTestVectors.vectors > 0);
  assert.equal(body.addressTestVectors.valid, true);
});

test('runs a single resolver conformance case for SDK and CI debugging', async () => {
  const result = await runAgidCli([
    'conformance',
    '--suite',
    'resolver',
    '--case',
    'resolver-agid-s-needs-key-v1',
    '--json',
  ]);

  assert.equal(result.exitCode, 0);
  const body = parseStdout<{
    schemaVersion: string;
    command: string;
    suite: string;
    caseFilter: string | null;
    passed: boolean;
    resolver: {
      cases: number;
      caseIds: string[];
      valid: boolean;
      passed: boolean;
    };
    addressTestVectors?: unknown;
  }>(result.stdout);

  assert.equal(body.schemaVersion, AGID_CLI_SCHEMA_VERSION);
  assert.equal(body.command, 'conformance');
  assert.equal(body.suite, 'resolver');
  assert.equal(body.caseFilter, 'resolver-agid-s-needs-key-v1');
  assert.equal(body.passed, true);
  assert.equal(body.resolver.cases, 1);
  assert.deepEqual(body.resolver.caseIds, ['resolver-agid-s-needs-key-v1']);
  assert.equal(body.resolver.valid, true);
  assert.equal(body.resolver.passed, true);
  assert.equal('addressTestVectors' in body, false);
});

test('returns non-zero exit code for invalid inputs', async () => {
  const invalidEncode = await runAgidCli(['encode', '--lat', '200', '--lon', '139']);
  const invalidDecode = await runAgidCli(['decode', 'NOT_AN_AGID']);
  const unknown = await runAgidCli(['unknown-command']);
  const missingConformanceCase = await runAgidCli(['conformance', '--suite', 'resolver', '--case', 'missing-case']);

  assert.equal(invalidEncode.exitCode, 1);
  assert.match(invalidEncode.stderr, /out of range/i);
  assert.equal(invalidDecode.exitCode, 1);
  assert.match(invalidDecode.stderr, /Invalid/i);
  assert.equal(missingConformanceCase.exitCode, 1);
  assert.match(missingConformanceCase.stderr, /not found/i);
  assert.equal(unknown.exitCode, 2);
  assert.match(unknown.stderr, /Unknown command/i);
});

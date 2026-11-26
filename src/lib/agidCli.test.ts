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

test('opts in to 16-character issuance and rejects unsupported lengths', async () => {
  const args = ['encode', '--lat', '35.681236', '--lon', '139.767125', '--json'];
  const legacy = JSON.parse((await runAgidCli(args)).stdout);
  const checked = JSON.parse((await runAgidCli([...args, '--id-length', '16'])).stdout);
  assert.equal(legacy.id.length, 12);
  assert.equal(checked.id.length, 16);
  assert.equal(checked.id.slice(0, 12), legacy.id);
  assert.deepEqual(checked.cell, legacy.cell);
  assert.equal((await runAgidCli([...args, '--id-length', '17'])).exitCode, 1);
  const western = await runAgidCli(['encode', '--lat', '-33', '--lon', '-71', '--id-length', '16', '--json']);
  assert.equal(western.exitCode, 0);
  assert.equal(JSON.parse(western.stdout).id.length, 16);
  const batch = await runAgidCli(['batch', 'encode', '--stdin', '--id-length', '16', '--json'], {
    stdin: '{"lat":35.681236,"lon":139.767125}',
  });
  assert.equal(JSON.parse(batch.stdout).results[0].result.id, checked.id);
});

test('checked map IDs retain their width and legacy geometry across CLI readers', async () => {
  const grouped = 'jp05-av8t-jghd-1meq';
  const id = 'JP05AV8TJGHD1MEQ';
  const legacy = id.slice(0, 12);
  const decode = async (input: string) => JSON.parse((await runAgidCli(['decode', input, '--json'])).stdout);
  const decoded = await decode(grouped);
  assert.equal(decoded.id, id);
  assert.deepEqual(decoded.cell, (await decode(legacy)).cell);
  const validation = await runAgidCli(['validate', grouped, '--json']);
  assert.equal(JSON.parse(validation.stdout).normalized, id);
  const polygon = await runAgidCli(['polygon', grouped, '--geojson']);
  assert.equal(JSON.parse(polygon.stdout).properties.agid, id);
  const resolved = JSON.parse((await runAgidCli(['resolve', grouped, '--json'])).stdout);
  assert.equal(resolved.inputKind, 'agid');
  assert.equal(resolved.agid.id, id);
  const oldFullWidth = JSON.parse((await runAgidCli(['resolve', 'ＪＰ０５ＡＶ８ＴＪＧＨＤ', '--json'])).stdout);
  assert.equal(oldFullWidth.agid.id, legacy);

  for (const bad of ['JP05AV8TJGHD1MER', 'ＪP05AV8TJGHD1MEQ']) {
    assert.equal((await runAgidCli(['decode', bad])).exitCode, 1);
    assert.equal(JSON.parse((await runAgidCli(['validate', bad, '--json'])).stdout).valid, false);
    assert.equal(JSON.parse((await runAgidCli(['resolve', bad, '--json'])).stdout).status, 'invalid');
  }
});

test('reports both country codes at the shared Lesotho–South Africa boundary', async () => {
  const result = await runAgidCli([
    'encode', '--lat', '-28.909035', '--lon', '28.980846', '--id-length', '16', '--json',
  ]);
  assert.equal(result.exitCode, 0);
  const match = JSON.parse(result.stdout).mapUnitMatch;
  assert.equal(match.relation, 'boundary');
  assert.deepEqual(match.codes, ['LS', 'ZA']);
});

test('geography distinguishes the original pin, device accuracy and an issued cell', async () => {
  const run = async (args: string[]) => {
    const result = await runAgidCli(['geography', ...args, '--json']);
    assert.equal(result.exitCode, 0, result.stderr);
    return JSON.parse(result.stdout);
  };
  const pin = await run(['--lat', '-16.85', '--lon', '179.98']);
  assert.equal(pin.command, 'geography');
  assert.equal(pin.status, 'mapped');
  assert.equal(pin.surface, 'land');
  assert.deepEqual(pin.regionCandidates, ['FJ']);
  assert.deepEqual(pin.footprint, { kind: 'manual-pin', radiusMeters: 0 });
  assert.equal(pin.deliveryRegion, null);
  const measured = await run(['--lat', '-16.85', '--lon', '179.98', '--accuracy-meters', '10']);
  assert.deepEqual(measured.footprint, { kind: 'device-pin', radiusMeters: 10 });
  const cell = await run(['P304K5APK9JT124R']);
  assert.equal(cell.footprint.kind, 'cell');
  assert.ok(cell.footprint.radiusMeters > 0);
  assert.equal(cell.deliveryRegion, null);
});

test('geography rejects mixed, incomplete, invalid or ambiguous inputs', async () => {
  for (const args of [
    [], ['garbage'], ['--lon', '0'], ['--lon', '--lat'], ['--lat=', '--lon=0'],
    ['--lat', '0', '--lon', '0', 'P304K5APK9JT124R'],
    ['P304K5APK9JT124R', '--accuracy-meters', '1'],
    ['--lat', '0', '--lon', '0', '--accuracy-meters=-1'],
    ['--lat', '0', '--lon', '0', '--accuracy-meters='],
  ]) assert.equal((await runAgidCli(['geography', ...args])).exitCode, 1, args.join(' '));
});

test('island geography distinguishes a Japanese policy result from competing claims and a separate postal destination', async () => {
  const jp = await runAgidCli(['geography', '--lat', '25.74416667', '--lon', '123.46805556']);
  assert.equal(jp.exitCode, 0, jp.stderr);
  assert.match(jp.stdout, /Senkaku Islands/);
  assert.match(jp.stdout, /Japanese government’s territorial position: JP/);
  assert.doesNotMatch(jp.stdout, /Claimants|CN|TW/);
  const disputed = await runAgidCli(['geography', '--lat', '-51.7', '--lon', '-57.85']);
  assert.equal(disputed.exitCode, 0, disputed.stderr);
  assert.match(disputed.stdout, /Competing claims/);
  assert.match(disputed.stdout, /Claimants to all or part of the island group: AR, GB/);
  assert.match(disputed.stdout, /Administration in source: GB/);
  const api = await runAgidCli(['geography', '--lat', '-51.7', '--lon', '-57.85', '--json']);
  const result = JSON.parse(api.stdout);
  assert.deepEqual(result.island.countryCodes, []);
  assert.equal(result.deliveryRegion, null);
});

test('geography text reports an inland enclave and distinguishes a shared island from the pin owner', async () => {
  const enclave = await runAgidCli(['geography', '--lat', '47.7', '--lon', '8.68333']);
  assert.equal(enclave.exitCode, 0, enclave.stderr);
  assert.match(enclave.stdout, /Landform: Continental land/);
  assert.match(enclave.stdout, /Territorial classification: [^\n]*Büsingen[^\n]*Enclave/i);
  assert.match(enclave.stdout, /Country or territory at this location: DE/);
  assert.match(enclave.stdout, /Surrounding or neighbouring countries and territories: CH/);

  const island = await runAgidCli(['geography', '--lat', '4.88', '--lon', '114.93']);
  assert.match(island.stdout, /Landform: Island/);
  assert.match(island.stdout, /Mapped country or territory: BN\n/);
  assert.match(island.stdout, /Countries or territories sharing this island: (?=[^\n]*BN)(?=[^\n]*ID)(?=[^\n]*MY)/);
});

test('encode classifies its original Büsingen pin while decode and GeoJSON classify the full cell', async () => {
  // Immediately inside the official Büsingen border; the AGID cell crosses the border.
  const coords = ['--lat', '47.69133884', '--lon', '8.658608827'];
  const encoded = await runAgidCli(['encode', ...coords, '--json']);
  const pin = JSON.parse(encoded.stdout);
  assert.equal(pin.territorialTopology.status, 'inside');
  assert.equal(pin.territorialTopology.administration.code, 'DE');
  const decoded = JSON.parse((await runAgidCli(['decode', pin.id, '--json'])).stdout);
  assert.equal(decoded.id, pin.id);
  assert.equal(decoded.territorialTopology.status, 'uncertain');
  for (const args of [['encode', ...coords, '--geojson'], ['polygon', pin.id, '--geojson']]) {
    const feature = JSON.parse((await runAgidCli(args)).stdout);
    assert.equal(feature.geometry.type, 'Polygon');
    assert.deepEqual(feature.properties.territorialTopology, decoded.territorialTopology);
  }
});

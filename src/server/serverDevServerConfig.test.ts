import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  defaultHmrPort,
  parseDevServerPort,
  resolveViteHmrConfig,
} from './devServerConfig';

const here = dirname(fileURLToPath(import.meta.url));
const serverSource = readFileSync(join(here, '..', '..', 'server.ts'), 'utf8');
const envExample = readFileSync(join(here, '..', '..', '.env.example'), 'utf8');
const npmConfig = readFileSync(join(here, '..', '..', '.npmrc'), 'utf8');
const postalDbSource = readFileSync(join(here, '..', 'services', 'PostalCodeDB.ts'), 'utf8');

test('development server HMR port is configurable and derived from the app port by default', () => {
  assert.equal(parseDevServerPort(undefined), undefined);
  assert.equal(parseDevServerPort('abc'), undefined);
  assert.equal(parseDevServerPort('0'), undefined);
  assert.equal(parseDevServerPort('65536'), undefined);
  assert.equal(parseDevServerPort('15177'), 15177);

  assert.equal(defaultHmrPort(5177), 15177);
  assert.equal(defaultHmrPort(60000), 59999);
  assert.equal(defaultHmrPort(70000), 24679);

  assert.deepEqual(resolveViteHmrConfig(5177, {}), { port: 15177, clientPort: 15177 });
  assert.deepEqual(resolveViteHmrConfig(5177, { AGID_HMR_PORT: '16000' }), { port: 16000, clientPort: 16000 });
  assert.deepEqual(resolveViteHmrConfig(5177, { VITE_HMR_PORT: '17000' }), { port: 17000, clientPort: 17000 });
  assert.equal(resolveViteHmrConfig(5177, { DISABLE_HMR: 'true' }), false);

  assert.match(serverSource, /parseDevServerPort\(process\.env\.PORT\) \?\? 3000/);
  assert.match(serverSource, /resolveViteHmrConfig\(PORT\)/);
  assert.match(serverSource, /hmr: hmrConfig/);
});

test('development server logs workspace provenance and selected HMR port', () => {
  assert.match(serverSource, /\[Server\] Vite HMR: ws:\/\/0\.0\.0\.0:\$\{hmrConfig\.port\}/);
  assert.match(serverSource, /\[Server\] Workspace: \$\{process\.cwd\(\)\}/);
  assert.match(serverSource, /\[Server\] Process: pid=\$\{process\.pid\}/);
  assert.match(serverSource, /\[Server\] OpenAPI v1: http:\/\/0\.0\.0\.0:\$\{PORT\}\/api\/v1\/openapi\.json/);
});

test('development HMR settings are discoverable in the environment example', () => {
  assert.match(envExample, /Local development server/);
  assert.match(envExample, /PORT=3000/);
  assert.match(envExample, /AGID_HMR_PORT=/);
  assert.match(envExample, /VITE_HMR_PORT=/);
  assert.match(envExample, /DISABLE_HMR=false/);
  assert.match(envExample, /Vite websocket ports do not collide/);
});

test('optional Gemini fallback stays disabled when no API key is configured', () => {
  assert.match(serverSource, /const ai = process\.env\.GEMINI_API_KEY\s*\?\s*new GoogleGenAI/);
  assert.match(serverSource, /:\s*null;/);
  assert.match(serverSource, /if \(!ai\) return null;/);
  assert.match(serverSource, /if \(!ai\) return \[\];/);
  assert.match(envExample, /Optional Gemini fallback geocoding/);
  assert.match(envExample, /GEMINI_API_KEY=/);
});

test('background quality sweep is opt-in because it may call external geo services', () => {
  assert.match(serverSource, /process\.env\.AGID_ENABLE_QUALITY_SWEEP === 'true'/);
  assert.match(serverSource, /setInterval\(runGlobalQualitySweep, 1000 \* 60 \* 60 \* 24\)/);
  assert.match(serverSource, /setTimeout\(runGlobalQualitySweep, 5000\)/);
  assert.match(envExample, /Optional background quality monitor/);
  assert.match(envExample, /AGID_ENABLE_QUALITY_SWEEP=false/);
});

test('postal code DB stays lazy by default and download preload is explicit opt-in', () => {
  assert.match(postalDbSource, /process\.env\.AGID_POSTAL_PRELOAD_COUNTRIES/);
  assert.match(postalDbSource, /process\.env\.AGID_POSTAL_PRELOAD_LOCAL === '1'/);
  assert.match(postalDbSource, /process\.env\.AGID_POSTAL_PRELOAD_DOWNLOAD === '1'/);
  assert.match(postalDbSource, /Postal Code DB initialized in lazy mode/);

  assert.match(envExample, /Optional postal-code preload/);
  assert.match(envExample, /AGID_POSTAL_PRELOAD_COUNTRIES=/);
  assert.match(envExample, /AGID_POSTAL_PRELOAD_LOCAL=0/);
  assert.match(envExample, /AGID_POSTAL_PRELOAD_DOWNLOAD=0/);
});

test('credentialed national geo APIs fail closed instead of sending placeholder tokens', () => {
  const tiandituPlaceholder = ['70868a8670737976', '8a8670737976'].join('');

  assert.match(serverSource, /const token = process\.env\.TIANDITU_TOKEN\?\.trim\(\)/);
  assert.match(serverSource, /if \(!token\) return res\.status\(503\)\.json\(\{ error: 'Tianditu token is not configured' \}\)/);
  assert.match(serverSource, /tk=\$\{encodeURIComponent\(token\)\}/);
  assert.ok(!serverSource.includes(tiandituPlaceholder));

  assert.match(serverSource, /const token = process\.env\.INEGI_TOKEN\?\.trim\(\)/);
  assert.match(serverSource, /if \(!token\) return res\.status\(503\)\.json\(\{ error: 'INEGI token is not configured' \}\)/);
  assert.doesNotMatch(serverSource, /process\.env\.INEGI_TOKEN \|\| 'token'/);

  assert.match(envExample, /Optional credentialed national geo APIs/);
  assert.match(envExample, /TIANDITU_TOKEN=/);
  assert.match(envExample, /INEGI_TOKEN=/);
});

test('security and privacy server environment defaults are documented', () => {
  assert.match(serverSource, /process\.env\.AGID_LOG_REDACTION === 'off'/);
  assert.match(serverSource, /process\.env\.AGID_ALLOWED_ORIGINS/);
  assert.match(serverSource, /process\.env\.AGID_CONTENT_SECURITY_POLICY/);
  assert.match(serverSource, /Referrer-Policy', 'no-referrer'/);
  assert.match(serverSource, /Permissions-Policy', 'geolocation=\(self\), camera=\(self\), nfc=\(self\)'/);

  assert.match(envExample, /Security and privacy defaults/);
  assert.match(envExample, /AGID_LOG_REDACTION=/);
  assert.match(envExample, /AGID_ALLOWED_ORIGINS=http:\/\/localhost:3000,http:\/\/127\.0\.0\.1:3000/);
  assert.match(envExample, /AGID_CONTENT_SECURITY_POLICY=frame-ancestors 'self'/);
});

test('local npm config keeps automation logs quiet without disabling audits', () => {
  assert.match(npmConfig, /update-notifier=false/);
  assert.match(npmConfig, /fund=false/);
  assert.doesNotMatch(npmConfig, /audit\s*=\s*false/);
});

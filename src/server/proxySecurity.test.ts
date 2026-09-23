import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  type ProxySecurityResult,
  buildGebcoProxyUrl,
  buildPostalProxyUrl,
  sanitizeRequestId,
  validateOverpassProxyQuery,
} from './proxySecurity';

function urlOf(result: ProxySecurityResult) {
  assert.equal(result.ok, true);
  return result.url;
}

test('sanitizes reflected request ids before response and audit use', () => {
  assert.equal(sanitizeRequestId('REQ-2026_06.24:abc'), 'REQ-2026_06.24:abc');
  assert.equal(sanitizeRequestId('evil\r\nX-Injected: yes<script>'), 'evilX-Injected:yes-script-');
  assert.equal(
    sanitizeRequestId('a'.repeat(300)),
    `${'a'.repeat(120)}`,
  );
});

test('rejects abusive Overpass proxy queries while allowing bounded map lookups', () => {
  const allowed = validateOverpassProxyQuery(`
    [out:json][timeout:25];
    (
      node["building"](around:250,35.681236,139.767125);
      way["building"](around:250,35.681236,139.767125);
    );
    out center 50;
  `);
  assert.equal(allowed.ok, true);

  const planetScan = validateOverpassProxyQuery('[out:json][timeout:90];node["building"];out center;');
  assert.equal(planetScan.ok, false);
  assert.match(planetScan.error ?? '', /bounded bbox or around/);

  const oversizedRadius = validateOverpassProxyQuery('[out:json];node(around:500000,35.0,139.0);out center;');
  assert.equal(oversizedRadius.ok, false);
  assert.match(oversizedRadius.error ?? '', /radius/);

  const metaDump = validateOverpassProxyQuery('[out:json];node(35.0,139.0,35.1,139.1);out meta;');
  assert.equal(metaDump.ok, false);
  assert.match(metaDump.error ?? '', /out meta/);
});

test('normalizes fixed-host postal proxy paths instead of forwarding arbitrary segments', () => {
  assert.equal(urlOf(buildPostalProxyUrl('br-viacep', { cep: '01310-100' })), 'https://viacep.com.br/ws/01310100/json/');
  assert.equal(urlOf(buildPostalProxyUrl('in-pincode', { pincode: '110001' })), 'https://api.postalpincode.in/pincode/110001');
  assert.equal(urlOf(buildPostalProxyUrl('uk-postcode', { postcode: 'SW1A 1AA' })), 'https://api.postcodes.io/postcodes/SW1A%201AA');
  assert.equal(urlOf(buildPostalProxyUrl('zippopotam', { country: 'jp', postcode: '100-0005' })), 'https://api.zippopotam.us/JP/100-0005');

  assert.equal(buildPostalProxyUrl('br-viacep', { cep: '../../etc/passwd' }).ok, false);
  assert.equal(buildPostalProxyUrl('zippopotam', { country: 'japan', postcode: '1000005' }).ok, false);
  assert.equal(buildPostalProxyUrl('in-pincode', { pincode: '110001?raw=true' }).ok, false);
});

test('bounds GEBCO WMS proxy parameters to avoid becoming a broad open proxy', () => {
  const allowed = buildGebcoProxyUrl({
    service: 'WMS',
    request: 'GetMap',
    bbox: '-1,-1,1,1',
    width: '512',
    height: '512',
    format: 'image/png',
    layers: 'gebco_latest',
  });
  assert.equal(allowed.ok, true);
  assert.match(allowed.url ?? '', /^https:\/\/www\.gebco\.net\/data_and_products\/gebco_web_services\/web_map_service\/mapserv\?/);

  assert.equal(buildGebcoProxyUrl({ request: 'GetMap', width: '99999', height: '512' }).ok, false);
  assert.equal(buildGebcoProxyUrl({ request: 'GetFeatureInfo', width: '512', height: '512' }).ok, false);
  assert.equal(buildGebcoProxyUrl({ request: 'GetMap', bbox: 'not,a,bbox', width: '512', height: '512' }).ok, false);
});

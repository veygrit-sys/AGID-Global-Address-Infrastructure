import assert from 'node:assert/strict';
import { readdirSync,readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { encodeAGID,getRegionInfo } from './agid';

const here = dirname(fileURLToPath(import.meta.url));
const addressFormatsDir = join(here, '..', 'data', 'address_formats');

function findAddressFormatPath(code: string, dir = addressFormatsDir): string | null {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findAddressFormatPath(code, fullPath);
      if (found) return found;
    } else if (entry.isFile() && entry.name === `${code}.json`) {
      return fullPath;
    }
  }
  return null;
}

const loadAddressFormat = (code: string) =>
  JSON.parse(readFileSync(findAddressFormatPath(code) || '', 'utf8')) as {
    countryCode: string;
    name: string;
    addressRules?: {
      languages: { code: string; name: string }[];
      nativeOrder: string[];
      englishOrder: string[];
      regionalHierarchy: string[];
      openSourceIds?: string[];
    };
    openSourceIds?: string[];
  };

test('overseas territories and autonomous regions resolve to their own AGID prefixes', () => {
  const samples = [
    { code: 'AX', lat: 60.10, lon: 19.93 },
    { code: 'GL', lat: 64.18, lon: -51.72 },
    { code: 'FO', lat: 62.01, lon: -6.77 },
    { code: 'SJ_SVA', lat: 78.22, lon: 15.65 },
    { code: 'SJ_JAN', lat: 70.98, lon: -8.54 },
    { code: 'BQ', lat: 12.15, lon: -68.27 },
    { code: 'GG', lat: 49.46, lon: -2.58 },
    { code: 'JE', lat: 49.21, lon: -2.13 },
    { code: 'IM', lat: 54.23, lon: -4.55 },
    { code: 'GI', lat: 36.14, lon: -5.35 },
    { code: 'XK', lat: 42.66, lon: 21.16 },
    { code: 'SH', lat: -15.94, lon: -5.72 },
  ];

  for (const sample of samples) {
    assert.equal(getRegionInfo(sample.lat, sample.lon).prefix, sample.code, `${sample.code} should be detected`);
  }
});

test('representative disputed territories resolve before parent country bounding boxes', () => {
  const samples = [
    { code: 'TRNC', lat: 35.25, lon: 33.35 },
    { code: 'SLND', lat: 9.56, lon: 44.06 },
    { code: 'PMR', lat: 47.01, lon: 29.15 },
    { code: 'KASH', lat: 34.15, lon: 75.25 },
    { code: 'SCSD', lat: 11.00, lon: 114.50 },
  ];

  for (const sample of samples) {
    assert.equal(getRegionInfo(sample.lat, sample.lon).prefix, sample.code, `${sample.code} should be detected`);
  }
});

test('disputed territories and missing autonomous regions expose address JSON metadata', () => {
  const expectedCodes = [
    'AX',
    'BT_T',
    'CRIM',
    'DONB',
    'KASH',
    'SCSD',
    'EEBD',
    'TRNC',
    'SLND',
    'PMR',
    'PHIS',
    'BAAR',
    'CYGL',
    'JP_TK',
    'JP_SK',
  ];

  for (const code of expectedCodes) {
    const format = loadAddressFormat(code);
    assert.equal(format.countryCode, code);
    assert.ok(format.addressRules?.languages.length, `${code} should define address languages`);
    assert.ok(format.addressRules?.nativeOrder.length, `${code} should define native order`);
    assert.ok(format.addressRules?.englishOrder.length, `${code} should define English order`);
    assert.ok(format.openSourceIds?.includes('osm-nominatim'), `${code} should expose OSM/Nominatim source`);
  }
});

test('AGID results keep disputed region codes for claim-aware address display', () => {
  const birTawil = encodeAGID(21.92, 33.55);
  assert.equal(birTawil.regionCode, 'BT_T');
  assert.equal(birTawil.regionName, 'Bir Tawil (Terra Nullius)');

  assert.notEqual(encodeAGID(37.24, 131.86).regionCode, 'JP_TK');
  const takeshima = encodeAGID(37.24002, 131.87016);
  assert.equal(takeshima.prefix, 'JP');
  assert.equal(takeshima.regionCode, 'JP_TK');
});


test('historic offshore fixtures do not acquire a Japanese island address', () => {
  for (const [lat, lon] of [[44.5, 146.8], [25.75, 123.55], [37.24, 131.86]]) {
    const offshore = encodeAGID(lat, lon);
    assert.equal(offshore.isSea, true);
    assert.notEqual(offshore.prefix, 'JP');
    assert.equal(offshore.island, undefined);
  }
});

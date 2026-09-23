import assert from 'node:assert/strict';
import { readdirSync,readFileSync,statSync } from 'node:fs';
import { join,relative } from 'node:path';
import { test } from 'node:test';
import { getPostcodeInputConfig } from './postcodeControl';

function walkJsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walkJsonFiles(path) : path.endsWith('.json') ? [path] : [];
  });
}

test('uses country postal-code metadata to build one-character input patterns', () => {
  assert.deepEqual(
    getPostcodeInputConfig({
      countryCode: 'JP',
      name: 'Japan',
      postalCode: {
        format: 'NNN-NNNN',
        regex: '^\\d{3}-\\d{4}$',
        api: 'https://zipcloud.ibsnet.co.jp/api/search?zipcode={{postcode}}',
        source: 'Japan Post',
      },
    }),
    {
      kind: 'segmented',
      pattern: 'NNN-NNNN',
      fixedValue: null,
      source: 'Japan Post',
    },
  );
});

test('converts optional and alternative postal-code formats into editable input patterns', () => {
  assert.equal(
    getPostcodeInputConfig({
      countryCode: 'US',
      name: 'United States',
      postalCode: {
        format: 'NNNNN[-NNNN]',
        regex: '^\\d{5}(-\\d{4})?$',
        api: null,
        source: 'USPS',
      },
    }).pattern,
    'NNNNN-NNNN',
  );

  assert.equal(
    getPostcodeInputConfig({
      countryCode: 'FO',
      name: 'Faroe Islands',
      postalCode: {
        format: 'FO-### or ###',
        regex: '^FO-?\\d{3}$',
        api: null,
        source: 'Posta',
      },
    }).pattern,
    'FO-NNN',
  );
});

test('normalizes variable country and territory postcode formats into safe one-character form patterns', () => {
  const examples = [
    ['A1A-style optional carrier/local code', '^[A-Z]\\d[A-Z]$', 'ANA'],
    ['NNN(NN)', '^\\d{3}(\\d{2})?$', 'NNNNN'],
    ['NNN (or NNNN)', '^\\d{3,4}$', 'NNNN'],
    ['NNNN (or NNNN NNNN)', '^\\d{4}(\\s?\\d{4})?$', 'NNNN NNNN'],
    ['ANNN (or NNNNN)', '^[A-Z]?\\d{3,5}$', '?????'],
    [
      'AN NAA, ANA NAA, ANN NAA, AAN NAA, AANA NAA, AANN NAA',
      '^([A-Z]{1,2}\\d[A-Z\\d]?\\s?\\d[A-Z]{2})$',
      '???? NAA',
    ],
    ['9170-9179 / JM-###', '^(917[0-9]|JM-?\\d{3})$', '??????'],
  ] as const;

  for (const [format, regex, expected] of examples) {
    assert.equal(
      getPostcodeInputConfig({
        countryCode: 'XX',
        name: 'Example',
        postalCode: {
          format,
          regex,
          api: null,
          source: 'Test metadata',
        },
      }).pattern,
      expected,
      format,
    );
  }
});

test('converts numeric postal-code ranges into digit-only input patterns', () => {
  assert.equal(
    getPostcodeInputConfig({
      countryCode: 'CW',
      name: 'Curacao',
      postalCode: {
        format: '0000-9999',
        regex: '^\\d{4}$',
        api: null,
        source: 'Local postal metadata',
      },
    }).pattern,
    'NNNN',
  );
});

test('fixes postal-code input when the region has a single assigned postcode', () => {
  assert.deepEqual(
    getPostcodeInputConfig({
      countryCode: 'PM',
      name: 'Saint Pierre and Miquelon',
      postalCode: {
        format: '97500',
        regex: '^97500$',
        api: null,
        source: 'La Poste',
      },
    }),
    {
      kind: 'fixed',
      pattern: '97500',
      fixedValue: '97500',
      source: 'La Poste',
    },
  );

  assert.deepEqual(
    getPostcodeInputConfig({
      countryCode: 'PN',
      name: 'Pitcairn Islands',
      postalCode: {
        format: 'PCRN 1ZZ',
        regex: '^PCRN\\s?1ZZ$',
        api: null,
        source: 'Pitcairn Islands Post Office',
      },
    }).fixedValue,
    'PCRN 1ZZ',
  );
});

test('does not freeze optional or example-like postcode formats as fixed values', () => {
  assert.equal(
    getPostcodeInputConfig({
      countryCode: 'BZ',
      name: 'Belize',
      postalCode: {
        format: 'optional',
        regex: null,
        api: null,
        source: 'Statistical Institute of Belize / GeoNames',
      },
    }).kind,
    'none',
  );

  assert.deepEqual(
    getPostcodeInputConfig({
      countryCode: 'VG',
      name: 'British Virgin Islands',
      postalCode: {
        format: 'VG1110',
        regex: '^VG\\d{4}$',
        api: null,
        source: 'BVI Post',
      },
    }),
    {
      kind: 'segmented',
      pattern: 'VGNNNN',
      fixedValue: null,
      source: 'BVI Post',
    },
  );

  assert.equal(
    getPostcodeInputConfig({
      countryCode: 'JE',
      name: 'Jersey',
      postalCode: {
        format: 'JE2 4XX',
        regex: '^JE\\d[A-Z\\d]?\\s?\\d[A-Z]{2}$',
        api: null,
        source: 'Jersey Post',
      },
    }).pattern,
    'JEN? NAA',
  );
});

test('does not create a postcode form for countries or territories without postal codes', () => {
  assert.equal(
    getPostcodeInputConfig({
      countryCode: 'HK',
      name: 'Hong Kong',
      postalCode: undefined,
    }).kind,
    'none',
  );

  assert.equal(
    getPostcodeInputConfig({
      countryCode: 'CP',
      name: 'Clipperton Island',
      postalCode: {
        format: 'None',
        regex: null,
        api: null,
        source: 'No permanent address',
      },
    }).kind,
    'none',
  );
});

test('builds safe postcode input configs for every country and region JSON file', () => {
  const root = join(process.cwd(), 'src', 'data', 'address_formats');
  const failures: string[] = [];

  for (const file of walkJsonFiles(root)) {
    const addressFormat = JSON.parse(readFileSync(file, 'utf8'));
    const config = getPostcodeInputConfig(addressFormat);

    if (config.kind === 'none') {
      continue;
    }

    if (!config.pattern || !/^[A-Z0-9 ?-]+$/.test(config.pattern)) {
      failures.push(`${relative(root, file)} produced unsafe pattern "${config.pattern}"`);
    }

    if (config.pattern && config.pattern.length > 12) {
      failures.push(`${relative(root, file)} produced overly long pattern "${config.pattern}"`);
    }
  }

  assert.deepEqual(failures, []);
});

test('rejects descriptive or oversized fallbacks while keeping a safely parsed regex', () => {
  const input = (format: string, regex: string | null) => getPostcodeInputConfig({
    countryCode: 'KP', name: 'Synthetic input-control test',
    postalCode: { format, regex, api: null, source: 'synthetic-not-data' },
  });
  assert.equal(input('NNN (assignment evidence required)', null).kind, 'none');
  assert.equal(input('NNNNNNNNNNNNN', null).kind, 'none');
  assert.equal(input('NNN (assignment evidence required)', '^\\d{3}$').pattern, 'NNN');
  assert.equal(input('NNN (multiple scopes)', '^(?:[1-8]\\d{3}|X[0-9]{3})$').kind, 'none');
});

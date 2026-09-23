import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
EXPANDING_CIRCLE_ENGLISH_COUNTRIES,
INNER_CIRCLE_ENGLISH_COUNTRIES,
OUTER_CIRCLE_ENGLISH_COUNTRIES,
getAgidAddressDisplayTabs,
getAgidAddressTabLanguages,
getEnglishAddressCircle,
getExpandingCircleEnglishPreparation,
} from './languageTabs';

test('uses only the primary native language and English for non-English countries', () => {
  assert.deepEqual(
    getAgidAddressTabLanguages({
      countryCode: 'fr',
      countryLanguages: ['fr', 'br', 'oc', 'co'],
      knownLanguageCodes: ['fr', 'br', 'oc', 'co', 'en'],
    }),
    ['fr', 'en']
  );
});

test('normalizes regional English into English plus domestic English for countries where English is the native language', () => {
  assert.deepEqual(
    getAgidAddressTabLanguages({
      countryCode: 'gb',
      countryLanguages: ['en-GB', 'en', 'cy', 'gd'],
      knownLanguageCodes: ['en-GB', 'en', 'cy', 'gd'],
    }),
    ['en', 'cy', 'gd', 'en_domestic']
  );
});

test('adds Spanish for the United States while keeping English address tabs', () => {
  const languages = getAgidAddressTabLanguages({
    countryCode: 'us',
    countryLanguages: ['en', 'es'],
    knownLanguageCodes: ['en', 'es'],
  });

  assert.deepEqual(languages, ['en', 'es', 'en_domestic']);
  assert.deepEqual(getAgidAddressDisplayTabs(languages), ['en_domestic', 'es', 'en']);
});

test('adds French for Canada while normalizing Canadian English to English', () => {
  const languages = getAgidAddressTabLanguages({
    countryCode: 'ca',
    countryLanguages: ['en', 'en-CA', 'fr'],
    knownLanguageCodes: ['en', 'en-CA', 'fr'],
  });

  assert.deepEqual(languages, ['en', 'fr', 'en_domestic']);
  assert.deepEqual(getAgidAddressDisplayTabs(languages), ['en_domestic', 'fr', 'en']);
});

test('uses domestic and international English tabs for English-only countries', () => {
  const languages = getAgidAddressTabLanguages({
    countryCode: 'au',
    countryLanguages: ['en-AU', 'en'],
    knownLanguageCodes: ['en-AU', 'en'],
  });

  assert.deepEqual(languages, ['en', 'en_domestic']);
  assert.deepEqual(getAgidAddressDisplayTabs(languages), ['en_domestic', 'en']);
});

test('keeps only domestic English and international shipping English display tabs for English-speaking countries', () => {
  assert.deepEqual(
    getAgidAddressDisplayTabs(['en', 'en_domestic']),
    ['en_domestic', 'en']
  );
});

test('normalizes legacy intl_en and carrier tabs into the international English tab', () => {
  assert.deepEqual(
    getAgidAddressDisplayTabs(['en', 'en_domestic']),
    ['en_domestic', 'en']
  );
  assert.deepEqual(
    getAgidAddressDisplayTabs(['en', 'en_domestic', 'carrier']),
    ['en_domestic', 'en']
  );
});

test('treats representative Inner Circle countries as English-primary from country code alone', () => {
  assert.deepEqual(INNER_CIRCLE_ENGLISH_COUNTRIES, ['us', 'gb', 'ca', 'au', 'nz', 'ie']);

  const expectedByCountry: Record<string, string[]> = {
    us: ['en', 'es', 'en_domestic'],
    gb: ['en', 'en_domestic'],
    ca: ['en', 'fr', 'en_domestic'],
    au: ['en', 'en_domestic'],
    nz: ['en', 'en_domestic'],
    ie: ['en', 'en_domestic'],
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    assert.deepEqual(
      getAgidAddressTabLanguages({
        countryCode,
        countryLanguages: [],
        knownLanguageCodes: ['en', 'es', 'fr'],
      }),
      expected
    );
  }
});

test('adds domestic and international shipping English for Outer Circle address countries', () => {
  assert.deepEqual(OUTER_CIRCLE_ENGLISH_COUNTRIES, [
    'in', 'pk', 'bd', 'lk', 'np', 'bt', 'mv',
    'sg', 'my', 'ph', 'bn', 'mm',
    'hk',
    'ng', 'gh', 'sl', 'lr', 'gm', 'cm',
    'er', 'et', 'ke', 'mu', 'rw', 'sc', 'so', 'ss', 'tz', 'ug',
    'za', 'zw', 'zm', 'bw', 'na', 'mw', 'ls', 'sz',
    'jm', 'tt', 'bb', 'bs', 'bz', 'gy', 'ag', 'lc', 'gd', 'dm', 'vc', 'kn',
    'bm', 'ai', 'ky', 'ms', 'tc', 'vg', 'vi',
    'pg', 'fj', 'sb', 'vu', 'ws', 'to',
    'fm', 'pw', 'mh', 'ki', 'tv', 'nr',
    'nf', 'cx', 'cc', 'ck', 'tk', 'nu', 'pn', 'aq',
    'as', 'gu', 'mp', 'um',
    'fk', 'gs',
    'gg', 'im', 'je', 'gi', 'sba',
    'io', 'sh', 'ac', 'ta',
    'ae', 'qa', 'bh',
  ]);

  for (const countryCode of OUTER_CIRCLE_ENGLISH_COUNTRIES) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: ['en'],
    });

    assert.deepEqual(languages, ['en', 'en_domestic']);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), ['en_domestic', 'en']);
  }
});

test('keeps native plus strengthened English tabs for Outer Circle multilingual countries', () => {
  const languages = getAgidAddressTabLanguages({
    countryCode: 'hk',
    countryLanguages: ['zh', 'en-HK'],
    knownLanguageCodes: ['zh', 'en-HK', 'en'],
  });

  assert.deepEqual(languages, ['zh', 'en', 'en_domestic']);
  assert.deepEqual(getAgidAddressDisplayTabs(languages), ['zh', 'en_domestic', 'en']);
});

test('keeps native-language tabs for English-primary countries that also use local languages', () => {
  const expectedByCountry: Record<string, { countryLanguages: string[]; knownLanguageCodes: string[]; languages: string[]; displayTabs: string[] }> = {
    gb: {
      countryLanguages: ['en-GB', 'en', 'cy', 'gd'],
      knownLanguageCodes: ['en', 'cy', 'gd'],
      languages: ['en', 'cy', 'gd', 'en_domestic'],
      displayTabs: ['en_domestic', 'cy', 'gd', 'en'],
    },
    sg: {
      countryLanguages: ['en-SG', 'en', 'zh-Hans', 'ms', 'ta'],
      knownLanguageCodes: ['en', 'zh-Hans', 'ms', 'ta'],
      languages: ['en', 'ms', 'zh-Hans', 'ta', 'en_domestic'],
      displayTabs: ['en_domestic', 'ms', 'zh-Hans', 'ta', 'en'],
    },
    za: {
      countryLanguages: ['en-ZA', 'en', 'af', 'zu', 'xh'],
      knownLanguageCodes: ['en', 'af', 'zu', 'xh'],
      languages: ['en', 'af', 'zu', 'xh', 'en_domestic'],
      displayTabs: ['en_domestic', 'af', 'zu', 'xh', 'en'],
    },
    ke: {
      countryLanguages: [],
      knownLanguageCodes: ['en', 'sw'],
      languages: ['en', 'sw', 'en_domestic'],
      displayTabs: ['en_domestic', 'sw', 'en'],
    },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: expected.countryLanguages,
      knownLanguageCodes: expected.knownLanguageCodes,
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('keeps country-provided native tabs for South Asian English address markets', () => {
  const languages = getAgidAddressTabLanguages({
    countryCode: 'in',
    countryLanguages: ['hi', 'en-IN', 'en', 'bn', 'ta', 'ur'],
    knownLanguageCodes: ['hi', 'en', 'bn', 'ta', 'ur'],
  });

  assert.deepEqual(languages, ['en', 'hi', 'bn', 'ta', 'ur', 'en_domestic']);
  assert.deepEqual(getAgidAddressDisplayTabs(languages), ['en_domestic', 'hi', 'bn', 'ta', 'ur', 'en']);
});

test('classifies Expanding Circle countries separately from Inner and Outer Circle address markets', () => {
  assert.ok(EXPANDING_CIRCLE_ENGLISH_COUNTRIES.includes('jp'));
  assert.ok(EXPANDING_CIRCLE_ENGLISH_COUNTRIES.includes('de'));
  assert.ok(EXPANDING_CIRCLE_ENGLISH_COUNTRIES.includes('br'));

  assert.equal(getEnglishAddressCircle('us'), 'inner');
  assert.equal(getEnglishAddressCircle('in'), 'outer');
  assert.equal(getEnglishAddressCircle('jp'), 'expanding');
  assert.equal(getEnglishAddressCircle('de'), 'expanding');
});

test('keeps Expanding Circle tabs to native plus English without domestic international shipping tabs', () => {
  const languages = getAgidAddressTabLanguages({
    countryCode: 'jp',
    countryLanguages: ['ja'],
    knownLanguageCodes: ['ja', 'en'],
  });

  assert.deepEqual(languages, ['ja', 'en']);
  assert.deepEqual(getAgidAddressDisplayTabs(languages), ['ja', 'en']);
});

test('adds English tabs for Myanmar, Thailand, Vietnam, Cambodia, Laos, and Malaysia from country code defaults', () => {
  const expectedByCountry: Record<string, { languages: string[]; displayTabs: string[] }> = {
    mm: { languages: ['my', 'en', 'en_domestic'], displayTabs: ['my', 'en_domestic', 'en'] },
    th: { languages: ['th', 'en'], displayTabs: ['th', 'en'] },
    vn: { languages: ['vi', 'en'], displayTabs: ['vi', 'en'] },
    kh: { languages: ['km', 'en'], displayTabs: ['km', 'en'] },
    la: { languages: ['lo', 'en'], displayTabs: ['lo', 'en'] },
    my: { languages: ['ms', 'en', 'en_domestic'], displayTabs: ['ms', 'en_domestic', 'en'] },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: ['my', 'th', 'vi', 'km', 'lo', 'ms', 'en'],
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('adds English tabs for Singapore, Indonesia, Philippines, Brunei, and Timor-Leste from country code defaults', () => {
  const expectedByCountry: Record<string, { languages: string[]; displayTabs: string[] }> = {
    sg: { languages: ['en', 'ms', 'en_domestic'], displayTabs: ['en_domestic', 'ms', 'en'] },
    id: { languages: ['id', 'en'], displayTabs: ['id', 'en'] },
    ph: { languages: ['tl', 'en', 'en_domestic'], displayTabs: ['tl', 'en_domestic', 'en'] },
    bn: { languages: ['ms', 'en', 'en_domestic'], displayTabs: ['ms', 'en_domestic', 'en'] },
    tl: { languages: ['tet', 'pt', 'en'], displayTabs: ['tet', 'pt', 'en'] },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: ['en', 'id', 'tl', 'ms', 'tet', 'pt-PT'],
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('adds strengthened English tabs for South Asia from country code defaults', () => {
  const expectedByCountry: Record<string, { languages: string[]; displayTabs: string[] }> = {
    in: {
      languages: ['en', 'bn', 'ur', 'en_domestic'],
      displayTabs: ['en_domestic', 'bn', 'ur', 'en'],
    },
    pk: { languages: ['ur', 'en', 'en_domestic'], displayTabs: ['ur', 'en_domestic', 'en'] },
    bd: { languages: ['bn', 'en', 'en_domestic'], displayTabs: ['bn', 'en_domestic', 'en'] },
    np: { languages: ['ne', 'en', 'en_domestic'], displayTabs: ['ne', 'en_domestic', 'en'] },
    lk: { languages: ['si', 'en', 'en_domestic'], displayTabs: ['si', 'en_domestic', 'en'] },
    bt: { languages: ['dz', 'en', 'en_domestic'], displayTabs: ['dz', 'en_domestic', 'en'] },
    mv: { languages: ['dv', 'en', 'en_domestic'], displayTabs: ['dv', 'en_domestic', 'en'] },
    af: { languages: ['ps', 'fa', 'en'], displayTabs: ['ps', 'fa', 'en'] },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: ['en', 'ur', 'bn', 'ne', 'si', 'dz', 'dv', 'ps', 'fa-AF'],
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('adds native plus English tabs for West Asia from country code defaults', () => {
  const expectedByCountry: Record<string, { languages: string[]; displayTabs: string[] }> = {
    tr: { languages: ['tr', 'en'], displayTabs: ['tr', 'en'] },
    ir: { languages: ['fa', 'en'], displayTabs: ['fa', 'en'] },
    iq: { languages: ['ar', 'en'], displayTabs: ['ar', 'en'] },
    sy: { languages: ['ar', 'en'], displayTabs: ['ar', 'en'] },
    lb: { languages: ['ar', 'en'], displayTabs: ['ar', 'en'] },
    jo: { languages: ['ar', 'en'], displayTabs: ['ar', 'en'] },
    il: { languages: ['he', 'ar', 'en'], displayTabs: ['he', 'ar', 'en'] },
    ps: { languages: ['ar', 'en'], displayTabs: ['ar', 'en'] },
    sa: { languages: ['ar', 'en'], displayTabs: ['ar', 'en'] },
    ae: { languages: ['ar', 'en', 'en_domestic'], displayTabs: ['ar', 'en_domestic', 'en'] },
    qa: { languages: ['ar', 'en', 'en_domestic'], displayTabs: ['ar', 'en_domestic', 'en'] },
    bh: { languages: ['ar', 'en', 'en_domestic'], displayTabs: ['ar', 'en_domestic', 'en'] },
    kw: { languages: ['ar', 'en'], displayTabs: ['ar', 'en'] },
    om: { languages: ['ar', 'en'], displayTabs: ['ar', 'en'] },
    ye: { languages: ['ar', 'en'], displayTabs: ['ar', 'en'] },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: ['ar', 'en', 'fa', 'he', 'tr'],
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('adds native plus English tabs for Central Asia from country code defaults', () => {
  const expectedByCountry: Record<string, { languages: string[]; displayTabs: string[] }> = {
    kz: { languages: ['kk', 'ru', 'en'], displayTabs: ['kk', 'ru', 'en'] },
    uz: { languages: ['uz', 'ru', 'en'], displayTabs: ['uz', 'ru', 'en'] },
    tm: { languages: ['tk', 'ru', 'en'], displayTabs: ['tk', 'ru', 'en'] },
    kg: { languages: ['ky', 'ru', 'en'], displayTabs: ['ky', 'ru', 'en'] },
    tj: { languages: ['tg', 'ru', 'en'], displayTabs: ['tg', 'ru', 'en'] },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: ['kk', 'uz', 'tk', 'ky', 'tg', 'ru', 'en'],
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('adds Oceania English and local-language tabs from country code defaults', () => {
  const expectedByCountry: Record<string, { languages: string[]; displayTabs: string[] }> = {
    au: { languages: ['en', 'en_domestic'], displayTabs: ['en_domestic', 'en'] },
    nz: { languages: ['en', 'mi', 'en_domestic'], displayTabs: ['en_domestic', 'mi', 'en'] },
    fj: { languages: ['en', 'fj', 'hi', 'en_domestic'], displayTabs: ['en_domestic', 'fj', 'hi', 'en'] },
    pg: { languages: ['en', 'tpi', 'en_domestic'], displayTabs: ['en_domestic', 'tpi', 'en'] },
    ws: { languages: ['sm', 'en', 'en_domestic'], displayTabs: ['sm', 'en_domestic', 'en'] },
    to: { languages: ['to', 'en', 'en_domestic'], displayTabs: ['to', 'en_domestic', 'en'] },
    vu: { languages: ['bi', 'fr', 'en', 'en_domestic'], displayTabs: ['bi', 'fr', 'en_domestic', 'en'] },
    sb: { languages: ['en', 'pis', 'en_domestic'], displayTabs: ['en_domestic', 'pis', 'en'] },
    fm: { languages: ['en', 'chk', 'yap', 'en_domestic'], displayTabs: ['en_domestic', 'chk', 'yap', 'en'] },
    pw: { languages: ['en', 'pau', 'en_domestic'], displayTabs: ['en_domestic', 'pau', 'en'] },
    mh: { languages: ['mh', 'en', 'en_domestic'], displayTabs: ['mh', 'en_domestic', 'en'] },
    ki: { languages: ['gil', 'en', 'en_domestic'], displayTabs: ['gil', 'en_domestic', 'en'] },
    tv: { languages: ['tvl', 'en', 'en_domestic'], displayTabs: ['tvl', 'en_domestic', 'en'] },
    nr: { languages: ['na', 'en', 'en_domestic'], displayTabs: ['na', 'en_domestic', 'en'] },
    nf: { languages: ['en', 'en_domestic'], displayTabs: ['en_domestic', 'en'] },
    cx: { languages: ['en', 'en_domestic'], displayTabs: ['en_domestic', 'en'] },
    cc: { languages: ['en', 'en_domestic'], displayTabs: ['en_domestic', 'en'] },
    ck: { languages: ['en', 'rar', 'en_domestic'], displayTabs: ['en_domestic', 'rar', 'en'] },
    tk: { languages: ['tkl', 'en', 'en_domestic'], displayTabs: ['tkl', 'en_domestic', 'en'] },
    nu: { languages: ['niu', 'en', 'en_domestic'], displayTabs: ['niu', 'en_domestic', 'en'] },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: [
        'en', 'mi', 'fj', 'hi', 'tpi', 'sm', 'to', 'bi', 'fr', 'pis', 'chk',
        'yap', 'pau', 'mh', 'gil', 'tvl', 'na', 'rar', 'tkl', 'niu',
      ],
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('adds Western Europe native plus English tabs from country code defaults', () => {
  const expectedByCountry: Record<string, { languages: string[]; displayTabs: string[] }> = {
    fr: { languages: ['fr', 'en'], displayTabs: ['fr', 'en'] },
    de: { languages: ['de', 'en'], displayTabs: ['de', 'en'] },
    nl: { languages: ['nl', 'en'], displayTabs: ['nl', 'en'] },
    be: { languages: ['nl', 'fr', 'de', 'en'], displayTabs: ['nl', 'fr', 'de', 'en'] },
    ch: { languages: ['de', 'fr', 'it', 'rm', 'en'], displayTabs: ['de', 'fr', 'it', 'rm', 'en'] },
    at: { languages: ['de', 'en'], displayTabs: ['de', 'en'] },
    li: { languages: ['de', 'en'], displayTabs: ['de', 'en'] },
    ie: { languages: ['en', 'ga', 'en_domestic'], displayTabs: ['en_domestic', 'ga', 'en'] },
    gp: { languages: ['fr', 'en'], displayTabs: ['fr', 'en'] },
    pf: { languages: ['fr', 'en'], displayTabs: ['fr', 'en'] },
    nc: { languages: ['fr', 'en'], displayTabs: ['fr', 'en'] },
    wf: { languages: ['fr', 'en'], displayTabs: ['fr', 'en'] },
    cp: { languages: ['fr', 'en'], displayTabs: ['fr', 'en'] },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: ['fr', 'de', 'nl', 'it', 'rm', 'en', 'ga'],
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('adds Nordic and Baltic native plus English tabs from country code defaults', () => {
  const expectedByCountry: Record<string, { languages: string[]; displayTabs: string[] }> = {
    se: { languages: ['sv', 'en'], displayTabs: ['sv', 'en'] },
    no: { languages: ['no', 'en'], displayTabs: ['no', 'en'] },
    dk: { languages: ['da', 'en'], displayTabs: ['da', 'en'] },
    fi: { languages: ['fi', 'sv', 'en'], displayTabs: ['fi', 'sv', 'en'] },
    lv: { languages: ['lv', 'en'], displayTabs: ['lv', 'en'] },
    ee: { languages: ['et', 'en'], displayTabs: ['et', 'en'] },
    lt: { languages: ['lt', 'en'], displayTabs: ['lt', 'en'] },
    is: { languages: ['is', 'en'], displayTabs: ['is', 'en'] },
    ax: { languages: ['sv', 'fi', 'en'], displayTabs: ['sv', 'fi', 'en'] },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: ['sv', 'no', 'da', 'fi', 'lv', 'et', 'lt', 'is', 'en'],
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('adds Southern Europe native plus English tabs from country code defaults', () => {
  const expectedByCountry: Record<string, { languages: string[]; displayTabs: string[] }> = {
    it: { languages: ['it', 'en'], displayTabs: ['it', 'en'] },
    es: { languages: ['es', 'ca', 'gl', 'eu', 'en'], displayTabs: ['es', 'ca', 'gl', 'eu', 'en'] },
    pt: { languages: ['pt', 'en'], displayTabs: ['pt', 'en'] },
    gr: { languages: ['el', 'en'], displayTabs: ['el', 'en'] },
    mt: { languages: ['mt', 'en'], displayTabs: ['mt', 'en'] },
    sm: { languages: ['it', 'en'], displayTabs: ['it', 'en'] },
    mc: { languages: ['fr', 'en'], displayTabs: ['fr', 'en'] },
    va: { languages: ['it', 'en'], displayTabs: ['it', 'en'] },
    ad: { languages: ['ca', 'en'], displayTabs: ['ca', 'en'] },
    cy: { languages: ['el', 'tr', 'en'], displayTabs: ['el', 'tr', 'en'] },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: ['it', 'es', 'pt', 'el', 'mt', 'fr', 'ca', 'gl', 'eu', 'tr', 'en'],
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('adds Central Europe native plus English tabs from country code defaults', () => {
  const expectedByCountry: Record<string, { languages: string[]; displayTabs: string[] }> = {
    pl: { languages: ['pl', 'en'], displayTabs: ['pl', 'en'] },
    cz: { languages: ['cs', 'en'], displayTabs: ['cs', 'en'] },
    sk: { languages: ['sk', 'en'], displayTabs: ['sk', 'en'] },
    hu: { languages: ['hu', 'en'], displayTabs: ['hu', 'en'] },
    si: { languages: ['sl', 'en'], displayTabs: ['sl', 'en'] },
    hr: { languages: ['hr', 'en'], displayTabs: ['hr', 'en'] },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: ['pl', 'cs', 'sk', 'hu', 'sl', 'hr', 'en'],
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('adds Eastern Europe native plus English tabs from country code defaults', () => {
  const expectedByCountry: Record<string, { languages: string[]; displayTabs: string[] }> = {
    ro: { languages: ['ro', 'en'], displayTabs: ['ro', 'en'] },
    bg: { languages: ['bg', 'en'], displayTabs: ['bg', 'en'] },
    ua: { languages: ['uk', 'en'], displayTabs: ['uk', 'en'] },
    md: { languages: ['ro', 'en'], displayTabs: ['ro', 'en'] },
    by: { languages: ['be', 'ru', 'en'], displayTabs: ['be', 'ru', 'en'] },
    ru: { languages: ['ru', 'en'], displayTabs: ['ru', 'en'] },
    rs: { languages: ['sr', 'en'], displayTabs: ['sr', 'en'] },
    ba: { languages: ['bs', 'hr', 'sr', 'en'], displayTabs: ['bs', 'hr', 'sr', 'en'] },
    me: { languages: ['cnr', 'en'], displayTabs: ['cnr', 'en'] },
    xk: { languages: ['sq', 'sr', 'en'], displayTabs: ['sq', 'sr', 'en'] },
    al: { languages: ['sq', 'en'], displayTabs: ['sq', 'en'] },
    mk: { languages: ['mk', 'en'], displayTabs: ['mk', 'en'] },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: ['ro', 'bg', 'uk', 'be', 'ru', 'sr', 'bs', 'hr', 'cnr', 'sq', 'mk', 'en'],
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('adds overseas territory and autonomous-region language tabs for NL, DK, NO, ES, and PT', () => {
  const expectedByCountry: Record<string, { languages: string[]; displayTabs: string[] }> = {
    bq: { languages: ['nl', 'pap', 'en'], displayTabs: ['nl', 'pap', 'en'] },
    aw: { languages: ['nl', 'pap', 'en'], displayTabs: ['nl', 'pap', 'en'] },
    cw: { languages: ['nl', 'pap', 'en'], displayTabs: ['nl', 'pap', 'en'] },
    sx: { languages: ['nl', 'en'], displayTabs: ['nl', 'en'] },
    gl: { languages: ['kl', 'da', 'en'], displayTabs: ['kl', 'da', 'en'] },
    fo: { languages: ['fo', 'da', 'en'], displayTabs: ['fo', 'da', 'en'] },
    sj_sva: { languages: ['no', 'en'], displayTabs: ['no', 'en'] },
    sj_jan: { languages: ['no', 'en'], displayTabs: ['no', 'en'] },
    es_bal: { languages: ['es', 'en'], displayTabs: ['es', 'en'] },
    es_can: { languages: ['es', 'en'], displayTabs: ['es', 'en'] },
    pt_azo: { languages: ['pt', 'en'], displayTabs: ['pt', 'en'] },
    pt_mad: { languages: ['pt', 'en'], displayTabs: ['pt', 'en'] },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: ['nl', 'pap', 'en', 'kl', 'da', 'fo', 'no', 'sv', 'fi', 'es', 'ca', 'pt'],
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('adds Americas native plus English tabs from country code defaults', () => {
  const expectedByCountry: Record<string, { languages: string[]; displayTabs: string[] }> = {
    mx: { languages: ['es', 'en'], displayTabs: ['es', 'en'] },
    gt: { languages: ['es', 'en'], displayTabs: ['es', 'en'] },
    hn: { languages: ['es', 'en'], displayTabs: ['es', 'en'] },
    sv: { languages: ['es', 'en'], displayTabs: ['es', 'en'] },
    ni: { languages: ['es', 'en'], displayTabs: ['es', 'en'] },
    cr: { languages: ['es', 'en'], displayTabs: ['es', 'en'] },
    pa: { languages: ['es', 'en'], displayTabs: ['es', 'en'] },
    cu: { languages: ['es', 'en'], displayTabs: ['es', 'en'] },
    do: { languages: ['es', 'en'], displayTabs: ['es', 'en'] },
    pr: { languages: ['es', 'en'], displayTabs: ['es', 'en'] },
    br: { languages: ['pt', 'en'], displayTabs: ['pt', 'en'] },
    ar: { languages: ['es', 'en'], displayTabs: ['es', 'en'] },
    cl: { languages: ['es', 'en'], displayTabs: ['es', 'en'] },
    co: { languages: ['es', 'en'], displayTabs: ['es', 'en'] },
    pe: { languages: ['es', 'qu', 'ay', 'en'], displayTabs: ['es', 'qu', 'ay', 'en'] },
    ec: { languages: ['es', 'qu', 'en'], displayTabs: ['es', 'qu', 'en'] },
    bo: { languages: ['es', 'qu', 'ay', 'en'], displayTabs: ['es', 'qu', 'ay', 'en'] },
    py: { languages: ['es', 'gn', 'en'], displayTabs: ['es', 'gn', 'en'] },
    uy: { languages: ['es', 'en'], displayTabs: ['es', 'en'] },
    ve: { languages: ['es', 'en'], displayTabs: ['es', 'en'] },
    ht: { languages: ['fr', 'ht', 'en'], displayTabs: ['fr', 'ht', 'en'] },
    sr: { languages: ['nl', 'en'], displayTabs: ['nl', 'en'] },
    gf: { languages: ['fr', 'en'], displayTabs: ['fr', 'en'] },
    bq: { languages: ['nl', 'pap', 'en'], displayTabs: ['nl', 'pap', 'en'] },
    aw: { languages: ['nl', 'pap', 'en'], displayTabs: ['nl', 'pap', 'en'] },
    cw: { languages: ['nl', 'pap', 'en'], displayTabs: ['nl', 'pap', 'en'] },
    bz: { languages: ['en', 'es', 'en_domestic'], displayTabs: ['en_domestic', 'es', 'en'] },
    gy: { languages: ['en', 'en_domestic'], displayTabs: ['en_domestic', 'en'] },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: ['en', 'es', 'pt', 'fr', 'nl', 'ht', 'pap', 'qu', 'ay', 'gn'],
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('adds Caucasus native plus English tabs from country code defaults', () => {
  const expectedByCountry: Record<string, { languages: string[]; displayTabs: string[] }> = {
    am: { languages: ['hy', 'en'], displayTabs: ['hy', 'en'] },
    az: { languages: ['az', 'en'], displayTabs: ['az', 'en'] },
    ge: { languages: ['ka', 'en'], displayTabs: ['ka', 'en'] },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: ['hy', 'az', 'ka', 'en'],
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('adds North Africa native plus English tabs from country code defaults', () => {
  const expectedByCountry: Record<string, { languages: string[]; displayTabs: string[] }> = {
    eg: { languages: ['ar', 'en'], displayTabs: ['ar', 'en'] },
    dz: { languages: ['ar', 'fr', 'en'], displayTabs: ['ar', 'fr', 'en'] },
    ma: { languages: ['ar', 'fr', 'en'], displayTabs: ['ar', 'fr', 'en'] },
    tn: { languages: ['ar', 'en'], displayTabs: ['ar', 'en'] },
    ly: { languages: ['ar', 'en'], displayTabs: ['ar', 'en'] },
    sd: { languages: ['ar', 'en'], displayTabs: ['ar', 'en'] },
    mr: { languages: ['ar', 'en'], displayTabs: ['ar', 'en'] },
    eh: { languages: ['ar', 'fr', 'en'], displayTabs: ['ar', 'fr', 'en'] },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: ['ar', 'fr', 'en'],
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('adds West Africa English or native plus English tabs from country code defaults', () => {
  const expectedByCountry: Record<string, { languages: string[]; displayTabs: string[] }> = {
    ng: { languages: ['en', 'en_domestic'], displayTabs: ['en_domestic', 'en'] },
    gh: { languages: ['en', 'en_domestic'], displayTabs: ['en_domestic', 'en'] },
    ci: { languages: ['fr', 'en'], displayTabs: ['fr', 'en'] },
    sn: { languages: ['fr', 'en'], displayTabs: ['fr', 'en'] },
    bf: { languages: ['fr', 'en'], displayTabs: ['fr', 'en'] },
    ml: { languages: ['fr', 'en'], displayTabs: ['fr', 'en'] },
    ne: { languages: ['fr', 'en'], displayTabs: ['fr', 'en'] },
    tg: { languages: ['fr', 'en'], displayTabs: ['fr', 'en'] },
    bj: { languages: ['fr', 'en'], displayTabs: ['fr', 'en'] },
    lr: { languages: ['en', 'en_domestic'], displayTabs: ['en_domestic', 'en'] },
    sl: { languages: ['en', 'en_domestic'], displayTabs: ['en_domestic', 'en'] },
    gm: { languages: ['en', 'en_domestic'], displayTabs: ['en_domestic', 'en'] },
    cm: { languages: ['fr', 'en', 'en_domestic'], displayTabs: ['fr', 'en_domestic', 'en'] },
    gn: { languages: ['fr', 'en'], displayTabs: ['fr', 'en'] },
    gw: { languages: ['pt', 'en'], displayTabs: ['pt', 'en'] },
    cv: { languages: ['pt', 'en'], displayTabs: ['pt', 'en'] },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: ['en', 'fr', 'pt'],
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('adds Central Africa native plus English tabs from country code defaults', () => {
  const expectedByCountry: Record<string, { languages: string[]; displayTabs: string[] }> = {
    cm: { languages: ['fr', 'en', 'en_domestic'], displayTabs: ['fr', 'en_domestic', 'en'] },
    cf: { languages: ['fr', 'sg', 'en'], displayTabs: ['fr', 'sg', 'en'] },
    td: { languages: ['fr', 'ar', 'en'], displayTabs: ['fr', 'ar', 'en'] },
    cg: { languages: ['fr', 'en'], displayTabs: ['fr', 'en'] },
    cd: { languages: ['fr', 'en'], displayTabs: ['fr', 'en'] },
    gq: { languages: ['es', 'fr', 'pt', 'en'], displayTabs: ['es', 'fr', 'pt', 'en'] },
    ga: { languages: ['fr', 'en'], displayTabs: ['fr', 'en'] },
    st: { languages: ['pt', 'en'], displayTabs: ['pt', 'en'] },
    ao: { languages: ['pt', 'en'], displayTabs: ['pt', 'en'] },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: ['en', 'fr', 'sg', 'ar', 'pt', 'es'],
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('adds East Africa domestic and international English tabs where English is strong for delivery', () => {
  const expectedByCountry: Record<string, { languages: string[]; displayTabs: string[] }> = {
    km: { languages: ['fr', 'ar', 'en'], displayTabs: ['fr', 'ar', 'en'] },
    dj: { languages: ['fr', 'ar', 'en'], displayTabs: ['fr', 'ar', 'en'] },
    er: { languages: ['ti', 'en', 'ar', 'en_domestic'], displayTabs: ['ti', 'en_domestic', 'ar', 'en'] },
    et: { languages: ['am', 'en', 'ti', 'so', 'en_domestic'], displayTabs: ['am', 'en_domestic', 'ti', 'so', 'en'] },
    ke: { languages: ['en', 'sw', 'en_domestic'], displayTabs: ['en_domestic', 'sw', 'en'] },
    mg: { languages: ['fr', 'en'], displayTabs: ['fr', 'en'] },
    mw: { languages: ['en', 'ny', 'en_domestic'], displayTabs: ['en_domestic', 'ny', 'en'] },
    mu: { languages: ['en', 'fr', 'en_domestic'], displayTabs: ['en_domestic', 'fr', 'en'] },
    mz: { languages: ['pt', 'en'], displayTabs: ['pt', 'en'] },
    rw: { languages: ['en', 'fr', 'sw', 'en_domestic'], displayTabs: ['en_domestic', 'fr', 'sw', 'en'] },
    sc: { languages: ['en', 'fr', 'crs', 'en_domestic'], displayTabs: ['en_domestic', 'fr', 'crs', 'en'] },
    so: { languages: ['so', 'ar', 'en', 'en_domestic'], displayTabs: ['so', 'ar', 'en_domestic', 'en'] },
    ss: { languages: ['en', 'en_domestic'], displayTabs: ['en_domestic', 'en'] },
    tz: { languages: ['sw', 'en', 'en_domestic'], displayTabs: ['sw', 'en_domestic', 'en'] },
    ug: { languages: ['en', 'sw', 'en_domestic'], displayTabs: ['en_domestic', 'sw', 'en'] },
    zm: { languages: ['en', 'bem', 'ny', 'en_domestic'], displayTabs: ['en_domestic', 'bem', 'ny', 'en'] },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: ['en', 'fr', 'ar', 'ti', 'am', 'sw', 'pt', 'so', 'ny', 'bem', 'crs'],
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('adds Southern Africa and Indian Ocean delivery-language tabs from country code defaults', () => {
  const expectedByCountry: Record<string, { languages: string[]; displayTabs: string[] }> = {
    za: {
      languages: ['en', 'af', 'zu', 'xh', 'st', 'tn', 'ss', 'en_domestic'],
      displayTabs: ['en_domestic', 'af', 'zu', 'xh', 'st', 'tn', 'ss', 'en'],
    },
    na: { languages: ['en', 'af', 'kj', 'en_domestic'], displayTabs: ['en_domestic', 'af', 'kj', 'en'] },
    bw: { languages: ['en', 'tn', 'en_domestic'], displayTabs: ['en_domestic', 'tn', 'en'] },
    zw: { languages: ['en', 'sn', 'nd', 'en_domestic'], displayTabs: ['en_domestic', 'sn', 'nd', 'en'] },
    mz: { languages: ['pt', 'en'], displayTabs: ['pt', 'en'] },
    mw: { languages: ['en', 'ny', 'en_domestic'], displayTabs: ['en_domestic', 'ny', 'en'] },
    zm: { languages: ['en', 'bem', 'ny', 'en_domestic'], displayTabs: ['en_domestic', 'bem', 'ny', 'en'] },
    ls: { languages: ['en', 'st', 'en_domestic'], displayTabs: ['en_domestic', 'st', 'en'] },
    sz: { languages: ['en', 'ss', 'en_domestic'], displayTabs: ['en_domestic', 'ss', 'en'] },
    ao: { languages: ['pt', 'en'], displayTabs: ['pt', 'en'] },
    mu: { languages: ['en', 'fr', 'en_domestic'], displayTabs: ['en_domestic', 'fr', 'en'] },
    km: { languages: ['fr', 'ar', 'en'], displayTabs: ['fr', 'ar', 'en'] },
    sc: { languages: ['en', 'fr', 'crs', 'en_domestic'], displayTabs: ['en_domestic', 'fr', 'crs', 'en'] },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: ['en', 'pt', 'fr', 'ar', 'af', 'zu', 'xh', 'kj', 'tn', 'sn', 'nd', 'ny', 'bem', 'st', 'ss', 'crs'],
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('keeps all official language tabs for European multilingual address markets', () => {
  const expectedByCountry: Record<string, { languages: string[]; displayTabs: string[] }> = {
    ch: { languages: ['de', 'fr', 'it', 'rm', 'en'], displayTabs: ['de', 'fr', 'it', 'rm', 'en'] },
    be: { languages: ['nl', 'fr', 'de', 'en'], displayTabs: ['nl', 'fr', 'de', 'en'] },
    lu: { languages: ['lb', 'fr', 'de', 'en'], displayTabs: ['lb', 'fr', 'de', 'en'] },
    fi: { languages: ['fi', 'sv', 'en'], displayTabs: ['fi', 'sv', 'en'] },
    es: { languages: ['es', 'ca', 'gl', 'eu', 'en'], displayTabs: ['es', 'ca', 'gl', 'eu', 'en'] },
    cy: { languages: ['el', 'tr', 'en'], displayTabs: ['el', 'tr', 'en'] },
    ba: { languages: ['bs', 'hr', 'sr', 'en'], displayTabs: ['bs', 'hr', 'sr', 'en'] },
  };

  for (const [countryCode, expected] of Object.entries(expectedByCountry)) {
    const languages = getAgidAddressTabLanguages({
      countryCode,
      countryLanguages: [],
      knownLanguageCodes: ['en', 'de', 'fr', 'it', 'rm', 'nl', 'lb', 'fi', 'sv', 'es', 'ca', 'gl', 'eu', 'el', 'tr', 'bs', 'hr', 'sr'],
    });

    assert.deepEqual(languages, expected.languages);
    assert.deepEqual(getAgidAddressDisplayTabs(languages), expected.displayTabs);
  }
});

test('returns staged preparation for Expanding Circle native-to-English conversion', () => {
  assert.deepEqual(
    getExpandingCircleEnglishPreparation('jp').map(stage => stage.id),
    ['native-format', 'script-conversion', 'english-exonyms', 'open-source-validation']
  );
  assert.equal(getExpandingCircleEnglishPreparation('jp')[0].status, 'ready');
  assert.equal(getExpandingCircleEnglishPreparation('jp')[3].status, 'planned');
});

test('preserves an explicitly selected native preference when it matches the country primary language', () => {
  assert.deepEqual(
    getAgidAddressTabLanguages({
      countryCode: 'jp',
      preferredLanguage: 'ja',
      countryLanguages: ['ja'],
      knownLanguageCodes: ['ja', 'en'],
    }),
    ['ja', 'en']
  );
});

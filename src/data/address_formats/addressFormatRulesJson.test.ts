import assert from 'node:assert/strict';
import { readdirSync,readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { AFRICA_COUNTRY_CODES,AFRICA_OPEN_GEO_SOURCES } from '../africaOpenGeoSources';
import { AMERICAS_COUNTRY_CODES,AMERICAS_OPEN_GEO_SOURCES } from '../americasOpenGeoSources';
import { ASIA_COUNTRY_CODES,ASIA_OPEN_GEO_SOURCES } from '../asiaOpenGeoSources';
import { EUROPE_COUNTRY_AND_TERRITORY_CODES,EUROPE_OPEN_GEO_SOURCES } from '../europeOpenGeoSources';
import { OCEANIA_COUNTRY_AND_TERRITORY_CODES,OCEANIA_OPEN_GEO_SOURCES } from '../oceaniaOpenGeoSources';
import { hydrateAddressFormat } from './addressFormatCommon';

const here = dirname(fileURLToPath(import.meta.url));

function findAddressFormatPath(countryCode: string, dir = here): string | null {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findAddressFormatPath(countryCode, fullPath);
      if (found) return found;
    } else if (entry.isFile() && entry.name === `${countryCode}.json`) {
      return fullPath;
    }
  }
  return null;
}

const EUROPE_REQUIRED_OPEN_SOURCE_IDS = [
  'osm-nominatim',
  'osm-overpass',
  'openaddresses',
  'geonames-postal',
  'geonames-gazetteer',
  'geoboundaries',
  'upu-addressing',
  'copernicus-dem',
  'copernicus-corine-land-cover',
  'emodnet-bathymetry',
  'emodnet-seabed-habitats',
  'eea-natura-2000',
  'eea-eunis-habitats',
  'jrc-esdac-soils',
] as const;

const AFRICA_NATURAL_OPEN_SOURCE_IDS = [
  'digital-earth-africa-dem',
  'digital-earth-africa-coastlines',
  'digital-earth-africa-waterbodies',
  'digital-earth-africa-wofs',
  'digital-earth-africa-fractional-cover',
  'digital-earth-africa-geomad',
  'fao-wapor',
  'esa-worldcover',
  'gebco-bathymetry',
  'gmrt-topography',
  'global-mangrove-watch',
  'allen-coral-atlas',
  'protected-planet-wdpa',
  'gbif-occurrence',
  'rcmrd-gmes-africa-geoportal',
] as const;

const AMERICAS_NATURAL_OPEN_SOURCE_IDS = [
  'noaa-etopo',
  'geobc-global-multi-resolution-topography',
  'hydrosheds',
  'protected-planet-wdpa',
  'gbif-occurrence',
  'esa-worldcover',
  'usgs-3dep',
  'nrcan-geospatial',
  'conabio-geoportal',
  'ibge-geosciences',
  'inpe-terrabrasilis',
] as const;

const ASIA_NATURAL_OPEN_SOURCE_IDS = [
  'nasa-srtm',
  'jaxa-aw3d30',
  'gebco-bathymetry',
  'gmrt-topography',
  'hydrosheds',
  'esa-worldcover',
  'protected-planet-wdpa',
  'gbif-occurrence',
] as const;

const OCEANIA_NATURAL_OPEN_SOURCE_IDS = [
  'jaxa-aw3d30',
  'gebco-bathymetry',
  'gmrt-topography',
  'hydrosheds',
  'esa-worldcover',
  'protected-planet-wdpa',
  'gbif-occurrence',
  'global-mangrove-watch',
  'allen-coral-atlas',
  'pacific-data-hub',
  'digital-earth-pacific',
  'pacioos',
] as const;


type AddressRules = {
  languages: { code: string; name: string }[];
  deliveryLanguages?: { code: string; name: string }[];
  nativeOrder: string[];
  englishOrder: string[];
  regionalHierarchy: string[];
  russianOrder?: string[];
  openSourceIds?: string[];
  postalCode: { label: string; required: boolean; usage: string } | null;
};

type AddressFormatFixture = {
  openSourceIds?: string[];
  native?: { fields: { key: string; label: string; required?: boolean }[] };
  english?: { fields: { key: string; label: string; required?: boolean }[] };
  domestic?: Record<string, { name?: string; addressFormat: string; fields: { key: string; label: string; placeholder?: string }[] }>;
  international?: Record<string, { name?: string; addressFormat: string; fields: { key: string; label: string; placeholder?: string }[] }>;
  postalCode?: { api?: string | null; source?: string };
  addressRules?: AddressRules;
};

const loadRules = (countryCode: string): AddressRules => {
  const filePath = findAddressFormatPath(countryCode);
  assert.ok(filePath, `${countryCode}.json should exist under continent/subregion address formats`);
  const raw = readFileSync(filePath, 'utf8');
  const format = hydrateAddressFormat(JSON.parse(raw) as { openSourceIds?: string[]; addressRules?: AddressRules });
  assert.ok(format.addressRules, `${countryCode}.json should include addressRules`);
  return format.addressRules;
};

const loadFormat = (countryCode: string): AddressFormatFixture => {
  const filePath = findAddressFormatPath(countryCode);
  assert.ok(filePath, `${countryCode}.json should exist under continent/subregion address formats`);
  const raw = readFileSync(filePath, 'utf8');
  return hydrateAddressFormat(JSON.parse(raw) as AddressFormatFixture);
};

test('East Asia address JSON files expose table-derived addressRules metadata', () => {
  const expectedCountries = ['JP', 'CN', 'KR', 'KP', 'TW', 'HK', 'MO', 'MN'];
  for (const countryCode of expectedCountries) {
    const rules = loadRules(countryCode);
    assert.ok(rules.languages.length > 0, `${countryCode} should define languages`);
    assert.ok(rules.nativeOrder.length > 0, `${countryCode} should define nativeOrder`);
    assert.ok(rules.englishOrder.length > 0, `${countryCode} should define englishOrder`);
  }

  assert.deepEqual(loadRules('JP').englishOrder, [
    'postcode',
    'prefecture',
    'city',
    'block',
    'building',
    'name',
  ]);
  assert.deepEqual(loadRules('CN').languages, [{ code: 'zh-Hans', name: 'Chinese (Simplified)' }]);
  assert.deepEqual(loadRules('HK').languages, [
    { code: 'zh-Hant', name: 'Chinese (Traditional)' },
    { code: 'en', name: 'English' },
  ]);
  assert.equal(loadRules('HK').postalCode, null);
  assert.deepEqual(loadRules('MO').languages, [
    { code: 'zh-Hant', name: 'Chinese (Traditional)' },
    { code: 'pt', name: 'Portuguese' },
  ]);
  assert.deepEqual(loadRules('MN').regionalHierarchy, ['aimag', 'sum', 'bag']);
});

test('Japan address metadata exposes GSI, jageocoder, Geolonia, and OSM Japan sources', () => {
  const format = loadFormat('JP');
  const rules = loadRules('JP');
  const expectedSourceIds = [
    'gsi-japan-tiles',
    'gsi-japan-vector',
    'gsi-basic-geospatial',
    'gsi-dem',
    'jageocoder',
    'geolonia-addresses',
    'osm-japan',
  ];

  for (const sourceId of expectedSourceIds) {
    assert.ok(format.openSourceIds?.includes(sourceId), `JP should expose ${sourceId}`);
    assert.ok(rules.openSourceIds?.includes(sourceId), `JP addressRules should expose ${sourceId}`);

    const source = ASIA_OPEN_GEO_SOURCES[sourceId as keyof typeof ASIA_OPEN_GEO_SOURCES];
    assert.ok(source, `${sourceId} should be registered as an Asia open geo source`);
    assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
  }

  assert.equal(format.postalCode?.source, 'Japan Post / zipcloud / jageocoder / Geolonia');
});

test('South Korea address metadata exposes NGII, LX, road-name address, and OSM Korea sources', () => {
  const format = loadFormat('KR');
  const rules = loadRules('KR');
  const expectedSourceIds = [
    'ngii-korea',
    'lx-korea',
    'juso-kr',
    'osm-korea',
  ];

  for (const sourceId of expectedSourceIds) {
    assert.ok(format.openSourceIds?.includes(sourceId), `KR should expose ${sourceId}`);
    assert.ok(rules.openSourceIds?.includes(sourceId), `KR addressRules should expose ${sourceId}`);

    const source = ASIA_OPEN_GEO_SOURCES[sourceId as keyof typeof ASIA_OPEN_GEO_SOURCES];
    assert.ok(source, `${sourceId} should be registered as an Asia open geo source`);
    assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
  }

  assert.equal(format.postalCode?.source, 'Korea Post / ePOST / Juso road-name address');
});

test('Taiwan address metadata exposes NLSC, TGOS, OSM Taiwan, and g0v sources', () => {
  const format = loadFormat('TW');
  const rules = loadRules('TW');
  const expectedSourceIds = [
    'nlsc-taiwan',
    'tgos-taiwan',
    'osm-taiwan',
    'g0v-taiwan',
  ];

  for (const sourceId of expectedSourceIds) {
    assert.ok(format.openSourceIds?.includes(sourceId), `TW should expose ${sourceId}`);
    assert.ok(rules.openSourceIds?.includes(sourceId), `TW addressRules should expose ${sourceId}`);

    const source = ASIA_OPEN_GEO_SOURCES[sourceId as keyof typeof ASIA_OPEN_GEO_SOURCES];
    assert.ok(source, `${sourceId} should be registered as an Asia open geo source`);
    assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
  }

  assert.deepEqual(rules.languages, [{ code: 'zh-Hant', name: 'Chinese (Traditional)' }]);
  assert.equal(format.postalCode?.source, 'Chunghwa Post / NLSC / TGOS');
});

test('Hong Kong address metadata exposes LandsD, CSDI, and OSM Hong Kong sources', () => {
  const format = loadFormat('HK');
  const rules = loadRules('HK');
  const expectedSourceIds = [
    'landsd-hk',
    'csdi-hk',
    'osm-hong-kong',
  ];

  for (const sourceId of expectedSourceIds) {
    assert.ok(format.openSourceIds?.includes(sourceId), `HK should expose ${sourceId}`);
    assert.ok(rules.openSourceIds?.includes(sourceId), `HK addressRules should expose ${sourceId}`);

    const source = ASIA_OPEN_GEO_SOURCES[sourceId as keyof typeof ASIA_OPEN_GEO_SOURCES];
    assert.ok(source, `${sourceId} should be registered as an Asia open geo source`);
    assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
  }

  assert.equal(format.postalCode?.source, 'Hongkong Post / LandsD / CSDI (No postal codes used)');
});

test('Macau address metadata exposes DSCC, Macao GeoGuide, and OSM Macau sources', () => {
  const format = loadFormat('MO');
  const rules = loadRules('MO');
  const expectedSourceIds = [
    'dscc-macao',
    'geoguide-macao',
    'osm-macau',
  ];

  for (const sourceId of expectedSourceIds) {
    assert.ok(format.openSourceIds?.includes(sourceId), `MO should expose ${sourceId}`);
    assert.ok(rules.openSourceIds?.includes(sourceId), `MO addressRules should expose ${sourceId}`);

    const source = ASIA_OPEN_GEO_SOURCES[sourceId as keyof typeof ASIA_OPEN_GEO_SOURCES];
    assert.ok(source, `${sourceId} should be registered as an Asia open geo source`);
    assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
  }

  assert.equal(format.postalCode?.source, 'CTT / DSCC / Macao GeoGuide (No postal codes used)');
});

test('Mongolia address metadata exposes national NSDI, postal-code, HOT, and OSM sources', () => {
  const format = loadFormat('MN');
  const rules = loadRules('MN');
  const expectedSourceIds = [
    'alamgc-mongolia',
    'nsdi-mongolia',
    'zipcode-mn',
    'hot-osm-mongolia',
    'osm-mongolia',
  ];

  for (const sourceId of expectedSourceIds) {
    assert.ok(format.openSourceIds?.includes(sourceId), `MN should expose ${sourceId}`);
    assert.ok(rules.openSourceIds?.includes(sourceId), `MN addressRules should expose ${sourceId}`);

    const source = ASIA_OPEN_GEO_SOURCES[sourceId as keyof typeof ASIA_OPEN_GEO_SOURCES];
    assert.ok(source, `${sourceId} should be registered as an Asia open geo source`);
    assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
  }

  assert.deepEqual(rules.regionalHierarchy, ['aimag', 'sum', 'bag']);
  assert.equal(format.postalCode?.source, 'Mongol Post / zipcode.mn / ALAMGC NSDI');
});

test('Southeast Asia address JSON files expose table-derived addressRules metadata', () => {
  const expectedCountries = ['MM', 'TH', 'VN', 'KH', 'LA', 'MY', 'SG', 'ID', 'PH', 'BN', 'TL'];
  for (const countryCode of expectedCountries) {
    const rules = loadRules(countryCode);
    assert.ok(rules.languages.length > 0, `${countryCode} should define languages`);
    assert.ok(rules.nativeOrder.length > 0, `${countryCode} should define nativeOrder`);
    assert.ok(rules.englishOrder.length > 0, `${countryCode} should define englishOrder`);
  }

  assert.deepEqual(loadRules('TH').englishOrder, [
    'postcode',
    'province',
    'district',
    'subdistrict',
    'street',
    'houseNumber',
    'name',
  ]);
  assert.deepEqual(loadRules('SG').languages, [
    { code: 'en', name: 'English' },
    { code: 'ms', name: 'Malay' },
    { code: 'zh', name: 'Chinese' },
  ]);
  assert.equal(loadRules('BN').postalCode?.label, '2 letters plus 4 digits required');
  assert.equal(loadRules('TL').postalCode, null);
});

test('South Asia address JSON files expose table-derived addressRules metadata', () => {
  const expectedCountries = ['IN', 'PK', 'BD', 'NP', 'LK', 'BT', 'MV', 'AF'];
  for (const countryCode of expectedCountries) {
    const rules = loadRules(countryCode);
    assert.ok(rules.languages.length > 0, `${countryCode} should define languages`);
    assert.ok(rules.nativeOrder.length > 0, `${countryCode} should define nativeOrder`);
    assert.ok(rules.englishOrder.length > 0, `${countryCode} should define englishOrder`);
  }

  assert.deepEqual(loadRules('IN').englishOrder, [
    'name',
    'street',
    'locality',
    'townOrDistrict',
    'city',
    'state',
    'postcode',
    'country',
  ]);
  assert.deepEqual(loadRules('LK').languages, [
    { code: 'si', name: 'Sinhala' },
    { code: 'ta', name: 'Tamil' },
    { code: 'en', name: 'English' },
  ]);
  assert.equal(loadRules('BD').postalCode?.label, '4 digits required');
  assert.deepEqual(loadRules('MV').regionalHierarchy, ['islandOrAtoll']);
  assert.deepEqual(loadRules('AF').languages, [
    { code: 'ps', name: 'Pashto' },
    { code: 'fa-AF', name: 'Dari' },
    { code: 'en', name: 'English' },
  ]);
});

test('South Asia address metadata exposes national mapping, postal, and OSM/HOT sources', () => {
  const expectedSourceIdsByCountry = {
    IN: ['survey-of-india', 'datameet-maps', 'osm-india', 'hot-osm-south-asia'],
    PK: ['survey-of-pakistan', 'pak-nsdi', 'pbs-gis-pakistan', 'osm-pakistan'],
    BD: ['survey-bangladesh', 'osm-bangladesh', 'hot-osm-bangladesh'],
    NP: ['national-geoportal-nepal', 'survey-department-nepal', 'osm-nepal', 'hot-osm-nepal'],
    LK: ['survey-department-sri-lanka', 'data-gov-lk', 'osm-sri-lanka'],
    BT: ['nlcs-bhutan', 'bhutan-geoportal', 'osm-bhutan'],
    MV: ['mlsa-maldives', 'onemap-maldives', 'osm-maldives'],
    AF: ['afghan-postal-code-system', 'hot-osm-afghanistan', 'osm-afghanistan'],
  } as const;

  for (const [countryCode, sourceIds] of Object.entries(expectedSourceIdsByCountry)) {
    const format = loadFormat(countryCode);
    const rules = loadRules(countryCode);

    for (const sourceId of sourceIds) {
      assert.ok(format.openSourceIds?.includes(sourceId), `${countryCode} should expose ${sourceId}`);
      assert.ok(rules.openSourceIds?.includes(sourceId), `${countryCode} addressRules should expose ${sourceId}`);

      const source = ASIA_OPEN_GEO_SOURCES[sourceId as keyof typeof ASIA_OPEN_GEO_SOURCES];
      assert.ok(source, `${sourceId} should be registered as an Asia open geo source`);
      assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
    }
  }
});

test('West Asia address JSON files expose table-derived addressRules metadata', () => {
  const expectedCountries = ['TR', 'IR', 'IQ', 'SY', 'LB', 'JO', 'IL', 'PS', 'SA', 'AE', 'QA', 'BH', 'KW', 'OM', 'YE'];
  for (const countryCode of expectedCountries) {
    const rules = loadRules(countryCode);
    assert.ok(rules.languages.length > 0, `${countryCode} should define languages`);
    assert.ok(rules.nativeOrder.length > 0, `${countryCode} should define nativeOrder`);
    assert.ok(rules.englishOrder.length > 0, `${countryCode} should define englishOrder`);
  }

  assert.deepEqual(loadRules('TR').englishOrder, [
    'postcode',
    'province',
    'district',
    'neighborhood',
    'street',
    'houseNumber',
    'name',
  ]);
  assert.deepEqual(loadRules('IL').languages, [
    { code: 'he', name: 'Hebrew' },
    { code: 'ar', name: 'Arabic' },
    { code: 'en', name: 'English' },
  ]);
  assert.equal(loadRules('IR').postalCode?.label, '10 digits required');
  assert.equal(loadRules('AE').postalCode, null);
  assert.equal(loadRules('OM').postalCode?.label, '3 digits required');
});

test('West Asia address metadata exposes national postal, geospatial, and OSM sources', () => {
  const expectedSourceIdsByCountry = {
    TR: ['turkiye-ptt', 'osm-turkey'],
    IR: ['gavahi-post-ir', 'iran-nsdi', 'iran-open-data', 'osm-iran'],
    IQ: ['iraq-post', 'osm-iraq'],
    SY: ['syria-post', 'osm-syria', 'hot-osm-west-asia'],
    LB: ['libanpost', 'osm-lebanon'],
    JO: ['jordanpost', 'rjgc-jordan', 'osm-jordan'],
    IL: ['israel-post', 'govmap-israel', 'data-gov-il', 'osm-israel'],
    PS: ['palestine-open-data-postcodes', 'palestine-post', 'osm-palestine'],
    SA: ['spl-sa', 'spl-national-address-api', 'saudi-gis-national-platform', 'osm-saudi-arabia'],
    AE: ['makani-dubai-open-data', 'osm-uae'],
    QA: ['qatar-gis-geoportal', 'osm-qatar'],
    BH: ['bahrain-open-data', 'osm-bahrain'],
    KW: ['kuwait-post', 'osm-kuwait'],
    OM: ['nsgia-oman', 'oman-post', 'osm-oman'],
    YE: ['yemen-post', 'osm-yemen', 'hot-osm-west-asia'],
  } as const;

  for (const [countryCode, sourceIds] of Object.entries(expectedSourceIdsByCountry)) {
    const format = loadFormat(countryCode);
    const rules = loadRules(countryCode);

    for (const sourceId of sourceIds) {
      assert.ok(format.openSourceIds?.includes(sourceId), `${countryCode} should expose ${sourceId}`);
      assert.ok(rules.openSourceIds?.includes(sourceId), `${countryCode} addressRules should expose ${sourceId}`);

      const source = ASIA_OPEN_GEO_SOURCES[sourceId as keyof typeof ASIA_OPEN_GEO_SOURCES];
      assert.ok(source, `${sourceId} should be registered as an Asia open geo source`);
      assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
    }
  }
});

test('Central Asia address JSON files expose table-derived addressRules metadata', () => {
  const expectedCountries = ['KZ', 'UZ', 'TM', 'KG', 'TJ'];
  for (const countryCode of expectedCountries) {
    const rules = loadRules(countryCode);
    assert.ok(rules.languages.length > 0, `${countryCode} should define languages`);
    assert.ok(rules.nativeOrder.length > 0, `${countryCode} should define nativeOrder`);
    assert.ok(rules.englishOrder.length > 0, `${countryCode} should define englishOrder`);
  }

  assert.deepEqual(loadRules('KZ').languages, [
    { code: 'kk', name: 'Kazakh' },
    { code: 'ru', name: 'Russian' },
  ]);
  assert.deepEqual(loadRules('UZ').regionalHierarchy, ['viloyat']);
  assert.deepEqual(loadRules('KZ').russianOrder, ['recipient', 'streetOrQuarter', 'houseOrBuilding', 'city', 'oblast', 'postcode']);
  assert.deepEqual(loadRules('TM').regionalHierarchy, ['welayat']);
  assert.deepEqual(loadRules('KG').regionalHierarchy, ['oblast']);
  assert.deepEqual(loadRules('TJ').regionalHierarchy, ['viloyat']);
  assert.equal(loadRules('KZ').postalCode?.label, '6 digits required');
});

test('Central Asia address metadata exposes national geoportals, postal, and OSM reference sources', () => {
  const expectedSourceIdsByCountry = {
    KZ: ['kazakhstan-nsdi', 'qazpost-open-api', 'osm-kazakhstan'],
    UZ: ['uzbekistan-open-data-geo', 'uzbekistan-state-urban-cadastre', 'osm-uzbekistan'],
    KG: ['nsdi-kyrgyzstan', 'data-gov-kg', 'caiag-geonode-kg', 'osm-kyrgyzstan'],
    TJ: ['tajik-post', 'osm-tajikistan', 'openaerialmap-tajikistan', 'hot-osm-central-asia'],
    TM: ['turkmenpost', 'osm-turkmenistan', 'hot-osm-central-asia'],
  } as const;

  for (const [countryCode, sourceIds] of Object.entries(expectedSourceIdsByCountry)) {
    const format = loadFormat(countryCode);
    const rules = loadRules(countryCode);

    for (const sourceId of sourceIds) {
      assert.ok(format.openSourceIds?.includes(sourceId), `${countryCode} should expose ${sourceId}`);
      assert.ok(rules.openSourceIds?.includes(sourceId), `${countryCode} addressRules should expose ${sourceId}`);

      const source = ASIA_OPEN_GEO_SOURCES[sourceId as keyof typeof ASIA_OPEN_GEO_SOURCES];
      assert.ok(source, `${sourceId} should be registered as an Asia open geo source`);
      assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
    }
  }
});

test('Oceania address JSON files expose addressRules metadata including Australian and New Zealand territories', () => {
  const expectedCountries = [
    'AU', 'NZ', 'FJ', 'PG', 'WS', 'TO', 'VU', 'SB', 'FM', 'PW',
    'MH', 'KI', 'TV', 'NR',
    'NF', 'CX', 'CC', 'AQ',
    'CK', 'TK', 'NU', 'PN',
  ];
  for (const countryCode of expectedCountries) {
    const rules = loadRules(countryCode);
    assert.ok(rules.languages.length > 0, `${countryCode} should define languages`);
    assert.ok(rules.nativeOrder.length > 0, `${countryCode} should define nativeOrder`);
    assert.ok(rules.englishOrder.length > 0, `${countryCode} should define englishOrder`);
  }

  assert.deepEqual(loadRules('AU').englishOrder, ['recipient', 'street', 'suburb', 'state', 'postcode', 'country']);
  assert.deepEqual(loadRules('NZ').regionalHierarchy, ['cityOrRegion']);
  assert.equal(loadRules('PG').postalCode?.label, '3 digits used');
  assert.deepEqual(loadRules('FJ').languages, [
    { code: 'en', name: 'English' },
    { code: 'fj', name: 'Fijian' },
    { code: 'hi', name: 'Hindi' },
  ]);
  assert.deepEqual(loadRules('NF').regionalHierarchy, ['island']);
  assert.equal(loadRules('AQ').postalCode?.label, '7151 for Australian Antarctic Territory');
  assert.equal(loadRules('TK').postalCode?.label, 'TK postcode pattern used');
});

test('All Oceania country and territory JSON files expose postal API or open-source links', () => {
  for (const countryCode of OCEANIA_COUNTRY_AND_TERRITORY_CODES) {
    const format = loadFormat(countryCode);
    const rules = loadRules(countryCode);
    const openSourceIds = format.openSourceIds ?? [];

    for (const sourceId of ['osm-nominatim', 'osm-overpass', 'openaddresses', 'geonames-postal', 'geonames-gazetteer', 'geoboundaries', 'upu-addressing']) {
      assert.ok(openSourceIds.includes(sourceId), `${countryCode} should expose ${sourceId}`);
      assert.ok(rules.openSourceIds?.includes(sourceId), `${countryCode} rules should expose ${sourceId}`);
    }

    for (const sourceId of OCEANIA_NATURAL_OPEN_SOURCE_IDS) {
      assert.ok(openSourceIds.includes(sourceId), `${countryCode} should expose natural geography source ${sourceId}`);
      assert.ok(rules.openSourceIds?.includes(sourceId), `${countryCode} rules should expose ${sourceId}`);
    }

    if (rules.postalCode?.required) {
      assert.ok(
        format.postalCode?.api || format.postalCode?.source || openSourceIds.includes('zippopotam'),
        `${countryCode} should expose a postal API, source, or OSS postal-code lookup`,
      );
    }

    for (const sourceId of openSourceIds) {
      const source = OCEANIA_OPEN_GEO_SOURCES[sourceId as keyof typeof OCEANIA_OPEN_GEO_SOURCES];
      assert.ok(source, `${countryCode} should reference a registered Oceania source: ${sourceId}`);
      assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
    }
  }

  assert.ok(loadFormat('AU').openSourceIds?.includes('auspost-postcode'));
  assert.ok(loadFormat('NZ').openSourceIds?.includes('linz-nz-addresses'));
  assert.ok(loadFormat('NZ').openSourceIds?.includes('nz-post-postcode-network'));
  assert.ok(loadFormat('NZ').openSourceIds?.includes('linz-nz-building-outlines'));
  assert.ok(loadFormat('NZ').openSourceIds?.includes('stats-nz-geographic-boundaries'));
  assert.match(loadFormat('NZ').postalCode?.api ?? '', /^https:\/\/www\.nzpost\.co\.nz\//);
  assert.ok(loadFormat('AU').openSourceIds?.includes('digital-earth-australia-coastlines'));
  assert.ok(loadFormat('AU').openSourceIds?.includes('geoscience-australia-elvis'));
  assert.ok(loadFormat('NZ').openSourceIds?.includes('linz-elevation'));
  assert.ok(loadFormat('CK').openSourceIds?.includes('nz-post-territories'));
  assert.ok(loadFormat('NF').openSourceIds?.includes('auspost-territories'));
  assert.ok(loadFormat('PF').openSourceIds?.includes('la-poste-fr-overseas'));
});

test('Western Europe address JSON files expose addressRules metadata and open postal APIs', () => {
  const expectedCountries = ['FR', 'DE', 'NL', 'BE', 'CH', 'AT', 'GB', 'IE', 'LI'];
  for (const countryCode of expectedCountries) {
    const rules = loadRules(countryCode);
    assert.ok(rules.languages.length > 0, `${countryCode} should define languages`);
    assert.ok(rules.nativeOrder.length > 0, `${countryCode} should define nativeOrder`);
    assert.ok(rules.englishOrder.length > 0, `${countryCode} should define englishOrder`);
  }

  assert.deepEqual(loadRules('FR').englishOrder, ['name', 'street', 'houseNumber', 'postcode', 'city', 'country']);
  assert.deepEqual(loadRules('CH').languages, [
    { code: 'de', name: 'German' },
    { code: 'fr', name: 'French' },
    { code: 'it', name: 'Italian' },
    { code: 'rm', name: 'Romansh' },
  ]);
  assert.equal(loadRules('NL').postalCode?.label, '4 digits plus 2 letters required');
  assert.equal(loadRules('GB').postalCode?.label, 'UK outward/inward postcode required');
  assert.equal(loadFormat('FR').postalCode?.api, 'https://data.laposte.fr/data-fair/api/v1/datasets/laposte-hexasmal/');
  assert.equal(loadFormat('DE').postalCode?.api, 'https://www.postdirekt.de/plzserver/');
  assert.equal(loadFormat('GB').postalCode?.api, 'https://postcodes.io/');
  assert.equal(
    loadFormat('CH').postalCode?.api,
    'https://www.swisstopo.admin.ch/en/official-directory-of-towns-and-cities',
  );
  assert.equal(
    loadFormat('CH').postalCode?.source,
    'Swiss Post / swisstopo PLZO_CH / Official Building Addresses',
  );
  assert.ok(loadFormat('CH').openSourceIds?.includes('swisstopo-plzo-postal-localities'));
  assert.ok(loadFormat('CH').openSourceIds?.includes('swisstopo-building-address-directory'));
  assert.ok(loadFormat('CH').openSourceIds?.includes('swisstopo-swissbuildings3d'));
  assert.equal(loadFormat('CH').openSourceIds?.includes('openplzapi'), false);
});

test('French overseas address JSON files expose addressRules metadata', () => {
  const expectedCountries = ['GP', 'MQ', 'GF', 'RE', 'YT', 'PF', 'NC', 'WF', 'MF', 'BL', 'PM', 'TF', 'CP'];
  for (const countryCode of expectedCountries) {
    const rules = loadRules(countryCode);
    assert.ok(rules.languages.length > 0, `${countryCode} should define languages`);
    assert.ok(rules.nativeOrder.length > 0, `${countryCode} should define nativeOrder`);
    assert.ok(rules.englishOrder.length > 0, `${countryCode} should define englishOrder`);
  }

  assert.equal(loadRules('GP').postalCode?.label, '971xx overseas department postcode');
  assert.equal(loadRules('PF').postalCode?.label, '987xx overseas collectivity postcode');
  assert.equal(loadRules('TF').regionalHierarchy[0], 'baseOrStation');
  assert.equal(loadRules('CP').postalCode, null);
});

test('Nordic and Baltic address JSON files expose addressRules metadata and postal data sources', () => {
  const expectedCountries = ['SE', 'NO', 'DK', 'FI', 'LV', 'EE', 'LT', 'IS'];
  for (const countryCode of expectedCountries) {
    const rules = loadRules(countryCode);
    assert.ok(rules.languages.length > 0, `${countryCode} should define languages`);
    assert.ok(rules.nativeOrder.length > 0, `${countryCode} should define nativeOrder`);
    assert.ok(rules.englishOrder.length > 0, `${countryCode} should define englishOrder`);
  }

  assert.deepEqual(loadRules('SE').englishOrder, ['name', 'street', 'postcode', 'city', 'country']);
  assert.equal(loadRules('SE').postalCode?.label, '5 digits required');
  assert.equal(loadRules('NO').postalCode?.label, '4 digits required');
  assert.equal(loadRules('IS').postalCode?.label, '3 digits required');
  assert.equal(loadFormat('NO').postalCode?.api, 'https://data.norge.no/nb');
  assert.equal(loadFormat('DK').postalCode?.api, 'https://api.dataforsyningen.dk/postnumre');
  assert.equal(
    loadFormat('EE').postalCode?.api,
    'https://geoportaal.maaamet.ee/eng/spatial-data/address-data/postal-codes-p661.html',
  );
  assert.equal(loadFormat('EE').postalCode?.source, 'Omniva / AKS Postal Codes / ADS');
  assert.equal(loadFormat('DK').postalCode?.source, 'PostNord assignment with DAGI postcode geometry, DAR address identity, and GeoDanmark building linkage');
  assert.equal(loadFormat('FI').postalCode?.api, 'https://www.posti.fi/en/for-businesses/customer-support/postal-code-services');
  assert.equal(loadFormat('LV').postalCode?.api, 'https://pasts.lv/en/check-address');
  assert.equal(loadFormat('LV').postalCode?.source, 'Latvijas Pasts check address');
  assert.equal(loadFormat('LT').postalCode?.api, 'https://www.post.lt/pasto-kodu-ir-adresu-paieska');
  assert.equal(loadFormat('LT').postalCode?.source, 'Lietuvos paštas postal code and address search');
});

test('Nordic and Baltic metadata exposes national geospatial and open-data sources', () => {
  const expectedSourceIdsByCountry: Record<string, string[]> = {
    SE: ['lantmateriet-sweden', 'trafikverket-sweden', 'scb-sweden-geodata'],
    NO: ['kartverket-norway', 'geonorge-norway', 'brreg-address-register'],
    DK: [
      'postnord-dk-postcode-finder',
      'dagi-denmark-postcode-areas',
      'dataforsyningen-denmark',
      'danish-address-register-dar',
      'bbr-denmark-buildings',
      'geodanmark-buildings',
      'dagi-denmark-boundaries',
      'geodanmark',
    ],
    FI: ['posti-finland-postal-code-services', 'nls-finland', 'maanmittauslaitos-open-data', 'dvv-finland-address-data'],
    LV: ['lgia-latvia', 'vzd-latvia-address-register', 'data-gov-lv-geodata'],
    EE: [
      'omniva-estonia-postcodes',
      'estonia-aks-postal-codes',
      'estonia-aks-postal-areas',
      'estonia-aks-address-objects',
      'estonia-aks-building-shapes',
      'estonia-ehak-admin-boundaries',
    ],
    LT: ['geoportal-lt', 'registru-centras-address-register', 'open-data-lithuania'],
    IS: ['posturinn-iceland-postcodes', 'natt-is50v-postcode-boundaries', 'hms-iceland-address-register', 'natt-is50v-buildings', 'statistics-iceland-geography', 'island-is-open-data'],
  };

  for (const [countryCode, sourceIds] of Object.entries(expectedSourceIdsByCountry)) {
    const format = loadFormat(countryCode);
    const rules = loadRules(countryCode);

    for (const sourceId of sourceIds) {
      assert.ok(format.openSourceIds?.includes(sourceId), `${countryCode} should expose ${sourceId}`);
      assert.ok(rules.openSourceIds?.includes(sourceId), `${countryCode} addressRules should expose ${sourceId}`);

      const source = EUROPE_OPEN_GEO_SOURCES[sourceId as keyof typeof EUROPE_OPEN_GEO_SOURCES];
      assert.ok(source, `${sourceId} should be registered as a European open geo source`);
      assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
    }
  }
});

test('Southern Europe address JSON files expose addressRules metadata and postal data sources', () => {
  const expectedCountries = ['IT', 'ES', 'PT', 'GR', 'MT', 'SM', 'MC', 'VA', 'AD', 'CY'];
  for (const countryCode of expectedCountries) {
    const rules = loadRules(countryCode);
    assert.ok(rules.languages.length > 0, `${countryCode} should define languages`);
    assert.ok(rules.nativeOrder.length > 0, `${countryCode} should define nativeOrder`);
    assert.ok(rules.englishOrder.length > 0, `${countryCode} should define englishOrder`);
  }

  assert.deepEqual(loadRules('IT').englishOrder, ['name', 'street', 'houseNumber', 'postcode', 'city', 'country']);
  assert.equal(loadRules('PT').postalCode?.label, '4 digits plus 3 digits required');
  assert.deepEqual(loadRules('MT').languages, [
    { code: 'mt', name: 'Maltese' },
    { code: 'en', name: 'English' },
  ]);
  assert.match(loadRules('MC').postalCode?.label ?? '', /98000.*CEDEX.*allocation/i);
  assert.equal(loadRules('VA').postalCode?.label, '00120 Vatican City postcode');
  assert.deepEqual(loadRules('CY').languages, [
    { code: 'el', name: 'Greek' },
    { code: 'tr', name: 'Turkish' },
  ]);
  assert.equal(loadFormat('IT').postalCode?.api, 'https://www.poste.it/cap');
  assert.equal(loadFormat('GR').postalCode?.api, 'https://itemsearch.elta.gr/en-GB/');
  assert.equal(loadFormat('CY').postalCode?.api, 'https://postalcodes.info/');
  assert.equal(loadFormat('MT').postalCode?.api, 'https://www.maltapost.com/postcode/?l=1');
  assert.match(loadFormat('MT').postalCode?.source ?? '', /MaltaPost.*Address Registrar.*Planning Authority/i);
  assert.equal(loadFormat('MC').postalCode?.api, 'https://www.data.gouv.fr/datasets/base-officielle-des-codes-postaux');
  assert.match(loadFormat('MC').postalCode?.source ?? '', /La Poste.*DPUM.*IMSEE/i);
  assert.equal(loadFormat('CY').postalCode?.source, 'postalcodes.info / Cyprus open data');
});

test('Southern Europe metadata exposes national geospatial and cadastre sources', () => {
  const expectedSourceIdsByCountry: Record<string, string[]> = {
    IT: [
      'poste-italiane-cap-search',
      'poste-italiane-cap-professional',
      'anncsu-italy-addresses',
      'istat-italy-admin-boundaries',
      'italy-regional-dbgt-buildings',
      'agenzia-entrate-catasto',
      'geoportale-nazionale-italy',
    ],
    ES: ['ign-spain-cnig', 'catastro-spain', 'idee-spain'],
    PT: ['dgterritorio-portugal', 'snig-portugal', 'bupi-portugal'],
    GR: ['ktimatologio-greece', 'geodata-gov-gr', 'okxe-greece'],
    MT: [
      'maltapost-postcode-finder',
      'malta-office-address-registrar',
      'malta-oar-location-registers',
      'malta-pa-large-scale-topography-buildings',
      'pa-malta-geoserver',
      'nso-malta-geodata',
    ],
    SM: ['san-marino-geoportal', 'san-marino-statistics'],
    MC: [
      'la-poste-official-postal-codes-monaco',
      'la-poste-monaco-addressing',
      'monaco-dpum-address-base',
      'monaco-dpum-building-topography',
      'monaco-gouv-cartography',
      'monaco-imsee-geodata',
    ],
    VA: ['vatican-city-state', 'openstreetmap-vatican'],
    AD: ['andorra-cartografia', 'andorra-open-data'],
    CY: ['cyprus-department-lands-surveys', 'cyprus-open-data-portal', 'inspire-cyprus'],
  };

  for (const [countryCode, sourceIds] of Object.entries(expectedSourceIdsByCountry)) {
    const format = loadFormat(countryCode);
    const rules = loadRules(countryCode);

    for (const sourceId of sourceIds) {
      assert.ok(format.openSourceIds?.includes(sourceId), `${countryCode} should expose ${sourceId}`);
      assert.ok(rules.openSourceIds?.includes(sourceId), `${countryCode} addressRules should expose ${sourceId}`);

      const source = EUROPE_OPEN_GEO_SOURCES[sourceId as keyof typeof EUROPE_OPEN_GEO_SOURCES];
      assert.ok(source, `${sourceId} should be registered as a European open geo source`);
      assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
    }
  }
});

test('Eastern Europe address JSON files expose addressRules metadata and postal data sources', () => {
  const expectedCountries = ['RO', 'BG', 'UA', 'MD', 'BY', 'RU', 'RS', 'BA', 'ME', 'XK', 'AL', 'MK'];
  for (const countryCode of expectedCountries) {
    const rules = loadRules(countryCode);
    assert.ok(rules.languages.length > 0, `${countryCode} should define languages`);
    assert.ok(rules.nativeOrder.length > 0, `${countryCode} should define nativeOrder`);
    assert.ok(rules.englishOrder.length > 0, `${countryCode} should define englishOrder`);
  }

  assert.deepEqual(loadRules('RO').englishOrder, ['name', 'street', 'houseNumber', 'postcode', 'city', 'country']);
  assert.equal(loadRules('RO').postalCode?.label, '6 digits required');
  assert.equal(loadRules('AL').postalCode?.label, '4 digits required');
  assert.deepEqual(loadRules('BY').languages, [
    { code: 'be', name: 'Belarusian' },
    { code: 'ru', name: 'Russian' },
  ]);
  assert.deepEqual(loadRules('BA').languages, [
    { code: 'bs', name: 'Bosnian' },
    { code: 'hr', name: 'Croatian' },
    { code: 'sr', name: 'Serbian' },
  ]);
  assert.deepEqual(loadRules('XK').languages, [
    { code: 'sq', name: 'Albanian' },
    { code: 'sr', name: 'Serbian' },
  ]);
  assert.equal(loadFormat('RO').postalCode?.api, 'https://2015.index.okfn.org/place/romania/postcodes/');
  assert.equal(loadFormat('RU').postalCode?.api, 'https://datahub.io/logistics/postal-codes-ru');
  assert.equal(loadFormat('XK').postalCode?.api, 'https://www.spotzi.com/en/data-catalog?page=1&categories=Postal+Codes');
  assert.equal(loadFormat('MK').postalCode?.api, 'https://datahub.io/logistics/postal-codes-mk');
});

test('Central, Eastern, and Balkan Europe metadata exposes national geospatial sources', () => {
  const expectedSourceIdsByCountry: Record<string, string[]> = {
    PL: ['geoportal-gov-pl', 'gus-teryt-poland'],
    CZ: ['cuzk-ruian', 'cuzk-ruian-addresses', 'cuzk-ruian-vfr', 'cuzk-inspire-buildings', 'cuzk-ruian-boundaries', 'cuzk-geoportal'],
    SK: ['zbgis-slovakia', 'slovakia-address-register'],
    HU: ['lechner-hungary-geodata', 'hungary-public-road-data'],
    SI: ['eprostor-slovenia', 'gurs-slovenia'],
    HR: ['dgu-croatia-geoportal', 'croatia-cadastre'],
    RO: ['ancpi-romania-geoportal', 'romania-open-data'],
    BG: ['cadastre-bulgaria', 'bulgaria-inspire-geoportal'],
    UA: ['data-gov-ua-geodata', 'ukraine-cadastre-map'],
    MD: ['geoportal-moldova', 'moldova-open-data'],
    BY: ['belarus-nca-geoportal'],
    RU: ['rosreestr-nspd', 'russia-open-data-geo'],
    RS: ['geosrbija', 'rgz-serbia'],
    BA: ['bosnia-geoportal', 'bosnia-cadastre-reference'],
    ME: ['geoportal-montenegro', 'montenegro-cadastre'],
    XK: ['kosovo-geoportal', 'kosovo-cadastre'],
    AL: ['asig-albania', 'albania-geoportal'],
    MK: ['katastar-north-macedonia', 'makstat-geodata'],
  };

  for (const [countryCode, sourceIds] of Object.entries(expectedSourceIdsByCountry)) {
    const format = loadFormat(countryCode);
    const rules = loadRules(countryCode);

    for (const sourceId of sourceIds) {
      assert.ok(format.openSourceIds?.includes(sourceId), `${countryCode} should expose ${sourceId}`);
      assert.ok(rules.openSourceIds?.includes(sourceId), `${countryCode} addressRules should expose ${sourceId}`);

      const source = EUROPE_OPEN_GEO_SOURCES[sourceId as keyof typeof EUROPE_OPEN_GEO_SOURCES];
      assert.ok(source, `${sourceId} should be registered as a European open geo source`);
      assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
    }
  }
});

test('All European country, overseas territory, and autonomous-region JSON files expose postal API or open-source links', () => {
  for (const countryCode of EUROPE_COUNTRY_AND_TERRITORY_CODES) {
    const format = loadFormat(countryCode);
    const openSourceIds = format.openSourceIds ?? [];

    for (const sourceId of EUROPE_REQUIRED_OPEN_SOURCE_IDS) {
      assert.ok(openSourceIds.includes(sourceId), `${countryCode} should expose ${sourceId}`);
    }

    const requiresPostcode =
      format.addressRules?.postalCode?.required ??
      format.domestic?.en?.fields.some(field => field.key === 'postcode') ??
      format.english?.fields.some(field => field.key === 'postcode') ??
      format.native?.fields.some(field => field.key === 'postcode' && field.required);

    if (requiresPostcode) {
      assert.ok(
        format.postalCode?.api || format.postalCode?.source || openSourceIds.includes('zippopotam'),
        `${countryCode} should expose a postal API, source, or OSS postal-code lookup`,
      );
    }

    for (const sourceId of openSourceIds) {
      const source = EUROPE_OPEN_GEO_SOURCES[sourceId as keyof typeof EUROPE_OPEN_GEO_SOURCES];
      assert.ok(source, `${countryCode} should reference a registered European source: ${sourceId}`);
      assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
    }
  }

  assert.ok(loadFormat('FR').openSourceIds?.includes('data-gouv-fr-postcodes'));
  assert.ok(loadFormat('FR').openSourceIds?.includes('ban-fr'));
  assert.ok(loadFormat('FR').openSourceIds?.includes('ign-bd-topo'));
  assert.ok(loadFormat('FR').openSourceIds?.includes('insee-cog'));
  assert.ok(loadFormat('DE').openSourceIds?.includes('deutsche-post-plz-server'));
  assert.ok(loadFormat('DE').openSourceIds?.includes('deutsche-post-datafactory'));
  assert.ok(loadFormat('DE').openSourceIds?.includes('bkg-postleitzahlgebiete'));
  assert.ok(loadFormat('DE').openSourceIds?.includes('bkg-georeferenced-addresses'));
  assert.ok(loadFormat('DE').openSourceIds?.includes('adv-hu-de'));
  assert.ok(loadFormat('DE').openSourceIds?.includes('bkg-vg25'));
  assert.equal(loadFormat('DE').openSourceIds?.includes('openplzapi'), false);
  assert.ok(loadFormat('GB').openSourceIds?.includes('postcodes-io'));
  assert.ok(loadFormat('CZ').openSourceIds?.includes('ceska-posta-psc'));
  assert.ok(loadFormat('CZ').openSourceIds?.includes('ceska-posta-customer-outputs'));
  assert.ok(loadFormat('CZ').openSourceIds?.includes('cuzk-ruian-addresses'));
  assert.ok(loadFormat('CZ').openSourceIds?.includes('cuzk-ruian-vfr'));
  assert.ok(loadFormat('CZ').openSourceIds?.includes('cuzk-inspire-buildings'));
  assert.ok(loadFormat('CZ').openSourceIds?.includes('cuzk-ruian-boundaries'));
  assert.ok(loadFormat('GG').openSourceIds?.includes('guernsey-post'));
  assert.ok(loadFormat('GL').openSourceIds?.includes('postnord-greenland'));
});

test('NL, DK, NO, ES, and PT overseas or autonomous address JSON files expose addressRules metadata', () => {
  const expectedCountries = ['BQ', 'AW', 'CW', 'SX', 'GL', 'FO', 'SJ_SVA', 'SJ_JAN', 'ES_BAL', 'ES_CAN', 'PT_AZO', 'PT_MAD'];
  for (const countryCode of expectedCountries) {
    const rules = loadRules(countryCode);
    assert.ok(rules.languages.length > 0, `${countryCode} should define languages`);
    assert.ok(rules.nativeOrder.length > 0, `${countryCode} should define nativeOrder`);
    assert.ok(rules.englishOrder.length > 0, `${countryCode} should define englishOrder`);
  }

  assert.deepEqual(loadRules('BQ').languages, [
    { code: 'nl', name: 'Dutch' },
    { code: 'en', name: 'English' },
  ]);
  assert.equal(loadRules('BQ').postalCode?.label, 'Bonaire 7000-7999, Sint Eustatius 8000-8999, Saba 9000-9999');
  assert.deepEqual(loadRules('AW').languages, [
    { code: 'nl', name: 'Dutch' },
    { code: 'en', name: 'English' },
  ]);
  assert.equal(loadRules('AW').postalCode?.label, 'No national postcode; A1A-style carrier/local code may be used');
  assert.deepEqual(loadRules('GL').languages, [
    { code: 'kl', name: 'Greenlandic' },
    { code: 'da', name: 'Danish' },
  ]);
  assert.equal(loadRules('GL').postalCode?.label, 'GL-9999 or 4 digits used');
  assert.equal(loadRules('FO').postalCode?.label, 'FO-### or 3 digits used');
  assert.equal(loadRules('SJ_SVA').postalCode?.label, '9170-9179 Svalbard postcode');
  assert.equal(loadRules('SJ_JAN').postalCode?.label, 'JM-### Jan Mayen station code');
  assert.deepEqual(loadRules('ES_BAL').languages, [
    { code: 'es', name: 'Spanish' },
    { code: 'ca', name: 'Catalan' },
  ]);
  assert.equal(loadRules('ES_BAL').postalCode?.label, '07xxx Balearic Islands postcode');
  assert.equal(loadRules('ES_CAN').postalCode?.label, '35xxx or 38xxx Canary Islands postcode');
  assert.equal(loadRules('PT_AZO').postalCode?.label, '9xxx-xxx Azores postcode');
  assert.equal(loadRules('PT_MAD').postalCode?.label, '9xxx-xxx Madeira postcode');
});

test('Caucasus address JSON files expose addressRules metadata and postal data sources', () => {
  const expectedCountries = ['AM', 'AZ', 'GE'];
  for (const countryCode of expectedCountries) {
    const rules = loadRules(countryCode);
    assert.ok(rules.languages.length > 0, `${countryCode} should define languages`);
    assert.ok(rules.nativeOrder.length > 0, `${countryCode} should define nativeOrder`);
    assert.ok(rules.englishOrder.length > 0, `${countryCode} should define englishOrder`);
  }

  assert.deepEqual(loadRules('AM').languages, [{ code: 'hy', name: 'Armenian' }]);
  assert.deepEqual(loadRules('AZ').languages, [{ code: 'az', name: 'Azerbaijani' }]);
  assert.deepEqual(loadRules('GE').languages, [{ code: 'ka', name: 'Georgian' }]);
  assert.deepEqual(loadRules('AM').englishOrder, ['name', 'street', 'houseNumber', 'postcode', 'city', 'region', 'country']);
  assert.equal(loadRules('AM').postalCode?.label, '4 digits required');
  assert.equal(loadRules('AZ').postalCode?.label, '4 digits required');
  assert.equal(loadRules('GE').postalCode?.label, '4 digits required');
  assert.equal(loadFormat('AM').postalCode?.api, 'https://www.haypost.am/en/find-index');
  assert.equal(loadFormat('AZ').postalCode?.api, 'https://www.geonames.org/countries/AZ/azerbaijan.html');
  assert.equal(loadFormat('GE').postalCode?.api, 'https://www.gpost.ge/');
});

test('Caucasus metadata exposes national geospatial, cadastre, and open-data sources', () => {
  const expectedSourceIdsByCountry: Record<string, string[]> = {
    AM: ['armstat-geodata', 'cadastre-armenia', 'haypost-address-reference', 'geonames-armenia'],
    AZ: ['azerbaijan-state-committee-property', 'azerbaijan-open-data', 'azerpost-address-reference', 'geonames-azerbaijan'],
    GE: ['napr-georgia', 'gdi-georgia', 'gpost-address-reference', 'geonames-georgia'],
  };

  for (const [countryCode, sourceIds] of Object.entries(expectedSourceIdsByCountry)) {
    const format = loadFormat(countryCode);
    const rules = loadRules(countryCode);

    for (const sourceId of sourceIds) {
      assert.ok(format.openSourceIds?.includes(sourceId), `${countryCode} should expose ${sourceId}`);
      assert.ok(rules.openSourceIds?.includes(sourceId), `${countryCode} addressRules should expose ${sourceId}`);

      const source = ASIA_OPEN_GEO_SOURCES[sourceId as keyof typeof ASIA_OPEN_GEO_SOURCES];
      assert.ok(source, `${sourceId} should be registered as an Asian open geo source`);
      assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
    }
  }
});

test('All Asian country JSON files expose reusable postal API and open geodata source links', () => {
  for (const countryCode of ASIA_COUNTRY_CODES) {
    const format = loadFormat(countryCode);
    const rules = loadRules(countryCode);
    const topLevelOpenSourceIds = format.openSourceIds ?? [];
    const ruleOpenSourceIds = rules.openSourceIds ?? [];

    assert.ok(topLevelOpenSourceIds.includes('osm-nominatim'), `${countryCode} should expose OSM/Nominatim`);
    assert.ok(topLevelOpenSourceIds.includes('osm-overpass'), `${countryCode} should expose OSM Overpass`);
    assert.ok(topLevelOpenSourceIds.includes('openaddresses'), `${countryCode} should expose OpenAddresses`);
    assert.ok(topLevelOpenSourceIds.includes('geonames-postal'), `${countryCode} should expose GeoNames postal data`);
    assert.ok(topLevelOpenSourceIds.includes('geonames-gazetteer'), `${countryCode} should expose GeoNames gazetteer`);
    assert.ok(topLevelOpenSourceIds.includes('geoboundaries'), `${countryCode} should expose geoBoundaries`);
    assert.ok(topLevelOpenSourceIds.includes('upu-addressing'), `${countryCode} should expose UPU addressing references`);
    assert.ok(ruleOpenSourceIds.includes('osm-nominatim'), `${countryCode} addressRules should expose OSM/Nominatim`);
    assert.ok(ruleOpenSourceIds.includes('geonames-postal'), `${countryCode} addressRules should expose GeoNames postal data`);

    for (const sourceId of ASIA_NATURAL_OPEN_SOURCE_IDS) {
      assert.ok(topLevelOpenSourceIds.includes(sourceId), `${countryCode} should expose natural geography source ${sourceId}`);
      assert.ok(ruleOpenSourceIds.includes(sourceId), `${countryCode} addressRules should expose ${sourceId}`);
    }

    for (const sourceId of topLevelOpenSourceIds) {
      const source = ASIA_OPEN_GEO_SOURCES[sourceId as keyof typeof ASIA_OPEN_GEO_SOURCES];
      assert.ok(source, `${countryCode} should reference a registered Asian source: ${sourceId}`);
      assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
    }

    if (rules.postalCode?.required) {
      assert.ok(format.postalCode?.api, `${countryCode} should expose a postal API or OSS lookup URL`);
    }
  }

  assert.ok(loadFormat('JP').openSourceIds?.includes('zipcloud-jp'));
  assert.ok(loadFormat('IN').openSourceIds?.includes('postalpincode-in'));
  assert.ok(loadFormat('IN').openSourceIds?.includes('data-gov-in-pincode'));
  assert.ok(loadFormat('IN').openSourceIds?.includes('india-digipin'));
  assert.ok(loadFormat('IN').openSourceIds?.includes('india-pincode-api-oss'));
  assert.ok(loadFormat('SG').openSourceIds?.includes('onemap-sg'));
  assert.ok(loadFormat('KZ').openSourceIds?.includes('datahub-postal-kz'));
});

test('North Africa address JSON files expose addressRules metadata and postal data sources', () => {
  const expectedCountries = ['EG', 'DZ', 'MA', 'TN', 'LY', 'SD', 'MR', 'EH'];
  for (const countryCode of expectedCountries) {
    const rules = loadRules(countryCode);
    assert.ok(rules.languages.length > 0, `${countryCode} should define languages`);
    assert.ok(rules.nativeOrder.length > 0, `${countryCode} should define nativeOrder`);
    assert.ok(rules.englishOrder.length > 0, `${countryCode} should define englishOrder`);
  }

  assert.deepEqual(loadRules('EG').englishOrder, ['name', 'street', 'houseNumber', 'postcode', 'city', 'governorate', 'country']);
  assert.deepEqual(loadRules('DZ').languages, [
    { code: 'ar', name: 'Arabic' },
    { code: 'fr', name: 'French' },
  ]);
  assert.deepEqual(loadRules('TN').languages, [
    { code: 'ar', name: 'Arabic' },
    { code: 'fr', name: 'French' },
  ]);
  assert.equal(loadRules('TN').postalCode?.label, '4 digits required');
  assert.equal(loadRules('MR').postalCode?.label, '5 digits used');
  assert.equal(loadFormat('EG').postalCode?.api, 'https://github.com/Badawy403/Egy.List');
  assert.equal(loadFormat('EG').postalCode?.source, 'Badawy403/Egy.List / DataHub postal-codes-eg');
  assert.equal(loadFormat('DZ').postalCode?.api, 'https://www.poste.dz/customer/bureaux_postaux');
  assert.equal(loadFormat('LY').postalCode?.api, 'https://libyapost.ly/en/services/');
  assert.equal(loadFormat('MA').postalCode?.api, 'https://codepostal.ma/default.aspx');
  assert.equal(loadFormat('MR').postalCode?.api, 'https://www.mauripost.mr/');
  assert.equal(loadFormat('SD').postalCode?.api, 'https://sudapost.sd/wp/');
  assert.equal(loadFormat('TN').postalCode?.api, 'https://www.laposte.tn/codes.php');
});

test('West Africa address JSON files expose addressRules metadata', () => {
  const expectedCountries = ['NG', 'GH', 'CI', 'SN', 'BF', 'ML', 'NE', 'TG', 'BJ', 'LR', 'SL', 'GM', 'GN', 'GW', 'CV'];
  for (const countryCode of expectedCountries) {
    const rules = loadRules(countryCode);
    assert.ok(rules.languages.length > 0, `${countryCode} should define languages`);
    assert.ok(rules.nativeOrder.length > 0, `${countryCode} should define nativeOrder`);
    assert.ok(rules.englishOrder.length > 0, `${countryCode} should define englishOrder`);
  }

  assert.deepEqual(loadRules('NG').englishOrder, ['houseNumber', 'street', 'city', 'state', 'country']);
  assert.deepEqual(loadRules('CI').languages, [{ code: 'fr', name: 'French' }]);
  assert.deepEqual(loadRules('GW').languages, [{ code: 'pt', name: 'Portuguese' }]);
  assert.deepEqual(Object.fromEntries(expectedCountries.map(countryCode => [
    countryCode,
    loadRules(countryCode).deliveryLanguages?.map(language => language.code),
  ])), {
    NG: ['en'],
    GH: ['en'],
    CI: ['fr'],
    SN: ['fr'],
    BF: ['fr'],
    ML: ['fr'],
    NE: ['fr'],
    TG: ['fr'],
    BJ: ['fr'],
    LR: ['en'],
    SL: ['en'],
    GM: ['en'],
    GN: ['fr'],
    GW: ['pt'],
    CV: ['pt'],
  });
  assert.equal(loadRules('NG').postalCode?.label, '6 digits required');
  assert.equal(loadRules('GM').postalCode?.label, '3 digits used');
  assert.equal(loadRules('CI').postalCode?.label, '5 digits used');
  assert.equal(loadFormat('GH').postalCode?.api, 'https://www.ghanapostgps.com/');
  assert.equal(loadFormat('BJ').postalCode?.api, 'https://laposte.bj/nos-agences/');
  assert.equal(loadFormat('BF').postalCode?.api, 'https://codespostaux.laposte.bf/');
  assert.equal(loadFormat('GM').postalCode?.api, 'https://gambiapost.gm/');
  assert.equal(loadFormat('CI').postalCode?.api, 'https://www.laposte.ci/');
  assert.equal(loadFormat('CV').postalCode?.api, 'https://correios.cv/faq');
  assert.equal(loadFormat('GN').postalCode?.api, 'https://www.laposte.gn/');
  assert.equal(loadFormat('LR').postalCode?.source, 'Liberia Ministry of Posts and Telecommunications official postal service information');
  assert.equal(loadFormat('ML').postalCode?.api, 'https://laposte.ml/');
  assert.equal(loadFormat('NE').postalCode?.api, 'https://nigerposte.ne/');
  assert.equal(loadFormat('NG').postalCode?.api, 'https://nipost.gov.ng/postcode-finder/');
  assert.ok(loadFormat('LR').openSourceIds?.includes('mopt-liberia-postal-services'));
  assert.ok(loadRules('LR').openSourceIds?.includes('mopt-liberia-postal-services'));
  assert.equal(loadFormat('SL').postalCode?.api, 'https://salpost.gov.sl/');
  assert.equal(loadFormat('SN').postalCode?.api, 'https://www.laposte.sn/code-postal-senegal/');
  assert.equal(loadFormat('TG').postalCode?.api, 'https://www.laposte.tg/bureaux-poste');
  assert.equal(loadFormat('KM').postalCode?.api, 'https://www.snpsf.com/poste');
  assert.equal(loadFormat('ET').postalCode?.api, 'https://ethio.post/branches/');
  assert.equal(loadFormat('MW').postalCode?.api, 'https://macra.mw/post-codes/');
  assert.equal(loadFormat('MZ').postalCode?.api, 'https://www.correios.co.mz/?cod=11&pagina=codigo');
  assert.equal(loadFormat('NA').postalCode?.api, 'https://www.nampost.com.na/postal/postal-codes');
  assert.equal(loadFormat('SC').postalCode?.api, 'https://www.seychelles-post.com/poboxdirectory.php');
  assert.equal(loadFormat('UG').postalCode?.api, 'https://ugapost.co.ug/our-services/physical-address/');
  assert.equal(loadFormat('ZW').postalCode?.api, 'https://www.zimpost.co.zw/');
  assert.deepEqual(loadRules('ML').regionalHierarchy, ['region', 'circle']);
  assert.deepEqual(loadRules('CV').regionalHierarchy, ['island', 'municipality', 'parish']);
});

test('East Africa address JSON files expose addressRules metadata and English delivery languages', () => {
  const expectedCountries = ['KM', 'DJ', 'ER', 'ET', 'KE', 'MG', 'MW', 'MU', 'MZ', 'RW', 'SC', 'SO', 'SS', 'TZ', 'UG', 'ZM'];
  for (const countryCode of expectedCountries) {
    const rules = loadRules(countryCode);
    assert.ok(rules.languages.length > 0, `${countryCode} should define languages`);
    assert.ok(rules.nativeOrder.length > 0, `${countryCode} should define nativeOrder`);
    assert.ok(rules.englishOrder.length > 0, `${countryCode} should define englishOrder`);
  }

  assert.deepEqual(loadRules('KM').languages, [
    { code: 'fr', name: 'French' },
    { code: 'ar', name: 'Arabic' },
  ]);
  assert.deepEqual(loadRules('ET').languages, [
    { code: 'en', name: 'English' },
    { code: 'am', name: 'Amharic' },
  ]);
  assert.deepEqual(loadRules('KE').languages, [
    { code: 'en', name: 'English' },
    { code: 'sw', name: 'Swahili' },
  ]);
  assert.deepEqual(loadRules('SO').languages, [
    { code: 'so', name: 'Somali' },
    { code: 'ar', name: 'Arabic' },
    { code: 'en', name: 'English' },
  ]);
  assert.equal(loadRules('SO').postalCode?.label, 'Somalia alpha-2 plus 3 digits used');
  assert.equal(loadRules('KE').postalCode?.label, '5 digits required');
  assert.deepEqual(loadRules('RW').regionalHierarchy, ['province', 'district']);
  assert.deepEqual(loadRules('SC').regionalHierarchy, ['island', 'district']);
});

test('Southern Africa and Indian Ocean address JSON files expose delivery languages', () => {
  const expectedCountries = ['ZA', 'NA', 'BW', 'ZW', 'MZ', 'MW', 'ZM', 'LS', 'SZ', 'AO', 'MU', 'KM', 'SC'];
  for (const countryCode of expectedCountries) {
    const rules = loadRules(countryCode);
    assert.ok(rules.languages.length > 0, `${countryCode} should define languages`);
    assert.ok(rules.nativeOrder.length > 0, `${countryCode} should define nativeOrder`);
    assert.ok(rules.englishOrder.length > 0, `${countryCode} should define englishOrder`);
  }

  assert.deepEqual(Object.fromEntries(expectedCountries.map(countryCode => [
    countryCode,
    loadRules(countryCode).deliveryLanguages?.map(language => language.code),
  ])), {
    ZA: ['en'],
    NA: ['en'],
    BW: ['en'],
    ZW: ['en'],
    MZ: ['pt'],
    MW: ['en'],
    ZM: ['en'],
    LS: ['en', 'st'],
    SZ: ['en', 'ss'],
    AO: ['pt'],
    MU: ['en', 'fr'],
    KM: ['fr', 'ar'],
    SC: ['en', 'fr', 'crs'],
  });
  assert.deepEqual(loadRules('LS').languages, [
    { code: 'en', name: 'English' },
    { code: 'st', name: 'Sesotho' },
  ]);
  assert.deepEqual(loadRules('SZ').languages, [
    { code: 'en', name: 'English' },
    { code: 'ss', name: 'siSwati' },
  ]);
  assert.deepEqual(loadRules('SC').languages, [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'crs', name: 'Seychellois Creole' },
  ]);
});

test('African address JSON files link to reusable open geodata and postal sources', () => {
  for (const countryCode of ['EG', 'MA', 'NG', 'GH', 'KE', 'TZ', 'ZA', 'AO', 'KM', 'SC']) {
    const openSourceIds = loadRules(countryCode).openSourceIds ?? [];

    assert.ok(openSourceIds.includes('osm-nominatim'), `${countryCode} should link OSM/Nominatim`);
    assert.ok(openSourceIds.includes('openaddresses'), `${countryCode} should link OpenAddresses`);
    assert.ok(openSourceIds.includes('geonames-postal'), `${countryCode} should link GeoNames postal data`);
    assert.ok(openSourceIds.includes('geonames-gazetteer'), `${countryCode} should link GeoNames gazetteer`);
    assert.ok(openSourceIds.includes('geoboundaries'), `${countryCode} should link geoBoundaries`);
    assert.ok(openSourceIds.includes('upu-addressing'), `${countryCode} should link UPU addressing references`);
  }

  assert.ok(loadRules('EG').openSourceIds?.includes('egy-list'));
  assert.ok(loadRules('MA').openSourceIds?.includes('datahub-postal'));
});

test('All African country JSON files expose top-level open geodata source links', () => {
  for (const countryCode of AFRICA_COUNTRY_CODES) {
    const openSourceIds = loadFormat(countryCode).openSourceIds ?? [];

    assert.ok(openSourceIds.includes('osm-nominatim'), `${countryCode} should expose OSM/Nominatim`);
    assert.ok(openSourceIds.includes('openaddresses'), `${countryCode} should expose OpenAddresses`);
    assert.ok(openSourceIds.includes('geonames-postal'), `${countryCode} should expose GeoNames postal data`);
    assert.ok(openSourceIds.includes('geoboundaries'), `${countryCode} should expose geoBoundaries`);
    assert.ok(openSourceIds.includes('upu-addressing'), `${countryCode} should expose UPU addressing references`);
    assert.ok(openSourceIds.includes('hot-osm-africa'), `${countryCode} should expose HOT OSM Africa`);
    assert.ok(openSourceIds.includes('humdata-africa'), `${countryCode} should expose HDX Africa datasets`);
    assert.ok(openSourceIds.includes('openaerialmap'), `${countryCode} should expose OpenAerialMap`);
    for (const sourceId of AFRICA_NATURAL_OPEN_SOURCE_IDS) {
      assert.ok(openSourceIds.includes(sourceId), `${countryCode} should expose natural geography source ${sourceId}`);
    }
  }
});

test('All African country JSON files expose registered postal API or open-source links', () => {
  for (const countryCode of AFRICA_COUNTRY_CODES) {
    const format = loadFormat(countryCode);
    const openSourceIds = format.openSourceIds ?? [];
    const ruleOpenSourceIds = format.addressRules?.openSourceIds ?? [];

    for (const sourceId of ['osm-nominatim', 'osm-overpass', 'openaddresses', 'geonames-postal', 'geonames-gazetteer', 'geoboundaries', 'upu-addressing', 'hot-osm-africa', 'humdata-africa', 'openaerialmap', ...AFRICA_NATURAL_OPEN_SOURCE_IDS]) {
      assert.ok(openSourceIds.includes(sourceId), `${countryCode} should expose ${sourceId}`);
      assert.ok(ruleOpenSourceIds.includes(sourceId), `${countryCode} rules should expose ${sourceId}`);
    }

    for (const sourceId of openSourceIds) {
      const source = AFRICA_OPEN_GEO_SOURCES[sourceId as keyof typeof AFRICA_OPEN_GEO_SOURCES];
      assert.ok(source, `${countryCode} should reference a registered African source: ${sourceId}`);
      assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
    }

    if (format.addressRules?.postalCode?.required) {
      assert.ok(
        format.postalCode?.api || format.postalCode?.source || openSourceIds.includes('geonames-postal'),
        `${countryCode} should expose a postal API, source, or OSS postal-code lookup`,
      );
    }
  }

  assert.ok(loadFormat('EG').openSourceIds?.includes('egy-list'));
  assert.ok(loadFormat('MA').openSourceIds?.includes('datahub-postal'));
  assert.ok(loadFormat('ZA').openSourceIds?.includes('geonames-postal'));
  assert.ok(loadFormat('ZA').openSourceIds?.includes('sapo-postcodes'));
  assert.ok(loadFormat('ZA').openSourceIds?.includes('postafind-za'));
  assert.ok(loadFormat('ZA').openSourceIds?.includes('ngi-south-africa'));
  assert.ok(loadFormat('GH').openSourceIds?.includes('ghanapostgps'));
  assert.ok(loadFormat('DJ').openSourceIds?.includes('mcpt-djibouti-poste'));
  assert.ok(loadFormat('KE').openSourceIds?.includes('posta-kenya'));
  assert.ok(loadFormat('KM').openSourceIds?.includes('snpsf-comores-poste'));
  assert.ok(loadFormat('KE').openSourceIds?.includes('geonames-postal'));
  assert.ok(loadFormat('KE').openSourceIds?.includes('rcmrd-geoportal'));
  assert.ok(loadFormat('NG').openSourceIds?.includes('nipost-postcode'));
  assert.ok(loadFormat('ET').openSourceIds?.includes('ethiopost-branches'));
  assert.ok(loadFormat('MW').openSourceIds?.includes('malawi-postcodes-macra'));
  assert.ok(loadFormat('MZ').openSourceIds?.includes('correios-mocambique-codigos-postais'));
  assert.ok(loadFormat('NA').openSourceIds?.includes('nampost-postal-codes'));
  assert.ok(loadFormat('SC').openSourceIds?.includes('seychelles-post-po-box-directory'));
  assert.ok(loadFormat('SO').openSourceIds?.includes('somalia-moct-posta'));
  assert.ok(loadFormat('SS').openSourceIds?.includes('south-sudan-nca-postal-sector'));
  assert.ok(loadFormat('UG').openSourceIds?.includes('posta-uganda-physical-address'));
  assert.ok(loadFormat('ZM').openSourceIds?.includes('zampost'));
  assert.ok(loadFormat('ZW').openSourceIds?.includes('zimpost'));
});

test('Americas country JSON files expose addressRules, Spanish delivery metadata, and open sources', () => {
  for (const countryCode of AMERICAS_COUNTRY_CODES) {
    const rules = loadRules(countryCode);
    const format = loadFormat(countryCode);
    const openSourceIds = format.openSourceIds ?? [];

    assert.ok(rules.languages.length > 0, `${countryCode} should define languages`);
    assert.ok(rules.englishOrder.length > 0, `${countryCode} should define English order`);
    assert.ok(openSourceIds.includes('osm-nominatim'), `${countryCode} should expose OSM/Nominatim`);
    assert.ok(openSourceIds.includes('openaddresses'), `${countryCode} should expose OpenAddresses`);
    assert.ok(openSourceIds.includes('geonames-postal'), `${countryCode} should expose GeoNames postal data`);
    assert.ok(openSourceIds.includes('geoboundaries'), `${countryCode} should expose geoBoundaries`);

    for (const sourceId of AMERICAS_NATURAL_OPEN_SOURCE_IDS) {
      assert.ok(openSourceIds.includes(sourceId), `${countryCode} should expose natural geography source ${sourceId}`);
    }
  }

  assert.deepEqual(loadRules('US').deliveryLanguages?.map(language => language.code), ['en', 'es']);
  assert.deepEqual(loadRules('CA').deliveryLanguages?.map(language => language.code), ['en', 'fr']);
  assert.deepEqual(loadRules('MX').deliveryLanguages?.map(language => language.code), ['es', 'en']);
  assert.deepEqual(loadRules('GT').regionalHierarchy, ['department', 'municipality', 'settlement']);
  assert.deepEqual(loadRules('PA').regionalHierarchy, ['province', 'district', 'corregimiento']);
  assert.deepEqual(loadRules('CO').regionalHierarchy, ['department', 'municipality', 'neighborhood']);
  assert.deepEqual(loadRules('BR').deliveryLanguages?.map(language => language.code), ['pt-BR', 'en']);
});

test('South America address JSON files link country-specific postal APIs and geoportals', () => {
  const expectedSourceIdsByCountry: Record<string, string[]> = {
    BR: ['viacep-br', 'brasilapi'],
    AR: ['georef-ar'],
    CL: ['geoportal-cl'],
    CO: ['colombia-en-mapas'],
    PE: ['geo-vivienda-pe'],
    EC: ['codigo-postal-ec'],
    PY: ['ide-py'],
    UY: ['ide-uy'],
  };

  for (const [countryCode, expectedSourceIds] of Object.entries(expectedSourceIdsByCountry)) {
    const format = loadFormat(countryCode);
    const rules = loadRules(countryCode);

    for (const sourceId of expectedSourceIds) {
      assert.ok(format.openSourceIds?.includes(sourceId), `${countryCode} should expose ${sourceId}`);
      assert.ok(rules.openSourceIds?.includes(sourceId), `${countryCode} rules should expose ${sourceId}`);
    }
  }

  assert.equal(loadFormat('BR').postalCode?.api, 'https://viacep.com.br/ws/{cep}/json/');
  assert.equal(loadFormat('EC').postalCode?.api, 'https://www.codigopostal.gob.ec/');
});

test('All Americas country and territory JSON files expose registered postal API or open-source links', () => {
  for (const countryCode of ['GL', 'PM', 'GP', 'MQ', 'BL', 'MF']) {
    assert.ok(
      (AMERICAS_COUNTRY_CODES as readonly string[]).includes(countryCode),
      `${countryCode} should be included in all-Americas coverage`,
    );
  }

  for (const countryCode of AMERICAS_COUNTRY_CODES) {
    const format = loadFormat(countryCode);
    const rules = loadRules(countryCode);
    const openSourceIds = format.openSourceIds ?? [];

    for (const sourceId of ['osm-nominatim', 'osm-overpass', 'openaddresses', 'geonames-postal', 'geonames-gazetteer', 'geoboundaries', 'upu-addressing']) {
      assert.ok(openSourceIds.includes(sourceId), `${countryCode} should expose ${sourceId}`);
    }

    for (const sourceId of AMERICAS_NATURAL_OPEN_SOURCE_IDS) {
      assert.ok(openSourceIds.includes(sourceId), `${countryCode} should expose ${sourceId}`);
      assert.ok(rules.openSourceIds?.includes(sourceId), `${countryCode} rules should expose ${sourceId}`);
    }

    for (const sourceId of openSourceIds) {
      const source = AMERICAS_OPEN_GEO_SOURCES[sourceId as keyof typeof AMERICAS_OPEN_GEO_SOURCES];
      assert.ok(source, `${countryCode} should reference a registered Americas source: ${sourceId}`);
      assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
    }

    if (rules.postalCode?.required) {
      assert.ok(
        format.postalCode?.api || format.postalCode?.source || openSourceIds.includes('zippopotam'),
        `${countryCode} should expose a postal API, source, or OSS postal-code lookup`,
      );
    }
  }

  assert.ok(loadFormat('US').openSourceIds?.includes('us-census-geocoder'));
  assert.ok(loadFormat('BR').openSourceIds?.includes('viacep-br'));
  assert.ok(loadFormat('AR').openSourceIds?.includes('georef-ar'));
  assert.ok(loadFormat('GP').openSourceIds?.includes('la-poste-fr-overseas'));
  assert.ok(loadFormat('GL').openSourceIds?.includes('postnord-greenland'));
});

test('British, Crown Dependency, and British Overseas Territory metadata exposes UK postal, mapping, and territory sources', () => {
  const expectedSourceIdsByCountry: Record<string, string[]> = {
    GB: [
      'postcodes-io',
      'ons-postcode-directory',
      'ordnance-survey-open-names',
      'ordnance-survey-boundary-line',
      'ordnance-survey-open-uprn',
      'ordnance-survey-openmap-local',
    ],
    GG: ['guernsey-post', 'digimap-guernsey'],
    JE: ['jersey-post', 'jersey-gov-open-data'],
    IM: ['isle-of-man-post', 'isle-of-man-gov-data'],
    GI: ['royal-gibraltar-post', 'gibraltar-gis'],
    FK: ['falkland-islands-post', 'falkland-islands-gis'],
    GS: ['british-overseas-postal-reference', 'south-georgia-gis'],
    SH: ['british-overseas-postal-reference', 'saint-helena-postal'],
    AC: ['british-overseas-postal-reference', 'ascension-post-office'],
    TA: ['british-overseas-postal-reference', 'tristan-post-office'],
    IO: ['british-overseas-postal-reference', 'biot-gov'],
    AI: ['british-overseas-postal-reference', 'anguilla-post', 'anguilla-gov-gis'],
    BM: ['british-overseas-postal-reference', 'bermuda-post', 'bermuda-gov-maps'],
    VG: ['british-overseas-postal-reference', 'bvi-post', 'bvi-gis'],
    KY: ['british-overseas-postal-reference', 'cayman-post', 'cayman-lands-survey'],
    MS: ['british-overseas-postal-reference', 'montserrat-post', 'montserrat-gis'],
    TC: ['british-overseas-postal-reference', 'turks-caicos-post', 'turks-caicos-gis'],
    PN: ['british-overseas-postal-reference', 'pitcairn-post'],
  };

  for (const [countryCode, sourceIds] of Object.entries(expectedSourceIdsByCountry)) {
    const format = loadFormat(countryCode);
    const rules = loadRules(countryCode);

    for (const sourceId of sourceIds) {
      assert.ok(format.openSourceIds?.includes(sourceId), `${countryCode} should expose ${sourceId}`);
      assert.ok(rules.openSourceIds?.includes(sourceId), `${countryCode} addressRules should expose ${sourceId}`);
    }
  }
});

test('European multilingual countries expose high-quality language-specific address tabs', () => {
  const requiredTabs: Record<string, { domestic: string[]; international: string[] }> = {
    CH: { domestic: ['fr', 'it', 'rm'], international: ['de', 'fr', 'it', 'rm'] },
    BE: { domestic: ['nl', 'fr', 'de'], international: ['nl', 'fr', 'de'] },
    LU: { domestic: ['lb', 'fr', 'de'], international: ['lb', 'fr', 'de'] },
    FI: { domestic: ['sv'], international: ['fi', 'sv'] },
    ES: { domestic: ['ca', 'gl', 'eu'], international: ['es', 'ca', 'gl', 'eu'] },
    CY: { domestic: ['tr'], international: ['el', 'tr'] },
    BA: { domestic: ['bs', 'hr', 'sr'], international: ['bs', 'hr', 'sr'] },
  };

  for (const [countryCode, expected] of Object.entries(requiredTabs)) {
    const format = loadFormat(countryCode);
    const rules = loadRules(countryCode);

    for (const languageCode of expected.domestic) {
      const tab = format.domestic?.[languageCode];
      assert.ok(tab, `${countryCode} should expose domestic ${languageCode} address tab`);
      assert.ok(tab.addressFormat.includes('{{street}}'), `${countryCode}/${languageCode} should format street`);
      assert.ok(tab.fields.length >= 5, `${countryCode}/${languageCode} should define enough address fields`);
    }

    for (const languageCode of expected.international) {
      const tab = format.international?.[languageCode];
      assert.ok(tab, `${countryCode} should expose international ${languageCode} address tab`);
      assert.match(tab.addressFormat, /\n[A-ZÀ-Ža-zà-ž ]+$/u, `${countryCode}/${languageCode} should include country line`);
      assert.ok(tab.fields.length >= 5, `${countryCode}/${languageCode} should define enough international fields`);
    }

    for (const languageCode of [...expected.domestic, ...expected.international]) {
      assert.ok(
        rules.languages.some(language => language.code === languageCode),
        `${countryCode} addressRules should list ${languageCode}`,
      );
    }
  }

  assert.equal(loadFormat('CH').domestic?.rm?.fields.find(field => field.key === 'street')?.label, 'Via / Stradun');
  assert.equal(loadFormat('BE').domestic?.nl?.fields.find(field => field.key === 'postcode')?.label, 'Postcode');
  assert.equal(loadFormat('LU').domestic?.lb?.fields.find(field => field.key === 'street')?.label, 'Strooss');
  assert.equal(loadFormat('FI').domestic?.sv?.fields.find(field => field.key === 'city')?.label, 'Postort');
  assert.equal(loadFormat('ES').domestic?.eu?.fields.find(field => field.key === 'street')?.label, 'Kalea');
});

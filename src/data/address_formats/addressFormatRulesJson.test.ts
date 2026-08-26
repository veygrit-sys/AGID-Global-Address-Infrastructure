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
  native?: { addressFormat: string; fields: { key: string; label: string; required?: boolean }[] };
  english?: { addressFormat: string; fields: { key: string; label: string; required?: boolean }[] };
  domestic?: Record<string, { name?: string; addressFormat: string; fields: { key: string; label: string; placeholder?: string }[] }>;
  international?: Record<string, { name?: string; addressFormat: string; fields: { key: string; label: string; placeholder?: string }[] }>;
  postalCode?: { format?: string; regex?: string; api?: string | null; source?: string };
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
  assert.deepEqual(loadRules('CN').languages, [{ code: 'zh-Hans', name: 'Chinese (Simplified)' }, { code: 'en', name: 'English display or Hanyu Pinyin transliteration' }]);
  assert.deepEqual(loadRules('HK').languages, [
    { code: 'zh-Hant', name: 'Chinese (Traditional)' },
    { code: 'en', name: 'English' },
  ]);
  assert.equal(loadRules('HK').postalCode, null);
  assert.deepEqual(loadRules('MO').languages, [
    { code: 'zh-Hant', name: 'Chinese (Traditional)' },
    { code: 'pt', name: 'Portuguese' },
  ]);
  assert.ok(loadRules('MN').regionalHierarchy?.includes('explicitUnifiedCodeLinkedBuilding'));
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

test('South Korea address metadata exposes postal district, Juso identifier, building, and cadastral sources', () => {
  const format = loadFormat('KR');
  const rules = loadRules('KR');
  const expectedSourceIds = [
    'korea-post-postcode-system',
    'korea-post-postcode-api',
    'mois-juso-basic-districts',
    'mois-juso-road-address-api',
    'mois-juso-building-db',
    'mois-juso-electronic-map',
    'molit-korea-gis-integrated-buildings',
    'molit-korea-continuous-cadastral-map',
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

  assert.equal(format.postalCode?.format, 'NNNNN');
  assert.equal(format.postalCode?.regex, '^\\d{5}$');
  assert.match(format.postalCode?.source ?? '', /Korea Post.*MOIS Juso.*National Basic District.*road address.*building.*MOLIT.*cadastral/i);
  assert.match(rules.postalCode?.label ?? '', /5 digits.*National Basic District.*official.*explicit.*building-management.*unit.*private/i);
  assert.ok(rules.regionalHierarchy?.includes('nationalBasicDistrict'));
  assert.ok(rules.regionalHierarchy?.includes('buildingManagementNumber'));
  assert.ok(rules.regionalHierarchy?.includes('exactAddressLinkedJusoBuilding'));
});

test('Saudi Arabia metadata exposes SPL National Address identifiers and independent GEOSA/REGA evidence', () => {
  const format = loadFormat('SA');
  const rules = loadRules('SA');
  const expectedSourceIds = [
    'spl-national-address-components',
    'spl-national-address-api-v31',
    'spl-national-address-api-terms',
    'spl-national-address-short-address',
    'geosa-saudi-geospatial-foundation-themes',
    'rega-saudi-geospatial-real-estate-portal',
    'rega-saudi-real-estate-registration-framework',
  ];

  for (const sourceId of expectedSourceIds) {
    assert.ok(format.openSourceIds?.includes(sourceId), `SA should expose ${sourceId}`);
    assert.ok(rules.openSourceIds?.includes(sourceId), `SA addressRules should expose ${sourceId}`);
    const source = ASIA_OPEN_GEO_SOURCES[sourceId as keyof typeof ASIA_OPEN_GEO_SOURCES];
    assert.ok(source, `${sourceId} should be registered as an Asia open geo source`);
    assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
  }

  assert.equal(format.postalCode?.format, 'NNNNN');
  assert.equal(format.postalCode?.regex, '^\\d{5}$');
  assert.match(format.postalCode?.source ?? '', /Saudi Post SPL.*National Address.*GEOSA.*Buildings.*REGA.*registration/i);
  assert.match(rules.postalCode?.label ?? '', /5 digits.*BuildingNumber.*not.*polygon.*footprint.*Short Address.*explicit licensed relation.*unit.*private/i);
  assert.ok(rules.regionalHierarchy?.includes('fourDigitAdditionalNumber'));
  assert.ok(rules.regionalHierarchy?.includes('opaquePkAddressIdWhenReturned'));
  assert.ok(rules.regionalHierarchy?.includes('explicitAddressLinkedBuildingFeature'));
});

test('Oman metadata exposes routing-code points, P.O. boxes, civic numbering, administrative context, and licence boundaries', () => {
  const format = loadFormat('OM');
  const rules = loadRules('OM');
  const expectedSourceIds = [
    'upu-oman-postal-addressing',
    'oman-post-office-locator',
    'oman-post-website-terms',
    'gov-oman-building-addressing-service',
    'ncsi-oman-wilayat-boundaries',
    'ncsi-oman-open-government-data-policy',
    'nsgia-oman-geospatial-governance',
    'nsgia-oman-portal-terms',
  ];

  for (const sourceId of expectedSourceIds) {
    assert.ok(format.openSourceIds?.includes(sourceId), `OM should expose ${sourceId}`);
    assert.ok(rules.openSourceIds?.includes(sourceId), `OM addressRules should expose ${sourceId}`);
    const source = ASIA_OPEN_GEO_SOURCES[sourceId as keyof typeof ASIA_OPEN_GEO_SOURCES];
    assert.ok(source, `${sourceId} should be registered as an Asia open geo source`);
    assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
  }

  assert.equal(format.postalCode?.format, 'NNN');
  assert.equal(format.postalCode?.regex, '^\\d{3}$');
  assert.match(format.postalCode?.source ?? '', /UPU.*Oman Post.*office.*NCSI.*NSGIA/i);
  assert.match(rules.postalCode?.label ?? '', /3 digits.*post.?office.*point.*not.*polygon.*P\.O\. box.*building.*explicit.*private/i);
  assert.ok(rules.regionalHierarchy?.includes('postOfficePointOrNoCanonicalGeometry'));
  assert.ok(rules.regionalHierarchy?.includes('poBoxNumberWhenProvided'));
  assert.ok(rules.regionalHierarchy?.includes('explicitAddressLinkedBuildingFeature'));
});

test('Taiwan address metadata exposes 3+3, doorplate, building, cadastral, and administrative sources', () => {
  const format = loadFormat('TW');
  const rules = loadRules('TW');
  const expectedSourceIds = [
    'chunghwa-post-3plus3-data',
    'chunghwa-post-3plus3-lookup',
    'chunghwa-post-3plus3-license',
    'moi-taiwan-national-doorplate-location',
    'nlsc-taiwan-emap-buildings',
    'nlsc-taiwan-emap-doorplates',
    'nlsc-taiwan-administrative-boundaries',
    'nlsc-taiwan-cadastral-map',
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
  assert.equal(format.postalCode?.format, 'NNN NNN');
  assert.equal(format.postalCode?.regex, '^\\d{3}\\s?\\d{3}$');
  assert.match(format.postalCode?.source ?? '', /Chunghwa Post 3\+3.*MOI.*doorplate.*NLSC.*buildings.*cadastral.*administrative/i);
  assert.match(rules.postalCode?.label ?? '', /6 digits.*address-range.*derived.*doorplate.*explicit.*NLSC.*household.*private/i);
  assert.equal(rules.postalCode?.required, true);
  assert.equal(rules.postalCode?.usage, 'required');
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

test('Mongolia address metadata separates five-digit zones, nine-digit building codes, government grids, and AGID', () => {
  const format = loadFormat('MN');
  const rules = loadRules('MN');
  const expectedSourceIds = [
    "zipcode-mn",
    "crc-mongolia-unified-postcode-2019",
    "upu-mongolia-addressing",
    "crc-mongolia-postal-regulation",
    "alamgc-mongolia",
    "nsdi-mongolia",
    "gazar-mongolia-address-system",
    "gazar-mongolia-spatial-data-standards",
    "gazar-mongolia-boundaries",
    "gazar-mongolia-open-spatial-data",
    "nso-mongolia-administrative-units"
];

  for (const sourceId of expectedSourceIds) {
    assert.ok(format.openSourceIds?.includes(sourceId));
    assert.ok(rules.openSourceIds?.includes(sourceId));
    const source = ASIA_OPEN_GEO_SOURCES[sourceId as keyof typeof ASIA_OPEN_GEO_SOURCES];
    assert.ok(source);
    assert.match(source.url, /^https?:\/\//);
  }

  assert.equal(format.postalCode?.format, 'NNNNN or NNNNN-NNNN');
  assert.equal(format.postalCode?.regex, '^\\d{5}(?:-\\d{4})?$');
  assert.match(format.postalCode?.source ?? '', /CRC Mongolia.*MNS 6775:2019.*UPU Mongolia.*Gazar address system.*NSDI.*boundaries/i);
  assert.match(rules.postalCode?.label ?? '', /5-digit postal zone.*9-digit unified building code.*exact rights-cleared.*link.*building/i);
  assert.ok(rules.regionalHierarchy?.includes('fiveDigitPostalZone'));
  assert.ok(rules.regionalHierarchy?.includes('nineDigitUnifiedBuildingCodeWhenAssigned'));
  assert.ok(rules.regionalHierarchy?.includes('gazarAddressGridWithoutPostalPromotion'));
  assert.ok(rules.regionalHierarchy?.includes('explicitUnifiedCodeLinkedBuilding'));
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
  assert.deepEqual(loadRules('MV').regionalHierarchy, ['administrativeAtoll','islandOrCity','wardOrLocality','streetHouseFloorApartmentOrUnit','fiveDigitPostcode','officialPostalAssignmentWithoutCanonicalGeometry','postalServicePointOrNonAreaObject','optionalIslandAdministrativeJoinSurface','optionalDerivedDeliverySurface','ldCodeAndFcodeWithoutPostalPromotion','censusIslandContextWithoutAddressPromotion','explicitRightsClearedCivicAddress','explicitAddressLinkedBuilding','exactRightsClearedBuildingGeometry']);
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
  assert.match(loadRules('IR').postalCode?.label ?? '', /10 digits.*regular delivery.*P\.O\. Box.*poste restante/i);
  assert.equal(loadRules('AE').postalCode, null);
  assert.match(loadRules('OM').postalCode?.label ?? '', /3 digits.*post.?office.*not.*polygon/i);
});

test('West Asia address metadata exposes national postal, geospatial, and OSM sources', () => {
  const expectedSourceIdsByCountry = {
    TR: ['turkiye-ptt', 'osm-turkey'],
    IR: ['iran-post', 'iran-post-gnaf', 'gavahi-post-ir', 'upu-iran-addressing-2023', 'iran-nsdi', 'iran-open-data', 'osm-iran'],
    IQ: ['iraq-post', 'osm-iraq'],
    SY: ['syria-post', 'osm-syria', 'hot-osm-west-asia'],
    LB: ['libanpost', 'osm-lebanon'],
    JO: ['jordanpost', 'upu-jordan-addressing-2004', 'modee-jordan-postal-policy-2025', 'trc-jordan-postal-sector', 'jordan-post-offices-open-data-2023', 'jordan-open-government-data-license-v1', 'rjgc-jordan', 'rjgc-jordan-eservices', 'rjgc-gam-building-mou', 'dls-jordan-village-codes-2022', 'gam-jordan-streets-2019', 'jordan-digital-mailbox-pilot-2026', 'osm-jordan'],
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
    { code: 'en', name: 'English display or Latin transliteration' },
  ]);
  assert.deepEqual(loadRules('UZ').regionalHierarchy, ['provinceOrRepublicOrCapitalCity', 'district', 'locality', 'mahallaOrBlockOrMassif', 'street', 'houseNumber', 'unit', 'postOfficeAssignment', 'officialCivicAddressId', 'cadastralParcelOrBuildingId', 'explicitRightsClearedBuilding']);
  assert.deepEqual(loadRules('KZ').russianOrder, ['recipient', 'organization', 'building', 'street', 'houseNumber', 'corpus', 'unit', 'postcode', 'locality', 'postOffice', 'district', 'province', 'poBox', 'country']);
  assert.deepEqual(loadRules('TM').regionalHierarchy, ['welayat']);
  assert.deepEqual(loadRules('KG').regionalHierarchy, ['country', 'provinceOrRepublicanCity', 'districtOrRayon', 'localityOrVillage', 'microdistrictOrAddressSubLocality', 'street', 'houseNumber', 'building', 'floor', 'unitOrApartment', 'room', 'postOfficeOrMobilePostalObject', 'poBox', 'postcode', 'explicitRightsClearedBuilding']);
  assert.deepEqual(loadRules('TJ').regionalHierarchy, ['viloyat']);
  assert.match(loadRules('KZ').postalCode?.label ?? '', /7-character.*legacy 6-digit.*neither.*polygon/i);
});

test('Central Asia address metadata exposes national geoportals, postal, and OSM reference sources', () => {
  const expectedSourceIdsByCountry = {
    KZ: ['kazakhstan-nsdi', 'qazpost-open-api', 'osm-kazakhstan'],
    UZ: ['pochta-uz', 'uzpost-index-map', 'upu-uzbekistan-addressing-2019', 'uzbekistan-postal-index-open-data-2019', 'uzbekistan-open-data-terms', 'uzbekistan-open-data-registry-2026', 'uzbekistan-cadastre-agency', 'uzbekistan-state-real-estate-register', 'osm-uzbekistan'],
    KG: ['kyrgyz-post-new-postal-codes-2025', 'kyrgyz-post-address-guidance', 'upu-kyrgyzstan-addressing-2019', 'upu-kyrgyzstan-designated-operators', 'gosreg-kyrgyz-address-register', 'cadastre-kyrgyz-property-portal', 'data-gov-kg', 'caiag-geonode-kg', 'osm-kyrgyzstan'],
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
  assert.deepEqual(loadRules('AU').regionalHierarchy, ['stateOrTerritory', 'localGovernmentArea', 'suburbOrLocality']);
  assert.match(loadRules('AU').postalCode?.label ?? '', /4 digits.*leading zero.*delivery category/i);
  assert.match(loadFormat('AU').postalCode?.source ?? '', /Australia Post.*G-NAF.*ABS.*Geoscape/i);
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
  assert.ok(loadFormat('AU').openSourceIds?.includes('auspost-paf'));
  assert.ok(loadFormat('AU').openSourceIds?.includes('gnaf-au'));
  assert.ok(loadFormat('AU').openSourceIds?.includes('abs-au-postal-areas'));
  assert.ok(loadFormat('AU').openSourceIds?.includes('geoscape-au-buildings'));
  assert.ok(loadFormat('AU').openSourceIds?.includes('abs-au-boundaries'));
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
  assert.equal(
    loadFormat('LI').postalCode?.api,
    'https://www.swisstopo.admin.ch/en/official-directory-of-towns-and-cities',
  );
  assert.equal(
    loadFormat('LI').postalCode?.source,
    'Swiss Post / swisstopo PLZO / Liechtenstein National Administration Building Addresses and GWR',
  );
  assert.deepEqual(loadRules('LI').regionalHierarchy, ['municipality', 'locality', 'street', 'buildingEntrance']);
  for (const sourceId of [
    'swiss-post-postcodes',
    'swisstopo-plzo-postal-localities',
    'liechtenstein-post-access-points',
    'llv-liechtenstein-building-addresses',
    'llv-liechtenstein-gwr-public',
    'llv-liechtenstein-official-survey',
    'llv-liechtenstein-sovereign-boundaries',
  ]) {
    assert.ok(loadFormat('LI').openSourceIds?.includes(sourceId));
  }
  assert.equal(loadFormat('LI').openSourceIds?.includes('openplzapi'), false);
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
  assert.match(loadRules('NO').postalCode?.label ?? '', /4 digits.*G\/P\/B\/S.*official area.*non-area.*address.*unit.*building.*NO\/SJ.*separate/i);
  assert.equal(loadRules('IS').postalCode?.label, '3 digits required');
  assert.equal(loadFormat('NO').postalCode?.api, 'https://www.bring.no/en/services/address-verification-services/postcodes');
  assert.equal(
    loadFormat('NO').postalCode?.source,
    'Posten Bring postcode register with Kartverket Postnummerområder, Matrikkelen address/unit/building-point, and licensed FKB building evidence',
  );
  assert.equal(loadFormat('DK').postalCode?.api, 'https://api.dataforsyningen.dk/postnumre');
  assert.equal(
    loadFormat('EE').postalCode?.api,
    'https://geoportaal.maaamet.ee/eng/spatial-data/address-data/postal-codes-p661.html',
  );
  assert.equal(loadFormat('EE').postalCode?.source, 'Omniva / AKS Postal Codes / ADS');
  assert.equal(loadFormat('DK').postalCode?.source, 'PostNord assignment with DAGI postcode geometry, DAR address identity, and GeoDanmark building linkage');
  assert.equal(loadFormat('FI').postalCode?.api, 'https://www.posti.fi/en/for-businesses/customer-support/postal-code-services');
  assert.equal(loadFormat('LV').postalCode?.api, 'https://pasts.lv/en/services/tariffs-and-information/postcode-book');
  assert.equal(loadFormat('LV').postalCode?.source, 'Latvijas Pasts assignment with VZD Address Register and Cadastre evidence');
  assert.equal(loadFormat('LT').postalCode?.api, 'https://www.post.lt/post/codes/search');
  assert.equal(loadFormat('LT').postalCode?.source, 'Lietuvos paštas assignment with Registrų centras Address Register and NTR building evidence');
});

test('Nordic and Baltic metadata exposes national geospatial and open-data sources', () => {
  const expectedSourceIdsByCountry: Record<string, string[]> = {
    SE: ['lantmateriet-sweden', 'trafikverket-sweden', 'scb-sweden-geodata'],
    NO: [
      'posten-bring-norway-postcode-register',
      'kartverket-norway-postcode-areas',
      'kartverket-norway-address-api',
      'kartverket-norway-matrikkelen-address',
      'kartverket-norway-matrikkelen-address-unit',
      'kartverket-norway-matrikkelen-building-points',
      'geovekst-norway-fkb-buildings',
      'kartverket-norway-administrative-units',
    ],
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
    FI: [
      'posti-finland-postal-code-services', 'posti-finland-basic-address-file',
      'statistics-finland-paavo-postal-areas', 'dvv-finland-building-dwelling-register',
      'syke-finland-ryhti-building-addresses', 'nls-finland-topographic-road-addresses',
      'nls-finland-topographic-buildings', 'nls-finland-municipal-division',
      'aland-post-postal-services', 'nls-finland', 'maanmittauslaitos-open-data',
      'dvv-finland-address-data',
    ],
    LV: [
      'latvijas-pasts-check-address',
      'vzd-latvia-address-register',
      'vzd-latvia-cadastral-buildings',
      'vzd-latvia-administrative-boundaries',
    ],
    EE: [
      'omniva-estonia-postcodes',
      'estonia-aks-postal-codes',
      'estonia-aks-postal-areas',
      'estonia-aks-address-objects',
      'estonia-aks-building-shapes',
      'estonia-ehak-admin-boundaries',
    ],
    LT: [
      'lietuvos-pastas-postcode-search',
      'registru-centras-address-register',
      'registru-centras-ntr-buildings',
      'registru-centras-address-boundaries',
      'geoportal-lt',
      'open-data-lithuania',
    ],
    IS: ['byggdastofnun-iceland-postcode-register', 'posturinn-iceland-postcodes', 'hms-iceland-address-register', 'natt-is50v-buildings', 'statistics-iceland-geography', 'island-is-open-data'],
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
  const expectedCountries = ['IT', 'ES', 'PT', 'GR', 'MT', 'SM', 'MC', 'VA', 'AD', 'CY', 'HR'];
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
  assert.match(loadRules('AD').postalCode?.label ?? '', /AD plus 3 digits.*parish-coded.*allocation.*geometry.*source evidence/i);
  assert.equal(loadFormat('AD').postalCode?.format, 'ADNNN');
  assert.equal(loadFormat('AD').postalCode?.regex, '^AD\\d{3}$');
  assert.match(loadFormat('AD').postalCode?.source ?? '', /Correos.*UPU.*Urban Guide.*IDE Andorra/i);
  assert.deepEqual(loadRules('AD').regionalHierarchy, [
    'parish',
    'populationCentre',
    'street',
    'addressNumber',
    'building',
    'entrance',
    'unit',
  ]);
  assert.deepEqual(loadRules('CY').languages, [
    { code: 'el', name: 'Greek' },
    { code: 'tr', name: 'Turkish' },
  ]);
  assert.equal(loadFormat('IT').postalCode?.api, 'https://www.poste.it/cap');
  assert.equal(loadFormat('GR').postalCode?.api, 'https://postalcodes.elta.gr/en/');
  assert.match(loadFormat('GR').postalCode?.source ?? '', /ELTA.*GISCO.*Cadastre.*ELSTAT/i);
  assert.match(loadRules('GR').postalCode?.label ?? '', /5 digits.*NNN NN.*assignment.*point.*area.*building.*separate/i);
  assert.equal(loadFormat('HR').postalCode?.api, 'https://www.posta.hr/preuzimanje-podataka-o-postanskim-uredima-6543/6543');
  assert.match(loadFormat('HR').postalCode?.source ?? '', /Hrvatska pošta.*DGU Spatial Unit Register.*INSPIRE Addresses and Buildings/i);
  assert.match(loadRules('HR').postalCode?.label ?? '', /5 domestic digits.*HR-.*operator assignment.*DGU delivery area.*address.*building.*parcel.*separate/i);
  assert.deepEqual(loadRules('HR').regionalHierarchy, [
    'countyOrCityOfZagreb',
    'cityOrMunicipality',
    'settlement',
    'postalDeliveryOffice',
    'streetOrSquare',
    'houseNumber',
    'building',
    'entrance',
    'floorOrUnit',
  ]);
  assert.equal(loadFormat('CY').postalCode?.api, 'https://www.cypruspost.post/en/api-postal-codes');
  assert.equal(loadFormat('MT').postalCode?.api, 'https://www.maltapost.com/postcode/?l=1');
  assert.match(loadFormat('MT').postalCode?.source ?? '', /MaltaPost.*Address Registrar.*Planning Authority/i);
  assert.equal(loadFormat('MC').postalCode?.api, 'https://www.data.gouv.fr/datasets/base-officielle-des-codes-postaux');
  assert.match(loadFormat('MC').postalCode?.source ?? '', /La Poste.*DPUM.*IMSEE/i);
  assert.match(loadFormat('CY').postalCode?.source ?? '', /Cyprus Post.*DLS INSPIRE.*CYSTAT/i);
  assert.match(loadRules('CY').postalCode?.label ?? '', /4 digits.*CY-.*assignment.*area.*source evidence/i);
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
    GR: [
      'gisco-greece-postcode-points',
      'elstat-greece-digital-cartography',
      'greece-national-streets-numbers-plan',
      'ktimatologio-greece',
      'geodata-gov-gr',
      'okxe-greece',
    ],
    HR: [
      'croatian-post-postcode-downloads',
      'dgu-croatia-spatial-unit-register',
      'dgu-croatia-inspire-addresses',
      'dgu-croatia-inspire-buildings',
      'dgu-croatia-inspire-administrative-units',
      'dgu-croatia-cadastral-parcels',
      'gisco-croatia-postcode-points',
    ],
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
    AD: ['correos-andorra-postcodes', 'andorra-urban-address-guide', 'andorra-topographic-buildings', 'andorra-cartografia', 'andorra-open-data'],
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
  assert.match(loadRules('RO').postalCode?.label ?? '', /6 digits required.*assignment class.*derived.*CUA.*explicit ANCPI.*private/i);
  assert.match(loadRules('UA').postalCode?.label ?? '', /5 digits.*routing.*service status.*area requires source evidence/i);
  assert.equal(loadFormat('UA').postalCode?.api, 'https://index.ukrposhta.ua/');
  assert.match(loadFormat('UA').postalCode?.source ?? '', /Ukrposhta.*UPU.*Unified State Address Register.*NSDI/i);
  assert.deepEqual(loadRules('UA').regionalHierarchy, [
    'oblastOrSpecialStatusCity',
    'raion',
    'territorialCommunity',
    'settlement',
    'street',
    'addressNumber',
    'buildingOrStructure',
    'entrance',
    'unit',
  ]);
  assert.match(loadRules('AL').postalCode?.label ?? '', /delivery office.*area requires source evidence/i);
  assert.equal(loadFormat('AL').postalCode?.api, 'https://www.postashqiptare.al/c/45/kodi-postar');
  assert.match(loadFormat('AL').postalCode?.source ?? '', /Posta Shqiptare.*National Address System.*ASIG-ASHK/i);
  assert.equal(loadFormat('AL').native.addressFormat, '{{organization}}\n{{street}} {{houseNumber}}\n{{postcode}}\n{{city}}');
  assert.deepEqual(loadRules('AL').regionalHierarchy, [
    'county',
    'municipality',
    'administrativeUnit',
    'cityOrVillage',
    'street',
    'buildingEntrance',
  ]);
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
  assert.equal(loadFormat('RO').postalCode?.api, 'https://www.posta-romana.ro/cauta-cod-postal.html');
  assert.equal(loadFormat('RU').postalCode?.api, 'https://datahub.io/logistics/postal-codes-ru');
  assert.equal(loadFormat('XK').postalCode?.api, 'https://www.spotzi.com/en/data-catalog?page=1&categories=Postal+Codes');
  assert.equal(loadFormat('MK').postalCode?.api, 'https://datahub.io/logistics/postal-codes-mk');
});

test('Slovakia address metadata separates postal, address, building, and parcel evidence', () => {
  const format = loadFormat('SK');
  const rules = loadRules('SK');

  assert.equal(format.postalCode?.api, 'https://www.posta.sk/psc');
  assert.match(format.postalCode?.source ?? '', /Slovenská pošta.*Register adries.*ZBGIS/i);
  assert.match(
    rules.postalCode?.label ?? '',
    /5 digits.*operator assignment.*derived.*Register adries.*building.*parcel.*separate/i,
  );
  assert.deepEqual(rules.regionalHierarchy, [
    'region',
    'district',
    'municipality',
    'municipalityPart',
    'streetOrPublicSpace',
    'descriptiveAndOrientationNumber',
    'registeredAddressPoint',
    'explicitRegisterBuilding',
  ]);
});

test('Slovenia address metadata separates postal districts, address centroids, buildings, and special codes', () => {
  const format = loadFormat('SI');
  const rules = loadRules('SI');

  assert.equal(format.postalCode?.api, 'https://www.posta.si/naslavljanje');
  assert.match(format.postalCode?.source ?? '', /Pošta Slovenije.*Register naslovov.*Kataster nepremičnin/i);
  assert.match(
    rules.postalCode?.label ?? '',
    /4 digits.*normal.*special.*postal district.*crosswalk.*address centroid.*building.*separate/i,
  );
  assert.deepEqual(rules.regionalHierarchy, [
    'statisticalRegion',
    'municipality',
    'settlement',
    'street',
    'houseNumberAndSuffix',
    'registeredAddressNumber',
    'addressCentroid',
    'explicitCadastralBuilding',
  ]);
});

test('Hungary address metadata separates operator assignment, KCR unit address, and exact building evidence', () => {
  const format = loadFormat('HU');
  const rules = loadRules('HU');
  const sourceIds = [
    'magyar-posta-partner-extra-postcodes', 'magyar-posta-addressing-database',
    'hungary-central-address-register-kcr', 'lechner-hungary-eha',
    'lechner-hungary-inspire-buildings', 'lechner-hungary-nta-buildings',
    'hungary-land-registry-cadastral-map', 'ksh-hungary-administrative-units',
  ];

  assert.equal(format.postalCode?.api, 'https://www.posta.hu/partnerextra');
  assert.match(format.postalCode?.source ?? '', /Magyar Posta Partner Extra.*KCR.*EHA.*INSPIRE.*NTA.*KSH/i);
  assert.match(rules.postalCode?.label ?? '', /4 digits.*operator assignment.*special non-area.*derived surface.*KCR.*building/i);
  assert.deepEqual(rules.regionalHierarchy, [
    'region',
    'county',
    'districtOrBudapestDistrict',
    'municipality',
    'postalAssignmentOrSpecialEndpoint',
    'publicPlaceNameAndType',
    'houseNumber',
    'buildingAndStaircase',
    'floorAndDoor',
    'kcrAddressId',
    'addressCoordinateAndCadastralId',
    'explicitRightsClearedBuilding',
  ]);
  for (const sourceId of sourceIds) assert.ok(format.openSourceIds?.includes(sourceId));
});
test('Finland address metadata separates Posti assignment, Paavo statistics, address, building, and FI/AX evidence', () => {
  const format = loadFormat('FI');
  const rules = loadRules('FI');
  const sourceIds = [
    'posti-finland-postal-code-services', 'posti-finland-basic-address-file',
    'statistics-finland-paavo-postal-areas', 'dvv-finland-building-dwelling-register',
    'syke-finland-ryhti-building-addresses', 'nls-finland-topographic-road-addresses',
    'nls-finland-topographic-buildings', 'nls-finland-municipal-division',
    'aland-post-postal-services',
  ];

  assert.equal(format.postalCode?.api, 'https://www.posti.fi/en/for-businesses/customer-support/postal-code-services');
  assert.match(format.postalCode?.source ?? '', /Posti.*Paavo.*DVV.*Ryhti.*NLS/i);
  assert.match(rules.postalCode?.label ?? '', /5 digits.*Posti assignment.*Paavo statistical.*address.*apartment.*building.*FI\/AX/i);
  assert.deepEqual(rules.regionalHierarchy, [
    'region',
    'subRegion',
    'municipality',
    'postalAssignmentOrSpecialEndpoint',
    'streetName',
    'houseNumberAndRange',
    'addressPointOrInterpolatedRoadLocation',
    'stairwayAndApartment',
    'permanentBuildingIdentifier',
    'explicitRyhtiOrSourceLinkedBuilding',
  ]);
  for (const sourceId of sourceIds) assert.ok(format.openSourceIds?.includes(sourceId));
});


test('Belarus address metadata separates Belpost assignment, NCA postal zones, address identity, capital structures, and administration', () => {
  const format = loadFormat('BY');
  const rules = loadRules('BY');
  const sourceIds = [
    'belpost-belarus-postcode-reference', 'nca-belarus-postal-code-zones',
    'nca-belarus-address-register', 'nca-belarus-capital-structure-addresses',
    'nca-belarus-real-estate-register', 'nca-belarus-property-characteristics-register',
    'nca-belarus-ate-register', 'nca-belarus-soato-classifier',
    'nca-belarus-public-cadastral-map',
  ];

  assert.equal(format.postalCode?.api, 'https://www.belpost.by/');
  assert.match(format.postalCode?.source ?? '', /Belpost.*NCA postal-code zones.*Address Register.*capital-structure.*ATE\/SOATO/i);
  assert.match(rules.postalCode?.label ?? '', /6 digits.*Belpost assignment.*official-derived.*semiannual zone.*isolated premise.*capital structure/i);
  assert.deepEqual(rules.regionalHierarchy, [
    'oblastOrMinskCity',
    'rayonOrCityOfRegionalSubordination',
    'villageCouncilOrCityDistrict',
    'settlementSoato',
    'postalAssignmentOrSpecialEndpoint',
    'streetRoadOrInternalAddressElement',
    'capitalStructureNumberAndCorpus',
    'entranceFloorApartmentOrIsolatedPremise',
    'authoritativeAddressIdAndGeocode',
    'capitalStructureOrRealEstateIdentifier',
    'explicitRightsClearedBuilding',
  ]);
  for (const sourceId of sourceIds) assert.ok(format.openSourceIds?.includes(sourceId));
});

test('Belgium address metadata separates postal cantons, BeSt identity, regional buildings, cadastre, and administration', () => {
  const format = loadFormat('BE');
  const rules = loadRules('BE');
  const sourceIds = ["bpost-belgium-postcode-reference","bpost-belgium-postal-cantons","bpost-address-validation","bosa-belgium-best-address","digitaal-vlaanderen-address-register","digitaal-vlaanderen-building-register","digitaal-vlaanderen-grb","spw-wallonia-icar-addresses","spw-wallonia-picc-buildings","paradigm-brussels-urbis-buildings-addresses","fps-finance-belgium-cadastral-plan","fps-finance-belgium-administrative-units"];

  assert.equal(format.postalCode?.api, 'https://www.bpost.be/nl/postcodevalidatie-tool');
  assert.match(format.postalCode?.source ?? '', /bpost.*postal cantons.*BOSA BeSt.*Flanders.*Wallonia.*Brussels.*FPS Finance/i);
  assert.match(rules.postalCode?.label ?? '', /4 digits.*no B-\/BE- prefix.*postal-canton polygon.*BeSt.*explicit.*building/i);
  assert.deepEqual(rules.regionalHierarchy, [
    'region',
    'provinceOrBrusselsCapital',
    'administrativeArrondissement',
    'municipalityNis',
    'postalCantonOrSpecialCode',
    'localityOrMunicipalityPart',
    'streetName',
    'houseNumberAndBox',
    'bestAddressIdAndRegionalSourceId',
    'addressableObjectType',
    'explicitRegionalBuildingOrCadastreLink',
    'exactRightsClearedBuilding',
  ]);
  for (const sourceId of sourceIds) assert.ok(format.openSourceIds?.includes(sourceId));
});

test('Romania address metadata separates assignment class, derived geometry, RENNS CUA, ANCPI construction, SIRUTA, and private property evidence', () => {
  const format = loadFormat('RO');
  const rules = loadRules('RO');
  const sourceIds = [
    'posta-romana-postcode-search',
    'posta-romana-postcode-structure',
    'posta-romana-infocod',
    'posta-romana-postcode-geography-status',
    'ancpi-romania-renns',
    'ancpi-romania-inis-addresses-buildings',
    'ancpi-romania-registered-property-viewer',
    'insse-romania-siruta-localities',
  ];
  assert.equal(format.postalCode?.api, 'https://www.posta-romana.ro/cauta-cod-postal.html');
  assert.match(format.postalCode?.source ?? '', /Poșta Română.*Infocod.*RENNS.*INIS.*SIRUTA/i);
  assert.match(rules.postalCode?.label ?? '', /6 digits.*assignment class.*derived.*CUA.*explicit ANCPI.*property.*private/i);
  assert.deepEqual(rules.regionalHierarchy, [
    'countyOrBucharest',
    'municipalityCityCommuneOrBucharestSector',
    'localitySiruta',
    'postalAssignmentClass',
    'streetOrStreetSection',
    'administrativeNumber',
    'uniqueAddressCodeCua',
    'addressPointAndParcelReference',
    'explicitAncpiConstructionIdentifier',
    'exactRightsClearedBuilding',
  ]);
  for (const sourceId of sourceIds) assert.ok(format.openSourceIds?.includes(sourceId));
});

test('Montenegro address metadata separates postcode, PAK, UZN address and building, MONSTAT, and private property evidence', () => {
  const format = loadFormat('ME');
  const rules = loadRules('ME');
  const sourceIds = ["posta-crne-gore-postcode-office-directory","posta-crne-gore-pak-addressing","uzn-montenegro-address-register","uzn-montenegro-real-estate-cadastre","uzn-montenegro-geoportal","uzn-montenegro-spatial-unit-record","monstat-montenegro-spatial-register"];
  assert.equal(format.postalCode?.api, 'https://www.postacg.me/centar-za-korisnike/lokacije-poslovnica/');
  assert.match(format.postalCode?.source ?? '', /Pošta Crne Gore.*PAK.*UZN Address Register.*cadastre.*MONSTAT/i);
  assert.match(rules.postalCode?.label ?? '', /5 digits.*six-digit PAK.*routing.*derived.*address point.*explicit UZN link.*property.*private/i);
  assert.deepEqual(rules.regionalHierarchy, ['municipalityOrCapital', 'settlement', 'localCommunity', 'statisticalOrCensusCircle', 'cadastralMunicipality', 'postalOfficeAssignment', 'postalAddressCodePak', 'streetOrSquare', 'houseNumber', 'authoritativeAddressRegisterId', 'cadastralParcelAndBuildingIdentifier', 'explicitRightsClearedBuilding']);
  for (const sourceId of sourceIds) assert.ok(format.openSourceIds?.includes(sourceId));
});

test('Bulgaria address metadata separates routing, EKATTE, address, and cadastral building evidence', () => {
  const format = loadFormat('BG');
  const rules = loadRules('BG');
  const sourceIds = ['bulgarian-posts-postcode-reference', 'bulgarian-posts-post-office-directory', 'grao-bulgaria-address-classifier', 'agcc-bulgaria-cadastral-map', 'agcc-bulgaria-inspire-buildings', 'nsi-bulgaria-ekatte', 'nsi-bulgaria-administrative-spatial-data'];

  assert.equal(format.postalCode?.api, 'https://www.bgpost.bg/en/');
  assert.match(format.postalCode?.source ?? '', /Bulgarian Posts.*GRAO.*AGCC.*NSI EKATTE/i);
  assert.match(rules.postalCode?.label ?? '', /4 digits.*routing.*EKATTE.*address.*cadastral building.*non-area/i);
  assert.deepEqual(rules.regionalHierarchy, [
    'districtOblast',
    'municipality',
    'settlementEkatte',
    'postalAssignmentOrSpecialEndpoint',
    'streetBoulevardSquareOrQuarter',
    'houseOrBlockNumber',
    'entranceFloorApartment',
    'authorizedAddressIdentifierAndAccessPoint',
    'cadastralBuildingIdentifier',
    'explicitRightsClearedBuilding',
  ]);
  for (const sourceId of sourceIds) assert.ok(format.openSourceIds?.includes(sourceId));
});

test('Serbia address metadata separates postcode, PAK, house-number point, building, and territorial evidence', () => {
  const format = loadFormat('RS');
  const rules = loadRules('RS');

  assert.equal(format.postalCode?.api, 'https://www.posta.rs/lat/alati/pronadjite-pak.aspx');
  assert.match(format.postalCode?.source ?? '', /Pošta Srbije.*RGZ Adresni registar/i);
  assert.match(
    rules.postalCode?.label ?? '',
    /5 digits.*six-digit PAK.*routing.*house-number point.*building.*territorial coverage.*separate/i,
  );
  assert.deepEqual(rules.regionalHierarchy, [
    'autonomousProvinceOrAdministrativeDistrict',
    'localGovernmentUnit',
    'cityMunicipality',
    'populatedPlace',
    'street',
    'houseNumberAndSubnumber',
    'uniqueAddressCode',
    'postalAddressCodePak',
    'destinationPostOffice',
    'explicitCadastralBuilding',
  ]);
});

test('Central, Eastern, and Balkan Europe metadata exposes national geospatial sources', () => {
  const expectedSourceIdsByCountry: Record<string, string[]> = {
    PL: ['geoportal-gov-pl', 'gus-teryt-poland'],
    CZ: ['cuzk-ruian', 'cuzk-ruian-addresses', 'cuzk-ruian-vfr', 'cuzk-inspire-buildings', 'cuzk-ruian-boundaries', 'cuzk-geoportal'],
    SK: [
      'zbgis-slovakia', 'slovakia-address-register',
      'slovak-post-postcode-search', 'slovak-post-access-point-xml',
      'slovakia-register-addresses-portal', 'slovakia-register-addresses-openapi',
      'zbgis-slovakia-inspire-buildings', 'zbgis-slovakia-administrative-units',
      'zbgis-slovakia-cadastral-parcels',
    ],
    HU: [
      'magyar-posta-partner-extra-postcodes', 'magyar-posta-addressing-database',
      'hungary-central-address-register-kcr', 'lechner-hungary-eha',
      'lechner-hungary-inspire-buildings', 'lechner-hungary-nta-buildings',
      'hungary-land-registry-cadastral-map', 'ksh-hungary-administrative-units',
      'lechner-hungary-geodata', 'hungary-public-road-data',
    ],
    SI: [
      'eprostor-slovenia', 'gurs-slovenia',
      'posta-slovenije-postcode-csv', 'posta-slovenije-special-postcodes',
      'posta-slovenije-delivery-area-webgis',
      'gurs-slovenia-postal-districts', 'gurs-slovenia-address-register',
      'gurs-slovenia-public-features-api',
      'gurs-slovenia-real-estate-cadastre-buildings',
      'gurs-slovenia-spatial-unit-register',
      'gurs-slovenia-cadastral-parcels',
    ],
    HR: ['dgu-croatia-geoportal', 'croatia-cadastre'],
    RO: ['ancpi-romania-geoportal', 'romania-open-data'],
    BG: ['bulgarian-posts-postcode-reference', 'bulgarian-posts-post-office-directory', 'grao-bulgaria-address-classifier', 'agcc-bulgaria-cadastral-map', 'agcc-bulgaria-inspire-buildings', 'nsi-bulgaria-ekatte', 'nsi-bulgaria-administrative-spatial-data', 'cadastre-bulgaria', 'bulgaria-inspire-geoportal'],
    UA: [
      'ukrposhta-postcodes-open-data',
      'ukrposhta-index-and-address-api',
      'ukraine-unified-address-register',
      'ukraine-building-register',
      'ukraine-nsdi',
      'data-gov-ua-geodata', 'ukraine-cadastre-map',
    ],
    MD: ['geoportal-moldova', 'moldova-open-data'],
    BY: ['belpost-belarus-postcode-reference', 'nca-belarus-postal-code-zones', 'nca-belarus-address-register', 'nca-belarus-capital-structure-addresses', 'nca-belarus-real-estate-register', 'nca-belarus-property-characteristics-register', 'nca-belarus-ate-register', 'nca-belarus-soato-classifier', 'nca-belarus-public-cadastral-map', 'belarus-nca-geoportal'],
    RU: ['rosreestr-nspd', 'russia-open-data-geo'],
    RS: [
      'geosrbija', 'rgz-serbia',
      'posta-srbije-post-office-list', 'posta-srbije-pak-definition',
      'posta-srbije-pak-lookup', 'posta-srbije-wsp-address-api',
      'rgz-serbia-address-register-open-data',
      'rgz-serbia-spatial-unit-register', 'rgz-serbia-geosrbija-buildings',
      'rgz-serbia-real-estate-cadastre',
    ],
    BA: ['bosnia-geoportal', 'bosnia-cadastre-reference'],
    ME: ['geoportal-montenegro', 'montenegro-cadastre'],
    XK: ['kosovo-geoportal', 'kosovo-cadastre'],
    AL: [
      'posta-shqiptare-postcodes',
      'albania-national-address-system',
      'ashk-albania-cadastral-buildings',
      'asig-albania',
      'albania-geoportal',
    ],
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
  assert.match(loadRules('AM').postalCode?.label ?? '', /postal region.*post office.*area requires source evidence/i);
  assert.equal(loadFormat('AM').postalCode?.format, 'NNNN');
  assert.equal(loadFormat('AM').postalCode?.regex, '^\\d{4}$');
  assert.match(loadFormat('AM').postalCode?.source ?? '', /HayPost.*Cadastre Committee.*National Geoportal/i);
  assert.deepEqual(loadRules('AM').regionalHierarchy, [
    'regionOrYerevan',
    'community',
    'settlement',
    'street',
    'realEstateAddress',
    'buildingEntrance',
  ]);
  assert.match(loadRules('AZ').postalCode?.label ?? '', /AZNNNN.*allocation requires source evidence/i);
  assert.match(loadRules('GE').postalCode?.label ?? '', /4 digits.*operator assignment.*derived.*resource-specific.*building.*parcel.*separate/i);
  assert.equal(loadFormat('AM').postalCode?.api, 'https://www.haypost.am/en/find-index');
  assert.match(loadFormat('AZ').postalCode?.api ?? '', /azerpost\.az/);
  assert.equal(loadFormat('AZ').postalCode?.format, 'AZNNNN');
  assert.equal(loadFormat('AZ').postalCode?.regex, '^AZ\\d{4}$');
  assert.match(loadFormat('AZ').postalCode?.source ?? '', /Azərpoçt.*Address Register.*cadastre/i);
  assert.deepEqual(loadRules('AZ').regionalHierarchy, ['regionOrAutonomousRepublic', 'districtOrCity', 'locality', 'street', 'premise']);
  assert.match(loadFormat('GE').postalCode?.api ?? '', /gpost\.ge.*zipcodes/i);
  assert.match(loadFormat('GE').postalCode?.source ?? '', /Georgian Post.*NAPR Address Registry.*NSDI/i);
  assert.deepEqual(loadRules('GE').regionalHierarchy, [
    'regionOrAutonomousRepublic',
    'municipality',
    'cityTownVillageOrSettlement',
    'namedGeographicObjectOrStreet',
    'houseOrBuildingNumber',
    'registeredAddress',
    'buildingOrStructure',
    'entranceFloorOrUnit',
  ]);
});

test('Caucasus metadata exposes national geospatial, cadastre, and open-data sources', () => {
  const expectedSourceIdsByCountry: Record<string, string[]> = {
    AM: [
      'haypost-am',
      'haypost-address-reference',
      'armenia-real-estate-address-register',
      'armenia-national-geoportal-buildings',
      'cadastre-armenia',
      'armstat-geodata',
      'geonames-armenia',
    ],
    AZ: ['azerpost-address-reference', 'azerbaijan-address-register', 'azerbaijan-state-committee-property', 'azerbaijan-open-data', 'geonames-azerbaijan'],
    GE: [
      'napr-georgia',
      'gdi-georgia',
      'gpost-address-reference',
      'geonames-georgia',
      'georgian-post-postcode-finder',
      'georgian-post-addressing-guide',
      'napr-georgia-address-registry',
      'nsdi-georgia-address-layer',
      'nsdi-georgia-registered-buildings',
      'nsdi-georgia-registered-parcels',
      'nsdi-georgia-administrative-boundaries',
      'geostat-georgia-administrative-classification',
    ],
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
  assert.ok(loadFormat('KZ').openSourceIds?.includes('post-kz'));
  assert.ok(loadFormat('KZ').openSourceIds?.includes('kazakhstan-postal-index-rules-2026'));
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
  assert.equal(loadFormat('EG').postalCode?.api, 'https://www.egyptpost.org/');
  assert.match(loadFormat('EG').postalCode?.source ?? '', /UPU Egypt.*Egypt Post.*CAPMAS.*Survey Authority/i);
  assert.equal(loadFormat('DZ').postalCode?.api, 'https://www.poste.dz/customer/bureaux_postaux');
  assert.equal(loadFormat('LY').postalCode?.api, 'https://libyapost.ly/en/services/');
  assert.equal(loadFormat('MA').postalCode?.api, 'https://www.codepostal.ma/search.aspx');
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
  assert.deepEqual(loadRules('GT').regionalHierarchy, [
    'country', 'department', 'municipality', 'locality_or_rural_locality',
    'urban_zone_or_neighborhood', 'five_digit_postcode', 'street_and_premises',
    'civic_address', 'building_or_unit',
  ]);
  assert.deepEqual(loadRules('PA').regionalHierarchy, ['province', 'district', 'corregimiento']);
  assert.deepEqual(loadRules('CO').regionalHierarchy, [
    'country', 'department', 'municipality_or_district', 'six_digit_postal_area',
    'locality_neighborhood_or_rural_settlement', 'street_and_placa',
    'civic_address', 'construction_building_or_unit',
  ]);
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


test('Israel address metadata separates seven-digit assignments, non-area postal objects, government context, buildings, territorial scope, privacy, and AGID', () => {
  const format = loadFormat('IL');
  const rules = loadRules('IL');
  const expected = ["israel-post","israel-post-mail-guide-2020","israel-post-terms","upu-israel-addressing-2022","govmap-israel","population-authority-israel-street-list","cbs-israel-geography","data-gov-il","data-gov-il-terms-2025","osm-israel"];
  for (const id of expected) {
    assert.ok(format.openSourceIds?.includes(id), 'IL should expose ' + id);
    assert.ok(rules.openSourceIds?.includes(id), 'IL rules should expose ' + id);
    assert.match(ASIA_OPEN_GEO_SOURCES[id as keyof typeof ASIA_OPEN_GEO_SOURCES].url, /^https?:\/\//);
  }
  assert.equal(format.postalCode?.format, 'NNNNNNN');
  assert.equal(format.postalCode?.regex, '^\\d{7}$');
  assert.match(format.postalCode?.source ?? '', /Israel Post.*UPU.*10\/2022.*GovMap.*Data\.gov\.il.*2025-08-30/i);
  assert.match(rules.postalCode?.usage ?? '', /opaque Israel Post assignment.*updated.*address.*route.*P\.O\. Box.*non-area.*polygon is never presumed.*nine-digit distribution code.*territorial scope/i);
  assert.ok(rules.regionalHierarchy.includes('explicitAddressLinkedBuilding'));
  assert.ok(rules.regionalHierarchy.includes('agidIndependentSpatialIndex'));
  assert.ok(rules.regionalHierarchy.includes('territorialScopeExplicitAndVersioned'));
});

test('Afghanistan address metadata exposes current six digits, postal-map, administrative, privacy, building, and AGID boundaries', () => {
  const format = loadFormat('AF');
  const rules = loadRules('AF');
  const expected = ["afghan-post","afghan-postal-code-system","upu-afghanistan-addressing-2025","afghan-post-policy","ocha-afghanistan-admin-boundaries-2026","hot-osm-afghanistan","osm-afghanistan"];
  for (const id of expected) {
    assert.ok(format.openSourceIds?.includes(id), 'AF should expose ' + id);
    assert.ok(rules.openSourceIds?.includes(id), 'AF rules should expose ' + id);
    assert.match(ASIA_OPEN_GEO_SOURCES[id as keyof typeof ASIA_OPEN_GEO_SOURCES].url, /^https?:\/\//);
  }
  assert.equal(format.postalCode?.format, 'NNNNNN');
  assert.equal(new RegExp(format.postalCode?.regex ?? '').test('999999'), true);
  assert.equal(format.postalCode?.regex, '^\\d{6}$');
  assert.match(format.postalCode?.source ?? '', /Afghan Post.*UPU.*07\/2025.*OCHA.*2026/i);
  assert.match(rules.postalCode?.usage ?? '', /province.*city or rural district.*delivery zone.*postal-area-first.*P-code.*not.*reusable polygon.*building relation/i);
  assert.ok(rules.regionalHierarchy.includes('officialPostalAreaGeometryWhenExactlyRightsCleared'));
  assert.ok(rules.regionalHierarchy.includes('explicitAddressLinkedBuilding'));
  assert.ok(rules.regionalHierarchy.includes('agidIndependentSpatialIndex'));
});

test('Lebanon address metadata exposes postal/NAC/P-code, administrative, privacy, building, and AGID boundaries', () => {
  const format = loadFormat('LB');
  const rules = loadRules('LB');
  const expected = ['libanpost','libanpost-address-and-nac','upu-lebanon-addressing','upu-lebanon-postcode-formats-2025','moph-lebanon-administrative-zones','lebanon-atlas-admin-boundaries-2026','dlrc-lebanon-cadastre','lebanon-law-81-2018-personal-data','osm-lebanon'];
  for (const id of expected) {
    assert.ok(format.openSourceIds?.includes(id), 'LB should expose ' + id);
    assert.ok(rules.openSourceIds?.includes(id), 'LB rules should expose ' + id);
    assert.match(ASIA_OPEN_GEO_SOURCES[id as keyof typeof ASIA_OPEN_GEO_SOURCES].url, /^https?:\/\//);
  }
  assert.equal(format.postalCode?.format, 'NNNN or NN NNN NNN');
  assert.equal(format.postalCode?.regex, '^(?:\\d{4}|\\d{2} \\d{3} \\d{3})$');
  assert.match(format.postalCode?.source ?? '', /LibanPost.*UPU.*2025.*MOPH/i);
  assert.match(rules.postalCode?.usage ?? '', /area or non-area.*NAC.*P-code.*not.*official polygon.*building relation/i);
  assert.ok(rules.regionalHierarchy.includes('libanPostNacCoordinateDerivedLocationToken'));
  assert.ok(rules.regionalHierarchy.includes('explicitAddressLinkedBuilding'));
  assert.ok(rules.regionalHierarchy.includes('agidIndependentSpatialIndex'));
});

test('Laos address metadata exposes official delivery-scope, administrative, privacy, building, and AGID boundaries', () => {
  const format = loadFormat('LA');
  const rules = loadRules('LA');
  const expected = ['lao-post-postcode','laos-postal-service-law-2013','laopedia-laos-postcodes','nfms-laos-administrative-boundaries','lsb-laos-phc-2025','laolandreg-laos','laos-electronic-data-law','osm-laos'];
  for (const id of expected) {
    assert.ok(format.openSourceIds?.includes(id), 'LA should expose ' + id);
    assert.ok(rules.openSourceIds?.includes(id), 'LA rules should expose ' + id);
    assert.match(ASIA_OPEN_GEO_SOURCES[id as keyof typeof ASIA_OPEN_GEO_SOURCES].url, /^https?:\/\//);
  }
  assert.equal(format.postalCode?.format, 'NNNNN');
  assert.equal(format.postalCode?.regex, '^\\d{5}$');
  assert.match(format.postalCode?.source ?? '', /Lao Postal Service.*Postal Services Law 2013.*Laopedia.*NFMS.*Statistics Bureau/i);
  assert.match(rules.postalCode?.usage ?? '', /delivery-scope.*area.*point.*route.*P\.O\. Box.*(?:not|never).*exact building/i);
  assert.ok(rules.regionalHierarchy.includes('optionalDerivedAdministrativeJoinSurface'));
  assert.ok(rules.regionalHierarchy.includes('explicitAddressLinkedBuilding'));
  assert.ok(rules.regionalHierarchy.includes('agidIndependentSpatialIndex'));
});

test('Iraq address metadata separates five-digit postal objects, unverified migration zones, private delivery addresses, government context, buildings, territorial scope, and AGID', () => {
  const format = loadFormat('IQ');
  const rules = loadRules('IQ');
  assert.equal(format.postalCode?.format, 'NNNNN');
  assert.equal(format.postalCode?.regex, '^\\d{5}$');
  assert.match(format.postalCode?.api ?? '', /post\.iq/i);
  assert.match(format.postalCode?.source ?? '', /Iraq Post.*privacy policy 2025.*UPU.*03\/2005.*2004.*ArcGIS.*2025.*NOGP.*IGP.*COSIT/i);
  assert.equal(rules.postalCode?.label, '5 digits required for postal addressing');
  assert.equal(rules.postalCode?.required, true);
  assert.match(rules.postalCode?.usage ?? '', /opaque Iraq Post assignment.*region.*governorate.*delivery-type.*post-office.*P\.O\. Box.*business holdout.*polygon is never presumed.*zone-plus-sector.*unverified owner.*migration candidate.*territorial scope/i);
  assert.deepEqual(rules.regionalHierarchy, ['officialFiveDigitPostalAssignment','postalOfficeDeliveryTypePoBoxOrBusinessHoldout','recipientOrOrganization','houseStreetQuarterAlley','districtLocalityGovernorate','officialPostalObjectGeometryWhenExactlyRightsCleared','unverifiedZoneSectorMigrationCandidate','iraqGeographicPortalAdministrativeCandidate','statisticsGisAdministrativeContextIndependentFromPostcode','optionalDerivedPostalContextSurface','explicitRightsClearedCivicAddress','explicitAddressLinkedBuilding','exactRightsClearedBuildingGeometry','agidIndependentSpatialIndex','territorialScopeExplicitAndVersioned']);
  assert.equal(format.native?.fields.some(field => field.key === 'poBox'), true);
  assert.equal(format.english?.fields.some(field => field.key === 'quarter'), true);
  assert.equal(format.native?.fields.some(field => field.key === 'buildingId'), true);
  for (const id of ["iraq-post","iraq-post-platform","iraq-post-privacy-2025","upu-iraq-addressing-2005","iraq-post-2004-code-announcement","iraq-post-new-code-storymap-2025","iraq-open-government-portal","iraq-open-government-data-policy","iraq-geographic-portal","iraq-statistics-gis","osm-iraq"]) assert.ok(format.openSourceIds?.includes(id));
});

test('Iran address metadata separates ten-digit place IDs, P.O. exceptions, GNAF, buildings, time, jurisdiction, and AGID', () => {
  const format = loadFormat('IR'); const rules = loadRules('IR');
  assert.equal(format.postalCode?.format, 'NNNNNNNNNN'); assert.equal(format.postalCode?.regex, '^\\d{10}$');
  assert.match(format.postalCode?.source ?? '', /Iran Post GNAF.*certificate.*UPU.*10\/2023.*NSDI.*Open Data.*OpenStreetMap/i);
  assert.equal(rules.postalCode?.required, false); assert.match(rules.postalCode?.usage ?? '', /ten-digit.*place identifier.*P\.O\. Box.*poste restante.*not.*polygon.*building relation/i);
  for (const key of ['building','floor','unit','poBox','postOffice','posteRestante']) assert.ok(format.native.fields.some((item:any)=>item.key===key), key);
  for (const id of ['iran-post','iran-post-gnaf','gavahi-post-ir','upu-iran-addressing-2023','iran-nsdi','iran-open-data','osm-iran']) assert.ok(format.openSourceIds?.includes(id));
});


test('Kazakhstan address metadata separates dual codes, RKA, buildings, NSDI, time, jurisdiction, and AGID', () => {
  const format = loadFormat('KZ');
  const rules = loadRules('KZ');
  assert.equal(format.postalCode?.format, 'LNNLNLN or NNNNNN');
  assert.equal(new RegExp(format.postalCode?.regex ?? '').test('X99X9X9'), true);
  assert.equal(new RegExp(format.postalCode?.regex ?? '').test('999999'), true);
  assert.equal(new RegExp(format.postalCode?.regex ?? '').test('X99-X9X9'), false);
  assert.match(format.postalCode?.source ?? '', /Kazpost.*UPU.*07.*2025.*2026.*Address Register.*RKA.*NSDI.*cadast.*OpenStreetMap/i);
  assert.equal(rules.postalCode?.required, true);
  assert.match(rules.postalCode?.usage ?? '', /coexisting.*seven alphanumeric.*real-estate object.*legacy six-digit.*phased out.*not.*polygon.*RKA.*16-digit.*AGID/i);
  for (const key of ['building', 'houseNumber', 'corpus', 'unit', 'postOffice', 'poBox']) {
    assert.ok(format.native?.fields.some(item => item.key === key), key);
  }
  for (const id of ['post-kz', 'qazpost-open-api', 'upu-kazakhstan-addressing-2025', 'kazakhstan-postal-index-rules-2026', 'kazakhstan-post-law', 'kazakhstan-addressing-rules-2026', 'kazakhstan-address-register', 'kazakhstan-nsdi', 'kazakhstan-nsdi-use-rules-2023', 'kazakhstan-public-cadastral-map', 'kazakhstan-real-estate-rights-register', 'osm-kazakhstan']) {
    assert.ok(format.openSourceIds?.includes(id));
  }
});

test('Uzbekistan address metadata separates delivery indices, offices, dated data, buildings, time, jurisdiction, and AGID', () => {
  const format = loadFormat('UZ'); const rules = loadRules('UZ');
  assert.equal(format.postalCode?.format, 'NNNNNN');
  assert.equal(new RegExp(format.postalCode?.regex ?? '').test('999999'), true);
  assert.match(format.postalCode?.source ?? '', /UzPost.*UPU.*07.*2019.*2019.*reuse terms.*2026.*Cadastre.*real-estate.*OpenStreetMap/i);
  assert.equal(rules.postalCode?.required, true); assert.match(rules.postalCode?.usage ?? '', /six-digit.*delivery.*post.?office.*not.*polygon.*2019.*current.*building relation/i);
  for (const key of ['building','blockOrMassif','houseNumber','unit','postOffice','poBox']) assert.ok(format.native?.fields.some(item => item.key === key), key);
  for (const id of ['pochta-uz','uzpost-index-map','upu-uzbekistan-addressing-2019','uzbekistan-postal-index-open-data-2019','uzbekistan-open-data-terms','uzbekistan-open-data-registry-2026','uzbekistan-cadastre-agency','uzbekistan-state-real-estate-register','osm-uzbekistan']) assert.ok(format.openSourceIds?.includes(id));
});


test('China address metadata separates postal routing, delivery address code, civic names, buildings, Tianditu, territory, and AGID', () => {
  const format = loadFormat('CN');
  const rules = loadRules('CN');
  assert.equal(format.postalCode.format, 'NNNNNN');
  assert.equal(new RegExp(format.postalCode.regex).test('999999'), true);
  assert.equal(new RegExp(format.postalCode.regex).test('CN-999999'), false);
  assert.match(format.postalCode.source, /China Post.*UPU.*2013.*State Post Bureau.*41832.*39609.*Tianditu.*real-estate.*OpenStreetMap/i);
  assert.equal(rules.postalCode.required, true);
  assert.match(rules.postalCode.usage, /four-level six-digit.*delivery-region.*not.*polygon.*41832.*separate.*building-level.*rights-cleared.*AGID.*HK.*MO.*TW/i);
  for (const key of ['recipient', 'building', 'floor', 'unit', 'room', 'postOffice', 'poBox']) assert.ok(format.native.fields.some((item: any) => item.key === key));
  for (const id of ["china-postal-code","upu-china-addressing-2013","china-postal-and-address-code-response-2025","china-universal-delivery-address-code-gbt41832","china-address-geocode-gbt39609","china-geographical-names-regulation-2022","tianditu-china","china-geospatial-platform-management-2019","china-real-estate-query-rules-2024","osm-china"]) assert.ok(format.openSourceIds?.includes(id));
});

test('Kyrgyzstan address metadata separates operator directory and mobile objects, UPU, Address Register, cadastre, models, time, and AGID', () => {
  const format = loadFormat('KG'); const rules = loadRules('KG');
  assert.equal(format.postalCode?.format, 'NNNNNN');
  assert.equal(new RegExp(format.postalCode?.regex ?? '').test('799999'), true);
  assert.equal(new RegExp(format.postalCode?.regex ?? '').test('KG-799999'), false);
  assert.match(format.postalCode?.source ?? '', /Kyrgyz Post.*2025-10-16.*2025-10-28.*UPU.*03\/2019.*Address Register.*Cadastre.*Open Data.*CAIAG.*OpenStreetMap/i);
  assert.equal(rules.postalCode?.required, true); assert.match(rules.postalCode?.usage ?? '', /1\+3\+2.*delivery-network.*not.*polygon.*multiple.*mobile.*route.*street.*house.*building.*exact address-building relation.*AGID/i);
  for (const key of ['recipient','building','floor','unit','room','microdistrict','locality','district','province','postOffice','poBox']) assert.ok(format.native?.fields.some(item => item.key === key), key);
  for (const id of ['kyrgyz-post-new-postal-codes-2025','kyrgyz-post-address-guidance','upu-kyrgyzstan-addressing-2019','upu-kyrgyzstan-designated-operators','gosreg-kyrgyz-address-register','cadastre-kyrgyz-property-portal','data-gov-kg','caiag-geonode-kg','osm-kyrgyzstan']) assert.ok(format.openSourceIds?.includes(id));
  assert.equal(format.openSourceIds?.includes('nsdi-kyrgyzstan'), false);
});

test('Cambodia address metadata separates Prakas 77 assignments, administrative GIS, civic buildings, cadastre, time, and AGID', () => {
  const format = loadFormat('KH');
  const rules = loadRules('KH');
  assert.equal(format.postalCode.format, 'NNNNNN');
  assert.equal(new RegExp(format.postalCode.regex).test('999999'), true);
  assert.equal(new RegExp(format.postalCode.regex).test('KH-999999'), false);
  assert.equal(new RegExp(format.postalCode.regex).test('99999'), false);
  assert.match(format.postalCode.source, /MPTC.*Prakas No\. 77.*UPU.*11\/2018.*Cambodia Post.*NCDD.*MLMUPC.*ODC.*OpenStreetMap/i);
  assert.equal(rules.postalCode.required, true);
  assert.match(rules.postalCode.usage, /PP0000.*PPDD00.*PPDDCC.*administrative.*does not.*official postal geometry.*building relation.*legacy.*village.*civic.*cadastral.*AGID.*rights-cleared/i);
  for (const key of ['recipient', 'building', 'floor', 'unit', 'room', 'village', 'commune', 'district', 'province', 'postOffice', 'poBox']) assert.ok(format.native.fields.some((item: any) => item.key === key));
  for (const id of ["cambodia-post","mptc-cambodia-prakas-77-2025","upu-cambodia-addressing-2018","ncdd-cambodia-gazetteer","mlmupc-cambodia-cadastral-services","mlmupc-cambodia-building-services","odc-cambodia-postal-codes","osm-cambodia"]) assert.ok(format.openSourceIds?.includes(id));
});

test('United States address metadata separates USPS delivery objects, ZCTA, civic addresses, buildings, jurisdiction, privacy, time, and AGID', () => {
  const format = loadFormat('US'); const rules = loadRules('US');
  const expected = ['usps-web-tools','usps-ais-products','usps-publication-28-2024','usps-zip-code-lookup','us-census-zcta-2020','us-census-tiger-line','us-census-geocoder','usdot-national-address-database','usgs-national-structures-dataset','hud-usps-zip-crosswalk','osm-united-states'];
  assert.equal(format.postalCode?.format, 'NNNNN or NNNNN-NNNN'); assert.equal(format.postalCode?.regex, '^\\d{5}(?:-\\d{4})?$');
  assert.match(format.postalCode?.source ?? '', /USPS.*Addresses 3\.0.*AIS.*Publication 28.*2024.*Census ZCTA.*TIGER.*NAD.*USGS.*HUD.*OpenStreetMap/i);
  assert.match(rules.postalCode?.usage ?? '', /delivery-network.*P\.O\. Box.*military.*no polygon.*ZCTA.*not a USPS.*address-building relation.*Puerto Rico.*APO\/FPO\/DPO.*AGID/i);
  for (const key of ['recipient','attention','organization','building','houseNumber','secondaryUnitDesignator','unit','ruralRoute','highwayContractRoute','poBox','generalDelivery','urbanization','county']) assert.ok(format.native?.fields.some(item => item.key === key), key);
  for (const id of expected) { assert.ok(format.openSourceIds?.includes(id), id); assert.ok(rules.openSourceIds?.includes(id), id); }
  assert.ok(rules.regionalHierarchy.includes('explicitAddressLinkedBuilding')); assert.ok(rules.regionalHierarchy.includes('agidIndependentSpatialIndex'));
});

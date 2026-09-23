import { readFileSync,writeFileSync } from 'node:fs';
import { join } from 'node:path';

type ComnapFeature = {
  type: 'Feature';
  id: number;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    Record_ID_: number;
    English_Name: string | null;
    Official_Name: string | null;
    Operator__primary_: string | null;
    Operator__additional_: string | null;
    Type: string | null;
    Seasonality: string | null;
    Status: string | null;
    Year_Established: number | null;
    Antarctic_Region: string | null;
    Latitude__DD_: number;
    Longitude__DD_: number;
    Latitude__DDM_: string | null;
    Longitude__DDM_: string | null;
    Elevation__meters_: number | null;
    Peak_Population: number | null;
    Date_Modified: number | null;
  };
};

type ComnapFeatureCollection = {
  type: 'FeatureCollection';
  features: ComnapFeature[];
};

const operatorCountryCodes: Record<string, string> = {
  Argentina: 'AR',
  Australia: 'AU',
  Belgium: 'BE',
  Brazil: 'BR',
  Bulgaria: 'BG',
  Chile: 'CL',
  China: 'CN',
  'Czech Republic': 'CZ',
  Ecuador: 'EC',
  Finland: 'FI',
  France: 'FR',
  Germany: 'DE',
  India: 'IN',
  Italy: 'IT',
  Japan: 'JP',
  Netherlands: 'NL',
  'New Zealand': 'NZ',
  Norway: 'NO',
  Peru: 'PE',
  Poland: 'PL',
  'Republic of Belarus': 'BY',
  'Republic of Korea': 'KR',
  Russia: 'RU',
  'South Africa': 'ZA',
  Spain: 'ES',
  Sweden: 'SE',
  'Türkiye': 'TR',
  Ukraine: 'UA',
  'United Kingdom': 'GB',
  'United States': 'US',
  Uruguay: 'UY',
};

const sourcePath = process.argv[2] ?? join('C:', 'tmp', 'COMNAP_Antarctic_Facilities_Master.json');
const outPath = join(process.cwd(), 'src', 'data', 'antarcticResearchStations.json');

function normalizeText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function displayName(value: string | null | undefined) {
  return normalizeText(value)
    .replace(/\bAntartic\b/g, 'Antarctic')
    .replace(/\bAntartica\b/g, 'Antarctica');
}

function slug(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function splitAdditionalOperators(value: string | null | undefined) {
  return normalizeText(value)
    .split(/[;,]/)
    .map(part => part.trim())
    .filter(Boolean);
}

const source = JSON.parse(readFileSync(sourcePath, 'utf8')) as ComnapFeatureCollection;

const facilities = source.features
  .map(feature => {
    const props = feature.properties;
    const name = displayName(props.English_Name || props.Official_Name);
    const officialName = normalizeText(props.Official_Name);
    const operatorCountry = normalizeText(props.Operator__primary_) || null;
    const lat = Number(props.Latitude__DD_ ?? feature.geometry.coordinates[1]);
    const lon = Number(props.Longitude__DD_ ?? feature.geometry.coordinates[0]);
    const additionalOperators = splitAdditionalOperators(props.Operator__additional_)
      .filter(operator => operator !== operatorCountry);
    const modified = props.Date_Modified ? new Date(props.Date_Modified).toISOString() : null;

    return {
      id: `comnap-${props.Record_ID_}-${slug(name)}`,
      sourceRecordId: props.Record_ID_,
      name,
      sourceEnglishName: normalizeText(props.English_Name),
      officialName: officialName || null,
      aliases: officialName && officialName !== name ? [officialName] : [],
      operatorCountry,
      operatorCountryCode: operatorCountry ? operatorCountryCodes[operatorCountry] ?? null : null,
      additionalOperators,
      type: normalizeText(props.Type).toLowerCase().replace(/\s+/g, '-'),
      seasonality: normalizeText(props.Seasonality).toLowerCase().replace(/\s+/g, '-'),
      status: normalizeText(props.Status).toLowerCase().replace(/\s+/g, '-'),
      yearEstablished: props.Year_Established ?? null,
      antarcticRegion: normalizeText(props.Antarctic_Region) || null,
      coordinates: {
        lat,
        lon,
        latDdm: normalizeText(props.Latitude__DDM_) || null,
        lonDdm: normalizeText(props.Longitude__DDM_) || null,
      },
      elevationMeters: props.Elevation__meters_ ?? null,
      peakPopulation: props.Peak_Population ?? null,
      insideAntarcticTreatyArea: lat <= -60,
      addressComponents: {
        stationOrBase: name,
        region: normalizeText(props.Antarctic_Region) || null,
        country: 'Antarctica',
      },
      sourceIds: ['comnap-antarctic-facilities'],
      sourceModifiedAt: modified,
    };
  })
  .sort((left, right) => {
    const operator = (left.operatorCountry ?? '').localeCompare(right.operatorCountry ?? '');
    if (operator !== 0) return operator;
    return left.name.localeCompare(right.name);
  });

const output = {
  datasetId: 'antarctic-research-facilities',
  version: 1,
  generatedAt: '2026-06-03',
  scope: {
    regionCode: 'AQ',
    description: 'Normalized Antarctic and sub-Antarctic research facilities for station/base address candidates.',
    treatyAreaLatitudeLimit: -60,
    includedStatuses: ['open', 'temporarily-closed'],
    includedTypes: [...new Set(facilities.map(facility => facility.type))].sort(),
  },
  sources: [
    {
      id: 'comnap-antarctic-facilities',
      name: 'COMNAP Antarctic Facilities',
      url: 'https://github.com/PolarGeospatialCenter/comnap-antarctic-facilities',
      sourceVersion: '3.5.0',
      releaseDate: '2024-03-15',
      license: 'COMNAP terms: educational and non-commercial use only; preserve source attribution.',
      role: 'primary-facility-list',
    },
    {
      id: 'scar-cga',
      name: 'SCAR Composite Gazetteer of Antarctica',
      url: 'https://data.aad.gov.au/aadc/gaz/scar/',
      sourceVersion: 'updated 2026',
      license: 'Creative Commons Attribution 4.0',
      role: 'place-name-validation',
    },
    {
      id: 'bas-antarctic-station-map',
      name: 'BAS Antarctic year-round and seasonal research stations map',
      url: 'https://data.bas.ac.uk/items/a4560740-70bb-4a2a-8ba5-ff4cc1774178/',
      sourceVersion: 'edition 1, published 2026-01-23',
      license: 'Open Government Licence 3.0 for BAS map product; underlying station list cites COMNAP.',
      role: 'cartographic-validation',
    },
    {
      id: 'osm-overpass',
      name: 'OpenStreetMap Overpass',
      url: 'https://overpass-api.de/',
      license: 'ODbL',
      role: 'runtime-local-feature-validation',
    },
  ],
  sourceIds: ['comnap-antarctic-facilities', 'scar-cga', 'bas-antarctic-station-map', 'osm-overpass'],
  licenseWarning:
    'This JSON preserves COMNAP attribution and terms. Do not treat the station list as MIT-licensed application code.',
  addressCandidatePolicy: {
    primaryKey: 'stationOrBase',
    coordinateUse: 'candidate-generation-and-nearest-station-fallback',
    postalRouting:
      'Use station/base names as Antarctic address candidates; postal code and mail routing remain operator-country dependent.',
    validationOrder: ['comnap-antarctic-facilities', 'scar-cga', 'osm-overpass', 'bas-antarctic-station-map'],
  },
  facilities,
};

writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Generated ${facilities.length} Antarctic facilities at ${outPath}`);

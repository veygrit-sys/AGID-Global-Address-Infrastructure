export const US_STATE_REPOSITORY_PACK_VERSION = 'us-state-repository-pack-v0.1';

export type UsStateBoundarySeed = {
  bbox: {
    west: number;
    south: number;
    east: number;
    north: number;
    precision: 'state-level-seed-bbox';
  };
  centroid: {
    lat: number;
    lon: number;
    precision: 'state-level-seed-centroid';
  };
  geometryRef: string;
  nonClaim: string;
};

export type UsStatePlaceSeed = {
  agidPlaceId: string;
  name: string;
  featureClass: 'state' | 'capital' | 'city';
  adminPath: string[];
  aliases: string[];
  approximateCentroid?: {
    lat: number;
    lon: number;
    precision: 'capital-seed-centroid';
  };
  validationState: 'seed-only' | 'source-linked' | 'license-review-required';
  notes: string[];
};

export type UsStateRepositorySource = {
  sourceId: string;
  name: string;
  url: string;
  provider: string;
  role: 'admin-boundary' | 'gazetteer' | 'postal-evidence' | 'geocoding' | 'reference';
  redistribution: 'metadata-link-only' | 'not-bundled';
  licenseStatus: 'public-government-review-current-terms' | 'restricted-api-do-not-bundle' | 'open-license-review-required';
  notes: string[];
};

export type UsStateRepositoryPack = {
  schemaVersion: typeof US_STATE_REPOSITORY_PACK_VERSION;
  repository: string;
  parentRepository: 'agid-country-us';
  owner: 'dawnportinfo-design';
  countryCode: 'US';
  countryName: 'United States';
  stateCode: string;
  stateName: string;
  stateSlug: string;
  officialStateId: string;
  generatedAt: string;
  purpose: string;
  privacyBoundary: {
    containsPersonalData: false;
    containsRawAddresses: false;
    containsProofSecrets: false;
    allowedData: string[];
  };
  geodata: {
    boundarySeed: UsStateBoundarySeed;
  };
  gazetteer: {
    placeSeeds: UsStatePlaceSeed[];
  };
  sources: UsStateRepositorySource[];
  qualityGates: string[];
  nonClaims: string[];
  nextImportTasks: string[];
};

type StateRow = {
  code: string;
  name: string;
  slug: string;
  fips: string;
  capital: string;
  capitalCentroid: [number, number];
  centroid: [number, number];
  bbox: [number, number, number, number];
  majorCities: string[];
};

const SOURCE_LEDGER: UsStateRepositorySource[] = [
  {
    sourceId: 'us-census-tiger-line',
    name: 'U.S. Census Bureau TIGER/Line and TIGERweb geography products',
    url: 'https://www.census.gov/programs-surveys/geography/guidance/tiger-data-products-guide.html',
    provider: 'U.S. Census Bureau',
    role: 'admin-boundary',
    redistribution: 'metadata-link-only',
    licenseStatus: 'public-government-review-current-terms',
    notes: [
      'Primary source to replace bbox seeds with legal/state boundary geometries after license and vintage review.',
      'ZCTA products are statistical approximations and must not be treated as USPS ZIP delivery areas.',
    ],
  },
  {
    sourceId: 'us-census-geocoder',
    name: 'U.S. Census Geocoding Services API',
    url: 'https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html',
    provider: 'U.S. Census Bureau',
    role: 'geocoding',
    redistribution: 'not-bundled',
    licenseStatus: 'public-government-review-current-terms',
    notes: [
      'Use for validation fixtures and geography evidence only.',
      'Do not store raw personal address queries or API response payloads in public AGID packs.',
    ],
  },
  {
    sourceId: 'usps-web-tools',
    name: 'USPS Addresses and ZIP lookup APIs',
    url: 'https://developers.usps.com/apis',
    provider: 'United States Postal Service',
    role: 'postal-evidence',
    redistribution: 'not-bundled',
    licenseStatus: 'restricted-api-do-not-bundle',
    notes: [
      'Authoritative postal operator source for deliverability checks and ZIP lookup under credentialed terms.',
      'This pack stores only source metadata; USPS responses, ZIP+4 records, and delivery-point payloads are not bundled.',
    ],
  },
  {
    sourceId: 'usgs-gnis',
    name: 'U.S. Geological Survey Geographic Names Information System',
    url: 'https://www.usgs.gov/tools/geographic-names-information-system-gnis',
    provider: 'U.S. Geological Survey',
    role: 'gazetteer',
    redistribution: 'metadata-link-only',
    licenseStatus: 'public-government-review-current-terms',
    notes: [
      'Primary gazetteer candidate for populated places, natural features, and variant names.',
      'Import should preserve source identifiers, feature classes, and provenance instead of flattening names.',
    ],
  },
  {
    sourceId: 'openstreetmap',
    name: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/',
    provider: 'OpenStreetMap contributors',
    role: 'reference',
    redistribution: 'metadata-link-only',
    licenseStatus: 'open-license-review-required',
    notes: [
      'Useful community reference for POI and routing context.',
      'Any OSM-derived geometry or database extract must follow ODbL attribution and share-alike requirements.',
    ],
  },
];

const STATE_ROWS: StateRow[] = [
  { code: 'AL', name: 'Alabama', slug: 'alabama', fips: '01', capital: 'Montgomery', capitalCentroid: [32.377716, -86.300568], centroid: [32.806671, -86.79113], bbox: [-88.473227, 30.223334, -84.88908, 35.008028], majorCities: ['Birmingham', 'Huntsville', 'Mobile', 'Tuscaloosa'] },
  { code: 'AK', name: 'Alaska', slug: 'alaska', fips: '02', capital: 'Juneau', capitalCentroid: [58.301598, -134.420212], centroid: [61.370716, -152.404419], bbox: [-179.148909, 51.214183, -129.979511, 71.365162], majorCities: ['Anchorage', 'Fairbanks', 'Sitka', 'Ketchikan'] },
  { code: 'AZ', name: 'Arizona', slug: 'arizona', fips: '04', capital: 'Phoenix', capitalCentroid: [33.448143, -112.096962], centroid: [33.729759, -111.431221], bbox: [-114.81651, 31.332177, -109.045223, 37.00426], majorCities: ['Phoenix', 'Tucson', 'Mesa', 'Flagstaff'] },
  { code: 'AR', name: 'Arkansas', slug: 'arkansas', fips: '05', capital: 'Little Rock', capitalCentroid: [34.746613, -92.288986], centroid: [34.969704, -92.373123], bbox: [-94.617919, 33.004106, -89.644395, 36.4996], majorCities: ['Little Rock', 'Fort Smith', 'Fayetteville', 'Jonesboro'] },
  { code: 'CA', name: 'California', slug: 'california', fips: '06', capital: 'Sacramento', capitalCentroid: [38.576668, -121.493629], centroid: [36.116203, -119.681564], bbox: [-124.409591, 32.534156, -114.131211, 42.009518], majorCities: ['Los Angeles', 'San Diego', 'San Jose', 'San Francisco'] },
  { code: 'CO', name: 'Colorado', slug: 'colorado', fips: '08', capital: 'Denver', capitalCentroid: [39.739227, -104.984856], centroid: [39.059811, -105.311104], bbox: [-109.060253, 36.992426, -102.041524, 41.003444], majorCities: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins'] },
  { code: 'CT', name: 'Connecticut', slug: 'connecticut', fips: '09', capital: 'Hartford', capitalCentroid: [41.764046, -72.682198], centroid: [41.597782, -72.755371], bbox: [-73.727775, 40.980144, -71.786994, 42.050587], majorCities: ['Bridgeport', 'New Haven', 'Stamford', 'Waterbury'] },
  { code: 'DE', name: 'Delaware', slug: 'delaware', fips: '10', capital: 'Dover', capitalCentroid: [39.157307, -75.519722], centroid: [39.318523, -75.507141], bbox: [-75.788658, 38.451013, -75.048939, 39.839007], majorCities: ['Wilmington', 'Dover', 'Newark', 'Middletown'] },
  { code: 'FL', name: 'Florida', slug: 'florida', fips: '12', capital: 'Tallahassee', capitalCentroid: [30.438118, -84.281296], centroid: [27.766279, -81.686783], bbox: [-87.634938, 24.396308, -80.031362, 31.000968], majorCities: ['Jacksonville', 'Miami', 'Tampa', 'Orlando'] },
  { code: 'GA', name: 'Georgia', slug: 'georgia', fips: '13', capital: 'Atlanta', capitalCentroid: [33.749027, -84.388229], centroid: [33.040619, -83.643074], bbox: [-85.605165, 30.355757, -80.839729, 35.000659], majorCities: ['Atlanta', 'Augusta', 'Columbus', 'Savannah'] },
  { code: 'HI', name: 'Hawaii', slug: 'hawaii', fips: '15', capital: 'Honolulu', capitalCentroid: [21.307442, -157.857376], centroid: [21.094318, -157.498337], bbox: [-178.334698, 18.910361, -154.806773, 28.402123], majorCities: ['Honolulu', 'Hilo', 'Kailua', 'Kapolei'] },
  { code: 'ID', name: 'Idaho', slug: 'idaho', fips: '16', capital: 'Boise', capitalCentroid: [43.617775, -116.199722], centroid: [44.240459, -114.478828], bbox: [-117.243027, 42.000709, -111.043564, 49.001146], majorCities: ['Boise', 'Meridian', 'Nampa', 'Idaho Falls'] },
  { code: 'IL', name: 'Illinois', slug: 'illinois', fips: '17', capital: 'Springfield', capitalCentroid: [39.798363, -89.654961], centroid: [40.349457, -88.986137], bbox: [-91.513079, 36.970298, -87.494756, 42.508481], majorCities: ['Chicago', 'Aurora', 'Naperville', 'Rockford'] },
  { code: 'IN', name: 'Indiana', slug: 'indiana', fips: '18', capital: 'Indianapolis', capitalCentroid: [39.768623, -86.162643], centroid: [39.849426, -86.258278], bbox: [-88.09776, 37.771742, -84.784579, 41.760592], majorCities: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend'] },
  { code: 'IA', name: 'Iowa', slug: 'iowa', fips: '19', capital: 'Des Moines', capitalCentroid: [41.591087, -93.603729], centroid: [42.011539, -93.210526], bbox: [-96.639704, 40.375501, -90.140061, 43.501196], majorCities: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City'] },
  { code: 'KS', name: 'Kansas', slug: 'kansas', fips: '20', capital: 'Topeka', capitalCentroid: [39.048191, -95.677956], centroid: [38.5266, -96.726486], bbox: [-102.051744, 36.993016, -94.588413, 40.003162], majorCities: ['Wichita', 'Overland Park', 'Kansas City', 'Olathe'] },
  { code: 'KY', name: 'Kentucky', slug: 'kentucky', fips: '21', capital: 'Frankfort', capitalCentroid: [38.186722, -84.875374], centroid: [37.66814, -84.670067], bbox: [-89.571509, 36.497129, -81.964971, 39.147458], majorCities: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro'] },
  { code: 'LA', name: 'Louisiana', slug: 'louisiana', fips: '22', capital: 'Baton Rouge', capitalCentroid: [30.457069, -91.187393], centroid: [31.169546, -91.867805], bbox: [-94.043147, 28.928609, -88.817017, 33.019457], majorCities: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette'] },
  { code: 'ME', name: 'Maine', slug: 'maine', fips: '23', capital: 'Augusta', capitalCentroid: [44.307167, -69.781693], centroid: [44.693947, -69.381927], bbox: [-71.083924, 43.06417, -66.949895, 47.459686], majorCities: ['Portland', 'Lewiston', 'Bangor', 'South Portland'] },
  { code: 'MD', name: 'Maryland', slug: 'maryland', fips: '24', capital: 'Annapolis', capitalCentroid: [38.978764, -76.490936], centroid: [39.063946, -76.802101], bbox: [-79.487651, 37.911717, -75.048939, 39.723043], majorCities: ['Baltimore', 'Frederick', 'Rockville', 'Gaithersburg'] },
  { code: 'MA', name: 'Massachusetts', slug: 'massachusetts', fips: '25', capital: 'Boston', capitalCentroid: [42.358162, -71.063698], centroid: [42.230171, -71.530106], bbox: [-73.508142, 41.237964, -69.928393, 42.886589], majorCities: ['Boston', 'Worcester', 'Springfield', 'Cambridge'] },
  { code: 'MI', name: 'Michigan', slug: 'michigan', fips: '26', capital: 'Lansing', capitalCentroid: [42.733635, -84.555328], centroid: [43.326618, -84.536095], bbox: [-90.418136, 41.696118, -82.413474, 48.306063], majorCities: ['Detroit', 'Grand Rapids', 'Warren', 'Ann Arbor'] },
  { code: 'MN', name: 'Minnesota', slug: 'minnesota', fips: '27', capital: 'Saint Paul', capitalCentroid: [44.955097, -93.102211], centroid: [45.694454, -93.900192], bbox: [-97.239209, 43.499356, -89.491739, 49.384358], majorCities: ['Minneapolis', 'Saint Paul', 'Rochester', 'Duluth'] },
  { code: 'MS', name: 'Mississippi', slug: 'mississippi', fips: '28', capital: 'Jackson', capitalCentroid: [32.303848, -90.182106], centroid: [32.741646, -89.678696], bbox: [-91.655009, 30.173943, -88.097888, 34.996052], majorCities: ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg'] },
  { code: 'MO', name: 'Missouri', slug: 'missouri', fips: '29', capital: 'Jefferson City', capitalCentroid: [38.579201, -92.172935], centroid: [38.456085, -92.288368], bbox: [-95.774704, 35.995683, -89.098843, 40.61364], majorCities: ['Kansas City', 'Saint Louis', 'Springfield', 'Columbia'] },
  { code: 'MT', name: 'Montana', slug: 'montana', fips: '30', capital: 'Helena', capitalCentroid: [46.585709, -112.018417], centroid: [46.921925, -110.454353], bbox: [-116.050003, 44.358221, -104.039138, 49.00139], majorCities: ['Billings', 'Missoula', 'Great Falls', 'Bozeman'] },
  { code: 'NE', name: 'Nebraska', slug: 'nebraska', fips: '31', capital: 'Lincoln', capitalCentroid: [40.808075, -96.699654], centroid: [41.12537, -98.268082], bbox: [-104.053514, 39.999998, -95.30829, 43.001708], majorCities: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island'] },
  { code: 'NV', name: 'Nevada', slug: 'nevada', fips: '32', capital: 'Carson City', capitalCentroid: [39.163914, -119.766121], centroid: [38.313515, -117.055374], bbox: [-120.005746, 35.001857, -114.039648, 42.002207], majorCities: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas'] },
  { code: 'NH', name: 'New Hampshire', slug: 'new-hampshire', fips: '33', capital: 'Concord', capitalCentroid: [43.206898, -71.537994], centroid: [43.452492, -71.563896], bbox: [-72.557247, 42.69699, -70.610621, 45.305476], majorCities: ['Manchester', 'Nashua', 'Concord', 'Derry'] },
  { code: 'NJ', name: 'New Jersey', slug: 'new-jersey', fips: '34', capital: 'Trenton', capitalCentroid: [40.220596, -74.769913], centroid: [40.298904, -74.521011], bbox: [-75.559614, 38.928519, -73.893979, 41.357423], majorCities: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth'] },
  { code: 'NM', name: 'New Mexico', slug: 'new-mexico', fips: '35', capital: 'Santa Fe', capitalCentroid: [35.68224, -105.939728], centroid: [34.840515, -106.248482], bbox: [-109.050173, 31.332301, -103.001964, 37.000232], majorCities: ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Roswell'] },
  { code: 'NY', name: 'New York', slug: 'new-york', fips: '36', capital: 'Albany', capitalCentroid: [42.652843, -73.757874], centroid: [42.165726, -74.948051], bbox: [-79.762152, 40.477399, -71.856214, 45.015865], majorCities: ['New York City', 'Buffalo', 'Rochester', 'Yonkers'] },
  { code: 'NC', name: 'North Carolina', slug: 'north-carolina', fips: '37', capital: 'Raleigh', capitalCentroid: [35.78043, -78.639099], centroid: [35.630066, -79.806419], bbox: [-84.321869, 33.842316, -75.460621, 36.588117], majorCities: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham'] },
  { code: 'ND', name: 'North Dakota', slug: 'north-dakota', fips: '38', capital: 'Bismarck', capitalCentroid: [46.82085, -100.783318], centroid: [47.528912, -99.784012], bbox: [-104.0489, 45.935054, -96.554507, 49.000692], majorCities: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot'] },
  { code: 'OH', name: 'Ohio', slug: 'ohio', fips: '39', capital: 'Columbus', capitalCentroid: [39.961346, -82.999069], centroid: [40.388783, -82.764915], bbox: [-84.820159, 38.403202, -80.518693, 41.977523], majorCities: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo'] },
  { code: 'OK', name: 'Oklahoma', slug: 'oklahoma', fips: '40', capital: 'Oklahoma City', capitalCentroid: [35.492207, -97.503342], centroid: [35.565342, -96.928917], bbox: [-103.002565, 33.615833, -94.430662, 37.002206], majorCities: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow'] },
  { code: 'OR', name: 'Oregon', slug: 'oregon', fips: '41', capital: 'Salem', capitalCentroid: [44.938461, -123.030403], centroid: [44.572021, -122.070938], bbox: [-124.566244, 41.991794, -116.463504, 46.292035], majorCities: ['Portland', 'Eugene', 'Salem', 'Gresham'] },
  { code: 'PA', name: 'Pennsylvania', slug: 'pennsylvania', fips: '42', capital: 'Harrisburg', capitalCentroid: [40.264378, -76.883598], centroid: [40.590752, -77.209755], bbox: [-80.519891, 39.7198, -74.689516, 42.26986], majorCities: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie'] },
  { code: 'RI', name: 'Rhode Island', slug: 'rhode-island', fips: '44', capital: 'Providence', capitalCentroid: [41.830914, -71.414963], centroid: [41.680893, -71.51178], bbox: [-71.862772, 41.146339, -71.12057, 42.018798], majorCities: ['Providence', 'Warwick', 'Cranston', 'Pawtucket'] },
  { code: 'SC', name: 'South Carolina', slug: 'south-carolina', fips: '45', capital: 'Columbia', capitalCentroid: [34.000343, -81.033211], centroid: [33.856892, -80.945007], bbox: [-83.353928, 32.0346, -78.54203, 35.215402], majorCities: ['Charleston', 'Columbia', 'North Charleston', 'Mount Pleasant'] },
  { code: 'SD', name: 'South Dakota', slug: 'south-dakota', fips: '46', capital: 'Pierre', capitalCentroid: [44.367031, -100.346405], centroid: [44.299782, -99.438828], bbox: [-104.057698, 42.479635, -96.436589, 45.94545], majorCities: ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings'] },
  { code: 'TN', name: 'Tennessee', slug: 'tennessee', fips: '47', capital: 'Nashville', capitalCentroid: [36.16581, -86.784241], centroid: [35.747845, -86.692345], bbox: [-90.310298, 34.982972, -81.6469, 36.678118], majorCities: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga'] },
  { code: 'TX', name: 'Texas', slug: 'texas', fips: '48', capital: 'Austin', capitalCentroid: [30.27467, -97.740349], centroid: [31.054487, -97.563461], bbox: [-106.645646, 25.837377, -93.508292, 36.500704], majorCities: ['Houston', 'San Antonio', 'Dallas', 'Fort Worth'] },
  { code: 'UT', name: 'Utah', slug: 'utah', fips: '49', capital: 'Salt Lake City', capitalCentroid: [40.777477, -111.888237], centroid: [40.150032, -111.862434], bbox: [-114.052962, 36.997968, -109.041058, 42.001567], majorCities: ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan'] },
  { code: 'VT', name: 'Vermont', slug: 'vermont', fips: '50', capital: 'Montpelier', capitalCentroid: [44.262436, -72.580536], centroid: [44.045876, -72.710686], bbox: [-73.43774, 42.726853, -71.464555, 45.016659], majorCities: ['Burlington', 'South Burlington', 'Rutland', 'Barre'] },
  { code: 'VA', name: 'Virginia', slug: 'virginia', fips: '51', capital: 'Richmond', capitalCentroid: [37.538857, -77.43364], centroid: [37.769337, -78.169968], bbox: [-83.675395, 36.540739, -75.242266, 39.466012], majorCities: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Arlington'] },
  { code: 'WA', name: 'Washington', slug: 'washington', fips: '53', capital: 'Olympia', capitalCentroid: [47.035805, -122.905014], centroid: [47.400902, -121.490494], bbox: [-124.848974, 45.543541, -116.916071, 49.002494], majorCities: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver'] },
  { code: 'WV', name: 'West Virginia', slug: 'west-virginia', fips: '54', capital: 'Charleston', capitalCentroid: [38.336246, -81.612328], centroid: [38.491226, -80.954453], bbox: [-82.644739, 37.201483, -77.719519, 40.638801], majorCities: ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg'] },
  { code: 'WI', name: 'Wisconsin', slug: 'wisconsin', fips: '55', capital: 'Madison', capitalCentroid: [43.074684, -89.384445], centroid: [44.268543, -89.616508], bbox: [-92.888114, 42.491983, -86.805415, 47.080621], majorCities: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha'] },
  { code: 'WY', name: 'Wyoming', slug: 'wyoming', fips: '56', capital: 'Cheyenne', capitalCentroid: [41.140259, -104.820236], centroid: [42.755966, -107.30249], bbox: [-111.056888, 40.994746, -104.05216, 45.005904], majorCities: ['Cheyenne', 'Casper', 'Laramie', 'Gillette'] },
];

function agidPlaceId(stateCode: string, name: string) {
  return `agid:place:US:${stateCode.toLowerCase()}:${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
}

function placeSeed(row: StateRow, name: string, featureClass: UsStatePlaceSeed['featureClass']): UsStatePlaceSeed {
  const isCapital = featureClass === 'capital';
  return {
    agidPlaceId: agidPlaceId(row.code, name),
    name,
    featureClass,
    adminPath: ['United States', row.name],
    aliases: isCapital ? [`${name}, ${row.code}`] : [name],
    approximateCentroid: isCapital
      ? {
          lat: row.capitalCentroid[0],
          lon: row.capitalCentroid[1],
          precision: 'capital-seed-centroid',
        }
      : undefined,
    validationState: featureClass === 'state' ? 'source-linked' : 'seed-only',
    notes: [
      featureClass === 'state'
        ? 'State seed is linked to Census TIGER state metadata and should be replaced with reviewed boundary geometry before production use.'
        : 'Place seed is a starter gazetteer entry; add GNIS/Census/OSM source identifiers before treating it as verified.',
    ],
  };
}

export function buildUsStateRepositoryPacks(generatedAt = '2026-07-02T00:00:00.000Z'): UsStateRepositoryPack[] {
  return STATE_ROWS.map(row => ({
    schemaVersion: US_STATE_REPOSITORY_PACK_VERSION,
    repository: `agid-us-${row.slug}`,
    parentRepository: 'agid-country-us',
    owner: 'dawnportinfo-design',
    countryCode: 'US',
    countryName: 'United States',
    stateCode: row.code,
    stateName: row.name,
    stateSlug: row.slug,
    officialStateId: `state-${row.code.toLowerCase()}`,
    generatedAt,
    purpose: 'GitHub-ready state repository seed for AGID geography, gazetteer, source policy, and conformance fixtures.',
    privacyBoundary: {
      containsPersonalData: false,
      containsRawAddresses: false,
      containsProofSecrets: false,
      allowedData: [
        'state-level names and identifiers',
        'state-level bbox and centroid seeds',
        'capital centroid seed',
        'major city name seeds',
        'source metadata and import policy',
      ],
    },
    geodata: {
      boundarySeed: {
        bbox: {
          west: row.bbox[0],
          south: row.bbox[1],
          east: row.bbox[2],
          north: row.bbox[3],
          precision: 'state-level-seed-bbox',
        },
        centroid: {
          lat: row.centroid[0],
          lon: row.centroid[1],
          precision: 'state-level-seed-centroid',
        },
        geometryRef: `source-required://us/census/tiger/state/${row.fips}`,
        nonClaim: 'This bbox/centroid seed is not a legal boundary, cadastral boundary, delivery boundary, or routing polygon.',
      },
    },
    gazetteer: {
      placeSeeds: [
        placeSeed(row, row.name, 'state'),
        placeSeed(row, row.capital, 'capital'),
        ...row.majorCities
          .filter(name => name !== row.capital)
          .map(name => placeSeed(row, name, 'city')),
      ],
    },
    sources: SOURCE_LEDGER,
    qualityGates: [
      'no-raw-personal-addresses',
      'source-ledger-present',
      'state-bbox-centroid-present',
      'capital-seed-present',
      'major-city-seeds-present',
      'official-geometry-import-pending',
      'postal-operator-data-not-bundled',
      'license-review-before-geometry-import',
    ],
    nonClaims: [
      'Not a complete address dataset.',
      'Not a USPS ZIP Code or delivery-point dataset.',
      'Not a legal boundary product.',
      'Not proof that every city seed is source-verified.',
      'Not a substitute for official Census, USPS, state, county, or municipal systems.',
    ],
    nextImportTasks: [
      'Attach reviewed TIGER/Line state boundary vintage and checksum.',
      'Import GNIS/Census place identifiers for every place seed.',
      'Add county-level and incorporated-place conformance fixtures.',
      'Add ZIP/ZCTA compatibility tests without bundling USPS restricted payloads.',
      'Add routing and POI graph links only after source-license review.',
    ],
  }));
}

export function validateUsStateRepositoryPacks(packs: UsStateRepositoryPack[]) {
  const errors: string[] = [];
  const repositories = new Set<string>();
  const stateCodes = new Set<string>();

  if (packs.length !== 50) errors.push(`Expected 50 state packs, received ${packs.length}.`);

  for (const pack of packs) {
    if (pack.schemaVersion !== US_STATE_REPOSITORY_PACK_VERSION) errors.push(`${pack.repository}: invalid schema version.`);
    if (!/^agid-us-[a-z0-9-]+$/.test(pack.repository)) errors.push(`${pack.repository}: invalid repository name.`);
    if (repositories.has(pack.repository)) errors.push(`${pack.repository}: duplicate repository.`);
    repositories.add(pack.repository);

    if (stateCodes.has(pack.stateCode)) errors.push(`${pack.repository}: duplicate state code ${pack.stateCode}.`);
    stateCodes.add(pack.stateCode);

    if (pack.privacyBoundary.containsPersonalData || pack.privacyBoundary.containsRawAddresses || pack.privacyBoundary.containsProofSecrets) {
      errors.push(`${pack.repository}: privacy boundary must remain public-safe.`);
    }

    const { bbox, centroid } = pack.geodata.boundarySeed;
    if (!(bbox.west < bbox.east && bbox.south < bbox.north)) errors.push(`${pack.repository}: invalid bbox.`);
    if (centroid.lat < bbox.south || centroid.lat > bbox.north || centroid.lon < bbox.west || centroid.lon > bbox.east) {
      errors.push(`${pack.repository}: centroid is outside bbox.`);
    }

    const placeNames = pack.gazetteer.placeSeeds.map(place => place.name);
    if (!placeNames.includes(pack.stateName)) errors.push(`${pack.repository}: missing state place seed.`);
    if (!pack.gazetteer.placeSeeds.some(place => place.featureClass === 'capital')) errors.push(`${pack.repository}: missing capital seed.`);
    if (pack.gazetteer.placeSeeds.filter(place => place.featureClass === 'city').length < 3) {
      errors.push(`${pack.repository}: expected at least 3 major city seeds.`);
    }

    const sourceIds = new Set(pack.sources.map(source => source.sourceId));
    for (const required of ['us-census-tiger-line', 'usps-web-tools', 'usgs-gnis']) {
      if (!sourceIds.has(required)) errors.push(`${pack.repository}: missing source ${required}.`);
    }
  }

  return errors;
}

export function summarizeUsStateRepositoryPacks(packs = buildUsStateRepositoryPacks()) {
  return {
    version: US_STATE_REPOSITORY_PACK_VERSION,
    stateRepositoryCount: packs.length,
    placeSeedCount: packs.reduce((sum, pack) => sum + pack.gazetteer.placeSeeds.length, 0),
    geodataSeedCount: packs.length,
    sourceIds: Array.from(new Set(packs.flatMap(pack => pack.sources.map(source => source.sourceId)))).sort(),
    repositories: packs.map(pack => pack.repository),
  };
}


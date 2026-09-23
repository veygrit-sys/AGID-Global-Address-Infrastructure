export type PolarOpenGeoSourceId =
  | 'australian-antarctic-program-himi'
  | 'nsidc-polar-data'
  | 'gebco-bathymetry'
  | 'gmrt-topography'
  | 'marine-regions'
  | 'protected-planet-wdpa'
  | 'gbif-occurrence'
  | 'obis-marine-biodiversity'
  | 'scar-add'
  | 'scar-cga'
  | 'quantarctica'
  | 'rema-antarctica'
  | 'bedmap3-antarctica'
  | 'ibcso-southern-ocean'
  | 'measures-antarctic-grounding-line'
  | 'ats-antarctic-protected-areas'
  | 'comnap-antarctic-facilities'
  | 'bas-antarctic-station-map'
  | 'arcticdem'
  | 'ibcao-arctic-ocean'
  | 'glims-glacier-db'
  | 'npolar-data-centre'
  | 'greenland-gimp';

export interface PolarOpenGeoSource {
  id: PolarOpenGeoSourceId;
  name: string;
  url: string;
  kind:
    | 'data-catalog'
    | 'elevation'
    | 'bathymetry'
    | 'gazetteer'
    | 'marine'
    | 'cryosphere'
    | 'protected-area'
    | 'facility'
    | 'biodiversity'
    | 'topography';
  coverage: 'polar' | 'antarctic' | 'arctic' | 'greenland' | 'global';
  usage: 'primary' | 'fallback' | 'validation' | 'reference';
  license?: string;
  notes: string;
}

export const POLAR_OPEN_GEO_SOURCES: Record<PolarOpenGeoSourceId, PolarOpenGeoSource> = {
  'australian-antarctic-program-himi': {
    id: 'australian-antarctic-program-himi',
    name: 'Australian Antarctic Program HIMI',
    url: 'https://www.antarctica.gov.au/about-antarctica/australia-in-antarctica/the-territory-of-heard-island-and-mcdonald-islands/',
    kind: 'data-catalog',
    coverage: 'antarctic',
    usage: 'reference',
    notes: 'Official Australian Antarctic Program territory and governance reference for Heard Island and McDonald Islands context, protection status, and current administration.',
  },
  'nsidc-polar-data': {
    id: 'nsidc-polar-data',
    name: 'National Snow and Ice Data Center',
    url: 'https://nsidc.org/data/explore-data',
    kind: 'cryosphere',
    coverage: 'polar',
    usage: 'primary',
    notes: 'Polar snow, ice, glacier, sea-ice, grounding-line, and remote-sensing data catalogue for Arctic and Antarctic context.',
  },
  'gebco-bathymetry': {
    id: 'gebco-bathymetry',
    name: 'GEBCO Gridded Bathymetry',
    url: 'https://www.gebco.net/data_and_products/gridded_bathymetry_data/',
    kind: 'bathymetry',
    coverage: 'global',
    usage: 'reference',
    license: 'GEBCO terms of use',
    notes: 'Global bathymetry and land elevation grid for polar oceans, continental shelves, ridges, trenches, and seafloor context.',
  },
  'gmrt-topography': {
    id: 'gmrt-topography',
    name: 'Global Multi-Resolution Topography',
    url: 'https://www.gmrt.org/',
    kind: 'topography',
    coverage: 'global',
    usage: 'reference',
    license: 'GMRT terms of use',
    notes: 'Marine and terrestrial topography synthesis for polar ridges, seamounts, coastal shelves, islands, and field logistics context.',
  },
  'marine-regions': {
    id: 'marine-regions',
    name: 'Marine Regions Gazetteer',
    url: 'https://www.marineregions.org/gazetteer.php?p=webservices',
    kind: 'marine',
    coverage: 'global',
    usage: 'reference',
    notes: 'Standardized marine place names, seas, ocean regions, and georeferenced marine boundaries for polar waterbody naming.',
  },
  'protected-planet-wdpa': {
    id: 'protected-planet-wdpa',
    name: 'Protected Planet WDPA',
    url: 'https://www.protectedplanet.net/en/thematic-areas/wdpa',
    kind: 'protected-area',
    coverage: 'global',
    usage: 'reference',
    license: 'UNEP-WCMC and IUCN terms',
    notes: 'Protected terrestrial and marine areas for polar reserves, wilderness values, islands, and conservation context.',
  },
  'gbif-occurrence': {
    id: 'gbif-occurrence',
    name: 'GBIF Occurrence API',
    url: 'https://techdocs.gbif.org/en/openapi/v1/occurrence',
    kind: 'biodiversity',
    coverage: 'global',
    usage: 'reference',
    license: 'Varies by dataset record',
    notes: 'Biodiversity occurrence evidence for polar wildlife, vegetation, microbial records, protected areas, and natural-place confidence.',
  },
  'obis-marine-biodiversity': {
    id: 'obis-marine-biodiversity',
    name: 'Ocean Biodiversity Information System',
    url: 'https://obis.org/data/access',
    kind: 'biodiversity',
    coverage: 'global',
    usage: 'reference',
    notes: 'Marine biodiversity occurrence data for the Arctic Ocean, Southern Ocean, Antarctic shelves, and subpolar seas.',
  },
  'scar-add': {
    id: 'scar-add',
    name: 'SCAR Antarctic Digital Database',
    url: 'https://www.add.scar.org/',
    kind: 'topography',
    coverage: 'antarctic',
    usage: 'primary',
    notes: 'Authoritative Antarctic vector topographic data for coastlines, rock outcrops, ice shelves, contours, and operations basemaps.',
  },
  'scar-cga': {
    id: 'scar-cga',
    name: 'SCAR Composite Gazetteer of Antarctica',
    url: 'https://data.aad.gov.au/aadc/gaz/scar/',
    kind: 'gazetteer',
    coverage: 'antarctic',
    usage: 'primary',
    notes: 'International Antarctic place-name gazetteer for mountains, glaciers, bays, capes, stations, and multilingual historical names.',
  },
  quantarctica: {
    id: 'quantarctica',
    name: 'Quantarctica',
    url: 'https://www.npolar.no/en/quantarctica/',
    kind: 'data-catalog',
    coverage: 'antarctic',
    usage: 'reference',
    license: 'CC BY 4.0 for package metadata; individual datasets vary',
    notes: 'Integrated QGIS data package for Antarctica, the Southern Ocean, and sub-Antarctic islands across basemap, terrain, glaciology, and ecology layers.',
  },
  'rema-antarctica': {
    id: 'rema-antarctica',
    name: 'Reference Elevation Model of Antarctica',
    url: 'https://www.pgc.umn.edu/data/rema/',
    kind: 'elevation',
    coverage: 'antarctic',
    usage: 'primary',
    notes: 'High-resolution Antarctic digital surface model for mountains, nunataks, ice shelves, station surroundings, and route planning.',
  },
  'bedmap3-antarctica': {
    id: 'bedmap3-antarctica',
    name: 'Bedmap3 Antarctica',
    url: 'https://data.bas.ac.uk/maps/bedmap3',
    kind: 'cryosphere',
    coverage: 'antarctic',
    usage: 'primary',
    notes: 'Antarctic surface elevation, ice thickness, seafloor, and subglacial bed grids for mountain, ice, and hidden terrain context.',
  },
  'ibcso-southern-ocean': {
    id: 'ibcso-southern-ocean',
    name: 'International Bathymetric Chart of the Southern Ocean',
    url: 'https://ibcso.org/',
    kind: 'bathymetry',
    coverage: 'antarctic',
    usage: 'primary',
    notes: 'Authoritative Southern Ocean bathymetry for shelves, submarine ridges, basins, passages, seamounts, and Antarctic marine context.',
  },
  'measures-antarctic-grounding-line': {
    id: 'measures-antarctic-grounding-line',
    name: 'MEaSUREs Antarctic Grounding Line',
    url: 'https://nsidc.org/data/nsidc-0498',
    kind: 'cryosphere',
    coverage: 'antarctic',
    usage: 'reference',
    notes: 'NASA NSIDC grounding-line product for separating grounded ice, floating ice shelves, coastal ice margins, and marine-terminating glacier context.',
  },
  'ats-antarctic-protected-areas': {
    id: 'ats-antarctic-protected-areas',
    name: 'Antarctic Treaty Protected Areas Database',
    url: 'https://www.ats.aq/e/protected.html',
    kind: 'protected-area',
    coverage: 'antarctic',
    usage: 'reference',
    notes: 'Official Antarctic Treaty access point for ASPA, ASMA, and historic-site management-plan references.',
  },
  'comnap-antarctic-facilities': {
    id: 'comnap-antarctic-facilities',
    name: 'COMNAP Antarctic Facilities',
    url: 'https://github.com/PolarGeospatialCenter/comnap-antarctic-facilities',
    kind: 'facility',
    coverage: 'antarctic',
    usage: 'primary',
    license: 'Educational and non-commercial use only; preserve COMNAP attribution',
    notes: 'Normalized station, camp, refuge, laboratory, depot, and airfield-camp metadata for Antarctic research-facility address candidates.',
  },
  'bas-antarctic-station-map': {
    id: 'bas-antarctic-station-map',
    name: 'BAS Antarctic Research Stations Map',
    url: 'https://data.bas.ac.uk/items/a4560740-70bb-4a2a-8ba5-ff4cc1774178/',
    kind: 'facility',
    coverage: 'antarctic',
    usage: 'validation',
    license: 'Open Government Licence 3.0 for BAS map product; underlying station list cites COMNAP',
    notes: 'BAS map product for validating year-round and seasonal Antarctic station placement and cartographic station labels.',
  },
  arcticdem: {
    id: 'arcticdem',
    name: 'ArcticDEM',
    url: 'https://www.pgc.umn.edu/arcticdem',
    kind: 'elevation',
    coverage: 'arctic',
    usage: 'primary',
    notes: 'High-resolution Arctic digital surface model for mountains, ice caps, fjords, glaciers, settlements, and remote route context.',
  },
  'ibcao-arctic-ocean': {
    id: 'ibcao-arctic-ocean',
    name: 'International Bathymetric Chart of the Arctic Ocean',
    url: 'https://www.gebco.net/about-us/committees-groups/scrum/ibcao',
    kind: 'bathymetry',
    coverage: 'arctic',
    usage: 'primary',
    notes: 'Authoritative Arctic Ocean bathymetry for basins, shelves, ridges, straits, channels, and under-ice marine context.',
  },
  'glims-glacier-db': {
    id: 'glims-glacier-db',
    name: 'GLIMS Glacier Database',
    url: 'https://www.glims.org/glacierdata/index.php',
    kind: 'cryosphere',
    coverage: 'global',
    usage: 'reference',
    notes: 'Glacier outlines and metadata for Arctic and subpolar mountain glaciers, ice caps, proglacial lakes, and natural-place validation.',
  },
  'npolar-data-centre': {
    id: 'npolar-data-centre',
    name: 'Norwegian Polar Data Centre',
    url: 'https://data.npolar.no/',
    kind: 'data-catalog',
    coverage: 'polar',
    usage: 'reference',
    notes: 'Open polar catalogue with scientific, environmental monitoring, topographic, and geological map data for Svalbard, Jan Mayen, and Antarctica.',
  },
  'greenland-gimp': {
    id: 'greenland-gimp',
    name: 'Greenland Ice Mapping Project',
    url: 'https://nsidc.org/grimp',
    kind: 'cryosphere',
    coverage: 'greenland',
    usage: 'primary',
    notes: 'Greenland DEM, ice/ocean masks, and imagery mosaics for ice-sheet, fjord, mountain, and coastal natural-address context.',
  },
};

export const POLAR_COMMON_NATURAL_OPEN_SOURCE_IDS = [
  'nsidc-polar-data',
  'gebco-bathymetry',
  'gmrt-topography',
  'marine-regions',
  'protected-planet-wdpa',
  'gbif-occurrence',
  'obis-marine-biodiversity',
] as const satisfies readonly PolarOpenGeoSourceId[];

export const ANTARCTIC_NATURAL_OPEN_SOURCE_IDS = [
  'scar-add',
  'scar-cga',
  'quantarctica',
  'rema-antarctica',
  'bedmap3-antarctica',
  'ibcso-southern-ocean',
  'measures-antarctic-grounding-line',
  'ats-antarctic-protected-areas',
] as const satisfies readonly PolarOpenGeoSourceId[];

export const ANTARCTIC_FACILITY_OPEN_SOURCE_IDS = [
  'comnap-antarctic-facilities',
  'bas-antarctic-station-map',
] as const satisfies readonly PolarOpenGeoSourceId[];

export const ARCTIC_NATURAL_OPEN_SOURCE_IDS = [
  'arcticdem',
  'ibcao-arctic-ocean',
  'glims-glacier-db',
  'npolar-data-centre',
] as const satisfies readonly PolarOpenGeoSourceId[];

export const GREENLAND_NATURAL_OPEN_SOURCE_IDS = [
  'greenland-gimp',
] as const satisfies readonly PolarOpenGeoSourceId[];

export const POLAR_NATURAL_OPEN_SOURCE_IDS = [
  ...POLAR_COMMON_NATURAL_OPEN_SOURCE_IDS,
  ...ANTARCTIC_NATURAL_OPEN_SOURCE_IDS,
  ...ARCTIC_NATURAL_OPEN_SOURCE_IDS,
  ...GREENLAND_NATURAL_OPEN_SOURCE_IDS,
] as const satisfies readonly PolarOpenGeoSourceId[];

export const POLAR_REGION_CODES = [
  'AQ', 'TF', 'BV', 'GS', 'HM', 'GL', 'SJ', 'SJ_SVA', 'SJ_JAN',
] as const;

export type PolarRegionCode = (typeof POLAR_REGION_CODES)[number];

const ANTARCTIC_AND_SUBANTARCTIC_CODES = new Set<PolarRegionCode>(['AQ', 'TF', 'BV', 'GS', 'HM']);
const ARCTIC_CODES = new Set<PolarRegionCode>(['GL', 'SJ', 'SJ_SVA', 'SJ_JAN']);

const COUNTRY_SOURCE_IDS: Record<PolarRegionCode, readonly PolarOpenGeoSourceId[]> = {
  AQ: [...ANTARCTIC_NATURAL_OPEN_SOURCE_IDS, ...ANTARCTIC_FACILITY_OPEN_SOURCE_IDS],
  TF: ANTARCTIC_NATURAL_OPEN_SOURCE_IDS,
  BV: ANTARCTIC_NATURAL_OPEN_SOURCE_IDS,
  GS: ANTARCTIC_NATURAL_OPEN_SOURCE_IDS,
  HM: ['australian-antarctic-program-himi', ...ANTARCTIC_NATURAL_OPEN_SOURCE_IDS],
  GL: [...ARCTIC_NATURAL_OPEN_SOURCE_IDS, ...GREENLAND_NATURAL_OPEN_SOURCE_IDS],
  SJ: ARCTIC_NATURAL_OPEN_SOURCE_IDS,
  SJ_SVA: ARCTIC_NATURAL_OPEN_SOURCE_IDS,
  SJ_JAN: ARCTIC_NATURAL_OPEN_SOURCE_IDS,
};

export function getPolarOpenSourceIds(countryCode: string): PolarOpenGeoSourceId[] {
  const code = countryCode.toUpperCase() as PolarRegionCode;
  const countrySources = COUNTRY_SOURCE_IDS[code] ?? [];
  return [...new Set([...countrySources, ...POLAR_COMMON_NATURAL_OPEN_SOURCE_IDS])];
}

export function getPolarOpenSourceIdsForCoordinate(lat: number, countryCode?: string): PolarOpenGeoSourceId[] {
  if (countryCode && (POLAR_REGION_CODES as readonly string[]).includes(countryCode.toUpperCase())) {
    return getPolarOpenSourceIds(countryCode);
  }

  if (lat < -60) {
    return getPolarOpenSourceIds('AQ');
  }

  if (lat > 60) {
    return [...new Set([...ARCTIC_NATURAL_OPEN_SOURCE_IDS, ...POLAR_COMMON_NATURAL_OPEN_SOURCE_IDS])];
  }

  return [];
}

export function getPolarOpenGeoSources(countryCode: string): PolarOpenGeoSource[] {
  return getPolarOpenSourceIds(countryCode).map(sourceId => POLAR_OPEN_GEO_SOURCES[sourceId]);
}

export function getPolarOpenGeoSourcesForCoordinate(lat: number, countryCode?: string): PolarOpenGeoSource[] {
  return getPolarOpenSourceIdsForCoordinate(lat, countryCode).map(sourceId => POLAR_OPEN_GEO_SOURCES[sourceId]);
}

export function getPolarHemisphere(countryCode: string): 'antarctic' | 'arctic' | null {
  const code = countryCode.toUpperCase() as PolarRegionCode;
  if (ANTARCTIC_AND_SUBANTARCTIC_CODES.has(code)) return 'antarctic';
  if (ARCTIC_CODES.has(code)) return 'arctic';
  return null;
}

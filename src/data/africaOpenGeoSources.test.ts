import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
AFRICA_COUNTRY_CODES,
AFRICA_OPEN_GEO_SOURCES,
type AfricaOpenGeoSourceId,
getAfricaOpenSourceIds,
} from './africaOpenGeoSources';

const REQUIRED_AFRICA_NATURAL_SOURCE_IDS: AfricaOpenGeoSourceId[] = [
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
];

test('Africa open geography registry includes reusable postal and geodata OSS sources', () => {
  const sourceIds = new Set(Object.keys(AFRICA_OPEN_GEO_SOURCES));

  for (const sourceId of [
    'osm-nominatim',
    'osm-overpass',
    'openaddresses',
    'geonames-postal',
    'geonames-gazetteer',
    'geoboundaries',
    'upu-addressing',
    'hot-osm-africa',
    'openstreetmap-wiki-africa',
    'humdata-africa',
    'openaerialmap',
  ]) {
    assert.ok(sourceIds.has(sourceId), `${sourceId} should be registered`);
  }
});

test('African countries map to geodata, address, and postal-code validation sources', () => {
  for (const countryCode of AFRICA_COUNTRY_CODES) {
    const sourceIds = getAfricaOpenSourceIds(countryCode);

    assert.ok(sourceIds.includes('osm-nominatim'), `${countryCode} should use OSM/Nominatim`);
    assert.ok(sourceIds.includes('openaddresses'), `${countryCode} should use OpenAddresses`);
    assert.ok(sourceIds.includes('geonames-gazetteer'), `${countryCode} should use GeoNames gazetteer`);
    assert.ok(sourceIds.includes('geoboundaries'), `${countryCode} should use geoBoundaries`);
    assert.ok(sourceIds.includes('upu-addressing'), `${countryCode} should use UPU addressing references`);
    assert.ok(sourceIds.includes('hot-osm-africa'), `${countryCode} should use HOT OSM Africa`);
    assert.ok(sourceIds.includes('humdata-africa'), `${countryCode} should use HDX Africa datasets`);
    assert.ok(sourceIds.includes('openaerialmap'), `${countryCode} should use OpenAerialMap imagery fallback`);
    assert.ok(
      sourceIds.some((sourceId) =>
        ['geonames-postal', 'datahub-postal', 'egy-list'].includes(sourceId),
      ),
      `${countryCode} should have at least one postal-code validation source`,
    );
  }
});

test('priority African countries map to national and regional open geospatial sources', () => {
  const expectedSourceIdsByCountry: Record<string, AfricaOpenGeoSourceId[]> = {
    NG: ['nipost-postcode', 'nipost-national-digital-postcode-2026', 'nipost-addressing-standard-2017', 'upu-nigeria-addressing-2022', 'npc-nigeria-ead-2023', 'fcta-nigeria-agis', 'ndpc-nigeria-data-protection-act-2023', 'ndpc-nigeria-gaid-2025', 'osm-nigeria', 'hot-osm-west-africa'],
    NA: ['nampost-postal-codes', 'nampost-post-offices', 'upu-namibia-addressing', 'nsa-namibia-geo-portal', 'mawlr-namibia-survey-mapping', 'namibia-constitution-article-13', 'namibia-access-to-information-act-2022', 'namibia-data-protection-status-2026', 'osm-namibia', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
    NE: ['niger-poste', 'niger-poste-agencies', 'upu-niger-addressing-2005', 'ignniger-national-geography', 'hapdp-niger-data-protection-2022', 'osm-niger', 'hot-osm-west-africa'],
    MG: ['paositra-malagasy', 'paositra-malagasy-agencies', 'upu-madagascar-addressing-2011', 'openstat-madagascar-postcodes-2021', 'un-salb-madagascar-ftm', 'matsf-madagascar-geospatial-land', 'madagascar-data-protection-2014-038', 'osm-madagascar', 'hot-osm-east-southern-africa'],
    MU: ['mauritius-post-postcode', 'upu-mauritius-postcode-rollout-2014', 'mauritius-open-data-mainland-postcodes', 'mauritius-open-data-rodrigues-postcodes', 'mauritius-open-data-agalega-postcodes', 'mauritius-open-data-post-offices', 'mauritius-open-data-districts', 'stats-mauritius-census-2022-admin', 'mauritius-cadastral-survey-act-dcdb', 'mauritius-data-protection-act-2017', 'osm-mauritius', 'hot-osm-east-southern-africa'],
    KE: ['rcmrd-geoportal', 'kenya-open-data', 'hot-osm-east-southern-africa'],
    TZ: ['tcra-tanzania-postcodes', 'tcra-tanzania-postcode-plan-2026', 'nbs-tanzania-wards-2022', 'pdpc-tanzania-enforcement-2026', 'osm-tanzania', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
    UG: ['rcmrd-geoportal', 'hot-osm-east-southern-africa'],
    ZA: ['upu-south-africa-postal-addressing', 'sapo-postcodes', 'sapo-website-terms', 'postafind-za', 'ngi-south-africa', 'stats-sa-geography', 'stats-sa-census-2022-geography', 'mdb-south-africa-wards-2025', 'csg-south-africa-cadastre', 'sasdi-south-africa', 'nspdr-south-africa-terms', 'south-africa-popia-2013', 'osm-south-africa', 'hot-osm-east-southern-africa'],
    MZ: ['incm-mozambique-cep-2024', 'incm-mozambique-postal-law-2016', 'incm-mozambique-corre-universal-2024', 'incm-mozambique-postal-operators', 'mozambique-correios-dissolution-2021', 'correios-mocambique-codigos-postais', 'incm-mozambique-cep-rollout-2019-2022', 'ine-mozambique-admin-cartography', 'fnds-mozambique-land-cadastre', 'intic-mozambique-data-protection-status-2026', 'osm-mozambique', 'rcmrd-geoportal', 'hot-osm-east-southern-africa'],
    SO: ['somalia-moct-postal-revival-2025', 'somalia-sobs-address-observation', 'somalia-snbs-gis', 'osm-somalia', 'hot-osm-east-southern-africa'],
  };

  for (const [countryCode, expectedSourceIds] of Object.entries(expectedSourceIdsByCountry)) {
    const sourceIds = getAfricaOpenSourceIds(countryCode);

    for (const sourceId of expectedSourceIds) {
      assert.ok(sourceIds.includes(sourceId), `${countryCode} should use ${sourceId}`);
      const source = AFRICA_OPEN_GEO_SOURCES[sourceId as keyof typeof AFRICA_OPEN_GEO_SOURCES];
      assert.ok(source, `${sourceId} should be registered`);
      assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
    }
  }
});

test('Africa natural geography registry includes mountain, marine, water, and biodiversity open sources', () => {
  for (const sourceId of REQUIRED_AFRICA_NATURAL_SOURCE_IDS) {
    const source = AFRICA_OPEN_GEO_SOURCES[sourceId];

    assert.ok(source, `${sourceId} should be registered`);
    assert.match(source.url, /^https?:\/\//, `${sourceId} should expose a testable URL`);
    assert.match(source.notes, /(mountain|elevation|sea|marine|coast|water|habitat|biodiversity|land cover|natural)/i);
  }
});

test('African countries include natural geography sources for mountain, sea, and nature display', () => {
  for (const countryCode of AFRICA_COUNTRY_CODES) {
    const sourceIds = getAfricaOpenSourceIds(countryCode);

    for (const sourceId of REQUIRED_AFRICA_NATURAL_SOURCE_IDS) {
      assert.ok(sourceIds.includes(sourceId), `${countryCode} should use ${sourceId}`);
    }
  }
});

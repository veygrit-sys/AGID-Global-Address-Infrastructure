import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
applyMapAddressFeatureToAddress,
applyMapAddressFeaturesToAddress,
buildMapFeatureAddressOverpassQuery,
mapAddressFeatureCandidateFromOpenMapFeature,
mapAddressFeatureCandidateFromOsmElement,
queryRenderedMapAddressFeatures,
rankMapAddressFeatureCandidates,
summarizeMapAddressFeatures,
} from './mapFeatureAddress';

test('classifies named roads as address road evidence', () => {
  const candidate = mapAddressFeatureCandidateFromOsmElement({
    type: 'way',
    id: 10,
    center: { lat: 40.771, lon: -73.964 },
    tags: {
      highway: 'primary',
      name: 'Park Avenue',
    },
  }, 'en');

  assert.equal(candidate?.kind, 'road');
  assert.equal(candidate?.category, 'primary');
  assert.equal(candidate?.source, 'osm:road:name');

  const address = applyMapAddressFeatureToAddress({ country_code: 'us' }, candidate);
  assert.equal(address.road, 'Park Avenue');
  assert.equal(address.map_feature_kind, 'road');
});

test('keeps bridges visible as both road and POI context', () => {
  const candidate = mapAddressFeatureCandidateFromOsmElement({
    type: 'way',
    id: 20,
    center: { lat: 35.638, lon: 139.763 },
    tags: {
      highway: 'primary',
      bridge: 'yes',
      name: 'Rainbow Bridge',
    },
  }, 'en');

  assert.equal(candidate?.kind, 'bridge');

  const address = applyMapAddressFeatureToAddress({ country_code: 'jp' }, candidate);
  assert.equal(address.bridge, 'Rainbow Bridge');
  assert.equal(address.road, 'Rainbow Bridge');
  assert.equal(address.poi, 'Rainbow Bridge');
});

test('supports mountains, rivers, lakes, ponds, and parks as displayable POI labels', () => {
  const mountain = mapAddressFeatureCandidateFromOsmElement({
    type: 'node',
    id: 30,
    lat: 35.3606,
    lon: 138.7274,
    tags: { natural: 'peak', name: 'Mount Fuji' },
  }, 'en');
  const river = mapAddressFeatureCandidateFromOsmElement({
    type: 'way',
    id: 31,
    center: { lat: 35.7, lon: 139.8 },
    tags: { waterway: 'river', name: 'Sumida River' },
  }, 'en');
  const stream = mapAddressFeatureCandidateFromOsmElement({
    type: 'way',
    id: 36,
    center: { lat: 36.23, lon: 137.65 },
    tags: { waterway: 'stream', name: 'Kamikochi Stream' },
  }, 'en');
  const lake = mapAddressFeatureCandidateFromOsmElement({
    type: 'way',
    id: 32,
    center: { lat: 35.25, lon: 136.08 },
    tags: { natural: 'water', water: 'lake', name: 'Lake Biwa' },
  }, 'en');
  const reservoir = mapAddressFeatureCandidateFromOsmElement({
    type: 'way',
    id: 35,
    center: { lat: 36.323, lon: -114.738 },
    tags: { natural: 'water', water: 'reservoir', name: 'Lake Mead' },
  }, 'en');
  const pond = mapAddressFeatureCandidateFromOsmElement({
    type: 'way',
    id: 33,
    center: { lat: 51.507, lon: -0.165 },
    tags: { natural: 'water', water: 'pond', name: 'Serpentine Pond' },
  }, 'en');
  const park = mapAddressFeatureCandidateFromOsmElement({
    type: 'relation',
    id: 34,
    center: { lat: 40.782, lon: -73.965 },
    tags: { leisure: 'park', name: 'Central Park' },
  }, 'en');

  assert.equal(mountain?.kind, 'mountain');
  assert.equal(applyMapAddressFeatureToAddress({}, mountain).poi, 'Mount Fuji');
  assert.equal(applyMapAddressFeatureToAddress({}, mountain).mountain_name, 'Mount Fuji');

  assert.equal(river?.kind, 'river');
  assert.equal(applyMapAddressFeatureToAddress({}, river).river, 'Sumida River');
  assert.equal(applyMapAddressFeatureToAddress({}, river).waterway, 'Sumida River');

  assert.equal(stream?.kind, 'river');
  assert.equal(applyMapAddressFeatureToAddress({}, stream).river, 'Kamikochi Stream');
  assert.equal(applyMapAddressFeatureToAddress({}, stream).stream, 'Kamikochi Stream');

  assert.equal(lake?.kind, 'lake');
  assert.equal(applyMapAddressFeatureToAddress({}, lake).lake, 'Lake Biwa');
  assert.equal(applyMapAddressFeatureToAddress({}, lake).water, 'Lake Biwa');

  assert.equal(reservoir?.kind, 'lake');
  assert.equal(applyMapAddressFeatureToAddress({}, reservoir).lake, 'Lake Mead');
  assert.equal(applyMapAddressFeatureToAddress({}, reservoir).reservoir, 'Lake Mead');

  assert.equal(pond?.kind, 'pond');
  assert.equal(applyMapAddressFeatureToAddress({}, pond).pond, 'Serpentine Pond');
  assert.equal(applyMapAddressFeatureToAddress({}, pond).poi, 'Serpentine Pond');

  assert.equal(park?.kind, 'park');
  assert.equal(applyMapAddressFeatureToAddress({}, park).park, 'Central Park');
  assert.equal(applyMapAddressFeatureToAddress({}, park).poi, 'Central Park');
});

test('supports landscape, ruins, and world heritage labels', () => {
  const grassland = mapAddressFeatureCandidateFromOsmElement({
    type: 'way',
    id: 40,
    center: { lat: 46.8, lon: 103.1 },
    tags: { natural: 'grassland', name: 'Mongolian Steppe' },
  }, 'en');
  const desert = mapAddressFeatureCandidateFromOsmElement({
    type: 'relation',
    id: 41,
    center: { lat: 23.4, lon: 25.7 },
    tags: { natural: 'desert', name: 'Sahara Desert' },
  }, 'en');
  const dryland = mapAddressFeatureCandidateFromOsmElement({
    type: 'relation',
    id: 44,
    center: { lat: -20.1, lon: -67.5 },
    tags: { natural: 'bare_rock', name: 'Atacama Bare Rock Field' },
  }, 'en');
  const wilderness = mapAddressFeatureCandidateFromOsmElement({
    type: 'relation',
    id: 45,
    center: { lat: 56.7, lon: -4.6 },
    tags: { natural: 'moor', name: 'Rannoch Moor' },
  }, 'en');
  const saltLake = mapAddressFeatureCandidateFromOsmElement({
    type: 'relation',
    id: 46,
    center: { lat: 41.1, lon: -112.5 },
    tags: { natural: 'water', water: 'lake', salt: 'yes', name: 'Great Salt Lake' },
  }, 'en');
  const forest = mapAddressFeatureCandidateFromOsmElement({
    type: 'way',
    id: 47,
    center: { lat: 35.3, lon: 139.2 },
    tags: { landcover: 'forest', name: 'Aokigahara Forest' },
  }, 'en');
  const iceField = mapAddressFeatureCandidateFromOsmElement({
    type: 'relation',
    id: 48,
    center: { lat: 52.2, lon: -117.3 },
    tags: { natural: 'glacier', 'glacier:type': 'icefield', name: 'Columbia Icefield' },
  }, 'en');
  const ruins = mapAddressFeatureCandidateFromOsmElement({
    type: 'node',
    id: 42,
    lat: 37.9715,
    lon: 23.7267,
    tags: { historic: 'ruins', name: 'Ancient Agora' },
  }, 'en');
  const heritage = mapAddressFeatureCandidateFromOsmElement({
    type: 'relation',
    id: 43,
    center: { lat: 27.1751, lon: 78.0421 },
    tags: { heritage: '1', 'heritage:operator': 'whc', name: 'Taj Mahal' },
  }, 'en');

  assert.equal(grassland?.kind, 'grassland');
  assert.equal(applyMapAddressFeatureToAddress({}, grassland).grassland, 'Mongolian Steppe');
  assert.equal(applyMapAddressFeatureToAddress({}, grassland).natural_feature, 'Mongolian Steppe');

  assert.equal(desert?.kind, 'desert');
  assert.equal(applyMapAddressFeatureToAddress({}, desert).desert, 'Sahara Desert');

  assert.equal(dryland?.kind, 'dryland');
  assert.equal(applyMapAddressFeatureToAddress({}, dryland).dryland, 'Atacama Bare Rock Field');
  assert.equal(applyMapAddressFeatureToAddress({}, dryland).bare_rock, 'Atacama Bare Rock Field');
  assert.equal(applyMapAddressFeatureToAddress({}, dryland).natural_feature, 'Atacama Bare Rock Field');

  assert.equal(wilderness?.kind, 'dryland');
  assert.equal(applyMapAddressFeatureToAddress({}, wilderness).wilderness, 'Rannoch Moor');

  assert.equal(saltLake?.kind, 'lake');
  assert.equal(applyMapAddressFeatureToAddress({}, saltLake).salt_lake, 'Great Salt Lake');
  assert.equal(applyMapAddressFeatureToAddress({}, saltLake).water, 'Great Salt Lake');

  assert.equal(forest?.kind, 'forest');
  assert.equal(applyMapAddressFeatureToAddress({}, forest).forest, 'Aokigahara Forest');

  assert.equal(iceField?.kind, 'glacier');
  assert.equal(applyMapAddressFeatureToAddress({}, iceField).ice_field, 'Columbia Icefield');

  assert.equal(ruins?.kind, 'ruins');
  assert.equal(applyMapAddressFeatureToAddress({}, ruins).ruins, 'Ancient Agora');

  assert.equal(heritage?.kind, 'heritage');
  assert.equal(applyMapAddressFeatureToAddress({}, heritage).heritage_site, 'Taj Mahal');
  assert.equal(applyMapAddressFeatureToAddress({}, heritage).poi, 'Taj Mahal');
});

test('supports islands, islets, archipelagos, atolls, cays, and keys as address labels', () => {
  const cases: Array<{ tags: Record<string, string>; field: string; name: string }> = [
    { tags: { place: 'islet', name: 'Motukorea Island' }, field: 'islet', name: 'Motukorea Island' },
    { tags: { place: 'archipelago', name: 'Galapagos Islands' }, field: 'archipelago', name: 'Galapagos Islands' },
    { tags: { place: 'atoll', name: 'Bikini Atoll' }, field: 'atoll', name: 'Bikini Atoll' },
    { tags: { place: 'cay', name: 'Cay Sal' }, field: 'cay', name: 'Cay Sal' },
    { tags: { place: 'key', name: 'Key West' }, field: 'key', name: 'Key West' },
  ];

  cases.forEach(({ tags, field, name }, index) => {
    const candidate = mapAddressFeatureCandidateFromOsmElement({
      type: 'node',
      id: 45 + index,
      lat: 0,
      lon: 0,
      tags,
    }, 'en');
    const address = applyMapAddressFeatureToAddress({}, candidate) as Record<string, string>;

    assert.equal(candidate?.kind, 'island');
    assert.equal(address.island, name);
    assert.equal(address[field], name);
    assert.equal(address.poi, name);
  });
});

test('keeps shoreline and natural feature labels distinct from generic water', () => {
  const cases: Array<{ tags: Record<string, string>; kind: string; field: string; name: string }> = [
    { tags: { natural: 'beach', name: 'Bondi Beach' }, kind: 'beach', field: 'beach', name: 'Bondi Beach' },
    { tags: { natural: 'wetland', name: 'Kushiro Marsh' }, kind: 'wetland', field: 'wetland', name: 'Kushiro Marsh' },
    { tags: { waterway: 'waterfall', name: 'Victoria Falls' }, kind: 'waterfall', field: 'waterfall', name: 'Victoria Falls' },
    { tags: { natural: 'waterfall', name: 'Kegon Falls' }, kind: 'waterfall', field: 'waterfall', name: 'Kegon Falls' },
    { tags: { natural: 'glacier', name: 'Aletsch Glacier' }, kind: 'glacier', field: 'glacier', name: 'Aletsch Glacier' },
    { tags: { natural: 'cave_entrance', name: 'Mammoth Cave' }, kind: 'cave', field: 'cave', name: 'Mammoth Cave' },
    { tags: { natural: 'valley', name: 'Yosemite Valley' }, kind: 'valley', field: 'valley', name: 'Yosemite Valley' },
    { tags: { natural: 'reef', name: 'Great Barrier Reef' }, kind: 'reef', field: 'reef', name: 'Great Barrier Reef' },
    { tags: { natural: 'spring', name: 'Blue Spring' }, kind: 'spring', field: 'spring', name: 'Blue Spring' },
    { tags: { natural: 'bay', name: 'Tokyo Bay' }, kind: 'bay', field: 'bay', name: 'Tokyo Bay' },
  ];

  cases.forEach(({ tags, kind, field, name }, index) => {
    const candidate = mapAddressFeatureCandidateFromOsmElement({
      type: 'node',
      id: 50 + index,
      lat: 0,
      lon: 0,
      tags,
    }, 'en');
    const address = applyMapAddressFeatureToAddress({}, candidate) as Record<string, string>;

    assert.equal(candidate?.kind, kind);
    assert.equal(address[field], name);
    assert.equal(address.poi, name);
  });
});

test('queries rendered map features including roads and water labels', () => {
  const fakeMap = {
    project: (lngLat: [number, number]) => {
      assert.deepEqual(lngLat, [139.731992, 35.665498]);
      return { x: 160, y: 120 };
    },
    queryRenderedFeatures: (box: [[number, number], [number, number]]) => {
      assert.deepEqual(box, [[128, 88], [192, 152]]);
      return [
        {
          layer: { id: 'road-label' },
          sourceLayer: 'transportation_name',
          properties: { name: 'Main Street' },
        },
        {
          layer: { id: 'water-label' },
          sourceLayer: 'water_name',
          properties: { name: 'Sumida River', class: 'river' },
        },
      ];
    },
  };

  const candidates = queryRenderedMapAddressFeatures(fakeMap, 35.665498, 139.731992, 'en', 32);

  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].kind, 'road');
  assert.equal(candidates[1].kind, 'river');
  assert.equal(rankMapAddressFeatureCandidates(candidates)[0].name, 'Main Street');
});

test('prefers close rendered labels over farther map feature candidates', () => {
  const ranked = rankMapAddressFeatureCandidates([
    {
      name: 'Far Bridge',
      kind: 'bridge',
      source: 'osm:bridge:name',
      distanceMeters: 120,
    },
    {
      name: 'Clicked Road',
      kind: 'road',
      source: 'openfreemap:road',
      distanceMeters: 0,
    },
  ]);

  assert.equal(ranked[0].name, 'Clicked Road');
});

test('summarizes and applies multiple reverse-geocode map features', () => {
  const candidates = [
    {
      name: 'Harbor Bridge',
      kind: 'bridge',
      source: 'osm:bridge:name',
      distanceMeters: 18,
      osmId: 5,
      osmType: 'way',
    },
    {
      name: 'Main Street',
      kind: 'road',
      source: 'osm:road:name',
      distanceMeters: 12,
      osmId: 4,
      osmType: 'way',
    },
    {
      name: 'Sumida River',
      kind: 'river',
      source: 'osm:waterway:name',
      category: 'river',
      distanceMeters: 35,
      osmId: 7,
      osmType: 'way',
    },
    {
      name: 'Riverside Park',
      kind: 'park',
      source: 'osm:park:name',
      distanceMeters: 42,
      osmId: 8,
      osmType: 'relation',
    },
    {
      name: 'Main Street',
      kind: 'road',
      source: 'osm:road:name',
      distanceMeters: 12,
      osmId: 4,
      osmType: 'way',
    },
  ] as const;

  const summary = summarizeMapAddressFeatures([...candidates]);
  const address = applyMapAddressFeaturesToAddress({ country_code: 'jp' }, summary);

  assert.equal(summary.features.length, 4);
  assert.equal(summary.primary?.name, 'Main Street');
  assert.equal(summary.byKind.bridge?.name, 'Harbor Bridge');
  assert.deepEqual(summary.hierarchy.slice(0, 4), ['Main Street', 'Harbor Bridge', 'Riverside Park', 'Sumida River']);
  assert.equal(address.map_feature_name, 'Main Street');
  assert.equal(address.map_feature_kind, 'road');
  assert.equal(address.road, 'Main Street');
  assert.equal(address.bridge, 'Harbor Bridge');
  assert.equal(address.river, 'Sumida River');
  assert.equal(address.park, 'Riverside Park');
  assert.equal(address.map_feature_candidates?.length, 4);
  assert.equal(address.map_feature_by_kind?.river?.name, 'Sumida River');
  assert.ok(address.map_feature_sources?.includes('osm:waterway:name'));
});

test('extracts OpenFreeMap road labels instead of treating them as building names', () => {
  const candidate = mapAddressFeatureCandidateFromOpenMapFeature({
    layer: { id: 'road-label' },
    sourceLayer: 'transportation_name',
    properties: {
      name: 'Rue de Rivoli',
      class: 'primary',
    },
  }, 'fr');

  assert.equal(candidate?.name, 'Rue de Rivoli');
  assert.equal(candidate?.kind, 'road');
  assert.equal(candidate?.source, 'openfreemap:road');
});

test('builds an Overpass query for public named map features', () => {
  const query = buildMapFeatureAddressOverpassQuery(35.681236, 139.767125, 140);

  assert.match(query, /way\["highway"\]\["name"\]/);
  assert.match(query, /way\["bridge"\]\["name"\]/);
  assert.match(query, /node\["natural"~"peak\|ridge\|volcano/);
  assert.match(query, /natural"~"[^"]*waterfall/);
  assert.match(query, /natural"~"[^"]*island\|islet\|archipelago\|atoll\|cay\|key/);
  assert.match(query, /way\["water"~"river\|stream\|canal\|lake\|salt_lake\|saline_lake\|reservoir\|lagoon\|pond/);
  assert.match(query, /way\["waterway"\]\["name"\]/);
  assert.match(query, /node\["waterway"="waterfall"\]\["name"\]/);
  assert.match(query, /node\["place"~"island\|islet\|archipelago\|atoll\|cay\|key/);
  assert.match(query, /node\["leisure"~"park\|garden\|nature_reserve"\]\["name"\]/);
  assert.match(query, /relation\["boundary"~"national_park\|protected_area"\]\["name"\]/);
  assert.match(query, /way\["landcover"~"grassland\|grass\|meadow\|forest\|wood\|desert\|sand\|scrub\|shrubland\|bare_rock/);
  assert.match(query, /natural"~"[^"]*wilderness\|wasteland\|moor\|moorland\|salt_lake/);
  assert.match(query, /natural"~"[^"]*ice_field\|icefield\|ice_cap\|ice_sheet\|snowfield/);
  assert.match(query, /node\["heritage:operator"~"whc\|WHC\|unesco\|UNESCO"\]\["name"\]/);
  assert.match(query, /relation\["world_heritage_site"\]\["name"\]/);
  assert.match(query, /way\["unesco_world_heritage"\]\["name"\]/);
  assert.match(query, /around:140,35\.681236,139\.767125/);
  assert.match(query, /out center tags/);
});

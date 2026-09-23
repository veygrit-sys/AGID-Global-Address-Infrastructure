import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildNaturalAddress,buildNaturalAddressDisplayProfile,formatNaturalAddress } from './naturalAddress';

test('renders marine addresses with sea name, protected area, depth, plus code, and open sources', () => {
  const formatted = formatNaturalAddress({
    sea_context: {
      sea_name: 'Philippine Sea',
      bathymetry: -5420,
      marine_protected_area: 'Mariana Trench Marine National Monument',
      features: [
        { name: 'Philippine Sea', type: 'Sea', distance: 0 },
        { name: 'Mariana Trench', type: 'trench', distance: 18000 },
      ],
    },
    plus_code: '73H9+22',
  });

  assert.ok(formatted);
  assert.match(formatted, /Philippine Sea/);
  assert.match(formatted, /Marine protected area: Mariana Trench Marine National Monument/);
  assert.match(formatted, /Depth: 5420 m below sea level/);
  assert.match(formatted, /Plus Code: 73H9\+22/);
  assert.match(formatted, /Sources: Marine Regions, OpenStreetMap, GEBCO\/open bathymetry, Google Open Location Code/);
});

test('renders marine hierarchy, coordinates, and seabed features for open-sea locations', () => {
  const naturalAddress = buildNaturalAddress({
    lat: 11.35,
    lon: 142.2,
    sea_context: {
      sea_name: 'Open Ocean',
      bathymetry: -10920,
      features: [
        { name: 'Pacific Ocean', type: 'Ocean', distance: 0 },
        { name: 'Philippine Sea', type: 'Sea', distance: 0 },
        { name: 'Mariana Trench', type: 'trench', distance: 18000 },
        { name: 'Challenger Deep', type: 'deep', distance: 2500 },
      ],
    },
    plus_code: { global_code: '7Q48+22' },
  });

  assert.ok(naturalAddress);
  assert.equal(naturalAddress.kind, 'marine');
  assert.equal(naturalAddress.label, 'Philippine Sea');
  assert.deepEqual(naturalAddress.lines.slice(0, 4), [
    'Philippine Sea',
    'Marine address area (non-postal)',
    'Marine hierarchy: Pacific Ocean > Philippine Sea',
    'Nearby marine or seabed features: Mariana Trench (Trench) - 18 km; Challenger Deep (Deep) - 2.5 km',
  ]);
  assert.ok(naturalAddress.lines.includes('Depth: 10920 m below sea level'));
  assert.ok(naturalAddress.lines.includes('Coordinates: 11.35000, 142.20000'));
  assert.ok(naturalAddress.lines.includes('Plus Code: 7Q48+22'));
});

test('renders mountain addresses when no street-level address exists', () => {
  const naturalAddress = buildNaturalAddress({
    mountain_name: 'Mount Fuji',
    elevation: 3776,
    state: 'Shizuoka',
    country: 'Japan',
    lat: 35.3606,
    lon: 138.7274,
    nature_context: {
      mountains: [
        { name: 'Mount Fuji', type: 'peak', distance: 120 },
        { name: 'Hoeizan', type: 'peak', distance: 2100 },
      ],
    },
    plus_code: { global_code: '8Q7X+XX' },
  });

  assert.ok(naturalAddress);
  assert.equal(naturalAddress.kind, 'mountain');
  assert.equal(naturalAddress.label, 'Mount Fuji');
  assert.ok(naturalAddress.lines.includes('Elevation: 3776 m'));
  assert.ok(naturalAddress.lines.some(line => line.includes('Nearby peaks: Mount Fuji (peak) - 120 m; Hoeizan (peak) - 2.1 km')));
  assert.ok(naturalAddress.lines.includes('Coordinates: 35.36060, 138.72740'));
  assert.ok(naturalAddress.sources.includes('OpenStreetMap'));
  assert.ok(naturalAddress.sources.includes('open elevation'));
});

test('renders lake and inland-water addresses with beaches, harbours, water risk, and sources', () => {
  const naturalAddress = buildNaturalAddress({
    lake: 'Lake Geneva',
    city: 'Montreux',
    country: 'Switzerland',
    lat: 46.4312,
    lon: 6.9106,
    flood_risk: 'Moderate (Water Proximity)',
    nature_context: {
      lakes: [{ name: 'Lake Geneva', type: 'lake', distance: 0 }],
      beaches: [{ name: 'Plage de Clarens', type: 'beach', distance: 450 }],
      ports: [{ name: 'Port de Montreux', type: 'harbour', distance: 620 }],
    },
    plus_code: '8FVF9X2C+M5',
  });

  assert.ok(naturalAddress);
  assert.equal(naturalAddress.kind, 'lake');
  const formatted = naturalAddress.lines.join('\n');
  assert.match(formatted, /Lake Geneva/);
  assert.match(formatted, /Lake \/ inland water address area/);
  assert.match(formatted, /Nearby lakes or reservoirs: Lake Geneva \(lake\)/);
  assert.match(formatted, /Nearby beaches: Plage de Clarens \(beach\) - 450 m/);
  assert.match(formatted, /Nearby ports or harbours: Port de Montreux \(harbour\) - 620 m/);
  assert.match(formatted, /Water risk: Moderate \(Water Proximity\)/);
  assert.match(formatted, /Coordinates: 46.43120, 6.91060/);
  assert.match(formatted, /Montreux, Switzerland/);
  assert.match(formatted, /Sources: OpenStreetMap, open hydrology data, open water-risk model, Google Open Location Code/);
});

test('renders river and waterfall addresses with hydrology context', () => {
  const riverAddress = buildNaturalAddress({
    river: 'Shinano River',
    country: 'Japan',
    lat: 37.9026,
    lon: 139.0234,
    flood_risk: 'Moderate (River Proximity)',
    nature_context: {
      rivers: [{ name: 'Shinano River', type: 'river', distance: 0 }],
      waterfalls: [{ name: 'Naena Falls', type: 'waterfall', distance: 3200 }],
      lakes: [{ name: 'Toyanogata Lagoon', type: 'lagoon', distance: 9100 }],
    },
    plus_code: '8Q9X+42',
  });

  assert.ok(riverAddress);
  assert.equal(riverAddress.kind, 'river');
  assert.equal(riverAddress.label, 'Shinano River');
  const riverFormatted = riverAddress.lines.join('\n');
  assert.match(riverFormatted, /River \/ watercourse address area/);
  assert.match(riverFormatted, /Nearby rivers or watercourses: Shinano River \(river\)/);
  assert.match(riverFormatted, /Nearby waterfalls: Naena Falls \(waterfall\) - 3.2 km/);
  assert.match(riverFormatted, /Water risk: Moderate \(River Proximity\)/);

  const waterfallAddress = buildNaturalAddress({
    natural: 'waterfall',
    map_feature_kind: 'waterfall',
    map_feature_name: 'Kegon Falls',
    country: 'Japan',
    lat: 36.7378,
    lon: 139.5037,
    nature_context: {
      waterfalls: [{ name: 'Kegon Falls', type: 'waterfall', distance: 0 }],
      rivers: [{ name: 'Daiya River', type: 'river', distance: 780 }],
    },
  });

  assert.ok(waterfallAddress);
  assert.equal(waterfallAddress.kind, 'waterfall');
  assert.equal(waterfallAddress.label, 'Kegon Falls');
  const waterfallFormatted = waterfallAddress.lines.join('\n');
  assert.match(waterfallFormatted, /Waterfall \/ hydrology address area/);
  assert.match(waterfallFormatted, /Nearby rivers or watercourses: Daiya River \(river\) - 780 m/);
  assert.match(waterfallFormatted, /Sources: OpenStreetMap, open hydrology data/);
});

test('renders island and archipelago addresses with nearby island evidence', () => {
  const naturalAddress = buildNaturalAddress({
    atoll: 'Bikini Atoll',
    country: 'Marshall Islands',
    lat: 11.6065,
    lon: 165.3768,
    nature_context: {
      islands: [
        { name: 'Bikini Atoll', type: 'atoll', distance: 0 },
        { name: 'Eneu Island', type: 'islet', distance: 5100 },
      ],
      beaches: [{ name: 'Bikini Beach', type: 'beach', distance: 800 }],
      ports: [{ name: 'Bikini Anchorage', type: 'harbour', distance: 2200 }],
    },
    plus_code: '72Q7J9XG+JQ',
  });

  assert.ok(naturalAddress);
  assert.equal(naturalAddress.kind, 'island');
  assert.equal(naturalAddress.label, 'Bikini Atoll');
  const formatted = naturalAddress.lines.join('\n');
  assert.match(formatted, /Island \/ archipelago address area/);
  assert.match(formatted, /Nearby islands or archipelagos: Bikini Atoll \(atoll\); Eneu Island \(islet\) - 5.1 km/);
  assert.match(formatted, /Nearby beaches: Bikini Beach \(beach\) - 800 m/);
  assert.match(formatted, /Nearby ports or harbours: Bikini Anchorage \(harbour\) - 2.2 km/);
  assert.match(formatted, /Coordinates: 11.60650, 165.37680/);
  assert.match(formatted, /Sources: OpenStreetMap, open island gazetteer, Google Open Location Code/);
});

test('renders desert addresses with coordinates and nearby dune evidence', () => {
  const naturalAddress = buildNaturalAddress({
    desert: 'Sahara Desert',
    lat: 23.4162,
    lon: 25.6628,
    country: 'Egypt',
    nature_context: {
      deserts: [
        { name: 'Sahara Desert', type: 'desert', distance: 0 },
        { name: 'Great Sand Sea', type: 'dune', distance: 18000 },
      ],
    },
    plus_code: '7GR7+2X',
  });

  assert.ok(naturalAddress);
  assert.equal(naturalAddress.kind, 'desert');
  assert.equal(naturalAddress.label, 'Sahara Desert');
  assert.ok(naturalAddress.lines.includes('Desert / arid natural address area'));
  assert.ok(naturalAddress.lines.some(line => line.includes('Nearby desert or dune features: Sahara Desert (desert); Great Sand Sea (dune) - 18 km')));
  assert.ok(naturalAddress.lines.includes('Coordinates: 23.41620, 25.66280'));
  assert.ok(naturalAddress.sources.includes('OpenStreetMap'));
  assert.ok(naturalAddress.sources.includes('Google Open Location Code'));
});

test('renders desert-like sparse natural addresses with coordinates and land-cover evidence', () => {
  const naturalAddress = buildNaturalAddress({
    dryland: 'Salar de Uyuni',
    natural: 'salt_flat',
    landcover: 'salt_flat',
    lat: -20.1338,
    lon: -67.4891,
    country: 'Bolivia',
    nature_context: {
      drylands: [
        { name: 'Salar de Uyuni', type: 'salt_flat', distance: 0 },
        { name: 'Salar de Coipasa', type: 'salt_flat', distance: 94000 },
      ],
    },
    plus_code: '58GP+F9',
  });

  assert.ok(naturalAddress);
  assert.equal(naturalAddress.kind, 'sparse_natural');
  assert.equal(naturalAddress.label, 'Salar de Uyuni');
  assert.ok(naturalAddress.lines.includes('Dryland / bare-ground natural address area'));
  assert.ok(naturalAddress.lines.some(line => line.includes('Nearby dryland or bare-ground features: Salar de Uyuni (salt_flat); Salar de Coipasa (salt_flat) - 94 km')));
  assert.ok(naturalAddress.lines.includes('Coordinates: -20.13380, -67.48910'));
  assert.ok(naturalAddress.sources.includes('OpenStreetMap'));
  assert.ok(naturalAddress.sources.includes('open land-cover data'));
});

test('renders named wilderness, salt lake, and ice field natural addresses', () => {
  const wildernessAddress = buildNaturalAddress({
    wilderness: 'Rannoch Moor',
    natural: 'moor',
    lat: 56.6667,
    lon: -4.6167,
    country: 'United Kingdom',
    nature_context: {
      drylands: [
        { name: 'Rannoch Moor', type: 'moor', distance: 0 },
      ],
    },
  });

  assert.ok(wildernessAddress);
  assert.equal(wildernessAddress.kind, 'sparse_natural');
  assert.equal(wildernessAddress.label, 'Rannoch Moor');
  assert.ok(wildernessAddress.lines.includes('Dryland / bare-ground natural address area'));

  const saltLakeAddress = buildNaturalAddress({
    salt_lake: 'Great Salt Lake',
    water: 'salt_lake',
    lat: 41.1433,
    lon: -112.608,
    country: 'United States',
    nature_context: {
      lakes: [
        { name: 'Great Salt Lake', type: 'salt_lake', distance: 0 },
      ],
    },
  });

  assert.ok(saltLakeAddress);
  assert.equal(saltLakeAddress.kind, 'lake');
  assert.equal(saltLakeAddress.label, 'Great Salt Lake');
  assert.ok(saltLakeAddress.lines.includes('Lake / salt-lake inland water address area'));

  const iceFieldAddress = buildNaturalAddress({
    ice_field: 'Columbia Icefield',
    natural: 'glacier',
    map_feature_kind: 'glacier',
    lat: 52.196,
    lon: -117.255,
    country: 'Canada',
    nature_context: {
      glaciers: [
        { name: 'Columbia Icefield', type: 'icefield', distance: 0 },
      ],
    },
  });

  assert.ok(iceFieldAddress);
  assert.equal(iceFieldAddress.kind, 'sparse_natural');
  assert.equal(iceFieldAddress.label, 'Columbia Icefield');
  assert.ok(iceFieldAddress.lines.includes('Glacier / ice natural address area'));
});

test('does not replace normal street addresses with natural context', () => {
  const formatted = formatNaturalAddress({
    road: 'Lake Road',
    house_number: '12',
    lake: 'Lake Taupo',
    nature_context: {
      beaches: [{ name: 'Taupo Beach', type: 'beach', distance: 100 }],
    },
  });

  assert.equal(formatted, null);
});

test('builds delivery display profiles for sea, mountain, waterside, and island addresses', () => {
  const marine = buildNaturalAddressDisplayProfile({
    sea_context: {
      sea_name: 'Philippine Sea',
      bathymetry: -5420,
      features: [{ name: 'Philippine Sea', type: 'Sea', distance: 0 }],
    },
  }, {
    agid: 'ML01R1J36919',
    isSea: true,
    regionName: 'Philippine Sea',
    lat: 11.35,
    lon: 142.2,
  });
  assert.ok(marine);
  assert.equal(marine.displayClass, 'marine');
  assert.equal(marine.title, 'Marine / offshore address');
  assert.deepEqual(marine.addressPriority.slice(0, 2), ['AGID cell', 'Marine area']);
  assert.match(marine.deliveryInstruction, /port or shore handoff/);
  assert.ok(marine.evidence.includes('AGID cell'));
  assert.ok(marine.evidence.includes('AGID sea region'));

  const mountain = buildNaturalAddressDisplayProfile({
    mountain_name: 'Mount Fuji',
    elevation: 3776,
    nature_context: { mountains: [{ name: 'Mount Fuji', type: 'peak' }] },
  }, { agid: 'JP05AV8TJGH8' });
  assert.ok(mountain);
  assert.equal(mountain.displayClass, 'mountain');
  assert.match(mountain.deliveryInstruction, /trail/);
  assert.ok(mountain.addressPriority.includes('Trail/shelter context'));

  const waterside = buildNaturalAddressDisplayProfile({
    river: 'Shinano River',
    flood_risk: 'Moderate',
    nature_context: { rivers: [{ name: 'Shinano River', type: 'river' }] },
  }, { agid: 'JP05WATER001' });
  assert.ok(waterside);
  assert.equal(waterside.displayClass, 'waterside');
  assert.equal(waterside.title, 'River / watercourse address');
  assert.match(waterside.verificationMode, /hydrology/);

  const island = buildNaturalAddressDisplayProfile({
    atoll: 'Bikini Atoll',
    nature_context: { islands: [{ name: 'Bikini Atoll', type: 'atoll' }] },
  }, { agid: 'MH01ISLAND01' });
  assert.ok(island);
  assert.equal(island.displayClass, 'island');
  assert.ok(island.addressPriority.includes('Landing point'));
});

test('builds a marine fallback display profile when only AGID sea region exists', () => {
  const profile = buildNaturalAddressDisplayProfile(null, {
    agid: 'ML01R1J36919',
    isSea: true,
    regionName: 'North Atlantic Ocean',
    lat: 43.2,
    lon: -28.4,
  });

  assert.ok(profile);
  assert.equal(profile.kind, 'marine');
  assert.equal(profile.primaryLine, 'North Atlantic Ocean');
  assert.equal(profile.secondaryLine, 'Coordinates: 43.20000, -28.40000');
  assert.equal(profile.confidenceLabel, 'Review');
  assert.deepEqual(profile.addressPriority, ['AGID cell', 'Marine area', 'Coordinates', 'Port/shore handoff']);
});

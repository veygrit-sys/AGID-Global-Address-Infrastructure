import assert from 'node:assert/strict';
import { test } from 'node:test';
import { encodeAGID, encodeAGID16, getAGIDCellKey } from './agid';
import { resolveAgidLocal } from './agidLocalResolver';
import { assessAgidGeography } from './geographicAssessment';

// Published gazetteer, park and airport coordinates are independent of the polygon sources.
const islandPins = [
  // https://geonames.nrcan.gc.ca/search-place-names/unique?id=FEBHA (FDLEM for Pelee)
  ['Middle Island, Ontario', 41.6828, -82.683149, 'CA'],
  ['Pelee Island, Ontario', 41.77827, -82.656032, 'CA'],
  // Ohio DOT Airport Directory, airport 89D, 41°36′11.45″N 82°41′06.20″W.
  ['Kelleys Island airport, Ohio', 41.603181, -82.685056, 'US'],
  // NPS visitor center and cabin meeting points, both on land rather than on a dock.
  // https://www.nps.gov/planyourvisit/event-details.htm?id=DC0E244C-BACF-190A-F2B3FEEF5BD8186E
  // https://www.nps.gov/planyourvisit/event-details.htm?id=DB622DBB-C244-E759-6C59DFBDA7E725E2
  ['Windigo visitor center, Isle Royale', 47.911776, -89.157186, 'US'],
  ['Rock Harbor, Isle Royale', 48.146401, -88.485365, 'US'],
  // https://geonames.nrcan.gc.ca/search-place-names/unique?id=FDEQW
  // https://parks.canada.ca/pn-np/on/1000/activ/chaises-chairs
  // https://staffportal.parks.ny.gov/parks/maryisland/amenities.aspx
  ['Wolfe Island, Ontario', 44.1702778, -76.4080556, 'CA'],
  ['Gordon Island red chairs, Ontario', 44.33083333, -76.10211111, 'CA'],
  ['Mary Island State Park, New York', 44.3654530682, -75.921706116, 'US'],
  // https://www.boldtcastle.com/visitorinfo/downloads (Thousand Islands Bridge Authority)
  ['Heart Island, Boldt Castle, New York', 44.344525, -75.922575, 'US'],
  // BC Geographical Names, record 17153, and NOAA weather station KFHR.
  ['Saturna Island, British Columbia', 48.783889, -123.147778, 'CA'],
  ['Friday Harbor Airport, San Juan Island', 48.52, -123.02637, 'US'],
  // CGNDB records DAZSE, DAIDT, JCTDN, JBZNE and KACVI. NOAA stations PANT, SHM and PADK.
  ['Campobello Island, New Brunswick', 44.890205, -66.93099, 'CA'],
  ['Grand Manan Island, New Brunswick', 44.708333, -66.788889, 'CA'],
  ['Annette Island airport, Alaska', 55.0333, -131.5667, 'US'],
  ['Dundas Island, British Columbia', 54.563056, -130.872778, 'CA'],
  ['Graham Island, Haida Gwaii', 53.455278, -132.239444, 'CA'],
  ['Herschel Island, Yukon', 69.5897222, -139.0991667, 'CA'],
  ['Shemya Island, eastern longitudes', 52.7112, 174.1260, 'US'],
  ['Adak Island, western longitudes', 51.88, -176.65, 'US'],
] as const;

const waterPins = [
  // NOAA NDBC station pages https://www.ndbc.noaa.gov/station_page.php?station=45201 and 45006.
  ['Erie Islands buoy 45201', 41.601, -82.781],
  ['western Lake Superior buoy 45006', 47.335, -89.793],
  // USGS sediment core drilled through lake water on Isle Royale, OFR 03-276.
  // https://pubs.usgs.gov/of/2003/of03-276/OFR-03-276.pdf
  ['Lake Richie within Isle Royale', 48.0420, -88.6930],
  // Canadian Hydrographic Service chart 3441, September 2026, ODAS buoy.
  // https://notmar.gc.ca/publications/monthly/west-ouest-09-26-en
  ['Salish Sea oceanographic buoy', 48.6936944, -123.4226944],
] as const;

test('both AGID formats and geography identify the country on the surveyed US and Canadian island pins', () => {
  for (const [name, lat, lon, country] of islandPins) {
    const a = assessAgidGeography({ kind: 'pin', lat, lon });
    assert.equal(a.surface, 'land', name);
    assert.equal(a.status, 'mapped', name);
    assert.equal(a.territorialTopology?.landform, 'island', name);
    assert.deepEqual(a.regionCandidates, [country], name);
    assert.deepEqual(a.island?.countryCodes, [country], name);
    assert.equal(a.deliveryRegion, null, name);
    for (const issue of [encodeAGID, encodeAGID16]) {
      const issued = issue(lat, lon);
      assert.equal(issued.prefix, country, name);
      assert.equal(issued.regionCode, country, name);
      assert.equal(issued.isSea, false, name);
    }
  }
});

test('lake and channel water yield neither an island nor a national address, including stored cells', async () => {
  for (const [name, lat, lon] of waterPins) {
    const issued = encodeAGID16(lat, lon);
    assert.equal(issued.isSea, true, name);
    assert.ok(issued.waterMatch, name);
    for (const a of [assessAgidGeography({ kind: 'pin', lat, lon }),
      assessAgidGeography({ kind: 'pin', lat, lon, method: 'device', accuracyMeters: 20 }),
      assessAgidGeography({ kind: 'cell', id: issued.id })]) {
      assert.equal(a.surface, 'water', name);
      assert.equal(a.status, 'mapped', name);
      assert.equal(a.island, undefined, name);
      assert.equal(a.territorialTopology, undefined, name);
      assert.deepEqual(a.regionCandidates, [], name);
      assert.equal(a.deliveryRegion, null, name);
    }
    const requests: string[] = [];
    for (const input of [{ coordinates: { lat, lon } }, { query: issued.id }]) {
      await resolveAgidLocal({ ...input, addressFormatResolver: async code => { requests.push(code); return null; } });
    }
    assert.deepEqual(requests, [], name);
  }
});

test('the causeway at Eastport connects Moose Island to the mainland', () => {
  // The Eastport municipal plan describes this former island as a peninsula.
  // https://www.maine.gov/dacf/municipalplanning/comp_plans/Eastport_2018.pdf
  const a = assessAgidGeography({ kind: 'pin', lat: 44.90, lon: -66.99 });
  assert.equal(a.surface, 'land');
  assert.deepEqual(a.regionCandidates, ['US']);
  assert.equal(a.territorialTopology?.landform, 'mainland');
  assert.equal(a.island, undefined);
});

test('Point Roberts and Tsawwassen stay on the mainland and a GPS disk can reach both countries', () => {
  for (const [lat, country] of [[48.984, 'US'], [49.016, 'CA']] as const) {
    const a = assessAgidGeography({ kind: 'pin', lat, lon: -123.075 });
    assert.deepEqual(a.regionCandidates, [country]);
    assert.equal(a.surface, 'land');
    assert.equal(a.territorialTopology?.landform, 'mainland');
    assert.equal(a.island, undefined);
  }
  const crossing = assessAgidGeography({ kind: 'pin', lat: 48.999, lon: -123.075,
    method: 'device', accuracyMeters: 600 });
  assert.equal(crossing.status, 'needs-confirmation');
  assert.deepEqual(crossing.regionCandidates, ['CA', 'US']);
  assert.equal(crossing.deliveryRegion, null);
});

test('a small island only supplies a definite address-region hint inside its measured shoreline', () => {
  const pin = { kind: 'pin' as const, lat: 41.6828, lon: -82.683149 };
  const small = assessAgidGeography({ ...pin, method: 'device', accuracyMeters: 10 });
  assert.equal(small.status, 'mapped');
  assert.deepEqual(small.regionCandidates, ['CA']);
  for (const crossing of [assessAgidGeography({ ...pin, method: 'device', accuracyMeters: 800 }),
    assessAgidGeography(pin, { boundaryAllowanceMeters: 800 })]) {
    assert.equal(crossing.status, 'needs-confirmation');
    assert.notEqual(crossing.surface, 'land');
    assert.deepEqual(crossing.regionCandidates, ['CA']);
    assert.equal(crossing.deliveryRegion, null);
  }
});

test('the surveyed river channel beside Wolfe Island stays open water on the Canadian side', () => {
  // Ontario Hydro Network Waterbody OGF_ID 70428304, permanent river water.
  // https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open01/MapServer/25
  const pin = { kind: 'pin' as const, lat: 44.1728, lon: -76.4958 };
  for (const a of [assessAgidGeography(pin), assessAgidGeography({ ...pin, method: 'device', accuracyMeters: 15 })]) {
    assert.equal(a.status, 'mapped');
    assert.equal(a.surface, 'water');
    assert.deepEqual(a.regionCandidates, []);
    assert.equal(a.island, undefined);
    assert.equal(a.territorialTopology, undefined);
    assert.equal(a.deliveryRegion, null);
  }
  assert.equal(encodeAGID16(pin.lat, pin.lon).isSea, true);
});

test('the edge of US hydrography coverage in open Lake Erie is still water', () => {
  // This surveyed water polygon ends at the international boundary south of Middle Island.
  const pin = { kind: 'pin' as const, lat: 41.680212, lon: -82.689117 };
  for (const a of [assessAgidGeography(pin), assessAgidGeography({ ...pin, method: 'device', accuracyMeters: 15 })]) {
    assert.equal(a.status, 'mapped');
    assert.equal(a.surface, 'water');
    assert.deepEqual(a.regionCandidates, []);
    assert.equal(a.island, undefined);
  }
});

test('a GPS footprint centered in the lake retains the islands on both sides of the border', () => {
  // Open lake between Kelleys Island (US) and Middle Island (CA).
  const pin = { kind: 'pin' as const, lat: 41.64, lon: -82.68 };
  const point = assessAgidGeography(pin);
  assert.equal(point.surface, 'water');
  assert.deepEqual(point.regionCandidates, []);
  const disk = assessAgidGeography({ ...pin, method: 'device', accuracyMeters: 7_000 });
  assert.equal(disk.status, 'needs-confirmation');
  assert.deepEqual(disk.regionCandidates, ['CA', 'US']);
  assert.equal(disk.deliveryRegion, null);
});

test('both historic US-prefixed Middle Island IDs retain their cell and reassess it as Canadian', async () => {
  const current = encodeAGID16(41.6828, -82.683149);
  for (const id of ['US0EB2YQWPNB', 'US0EB2YQWPNB1YXP']) {
    assert.equal(getAGIDCellKey(id), getAGIDCellKey(current));
    const cell = assessAgidGeography({ kind: 'cell', id });
    assert.equal(cell.status, 'mapped');
    assert.deepEqual(cell.regionCandidates, ['CA']);
    const requests: string[] = [];
    const addressFormatResolver = async (code: string) => { requests.push(code); return null; };
    const resolved = await resolveAgidLocal({ query: id, addressFormatResolver });
    assert.equal(resolved.agidId, id);
    assert.equal(resolved.agid?.prefix, 'US');
    await resolveAgidLocal({ query: id, countryCode: 'US', addressFormatResolver });
    assert.deepEqual(requests, ['CA', 'US']);
  }
});

test('nearby national shorelines preserve the Machias Seal Island dispute', () => {
  // Canadian Coast Guard official List of Lights, Atlantic Coast, light on Machias Seal Island.
  const a = assessAgidGeography({ kind: 'pin', lat: 44.50183333, lon: -67.10113889 });
  assert.equal(a.island?.status, 'disputed');
  assert.deepEqual(a.island.claimantCodes, ['CA', 'US']);
  assert.deepEqual(a.regionCandidates, []);
  assert.equal(a.deliveryRegion, null);
});

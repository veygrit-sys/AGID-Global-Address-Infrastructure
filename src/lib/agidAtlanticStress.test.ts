import assert from "node:assert";
import { performance } from "node:perf_hooks";
import { describe, test } from "node:test";

import { assessAddressDisplayQuality, formatAddressDisplayText } from "./addressDisplay";
import { AddressRenderer, createCanonicalAddress, type CanonicalAddress } from "./addressRendering";
import { decodeAGID, encodeAGID, getRegionInfo } from "./agid";
import { isValidAGIDFormat } from "./agidSecurity";

type AtlanticSeaStressPoint = {
  readonly id: string;
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
};

type AtlanticLandGuardPoint = {
  readonly code: string;
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
};

const ATLANTIC_OPEN_OCEAN_POINTS: readonly AtlanticSeaStressPoint[] = [
  { id: "NATL", name: "North Atlantic central", lat: 35, lon: -35 },
  { id: "NATL", name: "North Atlantic west", lat: 35, lon: -60 },
  { id: "NATL", name: "North Atlantic east", lat: 35, lon: -20 },
  { id: "NATL", name: "Equatorial North Atlantic", lat: 0.5, lon: -30 },
  { id: "SATL", name: "South Atlantic central", lat: -25, lon: -20 },
  { id: "SATL", name: "South Atlantic west", lat: -35, lon: -45 },
  { id: "SATL", name: "South Atlantic east", lat: -30, lon: 5 },
  { id: "SATL", name: "Equatorial South Atlantic", lat: -0.5, lon: -30 },
];

const ATLANTIC_ARCHIPELAGO_BBOX_OCEAN_POINTS: readonly AtlanticSeaStressPoint[] = [
  { id: "NATL", name: "Azores coarse box open water", lat: 38.5, lon: -28 },
  { id: "NATL", name: "Madeira coarse box open water", lat: 33, lon: -18 },
  { id: "NATL", name: "Canary Islands coarse box open water", lat: 29.5, lon: -18.5 },
  { id: "NATL", name: "Cape Verde coarse box open water", lat: 16, lon: -24 },
  { id: "SARG", name: "Bermuda adjacent Sargasso Sea", lat: 33, lon: -63 },
  { id: "SATL", name: "South Georgia coarse box open water", lat: -54.5, lon: -34 },
];

const ATLANTIC_MARGINAL_SEA_POINTS: readonly AtlanticSeaStressPoint[] = [
  { id: "GMXC", name: "Gulf of Mexico", lat: 24, lon: -90 },
  { id: "CARB", name: "Caribbean Sea", lat: 15, lon: -75 },
  { id: "NTHS", name: "North Sea", lat: 56, lon: 3 },
  { id: "ENGC", name: "English Channel", lat: 50, lon: -2 },
  { id: "BISC", name: "Bay of Biscay", lat: 45, lon: -5 },
  { id: "LABR", name: "Labrador Sea", lat: 56, lon: -55 },
  { id: "STLA", name: "Gulf of St. Lawrence", lat: 48, lon: -62 },
  { id: "FUND", name: "Bay of Fundy", lat: 45, lon: -65.5 },
  { id: "SCOT", name: "Scotian Shelf", lat: 44, lon: -62 },
  { id: "SARG", name: "Sargasso Sea", lat: 32.5, lon: -64.8 },
];

const ATLANTIC_LAND_GUARD_POINTS: readonly AtlanticLandGuardPoint[] = [
  { code: "PT", name: "Lisbon", lat: 38.7223, lon: -9.1393 },
  { code: "PT", name: "Porto", lat: 41.1579, lon: -8.6291 },
  { code: "PT_AZO", name: "Ponta Delgada", lat: 37.7412, lon: -25.6756 },
  { code: "PT_MAD", name: "Madeira", lat: 32.7607, lon: -16.9595 },
  { code: "ES_CAN", name: "Tenerife", lat: 28.2916, lon: -16.6291 },
  { code: "CV", name: "Praia", lat: 14.933, lon: -23.5133 },
  { code: "BM", name: "Bermuda", lat: 32.2948, lon: -64.7814 },
  { code: "SH", name: "Jamestown", lat: -15.924, lon: -5.718 },
  { code: "FK", name: "Stanley", lat: -51.6977, lon: -57.8517 },
  { code: "GS", name: "Grytviken", lat: -54.2811, lon: -36.508 },
  { code: "IS", name: "Reykjavik", lat: 64.1466, lon: -21.9426 },
  { code: "FO", name: "Torshavn", lat: 62.0079, lon: -6.79 },
  { code: "GL", name: "Nuuk", lat: 64.1835, lon: -51.7216 },
  { code: "CA", name: "Halifax", lat: 44.6488, lon: -63.5752 },
  { code: "CA", name: "Saint John", lat: 45.2733, lon: -66.0633 },
  { code: "CA", name: "St. John's", lat: 47.5615, lon: -52.7126 },
];

const ALL_ATLANTIC_SEA_POINTS = [
  ...ATLANTIC_OPEN_OCEAN_POINTS,
  ...ATLANTIC_ARCHIPELAGO_BBOX_OCEAN_POINTS,
  ...ATLANTIC_MARGINAL_SEA_POINTS,
] as const;

const EARTH_RADIUS_METERS = 6371008.8;

function haversineMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

function assertAtlanticSeaPoint(point: AtlanticSeaStressPoint) {
  const region = getRegionInfo(point.lat, point.lon);
  assert.equal(region.prefix, point.id, `${point.name} region`);
  assert.equal(region.isSea, true, `${point.name} region should be sea`);

  const agid = encodeAGID(point.lat, point.lon);
  assert.equal(agid.regionCode, point.id, `${point.name} AGID region code`);
  assert.equal(agid.isSea, true, `${point.name} AGID should be sea`);
  assert.ok(!/^[A-Z]{2}$/.test(agid.prefix), `${point.name} sea prefix should not collide with land codes`);
  assert.ok(isValidAGIDFormat(agid.id), `${point.name} should emit a valid AGID`);
  assert.equal(agid.polygon.length, 5, `${point.name} cell polygon should be closed`);

  const decoded = decodeAGID(agid.id);
  assert.ok(decoded, `${point.name} AGID should decode`);
  assert.equal(decoded.face, agid.face, `${point.name} decoded face`);
  assert.equal(decoded.qx, agid.qx, `${point.name} decoded qx`);
  assert.equal(decoded.qy, agid.qy, `${point.name} decoded qy`);
  assert.equal(decoded.prefix, agid.prefix, `${point.name} decoded prefix`);

  const centerError = haversineMeters(point, { lat: decoded.lat, lon: decoded.lon });
  assert.ok(centerError <= 8, `${point.name} center error ${centerError.toFixed(2)}m`);
}

function hasAdjacentRepeatedPart(text: string): boolean {
  const parts = text
    .split(/\r?\n|,/)
    .map((part) => part.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "").trim())
    .filter(Boolean);

  return parts.some((part, index) => index > 0 && part === parts[index - 1]);
}

function atlanticDisplayFixture(point: AtlanticSeaStressPoint, index: number): Partial<CanonicalAddress> {
  const agid = encodeAGID(point.lat, point.lon);
  const fixtures: Array<Partial<CanonicalAddress>> = [
    {
      country: point.name,
      state: "Atlantic Ocean Reference Area",
      city: `Atlantic Grid ${agid.qx % 100}-${agid.qy % 100}`,
      district: "Open Ocean Sector",
      subdistrict: "Transatlantic Corridor",
      road: "Atlantic Marine Route",
      house_number: String((index % 9) + 1),
      building: "Ocean Handoff Point",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Atlantic Archipelago Corridor",
      city: "Island Service Area",
      district: "Island Approach Zone",
      subdistrict: "Shelf and Anchorage Sector",
      road: "Harbor Approach",
      house_number: String((index % 7) + 10),
      building: "Island Relief Anchorage",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Atlantic Marginal Sea Region",
      city: "Coastal Transfer Grid",
      district: point.name.includes("Channel") ? "Channel Navigation Zone" : "Bay and Gulf Sector",
      subdistrict: "Port Approach Sector",
      road: "Navigation Route",
      house_number: String((index % 5) + 20),
      building: "Marine Checkpoint",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Atlantic Safety Region",
      city: "Search and Rescue Grid",
      district: "Blue-Water Operations",
      subdistrict: point.name.includes("Labrador") ? "Ice and Fog Sector" : "Rescue Sector",
      road: "Ocean Rescue Route",
      house_number: String((index % 6) + 30),
      building: "Field Post",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Atlantic Waterfront Logistics",
      city: "Port Handoff Grid",
      district: point.name.includes("Sargasso") ? "Sargasso Sea Sector" : "Wharf Interface",
      subdistrict: "Jetty Landing",
      road: "Coastal Landing",
      house_number: String((index % 8) + 40),
      building: "Marine Terminal",
      poi: point.name,
    },
  ];

  return {
    ...fixtures[index % fixtures.length],
    country_code: point.id,
  };
}

function renderAtlanticDisplayQuality(
  point: AtlanticSeaStressPoint,
  language: string,
  fixture: Partial<CanonicalAddress>
) {
  const canonical = createCanonicalAddress({ country_code: point.id, ...fixture });
  const rendered = AddressRenderer.render(language, canonical);
  const text = formatAddressDisplayText(rendered, { tab: language, countryCode: point.id });
  const quality = assessAddressDisplayQuality(rendered, {
    country: canonical.country,
    countryCode: point.id,
  });
  return { rendered, text, quality };
}

describe("Atlantic AGID concentrated stress", () => {
  test("open Atlantic quadrants and equatorial cells resolve to ocean AGIDs", () => {
    for (const point of ATLANTIC_OPEN_OCEAN_POINTS) {
      assertAtlanticSeaPoint(point);
    }
  });

  test("Atlantic archipelago coarse boxes do not swallow open ocean", () => {
    for (const point of ATLANTIC_ARCHIPELAGO_BBOX_OCEAN_POINTS) {
      assertAtlanticSeaPoint(point);
    }
  });

  test("Atlantic marginal seas keep named sea AGIDs", () => {
    for (const point of ATLANTIC_MARGINAL_SEA_POINTS) {
      assertAtlanticSeaPoint(point);
    }
  });

  test("Atlantic island and coastal guard points stay classified as land", () => {
    for (const point of ATLANTIC_LAND_GUARD_POINTS) {
      const region = getRegionInfo(point.lat, point.lon);
      assert.equal(region.prefix, point.code, `${point.name} region prefix`);
      assert.equal(region.isSea, false, `${point.name} region should stay land`);

      const agid = encodeAGID(point.lat, point.lon);
      assert.equal(agid.regionCode, point.code, `${point.name} region code`);
      assert.equal(agid.isSea, false, `${point.name} AGID should stay land`);
      assert.ok(isValidAGIDFormat(agid.id), `${point.name} should emit a valid AGID`);
    }
  });

  test("Atlantic sea concentration stays fast enough for UI hit-testing", () => {
    const start = performance.now();

    for (const point of ALL_ATLANTIC_SEA_POINTS) {
      encodeAGID(point.lat, point.lon);
    }

    const elapsed = performance.now() - start;
    assert.ok(elapsed < 1800, `Atlantic AGID stress should stay fast, elapsed=${elapsed.toFixed(1)}ms`);
  });

  test("Atlantic ocean, archipelago, marginal sea, shelf, and channel AGIDs render strong address displays", () => {
    const start = performance.now();
    let renderCount = 0;

    for (const point of ALL_ATLANTIC_SEA_POINTS) {
      const distinctDisplays = new Set<string>();

      for (let index = 0; index < 20; index += 1) {
        const fixture = atlanticDisplayFixture(point, index);

        for (const language of ["en", "intl_en"] as const) {
          const result = renderAtlanticDisplayQuality(point, language, fixture);
          distinctDisplays.add(result.text);
          renderCount += 1;

          assert.equal(result.quality.isWeak, false, `${point.id}/${language}/${index} weak display: ${result.text}`);
          assert.ok(result.quality.score >= 0.62, `${point.id}/${language}/${index} score ${result.quality.score}: ${result.text}`);
          assert.ok(result.quality.meaningfulParts.length >= 3, `${point.id}/${language}/${index} should preserve Atlantic display context`);
          assert.equal(hasAdjacentRepeatedPart(result.text), false, `${point.id}/${language}/${index} adjacent repeated part: ${result.text}`);
          assert.match(
            result.text,
            /atlantic|ocean|sea|gulf|bay|channel|shelf|sargasso|transatlantic|marine|coastal|navigation|anchorage|harbor|harbour|wharf|jetty|landing|water/i,
            `${point.id}/${language}/${index} should expose Atlantic/ocean routing signal`
          );
        }
      }

      assert.ok(distinctDisplays.size >= 5, `${point.id} should produce multiple Atlantic display variants`);
    }

    const elapsed = performance.now() - start;
    assert.ok(renderCount >= 900, `expected concentrated Atlantic render coverage, got ${renderCount}`);
    assert.ok(elapsed < 3200, `Atlantic address display stress should stay fast, elapsed=${elapsed.toFixed(1)}ms`);
  });
});

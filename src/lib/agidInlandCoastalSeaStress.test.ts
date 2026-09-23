import assert from "node:assert";
import { performance } from "node:perf_hooks";
import { describe, test } from "node:test";

import { assessAddressDisplayQuality, formatAddressDisplayText } from "./addressDisplay";
import { AddressRenderer, createCanonicalAddress, type CanonicalAddress } from "./addressRendering";
import { decodeAGID, encodeAGID, getRegionInfo } from "./agid";
import { isValidAGIDFormat } from "./agidSecurity";

type SeaStressPoint = {
  readonly id: string;
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
};

type CoastalLandGuardPoint = {
  readonly code: string;
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
};

const INLAND_AND_ENCLOSED_SEA_POINTS: readonly SeaStressPoint[] = [
  { id: "CASP", name: "Caspian Sea", lat: 41, lon: 51 },
  { id: "BLCK", name: "Black Sea", lat: 43, lon: 34 },
  { id: "BALT", name: "Baltic Sea", lat: 56, lon: 18 },
  { id: "HUDS_L", name: "Hudson Bay", lat: 58, lon: -85 },
  { id: "PGUL", name: "Persian Gulf", lat: 26.5, lon: 52 },
  { id: "REDM", name: "Red Sea", lat: 20, lon: 38 },
  { id: "MARM", name: "Sea of Marmara", lat: 40.7, lon: 28 },
  { id: "AZOV", name: "Sea of Azov", lat: 46.3, lon: 36.5 },
  { id: "SETO", name: "Seto Inland Sea", lat: 34.2, lon: 133.5 },
  { id: "TKYB", name: "Tokyo Bay", lat: 35.45, lon: 139.9 },
  { id: "OSKB", name: "Osaka Bay", lat: 34.45, lon: 135.2 },
  { id: "ISEB", name: "Ise Bay", lat: 34.8, lon: 136.8 },
  { id: "ARIA", name: "Ariake Sea", lat: 32.9, lon: 130.3 },
  { id: "OMUR", name: "Omura Bay", lat: 32.95, lon: 129.9 },
];

const COASTAL_AND_MARGINAL_SEA_POINTS: readonly SeaStressPoint[] = [
  { id: "CALI", name: "Gulf of California", lat: 28, lon: -112 },
  { id: "GMXC", name: "Gulf of Mexico", lat: 24, lon: -90 },
  { id: "CARB", name: "Caribbean Sea", lat: 15, lon: -75 },
  { id: "NTHS", name: "North Sea", lat: 56, lon: 3 },
  { id: "ENGC", name: "English Channel", lat: 50, lon: -2 },
  { id: "BISC", name: "Bay of Biscay", lat: 45, lon: -5 },
  { id: "ADRI", name: "Adriatic Sea", lat: 43, lon: 16 },
  { id: "AEGE", name: "Aegean Sea", lat: 38, lon: 25 },
  { id: "GOMA", name: "Gulf of Oman", lat: 24.5, lon: 58 },
  { id: "BENG", name: "Bay of Bengal", lat: 15, lon: 88 },
  { id: "ARAB", name: "Arabian Sea", lat: 15, lon: 65 },
  { id: "ANDM", name: "Andaman Sea", lat: 10, lon: 96 },
  { id: "SSCH", name: "South China Sea", lat: 12, lon: 115 },
  { id: "ESCH", name: "East China Sea", lat: 29, lon: 125 },
  { id: "YELW", name: "Yellow Sea", lat: 36, lon: 123 },
  { id: "BOHI", name: "Bohai Sea", lat: 39, lon: 120 },
  { id: "SJPN", name: "Sea of Japan", lat: 40, lon: 135 },
  { id: "OKHT", name: "Sea of Okhotsk", lat: 54, lon: 150 },
  { id: "BERI", name: "Bering Sea", lat: 58, lon: -175 },
  { id: "CORL", name: "Coral Sea", lat: -18, lon: 155 },
  { id: "TASM", name: "Tasman Sea", lat: -40, lon: 160 },
  { id: "ARAF", name: "Arafura Sea", lat: -10, lon: 136 },
  { id: "TIMR", name: "Timor Sea", lat: -12, lon: 125 },
];

const STRAIT_AND_CHANNEL_POINTS: readonly SeaStressPoint[] = [
  { id: "MALA", name: "Strait of Malacca", lat: 3, lon: 100 },
  { id: "GBRL", name: "Strait of Gibraltar", lat: 36, lon: -5.5 },
  { id: "COOK_S1", name: "Cook Strait", lat: -41.2, lon: 174.5 },
  { id: "BASS", name: "Bass Strait", lat: -39, lon: 146 },
  { id: "MGLN", name: "Strait of Magellan", lat: -53, lon: -72 },
];

const COASTAL_LAND_GUARD_POINTS: readonly CoastalLandGuardPoint[] = [
  { code: "JP", name: "Tokyo Station", lat: 35.6812, lon: 139.7671 },
  { code: "JP", name: "Yokohama", lat: 35.4437, lon: 139.638 },
  { code: "JP", name: "Osaka", lat: 34.6937, lon: 135.5023 },
  { code: "JP", name: "Nagoya", lat: 35.1815, lon: 136.9066 },
  { code: "JP", name: "Hiroshima", lat: 34.3853, lon: 132.4553 },
  { code: "TR", name: "Istanbul", lat: 41.0082, lon: 28.9784 },
  { code: "GR", name: "Athens", lat: 37.9838, lon: 23.7275 },
  { code: "SE", name: "Stockholm", lat: 59.3293, lon: 18.0686 },
  { code: "DK", name: "Copenhagen", lat: 55.6761, lon: 12.5683 },
  { code: "FI", name: "Helsinki", lat: 60.1699, lon: 24.9384 },
  { code: "EE", name: "Tallinn", lat: 59.437, lon: 24.7536 },
  { code: "SG", name: "Singapore", lat: 1.3521, lon: 103.8198 },
  { code: "PH", name: "Manila", lat: 14.5995, lon: 120.9842 },
  { code: "OM", name: "Muscat", lat: 23.588, lon: 58.3829 },
  { code: "QA", name: "Doha", lat: 25.2854, lon: 51.531 },
  { code: "BH", name: "Manama", lat: 26.2235, lon: 50.5876 },
  { code: "GI", name: "Gibraltar", lat: 36.1408, lon: -5.3536 },
];

const ALL_SEA_POINTS = [
  ...INLAND_AND_ENCLOSED_SEA_POINTS,
  ...COASTAL_AND_MARGINAL_SEA_POINTS,
  ...STRAIT_AND_CHANNEL_POINTS,
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

function assertSeaPoint(point: SeaStressPoint) {
  const region = getRegionInfo(point.lat, point.lon);
  assert.equal(region.prefix, point.id, `${point.name} region`);
  assert.equal(region.isSea, true, `${point.name} region should be sea`);

  const agid = encodeAGID(point.lat, point.lon);
  assert.equal(agid.regionCode, point.id, `${point.name} AGID region code`);
  assert.equal(agid.isSea, true, `${point.name} AGID should be sea`);
  assert.ok(!/^[A-Z]{2}$/.test(agid.prefix), `${point.name} sea prefix should not collide with ISO alpha-alpha land codes`);
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

function seaFixture(point: SeaStressPoint, index: number): Partial<CanonicalAddress> {
  const agid = encodeAGID(point.lat, point.lon);
  const fixtures: Array<Partial<CanonicalAddress>> = [
    {
      country: point.name,
      state: "Marine Reference Area",
      city: `${point.name} Grid ${agid.qx % 100}`,
      district: "Navigation Zone",
      subdistrict: "Open Water Sector",
      road: "Marine Route",
      house_number: String((index % 9) + 1),
      building: "Coastal Handoff Point",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Coastal Sea Region",
      city: `${point.name} Service Area`,
      district: "Port Approach",
      subdistrict: "Anchorage Sector",
      road: "Harbor Approach",
      house_number: String((index % 7) + 10),
      building: "Relief Anchorage",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Inland and Coastal Water",
      city: `${point.name} Corridor`,
      district: point.name.includes("Strait") || point.name.includes("Channel") ? "Strait Channel" : "Bay Sector",
      subdistrict: "Pilot Station Area",
      road: "Navigation Route",
      house_number: String((index % 5) + 20),
      building: "Marine Checkpoint",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Sea Safety Region",
      city: `${point.name} Rescue Grid`,
      district: "Coastal Operations",
      subdistrict: "Search Sector",
      road: "Rescue Route",
      house_number: String((index % 6) + 30),
      building: "Field Post",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Waterfront Logistics Area",
      city: `${point.name} Transfer Grid`,
      district: "Wharf Interface",
      subdistrict: "Jetty Handoff",
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

function renderSeaQuality(point: SeaStressPoint, language: string, fixture: Partial<CanonicalAddress>) {
  const canonical = createCanonicalAddress({ country_code: point.id, ...fixture });
  const rendered = AddressRenderer.render(language, canonical);
  const text = formatAddressDisplayText(rendered, { tab: language, countryCode: point.id });
  const quality = assessAddressDisplayQuality(rendered, {
    country: canonical.country,
    countryCode: point.id,
  });
  return { rendered, text, quality };
}

describe("Inland and coastal sea AGID concentrated stress", () => {
  test("inland seas, enclosed seas, and bays override coarse land boxes", () => {
    for (const point of INLAND_AND_ENCLOSED_SEA_POINTS) {
      assertSeaPoint(point);
    }
  });

  test("coastal and marginal seas keep named-sea AGIDs instead of falling into nearby countries", () => {
    for (const point of COASTAL_AND_MARGINAL_SEA_POINTS) {
      assertSeaPoint(point);
    }
  });

  test("straits and channels keep dedicated sea AGIDs across narrow water corridors", () => {
    for (const point of STRAIT_AND_CHANNEL_POINTS) {
      assertSeaPoint(point);
    }
  });

  test("coastal land guard points stay classified as land after sea-priority matching", () => {
    for (const point of COASTAL_LAND_GUARD_POINTS) {
      const agid = encodeAGID(point.lat, point.lon);
      assert.equal(agid.regionCode, point.code, `${point.name} region code`);
      assert.equal(agid.isSea, false, `${point.name} should stay land`);
      assert.equal(agid.prefix, point.code, `${point.name} land prefix`);
    }
  });

  test("sea concentration stays fast enough for UI hit-testing", () => {
    const start = performance.now();

    for (const point of ALL_SEA_POINTS) {
      encodeAGID(point.lat, point.lon);
    }

    const elapsed = performance.now() - start;
    assert.ok(elapsed < 1800, `sea AGID stress should stay fast, elapsed=${elapsed.toFixed(1)}ms`);
  });

  test("inland, enclosed, coastal, and marginal sea AGIDs render useful marine address displays", () => {
    const start = performance.now();
    let renderCount = 0;

    for (const point of ALL_SEA_POINTS) {
      const distinctDisplays = new Set<string>();

      for (let index = 0; index < 20; index += 1) {
        const fixture = seaFixture(point, index);

        for (const language of ["en", "intl_en"] as const) {
          const result = renderSeaQuality(point, language, fixture);
          distinctDisplays.add(result.text);
          renderCount += 1;

          assert.equal(result.quality.isWeak, false, `${point.id}/${language}/${index} weak display: ${result.text}`);
          assert.ok(result.quality.score >= 0.62, `${point.id}/${language}/${index} score ${result.quality.score}: ${result.text}`);
          assert.ok(result.quality.meaningfulParts.length >= 3, `${point.id}/${language}/${index} should preserve marine context`);
          assert.equal(hasAdjacentRepeatedPart(result.text), false, `${point.id}/${language}/${index} adjacent repeated part: ${result.text}`);
          assert.match(
            result.text,
            /sea|bay|gulf|strait|channel|marine|coastal|navigation|anchorage|harbor|harbour|wharf|jetty|landing|water/i,
            `${point.id}/${language}/${index} should expose sea or coastal routing signal`
          );
        }
      }

      assert.ok(distinctDisplays.size >= 5, `${point.id} should produce multiple marine display variants`);
    }

    const elapsed = performance.now() - start;
    assert.ok(renderCount >= 1600, `expected concentrated marine render coverage, got ${renderCount}`);
    assert.ok(elapsed < 3200, `marine address display stress should stay fast, elapsed=${elapsed.toFixed(1)}ms`);
  });
});

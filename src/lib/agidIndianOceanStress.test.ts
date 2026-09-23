import assert from "node:assert";
import { performance } from "node:perf_hooks";
import { describe, test } from "node:test";

import { assessAddressDisplayQuality, formatAddressDisplayText } from "./addressDisplay";
import { AddressRenderer, createCanonicalAddress, type CanonicalAddress } from "./addressRendering";
import { decodeAGID, encodeAGID, getRegionInfo } from "./agid";
import { isValidAGIDFormat } from "./agidSecurity";

type IndianOceanSeaStressPoint = {
  readonly id: string;
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
};

type IndianOceanLandGuardPoint = {
  readonly code: string;
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
};

const INDIAN_OPEN_OCEAN_POINTS: readonly IndianOceanSeaStressPoint[] = [
  { id: "NIND", name: "North Indian Ocean east", lat: 4, lon: 83 },
  { id: "NIND", name: "West of northern Sumatra", lat: 3, lon: 94.95 },
  { id: "ARAB", name: "North Indian Ocean Arabian basin", lat: 10, lon: 65 },
  { id: "SIND", name: "South Indian Ocean central", lat: -25, lon: 75 },
  { id: "SIND", name: "South Indian Ocean west", lat: -35, lon: 45 },
  { id: "SIND", name: "South Indian Ocean east", lat: -30, lon: 105 },
  { id: "SIND", name: "South of Java open water", lat: -10.5, lon: 110 },
];

const INDIAN_ARCHIPELAGO_BBOX_OCEAN_POINTS: readonly IndianOceanSeaStressPoint[] = [
  { id: "LACC", name: "Maldives coarse box north open water", lat: 5, lon: 72.55 },
  { id: "SIND", name: "Maldives coarse box south open water", lat: -0.4, lon: 72.55 },
  { id: "SIND", name: "Seychelles coarse box open water", lat: -6, lon: 56.5 },
  { id: "SIND", name: "Mauritius coarse box open water", lat: -20.55, lon: 57.75 },
  { id: "SIND", name: "Comoros coarse box open water", lat: -11.25, lon: 44.55 },
  { id: "SIND", name: "Chagos coarse box open water", lat: -5.5, lon: 72.8 },
  { id: "SIND", name: "Cocos coarse box open water", lat: -12, lon: 96.92 },
  { id: "SIND", name: "Christmas Island coarse box open water", lat: -10.55, lon: 105.52 },
];

const INDIAN_MARGINAL_SEA_POINTS: readonly IndianOceanSeaStressPoint[] = [
  { id: "ARAB", name: "Arabian Sea", lat: 15, lon: 63 },
  { id: "BENG", name: "Bay of Bengal", lat: 12, lon: 88 },
  { id: "ANDM", name: "Andaman Sea", lat: 11, lon: 96 },
  { id: "LACC", name: "Laccadive Sea", lat: 8, lon: 74 },
  { id: "MOZA", name: "Mozambique Channel", lat: -18, lon: 42 },
  { id: "ADEN", name: "Gulf of Aden", lat: 13, lon: 48 },
  { id: "PGUL", name: "Persian Gulf", lat: 27, lon: 52 },
  { id: "GOMA", name: "Gulf of Oman", lat: 24, lon: 58 },
  { id: "KUTC", name: "Gulf of Kutch", lat: 22.7, lon: 69.5 },
  { id: "KHAM", name: "Gulf of Khambhat", lat: 21.5, lon: 72.2 },
  { id: "MALA", name: "Strait of Malacca", lat: 3, lon: 101 },
  { id: "TIMR", name: "Timor Sea", lat: -12, lon: 125 },
  { id: "BNDA", name: "Banda Sea", lat: -5, lon: 128 },
];

const INDIAN_LAND_GUARD_POINTS: readonly IndianOceanLandGuardPoint[] = [
  { code: "IN", name: "Goa", lat: 15.4909, lon: 73.8278 },
  { code: "IN", name: "Kavaratti", lat: 10.5593, lon: 72.6358 },
  { code: "IN", name: "Kochi", lat: 9.9312, lon: 76.2673 },
  { code: "IN", name: "Thiruvananthapuram", lat: 8.5241, lon: 76.9366 },
  { code: "IN", name: "Bhuj", lat: 23.2419, lon: 69.6669 },
  { code: "IN", name: "Jamnagar", lat: 22.4707, lon: 70.0577 },
  { code: "IN", name: "Bhavnagar", lat: 21.7645, lon: 72.1519 },
  { code: "IN", name: "Surat", lat: 21.1702, lon: 72.8311 },
  { code: "LK", name: "Colombo", lat: 6.9271, lon: 79.8612 },
  { code: "MV", name: "Male", lat: 4.1755, lon: 73.5093 },
  { code: "SC", name: "Victoria Seychelles", lat: -4.62, lon: 55.45 },
  { code: "MU", name: "Port Louis", lat: -20.1609, lon: 57.5012 },
  { code: "KM", name: "Moroni", lat: -11.7042, lon: 43.2402 },
  { code: "YT", name: "Mamoudzou", lat: -12.7806, lon: 45.2279 },
  { code: "RE", name: "Saint-Denis", lat: -20.8823, lon: 55.4504 },
  { code: "IO", name: "Diego Garcia", lat: -7.3195, lon: 72.4229 },
  { code: "CC", name: "Cocos West Island", lat: -12.1888, lon: 96.8293 },
  { code: "CX", name: "Christmas Island", lat: -10.4475, lon: 105.6904 },
  { code: "YE", name: "Aden", lat: 12.7855, lon: 45.0187 },
  { code: "DJ", name: "Djibouti", lat: 11.5721, lon: 43.1456 },
  { code: "KE", name: "Mombasa", lat: -4.0435, lon: 39.6682 },
  { code: "TZ", name: "Dar es Salaam", lat: -6.7924, lon: 39.2083 },
  { code: "MZ", name: "Maputo", lat: -25.9692, lon: 32.5732 },
  { code: "MG", name: "Toamasina", lat: -18.1492, lon: 49.4023 },
  { code: "AU", name: "Perth", lat: -31.9523, lon: 115.8613 },
  { code: "ID", name: "Java land guard", lat: -7.6, lon: 110.8 },
  { code: "ID", name: "Jakarta", lat: -6.2088, lon: 106.8456 },
  { code: "ID", name: "Denpasar", lat: -8.65, lon: 115.2167 },
  { code: "ID", name: "Makassar", lat: -5.1477, lon: 119.4327 },
];

const ALL_INDIAN_SEA_POINTS = [
  ...INDIAN_OPEN_OCEAN_POINTS,
  ...INDIAN_ARCHIPELAGO_BBOX_OCEAN_POINTS,
  ...INDIAN_MARGINAL_SEA_POINTS,
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

function assertIndianOceanSeaPoint(point: IndianOceanSeaStressPoint) {
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

function indianOceanDisplayFixture(
  point: IndianOceanSeaStressPoint,
  index: number
): Partial<CanonicalAddress> {
  const agid = encodeAGID(point.lat, point.lon);
  const fixtures: Array<Partial<CanonicalAddress>> = [
    {
      country: point.name,
      state: "Indian Ocean Reference Area",
      city: `Indian Ocean Grid ${agid.qx % 100}-${agid.qy % 100}`,
      district: "Open Ocean Sector",
      subdistrict: "Monsoon Route Corridor",
      road: "Indian Ocean Marine Route",
      house_number: String((index % 9) + 1),
      building: "Ocean Handoff Point",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Indian Ocean Island Corridor",
      city: "Archipelago Service Area",
      district: "Atoll and Reef Pass Zone",
      subdistrict: "Lagoon Anchorage Sector",
      road: "Reef Pass Landing",
      house_number: String((index % 7) + 10),
      building: "Island Relief Anchorage",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Indian Ocean Marginal Sea Region",
      city: "Coastal Transfer Grid",
      district: point.name.includes("Channel") || point.name.includes("Strait") ? "Channel Navigation Zone" : "Bay and Gulf Sector",
      subdistrict: "Port Approach Sector",
      road: "Dhow Navigation Route",
      house_number: String((index % 5) + 20),
      building: "Marine Checkpoint",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Indian Ocean Safety Region",
      city: "Search and Rescue Grid",
      district: point.name.includes("Bengal") ? "Cyclone Watch Sector" : "Blue-Water Operations",
      subdistrict: "Rescue Sector",
      road: "Ocean Rescue Route",
      house_number: String((index % 6) + 30),
      building: "Field Post",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Indian Ocean Waterfront Logistics",
      city: "Port Handoff Grid",
      district: point.name.includes("Arabian") ? "Arabian Sea Approach" : "Wharf Interface",
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

function renderIndianOceanDisplayQuality(
  point: IndianOceanSeaStressPoint,
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

describe("Indian Ocean AGID concentrated stress", () => {
  test("open Indian Ocean cells resolve to ocean AGIDs", () => {
    for (const point of INDIAN_OPEN_OCEAN_POINTS) {
      assertIndianOceanSeaPoint(point);
    }
  });

  test("Indian Ocean island and territory coarse boxes do not swallow open water", () => {
    for (const point of INDIAN_ARCHIPELAGO_BBOX_OCEAN_POINTS) {
      assertIndianOceanSeaPoint(point);
    }
  });

  test("Indian Ocean marginal seas, gulfs, and straits keep named sea AGIDs", () => {
    for (const point of INDIAN_MARGINAL_SEA_POINTS) {
      assertIndianOceanSeaPoint(point);
    }
  });

  test("Indian Ocean coastal and island guard points stay classified as land", () => {
    for (const point of INDIAN_LAND_GUARD_POINTS) {
      const region = getRegionInfo(point.lat, point.lon);
      assert.equal(region.prefix, point.code, `${point.name} region prefix`);
      assert.equal(region.isSea, false, `${point.name} region should stay land`);

      const agid = encodeAGID(point.lat, point.lon);
      assert.equal(agid.regionCode, point.code, `${point.name} region code`);
      assert.equal(agid.isSea, false, `${point.name} AGID should stay land`);
      assert.ok(isValidAGIDFormat(agid.id), `${point.name} should emit a valid AGID`);
    }
  });

  test("Indian Ocean sea concentration stays fast enough for UI hit-testing", () => {
    const start = performance.now();

    for (const point of ALL_INDIAN_SEA_POINTS) {
      encodeAGID(point.lat, point.lon);
    }

    const elapsed = performance.now() - start;
    assert.ok(elapsed < 1800, `Indian Ocean AGID stress should stay fast, elapsed=${elapsed.toFixed(1)}ms`);
  });

  test("Indian Ocean ocean, archipelago, marginal sea, gulf, channel, and strait AGIDs render strong address displays", () => {
    const start = performance.now();
    let renderCount = 0;

    for (const point of ALL_INDIAN_SEA_POINTS) {
      const distinctDisplays = new Set<string>();

      for (let index = 0; index < 20; index += 1) {
        const fixture = indianOceanDisplayFixture(point, index);

        for (const language of ["en", "intl_en"] as const) {
          const result = renderIndianOceanDisplayQuality(point, language, fixture);
          distinctDisplays.add(result.text);
          renderCount += 1;

          assert.equal(result.quality.isWeak, false, `${point.id}/${language}/${index} weak display: ${result.text}`);
          assert.ok(result.quality.score >= 0.62, `${point.id}/${language}/${index} score ${result.quality.score}: ${result.text}`);
          assert.ok(result.quality.meaningfulParts.length >= 3, `${point.id}/${language}/${index} should preserve Indian Ocean display context`);
          assert.equal(hasAdjacentRepeatedPart(result.text), false, `${point.id}/${language}/${index} adjacent repeated part: ${result.text}`);
          assert.match(
            result.text,
            /indian|ocean|arabian|bengal|andaman|laccadive|mozambique|malacca|sea|gulf|bay|channel|strait|marine|coastal|navigation|anchorage|monsoon|dhow|reef|lagoon|wharf|jetty|landing|water/i,
            `${point.id}/${language}/${index} should expose Indian Ocean/ocean routing signal`
          );
        }
      }

      assert.ok(distinctDisplays.size >= 5, `${point.id} should produce multiple Indian Ocean display variants`);
    }

    const elapsed = performance.now() - start;
    assert.ok(renderCount >= 1100, `expected concentrated Indian Ocean render coverage, got ${renderCount}`);
    assert.ok(elapsed < 3200, `Indian Ocean address display stress should stay fast, elapsed=${elapsed.toFixed(1)}ms`);
  });
});

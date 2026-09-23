import assert from "node:assert";
import { performance } from "node:perf_hooks";
import { describe, test } from "node:test";

import { assessAddressDisplayQuality, formatAddressDisplayText } from "./addressDisplay";
import { AddressRenderer, createCanonicalAddress, type CanonicalAddress } from "./addressRendering";
import { decodeAGID, encodeAGID, getRegionInfo } from "./agid";
import { isValidAGIDFormat } from "./agidSecurity";

type PacificSeaStressPoint = {
  readonly id: string;
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
};

type PacificLandGuardPoint = {
  readonly code: string;
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
};

const PACIFIC_OPEN_OCEAN_POINTS: readonly PacificSeaStressPoint[] = [
  { id: "NPAC", name: "North Pacific Ocean west", lat: 30, lon: 160 },
  { id: "NEPC", name: "North Pacific Ocean east", lat: 30, lon: -150 },
  { id: "NPAC", name: "North Pacific near date line east", lat: 10, lon: 179.5 },
  { id: "NEPC", name: "North Pacific near date line west", lat: 10, lon: -179.5 },
  { id: "SPAC", name: "South Pacific Ocean west", lat: -25, lon: 170 },
  { id: "SEPC", name: "South Pacific Ocean east", lat: -30, lon: -120 },
  { id: "SPAC", name: "South Pacific near date line east", lat: -25, lon: 179.4 },
  { id: "SEPC", name: "South Pacific near date line west", lat: -25, lon: -179.4 },
];

const PACIFIC_ARCHIPELAGO_BBOX_OCEAN_POINTS: readonly PacificSeaStressPoint[] = [
  { id: "SPAC", name: "Vanuatu coarse box open water", lat: -20, lon: 170 },
  { id: "SPAC", name: "Fiji coarse box open water", lat: -15.2, lon: 179.5 },
  { id: "NPAC", name: "Micronesia coarse box open water", lat: 1, lon: 150 },
  { id: "NPAC", name: "Kiribati and Marshall coarse box open water", lat: 4, lon: 170 },
  { id: "SEPC", name: "Cook Islands coarse box open water", lat: -10, lon: -160 },
  { id: "SEPC", name: "French Polynesia coarse box open water", lat: -10, lon: -145 },
];

const PACIFIC_MARGINAL_SEA_POINTS: readonly PacificSeaStressPoint[] = [
  { id: "BERI", name: "Bering Sea", lat: 58, lon: -175 },
  { id: "OKHT", name: "Sea of Okhotsk", lat: 54, lon: 150 },
  { id: "SJPN", name: "Sea of Japan", lat: 40, lon: 135 },
  { id: "ESCH", name: "East China Sea", lat: 29, lon: 125 },
  { id: "YELW", name: "Yellow Sea", lat: 36, lon: 123 },
  { id: "BOHI", name: "Bohai Sea", lat: 39, lon: 120 },
  { id: "PHLS", name: "Philippine Sea", lat: 20, lon: 135 },
  { id: "CALI", name: "Gulf of California", lat: 28, lon: -112 },
  { id: "CORL", name: "Coral Sea", lat: -18, lon: 155 },
  { id: "TASM", name: "Tasman Sea", lat: -40, lon: 160 },
  { id: "SOLO", name: "Solomon Sea", lat: -8, lon: 156 },
  { id: "BISM", name: "Bismarck Sea", lat: -4, lon: 150 },
  { id: "COOK_S1", name: "Cook Strait", lat: -41.2, lon: 174.5 },
  { id: "BASS", name: "Bass Strait", lat: -39, lon: 146 },
];

const PACIFIC_LAND_GUARD_POINTS: readonly PacificLandGuardPoint[] = [
  { code: "PG", name: "Port Moresby", lat: -9.4438, lon: 147.1803 },
  { code: "FJ", name: "Suva", lat: -18.1248, lon: 178.4501 },
  { code: "VU", name: "Port Vila", lat: -17.7333, lon: 168.3273 },
  { code: "SB", name: "Honiara", lat: -9.4456, lon: 159.9729 },
  { code: "NC", name: "Noumea", lat: -22.2758, lon: 166.458 },
  { code: "WS", name: "Apia", lat: -13.8507, lon: -171.7514 },
  { code: "KI", name: "South Tarawa", lat: 1.3278, lon: 172.9769 },
  { code: "KI", name: "Kiritimati", lat: 1.8721, lon: -157.4278 },
  { code: "TO", name: "Nuku'alofa", lat: -21.1394, lon: -175.2049 },
  { code: "FM", name: "Palikir", lat: 6.9178, lon: 158.185 },
  { code: "PW", name: "Ngerulmud", lat: 7.5006, lon: 134.6242 },
  { code: "MH", name: "Majuro", lat: 7.1164, lon: 171.1858 },
  { code: "TV", name: "Funafuti", lat: -8.5243, lon: 179.1942 },
  { code: "NR", name: "Yaren", lat: -0.5477, lon: 166.9209 },
  { code: "GU", name: "Hagatna", lat: 13.4763, lon: 144.7502 },
  { code: "MP", name: "Saipan", lat: 15.1778, lon: 145.7509 },
  { code: "AS", name: "Pago Pago", lat: -14.2756, lon: -170.702 },
  { code: "CK", name: "Avarua", lat: -21.2129, lon: -159.7823 },
  { code: "PF", name: "Papeete", lat: -17.5516, lon: -149.5585 },
  { code: "NZ", name: "Wellington", lat: -41.2865, lon: 174.7762 },
  { code: "US", name: "Honolulu", lat: 21.3069, lon: -157.8583 },
];

const ALL_PACIFIC_SEA_POINTS = [
  ...PACIFIC_OPEN_OCEAN_POINTS,
  ...PACIFIC_ARCHIPELAGO_BBOX_OCEAN_POINTS,
  ...PACIFIC_MARGINAL_SEA_POINTS,
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

function assertPacificSeaPoint(point: PacificSeaStressPoint) {
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

function pacificDisplayFixture(point: PacificSeaStressPoint, index: number): Partial<CanonicalAddress> {
  const agid = encodeAGID(point.lat, point.lon);
  const fixtures: Array<Partial<CanonicalAddress>> = [
    {
      country: point.name,
      state: "Pacific Ocean Reference Area",
      city: `Pacific Grid ${agid.qx % 100}-${agid.qy % 100}`,
      district: "Open Ocean Sector",
      subdistrict: "Date Line Safe Zone",
      road: "Pacific Marine Route",
      house_number: String((index % 9) + 1),
      building: "Ocean Handoff Point",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Pacific Island Corridor",
      city: "Archipelago Service Area",
      district: "Outer Island Navigation Zone",
      subdistrict: "Atoll and Reef Sector",
      road: "Lagoon Causeway",
      house_number: String((index % 7) + 10),
      building: "Island Relief Anchorage",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Pacific Marginal Sea Region",
      city: "Coastal Transfer Grid",
      district: point.name.includes("Strait") || point.name.includes("Channel") ? "Strait Channel" : "Sea Approach",
      subdistrict: "Port Approach Sector",
      road: "Navigation Route",
      house_number: String((index % 5) + 20),
      building: "Marine Checkpoint",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Pacific Safety Region",
      city: "Search and Rescue Grid",
      district: "Blue-Water Operations",
      subdistrict: "Rescue Sector",
      road: "Ocean Rescue Route",
      house_number: String((index % 6) + 30),
      building: "Field Post",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Pacific Waterfront Logistics",
      city: "Island Handoff Grid",
      district: "Wharf Interface",
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

function renderPacificDisplayQuality(
  point: PacificSeaStressPoint,
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

describe("Pacific AGID concentrated stress", () => {
  test("open Pacific quadrants and date-line cells resolve to ocean AGIDs", () => {
    for (const point of PACIFIC_OPEN_OCEAN_POINTS) {
      assertPacificSeaPoint(point);
    }
  });

  test("Pacific island-country coarse boxes do not swallow open ocean", () => {
    for (const point of PACIFIC_ARCHIPELAGO_BBOX_OCEAN_POINTS) {
      assertPacificSeaPoint(point);
    }
  });

  test("Pacific marginal seas and straits keep named sea AGIDs", () => {
    for (const point of PACIFIC_MARGINAL_SEA_POINTS) {
      assertPacificSeaPoint(point);
    }
  });

  test("Pacific island and coastal guard points stay classified as land", () => {
    for (const point of PACIFIC_LAND_GUARD_POINTS) {
      const agid = encodeAGID(point.lat, point.lon);
      assert.equal(agid.regionCode, point.code, `${point.name} region code`);
      assert.equal(agid.prefix, point.code, `${point.name} prefix`);
      assert.equal(agid.isSea, false, `${point.name} should stay land`);
      assert.ok(isValidAGIDFormat(agid.id), `${point.name} should emit a valid AGID`);
    }
  });

  test("Pacific sea concentration stays fast enough for UI hit-testing", () => {
    const start = performance.now();

    for (const point of ALL_PACIFIC_SEA_POINTS) {
      encodeAGID(point.lat, point.lon);
    }

    const elapsed = performance.now() - start;
    assert.ok(elapsed < 1800, `Pacific AGID stress should stay fast, elapsed=${elapsed.toFixed(1)}ms`);
  });

  test("Pacific ocean, archipelago, marginal sea, and strait AGIDs render strong address displays", () => {
    const start = performance.now();
    let renderCount = 0;

    for (const point of ALL_PACIFIC_SEA_POINTS) {
      const distinctDisplays = new Set<string>();

      for (let index = 0; index < 20; index += 1) {
        const fixture = pacificDisplayFixture(point, index);

        for (const language of ["en", "intl_en"] as const) {
          const result = renderPacificDisplayQuality(point, language, fixture);
          distinctDisplays.add(result.text);
          renderCount += 1;

          assert.equal(result.quality.isWeak, false, `${point.id}/${language}/${index} weak display: ${result.text}`);
          assert.ok(result.quality.score >= 0.62, `${point.id}/${language}/${index} score ${result.quality.score}: ${result.text}`);
          assert.ok(result.quality.meaningfulParts.length >= 3, `${point.id}/${language}/${index} should preserve Pacific display context`);
          assert.equal(hasAdjacentRepeatedPart(result.text), false, `${point.id}/${language}/${index} adjacent repeated part: ${result.text}`);
          assert.match(
            result.text,
            /pacific|ocean|sea|gulf|strait|channel|marine|coastal|navigation|anchorage|atoll|reef|lagoon|island|wharf|jetty|landing|water/i,
            `${point.id}/${language}/${index} should expose Pacific/ocean routing signal`
          );
        }
      }

      assert.ok(distinctDisplays.size >= 5, `${point.id} should produce multiple Pacific display variants`);
    }

    const elapsed = performance.now() - start;
    assert.ok(renderCount >= 1100, `expected concentrated Pacific render coverage, got ${renderCount}`);
    assert.ok(elapsed < 3200, `Pacific address display stress should stay fast, elapsed=${elapsed.toFixed(1)}ms`);
  });
});

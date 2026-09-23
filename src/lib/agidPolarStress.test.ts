import assert from "node:assert";
import { performance } from "node:perf_hooks";
import { describe, test } from "node:test";

import { assessAddressDisplayQuality, formatAddressDisplayText } from "./addressDisplay";
import { AddressRenderer, createCanonicalAddress, type CanonicalAddress } from "./addressRendering";
import { decodeAGID, encodeAGID, getRegionInfo } from "./agid";
import { isValidAGIDFormat } from "./agidSecurity";

type PolarSeaStressPoint = {
  readonly id: string;
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
};

type PolarLandGuardPoint = {
  readonly code: string;
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
};

const ARCTIC_SEA_POINTS: readonly PolarSeaStressPoint[] = [
  { id: "ARCT", name: "Arctic Ocean central", lat: 85, lon: 0 },
  { id: "ARCT", name: "Arctic Ocean north pole threshold", lat: 89.94, lon: 0 },
  { id: "ARCT", name: "Canadian Arctic basin open water", lat: 82, lon: -120 },
  { id: "BARE", name: "Barents Sea", lat: 78, lon: 45 },
  { id: "KARA", name: "Kara Sea", lat: 75, lon: 80 },
  { id: "CHUK", name: "Chukchi Sea", lat: 72, lon: -175 },
];

const SOUTHERN_SEA_POINTS: readonly PolarSeaStressPoint[] = [
  { id: "LAZA", name: "Lazarev Sea", lat: -60.1, lon: 10 },
  { id: "WEDD", name: "Weddell Sea", lat: -64, lon: -45 },
  { id: "ROSS", name: "Ross Sea", lat: -65, lon: 170 },
  { id: "AMUN", name: "Amundsen Sea", lat: -64, lon: -135 },
  { id: "BELL", name: "Bellingshausen Sea", lat: -64, lon: -90 },
];

const ARCTIC_LAND_GUARD_POINTS: readonly PolarLandGuardPoint[] = [
  { code: "CA", name: "Alert Nunavut", lat: 82.5018, lon: -62.3481 },
  { code: "CA", name: "Resolute Nunavut", lat: 74.6973, lon: -94.8297 },
  { code: "US", name: "Utqiagvik Alaska", lat: 71.2906, lon: -156.7886 },
  { code: "RU", name: "Tiksi", lat: 71.6872, lon: 128.8694 },
  { code: "GL", name: "Nuuk Greenland", lat: 64.1835, lon: -51.7216 },
  { code: "GL", name: "North Greenland coast", lat: 82.5, lon: -40 },
  { code: "SJ_SVA", name: "Longyearbyen Svalbard", lat: 78.2232, lon: 15.6469 },
  { code: "SJ_JAN", name: "Jan Mayen", lat: 70.982, lon: -8.536 },
];

const ANTARCTIC_LAND_GUARD_POINTS: readonly PolarLandGuardPoint[] = [
  { code: "AQ", name: "Antarctic interior", lat: -75, lon: 45 },
  { code: "AQ", name: "South Pole", lat: -89.999999, lon: 0 },
  { code: "AQ", name: "McMurdo Station", lat: -77.85, lon: 166.67 },
  { code: "AQ", name: "Rothera Research Station", lat: -67.568, lon: -68.13 },
  { code: "AQ", name: "Palmer Station", lat: -64.774, lon: -64.054 },
  { code: "AQ", name: "Belgrano II Antarctic Base", lat: -77.873889, lon: -34.627778 },
  { code: "AQ", name: "Casey Station", lat: -66.2825, lon: 110.5267 },
  { code: "AQ", name: "Syowa Station", lat: -69.006, lon: 39.59 },
  { code: "AQ", name: "Vostok Station", lat: -78.464, lon: 106.837 },
  { code: "GS", name: "South Georgia Grytviken", lat: -54.2811, lon: -36.508 },
  { code: "BV", name: "Bouvet Island", lat: -54.4208, lon: 3.3464 },
  { code: "TF", name: "Kerguelen Port-aux-Francais", lat: -49.35, lon: 70.2167 },
  { code: "TF", name: "Crozet Islands", lat: -46.43, lon: 51.85 },
];

const ALL_POLAR_SEA_POINTS = [
  ...ARCTIC_SEA_POINTS,
  ...SOUTHERN_SEA_POINTS,
] as const;

const ALL_POLAR_POINTS = [
  ...ALL_POLAR_SEA_POINTS,
  ...ARCTIC_LAND_GUARD_POINTS,
  ...ANTARCTIC_LAND_GUARD_POINTS,
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

function assertPolarSeaPoint(point: PolarSeaStressPoint) {
  const region = getRegionInfo(point.lat, point.lon);
  assert.equal(region.prefix, point.id, `${point.name} region`);
  assert.equal(region.isSea, true, `${point.name} region should be sea`);

  const agid = encodeAGID(point.lat, point.lon);
  assert.equal(agid.regionCode, point.id, `${point.name} AGID region code`);
  assert.equal(agid.isSea, true, `${point.name} AGID should be sea`);
  assert.ok(!/^[A-Z]{2}$/.test(agid.prefix), `${point.name} sea prefix should not collide with land codes`);
  assert.ok(isValidAGIDFormat(agid.id), `${point.name} should emit a valid AGID`);

  const decoded = decodeAGID(agid.id);
  assert.ok(decoded, `${point.name} AGID should decode`);
  assert.equal(decoded.face, agid.face, `${point.name} decoded face`);
  assert.equal(decoded.qx, agid.qx, `${point.name} decoded qx`);
  assert.equal(decoded.qy, agid.qy, `${point.name} decoded qy`);
  assert.equal(decoded.prefix, agid.prefix, `${point.name} decoded prefix`);

  const centerError = haversineMeters(point, { lat: decoded.lat, lon: decoded.lon });
  assert.ok(centerError <= 20, `${point.name} center error ${centerError.toFixed(2)}m`);
}

function assertPolarLandPoint(point: PolarLandGuardPoint) {
  const region = getRegionInfo(point.lat, point.lon);
  assert.equal(region.prefix, point.code, `${point.name} region prefix`);
  assert.equal(region.isSea, false, `${point.name} region should stay land`);

  const agid = encodeAGID(point.lat, point.lon);
  assert.equal(agid.regionCode, point.code, `${point.name} AGID region code`);
  assert.equal(agid.isSea, false, `${point.name} AGID should stay land`);
  assert.ok(isValidAGIDFormat(agid.id), `${point.name} should emit a valid AGID`);
}

function hasAdjacentRepeatedPart(text: string): boolean {
  const parts = text
    .split(/\r?\n|,/)
    .map((part) => part.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "").trim())
    .filter(Boolean);

  return parts.some((part, index) => index > 0 && part === parts[index - 1]);
}

function polarSeaDisplayFixture(point: PolarSeaStressPoint, index: number): Partial<CanonicalAddress> {
  const agid = encodeAGID(point.lat, point.lon);
  const fixtures: Array<Partial<CanonicalAddress>> = [
    {
      country: point.name,
      state: "Polar Ocean Reference Area",
      city: `Polar Grid ${agid.qx % 100}-${agid.qy % 100}`,
      district: point.lat > 0 ? "Arctic Sea Ice Sector" : "Southern Ocean Sector",
      subdistrict: "Pack Ice Corridor",
      road: "Polar Marine Route",
      house_number: String((index % 9) + 1),
      building: "Ice Handoff Point",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Polar Marginal Sea Region",
      city: "Ice Shelf Approach Grid",
      district: "Polynya Navigation Zone",
      subdistrict: "Sea Ice Lead",
      road: "Ice Navigation Route",
      house_number: String((index % 7) + 10),
      building: "Research Station Relay",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Polar Safety Region",
      city: "Search and Rescue Grid",
      district: "Whiteout Operations",
      subdistrict: "Ice Floe Sector",
      road: "Rescue Route",
      house_number: String((index % 5) + 20),
      building: "Field Post",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Polar Logistics Corridor",
      city: "Coastal Supply Grid",
      district: "Shelf Ice Interface",
      subdistrict: "Anchorage Sector",
      road: "Coastal Landing",
      house_number: String((index % 6) + 30),
      building: "Polar Base Handoff Point",
      poi: point.name,
    },
  ];

  return {
    ...fixtures[index % fixtures.length],
    country_code: point.id,
  };
}

function polarLandDisplayFixture(point: PolarLandGuardPoint, index: number): Partial<CanonicalAddress> {
  const fixtures: Array<Partial<CanonicalAddress>> = [
    {
      country: point.code === "AQ" ? "Antarctica" : point.name,
      state: "Polar Administrative Area",
      city: point.name,
      district: "Research Station District",
      subdistrict: "Field Base Sector",
      road: "Ice Runway",
      house_number: String((index % 9) + 1),
      building: "Research Station",
      postcode: point.code === "AQ" ? "" : "0000",
    },
    {
      country: point.code === "AQ" ? "Antarctica" : point.name,
      state: "Polar Logistics Area",
      city: point.name,
      district: "Coastal Supply District",
      subdistrict: "Shelter Sector",
      road: "Station Track",
      house_number: String((index % 7) + 10),
      building: "Field Base",
      postcode: point.code === "AQ" ? "" : "0000",
    },
  ];

  return {
    ...fixtures[index % fixtures.length],
    country_code: point.code,
  };
}

function renderPolarDisplayQuality(
  countryCode: string,
  language: string,
  fixture: Partial<CanonicalAddress>
) {
  const canonical = createCanonicalAddress({ country_code: countryCode, ...fixture });
  const rendered = AddressRenderer.render(language, canonical);
  const text = formatAddressDisplayText(rendered, { tab: language, countryCode });
  const quality = assessAddressDisplayQuality(rendered, {
    country: canonical.country,
    countryCode,
  });
  return { rendered, text, quality };
}

describe("Polar and polar-sea AGID concentrated stress", () => {
  test("Arctic Ocean and Arctic marginal seas stay classified as sea", () => {
    for (const point of ARCTIC_SEA_POINTS) {
      assertPolarSeaPoint(point);
    }
  });

  test("Southern Ocean marginal seas stay classified as sea near the Antarctic perimeter", () => {
    for (const point of SOUTHERN_SEA_POINTS) {
      assertPolarSeaPoint(point);
    }
  });

  test("Arctic settlements, islands, and Greenland guards stay classified as land", () => {
    for (const point of ARCTIC_LAND_GUARD_POINTS) {
      assertPolarLandPoint(point);
    }
  });

  test("Antarctic facilities and sub-Antarctic islands stay classified as land", () => {
    for (const point of ANTARCTIC_LAND_GUARD_POINTS) {
      assertPolarLandPoint(point);
    }
  });

  test("polar concentration stays fast enough for map hover and scan flows", () => {
    const start = performance.now();

    for (const point of ALL_POLAR_POINTS) {
      encodeAGID(point.lat, point.lon);
    }

    const elapsed = performance.now() - start;
    assert.ok(elapsed < 1800, `Polar AGID stress should stay fast, elapsed=${elapsed.toFixed(1)}ms`);
  });

  test("polar ocean and polar-sea AGIDs render strong ice-aware address displays", () => {
    const start = performance.now();
    let renderCount = 0;

    for (const point of ALL_POLAR_SEA_POINTS) {
      const distinctDisplays = new Set<string>();

      for (let index = 0; index < 20; index += 1) {
        const fixture = polarSeaDisplayFixture(point, index);

        for (const language of ["en", "intl_en"] as const) {
          const result = renderPolarDisplayQuality(point.id, language, fixture);
          distinctDisplays.add(result.text);
          renderCount += 1;

          assert.equal(result.quality.isWeak, false, `${point.id}/${language}/${index} weak display: ${result.text}`);
          assert.ok(result.quality.score >= 0.62, `${point.id}/${language}/${index} score ${result.quality.score}: ${result.text}`);
          assert.ok(result.quality.meaningfulParts.length >= 3, `${point.id}/${language}/${index} should preserve polar-sea display context`);
          assert.equal(hasAdjacentRepeatedPart(result.text), false, `${point.id}/${language}/${index} adjacent repeated part: ${result.text}`);
          assert.match(
            result.text,
            /polar|arctic|antarctic|southern|ocean|sea|ice|shelf|polynya|floe|pack|marine|coastal|navigation|anchorage|research|base|handoff|water/i,
            `${point.id}/${language}/${index} should expose polar/ocean routing signal`
          );
        }
      }

      assert.ok(distinctDisplays.size >= 4, `${point.id} should produce multiple polar-sea display variants`);
    }

    const elapsed = performance.now() - start;
    assert.ok(renderCount >= 400, `expected concentrated polar-sea render coverage, got ${renderCount}`);
    assert.ok(elapsed < 2500, `polar-sea address display stress should stay fast, elapsed=${elapsed.toFixed(1)}ms`);
  });

  test("polar land guard AGIDs render useful research-station and logistics displays", () => {
    const start = performance.now();
    let renderCount = 0;
    const landPoints = [...ARCTIC_LAND_GUARD_POINTS, ...ANTARCTIC_LAND_GUARD_POINTS] as const;

    for (const point of landPoints) {
      for (let index = 0; index < 10; index += 1) {
        const fixture = polarLandDisplayFixture(point, index);
        const result = renderPolarDisplayQuality(point.code, "en", fixture);
        renderCount += 1;

        assert.equal(result.quality.isWeak, false, `${point.code}/${point.name}/${index} weak display: ${result.text}`);
        assert.ok(result.quality.score >= 0.62, `${point.code}/${point.name}/${index} score ${result.quality.score}: ${result.text}`);
        assert.ok(result.quality.meaningfulParts.length >= 3, `${point.code}/${point.name}/${index} should preserve polar land context`);
        assert.equal(hasAdjacentRepeatedPart(result.text), false, `${point.code}/${point.name}/${index} adjacent repeated part: ${result.text}`);
        assert.match(
          result.text,
          /polar|antarctica|arctic|research|station|field|base|ice|runway|coastal|supply|shelter|track|logistics/i,
          `${point.code}/${point.name}/${index} should expose polar land logistics signal`
        );
      }
    }

    const elapsed = performance.now() - start;
    assert.ok(renderCount >= 200, `expected concentrated polar land render coverage, got ${renderCount}`);
    assert.ok(elapsed < 2500, `polar land address display stress should stay fast, elapsed=${elapsed.toFixed(1)}ms`);
  });
});

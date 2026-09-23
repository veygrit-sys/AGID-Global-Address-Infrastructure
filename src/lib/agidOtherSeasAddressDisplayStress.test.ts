import assert from "node:assert";
import { performance } from "node:perf_hooks";
import { describe, test } from "node:test";

import { assessAddressDisplayQuality, formatAddressDisplayText } from "./addressDisplay";
import { AddressRenderer, createCanonicalAddress, type CanonicalAddress } from "./addressRendering";
import { decodeAGID, encodeAGID, getRegionInfo } from "./agid";
import { isValidAGIDFormat } from "./agidSecurity";

type OtherSeaDisplayStressPoint = {
  readonly id: string;
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
};

const OTHER_SEA_DISPLAY_POINTS: readonly OtherSeaDisplayStressPoint[] = [
  { id: "MEDW", name: "Mediterranean Sea west", lat: 38, lon: 5 },
  { id: "MEDE", name: "Mediterranean Sea east", lat: 34, lon: 24 },
  { id: "IONN", name: "Ionian Sea", lat: 36, lon: 19 },
  { id: "ADRI", name: "Adriatic Sea", lat: 43, lon: 16 },
  { id: "AEGE", name: "Aegean Sea", lat: 38, lon: 25 },
  { id: "BLCK", name: "Black Sea", lat: 43, lon: 34 },
  { id: "CASP", name: "Caspian Sea", lat: 41, lon: 51 },
  { id: "BALT", name: "Baltic Sea", lat: 56, lon: 18 },
  { id: "MARM", name: "Sea of Marmara", lat: 40.7, lon: 28 },
  { id: "AZOV", name: "Sea of Azov", lat: 46.3, lon: 36.5 },
  { id: "REDM", name: "Red Sea", lat: 20, lon: 38 },
  { id: "GUIN", name: "Gulf of Guinea", lat: 2, lon: 2 },
  { id: "NTHS", name: "North Sea", lat: 56, lon: 3 },
  { id: "ENGC", name: "English Channel", lat: 50, lon: -2 },
  { id: "BISC", name: "Bay of Biscay", lat: 45, lon: -5 },
] as const;

function hasAdjacentRepeatedPart(text: string): boolean {
  const parts = text
    .split(/\r?\n|,/)
    .map((part) => part.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "").trim())
    .filter(Boolean);

  return parts.some((part, index) => index > 0 && part === parts[index - 1]);
}

function assertOtherSeaPoint(point: OtherSeaDisplayStressPoint) {
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
}

function otherSeaDisplayFixture(
  point: OtherSeaDisplayStressPoint,
  index: number
): Partial<CanonicalAddress> {
  const agid = encodeAGID(point.lat, point.lon);
  const fixtures: Array<Partial<CanonicalAddress>> = [
    {
      country: point.name,
      state: "Named Sea Reference Area",
      city: `Sea Grid ${agid.qx % 100}-${agid.qy % 100}`,
      district: "Marine Navigation Sector",
      subdistrict: "Open Water Corridor",
      road: "Marine Route",
      house_number: String((index % 9) + 1),
      building: "Sea Handoff Point",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Coastal Sea Logistics Region",
      city: "Port Approach Grid",
      district: point.name.includes("Gulf") ? "Gulf Approach Sector" : "Bay and Sea Sector",
      subdistrict: "Anchorage Zone",
      road: "Harbor Approach",
      house_number: String((index % 7) + 10),
      building: "Marine Checkpoint",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Regional Sea Safety Area",
      city: "Search and Rescue Grid",
      district: point.name.includes("Channel") ? "Channel Navigation Zone" : "Coastal Operations",
      subdistrict: "Rescue Sector",
      road: "Rescue Route",
      house_number: String((index % 5) + 20),
      building: "Field Post",
      poi: point.name,
    },
    {
      country: point.name,
      state: "Sea Border Interface",
      city: "Customs and Handoff Grid",
      district: "Wharf Interface",
      subdistrict: "Jetty Landing",
      road: "Coastal Landing",
      house_number: String((index % 6) + 30),
      building: "Marine Terminal",
      poi: point.name,
    },
  ];

  return {
    ...fixtures[index % fixtures.length],
    country_code: point.id,
  };
}

function renderOtherSeaDisplayQuality(
  point: OtherSeaDisplayStressPoint,
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

describe("Other seas AGID address display concentrated stress", () => {
  test("other named seas resolve to sea AGIDs before display quality is evaluated", () => {
    for (const point of OTHER_SEA_DISPLAY_POINTS) {
      assertOtherSeaPoint(point);
    }
  });

  test("other sea AGIDs render strong named-sea, coastal, and handoff displays", () => {
    const start = performance.now();
    let renderCount = 0;

    for (const point of OTHER_SEA_DISPLAY_POINTS) {
      const distinctDisplays = new Set<string>();

      for (let index = 0; index < 20; index += 1) {
        const fixture = otherSeaDisplayFixture(point, index);

        for (const language of ["en", "intl_en"] as const) {
          const result = renderOtherSeaDisplayQuality(point, language, fixture);
          distinctDisplays.add(result.text);
          renderCount += 1;

          assert.equal(result.quality.isWeak, false, `${point.id}/${language}/${index} weak display: ${result.text}`);
          assert.ok(result.quality.score >= 0.62, `${point.id}/${language}/${index} score ${result.quality.score}: ${result.text}`);
          assert.ok(result.quality.meaningfulParts.length >= 3, `${point.id}/${language}/${index} should preserve named-sea display context`);
          assert.equal(hasAdjacentRepeatedPart(result.text), false, `${point.id}/${language}/${index} adjacent repeated part: ${result.text}`);
          assert.match(
            result.text,
            /mediterranean|adriatic|aegean|ionian|black|caspian|baltic|marmara|azov|red|guinea|north sea|english channel|biscay|sea|gulf|bay|channel|marine|coastal|navigation|anchorage|harbor|harbour|wharf|jetty|landing|water/i,
            `${point.id}/${language}/${index} should expose named-sea routing signal`
          );
        }
      }

      assert.ok(distinctDisplays.size >= 4, `${point.id} should produce multiple named-sea display variants`);
    }

    const elapsed = performance.now() - start;
    assert.ok(renderCount >= 600, `expected concentrated other-sea render coverage, got ${renderCount}`);
    assert.ok(elapsed < 2800, `other-sea address display stress should stay fast, elapsed=${elapsed.toFixed(1)}ms`);
  });
});

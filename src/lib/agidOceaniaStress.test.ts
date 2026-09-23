import assert from "node:assert";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { performance } from "node:perf_hooks";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import { assessAddressDisplayQuality, formatAddressDisplayText } from "./addressDisplay";
import { AddressRenderer, createCanonicalAddress, type CanonicalAddress } from "./addressRendering";
import { decodeAGID, encodeAGID, getRegionInfo } from "./agid";
import { isValidAGIDFormat } from "./agidSecurity";

type OceaniaStressPoint = {
  readonly code: string;
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
};

const OCEANIA_AGID_STRESS_POINTS: readonly OceaniaStressPoint[] = [
  { code: "AU", name: "Canberra", lat: -35.2809, lon: 149.13 },
  { code: "AU", name: "Sydney", lat: -33.8688, lon: 151.2093 },
  { code: "NZ", name: "Wellington", lat: -41.2865, lon: 174.7762 },
  { code: "NZ", name: "Auckland", lat: -36.8485, lon: 174.7633 },
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
  { code: "UM", name: "Wake Island", lat: 19.2823, lon: 166.647 },
  { code: "CK", name: "Avarua", lat: -21.2129, lon: -159.7823 },
  { code: "PF", name: "Papeete", lat: -17.5516, lon: -149.5585 },
  { code: "CC", name: "West Island", lat: -12.1889, lon: 96.8293 },
  { code: "CX", name: "Flying Fish Cove", lat: -10.4217, lon: 105.6791 },
  { code: "NF", name: "Kingston Norfolk Island", lat: -29.0569, lon: 167.9592 },
  { code: "NU", name: "Alofi", lat: -19.0554, lon: -169.9179 },
  { code: "PN", name: "Adamstown", lat: -25.066, lon: -130.1015 },
  { code: "TK", name: "Fakaofo", lat: -9.365, lon: -171.218 },
  { code: "WF", name: "Mata-Utu", lat: -13.2816, lon: -176.1745 },
];

const COARSE_OVERLAP_REGRESSION_POINTS = [
  "Flying Fish Cove",
  "Kingston Norfolk Island",
  "Fakaofo",
  "Alofi",
  "Adamstown",
  "Mata-Utu",
  "Kiritimati",
  "Pago Pago",
  "Wake Island",
] as const;

const HERE = dirname(fileURLToPath(import.meta.url));
const ADDRESS_FORMAT_ROOTS = [
  join(HERE, "..", "data", "address_formats", "oceania"),
  join(HERE, "..", "data", "address_formats", "americas", "us_territories"),
] as const;

function haversineMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const radius = 6371008.8;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
}

function findAddressFormatPathInDir(countryCode: string, dir: string): string | null {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = findAddressFormatPathInDir(countryCode, fullPath);
      if (nested) return nested;
      continue;
    }
    if (entry.name === `${countryCode}.json`) return fullPath;
  }
  return null;
}

function findAddressFormatPath(countryCode: string): string | null {
  for (const dir of ADDRESS_FORMAT_ROOTS) {
    const found = findAddressFormatPathInDir(countryCode, dir);
    if (found) return found;
  }
  return null;
}

function loadAddressFormat(countryCode: string): Record<string, any> {
  const formatPath = findAddressFormatPath(countryCode);
  assert.ok(formatPath, `missing Oceania or Pacific territory address format: ${countryCode}`);
  assert.ok(existsSync(formatPath), `missing file on disk: ${formatPath}`);
  return JSON.parse(readFileSync(formatPath, "utf8")) as Record<string, any>;
}

function collectAddressFormatPaths(dir: string): string[] {
  const paths: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      paths.push(...collectAddressFormatPaths(fullPath));
    } else if (entry.name.endsWith(".json")) {
      paths.push(fullPath);
    }
  }
  return paths.sort();
}

function loadAllOceaniaAddressFormats(): Array<{ path: string; format: Record<string, any> }> {
  return ADDRESS_FORMAT_ROOTS.flatMap((root) =>
    collectAddressFormatPaths(root).map((path) => ({
      path,
      format: JSON.parse(readFileSync(path, "utf8")) as Record<string, any>,
    }))
  );
}

function renderQuality(countryCode: string, language: string, input: Partial<CanonicalAddress>) {
  const canonical = createCanonicalAddress({ country_code: countryCode, ...input });
  const rendered = AddressRenderer.render(language, canonical);
  const text = formatAddressDisplayText(rendered, { tab: language, countryCode });
  const quality = assessAddressDisplayQuality(rendered, {
    country: canonical.country,
    countryCode,
  });
  return { rendered, text, quality };
}

function hasAdjacentRepeatedPart(text: string): boolean {
  const parts = text
    .split(/\r?\n|,/)
    .map((part) => part.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "").trim())
    .filter(Boolean);

  return parts.some((part, index) => index > 0 && part === parts[index - 1]);
}

function oceaniaDisplayFixture(countryCode: string, country: string, index: number): Partial<CanonicalAddress> {
  const fixtures: Array<Partial<CanonicalAddress>> = [
    {
      country,
      state: "Capital Territory",
      city: "Central Harbor",
      district: "Civic Quarter",
      subdistrict: "Market Ward",
      road: "Main Street",
      house_number: "12",
      building: "Civic Handoff Terminal",
      postcode: "1000",
    },
    {
      country,
      state: "Outer Islands",
      city: "Lagoon Village",
      district: "Atoll District",
      subdistrict: "Reef Settlement",
      road: "Lagoon Causeway",
      house_number: "3",
      building: "Island Clinic",
      postcode: "2000",
    },
    {
      country,
      state: "Highland Province",
      city: "Mountain Town",
      district: "Rainforest Ward",
      subdistrict: "Valley Settlement",
      road: "Ridge Track",
      house_number: "8",
      building: "Field Post",
      postcode: "3000",
    },
    {
      country,
      state: "Coastal Province",
      city: "Port Village",
      district: "Wharf District",
      subdistrict: "Jetty Side",
      road: "Harbor Road",
      house_number: "21",
      building: "Marine Handoff Point",
      postcode: "4000",
    },
    {
      country,
      state: "Coral Islands",
      city: "South Islet",
      district: "Coral Reef District",
      subdistrict: "Landing Zone",
      road: "Reef Landing",
      house_number: "5",
      building: "Relief Shelter",
      postcode: "5000",
    },
  ];

  return {
    ...fixtures[index % fixtures.length],
    country_code: countryCode,
  };
}

describe("Oceania AGID concentrated stress", () => {
  test("representative Oceania points resolve to expected regions and round-trip cleanly", () => {
    const start = performance.now();

    for (const point of OCEANIA_AGID_STRESS_POINTS) {
      const region = getRegionInfo(point.lat, point.lon);
      assert.equal(region.prefix, point.code, `${point.name} should resolve to ${point.code}`);

      const agid = encodeAGID(point.lat, point.lon);
      assert.equal(agid.regionCode, point.code, `${point.name} AGID region code`);
      assert.equal(agid.prefix, point.code, `${point.name} AGID prefix`);
      assert.equal(agid.isSea, false, `${point.name} should not be classified as sea`);
      assert.ok(isValidAGIDFormat(agid.id), `${point.name} should emit a valid AGID`);
      assert.equal(agid.polygon.length, 5, `${point.name} cell polygon should be closed`);

      const decoded = decodeAGID(agid.id);
      assert.ok(decoded, `${point.name} AGID should decode`);
      assert.equal(decoded.face, agid.face, `${point.name} decoded face`);
      assert.equal(decoded.qx, agid.qx, `${point.name} decoded qx`);
      assert.equal(decoded.qy, agid.qy, `${point.name} decoded qy`);
      assert.equal(decoded.prefix, point.code, `${point.name} decoded prefix`);

      const centerError = haversineMeters(point, { lat: decoded.lat, lon: decoded.lon });
      assert.ok(centerError <= 8, `${point.name} center error ${centerError.toFixed(2)}m`);
    }

    const elapsed = performance.now() - start;
    assert.ok(elapsed < 1800, `Oceania AGID stress should stay fast, elapsed=${elapsed.toFixed(1)}ms`);
  });

  test("known Oceania coarse-overlap regressions stay corrected", () => {
    const byName = new Map(OCEANIA_AGID_STRESS_POINTS.map((point) => [point.name, point]));

    for (const name of COARSE_OVERLAP_REGRESSION_POINTS) {
      const point = byName.get(name);
      assert.ok(point, `missing regression fixture ${name}`);
      assert.equal(getRegionInfo(point.lat, point.lon).prefix, point.code, `${name} region`);
      assert.equal(encodeAGID(point.lat, point.lon).regionCode, point.code, `${name} AGID`);
    }
  });

  test("every stressed Oceania region has a usable address format definition", () => {
    for (const point of OCEANIA_AGID_STRESS_POINTS) {
      const format = loadAddressFormat(point.code);
      assert.equal(format.countryCode, point.code, `${point.code} countryCode`);
      assert.ok(Array.isArray(format.addressRules?.languages), `${point.code} languages`);
      assert.ok(format.addressRules.languages.length > 0, `${point.code} language list`);
      assert.ok(Array.isArray(format.addressRules?.nativeOrder), `${point.code} native order`);
      assert.ok(Array.isArray(format.addressRules?.englishOrder), `${point.code} english order`);

      const nativeOrderMin = format.addressRules.nativeOrder.includes("territory") ? 1 : 3;
      const englishOrderMin = format.addressRules.englishOrder.includes("territory") ? 1 : 3;
      assert.ok(format.addressRules.nativeOrder.length >= nativeOrderMin, `${point.code} native order fields`);
      assert.ok(format.addressRules.englishOrder.length >= englishOrderMin, `${point.code} english order fields`);

      const openSourceIds =
        format.openSourceIds ?? format.addressRules?.openSourceIds ?? format.dataSources?.openSourceIds;
      assert.ok(Array.isArray(openSourceIds), `${point.code} should declare open source ids`);
      assert.ok(openSourceIds.length > 0, `${point.code} should have at least one open source id`);
    }
  });

  test("language tabs produce distinct native and international displays for Oceania", () => {
    const cases = [
      {
        code: "NZ",
        nativeLanguage: "mi",
        nativeSignal: /Whare Taone|Tāmaki|Queen/,
        englishLanguage: "en",
        native: {
          country: "Aotearoa",
          state: "Auckland",
          city: "Tāmaki Makaurau",
          district: "Auckland Central",
          road: "Queen Street",
          house_number: "123",
          building: "Whare Taone",
          postcode: "1010",
        },
        english: {
          country: "New Zealand",
          state: "Auckland",
          city: "Auckland",
          district: "Auckland Central",
          road: "Queen Street",
          house_number: "123",
          building: "Town Hall",
          postcode: "1010",
        },
      },
      {
        code: "FJ",
        nativeLanguage: "fj",
        nativeSignal: /Valenivolavola|Suva|Victoria/,
        englishLanguage: "en",
        native: {
          country: "Viti",
          state: "Central Division",
          city: "Suva",
          district: "Suva Central",
          road: "Victoria Parade",
          house_number: "10",
          building: "Valenivolavola",
          postcode: "",
        },
        english: {
          country: "Fiji",
          state: "Central Division",
          city: "Suva",
          district: "Suva Central",
          road: "Victoria Parade",
          house_number: "10",
          building: "Government Building",
          postcode: "",
        },
      },
      {
        code: "PF",
        nativeLanguage: "fr",
        nativeSignal: /Mairie|Papeete|Rue/,
        englishLanguage: "en",
        native: {
          country: "Polynésie française",
          state: "Îles du Vent",
          city: "Papeete",
          district: "Centre-ville",
          road: "Rue du Général de Gaulle",
          house_number: "25",
          building: "Mairie",
          postcode: "98714",
        },
        english: {
          country: "French Polynesia",
          state: "Windward Islands",
          city: "Papeete",
          district: "Downtown",
          road: "General de Gaulle Street",
          house_number: "25",
          building: "Town Hall",
          postcode: "98714",
        },
      },
    ] as const;

    for (const fixture of cases) {
      const native = renderQuality(fixture.code, fixture.nativeLanguage, fixture.native);
      const english = renderQuality(fixture.code, fixture.englishLanguage, fixture.english);

      assert.notEqual(native.text, english.text, `${fixture.code} tab switch should change text`);
      assert.match(native.text, fixture.nativeSignal, `${fixture.code} native signal should render`);
      assert.ok(native.quality.score >= 0.55, `${fixture.code} native quality ${native.quality.score}`);
      assert.ok(english.quality.score >= 0.55, `${fixture.code} English quality ${english.quality.score}`);
      assert.equal(native.quality.isWeak, false, `${fixture.code} native should not be weak`);
      assert.equal(english.quality.isWeak, false, `${fixture.code} English should not be weak`);
    }
  });

  test("all Oceania and Pacific territory formats produce strong address displays under concentrated fixtures", () => {
    const formats = loadAllOceaniaAddressFormats();
    assert.equal(formats.length, 28, "Oceania plus Pacific US territory formats should be covered");

    const start = performance.now();
    let renderCount = 0;

    for (const { path, format } of formats) {
      const countryCode = String(format.countryCode ?? "").toUpperCase();
      assert.match(countryCode, /^[A-Z]{2}$/, `${path} should declare a two-letter country code`);

      const country = String(format.name ?? countryCode);
      const languages = Array.isArray(format.addressRules?.languages)
        ? format.addressRules.languages
            .map((language: { code?: unknown }) => String(language.code ?? "").trim())
            .filter(Boolean)
        : [];
      assert.ok(languages.length > 0, `${countryCode} should declare at least one language tab`);

      const representativeTabs = Array.from(new Set([...languages.slice(0, 2), "en", "intl_en"]));
      const distinctDisplays = new Set<string>();

      for (let index = 0; index < 20; index += 1) {
        const fixture = oceaniaDisplayFixture(countryCode, country, index);

        for (const language of representativeTabs) {
          const result = renderQuality(countryCode, language, fixture);
          distinctDisplays.add(result.text);
          renderCount += 1;

          assert.equal(result.quality.isWeak, false, `${countryCode}/${language}/${index} weak display: ${result.text}`);
          assert.ok(result.quality.score >= 0.65, `${countryCode}/${language}/${index} score ${result.quality.score}: ${result.text}`);
          assert.ok(result.quality.meaningfulParts.length >= 3, `${countryCode}/${language}/${index} should preserve address context`);
          assert.equal(hasAdjacentRepeatedPart(result.text), false, `${countryCode}/${language}/${index} adjacent repeated part: ${result.text}`);
          assert.match(
            result.text,
            /street|road|track|causeway|landing|harbor|harbour|lagoon|atoll|reef|island|clinic|terminal|shelter|post/i,
            `${countryCode}/${language}/${index} should expose Oceania delivery/geography signal`
          );
        }
      }

      assert.ok(distinctDisplays.size >= 3, `${countryCode} should produce multiple useful display variants`);
    }

    const elapsed = performance.now() - start;
    assert.ok(renderCount >= 1400, `expected concentrated render coverage, got ${renderCount}`);
    assert.ok(elapsed < 3500, `Oceania address display stress should stay fast, elapsed=${elapsed.toFixed(1)}ms`);
  });
});

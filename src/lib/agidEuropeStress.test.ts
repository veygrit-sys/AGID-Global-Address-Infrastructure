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

type EuropeStressPoint = {
  readonly code: string;
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
};

const EUROPE_AGID_STRESS_POINTS: readonly EuropeStressPoint[] = [
  { code: "GB", name: "London", lat: 51.5074, lon: -0.1278 },
  { code: "IE", name: "Dublin", lat: 53.3498, lon: -6.2603 },
  { code: "FR", name: "Paris", lat: 48.8566, lon: 2.3522 },
  { code: "DE", name: "Berlin", lat: 52.52, lon: 13.405 },
  { code: "NL", name: "Amsterdam", lat: 52.3676, lon: 4.9041 },
  { code: "BE", name: "Brussels", lat: 50.8503, lon: 4.3517 },
  { code: "BAAR", name: "Baarle Enclaves", lat: 51.4416, lon: 4.931 },
  { code: "LU", name: "Luxembourg", lat: 49.6116, lon: 6.1319 },
  { code: "CH", name: "Bern", lat: 46.948, lon: 7.4474 },
  { code: "LI", name: "Vaduz", lat: 47.141, lon: 9.5209 },
  { code: "AT", name: "Vienna", lat: 48.2082, lon: 16.3738 },
  { code: "CZ", name: "Prague", lat: 50.0755, lon: 14.4378 },
  { code: "PL", name: "Warsaw", lat: 52.2297, lon: 21.0122 },
  { code: "SK", name: "Bratislava", lat: 48.1486, lon: 17.1077 },
  { code: "HU", name: "Budapest", lat: 47.4979, lon: 19.0402 },
  { code: "SI", name: "Ljubljana", lat: 46.0569, lon: 14.5058 },
  { code: "ES", name: "Madrid", lat: 40.4168, lon: -3.7038 },
  { code: "EA", name: "Ceuta", lat: 35.8894, lon: -5.3213 },
  { code: "EA", name: "Melilla", lat: 35.2923, lon: -2.9381 },
  { code: "PT", name: "Lisbon", lat: 38.7223, lon: -9.1393 },
  { code: "AD", name: "Andorra la Vella", lat: 42.5063, lon: 1.5218 },
  { code: "MC", name: "Monaco", lat: 43.7384, lon: 7.4246 },
  { code: "SM", name: "San Marino", lat: 43.9424, lon: 12.4578 },
  { code: "VA", name: "Vatican City", lat: 41.9029, lon: 12.4534 },
  { code: "MT", name: "Valletta", lat: 35.8989, lon: 14.5146 },
  { code: "IT", name: "Rome", lat: 41.9028, lon: 12.4964 },
  { code: "GR", name: "Athens", lat: 37.9838, lon: 23.7275 },
  { code: "CY", name: "Limassol", lat: 34.7071, lon: 33.0226 },
  { code: "XU", name: "Akrotiri", lat: 34.59, lon: 32.98 },
  { code: "XD", name: "Dhekelia", lat: 35.03, lon: 33.78 },
  { code: "TRNC", name: "North Nicosia", lat: 35.25, lon: 33.35 },
  { code: "CYGL", name: "Cyprus Green Line", lat: 35.1, lon: 33.5 },
  { code: "DK", name: "Copenhagen", lat: 55.6761, lon: 12.5683 },
  { code: "NO", name: "Oslo", lat: 59.9139, lon: 10.7522 },
  { code: "SE", name: "Stockholm", lat: 59.3293, lon: 18.0686 },
  { code: "FI", name: "Helsinki", lat: 60.1699, lon: 24.9384 },
  { code: "IS", name: "Reykjavik", lat: 64.1466, lon: -21.9426 },
  { code: "AX", name: "Mariehamn", lat: 60.0973, lon: 19.9348 },
  { code: "FO", name: "Torshavn", lat: 62.0079, lon: -6.7909 },
  { code: "EE", name: "Tallinn", lat: 59.437, lon: 24.7536 },
  { code: "LV", name: "Riga", lat: 56.9496, lon: 24.1052 },
  { code: "LT", name: "Vilnius", lat: 54.6872, lon: 25.2797 },
  { code: "UA", name: "Kyiv", lat: 50.4501, lon: 30.5234 },
  { code: "BY", name: "Minsk", lat: 53.9006, lon: 27.559 },
  { code: "MD", name: "Chisinau", lat: 47.0105, lon: 28.8638 },
  { code: "PMR", name: "Tiraspol", lat: 46.8482, lon: 29.5968 },
  { code: "RO", name: "Bucharest", lat: 44.4268, lon: 26.1025 },
  { code: "BG", name: "Sofia", lat: 42.6977, lon: 23.3219 },
  { code: "RS", name: "Belgrade", lat: 44.7866, lon: 20.4489 },
  { code: "XK", name: "Pristina", lat: 42.6629, lon: 21.1655 },
  { code: "BA", name: "Sarajevo", lat: 43.8563, lon: 18.4131 },
  { code: "HR", name: "Zagreb", lat: 45.815, lon: 15.9819 },
  { code: "ME", name: "Podgorica", lat: 42.4304, lon: 19.2594 },
  { code: "AL", name: "Tirana", lat: 41.3275, lon: 19.8187 },
  { code: "MK", name: "Skopje", lat: 41.9981, lon: 21.4254 },
  { code: "RU", name: "Moscow", lat: 55.7558, lon: 37.6173 },
  { code: "CRIM", name: "Simferopol", lat: 44.9521, lon: 34.1024 },
  { code: "DONB", name: "Donetsk", lat: 48.0159, lon: 37.8029 },
  { code: "PHIS", name: "Pheasant Island", lat: 43.3422, lon: -1.7653 },
  { code: "GI", name: "Gibraltar", lat: 36.1408, lon: -5.3536 },
  { code: "GG", name: "Guernsey", lat: 49.4657, lon: -2.5853 },
  { code: "JE", name: "Jersey", lat: 49.2144, lon: -2.1313 },
  { code: "IM", name: "Douglas", lat: 54.1523, lon: -4.4861 },
  { code: "SJ_SVA", name: "Longyearbyen", lat: 78.2232, lon: 15.6469 },
  { code: "SJ_JAN", name: "Jan Mayen", lat: 70.982, lon: -8.533 },
  { code: "ES_CAN", name: "Tenerife", lat: 28.2916, lon: -16.6291 },
  { code: "ES_BAL", name: "Mallorca", lat: 39.5696, lon: 2.6502 },
  { code: "PT_MAD", name: "Madeira", lat: 32.7607, lon: -16.9595 },
  { code: "PT_AZO", name: "Azores", lat: 37.7412, lon: -25.6756 },
];

const COARSE_OVERLAP_REGRESSION_POINTS = [
  "Vienna",
  "Baarle Enclaves",
  "Bratislava",
  "Ljubljana",
  "Zagreb",
  "Reykjavik",
  "Tallinn",
  "Riga",
  "Vilnius",
  "Skopje",
  "Moscow",
  "Ceuta",
  "Melilla",
  "Akrotiri",
  "Dhekelia",
  "Pheasant Island",
  "Tenerife",
  "Madeira",
  "Azores",
] as const;

const HERE = dirname(fileURLToPath(import.meta.url));
const EUROPE_ADDRESS_FORMAT_DIR = join(HERE, "..", "data", "address_formats", "europe");
const ADDRESS_FORMAT_PARENT_CODES: Record<string, string> = {
  ES_BAL: "ES",
  ES_CAN: "ES",
  PT_AZO: "PT",
  PT_MAD: "PT",
  SJ_SVA: "SJ",
  SJ_JAN: "SJ",
};

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

function findAddressFormatPath(countryCode: string, dir = EUROPE_ADDRESS_FORMAT_DIR): string | null {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = findAddressFormatPath(countryCode, fullPath);
      if (nested) return nested;
      continue;
    }
    if (entry.name === `${countryCode}.json`) return fullPath;
  }
  return null;
}

function collectAddressFormatPaths(dir = EUROPE_ADDRESS_FORMAT_DIR): string[] {
  const paths: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      paths.push(...collectAddressFormatPaths(fullPath));
      continue;
    }
    if (entry.name.endsWith(".json")) {
      paths.push(fullPath);
    }
  }
  return paths.sort();
}

function loadAddressFormat(countryCode: string): Record<string, any> {
  const formatPath = findAddressFormatPath(countryCode);
  assert.ok(formatPath, `missing europe address format: ${countryCode}`);
  assert.ok(existsSync(formatPath), `missing file on disk: ${formatPath}`);
  return JSON.parse(readFileSync(formatPath, "utf8")) as Record<string, any>;
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

function hasAdjacentRepeatedLineOrToken(display: string) {
  const parts = display
    .split(/\r?\n|,\s*/)
    .map(part => part.trim().toLowerCase())
    .filter(Boolean);
  return parts.some((part, index) => index > 0 && part === parts[index - 1]);
}

function europeStressAddressDetails(countryCode: string, countryName: string, index: number) {
  const caseIndex = index % 5;
  const common = {
    country_code: countryCode,
    country: countryName,
    lat: 40 + index / 10,
    lon: 10 + index / 10,
  };

  if (caseIndex === 0) {
    return {
      ...common,
      state: `${countryName} Metropolitan Region`,
      city: `Central City ${index + 1}`,
      district: `Old Town District ${(index % 9) + 1}`,
      subdistrict: `Market Quarter ${(index % 5) + 1}`,
      road: `Market Street ${index + 1}`,
      house_number: String(10 + index),
      building: `Civic Hall ${index + 1}`,
      postcode: String(10000 + index),
    };
  }

  if (caseIndex === 1) {
    return {
      ...common,
      state: `${countryName} Province`,
      city: `Market Town ${index + 1}`,
      district: `Rural Parish ${(index % 8) + 1}`,
      subdistrict: `Hill Village ${(index % 11) + 1}`,
      road: `County Road ${index + 1}`,
      house_number: String(20 + index),
      postcode: String(20000 + index),
    };
  }

  if (caseIndex === 2) {
    return {
      ...common,
      state: `${countryName} Island Region`,
      city: `Harbor City ${index + 1}`,
      district: `Outer Island ${(index % 6) + 1}`,
      subdistrict: `Ferry Quarter ${(index % 5) + 1}`,
      road: `Coastal Road ${index + 1}`,
      house_number: String(30 + index),
      building: `Ferry Terminal ${index + 1}`,
      postcode: String(30000 + index),
      island: `Reference Island ${index + 1}`,
      map_feature_kind: "island",
    };
  }

  if (caseIndex === 3) {
    return {
      ...common,
      state: `${countryName} Highland Region`,
      city: `Valley Town ${index + 1}`,
      district: `Mountain Pass ${(index % 7) + 1}`,
      subdistrict: `Glacier Valley ${(index % 5) + 1}`,
      road: `Pass Road ${index + 1}`,
      house_number: String(40 + index),
      building: `Ranger Station ${index + 1}`,
      postcode: String(40000 + index),
      mountain: `Reference Peak ${index + 1}`,
      glacier: `Reference Glacier ${index + 1}`,
      map_feature_kind: "mountain",
    };
  }

  return {
    ...common,
    state: `${countryName} Border Region`,
    city: `Castle City ${index + 1}`,
    district: `Heritage District ${(index % 6) + 1}`,
    subdistrict: `Riverside Quarter ${(index % 5) + 1}`,
    road: `Canal Route ${index + 1}`,
    house_number: String(50 + index),
    building: `Customs Hall ${index + 1}`,
    postcode: String(50000 + index),
    river: `Reference River ${index + 1}`,
    heritage_site: `Reference Heritage Site ${index + 1}`,
    map_feature_kind: "river",
  };
}

function representativeTabs(format: Record<string, any>) {
  const languageCodes = (format.addressRules?.languages || [])
    .map((language: { code?: string }) => language.code)
    .filter(Boolean);
  return Array.from(new Set([
    languageCodes[0],
    ...languageCodes.slice(1, 3),
    "en",
    "intl_en",
  ].filter(Boolean))) as string[];
}

describe("Europe AGID concentrated stress", () => {
  test("representative Europe points resolve to expected regions and round-trip cleanly", () => {
    const start = performance.now();

    for (const point of EUROPE_AGID_STRESS_POINTS) {
      const region = getRegionInfo(point.lat, point.lon);
      assert.equal(region.prefix, point.code, `${point.name} should resolve to ${point.code}`);

      const agid = encodeAGID(point.lat, point.lon);
      const expectedPrefix = point.code.length === 2 ? point.code : agid.prefix;
      assert.equal(agid.regionCode, point.code, `${point.name} AGID region code`);
      assert.equal(agid.prefix, expectedPrefix, `${point.name} AGID prefix`);
      assert.equal(agid.isSea, false, `${point.name} should not be classified as sea`);
      assert.ok(isValidAGIDFormat(agid.id), `${point.name} should emit a valid AGID`);
      assert.equal(agid.polygon.length, 5, `${point.name} cell polygon should be closed`);

      const decoded = decodeAGID(agid.id);
      assert.ok(decoded, `${point.name} AGID should decode`);
      assert.equal(decoded.face, agid.face, `${point.name} decoded face`);
      assert.equal(decoded.qx, agid.qx, `${point.name} decoded qx`);
      assert.equal(decoded.qy, agid.qy, `${point.name} decoded qy`);
      assert.equal(decoded.prefix, expectedPrefix, `${point.name} decoded prefix`);

      const centerError = haversineMeters(point, { lat: decoded.lat, lon: decoded.lon });
      assert.ok(centerError <= 8, `${point.name} center error ${centerError.toFixed(2)}m`);
    }

    const elapsed = performance.now() - start;
    assert.ok(elapsed < 1800, `Europe AGID stress should stay fast, elapsed=${elapsed.toFixed(1)}ms`);
  });

  test("known Europe coarse-overlap regressions stay corrected", () => {
    const byName = new Map(EUROPE_AGID_STRESS_POINTS.map((point) => [point.name, point]));

    for (const name of COARSE_OVERLAP_REGRESSION_POINTS) {
      const point = byName.get(name);
      assert.ok(point, `missing regression fixture ${name}`);
      assert.equal(getRegionInfo(point.lat, point.lon).prefix, point.code, `${name} region`);
      assert.equal(encodeAGID(point.lat, point.lon).regionCode, point.code, `${name} AGID`);
    }
  });

  test("every stressed Europe region has a usable address format definition", () => {
    for (const point of EUROPE_AGID_STRESS_POINTS) {
      const format = loadAddressFormat(point.code);
      assert.equal(format.countryCode, ADDRESS_FORMAT_PARENT_CODES[point.code] ?? point.code, `${point.code} countryCode`);
      assert.ok(Array.isArray(format.addressRules?.languages), `${point.code} languages`);
      assert.ok(format.addressRules.languages.length > 0, `${point.code} language list`);
      assert.ok(Array.isArray(format.addressRules?.nativeOrder), `${point.code} native order`);
      assert.ok(Array.isArray(format.addressRules?.englishOrder), `${point.code} english order`);
      assert.ok(format.addressRules.nativeOrder.length >= 3, `${point.code} native order fields`);
      assert.ok(format.addressRules.englishOrder.length >= 3, `${point.code} english order fields`);
      const openSourceIds =
        format.openSourceIds ?? format.addressRules?.openSourceIds ?? format.dataSources?.openSourceIds;
      assert.ok(Array.isArray(openSourceIds), `${point.code} should declare open source ids`);
      assert.ok(openSourceIds.length > 0, `${point.code} should have at least one open source id`);
    }
  });

  test("language tabs produce distinct native and international displays for European scripts", () => {
    const cases = [
      {
        code: "FR",
        nativeLanguage: "fr",
        nativeScript: /Paris|Rue|France/,
        englishLanguage: "en",
        native: {
          country: "France",
          state: "Ile-de-France",
          city: "Paris",
          district: "7e arrondissement",
          road: "Rue de l'Universite",
          house_number: "5",
          building: "Musee d'Orsay",
          postcode: "75007",
        },
        english: {
          country: "France",
          state: "Ile-de-France",
          city: "Paris",
          district: "7th arrondissement",
          road: "University Street",
          house_number: "5",
          building: "Orsay Museum",
          postcode: "75007",
        },
      },
      {
        code: "DE",
        nativeLanguage: "de",
        nativeScript: /Berlin|Unter den Linden|Deutschland/,
        englishLanguage: "en",
        native: {
          country: "Deutschland",
          state: "Berlin",
          city: "Berlin",
          district: "Mitte",
          road: "Unter den Linden",
          house_number: "77",
          building: "Humboldt-Universitat",
          postcode: "10117",
        },
        english: {
          country: "Germany",
          state: "Berlin",
          city: "Berlin",
          district: "Mitte",
          road: "Unter den Linden",
          house_number: "77",
          building: "Humboldt University",
          postcode: "10117",
        },
      },
      {
        code: "GR",
        nativeLanguage: "el",
        nativeScript: /[\u0370-\u03ff]/,
        englishLanguage: "en",
        native: {
          country: "Ελλάδα",
          state: "Αττική",
          city: "Αθήνα",
          district: "Σύνταγμα",
          road: "Λεωφόρος Βασιλίσσης Αμαλίας",
          house_number: "1",
          building: "Βουλή των Ελλήνων",
          postcode: "10557",
        },
        english: {
          country: "Greece",
          state: "Attica",
          city: "Athens",
          district: "Syntagma",
          road: "Vasilissis Amalias Avenue",
          house_number: "1",
          building: "Hellenic Parliament",
          postcode: "10557",
        },
      },
      {
        code: "RU",
        nativeLanguage: "ru",
        nativeScript: /[\u0400-\u04ff]/,
        englishLanguage: "en",
        native: {
          country: "Россия",
          state: "Москва",
          city: "Москва",
          district: "Тверской район",
          road: "Тверская улица",
          house_number: "13",
          building: "Мэрия Москвы",
          postcode: "125032",
        },
        english: {
          country: "Russia",
          state: "Moscow",
          city: "Moscow",
          district: "Tverskoy District",
          road: "Tverskaya Street",
          house_number: "13",
          building: "Moscow City Hall",
          postcode: "125032",
        },
      },
    ] as const;

    for (const fixture of cases) {
      const native = renderQuality(fixture.code, fixture.nativeLanguage, fixture.native);
      const english = renderQuality(fixture.code, fixture.englishLanguage, fixture.english);

      assert.notEqual(native.text, english.text, `${fixture.code} tab switch should change text`);
      assert.match(native.text, fixture.nativeScript, `${fixture.code} native script should render`);
      assert.ok(native.quality.score >= 0.55, `${fixture.code} native quality ${native.quality.score}`);
      assert.ok(english.quality.score >= 0.55, `${fixture.code} English quality ${english.quality.score}`);
      assert.equal(native.quality.isWeak, false, `${fixture.code} native should not be weak`);
      assert.equal(english.quality.isWeak, false, `${fixture.code} English should not be weak`);
    }
  });

  test("all Europe address formats keep 20 mixed display cases useful across representative tabs", () => {
    const start = performance.now();
    const formatPaths = collectAddressFormatPaths();
    let renderCount = 0;

    assert.equal(formatPaths.length, 70, "Europe address format coverage count");

    for (const formatPath of formatPaths) {
      const format = JSON.parse(readFileSync(formatPath, "utf8")) as Record<string, any>;
      const countryCode = String(format.countryCode || "");
      assert.ok(countryCode, `${formatPath} countryCode`);

      for (let index = 0; index < 20; index += 1) {
        const canonical = createCanonicalAddress(
          europeStressAddressDetails(countryCode, String(format.name || countryCode), index)
        );

        for (const tab of representativeTabs(format)) {
          const rendered = AddressRenderer.render(tab, canonical);
          const display = formatAddressDisplayText(rendered, { tab, countryCode });
          const quality = assessAddressDisplayQuality(display, {
            country: canonical.country,
            countryCode,
          });
          renderCount += 1;

          assert.equal(
            quality.isWeak,
            false,
            `${countryCode} case ${index}/${tab} should not be weak: ${display}`,
          );
          assert.ok(
            quality.score >= 0.55,
            `${countryCode} case ${index}/${tab} should score >= 0.55, got ${quality.score}: ${display}`,
          );
          assert.equal(
            hasAdjacentRepeatedLineOrToken(display),
            false,
            `${countryCode} case ${index}/${tab} should not repeat adjacent address tokens: ${display}`,
          );
        }
      }
    }

    assert.ok(renderCount >= 70 * 20 * 2, `expected broad Europe display coverage, rendered=${renderCount}`);
    assert.ok(performance.now() - start < 5000, "Europe address display quality stress should stay below 5s");
  });
});

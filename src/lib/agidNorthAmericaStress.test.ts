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

type NorthAmericaStressPoint = {
  readonly code: string;
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
};

const NORTH_AMERICA_AGID_STRESS_POINTS: readonly NorthAmericaStressPoint[] = [
  { code: "US", name: "Washington DC", lat: 38.9072, lon: -77.0369 },
  { code: "US", name: "Anchorage", lat: 61.2181, lon: -149.9003 },
  { code: "US", name: "Honolulu", lat: 21.3069, lon: -157.8583 },
  { code: "CA", name: "Ottawa", lat: 45.4215, lon: -75.6972 },
  { code: "MX", name: "Mexico City", lat: 19.4326, lon: -99.1332 },
  { code: "GL", name: "Nuuk", lat: 64.1814, lon: -51.6941 },
  { code: "PM", name: "Saint-Pierre", lat: 46.7811, lon: -56.1764 },
  { code: "BM", name: "Hamilton", lat: 32.2948, lon: -64.7814 },
  { code: "AS", name: "Pago Pago", lat: -14.2756, lon: -170.702 },
  { code: "GU", name: "Hagatna", lat: 13.4763, lon: 144.7502 },
  { code: "MP", name: "Saipan", lat: 15.1778, lon: 145.7509 },
  { code: "UM", name: "Wake Island", lat: 19.2823, lon: 166.647 },

  { code: "GT", name: "Guatemala City", lat: 14.6349, lon: -90.5069 },
  { code: "BZ", name: "Belmopan", lat: 17.251, lon: -88.759 },
  { code: "SV", name: "San Salvador", lat: 13.6929, lon: -89.2182 },
  { code: "HN", name: "Tegucigalpa", lat: 14.0723, lon: -87.1921 },
  { code: "NI", name: "Managua", lat: 12.114, lon: -86.2362 },
  { code: "CR", name: "San Jose", lat: 9.9281, lon: -84.0907 },
  { code: "PA", name: "Panama City", lat: 8.9824, lon: -79.5199 },

  { code: "CU", name: "Havana", lat: 23.1136, lon: -82.3666 },
  { code: "HT", name: "Port-au-Prince", lat: 18.5944, lon: -72.3074 },
  { code: "DO", name: "Santo Domingo", lat: 18.4861, lon: -69.9312 },
  { code: "PR", name: "San Juan", lat: 18.4655, lon: -66.1057 },
  { code: "JM", name: "Kingston", lat: 17.9712, lon: -76.7936 },
  { code: "BS", name: "Nassau", lat: 25.0443, lon: -77.3504 },
  { code: "TT", name: "Port of Spain", lat: 10.6603, lon: -61.5086 },
  { code: "VI", name: "Charlotte Amalie", lat: 18.3419, lon: -64.9307 },
  { code: "VG", name: "Road Town", lat: 18.4285, lon: -64.6185 },
  { code: "KY", name: "George Town", lat: 19.2869, lon: -81.3674 },
  { code: "TC", name: "Cockburn Town", lat: 21.4675, lon: -71.1389 },
  { code: "GP", name: "Basse-Terre", lat: 15.9956, lon: -61.725 },
  { code: "MQ", name: "Fort-de-France", lat: 14.6161, lon: -61.0588 },
  { code: "BB", name: "Bridgetown", lat: 13.0975, lon: -59.6167 },
  { code: "LC", name: "Castries", lat: 14.0101, lon: -60.9875 },
  { code: "VC", name: "Kingstown", lat: 13.16, lon: -61.2248 },
  { code: "GD", name: "St. George's", lat: 12.0561, lon: -61.7488 },
  { code: "DM", name: "Roseau", lat: 15.3092, lon: -61.3794 },
  { code: "KN", name: "Basseterre", lat: 17.3026, lon: -62.7177 },
  { code: "AG", name: "St. John's", lat: 17.1274, lon: -61.8468 },
  { code: "AW", name: "Oranjestad", lat: 12.5211, lon: -69.9683 },
  { code: "CW", name: "Willemstad", lat: 12.1224, lon: -68.8824 },
  { code: "SX", name: "Philipsburg", lat: 18.026, lon: -63.0458 },
  { code: "MF", name: "Marigot", lat: 18.0731, lon: -63.0822 },
  { code: "BL", name: "Gustavia", lat: 17.8964, lon: -62.8522 },
  { code: "AI", name: "The Valley", lat: 18.2208, lon: -63.0517 },
  { code: "MS", name: "Plymouth", lat: 16.7065, lon: -62.2157 },
  { code: "BQ", name: "Kralendijk", lat: 12.1444, lon: -68.2653 },
];

const COARSE_OVERLAP_REGRESSION_POINTS = [
  "Tegucigalpa",
  "Hamilton",
  "Saint-Pierre",
  "Nuuk",
  "Pago Pago",
  "Hagatna",
  "Saipan",
  "Wake Island",
  "Philipsburg",
  "Marigot",
  "Kralendijk",
] as const;

const HERE = dirname(fileURLToPath(import.meta.url));
const AMERICAS_ADDRESS_FORMAT_DIR = join(HERE, "..", "data", "address_formats", "americas");

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

function findAddressFormatPath(countryCode: string, dir = AMERICAS_ADDRESS_FORMAT_DIR): string | null {
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

function loadAddressFormat(countryCode: string): Record<string, any> {
  const formatPath = findAddressFormatPath(countryCode);
  assert.ok(formatPath, `missing americas address format: ${countryCode}`);
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

describe("North America AGID concentrated stress", () => {
  test("representative North America points resolve to expected regions and round-trip cleanly", () => {
    const start = performance.now();

    for (const point of NORTH_AMERICA_AGID_STRESS_POINTS) {
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
    assert.ok(elapsed < 2200, `North America AGID stress should stay fast, elapsed=${elapsed.toFixed(1)}ms`);
  });

  test("known North America coarse-overlap regressions stay corrected", () => {
    const byName = new Map(NORTH_AMERICA_AGID_STRESS_POINTS.map((point) => [point.name, point]));

    for (const name of COARSE_OVERLAP_REGRESSION_POINTS) {
      const point = byName.get(name);
      assert.ok(point, `missing regression fixture ${name}`);
      assert.equal(getRegionInfo(point.lat, point.lon).prefix, point.code, `${name} region`);
      assert.equal(encodeAGID(point.lat, point.lon).regionCode, point.code, `${name} AGID`);
    }
  });

  test("every stressed North America region has a usable address format definition", () => {
    for (const point of NORTH_AMERICA_AGID_STRESS_POINTS) {
      const format = loadAddressFormat(point.code);
      assert.equal(format.countryCode, point.code, `${point.code} countryCode`);
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

  test("language tabs produce distinct native and international displays for North America", () => {
    const cases = [
      {
        code: "MX",
        nativeLanguage: "es",
        nativeSignal: /Ciudad de México|Avenida|México/,
        englishLanguage: "en",
        native: {
          country: "México",
          state: "Ciudad de México",
          city: "Ciudad de México",
          district: "Cuauhtémoc",
          road: "Avenida Paseo de la Reforma",
          house_number: "222",
          building: "Torre Mayor",
          postcode: "06600",
        },
        english: {
          country: "Mexico",
          state: "Mexico City",
          city: "Mexico City",
          district: "Cuauhtemoc",
          road: "Reforma Avenue",
          house_number: "222",
          building: "Torre Mayor",
          postcode: "06600",
        },
      },
      {
        code: "PM",
        nativeLanguage: "fr",
        nativeSignal: /Saint-Pierre|Rue|Miquelon/,
        englishLanguage: "en",
        native: {
          country: "Saint-Pierre-et-Miquelon",
          state: "Saint-Pierre",
          city: "Saint-Pierre",
          district: "Centre-ville",
          road: "Rue Albert Briand",
          house_number: "6",
          building: "Hotel de Ville",
          postcode: "97500",
        },
        english: {
          country: "Saint Pierre and Miquelon",
          state: "Saint Pierre",
          city: "Saint-Pierre",
          district: "Downtown",
          road: "Albert Briand Street",
          house_number: "6",
          building: "Town Hall",
          postcode: "97500",
        },
      },
      {
        code: "GL",
        nativeLanguage: "kl",
        nativeSignal: /Kalaallit Nunaat|Nuuk|Aqqusinersuaq/,
        englishLanguage: "en",
        native: {
          country: "Kalaallit Nunaat",
          state: "Sermersooq",
          city: "Nuuk",
          district: "Nuuk Centrum",
          road: "Aqqusinersuaq",
          house_number: "1",
          building: "Kommunip allaffia",
          postcode: "3900",
        },
        english: {
          country: "Greenland",
          state: "Sermersooq",
          city: "Nuuk",
          district: "Nuuk Center",
          road: "Main Street",
          house_number: "1",
          building: "Municipal Office",
          postcode: "3900",
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
});

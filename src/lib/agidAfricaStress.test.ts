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

type AfricaStressPoint = {
  readonly code: string;
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
};

const AFRICA_AGID_STRESS_POINTS: readonly AfricaStressPoint[] = [
  { code: "EG", name: "Cairo", lat: 30.0444, lon: 31.2357 },
  { code: "MA", name: "Rabat", lat: 34.0209, lon: -6.8416 },
  { code: "DZ", name: "Algiers", lat: 36.7538, lon: 3.0588 },
  { code: "TN", name: "Tunis", lat: 36.8065, lon: 10.1815 },
  { code: "LY", name: "Tripoli", lat: 32.8872, lon: 13.1913 },
  { code: "MR", name: "Nouakchott", lat: 18.0735, lon: -15.9582 },
  { code: "SD", name: "Khartoum", lat: 15.5007, lon: 32.5599 },
  { code: "EH", name: "Laayoune", lat: 27.1536, lon: -13.2033 },
  { code: "BT_T", name: "Bir Tawil", lat: 21.9, lon: 33.8 },

  { code: "NG", name: "Abuja", lat: 9.0765, lon: 7.3986 },
  { code: "GH", name: "Accra", lat: 5.6037, lon: -0.187 },
  { code: "CI", name: "Abidjan", lat: 5.36, lon: -4.0083 },
  { code: "SN", name: "Dakar", lat: 14.7167, lon: -17.4677 },
  { code: "ML", name: "Bamako", lat: 12.6392, lon: -8.0029 },
  { code: "NE", name: "Niamey", lat: 13.5116, lon: 2.1254 },
  { code: "BF", name: "Ouagadougou", lat: 12.3714, lon: -1.5197 },
  { code: "GM", name: "Banjul", lat: 13.4549, lon: -16.579 },
  { code: "SL", name: "Freetown", lat: 8.4657, lon: -13.2317 },
  { code: "GN", name: "Conakry", lat: 9.6412, lon: -13.5784 },
  { code: "GW", name: "Bissau", lat: 11.8817, lon: -15.617 },
  { code: "LR", name: "Monrovia", lat: 6.3156, lon: -10.8074 },
  { code: "BJ", name: "Porto-Novo", lat: 6.4969, lon: 2.6289 },
  { code: "TG", name: "Lome", lat: 6.1725, lon: 1.2314 },
  { code: "CV", name: "Praia", lat: 14.933, lon: -23.5133 },

  { code: "ET", name: "Addis Ababa", lat: 9.03, lon: 38.74 },
  { code: "KE", name: "Nairobi", lat: -1.2921, lon: 36.8219 },
  { code: "TZ", name: "Dodoma", lat: -6.163, lon: 35.7516 },
  { code: "UG", name: "Kampala", lat: 0.3476, lon: 32.5825 },
  { code: "SO", name: "Mogadishu", lat: 2.0469, lon: 45.3182 },
  { code: "SLND", name: "Hargeisa", lat: 9.5624, lon: 44.077 },
  { code: "RW", name: "Kigali", lat: -1.9441, lon: 30.0619 },
  { code: "BI", name: "Bujumbura", lat: -3.3614, lon: 29.3599 },
  { code: "DJ", name: "Djibouti City", lat: 11.5721, lon: 43.1456 },
  { code: "ER", name: "Asmara", lat: 15.3229, lon: 38.9251 },
  { code: "EEBD", name: "Badme Area", lat: 14.65, lon: 37.85 },
  { code: "SS", name: "Juba", lat: 4.8594, lon: 31.5713 },
  { code: "KM", name: "Moroni", lat: -11.7172, lon: 43.2473 },
  { code: "MG", name: "Antananarivo", lat: -18.8792, lon: 47.5079 },
  { code: "MU", name: "Port Louis", lat: -20.1609, lon: 57.5012 },
  { code: "SC", name: "Victoria", lat: -4.6191, lon: 55.4513 },
  { code: "RE", name: "Saint-Denis", lat: -20.8823, lon: 55.4504 },
  { code: "YT", name: "Mamoudzou", lat: -12.7806, lon: 45.2279 },
  { code: "IO", name: "Diego Garcia", lat: -7.3195, lon: 72.4229 },

  { code: "ZA", name: "Pretoria", lat: -25.7479, lon: 28.2293 },
  { code: "ZW", name: "Harare", lat: -17.8252, lon: 31.0335 },
  { code: "ZM", name: "Lusaka", lat: -15.3875, lon: 28.3228 },
  { code: "BW", name: "Gaborone", lat: -24.6282, lon: 25.9231 },
  { code: "NA", name: "Windhoek", lat: -22.5609, lon: 17.0658 },
  { code: "MZ", name: "Maputo", lat: -25.9692, lon: 32.5732 },
  { code: "LS", name: "Maseru", lat: -29.3158, lon: 27.4869 },
  { code: "SZ", name: "Mbabane", lat: -26.3054, lon: 31.1367 },
  { code: "MW", name: "Lilongwe", lat: -13.9626, lon: 33.7741 },
  { code: "SH", name: "Jamestown", lat: -15.9245, lon: -5.7181 },
  { code: "AC", name: "Georgetown", lat: -7.9286, lon: -14.4119 },
  { code: "TA", name: "Edinburgh of the Seven Seas", lat: -37.0676, lon: -12.3116 },

  { code: "CD", name: "Kinshasa", lat: -4.4419, lon: 15.2663 },
  { code: "AO", name: "Luanda", lat: -8.839, lon: 13.2894 },
  { code: "CM", name: "Yaounde", lat: 3.848, lon: 11.5021 },
  { code: "TD", name: "N'Djamena", lat: 12.1348, lon: 15.0557 },
  { code: "CF", name: "Bangui", lat: 4.3947, lon: 18.5582 },
  { code: "CG", name: "Brazzaville", lat: -4.2634, lon: 15.2429 },
  { code: "GA", name: "Libreville", lat: 0.4162, lon: 9.4673 },
  { code: "GQ", name: "Malabo", lat: 3.7504, lon: 8.7371 },
  { code: "ST", name: "Sao Tome", lat: 0.3365, lon: 6.7273 },
];

const COARSE_OVERLAP_REGRESSION_POINTS = [
  "Algiers",
  "Bamako",
  "Niamey",
  "Pretoria",
  "Lilongwe",
  "Kinshasa",
  "Brazzaville",
  "N'Djamena",
  "Khartoum",
  "Juba",
  "Praia",
  "Moroni",
  "Saint-Denis",
  "Mamoudzou",
  "Diego Garcia",
  "Sao Tome",
] as const;

const HERE = dirname(fileURLToPath(import.meta.url));
const AFRICA_ADDRESS_FORMAT_DIR = join(HERE, "..", "data", "address_formats", "africa");

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

function findAddressFormatPath(countryCode: string, dir = AFRICA_ADDRESS_FORMAT_DIR): string | null {
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

function collectAddressFormatPaths(dir = AFRICA_ADDRESS_FORMAT_DIR): string[] {
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
  assert.ok(formatPath, `missing africa address format: ${countryCode}`);
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

function africaStressAddressDetails(countryCode: string, countryName: string, index: number) {
  const caseIndex = index % 5;
  const common = {
    country_code: countryCode,
    country: countryName,
    lat: 5 + index / 10,
    lon: 20 + index / 10,
  };

  if (caseIndex === 0) {
    return {
      ...common,
      state: `${countryName} Capital Region`,
      city: `Capital City ${index + 1}`,
      district: `Central District ${(index % 9) + 1}`,
      subdistrict: `Market Quarter ${(index % 5) + 1}`,
      road: `Independence Avenue ${index + 1}`,
      house_number: String(10 + index),
      building: `Civic Centre ${index + 1}`,
      postcode: String(10000 + index),
    };
  }

  if (caseIndex === 1) {
    return {
      ...common,
      state: `${countryName} Province`,
      city: `Market Town ${index + 1}`,
      district: `Rural District ${(index % 8) + 1}`,
      subdistrict: `Village ${(index % 11) + 1}`,
      road: `Feeder Road ${index + 1}`,
      house_number: String(20 + index),
      building: `Health Post ${index + 1}`,
      postcode: String(20000 + index),
    };
  }

  if (caseIndex === 2) {
    return {
      ...common,
      state: `${countryName} Island Region`,
      city: `Harbor City ${index + 1}`,
      district: `Outer Island ${(index % 6) + 1}`,
      subdistrict: `Port Quarter ${(index % 5) + 1}`,
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
      state: `${countryName} Dryland Region`,
      city: `Oasis Town ${index + 1}`,
      district: `Desert District ${(index % 7) + 1}`,
      subdistrict: `Well Camp ${(index % 5) + 1}`,
      road: `Desert Track ${index + 1}`,
      house_number: String(40 + index),
      building: `Field Post ${index + 1}`,
      postcode: String(40000 + index),
      desert: `Reference Desert ${index + 1}`,
      dryland: `Reference Dryland ${index + 1}`,
      map_feature_kind: "desert",
    };
  }

  return {
    ...common,
    state: `${countryName} Highland Region`,
    city: `Reserve Town ${index + 1}`,
    district: `Savanna District ${(index % 6) + 1}`,
    subdistrict: `River Camp ${(index % 5) + 1}`,
    road: `Reserve Route ${index + 1}`,
    house_number: String(50 + index),
    building: `Ranger Station ${index + 1}`,
    postcode: String(50000 + index),
    grassland: `Reference Savanna ${index + 1}`,
    river: `Reference River ${index + 1}`,
    mountain: `Reference Peak ${index + 1}`,
    map_feature_kind: "grassland",
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

describe("Africa AGID concentrated stress", () => {
  test("representative Africa points resolve to expected regions and round-trip cleanly", () => {
    const start = performance.now();

    for (const point of AFRICA_AGID_STRESS_POINTS) {
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
    assert.ok(elapsed < 2200, `Africa AGID stress should stay fast, elapsed=${elapsed.toFixed(1)}ms`);
  });

  test("known Africa coarse-overlap regressions stay corrected", () => {
    const byName = new Map(AFRICA_AGID_STRESS_POINTS.map((point) => [point.name, point]));

    for (const name of COARSE_OVERLAP_REGRESSION_POINTS) {
      const point = byName.get(name);
      assert.ok(point, `missing regression fixture ${name}`);
      assert.equal(getRegionInfo(point.lat, point.lon).prefix, point.code, `${name} region`);
      assert.equal(encodeAGID(point.lat, point.lon).regionCode, point.code, `${name} AGID`);
    }
  });

  test("every stressed Africa region has a usable address format definition", () => {
    for (const point of AFRICA_AGID_STRESS_POINTS) {
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

  test("language tabs produce distinct native and international displays for African scripts", () => {
    const cases = [
      {
        code: "EG",
        nativeLanguage: "ar",
        nativeScript: /[\u0600-\u06ff]/,
        englishLanguage: "en",
        native: {
          country: "مصر",
          state: "محافظة القاهرة",
          city: "القاهرة",
          district: "وسط البلد",
          road: "شارع طلعت حرب",
          house_number: "12",
          building: "عمارة التحرير",
          postcode: "11511",
        },
        english: {
          country: "Egypt",
          state: "Cairo Governorate",
          city: "Cairo",
          district: "Downtown",
          road: "Talaat Harb Street",
          house_number: "12",
          building: "Tahrir Building",
          postcode: "11511",
        },
      },
      {
        code: "ET",
        nativeLanguage: "am",
        nativeScript: /[\u1200-\u137f]/,
        englishLanguage: "en",
        native: {
          country: "ኢትዮጵያ",
          state: "አዲስ አበባ",
          city: "አዲስ አበባ",
          district: "አራዳ",
          road: "ቸርችል ጎዳና",
          house_number: "8",
          building: "የከተማ ህንጻ",
          postcode: "1000",
        },
        english: {
          country: "Ethiopia",
          state: "Addis Ababa",
          city: "Addis Ababa",
          district: "Arada",
          road: "Churchill Avenue",
          house_number: "8",
          building: "Municipal Building",
          postcode: "1000",
        },
      },
      {
        code: "MA",
        nativeLanguage: "ar",
        nativeScript: /[\u0600-\u06ff]/,
        englishLanguage: "en",
        native: {
          country: "المغرب",
          state: "الرباط سلا القنيطرة",
          city: "الرباط",
          district: "حسان",
          road: "شارع محمد الخامس",
          house_number: "24",
          building: "مكتب البريد المركزي",
          postcode: "10000",
        },
        english: {
          country: "Morocco",
          state: "Rabat-Sale-Kenitra",
          city: "Rabat",
          district: "Hassan",
          road: "Mohammed V Avenue",
          house_number: "24",
          building: "Central Post Office",
          postcode: "10000",
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

  test("all Africa address formats keep 20 mixed display cases useful across representative tabs", () => {
    const start = performance.now();
    const formatPaths = collectAddressFormatPaths();
    let renderCount = 0;

    assert.equal(formatPaths.length, 64, "Africa address format coverage count");

    for (const formatPath of formatPaths) {
      const format = JSON.parse(readFileSync(formatPath, "utf8")) as Record<string, any>;
      const countryCode = String(format.countryCode || "");
      assert.ok(countryCode, `${formatPath} countryCode`);

      for (let index = 0; index < 20; index += 1) {
        const canonical = createCanonicalAddress(
          africaStressAddressDetails(countryCode, String(format.name || countryCode), index)
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

    assert.ok(renderCount >= 64 * 20 * 2, `expected broad Africa display coverage, rendered=${renderCount}`);
    assert.ok(performance.now() - start < 5000, "Africa address display quality stress should stay below 5s");
  });
});

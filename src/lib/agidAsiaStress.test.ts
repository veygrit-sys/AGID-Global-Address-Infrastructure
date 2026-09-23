import assert from "node:assert";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { describe, test } from "node:test";

import { assessAddressDisplayQuality, formatAddressDisplayText } from "./addressDisplay";
import { AddressRenderer, createCanonicalAddress, type CanonicalAddress } from "./addressRendering";
import { decodeAGID, encodeAGID, getRegionInfo } from "./agid";
import { isValidAGIDFormat } from "./agidSecurity";

type AsiaStressPoint = {
  readonly code: string;
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
  readonly expectedPrefix?: string;
};

const ASIA_AGID_STRESS_POINTS: readonly AsiaStressPoint[] = [
  { code: "AM", name: "Yerevan", lat: 40.1792, lon: 44.4991 },
  { code: "AZ", name: "Baku", lat: 40.4093, lon: 49.8671 },
  { code: "GE", name: "Tbilisi", lat: 41.7151, lon: 44.8271 },
  { code: "KG", name: "Bishkek", lat: 42.8746, lon: 74.5698 },
  { code: "KZ", name: "Astana", lat: 51.1694, lon: 71.4491 },
  { code: "TJ", name: "Dushanbe", lat: 38.5598, lon: 68.787 },
  { code: "TM", name: "Ashgabat", lat: 37.9601, lon: 58.3261 },
  { code: "UZ", name: "Tashkent", lat: 41.2995, lon: 69.2401 },
  { code: "JP_NT", name: "Northern Territories", lat: 44.5, lon: 146.8, expectedPrefix: "JP" },
  { code: "JP_SK", name: "Senkaku Islands", lat: 25.75, lon: 123.55, expectedPrefix: "JP" },
  { code: "JP_TK", name: "Takeshima / Dokdo", lat: 37.24, lon: 131.86, expectedPrefix: "JP" },
  { code: "KASH", name: "Kashmir", lat: 34.15, lon: 75.25 },
  { code: "SCSD", name: "South China Sea Islands", lat: 11, lon: 114.5 },
  { code: "JP", name: "Tokyo Station", lat: 35.6812, lon: 139.7671 },
  { code: "KR", name: "Seoul City Hall", lat: 37.5665, lon: 126.978 },
  { code: "KP", name: "Pyongyang", lat: 39.0392, lon: 125.7625 },
  { code: "CN", name: "Beijing", lat: 39.9042, lon: 116.4074 },
  { code: "TW", name: "Taipei", lat: 25.033, lon: 121.5654 },
  { code: "HK", name: "Hong Kong", lat: 22.3193, lon: 114.1694 },
  { code: "MO", name: "Macau", lat: 22.1987, lon: 113.5439 },
  { code: "MN", name: "Ulaanbaatar", lat: 47.8864, lon: 106.9057 },
  { code: "VN", name: "Hanoi", lat: 21.0278, lon: 105.8342 },
  { code: "TH", name: "Bangkok", lat: 13.7563, lon: 100.5018 },
  { code: "PH", name: "Manila", lat: 14.5995, lon: 120.9842 },
  { code: "MY", name: "Kuala Lumpur", lat: 3.139, lon: 101.6869 },
  { code: "ID", name: "Jakarta", lat: -6.2088, lon: 106.8456 },
  { code: "SG", name: "Singapore", lat: 1.3521, lon: 103.8198 },
  { code: "MM", name: "Yangon", lat: 16.8409, lon: 96.1735 },
  { code: "KH", name: "Phnom Penh", lat: 11.5564, lon: 104.9282 },
  { code: "LA", name: "Vientiane", lat: 17.9757, lon: 102.6331 },
  { code: "BN", name: "Bandar Seri Begawan", lat: 4.9031, lon: 114.9398 },
  { code: "TL", name: "Dili", lat: -8.5569, lon: 125.5603 },
  { code: "IN", name: "Delhi", lat: 28.6139, lon: 77.209 },
  { code: "PK", name: "Islamabad", lat: 33.6844, lon: 73.0479 },
  { code: "BD", name: "Dhaka", lat: 23.8103, lon: 90.4125 },
  { code: "LK", name: "Colombo", lat: 6.9271, lon: 79.8612 },
  { code: "AF", name: "Kabul", lat: 34.5553, lon: 69.2075 },
  { code: "NP", name: "Kathmandu", lat: 27.7172, lon: 85.324 },
  { code: "BT", name: "Thimphu", lat: 27.4728, lon: 89.639 },
  { code: "MV", name: "Male", lat: 4.1755, lon: 73.5093 },
  { code: "SA", name: "Riyadh", lat: 24.7136, lon: 46.6753 },
  { code: "IR", name: "Tehran", lat: 35.6892, lon: 51.389 },
  { code: "IQ", name: "Baghdad", lat: 33.3152, lon: 44.3661 },
  { code: "TR", name: "Ankara", lat: 39.9334, lon: 32.8597 },
  { code: "AE", name: "Dubai", lat: 25.2048, lon: 55.2708 },
  { code: "IL", name: "Tel Aviv", lat: 32.0853, lon: 34.7818 },
  { code: "PS", name: "Ramallah", lat: 31.9038, lon: 35.2034 },
  { code: "JO", name: "Amman", lat: 31.9539, lon: 35.9106 },
  { code: "LB", name: "Beirut", lat: 33.8938, lon: 35.5018 },
  { code: "SY", name: "Damascus", lat: 33.5138, lon: 36.2765 },
  { code: "OM", name: "Muscat", lat: 23.588, lon: 58.3829 },
  { code: "YE", name: "Sanaa", lat: 15.3694, lon: 44.191 },
  { code: "QA", name: "Doha", lat: 25.2854, lon: 51.531 },
  { code: "KW", name: "Kuwait City", lat: 29.3759, lon: 47.9774 },
  { code: "BH", name: "Manama", lat: 26.2235, lon: 50.5876 },
];

const COARSE_OVERLAP_REGRESSION_POINTS = [
  "Yerevan",
  "Baku",
  "Tbilisi",
  "Seoul City Hall",
  "Pyongyang",
  "Hanoi",
  "Delhi",
  "Islamabad",
  "Tashkent",
  "Ramallah",
  "Damascus",
  "Senkaku Islands",
] as const;

const HERE = dirname(fileURLToPath(import.meta.url));
const ASIA_ADDRESS_FORMAT_DIR = join(HERE, "..", "data", "address_formats", "asia");

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

function findAddressFormatPath(countryCode: string, dir = ASIA_ADDRESS_FORMAT_DIR): string | null {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = findAddressFormatPath(countryCode, fullPath);
      if (nested) {
        return nested;
      }
      continue;
    }
    if (entry.name === `${countryCode}.json`) {
      return fullPath;
    }
  }
  return null;
}

function collectAddressFormatPaths(dir = ASIA_ADDRESS_FORMAT_DIR): string[] {
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
  assert.ok(formatPath, `missing asia address format: ${countryCode}`);
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

function asiaStressAddressDetails(countryCode: string, countryName: string, index: number) {
  const caseIndex = index % 5;
  const common = {
    country_code: countryCode,
    country: countryName,
    lat: 10 + index,
    lon: 20 + index,
  };

  if (caseIndex === 0) {
    return {
      ...common,
      state: `Region ${(index % 7) + 1}`,
      city: `Capital City ${index + 1}`,
      district: `Central District ${(index % 9) + 1}`,
      subdistrict: `Station Quarter ${(index % 5) + 1}`,
      road: `Main Road ${index + 1}`,
      house_number: String(index + 1),
      building: `Civic Center ${index + 1}`,
      postcode: String(10000 + index),
    };
  }

  if (caseIndex === 1) {
    return {
      ...common,
      state: `Province ${(index % 6) + 1}`,
      city: `Market Town ${index + 1}`,
      district: `Rural District ${(index % 8) + 1}`,
      subdistrict: `Village ${(index % 11) + 1}`,
      road: `County Road ${index + 1}`,
      house_number: String(20 + index),
      postcode: String(20000 + index),
    };
  }

  if (caseIndex === 2) {
    return {
      ...common,
      state: `Island Region ${(index % 4) + 1}`,
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
      state: `Highland ${(index % 5) + 1}`,
      city: `Mountain Town ${index + 1}`,
      district: `Valley District ${(index % 6) + 1}`,
      road: `Pass Road ${index + 1}`,
      house_number: String(40 + index),
      building: `Ranger Station ${index + 1}`,
      postcode: String(40000 + index),
      mountain: `Reference Peak ${index + 1}`,
      map_feature_kind: "mountain",
    };
  }

  return {
    ...common,
    state: `Dryland ${(index % 5) + 1}`,
    city: `Oasis Town ${index + 1}`,
    district: `Steppe District ${(index % 6) + 1}`,
    road: `Desert Track ${index + 1}`,
    house_number: String(50 + index),
    building: `Field Post ${index + 1}`,
    postcode: String(50000 + index),
    desert: `Reference Desert ${index + 1}`,
    map_feature_kind: "desert",
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

describe("Asia AGID concentrated stress", () => {
  test("representative Asia points resolve to the expected AGID prefix and round-trip cleanly", () => {
    const start = performance.now();

    for (const point of ASIA_AGID_STRESS_POINTS) {
      const region = getRegionInfo(point.lat, point.lon);
      assert.equal(region.prefix, point.code, `${point.name} should resolve to ${point.code}`);

      const agid = encodeAGID(point.lat, point.lon);
      const expectedPrefix = point.expectedPrefix ?? (/^[A-Z]{2}$/.test(point.code) ? point.code : null);
      if (expectedPrefix) {
        assert.equal(agid.prefix, expectedPrefix, `${point.name} AGID prefix`);
      } else {
        assert.ok(!/^[A-Z]{2}$/.test(agid.prefix), `${point.name} non-ISO AGID prefix should avoid ISO country collision`);
      }
      assert.equal(agid.regionCode, point.code, `${point.name} AGID region code`);
      assert.equal(agid.isSea, false, `${point.name} should not be classified as sea`);
      assert.ok(isValidAGIDFormat(agid.id), `${point.name} should emit a valid AGID`);
      assert.equal(agid.polygon.length, 5, `${point.name} cell polygon should be closed`);

      const decoded = decodeAGID(agid.id);
      assert.ok(decoded, `${point.name} AGID should decode`);
      assert.equal(decoded.face, agid.face, `${point.name} decoded face`);
      assert.equal(decoded.qx, agid.qx, `${point.name} decoded qx`);
      assert.equal(decoded.qy, agid.qy, `${point.name} decoded qy`);

      const centerError = haversineMeters(point, { lat: decoded.lat, lon: decoded.lon });
      assert.ok(centerError <= 8, `${point.name} center error ${centerError.toFixed(2)}m`);
    }

    const elapsed = performance.now() - start;
    assert.ok(elapsed < 1500, `Asia AGID stress should stay fast, elapsed=${elapsed.toFixed(1)}ms`);
  });

  test("known coarse-bounding-box overlap regressions stay corrected", () => {
    const byName = new Map(ASIA_AGID_STRESS_POINTS.map((point) => [point.name, point]));

    for (const name of COARSE_OVERLAP_REGRESSION_POINTS) {
      const point = byName.get(name);
      assert.ok(point, `missing regression fixture ${name}`);
      assert.equal(getRegionInfo(point.lat, point.lon).prefix, point.code, `${name} region`);
      const agid = encodeAGID(point.lat, point.lon);
      assert.equal(agid.regionCode, point.code, `${name} AGID region code`);
      if (point.expectedPrefix) {
        assert.equal(agid.prefix, point.expectedPrefix, `${name} AGID public prefix`);
      }
    }
  });

  test("every stressed Asia country has a usable address format definition", () => {
    for (const point of ASIA_AGID_STRESS_POINTS) {
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

  test("language tabs produce meaningfully different address displays for major Asian scripts", () => {
    const cases = [
      {
        code: "JP",
        nativeLanguage: "ja",
        nativeScript: /[一-龯ぁ-んァ-ヶ]/,
        englishLanguage: "en",
        native: {
          country: "日本",
          state: "東京都",
          city: "千代田区",
          district: "丸の内",
          road: "丸の内中央通り",
          house_number: "1-9-1",
          building: "東京駅",
          postcode: "100-0005",
        },
        english: {
          country: "Japan",
          state: "Tokyo",
          city: "Chiyoda City",
          district: "Marunouchi",
          road: "Marunouchi Central Street",
          house_number: "1-9-1",
          building: "Tokyo Station",
          postcode: "100-0005",
        },
      },
      {
        code: "CN",
        nativeLanguage: "zh",
        nativeScript: /[\u4e00-\u9fff]/,
        englishLanguage: "en",
        native: {
          country: "中国",
          state: "北京市",
          city: "北京市",
          district: "东城区",
          road: "东长安街",
          house_number: "16号",
          building: "天安门",
          postcode: "100006",
        },
        english: {
          country: "China",
          state: "Beijing",
          city: "Beijing",
          district: "Dongcheng District",
          road: "East Chang'an Avenue",
          house_number: "16",
          building: "Tian'anmen",
          postcode: "100006",
        },
      },
      {
        code: "KR",
        nativeLanguage: "ko",
        nativeScript: /[\uac00-\ud7af]/,
        englishLanguage: "en",
        native: {
          country: "대한민국",
          state: "서울특별시",
          city: "서울특별시",
          district: "종로구",
          road: "세종대로",
          house_number: "1",
          building: "광화문",
          postcode: "03172",
        },
        english: {
          country: "South Korea",
          state: "Seoul",
          city: "Seoul",
          district: "Jongno-gu",
          road: "Sejong-daero",
          house_number: "1",
          building: "Gwanghwamun",
          postcode: "03172",
        },
      },
      {
        code: "AE",
        nativeLanguage: "ar",
        nativeScript: /[\u0600-\u06ff]/,
        englishLanguage: "en",
        native: {
          country: "الإمارات العربية المتحدة",
          state: "دبي",
          city: "دبي",
          subdistrict: "وسط المدينة",
          road: "شارع الشيخ زايد",
          house_number: "1",
          building: "برج خليفة",
          postcode: "00000",
        },
        english: {
          country: "United Arab Emirates",
          state: "Dubai",
          city: "Dubai",
          subdistrict: "Downtown Dubai",
          road: "Sheikh Zayed Road",
          house_number: "1",
          building: "Burj Khalifa",
          postcode: "00000",
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

  test("all Asia address formats keep 20 mixed display cases useful across representative tabs", () => {
    const start = performance.now();
    const formatPaths = collectAddressFormatPaths();
    let renderCount = 0;

    assert.equal(formatPaths.length, 55, "Asia address format coverage count");

    for (const formatPath of formatPaths) {
      const format = JSON.parse(readFileSync(formatPath, "utf8")) as Record<string, any>;
      const countryCode = String(format.countryCode || "");
      assert.ok(countryCode, `${formatPath} countryCode`);

      for (let index = 0; index < 20; index += 1) {
        const canonical = createCanonicalAddress(
          asiaStressAddressDetails(countryCode, String(format.name || countryCode), index)
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

    assert.ok(renderCount >= 55 * 20 * 2, `expected broad Asia display coverage, rendered=${renderCount}`);
    assert.ok(performance.now() - start < 5000, "Asia address display quality stress should stay below 5s");
  });
});

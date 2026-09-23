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

type TerritoryStressPoint = {
  readonly code: string;
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
  readonly expectedRegionCodes?: readonly string[];
};

const TERRITORY_AUTONOMOUS_STRESS_POINTS: readonly TerritoryStressPoint[] = [
  { code: "AC", name: "Ascension Island", lat: -7.9286, lon: -14.4119 },
  { code: "AI", name: "Anguilla", lat: 18.2208, lon: -63.0517 },
  { code: "AS", name: "American Samoa", lat: -14.2756, lon: -170.702 },
  { code: "AW", name: "Aruba", lat: 12.5211, lon: -69.9683 },
  { code: "AX", name: "Aland Islands", lat: 60.0973, lon: 19.9348 },
  { code: "BL", name: "Saint Barthelemy", lat: 17.8963, lon: -62.8522 },
  { code: "BM", name: "Bermuda", lat: 32.2948, lon: -64.7814 },
  { code: "BQ", name: "Caribbean Netherlands", lat: 12.1508, lon: -68.2769 },
  { code: "BV", name: "Bouvet Island", lat: -54.4208, lon: 3.3464 },
  { code: "CC", name: "Cocos Keeling Islands", lat: -12.1889, lon: 96.8293 },
  { code: "CK", name: "Cook Islands", lat: -21.2129, lon: -159.7823 },
  { code: "CL-DI", name: "Desventuradas Islands", lat: -26.35, lon: -79.92 },
  { code: "CL-EA", name: "Easter Island", lat: -27.15, lon: -109.4333 },
  { code: "CL-JF", name: "Juan Fernandez Islands", lat: -33.641, lon: -78.843 },
  { code: "CL-SG", name: "Salas y Gomez Island", lat: -26.466, lon: -105.35 },
  { code: "CP", name: "Clipperton Island", lat: 10.2833, lon: -109.2167 },
  { code: "CW", name: "Curacao", lat: 12.1224, lon: -68.8824 },
  { code: "CX", name: "Christmas Island", lat: -10.4217, lon: 105.6791 },
  { code: "EA", name: "Ceuta", lat: 35.8894, lon: -5.3213 },
  { code: "ES_BAL", name: "Balearic Islands", lat: 39.5696, lon: 2.6502 },
  { code: "ES_CAN", name: "Canary Islands", lat: 28.2916, lon: -16.6291 },
  { code: "FK", name: "Falkland Islands", lat: -51.6977, lon: -57.8517 },
  { code: "FO", name: "Faroe Islands", lat: 62.0079, lon: -6.7909 },
  { code: "GF", name: "French Guiana", lat: 4.9224, lon: -52.3135 },
  { code: "GG", name: "Guernsey", lat: 49.4657, lon: -2.5853 },
  { code: "GI", name: "Gibraltar", lat: 36.1408, lon: -5.3536 },
  { code: "GL", name: "Greenland", lat: 64.1835, lon: -51.7216 },
  { code: "GP", name: "Guadeloupe", lat: 15.995, lon: -61.732 },
  { code: "GS", name: "South Georgia", lat: -54.2811, lon: -36.508 },
  { code: "GU", name: "Guam", lat: 13.4763, lon: 144.7502 },
  { code: "HK", name: "Hong Kong", lat: 22.3193, lon: 114.1694 },
  { code: "IM", name: "Isle of Man", lat: 54.1523, lon: -4.4861 },
  { code: "IO", name: "British Indian Ocean Territory", lat: -7.313, lon: 72.411 },
  { code: "JE", name: "Jersey", lat: 49.2144, lon: -2.1313 },
  { code: "KY", name: "Cayman Islands", lat: 19.2866, lon: -81.3744 },
  { code: "MF", name: "Saint Martin", lat: 18.0731, lon: -63.0822 },
  { code: "MO", name: "Macao", lat: 22.1987, lon: 113.5439 },
  { code: "MQ", name: "Martinique", lat: 14.6161, lon: -61.0588 },
  { code: "MP", name: "Northern Mariana Islands", lat: 15.1778, lon: 145.7509 },
  { code: "MS", name: "Montserrat", lat: 16.7918, lon: -62.2106 },
  { code: "NC", name: "New Caledonia", lat: -22.2758, lon: 166.458 },
  { code: "NF", name: "Norfolk Island", lat: -29.0569, lon: 167.9592 },
  { code: "NU", name: "Niue", lat: -19.0554, lon: -169.9179 },
  { code: "PF", name: "French Polynesia", lat: -17.5516, lon: -149.5585 },
  { code: "PM", name: "Saint Pierre and Miquelon", lat: 46.7758, lon: -56.1806 },
  { code: "PN", name: "Pitcairn Islands", lat: -25.066, lon: -130.1015 },
  { code: "PR", name: "Puerto Rico", lat: 18.4655, lon: -66.1057 },
  { code: "PT_AZO", name: "Azores", lat: 37.7412, lon: -25.6756 },
  { code: "PT_MAD", name: "Madeira", lat: 32.7607, lon: -16.9595 },
  { code: "RE", name: "Reunion", lat: -20.8789, lon: 55.4481 },
  { code: "SBA", name: "Sovereign Base Areas", lat: 34.67, lon: 32.86, expectedRegionCodes: ["XU", "XD"] },
  { code: "SH", name: "Saint Helena", lat: -15.924, lon: -5.718 },
  { code: "SJ", name: "Svalbard and Jan Mayen", lat: 78.2232, lon: 15.6469, expectedRegionCodes: ["SJ_SVA", "SJ_JAN"] },
  { code: "SX", name: "Sint Maarten", lat: 18.026, lon: -63.0458 },
  { code: "TA", name: "Tristan da Cunha", lat: -37.0676, lon: -12.3116 },
  { code: "TC", name: "Turks and Caicos Islands", lat: 21.4612, lon: -71.1419 },
  { code: "TF", name: "French Southern Territories", lat: -49.35, lon: 70.2167 },
  { code: "TK", name: "Tokelau", lat: -9.365, lon: -171.218 },
  { code: "UM", name: "United States Minor Outlying Islands", lat: 19.2823, lon: 166.647 },
  { code: "VG", name: "British Virgin Islands", lat: 18.4285, lon: -64.6185 },
  { code: "VI", name: "U.S. Virgin Islands", lat: 18.3419, lon: -64.9307 },
  { code: "WF", name: "Wallis and Futuna", lat: -13.2816, lon: -176.1745 },
  { code: "XD", name: "Dhekelia", lat: 35.03, lon: 33.78 },
  { code: "XU", name: "Akrotiri", lat: 34.59, lon: 32.98 },
  { code: "YT", name: "Mayotte", lat: -12.7806, lon: 45.2278 },
];

const HERE = dirname(fileURLToPath(import.meta.url));
const ADDRESS_FORMAT_ROOT = join(HERE, "..", "data", "address_formats");
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

function findAddressFormatPath(countryCode: string, dir = ADDRESS_FORMAT_ROOT): string | null {
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
  assert.ok(formatPath, `missing territory/autonomous address format: ${countryCode}`);
  assert.ok(existsSync(formatPath), `missing file on disk: ${formatPath}`);
  return JSON.parse(readFileSync(formatPath, "utf8")) as Record<string, any>;
}

function territoryFixture(point: TerritoryStressPoint): Partial<CanonicalAddress> {
  if (point.code === "HK") {
    return {
      country_code: "HK",
      country: "香港",
      state: "香港",
      city: "九龍",
      district: "油尖旺區",
      subdistrict: "尖沙咀",
      road: "彌敦道",
      house_number: "1",
      building: "AGID交收中心",
    };
  }

  if (point.code === "MO") {
    return {
      country_code: "MO",
      country: "澳門",
      state: "澳門",
      city: "澳門",
      district: "花地瑪堂區",
      subdistrict: "澳門半島",
      road: "新馬路",
      house_number: "1",
      building: "AGID交收中心",
    };
  }

  return {
    country_code: point.code,
    country: point.name,
    state: "Territory",
    city: point.name,
    district: "Central District",
    subdistrict: "Main Settlement",
    road: "Main Street",
    house_number: "1",
    building: "AGID Address Test Point",
    postcode: "0000",
  };
}

function renderQuality(point: TerritoryStressPoint, language: string) {
  const canonical = createCanonicalAddress(territoryFixture(point));
  const rendered = AddressRenderer.render(language, canonical);
  const text = formatAddressDisplayText(rendered, { tab: language, countryCode: point.code });
  const quality = assessAddressDisplayQuality(rendered, {
    country: canonical.country,
    countryCode: point.code,
  });
  return { text, quality };
}

function firstLanguageCode(format: Record<string, any>) {
  const first = format.addressRules?.languages?.[0];
  return String(typeof first === "string" ? first : first?.code ?? "native").trim() || "native";
}

function expectedRegionCodes(point: TerritoryStressPoint) {
  return point.expectedRegionCodes ?? [point.code];
}

describe("territory and autonomous AGID address-display stress", () => {
  test("representative overseas territories and autonomous regions resolve to AGID land regions", () => {
    const start = performance.now();
    assert.equal(TERRITORY_AUTONOMOUS_STRESS_POINTS.length, 65);

    for (const point of TERRITORY_AUTONOMOUS_STRESS_POINTS) {
      const expected = expectedRegionCodes(point);
      const region = getRegionInfo(point.lat, point.lon);
      assert.ok(expected.includes(region.prefix), `${point.code} ${point.name} region ${region.prefix}`);

      const agid = encodeAGID(point.lat, point.lon);
      assert.ok(expected.includes(agid.regionCode), `${point.code} ${point.name} AGID region ${agid.regionCode}`);
      assert.equal(agid.isSea, false, `${point.code} ${point.name} should not be sea`);
      assert.ok(isValidAGIDFormat(agid.id), `${point.code} ${point.name} should emit a valid AGID`);
      assert.equal(agid.polygon.length, 5, `${point.code} ${point.name} cell polygon should be closed`);

      const decoded = decodeAGID(agid.id);
      assert.ok(decoded, `${point.code} ${point.name} AGID should decode`);
      assert.equal(decoded.face, agid.face, `${point.code} ${point.name} decoded face`);
      assert.equal(decoded.qx, agid.qx, `${point.code} ${point.name} decoded qx`);
      assert.equal(decoded.qy, agid.qy, `${point.code} ${point.name} decoded qy`);
      assert.equal(decoded.prefix, agid.prefix, `${point.code} ${point.name} decoded prefix`);

      const centerError = haversineMeters(point, { lat: decoded.lat, lon: decoded.lon });
      assert.ok(centerError <= 20, `${point.code} ${point.name} center error ${centerError.toFixed(2)}m`);
    }

    assert.ok(performance.now() - start < 2200, "territory AGID stress should stay fast");
  });

  test("every stressed territory and autonomous region has renderable address formats", () => {
    for (const point of TERRITORY_AUTONOMOUS_STRESS_POINTS) {
      const format = loadAddressFormat(point.code);
      assert.ok(
        format.countryCode === point.code || point.code.startsWith(`${format.countryCode}_`) || point.code.startsWith(`${format.countryCode}-`),
        `${point.code} countryCode`,
      );
      assert.ok(Array.isArray(format.addressRules?.languages), `${point.code} languages`);
      assert.ok(format.addressRules.languages.length > 0, `${point.code} language list`);
      assert.ok(format.native?.addressFormat || format.english?.addressFormat, `${point.code} render templates`);

      const openSourceIds =
        format.openSourceIds ?? format.addressRules?.openSourceIds ?? format.dataSources?.openSourceIds;
      assert.ok(Array.isArray(openSourceIds), `${point.code} should declare open source ids`);
      assert.ok(openSourceIds.length > 0, `${point.code} should have at least one open source id`);

      const native = renderQuality(point, firstLanguageCode(format));
      const english = renderQuality(point, "english");
      assert.ok(native.text.length > 0, `${point.code} native display should render`);
      assert.ok(english.text.length > 0, `${point.code} English display should render`);
      assert.equal(native.quality.isWeak, false, `${point.code} native weak display: ${native.text}`);
      assert.equal(english.quality.isWeak, false, `${point.code} English weak display: ${english.text}`);
      assert.ok(native.quality.score >= 0.55, `${point.code} native score ${native.quality.score}: ${native.text}`);
      assert.ok(english.quality.score >= 0.55, `${point.code} English score ${english.quality.score}: ${english.text}`);
    }
  });
});

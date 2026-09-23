import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { test } from "node:test";

import { assessAddressDisplayQuality, formatAddressDisplayText } from "./addressDisplay";
import { AddressRenderer, createCanonicalAddress } from "./addressRendering";

const AMERICAS_ADDRESS_FORMAT_DIR = join(process.cwd(), "src", "data", "address_formats", "americas");

function collectAddressFormatPaths(dir = AMERICAS_ADDRESS_FORMAT_DIR): string[] {
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

function hasAdjacentRepeatedLineOrToken(display: string) {
  const parts = display
    .split(/\r?\n|,\s*/)
    .map(part => part.trim().toLowerCase())
    .filter(Boolean);
  return parts.some((part, index) => index > 0 && part === parts[index - 1]);
}

function americasStressAddressDetails(countryCode: string, countryName: string, index: number) {
  const caseIndex = index % 5;
  const common = {
    country_code: countryCode,
    country: countryName,
    lat: 15 + index / 10,
    lon: -70 + index / 10,
  };

  if (caseIndex === 0) {
    return {
      ...common,
      state: `${countryName} Capital Region`,
      city: `Central City ${index + 1}`,
      district: `Downtown District ${(index % 9) + 1}`,
      subdistrict: `Market Quarter ${(index % 5) + 1}`,
      road: `Main Street ${index + 1}`,
      house_number: String(10 + index),
      building: `Civic Center ${index + 1}`,
      postcode: String(10000 + index),
    };
  }

  if (caseIndex === 1) {
    return {
      ...common,
      state: `${countryName} Province`,
      city: `Rural Town ${index + 1}`,
      district: `Municipal District ${(index % 8) + 1}`,
      subdistrict: `Farm Settlement ${(index % 11) + 1}`,
      road: `County Road ${index + 1}`,
      house_number: String(20 + index),
      building: `Rural Clinic ${index + 1}`,
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
      bay: `Reference Bay ${index + 1}`,
      map_feature_kind: "island",
    };
  }

  if (caseIndex === 3) {
    return {
      ...common,
      state: `${countryName} Highland Region`,
      city: `Valley Town ${index + 1}`,
      district: `Mountain District ${(index % 7) + 1}`,
      subdistrict: `Forest Reserve ${(index % 5) + 1}`,
      road: `Pass Road ${index + 1}`,
      house_number: String(40 + index),
      building: `Ranger Station ${index + 1}`,
      postcode: String(40000 + index),
      mountain: `Reference Peak ${index + 1}`,
      forest: `Reference Forest ${index + 1}`,
      valley: `Reference Valley ${index + 1}`,
      map_feature_kind: "mountain",
    };
  }

  return {
    ...common,
    state: `${countryName} River Region`,
    city: `Basin Town ${index + 1}`,
    district: `Wetland District ${(index % 6) + 1}`,
    subdistrict: `Rainforest Quarter ${(index % 5) + 1}`,
    road: `River Route ${index + 1}`,
    house_number: String(50 + index),
    building: `Field Post ${index + 1}`,
    postcode: String(50000 + index),
    river: `Reference River ${index + 1}`,
    wetland: `Reference Wetland ${index + 1}`,
    grassland: `Reference Pampas ${index + 1}`,
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

test("all Americas address formats keep 20 mixed display cases useful across representative tabs", () => {
  const start = performance.now();
  const formatPaths = collectAddressFormatPaths();
  let renderCount = 0;

  assert.equal(formatPaths.length, 65, "Americas address format coverage count");

  for (const formatPath of formatPaths) {
    const format = JSON.parse(readFileSync(formatPath, "utf8")) as Record<string, any>;
    const countryCode = String(format.countryCode || "");
    assert.ok(countryCode, `${formatPath} countryCode`);

    for (let index = 0; index < 20; index += 1) {
      const canonical = createCanonicalAddress(
        americasStressAddressDetails(countryCode, String(format.name || countryCode), index)
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

  assert.ok(renderCount >= 65 * 20 * 2, `expected broad Americas display coverage, rendered=${renderCount}`);
  assert.ok(performance.now() - start < 5000, "Americas address display quality stress should stay below 5s");
});

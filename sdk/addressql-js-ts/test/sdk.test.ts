import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  AddressQlApiClient,
  AddressQlApiError,
  addressMatch,
  countryAddressProfile,
  countryResolve,
  countryValidationReadiness,
  deliveryAvailable,
  normalizeAddress,
  postalExists,
  postalFormatValidate,
  postalNormalize,
  postalStatus,
  postalValidate,
} from "../src/index";

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

test("AddressQL TypeScript SDK resolves country and postal metadata", () => {
  assert.equal(countryResolve("Nihon").countryCode, "JP");
  assert.equal(postalStatus("HK"), "none");
  assert.equal(countryValidationReadiness("HK"), "postal_equivalent_required");
  assert.equal(countryAddressProfile("JP")?.addressFormatCoverage, "native_and_english_preloaded");
  assert.equal(postalNormalize("1000001", "JP"), "100-0001");
});

test("AddressQL TypeScript SDK validates postal and delivery non-claims", () => {
  const postal = postalValidate("1000001", "JP");
  const missing = postalValidate("9999999", "JP");
  const noPostal = postalValidate("00000", "HK");
  const delivery = deliveryAvailable("HK", "", "synthetic_carrier");

  assert.equal(postal.valid, true);
  assert.equal(postal.formatValid, true);
  assert.equal(postal.exists, null);
  assert.equal(postal.validationScope, "format_only");
  assert.ok(postal.warnings.includes("postal_existence_evidence_required"));
  assert.match(postal.nonClaims.join(" "), /not full address identity/);
  assert.equal(missing.valid, true);
  assert.equal(missing.formatValid, true);
  assert.equal(missing.exists, null);
  assert.ok(missing.warnings.includes("postal_existence_evidence_required"));
  assert.equal(noPostal.valid, false);
  assert.equal(noPostal.formatValid, false);
  assert.equal(noPostal.exists, null);
  assert.equal(noPostal.validationScope, "postal_equivalent_required");
  assert.ok(noPostal.warnings.includes("postal_equivalent_required"));
  assert.match(noPostal.nonClaims.join(" "), /Do not invent an official postal code/);
  assert.equal(delivery.available, false);
  assert.ok(delivery.reasons.includes("approved_delivery_source_required"));
  assert.match(delivery.nonClaims.join(" "), /not proof of residence/);
});

test("AddressQL TypeScript SDK separates format and existence using CSV fixtures", () => {
  const countryRows = parseCsv(readFileSync("extensions/addressql-duckdb/fixtures/synthetic_country_profiles.csv", "utf8"));
  const postalRows = parseCsv(readFileSync("extensions/addressql-duckdb/fixtures/synthetic_postal_areas.csv", "utf8"));
  const jp = countryRows.find(row => row.country_code === "JP");
  const hk = countryRows.find(row => row.country_code === "HK");
  const jpPostal = postalRows.find(row => row.country_code === "JP" && row.postal_code === "100-0001");

  assert.equal(jp?.validation_readiness, "format_only");
  assert.equal(hk?.validation_readiness, "postal_equivalent_required");
  assert.ok(jpPostal);
  assert.equal(postalFormatValidate(jpPostal?.postal_code, "JP"), true);
  assert.equal(postalExists(jpPostal?.postal_code, "JP"), null);
  assert.equal(postalFormatValidate("999-9999", "JP"), true);
  assert.equal(postalExists("999-9999", "JP"), null);
});

test("AddressQL TypeScript SDK can consume AGID postal pack JSON as no-postcode evidence", () => {
  const hkPack = JSON.parse(readFileSync("data/postal_country_packs/hk/agid-postal-country-pack.json", "utf8"));
  const validation = postalValidate("", hkPack.manifest.countryCode);

  assert.equal(hkPack.manifest.containsPersonalData, false);
  assert.equal(hkPack.manifest.containsRawThirdPartyData, false);
  assert.equal(hkPack.recommendation.tier, "no-or-not-required-postal-code");
  assert.equal(validation.valid, true);
  assert.equal(validation.validationScope, "postal_equivalent_required");
});

test("AddressQL TypeScript SDK keeps matching purpose-relative", () => {
  const a = normalizeAddress("Synthetic US Fixture Street", "US");
  const b = normalizeAddress(" Synthetic   US Fixture   Street ", "US");
  const decision = addressMatch(a, b, "delivery");

  assert.equal(decision.match, true);
  assert.equal(decision.purpose, "delivery");
  assert.match(decision.nonClaims.join(" "), /not proof of residence/);
});

test("AddressQL TypeScript SDK tolerates bounded punctuation, designator, and typo variants", () => {
  const canonical = normalizeAddress("10 Synthetic Fixture Street", "US");
  const abbreviated = normalizeAddress("10, Synthetic Fixture St.", "US");
  const typo = normalizeAddress("10 Synthetic Fixtur Street", "US");

  const abbreviatedDecision = addressMatch(canonical, abbreviated, "delivery");
  const typoDecision = addressMatch(canonical, typo, "delivery");

  assert.equal(abbreviatedDecision.match, true);
  assert.equal(abbreviatedDecision.confidence, 1);
  assert.equal(typoDecision.match, true);
  assert.ok(typoDecision.confidence >= 0.84);
});

test("AddressQL TypeScript SDK blocks fuzzy matches across explicit country boundaries", () => {
  const us = normalizeAddress("10 Synthetic Fixture Street", "US");
  const ca = normalizeAddress("10 Synthetic Fixture Street", "CA");
  const decision = addressMatch(us, ca, "delivery");

  assert.equal(decision.match, false);
  assert.equal(decision.confidence, 0);
  assert.match(decision.nonClaims.join(" "), /not delivery-point identity/);
});

test("AddressQL TypeScript SDK P1 client uses bounded HTTP calls and structured errors", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const client = new AddressQlApiClient({
    baseUrl: "http://127.0.0.1:8787/",
    timeoutMs: 1000,
    fetchImpl: (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({
        version: "addressql-practical-api-v1",
        countryCode: "JP",
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch,
  });

  const result = await client.validatePostal({
    countryCode: "JP",
    postalCode: "100-0001",
    purpose: "format",
  });

  assert.equal(result.countryCode, "JP");
  assert.equal(calls[0].url, "http://127.0.0.1:8787/v1/postal/validate");
  assert.equal(calls[0].init?.method, "POST");
  assert.equal((calls[0].init?.headers as Record<string, string>).authorization, undefined);

  await client.listCountryDataPromotions();
  await client.countryDataPromotion("GT");
  await client.listMultilingualQuality();
  await client.countryLanguages("JP");
  await client.assessMultilingual({
    countryCode: "JP",
    sourceLanguage: "ja",
    targetLanguage: "en",
    purpose: "international-shipping",
  });
  await client.rankPlaceNames({
    countryCode: "JP",
    query: "日本橋",
    targetLanguage: "en",
    purpose: "international-shipping",
    hierarchyLevel: "locality",
    parentPlaceIds: ["jp-tokyo", "jp-tokyo-chuo"],
    maxCandidates: 3,
  });
  const commitment = `sha256:${"a".repeat(64)}` as const;
  await client.assessDeliveryPoint({
    version: "addressql-l5-delivery-point-request-v1",
    countryCode: "JP",
    deliveryPointCommitment: commitment,
    serviceLevel: "standard",
    assertions: [{
      version: "addressql-l5-carrier-assertion-v1",
      assertionId: "synthetic-assertion",
      carrierId: "synthetic-carrier",
      keyId: "synthetic-key",
      countryCode: "JP",
      deliveryPointCommitment: commitment,
      serviceLevel: "standard",
      decision: "reachable",
      sourceVersion: "synthetic-v1",
      evidenceDigest: `sha256:${"b".repeat(64)}`,
      assessedAt: "2026-07-27T00:00:00Z",
      expiresAt: "2026-07-27T01:00:00Z",
      signature: "synthetic-detached-signature",
    }],
  });
  assert.equal(calls[1].url, "http://127.0.0.1:8787/v1/promotions");
  assert.equal(calls[2].url, "http://127.0.0.1:8787/v1/countries/GT/promotions");
  assert.equal(calls[3].url, "http://127.0.0.1:8787/v1/multilingual");
  assert.equal(calls[4].url, "http://127.0.0.1:8787/v1/countries/JP/languages");
  assert.equal(calls[5].url, "http://127.0.0.1:8787/v1/multilingual/assess");
  assert.equal(calls[6].url, "http://127.0.0.1:8787/v1/place-names/rank");
  assert.equal(calls[7].url, "http://127.0.0.1:8787/v1/delivery-points/assess");
  const placeNameBody = JSON.parse(
    String(calls[6].init?.body),
  ) as Record<string, unknown>;
  assert.deepEqual(Object.keys(placeNameBody).sort(), [
    "countryCode",
    "hierarchyLevel",
    "maxCandidates",
    "parentPlaceIds",
    "purpose",
    "query",
    "targetLanguage",
  ]);
  assert.equal("rawAddress" in placeNameBody, false);
  const l5Body = JSON.parse(String(calls[7].init?.body)) as Record<string, unknown>;
  assert.deepEqual(Object.keys(l5Body).sort(), [
    "assertions",
    "countryCode",
    "deliveryPointCommitment",
    "serviceLevel",
    "version",
  ]);
  assert.equal("rawAddress" in l5Body, false);

  const failing = new AddressQlApiClient({
    fetchImpl: (async () => new Response(JSON.stringify({
      error: { code: "country_not_found", message: "No profile." },
    }), {
      status: 404,
      headers: { "content-type": "application/json" },
    })) as typeof fetch,
  });
  await assert.rejects(
    failing.countryCapabilities("ZZ"),
    (error: unknown) => error instanceof AddressQlApiError
      && error.status === 404
      && error.code === "country_not_found",
  );
});

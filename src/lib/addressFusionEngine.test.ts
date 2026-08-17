import assert from "node:assert/strict";
import {
  ADDRESS_FIELDS,
  clusterAddressEvidence,
  exportOpenAddressEntities,
  fuseAddressEvidence,
  type AddressEvidenceRecord,
} from "./addressFusionEngine";
import {
  ADDRESS_FUSION_COUNTRIES,
  assertCompleteCountrySourcePlans,
  getAddressFusionCountry,
} from "../data/addressFusionCountries";

const adapter = getAddressFusionCountry("BR");
assert.ok(adapter);

const official: AddressEvidenceRecord = {
  sourceId: "br-official-test",
  countryCode: "BR",
  sourceKind: "official_address",
  evidenceClass: "verified",
  authority: 1,
  observedAt: "2026-01-01",
  redistribution: "open",
  fields: {
    locality: "São Paulo",
    street: "Avenida Paulista",
    houseNumber: "1000",
    postcode: "01310-100",
    lat: -23.564,
    lon: -46.652,
  },
};

const osmConflict: AddressEvidenceRecord = {
  sourceId: "br-osm-test",
  countryCode: "BR",
  sourceKind: "osm",
  evidenceClass: "observed",
  authority: 0.75,
  observedAt: "2026-01-01",
  redistribution: "attribution",
  fields: {
    locality: "São Paulo",
    street: "Av. Paulista",
    houseNumber: "1000",
    postcode: "01310-200",
    lat: -23.56401,
    lon: -46.65201,
  },
};

const [fused] = fuseAddressEvidence([osmConflict, official], adapter);
assert.equal(fused.fields.postcode?.value, "01310-100");
assert.ok(fused.conflicts.some((conflict) => conflict.startsWith("postcode:")));
assert.deepEqual(fused.fields.postcode?.provenance, ["br-official-test"]);

const inferredNumber: AddressEvidenceRecord = {
  sourceId: "br-inferred-number",
  countryCode: "BR",
  sourceKind: "building",
  evidenceClass: "inferred",
  authority: 0.9,
  redistribution: "open",
  fields: {
    locality: "São Paulo",
    street: "Rua Exemplo",
    houseNumber: "27",
    lat: -23.5,
    lon: -46.6,
  },
};
const [withoutInventedNumber] = fuseAddressEvidence(
  [inferredNumber],
  adapter,
);
assert.equal(withoutInventedNumber.fields.houseNumber, undefined);

const licensedOnly: AddressEvidenceRecord = {
  sourceId: "licensed-postal-source",
  countryCode: "BR",
  sourceKind: "postal",
  evidenceClass: "verified",
  authority: 1,
  redistribution: "restricted",
  fields: {
    postcode: "01000-000",
    locality: "São Paulo",
  },
};
const [internalEntity] = fuseAddressEvidence([licensedOnly], adapter);
const [publicEntity] = exportOpenAddressEntities([internalEntity]);
assert.equal(internalEntity.fields.postcode?.value, "01000-000");
assert.equal(publicEntity.fields.postcode, undefined);
assert.equal(publicEntity.fields.locality, undefined);

const stableA = fuseAddressEvidence([official, osmConflict], adapter)[0];
const stableB = fuseAddressEvidence([osmConflict, official], adapter)[0];
assert.equal(stableA.id, stableB.id);

const nearby: AddressEvidenceRecord = {
  ...official,
  sourceId: "nearby",
  sourceKind: "coordinates",
  evidenceClass: "observed",
  fields: { lat: -23.56402, lon: -46.65202 },
};
const distant: AddressEvidenceRecord = {
  ...official,
  sourceId: "distant",
  sourceKind: "coordinates",
  evidenceClass: "observed",
  fields: { lat: -22.9, lon: -43.2 },
};
assert.equal(
  clusterAddressEvidence([official, nearby, distant], adapter).length,
  2,
);

const EXPANSION_COUNTRY_CODES = ["ID","PH","VN","BD","PK","LK","NP","BT","MN","KZ","UZ","AM","AZ","JO","KW","BN","MA","TN","EG","KE","GH","RW","NA","BW","ZM","ZW","TZ","UG","SN","CV","PE","EC","PY","DO","JM","TT"] as const;
for (const countryCode of EXPANSION_COUNTRY_CODES) {
  assert.ok(getAddressFusionCountry(countryCode), `missing adapter: ${countryCode}`);
}

assert.equal(ADDRESS_FUSION_COUNTRIES.length, 61);
assertCompleteCountrySourcePlans();
for (const country of ADDRESS_FUSION_COUNTRIES) {
  assert.equal(new Set(country.sourcePlan.map((source) => source.kind)).size, 9);
  assert.equal(country.sourcePlan.length, 9);
}

assert.ok(getAddressFusionCountry("br")?.postcodePattern?.test("01310-100"));
assert.ok(getAddressFusionCountry("MX")?.postcodePattern?.test("06000"));
assert.ok(getAddressFusionCountry("IN")?.postcodePattern?.test("110001"));
assert.ok(getAddressFusionCountry("ZA")?.postcodePattern?.test("8001"));
assert.equal(getAddressFusionCountry("QA")?.postcodePattern, undefined);
assert.equal(getAddressFusionCountry("BH")?.postcodePattern, undefined);
assert.ok(getAddressFusionCountry("ID")?.postcodePattern?.test("10110"));
assert.ok(getAddressFusionCountry("PH")?.postcodePattern?.test("1000"));
assert.ok(getAddressFusionCountry("KZ")?.postcodePattern?.test("A10A1B2"));
assert.ok(getAddressFusionCountry("TT")?.postcodePattern?.test("120110"));
assert.equal(getAddressFusionCountry("RW")?.postcodePattern, undefined);
assert.equal(getAddressFusionCountry("BW")?.postcodePattern, undefined);
assert.equal(getAddressFusionCountry("ZW")?.postcodePattern, undefined);

assert.ok(ADDRESS_FIELDS.includes("buildingName"));
assert.ok(ADDRESS_FIELDS.includes("postcode"));

console.info(
  `Address fusion checks passed for ${ADDRESS_FUSION_COUNTRIES.length} countries.`,
);

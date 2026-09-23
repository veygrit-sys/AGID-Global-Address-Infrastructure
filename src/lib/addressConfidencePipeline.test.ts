import assert from "node:assert/strict";
import {
  fuseAddressEvidence,
  type AddressEvidenceRecord,
} from "./addressFusionEngine";
import { evaluateAddressConfidence } from "./addressConfidencePipeline";
import { getAddressFusionCountry } from "../data/addressFusionCountries";

const adapter = getAddressFusionCountry("PE");
assert.ok(adapter);

const baseFields = {
  admin1: "Lima",
  admin2: "Lima",
  admin3: "Miraflores",
  locality: "Lima",
  sublocality: "Miraflores",
  street: "Avenida José Larco",
  houseNumber: "123",
  buildingName: "Edificio Ejemplo",
  buildingId: "building-123",
  postcode: "15074",
  lat: -12.121,
  lon: -77.03,
};

const evidence: AddressEvidenceRecord[] = [
  {
    sourceId: "pe-official",
    countryCode: "PE",
    sourceKind: "official_address",
    evidenceClass: "verified",
    authority: 0.96,
    redistribution: "open",
    fields: baseFields,
  },
  {
    sourceId: "pe-admin",
    countryCode: "PE",
    sourceKind: "administrative",
    evidenceClass: "verified",
    authority: 0.92,
    redistribution: "open",
    fields: {
      admin1: baseFields.admin1,
      admin2: baseFields.admin2,
      admin3: baseFields.admin3,
      locality: baseFields.locality,
      sublocality: baseFields.sublocality,
      lat: baseFields.lat,
      lon: baseFields.lon,
    },
  },
  {
    sourceId: "pe-road",
    countryCode: "PE",
    sourceKind: "road",
    evidenceClass: "observed",
    authority: 0.88,
    redistribution: "attribution",
    fields: {
      locality: baseFields.locality,
      street: baseFields.street,
      lat: baseFields.lat,
      lon: baseFields.lon,
    },
  },
  {
    sourceId: "pe-building",
    countryCode: "PE",
    sourceKind: "building",
    evidenceClass: "observed",
    authority: 0.86,
    redistribution: "attribution",
    fields: {
      locality: baseFields.locality,
      street: baseFields.street,
      buildingName: baseFields.buildingName,
      buildingId: baseFields.buildingId,
      lat: baseFields.lat,
      lon: baseFields.lon,
    },
  },
  {
    sourceId: "pe-postal",
    countryCode: "PE",
    sourceKind: "postal",
    evidenceClass: "verified",
    authority: 0.94,
    redistribution: "open",
    fields: {
      admin1: baseFields.admin1,
      locality: baseFields.locality,
      postcode: baseFields.postcode,
      lat: baseFields.lat,
      lon: baseFields.lon,
    },
  },
];

const [entity] = fuseAddressEvidence(evidence, adapter);
const result = evaluateAddressConfidence(entity, evidence, adapter);
assert.deepEqual(
  result.stages.map((stage) => stage.id),
  [
    "administrative_hierarchy",
    "locality",
    "road",
    "building_position",
    "postal_zone",
  ],
);
assert.ok(result.confidence >= 0.8);
assert.ok(["verified", "deliverable"].includes(result.decision));
assert.equal(result.highestValidatedStage, "postal_zone");

const weakEvidence: AddressEvidenceRecord[] = [
  {
    sourceId: "pe-road-only",
    countryCode: "PE",
    sourceKind: "road",
    evidenceClass: "observed",
    authority: 0.7,
    redistribution: "attribution",
    fields: {
      street: "Avenida José Larco",
      buildingName: "Edificio Ejemplo",
      postcode: "15074",
      lat: -12.121,
      lon: -77.03,
    },
  },
];
const [weakEntity] = fuseAddressEvidence(weakEvidence, adapter);
const weak = evaluateAddressConfidence(weakEntity, weakEvidence, adapter);
assert.equal(weak.stages[0].status, "fail");
assert.equal(weak.stages[1].blockedBy, "administrative_hierarchy");
assert.ok(weak.confidence <= 0.35);
assert.equal(weak.decision, "rejected");

const invalidPostcodeEvidence = evidence.map((record) => ({
  ...record,
  fields: { ...record.fields, postcode: "NOT-A-POSTCODE" },
}));
const [invalidPostcodeEntity] = fuseAddressEvidence(
  invalidPostcodeEvidence,
  adapter,
);
const invalidPostcode = evaluateAddressConfidence(
  invalidPostcodeEntity,
  invalidPostcodeEvidence,
  adapter,
);
const postal = invalidPostcode.stages.find(
  (stage) => stage.id === "postal_zone",
);
assert.equal(postal?.status, "fail");
assert.ok(postal?.reasons.some((reason) => reason.includes("format rule")));

const botswana = getAddressFusionCountry("BW");
assert.ok(botswana);
const botswanaEvidence: AddressEvidenceRecord[] = [
  {
    sourceId: "bw-admin",
    countryCode: "BW",
    sourceKind: "administrative",
    evidenceClass: "verified",
    authority: 0.9,
    redistribution: "open",
    fields: {
      admin1: "South-East",
      admin2: "Gaborone",
      locality: "Gaborone",
      lat: -24.6282,
      lon: 25.9231,
    },
  },
];
const [botswanaEntity] = fuseAddressEvidence(botswanaEvidence, botswana);
const botswanaResult = evaluateAddressConfidence(
  botswanaEntity,
  botswanaEvidence,
  botswana,
);
assert.equal(
  botswanaResult.stages.find((stage) => stage.id === "postal_zone")?.status,
  "unavailable",
);

console.info("Sequential AGID confidence pipeline checks passed.");

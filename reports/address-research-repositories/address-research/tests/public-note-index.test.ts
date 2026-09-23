import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

import {
  buildPublicNoteIndex,
  detectUnsafeMaterial,
  verifyPublicNoteIndex,
} from "../scripts/build-public-note-index";

const root = resolve("reports/address-research-repositories/address-research");

test("public note index covers every research seed without importing AMT-owned notes", () => {
  const index = buildPublicNoteIndex(root);

  assert.deepEqual(
    index.documents.map((document) => document.id),
    [
      "address-research-preparation-map",
      "address-information-engineering-foundations",
      "address-information-engineering-foundations-porting",
      "address-information-science-systematization",
    ],
  );
  assert.equal(index.excludedSources.length, 3);
  assert.ok(index.excludedSources.every((source) => source.reason.includes("address-morphism-theory")));
  assert.ok(index.documents.every((document) => document.contentSha256.length === 64));
  assert.ok(index.documents.every((document) => document.publicationStatus === "review-before-publication"));
});

test("public note index is deterministic and metadata-only", () => {
  const verification = verifyPublicNoteIndex(root);
  const index = buildPublicNoteIndex(root);
  const indexPath = resolve(root, "catalog/public-note-index.json");
  const output = JSON.parse(readFileSync(indexPath, "utf8"));

  assert.equal(verification.ok, true, verification.reason);
  assert.deepEqual(output, index);
  assert.deepEqual(index.safety, {
    contentCopied: false,
    rawPrivateAddressMaterial: false,
    recipientIdentityMaterial: false,
    secretMaterial: false,
  });
});

test("public note safety scanner blocks credential and raw-address patterns", () => {
  assert.deepEqual(detectUnsafeMaterial("safe research note"), []);
  assert.deepEqual(detectUnsafeMaterial("-----BEGIN PRIVATE KEY-----"), ["private-key"]);
  assert.deepEqual(detectUnsafeMaterial("sk_live_exampleToken"), ["live-secret-key"]);
  assert.deepEqual(detectUnsafeMaterial("UPS_PASSWORD=example"), ["production-credential"]);
  assert.deepEqual(detectUnsafeMaterial("123 Main Street"), ["raw-address-example"]);
});

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

import {
  validateDomainRegistry,
  verifyDomainRepositoryStarters,
} from "../scripts/scaffold-address-information-engineering-repositories";

const root = resolve("reports/address-research-repositories");
const registry = JSON.parse(
  readFileSync(resolve(root, "address-information-engineering-domains.json"), "utf8"),
);

test("sixteen address-information-engineering domains form four groups of four", () => {
  assert.deepEqual(validateDomainRegistry(registry), []);
  assert.equal(registry.domains.length, 16);
  assert.equal(registry.groups.length, 4);

  for (const group of registry.groups) {
    assert.equal(
      registry.domains.filter((domain: { group: string }) => domain.group === group.id).length,
      4,
      `${group.id} must have four domains`,
    );
  }
});

test("the six initial research-spine domains are explicit and reusable", () => {
  assert.deepEqual(registry.coreDomainIds, [
    "address-ontology",
    "address-morphism-theory",
    "address-formal-languages",
    "address-spatial-information",
    "address-data-systems",
    "address-security-privacy",
  ]);
});

test("every new domain has a complete local repository starter with safety boundaries", () => {
  const verification = verifyDomainRepositoryStarters(root);
  const newDomains = registry.domains.filter((domain: { starter: string }) => domain.starter === "local-template");

  assert.equal(verification.ok, true, verification.errors.join("\n"));
  assert.equal(newDomains.length, 15);
  assert.equal(verification.generatedFileCount, 76);
  assert.match(
    readFileSync(resolve(root, "domains", "README.md"), "utf8"),
    /Address Morphism Theory/,
  );

  for (const domain of newDomains) {
    const profileRoot = resolve(root, "domains", domain.id);
    const manifest = JSON.parse(readFileSync(resolve(profileRoot, "manifest.json"), "utf8"));
    assert.ok(existsSync(resolve(profileRoot, "README.md")));
    assert.equal(manifest.remoteCreated, false);
    assert.equal(manifest.status, "local-template");
    assert.ok(manifest.privacyBoundary.prohibitedMaterial.includes("raw_private_address"));
    assert.ok(manifest.privacyBoundary.prohibitedMaterial.includes("production_credential"));
    assert.match(manifest.nonClaim, /does not|is not evidence/i);
  }
});

test("address-morphism-theory is reused rather than duplicated", () => {
  const morphism = registry.domains.find((domain: { id: string }) => domain.id === "address-morphism-theory");
  assert.equal(morphism.starter, "existing-template");
  assert.ok(existsSync(resolve(morphism.existingProfilePath, "manifest.json")));
  assert.equal(existsSync(resolve(root, "domains", "address-morphism-theory")), false);
});

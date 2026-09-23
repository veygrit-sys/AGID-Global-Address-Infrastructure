import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

const root = path.resolve("reports/address-research-repositories");
const familyPlanPath = path.join(root, "repository-family-plan.json");
const familyPlan = JSON.parse(fs.readFileSync(familyPlanPath, "utf8"));

type FamilyRepository = {
  name: string;
  stage: string;
  remoteAction: string;
  seedPath?: string;
  seedAvailability?: "external-local" | "workspace";
  profilePath?: string;
  owns?: string[];
  doesNotOwn?: string[];
  requiredPromotionGates?: string[];
};

const requiredTemplateFiles = [
  "README.md",
  "manifest.json",
  "sources.json",
  "quality-gates.json",
  "DATA_LICENSES.md",
];

const prohibitedExampleFragments = [
  "123 Main",
  "John Doe",
  "Jane Doe",
  "sk_live",
  "UPS_PASSWORD",
  "DHL_PASSWORD",
  "BEGIN PRIVATE KEY",
];

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listTemplateFiles(repository: FamilyRepository) {
  assert.ok(repository.profilePath, `${repository.name} must define profilePath`);
  const profilePath = path.resolve(repository.profilePath);
  return requiredTemplateFiles.map((fileName) => path.join(profilePath, fileName));
}

test("family plan is local-only and points at staged creation policy", () => {
  assert.equal(familyPlan.remoteActions, "none");
  assert.ok(
    familyPlan.policyRefs.includes("docs/repository-split-staged-creation-policy.md"),
  );
  assert.ok(familyPlan.policyRefs.includes("src/address/repositoryCreationPreflight.ts"));
  for (const repository of familyPlan.repositories as FamilyRepository[]) {
    assert.equal(repository.remoteAction, "none", `${repository.name} cannot request remote action`);
  }
});

test("template-ready repositories have publication files and existing seeds", () => {
  const templateRepositories = (familyPlan.repositories as FamilyRepository[]).filter(
    (repository) => repository.stage === "template-ready-local",
  );
  assert.deepEqual(
    templateRepositories.map((repository) => repository.name),
    ["address-morphism-theory", "address-research"],
  );

  for (const repository of templateRepositories) {
    assert.ok(repository.seedPath, `${repository.name} must define a seedPath`);
    if (repository.seedAvailability !== "external-local") {
      assert.ok(fs.existsSync(path.resolve(repository.seedPath)), `${repository.seedPath} must exist`);
    }

    for (const filePath of listTemplateFiles(repository)) {
      assert.ok(fs.existsSync(filePath), `${repository.name} missing ${path.basename(filePath)}`);
    }
  }
});

test("manifests preserve repository boundaries and private-material exclusions", () => {
  const templateRepositories = (familyPlan.repositories as FamilyRepository[]).filter(
    (repository) => repository.stage === "template-ready-local",
  );

  for (const repository of templateRepositories) {
    const manifest = readJson(path.resolve(repository.profilePath!, "manifest.json"));
    assert.equal(manifest.repository, repository.name);
    assert.equal(manifest.status, "local-template");
    assert.equal(manifest.remoteCreated, false);
    assert.match(manifest.ownerPolicy, /preflight/i);
    assert.ok(manifest.privacyBoundary.prohibitedMaterial.includes("raw_private_address"));
    assert.ok(manifest.privacyBoundary.prohibitedMaterial.includes("production_credential"));
    assert.ok(
      manifest.doesNotOwn.some((entry: string) => /runtime|carrier|country|postal|operational/i.test(entry)),
      `${repository.name} should keep product/data ownership out`,
    );
  }
});

test("AMT publication profile declares PDF verification dependency", () => {
  const manifest = readJson(
    path.resolve("reports/address-research-repositories/address-morphism-theory/manifest.json"),
  );
  assert.equal(manifest.repository, "address-morphism-theory");
  assert.equal(manifest.seedAvailability, "external-local");
  assert.ok(manifest.pythonRequirementsPath);

  const requirementsText = fs.readFileSync(path.resolve(manifest.pythonRequirementsPath), "utf8");
  assert.match(requirementsText, /PyMuPDF/i);

  const qualityGates = readJson(
    path.resolve("reports/address-research-repositories/address-morphism-theory/quality-gates.json"),
  );
  assert.ok(
    qualityGates.gates.some(
      (gate: { id: string }) => gate.id === "seed_repository_python_dependencies_declared",
    ),
  );
});

test("planned repositories remain logical until common promotion gates are satisfied", () => {
  const plannedRepositories = (familyPlan.repositories as FamilyRepository[]).filter(
    (repository) => repository.stage === "logical-planned",
  );
  assert.equal(plannedRepositories.length, 3);

  for (const repository of plannedRepositories) {
    assert.equal(repository.remoteAction, "none");
    assert.equal(repository.profilePath, undefined);
    assert.equal(repository.seedPath, undefined);
  }
});

test("new repository profiles do not include secret-like or raw-address example literals", () => {
  const profileFiles = (familyPlan.repositories as FamilyRepository[])
    .filter((repository) => repository.stage === "template-ready-local")
    .flatMap((repository) => listTemplateFiles(repository));

  for (const filePath of profileFiles.concat(familyPlanPath)) {
    const text = fs.readFileSync(filePath, "utf8");
    for (const fragment of prohibitedExampleFragments) {
      assert.equal(
        text.includes(fragment),
        false,
        `${path.relative(root, filePath)} includes prohibited example fragment ${fragment}`,
      );
    }
  }
});

test("address-research profile declares a reproducible public-note index gate", () => {
  const profileRoot = path.resolve("reports/address-research-repositories/address-research");
  const manifest = readJson(path.join(profileRoot, "manifest.json"));
  const qualityGates = readJson(path.join(profileRoot, "quality-gates.json"));

  assert.match(manifest.verification.publicNoteIndex, /build-public-note-index/);
  assert.ok(
    qualityGates.gates.some(
      (gate: { id: string }) => gate.id === "public_note_index_reproducible",
    ),
  );
  assert.ok(fs.existsSync(path.join(profileRoot, "note-classification.json")));
  assert.ok(fs.existsSync(path.join(profileRoot, "catalog", "public-note-index.json")));
});

test("family plan records the 16-domain local repository topology", () => {
  const domainFamily = familyPlan.addressInformationEngineeringDomainFamily;

  assert.equal(domainFamily.stage, "template-ready-local");
  assert.equal(domainFamily.remoteAction, "none");
  assert.equal(domainFamily.domainCount, 16);
  assert.equal(domainFamily.groups, 4);
  assert.ok(domainFamily.existingProfileReuse.includes("address-morphism-theory"));
  assert.match(domainFamily.verification, /scaffold-address-information-engineering-repositories/);
  assert.ok(fs.existsSync(path.resolve(domainFamily.registryPath)));
});

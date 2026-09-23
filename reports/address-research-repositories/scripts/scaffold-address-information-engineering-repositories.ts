import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const familyRoot = resolve("reports/address-research-repositories");
const registryPath = resolve(familyRoot, "address-information-engineering-domains.json");
const sharedExclusions = [
  "raw private address material",
  "recipient identity material",
  "witness files or proof secrets",
  "private keys or production credentials",
  "raw carrier API payloads",
  "AGID production runtime ownership",
];
const generatedFiles = [
  "README.md",
  "manifest.json",
  "sources.json",
  "quality-gates.json",
  "DATA_LICENSES.md",
];

type Domain = {
  id: string;
  number: number;
  group: string;
  name: string;
  japaneseName: string;
  specialization: string;
  owns: string[];
  nonClaim: string;
  starter: "local-template" | "existing-template";
  existingProfilePath?: string;
};

type DomainRegistry = {
  schemaVersion: string;
  remoteActions: "none";
  definition: string;
  repositoryRoot: string;
  taxonomyPath: string;
  groups: Array<{ id: string; name: string; japaneseName: string }>;
  coreDomainIds: string[];
  domains: Domain[];
};

function readRegistry(root = familyRoot) {
  return JSON.parse(readFileSync(resolve(root, "address-information-engineering-domains.json"), "utf8")) as DomainRegistry;
}

export function validateDomainRegistry(registry: DomainRegistry) {
  const errors: string[] = [];
  if (registry.schemaVersion !== "address-information-engineering-domains-v0.1") {
    errors.push("unsupported-domain-registry-schema");
  }
  if (registry.remoteActions !== "none") errors.push("remote-actions-must-be-none");
  if (registry.groups.length !== 4) errors.push("expected-four-groups");
  if (registry.domains.length !== 16) errors.push("expected-sixteen-domains");
  if (registry.coreDomainIds.length !== 6) errors.push("expected-six-core-domains");

  const ids = new Set<string>();
  const numbers = new Set<number>();
  const groupCounts = new Map<string, number>();
  for (const domain of registry.domains) {
    if (ids.has(domain.id)) errors.push(`duplicate-domain:${domain.id}`);
    ids.add(domain.id);
    if (numbers.has(domain.number)) errors.push(`duplicate-domain-number:${domain.number}`);
    numbers.add(domain.number);
    groupCounts.set(domain.group, (groupCounts.get(domain.group) ?? 0) + 1);
    if (domain.owns.length === 0) errors.push(`missing-owned-scope:${domain.id}`);
    if (!domain.nonClaim) errors.push(`missing-non-claim:${domain.id}`);
  }

  for (const group of registry.groups) {
    if ((groupCounts.get(group.id) ?? 0) !== 4) errors.push(`group-must-have-four-domains:${group.id}`);
  }
  for (const id of registry.coreDomainIds) {
    if (!ids.has(id)) errors.push(`missing-core-domain:${id}`);
  }

  const morphism = registry.domains.find((domain) => domain.id === "address-morphism-theory");
  if (!morphism || morphism.starter !== "existing-template" || !morphism.existingProfilePath) {
    errors.push("address-morphism-theory-must-reuse-existing-template");
  }
  return errors;
}

function repositoryPath(registry: DomainRegistry, domain: Domain) {
  return resolve(registry.repositoryRoot, domain.id);
}

function renderReadme(registry: DomainRegistry, domain: Domain) {
  const group = registry.groups.find((candidate) => candidate.id === domain.group)!;
  return [
    `# ${domain.id}`,
    "",
    `Local repository starter for ${domain.name} (${domain.japaneseName}).`,
    "",
    "## Scope",
    "",
    domain.specialization,
    "",
    "## Owns",
    "",
    ...domain.owns.map((entry) => `- ${entry}`),
    "",
    "## Boundary",
    "",
    domain.nonClaim,
    "",
    `This is domain ${domain.number} in the ${group.name} group. It is local-only and does not create a remote repository.`,
    "",
    "## Promotion",
    "",
    "Before any remote creation, add reviewed public research material, name a maintainer or review owner, complete source and license review, and run the repository creation preflight.",
    "",
    "## Verification",
    "",
    "```powershell",
    "npx tsx reports/address-research-repositories/scripts/scaffold-address-information-engineering-repositories.ts --check",
    "```",
    "",
  ].join("\n");
}

function renderManifest(registry: DomainRegistry, domain: Domain) {
  return `${JSON.stringify({
    repository: domain.id,
    status: "local-template",
    remoteCreated: false,
    domainNumber: domain.number,
    domainName: domain.name,
    japaneseDomainName: domain.japaneseName,
    group: domain.group,
    specialization: domain.specialization,
    reviewOwner: "AGID address research maintainers",
    maintainerStatus: "review-owner-pending",
    owns: domain.owns,
    doesNotOwn: sharedExclusions,
    nonClaim: domain.nonClaim,
    privacyBoundary: {
      allowed: [
        "public research notes",
        "synthetic fixtures",
        "source metadata",
        "redacted methodology",
      ],
      prohibitedMaterial: [
        "raw_private_address",
        "recipient_identity",
        "witness_file",
        "private_key",
        "proof_secret",
        "production_credential",
        "raw_carrier_payload",
      ],
    },
    verification: {
      scaffold: "npx tsx reports/address-research-repositories/scripts/scaffold-address-information-engineering-repositories.ts --check",
      familyTest: "npx tsx --test reports/address-research-repositories/tests/address-information-engineering-domains.test.ts",
    },
  }, null, 2)}\n`;
}

function renderSources(registry: DomainRegistry, domain: Domain) {
  return `${JSON.stringify({
    repository: domain.id,
    sources: [
      {
        path: registry.taxonomyPath,
        role: "domain scope and boundary definition",
        movePolicy: "retain as public taxonomy metadata",
      },
      {
        path: "docs/research",
        role: "reviewable research seed",
        movePolicy: "classify, redact, and review before any publication",
      },
    ],
    dataPolicy: "metadata-only until source licenses and provenance have been reviewed",
  }, null, 2)}\n`;
}

function renderQualityGates(domain: Domain) {
  return `${JSON.stringify({
    repository: domain.id,
    gates: [
      {
        id: "domain-family-template-verified",
        required: true,
        command: "npx tsx reports/address-research-repositories/scripts/scaffold-address-information-engineering-repositories.ts --check",
      },
      {
        id: "claim-and-non-claim-review",
        required: true,
        check: "Every public research artifact declares its claim status and preserves the domain non-claim.",
      },
      {
        id: "publication-safety",
        required: true,
        check: "No raw private address, recipient, witness, proof secret, private key, production credential, or raw carrier payload material.",
      },
      {
        id: "source-license-review",
        required: true,
        check: "Each external source has provenance, license, freshness, and permitted-use metadata before publication.",
      },
      {
        id: "remote-creation-preflight",
        required: true,
        check: "Run src/address/repositoryCreationPreflight.ts and obtain an explicit remote-creation request before any GitHub action.",
      },
    ],
  }, null, 2)}\n`;
}

function renderDataLicenses(domain: Domain) {
  return [
    `# ${domain.id} Data and License Boundary`,
    "",
    "This starter distributes no external dataset and no personal address material.",
    "",
    "Future source entries must record origin, license, permitted reuse, freshness, and whether the material is metadata-only. Do not copy proprietary datasets, carrier payloads, or private operational data into this repository.",
    "",
  ].join("\n");
}

function renderDomainIndex(registry: DomainRegistry) {
  const lines = [
    "# Address Information Engineering Domains",
    "",
    "This directory contains 15 generated local repository starters. Address Morphism Theory is the sixteenth domain and reuses its existing publication profile outside this directory.",
    "",
  ];

  for (const group of registry.groups) {
    lines.push(`## ${group.name} (${group.japaneseName})`, "");
    lines.push("| # | Domain | Local profile |", "| --- | --- | --- |");
    for (const domain of registry.domains.filter((candidate) => candidate.group === group.id)) {
      const profile = domain.starter === "existing-template"
        ? "[existing profile](../address-morphism-theory/README.md)"
        : `[starter](./${domain.id}/README.md)`;
      lines.push(`| ${domain.number} | ${domain.name} (${domain.japaneseName}) | ${profile} |`);
    }
    lines.push("");
  }

  lines.push(
    "All profiles are local-only. Before any remote creation, satisfy the documented source, license, maintainer, privacy, and repository-creation-preflight gates.",
    "",
  );
  return lines.join("\n");
}

export function expectedRepositoryFiles(registry: DomainRegistry, domain: Domain) {
  return {
    "README.md": renderReadme(registry, domain),
    "manifest.json": renderManifest(registry, domain),
    "sources.json": renderSources(registry, domain),
    "quality-gates.json": renderQualityGates(domain),
    "DATA_LICENSES.md": renderDataLicenses(domain),
  };
}

export function writeDomainRepositoryStarters(root = familyRoot) {
  const registry = readRegistry(root);
  const errors = validateDomainRegistry(registry);
  if (errors.length > 0) throw new Error(errors.join("\n"));

  const written: string[] = [];
  const domainIndexPath = resolve(registry.repositoryRoot, "README.md");
  mkdirSync(dirname(domainIndexPath), { recursive: true });
  writeFileSync(domainIndexPath, renderDomainIndex(registry), "utf8");
  written.push(relative(process.cwd(), domainIndexPath).replace(/\\/g, "/"));
  for (const domain of registry.domains.filter((candidate) => candidate.starter === "local-template")) {
    const outputRoot = repositoryPath(registry, domain);
    mkdirSync(outputRoot, { recursive: true });
    for (const [fileName, contents] of Object.entries(expectedRepositoryFiles(registry, domain))) {
      const outputPath = resolve(outputRoot, fileName);
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, contents, "utf8");
      written.push(relative(process.cwd(), outputPath).replace(/\\/g, "/"));
    }
  }
  return written.sort();
}

export function verifyDomainRepositoryStarters(root = familyRoot) {
  const registry = readRegistry(root);
  const errors = validateDomainRegistry(registry);
  const expectedFiles = [
    {
      path: resolve(registry.repositoryRoot, "README.md"),
      contents: renderDomainIndex(registry),
    },
    ...registry.domains
    .filter((domain) => domain.starter === "local-template")
    .flatMap((domain) => {
      const outputRoot = repositoryPath(registry, domain);
      return Object.entries(expectedRepositoryFiles(registry, domain)).map(([fileName, contents]) => ({
        path: resolve(outputRoot, fileName),
        contents,
      }));
    }),
  ];

  for (const expected of expectedFiles) {
    if (!existsSync(expected.path)) {
      errors.push(`missing-generated-file:${relative(process.cwd(), expected.path)}`);
      continue;
    }
    if (readFileSync(expected.path, "utf8") !== expected.contents) {
      errors.push(`out-of-date-generated-file:${relative(process.cwd(), expected.path)}`);
    }
  }

  const existingMorphism = registry.domains.find((domain) => domain.id === "address-morphism-theory");
  if (existingMorphism?.existingProfilePath && !existsSync(resolve(existingMorphism.existingProfilePath, "manifest.json"))) {
    errors.push("missing-existing-address-morphism-theory-profile");
  }

  return { ok: errors.length === 0, errors, generatedFileCount: expectedFiles.length };
}

function main() {
  const shouldWrite = process.argv.includes("--write");
  if (shouldWrite) writeDomainRepositoryStarters();

  const result = verifyDomainRepositoryStarters();
  console.log(JSON.stringify({
    status: result.ok ? "pass" : "fail",
    mode: shouldWrite ? "write" : "check",
    generatedFileCount: result.generatedFileCount,
    errors: result.errors,
  }, null, 2));
  if (!result.ok) process.exitCode = 1;
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main();
}

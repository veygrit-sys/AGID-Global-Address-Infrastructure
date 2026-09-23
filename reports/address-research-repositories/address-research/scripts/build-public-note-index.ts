import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const templateRoot = resolve("reports/address-research-repositories/address-research");
const outputPath = resolve(templateRoot, "catalog/public-note-index.json");
const allowedClaimLabels = new Set([
  "verified",
  "hypothesis",
  "non_claim",
  "source_catalog_metadata",
  "needs_review",
]);

type NoteDisposition = "include" | "exclude";

type ClassifiedNote = {
  id: string;
  sourcePath: string;
  disposition: NoteDisposition;
  claimLabel?: string;
  scope?: string;
  publicationStatus?: string;
  reason?: string;
};

type NoteClassification = {
  schemaVersion: string;
  sourceRoot: string;
  claimLabels: string[];
  notes: ClassifiedNote[];
};

export type PublicNoteIndex = {
  schemaVersion: "address-research-public-note-index-v0.1";
  sourceRoot: string;
  documents: Array<{
    id: string;
    sourcePath: string;
    title: string;
    claimLabel: string;
    scope: string;
    publicationStatus: string;
    contentSha256: string;
  }>;
  excludedSources: Array<{
    id: string;
    sourcePath: string;
    reason: string;
  }>;
  safety: {
    contentCopied: false;
    rawPrivateAddressMaterial: false;
    recipientIdentityMaterial: false;
    secretMaterial: false;
  };
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function firstHeading(markdown: string, sourcePath: string) {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (!heading) throw new Error(`missing top-level heading: ${sourcePath}`);
  return heading;
}

export function detectUnsafeMaterial(markdown: string) {
  const checks: Array<[string, RegExp]> = [
    ["private-key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/i],
    ["live-secret-key", /\bsk_live_[A-Za-z0-9_]+/],
    ["production-credential", /\b(?:UPS|DHL)_(?:API_)?(?:KEY|TOKEN|PASSWORD)\s*[=:]\s*\S+/i],
    ["raw-address-example", /\b(?:\d{1,5}\s+[A-Z][a-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd))\b/],
  ];

  return checks.filter(([, pattern]) => pattern.test(markdown)).map(([id]) => id);
}

function readClassification(root = templateRoot) {
  const path = resolve(root, "note-classification.json");
  return JSON.parse(readFileSync(path, "utf8")) as NoteClassification;
}

function sourceFiles(sourceRoot: string) {
  return readdirSync(sourceRoot)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => relative(process.cwd(), resolve(sourceRoot, fileName)).replace(/\\/g, "/"))
    .sort();
}

function validateClassification(classification: NoteClassification) {
  const errors: string[] = [];
  if (classification.schemaVersion !== "address-research-note-classification-v0.1") {
    errors.push("unsupported-classification-schema");
  }
  if (!Array.isArray(classification.notes) || classification.notes.length === 0) {
    errors.push("missing-note-classifications");
    return errors;
  }

  const ids = new Set<string>();
  const paths = new Set<string>();
  for (const note of classification.notes) {
    if (ids.has(note.id)) errors.push(`duplicate-note-id:${note.id}`);
    ids.add(note.id);
    if (paths.has(note.sourcePath)) errors.push(`duplicate-source-path:${note.sourcePath}`);
    paths.add(note.sourcePath);
    if (!existsSync(resolve(note.sourcePath))) errors.push(`missing-source:${note.sourcePath}`);

    if (note.disposition === "include") {
      if (!note.claimLabel || !allowedClaimLabels.has(note.claimLabel)) {
        errors.push(`invalid-claim-label:${note.id}`);
      }
      if (!note.scope || !note.publicationStatus) errors.push(`missing-publication-metadata:${note.id}`);
    } else if (note.disposition === "exclude") {
      if (!note.reason) errors.push(`missing-exclusion-reason:${note.id}`);
    } else {
      errors.push(`invalid-disposition:${note.id}`);
    }
  }

  const actualSourceFiles = sourceFiles(resolve(classification.sourceRoot));
  for (const sourcePath of actualSourceFiles) {
    if (!paths.has(sourcePath)) errors.push(`unclassified-source:${sourcePath}`);
  }
  for (const sourcePath of paths) {
    if (!actualSourceFiles.includes(sourcePath)) errors.push(`classification-outside-source-root:${sourcePath}`);
  }
  return errors;
}

export function buildPublicNoteIndex(root = templateRoot): PublicNoteIndex {
  const classification = readClassification(root);
  const errors = validateClassification(classification);
  if (errors.length > 0) throw new Error(errors.join("\n"));

  const includedNotes = classification.notes.filter((note) => note.disposition === "include");
  const documents = includedNotes.map((note) => {
    const contents = readFileSync(resolve(note.sourcePath), "utf8");
    const unsafeMaterial = detectUnsafeMaterial(contents);
    if (unsafeMaterial.length > 0) {
      throw new Error(`unsafe-source:${note.sourcePath}:${unsafeMaterial.join(",")}`);
    }

    return {
      id: note.id,
      sourcePath: note.sourcePath,
      title: firstHeading(contents, note.sourcePath),
      claimLabel: note.claimLabel!,
      scope: note.scope!,
      publicationStatus: note.publicationStatus!,
      contentSha256: sha256(contents),
    };
  });

  return {
    schemaVersion: "address-research-public-note-index-v0.1",
    sourceRoot: classification.sourceRoot,
    documents,
    excludedSources: classification.notes
      .filter((note) => note.disposition === "exclude")
      .map((note) => ({ id: note.id, sourcePath: note.sourcePath, reason: note.reason! })),
    safety: {
      contentCopied: false,
      rawPrivateAddressMaterial: false,
      recipientIdentityMaterial: false,
      secretMaterial: false,
    },
  };
}

export function verifyPublicNoteIndex(root = templateRoot) {
  const generated = `${JSON.stringify(buildPublicNoteIndex(root), null, 2)}\n`;
  const existingOutputPath = resolve(root, "catalog/public-note-index.json");
  if (!existsSync(existingOutputPath)) return { ok: false, reason: "missing-index" };
  return {
    ok: readFileSync(existingOutputPath, "utf8") === generated,
    reason: "index-out-of-date",
  };
}

function main() {
  const shouldWrite = process.argv.includes("--write");
  const shouldCheck = process.argv.includes("--check") || !shouldWrite;
  const generated = `${JSON.stringify(buildPublicNoteIndex(), null, 2)}\n`;

  if (shouldWrite) {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, generated, "utf8");
  }

  if (shouldCheck) {
    const verification = verifyPublicNoteIndex();
    if (!verification.ok) {
      throw new Error(verification.reason);
    }
  }

  console.log(JSON.stringify({
    status: "pass",
    mode: shouldWrite ? "write" : "check",
    outputPath: relative(process.cwd(), outputPath).replace(/\\/g, "/"),
  }));
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main();
}

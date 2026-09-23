import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  buildAddressMorphismChapterInventory,
  type AddressMorphismChapterInventory,
} from './addressMorphismChapterInventory';

export const ADDRESS_MORPHISM_UNIFICATION_PLAN_VERSION = 'address-morphism-unification-plan-v0.1';

export type AddressMorphismUnificationStatus =
  | 'ready-to-unify'
  | 'needs-legacy-and-verification'
  | 'missing-canonical';

export type AddressMorphismUnifiedChapter = {
  chapter: number;
  canonicalFile?: string;
  legacyJapaneseV1Covered: boolean;
  verificationCovered: boolean;
  shortReviewCovered: boolean;
  status: AddressMorphismUnificationStatus;
  nextAction: string;
};

export type AddressMorphismUnificationPlan = {
  version: typeof ADDRESS_MORPHISM_UNIFICATION_PLAN_VERSION;
  target: {
    canonicalRoot: string;
    canonicalChapterCount: number;
    frontmatterFile: string;
    appendixCount: number;
    appendixRoot: string;
  };
  readiness: {
    readyToUnify: number;
    needsLegacyAndVerification: number;
    missingCanonical: number;
  };
  chapters: AddressMorphismUnifiedChapter[];
  sourcePolicy: {
    canonicalCurrent: string;
    legacyReferences: string[];
    generatedOrDerivedReferences: string[];
    doNotMergeBlindly: string[];
  };
  migrationSteps: string[];
};

function safeFiles(root: string) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => entry.name)
    .sort();
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function chapterFromCanonicalFile(file: string) {
  const match = file.match(/^(\d{2})-/);
  if (!match) return undefined;
  const chapter = Number.parseInt(match[1], 10);
  return chapter === 0 ? undefined : chapter;
}

function canonicalFilesByChapter(inventory: AddressMorphismChapterInventory) {
  const current = inventory.sets.find(set => set.id === 'current-paper-split');
  const result = new Map<number, string>();
  for (const file of current?.files ?? []) {
    const chapter = chapterFromCanonicalFile(file);
    if (chapter !== undefined) result.set(chapter, file);
  }
  return result;
}

function chapterStatus(
  chapter: number,
  hasCanonical: boolean,
  legacyJapaneseV1Covered: boolean,
  verificationCovered: boolean,
): AddressMorphismUnificationStatus {
  if (!hasCanonical) return 'missing-canonical';
  if (!legacyJapaneseV1Covered || !verificationCovered) return 'needs-legacy-and-verification';
  return 'ready-to-unify';
}

function nextActionFor(status: AddressMorphismUnificationStatus, chapter: number) {
  if (status === 'ready-to-unify') {
    return 'Use canonical split chapter as source of truth; retain legacy and verification files as references until final consolidation.';
  }
  if (status === 'needs-legacy-and-verification') {
    return `Create Japanese v1 coverage and chapter verification note for chapter ${chapter} before declaring full unification.`;
  }
  return `Create canonical split chapter ${chapter} before any unification step.`;
}

export function buildAddressMorphismUnificationPlan(
  workspaceRoot = process.cwd(),
): AddressMorphismUnificationPlan {
  const inventory = buildAddressMorphismChapterInventory(workspaceRoot);
  const canonicalFiles = canonicalFilesByChapter(inventory);
  const appendixRoot = join(workspaceRoot, 'reports/address-morphism-theory-review/appendices');
  const appendixCount = safeFiles(appendixRoot).filter(file => /^[A-H]-.*\.md$/.test(file)).length;
  const chapters = range(1, inventory.canonicalChapterCount).map((chapter): AddressMorphismUnifiedChapter => {
    const legacyJapaneseV1Covered = chapter <= inventory.summary.legacyJapaneseV1Chapters;
    const verificationCovered = chapter <= inventory.summary.chapterVerificationNotes;
    const shortReviewCovered = chapter <= inventory.summary.shortReviewChapters;
    const canonicalFile = canonicalFiles.get(chapter);
    const status = chapterStatus(chapter, canonicalFile !== undefined, legacyJapaneseV1Covered, verificationCovered);
    return {
      chapter,
      canonicalFile,
      legacyJapaneseV1Covered,
      verificationCovered,
      shortReviewCovered,
      status,
      nextAction: nextActionFor(status, chapter),
    };
  });

  return {
    version: ADDRESS_MORPHISM_UNIFICATION_PLAN_VERSION,
    target: {
      canonicalRoot: inventory.canonicalRoot,
      canonicalChapterCount: inventory.canonicalChapterCount,
      frontmatterFile: '00-frontmatter.md',
      appendixCount,
      appendixRoot,
    },
    readiness: {
      readyToUnify: chapters.filter(chapter => chapter.status === 'ready-to-unify').length,
      needsLegacyAndVerification: chapters.filter(chapter => chapter.status === 'needs-legacy-and-verification').length,
      missingCanonical: chapters.filter(chapter => chapter.status === 'missing-canonical').length,
    },
    chapters,
    sourcePolicy: {
      canonicalCurrent: 'reports/address-morphism-theory-review/paper/00-29 markdown split',
      legacyReferences: [
        'docs/address-morphism-theory-ja-v1-master.md',
        'docs/address-morphism-theory-ja-v1-chapters-1-6.md',
        'docs/address-morphism-theory-ja-v1-chapters-7-12.md',
        'docs/address-morphism-theory-ja-v1-chapters-13-18.md',
        'docs/address-morphism-theory-ja-v1-chapters-19-26.md',
      ],
      generatedOrDerivedReferences: [
        'reports/address-morphism-theory-review/papers',
        'reports/address-morphism-theory-review/notes',
        'output/pdf',
      ],
      doNotMergeBlindly: [
        'verification reports',
        'PDF outputs',
        'ZK predicate papers',
        'protocol expansion papers',
      ],
    },
    migrationSteps: [
      'Freeze reports/address-morphism-theory-review/paper as the canonical 29-chapter source.',
      'Add Japanese v1 and verification coverage for chapters 27-29.',
      'Create a per-chapter quality manifest for math model, test, diagram, verification, and non-claim status.',
      'Move derived papers and notes behind explicit generated/reference labels.',
      'Only then assemble a unified README/SUMMARY without deleting legacy references.',
    ],
  };
}

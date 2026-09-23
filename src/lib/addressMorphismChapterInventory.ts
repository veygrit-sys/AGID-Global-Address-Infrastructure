import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const ADDRESS_MORPHISM_CHAPTER_INVENTORY_VERSION = 'address-morphism-chapter-inventory-v0.1';

export type AddressMorphismChapterSet = {
  id: string;
  label: string;
  root: string;
  fileCount: number;
  chapterCount: number;
  frontmatterCount: number;
  minChapter?: number;
  maxChapter?: number;
  files: string[];
  role: 'canonical-current' | 'legacy-master' | 'short-review' | 'verification';
};

export type AddressMorphismChapterInventory = {
  version: typeof ADDRESS_MORPHISM_CHAPTER_INVENTORY_VERSION;
  canonicalChapterCount: number;
  canonicalRoot: string;
  sets: AddressMorphismChapterSet[];
  summary: {
    currentPaperChapters: number;
    legacyJapaneseV1Chapters: number;
    shortReviewChapters: number;
    chapterVerificationNotes: number;
  };
};

function safeFiles(root: string) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => entry.name)
    .sort();
}

function chapterNumberFromName(name: string) {
  const match = name.match(/^(\d{2})-/);
  return match ? Number.parseInt(match[1], 10) : undefined;
}

function numberedMarkdownSet(
  id: string,
  label: string,
  root: string,
  role: AddressMorphismChapterSet['role'],
  options: { excludeFrontmatter?: boolean } = {},
): AddressMorphismChapterSet {
  const files = safeFiles(root).filter(name => /^\d{2}-.+\.md$/.test(name));
  const frontmatterCount = files.filter(name => name.startsWith('00-')).length;
  const chapterNumbers = files
    .map(chapterNumberFromName)
    .filter((value): value is number => value !== undefined)
    .filter(value => !(options.excludeFrontmatter && value === 0));

  return {
    id,
    label,
    root,
    fileCount: files.length,
    chapterCount: chapterNumbers.length,
    frontmatterCount,
    minChapter: chapterNumbers[0],
    maxChapter: chapterNumbers.at(-1),
    files,
    role,
  };
}

function legacyJapaneseV1Set(root: string): AddressMorphismChapterSet {
  const files = safeFiles(root).filter(name => /^address-morphism-theory-ja-v1-chapters-\d+-\d+\.md$/.test(name));
  const chapters = new Set<number>();
  for (const file of files) {
    const match = file.match(/chapters-(\d+)-(\d+)\.md$/);
    if (!match) continue;
    const start = Number.parseInt(match[1], 10);
    const end = Number.parseInt(match[2], 10);
    for (let chapter = start; chapter <= end; chapter += 1) chapters.add(chapter);
  }
  const chapterList = [...chapters].sort((a, b) => a - b);
  return {
    id: 'ja-v1-master-bundles',
    label: 'Japanese v1 master chapter bundles',
    root,
    fileCount: files.length,
    chapterCount: chapterList.length,
    frontmatterCount: safeFiles(root).includes('address-morphism-theory-ja-v1-master-frontmatter.md') ? 1 : 0,
    minChapter: chapterList[0],
    maxChapter: chapterList.at(-1),
    files,
    role: 'legacy-master',
  };
}

function chapterVerificationSet(root: string): AddressMorphismChapterSet {
  const files = safeFiles(root).filter(name => /^address-morphism-theory-ja-v1-chapter-\d{2}-verification\.md$/.test(name));
  const chapterNumbers = files
    .map(name => Number.parseInt(name.match(/chapter-(\d{2})-/)?.[1] ?? '0', 10))
    .sort((a, b) => a - b);
  return {
    id: 'ja-v1-chapter-verification',
    label: 'Japanese v1 chapter verification notes',
    root,
    fileCount: files.length,
    chapterCount: chapterNumbers.length,
    frontmatterCount: 0,
    minChapter: chapterNumbers[0],
    maxChapter: chapterNumbers.at(-1),
    files,
    role: 'verification',
  };
}

export function buildAddressMorphismChapterInventory(workspaceRoot = process.cwd()): AddressMorphismChapterInventory {
  const currentPaper = numberedMarkdownSet(
    'current-paper-split',
    'Current split Address Morphism Theory paper',
    join(workspaceRoot, 'reports/address-morphism-theory-review/paper'),
    'canonical-current',
    { excludeFrontmatter: true },
  );
  const legacyJapanese = legacyJapaneseV1Set(join(workspaceRoot, 'docs'));
  const shortReview = numberedMarkdownSet(
    'short-review-chapters',
    'Short review chapter set',
    join(workspaceRoot, 'reports/address-morphism-theory-review/chapters/address-morphism-theory'),
    'short-review',
  );
  const verification = chapterVerificationSet(join(workspaceRoot, 'docs/chapter-verification'));

  return {
    version: ADDRESS_MORPHISM_CHAPTER_INVENTORY_VERSION,
    canonicalChapterCount: currentPaper.chapterCount,
    canonicalRoot: currentPaper.root,
    sets: [currentPaper, legacyJapanese, shortReview, verification],
    summary: {
      currentPaperChapters: currentPaper.chapterCount,
      legacyJapaneseV1Chapters: legacyJapanese.chapterCount,
      shortReviewChapters: shortReview.chapterCount,
      chapterVerificationNotes: verification.chapterCount,
    },
  };
}

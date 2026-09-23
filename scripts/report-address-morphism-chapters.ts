import { buildAddressMorphismChapterInventory } from '../src/lib/addressMorphismChapterInventory';

const inventory = buildAddressMorphismChapterInventory();

console.log(JSON.stringify({
  version: inventory.version,
  canonicalChapterCount: inventory.canonicalChapterCount,
  canonicalRoot: inventory.canonicalRoot,
  summary: inventory.summary,
  sets: inventory.sets.map(set => ({
    id: set.id,
    label: set.label,
    role: set.role,
    chapterCount: set.chapterCount,
    frontmatterCount: set.frontmatterCount,
    minChapter: set.minChapter,
    maxChapter: set.maxChapter,
    fileCount: set.fileCount,
    root: set.root,
  })),
}, null, 2));

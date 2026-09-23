import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_CHAPTER_INVENTORY_VERSION,
  buildAddressMorphismChapterInventory,
} from './addressMorphismChapterInventory';

test('detects the current split Address Morphism Theory paper as 29 chapters plus frontmatter', () => {
  const inventory = buildAddressMorphismChapterInventory();
  const current = inventory.sets.find(set => set.id === 'current-paper-split');

  assert.ok(current);
  assert.equal(inventory.version, ADDRESS_MORPHISM_CHAPTER_INVENTORY_VERSION);
  assert.equal(inventory.canonicalChapterCount, 29);
  assert.equal(inventory.summary.currentPaperChapters, 29);
  assert.equal(current.frontmatterCount, 1);
  assert.equal(current.minChapter, 1);
  assert.equal(current.maxChapter, 29);
  assert.ok(current.files.includes('00-frontmatter.md'));
  assert.ok(current.files.includes('29-mathematical-model-core.md'));
});

test('distinguishes legacy Japanese v1, short review, and verification chapter counts', () => {
  const inventory = buildAddressMorphismChapterInventory();

  assert.equal(inventory.summary.legacyJapaneseV1Chapters, 26);
  assert.equal(inventory.summary.shortReviewChapters, 6);
  assert.equal(inventory.summary.chapterVerificationNotes, 26);

  const legacy = inventory.sets.find(set => set.id === 'ja-v1-master-bundles');
  const shortReview = inventory.sets.find(set => set.id === 'short-review-chapters');
  const verification = inventory.sets.find(set => set.id === 'ja-v1-chapter-verification');

  assert.equal(legacy?.minChapter, 1);
  assert.equal(legacy?.maxChapter, 26);
  assert.equal(shortReview?.minChapter, 1);
  assert.equal(shortReview?.maxChapter, 6);
  assert.equal(verification?.minChapter, 1);
  assert.equal(verification?.maxChapter, 26);
});

test('marks the split paper as the canonical current chapter source', () => {
  const inventory = buildAddressMorphismChapterInventory();
  const canonicalSets = inventory.sets.filter(set => set.role === 'canonical-current');

  assert.equal(canonicalSets.length, 1);
  assert.equal(canonicalSets[0].id, 'current-paper-split');
  assert.equal(inventory.canonicalRoot, canonicalSets[0].root);
});

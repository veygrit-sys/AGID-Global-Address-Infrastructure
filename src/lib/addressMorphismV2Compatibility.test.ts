import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_V2_COMPATIBILITY_VERSION,
  CURRENT_29_CHAPTERS,
  V2_COMPATIBILITY_MAP,
  buildV2CompatibilityReport,
  getMissingSourceChapters,
  getV2SourceCoverage,
} from './addressMorphismV2Compatibility';

test('covers every current AMT chapter from 1 through 29', () => {
  assert.deepEqual(
    CURRENT_29_CHAPTERS.map(chapter => chapter.chapter),
    Array.from({ length: 29 }, (_, index) => index + 1),
  );
  assert.deepEqual(getV2SourceCoverage(), Array.from({ length: 29 }, (_, index) => index + 1));
  assert.deepEqual(getMissingSourceChapters(), []);
});

test('keeps the v2 main paper to 12 lossless chapters', () => {
  const report = buildV2CompatibilityReport();

  assert.equal(report.version, ADDRESS_MORPHISM_V2_COMPATIBILITY_VERSION);
  assert.equal(report.sourceChapterCount, 29);
  assert.equal(report.v2ChapterCount, 12);
  assert.match(report.rule, /lossless reorganization/);
});

test('requires claims, mathematical models, artifacts, and non-claims for every v2 chapter', () => {
  for (const chapter of V2_COMPATIBILITY_MAP) {
    assert.ok(chapter.sourceChapters.length >= 1, `${chapter.title} needs source chapters`);
    assert.ok(chapter.preservedClaims.length >= 2, `${chapter.title} needs preserved claims`);
    assert.ok(chapter.preservedMathematicalModels.length >= 2, `${chapter.title} needs math models`);
    assert.ok(chapter.requiredArtifacts.length >= 2, `${chapter.title} needs required artifacts`);
    assert.ok(chapter.nonClaims.length >= 2, `${chapter.title} needs non-claims`);
  }
});

test('preserves the central mathematical-model-core material in multiple chapters', () => {
  const chaptersUsingModelCore = V2_COMPATIBILITY_MAP.filter(chapter =>
    chapter.sourceChapters.some(source => source.chapter === 29),
  ).map(chapter => chapter.v2Chapter);

  assert.deepEqual(chaptersUsingModelCore, [4, 6, 7, 9]);
});

test('preserves protocol and privacy boundaries without merging them into address resolution', () => {
  const protocolChapter = V2_COMPATIBILITY_MAP.find(chapter => chapter.v2Chapter === 11);

  assert.ok(protocolChapter);
  assert.ok(protocolChapter.sourceChapters.some(source => source.chapter === 18));
  assert.ok(protocolChapter.sourceChapters.some(source => source.chapter === 28));
  assert.ok(protocolChapter.nonClaims.some(nonClaim => nonClaim.includes('ZK repairs bad resolution')));
});

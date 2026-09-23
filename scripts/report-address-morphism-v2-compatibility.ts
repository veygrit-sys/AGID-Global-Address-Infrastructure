import { buildV2CompatibilityReport } from '../src/lib/addressMorphismV2Compatibility';

const report = buildV2CompatibilityReport();

console.log(
  JSON.stringify(
    {
      version: report.version,
      rule: report.rule,
      sourceChapterCount: report.sourceChapterCount,
      v2ChapterCount: report.v2ChapterCount,
      coveredSourceChapters: report.coveredSourceChapters,
      missingSourceChapters: report.missingSourceChapters,
      v2Chapters: report.chapters.map(chapter => ({
        v2Chapter: chapter.v2Chapter,
        title: chapter.title,
        sourceChapters: chapter.sourceChapters.map(source => source.chapter),
        preservedClaimCount: chapter.preservedClaims.length,
        preservedMathematicalModelCount: chapter.preservedMathematicalModels.length,
        requiredArtifactCount: chapter.requiredArtifacts.length,
        nonClaimCount: chapter.nonClaims.length,
      })),
    },
    null,
    2,
  ),
);

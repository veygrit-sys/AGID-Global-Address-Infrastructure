import { buildAddressMorphismExpansionProposal } from '../src/lib/addressMorphismExpansionProposal';

const proposal = buildAddressMorphismExpansionProposal();

console.log(
  JSON.stringify(
    {
      version: proposal.version,
      currentCanonicalChapterCount: proposal.currentCanonicalChapterCount,
      proposedFinalChapterCount: proposal.proposedFinalChapterCount,
      proposedChapters: proposal.proposedChapters.map(chapter => ({
        proposedChapter: chapter.proposedChapter,
        slug: chapter.slug,
        titleJa: chapter.titleJa,
        titleEn: chapter.titleEn,
        existingChapterLinks: chapter.existingChapterLinks,
        mathematicalAdditionCount: chapter.mathematicalAdditions.length,
        implementationArtifactCount: chapter.implementationArtifacts.length,
        safetyBoundaryCount: chapter.safetyBoundaries.length,
        status: chapter.status,
      })),
      adoptionPolicy: proposal.adoptionPolicy,
    },
    null,
    2,
  ),
);

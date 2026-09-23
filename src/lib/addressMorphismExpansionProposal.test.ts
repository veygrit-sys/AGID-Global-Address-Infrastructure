import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_EXPANSION_PROPOSAL_VERSION,
  buildAddressMorphismExpansionProposal,
} from './addressMorphismExpansionProposal';

test('proposes four post-unification chapters without changing the current 29-chapter canonical count', () => {
  const proposal = buildAddressMorphismExpansionProposal();

  assert.equal(proposal.version, ADDRESS_MORPHISM_EXPANSION_PROPOSAL_VERSION);
  assert.equal(proposal.currentCanonicalChapterCount, 29);
  assert.equal(proposal.proposedChapters.length, 4);
  assert.equal(proposal.proposedFinalChapterCount, 33);
  assert.deepEqual(proposal.proposedChapters.map(chapter => chapter.proposedChapter), [30, 31, 32, 33]);
  assert.equal(proposal.adoptionPolicy.mustNotChangeCanonicalCountUntilDrafted, true);
});

test('maps proposed chapters to existing AMT chapter neighborhoods and implementation artifacts', () => {
  const proposal = buildAddressMorphismExpansionProposal();

  for (const chapter of proposal.proposedChapters) {
    assert.ok(chapter.existingChapterLinks.length >= 5, `${chapter.slug} needs existing chapter links`);
    assert.ok(chapter.mathematicalAdditions.length >= 4, `${chapter.slug} needs math additions`);
    assert.ok(chapter.implementationArtifacts.length >= 4, `${chapter.slug} needs implementation artifacts`);
    assert.ok(chapter.safetyBoundaries.length >= 3, `${chapter.slug} needs safety boundaries`);
    assert.equal(chapter.status, 'proposed-not-canonical');
  }
});

test('keeps privacy, consensus, ML, and XR proposals separate from overclaims', () => {
  const proposal = buildAddressMorphismExpansionProposal();
  const governance = proposal.proposedChapters.find(chapter => chapter.proposedChapter === 30);
  const consensus = proposal.proposedChapters.find(chapter => chapter.proposedChapter === 31);
  const learning = proposal.proposedChapters.find(chapter => chapter.proposedChapter === 32);
  const xr = proposal.proposedChapters.find(chapter => chapter.proposedChapter === 33);

  assert.match(governance?.thesis ?? '', /privacy-preserving abstraction layers/);
  assert.ok(consensus?.safetyBoundaries.some(boundary => boundary.includes('does not override official administrative authority')));
  assert.ok(learning?.safetyBoundaries.some(boundary => boundary.includes('does not train on raw personal recipient addresses')));
  assert.ok(xr?.safetyBoundaries.some(boundary => boundary.includes('does not treat virtual ownership as real-world legal title')));
});

test('requires drafting, verification, executable artifacts, and non-claim review before promotion', () => {
  const proposal = buildAddressMorphismExpansionProposal();

  assert.ok(proposal.adoptionPolicy.requiredBeforeCanonicalPromotion.includes('draft markdown chapter'));
  assert.ok(proposal.adoptionPolicy.requiredBeforeCanonicalPromotion.includes('chapter verification note'));
  assert.ok(proposal.adoptionPolicy.requiredBeforeCanonicalPromotion.includes('math model or executable fixture'));
  assert.ok(proposal.adoptionPolicy.requiredBeforeCanonicalPromotion.includes('non-claim and safety boundary review'));
  assert.equal(proposal.adoptionPolicy.mergeOrder.length, 4);
});

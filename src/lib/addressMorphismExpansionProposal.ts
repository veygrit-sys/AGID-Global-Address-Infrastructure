import { buildAddressMorphismUnificationPlan } from './addressMorphismUnificationPlan';

export const ADDRESS_MORPHISM_EXPANSION_PROPOSAL_VERSION = 'address-morphism-expansion-proposal-v0.1';

export type AddressMorphismProposedChapter = {
  proposedChapter: number;
  slug: string;
  titleJa: string;
  titleEn: string;
  thesis: string;
  existingChapterLinks: number[];
  mathematicalAdditions: string[];
  implementationArtifacts: string[];
  safetyBoundaries: string[];
  status: 'proposed-not-canonical';
};

export type AddressMorphismExpansionProposal = {
  version: typeof ADDRESS_MORPHISM_EXPANSION_PROPOSAL_VERSION;
  currentCanonicalChapterCount: number;
  proposedFinalChapterCount: number;
  proposedChapters: AddressMorphismProposedChapter[];
  adoptionPolicy: {
    mustNotChangeCanonicalCountUntilDrafted: boolean;
    requiredBeforeCanonicalPromotion: string[];
    mergeOrder: string[];
  };
};

const PROPOSED_CHAPTERS: AddressMorphismProposedChapter[] = [
  {
    proposedChapter: 30,
    slug: 'spatial-identifier-governance-and-ethics',
    titleJa: '空間識別子のガバナンスと倫理的フレームワーク',
    titleEn: 'Governance and Ethical Frameworks for Spatial Identifiers',
    thesis: 'Spatial references should be privacy-preserving abstraction layers, not surveillance instruments.',
    existingChapterLinks: [16, 18, 19, 20, 22, 28],
    mathematicalAdditions: [
      'privacy-separating reachability predicate',
      'non-reversible public identifier policy',
      'right-to-be-forgotten transition over PID lineage graphs',
      'zero-knowledge or MPC reachability proof without revealing room-level attributes',
    ],
    implementationArtifacts: [
      'governance-role matrix',
      'PID issuance authority policy fixture',
      'revocation and forgetting test vectors',
      'non-reversible public vertical reference example',
    ],
    safetyBoundaries: [
      'does not claim legal compliance in every jurisdiction',
      'does not publish room-level or private vertical attributes',
      'keeps cryptographic security claims in ZK-specific repositories',
    ],
    status: 'proposed-not-canonical',
  },
  {
    proposedChapter: 31,
    slug: 'distributed-consensus-and-global-registry',
    titleJa: '分散型合意プロトコルとグローバル・レジストリ',
    titleEn: 'Distributed Consensus Protocols and Global Registries',
    thesis: 'Addresses can be maintained as commons through interoperable agreements among municipalities, carriers, platforms, and users.',
    existingChapterLinks: [11, 12, 13, 14, 19, 20],
    mathematicalAdditions: [
      'distributed PID convergence model',
      'DAO-like parameter update process for structural distance threshold delta',
      'weighted consensus model for evaluation weights w',
      'conflict-resolution state machine for disputed referents',
    ],
    implementationArtifacts: [
      'registry synchronization fixture',
      'parameter governance proposal schema',
      'multi-issuer PID collision test vector',
      'neutral disputed-region registry example',
    ],
    safetyBoundaries: [
      'does not require blockchain as the only implementation',
      'does not override official administrative authority',
      'keeps territorial claims neutral and technical',
    ],
    status: 'proposed-not-canonical',
  },
  {
    proposedChapter: 32,
    slug: 'machine-learning-parameter-optimization-and-self-evolution',
    titleJa: '機械学習によるパラメータの自動最適化と自己進化',
    titleEn: 'Machine-Learned Parameter Optimization and Self-Evolving AMT',
    thesis: 'AMT should be a living infrastructure that improves from bounded feedback while preserving abstention and non-claim safety.',
    existingChapterLinks: [8, 9, 15, 17, 21, 23, 29],
    mathematicalAdditions: [
      'learned structural-distance kernel K',
      'adaptive temperature for candidate exploration',
      'hierarchical Bayesian estimate for regional confidence',
      'reinforcement learning objective using address entropy and safe abstention reward',
    ],
    implementationArtifacts: [
      'synthetic delivery-success feedback loop',
      'candidate exploration budget fixture',
      'entropy reward benchmark',
      'model drift and rollback policy',
    ],
    safetyBoundaries: [
      'does not train on raw personal recipient addresses',
      'does not let ML override hard safety gates',
      'requires human review for low-confidence or high-impact claims',
    ],
    status: 'proposed-not-canonical',
  },
  {
    proposedChapter: 33,
    slug: 'cross-domain-implementation-and-xr',
    titleJa: '異ドメイン横断実装とクロス現実への適用',
    titleEn: 'Cross-Domain Implementation and XR Applications',
    thesis: 'A unified address concept can bridge physical and digital worlds through reachability equivalence and cross-domain structural distance.',
    existingChapterLinks: [3, 12, 16, 20, 24, 25],
    mathematicalAdditions: [
      'physical-virtual reachability equivalence',
      'cross-domain structural distance',
      'dynamic emergency shelter address generation model',
      'digital twin referent mapping with temporal validity',
    ],
    implementationArtifacts: [
      'digital twin address fixture',
      'emergency shelter dynamic-address state machine',
      'land registry boundary compatibility vector',
      'XR point-of-interest reachability example',
    ],
    safetyBoundaries: [
      'does not treat virtual ownership as real-world legal title',
      'does not expose disaster shelter occupants or private locations',
      'keeps emergency and public-safety claims bounded by source authority',
    ],
    status: 'proposed-not-canonical',
  },
];

export function buildAddressMorphismExpansionProposal(): AddressMorphismExpansionProposal {
  const unification = buildAddressMorphismUnificationPlan();
  return {
    version: ADDRESS_MORPHISM_EXPANSION_PROPOSAL_VERSION,
    currentCanonicalChapterCount: unification.target.canonicalChapterCount,
    proposedFinalChapterCount: unification.target.canonicalChapterCount + PROPOSED_CHAPTERS.length,
    proposedChapters: PROPOSED_CHAPTERS,
    adoptionPolicy: {
      mustNotChangeCanonicalCountUntilDrafted: true,
      requiredBeforeCanonicalPromotion: [
        'draft markdown chapter',
        'chapter verification note',
        'math model or executable fixture',
        'non-claim and safety boundary review',
        'README and SUMMARY update',
      ],
      mergeOrder: [
        '30-spatial-identifier-governance-and-ethics',
        '31-distributed-consensus-and-global-registry',
        '32-machine-learning-parameter-optimization-and-self-evolution',
        '33-cross-domain-implementation-and-xr',
      ],
    },
  };
}

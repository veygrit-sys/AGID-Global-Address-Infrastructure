import { buildChapter1RegistrationProblemReport } from './addressMorphismV2Chapter1RegistrationProblem';
import { buildChapter2PriorWorkBoundaryReport } from './addressMorphismV2Chapter2PriorWorkBoundary';
import { buildChapter3FormalModelReport } from './addressMorphismV2Chapter3Model';
import { buildChapter4AxiomReport } from './addressMorphismV2Chapter4Axioms';
import { buildChapter5CandidatePolicyReport } from './addressMorphismV2Chapter5CandidatePolicy';
import { buildChapter6StructuralEquivalenceReport } from './addressMorphismV2Chapter6StructuralEquivalence';
import { buildChapter7SafeResolutionReport } from './addressMorphismV2Chapter7SafeResolution';
import { buildChapter8HistoryGraphReport } from './addressMorphismV2Chapter8HistoryGraph';
import { buildChapter9DecisionReport } from './addressMorphismV2Chapter9Decision';
import { buildChapter10CrossDomainReport } from './addressMorphismV2Chapter10CrossDomain';
import { buildChapter11ProtocolPrivacyReport } from './addressMorphismV2Chapter11ProtocolPrivacy';
import { buildChapter12VerificationReport } from './addressMorphismV2Chapter12Verification';

export const ADDRESS_MORPHISM_V2_FORMAL_REGISTRY_VERSION = 'address-morphism-v2-formal-registry-v0.1';

export type FormalRegistryEntry = {
  chapter: number;
  title: string;
  documentPath: string;
  modelModule: string;
  testModule: string;
  modelVersion: string;
  executableStatus: 'verified' | 'planned';
  preservedModelKinds: string[];
};

export function buildAddressMorphismV2FormalRegistry(): {
  version: string;
  executableChapterCount: number;
  entries: FormalRegistryEntry[];
  pendingMainChapters: number[];
} {
  const chapter1 = buildChapter1RegistrationProblemReport();
  const chapter2 = buildChapter2PriorWorkBoundaryReport();
  const chapter3 = buildChapter3FormalModelReport();
  const chapter4 = buildChapter4AxiomReport();
  const chapter5 = buildChapter5CandidatePolicyReport();
  const chapter6 = buildChapter6StructuralEquivalenceReport();
  const chapter7 = buildChapter7SafeResolutionReport();
  const chapter8 = buildChapter8HistoryGraphReport();
  const chapter9 = buildChapter9DecisionReport();
  const chapter10 = buildChapter10CrossDomainReport();
  const chapter11 = buildChapter11ProtocolPrivacyReport();
  const chapter12 = buildChapter12VerificationReport();

  const entries: FormalRegistryEntry[] = [
    {
      chapter: 1,
      title: '登録困難性と参照再利用問題',
      documentPath: 'docs/address-morphism-theory-v2/01-why-address-registration-is-hard.md',
      modelModule: 'src/lib/addressMorphismV2Chapter1RegistrationProblem.ts',
      testModule: 'src/lib/addressMorphismV2Chapter1RegistrationProblem.test.ts',
      modelVersion: chapter1.version,
      executableStatus: 'verified',
      preservedModelKinds: chapter1.executableModelKinds,
    },
    {
      chapter: 2,
      title: '住所参照の本質と既存手法境界',
      documentPath: 'docs/address-morphism-theory-v2/02-prior-work-and-the-missing-object.md',
      modelModule: 'src/lib/addressMorphismV2Chapter2PriorWorkBoundary.ts',
      testModule: 'src/lib/addressMorphismV2Chapter2PriorWorkBoundary.test.ts',
      modelVersion: chapter2.version,
      executableStatus: 'verified',
      preservedModelKinds: chapter2.executableModelKinds,
    },
    {
      chapter: 3,
      title: '住所対象と登録可能実体',
      documentPath: 'docs/address-morphism-theory-v2/03-address-objects-and-registrable-entities.md',
      modelModule: 'src/lib/addressMorphismV2Chapter3Model.ts',
      testModule: 'src/lib/addressMorphismV2Chapter3Model.test.ts',
      modelVersion: chapter3.version,
      executableStatus: 'verified',
      preservedModelKinds: [
        'referent set',
        'registrable entity set',
        'surface expression set',
        'observation map',
        'formal counterexamples',
        'formal non-claims',
      ],
    },
    {
      chapter: 4,
      title: '公理・記法・安全な棄却',
      documentPath: 'docs/address-morphism-theory-v2/04-axioms-notation-and-safe-abstention.md',
      modelModule: 'src/lib/addressMorphismV2Chapter4Axioms.ts',
      testModule: 'src/lib/addressMorphismV2Chapter4Axioms.test.ts',
      modelVersion: chapter4.version,
      executableStatus: 'verified',
      preservedModelKinds: [
        'AMT axiom gate set',
        'safe abstention rule',
        'candidate sufficiency gate',
        'evidence admissibility gate',
        'finite candidate gate',
        'public projection safety gate',
      ],
    },
    {
      chapter: 5,
      title: '候補生成と出典政策',
      documentPath: 'docs/address-morphism-theory-v2/05-candidate-generation-and-evidence-policy.md',
      modelModule: 'src/lib/addressMorphismV2Chapter5CandidatePolicy.ts',
      testModule: 'src/lib/addressMorphismV2Chapter5CandidatePolicy.test.ts',
      modelVersion: chapter5.version,
      executableStatus: 'verified',
      preservedModelKinds: [
        'candidate generation map',
        'source policy matrix',
        'license admissibility gate',
        'freshness gate',
        'source coverage gate',
        'multilingual recall non-identity',
        'finite candidate policy',
        'candidate coverage certificate',
        'source debt report',
      ],
    },
    {
      chapter: 6,
      title: '構造距離と住所同値類',
      documentPath: 'docs/address-morphism-theory-v2/06-structural-distance-and-equivalence-classes.md',
      modelModule: 'src/lib/addressMorphismV2Chapter6StructuralEquivalence.ts',
      testModule: 'src/lib/addressMorphismV2Chapter6StructuralEquivalence.test.ts',
      modelVersion: chapter6.version,
      executableStatus: 'verified',
      preservedModelKinds: [
        'structural feature vector',
        'purpose-relative distance',
        'equivalence threshold',
        'comparability gate',
        'evidence gate',
        'bounded-diameter cluster',
        'quotient entropy',
        'postal equality counterexample',
        'POI equality counterexample',
        'coordinate equality counterexample',
      ],
    },
    {
      chapter: 7,
      title: '有限推定と安全解決',
      documentPath: 'docs/address-morphism-theory-v2/07-finite-estimation-and-safe-resolution.md',
      modelModule: 'src/lib/addressMorphismV2Chapter7SafeResolution.ts',
      testModule: 'src/lib/addressMorphismV2Chapter7SafeResolution.test.ts',
      modelVersion: chapter7.version,
      executableStatus: 'verified',
      preservedModelKinds: [
        'finite candidate class set',
        'energy function',
        'finite argmin',
        'decision gate table',
        'deterministic tie-break',
        'resolution certificate',
        'manual review state',
        'unresolved state',
        'safe resolution decision',
        'PID issuance boundary',
        'public projection safety gate',
      ],
    },
    {
      chapter: 8,
      title: '履歴グラフ、PID保存、社会的連続性',
      documentPath: 'docs/address-morphism-theory-v2/08-history-graphs-pid-conservation-and-social-continuity.md',
      modelModule: 'src/lib/addressMorphismV2Chapter8HistoryGraph.ts',
      testModule: 'src/lib/addressMorphismV2Chapter8HistoryGraph.test.ts',
      modelVersion: chapter8.version,
      executableStatus: 'verified',
      preservedModelKinds: [
        'history graph',
        'RPID/DPID/application identifier separation',
        'lineage root',
        'split transition safety',
        'merge transition safety',
        'deprecation and successor boundary',
        'social continuity evidence',
        'public history projection safety',
        'application identifier non-PID boundary',
      ],
    },
    {
      chapter: 9,
      title: '確率、品質、エントロピー、意思決定',
      documentPath: 'docs/address-morphism-theory-v2/09-probability-quality-entropy-and-decision.md',
      modelModule: 'src/lib/addressMorphismV2Chapter9Decision.ts',
      testModule: 'src/lib/addressMorphismV2Chapter9Decision.test.ts',
      modelVersion: chapter9.version,
      executableStatus: 'verified',
      preservedModelKinds: [
        'Gibbs posterior distribution',
        'MAP candidate selection',
        'Shannon entropy',
        'ambiguity reduction',
        'quality threshold gate',
        'reputation update',
        'purpose-relative expected loss',
        'decision certificate',
        'probability non-repair boundary',
      ],
    },
    {
      chapter: 10,
      title: '自然地理・文化地理・垂直参照・クロスドメイン参照',
      documentPath: 'docs/address-morphism-theory-v2/10-natural-cultural-vertical-and-cross-domain-references.md',
      modelModule: 'src/lib/addressMorphismV2Chapter10CrossDomain.ts',
      testModule: 'src/lib/addressMorphismV2Chapter10CrossDomain.test.ts',
      modelVersion: chapter10.version,
      executableStatus: 'verified',
      preservedModelKinds: [
        'cross-domain referent schema',
        'domain classifier',
        'boundary kind matrix',
        'vertical privacy gate',
        'reachability equivalence',
        'cross-domain structural distance',
        'digital twin correspondence boundary',
        'coordinate non-identity counterexample',
        'public projection safety for non-standard references',
      ],
    },
    {
      chapter: 11,
      title: 'プロトコル・プライバシー・ガバナンス・悪用境界',
      documentPath: 'docs/address-morphism-theory-v2/11-protocol-privacy-governance-and-abuse-boundaries.md',
      modelModule: 'src/lib/addressMorphismV2Chapter11ProtocolPrivacy.ts',
      testModule: 'src/lib/addressMorphismV2Chapter11ProtocolPrivacy.test.ts',
      modelVersion: chapter11.version,
      executableStatus: 'verified',
      preservedModelKinds: [
        'AMT envelope schema',
        'envelope state guard',
        'ZK predicate boundary',
        'verifier policy matrix',
        'public signal leak gate',
        'scoped nullifier gate',
        'revocation root gate',
        'audit without raw address',
        'least disclosure rule',
        'neutral identifier non-claim',
        'ZK non-repair boundary',
      ],
    },
    {
      chapter: 12,
      title: '検証・ベンチマーク・限界・結論',
      documentPath: 'docs/address-morphism-theory-v2/12-verification-benchmarks-limits-and-conclusion.md',
      modelModule: 'src/lib/addressMorphismV2Chapter12Verification.ts',
      testModule: 'src/lib/addressMorphismV2Chapter12Verification.test.ts',
      modelVersion: chapter12.version,
      executableStatus: 'verified',
      preservedModelKinds: chapter12.executableModelKinds,
    },
  ];

  const executableChapters = new Set(entries.map(entry => entry.chapter));
  const pendingMainChapters = Array.from({ length: 12 }, (_, index) => index + 1).filter(
    chapter => !executableChapters.has(chapter),
  );

  return {
    version: ADDRESS_MORPHISM_V2_FORMAL_REGISTRY_VERSION,
    executableChapterCount: entries.filter(entry => entry.executableStatus === 'verified').length,
    entries,
    pendingMainChapters,
  };
}

export function validateAddressMorphismV2FormalRegistry(): string[] {
  const registry = buildAddressMorphismV2FormalRegistry();
  const errors: string[] = [];
  const seenChapters = new Set<number>();

  for (const entry of registry.entries) {
    if (seenChapters.has(entry.chapter)) {
      errors.push(`duplicate formal registry chapter: ${entry.chapter}`);
    }
    seenChapters.add(entry.chapter);

    if (!entry.documentPath.endsWith('.md')) {
      errors.push(`${entry.title}: documentPath must point to markdown`);
    }
    if (!entry.modelModule.endsWith('.ts') || entry.modelModule.endsWith('.test.ts')) {
      errors.push(`${entry.title}: modelModule must point to a non-test TypeScript module`);
    }
    if (!entry.testModule.endsWith('.test.ts')) {
      errors.push(`${entry.title}: testModule must point to a test module`);
    }
    if (!entry.modelVersion.includes('address-morphism-v2')) {
      errors.push(`${entry.title}: modelVersion must be AMT v2 scoped`);
    }
    if (entry.preservedModelKinds.length < 4) {
      errors.push(`${entry.title}: preservedModelKinds is too thin`);
    }
  }

  return errors;
}

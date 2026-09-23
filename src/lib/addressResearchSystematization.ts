export const ADDRESS_RESEARCH_SYSTEMATIZATION_VERSION =
  'address-research-systematization-v0.1';

export type AddressResearchDomainId =
  | 'address-data-model'
  | 'address-normalization-theory'
  | 'address-search-theory'
  | 'address-index-theory'
  | 'address-morphism-theory'
  | 'address-validation-theory'
  | 'address-privacy-theory'
  | 'address-authentication-theory'
  | 'address-update-history-theory'
  | 'address-distributed-database-theory';

export type AddressResearchDomain = {
  id: AddressResearchDomainId;
  nameJa: string;
  nameEn: string;
  centralQuestion: string;
  objectOfStudy: string;
  primitives: string[];
  axioms: string[];
  invariants: string[];
  counterexamples: string[];
  metrics: string[];
  executableSpecs: string[];
  fixtures: string[];
  dependsOn: AddressResearchDomainId[];
  nonClaims: string[];
};

export type AddressResearchBridge = {
  target: 'AddressQL' | 'Address Morphism Theory' | 'Address Login' | 'AGID/AOID' | 'Skipship';
  role: string;
  boundary: string;
};

export type AddressResearchPublicationTrack = {
  id: string;
  title: string;
  domainIds: AddressResearchDomainId[];
  minimumArtifact: string;
};

export type AddressResearchRepositoryTarget = {
  repository: 'address-research' | 'address-morphism-theory';
  role: string;
  canonicalDomainIds: AddressResearchDomainId[];
  canonicalArtifacts: string[];
  verificationCommands: string[];
  creationBoundary: {
    localScaffoldOnly: boolean;
    remoteCreationRequiresExplicitUserRequest: boolean;
    productionTrafficAllowed: boolean;
    rawAddressMaterialAllowed: boolean;
  };
  nonClaims: string[];
};

export type AddressResearchRepositoryTemplateFile = {
  path: string;
  purpose: string;
  requiredSections: string[];
  sourceArtifacts: string[];
  safetyNotes: string[];
};

export type AddressResearchRepositoryTemplate = {
  repository: AddressResearchRepositoryTarget['repository'];
  packageName: string;
  version: string;
  readinessClaim: 'local-scaffold-only';
  localOnly: true;
  remoteActionsAllowed: false;
  blockedMaterials: string[];
  verificationCommands: string[];
  files: AddressResearchRepositoryTemplateFile[];
};

export type AddressResearchSystematization = {
  version: string;
  disciplineNameJa: string;
  disciplineNameEn: string;
  thesis: string;
  thickeningLadder: string[];
  domains: AddressResearchDomain[];
  bridges: AddressResearchBridge[];
  publicationTracks: AddressResearchPublicationTrack[];
  repositoryTargets: AddressResearchRepositoryTarget[];
  commonNonClaims: string[];
};

const REPOSITORY_TEMPLATE_BLOCKED_MATERIALS = [
  'raw address',
  'recipient',
  'witness',
  'private key',
  'proof secret',
  'production credential',
];

export const ADDRESS_RESEARCH_DOMAINS: AddressResearchDomain[] = [
  {
    id: 'address-data-model',
    nameJa: '住所データモデル',
    nameEn: 'Address Data Model',
    centralQuestion: '住所を文字列ではなく、参照対象・表現・証拠・用途を持つ情報対象としてどう定義するか。',
    objectOfStudy: '住所表現、住所参照対象、識別子、行政区画、地物、証拠、品質状態の型関係。',
    primitives: ['expression', 'referent', 'identifier', 'source evidence', 'quality state', 'policy context'],
    axioms: [
      '住所表現と住所参照対象は同一型ではない。',
      '同じ表現が同じ配送可能性を保証するとは限らない。',
    ],
    invariants: ['型分離', '証拠追跡可能性', '用途別品質状態'],
    counterexamples: ['同名地名', '行政区画変更後の旧住所', '建物名だけで配送できるが法的住所ではないケース'],
    metrics: ['必須型充足率', '証拠付きフィールド率', '用途別検証可能率'],
    executableSpecs: ['JSON Schema for AddressObject', 'AddressQL ADDRESS JSONB contract'],
    fixtures: ['synthetic typed address objects', 'ambiguous expression fixtures'],
    dependsOn: [],
    nonClaims: ['データモデルだけで住所の真偽や配送可否を保証しない。'],
  },
  {
    id: 'address-normalization-theory',
    nameJa: '住所正規化理論',
    nameEn: 'Address Normalization Theory',
    centralQuestion: '表記ゆれを減らしながら、失ってはいけない意味差をどう保存するか。',
    objectOfStudy: '文字種、言語、略記、行政区画名、建物・部屋表現の正規化写像。',
    primitives: ['rewrite rule', 'canonical form', 'loss flag', 'locale profile', 'normalization trace'],
    axioms: [
      '正規化は参照対象解決ではない。',
      '不可逆な正規化は損失情報を明示しなければならない。',
    ],
    invariants: ['trace preservation', 'locale boundedness', 'loss annotation'],
    counterexamples: ['同じ略称が複数地域を指す', '部屋番号のゼロ詰めが意味を持つ', '翻字で別地名へ近づく'],
    metrics: ['正規化安定率', '過剰統合率', '損失注釈率'],
    executableSpecs: ['normalization rule registry', 'round-trip safety test vectors'],
    fixtures: ['synthetic variant spellings', 'locale-specific abbreviation pairs'],
    dependsOn: ['address-data-model'],
    nonClaims: ['正規化一致を同一住所判定として扱わない。'],
  },
  {
    id: 'address-search-theory',
    nameJa: '住所検索理論',
    nameEn: 'Address Search Theory',
    centralQuestion: '曖昧・多言語・部分入力から、候補集合と不確実性をどう返すか。',
    objectOfStudy: '住所候補検索、ランキング、曖昧一致、多言語検索、対話的絞り込み。',
    primitives: ['query expression', 'candidate set', 'ranker', 'explanation', 'uncertainty band'],
    axioms: [
      '検索結果の1位は住所確定ではない。',
      '候補集合は根拠と不確実性を持つ。',
    ],
    invariants: ['candidate traceability', 'rank explanation', 'non-empty ambiguity reporting'],
    counterexamples: ['郵便番号だけの検索', '駅名・ランドマーク入力', '複数国で同じ都市名'],
    metrics: ['recall@k', 'mean reciprocal rank', 'ambiguity disclosure rate'],
    executableSpecs: ['search benchmark fixture', 'candidate response schema'],
    fixtures: ['partial query fixtures', 'multilingual alias fixtures'],
    dependsOn: ['address-data-model', 'address-normalization-theory'],
    nonClaims: ['曖昧検索は本人確認や配送可否の証明ではない。'],
  },
  {
    id: 'address-index-theory',
    nameJa: '住所インデックス理論',
    nameEn: 'Address Index Theory',
    centralQuestion: '郵便番号・座標・行政区画・ランドマークを混ぜた索引をどう設計し、誤結合を避けるか。',
    objectOfStudy: '複合索引、空間索引、階層索引、郵便番号索引、別名索引。',
    primitives: ['postal key', 'spatial cell', 'admin path', 'alias key', 'index freshness'],
    axioms: [
      '索引命中は住所存在証明ではない。',
      '郵便番号索引と行政区画索引は独立に古くなり得る。',
    ],
    invariants: ['staleness marking', 'multi-key explainability', 'source separation'],
    counterexamples: ['郵便番号再編', '境界付近の座標', 'ランドマーク閉鎖後の検索'],
    metrics: ['lookup latency', 'false merge rate', 'staleness detection rate'],
    executableSpecs: ['index coverage gate', 'source completeness gate'],
    fixtures: ['boundary cell fixtures', 'postal-code churn fixtures'],
    dependsOn: ['address-data-model', 'address-search-theory'],
    nonClaims: ['高速な索引は高品質な住所データの代替ではない。'],
  },
  {
    id: 'address-morphism-theory',
    nameJa: '住所写像理論',
    nameEn: 'Address Morphism Theory',
    centralQuestion: 'ある住所表現・制度・言語から別の表現へ変換するとき、何が保存され何が失われるか。',
    objectOfStudy: '住所表現間の写像、可逆性、合成、同値性、損失境界。',
    primitives: ['morphism', 'domain', 'codomain', 'preserved property', 'loss certificate'],
    axioms: [
      '住所写像は常に全単射とは限らない。',
      '写像の合成は損失証明を合成しなければならない。',
    ],
    invariants: ['domain declaration', 'loss propagation', 'composition safety'],
    counterexamples: ['建物階層を持たない国際配送形式', '旧地名から新地名への多対一変換', '翻訳で行政階層が消える'],
    metrics: ['preservation score', 'round-trip divergence', 'loss certificate coverage'],
    executableSpecs: ['morphism contract tests', 'non-invertible mapping fixtures'],
    fixtures: ['format conversion pairs', 'lossy translation fixtures'],
    dependsOn: ['address-data-model', 'address-normalization-theory'],
    nonClaims: ['写像可能性は配送可能性や本人居住の証明ではない。'],
  },
  {
    id: 'address-validation-theory',
    nameJa: '住所検証理論',
    nameEn: 'Address Validation Theory',
    centralQuestion: '形式・存在・配送・本人関係を混同せず、目的別に検証結果をどう分けるか。',
    objectOfStudy: '形式検証、存在検証、配送検証、証拠検証、品質状態遷移。',
    primitives: ['validation purpose', 'evidence source', 'result state', 'confidence', 'expiry'],
    axioms: [
      'valid は目的なしに定義できない。',
      '形式検証の成功は住所存在を意味しない。',
    ],
    invariants: ['purpose binding', 'evidence expiry', 'negative-result reason'],
    counterexamples: ['形式は正しいが存在しない郵便番号', '存在するが配送不可の地域', '配送可能だが本人住所ではない場所'],
    metrics: ['purpose-specific precision', 'false acceptance rate', 'evidence freshness'],
    executableSpecs: ['validation result enum', 'postal format/existence split tests'],
    fixtures: ['valid-format nonexistent fixtures', 'deliverable/non-deliverable fixtures'],
    dependsOn: ['address-data-model', 'address-index-theory'],
    nonClaims: ['検証成功を法的本人確認として自動昇格しない。'],
  },
  {
    id: 'address-privacy-theory',
    nameJa: '住所プライバシー理論',
    nameEn: 'Address Privacy Theory',
    centralQuestion: '住所を使わずに済む場面では何を開示せず、使う場面ではどこまで最小化するか。',
    objectOfStudy: '開示最小化、配送先ID、マスキング、同意、監査、再識別リスク。',
    primitives: ['disclosure scope', 'recipient id', 'consent receipt', 'masking level', 'retention policy'],
    axioms: [
      '住所は単なる連絡先ではなく高感度な生活パターン情報である。',
      '開示最小化は配送成功条件と同時に評価する。',
    ],
    invariants: ['least disclosure', 'purpose limitation', 'auditable consent'],
    counterexamples: ['友達配送で購入者に住所が見える', 'ログに完全住所が残る', 'マスク済み住所が小地域で再識別される'],
    metrics: ['field disclosure count', 'retention window', 'reidentification risk tier'],
    executableSpecs: ['no-raw-address gate', 'consent receipt schema'],
    fixtures: ['redacted event fixtures', 'permission request fixtures'],
    dependsOn: ['address-data-model', 'address-validation-theory'],
    nonClaims: ['マスキングだけで匿名性を保証しない。'],
  },
  {
    id: 'address-authentication-theory',
    nameJa: '住所認証理論',
    nameEn: 'Address Authentication Theory',
    centralQuestion: '住所の所有・居住・配送受領権限を、過剰開示なしにどう証明するか。',
    objectOfStudy: 'VC、DID、ZK predicate、署名、失効、検証フック。',
    primitives: ['credential', 'predicate', 'issuer', 'verifier', 'revocation status', 'proof input'],
    axioms: [
      '証明は主張範囲を超えない。',
      'ZK証明は元データや住所解決の誤りを修復しない。',
    ],
    invariants: ['claim scope binding', 'revocation check', 'proof input separation'],
    counterexamples: ['郵便番号在住証明を完全住所証明として扱う', '失効確認なしの古いcredential', '証明入力に秘密住所をログ出力'],
    metrics: ['claim overreach rate', 'revocation coverage', 'proof input leakage count'],
    executableSpecs: ['proof input schema', 'verifier hook tests', 'non-claim tests'],
    fixtures: ['synthetic credential metadata', 'revoked proof fixtures'],
    dependsOn: ['address-privacy-theory', 'address-validation-theory'],
    nonClaims: ['ZK対応を実回路完成や法的KYC保証として主張しない。'],
  },
  {
    id: 'address-update-history-theory',
    nameJa: '住所更新・履歴理論',
    nameEn: 'Address Update and History Theory',
    centralQuestion: '住所変更、行政再編、別名、履歴を、現在値だけに潰さずどう扱うか。',
    objectOfStudy: '住所版管理、時間有効性、変更イベント、旧地名、移転、履歴照会。',
    primitives: ['valid time', 'transaction time', 'change event', 'alias', 'supersession link'],
    axioms: [
      '住所の現在値は過去の配送・証明記録を上書きしない。',
      '行政変更と個人の移転は別のイベント型である。',
    ],
    invariants: ['bitemporal trace', 'event type separation', 'immutable receipt'],
    counterexamples: ['旧住所で作成した配送証跡が現住所に書き換わる', '市町村合併と転居を同一扱い', '別名の有効期間がない'],
    metrics: ['history completeness', 'stale alias detection', 'temporal query correctness'],
    executableSpecs: ['address history event schema', 'bitemporal query fixtures'],
    fixtures: ['synthetic admin rename events', 'move vs rename fixtures'],
    dependsOn: ['address-data-model', 'address-validation-theory'],
    nonClaims: ['履歴保持は無期限保存の正当化ではない。'],
  },
  {
    id: 'address-distributed-database-theory',
    nameJa: '住所分散データベース理論',
    nameEn: 'Address Distributed Database Theory',
    centralQuestion: '国・事業者・地域ごとに分散する住所源を、信頼境界を保ったままどう統合するか。',
    objectOfStudy: '分散gazetteer、公式source catalog、同期、証拠、競合解決、ローカル検証。',
    primitives: ['source catalog', 'trust boundary', 'replica', 'conflict', 'provenance', 'sync policy'],
    axioms: [
      '単一グローバル真実源を仮定しない。',
      'source統合は証拠とライセンス境界を保存する。',
    ],
    invariants: ['source attribution', 'license boundary', 'conflict visibility'],
    counterexamples: ['OSM名と政府名の無根拠上書き', 'ライセンス不明データの混入', '島名や自然地名のsource欠落'],
    metrics: ['source completeness by category', 'conflict resolution latency', 'license-known ratio'],
    executableSpecs: ['source completeness gate', 'official/OSM/GeoNames/Wikidata split matrix'],
    fixtures: ['country source catalog fixtures', 'conflicting gazetteer fixtures'],
    dependsOn: ['address-index-theory', 'address-update-history-theory', 'address-privacy-theory'],
    nonClaims: ['分散DBは各国公式データの完全性を自動保証しない。'],
  },
];

export const ADDRESS_RESEARCH_BRIDGES: AddressResearchBridge[] = [
  {
    target: 'AddressQL',
    role: 'Executable query language for validation, search, index, morphism, and proof predicates.',
    boundary: 'AddressQL executes bounded functions; it does not make all global address facts complete.',
  },
  {
    target: 'Address Morphism Theory',
    role: 'Formal subfield for representation-preserving and lossy address transformations.',
    boundary: 'Morphism compatibility is separate from delivery availability and identity claims.',
  },
  {
    target: 'Address Login',
    role: 'Consent and authentication surface for address disclosure, friend delivery, and credential use.',
    boundary: 'Login success does not imply permission to disclose a recipient address.',
  },
  {
    target: 'AGID/AOID',
    role: 'Identifier layer for grid, object, place, and operational references.',
    boundary: 'Identifiers are resolvers and references, not raw addresses or universal truth.',
  },
  {
    target: 'Skipship',
    role: 'Shipping gateway application layer that consumes address, identity, consent, and carrier abstractions.',
    boundary: 'Carrier abstraction does not remove carrier-specific legal, label, or delivery constraints.',
  },
];

export const ADDRESS_RESEARCH_PUBLICATION_TRACKS: AddressResearchPublicationTrack[] = [
  {
    id: 'foundations',
    title: 'Foundations of Address Information Science',
    domainIds: ['address-data-model', 'address-validation-theory', 'address-update-history-theory'],
    minimumArtifact: 'formal definitions, non-claims, schemas, and synthetic fixtures',
  },
  {
    id: 'search-index',
    title: 'Address Search and Index Theory',
    domainIds: ['address-search-theory', 'address-index-theory'],
    minimumArtifact: 'benchmark fixture, ranking metrics, and source completeness gates',
  },
  {
    id: 'morphism-normalization',
    title: 'Address Normalization and Morphism Theory',
    domainIds: ['address-normalization-theory', 'address-morphism-theory'],
    minimumArtifact: 'loss-preserving mapping contracts and round-trip divergence tests',
  },
  {
    id: 'privacy-authentication',
    title: 'Address Privacy and Authentication Theory',
    domainIds: ['address-privacy-theory', 'address-authentication-theory'],
    minimumArtifact: 'consent receipts, proof input schemas, verifier hooks, and non-claim tests',
  },
  {
    id: 'distributed-gazetteers',
    title: 'Distributed Address Databases and Gazetteer Provenance',
    domainIds: ['address-distributed-database-theory', 'address-index-theory', 'address-update-history-theory'],
    minimumArtifact: 'source catalog, conflict fixtures, license boundaries, and completeness gates',
  },
];

export const ADDRESS_RESEARCH_REPOSITORY_TARGETS: AddressResearchRepositoryTarget[] = [
  {
    repository: 'address-research',
    role: 'Canonical umbrella repository for Address Information Science and Engineering definitions, domain registry, bridges, publication tracks, and non-claim policy.',
    canonicalDomainIds: [
      'address-data-model',
      'address-normalization-theory',
      'address-search-theory',
      'address-index-theory',
      'address-validation-theory',
      'address-privacy-theory',
      'address-authentication-theory',
      'address-update-history-theory',
      'address-distributed-database-theory',
    ],
    canonicalArtifacts: [
      'docs/research/address-information-science-systematization-ja.md',
      'docs/research/address-information-engineering-foundations-for-address-research-ja.md',
      'src/lib/addressResearchSystematization.ts',
      'src/lib/addressInformationEngineeringFoundations.ts',
    ],
    verificationCommands: [
      'npm run verify:address-research-systematization',
      'npm run verify:address-information-engineering-foundations',
      'npm run verify:address-information-engineering-foundations-workflow',
    ],
    creationBoundary: {
      localScaffoldOnly: true,
      remoteCreationRequiresExplicitUserRequest: true,
      productionTrafficAllowed: false,
      rawAddressMaterialAllowed: false,
    },
    nonClaims: [
      'The umbrella research repository is not a complete global address database.',
      'Moving theory into address-research does not make any implementation production-ready.',
      'The repository target does not authorize creating, deleting, pushing, or opening remote GitHub resources.',
    ],
  },
  {
    repository: 'address-morphism-theory',
    role: 'Specialized formal repository for address morphisms, loss certificates, composition safety, non-invertible fixtures, and AddressQL compatibility.',
    canonicalDomainIds: ['address-normalization-theory', 'address-morphism-theory'],
    canonicalArtifacts: [
      'docs/address-morphism-theory-v2/',
      'src/lib/addressMorphismV2Compatibility.ts',
      'src/lib/addressMorphismV2FormalRegistry.ts',
      'src/lib/addressMorphismV2CommutativeDiagrams.ts',
    ],
    verificationCommands: [
      'npm run verify:address-morphism-expansion',
      'npm run verify:address-morphism-v2-compatibility',
    ],
    creationBoundary: {
      localScaffoldOnly: true,
      remoteCreationRequiresExplicitUserRequest: true,
      productionTrafficAllowed: false,
      rawAddressMaterialAllowed: false,
    },
    nonClaims: [
      'Address morphism compatibility is not a deliverability, residence, identity, or KYC guarantee.',
      'Loss certificates describe transformation risk; they do not repair missing or incorrect source data.',
      'The repository target does not authorize creating, deleting, pushing, or opening remote GitHub resources.',
    ],
  },
];

function buildSharedRepositoryTemplateFiles(target: AddressResearchRepositoryTarget): AddressResearchRepositoryTemplateFile[] {
  return [
    {
      path: 'README.md',
      purpose: `${target.repository} public entrypoint explaining role, canonical domains, local verification, and non-claims.`,
      requiredSections: ['Purpose', 'Canonical Domains', 'Verification', 'Non-Claims', 'Remote Action Boundary'],
      sourceArtifacts: target.canonicalArtifacts,
      safetyNotes: target.nonClaims,
    },
    {
      path: 'package.json',
      purpose: 'Minimal package manifest with local verification scripts only.',
      requiredSections: ['name', 'version', 'type', 'scripts'],
      sourceArtifacts: ['src/lib/addressResearchSystematization.ts'],
      safetyNotes: [
        'Do not publish packages until release ownership, license, and CI gates are separately reviewed.',
        'Do not add deployment, push, repository creation, or production traffic scripts.',
      ],
    },
    {
      path: 'docs/repository-boundary.md',
      purpose: 'Repository boundary note that separates research claims from product, identity, delivery, and production-readiness claims.',
      requiredSections: ['Scope', 'Out of Scope', 'Canonical Source Artifacts', 'Remote GitHub Boundary'],
      sourceArtifacts: target.canonicalArtifacts,
      safetyNotes: target.nonClaims,
    },
    {
      path: 'docs/non-claims.md',
      purpose: 'Release-facing non-claim ledger for publication safety and grant/OSS review.',
      requiredSections: ['Non-Claims', 'Blocked Claims', 'Evidence Required Before Stronger Claims'],
      sourceArtifacts: ['docs/research/address-information-science-systematization-ja.md'],
      safetyNotes: [
        ...target.nonClaims,
        'Do not claim complete global address data, production readiness, or legal identity assurance.',
      ],
    },
    {
      path: 'src/repositoryRegistry.ts',
      purpose: 'Executable registry export for domains, artifacts, verification commands, and safety boundary metadata.',
      requiredSections: ['repository', 'canonicalDomainIds', 'canonicalArtifacts', 'verificationCommands', 'creationBoundary'],
      sourceArtifacts: ['src/lib/addressResearchSystematization.ts'],
      safetyNotes: target.nonClaims,
    },
    {
      path: 'tests/repository-boundary.test.ts',
      purpose: 'Local node:test gate that checks repo boundary, non-claims, verification script names, and blocked material policy.',
      requiredSections: ['boundary validation', 'non-claim assertions', 'blocked material assertions', 'no remote action assertions'],
      sourceArtifacts: ['src/repositoryRegistry.ts'],
      safetyNotes: [
        'Tests must use synthetic or metadata-only fixtures.',
        'Tests must not call remote GitHub APIs, carriers, identity providers, or production services.',
      ],
    },
  ];
}

export function buildAddressResearchRepositoryTemplates(
  system = buildAddressResearchSystematization(),
): AddressResearchRepositoryTemplate[] {
  return system.repositoryTargets.map(target => ({
    repository: target.repository,
    packageName: `@agid/${target.repository}`,
    version: '0.1.0',
    readinessClaim: 'local-scaffold-only',
    localOnly: true,
    remoteActionsAllowed: false,
    blockedMaterials: [...REPOSITORY_TEMPLATE_BLOCKED_MATERIALS],
    verificationCommands: [
      ...target.verificationCommands,
      'npm run verify:repository-boundary',
    ],
    files: buildSharedRepositoryTemplateFiles(target),
  }));
}

export function validateAddressResearchRepositoryTemplates(
  templates = buildAddressResearchRepositoryTemplates(),
  system = buildAddressResearchSystematization(),
): string[] {
  const errors: string[] = [];
  const targetByRepository = new Map(system.repositoryTargets.map(target => [target.repository, target]));
  const seenRepositories = new Set<string>();

  for (const template of templates) {
    const target = targetByRepository.get(template.repository);
    if (!target) errors.push(`${template.repository}: no matching repository target`);
    if (seenRepositories.has(template.repository)) errors.push(`${template.repository}: duplicate template`);
    seenRepositories.add(template.repository);
    if (!template.localOnly) errors.push(`${template.repository}: template must remain local only`);
    if (template.remoteActionsAllowed) errors.push(`${template.repository}: template must not allow remote actions`);
    if (template.readinessClaim !== 'local-scaffold-only') errors.push(`${template.repository}: invalid readiness claim`);
    if (!/^@agid\/[a-z0-9-]+$/.test(template.packageName)) errors.push(`${template.repository}: invalid package name`);
    for (const blockedMaterial of REPOSITORY_TEMPLATE_BLOCKED_MATERIALS) {
      if (!template.blockedMaterials.includes(blockedMaterial)) {
        errors.push(`${template.repository}: missing blocked material ${blockedMaterial}`);
      }
    }
    for (const requiredCommand of target?.verificationCommands ?? []) {
      if (!template.verificationCommands.includes(requiredCommand)) {
        errors.push(`${template.repository}: missing target verification command ${requiredCommand}`);
      }
    }
    for (const requiredPath of ['README.md', 'package.json', 'docs/non-claims.md', 'src/repositoryRegistry.ts', 'tests/repository-boundary.test.ts']) {
      if (!template.files.some(file => file.path === requiredPath)) errors.push(`${template.repository}: missing template file ${requiredPath}`);
    }
    for (const file of template.files) {
      if (file.path.startsWith('/') || file.path.includes('..')) errors.push(`${template.repository}: unsafe template path ${file.path}`);
      if (file.requiredSections.length === 0) errors.push(`${template.repository}:${file.path}: missing required sections`);
      if (file.safetyNotes.length === 0) errors.push(`${template.repository}:${file.path}: missing safety notes`);
    }
    if (template.repository === 'address-morphism-theory') {
      const safetyText = template.files.flatMap(file => file.safetyNotes).join(' ');
      if (!/deliverability|identity|KYC/i.test(safetyText)) {
        errors.push('address-morphism-theory: template must preserve deliverability and identity non-claims');
      }
    }
  }

  for (const target of system.repositoryTargets) {
    if (!seenRepositories.has(target.repository)) errors.push(`${target.repository}: missing template`);
  }

  return errors;
}

export function buildAddressResearchSystematization(): AddressResearchSystematization {
  return {
    version: ADDRESS_RESEARCH_SYSTEMATIZATION_VERSION,
    disciplineNameJa: '住所情報学',
    disciplineNameEn: 'Address Information Science and Engineering',
    thesis:
      '住所情報学は、住所を文字列ではなく、表現、参照対象、証拠、時間、品質、プライバシー、認証、配送制約を持つ情報対象として研究する学問である。',
    thickeningLadder: [
      'name the object of study',
      'separate primitives and types',
      'state axioms and invariants',
      'collect counterexamples',
      'define metrics',
      'publish synthetic fixtures',
      'turn definitions into executable specs',
      'write non-claims before claims',
      'connect to AddressQL and implementation tests',
    ],
    domains: ADDRESS_RESEARCH_DOMAINS,
    bridges: ADDRESS_RESEARCH_BRIDGES,
    publicationTracks: ADDRESS_RESEARCH_PUBLICATION_TRACKS,
    repositoryTargets: ADDRESS_RESEARCH_REPOSITORY_TARGETS,
    commonNonClaims: [
      '住所情報学は全世界の住所完全データを保有しているとは主張しない。',
      '正規化、検索、検証、証明、配送可否を同一の成功条件として扱わない。',
      'ZK、VC、DID、IDは誤った住所解決や低品質sourceを自動修復しない。',
    ],
  };
}

export function validateAddressResearchSystematization(
  system = buildAddressResearchSystematization(),
): string[] {
  const errors: string[] = [];
  const expectedIds: AddressResearchDomainId[] = [
    'address-data-model',
    'address-normalization-theory',
    'address-search-theory',
    'address-index-theory',
    'address-morphism-theory',
    'address-validation-theory',
    'address-privacy-theory',
    'address-authentication-theory',
    'address-update-history-theory',
    'address-distributed-database-theory',
  ];
  const ids = new Set(system.domains.map(domain => domain.id));

  for (const expectedId of expectedIds) {
    if (!ids.has(expectedId)) {
      errors.push(`missing domain: ${expectedId}`);
    }
  }

  for (const domain of system.domains) {
    if (!domain.objectOfStudy) errors.push(`${domain.id}: missing object of study`);
    if (domain.primitives.length < 3) errors.push(`${domain.id}: needs at least three primitives`);
    if (domain.axioms.length < 2) errors.push(`${domain.id}: needs at least two axioms`);
    if (domain.invariants.length < 2) errors.push(`${domain.id}: needs invariants`);
    if (domain.counterexamples.length < 2) errors.push(`${domain.id}: needs counterexamples`);
    if (domain.metrics.length < 2) errors.push(`${domain.id}: needs metrics`);
    if (domain.executableSpecs.length < 1) errors.push(`${domain.id}: needs executable specs`);
    if (domain.fixtures.length < 1) errors.push(`${domain.id}: needs fixtures`);
    if (domain.nonClaims.length < 1) errors.push(`${domain.id}: needs non-claims`);

    for (const dependency of domain.dependsOn) {
      if (!ids.has(dependency)) {
        errors.push(`${domain.id}: unknown dependency ${dependency}`);
      }
    }
  }

  for (const target of ['AddressQL', 'Address Morphism Theory', 'Address Login', 'AGID/AOID', 'Skipship']) {
    if (!system.bridges.some(bridge => bridge.target === target)) {
      errors.push(`missing bridge: ${target}`);
    }
  }

  if (!system.publicationTracks.some(track => track.id === 'foundations')) {
    errors.push('missing foundations publication track');
  }
  const repositoryNames = new Set(system.repositoryTargets.map(target => target.repository));
  for (const requiredRepository of ['address-research', 'address-morphism-theory'] as const) {
    if (!repositoryNames.has(requiredRepository)) {
      errors.push(`missing repository target: ${requiredRepository}`);
    }
  }
  for (const target of system.repositoryTargets) {
    if (target.canonicalDomainIds.length === 0) errors.push(`${target.repository}: missing canonical domains`);
    if (target.canonicalArtifacts.length < 2) errors.push(`${target.repository}: needs at least two canonical artifacts`);
    if (target.verificationCommands.length === 0) errors.push(`${target.repository}: missing verification commands`);
    if (!target.creationBoundary.localScaffoldOnly) errors.push(`${target.repository}: must remain local-scaffold-only`);
    if (!target.creationBoundary.remoteCreationRequiresExplicitUserRequest) {
      errors.push(`${target.repository}: remote creation must require explicit current user request`);
    }
    if (target.creationBoundary.productionTrafficAllowed) errors.push(`${target.repository}: must not allow production traffic`);
    if (target.creationBoundary.rawAddressMaterialAllowed) errors.push(`${target.repository}: must not allow raw address material`);
    if (!target.nonClaims.some(nonClaim => /GitHub|remote/i.test(nonClaim))) {
      errors.push(`${target.repository}: must include remote action non-claim`);
    }
    for (const domainId of target.canonicalDomainIds) {
      if (!ids.has(domainId)) errors.push(`${target.repository}: unknown canonical domain ${domainId}`);
    }
  }
  const morphismTarget = system.repositoryTargets.find(target => target.repository === 'address-morphism-theory');
  if (!morphismTarget?.canonicalDomainIds.includes('address-morphism-theory')) {
    errors.push('address-morphism-theory target must own the morphism domain');
  }
  if (!morphismTarget?.nonClaims.some(nonClaim => /deliverability|identity|KYC/i.test(nonClaim))) {
    errors.push('address-morphism-theory target must reject deliverability and identity guarantees');
  }
  for (const templateError of validateAddressResearchRepositoryTemplates(
    buildAddressResearchRepositoryTemplates(system),
    system,
  )) {
    errors.push(`repository-template:${templateError}`);
  }
  if (!system.commonNonClaims.some(nonClaim => /完全データ/.test(nonClaim))) {
    errors.push('common non-claims must reject global completeness claims');
  }
  if (/guarantees all global addresses|complete global address database/i.test(system.thesis)) {
    errors.push('thesis contains unsafe global-completeness language');
  }

  return errors;
}

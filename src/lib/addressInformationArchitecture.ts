export const ADDRESS_INFORMATION_ARCHITECTURE_VERSION = 'address-information-architecture-v1';

export type AddressInformationConceptStatus =
  | 'implemented'
  | 'partial'
  | 'planned';

export type AddressInformationConceptId =
  | 'entity-resolution'
  | 'temporal-database'
  | 'event-sourcing'
  | 'crdt-vector-clock'
  | 'merkle-transparency-log'
  | 'bloom-cuckoo-filter'
  | 'inverted-index'
  | 'spatial-index'
  | 'cqrs'
  | 'cap-consistency'
  | 'state-machine'
  | 'access-control'
  | 'differential-privacy'
  | 'property-based-testing'
  | 'formal-verification';

export type AddressInformationArchitectureConcept = {
  id: AddressInformationConceptId;
  name: string;
  status: AddressInformationConceptStatus;
  purpose: string;
  useCases: string[];
  implementationRefs: string[];
  verificationRefs: string[];
  privacySafeguards: string[];
  nextSteps: string[];
};

export type AddressInformationArchitectureSummary = {
  version: typeof ADDRESS_INFORMATION_ARCHITECTURE_VERSION;
  total: number;
  implemented: number;
  partial: number;
  planned: number;
  privacyCritical: number;
  implementedConceptIds: AddressInformationConceptId[];
  partialConceptIds: AddressInformationConceptId[];
  plannedConceptIds: AddressInformationConceptId[];
  highestPriorityNextSteps: string[];
};

export type AddressInformationArchitectureValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

const CONCEPTS: AddressInformationArchitectureConcept[] = [
  {
    id: 'entity-resolution',
    name: 'Entity Resolution',
    status: 'implemented',
    purpose: '表記ゆれ住所、別名、旧住所、翻訳住所を同一実体候補へ寄せ、曖昧・衝突・未解決を明示する。',
    useCases: ['住所登録補助', 'PID発行前クラスタ', '配送先再照合', '多言語住所統合'],
    implementationRefs: ['src/lib/addressEntityResolution.ts', 'src/lib/addressResolutionSystem.ts'],
    verificationRefs: ['src/lib/addressEntityResolution.test.ts', 'src/lib/addressResolutionSystem.test.ts'],
    privacySafeguards: ['raw address / raw AGID / raw AOIDを出力せず、fingerprintとcommitment参照だけを返す'],
    nextSteps: ['配送履歴、住所訂正、公式郵便番号候補を同じ候補形式へ統一する'],
  },
  {
    id: 'temporal-database',
    name: 'Temporal Database',
    status: 'implemented',
    purpose: '住所変更、行政変更、PID merge/split、履歴正当性を時点付きsnapshotで参照できるようにする。',
    useCases: ['旧住所から現住所への照合', 'PID lineage', '監査時点の再現', '行政変更対応'],
    implementationRefs: ['src/server/addressResolutionLedgerStore.ts', 'db/address-resolution-ledger.sqlite.sql', 'db/address-resolution-ledger.postgres.sql', 'db/address-resolution-ledger.mongodb.md'],
    verificationRefs: ['src/server/addressResolutionLedgerStore.test.ts', 'src/server/routes/addressResolutionSystemRoutes.test.ts'],
    privacySafeguards: ['temporal snapshotにはcanonical住所本文を保存せず、commitment、eventHash、payloadHashを保存する'],
    nextSteps: ['PID merge/split専用イベント型をUIとAPIから発行できるようにする'],
  },
  {
    id: 'event-sourcing',
    name: 'Event Sourcing',
    status: 'implemented',
    purpose: '登録、修正、配送、失効、監査をappend-only eventとして残し、後から再検証できるようにする。',
    useCases: ['住所解決監査', '配送完了再照合', 'credential失効', '住所訂正履歴'],
    implementationRefs: ['src/server/addressResolutionLedgerStore.ts', 'docs/address-resolution-system.md', 'db/address-resolution-ledger.mongodb.md'],
    verificationRefs: ['src/server/addressResolutionLedgerStore.test.ts'],
    privacySafeguards: ['イベントpayloadはprivacy check済みJSONとhashを保存し、生住所や受取人情報を保存しない'],
    nextSteps: ['配送ハンドオフ、住所訂正、credential失効を実イベントとしてルーティングする'],
  },
  {
    id: 'crdt-vector-clock',
    name: 'CRDT / Vector Clock',
    status: 'implemented',
    purpose: 'POSや災害現場のオフライン同期、衝突検出、後続監査へのhandoffを行う。',
    useCases: ['Mode 0 POS', '災害現場端末', '倉庫スキャナ', '住所訂正の遅延同期'],
    implementationRefs: ['src/lib/addressOfflineSyncCrdt.ts', 'db/address-offline-sync-crdt.sqlite.sql', 'db/address-offline-sync-crdt.postgres.sql'],
    verificationRefs: ['src/lib/addressOfflineSyncCrdt.test.ts'],
    privacySafeguards: ['sensitive fieldはpublicValue禁止でcommitment必須、競合はaudit-requiredにする'],
    nextSteps: ['POS offline usage ledgerと住所登録sync queueへCRDT envelopeを接続する'],
  },
  {
    id: 'merkle-transparency-log',
    name: 'Merkle Tree / Transparency Log',
    status: 'partial',
    purpose: 'issuer、失効、住所台帳、検証結果の改ざん検出を行う。',
    useCases: ['issuer key transparency', 'revocation root', 'ZK public input', '監査ログ固定'],
    implementationRefs: ['src/lib/addressInternetProtocols.ts', 'src/lib/addressResolutionSystem.ts'],
    verificationRefs: ['src/lib/addressInternetProtocols.test.ts'],
    privacySafeguards: ['透明ログにはpublic key commitmentやroot/checkpointを置き、個人住所やAGID本文を置かない'],
    nextSteps: ['generic Merkle accumulator moduleを追加し、revocation/freshness rootとledger checkpointを同一形式に寄せる'],
  },
  {
    id: 'bloom-cuckoo-filter',
    name: 'Bloom Filter / Cuckoo Filter',
    status: 'planned',
    purpose: '使用済みnullifier、重複候補、失効チェックを高速化する。',
    useCases: ['高負荷POS', '大量配送QR', '支援物資の二重受取防止', 'offline used set precheck'],
    implementationRefs: [],
    verificationRefs: [],
    privacySafeguards: ['filter inputはdomain-separated commitment/nullifierのみとし、生住所やAGIDを入れない'],
    nextSteps: ['false-positive率を設定可能なused-nullifier filterを作り、正確台帳確認の前段に置く'],
  },
  {
    id: 'inverted-index',
    name: 'Inverted Index',
    status: 'implemented',
    purpose: '多言語地名検索、郵便番号検索、住所補完、自然地物名検索を高速化する。',
    useCases: ['住所検索', '言語タブ切替', '地名alias検索', '郵便番号補完'],
    implementationRefs: ['src/lib/spatialAddressIndex.ts', 'src/lib/searchQuery.ts'],
    verificationRefs: ['src/lib/spatialAddressIndex.test.ts', 'src/lib/advancedSearch.test.ts'],
    privacySafeguards: ['public indexには公開可能な住所recordかcommitmentだけを置き、AOID private descriptorは置かない'],
    nextSteps: ['言語別token weightと国別住所format coverageをindex rankingへ統合する'],
  },
  {
    id: 'spatial-index',
    name: 'Spatial Index',
    status: 'implemented',
    purpose: 'R-tree、QuadTree、S2/H3相当セルで地理検索を高速化する。',
    useCases: ['AGID逆ジオコーディング', '近傍候補生成', '海上/島/山地/砂漠の候補探索', '配送可能範囲検索'],
    implementationRefs: ['src/lib/spatialAddressIndex.ts', 'db/spatial-address-index.sqlite.sql', 'db/spatial-address-index.postgres.sql'],
    verificationRefs: ['src/lib/spatialAddressIndex.test.ts'],
    privacySafeguards: ['高リスク用途では精密AGIDや座標をpublic indexへ出さず、coarse cellまたはcommitmentを使う'],
    nextSteps: ['PostGIS/R-tree、MongoDB 2dsphere、Redis GEO adapterへ差し替える境界を実装する'],
  },
  {
    id: 'cqrs',
    name: 'CQRS',
    status: 'partial',
    purpose: '登録用DBと検索・表示用viewを分け、書込監査と読込速度を両立する。',
    useCases: ['高負荷住所検索', 'POS即時判定', '監査ledger', '住所表示cache'],
    implementationRefs: ['src/server/addressResolutionLedgerStore.ts', 'src/lib/spatialAddressIndex.ts'],
    verificationRefs: ['src/server/addressResolutionLedgerStore.test.ts', 'src/lib/spatialAddressIndex.test.ts'],
    privacySafeguards: ['write modelはcommitment/event中心、read modelは公開可能metadataまたはredacted viewだけにする'],
    nextSteps: ['AddressResolution write modelとAddressDisplay read modelの更新pipelineを明示する'],
  },
  {
    id: 'cap-consistency',
    name: 'CAP / Consistency Model',
    status: 'partial',
    purpose: 'ローカルPOS、中央API、公開台帳の整合性と可用性のトレードオフを明示する。',
    useCases: ['Mode 0/1/2/3/4切替', '災害時offline', '後同期衝突', 'registry遅延'],
    implementationRefs: ['docs/hybrid-architecture.md', 'docs/address-resolution-system.md', 'src/lib/addressOfflineSyncCrdt.ts'],
    verificationRefs: ['src/lib/addressOfflineSyncCrdt.test.ts'],
    privacySafeguards: ['offline可用性を優先しても、後同期ではcommitment-only envelopeと監査衝突に落とす'],
    nextSteps: ['mode別のconsistency policyをコード化し、POS設定から選択できるようにする'],
  },
  {
    id: 'state-machine',
    name: 'State Machine',
    status: 'partial',
    purpose: '送り状、配送ハンドオフ、PID発行、AOID権限状態を厳密化する。',
    useCases: ['Address Valid -> Carrier Accepted -> Recipient Controlled -> Delivery Completed', 'AOID権限委譲', 'PID merge/split', '例外監査'],
    implementationRefs: ['src/lib/shippingLabelQr.ts', 'src/lib/posOperationalControls.ts'],
    verificationRefs: ['src/lib/shippingLabelQr.test.ts', 'src/lib/posOperationalControls.test.ts'],
    privacySafeguards: ['状態遷移receiptにはproof codeや実住所を保存せず、署名・commitment・時刻・端末証跡を保存する'],
    nextSteps: ['状態遷移表を単一moduleへ抽出し、UIボタンとAPIが同じtransition guardを使うようにする'],
  },
  {
    id: 'access-control',
    name: 'Access Control',
    status: 'partial',
    purpose: '用途別開示、配送業者権限、管理者権限、監査権限を分離する。',
    useCases: ['POS staff role', '配送業者読み取り権限', 'AOID委譲', '監査レポート印刷'],
    implementationRefs: ['src/lib/posOperationalControls.ts', 'src/lib/addressInternetProtocols.ts'],
    verificationRefs: ['src/lib/posOperationalControls.test.ts', 'src/lib/addressInternetProtocols.test.ts'],
    privacySafeguards: ['role/scopeごとに表示・印刷・署名・監査の権限を分け、purpose scopeを検証する'],
    nextSteps: ['API route middlewareへrole/scope検査を追加し、UIだけの権限制御にしない'],
  },
  {
    id: 'differential-privacy',
    name: 'Differential Privacy',
    status: 'planned',
    purpose: '統計や学習に住所個人情報を漏らさない。',
    useCases: ['住所表示品質統計', '翻訳/補完フィードバック', '地域別改善レポート', '学習用aggregate'],
    implementationRefs: [],
    verificationRefs: [],
    privacySafeguards: ['個票住所を学習公開せず、集計値にnoise、k-anonymity threshold、地域coarseningをかける'],
    nextSteps: ['address feedback analyticsへepsilon/noise budgetつきaggregate builderを追加する'],
  },
  {
    id: 'property-based-testing',
    name: 'Property-based Testing',
    status: 'planned',
    purpose: 'AGID生成、住所正規化、逆ジオコーディングを大量入力で検証する。',
    useCases: ['AGID encode/decode不変条件', '住所normalizationの冪等性', '境界/極域/海上テスト', 'CRDT merge法則'],
    implementationRefs: [],
    verificationRefs: [],
    privacySafeguards: ['生成データはsynthetic/fuzzed inputを使い、実住所や個人情報をfixtureにしない'],
    nextSteps: ['fast-check等を使わず軽量deterministic generatorから始め、CIで1000件程度の不変条件を回す'],
  },
  {
    id: 'formal-verification',
    name: 'Formal Verification',
    status: 'partial',
    purpose: 'Lean/TLA+/Alloyで不可能性定理や状態遷移を検証する。',
    useCases: ['住所参照不可能性', '候補欠落限界', 'lineage split/merge', 'ZK policy gate', 'state transition safety'],
    implementationRefs: ['formal/AMTCore.lean', 'formal/AMTPaperExtensions.lean', 'formal/GeneratedGisCertificate.lean'],
    verificationRefs: ['docs/address-morphism-lean-gis-cross-verification.md', 'docs/address-morphism-expectation-verification-report.md'],
    privacySafeguards: ['形式検証は抽象性質を証明し、実世界住所データの正しさを過大主張しない'],
    nextSteps: ['POS handoff state machineをTLA+/Alloy相当の小モデルとして追加する'],
  },
];

export function getAddressInformationArchitectureConcepts(): AddressInformationArchitectureConcept[] {
  return CONCEPTS.map(concept => ({
    ...concept,
    useCases: [...concept.useCases],
    implementationRefs: [...concept.implementationRefs],
    verificationRefs: [...concept.verificationRefs],
    privacySafeguards: [...concept.privacySafeguards],
    nextSteps: [...concept.nextSteps],
  }));
}

export function getAddressInformationArchitectureConcept(
  id: AddressInformationConceptId,
): AddressInformationArchitectureConcept {
  const concept = CONCEPTS.find(item => item.id === id);
  if (!concept) throw new Error(`unknown-address-information-concept:${id}`);
  return getAddressInformationArchitectureConcepts().find(item => item.id === id)!;
}

export function summarizeAddressInformationArchitecture(): AddressInformationArchitectureSummary {
  const concepts = getAddressInformationArchitectureConcepts();
  const byStatus = (status: AddressInformationConceptStatus) => concepts
    .filter(concept => concept.status === status)
    .map(concept => concept.id);
  const partial = byStatus('partial');
  const planned = byStatus('planned');

  return {
    version: ADDRESS_INFORMATION_ARCHITECTURE_VERSION,
    total: concepts.length,
    implemented: byStatus('implemented').length,
    partial: partial.length,
    planned: planned.length,
    privacyCritical: concepts.filter(concept => concept.privacySafeguards.length > 0).length,
    implementedConceptIds: byStatus('implemented'),
    partialConceptIds: partial,
    plannedConceptIds: planned,
    highestPriorityNextSteps: [
      ...partial.map(id => getAddressInformationArchitectureConcept(id).nextSteps[0]),
      ...planned.map(id => getAddressInformationArchitectureConcept(id).nextSteps[0]),
    ].filter((step): step is string => Boolean(step)).slice(0, 8),
  };
}

export function validateAddressInformationArchitecture(
  concepts = getAddressInformationArchitectureConcepts(),
): AddressInformationArchitectureValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();

  for (const concept of concepts) {
    if (seen.has(concept.id)) errors.push(`duplicate-concept:${concept.id}`);
    seen.add(concept.id);
    if (!concept.name.trim()) errors.push(`missing-name:${concept.id}`);
    if (!concept.purpose.trim()) errors.push(`missing-purpose:${concept.id}`);
    if (concept.useCases.length === 0) errors.push(`missing-use-cases:${concept.id}`);
    if (concept.privacySafeguards.length === 0) errors.push(`missing-privacy-safeguard:${concept.id}`);

    if (concept.status === 'implemented') {
      if (concept.implementationRefs.length === 0) errors.push(`implemented-without-implementation-ref:${concept.id}`);
      if (concept.verificationRefs.length === 0) errors.push(`implemented-without-verification-ref:${concept.id}`);
    }

    if (concept.status !== 'implemented' && concept.nextSteps.length === 0) {
      errors.push(`non-implemented-without-next-step:${concept.id}`);
    }

    if (concept.status === 'planned' && concept.implementationRefs.length > 0) {
      warnings.push(`planned-concept-has-implementation-ref:${concept.id}`);
    }
  }

  if (concepts.length < 15) errors.push('missing-required-concepts');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

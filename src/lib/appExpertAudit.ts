import { APP_SURFACES, type AppSurfaceId } from './appNavigation';

export const MULTIDISCIPLINARY_APP_AUDIT_VERSION = 'agid-multidisciplinary-app-audit-v1';

export type ExpertDisciplineId =
  | 'product-strategy'
  | 'service-design'
  | 'frontend-architecture'
  | 'accessibility'
  | 'security'
  | 'privacy'
  | 'cryptography-zk'
  | 'gis-address-science'
  | 'postal-carrier-ops'
  | 'field-humanitarian-ops'
  | 'legal-compliance'
  | 'sre-platform'
  | 'qa-research';

export type AppAuditPriority = 'P0' | 'P1' | 'P2';
export type AppAuditSeverity = 'critical' | 'high' | 'medium' | 'low';

export type ExpertDiscipline = {
  id: ExpertDisciplineId;
  label: string;
  auditQuestion: string;
};

export type AppExpertConcern = {
  severity: AppAuditSeverity;
  discipline: ExpertDisciplineId;
  finding: string;
  improvement: string;
  evidenceRequired: string;
};

export type AppExpertReview = {
  surfaceId: AppSurfaceId;
  priority: AppAuditPriority;
  targetMaturity: 'research-prototype' | 'operator-demo' | 'field-pilot' | 'production-candidate';
  reviewerRoles: ExpertDisciplineId[];
  concerns: AppExpertConcern[];
  requiredExperiments: string[];
  testGates: string[];
  decision: 'build-now' | 'mature-next' | 'narrow-scope' | 'keep-reference-only';
};

export type MultidisciplinaryAppAuditSummary = {
  version: typeof MULTIDISCIPLINARY_APP_AUDIT_VERSION;
  appCount: number;
  p0: number;
  p1: number;
  p2: number;
  criticalFindings: number;
  highFindings: number;
  productionCandidates: number;
  fieldPilots: number;
};

export type MultidisciplinaryAppAuditValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export const EXPERT_DISCIPLINES: ExpertDiscipline[] = [
  { id: 'product-strategy', label: 'Product strategy', auditQuestion: 'Is this app a clear product surface, SDK surface, or internal capability?' },
  { id: 'service-design', label: 'Service design / UX research', auditQuestion: 'Can a real user finish the task under pressure without reading documentation?' },
  { id: 'frontend-architecture', label: 'Frontend architecture', auditQuestion: 'Is the UI split, lazy-loaded, testable, and fast enough for repeated use?' },
  { id: 'accessibility', label: 'Accessibility', auditQuestion: 'Does the app work with keyboard, screen readers, contrast, language, and error recovery?' },
  { id: 'security', label: 'Security engineering', auditQuestion: 'Are attacker-controlled inputs, replay, device trust, secrets, and logs bounded?' },
  { id: 'privacy', label: 'Privacy engineering / DPIA', auditQuestion: 'Does the app avoid raw address exposure and provide purpose-limited disclosure?' },
  { id: 'cryptography-zk', label: 'Applied cryptography / ZK', auditQuestion: 'Are commitments, nullifiers, signatures, freshness, and proof scopes domain-separated?' },
  { id: 'gis-address-science', label: 'GIS and address science', auditQuestion: 'Are boundaries, postal formats, geocoding, language, and uncertainty represented honestly?' },
  { id: 'postal-carrier-ops', label: 'Postal and carrier operations', auditQuestion: 'Can clerks, carriers, warehouses, lockers, and returns use the decision safely?' },
  { id: 'field-humanitarian-ops', label: 'Field and humanitarian operations', auditQuestion: 'Does the app survive offline, high-risk, low-literacy, and low-device situations?' },
  { id: 'legal-compliance', label: 'Legal and compliance', auditQuestion: 'Are consent, retention, audit, export, delete, and regulated claims defensible?' },
  { id: 'sre-platform', label: 'SRE / platform', auditQuestion: 'Can the surface be monitored, rolled back, cached, rate-limited, and operated safely?' },
  { id: 'qa-research', label: 'QA / research validation', auditQuestion: 'Are claims backed by fixtures, test vectors, pilots, and reproducible evaluation?' },
];

const BASE_REVIEWERS: ExpertDisciplineId[] = [
  'service-design',
  'frontend-architecture',
  'accessibility',
  'security',
  'privacy',
  'qa-research',
];

function concern(
  severity: AppAuditSeverity,
  discipline: ExpertDisciplineId,
  finding: string,
  improvement: string,
  evidenceRequired: string,
): AppExpertConcern {
  return { severity, discipline, finding, improvement, evidenceRequired };
}

export const APP_EXPERT_REVIEWS = [
  {
    surfaceId: 'map-workspace',
    priority: 'P0',
    targetMaturity: 'production-candidate',
    reviewerRoles: [...BASE_REVIEWERS, 'gis-address-science', 'postal-carrier-ops'],
    concerns: [
      concern('high', 'gis-address-science', '住所表示、自然地名、境界付近、海上/極地セルの不確実性が主画面で混ざる。', '表示結果に resolved / partial / review / restricted の状態と根拠ソースを分けて出す。', '大陸・島嶼・海域・極地の代表サンプルで国別住所表示テストを再現可能にする。'),
      concern('high', 'frontend-architecture', '地図、検索、住所登録、各モーダルが同一巨大画面に寄りやすい。', '重い住所/言語/検索処理を遅延読み込みし、クリック時だけAGID確定表示する設計に寄せる。', '初回表示、検索、AGIDクリック、言語切替の p95/p99 を計測する。'),
      concern('medium', 'privacy', '地図上の公開AGID表示は高リスク地域で位置推定を強める可能性がある。', 'hoverは薄い選択枠だけ、AGID表示は明示クリック後、high-riskでは粗いAGID-Sを優先する。', 'no-raw-addressログテストと高リスクモードのスクリーン状態テストを追加する。'),
    ],
    requiredExperiments: ['国別住所表示の代表点テスト', 'map interaction p95/p99 benchmark', 'high-risk display review'],
    testGates: ['hover does not reveal AGID', 'language tab changes display text', 'restricted cells do not show precise public address'],
    decision: 'mature-next',
  },
  {
    surfaceId: 'address-registration',
    priority: 'P0',
    targetMaturity: 'production-candidate',
    reviewerRoles: [...BASE_REVIEWERS, 'gis-address-science', 'legal-compliance', 'postal-carrier-ops'],
    concerns: [
      concern('critical', 'privacy', '住所登録は最も個人情報リスクが高く、AI学習やフィードバックが不透明だとOSS信頼を失う。', '学習はclosed/localを既定にし、外部学習・共有・住所翻訳フィードバックは明示同意とredaction後に限定する。', '登録payloadに raw address を含めない公開ログ/同期テスト、同意なし外部送信なしのテストを必須化する。'),
      concern('high', 'postal-carrier-ops', 'P.O. Box、オートロック、配送不可地域、住所不備が登録時に構造化されないとPOSで拒否判断できない。', '住所種別、P.O. Box、オートロック、入口、配送制約、修正履歴を登録ステップに分離する。', '配送可否fixtureと修正フィードバックからReview Consoleに回るケースを検証する。'),
      concern('high', 'service-design', '登録フォームが長くなるほど一般ユーザーと現場スタッフが離脱する。', '郵便番号補完、AGID補完、OCR候補、手動修正を1画面に詰めず、段階的入力と保存復帰を提供する。', '初回ユーザビリティテストで登録成功率、修正率、所要時間を測る。'),
    ],
    requiredExperiments: ['user registration usability study', 'postal-code autocomplete accuracy test', 'closed feedback learning privacy test'],
    testGates: ['registration logs reject raw private fields', 'PO Box and autolock fields are captured before carrier use', 'manual correction creates redacted learning event'],
    decision: 'build-now',
  },
  {
    surfaceId: 'address-portal',
    priority: 'P0',
    targetMaturity: 'production-candidate',
    reviewerRoles: [...BASE_REVIEWERS, 'legal-compliance', 'field-humanitarian-ops'],
    concerns: [
      concern('critical', 'privacy', '同意、scope、取消、削除、exportが弱いとプロジェクト全体の人権・プライバシー思想が崩れる。', '接続一覧だけでなく、scope履歴、取消、削除、export、異議申し立て、危険用途レビューを一貫した状態機械にする。', '全接続状態と全データ主体権利操作のテストを追加する。'),
      concern('high', 'legal-compliance', '取消後も配送や監査側で使われる権限が残ると説明責任を果たせない。', 'revocation receipt、削除要求receipt、export receiptを発行し、Dashboard/Review/Fieldへ赤actedイベントで伝播する。', '取消後のAPI/QR/credential参照が拒否される統合テストが必要。'),
      concern('medium', 'accessibility', '権限管理画面は専門用語が多く、利用者が何を許可したか理解しづらい。', 'scopeを「配送に使う」「本人確認に使う」など用途言語で表示し、詳細は折りたたむ。', 'スクリーンリーダーと低リテラシー利用者の読解テストを行う。'),
    ],
    requiredExperiments: ['data subject rights workflow test', 'scope comprehension study', 'revocation propagation test'],
    testGates: ['revoke/delete/export are never paywalled', 'portal export is redacted', 'revoked connection cannot be reused'],
    decision: 'build-now',
  },
  {
    surfaceId: 'settings-policy',
    priority: 'P0',
    targetMaturity: 'production-candidate',
    reviewerRoles: [...BASE_REVIEWERS, 'sre-platform', 'legal-compliance'],
    concerns: [
      concern('critical', 'privacy', 'Mode 0-4、外部連携、言語、high-riskが分散すると、ユーザーが何を外へ出すか把握できない。', 'Settingsを全アプリの単一policy sourceにして、各providerで外部送信カテゴリを明示する。', 'Map/POS/Portal/Dashboard/Elementへ言語とmodeが伝播するテストを置く。'),
      concern('high', 'security', '鍵、端末、Webhook、外部APIの設定は誤設定がそのまま漏洩に直結する。', 'key reference、rotation warning、provider enable前のdata-flow preview、危険設定の確認ステップを追加する。', '設定exportに秘密値が含まれないsecret/no-rawテストが必要。'),
      concern('medium', 'service-design', '設定項目が増えすぎると現場では使えない。', '個人、POS、管理者、開発者のプリセットを分け、詳細設定はrole別に段階表示する。', 'スタッフが高リスクモードを30秒以内に有効化できるか検証する。'),
    ],
    requiredExperiments: ['cross-app language propagation', 'mode 0 local-only verification', 'provider data-flow comprehension test'],
    testGates: ['Mode 0 works without ZK/Ethereum/server', 'provider settings show outbound data categories', 'high-risk controls are free'],
    decision: 'build-now',
  },
  {
    surfaceId: 'pos-terminal',
    priority: 'P0',
    targetMaturity: 'field-pilot',
    reviewerRoles: [...BASE_REVIEWERS, 'postal-carrier-ops', 'field-humanitarian-ops', 'sre-platform'],
    concerns: [
      concern('critical', 'postal-carrier-ops', 'Scan -> Decision -> Handoff -> Report の4画面が崩れると現場判断が遅れる。', '主導線を4画面に固定し、拒否・要確認・完了・再照合レポートを大きな状態で表示し、receipt/exportはno-raw-addressを既定にする。', '店舗スタッフ、配送員、支援現場のシナリオテストとredacted receipt確認を実施する。'),
      concern('high', 'security', 'QRコピー、端末偽装、使用済み再利用、スタッフ権限ミスがそのまま不正受取になる。', 'jti、短期alias、端末署名、スタッフ権限、チャレンジ署名、使用済みnullifier確認を受付フローに入れる。', 'replay、untrusted device、offline duplicateの攻撃テストが必要。'),
      concern('high', 'accessibility', 'POSは素早い操作が必要なので小さいボタンや警告隠れは重大なUX欠陥になる。', '大きなスキャン/拒否/要確認/完了ボタン、端末診断、プリンタ/計測器状態を固定寸法で出す。', 'キーボード、タッチ、低視力、騒音環境での操作テストを行う。'),
    ],
    requiredExperiments: ['retail handoff simulation', 'QR replay test', 'device diagnostics drill'],
    testGates: ['scan decision cannot skip report receipt', 'reused jti/nullifier is rejected or review', 'staff role controls refusal/override actions', 'POS receipt export excludes raw address by default'],
    decision: 'build-now',
  },
  {
    surfaceId: 'hotel-checkin',
    priority: 'P1',
    targetMaturity: 'field-pilot',
    reviewerRoles: [...BASE_REVIEWERS, 'legal-compliance', 'postal-carrier-ops'],
    concerns: [
      concern('high', 'privacy', 'ホテルチェックインは本人確認、住所、税、領収証が集まりやすい。保存範囲を誤ると高リスク。', '短期QR、滞在目的scope、ローカル照合、不要資料の非保存、領収証のredactionを既定にする。', 'チェックイン完了後に保持されるフィールドの監査テストが必要。'),
      concern('medium', 'service-design', 'フロントスタッフの導線がPOSや住所登録と混ざると迷う。', '予約照合、住所QR読取、同意、税/領収証、完了のホテル専用ステップに分ける。', 'ホテルスタッフの3分オンボーディングテストを行う。'),
      concern('medium', 'legal-compliance', '国ごとの宿泊者名簿、税、本人確認規制が異なる。', '国別必須項目をプラグイン化し、AGID/AOIDは住所資格確認に限定する。', '国別法令要件を仕様上 optional adapter として分離した証拠が必要。'),
    ],
    requiredExperiments: ['hotel front-desk scenario test', 'retention field audit', 'receipt/tax output verification'],
    testGates: ['check-in QR expires', 'receipt redacts private address by default', 'hotel session does not expose proof secret'],
    decision: 'mature-next',
  },
  {
    surfaceId: 'field-handoff',
    priority: 'P0',
    targetMaturity: 'field-pilot',
    reviewerRoles: [...BASE_REVIEWERS, 'field-humanitarian-ops', 'postal-carrier-ops', 'sre-platform'],
    concerns: [
      concern('critical', 'field-humanitarian-ops', '現場アプリは通信断、電池不足、危険地域、低リテラシーでも機能しないと価値が出ない。', 'オフラインqueue、粗い位置、到達不可理由、受取人proof、後同期衝突レビューを最短操作で提供する。', '災害支援/配送員のoffline-firstシミュレーションが必要。'),
      concern('high', 'security', 'オフライン完了receiptは後から改ざん・重複同期される危険がある。', '端末署名、vector clock、local used ledger、sync conflict -> Review caseを入れる。', '同一receiptの二重同期、時刻改ざん、端末ID偽装テストが必要。'),
      concern('high', 'privacy', '到達不可報告が精密位置や個人宅の弱点を公開する可能性がある。', '公開報告はカテゴリと粗い地域にし、詳細は限定scopeのoperator receiptへ分離する。', 'cannot-reach public projection no-raw-addressテストを追加する。'),
    ],
    requiredExperiments: ['offline field pilot', 'sync conflict test', 'cannot-reach privacy review'],
    testGates: ['offline receipt can be created without registry', 'sync conflict becomes review case', 'high-risk mode strips precise AGID'],
    decision: 'build-now',
  },
  {
    surfaceId: 'machine-comms',
    priority: 'P1',
    targetMaturity: 'research-prototype',
    reviewerRoles: [...BASE_REVIEWERS, 'security', 'cryptography-zk', 'sre-platform'],
    concerns: [
      concern('high', 'security', '機械間AGID/AOID通信はリプレイ、権限昇格、古いcredential再利用が起きやすい。', 'message envelopeにaudience、purpose、nonce、exp、device signature、capabilityを必須化する。', 'replay/freshness/domain separationテストが必要。'),
      concern('medium', 'sre-platform', 'POS、ロッカー、ドローン、配送業者で通信プロトコルが増えると運用不能になる。', 'HTTP/MQTT/Modbusを共通状態モデルに射影し、protocol adapterは薄くする。', '同じイベントが複数adapterで同じ安全projectionになるテストを行う。'),
      concern('medium', 'service-design', '人間が監査できない機械通信は信頼されない。', 'machine receipt、human-readable reason、last successful sync、device trust badgeを出す。', '運用者が異常の理由を説明できるかテストする。'),
    ],
    requiredExperiments: ['M2M replay test', 'protocol adapter equivalence test', 'operator explainability test'],
    testGates: ['machine envelope requires nonce and exp', 'unknown device cannot claim trusted receipt', 'raw AOID is not broadcast'],
    decision: 'narrow-scope',
  },
  {
    surfaceId: 'address-dashboard',
    priority: 'P0',
    targetMaturity: 'production-candidate',
    reviewerRoles: [...BASE_REVIEWERS, 'sre-platform', 'legal-compliance', 'postal-carrier-ops'],
    concerns: [
      concern('critical', 'privacy', 'Dashboardに生ログや住所本文が入ると、監視システム化してしまう。', 'redacted event、commitment、nullifier、status、root、device refだけを扱う契約に固定する。', 'dashboard columns and export no-raw-addressテストが必要。'),
      concern('high', 'sre-platform', 'API、Webhook、issuer、端末、review、QR使用済みが一画面に見えないと本番運用できない。', 'Overviewから各tabへdrill-downできるAddress Consoleとして再構成する。', 'incident drill、webhook failure、issuer revoked、terminal offlineの運用演習を行う。'),
      concern('high', 'legal-compliance', '監査ログは証拠になるが、過剰保存すると削除権や安全配慮と衝突する。', '保持期間、legal hold、export範囲、redaction levelをpolicy化する。', 'retention and export policy fixtureが必要。'),
    ],
    requiredExperiments: ['redacted dashboard data drill', 'incident response tabletop', 'retention policy review'],
    testGates: ['dashboard export excludes raw address', 'webhook debugger verifies signature without storing body', 'issuer revocation status is visible'],
    decision: 'build-now',
  },
  {
    surfaceId: 'address-review-console',
    priority: 'P0',
    targetMaturity: 'production-candidate',
    reviewerRoles: [...BASE_REVIEWERS, 'legal-compliance', 'privacy', 'gis-address-science'],
    concerns: [
      concern('critical', 'legal-compliance', '拒否、承認、merge/split、異議申し立てに監査理由がないと研究/企業監査で落ちる。', 'case queue、case detail、redaction gate、decision receipt、appealを状態機械にする。', 'review action cannot skip reason/signatureテストが必要。'),
      concern('high', 'privacy', '審査員に最初から全証拠を見せる設計は最小開示に反する。', '初期表示はredacted evidence、必要時のみrole/scope/reason付きescalationで開く。', 'raw evidence access receiptとrole-based redactionテストを行う。'),
      concern('high', 'qa-research', '住所衝突や住所品質partialの判断は再現性が必要。', 'reason code、input evidence hash、source confidence、reviewer decisionを保存する。', '同じfixtureで同じ判定説明が出る回帰テストが必要。'),
    ],
    requiredExperiments: ['case decision reproducibility test', 'redaction escalation audit', 'appeal workflow simulation'],
    testGates: ['review decision requires reason', 'raw evidence hidden before scoped escalation', 'appeal creates linked case'],
    decision: 'build-now',
  },
  {
    surfaceId: 'developer-console',
    priority: 'P1',
    targetMaturity: 'production-candidate',
    reviewerRoles: [...BASE_REVIEWERS, 'sre-platform', 'security', 'product-strategy'],
    concerns: [
      concern('high', 'security', 'APIキー、Webhook、SDK例が実データや秘密値を含むとOSS公開時に危険。', 'test/live/local環境分離、secret scan、署名付きWebhook fixture、redacted sample payloadだけを許可する。', 'developer console sample payload secret/no-raw testsが必要。'),
      concern('high', 'product-strategy', '開発者導入体験が弱いとAddress Elementや外部連携が広がらない。', 'OpenAPI explorer、SDK snippet、launch checklist、test vector、error catalogを一つにする。', '新規開発者が30分でlocal resolverを組み込めるか測る。'),
      concern('medium', 'sre-platform', 'Webhookは本番障害の原因になりやすい。', '署名検証、再送、idempotency、dead-letter、timestamp skewを見える化する。', 'webhook replay/idempotency fixtureを追加する。'),
    ],
    requiredExperiments: ['developer onboarding study', 'webhook replay test', 'SDK fixture parity test'],
    testGates: ['sample payloads are redacted', 'webhook signatures validate timestamp and body hash', 'launch checklist blocks missing privacy gates'],
    decision: 'mature-next',
  },
  {
    surfaceId: 'agid-address-element',
    priority: 'P0',
    targetMaturity: 'production-candidate',
    reviewerRoles: [...BASE_REVIEWERS, 'product-strategy', 'security', 'gis-address-science'],
    concerns: [
      concern('critical', 'product-strategy', 'EC/CMS/買い物Agentへの普及はAddress Element次第だが、現状はアプリではなく埋め込み面として独立検証が必要。', 'React component、web component、SDK API、sandbox demo、host-page integration guideを分ける。', '外部ホストページでの埋め込みE2Eテストが必要。'),
      concern('high', 'security', '埋め込みUIは親サイトからのXSS/CSP/クリックジャック/データ窃取の影響を受ける。', 'postMessage origin check、CSP guidance、sandbox iframe option、no raw address event contractを定義する。', 'malicious host simulationとevent payload redaction testを追加する。'),
      concern('high', 'accessibility', '住所入力部品は多言語・国別フォーマット・タッチ・キーボードの品質がそのまま採用可否になる。', '国別field order、言語タブ、補完、修正、読み上げエラーをElement単体で保証する。', 'WCAG 2.2 AA相当のフォームテストを行う。'),
    ],
    requiredExperiments: ['embedded host integration test', 'malicious host event test', 'address form accessibility test'],
    testGates: ['Element never emits raw private address without explicit scope', 'country/language switching changes fields and labels', 'host origin is validated for sensitive messages'],
    decision: 'build-now',
  },
  {
    surfaceId: 'evidence-vault',
    priority: 'P1',
    targetMaturity: 'field-pilot',
    reviewerRoles: [...BASE_REVIEWERS, 'privacy', 'legal-compliance', 'security'],
    concerns: [
      concern('critical', 'privacy', '写真/PDF/OCRは最も漏洩しやすく、相手サーバーに保存しない設計が必須。', 'local-first OCR、暗号化、redaction、相手には証明だけ渡すEvidence Envelopeに限定する。', 'external upload disabled by default and encrypted-at-rest testsが必要。'),
      concern('high', 'legal-compliance', '身分証や公共料金明細は保持期限、削除、同意、証拠性の管理が必要。', 'retention policy、delete/export、legal hold、consent envelopeをEvidence単位で持つ。', '保持期限切れと削除要求のテストが必要。'),
      concern('high', 'security', 'OCR結果やプレビューがログやクラッシュレポートに流れる危険がある。', 'OCR候補は編集可能な一時データとして扱い、ログ・analytics・syncから除外する。', 'OCR candidate no-log testとredaction-before-sync testが必要。'),
    ],
    requiredExperiments: ['local OCR privacy test', 'redaction usability test', 'evidence retention audit'],
    testGates: ['external OCR upload is opt-in only', 'redaction required before share', 'proof can be exported without original document'],
    decision: 'mature-next',
  },
  {
    surfaceId: 'postal-zone-designer',
    priority: 'P1',
    targetMaturity: 'research-prototype',
    reviewerRoles: [...BASE_REVIEWERS, 'gis-address-science', 'postal-carrier-ops', 'legal-compliance'],
    concerns: [
      concern('critical', 'legal-compliance', '郵便番号設計は公的制度に見えやすく、承認なしにofficialを示すと危険。', 'simulation/draft/pilot/supplementary/officialを明確にし、Class Aでは非置換を強制し、公開区画はraw addressを符号化しない。', 'official-status guard、governance threshold test、public-code redaction testが必要。'),
      concern('high', 'gis-address-science', '国土、人口、地形、都市ID、VPL、境界、孤立住宅匿名性の検証がないと数理モデルだけになる。', 'GIS fixture、容量証明、匿名性、コード可読性、隣接Hamming距離を同じWorkspaceで見る。', '代表国タイプ別のreproducible design reportが必要。'),
      concern('high', 'postal-carrier-ops', '配送経路面と識別面が混ざると、道路変更のたびに郵便番号が揺れる。', 'identifier plane、postal partition plane、route planeをUIとデータで分離する。', 'route update does not require postal ID churnのテストが必要。'),
    ],
    requiredExperiments: ['GIS partition validation', 'postal capacity proof fixture', 'governance tabletop review'],
    testGates: ['Class A blocks replacement generation', 'VPL does not imply municipality', 'route plane is separate from postal identifier', 'public postal zone cannot expose raw address or singleton household'],
    decision: 'narrow-scope',
  },
  {
    surfaceId: 'drone-locker-ops',
    priority: 'P2',
    targetMaturity: 'research-prototype',
    reviewerRoles: [...BASE_REVIEWERS, 'field-humanitarian-ops', 'security', 'sre-platform'],
    concerns: [
      concern('critical', 'security', 'Drone OS本体へ広げると安全責任が過大になる。到達可否APIと証跡projectionに絞るべき。', 'autopilot/fleet-controlをスコープ外にし、delivery evidence、locker state、MQTT/HTTP/Modbus simulatorへ限定する。', 'scope guard test and safety disclaimer reviewが必要。'),
      concern('high', 'sre-platform', 'ロッカー/端末/ドローンはネットワーク断、重複イベント、プロトコル差で壊れやすい。', 'local simulator、idempotency、device trust、offline queue、operator receiptを共通化する。', 'MQTT/HTTP/Modbus event equivalence and duplicate event testsが必要。'),
      concern('high', 'privacy', '配送証跡や到達不可報告が精密住所・生活パターンを漏らす可能性がある。', 'public projectionは粗い状態と理由コードだけ、restricted receiptはscope付きにする。', 'public projection no precise telemetry testが必要。'),
    ],
    requiredExperiments: ['locker local simulator test', 'delivery evidence API threat review', 'restricted/public projection test'],
    testGates: ['autopilot control is out of scope', 'public evidence excludes raw telemetry', 'duplicate device event is idempotent'],
    decision: 'narrow-scope',
  },
  {
    surfaceId: 'open-source-home',
    priority: 'P1',
    targetMaturity: 'production-candidate',
    reviewerRoles: [...BASE_REVIEWERS, 'product-strategy', 'security', 'sre-platform'],
    concerns: [
      concern('high', 'product-strategy', 'OSS入口がアプリ宣伝に寄りすぎると、開発者がSpec、SDK、conformance、security gateへ到達できない。', 'HeroからTry、Docs、SDK、GitHub、Spec、Securityへ3クリック以内で到達できる構成にする。', '新規開発者がlocal resolverとSecure Address QRの入口を5分以内に見つけられるか検証する。'),
      concern('high', 'security', '公開サイトでraw住所や実運用credentialを例示すると、OSS公開時にコピーされる危険がある。', 'サンプルはcommitment、test vector、redacted receiptだけに限定し、実住所・raw AGID/AOID・秘密値を表示しない。', 'homepage sample payload no-raw-address scanとsecret scanを必須にする。'),
      concern('medium', 'sre-platform', 'OSSページが重いと地理OSSとして信頼されにくく、低帯域環境で離脱する。', 'Hero画像を最適化し、重い地図・SDKデータは遅延読み込みにする。', 'mobile low-bandwidth screenshotとbundle/chunk budgetを確認する。'),
    ],
    requiredExperiments: ['developer first-click test', 'homepage no-raw sample scan', 'low-bandwidth hero performance test'],
    testGates: ['homepage examples are redacted', 'Spec and SDK links are visible above the fold', 'hero works without loading private data'],
    decision: 'mature-next',
  },
  {
    surfaceId: 'oracle-opera-hotel-address',
    priority: 'P1',
    targetMaturity: 'field-pilot',
    reviewerRoles: [...BASE_REVIEWERS, 'legal-compliance', 'postal-carrier-ops', 'sre-platform'],
    concerns: [
      concern('critical', 'privacy', 'OPERA/OHIP連携はホテル予約、氏名、住所、宿泊情報を扱うため、raw addressやOracle raw errorをUIやログへ出すと重大リスクになる。', '画面はsafe preview、endpoint mapper、release gate、redacted auditだけを表示し、実送信は管理者承認後に限定する。', 'Oracle response/body redaction testとno unsafe retry testが必要。'),
      concern('high', 'legal-compliance', 'ホテル/テナント権限、監査ログ、保持期間が曖昧だと本番接続できない。', 'admin、front desk、delivery、customerの役割別表示と監査理由を必須化する。', 'role permission matrixとaudit receipt fixtureを検証する。'),
      concern('high', 'sre-platform', 'OHIP endpoint別mapper、429、Retry-After、circuit breakerがないとホテル現場で障害化する。', 'endpoint別mapper、no-cache connector fetch、dead-letter queue、dry-run/liveの明確な切替を入れる。', 'rate-limit retry fixtureとdry-run cannot write testが必要。'),
    ],
    requiredExperiments: ['OHIP mapper dry-run test', 'hotel role permission drill', 'Oracle redacted error audit'],
    testGates: ['OPERA preview excludes raw address', 'dry-run cannot perform live write', 'Oracle raw error is redacted'],
    decision: 'narrow-scope',
  },
  {
    surfaceId: 'research-design-hub',
    priority: 'P1',
    targetMaturity: 'research-prototype',
    reviewerRoles: [...BASE_REVIEWERS, 'product-strategy', 'qa-research', 'legal-compliance'],
    concerns: [
      concern('high', 'qa-research', '研究/設計Hubが資料リンク集だけになると、どの仮説が検証済みか分からない。', '論文、仕様、実装、テスト、未検証項目を同じ行で結び、evidence levelを表示する。', 'AMT、AGID/AOID、ZK、Postal Forgeごとの検証マトリクスが必要。'),
      concern('medium', 'legal-compliance', '研究主張が配送保証や公的郵便制度のように読まれると誤認リスクがある。', 'claimはresearch、prototype、pilot、productionの成熟度ラベルで分け、未検証は明記する。', 'public claims reviewとdisclaimer fixtureを追加する。'),
      concern('medium', 'privacy', '研究用サンプルにraw住所、witness、private key、実名を混ぜると公開資料全体の信頼を落とす。', '研究サンプルはsynthetic/test vector/commitment-onlyに限定し、private素材はローカル保管に分離する。', 'research artifact no-raw/private-material scanを行う。'),
    ],
    requiredExperiments: ['research evidence matrix review', 'public claim maturity audit', 'research artifact privacy scan'],
    testGates: ['research samples are synthetic or redacted', 'unverified claims are labeled', 'paper links map to executable tests'],
    decision: 'mature-next',
  },
  {
    surfaceId: 'open-locker-pudo-simulator',
    priority: 'P1',
    targetMaturity: 'field-pilot',
    reviewerRoles: [...BASE_REVIEWERS, 'postal-carrier-ops', 'security', 'sre-platform'],
    concerns: [
      concern('critical', 'postal-carrier-ops', 'PUDO/ロッカーは受取可否、本人確認、スタッフoverride、機器故障が混ざるため、状態が曖昧だと誤配や不正受取に直結する。', 'pickup-success、reader-failure、expired-credential、staff-overrideを状態機械で分け、redacted receiptを必須にする。', '現場シナリオごとのstate transitionとreceipt fixtureが必要。'),
      concern('high', 'security', 'QR/NFC/PINの再利用、ロッカー端末偽装、使用済みcredentialの二重使用が起きやすい。', '短期jti、端末署名、used ledger、offline conflict review、staff role gateを入れる。', 'replay、duplicate offline event、untrusted deviceの攻撃テストが必要。'),
      concern('medium', 'privacy', 'ロッカーイベントが受取人名、住所、PIN、荷物IDをそのまま残すと監視ログ化する。', 'event logはalias、reason code、commitment、device refだけにし、raw address/PIN/recipientを保存しない。', 'locker event log no-raw-address and no-PIN testを追加する。'),
    ],
    requiredExperiments: ['PUDO handoff simulation', 'locker replay attack test', 'offline duplicate conflict drill'],
    testGates: ['locker event log is redacted', 'used credential cannot open twice', 'staff override creates an audit reason'],
    decision: 'mature-next',
  },
] satisfies AppExpertReview[];

export function getAppExpertReviews(): AppExpertReview[] {
  return APP_EXPERT_REVIEWS.map(review => ({
    ...review,
    reviewerRoles: [...review.reviewerRoles],
    concerns: review.concerns.map(item => ({ ...item })),
    requiredExperiments: [...review.requiredExperiments],
    testGates: [...review.testGates],
  }));
}

export function summarizeMultidisciplinaryAppAudit(
  reviews = getAppExpertReviews(),
): MultidisciplinaryAppAuditSummary {
  const concerns = reviews.flatMap(review => review.concerns);
  return {
    version: MULTIDISCIPLINARY_APP_AUDIT_VERSION,
    appCount: reviews.length,
    p0: reviews.filter(review => review.priority === 'P0').length,
    p1: reviews.filter(review => review.priority === 'P1').length,
    p2: reviews.filter(review => review.priority === 'P2').length,
    criticalFindings: concerns.filter(concern => concern.severity === 'critical').length,
    highFindings: concerns.filter(concern => concern.severity === 'high').length,
    productionCandidates: reviews.filter(review => review.targetMaturity === 'production-candidate').length,
    fieldPilots: reviews.filter(review => review.targetMaturity === 'field-pilot').length,
  };
}

export function getP0AppExpertReviews(
  reviews = getAppExpertReviews(),
): AppExpertReview[] {
  return reviews.filter(review => review.priority === 'P0');
}

export function validateMultidisciplinaryAppAudit(
  reviews = getAppExpertReviews(),
  surfaces = APP_SURFACES,
): MultidisciplinaryAppAuditValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const reviewIds = new Set<AppSurfaceId>();
  const surfaceIds = new Set<AppSurfaceId>(surfaces.map(surface => surface.id));
  const disciplineIds = new Set<ExpertDisciplineId>(EXPERT_DISCIPLINES.map(discipline => discipline.id));

  for (const review of reviews) {
    if (reviewIds.has(review.surfaceId)) errors.push(`duplicate-review:${review.surfaceId}`);
    reviewIds.add(review.surfaceId);
    if (!surfaceIds.has(review.surfaceId)) errors.push(`unknown-surface:${review.surfaceId}`);
    if (review.reviewerRoles.length < 4) errors.push(`not-enough-reviewer-roles:${review.surfaceId}`);
    if (review.concerns.length < 3) errors.push(`not-enough-concerns:${review.surfaceId}`);
    if (review.requiredExperiments.length < 3) errors.push(`not-enough-experiments:${review.surfaceId}`);
    if (review.testGates.length < 3) errors.push(`not-enough-test-gates:${review.surfaceId}`);
    for (const role of review.reviewerRoles) {
      if (!disciplineIds.has(role)) errors.push(`unknown-reviewer-role:${review.surfaceId}:${role}`);
    }
    for (const item of review.concerns) {
      if (!disciplineIds.has(item.discipline)) errors.push(`unknown-concern-discipline:${review.surfaceId}:${item.discipline}`);
      if (!item.finding.trim()) errors.push(`missing-finding:${review.surfaceId}`);
      if (!item.improvement.trim()) errors.push(`missing-improvement:${review.surfaceId}`);
      if (!item.evidenceRequired.trim()) errors.push(`missing-evidence:${review.surfaceId}`);
    }

    const combined = [
      ...review.testGates,
      ...review.concerns.flatMap(item => [item.finding, item.improvement, item.evidenceRequired]),
    ].join(' ').toLowerCase();
    if (!combined.includes('raw') && !combined.includes('redact') && !combined.includes('private')) {
      errors.push(`missing-privacy-evidence-language:${review.surfaceId}`);
    }
    if (review.priority === 'P0' && !review.concerns.some(item => item.severity === 'critical' || item.severity === 'high')) {
      errors.push(`p0-without-high-or-critical:${review.surfaceId}`);
    }
  }

  for (const surface of surfaces) {
    if (!reviewIds.has(surface.id)) errors.push(`missing-review:${surface.id}`);
    if (surface.status === 'partial' && !reviews.some(review => review.surfaceId === surface.id && review.priority !== 'P2')) {
      warnings.push(`partial-surface-not-prioritized:${surface.id}`);
    }
  }

  const p0Ids = getP0AppExpertReviews(reviews).map(review => review.surfaceId);
  for (const required of ['address-registration', 'address-portal', 'settings-policy', 'pos-terminal', 'field-handoff']) {
    if (!p0Ids.includes(required as AppSurfaceId)) errors.push(`missing-p0-critical-surface:${required}`);
  }

  const summary = summarizeMultidisciplinaryAppAudit(reviews);
  if (summary.criticalFindings < 8) warnings.push(`few-critical-findings:${summary.criticalFindings}`);
  if (summary.productionCandidates < 6) warnings.push(`few-production-candidates:${summary.productionCandidates}`);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

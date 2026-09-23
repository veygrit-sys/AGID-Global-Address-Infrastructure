# AGID/AOID セキュリティ・プライバシー設計

Last updated: 2026-06-07

この文書は、AGID/AOID、住所検証、ZK住所述語、QR/NFC、MCP/買い物Agent連携を同じ基準で扱うための設計メモである。実装上の判定ロジックは `src/lib/securityPrivacyDesign.ts` に置く。

## 基本原則

```text
AGID = 公開・検証可能・非個人の地理/住所/地物参照層
AOID = 個人デバイス優先・所有者管理・暗号化前提の私的住所層
ZK  = 住所本文を出さずに、住所由来の属性だけを証明する選択的開示層
```

AGID は秘密にしない。代わりに、形式検証、SDK parity、出典、信頼度、改ざん耐性を重視する。AOID は秘密にする。受取人、電話番号、部屋番号、アクセス指示、厳密な私有座標、所有者鍵、証明 witness は AOID またはローカル/暗号化済み領域に閉じ込める。

## 反監視設計としての必須変更

このプロジェクトは、住所を扱う以上、便利な住所ID基盤であると同時に監視基盤へ転用される危険を持つ。そのため、次の項目は単なる追加機能ではなく、設計上の不変条件として扱う。

1. 実住所を公開しない `ZK Address Proof` を併用機能にする。公開するのは「日本在住」「東京都内」「配送可能地域内」などの述語であり、番地、氏名、電話番号、部屋番号、厳密座標は公開しない。
2. AOID は公開IDではなく、所有者ローカルまたは暗号化済み同期の私的住所層として扱う。外部検証では AOID 本文ではなく、用途別 commitment、用途別 nullifier、所有証明、委譲証明を使う。
3. 同一人物・同一住所を用途横断で追跡できないよう、commitment、nullifier、challenge、scope、audience、issuer policy を domain separation する。配送用 proof を本人確認、広告、信用スコア、マーケティングに再利用してはならない。
4. 中央サーバーに住所、AOID、住所履歴、raw candidate、raw cluster、proof witness を平文保存しない。保存が必要な場合は所有者デバイス側で暗号化した envelope、公開 root、hash、descriptor のみを扱う。
5. Tor/onion 互換エンドポイント、オフライン発行、オフライン proof 提示、自己ホスト、ミラー配布、ポータブルOSSデータパックを検討する。単一運営者が住所利用履歴を観測できる構造を避ける。
6. 失効、鮮度、issuer trust は公開検証可能にする。検証者は住所本文を見ずに、issuer trust root、revocation root、freshness window、policy hash を検査できる必要がある。
7. OSS、再現可能ビルド、署名またはchecksum付き配布、外部セキュリティ監査、ZK回路監査を前提にする。公開リポジトリ、fixture、SDK、data pack には秘密鍵、AOID平文、個人住所例を入れない。
8. README、論文、仕様書には「監視に使えない設計」を明記する。これは「監視利用を禁止したい」という意図表明だけではなく、公開できる情報、禁止する情報、追跡を防ぐ domain separation、分散配布、監査可能性を含む技術的制約として記述する。

まとめると、AGID は公開検証可能な住所・地物参照層、AOID は所有者管理の私的住所層、ZK は住所本文を出さずに住所由来の事実だけを証明する選択的開示層である。この三層を混ぜないことが、反監視設計の中心である。

## データ分類

| 分類 | 例 | 既定動作 |
| --- | --- | --- |
| public | AGID、国/海域コード、公開地物名、公開住所ラベル | 公開 API・公開 QR・SDK fixture に利用可 |
| pseudonymous | 用途別AOID commitment、domain-separated nullifier、proof bundle id、一回性reference handle | scope と domain separation が必要 |
| sensitive | 住所本文、郵便番号、厳密座標、住所 credential、配送可能性 | 最小開示、同意、ログ秘匿が必要 |
| secret | AOID plaintext、電話番号、部屋番号、秘密鍵、proof salt、credential private salt | ローカルまたは暗号化済み同期のみ |

## 境界別ポリシー

| 境界 | 公開してよいもの | 出してはいけないもの | 必須制御 |
| --- | --- | --- | --- |
| Public AGID API | AGID、公開セル、公開地物名、出典、信頼度 | 受取人、電話番号、部屋番号、proof salt、raw evidence | AGID形式検証、no-store、ログ秘匿 |
| Public QR | AGID、用途別AOID commitment、一回性reference handle、公開ラベル | 厳密座標、受取人、電話番号、部屋番号、owner/device key、encrypted AOID payload、再利用可能なAOID本文 | 生成時と読取時の再サニタイズ |
| AOID登録 | ローカル上のAOID、用途別commitment | 公開面へのplaintext AOID、用途横断で再利用できるAOID公開ID | AOID所有証明、duplicate nullifier、同意スコープ |
| AOID同期 | encrypted envelope、用途別公開参照メタデータ、同期状態 | サーバー上のplaintext AOID、グローバル追跡可能なAOID公開ID | owner-device encryption、失効、明示同意 |
| ZK公開証明 | 述語、scope、challenge hash、issuer root、commitment/nullifier | 住所本文、座標、証明salt、credential本文 | freshness、revocation、issuer trust、scope binding |
| Proof bundle registry | bundle id、proof descriptor、hash化nullifier | raw proof、witness、private salt | compatibility、validity window、raw保存禁止 |
| MCP/買い物Agent | 目的に必要な検証結果だけ | 住所本文、電話番号、部屋番号、厳密座標 | 明示目的、同意、最小開示、赤字化ログ |
| Audit log | event type、policy id、source id、hash | raw address、recipient、phone、proof salt | redaction、retention、private-field scan |
| Open-source release | 仕様、公開fixture、公開データ、テストベクトル | 秘密鍵、AOID plaintext、個人住所例 | secret scan、fixture scan、checksum/signature |

## ZK利用時の必須条件

ZKは住所の真実性を単独では保証しない。ZKが保証するのは「秘密入力を公開せず、公開された述語が回路上で成り立つこと」である。したがって、住所写像論の意味論とZKの暗号層を分離する。

ZK住所述語では次を必須にする。

1. `scope` と `challenge` に束縛する。
2. nullifier と commitment は proof family ごとに domain separation する。
3. credential backed flow は issuer trust、revocation、freshness を必須にする。
4. public proof へ `privateProofSalt`、`localCacheKey`、`rawEvidence`、住所本文を出さない。
5. 複数証明を束ねる前に proof bundle compatibility を検査する。
6. registry は raw proof や witness を保存せず、descriptor と hash のみにする。

## 住所検証・PID/AOID発行

住所検証は完全解決ではなく、証拠に基づく状態遷移として扱う。次の場合は PID/AOID 発行や自動配送適格判定へ進めない。

- country mismatch がある。
- unsupported または unresolved である。
- 郵便番号の形式だけで住所実在性を確認したと誤認している。
- 公式または信頼済みソースがなく、弱い候補しかない。
- 住所制度との接続計画が `unsupported` または `manual-review` を要求している。

## MCP・買い物Agent対応

買い物AgentやMCP連携では、Agentが住所本文を持つ必要はない。理想形は次の二段階である。

1. EC/Agentへは `配送可能`、`正当な受取人`、`同意済み目的` だけを証明する。
2. 配送事業者へは、必要最小限の暗号化済み配送解決トークンまたはキャリア専用AOID参照を渡す。

これにより、販売者やAgentが氏名、電話番号、部屋番号、完全住所を保持しなくても配送可能性を扱える。

## 実装対応

- `src/lib/securityPrivacyDesign.ts`: 境界別設計、リスク判定、禁止フィールド検査。
- `src/lib/privacyPolicy.ts`: QR公開化、ログ赤字化、private localStorage clear。
- `src/lib/agidSecurity.ts`: AGID公開層の形式・公開payload検査。
- `src/lib/aoid/**`: AOID ID、private fields、encrypted sync policy。
- `src/lib/zkProofCompatibility.ts`: proof bundle前のscope/challenge/private field/nullifier検査。
- `src/lib/zkProofBundleRegistry.ts`: raw proofを保存せず、descriptorとhashだけを登録。
- `src/lib/credentialIssuerTrustRegistry.ts`: issuer trust と credential policy。
- `src/lib/revocationFreshnessRootAnchoring.ts`: revocation/freshness root anchoring。
- `src/lib/addressVerificationEngine.ts`: 住所検証、source trust、住所制度接続。

## 未完了の強化点

- AOID同期の本物の暗号化実装と鍵ローテーション。
- ZK回路そのもののRust/WASMまたは専用backend化。
- 第三者によるZK回路監査、匿名集合分析、linkability分析。外部監査の段階・証跡・公開レポートのルールは `external-audit-hardening-ja.md` に従う。
- 公開fixture・docs・data packを横断するprivate-field scan。
- MCP/Agentのツール結果に対する自動赤字化とpurpose enforcement。
- 本番環境でのCORS/frame policyの運用別プロファイル化。

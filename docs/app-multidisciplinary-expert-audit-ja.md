# AGID/AOID 全アプリ専門職横断レビュー v1

このレビューは、AGID/AOIDの全アプリ面を、研究機関・企業監査・現場導入前レビューの水準で厳しめに点検するための監査ノートである。対象は `APP_SURFACES` に登録された15サーフェスであり、詳細な監査モデルは `src/lib/appExpertAudit.ts` に固定する。

## 1. レビュー体制

単一のエンジニア観点ではなく、次の専門職が共同で見る前提にする。

| 職種 | 見ること |
| --- | --- |
| Product strategy | アプリとして分けるべきか、SDK/機能として分けるべきか、価値が明確か |
| Service design / UX research | 現場で迷わず完了できるか、説明なしで使えるか |
| Frontend architecture | ルート分離、遅延読み込み、状態管理、再描画、バンドル肥大 |
| Accessibility | キーボード、スクリーンリーダー、コントラスト、多言語、エラー回復 |
| Security engineering | 攻撃入力、QR再利用、端末偽装、秘密値、ログ、権限 |
| Privacy engineering / DPIA | raw addressを出さない、scope、同意、削除、export、最小開示 |
| Applied cryptography / ZK | commitment、nullifier、署名、freshness、domain separation |
| GIS and address science | 国境、海上、極地、地名、郵便番号、住所品質、曖昧性 |
| Postal and carrier operations | POS、送り状、配送拒否、受取人proof、倉庫、ロッカー、返品 |
| Field / humanitarian operations | 通信断、危険地域、低電力、低リテラシー、オフライン同期 |
| Legal and compliance | 監査、保持期間、証拠性、データ主体権利、規制主張 |
| SRE / platform | 監視、SLO、Webhook、再送、idempotency、rate limit、障害復旧 |
| QA / research validation | 再現可能なfixture、テストベクトル、性能測定、実地評価 |

## 2. 全体判断

全体として、AGID/AOIDは「地図アプリ」ではなく、住所登録、同意、配送受付、現場引き渡し、監査、開発者連携、証跡、郵便区画設計を束ねる住所インフラ群になっている。方向性は強いが、研究機関・企業レビューでは次の弱点を厳しく見られる。

1. Address Registration / Address Element が弱いと全体が弱い。
2. Portalの同意、取消、削除、exportが弱いとプライバシー思想が崩れる。
3. POSとFieldのオフライン・端末署名・QR再利用対策が弱いと現場導入できない。
4. Dashboard / Review Consoleがraw addressを持つと監視基盤に見える。
5. Evidence Vaultは便利だが、最も漏洩リスクが高い。
6. Postal Zone Designerは公式郵便番号に見えるため、governanceと非置換原則が必須。
7. Drone / Locker OpsはDrone OS本体に広げず、到達可否APIと証跡projectionに絞るべき。

優先順位は次でよい。

```text
P0: Address Registration / Address Element / Settings / Portal / POS / Field / Dashboard / Review
P1: Developer Console / Evidence Vault / Hotel / Machine Link / Postal Zone Designer
P2: Drone / Locker Ops
```

## 3. 横断で必須の品質ゲート

| ゲート | 必須条件 |
| --- | --- |
| No raw address by default | shared logs, dashboard, webhook, review export, telemetryにraw address、raw AOID、raw AGID-S payload、proof secretを出さない |
| Local-first | Mode 0でAGID生成、AGID-S復号、QR/NFC受付、基本receipt、Portal閲覧が成立する |
| High-risk mode | DV、避難、難民、人道支援では粗い共有、短期alias、受取後失効、履歴最小化 |
| Consent and scope | delivery、recipient verify、return label、aid eligibilityなど用途単位で分離 |
| Device trust | POS、Field、Locker、Drone、計測器、プリンタは端末ID、署名、状態、診断を持つ |
| Offline conflict | ローカル使用済み台帳、後同期、衝突時Review case化 |
| Accessibility | 主要導線はキーボード、タッチ、スクリーンリーダー、十分なコントラストで完了できる |
| Performance | 初回表示、スキャン、住所補完、言語切替、QR生成、署名検証は平均だけでなくp95/p99を見る |
| Reproducibility | 住所品質、郵便区画、ZK、GIS、Review判断はfixtureとtest vectorで再現できる |

## 4. アプリ別レビュー

### 4.1 AGID Map

重大懸念:
- 住所表示、自然地名、境界付近、海上、極地セルの不確実性が混ざる。
- 地図、検索、住所登録、各モーダルが同じ巨大画面に寄りやすい。
- hoverでAGIDや精密位置を出すと高リスク用途に弱い。

改善:
- hoverは薄い範囲表示だけ、AGIDはクリック後に確定表示。
- resolved / partial / review / restricted を明示。
- 言語タブ、地名、郵便番号、自然地理名のソースを分ける。

検証:
- 国別住所表示代表点テスト。
- map interaction p95/p99。
- high-risk display no-raw-address test。

### 4.2 Address Registration

重大懸念:
- 個人住所、修正フィードバック、AI学習が最も危険。
- P.O. Box、オートロック、配送不可地域、住所不備が構造化されないとPOSが判断できない。
- 長い入力フォームはユーザーと現場スタッフの両方に弱い。

改善:
- 学習はclosed/local既定。外部学習は明示同意とredaction後。
- 郵便番号補完、AGID補完、OCR候補、手動修正を段階化。
- P.O. Box、オートロック、入口、配送制約、修正履歴を正式フィールドにする。

検証:
- 登録payload no-raw-address。
- 郵便番号補完精度。
- 修正フィードバックがredacted learning eventになること。

### 4.3 AGID Address Element

重大懸念:
- EC/CMS/買い物Agentに広げる中核だが、アプリではなく埋め込みSDKとして別品質が必要。
- 親サイト由来のXSS、CSP、postMessage、クリックジャックの影響を受ける。
- 多言語・国別住所フォームのアクセシビリティが採用可否を決める。

改善:
- React component、Web Component、iframe sandbox、SDK API、sandbox demoを分ける。
- postMessage origin checkとno raw address event contractを持つ。
- 国別field order、言語タブ、補完、修正、読み上げエラーをElement単体で保証する。

検証:
- 悪意あるhost page simulation。
- host origin validation。
- WCAG 2.2 AA相当のフォームテスト。

### 4.4 Address Portal

重大懸念:
- 同意、scope、取消、削除、exportが弱いと人権・プライバシー思想が成立しない。
- 取消後も配送や監査で権限が残ると危険。
- scope表示が専門用語すぎると利用者が理解できない。

改善:
- scope履歴、取消、削除、export、異議申し立て、危険用途レビューを状態機械化。
- revocation receipt、delete receipt、export receiptを出す。
- scopeを「配送に使う」「本人確認に使う」など用途言語で表示する。

検証:
- revoke/delete/export非有料化。
- 取消後の再利用拒否。
- 低リテラシー読解テスト。

### 4.5 Settings and Policy Center

重大懸念:
- Mode 0-4、外部連携、言語、high-riskが分散するとユーザーがデータ流出を把握できない。
- 鍵、Webhook、外部API、端末設定は誤設定が漏洩につながる。
- 設定が多すぎると現場では使えない。

改善:
- 全アプリの単一policy sourceにする。
- providerごとに「何が端末外へ出るか」を表示。
- 個人、POS、管理者、開発者のプリセットを分ける。

検証:
- 言語設定がMap/POS/Portal/Dashboard/Elementに伝播。
- Mode 0がZK/Ethereum/serverなしで動く。
- secret/no-raw export test。

### 4.6 AGID POS Terminal

重大懸念:
- Scan -> Decision -> Handoff -> Reportの4画面が崩れると現場判断が遅れる。
- QRコピー、端末偽装、使用済み再利用、スタッフ権限ミスが不正受取になる。
- 小さいボタンや隠れた警告はPOSでは重大欠陥。

改善:
- 4状態を大きく表示: Address OK、Carrier Scan OK、Recipient Pending、Handoff Complete。
- jti、短期alias、端末署名、スタッフ権限、チャレンジ署名、使用済みnullifierを入れる。
- プリンタ、キャッシュドロワー、バーコードリーダー、電子計測器の診断を固定導線にする。

検証:
- replay / untrusted device / offline duplicate攻撃テスト。
- 店舗、配送員、支援現場のシナリオテスト。
- キーボード、タッチ、低視力、騒音環境テスト。

### 4.7 Field Handoff

重大懸念:
- 通信断、電池不足、危険地域、低リテラシーでも動かないと現場価値がない。
- オフラインreceiptは改ざん・重複同期される危険がある。
- 到達不可報告が個人宅や生活パターンを漏らす可能性がある。

改善:
- オフラインqueue、粗い位置、到達不可理由、受取人proof、後同期衝突レビューを最短操作にする。
- 端末署名、vector clock、local used ledger、sync conflict -> Review case。
- 公開報告はカテゴリと粗い地域だけ。詳細はrestricted operator receiptへ分離。

検証:
- offline field pilot。
- sync conflict review。
- cannot-reach public projection no precise address。

### 4.8 Dashboard / Review Console

重大懸念:
- Dashboardに生ログや住所本文が入ると監視システム化する。
- Reviewで拒否、承認、merge/split、異議申し立ての監査理由がないと企業監査に落ちる。
- 審査員に最初から全証拠を見せると最小開示に反する。

改善:
- Dashboardはredacted event、commitment、nullifier、status、root、device refだけ。
- Reviewはcase queue、case detail、redaction gate、decision receipt、appeal。
- raw evidenceはrole/scope/reason付きescalationまで非表示。

検証:
- dashboard export no-raw-address。
- review decision requires reason/signature。
- appeal creates linked case。

### 4.9 Developer Console

重大懸念:
- APIキー、Webhook、SDK例に実データや秘密値が混ざるとOSS公開時に危険。
- SDK、OpenAPI、Webhook、test vectorが散ると開発者が導入できない。
- Webhookは再送・重複・署名失敗が本番障害になる。

改善:
- test/live/local環境分離。
- OpenAPI explorer、SDK snippet、launch checklist、test vector、error catalogを統合。
- Webhook署名、timestamp skew、idempotency、dead-letterを見える化。

検証:
- sample payload no secret/no raw。
- webhook replay/idempotency fixture。
- 新規開発者30分導入テスト。

### 4.10 Evidence Vault

重大懸念:
- 写真/PDF/OCRは最大級の漏洩リスク。
- 相手サーバーに保存しないという思想をUIと実装で保証する必要がある。
- OCR結果やプレビューがログやクラッシュレポートへ流れる危険。

改善:
- local-first OCR、暗号化、redaction、Evidence Envelope。
- 相手には原本でなく「本人である/住所資格がある」証明だけ渡す。
- retention、delete、export、legal hold、consent envelopeをEvidence単位で持つ。

検証:
- external OCR upload opt-in only。
- redaction before share。
- proof export without original document。

### 4.11 Postal Zone Designer

重大懸念:
- 公式郵便番号に見えるため、承認なしにofficialを示すと危険。
- 数理モデルだけで、GIS・人口・匿名性・配送経路の検証が弱いと採用できない。
- 配送経路面と識別面が混ざると道路変更で番号が揺れる。

改善:
- simulation / draft / pilot / supplementary / officialを明示。
- Class Aは学習のみ、生成禁止。
- identifier plane、postal partition plane、route planeをUIで分離。

検証:
- governance threshold。
- VPL does not imply municipality。
- route update does not require postal ID churn。

### 4.12 Machine Link

重大懸念:
- 機械間通信はreplay、権限昇格、古いcredential再利用が起きやすい。
- POS、ロッカー、ドローン、配送業者でプロトコルが増えすぎる。
- 人間が監査できない通信は信頼されない。

改善:
- audience、purpose、nonce、exp、device signature、capabilityを必須化。
- HTTP/MQTT/Modbusを共通状態モデルに射影する。
- machine receipt、reason、last sync、device trust badgeを出す。

検証:
- replay/freshness/domain separation。
- protocol adapter equivalence。
- operator explainability test。

### 4.13 Hotel Check-in

重大懸念:
- 住所、本人確認、税、領収証が集まりやすく、保存範囲が危険。
- POSや住所登録と混ざるとフロントスタッフが迷う。
- 国ごとの宿泊者名簿、税、本人確認規制が違う。

改善:
- 短期QR、滞在目的scope、ローカル照合、不要資料の非保存。
- 予約照合、住所QR読取、同意、税/領収証、完了の専用導線。
- 国別必須項目はadapter化。

検証:
- check-in QR expiry。
- receipt redaction。
- retention field audit。

### 4.14 Drone / Locker Ops

重大懸念:
- Drone OS本体へ広げると安全責任が過大になる。
- ロッカー/端末/ドローンは重複イベント、通信断、プロトコル差で壊れやすい。
- 証跡や到達不可報告が精密住所や生活パターンを漏らす可能性がある。

改善:
- autopilot / fleet-controlはスコープ外。
- delivery evidence、locker state、MQTT/HTTP/Modbus simulatorに限定。
- public projectionは粗い状態と理由コードだけ。restricted receiptはscope付き。

検証:
- autopilot out-of-scope guard。
- duplicate event idempotency。
- public evidence excludes raw telemetry。

## 5. 研究機関・企業レビューで追加すべき実験

1. 5職種ユーザビリティテスト: 一般利用者、POSスタッフ、配送員、審査員、開発者。
2. アクセシビリティ監査: WCAG 2.2 AA、キーボード、スクリーンリーダー、色覚、低視力。
3. プライバシー影響評価: raw address、AOID、AGID-S、証跡、ログ、学習データの流れ。
4. セキュリティ演習: QR replay、端末偽装、Webhook replay、secret leak、offline conflict。
5. GIS/住所科学評価: 国別、島嶼、極地、海上、国境、自然地名、郵便番号未整備国。
6. 性能評価: 1件/100件/1,000件/10,000件、平均/p95/p99、低スペック端末。
7. 現場演習: 店舗POS、配送ハンドオフ、災害支援、ホテルチェックイン。
8. 法務レビュー: 同意、取消、削除、export、保持期間、監査ログ、証拠性。

## 6. 次の実行順

1. Address Registration / Address Elementのno-raw、補完精度、アクセシビリティを固める。
2. Settingsを全アプリのpolicy sourceにする。
3. Portalのscope、取消、削除、export、異議申し立てを成熟させる。
4. POSをScan -> Decision -> Handoff -> Reportに固定し、端末診断と使用済み対策を入れる。
5. Field Handoffでoffline queue、受取人proof、到達不可、sync conflictを固める。
6. Dashboard / Review Consoleをredacted operationsとcase managementに分離する。
7. Evidence VaultとPostal Zone Designerは強い安全ゲート付きで進める。
8. Drone / Locker Opsは最後まで限定スコープを維持する。

## 7. 最終評価

現状は、アイデア量と基礎部品は非常に強い。一方で、研究機関や会社が導入前に見ると、最大の質問は次になる。

```text
本当にraw addressを出さずに運用できるか。
現場で迷わず使えるか。
失効、同期、衝突、監査が破綻しないか。
公式郵便番号や公的住所制度を勝手に置換していないか。
高リスク用途で人を危険にしないか。
```

したがって、次の原則を全アプリに貫く。

```text
Local-first
Ethereum optional
ZK optional
No raw address by default
High-risk controls free
Review before publish
Evidence before claim
```

この原則を守れば、AGID/AOIDは暗号資産プロジェクトではなく、プライバシー保護型の住所インフラSDK/アプリ群として説明しやすくなる。

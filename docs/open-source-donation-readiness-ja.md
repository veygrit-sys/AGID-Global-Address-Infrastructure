# AGID/AOID OSS寄付・助成レディネス評価

Last updated: 2026-06-18

この資料は、AGID/AOIDのオープンソース部分が寄付金・助成金を受けられる品質に達しているかを、複数職種の観点から評価する。対応する機械可読モデルは `src/lib/openSourceDonationReadiness.ts`、検証テストは `src/lib/openSourceDonationReadiness.test.ts` に置く。

## 結論

現時点のOSS部分は、**小口寄付と焦点を絞った小〜中規模助成には出せる品質**である。

ただし、**大型助成や公共調達級の資金にはまだ早い**。理由は、採用実績、外部セキュリティ監査、公式リリース、アクセシビリティ監査、第三者パイロット、国別品質ベンチマークがまだ十分ではないためである。

| 判定 | 評価 |
| --- | --- |
| 総合スコア | 72 / 100 |
| 現実的な現在地 | small-grant-ready |
| 小口寄付 | 可能 |
| NLnet級の小〜中規模助成 | 可能性あり |
| OTF/UNICEF級の社会的助成 | 狭いユースケースに絞れば可能性あり |
| Sovereign Tech / OpenSSF級 | 採用実績とセキュリティ成熟後 |
| 大型グラント | 今は未成熟 |

## 曲げてはいけない哲学

寄付金や助成金を狙うために、次の原則は曲げない。

- Mode 0 Local Only を本物として残す。
- AGID/AOID標準、SDK、ローカルResolver、基本POS、Address ElementはHosted APIなしで検証可能にする。
- ZK、Ethereum、Hosted Registry、Managed Serviceを基本機能の必須条件にしない。
- raw address、raw AOID、AGID-S payload、proof witness、recipient secretを公開ログや公開payloadに出さない。
- revoke、delete、export、高リスクモード、ローカル復号、セキュリティ修正は有料化しない。
- AGID/AOIDを token-first の暗号通貨プロジェクトとして売り込まない。

ここを曲げると、短期的に資金説明は派手になっても、AGIDの一番強い「反監視・自己ホスト・住所を公開しない」価値が壊れる。

## OSS領域別評価

| OSS領域 | スコア | 寄付・助成向け評価 | 主な不足 |
| --- | ---: | --- | --- |
| AGID/AOID標準 | 78 | 中規模助成候補 | v0.1 release candidate、conformance badge |
| SDK/CLI | 74 | 小規模助成候補 | 言語別CI、配布手順、quickstart |
| Local Resolver | 76 | 中規模助成候補 | 公開ベンチ、国別品質表、再現可能データパック |
| Address Element | 70 | 小規模助成候補 | EC/CMS/POS実例、privacy-safeイベント仕様 |
| 基本POS | 69 | 小規模助成候補 | UIタスク分割、offline receipt、端末診断成熟 |
| Privacy/Security | 82 | 最も強い | 外部監査、secret scan、release artifact scan |
| ZK基礎 | 58 | 小口寄付〜小規模助成 | 回路監査、witness検証、public signal漏洩分析 |
| Docs/Research | 73 | 小規模助成候補 | canonical path、claim status、短いfunder brief |

## 職種別チェック

| 職種 | スコア | 良い点 | 懸念 | 次に必要な証拠 |
| --- | ---: | --- | --- | --- |
| OSSメンテナ | 73 | 境界設計、SDK、test vector | onboardingが重い | CONTRIBUTING、release checklist |
| セキュリティエンジニア | 76 | no-raw-addressがテスト化可能 | 外部レビュー不足 | SECURITY.md、脅威モデル、secret scan |
| Privacy lawyer / DPO | 70 | purpose scope、Portal取消 | 管轄・保持期間が未整理 | DPIA、retention matrix |
| 人道支援担当 | 72 | offline、高リスク、AGID-S | 現場パイロット不足 | do-no-harm checklist、field demo |
| 物流/POS担当 | 67 | QR/NFC、receipt、端末診断 | UIがまだ重い | 5分POS demo、offline queue test |
| 公共CIO | 66 | self-host、標準優先 | 調達品質には不足 | deployment guide、accessibility audit |
| Developer Advocate | 68 | Address Elementが強い | quickstart不足 | copy-paste examples、API playground |
| Grant officer | 71 | 公益性がある | 範囲が広すぎる | 3つの6か月以内milestone |
| Accessibility/UX | 62 | 課題認識あり | WCAG証拠不足 | keyboard-only flow、screen reader test |
| Academic researcher | 75 | AMTと検証ノートが強い | 主張の状態表示が必要 | claim status table、Lean/GIS再現 |
| Crypto infra engineer | 64 | ZK/Ethereumが任意レイヤー | 回路が未成熟 | 最小回路、public signal漏洩テスト |
| Data governance | 70 | DATA_LICENSES方針あり | データ来歴の完全性 | license BOM、freshness policy |

## 資金候補と予測

金額は「公式に確認できるレンジ」と「AGIDが今現実的に狙うべき申請額」を分ける。助成は審査、国籍/法人、募集テーマ、締切、制裁対象、成果物、会計処理で変わるため、ここでは保証ではなく見積もりとして扱う。

| 団体 | サービス/プログラム | 適合度 | 公式レンジ/公式情報 | AGIDの現実的な申請額予測 | 狙うパッケージ |
| --- | --- | --- | --- | --- | --- |
| NLnet Foundation | Open calls / NGI系funds | 高 | EUR 5,000-50,000。スケールアップ可能性あり。 | EUR 25,000-50,000 | Local Resolver + Address Element + no-raw-address tests |
| Open Technology Fund | Internet Freedom Fund / FOSS Sustainability Fund | 中 | Internet Freedom FundはUSD 10,000-900,000、FOSS Sustainability Fundはsingle-maintainer支援からUSD 400,000級まで。募集状態は都度確認。 | USD 50,000-150,000 | AGID-S、高リスク共有、Portal取消、offline POS |
| Sovereign Tech Agency | Sovereign Tech Fund / Resilience / Standards | 中〜低 | open digital infrastructure、standards、securityを重視。固定レンジは要確認。 | EUR 75,000-200,000は採用実績後 | Resolver、標準、conformance、security hardening |
| OpenSSF / Alpha-Omega | Security hardening partnerships | 低 | critical OSS security支援。一般小規模寄付窓口ではない。 | 今はUSD 0。将来audit/hardening支援 | secret scan、dependency review、release hardening |
| Ethereum Foundation | Ecosystem Support Program | 中〜低 | free/open-source/non-commercialでEthereum基盤を強めるもの。 | USD 20,000-80,000相当 | ZK Address Predicate、registry verifier example |
| Web3 Foundation | W3F Grants Program | 中 | Level 1 up to USD 10,000、Level 2 up to USD 30,000、Level 3 unlimited。 | USD 10,000-30,000 | Polkadot adapter、proof bundle registry |
| UNICEF Venture Fund | Open-source frontier tech investments | 中〜低 | seed up to USD 100,000、growth up to USD 400,000。 | USD 0-100,000。対象callと現地pilot次第 | Humanitarian Address Safety Kit |
| Gitcoin | Grants / public goods rounds | 中 | round依存。community donation + matching。 | USD 1,000-20,000 early | OSS demo、local resolver、AGID-S、ZK optional |
| Digital Public Goods Alliance | DPG Standard / Registry | 中 | 直接資金より認定・発見性・信用。 | USD 0 direct | DPG candidate化、do-no-harm、privacy compliance |

## 最初に出すべき助成パッケージ

### 1. NLnet向け: Local Resolver and Address Element

最も現実的。

成果物:

- self-hostable local resolver
- address display benchmark
- language tab conformance
- Address Element examples
- no-raw-address payload tests
- DATA_LICENSES付きdata pack

哲学との整合:

中央サーバーに依存しない住所表示・住所検証を強めるので、AGIDの思想と合う。

### 2. OTF向け: Anti-Surveillance Address Sharing

通る可能性はあるが、説明を間違えると危ない。

成果物:

- AGID-S high-risk mode
- short-lived QR/NFC
- Portal revoke/delete/export
- offline POS/field mode
- do-no-harm checklist
- no raw address audit log

注意:

物流便利ツールではなく、監視・検閲・避難・支援で住所を公開しないための安全共有として出す。

### 3. Web3 Foundation向け: Polkadot Adapter and Proof Bundle Registry

狭く切れば出しやすい。

成果物:

- Polkadot adapter
- proof bundle registry
- revocation/freshness anchoring
- no raw address payload tests

注意:

住所そのものをオンチェーンに置かないことを前面に出す。

### 4. Ethereum ESP向け: Minimal ZK Address Predicate

ZKはまだ弱いので、最小回路に絞る。

成果物:

- area membership + nullifier minimal circuit
- public signal schema
- witness handling rule
- verifier example
- leakage test

注意:

「ZKで実住所が真実だと証明できる」と言ってはいけない。ZKは秘匿された入力が回路条件を満たすことを示すだけ。

### 5. UNICEF/DPGA向け: Humanitarian Address Safety Kit

社会的価値は高いが、現地partnerとpilotが必要。

成果物:

- offline field handoff
- AGID-S
- reachability report
- high-risk mode
- do-no-harm privacy default
- evidence redaction

## さらに寄付を得るためにすること

### 1. 5ページのFunder Briefを作る

長大な論文ではなく、助成審査員向けに次だけを書く。

- 何の問題を解くか
- なぜ既存住所/地図APIでは足りないか
- OSSで何が使えるか
- 何を隠し、何を証明するか
- 6か月で何を納品するか
- どう検証するか

### 2. 3つのデモに絞る

- Local Resolver demo
- AGID-S high-risk sharing demo
- POS offline handoff demo

これ以上増やすと、審査員には散らかって見える。

### 3. Public release candidateを作る

- `agid-spec-v0.1`
- test vectors
- conformance report
- SDK support matrix
- no-raw-address tests
- threat model
- DATA_LICENSES

### 4. 外部監査前の自動検査を追加する

- secret scan
- private fixture scan
- raw address log scan
- AGID-S payload leakage scan
- dependency audit
- reproducible build notes

### 5. 寄付導線を作る

- GitHub Sponsors
- Open Collective
- Gitcoin round candidate
- `FUNDING.yml`
- 寄付で何が実現するかのmilestone表

ただし、寄付者向けに個人住所データや利用者データを見せるような報告はしない。

## 今は無理にやらない方がいいこと

- token発行を中心にして資金を集める。
- Ethereum/ZKを必須にする。
- Google/HERE/TomTomなどの有料APIを中核にする。
- 住所データを中央に集めるほど強いと説明する。
- 「240か国対応で有料APIに勝つ」と未検証のまま助成申請する。
- 全機能を1つの巨大申請にする。

## 参照した主な公式情報

- NLnet: https://nlnet.nl/funding.html
- Open Technology Fund: https://www.opentech.fund/
- Sovereign Tech Agency: https://www.sovereign.tech/
- Web3 Foundation Grants: https://github.com/w3f/Grants-Program
- Ethereum Foundation ESP: https://esp.ethereum.foundation/applicants
- UNICEF Venture Fund: https://www.unicefventurefund.org/
- Gitcoin Grants: https://grants.gitcoin.co/
- Digital Public Goods Standard: https://www.digitalpublicgoods.net/standard
- Alpha-Omega: https://alpha-omega.dev/

## 最終評価

AGID/AOIDのOSS部分は、寄付金を受け取る資格がある品質に近づいている。特に強いのは、Local Resolver、Privacy/Security、AGID/AOID標準、Address Elementである。

一方で、資金調達向けに最も弱いのは「範囲が広すぎること」である。寄付や助成を得るには、AGID全体を説明するより、次のように小さく切るのがよい。

```text
住所を中央サーバーに集めず、
ローカルで住所表示・住所補完でき、
必要なときだけAGID-SやZKで安全に共有できる
OSS住所インフラ
```

この表現なら、哲学を曲げずに資金申請できる。

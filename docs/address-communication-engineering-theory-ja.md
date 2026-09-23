# 住所通信工学理論

住所通信工学理論は、住所を「人間が読む文字列」ではなく、配送、本人確認、地図検索、ホテル、POS、ロッカー、ドローン、災害支援、行政通知、EC連携のための通信先として扱う理論である。

住所は通信に似ている。IPアドレス、DNS、メールアドレス、電話番号が宛先を表すように、住所は物理空間・社会制度・配送網における宛先を表す。ただし住所は、ネットワークアドレスよりも曖昧で、歴史的で、国別制度に依存し、個人情報を含みやすい。したがって、通信技術を住所へ応用するときは、到達性、検証性、秘匿性、監査性を同時に設計する必要がある。

## 基本定義

住所通信とは、住所または住所IDを使って、ある主体が別の物理的・制度的・機械的対象へ、安全に到達、照会、配送、通知、証明、監査するための通信である。

AGID/AOIDでは、次の分離を守る。

| 層 | 役割 |
| --- | --- |
| AGID | 公開地理参照、空間セル、公開可能な到達アンカー |
| AOID | 私的配送対象、受取人管理、部屋・ロッカー・入口など |
| Address DNS | 公開名からcommitment、resolver、policy、rootを引く |
| Secure Address QR | raw住所を出さずに配送・受付・照合を行う |
| Connector | OPERA、POS、配送会社、郵便番号API、地図APIとの連携 |
| Ledger / Audit | 通信、登録、配送、失効、閲覧を後から検証する |

## 実装原則

1. raw住所を通信プロトコルの標準payloadにしない。
2. 通信先はAGID/AOID/alias/commitment/receiptで表す。
3. 住所本文が必要な場合は、目的、権限、期限、監査ログを必須にする。
4. 住所検索と住所開示を分ける。
5. 成功・失敗・再送・期限切れ・失効を状態機械で扱う。
6. 通信失敗時にunsafe retryで住所を重複送信しない。
7. webhook、queue、push、SMS、emailはすべてno-raw-address policyを通す。
8. ホテル、POS、配送、ロッカー、ドローンは同じ通信 envelope を使い、表示だけ職種別に変える。

## 実装対応

この理論の実行可能な最小核は `src/lib/address/addressCommunicationEngineering.ts` に置く。

- 50個の通信技術を、ネットワーク基盤、プロトコル、イベント通信、近距離通信、セキュア通信の5分類で管理する。
- 通信payloadは `AGID / AOID / alias / commitment / receipt / resolver` を中心にし、raw住所、受取人、電話、メール、座標、秘密鍵、witnessを公開payloadへ入れない。
- 通信メッセージは `resolve → authorize → minimize → handoff → receipt → audit` の順で検証する。
- 住所開示がある通信は `no-store` と `unsafe-denied retry` を必須にする。
- carrier限定の開示は公開通信安全ではなく、権限付きcarrier宛先だけに許可する。

## 品質改善ループ

50個の通信技術は、一度に完成させるのではなく、1技術ずつ品質を上げる。

各技術は次を持つ。

- `grade`: release-ready / integration-ready / draft / research-only
- `score`: 現時点の実装成熟度
- `nextImprovement`: 次に直す最小単位
- `requiredEvidence`: no-raw payload、purpose/scope/expiry、receipt/audit、threat modelなど
- `recommendedGate`: その改善後に走らせるべき検証

改善ループは `createAddressCommunicationImprovementSignals()` から未成熟な通信技術を拾う。これにより、CoAP、WebRTC、UWB、LPWA、mTLS、JWT、E2EEなどを、毎回1つずつ安全に成熟させられる。

## 1. ネットワーク・通信基盤系

| No | 通信技術 | 住所への応用 | 実装理論 |
| ---: | --- | --- | --- |
| 1 | DNS | 住所IDを人間が読める名前に変換する。 | Address DNSは `name → commitment / resolver / policy / root` を返す。raw住所は返さない。 |
| 2 | IPアドレス設計 | 世界中の住所に階層的IDを割り当てる発想に使う。 | AGIDは国・地域・セル・対象粒度を階層化し、routing可能なprefixを持つ。 |
| 3 | IPv6 | 巨大な住所ID空間を作れる。 | 建物、部屋、ロッカー、入口、仮想配送地点まで表せるID空間の設計参考にする。 |
| 4 | Anycast | 最寄りの住所サーバーに自動接続する。 | resolverを地域分散し、最寄りのcountry/region packへ誘導する。 |
| 5 | CDN | 住所データベースを地域ごとに高速配信する。 | public country pack、address format、postal metadataをキャッシュ配信する。 |
| 6 | Edge Computing | 住所補完・配送判定を近いサーバーで処理する。 | raw住所を中央へ送らず、端末/edgeで補完・検証・redactionする。 |
| 7 | Load Balancing | 住所APIへの大量アクセスを分散する。 | resolver、postal lookup、QR verification、webhook intakeを水平分散する。 |
| 8 | Packet Routing | 荷物配送をデータパケットのルーティングのように設計する。 | 荷物を `destination commitment + policy + next hop + receipt` として扱う。 |
| 9 | BGP | 国・配送会社・自治体間で住所到達経路を交換する。 | carrier route announcementとして配送可能地域、禁止地域、PUDO可否を交換する。 |
| 10 | NAT | 本当の住所を隠し、外部には住所トークンだけ見せる。 | merchantにはalias、carrierには復号可能AOID、監査にはcommitmentを渡す。 |

### IPv6型住所空間の境界

IPv6は巨大な階層ID空間の参考になるが、AGIDではそのまま「人、部屋、建物へ到達できる公開番号」として使わない。公開側はAGID、alias、commitment、zone粒度までに抑え、部屋、受取人、実住所、精密座標はAOIDまたはcarrier承認後の開示に分ける。

この境界を破ると、番号が永続的な住所トラッキングIDになりうる。したがってIPv6型の発想はresearch-only boundaryに置き、実装では階層設計の参考に限定する。

## 2. プロトコル設計系

| No | 通信技術 | 住所への応用 | 実装理論 |
| ---: | --- | --- | --- |
| 11 | HTTP / HTTPS | 住所API、住所翻訳API、郵便番号APIの基本通信に使う。 | すべてHTTPS必須。外部connectorはno-cacheとno unsafe retryを既定にする。 |
| 12 | REST API | EC・配送会社・自治体が住所情報を取得する標準APIに使う。 | `/resolve`, `/translate`, `/verify`, `/handoff`, `/receipt` を安定APIにする。 |
| 13 | GraphQL | 必要な住所項目だけ取得する。 | `deliveryRisk` だけ、`country` だけなど選択的取得。ただし権限検査をfield単位で行う。 |
| 14 | gRPC | 配送会社・倉庫・EC間で高速に住所検証する。 | 高頻度B2B検証、POS、倉庫、配送label generationで使う。 |
| 15 | WebSocket | 入力中にリアルタイム補完・検証を行う。 | 住所フォーム補完、郵便番号候補、同期キュー状態に使う。 |
| 16 | MQTT | IoT宅配ボックス、スマートロック、配送ロボットとの軽量通信に使う。 | locker status、open/close receipt、offline sync triggerを低帯域で送る。 |
| 17 | CoAP | 低電力IoT機器で住所・配送通知をやり取りする。 | 山間部、農村、LPWAビーコン、災害地デバイス向けに使う。 |
| 18 | WebRTC | 配送員と受取人の一時的な匿名通信に使う。 | 住所本文を見せずに一時call/chat/datachannelで受け渡し調整する。 |
| 19 | SIP / VoIP | 住所を見せずに配送員が受取人に通話できる。 | masked call、番号非開示、通話receiptだけ保存する。 |
| 20 | SMTP型モデル | メールアドレスのように配送できる住所アドレス設計に使う。 | `alias@zone.agid` 的に、公開名から配送policyとresolverを引く。 |

### GraphQL / CoAP / WebRTC の採用境界と脅威モデル

プロトコル設計系は便利だが、住所では「必要な情報だけ取れる」ことが、そのまま「細かく推測できる」リスクになる。したがって次の3技術は、標準実装へ入れる前に境界を固定する。

| 技術 | 採用境界 | 主な脅威 | 最小対策 |
| --- | --- | --- | --- |
| GraphQL | core APIではなく、self-hostedまたはmanaged connector向けの任意APIに置く。公開APIはREST/OpenAPIを正とする。 | field introspectionで住所構造、配送可否、国別欠損を列挙される。細かいfield取得で本人や建物を推測される。 | introspectionを本番既定で無効化し、field単位のscope、rate limit、query depth limit、no-raw resolverを必須にする。 |
| CoAP | 低帯域IoT/ロッカー/災害地beacon用のconnector profileに置く。core resolverはHTTP系のままにする。 | 軽量payloadが平文化しやすい。端末紛失、replay、観測者による位置推測、ログ残存が起きやすい。 | DTLS/OSCORE、短命nonce、replay window、coarse zone、receipt-only payload、端末鍵失効を必須にする。 |
| WebRTC | Address Portalの一時連絡機能として扱い、住所解決の標準経路にしない。 | data channelやsignalingにraw住所、電話、精密位置、会話メタデータが混入する。相手確認前に直接通信が成立する。 | signalingはalias/commitmentだけ、data channelはallowlist payloadだけ、TURNログ最小化、期限付きconsent、録音/記録の既定無効を必須にする。 |

この境界により、GraphQLは「開発者が必要項目を取りやすい任意connector」、CoAPは「低帯域端末のhandoff補助」、WebRTCは「匿名連絡の一時チャネル」に留める。いずれもraw住所を返す新しい抜け道にしてはいけない。

### SIP / イベントストリーム / UWB の研究境界

住所通信工学では、通信量が増えるほど便利になる一方で、住所そのものを出さなくても生活圏、配送頻度、ホテル滞在、職場、移動履歴が推測される。したがって、音声、イベントログ、屋内測位は「住所本文を出さないから安全」とは扱わない。

| 技術 | 採用境界 | 主な脅威 | 最小対策 |
| --- | --- | --- | --- |
| SIP / VoIP | Address Portal、POS、ホテル、配送員の一時masked call connectorに限定する。 | 電話番号、通話録音、部屋番号、受付メモ、配送不能理由が副次的に保存される。 | alias、purpose、expiry、consent、revocation、receiptで発信を制御し、電話番号や録音は既定保存しない。 |
| Kafka型イベントストリーム | 大規模配送・住所更新・監査のconnector streamに限定し、public streamとprivate streamを分ける。 | イベントを横断joinすると住所変化、配送頻度、滞在地、本人属性が再構成される。 | topic classification、consumer scope、retention、replay制御、dead-letter scrubを必須にする。 |
| UWB | locker bay、dock door、reception counter、handoff zoneなど短命の近接証明に限定する。 | cm級測位が部屋、机、生活動線、ホテル滞在の追跡IDになる。 | zone-levelへ量子化し、raw ranging traceをreceipt生成後に破棄し、単独の配送完了証拠にしない。 |

この3つは「通信できるか」ではなく、「通信しても住所の私的構造を復元できないか」で評価する。AGIDでは、SIP/VoIPは会話チャネル、Kafka型streamは状態同期チャネル、UWBは近接証明チャネルであり、いずれも住所解決の正本にはしない。

### 屋内測位・広域測位・低遅延通信の境界

Wi-Fi RTT、セルラー測位、5Gは、配送現場では非常に有効である。だが、住所通信工学では、測位が細かくなるほど「住所を入力していないのに住所が復元される」危険が増える。したがって、これらは住所の代替ではなく、到達補助、制約確認、handoff readinessのためのconnectorとして扱う。

| 技術 | 採用境界 | 主な脅威 | 最小対策 |
| --- | --- | --- | --- |
| Wi-Fi RTT | 建物内の受付、棚、ロッカー、handoff zoneへのローカル案内に限定する。 | AP識別子やranging履歴から部屋、机、生活動線が推測される。 | raw AP/rangingは端末内に留め、zone-level confidenceとreceipt refだけを外へ出す。 |
| セルラー基地局測位 | GNSSや郵便番号が弱いときの粗いfallback signalに限定する。 | 反復観測から居住地、通勤、配送頻度が推測される。 | coarse areaへ量子化し、verified addressへ自動昇格しない。carrier metadataを最小化する。 |
| 5G | drone、robot、vehicle、lockerの低遅延状態同期に限定する。 | 高頻度telemetryが精密な配送先、移動経路、受取場所を露出する。 | reachability、safety state、constraint status、receipt syncだけを既定にし、精密telemetryは明示承認に分ける。 |

この層の原則は、`position assists handoff, but does not define identity` である。位置は配送を補助するが、本人、部屋、住所正本を定義しない。AGID/AOIDの住所正本は、policy、resolver、evidence、consent、carrier authorizationの組で決まる。

### 遠隔地・災害地通信の境界

LPWA / LoRaWAN と衛星通信は、郵便番号がない地域、不十分な地域、離島、山間部、災害地、船舶、仮設拠点で特に重要である。ただし、常設ビーコンや遅延同期は、住所本文を出さなくても生活圏、避難場所、配送頻度、移動経路を復元できる。したがって、AGIDではこれらを「住所を送る通信」ではなく、粗い到達性、状態同期、手動確認、receipt交換のconnectorとして扱う。

| 技術 | 採用境界 | 主な脅威 | 最小対策 |
| --- | --- | --- | --- |
| LPWA / LoRaWAN | no postal code地域、宅配ボックス、山間部ビーコン、低帯域receipt syncに限定する。 | 固定ビーコンから居住地や配送頻度が推測される。遅延packetやreplayが新しい証跡に見える。 | beacon alias rotation、coarse-region payload、短い有効期限、device attestation、manual confirmationを必須にする。 |
| 衛星通信 | 離島、災害地、砂漠、海上、通信断地域のAGID同期とmanual reviewに限定する。 | store-and-forward relayがprivate payloadを保持する。古いreceiptを現在の配送証跡として誤用する。 | public payloadはalias/commitment/receiptのみ。private payloadは権限付きE2EE、expiry再検証、stale-evidence表示、no-store relay policyを必須にする。 |

この層の原則は、`remote reachability is not private address disclosure` である。遠隔通信で届くことは、住所全文や精密座標を公開してよい理由にならない。通信が遅延するほど、AGIDは `Verified` ではなく `Partial` または `Manual required` を優先し、現場の安全確認と監査ログを残す。

## 3. メッセージング・イベント通信系

| No | 通信技術 | 住所への応用 | 実装理論 |
| ---: | --- | --- | --- |
| 21 | Pub/Sub | 住所変更・配送ステータス変更を関係者に配信する。 | topicは `address.updated`, `handoff.completed`, `credential.revoked` など。 |
| 22 | Message Queue | 配送依頼、住所検証、ラベル発行を順番に処理する。 | retry可能/禁止をjob metadataに持たせる。raw住所jobは禁止または暗号化する。 |
| 23 | Kafka型イベントストリーム | 大量の住所更新・配送イベントをリアルタイム処理する。 | public streamはcommitment/refだけ。private streamは暗号化・権限付きにする。 |
| 24 | Webhook | ECサイトや配送会社に住所更新・受取完了を通知する。 | HMAC署名、idempotency key、raw住所除去、payload fingerprintを必須にする。 |
| 25 | Push通知 | 受取人に住所入力依頼、配送予定、再配達通知を送る。 | 通知本文に詳細住所を含めず、期限付きリンク/receipt中心にする。 |
| 26 | SMS Gateway | アプリがない受取人にも住所入力リンクを送る。 | SMSには短いaliasと期限付きURLだけ。住所本文は送らない。 |
| 27 | Email通知 | 住所入力依頼、配送確認、住所変更確認を送る。 | メール本文は低リスク情報だけ。詳細は認証後に開示する。 |
| 28 | Retry制御 | 通信失敗時に住所確認・配送通知を再送する。 | unsafe retry禁止。住所開示、決済、PMS書込は再送前にidempotencyを確認する。 |
| 29 | Idempotency Key | 同じ住所登録や配送依頼を二重処理しない。 | `requestId + purpose + subjectCommitment` で二重登録を防ぐ。 |
| 30 | Dead Letter Queue | 住所検証に失敗した配送依頼を隔離する。 | 失敗理由、再送禁止、手動確認、privacy scrub結果を保存する。 |

## 4. モバイル・近距離通信系

| No | 通信技術 | 住所への応用 | 実装理論 |
| ---: | --- | --- | --- |
| 31 | NFC | スマホをかざして配送先を渡す。 | ホテル、空港、店舗受取、ロッカーでSecure Address QRと同じenvelopeを渡す。 |
| 32 | QRコード通信 | 住所入力URL、配送トークン、受取確認に使う。 | QR payloadにはraw住所を入れず、commitment、scope、expiry、receiptを入れる。 |
| 33 | Bluetooth Low Energy | 宅配ボックス、スマートロック、配送ロボットとの近距離通信に使う。 | locker proximity proof、door handoff、offline receiptに使う。 |
| 34 | UWB | 建物内・倉庫内で高精度に受取場所を特定する。 | room-levelではなく、handoff zoneやlocker bay程度に粒度制御する。 |
| 35 | Wi-Fi RTT | 屋内位置推定に使い、部屋・受付・宅配棚まで案内する。 | 屋内案内は端末内処理を優先し、精密位置ログを保存しない。 |
| 36 | GPS / GNSS通信 | 配送地点、仮想住所、災害時住所の位置確認に使う。 | AGID生成、現在地、山・海・災害地の仮想住所に使う。 |
| 37 | セルラー基地局測位 | GPSが弱い場所でも大まかな住所エリアを推定する。 | high-risk時は粗いエリアだけ使い、精密住所の代替にしない。 |
| 38 | 5G | 低遅延で配送ロボット、ドローン、スマート物流と連携する。 | telemetryではなく、到達可否・handoff safety・receipt syncに限定する。 |
| 39 | LPWA / LoRaWAN | 農村・島・山間部の宅配ボックスや住所ビーコンに使う。 | no postal code地域の低帯域address beaconとして使う。 |
| 40 | 衛星通信 | 離島、災害地、砂漠地域の住所通信に使う。 | country packが弱い場所でもAGID、座標、receipt、manual reviewを同期する。 |

## 5. セキュア通信・認証系

| No | 通信技術 | 住所への応用 | 実装理論 |
| ---: | --- | --- | --- |
| 41 | TLS | 住所データ通信を暗号化する。 | 住所API、resolver、connector、download manifestで必須にする。 |
| 42 | mTLS | 配送会社・EC・自治体など法人同士を相互認証する。 | OPERA、POS、配送、郵便番号API proxy、registry writeに使う。 |
| 43 | OAuth 2.0 | ユーザーがECサイトに住所利用権限を安全に渡す。 | Address Portalでscope、purpose、expiryつきconsentを発行する。 |
| 44 | OpenID Connect | ログインと住所利用権限を連携する。 | ユーザー認証と住所権限を分け、住所開示は追加consentにする。 |
| 45 | JWT | 住所アクセス権限や配送トークンを短時間だけ有効にする。 | JWTにはraw住所を入れず、ref、scope、aud、exp、nonceを入れる。 |
| 46 | MAC署名 / HMAC | WebhookやAPIリクエストの改ざん確認に使う。 | webhook、connector callback、receipt uploadで署名検証する。 |
| 47 | Rate Limiting | 住所APIの不正取得・大量アクセスを防ぐ。 | lookup、QR verify、postal lookup、login、webhook endpointにかける。 |
| 48 | WAF | 住所入力フォームや住所APIを攻撃から守る。 | SQLi、XSS、SSRF、prompt injection、oversized payloadを止める。 |
| 49 | Zero Trust Network | 社内・配送会社・倉庫でも住所アクセスを常に検証する。 | ネットワーク内でもrole/scope/device/auditを毎回検証する。 |
| 50 | End-to-End Encryption | EC事業者には見せず、配送会社と受取人だけが住所を復号する。 | Secure Address QRとAOIDで、merchantは配送可否だけを見る設計にする。 |

## 住所通信の抽象モデル

住所通信を次の5要素で定義する。

```text
M = (S, D, R, P, E)
```

| 記号 | 意味 |
| --- | --- |
| `S` | sender。EC、POS、ホテル、配送員、行政、本人 |
| `D` | destination。AGID、AOID、alias、locker、delivery zone |
| `R` | resolver。Address DNS、registry、country pack、postal API |
| `P` | policy。purpose、scope、expiry、role、retry、privacy |
| `E` | evidence。receipt、commitment、signature、audit log |

住所通信は次の順序で行う。

```text
resolve → authorize → disclose/minimize → handoff → receipt → audit
```

raw住所は `disclose` の一部であり、常に必要なわけではない。多くの場面では、配送可否、alias、commitment、receiptだけで足りる。

### 7要素拡張モデル

研究モデルとしては、5要素だけでは再送、失効、監査、秘匿の扱いが弱い。住所をプロトコル化するには、次の7要素で扱う方がよい。

```text
ACM = (S, D, R, P, E, C, T)
```

| 記号 | 意味 |
| --- | --- |
| `S` | sender。住所通信を開始する主体 |
| `D` | destination。AGID、AOID、alias、commitment、locker、carrier |
| `R` | resolver。Address DNS、registry、country pack、postal API、local resolver |
| `P` | policy。purpose、scope、expiry、role、retry、privacy |
| `E` | evidence。receipt、commitment、signature、audit、nullifier |
| `C` | channel。REST、Webhook、QR、NFC、BLE、CoAP、SIP、WebRTCなど |
| `T` | trust boundary。local、public、connector、carrier-authorized、research-only |

このとき安全な住所通信は次の条件を満たす。

```text
safe(ACM) =
  no_raw_public_payload(C)
  ∧ bounded_scope(P)
  ∧ unexpired(P)
  ∧ auditable(E)
  ∧ authorized(S, D, P, T)
  ∧ retry_safe(P, C)
```

住所本文を出す通信は `safeForPublicTransport = false` とし、carrier-authorizedまたはlocal-onlyの境界でだけ扱う。逆に、public境界で扱えるのは `alias / commitment / receipt / policy hash / coarse status` に限る。

### 通信チャネルの選択原則

1. `core`: REST/OpenAPI、Secure Address QR、Address DNS、no-raw webhookを正とする。
2. `connector`: GraphQL、gRPC、MQTT、CoAP、SIP、WebRTC、Kafka型stream、UWBは用途別に閉じ込める。
3. `research-only`: 永続識別子化、精密屋内測位、衛星・LPWA beaconの広域運用、IPv6型公開番号は実験境界を明示する。
4. 住所の到達性は、通信の到達性と同一ではない。ネットワーク的に届いても、配送、法制度、本人同意、地理的到達が満たされなければ失敗である。

## 状態機械

```text
created
↓
resolved
↓
authorized
↓
queued
↓
sent
↓
accepted
↓
handoff_completed
```

例外状態:

```text
blocked
expired
revoked
retry_wait
dead_letter
manual_review
unsafe_retry_denied
```

状態遷移は、UIボタン、API、Webhook、PMS/POS connectorで共通にする。

## AGIDへの実装ロードマップ

### 短期

1. Webhook payloadをcommitment、alias、receipt、fingerprint中心に統一する。
2. すべての外部connectorを `connectorFetchNoCache` と認証ポリシーに乗せる。
3. Address DNSのpublic recordにraw住所が混ざらないテストを強化する。
4. QR/NFC/BLEのpayload envelopeを共通化する。
5. retry、idempotency、dead-letterのUI表示を現場アプリへ出す。

### 中期

1. Address Communication Envelopeを仕様化する。
2. mTLS/OAuth/OIDC/JWT/HMACをconnector別に分離する。
3. MQTT/CoAP/LoRaWAN向けの低帯域handoff profileを作る。
4. WebRTC/SIPによる匿名連絡をAddress Portalの権限モデルへ接続する。
5. E2EE address handoffをSecure Address QRとAOIDへ統合する。

### 長期

1. Carrier route announcementをBGP的に扱う配送到達性ネットワークを作る。
2. Anycast/edge resolverで国別住所packを低遅延配信する。
3. DID/VC/ZKと連携し、住所全文を出さない国際配送・本人確認を実現する。
4. 災害地・離島・山間部向けに衛星/LPWA address beaconを設計する。

## 失敗してはいけない点

- QR、JWT、Webhook、Push通知、SMS、Emailにraw住所を入れない。
- 住所開示系APIに自動retryをかけない。
- CDNやpublic DNSへprivate AOID、部屋番号、電話番号、受取人名を置かない。
- IoTやロッカーの近距離通信payloadをログに残さない。
- Address DNSを「住所を引けるDNS」にしない。引けるのはcommitment、policy、resolver、rootである。
- 通信の便利さで住所の最小開示原則を崩さない。

# AGID プログラミング言語選定ポリシー

作成日: 2026-06-18

このポリシーは、AGID/AOID、POS、Operations、ZK、Ethereum、SDK、GIS検証、論文検証を含む本プロジェクトで、どの機能をどのプログラミング言語で書くべきかを判断するための基準である。原則は固定するが、実測・保守性・安全性によって例外を認める。

実行可能な判定ヘルパーは `src/lib/programmingLanguagePolicy.ts` に置く。個別機能で迷った場合は、まずこのモジュールの `recommendLanguage` と本書の表を参照する。

## 1. 基本原則

既定言語は TypeScript とする。

ただし、次の領域は TypeScript に固執しない。

| 領域 | 推奨言語 | 理由 |
| --- | --- | --- |
| UI / POS / Dashboard | TypeScript | React、ブラウザAPI、QR/NFC、状態管理と相性がよい。 |
| API orchestration / adapter | TypeScript | I/O、JSON、OpenAPI、Webhook、外部API接続を速く安全に実装できる。 |
| Address policy / Radar / Intent | TypeScript | 仕様変更が多く、説明可能なルールとしてテストしやすい。 |
| AGID deterministic geo core | Rust + WASM, TypeScript fallback | 数値決定性、速度、衝突リスク、クロス言語SDKの基準実装に向く。 |
| 高負荷 worker / relayer / Merkle builder | Rust | p95/p99、メモリ、バッチ処理、署名/検証ループに強い。 |
| DB検索 / spatial index / persistence | SQL + DB固有index | PostgreSQL/PostGIS/Redis/Mongoなどが持つ索引と整合性に任せる。 |
| Ethereum / L2 contract | Solidity | issuer、revocation、nullifier、paymentなど最小公開状態を扱う。 |
| ZK circuit | Circomを当面の実用基準。必要に応じてNoir/Halo2/zkVM検討 | TypeScriptは証明のオーケストレーションであり、制約そのものは回路で書く。 |
| Lean proof | Lean | 不可能性定理、状態遷移、安全性命題など抽象数学の検証に向く。 |
| GIS実験 / PDF生成 / data analysis | Python | GIS、PDF、実験、Notebook、バッチ処理に強い。 |
| 多言語SDK | Generated SDK | `sdk/agid-spec/test-vectors.json` による parity を最優先する。 |

## 2. 変更してよい条件

TypeScriptから別言語へ移す条件は、次のいずれかを満たす場合に限定する。

1. 実測で p95 / p99 が悪く、UXや運用に影響している。
2. 数値決定性が必要で、TypeScriptの浮動小数・実装差がリスクになる。
3. ZK回路、スマートコントラクト、形式証明のように、領域自体が専用言語を要求する。
4. DBが本来担当すべき索引、制約、JOIN、spatial query をアプリで再実装している。
5. 多言語SDKの parity のため、生成器または基準実装として切り出す必要がある。
6. セキュリティ境界を狭くするため、秘匿predicateや署名workerを小さなnative boundaryに隔離した方がよい。

逆に、次の場合はTypeScriptに残す。

1. UI、フォーム、画面遷移、POS操作、Dashboard表示。
2. 住所品質やAddress Radarなど、頻繁にルール調整する政策ロジック。
3. 外部API adapter、Webhook、OpenAPI、JSON schema。
4. DBやRustに移しても複雑さだけが増え、実測改善がない処理。
5. セキュリティ監査前の暗号処理を独自実装する誘惑がある処理。

## 3. リファクタリング判断

### 3.1 まず境界を作る

別言語へ移す前に、TypeScript側で型境界を作る。

```text
UI
  -> TypeScript service boundary
  -> stable schema / test vectors
  -> Rust, SQL, Solidity, Circom, Lean, Python
```

境界がないまま別言語化すると、保守性が下がる。

### 3.2 必ずfallbackかfixtureを持つ

Rust/WASMを導入する場合は、TypeScript fallback または parity fixture を持つ。

ZK circuitを導入する場合は、witness fixture と検証スクリプトを持つ。

Solidityを導入する場合は、ABI、ローカルチェーンテスト、receipt確認を持つ。

Leanを導入する場合は、どの自然言語主張を検証しているかを文書化する。

### 3.3 raw address境界を壊さない

言語を変えても、次は保存・公開しない。

- raw address
- raw AGID in high-risk mode
- raw AOID
- AGID-S payload
- recipient secret
- proof code
- carrier API key
- 追跡可能な用途横断ID

## 4. 領域別の採用ルール

### TypeScriptを選ぶ

- React UI
- POS端末画面
- 住所登録
- AddressIntent / LabelIntent / TransportIntent の状態機械
- API adapter
- Webhook
- Address Radarの説明可能ルール
- テストとfixture駆動の業務ロジック

### Rustを選ぶ

- AGID encode/decode の基準実装
- cell bounds / cell geometry
- ZK predicate geometry
- 高負荷batch worker
- Merkle root builder
- registry relayer
- p95/p99が問題になった処理

### SQL / PostGIS / Redis / MongoDBを選ぶ

- spatial index
- address index
- resolver cache
- nullifier lookup
- revocation lookup
- event sourcing
- audit query
- CRDT同期後の衝突検出

### Solidityを選ぶ

- issuer registry
- revocation registry
- nullifier registry
- verifier contract
- escrow / prepaid / COD payment
- commitment root anchoring

ただし住所や位置そのものは載せない。

### Circom / Noir / Halo2 / zkVMを選ぶ

- ZK Address Proof
- Residence Proof
- Delivery Eligibility
- AOID ownership
- duplicate prevention
- quality threshold
- region membership

当面は Circom + snarkjs を実用基準とする。Noir/Halo2/zkVMは、回路規模・監査・開発体制が整ってから比較する。

### Leanを選ぶ

- 住所参照不可能性定理
- 同値類安定性
- 状態遷移の安全性
- merge/splitの抽象的正当性
- nullifier衝突しないための抽象条件

Leanは現実のGIS精度や郵便番号データ品質を証明しない。そこは実験とデータ監査で扱う。

### Pythonを選ぶ

- PDF生成
- GISバッチ検証
- notebook分析
- データ変換
- レポート生成
- 一回限りの探索

Pythonを本番Webランタイムの中心にしない。

## 5. 今回のリファクタリング結果

今回、次を実施した。

1. `src/lib/programmingLanguagePolicy.ts` を追加し、言語選定ルールを実行可能にした。
2. `src/lib/programmingLanguagePolicy.test.ts` を追加し、TypeScript / Rust / Circom / Lean / Solidity の判断をテスト化した。
3. `src/lib/zkProofRuntime.ts` のZK周辺の言語判断理由を、共通ポリシーから参照するようにした。
4. README、CONTRIBUTING、docs index からこのポリシーへ誘導する。

## 6. 今後の運用ルール

新機能を作るときは、最初に次を決める。

```text
1. これはUIか、policyか、core mathか、contractか、circuitか、proofか、DB queryか。
2. TypeScriptで十分か。
3. TypeScriptで危険・遅い・不正確・証明不能になる理由があるか。
4. 別言語にする場合、schema / fixture / parity test / fallback はあるか。
5. privacy boundaryを壊していないか。
```

迷ったら、TypeScriptで小さく実装し、テストとベンチマークで移植理由を作ってからRust/SQL/Circom/Solidity/Leanへ移す。

一文でまとめると、AGIDは TypeScript-first だが TypeScript-only ではない。UIと政策はTypeScript、決定的数値核はRust、公開台帳はSolidity、秘匿証明は回路、抽象定理はLean、データ実験はPython、検索と永続化はDBに任せる。

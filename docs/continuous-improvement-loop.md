# AGID Continuous Improvement Loop

AGIDの改善は、無限実行ではなく、短い安全なサイクルを繰り返します。
各サイクルは次の順番で進めます。

1. 新しい signal を集める
2. security / privacy / reliability を優先して並べる
3. 小さい変更で1つずつ閉じる
4. 必須 gate を走らせる
5. 証拠、残リスク、次のsignalを記録する

## Every Loop Must Improve

改善ループは、確認だけで終わらせません。

- 実装できる場合は、小さく互換性のある変更を1つ入れる。
- 実装できない場合は、失敗gate、承認待ち、次に直す最小単位を記録する。
- `npm run improve:loop` は既定で `reports/continuous-improvement-ledger.jsonl` に1行追記する。
- レジャーには raw住所、受取人、電話、メール、witness、private key、secret を入れない。
- 本当に記録を避ける検証だけの実行は `-- --no-ledger` を明示する。
- 直近16件のledgerで同じsignalの成功証跡が残っている場合は、そのsignalを一時的に低優先へ回し、次の安全な改善対象へ進む。

## Default Priority

優先順位は固定です。

- security
- privacy
- reliability
- performance
- address-quality
- PWA
- maintainability
- docs

## Safety Rules

- ループ数は最大12回までです。
- production traffic は明示ACKなしで実行しません。
- external network は明示許可なしで使いません。
- destructive change は明示許可なしで実行しません。
- raw address / recipient / witness / private key をsignalやreportに入れません。
- 本番負荷テストは dry-run が先です。

## Commands

計画だけを見る:

```bash
npm run improve:loop
```

必須gateまで実行する:

```bash
npm run improve:loop:gates
```

production load-test dry-runも含める:

```bash
npm run improve:loop -- --include-production-load-dry-run
```

cycle数を指定する:

```bash
npm run improve:loop -- --max-cycles=3
```

## Gate Set

既定の必須gate:

- `npm run verify:dependency-audit`
- `npm run verify:preaudit-secrets`
- `npm run lint`
- `npm run verify:app-shell`
- `npm run verify:developer-console`
- `npm run verify:oss-compatibility`
- `npm run build`
- `npm run verify:build-chunk-budget`
- `npm run verify:pwa`
- `npm run verify:mandatory-security`
- `npm run verify:no-raw-address`

注意:

- `verify:dependency-audit` は外部ネットワークを使うため、明示許可がないループでは実行しません。
- `verify:oss-compatibility` は open-source/commercial source boundary と、住所写像論など独立研究repoの境界を守るための公開前gateです。
- `verify:build-chunk-budget` は `npm run build` の直後に実行します。CIやrelease candidateでは `AGID_BUILD_BUDGET_MAX_AGE_MINUTES` を設定し、古い `dist` を見ていないことも失敗条件にします。
- `verify:pwa` は PWA installability、service worker registration、明示した browser bundle budget を確認します。
- CIやrelease candidateでは `npm run verify:release-build-assets` を使うと、`build -> verify:build-chunk-budget -> verify:pwa` を固定順で実行し、`AGID_BUILD_BUDGET_MAX_AGE_MINUTES` は未設定なら `30` として扱います。
- 改善ループの performance / PWA / OSS hero 系の推奨チェックは `verify:release-build-assets` を優先します。推奨リストでは個別の `build`、`verify:build-chunk-budget`、`verify:pwa` を重複表示せず、gate一覧と失敗時の切り分け用に残します。

任意gate:

- `npm run loadtest:prod:dry-run`

## Loop Policy

次のどれかで止めます。

- ループ数上限に達した
- actionable signal がない
- production / external / destructive approval が必要
- required gate が失敗した

止まった場合は、失敗を隠さず、次の1手だけに絞って再開します。

# Address Element Readiness

Address Elementは、EC、CMS、POS、買い物Agentに埋め込む住所入力コンポーネントです。完成度を上げる目的は、単に住所欄を増やすことではなく、ホストアプリが生住所を受け取らずに「次に進めるか」「要確認か」「ブロックか」を安全に判断できるようにすることです。

## 職種別の確認観点

| 職種 | 見るもの | Address Elementで固定したこと |
| --- | --- | --- |
| checkout-integrator | EC/CMS/POSへの埋め込み、イベント、scope同意 | `onPublicEvent` と `onReadinessChange` で安全メタデータだけを通知する |
| addressing-specialist | 国別住所制度、言語タブ、必須項目、郵便番号補完 | 欠落項目、郵便番号証拠、AGID証拠をreadiness checkへ集約する |
| carrier-ops | QR/NFC、配送handoff、AddressIntent | スキャン導線とcarrier scan要求を職種別に評価する |
| privacy-security | 生住所非公開、高リスクモード、AGID-S優先 | 公開イベントとreadiness metadataに生住所、raw AGID/AOID、電話番号を含めない |
| accessibility-i18n | ローカル言語、国際配送英語、短い状態表示 | 言語タブと英語配送表示をチェックする |
| support-review | 要確認、拒否、警告コード、次アクション | 警告とnext actionをレビュー導線に変換する |
| developer-platform | SDKイベント、安定ID、safe fingerprint | session ID、intent ID、safe fingerprintを検査する |

## 公開イベント契約

追加した公開イベントは `src/lib/addressElementEvents.ts` で定義します。

公開してよいもの:

- `sessionId`
- `intentId`
- element status
- quality decision
- intent status
- next action
- field count summary
- evidence source summary
- language tab summary
- warning code

公開してはいけないもの:

- 住所本文
- 受取人名
- 電話番号
- 部屋番号
- raw AGID
- raw AOID
- proof code
- recipient secret
- private key
- 暗号文本文

イベントメタデータのkeyに上記の危険語が含まれる場合、`address-element-event-private-metadata` として例外にします。これは少し厳しめですが、オープンソースSDKとして安全側に倒しています。

## Readiness判定

`src/lib/addressElementReadiness.ts` は、Address Elementの状態を職種別のcheckに変換します。

主な出力:

- `status`: `ready | usable | needs_review | blocked`
- `checks`: 職種別の詳細チェック
- `roleSummaries`: 職種ごとのpass/warning/fail
- `nextActions`: ホストアプリが表示すべき次アクション
- `publicMetadata`: 生住所を含まない公開メタデータ

ユーザーやPOSオペレーターには内部スコアを見せません。UIには状態、職種別の概要、最初のnext actionだけを表示します。

## 埋め込み側の使い方

React側は `src/components/AgidAddressElement.tsx` で次を受け取れます。

```tsx
<AgidAddressElement
  hostSurface="ec"
  onPublicEvent={(event) => {
    // send to host analytics, webhook preview, or local audit log
  }}
  onReadinessChange={(metadata) => {
    // update host submit button state without reading raw address fields
  }}
/>
```

ホストアプリに渡すのはsafe eventだけです。フォーム内部の生入力は、ブラウザ、POS端末、またはユーザー端末内に閉じます。

## 検証

単体検証:

```bash
npm run verify:address-element
```

公開前の推奨検証:

```bash
npm run verify:address-element
npm run verify:no-raw-address
npm run lint
```

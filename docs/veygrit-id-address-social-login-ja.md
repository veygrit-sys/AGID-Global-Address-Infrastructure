# Veygrit ID: 住所入力代行ソーシャルログイン構想

## 結論

Veygrit ID は、単なるソーシャルログインではない。

Google / Apple のみをアカウント作成入口にしながら、ユーザーが Veygrit 住所帳に保存した自分の住所、旅行用氏名、連絡先、会社情報を、審査済み法人サイトへ同意付きで入力代行するための共通ID基盤である。

```text
普通のソーシャルログイン:
  ログインする
  基本プロフィールを渡す

Veygrit ID:
  ログインする
  法人サイトを確認する
  要求scopeを見る
  ユーザーが許可する
  必要な情報だけ一回渡す
  いつでも取り消す
```

## 参考にする導入体験

Clerk は、複数フレームワーク向けに認証UIやSDKを提供し、Googleなどの social connections を簡単に追加できる開発者体験を持つ。Veygrit ID も、開発者にとってはボタンとSDKで導入できる形にする。

ただし、Veygrit ID は誰でも自由に埋め込めるボタンにしてはいけない。住所、航空券用氏名、電話番号を扱うため、導入できるのは審査済み法人だけに限定する。

## 標準との接続

OpenID Connect は OAuth 2.0 の上にある認証レイヤーであり、ID Token と Claims によりユーザー認証情報を扱う。Veygrit ID はこの考え方に合わせる。

Googleログインでは、OAuthクライアント、redirect URI、consent screen、state、nonce、ID token validation が重要になる。Veygrit ID でも、同じく `state` と `nonce` を必須にし、登録済みredirect URI以外へclaimを送らない。

## 本格IDコア

Veygrit ID の中核は、次の順序で動く。

```text
Google / Apple sign-in
  -> Vey ID session
  -> pairwiseSubjectAlias
  -> consent grant
  -> authorizationCodeRef
  -> accessTokenRef / idTokenRef / addressCredentialRef
  -> wallet-side revocation
```

ECに返すIDは、全ユーザー共通の `subjectId` ではなく、partner client と origin ごとに分かれる `pairwiseSubjectAlias` にする。これにより、あるECでのユーザー識別子が別ECへ横流しされても横断追跡しにくい。

Vey ID session は Google / Apple の provider subject を hash として保持し、`providerIdToken`、`providerAccessToken`、`providerRefreshToken`、`rawProviderProfile` は保存しない。ECへ返す token も raw bearer token ではなく、実装上は短期参照として `accessTokenRef` と `idTokenRef` を扱う。

住所入力代行は `addressCredentialRef` と `walletConsentRef` で表す。ECが見るのは次だけにする。

- `pairwiseSubjectAlias`
- `walletSessionRef`
- `authorizationCodeRef`
- `accessTokenRef`
- `idTokenRef`
- `addressCredentialRef`
- `walletConsentRef`

ECに渡さないもの:

- 生住所
- Google / Apple token
- provider raw profile
- 受取人電話番号
- private key
- proof secret

解除はウォレット側を主にする。ユーザーが連携解除すると、Veygrit は `pairwiseSubjectAlias`、`walletConsentRef`、`addressCredentialRef`、`carrierHandoffRef` の失効通知を出し、ECは保存済み参照を削除する。

## ECゲストチェックアウト

EC側では、必ずしも会員登録やECパスワード作成を要求しない。

ゲスト購入では、ユーザーは Veygrit 側で Google / Apple ログインと住所同意を行い、EC側には短期の `guestCheckoutAlias`、`walletConsentRef`、`addressCredentialRef`、`carrierHandoffRef` だけを渡す。

```text
EC guest checkout:
  EC account creation: optional / not required
  EC password: not required
  Veygrit wallet login: required
  Veygrit consent: required
  merchant-visible data: refs only
```

この方式により、ECは「ログインさせる」導線と「会員登録なしで買える」導線を分けられる。Playlist Commerce はストア発見・管理の入口、Veygrit ID の guest checkout handoff は購入時の住所入力代行であり、役割を混ぜない。

## サービス定義

Veygrit ID は次の三つを統合する。

```text
1. Auth Provider
   Google / Apple only

2. Personal Address Book
   自分の住所、旅行用氏名、会社情報、言語、国・地域

3. Reviewed Partner Autofill
   審査済み法人サイトへの同意付き住所入力代行
```

## Veygrit住所帳

ユーザーは Veygrit に自分の住所だけを保存できる。

```text
保存可:
  自宅
  職場
  ホテル配送先
  一時配送先
  請求先

MVPでは保存不可:
  家族の住所
  友人の住所
  他人の電話番号
  パスポート番号そのもの
```

重要なのは、住所本文を公開claimにしないことである。内部では暗号化保存し、外部へは同意後の短期 sealed claim として渡す。

## プロフィール種別

Veygrit ID では、通常プロフィールと旅行プロフィールを分ける。

```text
profile.basic:
  表示名
  基本氏名
  メールalias

profile.travel:
  航空券用氏名
  パスポート表記名
  国籍
  生年月日

address.shipping:
  配送先住所

address.billing:
  請求先住所

hotel.delivery:
  ホテル配送先
  宿泊予定alias

company.info:
  会社名
  部署名
  法人配送用情報

contact.phone:
  電話番号

locale:
  言語
  国・地域
```

航空券用氏名は通常の表示名と分離する。これは航空券、ホテル、国際配送で名前順序やローマ字表記が重要になるためである。

## 法人審査

Veygrit ID ボタンを導入できるのは、原則として審査済み法人だけである。

```text
審査するもの:
  法人確認
  KYB
  ドメイン確認
  HTTPS
  事業内容
  プライバシーポリシー
  セキュリティ
  不正・詐欺履歴
  要求scopeの妥当性
```

導入できない対象は次。

```text
個人サイト
匿名運営サイト
審査不能なサイト
詐欺・違法リスクが高いサイト
成人向け
高リスクカテゴリ
```

審査後に `client_id` とAPIキーを発行する。ただしAPIキーやwebhook secretは公開ログやクライアント側に出さない。

## ユーザー同意画面

Veygrit ID の中心は同意画面である。

ECサイト例:

```text
example-shop.com が以下の情報を要求しています

必須:
  profile.basic
  address.shipping
  contact.phone

任意:
  locale

[許可する]
[拒否する]
```

旅行サイト例:

```text
travel.example が以下の情報を要求しています

必須:
  profile.travel
  contact.phone
  locale

[許可する]
[拒否する]
```

住所、電話番号、旅行用氏名などの sensitive scope は、再認証を要求する。

## データ受け渡し

Veygrit ID は、公開プロフィールとして住所を配るものではない。

ユーザー同意後、登録済みredirect URIへ短期 sealed claim を送る。

```text
grant:
  scopes
  consent status
  selected address id
  sealed claim envelope id
  audience
  ttl

ログに残さない:
  実住所
  電話番号
  航空券用氏名
  請求書本文
  パスポート番号
```

claimは受信先法人だけが読める一時データとして扱う。Veygrit側の監査ログには、scope、同意、commitment、envelope id だけを残す。

## Clerkのような導入形

開発者向けには、次の導入体験を目指す。

```text
npm install @veygrit/id
```

React例:

```tsx
<VeygritAddressButton
  clientId="vg_client_example_shop"
  scopes={["profile.basic", "address.shipping", "contact.phone"]}
  purpose="checkout-address-autofill"
/>
```

バックエンド側:

```text
GET  /.well-known/veygrit-client.json
POST /veygrit/oauth/callback
POST /veygrit/address-fill/exchange
POST /veygrit/webhooks
```

ただし、SDKを入れても、審査済み `client_id`、ドメイン確認、redirect URI登録がなければ本番利用できない。

## Address Link / Portal との関係

既存の Address Link は、住所由来の資格や配送可否を埋め込みUIで扱う。

Veygrit ID は、それより上位のユーザーアカウント基盤である。

```text
Veygrit ID:
  ログイン
  住所帳
  法人審査
  同意
  claim発行

Address Link:
  配送可能性
  受取人確認
  粗い地域
  住所品質

Address Portal:
  連携済みサイト確認
  取消
  削除
  export
```

## MVP

最初に作るべき範囲は次。

```text
Google login
Apple login
Passkey / MFA for step-up only
Veygrit住所帳
自分の住所のみ保存
航空券用氏名commitment
法人申請
ドメイン確認
client_id発行
scope審査
同意画面
短期sealed claim
連携解除
export/delete
```

## 可能性

この構想はかなり強い。

ECでは、住所入力ミスを減らせる。

旅行では、航空券用氏名やホテル配送先を安全に再利用できる。

法人購買では、部署名や法人配送先を統制できる。

ユーザー側では、どのサイトに何を渡したかを一元管理できる。

ただし、Veygrit ID の価値は「入力を楽にすること」だけではない。偽サイトへ住所を渡さない、必要なscopeだけ渡す、いつでも取り消せる、という安全設計が本体である。

## 一文定義

Veygrit ID は、審査済み法人サイトに対して、ユーザーが同意した住所・旅行・連絡先情報だけを短期sealed claimとして入力代行する、住所帳型ソーシャルログイン基盤である。

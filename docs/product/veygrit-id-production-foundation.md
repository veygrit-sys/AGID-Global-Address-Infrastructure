# Veygrit ID production foundation

Veygrit IDはAddress Wallet、Veygrit Store、Veygrit -ship、Shopify/WooCommerce/Custom ECをつなぐpairwise OpenID Connect providerである。GoogleとAppleだけを上流の本人認証手段とし、それらのaccess tokenやrefresh tokenをVeygritエコシステムの共通IDとして配布しない。

## 実装済み境界

- Authorization Code Flow + PKCE S256
- allowlist完全一致のredirect URIとorigin
- Store/clientのsectorごとにHMACで導出するpairwise `sub`
- Ed25519署名のID tokenと公開JWKS
- DBにはauthorization code、access token、refresh token、session tokenをハッシュで保存
- authorization codeの一回消費
- refresh token rotationとreuse detection。再利用時はfamily全体を`compromised`にする
- HttpOnly、SameSite=Lax、production Secure cookie
- Google/Apple JWTのremote JWKS検証
- Address Wallet／Store／Ship間の短時間・一回限りnavigation handoff
- Secret本体はAWS Secrets Manager、GCP Secret Manager、Azure Key Vaultから実行時に取得
- 認可、セッション、token、handoffの監査イベント

## 保存しないもの

- Google/Appleのprovider access token、refresh token、ID token
- 生のprovider subject。pepper付きHMACだけを保存する
- 生のメールアドレス。必要な照合はpepper付きHMACで行う
- raw address、電話番号、Carrier Secret
- signing private key。DBには公開JWKとSecret Manager参照だけを置く

## 本番起動に必要な設定

- `VEYGRIT_ID_DATABASE_URL`
- `VEYGRIT_ID_ISSUER`
- `VEYGRIT_ID_SIGNING_KEY_ID`
- `VEYGRIT_ID_SIGNING_PRIVATE_KEY_SECRET_REF`
- `VEYGRIT_ID_PAIRWISE_SECRET_REF`
- `VEYGRIT_ID_PROVIDER_PEPPER_REF`

3つのSecret参照はAWS ARN、GCP Secret Version、Azure Key Vault URLのいずれかにする。PostgreSQLへ`db/veygrit-id-core.postgres.sql`を適用してから起動する。設定不足時はID endpointを503にし、メモリ上の疑似ログインへフォールバックしない。

## 残る外部設定

Google CloudとApple Developer側のclient登録、callback URL、秘密鍵、ブランド審査は外部コンソール作業である。callbackで受け取った上流tokenは検証処理のローカル変数だけに保持し、Veygrit ID storeへ渡すのは検証済みprovider subjectと検証状態だけにする。

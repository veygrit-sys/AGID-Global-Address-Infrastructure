import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  Clock3,
  Code2,
  EyeOff,
  Link2,
  PackageCheck,
  PanelsTopLeft,
  Route,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Webhook,
} from 'lucide-react';
import React from 'react';

import { playlistCommercePresentationMap } from '../lib/playlistCommercePresentationMap';
import {
  buildAddressWalletSocialLoginAddressReusePlan,
  buildPlaylistCommerceMerchantParticipation,
  buildVeygritCommerceIntegrationDecisionPlan,
} from '../lib/playlistCommerceCheckout';
import {
  buildPlaylistCommerceSdkContract,
  buildPlaylistCommerceSdkQuickstart,
  createPlaylistCommerceSdkTestClient,
} from '../lib/playlistCommerceSdk';
import {
  buildPlaylistCommerceSpec,
  summarizePlaylistCommerceSpec,
} from '../lib/playlistCommerceSpec';

function goHome() {
  window.location.href = '/';
}

function MetricCard({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{note}</p>
    </div>
  );
}

function SectionTitle({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-600">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-500">{body}</p>
    </div>
  );
}

function safeJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function PlaylistCommerceWidgetScreen() {
  const spec = React.useMemo(() => buildPlaylistCommerceSpec(), []);
  const summary = React.useMemo(() => summarizePlaylistCommerceSpec(spec), [spec]);
  const contract = React.useMemo(() => buildPlaylistCommerceSdkContract(), []);
  const quickstart = React.useMemo(() => buildPlaylistCommerceSdkQuickstart(), []);
  const client = React.useMemo(() => createPlaylistCommerceSdkTestClient(), []);
  const checkout = React.useMemo(() => client.startCheckout('self_delivery'), [client]);
  const testVectors = React.useMemo(() => client.buildTestVectors(), [client]);
  const discoveryHome = React.useMemo(() => client.buildDiscoveryHome('new apartment'), [client]);
  const merchantParticipation = React.useMemo(() => buildPlaylistCommerceMerchantParticipation(true), []);
  const addressWalletReuse = React.useMemo(() => buildAddressWalletSocialLoginAddressReusePlan(), []);
  const integrationDecision = React.useMemo(() => buildVeygritCommerceIntegrationDecisionPlan(), []);
  const playlistIntegration = integrationDecision.placements.find(placement => placement.surface === 'playlist_commerce');
  const ecSocialLoginIntegration = integrationDecision.placements.find(placement => placement.surface === 'ec_social_login');
  const guestCheckout = addressWalletReuse.guestCheckout;

  const visibleMethods = contract.methods.slice(0, 6);
  const visibleArchetypes = spec.archetypes.slice(0, 6);
  const visiblePresentationCoverage = playlistCommercePresentationMap.slice(0, 5);
  const coverageAudienceCount = new Set(playlistCommercePresentationMap.map(item => item.audience)).size;
  const sensitiveBoundary = ['raw_address', 'recipient_phone', 'proof_witness', 'private_key'];
  const readerModes = [
    {
      id: 'investor',
      icon: Sparkles,
      title: 'Investor view',
      text: 'Shows the platform thesis: cross-EC playlists become the commerce layer for Identity Wallet, Address Login, Delivery Gateway, and Trade Gateway.',
      proof: `${summary.capabilityCount} executable capabilities`,
    },
    {
      id: 'merchant',
      icon: ShoppingBag,
      title: 'Merchant view',
      text: 'Focuses on SDK adoption, saved-product demand, checkout alias, aggregate analytics, and no raw address collection.',
      proof: `${testVectors.webhooks.length} signed webhook fixtures`,
    },
    {
      id: 'developer',
      icon: Code2,
      title: 'Developer view',
      text: 'Starts from public SDK methods, typed checkout fixtures, webhook verification, and privacy-safe integration tests.',
      proof: `${contract.methods.length} public SDK methods`,
    },
  ] as const;

  return (
    <main className="agid-page-scroll bg-[#f6f8fb] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={goHome}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
              aria-label="Back to AGID map"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-600">Commerce Platform</p>
              <h1 className="text-2xl font-black text-slate-950">Playlist Commerce</h1>
              <p className="mt-0.5 text-sm font-semibold text-slate-500">
                EC横断のplaylistから、wallet consent、no-address checkout、carrier handoffまでつなぐ。
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">
              no raw address SDK
            </span>
            <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-purple-700">
              {checkout.errors.length === 0 ? 'checkout fixture valid' : 'needs review'}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-5 sm:px-6 xl:grid-cols-[330px_minmax(0,1fr)_380px]">
        <aside className="order-2 space-y-4 xl:order-1 xl:sticky xl:top-24 xl:self-start">
          <section id="discover" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle
              eyebrow="Demo widget"
              title="Purpose-based shopping"
              body="商品ではなく目的でまとめ、購入時だけVey IDとAddress Walletへ接続します。"
            />
            <div className="mt-4 grid gap-2">
              {visibleArchetypes.map(archetype => (
                <div key={archetype.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black text-slate-900">{archetype.label}</p>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                      {archetype.defaultPrivacy}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{archetype.purpose}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle
              eyebrow="Privacy boundary"
              title="Merchant visibility"
              body="Merchantにはaliasと状態だけを返し、住所・証明秘密・旅行秘密は渡しません。"
            />
            <div className="mt-4 space-y-2">
              {checkout.response.hiddenFromMerchant.slice(0, 6).map(item => (
                <div key={item} className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">
                  <EyeOff className="h-4 w-4" />
                  {item}
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="order-1 space-y-4 xl:order-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Capabilities" value={summary.capabilityCount} note="playlist, identity, checkout, delivery, analytics" />
            <MetricCard label="APIs" value={summary.apiSurfaceCount} note="SDK/API/Webhook surfaces" />
            <MetricCard label="SDK methods" value={contract.methods.length} note="developer-safe public methods" />
            <MetricCard label="Guest checkout" value={guestCheckout.accountRequiredBeforeCheckout ? 'blocked' : 'enabled'} note="account creation is optional after checkout" />
          </div>

          <section id="topics" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionTitle
              eyebrow="Topics"
              title="Spotify-like search, recommendations, and history"
              body="検索結果、おすすめ棚、最近見た履歴を同じホームに出し、ユーザーはログインなしでお店や公開playlistを見始められます。"
            />
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-sky-700" />
                  <h3 className="text-sm font-black text-sky-950">Search results</h3>
                </div>
                <div className="mt-3 grid gap-2">
                  {discoveryHome.home.searchResults.map(card => (
                    <div key={card.ref} className="rounded-lg bg-white px-3 py-2">
                      <p className="text-xs font-black text-slate-950">{card.title}</p>
                      <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">{card.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-700" />
                  <h3 className="text-sm font-black text-amber-950">Recommended shelves</h3>
                </div>
                <div className="mt-3 grid gap-2">
                  {discoveryHome.home.recommendationShelves.map(shelf => (
                    <div key={shelf.id} className="rounded-lg bg-white px-3 py-2">
                      <p className="text-xs font-black text-slate-950">{shelf.title}</p>
                      <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">{shelf.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-sm font-black text-emerald-950">Recently viewed</h3>
                </div>
                <div className="mt-3 grid gap-2">
                  {discoveryHome.home.history.map(item => (
                    <div key={item.eventRef} className="rounded-lg bg-white px-3 py-2">
                      <p className="text-xs font-black text-slate-950">{item.displayTitle}</p>
                      <p className="mt-1 font-mono text-[10px] font-black text-emerald-700">{item.resumableAction}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">
              Topics blocks raw address, recipient phone, proof witness, private key, and raw behavior log export.
            </p>
          </section>

          <section id="my-stores" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionTitle
              eyebrow="Merchant participation"
              title="Choose whether the store appears in Playlist Commerce"
              body="Merchant Consoleで出場を選ぶと公開店舗ディレクトリに入り、ユーザーはログインなしでお店を選べます。Guest checkoutは会員登録なしで開始でき、住所利用はwallet consentを必須にします。Vey IDはGoogle/Appleのみで後から作成できます。"
            />
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {[
                {
                  title: 'Playlist Commerce',
                  eyebrow: 'which EC to use',
                  body: 'Veygritアプリ側に導入します。ユーザーはログインボタンを押さずにお店を選び、買い物を始められます。',
                  placement: playlistIntegration,
                  tone: 'emerald',
                },
                {
                  title: 'EC Social Login',
                  eyebrow: 'how to buy at that EC',
                  body: 'ECサイト側に導入します。住所の使い回しや自動入力にはContinue with Veygritを押してVey IDへ進みます。',
                  placement: ecSocialLoginIntegration,
                  tone: 'blue',
                },
              ].map(card => (
                <div key={card.title} className={card.tone === 'emerald'
                  ? 'rounded-xl border border-emerald-100 bg-emerald-50 p-4'
                  : 'rounded-xl border border-blue-100 bg-blue-50 p-4'}
                >
                  <p className={card.tone === 'emerald'
                    ? 'text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700'
                    : 'text-[10px] font-black uppercase tracking-[0.16em] text-blue-700'}
                  >
                    {card.eyebrow}
                  </p>
                  <h3 className={card.tone === 'emerald'
                    ? 'mt-1 text-sm font-black text-emerald-950'
                    : 'mt-1 text-sm font-black text-blue-950'}
                  >
                    {card.title}
                  </h3>
                  <p className={card.tone === 'emerald'
                    ? 'mt-2 text-xs font-semibold leading-5 text-emerald-900'
                    : 'mt-2 text-xs font-semibold leading-5 text-blue-900'}
                  >
                    {card.body}
                  </p>
                  <div className="mt-3 grid gap-1.5">
                    {[
                      ['Login button to shop', card.placement?.shopperCanStartShoppingWithoutLoginButton ? 'not required' : 'required'],
                      ['Continue with Veygrit', card.placement?.continueWithVeygritRequiredOnEc ? 'required' : 'not required'],
                      ['Address reuse', card.placement?.addressReuseMode ?? 'pending'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-3 rounded-lg bg-white/85 px-3 py-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</span>
                        <span className="text-right font-mono text-[10px] font-black text-slate-800">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ['Participation', merchantParticipation.participationAction],
                  ['Directory', merchantParticipation.directoryVisibility],
                  ['Login to choose store', String(merchantParticipation.userLoginRequiredToChooseStore)],
                  ['Guest checkout', guestCheckout.accountRequiredBeforeCheckout ? 'account required' : 'no account required'],
                  ['Vey ID provider', addressWalletReuse.loginProvider],
                  ['Account providers', addressWalletReuse.accountCreationProviders.join(' / ')],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-purple-100 bg-purple-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-purple-700">{label}</p>
                    <p className="mt-2 break-all font-mono text-sm font-black text-purple-950">{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-sm font-black text-emerald-950">Wallet-controlled解除</h3>
                </div>
                <div className="mt-3 grid gap-2">
                  {merchantParticipation.walletControlledActions.map(action => (
                    <div key={action} className="rounded-lg bg-white/85 px-3 py-2 font-mono text-[11px] font-black text-emerald-900">
                      {action}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-slate-500" />
                  <h3 className="text-sm font-black text-slate-950">Vey ID + Address Wallet reuse</h3>
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                  Google/Appleで作成したVey IDから保存済み住所を住所入力代行として使い回し、ECにはaliasとconsent refだけを返します。
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {addressWalletReuse.entryPoints.map(entryPoint => (
                    <span key={entryPoint} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-slate-700">
                      {entryPoint}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center gap-2">
                  <PackageCheck className="h-5 w-5 text-blue-700" />
                  <h3 className="text-sm font-black text-blue-950">Guest checkout contract</h3>
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-blue-800">
                  ECはguestCheckoutRefで購入を開始できます。住所保存や再利用は無音で行わず、配送前にAddress Wallet consentを要求します。
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {guestCheckout.allowedGuestActions.map(action => (
                    <span key={action} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-blue-800">
                      {action}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
                <div className="flex items-center gap-2">
                  <EyeOff className="h-5 w-5 text-rose-600" />
                  <h3 className="text-sm font-black text-rose-950">Merchant never receives</h3>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {addressWalletReuse.merchantNeverReceives.map(item => (
                    <span key={item} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-rose-800">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionTitle
              eyebrow="Read by role"
              title="Three entry points for the same platform"
              body="同じデモを、投資家、EC事業者、開発者がそれぞれ必要な判断材料から読めるようにします。"
            />
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {readerModes.map(mode => (
                <div key={mode.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <mode.icon className="h-5 w-5 text-purple-600" />
                  <p className="mt-3 text-sm font-black text-slate-950">{mode.title}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{mode.text}</p>
                  <p className="mt-3 rounded-lg border border-white bg-white px-3 py-2 text-[11px] font-black text-slate-700">{mode.proof}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <SectionTitle
                eyebrow="Flow"
                title="Playlist to no-address checkout"
                body="playlist保存からcheckout alias、carrier handoff、webhook receiptまでを1本の安全な契約として見せます。"
              />
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                {checkout.errors.length === 0 ? 'fixture passes' : `${checkout.errors.length} issues`}
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-4">
              {[
                { icon: PanelsTopLeft, label: 'Playlist', body: checkout.request.items[0]?.playlistRef ?? 'playlist_ref' },
                { icon: ShoppingBag, label: 'Checkout', body: checkout.response.orderAlias ?? 'order_alias' },
                { icon: ShieldCheck, label: 'Wallet', body: checkout.response.consentEnvelopeRef ?? 'consent_ref' },
                { icon: Truck, label: 'Carrier', body: checkout.response.carrierHandoffRef ?? 'handoff_ref' },
              ].map(item => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <item.icon className="h-5 w-5 text-purple-600" />
                  <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <p className="mt-1 break-words text-sm font-black text-slate-900">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionTitle
              eyebrow="SDK"
              title="Developer method surface"
              body="公開SDKは狭く、全メソッドがprivate materialを受け取らない契約です。"
            />
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {visibleMethods.map(method => (
                <div key={method.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">{method.id}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{method.purpose}</p>
                    </div>
                    <Code2 className="h-5 w-5 shrink-0 text-slate-400" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {method.requiredCapabilities.map(capability => (
                      <span key={capability} className="rounded-full bg-purple-50 px-2 py-1 text-[10px] font-black text-purple-700">
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionTitle
              eyebrow="Quickstart"
              title="Public SDK quickstart"
              body="frontendに出せるのは公開キーとalias中心の参照だけ。raw addressやproof witnessは渡さない。"
            />
            <div className="mt-5 grid gap-3">
              {quickstart.steps.map((step, index) => (
                <div key={step.id} className="rounded-xl border border-slate-200 bg-slate-950 p-4 text-white">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500 text-xs font-black">{index + 1}</span>
                    <p className="text-sm font-black">{step.title}</p>
                  </div>
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-black/40 p-3 text-xs font-semibold leading-5 text-purple-100">{step.code}</pre>
                </div>
              ))}
            </div>
          </section>
        </section>

        <aside className="order-3 space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle
              eyebrow="Webhook"
              title="Merchant event contract"
              body="署名済みfixtureで、checkout aliasとdelivery receiptの接続を確認します。"
            />
            <div className="mt-4 space-y-2">
              {testVectors.webhooks.map(webhook => (
                <div key={webhook.payload.eventId} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-purple-600" />
                    <p className="text-xs font-black text-slate-950">{webhook.payload.topic}</p>
                  </div>
                  <p className="mt-1 break-words text-[11px] font-semibold text-slate-500">{webhook.payload.eventId}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle
              eyebrow="Presentation coverage"
              title={`${playlistCommercePresentationMap.length} diagrams linked`}
              body={`${coverageAudienceCount} reader paths are tied to widget anchors, executable evidence, and non-claim boundaries.`}
            />
            <div className="mt-4 space-y-2">
              {visiblePresentationCoverage.map(item => (
                <div key={item.diagramSection} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-black text-slate-950">{item.diagramSection}</p>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-purple-700">
                      {item.audience}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">{item.nonClaimBoundary}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle
              eyebrow="Contract JSON"
              title="Checkout response"
              body="Merchantが受け取るalias-firstの戻り値です。"
            />
            <pre className="mt-4 max-h-[360px] overflow-auto rounded-xl bg-slate-950 p-4 text-[11px] font-semibold leading-5 text-slate-100 sm:max-h-[520px]">
              {safeJson({
                status: checkout.response.status,
                orderAlias: checkout.response.orderAlias,
                subjectAlias: checkout.response.subjectAlias,
                carrierHandoffRef: checkout.response.carrierHandoffRef,
                merchantVisible: checkout.response.merchantVisible,
                nextAction: checkout.response.nextAction,
              })}
            </pre>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-2">
              {sensitiveBoundary.map(item => (
                <div key={item} className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">
                  <EyeOff className="h-4 w-4" />
                  blocked: {item}
                </div>
              ))}
              {[
                { icon: Boxes, text: 'Cross-EC playlist management' },
                { icon: Link2, text: 'Identity Wallet consent' },
                { icon: PackageCheck, text: 'No-address checkout response' },
                { icon: Route, text: 'Carrier handoff reference' },
                { icon: Sparkles, text: 'Aggregate merchant analytics' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
                  <item.icon className="h-4 w-4 text-purple-600" />
                  {item.text}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default PlaylistCommerceWidgetScreen;

import {
  ArrowLeft,
  CheckCircle2,
  Code2,
  Copy,
  EyeOff,
  Globe2,
  KeyRound,
  Languages,
  LockKeyhole,
  Settings2,
  ShieldCheck,
  Store,
  Truck,
  Webhook,
} from 'lucide-react';
import React from 'react';

import { getAddressFormat, type AddressFormat } from '../data/address_formats';
import { addressLoginCoverageMap } from '../lib/addressLoginCoverageMap';
import {
  buildAddressLoginFormCapability,
  buildAddressLoginMerchantIntegration,
  requiredClaimsForAddressLogin,
  type AddressLoginDisclosureMode,
  type AddressLoginPurpose,
  type AddressLoginRiskLevel,
} from '../lib/addressLoginSpec';
import { cn } from '../lib/utils';
import { VEYGRIT_ID_COMMERCE_BOUNDARY, VEYGRIT_ID_DEVELOPER_ADOPTION, VEYGRIT_ID_GUEST_CHECKOUT_POLICY } from '../lib/veygritIdAddressLoginPlan';

const PURPOSE_OPTIONS: Array<{ id: AddressLoginPurpose; label: string; description: string }> = [
  { id: 'shipping', label: '配送', description: 'checkoutで配送可否を証明し、carrierだけ復号。' },
  { id: 'anonymous_shipping', label: '匿名配送', description: 'merchantには住所を出さず、証明とaliasだけ返す。' },
  { id: 'pickup', label: '受取', description: '店舗、ロッカー、PUDOの受取資格を確認。' },
  { id: 'hotel_delivery', label: 'ホテル配送', description: '滞在先へ一時的な配送同意を出す。' },
  { id: 'identity_verification', label: '本人確認', description: '住所属性と有効性だけを証明。' },
  { id: 'customs', label: '通関', description: '越境配送に必要な最小項目だけ開示。' },
];

const DISCLOSURE_OPTIONS: Array<{ id: AddressLoginDisclosureMode; label: string; description: string }> = [
  { id: 'proof_only', label: 'Proof only', description: 'merchantには証明結果と安全なclaimだけ。' },
  { id: 'selective_disclosure', label: 'Selective disclosure', description: '国や市区町村など選択項目だけ。' },
  { id: 'carrier_decryptable', label: 'Carrier decryptable', description: '配送会社だけ配送時に復号可能。' },
  { id: 'merchant_visible', label: 'Legacy visible', description: '高リスク互換モード。既定では使わない。' },
];

const RISK_OPTIONS: Array<{ id: AddressLoginRiskLevel; label: string }> = [
  { id: 'low', label: 'Low' },
  { id: 'standard', label: 'Standard' },
  { id: 'high', label: 'High' },
  { id: 'regulated', label: 'Regulated' },
];

const COUNTRY_OPTIONS = ['JP', 'US', 'HK', 'AE', 'KE', 'NZ', 'BR', 'DE'];

function goHome() {
  window.location.href = '/';
}

function safeJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function StatCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{note}</p>
    </div>
  );
}

function AdoptionStep({ index, title, body }: { index: number; title: string; body: string }) {
  return (
    <div className="min-w-0 border-l border-slate-200 pl-4">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-950 text-xs font-black text-white">
        {index}
      </span>
      <h3 className="mt-3 text-sm font-black leading-5 text-slate-950">{title}</h3>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{body}</p>
    </div>
  );
}

function SectionTitle({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-500">{body}</p>
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ id: T; label: string; description?: string }> | T[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 shadow-sm"
      >
        {options.map(option => {
          const item = typeof option === 'string' ? { id: option, label: option } : option;
          return <option key={item.id} value={item.id}>{item.label}</option>;
        })}
      </select>
    </label>
  );
}

export function AddressLoginExperienceScreen() {
  const [purpose, setPurpose] = React.useState<AddressLoginPurpose>('shipping');
  const [disclosureMode, setDisclosureMode] = React.useState<AddressLoginDisclosureMode>('carrier_decryptable');
  const [riskLevel, setRiskLevel] = React.useState<AddressLoginRiskLevel>('standard');
  const [countryCode, setCountryCode] = React.useState('JP');
  const [displayLanguageMode, setDisplayLanguageMode] = React.useState<'native' | 'english' | 'native_and_english'>('native_and_english');
  const [format, setFormat] = React.useState<AddressFormat | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [copiedPreflight, setCopiedPreflight] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    getAddressFormat(countryCode).then(nextFormat => {
      if (active) setFormat(nextFormat);
    });
    return () => {
      active = false;
    };
  }, [countryCode]);

  const requestedClaims = React.useMemo(
    () => requiredClaimsForAddressLogin(purpose, riskLevel, disclosureMode),
    [purpose, riskLevel, disclosureMode],
  );
  const integration = React.useMemo(() => buildAddressLoginMerchantIntegration({
    purpose,
    disclosureMode,
    riskLevel,
    requestedClaims,
    countryHints: [countryCode],
    displayLanguageMode,
    carrierId: disclosureMode === 'carrier_decryptable' ? 'carrier_demo' : undefined,
  }), [countryCode, disclosureMode, displayLanguageMode, purpose, requestedClaims, riskLevel]);
  const formCapability = React.useMemo(() => buildAddressLoginFormCapability({
    countryCode,
    format,
    displayLanguageMode,
    includeP0GazetteerPack: true,
    includePoiGraph: true,
    includeSpatialIntelligence: true,
  }), [countryCode, displayLanguageMode, format]);

  const copySnippet = async () => {
    await navigator.clipboard?.writeText(integration.sdkSnippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  const copyTestVectorCommand = async () => {
    await navigator.clipboard?.writeText(integration.setupPreflight.testVectorCommand);
    setCopiedPreflight(true);
    window.setTimeout(() => setCopiedPreflight(false), 1200);
  };

  const featureGroups = React.useMemo(() => {
    return ['setup', 'policy', 'testing', 'operations', 'support'].map(area => ({
      area,
      features: integration.merchantFeatures.filter(feature => feature.area === area),
    })).filter(group => group.features.length > 0);
  }, [integration.merchantFeatures]);
  const adoptionPackages = VEYGRIT_ID_DEVELOPER_ADOPTION.packages;
  const reactPackage = adoptionPackages.find(pkg => pkg.packageName === '@veygrit/address-login-react');
  const nextPackage = adoptionPackages.find(pkg => pkg.packageName === '@veygrit/address-login-nextjs');
  const adoptionSteps = [
    {
      title: 'Offer guest checkout',
      body: 'ECは会員登録なしで購入を開始し、guestCheckoutRefだけを受け取る。',
    },
    {
      title: 'Enable Vey ID',
      body: '保存や再利用に進む場合だけ、Google/AppleでVey IDを作成または開く。',
    },
    {
      title: 'Drop in VeyIdSignInButton',
      body: 'EC Social LoginではContinue with Veygritを置き、wallet redirectへ送る。',
    },
    {
      title: 'Reuse wallet address',
      body: 'Address Walletの保存済み住所を、同意付きの住所入力代行として使い回す。',
    },
    {
      title: 'Hand off to carrier',
      body: '配送実行時だけcarrier-only decrypt refを使い、merchantは復号しない。',
    },
  ];
  const visibleCoverage = addressLoginCoverageMap.slice(0, 4);
  const coverageAreaCount = addressLoginCoverageMap.length;
  const coverageBoundaryCount = addressLoginCoverageMap.filter(item => item.privacyBoundary.startsWith('Do not ')).length;

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
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">Login Platform</p>
              <h1 className="text-2xl font-black text-slate-950">Address Login</h1>
              <p className="mt-0.5 text-sm font-semibold text-slate-500">住所を入力せず、wallet consent と merchant callback で配送・本人確認を進める。</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700">
              no raw address callback
            </span>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-blue-700">
              {integration.validation.valid ? 'request valid' : 'needs review'}
            </span>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-white">
                Guest checkout
              </span>
              <span className="rounded-full bg-slate-950 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-white">
                Google / Apple sign-up
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">
                EC-ready Vey ID
              </span>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-blue-700">
                Wallet address reuse
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-amber-700">
                EC Social Login
              </span>
            </div>
            <h2 className="mt-4 max-w-4xl text-3xl font-black leading-tight text-slate-950 md:text-5xl">
              Add Vey ID to EC and reuse Address Wallet addresses.
            </h2>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-600 md:text-base">
              Playlist Commerceではログインボタンなしでお店を選び買い物を始められます。一方、ECサイトに導入するEC Social Loginでは、住所の使い回しや自動入力にContinue with Veygritが必要です。
              アカウント作成はGoogle/Appleだけに限定し、merchant callbackにはaliasとclaimとreferenceだけを返します。
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {adoptionSteps.map((step, index) => (
                <AdoptionStep key={step.title} index={index + 1} title={step.title} body={step.body} />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Developer quickstart</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">Vey ID + Address Login</h3>
              </div>
              <Code2 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="mt-4 rounded-lg bg-slate-950 p-3 font-mono text-[11px] font-bold leading-5 text-slate-100">
              <div>{reactPackage?.installCommand ?? 'npm install @veygrit/address-login-react'}</div>
              <div className="mt-2 text-blue-200">{nextPackage?.installCommand ?? 'npm install @veygrit/address-login-nextjs'}</div>
            </div>
            <div className="mt-4 grid gap-2">
              {[
                ['React', reactPackage?.primaryExports.includes('VeyIdSignInButton') ? 'VeyIdSignInButton' : 'Vey ID button'],
                ['Guest', VEYGRIT_ID_GUEST_CHECKOUT_POLICY.accountRequiredBeforeCheckout ? 'blocked' : 'no account required'],
                ['EC Social Login', VEYGRIT_ID_COMMERCE_BOUNDARY.ecSocialLoginRequiresContinueWithVeygrit ? 'Continue with Veygrit required' : 'optional'],
                ['Playlist Commerce', VEYGRIT_ID_COMMERCE_BOUNDARY.playlistCommerceRequiresLoginButtonToShop ? 'login required' : 'no login button to shop'],
                ['Headless', reactPackage?.primaryExports.includes('useAddressLogin') ? 'useAddressLogin' : 'hook API'],
                ['Next.js', nextPackage?.primaryExports.includes('verifyAddressLoginCallback') ? 'verifyAddressLoginCallback' : 'callback helper'],
                ['Sandbox', 'synthetic fixtures + local mock'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</span>
                  <span className="text-right text-xs font-black text-slate-800">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-emerald-200 bg-white p-3 text-xs font-bold leading-5 text-emerald-800">
              {VEYGRIT_ID_DEVELOPER_ADOPTION.nonClaims[0]}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-5 sm:px-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle
              eyebrow="Request builder"
              title="Merchant request"
              body="目的、開示方式、国フォーム、リスクを選ぶと、wallet側の承認体験とmerchant側の安全な戻り値が変わります。"
            />
            <div className="mt-4 grid gap-3">
              <SelectField<AddressLoginPurpose> label="Purpose" value={purpose} options={PURPOSE_OPTIONS} onChange={setPurpose} />
              <SelectField<AddressLoginDisclosureMode> label="Disclosure" value={disclosureMode} options={DISCLOSURE_OPTIONS} onChange={setDisclosureMode} />
              <SelectField<AddressLoginRiskLevel> label="Risk" value={riskLevel} options={RISK_OPTIONS} onChange={setRiskLevel} />
              <SelectField<string> label="Country" value={countryCode} options={COUNTRY_OPTIONS} onChange={setCountryCode} />
              <SelectField<'native' | 'english' | 'native_and_english'>
                label="Language"
                value={displayLanguageMode}
                options={[
                  { id: 'native_and_english', label: 'Native + English' },
                  { id: 'native', label: 'Native only' },
                  { id: 'english', label: 'English only' },
                ]}
                onChange={setDisplayLanguageMode}
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-black text-slate-950">Country form capability</h2>
            </div>
            <div className="mt-3 grid gap-2 text-xs font-bold leading-5 text-slate-600">
              <div className="rounded-lg bg-slate-50 p-3">
                <span className="text-slate-400">Country</span>
                <div className="mt-1 text-base font-black text-slate-950">{formCapability.countryName} / {formCapability.countryCode}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-slate-50 p-3">
                  <span className="text-slate-400">Fields</span>
                  <div className="mt-1 font-black text-slate-950">{formCapability.fieldCount}</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <span className="text-slate-400">Postal</span>
                  <div className="mt-1 font-black text-slate-950">{formCapability.postalCode.format}</div>
                </div>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-blue-800">
                {formCapability.bilingualInputSupported ? '母国語と英語の併用に対応' : 'fallback formで安全に受付'}
              </div>
            </div>
          </section>
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <StatCard label="Claims" value={String(requestedClaims.length)} note="Merchantが要求する事実だけ。" />
            <StatCard label="UX Steps" value={String(integration.userExperience.length)} note="requestからcarrier handoffまで。" />
            <StatCard label="Merchant" value={String(integration.merchantFeatures.length)} note="設定、検証、運用、support。" />
            <StatCard label="Gates" value={String(integration.requiredDashboardGates.length)} note="公開前に通す安全ゲート。" />
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle
              eyebrow="User experience"
              title="Wallet consent flow"
              body="ユーザーは住所本文ではなく、alias、credential状態、開示範囲、期限、誰が復号できるかを確認して承認します。"
            />
            <div className="mt-4 grid gap-3 lg:grid-cols-5">
              {integration.userExperience.map((step, index) => (
                <div key={step.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                      {step.actor}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-black leading-5 text-slate-950">{step.title}</h3>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{step.screen}</p>
                  <div className="mt-3 rounded-lg bg-white p-2 text-xs font-bold leading-5 text-slate-600">
                    {step.primaryAction}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle
              eyebrow="Merchant features"
              title="Merchant-side control plane"
              body="開発者・事業者が、住所本文を持たずにログイン導入、ポリシー、テスト、Webhook、サポートを運用できる画面です。"
            />
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {featureGroups.map(group => (
                <div key={group.area} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-black capitalize text-slate-950">
                    <Settings2 className="h-4 w-4 text-blue-600" />
                    {group.area}
                  </h3>
                  <div className="grid gap-2">
                    {group.features.map(feature => (
                      <div key={feature.id} className="rounded-lg border border-slate-100 bg-white p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-black text-slate-900">{feature.label}</h4>
                            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{feature.description}</p>
                          </div>
                          <span className={cn(
                            'shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]',
                            feature.readiness === 'mvp' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                          )}>
                            {feature.readiness}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {feature.controls.slice(0, 4).map(control => (
                            <span key={control} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">
                              {control}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionTitle
                eyebrow="SDK"
                title="Hosted button and callback"
                body="Merchantはボタン、redirect、token exchange、webhookだけを実装します。callbackはaliasとclaimとreferenceだけです。"
              />
              <button
                type="button"
                onClick={copySnippet}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copied' : 'Copy SDK'}
              </button>
            </div>
            <pre className="mt-4 max-h-80 overflow-auto rounded-xl bg-slate-950 p-4 text-xs font-semibold leading-5 text-slate-100">
              {integration.sdkSnippet}
            </pre>
          </section>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-900">
              <EyeOff className="h-5 w-5" />
              <h2 className="text-sm font-black">Privacy contract</h2>
            </div>
            <div className="mt-3 grid gap-2">
              {[
                'Merchant receives no address lines by default',
                'Carrier decrypt is purpose and time bound',
                'Callbacks use pairwise subject aliases',
                'Webhook payloads are redacted',
              ].map(item => (
                <div key={item} className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-xs font-black text-emerald-900">
                  <CheckCircle2 className="h-4 w-4" />
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-black text-slate-950">Wallet consent summary</h2>
            </div>
            <div className="mt-3 grid gap-2">
              {integration.walletConsentSummary.map(item => (
                <div key={item} className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">{item}</div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-black text-slate-950">Required gates</h2>
            </div>
            <div className="mt-3 grid gap-2">
              {integration.requiredDashboardGates.map(gate => (
                <div key={gate} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  {gate}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-black text-slate-950">Coverage map</h2>
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
              画面、仕様、テスト、安全境界が同じAddress Login領域を参照しているかを確認します。
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-blue-50 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-500">areas linked</p>
                <p className="mt-1 text-lg font-black text-blue-900">{coverageAreaCount}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-500">privacy boundaries</p>
                <p className="mt-1 text-lg font-black text-emerald-900">{coverageBoundaryCount}</p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {visibleCoverage.map(item => (
                <div key={item.area} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-800">{item.area}</span>
                    <span className="rounded-md bg-white px-2 py-1 text-[10px] font-black text-slate-500">
                      {item.executableEvidence.length} checks
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-5 text-slate-500">
                    {item.privacyBoundary}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-blue-600" />
                <h2 className="text-sm font-black text-slate-950">Callback URL validator</h2>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                preflight
              </span>
            </div>
            <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Callback URL</p>
              <p className="mt-1 break-all font-mono text-[11px] font-black text-slate-800">{integration.setupPreflight.callbackUrl}</p>
            </div>
            <div className="mt-3 grid gap-2">
              {integration.setupPreflight.checks.map(check => (
                <div key={check.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-slate-900">{check.label}</p>
                      <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">{check.detail}</p>
                    </div>
                    <span className={cn(
                      'rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]',
                      check.status === 'pass' && 'bg-emerald-50 text-emerald-700',
                      check.status === 'warn' && 'bg-amber-50 text-amber-700',
                      check.status === 'fail' && 'bg-rose-50 text-rose-700',
                    )}>
                      {check.status}
                    </span>
                  </div>
                  <p className="mt-2 font-mono text-[10px] font-black text-slate-400">{check.safeInputRef}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={copyTestVectorCommand}
              aria-label="Run synthetic test vectors"
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-black text-white shadow-sm hover:bg-slate-800"
            >
              <Code2 className="h-4 w-4" />
              {copiedPreflight ? 'Copied test command' : integration.setupPreflight.runButtonLabel}
            </button>
            <pre className="mt-2 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[11px] font-bold leading-5 text-slate-700">
              {integration.setupPreflight.testVectorCommand}
            </pre>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {integration.setupPreflight.testVectorIds.map(vectorId => (
                <span key={vectorId} className="rounded-md bg-blue-50 px-2 py-1 font-mono text-[10px] font-black text-blue-700">
                  {vectorId}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="text-sm font-black text-slate-950">Callback contract</h2>
            </div>
            <p className="mt-2 font-mono text-[11px] font-black text-emerald-700">
              {integration.callbackContract.version}
            </p>
            <div className="mt-3 grid gap-3">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Canonical params</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {integration.callbackContract.canonicalParams.map(param => (
                    <span key={param} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-slate-700 shadow-sm">
                      {param}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-500">Compatibility aliases</p>
                <div className="mt-2 grid gap-1.5">
                  {Object.entries(integration.callbackContract.acceptedAliases).map(([field, aliases]) => (
                    <div key={field} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] font-black text-blue-800 shadow-sm">
                      {field}: {aliases.join(', ')}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-rose-100 bg-rose-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-rose-500">Forbidden params</p>
                <p className="mt-2 font-mono text-[10px] font-black leading-5 text-rose-800">
                  {integration.callbackContract.forbiddenParams.join(', ')}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-500">Non-claims</p>
                <div className="mt-2 grid gap-1.5">
                  {integration.callbackContract.nonClaims.map(claim => (
                    <div key={claim} className="flex gap-2 text-[11px] font-bold leading-5 text-emerald-900">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{claim}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Webhook className="h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-black text-slate-950">Webhook events</h2>
            </div>
            <div className="space-y-2">
              {integration.webhookEvents.map(event => (
                <div key={event} className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-[11px] font-bold text-slate-600">{event}</div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950">
              <Code2 className="h-4 w-4 text-blue-600" />
              Safe callback preview
            </h2>
            <pre className="max-h-[420px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs font-semibold leading-5 text-slate-100">
              {safeJson(integration.safeCallbackPreview)}
            </pre>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950">
              <Languages className="h-4 w-4 text-blue-600" />
              Claims
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {requestedClaims.map(claim => (
                <span key={claim} className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">
                  {claim}
                </span>
              ))}
            </div>
          </section>

          <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                <Store className="h-4 w-4 text-blue-600" />
                Merchant sees
              </div>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">alias, claim result, proof ref, next action</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                <Truck className="h-4 w-4 text-blue-600" />
                Carrier sees
              </div>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">scoped decrypt ref only after approval</p>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default AddressLoginExperienceScreen;

import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle2,
  CreditCard,
  EyeOff,
  HelpCircle,
  Home,
  KeyRound,
  Link2Off,
  MapPin,
  PackageCheck,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';
import React from 'react';

import {
  buildVeygritAppModel,
  validateVeygritAppModel,
  type VeygritAddressCard,
  type VeygritConnectedStore,
  type VeygritIntegrationSurface,
} from '../lib/veygritApp';
import { buildVeyIdDemoEcFlow } from '../lib/veyIdDemoEcFlow';

function goHome() {
  window.location.href = '/';
}

function statusClass(status: VeygritAddressCard['status']) {
  if (status === 'verified') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'temporary') return 'border-sky-200 bg-sky-50 text-sky-800';
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

function trustClass(state: string) {
  if (state === 'trusted') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (state === 'limited') return 'border-indigo-200 bg-indigo-50 text-indigo-800';
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

function providerLabel(provider: string) {
  return provider === 'google' ? 'Google' : 'Apple';
}

function NavIcon({ id }: { id: string }) {
  if (id === 'home') return <Home className="h-4 w-4" />;
  if (id === 'friends') return <Users className="h-4 w-4" />;
  if (id === 'store') return <Store className="h-4 w-4" />;
  return <UserRound className="h-4 w-4" />;
}

function AddressCard({ card }: { card: VeygritAddressCard }) {
  return (
    <article className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-950">{card.addressName}</p>
          <p className="mt-1 truncate text-xs font-semibold text-slate-500">{card.addressRef}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusClass(card.status)}`}>
          {card.status.replace('_', ' ')}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-slate-600">
        <span className="rounded-md bg-slate-100 px-2 py-1">{card.useCase}</span>
        <span className="rounded-md bg-slate-100 px-2 py-1">{card.poBoxSupported ? 'P/O/BOX supported' : 'P/O/BOX blocked'}</span>
      </div>
    </article>
  );
}

function IntegrationCard({ integration }: { integration: VeygritIntegrationSurface }) {
  const icon = integration.id === 'delivery_gateway'
    ? <Truck className="h-5 w-5 text-slate-700" />
    : integration.id === 'ec_social_login'
      ? <KeyRound className="h-5 w-5 text-slate-700" />
      : <ShoppingBag className="h-5 w-5 text-slate-700" />;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-black text-slate-950">{integration.label}</h3>
      </div>
      <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-600">
        <div className="flex items-center justify-between gap-3">
          <span>Start</span>
          <span className="font-black text-slate-900">{integration.startPoint}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Install</span>
          <span className="font-black text-slate-900">{integration.installTarget}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Guest browse</span>
          <span className="font-black text-slate-900">{integration.loginRequiredBeforeBrowse ? 'No' : 'Yes'}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Checkout login</span>
          <span className="font-black text-slate-900">{integration.loginRequiredBeforeCheckout ? 'Required' : 'Optional'}</span>
        </div>
      </div>
      <a
        href={integration.decisionRouteRef}
        className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-black text-white hover:bg-slate-800"
      >
        <span>{integration.primaryActionLabel}</span>
        <ArrowRight className="h-4 w-4" />
      </a>
    </article>
  );
}

function StoreConnection({ store }: { store: VeygritConnectedStore }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">{store.displayName}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{store.platform} / {store.connectionRef}</p>
        </div>
        <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-rose-700">
          revoke
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs font-black text-slate-700">
        <Link2Off className="h-4 w-4 text-rose-600" />
        {store.disconnectAction}
      </div>
    </article>
  );
}

export function VeygritAppScreen() {
  const model = React.useMemo(() => buildVeygritAppModel(), []);
  const demoEcFlow = React.useMemo(() => buildVeyIdDemoEcFlow(), []);
  const redactionAffordance = demoEcFlow.merchantVisibleRedactionAffordance;
  const validationErrors = React.useMemo(() => validateVeygritAppModel(model), [model]);
  const isValid = validationErrors.length === 0;

  return (
    <main className="agid-page-scroll min-h-screen bg-[#f5f7f8] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={goHome}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
              aria-label="Back to AGID map"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Address Wallet OS</p>
              <h1 className="truncate text-2xl font-black text-slate-950">Veygrit Address Wallet</h1>
              <p className="mt-0.5 text-sm font-semibold text-slate-500">Vey ID / Address Wallet / Store / Delivery Gateway</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {model.accountCreation.allowedProviders.map(provider => (
              <span key={provider} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm">
                {providerLabel(provider)}
              </span>
            ))}
            <span className={`rounded-lg border px-3 py-2 text-xs font-black shadow-sm ${isValid ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
              {isValid ? 'model valid' : 'needs review'}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1480px] gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <nav className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="Veygrit side menu">
            {model.navigation.map(item => (
              <div key={item.id}>
                <a
                  href={item.routeRef}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black text-slate-800 hover:bg-slate-50"
                >
                  <NavIcon id={item.id} />
                  {item.label}
                </a>
                {item.children && (
                  <div className="ml-6 mt-1 grid gap-1 border-l border-slate-200 pl-3">
                    {item.children.map(child => (
                      <a
                        key={child.id}
                        href={child.routeRef}
                        className="rounded-md px-2 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-700" />
              <h2 className="text-sm font-black text-slate-950">Identity</h2>
            </div>
            <div className="mt-3 grid gap-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span>Account creation</span>
                <span className="font-black text-slate-900">Google / Apple</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Password signup</span>
                <span className="font-black text-slate-900">{model.accountCreation.passwordSignupEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>EC login</span>
                <span className="font-black text-slate-900">Vey ID</span>
              </div>
            </div>
          </section>
        </aside>

        <section className="space-y-5">
          <section id="home" className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <Wallet className="h-5 w-5 text-emerald-700" />
                <p className="mt-3 text-2xl font-black text-slate-950">{model.home.myAddress.length}</p>
                <p className="text-xs font-bold text-slate-500">My Address</p>
              </article>
              <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <MapPin className="h-5 w-5 text-sky-700" />
                <p className="mt-3 text-2xl font-black text-slate-950">{model.home.spareAddress.length}</p>
                <p className="text-xs font-bold text-slate-500">Spare Address</p>
              </article>
              <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <QrCode className="h-5 w-5 text-indigo-700" />
                <p className="mt-3 text-2xl font-black text-slate-950">{model.home.qr.length}</p>
                <p className="text-xs font-bold text-slate-500">QR</p>
              </article>
              <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <PackageCheck className="h-5 w-5 text-amber-700" />
                <p className="mt-3 text-2xl font-black text-slate-950">{model.home.recentDeliveries.length}</p>
                <p className="text-xs font-bold text-slate-500">Recent Deliveries</p>
              </article>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-slate-700" />
                  <h2 className="text-lg font-black text-slate-950">My Address</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {model.home.myAddress.map(card => <AddressCard key={card.addressRef} card={card} />)}
                </div>
              </section>

              <section>
                <div className="mb-2 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-slate-700" />
                  <h2 className="text-lg font-black text-slate-950">Spare Address</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {model.home.spareAddress.map(card => <AddressCard key={card.addressRef} card={card} />)}
                </div>
              </section>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-indigo-700" />
                  <h2 className="text-lg font-black text-slate-950">QR</h2>
                </div>
                <div className="mt-3 grid gap-2">
                  {model.home.qr.map(qr => (
                    <div key={qr.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                      <span className="text-xs font-black text-slate-800">{qr.label}</span>
                      <span className="truncate text-[11px] font-bold text-slate-500">{qr.safePayloadRef}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <PackageCheck className="h-5 w-5 text-amber-700" />
                  <h2 className="text-lg font-black text-slate-950">Recent Deliveries</h2>
                </div>
                <div className="mt-3 grid gap-2">
                  {model.home.recentDeliveries.map(delivery => (
                    <div key={delivery.shipmentRef} className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-xs font-black text-slate-900">{delivery.shipmentRef}</p>
                      <p className="mt-1 text-[11px] font-bold text-slate-500">{delivery.trackingAlias} / {delivery.status}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-rose-700" />
                  <h2 className="text-lg font-black text-slate-950">Recent Stores</h2>
                </div>
                <div className="mt-3 grid gap-2">
                  {model.home.recentStores.map(store => (
                    <div key={store.storeRef} className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-xs font-black text-slate-900">{store.displayName}</p>
                      <p className="mt-1 text-[11px] font-bold text-slate-500">{store.category} / {store.storeRef}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </section>

          <section id="friends" className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-700" />
                <h2 className="text-lg font-black text-slate-950">Friends</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {model.friends.examples.map(friend => (
                  <article key={friend.friendRef} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">{friend.displayName}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{friend.veyId}</p>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${trustClass(friend.trustState)}`}>
                        {friend.trustState.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-bold text-slate-500">{friend.iconRef} / {friend.friendRef}</p>
                  </article>
                ))}
              </div>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <EyeOff className="h-5 w-5 text-rose-700" />
                <h3 className="text-sm font-black text-slate-950">Hidden from friends</h3>
              </div>
              <div className="mt-3 grid gap-2">
                {model.friends.hiddenFields.map(field => (
                  <div key={field} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">{field}</div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {model.friends.sections.map(section => (
                  <span key={section} className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">{section}</span>
                ))}
              </div>
            </section>
          </section>

          <section id="store" className="space-y-4">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-slate-700" />
              <h2 className="text-lg font-black text-slate-950">Store</h2>
            </div>
            <div id="topics" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {model.store.topics.map(topic => (
                <article key={topic.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-black text-slate-950">{topic.label}</p>
                  <p className="mt-2 text-xs font-semibold text-slate-500">{topic.surface}</p>
                </article>
              ))}
            </div>
            <section id="discover" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-slate-700" />
                  <h3 className="text-sm font-black text-slate-950">Discover</h3>
                </div>
                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
                  {model.store.discoverGenres.length} genres
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
                {model.store.discoverGenres.map(genre => (
                  <span key={genre.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
                    {genre.label}
                  </span>
                ))}
              </div>
            </section>
            <section id="my-stores">
              <div className="mb-2 flex items-center gap-2">
                <Link2Off className="h-5 w-5 text-slate-700" />
                <h3 className="text-sm font-black text-slate-950">My Stores</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {model.store.myStores.map(store => <StoreConnection key={store.storeRef} store={store} />)}
              </div>
            </section>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-slate-700" />
                <h2 className="text-lg font-black text-slate-950">Commerce entry points</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {model.integrations.map(integration => <IntegrationCard key={integration.id} integration={integration} />)}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <article className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                    <h3 className="text-sm font-black text-emerald-950">Guest checkout</h3>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {model.guestCheckout.merchantReceives.map(item => (
                      <span key={item} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-emerald-800">{item}</span>
                    ))}
                  </div>
                </article>
                <article className="rounded-lg border border-rose-200 bg-rose-50 p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-5 w-5 text-rose-700" />
                    <h3 className="text-sm font-black text-rose-950">Guest blocked</h3>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {model.guestCheckout.blockedGuestActions.map(item => (
                      <span key={item} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-rose-800">{item}</span>
                    ))}
                  </div>
                </article>
              </div>
              <article className="rounded-lg border border-indigo-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-indigo-700">Merchant-visible redaction</p>
                    <h3 className="mt-1 text-sm font-black text-slate-950">{redactionAffordance.boundaryGateId}</h3>
                  </div>
                  <span className="max-w-full break-words rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-right text-[10px] font-black uppercase tracking-[0.12em] text-indigo-700">
                    {redactionAffordance.requiredNextAction}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {redactionAffordance.displayFields.map(field => (
                    <div key={field} className="min-w-0 rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{field}</p>
                      <p className="mt-1 truncate text-xs font-black text-slate-800">
                        {demoEcFlow.coreRefs[field] ?? 'pending_wallet_consent'}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-black text-slate-600">
                  <span className="rounded-md bg-slate-100 px-2 py-1">{redactionAffordance.displayRefs.length} visible refs</span>
                  <span className="rounded-md bg-slate-100 px-2 py-1">{redactionAffordance.blockedMaterial.length} blocked classes</span>
                  <span className="rounded-md bg-slate-100 px-2 py-1">consent-bound</span>
                </div>
              </article>
            </section>

            <section id="my-page" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-slate-700" />
                <h2 className="text-lg font-black text-slate-950">My Page</h2>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {model.myPage.map(item => {
                  const icon = item.id === 'payment-methods'
                    ? <CreditCard className="h-4 w-4" />
                    : item.id === 'notifications'
                      ? <Bell className="h-4 w-4" />
                      : item.id === 'help'
                        ? <HelpCircle className="h-4 w-4" />
                        : item.id === 'settings'
                          ? <Settings className="h-4 w-4" />
                          : <UserRound className="h-4 w-4" />;
                  return (
                    <a
                      key={item.id}
                      href={item.routeRef}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800 hover:bg-white"
                    >
                      {icon}
                      {item.label}
                    </a>
                  );
                })}
              </div>
              <div className="mt-4 grid gap-2">
                {model.merchantVisibleRefs.map(ref => (
                  <div key={ref} className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
                    <CheckCircle2 className="h-4 w-4" />
                    {ref}
                  </div>
                ))}
              </div>
            </section>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-rose-700" />
              <h2 className="text-lg font-black text-slate-950">Hidden material</h2>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {model.hiddenMaterial.map(item => (
                <span key={item} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-black text-rose-700">{item}</span>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

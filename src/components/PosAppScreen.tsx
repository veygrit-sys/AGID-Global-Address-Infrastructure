import {
  ArrowLeft,
  Building2,
  CreditCard,
  Network,
  ShieldCheck,
  WifiOff,
  X,
} from 'lucide-react';
import React from 'react';

import { getLanguageDirection } from '../lib/i18n';
import {
  APP_LANGUAGES,
  APP_LANGUAGE_STORAGE_KEY,
  normalizeAppLanguage,
} from '../lib/languageSettings';
import { PosTerminalPanel } from './PosTerminalPanel';

type PosAppAlert = {
  title: string;
  message: string;
};

type PosCopyKey =
  | 'returnToMap'
  | 'subtitle'
  | 'counterReady'
  | 'redactedReceipts'
  | 'registryAware'
  | 'offlineFallback'
  | 'posNotice'
  | 'closePosNotice';

const POS_COPY: Record<'en' | 'ja', Record<PosCopyKey, string>> = {
  en: {
    returnToMap: 'Return to AGID map',
    subtitle: 'Scan -> Decision -> Handoff -> Receipt',
    counterReady: 'Counter ready',
    redactedReceipts: 'Redacted receipts',
    registryAware: 'Registry aware',
    offlineFallback: 'Offline fallback',
    posNotice: 'POS Notice',
    closePosNotice: 'Close POS notice',
  },
  ja: {
    returnToMap: 'AGIDマップへ戻る',
    subtitle: 'Scan -> Decision -> Handoff -> Receipt',
    counterReady: 'カウンター準備完了',
    redactedReceipts: '秘匿レシート',
    registryAware: 'レジストリ連携',
    offlineFallback: 'オフライン代替',
    posNotice: 'POS通知',
    closePosNotice: 'POS通知を閉じる',
  },
};

function translatePosCopy(language: string, key: PosCopyKey) {
  return POS_COPY[language.startsWith('ja') ? 'ja' : 'en'][key];
}

function readStoredAppLanguage() {
  try {
    return normalizeAppLanguage(localStorage.getItem(APP_LANGUAGE_STORAGE_KEY) || 'ja');
  } catch {
    return 'ja';
  }
}

function returnToMap() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  window.location.href = '/';
}

export const PosAppScreen: React.FC = () => {
  const [alert, setAlert] = React.useState<PosAppAlert | null>(null);
  const [appLanguage, setAppLanguageState] = React.useState(readStoredAppLanguage);
  const selectedAppLanguage = APP_LANGUAGES.find(language => language.code === appLanguage);
  const t = React.useCallback(
    (key: PosCopyKey) => translatePosCopy(appLanguage, key),
    [appLanguage],
  );

  const setAppLanguage = React.useCallback((language: string) => {
    setAppLanguageState(normalizeAppLanguage(language));
  }, []);

  React.useEffect(() => {
    localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, appLanguage);
    document.documentElement.lang = appLanguage;
    document.documentElement.dir = getLanguageDirection(appLanguage);
  }, [appLanguage]);

  return (
    <div className="agid-fixed-page-scroll fixed inset-0 z-[200] bg-[#edf3f8] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950 px-4 py-3 text-white shadow-xl shadow-slate-950/15 md:px-6">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={returnToMap}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-slate-200 transition-all hover:bg-white hover:text-slate-950 active:scale-95"
              aria-label={t('returnToMap')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white shadow-lg shadow-blue-950/30 sm:flex">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-black tracking-tight text-white md:text-xl">
                  AGID POS Terminal
                </h1>
                <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {t('subtitle')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-2 xl:flex">
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-slate-100">
                <Building2 className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('counterReady')}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-emerald-100">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {t('redactedReceipts')}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-sky-100">
                <Network className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('registryAware')}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-amber-100">
                <WifiOff className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('offlineFallback')}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-2 py-4 sm:px-4 md:px-5">
        <PosTerminalPanel
          appLanguage={appLanguage}
          appLanguageLabel={selectedAppLanguage?.name || appLanguage}
          onAppLanguageChange={setAppLanguage}
          showAlert={(title, message) => setAlert({ title, message })}
        />
      </main>

      {alert && (
        <div className="fixed inset-0 z-[240] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('posNotice')}</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">{alert.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setAlert(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500 transition-all hover:bg-slate-900 hover:text-white"
                aria-label={t('closePosNotice')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm font-bold leading-6 text-slate-600">{alert.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

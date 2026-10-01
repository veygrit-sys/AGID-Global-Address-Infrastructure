import { ArrowLeft, ExternalLink, Github, Scale } from 'lucide-react';
import React from 'react';
import { APP_LANGUAGE_STORAGE_KEY } from '../lib/languageSettings';

const REPOSITORY_URL = 'https://github.com/veygrit-sys/AGID-Global-Address-Infrastructure';

const DATA_SOURCES = [
  {
    name: 'OpenStreetMap',
    detail: {
      ja: 'OpenStreetMap contributors のデータを使用しています。ODbLの表示・継承条件が適用されます。',
      en: 'Uses data from OpenStreetMap contributors under the Open Database License (ODbL).',
    },
    href: 'https://www.openstreetmap.org/copyright',
  },
  {
    name: 'IHO / Marine Regions',
    detail: {
      ja: '海域境界は International Hydrographic Organization と MarineRegions.org の出典情報を保持します。',
      en: 'Marine boundaries retain attribution to the International Hydrographic Organization and MarineRegions.org.',
    },
    href: 'https://www.marineregions.org/',
  },
  {
    name: 'Natural Earth / GEBCO',
    detail: {
      ja: '全球地形・海底地形データは、各データセットの出典・版・利用条件を個別に扱います。',
      en: 'Global relief and bathymetry data keep source, edition, and usage terms for each dataset.',
    },
    href: 'https://www.gebco.net/',
  },
] as const;

const SOFTWARE = [
  'React',
  'Vite',
  'Tailwind CSS',
  'Motion',
  'Lucide React',
  'MapLibre GL JS',
  'D3.js',
  'Recharts',
] as const;

export function LicensesScreen() {
  const isJapanese = React.useMemo(() => {
    try {
      return (window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY) || navigator.language).toLowerCase().startsWith('ja');
    } catch {
      return navigator.language.toLowerCase().startsWith('ja');
    }
  }, []);

  const copy = isJapanese
    ? {
        back: '地図へ戻る',
        title: 'ライセンスと出典',
        intro: 'ソフトウェアのライセンスと、地図・住所データの出典を分けて確認できます。',
        software: 'ソフトウェア',
        softwareDescription: 'AGIDのソースコードと依存ライブラリは、それぞれのライセンス条件に従います。',
        sourceCode: 'ソースコードとライセンスを確認',
        data: 'データ出典',
        policy: '詳細なデータ利用方針',
        policyDescription: '第三者データはAGID本体のソフトウェアライセンスには含まれません。再配布前に個別の条件を確認してください。',
      }
    : {
        back: 'Back to map',
        title: 'Licenses & sources',
        intro: 'Review software licenses separately from map and address-data provenance.',
        software: 'Software',
        softwareDescription: 'AGID source code and its dependencies remain subject to their respective license terms.',
        sourceCode: 'Review source code and licenses',
        data: 'Data sources',
        policy: 'Detailed data-use policy',
        policyDescription: 'Third-party data is not covered by the AGID software license. Review each source before redistribution.',
      };

  const goBack = () => {
    if (document.referrer.startsWith(window.location.origin)) {
      window.history.back();
      return;
    }
    window.location.href = '/';
  };

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex min-h-10 items-center gap-2 text-sm font-black text-slate-600 transition-colors hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {copy.back}
          </button>
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center gap-2 text-xs font-black text-slate-500 transition-colors hover:text-slate-950"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
            GitHub
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
        <div className="max-w-3xl">
          <Scale className="h-8 w-8 text-blue-600" aria-hidden="true" />
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">{copy.title}</h1>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
            {copy.intro}
          </p>
        </div>

        <section className="mt-12 border-t border-slate-200 pt-8" aria-labelledby="software-licenses-title">
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <div>
              <h2 id="software-licenses-title" className="text-lg font-black">{copy.software}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{copy.softwareDescription}</p>
            </div>
            <div>
              <a
                href={`${REPOSITORY_URL}/blob/main/LICENSE`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-4 border-b border-slate-200 py-4 text-sm font-black text-blue-700 hover:text-blue-900"
              >
                {copy.sourceCode}
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              </a>
              <ul className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
                {SOFTWARE.map(name => (
                  <li key={name} className="border-b border-slate-100 py-3 text-xs font-bold text-slate-600">
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-12 border-t border-slate-200 pt-8" aria-labelledby="data-sources-title">
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <div>
              <h2 id="data-sources-title" className="text-lg font-black">{copy.data}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{copy.policyDescription}</p>
            </div>
            <div className="divide-y divide-slate-200">
              {DATA_SOURCES.map(source => (
                <a
                  key={source.name}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group grid gap-2 py-5 sm:grid-cols-[180px_1fr_auto] sm:items-start sm:gap-5"
                >
                  <span className="text-sm font-black text-slate-900">{source.name}</span>
                  <span className="text-sm leading-6 text-slate-600">
                    {isJapanese ? source.detail.ja : source.detail.en}
                  </span>
                  <ExternalLink className="h-4 w-4 text-slate-300 transition-colors group-hover:text-blue-600" aria-hidden="true" />
                </a>
              ))}
              <a
                href={`${REPOSITORY_URL}/blob/main/DATA_LICENSES.md`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-4 py-5 text-sm font-black text-blue-700 hover:text-blue-900"
              >
                {copy.policy}
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

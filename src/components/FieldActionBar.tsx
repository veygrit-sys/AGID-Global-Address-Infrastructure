import {
  ClipboardCheck,
  Crosshair,
  ListTodo,
  MapPinCheck,
  QrCode,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import React from 'react';

import { cn } from '../lib/utils';

export const FIELD_ACTION_EVENTS = {
  openQrReader: 'agid:open-qr-reader',
  openAddressRegistration: 'agid:open-address-registration',
  useCurrentLocation: 'agid:use-current-location',
  undoRequest: 'agid:undo-request',
  navigation: 'agid:navigation',
} as const;

export type FieldActionSurface =
  | 'map'
  | 'dashboard'
  | 'pos'
  | 'field'
  | 'hotel'
  | 'opera'
  | 'settings'
  | 'portal'
  | 'developer'
  | 'element'
  | 'evidence'
  | 'research'
  | 'postal-zones'
  | 'machine'
  | 'locker'
  | 'ops';

type AddressQualityShortState = 'verified' | 'partial' | 'manual-required';

type SurfaceGuidance = {
  nextAction: string;
  quality: AddressQualityShortState;
};

type FieldActionBarProps = {
  surface: FieldActionSurface;
};

const QUALITY_LABELS: Record<AddressQualityShortState, string> = {
  verified: 'Verified',
  partial: 'Partial',
  'manual-required': 'Manual required',
};

const QUALITY_CLASS: Record<AddressQualityShortState, string> = {
  verified: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  partial: 'border-amber-200 bg-amber-50 text-amber-900',
  'manual-required': 'border-orange-200 bg-orange-50 text-orange-900',
};

const SURFACE_GUIDANCE: Record<FieldActionSurface, SurfaceGuidance> = {
  map: {
    nextAction: '現在地からIDを確認',
    quality: 'partial',
  },
  dashboard: {
    nextAction: 'Manual required を1件確認',
    quality: 'manual-required',
  },
  pos: {
    nextAction: '配送先QRを読み取る',
    quality: 'partial',
  },
  field: {
    nextAction: '受け渡し地点を確認',
    quality: 'partial',
  },
  hotel: {
    nextAction: '宿泊者の住所IDを確認',
    quality: 'partial',
  },
  opera: {
    nextAction: 'ホテル住所確認を処理',
    quality: 'manual-required',
  },
  settings: {
    nextAction: '公開前ゲートを確認',
    quality: 'verified',
  },
  portal: {
    nextAction: '共有するID情報を選択',
    quality: 'partial',
  },
  developer: {
    nextAction: 'Launch gate を1つ通す',
    quality: 'verified',
  },
  element: {
    nextAction: 'Address Element を試す',
    quality: 'partial',
  },
  evidence: {
    nextAction: 'receipt と監査証跡を確認',
    quality: 'verified',
  },
  research: {
    nextAction: '仕様と検証課題を確認',
    quality: 'verified',
  },
  'postal-zones': {
    nextAction: '郵便区画の品質を確認',
    quality: 'manual-required',
  },
  machine: {
    nextAction: 'Machine handoff を確認',
    quality: 'partial',
  },
  locker: {
    nextAction: 'PUDO候補を確認',
    quality: 'partial',
  },
  ops: {
    nextAction: 'ドローン受け渡しを確認',
    quality: 'partial',
  },
};

const REFERENCE_LABELS = ['AGID', 'AOID', 'alias', 'commitment', 'receipt'] as const;

function navigateWithinApp(path: string) {
  if (typeof window === 'undefined') return;
  window.history.pushState(window.history.state, '', path);
  window.dispatchEvent(new Event(FIELD_ACTION_EVENTS.navigation));
}

function dispatchFieldAction(eventName: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(eventName));
}

export const FieldActionBar: React.FC<FieldActionBarProps> = ({ surface }) => {
  const guidance = SURFACE_GUIDANCE[surface];
  const isMapSurface = surface === 'map';
  const isCompactActionSurface = isMapSurface || surface === 'postal-zones' || surface === 'portal' || surface === 'pos';
  const [lastAction, setLastAction] = React.useState('');

  const openQrReader = () => {
    dispatchFieldAction(FIELD_ACTION_EVENTS.openQrReader);
    setLastAction('QR読み取り');
    if (!isMapSurface) navigateWithinApp('/?action=qr');
  };

  const useCurrentLocation = () => {
    dispatchFieldAction(FIELD_ACTION_EVENTS.useCurrentLocation);
    setLastAction('現在地取得');
    if (!isMapSurface) navigateWithinApp('/?action=current-location');
  };

  const openAddressRegistration = () => {
    dispatchFieldAction(FIELD_ACTION_EVENTS.openAddressRegistration);
    setLastAction('住所登録');
    if (!isMapSurface) navigateWithinApp('/?action=register-address');
  };

  const openSyncQueue = () => {
    setLastAction('同期キュー');
    navigateWithinApp('/dashboard?surface=sync');
  };

  const requestUndo = () => {
    dispatchFieldAction(FIELD_ACTION_EVENTS.undoRequest);
    setLastAction('取り消し');
  };

  if (isCompactActionSurface) {
    return (
      <div className="pointer-events-none fixed right-[max(12px,var(--safe-area-right))] top-[74px] z-[70]">
        <section
          aria-label="Map quick actions"
          className="pointer-events-auto flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white/95 p-1 shadow-lg shadow-slate-950/10 backdrop-blur"
        >
          <button
            type="button"
            onClick={useCurrentLocation}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-blue-600 text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="現在地へ移動"
            title="現在地へ移動"
          >
            <Crosshair className="h-5 w-5" aria-hidden="true" />
          </button>
        </section>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'pointer-events-none inset-x-0 z-[70] px-3 sm:px-4',
        'sticky top-0 bg-slate-50/80 pb-2 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur',
      )}
    >
      <section
        aria-label="Field actions"
        className="pointer-events-auto mx-auto grid max-w-6xl gap-2 rounded-xl border border-slate-200/80 bg-white/95 p-2.5 text-slate-950 shadow-xl shadow-slate-950/10 backdrop-blur md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
              <MapPinCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                次にやること
              </p>
              <p className="truncate text-sm font-black leading-5 sm:text-base">
                {guidance.nextAction}
              </p>
            </div>
            <span
              className={cn(
                'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-black',
                QUALITY_CLASS[guidance.quality],
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {QUALITY_LABELS[guidance.quality]}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-slate-500">
            {REFERENCE_LABELS.map(label => (
              <span key={label} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
                {label}
              </span>
            ))}
            {lastAction && (
              <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-700">
                {lastAction}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5 md:w-[520px]">
          <button
            type="button"
            onClick={openQrReader}
            className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-2 text-[11px] font-black text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <QrCode className="h-4 w-4" aria-hidden="true" />
            QR
          </button>
          <button
            type="button"
            onClick={useCurrentLocation}
            className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2 text-[11px] font-black text-white shadow-sm transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Crosshair className="h-4 w-4" aria-hidden="true" />
            現在地
          </button>
          <button
            type="button"
            onClick={openAddressRegistration}
            className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-2 text-[11px] font-black text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            住所登録
          </button>
          <button
            type="button"
            onClick={openSyncQueue}
            className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-black text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <ListTodo className="h-4 w-4" aria-hidden="true" />
            同期
          </button>
          <button
            type="button"
            onClick={requestUndo}
            className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-black text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            取消
          </button>
        </div>
      </section>
    </div>
  );
};

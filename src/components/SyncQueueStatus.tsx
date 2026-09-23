import {
  AlertTriangle,
  CheckCircle2,
  CloudUpload,
  QrCode,
  ShieldCheck,
  X,
} from 'lucide-react';
import React from 'react';

import type { SyncQueueRecord } from '../lib/appDatabase';
import { cn } from '../lib/utils';

type SyncQueueStatusProps = {
  records: SyncQueueRecord[];
  appLanguage: string;
  onOpenQrLibrary: () => void;
  onScanQr: () => void;
};

function copy(appLanguage: string, en: string, ja: string) {
  return appLanguage === 'ja' ? ja : en;
}

function statusTone(status: SyncQueueRecord['status']) {
  if (status === 'failed') return 'border-amber-300 bg-amber-50 text-amber-800';
  if (status === 'sending') return 'border-blue-300 bg-blue-50 text-blue-800';
  return 'border-emerald-300 bg-emerald-50 text-emerald-800';
}

function statusLabel(record: SyncQueueRecord, appLanguage: string) {
  if (record.status === 'failed') return copy(appLanguage, 'retry', '再試行');
  if (record.status === 'sending') return copy(appLanguage, 'sending', '送信中');
  return copy(appLanguage, 'waiting', '待機');
}

function entityLabel(entityType: SyncQueueRecord['entityType'], appLanguage: string) {
  if (entityType === 'savedQr') return 'QR';
  if (entityType === 'registeredAddress') return copy(appLanguage, 'Address', '住所');
  if (entityType === 'aoid') return 'AOID';
  if (entityType.startsWith('pos')) return 'POS';
  return 'AGID';
}

function shortId(value: string) {
  if (value.length <= 12) return value;
  return `${value.slice(0, 4)}...${value.slice(-6)}`;
}

export const SyncQueueStatus: React.FC<SyncQueueStatusProps> = ({
  records,
  appLanguage,
  onOpenQrLibrary,
  onScanQr,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const failedCount = records.filter(record => record.status === 'failed').length;

  if (records.length === 0) return null;

  return (
    <div className="absolute right-2 top-36 z-50 pointer-events-auto w-[min(20rem,calc(100vw-1rem))] md:right-3 md:top-24">
      <button
        type="button"
        onClick={() => setIsOpen(value => !value)}
        className={cn(
          "ml-auto flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black shadow-lg backdrop-blur-md transition-all",
          failedCount > 0
            ? "border-amber-200 bg-amber-50/95 text-amber-800"
            : "border-emerald-200 bg-white/95 text-slate-800"
        )}
        aria-expanded={isOpen}
        aria-label={copy(appLanguage, 'Sync queue', '同期待ちキュー')}
      >
        {failedCount > 0 ? <AlertTriangle className="h-4 w-4" /> : <CloudUpload className="h-4 w-4 text-emerald-600" />}
        <span>{copy(appLanguage, 'Sync queue', '同期待ち')}</span>
        <span className="rounded-lg bg-slate-900 px-2 py-0.5 text-[10px] text-white">{records.length}</span>
      </button>

      {isOpen && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-900">
                  {copy(appLanguage, 'Pending sync', '未同期')}
                </p>
                <p className="text-[10px] font-bold text-slate-400">
                  {copy(appLanguage, 'no raw address', '生住所なし')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              aria-label={copy(appLanguage, 'Close sync queue', '同期待ちキューを閉じる')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto p-2">
            {records.slice(0, 5).map(record => (
              <div key={record.id} className="mb-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 last:mb-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs font-black text-slate-900">{shortId(record.entityId)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {entityLabel(record.entityType, appLanguage)} / {record.action}
                    </p>
                  </div>
                  <span className={cn("shrink-0 rounded-lg border px-2 py-1 text-[9px] font-black uppercase tracking-widest", statusTone(record.status))}>
                    {statusLabel(record, appLanguage)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-2">
            <button
              type="button"
              onClick={onScanQr}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-black text-white"
            >
              <QrCode className="h-4 w-4" />
              {copy(appLanguage, 'Scan', '読取')}
            </button>
            <button
              type="button"
              onClick={onOpenQrLibrary}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black text-slate-700"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {copy(appLanguage, 'QRs', 'QR一覧')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

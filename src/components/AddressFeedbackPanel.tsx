import { CheckCircle2, MessageSquareWarning, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
import {
  appendAddressFeedbackRecord,
  createAddressFeedbackDraftFromDisplay,
  createAddressFeedbackRecord,
  type AddressFeedbackIssue,
  type AddressFeedbackSummary,
} from '../lib/addressFeedbackLearning';
import {
  submitAddressQualityFeedback,
  type AddressQualityFeedbackSubmitResult,
} from '../lib/address/addressQualityFeedbackSubmission';
import { cn } from '../lib/utils';
import type { AddressDetails } from '../types/address';

type AddressFeedbackPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  presentation?: 'drawer' | 'map-left';
  agid?: string;
  countryCode?: string;
  languageTab?: string;
  addressDisplay: string;
  addressDetails?: AddressDetails | null;
  isSea?: boolean;
  qualityDecision?: string;
  qualityScore?: number;
  sourceIds?: string[];
  onLearningSaved?: (summary: AddressFeedbackSummary) => void;
  onFieldFeedbackSubmitted?: (result: AddressQualityFeedbackSubmitResult) => void;
  onApplyCorrection?: (correctedDisplay: string) => void;
};

type FeedbackStep = 'edit' | 'review' | 'saved';

const ISSUE_OPTIONS: Array<{
  id: AddressFeedbackIssue;
  label: string;
  description: string;
  category: 'correction' | 'delivery' | 'display';
}> = [
  { id: 'wrong-address', label: '住所修正', description: '地域・地点・住所候補が別の場所を指している', category: 'correction' },
  { id: 'translation', label: '翻訳修正', description: '住所翻訳や国際配送英語の訳を直したい', category: 'correction' },
  { id: 'undeliverable-region', label: '配送不可', description: '配送業者または現場がこの地域を配送対象外と判断した', category: 'delivery' },
  { id: 'po-box', label: 'PO Box', description: '私書箱・局留め等で通常配送や本人確認に制約がある', category: 'delivery' },
  { id: 'auto-lock', label: 'オートロック', description: '建物アクセスに受取人確認、解錠、入口情報が必要', category: 'delivery' },
  { id: 'unreachable', label: '到達不可', description: '道路閉鎖、災害、門扉、地形などで現場到達できない', category: 'delivery' },
  { id: 'missing-field', label: '項目不足', description: '道路、番地、建物、公園、水域などが欠けている', category: 'display' },
  { id: 'wrong-language', label: '言語が違う', description: '母国語・英語の表示が合っていない', category: 'display' },
  { id: 'bad-order', label: '順序が不自然', description: '国別住所順、配送ラベル順、改行が使いにくい', category: 'display' },
  { id: 'postal-code', label: '郵便番号が違う', description: '郵便番号、州、市区町村の対応が怪しい', category: 'display' },
  { id: 'building-or-poi', label: '建物・地物名', description: '道路、橋、湖、山、公園、施設名の扱いを直したい', category: 'display' },
  { id: 'wrong-script', label: '文字体系が違う', description: 'ローマ字、現地文字、表記体系が不自然', category: 'display' },
  { id: 'other', label: 'その他', description: '上の分類に当てはまらない', category: 'display' },
];

const DELIVERY_ISSUES = new Set<AddressFeedbackIssue>([
  'undeliverable-region',
  'po-box',
  'auto-lock',
  'unreachable',
]);


const fieldClass = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const primaryClass = 'rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50';

// Mount a fresh form for each target; background address updates must not erase a draft.
export const AddressFeedbackPanel: React.FC<AddressFeedbackPanelProps> = props => {
  if (!props.isOpen) return null;
  return <FeedbackForm key={[props.agid, props.languageTab].join(':')} {...props} />;
};

function FeedbackForm(props: AddressFeedbackPanelProps) {
  const [target] = React.useState(() => ({
    agid: props.agid, countryCode: props.countryCode, languageTab: props.languageTab,
    addressDisplay: props.addressDisplay, addressDetails: props.addressDetails,
    isSea: props.isSea, qualityDecision: props.qualityDecision,
    qualityScore: props.qualityScore, sourceIds: props.sourceIds,
  }));
  const [step, setStep] = React.useState<FeedbackStep>('edit');
  const [issue, setIssue] = React.useState<AddressFeedbackIssue>('wrong-address');
  const [severity, setSeverity] = React.useState<1 | 2 | 3>(2);
  const [correctedDisplay, setCorrectedDisplay] = React.useState('');
  const [userNote, setUserNote] = React.useState('');
  const [carrierRejected, setCarrierRejected] = React.useState(false);
  const [carrierId, setCarrierId] = React.useState('');
  const [consentForLocalLearning, setConsentForLocalLearning] = React.useState(true);
  const [submitToFieldQueue, setSubmitToFieldQueue] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState<AddressQualityFeedbackSubmitResult | null>(null);
  const saving = React.useRef(false);
  const savedRecord = React.useRef<ReturnType<typeof createAddressFeedbackRecord> | null>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const isDelivery = DELIVERY_ISSUES.has(issue);
  const corrected = correctedDisplay.trim();
  const hasCorrection = Boolean(corrected && corrected !== target.addressDisplay.trim());
  const issueLabel = ISSUE_OPTIONS.find(option => option.id === issue)!.label;
  const mapLeft = props.presentation === 'map-left';

  React.useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    headingRef.current?.focus();
    return () => { previous?.focus(); };
  }, []);
  React.useEffect(() => { headingRef.current?.focus(); }, [step]);

  const draft = createAddressFeedbackDraftFromDisplay({
    ...target,
    originalDisplay: target.addressDisplay,
    details: target.addressDetails,
    undeliverableRegion: issue === 'undeliverable-region',
    poBox: issue === 'po-box',
    autoLock: issue === 'auto-lock',
    unreachableAccess: issue === 'unreachable',
    carrierRejected: isDelivery && carrierRejected,
    carrierId: isDelivery ? carrierId : '',
  });

  const review = (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasCorrection && !userNote.trim() && !isDelivery) {
      setError('修正案、または何が違うかを補足に入力してください。');
      return;
    }
    setError('');
    setStep('review');
  };

  const saveFeedback = async () => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError('');
    try {
      // Reuse the saved record when retrying a failed transmission.
      let record = savedRecord.current;
      if (!record) {
        record = createAddressFeedbackRecord({
          ...target, source: 'agid-panel', originalDisplay: target.addressDisplay,
          correctedDisplay: hasCorrection ? corrected : undefined,
          issue, severity, userNote, consentForLocalLearning, context: draft.context,
        });
        const summary = appendAddressFeedbackRecord(record);
        savedRecord.current = record;
        props.onLearningSaved?.(summary);
      }
      if (submitToFieldQueue) {
        const submission = await submitAddressQualityFeedback(record);
        setResult(submission);
        props.onFieldFeedbackSubmitted?.(submission);
      }
      setStep('saved');
    } catch {
      setError(savedRecord.current
        ? '端末には保存済みですが、送信または未送信データの保存に失敗しました。再試行してください。'
        : '保存できませんでした。ブラウザーの保存領域を確認して再試行してください。');
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  const node = (
    <div className={mapLeft
      ? 'fixed left-3 right-3 top-[76px] z-[120] md:right-auto md:top-[92px] md:w-[440px]'
      : 'fixed inset-0 z-[120] flex justify-end bg-slate-950/40 p-3'}>
      <div ref={panelRef} role="dialog" aria-modal={!mapLeft} aria-labelledby="feedback-heading"
        aria-busy={busy}
        onKeyDown={event => {
          if (event.key === 'Escape' && !busy) props.onClose();
          if (event.key !== 'Tab' || mapLeft) return;
          const items = panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)');
          if (!items?.length) return;
          const first = items[0], last = items[items.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === headingRef.current)) {
            event.preventDefault(); last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault(); first.focus();
          }
        }}
        className="flex max-h-[calc(100dvh-100px)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl md:max-w-[480px]">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="feedback-heading" ref={headingRef} tabIndex={-1} className="flex items-center gap-2 text-base font-semibold outline-none">
              <MessageSquareWarning className="h-4 w-4 text-blue-600" />
              {step === 'saved' ? '報告を保存しました' : step === 'review' ? '報告内容の確認' : '住所の問題を報告'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">Report · 住所データの改善に協力</p>
          </div>
          <button type="button" onClick={props.onClose} disabled={busy} aria-label="閉じる" className="p-2 text-slate-500 hover:text-slate-900 disabled:opacity-40"><X className="h-5 w-5" /></button>
        </header>
        <div className="min-h-0 overflow-y-auto px-5 py-4">
          <div className="mb-5 rounded-xl bg-slate-50 p-3">
            <div className="flex flex-wrap justify-between gap-1 text-xs text-slate-500">
              <span className="font-mono text-slate-700">{target.agid || '地点未指定'}</span>
              <span>{target.countryCode} · {target.languageTab}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{target.addressDisplay || '住所表示なし'}</p>
          </div>
          {step === 'edit' && (
            <form id="address-feedback-form" onSubmit={review} className="space-y-5">
              <label className="block text-sm font-semibold">何が違いますか？
                <select value={issue} onChange={event => {
                  setIssue(event.target.value as AddressFeedbackIssue);
                  setCarrierRejected(false); setCarrierId(''); setError('');
                }} className={fieldClass}>
                  {(['correction', 'display', 'delivery'] as const).map(category => (
                    <optgroup key={category} label={category === 'correction' ? '住所・翻訳' : category === 'display' ? '表示・項目' : '配送・アクセス'}>
                      {ISSUE_OPTIONS.filter(option => option.category === category).map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                    </optgroup>
                  ))}
                </select>
                <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">{ISSUE_OPTIONS.find(option => option.id === issue)!.description}</span>
              </label>
              <label className="block text-sm font-semibold">修正案 <span className="font-normal text-slate-400">任意</span>
                <textarea value={correctedDisplay} onChange={event => { setCorrectedDisplay(event.target.value); setError(''); }} rows={3} maxLength={2000} className={fieldClass} placeholder="正しい住所・郵便番号・翻訳が分かれば入力" />
                <span className="block text-xs font-normal text-slate-500">端末内に保存されます。修正案は外部に送信されません。</span>
              </label>
              <label className="block text-sm font-semibold">補足・確認した根拠
                <textarea value={userNote} onChange={event => { setUserNote(event.target.value); setError(''); }} rows={3} maxLength={280} className={fieldClass} placeholder="例：現地の看板では建物名が異なる／北側の入口は通行できない" />
                <span className="block text-xs font-normal leading-5 text-slate-500">送信を選んだ場合は共有されます。氏名・電話・メール・個人の住所・暗証番号は入力しないでください。</span>
              </label>
              {isDelivery && <div className="space-y-3 rounded-xl bg-amber-50 p-3 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" checked={carrierRejected} onChange={event => setCarrierRejected(event.target.checked)} />配送業者による拒否を確認した</label>
                <label className="block">配送業者コード（任意）<input value={carrierId} onChange={event => setCarrierId(event.target.value)} maxLength={40} placeholder="例：DHL" className={fieldClass} /></label>
              </div>}
              <label className="block text-sm font-semibold">影響の大きさ
                <select value={severity} onChange={event => setSeverity(Number(event.target.value) as 1 | 2 | 3)} className={fieldClass}>
                  <option value={1}>軽微 — 表記の調整</option><option value={2}>要修正 — 場所の特定に影響</option><option value={3}>重大 — 誤配送・到達不可</option>
                </select>
              </label>
            </form>
          )}
          {step === 'review' && <div className="space-y-4 text-sm">
            <dl className="space-y-3">
              <div><dt className="text-xs text-slate-500">問題・影響</dt><dd className="mt-1 font-semibold">{issueLabel} · {['軽微', '要修正', '重大'][severity - 1]}</dd></div>
              {hasCorrection && <div className="rounded-xl bg-blue-50 p-3"><dt className="text-xs text-blue-700">修正案（端末内のみ）</dt><dd className="mt-1 whitespace-pre-wrap break-words">{corrected}</dd></div>}
              {userNote.trim() && <div><dt className="text-xs text-slate-500">補足・根拠</dt><dd className="mt-1 whitespace-pre-wrap break-words">{userNote.trim()}</dd></div>}
              {isDelivery && <div><dt className="text-xs text-slate-500">配送業者による拒否</dt><dd>{carrierRejected ? '確認済み' : '未確認'} {carrierId}</dd></div>}
            </dl>
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <label className="flex items-start gap-3"><input type="checkbox" checked={consentForLocalLearning} disabled={busy || Boolean(savedRecord.current)} onChange={event => setConsentForLocalLearning(event.target.checked)} className="mt-1" /><span>この端末の改善提案に利用する<span className="mt-1 block text-xs leading-5 text-slate-500">分類や地域の傾向を学習します。チェックを外しても報告は端末内に保存されます。</span></span></label>
              <label className="flex items-start gap-3"><input type="checkbox" checked={submitToFieldQueue} disabled={busy || Boolean(savedRecord.current)} onChange={event => setSubmitToFieldQueue(event.target.checked)} className="mt-1" /><span>改善用フィードバックを送信する<span className="mt-1 block text-xs leading-5 text-slate-500">分類・国・言語・AGID末尾・参照元・配送制約・補足を送ります。住所本文・修正案は送りません。送信できない場合は端末に未送信として保存します。</span></span></label>
            </div>
            <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">報告だけで公開住所が書き換わることはありません。修正案は保存後、この画面の住所へ一時反映できます。</p>
          </div>}
          {step === 'saved' && <div className="space-y-4">
            <div role="status" className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div><p className="font-semibold">{result?.status === 'sent' ? 'フィードバックを送信しました' : result?.status === 'queued' ? '端末に保存しました（未送信）' : '端末に保存しました'}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{result?.status === 'sent' ? '改善用の報告が受理されました。公開データへの反映が完了したことを示すものではありません。' : result?.status === 'queued' ? '通信またはサーバーの問題で送信できませんでした。報告は端末の未送信データとして保持しています。' : '外部への送信は行っていません。'}</p>
              </div>
            </div>
            {hasCorrection && props.onApplyCorrection && <div className="rounded-xl border border-slate-200 p-3">
              <p className="whitespace-pre-wrap break-words text-sm">{corrected}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">この地点・言語の表示だけに一時反映します。公開データは変更しません。</p>
              <button type="button" className={cn(primaryClass, 'mt-3 w-full')} onClick={() => { props.onApplyCorrection?.(corrected); props.onClose(); }}>修正案を一時反映</button>
            </div>}
          </div>}
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </div>
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-white px-5 py-3">
          <span className="text-xs text-slate-400">{step === 'edit' ? '1 / 2 入力' : step === 'review' ? '2 / 2 確認' : 'ご協力ありがとうございます'}</span>
          <div className="flex gap-2">
            {step === 'edit' && <button type="submit" form="address-feedback-form" className={primaryClass}>内容を確認</button>}
            {step === 'review' && <>
              <button type="button" disabled={busy || Boolean(savedRecord.current)} onClick={() => setStep('edit')} className="px-3 text-sm text-slate-600 disabled:opacity-40">修正する</button>
              <button type="button" disabled={busy} onClick={saveFeedback} className={primaryClass}>{busy ? '処理中…' : submitToFieldQueue ? '保存して送信' : '端末に保存'}</button>
            </>}
            {step === 'saved' && <button type="button" onClick={props.onClose} className={primaryClass}>地図に戻る</button>}
          </div>
        </footer>
      </div>
    </div>
  );
  return typeof document === 'undefined' ? node : createPortal(node, document.body);
}

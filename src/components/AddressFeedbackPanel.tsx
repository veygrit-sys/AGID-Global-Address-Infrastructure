import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  MessageSquareWarning,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';
import {
  appendAddressFeedbackRecord,
  createAddressFeedbackDraftFromDisplay,
  createAddressFeedbackRecord,
  describeAddressFeedbackAction,
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
  closeOnSaved?: boolean;
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

type FeedbackStep = 'classify' | 'correct' | 'review' | 'saved';

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
  { id: 'wrong-language', label: '言語タブ不一致', description: '母国語タブや英語タブの出し分けが合っていない', category: 'display' },
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

function shortActionLabel(action: string) {
  if (action === 'boost-current-language') return '言語タブ優先';
  if (action === 'prefer-english-shipping') return '配送英語優先';
  if (action === 'boost-postal-evidence') return '郵便証拠強化';
  if (action === 'boost-map-feature') return '地物名証拠強化';
  if (action === 'penalize-current-display') return '現表示を減点';
  if (action === 'queue-reverification') return '再検証へ送る';
  return '手動確認';
}

function actionPriorityLabel(score: number) {
  if (score >= 0.75) return '優先度 高';
  if (score >= 0.45) return '優先度 中';
  return '優先度 低';
}

function publicQualityDecisionLabel(decision: string) {
  if (decision === 'show' || decision === 'verified' || decision === 'address-ok' || decision === 'ok') return 'OK';
  if (decision === 'hide' || decision === 'blocked' || decision === 'restricted') return '制限';
  if (decision === 'rejected' || decision === 'reject') return '拒否';
  return '要確認';
}

function publicFeedbackQualityLabel(decision?: string, score?: number) {
  if (decision === 'hide' || decision === 'blocked' || decision === 'restricted' || decision === 'rejected' || decision === 'reject') {
    return 'Manual required';
  }
  if ((decision === 'show' || decision === 'verified' || decision === 'address-ok' || decision === 'ok') && typeof score === 'number' && score >= 0.75) {
    return 'Verified';
  }
  return 'Partial';
}

function shortAgidLabel(value?: string) {
  const clean = String(value ?? '').trim();
  if (!clean) return 'AGID pending';
  return `AGID ...${clean.slice(-6)}`;
}

function feedbackStepIndex(step: FeedbackStep) {
  if (step === 'classify') return 0;
  if (step === 'correct') return 1;
  if (step === 'review') return 2;
  return 3;
}

export const AddressFeedbackPanel: React.FC<AddressFeedbackPanelProps> = ({
  isOpen,
  onClose,
  presentation = 'drawer',
  closeOnSaved = false,
  agid,
  countryCode,
  languageTab,
  addressDisplay,
  addressDetails,
  isSea,
  qualityDecision,
  qualityScore,
  sourceIds,
  onLearningSaved,
  onFieldFeedbackSubmitted,
  onApplyCorrection,
}) => {
  const [step, setStep] = React.useState<FeedbackStep>('classify');
  const [issue, setIssue] = React.useState<AddressFeedbackIssue>('wrong-address');
  const [severity, setSeverity] = React.useState<1 | 2 | 3>(2);
  const [correctedDisplay, setCorrectedDisplay] = React.useState('');
  const [userNote, setUserNote] = React.useState('');
  const [undeliverableRegion, setUndeliverableRegion] = React.useState(false);
  const [poBox, setPoBox] = React.useState(false);
  const [autoLock, setAutoLock] = React.useState(false);
  const [unreachableAccess, setUnreachableAccess] = React.useState(false);
  const [carrierRejected, setCarrierRejected] = React.useState(false);
  const [carrierId, setCarrierId] = React.useState('');
  const [consentForLocalLearning, setConsentForLocalLearning] = React.useState(true);
  const [submitToFieldQueue, setSubmitToFieldQueue] = React.useState(true);
  const [fieldSubmitState, setFieldSubmitState] = React.useState<'idle' | 'sending' | 'sent' | 'queued'>('idle');
  const [fieldSubmitResult, setFieldSubmitResult] = React.useState<AddressQualityFeedbackSubmitResult | null>(null);
  const [savedSummary, setSavedSummary] = React.useState<AddressFeedbackSummary | null>(null);
  const closeTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setStep('classify');
    setIssue('wrong-address');
    setSeverity(2);
    setCorrectedDisplay(addressDisplay || '');
    setUserNote('');
    setUndeliverableRegion(false);
    setPoBox(false);
    setAutoLock(false);
    setUnreachableAccess(false);
    setCarrierRejected(false);
    setCarrierId('');
    setConsentForLocalLearning(true);
    setSubmitToFieldQueue(true);
    setFieldSubmitState('idle');
    setFieldSubmitResult(null);
    setSavedSummary(null);
  }, [addressDisplay, isOpen]);

  React.useEffect(() => () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
  }, []);

  if (!isOpen) return null;

  const inferredUndeliverable = undeliverableRegion || issue === 'undeliverable-region';
  const inferredPoBox = poBox || issue === 'po-box';
  const inferredAutoLock = autoLock || issue === 'auto-lock';
  const inferredUnreachable = unreachableAccess || issue === 'unreachable';
  const inferredCarrierRejected = carrierRejected || DELIVERY_ISSUES.has(issue);

  const draft = createAddressFeedbackDraftFromDisplay({
    agid,
    countryCode,
    languageTab,
    originalDisplay: addressDisplay,
    details: addressDetails,
    isSea,
    undeliverableRegion: inferredUndeliverable,
    poBox: inferredPoBox,
    autoLock: inferredAutoLock,
    unreachableAccess: inferredUnreachable,
    carrierRejected: inferredCarrierRejected,
    carrierId,
    qualityDecision,
    qualityScore,
    sourceIds,
  });

  const chooseIssue = (nextIssue: AddressFeedbackIssue) => {
    setIssue(nextIssue);
    if (nextIssue === 'undeliverable-region') setUndeliverableRegion(true);
    if (nextIssue === 'po-box') setPoBox(true);
    if (nextIssue === 'auto-lock') setAutoLock(true);
    if (nextIssue === 'unreachable') setUnreachableAccess(true);
    if (DELIVERY_ISSUES.has(nextIssue)) {
      setCarrierRejected(true);
      setSeverity(3);
    }
  };

  const correctionHeading =
    issue === 'translation'
      ? '正しい翻訳・国際配送表示を入力'
      : DELIVERY_ISSUES.has(issue)
        ? '配送・アクセス報告の補足'
        : '正しい住所表示案を入力';

  const deliveryFlagOptions: Array<{
    id: string;
    label: string;
    checked: boolean;
    setChecked: React.Dispatch<React.SetStateAction<boolean>>;
  }> = [
    { id: 'undeliverable', label: '配送不可地域', checked: undeliverableRegion, setChecked: setUndeliverableRegion },
    { id: 'po-box', label: 'PO Box / 私書箱', checked: poBox, setChecked: setPoBox },
    { id: 'auto-lock', label: 'オートロック', checked: autoLock, setChecked: setAutoLock },
    { id: 'unreachable', label: '到達不可', checked: unreachableAccess, setChecked: setUnreachableAccess },
    { id: 'carrier-rejected', label: '配送業者が拒否', checked: carrierRejected, setChecked: setCarrierRejected },
  ];

  const saveFeedback = async () => {
    if (fieldSubmitState === 'sending') return;
    const record = createAddressFeedbackRecord({
      source: 'agid-panel',
      agid,
      countryCode,
      languageTab,
      originalDisplay: addressDisplay,
      correctedDisplay: correctedDisplay !== addressDisplay ? correctedDisplay : undefined,
      issue,
      severity,
      userNote,
      consentForLocalLearning,
      context: draft.context,
    });
    const summary = appendAddressFeedbackRecord(record);
    setSavedSummary(summary);
    onLearningSaved?.(summary);
    if (submitToFieldQueue) {
      setFieldSubmitState('sending');
      const result = await submitAddressQualityFeedback(record);
      setFieldSubmitResult(result);
      setFieldSubmitState(result.status);
      onFieldFeedbackSubmitted?.(result);
    } else {
      setFieldSubmitState('idle');
      setFieldSubmitResult(null);
    }
    setStep('saved');
    if (closeOnSaved) {
      closeTimerRef.current = window.setTimeout(() => {
        closeTimerRef.current = null;
        onClose();
      }, 950);
    }
  };

  const isMapLeftPresentation = presentation === 'map-left';
  const rootClassName = isMapLeftPresentation
    ? "fixed left-3 right-3 top-[76px] z-[58] pointer-events-none md:right-auto md:top-[92px] md:w-[min(50vw,640px)]"
    : "fixed inset-0 z-[120] bg-slate-950/55 backdrop-blur-sm pointer-events-auto";
  const shellClassName = isMapLeftPresentation
    ? "pointer-events-auto"
    : "flex min-h-full justify-end";
  const panelClassName = isMapLeftPresentation
    ? "flex max-h-[calc(100dvh-88px)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl md:max-h-[calc(100dvh-112px)]"
    : "flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden border-l border-slate-200 bg-slate-50 shadow-2xl";
  const contentGridClassName = isMapLeftPresentation
    ? "grid min-h-0 flex-1 gap-0 2xl:grid-cols-[1fr_220px]"
    : "grid min-h-0 flex-1 gap-0 lg:grid-cols-[1fr_280px]";
  const asideClassName = isMapLeftPresentation
    ? "min-h-0 overflow-y-auto border-t border-slate-200 bg-white p-4 2xl:border-l 2xl:border-t-0"
    : "min-h-0 overflow-y-auto border-t border-slate-200 bg-white p-4 lg:border-l lg:border-t-0";

  const panelNode = (
    <div className={rootClassName} role="dialog" aria-modal={!isMapLeftPresentation} aria-label={isMapLeftPresentation ? "Address feedback map-left panel" : "Address feedback drawer"}>
      <div className={shellClassName}>
        <div className={panelClassName}>
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <MessageSquareWarning className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black text-slate-950">住所表示フィードバック</div>
                <div className="truncate text-xs font-semibold text-slate-500">
                  {draft.countryCode || 'Unknown country'} / {draft.languageTab || 'unknown tab'} / closed-device local learning
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Quality</div>
                <div className="mt-0.5 text-sm font-black text-slate-950">
                  {publicFeedbackQualityLabel(qualityDecision, qualityScore)}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Report target</div>
                <div className="mt-0.5 truncate font-mono text-sm font-black text-slate-950">
                  {shortAgidLabel(agid)}
                </div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <div className="text-[10px] font-black uppercase tracking-wide text-emerald-600">Submission</div>
                <div className="mt-0.5 text-sm font-black text-emerald-950">
                  redacted field report
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs font-bold leading-5 text-slate-600">
              住所本文はこの画面での確認・修正用です。現場改善へ送るのは分類、AGID末尾、国、言語、証拠ソース、配送制約だけです。
            </p>
          </div>

          <div className={contentGridClassName}>
            <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
              <div className="mb-4 grid grid-cols-4 gap-2">
                {(['分類', '修正', '確認', '保存'] as const).map((label, index) => (
                  <div
                    key={label}
                    className={cn(
                      "rounded-xl border px-2 py-2 text-center text-[10px] font-black",
                      feedbackStepIndex(step) >= index
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-400"
                    )}
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] font-black uppercase tracking-wide text-slate-500">Current display</div>
                  <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-slate-500">
                    edit-only preview
                  </div>
                </div>
                <div className="rounded-xl bg-slate-950 p-3 font-mono text-xs font-semibold leading-relaxed text-slate-100">
                  {addressDisplay || 'Address display unavailable'}
                </div>
              </div>

              {step === 'classify' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">何が違いますか？</h2>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      分類はAIの報酬信号になります。ここでは端末内にだけ保存され、サーバーへ送信しません。
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {ISSUE_OPTIONS.map(option => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => chooseIssue(option.id)}
                        className={cn(
                          "min-h-[86px] rounded-2xl border p-3 text-left transition",
                          issue === option.id
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-100"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-black text-slate-950">{option.label}</span>
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide",
                            option.category === 'delivery' ? "bg-orange-100 text-orange-700" : option.category === 'correction' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                          )}>
                            {option.category === 'delivery' ? 'Delivery' : option.category === 'correction' ? 'Fix' : 'Display'}
                          </span>
                          {issue === option.id && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div className="mt-1 text-xs font-medium leading-relaxed text-slate-600">{option.description}</div>
                      </button>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-orange-200 bg-orange-50 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-orange-700">
                      <AlertTriangle className="h-4 w-4" /> 配送・アクセス制約
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {deliveryFlagOptions.map(option => (
                        <label
                          key={option.id}
                          className={cn(
                            "flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition",
                            option.checked ? "border-orange-400 bg-white text-orange-900 shadow-sm" : "border-orange-200 bg-orange-100/60 text-orange-700 hover:bg-white"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={option.checked}
                            onChange={event => option.setChecked(event.target.checked)}
                            className="h-4 w-4 rounded border-orange-300"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                    <label className="mt-3 block">
                      <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-orange-700">Carrier / operator code</span>
                      <input
                        value={carrierId}
                        onChange={event => setCarrierId(event.target.value)}
                        placeholder="例: JAPANPOST, DHL, FIELD-TEAM-A"
                        className="h-10 w-full rounded-xl border border-orange-200 bg-white px-3 text-xs font-bold text-slate-950 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
                      />
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep('correct')}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                    >
                      修正へ進む <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 'correct' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">{correctionHeading}</h2>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      氏名・電話番号・メール・部屋番号など、不要な個人情報は書かないでください。配送制約だけを報告する場合、表示案は空欄のままでも構いません。
                    </p>
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                      {issue === 'translation' ? 'Corrected translation' : DELIVERY_ISSUES.has(issue) ? 'Optional corrected display' : 'Corrected display'}
                    </span>
                    <textarea
                      value={correctedDisplay}
                      onChange={event => setCorrectedDisplay(event.target.value)}
                      className="min-h-[132px] w-full resize-y rounded-2xl border border-slate-300 bg-white p-3 font-mono text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>
                  <div>
                    <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Severity</div>
                    <div className="grid grid-cols-3 gap-2">
                      {([1, 2, 3] as const).map(value => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setSeverity(value)}
                          className={cn(
                            "rounded-xl border px-3 py-3 text-sm font-black transition",
                            severity === value ? "border-amber-500 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          {value === 1 ? '軽微' : value === 2 ? '要修正' : '危険'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Operator note</span>
                    <textarea
                      value={userNote}
                      onChange={event => setUserNote(event.target.value)}
                      placeholder="例: 郵便番号は正しいが、町名が隣接地域になっている"
                      className="min-h-[86px] w-full resize-y rounded-2xl border border-slate-300 bg-white p-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>
                  <div className="flex flex-wrap justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setStep('classify')}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                    >
                      <RotateCcw className="h-4 w-4" /> 戻る
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('review')}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                    >
                      保存前確認 <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 'review' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">保存と学習の確認</h2>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      このAIはローカルの文脈付きバンディットです。表示失敗の傾向を重みとして学び、再検証や表示優先度の提案に使います。
                    </p>
                  </div>
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                      <BrainCircuit className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                      <div>
                        <div className="text-sm font-black text-blue-950">なんのAI?</div>
                        <div className="mt-1 text-sm font-semibold leading-relaxed text-blue-900">
                          LLMではなく、住所表示の誤り分類、国、言語タブ、郵便番号・道路・建物の有無から、
                          次にどの証拠を強めるべきかを学ぶ小さな強化学習モデルです。
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Report summary</div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{issue}</span>
                      {inferredUndeliverable && <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">undeliverable</span>}
                      {inferredPoBox && <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">PO Box</span>}
                      {inferredAutoLock && <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">auto-lock</span>}
                      {inferredUnreachable && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-800">unreachable</span>}
                      {inferredCarrierRejected && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-800">carrier rejected</span>}
                      {carrierId.trim() && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{carrierId.trim().toUpperCase()}</span>}
                    </div>
                  </div>
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <input
                      type="checkbox"
                      checked={consentForLocalLearning}
                      onChange={event => setConsentForLocalLearning(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />
                    <span>
                      <span className="block text-sm font-black text-slate-950">この端末内の閉じた学習に使う</span>
                      <span className="mt-1 block text-xs font-semibold leading-relaxed text-slate-600">
                        localStorageに保存します。外部送信、クラウド同期、公開学習は行いません。将来のエクスポートも手動だけにします。
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <input
                      type="checkbox"
                      checked={submitToFieldQueue}
                      onChange={event => setSubmitToFieldQueue(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-blue-300"
                    />
                    <span>
                      <span className="block text-sm font-black text-blue-950">現場改善キューへ送信する</span>
                      <span className="mt-1 block text-xs font-semibold leading-relaxed text-blue-900">
                        送信するのは分類、国、言語、AGID末尾、証拠ソース、配送制約だけです。住所本文、修正文、受取人情報は送信しません。
                        オフライン時は端末内の同期待ちキューに残します。
                      </span>
                    </span>
                  </label>
                  <div className="flex flex-wrap justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setStep('correct')}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                    >
                      <RotateCcw className="h-4 w-4" /> 戻る
                    </button>
                    <button
                      type="button"
                      onClick={saveFeedback}
                      disabled={fieldSubmitState === 'sending'}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                    >
                      <ShieldCheck className="h-4 w-4" /> {fieldSubmitState === 'sending' ? '送信中' : '保存して送信'}
                    </button>
                  </div>
                </div>
              )}

              {step === 'saved' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                      <div>
                        <h2 className="text-lg font-black text-emerald-950">フィードバックを保存しました</h2>
                        <p className="mt-1 text-sm font-semibold text-emerald-900">
                          学習サンプル: {savedSummary?.samples ?? 0} / 保存範囲: {savedSummary?.privacy ?? 'closed-device-local'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {submitToFieldQueue && (
                    <div className={cn(
                      "rounded-2xl border p-4",
                      fieldSubmitState === 'sent'
                        ? "border-blue-200 bg-blue-50"
                        : "border-amber-200 bg-amber-50"
                    )}>
                      <div className="text-sm font-black text-slate-950">
                        {fieldSubmitState === 'sent' ? '現場改善フィードバックを送信しました' : '現場改善フィードバックを同期待ちにしました'}
                      </div>
                      <div className="mt-1 text-xs font-semibold leading-relaxed text-slate-700">
                        {fieldSubmitState === 'sent'
                          ? `受理ID: ${fieldSubmitResult?.responseId || fieldSubmitResult?.submission.id || 'accepted'}`
                          : `理由: ${fieldSubmitResult?.queuedReason || 'offline'}。raw住所なしのredacted reportだけを保持しています。`}
                      </div>
                    </div>
                  )}
                  {closeOnSaved && (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm font-black text-blue-900">
                      報告を保存しました。地図とグリッドの画面に戻ります。
                    </div>
                  )}
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-black text-slate-950">
                      <Sparkles className="h-4 w-4 text-blue-600" /> 推奨される改善アクション
                    </div>
                    <div className="space-y-2">
                      {(savedSummary?.topActions || []).map(item => (
                        <div key={item.action} className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-black text-slate-950">{shortActionLabel(item.action)}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">
                              {actionPriorityLabel(item.score)}
                            </span>
                          </div>
                          <div className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
                            {item.reason || describeAddressFeedbackAction(item.action)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {correctedDisplay && correctedDisplay !== addressDisplay && (
                      <button
                        type="button"
                        onClick={() => onApplyCorrection?.(correctedDisplay)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                      >
                        一時的に表示へ反映
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                    >
                      {closeOnSaved ? '元の画面に戻る' : '閉じる'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <aside className={asideClassName}>
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                    <ShieldCheck className="h-4 w-4" /> Privacy
                  </div>
                  <ul className="space-y-2 text-xs font-semibold leading-relaxed text-slate-700">
                    <li>住所本文は外部送信しません。</li>
                    <li>氏名・電話・メールらしきメモは保存しません。</li>
                    <li>AGIDは末尾だけ保存します。</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                    <BrainCircuit className="h-4 w-4" /> Learning signals
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
                    <div className={cn("rounded-xl p-2", draft.context.hasPostcode ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800")}>
                      Postcode {draft.context.hasPostcode ? 'あり' : '不足'}
                    </div>
                    <div className={cn("rounded-xl p-2", draft.context.hasStreet ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800")}>
                      Street {draft.context.hasStreet ? 'あり' : '不足'}
                    </div>
                    <div className={cn("rounded-xl p-2", draft.context.hasBuilding ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700")}>
                      Feature {draft.context.hasBuilding ? 'あり' : '任意'}
                    </div>
                    <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                      {draft.context.isSea ? 'Sea/Water' : 'Land'}
                    </div>
                    <div className={cn("rounded-xl p-2", draft.context.undeliverableRegion ? "bg-red-50 text-red-800" : "bg-slate-100 text-slate-700")}>
                      Delivery {draft.context.undeliverableRegion ? '不可' : '未報告'}
                    </div>
                    <div className={cn("rounded-xl p-2", draft.context.poBox ? "bg-orange-50 text-orange-800" : "bg-slate-100 text-slate-700")}>
                      PO Box {draft.context.poBox ? 'あり' : 'なし'}
                    </div>
                    <div className={cn("rounded-xl p-2", draft.context.autoLock ? "bg-orange-50 text-orange-800" : "bg-slate-100 text-slate-700")}>
                      Auto-lock {draft.context.autoLock ? 'あり' : 'なし'}
                    </div>
                    <div className={cn("rounded-xl p-2", draft.context.unreachableAccess ? "bg-red-50 text-red-800" : "bg-slate-100 text-slate-700")}>
                      Reach {draft.context.unreachableAccess ? '不可' : '未報告'}
                    </div>
                  </div>
                </div>
                {qualityDecision && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                    <div className="mb-1 flex items-center gap-2 text-xs font-black text-amber-900">
                      <AlertTriangle className="h-4 w-4" /> 表示判定
                    </div>
                    <div className="text-xs font-semibold text-amber-900">
                      {publicQualityDecisionLabel(qualityDecision)}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return panelNode;
  return createPortal(panelNode, document.body);
};

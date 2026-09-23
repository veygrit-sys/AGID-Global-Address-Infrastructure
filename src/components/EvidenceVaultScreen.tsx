import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  EyeOff,
  FileText,
  Fingerprint,
  LockKeyhole,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import React from 'react';

import {
  buildAddressEvidenceVaultPresentation,
  buildAddressEvidenceVaultRecord,
  buildAddressEvidenceVaultFlow,
  redactAddressEvidenceVaultRecord,
  reviewAddressEvidenceRedaction,
  type AddressEvidenceVaultPresentation,
  type AddressEvidenceVaultRecord,
} from '../lib/addressEvidenceVault';
import { extractPrintableTextFromBinary } from '../lib/addressDocumentReading';
import { getLanguageDirection } from '../lib/i18n';
import {
  APP_LANGUAGES,
  APP_LANGUAGE_STORAGE_KEY,
  normalizeAppLanguage,
} from '../lib/languageSettings';
import { formatPublicConfidenceBand } from '../lib/publicDecisionDisplay';
import { cn } from '../lib/utils';

type VaultCopyKey =
  | 'returnToMap'
  | 'subtitle'
  | 'language'
  | 'privacyBoundary'
  | 'privacyBody'
  | 'upload'
  | 'localTextLayer'
  | 'purpose'
  | 'highRisk'
  | 'highRiskBody'
  | 'fileStaysLocal'
  | 'redactedProjection'
  | 'proofEnvelope'
  | 'verifierReceives'
  | 'copyProof'
  | 'fieldsDetected'
  | 'requiredControls'
  | 'warnings'
  | 'status'
  | 'confidence'
  | 'storage'
  | 'processing'
  | 'presentation'
  | 'expires'
  | 'holderBinding'
  | 'clearLocal'
  | 'ocrNote'
  | 'sampleText'
  | 'vaultFlow'
  | 'vaultFlowBody'
  | 'localOcr'
  | 'redactionReview'
  | 'proofToVerifier'
  | 'proofReady'
  | 'notReady'
  | 'reviewSummary'
  | 'hiddenFields'
  | 'commitmentCount'
  | 'documentShared'
  | 'textShared'
  | 'serverStorageAllowed'
  | 'commitmentsOnly';

const COPY: Record<'en' | 'ja', Record<VaultCopyKey, string>> = {
  en: {
    returnToMap: 'Return to map',
    subtitle: 'Local-only evidence vault for PDFs, photos, OCR text, redaction, and proof envelopes without uploading source documents.',
    language: 'Language',
    privacyBoundary: 'No document disclosure',
    privacyBody: 'Evidence files stay on the holder device. The verifier receives commitments, challenge bindings, expiry, and redacted field metadata only. Verifier server storage is not allowed in the proof envelope.',
    upload: 'Upload PDF / photo / text file',
    localTextLayer: 'Local OCR or text layer',
    purpose: 'Purpose',
    highRisk: 'High-risk mode',
    highRiskBody: 'Blocks external adapters, shortens retention expectations, and hides locality previews.',
    fileStaysLocal: 'File stays local',
    redactedProjection: 'Redacted projection',
    proofEnvelope: 'Proof envelope',
    verifierReceives: 'Verifier receives commitments only',
    copyProof: 'Copy proof envelope',
    fieldsDetected: 'Fields detected',
    requiredControls: 'Required controls',
    warnings: 'Warnings',
    status: 'Status',
    confidence: 'Proof status',
    storage: 'Storage',
    processing: 'Processing',
    presentation: 'Presentation',
    expires: 'Expires',
    holderBinding: 'Holder binding',
    clearLocal: 'Clear local draft',
    ocrNote: 'Images and scanned PDFs need a local OCR worker before strong proof. No upload is performed.',
    sampleText: 'Paste local OCR output or a document text layer here. This draft is transient device memory.',
    vaultFlow: 'Local proof flow',
    vaultFlowBody: 'Run OCR locally, confirm redaction, then share only a verifier-bound proof envelope.',
    localOcr: 'Local OCR',
    redactionReview: 'Redaction review',
    proofToVerifier: 'Proof to verifier',
    proofReady: 'Proof ready',
    notReady: 'Not ready',
    reviewSummary: 'Review summary',
    hiddenFields: 'Hidden fields',
    commitmentCount: 'Commitments',
    documentShared: 'Document shared',
    textShared: 'Text shared',
    serverStorageAllowed: 'Server storage allowed',
    commitmentsOnly: 'Commitments only',
  },
  ja: {
    returnToMap: '地図へ戻る',
    subtitle: 'PDF・写真・OCRテキストを端末内で処理し、redaction と proof envelope だけを作る Evidence Vault です。',
    language: '言語',
    privacyBoundary: '資料は開示しない',
    privacyBody: '証拠ファイルは本人端末に留めます。相手にはcommitment、challenge binding、期限、redacted field metadataだけを渡します。proof envelopeでは相手サーバー保存を許可しません。',
    upload: 'PDF / 写真 / テキストを選択',
    localTextLayer: 'ローカルOCRまたはテキスト層',
    purpose: '用途',
    highRisk: '高リスクモード',
    highRiskBody: '外部アダプタをブロックし、保持期間を短くし、地名previewをさらに隠します。',
    fileStaysLocal: 'ファイルは端末内',
    redactedProjection: 'Redacted projection',
    proofEnvelope: 'Proof envelope',
    verifierReceives: '相手はcommitmentのみ受領',
    copyProof: 'Proof envelopeをコピー',
    fieldsDetected: '検出フィールド',
    requiredControls: '必須コントロール',
    warnings: '警告',
    status: 'Status',
    confidence: '証明状態',
    storage: 'Storage',
    processing: 'Processing',
    presentation: 'Presentation',
    expires: 'Expires',
    holderBinding: 'Holder binding',
    clearLocal: 'ローカル下書きを消去',
    ocrNote: '画像やスキャンPDFは、強い証明の前にローカルOCR workerが必要です。アップロードは行いません。',
    sampleText: 'ローカルOCR結果または文書のテキスト層を貼り付けます。この下書きは端末メモリだけで扱います。',
    vaultFlow: 'ローカル証明フロー',
    vaultFlowBody: 'OCRを端末内で行い、redactionを確認し、相手にはchallengeに紐づくproof envelopeだけを渡します。',
    localOcr: 'ローカルOCR',
    redactionReview: 'Redaction確認',
    proofToVerifier: '相手への証明',
    proofReady: '証明可能',
    notReady: '未準備',
    reviewSummary: '確認サマリー',
    hiddenFields: '秘匿フィールド',
    commitmentCount: 'Commitment数',
    documentShared: '資料共有',
    textShared: '抽出テキスト共有',
    serverStorageAllowed: '相手サーバー保存',
    commitmentsOnly: 'Commitmentのみ',
  },
};

function readInitialLanguage() {
  if (typeof window === 'undefined') return 'en';
  return normalizeAppLanguage(window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY) || navigator.language || 'en');
}

function copyFor(language: string) {
  return COPY[normalizeAppLanguage(language)];
}

const DEFAULT_TEXT_LAYER = [
  'Utility notice',
  'Recipient verified locally',
  'Postal code 94105',
  'San Francisco, CA',
].join('\n');

function statusTone(status: string) {
  if (status === 'ready') return 'good';
  if (status === 'rejected' || status === 'blocked') return 'bad';
  return 'warn';
}

function flowTone(status: string) {
  if (status === 'complete') return 'good';
  if (status === 'blocked') return 'bad';
  return 'warn';
}

function buildProofText(proof: AddressEvidenceVaultPresentation) {
  return JSON.stringify(proof, null, 2);
}

export function EvidenceVaultScreen() {
  const [language, setLanguage] = React.useState(readInitialLanguage);
  const [textLayer, setTextLayer] = React.useState(DEFAULT_TEXT_LAYER);
  const [fileName, setFileName] = React.useState('local-utility-notice.pdf');
  const [mimeType, setMimeType] = React.useState('application/pdf');
  const [sizeBytes, setSizeBytes] = React.useState(84_000);
  const [purpose, setPurpose] = React.useState('identity:address-evidence');
  const [highRiskMode, setHighRiskMode] = React.useState(true);
  const t = React.useMemo(() => copyFor(language), [language]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, normalizeAppLanguage(language));
      document.documentElement.lang = normalizeAppLanguage(language) === 'ja' ? 'ja-JP' : 'en';
      document.documentElement.dir = getLanguageDirection(language);
    }
  }, [language]);

  const record: AddressEvidenceVaultRecord = React.useMemo(() => buildAddressEvidenceVaultRecord({
    document: {
      fileName,
      mimeType,
      text: textLayer,
      sizeBytes,
      encryptedBlobRef: `local-vault://session/${fileName.replace(/[^a-z0-9.]+/gi, '-').toLowerCase() || 'document'}`,
      sourceKind: mimeType.includes('pdf') ? 'pdf' : mimeType.startsWith('image/') ? 'photo' : 'text',
    },
    purpose,
    highRiskMode,
    allowExternalProcessing: false,
    requestAiLearning: false,
    createdAt: '2026-06-20T00:00:00.000Z',
    expiresAt: '2026-06-20T00:10:00.000Z',
  }), [fileName, highRiskMode, mimeType, purpose, sizeBytes, textLayer]);
  const publicProjection = React.useMemo(() => redactAddressEvidenceVaultRecord(record), [record]);
  const presentation = React.useMemo(() => buildAddressEvidenceVaultPresentation({
    record,
    claim: 'holder-controls-evidence',
    audienceRef: 'verifier:counterparty-session-ref',
    verifierChallengeRef: 'challenge:short-lived-ref',
    holderCredentialRef: 'credential-ref:aoid-holder-local',
    passkeyAssertionRef: 'passkey-ref:device-local-assertion',
    createdAt: '2026-06-20T00:00:00.000Z',
    expiresAt: '2026-06-20T00:10:00.000Z',
  }), [record]);
  const redactionReview = React.useMemo(() => reviewAddressEvidenceRedaction(
    record,
    '2026-06-20T00:00:00.000Z',
  ), [record]);
  const vaultFlow = React.useMemo(() => buildAddressEvidenceVaultFlow(
    record,
    presentation,
    redactionReview,
  ), [presentation, record, redactionReview]);

  const handleFile = React.useCallback(async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setMimeType(file.type || 'application/octet-stream');
    setSizeBytes(file.size);
    if (file.type.startsWith('text/') || file.name.match(/\.(txt|csv|json|md)$/i) || file.type.includes('pdf')) {
      const buffer = await file.arrayBuffer();
      setTextLayer(extractPrintableTextFromBinary(buffer));
    } else {
      setTextLayer('');
    }
  }, []);

  const copyProof = React.useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(buildProofText(presentation));
    }
  }, [presentation]);

  const clearLocalDraft = React.useCallback(() => {
    setTextLayer('');
    setFileName('local-document');
    setMimeType('application/octet-stream');
    setSizeBytes(0);
  }, []);

  return (
    <main className="agid-page-scroll bg-[#f6f8fb] text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { window.location.href = '/'; }}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
              aria-label={t.returnToMap}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-600">AGID Evidence Vault</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Evidence Vault</h1>
              <p className="mt-1 max-w-3xl text-sm font-semibold text-slate-500">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="evidence-language">{t.language}</label>
            <select
              id="evidence-language"
              value={normalizeAppLanguage(language)}
              onChange={(event) => setLanguage(normalizeAppLanguage(event.target.value))}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm"
            >
              {APP_LANGUAGES.map(option => (
                <option key={option.code} value={option.code}>{option.flag} {option.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={copyProof}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-black text-white shadow-sm hover:bg-blue-700"
            >
              <Copy className="h-4 w-4" />
              {t.copyProof}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-5">
            <Metric label={t.status} value={record.status} tone={statusTone(record.status)} />
            <Metric label={t.confidence} value={formatPublicConfidenceBand(record.extraction.confidence, language)} tone={record.extraction.confidence >= 0.7 ? 'good' : 'warn'} />
            <Metric label={t.redactionReview} value={redactionReview.status} tone={statusTone(redactionReview.status)} />
            <Metric label={t.proofReady} value={redactionReview.proofReady ? t.proofReady : t.notReady} tone={redactionReview.proofReady ? 'good' : 'warn'} />
            <Metric label={t.presentation} value={presentation.status} tone={statusTone(presentation.status)} />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-black text-slate-950">{t.vaultFlow}</h2>
                </div>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">{t.vaultFlowBody}</p>
              </div>
              <span className={cn(
                'inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-black uppercase tracking-[0.12em]',
                redactionReview.proofReady ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700',
              )}>
                {redactionReview.proofReady ? t.proofReady : t.notReady}
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {vaultFlow.map((step, index) => (
                <article
                  key={step.id}
                  className={cn(
                    'rounded-2xl border p-4',
                    flowTone(step.status) === 'good' && 'border-emerald-200 bg-emerald-50',
                    flowTone(step.status) === 'warn' && 'border-amber-200 bg-amber-50',
                    flowTone(step.status) === 'bad' && 'border-rose-200 bg-rose-50',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Step {index + 1}</p>
                      <h3 className="mt-1 text-sm font-black text-slate-950">{step.label}</h3>
                    </div>
                    {step.status === 'complete' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                  <p className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-slate-600">{step.status}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{step.nextAction}</p>
                  <div className="mt-3 grid gap-1">
                    {step.evidenceRefs.slice(0, 3).map(ref => (
                      <span key={ref} className="break-all font-mono text-[10px] font-bold text-slate-500">{ref}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-black text-slate-950">{t.upload}</h2>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                <LockKeyhole className="h-3.5 w-3.5" />
                {t.fileStaysLocal}
              </span>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
              <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 text-center hover:border-blue-300 hover:bg-blue-50">
                <FileText className="h-8 w-8 text-slate-500" />
                <span className="mt-3 text-sm font-black text-slate-700">{t.upload}</span>
                <span className="mt-1 text-xs font-semibold text-slate-400">PDF / JPG / PNG / TXT</span>
                <input
                  className="sr-only"
                  type="file"
                  accept=".pdf,image/*,text/*,.txt,.csv,.md,.json"
                  onChange={(event) => { void handleFile(event.target.files?.[0]); }}
                />
              </label>
              <div className="grid gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <LabelledInput label={t.purpose} value={purpose} onChange={setPurpose} />
                  <ReadonlyInfo label="File commitment" value={record.file.fileNameCommitment} />
                </div>
                <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <input
                    type="checkbox"
                    checked={highRiskMode}
                    onChange={(event) => setHighRiskMode(event.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    <span className="block text-sm font-black text-amber-900">{t.highRisk}</span>
                    <span className="mt-1 block text-sm font-semibold leading-6 text-amber-800">{t.highRiskBody}</span>
                  </span>
                </label>
              </div>
            </div>
            <label className="mt-4 block">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t.localTextLayer}</span>
              <textarea
                value={textLayer}
                onChange={(event) => setTextLayer(event.target.value)}
                placeholder={t.sampleText}
                className="mt-2 min-h-36 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-800 outline-none focus:border-blue-400 focus:bg-white"
              />
            </label>
            <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">{t.ocrNote}</p>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Panel title={t.redactedProjection} icon={EyeOff}>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <ReadonlyInfo label={t.storage} value={record.storageMode} />
                  <ReadonlyInfo label={t.processing} value={record.processingMode} />
                  <ReadonlyInfo label="Evidence commitment" value={publicProjection.evidenceCommitment} />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t.reviewSummary}</p>
                    <span className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-black uppercase',
                      redactionReview.status === 'passed' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                      redactionReview.status === 'needs-review' && 'border-amber-200 bg-amber-50 text-amber-700',
                      redactionReview.status === 'blocked' && 'border-rose-200 bg-rose-50 text-rose-700',
                    )}>
                      {redactionReview.status}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <ReadonlyInfo label={t.hiddenFields} value={String(redactionReview.hiddenFields.length)} />
                    <ReadonlyInfo label={t.commitmentCount} value={String(redactionReview.commitmentCount)} />
                    <ReadonlyInfo label={t.documentShared} value={String(redactionReview.documentSharedWithVerifier)} />
                    <ReadonlyInfo label={t.textShared} value={String(redactionReview.extractedTextSharedWithVerifier)} />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t.fieldsDetected}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {publicProjection.fieldsDetected.map(field => (
                      <span key={field} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">{field}</span>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  {publicProjection.redactedCandidates.map(candidate => (
                    <div key={`${candidate.field}-${candidate.valueCommitment}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-black text-slate-800">{candidate.field}</span>
                        <span className="text-xs font-black text-slate-500">{formatPublicConfidenceBand(candidate.confidence, language)}</span>
                      </div>
                      <p className="mt-1 font-mono text-xs font-bold text-slate-500">{candidate.redactedPreview}</p>
                      <p className="mt-1 font-mono text-[11px] font-bold text-slate-400">{candidate.valueCommitment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title={t.proofEnvelope} icon={Fingerprint}>
              <div className="grid gap-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="h-5 w-5" />
                    <p className="text-sm font-black">{t.verifierReceives}</p>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-emerald-700">{t.privacyBody}</p>
                </div>
                <ReadonlyInfo label="Presentation ID" value={presentation.presentationId} />
                <ReadonlyInfo label={t.holderBinding} value={presentation.holderBindingRefs.holderCredentialRef ?? 'credential-ref-required'} />
                <ReadonlyInfo label="Challenge commitment" value={presentation.verifierChallengeCommitment} />
                <ReadonlyInfo label="Verifier server storage allowed" value={String(presentation.proofEnvelope.verifierServerStorageAllowed)} />
                <ReadonlyInfo label="Commitments only" value={String(presentation.proofEnvelope.verifierReceivesCommitmentsOnly)} />
                <ReadonlyInfo label={t.expires} value={presentation.expiresAt} />
                <pre className="max-h-72 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs font-semibold leading-5 text-slate-100">
                  {buildProofText(presentation)}
                </pre>
              </div>
            </Panel>
          </section>
        </section>

        <aside className="grid gap-4 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h2 className="text-sm font-black text-slate-950">{t.privacyBoundary}</h2>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{t.privacyBody}</p>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t.requiredControls}</p>
            <div className="mt-3 grid gap-2">
              {record.requiredControls.map(control => (
                <span key={control} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">{control}</span>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t.warnings}</p>
            <div className="mt-3 grid gap-2">
              {[...record.warnings, ...presentation.warnings].length ? [...record.warnings, ...presentation.warnings].map(warning => (
                <span key={warning} className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {warning}
                </span>
              )) : (
                <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">No active warnings</span>
              )}
            </div>
          </section>
          <button
            type="button"
            onClick={clearLocalDraft}
            className="h-11 rounded-xl border border-slate-300 bg-white text-sm font-black text-slate-700 shadow-sm hover:border-rose-300 hover:text-rose-700"
          >
            {t.clearLocal}
          </button>
        </aside>
      </div>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: 'good' | 'warn' | 'bad' }) {
  return (
    <div className={cn(
      'rounded-2xl border bg-white p-4 shadow-sm',
      tone === 'good' && 'border-emerald-200',
      tone === 'warn' && 'border-amber-200',
      tone === 'bad' && 'border-rose-200',
    )}>
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function LabelledInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-400 focus:bg-white"
      />
    </label>
  );
}

function ReadonlyInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 break-all font-mono text-xs font-black text-slate-700">{value}</p>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}

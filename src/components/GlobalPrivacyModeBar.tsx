import {
  AlertTriangle,
  ChevronDown,
  Lock,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import React from 'react';

import {
  buildGlobalPrivacyModeSummary,
  type GlobalPrivacyModeInput,
  type GlobalPrivacyModeSummary,
} from '../lib/globalPrivacyMode';
import { cn } from '../lib/utils';

type GlobalPrivacyModeBarLanguage = 'en' | 'ja';

interface GlobalPrivacyModeBarProps extends Omit<GlobalPrivacyModeInput, 'online'> {
  appLanguage?: string;
}

function normalizeLanguage(language?: string): GlobalPrivacyModeBarLanguage {
  return language?.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

function copyFor(summary: GlobalPrivacyModeSummary, language: GlobalPrivacyModeBarLanguage) {
  if (language === 'ja') {
    return {
      aria: 'グローバルプライバシーと動作モード',
      localFirst: 'Local-first',
      noRaw: '住所平文なし',
      zkEthereum: 'ZK / Ethereum 任意',
      online: summary.networkLabel === 'online' ? 'オンライン' : 'オフライン可',
      qr: summary.qrExposure === 'minimal-public-reference' ? '公開QR最小' : 'フルQR注意',
      risk: summary.riskLevel === 'high-risk' ? '高リスク保護' : summary.riskLevel === 'elevated' ? '現場運用' : '標準',
      details: '詳細',
      privacyDefault: '既定では住所本文・AOID本文を外部へ出しません。',
      optionalRails: 'Registry / ZK / Ethereum は任意の検証レイヤーです。',
      qrPolicy: summary.qrExposure === 'minimal-public-reference'
        ? 'QRは公開参照向けの最小payloadです。'
        : 'QRは詳細payloadです。共有先と用途を確認してください。',
      activeContexts: summary.activeContextLabels.length > 0 ? summary.activeContextLabels.join(' / ') : 'なし',
      warningsTitle: '注意',
    };
  }

  return {
    aria: 'Global privacy and runtime mode',
    localFirst: 'Local-first',
    noRaw: 'No raw address',
    zkEthereum: 'ZK / Ethereum optional',
    online: summary.networkLabel === 'online' ? 'Online' : 'Offline-ready',
    qr: summary.qrExposure === 'minimal-public-reference' ? 'Public QR minimal' : 'Full QR warning',
    risk: summary.riskLevel === 'high-risk' ? 'High-risk safe' : summary.riskLevel === 'elevated' ? 'Field mode' : 'Standard',
    details: 'Details',
    privacyDefault: 'Raw address and AOID bodies are not exposed by default.',
    optionalRails: 'Registry, ZK, and Ethereum remain optional verification rails.',
    qrPolicy: summary.qrExposure === 'minimal-public-reference'
      ? 'QR payload is minimized for public reference sharing.'
      : 'QR uses a detailed payload. Confirm recipient and purpose before sharing.',
    activeContexts: summary.activeContextLabels.length > 0 ? summary.activeContextLabels.join(' / ') : 'None',
    warningsTitle: 'Warnings',
  };
}

function useOnlineStatus() {
  const [online, setOnline] = React.useState(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });

  React.useEffect(() => {
    const updateOnline = () => setOnline(true);
    const updateOffline = () => setOnline(false);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOffline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOffline);
    };
  }, []);

  return online;
}

export function GlobalPrivacyModeBar({
  appLanguage,
  ...modeInput
}: GlobalPrivacyModeBarProps) {
  const [expanded, setExpanded] = React.useState(false);
  const online = useOnlineStatus();
  const summary = React.useMemo(
    () => buildGlobalPrivacyModeSummary({ ...modeInput, online }),
    [modeInput, online],
  );
  const language = normalizeLanguage(appLanguage);
  const copy = copyFor(summary, language);
  const hasWarnings = summary.warnings.length > 0;

  return (
    <aside className="global-privacy-mode-bar pointer-events-auto" aria-label={copy.aria}>
      <button
        type="button"
        className={cn(
          'global-privacy-mode-trigger',
          summary.riskLevel === 'high-risk' && 'global-privacy-mode-trigger--risk',
          hasWarnings && 'global-privacy-mode-trigger--warning',
        )}
        onClick={() => setExpanded(current => !current)}
        aria-expanded={expanded}
      >
        <span className="global-privacy-mode-icon" aria-hidden="true">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <span className="global-privacy-mode-main">
          <span className="global-privacy-mode-eyebrow">{summary.modeCode}</span>
          <span className="global-privacy-mode-title">{summary.modeLabel}</span>
        </span>
        <span className="global-privacy-mode-chip global-privacy-mode-chip--strong">
          <Lock className="h-3 w-3" aria-hidden="true" />
          {copy.noRaw}
        </span>
        <span className="global-privacy-mode-chip">
          {online ? <Wifi className="h-3 w-3" aria-hidden="true" /> : <WifiOff className="h-3 w-3" aria-hidden="true" />}
          {copy.online}
        </span>
        {hasWarnings && (
          <span className="global-privacy-mode-alert" title={copy.warningsTitle} aria-label={copy.warningsTitle}>
            <AlertTriangle className="h-3.5 w-3.5" />
          </span>
        )}
        <ChevronDown className={cn('global-privacy-mode-chevron', expanded && 'rotate-180')} aria-hidden="true" />
      </button>

      {expanded && (
        <div className="global-privacy-mode-panel" role="region" aria-label={copy.details}>
          <dl className="global-privacy-mode-grid">
            <div>
              <dt>{copy.localFirst}</dt>
              <dd>{copy.privacyDefault}</dd>
            </div>
            <div>
              <dt>{copy.zkEthereum}</dt>
              <dd>{copy.optionalRails}</dd>
            </div>
            <div>
              <dt>{copy.qr}</dt>
              <dd>{copy.qrPolicy}</dd>
            </div>
            <div>
              <dt>{copy.risk}</dt>
              <dd>{copy.activeContexts}</dd>
            </div>
          </dl>
          {hasWarnings && (
            <ul className="global-privacy-mode-warnings" aria-label={copy.warningsTitle}>
              {summary.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
}

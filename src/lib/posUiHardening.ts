export const POS_UI_HARDENING_VERSION = 'pos-ui-hardening-v1';

export type PosUiHardeningPriority = 'P0' | 'P1' | 'P2';

export type PosUiSurface =
  | 'scan-console'
  | 'decision-banner'
  | 'handoff-board'
  | 'trust-strip'
  | 'review-queue'
  | 'device-diagnostics'
  | 'offline-queue'
  | 'settings-policy'
  | 'audit-report'
  | 'receipt-printing';

export type PosUiDecisionState =
  | 'idle'
  | 'scanning'
  | 'address-ok'
  | 'carrier-scan-ok'
  | 'recipient-pending'
  | 'handoff-complete'
  | 'requires-review'
  | 'rejected'
  | 'offline-deferred';

export type PosUiHardeningMeasure = {
  id: string;
  priority: PosUiHardeningPriority;
  surface: PosUiSurface;
  title: string;
  goal: string;
  rules: string[];
  primaryActions: string[];
  successMetric: string;
};

export type PosUiStateContract = {
  state: PosUiDecisionState;
  label: string;
  surfaceOrder: PosUiSurface[];
  primaryAction: string;
  secondaryActions: string[];
  disabledActions: string[];
  colorRole: 'neutral' | 'active' | 'success' | 'warning' | 'danger';
};

export type PosUiHardeningPlan = {
  version: typeof POS_UI_HARDENING_VERSION;
  principle: string;
  measures: PosUiHardeningMeasure[];
  stateContracts: PosUiStateContract[];
  operatorSpeedRules: string[];
  privacyRules: string[];
};

export type EvaluatePosUiHardeningInput = {
  state: PosUiDecisionState;
  registryFresh: boolean;
  highRiskMode: boolean;
  rawAddressVisible: boolean;
  warningHidden: boolean;
  languageConfigured: boolean;
  primaryActionCount: number;
  deviceIssues: number;
  reviewCases: number;
  offlineQueueSize: number;
  activeSecureKeys: number;
  operatorHasOverride: boolean;
};

export type PosUiHardeningEvaluation = {
  valid: boolean;
  grade: 'ready' | 'attention' | 'blocked';
  score: number;
  visibleSurfaces: PosUiSurface[];
  nextPrimaryAction: string;
  blockers: string[];
  warnings: string[];
};

export const POS_UI_HARDENING_MEASURES: PosUiHardeningMeasure[] = [
  {
    id: 'p0-decision-banner',
    priority: 'P0',
    surface: 'decision-banner',
    title: 'Make the current decision impossible to miss',
    goal: 'The operator should know whether to release, review, reject, or wait without reading dense panels.',
    rules: [
      'Use one dominant decision banner above detailed evidence.',
      'Rejected and blocked states suppress release-oriented controls.',
      'Review states show the reason and the next supervised action.',
    ],
    primaryActions: ['Release', 'Open review', 'Reject', 'Rescan'],
    successMetric: 'Operator can identify release state in under 2 seconds.',
  },
  {
    id: 'p0-four-stage-handoff',
    priority: 'P0',
    surface: 'handoff-board',
    title: 'Use a four-stage handoff board',
    goal: 'Waybill workflows should advance through explicit proof states instead of hidden receipt details.',
    rules: [
      'Show Address OK, Carrier Scan OK, Recipient Pending, and Handoff Complete as fixed stages.',
      'Do not mark Handoff Complete until both carrier and recipient evidence are present.',
      'Use stage-level timestamps and signed-receipt indicators.',
    ],
    primaryActions: ['Request recipient proof', 'Complete handoff'],
    successMetric: 'No operator has to infer proof level from raw receipt fields.',
  },
  {
    id: 'p0-warning-visibility',
    priority: 'P0',
    surface: 'decision-banner',
    title: 'Never hide blocking warnings',
    goal: 'Address defects, stale registry, replay, and high-risk policy failures must be visible before release.',
    rules: [
      'Top warning appears beside the primary action.',
      'Rejected reasons are not hidden in collapsible panels.',
      'Warnings stay visible after language switching.',
    ],
    primaryActions: ['Open reason', 'Resolve issue'],
    successMetric: 'No release path exists when a blocking warning is hidden.',
  },
  {
    id: 'p0-high-risk-privacy',
    priority: 'P0',
    surface: 'trust-strip',
    title: 'High-risk mode is a privacy state, not a label',
    goal: 'DV, evacuation, refugee, and humanitarian handoff should force safer UI and data exposure defaults.',
    rules: [
      'Use AGID-S-only display for high-risk handoff.',
      'Do not show raw address, raw AGID, raw AOID, phone, recipient name, or proof code.',
      'Show expiry, revocation, and used-state controls before completion.',
    ],
    primaryActions: ['Verify encrypted handoff', 'Mark used'],
    successMetric: 'High-risk mode blocks raw address display and long-lived QR reuse.',
  },
  {
    id: 'p1-scan-intake-speed',
    priority: 'P1',
    surface: 'scan-console',
    title: 'Make scan intake equally fast for QR, NFC, barcode, and manual fallback',
    goal: 'Busy staff should not hunt for the right intake mode.',
    rules: [
      'Keep QR, NFC, barcode, and manual input in one scan console.',
      'Auto-focus the active input after failed scans.',
      'Keep scan controls stable in size across languages.',
    ],
    primaryActions: ['Scan', 'Paste payload', 'Manual entry'],
    successMetric: 'Common intake path can start with one click or one hardware scan.',
  },
  {
    id: 'p1-trust-state-strip',
    priority: 'P1',
    surface: 'trust-strip',
    title: 'Keep registry, issuer, freshness, key, and offline state in one strip',
    goal: 'Trust state should be visible without opening settings.',
    rules: [
      'Show registry freshness, issuer status, active AGID-S key count, and queue status together.',
      'Use short operational words: Fresh, Stale, Offline, Deferred, Revoked.',
      'Provide one-click refresh or sync from stale/deferred states.',
    ],
    primaryActions: ['Refresh registry', 'Sync queue'],
    successMetric: 'Trust state can be checked from the main POS screen before release.',
  },
  {
    id: 'p1-review-queue',
    priority: 'P1',
    surface: 'review-queue',
    title: 'Separate normal scanning from exception handling',
    goal: 'Rejected and review cases need a supervised lane with reasons, evidence, and audit export.',
    rules: [
      'Review queue lists reason, severity, receipt id, and required operator action.',
      'Supervisor override is a distinct action with audit receipt.',
      'Reject and review are not styled like normal history.',
    ],
    primaryActions: ['Open review case', 'Export audit'],
    successMetric: 'Every review/reject case has one owner action and one audit trail.',
  },
  {
    id: 'p1-device-diagnostics',
    priority: 'P1',
    surface: 'device-diagnostics',
    title: 'Treat devices as operational prerequisites',
    goal: 'Printer, drawer, barcode reader, NFC reader, and measuring instrument readiness should be solved before rush periods.',
    rules: [
      'Show device status in management and settings.',
      'Do not require broken devices for privacy-critical handoff.',
      'Expose manual fallback when hardware is not available.',
    ],
    primaryActions: ['Run diagnostics', 'Pair device'],
    successMetric: 'Device issues route to diagnostics before they slow handoff.',
  },
  {
    id: 'p1-settings-policy',
    priority: 'P1',
    surface: 'settings-policy',
    title: 'Move mode, language, role, and policy into one Settings and Policy Center',
    goal: 'Operators and admins should not configure language, proof mode, device policy, and high-risk policy in scattered panels.',
    rules: [
      'One POS language setting controls header, side menu, main panels, alerts, and reports.',
      'Mode 0-4 policy is visible but does not force Ethereum or ZK for local operation.',
      'Staff role changes show permission impact before saving.',
    ],
    primaryActions: ['Save settings', 'Test policy'],
    successMetric: 'A new terminal can be configured without visiting hidden developer screens.',
  },
  {
    id: 'p2-reconciliation-report',
    priority: 'P2',
    surface: 'audit-report',
    title: 'Make post-handoff reports printable, exportable, and privacy-safe',
    goal: 'The audit report should explain why a handoff was accepted without leaking raw address material.',
    rules: [
      'Report includes waybill alias, carrier receipt, recipient proof receipt, freshness result, terminal signature, and decision reasons.',
      'Print output redacts raw address, raw AGID/AOID, proof code, and recipient private data.',
      'Offline reports are marked deferred until sync completes.',
    ],
    primaryActions: ['Print report', 'Export JSON'],
    successMetric: 'A supervisor can re-check handoff without accessing private address payloads.',
  },
];

export const POS_UI_STATE_CONTRACTS: PosUiStateContract[] = [
  {
    state: 'idle',
    label: 'Ready to scan',
    surfaceOrder: ['scan-console', 'trust-strip', 'device-diagnostics'],
    primaryAction: 'Scan QR/NFC',
    secondaryActions: ['Manual entry', 'Run diagnostics'],
    disabledActions: ['Complete handoff'],
    colorRole: 'neutral',
  },
  {
    state: 'scanning',
    label: 'Reading payload',
    surfaceOrder: ['scan-console', 'trust-strip'],
    primaryAction: 'Cancel scan',
    secondaryActions: ['Manual fallback'],
    disabledActions: ['Release', 'Complete handoff'],
    colorRole: 'active',
  },
  {
    state: 'address-ok',
    label: 'Address OK',
    surfaceOrder: ['decision-banner', 'handoff-board', 'trust-strip', 'receipt-printing'],
    primaryAction: 'Request carrier scan',
    secondaryActions: ['Print redacted receipt', 'Open audit'],
    disabledActions: ['Complete handoff'],
    colorRole: 'success',
  },
  {
    state: 'carrier-scan-ok',
    label: 'Carrier Scan OK',
    surfaceOrder: ['handoff-board', 'decision-banner', 'trust-strip'],
    primaryAction: 'Request recipient proof',
    secondaryActions: ['Open carrier receipt', 'Reject release'],
    disabledActions: ['Complete handoff'],
    colorRole: 'active',
  },
  {
    state: 'recipient-pending',
    label: 'Recipient Pending',
    surfaceOrder: ['handoff-board', 'decision-banner', 'trust-strip'],
    primaryAction: 'Verify recipient proof',
    secondaryActions: ['Resend challenge', 'Reject release'],
    disabledActions: ['Print completion report'],
    colorRole: 'warning',
  },
  {
    state: 'handoff-complete',
    label: 'Handoff Complete',
    surfaceOrder: ['decision-banner', 'audit-report', 'receipt-printing', 'trust-strip'],
    primaryAction: 'Print report',
    secondaryActions: ['Export JSON', 'Start next scan'],
    disabledActions: ['Reject release'],
    colorRole: 'success',
  },
  {
    state: 'requires-review',
    label: 'Requires Review',
    surfaceOrder: ['decision-banner', 'review-queue', 'audit-report', 'trust-strip'],
    primaryAction: 'Open review case',
    secondaryActions: ['Rescan', 'Reject release'],
    disabledActions: ['Complete handoff'],
    colorRole: 'warning',
  },
  {
    state: 'rejected',
    label: 'Rejected',
    surfaceOrder: ['decision-banner', 'review-queue', 'audit-report'],
    primaryAction: 'Rescan or escalate',
    secondaryActions: ['Export audit', 'Start new scan'],
    disabledActions: ['Release', 'Complete handoff', 'Open drawer'],
    colorRole: 'danger',
  },
  {
    state: 'offline-deferred',
    label: 'Offline Deferred',
    surfaceOrder: ['decision-banner', 'offline-queue', 'trust-strip', 'audit-report'],
    primaryAction: 'Sync queue',
    secondaryActions: ['Continue offline', 'Export local report'],
    disabledActions: ['Clear local receipts'],
    colorRole: 'warning',
  },
];

export const POS_UI_OPERATOR_SPEED_RULES = [
  'Exactly one primary action should be visually dominant for every active POS state.',
  'The decision banner, handoff board, and trust strip should be visible without scrolling on tablet and desktop.',
  'Scan controls must keep stable button dimensions across languages.',
  'Review, rejected, and offline-deferred states should route to a named workspace instead of a generic alert.',
];

export const POS_UI_PRIVACY_RULES = [
  'Do not show raw address, raw AGID, raw AOID, phone number, recipient name, or proof code in normal POS chrome.',
  'Use commitments, tails, aliases, receipt ids, and signed status labels in audit views.',
  'High-risk mode must prefer AGID-S-only display, short expiry, immediate used-state marking, and no address-history retention.',
  'Print and export surfaces must be redacted by default.',
];

function uniqueSurfaces(surfaces: PosUiSurface[]) {
  return Array.from(new Set(surfaces));
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getPosUiStateContract(state: PosUiDecisionState): PosUiStateContract {
  return POS_UI_STATE_CONTRACTS.find(contract => contract.state === state)
    ?? POS_UI_STATE_CONTRACTS[0];
}

export function getPosUiHardeningPlan(): PosUiHardeningPlan {
  return {
    version: POS_UI_HARDENING_VERSION,
    principle: 'POS UI must make scan-to-decision state, trust posture, handoff progress, exceptions, and privacy boundaries visible before an operator releases a package.',
    measures: POS_UI_HARDENING_MEASURES.map(measure => ({
      ...measure,
      rules: [...measure.rules],
      primaryActions: [...measure.primaryActions],
    })),
    stateContracts: POS_UI_STATE_CONTRACTS.map(contract => ({
      ...contract,
      surfaceOrder: [...contract.surfaceOrder],
      secondaryActions: [...contract.secondaryActions],
      disabledActions: [...contract.disabledActions],
    })),
    operatorSpeedRules: [...POS_UI_OPERATOR_SPEED_RULES],
    privacyRules: [...POS_UI_PRIVACY_RULES],
  };
}

export function evaluatePosUiHardening(
  input: EvaluatePosUiHardeningInput,
): PosUiHardeningEvaluation {
  const contract = getPosUiStateContract(input.state);
  const blockers: string[] = [];
  const warnings: string[] = [];
  const extraSurfaces: PosUiSurface[] = [];

  if (input.state === 'rejected') blockers.push('rejected-state-must-not-release');
  if (input.warningHidden) blockers.push('blocking-warning-hidden');
  if (input.highRiskMode && input.rawAddressVisible) blockers.push('high-risk-raw-address-visible');
  if (input.state === 'requires-review' && !input.operatorHasOverride) {
    warnings.push('review-case-needs-supervisor');
    extraSurfaces.push('review-queue');
  }

  if (input.primaryActionCount !== 1) warnings.push(`primary-action-count:${input.primaryActionCount}`);
  if (!input.registryFresh) {
    warnings.push('registry-freshness-not-visible-or-stale');
    extraSurfaces.push('trust-strip');
  }
  if (!input.languageConfigured) {
    warnings.push('pos-language-not-configured');
    extraSurfaces.push('settings-policy');
  }
  if (input.deviceIssues > 0) {
    warnings.push(`device-issues:${input.deviceIssues}`);
    extraSurfaces.push('device-diagnostics');
  }
  if (input.reviewCases > 0) {
    warnings.push(`open-review-cases:${input.reviewCases}`);
    extraSurfaces.push('review-queue');
  }
  if (input.offlineQueueSize > 0) {
    warnings.push(`offline-queue:${input.offlineQueueSize}`);
    extraSurfaces.push('offline-queue');
  }
  if (input.activeSecureKeys === 0) {
    warnings.push('no-active-agid-s-key');
    extraSurfaces.push('settings-policy');
  }

  const grade: PosUiHardeningEvaluation['grade'] = blockers.length > 0
    ? 'blocked'
    : warnings.length > 0
      ? 'attention'
      : 'ready';
  const score = clampScore(100 - blockers.length * 30 - warnings.length * 7);

  return {
    valid: blockers.length === 0,
    grade,
    score,
    visibleSurfaces: uniqueSurfaces([...contract.surfaceOrder, ...extraSurfaces]),
    nextPrimaryAction: contract.primaryAction,
    blockers,
    warnings,
  };
}

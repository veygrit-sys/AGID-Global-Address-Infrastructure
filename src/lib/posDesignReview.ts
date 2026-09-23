import type {
  PosAcceptanceReceipt,
  PosAcceptanceStatus,
} from './posAcceptance';
import type {
  PosDeviceDiagnostic,
  PosHandoffReverificationReport,
  PosManagementSnapshot,
} from './posOperationalControls';

export type PosDesignReviewPriority = 'P0' | 'P1' | 'P2' | 'P3';

export type PosDesignReviewFocus =
  | 'decision-clarity'
  | 'trust-state'
  | 'operator-speed'
  | 'handoff-flow'
  | 'privacy-safety'
  | 'settings-readiness';

export type PosDesignReviewWorkspace =
  | 'admin'
  | 'scan'
  | 'decision'
  | 'staff'
  | 'devices'
  | 'audit'
  | 'report'
  | 'registry'
  | 'keys'
  | 'queue'
  | 'settings'
  | 'design';

export type PosDesignReviewItem = {
  id: string;
  priority: PosDesignReviewPriority;
  focus: PosDesignReviewFocus;
  title: string;
  weakness: string;
  evidence: string;
  action: string;
  workspace: PosDesignReviewWorkspace;
};

export type PosDesignReviewSummary = {
  score: number;
  grade: 'ready' | 'attention' | 'blocked';
  headline: string;
  highestPriority: PosDesignReviewPriority;
  generatedAt: string;
  counts: Record<PosDesignReviewPriority, number>;
  focusCounts: Record<PosDesignReviewFocus, number>;
  items: PosDesignReviewItem[];
};

export type PosDesignReviewPreview = {
  status: PosAcceptanceStatus;
  errors?: string[];
  warnings?: string[];
};

export type BuildPosDesignReviewInput = {
  generatedAt?: string;
  terminalId?: string;
  operatorId?: string;
  latestReceipt: PosAcceptanceReceipt | null;
  preview?: PosDesignReviewPreview | null;
  management: PosManagementSnapshot;
  handoffReport: PosHandoffReverificationReport;
  registryFresh: boolean;
  diagnostics: PosDeviceDiagnostic[];
  activeSecureKeys: number;
  totalSecureKeys: number;
  syncState: 'idle' | 'loading' | 'error';
};

const PRIORITY_WEIGHT: Record<PosDesignReviewPriority, number> = {
  P0: 30,
  P1: 18,
  P2: 9,
  P3: 2,
};

const PRIORITY_ORDER: Record<PosDesignReviewPriority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
};

const EMPTY_COUNTS: Record<PosDesignReviewPriority, number> = {
  P0: 0,
  P1: 0,
  P2: 0,
  P3: 0,
};

const EMPTY_FOCUS_COUNTS: Record<PosDesignReviewFocus, number> = {
  'decision-clarity': 0,
  'trust-state': 0,
  'operator-speed': 0,
  'handoff-flow': 0,
  'privacy-safety': 0,
  'settings-readiness': 0,
};

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function stableShortId(seed: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(6, '0').slice(-6);
}

function itemId(seed: string) {
  return `PDR-${stableShortId(seed)}`;
}

function countByPriority(items: PosDesignReviewItem[]) {
  const counts = { ...EMPTY_COUNTS };
  for (const item of items) counts[item.priority] += 1;
  return counts;
}

function countByFocus(items: PosDesignReviewItem[]) {
  const counts = { ...EMPTY_FOCUS_COUNTS };
  for (const item of items) counts[item.focus] += 1;
  return counts;
}

function highestPriority(items: PosDesignReviewItem[]): PosDesignReviewPriority {
  return items.reduce<PosDesignReviewPriority>(
    (current, item) => (
      PRIORITY_ORDER[item.priority] < PRIORITY_ORDER[current] ? item.priority : current
    ),
    'P3',
  );
}

function reviewScore(items: PosDesignReviewItem[]) {
  const penalty = items.reduce((total, item) => total + PRIORITY_WEIGHT[item.priority], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

function reviewHeadline(
  grade: PosDesignReviewSummary['grade'],
  counts: Record<PosDesignReviewPriority, number>,
) {
  if (grade === 'blocked') {
    return `${counts.P0} release-blocking design issue(s) must be made unmistakable before handoff.`;
  }
  if (grade === 'attention') {
    return `${counts.P1 + counts.P2} improvement item(s) should be prioritized for operator speed and trust clarity.`;
  }
  return 'POS design posture is usable; keep continuous review visible for future regressions.';
}

function pushUnique(items: PosDesignReviewItem[], item: Omit<PosDesignReviewItem, 'id'>) {
  const seed = `${item.priority}|${item.focus}|${item.workspace}|${item.title}`;
  const next = { ...item, id: itemId(seed) };
  if (!items.some(existing => existing.id === next.id)) items.push(next);
}

export function buildPosDesignReview(input: BuildPosDesignReviewInput): PosDesignReviewSummary {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const items: PosDesignReviewItem[] = [];
  const currentStatus = input.latestReceipt?.status ?? input.preview?.status;
  const previewIssueCount = (input.preview?.errors?.length ?? 0) + (input.preview?.warnings?.length ?? 0);
  const deviceAttention = input.diagnostics.filter(device => device.status !== 'ready');
  const managementCritical = input.management.risks.filter(risk => risk.severity === 'critical').length;
  const managementWarning = input.management.risks.filter(risk => risk.severity === 'warning').length;
  const highRiskSafety = input.handoffReport.evidenceSummary.highRiskSafety;

  if (currentStatus === 'rejected' || input.handoffReport.status === 'blocked' || managementCritical > 0) {
    pushUnique(items, {
      priority: 'P0',
      focus: 'decision-clarity',
      title: 'Release-blocking state needs strongest hierarchy',
      weakness: 'Rejected, blocked, or critical states can be missed when the operator is moving quickly.',
      evidence: `decision=${currentStatus || 'none'} / report=${input.handoffReport.status} / critical=${managementCritical}`,
      action: 'Keep the red decision banner dominant, route primary actions to Decision and Audit, and suppress release-oriented controls.',
      workspace: currentStatus === 'rejected' ? 'decision' : 'audit',
    });
  } else if (currentStatus === 'review') {
    pushUnique(items, {
      priority: 'P1',
      focus: 'decision-clarity',
      title: 'Review state needs a single next action',
      weakness: 'Review decisions should not force staff to infer whether to rescan, inspect registry, or escalate.',
      evidence: `decision=${currentStatus}`,
      action: 'Make the next action explicit: open Report for supervised review, then return to Scan only after the reason is resolved.',
      workspace: 'report',
    });
  }

  if (!input.latestReceipt && !input.preview) {
    pushUnique(items, {
      priority: 'P2',
      focus: 'operator-speed',
      title: 'Empty intake state should point to the scanner',
      weakness: 'A blank shift start can feel passive instead of scan-first.',
      evidence: 'no receipt and no local preview',
      action: 'Keep Scan as the first operational action and show QR, NFC, and manual input as equal intake paths.',
      workspace: 'scan',
    });
  }

  if (previewIssueCount > 0) {
    pushUnique(items, {
      priority: input.preview?.status === 'rejected' ? 'P1' : 'P2',
      focus: 'decision-clarity',
      title: 'Parser feedback should be closer to the reader',
      weakness: 'Warnings and parse failures lose urgency if they only appear in secondary preview panels.',
      evidence: `${previewIssueCount} preview issue(s)`,
      action: 'Surface the top warning beside the submit control and keep detailed errors in Local Preview.',
      workspace: 'scan',
    });
  }

  if (!input.registryFresh) {
    pushUnique(items, {
      priority: 'P1',
      focus: 'trust-state',
      title: 'Registry freshness must be visible before release',
      weakness: 'Operators need to know whether revocation, used-state, and issuer trust are fresh without reading a registry detail panel.',
      evidence: 'registryFresh=false',
      action: 'Keep freshness in the main banner and provide a one-click Registry refresh path.',
      workspace: 'registry',
    });
  }

  if (input.syncState === 'error') {
    pushUnique(items, {
      priority: 'P2',
      focus: 'trust-state',
      title: 'Deferred sync needs an obvious recovery path',
      weakness: 'Local receipts can remain usable, but failed sync must not look like a normal ready state.',
      evidence: 'syncState=error',
      action: 'Show Queue as the reconciliation task, not as passive history.',
      workspace: 'queue',
    });
  }

  if (deviceAttention.length > 0) {
    const offline = deviceAttention.filter(device => device.status === 'offline').length;
    pushUnique(items, {
      priority: offline > 0 ? 'P1' : 'P2',
      focus: 'operator-speed',
      title: 'Device readiness should be solved before the rush',
      weakness: 'Printer, drawer, barcode, and measuring-instrument failures slow handoff and make operators improvise.',
      evidence: `${deviceAttention.length} device issue(s), ${offline} offline`,
      action: 'Run terminal diagnostics and keep printer, barcode, drawer, and measuring-instrument state visible to supervisors.',
      workspace: 'devices',
    });
  }

  if (input.handoffReport.status === 'attention') {
    pushUnique(items, {
      priority: 'P1',
      focus: 'handoff-flow',
      title: 'Handoff report needs completion guidance',
      weakness: 'Carrier scan, recipient proof, and terminal signature evidence are easy to confuse.',
      evidence: `proofLevel=${input.handoffReport.proofLevel}`,
      action: 'Use the four-stage board as the primary handoff mental model: Address OK, Carrier Scan OK, Recipient Pending, Handoff Complete.',
      workspace: 'report',
    });
  }

  if (highRiskSafety.active && highRiskSafety.state !== 'pass') {
    pushUnique(items, {
      priority: 'P0',
      focus: 'privacy-safety',
      title: 'High-risk safety controls must block release',
      weakness: 'DV, evacuation, refugee, and humanitarian flows cannot rely on ordinary POS disclosure patterns.',
      evidence: highRiskSafety.detail,
      action: 'Force AGID-S-only sharing, short expiry, immediate used-state marking, and no address-history retention before release.',
      workspace: 'report',
    });
  }

  if (input.activeSecureKeys === 0) {
    pushUnique(items, {
      priority: input.totalSecureKeys > 0 ? 'P2' : 'P1',
      focus: 'trust-state',
      title: 'Encrypted AGID-S path has no active key',
      weakness: 'AGID-S is a core privacy path; no active key turns secure QR intake into a manual exception.',
      evidence: `${input.activeSecureKeys}/${input.totalSecureKeys} active keys`,
      action: 'Generate or rotate a terminal recipient key before encrypted QR/NFC handoff.',
      workspace: 'keys',
    });
  }

  if (!cleanText(input.operatorId)) {
    pushUnique(items, {
      priority: 'P2',
      focus: 'settings-readiness',
      title: 'Operator identity is not production-ready',
      weakness: 'Review, reject, and override records need a staff identifier for later audit.',
      evidence: 'operatorId missing',
      action: 'Set operator id in Settings before production acceptance.',
      workspace: 'settings',
    });
  }

  if (items.length === 0) {
    pushUnique(items, {
      priority: 'P3',
      focus: 'settings-readiness',
      title: 'Keep design review in the operating loop',
      weakness: 'Clean states can regress after new devices, languages, carriers, or high-risk policies are added.',
      evidence: `management=${input.management.grade} / report=${input.handoffReport.status}`,
      action: 'Use this review as the first stop before adding new POS screens or external integrations.',
      workspace: 'admin',
    });
  }

  const sortedItems = items.sort((left, right) => (
    PRIORITY_ORDER[left.priority] - PRIORITY_ORDER[right.priority]
    || left.focus.localeCompare(right.focus)
    || left.title.localeCompare(right.title)
  ));
  const counts = countByPriority(sortedItems);
  const focusCounts = countByFocus(sortedItems);
  const score = reviewScore(sortedItems);
  const grade: PosDesignReviewSummary['grade'] = counts.P0 > 0
    ? 'blocked'
    : counts.P1 > 0 || counts.P2 > 0
      ? 'attention'
      : 'ready';

  return {
    score,
    grade,
    headline: reviewHeadline(grade, counts),
    highestPriority: highestPriority(sortedItems),
    generatedAt,
    counts,
    focusCounts,
    items: sortedItems,
  };
}

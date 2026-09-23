import type {
  PosAcceptanceReceipt,
  PosShippingLabelEvidence,
} from './posAcceptance';
import {
  hasPosStaffPermission,
  posOperationalStatusLabel,
  type PosDeviceDiagnostic,
  type PosExceptionAuditCase,
  type PosHandoffReverificationReport,
  type PosManagementSnapshot,
  type PosStaffRole,
} from './posOperationalControls';

export type PosPrintableKind =
  | 'management-summary'
  | 'redacted-receipt'
  | 'shipping-label-slip'
  | 'handoff-reverification'
  | 'device-diagnostics'
  | 'exception-audit'
  | 'offline-queue';

export type PosPrintableDocument = {
  kind: PosPrintableKind;
  title: string;
  filename: string;
  html: string;
  privacyNotes: string[];
  warnings: string[];
};

type PrintSection = {
  title: string;
  subtitle?: string;
  body: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function compactTime(value: unknown) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return 'not captured';
  const parsed = Date.parse(text);
  if (!Number.isFinite(parsed)) return text;
  return new Date(parsed).toISOString().replace('T', ' ').replace('.000Z', ' UTC');
}

function shortTail(value: unknown, size = 10) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return 'not captured';
  return text.length <= size ? text : `...${text.slice(-size)}`;
}

function boolLabel(value: unknown) {
  return value ? 'yes' : 'no';
}

function fileSafe(value: string) {
  return value.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function rows(items: Array<[string, unknown]>) {
  return `
    <table>
      <tbody>
        ${items.map(([label, value]) => `
          <tr>
            <th>${escapeHtml(label)}</th>
            <td>${escapeHtml(value ?? 'not captured')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function list(items: unknown[]) {
  const clean = items.filter((item) => String(item ?? '').trim());
  if (clean.length === 0) return '<p class="muted">None.</p>';
  return `<ul>${clean.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function stageList(shippingLabel: PosShippingLabelEvidence | undefined) {
  if (!shippingLabel) return '<p class="muted">No waybill stages.</p>';
  return `
    <ol class="stages">
      ${shippingLabel.proofStages.map((stage) => `
        <li>
          <strong>${escapeHtml(`${stage.rank}. ${stage.label}`)}</strong>
          <span>${stage.verified ? 'OK' : 'PENDING'}</span>
          <small>${escapeHtml(stage.detail)}</small>
        </li>
      `).join('')}
    </ol>
  `;
}

function shell(kind: PosPrintableKind, title: string, sections: PrintSection[], privacyNotes: string[], warnings: string[]) {
  const printedAt = compactTime(new Date().toISOString());
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: auto; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #0f172a;
      background: #fff;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 12px;
      line-height: 1.45;
    }
    header {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    h1 { margin: 0; font-size: 22px; letter-spacing: -0.02em; }
    h2 { margin: 0 0 6px; font-size: 14px; }
    p { margin: 0; }
    .kicker {
      margin-bottom: 4px;
      color: #475569;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.13em;
      text-transform: uppercase;
    }
    .meta {
      min-width: 180px;
      text-align: right;
      color: #475569;
      font-size: 10px;
      font-weight: 700;
    }
    section {
      break-inside: avoid;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      margin: 0 0 12px;
    }
    .subtitle { color: #64748b; font-size: 11px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td {
      border-top: 1px solid #e2e8f0;
      padding: 7px 6px;
      vertical-align: top;
      word-break: break-word;
    }
    tr:first-child th, tr:first-child td { border-top: 0; }
    th {
      width: 34%;
      color: #475569;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 0.09em;
      text-align: left;
      text-transform: uppercase;
    }
    td { font-weight: 750; }
    ul, ol { margin: 8px 0 0 18px; padding: 0; }
    li { margin: 3px 0; }
    .stages { list-style: none; margin-left: 0; }
    .stages li {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 4px 12px;
      border-top: 1px solid #e2e8f0;
      padding: 8px 0;
    }
    .stages li:first-child { border-top: 0; }
    .stages span {
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 0.1em;
    }
    .stages small {
      grid-column: 1 / -1;
      color: #64748b;
      font-weight: 700;
    }
    .warning {
      border-color: #f59e0b;
      background: #fffbeb;
      color: #78350f;
    }
    .privacy {
      border-color: #bae6fd;
      background: #f0f9ff;
      color: #075985;
    }
    .muted { color: #64748b; font-weight: 700; }
    footer {
      margin-top: 18px;
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      color: #64748b;
      font-size: 10px;
      font-weight: 700;
    }
    @media print {
      button { display: none; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body data-pos-print-kind="${escapeHtml(kind)}">
  <header>
    <div>
      <p class="kicker">AGID/AOID POS printable artifact</p>
      <h1>${escapeHtml(title)}</h1>
    </div>
    <div class="meta">
      <p>${escapeHtml(kind)}</p>
      <p>Printed ${escapeHtml(printedAt)}</p>
    </div>
  </header>
  ${sections.map((section) => `
    <section>
      <h2>${escapeHtml(section.title)}</h2>
      ${section.subtitle ? `<p class="subtitle">${escapeHtml(section.subtitle)}</p>` : ''}
      ${section.body}
    </section>
  `).join('')}
  ${warnings.length ? `
    <section class="warning">
      <h2>Warnings</h2>
      ${list(warnings)}
    </section>
  ` : ''}
  <section class="privacy">
    <h2>Privacy Controls</h2>
    ${list([
      'Raw QR/NFC payloads are not printed from stored receipts.',
      'Raw AGID-S ciphertext, precise private address, recipient proof code, and full AOID material are intentionally omitted.',
      ...privacyNotes,
    ])}
  </section>
  <footer>
    This document is an operational artifact, not a legal identity document. Re-scan the live QR/NFC source when cryptographic payload verification is required.
  </footer>
</body>
</html>`;
}

function doc(
  kind: PosPrintableKind,
  title: string,
  id: string,
  sections: PrintSection[],
  privacyNotes: string[] = [],
  warnings: string[] = [],
): PosPrintableDocument {
  return {
    kind,
    title,
    filename: `${fileSafe(id || title)}.html`,
    html: shell(kind, title, sections, privacyNotes, warnings),
    privacyNotes,
    warnings,
  };
}

function receiptWarnings(receipt: PosAcceptanceReceipt) {
  return [...receipt.errors, ...receipt.warnings];
}

function receiptSummarySection(receipt: PosAcceptanceReceipt): PrintSection {
  return {
    title: 'Receipt Decision',
    body: rows([
      ['Receipt ID', receipt.receiptId],
      ['Status', receipt.status],
      ['Accepted', boolLabel(receipt.accepted)],
      ['Channel', receipt.channel],
      ['Terminal', receipt.terminalId],
      ['Operator', receipt.operatorId || 'not captured'],
      ['Purpose', receipt.purpose],
      ['Created', compactTime(receipt.createdAt)],
      ['Amount', receipt.amount === undefined ? 'not captured' : `${receipt.amount} ${receipt.currency ?? ''}`.trim()],
    ]),
  };
}

function recordSection(receipt: PosAcceptanceReceipt): PrintSection {
  const record = receipt.record;
  return {
    title: 'Redacted Address Reference',
    subtitle: 'Only label and identifier tails are printed.',
    body: record ? rows([
      ['Record type', record.recordType],
      ['Label', record.label],
      ['Entity ID tail', record.entityIdTail],
      ['AGID tail', record.agidTail || 'not captured'],
      ['Country', record.country || 'not captured'],
      ['City', record.city || 'not captured'],
      ['Postcode', record.postcode || 'not captured'],
      ['Raw payload stored', boolLabel(record.rawPayloadStored)],
    ]) : '<p class="muted">No accepted address reference was captured.</p>',
  };
}

function waybillSection(shippingLabel: PosShippingLabelEvidence | undefined): PrintSection {
  return {
    title: 'Waybill Evidence',
    subtitle: 'Short-lived aliases and commitment tails only.',
    body: shippingLabel ? rows([
      ['Waybill alias', shippingLabel.waybillId],
      ['Proof level', shippingLabel.proofLevel],
      ['Risk level', shippingLabel.riskLevel],
      ['Safety mode', shippingLabel.safetyPolicy.mode],
      ['AGID sharing', shippingLabel.safetyPolicy.agidSharing],
      ['Address quality', shippingLabel.addressAccuracyStatus],
      ['Quality action', shippingLabel.addressAccuracyDecision],
      ['Address sources', shippingLabel.addressAccuracySources.join(', ') || 'local reference only'],
      ['Scan role', shippingLabel.scanRole],
      ['Store/POS', shippingLabel.storePosId],
      ['Carrier terminal', shippingLabel.carrierTerminalId || 'not captured'],
      ['Recipient proof', shippingLabel.recipientControlVerified ? 'verified' : 'pending'],
      ['Recipient proof method', shippingLabel.proofMethod],
      ['Challenge', shippingLabel.recipientChallengeRequired ? shippingLabel.recipientChallengeVerified ? 'verified' : 'required' : 'optional'],
      ['JTI tail', shortTail(shippingLabel.jti, 8)],
      ['Nullifier tail', shortTail(shippingLabel.nullifier, 10)],
      ['Waybill commitment tail', shortTail(shippingLabel.waybillCommitment, 10)],
      ['Address commitment tail', shortTail(shippingLabel.addressReferenceCommitment, 10)],
      ['Terminal signature tail', shortTail(shippingLabel.terminalEvidenceSignature, 10)],
      ['Expires', compactTime(shippingLabel.expiresAt)],
      ['Revoke on receipt', boolLabel(shippingLabel.safetyPolicy.revokeOnReceipt)],
      ['Retain address history', boolLabel(shippingLabel.safetyPolicy.retainAddressHistory)],
    ]) : '<p class="muted">No waybill evidence is attached to this receipt.</p>',
  };
}

function ethereumPaymentSection(receipt: PosAcceptanceReceipt): PrintSection {
  const payment = receipt.ethereumPayment;
  return {
    title: 'Ethereum Payment Gate',
    subtitle: 'Public payment references and commitments only.',
    body: payment ? rows([
      ['Payment kind', payment.paymentKind],
      ['Settlement mode', payment.settlementMode],
      ['Payment status', payment.status],
      ['Required action', payment.requiredAction],
      ['Payment ref', payment.publicPaymentRef],
      ['Amount', payment.amount === null ? 'not captured' : `${payment.amount} ${payment.tokenSymbol ?? payment.currency ?? ''}`.trim()],
      ['Network', payment.networkId],
      ['Carrier scan allowed', boolLabel(payment.handoffGate.canAcceptCarrierScan)],
      ['Package release allowed', boolLabel(payment.handoffGate.canReleasePackage)],
      ['Handoff allowed', boolLabel(payment.handoffGate.canCompleteHandoff)],
      ['Gate reason', payment.handoffGate.reason],
      ['Ledger write', payment.privacy.publicLedgerWriteObserved ? 'observed' : payment.privacy.publicLedgerWritePlanned ? 'planned' : 'none'],
      ['Tx plan operation', payment.txPlan?.operation || 'not planned'],
    ]) : '<p class="muted">No Ethereum payment gate was attached to this receipt.</p>',
  };
}

export function buildRedactedReceiptPrintDocument(receipt: PosAcceptanceReceipt) {
  return doc(
    'redacted-receipt',
    `Redacted POS Receipt ${receipt.receiptId}`,
    receipt.receiptId,
    [
      receiptSummarySection(receipt),
      recordSection(receipt),
      ethereumPaymentSection(receipt),
      waybillSection(receipt.shippingLabel),
      {
        title: 'Proof Stages',
        body: stageList(receipt.shippingLabel),
      },
    ],
    receipt.privacyNotes,
    receiptWarnings(receipt),
  );
}

export function buildShippingLabelSlipPrintDocument(receipt: PosAcceptanceReceipt) {
  const shippingLabel = receipt.shippingLabel;
  const warnings = [
    ...receiptWarnings(receipt),
    ...(shippingLabel ? [] : ['No waybill evidence is attached to the latest receipt.']),
    'The live waybill QR payload is not reprinted from receipt history. Re-scan the source QR/NFC when payload verification is required.',
  ];

  return doc(
    'shipping-label-slip',
    `Shipping Handoff Slip ${receipt.receiptId}`,
    `shipping-${receipt.receiptId}`,
    [
      receiptSummarySection(receipt),
      waybillSection(shippingLabel),
      {
        title: 'Handoff Stages',
        body: stageList(shippingLabel),
      },
    ],
    [
      ...receipt.privacyNotes,
      'This slip is safe for handoff operations because it omits the raw waybill payload and recipient proof code.',
    ],
    warnings,
  );
}

export function buildHandoffReverificationPrintDocument(report: PosHandoffReverificationReport) {
  const evidence = report.evidenceSummary;
  const advanced = report.advancedAudit;
  return doc(
    'handoff-reverification',
    `Handoff Reverification ${report.reportId}`,
    report.reportId,
    [
      {
        title: 'Report Summary',
        body: rows([
          ['Report ID', report.reportId],
          ['Receipt ID', report.receiptId || 'not captured'],
          ['Status', posOperationalStatusLabel(report.status)],
          ['Proof level', report.proofLevel],
          ['Generated', compactTime(report.generatedAt)],
          ['Summary', report.summary],
        ]),
      },
      {
        title: 'Advanced Audit',
        subtitle: 'Operational score, risk level, evidence coverage, and privacy posture.',
        body: rows([
          ['Audit score', `${advanced.score}/100`],
          ['Risk', advanced.risk],
          ['Evidence coverage', `${advanced.coverage.present}/${advanced.coverage.total}`],
          ['Missing evidence', advanced.coverage.missing.join(', ') || 'none'],
          ['Privacy posture', advanced.privacyPosture.state],
          ['Privacy detail', advanced.privacyPosture.detail],
        ]),
      },
      {
        title: 'Advanced Audit Metrics',
        body: rows(advanced.metrics.map((metric) => [
          `${metric.label} (${metric.state})`,
          `${metric.value}; ${metric.detail}`,
        ])),
      },
      {
        title: 'Evidence Timeline',
        body: rows(advanced.timeline.map((event) => [
          `${compactTime(event.at)} / ${event.label} (${event.state})`,
          event.detail,
        ])),
      },
      {
        title: 'Checks',
        body: rows(report.checks.map((check) => [
          `${check.label} (${check.state})`,
          check.detail,
        ])),
      },
      {
        title: 'Evidence Package',
        body: rows([
          ['Waybill alias', evidence.waybillId || 'not captured'],
          ['Carrier receipt', evidence.carrierScanReceipt?.receiptId || 'not captured'],
          ['Carrier terminal', evidence.carrierScanReceipt?.carrierTerminalId || 'not captured'],
          ['Carrier signature tail', shortTail(evidence.carrierScanReceipt?.terminalSignatureTail, 10)],
          ['Recipient receipt', evidence.recipientProofReceipt?.receiptId || 'not captured'],
          ['Recipient method', evidence.recipientProofReceipt?.proofMethod || 'not captured'],
          ['Recipient proof hash tail', shortTail(evidence.recipientProofReceipt?.recipientChallengeHashTail, 10)],
          ['Registry freshness', evidence.revocationFreshness.state],
          ['Registry detail', evidence.revocationFreshness.detail],
          ['POS signatures complete', boolLabel(evidence.posTerminalSignatures.complete)],
          ['High-risk mode', evidence.highRiskSafety.active ? evidence.highRiskSafety.mode : 'inactive'],
        ]),
      },
      {
        title: 'Decision Reasons',
        body: rows(evidence.decisionReasons.map((reason) => [
          `${reason.label} (${reason.state})`,
          reason.reason,
        ])),
      },
      {
        title: 'Privacy and Integrity',
        body: rows([
          ...advanced.privacyPosture.controls.map((control, index): [string, unknown] => [
            `Privacy control ${index + 1}`,
            control,
          ]),
          ...advanced.integrityChecks.map((item): [string, unknown] => [
            `${item.label} (${item.state})`,
            item.reason,
          ]),
        ]),
      },
      {
        title: 'Next Actions',
        body: rows(advanced.nextActions.map((action, index) => [
          `Action ${index + 1}`,
          action,
        ])),
      },
    ],
    [
      'Report evidence uses receipt ids, signature tails, commitment tails, and status values rather than private address payloads.',
    ],
    report.status === 'cleared' ? [] : [`Report requires attention: ${report.status}`],
  );
}

export function buildDeviceDiagnosticsPrintDocument(
  diagnostics: PosDeviceDiagnostic[],
  terminalId: string,
  staffRole: PosStaffRole,
) {
  return doc(
    'device-diagnostics',
    `Device Diagnostics ${terminalId}`,
    `device-diagnostics-${terminalId}`,
    [
      {
        title: 'Readiness Summary',
        body: rows([
          ['Terminal', terminalId],
          ['Staff role', staffRole],
          ['Devices ready', `${diagnostics.filter((item) => item.status === 'ready').length}/${diagnostics.length}`],
          ['Checked at', compactTime(diagnostics[0]?.checkedAt)],
        ]),
      },
      {
        title: 'Device Checks',
        body: rows(diagnostics.map((device) => [
          `${device.label} (${device.status})`,
          `${device.operatorAction} Evidence: ${device.evidence.join(', ') || 'none'}. Permission: ${device.requiredPermission}`,
        ])),
      },
    ],
    [
      'Device diagnostics do not include scanned customer payloads.',
    ],
    hasPosStaffPermission(staffRole, 'run-device-diagnostics') ? [] : ['Current role cannot run diagnostics; printed result may be stale.'],
  );
}

export function buildExceptionAuditPrintDocument(
  cases: PosExceptionAuditCase[],
  staffRole: PosStaffRole,
) {
  const canView = hasPosStaffPermission(staffRole, 'view-exception-audit');
  return doc(
    'exception-audit',
    'Exception Audit Summary',
    `exception-audit-${staffRole}`,
    [
      {
        title: 'Case Summary',
        body: rows([
          ['Staff role', staffRole],
          ['Detail access', canView ? 'full audit detail' : 'restricted count-only mode'],
          ['Open cases', cases.length],
          ['Rejected', cases.filter((item) => item.status === 'rejected').length],
          ['Review required', cases.filter((item) => item.status === 'review').length],
        ]),
      },
      {
        title: canView ? 'Audit Cases' : 'Restricted Cases',
        body: cases.length ? rows(cases.map((item) => [
          `${item.caseId} / ${item.status}`,
          canView
            ? `${item.receiptId}; ${item.recordLabel}; ${item.reason}; ${item.operatorAction}`
            : `${item.receiptId}; detail restricted for ${staffRole}`,
        ])) : '<p class="muted">No rejected or review-required receipts in the local cache.</p>',
      },
    ],
    [
      'Audit printing is role-aware; restricted roles do not print case reasons or record labels.',
    ],
    canView ? [] : ['Current role cannot view full exception audit details.'],
  );
}

export function buildOfflineQueuePrintDocument(
  receipts: PosAcceptanceReceipt[],
  syncState: 'idle' | 'loading' | 'error',
  terminalId: string,
) {
  return doc(
    'offline-queue',
    `Offline Queue ${terminalId}`,
    `offline-queue-${terminalId}`,
    [
      {
        title: 'Deferred Sync Summary',
        body: rows([
          ['Terminal', terminalId],
          ['Sync state', syncState],
          ['Local receipts', receipts.length],
          ['Accepted', receipts.filter((item) => item.status === 'accepted').length],
          ['Review', receipts.filter((item) => item.status === 'review').length],
          ['Rejected', receipts.filter((item) => item.status === 'rejected').length],
        ]),
      },
      {
        title: 'Recent Receipt Tails',
        body: receipts.length ? rows(receipts.slice(0, 12).map((receipt) => [
          `${receipt.receiptId} / ${receipt.status}`,
          `${compactTime(receipt.createdAt)}; ${receipt.channel}; ${receipt.record?.label ?? receipt.errors[0] ?? 'unknown'}`,
        ])) : '<p class="muted">No local receipts queued.</p>',
      },
    ],
    [
      'Offline queue printing contains receipt metadata only and must be reconciled with the registry when connectivity returns.',
    ],
    syncState === 'error' ? ['Server sync is failing; treat offline queue as pending reconciliation.'] : [],
  );
}

export function buildManagementSummaryPrintDocument(
  snapshot: PosManagementSnapshot,
  latestReceipt: PosAcceptanceReceipt | null,
  report: PosHandoffReverificationReport,
) {
  return doc(
    'management-summary',
    `Management Summary ${snapshot.snapshotId}`,
    snapshot.snapshotId,
    [
      {
        title: 'Terminal Summary',
        body: rows([
          ['Snapshot ID', snapshot.snapshotId],
          ['Terminal', snapshot.terminalId],
          ['Generated', compactTime(snapshot.generatedAt)],
          ['Grade', snapshot.grade],
          ['Summary', snapshot.summary],
          ['Latest receipt', latestReceipt?.receiptId || 'none'],
          ['Reverification', report.status],
        ]),
      },
      {
        title: 'Metrics',
        body: rows(snapshot.metrics.map((metric) => [
          `${metric.label} (${metric.tone})`,
          `${metric.value}; ${metric.detail}`,
        ])),
      },
      {
        title: 'Risk Queue',
        body: snapshot.risks.length ? rows(snapshot.risks.map((risk) => [
          `${risk.label} (${risk.severity})`,
          `${risk.detail} Action: ${risk.action}`,
        ])) : '<p class="muted">No management risks.</p>',
      },
    ],
    [
      'Management summary prints operational state only; it does not include raw customer addresses or QR/NFC payloads.',
    ],
    snapshot.grade === 'ready' ? [] : [`Management grade is ${snapshot.grade}.`],
  );
}

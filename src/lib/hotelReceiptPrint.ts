import {
  validateHotelCheckInPayloadIsSafe,
  type HotelCheckInReceipt,
} from './hotelCheckInSystem';

export type HotelPrintableKind =
  | 'hotel-checkin-receipt'
  | 'hotel-payment-receipt';

export type HotelPrintableDocument = {
  kind: HotelPrintableKind;
  title: string;
  filename: string;
  html: string;
  privacyNotes: string[];
  warnings: string[];
};

export type HotelPaymentReceiptInput = {
  receipt: HotelCheckInReceipt;
  propertyName?: string;
  receiptRecipientAlias?: string;
  amount?: string | number;
  taxAmount?: string | number;
  currency?: string;
  paymentMethod?: string;
  paymentAlias?: string;
  issuedByAlias?: string;
};

export type HotelTaxPaymentSummary = {
  currency: string;
  grossAmount: number;
  taxPaid: number;
  taxableBasis: number;
  effectiveTaxRate: number | null;
  grossAmountFormatted: string;
  taxPaidFormatted: string;
  taxableBasisFormatted: string;
  effectiveTaxRateFormatted: string;
  paymentAlias: string;
  receiptRecipientAlias: string;
  receiptId: string;
  receiptRoot: string;
  paidAt: string;
  status: 'paid' | 'draft' | 'needs-review';
  warnings: string[];
  privacy: {
    containsRawGuestAddress: false;
    containsRawAgid: false;
    containsRawAoid: false;
    containsRecipientName: false;
    containsPhoneNumber: false;
    containsRoomNumber: false;
  };
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

function cleanAlias(value: unknown, fallback: string, maxLength = 80) {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.trim().replace(/[^\p{L}\p{N}:._/-]+/gu, '-').replace(/-+/g, '-');
  return cleaned ? cleaned.slice(0, maxLength) : fallback;
}

function cleanText(value: unknown, fallback = 'not captured', maxLength = 96) {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, maxLength) : fallback;
}

function cleanCurrency(value: unknown) {
  const text = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return /^[A-Z]{3}$/.test(text) ? text : 'JPY';
}

function money(value: unknown, currency: string) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`;
  }
  const text = typeof value === 'string' ? value.trim() : '';
  return text ? `${text.slice(0, 48)} ${currency}` : `0 ${currency}`;
}

function parseMoneyAmount(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value);
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return 0;
  const normalized = text.replace(/[,\s]/g, '').replace(/[^\d.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function formatMoneyAmount(value: number, currency: string) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`;
}

function formatRate(value: number | null) {
  if (value === null || !Number.isFinite(value)) return 'not available';
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
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
  const clean = items.filter(item => String(item ?? '').trim());
  if (clean.length === 0) return '<p class="muted">None.</p>';
  return `<ul>${clean.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function boolLabel(value: unknown) {
  return value ? 'yes' : 'no';
}

function shell(kind: HotelPrintableKind, title: string, sections: PrintSection[], privacyNotes: string[], warnings: string[]) {
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
      color: #111827;
      background: #fff;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 12px;
      line-height: 1.45;
    }
    header {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      border-bottom: 2px solid #111827;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    h1 { margin: 0; font-size: 22px; letter-spacing: -0.02em; }
    h2 { margin: 0 0 6px; font-size: 14px; }
    p { margin: 0; }
    .kicker {
      margin-bottom: 4px;
      color: #4b5563;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 0.13em;
      text-transform: uppercase;
    }
    .meta {
      min-width: 190px;
      text-align: right;
      color: #4b5563;
      font-size: 10px;
      font-weight: 800;
    }
    section {
      break-inside: avoid;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 12px;
      margin: 0 0 12px;
    }
    .subtitle { color: #6b7280; font-size: 11px; font-weight: 800; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td {
      border-top: 1px solid #e5e7eb;
      padding: 7px 6px;
      vertical-align: top;
      word-break: break-word;
    }
    tr:first-child th, tr:first-child td { border-top: 0; }
    th {
      width: 34%;
      color: #4b5563;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 0.09em;
      text-align: left;
      text-transform: uppercase;
    }
    td { font-weight: 760; }
    ul { margin: 8px 0 0 18px; padding: 0; }
    li { margin: 3px 0; }
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
    .amount {
      font-size: 22px;
      font-weight: 950;
      letter-spacing: -0.02em;
    }
    .muted { color: #6b7280; font-weight: 800; }
    footer {
      margin-top: 18px;
      border-top: 1px solid #d1d5db;
      padding-top: 10px;
      color: #6b7280;
      font-size: 10px;
      font-weight: 800;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body data-hotel-print-kind="${escapeHtml(kind)}">
  <header>
    <div>
      <p class="kicker">AGID/AOID hotel printable artifact</p>
      <h1>${escapeHtml(title)}</h1>
    </div>
    <div class="meta">
      <p>${escapeHtml(kind)}</p>
      <p>Printed ${escapeHtml(printedAt)}</p>
    </div>
  </header>
  ${sections.map(section => `
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
      'The hotel print artifact is generated from redacted check-in receipts.',
      'Guest raw address, raw AGID, raw AOID, legal name, phone number, room number, passport number, and proof secrets are omitted by default.',
      ...privacyNotes,
    ])}
  </section>
  <footer>
    This document is an operational receipt. If a statutory tax invoice is required, export only the minimum permitted billing alias to the property PMS or accounting system under local policy.
  </footer>
</body>
</html>`;
}

function doc(
  kind: HotelPrintableKind,
  title: string,
  id: string,
  sections: PrintSection[],
  privacyNotes: string[] = [],
  warnings: string[] = [],
): HotelPrintableDocument {
  const document = {
    kind,
    title,
    filename: `${fileSafe(id || title)}.html`,
    html: shell(kind, title, sections, privacyNotes, warnings),
    privacyNotes,
    warnings,
  };
  const safety = validateHotelCheckInPayloadIsSafe(document);
  if (!safety.safe) {
    throw new Error(`hotel-print-document-contained-private-fields:${safety.findings.join(',')}`);
  }
  return document;
}

function receiptSummaryRows(receipt: HotelCheckInReceipt) {
  return rows([
    ['Receipt ID', receipt.receiptId],
    ['Request ID', receipt.requestId],
    ['Action', receipt.action],
    ['Status', receipt.status],
    ['Decision', receipt.decision],
    ['Property alias', receipt.propertyAlias],
    ['Booking alias', receipt.bookingAlias || 'not captured'],
    ['Staff alias', receipt.staffAlias],
    ['Terminal alias', receipt.terminalAlias],
    ['Created', compactTime(receipt.createdAt)],
    ['High-risk mode', boolLabel(receipt.highRiskMode)],
  ]);
}

export function buildHotelTaxPaymentSummary(input: HotelPaymentReceiptInput): HotelTaxPaymentSummary {
  const receipt = input.receipt;
  const currency = cleanCurrency(input.currency);
  const grossAmount = parseMoneyAmount(input.amount);
  const taxPaid = parseMoneyAmount(input.taxAmount);
  const taxableBasis = Math.max(0, grossAmount - taxPaid);
  const effectiveTaxRate = taxableBasis > 0 ? (taxPaid / taxableBasis) * 100 : null;
  const warnings = [
    ...receipt.warnings,
    ...(taxPaid > grossAmount ? ['tax-paid-exceeds-gross-amount'] : []),
    ...(receipt.decision === 'complete' ? [] : ['tax-summary-linked-to-incomplete-check-in-receipt']),
    ...(grossAmount === 0 && taxPaid === 0 ? ['tax-summary-has-zero-amount'] : []),
  ];
  const status: HotelTaxPaymentSummary['status'] = taxPaid > grossAmount || receipt.decision !== 'complete'
    ? 'needs-review'
    : grossAmount > 0 || taxPaid > 0
      ? 'paid'
      : 'draft';
  const summary = {
    currency,
    grossAmount,
    taxPaid,
    taxableBasis,
    effectiveTaxRate,
    grossAmountFormatted: formatMoneyAmount(grossAmount, currency),
    taxPaidFormatted: formatMoneyAmount(taxPaid, currency),
    taxableBasisFormatted: formatMoneyAmount(taxableBasis, currency),
    effectiveTaxRateFormatted: formatRate(effectiveTaxRate),
    paymentAlias: cleanAlias(input.paymentAlias, `payment:${receipt.receiptId.slice(-8)}`),
    receiptRecipientAlias: cleanAlias(input.receiptRecipientAlias, 'guest:local-alias'),
    receiptId: receipt.receiptId,
    receiptRoot: receipt.receiptRoot,
    paidAt: receipt.createdAt,
    status,
    warnings,
    privacy: {
      containsRawGuestAddress: false,
      containsRawAgid: false,
      containsRawAoid: false,
      containsRecipientName: false,
      containsPhoneNumber: false,
      containsRoomNumber: false,
    },
  } satisfies HotelTaxPaymentSummary;

  const safety = validateHotelCheckInPayloadIsSafe(summary);
  if (!safety.safe) {
    throw new Error(`hotel-tax-summary-contained-private-fields:${safety.findings.join(',')}`);
  }

  return summary;
}

export function buildHotelCheckInReceiptPrintDocument(
  receipt: HotelCheckInReceipt,
  options: { propertyName?: string } = {},
) {
  return doc(
    'hotel-checkin-receipt',
    `Hotel Check-in Receipt ${receipt.receiptId}`,
    receipt.receiptId,
    [
      {
        title: 'Check-in Decision',
        subtitle: 'Redacted operational receipt for front desk, guest, and audit handoff.',
        body: receiptSummaryRows(receipt),
      },
      {
        title: 'Scope and Subject',
        body: rows([
          ['Property name', cleanText(options.propertyName)],
          ['Safe subject ref', receipt.safeSubjectRef],
          ['Requested scopes', receipt.requestedScopes.join(', ') || 'none'],
          ['Receipt root', receipt.receiptRoot],
        ]),
      },
      {
        title: 'Redaction State',
        body: rows([
          ['Contains raw guest address', boolLabel(receipt.privacy.containsRawGuestAddress)],
          ['Contains raw AGID', boolLabel(receipt.privacy.containsRawAgid)],
          ['Contains raw AOID', boolLabel(receipt.privacy.containsRawAoid)],
          ['Contains recipient name', boolLabel(receipt.privacy.containsRecipientName)],
          ['Contains phone number', boolLabel(receipt.privacy.containsPhoneNumber)],
          ['Contains room number', boolLabel(receipt.privacy.containsRoomNumber)],
        ]),
      },
    ],
    [
      'The receipt proves check-in workflow state without printing the guest address payload.',
    ],
    receipt.warnings,
  );
}

export function buildHotelPaymentReceiptPrintDocument(input: HotelPaymentReceiptInput) {
  const receipt = input.receipt;
  const currency = cleanCurrency(input.currency);
  const recipientAlias = cleanAlias(input.receiptRecipientAlias, 'guest:local-alias');
  const issuedBy = cleanAlias(input.issuedByAlias, receipt.staffAlias);
  const paymentAlias = cleanAlias(input.paymentAlias, `payment:${receipt.receiptId.slice(-8)}`);
  const paymentMethod = cleanText(input.paymentMethod, 'local payment');
  const taxSummary = buildHotelTaxPaymentSummary(input);
  const total = money(input.amount, currency);
  const tax = money(input.taxAmount, currency);

  return doc(
    'hotel-payment-receipt',
    `Hotel Payment Receipt ${receipt.receiptId}`,
    `payment-${receipt.receiptId}`,
    [
      {
        title: 'Payment Summary',
        subtitle: 'Alias-based receipt for guest handoff. It is safe for print/PDF by default.',
        body: `
          <p class="amount">${escapeHtml(total)}</p>
          ${rows([
            ['Currency', currency],
            ['Tax / VAT', tax],
            ['Payment method', paymentMethod],
            ['Payment alias', paymentAlias],
            ['Receipt recipient alias', recipientAlias],
            ['Issued by alias', issuedBy],
          ])}
        `,
      },
      {
        title: 'Paid Tax Summary',
        subtitle: 'Tax values are derived from local receipt inputs and linked to the redacted check-in receipt root.',
        body: rows([
          ['Tax paid', taxSummary.taxPaidFormatted],
          ['Gross amount', taxSummary.grossAmountFormatted],
          ['Taxable basis', taxSummary.taxableBasisFormatted],
          ['Effective tax rate', taxSummary.effectiveTaxRateFormatted],
          ['Tax status', taxSummary.status],
          ['Paid at', compactTime(taxSummary.paidAt)],
          ['Payment alias', taxSummary.paymentAlias],
        ]),
      },
      {
        title: 'Linked Check-in Receipt',
        body: receiptSummaryRows(receipt),
      },
      {
        title: 'Issuer and Integrity',
        body: rows([
          ['Property name', cleanText(input.propertyName)],
          ['Property alias', receipt.propertyAlias],
          ['Booking alias', receipt.bookingAlias || 'not captured'],
          ['Receipt root', receipt.receiptRoot],
          ['Safe subject ref', receipt.safeSubjectRef],
        ]),
      },
    ],
    [
      'The receipt recipient is an alias by default. Do not type a legal name, room number, phone number, passport number, or full address into the alias fields.',
      'Paid tax values are shown as local receipt evidence and should be reconciled with the property accounting system for statutory tax filings.',
    ],
    taxSummary.warnings,
  );
}

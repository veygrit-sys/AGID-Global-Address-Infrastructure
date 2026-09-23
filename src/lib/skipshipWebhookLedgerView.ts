import type { SkipshipWebhookEventStoreSnapshotEntry } from './skipshipWebhookEventStore';

export type SkipshipWebhookLedgerStatus = 'ok' | 'retrying' | 'stale' | 'expired';

export type SkipshipWebhookLedgerRow = {
  eventId: string;
  status: SkipshipWebhookLedgerStatus;
  attemptCount: number;
  responseStatus: number;
  firstSeenAt: string;
  lastSeenAt: string;
  expiresAt: string;
  safeRefs: {
    eventRef: string;
  };
  blockedMaterial: string[];
};

export type SkipshipWebhookLedgerView = {
  rows: SkipshipWebhookLedgerRow[];
  totals: {
    events: number;
    retrying: number;
    expired: number;
  };
  privacyBoundary: string;
};

function rowStatus(entry: SkipshipWebhookEventStoreSnapshotEntry, nowIso: string): SkipshipWebhookLedgerStatus {
  if (Date.parse(entry.expiresAt) <= Date.parse(nowIso)) return 'expired';
  if (entry.responseStatus >= 500 || entry.attemptCount >= 12) return 'retrying';
  if (entry.attemptCount >= 6) return 'stale';
  return 'ok';
}

export function buildSkipshipWebhookLedgerView(
  entries: SkipshipWebhookEventStoreSnapshotEntry[],
  nowIso = '2026-07-04T00:00:00.000Z',
): SkipshipWebhookLedgerView {
  const rows = entries.map(entry => {
    const status = rowStatus(entry, nowIso);
    return {
      eventId: entry.eventId,
      status,
      attemptCount: entry.attemptCount,
      responseStatus: entry.responseStatus,
      firstSeenAt: entry.firstSeenAt,
      lastSeenAt: entry.lastSeenAt,
      expiresAt: entry.expiresAt,
      safeRefs: {
        eventRef: `webhook_event:${entry.eventId}`,
      },
      blockedMaterial: ['rawAddress', 'recipientPhone', 'carrierSecret', 'proofWitness', 'rawTrackingPayload', 'bodyFingerprint'],
    };
  });

  return {
    rows,
    totals: {
      events: rows.length,
      retrying: rows.filter(row => row.status === 'retrying').length,
      expired: rows.filter(row => row.status === 'expired').length,
    },
    privacyBoundary: 'Merchant Console webhook ledger rows expose event refs, attempts, timestamps, and statuses only; raw payloads, body fingerprints, recipient contacts, addresses, carrier secrets, and proof witnesses stay out of the view model.',
  };
}

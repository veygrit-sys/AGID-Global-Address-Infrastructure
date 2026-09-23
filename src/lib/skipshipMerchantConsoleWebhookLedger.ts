import type { SkipshipWebhookEventStoreSnapshotEntry } from './skipshipWebhookEventStore';
import { buildSkipshipWebhookLedgerView, type SkipshipWebhookLedgerView } from './skipshipWebhookLedgerView';

export const SKIPSHIP_MERCHANT_CONSOLE_WEBHOOK_LEDGER_FIXTURE: SkipshipWebhookEventStoreSnapshotEntry[] = [
  {
    eventId: 'evt_tracking_synthetic_console_ok',
    attemptCount: 1,
    responseStatus: 202,
    firstSeenAt: '2026-07-04T10:00:00.000Z',
    lastSeenAt: '2026-07-04T10:00:00.000Z',
    expiresAt: '2026-08-03T10:00:00.000Z',
  },
  {
    eventId: 'evt_tracking_synthetic_console_stale',
    attemptCount: 6,
    responseStatus: 202,
    firstSeenAt: '2026-07-04T10:05:00.000Z',
    lastSeenAt: '2026-07-04T10:25:00.000Z',
    expiresAt: '2026-08-03T10:05:00.000Z',
  },
  {
    eventId: 'evt_tracking_synthetic_console_retrying',
    attemptCount: 12,
    responseStatus: 500,
    firstSeenAt: '2026-07-04T10:10:00.000Z',
    lastSeenAt: '2026-07-04T10:40:00.000Z',
    expiresAt: '2026-08-03T10:10:00.000Z',
  },
];

export type SkipshipMerchantConsoleWebhookLedgerInput = {
  snapshot?: SkipshipWebhookEventStoreSnapshotEntry[];
  nowIso?: string;
};

export type SkipshipMerchantConsoleWebhookLedger = SkipshipWebhookLedgerView & {
  source: {
    mode: 'fixture' | 'storeSnapshot';
    localOnly: true;
    productionTraffic: false;
    blockedMaterial: string[];
  };
};

export function buildSkipshipMerchantConsoleWebhookLedger(
  input: SkipshipMerchantConsoleWebhookLedgerInput = {},
): SkipshipMerchantConsoleWebhookLedger {
  const snapshot = input.snapshot ?? SKIPSHIP_MERCHANT_CONSOLE_WEBHOOK_LEDGER_FIXTURE;
  const mode = input.snapshot ? 'storeSnapshot' : 'fixture';
  const view = buildSkipshipWebhookLedgerView(snapshot, input.nowIso ?? '2026-07-04T11:00:00.000Z');

  return {
    ...view,
    source: {
      mode,
      localOnly: true,
      productionTraffic: false,
      blockedMaterial: ['rawAddress', 'recipientPhone', 'carrierSecret', 'proofWitness', 'rawTrackingPayload', 'bodyFingerprint'],
    },
  };
}

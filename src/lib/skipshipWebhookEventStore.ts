export type SkipshipWebhookEventResponse = {
  status: number;
  body: Record<string, unknown>;
};

export const SKIPSHIP_WEBHOOK_EVENT_STORE_DEFAULT_TTL_DAYS = 30;

export type SkipshipWebhookEventStoreInput = {
  eventId: string;
  bodyFingerprint: string;
  response: SkipshipWebhookEventResponse;
  receivedAt?: string;
  ttlDays?: number;
};

export type SkipshipWebhookEventAudit = {
  eventId: string;
  attemptCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  expiresAt: string;
};

export type SkipshipWebhookEventStoreSnapshotEntry = SkipshipWebhookEventAudit & {
  responseStatus: number;
};

export type SkipshipWebhookEventStoreResult =
  | {
      kind: 'stored';
      response: SkipshipWebhookEventResponse;
      audit: SkipshipWebhookEventAudit;
    }
  | {
      kind: 'replayed';
      response: SkipshipWebhookEventResponse;
      audit: SkipshipWebhookEventAudit;
    }
  | {
      kind: 'conflict';
      response: SkipshipWebhookEventResponse;
      audit: SkipshipWebhookEventAudit;
    };

export type SkipshipWebhookEventStore = {
  accept(input: SkipshipWebhookEventStoreInput): SkipshipWebhookEventStoreResult;
  pruneExpired(nowIso: string): string[];
  size(): number;
  snapshot(): SkipshipWebhookEventStoreSnapshotEntry[];
};

type StoreEntry = SkipshipWebhookEventResponse & {
  bodyFingerprint: string;
  audit: SkipshipWebhookEventAudit;
};

function addDaysIso(iso: string, days: number) {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export function createInMemorySkipshipWebhookEventStore(): SkipshipWebhookEventStore {
  const entries = new Map<string, StoreEntry>();

  return {
    accept(input) {
      const receivedAt = input.receivedAt ?? new Date().toISOString();
      const ttlDays = input.ttlDays ?? SKIPSHIP_WEBHOOK_EVENT_STORE_DEFAULT_TTL_DAYS;
      const cached = entries.get(input.eventId);
      if (cached) {
        cached.audit = {
          ...cached.audit,
          attemptCount: cached.audit.attemptCount + 1,
          lastSeenAt: receivedAt,
        };
        if (cached.bodyFingerprint !== input.bodyFingerprint) {
          return {
            kind: 'conflict',
            response: {
              status: 409,
              body: {
                ok: false,
                error: 'tracking_webhook_event_conflict',
                message: 'The same tracking webhook eventId was reused with a different signed body.',
              },
            },
            audit: cached.audit,
          };
        }

        return {
          kind: 'replayed',
          response: {
            status: cached.status,
            body: cached.body,
          },
          audit: cached.audit,
        };
      }

      const audit: SkipshipWebhookEventAudit = {
        eventId: input.eventId,
        attemptCount: 1,
        firstSeenAt: receivedAt,
        lastSeenAt: receivedAt,
        expiresAt: addDaysIso(receivedAt, ttlDays),
      };
      entries.set(input.eventId, {
        ...input.response,
        bodyFingerprint: input.bodyFingerprint,
        audit,
      });

      return {
        kind: 'stored',
        response: input.response,
        audit,
      };
    },
    pruneExpired(nowIso) {
      const nowMs = Date.parse(nowIso);
      if (!Number.isFinite(nowMs)) return [];

      const removed: string[] = [];
      for (const [eventId, entry] of entries) {
        const expiresAtMs = Date.parse(entry.audit.expiresAt);
        if (Number.isFinite(expiresAtMs) && expiresAtMs <= nowMs) {
          entries.delete(eventId);
          removed.push(eventId);
        }
      }
      return removed.sort();
    },
    size() {
      return entries.size;
    },
    snapshot() {
      return [...entries.values()]
        .map(entry => ({
          ...entry.audit,
          responseStatus: entry.status,
        }))
        .sort((left, right) => left.eventId.localeCompare(right.eventId));
    },
  };
}

import { apiEndpoints } from '../apiEndpoints';
import type {
  AddressFeedbackIssue,
  AddressFeedbackRecord,
  AddressFeedbackSource,
} from '../addressFeedbackLearning';

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

type FetchLike = (url: string, options?: RequestInit) => Promise<Response>;

export const ADDRESS_QUALITY_FEEDBACK_OUTBOX_STORAGE_KEY = 'agid_address_quality_feedback_outbox';

export type AddressQualityFeedbackSubmission = {
  version: 'address-quality-feedback-v1';
  id: string;
  submittedAt: string;
  recordId: string;
  source: AddressFeedbackSource;
  agidTail?: string;
  countryCode?: string;
  languageTab?: string;
  issue: AddressFeedbackIssue;
  severity: 1 | 2 | 3;
  operatorNote?: string;
  context: {
    hasPostcode: boolean;
    hasStreet: boolean;
    hasBuilding: boolean;
    isSea: boolean;
    undeliverableRegion: boolean;
    poBox: boolean;
    autoLock: boolean;
    unreachableAccess: boolean;
    carrierRejected: boolean;
    carrierId?: string;
    qualityDecision?: string;
    sourceIds: string[];
    qualityScoreExcluded: true;
  };
  privacy: {
    privateMode: 'redacted-field-report';
    rawAddressIncluded: false;
    correctedAddressIncluded: false;
    recipientIncluded: false;
  };
};

export type AddressQualityFeedbackSubmitResult = {
  status: 'sent' | 'queued';
  submission: AddressQualityFeedbackSubmission;
  responseId?: string;
  queuedReason?: string;
};

function currentStorage(): StorageLike | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}

function currentFetch(): FetchLike | undefined {
  return typeof fetch === 'function' ? fetch.bind(globalThis) : undefined;
}

function readJson<T>(storage: StorageLike | undefined, key: string, fallback: T): T {
  if (!storage) return fallback;
  try {
    const parsed = JSON.parse(storage.getItem(key) || '');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function cleanText(value: unknown, maxLength = 240) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function sanitizeOperatorNote(value: unknown) {
  const text = cleanText(value);
  if (!text) return undefined;
  const redacted = text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[redacted-phone]');
  return redacted.trim() || undefined;
}

function createSubmissionId(record: AddressFeedbackRecord, now: Date) {
  const timestamp = Date.parse(now.toISOString()).toString(36);
  const suffix = cleanText(record.id, 16).replace(/[^a-z0-9_-]/gi, '').slice(-8) || 'feedback';
  return `aqf_${timestamp}_${suffix}`;
}

function normalizeSourceIds(values: string[]) {
  return Array.from(new Set(values.map(value => cleanText(value, 80)).filter(Boolean))).slice(0, 12);
}

export function buildAddressQualityFeedbackSubmission(
  record: AddressFeedbackRecord,
  now: Date = new Date(),
): AddressQualityFeedbackSubmission {
  return {
    version: 'address-quality-feedback-v1',
    id: createSubmissionId(record, now),
    submittedAt: now.toISOString(),
    recordId: record.id,
    source: record.source,
    agidTail: record.agidTail,
    countryCode: record.countryCode,
    languageTab: record.languageTab,
    issue: record.issue,
    severity: record.severity,
    operatorNote: sanitizeOperatorNote(record.userNote),
    context: {
      hasPostcode: Boolean(record.context.hasPostcode),
      hasStreet: Boolean(record.context.hasStreet),
      hasBuilding: Boolean(record.context.hasBuilding),
      isSea: Boolean(record.context.isSea),
      undeliverableRegion: Boolean(record.context.undeliverableRegion),
      poBox: Boolean(record.context.poBox),
      autoLock: Boolean(record.context.autoLock),
      unreachableAccess: Boolean(record.context.unreachableAccess),
      carrierRejected: Boolean(record.context.carrierRejected),
      carrierId: record.context.carrierId,
      qualityDecision: record.context.qualityDecision,
      sourceIds: normalizeSourceIds(record.context.sourceIds),
      qualityScoreExcluded: true,
    },
    privacy: {
      privateMode: 'redacted-field-report',
      rawAddressIncluded: false,
      correctedAddressIncluded: false,
      recipientIncluded: false,
    },
  };
}

export function loadAddressQualityFeedbackOutbox(
  storage: StorageLike | undefined = currentStorage(),
): AddressQualityFeedbackSubmission[] {
  const parsed = readJson<unknown>(storage, ADDRESS_QUALITY_FEEDBACK_OUTBOX_STORAGE_KEY, []);
  return Array.isArray(parsed)
    ? parsed.filter(item => item?.version === 'address-quality-feedback-v1') as AddressQualityFeedbackSubmission[]
    : [];
}

export function appendAddressQualityFeedbackOutbox(
  submission: AddressQualityFeedbackSubmission,
  storage: StorageLike | undefined = currentStorage(),
  limit = 200,
) {
  const outbox = loadAddressQualityFeedbackOutbox(storage);
  const next = [...outbox.filter(item => item.id !== submission.id), submission].slice(-limit);
  storage?.setItem(ADDRESS_QUALITY_FEEDBACK_OUTBOX_STORAGE_KEY, JSON.stringify(next));
  return next;
}

async function readResponseId(response: Response) {
  try {
    const body = await response.clone().json() as { data?: { feedbackId?: unknown }; feedbackId?: unknown };
    const value = body.data?.feedbackId ?? body.feedbackId;
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  } catch {
    return undefined;
  }
}

export async function submitAddressQualityFeedback(
  record: AddressFeedbackRecord,
  options: {
    fetchImpl?: FetchLike;
    storage?: StorageLike;
    endpoint?: string;
    now?: Date;
  } = {},
): Promise<AddressQualityFeedbackSubmitResult> {
  const submission = buildAddressQualityFeedbackSubmission(record, options.now);
  const fetchImpl = options.fetchImpl ?? currentFetch();
  const storage = options.storage ?? currentStorage();
  const endpoint = options.endpoint ?? apiEndpoints.addressQualityFeedback();

  if (!fetchImpl) {
    appendAddressQualityFeedbackOutbox(submission, storage);
    return { status: 'queued', submission, queuedReason: 'fetch-unavailable' };
  }

  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AGID-Request-ID': submission.id,
      },
      body: JSON.stringify(submission),
      cache: 'no-store',
    });
    if (response.ok) {
      return { status: 'sent', submission, responseId: await readResponseId(response) };
    }
    appendAddressQualityFeedbackOutbox(submission, storage);
    return { status: 'queued', submission, queuedReason: `http-${response.status}` };
  } catch {
    appendAddressQualityFeedbackOutbox(submission, storage);
    return { status: 'queued', submission, queuedReason: 'network-error' };
  }
}

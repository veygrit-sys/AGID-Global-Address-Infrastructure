import type { Express } from 'express';

import { sendAgidResult } from '../agidResult';
import { objectBody, type JsonRecord } from '../requestParsing';

type AddressQualityFeedbackInboxItem = {
  feedbackId: string;
  acceptedAt: string;
  body: JsonRecord;
};

type AddressQualityFeedbackInboxStore = {
  add: (body: JsonRecord, now?: Date) => AddressQualityFeedbackInboxItem;
  recent: () => AddressQualityFeedbackInboxItem[];
};

const FORBIDDEN_RAW_KEYS = new Set([
  'addressdisplay',
  'correctedaddress',
  'correcteddisplay',
  'email',
  'name',
  'originaladdress',
  'originaldisplay',
  'phone',
  'rawaddress',
  'recipient',
  'telephone',
]);

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[^a-z]/g, '');
}

function createFeedbackId(body: JsonRecord, now: Date) {
  const id = typeof body.id === 'string' ? body.id.replace(/[^a-z0-9_-]/gi, '').slice(0, 80) : '';
  const timestamp = Date.parse(now.toISOString()).toString(36);
  return id ? `srv_${id}` : `srv_aqf_${timestamp}`;
}

function findForbiddenRawKey(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findForbiddenRawKey(item);
      if (nested) return nested;
    }
    return undefined;
  }
  if (!value || typeof value !== 'object') return undefined;

  for (const [key, nestedValue] of Object.entries(value as JsonRecord)) {
    const normalized = normalizeKey(key);
    if (FORBIDDEN_RAW_KEYS.has(normalized)) return key;
    const nested = findForbiddenRawKey(nestedValue);
    if (nested) return nested;
  }
  return undefined;
}

function findPrivateTextValue(value: unknown, key = ''): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findPrivateTextValue(item, key);
      if (nested) return nested;
    }
    return undefined;
  }
  if (!value || typeof value !== 'object') {
    if (typeof value !== 'string') return undefined;
    if (!/(note|comment|message)/.test(normalizeKey(key))) return undefined;
    if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value)) return 'email-like text';
    if (/\+?\d[\d\s().-]{7,}\d/.test(value)) return 'phone-like text';
    return undefined;
  }

  for (const [nestedKey, nestedValue] of Object.entries(value as JsonRecord)) {
    const nested = findPrivateTextValue(nestedValue, nestedKey);
    if (nested) return nested;
  }
  return undefined;
}

function hasRedactedPrivacyFlags(body: JsonRecord) {
  const privacy = objectBody(body.privacy);
  return privacy.privateMode === 'redacted-field-report'
    && privacy.rawAddressIncluded === false
    && privacy.correctedAddressIncluded === false
    && privacy.recipientIncluded === false;
}

export function createInMemoryAddressQualityFeedbackInbox(limit = 500): AddressQualityFeedbackInboxStore {
  const items: AddressQualityFeedbackInboxItem[] = [];
  return {
    add(body, now = new Date()) {
      const item = {
        feedbackId: createFeedbackId(body, now),
        acceptedAt: now.toISOString(),
        body,
      };
      items.push(item);
      if (items.length > limit) items.splice(0, items.length - limit);
      return item;
    },
    recent() {
      return [...items].reverse();
    },
  };
}

export function registerAddressQualityFeedbackRoutes(
  app: Express,
  options: { store?: AddressQualityFeedbackInboxStore } = {},
) {
  const store = options.store ?? createInMemoryAddressQualityFeedbackInbox();

  app.get('/api/address-quality/feedback/capabilities', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: {
        accepts: ['address-quality-feedback-v1'],
        redactedOnly: true,
        rawAddressStorage: false,
        offlineOutboxSupported: true,
        rejectedFields: Array.from(FORBIDDEN_RAW_KEYS).sort(),
      },
      confidence: 1,
      sources: ['agid-address-quality-feedback'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/address-quality/feedback', (req, res) => {
    const body = objectBody(req.body);
    const forbiddenKey = findForbiddenRawKey(body);
    if (forbiddenKey) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Raw address feedback payload rejected',
        sources: ['agid-address-quality-feedback'],
        warnings: [`Forbidden raw/private field: ${forbiddenKey}`],
        cache: 'none',
      }, 400);
    }

    const privateText = findPrivateTextValue(body);
    if (privateText) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Private text feedback payload rejected',
        sources: ['agid-address-quality-feedback'],
        warnings: [`Redact ${privateText} before sending field feedback.`],
        cache: 'none',
      }, 400);
    }

    if (body.version !== 'address-quality-feedback-v1' || !hasRedactedPrivacyFlags(body)) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Address quality feedback must be redacted-field-report v1',
        sources: ['agid-address-quality-feedback'],
        warnings: ['Use privacy.rawAddressIncluded=false, correctedAddressIncluded=false, recipientIncluded=false.'],
        cache: 'none',
      }, 400);
    }

    const accepted = store.add(body);
    return sendAgidResult(req, res, {
      ok: true,
      data: {
        feedbackId: accepted.feedbackId,
        acceptedAt: accepted.acceptedAt,
        inboxSize: store.recent().length,
        redactedOnly: true,
        rawAddressStorage: false,
      },
      confidence: 0.9,
      sources: ['agid-address-quality-feedback'],
      warnings: [],
      cache: 'none',
    }, 202);
  });
}

import { sha256Hex } from './sha256';

export const ADDRESS_NOTIFICATION_VERSION = 'agid-address-notification-v1';

export const ADDRESS_NOTIFICATION_CHANNELS = [
  'sms',
  'email',
  'voice',
  'whatsapp',
  'push',
  'webhook',
  'in-app',
] as const;

export const ADDRESS_NOTIFICATION_EVENTS = [
  'recipient-confirmation-required',
  'delivery-qr-expiring',
  'delivery-qr-expired',
  'reverification-required',
  'handoff-ready',
  'handoff-complete',
  'address-link-granted',
  'credential-revoked',
  'offline-sync-conflict',
  'manual-review-required',
  'return-label-ready',
  'aid-eligibility-review',
  'agid-s-key-rotation',
] as const;

export const ADDRESS_NOTIFICATION_STATUSES = ['ready', 'review', 'rejected'] as const;

export type AddressNotificationChannel = typeof ADDRESS_NOTIFICATION_CHANNELS[number];
export type AddressNotificationEvent = typeof ADDRESS_NOTIFICATION_EVENTS[number];
export type AddressNotificationStatus = typeof ADDRESS_NOTIFICATION_STATUSES[number];

export type AddressNotificationProviderFamily =
  | 'twilio-messaging-like'
  | 'twilio-voice-like'
  | 'sendgrid-email-like'
  | 'webhook-like'
  | 'local-only';

export type AddressNotificationLocale = 'en' | 'ja';

export type AddressNotificationDestinationInput = {
  alias?: unknown;
  privateDestinationRef?: unknown;
  rawDestination?: unknown;
  persistRawDestination?: boolean;
};

export type AddressNotificationInput = {
  event?: AddressNotificationEvent | string;
  channel?: AddressNotificationChannel | string;
  locale?: AddressNotificationLocale | string;
  reasonCode?: unknown;
  actionAlias?: unknown;
  shortLink?: unknown;
  destination?: AddressNotificationDestinationInput;
  highRiskMode?: boolean;
  createdAt?: string;
  expiresAt?: string;
  unsafeBodyOverride?: unknown;
  unsafeSubjectOverride?: unknown;
  metadata?: unknown;
};

export type AddressNotificationAction = {
  label: string;
  alias: string;
  shortLink?: string;
  expiresAt: string;
};

export type AddressNotificationPlan = {
  modelVersion: typeof ADDRESS_NOTIFICATION_VERSION;
  notificationId: string;
  status: AddressNotificationStatus;
  event: AddressNotificationEvent;
  channel: AddressNotificationChannel;
  providerFamily: AddressNotificationProviderFamily;
  locale: AddressNotificationLocale;
  title: string;
  body: string;
  action: AddressNotificationAction | null;
  destinationAlias: string;
  reasonCode: string;
  createdAt: string;
  expiresAt: string;
  templateId: string;
  messageHash: string;
  metadataCommitment: string | null;
  requiredControls: string[];
  errors: string[];
  warnings: string[];
  privacy: {
    addressInBody: false;
    rawAgidInBody: false;
    rawAoidInBody: false;
    phoneOrEmailInBody: false;
    rawDestinationStored: false;
    publicPayload: 'status-template-alias-message-hash-only';
  };
};

type TemplateDefinition = {
  event: AddressNotificationEvent;
  requiredAction: boolean;
  titles: Record<AddressNotificationLocale, string>;
  bodies: Record<AddressNotificationLocale, string>;
  actionLabels: Record<AddressNotificationLocale, string>;
  defaultReasonCode: string;
};

const DEFAULT_TTL_SECONDS = 15 * 60;
const HIGH_RISK_TTL_SECONDS = 5 * 60;

const TEMPLATE_DEFINITIONS: Record<AddressNotificationEvent, TemplateDefinition> = {
  'recipient-confirmation-required': {
    event: 'recipient-confirmation-required',
    requiredAction: true,
    titles: { en: 'Recipient confirmation required', ja: '受取確認が必要です' },
    bodies: {
      en: 'Please confirm receipt with the secure short-lived link.',
      ja: '短期リンクから受取確認をしてください。',
    },
    actionLabels: { en: 'Confirm receipt', ja: '受取確認' },
    defaultReasonCode: 'recipient-confirmation-required',
  },
  'delivery-qr-expiring': {
    event: 'delivery-qr-expiring',
    requiredAction: true,
    titles: { en: 'Delivery QR expires soon', ja: '配送QRの期限が近づいています' },
    bodies: {
      en: 'The delivery QR will expire soon. Use the short-lived link or request a fresh QR.',
      ja: '配送QRの期限が近づいています。短期リンクを使うかQRを再発行してください。',
    },
    actionLabels: { en: 'Open short link', ja: '短期リンクを開く' },
    defaultReasonCode: 'qr-expiring',
  },
  'delivery-qr-expired': {
    event: 'delivery-qr-expired',
    requiredAction: true,
    titles: { en: 'Delivery QR expired', ja: '配送QRの期限が切れました' },
    bodies: {
      en: 'The delivery QR has expired. Request a new short-lived alias before handoff.',
      ja: '配送QRの期限が切れました。受け渡し前に短期aliasを再発行してください。',
    },
    actionLabels: { en: 'Request new alias', ja: 'aliasを再発行' },
    defaultReasonCode: 'qr-expired',
  },
  'reverification-required': {
    event: 'reverification-required',
    requiredAction: true,
    titles: { en: 'Reverification required', ja: '再照合が必要です' },
    bodies: {
      en: 'This address workflow needs reverification before it can continue.',
      ja: 'この住所ワークフローは続行前に再照合が必要です。',
    },
    actionLabels: { en: 'Start reverification', ja: '再照合を開始' },
    defaultReasonCode: 'reverification-required',
  },
  'handoff-ready': {
    event: 'handoff-ready',
    requiredAction: true,
    titles: { en: 'Handoff ready', ja: '受け渡し準備完了' },
    bodies: {
      en: 'The handoff can proceed after the local confirmation step.',
      ja: 'ローカル確認後に受け渡しできます。',
    },
    actionLabels: { en: 'Open handoff', ja: '受け渡しを開く' },
    defaultReasonCode: 'handoff-ready',
  },
  'handoff-complete': {
    event: 'handoff-complete',
    requiredAction: false,
    titles: { en: 'Handoff complete', ja: '受け渡し完了' },
    bodies: {
      en: 'The handoff was completed. A redacted receipt is available in the audit view.',
      ja: '受け渡しが完了しました。監査画面で秘匿済みreceiptを確認できます。',
    },
    actionLabels: { en: 'View receipt', ja: 'receiptを確認' },
    defaultReasonCode: 'handoff-complete',
  },
  'address-link-granted': {
    event: 'address-link-granted',
    requiredAction: false,
    titles: { en: 'Address access granted', ja: '住所アクセスが許可されました' },
    bodies: {
      en: 'A scoped address permission was granted. You can review or revoke it in the portal.',
      ja: '用途限定の住所権限が許可されました。ポータルで確認または取り消しできます。',
    },
    actionLabels: { en: 'Review access', ja: '権限を確認' },
    defaultReasonCode: 'address-link-granted',
  },
  'credential-revoked': {
    event: 'credential-revoked',
    requiredAction: true,
    titles: { en: 'Credential revoked', ja: 'credentialが失効しました' },
    bodies: {
      en: 'A credential used by this workflow was revoked. Reverify before continuing.',
      ja: 'このワークフローで使われるcredentialが失効しました。続行前に再検証してください。',
    },
    actionLabels: { en: 'Reverify', ja: '再検証' },
    defaultReasonCode: 'credential-revoked',
  },
  'offline-sync-conflict': {
    event: 'offline-sync-conflict',
    requiredAction: true,
    titles: { en: 'Offline sync conflict', ja: 'オフライン同期の衝突' },
    bodies: {
      en: 'An offline ledger conflict requires review before final acceptance.',
      ja: 'オフライン台帳の衝突があります。最終承認前に確認してください。',
    },
    actionLabels: { en: 'Open review', ja: '確認を開く' },
    defaultReasonCode: 'offline-sync-conflict',
  },
  'manual-review-required': {
    event: 'manual-review-required',
    requiredAction: true,
    titles: { en: 'Manual review required', ja: '手動確認が必要です' },
    bodies: {
      en: 'This case needs operator review before it can continue.',
      ja: 'このケースは続行前にオペレーター確認が必要です。',
    },
    actionLabels: { en: 'Open review', ja: '確認を開く' },
    defaultReasonCode: 'manual-review-required',
  },
  'return-label-ready': {
    event: 'return-label-ready',
    requiredAction: true,
    titles: { en: 'Return label ready', ja: '返送ラベル準備完了' },
    bodies: {
      en: 'A return label alias is ready. Open the short-lived link to continue.',
      ja: '返送ラベルaliasが準備できました。短期リンクを開いて続行してください。',
    },
    actionLabels: { en: 'Open return label', ja: '返送ラベルを開く' },
    defaultReasonCode: 'return-label-ready',
  },
  'aid-eligibility-review': {
    event: 'aid-eligibility-review',
    requiredAction: true,
    titles: { en: 'Aid eligibility review', ja: '支援資格の確認' },
    bodies: {
      en: 'Aid eligibility needs review using the secure short-lived alias.',
      ja: '短期aliasを使って支援資格を確認してください。',
    },
    actionLabels: { en: 'Review eligibility', ja: '支援資格を確認' },
    defaultReasonCode: 'aid-eligibility-review',
  },
  'agid-s-key-rotation': {
    event: 'agid-s-key-rotation',
    requiredAction: true,
    titles: { en: 'AGID-S key rotation required', ja: 'AGID-S鍵ローテーションが必要です' },
    bodies: {
      en: 'Rotate the AGID-S key before continuing with secure sharing.',
      ja: '安全共有を続ける前にAGID-S鍵をローテーションしてください。',
    },
    actionLabels: { en: 'Rotate key', ja: '鍵をローテーション' },
    defaultReasonCode: 'agid-s-key-rotation',
  },
};

const PRIVATE_KEY_PATTERNS = [
  /address/i,
  /raw.*agid/i,
  /^agid$/i,
  /raw.*aoid/i,
  /^aoid$/i,
  /coordinate/i,
  /latitude/i,
  /longitude/i,
  /^lat$/i,
  /^(lon|lng)$/i,
  /recipient/i,
  /phone/i,
  /email/i,
  /unit/i,
  /room/i,
  /proof.*code/i,
  /secret/i,
  /private.*key/i,
  /agid.*s/i,
  /secure.*token/i,
];

const PRIVATE_TEXT_PATTERNS = [
  /\b[A-Z]{2}\d[A-Z0-9]{8,20}\b/u,
  /\bAOID[-_:]?[A-Z0-9]{8,32}\b/iu,
  /\bAGIDS1-[A-Z2-7]{16,}\b/iu,
  /[-+]?\d{1,2}\.\d{4,}\s*,\s*[-+]?\d{1,3}\.\d{4,}/u,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/iu,
  /\+?\d[\d\s().-]{8,}\d/u,
  /(room|unit|suite|apt|apartment|floor)\s*[#A-Z0-9-]+/iu,
  /(番地|号室|部屋|丁目|緯度|経度)/u,
];

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const entries = Object.keys(value as Record<string, unknown>)
    .sort()
    .map(key => [key, (value as Record<string, unknown>)[key]] as const);
  return `{${entries.map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`).join(',')}}`;
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function safeText(value: unknown, fallback = '', maxLength = 120): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.trim().replace(/\s+/g, ' ');
  return cleaned ? cleaned.slice(0, maxLength) : fallback;
}

function normalizeChannel(value: unknown): AddressNotificationChannel {
  const normalized = safeText(value, 'in-app').toLowerCase().replace(/_/g, '-');
  if (normalized === 'mail') return 'email';
  if (normalized === 'wa') return 'whatsapp';
  if (ADDRESS_NOTIFICATION_CHANNELS.includes(normalized as AddressNotificationChannel)) {
    return normalized as AddressNotificationChannel;
  }
  return 'in-app';
}

function normalizeEvent(value: unknown): AddressNotificationEvent {
  const normalized = safeText(value, 'reverification-required').toLowerCase().replace(/_/g, '-');
  const aliases: Record<string, AddressNotificationEvent> = {
    confirm: 'recipient-confirmation-required',
    'recipient-confirm': 'recipient-confirmation-required',
    expired: 'delivery-qr-expired',
    'qr-expired': 'delivery-qr-expired',
    expiring: 'delivery-qr-expiring',
    'qr-expiring': 'delivery-qr-expiring',
    review: 'manual-review-required',
    conflict: 'offline-sync-conflict',
    revoked: 'credential-revoked',
    return: 'return-label-ready',
    aid: 'aid-eligibility-review',
    rotation: 'agid-s-key-rotation',
  };
  const aliased = aliases[normalized];
  if (aliased) return aliased;
  return ADDRESS_NOTIFICATION_EVENTS.includes(normalized as AddressNotificationEvent)
    ? normalized as AddressNotificationEvent
    : 'reverification-required';
}

function normalizeLocale(value: unknown): AddressNotificationLocale {
  const normalized = safeText(value, 'en').toLowerCase();
  return normalized.startsWith('ja') ? 'ja' : 'en';
}

function providerFamilyFor(channel: AddressNotificationChannel): AddressNotificationProviderFamily {
  if (channel === 'sms' || channel === 'whatsapp') return 'twilio-messaging-like';
  if (channel === 'voice') return 'twilio-voice-like';
  if (channel === 'email') return 'sendgrid-email-like';
  if (channel === 'webhook') return 'webhook-like';
  return 'local-only';
}

function providerChannelCapability(channel: AddressNotificationChannel): string {
  if (channel === 'sms') return 'short-text-message';
  if (channel === 'email') return 'template-email';
  if (channel === 'voice') return 'voice-prompt';
  if (channel === 'whatsapp') return 'approved-template-message';
  if (channel === 'push') return 'device-push';
  if (channel === 'webhook') return 'signed-event';
  return 'local-ui-notification';
}

function isoOrNow(value: unknown, now = new Date().toISOString()): string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : now;
}

function expiryFor(input: AddressNotificationInput, createdAt: string): { expiresAt: string; warnings: string[] } {
  const warnings: string[] = [];
  const ttlSeconds = input.highRiskMode ? HIGH_RISK_TTL_SECONDS : DEFAULT_TTL_SECONDS;
  const maxExpiry = new Date(Date.parse(createdAt) + ttlSeconds * 1000).toISOString();
  if (typeof input.expiresAt !== 'string' || Number.isNaN(Date.parse(input.expiresAt))) {
    return { expiresAt: maxExpiry, warnings };
  }
  if (Date.parse(input.expiresAt) > Date.parse(maxExpiry)) {
    warnings.push('address-notification-expiry-clamped-to-privacy-ttl');
    return { expiresAt: maxExpiry, warnings };
  }
  return { expiresAt: input.expiresAt, warnings };
}

function safeAlias(value: unknown, fallbackSeed: string): string {
  const text = safeText(value, '', 96);
  if (/^[A-Za-z0-9][A-Za-z0-9:._/-]{2,95}$/.test(text)) return text;
  return `ANL-${sha256Hex(fallbackSeed).slice(0, 18).toUpperCase()}`;
}

function safeShortLink(value: unknown): string | undefined {
  const text = safeText(value, '', 240);
  if (!text) return undefined;
  if (/^(https:\/\/|agid:\/\/|app:\/\/)[A-Za-z0-9./?=&_%#:-]+$/u.test(text)) return text;
  return undefined;
}

function normalizeReasonCode(value: unknown, fallback: string): string {
  const text = safeText(value, fallback, 80)
    .toLowerCase()
    .replace(/[^a-z0-9:._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return text || fallback;
}

function findPrivateKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findPrivateKeys(item, `${prefix}[${index}]`));
  }
  const findings: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (PRIVATE_KEY_PATTERNS.some(pattern => pattern.test(key))) findings.push(path);
    findings.push(...findPrivateKeys(nested, path));
  }
  return findings;
}

function findPrivateText(value: string): string[] {
  return PRIVATE_TEXT_PATTERNS
    .filter(pattern => pattern.test(value))
    .map(pattern => pattern.source);
}

function actionRequiredFor(event: AddressNotificationEvent) {
  return TEMPLATE_DEFINITIONS[event].requiredAction;
}

function subjectFor(channel: AddressNotificationChannel, template: TemplateDefinition, locale: AddressNotificationLocale, override: unknown) {
  const fallback = template.titles[locale];
  if (override === undefined || override === null) return fallback;
  return safeText(override, fallback, channel === 'sms' || channel === 'whatsapp' ? 80 : 120);
}

function bodyFor(channel: AddressNotificationChannel, template: TemplateDefinition, locale: AddressNotificationLocale, override: unknown) {
  const fallback = template.bodies[locale];
  if (override === undefined || override === null) return fallback;
  const maxLength = channel === 'sms' || channel === 'whatsapp' ? 240 : channel === 'voice' ? 180 : 600;
  return safeText(override, fallback, maxLength);
}

function templateId(event: AddressNotificationEvent, channel: AddressNotificationChannel, locale: AddressNotificationLocale) {
  return `address-notification.${event}.${channel}.${locale}.v1`;
}

export function buildAddressNotification(input: AddressNotificationInput = {}): AddressNotificationPlan {
  const event = normalizeEvent(input.event);
  const channel = normalizeChannel(input.channel);
  const locale = normalizeLocale(input.locale);
  const createdAt = isoOrNow(input.createdAt);
  const { expiresAt, warnings: expiryWarnings } = expiryFor(input, createdAt);
  const template = TEMPLATE_DEFINITIONS[event];
  const fallbackSeed = stableJson({
    event,
    channel,
    createdAt,
    destination: input.destination?.alias,
    actionAlias: input.actionAlias,
  });
  const actionAlias = safeAlias(input.actionAlias, fallbackSeed);
  const destinationAlias = safeAlias(input.destination?.alias, `destination:${fallbackSeed}`);
  const shortLink = safeShortLink(input.shortLink);
  const title = subjectFor(channel, template, locale, input.unsafeSubjectOverride);
  const body = bodyFor(channel, template, locale, input.unsafeBodyOverride);
  const reasonCode = normalizeReasonCode(input.reasonCode, template.defaultReasonCode);
  const errors: string[] = [];
  const warnings = [...expiryWarnings];
  const metadataPrivateKeys = findPrivateKeys(input.metadata);
  const subjectPrivateText = findPrivateText(title);
  const bodyPrivateText = findPrivateText(body);
  const shortLinkPrivateText = shortLink ? findPrivateText(shortLink) : [];

  if (metadataPrivateKeys.length > 0) {
    errors.push('address-notification-metadata-contains-private-material');
    warnings.push(`address-notification-private-metadata-paths:${metadataPrivateKeys.slice(0, 6).join(',')}`);
  }
  if (subjectPrivateText.length > 0 || bodyPrivateText.length > 0 || shortLinkPrivateText.length > 0) {
    errors.push('address-notification-message-contains-private-material');
  }
  if (input.destination?.persistRawDestination) {
    errors.push('address-notification-must-not-persist-raw-destination');
  }
  if (input.destination?.rawDestination && !input.destination.privateDestinationRef) {
    warnings.push('address-notification-raw-destination-is-transient-provider-boundary-only');
  }
  if (actionRequiredFor(event) && !input.actionAlias && !shortLink) {
    errors.push('address-notification-action-alias-required');
  }
  if (Date.parse(expiresAt) <= Date.parse(createdAt)) {
    errors.push('address-notification-expired-before-created');
  }
  if (channel === 'whatsapp') {
    warnings.push('whatsapp-style-notifications-should-use-approved-templates');
  }
  if (channel === 'voice') {
    warnings.push('voice-notifications-should-use-short-neutral-prompts');
  }
  if (input.highRiskMode) {
    warnings.push('high-risk-notification-uses-short-ttl-and-alias-only-content');
  }

  const status: AddressNotificationStatus = errors.length > 0
    ? 'rejected'
    : input.highRiskMode && channel === 'email'
      ? 'review'
      : 'ready';
  const action: AddressNotificationAction | null = actionRequiredFor(event) || input.actionAlias || shortLink
    ? {
        label: template.actionLabels[locale],
        alias: actionAlias,
        ...(shortLink ? { shortLink } : {}),
        expiresAt,
      }
    : null;
  const publicMaterial = {
    event,
    channel,
    locale,
    title,
    body,
    actionAlias: action?.alias,
    expiresAt,
    reasonCode,
    destinationAlias,
  };
  const messageHash = sha256Hex(stableJson(publicMaterial));
  const metadataCommitment = input.metadata === undefined ? null : sha256Hex(stableJson(input.metadata));
  const notificationId = `AN-${sha256Hex(stableJson({
    messageHash,
    destinationAlias,
    createdAt,
    metadataCommitment,
  })).slice(0, 22).toUpperCase()}`;

  return {
    modelVersion: ADDRESS_NOTIFICATION_VERSION,
    notificationId,
    status,
    event,
    channel,
    providerFamily: providerFamilyFor(channel),
    locale,
    title,
    body,
    action,
    destinationAlias,
    reasonCode,
    createdAt,
    expiresAt,
    templateId: templateId(event, channel, locale),
    messageHash,
    metadataCommitment,
    requiredControls: unique([
      'template-only-message-body',
      'short-lived-action-alias',
      'no-address-in-body',
      'no-raw-destination-persistence',
      'message-hash-audit',
      providerChannelCapability(channel),
      ...(input.highRiskMode ? ['high-risk-short-ttl', 'no-history-retention'] : []),
    ]),
    errors,
    warnings: unique(warnings),
    privacy: {
      addressInBody: false,
      rawAgidInBody: false,
      rawAoidInBody: false,
      phoneOrEmailInBody: false,
      rawDestinationStored: false,
      publicPayload: 'status-template-alias-message-hash-only',
    },
  };
}

export function validateAddressNotificationPlan(plan: AddressNotificationPlan): {
  ok: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors = [...plan.errors];
  const warnings = [...plan.warnings];
  if (findPrivateText(`${plan.title}\n${plan.body}\n${plan.action?.shortLink ?? ''}`).length > 0) {
    errors.push('address-notification-plan-contains-private-text');
  }
  if (plan.privacy.addressInBody || plan.privacy.rawAgidInBody || plan.privacy.rawAoidInBody || plan.privacy.phoneOrEmailInBody) {
    errors.push('address-notification-privacy-flags-must-remain-false');
  }
  if (plan.action && Date.parse(plan.action.expiresAt) !== Date.parse(plan.expiresAt)) {
    warnings.push('address-notification-action-expiry-differs-from-plan-expiry');
  }
  if (plan.status === 'ready' && errors.length > 0) errors.push('address-notification-ready-plan-has-errors');
  return {
    ok: errors.length === 0,
    errors: unique(errors),
    warnings: unique(warnings),
  };
}

export function listAddressNotificationTemplates() {
  return ADDRESS_NOTIFICATION_EVENTS.map(event => {
    const template = TEMPLATE_DEFINITIONS[event];
    return {
      event,
      requiredAction: template.requiredAction,
      defaultReasonCode: template.defaultReasonCode,
      channels: [...ADDRESS_NOTIFICATION_CHANNELS],
      locales: ['en', 'ja'] as const,
    };
  });
}

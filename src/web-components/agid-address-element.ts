import {
  buildAddressElementSession,
  type AddressElementFieldInput,
  type AddressElementFieldKey,
  type AddressElementSession,
} from '../lib/addressElement';
import {
  buildAddressElementPublicEvents,
  type AddressElementHostSurface,
  type AddressElementPublicEvent,
} from '../lib/addressElementEvents';
import {
  buildAddressLinkSession,
  type AddressLinkCapability,
} from '../lib/addressLink';
import {
  assessAddressElementReadiness,
  type AddressElementReadiness,
} from '../lib/addressElementReadiness';
import type { AddressIntentMode, AddressIntentPurpose } from '../lib/addressIntent';
import { getAddressFormat, type AddressFormat } from '../data/address_formats';
import {
  buildAddressElementFormFields,
  buildAddressElementLanguageTabs,
  describeAddressElementCountryForm,
  normalizeAddressElementCountryCode,
  pickAddressElementLanguage,
} from '../lib/addressElementCountryForm';

export const AGID_ADDRESS_ELEMENT_WEB_COMPONENT_VERSION = 'agid-address-element-web-component-v0.1';
export const AGID_ADDRESS_ELEMENT_TAG_NAME = 'agid-address-element';

export type AgidAddressElementWebComponentEventName =
  | 'agid-address-element:session-change'
  | 'agid-address-element:ready'
  | 'agid-address-element:needs-review'
  | 'agid-address-element:blocked'
  | 'agid-address-element:intent-preview'
  | 'agid-address-element:qr-nfc-requested'
  | 'agid-address-element:submit';

export type AgidAddressElementWebComponentDetail = {
  modelVersion: typeof AGID_ADDRESS_ELEMENT_WEB_COMPONENT_VERSION;
  tagName: typeof AGID_ADDRESS_ELEMENT_TAG_NAME;
  sessionId: string;
  intentId: string;
  status: AddressElementSession['status'];
  qualityDecision: AddressElementSession['quality']['decision'];
  intentStatus: AddressElementSession['intentPreview']['status'];
  nextAction: AddressElementSession['nextActions'][number];
  countryCode: string | null;
  selectedLanguage: string;
  readiness: AddressElementReadiness['publicMetadata'];
  publicEvents: AddressElementPublicEvent[];
  privacyBoundary: 'web-component-no-raw-address';
};

export type AgidAddressElementDefinitionResult =
  | {
      defined: true;
      tagName: typeof AGID_ADDRESS_ELEMENT_TAG_NAME;
      alreadyDefined: boolean;
    }
  | {
      defined: false;
      tagName: typeof AGID_ADDRESS_ELEMENT_TAG_NAME;
      reason: 'dom-unavailable' | 'custom-elements-unavailable';
    };

const DEFAULT_LINK_CAPABILITIES: AddressLinkCapability[] = [
  'delivery-eligibility',
  'coarse-region',
];

function normalizeBooleanAttribute(value: string | null) {
  if (value === null) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '' || normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function normalizePurpose(value: string | null): AddressIntentPurpose {
  return ['delivery', 'return', 'aid', 'identity', 'customs'].includes(value || '')
    ? value as AddressIntentPurpose
    : 'delivery';
}

function normalizeMode(value: string | null): AddressIntentMode {
  return ['local', 'server', 'zk', 'ethereum', 'full'].includes(value || '')
    ? value as AddressIntentMode
    : 'local';
}

function normalizeSurface(value: string | null): AddressElementHostSurface {
  return ['ec', 'cms', 'pos', 'shopping-agent', 'registration', 'custom'].includes(value || '')
    ? value as AddressElementHostSurface
    : 'custom';
}

function normalizeCountryCode(value: string | null | undefined) {
  return normalizeAddressElementCountryCode(value);
}

function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
}

function css() {
  return `
    :host {
      --agid-ae-bg: #0f172a;
      --agid-ae-panel: #111c31;
      --agid-ae-panel-strong: #17243b;
      --agid-ae-text: #f8fafc;
      --agid-ae-muted: #94a3b8;
      --agid-ae-border: #2b3a55;
      --agid-ae-blue: #2563eb;
      --agid-ae-emerald: #10b981;
      --agid-ae-amber: #f59e0b;
      --agid-ae-red: #ef4444;
      display: block;
      color: var(--agid-ae-text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      min-width: 280px;
    }
    *, *::before, *::after { box-sizing: border-box; }
    .shell {
      overflow: hidden;
      border: 1px solid var(--agid-ae-border);
      border-radius: 16px;
      background: var(--agid-ae-bg);
      box-shadow: 0 20px 60px rgb(15 23 42 / 35%);
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--agid-ae-border);
      background: linear-gradient(180deg, rgb(255 255 255 / 5%), rgb(255 255 255 / 0%));
    }
    .brand {
      display: flex;
      min-width: 0;
      gap: 10px;
      align-items: center;
    }
    .mark {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      flex: 0 0 34px;
      border-radius: 10px;
      background: var(--agid-ae-blue);
      color: white;
      font-size: 17px;
      font-weight: 900;
    }
    .title {
      margin: 0;
      font-size: 14px;
      line-height: 18px;
      font-weight: 900;
      letter-spacing: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .subtitle {
      margin: 0;
      color: var(--agid-ae-muted);
      font-size: 11px;
      line-height: 15px;
      font-weight: 700;
    }
    .status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 32px;
      padding: 0 10px;
      border: 1px solid currentColor;
      border-radius: 10px;
      font-size: 11px;
      line-height: 14px;
      font-weight: 900;
      white-space: nowrap;
      text-transform: uppercase;
    }
    .status[data-tone="verified"] { color: #bbf7d0; background: rgb(16 185 129 / 14%); }
    .status[data-tone="partial"], .status[data-tone="needs_review"] { color: #fde68a; background: rgb(245 158 11 / 14%); }
    .status[data-tone="blocked"] { color: #fecaca; background: rgb(239 68 68 / 14%); }
    .body {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 238px;
      gap: 14px;
      padding: 14px;
    }
    .tabs, .toggles, .scope-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    button {
      font-family: inherit;
      cursor: pointer;
      border: 1px solid var(--agid-ae-border);
      color: var(--agid-ae-text);
      background: var(--agid-ae-panel);
      border-radius: 10px;
      min-height: 38px;
      padding: 0 11px;
      font-size: 12px;
      line-height: 16px;
      font-weight: 850;
      letter-spacing: 0;
    }
    button:hover { background: var(--agid-ae-panel-strong); }
    button[aria-pressed="true"] {
      background: white;
      color: #0f172a;
      border-color: white;
    }
    .fields {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-top: 12px;
    }
    .form-note {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 2px 10px;
      align-items: center;
      margin-top: 10px;
      border: 1px solid var(--agid-ae-border);
      border-radius: 12px;
      background: rgb(255 255 255 / 4%);
      padding: 10px;
    }
    .form-note strong {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
      line-height: 16px;
      font-weight: 900;
    }
    .form-note span {
      grid-column: 1 / -1;
      color: var(--agid-ae-muted);
      font-size: 11px;
      line-height: 15px;
      font-weight: 750;
    }
    .form-note em {
      border: 1px solid var(--agid-ae-border);
      border-radius: 999px;
      color: #bfdbfe;
      background: rgb(37 99 235 / 12%);
      padding: 3px 7px;
      font-size: 9px;
      line-height: 12px;
      font-style: normal;
      font-weight: 900;
      text-transform: uppercase;
    }
    label {
      display: grid;
      gap: 5px;
      min-width: 0;
    }
    .label-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      min-height: 14px;
      color: var(--agid-ae-muted);
      font-size: 10px;
      line-height: 14px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0;
    }
    .required { color: #fcd34d; }
    input {
      width: 100%;
      min-width: 0;
      height: 40px;
      border: 1px solid var(--agid-ae-border);
      border-radius: 10px;
      background: #0b1221;
      color: white;
      padding: 0 11px;
      font-family: inherit;
      font-size: 13px;
      line-height: 18px;
      font-weight: 720;
      outline: none;
    }
    input::placeholder { color: #64748b; }
    input:focus { border-color: #60a5fa; box-shadow: 0 0 0 3px rgb(37 99 235 / 22%); }
    input[data-missing="true"] { border-color: rgb(245 158 11 / 78%); }
    input[data-private="true"] { background: #101827; }
    .side {
      display: grid;
      align-content: start;
      gap: 10px;
    }
    .panel {
      border: 1px solid var(--agid-ae-border);
      border-radius: 14px;
      background: var(--agid-ae-panel);
      padding: 12px;
    }
    .panel-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 10px;
      color: #e2e8f0;
      font-size: 12px;
      line-height: 16px;
      font-weight: 900;
    }
    .mini-status {
      border: 1px solid var(--agid-ae-border);
      border-radius: 7px;
      padding: 4px 6px;
      color: var(--agid-ae-muted);
      font-size: 10px;
      line-height: 12px;
      font-weight: 900;
      text-transform: uppercase;
    }
    .toggle-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }
    .toggle-grid button {
      display: grid;
      place-items: center;
      min-height: 52px;
      padding: 4px;
      font-size: 11px;
    }
    .scope-list button {
      min-height: 32px;
      padding: 0 9px;
      font-size: 11px;
    }
    .high-risk {
      width: 100%;
      justify-content: space-between;
      display: flex;
      align-items: center;
    }
    .next-actions {
      display: grid;
      gap: 6px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .next-actions li {
      min-height: 28px;
      border-radius: 8px;
      background: #0b1221;
      color: #cbd5e1;
      padding: 7px 9px;
      font-size: 11px;
      line-height: 14px;
      font-weight: 780;
    }
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 14px;
      border-top: 1px solid var(--agid-ae-border);
      color: var(--agid-ae-muted);
      font-size: 11px;
      line-height: 15px;
      font-weight: 750;
    }
    .footer strong { color: #dbeafe; }
    .submit {
      min-width: 118px;
      background: var(--agid-ae-blue);
      border-color: var(--agid-ae-blue);
      color: white;
    }
    :host([compact]) .body {
      grid-template-columns: 1fr;
    }
    :host([compact]) .fields {
      grid-template-columns: 1fr;
    }
    @media (max-width: 640px) {
      .body { grid-template-columns: 1fr; }
      .fields { grid-template-columns: 1fr; }
      .header { align-items: flex-start; }
      .status { min-height: 28px; }
    }
  `;
}

function stableEventNames(publicEvents: AddressElementPublicEvent[]): AgidAddressElementWebComponentEventName[] {
  const names: AgidAddressElementWebComponentEventName[] = ['agid-address-element:session-change'];
  if (publicEvents.some(event => event.type === 'intent_preview')) names.push('agid-address-element:intent-preview');
  if (publicEvents.some(event => event.type === 'ready')) names.push('agid-address-element:ready');
  if (publicEvents.some(event => event.type === 'needs_review')) names.push('agid-address-element:needs-review');
  if (publicEvents.some(event => event.type === 'blocked')) names.push('agid-address-element:blocked');
  if (publicEvents.some(event => event.type === 'qr_nfc_requested')) names.push('agid-address-element:qr-nfc-requested');
  return names;
}

export function buildAgidAddressElementWebComponentDetail(input: {
  session: AddressElementSession;
  readiness: AddressElementReadiness;
  surface?: AddressElementHostSurface | string;
  timestamp?: string;
}): AgidAddressElementWebComponentDetail {
  const publicEvents = buildAddressElementPublicEvents({
    surface: input.surface,
    session: input.session,
    timestamp: input.timestamp,
  });
  return {
    modelVersion: AGID_ADDRESS_ELEMENT_WEB_COMPONENT_VERSION,
    tagName: AGID_ADDRESS_ELEMENT_TAG_NAME,
    sessionId: input.session.id,
    intentId: input.session.intentPreview.id,
    status: input.session.status,
    qualityDecision: input.session.quality.decision,
    intentStatus: input.session.intentPreview.status,
    nextAction: input.session.nextActions.find(action => action !== 'none') || 'none',
    countryCode: input.session.countryCode,
    selectedLanguage: input.session.selectedLanguage,
    readiness: input.readiness.publicMetadata,
    publicEvents,
    privacyBoundary: 'web-component-no-raw-address',
  };
}

export function listAgidAddressElementWebComponentContract() {
  return {
    modelVersion: AGID_ADDRESS_ELEMENT_WEB_COMPONENT_VERSION,
    tagName: AGID_ADDRESS_ELEMENT_TAG_NAME,
    attributes: [
      'country-code',
      'purpose',
      'mode',
      'host-surface',
      'default-language',
      'selected-language',
      'high-risk',
      'qr',
      'nfc',
      'agid-secure',
      'compact',
    ],
    events: [
      'agid-address-element:session-change',
      'agid-address-element:ready',
      'agid-address-element:needs-review',
      'agid-address-element:blocked',
      'agid-address-element:intent-preview',
      'agid-address-element:qr-nfc-requested',
      'agid-address-element:submit',
    ] satisfies AgidAddressElementWebComponentEventName[],
    methods: [
      'setFields(fields)',
      'setField(key, value)',
      'getSession()',
      'getPublicDetail()',
      'clear()',
    ],
    privacy: {
      rawFieldValuesReturned: false,
      publicEventsNoRawAddress: true,
      shadowDomHoldsLocalFormState: true,
      hostReceivesSessionIdsIntentIdsReadinessAndPublicEventsOnly: true,
    },
  };
}

function createAgidAddressElementClass(BaseHTMLElement: typeof HTMLElement) {
  return class AgidAddressElement extends BaseHTMLElement {
    static get observedAttributes() {
      return [
        'country-code',
        'purpose',
        'mode',
        'host-surface',
        'default-language',
        'selected-language',
        'high-risk',
        'qr',
        'nfc',
        'agid-secure',
        'compact',
      ];
    }

    private fields: AddressElementFieldInput = {};
    private selectedLanguage = 'local';
    private linkCapabilities: AddressLinkCapability[] = [...DEFAULT_LINK_CAPABILITIES];
    private addressFormat: AddressFormat | null = null;
    private formatLoadCountry = '';
    private formatLoadStatus: 'idle' | 'loading' | 'ready' | 'fallback' = 'idle';
    private hasRendered = false;
    private suppressAttributeRender = false;

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      this.selectedLanguage = this.getAttribute('selected-language') || this.getAttribute('default-language') || 'local';
      const countryCode = normalizeCountryCode(this.getAttribute('country-code'));
      if (countryCode && this.fields.countryCode !== countryCode) this.fields.countryCode = countryCode;
      this.renderAndEmit();
    }

    attributeChangedCallback() {
      if (this.suppressAttributeRender || !this.isConnected) return;
      if (this.getAttribute('selected-language') || this.getAttribute('default-language')) {
        this.selectedLanguage = this.getAttribute('selected-language') || this.getAttribute('default-language') || 'local';
      }
      const countryCode = normalizeCountryCode(this.getAttribute('country-code'));
      if (countryCode && this.fields.countryCode !== countryCode) this.fields.countryCode = countryCode;
      this.renderAndEmit();
    }

    setFields(fields: AddressElementFieldInput) {
      this.fields = {
        ...this.fields,
        ...Object.fromEntries(
          Object.entries(fields).map(([key, value]) => [key, typeof value === 'string' ? value : '']),
        ),
      };
      this.renderAndEmit();
    }

    setField(key: AddressElementFieldKey, value: string) {
      this.fields = {
        ...this.fields,
        [key]: value,
      };
      this.renderAndEmit();
    }

    clear() {
      this.fields = {
        countryCode: normalizeCountryCode(this.getAttribute('country-code')),
      };
      this.renderAndEmit();
    }

    getSession() {
      return this.createSession();
    }

    getPublicDetail() {
      const session = this.createSession();
      return this.createDetail(session);
    }

    private get highRiskMode() {
      return normalizeBooleanAttribute(this.getAttribute('high-risk'));
    }

    private get scanCapabilities() {
      return {
        qr: normalizeBooleanAttribute(this.getAttribute('qr')),
        nfc: normalizeBooleanAttribute(this.getAttribute('nfc')),
        agidSecure: normalizeBooleanAttribute(this.getAttribute('agid-secure')),
      };
    }

    private get surface() {
      return normalizeSurface(this.getAttribute('host-surface'));
    }

    private get purpose() {
      return normalizePurpose(this.getAttribute('purpose'));
    }

    private get mode() {
      return normalizeMode(this.getAttribute('mode'));
    }

    private get languageTabs() {
      const countryCode = normalizeCountryCode(this.fields.countryCode || this.getAttribute('country-code'));
      return buildAddressElementLanguageTabs(this.addressFormat, countryCode);
    }

    private get formFields() {
      return buildAddressElementFormFields(this.addressFormat, this.selectedLanguage);
    }

    private get countryFormSummary() {
      return describeAddressElementCountryForm(this.addressFormat, this.selectedLanguage);
    }

    private ensureCountryFormat() {
      const countryCode = normalizeCountryCode(this.fields.countryCode || this.getAttribute('country-code'));
      if (!countryCode) {
        this.addressFormat = null;
        this.formatLoadCountry = '';
        this.formatLoadStatus = 'fallback';
        return;
      }
      if (this.formatLoadCountry === countryCode && this.formatLoadStatus !== 'idle') return;

      this.formatLoadCountry = countryCode;
      this.formatLoadStatus = 'loading';
      getAddressFormat(countryCode).then(format => {
        if (this.formatLoadCountry !== countryCode) return;
        this.addressFormat = format;
        this.formatLoadStatus = format ? 'ready' : 'fallback';
        this.selectedLanguage = pickAddressElementLanguage(this.selectedLanguage, this.languageTabs);
        if (this.isConnected) this.renderAndEmit();
      });
    }

    private createSession() {
      return buildAddressElementSession({
        purpose: this.purpose,
        mode: this.mode,
        countryCode: this.fields.countryCode || normalizeCountryCode(this.getAttribute('country-code')),
        fields: this.fields,
        selectedLanguage: this.selectedLanguage,
        languageTabs: this.languageTabs,
        format: this.addressFormat,
        highRiskMode: this.highRiskMode,
        scanCapabilities: this.scanCapabilities,
        agidCandidate: this.scanCapabilities.agidSecure
          ? {
              present: true,
              exposure: 'agid-s',
              safeFingerprint: 'web-component-agid-s-ready',
              confidence: 0.78,
            }
          : undefined,
      });
    }

    private createReadiness(session: AddressElementSession) {
      const addressLinkSession = buildAddressLinkSession({
        surface: this.surface,
        purpose: this.purpose,
        mode: this.mode,
        requestedCapabilities: this.linkCapabilities,
        highRiskMode: this.highRiskMode,
        evidence: {
          addressElementSession: session,
          deliveryEligible: session.status === 'ready' && session.quality.decision === 'verified',
          qualityDecision: session.quality.decision,
          coarseRegion: session.countryCode
            ? { countryCode: session.countryCode, precision: 'country' }
            : undefined,
          commitments: {
            address: `web-component:${session.id}`,
            credential: `web-component-intent:${session.intentPreview.id}`,
          },
        },
      });
      return {
        addressLinkSession,
        readiness: assessAddressElementReadiness({
          session,
          hostSurface: this.surface,
          addressLinkStatus: addressLinkSession.status,
          requestedCapabilities: this.linkCapabilities,
          grantedScopes: addressLinkSession.grantedScopes,
          hasHostEventCallbacks: true,
          hasAddressLink: true,
          hasQrNfcControls: this.scanCapabilities.qr || this.scanCapabilities.nfc,
          hasHighRiskToggle: true,
          hasVisibleNextAction: true,
        }),
      };
    }

    private createDetail(session: AddressElementSession) {
      const { readiness } = this.createReadiness(session);
      return buildAgidAddressElementWebComponentDetail({
        session,
        readiness,
        surface: this.surface,
      });
    }

    private dispatchSafeEvents(detail: AgidAddressElementWebComponentDetail) {
      for (const eventName of stableEventNames(detail.publicEvents)) {
        this.dispatchEvent(new CustomEvent(eventName, {
          bubbles: true,
          composed: true,
          detail,
        }));
      }
    }

    private renderAndEmit() {
      this.ensureCountryFormat();
      this.selectedLanguage = pickAddressElementLanguage(this.selectedLanguage, this.languageTabs);
      const session = this.createSession();
      const { addressLinkSession, readiness } = this.createReadiness(session);
      const detail = buildAgidAddressElementWebComponentDetail({
        session,
        readiness,
        surface: this.surface,
      });
      this.render(session, readiness, addressLinkSession.status);
      this.dispatchSafeEvents(detail);
    }

    private toggleAttributeFlag(name: string) {
      this.suppressAttributeRender = true;
      if (this.hasAttribute(name)) this.removeAttribute(name);
      else this.setAttribute(name, '');
      this.suppressAttributeRender = false;
      this.renderAndEmit();
    }

    private setSelectedLanguage(language: string) {
      this.selectedLanguage = language;
      this.suppressAttributeRender = true;
      this.setAttribute('selected-language', language);
      this.suppressAttributeRender = false;
      this.renderAndEmit();
    }

    private render(
      session: AddressElementSession,
      readiness: AddressElementReadiness,
      addressLinkStatus: string,
    ) {
      if (!this.shadowRoot) return;
      const required = new Set(session.fields.filter(field => field.required).map(field => field.key));
      const present = new Set(session.fields.filter(field => field.present).map(field => field.key));
      const formFields = this.formFields;
      const countryFormSummary = this.countryFormSummary;
      const fieldHtml = formFields.map(field => `
        <label>
          <span class="label-row">
            <span>${escapeHtml(field.label)}</span>
            ${required.has(field.key) ? '<span class="required">required</span>' : ''}
          </span>
          <input
            data-field="${field.key}"
            data-private="${field.private ? 'true' : 'false'}"
            data-missing="${required.has(field.key) && !present.has(field.key) ? 'true' : 'false'}"
            value="${escapeHtml(field.fixedValue || this.fields[field.key] || '')}"
            autocomplete="${escapeHtml(field.autocomplete || 'off')}"
            type="${escapeHtml(field.type || 'text')}"
            inputmode="${escapeHtml(field.inputMode || 'text')}"
            ${field.pattern ? `pattern="${escapeHtml(field.pattern)}"` : ''}
            ${field.maxLength ? `maxlength="${field.maxLength}"` : ''}
            ${field.fixed ? 'readonly' : ''}
            placeholder="${field.private ? 'kept local' : escapeHtml(field.placeholder || field.label)}"
          />
        </label>
      `).join('');
      const tabs = session.languageTabs.map(tab => `
        <button
          type="button"
          data-language="${escapeHtml(tab.language)}"
          aria-pressed="${tab.language === session.selectedLanguage ? 'true' : 'false'}"
        >${escapeHtml(tab.label)}</button>
      `).join('');
      const nextActions = session.nextActions.map(action => `
        <li>${escapeHtml(action.replace(/_/g, ' '))}</li>
      `).join('');
      const qualityTone = session.quality.decision;

      this.shadowRoot.innerHTML = `
        <style>${css()}</style>
        <section class="shell" aria-label="AGID Address Element">
          <header class="header">
            <div class="brand">
              <span class="mark" aria-hidden="true">A</span>
              <div>
                <h2 class="title">AGID Address Element</h2>
                <p class="subtitle">Web Component · no raw address host contract</p>
              </div>
            </div>
            <span class="status" data-tone="${qualityTone}">${escapeHtml(session.quality.decision.replace('_', ' '))}</span>
          </header>

          <div class="body">
            <div>
              <div class="tabs">${tabs}</div>
              <div class="form-note">
                <strong>${escapeHtml(countryFormSummary.countryName)}</strong>
                <span>${escapeHtml(countryFormSummary.formatName)} · ${escapeHtml(countryFormSummary.fieldCount)} fields · postal ${escapeHtml(countryFormSummary.postalCodeFormat)}</span>
                <em>${escapeHtml(this.formatLoadStatus === 'idle' ? 'loading' : this.formatLoadStatus)}</em>
              </div>
              <div class="fields">${fieldHtml}</div>
            </div>

            <aside class="side">
              <div class="panel">
                <div class="panel-title">
                  <span>Input channels</span>
                  <span class="mini-status">${escapeHtml(session.status.replace('_', ' '))}</span>
                </div>
                <div class="toggle-grid">
                  <button type="button" data-toggle="qr" aria-pressed="${this.scanCapabilities.qr ? 'true' : 'false'}">QR</button>
                  <button type="button" data-toggle="nfc" aria-pressed="${this.scanCapabilities.nfc ? 'true' : 'false'}">NFC</button>
                  <button type="button" data-toggle="agid-secure" aria-pressed="${this.scanCapabilities.agidSecure ? 'true' : 'false'}">AGID-S</button>
                </div>
              </div>

              <div class="panel">
                <div class="panel-title">
                  <span>Consent scopes</span>
                  <span class="mini-status">${escapeHtml(addressLinkStatus.replace(/-/g, ' '))}</span>
                </div>
                <div class="scope-list">
                  <button type="button" data-capability="delivery-eligibility" aria-pressed="${this.linkCapabilities.includes('delivery-eligibility') ? 'true' : 'false'}">Delivery</button>
                  <button type="button" data-capability="recipient-confirmation" aria-pressed="${this.linkCapabilities.includes('recipient-confirmation') ? 'true' : 'false'}">Recipient</button>
                  <button type="button" data-capability="coarse-region" aria-pressed="${this.linkCapabilities.includes('coarse-region') ? 'true' : 'false'}">Region</button>
                </div>
              </div>

              <button class="high-risk" type="button" data-toggle="high-risk" aria-pressed="${this.highRiskMode ? 'true' : 'false'}">
                <span>High-risk mode</span>
                <strong>${this.highRiskMode ? 'ON' : 'OFF'}</strong>
              </button>

              <div class="panel">
                <div class="panel-title">
                  <span>Readiness</span>
                  <span class="mini-status">${escapeHtml(readiness.status.replace('_', ' '))}</span>
                </div>
                <ul class="next-actions">${nextActions}</ul>
              </div>
            </aside>
          </div>

          <footer class="footer">
            <span>Exports <strong>safe session and intent metadata only</strong>.</span>
            <button class="submit" type="button" data-submit>Use address intent</button>
          </footer>
        </section>
      `;

      this.wireEvents();
      this.hasRendered = true;
    }

    private wireEvents() {
      if (!this.shadowRoot) return;
      this.shadowRoot.querySelectorAll<HTMLInputElement>('input[data-field]').forEach(input => {
        if (input.readOnly) return;
        input.addEventListener('input', () => {
          const key = input.dataset.field as AddressElementFieldKey;
          this.fields = { ...this.fields, [key]: input.value };
          const session = this.createSession();
          this.dispatchSafeEvents(this.createDetail(session));
        });
        input.addEventListener('change', () => {
          this.renderAndEmit();
        });
      });
      this.shadowRoot.querySelectorAll<HTMLButtonElement>('button[data-language]').forEach(button => {
        button.addEventListener('click', () => {
          const language = button.dataset.language || 'local';
          this.setSelectedLanguage(language);
        });
      });
      this.shadowRoot.querySelectorAll<HTMLButtonElement>('button[data-toggle]').forEach(button => {
        button.addEventListener('click', () => {
          const toggle = button.dataset.toggle || '';
          if (toggle === 'high-risk') this.toggleAttributeFlag('high-risk');
          if (toggle === 'qr') this.toggleAttributeFlag('qr');
          if (toggle === 'nfc') this.toggleAttributeFlag('nfc');
          if (toggle === 'agid-secure') this.toggleAttributeFlag('agid-secure');
        });
      });
      this.shadowRoot.querySelectorAll<HTMLButtonElement>('button[data-capability]').forEach(button => {
        button.addEventListener('click', () => {
          const capability = button.dataset.capability as AddressLinkCapability;
          this.linkCapabilities = this.linkCapabilities.includes(capability)
            ? this.linkCapabilities.filter(item => item !== capability)
            : [...this.linkCapabilities, capability];
          this.renderAndEmit();
        });
      });
      this.shadowRoot.querySelector<HTMLButtonElement>('button[data-submit]')?.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('agid-address-element:submit', {
          bubbles: true,
          composed: true,
          detail: this.getPublicDetail(),
        }));
      });
    }
  };
}

export function defineAgidAddressElement(
  registry: CustomElementRegistry | undefined = typeof customElements === 'undefined' ? undefined : customElements,
): AgidAddressElementDefinitionResult {
  if (typeof HTMLElement === 'undefined') {
    return {
      defined: false,
      tagName: AGID_ADDRESS_ELEMENT_TAG_NAME,
      reason: 'dom-unavailable',
    };
  }
  if (!registry) {
    return {
      defined: false,
      tagName: AGID_ADDRESS_ELEMENT_TAG_NAME,
      reason: 'custom-elements-unavailable',
    };
  }
  if (registry.get(AGID_ADDRESS_ELEMENT_TAG_NAME)) {
    return {
      defined: true,
      tagName: AGID_ADDRESS_ELEMENT_TAG_NAME,
      alreadyDefined: true,
    };
  }
  registry.define(AGID_ADDRESS_ELEMENT_TAG_NAME, createAgidAddressElementClass(HTMLElement));
  return {
    defined: true,
    tagName: AGID_ADDRESS_ELEMENT_TAG_NAME,
    alreadyDefined: false,
  };
}

defineAgidAddressElement();

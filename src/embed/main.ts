import { decodeAgidLight, encodeAgidLight, isValidCoordinate } from './agidLight';
import './style.css';

const root = document.getElementById('agid-embed-root');
const params = new URLSearchParams(window.location.search);

type EmbedState = {
  id: string;
  lat: number;
  lon: number;
  face: number;
  prefix: string;
  label: string;
  address: string;
  compact: boolean;
  hideActions: boolean;
};

function readNumberParam(name: string): number | null {
  const raw = params.get(name);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function resolveState(): EmbedState | null {
  const rawId = params.get('agid') || params.get('id') || params.get('q');
  const decoded = rawId ? decodeAgidLight(rawId) : null;
  const lat = readNumberParam('lat');
  const lon = readNumberParam('lon');
  const encoded = decoded || (lat !== null && lon !== null && isValidCoordinate(lat, lon)
    ? encodeAgidLight(lat, lon, params.get('prefix') || undefined)
    : null);

  if (!encoded) return null;

  return {
    id: encoded.id,
    lat: encoded.lat,
    lon: encoded.lon,
    face: encoded.face,
    prefix: encoded.prefix,
    label: params.get('label') || 'Absolute Grid Identity',
    address: params.get('address') || '',
    compact: params.get('compact') === '1' || params.get('compact') === 'true',
    hideActions: params.get('hideActions') === '1' || params.get('hideActions') === 'true',
  };
}

function formatCoordinate(value: number): string {
  return value.toFixed(6).replace(/\.?0+$/, '');
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
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

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.append(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    textarea.remove();
    return ok;
  }
}

function openMainAppUrl(state: EmbedState): string {
  const target = new URL('/', window.location.origin);
  target.searchParams.set('agid', state.id);
  target.searchParams.set('lat', String(state.lat));
  target.searchParams.set('lon', String(state.lon));
  return target.toString();
}

function renderError() {
  if (!root) return;
  root.innerHTML = `
    <main class="embed-shell">
      <section class="agid-card agid-card--error" aria-live="polite">
        <p class="eyebrow">AGID Embed</p>
        <h1>Invalid AGID or coordinates</h1>
        <p class="muted">Use <code>?agid=JP...</code> or <code>?lat=35.681236&amp;lon=139.767125&amp;prefix=JP</code>.</p>
      </section>
    </main>
  `;
}

function render(state: EmbedState) {
  if (!root) return;
  document.documentElement.dataset.theme = params.get('theme') || 'auto';
  document.body.classList.toggle('is-compact', state.compact);

  const coordinate = `${formatCoordinate(state.lat)}, ${formatCoordinate(state.lon)}`;
  const safeLabel = escapeHtml(state.label);
  const safeAddress = escapeHtml(state.address.trim());
  const openUrl = openMainAppUrl(state);
  const safeOpenUrl = escapeHtml(openUrl);

  root.innerHTML = `
    <main class="embed-shell">
      <section class="agid-card" aria-label="AGID embed card">
        <div class="card-top">
          <span class="status-dot" aria-hidden="true"></span>
          <span class="eyebrow">${safeLabel}</span>
          <span class="prefix-pill">${state.prefix}</span>
        </div>
        <div class="id-row">
          <strong class="agid-id">${state.id}</strong>
          <button class="icon-button" type="button" data-copy aria-label="Copy AGID">
            <span aria-hidden="true">Copy</span>
          </button>
        </div>
        ${safeAddress ? `<p class="address-line">${safeAddress}</p>` : ''}
        <dl class="meta-grid">
          <div>
            <dt>Coordinates</dt>
            <dd>${coordinate}</dd>
          </div>
          <div>
            <dt>Cell</dt>
            <dd>Face ${state.face} / ${state.id.slice(-4)}</dd>
          </div>
        </dl>
        ${state.hideActions ? '' : `
          <div class="actions">
            <a class="primary-link" href="${safeOpenUrl}" target="_top" rel="noopener">Open AGID</a>
            <button class="secondary-button" type="button" data-copy-link>Copy link</button>
          </div>
        `}
        <p class="copy-status" aria-live="polite"></p>
      </section>
    </main>
  `;

  const status = root.querySelector<HTMLParagraphElement>('.copy-status');
  root.querySelector('[data-copy]')?.addEventListener('click', async () => {
    const copied = await copyText(state.id);
    if (status) status.textContent = copied ? 'Copied AGID' : 'Copy failed';
    window.parent.postMessage({ type: 'agid-embed-copy', value: state.id, copied }, '*');
  });
  root.querySelector('[data-copy-link]')?.addEventListener('click', async () => {
    const copied = await copyText(openUrl);
    if (status) status.textContent = copied ? 'Copied link' : 'Copy failed';
    window.parent.postMessage({ type: 'agid-embed-copy-link', value: openUrl, copied }, '*');
  });

  window.parent.postMessage({
    type: 'agid-embed-ready',
    agid: state.id,
    lat: state.lat,
    lon: state.lon,
    prefix: state.prefix,
  }, '*');
}

const state = resolveState();
if (state) render(state);
else renderError();

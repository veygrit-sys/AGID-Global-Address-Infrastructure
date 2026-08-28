import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REGION_ORDER = ['asia', 'europe', 'americas', 'africa', 'oceania'];
export const LEDGER_PATH = 'docs/postal-context-m2-rollout.json';
const STATES = new Set(['pending', 'in_progress', 'blocked', 'm2_verified']);
// Queue geography only; never rewrite the repository's country/territory identity.
const QUEUE_REGION = { AS: 'oceania', GU: 'oceania', MP: 'oceania', UM: 'oceania', EA: 'africa' };
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const https = value => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
const instant = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));

export function compareCountries(left, right) {
  return REGION_ORDER.indexOf(left.region) - REGION_ORDER.indexOf(right.region)
    || Number(right.countryCode === 'JP') - Number(left.countryCode === 'JP')
    || left.countryCode.localeCompare(right.countryCode, 'en');
}

export function promotionErrors(country) {
  const proof = country.evidence;
  if (!proof || typeof proof !== 'object') return ['missing-evidence'];
  const errors = [];
  if (!country.m2Definition || proof.criterionId !== country.m2Definition.id || proof.criterionSatisfied !== true) errors.push('country-criterion-not-satisfied');
  if (proof.synthetic !== false || !proof.scope) errors.push('real-data-scope-required');
  if (!Array.isArray(proof.sources) || !proof.sources.length || proof.sources.some(s =>
    !https(s.url) || !SHA256.test(s.digest) || !s.version || !instant(s.observedAt)
    || !https(s.termsUrl) || !SHA256.test(s.termsDigest) || s.rightsReviewed !== true)) errors.push('source-and-rights-lineage-required');
  if (!Array.isArray(proof.artifacts) || !proof.artifacts.length || proof.artifacts.some(a =>
    !https(a.url) || !SHA256.test(a.digest) || !Number.isInteger(a.bytes) || a.bytes <= 0)) errors.push('published-pinned-artifacts-required');
  if (!proof.validation || !Number.isInteger(proof.validation.passed) || proof.validation.passed <= 0
    || proof.validation.failed !== 0 || !proof.validation.command || !SHA256.test(proof.validation.reportDigest)) errors.push('passing-validation-report-required');
  if (!proof.runtime || !SHA256.test(proof.runtime.descriptorDigest) || !proof.runtime.verificationCommand) errors.push('agid-runtime-verification-required');
  return errors;
}

export function validateLedger(ledger) {
  if (ledger.schemaVersion !== 'postal-context-m2-rollout/v1' || !Array.isArray(ledger.countries)) throw new Error('invalid-ledger');
  const seen = new Set();
  let active = 0;
  for (const country of ledger.countries) {
    if (!/^[A-Z]{2}$/.test(country.countryCode) || seen.has(country.countryCode)) throw new Error('duplicate-or-invalid-country');
    seen.add(country.countryCode);
    if (!REGION_ORDER.includes(country.region) || !STATES.has(country.status)) throw new Error('invalid-country-state');
    if (country.status === 'in_progress') active++;
    if (country.status === 'blocked' && (!country.blocker?.reason || !instant(country.blocker.retryAfter))) throw new Error(`invalid-blocker:${country.countryCode}`);
    if (country.status === 'm2_verified') {
      const errors = promotionErrors(country);
      if (errors.length) throw new Error(`unproven-m2:${country.countryCode}:${errors.join(',')}`);
    }
  }
  if (active > 1) throw new Error('more-than-one-country-in-progress');
  return ledger;
}

export function nextCountry(ledger, now = new Date().toISOString()) {
  validateLedger(ledger);
  if (!instant(now)) throw new Error('invalid-now');
  const countries = [...ledger.countries].sort(compareCountries);
  // Finish the current country; then visit all untouched countries before retrying blockers.
  return countries.find(c => c.status === 'in_progress')
    ?? countries.find(c => c.status === 'pending')
    ?? countries.filter(c => c.status === 'blocked' && Date.parse(c.blocker.retryAfter) <= Date.parse(now))
      .sort((a, b) => Date.parse(a.blocker.retryAfter) - Date.parse(b.blocker.retryAfter) || compareCountries(a, b))[0]
    ?? null;
}

export function inventory(root, previous = null) {
  if (previous) validateLedger(previous);
  const old = new Map(previous?.countries.map(c => [c.countryCode, c]) ?? []);
  const countries = [];
  const scan = (directory, sourceRegion) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) scan(path, sourceRegion);
      else if (/^[A-Z]{2}\.json$/.test(entry.name)) {
        const format = JSON.parse(readFileSync(path, 'utf8'));
        const countryCode = format.countryCode;
        const manifestPath = `data/postal_country_packs/${countryCode.toLowerCase()}/postal-context/repository-manifest.json`;
        const manifest = existsSync(resolve(root, manifestPath)) ? JSON.parse(readFileSync(resolve(root, manifestPath), 'utf8')) : null;
        const m2Definition = manifest?.promotion?.stages?.find(stage => /^M2(?:_|$)/.test(stage.id)) ?? null;
        const prior = old.get(countryCode);
        const definitionChanged = prior && JSON.stringify(prior.m2Definition) !== JSON.stringify(m2Definition);
        if (definitionChanged && prior.status === 'm2_verified') throw new Error(`re-review-m2-definition:${countryCode}`);
        countries.push({
          countryCode, name: format.name, region: QUEUE_REGION[countryCode] ?? sourceRegion, sourceRegion,
          addressFormat: relative(root, path).replaceAll('\\', '/'),
          manifest: manifest ? manifestPath : null,
          declaredStage: manifest?.promotion?.current_stage ?? manifest?.repository?.maturity ?? 'M0_inventory',
          m2Definition,
          status: prior?.status ?? 'pending', attempts: prior?.attempts ?? 0,
          lastAttempt: prior?.lastAttempt ?? null, blocker: prior?.blocker ?? null, evidence: prior?.evidence ?? null,
        });
      }
    }
  };
  for (const region of REGION_ORDER) scan(resolve(root, 'src/data/address_formats', region), region);
  for (const code of old.keys()) if (!countries.some(c => c.countryCode === code)) throw new Error(`country-removed-requires-review:${code}`);
  return validateLedger({
    schemaVersion: 'postal-context-m2-rollout/v1',
    sourceBaseCommit: previous?.sourceBaseCommit ?? 'cc7821cc8175031545d2a437fb5a4b10b6dfe5fe',
    regionOrder: REGION_ORDER,
    ordering: 'Japan first, then repository country/territory code within each region; pending before due retries.',
    scope: 'Registered profiles in the five requested regions, including repository-specific territory codes. Not a claim of 252 ISO sovereign countries. Antarctica and special profiles are outside this queue.',
    geographyOverrides: QUEUE_REGION,
    definitionRule: 'Country-specific M2 definitions are retained. A missing definition needs country review, never an automatic promotion. Runtime code, source links and synthetic tests alone do not count as M2 data.',
    countries: countries.sort(compareCountries),
  });
}

export function summary(ledger) {
  validateLedger(ledger);
  return {
    total: ledger.countries.length,
    regions: Object.fromEntries(REGION_ORDER.map(r => [r, ledger.countries.filter(c => c.region === r).length])),
    states: Object.fromEntries([...STATES].map(s => [s, ledger.countries.filter(c => c.status === s).length])),
    manifests: ledger.countries.filter(c => c.manifest).length,
    explicitM2Definitions: ledger.countries.filter(c => c.m2Definition).length,
    next: nextCountry(ledger)?.countryCode ?? null,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const [mode = 'status', ...extra] = process.argv.slice(2);
  if (!['status', 'refresh'].includes(mode) || extra.length) throw new Error('usage: node scripts/postal-context-m2-rollout.mjs [status|refresh]');
  const root = process.cwd();
  const file = resolve(root, LEDGER_PATH);
  const prior = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
  const ledger = inventory(root, prior);
  if (mode === 'refresh') writeFileSync(file, `${JSON.stringify(ledger, null, 2)}\n`, { encoding: 'utf8' });
  console.log(JSON.stringify(summary(ledger), null, 2));
}

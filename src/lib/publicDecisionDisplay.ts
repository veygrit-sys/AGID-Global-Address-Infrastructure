export type PublicConfidenceBand = 'high' | 'medium' | 'low' | 'unknown';

export function publicConfidenceBand(value: number | undefined | null): PublicConfidenceBand {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'unknown';
  if (value >= 0.75) return 'high';
  if (value >= 0.45) return 'medium';
  return 'low';
}

export function formatPublicConfidenceBand(value: number | undefined | null, language = 'en') {
  const band = publicConfidenceBand(value);
  const ja = language.toLowerCase().startsWith('ja');
  if (band === 'high') return ja ? '高' : 'High';
  if (band === 'medium') return ja ? '中' : 'Medium';
  if (band === 'low') return ja ? '低' : 'Low';
  return ja ? '不明' : 'Unknown';
}

export function formatPublicDecision(value: string | undefined | null, language = 'en') {
  const normalized = String(value ?? '').trim().toLowerCase().replace(/_/g, '-');
  const ja = language.toLowerCase().startsWith('ja');
  if (['ok', 'ready', 'verified', 'address-ok', 'passed', 'complete', 'accepted'].includes(normalized)) return 'OK';
  if (['blocked', 'restricted', 'hidden', 'hide'].includes(normalized)) return ja ? '制限' : 'Restricted';
  if (['reject', 'rejected', 'failed', 'invalid', 'revoked'].includes(normalized)) return ja ? '拒否' : 'Rejected';
  return ja ? '要確認' : 'Needs Review';
}

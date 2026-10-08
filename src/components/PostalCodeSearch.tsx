import React from 'react';
import { POSTAL_CONTEXT_COUNTRY_CODES } from '../lib/postalContextCountryPolicy';
import { normalizePostalAreaQuery, type PostalAreaLookupCandidate } from '../lib/postalSearchArea';

const countryNames = new Intl.DisplayNames(['ja'], { type: 'region' });
const countries = [...POSTAL_CONTEXT_COUNTRY_CODES]
  .map(code => ({ code: code.toUpperCase(), name: countryNames.of(code.toUpperCase()) || code }))
  .sort((a, b) => a.name.localeCompare(b.name, 'ja'));

export function PostalCodeSearch({ onSearch, initialCountry = '', busy = false }: {
  onSearch: (candidate: PostalAreaLookupCandidate) => void;
  initialCountry?: string;
  busy?: boolean;
}) {
  const [country, setCountry] = React.useState(initialCountry.toUpperCase());
  const [postalCode, setPostalCode] = React.useState('');
  const [error, setError] = React.useState('');
  return <form className="space-y-3 border-b border-slate-100 p-4" onSubmit={event => {
    event.preventDefault();
    const candidate = normalizePostalAreaQuery(country, postalCode);
    if (!candidate) { setError('国と郵便番号を入力してください。'); return; }
    setError('');
    onSearch(candidate);
  }}>
    <h2 className="text-sm font-semibold text-slate-800">郵便番号でエリア検索</h2>
    <div className="grid grid-cols-2 gap-2">
      <label className="text-xs text-slate-600">国・地域
        <select required value={country} onChange={event => setCountry(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm">
          <option value="">選択してください</option>
          {countries.map(item => <option key={item.code} value={item.code}>{item.name} ({item.code})</option>)}
        </select>
      </label>
      <label className="text-xs text-slate-600">郵便番号
        <input required value={postalCode} onChange={event => setPostalCode(event.target.value)} maxLength={64} autoComplete="postal-code" placeholder="例：100-0001" className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm" />
      </label>
    </div>
    <p className="text-xs leading-5 text-slate-500">該当する郵便区域を青い線で囲みます。境界データが未収録の地域もあります。</p>
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    <button type="submit" disabled={busy} className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? '検索中…' : '郵便番号の範囲を表示'}</button>
  </form>;
}

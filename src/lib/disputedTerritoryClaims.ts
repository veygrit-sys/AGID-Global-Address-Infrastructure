export type TerritoryClaimOption = {
  id: string;
  label: string;
  shortLabel: string;
  countryLine: string;
  status: 'claim' | 'administration' | 'neutral' | 'unclaimed' | 'logistics-route';
  note: string;
  postalGuidance: string;
};

export type TerritoryClaimDisplayPolicy =
  | 'neutral-first'
  | 'administration-first'
  | 'claim-first'
  | 'logistics-first';

export const TERRITORY_CLAIM_DISPLAY_POLICIES: Array<{
  id: TerritoryClaimDisplayPolicy;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    id: 'neutral-first',
    label: '中立優先',
    shortLabel: '中立',
    description: 'Start with neutral or unclaimed display where available.',
  },
  {
    id: 'administration-first',
    label: '実効支配 / 現地運用優先',
    shortLabel: '現地',
    description: 'Start with the administration or locally operated route view.',
  },
  {
    id: 'claim-first',
    label: '主張優先',
    shortLabel: '主張',
    description: 'Start with claimant-state display options.',
  },
  {
    id: 'logistics-first',
    label: '物流ルート優先',
    shortLabel: '物流',
    description: 'Start with practical carrier or field logistics route views.',
  },
];

type TerritoryClaimLookupInput = {
  regionCode?: string;
  countryCode?: string;
  regionName?: string;
};

const JAPANESE_CLAIM_TERRITORY_CODES = new Set(['JP_TK', 'JP_SK', 'JP_NT']);

const japanClaim = (overrides: Partial<TerritoryClaimOption> = {}): TerritoryClaimOption => ({
  id: 'jp',
  label: '日本の主張',
  shortLabel: '日本',
  countryLine: 'Japan',
  status: 'claim',
  note: 'Show the Japanese territorial view first while keeping alternate views available.',
  postalGuidance: 'Use AGID, coordinates, Plus Code, and available local gazetteer evidence before assuming a postal route.',
  ...overrides,
});

const territoryClaimsByCode: Record<string, TerritoryClaimOption[]> = {
  BT_T: [
    {
      id: 'neutral',
      label: '中立 / 未請求地',
      shortLabel: '中立',
      countryLine: 'Bir Tawil',
      status: 'unclaimed',
      note: 'Treat as terra nullius/unclaimed territory for address display; do not assign a sovereign country line.',
      postalGuidance: 'No national postal system. Use AGID, coordinates, Plus Code, and a named expedition/logistics handoff point.',
    },
    {
      id: 'eg-route',
      label: 'エジプト側ルート',
      shortLabel: 'エジプト側',
      countryLine: 'Egypt-side logistics route',
      status: 'logistics-route',
      note: 'This is a practical access-side view, not a sovereignty claim.',
      postalGuidance: 'Use only as a logistics route hint when a carrier or field team enters from Egypt.',
    },
    {
      id: 'sd-route',
      label: 'スーダン側ルート',
      shortLabel: 'スーダン側',
      countryLine: 'Sudan-side logistics route',
      status: 'logistics-route',
      note: 'This is a practical access-side view, not a sovereignty claim.',
      postalGuidance: 'Use only as a logistics route hint when a carrier or field team enters from Sudan.',
    },
  ],
  JP_TK: [
    japanClaim({
      note: 'Japanese view: Takeshima. Do not show other country display buttons for Japanese territorial claim areas.',
    }),
  ],
  JP_SK: [
    japanClaim({
      note: 'Japanese view: Senkaku Islands. Do not show other country display buttons for Japanese territorial claim areas.',
    }),
  ],
  JP_NT: [
    japanClaim({
      note: 'Japanese view: Northern Territories. Do not show other country display buttons for Japanese territorial claim areas.',
    }),
  ],
  EH: [
    {
      id: 'ma-admin',
      label: 'モロッコ表示',
      shortLabel: 'モロッコ',
      countryLine: 'Morocco / Western Sahara',
      status: 'administration',
      note: 'Use when the address source or carrier route follows Moroccan administration.',
      postalGuidance: 'Preserve AGID and coordinates because postal coverage varies by locality.',
    },
    {
      id: 'sadr-claim',
      label: '西サハラ表示',
      shortLabel: '西サハラ',
      countryLine: 'Western Sahara',
      status: 'claim',
      note: 'Use when the source labels the location as Western Sahara/SADR.',
      postalGuidance: 'Preserve AGID and coordinates because postal coverage varies by locality.',
    },
    {
      id: 'neutral',
      label: '中立表示',
      shortLabel: '中立',
      countryLine: 'Western Sahara',
      status: 'neutral',
      note: 'Use a neutral territory label and source evidence.',
      postalGuidance: 'Use AGID, coordinates, Plus Code, and source labels for neutral display.',
    },
  ],
  CRIM: [
    {
      id: 'ua',
      label: 'ウクライナ表示',
      shortLabel: 'ウクライナ',
      countryLine: 'Ukraine',
      status: 'claim',
      note: 'Use when following the internationally common Ukrainian legal view.',
      postalGuidance: 'Keep AGID and coordinates; postal route availability depends on carrier policy.',
    },
    {
      id: 'ru-admin',
      label: '実効支配 / ロシア表示',
      shortLabel: 'ロシア表示',
      countryLine: 'Russia',
      status: 'administration',
      note: 'Use only when the selected source or local route follows Russian administration.',
      postalGuidance: 'Keep AGID and coordinates; postal route availability depends on carrier policy.',
    },
    {
      id: 'neutral',
      label: '中立表示',
      shortLabel: '中立',
      countryLine: 'Crimea',
      status: 'neutral',
      note: 'Use a neutral territory label and source evidence.',
      postalGuidance: 'Use AGID, coordinates, Plus Code, and source labels for neutral display.',
    },
  ],
  DONB: [
    {
      id: 'ua',
      label: 'ウクライナ表示',
      shortLabel: 'ウクライナ',
      countryLine: 'Ukraine',
      status: 'claim',
      note: 'Use when following the internationally common Ukrainian legal view.',
      postalGuidance: 'Keep AGID and coordinates; postal route availability depends on carrier policy.',
    },
    {
      id: 'ru-control',
      label: '実効支配 / ロシア表示',
      shortLabel: 'ロシア表示',
      countryLine: 'Russia-controlled route / Eastern Ukraine',
      status: 'administration',
      note: 'Use only when the selected source or local route follows Russian administration/control.',
      postalGuidance: 'Keep AGID and coordinates; postal route availability depends on carrier policy.',
    },
    {
      id: 'neutral',
      label: '中立表示',
      shortLabel: '中立',
      countryLine: 'Eastern Ukraine / Donbas',
      status: 'neutral',
      note: 'Use a neutral territory label and source evidence.',
      postalGuidance: 'Use AGID, coordinates, Plus Code, and source labels for neutral display.',
    },
  ],
  KASH: [
    {
      id: 'in',
      label: 'インド表示',
      shortLabel: 'インド',
      countryLine: 'India',
      status: 'claim',
      note: 'Use when the selected source or carrier route follows Indian administration/claim view.',
      postalGuidance: 'Keep AGID and coordinates because postal routes vary by controlled area.',
    },
    {
      id: 'pk',
      label: 'パキスタン表示',
      shortLabel: 'パキスタン',
      countryLine: 'Pakistan',
      status: 'claim',
      note: 'Use when the selected source or carrier route follows Pakistani administration/claim view.',
      postalGuidance: 'Keep AGID and coordinates because postal routes vary by controlled area.',
    },
    {
      id: 'cn',
      label: '中国表示',
      shortLabel: '中国',
      countryLine: 'China',
      status: 'claim',
      note: 'Use when the selected source labels the relevant area under Chinese administration/claim view.',
      postalGuidance: 'Keep AGID and coordinates because postal routes vary by controlled area.',
    },
  ],
  SCSD: [
    {
      id: 'neutral',
      label: '中立 / 多重主張表示',
      shortLabel: '中立',
      countryLine: 'South China Sea disputed area',
      status: 'neutral',
      note: 'Use when no single claimant route is selected; keep source labels visible.',
      postalGuidance: 'Use AGID, coordinates, Plus Code, marine feature names, and carrier route evidence.',
    },
    {
      id: 'cn-claim',
      label: '中国の主張',
      shortLabel: '中国',
      countryLine: 'China-claimed South China Sea area',
      status: 'claim',
      note: 'Use only when the selected source or user asks for the PRC claim view.',
      postalGuidance: 'Do not infer a normal postal route from the claim view alone.',
    },
    {
      id: 'vn-claim',
      label: 'ベトナムの主張',
      shortLabel: 'ベトナム',
      countryLine: 'Vietnam-claimed South China Sea area',
      status: 'claim',
      note: 'Use only when the selected source or user asks for the Vietnam claim view.',
      postalGuidance: 'Do not infer a normal postal route from the claim view alone.',
    },
    {
      id: 'other-claimants',
      label: '他の沿岸国表示',
      shortLabel: '沿岸国',
      countryLine: 'South China Sea claimant route',
      status: 'claim',
      note: 'Use for Philippines, Malaysia, Brunei, or Taiwan route/source views when a source identifies the route.',
      postalGuidance: 'Keep AGID and coordinates; use source evidence before adding an address country line.',
    },
  ],
  EEBD: [
    {
      id: 'er',
      label: 'エリトリア表示',
      shortLabel: 'エリトリア',
      countryLine: 'Eritrea',
      status: 'claim',
      note: 'Use when the selected source or route follows Eritrean administration/claim view.',
      postalGuidance: 'Keep AGID and coordinates because postal and route handling can vary.',
    },
    {
      id: 'et',
      label: 'エチオピア表示',
      shortLabel: 'エチオピア',
      countryLine: 'Ethiopia',
      status: 'claim',
      note: 'Use when the selected source or route follows Ethiopian administration/claim view.',
      postalGuidance: 'Keep AGID and coordinates because postal and route handling can vary.',
    },
    {
      id: 'neutral',
      label: '中立表示',
      shortLabel: '中立',
      countryLine: 'Eritrea / Ethiopia border area',
      status: 'neutral',
      note: 'Use a neutral border-area label and source evidence.',
      postalGuidance: 'Use AGID, coordinates, Plus Code, and source labels for neutral display.',
    },
  ],
  TRNC: [
    {
      id: 'cy',
      label: 'キプロス表示',
      shortLabel: 'キプロス',
      countryLine: 'Cyprus',
      status: 'claim',
      note: 'Use when following the internationally common Cyprus view.',
      postalGuidance: 'Keep AGID and coordinates; postal route availability depends on carrier policy.',
    },
    {
      id: 'trnc-local',
      label: '北キプロス表示',
      shortLabel: '北キプロス',
      countryLine: 'Northern Cyprus',
      status: 'administration',
      note: 'Use when a local source or route labels the area as Northern Cyprus/TRNC.',
      postalGuidance: 'Keep AGID and coordinates; postal route availability depends on carrier policy.',
    },
  ],
  SLND: [
    {
      id: 'so',
      label: 'ソマリア表示',
      shortLabel: 'ソマリア',
      countryLine: 'Somalia',
      status: 'claim',
      note: 'Use when following the internationally common Somalia view.',
      postalGuidance: 'Keep AGID and coordinates because postal coverage varies strongly by locality.',
    },
    {
      id: 'slnd-local',
      label: 'ソマリランド表示',
      shortLabel: 'ソマリランド',
      countryLine: 'Somaliland',
      status: 'administration',
      note: 'Use when local source data or a carrier route labels the area as Somaliland.',
      postalGuidance: 'Keep AGID and coordinates because postal coverage varies strongly by locality.',
    },
  ],
  PMR: [
    {
      id: 'md',
      label: 'モルドバ表示',
      shortLabel: 'モルドバ',
      countryLine: 'Moldova',
      status: 'claim',
      note: 'Use when following the internationally common Moldova view.',
      postalGuidance: 'Keep AGID and coordinates; postal route availability depends on carrier policy.',
    },
    {
      id: 'pmr-local',
      label: '沿ドニエストル表示',
      shortLabel: '沿ドニエストル',
      countryLine: 'Transnistria / Pridnestrovia',
      status: 'administration',
      note: 'Use when local source data labels the area as Transnistria/Pridnestrovia.',
      postalGuidance: 'Keep AGID and coordinates; postal route availability depends on carrier policy.',
    },
  ],
  CYGL: [
    {
      id: 'un-buffer',
      label: '国連緩衝地帯',
      shortLabel: 'UN',
      countryLine: 'UN Buffer Zone, Cyprus',
      status: 'neutral',
      note: 'Use the buffer-zone label and avoid assigning ordinary national postal authority.',
      postalGuidance: 'Use AGID, coordinates, Plus Code, and source labels for neutral display.',
    },
  ],
};

const nameMatchers: Array<[RegExp, string]> = [
  [/bir\s+tawil/i, 'BT_T'],
  [/takeshima|dokdo/i, 'JP_TK'],
  [/senkaku|diaoyu|diaoyutai/i, 'JP_SK'],
  [/northern\s+territories|southern\s+kurils/i, 'JP_NT'],
  [/western\s+sahara/i, 'EH'],
  [/crimea/i, 'CRIM'],
  [/donbas|donbass|eastern\s+ukraine/i, 'DONB'],
  [/kashmir/i, 'KASH'],
  [/south\s+china\s+sea|spratly|paracel/i, 'SCSD'],
  [/eritrea\s*\/\s*ethiopia|ethiopia\s*\/\s*eritrea|badme/i, 'EEBD'],
  [/northern\s+cyprus|trnc/i, 'TRNC'],
  [/somaliland/i, 'SLND'],
  [/transnistria|pridnestrovia/i, 'PMR'],
  [/cyprus\s+green\s+line|buffer\s+zone/i, 'CYGL'],
];

const normalizeTerritoryCode = (code?: string) =>
  (code || '').trim().replace(/-/g, '_').toUpperCase();

export function isJapaneseClaimTerritory(code?: string | null): boolean {
  return JAPANESE_CLAIM_TERRITORY_CODES.has(normalizeTerritoryCode(code || undefined));
}

export function orderTerritoryClaimOptionsForDisplay(
  code: string | null,
  options: TerritoryClaimOption[],
): TerritoryClaimOption[] {
  const normalizedCode = normalizeTerritoryCode(code || undefined);
  const copiedOptions = [...options];
  if (!isJapaneseClaimTerritory(normalizedCode)) return copiedOptions;

  return copiedOptions.sort((left, right) => {
    if (left.id === 'jp' && right.id !== 'jp') return -1;
    if (left.id !== 'jp' && right.id === 'jp') return 1;
    return 0;
  });
}

function territoryClaimPolicyRank(
  policy: TerritoryClaimDisplayPolicy,
  status: TerritoryClaimOption['status'],
) {
  const neutralRank = status === 'neutral' || status === 'unclaimed';
  if (policy === 'neutral-first') {
    if (neutralRank) return 0;
    if (status === 'administration') return 1;
    if (status === 'logistics-route') return 2;
    return 3;
  }

  if (policy === 'administration-first') {
    if (status === 'administration') return 0;
    if (status === 'logistics-route') return 1;
    if (neutralRank) return 2;
    return 3;
  }

  if (policy === 'claim-first') {
    if (status === 'claim') return 0;
    if (status === 'administration') return 1;
    if (status === 'logistics-route') return 2;
    return 3;
  }

  if (status === 'logistics-route') return 0;
  if (status === 'administration') return 1;
  if (neutralRank) return 2;
  return 3;
}

export function orderTerritoryClaimOptionsByPolicy(
  code: string | null,
  options: TerritoryClaimOption[],
  policy: TerritoryClaimDisplayPolicy = 'neutral-first',
): TerritoryClaimOption[] {
  const baseOptions = orderTerritoryClaimOptionsForDisplay(code, options);
  const normalizedCode = normalizeTerritoryCode(code || undefined);
  if (isJapaneseClaimTerritory(normalizedCode)) return baseOptions;

  return baseOptions
    .map((option, index) => ({ option, index }))
    .sort((left, right) => {
      const rankDelta = territoryClaimPolicyRank(policy, left.option.status)
        - territoryClaimPolicyRank(policy, right.option.status);
      return rankDelta || left.index - right.index;
    })
    .map(item => item.option);
}

export function resolveTerritoryClaimKey(input: TerritoryClaimLookupInput): string | null {
  const candidates = [
    normalizeTerritoryCode(input.regionCode),
    normalizeTerritoryCode(input.countryCode),
  ].filter(Boolean);

  for (const code of candidates) {
    if (territoryClaimsByCode[code]) return code;
  }

  const regionName = input.regionName || '';
  for (const [pattern, code] of nameMatchers) {
    if (pattern.test(regionName)) return code;
  }

  return null;
}

export function getTerritoryClaimOptions(
  input: string | TerritoryClaimLookupInput | null | undefined,
  policy: TerritoryClaimDisplayPolicy = 'neutral-first',
): TerritoryClaimOption[] {
  const key = typeof input === 'string'
    ? resolveTerritoryClaimKey({ regionCode: input })
    : input
      ? resolveTerritoryClaimKey(input)
      : null;
  return key ? orderTerritoryClaimOptionsByPolicy(key, territoryClaimsByCode[key] || [], policy) : [];
}

export function formatTerritoryClaimSummary(option: TerritoryClaimOption): string {
  return [
    `Address country/area line: ${option.countryLine}.`,
    option.postalGuidance,
    option.note,
  ].filter(Boolean).join(' ');
}

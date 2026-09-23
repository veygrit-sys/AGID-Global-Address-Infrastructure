export type HelpFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type HelpSelfServiceSection = {
  id: string;
  title: string;
  steps: string[];
};

export type HelpSourceNote = {
  id: string;
  label: string;
  summary: string;
  url: string;
};

export type HelpCenterContent = {
  title: string;
  intro: string;
  factCheckedTitle: string;
  selfServiceTitle: string;
  faqTitle: string;
  qualityTitle: string;
  qualityBody: string;
  faqItems: HelpFaqItem[];
  selfServiceSections: HelpSelfServiceSection[];
  sourceNotes: HelpSourceNote[];
};

type LocalizedText = {
  ja: string;
  en: string;
};

type LocalizedFaq = {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
};

type LocalizedSelfService = {
  id: string;
  title: LocalizedText;
  steps: LocalizedText[];
};

type LocalizedSource = {
  id: string;
  label: string;
  summary: LocalizedText;
  url: string;
};

const HELP_HEADER = {
  title: {
    ja: 'ヘルプと質問回答',
    en: 'Help and Answers',
  },
  intro: {
    ja: 'ファクトチェック済みの根拠を明記し、よくある迷いを自己解決できる形に整理しました。住所・検索・GPS・グリッドはそれぞれ原因が違うため、下のチェックから順に確認してください。',
    en: 'This help center lists fact-checked sources and self-service checks for the most common address, search, GPS, and grid issues.',
  },
  factCheckedTitle: {
    ja: 'ファクトチェック根拠',
    en: 'Fact-Checked Sources',
  },
  selfServiceTitle: {
    ja: '自己解決チェック',
    en: 'Self-Service Checks',
  },
  faqTitle: {
    ja: 'よくある質問',
    en: 'Frequently Asked Questions',
  },
  qualityTitle: {
    ja: 'データ品質の確認',
    en: 'Data Quality Check',
  },
  qualityBody: {
    ja: '住所や検索結果は国別メタデータ、郵便番号データ、OSM系ジオコーダ、地域別ルールを組み合わせます。現在の品質はレポートで確認できます。',
    en: 'Address and search results combine country metadata, postal-code data, OSM-based geocoding, and regional rules. Open the quality report to inspect the current data state.',
  },
} satisfies Record<string, LocalizedText>;

const FAQ_ITEMS: LocalizedFaq[] = [
  {
    id: 'what-is-agid',
    question: {
      ja: 'AGIDとは何ですか？',
      en: 'What is AGID?',
    },
    answer: {
      ja: 'AGIDは緯度経度から計算する位置識別コードで、公開住所ラベル、建物名、道路・橋・水辺・自然地形・遺跡・世界遺産などの公開地物名、郵便・行政情報を重ねて表示できます。住所が弱い場所、海・山・水辺、建物名が曖昧な場所でも同じ地点を指しやすくするための公開IDです。',
      en: 'AGID is a location identifier calculated from latitude and longitude, and it can carry public address labels, building names, road, bridge, water, natural-feature, ruins, heritage, place, postal, and administrative evidence. It helps point to the same place when addresses are weak, ambiguous, or unavailable.',
    },
  },
  {
    id: 'precision',
    question: {
      ja: '精度は何で決まりますか？',
      en: 'What determines accuracy?',
    },
    answer: {
      ja: 'コード計算は座標に基づきますが、実際の現在地精度は端末GPS、ブラウザ許可、周囲の建物、地図データの新しさに左右されます。配送や登記の正式住所は、郵便番号と公的住所データでも確認してください。',
      en: 'The code is coordinate-based, but practical accuracy depends on device GPS, browser permission, buildings around you, and map-data freshness. For delivery or official use, also verify postal codes and authoritative address data.',
    },
  },
  {
    id: 'agid-vs-aoid',
    question: {
      ja: 'AGIDとAOIDは何が違いますか？',
      en: 'How are AGID and AOID different?',
    },
    answer: {
      ja: 'AGIDは「どこか」と「そこにある公開住所・建物・地物」を表す公開IDです。公開建物名、住所ラベル、自然地形や遺産ラベルは含めますが、個人情報である部屋番号・受取人・電話番号・私的な配送指示は含めません。AOIDは「誰が受け取るか」を表す所有者管理の私的住所IDで、部屋番号、配送指示、受取人情報などを所有者だけが更新できます。中央サービスはAGIDの仕様と品質を管理し、AOIDは明示的な同意がある場合だけ私的同期や品質補助に使います。',
      en: 'AGID is a public ID for where something is and what public address, building, or map feature is there. It can include public building names, address labels, natural features, and heritage labels, but not unit numbers, recipients, phone numbers, or private delivery instructions. AOID is an owner-controlled private address ID for who receives something; only the owner can update unit, delivery, and recipient details. Central services govern AGID quality and specification, while AOID uses private sync or quality assistance only after explicit consent.',
    },
  },
  {
    id: 'aoid-storage-sync',
    question: {
      ja: 'AOIDは端末だけに保存しますか？クラウドにも置けますか？',
      en: 'Is AOID stored only on the device, or can it sync to cloud?',
    },
    answer: {
      ja: 'AOIDはローカル優先です。受取人、電話番号、部屋番号、配送指示などの平文データは端末に保存します。クラウド同期は利用者が明示的に許可し、所有者デバイスで暗号化され、所有者キーIDと端末キーIDがある場合だけ扱います。公開QRや公開APIにはAOIDの参照ハンドルと紐付くAGIDだけを出します。公開AOID QRを読み込んでも、自分の所有AOIDとして登録されません。',
      en: 'AOID is local-first. Plain recipient, phone, unit, and delivery-instruction data stays on the owner device. Cloud sync is allowed only after explicit consent, owner-device encryption, and owner/device key ids. Public QR and public APIs expose only an AOID reference handle plus the linked AGID. Scanning a public AOID QR does not register it as your owner-managed AOID.',
    },
  },
  {
    id: 'agid-aoid-communication',
    question: {
      ja: 'AGIDとAOIDは通信の扱いも違いますか？',
      en: 'Do AGID and AOID use different communication rules?',
    },
    answer: {
      ja: '違います。AGID通信は公開位置・公開住所・建物名・公開地物名・郵便や地理の根拠を扱うため、API、SDK、QR、キャッシュ、データパックに載せられます。AOID通信は受取人、部屋番号、電話番号、配送指示を含み得るためローカル優先です。公開APIや公開QRには参照ハンドルと紐付くAGIDだけを出し、クラウド同期は所有者同意、所有者デバイス暗号化、所有者キーID、端末キーIDがある場合だけです。',
      en: 'Yes. AGID communication carries public location, public address, building, public map-feature, postal, and geographic evidence, so it can be used through APIs, SDKs, QR, caches, and data packs. AOID communication may contain recipient, unit, phone, and delivery instructions, so it is local-first. Public APIs and public QR expose only a reference handle plus the linked AGID. Cloud sync requires owner consent, owner-device encryption, an owner key id, and a device key id.',
    },
  },
  {
    id: 'red-black-grid',
    question: {
      ja: '赤いグリッドと黒い線がずれて見える時は？',
      en: 'What if the red cell and black grid look misaligned?',
    },
    answer: {
      ja: '移動やズーム直後は黒線の再生成を待ってください。黒線は画面範囲を覆う通常グリッド、赤は選択中AGIDです。表示が古いままなら、グリッド表示を一度切り替えるかページを再読み込みしてください。',
      en: 'After panning or zooming, wait for the black grid to regenerate. Black lines are the visible regular grid; red marks the selected AGID cell. If an old layer remains, toggle grid visibility or reload the page.',
    },
  },
  {
    id: 'search',
    question: {
      ja: '検索で見つからない時は？',
      en: 'What should I try when search does not find a place?',
    },
    answer: {
      ja: '地名、郵便番号、AGID、緯度経度、現地語表記、英語表記を順に試してください。地名検索は入力文字から検索専用の言語ヒントを推定し、アプリ言語や住所言語タブとは分けて扱います。OSM系検索はデータ登録状況と言語表記に影響されるため、同じ場所でも国や地域で結果の出方が変わります。',
      en: 'Try place name, postal code, AGID, coordinates, native spelling, and English spelling. Place search derives search-only language hints from the query text and keeps them separate from the app language and address-language tabs. OSM-based search depends on mapped data and language tags, so results can differ by country and region.',
    },
  },
  {
    id: 'address-tabs',
    question: {
      ja: '住所言語タブとアプリ言語は何が違いますか？',
      en: 'How are address language tabs different from the app language?',
    },
    answer: {
      ja: 'アプリ言語はUI表示、住所言語タブはその国の住所で使う表記です。多言語国家では住所に使われる言語だけを出し、国際配送向け英語は住所順序を変換して表示します。',
      en: 'The app language controls the UI. Address tabs control the address format for the selected country or region. Multilingual countries show only address-use languages, and international English reorders fields for shipping.',
    },
  },
  {
    id: 'english-address',
    question: {
      ja: '英語タブの住所は公式翻訳ですか？',
      en: 'Is the English address tab an official translation?',
    },
    answer: {
      ja: '英語タブは国際配送で読みやすい順序・ローマ字化・別名を優先した表示です。公的英語名がある場合はそれを優先しますが、すべての国で公式翻訳を保証するものではありません。',
      en: 'The English tab prioritizes shipping-friendly order, romanization, and known aliases. Official English names are preferred when available, but it is not a guarantee of official translation in every country.',
    },
  },
  {
    id: 'postal-code',
    question: {
      ja: '郵便番号を入れると何が自動入力されますか？',
      en: 'What auto-fills after entering a postal code?',
    },
    answer: {
      ja: '国別の郵便番号データや住所メタデータがある場合、州・県・市区町村などを補完します。固定番号の地域は編集不可の桁として表示し、郵便番号制度がない地域は必須項目にしません。',
      en: 'When country postal data or address metadata is available, the app can fill region, province, city, or similar fields. Fixed-code regions are shown as read-only cells; places without postal codes are not forced to provide one.',
    },
  },
  {
    id: 'gps',
    question: {
      ja: 'GPSが使えない時は？',
      en: 'What if GPS does not work?',
    },
    answer: {
      ja: 'ブラウザとOSの位置情報許可を確認してください。Webの位置情報は安全な接続とユーザー許可が必要です。許可できない環境では検索欄、AGID、緯度経度入力で代替できます。',
      en: 'Check browser and operating-system location permissions. Web geolocation requires a secure context and user permission. If permission is unavailable, use search, AGID, or coordinates instead.',
    },
  },
  {
    id: 'offline',
    question: {
      ja: 'オフラインで何が使えますか？',
      en: 'What works offline?',
    },
    answer: {
      ja: '保存済み地点や読み込み済みの一部データはブラウザ内に残ります。ただし地図タイル、住所検索、逆ジオコーディング、郵便番号APIはネットワークが必要になることがあります。',
      en: 'Saved places and some previously loaded data can remain in the browser. Map tiles, address search, reverse geocoding, and postal-code APIs may still require network access.',
    },
  },
  {
    id: 'data-sources',
    question: {
      ja: '住所や地図の根拠データは何ですか？',
      en: 'What data backs addresses and maps?',
    },
    answer: {
      ja: '地図表示はMapLibre GL JS、地図・検索はOpenStreetMap系データ、住所表示は国別住所メタデータとOpenCage系テンプレートを参考にしています。国によって公的郵便番号データや地域別オープンソースも併用します。',
      en: 'Map display uses MapLibre GL JS; maps and search use OpenStreetMap-derived data; address rendering follows country metadata and OpenCage-style templates. Some countries also use public postal data or regional OSS sources.',
    },
  },
  {
    id: 'partial-format',
    question: {
      ja: 'PARTIAL FORMATやスコア表示は何ですか？',
      en: 'What do PARTIAL FORMAT and score labels mean?',
    },
    answer: {
      ja: '住所の一部だけが検証できた状態を示します。郵便番号、行政区画、道路名、建物名などの一致度が上がると品質表示が改善します。配送前は現地語タブと国際配送向け英語を両方確認してください。',
      en: 'They mean only part of the address could be verified. Confidence improves when postal code, administrative area, street, and building fields match. Before shipping, compare the native tab and international English tab.',
    },
  },
  {
    id: 'sea-mountain-water',
    question: {
      ja: '海・山・水辺など住所がない場所はどう扱いますか？',
      en: 'How are seas, mountains, and waterside places handled?',
    },
    answer: {
      ja: '通常住所がない場所は、AGID、座標、海域・自然地形の判定、近傍地名を組み合わせて表示します。郵便住所ではないため、現地到達には座標や地図リンクも併用してください。',
      en: 'Places without postal addresses combine AGID, coordinates, sea or natural-feature classification, and nearby names. Because this is not a postal address, use coordinates or map links for navigation.',
    },
  },
];

const SELF_SERVICE_SECTIONS: LocalizedSelfService[] = [
  {
    id: 'location',
    title: {
      ja: '現在地が合わない',
      en: 'Location looks wrong',
    },
    steps: [
      {
        ja: 'ブラウザの位置情報許可が許可済みか確認する。',
        en: 'Check that browser location permission is allowed.',
      },
      {
        ja: 'OS側の位置情報、VPN、ブラウザ拡張、屋内環境の影響を確認する。',
        en: 'Check OS location settings, VPN, browser extensions, and indoor signal conditions.',
      },
      {
        ja: '検索欄に住所、AGID、または緯度経度を入れて手動で合わせる。',
        en: 'Use the search box with an address, AGID, or coordinates to position the map manually.',
      },
    ],
  },
  {
    id: 'address',
    title: {
      ja: '住所が正しくない',
      en: 'Address looks wrong',
    },
    steps: [
      {
        ja: '国 / 地域が正しく選ばれているか確認する。',
        en: 'Confirm that the country or region is selected correctly.',
      },
      {
        ja: '郵便番号がある国では郵便番号を先に入力する。',
        en: 'For countries with postal codes, enter the postal code first.',
      },
      {
        ja: '現地語タブと国際配送向け英語タブを切り替えて順序を比較する。',
        en: 'Compare the native tab and international English tab for ordering differences.',
      },
    ],
  },
  {
    id: 'search',
    title: {
      ja: '検索結果が出ない',
      en: 'No search result',
    },
    steps: [
      {
        ja: '現地語、英語、郵便番号、建物名、近い駅名の順に試す。',
        en: 'Try native name, English name, postal code, building name, then a nearby station or landmark.',
      },
      {
        ja: '誤字がある場合は短い地名だけで検索する。',
        en: 'If spelling may be wrong, search a shorter place name.',
      },
      {
        ja: 'それでも出ない場合は緯度経度または地図クリックでAGIDを作る。',
        en: 'If it still fails, use coordinates or click the map to create an AGID.',
      },
    ],
  },
  {
    id: 'grid',
    title: {
      ja: 'グリッド表示が変に見える',
      en: 'Grid display looks odd',
    },
    steps: [
      {
        ja: 'ズーム15以上で黒い線が自動表示されるまで待つ。',
        en: 'At zoom 15 or higher, wait for black grid lines to appear automatically.',
      },
      {
        ja: 'パン・ズーム直後は再生成が終わるまで数秒待つ。',
        en: 'After panning or zooming, wait a few seconds for regeneration.',
      },
      {
        ja: '地図スタイル変更後に古い表示が残る時は再読み込みする。',
        en: 'Reload if old layers remain after changing the map style.',
      },
    ],
  },
  {
    id: 'shipping',
    title: {
      ja: '配送用住所を作る',
      en: 'Prepare a shipping address',
    },
    steps: [
      {
        ja: '国 / 地域を先に選び、住所に使われる言語タブを確認する。',
        en: 'Select the country or region first, then check the address-language tabs.',
      },
      {
        ja: '郵便番号、行政区画、道路名、建物名、部屋番号を分けて入力する。',
        en: 'Separate postal code, administrative area, street, building, and unit fields.',
      },
      {
        ja: '最後に国際配送向け英語タブで改行と順序を確認する。',
        en: 'Finally check line breaks and order in the international English tab.',
      },
    ],
  },
];

const SOURCE_NOTES: LocalizedSource[] = [
  {
    id: 'maplibre',
    label: 'MapLibre GL JS',
    url: 'https://maplibre.org/projects/gl-js/',
    summary: {
      ja: '公式説明では、WebGLでベクタータイルを描画するオープンソースTypeScriptライブラリです。',
      en: 'Official docs describe it as an open-source TypeScript library that renders vector tiles with WebGL.',
    },
  },
  {
    id: 'osm',
    label: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/copyright',
    summary: {
      ja: 'OSMデータはODbLのオープンデータで、利用時はOpenStreetMapへの表示帰属が必要です。',
      en: 'OSM data is open data under ODbL and requires visible attribution to OpenStreetMap.',
    },
  },
  {
    id: 'openfreemap',
    label: 'OpenFreeMap',
    url: 'https://openfreemap.org/',
    summary: {
      ja: '公式サイトでは、登録やAPIキーなしで使えるオープンソース地図ホスティングとして説明されています。',
      en: 'The official site describes it as open-source map hosting without registration or API keys.',
    },
  },
  {
    id: 'mdn-geolocation',
    label: 'MDN Geolocation API',
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API',
    summary: {
      ja: 'Web位置情報は安全な接続とユーザー許可の対象で、ブラウザやOS設定で拒否されることがあります。',
      en: 'Web geolocation requires a secure context and user permission, and may be denied by browser or OS settings.',
    },
  },
  {
    id: 'libaddressinput',
    label: 'Google libaddressinput',
    url: 'https://github.com/google/libaddressinput',
    summary: {
      ja: 'GoogleのOSS住所ライブラリで、国別住所メタデータを使って住所入力・検証を支援します。',
      en: 'Google open-source address libraries use country metadata to assist address collection and validation.',
    },
  },
  {
    id: 'opencage',
    label: 'OpenCage address-formatting',
    url: 'https://github.com/OpenCageData/address-formatting',
    summary: {
      ja: '国・地域ごとの住所表示テンプレートとテストケースを持つOSSリポジトリです。',
      en: 'An OSS repository of country and territory address-format templates and test cases.',
    },
  },
  {
    id: 'nominatim',
    label: 'Nominatim',
    url: 'https://nominatim.org/',
    summary: {
      ja: 'OSMデータを検索・逆ジオコーディングするためのオープンソースソフトウェアです。',
      en: 'Open-source software for searching and reverse geocoding OpenStreetMap data.',
    },
  },
];

function isJapanese(language: string) {
  return language.toLowerCase().startsWith('ja');
}

function localize(text: LocalizedText, language: string) {
  return isJapanese(language) ? text.ja : text.en;
}

export function getHelpFaqItems(language: string): HelpFaqItem[] {
  return FAQ_ITEMS.map(item => ({
    id: item.id,
    question: localize(item.question, language),
    answer: localize(item.answer, language),
  }));
}

export function getHelpSelfServiceSections(language: string): HelpSelfServiceSection[] {
  return SELF_SERVICE_SECTIONS.map(section => ({
    id: section.id,
    title: localize(section.title, language),
    steps: section.steps.map(step => localize(step, language)),
  }));
}

export function getHelpSourceNotes(language: string): HelpSourceNote[] {
  return SOURCE_NOTES.map(note => ({
    id: note.id,
    label: note.label,
    summary: localize(note.summary, language),
    url: note.url,
  }));
}

export function getHelpCenterContent(language: string): HelpCenterContent {
  return {
    title: localize(HELP_HEADER.title, language),
    intro: localize(HELP_HEADER.intro, language),
    factCheckedTitle: localize(HELP_HEADER.factCheckedTitle, language),
    selfServiceTitle: localize(HELP_HEADER.selfServiceTitle, language),
    faqTitle: localize(HELP_HEADER.faqTitle, language),
    qualityTitle: localize(HELP_HEADER.qualityTitle, language),
    qualityBody: localize(HELP_HEADER.qualityBody, language),
    faqItems: getHelpFaqItems(language),
    selfServiceSections: getHelpSelfServiceSections(language),
    sourceNotes: getHelpSourceNotes(language),
  };
}

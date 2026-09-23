import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';

type Placement = {
  continents: Array<{
    id: string;
    order: number;
    regions: Array<{
      id: string;
      countries: Array<{
        code: string;
        repository: string;
        splitStrategy: string;
        recommendedChildren: string[];
      }>;
    }>;
  }>;
};

async function readPlacement() {
  const text = await readFile(
    path.join(process.cwd(), 'data/global_entities/agid-repository-placement.json'),
    'utf8',
  );
  return JSON.parse(text) as Placement;
}

function countriesOf(placement: Placement) {
  return placement.continents.flatMap(continent =>
    continent.regions.flatMap(region =>
      region.countries.map(country => ({
        continent: continent.id,
        region: region.id,
        ...country,
      })),
    ),
  );
}

test('global repository placement is Asia-first and covers all continent indexes', async () => {
  const placement = await readPlacement();
  assert.deepEqual(
    placement.continents.map(continent => continent.id),
    ['asia', 'europe', 'africa', 'americas', 'oceania', 'antarctica'],
  );
  assert.equal(placement.continents[0]?.order, 1);
});

test('global repository placement keeps Caucasus canonical under Asia', async () => {
  const placement = await readPlacement();
  const caucasus = countriesOf(placement).filter(country => ['AM', 'AZ', 'GE'].includes(country.code));
  assert.equal(caucasus.length, 3);
  assert.ok(caucasus.every(country => country.continent === 'asia'));
  assert.ok(caucasus.every(country => country.region === 'caucasus'));
});

test('global repository placement splits large countries into child repositories', async () => {
  const placement = await readPlacement();
  const byCode = new Map(countriesOf(placement).map(country => [country.code, country]));

  for (const code of [
    'US', 'CA', 'MX',
    'BR', 'AR', 'CO', 'PE', 'CL',
    'GB', 'FR', 'DE', 'IT', 'ES', 'PL', 'RO', 'SE', 'UA', 'RU', 'NL', 'CH', 'AT', 'PT', 'GR',
    'CN', 'IN', 'JP', 'ID', 'PK', 'BD', 'IR', 'TR', 'SA', 'PH', 'VN', 'TH', 'MY', 'KR',
    'NG', 'ET', 'ZA', 'EG', 'KE', 'TZ', 'DZ', 'CD',
    'AU',
  ]) {
    const country = byCode.get(code);
    assert.ok(country, `${code} should exist`);
    assert.equal(country.splitStrategy, 'country-index-plus-child-repositories');
    assert.ok(country.recommendedChildren.length >= 3, `${code} should recommend child repositories`);
  }
});

test('global repository placement keeps small countries single until split evidence is needed', async () => {
  const placement = await readPlacement();
  const byCode = new Map(countriesOf(placement).map(country => [country.code, country]));

  for (const code of ['UY', 'SG']) {
    const country = byCode.get(code);
    assert.ok(country, `${code} should exist`);
    assert.equal(country.splitStrategy, 'single-country-or-territory-pack');
    assert.equal(country.recommendedChildren.length, 0);
  }
});

test('global repository placement keeps listed Asia single repositories as single country packs', async () => {
  const placement = await readPlacement();
  const byCode = new Map(countriesOf(placement).map(country => [country.code, country]));
  const expectedSingleAsia = [
    'MN', 'HK', 'MO',
    'SG', 'BN', 'TL',
    'BT', 'MV',
    'AE', 'BH', 'KW', 'QA', 'OM', 'YE', 'LB', 'SY', 'JO', 'IQ', 'IL', 'PS',
    'AM', 'AZ', 'GE',
    'KZ', 'KG', 'TJ', 'TM', 'UZ',
  ];

  for (const code of expectedSingleAsia) {
    const country = byCode.get(code);
    assert.ok(country, `${code} should exist`);
    assert.equal(country.continent, 'asia', `${code} should be canonical under Asia`);
    assert.equal(country.repository, `agid-country-${code.toLowerCase()}`);
    assert.equal(country.splitStrategy, 'single-country-or-territory-pack', `${code} should remain single`);
    assert.equal(country.recommendedChildren.length, 0, `${code} should not recommend child repositories`);
  }

  assert.equal(expectedSingleAsia.length, 28);
});

test('global repository placement keeps Asia multi-repository allowlist bounded', async () => {
  const placement = await readPlacement();
  const asiaCountries = countriesOf(placement).filter(country => country.continent === 'asia');
  const expectedSplitAsia = new Set([
    'CN', 'JP', 'KR', 'IN', 'ID', 'PK', 'BD', 'IR', 'TR', 'SA', 'PH', 'VN', 'TH', 'MY',
  ]);
  const actualSplitAsia = new Set(
    asiaCountries
      .filter(country => country.splitStrategy === 'country-index-plus-child-repositories')
      .map(country => country.code),
  );

  assert.deepEqual(actualSplitAsia, expectedSplitAsia);
});

test('global repository placement keeps listed Africa countries and territories as single repositories', async () => {
  const placement = await readPlacement();
  const byCode = new Map(countriesOf(placement).map(country => [country.code, country]));
  const expectedSingleAfrica = [
    'LY', 'MA', 'TN', 'EH',
    'BJ', 'BF', 'CV', 'CI', 'GM', 'GH', 'GN', 'GW', 'LR', 'ML', 'MR', 'NE', 'SN', 'SL', 'TG',
    'CF', 'CG', 'GQ', 'GA', 'CM', 'TD', 'ST',
    'BI', 'DJ', 'ER', 'SZ', 'RW', 'SC', 'SO', 'SS', 'UG', 'KM', 'MU',
    'AO', 'BW', 'LS', 'MG', 'MW', 'MZ', 'NA', 'ZM', 'ZW',
  ];

  for (const code of expectedSingleAfrica) {
    const country = byCode.get(code);
    assert.ok(country, `${code} should exist`);
    assert.equal(country.continent, 'africa', `${code} should be canonical under Africa`);
    assert.equal(country.repository, `agid-country-${code.toLowerCase()}`);
    assert.equal(country.splitStrategy, 'single-country-or-territory-pack', `${code} should remain single`);
    assert.equal(country.recommendedChildren.length, 0, `${code} should not recommend child repositories`);
  }

  assert.equal(expectedSingleAfrica.length, 46);
});

test('global repository placement keeps Africa multi-repository allowlist bounded', async () => {
  const placement = await readPlacement();
  const africaCountries = countriesOf(placement).filter(country => country.continent === 'africa');
  const expectedSplitAfrica = new Set(['NG', 'ET', 'ZA', 'EG', 'KE', 'TZ', 'DZ', 'CD']);
  const actualSplitAfrica = new Set(
    africaCountries
      .filter(country => country.splitStrategy === 'country-index-plus-child-repositories')
      .map(country => country.code),
  );

  assert.deepEqual(actualSplitAfrica, expectedSplitAfrica);
});

test('global repository placement keeps listed Americas countries and territories as single repositories', async () => {
  const placement = await readPlacement();
  const byCode = new Map(countriesOf(placement).map(country => [country.code, country]));
  const expectedSingleAmericas = [
    'PM', 'BM',
    'BZ', 'GT', 'SV', 'HN', 'NI', 'CR', 'PA',
    'AI', 'AG', 'AW', 'BS', 'BB', 'BQ', 'KY', 'CU', 'CW', 'DM', 'DO', 'GD', 'GP', 'HT', 'JM',
    'MQ', 'MS', 'PR', 'BL', 'MF', 'KN', 'LC', 'VC', 'SX', 'TT', 'TC', 'VI', 'VG',
    'BO', 'EC', 'FK', 'GF', 'GY', 'PY', 'GS', 'SR', 'UY', 'VE',
  ];

  for (const code of expectedSingleAmericas) {
    const country = byCode.get(code);
    assert.ok(country, `${code} should exist`);
    assert.equal(country.continent, 'americas', `${code} should be canonical under Americas`);
    assert.equal(country.repository, `agid-country-${code.toLowerCase()}`);
    assert.equal(country.splitStrategy, 'single-country-or-territory-pack', `${code} should remain single`);
    assert.equal(country.recommendedChildren.length, 0, `${code} should not recommend child repositories`);
  }

  assert.equal(expectedSingleAmericas.length, 47);
});

test('global repository placement keeps Americas multi-repository allowlist bounded', async () => {
  const placement = await readPlacement();
  const americasCountries = countriesOf(placement).filter(country => country.continent === 'americas');
  const expectedSplitAmericas = new Set(['US', 'CA', 'MX', 'BR', 'AR', 'CO', 'PE', 'CL']);
  const actualSplitAmericas = new Set(
    americasCountries
      .filter(country => country.splitStrategy === 'country-index-plus-child-repositories')
      .map(country => country.code),
  );

  assert.deepEqual(actualSplitAmericas, expectedSplitAmericas);
});

test('global repository placement keeps listed Oceania countries and territories as single repositories', async () => {
  const placement = await readPlacement();
  const byCode = new Map(countriesOf(placement).map(country => [country.code, country]));
  const expectedSingleOceania = [
    'NZ', 'PG', 'FJ', 'SB', 'VU', 'WS', 'TO', 'TV', 'NR', 'KI', 'FM', 'PW', 'MH',
    'CK', 'NU', 'TK',
    'CX', 'CC', 'NF', 'HM', 'AU-AT', 'AU-CS', 'AU-AC',
    'NC', 'PF', 'WF', 'TF',
    'GU', 'MP', 'AS', 'UM',
    'PN',
    'CL-EI',
    'BV',
  ];

  for (const code of expectedSingleOceania) {
    const country = byCode.get(code);
    assert.ok(country, `${code} should exist`);
    assert.equal(country.continent, 'oceania', `${code} should be canonical under Oceania`);
    assert.equal(country.repository, `agid-country-${code.toLowerCase()}`);
    assert.equal(country.splitStrategy, 'single-country-or-territory-pack', `${code} should remain single`);
    assert.equal(country.recommendedChildren.length, 0, `${code} should not recommend child repositories`);
  }

  assert.equal(expectedSingleOceania.length, 34);
});

test('global repository placement keeps Oceania multi-repository allowlist bounded', async () => {
  const placement = await readPlacement();
  const oceaniaCountries = countriesOf(placement).filter(country => country.continent === 'oceania');
  const actualSplitOceania = new Set(
    oceaniaCountries
      .filter(country => country.splitStrategy === 'country-index-plus-child-repositories')
      .map(country => country.code),
  );

  assert.deepEqual(actualSplitOceania, new Set(['AU']));
});

test('global repository placement promotes priority A countries into multi-repository plans', async () => {
  const placement = await readPlacement();
  const byCode = new Map(countriesOf(placement).map(country => [country.code, country]));
  const expected: Record<string, string[]> = {
    CL: ['agid-cl-santiago-metropolitan', 'agid-cl-santiago-metro', 'agid-cl-magallanes'],
    NL: ['agid-nl-north-holland', 'agid-nl-bonaire', 'agid-nl-amsterdam'],
    CH: ['agid-ch-zurich', 'agid-ch-geneva', 'agid-ch-lugano'],
    AT: ['agid-at-vienna', 'agid-at-graz', 'agid-at-tyrol'],
    PT: ['agid-pt-lisbon', 'agid-pt-azores', 'agid-pt-madeira'],
    GR: ['agid-gr-attica', 'agid-gr-athens-metro', 'agid-gr-mount-athos'],
  };

  for (const [code, childRepos] of Object.entries(expected)) {
    const country = byCode.get(code);
    assert.ok(country, `${code} should exist`);
    assert.equal(country.splitStrategy, 'country-index-plus-child-repositories');
    assert.ok(country.recommendedChildren.length >= 8, `${code} should have a meaningful child repository plan`);
    for (const repo of childRepos) {
      assert.ok(country.recommendedChildren.includes(repo), `${repo} should be a ${code} child repository`);
    }
  }
});

test('global repository placement keeps requested countries as single repositories', async () => {
  const placement = await readPlacement();
  const byCode = new Map(countriesOf(placement).map(country => [country.code, country]));

  for (const code of ['HK', 'AE', 'NZ', 'BE']) {
    const country = byCode.get(code);
    assert.ok(country, `${code} should exist`);
    assert.equal(country.repository, `agid-country-${code.toLowerCase()}`);
    assert.equal(country.splitStrategy, 'single-country-or-territory-pack', `${code} should be a single repository`);
    assert.equal(country.recommendedChildren.length, 0, `${code} should not recommend child repositories`);
  }
});

test('global repository placement keeps Netherlands overseas territory coverage in the NL plan', async () => {
  const placement = await readPlacement();
  const netherlands = countriesOf(placement).find(country => country.code === 'NL');

  assert.ok(netherlands, 'NL should exist');
  assert.equal(netherlands.repository, 'agid-country-nl');
  assert.equal(netherlands.splitStrategy, 'country-index-plus-child-repositories');

  for (const repo of [
    'agid-nl-bonaire',
    'agid-nl-sint-eustatius',
    'agid-nl-saba',
    'agid-nl-aruba',
    'agid-nl-curacao',
    'agid-nl-sint-maarten',
  ]) {
    assert.ok(netherlands.recommendedChildren.includes(repo), `${repo} should be covered by the Netherlands plan`);
  }
});

test('global repository placement keeps non-split Europe countries and territories as single repositories', async () => {
  const placement = await readPlacement();
  const byCode = new Map(countriesOf(placement).map(country => [country.code, country]));
  const expectedSingleEurope = [
    'DK', 'FI', 'IS', 'IE', 'NO',
    'EE', 'LV', 'LT',
    'BE', 'LU', 'LI', 'MC', 'AD', 'SM', 'VA', 'MT',
    'CZ', 'SK', 'HU', 'SI',
    'HR', 'BA', 'RS', 'ME', 'XK', 'AL', 'MK', 'BG', 'MD',
    'GL', 'FO', 'AX',
    'IM', 'JE', 'GG',
    'GI', 'AK',
  ];

  for (const code of expectedSingleEurope) {
    const country = byCode.get(code);
    assert.ok(country, `${code} should exist`);
    assert.equal(country.continent, 'europe', `${code} should be canonical under Europe`);
    assert.equal(country.repository, `agid-country-${code.toLowerCase()}`);
    assert.equal(country.splitStrategy, 'single-country-or-territory-pack', `${code} should remain single`);
    assert.equal(country.recommendedChildren.length, 0, `${code} should not recommend child repositories`);
  }

  assert.equal(expectedSingleEurope.length, 37);
});

test('global repository placement expands Egypt into a 46 repository plan', async () => {
  const placement = await readPlacement();
  const egypt = countriesOf(placement).find(country => country.code === 'EG');

  assert.ok(egypt, 'EG should exist');
  assert.equal(egypt.repository, 'agid-country-eg');
  assert.equal(egypt.recommendedChildren.length, 45);
  assert.equal(1 + egypt.recommendedChildren.length, 46);

  for (const repo of [
    'agid-eg-cairo',
    'agid-eg-cairo-metro',
    'agid-eg-giza',
    'agid-eg-giza-city',
    'agid-eg-alexandria',
    'agid-eg-alexandria-city',
    'agid-eg-red-sea',
    'agid-eg-hurghada',
  ]) {
    assert.ok(egypt.recommendedChildren.includes(repo), `${repo} should be an Egypt child repository`);
  }
});

test('global repository placement expands Kenya into a 67 repository plan', async () => {
  const placement = await readPlacement();
  const kenya = countriesOf(placement).find(country => country.code === 'KE');

  assert.ok(kenya, 'KE should exist');
  assert.equal(kenya.repository, 'agid-country-ke');
  assert.equal(kenya.recommendedChildren.length, 66);
  assert.equal(1 + kenya.recommendedChildren.length, 67);

  for (const repo of [
    'agid-ke-nairobi',
    'agid-ke-nairobi-metro',
    'agid-ke-mombasa',
    'agid-ke-mombasa-city',
    'agid-ke-kisumu',
    'agid-ke-kisumu-city',
    'agid-ke-uasin-gishu',
    'agid-ke-eldoret',
    'agid-ke-lamu',
  ]) {
    assert.ok(kenya.recommendedChildren.includes(repo), `${repo} should be a Kenya child repository`);
  }
});

test('global repository placement expands Tanzania into a 48 repository plan', async () => {
  const placement = await readPlacement();
  const tanzania = countriesOf(placement).find(country => country.code === 'TZ');

  assert.ok(tanzania, 'TZ should exist');
  assert.equal(tanzania.repository, 'agid-country-tz');
  assert.equal(tanzania.recommendedChildren.length, 47);
  assert.equal(1 + tanzania.recommendedChildren.length, 48);

  for (const repo of [
    'agid-tz-dar-es-salaam',
    'agid-tz-dar-es-salaam-metro',
    'agid-tz-dodoma',
    'agid-tz-dodoma-city',
    'agid-tz-zanzibar-urban-west',
    'agid-tz-zanzibar-city',
    'agid-tz-kilimanjaro',
    'agid-tz-moshi',
  ]) {
    assert.ok(tanzania.recommendedChildren.includes(repo), `${repo} should be a Tanzania child repository`);
  }
});

test('global repository placement expands Algeria into an 84 repository plan', async () => {
  const placement = await readPlacement();
  const algeria = countriesOf(placement).find(country => country.code === 'DZ');

  assert.ok(algeria, 'DZ should exist');
  assert.equal(algeria.repository, 'agid-country-dz');
  assert.equal(algeria.recommendedChildren.length, 83);
  assert.equal(1 + algeria.recommendedChildren.length, 84);

  for (const repo of [
    'agid-dz-algiers',
    'agid-dz-algiers-metro',
    'agid-dz-oran',
    'agid-dz-oran-city',
    'agid-dz-constantine',
    'agid-dz-constantine-city',
    'agid-dz-tamanrasset',
    'agid-dz-timimoun',
    'agid-dz-djanet',
  ]) {
    assert.ok(algeria.recommendedChildren.includes(repo), `${repo} should be an Algeria child repository`);
  }
});

test('global repository placement expands the Democratic Republic of the Congo into a 47 repository plan', async () => {
  const placement = await readPlacement();
  const congo = countriesOf(placement).find(country => country.code === 'CD');

  assert.ok(congo, 'CD should exist');
  assert.equal(congo.repository, 'agid-country-cd');
  assert.equal(congo.recommendedChildren.length, 46);
  assert.equal(1 + congo.recommendedChildren.length, 47);

  for (const repo of [
    'agid-cd-kinshasa',
    'agid-cd-kinshasa-metro',
    'agid-cd-kongo-central',
    'agid-cd-haut-katanga',
    'agid-cd-lubumbashi',
    'agid-cd-goma',
    'agid-cd-bukavu',
    'agid-cd-kindu',
  ]) {
    assert.ok(congo.recommendedChildren.includes(repo), `${repo} should be a DR Congo child repository`);
  }
});

test('global repository placement expands Australia into a 22 repository plan and leaves external territories independent', async () => {
  const placement = await readPlacement();
  const australia = countriesOf(placement).find(country => country.code === 'AU');

  assert.ok(australia, 'AU should exist');
  assert.equal(australia.repository, 'agid-country-au');
  assert.equal(australia.recommendedChildren.length, 21);
  assert.equal(1 + australia.recommendedChildren.length, 22);

  for (const repo of [
    'agid-au-new-south-wales',
    'agid-au-victoria',
    'agid-au-australian-capital-territory',
    'agid-au-sydney',
    'agid-au-melbourne',
    'agid-au-townsville',
  ]) {
    assert.ok(australia.recommendedChildren.includes(repo), `${repo} should be an Australia child repository`);
  }

  for (const repo of [
    'agid-au-christmas-island',
    'agid-au-cocos-keeling-islands',
    'agid-au-norfolk-island',
    'agid-au-australian-antarctic-territory',
  ]) {
    assert.ok(!australia.recommendedChildren.includes(repo), `${repo} should be an independent territory pack`);
  }
});

test('global repository placement expands China into a 60 repository plan', async () => {
  const placement = await readPlacement();
  const china = countriesOf(placement).find(country => country.code === 'CN');

  assert.ok(china, 'CN should exist');
  assert.equal(china.repository, 'agid-country-cn');
  assert.equal(china.recommendedChildren.length, 59);
  assert.equal(1 + china.recommendedChildren.length, 60);

  for (const repo of [
    'agid-cn-guangdong',
    'agid-cn-jiangsu',
    'agid-cn-zhejiang',
    'agid-cn-sichuan',
    'agid-cn-henan',
    'agid-cn-hong-kong',
    'agid-cn-macau',
    'agid-cn-taiwan',
    'agid-cn-beijing-city',
    'agid-cn-shanghai-city',
    'agid-cn-shenzhen',
    'agid-cn-xian',
  ]) {
    assert.ok(china.recommendedChildren.includes(repo), `${repo} should be a China child repository`);
  }
});

test('global repository placement expands India into a 62 repository plan', async () => {
  const placement = await readPlacement();
  const india = countriesOf(placement).find(country => country.code === 'IN');

  assert.ok(india, 'IN should exist');
  assert.equal(india.repository, 'agid-country-in');
  assert.equal(india.recommendedChildren.length, 61);
  assert.equal(1 + india.recommendedChildren.length, 62);

  for (const repo of [
    'agid-in-maharashtra',
    'agid-in-mumbai',
    'agid-in-karnataka',
    'agid-in-bengaluru',
    'agid-in-tamil-nadu',
    'agid-in-delhi',
    'agid-in-delhi-metro',
    'agid-in-jammu-and-kashmir',
    'agid-in-ladakh',
    'agid-in-thiruvananthapuram',
  ]) {
    assert.ok(india.recommendedChildren.includes(repo), `${repo} should be an India child repository`);
  }
});

test('global repository placement expands Indonesia into a 60 repository plan', async () => {
  const placement = await readPlacement();
  const indonesia = countriesOf(placement).find(country => country.code === 'ID');

  assert.ok(indonesia, 'ID should exist');
  assert.equal(indonesia.repository, 'agid-country-id');
  assert.equal(indonesia.recommendedChildren.length, 59);
  assert.equal(1 + indonesia.recommendedChildren.length, 60);

  for (const repo of [
    'agid-id-aceh',
    'agid-id-jakarta',
    'agid-id-jakarta-metro',
    'agid-id-west-java',
    'agid-id-east-java',
    'agid-id-bali',
    'agid-id-southwest-papua',
    'agid-id-highland-papua',
    'agid-id-surabaya',
    'agid-id-balikpapan',
    'agid-id-manado',
  ]) {
    assert.ok(indonesia.recommendedChildren.includes(repo), `${repo} should be an Indonesia child repository`);
  }
});

test('global repository placement expands Japan into a 68 repository plan with every designated city', async () => {
  const placement = await readPlacement();
  const japan = countriesOf(placement).find(country => country.code === 'JP');

  assert.ok(japan, 'JP should exist');
  assert.equal(japan.repository, 'agid-country-jp');
  assert.equal(japan.recommendedChildren.length, 67);
  assert.equal(1 + japan.recommendedChildren.length, 68);

  for (const repo of [
    'agid-jp-hokkaido',
    'agid-jp-tokyo',
    'agid-jp-tokyo-23',
    'agid-jp-kanagawa',
    'agid-jp-yokohama',
    'agid-jp-osaka-prefecture',
    'agid-jp-osaka',
    'agid-jp-aichi',
    'agid-jp-nagoya',
    'agid-jp-okinawa',
    'agid-jp-sapporo',
    'agid-jp-sendai',
    'agid-jp-saitama',
    'agid-jp-chiba',
    'agid-jp-kawasaki',
    'agid-jp-sagamihara',
    'agid-jp-niigata',
    'agid-jp-shizuoka-city',
    'agid-jp-hamamatsu',
    'agid-jp-kyoto',
    'agid-jp-kobe',
    'agid-jp-okayama-city',
    'agid-jp-hiroshima',
    'agid-jp-kitakyushu',
    'agid-jp-fukuoka',
    'agid-jp-kumamoto-city',
  ]) {
    assert.ok(japan.recommendedChildren.includes(repo), `${repo} should be a Japan child repository`);
  }
});

test('global repository placement expands Bangladesh into a 27 repository plan', async () => {
  const placement = await readPlacement();
  const bangladesh = countriesOf(placement).find(country => country.code === 'BD');

  assert.ok(bangladesh, 'BD should exist');
  assert.equal(bangladesh.repository, 'agid-country-bd');
  assert.equal(bangladesh.recommendedChildren.length, 26);
  assert.equal(1 + bangladesh.recommendedChildren.length, 27);

  for (const repo of [
    'agid-bd-dhaka',
    'agid-bd-dhaka-metro',
    'agid-bd-chattogram',
    'agid-bd-chattogram-city',
    'agid-bd-sylhet',
    'agid-bd-coxs-bazar',
  ]) {
    assert.ok(bangladesh.recommendedChildren.includes(repo), `${repo} should be a Bangladesh child repository`);
  }
});

test('global repository placement expands Saudi Arabia into a 32 repository plan', async () => {
  const placement = await readPlacement();
  const saudiArabia = countriesOf(placement).find(country => country.code === 'SA');

  assert.ok(saudiArabia, 'SA should exist');
  assert.equal(saudiArabia.repository, 'agid-country-sa');
  assert.equal(saudiArabia.recommendedChildren.length, 31);
  assert.equal(1 + saudiArabia.recommendedChildren.length, 32);

  for (const repo of [
    'agid-sa-riyadh',
    'agid-sa-riyadh-city',
    'agid-sa-makkah',
    'agid-sa-makkah-city',
    'agid-sa-eastern-province',
    'agid-sa-jeddah',
    'agid-sa-jazan-city',
  ]) {
    assert.ok(saudiArabia.recommendedChildren.includes(repo), `${repo} should be a Saudi Arabia child repository`);
  }
});

test('global repository placement expands Iran into a 52 repository plan', async () => {
  const placement = await readPlacement();
  const iran = countriesOf(placement).find(country => country.code === 'IR');

  assert.ok(iran, 'IR should exist');
  assert.equal(iran.repository, 'agid-country-ir');
  assert.equal(iran.recommendedChildren.length, 51);
  assert.equal(1 + iran.recommendedChildren.length, 52);

  for (const repo of [
    'agid-ir-tehran',
    'agid-ir-tehran-city',
    'agid-ir-khorasan-razavi',
    'agid-ir-mashhad',
    'agid-ir-isfahan',
    'agid-ir-isfahan-city',
    'agid-ir-sistan-and-baluchestan',
    'agid-ir-zahedan',
  ]) {
    assert.ok(iran.recommendedChildren.includes(repo), `${repo} should be an Iran child repository`);
  }
});

test('global repository placement expands the Philippines into a 105 repository plan', async () => {
  const placement = await readPlacement();
  const philippines = countriesOf(placement).find(country => country.code === 'PH');

  assert.ok(philippines, 'PH should exist');
  assert.equal(philippines.repository, 'agid-country-ph');
  assert.equal(philippines.recommendedChildren.length, 104);
  assert.equal(1 + philippines.recommendedChildren.length, 105);

  for (const repo of [
    'agid-ph-metro-manila',
    'agid-ph-cebu',
    'agid-ph-cebu-city',
    'agid-ph-cavite',
    'agid-ph-davao-city',
    'agid-ph-maguindanao-del-norte',
    'agid-ph-maguindanao-del-sur',
    'agid-ph-mandaluyong',
  ]) {
    assert.ok(philippines.recommendedChildren.includes(repo), `${repo} should be a Philippines child repository`);
  }
});

test('global repository placement expands Turkey into a 97 repository plan', async () => {
  const placement = await readPlacement();
  const turkey = countriesOf(placement).find(country => country.code === 'TR');

  assert.ok(turkey, 'TR should exist');
  assert.equal(turkey.repository, 'agid-country-tr');
  assert.equal(turkey.recommendedChildren.length, 96);
  assert.equal(1 + turkey.recommendedChildren.length, 97);

  for (const repo of [
    'agid-tr-istanbul-province',
    'agid-tr-istanbul',
    'agid-tr-ankara',
    'agid-tr-ankara-city',
    'agid-tr-izmir-province',
    'agid-tr-izmir',
    'agid-tr-zonguldak',
    'agid-tr-trabzon',
  ]) {
    assert.ok(turkey.recommendedChildren.includes(repo), `${repo} should be a Turkey child repository`);
  }
});

test('global repository placement expands Vietnam into a 65 repository plan', async () => {
  const placement = await readPlacement();
  const vietnam = countriesOf(placement).find(country => country.code === 'VN');

  assert.ok(vietnam, 'VN should exist');
  assert.equal(vietnam.repository, 'agid-country-vn');
  assert.equal(vietnam.recommendedChildren.length, 64);
  assert.equal(1 + vietnam.recommendedChildren.length, 65);

  for (const repo of [
    'agid-vn-ha-noi',
    'agid-vn-ho-chi-minh-city',
    'agid-vn-da-nang',
    'agid-vn-ba-ria-vung-tau',
    'agid-vn-thua-thien-hue',
    'agid-vn-thu-duc',
  ]) {
    assert.ok(vietnam.recommendedChildren.includes(repo), `${repo} should be a Vietnam child repository`);
  }
});

test('global repository placement expands Thailand into a 95 repository plan', async () => {
  const placement = await readPlacement();
  const thailand = countriesOf(placement).find(country => country.code === 'TH');

  assert.ok(thailand, 'TH should exist');
  assert.equal(thailand.repository, 'agid-country-th');
  assert.equal(thailand.recommendedChildren.length, 94);
  assert.equal(1 + thailand.recommendedChildren.length, 95);

  for (const repo of [
    'agid-th-bangkok',
    'agid-th-bangkok-metro',
    'agid-th-chiang-mai',
    'agid-th-chiang-mai-city',
    'agid-th-phuket',
    'agid-th-phuket-city',
    'agid-th-pattaya',
    'agid-th-hua-hin',
  ]) {
    assert.ok(thailand.recommendedChildren.includes(repo), `${repo} should be a Thailand child repository`);
  }
});

test('global repository placement expands Malaysia into a 32 repository plan', async () => {
  const placement = await readPlacement();
  const malaysia = countriesOf(placement).find(country => country.code === 'MY');

  assert.ok(malaysia, 'MY should exist');
  assert.equal(malaysia.repository, 'agid-country-my');
  assert.equal(malaysia.recommendedChildren.length, 31);
  assert.equal(1 + malaysia.recommendedChildren.length, 32);

  for (const repo of [
    'agid-my-kuala-lumpur',
    'agid-my-kuala-lumpur-metro',
    'agid-my-selangor',
    'agid-my-george-town',
    'agid-my-subang-jaya',
    'agid-my-miri',
  ]) {
    assert.ok(malaysia.recommendedChildren.includes(repo), `${repo} should be a Malaysia child repository`);
  }
});

test('global repository placement expands South Korea into a 38 repository plan', async () => {
  const placement = await readPlacement();
  const korea = countriesOf(placement).find(country => country.code === 'KR');

  assert.ok(korea, 'KR should exist');
  assert.equal(korea.repository, 'agid-country-kr');
  assert.equal(korea.recommendedChildren.length, 37);
  assert.equal(1 + korea.recommendedChildren.length, 38);

  for (const repo of [
    'agid-kr-seoul',
    'agid-kr-seoul-metro',
    'agid-kr-busan',
    'agid-kr-busan-city',
    'agid-kr-gyeonggi',
    'agid-kr-suwon',
    'agid-kr-hwaseong',
    'agid-kr-namyangju',
    'agid-kr-jeju',
  ]) {
    assert.ok(korea.recommendedChildren.includes(repo), `${repo} should be a South Korea child repository`);
  }
});

test('global repository placement expands the United States into 75 repositories', async () => {
  const placement = await readPlacement();
  const allCountries = countriesOf(placement);
  const usEntries = allCountries.filter(country => country.repository === 'agid-country-us');
  const us = usEntries[0];

  assert.equal(usEntries.length, 1);
  assert.ok(us, 'US should exist');
  assert.equal(us.repository, 'agid-country-us');
  assert.equal(us.recommendedChildren.length, 74);
  assert.equal(1 + us.recommendedChildren.length, 75);

  for (const repo of [
    'agid-us-california',
    'agid-us-texas',
    'agid-us-new-york',
    'agid-us-district-of-columbia',
    'agid-us-puerto-rico',
    'agid-us-guam',
    'agid-us-new-york-city',
    'agid-us-los-angeles',
    'agid-us-boston',
  ]) {
    assert.ok(us.recommendedChildren.includes(repo), `${repo} should be a US child repository`);
  }
});

test('global repository placement expands Canada into a balanced 21 repository plan', async () => {
  const placement = await readPlacement();
  const canada = countriesOf(placement).find(country => country.code === 'CA');

  assert.ok(canada, 'CA should exist');
  assert.equal(canada.repository, 'agid-country-ca');
  assert.equal(canada.recommendedChildren.length, 20);
  assert.equal(1 + canada.recommendedChildren.length, 21);

  for (const repo of [
    'agid-ca-alberta',
    'agid-ca-british-columbia',
    'agid-ca-ontario',
    'agid-ca-quebec',
    'agid-ca-northwest-territories',
    'agid-ca-nunavut',
    'agid-ca-yukon',
    'agid-ca-toronto',
    'agid-ca-montreal',
    'agid-ca-vancouver',
    'agid-ca-arctic',
  ]) {
    assert.ok(canada.recommendedChildren.includes(repo), `${repo} should be a Canada child repository`);
  }
});

test('global repository placement expands Mexico into a 43 repository plan', async () => {
  const placement = await readPlacement();
  const mexico = countriesOf(placement).find(country => country.code === 'MX');

  assert.ok(mexico, 'MX should exist');
  assert.equal(mexico.repository, 'agid-country-mx');
  assert.equal(mexico.recommendedChildren.length, 42);
  assert.equal(1 + mexico.recommendedChildren.length, 43);

  for (const repo of [
    'agid-mx-aguascalientes',
    'agid-mx-baja-california',
    'agid-mx-mexico-city',
    'agid-mx-mexico-state',
    'agid-mx-jalisco',
    'agid-mx-nuevo-leon',
    'agid-mx-mexico-city-metro',
    'agid-mx-guadalajara',
    'agid-mx-monterrey',
    'agid-mx-tijuana',
    'agid-mx-toluca',
  ]) {
    assert.ok(mexico.recommendedChildren.includes(repo), `${repo} should be a Mexico child repository`);
  }
});

test('global repository placement expands Brazil into a 38 repository plan', async () => {
  const placement = await readPlacement();
  const brazil = countriesOf(placement).find(country => country.code === 'BR');

  assert.ok(brazil, 'BR should exist');
  assert.equal(brazil.repository, 'agid-country-br');
  assert.equal(brazil.recommendedChildren.length, 37);
  assert.equal(1 + brazil.recommendedChildren.length, 38);

  for (const repo of [
    'agid-br-acre',
    'agid-br-distrito-federal',
    'agid-br-minas-gerais',
    'agid-br-rio-de-janeiro',
    'agid-br-sao-paulo',
    'agid-br-sao-paulo-city',
    'agid-br-rio-de-janeiro-city',
    'agid-br-brasilia',
    'agid-br-manaus',
    'agid-br-porto-alegre',
  ]) {
    assert.ok(brazil.recommendedChildren.includes(repo), `${repo} should be a Brazil child repository`);
  }
});

test('global repository placement expands Argentina into a 32 repository plan', async () => {
  const placement = await readPlacement();
  const argentina = countriesOf(placement).find(country => country.code === 'AR');

  assert.ok(argentina, 'AR should exist');
  assert.equal(argentina.repository, 'agid-country-ar');
  assert.equal(argentina.recommendedChildren.length, 31);
  assert.equal(1 + argentina.recommendedChildren.length, 32);

  for (const repo of [
    'agid-ar-buenos-aires-province',
    'agid-ar-buenos-aires-city',
    'agid-ar-greater-buenos-aires',
    'agid-ar-cordoba',
    'agid-ar-cordoba-city',
    'agid-ar-rosario',
    'agid-ar-mendoza',
    'agid-ar-mendoza-metro',
    'agid-ar-tierra-del-fuego',
  ]) {
    assert.ok(argentina.recommendedChildren.includes(repo), `${repo} should be an Argentina child repository`);
  }
});

test('global repository placement expands Colombia into a 43 repository plan', async () => {
  const placement = await readPlacement();
  const colombia = countriesOf(placement).find(country => country.code === 'CO');

  assert.ok(colombia, 'CO should exist');
  assert.equal(colombia.repository, 'agid-country-co');
  assert.equal(colombia.recommendedChildren.length, 42);
  assert.equal(1 + colombia.recommendedChildren.length, 43);

  for (const repo of [
    'agid-co-amazonas',
    'agid-co-antioquia',
    'agid-co-bogota-dc',
    'agid-co-valle-del-cauca',
    'agid-co-san-andres-providencia',
    'agid-co-bogota-metro',
    'agid-co-medellin',
    'agid-co-cali',
    'agid-co-cartagena',
    'agid-co-manizales',
  ]) {
    assert.ok(colombia.recommendedChildren.includes(repo), `${repo} should be a Colombia child repository`);
  }
});

test('global repository placement expands France into a 38 repository plan', async () => {
  const placement = await readPlacement();
  const france = countriesOf(placement).find(country => country.code === 'FR');

  assert.ok(france, 'FR should exist');
  assert.equal(france.repository, 'agid-country-fr');
  assert.equal(france.recommendedChildren.length, 37);
  assert.equal(1 + france.recommendedChildren.length, 38);

  for (const repo of [
    'agid-fr-auvergne-rhone-alpes',
    'agid-fr-ile-de-france',
    'agid-fr-guadeloupe',
    'agid-fr-french-guiana',
    'agid-fr-french-polynesia',
    'agid-fr-new-caledonia',
    'agid-fr-french-southern-territories',
    'agid-fr-paris-metro',
    'agid-fr-marseille',
    'agid-fr-grenoble',
  ]) {
    assert.ok(france.recommendedChildren.includes(repo), `${repo} should be a France child repository`);
  }
});

test('global repository placement expands Germany into a 32 repository plan', async () => {
  const placement = await readPlacement();
  const germany = countriesOf(placement).find(country => country.code === 'DE');

  assert.ok(germany, 'DE should exist');
  assert.equal(germany.repository, 'agid-country-de');
  assert.equal(germany.recommendedChildren.length, 31);
  assert.equal(1 + germany.recommendedChildren.length, 32);

  for (const repo of [
    'agid-de-baden-wurttemberg',
    'agid-de-bavaria',
    'agid-de-berlin',
    'agid-de-north-rhine-westphalia',
    'agid-de-schleswig-holstein',
    'agid-de-berlin-city',
    'agid-de-hamburg-city',
    'agid-de-munich',
    'agid-de-frankfurt',
    'agid-de-ruhr-metro',
  ]) {
    assert.ok(germany.recommendedChildren.includes(repo), `${repo} should be a Germany child repository`);
  }
});

test('global repository placement expands Italy into a 36 repository plan', async () => {
  const placement = await readPlacement();
  const italy = countriesOf(placement).find(country => country.code === 'IT');

  assert.ok(italy, 'IT should exist');
  assert.equal(italy.repository, 'agid-country-it');
  assert.equal(italy.recommendedChildren.length, 35);
  assert.equal(1 + italy.recommendedChildren.length, 36);

  for (const repo of [
    'agid-it-lazio',
    'agid-it-rome',
    'agid-it-lombardy',
    'agid-it-milan',
    'agid-it-sicily',
    'agid-it-sardinia',
    'agid-it-trentino-alto-adige',
    'agid-it-naples',
    'agid-it-venice',
    'agid-it-trieste',
  ]) {
    assert.ok(italy.recommendedChildren.includes(repo), `${repo} should be an Italy child repository`);
  }
});

test('global repository placement expands Spain into a 33 repository plan', async () => {
  const placement = await readPlacement();
  const spain = countriesOf(placement).find(country => country.code === 'ES');

  assert.ok(spain, 'ES should exist');
  assert.equal(spain.repository, 'agid-country-es');
  assert.equal(spain.recommendedChildren.length, 32);
  assert.equal(1 + spain.recommendedChildren.length, 33);

  for (const repo of [
    'agid-es-andalusia',
    'agid-es-catalonia',
    'agid-es-basque-country',
    'agid-es-canary-islands',
    'agid-es-community-of-madrid',
    'agid-es-plazas-de-soberania',
    'agid-es-ceuta',
    'agid-es-melilla',
    'agid-es-madrid',
    'agid-es-barcelona',
    'agid-es-murcia-city',
    'agid-es-las-palmas',
  ]) {
    assert.ok(spain.recommendedChildren.includes(repo), `${repo} should be a Spain child repository`);
  }
});

test('global repository placement expands Poland into a 27 repository plan', async () => {
  const placement = await readPlacement();
  const poland = countriesOf(placement).find(country => country.code === 'PL');

  assert.ok(poland, 'PL should exist');
  assert.equal(poland.repository, 'agid-country-pl');
  assert.equal(poland.recommendedChildren.length, 26);
  assert.equal(1 + poland.recommendedChildren.length, 27);

  for (const repo of [
    'agid-pl-dolnoslaskie',
    'agid-pl-lodzkie',
    'agid-pl-malopolskie',
    'agid-pl-mazowieckie',
    'agid-pl-pomorskie',
    'agid-pl-slaskie',
    'agid-pl-warsaw',
    'agid-pl-krakow',
    'agid-pl-gdansk',
    'agid-pl-katowice-metro',
  ]) {
    assert.ok(poland.recommendedChildren.includes(repo), `${repo} should be a Poland child repository`);
  }
});

test('global repository placement expands Romania into a 57 repository plan', async () => {
  const placement = await readPlacement();
  const romania = countriesOf(placement).find(country => country.code === 'RO');

  assert.ok(romania, 'RO should exist');
  assert.equal(romania.repository, 'agid-country-ro');
  assert.equal(romania.recommendedChildren.length, 56);
  assert.equal(1 + romania.recommendedChildren.length, 57);

  for (const repo of [
    'agid-ro-alba',
    'agid-ro-cluj',
    'agid-ro-timis',
    'agid-ro-vaslui',
    'agid-ro-vrancea',
    'agid-ro-bucharest',
    'agid-ro-bucharest-metro',
    'agid-ro-cluj-napoca',
    'agid-ro-timisoara',
    'agid-ro-iasi-city',
    'agid-ro-arad-city',
  ]) {
    assert.ok(romania.recommendedChildren.includes(repo), `${repo} should be a Romania child repository`);
  }
});

test('global repository placement expands Sweden into a 34 repository plan', async () => {
  const placement = await readPlacement();
  const sweden = countriesOf(placement).find(country => country.code === 'SE');

  assert.ok(sweden, 'SE should exist');
  assert.equal(sweden.repository, 'agid-country-se');
  assert.equal(sweden.recommendedChildren.length, 33);
  assert.equal(1 + sweden.recommendedChildren.length, 34);

  for (const repo of [
    'agid-se-stockholm',
    'agid-se-stockholm-city',
    'agid-se-uppsala',
    'agid-se-uppsala-city',
    'agid-se-skane',
    'agid-se-vastra-gotaland',
    'agid-se-norrbotten',
    'agid-se-gothenburg',
    'agid-se-malmo',
    'agid-se-umea',
  ]) {
    assert.ok(sweden.recommendedChildren.includes(repo), `${repo} should be a Sweden child repository`);
  }
});

test('global repository placement expands Ukraine into a 38 repository plan', async () => {
  const placement = await readPlacement();
  const ukraine = countriesOf(placement).find(country => country.code === 'UA');

  assert.ok(ukraine, 'UA should exist');
  assert.equal(ukraine.repository, 'agid-country-ua');
  assert.equal(ukraine.recommendedChildren.length, 37);
  assert.equal(1 + ukraine.recommendedChildren.length, 38);

  for (const repo of [
    'agid-ua-kyiv-oblast',
    'agid-ua-kyiv-city',
    'agid-ua-crimea',
    'agid-ua-sevastopol',
    'agid-ua-donetsk',
    'agid-ua-luhansk',
    'agid-ua-kyiv-metro',
    'agid-ua-kharkiv-city',
    'agid-ua-odesa-city',
    'agid-ua-mariupol',
  ]) {
    assert.ok(ukraine.recommendedChildren.includes(repo), `${repo} should be a Ukraine child repository`);
  }
});

test('global repository placement expands Russia into a 104 repository plan', async () => {
  const placement = await readPlacement();
  const russia = countriesOf(placement).find(country => country.code === 'RU');

  assert.ok(russia, 'RU should exist');
  assert.equal(russia.repository, 'agid-country-ru');
  assert.equal(russia.recommendedChildren.length, 103);
  assert.equal(1 + russia.recommendedChildren.length, 104);

  for (const repo of [
    'agid-ru-moscow-oblast',
    'agid-ru-moscow-city',
    'agid-ru-saint-petersburg',
    'agid-ru-saint-petersburg-city',
    'agid-ru-crimea',
    'agid-ru-sevastopol',
    'agid-ru-donetsk',
    'agid-ru-luhansk',
    'agid-ru-zaporizhzhia-oblast',
    'agid-ru-kherson-oblast',
    'agid-ru-krasnodar-krai',
    'agid-ru-novosibirsk',
    'agid-ru-yekaterinburg',
  ]) {
    assert.ok(russia.recommendedChildren.includes(repo), `${repo} should be a Russia child repository`);
  }
});

test('global repository placement expands Great Britain into a balanced 26 repository plan', async () => {
  const placement = await readPlacement();
  const byCode = new Map(countriesOf(placement).map(country => [country.code, country]));
  const gb = byCode.get('GB');

  assert.ok(gb, 'GB should exist');
  assert.equal(gb.repository, 'agid-country-gb');
  assert.equal(gb.recommendedChildren.length, 25);
  assert.equal(1 + gb.recommendedChildren.length, 26);

  for (const repo of [
    'agid-gb-england',
    'agid-gb-scotland',
    'agid-gb-wales',
    'agid-gb-northern-ireland',
    'agid-gb-london-region',
    'agid-gb-yorkshire-humber',
    'agid-gb-london',
    'agid-gb-manchester',
    'agid-gb-cardiff',
    'agid-gb-belfast',
  ]) {
    assert.ok(gb.recommendedChildren.includes(repo), `${repo} should be a GB child repository`);
  }

  assert.equal(byCode.get('JE')?.repository, 'agid-country-je');
  assert.equal(byCode.get('GG')?.repository, 'agid-country-gg');
  assert.equal(byCode.get('IM')?.repository, 'agid-country-im');
});

test('global repository placement does not emit duplicate country repositories', async () => {
  const placement = await readPlacement();
  const repositories = countriesOf(placement).map(country => country.repository);
  assert.equal(new Set(repositories).size, repositories.length);
});

test('global repository placement keeps Antarctica as one polar area repository', async () => {
  const placement = await readPlacement();
  const antarctica = countriesOf(placement).find(country => country.code === 'AQ');
  assert.equal(antarctica?.continent, 'antarctica');
  assert.equal(antarctica?.repository, 'agid-area-antarctica');
  assert.equal(antarctica?.splitStrategy, 'single-polar-area-pack');
  assert.equal(antarctica?.recommendedChildren.length, 0);
});

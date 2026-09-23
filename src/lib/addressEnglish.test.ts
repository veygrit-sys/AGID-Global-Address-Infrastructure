import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeEnglishAddressBuildingName,normalizeEnglishAddressPart,renderEnglishPostalAddress } from './addressEnglish';

test('romanizes Japanese address parts by script instead of country-code passthrough', () => {
  assert.equal(normalizeEnglishAddressPart('東京都', 'JP'), 'Tokyo');
  assert.equal(normalizeEnglishAddressPart('千代田区', 'JP'), 'Chiyoda-ku');
});

test('translates Japanese place names with Hepburn-style English address romanization', () => {
  assert.equal(normalizeEnglishAddressPart('東京都渋谷区神南', 'JP'), 'Tokyo Shibuya-ku Jinnan');
  assert.equal(normalizeEnglishAddressPart('神奈川県横浜市中区山下町', 'JP'), 'Kanagawa Yokohama-shi Naka-ku Yamashitacho');
  assert.equal(normalizeEnglishAddressPart('大阪府大阪市北区梅田', 'JP'), 'Osaka Osaka-shi Kita-ku Umeda');
});

test('renders Mainland China place names as readable Pinyin English address parts', () => {
  assert.equal(normalizeEnglishAddressPart('北京市朝阳区', 'CN'), 'Beijing Chaoyang District');
  assert.equal(normalizeEnglishAddressPart('新疆维吾尔自治区乌鲁木齐市天山区', 'CN'), 'Xinjiang Uyghur Autonomous Region Urumqi Tianshan District');
  assert.equal(normalizeEnglishAddressPart('内蒙古自治区呼和浩特市赛罕区', 'CN'), 'Inner Mongolia Autonomous Region Hohhot Saihan District');
  assert.equal(normalizeEnglishAddressPart('上海市浦东新区世纪大道', 'CN'), 'Shanghai Pudong New Area Century Avenue');
});

test('renders Chinese place names with country-scoped established readings', () => {
  assert.equal(normalizeEnglishAddressPart('沙田', 'HK'), 'Sha Tin');
  assert.equal(normalizeEnglishAddressPart('沙田', 'CN'), 'Shatian');
  assert.equal(normalizeEnglishAddressPart('高雄市', 'TW'), 'Kaohsiung City');
  assert.equal(normalizeEnglishAddressPart('氹仔', 'MO'), 'Taipa');
  assert.equal(normalizeEnglishAddressPart('牛車水', 'SG'), 'Chinatown');
  assert.equal(normalizeEnglishAddressPart('合成區', 'HK'), '');
});

test('does not invent Mandarin building readings for non-Mandarin delivery regions', () => {
  assert.equal(normalizeEnglishAddressBuildingName('廈門大廈', 'CN'), 'Xiamen Building');
  assert.equal(normalizeEnglishAddressBuildingName('合成中心', 'HK'), '');
  assert.equal(normalizeEnglishAddressBuildingName('合成中心', 'SG'), '');
});

test('renders Korean Peninsula addresses with Revised Romanization style English parts', () => {
  assert.equal(normalizeEnglishAddressPart('서울특별시 중구 세종대로', 'KR'), 'Seoul Jung-gu Sejong-daero');
  assert.equal(normalizeEnglishAddressPart('부산광역시 해운대구 달맞이길', 'KR'), 'Busan Haeundae-gu Dalmaji-gil');
  assert.equal(normalizeEnglishAddressPart('평양직할시 중구역 승리거리', 'KP'), 'Pyongyang Jung-guyok Seungni-geori');
});

test('renders Mongolian addresses with English aliases and Latin transliteration', () => {
  assert.equal(normalizeEnglishAddressPart('Улаанбаатар хот Сүхбаатар дүүрэг', 'MN'), 'Ulaanbaatar Sukhbaatar District');
  assert.equal(normalizeEnglishAddressPart('Чингисийн өргөн чөлөө', 'MN'), 'Chinggis Avenue');
  assert.equal(normalizeEnglishAddressPart('Хөвсгөл аймаг Мөрөн сум', 'MN'), 'Khovsgol Province Moron Sum');
});

test('transliterates Cyrillic and deaccents Latin extended address parts', () => {
  assert.equal(normalizeEnglishAddressPart('Москва', 'RU'), 'Moscow');
  assert.equal(normalizeEnglishAddressPart('Łódź', 'PL'), 'Lodz');
});

test('normalizes common Arabic, Hebrew, and Thai place names for English addresses', () => {
  assert.equal(normalizeEnglishAddressPart('القاهرة', 'EG'), 'Cairo');
  assert.equal(normalizeEnglishAddressPart('تل אביב', 'IL'), 'Tel Aviv');
  assert.equal(normalizeEnglishAddressPart('กรุงเทพมหานคร', 'TH'), 'Bangkok');
});

test('normalizes Inner Circle address names for English displays', () => {
  assert.equal(normalizeEnglishAddressPart('इनर सर्कल', 'IN'), 'Inner Circle');
  assert.equal(normalizeEnglishAddressPart('inner circle', 'IN'), 'Inner Circle');
});

test('renders a complete international English postal address with country name', () => {
  const rendered = renderEnglishPostalAddress({
    country_code: 'JP',
    country: '日本',
    state: '東京都',
    city: '千代田区',
    subdistrict: '永田町',
    road: '1-1',
    house_number: '1',
    building: '中央合同庁舎',
    postcode: '100-0014',
    district: '',
    suburb: '',
    poi: '',
  });

  assert.equal(rendered, 'Chuo Godo Chosha\n1 1-1\nNagatacho, Chiyoda-ku\nTokyo 100-0014\nJAPAN');
});

test('normalizes native-script building names for English address tabs', () => {
  assert.equal(normalizeEnglishAddressBuildingName('中央合同庁舎', 'JP'), 'Chuo Godo Chosha');
  assert.equal(normalizeEnglishAddressBuildingName('渋谷スクランブルスクエア', 'JP'), 'Shibuya Scramble Square');
  assert.equal(normalizeEnglishAddressBuildingName('上海中心大厦', 'CN'), 'Shanghai Zhongxin Building');
  assert.equal(normalizeEnglishAddressBuildingName('롯데월드타워', 'KR'), 'Lotte World Tower');
  assert.equal(normalizeEnglishAddressBuildingName('مبنى النيل', 'EG'), 'Building Nile');
});

test('normalizes representative South Asia local-script place names for English address output', () => {
  assert.equal(normalizeEnglishAddressPart('भारत', 'IN'), 'India');
  assert.equal(normalizeEnglishAddressPart('नई दिल्ली', 'IN'), 'New Delhi');
  assert.equal(normalizeEnglishAddressPart('پاکستان', 'PK'), 'Pakistan');
  assert.equal(normalizeEnglishAddressPart('اسلام آباد', 'PK'), 'Islamabad');
  assert.equal(normalizeEnglishAddressPart('বাংলাদেশ', 'BD'), 'Bangladesh');
  assert.equal(normalizeEnglishAddressPart('ঢাকা', 'BD'), 'Dhaka');
  assert.equal(normalizeEnglishAddressPart('नेपाल', 'NP'), 'Nepal');
  assert.equal(normalizeEnglishAddressPart('काठमाडौं', 'NP'), 'Kathmandu');
  assert.equal(normalizeEnglishAddressPart('ශ්‍රී ලංකාව', 'LK'), 'Sri Lanka');
  assert.equal(normalizeEnglishAddressPart('කොළඹ', 'LK'), 'Colombo');
  assert.equal(normalizeEnglishAddressPart('འབྲུག་ཡུལ', 'BT'), 'Bhutan');
  assert.equal(normalizeEnglishAddressPart('މާލެ', 'MV'), 'Male');
  assert.equal(normalizeEnglishAddressPart('افغانستان', 'AF'), 'Afghanistan');
  assert.equal(normalizeEnglishAddressPart('کابل', 'AF'), 'Kabul');
});

test('normalizes India regional-language and dialect-derived place names for English address output', () => {
  assert.equal(normalizeEnglishAddressPart('महाराष्ट्र मुंबई अंधेरी पश्चिम', 'IN'), 'Maharashtra Mumbai Andheri West');
  assert.equal(normalizeEnglishAddressPart('পশ্চিমবঙ্গ কলকাতা পার্ক স্ট্রিট', 'IN'), 'West Bengal Kolkata Park Street');
  assert.equal(normalizeEnglishAddressPart('தமிழ்நாடு சென்னை அண்ணா சாலை', 'IN'), 'Tamil Nadu Chennai Anna Salai');
  assert.equal(normalizeEnglishAddressPart('తెలంగాణ హైదరాబాద్ బంజారా హిల్స్', 'IN'), 'Telangana Hyderabad Banjara Hills');
  assert.equal(normalizeEnglishAddressPart('ಕರ್ನಾಟಕ ಬೆಂಗಳೂರು ಎಂ ಜಿ ರಸ್ತೆ', 'IN'), 'Karnataka Bengaluru MG Road');
  assert.equal(normalizeEnglishAddressPart('കേരളം കൊച്ചി എം ജി റോഡ്', 'IN'), 'Kerala Kochi MG Road');
  assert.equal(normalizeEnglishAddressPart('ગુજરાત અમદાવાદ આશ્રમ રોડ', 'IN'), 'Gujarat Ahmedabad Ashram Road');
  assert.equal(normalizeEnglishAddressPart('ਪੰਜਾਬ ਅੰਮ੍ਰਿਤਸਰ ਜੀ ਟੀ ਰੋਡ', 'IN'), 'Punjab Amritsar GT Road');
  assert.equal(normalizeEnglishAddressPart('ଓଡ଼ିଶା ଭୁବନେଶ୍ୱର ଜନପଥ', 'IN'), 'Odisha Bhubaneswar Janpath');
  assert.equal(normalizeEnglishAddressPart('اتر پردیش لکھنؤ حضرت گنج', 'IN'), 'Uttar Pradesh Lucknow Hazratganj');
  assert.equal(normalizeEnglishAddressPart('Banaras', 'IN'), 'Varanasi');
  assert.equal(normalizeEnglishAddressPart('Calicut', 'IN'), 'Kozhikode');
});

test('normalizes representative West Asia local-script place names for English address output', () => {
  assert.equal(normalizeEnglishAddressPart('Türkiye', 'TR'), 'Turkiye');
  assert.equal(normalizeEnglishAddressPart('İstanbul', 'TR'), 'Istanbul');
  assert.equal(normalizeEnglishAddressPart('ایران', 'IR'), 'Iran');
  assert.equal(normalizeEnglishAddressPart('تهران', 'IR'), 'Tehran');
  assert.equal(normalizeEnglishAddressPart('العراق', 'IQ'), 'Iraq');
  assert.equal(normalizeEnglishAddressPart('بغداد', 'IQ'), 'Baghdad');
  assert.equal(normalizeEnglishAddressPart('سوريا', 'SY'), 'Syria');
  assert.equal(normalizeEnglishAddressPart('دمشق', 'SY'), 'Damascus');
  assert.equal(normalizeEnglishAddressPart('لبنان', 'LB'), 'Lebanon');
  assert.equal(normalizeEnglishAddressPart('بيروت', 'LB'), 'Beirut');
  assert.equal(normalizeEnglishAddressPart('الأردن', 'JO'), 'Jordan');
  assert.equal(normalizeEnglishAddressPart('عمان', 'JO'), 'Amman');
  assert.equal(normalizeEnglishAddressPart('ישראל', 'IL'), 'Israel');
  assert.equal(normalizeEnglishAddressPart('תל אביב', 'IL'), 'Tel Aviv');
  assert.equal(normalizeEnglishAddressPart('فلسطين', 'PS'), 'Palestine');
  assert.equal(normalizeEnglishAddressPart('رام الله', 'PS'), 'Ramallah');
  assert.equal(normalizeEnglishAddressPart('المملكة العربية السعودية', 'SA'), 'Saudi Arabia');
  assert.equal(normalizeEnglishAddressPart('قطر', 'QA'), 'Qatar');
  assert.equal(normalizeEnglishAddressPart('البحرين', 'BH'), 'Bahrain');
  assert.equal(normalizeEnglishAddressPart('الكويت', 'KW'), 'Kuwait');
  assert.equal(normalizeEnglishAddressPart('اليمن', 'YE'), 'Yemen');
});

test('normalizes representative Central Asia local-script place names for English address output', () => {
  assert.equal(normalizeEnglishAddressPart('Қазақстан', 'KZ'), 'Kazakhstan');
  assert.equal(normalizeEnglishAddressPart('Астана', 'KZ'), 'Astana');
  assert.equal(normalizeEnglishAddressPart("O'zbekiston", 'UZ'), 'Uzbekistan');
  assert.equal(normalizeEnglishAddressPart('Toshkent', 'UZ'), 'Tashkent');
  assert.equal(normalizeEnglishAddressPart('Türkmenistan', 'TM'), 'Turkmenistan');
  assert.equal(normalizeEnglishAddressPart('Aşgabat', 'TM'), 'Ashgabat');
  assert.equal(normalizeEnglishAddressPart('Кыргызстан', 'KG'), 'Kyrgyzstan');
  assert.equal(normalizeEnglishAddressPart('Бишкек', 'KG'), 'Bishkek');
  assert.equal(normalizeEnglishAddressPart('Тоҷикистон', 'TJ'), 'Tajikistan');
  assert.equal(normalizeEnglishAddressPart('Душанбе', 'TJ'), 'Dushanbe');
});

test('normalizes representative Oceania place names for English address output', () => {
  assert.equal(normalizeEnglishAddressPart('Viti', 'FJ'), 'Fiji');
  assert.equal(normalizeEnglishAddressPart('Papua Niugini', 'PG'), 'Papua New Guinea');
  assert.equal(normalizeEnglishAddressPart('Samoa', 'WS'), 'Samoa');
  assert.equal(normalizeEnglishAddressPart('Tonga', 'TO'), 'Tonga');
  assert.equal(normalizeEnglishAddressPart('Vanuatu', 'VU'), 'Vanuatu');
  assert.equal(normalizeEnglishAddressPart('Solomon Islands', 'SB'), 'Solomon Islands');
  assert.equal(normalizeEnglishAddressPart('Belau', 'PW'), 'Palau');
  assert.equal(normalizeEnglishAddressPart('Aotearoa', 'NZ'), 'New Zealand');
  assert.equal(normalizeEnglishAddressPart('Rarotonga', 'CK'), 'Rarotonga');
  assert.equal(normalizeEnglishAddressPart('Tokelau', 'TK'), 'Tokelau');
});

test('normalizes representative Western Europe and French overseas place names for English address output', () => {
  assert.equal(normalizeEnglishAddressPart('France', 'FR'), 'France');
  assert.equal(normalizeEnglishAddressPart('Deutschland', 'DE'), 'Germany');
  assert.equal(normalizeEnglishAddressPart('Nederland', 'NL'), 'Netherlands');
  assert.equal(normalizeEnglishAddressPart('Suisse', 'CH'), 'Switzerland');
  assert.equal(normalizeEnglishAddressPart('Schweiz', 'CH'), 'Switzerland');
  assert.equal(normalizeEnglishAddressPart('Österreich', 'AT'), 'Austria');
  assert.equal(normalizeEnglishAddressPart('Éire', 'IE'), 'Ireland');
  assert.equal(normalizeEnglishAddressPart('Guadeloupe', 'GP'), 'Guadeloupe');
  assert.equal(normalizeEnglishAddressPart('Guyane', 'GF'), 'French Guiana');
  assert.equal(normalizeEnglishAddressPart('La Réunion', 'RE'), 'Reunion');
  assert.equal(normalizeEnglishAddressPart('Nouvelle-Calédonie', 'NC'), 'New Caledonia');
  assert.equal(normalizeEnglishAddressPart('Polynésie française', 'PF'), 'French Polynesia');
});

test('normalizes representative Nordic and Baltic place names for English address output', () => {
  assert.equal(normalizeEnglishAddressPart('Sverige', 'SE'), 'Sweden');
  assert.equal(normalizeEnglishAddressPart('Norge', 'NO'), 'Norway');
  assert.equal(normalizeEnglishAddressPart('Danmark', 'DK'), 'Denmark');
  assert.equal(normalizeEnglishAddressPart('Suomi', 'FI'), 'Finland');
  assert.equal(normalizeEnglishAddressPart('Latvija', 'LV'), 'Latvia');
  assert.equal(normalizeEnglishAddressPart('Eesti', 'EE'), 'Estonia');
  assert.equal(normalizeEnglishAddressPart('Lietuva', 'LT'), 'Lithuania');
  assert.equal(normalizeEnglishAddressPart('Ísland', 'IS'), 'Iceland');
  assert.equal(normalizeEnglishAddressPart('København', 'DK'), 'Copenhagen');
  assert.equal(normalizeEnglishAddressPart('Reykjavík', 'IS'), 'Reykjavik');
});

test('normalizes representative Southern Europe place names for English address output', () => {
  assert.equal(normalizeEnglishAddressPart('Italia', 'IT'), 'Italy');
  assert.equal(normalizeEnglishAddressPart('Roma', 'IT'), 'Rome');
  assert.equal(normalizeEnglishAddressPart('España', 'ES'), 'Spain');
  assert.equal(normalizeEnglishAddressPart('Lisboa', 'PT'), 'Lisbon');
  assert.equal(normalizeEnglishAddressPart('Ελλάδα', 'GR'), 'Greece');
  assert.equal(normalizeEnglishAddressPart('Αθήνα', 'GR'), 'Athens');
  assert.equal(normalizeEnglishAddressPart('Malta', 'MT'), 'Malta');
  assert.equal(normalizeEnglishAddressPart('Città del Vaticano', 'VA'), 'Vatican City');
  assert.equal(normalizeEnglishAddressPart('Κύπρος', 'CY'), 'Cyprus');
  assert.equal(normalizeEnglishAddressPart('Kıbrıs', 'CY'), 'Cyprus');
});

test('normalizes representative Eastern Europe place names for English address output', () => {
  assert.equal(normalizeEnglishAddressPart('România', 'RO'), 'Romania');
  assert.equal(normalizeEnglishAddressPart('București', 'RO'), 'Bucharest');
  assert.equal(normalizeEnglishAddressPart('България', 'BG'), 'Bulgaria');
  assert.equal(normalizeEnglishAddressPart('София', 'BG'), 'Sofia');
  assert.equal(normalizeEnglishAddressPart('Україна', 'UA'), 'Ukraine');
  assert.equal(normalizeEnglishAddressPart('Київ', 'UA'), 'Kyiv');
  assert.equal(normalizeEnglishAddressPart('Молдова', 'MD'), 'Moldova');
  assert.equal(normalizeEnglishAddressPart('Беларусь', 'BY'), 'Belarus');
  assert.equal(normalizeEnglishAddressPart('Россия', 'RU'), 'Russia');
  assert.equal(normalizeEnglishAddressPart('Србија', 'RS'), 'Serbia');
  assert.equal(normalizeEnglishAddressPart('Bosna i Hercegovina', 'BA'), 'Bosnia and Herzegovina');
  assert.equal(normalizeEnglishAddressPart('Crna Gora', 'ME'), 'Montenegro');
  assert.equal(normalizeEnglishAddressPart('Kosova', 'XK'), 'Kosovo');
  assert.equal(normalizeEnglishAddressPart('Shqipëri', 'AL'), 'Albania');
  assert.equal(normalizeEnglishAddressPart('Северна Македонија', 'MK'), 'North Macedonia');
});

test('normalizes overseas territory and autonomous-region place names for English address output', () => {
  assert.equal(normalizeEnglishAddressPart('Caribisch Nederland', 'BQ'), 'Caribbean Netherlands');
  assert.equal(normalizeEnglishAddressPart('Bonaire', 'BQ'), 'Bonaire');
  assert.equal(normalizeEnglishAddressPart('Curaçao', 'CW'), 'Curacao');
  assert.equal(normalizeEnglishAddressPart('Sint Maarten', 'SX'), 'Sint Maarten');
  assert.equal(normalizeEnglishAddressPart('Kalaallit Nunaat', 'GL'), 'Greenland');
  assert.equal(normalizeEnglishAddressPart('Føroyar', 'FO'), 'Faroe Islands');
  assert.equal(normalizeEnglishAddressPart('Norge', 'SJ'), 'Norway');
  assert.equal(normalizeEnglishAddressPart('Islas Baleares', 'ES'), 'Balearic Islands');
  assert.equal(normalizeEnglishAddressPart('Islas Canarias', 'ES'), 'Canary Islands');
  assert.equal(normalizeEnglishAddressPart('Açores', 'PT'), 'Azores');
  assert.equal(normalizeEnglishAddressPart('Região Autónoma da Madeira', 'PT'), 'Madeira');
});

test('normalizes representative Caucasus place names for English address output', () => {
  assert.equal(normalizeEnglishAddressPart('Հայաստան', 'AM'), 'Armenia');
  assert.equal(normalizeEnglishAddressPart('Երևան', 'AM'), 'Yerevan');
  assert.equal(normalizeEnglishAddressPart('Արմավիրի մարզ', 'AM'), 'Armavir Region');
  assert.equal(normalizeEnglishAddressPart('Azərbaycan', 'AZ'), 'Azerbaijan');
  assert.equal(normalizeEnglishAddressPart('Bakı', 'AZ'), 'Baku');
  assert.equal(normalizeEnglishAddressPart('Şəhər', 'AZ'), 'City');
  assert.equal(normalizeEnglishAddressPart('საქართველო', 'GE'), 'Georgia');
  assert.equal(normalizeEnglishAddressPart('თბილისი', 'GE'), 'Tbilisi');
  assert.equal(normalizeEnglishAddressPart('აჭარის ავტონომიური რესპუბლიკა', 'GE'), 'Adjara Autonomous Republic');
});

test('normalizes representative North Africa place names for English address output', () => {
  assert.equal(normalizeEnglishAddressPart('مصر', 'EG'), 'Egypt');
  assert.equal(normalizeEnglishAddressPart('القاهرة', 'EG'), 'Cairo');
  assert.equal(normalizeEnglishAddressPart('الإسكندرية', 'EG'), 'Alexandria');
  assert.equal(normalizeEnglishAddressPart('الجزائر', 'DZ'), 'Algeria');
  assert.equal(normalizeEnglishAddressPart('وهران', 'DZ'), 'Oran');
  assert.equal(normalizeEnglishAddressPart('المغرب', 'MA'), 'Morocco');
  assert.equal(normalizeEnglishAddressPart('الدار البيضاء', 'MA'), 'Casablanca');
  assert.equal(normalizeEnglishAddressPart('تونس', 'TN'), 'Tunisia');
  assert.equal(normalizeEnglishAddressPart('ليبيا', 'LY'), 'Libya');
  assert.equal(normalizeEnglishAddressPart('طرابلس', 'LY'), 'Tripoli');
  assert.equal(normalizeEnglishAddressPart('السودان', 'SD'), 'Sudan');
  assert.equal(normalizeEnglishAddressPart('الخرطوم', 'SD'), 'Khartoum');
  assert.equal(normalizeEnglishAddressPart('موريتانيا', 'MR'), 'Mauritania');
  assert.equal(normalizeEnglishAddressPart('نواكشوط', 'MR'), 'Nouakchott');
  assert.equal(normalizeEnglishAddressPart('الصحراء الغربية', 'EH'), 'Western Sahara');
  assert.equal(normalizeEnglishAddressPart('العيون', 'EH'), 'Laayoune');
});

test('normalizes representative West Africa place names for English address output', () => {
  assert.equal(normalizeEnglishAddressPart('Nigeria', 'NG'), 'Nigeria');
  assert.equal(normalizeEnglishAddressPart('Lagos State', 'NG'), 'Lagos State');
  assert.equal(normalizeEnglishAddressPart('Ghana', 'GH'), 'Ghana');
  assert.equal(normalizeEnglishAddressPart('Côte d’Ivoire', 'CI'), 'Ivory Coast');
  assert.equal(normalizeEnglishAddressPart('Abidjan', 'CI'), 'Abidjan');
  assert.equal(normalizeEnglishAddressPart('Sénégal', 'SN'), 'Senegal');
  assert.equal(normalizeEnglishAddressPart('Dakar', 'SN'), 'Dakar');
  assert.equal(normalizeEnglishAddressPart('Burkina Faso', 'BF'), 'Burkina Faso');
  assert.equal(normalizeEnglishAddressPart('Ouagadougou', 'BF'), 'Ouagadougou');
  assert.equal(normalizeEnglishAddressPart('Mali', 'ML'), 'Mali');
  assert.equal(normalizeEnglishAddressPart('Bamako', 'ML'), 'Bamako');
  assert.equal(normalizeEnglishAddressPart('Niger', 'NE'), 'Niger');
  assert.equal(normalizeEnglishAddressPart('Niamey', 'NE'), 'Niamey');
  assert.equal(normalizeEnglishAddressPart('Bénin', 'BJ'), 'Benin');
  assert.equal(normalizeEnglishAddressPart('Libéria', 'LR'), 'Liberia');
  assert.equal(normalizeEnglishAddressPart('Sierra Leone', 'SL'), 'Sierra Leone');
  assert.equal(normalizeEnglishAddressPart('Gambie', 'GM'), 'Gambia');
  assert.equal(normalizeEnglishAddressPart('Guinée', 'GN'), 'Guinea');
  assert.equal(normalizeEnglishAddressPart('Guiné-Bissau', 'GW'), 'Guinea-Bissau');
  assert.equal(normalizeEnglishAddressPart('Cabo Verde', 'CV'), 'Cape Verde');
});

test('normalizes representative Americas Spanish place names for English address output', () => {
  assert.equal(normalizeEnglishAddressPart('México', 'MX'), 'Mexico');
  assert.equal(normalizeEnglishAddressPart('Ciudad de México', 'MX'), 'Mexico City');
  assert.equal(normalizeEnglishAddressPart('Estado de México', 'MX'), 'State of Mexico');
  assert.equal(normalizeEnglishAddressPart('Guatemala', 'GT'), 'Guatemala');
  assert.equal(normalizeEnglishAddressPart('Tegucigalpa', 'HN'), 'Tegucigalpa');
  assert.equal(normalizeEnglishAddressPart('San Salvador', 'SV'), 'San Salvador');
  assert.equal(normalizeEnglishAddressPart('Managua', 'NI'), 'Managua');
  assert.equal(normalizeEnglishAddressPart('San José', 'CR'), 'San Jose');
  assert.equal(normalizeEnglishAddressPart('Panamá', 'PA'), 'Panama');
  assert.equal(normalizeEnglishAddressPart('República Dominicana', 'DO'), 'Dominican Republic');
  assert.equal(normalizeEnglishAddressPart('La Habana', 'CU'), 'Havana');
  assert.equal(normalizeEnglishAddressPart('Bogotá', 'CO'), 'Bogota');
  assert.equal(normalizeEnglishAddressPart('Perú', 'PE'), 'Peru');
  assert.equal(normalizeEnglishAddressPart('Asunción', 'PY'), 'Asuncion');
});

test('normalizes representative East Africa place names for English address output', () => {
  assert.equal(normalizeEnglishAddressPart('Comores', 'KM'), 'Comoros');
  assert.equal(normalizeEnglishAddressPart('جزر القمر', 'KM'), 'Comoros');
  assert.equal(normalizeEnglishAddressPart('Djibouti', 'DJ'), 'Djibouti');
  assert.equal(normalizeEnglishAddressPart('ኤርትራ', 'ER'), 'Eritrea');
  assert.equal(normalizeEnglishAddressPart('Asmara', 'ER'), 'Asmara');
  assert.equal(normalizeEnglishAddressPart('ኢትዮጵያ', 'ET'), 'Ethiopia');
  assert.equal(normalizeEnglishAddressPart('አዲስ አበባ', 'ET'), 'Addis Ababa');
  assert.equal(normalizeEnglishAddressPart('Kenya', 'KE'), 'Kenya');
  assert.equal(normalizeEnglishAddressPart('Nairobi', 'KE'), 'Nairobi');
  assert.equal(normalizeEnglishAddressPart('Madagascar', 'MG'), 'Madagascar');
  assert.equal(normalizeEnglishAddressPart('Malawi', 'MW'), 'Malawi');
  assert.equal(normalizeEnglishAddressPart('Maurice', 'MU'), 'Mauritius');
  assert.equal(normalizeEnglishAddressPart('Moçambique', 'MZ'), 'Mozambique');
  assert.equal(normalizeEnglishAddressPart('Rwanda', 'RW'), 'Rwanda');
  assert.equal(normalizeEnglishAddressPart('Seychelles', 'SC'), 'Seychelles');
  assert.equal(normalizeEnglishAddressPart('Soomaaliya', 'SO'), 'Somalia');
  assert.equal(normalizeEnglishAddressPart('Muqdisho', 'SO'), 'Mogadishu');
  assert.equal(normalizeEnglishAddressPart('South Sudan', 'SS'), 'South Sudan');
  assert.equal(normalizeEnglishAddressPart('Tanzania', 'TZ'), 'Tanzania');
  assert.equal(normalizeEnglishAddressPart('Dar es Salaam', 'TZ'), 'Dar es Salaam');
  assert.equal(normalizeEnglishAddressPart('Uganda', 'UG'), 'Uganda');
  assert.equal(normalizeEnglishAddressPart('Zambia', 'ZM'), 'Zambia');
});

test('normalizes representative Southern Africa and Indian Ocean place names for English address output', () => {
  assert.equal(normalizeEnglishAddressPart('South Africa', 'ZA'), 'South Africa');
  assert.equal(normalizeEnglishAddressPart('Namibia', 'NA'), 'Namibia');
  assert.equal(normalizeEnglishAddressPart('Botswana', 'BW'), 'Botswana');
  assert.equal(normalizeEnglishAddressPart('Zimbabwe', 'ZW'), 'Zimbabwe');
  assert.equal(normalizeEnglishAddressPart('Lesotho', 'LS'), 'Lesotho');
  assert.equal(normalizeEnglishAddressPart('Eswatini', 'SZ'), 'Eswatini');
  assert.equal(normalizeEnglishAddressPart('Angola', 'AO'), 'Angola');
  assert.equal(normalizeEnglishAddressPart('Luanda', 'AO'), 'Luanda');
  assert.equal(normalizeEnglishAddressPart('Moris', 'MU'), 'Mauritius');
  assert.equal(normalizeEnglishAddressPart('Sesel', 'SC'), 'Seychelles');
});

test('normalizes South Africa local-language, dialect-derived, and historic place names for English address output', () => {
  assert.equal(normalizeEnglishAddressPart('eGoli Gauteng', 'ZA'), 'Johannesburg Gauteng');
  assert.equal(normalizeEnglishAddressPart('iKapa Wes-Kaap', 'ZA'), 'Cape Town Western Cape');
  assert.equal(normalizeEnglishAddressPart('eThekwini KwaZulu-Natal', 'ZA'), 'Durban KwaZulu-Natal');
  assert.equal(normalizeEnglishAddressPart('Tshwane Gauteng', 'ZA'), 'Pretoria Gauteng');
  assert.equal(normalizeEnglishAddressPart('Gqeberha Oos-Kaap', 'ZA'), 'Port Elizabeth Eastern Cape');
  assert.equal(normalizeEnglishAddressPart('Makhanda Eastern Cape', 'ZA'), 'Grahamstown Eastern Cape');
  assert.equal(normalizeEnglishAddressPart('Polokwane Limpopo', 'ZA'), 'Polokwane Limpopo');
  assert.equal(normalizeEnglishAddressPart('Pietersburg Limpopo', 'ZA'), 'Polokwane Limpopo');
  assert.equal(normalizeEnglishAddressPart('Hoofstraat Sandton', 'ZA'), 'Main Street Sandton');
  assert.equal(normalizeEnglishAddressPart('Kerk Straat Pretoria', 'ZA'), 'Church Street Pretoria');
});

test('translates Romance-language address terms into English for English address tabs', () => {
  assert.equal(normalizeEnglishAddressPart('Calle Mayor Número 12, Barrio Centro', 'MX'), 'Street Mayor Number 12, Neighborhood Centro');
  assert.equal(normalizeEnglishAddressPart('Carrera 7 Número 32-12, Barrio La Candelaria', 'CO'), 'Road 7 Number 32-12, Neighborhood La Candelaria');
  assert.equal(normalizeEnglishAddressPart('Rua Augusta, Número 100, Bairro Centro', 'BR'), 'Street Augusta, Number 100, Neighborhood Centro');
  assert.equal(normalizeEnglishAddressPart('Rue de Rivoli, Numéro 10, Quartier Louvre', 'FR'), 'Street de Rivoli, Number 10, Neighborhood Louvre');
  assert.equal(normalizeEnglishAddressPart('Via Roma, Numero civico 20, Comune Milano', 'IT'), 'Street Roma, House Number 20, Municipality Milan');
});

test('translates Germanic address terms and regional spelling variants into English address parts', () => {
  assert.equal(normalizeEnglishAddressPart('Hauptstraße 5, Bezirk Mitte, Postleitzahl 10115', 'DE'), 'Main Street 5, District Mitte, Postal Code 10115');
  assert.equal(normalizeEnglishAddressPart('Bahnhofstrasse 12, Ort Zürich', 'CH'), 'Station Street 12, City Zurich');
  assert.equal(normalizeEnglishAddressPart('Kärntner Straße Hausnummer 8, Wien', 'AT'), 'Karntner Street House Number 8, Vienna');
});

test('translates Arabic address words and dialect-derived variants into English address parts', () => {
  assert.equal(normalizeEnglishAddressPart('شارع النيل رقم ١٠ حي الزمالك', 'EG'), 'Street Nile Number 10 Neighborhood Zamalek');
  assert.equal(normalizeEnglishAddressPart('طريق الملك فهد بناية ٢ شقة ٥', 'SA'), 'Road King Fahd Building 2 Apartment 5');
  assert.equal(normalizeEnglishAddressPart('زنقة محمد الخامس، الدار البيضاء', 'MA'), 'Alley Mohammed V, Casablanca');
  assert.equal(normalizeEnglishAddressPart('ولاية الخرطوم محلية الخرطوم', 'SD'), 'State Khartoum Locality Khartoum');
});

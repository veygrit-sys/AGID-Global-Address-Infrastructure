import type { CanonicalAddress } from './addressRendering';
import { normalizeChineseRegionalAddressPart } from './chineseAddressUtils';
import { normalizeIndianAddressPart } from './indiaAddressEnglish';
import { normalizeSouthAfricanAddressPart } from './southAfricaAddressEnglish';
import { deaccent,transliterate } from './transliteration';

const COUNTRY_TRANSLITERATION_LANGUAGE: Record<string, string> = {
  JP: 'ja',
  CN: 'zh',
  TW: 'zh',
  HK: 'zh',
  MO: 'zh',
  KR: 'ko',
  KP: 'ko',
  RU: 'ru',
  UA: 'uk',
  BY: 'be',
  BG: 'bg',
  RS: 'sr',
  MK: 'mk',
  GR: 'el',
  CY: 'el',
  PL: 'pl',
  CZ: 'cs',
  HU: 'hu',
  RO: 'ro',
  SK: 'sk',
  SI: 'sl',
  IS: 'is',
  EE: 'et',
  LV: 'lv',
  LT: 'lt',
  TR: 'tr',
  VN: 'vn',
  MN: 'mn',
  AM: 'hy',
  AZ: 'az',
  GE: 'ka',
};

const COMMON_ENGLISH_EXONYMS: Record<string, string> = {
  日本: 'Japan',
  東京都: 'Tokyo',
  京都府: 'Kyoto',
  大阪府: 'Osaka',
  北海道: 'Hokkaido',
  千代田区: 'Chiyoda-ku',
  中央区: 'Chuo-ku',
  港区: 'Minato-ku',
  新宿区: 'Shinjuku-ku',
  渋谷区: 'Shibuya-ku',
  永田町: 'Nagatacho',
  丸の内: 'Marunouchi',
  東京駅: 'Tokyo Station',
  Москва: 'Moscow',
  Россия: 'Russia',
  Ελλάδα: 'Greece',
  Αθήνα: 'Athens',
  中国: 'China',
  香港: 'Hong Kong',
  澳門: 'Macao',
  台湾: 'Taiwan',
  臺灣: 'Taiwan',
  대한민국: 'South Korea',
  서울: 'Seoul',
  مصر: 'Egypt',
  القاهرة: 'Cairo',
  الإسكندرية: 'Alexandria',
  الاسكندرية: 'Alexandria',
  الجزائر: 'Algeria',
  وهران: 'Oran',
  المغرب: 'Morocco',
  الرباط: 'Rabat',
  'الدار البيضاء': 'Casablanca',
  تونس: 'Tunisia',
  ليبيا: 'Libya',
  طرابلس: 'Tripoli',
  السودان: 'Sudan',
  الخرطوم: 'Khartoum',
  موريتانيا: 'Mauritania',
  نواكشوط: 'Nouakchott',
  'الصحراء الغربية': 'Western Sahara',
  العيون: 'Laayoune',
  Nigeria: 'Nigeria',
  'Lagos State': 'Lagos State',
  Ghana: 'Ghana',
  'Côte d’Ivoire': 'Ivory Coast',
  "Côte d'Ivoire": 'Ivory Coast',
  "Cote d'Ivoire": 'Ivory Coast',
  'Cote d’Ivoire': 'Ivory Coast',
  Abidjan: 'Abidjan',
  Sénégal: 'Senegal',
  Senegal: 'Senegal',
  Dakar: 'Dakar',
  'Burkina Faso': 'Burkina Faso',
  Ouagadougou: 'Ouagadougou',
  Mali: 'Mali',
  Bamako: 'Bamako',
  Niger: 'Niger',
  Niamey: 'Niamey',
  Togo: 'Togo',
  Lomé: 'Lome',
  Lome: 'Lome',
  Bénin: 'Benin',
  Benin: 'Benin',
  Cotonou: 'Cotonou',
  Libéria: 'Liberia',
  Liberia: 'Liberia',
  'Sierra Leone': 'Sierra Leone',
  Freetown: 'Freetown',
  Gambie: 'Gambia',
  Gambia: 'Gambia',
  Guinée: 'Guinea',
  Guinea: 'Guinea',
  'Guiné-Bissau': 'Guinea-Bissau',
  'Guinea-Bissau': 'Guinea-Bissau',
  'Cabo Verde': 'Cape Verde',
  'Cape Verde': 'Cape Verde',
  Comores: 'Comoros',
  Comoros: 'Comoros',
  'جزر القمر': 'Comoros',
  Djibouti: 'Djibouti',
  ኤርትራ: 'Eritrea',
  Eritrea: 'Eritrea',
  Asmara: 'Asmara',
  ኢትዮጵያ: 'Ethiopia',
  Ethiopia: 'Ethiopia',
  'አዲስ አበባ': 'Addis Ababa',
  Kenya: 'Kenya',
  Nairobi: 'Nairobi',
  Madagascar: 'Madagascar',
  Malawi: 'Malawi',
  Maurice: 'Mauritius',
  Mauritius: 'Mauritius',
  Moris: 'Mauritius',
  Moçambique: 'Mozambique',
  Mozambique: 'Mozambique',
  Rwanda: 'Rwanda',
  Seychelles: 'Seychelles',
  Sesel: 'Seychelles',
  Soomaaliya: 'Somalia',
  Somalia: 'Somalia',
  Muqdisho: 'Mogadishu',
  Mogadishu: 'Mogadishu',
  'South Sudan': 'South Sudan',
  Tanzania: 'Tanzania',
  'Dar es Salaam': 'Dar es Salaam',
  Uganda: 'Uganda',
  Zambia: 'Zambia',
  'South Africa': 'South Africa',
  Namibia: 'Namibia',
  Botswana: 'Botswana',
  Zimbabwe: 'Zimbabwe',
  Lesotho: 'Lesotho',
  Eswatini: 'Eswatini',
  Angola: 'Angola',
  Luanda: 'Luanda',
  دبي: 'Dubai',
  'أبو ظبي': 'Abu Dhabi',
  الرياض: 'Riyadh',
  جدة: 'Jeddah',
  مكة: 'Mecca',
  المدينة: 'Medina',
  ישראל: 'Israel',
  ירושלים: 'Jerusalem',
  'תל אביב': 'Tel Aviv',
  'تل أبيب': 'Tel Aviv',
  'تل אביב': 'Tel Aviv',
  România: 'Romania',
  București: 'Bucharest',
  Bucuresti: 'Bucharest',
  България: 'Bulgaria',
  София: 'Sofia',
  Україна: 'Ukraine',
  Київ: 'Kyiv',
  Молдова: 'Moldova',
  Беларусь: 'Belarus',
  Србија: 'Serbia',
  'Bosna i Hercegovina': 'Bosnia and Herzegovina',
  'Crna Gora': 'Montenegro',
  Kosova: 'Kosovo',
  Shqipëri: 'Albania',
  Shqiperi: 'Albania',
  'Северна Македонија': 'North Macedonia',
  Հայաստան: 'Armenia',
  Երևան: 'Yerevan',
  Երեւան: 'Yerevan',
  'Արմավիրի մարզ': 'Armavir Region',
  'Շիրակի մարզ': 'Shirak Region',
  'Լոռու մարզ': 'Lori Region',
  'Կոտայքի մարզ': 'Kotayk Region',
  Azərbaycan: 'Azerbaijan',
  Bakı: 'Baku',
  Baki: 'Baku',
  Şəhər: 'City',
  Şəki: 'Sheki',
  Gəncə: 'Ganja',
  საქართველო: 'Georgia',
  თბილისი: 'Tbilisi',
  'აჭარის ავტონომიური რესპუბლიკა': 'Adjara Autonomous Republic',
  აჭარა: 'Adjara',
  ქუთაისი: 'Kutaisi',
  ბათუმი: 'Batumi',
  תאילנד: 'Thailand',
  ประเทศไทย: 'Thailand',
  กรุงเทพมหานคร: 'Bangkok',
  'इनर सर्कल': 'Inner Circle',
  'मिडिल सर्कल': 'Middle Circle',
  'आउटर सर्कल': 'Outer Circle',
  'कनॉट प्लेस': 'Connaught Place',
  'नई दिल्ली': 'New Delhi',
  भारत: 'India',
  इंडिया: 'India',
  पाकिस्तान: 'Pakistan',
  پاکستان: 'Pakistan',
  'اسلام آباد': 'Islamabad',
  اسلاماباد: 'Islamabad',
  بنگلور: 'Bengaluru',
  کراچی: 'Karachi',
  لاہور: 'Lahore',
  বাংলাদেশ: 'Bangladesh',
  ঢাকা: 'Dhaka',
  চট্টগ্রাম: 'Chattogram',
  नेपाल: 'Nepal',
  काठमाडौं: 'Kathmandu',
  काठमाडौँ: 'Kathmandu',
  पोखरा: 'Pokhara',
  'ශ්‍රී ලංකාව': 'Sri Lanka',
  ලංකාව: 'Sri Lanka',
  කොළඹ: 'Colombo',
  யாழ்ப்பாணம்: 'Jaffna',
  இலங்கை: 'Sri Lanka',
  'འབྲུག་ཡུལ': 'Bhutan',
  'འབྲུག་ཡུལ་': 'Bhutan',
  'ཐིམ་ཕུ': 'Thimphu',
  'ދިވެހިރާއްޖެ': 'Maldives',
  'މާލެ': 'Male',
  افغانستان: 'Afghanistan',
  کابل: 'Kabul',
  کندهار: 'Kandahar',
  هرات: 'Herat',
  ایران: 'Iran',
  تهران: 'Tehran',
  اصفهان: 'Isfahan',
  شیراز: 'Shiraz',
  تبریز: 'Tabriz',
  العراق: 'Iraq',
  بغداد: 'Baghdad',
  البصرة: 'Basra',
  أربيل: 'Erbil',
  سوريا: 'Syria',
  دمشق: 'Damascus',
  حلب: 'Aleppo',
  لبنان: 'Lebanon',
  بيروت: 'Beirut',
  الأردن: 'Jordan',
  عمان: 'Amman',
  فلسطين: 'Palestine',
  'رام الله': 'Ramallah',
  غزة: 'Gaza',
  'المملكة العربية السعودية': 'Saudi Arabia',
  السعودية: 'Saudi Arabia',
  قطر: 'Qatar',
  الدوحة: 'Doha',
  البحرين: 'Bahrain',
  المنامة: 'Manama',
  الكويت: 'Kuwait',
  'مدينة الكويت': 'Kuwait City',
  مسقط: 'Muscat',
  اليمن: 'Yemen',
  صنعاء: "Sana'a",
  Қазақстан: 'Kazakhstan',
  Астана: 'Astana',
  Алматы: 'Almaty',
  Шымкент: 'Shymkent',
  "O'zbekiston": 'Uzbekistan',
  Узбекистан: 'Uzbekistan',
  Toshkent: 'Tashkent',
  Тошкент: 'Tashkent',
  Türkmenistan: 'Turkmenistan',
  Aşgabat: 'Ashgabat',
  Ашхабад: 'Ashgabat',
  Кыргызстан: 'Kyrgyzstan',
  Бишкек: 'Bishkek',
  Ош: 'Osh',
  Тоҷикистон: 'Tajikistan',
  Душанбе: 'Dushanbe',
  Хуҷанд: 'Khujand',
  Viti: 'Fiji',
  Fiji: 'Fiji',
  'Papua Niugini': 'Papua New Guinea',
  Samoa: 'Samoa',
  Tonga: 'Tonga',
  Vanuatu: 'Vanuatu',
  'Solomon Islands': 'Solomon Islands',
  Belau: 'Palau',
  Palau: 'Palau',
  Aotearoa: 'New Zealand',
  Rarotonga: 'Rarotonga',
  Tokelau: 'Tokelau',
  Niue: 'Niue',
  Kiribati: 'Kiribati',
  Tuvalu: 'Tuvalu',
  Nauru: 'Nauru',
  Deutschland: 'Germany',
  Germany: 'Germany',
  Nederland: 'Netherlands',
  Netherlands: 'Netherlands',
  'Caribisch Nederland': 'Caribbean Netherlands',
  Bonaire: 'Bonaire',
  'Sint Eustatius': 'Sint Eustatius',
  Saba: 'Saba',
  Curaçao: 'Curacao',
  'Sint Maarten': 'Sint Maarten',
  Suisse: 'Switzerland',
  Schweiz: 'Switzerland',
  Svizzera: 'Switzerland',
  Österreich: 'Austria',
  Austria: 'Austria',
  Éire: 'Ireland',
  Ireland: 'Ireland',
  Liechtenstein: 'Liechtenstein',
  Guadeloupe: 'Guadeloupe',
  Martinique: 'Martinique',
  Guyane: 'French Guiana',
  'La Réunion': 'Reunion',
  Réunion: 'Reunion',
  Mayotte: 'Mayotte',
  'Polynésie française': 'French Polynesia',
  'Nouvelle-Calédonie': 'New Caledonia',
  'Wallis-et-Futuna': 'Wallis and Futuna',
  'Saint-Martin': 'Saint Martin',
  'Saint-Barthélemy': 'Saint Barthelemy',
  'Saint-Pierre-et-Miquelon': 'Saint Pierre and Miquelon',
  Sverige: 'Sweden',
  Norge: 'Norway',
  Danmark: 'Denmark',
  'Kalaallit Nunaat': 'Greenland',
  Føroyar: 'Faroe Islands',
  'Islas Baleares': 'Balearic Islands',
  'Illes Balears': 'Balearic Islands',
  'Islas Canarias': 'Canary Islands',
  Açores: 'Azores',
  'Região Autónoma da Madeira': 'Madeira',
  Suomi: 'Finland',
  Finland: 'Finland',
  Latvija: 'Latvia',
  Eesti: 'Estonia',
  Lietuva: 'Lithuania',
  Ísland: 'Iceland',
  København: 'Copenhagen',
  Reykjavik: 'Reykjavik',
  Reykjavík: 'Reykjavik',
  Stockholm: 'Stockholm',
  Oslo: 'Oslo',
  Helsinki: 'Helsinki',
  Riga: 'Riga',
  Rīga: 'Riga',
  Tallinn: 'Tallinn',
  Vilnius: 'Vilnius',
  Italia: 'Italy',
  Italy: 'Italy',
  Roma: 'Rome',
  Milano: 'Milan',
  España: 'Spain',
  Espanha: 'Spain',
  Portugal: 'Portugal',
  Lisboa: 'Lisbon',
  Malta: 'Malta',
  'San Marino': 'San Marino',
  Monaco: 'Monaco',
  'Città del Vaticano': 'Vatican City',
  Vaticano: 'Vatican City',
  Andorra: 'Andorra',
  Κύπρος: 'Cyprus',
  Kıbrıs: 'Cyprus',
  Cyprus: 'Cyprus',
  México: 'Mexico',
  Mexico: 'Mexico',
  'Estados Unidos Mexicanos': 'Mexico',
  'Ciudad de México': 'Mexico City',
  'Ciudad De Mexico': 'Mexico City',
  CDMX: 'Mexico City',
  'Estado de México': 'State of Mexico',
  'Estado De Mexico': 'State of Mexico',
  Guatemala: 'Guatemala',
  Honduras: 'Honduras',
  Tegucigalpa: 'Tegucigalpa',
  'El Salvador': 'El Salvador',
  'San Salvador': 'San Salvador',
  Nicaragua: 'Nicaragua',
  Managua: 'Managua',
  'Costa Rica': 'Costa Rica',
  'San José': 'San Jose',
  'San Jose': 'San Jose',
  Panamá: 'Panama',
  Panama: 'Panama',
  Belice: 'Belize',
  Belize: 'Belize',
  Cuba: 'Cuba',
  'La Habana': 'Havana',
  Habana: 'Havana',
  'República Dominicana': 'Dominican Republic',
  'Republica Dominicana': 'Dominican Republic',
  'Santo Domingo': 'Santo Domingo',
  Haití: 'Haiti',
  Haiti: 'Haiti',
  Jamaica: 'Jamaica',
  Barbados: 'Barbados',
  Bahamas: 'Bahamas',
  'Puerto Rico': 'Puerto Rico',
  'Islas Vírgenes de los Estados Unidos': 'U.S. Virgin Islands',
  'Islas Virgenes de los Estados Unidos': 'U.S. Virgin Islands',
  Colombia: 'Colombia',
  Bogotá: 'Bogota',
  Bogota: 'Bogota',
  Medellín: 'Medellin',
  Medellin: 'Medellin',
  Perú: 'Peru',
  Peru: 'Peru',
  Lima: 'Lima',
  Ecuador: 'Ecuador',
  Quito: 'Quito',
  Bolivia: 'Bolivia',
  'La Paz': 'La Paz',
  Paraguay: 'Paraguay',
  Asunción: 'Asuncion',
  Asuncion: 'Asuncion',
  Uruguay: 'Uruguay',
  Montevideo: 'Montevideo',
  Venezuela: 'Venezuela',
  Caracas: 'Caracas',
  Argentina: 'Argentina',
  'Buenos Aires': 'Buenos Aires',
  Chile: 'Chile',
  Santiago: 'Santiago',
  Brasil: 'Brazil',
  Brazil: 'Brazil',
  'São Paulo': 'Sao Paulo',
  'Rio de Janeiro': 'Rio de Janeiro',
  Guyana: 'Guyana',
  Suriname: 'Suriname',
};

const COUNTRY_SPECIFIC_ENGLISH_EXONYMS: Record<string, Record<string, string>> = {
  JO: { عمان: 'Amman' },
  OM: { عمان: 'Oman' },
};

const JAPANESE_HEPBURN_PLACE_NAMES: Record<string, string> = {
  東京都: 'Tokyo',
  京都府: 'Kyoto',
  大阪府: 'Osaka',
  北海道: 'Hokkaido',
  青森県: 'Aomori',
  岩手県: 'Iwate',
  宮城県: 'Miyagi',
  秋田県: 'Akita',
  山形県: 'Yamagata',
  福島県: 'Fukushima',
  茨城県: 'Ibaraki',
  栃木県: 'Tochigi',
  群馬県: 'Gunma',
  埼玉県: 'Saitama',
  千葉県: 'Chiba',
  神奈川県: 'Kanagawa',
  新潟県: 'Niigata',
  富山県: 'Toyama',
  石川県: 'Ishikawa',
  福井県: 'Fukui',
  山梨県: 'Yamanashi',
  長野県: 'Nagano',
  岐阜県: 'Gifu',
  静岡県: 'Shizuoka',
  愛知県: 'Aichi',
  三重県: 'Mie',
  滋賀県: 'Shiga',
  兵庫県: 'Hyogo',
  奈良県: 'Nara',
  和歌山県: 'Wakayama',
  鳥取県: 'Tottori',
  島根県: 'Shimane',
  岡山県: 'Okayama',
  広島県: 'Hiroshima',
  山口県: 'Yamaguchi',
  徳島県: 'Tokushima',
  香川県: 'Kagawa',
  愛媛県: 'Ehime',
  高知県: 'Kochi',
  福岡県: 'Fukuoka',
  佐賀県: 'Saga',
  長崎県: 'Nagasaki',
  熊本県: 'Kumamoto',
  大分県: 'Oita',
  宮崎県: 'Miyazaki',
  鹿児島県: 'Kagoshima',
  沖縄県: 'Okinawa',
  札幌市: 'Sapporo-shi',
  仙台市: 'Sendai-shi',
  横浜市: 'Yokohama-shi',
  川崎市: 'Kawasaki-shi',
  名古屋市: 'Nagoya-shi',
  京都市: 'Kyoto-shi',
  大阪市: 'Osaka-shi',
  神戸市: 'Kobe-shi',
  広島市: 'Hiroshima-shi',
  福岡市: 'Fukuoka-shi',
  千代田区: 'Chiyoda-ku',
  中央区: 'Chuo-ku',
  港区: 'Minato-ku',
  新宿区: 'Shinjuku-ku',
  文京区: 'Bunkyo-ku',
  台東区: 'Taito-ku',
  墨田区: 'Sumida-ku',
  江東区: 'Koto-ku',
  品川区: 'Shinagawa-ku',
  目黒区: 'Meguro-ku',
  大田区: 'Ota-ku',
  世田谷区: 'Setagaya-ku',
  渋谷区: 'Shibuya-ku',
  中野区: 'Nakano-ku',
  杉並区: 'Suginami-ku',
  豊島区: 'Toshima-ku',
  北区: 'Kita-ku',
  荒川区: 'Arakawa-ku',
  板橋区: 'Itabashi-ku',
  練馬区: 'Nerima-ku',
  足立区: 'Adachi-ku',
  葛飾区: 'Katsushika-ku',
  江戸川区: 'Edogawa-ku',
  中区: 'Naka-ku',
  永田町: 'Nagatacho',
  丸の内: 'Marunouchi',
  霞が関: 'Kasumigaseki',
  神南: 'Jinnan',
  山下町: 'Yamashitacho',
  梅田: 'Umeda',
  六本木: 'Roppongi',
  銀座: 'Ginza',
  赤坂: 'Akasaka',
  表参道: 'Omotesando',
  秋葉原: 'Akihabara',
  浅草: 'Asakusa',
  上野: 'Ueno',
  日本橋: 'Nihonbashi',
};

const KOREAN_REVISED_ROMANIZATION_PLACE_NAMES: Record<string, string> = {
  서울특별시: 'Seoul',
  부산광역시: 'Busan',
  대구광역시: 'Daegu',
  인천광역시: 'Incheon',
  광주광역시: 'Gwangju',
  대전광역시: 'Daejeon',
  울산광역시: 'Ulsan',
  세종특별자치시: 'Sejong',
  제주특별자치도: 'Jeju-do',
  경기도: 'Gyeonggi-do',
  강원특별자치도: 'Gangwon-do',
  충청북도: 'Chungcheongbuk-do',
  충청남도: 'Chungcheongnam-do',
  전북특별자치도: 'Jeonbuk-do',
  전라남도: 'Jeollanam-do',
  경상북도: 'Gyeongsangbuk-do',
  경상남도: 'Gyeongsangnam-do',
  평양직할시: 'Pyongyang',
  서울: 'Seoul',
  부산: 'Busan',
  대구: 'Daegu',
  인천: 'Incheon',
  광주: 'Gwangju',
  대전: 'Daejeon',
  울산: 'Ulsan',
  제주: 'Jeju',
  평양: 'Pyongyang',
  중구: 'Jung-gu',
  종로구: 'Jongno-gu',
  용산구: 'Yongsan-gu',
  성동구: 'Seongdong-gu',
  광진구: 'Gwangjin-gu',
  동대문구: 'Dongdaemun-gu',
  중랑구: 'Jungnang-gu',
  성북구: 'Seongbuk-gu',
  강북구: 'Gangbuk-gu',
  도봉구: 'Dobong-gu',
  노원구: 'Nowon-gu',
  은평구: 'Eunpyeong-gu',
  서대문구: 'Seodaemun-gu',
  마포구: 'Mapo-gu',
  양천구: 'Yangcheon-gu',
  강서구: 'Gangseo-gu',
  구로구: 'Guro-gu',
  금천구: 'Geumcheon-gu',
  영등포구: 'Yeongdeungpo-gu',
  동작구: 'Dongjak-gu',
  관악구: 'Gwanak-gu',
  서초구: 'Seocho-gu',
  강남구: 'Gangnam-gu',
  송파구: 'Songpa-gu',
  강동구: 'Gangdong-gu',
  해운대구: 'Haeundae-gu',
  중구역: 'Jung-guyok',
  세종대로: 'Sejong-daero',
  달맞이길: 'Dalmaji-gil',
  승리거리: 'Seungni-geori',
};

const KOREAN_REVISED_ROMANIZATION_SYLLABLES: Record<string, string> = {
  가: 'ga', 강: 'gang', 경: 'gyeong', 고: 'go', 광: 'gwang', 구: 'gu', 국: 'guk', 금: 'geum',
  나: 'na', 남: 'nam', 노: 'no', 대: 'dae', 도: 'do', 동: 'dong', 둔: 'dun',
  라: 'ra', 로: 'ro', 마: 'ma', 문: 'mun', 미: 'mi', 바: 'ba', 북: 'buk',
  사: 'sa', 산: 'san', 삼: 'sam', 상: 'sang', 서: 'seo', 석: 'seok', 선: 'seon', 성: 'seong',
  세: 'se', 송: 'song', 수: 'su', 순: 'sun', 시: 'si', 신: 'sin',
  안: 'an', 양: 'yang', 여: 'yeo', 역: 'yeok', 영: 'yeong', 용: 'yong', 우: 'u', 운: 'un', 원: 'won',
  유: 'yu', 은: 'eun', 의: 'ui', 이: 'i', 인: 'in', 일: 'il',
  장: 'jang', 전: 'jeon', 정: 'jeong', 종: 'jong', 주: 'ju', 중: 'jung', 진: 'jin',
  천: 'cheon', 청: 'cheong', 충: 'chung', 포: 'po', 하: 'ha', 해: 'hae', 현: 'hyeon', 호: 'ho',
};

const KOREAN_ADDRESS_SUFFIXES: Array<[string, string]> = [
  ['특별자치도', '-do'],
  ['특별자치시', ''],
  ['특별시', ''],
  ['광역시', ''],
  ['직할시', ''],
  ['구역', '-guyok'],
  ['대로', '-daero'],
  ['거리', '-geori'],
  ['로', '-ro'],
  ['길', '-gil'],
  ['도', '-do'],
  ['시', '-si'],
  ['군', '-gun'],
  ['구', '-gu'],
  ['동', '-dong'],
  ['읍', '-eup'],
  ['면', '-myeon'],
  ['리', '-ri'],
];

const MONGOLIAN_ADDRESS_ALIASES: Record<string, string> = {
  'Монгол улс': 'Mongolia',
  Монгол: 'Mongolia',
  Улаанбаатар: 'Ulaanbaatar',
  'Улаанбаатар хот': 'Ulaanbaatar',
  Сүхбаатар: 'Sukhbaatar',
  'Сүхбаатар дүүрэг': 'Sukhbaatar District',
  Чингисийн: 'Chinggis',
  'Чингисийн өргөн чөлөө': 'Chinggis Avenue',
  Хөвсгөл: 'Khovsgol',
  'Хөвсгөл аймаг': 'Khovsgol Province',
  Мөрөн: 'Moron',
  'Мөрөн сум': 'Moron Sum',
  Дархан: 'Darkhan',
  Эрдэнэт: 'Erdenet',
};

const MONGOLIAN_CYRILLIC_MAP: Record<string, string> = {
  А: 'A', а: 'a', Б: 'B', б: 'b', В: 'V', в: 'v', Г: 'G', г: 'g',
  Д: 'D', д: 'd', Е: 'Ye', е: 'ye', Ё: 'Yo', ё: 'yo', Ж: 'J', ж: 'j',
  З: 'Z', з: 'z', И: 'I', и: 'i', Й: 'I', й: 'i', К: 'K', к: 'k',
  Л: 'L', л: 'l', М: 'M', м: 'm', Н: 'N', н: 'n', О: 'O', о: 'o',
  Ө: 'O', ө: 'o', П: 'P', п: 'p', Р: 'R', р: 'r', С: 'S', с: 's',
  Т: 'T', т: 't', У: 'U', у: 'u', Ү: 'U', ү: 'u', Ф: 'F', ф: 'f',
  Х: 'Kh', х: 'kh', Ц: 'Ts', ц: 'ts', Ч: 'Ch', ч: 'ch', Ш: 'Sh', ш: 'sh',
  Щ: 'Shch', щ: 'shch', Ъ: '', ъ: '', Ы: 'Y', ы: 'y', Ь: '', ь: '',
  Э: 'E', э: 'e', Ю: 'Yu', ю: 'yu', Я: 'Ya', я: 'ya',
};

const MONGOLIAN_ADDRESS_SUFFIXES: Array<[string, string]> = [
  ['нийслэл', 'Capital City'],
  ['хот', ''],
  ['аймаг', 'Province'],
  ['дүүрэг', 'District'],
  ['сум', 'Sum'],
  ['баг', 'Bag'],
  ['хороо', 'Khoroo'],
  ['өргөн чөлөө', 'Avenue'],
  ['чөлөө', 'Avenue'],
  ['гудамж', 'Street'],
  ['зам', 'Road'],
];

const ENGLISH_ADDRESS_PHRASE_NORMALIZATIONS: Record<string, string> = {
  'inner circle': 'Inner Circle',
  'middle circle': 'Middle Circle',
  'outer circle': 'Outer Circle',
  'connaught place': 'Connaught Place',
  'new delhi': 'New Delhi',
};

const BUILDING_NAME_EXONYMS: Record<string, string> = {
  中央合同庁舎: 'Chuo Godo Chosha',
  グラントウキョウサウスタワー: 'GranTokyo South Tower',
  グラントウキョウノースタワー: 'GranTokyo North Tower',
  渋谷スクランブルスクエア: 'Shibuya Scramble Square',
  上海中心大厦: 'Shanghai Zhongxin Building',
  上海中心大廈: 'Shanghai Zhongxin Building',
  롯데월드타워: 'Lotte World Tower',
};

const JAPANESE_BUILDING_TERMS: Record<string, string> = {
  中央: 'Chuo',
  合同: 'Godo',
  庁舎: 'Chosha',
  廳舎: 'Chosha',
  渋谷: 'Shibuya',
  澁谷: 'Shibuya',
  東京: 'Tokyo',
  丸の内: 'Marunouchi',
  新宿: 'Shinjuku',
  銀座: 'Ginza',
  六本木: 'Roppongi',
  スクランブル: 'Scramble',
  スクエア: 'Square',
  センター: 'Center',
  タワー: 'Tower',
  ビルディング: 'Building',
  ビル: 'Building',
  大厦: 'Building',
  大樓: 'Building',
  会館: 'Kaikan',
  會館: 'Kaikan',
  館: 'Kan',
  レジデンス: 'Residence',
  マンション: 'Mansion',
  アパート: 'Apartment',
  ハイツ: 'Heights',
  ホテル: 'Hotel',
  プラザ: 'Plaza',
  モール: 'Mall',
};

const KOREAN_BUILDING_TERMS: Record<string, string> = {
  롯데: 'Lotte',
  월드: 'World',
  타워: 'Tower',
  빌딩: 'Building',
  센터: 'Center',
  스퀘어: 'Square',
  호텔: 'Hotel',
  레지던스: 'Residence',
  아파트: 'Apartment',
};

const COUNTRY_NAMES: Record<string, string> = {
  JP: 'Japan',
  US: 'United States',
  CA: 'Canada',
  GB: 'United Kingdom',
  CN: 'China',
  TW: 'Taiwan',
  HK: 'Hong Kong',
  MO: 'Macao',
  KR: 'South Korea',
  KP: 'North Korea',
  RU: 'Russia',
  XK: 'Kosovo',
};

export function countryName(countryCode: string, fallback: string) {
  const code = countryCode.toUpperCase();
  if (COUNTRY_NAMES[code]) return COUNTRY_NAMES[code];
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return displayNames.of(code) || fallback || code;
  } catch {
    return fallback || code;
  }
}

function scriptLanguage(value: string, countryCode: string) {
  if (/[\u3040-\u30ff\u3400-\u9fff]/.test(value) && countryCode.toUpperCase() === 'JP') return 'ja';
  if (/[\u3400-\u9fff]/.test(value)) return 'zh';
  if (/[\uac00-\ud7af]/.test(value)) return 'ko';
  if (/[\u0400-\u04ff]/.test(value)) return 'ru';
  if (/[\u0370-\u03ff]/.test(value)) return 'el';
  return COUNTRY_TRANSLITERATION_LANGUAGE[countryCode.toUpperCase()] || countryCode.toLowerCase();
}

function cleanEnglish(value: string) {
  return value
    .normalize('NFKC')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0900-\u097f\u3040-\u30ff\u31f0-\u31ff\u3400-\u9fff\uac00-\ud7af\u0400-\u04ff\u0370-\u03ff\u0590-\u05ff\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\u0e00-\u0e7f]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/,\s*$/g, '')
    .trim();
}

const LATIN_ADDRESS_TERM_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bcercle\s+de\s+([\p{L}\p{M}'’.\-\s]+)\b/giu, '$1 Cercle'],
  [/\bcercle\b/giu, 'Cercle'],
  [/\bnumero\s+civico\b/giu, 'House Number'],
  [/\bnumero\b/giu, 'Number'],
  [/\bnum(?:ero)?\b/giu, 'Number'],
  [/\bnº\b/giu, 'Number'],
  [/\bno\b/giu, 'Number'],
  [/\bcalle\b/giu, 'Street'],
  [/\bcarrer\b/giu, 'Street'],
  [/\bcarrera\b/giu, 'Road'],
  [/\bcra\b/giu, 'Road'],
  [/\brua\b/giu, 'Street'],
  [/\brue\b/giu, 'Street'],
  [/\bvia\b/giu, 'Street'],
  [/\bstrasse\b/giu, 'Street'],
  [/\bstraße\b/giu, 'Street'],
  [/\bavenida\b/giu, 'Avenue'],
  [/\bavenue\b/giu, 'Avenue'],
  [/\bavda\b/giu, 'Avenue'],
  [/\bav\b/giu, 'Avenue'],
  [/\bviale\b/giu, 'Avenue'],
  [/\bboulevard\b/giu, 'Boulevard'],
  [/\bplaza\b/giu, 'Square'],
  [/\bplatz\b/giu, 'Square'],
  [/\bpiazza\b/giu, 'Square'],
  [/\bchemin\b/giu, 'Road'],
  [/\bweg\b/giu, 'Way'],
  [/\bbarrio\b/giu, 'Neighborhood'],
  [/\bcolonia\b/giu, 'Neighborhood'],
  [/\bquartier\b/giu, 'Neighborhood'],
  [/\bbairro\b/giu, 'Neighborhood'],
  [/\bdistrito\b/giu, 'District'],
  [/\bdistrict\b/giu, 'District'],
  [/\bbezirk\b/giu, 'District'],
  [/\bdepartamento\b/giu, 'Department'],
  [/\bdepartement\b/giu, 'Department'],
  [/\bdepartement\b/giu, 'Department'],
  [/\bprovince\b/giu, 'Province'],
  [/\bprovincia\b/giu, 'Province'],
  [/\bestado\b/giu, 'State'],
  [/\bregion\b/giu, 'Region'],
  [/\bcommune\b/giu, 'Municipality'],
  [/\bcomune\b/giu, 'Municipality'],
  [/\bmunicipio\b/giu, 'Municipality'],
  [/\bmunicipalidad\b/giu, 'Municipality'],
  [/\bfreguesia\b/giu, 'Parish'],
  [/\bciudad\b/giu, 'City'],
  [/\bcidade\b/giu, 'City'],
  [/\bville\b/giu, 'City'],
  [/\bort\b/giu, 'City'],
  [/\bpostleitzahl\b/giu, 'Postal Code'],
  [/\bcode\s+postal\b/giu, 'Postal Code'],
  [/\bcodigo\s+postal\b/giu, 'Postal Code'],
  [/\bcodice\s+postale\b/giu, 'Postal Code'],
  [/\bcap\b/giu, 'Postal Code'],
  [/\bcep\b/giu, 'Postal Code'],
  [/\bhausnummer\b/giu, 'House Number'],
  [/\bhaus\b/giu, 'House'],
  [/\bwohnung\b/giu, 'Apartment'],
  [/\bapto\b/giu, 'Apartment'],
  [/\bdepto\b/giu, 'Apartment'],
  [/\bpiso\b/giu, 'Floor'],
  [/\bmilano\b/giu, 'Milan'],
  [/\bwien\b/giu, 'Vienna'],
  [/\bzuerich\b/giu, 'Zurich'],
  [/\bzurich\b/giu, 'Zurich'],
  [/\bhauptstrasse\b/giu, 'Main Street'],
  [/\bbahnhofstrasse\b/giu, 'Station Street'],
];

const ARABIC_ADDRESS_WORDS: Record<string, string> = {
  شارع: 'Street',
  ش: 'Street',
  طريق: 'Road',
  زنقة: 'Alley',
  زقاق: 'Alley',
  حارة: 'Lane',
  رقم: 'Number',
  عدد: 'Number',
  بناية: 'Building',
  مبنى: 'Building',
  عمارة: 'Building',
  شقة: 'Apartment',
  طابق: 'Floor',
  دور: 'Floor',
  حي: 'Neighborhood',
  حى: 'Neighborhood',
  محلة: 'Neighborhood',
  محلية: 'Locality',
  منطقة: 'Area',
  محافظة: 'Governorate',
  ولاية: 'State',
  بلدية: 'Municipality',
  مدينة: 'City',
  الرمز: 'Postal Code',
  البريدي: '',
  صندوق: 'PO Box',
  بريد: '',
};

const ARABIC_ADDRESS_ALIASES: Record<string, string> = {
  النيل: 'Nile',
  الزمالك: 'Zamalek',
  الملك: 'King',
  فهد: 'Fahd',
  محمد: 'Mohammed',
  الخامس: 'V',
  الخرطوم: 'Khartoum',
  القاهرة: 'Cairo',
  الاسكندرية: 'Alexandria',
  الإسكندرية: 'Alexandria',
  الرياض: 'Riyadh',
  جدة: 'Jeddah',
  دبي: 'Dubai',
  'أبو': 'Abu',
  ظبي: 'Dhabi',
  الدار: '',
  البيضاء: 'Casablanca',
};

function normalizeArabicIndicDigits(value: string) {
  const digits = '٠١٢٣٤٥٦٧٨٩';
  const easternDigits = '۰۱۲۳۴۵۶۷۸۹';
  return Array.from(value)
    .map(char => {
      const arabicIndex = digits.indexOf(char);
      if (arabicIndex >= 0) return String(arabicIndex);
      const easternIndex = easternDigits.indexOf(char);
      if (easternIndex >= 0) return String(easternIndex);
      return char;
    })
    .join('');
}

function normalizeLatinAddressTerms(value: string) {
  let normalized = value
    .replace(/ß/g, 'ss')
    .replace(/ẞ/g, 'SS');

  for (const [pattern, replacement] of LATIN_ADDRESS_TERM_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized.replace(/\s+/g, ' ').trim();
}

function normalizeArabicAddressTerms(value: string) {
  if (!/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/.test(value)) return '';

  const tokens = normalizeArabicIndicDigits(value)
    .replace(/[،,]/g, ' , ')
    .replace(/[.;:()]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const parts = tokens.map(token => ARABIC_ADDRESS_WORDS[token] ?? ARABIC_ADDRESS_ALIASES[token] ?? token);
  const joined = parts.filter(Boolean).join(' ');
  const fallbackRomanized = transliterate(joined, 'ar');

  return cleanEnglish(fallbackRomanized)
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeEnglishPhrase(value: string) {
  return ENGLISH_ADDRESS_PHRASE_NORMALIZATIONS[value.toLowerCase()] || value;
}

function tokenizeKnownTerms(value: string, terms: Record<string, string>) {
  const keys = Object.keys(terms).sort((a, b) => b.length - a.length);
  const parts: string[] = [];
  let index = 0;

  while (index < value.length) {
    const match = keys.find(key => value.startsWith(key, index));
    if (match) {
      parts.push(terms[match]);
      index += match.length;
      continue;
    }

    const current = value[index];
    if (/[\s,，、・]/.test(current)) {
      index += 1;
      continue;
    }

    if (/[\dA-Za-z\-&.]/.test(current)) {
      let end = index + 1;
      while (end < value.length && /[\dA-Za-z\-&.]/.test(value[end])) end += 1;
      parts.push(value.slice(index, end));
      index = end;
      continue;
    }

    return '';
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function normalizeJapanesePlaceNameToHepburn(value: string) {
  if (!/[\u3040-\u30ff\u3400-\u9fff]/.test(value)) return '';

  const keys = Object.keys(JAPANESE_HEPBURN_PLACE_NAMES).sort((a, b) => b.length - a.length);
  const parts: string[] = [];
  let index = 0;

  while (index < value.length) {
    const match = keys.find(key => value.startsWith(key, index));
    if (match) {
      parts.push(JAPANESE_HEPBURN_PLACE_NAMES[match]);
      index += match.length;
      continue;
    }

    const current = value[index];
    if (/[\s,、，・]/.test(current)) {
      index += 1;
      continue;
    }

    if (/[\d０-９\-－丁目番地号]/.test(current)) {
      parts.push(current.normalize('NFKC'));
      index += 1;
      continue;
    }

    return '';
  }

  return parts
    .join(' ')
    .replace(/\s+(-(?:ku|shi|cho|mura))/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function romanizeKoreanFallbackSegment(segment: string) {
  for (const [suffix, suffixRomanization] of KOREAN_ADDRESS_SUFFIXES) {
    if (segment.endsWith(suffix) && segment.length > suffix.length) {
      const base = romanizeKoreanFallbackSegment(segment.slice(0, -suffix.length));
      return `${base}${suffixRomanization}`;
    }
  }

  const romanized = Array.from(segment)
    .map(char => KOREAN_REVISED_ROMANIZATION_SYLLABLES[char] || '')
    .join('');

  return romanized ? romanized.charAt(0).toUpperCase() + romanized.slice(1) : '';
}

function normalizeKoreanPlaceNameToRevisedRomanization(value: string) {
  if (!/[\uac00-\ud7af]/.test(value)) return '';

  const keys = Object.keys(KOREAN_REVISED_ROMANIZATION_PLACE_NAMES).sort((a, b) => b.length - a.length);
  const parts: string[] = [];
  let index = 0;

  while (index < value.length) {
    const match = keys.find(key => value.startsWith(key, index));
    if (match) {
      parts.push(KOREAN_REVISED_ROMANIZATION_PLACE_NAMES[match]);
      index += match.length;
      continue;
    }

    const current = value[index];
    if (/[\s,，、]/.test(current)) {
      index += 1;
      continue;
    }

    if (/[\dA-Za-z\-]/.test(current)) {
      let end = index + 1;
      while (end < value.length && /[\dA-Za-z\-]/.test(value[end])) end += 1;
      parts.push(value.slice(index, end));
      index = end;
      continue;
    }

    let end = index + 1;
    while (
      end < value.length &&
      !keys.some(key => value.startsWith(key, end)) &&
      !/[\s,，、\dA-Za-z\-]/.test(value[end])
    ) {
      end += 1;
    }

    const fallback = romanizeKoreanFallbackSegment(value.slice(index, end));
    if (!fallback) return '';
    parts.push(fallback);
    index = end;
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function titleCaseLatin(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function romanizeMongolianCyrillic(value: string) {
  return Array.from(value).map(char => MONGOLIAN_CYRILLIC_MAP[char] ?? char).join('');
}

function normalizeMongolianFallbackSegment(segment: string): string {
  const trimmed = segment.trim();
  if (!trimmed) return '';
  if (MONGOLIAN_ADDRESS_ALIASES[trimmed]) return MONGOLIAN_ADDRESS_ALIASES[trimmed];

  for (const [suffix, translation] of MONGOLIAN_ADDRESS_SUFFIXES) {
    if (trimmed.endsWith(suffix) && trimmed.length > suffix.length) {
      const base = normalizeMongolianFallbackSegment(trimmed.slice(0, -suffix.length).trim());
      return [base, translation].filter(Boolean).join(' ');
    }
  }

  return titleCaseLatin(romanizeMongolianCyrillic(trimmed));
}

function normalizeMongolianAddressPart(value: string) {
  if (!/[\u0400-\u04ff]/.test(value)) return '';

  const keys = Object.keys(MONGOLIAN_ADDRESS_ALIASES).sort((a, b) => b.length - a.length);
  const parts: string[] = [];
  let index = 0;

  while (index < value.length) {
    const match = keys.find(key => value.startsWith(key, index));
    if (match) {
      parts.push(MONGOLIAN_ADDRESS_ALIASES[match]);
      index += match.length;
      continue;
    }

    const current = value[index];
    if (/[\s,，、]/.test(current)) {
      index += 1;
      continue;
    }

    if (/[\dA-Za-z\-]/.test(current)) {
      let end = index + 1;
      while (end < value.length && /[\dA-Za-z\-]/.test(value[end])) end += 1;
      parts.push(value.slice(index, end));
      index = end;
      continue;
    }

    let end = index + 1;
    while (
      end < value.length &&
      !keys.some(key => value.startsWith(key, end)) &&
      !/[\s,，、\dA-Za-z\-]/.test(value[end])
    ) {
      end += 1;
    }

    parts.push(normalizeMongolianFallbackSegment(value.slice(index, end)));
    index = end;
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function normalizeEnglishAddressPart(value: unknown, countryCode = '') {
  const original = String(value ?? '').trim();
  if (!original) return '';
  const code = countryCode.toUpperCase();
  const countrySpecific = COUNTRY_SPECIFIC_ENGLISH_EXONYMS[code]?.[original];
  if (countrySpecific) return countrySpecific;
  if (COMMON_ENGLISH_EXONYMS[original]) return COMMON_ENGLISH_EXONYMS[original];
  const normalizedEnglishPhrase = normalizeEnglishPhrase(original);
  if (normalizedEnglishPhrase !== original) return normalizedEnglishPhrase;

  if (code === 'JP') {
    const hepburnPlaceName = normalizeJapanesePlaceNameToHepburn(original);
    if (hepburnPlaceName) return hepburnPlaceName;
  }
  if (['CN', 'TW', 'HK', 'MO', 'SG'].includes(code) && /[\u3400-\u9fff]/.test(original)) {
    const regionalPlaceName = normalizeChineseRegionalAddressPart(original, code);
    if (regionalPlaceName) return regionalPlaceName;
    return '';
  }
  if (code === 'KR' || code === 'KP') {
    const revisedRomanization = normalizeKoreanPlaceNameToRevisedRomanization(original);
    if (revisedRomanization) return revisedRomanization;
  }
  if (code === 'MN') {
    const mongolianRomanization = normalizeMongolianAddressPart(original);
    if (mongolianRomanization) return mongolianRomanization;
  }
  if (code === 'IN') {
    const indianAddressPart = normalizeIndianAddressPart(original);
    if (indianAddressPart) return indianAddressPart;
  }
  if (code === 'ZA') {
    const southAfricanAddressPart = normalizeSouthAfricanAddressPart(original);
    if (southAfricanAddressPart) return southAfricanAddressPart;
  }
  const arabicAddressTerms = normalizeArabicAddressTerms(original);
  if (arabicAddressTerms) return arabicAddressTerms;

  const language = scriptLanguage(original, code);
  let romanized = transliterate(original, language);

  if (romanized === original && /[À-ž]/.test(original)) {
    romanized = deaccent(original);
  }

  romanized = romanized
    .replace(/[Łł]/g, match => match === 'Ł' ? 'L' : 'l')
    .replace(/[Đđ]/g, match => match === 'Đ' ? 'D' : 'd')
    .replace(/[Þþ]/g, match => match === 'Þ' ? 'Th' : 'th')
    .replace(/[Ææ]/g, match => match === 'Æ' ? 'AE' : 'ae')
    .replace(/[Œœ]/g, match => match === 'Œ' ? 'OE' : 'oe');

  if (/[\u0900-\u097f\u3040-\u30ff\u31f0-\u31ff\u3400-\u9fff\uac00-\ud7af\u0590-\u05ff\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\u0e00-\u0e7f]/.test(romanized)) {
    return '';
  }

  romanized = romanized
    .replace(/都$/g, '')
    .replace(/府$/g, '')
    .replace(/県$/g, '')
    .replace(/市$/g, '-shi')
    .replace(/区$/g, '-ku')
    .replace(/町$/g, '-cho')
    .replace(/村$/g, '-mura');

  return normalizeEnglishPhrase(normalizeLatinAddressTerms(cleanEnglish(romanized)));
}

export function normalizeEnglishAddressBuildingName(value: unknown, countryCode = '') {
  const original = String(value ?? '').trim();
  if (!original) return '';
  const code = countryCode.toUpperCase();

  const exact = BUILDING_NAME_EXONYMS[original] || COMMON_ENGLISH_EXONYMS[original];
  if (exact) return exact;

  if (['CN', 'TW', 'HK', 'MO', 'SG'].includes(code) && /[\u3400-\u9fff]/.test(original)) {
    const chineseBuilding = normalizeChineseRegionalAddressPart(original, code)
      .replace(/\bDasha\b/g, 'Building')
      .replace(/\bDalou\b/g, 'Building')
      .replace(/\bZhongxin\b/g, 'Zhongxin')
      .trim();
    if (chineseBuilding) return chineseBuilding;
    return '';
  }

  if (code === 'JP' && /[\u3040-\u30ff\u3400-\u9fff]/.test(original)) {
    const japaneseBuilding = tokenizeKnownTerms(original, JAPANESE_BUILDING_TERMS);
    if (japaneseBuilding) return japaneseBuilding;
  }

  if ((code === 'KR' || code === 'KP') && /[\uac00-\ud7af]/.test(original)) {
    const koreanBuilding = tokenizeKnownTerms(original, KOREAN_BUILDING_TERMS);
    if (koreanBuilding) return koreanBuilding;
  }

  const normalized = normalizeEnglishAddressPart(original, code);
  return normalized || cleanEnglish(original);
}

function line(...parts: string[]) {
  return parts.map(part => part.trim()).filter(Boolean).join(' ').trim();
}

function localeLine(...parts: string[]) {
  return parts.map(part => part.trim()).filter(Boolean).join(', ').trim();
}

const STREET_NAME_BEFORE_NUMBER_COUNTRIES = new Set([
  'AD', 'AL', 'AM', 'AT', 'AZ', 'BA', 'BE', 'BG', 'BY', 'CH', 'CZ', 'DE', 'DK', 'EE', 'ES',
  'FI', 'FO', 'GE', 'GL', 'GR', 'HR', 'HU', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MC', 'MD',
  'ME', 'MK', 'NL', 'NO', 'PL', 'PT', 'RO', 'RS', 'RU', 'SE', 'SI', 'SK', 'SM', 'TR', 'UA',
  'VA', 'XK'
]);

const POSTCODE_BEFORE_CITY_COUNTRIES = new Set([
  'AD', 'AT', 'BE', 'BG', 'CH', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FO', 'FR', 'GL', 'GR',
  'HR', 'HU', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MC', 'NL', 'NO', 'PL', 'PT', 'RO', 'SE',
  'SI', 'SK', 'SM', 'VA'
]);

function normalizeComparable(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '')
    .trim();
}

export function uniqueAddressParts(parts: string[]) {
  const seen = new Set<string>();
  return parts
    .map(part => cleanEnglish(part))
    .filter(Boolean)
    .filter(part => {
      const key = normalizeComparable(part);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function renderStreetAddressLine(countryCode: string, road: string, houseNumber: string) {
  const code = countryCode.toUpperCase();
  const roadPart = cleanEnglish(road);
  const housePart = cleanEnglish(houseNumber);
  if (roadPart && housePart) {
    return STREET_NAME_BEFORE_NUMBER_COUNTRIES.has(code)
      ? line(roadPart, housePart)
      : line(housePart, roadPart);
  }
  return roadPart || housePart;
}

export function renderEnglishPostalAddress(data: CanonicalAddress, options: { includeCountry?: boolean } = {}) {
  const code = data.country_code.toUpperCase();
  const t = (value: unknown) => normalizeEnglishAddressPart(value, code);
  const tb = (value: unknown) => normalizeEnglishAddressBuildingName(value, code);
  const country = countryName(code, t(data.country)).toUpperCase();
  const organization = tb(data.building || data.poi);
  const streetLine = renderStreetAddressLine(code, t(data.road), t(data.house_number));
  const sublocalityLine = localeLine(t(data.subdistrict || data.suburb), t(data.district));
  const city = t(data.city);
  const state = t(data.state);
  const postcode = String(data.postcode || '').trim();
  const stateRepeatsLocality =
    normalizeComparable(state) === normalizeComparable(city) ||
    normalizeComparable(state) === normalizeComparable(sublocalityLine);
  const regionState = stateRepeatsLocality ? '' : state;
  const localityLine = POSTCODE_BEFORE_CITY_COUNTRIES.has(code)
    ? sublocalityLine
    : localeLine(sublocalityLine, city);
  const regionLine = POSTCODE_BEFORE_CITY_COUNTRIES.has(code)
    ? line(postcode, city)
    : line(regionState, postcode);
  const stateLine = POSTCODE_BEFORE_CITY_COUNTRIES.has(code) && !stateRepeatsLocality
    ? regionState
    : '';
  const lines = [
    organization,
    streetLine,
    localityLine,
    regionLine,
    stateLine,
    options.includeCountry === false ? '' : country,
  ]
    .filter(Boolean);

  return uniqueAddressParts(lines).join('\n');
}

export function renderDomesticEnglishPostalAddress(data: CanonicalAddress) {
  return renderEnglishPostalAddress(data, { includeCountry: false });
}

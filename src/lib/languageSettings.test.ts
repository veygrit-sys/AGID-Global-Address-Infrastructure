import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { TRANSLATIONS } from '../constants/translations';
import { LANGUAGES } from './addressUtils';
import { hasUiTranslation,translateUi } from './i18n';
import { APP_LANGUAGES,normalizeAppLanguage } from './languageSettings';

const CURRENT_APP_UI_LANGUAGE_CODES = [
  'ja',
  'en',
  'en-GB',
  'zh-Hans',
  'zh-Hant',
  'ko',
  'fr',
  'es',
  'de',
  'it',
  'pt-BR',
  'pt-PT',
  'ru',
  'vi',
  'ar',
  'th',
  'hi',
  'bn',
  'id',
  'tr',
] as const;

test('keeps app language settings separate from address language options', () => {
  const languageSettingsSource = readFileSync(join(process.cwd(), 'src', 'lib', 'languageSettings.ts'), 'utf8');

  assert.notDeepEqual(APP_LANGUAGES, LANGUAGES);
  assert.doesNotMatch(languageSettingsSource, /from '\.\/addressUtils'/);

  assert.ok(CURRENT_APP_UI_LANGUAGE_CODES.every(code =>
    hasUiTranslation(TRANSLATIONS as any, code)
  ));
  assert.ok(APP_LANGUAGES.some(language =>
    !hasUiTranslation(TRANSLATIONS as any, language.code)
  ));
  assert.ok(LANGUAGES.some(language =>
    !hasUiTranslation(TRANSLATIONS as any, language.code)
  ));

  const appCodes = new Set(APP_LANGUAGES.map(language => language.code));
  assert.equal(appCodes.has('wa'), false);
  assert.equal(appCodes.has('nds'), false);
  assert.equal(appCodes.has('mfe'), false);
});

test('app language picker starts with maintained UI packs before wider first-language coverage', () => {
  assert.deepEqual(APP_LANGUAGES.slice(0, CURRENT_APP_UI_LANGUAGE_CODES.length).map(language => language.code), CURRENT_APP_UI_LANGUAGE_CODES);
});

test('current app UI languages have substantial native copy instead of empty fallback packs', () => {
  for (const code of CURRENT_APP_UI_LANGUAGE_CODES) {
    assert.ok(
      Object.keys((TRANSLATIONS as Record<string, Record<string, string>>)[code] || {}).length >= 100,
      `${code} should have enough app UI copy to be selectable`
    );
  }
});

test('normalizes stale and fallback-only app language settings to maintained UI packs', () => {
  assert.equal(normalizeAppLanguage('es-MX'), 'es-MX');
  assert.equal(normalizeAppLanguage('ar-EG'), 'ar-EG');
  assert.equal(normalizeAppLanguage('pt-AO'), 'pt-AO');
  assert.equal(normalizeAppLanguage('en-AU'), 'en-AU');
  assert.equal(normalizeAppLanguage('fr-SN'), 'fr-SN');
  assert.equal(normalizeAppLanguage('de-AT'), 'de-AT');
  assert.equal(normalizeAppLanguage('it-CH'), 'it-CH');
  assert.equal(normalizeAppLanguage('zh-Hant-TW'), 'zh-Hant-TW');
  assert.equal(normalizeAppLanguage('pt'), 'pt-PT');
  assert.equal(normalizeAppLanguage('fil'), 'fil');
  assert.equal(normalizeAppLanguage('pl'), 'pl');
  assert.equal(normalizeAppLanguage('mn-Cyrl'), 'mn-Cyrl');
  assert.equal(normalizeAppLanguage('fo'), 'fo');
  assert.equal(normalizeAppLanguage('sw'), 'en');
  assert.equal(normalizeAppLanguage('mfe'), 'en');
});

test('app language picker restores country-specific Arabic Spanish and Portuguese variants', () => {
  const appCodes = new Set(APP_LANGUAGES.map(language => language.code));

  for (const code of [
    'es-MX', 'es-AR', 'es-CL', 'es-CO', 'es-PE', 'es-VE', 'es-EC', 'es-BO', 'es-PY', 'es-UY',
    'ar-EG', 'ar-MA', 'ar-SA', 'ar-AE', 'ar-KW', 'ar-QA', 'ar-OM', 'ar-BH', 'ar-JO', 'ar-LB',
    'pt-AO', 'pt-MZ', 'pt-CV', 'pt-GW', 'pt-ST',
  ]) {
    assert.equal(appCodes.has(code), true, `${code} should be restored as an app language option`);
    assert.equal(normalizeAppLanguage(code), code, `${code} should preserve the selected regional language`);
  }

  assert.equal(translateUi(TRANSLATIONS as any, 'es-MX', 'app_language'), TRANSLATIONS.es.app_language);
  assert.equal(translateUi(TRANSLATIONS as any, 'ar-EG', 'app_language'), TRANSLATIONS.ar.app_language);
  assert.equal(translateUi(TRANSLATIONS as any, 'pt-AO', 'app_language'), TRANSLATIONS['pt-PT'].app_language);
});

test('app language picker restores regional French English German Italian and Traditional Chinese variants', () => {
  const appCodes = new Set(APP_LANGUAGES.map(language => language.code));

  for (const code of [
    'fr-CA', 'fr-BE', 'fr-CH', 'fr-LU', 'fr-MC', 'fr-SN', 'fr-CD', 'fr-CI',
    'en-AU', 'en-CA', 'en-NZ', 'en-IE', 'en-ZA', 'en-IN', 'en-SG', 'en-PH', 'en-JM', 'en-BS',
    'de-AT', 'de-CH', 'de-LI', 'de-LU', 'de-BE',
    'it-CH', 'it-SM', 'it-VA',
    'zh-Hant-TW', 'zh-Hant-HK', 'zh-Hant-MO',
  ]) {
    assert.equal(appCodes.has(code), true, `${code} should be restored as an app language option`);
    assert.equal(normalizeAppLanguage(code), code, `${code} should preserve the selected regional language`);
  }

  assert.equal(translateUi(TRANSLATIONS as any, 'fr-SN', 'app_language'), TRANSLATIONS.fr.app_language);
  assert.equal(translateUi(TRANSLATIONS as any, 'en-AU', 'app_language'), TRANSLATIONS.en.app_language);
  assert.equal(translateUi(TRANSLATIONS as any, 'de-AT', 'app_language'), TRANSLATIONS.de.app_language);
  assert.equal(translateUi(TRANSLATIONS as any, 'it-CH', 'app_language'), TRANSLATIONS.it.app_language);
  assert.equal(translateUi(TRANSLATIONS as any, 'zh-Hant-TW', 'app_language'), TRANSLATIONS['zh-Hant'].app_language);
});

test('settings panel renders app and address language selectors from different sources', () => {
  const panelSource = readFileSync(join(process.cwd(), 'src', 'components', 'SettingsPanel.tsx'), 'utf8');

  assert.match(panelSource, /APP_LANGUAGES/);
  assert.match(panelSource, /LANGUAGES as ADDRESS_LANGUAGES/);
  assert.doesNotMatch(panelSource, /const groupedLanguages =/);
});

test('app language labels stay native or English instead of Japanese-localized group names', () => {
  const panelSource = readFileSync(join(process.cwd(), 'src', 'components', 'SettingsPanel.tsx'), 'utf8');

  assert.match(panelSource, /buildBaseLanguages\(appGroupedLanguages, 'app'\)/);
  assert.doesNotMatch(panelSource, /base === 'in-regional'[\s\S]*?name = t\('tab_indian_langs'/);
  assert.doesNotMatch(panelSource, /base === 'africa-native'[\s\S]*?name = t\('tab_africa_native_langs'/);
  assert.doesNotMatch(panelSource, /base === 'eu-regional'[\s\S]*?name = t\('tab_regional_langs'/);
});

test('non-restored fallback-only language tags translate through maintained app UI packs without being selectable', () => {
  const appCodes = new Set(APP_LANGUAGES.map(language => language.code));

  for (const code of ['sw', 'mfe']) {
    assert.equal(appCodes.has(code), false, `${code} should not be selectable without a maintained UI pack`);
  }

  assert.equal(appCodes.has('fil'), true, 'fil should be selectable as an Asia first language');
  assert.equal(appCodes.has('es-MX'), true, 'regional Spanish should be restored as an app language');
  assert.equal(appCodes.has('en-AU'), true, 'regional English should be restored as an app language');
  assert.notEqual(translateUi(TRANSLATIONS as any, 'fil', 'app_language'), TRANSLATIONS.en.app_language);
  assert.equal(translateUi(TRANSLATIONS as any, 'es-MX', 'app_language'), TRANSLATIONS.es.app_language);
  assert.equal(translateUi(TRANSLATIONS as any, 'en-AU', 'app_language'), TRANSLATIONS.en.app_language);
  assert.equal(translateUi(TRANSLATIONS as any, 'sw', 'app_language'), TRANSLATIONS.en.app_language);
});

test('app language picker excludes historical or non-current UI languages', () => {
  const appCodes = new Set(APP_LANGUAGES.map(language => language.code));

  assert.equal(appCodes.has('la'), false, 'Latin should remain out of the app UI language picker');
});

test('coordinate search uses address language settings, not app UI language, for addresses', () => {
  const appSource = readFileSync(join(process.cwd(), 'src', 'App.tsx'), 'utf8');

  assert.doesNotMatch(appSource, /regionalReverseGeocode\(newLat,\s*newLng,\s*appLanguage/);
  assert.doesNotMatch(appSource, /formatAddress\(data\.address,\s*appLanguage/);
});

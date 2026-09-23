import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
getHelpCenterContent,
getHelpFaqItems,
getHelpSelfServiceSections,
getHelpSourceNotes,
} from './helpFaq';

test('help FAQ covers the questions that usually become support inquiries', () => {
  const items = getHelpFaqItems('ja');
  const searchable = items.map(item => `${item.question} ${item.answer}`).join('\n');

  assert.ok(items.length >= 10);
  [
    'GPS',
    '検索',
    '住所',
    '言語',
    '郵便番号',
    'オフライン',
    '赤いグリッド',
    '黒い線',
    '精度',
    'オープンソース',
    'AOID',
    '個人情報',
    '通信',
    '検索専用',
  ].forEach(term => assert.match(searchable, new RegExp(term)));
});

test('help content avoids unsupported claims and points users to self-service instead of inquiry', () => {
  const content = getHelpCenterContent('ja');
  const text = [
    content.intro,
    ...content.faqItems.flatMap(item => [item.question, item.answer]),
    ...content.selfServiceSections.flatMap(section => [section.title, ...section.steps]),
    ...content.sourceNotes.map(note => `${note.label} ${note.summary}`),
  ].join('\n');

  assert.doesNotMatch(text, /問い合わせ|support@|mailto:|99\.9%|数センチメートル|3m×3m|10文字/);
  assert.match(text, /自己解決/);
  assert.match(text, /根拠/);
});

test('help source notes include the fact-checked open source and browser permission sources', () => {
  const notes = getHelpSourceNotes('en');
  const labels = notes.map(note => note.label);

  assert.ok(labels.includes('MapLibre GL JS'));
  assert.ok(labels.includes('OpenStreetMap'));
  assert.ok(labels.includes('MDN Geolocation API'));
  assert.ok(labels.includes('Google libaddressinput'));
  assert.ok(labels.includes('OpenCage address-formatting'));
});

test('help self-service checklist gives actionable paths before escalation', () => {
  const sections = getHelpSelfServiceSections('ja');

  assert.ok(sections.length >= 4);
  sections.forEach(section => {
    assert.ok(section.steps.length >= 3, `${section.id} should have at least 3 steps`);
  });
});

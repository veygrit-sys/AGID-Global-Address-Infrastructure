import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'AddressFeedbackPanel.tsx'), 'utf8');
const learningSource = readFileSync(join(here, '..', 'lib', 'addressFeedbackLearning.ts'), 'utf8');
const submissionSource = readFileSync(join(here, '..', 'lib', 'address', 'addressQualityFeedbackSubmission.ts'), 'utf8');

test('address feedback panel defines a classify-correct-review-saved flow', () => {
  assert.match(source, /type FeedbackStep = 'classify' \| 'correct' \| 'review' \| 'saved'/);
  assert.match(source, /何が違いますか/);
  assert.match(source, /正しい住所表示案を入力/);
  assert.match(source, /保存と学習の確認/);
  assert.match(source, /フィードバックを保存しました/);
});

test('address feedback panel keeps drawer mode and adds a map-left editing mode', () => {
  assert.match(source, /createPortal/);
  assert.match(source, /document\.body/);
  assert.match(source, /presentation\?: 'drawer' \| 'map-left'/);
  assert.match(source, /presentation = 'drawer'/);
  assert.match(source, /Address feedback drawer/);
  assert.match(source, /Address feedback map-left panel/);
  assert.match(source, /left-3 right-3 top-\[76px\]/);
  assert.match(source, /md:w-\[min\(50vw,640px\)\]/);
  assert.match(source, /justify-end/);
  assert.match(source, /max-w-5xl/);
  assert.match(source, /住所修正/);
  assert.match(source, /翻訳修正/);
  assert.match(source, /配送不可/);
  assert.match(source, /PO Box/);
  assert.match(source, /オートロック/);
  assert.match(source, /到達不可/);
});

test('address feedback panel captures delivery access constraints without exposing raw addresses', () => {
  assert.match(source, /配送・アクセス制約/);
  assert.match(source, /配送不可地域/);
  assert.match(source, /PO Box \/ 私書箱/);
  assert.match(source, /配送業者が拒否/);
  assert.match(source, /Carrier \/ operator code/);
  assert.match(source, /undeliverableRegion: inferredUndeliverable/);
  assert.match(source, /unreachableAccess: inferredUnreachable/);
});

test('address feedback panel explains the custom AI as a local contextual bandit', () => {
  assert.match(source, /なんのAI/);
  assert.match(source, /文脈付きバンディット/);
  assert.match(source, /LLMではなく/);
  assert.match(learningSource, /version: 'address-feedback-bandit-v1'/);
  assert.match(learningSource, /externalTransmission: 'blocked'|closed-device-local/);
});

test('address feedback panel records local learning and optional redacted field submission', () => {
  assert.match(source, /外部送信/);
  assert.match(source, /closed-device local learning/);
  assert.match(source, /localStorage/);
  assert.match(source, /現場改善キューへ送信する/);
  assert.match(source, /住所本文、修正文、受取人情報は送信しません/);
  assert.match(source, /submitAddressQualityFeedback/);
  assert.match(learningSource, /ADDRESS_FEEDBACK_RECORDS_STORAGE_KEY/);
  assert.match(learningSource, /stripPrivateAddressFeedbackFields/);
  assert.match(submissionSource, /rawAddressIncluded: false/);
  assert.match(submissionSource, /correctedAddressIncluded: false/);
});

test('address feedback panel makes quality, target, and redacted submission scope visible first', () => {
  assert.match(source, /function publicFeedbackQualityLabel/);
  assert.match(source, /Verified/);
  assert.match(source, /Partial/);
  assert.match(source, /Manual required/);
  assert.match(source, /Report target/);
  assert.match(source, /shortAgidLabel\(agid\)/);
  assert.match(source, /redacted field report/);
  assert.match(source, /現場改善へ送るのは分類、AGID末尾、国、言語、証拠ソース、配送制約だけです/);
  assert.match(source, /edit-only preview/);
});

test('address feedback panel shows a compact classify-correct-review-save progress rail', () => {
  assert.match(source, /function feedbackStepIndex/);
  assert.match(source, /\['分類', '修正', '確認', '保存'\] as const/);
  assert.match(source, /feedbackStepIndex\(step\) >= index/);
});

test('map-left feedback returns to the map after a report is saved', () => {
  assert.match(source, /closeOnSaved\?: boolean/);
  assert.match(source, /window\.setTimeout\(\(\) => \{/);
  assert.match(source, /報告を保存しました。地図とグリッドの画面に戻ります。/);
  assert.match(source, /元の画面に戻る/);
});

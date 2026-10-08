import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AddressFeedbackPanel } from './AddressFeedbackPanel';

const render = (isOpen = true) => renderToStaticMarkup(React.createElement(AddressFeedbackPanel, {
  isOpen, onClose: () => {}, agid: 'JP-TEST', countryCode: 'JP',
  languageTab: 'ja', addressDisplay: '東京都 テスト地点', presentation: 'map-left',
}));

test('closed feedback does not render a form', () => {
  assert.equal(render(false), '');
});
test('report shows its target and labelled editable fields', () => {
  const html = render();
  for (const text of ['JP-TEST', '東京都 テスト地点', '何が違いますか', '修正案', '補足・確認した根拠', '影響の大きさ', '内容を確認']) {
    assert.ok(html.includes(text), text);
  }
  assert.ok(html.includes('role="dialog"'));
  assert.ok(html.includes('aria-labelledby="feedback-heading"'));
  assert.ok(html.includes('form="address-feedback-form"'));
});
test('report preserves category choices and explains the privacy boundary', () => {
  const html = render();
  for (const value of ['wrong-address', 'translation', 'postal-code', 'auto-lock', 'unreachable', 'other']) {
    assert.ok(html.includes('value="' + value + '"'));
  }
  assert.ok(html.includes('修正案は外部に送信されません'));
  assert.ok(html.includes('送信を選んだ場合は共有されます'));
  assert.ok(!html.includes('なんのAI'));
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const diagramDoc = readFileSync(join(root, 'docs/product/playlist-commerce-diagrams.md'), 'utf8');
const platformDoc = readFileSync(join(root, 'docs/product/playlist-commerce-platform.md'), 'utf8');

function mermaidBlocks(markdown: string) {
  return [...markdown.matchAll(/```mermaid\n([\s\S]*?)```/g)].map(match => match[1]);
}

test('Playlist Commerce diagram document keeps the full presentation diagram set', () => {
  const requiredHeadings = [
    '## 1. Service Relationship Diagram',
    '## 2. Service Architecture Diagram',
    '## 3. User Flow Diagram',
    '## 4. EC Integration Diagram',
    '## 5. SDK And API Composition Diagram',
    '## 6. Data Flow Diagram',
    '## 7. System Architecture Diagram',
    '## 8. Permission And Authentication Diagram',
    '## 9. Merchant Value Diagram',
    '## 10. Developer Integration Diagram',
    '## 11. Novelty Positioning Diagram',
    '## 12. Slide Order Recommendation',
  ];

  for (const heading of requiredHeadings) {
    assert.ok(diagramDoc.includes(heading), `missing ${heading}`);
  }

  assert.equal(mermaidBlocks(diagramDoc).length, 11);
});

test('diagram set links Playlist Commerce to Address Identity Network components', () => {
  for (const term of [
    'Address Identity Network',
    'Identity Wallet',
    'Address Login',
    'Travel Login',
    'Delivery Gateway',
    'Trade Gateway',
    'Playlist Commerce',
  ]) {
    assert.ok(diagramDoc.includes(term), `missing ${term}`);
  }
});

test('diagram set preserves safe novelty and non-overclaim wording', () => {
  assert.ok(diagramDoc.includes('Avoid unsupported wording such as "world first"'));
  assert.ok(diagramDoc.includes('The novelty is not "a playlist" alone.'));
  assert.ok(diagramDoc.includes('cross-EC playlist + wallet consent + no-address checkout'));
  assert.ok(!/world[- ]first platform/i.test(diagramDoc));
});

test('diagrams define merchant, developer, and investor slide orders', () => {
  assert.ok(diagramDoc.includes('For investors:'));
  assert.ok(diagramDoc.includes('For EC operators:'));
  assert.ok(diagramDoc.includes('For developers:'));
  assert.ok(diagramDoc.includes('Merchant Value Diagram'));
  assert.ok(diagramDoc.includes('Developer Integration Diagram'));
});

test('diagram document includes implementation coverage for all presentation diagrams', () => {
  assert.ok(diagramDoc.includes('## 13. Implementation Coverage Table'));
  assert.ok(diagramDoc.includes('tested widget, SDK'));
  assert.ok(diagramDoc.includes('| Diagram | Primary reader | Widget evidence | Executable evidence | Non-claim boundary |'));

  for (const section of [
    'Service Relationship Diagram',
    'Service Architecture Diagram',
    'User Flow Diagram',
    'EC Integration Diagram',
    'SDK And API Composition Diagram',
    'Data Flow Diagram',
    'System Architecture Diagram',
    'Permission And Authentication Diagram',
    'Merchant Value Diagram',
    'Developer Integration Diagram',
    'Novelty Positioning Diagram',
    'Slide Order Recommendation',
  ]) {
    assert.ok(diagramDoc.includes(`| ${section} |`), `coverage table missing ${section}`);
  }

  assert.ok(diagramDoc.includes('Do not use unsupported world-first claims'));
  assert.ok(diagramDoc.includes('Do not expose passkeys, witnesses, private keys, biometrics, or raw address payloads.'));
});

test('platform overview links to the diagram document', () => {
  assert.ok(platformDoc.includes('docs/product/playlist-commerce-diagrams.md'));
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPlaylistCommerceCoverageSection,
  syncPlaylistCommerceCoverageTable,
} from './sync-playlist-commerce-coverage-table';

test('Playlist Commerce coverage sync builds the generated section', () => {
  const section = buildPlaylistCommerceCoverageSection();
  assert.match(section, /^## 13\. Implementation Coverage Table/);
  assert.match(section, /tested widget, SDK/);
  assert.match(section, /\| Service Relationship Diagram \| investor \|/);
  assert.match(section, /\| Slide Order Recommendation \| operator \|/);
});

test('Playlist Commerce coverage sync replaces only the coverage section', () => {
  const current = [
    '# Playlist Commerce Diagrams',
    '',
    'Earlier diagram content.',
    '',
    '## 13. Implementation Coverage Table',
    '',
    'stale table',
  ].join('\n');

  const next = syncPlaylistCommerceCoverageTable(current);
  assert.match(next, /Earlier diagram content\./);
  assert.doesNotMatch(next, /stale table/);
  assert.match(next, /\| Developer Integration Diagram \| developer \|/);
});

test('Playlist Commerce coverage sync fails closed when the target section is missing', () => {
  assert.throws(
    () => syncPlaylistCommerceCoverageTable('# Playlist Commerce Diagrams'),
    /Missing section: ## 13\. Implementation Coverage Table/,
  );
});

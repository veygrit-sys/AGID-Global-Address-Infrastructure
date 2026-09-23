import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import {
  findMissingPresentationCoverage,
  playlistCommercePresentationMap,
  renderPlaylistCommerceCoverageTable,
} from './playlistCommercePresentationMap';

const root = process.cwd();
const diagramDoc = readFileSync(join(root, 'docs/product/playlist-commerce-diagrams.md'), 'utf8');
const widgetSource = readFileSync(join(root, 'src/components/PlaylistCommerceWidgetScreen.tsx'), 'utf8');

test('Playlist Commerce presentation map connects diagram sections to widget evidence', () => {
  assert.equal(playlistCommercePresentationMap.length, 12);
  assert.deepEqual(findMissingPresentationCoverage(diagramDoc, widgetSource), []);
});

test('Playlist Commerce presentation map covers system and permission diagrams', () => {
  const sections = playlistCommercePresentationMap.map(item => item.diagramSection);
  assert.ok(sections.includes('System Architecture Diagram'));
  assert.ok(sections.includes('Permission And Authentication Diagram'));
  assert.ok(sections.includes('Merchant Value Diagram'));
  assert.ok(sections.includes('Developer Integration Diagram'));
  assert.ok(sections.includes('Novelty Positioning Diagram'));
  assert.ok(sections.includes('Slide Order Recommendation'));
  for (const section of sections) {
    assert.ok(diagramDoc.includes(`## `) && diagramDoc.includes(section), `diagram doc missing ${section}`);
  }
});

test('Playlist Commerce presentation map covers each reader audience and live evidence', () => {
  const audiences = new Set(playlistCommercePresentationMap.map(item => item.audience));
  assert.deepEqual([...audiences].sort(), ['developer', 'investor', 'merchant', 'operator']);

  for (const item of playlistCommercePresentationMap) {
    assert.ok(item.executableEvidence.length > 0, `${item.diagramSection} lacks executable evidence`);
    assert.ok(item.nonClaimBoundary.startsWith('Do not'), `${item.diagramSection} needs a non-claim boundary`);
  }
});

test('rendered presentation coverage table is kept in the diagram document', () => {
  const renderedRows = renderPlaylistCommerceCoverageTable().split('\n');
  for (const row of renderedRows) {
    assert.ok(diagramDoc.includes(row), `diagram doc missing generated coverage row: ${row}`);
  }
});

test('presentation coverage checker reports missing widget anchors without touching private data', () => {
  const missing = findMissingPresentationCoverage(diagramDoc, widgetSource.replace('Developer method surface', 'SDK surface'));
  assert.ok(missing.some(item => item.reason === 'widget:Developer method surface'));

  for (const item of playlistCommercePresentationMap) {
    assert.doesNotMatch(item.nonClaimBoundary, /raw address fixture|proof witness value|private key value/i);
  }
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
const searchSidebarSource = readFileSync(new URL('./components/SearchSidebar.tsx', import.meta.url), 'utf8');
const noticeSource = readFileSync(new URL('./components/PostalAreaNotice.tsx', import.meta.url), 'utf8');

test('postal suggestions stay interactable and form search selects a result before yielding to map detail', () => {
  assert.match(searchSidebarSource, /const isSearchExpanded = isSearchFocused;/);
  assert.match(searchSidebarSource, /onClick=\{\(\) => selectSearchResult\(result\)\}/);
  assert.match(appSource, /if \(results\.length > 0\) \{[\s\S]*?await selectSearchResult\(results\[0\]\);/);
  assert.match(
    appSource,
    /setSearchQuery\(display_name\);\s+setSearchResults\(\[\]\);\s+setIsSearchFocused\(false\);/,
  );
});
test('mobile postal evidence keeps a map viewport and avoids the overlapping AGID card', () => {
  assert.match(noticeSource, /max-h-\[46vh\]/);
  assert.match(noticeSource, /md:max-h-\[calc\(100vh-116px\)\]/);
  assert.match(appSource, /postalAreaNotice && "hidden md:flex"/);
});

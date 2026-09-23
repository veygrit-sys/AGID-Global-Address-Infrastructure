import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const readme = readFileSync("README.md", "utf8");

test("root README links the AMT v2 verified theory layer", () => {
  assert.match(readme, /Address Morphism Theory v2/);
  assert.match(readme, /12-chapter structure/);
  assert.match(readme, /executable TypeScript model and test/);
  assert.match(readme, /docs\/address-morphism-theory-v2\/SUMMARY\.md/);
  assert.match(readme, /docs\/address-morphism-theory-v2\/formal-model-registry\.md/);
  assert.match(readme, /docs\/address-morphism-theory-v2\/compatibility-map\.md/);
  assert.match(readme, /npm run verify:address-morphism-v2-compatibility/);
  assert.match(readme, /does not claim global address completeness/);
});

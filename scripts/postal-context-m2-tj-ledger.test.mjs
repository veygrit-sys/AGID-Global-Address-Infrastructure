import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const root=new URL('../',import.meta.url);
const ledger=JSON.parse(readFileSync(new URL('docs/postal-context-m2-rollout.json',root),'utf8'));
const tj=ledger.countries.find(country=>country.countryCode==='TJ');
const tl=ledger.countries.find(country=>country.countryCode==='TL');
const manifest=JSON.parse(readFileSync(new URL('data/postal_country_packs/tj/postal-context/repository-manifest.json',root),'utf8'));
const sourceReport=readFileSync(new URL('reports/postal-context-m2/tj-source-review-2026-08-29.json',root));
const checks=readFileSync(new URL('reports/postal-context-m2/tj-checks-2026-08-29.json',root));
const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

test('Tajikistan remains blocked under its current-area app criterion',()=>{
 assert.equal(tj.status,'blocked');
 assert.equal(tj.attempts,1);
 assert.equal(tj.evidence,null);
 assert.equal(tj.blocker.requiresExplicitApproval,false);
 assert.equal(tj.m2Definition.id,'M2_current_six_digit_index_area_visualization');
 assert.equal(manifest.promotion.target_stage,tj.m2Definition.id);
 assert.equal(tj.blocker.evidence.officialIndexPageDistinctCodes,188);
 assert.equal(tj.blocker.evidence.officialOfficeRows,88);
 assert.equal(tj.blocker.evidence.officialPostalGeometryRecords,0);
 assert.equal(tj.blocker.evidence.publishedImmutableDataArtifacts,0);
});

test('Tajikistan shared map capability is not promoted to country completion',()=>{
 assert.equal(tj.blocker.evidence.sharedAppAreaPathVerified,true);
 assert.equal(tj.blocker.evidence.sharedAppProvenanceContractComplete,false);
 assert.equal(tj.blocker.evidence.realTajikPostalApiVerified,false);
 assert.equal(tj.blocker.evidence.realTajikAppAreaVisualizationVerified,false);
 assert.match(tj.m2Definition.definition,/official\/derived\/virtual/);
 assert.match(tj.m2Definition.definition,/translucent fill/);
});

test('Tajikistan ledger pins source and engineering reports',()=>{
 assert.equal(digest(sourceReport),tj.lastAttempt.reportDigest);
 assert.equal(digest(checks),tj.lastAttempt.engineeringReportDigest);
 assert.equal(tj.blocker.evidence.sourceReviewDigest,tj.lastAttempt.reportDigest);
 assert.equal(tj.blocker.evidence.engineeringChecksDigest,tj.lastAttempt.engineeringReportDigest);
});

test('Timor-Leste remains the next untouched country',()=>{
 assert.equal(tl.status,'pending');
 assert.equal(tl.attempts,0);
 assert.equal(tl.manifest,null);
});

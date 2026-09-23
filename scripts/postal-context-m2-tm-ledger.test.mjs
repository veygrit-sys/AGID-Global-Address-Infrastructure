import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const root=new URL('../',import.meta.url);
const ledger=JSON.parse(readFileSync(new URL('docs/postal-context-m2-rollout.json',root),'utf8'));
const tm=ledger.countries.find(country=>country.countryCode==='TM');
const tr=ledger.countries.find(country=>country.countryCode==='TR');
const manifest=JSON.parse(readFileSync(new URL('data/postal_country_packs/tm/postal-context/repository-manifest.json',root),'utf8'));
const sourceReport=readFileSync(new URL('reports/postal-context-m2/tm-source-review-2026-08-29.json',root));
const checks=readFileSync(new URL('reports/postal-context-m2/tm-checks-2026-08-29.json',root));
const format=JSON.parse(readFileSync(new URL('src/data/address_formats/asia/central_asia/TM.json',root),'utf8'));
const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

test('Turkmenistan remains blocked under its current-area app criterion',()=>{
 assert.equal(tm.status,'blocked');
 assert.equal(tm.attempts,1);
 assert.equal(tm.evidence,null);
 assert.equal(tm.blocker.requiresExplicitApproval,false);
 assert.equal(tm.m2Definition.id,'M2_current_six_digit_delivery_area_visualization');
 assert.equal(manifest.promotion.target_stage,tm.m2Definition.id);
 assert.equal(tm.blocker.evidence.currentOfficeIndexRowsValidated,153);
 assert.equal(tm.blocker.evidence.officialPostalGeometryRecords,0);
 assert.equal(tm.blocker.evidence.publishedImmutableDataArtifacts,0);
});

test('Turkmenistan office indices remain typed non-area context',()=>{
 assert.equal(format.postalCode.format,'NNNNNN');
 assert.equal(format.postalCode.regex,'^\\d{6}$');
 assert.equal(format.postalCode.api,'https://post.tm/');
 assert.equal(tm.blocker.evidence.uniqueSixDigitOfficeIndices,153);
 assert.equal(tm.blocker.evidence.officeRowsWithPoint,137);
 assert.equal(tm.blocker.evidence.officeRowsWithoutPoint,16);
 assert.equal(tm.blocker.evidence.currentPostalAssignmentRowsValidated,0);
 assert.equal(tm.blocker.evidence.officeIndexDirectoryClassifiedAsDeliveryAreas,false);
});

test('Turkmenistan shared map capability is not promoted to country completion',()=>{
 assert.equal(tm.blocker.evidence.sharedAppAreaPathVerified,true);
 assert.equal(tm.blocker.evidence.sharedAppProvenanceContractComplete,false);
 assert.equal(tm.blocker.evidence.realTurkmenistanPostalApiVerified,false);
 assert.equal(tm.blocker.evidence.realTurkmenistanAppAreaVisualizationVerified,false);
 assert.match(tm.m2Definition.definition,/official\/derived\/virtual/);
 assert.match(tm.m2Definition.definition,/translucent fill/);
 assert.match(tm.lastAttempt.nextAction,/never buffer, Voronoi-partition or join/);
});

test('Turkmenistan ledger pins reports and Turkey stays next',()=>{
 assert.equal(digest(sourceReport),tm.lastAttempt.reportDigest);
 assert.equal(digest(checks),tm.lastAttempt.engineeringReportDigest);
 assert.equal(tm.blocker.evidence.sourceReviewDigest,tm.lastAttempt.reportDigest);
 assert.equal(tm.blocker.evidence.engineeringChecksDigest,tm.lastAttempt.engineeringReportDigest);
 assert.equal(tr.status,'pending');
 assert.equal(tr.attempts,0);
 assert.equal(tr.manifest,null);
});

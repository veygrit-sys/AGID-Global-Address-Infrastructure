import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const root=new URL('../',import.meta.url);
const ledger=JSON.parse(readFileSync(new URL('docs/postal-context-m2-rollout.json',root),'utf8'));
const tr=ledger.countries.find(country=>country.countryCode==='TR');
const tw=ledger.countries.find(country=>country.countryCode==='TW');
const manifest=JSON.parse(readFileSync(new URL('data/postal_country_packs/tr/postal-context/repository-manifest.json',root),'utf8'));
const sourceReport=readFileSync(new URL('reports/postal-context-m2/tr-source-review-2026-08-29.json',root));
const checks=readFileSync(new URL('reports/postal-context-m2/tr-checks-2026-08-29.json',root));
const format=JSON.parse(readFileSync(new URL('src/data/address_formats/asia/middle_east/TR.json',root),'utf8'));
const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

test('Türkiye remains blocked under its current-area app criterion',()=>{
 assert.equal(tr.status,'blocked');
 assert.equal(tr.attempts,1);
 assert.equal(tr.evidence,null);
 assert.equal(tr.blocker.requiresExplicitApproval,false);
 assert.equal(tr.m2Definition.id,'M2_current_five_digit_delivery_area_visualization');
 assert.equal(manifest.promotion.target_stage,tr.m2Definition.id);
 assert.equal(tr.blocker.evidence.currentPostalAssignmentRowsValidated,3269);
 assert.equal(tr.blocker.evidence.officialPostalGeometryRecords,0);
 assert.equal(tr.blocker.evidence.publishedImmutableDataArtifacts,0);
});

test('Türkiye PTT assignments remain typed non-area context',()=>{
 assert.equal(format.postalCode.format,'NNNNN');
 assert.equal(format.postalCode.regex,'^\\d{5}$');
 assert.equal(format.postalCode.api,'https://www.ptt.gov.tr/posta-kodu');
 assert.equal(tr.blocker.evidence.uniqueFiveDigitPostcodesInBoundedSample,8);
 assert.equal(tr.blocker.evidence.invalidPostcodesInBoundedSample,0);
 assert.equal(tr.blocker.evidence.currentAssignmentCompletenessValidated,false);
 assert.equal(tr.blocker.evidence.boundedAssignmentSampleClassifiedAsDeliveryAreas,false);
 assert.match(tr.lastAttempt.nextAction,/never buffer, Voronoi-partition or relabel/);
});

test('Türkiye shared map capability is not promoted to country completion',()=>{
 assert.equal(tr.blocker.evidence.sharedAppAreaPathVerified,true);
 assert.equal(tr.blocker.evidence.sharedAppProvenanceContractComplete,false);
 assert.equal(tr.blocker.evidence.realTurkiyePostalApiVerified,false);
 assert.equal(tr.blocker.evidence.realTurkiyeAppAreaVisualizationVerified,false);
 assert.match(tr.m2Definition.definition,/official\/derived\/virtual/);
 assert.match(tr.m2Definition.definition,/translucent fill/);
});

test('Türkiye ledger pins reports and Taiwan stays next',()=>{
 assert.equal(digest(sourceReport),tr.lastAttempt.reportDigest);
 assert.equal(digest(checks),tr.lastAttempt.engineeringReportDigest);
 assert.equal(tr.blocker.evidence.sourceReviewDigest,tr.lastAttempt.reportDigest);
 assert.equal(tr.blocker.evidence.engineeringChecksDigest,tr.lastAttempt.engineeringReportDigest);
 assert.equal(tw.status,'pending');
 assert.equal(tw.attempts,0);
});

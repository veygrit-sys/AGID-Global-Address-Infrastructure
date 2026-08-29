import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const root=new URL('../',import.meta.url);
const ledger=JSON.parse(readFileSync(new URL('docs/postal-context-m2-rollout.json',root),'utf8'));
const ax=ledger.countries.find(country=>country.countryCode==='AX');
const ba=ledger.countries.find(country=>country.countryCode==='BA');
const manifest=JSON.parse(readFileSync(new URL('data/postal_country_packs/ax/postal-context/repository-manifest.json',root),'utf8'));
const sourceReport=readFileSync(new URL('reports/postal-context-m2/ax-source-review-2026-08-29.json',root));
const checks=readFileSync(new URL('reports/postal-context-m2/ax-checks-2026-08-29.json',root));
const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

test('Åland Islands remains blocked under its current assignment and statistical-area criterion',()=>{
 assert.equal(ax.status,'blocked');assert.equal(ax.attempts,1);assert.equal(ax.evidence,null);assert.equal(ax.blocker.requiresExplicitApproval,true);
 assert.equal(ax.m2Definition.id,'M2_current_assignment_and_official_statistical_postal_area_visualization');assert.equal(manifest.promotion.target_stage,ax.m2Definition.id);
 assert.equal(ax.blocker.evidence.currentAssignmentCodes,37);assert.equal(ax.blocker.evidence.officialStatisticalGeometryRecords,32);assert.equal(ax.blocker.evidence.validGeometryRecords,32);
});

test('Paavo authority and five non-area outcomes remain explicit',()=>{
 assert.equal(ax.blocker.evidence.officialOperatorGeometryRecords,0);assert.equal(ax.blocker.evidence.explicitNonAreaCodes,5);assert.equal(ax.blocker.evidence.nonAreaGeometryInvented,false);
 assert.equal(ax.blocker.evidence.paavoPresentedAsOperatorPerimeter,false);assert.equal(ax.blocker.evidence.addressOrBuildingInferredFromContainment,false);assert.equal(ax.blocker.evidence.axIdentityPreserved,true);
});

test('Åland ledger pins exact reports and Bosnia and Herzegovina is next',()=>{
 assert.equal(digest(sourceReport),ax.lastAttempt.reportDigest);assert.equal(digest(checks),ax.lastAttempt.engineeringReportDigest);
 assert.equal(ax.blocker.evidence.sourceReviewDigest,ax.lastAttempt.reportDigest);assert.equal(ax.blocker.evidence.engineeringChecksDigest,ax.lastAttempt.engineeringReportDigest);
 assert.equal(ba.status,'pending');assert.equal(ba.region,'europe');
});

test('shared application capability does not promote unavailable AX runtime',()=>{
 assert.equal(ax.blocker.evidence.sharedAppAreaPathVerified,true);assert.equal(ax.blocker.evidence.sharedAppProvenanceContractComplete,false);
 assert.equal(ax.blocker.evidence.realAlandAgidPostalApiVerified,false);assert.equal(ax.blocker.evidence.realAlandAgidAppAreaVisualizationVerified,false);
 assert.match(ax.blocker.retryPolicy,/Do not create.*publish.*deploy.*authenticate.*pay.*force push/i);
});

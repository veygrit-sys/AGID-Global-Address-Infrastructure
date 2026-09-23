import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const root=new URL('../',import.meta.url);
const ledger=JSON.parse(readFileSync(new URL('docs/postal-context-m2-rollout.json',root),'utf8'));
const ad=ledger.countries.find(country=>country.countryCode==='AD');
const al=ledger.countries.find(country=>country.countryCode==='AL');
const manifest=JSON.parse(readFileSync(new URL('data/postal_country_packs/ad/postal-context/repository-manifest.json',root),'utf8'));
const sourceReport=readFileSync(new URL('reports/postal-context-m2/ad-source-review-2026-08-29.json',root));
const checks=readFileSync(new URL('reports/postal-context-m2/ad-checks-2026-08-29.json',root));
const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

test('Andorra remains blocked under its road-assigned area criterion',()=>{
 assert.equal(ad.status,'blocked');assert.equal(ad.attempts,1);assert.equal(ad.evidence,null);assert.equal(ad.blocker.requiresExplicitApproval,true);
 assert.equal(ad.m2Definition.id,'M2_current_road_assigned_postal_area_visualization');assert.equal(manifest.promotion.target_stage,ad.m2Definition.id);
 assert.equal(ad.blocker.evidence.currentPostalCodeRowsValidated,0);assert.equal(ad.blocker.evidence.currentRoadAssignmentRowsValidated,0);assert.equal(ad.blocker.evidence.officialPostalGeometryRecords,0);
});

test('roads, parishes, address points and buildings never become postal polygons',()=>{
 assert.equal(ad.blocker.evidence.assignmentGrain,'road/thoroughfare');assert.equal(ad.blocker.evidence.geographicZones,7);
 assert.equal(ad.blocker.evidence.parishBoundaryIsFullPostcodeGeometry,false);assert.equal(ad.blocker.evidence.addressPointIsPostalArea,false);
 assert.equal(ad.blocker.evidence.correosOverlayAndorraScopeVerified,false);assert.match(ad.m2Definition.definition,/translucent fill/);assert.match(ad.m2Definition.definition,/official\/derived\/virtual/);
});

test('Andorra ledger pins exact reports and Albania is next',()=>{
 assert.equal(digest(sourceReport),ad.lastAttempt.reportDigest);assert.equal(digest(checks),ad.lastAttempt.engineeringReportDigest);
 assert.equal(ad.blocker.evidence.sourceReviewDigest,ad.lastAttempt.reportDigest);assert.equal(ad.blocker.evidence.engineeringChecksDigest,ad.lastAttempt.engineeringReportDigest);
 assert.equal(al.status,'pending');assert.equal(al.region,'europe');
});

test('shared application capability does not promote controlled or synthetic AD data',()=>{
 assert.equal(ad.blocker.evidence.sharedAppAreaPathVerified,true);assert.equal(ad.blocker.evidence.realAndorraAgidPostalApiVerified,false);assert.equal(ad.blocker.evidence.realAndorraAgidAppAreaVisualizationVerified,false);
 assert.equal(ad.blocker.evidence.correosPaidContractRequired,true);assert.equal(ad.blocker.evidence.correosPublicSearchForUnrelatedUsersAllowed,false);
 assert.match(ad.blocker.retryPolicy,/Do not contract.*pay.*accept.*conditions/i);
});

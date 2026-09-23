import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const root=new URL('../',import.meta.url);
const ledger=JSON.parse(readFileSync(new URL('docs/postal-context-m2-rollout.json',root),'utf8'));
const cy=ledger.countries.find(country=>country.countryCode==='CY');
const cz=ledger.countries.find(country=>country.countryCode==='CZ');
const manifest=JSON.parse(readFileSync(new URL('data/postal_country_packs/cy/postal-context/repository-manifest.json',root),'utf8'));
const sourceReport=readFileSync(new URL('reports/postal-context-m2/cy-source-review-2026-08-29.json',root));
const checks=readFileSync(new URL('reports/postal-context-m2/cy-checks-2026-08-29.json',root));
const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

test('Cyprus remains blocked under its current-assignment and area criterion',()=>{
 assert.equal(cy.status,'blocked');assert.equal(cy.attempts,1);assert.equal(cy.evidence,null);assert.equal(cy.blocker.requiresExplicitApproval,true);
 assert.equal(cy.m2Definition.id,'M2_current_assignment_and_statistical_or_derived_postal_area_visualization');assert.equal(manifest.promotion.target_stage,cy.m2Definition.id);
 assert.equal(cy.blocker.evidence.currentAddressableCodes,1131);assert.equal(cy.blocker.evidence.historicalFourDigitGeometryCodes,845);assert.equal(cy.blocker.evidence.matchedCurrentCodes,832);
 assert.equal(cy.blocker.evidence.currentCodesWithoutHistoricalGeometry,299);assert.equal(cy.blocker.evidence.historicalCodesAbsentFromCurrentAssignment,13);
});

test('historical statistical surfaces and address context never become current operator polygons',()=>{
 assert.equal(cy.blocker.evidence.geometryAuthority,'official-statistical-historical');assert.equal(cy.blocker.evidence.currentOperatorPerimeterRecords,0);
 assert.equal(cy.blocker.evidence.historicalStatisticalSectorIsCurrentOperatorArea,false);assert.equal(cy.blocker.evidence.communityOrStreetIsPostcodeArea,false);assert.equal(cy.blocker.evidence.addressOrBuildingIsPostcodeArea,false);
 assert.equal(cy.blocker.evidence.missingCodesReceiveInventedArea,false);assert.match(cy.m2Definition.definition,/translucent fill/);assert.match(cy.m2Definition.definition,/2011 CYSTAT/);
});

test('Cyprus ledger pins exact reports and Czech Republic is next',()=>{
 assert.equal(digest(sourceReport),cy.lastAttempt.reportDigest);assert.equal(digest(checks),cy.lastAttempt.engineeringReportDigest);
 assert.equal(cy.blocker.evidence.sourceReviewDigest,cy.lastAttempt.reportDigest);assert.equal(cy.blocker.evidence.engineeringChecksDigest,cy.lastAttempt.engineeringReportDigest);
 assert.equal(cz.status,'pending');assert.equal(cz.region,'europe');
});

test('shared application capability does not promote unavailable current CY geometry',()=>{
 assert.equal(cy.blocker.evidence.sharedAppAreaPathVerified,true);assert.equal(cy.blocker.evidence.sharedAppProvenanceContractComplete,false);
 assert.equal(cy.blocker.evidence.realCyprusAgidPostalApiVerified,false);assert.equal(cy.blocker.evidence.realCyprusAgidAppAreaVisualizationVerified,false);
 assert.match(cy.blocker.retryPolicy,/Do not authenticate.*accept.*pay.*create.*publish.*deploy/i);
});

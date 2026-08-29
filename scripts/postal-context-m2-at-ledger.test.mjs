import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const root=new URL('../',import.meta.url);
const ledger=JSON.parse(readFileSync(new URL('docs/postal-context-m2-rollout.json',root),'utf8'));
const at=ledger.countries.find(country=>country.countryCode==='AT');
const ax=ledger.countries.find(country=>country.countryCode==='AX');
const manifest=JSON.parse(readFileSync(new URL('data/postal_country_packs/at/postal-context/repository-manifest.json',root),'utf8'));
const sourceReport=readFileSync(new URL('reports/postal-context-m2/at-source-review-2026-08-29.json',root));
const checks=readFileSync(new URL('reports/postal-context-m2/at-checks-2026-08-29.json',root));
const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

test('Austria remains blocked under its current assignment and area criterion',()=>{
 assert.equal(at.status,'blocked');assert.equal(at.attempts,1);assert.equal(at.evidence,null);assert.equal(at.blocker.requiresExplicitApproval,true);
 assert.equal(at.m2Definition.id,'M2_current_assignment_and_statistical_or_derived_postal_area_visualization');assert.equal(manifest.promotion.target_stage,at.m2Definition.id);
 assert.equal(at.blocker.evidence.postDirectoryAddressableCodes,2234);assert.equal(at.blocker.evidence.rtrDistinctCodes,2234);assert.equal(at.blocker.evidence.threeWayCodeSetMatch,true);
});

test('destination, statistical description, address and non-area records never become postal polygons',()=>{
 assert.equal(at.blocker.evidence.destinationIsPostcodeArea,false);assert.equal(at.blocker.evidence.districtOrMunicipalityIsPostcodeArea,false);assert.equal(at.blocker.evidence.addressOrBuildingIsPostcodeArea,false);
 assert.equal(at.blocker.evidence.publicWfsPostalFeatureTypes,0);assert.equal(at.blocker.evidence.statatlasCurrentPostalLayers,0);assert.equal(at.blocker.evidence.officialPostalGeometryRecords,0);
 assert.match(at.m2Definition.definition,/translucent fill/);assert.match(at.m2Definition.definition,/official\/derived\/virtual/);
});

test('Austria ledger pins exact reports and Åland Islands is next',()=>{
 assert.equal(digest(sourceReport),at.lastAttempt.reportDigest);assert.equal(digest(checks),at.lastAttempt.engineeringReportDigest);
 assert.equal(at.blocker.evidence.sourceReviewDigest,at.lastAttempt.reportDigest);assert.equal(at.blocker.evidence.engineeringChecksDigest,at.lastAttempt.engineeringReportDigest);
 assert.equal(ax.status,'pending');assert.equal(ax.region,'europe');
});

test('shared application capability does not promote unavailable AT geometry',()=>{
 assert.equal(at.blocker.evidence.sharedAppAreaPathVerified,true);assert.equal(at.blocker.evidence.sharedAppProvenanceContractComplete,false);
 assert.equal(at.blocker.evidence.realAustriaAgidPostalApiVerified,false);assert.equal(at.blocker.evidence.realAustriaAgidAppAreaVisualizationVerified,false);
 assert.match(at.blocker.retryPolicy,/Do not buy.*sign.*authenticate.*create.*publish.*deploy/i);
});

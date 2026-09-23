import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const root=new URL('../',import.meta.url);
const ledger=JSON.parse(readFileSync(new URL('docs/postal-context-m2-rollout.json',root),'utf8'));
const al=ledger.countries.find(country=>country.countryCode==='AL');
const at=ledger.countries.find(country=>country.countryCode==='AT');
const manifest=JSON.parse(readFileSync(new URL('data/postal_country_packs/al/postal-context/repository-manifest.json',root),'utf8'));
const sourceReport=readFileSync(new URL('reports/postal-context-m2/al-source-review-2026-08-29.json',root));
const checks=readFileSync(new URL('reports/postal-context-m2/al-checks-2026-08-29.json',root));
const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');

test('Albania remains blocked under its current office-assignment and area criterion',()=>{
 assert.equal(al.status,'blocked');assert.equal(al.attempts,1);assert.equal(al.evidence,null);assert.equal(al.blocker.requiresExplicitApproval,true);
 assert.equal(al.m2Definition.id,'M2_current_office_assignment_and_postal_area_visualization');assert.equal(manifest.promotion.target_stage,al.m2Definition.id);
 assert.equal(al.blocker.evidence.postaTableRowsObserved,535);assert.equal(al.blocker.evidence.distinctPostcodesObserved,532);assert.equal(al.blocker.evidence.officialPostalGeometryRecords,0);
});

test('office, cadastral, address and building evidence never become postal polygons',()=>{
 assert.equal(al.blocker.evidence.postcodeAddressMembershipRows,0);assert.equal(al.blocker.evidence.cadastralZoneIsPostcodeArea,false);
 assert.equal(al.blocker.evidence.officePointIsPostcodeArea,false);assert.equal(al.blocker.evidence.addressBuildingIsPostcodeArea,false);
 assert.equal(al.blocker.evidence.openDataWorkbookPostalCodeColumns,0);assert.equal(al.blocker.evidence.openDataWorkbookGeometryColumns,0);
 assert.match(al.m2Definition.definition,/translucent fill/);assert.match(al.m2Definition.definition,/official\/derived\/virtual/);
});

test('Albania ledger pins exact reports and Austria is next',()=>{
 assert.equal(digest(sourceReport),al.lastAttempt.reportDigest);assert.equal(digest(checks),al.lastAttempt.engineeringReportDigest);
 assert.equal(al.blocker.evidence.sourceReviewDigest,al.lastAttempt.reportDigest);assert.equal(al.blocker.evidence.engineeringChecksDigest,al.lastAttempt.engineeringReportDigest);
 assert.equal(at.status,'pending');assert.equal(at.region,'europe');
});

test('shared application capability does not promote restricted or synthetic AL data',()=>{
 assert.equal(al.blocker.evidence.sharedAppAreaPathVerified,true);assert.equal(al.blocker.evidence.realAlbaniaAgidPostalApiVerified,false);assert.equal(al.blocker.evidence.realAlbaniaAgidAppAreaVisualizationVerified,false);
 assert.equal(al.blocker.evidence.asigNonCommercialOnly,true);assert.equal(al.blocker.evidence.asigAutomatedProgramsProhibited,true);assert.equal(al.blocker.evidence.asigDownloadCredentialsRequired,true);
 assert.match(al.blocker.retryPolicy,/Do not register.*authenticate.*accept.*pay/i);
});

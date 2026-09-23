import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {classifyPostalSourceTrust,getOfficialPostalSourcesForCountry,getPreferredPostalSourceIdsForCountry} from './officialPostalSourceCatalog';
import {POSTAL_CONTEXT_COUNTRY_CODES,normalizePostalContextPostalCode} from './postalContextCountryPolicy';

const text=(path:string)=>readFileSync(path,'utf8').replaceAll('\r\n','\n');
const json=(path:string)=>JSON.parse(text(path));
const pack='data/postal_country_packs/sa/postal-context/';
const manifest=json(pack+'repository-manifest.json'),config=json(pack+'m2-source-review.json');
const reportPath='reports/postal-context-m2/sa-source-review-2026-08-29.json',report=json(reportPath);
const byId=(id:string)=>report.references.find((item:any)=>item.id===id);

test('SA retains its country-specific M2 definition and remains fail-closed',()=>{
 assert.equal(config.definition_basis.previous_definition,'M2_assignment_and_derived_geometry');
 assert.deepEqual(manifest.promotion.stages.find((stage:any)=>stage.id==='M2_assignment_and_derived_geometry'),config.m2_criterion);
 assert.equal(manifest.repository.maturity,'M1_metadata');assert.equal(manifest.promotion.current_stage,'M1_metadata');
 assert.equal(manifest.promotion.data_completion_verified,false);assert.equal(manifest.repository.external_repository_created,false);
 assert.equal((POSTAL_CONTEXT_COUNTRY_CODES as readonly string[]).includes('SA'),true);
 assert.equal(normalizePostalContextPostalCode('SA','01234'),'01234');
});

test('SA exact-byte review keeps official pages, public CSVs and failed PDFs distinct',()=>{
 assert.equal(report.references.length,25);assert.equal(report.references.filter((item:any)=>item.contentVerified).length,22);
 assert.equal(report.references.filter((item:any)=>item.status==='acquisition-failed').length,3);
 for(const item of report.references.filter((entry:any)=>entry.contentVerified)){
   const ref=config.references.find((entry:any)=>entry.id===item.id);assert.equal(item.responseDigest,ref.expected_digest);assert.equal(item.byteLength,ref.reviewed_bytes);
 }
 assert.equal(byId('spl-open-data').profile.listedCsvDownloads,14);assert.equal(byId('spl-open-data').profile.exhaustiveNationalDatasetAbsenceClaim,false);
 assert.equal(byId('upu-sa').profile.printed_edition,'04/2025');assert.deepEqual(byId('upu-sa').profile.visually_reviewed_physical_pages,[1,2]);
});

test('SA public data quality remains facility-grain and cannot promote national assignments',()=>{
 assert.deepEqual(report.openDataSnapshot,{datasets:14,physicalRows:14014,blankRows:381,rowsReviewed:13633,exactDuplicateRows:615,datasetEdition:null,librarySnapshotOnly:true,exhaustiveNationalDatasetAbsenceClaim:false});
 assert.deepEqual(report.officeQuality,{grain:'postal-office-facility',rows:529,postalCodesValidFiveDigits:485,postalCodesMissing:0,postalCodesOtherFormat:44,postalCodesDistinct:474,coordinatePairsMissing:0,coordinatePairsDistinct:492,sharedCoordinateRows:37,districtMissing:261,streetMissing:289,englishNameMissing:1,nationalAssignmentCoverageValidated:false});
 assert.deepEqual(report.serviceJoinQuality,{grain:'office-service',rows:8820,exactDuplicateRows:581,distinctOfficeKeys:462,orphanRowsAgainstOfficeFile:0,distinctOrphanKeys:0,officeKeysWithoutService:67});
 assert.equal(report.currentAssignmentRowsValidated,0);assert.equal(report.officialPostalGeometryRecords,0);assert.equal(report.derivedPostalGeometryRecords,0);
 assert.equal(report.explicitAddressBuildingRelations,0);assert.equal(report.publishedImmutableDataArtifacts,0);assert.equal(report.realAgidRuntimeVerified,false);assert.equal(report.countryM2Achieved,false);
});

test('SA API and privacy observations prohibit silently treating samples as reusable data',()=>{
 const terms=byId('spl-api-terms').profile,geocode=byId('spl-address-geocode').profile;
 assert.equal(terms.nonSublicensable,true);assert.equal(terms.developerAccountRequired,true);assert.equal(terms.genericAddressValidationProhibited,true);assert.equal(terms.exactOutputRedistributionRightsEstablished,false);
 assert.equal(geocode.documentationSaysDigits,4);assert.equal(geocode.samplePostcodeDigits,5);assert.equal(geocode.officialComponentDigits,5);assert.equal(geocode.documentationDigitInconsistency,true);assert.equal(geocode.liveQueriesMade,0);
 assert.equal(byId('spl-privacy-notice').profile.personalRowsRetained,0);
 for(const key of ['productionGeometryRecords','explicitAddressBuildingRelations','publishedImmutableDataArtifacts','geocodeQueries','paidOperations','explicitContractAcceptances','newAccountsOrRepositories','rawSourceBodiesInGit'])assert.equal(report[key],0,key);
});

test('SA catalog preserves the credentialed official API while keeping metadata references weak',()=>{
 const sources=getOfficialPostalSourcesForCountry('SA').filter(source=>source.countryCodes.includes('SA'));assert.equal(sources.length,7);
 const api=sources.find(source=>source.id==='spl-national-address-api-v31');assert.ok(api);
 assert.ok(getPreferredPostalSourceIdsForCountry('SA').includes(api.id));
 for(const input of [{sourceIds:[api.id]},{source:api.label},{url:api.url}])assert.equal(classifyPostalSourceTrust({countryCode:'SA',...input}).strength,'strong');
 for(const source of sources.filter(source=>source!==api)){
   assert.equal(source.validationReadiness,'metadata-only');assert.ok(!getPreferredPostalSourceIdsForCountry('SA').includes(source.id));
   for(const input of [{sourceIds:[source.id]},{source:source.label},{url:source.url}])assert.equal(classifyPostalSourceTrust({countryCode:'SA',...input}).strength,'weak',source.id);
 }
});

test('SA ledger and manifest pin the review and seven-day blocker without claiming M2',()=>{
 const entry=json('docs/postal-context-m2-rollout.json').countries.find((country:any)=>country.countryCode==='SA');
 assert.equal(entry.status,'blocked');assert.equal(entry.attempts,1);assert.equal(entry.evidence,null);assert.deepEqual(entry.m2Definition,config.m2_criterion);
 const digest='sha256:'+createHash('sha256').update(text(reportPath)).digest('hex');
 assert.equal(entry.lastAttempt.reportDigest,digest);assert.equal(manifest.m2_review.source_report_digest,digest);
 assert.equal(Date.parse(entry.blocker.retryAfter)-Date.parse(entry.blocker.observedAt),7*86400000);
 assert.equal(entry.blocker.requiresExplicitApproval,false);
});

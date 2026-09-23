import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parse} from 'yaml';
import type {AddressFormat} from '../data/address_formats';
import {classifyPostalSourceTrust,getOfficialPostalSourcesForCountry,getPreferredPostalSourceIdsForCountry} from './officialPostalSourceCatalog';
import {buildAddressElementFormFields,getAddressElementPostalCodePolicy} from './addressElementCountryForm';
import {POSTAL_CONTEXT_COUNTRY_CODES,normalizePostalContextPostalCode} from './postalContextCountryPolicy';

const text=(p:string)=>readFileSync(p,'utf8').replaceAll('\r\n','\n');
const json=(p:string)=>JSON.parse(text(p));
const pack='data/postal_country_packs/qa/postal-context/';
const manifest=json(pack+'repository-manifest.json'),config=json(pack+'m2-source-review.json');
const reportPath='reports/postal-context-m2/qa-source-review-2026-08-28.json',report=json(reportPath);
const byId=(id:string)=>report.references.find((r:any)=>r.id===id);

test('QA missing M2 definition is reviewed individually; metadata does not enable production',()=>{
 assert.equal(config.definition_basis.previous_definition,null);
 assert.deepEqual(manifest.promotion.stages.find((s:any)=>s.id.startsWith('M2_')),config.m2_criterion);
 assert.equal(config.m2_criterion.id,'M2_current_official_inwani_context');
 assert.match(config.m2_criterion.definition,/complete-for-declared-coverage.*rights-cleared/);
 assert.match(config.m2_criterion.definition,/actual QA AGID loader\/API/);
 assert.equal(manifest.promotion.data_completion_verified,false);
 assert.equal(manifest.repository.external_repository_created,false);
 for(const k of ['contains_raw_source_data','contains_real_addresses','contains_personal_data','contains_production_geometry'])assert.equal(manifest.release_scope[k],false);
 assert.equal((POSTAL_CONTEXT_COUNTRY_CODES as readonly string[]).includes('QA'),false);
 assert.equal(normalizePostalContextPostalCode('QA','00000'),null);
});
test('QA no-postcode form keeps independent civic inputs without fabricated defaults',()=>{
 const path='src/data/address_formats/asia/middle_east/QA',f=json(path+'.json') as AddressFormat;
 const yaml=parse(text(path+'.yaml'));
 assert.deepEqual(yaml.addressRules.openSourceIds,yaml.openSourceIds);
 delete yaml.addressRules.openSourceIds; // Existing YAML denormalized alias; do not rewrite user formats.
 assert.deepEqual(yaml,f);assert.equal(f.countryCode,'QA');
 assert.equal(f.addressRules?.postalCode,null);assert.equal(getAddressElementPostalCodePolicy(f).available,false);
 for(const language of ['en','local']){
   const fields=buildAddressElementFormFields(f,language);assert.equal(fields.some(f=>f.key==='postcode'),false);
   for(const key of ['suburb','street','houseNumber'])assert.equal(fields.find(f=>f.key===key)?.fixedValue,undefined);
 }
});
test('QA viewer and official references cannot become strong postal validation by ID, alias or URL',()=>{
 const sources=getOfficialPostalSourcesForCountry('QA').filter(s=>s.countryCodes.includes('QA'));
 assert.equal(sources.length,6);
 for(const s of sources){
   assert.equal(s.validationReadiness,'metadata-only');assert.ok(!getPreferredPostalSourceIdsForCountry('QA').includes(s.id));
   for(const input of [{sourceIds:[s.id]},{source:s.label},{url:s.url}])assert.equal(classifyPostalSourceTrust({countryCode:'QA',...input}).strength,'weak',s.id);
 }
 assert.equal(classifyPostalSourceTrust({countryCode:'QA',sourceIds:['qatar-gis-geoportal']}).strength,'weak');
 assert.equal(sources.find(s=>s.id==='qatar-gis')?.availability,'web-search');
 assert.equal(sources.find(s=>s.id==='qatar-qars-address-locator')?.availability,'public-api');
 assert.equal(sources.find(s=>s.id==='qatar-post-addressing')?.trustTier,'authoritative');
});
test('QA source receipts distinguish failed acquisitions, transport shells, complete content and data',()=>{
 assert.equal(report.references.length,25);assert.equal(report.references.filter((r:any)=>r.contentVerified).length,19);
 assert.equal(report.references.filter((r:any)=>r.status==='transport-only-not-data').length,4);
 for(const r of report.references.filter((r:any)=>r.contentVerified)){
   assert.equal(r.httpStatus,200);assert.equal(r.sourceDocumentDigest,r.responseDigest);assert.equal(r.sourceDataRecords,0);
   const ref=config.references.find((f:any)=>f.id===r.id);assert.equal(r.byteLength,ref.reviewed_bytes);assert.equal(r.responseDigest,ref.expected_digest);
 }
 assert.equal(byId('data-license-pdf').failureKind,'reference-byte-limit');
 assert.equal(byId('data-license-pdf-large').byteLength,10112684);
 assert.equal(byId('open-data').contentVerified,false);assert.equal(byId('open-data-www').transportBytesVerified,true);
 for(const k of ['currentAddressRowsValidated','postalAssignmentRowsValidated','productionGeometryRecords','explicitAddressBuildingRelations','publishedImmutableDataArtifacts','sourceRowDownloads','geocodeQueries','paidOperations','explicitContractAcceptances','newAccountsOrRepositories','rawSourceBodiesInGit'])assert.equal(report[k],0,k);
 assert.equal(report.countryM2Achieved,false);assert.equal(report.realAgidRuntimeVerified,false);
 assert.equal(report.addressDataQuality.missingnessRate,null);
});
test('QA measured road quality, census grain and QARS schemas do not become postal/building coverage',()=>{
 const q=report.streetQuality;assert.equal(q.featureCount,12645);assert.equal(q.streetMissingness.missing,285);assert.equal(q.dateMissingness.missing,12623);
 assert.equal(q.zoneMissingness.missing,0);assert.equal(q.dateRangeDoesNotEstablishWholeDatasetFreshness,true);
 const layer=byId('zones-streets-layer').profile;assert.equal(layer.geometryType,'esriGeometryPolyline');assert.equal(layer.spatialReference.wkid,2932);assert.equal(layer.relationshipCount,0);
 assert.equal(byId('qars-custom').profile.explicitCandidateIdentifierFields.length,3);assert.equal(byId('qars-compound').profile.explicitCandidateIdentifierFields.length,0);
 for(const id of ['qars-custom','qars-compound']){const p=byId(id).profile;assert.equal(p.hasGenericPostalField,true);assert.equal(p.candidateFieldIsAssignment,false);assert.equal(p.addressQueriesMade,0);}
 assert.deepEqual(report.catalogSearchCoverage,{address:3,zone:10,building:21,buildingPaginationComplete:true,exhaustiveNationalDatasetAbsenceClaim:false});
 const census=byId('catalog-building').profile.datasets.find((d:any)=>d.id==='completed-buildings-residential-and-residentialcommercial-by-municipality-in-2015-census');
 assert.equal(census.declaredRows,8);assert.equal(census.licenseUrl,'https://creativecommons.org/licenses/by/4.0/');assert.equal(census.catalogId,'NPC-OD-C0-00624');assert.equal(census.dataRowsRetrieved,0);
});
test('QA current C0 rights and historical product terms remain scoped, without denying known open licences',()=>{
 const p=byId('data-license-pdf-large').profile;assert.equal(p.printedEdition,'June 2026');assert.equal(p.approvedLicense,'CC-BY-4.0');assert.equal(p.commercialReuseWithAttribution,true);assert.equal(p.chapterTwoGuidanceDoesNotAmendCcBy,true);assert.equal(p.appliesToQarsOrStreetService,null);
 assert.deepEqual(p.visuallyReviewedPhysicalPages,[1,2,4,5,6,7]);assert.equal(p.visualReviewBoundByExactBytes,true);
 assert.equal(byId('data-license').profile.embeddedPageContentParsed,true);assert.equal(byId('data-terms').profile.doesNotOverrideDatasetSpecificCcByGrant,true);
 assert.equal(byId('cgis-prices').profile.currentPricesOrTermsConfirmed,false);assert.equal(byId('cgis-prices').profile.appliesToQarsOrStreetService,null);
});
test('QA ledger and manifest pin the report while retaining a seven-day blocker, not M2',()=>{
 const q=json('docs/postal-context-m2-rollout.json').countries.find((c:any)=>c.countryCode==='QA');
 assert.equal(q.status,'blocked');assert.equal(q.attempts,1);assert.equal(q.evidence,null);assert.deepEqual(q.m2Definition,config.m2_criterion);
 const digest='sha256:'+createHash('sha256').update(text(reportPath)).digest('hex');
 assert.equal(q.lastAttempt.reportDigest,digest);assert.equal(manifest.m2_review.source_report_digest,digest);
 assert.equal(Date.parse(q.blocker.retryAfter)-Date.parse(q.blocker.observedAt),7*86400000);
 assert.equal(q.blocker.requiresExplicitApproval,false);
});

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {classifyPostalSourceTrust,getOfficialPostalSourcesForCountry} from './officialPostalSourceCatalog';
import {normalizeMaldivesPostalCode} from './postalContextPackRuntime';
const json=(path:string)=>JSON.parse(readFileSync(new URL('../../'+path,import.meta.url),'utf8'));
const pack='data/postal_country_packs/mv/postal-context/';
test('MV preserves its existing target, all twelve blockers and explicit real-data completion gates',()=>{
 const m=json(pack+'repository-manifest.json'),c=json(pack+'m2-source-review.json');assert.equal(m.repository.country_code,'MV');assert.equal(m.promotion.current_stage,'M1_metadata');assert.equal(m.promotion.target_stage,'M2_source_attested');assert.equal(m.promotion.hard_blockers.length,12);assert.deepEqual(m.promotion.stages.find((s:{id:string})=>s.id==='M2_source_attested'),c.m2_criterion);assert.equal(m.promotion.data_completion_verified,false);
 for(const text of ['rights-cleared','five-character','leading zeroes','20XXX','FCODE','Dhivehi','immutable','actual MV AGID','House numbers','SHA-256','none'])assert.ok(c.m2_criterion.definition.includes(text));
});
test('MV five-digit normalization retains zeroes and rejects ambiguous UPU patterns or feature IDs',()=>{
 assert.equal(normalizeMaldivesPostalCode('０１２３４'),'01234');assert.equal(normalizeMaldivesPostalCode('٠١٢٣٤'),'01234');assert.equal(normalizeMaldivesPostalCode('۰۱۲۳۴'),'01234');for(const s of ['20XXX','01XXX','MV-01234','FCODE01234'])assert.equal(normalizeMaldivesPostalCode(s),null);
});
test('MV official publisher names and metadata URLs alone cannot upgrade address trust',()=>{
 const sources=getOfficialPostalSourcesForCountry('MV').filter(x=>x.countryCodes.includes('MV'));assert.equal(sources.length,9);
 for(const s of sources){assert.equal(s.validationReadiness,'metadata-only');for(const text of [s.label,s.url,...s.sourceNames])assert.notEqual(classifyPostalSourceTrust({countryCode:'MV',source:text}).strength,'strong',text);assert.notEqual(classifyPostalSourceTrust({countryCode:'MV',source:'official',url:s.url}).strength,'strong');}
});
test('MV source receipts separate six references, one shell and five access failures from M2 data',()=>{
 const r=json('reports/postal-context-m2/mv-source-review-2026-08-28.json');assert.equal(r.references.filter((x:{contentVerified:boolean})=>x.contentVerified).length,6);assert.equal(r.references.filter((x:{status:string})=>x.status==='html-shell-not-data-or-terms').length,1);assert.equal(r.references.filter((x:{status:string})=>x.status==='http-access-failed').length,5);assert.equal(r.currentAssignmentRowsValidated,0);assert.equal(r.productionGeometryRecords,0);assert.equal(r.publishedDataArtifacts,0);assert.equal(r.realAgidRuntimeVerified,false);assert.equal(r.countryM2Achieved,false);assert.equal(r.quality.assignmentCoverage,null);assert.equal(r.quality.fcodeUniqueness,null);assert.ok(r.references.every((x:{networkRequestsDuringVerification:number})=>x.networkRequestsDuringVerification===0));
});

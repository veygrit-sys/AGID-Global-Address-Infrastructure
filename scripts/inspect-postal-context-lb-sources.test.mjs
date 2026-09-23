import assert from 'node:assert/strict';
import {test} from 'node:test';
import {config,profileLebanonForm,profileLebanonReference,inspectLebanonSources,lebanonFailure,safeLebanonUrl} from './inspect-postal-context-lb-sources.mjs';
import {sourceDigest} from './lib/postal-context-source-probe.mjs';
const ref=id=>config.references.find(r=>r.id===id);
const profile=(data,r,mime='application/json')=>profileLebanonReference(Buffer.from(typeof data==='string'?data:JSON.stringify(data)),r,mime);
const review={controls:config.form_review.controls,dropdowns:[{id:'ddlProvince',count:1,digest:sourceDigest(JSON.stringify(['SYNTHETIC_REGION']))},{id:'ddlRegion',count:0,digest:sourceDigest('[]')}]};
const form=()=>review.controls.map(c=>`<input id="${c.id}" type="text"${c.maxlength===null?'':` maxlength="${c.maxlength}"`}${c.disabled?' disabled="disabled"':''} value="">`).join('')+'<div id="ctl00_cpPopup_ddlProvince_DropDown"><li>SYNTHETIC_REGION</li></div></div></div><div id="ctl00_cpPopup_ddlRegion_DropDown"></div></div></div><input type="hidden" value="SYNTHETIC_CLIENT_STATE">';
const layer=()=>({id:3,name:'District',type:'Feature Layer',geometryType:'esriGeometryPolygon',extent:{spatialReference:{wkid:102100,latestWkid:3857}},copyrightText:'',fields:[{name:'ID',type:'esriFieldTypeGUID',nullable:false},{name:'PCODE',type:'esriFieldTypeString',nullable:false},{name:'GOVERNORATE_ID',type:'esriFieldTypeGUID',nullable:false}]});

test('LB form inspection preserves schema grain without emitting labels, values or client state',()=>{
  const p=profileLebanonForm(form(),review);assert.equal(p.controls[1].disabled,true);assert.equal(p.controls[1].maxlength,40);assert.equal(p.dropdowns[1].nonemptyOptions,0);assert.equal(p.disabledAndEmptyDoNotProveAbsence,true);assert.equal(p.inputMaxlengthIsNotPostcodeLength,true);assert.equal(p.browserRuntimeVerified,false);assert.equal(p.formSubmissions,0);assert.equal(p.assignmentRows,0);assert.doesNotMatch(JSON.stringify(p),/SYNTHETIC_REGION|SYNTHETIC_CLIENT_STATE/);
});
test('LB form inspection rejects duplicate or missing controls, nonempty values and changed disabled state',()=>{
  assert.throws(()=>profileLebanonForm(form()+'<input id="cpPopup_txtPOBox">',review),/control-binding/);
  assert.throws(()=>profileLebanonForm(form().replace('cpPopup_txtPOBox','changed'),review),/control-binding/);
  assert.throws(()=>profileLebanonForm(form().replace('value=""','value="PRIVATE_VALUE"'),review),/nonempty-value/);
  assert.throws(()=>profileLebanonForm(form().replace('disabled="disabled"',''),review),/control-drift/);
  assert.throws(()=>profileLebanonForm(form().replace('value=""',"value='PRIVATE_VALUE'"),review),/nonempty-value/);
  assert.throws(()=>profileLebanonForm(form().replace('value=""','value=PRIVATE_VALUE'),review),/nonempty-value/);
});
test('LB dropdown duplicates, count and content changes cannot silently repair or merge administrative identities',()=>{
  assert.throws(()=>profileLebanonForm(form().replace('SYNTHETIC_REGION','ANOTHER_REGION'),review),/dropdown-drift/);
  assert.throws(()=>profileLebanonForm(form().replace('<li>SYNTHETIC_REGION</li>',''),review),/dropdown-count/);
  assert.throws(()=>profileLebanonForm(form()+'<div id="ctl00_cpPopup_ddlRegion_DropDown"></div></div></div>',review),/dropdown-binding/);
});
test('LB UPU binding distinguishes eight digits from ten formatted characters and preserves historical source ID',()=>{
  const r=ref('upu-lebanon-postcode-formats-2025');assert.deepEqual(r.numeric_digit_lengths,[4,8]);assert.deepEqual(r.formatted_character_lengths,[4,10]);assert.match(r.printed_edition,/August 2026/);assert.deepEqual(r.visually_reviewed_physical_pages,[2,6,7,9,12]);
  const b=Buffer.from('%PDF-SYNTHETIC'),synthetic={...r,byte_length:b.length,expected_digest:sourceDigest(b)};const p=profileLebanonReference(b,synthetic,'application/pdf');assert.equal(p.sourceDataRecords,0);assert.equal(p.profile.exampleRecordsPersisted,0);assert.equal(p.profile.visualReviewBoundByExactBytes,true);
  assert.throws(()=>profileLebanonReference(b,synthetic,'text/html'),/pdf-mime/);assert.throws(()=>profileLebanonReference(Buffer.from('%PDF-DIFFERENT'),synthetic,'application/pdf'),/content-drift/);
});
test('LB changed PDF bytes never inherit the earlier visual review',()=>{
  const r=ref('upu-lebanon-addressing');assert.equal(r.printed_edition,'08/2018');const b=Buffer.alloc(r.byte_length,32);b.write('%PDF-');assert.throws(()=>profileLebanonReference(b,r,'application/pdf'),/content-drift/);
});
test('LB administrative service metadata has no postal authority or permission from capabilities',()=>{
  const r=ref('moph-lebanon-administrative-zones'),d={serviceItemId:r.service_item_id,spatialReference:{wkid:102100,latestWkid:3857},layers:r.layer_ids.map(id=>({id,geometryType:'esriGeometryPolygon'})),copyrightText:'',capabilities:'Query,Create,Update,Delete'};const p=profile(d,r).profile;
  assert.equal(p.metadataCapabilitiesAreNotPermission,true);assert.equal(p.rightsInServiceVerified,false);assert.equal(p.featureRequestsMade,0);assert.throws(()=>profile({...d,serviceItemId:'other'},r),/service-binding/);assert.throws(()=>profile({...d,spatialReference:{wkid:4326,latestWkid:4326}},r),/crs-drift/);
});
test('LB administrative PCODE and nonnull GUID parent schema do not prove postal assignment or data quality',()=>{
  const r=ref('moph-lb-layer-3'),d=layer(),p=profile(d,r).profile;assert.equal(p.pcodeIsNotPostcode,true);assert.equal(p.nonNullableSchemaIsNotMissingRate,true);assert.equal(p.referentialIntegrityVerified,false);assert.equal(p.postalRelationVerified,false);assert.equal(p.parentField,'GOVERNORATE_ID');
  d.fields[1].type='esriFieldTypeInteger';assert.throws(()=>profile(d,r),/identifier-schema/);d.fields[1].type='esriFieldTypeString';d.fields.push(d.fields[0]);assert.throws(()=>profile(d,r),/duplicate-field/);
});
test('LB Atlas terms are item-specific, drift-bound and distinct from blank service copyright',()=>{
  const original=ref('lb-atlas-item'),r={...original,expected_license_digest:sourceDigest('SYNTHETIC TERMS'),expected_description_digest:sourceDigest('SYNTHETIC DESCRIPTION')},d={id:r.item_id,title:r.title,owner:r.owner,url:r.service_url,created:0,modified:1,licenseInfo:'<p>SYNTHETIC TERMS</p>',description:'SYNTHETIC DESCRIPTION'};
  const p=profile(d,r).profile;assert.equal(p.attributedInformationalSharingAdaptationTermsObserved,true);assert.equal(p.legalCadastralAuthoritativeBoundaryUseDisclaimed,true);assert.equal(p.countsAreMetadataNotQueriedFeatures,true);assert.equal(p.olderPcodeStandardsCaveat,true);assert.equal(p.postalRelationVerified,false);
  assert.throws(()=>profile({...d,licenseInfo:''},r),/content-drift/);assert.throws(()=>profile({...d,url:'https://example.invalid/'},r),/item-binding/);
});
test('LB HDX metadata dates and short advertised hashes never stand in for downloaded geometry SHA-256',()=>{
  const original=ref('lb-hdx-upstream'),resources=Array.from({length:4},(_,i)=>({id:'synthetic-'+i,name:'synthetic',format:'GeoJSON',url:'https://example.invalid/synthetic',last_modified:'2026-01-01',hash:'12345678',size:1})),r={...original,expected_notes_digest:sourceDigest('SYNTHETIC NOTES'),expected_resources_digest:sourceDigest(JSON.stringify(resources))},p={id:r.package_id,name:r.name,title:r.title,license_id:r.license_id,license_url:r.license_url,notes:'SYNTHETIC NOTES',resources,metadata_modified:'2026-08-14',version:null};
  const o=profile({success:true,result:p},r).profile;assert.equal(o.metadataModificationIsNotBoundaryDate,true);assert.equal(o.advertisedHashIsNotVerifiedSha256,true);assert.deepEqual(o.advertisedHashLengths,[8,8,8,8]);assert.equal(o.resourceDownloads,0);assert.equal(o.postalRelationVerified,false);assert.equal(o.versionField,null);
  assert.throws(()=>profile({success:true,result:{...p,license_id:'unknown'}},r),/hdx-binding/);assert.throws(()=>profile({success:true,result:{...p,notes:'changed'}},r),/content-drift/);
});
test('LB privacy section is exact content, not public redistribution or current legal proof',()=>{
  const r={...ref('libanpost-privacy-policy'),section_start:'SYNTHETIC START',section_end:'SYNTHETIC END',expected_section_digest:sourceDigest('SYNTHETIC START privacy')};const html='<title>'+r.title+'</title>SYNTHETIC START privacy SYNTHETIC END';const p=profile(html,r,'text/html').profile;assert.equal(p.processingOrPortabilityIsNotRedistributionPermission,true);assert.equal(p.currentLegalStatusVerified,false);assert.equal(p.documentVersion,null);assert.throws(()=>profile(html.replace('privacy','changed'),r,'text/html'),/content-drift/);
});
test('LB unavailable listing, HTML MIME and unreviewed documents fail to assert data or legal status',()=>{
  const r=ref('libanpost-po-box-page'),html='<title>'+r.title+'</title>'+r.markers[0];assert.equal(profile(html,r,'text/html').profile.unavailableListingDoesNotProveServiceAbsence,true);assert.throws(()=>profile(html,r,'application/json'),/html-mime/);assert.throws(()=>profile('<title>Wrong site</title>',r,'text/html'),/title-binding/);assert.equal(profile('unreviewed body',ref('dlrc-lebanon-cadastre'),'text/html').contentVerified,false);
});
test('LB reviewed license bytes establish reference conditions, never a postal dataset or accepted contract',()=>{
  const html='<title>Synthetic licence</title>',r={...ref('cc-by-igo-3'),title:'Synthetic licence',expected_digest:sourceDigest(html)},p=profile(html,r,'text/html');assert.equal(p.sourceDataRecords,0);assert.equal(p.profile.contractAcceptancePerformed,false);assert.equal(p.profile.doesNotSupplyPostalAssignmentOrPrivacyPermission,true);assert.throws(()=>profile(html+'changed',r,'text/html'),/content-drift/);
});
test('LB failures and URLs redact credentials, unknown query data and raw exception text',()=>{
  assert.equal(lebanonFailure(new Error('PRIVATE_VALUE')),'network-or-parser-error');assert.equal(lebanonFailure(new Error('lb-content-drift-requires-review')),'lb-content-drift-requires-review');const url=safeLebanonUrl('https://name:password@example.invalid/?f=pjson&id=PRIVATE_VALUE&token=SECRET#hidden');assert.doesNotMatch(url,/name|password|PRIVATE_VALUE|SECRET|hidden/);assert.match(url,/f=pjson/);
});
test('LB bounded HTTP errors and parser failures retain zero production counters and null quality rates',async()=>{
  let calls=0;const r=await inspectLebanonSources(async()=>{calls++;return new Response('<title>Wrong page</title>',{status:calls%2?200:403,headers:{'content-type':'text/html'}});},'synthetic-test');assert.equal(calls,16);assert.equal(r.references.length,16);assert.ok(r.references.every(r=>!r.contentVerified&&r.sourceDocumentDigest===null));assert.equal(r.countryM2Achieved,false);assert.equal(r.currentAssignmentRowsValidated,0);assert.equal(r.assignmentQuality.missingCodeRate,null);assert.equal(r.realAgidRuntimeVerified,false);assert.equal(r.formSubmissions,0);
});

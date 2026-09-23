import assert from 'node:assert/strict';
import {test} from 'node:test';
import {sourceDigest} from './lib/postal-context-source-probe.mjs';
import {config,profileSriLankaForm,profileSriLankaReference,inspectSriLankaSources,sriLankaFailure,safeSriLankaUrl} from './inspect-postal-context-lk-sources.mjs';

// Deliberately synthetic values, never evidence of Sri Lanka assignments.
const review={candidate_count:2,forms:[{name:'frm',placeholder:'--Select Post Office--'},{name:'frm2',placeholder:'--Select Post Code--'}]};
const form=(name,rows)=>`<form action="index.php" method="post" name="${name}"><select name="poid" id="wgtmsr"><option value="0">${review.forms.find(f=>f.name===name).placeholder}</option>${rows.map(([code,label])=>`<option value="${code}">${label}</option>`).join('')}</select></form>`;
const office=form('frm',[['00007','Synthetic Alpha'],['10009','Synthetic Beta']]);
const codes=form('frm2',[['10009','10009'],['00007','00007']]);
const html=office+codes;

test('LK form binding preserves leading zeros and joins sets, not selector positions',()=>{
  const p=profileSriLankaForm(html,review);
  assert.equal(p.codeSetsEqual,true);assert.equal(p.positionalCodeMismatches,2);
  assert.equal(p.forms[0].leadingZeroCodes,1);assert.equal(p.forms[1].leadingZeroCodes,1);
  assert.equal(p.forms[0].candidateOptions,2);assert.equal(p.forms[0].placeholderOptions,1);
  assert.equal(p.formScopedBinding,true);assert.equal(p.assignmentRowsValidated,0);
  assert.equal(p.nationalCoverageVerified,false);assert.equal(p.valuesPersisted,0);
  assert.doesNotMatch(JSON.stringify(p),/Synthetic Alpha|00007|10009/);
  assert.deepEqual(profileSriLankaForm(codes+office,review),p);
});
for(const [name,mutate,reason] of [
  ['missing form',s=>s.replace(codes,''),'lk-form-count'],
  ['duplicate form name',s=>s.replace('name="frm2"','name="frm"'),'lk-form-binding'],
  ['changed action',s=>s.replace('action="index.php"','action="other.php"'),'lk-form-action'],
  ['changed control',s=>s.replace('name="poid"','name="private"'),'lk-select-binding'],
  ['placeholder',s=>s.replace('value="0"','value="00000"'),'lk-placeholder'],
  ['leading zero loss',s=>s.replace('value="00007"','value="7"'),'lk-option-schema'],
  ['non digit',s=>s.replace('value="00007"','value="00A07"'),'lk-option-schema'],
  ['empty label',s=>s.replace('Synthetic Alpha',''),'lk-option-schema'],
  ['duplicate code',s=>s.replace('value="10009"','value="00007"'),'lk-duplicate-option'],
  ['different code sets',s=>s.replaceAll('10009','10008').replace('value="10008">Synthetic Beta','value="10009">Synthetic Beta'),'lk-code-set-mismatch'],
  ['code label differs',s=>s.replace('>10009<','>10008<'),'lk-option-schema'],
])test(`LK rejects ${name}`,()=>assert.throws(()=>profileSriLankaForm(mutate(html),review),new RegExp(reason)));

test('LK reviewed option digest does not silently accept new labels',()=>{
  const pinned=structuredClone(review);pinned.forms[0].options_digest=sourceDigest('not-the-reviewed-options');
  assert.throws(()=>profileSriLankaForm(html,pinned),/lk-content-drift/);
});

const layer={id:3,name:'Synthetic GN schema',type:'Feature Layer',geometryType:'esriGeometryPolygon',extent:{spatialReference:{wkid:4326,latestWkid:4326}},copyrightText:'',fields:[{name:'gnd_code',type:'esriFieldTypeInteger'},{name:'gnd_officer_name',type:'esriFieldTypeString',length:255},{name:'gnd_officer_phone',type:'esriFieldTypeString',length:50}]};
const profileLayer=d=>{const b=Buffer.from(JSON.stringify(d));return profileSriLankaReference(b,{kind:'arcgis-layer',layer_id:3,layer_name:'Synthetic GN schema',expected_digest:sourceDigest(b)},'text/plain');};
test('LK administrative schemas flag private field names without querying their values',()=>{
  const r=profileLayer(layer);assert.equal(r.sourceDataRecords,0);assert.equal(r.profile.postalRelationVerified,false);
  assert.deepEqual(r.profile.personalContactFieldNames,['gnd_officer_name','gnd_officer_phone']);
  assert.equal(r.profile.fieldCount,3);assert.equal(r.profile.nullableUnspecifiedFieldCount,3);
  assert.equal(r.profile.featureRequestsMade,0);assert.equal(r.profile.rightsInServiceVerified,false);
  assert.equal(r.profile.administrativeIdentifiersAreNotPostcodes,true);
});
test('LK fails on a feature response, even with an otherwise matching schema',()=>assert.throws(()=>profileLayer({...layer,features:[{attributes:{gnd_officer_name:'PRIVATE_CANARY'}}]}),/lk-not-metadata/));
test('LK rejects wrong CRS, geometry type, layer identity and duplicate fields',()=>{
  assert.throws(()=>profileLayer({...layer,extent:{spatialReference:{wkid:3857,latestWkid:3857}}}),/lk-crs/);
  assert.throws(()=>profileLayer({...layer,geometryType:'esriGeometryPoint'}),/lk-layer/);
  assert.throws(()=>profileLayer({...layer,id:11}),/lk-layer/);
  assert.throws(()=>profileLayer({...layer,fields:[layer.fields[0],layer.fields[0]]}),/lk-field-duplicate/);
});
test('LK unchanged title cannot substitute for reviewed bytes or MIME',()=>{
  const b=Buffer.from('<title>Expected</title>Unreviewed'),ref={kind:'reviewed-html',title:'Expected',expected_digest:sourceDigest('reviewed')};
  assert.throws(()=>profileSriLankaReference(b,ref,'text/html'),/lk-content-drift/);
  assert.throws(()=>profileSriLankaReference(b,{...ref,expected_digest:sourceDigest(b)},'text/plain'),/lk-html-mime/);
  assert.equal(profileSriLankaReference(b,{kind:'manual-reference'},'text/html').contentVerified,false);
});
test('LK ignores unrelated dynamic markup but rejects changed or ambiguous reviewed sections',()=>{
  const section='Start reviewed terms',ref={kind:'reviewed-section',title:'Expected',section_start:'Start',section_end:'End',expected_section_digest:sourceDigest(section)};
  const body=Buffer.from('<title>Expected</title><input value="dynamic"><p>Start reviewed terms</p><p>End</p>');
  const result=profileSriLankaReference(body,ref,'text/html');assert.equal(result.contentVerified,true);assert.equal(result.sourceDataRecords,0);
  assert.equal(profileSriLankaReference(Buffer.from(body.toString().replace('dynamic','changed')),ref,'text/html').profile.sectionDigest,result.profile.sectionDigest);
  assert.throws(()=>profileSriLankaReference(Buffer.from(body.toString().replace('reviewed terms','new terms')),ref,'text/html'),/lk-content-drift/);
  assert.throws(()=>profileSriLankaReference(Buffer.from(body.toString().replace('</p><p>End',' Start</p><p>End')),ref,'text/html'),/lk-section-binding/);
  assert.throws(()=>profileSriLankaReference(Buffer.from(body.toString().replace('Expected','Challenge')),ref,'text/html'),/lk-title-binding/);
});

test('LK errors and URLs cannot leak credentials or private query values',()=>{
  const u=safeSriLankaUrl('https://user:secret@gisapps.nsdi.gov.lk/example?f=pjson&token=PRIVATE&address=PRIVATE#PRIVATE');
  assert.doesNotMatch(u,/secret|PRIVATE|user/);assert.match(u,/f=pjson/);
  assert.equal(sriLankaFailure(new Error('PRIVATE_CANARY')),'network-or-parser-error');
  assert.equal(sriLankaFailure(new Error('curl-network-error')),'curl-network-error');
});
test('LK failed references remain zero-data and never promote M2',async()=>{
  const requested=[];
  const r=await inspectSriLankaSources(async(url,options)=>{requested.push(url);assert.equal(options.redirect,'manual');assert.equal(options.body,undefined);return new Response('PRIVATE_CANARY',{status:403});},'synthetic-test');
  assert.deepEqual(requested,config.references.map(ref=>ref.url));
  assert.ok(requested.every(url=>!url.includes('/query')&&!url.includes('outFields')));
  assert.ok(r.references.every(ref=>!ref.contentVerified&&ref.sourceDocumentDigest===null));
  assert.equal(r.countryM2Achieved,false);assert.equal(r.currentAssignmentRowsValidated,0);
  assert.equal(r.featureQueries,0);assert.equal(r.formSubmissions,0);assert.equal(r.assignmentQuality.nationalCoverage,null);
  assert.doesNotMatch(JSON.stringify(r),/PRIVATE_CANARY/);
});

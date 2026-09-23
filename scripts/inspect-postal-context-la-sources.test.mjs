import assert from 'node:assert/strict';
import test from 'node:test';
import {sourceDigest} from './lib/postal-context-source-probe.mjs';
import {config,laosPlain,laosFailure,safeLaosUrl,profileLaosDom,profileLaopedia,profileLaosReference,inspectLaosSources} from './inspect-postal-context-la-sources.mjs';
const encode=x=>Buffer.from(JSON.stringify(x)),a=config.operator_ui;
const capture=(rows=['09999 SYN_A','09999 SYN_B'])=>({schemaVersion:'postal-context-la-dom-capture/v1',overview:{url:a.url,observedAt:'2026-08-28T17:32:04.965Z',title:a.title,mainText:[a.heading,a.detail_heading,a.total_prefix+' 20 '+a.total_suffix,'SYN_REGION',a.total_prefix+' 30 '+a.total_suffix].join('\n'),rightsReserved:true},detail:{url:a.detail_url,observedAt:'2026-08-28T17:32:30.920Z',title:a.detail_title,heading:a.detail_heading,mainText:[a.detail_heading,...rows,a.load_more].join('\n'),paragraphs:rows,loadMorePresent:true}});
const layer=(r)=>({id:r.layer_id,name:r.layer_name,type:r.layer_type,geometryType:r.layer_type==='Group Layer'?null:'esriGeometryPolygon',fields:r.layer_type==='Group Layer'?null:[{name:'PCode'}],subLayers:r.layer_type==='Group Layer'?[{id:246},{id:247},{id:248}]:[],parentLayer:{id:245},extent:{spatialReference:{wkid:102100,latestWkid:3857}},copyrightText:''});
const wikiBody='<h2>SYN_REGION</h2><b>09997 - 09999</b><ul><li>ລະຫັດໄປສະນີ ເຂດ 1: 09997 (SYN_A, SYN_A</li><li>ລະຫັດໄປສະນີ ເຂດ 2: 09998</li></ul><h2>SYN_EMPTY</h2>';
const wiki=(r,body=wikiBody)=>'<title>'+r.title+'</title><script>{"wgRevisionId":'+r.revision+'}</script><div class="mw-parser-output">'+body+'<!-- NewPP limit report -->';
const legal=(r,section)=>'<title>'+r.title+'</title><main><a href="'+r.url+'">document</a>'+section+' '+r.section_end+'</main>';
const shell=r=>'<title>'+r.title+'</title><main><template data-error="BAILOUT_TO_CLIENT_SIDE_RENDERING"></template></main><footer>All Rights Reserved</footer>';
const html=s=>new Response(s,{headers:{'content-type':'text/html'}});

test('LA public regional totals are row counts, not unique postcodes or national coverage',()=>{
  const p=profileLaosDom(encode(capture()));assert.equal(p.advertisedRegionalRowSum,50);assert.equal(p.uniqueNationalPostcodes,null);assert.equal(p.sampleRows,2);assert.equal(p.uniqueObservedCodes,1);assert.equal(p.repeatedCodeRows,1);assert.equal(p.distinctObservedRowTexts,2);assert.equal(p.duplicateRowTextExcess,0);assert.equal(p.repeatedCodesAreNotDuplicateAssignments,true);assert.equal(p.leadingZeroRows,2);assert.equal(p.completeNationalSnapshot,false);assert.equal(p.rawHttpDataBytesVerified,false);assert.equal(p.countryM2Achieved,false);assert.doesNotMatch(JSON.stringify(p),/09999|SYN_A|SYN_B|SYN_REGION/);
});
test('LA sample diagnostics count invalid tokens and exact duplicate rows without repair or numeric coercion',()=>{
  const p=profileLaosDom(encode(capture(['09999 SYN_A','09999 SYN_A','9999 SYN_SHORT','unknown SYN_UNKNOWN'])));assert.equal(p.sampleRows,4);assert.equal(p.invalidCodeRows,2);assert.equal(p.invalidCodeRate,.5);assert.equal(p.duplicateRowTextExcess,1);assert.equal(p.zeroPaddingPerformed,0);assert.equal(p.sampleRowsDeduplicated,0);assert.equal(p.sourceCellsPersisted,0);
});
test('LA DOM binding rejects changed URLs, titles, heading, fields, times or unbound rows',()=>{
  for(const alter of [c=>c.overview.url+='?token=secret',c=>c.detail.url+='?page=2',c=>c.overview.title='wrong',c=>c.detail.title='wrong',c=>c.detail.heading='wrong',c=>c.detail.observedAt='2026-02-30T00:00:00.000Z',c=>c.detail.observedAt='2026-08-28T17:31:00.000Z',c=>c.detail.observedAt='2026-08-28T18:31:00.000Z',c=>c.overview.raw='private',c=>c.detail.paragraphs.push('09999 UNBOUND'),c=>c.detail.loadMorePresent=false,c=>c.detail.mainText=c.detail.mainText.replace(a.detail_heading,'unbound')]){const c=capture();alter(c);assert.throws(()=>profileLaosDom(encode(c)),/la-dom-/);}
});
test('LA DOM parser rejects malformed, oversized, inconsistent totals and duplicate regions',()=>{
  for(const b of [Buffer.alloc(0),Buffer.alloc(32769),Buffer.from([255]),Buffer.from('{}')])assert.throws(()=>profileLaosDom(b),/la-dom-/);
  for(const alter of [c=>c.overview.mainText=c.overview.mainText.replace('SYN_REGION',a.detail_heading),c=>c.overview.mainText=c.overview.mainText.replace(' 20 ',' 1 '),c=>c.overview.mainText=c.overview.mainText.replace(' 20 ',' 100001 '),c=>c.overview.mainText+='\nstray',c=>c.detail.paragraphs=[],c=>c.detail.paragraphs=Array(21).fill('09999 SYN_A'),c=>c.detail.paragraphs[0]='']){const c=capture();alter(c);assert.throws(()=>profileLaosDom(encode(c)),/la-dom-/);}
});
test('LA wiki reports unexpanded ranges, missing detail and unclosed duplicate village lists without repair',()=>{
  const r={...config.references.find(r=>r.kind==='wiki-article'),expected_article_digest:sourceDigest(laosPlain(wikiBody))},p=profileLaopedia(wiki(r),r);assert.equal(p.statedRangeCardinality,3);assert.equal(p.uniqueListedCodesWithinRange,2);assert.equal(p.explicitZoneRows,2);assert.equal(p.leadingZeroRows,2);assert.equal(p.headingsWithoutDetailLists,1);assert.equal(p.missingVillageDetailRate,.5);assert.equal(p.duplicateVillageTokenExcessWithinRows,1);assert.equal(p.unclosedVillageLists,1);assert.equal(p.rowsRepaired,0);assert.equal(p.rangeIsNotExpanded,true);assert.equal(p.currentAssignmentRowsValidated,0);assert.doesNotMatch(JSON.stringify(p),/0999|SYN_/);
});
test('LA wiki pins exact article and revision; changing footer does not change article identity',()=>{
  const r={...config.references.find(r=>r.kind==='wiki-article'),expected_article_digest:sourceDigest(laosPlain(wikiBody))};
  for(const footer of ['yesterday','today'])assert.equal(profileLaopedia(wiki(r)+'<footer>'+footer+'</footer>',r).articleDigest,r.expected_article_digest);
  for(const s of [wiki(r).replace('SYN_REGION','changed'),wiki(r).replace('"wgRevisionId":1784','"wgRevisionId":1785'),wiki(r).replace(r.title,'other'),wiki(r).replace('NewPP limit report','other'),wiki(r)+'<div class="mw-parser-output">duplicate'])assert.throws(()=>profileLaopedia(s,r),/la-wiki-/);
});
test('LA NFMS metadata is not features, an open licence or a PCode postal crosswalk',()=>{
  for(const r of config.references.filter(r=>r.kind==='arcgis-metadata')){const p=profileLaosReference(encode(layer(r)),r,'text/plain');assert.equal(p.contentVerified,true);assert.equal(p.sourceDataRecords,0);assert.equal(p.profile.postalRelationVerified,false);assert.equal(p.profile.rightsVerified,false);assert.equal(p.profile.featureRequestsMade,0);assert.equal(p.profile.productionGeometryRecords,0);assert.equal(p.profile.pcodeIsNotProofOfPostcode,true);assert.equal(p.profile.spatialReference.latestWkid,3857);}
});
test('LA NFMS layer identity, group shape, parent and projected CRS are bound',()=>{
  const group=config.references.find(r=>r.layer_id===245),child=config.references.find(r=>r.layer_id===247);
  for(const [r,alter] of [[group,d=>d.id=999],[group,d=>d.subLayers=[]],[group,d=>d.geometryType='esriGeometryPolygon'],[child,d=>d.name='Other'],[child,d=>d.parentLayer.id=246],[child,d=>d.geometryType='esriGeometryPoint'],[child,d=>d.extent.spatialReference.latestWkid=4326]]){const d=layer(r);alter(d);assert.throws(()=>profileLaosReference(encode(d),r,'application/json'),/la-layer-/);}
});
test('LA law requires bound section digest and does not assert current law, effective date or permission',()=>{
  const base=config.references.find(r=>r.kind==='legal-section'),section=base.section_start+' SYN normative scope',r={...base,expected_section_digest:sourceDigest(section)};
  for(const footer of ['2026','2027']){const p=profileLaosReference(Buffer.from(legal(r,section)+'<footer>'+footer+'</footer>'),r,'text/html');assert.equal(p.contentVerified,true);assert.equal(p.profile.currentLegalStatusVerified,false);assert.equal(p.profile.effectiveDate,null);assert.equal(p.profile.statuteIsNotDataOrRedistributionPermission,true);}
  assert.throws(()=>profileLaosReference(Buffer.from(legal(r,section+' changed')),r,'text/html'),/la-law-drift/);
  assert.throws(()=>profileLaosReference(Buffer.from(legal(r,section).replace(r.url,'other')),r,'text/html'),/la-law-binding/);
});
test('LA operator loading shell and manually reviewed sources cannot be promoted by HTTP success',()=>{
  const r=config.references[0],p=profileLaosReference(Buffer.from(shell(r)),r,'text/html');assert.equal(p.contentVerified,false);assert.equal(p.profile.initialMainTextEmpty,true);assert.equal(p.profile.emptyHtmlDoesNotMeanDataAbsent,true);
  for(const ref of config.references.filter(r=>r.kind.startsWith('manual-')))assert.equal(profileLaosReference(Buffer.from('any'),ref,'application/pdf').contentVerified,false);
  const ref=config.references.find(r=>r.kind==='reference');assert.equal(profileLaosReference(Buffer.from('<footer>'+ref.markers.join(' ')+'</footer>'),ref,'text/html').contentVerified,false);
});
test('LA diagnostic errors and unknown query parameters do not leak private text',()=>{
  assert.equal(laosFailure(Error('private secret')),'network-or-parser-error');assert.equal(laosFailure(Error('curl-timeout')),'curl-timeout');assert.doesNotMatch(safeLaosUrl('https://a:secret@laopedia.gov.la/x?token=secret&query=private#private'),/secret|private/);assert.match(safeLaosUrl('https://laopedia.gov.la/x?oldid=1784'),/oldid=1784/);assert.equal(laosPlain('<b>x</b>&nbsp;&quot;y&quot;'),'x "y"');
});
test('LA bounded probe separates response digests from source verification and all data promotion',async()=>{
  const fake=async url=>{const r=config.references.find(r=>r.url===url);if(r.kind==='operator-shell')return html(shell(r));if(r.kind==='arcgis-metadata')return new Response(encode(layer(r)),{headers:{'content-type':'application/json'}});if(r.kind.startsWith('manual-'))throw Error('private secret');if(r.kind==='reference')return html(r.markers.join(' '));if(r.kind==='wiki-article')return html(wiki(r));return html(legal(r,r.section_start+'changed'));};
  const p=await inspectLaosSources(fake,'synthetic-test',encode(capture()));assert.equal(p.references.length,11);assert.equal(p.references.filter(r=>r.contentVerified).length,5);assert.equal(p.currentAndLinkedWikiRevisionMatch,false);const failed=p.references.find(r=>r.failureKind==='la-wiki-article-drift-requires-review');assert.equal(failed.httpStatus,200);assert.match(failed.responseDigest,/^sha256:/);assert.equal(failed.sourceDocumentDigest,null);assert.equal(p.countryM2Achieved,false);assert.equal(p.realAgidRuntimeVerified,false);assert.equal(p.assignmentQuality.duplicateAssignmentRate,null);assert.equal(p.authenticatedRequests,0);assert.doesNotMatch(JSON.stringify(p),/private secret|SYN_A/);
});
test('LA HTTP error receipts remain failures, not an empty licensed dataset',async()=>{
  const p=await inspectLaosSources(async()=>new Response('no',{status:503}),'synthetic-test');assert.equal(p.operatorObservation,null);assert.equal(p.references.length,11);assert.ok(p.references.every(r=>r.status==='http-error'&&!r.contentVerified&&r.sourceDocumentDigest===null));assert.equal(p.sourceRowsPersisted,0);assert.equal(p.countryM2Achieved,false);
});

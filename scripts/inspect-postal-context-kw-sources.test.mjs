import assert from 'node:assert/strict';
import test from 'node:test';
import {config,profileKuwaitObservations,profileKuwaitReference,inspectKuwaitSources,kuwaitPlain,safeKuwaitSourceUrl,kuwaitFailure} from './inspect-postal-context-kw-sources.mjs';

const encode=o=>Buffer.from(JSON.stringify(o));
const captures=()=>({schemaVersion:'postal-context-kw-dom-capture/v1',captures:[0,1].map(i=>({
  url:config.references[0].url,observedAt:`2026-08-28T16:2${i}:00.000Z`,capture:i?'last-page-both-tables':'first-page-both-tables',
  tables:config.tables.map((spec,j)=>{
    const total=j?26:22,rows=Array.from({length:i?(total%10):10},(_,k)=>['SYN_GOV','SYN_AREA',String(i?20+k:k+1),...(j?[]:[String(i?40+k:k+21)]),i?'9876':String(1000+k).padStart(5,'0')]);
    return {heading:spec.heading,header:spec.header,rows,containerText:spec.header.join('\t')+'\n'+rows.map(r=>r.join('\t')).join('\n')+`\n${total} Total`,buttons:[{text:'',disabled:!i},{text:'1',disabled:false},{text:'3',disabled:false},{text:'',disabled:!!i}]};
  })
}))});
const recapture=c=>{for(const s of c.captures)for(const t of s.tables)t.containerText=t.header.join('\t')+'\n'+t.rows.map(r=>r.join('\t')).join('\n')+'\n'+t.containerText.match(/\d+ Total$/)[0];return c;};
const skeleton=()=>'<main>'+config.tables.map(t=>'<table><thead><tr><th>'+t.heading+'</th></tr><tr>'+t.header.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody><tr><td colspan="6"></td></tr></tbody></table>').join('')+'</main><footer><a href="/en/under-development">Privacy &amp; Policy</a>All rights reserved.</footer>';
const html=s=>new Response(s,{headers:{'content-type':'text/html'}});

test('KW first/last observations retain class, scope, invalid lengths and unknown national quality',()=>{
  const q=profileKuwaitObservations(encode(captures()));assert.equal(q.totalSampleRows,28);assert.equal(q.totalInvalidCodes,8);
  assert.deepEqual(q.tables.map(t=>t.sampleRows),[12,16]);assert.deepEqual(q.tables.map(t=>t.sampleRates.invalidCode),[2/12,6/16]);
  assert.deepEqual(q.tables[0].invalidObservations.map(x=>x.ordinal),[21,22]);assert.equal(q.tables[0].comparablePoboxRanges,12);assert.equal(q.tables[1].sampleRates.invertedPoboxRange,null);
  assert.ok(q.tables.every(t=>t.zeroPaddingPerformed===0&&!t.productionEligible&&t.coordinateGeometry==='none'));assert.equal(q.nationalQuality.invalidCodeRate,null);assert.equal(q.countryM2Achieved,false);assert.equal(q.rawHttpDataBytesVerified,false);assert.equal(q.immutableDataArtifact,false);
  assert.doesNotMatch(JSON.stringify(q),/SYN_GOV|SYN_AREA|9876|01000/);
});
test('KW missing cells, duplicates and inverted ranges have sample-specific denominators only',()=>{
  const c=captures(),r=c.captures[0].tables[0].rows;r[0][0]='';r[0][2]='99';r[0][3]='1';r[1]=[...r[0]];r[2][3]='';
  const q=profileKuwaitObservations(encode(recapture(c))).tables[0];assert.equal(q.exactDuplicateExcess,1);assert.equal(q.missingByColumn[0].count,2);assert.equal(q.comparablePoboxRanges,11);assert.equal(q.invertedPoboxRanges,2);assert.equal(q.sampleRates.invertedPoboxRange,2/11);assert.equal(q.rowsDeduplicated,0);
});
test('KW untrusted DOM input rejects URL, shape, extra fields, numeric codes and table/class drift',()=>{
  for(const alter of [c=>c.captures[0].url+='&token=secret',c=>c.captures[0].person='secret',c=>c.captures[0].tables.reverse(),c=>c.captures[0].tables[0].rows[0][4]=12345,c=>c.captures[0].tables[0].rows[0].push('extra'),c=>c.captures[0].tables[0].rows[0][0]='x\ty']){
    const c=captures();alter(c);assert.throws(()=>profileKuwaitObservations(encode(c)),/kw-dom-/);
  }
});
test('KW only consistent first/last public pagination is profiled; labels are not full coverage',()=>{
  for(const alter of [c=>c.captures[1].observedAt=c.captures[0].observedAt,c=>c.captures[1].capture='first-page-both-tables',c=>c.captures[0].tables[0].buttons[0].disabled=false,c=>c.captures[1].tables[0].buttons.at(-1).disabled=false,c=>c.captures[1].tables[0].containerText=c.captures[1].tables[0].containerText.replace('22 Total','32 Total'),c=>c.captures[0].tables[0].rows.pop(),c=>c.captures[0].tables[0].containerText='22 Total']){
    const c=captures();alter(c);assert.throws(()=>profileKuwaitObservations(encode(c)),/kw-dom-/);
  }
});
test('KW malformed encoding, bytes, JSON and oversized advertised totals fail closed',()=>{
  for(const b of [Buffer.alloc(0),Buffer.alloc(131073),Buffer.from([255]),Buffer.from('{}')])assert.throws(()=>profileKuwaitObservations(b),/kw-dom-/);
  const c=captures();c.captures[0].tables[0].containerText=c.captures[0].tables[0].containerText.replace('22 Total','100001 Total');assert.throws(()=>profileKuwaitObservations(encode(c)),/kw-dom-pagination/);
});
test('KW empty loading skeletons are not data rows and do not mean empty official tables',()=>{
  const p=profileKuwaitReference(Buffer.from(skeleton()),config.references[0],'text/html');assert.equal(p.contentVerified,true);assert.equal(p.sourceDataRecords,0);
  assert.ok(p.profile.tables.every(t=>t.initialHtmlDataRows===0&&t.initialHtmlPlaceholderRows===1));assert.equal(p.profile.emptyInitialHtmlDoesNotMeanEmptyDataset,true);assert.equal(p.profile.privacyPolicyPlaceholderLink,true);assert.equal(p.profile.rightsReservedFooter,true);
});
test('KW table drift or hidden script-only metadata cannot verify the reference',()=>{
  for(const s of [skeleton().replace('From P.O. Box','Changed'),'<script>'+skeleton()+'</script>',skeleton()+skeleton()])assert.throws(()=>profileKuwaitReference(Buffer.from(s),config.references[0],'text/html'),/kw-table-header-binding/);
  const ref=config.references.find(r=>r.id==='paci-kuwait-building-register');
  for(const tag of ['script','nav','header','footer'])assert.equal(profileKuwaitReference(Buffer.from(`<${tag}>${ref.markers.join(' ')}</${tag}>`),ref,'text/html').contentVerified,false);
});
test('KW changed PDF bytes require new visual review, not a copied edition assertion',()=>{
  const ref=config.references.find(r=>r.kind==='reviewed-pdf');assert.throws(()=>profileKuwaitReference(Buffer.from('%PDF-fake'),ref,'application/pdf'),/kw-pdf-digest-drift/);assert.throws(()=>profileKuwaitReference(Buffer.from('html'),ref,'application/pdf'),/kw-pdf-format/);assert.equal(ref.printed_edition,'07/2002');assert.deepEqual(ref.visually_reviewed_pages,[1]);
});
test('KW Arabic numeric entities decode without throwing on invalid Unicode or treating tags as words',()=>{
  assert.equal(kuwaitPlain('&#x627;&#160;&#1576;'),'ا ب');assert.equal(kuwaitPlain('&#x110000; &#55296;'),'� �');assert.equal(kuwaitPlain('<script data-text="secret">plain</script>'),'plain');
  const ref=config.references.find(r=>r.id==='paci-kuwait-building-register'),s=ref.markers.join(' ').replace(/[^\x00-\x7f]/gu,c=>'&#'+c.codePointAt(0)+';');assert.equal(profileKuwaitReference(Buffer.from(s),ref,'text/html').contentVerified,true);
});
test('KW errors and URL query receipts redact arbitrary sensitive contents',()=>{
  assert.equal(kuwaitFailure(Error('secret')),'network-or-parser-error');assert.equal(kuwaitFailure(Error('curl-network-error')),'curl-network-error');assert.doesNotMatch(safeKuwaitSourceUrl('https://a:secret@www.moc.gov.kw/en/?tab=2&token=secret#secret'),/secret/);
});
test('KW source probe remains non-production even when every metadata marker is present',async()=>{
  const fake=async url=>{const r=config.references.find(r=>r.url===url);if(r.kind==='postal-tables')return html(skeleton());if(r.kind==='reviewed-pdf')return new Response('%PDF-fake',{headers:{'content-type':'application/pdf'}});if(r.kind==='manual-metadata-review')throw Error('private-error');return html(r.markers.join(' '));};
  const q=await inspectKuwaitSources(fake,'synthetic-test',encode(captures()));assert.equal(q.references.length,8);assert.equal(q.references.filter(r=>r.contentVerified).length,6);assert.equal(q.references.find(r=>r.id==='upu-kuwait-addressing').httpStatus,200);assert.match(q.references.find(r=>r.id==='upu-kuwait-addressing').responseDigest,/^sha256:/);assert.equal(q.references.find(r=>r.id==='upu-kuwait-addressing').sourceDocumentDigest,null);assert.equal(q.countryM2Achieved,false);assert.equal(q.currentAssignmentRowsValidated,0);assert.equal(q.assignmentQuality.missingCodeRate,null);assert.equal(q.paidOperations,0);assert.equal(q.publishedDataArtifacts,0);assert.doesNotMatch(JSON.stringify(q),/private-error|SYN_GOV|SYN_AREA/);
});
test('KW failed HTTP and unexpected municipality metadata never acquire a verified data digest',async()=>{
  const q=await inspectKuwaitSources(async url=>url.includes('/layers')?html('unreviewed'):new Response('unavailable',{status:503}),'synthetic-test');assert.equal(q.references.filter(r=>r.status==='http-error').length,7);assert.ok(q.references.every(r=>!r.contentVerified&&r.sourceDocumentDigest===null));assert.equal(q.uiObservations,null);
});

import assert from 'node:assert/strict';
import {test} from 'node:test';
import {sourceDigest} from './lib/postal-context-source-probe.mjs';
import {config,decodeMacaoHtml,profileMacaoNoPostcode,profileMacaoAuthority,profileMacaoReproduction,profileMacaoReference,inspectMacaoObservations,inspectMacaoSources} from './inspect-postal-context-mo-sources.mjs';
const faq=(text,start=17)=>`<ol start="${start}"><li>${text}</li></ol>`;
const policy='postcode of Macao; not adopted in Macao; 000000; format requirements';
const html=body=>`<html><head><meta charset="utf-8"><title>Synthetic</title></head><body>${body}</body></html>`;
const ref=(s,extra={})=>({id:'ctt-macao-no-postcode-en',kind:'reviewed-html',encoding:'utf-8',title:'Synthetic',reviewed_digest:sourceDigest(s),reviewed_bytes:Buffer.byteLength(s),...extra});
test('MO no-postcode policy keeps form sentinel separate from postal assignment',()=>{
  const p=profileMacaoNoPostcode(faq(policy),'en');assert.equal(p.postalCode,null);assert.equal(p.officialPostalGeometry,'none');assert.equal(p.formPlaceholder,'000000');assert.equal(p.placeholderIsAssignment,false);assert.equal(p.sourceRecords,0);
});
test('MO FAQ binding rejects missing, duplicated, wrong-language or changed policy',()=>{
  for(const s of [faq(policy,18),faq(policy)+faq(policy),faq(policy.replace('not adopted','adopted')),faq(policy.replace('000000','123456'))])assert.throws(()=>profileMacaoNoPostcode(s,'en'),/binding/);
  assert.throws(()=>profileMacaoNoPostcode(faq(policy),'zh'),/binding/);
});
test('MO Portuguese entities remain readable and language-specific policy is checked',()=>{
  const p=profileMacaoNoPostcode(faq('c&oacute;digo postal de Macau; n&atilde;o utiliza um sistema de c&oacute;digo postal; requisitos de formato; 000000'),'pt');assert.equal(p.language,'pt');assert.equal(p.postalCode,null);
  assert.equal(profileMacaoNoPostcode(faq('澳門的郵政編碼; 澳門未使用郵政編碼系統; 格式要求; 000000'),'zh').postalCode,null);
});
test('MO Big5 decoding is explicit; HTTP and HTML declarations must agree',()=>{
  const b=Buffer.concat([Buffer.from('<html><head><meta charset=big5></head><body>'),Buffer.from([0xa4,0xa4,0xa4,0xe5]),Buffer.from('</body></html>')]);assert.ok(decodeMacaoHtml(b,'big5').includes('中文'));
  assert.throws(()=>decodeMacaoHtml(b,'utf-8'),/encoded|encoding/i);assert.throws(()=>decodeMacaoHtml(b,'big5','text/html; charset=utf-8'),/binding/);assert.throws(()=>decodeMacaoHtml(b,'latin1'),/unsupported/);
  assert.ok(decodeMacaoHtml(Buffer.from('<head><title>HTTP declares charset</title></head>'),'utf-8','text/html; charset=utf-8'));
});
test('MO current authority and legal effective date are separate from reuse permission',()=>{
  const p=profileMacaoAuthority('第16/2026號行政法規 第二十五條 第二十八條 地圖繪製暨地籍局 門牌號碼編訂 第三十條 二零二六年六月一日起生效');assert.equal(p.effectiveDate,'2026-06-01');assert.equal(p.authorityTransitionIsDataLicence,false);assert.equal(p.legacySourceIdsPreserved,true);
  assert.throws(()=>profileMacaoAuthority('第16/2026號行政法規'),/binding/);
});
test('MO mapping reproduction clause requires permission; never accepts a contract',()=>{
  const s='第102/2026號行政長官批示 五、刊登或發佈產品複製權 土地工務局批准 訂定收費 六、其他 七、二零二六年六月一日起生效';const p=profileMacaoReproduction(s);assert.equal(p.mappingReproductionPermissionRequired,true);assert.equal(p.possibleFees,true);assert.equal(p.permissionObtained,false);assert.equal(p.contractAccepted,false);
  assert.throws(()=>profileMacaoReproduction(s+s),/binding/);assert.throws(()=>profileMacaoReproduction(s.replace('批准','參考')),/binding/);
});
test('MO matching HTTP 200 shell bytes do not verify a policy or licence body',()=>{
  const s=html('JavaScript Required.');const p=profileMacaoReference(Buffer.from(s),ref(s,{id:'macao-data-terms',kind:'unresolved-html-shell'}),'text/html');assert.equal(p.transportBytesVerified,true);assert.equal(p.contentVerified,false);assert.equal(p.profile.rightsBodyVerified,false);assert.equal(p.profile.sourceEdition,null);
});
test('MO exact byte/MIME/title checks fail closed on changed content',()=>{
  const s=html(faq(policy));assert.equal(profileMacaoReference(Buffer.from(s),ref(s),'text/html').contentVerified,true);
  assert.throws(()=>profileMacaoReference(Buffer.from(s+' '),ref(s),'text/html'),/drift/);assert.throws(()=>profileMacaoReference(Buffer.from(s),ref(s),'application/json'),/mime/);
  const changed=s.replace('</title>','</title><title>Extra</title>');assert.throws(()=>profileMacaoReference(Buffer.from(changed),ref(changed),'text/html'),/title/);
});
test('MO response limit and unreviewed references cannot manufacture evidence',()=>{
  assert.throws(()=>profileMacaoReference(Buffer.alloc(4194305),{},'text/html'),/byte-limit/);assert.equal(profileMacaoReference(Buffer.from('manual'),{kind:'manual-reference'},'text/html').contentVerified,false);
});
test('MO observation set, identity and fake success/failure are rejected',()=>{
  assert.throws(()=>inspectMacaoObservations([]),/set/);
  const o=config.references.map(r=>({id:r.id,requestedUrl:r.url,observedAt:'2026-08-28T20:00:09.204Z',failure:'curl-network-error'}));assert.throws(()=>inspectMacaoObservations(o),/failure/);o[0].requestedUrl='https://example.com/';assert.throws(()=>inspectMacaoObservations(o),/binding/);
});
test('MO public reference checks do not query features, send credentials or promote data',async()=>{
  let calls=0;const r=await inspectMacaoSources(async(url,o)=>{calls++;assert.ok(config.references.some(x=>x.url===url));assert.equal(o.body,undefined);assert.equal(o.headers,undefined);assert.equal(o.method,undefined);assert.equal(o.redirect,'manual');return new Response('unavailable',{status:503});});assert.equal(calls,13);assert.equal(r.countryM2Achieved,false);assert.equal(r.currentAddressRowsValidated,0);assert.equal(r.quality.addressMissingnessRate,null);assert.equal(r.quality.postalCodeMissingness,'not-applicable-no-postcode-system');
});
test('MO rejects HTTPS downgrade and unapproved redirects; redacts upstream errors',async()=>{
  let n=0;const r=await inspectMacaoSources(async()=>{n++;return new Response(null,{status:302,headers:{location:'http://www.dscc.gov.mo/redirect/redirect.html'}});});assert.equal(n,13);assert.ok(r.references.every(x=>x.failureKind==='unapproved-reference-host'));
  const e=await inspectMacaoSources(async()=>{throw Error('token=should-not-appear');});assert.ok(!JSON.stringify(e).includes('should-not-appear'));
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPostalCurlFetcher } from './postal-context-curl-fetch.mjs';
import { fetchBoundedOfficialResponse } from './postal-context-source-probe.mjs';
const url = 'https://bdpost.gov.bd/example', hosts = new Set(['bdpost.gov.bd']);
const wire = text => ({stdout:Buffer.from(text)});
test('curl transport keeps TLS verification, disables curlrc and never follows redirects automatically', async () => {
  let invocation;
  const fetcher = createPostalCurlFetcher('/trusted/curl', hosts, async (...args) => { invocation=args; return wire('HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Length: 2\r\n\r\nok'); });
  const result = await fetchBoundedOfficialResponse(url,{allowedHosts:hosts,fetcher});
  assert.equal(result.bytes.toString(),'ok');
  assert.equal(invocation[1][0],'--disable');
  assert.deepEqual(invocation[1].slice(-2),['--url',url]);
  for(const flag of ['--insecure','-k','--location','-L','--netrc','--user','--proxy-insecure']) assert.ok(!invocation[1].includes(flag));
  assert.equal(invocation[2].windowsHide,true);
  assert.equal(invocation[2].timeout,25000);
});
test('curl transport rejects off-host or authenticated requests before executing anything', async () => {
  let calls=0; const fetcher=createPostalCurlFetcher('/trusted/curl',hosts,async()=>{calls++;});
  for(const bad of ['http://bdpost.gov.bd/','https://unapproved.invalid/','https://name:secret@bdpost.gov.bd/','https://bdpost.gov.bd:444/']) await assert.rejects(()=>fetcher(bad,{redirect:'manual'}),/unapproved-reference-host/);
  await assert.rejects(()=>fetcher(url,{redirect:'manual',method:'POST',body:'secret'}),/unsupported-curl-request/);
  await assert.rejects(()=>fetcher(url,{redirect:'manual',headers:{authorization:'secret'}}),/unsupported-curl-request/);
  assert.equal(calls,0);
});
test('curl off-host redirects remain subject to the common allowlist', async () => {
  let calls=0;
  const fetcher=createPostalCurlFetcher('/trusted/curl',hosts,async()=>{calls++;return wire('HTTP/1.1 302 Found\r\nLocation: https://unapproved.invalid/\r\n\r\n');});
  await assert.rejects(()=>fetchBoundedOfficialResponse(url,{allowedHosts:hosts,fetcher}),/unapproved-reference-host/);
  assert.equal(calls,1);
});
test('curl errors are bounded and sanitized, never return private stderr or certificate bypass', async () => {
  for(const [code,expected] of [[60,'curl-tls-verification-failed'],[28,'curl-timeout'],[63,'reference-byte-limit'],['ERR_CHILD_PROCESS_STDIO_MAXBUFFER','reference-byte-limit'],[7,'curl-network-error']]){
    const fetcher=createPostalCurlFetcher('/trusted/curl',hosts,async()=>{const error=new Error('PRIVATE error');error.code=code;error.stderr='PRIVATE body';throw error;});
    await assert.rejects(()=>fetcher(url,{redirect:'manual'}),error=>error.message===expected&&!JSON.stringify(error).includes('PRIVATE'));
  }
});
test('curl malformed response, oversized body and duplicate critical headers fail closed', async () => {
  for(const text of ['not HTTP','HTTP/1.1 100 Continue\r\n\r\n','HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nContent-Type: text/plain\r\n\r\nx']){
    const fetcher=createPostalCurlFetcher('/trusted/curl',hosts,async()=>wire(text));
    await assert.rejects(()=>fetcher(url,{redirect:'manual'}),/curl-invalid-response/);
  }
  const fetcher=createPostalCurlFetcher('/trusted/curl',hosts,async()=>wire('HTTP/1.1 200 OK\r\n\r\n'+'x'.repeat(4194305)));
  await assert.rejects(()=>fetcher(url,{redirect:'manual'}),/reference-byte-limit/);
});

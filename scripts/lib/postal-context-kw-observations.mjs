import {readFileSync} from 'node:fs';
import {sourceDigest} from './postal-context-source-probe.mjs';

export const config=JSON.parse(readFileSync(new URL('../../data/postal_country_packs/kw/postal-context/m2-source-review.json',import.meta.url)));
const keys=(o,expected)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join('|')===[...expected].sort().join('|');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const cell=s=>typeof s==='string'&&s.length<=200&&!/[\x00-\x1f\x7f]/u.test(s);
const instant=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s)&&Number.isFinite(Date.parse(s));

// Input is an ordinary public-browser DOM observation, NOT a signed HTTP data
// artifact. Raw cells remain transient; output contains counts and ordinals only.
export function profileKuwaitObservations(bytes) {
  if(!bytes.length||bytes.length>config.limits.max_dom_capture_bytes)throw Error('kw-dom-byte-limit');
  let input;try{input=JSON.parse(new TextDecoder('utf8',{fatal:true}).decode(bytes));}catch{throw Error('kw-dom-json');}
  if(!keys(input,['schemaVersion','captures'])||input.schemaVersion!=='postal-context-kw-dom-capture/v1'||!Array.isArray(input.captures)||input.captures.length!==2)throw Error('kw-dom-schema');
  const totalRows=[],labels=['first-page-both-tables','last-page-both-tables'];
  for(const [i,c] of input.captures.entries()) {
    if(!keys(c,['url','observedAt','capture','tables'])||c.url!==config.references[0].url||c.capture!==labels[i]||!instant(c.observedAt)||!Array.isArray(c.tables)||c.tables.length!==2)throw Error('kw-dom-capture');
    const totals=[];
    for(const [j,t] of c.tables.entries()) {
      const spec=config.tables[j];
      if(!keys(t,['heading','header','rows','containerText','buttons'])||t.heading!==spec.heading||!same(t.header,spec.header)||!Array.isArray(t.rows)||!t.rows.length||t.rows.length>10||t.rows.some(r=>!Array.isArray(r)||r.length!==spec.header.length||r.some(s=>!cell(s))))throw Error('kw-dom-table-shape');
      if(typeof t.containerText!=='string'||t.containerText.length>12000)throw Error('kw-dom-pagination');
      const match=t.containerText.match(/(?:^|\n)(\d+) Total\s*$/u),total=Number(match?.[1]);
      if(!Number.isSafeInteger(total)||total<=20||total>config.limits.max_advertised_rows)throw Error('kw-dom-pagination');
      const finalPage=Math.ceil(total/10),expectedRows=i===0?10:(total%10||10),buttons=t.buttons;
      if(!Array.isArray(buttons)||buttons.length<4||buttons.length>16||buttons.some(b=>!keys(b,['text','disabled'])||typeof b.disabled!=='boolean'||typeof b.text!=='string'||!/^\d{0,6}$/.test(b.text))||buttons[0].text!==''||buttons.at(-1).text!==''||buttons[0].disabled!==(i===0)||buttons.at(-1).disabled!==(i===1)||!buttons.some(b=>b.text==='1')||!buttons.some(b=>b.text===String(finalPage))||t.rows.length!==expectedRows)throw Error('kw-dom-pagination');
      // Bind captured cells to the visible table text without publishing them.
      const compact=s=>s.replace(/\s+/gu,' ').trim(),text=compact(t.containerText);
      if(!text.includes(compact(t.header.join(' ')))||t.rows.some(r=>!text.includes(compact(r.join(' ')))))throw Error('kw-dom-row-binding');
      totals.push(total);
    }
    totalRows.push(totals);
  }
  if(!same(totalRows[0],totalRows[1])||Date.parse(input.captures[0].observedAt)>=Date.parse(input.captures[1].observedAt))throw Error('kw-dom-snapshot-mismatch');
  const tables=config.tables.map((spec,j)=>{
    const total=totalRows[0][j],first=input.captures[0].tables[j].rows,last=input.captures[1].tables[j].rows;
    const samples=[...first.map((r,i)=>({r,ordinal:i+1})),...last.map((r,i)=>({r,ordinal:total-last.length+i+1}))];
    const invalid=samples.filter(({r})=>!/^\d{5}$/.test(r.at(-1))),missing=spec.header.map((column,i)=>({column,count:samples.filter(({r})=>r[i].trim()==='').length}));
    const comparable=spec.assignment_class==='po_box'?samples.filter(({r})=>/^\d{1,9}$/.test(r[2])&&/^\d{1,9}$/.test(r[3])):[];
    const inverted=comparable.filter(({r})=>Number(r[2])>Number(r[3])).length;
    const duplicateExcess=samples.length-new Set(samples.map(({r})=>JSON.stringify(r))).size;
    return {assignmentClass:spec.assignment_class,grain:spec.grain,advertisedTotal:total,advertisedTotalIsNotValidatedCoverage:true,
      observedPages:[1,Math.ceil(total/10)],sampleRows:samples.length,invalidFiveDigitCodes:invalid.length,
      invalidObservations:invalid.map(({r,ordinal})=>({ordinal,codeLength:r.at(-1).length,reason:'not-five-ascii-digits'})),
      missingByColumn:missing.map(m=>({...m,rate:m.count/samples.length})),exactDuplicateExcess:duplicateExcess,
      comparablePoboxRanges:comparable.length,invertedPoboxRanges:inverted,
      sampleRates:{invalidCode:invalid.length/samples.length,exactDuplicateExcess:duplicateExcess/samples.length,invertedPoboxRange:comparable.length?inverted/comparable.length:null},
      coordinateGeometry:'none',zeroPaddingPerformed:0,rowsDeduplicated:0,productionEligible:false};
  });
  return {schemaVersion:'postal-context-kw-observation-profile/v1',captureDigest:sourceDigest(bytes),captureBytes:bytes.length,
    captureMethod:'read-only public UI DOM; first and last pages of each table',observedAt:input.captures.map(c=>c.observedAt),
    rawHttpDataBytesVerified:false,immutableDataArtifact:false,completeNationalSnapshot:false,atomicSnapshot:false,
    tables,totalSampleRows:tables.reduce((n,t)=>n+t.sampleRows,0),totalInvalidCodes:tables.reduce((n,t)=>n+t.invalidFiveDigitCodes,0),
    nationalQuality:{missingCodeRate:null,duplicateAssignmentRate:null,invalidCodeRate:null},
    fourDigitCause:'unverified; do not assume or repair a lost leading zero',sourceRowsPersisted:0,currentAssignmentRowsValidated:0,countryM2Achieved:false};
}

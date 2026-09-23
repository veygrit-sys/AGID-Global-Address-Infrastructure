import {sourceDigest} from './postal-context-source-probe.mjs';

export const MY_POSTCODE_URLS = Object.freeze({catalog:'https://data.gov.my/data-catalogue/poskod',csv:'https://storage.data.gov.my/dictionaries/postcodes.csv',parquet:'https://storage.data.gov.my/dictionaries/postcodes.parquet',terms:'https://creativecommons.org/licenses/by/4.0/legalcode.en'});
const fail = code => { throw Error(`my-${code}`); };
export const normalizeMyLabel = value => value.normalize('NFC').replace(/^ +| +$/g, '');
const key = row => JSON.stringify([row.postcode,row.state,row.city]);

// Deliberately accepts only the reviewed simple CSV dialect. Quotes, embedded
// records, extra columns and numeric coercion require a separately reviewed import.
export function readMalaysiaPostcodes(bytes, mime = 'text/csv') {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > 2*1024*1024) fail('csv-byte-limit');
  if (mime.split(';')[0].trim().toLowerCase() !== 'text/csv') fail('csv-mime');
  let text; try { text = new TextDecoder('utf-8',{fatal:true}).decode(bytes); } catch { fail('csv-encoding'); }
  if (text.includes('"') || text.includes('\u0000') || /\r(?!\n)/.test(text)) fail('csv-dialect');
  const lines = text.replaceAll('\r\n','\n').split('\n');
  if (lines.at(-1) === '') lines.pop();
  if (lines.shift() !== 'state,city,postcode') fail('csv-header');
  if (!lines.length || lines.length > 10000) fail('csv-row-limit');
  return lines.map((line,i) => {
    const fields = line.split(',');
    if (fields.length !== 3 || fields.some(s => !s || s.length > 256 || /[\u0000-\u001f\u007f-\u009f]/u.test(s))) fail('csv-row-shape');
    const [rawState,rawCity,postcode] = fields;
    if (!/^[0-9]{5}$/.test(postcode)) fail('postcode-string');
    const state = normalizeMyLabel(rawState), city = normalizeMyLabel(rawCity);
    if (!state || !city) fail('empty-label');
    return {sourceRow:i+2,postcode,state,city,rawState,rawCity};
  });
}

export function normalizeMalaysiaAssignments(rows) {
  const groups = new Map();
  for (const row of rows) {
    const k=key(row),old=groups.get(k);
    if (old) old.sourceRows.push(row.sourceRow);
    else groups.set(k,{id:`my-mcmc:${sourceDigest(k).slice(7)}`,postcode:row.postcode,state:row.state,city:row.city,sourceRows:[row.sourceRow],geometryType:'none',geometry:null,sourceEffectiveFrom:null,sourceEffectiveTo:null});
  }
  // Stable code-point ordering, independent of locale/OS; not inferred geography.
  return [...groups.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([,row])=>row);
}

export function profileMalaysiaPostcodes(rows) {
  const records = normalizeMalaysiaAssignments(rows),codes=new Map();
  for (const row of records) codes.set(row.postcode,(codes.get(row.postcode)??0)+1);
  return {sourceRows:rows.length,uniquePostalCodes:codes.size,normalizedAssignments:records.length,
    leadingZeroRows:rows.filter(r=>r.postcode.startsWith('0')).length,
    rawStateLabels:new Set(rows.map(r=>r.rawState)).size,normalizedStateLabels:new Set(rows.map(r=>r.state)).size,
    rawCityLabels:new Set(rows.map(r=>r.rawCity)).size,normalizedCityLabels:new Set(rows.map(r=>r.city)).size,
    trimmedStateRows:rows.filter(r=>r.rawState!==r.state).map(r=>r.sourceRow),trimmedCityRows:rows.filter(r=>r.rawCity!==r.city).map(r=>r.sourceRow),
    duplicateNormalizedTuples:rows.length-records.length,ambiguousPostalCodes:[...codes.values()].filter(n=>n>1).length,
    invalidPostalCodes:0,missingRequiredFields:0,normalizedDigest:sourceDigest(JSON.stringify(records)+'\n'),
    nationalCoverageIndependentlyVerified:false,liveAssignmentValidityVerified:false,sourceEffectiveDatesAvailable:false,
    productionGeometryRecords:0,civicBuildingRelations:0,geometryCrs:null,accuracyMeters:null};
}

export function profileMalaysiaCatalog(bytes) {
  let html;try { html=new TextDecoder('utf-8',{fatal:true}).decode(bytes); } catch { fail('catalog-encoding'); }
  const matches=[...html.matchAll(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/g)];
  if (matches.length!==1) fail('catalog-structure');
  let p;try{p=JSON.parse(matches[0][1]).props.pageProps;}catch{fail('catalog-json');}
  if(p.id!=='poskod'||p.meta?.agency!=='MCMC'||p.frequency!=='YEARLY'||p.link_csv!==MY_POSTCODE_URLS.csv||p.link_parquet!==MY_POSTCODE_URLS.parquet||p.link_editions!==null||JSON.stringify(p.fields?.map(f=>f.name))!==JSON.stringify(['state','city','postcode'])||p.data_source?.join()!=='MCMC') fail('catalog-identity');
  if(p.data_as_of!=='2026-06'||p.last_updated!=='2026-06-16 12:00'||!p.caveat?.includes('verify the current validity')||!html.includes('https://creativecommons.org/licenses/by/4.0/')) fail('catalog-edition-rights');
  if(!Array.isArray(p.data)||p.data.some(r=>Object.keys(r).sort().join()!=='city,postcode,state'||Object.values(r).some(v=>typeof v!=='string'))) fail('catalog-preview-schema');
  return {edition:p.data_as_of,lastUpdatedLocal:p.last_updated,lastUpdatedTimezone:null,frequency:p.frequency,immutableEditionLink:null,provider:'MCMC',licenseId:'CC-BY-4.0',fields:['state','city','postcode'],preview:p.data};
}

export function reconcileMalaysiaCatalog(rows,catalog) {
  const canonical = values => values.map(r=>JSON.stringify([r.state,r.city,r.postcode])).sort();
  const raw=rows.map(r=>({state:r.rawState,city:r.rawCity,postcode:r.postcode}));
  if(JSON.stringify(canonical(raw))!==JSON.stringify(canonical(catalog.preview))) fail('catalog-csv-disagreement');
  return {csvRows:rows.length,embeddedPreviewRows:catalog.preview.length,allRowsEqualAsMultiset:true,independentPostalAuthorityConfirmation:false};
}

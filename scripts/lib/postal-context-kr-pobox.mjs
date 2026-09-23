import AdmZip from 'adm-zip';
import { inflateRawSync, crc32 } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { sourceDigest } from './postal-context-source-probe.mjs';
const config=JSON.parse(readFileSync(new URL('../../data/postal_country_packs/kr/postal-context/m2-source-review.json',import.meta.url)));
const P=config.pobox,L=config.limits;
const bump=(m,k)=>m.set(k,(m.get(k)??0)+1);

export function profileKoreaPoboxText(bytes) {
  if(bytes.length>L.max_uncompressed_entry_bytes)throw Error('kr-text-byte-limit');
  let text;try{text=new TextDecoder('utf8',{fatal:true}).decode(bytes);}catch{throw Error('kr-invalid-text-encoding');}
  const lines=text.split(/\r?\n/);if(lines.at(-1)==='')lines.pop();
  if(lines[0]?.replace(/^\uFEFF/,'')!==P.header.join('|'))throw Error('kr-header-drift');
  if(lines.length<2||lines.length>L.max_rows+1)throw Error('kr-row-limit');
  const missing=P.header.map(()=>0),codes=new Map(),tuples=new Map();
  let invalidCodes=0,invalidRangeNumbers=0,invalidLegacyCodes=0,leadingZeroRows=0,whitespaceFields=0,comparableFullEndpoints=0,invertedFullEndpoints=0;
  for(const line of lines.slice(1)) {
    const row=line.split('|');if(row.length!==P.header.length||row.some(v=>/[\u0000-\u001f\u007f]/u.test(v)))throw Error('kr-row-shape');
    for(let i=0;i<row.length;i++){if(!row[i])missing[i]++;if(row[i]!==row[i].trim())whitespaceFields++;}
    if(!/^\d{5}$/.test(row[0]))invalidCodes++;else{bump(codes,row[0]);if(row[0].startsWith('0'))leadingZeroRows++;}
    if(row[9]&&!/^\d{6}$/.test(row[9]))invalidLegacyCodes++;
    for(const i of [5,6,7,8])if(row[i]&&!/^\d{1,10}$/.test(row[i]))invalidRangeNumbers++;
    // Empty endpoints stay empty: never turn a blank into zero or infer a range.
    if([5,6,7,8].every(i=>/^\d{1,10}$/.test(row[i]))) {
      comparableFullEndpoints++;
      const start=[BigInt(row[5]),BigInt(row[6])],end=[BigInt(row[7]),BigInt(row[8])];
      if(start[0]>end[0]||start[0]===end[0]&&start[1]>end[1])invertedFullEndpoints++;
    }
    bump(tuples,JSON.stringify(row));
  }
  const rows=lines.length-1,exactDuplicateExcess=[...tuples.values()].reduce((n,c)=>n+Math.max(0,c-1),0);
  return {rows,columns:P.header.length,header:P.header,encoding:'utf8',textDigest:sourceDigest(bytes),distinctPostcodes:codes.size,
    multipleObservationPostcodes:[...codes.values()].filter(n=>n>1).length,leadingZeroRows,exactDuplicateExcess,
    missingByColumn:P.header.map((name,i)=>({name,count:missing[i],rate:missing[i]/rows})),
    invalidCodes,invalidRangeNumbers,invalidLegacyCodes,whitespaceFields,comparableFullEndpoints,invertedFullEndpoints,
    rates:{exactDuplicateExcess:exactDuplicateExcess/rows,invalidCodes:invalidCodes/rows,leadingZero:leadingZeroRows/rows,invertedFullEndpoints:comparableFullEndpoints?invertedFullEndpoints/comparableFullEndpoints:null},
    distinctCodesAreNotUniqueSourceRows:true,blankEndpointSemanticsVerified:false,rowsDeduplicated:0,emptyEndpointsFilled:0,
    sourceRowsPersisted:0,geometryType:'po_box',coordinateGeometry:'none',productionGeometryRecords:0,civicBuildingRelations:0,currentAssignmentRowsValidated:0,productionEligible:false};
}

export function profileKoreaPoboxArchive(bytes) {
  if(bytes.length<4||bytes.length>L.max_response_bytes||bytes.readUInt32LE(0)!==0x04034b50)throw Error('kr-zip-signature-or-size');
  let entries;try{entries=new AdmZip(bytes).getEntries();}catch{throw Error('kr-invalid-zip');}
  if(entries.length!==2)throw Error('kr-zip-entry-count');
  let total=0;const outputs=new Map(),entryReceipts=[];
  for(const entry of entries) {
    const h=entry.header;let name;
    try{name=new TextDecoder(h.flags&2048?'utf8':'euc-kr',{fatal:true}).decode(entry.rawEntryName);}catch{throw Error('kr-filename-encoding');}
    if(entry.isDirectory||!new Set([P.text_entry,P.documentation_entry]).has(name)||outputs.has(name)||h.flags&1||![0,8].includes(h.method))throw Error('kr-zip-entry-policy');
    total+=h.size;if(h.size>L.max_uncompressed_entry_bytes||total>L.max_total_uncompressed_bytes)throw Error('kr-uncompressed-byte-limit');
    let data;
    try{const compressed=entry.getCompressedData();data=h.method===8?inflateRawSync(compressed,{maxOutputLength:L.max_uncompressed_entry_bytes}):compressed;}catch{throw Error('kr-inflate-failed');}
    if(data.length!==h.size||crc32(data)!==h.crc)throw Error('kr-zip-integrity');
    outputs.set(name,data);entryReceipts.push({name,bytes:data.length,compressedBytes:h.compressedSize,digest:sourceDigest(data),crcVerified:true});
  }
  if(outputs.get(P.documentation_entry)?.subarray(0,8).toString('hex')!=='d0cf11e0a1b11ae1')throw Error('kr-documentation-format-drift');
  return {archiveDigest:sourceDigest(bytes),archiveBytes:bytes.length,entries:entryReceipts,allEntriesCrcVerified:true,
    filenameDate:P.publication_date,hwpContentReviewed:false,hwpIsNotGeometry:true,text:profileKoreaPoboxText(outputs.get(P.text_entry)),countryM2Achieved:false};
}

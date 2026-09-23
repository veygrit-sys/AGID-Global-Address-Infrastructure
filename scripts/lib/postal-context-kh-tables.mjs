// In-memory review only. Retain source strings; canonical administrative keys
// are comparison aids and never manufacture postal assignments or geometry.
export const KH_HEADERS = {
  province:['no','pcode','province_k','province','postal_code','reference'],
  district:['no','dcode','pcode','district_k','district','postal_code','reference'],
  commune:['no','ccode','dcode','pcode','commune_k','commune','postal_code','reference'],
};
function csvRecords(text) {
  const out=[];let row=[],field='',quoted=false,closed=false;
  const fieldEnd=()=>{if(row.length>=8||field.length>8192)throw Error('kh-csv-field-limit');row.push(field);field='';closed=false;};
  const rowEnd=()=>{fieldEnd();out.push(row);if(out.length>10001)throw Error('kh-csv-row-limit');row=[];};
  for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){field+='"';i++;}else if(c==='"'){quoted=false;closed=true;}else field+=c;continue;}
    if(c===',')fieldEnd();else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;rowEnd();}else if(c==='"'&&!field&&!closed)quoted=true;else{if(closed||c==='"')throw Error('kh-csv-quote');field+=c;}}
  if(quoted)throw Error('kh-csv-unclosed-quote');if(field||row.length||closed)rowEnd();return out;
}
export function readCambodiaTable(bytes,level,mime='text/csv') {
  if(!Object.hasOwn(KH_HEADERS,level))throw Error('kh-level');
  if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>2097152)throw Error('kh-csv-byte-limit');
  if(mime.split(';')[0].trim().toLowerCase()!=='text/csv')throw Error('kh-csv-mime');
  let text;try{text=new TextDecoder('utf8',{fatal:true}).decode(bytes).replace(/^\uFEFF/,'');}catch{throw Error('kh-csv-encoding');}
  const rows=csvRecords(text),header=rows.shift();if(JSON.stringify(header)!==JSON.stringify(KH_HEADERS[level]))throw Error('kh-csv-header');
  if(!rows.length||rows.some(row=>row.length!==header.length))throw Error('kh-csv-row-shape');
  const active=rows.map((row,i)=>({row,ordinal:i+1})).filter(({row})=>row.some(v=>v.trim()));
  if(!active.length)throw Error('kh-table-empty');
  return {level,logicalRecordsIncludingHeader:rows.length+1,blankLogicalRecords:rows.length-active.length,rows:active.map(({row,ordinal},i)=>({ordinal,dataOrdinal:i+1,...Object.fromEntries(header.map((h,j)=>[h,row[j]]))}))};
}
const admin=(s,width)=>typeof s==='string'&&/^\d+$/.test(s)&&s.length<=width&&Number(s)>0?s.padStart(width,'0'):null;
const keyField={province:'pcode',district:'dcode',commune:'ccode'},width={province:2,district:4,commune:6};
const grouped=values=>{const groups=new Map();for(const [value,ordinal] of values){const list=groups.get(value)??[];list.push(ordinal);groups.set(value,list);}return {distinct:groups.size,excess:values.length-groups.size,duplicateOrdinals:[...groups.values()].filter(v=>v.length>1)};};
export function profileCambodiaTable(table) {
  const {level,rows}=table;if(!Object.hasOwn(KH_HEADERS,level)||!rows.length)throw Error('kh-table-empty');
  const q={level,rows:rows.length,logicalRecordsIncludingHeader:table.logicalRecordsIncludingHeader,blankLogicalRecords:table.blankLogicalRecords,missingFields:0,invalidPostalCodes:0,leadingZeroPostalCodes:0,invalidAdminKeys:0,postalVsAdministrativeCodeDisagreement:0,administrativeParentPrefixMismatch:0,nonContiguousSerials:0,referenceMissing:0,exceptionOrdinals:[]};
  for(const row of rows){let bad=false;const validCode=/^[0-9]{6}$/.test(row.postal_code);if(!validCode){q.invalidPostalCodes++;bad=true;}if(row.postal_code.startsWith('0'))q.leadingZeroPostalCodes++;
    if(KH_HEADERS[level].some(k=>!row[k].trim())){q.missingFields++;bad=true;}if(!row.reference.trim())q.referenceMissing++;
    const own=admin(row[keyField[level]],width[level]),p=admin(row.pcode,2),d=level!=='province'?admin(row.dcode,4):null;
    if(!own||!p||(level!=='province'&&!d)){q.invalidAdminKeys++;bad=true;}
    if(own&&validCode&&row.postal_code!==own.padEnd(6,'0')){q.postalVsAdministrativeCodeDisagreement++;bad=true;}
    if(own&&p&&(own.slice(0,2)!==p||(level==='commune'&&d&&own.slice(0,4)!==d))){q.administrativeParentPrefixMismatch++;bad=true;}
    if(row.no!==String(row.dataOrdinal)){q.nonContiguousSerials++;bad=true;}if(bad)q.exceptionOrdinals.push(row.ordinal);
  }
  const codes=grouped(rows.map(r=>[r.postal_code,r.ordinal])),keys=grouped(rows.map(r=>[admin(r[keyField[level]],width[level])??'invalid:'+r.ordinal,r.ordinal]));
  const raw=grouped(rows.map(r=>[JSON.stringify(KH_HEADERS[level].filter(k=>k!=='no').map(k=>r[k])),r.ordinal]));
  return {...q,postalCodes:codes,administrativeKeys:keys,exactContentKeys:raw,
    rates:{denominator:rows.length,missingFields:q.missingFields/rows.length,invalidPostalCodes:q.invalidPostalCodes/rows.length,postalVsAdministrativeCodeDisagreement:q.postalVsAdministrativeCodeDisagreement/rows.length,duplicatePostalCodeExcess:codes.excess/rows.length},
    sourceRowsPersisted:0,currentAssignmentRowsValidated:0,productionEligible:false,geometryRecords:0,civicBuildingRelations:0};
}
export function reconcileCambodiaTables(province,district,commune) {
  if(province.level!=='province'||district.level!=='district'||commune.level!=='commune')throw Error('kh-join-level');
  const lookup=(table,k,w)=>{const map=new Map();for(const row of table.rows){const id=admin(row[k],w);if(!id)continue;const list=map.get(id)??[];list.push(row);map.set(id,list);}return map;};
  const provinces=lookup(province,'pcode',2),districts=lookup(district,'dcode',4);
  const check=(rows,parents,key,size,relation)=>{
    let missing=0,ambiguous=0,postalParentMismatch=0;const exceptionOrdinals=[];
    for(const row of rows){const matches=parents.get(admin(row[key],size))??[];let bad=false;if(!matches.length){missing++;bad=true;}else if(matches.length>1){ambiguous++;bad=true;}
      else if(!/^[0-9]{6}$/.test(row.postal_code)||!/^\d{6}$/.test(matches[0].postal_code)||row.postal_code.slice(0,size)!==matches[0].postal_code.slice(0,size)){postalParentMismatch++;bad=true;}
      if(bad)exceptionOrdinals.push(row.ordinal);
    }
    return {relation,rows:rows.length,missingParentRows:missing,ambiguousParentRows:ambiguous,postalParentMismatchRows:postalParentMismatch,exceptionOrdinals,rates:{missingParent:missing/rows.length,ambiguousParent:ambiguous/rows.length,postalParentMismatch:postalParentMismatch/rows.length}};
  };
  return {districtToProvince:check(district.rows,provinces,'pcode',2,'source administrative key comparison, not an official boundary relation'),communeToDistrict:check(commune.rows,districts,'dcode',4,'source administrative key comparison, not an official boundary relation'),communeToProvince:check(commune.rows,provinces,'pcode',2,'source administrative key comparison, not an official boundary relation'),originalPdfFullRowReconciliation:false,currentAssignmentVerified:false};
}

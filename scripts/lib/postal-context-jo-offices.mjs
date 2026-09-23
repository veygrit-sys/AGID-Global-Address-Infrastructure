// Bounded, aggregate-only review of the dated Jordan Post office CSV.
// Never returns source rows, names, addresses, property/ownership fields or codes.
export const JO_OFFICE_HEADER=['المحافظة','اسم مكتب البريد','الرمز البريدي','اوقات الدوام','عنوان المكتب / المدينة/ الحي الشارع','صفة الملكية','ملاحظات'];
function records(text){
 const out=[];let row=[],field='',quoted=false,closed=false;
 const push=()=>{row.push(field);out.push(row);if(out.length>5000)throw Error('jo-csv-row-limit');row=[];field='';closed=false;};
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){field+='"';i++;}else if(c==='"'){quoted=false;closed=true;}else field+=c;continue;}
  if(c===','){row.push(field);field='';closed=false;}else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;push();}else if(c==='"'&&!field&&!closed)quoted=true;else {if(closed||c==='"')throw Error('jo-csv-invalid-quote');field+=c;}}
 if(quoted)throw Error('jo-csv-unclosed-quote');if(field||row.length||closed)push();return out;
}
export function normalizeJordanOfficeCode(value){
 if(typeof value!=='string')return null;
 const normalized=value.trim().replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x660)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-0x6f0));
 return /^[0-9]{5}$/.test(normalized)?normalized:null;
}
export function profileJordanOfficeCsv(bytes,mime='text/csv'){
 if(!bytes.length||bytes.length>1048576)throw Error('jo-csv-byte-limit');
 if(mime.split(';')[0].trim().toLowerCase()!=='text/csv')throw Error('jo-csv-mime');
 let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes).replace(/^\uFEFF/,'');}catch{throw Error('jo-csv-invalid-utf8');}
 const rows=records(text),headerIndexes=rows.flatMap((r,i)=>r.length===7&&r.every((v,j)=>v.trim()===JO_OFFICE_HEADER[j])?[i]:[]);
 if(headerIndexes.length!==1||headerIndexes[0]>2)throw Error('jo-csv-header');
 const h=headerIndexes[0];let blankRows=0,labelRows=0,officeRows=0,shapeErrors=0,missingCode=0,invalidCode=0,missingOffice=0,missingGovernorate=0,duplicateOfficeKeys=0,duplicateCodeOccurrences=0;
 const keys=new Set(),codes=new Set();
 for(const row of rows.slice(h+1)){if(row.every(v=>!v.trim())){blankRows++;continue;}if(row.length!==7){shapeErrors++;continue;}
  const gov=row[0].trim(),office=row[1].trim(),raw=row[2].trim();
  if(!office&&!raw){labelRows++;continue;}officeRows++;if(!office)missingOffice++;if(!gov)missingGovernorate++;
  const code=normalizeJordanOfficeCode(raw);if(!raw)missingCode++;else if(!code)invalidCode++;
  if(code){if(codes.has(code))duplicateCodeOccurrences++;codes.add(code);}
  if(gov&&office&&code){const key=JSON.stringify([gov,office,code]);if(keys.has(key))duplicateOfficeKeys++;keys.add(key);}
 }
 const rate=n=>officeRows?n/officeRows:null;
 return {headerRecordIndex:h,logicalRecords:rows.length,preambleRecords:h,officeRows,blankRows,labelRows,shapeErrors,missingCode,invalidCode,missingOffice,missingGovernorate,duplicateOfficeKeys,duplicateCodeOccurrences,distinctCodes:codes.size,rates:{missingCode:rate(missingCode),invalidCode:rate(invalidCode),missingOffice:rate(missingOffice),missingGovernorate:rate(missingGovernorate),duplicateOfficeKeys:rate(duplicateOfficeKeys)},candidateKey:'governorate/office-name/normalized-code; not an official persistent identifier',excludedColumns:['hours','office-address','property-status','notes'],sourceRowsPersisted:0,currentAssignmentRowsValidated:0,geometryRecords:0,civicBuildingRelations:0,productionEligible:false};
}

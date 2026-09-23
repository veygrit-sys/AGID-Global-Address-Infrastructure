import ts from 'typescript';
import { sourceDigest } from './postal-context-source-probe.mjs';

// This is a data-literal reader, not a JavaScript evaluator. Source scripts,
// getters, spreads, computed properties and duplicate hierarchy keys fail closed.
export function readKyrgyzDirectoryLiteral(literal) {
  if (typeof literal !== 'string' || Buffer.byteLength(literal) > 2 * 1024 * 1024) throw Error('kg-literal-limit');
  const source = ts.createSourceFile('directory.js', `const data = ${literal};`, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  if (source.parseDiagnostics.length || source.statements.length !== 1) throw Error('kg-literal-syntax');
  const statement = source.statements[0];
  if (!ts.isVariableStatement(statement) || statement.declarationList.declarations.length !== 1) throw Error('kg-literal-syntax');
  let nodes = 0;
  const read = (node, depth = 0) => {
    if (!node || ++nodes > 60000 || depth > 8) throw Error('kg-literal-limit');
    if (ts.isStringLiteral(node)) {
      if (node.text.length > 4096) throw Error('kg-string-limit');
      return node.text;
    }
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(n => read(n, depth + 1));
    if (ts.isObjectLiteralExpression(node)) {
      const object = Object.create(null);
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property) || !ts.isStringLiteral(property.name)) throw Error('kg-unsafe-property');
        const key = property.name.text;
        if (!key.trim() || key.length > 256 || ['__proto__', 'constructor', 'prototype'].includes(key)) throw Error('kg-unsafe-key');
        if (Object.hasOwn(object, key)) throw Error('kg-duplicate-hierarchy-key');
        object[key] = read(property.initializer, depth + 1);
      }
      return object;
    }
    throw Error('kg-unsafe-literal');
  };
  return read(statement.declarationList.declarations[0].initializer);
}

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const normalized = value => value.normalize('NFKC').replace(/\s+/gu, ' ').trim();
const counts = values => {
  const map = new Map();
  for (const value of values) map.set(value, (map.get(value) ?? 0) + 1);
  return { distinct: map.size, repeatedGroups: [...map.values()].filter(n => n > 1).length, excessOccurrences: values.length - map.size };
};

export function profileKyrgyzDirectory(bytes, mime) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > 4 * 1024 * 1024) throw Error('kg-document-limit');
  if ((mime ?? '').split(';')[0].trim().toLowerCase() !== 'text/html') throw Error('kg-document-mime');
  let html;
  try { html = new TextDecoder('utf8', { fatal: true }).decode(bytes); } catch { throw Error('kg-invalid-utf8'); }
  if (!/<table\b[^>]*\bid="index-table"/.test(html) || !/<th>Branch<\/th>\s*<th>Postal code<\/th>\s*<th>Address<\/th>/.test(html)) throw Error('kg-table-schema');
  const matches = [...html.matchAll(/const data = ([\s\S]*?);\s*const areaSelect =/g)];
  if (matches.length !== 1) throw Error('kg-literal-count');
  const data = readKyrgyzDirectoryLiteral(matches[0][1]);
  if (!object(data)) throw Error('kg-hierarchy-shape');
  const q = { grain: 'one directory observation in area/city/group/array position; not a stable postal-object identity',
    areas: Object.keys(data).length, cities: 0, groups: 0, rows: 0, numericCodeRows: 0, mobileMarkerRows: 0,
    unknownNonNumericRows: 0, missingCodeRows: 0, missingBranchRows: 0, missingAddressContextRows: 0,
    nonCanonicalCodeRows: 0, leadingZeroCodeRows: 0, shapeErrors: 0 };
  const codes = [], rawKeys = [], normalizedKeys = [], shapeLimits = q.areas > 100;
  if (shapeLimits || !q.areas) throw Error('kg-hierarchy-limit');
  for (const [area, cities] of Object.entries(data)) {
    if (!object(cities) || !Object.keys(cities).length) throw Error('kg-hierarchy-shape');
    q.cities += Object.keys(cities).length;
    for (const [city, groups] of Object.entries(cities)) {
      if (!object(groups) || !Object.keys(groups).length) throw Error('kg-hierarchy-shape');
      q.groups += Object.keys(groups).length;
      for (const [group, rows] of Object.entries(groups)) {
        if (!Array.isArray(rows) || !rows.length) throw Error('kg-hierarchy-shape');
        for (const row of rows) {
          if (++q.rows > 10000 || q.groups > 2000 || q.cities > 1000) throw Error('kg-row-limit');
          if (!Array.isArray(row) || row.length !== 3 || row.some(v => typeof v !== 'string')) throw Error('kg-row-shape');
          const [branch, code, address] = row;
          if (!normalized(branch)) q.missingBranchRows++;
          if (!normalized(address)) q.missingAddressContextRows++;
          if (!normalized(code)) q.missingCodeRows++;
          if (/^[0-9]{6}$/.test(code)) { q.numericCodeRows++; codes.push(code); if (code.startsWith('0')) q.leadingZeroCodeRows++; }
          else if (code === 'ОС Передвижное') q.mobileMarkerRows++;
          else { q.unknownNonNumericRows++; if (/^[0-9]{6}$/.test(normalized(code))) q.nonCanonicalCodeRows++; }
          rawKeys.push(JSON.stringify([area, city, group, ...row]));
          normalizedKeys.push(JSON.stringify([area, city, group, ...row].map(normalized)));
        }
      }
    }
  }
  const raw = counts(rawKeys), norm = counts(normalizedKeys), numeric = counts(codes);
  const date = key => { const values = [...new Set([...html.matchAll(new RegExp(`"${key}":"([^"]+)"`, 'g'))].map(m => m[1]))]; return { values, unambiguous: values.length === 1 && Number.isFinite(Date.parse(values[0])) }; };
  return { ...q, numericCodes: numeric, exactObservationKeys: raw, normalizedObservationKeys: norm,
    rates: { denominator: q.rows, mobileMarker: q.mobileMarkerRows / q.rows, missingCode: q.missingCodeRows / q.rows,
      missingBranch: q.missingBranchRows / q.rows, missingAddressContext: q.missingAddressContextRows / q.rows,
      unknownNonNumeric: q.unknownNonNumericRows / q.rows, exactDuplicateExcess: raw.excessOccurrences / q.rows,
      normalizedDuplicateExcess: norm.excessOccurrences / q.rows },
    tableLiteralDigest: sourceDigest(Buffer.from(matches[0][1], 'utf8')),
    dates: { published: date('datePublished'), modified: date('dateModified'), sourceVersion: null, validFrom: null, validTo: null },
    sourceRowsPersisted: 0, productionEligible: false, currentAssignmentVerified: false,
    completeForCapturedLiteral: true, nationalCoverageVerified: false, geometryRecords: 0, civicBuildingRelations: 0,
    disposition: 'Preserve mobile markers and duplicate observations for source review; do not normalize markers, collapse rows, infer validity, civic identities or geometry.' };
}

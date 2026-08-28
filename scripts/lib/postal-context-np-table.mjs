import {sourceDigest} from './postal-context-source-probe.mjs';

const fail = code => { throw new Error(`np-${code}`); };
export const NEPAL_FEDERAL_HEADERS = [
  'क्र. सं.', 'प्रदेश', 'जिल्ला', 'स्थानीय तहको नाम', 'वडा संख्या', 'कार्यालय',
  'कोड (स्थानीय तह)', 'कोड (स्थानीय तह तथा वडा समेत )',
];
const asciiDigits = value => value.replace(/[०-९]/g, char => String(char.charCodeAt(0) - 0x0966));

// Syntax only: a five-digit value cannot distinguish legacy from federal codes.
// Never infer a ward, municipality, coordinate or building from digits alone.
export function normalizeNepalPostalCode(value) {
  if (typeof value !== 'string') fail('code-must-be-string');
  const raw = value.trim();
  if (!/^(?:[0-9]{5}(?:[0-9]{2})?|[०-९]{5}(?:[०-९]{2})?)$/.test(raw)) fail('code-syntax');
  return asciiDigits(raw);
}

function textCell(fragment) {
  // Deliberately constrained to the reviewed GPO table, not a general HTML parser.
  if ([...fragment.matchAll(/<\/?([\w:-]+)\b/g)].some(m => !['span', 'strong'].includes(m[1].toLowerCase()))) fail('cell-markup');
  const text = fragment.replace(/<[^>]*>/g, '').replace(/&zwnj;/g, '\u200c');
  if (/&[^;\s]{1,30};|[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) fail('cell-encoding');
  return text.replace(/[\t\r\n ]+/g, ' ').trim();
}

export function readNepalFederalTable(bytes, mime = 'text/html') {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > 4 * 1024 * 1024) fail('input-size');
  if (mime.split(';')[0].trim().toLowerCase() !== 'text/html') fail('html-mime');
  let html;
  try { html = new TextDecoder('utf-8', {fatal: true}).decode(bytes); } catch { fail('utf8'); }
  const tables = [...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table\s*>/gi)];
  if (tables.length !== 1 || (html.match(/<table\b/gi) ?? []).length !== 1) fail('table-count');
  const table = tables[0][0];
  if (/\b(?:rowspan|colspan)\s*=|<!--[\s\S]*?-->/i.test(table)) fail('table-layout');
  const tags = [...table.matchAll(/<\/?([\w:-]+)\b/g)].map(m => m[1].toLowerCase());
  if (tags.some(tag => !['table', 'tbody', 'tr', 'td', 'th', 'span', 'strong'].includes(tag))) fail('table-markup');
  const matches = [...tables[0][1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr\s*>/gi)];
  if (!matches.length || matches.length > 2000 || matches.length !== (table.match(/<tr\b/gi) ?? []).length) fail('row-count');
  const all = matches.map((match, index) => {
    const cells = [...match[1].matchAll(/<(td|th)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)];
    if (cells.length !== 8 || cells.length !== (match[1].match(/<t[dh]\b/gi) ?? []).length) fail('column-count');
    return {sourceRow: index + 1, cells: cells.map(cell => textCell(cell[2]))};
  });
  if (JSON.stringify(all[0].cells) !== JSON.stringify(NEPAL_FEDERAL_HEADERS)) fail('header');
  const rows = [], headings = [];
  for (const row of all.slice(1)) {
    if (!row.cells[0]) {
      if (row.cells[3] || row.cells[4] || row.cells[6] || row.cells[7] || !row.cells[1] || !row.cells[5]) fail('heading-shape');
      headings.push(row); // Never fill down, assign codes or turn headings into observations.
    } else rows.push(row);
  }
  if (!rows.length) fail('empty-assignments');
  return {tableDigest: sourceDigest(Buffer.from(table)), sourceDigest: sourceDigest(bytes), rows, headings, totalTableRows: all.length};
}

export function inspectNepalFederalRows(table) {
  const seenCodes = new Set(), seenSerials = new Set(), names = new Map();
  const provinces = new Set(), districts = new Set(), issues = [];
  let wardCandidates = 0, validRows = 0, devanagariCountRows = 0;
  for (const {sourceRow, cells: c} of table.rows) {
    const rowIssues = [], serial = asciiDigits(c[0]);
    if (!/^[1-9][0-9]*$/.test(serial) || Number(serial) !== seenSerials.size + 1 || seenSerials.has(serial)) rowIssues.push('serial-order-or-duplicate');
    seenSerials.add(serial);
    const code = asciiDigits(c[6]), range = asciiDigits(c[7]), count = asciiDigits(c[4]);
    try { normalizeNepalPostalCode(c[6]); } catch { rowIssues.push('office-code-script'); }
    if (!/^[0-9]{5}$/.test(code)) rowIssues.push('office-code-syntax');
    if (seenCodes.has(code)) rowIssues.push('duplicate-office-code');
    seenCodes.add(code);
    if (!c[1] || !c[2] || !c[3] || !c[5]) rowIssues.push('missing-context');
    if (!/^(?:[1-9][0-9]?|0[1-9])$/.test(count)) rowIssues.push('ward-count-syntax');
    const match = range.match(/^([0-9]{5})([0-9]{2}) देखि ([0-9]{2})$/);
    if (!match) rowIssues.push('ward-range-syntax');
    else {
      if (match[1] !== code) rowIssues.push('ward-prefix-disagreement');
      if (match[2] !== '01') rowIssues.push('ward-start-not-one');
      if (Number(match[3]) !== Number(count) || Number(match[3]) < Number(match[2])) rowIssues.push('ward-count-disagreement');
    }
    if (/[०-९]/.test(c[4])) devanagariCountRows++;
    provinces.add(c[1]); districts.add(JSON.stringify([c[1], c[2]]));
    const context = JSON.stringify([c[1], c[2], c[3]]);
    const name = c[3].normalize('NFC');
    if (!names.has(name)) names.set(name, new Set());
    names.get(name).add(context);
    if (rowIssues.length) issues.push({sourceRow, issueCodes: rowIssues});
    else { validRows++; wardCandidates += Number(count); }
  }
  return {
    totalTableRows: table.totalTableRows, headingRows: table.headings.length,
    observedLocalUnitRows: table.rows.length, structurallyValidRows: validRows,
    distinctOfficeCodes: seenCodes.size, provinceLabels: provinces.size, provinceDistrictKeys: districts.size,
    devanagariWardCountRows: devanagariCountRows,
    repeatedLocalityLabelsAcrossContexts: [...names.values()].filter(values => values.size > 1).length,
    arithmeticWardCandidatesFromValidRows: wardCandidates, materializedWardRecords: 0,
    issues, sourceRowValuesIncludedInReport: false,
    nationalCoverageIndependentlyVerified: false, currentAssignmentValidityVerified: false,
    sourceEffectiveDates: null, geometryAuthority: 'none', geometryRecords: 0,
    civicBuildingRelations: 0, redistributionRightsVerified: false,
  };
}

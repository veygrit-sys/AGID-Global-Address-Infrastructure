const fs = require("fs");
const path = require("path");
const Module = require("module");

const ROOT = path.resolve(__dirname, "..");
const HOME_DIR = process.env.USERPROFILE || process.env.HOME || "";
const BUNDLED_NODE_MODULES = HOME_DIR
  ? path.join(
      HOME_DIR,
      ".cache",
      "codex-runtimes",
      "codex-primary-runtime",
      "dependencies",
      "node",
      "node_modules",
    )
  : "";

if (BUNDLED_NODE_MODULES && fs.existsSync(BUNDLED_NODE_MODULES)) {
  process.env.NODE_PATH = [process.env.NODE_PATH, BUNDLED_NODE_MODULES].filter(Boolean).join(path.delimiter);
  Module.globalPaths.push(BUNDLED_NODE_MODULES);
}
Module._initPaths();

const { marked } = require("marked");
const { chromium } = require("playwright");
const { PDFDocument } = require("pdf-lib");

const OUT_DIR = path.join(ROOT, "output", "pdf");
const WINDOWS_EDGE_PATH = path.join(
  "C:",
  "Program Files (x86)",
  "Microsoft",
  "Edge",
  "Application",
  "msedge.exe",
);

const SOURCES = [
  {
    lang: "ja",
    label: "Japanese full edition",
    source: path.join(ROOT, "docs", "address-morphism-theory-ja-v1-master.md"),
    output: path.join(OUT_DIR, "address-morphism-theory-full-ja.pdf"),
    htmlOutput: path.join(OUT_DIR, "address-morphism-theory-full-ja.html"),
  },
  {
    lang: "en",
    label: "English full edition",
    source: path.join(ROOT, "docs", "address-morphism-theory-full-paper-en-v3.md"),
    output: path.join(OUT_DIR, "address-morphism-theory-full-en.pdf"),
    htmlOutput: path.join(OUT_DIR, "address-morphism-theory-full-en.html"),
  },
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function splitFrontMatter(markdown) {
  const lines = markdown.split(/\r?\n/);
  let index = 0;
  while (index < lines.length && !lines[index].trim()) index += 1;

  let title = "Address Morphism Theory";
  let subtitle = "";
  if (lines[index] && lines[index].startsWith("# ")) {
    title = lines[index].replace(/^#\s+/, "").trim();
    index += 1;
  }

  while (index < lines.length && !lines[index].trim()) index += 1;
  if (lines[index] && /^##\s+/.test(lines[index]) && !/^##\s+(\d+\.|第|Appendix|付録|Abstract|要旨|Keywords|キーワード|Manuscript|編集)/i.test(lines[index])) {
    subtitle = lines[index].replace(/^##\s+/, "").trim();
    index += 1;
  }

  while (index < lines.length && !lines[index].trim()) index += 1;
  const meta = [];
  while (index < lines.length && lines[index].includes(":")) {
    meta.push(lines[index].trim());
    index += 1;
  }
  while (index < lines.length && !lines[index].trim()) index += 1;

  return {
    title,
    subtitle,
    meta,
    body: lines.slice(index).join("\n"),
  };
}

function plainHeading(text) {
  return text
    .replaceAll("`", "")
    .replaceAll("**", "")
    .trim();
}

function tocHeadings(markdown, lang) {
  const headings = [];
  const lines = markdown.split(/\r?\n/);
  for (const line of lines) {
    const match = /^(#{1,3})\s+(.+)$/.exec(line.trim());
    if (!match) continue;
    const depth = match[1].length;
    const text = plainHeading(match[2]);
    if (lang === "ja") {
      if (depth === 1 && /^第\d+章/.test(text)) headings.push({ depth: 1, text });
      if (depth <= 2 && /^付録/.test(text)) headings.push({ depth: 1, text });
    } else {
      if (depth === 2 && /^(\d+\.|Appendix|Main Body|Abstract|Keywords|Manuscript Status)/.test(text)) {
        headings.push({ depth: /^Appendix/.test(text) ? 1 : 1, text });
      }
    }
  }
  return headings;
}

function buildTocHtml(headings, lang) {
  const title = lang === "ja" ? "Table of Contents / 目次" : "Table of Contents";
  const items = headings.map((heading) => {
    const cls = heading.depth > 1 ? "toc-subitem" : "toc-item";
    return `<li class="${cls}">${escapeHtml(heading.text)}</li>`;
  }).join("\n");
  return `<section class="toc"><h1>${escapeHtml(title)}</h1><ol>${items}</ol></section>`;
}

function renderFraction(numerator, denominator) {
  return `<span class="frac"><span>${numerator}</span><span>${denominator}</span></span>`;
}

function convertMathLines(expression) {
  let html = escapeHtml(expression.trim())
    .replace(/\\begin\{(?:aligned|align\*?|array|cases)\}(?:\{[^{}]*\})?/g, "")
    .replace(/\\end\{(?:aligned|align\*?|array|cases)\}/g, "")
    .replace(/\\\\/g, "\n")
    .replace(/&amp;/g, "")
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (_, numerator, denominator) => {
      return renderFraction(numerator, denominator);
    })
    .replace(/\\(?:operatorname|mathrm|text)\{([^{}]+)\}/g, '<span class="math-word">$1</span>')
    .replace(/\\mathbb\{R\}/g, "&#8477;")
    .replace(/\\mathbb\{N\}/g, "&#8469;")
    .replace(/\\mathbb\{Z\}/g, "&#8484;")
    .replace(/\\mathbb\{Q\}/g, "&#8474;")
    .replace(/\\mathbb\{C\}/g, "&#8450;")
    .replace(/\\mathcal\{([^{}]+)\}/g, '<span class="math-cal">$1</span>')
    .replace(/\\Rightarrow/g, "&#8658;")
    .replace(/\\Leftarrow/g, "&#8656;")
    .replace(/\\Leftrightarrow/g, "&#8660;")
    .replace(/\\rightarrow|\\to/g, "&#8594;")
    .replace(/\\leftarrow/g, "&#8592;")
    .replace(/\\mapsto/g, "&#8614;")
    .replace(/\\land/g, "&#8743;")
    .replace(/\\lor/g, "&#8744;")
    .replace(/\\neg/g, "&#172;")
    .replace(/\\forall/g, "&#8704;")
    .replace(/\\exists/g, "&#8707;")
    .replace(/\\infty/g, "&#8734;")
    .replace(/\\emptyset/g, "&#8709;")
    .replace(/\\subseteq/g, "&#8838;")
    .replace(/\\subset/g, "&#8834;")
    .replace(/\\supseteq/g, "&#8839;")
    .replace(/\\cup/g, "&#8746;")
    .replace(/\\cap/g, "&#8745;")
    .replace(/\\in/g, "&#8712;")
    .replace(/\\notin/g, "&#8713;")
    .replace(/\\leq/g, "&#8804;")
    .replace(/\\geq/g, "&#8805;")
    .replace(/\\neq/g, "&#8800;")
    .replace(/\\approx/g, "&#8776;")
    .replace(/\\sim/g, "&#8764;")
    .replace(/\\equiv/g, "&#8801;")
    .replace(/\\cong/g, "&#8773;")
    .replace(/\\times/g, "&#215;")
    .replace(/\\cdot/g, "&#183;")
    .replace(/\\sum/g, "&#8721;")
    .replace(/\\prod/g, "&#8719;")
    .replace(/\\min/g, "min")
    .replace(/\\max/g, "max")
    .replace(/\\arg/g, "arg")
    .replace(/\\pi/g, "&#960;")
    .replace(/\\epsilon/g, "&#949;")
    .replace(/\\varepsilon/g, "&#949;")
    .replace(/\\delta/g, "&#948;")
    .replace(/\\Delta/g, "&#916;")
    .replace(/\\chi/g, "&#967;")
    .replace(/\\phi/g, "&#981;")
    .replace(/\\psi/g, "&#968;")
    .replace(/\\theta/g, "&#952;")
    .replace(/\\lambda/g, "&#955;")
    .replace(/\\mu/g, "&#956;")
    .replace(/\\sigma/g, "&#963;")
    .replace(/\\tau/g, "&#964;")
    .replace(/\\alpha/g, "&#945;")
    .replace(/\\beta/g, "&#946;")
    .replace(/\\gamma/g, "&#947;")
    .replace(/\\rho/g, "&#961;")
    .replace(/\\omega/g, "&#969;")
    .replace(/\\Omega/g, "&#937;")
    .replace(/([A-Za-z0-9)\]}])_\{([^{}]+)\}/g, "$1<sub>$2</sub>")
    .replace(/([A-Za-z0-9)\]}])\^\{([^{}]+)\}/g, "$1<sup>$2</sup>")
    .replace(/([A-Za-z0-9)\]}])_([A-Za-z0-9])/g, "$1<sub>$2</sub>")
    .replace(/([A-Za-z0-9)\]}])\^([A-Za-z0-9])/g, "$1<sup>$2</sup>")
    .replace(/\\[,;:!]/g, " ")
    .replace(/\\[a-zA-Z]+/g, "")
    .replace(/[{}]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();

  const lines = html.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  return lines;
}

function formatMathExpression(expression) {
  const lines = convertMathLines(expression);
  return lines.length
    ? lines.map((line) => `<span class="math-line">${line}</span>`).join("")
    : "";
}

function formatInlineMathExpression(expression) {
  return convertMathLines(expression).join(" ");
}

function preprocessMath(markdown) {
  return markdown
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, expression) => {
      return `\n\n<div class="math-display">${formatMathExpression(expression)}</div>\n\n`;
    })
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, expression) => {
      return `\n\n<div class="math-display">${formatMathExpression(expression)}</div>\n\n`;
    })
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, expression) => {
      return `<span class="math-inline">${formatInlineMathExpression(expression)}</span>`;
    });
}

function buildHtml(spec) {
  const markdown = fs.readFileSync(spec.source, "utf8");
  const front = splitFrontMatter(markdown);
  const toc = buildTocHtml(tocHeadings(front.body, spec.lang), spec.lang);
  const rendered = marked.parse(preprocessMath(front.body), {
    gfm: true,
    breaks: false,
    mangle: false,
    headerIds: false,
  });

  const metaHtml = front.meta.length
    ? `<div class="meta">${front.meta.map(escapeHtml).join("<br>")}</div>`
    : "";
  const subtitleHtml = front.subtitle ? `<p class="subtitle">${escapeHtml(front.subtitle)}</p>` : "";

  return `<!doctype html>
<html lang="${escapeHtml(spec.lang)}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(front.title)}</title>
<style>
@page {
  size: A4;
  margin: 17mm 15mm 20mm 15mm;
}
html {
  color: #111827;
  background: white;
}
body {
  font-family: "Yu Gothic", "Meiryo", "Noto Sans CJK JP", "Segoe UI", Arial, sans-serif;
  font-size: 10.2pt;
  line-height: 1.55;
  margin: 0;
  overflow-wrap: break-word;
  line-break: strict;
}
.cover {
  min-height: 245mm;
  display: flex;
  flex-direction: column;
  justify-content: center;
  page-break-after: always;
}
.cover h1 {
  font-size: 27pt;
  line-height: 1.2;
  margin: 0 0 14pt 0;
  color: #0f172a;
}
.subtitle {
  font-size: 13.5pt;
  line-height: 1.35;
  color: #334155;
  margin: 0 0 18pt 0;
}
.edition {
  font-size: 10.5pt;
  color: #475569;
  margin: 0 0 15pt 0;
}
.meta {
  font-size: 9.2pt;
  color: #475569;
  border-top: 1px solid #cbd5e1;
  padding-top: 12pt;
}
.toc {
  page-break-after: always;
}
.toc h1 {
  font-size: 20pt;
  margin: 0 0 14pt 0;
}
.toc ol {
  columns: 2;
  column-gap: 24pt;
  padding-left: 18pt;
}
.toc li {
  break-inside: avoid;
  margin: 0 0 3pt 0;
  font-size: 8.8pt;
  line-height: 1.28;
}
article h1 {
  break-before: page;
  font-size: 20pt;
  line-height: 1.25;
  margin: 0 0 12pt 0;
  color: #0f172a;
}
article h1:first-child {
  break-before: auto;
}
article h2 {
  font-size: 14.2pt;
  line-height: 1.3;
  margin: 16pt 0 7pt 0;
  color: #111827;
  break-after: avoid;
}
article h3 {
  font-size: 11.8pt;
  line-height: 1.28;
  margin: 12pt 0 5pt 0;
  color: #1f2937;
  break-after: avoid;
}
article p {
  margin: 0 0 7.5pt 0;
}
article ul,
article ol {
  margin: 0 0 8pt 0;
  padding-left: 18pt;
}
article li {
  margin: 0 0 2.2pt 0;
}
blockquote {
  margin: 10pt 0;
  padding: 7pt 10pt;
  border-left: 3pt solid #94a3b8;
  background: #f8fafc;
}
pre {
  white-space: pre-wrap;
  word-break: break-word;
  background: #f8fafc;
  border: 1px solid #d1d5db;
  padding: 7pt;
  font-size: 8.0pt;
  line-height: 1.25;
  margin: 8pt 0;
}
code {
  font-family: Consolas, "Courier New", monospace;
  font-size: 0.92em;
}
.math-display {
  font-family: "Cambria Math", "Times New Roman", "Yu Gothic", serif;
  font-size: 10.8pt;
  line-height: 1.65;
  text-align: center;
  margin: 8pt 0 10pt 0;
  padding: 2pt 0;
  overflow-wrap: anywhere;
  break-inside: avoid;
}
.math-inline {
  font-family: "Cambria Math", "Times New Roman", "Yu Gothic", serif;
  white-space: nowrap;
}
.math-line {
  display: block;
}
.math-word {
  font-family: "Times New Roman", "Yu Gothic", serif;
  font-style: normal;
}
.math-cal {
  font-family: "Times New Roman", "Yu Gothic", serif;
  font-style: italic;
}
.frac {
  display: inline-grid;
  grid-template-rows: auto auto;
  line-height: 1.05;
  text-align: center;
  vertical-align: middle;
  margin: 0 1px;
}
.frac > span:first-child {
  border-bottom: 1px solid currentColor;
  padding: 0 2px 1px;
}
.frac > span:last-child {
  padding: 1px 2px 0;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 9pt 0 11pt 0;
  font-size: 7.8pt;
  page-break-inside: auto;
}
thead {
  display: table-header-group;
}
tr {
  page-break-inside: avoid;
}
th,
td {
  border: 1px solid #cbd5e1;
  padding: 4pt;
  vertical-align: top;
}
th {
  background: #eef2f7;
  color: #0f172a;
}
a {
  color: #1d4ed8;
  text-decoration: none;
}
hr {
  border: 0;
  border-top: 1px solid #cbd5e1;
  margin: 14pt 0;
}
</style>
</head>
<body>
<section class="cover">
  <h1>${escapeHtml(front.title)}</h1>
  ${subtitleHtml}
  <p class="edition">${escapeHtml(spec.label)}</p>
  ${metaHtml}
</section>
${toc}
<article>
${rendered}
</article>
</body>
</html>`;
}

async function countPages(pdfPath) {
  const pdf = await PDFDocument.load(fs.readFileSync(pdfPath));
  return pdf.getPageCount();
}

async function buildOne(browser, spec) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const html = buildHtml(spec);
  fs.writeFileSync(spec.htmlOutput, html, "utf8");

  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
  await page.setContent(html, { waitUntil: "load" });
  await page.pdf({
    path: spec.output,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate: `
      <div style="font-family:Arial,sans-serif;font-size:7px;color:#64748b;width:100%;padding:0 15mm;display:flex;justify-content:space-between;">
        <span>${escapeHtml(spec.label)}</span>
        <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>`,
    margin: {
      top: "17mm",
      right: "15mm",
      bottom: "20mm",
      left: "15mm",
    },
    preferCSSPageSize: true,
  });
  await page.close();

  const pages = await countPages(spec.output);
  const size = fs.statSync(spec.output).size;
  console.log(`${spec.output} (${pages} pages, ${size} bytes)`);
}

async function main() {
  const launchOptions = process.platform === "win32" && fs.existsSync(WINDOWS_EDGE_PATH)
    ? { headless: true, executablePath: WINDOWS_EDGE_PATH }
    : { headless: true };
  const browser = await chromium.launch(launchOptions);
  try {
    for (const spec of SOURCES) {
      await buildOne(browser, spec);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

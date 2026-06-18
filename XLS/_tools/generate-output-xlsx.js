// Generate one .xlsx per tax-return output form. Each output form corresponds
// to an IRS PDF whose fillable-field map lives in C:\us-tax\pdfs\f<form>_field_map_semantic.csv.
// Output rows are one per PDF field, in CSV order (which matches PDF field declaration order).

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const FORMS_DIR = String.raw`C:\us-tax\us-tax-ui\src\app\forms`;
const PDFS_DIR = String.raw`C:\us-tax\pdfs`;
const OUTPUT_OUT = String.raw`C:\us-tax\XLS\output_forms`;

// Map form-tax-return-* component name → PDF field map basename (without _field_map_semantic.csv)
const FORM_TO_CSV = {
  'form-tax-return-1040':            null,           // 1040 has no PDF preview — uses HTML view
  'form-tax-return-1116':            'f1116',
  'form-tax-return-2106':            'f2106',
  'form-tax-return-2210':            'f2210',
  'form-tax-return-2441':            'f2441',
  'form-tax-return-2555':            'f2555',
  'form-tax-return-3903':            'f3903',
  'form-tax-return-4137-taxpayer':   'f4137',
  'form-tax-return-4137-spouse':     'f4137',
  'form-tax-return-4563':            'f4563',
  'form-tax-return-4684':            'f4684',
  'form-tax-return-4797':            'f4797',
  'form-tax-return-4852':            'f4852',
  'form-tax-return-4868':            'f4868',
  'form-tax-return-4972':            'f4972',
  'form-tax-return-5329':            'f5329',
  'form-tax-return-5695':            'f5695',
  'form-tax-return-6251':            'f6251',
  'form-tax-return-8396':            'f8396',
  'form-tax-return-8606':            'f8606',
  'form-tax-return-8801':            'f8801',
  'form-tax-return-8814':            'f8814',
  'form-tax-return-8834':            'f8834',
  'form-tax-return-8839':            'f8839',
  'form-tax-return-8853':            'f8853',
  'form-tax-return-8859':            'f8859',
  'form-tax-return-8862':            'f8862',
  'form-tax-return-8863':            'f8863',
  'form-tax-return-8880':            'f8880',
  'form-tax-return-8888':            'f8888',
  'form-tax-return-8889':            'f8889',
  'form-tax-return-8911':            'f8911',
  'form-tax-return-8911sa':          'f8911sa',
  'form-tax-return-8912':            'f8912',
  'form-tax-return-8919-taxpayer':   'f8919',
  'form-tax-return-8919-spouse':     'f8919',
  'form-tax-return-8936sa':          'f8936sa',
  'form-tax-return-8949':            'f8949',
  'form-tax-return-8959':            'f8959',
  'form-tax-return-8962':            'f8962',
  'form-tax-return-8995':            'f8995',
  'form-tax-return-8995a':           'f8995a',
  'form-tax-return-required-attachment': null,    // not a PDF form
  'form-tax-return-schedule-1a':     'f1040s1a',
  'form-tax-return-schedule-c':      'f1040sc',
  'form-tax-return-schedule-e':      'schedule_e',
  'form-tax-return-schedule-r':      'f1040sr',
  'form-tax-return-schedule1':       'f1040s1',
  'form-tax-return-schedule2':       'f1040s2',
  'form-tax-return-schedule3':       'f1040s3',
  'form-tax-return-schedule8812':    'f1040s8',
  'form-tax-return-schedulea':       'f1040sa',
  'form-tax-return-scheduleb':       'scheduleb',
  'form-tax-return-scheduled':       'f1040sd'
};

// Parse a CSV file (handles quoted values w/ commas, basic escapes)
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.length > 0);
  if (lines.length === 0) return { header: [], rows: [] };
  const header = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);
  return { header, rows };
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuotes = false; }
      } else {
        cur += ch;
      }
    } else {
      if (ch === ',') { out.push(cur); cur = ''; }
      else if (ch === '"') { inQuotes = true; }
      else { cur += ch; }
    }
  }
  out.push(cur);
  return out;
}

function loadSemanticCsv(basename) {
  // Try in priority order:
  //   1) pdfs/<basename>_field_map_semantic.csv     (legacy 6-col path-derived)
  //   2) pdfs/<basename>_field_mapping_semantic.csv (canonical 7-col truly-semantic)
  //   3) public/irs/<basename>_field_map_semantic.csv (runtime-served copy)
  const candidates = [
    path.join(PDFS_DIR, `${basename}_field_map_semantic.csv`),
    path.join(PDFS_DIR, `${basename}_field_mapping_semantic.csv`),
    path.join(String.raw`C:\us-tax\us-tax-ui\public\irs`, `${basename}_field_map_semantic.csv`),
  ];
  let csvPath = null;
  for (const p of candidates) {
    if (fs.existsSync(p)) { csvPath = p; break; }
  }
  if (!csvPath) return null;
  const text = fs.readFileSync(csvPath, 'utf8');
  const { header, rows } = parseCsv(text);
  const colIdx = (name) => header.indexOf(name);

  // Find name column — try multiple known variants
  const nameI = colIdx('old_field_name') >= 0 ? colIdx('old_field_name')
    : colIdx('old_leaf_name') >= 0 ? colIdx('old_leaf_name')
    : colIdx('old_name') >= 0 ? colIdx('old_name')
    : colIdx('fieldName') >= 0 ? colIdx('fieldName')
    : colIdx('old_full_name') >= 0 ? colIdx('old_full_name')
    : -1;
  // Find label column — semantic_field_name or new_name; prefer tooltip if present
  const labelI = colIdx('tooltip') >= 0 ? colIdx('tooltip')
    : colIdx('tooltip_label') >= 0 ? colIdx('tooltip_label')
    : colIdx('semantic_field_name') >= 0 ? colIdx('semantic_field_name')
    : colIdx('new_name') >= 0 ? colIdx('new_name')
    : colIdx('new_leaf_name') >= 0 ? colIdx('new_leaf_name')
    : -1;
  const semanticI = colIdx('semantic_field_name') >= 0 ? colIdx('semantic_field_name')
    : colIdx('new_name') >= 0 ? colIdx('new_name')
    : colIdx('new_leaf_name') >= 0 ? colIdx('new_leaf_name')
    : -1;
  const typeI = colIdx('field_type') >= 0 ? colIdx('field_type')
    : colIdx('type') >= 0 ? colIdx('type')
    : -1;
  const pageI = colIdx('pages_0_indexed') >= 0 ? colIdx('pages_0_indexed')
    : colIdx('page_index') >= 0 ? colIdx('page_index')
    : colIdx('page') >= 0 ? colIdx('page')
    : -1;

  if (nameI < 0) return null;

  // Normalize PDF type strings: /Tx → text, /Btn → checkbox/radio, /Ch → choice
  const normalizeType = (t) => {
    if (!t) return 'text';
    const lower = t.toLowerCase();
    if (lower === '/tx' || lower === 'text') return 'text';
    if (lower === '/btn' || lower === 'checkbox') return 'checkbox';
    if (lower === '/ch' || lower === 'choice' || lower === 'select') return 'select';
    return t;
  };

  return rows.map(r => ({
    name: (r[nameI] || '').trim(),
    label: labelI >= 0 ? (r[labelI] || '').trim() : '',
    semantic: semanticI >= 0 ? (r[semanticI] || '').trim() : '',
    type: normalizeType(typeI >= 0 ? r[typeI] : 'text'),
    page: pageI >= 0 ? (r[pageI] || '').trim() : ''
  })).filter(r => r.name);
}

// For form-tax-return-1040 (HTML view), parse the template directly for line refs
function parseTaxReturn1040() {
  const tsPath = path.join(FORMS_DIR, 'form-tax-return-1040.component.ts');
  const ts = fs.readFileSync(tsPath, 'utf8');
  const urlMatch = ts.match(/templateUrl:\s*['"]([^'"]+)['"]/);
  if (!urlMatch) return [];
  const htmlPath = path.resolve(path.dirname(tsPath), urlMatch[1]);
  if (!fs.existsSync(htmlPath)) return [];
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Find every line/box label rendered in the template. These are typically
  // <div class="line-label">{{ ... }}</div> or hardcoded "Line N <description>"
  // The 1040 template has explicit row labels we want to capture.
  const fields = [];
  // Strategy: find every {{ taxReturn?.<path> }} or {{ form1040?.<path> }} interpolation
  // and pair with the nearest preceding label text.
  const interpolationRegex = /\{\{\s*([^}]+?)\s*\}\}/g;
  const seen = new Set();
  let m;
  while ((m = interpolationRegex.exec(html)) !== null) {
    const expr = m[1];
    // Skip pipes, function calls, simple strings
    if (!/(taxReturn|form1040|computation|line\d+)/i.test(expr)) continue;
    const fieldName = expr
      .replace(/.*?(line[\dabcdefghijklm]+)/i, '$1')
      .replace(/\s.*/, '')
      .replace(/[?.()|]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    if (!fieldName || seen.has(fieldName)) continue;
    seen.add(fieldName);

    // Look back for nearest label-like text
    const before = html.substring(0, m.index).slice(-500);
    let label = '';
    const txt = [...before.matchAll(/>\s*([A-Z][^<>{]{3,80})\s*</g)];
    if (txt.length > 0) label = txt[txt.length - 1][1].trim();

    fields.push({
      order: fields.length + 1,
      name: fieldName,
      label: label,
      type: 'computed',
      purpose: ''
    });
  }
  return fields;
}

function generateXlsx(formBaseName, fields, outDir) {
  if (fields.length === 0) return null;
  const data = [
    ['Order', 'Field Name', 'Label', 'Type', 'Purpose'],
    ...fields.map(f => [f.order, f.name, f.label, f.type, f.purpose])
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 6 }, { wch: 38 }, { wch: 70 }, { wch: 14 }, { wch: 60 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Fields');
  const outPath = path.join(outDir, `${formBaseName}.xlsx`);
  XLSX.writeFile(wb, outPath);
  return outPath;
}

function main() {
  let count = 0, skipped = 0, totalFields = 0;
  const skippedForms = [];
  const missingCsv = [];

  for (const [formBaseName, csvBasename] of Object.entries(FORM_TO_CSV)) {
    let fields = [];

    if (formBaseName === 'form-tax-return-1040') {
      fields = parseTaxReturn1040();
    } else if (csvBasename === null) {
      skippedForms.push(formBaseName + ' (no PDF backing)');
      skipped++;
      continue;
    } else {
      const rows = loadSemanticCsv(csvBasename);
      if (!rows) {
        missingCsv.push(`${formBaseName} → ${csvBasename}_field_map_semantic.csv`);
        skipped++;
        continue;
      }
      // For PDF-backed forms, prefer tooltip text (real IRS labels) when
      // present, falling back to semantic_field_name (sanitized field id).
      fields = rows.map((r, i) => ({
        order: i + 1,
        name: r.name,
        label: r.label || r.semantic,
        type: r.type,
        purpose: ''
      }));
    }

    if (fields.length === 0) { skipped++; skippedForms.push(formBaseName); continue; }

    generateXlsx(formBaseName, fields, OUTPUT_OUT);
    count++;
    totalFields += fields.length;
  }

  console.log(`Generated ${count} output form files in ${OUTPUT_OUT}`);
  console.log(`Total fields documented: ${totalFields}`);
  if (skipped > 0) {
    console.log(`Skipped: ${skipped}`);
    skippedForms.forEach(f => console.log('  - ' + f));
    if (missingCsv.length > 0) {
      console.log('Missing CSVs:');
      missingCsv.forEach(f => console.log('  - ' + f));
    }
  }
}

main();

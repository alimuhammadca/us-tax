// Generate one .xlsx per Angular form component documenting its input fields.
// Output: input_forms/ for non-tax-return forms, output_forms/ for tax-return-* forms.
//
// Two extraction strategies in priority order:
//   1) YAML-driven (preferred): when a matching YAML exists in C:/us-tax/yamls/, walk its
//      sections + fields. Sections with `multiplicity: multiple` emit per-entry rows tagged
//      "<sectionName> (per entry)" with field path "<sectionName>.entries[].<fieldName>".
//      The YAML is the canonical source of truth — it captures dynamic-array fields, read-only
//      imported fields, conditional requiredness, and labels that the template scanner misses.
//   2) Template scan (fallback): for components without a matching YAML, parse the .ts template
//      literal or .html templateUrl, walk [(ngModel)] / formControlName bindings as before.
//
// History:
//   - 2026-05-09 (line 1g audit): added p-select/p-datepicker to the template-scan regex.
//   - 2026-05-10 (line 1h audit): switched to YAML-first to capture dynamic-array sections that
//                                   the template scanner cannot recognize from *ngFor blocks.
//                                   Schema expanded from 5 cols to 9 cols.

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const yaml = require('js-yaml');

const FORMS_DIR = String.raw`C:\us-tax\us-tax-ui\src\app\forms`;
const YAMLS_DIR = String.raw`C:\us-tax\yamls`;
const INPUT_OUT = String.raw`C:\us-tax\XLS\input_forms`;
const OUTPUT_OUT = String.raw`C:\us-tax\XLS\output_forms`;

// ──────────────────────────────────────────────────────────────────────────
// YAML index — built once, indexed by `name` field
// ──────────────────────────────────────────────────────────────────────────

function buildYamlIndex() {
  const byName = {};
  if (!fs.existsSync(YAMLS_DIR)) return byName;
  for (const file of fs.readdirSync(YAMLS_DIR)) {
    if (!file.endsWith('.yaml')) continue;
    const full = path.join(YAMLS_DIR, file);
    let doc;
    try {
      doc = yaml.load(fs.readFileSync(full, 'utf8'));
    } catch (e) {
      // Skip yamls with syntax errors — pre-existing issues outside this generator's scope.
      console.warn(`  YAML parse error in ${file}: ${e.message.split('\n')[0]}`);
      continue;
    }
    if (doc && typeof doc.name === 'string') {
      byName[doc.name] = { file, doc };
    }
  }
  return byName;
}

// ──────────────────────────────────────────────────────────────────────────
// YAML-driven extraction
// ──────────────────────────────────────────────────────────────────────────

function fmtBoolColumn(value) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return '';
}

function fmtRequired(field) {
  if (field.requiredIf) return 'Conditional';
  if (field.showIf) return field.required === true ? 'Conditional (visible)' : 'Conditional';
  return fmtBoolColumn(field.required);
}

function fmtHelp(field) {
  const parts = [];
  if (Array.isArray(field.options) && field.options.length > 0) {
    parts.push('Options: ' + field.options.map(o =>
      typeof o === 'object' && o !== null
        ? (o.label != null ? `${o.value}=${o.label}` : JSON.stringify(o))
        : String(o)
    ).join(', '));
  }
  if (field.help) parts.push(field.help);
  if (field.placeholder) parts.push(`Placeholder: ${field.placeholder}`);
  return parts.join(' | ');
}

function fieldsFromYaml(doc) {
  const rows = [];
  let order = 1;
  if (!doc || !Array.isArray(doc.sections)) return rows;

  for (const section of doc.sections) {
    if (!section || !Array.isArray(section.fields)) continue;
    const sectionLabel = section.title || section.name || '';
    const isRepeating = section.multiplicity === 'multiple';
    const sectionTag = isRepeating
      ? `${section.name || sectionLabel} (per entry)`
      : (section.name || sectionLabel);
    for (const field of section.fields) {
      if (!field || !field.name) continue;
      const fieldPath = isRepeating
        ? `${section.name}.entries[].${field.name}`
        : (section.name ? `${section.name}.${field.name}` : field.name);
      rows.push({
        order: order++,
        section: sectionTag,
        path: fieldPath,
        name: field.name,
        label: field.label || '',
        type: field.type || '',
        required: fmtRequired(field),
        readOnly: fmtBoolColumn(field.readOnly === true),
        help: fmtHelp(field)
      });
    }
  }
  return rows;
}

// ──────────────────────────────────────────────────────────────────────────
// Template-scan fallback (used when no YAML is found)
// ──────────────────────────────────────────────────────────────────────────

function loadTemplate(tsFile) {
  const tsPath = path.join(FORMS_DIR, tsFile);
  const ts = fs.readFileSync(tsPath, 'utf8');
  const inline = ts.match(/template:\s*`([\s\S]*?)`\s*[,}]/);
  if (inline) return inline[1];
  const url = ts.match(/templateUrl:\s*['"]([^'"]+)['"]/);
  if (url) {
    const htmlPath = path.resolve(path.dirname(tsPath), url[1]);
    if (fs.existsSync(htmlPath)) return fs.readFileSync(htmlPath, 'utf8');
  }
  return '';
}

function elementTypeOf(tagName, fullTag) {
  if (tagName === 'input') {
    const t = fullTag.match(/(?:^|[\s\[(])type\s*=\s*["']([^"']+)["']/);
    return t ? t[1] : 'text';
  }
  if (tagName === 'textarea') return 'textarea';
  if (tagName === 'select') return 'select';
  if (tagName.startsWith('p-')) return tagName.replace(/^p-/, '');
  return tagName;
}

function cleanText(s) {
  if (!s) return '';
  return s
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\s*]+$/, '')
    .trim();
}

function findLabelFor(template, fullTag, startPos) {
  const idMatch = fullTag.match(/(?:^|[\s])id\s*=\s*["']([^"']+)["']/);
  if (idMatch) {
    const id = idMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`<label[^>]*\\bfor\\s*=\\s*["']${id}["'][^>]*>([\\s\\S]*?)</label>`, 'i');
    const m = template.match(re);
    if (m) return cleanText(m[1]);
  }
  const window = template.slice(Math.max(0, startPos - 1500), startPos);
  const labels = [...window.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/gi)];
  if (labels.length > 0) return cleanText(labels[labels.length - 1][1]);
  const spans = [...window.matchAll(/<(?:span|h[1-6])[^>]*>([\s\S]*?)<\/(?:span|h[1-6])>/gi)];
  if (spans.length > 0) return cleanText(spans[spans.length - 1][1]);
  return '';
}

function extractFieldName(binding) {
  let v = binding.replace(/\?\./g, '.').replace(/\['([^']+)'\]/g, '.$1').replace(/\["([^"]+)"\]/g, '.$1').replace(/\[(\d+)\]/g, '.$1');
  const parts = v.split('.').filter(Boolean);
  return parts[parts.length - 1] || v;
}

function fieldsFromTemplateScan(template) {
  if (!template) return [];
  const rows = [];
  const seen = new Set();
  const elementRegex = /<(input|textarea|select|p-inputnumber|p-inputtext|p-dropdown|p-select|p-checkbox|p-radiobutton|p-calendar|p-datepicker|p-multiselect|p-selectbutton|p-toggleswitch)\b([^>]*?)\/?>/gis;
  let m;
  while ((m = elementRegex.exec(template)) !== null) {
    const fullTag = m[0];
    const tagName = m[1].toLowerCase();
    const startPos = m.index;
    const ngModelTwoWay = fullTag.match(/\[\(ngModel\)\]\s*=\s*"([^"]+)"/);
    const ngModelOneWay = fullTag.match(/\[ngModel\]\s*=\s*"([^"]+)"/);
    const formCtrl = fullTag.match(/formControlName\s*=\s*"([^"]+)"/);
    let binding = ngModelTwoWay ? ngModelTwoWay[1]
      : ngModelOneWay ? ngModelOneWay[1]
      : formCtrl ? formCtrl[1] : null;
    if (!binding) continue;
    const getFieldMatch = binding.match(/getField\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (getFieldMatch) binding = getFieldMatch[1];
    const fieldName = extractFieldName(binding);
    const type = elementTypeOf(tagName, fullTag);
    const label = findLabelFor(template, fullTag, startPos);
    const key = `${fieldName}|${type}|${label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      order: rows.length + 1,
      section: '(template-scan)',
      path: binding,
      name: fieldName,
      label,
      type,
      required: '',
      readOnly: '',
      help: ''
    });
  }
  return rows;
}

// ──────────────────────────────────────────────────────────────────────────
// Output
// ──────────────────────────────────────────────────────────────────────────

function generateXlsx(formBaseName, rows, outDir, sourceTag) {
  const data = [
    ['Order', 'Section', 'Field Path', 'Field Name', 'Label', 'Type', 'Required', 'Read-Only', 'Help / Options'],
    ...rows.map(r => [r.order, r.section, r.path, r.name, r.label, r.type, r.required, r.readOnly, r.help])
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 6 }, { wch: 32 }, { wch: 50 }, { wch: 38 }, { wch: 60 },
    { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 60 }
  ];
  for (let c = 0; c < 9; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[addr]) ws[addr].s = { font: { bold: true } };
  }
  // Trailing tag row so consumers can see how the xlsx was generated
  const tagRow = data.length + 2;
  ws[XLSX.utils.encode_cell({ r: tagRow, c: 0 })] = { v: `Source: ${sourceTag}`, t: 's' };
  // Extend the worksheet ref so the tag row is visible in the saved file
  const ref = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  if (tagRow > ref.e.r) {
    ref.e.r = tagRow;
    ws['!ref'] = XLSX.utils.encode_range(ref);
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Fields');
  const outPath = path.join(outDir, `${formBaseName}.xlsx`);
  XLSX.writeFile(wb, outPath);
  return outPath;
}

function listFormFiles() {
  return fs.readdirSync(FORMS_DIR).filter(f =>
    f.endsWith('.component.ts') && !f.includes('.spec.') && !f.includes('.bak')
  );
}

function main() {
  console.log('Building YAML index...');
  const yamlIndex = buildYamlIndex();
  console.log(`  Indexed ${Object.keys(yamlIndex).length} YAMLs by name.`);

  const forms = listFormFiles();
  let inCount = 0, outCount = 0, skipped = 0, totalFields = 0;
  let yamlDriven = 0, templateDriven = 0;
  const skippedForms = [];

  for (const file of forms) {
    const baseName = file.replace(/\.component\.ts$/, '');
    const isOutput = baseName.startsWith('form-tax-return');
    const outDir = isOutput ? OUTPUT_OUT : INPUT_OUT;

    // Look up YAML by stripping the "form-" prefix.
    const yamlKey = baseName.replace(/^form-/, '');
    const yamlEntry = yamlIndex[yamlKey];

    let rows = [];
    let sourceTag;
    if (yamlEntry) {
      rows = fieldsFromYaml(yamlEntry.doc);
      sourceTag = `YAML (${yamlEntry.file})`;
      yamlDriven++;
    } else {
      const template = loadTemplate(file);
      rows = fieldsFromTemplateScan(template);
      sourceTag = `template-scan (${file})`;
      templateDriven++;
    }

    if (rows.length === 0) {
      skipped++;
      skippedForms.push(baseName);
      continue;
    }

    generateXlsx(baseName, rows, outDir, sourceTag);
    totalFields += rows.length;
    if (isOutput) outCount++;
    else inCount++;
  }

  console.log(`Generated ${inCount} input form files in ${INPUT_OUT}`);
  console.log(`Generated ${outCount} output form files in ${OUTPUT_OUT}`);
  console.log(`Total fields documented: ${totalFields}`);
  console.log(`  YAML-driven:    ${yamlDriven}`);
  console.log(`  Template-scan:  ${templateDriven}`);
  console.log(`Skipped (no fields detected): ${skipped}`);
  if (skipped > 0) {
    console.log('Skipped forms:');
    skippedForms.forEach(f => console.log('  - ' + f));
  }
}

main();

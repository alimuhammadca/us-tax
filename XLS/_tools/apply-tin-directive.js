// Bulk-apply the [appTin] directive to all SSN/TIN/EIN input fields across
// the Angular form components. Idempotent — re-running is safe.
//
// Strategy:
//   1. For each known field binding (mapped to a TinKind), find <input ... [(ngModel)]="X" ...>
//      elements and append appTin="<kind>" if not already present.
//   2. For any .component.ts file that gained an appTin attribute, ensure the
//      file imports TinDirective and includes it in the component's imports array.
//   3. .component.html files don't need import changes (the parent .ts owns imports).

const fs = require('fs');
const path = require('path');

const FORMS_DIR = String.raw`C:\us-tax\us-tax-ui\src\app\forms`;
const RELATIVE_DIRECTIVE_IMPORT = `import { TinDirective } from '../directives/tin.directive';`;

// Map pdfRaw['key'] pattern → kind (statement forms use this PDF-overlay binding).
const PDFRAW_KIND = {
  payer_tin: 'any',
  recipient_tin: 'any',
  filer_tin: 'any',
  transferor_tin: 'any',
  policyholder_tin: 'any',
  insured_tin: 'any',
  borrower_tin: 'any',
  lender_tin: 'any',
  trustee_tin: 'any',
  employer_ein: 'ein',
  employee_ssn: 'individual',
};

// Map ngModel binding suffixes (after the dot) → kind.
// 'individual' = SSN or ITIN; 'ein' = entity EIN; 'any' = SSN/ITIN/EIN.
const FIELD_KIND = {
  // Individual SSN/ITIN fields
  taxpayerSSN: 'individual',
  spouseSSN: 'individual',
  mfsSpouseSSN: 'individual',
  dependentSSN: 'individual',
  childSSN: 'individual',
  beneficiarySSN: 'individual',
  employeeSSN: 'individual',
  recipientSSN: 'individual',
  coveredSSN: 'individual',
  responsibleSSNOrTIN: 'individual',
  coveredSSNOrTIN: 'individual',
  divorceFormerSpouseSSN: 'individual',
  participantTIN: 'individual',
  employeeTIN: 'individual',

  // Entity-only EIN fields
  employerEIN: 'ein',
  underlyingCorpTIN: 'ein',
  recipientEIN: 'ein',

  // Hybrid (SSN/ITIN/EIN — payer or filer may be individual or entity)
  recipientTIN: 'any',
  payerTIN: 'any',
  filerTIN: 'any',
  transferorTIN: 'any',
  policyholderTIN: 'any',
  insuredTIN: 'any',
  borrowerTIN: 'any',
  lenderTIN: 'any',
  trusteeOrIssuerTIN: 'any',
};

// Build a regex that matches a TIN binding inside the ngModel attribute.
// Captures everything inside the quotes so fieldKindForBinding can decide.
function buildBindingRegex() {
  const fieldNames = Object.keys(FIELD_KIND);
  const fieldAlt = fieldNames.join('|');
  const pdfRawNames = Object.keys(PDFRAW_KIND);
  const pdfRawAlt = pdfRawNames.join('|');
  // Two alternates: dotted .field, or pdfRaw['key']
  return new RegExp(
    `\\[\\(ngModel\\)\\]\\s*=\\s*"((?:[^"]*?\\.(?:${fieldAlt}))|(?:pdfRaw\\[['"](?:${pdfRawAlt})['"]\\]))"`,
    'g'
  );
}

function listFormFiles() {
  return fs.readdirSync(FORMS_DIR).filter(f =>
    (f.endsWith('.component.ts') || f.endsWith('.component.html')) &&
    !f.includes('.spec.') &&
    !f.includes('.bak')
  );
}

function fieldKindForBinding(binding) {
  // pdfRaw['key'] / pdfRaw["key"] pattern (statement forms)
  const pdfRawMatch = binding.match(/^pdfRaw\[['"]([^'"]+)['"]\]$/);
  if (pdfRawMatch) {
    return PDFRAW_KIND[pdfRawMatch[1]] || null;
  }
  // dotted binding like "model.recipientSSN" or "individual.coveredSSN"
  const dotIdx = binding.lastIndexOf('.');
  const suffix = dotIdx >= 0 ? binding.slice(dotIdx + 1) : binding;
  return FIELD_KIND[suffix] || null;
}

/**
 * Insert appTin="<kind>" into an <input>/<p-inputtext>/etc. element that contains
 * the given ngModel binding. Returns the modified file content + bool whether
 * any change was made.
 */
function applyAppTinAttribute(content) {
  let changed = false;

  // Find each tag containing [(ngModel)]="…<field>" and insert appTin if missing.
  // We match ANY tag that contains the binding, then add appTin before its
  // closing > if not already present.
  const bindingRegex = buildBindingRegex();

  const replaced = content.replace(
    /<(input|p-inputtext|p-inputnumber|p-inputmask)\b([^>]*?)\/?>/gi,
    (whole, tag, attrs) => {
      // Already has appTin? leave it alone.
      if (/\bappTin\s*=/.test(attrs)) return whole;
      // Find the field binding inside this tag.
      bindingRegex.lastIndex = 0;
      const m = bindingRegex.exec(attrs);
      if (!m) return whole;
      const kind = fieldKindForBinding(m[1]);
      if (!kind) return whole;
      changed = true;
      // Insert ` appTin="<kind>"` before any closing /> or > of the tag.
      const isSelfClose = whole.trimEnd().endsWith('/>');
      if (isSelfClose) {
        return whole.replace(/\s*\/>\s*$/, ` appTin="${kind}" />`);
      }
      return whole.replace(/>\s*$/, ` appTin="${kind}">`);
    }
  );

  return { content: replaced, changed };
}

/**
 * For a .component.ts file that received appTin attributes, ensure
 * TinDirective is imported and included in @Component({imports: [...]}).
 */
function ensureDirectiveImported(content, filePath) {
  let changed = false;

  // Add import statement if missing
  if (!content.includes("from '../directives/tin.directive'")) {
    // Insert near the top after the last existing import line
    const importBlockMatch = content.match(/(?:^import [^\n]+\n)+/m);
    if (importBlockMatch) {
      const insertAt = importBlockMatch.index + importBlockMatch[0].length;
      content = content.slice(0, insertAt) + RELATIVE_DIRECTIVE_IMPORT + '\n' + content.slice(insertAt);
      changed = true;
    }
  }

  // Add TinDirective to @Component imports array if not present
  // Looks for "imports: [<list>]" within @Component({...})
  const componentMatch = content.match(/@Component\s*\(\s*\{[\s\S]*?\}\s*\)/);
  if (componentMatch) {
    const block = componentMatch[0];
    // Try matching imports: [ ... ]
    const importsMatch = block.match(/imports\s*:\s*\[([^\]]*)\]/);
    if (importsMatch && !/\bTinDirective\b/.test(importsMatch[1])) {
      const newImports = importsMatch[0].replace(
        /imports\s*:\s*\[([^\]]*)\]/,
        (m, list) => {
          const trimmed = list.trim();
          const prefix = trimmed.length === 0 ? '' : trimmed.replace(/,?\s*$/, ', ');
          return `imports: [${prefix}TinDirective]`;
        }
      );
      const newBlock = block.replace(importsMatch[0], newImports);
      content = content.replace(block, newBlock);
      changed = true;
    }
  }

  return { content, changed };
}

function main() {
  const files = listFormFiles();
  let totalAttrsAdded = 0;
  let filesChanged = 0;
  const tsFilesNeedingImport = new Set();

  // Pass 1: insert appTin attributes in all .ts and .html files
  for (const f of files) {
    const filePath = path.join(FORMS_DIR, f);
    const original = fs.readFileSync(filePath, 'utf8');
    const { content, changed } = applyAppTinAttribute(original);
    if (!changed) continue;

    // Count how many we added (rough — count appTin occurrences delta)
    const beforeCount = (original.match(/\bappTin\s*=/g) || []).length;
    const afterCount = (content.match(/\bappTin\s*=/g) || []).length;
    totalAttrsAdded += (afterCount - beforeCount);
    filesChanged++;

    fs.writeFileSync(filePath, content);

    // If the file is a .component.ts (inline template), also ensure import.
    // If it's a .component.html, find the matching .component.ts.
    if (f.endsWith('.component.ts')) {
      tsFilesNeedingImport.add(filePath);
    } else if (f.endsWith('.component.html')) {
      const tsTwin = filePath.replace(/\.html$/, '.ts');
      if (fs.existsSync(tsTwin)) tsFilesNeedingImport.add(tsTwin);
    }
  }

  // Pass 2: for each affected .ts file, add the directive import + @Component imports entry
  let importsUpdated = 0;
  for (const tsPath of tsFilesNeedingImport) {
    const original = fs.readFileSync(tsPath, 'utf8');
    const { content, changed } = ensureDirectiveImported(original, tsPath);
    if (changed) {
      fs.writeFileSync(tsPath, content);
      importsUpdated++;
    }
  }

  console.log(`Files with attribute additions: ${filesChanged}`);
  console.log(`Total appTin attributes added: ${totalAttrsAdded}`);
  console.log(`.component.ts files with directive imports added: ${importsUpdated}`);
}

main();

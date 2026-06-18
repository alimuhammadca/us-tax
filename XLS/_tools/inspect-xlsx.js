const XLSX = require('xlsx');
const path = require('path');
const file = process.argv[2];
const wb = XLSX.readFile(file);
console.log('File:', path.basename(file));
console.log('Sheets:', wb.SheetNames);
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, {header: 1, defval: ''});
  console.log('\n=== Sheet:', name, '(' + rows.length + ' rows) ===');
  rows.slice(0, 15).forEach((row, i) => {
    const truncated = row.map(c => String(c).slice(0, 80)).join(' | ');
    console.log(i + ': ' + truncated);
  });
  if (rows.length > 15) console.log('... (' + (rows.length - 15) + ' more rows)');
}

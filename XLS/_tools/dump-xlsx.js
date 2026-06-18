const XLSX = require('xlsx');
const wb = XLSX.readFile(process.argv[2]);
for (const name of wb.SheetNames) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], {header: 1, defval: ''});
  rows.forEach((row, i) => console.log(i + ': ' + row.map(c => String(c).slice(0, 120)).join(' | ')));
}

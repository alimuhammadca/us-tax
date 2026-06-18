const XLSX = require('xlsx');
const path = require('path');
const file = process.argv[2];
const wb = XLSX.readFile(file);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, {header: 1});
rows.forEach(r => console.log(r.slice(0, 4).map(c => String(c || '')).join(' | ')));

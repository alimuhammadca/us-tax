const fs = require('fs');
const path = require('path');
function check(s) {
  const n = s.replace(/[\s-]/g, '');
  if (!/^\d{9}$/.test(n)) return 'NOT-9';
  const a = n.slice(0,3), g = n.slice(3,5), sr = n.slice(5);
  if (g === '00' || sr === '0000') return 'ZERO-SEG';
  if (a === '000' || a === '666') return 'BAD-AREA';
  if (a >= '900' && a <= '999') {
    const gi = parseInt(g, 10);
    const ranges = [[50,65],[70,88],[90,92],[94,99]];
    if (ranges.some(([lo,hi]) => gi>=lo && gi<=hi)) return 'OK-ITIN';
    return 'BAD-ITIN-G' + g;
  }
  return 'OK-SSN';
}
const text = fs.readFileSync(path.join(__dirname, 'ssn-counts.txt'), 'utf8');
text.split(/\r?\n/).filter(Boolean).forEach(line => {
  const m = line.match(/^\s*(\d+)\s+(.+)$/);
  if (!m) return;
  const c = check(m[2]);
  if (c !== 'OK-SSN' && c !== 'OK-ITIN') {
    console.log(('' + m[1] + 'x').padStart(6) + ' ' + m[2] + '  ->  ' + c);
  }
});

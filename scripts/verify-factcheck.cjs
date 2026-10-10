const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'), read=p=>fs.readFileSync(path.join(root,p),'utf8');
const box={module:{exports:{}},console};vm.runInNewContext(read('js/tax.js'),box);const TX=box.module.exports;TX.use(JSON.parse(read('data/tax-2026.json')));
let checks=0;function eq(a,b,label){assert.equal(a,b,label);checks++;}
// Independent integer rational arithmetic: all decimal rates are exact fractions.
const cut=(n,d)=>Number(n/d/10n*10n);
const reference=(salary,month)=>{let base=BigInt(Math.floor(salary/1000)*1000);const lo=month>=7?410000n:400000n,hi=month>=7?6590000n:6370000n;base=base<lo?lo:base>hi?hi:base;const s=BigInt(salary),health=cut(s*3595n,100000n);return {pension:cut(base*475n,10000n),health,care:cut(BigInt(health)*9448n,71900n),employ:cut(s*9n,1000n)};};
const salaries=new Set([0,100000,399999,400000,409999,410000,1000999,6370000,6370999,6590000,8000000]);for(let s=1;s<=10000000;s+=7919)salaries.add(s);
for(const s of salaries)for(const month of [1,7]){const actual=TX.social(s,month),expected=reference(s,month);for(const k of Object.keys(expected))eq(actual[k],expected[k],`salary=${s},month=${month},${k}`);eq(actual.total,Object.values(expected).reduce((a,b)=>a+b,0),'total');}
eq(TX.social(100000).employ,900,'floating 900 boundary');eq(TX.trunc10(899.99),890,'real fractional value remains truncated');
for(const s of salaries){const a=reference(s,1),b=reference(s,7),actual=TX.socialYear(s);for(const k of Object.keys(a))eq(actual[k],6*(a[k]+b[k]),`annual ${s}/${k}`);}
for(const gross of [55000000,55000001,80000000,80000001])for(const income of [45000000,45000001,70000000,70000001]){const r=TX.rentCredit(12000000,gross,income),rate=gross>80000000||income>70000000?0:gross<=55000000&&income<=45000000?.17:.15;eq(r.rate,rate,'rent eligibility/rate boundary');eq(r.credit,10000000*rate,'rent cap');}
for(const children of [0,1,2,8]){const r=TX.inheritTax({estate:1e11,children});eq(r.personal,Math.max(5e8,2e8+children*5e7),'normal inheritance deduction');}
const sole=TX.inheritTax({estate:1e11,soleSpouse:true});eq(sole.personal,2e8,'sole spouse no lump deduction');eq(sole.lumpUsed,false,'sole spouse flag');
const S=TX.socialYear(TX.CASE.monthly-TX.CASE.mealMonthly),C=TX.caseYearEnd();eq(C.ins.pension,S.pension,'case annual pension');
let scripts=0;for(const f of fs.readdirSync(path.join(root,'chapters')).filter(f=>f.endsWith('.html'))){for(const m of read('chapters/'+f).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){if(/\bsrc\s*=/.test(m[1]))continue;if(/application\/ld\+json/.test(m[1]))JSON.parse(m[2]);else new vm.Script(m[2],{filename:f});scripts++;}}
console.log(`TaxBook fact-check: ${checks} numerical assertions, ${scripts} inline JS/JSON blocks passed`);

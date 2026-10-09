#!/usr/bin/env node
// Copyright (c) 2026 geniuskey and TaxBook contributors. MIT (see ../LICENSE-MIT).
// 엔진 기준 사례 점검: 국세청 안내의 계산례와 경계값을 엔진에 넣어 본다.
// 실행: node tools/check-engine.cjs [연도]
// 기준값은 그 해 세법에서 손으로 계산한 값이다. 세법이 바뀌어 기준값이 달라지면 사례를 고친다.
const TX = require("./tx.cjs");
const D = process.argv[2] ? TX.year(+process.argv[2]).D : TX.D;
let bad = 0, n = 0;
function eq(name, got, want, tol = 1) {
  n++;
  if (Math.abs(got - want) > tol) { bad++; console.log(`  실패 ${name}: ${got} (기대 ${want})`); }
}
const yr = D.year;
console.log(`data/tax-${yr}.json (${D.label})`);

// 1. 누진세율: 국세청 예시 과세표준 3,000만원 × 15% − 126만원 = 324만원
eq("종합소득세 3천만", TX.incomeTax(3e7).tax, 3240000);
// 누진공제표가 세율표에서 바로 나오는지(1,400만~5,000만 구간 126만원)
eq("누진공제 2구간", TX.quickTable(D.income.rates)[1].quick, 1260000);
// 2. 근로소득공제: 총급여 5,000만원 → 1,200만 + 500만×5% = 1,225만
eq("근로소득공제 5천만", TX.earnedDeduction(5e7), 12250000);
eq("근로소득공제 한도", TX.earnedDeduction(1e10), D.wage.earnedDeductionMax);
// 3. 근로소득세액공제: 산출세액 100만 → 55만 / 총급여 5,000만 한도 66만
eq("근로세액공제 55%", TX.earnedCredit(1e6, 3e7).credit, 550000);
eq("근로세액공제 한도", TX.earnedCredit(5e6, 5e7).credit, 660000);
// 4. 증여세: 성년 자녀에게 1억 → (1억 − 5천만) × 10% = 500만, 신고세액공제 3% → 485만
eq("증여세 1억", TX.giftTax({ value: 1e8, relation: "parentToAdult" }).pay, 4850000);
// 혼인 공제를 더하면 1.5억까지 0원
eq("혼인 증여 1.5억", TX.giftTax({ value: 1.5e8, relation: "parentToAdult", marriage: true }).pay, 0);
// 5. 상속세: 상속재산 10억, 배우자 없음, 자녀 2명 → 일괄공제 5억, 장례비 500만 → 과표 4억 9,500만 → 8,900만, 3% 공제 → 8,633만
eq("상속세 10억", TX.inheritTax({ estate: 1e9, children: 2 }).pay, 86330000);
// 6. 금융소득: 기준금액 이하면 원천징수로 끝
eq("금융소득 분리과세", TX.financial({ interest: 1e7, otherBase: 3e7 }).extra, 0);
// 7. 해외주식: 이익 460만 − 손실 90만 − 250만 = 120만 × 20% = 24만
eq("해외주식", TX.overseasStock(4.6e6 - 9e5).tax, 240000);
// 8. ISA: 순이익 160만 일반형 → 비과세 한도 안
eq("ISA 한도 안", TX.isa({ profit: 1.6e6 }).tax, 0);
// 9. 신용카드: 총급여 5,000만, 신용카드만 2,250만 → (2,250 − 1,250)×15% = 150만
eq("신용카드 공제", TX.cardDeduction({ credit: 2.25e7 }, 5e7).deduction, 1500000);
// 한도: 신용카드 1억 → 기본 한도
eq("신용카드 한도", TX.cardDeduction({ credit: 1e8 }, 5e7).deduction, D.card.limits[0].base);
// 10. 월세: 총급여 5,000만, 연 780만 → 17% 132.6만
eq("월세 세액공제", TX.rentCredit(7.8e6, 5e7).credit, 7.8e6 * D.credits.rent.rateLow);
// 10-1. 간이세액표(별표 2): 표에 있는 값 그대로. 월 416만 6,667원·1명, 월 601만원·4명·자녀 2명(차감 45,830원), 1,200만원·2명(초과 산식)
if (D.simplified && D.simplified.table) {
  eq("간이세액표 다온", TX.payroll({ monthly: 4166667, family: 1 }).tax, 217320, 0);
  eq("간이세액표 자녀 차감", TX.payroll({ monthly: 6010000, family: 4, kids: 2 }).tax, 331140, 0);
  eq("간이세액표 1천만 초과", TX.payroll({ monthly: 12000000, family: 2 }).tax, 2142570, 0);
}
// 11. 연말정산이 끝까지 돌고, 결정세액이 음수가 아니다
const ye = TX.yearEnd(TX.caseYearEnd());
n++; if (!(ye.decided >= 0 && isFinite(ye.refund))) { bad++; console.log("  실패 연말정산 케이스", ye.decided, ye.refund); }

// JSON 필수 키
const need = ["year", "label", "settleYear", "income.rates", "income.localRate", "wage.earnedDeduction", "card.threshold", "credits.standardWage", "financial.threshold", "isa.freeGeneral", "pension.totalLimit", "stock.overseas.deduction", "crypto.startYear", "transfer.rates", "gift.deduction.parentToAdult", "inherit.lump"];
need.forEach((k) => { n++; if (TX.v(k) == null) { bad++; console.log("  JSON 키 없음:", k); } });

console.log(bad ? `문제 ${bad}건 / ${n}건` : `모두 통과 (${n}건)`);
process.exit(bad ? 1 : 0);

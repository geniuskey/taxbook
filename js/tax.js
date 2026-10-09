/* Copyright (c) 2026 geniuskey and TaxBook contributors.
   Executable code: MIT (see ../LICENSE-MIT).
   Educational values and explanations: CC-BY-4.0 (see ../LICENSE.md). */
/* ==========================================================================
   TaxBook 세금 계산 엔진 — 전역 객체 TX
   세율·공제 한도·기준 금액은 이 파일에 적지 않는다. 모두 data/tax-YYYY.json 한 파일에서 읽는다.
   해마다 새 귀속 연도의 data/tax-YYYY.json을 더하면 페이지가 가장 최근 파일을 자동으로 쓴다.
   (?year=2026 처럼 주소에 연도를 주면 그 연도 파일을 쓴다.)

   - 불러오기: TX.ready(fn)  fn(D)는 세법 값이 준비되면 실행된다. D = TX.D (JSON 그대로)
               node: const TX = require("./js/tax.js"); TX.use(JSON.parse(fs.readFileSync("data/tax-2026.json")))
   - 본문 채우기: <span data-t="경로" data-f="형식"></span>  (TX.fill 이 자동 실행)
               형식: won(기본, "1억 2,346만원"), wonfull("1,234,567원"), man("300만원"), pct("15%"), pct1, num, raw
               <a data-src="키"></a> → D.refs[키]의 법령·조문 이름과 링크
   - 기본: TX.progressive(표, 과세표준) → {tax, rate, steps}, TX.local(소득세), TX.v("경로")
   - 직장인: TX.payroll, TX.earnedDeduction, TX.earnedCredit, TX.personalDeduction, TX.cardDeduction, TX.housingDeduction, TX.yearEnd
   - 종합소득: TX.business, TX.otherIncome, TX.comprehensive
   - 투자: TX.financial, TX.highDividend, TX.isa, TX.pensionCredit, TX.pensionPayout, TX.pensionLimit, TX.overseasStock, TX.domesticStock, TX.crypto
   - 상속·증여: TX.giftDeduction, TX.giftTax, TX.inheritTax
   - 케이스: TX.CASE (다온의 세금 노트)
   모든 계산은 실제 세법의 주요 흐름만 따른 교육용 단순화이며, 결과에 steps(계산 단계)를 함께 돌려준다.
   ========================================================================== */
(function (root) {
  "use strict";
  const TX = {};
  const isNode = typeof module !== "undefined" && module.exports;
  let D = null;
  const waiters = [];

  /* ------------------------------------------------------------ 불러오기 */
  TX.MIN_YEAR = 2026;                                  // 이 책이 가진 가장 오래된 귀속 연도 파일
  TX.use = function (json) {
    D = TX.D = json;
    TX.YEAR = json.year;
    while (waiters.length) { const fn = waiters.shift(); try { fn(D); } catch (e) { console.error(e); } }
    if (!isNode && typeof document !== "undefined") {
      // 상단바·푸터(common.js)와 장 스크립트가 만든 요소까지 채우도록 여러 시점에 다시 채운다
      const go = () => { TX.fill(document); document.documentElement.classList.add("tx-ready"); };
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(go, 0)); else setTimeout(go, 0);
      if (document.readyState !== "complete") window.addEventListener("load", () => setTimeout(go, 0));
      setTimeout(go, 400);
    }
    return TX;
  };
  TX.ready = function (fn) { if (D) { fn(D); } else waiters.push(fn); };

  if (!isNode && typeof document !== "undefined") {
    const me = document.currentScript && document.currentScript.src;
    const base = me ? new URL("../data/", me).href : "data/";
    const q = new URLSearchParams(location.search).get("year");
    const now = new Date().getFullYear();
    const years = [];
    if (q && /^\d{4}$/.test(q)) years.push(+q);
    for (let y = now; y >= TX.MIN_YEAR; y--) if (!years.includes(y)) years.push(y);
    TX.loading = (async function () {
      for (const y of years) {
        try {
          const r = await fetch(base + "tax-" + y + ".json", { cache: "no-cache" });
          if (r.ok) { TX.use(await r.json()); return; }
        } catch (e) { /* file:// 등에서는 fetch가 막힌다 */ }
      }
      const warn = () => {
        const box = document.createElement("div");
        box.className = "tx-fail";
        box.innerHTML = "<b>세법 수치 파일(data/tax-YYYY.json)을 불러오지 못했다.</b> 이 책은 세율과 공제 한도를 한 파일에서 읽는다. 저장소 폴더에서 <code>python3 -m http.server 8000</code>을 실행하고 http://localhost:8000 으로 연다.";
        (document.querySelector("main") || document.body).prepend(box);
      };
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", warn); else warn();
    })();
  }

  /* ------------------------------------------------------------ 값 읽기·포맷 */
  TX.v = function (path, obj) {
    let o = obj || D;
    for (const k of String(path).split(".")) { if (o == null) return undefined; o = o[k]; }
    return o;
  };
  const won = function (x) {
    if (!isFinite(x)) return "—";
    const neg = x < 0, a = Math.abs(x);
    let s;
    if (a < 1e4) s = Math.round(a).toLocaleString("ko-KR") + "원";
    else {
      const man = Math.round(a / 1e4 * 100) / 100, eok = Math.floor(man / 1e4), rest = Math.round((man - eok * 1e4) * 100) / 100;
      if (eok > 0) s = eok.toLocaleString("ko-KR") + "억" + (rest ? " " + rest.toLocaleString("ko-KR") + "만" : "") + "원";
      else s = rest.toLocaleString("ko-KR") + "만원";
    }
    return (neg ? "−" : "") + s;
  };
  TX.fmt = {
    won,
    wonfull: (x) => (isFinite(x) ? Math.round(x).toLocaleString("ko-KR") + "원" : "—"),
    man: (x) => (isFinite(x) ? (Math.round(x / 1e4 * 10) / 10).toLocaleString("ko-KR") + "만원" : "—"),
    pct: (x) => (isFinite(x) ? +(x * 100).toFixed(2) + "%" : "—"),
    pct1: (x) => (isFinite(x) ? (x * 100).toFixed(1) + "%" : "—"),
    num: (x) => (isFinite(x) ? Number(x).toLocaleString("ko-KR") : "—"),
    raw: (x) => (x == null ? "" : String(x)),
  };
  TX.fill = function (scope) {
    if (!D) return;
    (scope || document).querySelectorAll("[data-t]").forEach((el) => {
      const v = TX.v(el.getAttribute("data-t"));
      // 형식을 주지 않으면: 1 미만 비율은 %, 1900~2100의 정수는 연도(그대로), 나머지 숫자는 금액
      const isYear = typeof v === "number" && Number.isInteger(v) && v >= 1900 && v <= 2100;
      const f = el.getAttribute("data-f") || (typeof v === "number" ? (isYear ? "raw" : Math.abs(v) < 1 && v !== 0 ? "pct" : "won") : "raw");
      el.textContent = v == null ? "확인 필요" : (TX.fmt[f] || TX.fmt.raw)(v);
      el.classList.add("tval");
      el.title = (D.label || "") + " · data/tax-" + D.year + ".json";
    });
    (scope || document).querySelectorAll("[data-src]").forEach((el) => {
      const r = D.refs && D.refs[el.getAttribute("data-src")];
      if (!r) return;
      if (!el.textContent.trim()) el.textContent = r.law;
      if (r.url && el.tagName === "A") { el.href = r.url; el.target = "_blank"; el.rel = "noopener"; }
      el.classList.add("tref");
    });
  };

  /* ------------------------------------------------------------ 기본 */
  /**
   * 누진세율. table: [[구간 상한(null이면 끝까지), 세율], ...]
   * 반환 {tax, rate(한계세율), steps:[{from, to, rate, part}]}
   */
  TX.progressive = function (table, base) {
    let tax = 0, prev = 0, rate = table[0][1];
    const steps = [];
    base = Math.max(0, base || 0);
    for (const [up, r] of table) {
      const top = up == null ? Infinity : up;
      if (base > prev) {
        const amt = Math.min(base, top) - prev;
        tax += amt * r; rate = r;
        steps.push({ from: prev, to: Math.min(base, top), rate: r, part: amt * r });
      }
      prev = top;
      if (base <= top) break;
    }
    return { tax, rate, steps };
  };
  /** 누진공제 표: 각 구간의 [하한, 세율, 누진공제액] */
  TX.quickTable = function (table) {
    let prev = 0, acc = 0;
    return table.map(([up, r]) => { const row = { from: prev, to: up, rate: r, quick: prev * r - acc }; acc += ((up == null ? prev : up) - prev) * r; prev = up == null ? prev : up; return row; });
  };
  TX.incomeTax = (base) => TX.progressive(D.income.rates, base);
  TX.local = (tax) => Math.floor(Math.max(0, tax) * D.income.localRate / 10) * 10;
  const trunc10 = (x) => Math.floor(Math.max(0, x) / 10) * 10;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const sumv = (o) => Object.values(o || {}).reduce((s, x) => s + (+x || 0), 0);

  /* ------------------------------------------------------------ 직장인 */
  /** 근로소득공제(총급여 → 근로소득금액). D.wage.earnedDeduction: [[상한, 율, 그 구간 시작까지 누적 공제]] */
  TX.earnedDeduction = function (gross) {
    const t = D.wage.earnedDeduction;
    let prev = 0, ded = 0;
    for (const [up, r, accum] of t) {
      const top = up == null ? Infinity : up;
      if (gross <= top) { ded = accum + (gross - prev) * r; break; }
      prev = top;
    }
    return Math.min(D.wage.earnedDeductionMax, Math.max(0, ded));
  };
  /** 근로소득세액공제와 한도. calcTax: 근로소득 산출세액 */
  TX.earnedCredit = function (calcTax, gross) {
    const c = D.wage.earnedCredit;
    const raw = calcTax <= c.threshold ? calcTax * c.lowRate : c.threshold * c.lowRate + (calcTax - c.threshold) * c.highRate;
    let limit = c.limits[c.limits.length - 1].floor;
    for (const L of c.limits) {
      if (L.upTo == null || gross <= L.upTo) { limit = Math.max(L.floor, L.base - Math.max(0, gross - (L.from || 0)) * (L.slope || 0)); break; }
    }
    return { credit: Math.min(raw, limit), raw, limit };
  };
  /** 인적공제. p: {self:true, spouse, children, parents, others, elderly, disabled, woman, single} → {total, rows} */
  TX.personalDeduction = function (p) {
    const P = D.personal;
    const n = 1 + (p.spouse ? 1 : 0) + (p.children || 0) + (p.parents || 0) + (p.others || 0);
    const rows = [{ key: "basic", label: "기본공제 " + n + "명", value: n * P.basic }];
    if (p.elderly) rows.push({ key: "elderly", label: "경로우대 " + p.elderly + "명", value: p.elderly * P.elderly });
    if (p.disabled) rows.push({ key: "disabled", label: "장애인 " + p.disabled + "명", value: p.disabled * P.disabled });
    if (p.single) rows.push({ key: "single", label: "한부모", value: P.single });
    else if (p.woman) rows.push({ key: "woman", label: "부녀자", value: P.woman });
    return { total: rows.reduce((s, r) => s + r.value, 0), rows, n };
  };
  /** 4대보험 근로자 부담(월). monthly: 월 과세 급여 */
  TX.social = function (monthly) {
    const S = D.social;
    const pBase = clamp(monthly, S.pensionMinBase, S.pensionMaxBase);
    const pension = trunc10(pBase * S.pension);
    const health = trunc10(monthly * S.health);
    const care = trunc10(health * S.careOfHealth);
    const employ = trunc10(monthly * S.employment);
    return { pension, health, care, employ, total: pension + health + care + employ };
  };
  /**
   * 월급명세서: 매달 원천징수(간이세액표를 만든 산식의 교육용 재현).
   * {monthly(세전 월급), nontax(월 비과세), family(본인 포함 공제대상가족 수), kids(8~20세 자녀 수), ratio(0.8|1|1.2)}
   */
  TX.payroll = function (o) {
    const S = D.simplified;
    const monthly = o.monthly, nontax = Math.min(o.nontax || 0, monthly), taxable = monthly - nontax;
    const ins = TX.social(taxable);
    const gross = taxable * 12;
    const earned = gross - TX.earnedDeduction(gross);
    const fam = Math.max(1, o.family || 1);
    const personal = fam * D.personal.basic;
    const pensionDed = ins.pension * 12;
    // 특별소득공제 등(간이세액표 산식의 가정): 고정액 + 총급여×율 − (총급여−a)×b + (총급여−c)×d
    let special = 0;
    const row = S.special.find((r) => r.upTo == null || gross <= r.upTo);
    if (row) {
      const k = row.byFamily[Math.min(fam, row.byFamily.length) - 1];
      special = Math.max(0, k[0] + gross * k[1] - Math.max(0, gross - (k[2] || 0)) * (k[3] || 0) * (k[2] ? 1 : 0) + Math.max(0, gross - (k[4] || 0)) * (k[5] || 0) * (k[4] ? 1 : 0));
    }
    const base = Math.max(0, earned - personal - pensionDed - special);
    const calc = TX.incomeTax(base).tax;
    const ec = TX.earnedCredit(calc, gross).credit;
    const yearly = Math.max(0, calc - ec);
    let tax = trunc10(yearly / 12);
    const kids = o.kids || 0, CM = S.childMonthly;
    if (kids) tax = Math.max(0, tax - (kids === 1 ? CM.one : CM.two + (kids - 2) * CM.extraPerChild));
    tax = trunc10(tax * (o.ratio || 1));
    const local = trunc10(tax * D.income.localRate);
    const take = monthly - ins.total - tax - local;
    return { monthly, nontax, taxable, ins, tax, local, take, yearly: tax * 12, steps: { gross, earned, personal, pensionDed, special, base, calc, ec } };
  };

  /**
   * 신용카드 등 소득공제(조세특례제한법 제126조의2의 흐름).
   * use: {credit, debit, cash, culture, market, transit}, gross: 총급여, kids: 자녀 수(한도 가산용), prev: 전년 사용액(증가분 공제용, 생략 가능)
   */
  TX.cardDeduction = function (use, gross, opt = {}) {
    const C = D.card, R = C.rates;
    const low = gross <= C.cultureGrossMax;
    const u = { credit: use.credit || 0, debit: use.debit || 0, cash: use.cash || 0, culture: low ? use.culture || 0 : 0, market: use.market || 0, transit: use.transit || 0 };
    if (!low) u.credit += use.culture || 0;    // 총급여 기준 초과자의 도서·공연 등은 일반 사용분
    const total = sumv(u), threshold = gross * C.threshold;
    // 문턱은 공제율이 낮은 것부터 채운다
    const order = ["credit", "debit", "cash", "culture", "market", "transit"];
    let left = threshold;
    const eligible = {};
    let raw = 0;
    order.forEach((k) => {
      const take = Math.min(left, u[k]); left -= take;
      eligible[k] = u[k] - take;
      raw += eligible[k] * R[k];
    });
    const debitCash = (eligible.debit + eligible.cash) * R.debit, creditPart = eligible.credit * R.credit;
    const extraPart = { culture: eligible.culture * R.culture, market: eligible.market * R.market, transit: eligible.transit * R.transit };
    const L = C.limits.find((l) => l.upTo == null || gross <= l.upTo);
    const kidAdd = Math.min((opt.kids || 0) * (L.perChild || 0), L.childMax || 0);
    const baseLimit = L.base + kidAdd;
    const general = creditPart + debitCash;
    const inBase = Math.min(baseLimit, general + extraPart.culture + extraPart.market + extraPart.transit);
    const overflow = Math.max(0, general + extraPart.culture + extraPart.market + extraPart.transit - baseLimit);
    const extraCap = Math.min(overflow, extraPart.culture + extraPart.market + extraPart.transit, L.extra);
    // 소비 증가분 추가공제(해당 연도에 있을 때만)
    let growth = 0;
    if (C.growth && opt.prev != null && total > opt.prev * C.growth.over) growth = Math.min(C.growth.limit, (total - opt.prev * C.growth.over) * C.growth.rate);
    const deduction = total > threshold ? inBase + extraCap + growth : 0;
    return { total, threshold, eligible, raw, baseLimit, extraLimit: L.extra, inBase, extra: extraCap, growth, deduction, over: total - threshold, lost: Math.max(0, raw + growth - deduction) };
  };

  /** 주택자금 공제. {subscription(청약저축 납입), leaseRepay(주택임차차입금 원리금 상환), mortgageInterest, mortgageCap(장기주택저당 한도 키), gross} */
  TX.housingDeduction = function (h, gross) {
    const H = D.housing;
    const sub = gross <= H.subscription.grossMax ? Math.min(h.subscription || 0, H.subscription.max) * H.subscription.rate : 0;
    const lease = Math.min((h.leaseRepay || 0) * H.lease.rate, H.lease.limit);
    const leaseSub = Math.min(sub + lease, H.lease.limit);   // 청약저축과 임차차입금은 합쳐서 한도
    const mortCap = H.mortgage.limits[h.mortgageCap || "fixedOrInstallment"] || H.mortgage.limits.basic;
    const mort = Math.min(h.mortgageInterest || 0, mortCap);
    const total = Math.min(leaseSub + mort, Math.max(mortCap, H.lease.limit));
    return { subscription: sub, lease, leaseSub, mortgage: mort, total };
  };

  /** 자녀세액공제(8세 이상 기본공제 대상 자녀 n명) */
  TX.childCredit = function (n) {
    const C = D.credits.child;
    if (!n) return 0;
    if (n === 1) return C.one;
    return C.two + Math.max(0, n - 2) * C.extra;
  };
  /** 출산·입양 세액공제: births = [순서, ...] 예: [1] 첫째 출산 */
  TX.birthCredit = (births) => (births || []).reduce((s, k) => s + (D.credits.birth[Math.min(k, 3) - 1] || 0), 0);
  /** 연금계좌 세액공제. {saving(연금저축), irp, isaTransfer}, gross, totalIncome(종합소득금액, 근로만이면 생략) */
  TX.pensionCredit = function (p, gross, totalIncome) {
    const P = D.pension;
    const s = Math.min(p.saving || 0, P.savingLimit);
    const base = Math.min(s + (p.irp || 0), P.totalLimit);
    const isa = Math.min((p.isaTransfer || 0) * P.isaTransferRate, P.isaTransferLimit);
    const high = totalIncome != null ? totalIncome > P.lowIncomeMax : gross > P.lowGrossMax;
    const rate = high ? P.rateHigh : P.rateLow;
    return { eligible: base + isa, rate, credit: (base + isa) * rate, local: (base + isa) * rate * D.income.localRate };
  };
  /** 특별세액공제(근로자). sp: {insurance, insuranceDisabled, medical:{self, other, infertility, premature}, education:{self, school, univ, preschool}, donation:{hometown, general}} */
  TX.specialCredits = function (sp, gross) {
    const C = D.credits, rows = [];
    const ins = Math.min(sp.insurance || 0, C.insurance.limit) * C.insurance.rate + Math.min(sp.insuranceDisabled || 0, C.insurance.limit) * C.insurance.disabledRate;
    rows.push({ key: "insurance", label: "보험료", value: ins });
    const m = sp.medical || {}, M = C.medical, thr = gross * M.threshold;
    const other = m.other || 0, selfAll = (m.self || 0), inf = m.infertility || 0, pre = m.premature || 0;
    // 문턱은 일반 의료비(한도 있는 것)부터 차감
    let left = thr;
    const takeO = Math.min(left, other); left -= takeO;
    const takeS = Math.min(left, selfAll); left -= takeS;
    const takeP = Math.min(left, pre); left -= takeP;
    const takeI = Math.min(left, inf);
    const med = Math.min(other - takeO, M.otherLimit) * M.rate + (selfAll - takeS) * M.rate + (pre - takeP) * M.prematureRate + (inf - takeI) * M.infertilityRate;
    rows.push({ key: "medical", label: "의료비", value: med, threshold: thr });
    const e = sp.education || {}, E = C.education;
    const edu = ((e.self || 0) + Math.min(e.univ || 0, E.univLimit) + Math.min(e.school || 0, E.schoolLimit) + Math.min(e.preschool || 0, E.schoolLimit)) * E.rate;
    rows.push({ key: "education", label: "교육비", value: edu });
    const d = sp.donation || {}, DN = C.donation;
    const ht = Math.min(d.hometown || 0, DN.hometownLimit);
    const htFull = Math.min(ht, DN.hometownFull) * DN.hometownFullRate + Math.max(0, Math.min(ht, DN.hometownMid) - DN.hometownFull) * DN.hometownMidRate + Math.max(0, ht - DN.hometownMid) * DN.rate;
    const g = d.general || 0;
    const gen = Math.min(g, DN.highFrom) * DN.rate + Math.max(0, g - DN.highFrom) * DN.highRate;
    rows.push({ key: "donation", label: "기부금", value: htFull + gen });
    return { rows, total: rows.reduce((s, r) => s + r.value, 0) };
  };
  /** 월세 세액공제. rent: 연간 월세 합계 */
  TX.rentCredit = function (rent, gross, totalIncome) {
    const R = D.credits.rent;
    if (gross > R.grossMax || (totalIncome != null && totalIncome > R.incomeMax)) return { credit: 0, rate: 0, eligible: 0 };
    const rate = gross <= R.lowGrossMax ? R.rateLow : R.rateHigh;
    const eligible = Math.min(rent || 0, R.limit);
    return { credit: eligible * rate, rate, eligible };
  };

  /**
   * 연말정산(근로소득만 있는 거주자). 표준세액공제와 항목별 공제를 모두 계산해 유리한 쪽을 고른다.
   * 입력(모두 연간 원 단위): gross(총급여), people(TX.personalDeduction 입력), ins:{pension, health, employ},
   *   housing(TX.housingDeduction 입력), card(TX.cardDeduction 입력), cardPrev, kids8(8세 이상 자녀 수), births,
   *   pensionAcct:{saving, irp, isaTransfer}, special(TX.specialCredits 입력), rent, marriage(bool), prepaid(기납부 소득세)
   */
  TX.yearEnd = function (x) {
    const gross = x.gross || 0;
    const earnedDed = TX.earnedDeduction(gross);
    const earned = gross - earnedDed;
    const pers = TX.personalDeduction(x.people || {});
    const pensionIns = (x.ins && x.ins.pension) || 0;
    const healthEmploy = ((x.ins && x.ins.health) || 0) + ((x.ins && x.ins.employ) || 0);
    const house = TX.housingDeduction(x.housing || {}, gross);
    const card = TX.cardDeduction(x.card || {}, gross, { kids: x.kidsAll != null ? x.kidsAll : (x.people && x.people.children) || 0, prev: x.cardPrev });
    const kidsCr = TX.childCredit(x.kids8 || 0) + TX.birthCredit(x.births);
    const pen = TX.pensionCredit(x.pensionAcct || {}, gross);
    const sp = TX.specialCredits(x.special || {}, gross);
    const rent = TX.rentCredit(x.rent || 0, gross);
    const marriage = x.marriage ? D.credits.marriage : 0;

    function run(itemized) {
      const special = itemized ? healthEmploy + house.total : 0;
      const other = card.deduction;
      let base = earned - pers.total - pensionIns - special - other;
      base = Math.max(0, base);
      const calc = TX.incomeTax(base);
      const ec = TX.earnedCredit(calc.tax, gross);
      const credits = [
        { key: "earned", label: "근로소득세액공제", value: ec.credit },
        { key: "child", label: "자녀·출산", value: kidsCr },
        { key: "pension", label: "연금계좌", value: pen.credit },
        { key: "marriage", label: "혼인", value: marriage },
      ];
      if (itemized) { sp.rows.forEach((r) => credits.push(r)); credits.push({ key: "rent", label: "월세", value: rent.credit }); }
      else credits.push({ key: "standard", label: "표준세액공제", value: D.credits.standardWage });
      // 세액공제는 산출세액을 넘지 못한다(남는 공제는 사라진다)
      let left = calc.tax;
      credits.forEach((c) => { c.used = Math.min(left, c.value); left -= c.used; });
      const decided = trunc10(left);
      return { itemized, special, base, calc, ec, credits, creditTotal: credits.reduce((s, c) => s + c.used, 0), decided, local: TX.local(decided) };
    }
    const A = run(true), B = run(false);
    const best = B.decided < A.decided ? B : A;
    const prepaid = x.prepaid != null ? x.prepaid : 0;
    const prepaidLocal = x.prepaidLocal != null ? x.prepaidLocal : trunc10(prepaid * D.income.localRate);
    const diff = best.decided - prepaid, diffLocal = best.local - prepaidLocal;
    return {
      gross, earnedDed, earned, personal: pers, pensionIns, healthEmploy, house, card, pen, sp, rent, kidsCr, marriage,
      itemized: A, standard: B, best, chose: best === B ? "standard" : "itemized",
      decided: best.decided, local: best.local, total: best.decided + best.local,
      prepaid, prepaidLocal, refund: -(diff + diffLocal), diff, diffLocal,
      effective: gross ? (best.decided + best.local) / gross : 0,
      marginal: best.calc.rate * (1 + D.income.localRate),
    };
  };

  /* ------------------------------------------------------------ 종합소득 */
  /** 사업소득(장부 없이 추계). {revenue, rate(단순경비율), books:"simple"|"ledger", expenses} */
  TX.business = function (b) {
    const expenses = b.books === "ledger" ? b.expenses || 0 : (b.revenue || 0) * (b.rate || 0);
    const income = Math.max(0, (b.revenue || 0) - expenses);
    const withheld = trunc10((b.revenue || 0) * D.business.withholding);
    return { revenue: b.revenue || 0, expenses, income, withheld, withheldLocal: trunc10(withheld * D.income.localRate) };
  };
  /** 기타소득(강연료·원고료 등 필요경비 의제). amount: 지급액 */
  TX.otherIncome = function (amount, expenseRate) {
    const O = D.other;
    const er = expenseRate == null ? O.expenseRate : expenseRate;
    const income = amount * (1 - er);
    const withheld = income <= O.minTaxable ? 0 : trunc10(income * O.withholding);
    return { amount, income, withheld, withheldLocal: trunc10(withheld * D.income.localRate), separable: income <= O.separateMax };
  };
  /**
   * 종합소득세(근로 + 사업 + 기타). 근로 쪽 공제·세액공제는 TX.yearEnd 결과를 그대로 쓰는 교육용 단순화.
   * {ye: TX.yearEnd 결과, business: TX.business 결과, other: {income, separate:bool, withheld}, extraDeduction}
   */
  TX.comprehensive = function (o) {
    const ye = o.ye, best = ye.best;
    const bizIncome = o.business ? o.business.income : 0;
    const oth = o.other && !o.other.separate ? o.other.income : 0;
    const base = Math.max(0, best.base + bizIncome + oth);
    const calc = TX.incomeTax(base);
    // 근로소득세액공제는 근로소득 몫의 산출세액에 비례(교육용 근사)
    const share = base > 0 ? Math.min(1, best.base / base) : 1;
    const ec = TX.earnedCredit(calc.tax * share, ye.gross).credit;
    let left = calc.tax;
    const credits = best.credits.map((c) => ({ ...c, value: c.key === "earned" ? ec : c.value }));
    credits.forEach((c) => { c.used = Math.min(left, c.value); left -= c.used; });
    const decided = trunc10(left);
    const prepaid = ye.decided + (o.business ? o.business.withheld : 0) + (o.other && !o.other.separate ? o.other.withheld : 0);
    const due = decided - prepaid;
    return { base, calc, credits, decided, local: TX.local(decided), prepaid, due, dueLocal: trunc10(Math.abs(due) * D.income.localRate) * Math.sign(due), marginal: calc.rate };
  };

  /* ------------------------------------------------------------ 투자 */
  /**
   * 금융소득(이자·배당) 과세. {interest, dividend(배당가산 대상 배당), otherBase(다른 종합소득 과세표준)}
   * 연 기준금액 이하면 원천징수로 끝(분리과세). 넘으면 비교과세: max(종합과세 산출세액, 분리과세였을 때 산출세액)
   */
  TX.financial = function (f) {
    const F = D.financial;
    const fin = (f.interest || 0) + (f.dividend || 0);
    const other = f.otherBase || 0;
    const withheld = fin * F.withholding;
    if (fin <= F.threshold) {
      const otherTax = TX.incomeTax(other).tax;
      return { fin, comprehensive: false, withheld, extra: 0, grossUp: 0, divCredit: 0, total: withheld, otherTax, steps: [] };
    }
    // 기준금액 초과분에 들어간 배당만 가산(이자 먼저 기준금액을 채운다)
    const over = fin - F.threshold;
    const divOver = Math.max(0, Math.min(f.dividend || 0, over));
    const G = divOver * F.grossUp;
    const general = TX.incomeTax(other + over + G).tax + F.threshold * F.withholding;
    const compare = TX.incomeTax(other).tax + fin * F.withholding;
    const divCredit = Math.max(0, Math.min(G, general - compare));
    const tax = Math.max(general - divCredit, compare);
    const otherTax = TX.incomeTax(other).tax;
    return { fin, comprehensive: true, withheld, grossUp: G, general, compare, divCredit, total: tax - otherTax, extra: tax - otherTax - withheld, otherTax };
  };
  /** 고배당기업 배당 분리과세(해당 연도에 제도가 있을 때). amount: 대상 배당 */
  TX.highDividend = function (amount) {
    const H = D.financial.highDividend;
    if (!H || !H.active) return null;
    const r = TX.progressive(H.rates, amount);
    return { tax: r.tax, local: r.tax * D.income.localRate, rate: r.rate, steps: r.steps };
  };
  /** ISA. {profit(손익 통산 후 순이익), type:"general"|"low"} → 일반 계좌 대비 세금 */
  TX.isa = function (o) {
    const I = D.isa;
    const free = o.type === "low" ? I.freeLow : I.freeGeneral;
    const taxable = Math.max(0, (o.profit || 0) - free);
    const tax = taxable * I.overRate;
    const plain = Math.max(0, o.grossProfit != null ? o.grossProfit : o.profit || 0) * D.financial.withholding;
    return { free, taxable, tax, plain, saved: plain - tax };
  };
  /** 연금 수령 세금. {amount(연간 사적연금 수령액, 세액공제 받은 원금+운용수익), age, lifetime(종신형), other(다른 종합소득 과세표준)} */
  TX.pensionPayout = function (o) {
    const P = D.pension;
    const rate = o.lifetime ? Math.min(P.payoutRates.lifetime, rateByAge(o.age)) : rateByAge(o.age);
    function rateByAge(age) { const r = P.payoutRates.byAge.find((x) => age < (x.under == null ? Infinity : x.under)); return r ? r.rate : P.payoutRates.byAge[P.payoutRates.byAge.length - 1].rate; }
    const amt = o.amount || 0;
    const low = amt * rate * (1 + D.income.localRate);
    const out = { rate, separate: null, comprehensive: null, chosen: null };
    if (amt <= P.separateLimit) { out.chosen = out.separate = low; out.mode = "low"; return out; }
    out.separate = amt * P.overSeparateRate * (1 + D.income.localRate);
    // 종합과세: 연금소득공제는 생략한 교육용 근사
    const other = o.other || 0;
    out.comprehensive = (TX.incomeTax(other + amt).tax - TX.incomeTax(other).tax) * (1 + D.income.localRate);
    out.chosen = Math.min(out.separate, out.comprehensive);
    out.mode = out.chosen === out.separate ? "separate" : "comprehensive";
    return out;
  };
  /** 연금 수령 한도(연금수령연차 k년째, 연초 평가액 value) */
  TX.pensionLimit = (value, k) => (k >= D.pension.limitFreeYear ? Infinity : value / (D.pension.limitBase - k) * D.pension.limitMult);
  /** 해외 주식 양도소득세. gains/losses: 그 해 실현 손익 합(원). */
  TX.overseasStock = function (gain) {
    const S = D.stock.overseas;
    const base = Math.max(0, gain - S.deduction);
    const tax = base * S.rate;
    return { gain, base, tax, local: tax * D.income.localRate, total: tax * (1 + D.income.localRate) };
  };
  /** 국내 상장주식: 거래세(매도할 때)와 대주주 양도세. {sell(매도 금액), market:"kospi"|"kosdaq", gain, major(bool)} */
  TX.domesticStock = function (o) {
    const S = D.stock.domestic;
    const t = S.transactionTax[o.market || "kospi"];
    const txTax = (o.sell || 0) * (t.tax + (t.rural || 0));
    let cgt = 0;
    if (o.major && o.gain > 0) cgt = TX.progressive(S.majorRates, Math.max(0, o.gain - S.majorDeduction)).tax * (1 + D.income.localRate);
    return { txTax, rate: t.tax + (t.rural || 0), cgt };
  };
  /** 가상자산 소득. {gain(그 해 실현 손익 합), year} */
  TX.crypto = function (o) {
    const C = D.crypto;
    const year = o.year || D.year;
    if (year < C.startYear) return { active: false, base: 0, tax: 0, total: 0 };
    const base = Math.max(0, (o.gain || 0) - C.deduction);
    const tax = base * C.rate;
    return { active: true, base, tax, total: tax * (1 + D.income.localRate) };
  };

  /* ------------------------------------------------------------ 상속·증여 */
  TX.transferTax = (base) => TX.progressive(D.transfer.rates, base);
  /** 증여재산공제(10년 한도). relation: "spouse"|"parentToAdult"|"parentToMinor"|"childToParent"|"relative"|"other" */
  TX.giftDeduction = function (relation, opt = {}) {
    const G = D.gift.deduction;
    let d = G[relation] || 0;
    if (opt.marriage && (relation === "parentToAdult" || relation === "parentToMinor")) d += D.gift.marriageBirth;
    return d;
  };
  /**
   * 증여세. {value(이번 증여), relation, prior(같은 사람에게서 10년 내 받은 증여 합), priorTax(그때 낸 산출세액),
   *   usedDeduction(이미 쓴 공제), marriage(혼인·출산 공제 사용), skip(세대 생략), filed(기한 내 신고)}
   */
  TX.giftTax = function (g) {
    const G = D.gift;
    const ded = Math.max(0, TX.giftDeduction(g.relation, g) - (g.usedDeduction || 0));
    const total = (g.value || 0) + (g.prior || 0);
    const base = Math.max(0, total - ded);
    const calc = TX.transferTax(base);
    let tax = calc.tax;
    if (g.skip) tax *= 1 + (g.minorOver && (g.value || 0) > G.skipMinorOver ? G.skipRateMinor : G.skipRate);
    tax = Math.max(0, tax - (g.priorTax || 0));
    if (base < D.transfer.minBase) tax = 0;
    const credit = g.filed === false ? 0 : tax * D.transfer.filingCredit;
    const pay = Math.max(0, tax - credit);
    return { deduction: ded, base, rate: calc.rate, calc: calc.tax, tax, credit, pay, effective: g.value ? pay / g.value : 0 };
  };
  /**
   * 상속세. {estate(상속재산 총액, 사전증여 제외), debts(채무), funeral(장례비), priorGifts(합산 대상 사전증여), priorGiftTax,
   *   spouse(배우자가 실제 받는 금액, 없으면 null), spouseShare(배우자 법정상속분 비율), children, minors:[나이...], elderly, financial(순금융재산),
   *   cohabitHouse(동거주택 가액, 요건 충족 시), filed}
   */
  TX.inheritTax = function (h) {
    const I = D.inherit;
    const funeral = clamp(h.funeral == null ? I.funeral.min : h.funeral, I.funeral.min, I.funeral.max);
    const gross = (h.estate || 0) + (h.priorGifts || 0);
    const taxable = Math.max(0, gross - (h.debts || 0) - funeral);
    const basicPlus = I.basic + (h.children || 0) * I.child + (h.minors || []).reduce((s, a) => s + Math.max(0, I.minorAge - a) * I.minorPerYear, 0) + (h.elderly || 0) * I.elderly;
    const personal = Math.max(I.lump, basicPlus);
    let spouse = 0;
    if (h.spouse != null) {
      // 실제 받은 금액과 법정상속분 한도 중 작은 값, 단 최소·최대 사이
      const legal = Math.max(0, ((h.estate || 0) + (h.priorGifts || 0) - (h.debts || 0)) * (h.spouseShare || 0) - (h.spousePriorGift || 0));
      spouse = clamp(Math.min(h.spouse, legal), I.spouse.min, I.spouse.max);
    }
    const fin = (function (f) { const F = I.financial; if (!f) return 0; if (f <= F.fullUpTo) return f; return Math.min(F.max, Math.max(F.fullUpTo, f * F.rate)); })(h.financial || 0);
    const house = Math.min(I.cohabit.max, (h.cohabitHouse || 0) * I.cohabit.rate);
    let deduction = personal + spouse + fin + house;
    // 상속공제 종합한도: 과세가액에서 사전증여(상속인)를 뺀 금액
    const cap = Math.max(0, taxable - (h.priorGifts || 0));
    deduction = Math.min(deduction, cap);
    const base = Math.max(0, taxable - deduction);
    const calc = TX.transferTax(base);
    let tax = Math.max(0, calc.tax - (h.priorGiftTax || 0));
    if (base < D.transfer.minBase) tax = 0;
    const credit = h.filed === false ? 0 : tax * D.transfer.filingCredit;
    const pay = Math.max(0, tax - credit);
    return { gross, funeral, taxable, personal, lumpUsed: personal === I.lump, spouse, fin, house, deduction, cap, base, rate: calc.rate, calc: calc.tax, tax, credit, pay, effective: gross ? pay / gross : 0 };
  };

  /* ------------------------------------------------------------ 케이스: 다온의 세금 노트 */
  // 가상의 인물. 숫자는 이 책의 모든 장이 함께 쓴다. 세법 값이 아니라 인물의 사정이므로 여기에 둔다.
  TX.CASE = {
    name: "정다온", age: 32, job: "식품회사 브랜드마케터(입사 7년 차)",
    salaryContract: 52.4e6,            // 연봉 계약액(식대 포함)
    monthly: 52.4e6 / 12,              // 세전 월급
    mealMonthly: 2e5,                  // 월 식대(비과세)
    home: { deposit: 2e7, rent: 6.5e5, area: 33 },   // 서울 마포구 원룸 월세, 전용 33㎡, 무주택 세대주
    card: { credit: 1.38e7, debit: 4.6e6, cash: 1.1e6, culture: 4e5, market: 3e5, transit: 8.4e5 },
    cardPrev: 1.95e7,                  // 2025년 카드 등 사용액
    insurance: 9.6e5,                  // 보장성 보험료(실손 포함) 연
    medical: { self: 2.2e6, other: 0 }, // 치과 치료 등 본인 의료비
    pensionSaving: 3e6,                // 연금저축 월 25만원
    subscription: 2.4e6,               // 주택청약종합저축 월 20만원
    donation: { hometown: 1e5, general: 2.4e5 },
    side: { revenue: 6.8e6, rate: null, label: "일러스트 외주(사업소득, 3.3% 원천징수)" },
    lecture: 1e6,                      // 강연료(기타소득)
    deposit: { principal: 3e7, rate: 0.031 },        // 정기예금
    isa: { opened: 2025, type: "general", balance: 1.8e7, profit2026: 1.6e6 },
    us: { gain: 4.6e6, loss: 9e5 },    // 미국 상장 ETF·주식 2026년 실현 손익
    coin: { cost: 3e6, value: 4.2e6 }, // 가상자산 보유분
    parents: { father: 64, mother: 61, house: 9.2e8, deposits: 3.1e8, brother: 29 },
    partner: "이준", wedding: 2027,    // 2027년 봄 혼인신고 예정
  };

  /** 다온의 한 해: 매달 원천징수(100%) 합계와 4대보험 */
  TX.casePayroll = function (ratio) {
    const C = TX.CASE;
    return TX.payroll({ monthly: C.monthly, nontax: C.mealMonthly, family: 1, kids: 0, ratio: ratio || 1 });
  };
  /** 다온의 연말정산 입력(TX.yearEnd에 그대로 넣는다). over로 일부 값을 바꿀 수 있다 */
  TX.caseYearEnd = function (over) {
    const C = TX.CASE, pr = TX.casePayroll((over && over.ratio) || 1);
    const gross = (C.monthly - C.mealMonthly) * 12;
    const x = {
      gross,
      people: { woman: false },
      ins: { pension: pr.ins.pension * 12, health: (pr.ins.health + pr.ins.care) * 12, employ: pr.ins.employ * 12 },
      housing: { subscription: C.subscription },
      card: Object.assign({}, C.card), cardPrev: C.cardPrev,
      kids8: 0, births: [],
      pensionAcct: { saving: C.pensionSaving, irp: 0 },
      special: { insurance: C.insurance, medical: { self: C.medical.self, other: C.medical.other }, education: {}, donation: { hometown: C.donation.hometown, general: C.donation.general } },
      rent: C.home.rent * 12,
      marriage: false,
      prepaid: pr.tax * 12, prepaidLocal: pr.local * 12,
    };
    return Object.assign(x, over || {});
  };

  if (isNode) module.exports = TX;
  else root.TX = TX;
})(typeof window !== "undefined" ? window : globalThis);

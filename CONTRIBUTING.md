# TaxBook 챕터 작성 가이드

빌드 과정 없는 정적 사이트다. `index.html` + `chapters/<slug>.html` + 공통 `css/style.css`, `js/common.js`(전역 `TB`), `js/tax.js`(전역 `TX`), 세법 수치 `data/tax-YYYY.json`.
로컬 실행: `python3 -m http.server 8000` → http://localhost:8000 . 세법 수치를 `fetch`로 읽으므로 `file://`로 열면 시뮬레이터가 돌지 않는다(화면에 안내가 뜬다). classic script만 쓴다. ES module 금지.
레이아웃·헬퍼 코드는 같은 시리즈의 [EstateBook](https://github.com/geniuskey/estatebook)(원래는 [MoneyBook](https://github.com/geniuskey/moneybook))에서 가져왔다. 전역 이름만 `EB` → `TB`로 바꿨다. CSS 클래스 이름(`eb-*`)은 그대로다.
문체와 시뮬레이터 수준은 EstateBook의 [사고팔 때의 세금](https://estatebook.euiyun.com/chapters/tradetax.html)과 MoneyBook의 [세금](https://moneybook.euiyun.com/chapters/tax.html)을 본보기로 삼는다. MoneyBook 세금 장과 겹치는 내용은 더 깊게 쓰고 전체 URL로 링크한다. 집에 붙는 세금(취득세·보유세·양도세)은 EstateBook [13장](https://estatebook.euiyun.com/chapters/holdingtax.html)·[14장](https://estatebook.euiyun.com/chapters/tradetax.html)에 맡기고 링크한다.

## 기여물의 라이선스
실행 코드는 MIT, 본문·그림·문제·해설 등 교육 콘텐츠는 CC BY 4.0. 구분은 [라이선스 안내](LICENSE.md)를 따른다.

## 해마다 고치는 곳은 두 군데뿐이다
1. **`data/tax-YYYY.json`** — 세율·공제율·한도·기준 금액·시행 연도. 새 귀속 연도에는 이 파일을 복사해 `tax-2027.json`처럼 만들고 값을 고친다. 페이지는 주소의 `?year=`가 없으면 올해부터 거꾸로 찾아 가장 최근 파일을 쓴다(`TX.MIN_YEAR`가 가장 오래된 연도).
2. **`chapters/revision.html`(16장 올해 바뀐 세법)** — 그 해 개정의 요약과, 어느 장·시뮬레이터가 영향을 받는지.

그래서 본문과 시뮬레이터에는 **세법 숫자를 직접 쓰지 않는다.**
- 본문의 세법 값은 `<span data-t="card.threshold" data-f="pct"></span>`처럼 JSON 경로로 쓴다. `TX.fill`이 채운다. 형식 `data-f`(생략하면 1 미만은 `pct`, 1900~2100 정수는 연도 그대로, 나머지 숫자는 `won`): `won`("1억 2,346만원"), `wonfull`("1,234,567원"), `man`("300만원"), `pct`("15%"), `pct1`, `num`, `raw`(문자열 그대로).
- 기준 연도는 `<span data-t="label"></span>`("2026년 귀속 기준"), `<span data-t="year"></span>`("2026"), 신고·정산 연도는 `<span data-t="settleYear"></span>`("2027")로 쓴다. 장마다 첫머리(lead 또는 첫 절)와 `.callout.warn`에서 한 번씩 기준 연도를 밝힌다.
- 법령 근거는 `<a data-src="income.rates"></a>`처럼 쓰면 `refs`의 조문 이름과 원문 링크가 들어간다.
- 시뮬레이터 코드는 `TX.D`(JSON)와 `TX.*` 함수만 쓴다. 상수가 필요하면 JSON에 키를 더하고, 그 키를 [SOURCES.md](SOURCES.md)에도 적는다.
- 세법이 아닌 숫자(다온의 연봉, 카드 사용액, 수익률 가정)는 직접 써도 된다. 다온의 숫자는 `TX.CASE`에 있다.
- 케이스 노트에 들어가는 세액·환급액처럼 세법 값으로 계산되는 숫자는 본문에 고정해 쓰지 않고 `<b id="note-refund"></b>`처럼 자리를 두고 장 스크립트에서 엔진으로 계산해 채운다. 그래야 내년 JSON으로 바꿔도 이야기가 맞는다. 단 "약 5,000만원"처럼 인물의 사정은 고정해도 된다.
- 개정으로 제도 자체가 생기거나 없어지는 경우(예: 가상자산 과세 시작 연도)는 JSON의 시작·종료 연도 값(`crypto.startYear`, `financial.highDividend.active` 등)으로 분기한다.

## 이 책이 답하려는 질문
1. **내 세금은 어디서 얼마나 빠져나가는가.** 월급에서 매달 떼는 세금, 연말정산, 5월 신고가 하나의 흐름이라는 것을 보여 준다. 원천징수는 "미리 낸 세금"이고 연말정산은 "정산"이다.
2. **공제는 얼마짜리인가.** 소득공제 100만원의 값은 한계세율이 정하고, 세액공제 100만원은 그대로 100만원이다. 문턱(총급여 25%, 3%), 한도, 공제율이 공제의 실제 값을 어떻게 깎는지 숫자로 보인다.
3. **투자 수익에는 어떤 세금이 붙는가.** 같은 수익도 계좌(일반·ISA·연금)와 자산(예금·국내주식·해외주식·가상자산)에 따라 세금이 0%에서 수십 %까지 갈린다.
4. **재산을 넘겨줄 때의 세금은 어떻게 계산되는가.** 증여는 받는 사람 기준·10년 합산, 상속은 남긴 재산 전체 기준. 공제와 누진세율이 언제 넘겨주느냐를 바꾼다.
5. **독자 모두에게 쓸모 있게.** 첫 연말정산을 앞둔 사회초년생, 부업을 시작한 직장인, 투자를 시작한 사람, 부모의 재산 이전을 고민하는 사람. 본문은 사전 지식 없는 일반인 기준. 현장 실무는 `.callout.pro`(실무 노트), 신고·제출 전에 직접 확인할 항목은 `.callout.check`(신고 전 체크), 깊은 이야기는 `.callout.deep`(심화).

## 원칙
- **한국어**, 평서문 "~다", 이모지 금지. 용어는 처음 나올 때 `<span class="term">과세표준</span><span class="en">(Tax base)</span>`처럼 쓰고 한 문장으로 풀어 준다. 현장 말(13월의 월급, 토해내기, 맞벌이 몰아주기, 3.3%)은 쓰되 바로 뜻을 풀어 준다.
- **만져 보며 배우기**(Bartosz Ciechanowski가 본보기).
  - 개념 하나에 조작 가능한 그림 하나. 정적인 SVG는 장마다 1~3개(흐름도, 구조도, 비교).
  - 한 시뮬레이터는 **한 가지**만 보여 준다. 슬라이더는 1~3개. 장마다 4~6개(6장 연말정산 계산기는 예외로 크다).
  - 앞 시뮬레이터에서 만진 것 위에 다음 것을 쌓는다. 시뮬레이터 바로 앞에서 "무엇을 움직여 볼지", 바로 뒤에서 "무엇을 봤는지"를 말한다.
  - 캔버스 위 직접 끌기(`TB.drag`)를 적극적으로 쓴다(과세표준 막대의 끝 끌기, 카드 사용액 막대 끌기, 증여 시점 끌기). 끌 수 있는 것에는 손잡이를 그린다.
  - 값을 끝까지 밀었을 때 **무너지는 모습**이 보여야 한다: 한도에 걸려 더 써도 공제가 늘지 않는다, 세액공제가 산출세액을 넘으면 사라진다, 금융소득이 기준금액을 넘으면 세율이 뛴다, 10년 안에 다시 주면 합산된다. 한계가 배울 점이다.
  - 결과는 숫자(`.sim-readout`)로도 보여 준다. 금액은 `TB.won()`으로.
  - 애니메이션은 `TB.loop`. 화면 밖에서는 자동으로 멈춘다.
- 순서: 일상의 질문 → 조작 가능한 그림 → 원리(수식은 KaTeX, 장마다 0~3개) → 시뮬레이터 → 실제 제도·수치 → 다온의 세금 노트 → 핵심 정리 → 확인 퀴즈(4문항, 정답 위치 섞기).
- **세법 수치는 `data/tax-YYYY.json` 기준.** 값마다 근거는 JSON의 `refs`와 [SOURCES.md](SOURCES.md)에 있다. 1차 출처는 국가법령정보센터(소득세법·조세특례제한법·상속세 및 증여세법과 시행령), 국세청(연말정산 안내, 세율표), 기획재정부(2026년부터 재정경제부로 표기되는 자료가 있다) 세법개정 자료다. 확인하지 못한 값은 JSON에 `"_status": "확인 필요"`를 붙이고 본문에서 '약'이나 "확인 필요"로 쓴다. 장마다 한 번은 `.callout.warn`으로 "세법은 해마다 바뀐다, 이 장의 값은 <span data-t="label">"을 말한다. 국회를 통과하지 않은 개정안은 "추진 중", "확정 전"이라고 분명히 쓰고, 엔진 계산에 넣지 않는다.
- **지어낸 통계·판례·사건번호를 쓰지 않는다.** 실제 통계(국세통계 등)는 출처와 기준 연도를 밝히고, 확보하지 못하면 쓰지 않는다. 분쟁은 "이런 유형의 실수가 많다" 수준으로 일반화한다.
- **절세 상품을 권하지 않는다.** 특정 금융회사·상품·앱·세무법인 이름을 쓰지 않는다(공공기관·제도 이름, 홈택스·손택스는 괜찮다). "무조건 IRP에 넣어라" 대신 공제율과 묶이는 기간·유동성을 함께 보인다. 탈세와 절세를 구분한다(차명, 현금 거래 누락, 가공 경비는 다루되 위법이라는 것과 가산세를 함께).
- 외부 라이브러리는 KaTeX만. 이미지 대신 인라인 SVG/canvas.
- 색은 CSS 변수(`var(--accent)`)나 `TB.palette()`. 돌려받는 돈·남는 돈(환급, 공제, 세후 수익)은 `--ok`, 내는 돈(세금, 추가 납부, 가산세)은 `--bad`, 주의는 `--warn`, 주제색은 `--accent`(자주색), 보조는 `--accent-2`(호박색).
- 모바일(폭 360px)에서 가로 스크롤 금지. SVG는 `viewBox`만 주고(폭 420~480) width/height 생략.
- 다른 장은 `<a href="credit.html">5장</a>`처럼 링크한다.

## head 블록
모든 HTML 페이지에는 아래 Cloudflare Web Analytics 코드를 `<head>`에 한 번 포함한다. SEO 자동 생성 블록 밖에 두며 시리즈 공통 Site Token을 유지한다.

각 챕터 `<head>`에는 아래 표식만 두고 `python3 tools/head.py <slug>`를 실행한다(인자 없이 실행하면 전체 장 + 사이트맵 + `index.html`의 JSON-LD를 갱신한다). 제목·번호는 `js/common.js`의 `CHAPTERS`에서 읽는다. `js/tax.js`는 항상 함께 불러온다.
```html
<!doctype html>
<!-- Copyright (c) 2026 geniuskey and TaxBook contributors.
     Executable code: MIT (see ../LICENSE-MIT).
     Text, illustrations, questions and explanations: CC-BY-4.0 (see ../LICENSE.md). -->
<html lang="ko">
<head>
<!--head:start {"desc": "한 문장 설명"}-->
<!--head:end-->
<!-- Cloudflare Web Analytics -->
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"3d6151a0abc94ede89285d462527fa80"}'></script>
<!-- End Cloudflare Web Analytics -->
</head>
```

## 페이지 골격
```html
<body data-chapter="slug">
<main class="chapter">
  <header class="chapter-hero">
    <div class="eyebrow">Chapter NN · <span data-t="label"></span></div><h1>제목</h1><p class="lead">…</p>
    <ul class="objectives"><li>…</li></ul>
  </header>
  <section id="영문-id"><h2>절 제목</h2> … </section>
  <section class="keypoints" id="summary"><h2>핵심 정리</h2><ol><li>…</li></ol></section>
  <section class="quiz-sec" id="quiz"><h2>확인 퀴즈</h2><div class="quiz"> … </div></section>
</main>
<script>
TX.ready(function (D) {
  "use strict";
  /* 시뮬레이터: 세법 값은 D 또는 TX 함수에서 */
});
</script>
</body>
```
상단바·챕터 목록·세 부 띠·오른쪽 목차·h2 번호·이전/다음·푸터·퀴즈 동작·KaTeX 렌더는 `common.js`가, 세법 값 채우기는 `tax.js`가 자동으로 한다. 시뮬레이터 코드는 반드시 `TX.ready(function (D) { … })` 안에 둔다(JSON을 불러온 뒤 실행된다). 퀴즈 해설에 세법 값이 들어가면 `data-t`를 쓴다.

## 컴포넌트
- 그림: `<figure class="diagram"><svg viewBox="0 0 440 300" role="img" aria-label="…">…</svg><figcaption><b>그림 1. 제목.</b> 설명</figcaption></figure>`. SVG 안에서는 `.lbl`, `.lbl-dim`, `.lbl-b`, `.lbl-acc`, `.lbl-acc2`, `.lbl-bad`, `.t-mono`, `.s-line`, `.s-axis`, `.s-acc`, `.s-acc2`, `.s-ok`, `.s-dash`, `.s-bad`, `.f-surface`, `.f-elev`, `.f-acc`, `.f-acc2`, `.f-ok`, `.f-warn`, `.f-bad`, `.f-acc-soft`, `.f-acc2-soft`, `.f-ok-soft`, `.f-warn-soft`, `.f-bad-soft` 클래스를 쓴다. 색을 직접 적지 않는다(다크 모드). 화살표 머리는 `<marker>`에 `fill="context-stroke"`, marker id는 장 안에서 겹치지 않게. SVG 안의 글자에는 `data-t`를 쓸 수 없으니(`<tspan data-t>`는 된다) 세법 값이 필요한 그림은 `<tspan data-t="…" data-f="…"></tspan>`를 쓴다.
- 시뮬레이터:
```html
<div class="sim" id="sim-x">
  <div class="sim-head"><span class="sim-tag">SIMULATOR</span><h3>제목</h3></div>
  <div class="sim-body side">
    <div class="sim-view"><canvas id="x-cv"></canvas></div>
    <div class="sim-controls">
      <label class="ctrl"><span>이름 <output id="x-a-out"></output></span><input type="range" id="x-a" min="0" max="10" step="0.1" value="3"></label>
      <div class="seg" id="x-mode"><button data-value="a" class="on">A</button><button data-value="b">B</button></div>
      <label class="check"><input type="checkbox" id="x-c"> 옵션</label>
      <div class="btn-row"><button class="btn primary" id="x-go">실행</button><button class="btn" id="x-re">다시</button></div>
    </div>
  </div>
  <div class="sim-readout"><div class="stat"><span class="k">이름</span><span class="v" id="x-o-1">—</span></div></div>
  <div class="sim-note">해볼 것: ① … ② … ③ … (모델의 가정과 생략한 규정)</div>
</div>
```
  컨트롤이 없거나 캔버스를 직접 끄는 시뮬레이터는 `.sim-body`에서 `side`를 빼고 `.sim-view` 안에 `<span class="hint">끌어서 움직인다</span>`를 둔다. `<select>`는 쓰지 않는다(`.seg`). 숫자를 직접 입력받을 때는 `<input type="number" class="num-in">`를 쓴다(6장).
- 수식: `<div class="formula">$$…$$<div class="where">기호 설명</div></div>`, 문장 속은 `\(…\)`.
- 강조 상자: `.callout`, `.callout.tip`, `.callout.warn`, `.callout.deep`(심화), `.callout.pro`(실무 노트), `.callout.check`(신고 전 체크). 첫 `<strong>`이 제목이다. **장마다 `.callout.pro` 1~2개, `.callout.check` 1~2개.** 실무 노트는 회사 급여 담당자·세무 실무에서 흔한 실수와 순서(간소화 자료에 안 잡히는 항목, 부양가족 중복 공제, 맞벌이 몰아주기, 수정신고·경정청구)를, 신고 전 체크는 홈택스·서류에서 직접 확인할 항목을 담는다.
- 표: `<div class="table-wrap"><table>…</table></div>`. 숫자 칸은 `class="num"`. 세율표는 JSON에서 만들어 넣는다(`TX.quickTable(D.income.rates)`).
- 영수증·계산서: `<div class="slip"><div class="row"><span>결정세액</span><span id="…"></span></div>…<div class="row total"><span>차감징수세액</span><span>…</span></div></div>`.
- 금액 색: `<span class="won plus">+50만원</span>`, `<span class="won minus">−12만원</span>`.
- 퀴즈: `<div class="quiz-q"><p>문제</p><div class="opts"><button class="opt">…</button><button class="opt" data-correct>정답</button></div><div class="quiz-exp">해설</div></div>`.
- 다온의 세금 노트(아래 참조):
```html
<div class="casefile">
  <div class="tag"><b>NOTE 다온</b><span>세금 노트 · 2026년 3월</span></div>
  <h4>…</h4>
  <p>…이 장의 방법을 다온에게 적용한 결과. 숫자 자리는 id를 두고 스크립트에서 채운다…</p>
  <div class="clue"><div><b>이 장에서 정리한 것</b>…</div><div><b>아직 남은 문제</b>…</div><div><b>다음 장</b>…</div></div>
</div>
```

## 이어지는 케이스: 다온의 세금 노트
책 전체가 가상의 인물 **정다온(32)** 한 사람이 2026년 한 해 동안 세금을 정리하는 노트를 따라간다. 각 장 끝(핵심 정리 앞)에 `.casefile` 하나를 넣고, 아래 표에서 **자기 장에 해당하는 내용만** 다룬다. 노트에는 날짜를 붙인다(2026년 1월 ~ 2027년 5월). 뒤 장의 결론을 미리 말하지 않는다. 세금 숫자는 `TX.CASE`와 엔진으로 계산해 채운다(`node -e 'const TX=require("./js/tax.js"); TX.use(require("./data/tax-2026.json")); …'`로 확인). 모든 인물은 가상이다.

- 정다온(`TX.CASE`): 32세, 식품회사 브랜드마케터 입사 7년 차. 2026년 연봉 계약 5,240만원(월 약 436만 6,700원, 그중 식대 월 20만원 비과세) → 총급여 5,000만원. 서울 마포구 원룸(전용 33㎡) 월세: 보증금 2,000만원, 월 65만원. 혼자 사는 무주택 세대주, 부양가족 없음. 주택청약종합저축 월 20만원, 연금저축 월 25만원(2023년부터), 보장성 보험료 연 96만원, 치과 치료 등 본인 의료비 연 220만원, 고향사랑기부 10만원·일반 기부 24만원.
- 카드 등 사용액(2026년): 신용카드 1,380만원, 체크카드 460만원, 현금영수증 110만원, 도서·공연 등 40만원, 전통시장 30만원, 대중교통 84만원(2025년 합계 1,950만원).
- 부업: 주말 일러스트 외주로 연 680만원(3.3% 원천징수), 강연 한 번 100만원(기타소득). 그래서 2027년 5월 종합소득세를 신고해야 한다.
- 투자: 정기예금 3,000만원(연 3.1%), 2025년에 연 중개형 ISA(잔액 약 1,800만원, 주로 국내 상장 해외지수·채권형 ETF, 2026년 순이익 약 160만원), 미국 상장 ETF·주식(2026년 실현 이익 460만원·손실 90만원), 가상자산 원금 300만원(평가액 약 420만원).
- 가족: 아버지 정명호(64)·어머니 김은숙(61), 동생 정민재(29). 부모 재산은 경기 성남시 아파트(시가 약 9억 2,000만원)와 예금 약 3억 1,000만원. 다온은 이준과 2027년 봄 혼인신고를 할 계획이라 부모가 결혼 자금을 도와주겠다고 했다.
- 노트의 원칙: 다온은 세금을 줄이는 요령보다 "내 돈이 어디서 왜 빠져나가는지"를 알고 싶어 한다. 숫자는 영수증·홈택스에서 확인한 것만 노트에 적는다. 모르는 것은 "확인할 것"으로 남긴다.

| 장 | 이 장에서 다루는 것 |
|---|---|
| 01 세금의 지도 | 2026년 1월. 다온 소개, 노트를 시작한 이유(작년 연말정산에서 생각보다 적게 돌려받았다). 다온의 한 해 소득 지도: 근로·사업·기타·이자·배당·해외주식·가상자산(보유만). 각 소득이 어느 세금, 어느 신고로 가는지. 총급여 5,000만원의 한계세율과 실효세율(엔진). |
| 02 월급명세서와 원천징수 | 2026년 1월 월급명세서 해부: 세전 436만 6,700원 → 4대보험 → 간이세액표 소득세·지방소득세 → 실수령액(`TX.payroll`). 80·100·120% 선택이 연말정산 환급과 매달 실수령에 주는 영향. 다온의 선택. |
| 03 총급여에서 과세표준까지 | 연봉 5,240만원 → 비과세 식대 240만원 → 총급여 5,000만원 → 근로소득공제 → 근로소득금액 → 인적공제(본인만 150만원) → 국민연금 공제. 부모님을 부양가족으로 올릴 수 있는지(소득 요건 때문에 안 된다는 것을 확인), 동생과 중복 공제가 안 되는 이유. |
| 04 소득공제 | 카드 사용액으로 본 신용카드 등 소득공제(`TX.cardDeduction`): 문턱 1,250만원, 공제율 섞기, 한도. 체크카드로 바꿨다면 얼마가 늘었나. 청약저축 소득공제 요건(총급여·무주택 세대주). 다온의 결론: 결제 수단보다 문턱과 한도가 먼저다. |
| 05 세액공제 | 근로소득세액공제, 연금저축 300만원의 공제, 보험료, 의료비 220만원이 문턱 3%(150만원)를 넘는 몫, 기부금, 월세 세액공제(연 780만원). 표준세액공제 13만원과 비교. 다온에게 가장 큰 세액공제는 무엇인가. |
| 06 연말정산 계산기 | 2027년 1~2월. 간소화 자료를 받아 전부 넣는다(`TX.yearEnd`). 결정세액, 기납부세액(2장의 원천징수 합계), 환급액. 독자가 자기 숫자로 바꿔 넣는 대표 시뮬레이터. 다온이 작년보다 더 돌려받는 이유. |
| 07 종합소득세 | 2027년 5월. 일러스트 외주 680만원(단순경비율)과 강연료 100만원(기타소득 분리과세 선택 여부)을 근로소득과 합산(`TX.comprehensive`). 3.3%로 미리 낸 세금과 추가 납부·환급. 장부를 쓰면 달라지는 것. |
| 08 금융소득 | 예금 이자(연 3.1%)와 ISA 밖 배당의 15.4%. 다온의 금융소득은 기준금액에 한참 못 미쳐 분리과세로 끝난다. 부모님의 예금 3.1억원(아버지 명의)이 금리에 따라 기준금액을 넘는지 계산(`TX.financial`). |
| 09 ISA | 다온의 ISA 2026년 순이익 약 160만원이 일반 계좌였다면 낸 세금, 비과세 한도, 손익 통산. 의무 기간이 끝나는 2028년의 선택지(해지·연장·연금계좌 전환). |
| 10 연금저축과 IRP | 연금저축 300만원 → 공제 한도까지 채우면 공제가 얼마 늘어나는가. 세액공제는 "나중에 연금소득세로 일부 돌려주는" 과세이연이라는 것. 55세 이후 연금소득세, 중도 인출의 16.5%. 다온의 결정: 2027년부터 IRP 추가 여부(유동성 비상금과 함께 판단). |
| 11 주식과 ETF | 미국 ETF·주식 실현 이익 460만원 − 손실 90만원 → 250만원 공제 → 22% 양도소득세(`TX.overseasStock`), 2027년 5월 신고. 연말에 손실 종목을 팔아 이익과 통산하는 방법과 한계. 국내 주식 거래세. |
| 12 가상자산 | 보유 중인 가상자산(원금 300만원, 평가액 420만원). 과세 시작 연도(`crypto.startYear`)와 취득가액 의제, 250만원 공제. 시작 전후 매도의 차이. 아직 정해지지 않은 것을 "확정 전"으로. |
| 13 증여세 | 2026년 11월. 부모가 결혼 자금으로 주려는 돈: 성년 자녀 공제 5,000만원 + 혼인·출산 공제 1억원(혼인신고 전후 2년). 부모 각각에게 받으면 공제가 어떻게 되는가(직계존속은 합쳐서 한도), 10년 합산, 신고세액공제. 차용증으로 빌리는 경우와의 차이(이자·상환 실체). |
| 14 상속세 | 부모 재산(아파트 9.2억 + 예금 3.1억)을 예로 아버지가 먼저 돌아가신다면 상속세가 얼마인지(일괄공제 5억, 배우자공제, 금융재산 공제) 계산. 상속세가 생각보다 적은 이유와 어머니 다음 상속(2차 상속)에서 커지는 이유. 이야기는 가정이며 아버지는 건강하다는 것을 분명히. |
| 15 상속이냐 증여냐 | 다온 남매에게 10년 단위로 미리 나누어 주는 계획 vs 상속을 기다리는 경우의 세금 합계(사전증여 합산 10년). 부동산 증여의 취득세(EstateBook 링크). 세금보다 먼저 정할 것(부모의 노후 생활비, 형제간 공평). |
| 16 올해 바뀐 세법 | 기준 연도에 바뀐 항목 표, 다온의 연말정산에서 영향을 받은 항목(자녀·카드 한도 등은 해당 없음을 확인), 추진 중인 개정안. |
| 17 용어집 | 케이스 없음. |

## JS 헬퍼 (`TB`, `js/common.js`)
EstateBook의 `EB`와 같다. 이름만 `TB`.
- `TB.canvas(el|선택자, draw(ctx, w, h), {aspect, minHeight, maxHeight, height})` → `{redraw(), ctx, w, h, canvas}`. 만들자마자 draw를 부르므로 draw가 읽는 상태와 컨트롤을 먼저 만든다. draw 안에서 자기 반환값을 참조하지 않는다. 폭에 따라 높이를 바꾸려면 `get height() { … }`.
- `TB.drag(canvas|선택자, {start(x, y, e), move(x, y, e), end(), hover(x, y, e)})`.
- `TB.chart(ctx, box|null, {x, y, logX, logY, xLabel, yLabel, xFmt, yFmt, xTicks, yTicks, series:[{data, color, width, dash, fill}], vlines, hlines, points, bands})` → `{X, Y, box}`. 금액 축은 `yFmt: TB.wonAxis`.
- `TB.bars(ctx, box|null, {labels, stacks:[{label, color, data}], y, yFmt, yLabel, gap, hlines, highlight, valueFmt})`, `TB.donut(ctx, cx, cy, R, items, {inner, center, labels, highlight})`.
- `TB.range(id, fmt, onInput)` → `get()`, `get.set(v)`. `TB.seg(id, onChange)`. `TB.stat(id, html)`. `TB.loop(el, fn)`.
- `TB.palette()` → `{bg, text, dim, faint, grid, axis, border, surface, accent, accent2, ok, warn, bad, …}`, `TB.color("ok-soft")`, `TB.isDark()`, `TB.onTheme(cb)`.
- `TB.won(x)` "1억 2,346만원"(10만원 미만은 원 단위), `TB.wonAxis(x)`, `TB.pct(x, digits)`, `TB.fmt(x, digits)`, `TB.font(px, mono, weight)`, `TB.clamp/lerp/map`, `TB.rng(seed)`.
- 고정폭 글꼴은 숫자·영문에만 쓴다.

## 세금 계산 엔진 (`TX`, `js/tax.js`)
모든 장이 같은 계산을 쓰게 하는 공통 엔진이다. 단위는 원, 비율은 소수, 기간은 년. 세율·한도는 엔진에도 적지 않고 `TX.D`(JSON)에서 읽는다. 장 고유의 작은 계산은 장 안에서 해도 되지만 세법 값은 `D`에서 가져온다. 엔진 값은 본문에서 "이 책의 모델로 계산하면"이라고 밝힌다. 함수 목록과 입력은 `js/tax.js` 머리 주석과 각 함수 주석을 본다. 주요 함수:
- 기본: `TX.progressive(표, 과세표준)` → `{tax, rate, steps}`, `TX.incomeTax(과세표준)`, `TX.quickTable(표)`(누진공제 표), `TX.local(소득세)`(지방소득세), `TX.v("경로")`, `TX.fmt.*`.
- 직장인: `TX.social(월 과세급여)`, `TX.payroll({monthly, nontax, family, kids, ratio})`(그 해 별표의 간이세액표 `simplified.table`을 찾는다), `TX.simplifiedTable(월 과세급여, 가족 수)`, `TX.earnedDeduction(총급여)`, `TX.earnedCredit(산출세액, 총급여)`, `TX.personalDeduction({spouse, children, parents, others, elderly, disabled, woman, single})`, `TX.cardDeduction(사용액, 총급여, {kids, prev})`, `TX.housingDeduction({subscription, leaseRepay, mortgageInterest, mortgageCap}, 총급여)`, `TX.childCredit(n)`, `TX.birthCredit([순서])`, `TX.pensionCredit({saving, irp, isaTransfer}, 총급여)`, `TX.specialCredits({insurance, medical, education, donation}, 총급여)`, `TX.rentCredit(연 월세, 총급여)`, `TX.yearEnd({...})` → 항목별·표준 두 경로와 `best`, `decided`, `local`, `refund`, `effective`, `marginal`.
- 종합소득: `TX.business({revenue, rate, books, expenses})`, `TX.otherIncome(금액)`, `TX.comprehensive({ye, business, other})`.
- 투자: `TX.financial({interest, dividend, otherBase})`, `TX.highDividend(금액)`, `TX.isa({profit, type, grossProfit})`, `TX.pensionPayout({amount, age, lifetime, other})`, `TX.pensionLimit(평가액, 연차)`, `TX.overseasStock(손익 합)`, `TX.domesticStock({sell, market, gain, major})`, `TX.crypto({gain, year})`.
- 상속·증여: `TX.transferTax(과세표준)`, `TX.giftDeduction(관계, {marriage})`, `TX.giftTax({value, relation, prior, priorTax, usedDeduction, marriage, skip, filed})`, `TX.inheritTax({estate, debts, funeral, priorGifts, priorGiftTax, spouse, spouseShare, children, minors, elderly, financial, cohabitHouse, filed})`.
- 케이스: `TX.CASE`.

세금 계산은 실제 세법의 주요 흐름만 따른 **교육용 단순화**다(간이세액표는 그 해 별표 값을 찾되 파일에 표가 없으면 산식으로 근사, 세액공제 적용 순서와 이월, 종합소득의 근로소득세액공제 안분, 연금소득공제, 상속재산 평가와 각종 특례 등을 생략하거나 근사했다). 본문에서 엔진 값을 쓸 때는 "이 책의 모델로 계산하면"을 붙이고, 실제 세액은 국세청 홈택스 모의계산이나 전문가에게 확인하라고 밝힌다.

## 점검
- `python3 tools/check.py <slug>` (playwright 필요, 임시 로컬 서버를 띄운다). 넓은 화면·라이트와 360px·다크로 열어 콘솔 오류, 가로 넘침, 조작 중 예외, 채워지지 않은 세법 값, 본문의 NaN을 보고한다. `--shots 폴더`로 스크린샷.
- `node tools/check-engine.js` — 엔진 기준 사례(국세청 예시 등)와 JSON 키 점검.
- 장을 끝낼 때마다 새로 쓴 세법 값의 JSON 키와 출처를 [SOURCES.md](SOURCES.md)에 적는다.

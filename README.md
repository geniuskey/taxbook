# TaxBook — 세금 교과서

월급에서 매달 떼는 세금은 무엇이고, 연말정산은 왜 누구에게는 13월의 월급이고 누구에게는 토해내기인가. 예금 이자와 해외 주식, 연금저축과 ISA, 가상자산에는 세금이 얼마나 붙고, 부모가 결혼 자금을 보태 주면 세금은 누가 내는가. 소득세의 계단에서 시작해 원천징수와 연말정산, 종합소득세, 투자 세금, 증여세와 상속세까지 숫자를 직접 바꾸며 배우는 한국어 인터랙티브 교과서입니다.
첫 연말정산을 앞둔 사회초년생, 부업을 시작한 직장인, 투자를 시작한 사람, 부모의 재산 이전을 고민하는 사람을 독자로 삼습니다. 본문은 일반인 기준으로 쓰고, 실무에서 흔한 실수는 "실무 노트", 신고 전에 직접 확인할 항목은 "신고 전 체크" 상자로 덧붙입니다.
책 전체가 가상의 인물 정다온(32)이 2026년 한 해의 세금을 정리하는 노트(다온의 세금 노트)를 따라갑니다. 대표 시뮬레이터는 6장의 [연말정산 계산기](https://taxbook.euiyun.com/chapters/yearend.html#sim-calc)입니다.

배포 주소: https://taxbook.euiyun.com/

## 기준 연도와 세법 수치: 한 파일, 한 장

- 이 책의 세율·공제율·한도·기준 금액은 **모두 [`data/tax-2026.json`](data/tax-2026.json) 한 파일**에서 읽습니다. 본문의 숫자도 `<span data-t="card.threshold" data-f="pct">`처럼 이 파일의 경로로 쓰고, 시뮬레이터는 `js/tax.js` 엔진을 거쳐 이 값으로 계산합니다. 본문 곳곳에 "2026년 귀속 기준"(`label`)이 표시됩니다.
- 해마다 고칠 곳은 두 군데입니다. ① `data/tax-YYYY.json`을 새 귀속 연도로 만들고 값을 고친다. ② [16장 올해 바뀐 세법](chapters/revision.html)을 다시 쓴다. 페이지는 올해부터 거꾸로 찾아 가장 최근 연도 파일을 쓰고, `?year=2026`처럼 연도를 지정할 수도 있습니다. 순서는 [SOURCES.md](SOURCES.md)의 "해마다 고치는 순서"에 있습니다.
- 값의 근거(법령 조문, 국세청·재정경제부 자료)와 확인 상태는 [SOURCES.md](SOURCES.md)와 JSON의 `refs`에 모았습니다. 국회를 통과하지 않은 개정안은 계산에 넣지 않고 16장에서 "추진 중"으로만 다룹니다.

## 실행
빌드 과정이 없는 정적 사이트입니다. 세법 수치를 `fetch`로 읽으므로 로컬 서버로 엽니다(`file://`로 열면 시뮬레이터가 돌지 않고 안내가 뜹니다).

```bash
python3 -m http.server 8000   # → http://localhost:8000
```
KaTeX와 폰트는 CDN에서 불러오므로 인터넷 연결이 필요합니다.

## 구성

| 장 | 파일 | 부 | 주제 |
|---|---|---|---|
| 01 | chapters/overview.html | — | 세금의 지도: 소득의 종류, 누진세율, 한계세율과 실효세율, 원천징수와 확정신고 |
| 02 | chapters/payslip.html | 직장인 세금 | 월급명세서와 원천징수: 4대보험, 간이세액표, 80·100·120% |
| 03 | chapters/taxbase.html | 직장인 세금 | 총급여에서 과세표준까지: 비과세, 근로소득공제, 인적공제 |
| 04 | chapters/deduction.html | 직장인 세금 | 소득공제: 신용카드 등, 주택자금 |
| 05 | chapters/credit.html | 직장인 세금 | 세액공제: 근로·자녀·연금계좌·보험료·의료비·교육비·기부금·월세 |
| 06 | chapters/yearend.html | 직장인 세금 | 연말정산 계산기(대표 시뮬레이터) |
| 07 | chapters/income.html | 직장인 세금 | 종합소득세: 부업·프리랜서, 경비율과 장부, 5월 신고 |
| 08 | chapters/interest.html | 투자 세금 | 금융소득: 이자·배당, 2,000만원 기준, 비교과세, 고배당 분리과세 |
| 09 | chapters/isa.html | 투자 세금 | ISA: 비과세 한도, 손익 통산, 연금계좌 전환 |
| 10 | chapters/pension.html | 투자 세금 | 연금저축과 IRP: 세액공제, 과세이연, 연금소득세 |
| 11 | chapters/stock.html | 투자 세금 | 주식과 ETF: 증권거래세, 대주주, 해외 주식 양도소득세 |
| 12 | chapters/crypto.html | 투자 세금 | 가상자산: 과세 시작 연도, 공제, 취득가액 의제 |
| 13 | chapters/gift.html | 상속·증여 | 증여세: 증여재산공제, 혼인·출산 공제, 10년 합산 |
| 14 | chapters/inherit.html | 상속·증여 | 상속세: 일괄·배우자·금융재산 공제, 1차·2차 상속 |
| 15 | chapters/transfer.html | 상속·증여 | 상속이냐 증여냐: 10년 단위 계획 |
| 16 | chapters/revision.html | — | 올해 바뀐 세법: 기준 연도의 개정 요약(해마다 다시 쓴다) |
| 17 | chapters/glossary.html | — | 용어집, 종합 퀴즈 |

공통 코드
- `data/tax-2026.json` — 2026년 귀속 세법 수치와 근거 조문(`refs`)
- `js/tax.js` — 세금 계산 엔진(전역 `TX`): JSON 불러오기, 본문의 세법 값 채우기(`data-t`), 간이세액표 재현, 연말정산, 종합소득세, 금융소득 비교과세, ISA·연금, 주식·가상자산, 증여세·상속세, 케이스 `TX.CASE`
- `js/common.js` — 내비게이션, 검색, 캔버스·차트·막대·도넛·끌기 헬퍼, 전역 `TB`
- `css/style.css` — 디자인 토큰(라이트/다크), 실무 노트·신고 전 체크 상자
- `tools/head.py` — 챕터 `<head>`·사이트맵·JSON-LD 생성기
- `tools/check.py` — 페이지 점검기(임시 로컬 서버, 콘솔 오류, 가로 넘침, 조작 중 예외, 채워지지 않은 세법 값)
- `tools/check-engine.cjs`, `tools/tx.cjs` — 엔진 기준 사례 점검, node용 엔진 로더
- `SOURCES.md` — 세법 수치와 출처, 확인 상태, 해마다 고치는 순서

레이아웃과 시뮬레이터 헬퍼는 같은 시리즈의 [EstateBook](https://github.com/geniuskey/estatebook)·[MoneyBook](https://github.com/geniuskey/moneybook)에서 가져왔습니다. 챕터 작성 규칙은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요.

계산은 실제 세법의 주요 흐름만 따른 교육용 단순화 모델의 결과입니다(생략한 규정은 SOURCES.md 4절). 이 사이트는 특정 금융상품·회사를 권하지 않으며 세무·법률·투자 자문이 아닙니다. 실제 신고 전에는 국세청 홈택스와 전문가에게 확인하세요.

## 점검

```bash
node tools/check-engine.cjs        # 엔진 기준 사례와 JSON 필수 키
python3 tools/check.py             # 전체 페이지 (pip install playwright)
python3 tools/head.py              # head·사이트맵·JSON-LD 갱신
```

## 배포 (GitHub Pages)
`CNAME`에 `taxbook.euiyun.com`이 들어 있습니다. `main` 브랜치에 푸시하면 GitHub Actions가 `@euiyun/book`으로 `.book-dist/`를 만들어 배포합니다(저장소 Pages 설정의 소스를 GitHub Actions로 둡니다). `data/` 폴더도 배포물에 함께 들어갑니다.

## 라이선스

Copyright (c) 2026 geniuskey and TaxBook contributors

| 적용 대상 | 라이선스 | 재사용 조건 |
|---|---|---|
| JS·CSS·Python·HTML의 실행 코드 | [MIT](LICENSE-MIT) | 수정·재배포·상업적 이용 가능. 저작권 및 라이선스 고지 유지 |
| 교재 본문·그림·문제·해설, 세법 수치 파일의 교육용 정리 | [CC BY 4.0](LICENSE-CC-BY-4.0) | 수정·번역·재배포·상업적 이용 가능. 저작자·출처·라이선스 표시 및 변경 사실 명시 |

자세한 내용은 [라이선스 안내](LICENSE.md)를 참고하세요.

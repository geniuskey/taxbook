#!/usr/bin/env python3
# Copyright (c) 2026 geniuskey and TaxBook contributors. MIT (see ../LICENSE-MIT).
# Derived from MoneyBook (https://github.com/geniuskey/moneybook).
"""챕터 <head> 블록 생성기.

각 chapters/<slug>.html 에는 다음 표식이 있다.
  <!--head:start {"desc": "한 문장 설명"}-->
  ... (이 사이는 스크립트가 덮어쓴다)
  <!--head:end-->
제목·장 번호는 js/common.js 의 CHAPTERS 에서 읽는다. 사이트맵과 index.html JSON-LD hasPart 도 갱신한다.
실행: python3 tools/head.py [slug ...]   (slug를 주면 그 장의 head만 고친다, --site는 사이트맵·JSON-LD만)
"""
import json, re, pathlib, datetime, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://taxbook.euiyun.com/"
BOOK = "TaxBook · 숫자를 직접 바꾸며 배우는 세금 교과서"
TODAY = datetime.date.today().isoformat()

src = (ROOT / "js/common.js").read_text(encoding="utf-8")
CH = [dict(slug=m[0], num=m[1], title=m[2]) for m in re.findall(r'slug: "([\w-]+)",\s*num: "(\d+)",(?:\s*part: \d+,)?\s*title: "([^"]+)"', src)]

def head(c, meta):
    url = f"{SITE}chapters/{c['slug']}.html"
    title = f"{c['title']} · TaxBook"
    desc = meta["desc"]
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": ["Chapter", "LearningResource"], "@id": url + "#chapter", "name": c["title"], "headline": title,
         "description": desc, "url": url, "position": int(c["num"]), "inLanguage": "ko", "isAccessibleForFree": True,
         "learningResourceType": "인터랙티브 교재", "educationalLevel": "일반 성인", "image": SITE + "og.png", "dateModified": TODAY,
         "isPartOf": {"@type": "Book", "@id": SITE + "#book", "name": BOOK, "url": SITE}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "TaxBook", "item": SITE},
            {"@type": "ListItem", "position": 2, "name": f"{int(c['num'])}. {c['title']}", "item": url}]}]}
    e = lambda s: s.replace("&", "&amp;").replace('"', "&quot;")
    out = f'''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<meta name="theme-color" content="#8b3a8f">
<meta property="og:type" content="article">
<meta property="og:site_name" content="TaxBook">
<meta property="og:locale" content="ko_KR">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False, separators=(",", ":"))}</script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
<link rel="stylesheet" href="../css/style.css">
<script src="../js/common.js"></script>
'''
    out += '<script src="../js/tax.js"></script>' + "\n"
    return out

SITE_ONLY = sys.argv[1:] == ["--site"]   # 사이트맵과 index.html JSON-LD만 갱신
ONLY = [] if SITE_ONLY else sys.argv[1:]
if SITE_ONLY:
    CH_RUN = []
elif ONLY:
    CH_RUN = [c for c in CH if c["slug"] in ONLY]
else:
    CH_RUN = CH

pat = re.compile(r"(<!--head:start (\{.*?\})-->\n)(.*?)(<!--head:end-->)", re.S)
for c in CH_RUN:
    p = ROOT / "chapters" / f"{c['slug']}.html"
    if not p.exists():
        if ONLY: print("missing", p.name)
        continue
    s = p.read_text(encoding="utf-8")
    m = pat.search(s)
    if not m:
        print("no marker", p.name); continue
    meta = json.loads(m.group(2))
    s = s[:m.start()] + m.group(1) + head(c, meta) + m.group(4) + s[m.end():]
    p.write_text(s, encoding="utf-8")
    print("ok", p.name)

if ONLY:
    sys.exit(0)

# sitemap
_ready = re.search(r"const READY = new Set\(\[(.*?)\]\)", src)
READY = set(re.findall(r'"([\w-]+)"', _ready.group(1))) if _ready else {c["slug"] for c in CH}
PUB = [c for c in CH if c["slug"] in READY and (ROOT / "chapters" / f"{c['slug']}.html").exists()]  # 공개한 장만
urls = [SITE] + [f"{SITE}chapters/{c['slug']}.html" for c in PUB]
(ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    "".join(f"  <url><loc>{u}</loc><lastmod>{TODAY}</lastmod></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")

# index.html JSON-LD hasPart
ip = ROOT / "index.html"
if ip.exists():
    s = ip.read_text(encoding="utf-8")
    parts = json.dumps([{"@type": "Chapter", "name": c["title"], "position": int(c["num"]), "url": f"{SITE}chapters/{c['slug']}.html"} for c in PUB], ensure_ascii=False, separators=(",", ":"))
    s2 = re.sub(r'"hasPart":\[.*?\]\}\]\}</script>', '"hasPart":' + parts + '}]}</script>', s, flags=re.S)
    s2 = re.sub(r'"dateModified":"[\d-]+"', f'"dateModified":"{TODAY}"', s2)
    ip.write_text(s2, encoding="utf-8")
    print("index", "updated" if s2 != s else "unchanged")

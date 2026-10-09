// Copyright (c) 2026 geniuskey and TaxBook contributors. MIT (see ../LICENSE-MIT).
// node에서 엔진을 쓰기 위한 로더. package.json이 "type": "module"이라 js/tax.js를 vm으로 읽는다.
//   const TX = require("./tools/tx.cjs");            // 가장 최근 data/tax-YYYY.json을 쓴다
//   const TX = require("./tools/tx.cjs").year(2026);
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
function load(year) {
  const ctx = { module: { exports: {} }, console, URL, URLSearchParams };
  ctx.globalThis = ctx;
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, "js/tax.js"), "utf8"), ctx, { filename: "tax.js" });
  const TX = ctx.module.exports;
  const files = fs.readdirSync(path.join(ROOT, "data")).filter((f) => /^tax-\d{4}\.json$/.test(f)).sort();
  const file = year ? `tax-${year}.json` : files[files.length - 1];
  TX.use(JSON.parse(fs.readFileSync(path.join(ROOT, "data", file), "utf8")));
  return TX;
}
const TX = load();
TX.year = load;
module.exports = TX;

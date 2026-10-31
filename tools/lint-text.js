#!/usr/bin/env node
// 문구 규칙 검사 (docs/AUTHORING.md의 "문구 규칙").
// - 금지 문장부호: 엠 대시(—), 가운뎃점(·, ㆍ, ・), en 대시(–)
// - 금지 문장 끝: "-니다", "-다." (예: 달라집니다, 달라진다.)
//
// 사용법:
//   node tools/lint-text.js              # 프로젝트 전체
//   node tools/lint-text.js samples/ai   # 폴더 또는 파일
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXTS = new Set(['.js', '.md', '.html', '.css']);
const SKIP_DIRS = new Set(['.git', 'node_modules']);

const RULES = [
  { name: '엠 대시(—)', re: /—/g },
  { name: '가운뎃점(·, ㆍ, ・)', re: /[·ㆍ・‧]/g },
  { name: 'en 대시(–)', re: /–/g },
  { name: '"-니다" 끝맺음', re: /[가-힣]니다(?![가-힣])/g },
  // "-다." 형태. 예외 단어(바다, 다다 등)는 거의 없으므로 단순 규칙으로 검사
  { name: '"-다." 끝맺음', re: /[가-힣]다[.!?](?=\s|$|['"`<)\]])/gm },
];

function walk(p, out) {
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    if (SKIP_DIRS.has(path.basename(p))) return;
    for (const f of fs.readdirSync(p)) walk(path.join(p, f), out);
  } else if (EXTS.has(path.extname(p))) out.push(p);
}

const targets = process.argv.slice(2).map((t) => path.resolve(ROOT, t));
const files = [];
for (const t of targets.length ? targets : [ROOT]) walk(t, files);

let total = 0;
for (const f of files) {
  if (path.resolve(f) === __filename) continue;
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  const hits = [];
  lines.forEach((line, i) => {
    if (line.includes('lint-ignore')) return; // 규칙 위반 예시를 일부러 보여주는 줄
    for (const r of RULES) {
      r.re.lastIndex = 0;
      if (r.re.test(line)) hits.push(`  ${i + 1}: [${r.name}] ${line.trim().slice(0, 110)}`);
    }
  });
  if (hits.length) {
    total += hits.length;
    console.log(path.relative(ROOT, f).replace(/\\/g, '/') + ` (${hits.length})`);
    console.log(hits.slice(0, 40).join('\n') + (hits.length > 40 ? `\n  … ${hits.length - 40}개 더 있음` : ''));
  }
}
console.log(total ? `\n위반 ${total}건` : '위반 없음');
process.exit(total ? 1 : 0);

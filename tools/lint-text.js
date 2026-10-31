#!/usr/bin/env node
// 문구 규칙 검사 (docs/AUTHORING.md의 "문구 규칙").
// - 금지 문장부호: 엠 대시(—), 가운뎃점(·, ㆍ, ・), en 대시(–)
// - 금지 문장 끝: "-니다", "-다." (예: 달라집니다, 달라진다.)
// - 불필요한 온점: 문장이 하나뿐인 한국어 항목 끝의 온점
//   (md 목록 항목과 표 칸, JS 문자열, 한 줄짜리 <li>, <p>, <td>, <div>, 주석)
//
// 사용법:
//   node tools/lint-text.js              # 프로젝트 전체
//   node tools/lint-text.js samples/ai   # 폴더 또는 파일
//   node tools/lint-text.js --fix        # 불필요한 온점을 자동으로 지움 (다른 규칙은 직접 고침)
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXTS = new Set(['.js', '.md', '.html', '.css']);
const SKIP_DIRS = new Set(['.git', 'node_modules']);
const FIX = process.argv.includes('--fix');

const RULES = [
  { name: '엠 대시(—)', re: /—/g },
  { name: '가운뎃점(·, ㆍ, ・)', re: /[·ㆍ・‧]/g },
  { name: 'en 대시(–)', re: /–/g },
  { name: '"-니다" 끝맺음', re: /[가-힣]니다(?![가-힣])/g },
  // "-다." 형태. 예외 단어(바다, 다다 등)는 거의 없으므로 단순 규칙으로 검사
  { name: '"-다." 끝맺음', re: /[가-힣]다[.!?](?=\s|$|['"`<)\]])/gm },
];

// 문장이 하나뿐인 한국어 조각이 온점으로 끝나면 true. 태그는 무시하고 판단
const HANGUL = /[가-힣]/;
function singleSentenceWithDot(raw) {
  const t = raw.replace(/<[^>]+>|\*\*|`/g, '').trim(); // 태그와 마크다운 강조는 무시
  if (!HANGUL.test(t) || !/[^.]\.$/.test(t)) return false;
  return !/[.!?]\s+\S/.test(t.slice(0, -1)); // 중간에 문장 경계가 없음
}
// 조각 끝의 온점 하나를 지움. 온점 뒤의 닫는 태그와 공백은 그대로 둠
const stripDot = (raw) => raw.replace(/\.((?:\s*<\/[a-z]+>)*\s*)$/i, '$1');

// 한 줄을 검사. hits: 문제 조각, fixed: 고친 줄
function checkDots(line, ext) {
  const hits = [];
  const fix = (raw) => {
    if (!singleSentenceWithDot(raw)) return raw;
    hits.push(raw.replace(/<[^>]+>/g, '').trim());
    return stripDot(raw);
  };
  let fixed = line;
  if (ext === '.md') {
    const m = line.match(/^(\s*(?:[-*]|\d+\.)\s+)(.*?)(\s*)$/);
    if (m) fixed = m[1] + fix(m[2]) + m[3];
    else if (/^\s*\|.*\|\s*$/.test(line)) {
      const cells = line.split('|');
      fixed = cells.map((c, i) => (i === 0 || i === cells.length - 1 ? c : fix(c))).join('|');
    }
    return { hits, fixed };
  }
  // 주석을 먼저 떼어 냄. 문자열 안의 // (URL 등)는 주석이 아님
  let code = line, comment = '';
  const strRe = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g;
  const masked = line.replace(strRe, (s) => ' '.repeat(s.length));
  const ci = masked.indexOf('//');
  if (ci >= 0) { code = line.slice(0, ci); comment = line.slice(ci); }
  code = code.replace(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g, (all, a, b) => {
    const q = all[0], s = a ?? b;
    return q + fix(s) + q;
  });
  code = code.replace(/(<(li|p|td|div)\b[^>]*>)(.*?)(<\/\2>)/g, (all, open, tag, inner, close) => open + fix(inner) + close);
  if (comment) comment = comment.replace(/^(\/\/\s*)(.*)$/, (all, pre, body) => pre + fix(body));
  fixed = code + comment;
  return { hits, fixed };
}

function walk(p, out) {
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    if (SKIP_DIRS.has(path.basename(p))) return;
    for (const f of fs.readdirSync(p)) walk(path.join(p, f), out);
  } else if (EXTS.has(path.extname(p))) out.push(p);
}

const targets = process.argv.slice(2).filter((a) => !a.startsWith('--')).map((t) => path.resolve(ROOT, t));
const files = [];
for (const t of targets.length ? targets : [ROOT]) walk(t, files);

let total = 0, fixedCount = 0;
for (const f of files) {
  if (path.resolve(f) === __filename) continue;
  const src = fs.readFileSync(f, 'utf8');
  const lines = src.split('\n');
  const hits = [];
  let changed = false;
  lines.forEach((line, i) => {
    if (line.includes('lint-ignore')) return; // 규칙 위반 예시를 일부러 보여주는 줄
    const r = checkDots(line, path.extname(f));
    if (FIX && r.fixed !== line) { lines[i] = r.fixed; changed = true; fixedCount += r.hits.length; line = r.fixed; }
    else for (const t of r.hits) hits.push(`  ${i + 1}: [한 문장 끝 온점] ${t.slice(0, 110)}`);
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      if (rule.re.test(line)) hits.push(`  ${i + 1}: [${rule.name}] ${line.trim().slice(0, 110)}`);
    }
  });
  if (changed) fs.writeFileSync(f, lines.join('\n'));
  if (hits.length) {
    total += hits.length;
    console.log(path.relative(ROOT, f).replace(/\\/g, '/') + ` (${hits.length})`);
    console.log(hits.slice(0, 40).join('\n') + (hits.length > 40 ? `\n  … ${hits.length - 40}개 더 있음` : ''));
  }
}
if (FIX) console.log(`온점 ${fixedCount}개 지움`);
console.log(total ? `\n위반 ${total}건` : '위반 없음');
process.exit(total ? 1 : 0);

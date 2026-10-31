#!/usr/bin/env node
// 브라우저 없이 샘플을 실행해 런타임 예외를 잡는 스모크 테스트.
// Canvas2D와 WebGL은 모의 객체(Proxy). 셰이더 컴파일 오류와 렌더 결과는 검증하지 못함.
// 실제 셰이더 검증은 브라우저에서 index.html#selftest 열기.
//
// 사용법:
//   node tools/smoke.js                 # 모든 샘플
//   node tools/smoke.js ai              # 카테고리 id
//   node tools/smoke.js fixed-timestep  # 샘플 id (여러 개 가능)
//   node tools/smoke.js --en ai         # 영어 모드. en 문구 누락과 화면에 남은 한글을 경고
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const EN = process.argv.includes('--en');
const HANGUL = /[ㄱ-ㆎ가-힣]/;
const seenHangul = new Set();               // 영어 모드에서 캔버스에 그려진 한글 문자열
const noteText = (t) => { if (EN && HANGUL.test(String(t))) seenHangul.add(String(t).slice(0, 40)); };

// ── 모의 Canvas 2D ──
function mock2d(canvas) {
  const state = { fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1, font: '10px sans-serif', globalCompositeOperation: 'source-over', imageSmoothingEnabled: true };
  const fn = () => undefined;
  const special = {
    canvas,
    createImageData: (w, h) => (typeof w === 'object' ? { width: w.width, height: w.height, data: new Uint8ClampedArray(w.width * w.height * 4) } : { width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h) * 4) }),
    getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h) * 4) }),
    measureText: (t) => ({ width: String(t).length * 6, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 }),
    createLinearGradient: () => ({ addColorStop: fn }),
    createRadialGradient: () => ({ addColorStop: fn }),
    createConicGradient: () => ({ addColorStop: fn }),
    createPattern: () => ({ setTransform: fn }),
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, inverse() { return this; } }),
    isPointInPath: () => false,
    isPointInStroke: () => false,
    getLineDash: () => [],
    fillText: (t) => noteText(t),
    strokeText: (t) => noteText(t),
  };
  return new Proxy(state, {
    get(t, k) {
      if (k in special) return special[k];
      if (k in t) return t[k];
      return fn;
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

// ── 모의 WebGL ──
let glObjId = 1;
function mockGL(canvas, isGL2) {
  const consts = {};
  let constN = 0x8000;
  const obj = () => ({ __gl: glObjId++ });
  const special = {
    canvas,
    drawingBufferWidth: canvas.width, drawingBufferHeight: canvas.height,
    getShaderParameter: () => true,
    getProgramParameter: (p, k) => (k === 'ACTIVE_UNIFORMS_' ? 0 : true),
    getShaderInfoLog: () => '', getProgramInfoLog: () => '',
    getExtension: (name) => new Proxy({}, { get: (t, k) => (typeof k === 'string' && /^[A-Z0-9_]+$/.test(k) ? 0x9000 : () => obj()) }),
    getSupportedExtensions: () => ['OES_texture_float', 'WEBGL_depth_texture', 'OES_standard_derivatives', 'ANGLE_instanced_arrays', 'OES_vertex_array_object', 'EXT_color_buffer_float'],
    checkFramebufferStatus: () => 0x8cd5,
    getParameter: () => 4096,
    getError: () => 0,
    getUniformLocation: () => obj(),
    getAttribLocation: () => 0,
    isContextLost: () => false,
    getContextAttributes: () => ({ antialias: true }),
    readPixels: () => undefined,
    FRAMEBUFFER_COMPLETE: 0x8cd5,
  };
  return new Proxy({}, {
    get(t, k) {
      if (k in special) return special[k];
      if (k in t) return t[k];
      if (typeof k === 'string' && /^[A-Z][A-Z0-9_]*$/.test(k)) return consts[k] ?? (consts[k] = constN++);
      if (typeof k === 'string' && /^create/.test(k)) return () => obj();
      return () => undefined;
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

// ── 모의 WebAudio: 모든 노드, 메서드, AudioParam을 받아 주는 재귀 Proxy ──
function mockAudio() {
  const t0 = Date.now();
  const special = {
    currentTime: () => (Date.now() - t0) / 1000,
    sampleRate: () => 48000,
    state: () => 'running',
    then: () => undefined,
  };
  const make = () => new Proxy(function () {}, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => 0;
      if (typeof k === 'symbol') return undefined;
      if (k in special) return special[k]();
      if (k === 'getChannelData') return () => new Float32Array(1024);
      if (k === 'length' || k === 'numberOfChannels' || k === 'frequencyBinCount' || k === 'fftSize') return 1024;
      if (k === 'resume' || k === 'close' || k === 'suspend') return () => Promise.resolve();
      if (k in t) return t[k];
      return make();
    },
    set(t, k, v) { t[k] = v; return true; },
    apply() { return make(); },
    construct() { return make(); },
  });
  return make();
}

function mockCanvas(w = 300, h = 150) {
  const c = {
    width: w, height: h, style: {},
    getContext(type) {
      if (type === '2d') return this._2d || (this._2d = mock2d(this));
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return this._gl || (this._gl = mockGL(this, type === 'webgl2'));
      return null;
    },
    addEventListener() {}, removeEventListener() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: this.width, height: this.height }; },
    toDataURL() { return 'data:,'; },
  };
  return c;
}

// ── 샌드박스 ──
const sandbox = {
  console, Math, Date, JSON, Promise, Map, Set, WeakMap, Array, Object, Number, String, Boolean, Symbol, Error,
  Float32Array, Float64Array, Int8Array, Int16Array, Int32Array, Uint8Array, Uint8ClampedArray, Uint16Array, Uint32Array, ArrayBuffer, DataView,
  setTimeout, clearTimeout, performance: { now: () => Number(process.hrtime.bigint() / 1000n) / 1000 },
  ImageData: function (d, w, h) { if (typeof d === 'number') { this.width = d; this.height = w; this.data = new Uint8ClampedArray(d * w * 4); } else { this.data = d; this.width = w; this.height = h; } },
  Path2D: function () { return new Proxy({}, { get: () => () => undefined }); },
  OffscreenCanvas: function (w, h) { return mockCanvas(w, h); },
  requestAnimationFrame: () => 0,
  AudioContext: function () { return mockAudio(); },
  webkitAudioContext: undefined,
  document: { createElement: (t) => (t === 'canvas' ? mockCanvas() : { style: {}, append() {}, appendChild() {}, setAttribute() {} }) },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
const load = (rel) => vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sandbox, { filename: rel });
// vm 컨텍스트에서는 전역 조회가 느림(브라우저와 다름). 그래서 자주 쓰는 전역을 지역 인자로 넘겨 샘플 코드를 실행.
const loadSample = (rel) => vm.runInContext(
  '(function (Math, GTL, Float32Array, Uint8Array, Int32Array, Uint8ClampedArray) {' + fs.readFileSync(path.join(ROOT, rel), 'utf8') +
  '\n})(Math, GTL, Float32Array, Uint8Array, Int32Array, Uint8ClampedArray);', sandbox, { filename: rel });

load('core/util.js');
sandbox.GTL.lang = EN ? 'en' : 'ko';
sandbox.GTL.platform = {
  createCanvas: (w, h) => mockCanvas(w, h),
  loadScript: (src) => { loadSample(src); return Promise.resolve(); },
  now: sandbox.performance.now,
};
load('core/runtime.js');

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const manifests = [...html.matchAll(/<script src="(samples\/[^"]+_manifest\.js)"/g)].map((m) => m[1]);
for (const m of manifests) load(m);

const GTL = sandbox.GTL;
const U = GTL.util;
const filters = process.argv.slice(2).filter((a) => !a.startsWith('--'));
let entries = GTL.allEntries();
if (filters.length) entries = entries.filter((e) => filters.includes(e.id) || filters.includes(e.category));

// 매니페스트에 등록되지 않은 샘플 파일 경고
for (const cat of GTL.categories) {
  const dir = path.join(ROOT, 'samples', cat.id);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (f.startsWith('_') || !f.endsWith('.js')) continue;
    if (!cat.samples.some((s) => s.path.endsWith('/' + f))) console.warn(`⚠ 매니페스트에 없는 파일: samples/${cat.id}/${f}`);
  }
}

function randomParams(def, side, rng) {
  const o = GTL.defaultParams(def, side);
  for (const p of def.params) {
    if (p.type === 'range') o[p.key] = rng.range(p.min, p.max);
    else if (p.type === 'int') o[p.key] = rng.int(p.min, p.max);
    else if (p.type === 'bool') o[p.key] = rng.chance(0.5);
    else if (p.type === 'select') o[p.key] = rng.pick(p.options).value;
  }
  return o;
}

// 영어 모드: 바꿔 끼운 뒤에도 한글이 남은 필드를 찾음
function validateEn(def, entry) {
  const w = [];
  const cat = GTL.categories.find((c) => c.id === entry.category);
  if (cat && !cat.en) w.push(`[en] 카테고리 ${cat.id}에 en 제목 없음`);
  if (!entry.en) w.push('[en] 매니페스트 항목에 en 제목 없음');
  if (!def.en) { w.push('[en] 정의에 en 블록 없음'); return w; }
  const bad = [];
  const chk = (name, v) => { if (v != null && HANGUL.test(String(v))) bad.push(name); };
  for (const k of ['title', 'summary', 'controls', 'info']) chk(k, def[k]);
  (def.look || []).forEach((t, i) => chk(`look[${i}]`, t));
  chk('views.a', def.views.a); chk('views.b', def.views.b);
  def.refs.forEach((r, i) => { chk(`refs[${i}].title`, r.title); chk(`refs[${i}].note`, r.note); });
  for (const p of def.params) {
    for (const k of ['label', 'help', 'group', 'buttonLabel']) chk(`params.${p.key}.${k}`, p[k]);
    (p.options || []).forEach((o) => chk(`params.${p.key}.options.${o.value}`, o.label));
  }
  try { GTL.diagrams(def).forEach((svg, i) => chk(`diagram[${i}]`, svg.replace(/<!--[\s\S]*?-->/g, ''))); } catch { /* validateDef에서 보고 */ }
  if (bad.length) w.push('[en] 한글이 남은 필드: ' + bad.join(', '));
  return w;
}

function validateDef(def, entry) {
  const w = [];
  if (!def.title) w.push('title 없음');
  if (!def.summary) w.push('summary 없음');
  if (!def.info) w.push('info 없음');
  if (!def.look || !def.look.length) w.push('look(관찰 포인트) 없음');
  if (!def.refs || !def.refs.length) w.push('refs(참고자료) 없음');
  if (!entry.added) w.push('manifest에 added 날짜 없음');
  if (!GTL.level(entry.level)) w.push('manifest에 level(1~4) 없음');
  try {
    GTL.diagrams(def).forEach((svg, i) => {
      if (typeof svg !== 'string' || !/^\s*<svg[\s>]/.test(svg)) w.push(`diagram[${i}]: <svg>로 시작하는 문자열이 아님`);
      else if (!/viewBox=/.test(svg)) w.push(`diagram[${i}]: viewBox 없음. 패널 폭에 맞게 줄어들지 않음`);
      else if ((svg.match(/<svg/g) || []).length !== (svg.match(/<\/svg>/g) || []).length) w.push(`diagram[${i}]: <svg> 태그 짝이 맞지 않음`);
    });
  } catch (e) { w.push('diagram 생성 중 예외: ' + e.message); }
  const keys = new Set();
  for (const p of def.params) {
    if (keys.has(p.key)) w.push(`param key 중복: ${p.key}`);
    keys.add(p.key);
    if (p.type === 'select' && !p.options.some((o) => o.value === p.default)) w.push(`select '${p.key}' default가 options에 없음`);
    for (const s of ['a', 'b']) if (p[s] !== undefined && p.type === 'select' && !p.options.some((o) => o.value === p[s])) w.push(`select '${p.key}' ${s} 값이 options에 없음`);
    if ((p.type === 'range' || p.type === 'int') && (p.default < p.min || p.default > p.max)) w.push(`'${p.key}' default 범위 밖`);
  }
  const da = GTL.defaultParams(def, 'a'), db = GTL.defaultParams(def, 'b');
  if (!def.single && def.params.length && JSON.stringify(da) === JSON.stringify(db)) w.push('A와 B의 기본 파라미터가 같음. 기본 상태에서 차이가 보이지 않음');
  return w;
}

(async () => {
  let fail = 0, warnCount = 0;
  const t0 = Date.now();
  for (const entry of entries) {
    const errs = [];
    let warns = [];
    let def;
    try {
      def = await GTL.load(entry.id);
      warns = validateDef(def, entry);
      if (EN) warns.push(...validateEn(def, entry));
      seenHangul.clear();
      const statHangul = new Set();
      const rng = U.rng(7);
      const kb = GTL.createKeyboard();
      const runs = [['기본', (s) => GTL.defaultParams(def, s)], ['무작위1', (s) => randomParams(def, s, rng)], ['무작위2', (s) => randomParams(def, s, rng)], ['무작위3', (s) => randomParams(def, s, rng)]];
      for (const [label, mk] of runs) {
        for (const side of def.single ? ['a'] : ['a', 'b']) {
          const params = mk(side);
          const v = new GTL.View(def, side, { params, keyboard: kb, seed: 1, width: 640, height: 400, dpr: 1 });
          GTL.onViewError = null;
          v.start();
          const ts = Date.now();
          for (let i = 0; i < 90 && !v.error; i++) {
            const keys = ['Space', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'KeyZ', 'KeyX', 'ShiftLeft', 'KeyW', 'KeyA', 'KeyD'];
            if (i % 6 === 0) kb.keydown(keys[(i / 6) % keys.length]);
            if (i % 6 === 3) kb.clear();
            const m = v.mouse;
            m.x = 40 + ((i * 13) % 560); m.y = 30 + ((i * 7) % 340); m.inside = true;
            if (i % 20 === 0) { m.down = true; m.pressed = true; v.pointer('down', {}); }
            else if (i % 20 === 5) { m.down = false; m.released = true; v.pointer('up', {}); }
            else v.pointer('move', {});
            if (i === 30) { v.resize(500, 320); }
            if (i === 45) {
              // 파라미터 라이브 변경
              for (const p of def.params) {
                if (p.type === 'button') continue;
                if (p.reset) continue;
                const old = params[p.key];
                if (p.type === 'bool') params[p.key] = !old;
                else if (p.type === 'select') params[p.key] = rng.pick(p.options).value;
                else if (p.type === 'range' || p.type === 'int') params[p.key] = p.type === 'int' ? rng.int(p.min, p.max) : rng.range(p.min, p.max);
                v.param(p.key, params[p.key]);
                if (v.error) break;
              }
            }
            v.tick(i % 17 === 0 ? 0.1 : 1 / 60, 1 / 60);
            kb.endFrame();
          }
          for (const p of def.params) if (p.type === 'button' && !v.error) { v.action(p.key); v.tick(1 / 60); }
          if (!v.error) { v.render(); }
          if (EN) for (const [k, val] of v.stats) { noteText(k); if (typeof val === 'string' && HANGUL.test(val)) statHangul.add(k + ': ' + val.slice(0, 30)); }
          if (v.error) errs.push(`[${label}/${side}] ${v.error.stack.split('\n').slice(0, 3).join(' | ')}`);
          const ms = Date.now() - ts;
          if (ms > 4000) warns.push(`[${label}/${side}] 90프레임에 ${ms}ms 걸림. 너무 느림 (파라미터 최대값에서 성능 확인 필요)`);
          v.dispose();
        }
      }
      if (seenHangul.size && !def.demoHangul) warns.push('[en] 화면에 그려진 한글 (GTL.L로 감쌀 것): ' + [...seenHangul].slice(0, 8).map((t) => JSON.stringify(t)).join(', '));
      if (statHangul.size) warns.push('[en] 한글 측정값: ' + [...statHangul].slice(0, 5).join(', '));
    } catch (e) { errs.push(e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : String(e)); }
    if (errs.length) { fail++; console.log(`✗ ${entry.id}\n   ${errs.join('\n   ')}`); }
    else console.log(`✓ ${entry.id}`);
    for (const w of warns) { warnCount++; console.log(`   ⚠ ${w}`); }
  }
  console.log(`\n${entries.length - fail}/${entries.length} 통과, 경고 ${warnCount}개 (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  process.exit(fail ? 1 : 0);
})();

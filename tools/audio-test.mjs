// Logic checks for src/00b_audio.js with no audio device: the old API is still there, every sound builds a valid graph
// (the mock rejects what the real Web Audio API rejects), the voice cap holds, and mute/volume still work.
// Usage: node tools/audio-test.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const code = readFileSync(join(root, 'src', '00b_audio.js'), 'utf8');

let nodes = 0, starts = 0;
class Param {
  constructor(name, v = 0) { this.name = name; this.value = v; }
  setValueAtTime(v, t) { assert.ok(Number.isFinite(v) && Number.isFinite(t) && t >= 0, `${this.name}.setValueAtTime(${v},${t})`); }
  linearRampToValueAtTime(v, t) { assert.ok(Number.isFinite(v) && Number.isFinite(t), `${this.name}.linearRamp(${v},${t})`); }
  exponentialRampToValueAtTime(v, t) { assert.ok(Number.isFinite(v) && v > 0 && Number.isFinite(t), `${this.name}.exponentialRamp(${v},${t}) must be > 0`); }
  setTargetAtTime(v, t, k) { assert.ok(Number.isFinite(v) && Number.isFinite(t) && k > 0, `${this.name}.setTarget(${v},${t},${k})`); }
  cancelScheduledValues() {}
}
class Node {
  constructor(props = {}) { nodes++; for (const k in props) this[k] = new Param(k, props[k]); }
  connect(x) { assert.ok(x, 'connect to nothing'); return x; }
  start(t = 0) { starts++; assert.ok(Number.isFinite(t) && t >= 0, 'start(' + t + ')'); }
  stop(t) { assert.ok(Number.isFinite(t) && t >= 0, 'stop(' + t + ')'); }
}
class Ctx {
  constructor() { this.currentTime = 0; this.sampleRate = 8000; this.state = 'running'; this.destination = new Node(); }
  createGain() { return new Node({ gain: 1 }); }
  createOscillator() { const n = new Node({ frequency: 440, detune: 0 }); n.type = 'sine'; return n; }
  createBiquadFilter() { const n = new Node({ frequency: 350, Q: 1, gain: 0 }); n.type = 'lowpass'; return n; }
  createBufferSource() { return new Node({ playbackRate: 1 }); }
  createBuffer(ch, len) { return { length: len, getChannelData: () => new Float32Array(len) }; }
  createConvolver() { return new Node(); }
  createWaveShaper() { return new Node(); }
  createStereoPanner() { return new Node({ pan: 0 }); }
}

const fresh = () => {
  const sandbox = {
    save: { settings: { volume: 0.7 } }, P: { pos: { x: 0, y: 0, z: 0 }, yaw: 0 },
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v), rr: (a, b) => a + Math.random() * (b - a),
    window: {}, console,
  };
  vm.createContext(sandbox);
  vm.runInContext(code + '\n;this.SFX=SFX;this.MIX=MIX;this.jit=jit;', sandbox);
  sandbox.SFX.build(new Ctx());
  return sandbox;
};

let n = 0;
const test = (name, fn) => { fn(); n++; console.log('ok  ' + name); };

test('the old API is still there', () => {
  const { SFX } = fresh();
  for (const m of ['init', 'vol', 'setLaser', 'setWind', 'boom', 'tone', 'zap', 'hit', 'chime', 'levelUp', 'alarm', 'whoosh', 'glass', 'crash',
    'splash', 'honk', 'transform', 'setEngine', 'setSiren', 'toggleMute', 'setVolume', 'gun', 'punch', 'swish'])
    assert.equal(typeof SFX[m], 'function', 'SFX.' + m);
  for (const p of ['ctx', 'master', 'muted', 'volume', 'noise', 'sfx']) assert.ok(p in SFX || SFX[p] !== undefined, 'SFX.' + p);
});

test('every sound builds a valid graph', () => {
  const { SFX } = fresh();
  const before = nodes;
  SFX.boom(1, 1.1); SFX.boom(0.5, 0.5); SFX.tone('square', 900, 220, 0.16, 0.07); SFX.tone('sine', 880, 880, 0.25, 0.18, 0.08);
  SFX.zap(1); SFX.hit(); SFX.chime(); SFX.levelUp(); SFX.alarm(); SFX.whoosh(); SFX.glass(1); SFX.crash(1); SFX.splash(1); SFX.honk(1);
  SFX.transform(); SFX.gun(1); SFX.punch(1); SFX.swish(); SFX.bell(880, 0.2);
  SFX.setLaser(true); SFX.setLaser(false); SFX.setWind(0.5); SFX.setEngine(true, 0.5); SFX.setEngine(false, 0); SFX.setSiren(1);
  assert.ok(nodes - before > 100, 'sounds should create nodes');
});

test('the mock really rejects what the real API rejects', () => {
  const { SFX } = fresh();
  assert.throws(() => SFX.voice({ type: 'sine', f0: 440, f1: -5, dur: 1, vol: 0.1 }), /exponentialRamp/);
  assert.throws(() => SFX.noiseHit({ ft: 'lowpass', f0: 1000, f1: -5, dur: 1, vol: 0.1 }), /exponentialRamp/);
});

test('quiet or zero volume makes no sound', () => {
  const { SFX } = fresh();
  const before = nodes;
  SFX.boom(0); SFX.glass(0); SFX.crash(0.01); SFX.splash(0); SFX.honk(0.01); SFX.gun(0.01); SFX.punch(0); SFX.tone('sine', 440, 440, 0.1, 0.005);
  assert.equal(nodes, before);
});

test('the voice cap holds, and a big sound still gets through when it is full', () => {
  const { SFX, MIX } = fresh();
  for (let i = 0; i < 200; i++) SFX.voice({ type: 'sine', f0: 440, dur: 5, vol: 0.1 });
  assert.equal(SFX.live.length, MIX.voices);
  SFX.voice({ type: 'sine', f0: 440, dur: 5, vol: 0.1, pri: 2 });
  assert.equal(SFX.live.length, MIX.voices + 1);
  for (let i = 0; i < 200; i++) SFX.voice({ type: 'sine', f0: 440, dur: 5, vol: 0.1, pri: 2 });
  assert.equal(SFX.live.length, MIX.voices + 10);
  SFX.ctx.currentTime = 6; SFX.voice({ type: 'sine', f0: 440, dur: 1, vol: 0.1 });
  assert.equal(SFX.live.length, 1, 'finished voices are forgotten');
});

test('mute and volume still go through master', () => {
  const { SFX } = fresh();
  assert.equal(SFX.master.gain.value, 0.7);
  assert.equal(SFX.toggleMute(), true); assert.equal(SFX.master.gain.value, 0);
  SFX.setVolume(0.3); assert.equal(SFX.master.gain.value, 0, 'muted stays muted');
  assert.equal(SFX.toggleMute(), false); assert.equal(SFX.master.gain.value, 0.3);
});

test('jit stays inside its range, round-robin never repeats', () => {
  const { SFX, jit } = fresh();
  for (let i = 0; i < 1000; i++) { const x = jit(100, 0.05); assert.ok(x >= 95 && x <= 105); }
  let last = -1; for (let i = 0; i < 500; i++) { const k = SFX.pick('x', 3); assert.notEqual(k, last); assert.ok(k >= 0 && k < 3); last = k; }
});

test('at(): louder and centred when near, panned and duller when far', () => {
  const { SFX } = fresh();
  const near = SFX.at(0, 0, -2), right = SFX.at(100, 0, 0), left = SFX.at(-100, 0, 0), far = SFX.at(0, 0, -370);
  assert.ok(near.v > 0.99 && Math.abs(near.pan) < 0.1);
  assert.ok(right.pan > 0.5 && left.pan < -0.5);
  assert.ok(far.v < near.v && far.lp < near.lp);
});

console.log(`\n${n} checks passed`);

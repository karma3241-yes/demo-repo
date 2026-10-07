# Sound design overhaul: design spec

Date: 2026-10-07 · Status: draft for owner review · Branch: events/prism (unpushed)

## 1. Intent

Skyline Guardian's audio sounds generated: bare oscillators and filtered noise, no reverb, no variation, no music, and one `chime()` reused for ~30 unrelated events. Goal: make it sound hand-crafted, relevant to what is on screen, and **gamified**, so reward moments land as dopamine hits in a browser game.

Decisions made with the owner (2026-10-07):
- **Source:** better synthesis only. No sample files, nothing to license, no size growth.
- **Music:** adaptive procedural score.
- **Identity:** heroic cinematic-synth (sub-bass hits, brass-like stabs, shimmering energy, rising arpeggios for rewards). Cyber world leans neon-synthwave and the spire ethereal, but within the same heroic family.

Success criteria:
1. In a blind A/B of old vs new, repeated actions (punch, shot, pickup) do not sound identical twice.
2. No two different reward events share the same sound.
3. Combos audibly escalate and a broken combo audibly deflates.
4. Music changes with intensity and zone without clicks, glitches or tempo jumps.
5. No clipping at the peak of an invasion wave; no frame-time regression beyond noise.
6. Mute, volume, CrazyGames ad-mute and `muteAudio` still work exactly as today.
7. Build size grows by code only (est. 40–60 KB minified-equivalent), load time effectively unchanged.

Out of scope: voice acting, recorded samples, spatial audio beyond pan and distance filter, per-user music settings beyond the existing volume/mute.

## 2. Current state (verified)

- One `SFX` object, `src/00_engine.js:562-606`: `ctx`, `master`, `muted`, `volume`, `noise` buffer, continuous `wind`/`laser`/`eng`/`sir` loops, and ~20 one-shot methods built from `tone(type,f0,f1,dur,v,delay)` and `boom(v,len)`.
- Extended elsewhere: `SFX.water` (`53_water.js:12`); `66g_kperfect.js` builds its own graph from `SFX.noise`/`SFX.ctx`.
- Call sites: 457 across 48 files. `tone` ×232, `boom` ×90, `vol` ×68 (distance falloff helper), `whoosh` ×45, `chime` ×41, `punch` ×31.
- Muting contract (`src/64_portal.js:46-56`, `81_touch.js:187`): everything calls `SFX.toggleMute()`, reads `SFX.muted`, and `audioWake()` resumes `SFX.ctx`. **All audio, including music, must route through `SFX.master` so these keep working.**
- Build: `tools/build.mjs` concatenates `src/*.js` in filename order. A new `00b_audio.js` sorts directly after `00_engine.js`, the same pattern `53_water.js` already uses to extend `SFX`.

Problem diagnosis: `chime()` is goal done, bounty, heal, planet landing, wave clear, daily reward, door opening, menu upgrade and more. Direct `tone()` calls in story files are mostly bare single-oscillator blips.

## 3. Architecture

Two new modules plus targeted edits. Each has one purpose and a narrow interface.

### 3.1 `src/00b_audio.js`: engine and SFX library

Extends `SFX` (no new global object, so every existing call keeps working).

**Signal graph (built in `SFX.init`, replaces the single master→destination):**

```
voices ─► sfxBus ─┐
ui ─────► uiBus ──┤
ambience► ambBus ─┼─► mix ─► soft clipper ─► master(gain) ─► destination
music ──► musicBus┘            ▲
                      reverb send (convolver, generated IR) from sfx/music/amb
```

- `master` stays the single mute/volume node (contract above).
- Safety stage: a `WaveShaperNode` soft clipper (untouched up to half scale, tanh-rounded above). **Changed in phase 1:** a `DynamicsCompressorNode` limiter was built first and measured, and Chrome's compressor took ~10 dB off short transients (punch, gun, zap), so it was dropped. The voice cap and level design keep pile-ups in check; the lab's stacking test is the check.
- `reverb`: `ConvolverNode` with an impulse generated at init from decaying noise (~1.6 s, slight stereo decorrelation, high-frequency damping). A single shared send; per-sound send amount.
- `musicBus` has a sidechain-style **duck**: a gain automation hook `SFX.duck(depth,attack,release)` that big hits and stingers call.
- Per-bus gain constants live in one `MIX` table so the final mix pass is a one-place edit.

**Voice builders (internal helpers, the core of "not generated-sounding"):**
- `stack(type,freq,{voices,detune,spread})`: detuned multi-oscillator unison.
- `env(param,t,{a,d,s,r,peak})`: ADSR on any AudioParam.
- `noiseHit(t,{filter,freqEnv,dur,q})`: shaped noise transient.
- `sub(t,f0,f1,dur)`: sine sub-bass drop.
- `fm(t,carrier,ratio,index,dur)`: metallic/bell partials.
- `pan(node,x)`: StereoPanner when a position is given.
- A voice cap (default 28 live voices; lowest-priority and oldest dropped first) so invasion crowds cannot starve the audio thread.

**Humanising:** every one-shot passes through `jit(x,pct)` for ±3–6 % pitch and ±10 ms timing variation, plus 2–3 timbral variants per frequent sound (punch, gun, hit, whoosh), chosen round-robin with no immediate repeat.

**Positional:** where a call site already uses `SFX.vol(x,y,z)`, behaviour is kept (volume falloff). New optional `SFX.at(x,y,z)` returns `{v,pan,lp}` (volume, stereo pan from camera-relative angle, low-pass cutoff by distance) for the sounds worth spatialising (explosions, enemy fire, boss).

**Backward compatibility rule:** every existing method (`tone`, `boom`, `hit`, `chime`, `levelUp`, `alarm`, `whoosh`, `glass`, `crash`, `splash`, `honk`, `transform`, `gun`, `punch`, `swish`, `zap`, `water`, loops `setLaser`/`setWind`/`setEngine`/`setSiren`, `vol`, `setVolume`, `toggleMute`, `init`) keeps its signature. `tone()` is re-implemented as a richer voice (detune pair + soft filter + reverb send) at the same parameters, so the 232 direct calls improve without edits. A small per-call-site pass then re-voices the biggest story moments (section 3.4).

**Semantic events:** `SFX.play(name, opts?)` over a table `EVENTS`, about 25 named sounds. Initial set:

| Group | Events |
|---|---|
| Progress | `xp` (small rising pluck), `goalDone` (3-note arpeggio), `levelUp` (heroic fanfare stinger), `skillPoint` (bright ping), `upgradeLock` (UI "lock-in") |
| Money / loot | `bounty` (coin cascade), `cash` (single coin), `orb` (energy pickup per orb type), `dailyClaim` (sparkle swell) |
| Combat | `critical` (crunch accent), `streak3/5/10` (milestone stingers), `waveClear` (brass-stab hit), `bossDown` (full drop), `floorClear` (rising synth sweep) |
| Support | `heal` (warm shimmer), `shieldUp`, `landing` (soft resonant thud), `doorOpen`, `battery` |
| Story | `kathanaAwake`, `portalOpen`, `cyberEnter`, `spireOpen`, `ascend` (Prism: layered build and drop) |
| UI | `hover` (tick), `click` (pop), `toast` (sparkle, tinted by toast colour: gold/cyan/purple), `deny` |

`chime()` stays as a legacy default (now a decent generic sparkle) but its ~41 call sites are re-pointed to specific events where the event is clear, and left on `chime()` only where it is genuinely generic.

### 3.2 Gamified layer, inside `00b_audio.js` (section `// ---- Dopamine ----`)

- **Combo ladder:** `SFX.comboHit(n)` steps up a pentatonic scale in the current key (cap ≈ 2 octaves), adding an octave-doubled harmonic layer at n≥8 and a shimmer at n≥15. Hooked from the existing combo counter (`comboN` in `42_combat.js:10`). `SFX.comboBreak()` plays a soft pitch-fall "deflate" when `comboN` resets from ≥5.
- **Kill-streak stingers** at 3 / 5 / 10 via `streak3/5/10`, hooked from the existing `streak()` in `49b_speed.js:85`.
- **Critical / perfect-timing ping:** `critical` accent layered over the normal hit, plus a "perfect" ping for the existing perfect-timing moments in `66g_kperfect.js`.
- **Anticipation:** `SFX.build(dur)` plays a short rising tension tick before a payout lands (daily claim, level-up, boss-down), so the reward hits harder.
- **UI feel:** hover/click ticks on buttons, a tinted `toast` sparkle, and `upgradeLock` for skill purchases (`70_ui.js:189,214`).
- All reward sounds duck the music (`SFX.duck`) for ~250 ms so they cut through.

### 3.3 `src/00c_music.js`: adaptive score

A look-ahead sequencer (Web Audio clock, 25 ms scheduler tick, ~100 ms look-ahead, the standard "tale of two clocks" pattern) so timing is sample-accurate and does not depend on frame rate.

- **Shared beat clock:** tempo, time signature, current key/scale, bar counter. Layer changes are quantised to bar lines (never mid-note).
- **Layers** (each a small pattern generator, all plain oscillators/noise through the shared buses): `pad` (detuned saw chords through a slow filter), `bass` (sub pulse), `arp` (16th arpeggio over the chord), `perc` (kick/hat/clap synthesised), `lead` (sparse heroic stab/motif).
- **Intensity (0–1):** a single value, smoothed, from game state: enemies near the player, wanted level, boss alive, wave active, low HP. Thresholds map to layer gains (e.g. calm = pad+bass; 0.35 adds arp; 0.6 adds perc; 0.85 adds lead). API: `MUSIC.setZone(name)`, `MUSIC.setIntensity(x)`, `MUSIC.stinger(name)`, `MUSIC.stop(fade)`.
- **Themes (one table, each = tempo, key, chord loop, layer voicings):**

| Zone | Character |
|---|---|
| overworld (default) | heroic: major/mixolydian, 96–104 bpm, wide pads, brass-like stabs |
| cyber world | neon synthwave: minor, 118 bpm, gated arps, punchy bass |
| spire | ethereal: modal pads, slow bells (FM), sparse percussion, builds per floor |
| invasion | driving: minor, 126 bpm, heavy perc, ostinato bass; intensity pinned high during a wave |
| Prism ascension | dedicated build-and-drop; ducks everything else |
| title / menu | calm pad + motif, loops under the menu |

- **Transitions:** zone change cross-fades over 2 bars, key change only at bar boundaries, tempo changes ramped. Stingers (`levelUp`, `waveClear`, `bossDown`) are pre-composed motifs in the current key that overlay and duck.
- **Lifecycle and contract:** starts on first user gesture inside `SFX.init` (same unlock as today); routed via `musicBus → master`; obeys `SFX.muted`/`volume` automatically; pauses its scheduler when the tab is hidden or the game is paused (`paused`, `state!=='play'`) and fades out during CrazyGames ad breaks via the existing `quiet()` path (already mutes `master`).
- **Fatigue guard:** music bus sits ~8–10 dB under SFX by default, with a long loop (8–16 bars) and per-bar light variation (random fill, arp octave) so it does not drone.

### 3.4 Edits to existing files

| File | Change |
|---|---|
| `00_engine.js` | `SFX` init/graph and legacy methods move into / are overridden by `00b_audio.js`; keep `SFX` const and the `muted/volume/master` contract. Remove nothing callers rely on. |
| `30_systems.js` | `levelUp`, orb pickup → `play('levelUp')`, `play('orb', type)`; XP gain `xp` |
| `42_combat.js` | hit/punch/gun variants; feed `comboHit`/`comboBreak`; `critical` |
| `49b_speed.js` | `streak()` milestones → stingers |
| `49d_wanted.js` | bounty → `bounty` |
| `47c_pool.js`, `49e_meters.js`, `49h_space.js`, `50_npcs.js`, `65b_goals.js`, `65c_daily.js`, `66e_boost.js`, `70_ui.js` | repoint `chime()` to the specific event |
| `66d_ufo.js`, `66f_kathana.js`, `66g_kperfect.js`, `66h_invasion.js`, `66i_cyber.js`, `66j_spire.js`, `66k_prismform.js`, `71_opener.js` | re-voice the headline moments with layered `play()` / stingers; `MUSIC.setZone` on enter/exit |
| `99_main.js` | per-frame `MUSIC.setIntensity` from existing state; start music after `SFX.init` |
| `70_ui.js` (menus), `81_touch.js` | UI hover/click/toast sounds; touch buttons already call `audioWake()` |
| `tools/codegraph.mjs` output | regenerate `docs/CODEGRAPH.md` after the change |

### 3.5 Sound lab: `tools/sfx-lab.html` (dev only, not shipped)

A standalone page that loads the built game's audio modules and offers: a button per `EVENTS` entry, a combo ladder slider (1–20), an intensity slider, a zone selector, a "play full mix" demo that fires a scripted fight, a peak meter, and the ±pitch jitter toggle. This is the quality gate: the owner auditions, notes what is off, and the next pass tunes the `MIX` and voicing tables. Not part of `dist/`.

## 4. Delivery phases

Each phase builds, is playable, and is committed separately on a new branch from events/prism (`events/audio`).

1. **Engine:** bus graph, soft clipper, reverb, voice builders, jitter, voice cap; legacy methods re-voiced; sound lab with the old events. *Gate: owner listens in the lab.*
2. **Semantic events:** `play()` table + `chime` repointing + UI sounds.
3. **Dopamine layer:** combo ladder, streaks, critical, anticipation, ducking.
4. **Adaptive music:** sequencer, layers, intensity, overworld + menu themes.
5. **Zone themes and story:** cyber, spire, invasion, Prism ascension, story stingers; final mix pass.

## 5. Testing and verification

- **Automated (Node, no audio device):** pure logic only. Scale/step mapping, combo-to-note mapping, intensity-to-layer thresholds, voice-cap eviction, event-table completeness (every `play()` name used in source exists in `EVENTS`), and "legacy method signatures unchanged" checks. Run via a small `tools/audio-test.mjs` using plain asserts. No Playwright (per the lean bug-fix preference); at most one smoke load of `index.html` to confirm no console errors on boot and that `SFX.init` builds the graph.
- **Offline render sanity:** `OfflineAudioContext` in the lab renders each event for 1–3 s and reports peak and RMS, flagging clipping (> 0 dBFS pre-limiter) and silence.
- **Manual (owner ears):** the sound lab per phase, then real play. Quality of timbre cannot be verified by tooling; the plan is explicitly iterative on the owner's notes.
- **Contract checks:** mute (M key), volume slider, CrazyGames ad-mute and `muteAudio` still silence music and SFX; resume after tab-hide; no audio before first gesture.

## 6. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Synth timbre sounds thin or "chiptune" | Layering, detune, filter envelopes, reverb and sub-bass in the voice builders; lab for iteration; honest expectation that it will not equal a recorded library |
| Procedural music sounds repetitive | Long loops (8–16 bars), per-bar variation, intensity layering, ducking; fatigue guard on music level |
| CPU and voice explosion in invasions | Voice cap with priority eviction; shared reverb send; no per-voice convolvers |
| Breaking the mute contract | Single `master` node kept; contract checks above |
| Mobile audio unlock and background tab | Reuse existing `audioWake()`; pause the scheduler when hidden |
| Scope: 457 call sites | Same-signature upgrade first (free improvement), then targeted repointing of ~41 `chime()` and the headline story moments only |
| Loudness inconsistency | One `MIX` table and the soft clipper; final mix pass in phase 5 |

## 7. Open questions (decide during build, default in brackets)

- Music default level relative to SFX [-9 dB; adjustable in lab, constant in `MIX`].
- Whether to add a separate Music volume slider in Settings [no, only if the owner wants one after hearing it].
- Menu/title music [yes, calm loop, stops when play starts].

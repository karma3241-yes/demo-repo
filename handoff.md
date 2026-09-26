# Skyline Guardian — handoff

## Project and how to ship
- Repo `karma3241-yes/demo-repo`, a WebGL superhero game. Live site: https://demo-repo-dusky.vercel.app (Vercel redeploys when `master` changes).
- The source is in `src/*.js` (35 modules) plus `src/shell.html`. **`index.html` is generated; never edit it by hand.**
  - Build with `node tools/build.mjs`. It concatenates the modules alphabetically into `index.html`, inside one IIFE.
  - Syntax check: pull the longest `<script>` out of `index.html` into a temp file and run `node --check` on it.
- Shipping flow for every change:
  1. Commit on the working branch and push.
  2. Open a PR to `master` and merge it (merge commit).
  3. Republish the claude.ai artifact https://claude.ai/artifact/4aX7b8YiYb5QBCARibQier:
     - Strip the doctype and the `<html>`, `<head>`, `<body>` and `<meta>` tags from `index.html`.
     - Publish it with that `url`. **Omit `capabilities`** so the existing ones (db, room, user) are kept.
- Tests are headless Playwright with the `window.__SKYLINE_TEST__ = true` hook, which exposes `window.__skyline`. Exports are listed at the bottom of `src/99_main.js`.
  - Serve the page with `npx http-server -p 8765 -s -c-1 .`.
  - Some older ad-hoc checks fail on master too, because their expectations are stale: bike steer, bazooka, the shadowStep set and battery standby.
- Owner's rules:
  - Never break existing features.
  - Confirm intent, then implement thoroughly.
  - Keep usage low where that doesn't cost quality.
  - Use original names for heroes and constructs.

## Where the oath lives today
- `src/49_ring.js` ~L243–275:
  - `openOath()`: opened with O. Only for the Ring Bearer, and only when the ring is below 99.5.
  - `closeOath()`.
  - `oathKey(e)`: typing. Tab = `oathNextWord`; Enter/Esc closes.
  - `oathWire()`: the `input` handler charges `save.ring` from `oathStart` toward 100 as the prefix matches, then sets `ring=100` and closes.
- On open: `P.lantern=true`, the `keys` and `mouseL` are cleared, and `P.charging=false`.
- `src/80_player.js:266`: `if(P.lantern&&!P.dead){P.vel.set(0,0,0);...return;}` freezes the player (hovering, construct kept) while the oath is open. **This line is the suspension.**
- `src/80_player.js:14`: while `oathOpen` on desktop, every keydown goes to `oathKey` (that's how typing works).
- `src/49j_voice.js`: speech recognition.
  - `oathVoice()` is true when the setting is `'voice'`, recognition is supported, and it hasn't been blocked.
  - Main pieces: `voiceOathStart`/`voiceOathStop`, `voiceMatch` (fuzzy, in-order word matching), `voiceApply` (writes the matched words into `oathIn` and dispatches `input`), and `askMic()`.
    - `askMic()` calls `getUserMedia` once, when play starts. It currently stops the stream right away.
- Setting: `save.settings.oathInput` is `'voice'` or `'type'`.
  - Default is in `src/20_core.js:125` (`DEFAULT_SETTINGS`); validation is at ~L170.
  - The UI toggle is in `src/70_ui.js` ~L258.
- Ring charge: `save.ring`, from 0 to 100.
  - It's clamped to 100 on load in `src/20_core.js:183` (`f.ring=num(s.ring,100,0,100)`).
  - Refunds use `Math.min(100,…)` in `src/40_powers.js:27` and `src/49_ring.js:41`.
  - Meter definitions are in `src/49e_meters.js`: `METERS.powerRing`, and `meterCap` returns 100 for the ring.
  - Bar CSS: `#enm.ring .bar.en i` in `src/shell.html` L29.

## NEW REQUEST (not started)
1. **Voice oath: free movement, no ring powers.** When the oath is open **in voice mode**:
   - The player is NOT suspended: they can walk, fly (F), punch and fight normally. The keyboard must NOT be captured for typing.
   - The player can't use any ring power while it's open: skills on keys 1–5, summoning or using constructs, the V dial, ring rebuild (Y), and so on.
     - Block these with feedback (e.g. a feed message along the lines of "Finish the oath first").
     - Decide whether an active construct is dismissed or just frozen, and **ask the owner**. The earlier request was to *keep* the construct during the oath.
   - Need a way to close the voice oath without typing mode: O again and/or Esc.
   - **Typed (Tab) mode stays exactly as it is now:** suspended, keys typed into the oath.
   - Implementation hints:
     - Gate `80_player.js:266` and `80_player.js:14` with `!oathVoice()`, or with a flag saved at open time. Don't let `voiceBlocked` flipping mid-oath strand the player.
     - Don't clear `keys` on open in voice mode.
     - Add a guard such as `ringLocked()` where ring powers and constructs start: `abilityDown` in `40_powers.js`, `summonConstruct`/`constructPrimary`/`constructAlt` in `49_ring.js`/`49f_constructs.js`, the dial in `70_ui.js`, and `ringRebuild` in `46_buildings.js`.
     - If voice gets blocked mid-oath, fall back to typed mode cleanly.
2. **Loud voice overcharges to 200.**
   - While the voice oath is listening, measure mic volume: `getUserMedia` → `AudioContext` → `AnalyserNode` → RMS converted to dB or 0–1.
   - If the level passes a **threshold set in Settings**, the ring can charge past 100, up to **200**.
     - Suggested reading: speaking the oath loudly fills 100 → 200 in proportion.
     - The owner didn't specify. Confirm, or pick: "if the peak level during the oath passed the threshold, completing it gives 200".
   - Settings: add a mic-threshold slider under Ring oath, persisted in `save.settings` and validated in `loadSave`. Ideally show a live level meter next to it so the user can calibrate.
   - Allowing more than 100:
     - Change the load clamp to 200.
     - `meterCap` returns 200 for the ring only while overcharged, or `meterFrac` handles it.
     - Refunds must not cut an overcharge down to 100: use `Math.min(Math.max(100,save.ring),…)`-style caps.
     - `openOath`'s early return at 99.5 must still allow overcharge.
   - Multiplayer presence sends ring state? Check `60_multiplayer.js`.
   - **Overcharged bar:** a glowing, effervescent effect on the ring bar while above 100.
     - CSS: pulsing `box-shadow` or a `filter: drop-shadow`, plus rising sparkle particles (pseudo-elements or small spans with a keyframe float).
     - The fill should show 100–200 as a second brighter layer.
     - Respect `prefers-reduced-motion`.
   - Release the mic stream and `AudioContext` when the oath closes.
3. **Verify:**
   - Headless: fake `SpeechRecognition` via `Object.defineProperty` on both `SpeechRecognition` and `webkitSpeechRecognition`, since Chromium's native one shadows plain assignment. Fake or mock the analyser level too.
   - Check:
     - Moving and flying while in voice mode.
     - Ring powers blocked in voice mode.
     - Typed mode is unchanged: suspended, keys typed.
     - Overcharge to 200 above the threshold, and only up to 100 below it.
     - The bar glow shows while above 100.
     - Zero page errors.
   - Then ship with the flow above and update `Readme.md`.

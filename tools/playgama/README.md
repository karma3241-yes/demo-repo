# Skyline Guardian — Playgama build

## Authorization QA repair, 12 October 2026

Version `2026.10.12.1` adds an explicit **Sign in** button beside Settings in the main and pause menus. It checks `bridge.player.isAuthorizationSupported` and `isAuthorized`, calls `bridge.player.authorize()` directly from the click/tap, shows the account name after success, and allows retry after cancellation, failure or a 60-second timeout. Sign-in is optional; it never reloads the game or replaces the current hero/progress. Host authorization-overlay focus recovery preserves independent platform and manual pauses. Account cloud-save merging is not introduced by this repair.

Rebuild the fixed solo QA runtime with `node tools/build-playgama-sandbox.mjs`, then `python tools/playgama/package-sandbox.py`. The sandbox builder reads the preserved multiplayer runtime in `dist/playgama`, without depending on unrelated source edits. The original multiplayer archive stays byte-identical. The maintained adapter also supports authorization when the multiplayer variant is rebuilt later.

Run `node tools/playgama/test.mjs` with `PLAYGAMA_RESULTS=results-authorization.json` for the controlled integration checks, including authorization success, retry/cancel/failure/timeout, guest play, existing sessions, progress preservation, overlay focus and touch layout in the supported landscape orientation. For a real CDN smoke check of the fixed runtime, set `PLAYGAMA_DIST=playgama-sandbox` and `PLAYGAMA_RESULTS=real-bridge-authorization.json`, then run `node tools/playgama/smoke.mjs`. The local mock platform has no authorization support; actual account credentials and final Playgama QA remain platform checks. Existing product telemetry/performance instrumentation and the broader pending release checks below are outside this authorization repair.

Validation: all 30 controlled integration checks passed, with no uncaught browser errors. The real Bridge CDN smoke test passed on the fixed solo runtime. The QA ZIP is `dist/skyline-guardian-playgama-sandbox-2026.10.12.1.zip`; uploaded archive `cmv4rkvjt0d6qof0hchywvo5d` has its [QA Tool here](https://developer.playgama.com/qa-tool/cmv4rkvjt0d6qof0hchywvo5d). The existing public sandbox still serves the previous version until it is republished.

Prepared on 11 October 2026 from the current `dist/crazygames/index.html`, which matches the 60 current source modules. The normal CrazyGames ZIP matches that HTML; its FULL ZIP differs only in `BASIC_LAUNCH` being false. The dedicated builder keeps the normal shipping build's gameplay and traversal/mastery balance, and independently enables Playgama ads. No original source, CrazyGames HTML/ZIP, root HTML or checkpoint is modified.

## Files and rebuild

- Run `node tools/build-playgama.mjs` from `demo-repo` to write `dist/playgama/index.html`, its Bridge config, and bundled assets.
- Run `python tools/playgama/package.py` to write `dist/skyline-guardian-playgama.zip`. Its root contains `index.html`, `playgama-bridge-config.json`, and `assets/`; no development tools or tests are included.
- Serve the complete `dist/playgama` directory over HTTP for a local preview. Opening the HTML via `file://` cannot reliably fetch the Bridge configuration; use a local HTTP server or the Playgama sandbox.
- The builder rejects changed integration markers rather than silently producing a partially converted build. Review its transformations when updating the CrazyGames shipping build. The packaging preservation baseline describes the originals for this integration session; refresh it deliberately after a later authorized source update.

## Platform behavior

The official [Bridge CDN and initialization](https://github.com/Playgama/bridge) load before the game. [Storage](https://wiki.playgama.com/playgama/bridge-sdk/api/storage) loads the progress key in one array request before either graphics settings or the hero are constructed. Writes use Bridge only, batch the key, serialize/coalesce pending updates, and retain failed writes for retry. Progress checkpoints run every 15 seconds and before ads, platform pause, background, page exit and rotation. A startup/storage error displays Retry without beginning a new game over an unread save. Async writes on an abrupt browser/process termination cannot be guaranteed.

[Platform events](https://wiki.playgama.com/playgama/bridge-sdk/api/platform) control pause and mute, including initial platform state. The game reports `game_ready` once after rendering, gameplay start/stop, level start/pause/resume, and knockout failure. English is the supported language and fallback; platform language is read. Manual pause and the player's own mute survive platform/ad transitions. Held keyboard, joystick, touch-button and charge input is cancelled without releasing a charged attack. The Playgama-generated Pause → Settings handler is repaired; the original CrazyGames handler remains untouched.

[Rewarded ads](https://wiki.playgama.com/playgama/bridge-sdk/api/advertisement/rewarded) keep the existing optional bonuses: five minutes of double XP, ten-minute power trials, meter refills, and permanent cosmetics. Controls describe watching an ad. Bonuses are granted once after the `rewarded` state and a successful close; cancellation, failure and unsupported ads grant nothing. The adapter rejects overlapping requests and pauses/mutes during the whole request. Unsupported ads disable reward controls. No advertising is used to gate ordinary progress or continuing after a knockout.

[Interstitial ads](https://wiki.playgama.com/playgama/bridge-sdk/api/advertisement/interstitial) use the existing respawn/knockout call sites, with an initial 180-second delay and at least 180 seconds between ads. Menu, resume and startup do not request them. [Bridge configuration](https://wiki.playgama.com/playgama/bridge-sdk/config) enables interstitial/rewarded placements; banners and automatic interstitial triggers are absent.

The [Playgama checklist](https://wiki.playgama.com/playgama/mcp/game-checklist) requires resources to be bundled except for the Bridge CDN. Bungee/Chakra Petch fonts are copied from the Google Fonts repository with their OFL licenses, and PeerJS 1.5.4 is bundled with its MIT license. The game retains its existing WebRTC signaling/STUN/TURN services for optional multiplayer; those are network services, not remotely loaded game libraries.

## Verification and remaining release checks

`node tools/playgama/test.mjs` runs 18 controlled Bridge integration checks in installed Chrome. Coverage includes delayed save boot, lifecycle/audio/pause, cancelled/failed/confirmed/duplicate/overlapping ads, reward effects, SDK ad-control interaction, interstitial cooldown, Bridge save/reload/retry, unsupported ads, Settings, mobile portrait/landscape, touch joystick recovery, mobile fullscreen, and fresh-profile auto-start. Test SDK failures deliberately exercise Retry; these are expected failures, not release failures. `evidence/results.json` and screenshots retain the results. Mobile checks emulate viewport/touch behavior; they are not physical iOS/Android or native-keyboard testing.

`node tools/playgama/smoke.mjs` loads the real CDN Bridge (v2.3.1 observed), its JSON config and local mock platform, and verifies saving/reloading. The only external resource requested in this smoke test is the Bridge CDN. Local mock-platform ads report unsupported, as expected. `evidence/real-bridge.json` records this separately from the controlled advertising tests. ZIP contents/bytes and original-file preservation are verified by the packager.

Before a public release, test live rewarded/interstitial delivery, portal pause/audio/fullscreen permissions, and account/cloud saves on the Playgama sandbox; do a physical-device playthrough and representative performance check. This work does not certify the historical 54-item optimization checklist, all browsers or every gameplay feature.

There is a concrete multiplayer backend limitation: `api/turn.js` currently permits CrazyGames origins and same-origin requests, so a Playgama iframe cannot use that deployed Cloudflare TURN endpoint without extending its origin allowlist to the verified game-host origin and deploying the backend. The client already falls back to its existing public ICE list; reliable two-client Playgama connectivity is unverified. No backend deployment occurred. The existing desktop renderer also fills ultrawide viewports; the checklist's desktop maximum 2:1 playfield remains to be checked/adapted for release.

## Account draft and solo sandbox, 11 October 2026

The original ZIP has been uploaded to Skyline Guardian draft `cmv3ujdq200qbnk0h16x2s5e2`. It passed Playgama's build check with Bridge 2.3.1. Playgama refuses multiplayer sandboxes, so the user explicitly approved a separate solo build. The original multiplayer ZIP/runtime and all original game files remain unchanged.

- Run `node tools/build-playgama-sandbox.mjs`, then `python tools/playgama/package-sandbox.py` to generate `dist/playgama-sandbox` and the current versioned sandbox ZIP (default version 2026.10.12.1; a version argument is supported). The builder applies the maintained Playgama adapter to the preserved multiplayer runtime before removing multiplayer.
- The solo variant removes room transports and multiplayer entrypoints; powers, progression and the original Bridge integration remain.
- `node tools/playgama/check-sandbox.mjs` checks real Bridge local startup, solo controls and saves, and creates three screenshot-based covers in `tools/playgama/covers`. They are uploaded in the draft.
- The live [solo sandbox](https://playgama.ai/play/oqy25y5oe5) uses archive `cmv3uuilt00v4nk0hgue0gqnc`, validated PASSED with Bridge 2.3.1. [QA Tool](https://developer.playgama.com/qa-tool/cmv3uuilt00v4nk0hgue0gqnc).
- `node tools/playgama/verify-live-sandbox.mjs` verifies live iframe startup, gameplay input, absence of multiplayer controls and saved character restoration on reload. Results and screenshots are in `evidence/live-sandbox.json` and `evidence/live-sandbox-page.png`.

The account game remains DRAFT. The initial upload involved no moderation submission or traffic campaign. The original multiplayer archive is retained for future reviewed multiplayer release.

## Ad-resume repair, 11 October 2026

The current solo sandbox uses archive `cmv3viysr0145nk0ho00w3wyh`, version 2026.10.11.3, [QA Tool](https://developer.playgama.com/qa-tool/cmv3viysr0145nk0ho00w3wyh). Closing a live rewarded overlay left the game iframe blurred; Bridge kept its separate visibility pause active. The adapter restores pre-ad focus after Bridge cleanup and at the next frame boundary, preserving hidden-tab, SDK and manual pauses. Generated pointer-lock loss during ads no longer creates a manual pause.

`node tools/playgama/test.mjs` now defaults to the updated solo runtime and runs 23 checks, saving `evidence/results-ad-resume.json`; `PLAYGAMA_DIST` and `PLAYGAMA_RESULTS` can select another runtime/result file. The new iframe-focus regression fails against the preserved original runtime. `node tools/playgama/trace-live-ad.mjs` exercises an actual opt-in rewarded ad on the live sandbox and verifies restored focus, SDK resume, simulation and reward. `evidence/live-ad-trace-before.json`, `live-ad-trace-after.json` and `live-ad-resumed.png` retain the reproduction/fix evidence. Normal live startup, controls and save/reload also passed again. Real interstitial delivery/failure, physical devices, authenticated cloud, full playthrough/performance and ultrawide compliance remain pending. No custom analytics/performance sample was added. No campaign was started or changed by this repair; the console shows an externally started SHARE campaign in progress.

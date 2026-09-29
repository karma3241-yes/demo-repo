# CrazyGames audit (Full Implementation)

Rejection (Sept 2026): "overall quality does not yet meet the expectations of our platform." The uploaded zip was
`claude/new-session-dt1kvp` @ 9c6576a. This branch (`cg/quality-pass`) fixes what the audit found. Standard used: the
CrazyGames docs, Requirements > Introduction and its pages (technical, gameplay, ads, account integration,
multiplayer, quality).

How it was checked: `dist/crazygames/index.html` served on localhost (the SDK runs in its "local" mode, with simulated
ads and console logs for every SDK call), driven by headless Chrome through Playwright at DPR 1. The results below are
from those runs.

## Requirements

| Area | Requirement | Status | Evidence |
|---|---|---|---|
| Technical | SDK loaded, gameplayStart/Stop | Pass | Start on Play, stop on pause, menus, knockout and ads, start again after (`64_portal.js` `tick`). A start is held back 1.1 s after a stop, because the SDK throttles faster ones (that was a console error). |
| Technical | Loading events | Pass | loadingStart/Stop on init. |
| Technical | Size ≤ 50 MB initial, ≤ 250 MB total, ≤ 1500 files | Pass | One file, 0.74 MB. External: SDK, Google Fonts, PeerJS (only when a room is opened). |
| Technical | No console errors | Pass | The favicon 404 is fixed with an inline empty icon. Clean runs on menu, play, knockout, ads, rooms. |
| Gameplay | Land in gameplay, max 1 click | Pass | Menu → Play → playing as the Ring Bearer, with a crime 30–120 m away. |
| Gameplay | Full visual QA at CrazyGames sizes | Pass (after fixes) | 800x450, 821x462, 907x510, 1077x606, 1080x607, 1216x684, 1280x720, 1366x768, 1536x864, 1920x1080: Play button on screen with no scrolling, no overlapping HUD panels (checked by script). Phone landscape 844x390: touch buttons fit under the icon bar. |
| Gameplay | First screen | Fixed | The old spawn put the camera inside the hospital canopy, so the first frame was a flat grey wall. The new spawn faces the street. |
| Gameplay | Physics same at any refresh rate | Pass (after fixes) | Variable dt, capped at 50 ms. Two per-frame dampings (knocked-back NPCs, storm call) are now dt-based. |
| Gameplay | Legible at DPR 1 | Pass | All screenshots at DPR 1. Smallest text is the 9 px key hints on icons. |
| Gameplay | PEGI 12 | Likely pass, owner to confirm | No blood, gore, drugs, alcohol or swearing. Defeats are "knocked out". Blocky characters. Thugs have guns. The villain path lets the player mug, rob and steal cars from human-like NPCs, which is the part a reviewer might question. |
| Gameplay | English | Pass | |
| Gameplay | No cross-promotion | Pass (after fix) | The leaderboard said "Shared board on claude.ai" and was always empty, so it is hidden in this build. The website link in the code only shows inside claude.ai. |
| Gameplay | No in-game fullscreen button | Pass | None in the code. |
| Gameplay | Esc | Pass | With the mouse locked, Esc frees it and pauses. Otherwise Esc toggles pause. Nothing asks for fullscreen. |
| Gameplay | Keyboard layouts | Pass | Keys use `e.code` (physical keys), so AZERTY gets ZQSD in the WASD positions. Labels still say WASD. |
| Ads | SDK only, natural breaks | Pass (after fixes) | Removed the forced 20-minute "Ad break in 5" countdown and the ad on leaving the pause menu (menu-button ads are banned). Midgame ads only on respawn after a knockout, at most every 3 min. |
| Ads | Pause and mute during ads | Pass | Midgame: gameplayStop → ad → gameplayStart, world frozen. Rewarded: muted during (`SFX.muted` true), unmuted after. |
| Ads | Rewarded success / failure | Pass | Success grants the reward (double XP checked). An error grants nothing and says "No ad right now". |
| Ads | Works with an ad blocker | Pass (after fix) | `ad.hasAdblock()`: rewarded icons and "Watch ad" buttons are disabled, with a note in the sheets. The game plays normally. |
| Ads | `settings.muteAudio` | Pass (added) | Portal mute wins over the M key. When it is lifted, only the mute it caused is undone. |
| Account | Progress saved to the account | Pass (after fix) | The Data module is now the save of record, as CrazyGames asks (it replaces the browser copy on start when it holds a hero; a hero with nothing in the cloud yet is uploaded). Checked: newer cloud, older cloud, empty cloud. |
| Account | Auth listener | Pass (added) | A guest who signs in mid-game: same save → just picks up the username; different account save → the game restarts to load it. Both checked. |
| Account | Username | Pass (added) | A new hero is named after the username. A placeholder "Guardian 123" hero takes the username when it arrives (Play pressed before the SDK answered, or a later sign-in). |
| Account | Avatar | Not used | Recommended, not required. Question for the owner below. |
| Account | Automatic login (`getUserToken`) | N/A | Only needed with your own backend. The game uses the Data module. |
| Multiplayer | Room info | Pass (updated) | `updateRoom({roomId, isJoinable, inviteParams})` / `leftRoom()` replace the deprecated invite button. `isJoinable` is false when the room is full or locked. Checked with two browsers. |
| Multiplayer | Invite link / instant multiplayer | Pass | `getInviteParam('room')` joins; `isInstantMultiplayer` creates a room. |
| Multiplayer | CrazyGames usernames shown | Pass (added) | Name tags read "Hero Name (username)" when they differ. Checked with two browsers. |
| Multiplayer | Chat / `disableChat` | N/A | There is no chat. Player-typed hero names now go through a basic word filter (all builds). |

Not testable locally: the real ad network, a real sign-in, and the CrazyGames QA tool. Please run the Developer Portal QA
tool on `dist/skyline-guardian-crazygames.zip` and send back what it reports.

## Changes that affect all three builds

Spawn point, closed move list, title-screen and HUD layout on small or short screens, touch layout on phones, frame-rate
independent damping, inline favicon, the name filter, and the username field in multiplayer presence (always empty outside
CrazyGames). Everything else is behind `PBAL` / `Portal.on()`.

## Originality (names done, visuals waiting on the owner)

Renamed on the owner's go-ahead, "rename if copyright could be possible". Only display names and text changed; internal ids
stay the same, so existing saves still load.

| Was | Now | Echoed |
|---|---|---|
| Web-Slinger, "Spider-sense" | Web Runner, "a sixth sense" / "Danger sense" | Spider-Man (nickname and power name); the Readme no longer cites the Insomniac games |
| Storm God, "Fly on a spinning hammer", "Spin your hammer and hurl yourself" | Tempest, "Ride the storm", "Ride a thunderclap into the sky" | Marvel's Thor (the hammer-spin flight is Marvel's, not myth's) |
| Repulsor Barrage, "palm repulsors", touch label REPULS | Pulse Barrage, "palm blasters", PULSE | Iron Man |
| Inventor Tower | Forge Tower | Stark Tower |
| Sun Titan "heat vision, freezing breath" | "laser eyes, an ice cloud" | Superman's signature pair |
| Speedster "Faster than anything alive" | "Outrun anything" | The Flash's "Fastest Man Alive" |
| Blade Claws "retractable claws … healing factor" | "Blades spring from your fists, and your wounds close fast" | Wolverine ("healing factor" is Marvel's term) |
| Ring Bearer "the lantern" (oath UI) | "the beacon" | Green Lantern |

Left alone: Morph Band (purple band, original alien names; the idea of an alien transformation device isn't protected),
Ricochet Shield, Spider Powers, Elastic Body, Titan Growth, Storm Hammer (Norse myth).

Visual echoes, not changed (owner to decide): the Ring Bearer's green ring and green/black default suit (Green Lantern),
and the Armored Inventor's red-and-gold armour and tower (Iron Man).

## First five minutes (done)

- Locked power keys are off the hotbar and the touch buttons until they unlock; the reward icons appear after the first
  crime (or LV 2). The opening HUD went from 11 icons and 6 slots to 6 icons and 2 slots.
- The menu pitch is one sentence, and the touch hint is one line. Play is on screen without scrolling from 360x640 portrait
  up to 1920x1080 (checked at 360x640, 375x667, 390x844, 667x375, 844x390 and the ten CrazyGames sizes).
- Still an idea: sunlit building faces wash out to near-white in the opening view.

## Owner decisions (2026-09-29)

1. Avatar: not required, so left out.
2. Originality: rename where copyright is possible (done above).
3. Multiplayer: keep it, and let the CrazyGames build use the site's Cloudflare relay (`api/turn.js`), with a hard
   monthly cap (`TURN_CAP_GB`, set to 950) so it never leaves the free 1000 GB. Measured: about 0.13 GB per relayed
   player-hour.
4. PEGI 12: the villain path is fine as it is.
5. Calmer first screen: yes (done above).

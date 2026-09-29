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

## Originality (proposal, nothing changed yet)

CrazyGames hosts close homages (for example "Web Slinging Race" and "Professor Strange"), but names and looks lifted
straight from Marvel or DC are a rejection risk. Suggested changes, per hero:

| Hero / power | Echoes | Proposed change |
|---|---|---|
| Ring Bearer: green ring, constructs, oath, "lantern" | Green Lantern | Keep the name. Change the ring's colour from green to another signature colour (for example white-gold "starlight"), make the default suit anything but green and black, and rename "lantern" in the oath UI ("Esc to put the lantern away") to "beacon". The oath text is already original. |
| Armored Inventor, Repulsor Barrage, Inventor Tower | Iron Man, repulsors, Stark Tower | Repulsor Barrage → Pulse Barrage, Inventor Tower → Forge Tower, and armour colours away from red and gold. |
| Storm God, Storm Hammer, Hammer Smash | Thor, Mjolnir | Storm God → Tempest. Hammer → a storm staff (a different model), Storm Hammer → Thunder Staff. |
| Spider Powers, Web-Swinging, Web Strike/Bomb/Whip | Spider-Man | Spider Powers → Wall Crawler, and no red-and-blue suit by default. The web mechanics are genre-standard. |
| Morph Band (wrist dial, alien forms) | Ben 10's Omnitrix | Morph Band → Shift Sigil, with a chest or palm emblem instead of a wrist watch. The alien names are already original. |
| Ricochet Shield | Captain America | Ricochet Shield → Rebound Disc, a hex disc with no star or rings. |
| Sun Titan, Solar Cells, Laser Vision | Superman | Names are fine. Avoid a blue suit with a red cape and a chest crest as the default look. |
| Speedster: phasing, tornado, time stop | The Flash | Names are fine. Make the trail colour something other than yellow lightning. |
| Blade Claws, Elastic Body, Titan Growth | Wolverine, Mr. Fantastic, Hulk / Ant-Man | Generic. No change. |

## First five minutes vs. CrazyGames "New games" (observations, nothing changed)

- The first screen is busy: 11 icons, six hotbar slots (four of them "Unlocks at LV x"), two meters, Getting started,
  minimap and clock. New releases on CrazyGames usually open with three or four HUD elements. Idea: hide locked slots
  until they unlock, and bring in the reward icons after the first crime.
- Sunlit building faces wash out to near-white in the opening view. A slightly lower sun or less ambient light
  would help.
- The thumbnails on "New games" are bright, saturated and character-led. The cover art matters as much as the build.

## Questions for the owner

1. Show the CrazyGames avatar (for example next to the name, top left)?
2. Approve any of the originality changes above?
3. Keep multiplayer on CrazyGames? It now meets their multiplayer requirements, but it uses free public PeerJS relays, so
   players on strict networks may not connect.
4. PEGI 12: is the villain path (mugging, robbing, car theft) OK as it is?
5. Try the "calmer first screen" idea?

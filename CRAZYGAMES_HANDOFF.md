# Handoff: CrazyGames audit and quality pass for Skyline Guardian

You are Claude Code, running on the owner's laptop. A cloud session wrote this brief because it couldn't render or play the game. You can. Read the whole brief before you start.

## Why you're here

CrazyGames rejected Skyline Guardian. Their message:

> "The overall quality of the game does not yet meet the expectations of our platform. Check out our New games for examples that meet our quality guidelines."

Their usual rejection reasons are low gameplay quality, broken builds, copyright issues and missing integration requirements. The stated reason is **quality**, so fixing only the SDK and technical items probably won't change the decision. The job has two parts:

1. **Compliance:** every CrazyGames requirement passes, and you can show it.
2. **Quality:** the first 5 minutes look and feel close to what's on CrazyGames' "New games" page. Find the gaps honestly and close as many as you can.

## Ground rules (the owner's priorities, in order)

1. **Never break what works.** The game ships three ways from one source: the public website (`index.html`, deployed on Vercel), the claude.ai version, and the CrazyGames build (`dist/crazygames/index.html`). Keep portal-only behavior behind the `PORTAL` / `Portal.on()` checks in `src/64_portal.js`, so the website and claude.ai versions keep their current balance and features. Anything that changes all three (visuals, bug fixes, onboarding) is fine, but say so in the commit message.
2. **Check with the owner before large or subjective changes:** a new art direction, removing a hero or a feature, renaming things, big rebalancing. Small fixes and clear bugs don't need approval.
3. **Keep usage down where quality doesn't suffer.** Take targeted screenshots, not hundreds. Read files in parts (`index.html` is about 680 KB and built from `src/`, so never read or edit it directly). Batch independent checks.

## 1. Setup

```bash
# in the owner's local clone (clone karma3241-yes/demo-repo first if there isn't one)
git fetch origin
git checkout -B cg/quality-pass origin/cld/tender-cannon-jlrn0l
```

**Why that branch:** `cld/tender-cannon-jlrn0l` holds the newest CrazyGames work. It's 3 commits ahead of `master` and not merged:

- `13e945f` CrazyGames build types the oath by default; the relay endpoint only answers this site
- `361e5f9` Quick play, a nearby first crime, cloud save, happy time, loading signals
- `684086c` HUD icon bar, move list, start as the Ring Bearer, wider change-powers screen

Ask the owner which zip they actually uploaded: the one on `master` (`dist/skyline-guardian-crazygames.zip`, 228 KB) or the one on this branch (236 KB). Record the answer in the audit.

**Build and run:**

```bash
node tools/build.mjs crazygames      # writes index.html and dist/crazygames/index.html (no npm install needed)
python3 -m http.server 8080          # serve from the repo root; don't open it as file://
# website build:    http://localhost:8080/index.html
# CrazyGames build: http://localhost:8080/dist/crazygames/index.html
```

**Repo layout:** numbered modules in `src/` are joined in file-name order into `src/shell.html` at the `/*SCRIPT*/` marker. The balance configs (`CONFIG`, `POWERS`, and so on) are in `src/20_core.js`. All CrazyGames logic is in `src/64_portal.js` and `src/65_rewards.js`. The `Readme.md` "For developers" section lists every module.

**Browser automation:** use whatever browser tooling you have (Claude in Chrome, a Playwright MCP, or Playwright installed in a scratch folder **outside** the repo; the repo has no `package.json`, so keep it that way). Test at the sizes CrazyGames embeds games at: 1280×720, 1920×1080, 1024×576, 800×600, plus a phone-sized touch emulation (for example 844×390 landscape).

**CrazyGames local testing:** read the SDK intro docs for how the v3 SDK behaves on `localhost` (local or demo mode with simulated ads). Use that to exercise every ad path: midgame, rewarded success, rewarded error, and adblock. The owner can also upload a build to the CrazyGames Developer Portal **QA tool** preview, which is the authoritative check. When you're done, ask them to run it and paste the results back to you.

## 2. Read the requirements

The owner has saved CrazyGames docs pages locally (ask where). The live docs are at https://docs.crazygames.com. Read every page below. Then write a checklist in `docs/crazygames-audit.md` with one row per requirement: requirement, source page, status (pass / fail / unsure), evidence (screenshot or `file:line`), and fix.

- Requirements: `requirements/intro`, `technical`, `gameplay`, `ads`, `account-integration`, `multiplayer`, `game-covers`, `quality`
- SDK: `sdk/intro`, `video-ads`, `banners`, `game`, `user`, `data`
- Resources: `resources/mouse-control`, `resources/html5/common-fixes`, `resources/getting-to-the-first-frame`, `resources/basic-launch-metrics`, `resources/ad-monetization-guide`, `resources/midgame-ads-pacing`, `resources/rewarded-ads-deep-dive`, `resources/monetizing-action`

The docs are the source of truth. If this brief contradicts them, the docs win, and note the mismatch.

## 3. Leads already found (verify each one; don't assume)

The cloud session found these in the code but couldn't run anything.

### Copyright and IP (a stated rejection category, so look at this closely)

The heroes closely track well-known IP:

- "Web-Slinger" (`src/48_spider.js`): Spider-Man
- "Speedster": the Flash
- "Ring Bearer" with a lantern, a spoken oath, hard-light constructs and willpower (`src/49_ring.js`, `src/49j_voice.js`): Green Lantern
- "Morph Band" aliens, including "Voidborn", which was renamed from "Alien X" (`src/45_aliens.js`, `src/45b_voidborn.js`): Ben 10's Omnitrix

Names and code comments still use `spider`, `lantern` and similar. List every name, look, costume color scheme, oath or phrase, and UI icon that a reviewer could read as someone else's IP. Propose original replacements to the owner (names, colors, silhouettes, the oath wording) **before** you change anything. The changes will be visible in all three builds.

### External requests and links (check against the `technical` and `ads` pages)

- Google Fonts: `src/shell.html` lines 7–9 load Bungee and Chakra Petch from googleapis. Check whether external font loading is allowed. If not, or if it delays the first frame, embed a subset or fall back to system fonts.
- PeerJS: `src/60_multiplayer.js` line 152 loads PeerJS from jsdelivr or unpkg, plus the public PeerJS broker and relays. Check what happens when these are blocked or slow. Multiplayer has to fail gracefully, with no hung UI.
- `SITE_URL` (`https://demo-repo-dusky.vercel.app`): `src/70_ui.js` around line 222 links out to the public site. Confirm it can never show in the CrazyGames build. External links are almost certainly forbidden.
- `api/turn.js`: confirm the CrazyGames build never calls it (the Readme says it doesn't).

### Microphone

`src/49j_voice.js` calls `getUserMedia` for the spoken oath. The CrazyGames build types the oath by default. Confirm that no path in the portal build ever triggers a microphone permission prompt. The safest option is to remove the voice setting from the portal build entirely.

### SDK usage in `src/64_portal.js`

Currently it calls `init`, `loadingStart`, `loadingStop`, `gameplayStart`, `gameplayStop`, `happytime`, `requestAd` (midgame and rewarded), `getInviteParam`, `isInstantMultiplayer`, `inviteLink`, `showInviteButton` and `hideInviteButton`. Check each one against the docs:

- `gameplayStart` fires only during real play, never in menus, character creation, the pause menu, knockouts or ads.
- During an ad the game **actually freezes** (simulation, timers, physics), not just the sound. Check the main loop in `src/99_main.js`.
- Audio stays muted until the ad ends, and the player's own mute setting survives an ad.
- Adblock or ad errors: rewarded buttons show a clean message, the reward isn't granted, and nothing gets stuck with `inAd` set to true.
- Whether banners are required, recommended or optional for this genre. If recommended, where they would fit.
- Ad pacing vs `resources/midgame-ads-pacing`: the current gap is 180 s and there are no ads in the first 3 minutes.
- Account integration: `sdk/user` for username and avatar (used in multiplayer names?), automatic login, and whether progress is saved through `sdk/data` so it follows the CrazyGames account. Check what "cloud save" in `361e5f9` actually does.
- Multiplayer requirements: instant multiplayer, invite links, keeping rooms across rounds, and the **disableChat** setting (is there any chat or free text between players? If so, it must obey that setting).
- `loadingStart` / `loadingStop` wrap the real loading, and `loadingStop` fires once the first frame is playable.

### Input and mouse (read `resources/mouse-control`)

Pointer lock is requested in `src/80_player.js` (`requestLock`). Check:

- Esc releases pointer lock without breaking the game (and ideally opens pause).
- Clicking back in re-locks the pointer.
- Space and arrow keys never scroll the parent page.
- The right-click context menu doesn't appear.
- Keys like Tab and F-keys don't fight the browser.
- The game survives being hidden (`visibilitychange`): no huge time jump or death spiral when the tab comes back.

### Land in gameplay

Full Launch expects players to land in gameplay right away. Time how many clicks and seconds it takes from page load until the player is moving in the city with the CrazyGames build on a fresh profile (clear storage). Also time loading to the first interactive frame. The owner says `361e5f9` added "Quick play", so check that it really is the default path.

### Content rating (PEGI 12)

Watch for: attacks on civilians and police, ragdoll launches, "wanted" stars and bounties, destroying buildings with people inside, and blood. Check `requirements/gameplay` and make sure nothing goes past PEGI 12.

## 4. Quality pass (the main reason for the rejection)

1. **Benchmark.** Open crazygames.com's New games (and a few top action and open-world superhero games) in the browser. Screenshot 5–6 of them: the first thing shown, the HUD, and the first minute of play. Note what they have in common: clarity, polish, onboarding, feedback, and how fast you get to the fun.
2. **Play the game yourself** in the CrazyGames build on a fresh profile: 5 minutes with each hero preset, including menus, pause, skills, change powers, multiplayer (two tabs creating and joining a room), and the rewarded flows. Record:
   - every console error or warning
   - every visual defect: overlapping or clipped UI, text overflow at small sizes, z-fighting, pop-in, tiny unreadable text, placeholder-looking art
   - every "I don't know what to do" moment
   - FPS, measured with a simple rAF counter injected through devtools, not by adding code
3. **Write an honest gap report** in `docs/crazygames-audit.md` → "Quality gaps", ranked by impact on a reviewer's first 60 seconds. Common areas:
   - the first screen and onboarding (a clear goal inside 10 seconds)
   - readability of the HUD and menus
   - game feel: hit feedback, screen shake, sound, particles
   - visual cohesion: lighting, fog, sky, color palette, character models
   - performance on a mid-range laptop
   - menu depth and jargon
   - bugs
4. **Bring the top items to the owner.** Before starting, give a short ranked list with an effort estimate for each and what you recommend. Then implement the approved items, starting with the biggest improvement per unit of effort.

## 5. Covers, video and metadata

The owner has artwork and videos locally (ask where). Check them against `requirements/game-covers`: exact sizes and aspect ratios, file formats, video length and size limits, rules on text or logos, and whether they honestly show gameplay. Replacing the old art is part of the IP review too. Also draft the game description and controls text for the submission form. Give the owner a list of anything that doesn't pass and what to change. Don't generate replacement art unless they ask.

## 6. Working rules while fixing

- Edit `src/`, then run `node tools/build.mjs crazygames`, and commit the rebuilt `index.html` and `dist/crazygames/index.html` together with the source.
- After every change, re-test **both** `index.html` (website) and `dist/crazygames/index.html`. Neither should show new console errors, and on the website every portal feature must stay a no-op.
- Keep commits small and self-describing, one topic each. Push to `cg/quality-pass`. **Don't merge to `master`**, because the owner decides that.
- Update `Readme.md` wherever behavior changes (it documents the CrazyGames differences in detail).
- After you've verified everything, make the upload zip with `index.html` at the zip root:
  `cd dist/crazygames && zip -X ../skyline-guardian-crazygames.zip index.html`

## 7. Done means

- `docs/crazygames-audit.md` has the full requirements checklist, all rows pass or are explained, with evidence, plus the ranked quality-gaps section showing what was fixed and what's left.
- A before-and-after screenshot set at 1280×720 of the first 60 seconds.
- A zero-error console on both builds through the scripted playthrough.
- A rebuilt zip, pushed on `cg/quality-pass`.
- A short final message to the owner covering:
  - what changed
  - what they must do by hand (portal QA tool run, covers, metadata, IP decisions)
  - an honest read on whether it's ready to resubmit. Also tell them to ask CrazyGames support whether a rejected game can be resubmitted, and how, since this brief doesn't know their policy.

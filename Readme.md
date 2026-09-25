# Skyline Guardian

An open-world superhero sandbox that runs in the browser. You create a hero, pick your powers, and choose your side in the island city of Nova Bay: stop the robberies, muggings and heists happening around you, or become the reason people lock their doors. Every fight earns XP and skill points, and the city remembers which side you picked.

## Play

Open `index.html` in a recent browser (Chrome, Edge, Firefox or Safari). You don't need a build step, a server or an install. The whole game is one file with no dependencies, written in raw WebGL 2.

It works on laptops and phones. The game detects your device and switches between keyboard-and-mouse and touch controls automatically. You can override this in Settings.

## Your hero

- **Pick your powers once.** When you create a hero you choose **2 movement powers** and **3 abilities** for free. After you confirm, they're locked for that hero.
- **Level up by fighting.** You earn XP from fights, from damage you deal, and from glowing orbs around the city (yellow 25 XP, blue 50, red 100; red orbs only appear on rooftops). Each level gives you **3 skill points**.
- **Spend skill points** to upgrade your powers (up to level 10) and four passives: Strength, Vitality, Healing and Energy (up to level 50 each).
- **Reputation** decides your side. Stopping criminals makes you a Hero (Rookie → Vigilante → Protector → Guardian → Legend). Hurting civilians and police, or robbing shops and ATMs, makes you a Villain (Troublemaker → Outlaw → Menace → Supervillain → Nemesis). Villains get chased by police, and at −1500 reputation a bounty puts rival heroes on your trail.

### Powers

| Movement (pick 2) | Abilities (pick 3) |
| --- | --- |
| Flight | Fireball · Ice Cloud · Lightning Bolt · Energy Blast |
| Super Speed | Laser Vision · Telekinesis · Shockwave |
| Wall-Climb | Metal Skin · Energy Shield |
| Web-Swinging | |

Everyone can also punch (a 3-hit combo) and do a charged super jump.

## Controls

| Keyboard and mouse | Action |
| --- | --- |
| `W` `A` `S` `D` | Move |
| Mouse | Look and aim |
| Left click | Punch (hold to keep swinging) |
| `1` `2` `3` (or `Q` `E` `R`) | Your abilities. Hold for beams, clouds and telekinesis |
| `Space` | Jump. Hold, then release for a super jump |
| `F` | Flight on/off (Space climbs, `C` dives, `Shift` boosts) |
| `Shift` | Super Speed (if you picked it) or sprint |
| Right click (hold) | Web-Swinging (if you picked it) |
| `Tab` or `K` | Skills and upgrades |
| `L` | Lock or unlock the mouse. When it's unlocked, drag with the middle mouse button to look |
| `Esc` / `P` | Pause (Appearance, Leaderboard and Settings are here) |

On touch screens: drag on the left side to move, drag on the right side to look, and use the on-screen buttons for everything else.

## The city

- **Crimes** play out on their own and only show up as icons on your minimap. There are no pop-ups. Drones rob shops and float the loot to a getaway van, drones hack ATMs, thugs mug people, and thieves break into cars and drive off. If you step in and stop one, you get a bonus.
- **Heists** are rare and big. The mothership tries to lift the bank vault into the sky, or a Titan mech rips open an armored truck.
- **People react.** Civilians flee from fights and from villains. Thug gangs hang around alleys and attack heroes on sight. Police go after villains and wanted criminals. Rival heroes and villains with their own powers stand in for other players.

## Saving and the leaderboard

Progress saves automatically in your browser. In the claude.ai version, a shared leaderboard shows the most respected heroes, the most feared villains and the highest levels. Everywhere else, the board shows only your own hero.

## For developers

All balance numbers (powers, passives, NPCs, reputation, crime timing) live in the config objects near the top of the game script (`CONFIG`, `POWERS`, `PASSIVES`, `NPCS`, `REP`, `CRIMES`). Systems talk through a small event bus (`damaged`, `defeated`, `levelUp`), so progression and reputation only listen to combat events. See `ROADMAP.md` for what's planned next.

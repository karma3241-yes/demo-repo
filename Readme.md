# Skyline Guardian

An open-world superhero sandbox that runs in the browser. You create a hero, pick your powers, and choose your side in the island city of Nova Bay: stop the robberies, muggings and heists happening around you, or become the reason people lock their doors. Every fight earns XP and skill points, and the city remembers which side you picked.

## Play

Play it online at **https://demo-repo-dusky.vercel.app**, or open `index.html` in a recent browser (Chrome, Edge, Firefox or Safari). You don't need a server or an install. The game ships as one file with no dependencies, written in raw WebGL 2.

It works on laptops and phones. The game detects your device and switches between keyboard-and-mouse and touch controls automatically. You can override this in Settings.

## Your hero

- **Start playing right away.** New players press **Play** and start as the **Ring Bearer** (or pick **Choose your powers** first). The first change of powers afterwards is free: press `J` or the swap icon in the top-left icon bar. The change-powers screen is wide, and every power has its own icon.
- **Build your hero.** When you create a hero you pick **one traversal power**. Six of them are complete hero kits (**presets**: Web-Slinger, Speedster, Storm God, Armored Inventor, Sun Titan and Ring Bearer) that come with their own body and moves. You have **five power keys** (`1`–`5`): a hero kit puts **3 of its own moves on keys 1–3** (you choose which) and you pick **2 more for keys 4–5**, either the rest of your kit or any power from the shared pool (so the Ring Bearer and the Speedster can still carry all five of theirs). The last, **Flight**, lets you build your own: pick **one body mod** (its signature move goes on key 1) and **4 abilities**. Saves from before five keys keep their powers and get the new keys filled in; change them any time. You can swap later with **Change powers** in the pause menu whenever you like. Skill points you spent on powers you drop come back to you.
- **Level up by fighting.** You earn XP from fights, from damage you deal, and from glowing orbs around the city (yellow 25 XP, blue 50, red 100; red orbs only appear on rooftops). Each level gives you **3 skill points**.
- **Spend skill points** to upgrade your abilities and body mod (up to level 10) and four passives: Strength, Vitality, Healing and Energy (up to level 50 each). Upgraded powers look stronger too. For example, Laser Vision starts as a thin orange line and ends as a thick red beam, and Telekinesis lifts more, and heavier things, as it levels up. **Reset skill points** at the bottom of the Skills screen refunds everything you spent.
- **Traversal grows with use.** Your traversal power has no skill points. It gets better the more you use it (mastery 1–10): flight gets faster, jumps go higher, web swings get faster and unlock new tricks, the speed dial goes higher, and ring constructs get bigger and unlock new shapes.
- **Suit up** with `U`. You swap between your civilian clothes and your suit, and each kind of hero changes differently.
- **Reputation** decides your side. Stopping criminals makes you a Hero (Rookie → Vigilante → Protector → Guardian → Legend). Hurting civilians and police, or robbing shops and ATMs, makes you a Villain (Troublemaker → Outlaw → Menace → Supervillain → Nemesis). Villains get chased by police, and at −1500 reputation a bounty puts rival heroes on your trail.
- **How hard you get hit** depends on your hero: the Armored Inventor barely gets knocked back (×0.45), while the Storm God and the Sun Titan get sent flying further (×1.4).

Saves from before this update are converted automatically: you keep your level, reputation and upgrades, get the closest new build, and can change powers for free once.

### Hero presets

All of these are original characters inspired by famous hero styles.

**Web-Slinger** (Web-Swinging). A full city-swinging kit inspired by the Insomniac games.
- **Swing** with right click. Webs find buildings ahead of you and chain while you hold. Press `Shift` mid-swing for a boost.
- **Web-zip** by tapping `Space` in the air. Hold `Space` in the air to open **web wings** and glide. Updrafts over tall roofs and parks lift you.
- **Slingshot launch:** hold `Space` on the ground.
- **Tricks:** dive by looking down and pressing forward. `C` in the air does a trick; flips unlock as mastery grows. You roll out of hard landings.
- **Crawl** on any wall.
- **Spider-sense** sometimes dodges attacks for you.
- **Web tether:** right click on someone yanks them toward you. Keep holding it and you stay webbed on: if they run, drive or fly off, you get dragged along on the rope (it slowly reels you in). It works on people, rival supers, cars and other players. Any shield (Energy Shield, Ring Shield, the Metal Forms shield arm) cuts the web.
- **Abilities:** Web Strike (yank someone, or swing-kick them from the air), Web Bomb (pins everyone nearby) and Web Whip (knocks back everyone around you).

**Speedster** (Super Speed). No energy limit: a yellow **calorie** bar instead. Running fast and using powers burn calories. Run out and the speed dial tops out at ×2, your powers take three times as long to come back, and Time Stop is locked. Press `G` at any shop to eat and fill right back up.
- **Running:** `Shift` runs, and `F` turns on fast mode so you always run. The **speed dial** (`[` `]` or the mouse wheel) sets how fast. It goes up to ×3 at first and ×12 when mastered, and your punches hit harder the higher it is.
- **Phasing:** `C` vibrates you through buildings.
- **Abilities:** Lightning Throw, Phase Strike (vibrates your hand through a target), Speed Tornado and Slow Time. Slow Time slows the world while you move normally, and the dial sets how slow. In multiplayer it speeds you up instead and doesn't touch other players.
- **Time Stop** freezes everyone for 3 seconds, other players included. Everything you hit in that moment lands at once when time starts again, and your path shows as lightning streaks.

**Storm God** (Storm Flight). Instead of energy he has a **lightning** meter. Only lightning costs charge: Lightning Bolt, the Storm Hammer's lightning strike and the bolt when you blast off. When it runs out he can still fly and fight, and the hammer still flies, just without the lightning. To recharge, land on top of a tall tower and press `G` to raise the hammer and call the storm down into it.

**Armored Inventor** (Armor Flight). The suit runs on a **battery** instead of energy. Every power uses it, and flying drains it slowly. When it's empty the suit drops into **standby**: you can still fly and punch, but no repulsors, energy blasts, core beam or shield. Recharge at **Inventor Tower** (the red and gold skyscraper marked **I** on the minimap): land on its roof or its landing pad, or walk into the lobby. Upgrade the battery's capacity (100 up to 300) with skill points in the Skills screen.
- **Suit forms:** the armor folds itself into a red and gold **Jet** (Armored Inventor mastery 1), **Bike** (2), **Sports Car** (3) or **Tank** (5). `V` opens the forms wheel (`N` if you also carry the Morph Band) and `B` turns into your last form and back. Forms run on the battery; the tank's turret follows your aim.

**Ring Bearer** (Power Ring). Everything runs on **ring charge**, which never refills by itself.
- **Say the oath out loud:** by default the game listens (the CrazyGames build defaults to typing it instead; *Say it out loud* is still in Settings there). When you start playing as the Ring Bearer it asks for your microphone; then press `O` and speak the oath. The ring charges line by line as you say it, and small mistakes or misheard words are forgiven. **Settings → Ring oath** switches between *Say it out loud* and *Type it (Tab)*. If the browser can't listen or the microphone is blocked, it falls back to typing, even halfway through an oath.
  - **You keep moving:** while you speak you can walk, fly (`F`), punch and fight as normal, and your keys aren't typed into the oath. The ring itself is busy, though. Opening the spoken oath releases your construct and drops the Ring Shield, and until you finish, ring powers (`1`–`5`), constructs (`B`, `V`), growing and rebuilding (`Y`) just tell you to *finish the oath first*. `O` again or `Esc` puts the lantern away (tap OATH again on touch screens). On touch screens you can still type the oath while it listens.
  - **Overcharge:** say it loudly. The oath panel shows your mic level against a white line, and if your voice passes the line at any point during the oath, finishing it overcharges the ring to **200** instead of 100. Said quietly it stops at 100. You can also say it with a full ring just to overcharge it. Above 100 the ring bar glows and fizzes, and a brighter second layer shows the charge from 100 to 200 (a steady glow if your system asks for reduced motion). The overcharge is spent like any other charge and is kept when you save. **Settings → Ring oath → Overcharge loudness** sets the line; *Test your mic* shows a live level so you can see where your voice lands. The mic is only open while the spoken oath or the mic test is running.
- **Recharging by typing:** in *Type it* mode, press `O` to hold up the lantern and type the oath to recharge. The game doesn't pause and the mouse stays locked: just start typing, and `Enter` or `Esc` puts the lantern away. The first time, the oath shows in the middle of the screen with an explanation. After you've typed it once, it sits as plain text in the bottom-right corner and `Tab` (NEXT WORD on touch screens) fills in each word for you. At 0 charge you can only walk.
- **Flying:** `F` flies.
- **Constructs:** `B` builds your default construct and `V` opens the construct wheel. Inside a construct, tap `V` to step out of it, or hold `V` to open the wheel and switch (let go of `V` on a construct to pick it). The choices are a spiked Bubble, a Jet (guns and homing missiles), a Mech and a Huge Mech (punches, guns, missile salvos; the huge one tramples buildings) and a Dragon you ride (claw strike, breath, roar). Inside a construct, left click, right click and `X` are its attacks.
- **More constructs** on the wheel's second page (`Q`/`E`, the mouse wheel or the page button switch pages):
  - a **Bike** (ring mastery 2) and a **Race Car** (4) that you drive with `WASD`, `Shift` to boost and `Space` to hop, with guns on left click (and a ram or missiles on right click);
  - a hard-light **Rifle** (1: rapid fire, a heavy burst and a grenade on `X`), a **Bazooka** (3: rockets and a homing salvo) and the **Shoulder Cannon** (8): hold left click to charge it and let go to fire a beam that cuts through buildings.
  The weapons work on foot or in the air.
- **Even more constructs** (`V` shows every construct at once: the originals on the inner ring, these on the outer ring; push the mouse further out to reach it):
  - **Bikes & boards:** a **Bicycle** (costs half a point of charge once, then nothing at all, even on an empty ring; left click rings the bell), a **Chopper** (guns, wheelie ram), **Rocket Skates** (spin kick), a **Hoverboard** (big air, tricks in the air on left click) and a **Monster Truck** that drives over cars and slam-jumps on right click;
  - **Heavy & sky:** a **Light Tank** (cannon, machine gun), a **Helicopter** (guns, missiles), a **Hang Glider** that barely uses any charge, a **Flying Saucer** whose tractor beam throws whatever is below it, and a **Starship** made for space (lasers, torpedoes, `X` to warp);
  - **Blades & guns:** a **Giant Sword** (slash, spin), a **War Hammer** (smash, ground quake), a **Longbow** (hold to draw), a **Minigun** and a **Tower Shield** that blocks 80% of every hit.
- **Weapon constructs** (Rifle, Bazooka, Cannon, Sword, War Hammer, Longbow, Minigun, Tower Shield) cost charge only to build and for each shot they fire. Holding them and swinging melee weapons is free.
- **The typed oath** doesn't take your construct away: you hang in the air where you are, construct and all, until you finish. (The spoken oath leaves you free to move instead, but releases the construct.)
- **Rebuild the city:** press `Y` (REBUILD on touch) to spend 10 ring charge and rebuild every broken building at once. Green hard-light copies rise first, then the real buildings fill them in.
- **Grow anything:** in any construct, scroll up (or `]`) to grow it a fifth bigger per step, and scroll down (or `[`) to shrink it back, all the way up to the size of the Earth. Each step up costs 0.9 ring charge; each step down gives back a quarter of that. Bigger constructs hit harder, fire bigger shots and missiles, flatten the buildings they touch, and the camera pulls back to fit. You stay your normal size: a grown ride just lifts your seat, and a grown weapon is held by a giant green hard-light copy of you. On touch screens use GROW and SHRINK.
- **Grow your powers:** powers like Hammer Smash fire when you let go of their key. While you hold it (`1`–`5`), a ring shows where it lands and how big it is; scroll to change its size, up to 30 times (on touch, hold its button and tap GROW or SHRINK). A bigger power reaches further and hits harder: a bigger Hammer Smash, Black Hole, fireball, blast and so on. The size shows on the power's slot. Growing costs energy (ring charge for the Ring Bearer), shrinking gives a quarter back.
- **Abilities:** Ring Blast, Hammer Smash, Chain Lasso and Ring Shield.
- **Ring Shield** has its own health (shown on the HUD shield bar) that grows as you upgrade it. Holding it up barely costs charge, and each hit it takes costs a little more. If it breaks, it takes 4 seconds to rebuild.
- **Black Hole** costs 95% of your charge. It drags in people, cars, rubble and whole buildings; only the strong or the very fast get away.

### Build your own (Flight)

| Body mod (pick 1, its move goes on key 1) | Abilities (pick 4) |
| --- | --- |
| **Metal Skin → Metal Forms**: turn to steel. Tap again to turn your hand into a hammer, a spiked flail, a blade or a shield; hold to turn back | Fireball · Ice Cloud · Lightning Bolt · Energy Blast · Laser Vision |
| **Blade Claws → Blade Leap**: a slashing lunge, and you heal much faster | Telekinesis · Shockwave · Energy Shield · Morph Band |
| **Elastic Body → Stretch Strike**: your arm shoots out, grabs someone and slams them down. Your punches reach further and hard landings bounce you back up | Storm Hammer · Repulsor Barrage · Core Beam · Ricochet Shield |
| **Titan Growth → Giant Form**: grow to three times your size, hit like a giant, and pick up cars with `G` | Blink · Gravity Well · Spirit Wave · Time Dilation |

**Telekinesis:**
- **Controls:** hold the key to lift, right click to grab more at once, left click to slam everything into the ground, and let go to throw.
- **What it lifts:** people and drones at level 1, cars at 3, rubble at 5, trucks at 6, and at 9 you tear slabs out of buildings.
- **Upgrades:** you hold one more object every 3 levels, and holding costs less energy as it levels up.

The other abilities:

| Ability | What it does |
| --- | --- |
| Storm Hammer | Throw a hammer that calls lightning where it hits, smashes everything in its path and flies back to your hand |
| Repulsor Barrage | Hold to fire rapid palm blasts from alternating hands |
| Core Beam | Wind up, then a chest beam burns through people, cars and buildings for 1.5 s |
| Ricochet Shield | A disc that bounces between up to 6 targets and comes back |
| Blink | Teleport to where you aim, knocking back anyone near where you appear |
| Gravity Well | A singularity that drags in people, cars and street furniture, then detonates |
| Spirit Wave | Hold to charge, release a huge wave that can bring down a building |
| Time Dilation | The world slows to a quarter speed while you move normally (a speed boost in multiplayer, where time can't bend) |
| Sonic Scream | A deafening cone that stuns and hurts everyone in front of you and shatters windows |
| Quake Stomp | A line of erupting rock races along the ground and throws everyone in its path into the air |
| Meteor Strike | A meteor lands where you aim a moment later, with a huge blast that even hurts buildings |
| Force Push | A wall of force that sends people, cars and debris in front of you flying |
| Chain Lightning | A bolt that jumps from enemy to enemy (counts as a lightning attack for the Storm God) |
| Healing Pulse | Heals you and gets injured people around you back on their feet |
| Invisibility | Toggle: enemies and the police lose track of you while it drains energy |
| Vine Snare | Thorny vines burst out where you aim and hold everyone there in place |
| Shadow Step | Vanish and reappear behind your target, striking as you arrive |
| Plasma Whip | A fast sweeping whip that hits everything in a wide arc around you |

### Fighting

- **Punch chains.** Click up to four times for a chain. Hits 1–3 stun and keep the target close; hit 4 is a finisher. It launches them, or it's an **uppercut** if you hold `Space`, or a **spike** into the ground if you're in the air. Juggle airborne targets by hitting them again. In the air, only your first three punches hold you up; after that you drop until you land.
- **Lock on** with `Z` to keep your camera, punches and powers on one target (people, drones, rival heroes, helicopters, bosses or other players), at any distance. Press `Z` again to let go. When you're locked on, your punches lunge to close the gap, and the chain has a slower rhythm (half a second between punches, about a second after a finisher), so you can't spam it. When you beat your target, the lock jumps to the nearest enemy within 110 m.
- **Dash** with `X` in any direction you're holding, once in mid-air too. You can't be hurt for a moment at the start of a dash.
- **Charged punch.** While flying and locked on, hold the left mouse button to charge, then let go: you rocket into the target and send them flying hundreds of meters.
- **Ragdolls.** Anyone launched by a finisher or a charged punch goes limp and tumbles, then gets up if they can.
- **Everything breaks.** Launched bodies crater walls, smash cars and flatten street furniture. Hit a building hard enough (a charged punch, flying into it at speed, Spirit Wave or Core Beam, big explosions, a black hole) and **the whole building collapses** into dust and rubble. It grows back a couple of minutes later. The bank, hospital and police headquarters are landmarks and never fall.

You start tough: 220 health, and ordinary people and police do half damage to you.

### Getting around

- **Space:** anything that flies can keep climbing. Past the clouds the sky turns black, Earth curves away below, and you can keep flying or press `F` to let go and drift slowly back down; nothing snaps you back. The higher you are, the faster you fly (it slows down again near any surface), so the Moon, Mercury, Venus, Mars, Jupiter, Saturn (with its rings), Uranus, Neptune and a few of their moons are all a short trip away. The planets are solid, so you can land on them. The Sun burns. Past the city the ocean goes on and on: nothing pulls you back, so roam as far as you like. Flying constructs like the Dragon can land too: press `F`. Once you're far from Earth (about 9 km), the city, its lakes and the ocean drop out of view and only the planet is drawn.
- **Wall running** is for everyone: sprint (hold `Shift`) into a wall to run up it, or hit it at an angle to run along it. `Space` leaps off. The Speedster's wall running gets faster with the speed dial.
- **Parkour leap:** a quick jump while sprinting carries you much further.
- **At night** the street lamps and car headlights light up the streets around you.
- **Swimming:** off the island you swim instead of standing on the sea. You float with your head above the water and move at swimming pace; hold `C` to dive, and let go (or hold `Space`) to come back up. At the surface `Space` jumps out (hold it for a super jump), and swimming into the shore climbs you out. Hitting the water splashes (bigger the faster you hit it), the screen turns blue while the camera is under, and bubbles rise as you swim. Cars, constructs, giant aliens and a Speedster running fast still skim across the top. Park ponds are shallow: walking through one splashes and slows you down.

### Morph Band

The Morph Band is an ability that turns you into one of seven alien forms. Press `V` (or its ability key) to open the dial, then pick an alien. While you're transformed, your ability keys use the alien's own powers, and a timer counts down until you change back. Press `V` again to change back early. The band then needs to recharge. Alien forms move with their own body, not your traversal power.

| Alien | Band level | What it does |
| --- | --- | --- |
| Magmaw | 1 | Molten brute: burning fists, a volcanic ground slam, thrown lava rocks |
| Zephyrix | 1 | Storm sprite that always flies: gale blasts, tornadoes that pull in cars and people, a slipstream dash |
| Cryolith | 3 | Living glacier: ice spike lines, freezing breath, crystal armor |
| Voltwing | 5 | Very fast and climbs anything: chain lightning, an EMP that stalls cars, short-range blinks |
| Colossus | 7 | A titan three times your size: ground stomps, car throwing, huge punches |
| Umbra | 9 | Shadow phaser: turns invisible to enemies, walks through walls, teleport strikes |
| Voidborn | 1 | Flies. Star Flick (a huge cone blast), Big Bang (an explosion where you aim), Rewrite (full heal and freezes everyone near you for 4 s). But first you have to answer the masks (below) |

Upgrading the band unlocks more aliens, makes transformations last longer (45 s at level 1, 150 s at level 10), shortens the recharge and makes alien attacks hit harder. The aliens are original designs.

**Voidborn** works differently. The moment you morph, your body turns into Voidborn and freezes where it stands, and your view is pulled out to a far corner of space with two giant floating masks. They ask one question with three answers: press `1`, `2` or `3` (or tap / click an answer) within 20 s. While you're being asked, nothing can hurt you.
- **Right answer:** your view comes back and you play as Voidborn. How long depends on your **Energy** passive, not the band level: 5 s with no Energy upgrades, rising in a straight line to **3 minutes** at the max (Energy 50). The dial shows your current time.
- **Wrong answer (or out of time):** your view comes back, but you stay frozen in the Voidborn body for 30 s: you can't move, use powers or change back, and you can be hit. Then you change back and the band recharges.
- There are 30 questions. You get one you haven't had yet every time (after all 30 they start over), and in a multiplayer room no two players get the same question.

## Controls

| Keyboard and mouse | Action |
| --- | --- |
| `W` `A` `S` `D` | Move |
| Mouse | Look and aim |
| Left click | Punch chain (hold to keep swinging). While flying and locked on: hold to charge a punch |
| `Z` | Lock on to a target / let go |
| `X` | Dash |
| `1`–`5` (or `Q` `E` `R`) | Your abilities. Hold for beams, clouds and telekinesis |
| `Space` | Jump. Hold, then release for a super jump. Leap off walls |
| `F` | Flight on/off. Hold it on the ground to charge, then let go to blast off into the sky |
| `U` | Suit up / suit down |
| `O` | Ring Bearer: hold up the lantern and say (or type) the oath. While you're saying it, `O` or `Esc` puts it away |
| `G` | Get in or out of a car, or help an injured person up |
| `V` | Morph Band dial / change back (Ring Bearer: construct wheel; in a construct, tap to step out, hold for the wheel) |
| `Tab` or `K` | Skills and upgrades |
| `J` · `I` | Change powers · Appearance |
| `6` · `7` | Multiplayer · Settings |
| `H` | Show or hide the move list |
| `C` in water | Dive (let go, or hold `Space`, to swim back up) |
| `L` | Lock or unlock the mouse. When it's unlocked, drag with the middle mouse button to look |
| `Esc` / `P` | Pause (Appearance, Multiplayer, Leaderboard and Settings are here). In a multiplayer room the menu opens but the game keeps running |

**Icon bar.** Under your name (top left) is a row of icons, one for every menu: move list, skills, change powers, appearance, multiplayer and settings. Each icon shows its key; with the mouse locked press the key, or press `L` to free the mouse and click. In the CrazyGames build the rewards are here too: double XP (`9`), refill (`0`), try locked powers (`,`) and cosmetics (`.`).

**Move list.** The panel on the right lists everything your current hero can do: moving, your five powers by name (on CrazyGames, with the level each one unlocks at), fighting, the hero's own keys (for the Ring Bearer: constructs, the wheel, the oath, rebuilding) and the menus. It starts closed ("Getting started" shows an `H · all moves` hint); `H` or its icon shows or hides it, and once you choose, it stays that way. It always fits on screen without scrolling: it lays out in two columns, shrinks its rows if it has to, and folds "Getting started" down to your next step while it's open. Its top row reminds you that `H` hides it. Opening a menu or Change powers frees the mouse, so the cursor is always there to click with.

**Leaderboard.** A small leaderboard sits on the left, under the icon bar: switch between most respected, most feared and highest level, and click it for the full board (also in the main menu and the pause menu). On touch screens it's in the pause menu only.

**Markers.** Every crime has a floating `!` over it with its distance (heists get a bigger, pulsing `!!`); when it's off screen the marker waits at the edge of the screen with an arrow pointing the way. When your hero's meter drops below a quarter, a marker shows where to recharge it and a hint above the meters says how: the suit battery at Inventor Tower, lightning on the nearest tall roof, calories at the nearest shop, and the ring by pressing `O` to say the oath.

**Driving:** `W` accelerates, `S` brakes and reverses, `A` and `D` steer, `Space` is the handbrake, and `G` gets you out.

On touch screens: drag on the left side to move (or drive), drag on the right side to look, and use the on-screen buttons for everything else. The USE button gets you into cars and helps people up, LOCK locks on, DASH dashes, SUIT suits up, and holding PUNCH while flying and locked on charges a punch. Each hero gets its own extra buttons (WEB, FAST/PHASE/DIAL, BUILD/PICK/ALT/OATH, GRAB+).

## The city

Nova Bay is laid out like Manhattan and Queens, about one and a half times the size of the old city. **Manhattan** is a long, narrow island running north to south: a dense financial district of glass towers at its southern tip (with the bank and police headquarters), a midtown skyscraper cluster (with Inventor Tower), a huge **Central Park** rectangle in the middle with a lake, the reservoir and no roads through it, brick uptown neighborhoods, and piers with cranes along the west shore. Across the **East River**, **Queens** is lower and mostly houses, with a few towers near the water, a main shopping street, and industrial yards and containers along the waterfront. Three suspension **bridges** cross the river, and a road runs along every shoreline. The hospital (where you wake up after being knocked out) is on the east side of the park. The bank, hospital, police headquarters and Inventor Tower are marked on the minimap.

- **Traffic** follows lanes and traffic lights, and cars honk and brake for people in the road. You can take any car with `G`. Taking a car that someone is driving is a crime.
- **Almost everything breaks.** Street lamps, traffic lights, benches, trees, bus stops, mailboxes and hydrants shatter into pieces (and hydrants spray water). Windows break from explosions, lasers and crashes. Cars can be wrecked, and debris bounces off buildings. Broken street furniture comes back after a couple of minutes.
- **Crimes** play out on their own and show up as `!` markers over them (with their distance) and as icons on your minimap. There are no pop-ups. Drones rob shops and float the loot to a getaway van, drones hack ATMs, thugs mug people, and thieves break into cars and drive off. If you step in and stop one, you get a bonus.
- **Heists** are rare and big. The mothership tries to lift the bank vault into the sky, or a Titan mech rips open an armored truck.
- **People react.** Civilians flee from fights and from villains. Criminals can leave people injured on the ground; heroes can help them up with `G`. Thug gangs hang around alleys and attack heroes on sight. Police go after villains and wanted criminals, and patrol cars chase them with sirens. When you're wanted, **police helicopters** join in at 4 stars; they circle overhead, sweep a searchlight at night and fire at you; shoot one down and it spins out of the sky. Rival heroes and villains with their own powers roam the city too.
- **Hunter squads.** Stay at 5 stars for a while as a villain and the city sends an armada of hero robots after you. Rack up a long win streak as a hero (25 takedowns without going down) and the villains send robots after you. Each robot has its own kit: fliers strafe you, speedsters rush you on foot, brawlers smash the ground, beamers hold a laser on you and bombers drop rockets from above. More arrive every wave. They pull out when you go down, or when your stars drop. In a room-code game the host's city sends squads after any player who earns one.
- **Wanted level.** Crimes against civilians and police earn you wanted stars (1–5), shown at the top of the HUD. 1 star sends officers on foot, 2 brings police cars, 3 sends more of everything, 4 calls in helicopters and 5 is everything at once. Stay out of the police's sight and you lose a star at a time; the stars blink while they can't see you. Getting knocked out clears them.
- **City life:** airliners cross high overhead (contrails by day, blinking lights by night), a blimp circles the city, gulls circle over the parks and rooftops, pigeons sit on roof edges and park paths and scatter when you come close, and speedboats, ferries and sailboats cruise the water with a wake behind them. It's all scenery: nothing in it fights you or blocks you.
- **Parks:** each small square park has a fountain with a stone basin, a column and an upper bowl; water sprays from the top and from jets around the rim and pours down from the bowl. The ponds in the big parks have irregular shores, ripples and glints of sunlight.
- **Bounty.** As a villain, your crimes also build a bounty (bigger the more stars you have). It stays on your head until a hero takes you down: a hero player collects it as XP and reputation, and a rival hero can claim it too. Other players can see your stars and bounty on your name tag.

## Multiplayer

**Room codes (public site, https://demo-repo-dusky.vercel.app).** Open **Multiplayer** from the main menu or the pause menu. One player clicks **Create a room** and shares the 5-letter code or the invite link; friends join with the code (or just open the link). Up to 8 players share the city. No accounts are needed. Players connect directly to each other over WebRTC; the free PeerJS server only introduces them, and the host's game relays positions and attacks, so the room stays open while the host is playing. Most home networks work; some strict school or office networks block these connections.


**If joining fails.** Players connect straight to each other when they can. When a network blocks that (mobile data, school or work wifi, some routers, VPNs), the connection goes through a relay server instead, which can be slower. The site gets short-lived relay logins from Cloudflare (`api/turn.js`) once the Vercel project has its two Cloudflare variables set (see *Multiplayer relay setup* below); until then it uses a free public relay, which works on a best-effort basis. If it still can't connect, the message says whether the matchmaking server couldn't be reached or the host couldn't be reached.

**Multiplayer relay setup (once, free).** In the Cloudflare dashboard go to **Realtime → TURN Server**, create a TURN key and copy its **Key ID** and **API token**. In Vercel open the project's **Settings → Environment Variables**, add `CF_TURN_KEY_ID` and `CF_TURN_API_TOKEN` with those values, and redeploy. The token stays on the server; players only ever get logins that expire after an hour. The free tier covers 1000 GB of relayed traffic a month. The endpoint only answers pages on this site. To catch misuse early, add a usage notification in your Cloudflare account (for example at 500 GB) so a spike emails you. The CrazyGames build never uses this relay.

**claude.ai version.** Everyone in the page owner's organization who has it open plays together automatically, with no code. claude.ai doesn't let people invited from outside the organization into the live room, so play with them on the public site instead. The status line in the top-right corner (top of the screen on phones) shows whether you're connected.

**In a room-code game everyone shares the host's city.** The host's game runs the people, police, gangs, traffic, drones, helicopters, rival heroes, heists and crimes, and everyone else sees the same ones. Your hits on them count, you get XP for your kills and for crimes you help stop, and police and criminals come after whichever player they have a problem with. Time of day, broken street furniture, windows, craters and collapsed buildings are shared too. Telekinesis works on the host's people and cars and on other players: lift a friend and throw them.

In the claude.ai version, players are shared but each player's city runs on their own device.

In both, by default heroes can't hurt other heroes and villains can't hurt other villains; neutral players can fight anyone. Knocking out another player gives you XP and moves your reputation (towards Hero if you beat a villain, towards Villain if you beat a hero). Opening the menu doesn't pause you in multiplayer.

**Host controls (room codes).** The player who created the room gets **Host controls** in the Multiplayer screen:
- **Player fighting:** heroes vs villains (the default), everyone can fight, or no fighting between players.
- **Crimes happen** and **Police and wanted levels** on or off.
- **Lock the room** so nobody new can join.
- **Time of day:** morning, noon, evening or night, for everyone.
- **Rebuild the city now** grows every collapsed building back right away, for everyone.
- **Remove a player** from the room.

Everyone else sees the current room rules in their Multiplayer screen.

## Saving and the leaderboard

Progress saves automatically in your browser. A short checklist in the corner walks new players through the basics. In the claude.ai version, a shared leaderboard shows the most respected heroes, the most feared villains and the highest levels. Everywhere else, the board shows only your own hero.

## For developers

The game source lives in `src/`: numbered JavaScript modules plus an HTML/CSS shell. Run `node tools/build.mjs` to join them into `index.html` (no packages needed). Commit the rebuilt `index.html` alongside source changes.

**CrazyGames build.** `node tools/build.mjs crazygames` also writes `dist/crazygames/index.html`: the same game with the CrazyGames SDK loaded in front of it. Zip that one file (with `index.html` at the top of the zip) and upload it on the CrazyGames developer portal. The website and the claude.ai version never load the SDK and keep today's balance. The CrazyGames build differs in these ways:

- **Slower, tighter progression:**
  - Your power keys open with level: key 1 at the start, then LV 2, 4, 6 and 9.
  - Traversal mastery takes about 6 hours instead of 1.
  - Flight starts at 20 m/s with a small Shift boost, and grows to full speed with mastery.
  - The speed dial starts at ×2, and the space speed-up starts at ×10 (×90 when mastered).
- **Caps on growing:**
  - Constructs grow to 2× at first and up to 30× with mastery (never Earth-sized).
  - Held powers grow to 1.5× at LV 1 and up to 10× at LV 10.
  - Black Hole only tears down buildings from LV 5.
- **Rewarded ads.** Always optional; they only get you there sooner.
  - **Try locked powers:** one ad gives 10 minutes of any of these: a locked power key, your traversal at full mastery, one of your powers at LV 10, a locked construct or suit form, or a locked alien. It's in the pause menu, or you can click a locked slot on the wheel.
  - **Refill:** refill your ring charge, battery, calories or lightning.
  - **Double XP** for 5 minutes.
  - **Cosmetics:** 4 glowing suits, 4 trails, 4 capes and 4 auras. Each one is yours for good after one ad, and other players in your room see them.
- **Short ads** only play after a knockout, as you come back (you're back in 5 seconds anyway, so there is no "get up now" ad). At most once every 3 minutes, and never in the first 3 minutes. Never on a menu button (CrazyGames forbids that) and never in the middle of play. The game freezes and the sound is muted while one plays.
- **Ad blockers:** if CrazyGames reports one, the rewarded buttons are greyed out with a short note instead of failing when clicked. The game itself plays normally.
- **Sound:** CrazyGames' own mute setting always wins over the game's `M` key.
- **No leaderboard:** the shared board only works on claude.ai, so it's hidden here.
- **Rewards in the icon bar:** double XP, refill, try locked powers and cosmetics are HUD icons (keys `9`, `0`, `,`, `.`) instead of pause-menu buttons.
- **Something to do right away:** every session's first crime starts 30–120 m from you a few seconds after you start, instead of 90–420 m away.
- **Cloud save:** CrazyGames' Data module is the save of record (their rule), so progress survives the browser clearing its storage and follows a signed-in player to other devices. When it holds a hero, it replaces the browser's copy on start. A guest who signs in while playing gets their account's save (the game restarts if it differs).
- **CrazyGames username:** a signed-in player's new hero is named after their username. Other players see it next to the hero name in multiplayer.
- **Happy time:** level-ups, stopping a heist, beating a boss or a rival hero, and overcharging the ring tell CrazyGames it's a big moment (at most once a minute).
- **Oath:** the Ring Bearer types the oath by default here (microphones inside a game portal can't be counted on); *Say it out loud* is still in Settings.
- **Multiplayer** is peer to peer, the same as on the website. Rooms are reported to CrazyGames (room code, and whether friends can still join: not when full or locked), invite links open straight into the room, and "play with friends" starts a room. There is no chat. Other players' names go through a basic word filter. It only uses free public relays, never this site's Cloudflare TURN, so players on very strict networks may not connect.

| Module | Contents |
| --- | --- |
| `00_engine.js` | Math, WebGL 2 renderer, geometry, particles, audio |
| `10_world.js` | City generation (the Manhattan and Queens land mask, districts, bridges, road graph), street props, collisions, ray casts |
| `15_meshes.js` | Cars, drones, bosses |
| `20_core.js` | Config, powers, saving |
| `30_systems.js` | Damage, XP, reputation, effects, destruction, projectiles |
| `40_powers.js`, `47_abilities.js` | Hero powers, including the hero-inspired abilities |
| `42_combat.js`, `43_ragdoll.js` | Lock-on, punch chains, dash, charged punch, impacts, ragdolls |
| `44_movement.js` | Web swinging, web zip, wall running |
| `45_aliens.js`, `45b_voidborn.js` | Morph Band aliens; Voidborn's masks and questions |
| `46_buildings.js` | Building damage, collapse and regrowth |
| `49d_wanted.js` | Wanted stars and bounty |
| `50_npcs.js`, `52_heli.js` | People, traffic, police, helicopters, crimes, heists, rivals |
| `53_water.js`, `54_ambient.js` | Swimming, diving and splashes; planes, the blimp, birds, pigeons, boats, fountains and ponds |
| `60_multiplayer.js`, `62_worldsync.js`, `63_host.js` | Players over the claude.ai room or room codes, the shared host city, and room host controls |
| `64_portal.js`, `65_rewards.js` | CrazyGames build: gameplay events, ads, mute setting, username, cloud save, room info; power keys by level, trials, refills, cosmetics |
| `66_icons.js`, `67_hudbar.js`, `68_markers.js` | HUD icons, the icon bar, move list and leaderboard panel; crime and recharge markers |
| `70_ui.js`, `80_player.js` | HUD, menus, input, driving, player movement |
| `90_render.js`, `99_main.js` | Camera, models, draw list, main loop |

All balance numbers (powers, passives, NPCs, reputation, crime timing) live in the config objects near the top of the game script (`CONFIG`, `POWERS`, `PASSIVES`, `NPCS`, `REP`, `CRIMES`). Systems talk through a small event bus (`damaged`, `defeated`, `levelUp`), so progression and reputation only listen to combat events. See `ROADMAP.md` for what's planned next.

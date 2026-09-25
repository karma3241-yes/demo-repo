# Skyline Guardian

An open-world 3D superhero game that runs in the browser. Drone swarms are attacking the island city of Nova Bay. Fly between the skyscrapers, burn drones out of the sky with heat vision, collect energy cores on the rooftops, and take down the mothership.

## Play

Open `index.html` in a recent desktop browser (Chrome, Edge, Firefox or Safari). You don't need a build step, a server or an install. The whole game is one file with no dependencies, written in raw WebGL 2.

## Controls

| Key | Action |
| --- | --- |
| `W` `A` `S` `D` | Move |
| Mouse | Look around |
| Left click (hold) | Heat vision |
| `Space` | Jump. Hold, then release for a super jump. Press again in mid-air to fly |
| `F` | Take off / stop flying |
| `Shift` | Super speed (on foot) or boost (flying) |
| `Space` / `C` | Fly up / down |
| `E` or right click | Shockwave. In mid-air (not flying) it becomes a ground slam |
| `T` (hold) | Fast-forward the day/night cycle |
| `M` | Mute |
| `H` | Show / hide the controls panel |
| `P` or `Esc` | Pause |

## What's in it

- **Procedural city.** A 12×12 grid of blocks with a taller downtown, setback towers, antennas, parks, streetlights, neon signs, traffic, and a sea wall around the island.
- **Powers.** Flight with banking and a sonic boom past Mach speed, super speed, a charged super jump, heat vision, a shockwave, and a ground slam. A hard landing also shakes the ground.
- **Enemies.** Drone swarms that circle and shoot at you, and every 4th wave a mothership that fires volleys and launches more drones.
- **Progression.** XP and levels (each level adds heat vision damage, health and energy), 40 energy cores to find, and a score.
- **Day and night.** A full cycle: sunset skies, lit office windows and glowing neon at night, stars, and a moon.
- **Rendering.** Real-time sun shadows, procedural windows and roads in shaders, animated water, and a GPU particle system for explosions and sparks.
- **HUD.** A rotating minimap, an off-screen waypoint arrow, health, energy and XP bars, and a boss health bar.
- **Sound.** Every sound effect is synthesized live with the Web Audio API.

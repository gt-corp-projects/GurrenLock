# GurrenLock

Animated, Gurren Lagann-inspired loading screens for Deadlock. The mod plays a hero-specific video once, then holds its last frame until the loading screen closes. Heroes without a matching video use the normal screen. The current source maps 22 heroes; see [Tests/Clips.json](Tests/Clips.json).

## Contents

- `Source/` — main Panorama layout, script and styles.
- `Preview/` — separate sandbox preview interface for testing videos and final frames; disable the main mod while using it.
- `Tests/` — playback model tests, hero mapping and final-frame texture generator.

## Media and build

Videos and built VPKs are not included. Obtain the matching media separately and place `Hero.webm` and `Hero-LastFrame.png` in `game/citadel/panorama/videos/GurrenLock/`, using the names in `Tests/Clips.json`. The game needs the videos in that location. The PNGs are inputs for generating the final-frame textures.

From the repository root, with Python, Pillow, Node.js and [modlock](https://github.com/paralin/modlock) installed:

```sh
python3 Tests/BuildTextures.py
node Tests/LoadingScreen.cjs
modlock panorama compile Source --addon gurrenlock -o GurrenLock_dir.vpk
```

Install the resulting VPK through a Deadlock mod manager and place the videos in the game directory above. The preview has its own test: `node Preview/Tests/Preview.cjs`. Its VPK also needs the shared player and generated final textures; the preview source alone is not a complete package.

The tests simulate Panorama behavior; playback and compatibility must be checked in Deadlock. Other mods replacing the same HUD or pregame layout may conflict. Game updates can also require changes to the interface files.

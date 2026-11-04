# GurrenLock

Animated, Gurren Lagann-inspired loading screens for Deadlock. The mod plays a hero-specific video once, then holds its last frame until the loading screen closes. Heroes without a matching video use the normal screen. The current source maps 22 heroes; see [Tests/Clips.json](Tests/Clips.json).

## Contents

- `Source/` — main Panorama layout, script and styles.
- `Preview/` — separate sandbox preview interface for testing videos and final frames; disable the main mod while using it.
- `Tests/` — playback model tests and hero mapping.

## Downloads and media

Download the main or preview VPK from [Releases](https://github.com/gt-corp-projects/GurrenLock/releases). These packages contain only files in the repository: **videos and last-frame textures are not included**. Without those separately supplied resources, the release is not a complete working media package.

Place matching `Hero.webm` and `Hero-LastFrame.png` files in `game/citadel/panorama/videos/GurrenLock/` using the names in `Tests/Clips.json`. From version 0.2, the game loads both files from that location; they are not included in the VPK. Version 0.1 instead expected compiled textures in the VPK and is incomplete.

## Local build

With Node.js and [modlock](https://github.com/paralin/modlock) installed, from the repository root:

```sh
node Tests/LoadingScreen.cjs
node Preview/Tests/Preview.cjs
modlock panorama compile Source --addon gurrenlock -o GurrenLock_dir.vpk
```

Install the resulting VPK through a Deadlock mod manager. The preview has its own source and needs the shared player script and stylesheet; it uses the same separately installed videos and PNGs; do not use it together with the main mod.

## Automated builds and versions

GitHub Actions tests and builds separate main and preview VPKs from tracked source files on pushes, pull requests and manual runs. The results are available as workflow artifacts. The preview build includes the shared player script and stylesheet. It does not download or generate media.

`VERSION` contains the release version in `X.Y` format, currently `0.2`. After a successful build on `main`, Actions creates a release and tag such as `v0.2` if that release does not already exist. Existing releases are left unchanged; change `VERSION` to `0.3` for the next release. To rebuild an existing version without replacing its release, run the workflow manually and download its artifact.

The tests simulate Panorama behavior; playback and compatibility must be checked in Deadlock. Other mods replacing the same HUD or pregame layout may conflict. Game updates can also require changes to the interface files.

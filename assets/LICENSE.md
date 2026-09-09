# Asset provenance

All vendored sprite assets are CC0-1.0 (public domain equivalent) by Kenney
(www.kenney.nl) — free for commercial use, no attribution required. Fetched
via the Tiddybub/2d-assets mirror (github.com/Tiddybub/2d-assets, CC0),
which preserves Kenney's original license files per pack.

- `images/player-ship.png`, `images/enemy-ship.png`, `images/bullet.png`,
  `images/background-stars.png`, `images/fire/*.png` — Kenney "Space Shooter
  Remastered" (https://kenney.nl/assets/space-shooter-remastered), CC0-1.0.
- `images/explosion/*.png` — Kenney "Smoke Particles"
  (https://kenney.nl/assets/smoke-particles), CC0-1.0.
- `images/planet-1.png`, `images/planet-2.png`, `images/planet-3.png` —
  Kenney "Planets" (https://kenney.nl/assets/planets), CC0-1.0.
- `audio/shoot.ogg` — Kenney "Digital Audio"
  (https://kenney.nl/assets/digital-audio), CC0-1.0, fetched via the
  ETdoFresh/kenney.nl mirror (github.com/ETdoFresh/kenney.nl, CC0).

No CC0 explosion-boom sound pack was found in either mirror within a
reasonable search — the explosion sound effect is synthesized at runtime via
the Web Audio API (`js/audio.js`) instead of a vendored file, per the plan's
documented fallback for exactly this case.

# Vesper Breakers

An original momentum arcade expedition inspired by Steven Hugg's older Windows **Comet Busters!**: split comet cores, dodge raiders, spend energy on shield/blink/pulse and clear the five-sector Vesper corridor. All art is procedural; audio is synthesized. Solo or **two-player local co-op on one keyboard**. No online multiplayer or public deployment.

## Play on this Mac

[Open the game](http://127.0.0.1:5180/). The session-only loopback server is left running by the task. It does not install a login item or boot service; closing its terminal session, restarting Codex or rebooting may stop it. If needed:

```sh
cd /Users/intrepion/Documents/Codex/2026-10-10/task-8/kata-inspired-by-comet-busters-codex-dot
npm ci
npm run dev
```

Port 5180 is strict: an occupied port produces an error rather than taking another game's port. To stop, press Ctrl-C in its terminal session. Existing ports 5173–5179 were preserved. This is a local folder checkout; it has not been registered as a Codex sidebar project because no supported project-registration control was available.

## Controls

| Action | Solo | Co-op mint | Co-op copper |
|---|---|---|---|
| Thrust | W or ↑ | W | ↑ |
| Turn | A/D or ←/→ | A/D | ←/→ |
| Brake | S or ↓ | S | ↓ |
| Fire | Space or F | F | / |
| Shield | Shift | Shift | Enter |
| Blink | Q | Q | , |
| Pulse | E | E | . |
| Pause | Esc or P | Esc or P | Esc or P |

Touch solo has a flight pad and four combat buttons; landscape keeps the pad beside the arena. Three hulls per pilot. A lost co-op pilot remains out while their wingmate continues. Clear all threats to move on; sector 3 unlocks spread fire. Shield costs 25 energy, blink 35, pulse 60; energy restores 8/s. Hold fire for automatic repeated shots. Edges wrap. Pause and switching away freeze the simulation. Flight input is active when the arena has focus; click/tap the arena after using settings. Menus accept normal keyboard activation. Sound/motion and separate solo/co-op best scores persist in localStorage when available. The flight manual explains costs and cooldowns.

## Development and verification

```sh
npm run typecheck
npm test
npm run build
npm run test:browser
npm audit --audit-level=moderate
```

Node 24 recommended. Runtime has no third-party dependencies or external asset requests. Tests cover a seeded pure simulation, toroidal relative swept collision, fixed-step clock, validated storage and real browser inputs. Browser suite uses Chromium; install it with `npx playwright install chromium` if missing. `.github/workflows/ci.yml` runs the same checks on every push/PR with Linux browser dependencies.

See [acceptance contract](docs/SPEC.md), [glossary](GLOSSARY.md), [architecture decision](docs/adr/0001-simulation-and-local-scope.md), [research and uncertainty](docs/RESEARCH.md), [verification evidence](docs/QA.md) and [independent reviews](docs/REVIEWS.md).

## Attribution and scope

Primary historical identity: [creator Steven Hugg's 2000 account](https://www.flipcode.com/tfiles/steven01.shtml). Mechanics corroboration: [Internet Archive's preserved Windows game](https://archive.org/details/win3_CometBus) and [ClassicReload](https://classicreload.com/win3x-cometbusters.html). No contemporary original manual was obtainable, so exact historical physics/ability costs are not claimed. Local co-op and the five-sector expedition are original adaptations. No original assets, source code, branding, levels or commercial audio copied.

Actual skills used: local Matt Pocock **Grill with Docs**, **Grilling**, **Domain Modeling**, **Implement**, **TDD**, **Code Review**. The official Grill with Docs/Implement definitions were also retrieved from `mattpocock/skills`; dependencies were read from this Mac's personal skills. Recommended design choices and test seams were accepted under the user's explicit autonomous delegation. Standards and Spec reviews ran in independent agents as required by Code Review.

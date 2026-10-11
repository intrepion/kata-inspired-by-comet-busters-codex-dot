# Vesper Breakers acceptance contract

An original teal/copper deep-space arcade game. Clear five sectors to open the Vesper corridor; then optionally launch a new expedition. Solo or two pilots on one keyboard, cooperative shared score, three hulls per pilot. No online multiplayer. Defining loop: rotate, thrust with momentum, fire, split comet cores, dodge raider fire, spend regenerating energy on shield/blink/pulse, clear every threat to progress.

## Delegated design tree (Grill with Docs adaptation)
User explicitly delegates recommended choices and requests no design questions. Therefore recommended answers below are accepted under that authorization, including TDD seams, with no repeated confirmation.
1. Inspiration identity → Steven Hugg/HAMCO Windows game, not the unrelated 2026 title.
2. Multiplayer scope → two-player local cooperative expedition. Network multiplayer and competitive tournament omitted; manageable shared keyboard mappings, no server.
3. Victory/progression → finite five-sector expedition, increasing fragmentation and raiders, explicit corridor-open victory. Three hulls per pilot; only all pilots exhausted ends expedition.
4. Combat feel → inertia with slight drag, speed cap, fast repeated bolts, shot inheritance, toroidal collision; visible grace ring, readable bullet colors, no friendly fire.
5. Abilities → shared per-pilot energy creates a choice between shield, safe blink and local disruption pulse. Fixed cost and cooldown. No cloak because co-op offers no useful target deception.
6. Presentation/accessibility → procedural Canvas 2D, semantic HTML menus, synthesized audio, mute/reduced-motion persistence, touch solo buttons, bounded five-sector campaign.
7. Public seams → Simulation constructor/step/snapshot, toroidal swept collision, save parsing/writing and fixed clock. Tests use controlled seed and input through these seams; custom scenarios belong to headless test fixture options only, never a browser cheat API.
8. Shipping → private GitHub, exact commit CI checks, session-only loopback server on 5180; preserve all other repositories/ports.

## Acceptance criteria
- Start, keyboard/touch onboarding, pause/resume, return to menu, loss/restart, victory/new expedition are player accessible.
- 120 Hz simulation; render timing cannot alter outcomes for equal accepted elapsed time. Background tab/blur pauses and clears input, no catch-up deaths.
- Ships, comets, raiders, bolts wrap; swept toroidal hits cover edge crossings and moving targets. A destroyed target scores once; split children enter next tick; bolts expire.
- Safe spawns and blink use threat clearance; respawn grace 2.8s; simultaneous deaths and mixed surviving pilots are valid. Lives cannot go negative.
- Wave countdowns gate action; no input leaked through menu/pause; cooldown and energy stop on pause. Score records saved per mode after conclusion or return to menu; invalid storage falls back safely.
- Co-op distinct mappings support simultaneous players. Three energy abilities have visible cues/cooldowns; enemies and particles remain bounded. All visual/audio assets are original procedural work.
- Mobile presentation fits 390px; touch controls use multi-pointer capture and clear on cancellation. Physical phone and keyboard rollover limitations must be reported honestly.
- Targeted tests, typecheck, production build, dependency audit, independent standards/spec reviews, browser actual input sessions, screenshots, exact GitHub CI pass.

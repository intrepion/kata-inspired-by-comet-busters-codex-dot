# Verification evidence

## Automated
- 19 public-seam unit tests: wrap/corner/moving-target swept collisions; frame-rate equivalence at 30/60/144 Hz; stalled-frame clamp; thrust/fire; single scoring and splitting; ship/comet/bolt wrapping; grace and safe respawn; expiry/friendly-fire exclusion; pulse clearing/cost/cooldown; shield protection; blink clearance/cost and retention of longer protection; sector bonuses/final victory; simultaneous final-hull losses; reset; surviving co-op pilot and independent inputs; snapshot isolation; spread weapon; corrupt-save validation.
- Browser suite: short key taps, keyboard activation of focused settings/Pause controls, pause isolation, manual dialog, return/restart, solo/co-op menus, saved settings/scores across reload; corrupted and unavailable storage; real keyboard sector clearing; Chromium-native two-touch press/cancel; 390×844 portrait and 844×390 landscape geometry/screenshots.
- Strict TypeScript passes. Vite production build succeeds. npm audit reports zero vulnerabilities. No runtime third-party dependencies.

## Actual Mac Chrome player-facing QA
The UI automation used native held key chords, not injected simulation state. No browser cheat API exists.
- Solo native rotate/fire advanced through sector four; movement/brake, blink and pulse exercised, energy/cooldown text checked. Solo loss at sector two showed 6,870 points/43 threats; loss screen and relaunch were observed. Earlier best 16,260 persisted.
- Co-op held independent mint D/F/E and copper Right/Slash/Period simultaneously, cleared all five sectors and reached visible victory: **35,950 points, 182 threats**, with one hull remaining per pilot. See `artifacts/mac-victory.jpg` and `artifacts/mac-coop.jpg`.
- Relaunch after victory showed sector one, zero score and three hulls per pilot. Held Shift shield showed energy 81 and 4s cooldown. Later mint exhaustion while copper still survived demonstrated co-op continuation.
- Pause/return/reload showed solo best 16,260 and co-op best 35,950. Hangar left ready to launch in Chrome; `artifacts/mac-hangar.jpg`.
- Actual loopback HTTP GET/headers verified 200 OK at http://127.0.0.1:5180/.

## Visual inspection
Inspected Mac hangar/game/victory, portrait gameplay and landscape screenshots. Menu typography, controls, score/cooldown feedback, focus rings, wave countdown and result panel are readable. Portrait maintains arena aspect ratio; landscape places flight pads beside it. Desktop screenshots are full-page exports; camera screenshot shows arena during combat. Audio is original synthesized sound; no music or copied recordings.

## Limits
Native Mac key automation checks simultaneous input but is not a two-human hardware rollover test. Chromium-native touch emulation checks event handling/capture/cancel and layout, not physical phone ergonomics, iOS Safari audio or physical multi-touch. Physical device and multi-human coverage remain unperformed. Responsive portrait play has smaller ships; landscape offers more room. The browser was Chrome; Safari/Firefox were not tested. Exact original-game physics and ability values remain historically unverified (see RESEARCH.md).

## Local session
Vite runs on loopback 5180 in a supported task terminal session (no daemon, boot/login autostart, or system security changes). Closing that session/app or restarting the Mac may stop it. `npm run dev` restarts the server; instructions in README. Repository exists as a local folder; no supported sidebar project registration tool was exposed.

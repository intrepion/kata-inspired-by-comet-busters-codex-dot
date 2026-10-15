# Comet Busters last-survivor native acceptance

2026-10-15 actual Mac Chrome/intrepion, dedicated tab222225542, isolated http://fidelity-qa-20261015.localhost:5180/. Final reviewed production build;23 actual tests/typecheck/build passed. Both independent review axes closed, including2000-input-step solo/co-op baseline parity. Native CUA visible controls/held physical keys only, no hidden-state/model/DOM event injection. Existing user/root/Witness tabs and save origins untouched.

Camera: fixed single-screen top-down toroidal arena. Controls: Mint WASD/F/Q/E/Shift, Copper arrows/slash/comma/period/Enter; turn+thrust retain momentum; Escape pauses. Native durations below are physical held keys.

Observed completion: Local tournament starts round1,one hull each,score0:0,three comet cores. HeldF6500ms → Mint survives1:0, Copper0hulls. Next round/F6500ms →2:0. Next round/F6500ms → `TOURNAMENT COMPLETE`, `Mint wins the match!`,3:0. Each round restarted fresh ships and energy;3cores remained in these wins, so rock clearance did not award the match. New tournament/slash6500ms independently gaveCopper round win0:1 (Mint0hulls). Next round → heldShift3500ms, Q thenEscape: Mint energy52/shield3s/blink3s, Copper100, both1hull,score0:1,`FLIGHT ON HOLD`. State stayed paused while inspecting. Resume → MintD300ms/W600ms and CopperRight300ms/Up600ms exercised independent turn/thrust → both remainedalive → Escape paused again. Returnhangar/reload: solo and co-op records still000000, matching fresh-origin baseline; tournament scores did not overwrite them.

Evidence: round-one.jpg, match-victory.jpg, copper-round.jpg, abilities-paused.jpg, two-pilot-movement.jpg, records-preserved.jpg. No application defect/source fix/rebuild/preview restart during QA. Simultaneous-loss draws and exact fixed-frequency determinism are unit evidence, not reproduced natively. Scope: two local keyboard pilots,customfirst-to-three,threecorehazards; no four-player/network/cloak or original physics parity claim.

Native screenshots and the session record are preserved in `qa/fidelity-2026-10-15/`. No additional browser playthrough was performed by the documentation reviewer.

## Included native captures

- [round-one.jpg](qa/fidelity-2026-10-15/round-one.jpg)
- [match-victory.jpg](qa/fidelity-2026-10-15/match-victory.jpg)
- [copper-round.jpg](qa/fidelity-2026-10-15/copper-round.jpg)
- [abilities-paused.jpg](qa/fidelity-2026-10-15/abilities-paused.jpg)
- [two-pilot-movement.jpg](qa/fidelity-2026-10-15/two-pilot-movement.jpg)
- [records-preserved.jpg](qa/fidelity-2026-10-15/records-preserved.jpg)

---
name: primal-playtest
description: Turn Primal Run playtest notes (Jonas, Mikkel/Snowflake, other testers) or the opt-in Google Form run data into a sorted report with a next step per finding.
model: sonnet
---
Input: $ARGUMENTS (pasted notes, a file, or "form" for the run-summary sheet "Primal Run Data (Responses)" via the Sheets connector).
1. Record build (commit or live gh-pages commit), tester, device and input (keyboard, Xbox pad, touch), species, difficulty and how far the run got. Unknown stays "unknown"; never guess.
2. Sort every observation into one bucket:
   - **Bug**: something breaks (crash, stuck, wrong number, text overflow). Steps to reproduce if the notes give them.
   - **Balance**: numbers feel wrong (too hard/easy, a species or boss out of line).
   - **Design**: confusion or no fun, the player did not understand or did not care.
   - **Polish**: friction or feel, not blocking.
   Also note what worked and moments of delight, so they are not "fixed" away.
3. Check each finding against the code before calling it a bug: find the system (`primal-scout` for lookup) and say whether a FEATURES flag, difficulty or known pitfall explains it. Mark CONFIRMED, PLAUSIBLE or NOT VERIFIED.
4. Next step per bucket: Bug → a fix with a regression test that fails first; Balance → `/primal-balance` with seeds before touching numbers (bots are not humans; one tester is one data point); Design → a short proposal for Jonas; Polish → `PRIMAL_RUN_Game/IDEABANK.md`.
5. End with the top 3 priorities. Report in Danish, short. Change no code and save nothing in the repo unless Jonas asks.

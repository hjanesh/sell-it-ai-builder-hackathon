# Sell It: planning handoff

> **STATUS: WORK IN PROGRESS. NOT FINAL.**
> This is the base plan from one planning chat (Hemanth + Claude) on **Oct 24, 2026, ~12:30 IST**, during
> Airtribe AI Builders Day '26. The two teammates have done their own research in parallel. Their docs go in
> `teammates/`, and the **next step is to merge everything into one product spec** before building.
> Treat everything here as a strong draft, not a decision, unless it's marked ✅ decided.

## What we're building (one paragraph)
An AI selling assistant for **anything, on any channel**. The seller snaps or uploads photos and speaks or
types whatever details they know. The AI works out what's being sold (**pre-owned**, **new**, or
**homemade / small batch**), asks only the questions that matter, cleans up the photos without altering the
item, suggests a price, and produces **ready-to-post packs** for OLX, Facebook Marketplace, Instagram and
WhatsApp. The seller can download everything, share it in one tap, or use a Sell It listing page.
Core insight: **buyers trust the listing where the seller made an effort.** We do that effort for them.

## Read in this order
| # | File | What's in it |
|---|---|---|
| 0 | `CLAUDE.md` | Instructions for Claude Code in the new repo (copy it to the repo root) |
| 1 | `01-event-context.md` | Hackathon facts: schedule, judging weights, rules, judges, prizes |
| 2 | `02-product-spec.md` | Product: flows, questions, photo studio, outputs per channel, listing page |
| 3 | `03-competitors.md` | Competitor research and viability |
| 4 | `04-tools-and-credits.md` | Which sponsor tools to use and why (and which to skip) |
| 5 | `05-build-plan.md` | Tech stack, architecture, team split, timeline, P0/P1/P2 |
| 6 | `06-users-and-feedback.md` | How we get 20 active users who give feedback, and how we prove it |
| 7 | `07-pitch-and-demo.md` | Pitch story, stage demo script, VC narrative |
| 8 | `08-decisions-and-open-questions.md` | What's decided, what's open, risks |
| 9 | `09-history.md` | How we got here (DemoDay → ThriftIt → "sell anything" → renamed Sell It) |
| – | `assets/` | Photos of the event slides (schedule, judging) and the tool-credits page |
| – | `teammates/` | **Put teammates' research here before the merge** |

## Next steps (in the new repo)
1. Copy this folder into the repo (e.g. `docs/handoff/`) and `CLAUDE.md` to the repo root.
2. Drop teammates' files into `docs/handoff/teammates/`.
3. Ask Claude Code to read everything and produce **one merged `SPEC.md`**, listing every conflict for the team to decide.
4. Lock the spec, then build in the order in `05-build-plan.md`. **A live URL on Render comes first.**

## Time check
Slide times: tracks lock **12:30** · submissions close **~17:00** (blurry on the slide, confirm) ·
Round 1 at the table **17:15** · top 10 on stage **19:00**. The idea has already been logged (or is being logged) under **AI for Commerce**.

# DESIGN.md

Design direction for the HRIS. This file is the source of direction; `antislop` is the
filter applied on top of it.

Authored by the product owner (Kennely Ray) on 2026-09-17, transcribed from a direction
brief. The "Owner's direction" section below is their decision. The "Interpretation"
section is the agent's reading of it, and is open to correction.

---

## Product

An internal HR system. Two audiences share it:

- **HR and management**: in it daily, working through attendance, the leave queue,
  violation cases, the roster, and the audit trail. Long sessions, dense data.
- **Employees**: occasional visits for one task, usually on a phone. File leave, check a
  balance, read a decision, appeal a violation.

It holds attendance records, medical leave documents, and disciplinary history, and it
encodes Philippine statutory leave. It is a record system people's pay and standing
depend on, not a marketing surface.

---

## Owner's direction

| Field | Decision |
|---|---|
| **Personality** | Warm and human. HR is about people, not rows. Softer shapes, warmer neutrals, a friendlier voice. |
| **Palette** | Evolve the existing deep navy. Keep `#07111f` with the sky/cyan accent, refined. Continuity for staff who already use it, and the logo still fits. |
| **Typography** | Keep Geist. |
| **Presence** | Balanced. Consistent structure with deliberate breaks, restrained motion. Polished without demanding attention. |

## Dials

`ENERGY 2 / RHYTHM 2 / MOTION 1`

- **ENERGY 2**: present and crafted, not loud. It is a tool people sit in for hours.
- **RHYTHM 2**: one consistent structure, broken deliberately where content earns it.
  Not every section is a centred title over an identical card grid.
- **MOTION 1**: transitions and hover states carry state changes. No scroll choreography,
  no parallax, nothing that delays someone trying to approve leave.

---

## Interpretation (agent's reading, correct freely)

The brief holds a tension worth naming: a blue-black ground, a cool cyan accent, and a
neutral geometric sans are not in themselves warm. Since the palette is capped at 2 to 3
core colours plus one accent, warmth cannot come from adding a colour. It comes from:

1. **Warmer neutrals.** The current greys are cool blue-slate. Shifting the neutral ramp
   off pure blue-grey warms the whole surface without touching the navy or the accent.
2. **Softer, varied radii.** Radius as hierarchy, not one pill shape everywhere.
3. **Generous spacing.** Room to breathe reads as calm and considerate; cramped reads as
   industrial.
4. **Human voice.** "Your leave was approved", not "Request status: APPROVED". People,
   dates and outcomes named plainly.
5. **People made visible.** Names, initials and faces given real weight in lists and
   cases, rather than being another cell in a row.

### Colour roles

| Role | Value | Purpose |
|---|---|---|
| Ground | `#07111f` | The app's base. Unchanged, carries the existing identity. |
| Surface | raised navy tints | Cards and panels, separated by tint rather than heavy shadow. |
| Neutral ramp | warm-shifted greys | Body text, labels, borders. Where warmth is introduced. |
| Accent | sky/cyan | One accent. Primary actions, active state, focus. Used sparingly. |
| Semantic | green / amber / red | Approved, pending or expiring, rejected or critical. Status only, never decoration. Kept distinct from the accent. |

### Typography

Geist Sans for interface and body, Geist Mono for figures that line up (dates, counts,
balances, timestamps). Rationale: Geist is already loaded and is the owner's choice;
character comes from spacing, weight and hierarchy rather than from the typeface.

### Identity motif

The logo's mark is an H inside a dial, where the right stem is broken into logged blocks.
That segmented-block idea is the motif: time and records as discrete, countable units.
It recurs as the segmented progress of a leave balance, the day-grouped audit timeline,
and the block-per-status attendance strip.

---

## Non-negotiables

- Contrast meets WCAG AA. This app is used in bright offices and on cheap screens.
- Every control is keyboard reachable with a visible focus state.
- Every data view has an empty, loading and error state.
- Nothing is fabricated. No invented statistics, testimonials, or claims.
- Mobile is not an afterthought. Employees are mostly on phones.

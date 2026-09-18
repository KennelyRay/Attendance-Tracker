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
| **Palette** | Warm slate with a clay accent. Revised on 2026-09-17: the deep navy and sky/cyan read as tech-SaaS rather than HR, so the ground moved to a warm near-black and the accent to clay. The logo was restyled to match. |
| **Typography** | Keep Geist. |
| **Presence** | Balanced. Consistent structure with deliberate breaks, restrained motion. Polished without demanding attention. |

## Dials

`ENERGY 2 / RHYTHM 2 / MOTION 3`

- **ENERGY 2**: present and crafted, not loud. It is a tool people sit in for hours.
- **RHYTHM 2**: one consistent structure, broken deliberately where content earns it.
  Not every section is a centred title over an identical card grid.
- **MOTION 3**: raised from 1 on 2026-09-17 at the owner's direction. Choreographed
  entrances, scroll-linked reveals and parallax are in scope, implemented with Framer
  Motion.

  Two limits the owner's original rationale still imposes, and which motion at any dial
  has to respect: nothing may sit between an admin and an action (approve, reject, save
  and submit stay immediate, never gated behind an animation), and every effect is
  disabled under `prefers-reduced-motion`. Choreography belongs to arrival and
  presentation, not to the work itself.

---

## Interpretation (agent's reading, correct freely)

The first brief kept a blue-black ground and a cool cyan accent, which fought the "warm
and human" personality. The revised palette resolves that directly: the ground, the
neutrals and the accent are all warm now, so warmth no longer has to be smuggled in
around a cool palette. What still carries it beyond colour:

1. **Warm neutrals throughout.** The whole ramp is warm rather than blue-slate, so every
   surface and label inherits it without another colour being added.
2. **Softer, varied radii.** Radius as hierarchy, not one pill shape everywhere.
3. **Generous spacing.** Room to breathe reads as calm and considerate; cramped reads as
   industrial.
4. **Human voice.** "Your leave was approved", not "Request status: APPROVED". People,
   dates and outcomes named plainly.
5. **People made visible.** Names, initials and faces given real weight in lists and
   cases, rather than being another cell in a row.

### Colour roles

| Role | Value | Measured on the ground |
|---|---|---|
| Ground | `#15120f` | Warm near-black. The app's base. |
| Panel surface | `#211d18` | Cards and panels, separated by tint rather than shadow. |
| Raised surface | `#2e2821` | Table headers, secondary buttons. |
| Body text | `#c9bfaf` | 10.27:1 |
| Secondary text | `#a99d8a` | 7.00:1 |
| Tertiary text | `#9c907c` | 5.34:1 on a panel, measured against the lighter surface rather than the ground |
| Accent, text | `#f0ac8b` clay | 9.76:1 |
| Accent, action | `#e58a62` clay | 7.24:1, and dark text on it is also 7.24:1 |
| Interactive border | `#7a6f60` | 3.63:1 against a field, per WCAG 1.4.11 |
| Semantic | green / gold / rose | Approved, pending, rejected. Status only, never decoration, and kept clear of the clay so a warning never reads as a call to action. |

Every figure above was measured with the WCAG formula, not estimated.

### Typography

Geist Sans for interface and body, Geist Mono for figures that line up (dates, counts,
balances, timestamps). Rationale: Geist is already loaded and is the owner's choice;
character comes from spacing, weight and hierarchy rather than from the typeface.

### Identity motif

The logo's mark is an H inside a dial, where the right stem is broken into logged blocks.
The mark was recoloured to warm slate and clay alongside the palette, so the identity and
the interface stay one thing.
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

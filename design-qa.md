# Design QA

## Comparison setup

- Reference: `docs/reference/hack/blueprint-4.png` (889 × 934) with supporting flow references from `blueprint-1.png` and `docs/reference/hack/final-plan.pdf`.
- Implementation captures: `/private/tmp/movin-condition-comparison.png`, `/private/tmp/movin-adjustment-dialog-final.png`, `/private/tmp/movin-monthly-report.png` (1440 × 1000, DPR 1).
- State: preferences completed; Hwaseong → Cheongju call filled; 5-ton wing-body/electronic parts; 2026-08-14 09:00–12:00; 24-hour relaxed window and one-day delay selected.
- Comparison method: full-view and focused dialog checks at the same desktop viewport. The reference is a narrow wireframe while the implementation is an intentionally desktop-only app shell, so structure, hierarchy, content, and interaction states were compared instead of pixel-for-pixel width.

## Surface review

- Typography: heading/body hierarchy is consistent with the existing Mov!n design system; no clipped or vertical text remains.
- Spacing and layout: fixed desktop grid, sticky decision summary, metric cards, scenario comparison, and common dispatch block align without overlap at 1440 × 1000.
- Color and state: current condition, relaxed condition, warnings, unavailable source fields, and selected actions are visually distinct without relying on color alone.
- Icons and imagery: existing Material Symbols are used consistently; no placeholder image or low-resolution asset is present.
- Copy: legal language is excluded. Source limits, unavailable coefficients, KRW integer basis, and unconnected API/AI areas are explicitly labeled.
- Carbon calculation: the corrected `E_baseline − E_matched` formula is shown in full. Previous demo values were removed and missing `D`, `D_dh`, and vehicle-level EF inputs now produce an explicit pending state.

## Interaction review

- Preference selection enforces at least one answer per question and a maximum of two.
- Region/detail/custom, vehicle/custom, cargo/custom, calendar, cargo note, and circular time-window controls update the live summary.
- The 24-hour clock drag and 30-minute controls work with pointer interaction.
- Condition comparison exposes only current and source-backed relaxed scenarios; vehicle substitution is marked unavailable in the prediction data.
- Current-condition and adjusted-condition actions both complete the flow; the selected one-day delay and time window persist into the right summary, common dispatch information, and report.
- Report preview opens and provides the browser print/PDF action.
- Console check returned no errors or warnings.
- Responsive behavior was intentionally not implemented or evaluated per the request.

## Fix history

- P1: circular clock controls collapsed in a narrow content column; changed the internal layout to a vertical composition and rechecked the full page.
- P2: the visual time track initially showed the raw form range rather than the selected source scenario width; centered the track on the chosen source bucket.
- P3: report wording and accepted-count consistency were corrected.
- P1: the carbon data-status badge wrapped vertically in the report card; moved it under the description and rechecked the formula section.

final result: passed

Cleanup and Release Notes

Summary of final cleanup performed:

- Centralized Nepali date logic into `nepali-calendar-api.js` and removed duplicate implementations from `script.js`.
- Added `formatDisplay()` and weekday utilities to `nepali-calendar-api.js` for consistent UI rendering.
-- Updated `script.js` to delegate all Nepali-date functions to `NepaliCalendar` and removed legacy global aliases.
- Improved base styling and accessibility by updating `style.css` and `style.min.css` (12px base font, `:focus-visible` outlines, standardized transition usage).
- Created `REFACTOR_NEPAli_CALENDAR.md` documenting the refactor and how to run tests.

Manual checks to perform before release:

1. Open `index.html` and a couple of key pages in Chrome and Firefox; verify date inputs work and the calendar modal appears when invoking `testNepaliCalendar()` in the console.
2. Navigate forms that submit Nepali dates and confirm values saved in BS format by inspecting network/devtools.
3. Check keyboard focus behavior across interactive controls (tab through sidebar, header buttons, form fields).
4. Run any environment-specific integrations (Google Sheets sync endpoints) if applicable.

Suggested next steps:

- Legacy global aliases (e.g., `window.convertADtoBS`) removed; ensure any external integrations call `NepaliCalendar` APIs.
- Expand unit tests to cover critical date conversions and UI formatting behaviors.
- Optional: minify `nepali-calendar-api.js` or bundle via a build step if desired for production.

Release checklist (pre-merge into main):
- [ ] Full manual QA pass completed
- [ ] Accessibility quick audit done
- [ ] Stakeholder sign-off
- [ ] Merge `refactor/nepali-single-source` into `main` and tag release

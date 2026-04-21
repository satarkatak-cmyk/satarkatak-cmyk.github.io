Refactor: Nepali calendar consolidation

Summary
- Centralized Nepali date logic into `nepali-calendar-api.js`.
- Removed duplicate date helper implementations from `script.js` and replaced them with thin delegators to `NepaliCalendar`.
- Added UI helpers `formatDisplay()` and weekday utilities in `nepali-calendar-api.js`.
- Improved accessibility and baseline styles in `style.css` and `style.min.css`.

Why
- Reduce duplication and maintenance burden.
- Provide a single source of truth for AD<->BS conversions and UI formatting.
- Improve accessibility and readability.

Files changed (high level)
- `nepali-calendar-api.js`: authoritative API + UI component + compatibility aliases
 - `nepali-calendar-api.js`: authoritative API + UI component (legacy global aliases removed)
- `script.js`: removed local conversion logic and delegated to `NepaliCalendar`
- `style.css`, `style.min.css`: base font-size and `:focus-visible` improvements

How to run tests

Run the existing node test:

```bash
node tests/test_param_map.js
```

Manual smoke checks
- Open `index.html` in a browser and verify date inputs (nepali-datepicker-input / nepali-calendar-input) behave as before.
- Run `testNepaliCalendar()` from the devtools console to exercise the calendar modal.

Notes & next steps
- Continue with broader UI smoke tests across pages; update visual styles iteratively.
- Remove legacy global aliases after verifying the site across pages and integrations.
 - Legacy global aliases have been removed; external code should call `NepaliCalendar` methods now.

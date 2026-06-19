# Codebase Concerns

**Analysis Date:** 2026-05-14

## Tech Debt

### UIAdapter God Class (707 lines)

- **Issue:** `UIAdapter` in `src/adapters/UIAdapter.ts` mixes DOM references, event binding, input validation, calculation orchestration, SVG donut chart logic, accessibility announcements, LGPD consent management, and privacy modal handling — violates Single Responsibility Principle.
- **Files:** `src/adapters/UIAdapter.ts`
- **Impact:** Untestable (no DOM tests exist), risky to modify (UI change can break validation logic buried in same class), high cognitive load (27 field declarations, ~35 methods)
- **Fix approach:** Split into focused modules:
  - `FormHandler` — form validation, event binding, input masking
  - `ResultsRenderer` — donut chart, breakdown list, metric cards, progress bar
  - `LGPDController` — privacy banner/modal, health consent
  - `DonutChart` — SVG donut rendering + interactive legend + tooltips

### Static Service Classes with No DI

- **Issue:** All 5 domain services are static classes. `FGTSCalculatorService` (`src/core/services/FGTSCalculatorService.ts:88`) directly calls static methods on `CorrecaoMonetariaService`, `MultaService`, `SaqueAniversarioService`, `DoencaGraveService`.
- **Files:** `src/core/services/*.ts`
- **Impact:** Cannot unit test `FGTSCalculatorService.calcularRescisao()` with mocked sub-services. All tests run full integration. Makes it impossible to inject alternative implementations (e.g., different index strategies, FAKE services for testing).
- **Fix approach:** Make services instantiable with interfaces. Inject sub-services via constructor parameters. Use simple factory or manual DI at entry point.

### Global Decimal.js Config Side Effect

- **Issue:** `Decimal.set()` configuration runs as a module-level side effect in `src/core/types.ts:11-16` when the module is first imported.
- **Files:** `src/core/types.ts`
- **Impact:** If any code uses Decimal.js before this module loads, it gets default config. Cannot run Decimal.js code in a different precision context in same bundle.
- **Fix approach:** Move to a dedicated `src/core/decimal-config.ts` that is the first import in `src/main.ts`. Wrap config in a factory or ensure import order.

### No Adapter Unit Tests

- **Issue:** Zero tests for `UIAdapter`, `FormatAdapter`, `ThemeAdapter` — 895 lines of untested adapter code.
- **Files:** `src/adapters/UIAdapter.ts`, `src/adapters/FormatAdapter.ts`, `src/adapters/ThemeAdapter.ts`
- **Impact:** Bugs in monetary input parsing (`FormatAdapter.parseMonetaryInput`), date parsing edge cases, theme toggle interaction, LGPD consent flow are not caught by CI. 100% of test coverage only covers domain layer.
- **Fix approach:** Add `FormatAdapter` unit tests (pure functions, no DOM). Add `UIAdapter` tests using jsdom + Vitest (configured in `vite.config.ts` but no adapter tests use it yet).

### Tests Continue on Error in CI

- **Issue:** GitHub Actions pipeline (`static.yml:48-49`) runs tests with `continue-on-error: true`, allowing test failures to pass silently.
- **Files:** `.github/workflows/static.yml`
- **Impact:** Breaking changes to tests do not block deployment. CI can report green while tests are red.
- **Fix approach:** Remove `continue-on-error` or add a separate quality gate step that blocks deploy on test failure. Currently typecheck is the only hard gate.

### Unused Inline Lucide Icon Re-init Logic

- **Issue:** `UIAdapter.updateUI()` and `openPrivacyModal()` contain logic to re-initialize Lucide icons on new DOM elements. This is a workaround for Lucide not being reactive.
- **Files:** `src/adapters/UIAdapter.ts:689-698, 492-498`
- **Impact:** Adds complexity and potential performance overhead. The `lucide-initialized` class tracking is fragile.
- **Fix approach:** Move Lucide initialization to a `MutationObserver` or single post-render hook instead of scattered manual calls.

## Known Bugs

### 15-Day CLT Rule Edge Cases

- **Symptoms:** `ContratoTrabalho.calcularMesesTrabalhados()` uses `Math.floor(totalDays / 30)` which can produce imprecise month counts for contracts spanning month boundaries (e.g., Jan 15 → Feb 14 = 30 days but should be 1 month).
- **Files:** `src/core/entities/ContratoTrabalho.ts:86-96`
- **Trigger:** Contracts with partial months where the actual calendar month count differs from the 30-day approximation.
- **Workaround:** None — the formula is a simplification. Real CLT calculation uses calendar months, not 30-day blocks.

### Decimal.js Rounding in percentage()

- **Symptoms:** `Money.percentage()` calls `multiply()` which rounds via `Decimal.round()`. Combined with `percentage()` dividing by 100 first, this produces double-rounding artifacts in edge cases.
- **Files:** `src/core/types.ts:117, 126-128`
- **Trigger:** Very large or very precise monetary values.
- **Workaround:** None currently — acceptable for an educational simulator.

## Security Considerations

### Client-Side Only — Limited Surface

- **Risk:** No backend, no database, no API calls — inherently low risk. Primary concern is third-party CDN integrity.
- **Files:** `src/index.html`
- **Current mitigation:** Fonts from Google Fonts, Lucide icons from unpkg.com (pinned to version 0.460.0)
- **Recommendations:** Add Subresource Integrity (SRI) hashes for CDN-loaded resources. Currently no `integrity` attribute on `<link>` or `<script>` tags for external resources.

### LGPD Consent Implementation

- **Risk:** Health data consent for serious illness simulation relies entirely on UI-level checkboxes with no enforcement beyond the client side.
- **Files:** `src/adapters/UIAdapter.ts:508-510`
- **Current mitigation:** Consent required before calculation proceeds; data never leaves the browser
- **Recommendations:** Add clear user-facing documentation that consent is purely informational (no data is transmitted). Current implementation is reasonable for an educational tool.

## Performance Bottlenecks

### Synchronous Calculation on Main Thread

- **Problem:** All calculations run synchronously on the browser main thread. For long contracts (e.g., 600 months/50 years), compound interest loops could cause frame drops.
- **Files:** `src/core/services/CorrecaoMonetariaService.ts:78-92`
- **Cause:** `Decimal.pow()` in loop-equivalent logic (formula is O(1) since it uses `x^(1/12)` rather than iterating per-month — this is actually fine)
- **Improvement path:** Already optimal — uses direct formula `FV = P × [((1 + i)^n - 1) / i]` which is O(1). No performance concern.

### No Bundle Splitting

- **Problem:** Entire app is a single Vite bundle. The ~700-line `UIAdapter` and full domain layer are shipped together.
- **Files:** `vite.config.ts`
- **Cause:** Vite defaults to single entry-point bundle.
- **Improvement path:** Not a concern for this app size (< 50 KB JS). Bundle splitting would add complexity with no measurable benefit.

## Fragile Areas

### SVG Donut Chart Manipulation

- **Files:** `src/adapters/UIAdapter.ts:701-734`
- **Why fragile:** Manual SVG circle `stroke-dasharray`/`stroke-dashoffset` arithmetic for 3 segments + 3 pattern overlays. Any change to segment ordering breaks the donut. No visual regression tests.
- **Safe modification:** Only modify through `updateDonut()` and `setDonutArc()` methods. Do not reorder segment rendering in `index.html` (<circle> elements must maintain their position for correct z-order).
- **Test coverage:** Zero tests — visual output not validated.

### Domestic Worker Mutually Exclusive Logic

- **Files:** `src/adapters/UIAdapter.ts:176-193`, `src/core/services/FGTSCalculatorService.ts:114-145`
- **Why fragile:** Domestic worker fine calculation bypasses `MultaService` entirely and implements Art. 22 LC 150/2015 logic directly in `FGTSCalculatorService`. This duplicates fine rules in two places.
- **Safe modification:** If modifying fine logic, check both `MultaService.calcular()` and the domestic worker branch in `FGTSCalculatorService.calcularRescisao()`.
- **Test coverage:** 1 test for domestic deposit rate (`legal-boundary.test.ts:160-168`), zero tests for domestic fine calculation branch.

## Scaling Limits

- **Current capacity:** Sub-50 KB JS bundle, single-page app
- **Limit:** Not applicable — app is a static calculator with no backend, no data persistence, no multi-user concerns
- **Scaling path:** Add E2E tests if new features are added. Consider routing if multi-page (not currently needed).

## Dependencies at Risk

- **`decimal.js`:** Only runtime dependency. Stable library (v10.x), no known deprecation risk.
- **Lucide icons from unpkg:** Pinned to 0.460.0 but loaded from CDN without SRI hash.
- **TypeScript ^6.0.3:** Very recent major version — possible breaking changes in minor/patch. Currently at latest.

## Missing Critical Features

### No FormatAdapter Tests

- **Problem:** `parseMonetaryInput()` and `parseDate()` have no unit tests despite being critical for input validation
- **Files:** `src/adapters/FormatAdapter.ts`
- **Blocks:** Validating edge cases in monetary input parsing (e.g., "R$ 1.234,56", "1,234.56", empty strings, malformed inputs)

### No E2E or Visual Regression Tests

- **Problem:** The SVG donut chart, responsive layout, theme transitions, and LGPD modal interactions have zero automated validation.
- **Files:** All UI components
- **Blocks:** Confident UI refactoring (e.g., splitting `UIAdapter`)

## Test Coverage Gaps

- **What's not tested:** `FormatAdapter`, `ThemeAdapter`, `UIAdapter` (all 0%), domestic worker fine logic, `SaqueAniversarioService.calcularImpactoRescisao()` edge cases, `CorrecaoMonetariaService` with custom index scenarios in integration, contract type mutual exclusivity validation in UI
- **Files:** `src/adapters/*.ts`, `src/core/services/FGTSCalculatorService.ts:114-145`, `src/core/services/SaqueAniversarioService.ts:114-123`
- **Risk:** Adapter bugs pass CI silently. Domestic worker fine calculation (complex branch) could regress without detection.
- **Priority:** Medium — domain layer is well-tested (61 tests), which covers the most critical financial logic

---

*Concerns audit: 2026-05-14*

<!-- refreshed: 2026-05-14 -->
# Architecture

**Analysis Date:** 2026-05-14

## System Overview

```text
┌──────────────────────────────────────────────────────────────────┐
│  ADAPTER LAYER (Presentation / UI)                               │
├─────────────────┬──────────────────┬────────────────────────────┤
│   UIAdapter     │   FormatAdapter   │   ThemeAdapter             │
│  `src/adapters/ │  `src/adapters/   │  `src/adapters/            │
│   UIAdapter.ts` │   FormatAdapter.ts│   ThemeAdapter.ts`          │
└────────┬────────┴─────────┬────────┴─────────────┬───────────────┘
         │                  │                      │
         ▼                  ▼                      ▼
┌──────────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER (Pure Business Logic / DDD)                        │
├──────────────────┬───────────────────────────────────────────────┤
│  Entities         │  Services                                     │
│  `src/core/       │  `src/core/services/                          │
│   entities/       │   FGTSCalculatorService.ts (orchestrator)     │
│   ContratoTrabalho│   CorrecaoMonetariaService.ts (indexation)    │
│   .ts`            │   MultaService.ts (40%/20%/0% fines)         │
│                   │   SaqueAniversarioService.ts (birthday w/dl)  │
│                   │   DoencaGraveService.ts (serious illness)     │
├──────────────────┴───────────────────────────────────────────────┤
│  Types & Value Objects                                           │
│  `src/core/types.ts` — Money (VO), enums, interfaces              │
└──────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  PRESENTATION (Browser)                                          │
│  `src/index.html` — DOM shell                                    │
│  `src/css/` — Modular stylesheets (6 modules)                    │
└──────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `Money` (VO) | Immutable financial precision via Decimal.js (cents-based) | `src/core/types.ts` |
| `ContratoTrabalho` | Entity — validates contract, calculates worked months (15-day CLT rule) | `src/core/entities/ContratoTrabalho.ts` |
| `FGTSCalculatorService` | Orchestrator — coordinates all services for full termination result | `src/core/services/FGTSCalculatorService.ts` |
| `CorrecaoMonetariaService` | Monetary correction engine — TR/IPCA with ADI 5090 compliance | `src/core/services/CorrecaoMonetariaService.ts` |
| `MultaService` | Rescisory fine calculation by termination type | `src/core/services/MultaService.ts` |
| `SaqueAniversarioService` | Birthday withdrawal — 7 official Caixa brackets + termination impact | `src/core/services/SaqueAniversarioService.ts` |
| `DoencaGraveService` | 100% withdrawal for serious illness (cancer, HIV/AIDS, terminal) | `src/core/services/DoencaGraveService.ts` |
| `UIAdapter` | DOM manipulation, events, validation, result rendering | `src/adapters/UIAdapter.ts` |
| `FormatAdapter` | Pure formatting — monetary input parsing, date formatting, labels | `src/adapters/FormatAdapter.ts` |
| `ThemeAdapter` | Dark/light theme toggle with localStorage persistence | `src/adapters/ThemeAdapter.ts` |

## Pattern Overview

**Overall:** Domain-Driven Design (DDD) with 3 layers:
1. **Core (Domain)** — Entities, Services, Value Objects, Enums, Interfaces
2. **Adapters** — UI formatting, DOM manipulation, theme management
3. **Entry Point** — Bootstrap initializes adapters on DOMContentLoaded

**Key Characteristics:**
- Pure business logic in domain layer with zero DOM dependencies
- `Money` Value Object eliminates IEEE 754 errors (all operations in cents via Decimal.js)
- All services are stateless static classes
- Adapters depend on domain layer only (no reverse dependency)
- No DI framework — manual instantiation in `src/main.ts`

## Layers

**Domain Layer (`src/core/`):**
- Purpose: Pure business rules, types, and calculations
- Location: `src/core/types.ts`, `src/core/entities/`, `src/core/services/`
- Contains: Enums (`TipoRescisao`, `TipoContrato`, `TipoDoencaGrave`), `Money` VO, `ContratoTrabalho` entity, 5 domain services
- Depends on: `decimal.js` (only runtime dependency)
- Used by: Adapters

**Adapter Layer (`src/adapters/`):**
- Purpose: Presentation logic, DOM interaction, formatting
- Location: `src/adapters/`
- Contains: `UIAdapter` (707 lines — the largest file), `FormatAdapter`, `ThemeAdapter`
- Depends on: Domain layer (`src/core/`)
- Used by: Entry point (`src/main.ts`)

**Entry Point (`src/main.ts`):**
- Purpose: Bootstrap application on DOMContentLoaded
- Location: `src/main.ts`
- Contains: `init()` function instantiating `ThemeAdapter` and `UIAdapter`

## Data Flow

### Primary Request Path (Calculate Termination)

1. User submits form or inputs trigger blur/change → `UIAdapter.handleCalcular()` (`src/adapters/UIAdapter.ts:514`)
2. Input validation: contract type mutual exclusivity, LGPD health consent, salary parsing via `FormatAdapter.parseMonetaryInput()`, date parsing via `FormatAdapter.parseDate()`
3. Contract validation: `ContratoTrabalho.validar()` (`src/core/entities/ContratoTrabalho.ts:44`)
4. Worked month calculation: `ContratoTrabalho.calcularMesesTrabalhados()` (15-day CLT rule)
5. Orchestration: `FGTSCalculatorService.calcularRescisao()` (`src/core/services/FGTSCalculatorService.ts:88`)
   - 5a. Monthly deposit via `calcularDepositoMensal()`
   - 5b. Monetary correction via `CorrecaoMonetariaService.calcularSaldoComCorrecao()`
   - 5c. Rescisory fine via `MultaService.calcular()` (or domestic worker special logic)
   - 5d. Proportional 13th salary via `calcularDecimoTerceiro()`
   - 5e. Proportional vacation + 1/3 via `calcularFeriasProporcionais()`
   - 5f. Birthday withdrawal via `SaqueAniversarioService`
   - 5g. Serious illness via `DoencaGraveService`
6. UI update: `UIAdapter.updateUI()` — renders metric cards, SVG donut chart, breakdown list, progress bar

### Secondary Flow: Theme Toggle
1. User clicks toggle button → `ThemeAdapter.applyTheme()` (`src/adapters/ThemeAdapter.ts:70`)
2. Sets `data-theme` attribute on `<html>`, persists to localStorage
3. Respects `prefers-color-scheme` media query as default fallback

**State Management:**
- No global state library — form state lives in DOM inputs
- Theme preference in `localStorage` (key: `fgts_simulator_theme`)
- `TipoContrato` mutual exclusivity enforced via DOM style manipulation
- LGPD consent checkbox managed in DOM
- Privacy banner dismissal persisted in `localStorage` (key: `fgts_privacy_dismissed`)

## Key Abstractions

**Money Value Object:**
- Purpose: Immutable monetary representation with centesimal precision
- Examples: `src/core/types.ts:72-142`
- Pattern: Value Object — immutable, equality by value, no identity
- Operations: `add()`, `subtract()`, `multiply()`, `divide()`, `percentage()`, `toBRL()`
- Constructors: `fromCents()`, `fromReais()`, `zero()`

**ContratoTrabalho Entity:**
- Purpose: Employment contract with validation and worked-month calculation
- Examples: `src/core/entities/ContratoTrabalho.ts`
- Pattern: Entity — has identity (dates + contract type), validated on construction
- Domain logic: 15-day CLT rule for counting months

**ResultadoRescisao (Interface):**
- Purpose: Complete calculation output contract
- Examples: `src/core/types.ts:179-198`
- Contains: `saldoBase`, `correcao`, `multa`, `decimoTerceiro`, `ferias`, `saqueAniversario`, `doencaGrave`, `saldoFinal`, `multaFinal`, `total`, `detalhes`

## Entry Points

**Application Entry:**
- Location: `src/main.ts`
- Triggers: `DOMContentLoaded` event or synchronous if document already loaded
- Responsibilities: Instantiate `ThemeAdapter` and `UIAdapter`, bind theme toggle

**Form Calculation Entry:**
- Location: `src/adapters/UIAdapter.ts:152-224` (event binding), `:514` (handleCalcular)
- Triggers: Form submit, blur/change on inputs
- Responsibilities: Full validation + orchestration pipeline

## Architectural Constraints

- **Threading:** Single-threaded browser main thread — all synchronous computation (no async in calculation pipeline)
- **Global state:** `window.lucide` — Lucide icon library loaded from unpkg CDN; `localStorage` for theme and privacy banner dismissals
- **Circular imports:** Not detected — domain has no adapter imports; adapters import domain types/services; entry imports adapters only
- **Decimal.js global config:** `precision: 20`, `ROUND_HALF_EVEN` set at module level in `src/core/types.ts:11-16` — affects all Decimal operations project-wide
- **Path alias:** `@/*` maps to `./src/*` — used in tsconfig but not consistently throughout import paths (most imports use relative paths like `../../src/core/types`)

## Anti-Patterns

### Large Adapter (UIAdapter)

**What happens:** `UIAdapter` is 707 lines containing DOM references, event binding, validation, calculation orchestration, UI rendering, donut chart logic, accessibility announcements, and LGPD privacy components. It mixes concerns across presentation, domain validation, and accessibility.

**Why it's wrong:** Makes the adapter hard to test (no UI tests exist), violates Single Responsibility, and creates a god-class in the adapter layer. Any UI change risks breaking validation logic buried in the same class.

**Do this instead:** Split `UIAdapter` into focused modules:
- `FormHandler` — form validation and event binding
- `ResultsRenderer` — DOM updates for metrics, donut, breakdown
- `LGPDController` — privacy banner, modal, health consent
- Keep business logic validation calls in domain layer (`FGTSCalculatorService` + `ContratoTrabalho`)

### Static Service Classes with No DI

**What happens:** All domain services are static classes with no dependency injection. `FGTSCalculatorService` directly instantiates other services via static method calls.

**Why it's wrong:** Prevents unit testing of `calcularRescisao()` with mocked sub-services (Monte Carlo testing, parameterized index scenarios). All integration tests run real implementations end-to-end.

**Do this instead:** Make services instantiable with interfaces. Inject `CorrecaoMonetariaService`, `MultaService`, etc. into `FGTSCalculatorService` constructor. Use factory or simple DI at the adapter level.

### Global Decimal.js Configuration

**What happens:** `Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_EVEN })` runs as a side effect when `src/core/types.ts` is imported.

**Why it's wrong:** If any other code uses Decimal.js before this module loads, it would use default config (precision 20 is default, but `ROUND_HALF_EVEN` is explicit). More importantly, this global state makes it impossible to have different precision contexts in the same process.

**Do this instead:** Move Decimal config to its own module and ensure it's the first import in the bundle entry point (`src/main.ts`).

## Error Handling

**Strategy:** Fail-fast validation with user-facing error messages. Domain layer throws on invalid constructor params. Adapter layer catches and displays via DOM error elements or `alert()` fallback.

**Patterns:**
- Validation: `ContratoTrabalho.validar()` returns `ValidationResult` object (not throws)
- Constructor validation: `ContratoTrabalho` constructor throws on invalid params
- Adapter catching: `UIAdapter.handleCalcular()` wraps in try/catch with `console.error()` logging
- User feedback: `showError()` adds inline error messages with `role="alert"` and `aria-invalid` attributes

## Cross-Cutting Concerns

**Logging:** `console.error()` in `UIAdapter.handleCalcular()` catch block. No structured logging.

**Validation:** Multi-layered — contract validation (`ContratoTrabalho.validar()`), monetary input parsing (`FormatAdapter.parseMonetaryInput()`), date validation, LGPD consent check, contract type mutual exclusivity, salary ceiling (R$ 1M), contract duration limit (50 years).

**Authentication:** None — pure client-side app, no user accounts.

**Accessibility:** ARIA live regions (`results-live-region`, `theme-live-region`, `error-live-region`), skip links, keyboard navigation for donut chart and legend, `aria-pressed` for theme toggle, screen reader announcements on calculation complete, WCAG color contrast (AA), texture patterns for color-blindness support on donut chart.

---

*Architecture analysis: 2026-05-14*

# Quality — Testing, Linting, CI/CD

**Analysis Date:** 2026-05-14

## Test Framework

**Runner:**
- Vitest ^4.1.5
- Config: `vite.config.ts` (Vitest config inline), test section at lines 10-22
- Coverage provider: v8

**Assertion Library:**
- Built-in Vitest `expect` API

**Run Commands:**
```bash
npm test                # vitest run (all tests)
npm run test:watch      # vitest (interactive watch mode)
npm run test:coverage   # vitest run --coverage (80% thresholds)
npx vitest run tests/unit/calculator.test.ts  # single file
```

## Test File Organization

**Location:**
- All tests in `tests/unit/` — separate directory, not co-located

**Naming:**
- Pattern: `*.test.ts` — snake-case filenames

**Structure:**
```
tests/unit/
├── calculator.test.ts      # 472 lines — 10 describe blocks, main test suite
└── legal-boundary.test.ts  # 145 lines — 4 describe blocks, legal scenario tests
```

## Test Structure

**Suite Organization:**
```typescript
describe('Money Value Object', () => {
  it('deve criar Money a partir de reais com precisão centesimal', () => {
    const money = Money.fromReais(3000.5);
    expect(money.cents).toBe(300050);
    expect(money.reais).toBe(3000.5);
  });
});
```

**Patterns:**
- Setup: Constants like `SALARIO_3000 = Money.fromReais(3000)` declared at module level in test file
- Teardown: None needed — tests are stateless
- Assertion: `expect().toBe()` for exact values, `expect().toBeGreaterThan()` for ranges, `expect().not.toBeNull()` for optional results, `expect().toContain()` for fundamento legal strings
- Test descriptions in Portuguese (pt-BR)

## Mocking

**Framework:** None — all tests run real implementations end-to-end

**Patterns:**
No mocking is used. `FGTSCalculatorService.calcularRescisao()` tests call real `CorrecaoMonetariaService`, `MultaService`, `SaqueAniversarioService`, and `DoencaGraveService`.

**What to Mock:**
- Not yet implemented — `CorrecaoMonetariaService` has fallback values when `indicesCorrecao` is undefined (TR_ESTIMADA_MENSAL, IPCA_ESTIMADO_MENSAL) but there are no tests injecting custom index params in integration scenarios

**What NOT to Mock:**
- `Money` VO — precision correctness is critical to test against real Decimal.js
- Domain services — currently untestable in isolation due to static class design

## Fixtures and Factories

**Test Data:**
```typescript
const SALARIO_3000 = Money.fromReais(3000);
const SALARIO_1500 = Money.fromReais(1500);
```

**Location:**
- Inline constants at top of each test file. No dedicated fixture directory or factory functions.

## Coverage

**Requirements:** 80% threshold on lines, branches, functions, statements (configured in `vite.config.ts:14-19`)

**View Coverage:**
```bash
npm run test:coverage        # CLI summary + html report
# Reports: text, json, html (configured in vite.config.ts:21)
```

## Test Types

**Unit Tests:**
- 61 total tests across 2 files
- Tests cover: Money VO arithmetic, monthly deposit calculation, compound interest accumulation, rescission fine percentages (40/20/0), serious illness 100% withdrawal, ADI 5090 IPCA indexation, birthday withdrawal brackets, full termination integration, input validation, proportional severance, contract type rules
- Coverage gaps: No `UIAdapter` tests (DOM-dependent), no `FormatAdapter` tests, no `ThemeAdapter` tests, no `SaqueAniversarioService.calcularImpactoRescisao()` edge cases

**Integration Tests:**
- All tests are effectively integration tests — `FGTSCalculatorService.calcularRescisao()` calls real sub-services
- No dedicated integration test directory

**E2E Tests:**
- Not used — no Playwright or Cypress configured

## Common Patterns

**Async Testing:**
No async patterns needed — all calculations are synchronous.

**Error Testing:**
```typescript
// Validation returns error objects
const result = ContratoTrabalho.validar({ ... });
expect(result.valid).toBe(false);
expect(result.error).toContain('Salário');

// Service returns zero values for invalid inputs
const deposito = FGTSCalculatorService.calcularDepositoMensal(Money.zero());
expect(deposito.cents).toBe(0);
```

## Linting

**Tool:**
- ESLint ^9.0.0 with `@eslint/js` and `typescript-eslint ^8.59.2`

**Configuration:**
- `eslint.config.js` — flat config format (ESLint 9):
  - Extends: `pluginJs.configs.recommended`, `tseslint.configs.recommended`
  - Custom rules: `@typescript-eslint/no-unused-vars: error` (ignoring `_` prefix), `@typescript-eslint/no-explicit-any: warn`

**Commands:**
```bash
npm run lint           # eslint src/**/*.ts
npm run lint:fix       # eslint src/**/*.ts --fix
```

## Formatting

**Tool:**
- Prettier ^3.0.0

**Configuration:**
- `.prettierrc`:
  - `semi: true`
  - `singleQuote: true`
  - `tabWidth: 2`
  - `trailingComma: "all"`
  - `printWidth: 100`

**Commands:**
```bash
npm run format         # prettier --write "src/**/*.{ts,html,css}"
npm run format:check   # prettier --check "src/**/*.{ts,html,css}"
```

## Pre-commit Hooks

**Tool:**
- Husky ^9.0.0 + lint-staged ^15.0.0

**Hook:**
- `.husky/pre-commit`: runs `npx lint-staged`

**lint-staged config (in package.json):**
- `*.ts`: `eslint --fix` then `prettier --write`
- `*.{ts,html,css}`: `prettier --write`

## CI/CD

**Platform:**
- GitHub Actions — `.github/workflows/static.yml`

**Pipeline (push to `main`):**
1. Checkout (actions/checkout@v4)
2. Setup Node.js 24 with npm cache (actions/setup-node@v4)
3. `npm ci`
4. `npm run typecheck` (tsc --noEmit)
5. `npm run test` (continue-on-error: true — tests failing does NOT block deploy)
6. `npm run build`
7. Upload artifact (actions/upload-pages-artifact@v3)
8. Deploy to GitHub Pages (actions/deploy-pages@v5)

**Note:** Tests run with `continue-on-error: true`, meaning failed tests produce warnings but still deploy the build. The pipeline ensures typecheck passes (blocks deploy) but allows test failures through.

## Type Checking

**Command:**
```bash
npm run typecheck    # tsc --noEmit
```

**Configuration:**
- Strict mode enabled
- `noUncheckedIndexedAccess` — array access returns `T | undefined`
- `exactOptionalPropertyTypes` — `prop?: T` means `T | undefined`
- `verbatimModuleSyntax` — must use `import type` for type-only imports
- `noPropertyAccessFromIndexSignature` — bracket notation required for index signatures
- Build script runs `tsc --noEmit` before `vite build` (`package.json:9`)

---

*Quality analysis: 2026-05-14*

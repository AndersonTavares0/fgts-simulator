# Agent Guidelines for Projeto-FGTS

## Setup
- Node.js ≥ 18, npm ≥ 9 required
- Install: `npm install`

## Development Commands
- Start dev server (HMR): `npm run dev` — serves from `src/` (Vite root: `src/index.html`)
- Build for production: `npm run build` (**always runs `tsc --noEmit` first**)
- Preview production build: `npm run preview`
- Run tests: `npm test` (Vitest)
- Run a single test file: `npx vitest run tests/unit/calculator.test.ts`
- Watch tests: `npm run test:watch`
- Type checking only: `npm run typecheck` (`tsc --noEmit`)
- Lint: `npm run lint` (ESLint)
- Lint & fix: `npm run lint:fix`
- Format: `npm run format` (Prettier)
- Check format: `npm run format:check`
- Coverage: `npm run test:coverage` (80% threshold for lines/branches/functions/statements)
- **All CI commands in order**: `npm run typecheck && npm run test && npm run build`

## Architecture
- Domain-Driven Design (DDD) with layers:
  - `src/core/` — domain (entities, services, types)
  - `src/adapters/` – UI/formatting/theme adapters
  - `src/main.ts` – entry point (bootstrapper)
  - `src/index.html` – UI dashboard (Vite root)
- Key services:
  - `FGTSCalculatorService` – orchestrator
  - `CorrecaoMonetariaService` – TR/IPCA + ADI 5090
  - `MultaService` – rescisão multas (0%, 20%, 40%)
  - `SaqueAniversarioService` – 7 faixas oficiais
  - `DoencaGraveService` – 100% saque para doenças graves
- Value Object: `Money` (uses Decimal.js for financial precision)
  - **Critical**: All monetary operations use cents internally to avoid IEEE 754 errors
  - Constructors: `Money.fromCents(12345)` and `Money.fromReais(123.45)` — prefer `fromReais` for human inputs
  - Global Decimal.js config: precision 20, rounding ROUND_HALF_EVEN (Banker's)
  - Immutable operations: `.add()`, `.subtract()`, `.multiply()`, `.divide()`, `.percentage()`, `.isPositive()`, `.toBRL()`
- Entry point (`src/main.ts`): initializes `ThemeAdapter` and `UIAdapter` on DOMContentLoaded

## Testing
- Test suite: Vitest (~58 unit tests) in `tests/unit/`
- Test file pattern: `tests/**/*.test.ts`
- Coverage provider: v8 with 80% threshold on lines/branches/functions/statements
- `calculator.test.js` is a **legacy JS test** that is still included in the suite
- UI-dependent tests require `jsdom` environment (configured in vite.config.ts)

## Code Quality
- ESLint + Prettier configured via `lint-staged` (runs on pre-commit via Husky)
- Pre-commit hook: `npx lint-staged` — runs `eslint --fix` then `prettier --write` on `*.ts`; also prettier on `*.html`, `*.css`
- TypeScript strict mode with extras:
  - `noUncheckedIndexedAccess` — accessing array elements returns `T | undefined`
  - `exactOptionalPropertyTypes` — `prop?: T` means `T | undefined`, not `T | undefined | absent`
  - `verbatimModuleSyntax: true` — must use `import type { ... }` for type-only imports
  - `noPropertyAccessFromIndexSignature` — must use bracket notation for index signatures
- Prettier: `semi: true`, `singleQuote: true`, `trailingComma: "all"`, `printWidth: 100`
- ESLint: extends `typescript-eslint/recommended`; `no-unused-vars` error (ignore `_` prefix); `no-explicit-any` warn

## Important Constraints
- **Only runtime dependency**: `decimal.js` — all other packages are dev dependencies
- **Path alias**: `@/*` maps to `./src/*` (configured in tsconfig)
- **No backend** — pure frontend static app, no server-side logic
- Build output goes to `dist/` (outside Vite root since `outDir: '../dist'`)
- Lucide icons loaded from unpkg at `@0.460.0` (pinned version)
- Google Fonts: `Outfit` (UI) + `DM Mono` (monospace) with `display=swap`

## CI/CD
- GitHub Actions in `.github/workflows/static.yml`
- Builds and deploys to GitHub Pages on push to `main`
- Pipeline: `npm ci` → `npm run typecheck` → `npm run test` (continue-on-error) → `npm run build` → deploy

## Repository State
- If `graphify-out/` exists, a knowledge graph of this codebase has been built
- `graphify-out/graph.json` — raw graph data (211 nodes, 303 edges, 21 communities)
- `graphify-out/graph.html` — interactive knowledge graph (open in browser)
- `graphify-out/GRAPH_REPORT.md` — full audit report with god nodes, surprising connections, and suggested questions

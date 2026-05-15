# Technology Stack

**Analysis Date:** 2026-05-14

## Languages

**Primary:**
- TypeScript ^6.0.3 — All application logic (core domain, adapters, entry point)
  - Strict mode with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`
  - Target: ES2022, Module: ESNext, ModuleResolution: bundler

**Secondary:**
- HTML5 — Single-page application shell at `src/index.html` (Vite root)
- CSS3 — Modular stylesheets with custom properties (theming), glassmorphism design system

## Runtime

**Environment:**
- Node.js ≥ 18 (development), Node.js 24 (CI via GitHub Actions)
- Browser-only runtime — no backend, no server-side logic

**Package Manager:**
- npm ≥ 9
- Lockfile: `package-lock.json` (committed)

## Frameworks

**Core:**
- None — Pure TypeScript, no SPA framework (vanilla DOM manipulation)

**Testing:**
- Vitest ^4.1.5 — Test runner with v8 coverage provider
- jsdom ^24.0.0 — DOM environment for tests

**Build/Dev:**
- Vite ^8.0.11 — Dev server (HMR) and production bundler
  - Root: `src/`, OutDir: `../dist`
  - Base URL: `./` (relative for GitHub Pages)

## Key Dependencies

**Critical (runtime):**
- `decimal.js ^10.4.3` — Arbitrary-precision decimal arithmetic for financial calculations
  - Configured with precision 20 and ROUND_HALF_EVEN (Banker's rounding)
  - Only runtime dependency — all other packages are dev dependencies

**Infrastructure (dev):**
- `eslint ^9.0.0` + `typescript-eslint ^8.59.2` — Static analysis
- `prettier ^3.0.0` — Code formatting with pre-commit hook
- `husky ^9.0.0` — Git hooks (pre-commit runs lint-staged)
- `lint-staged ^15.0.0` — Staged file linting/formatting

## Configuration

**Environment:**
- No runtime environment variables (pure frontend)
- `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` in CI pipeline
- Theme preference persisted in `localStorage` key: `fgts_simulator_theme`

**Build:**
- `tsconfig.json` — Strict TypeScript config with path alias `@/*` → `./src/*`
- `vite.config.ts` — Vite root `src/`, outDir `../dist`, coverage thresholds 80%
- `eslint.config.js` — extends `typescript-eslint/recommended`, no-unused-vars (error), no-explicit-any (warn)
- `.prettierrc` — semi: true, singleQuote: true, trailingComma: "all", printWidth: 100

## Platform Requirements

**Development:**
- Node.js ≥ 18, npm ≥ 9
- Commands: `npm install`, `npm run dev`, `npm run build`, `npm test`

**Production:**
- Static hosting (GitHub Pages via Actions)
- Build output: `dist/` (Vite bundles HTML/CSS/JS)
- No server-side rendering, no backend

---

*Stack analysis: 2026-05-14*

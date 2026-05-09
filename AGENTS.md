# Agent Guidelines for Projeto-FGTS

## Setup
- Node.js ≥ 18, npm ≥ 9 required
- Install: `npm install`

## Development Commands
- Start dev server (HMR): `npm run dev`
- Build for production: `npm run build` (**always runs `tsc --noEmit` first**)
- Preview production build: `npm run preview`
- Run tests: `npm test` (Vitest)
- Watch tests: `npm run test:watch`
- Type checking only: `npm run typecheck` (`tsc --noEmit`)
- Lint: `npm run lint` (ESLint)
- Lint & fix: `npm run lint:fix`
- Format: `npm run format` (Prettier)
- Check format: `npm run format:check`

## Architecture
- Domain-Driven Design (DDD) with layers:
  - `src/core/` – domain (entities, services, types)
  - `src/adapters/` – UI/formatting/theme adapters
  - `src/main.ts` – entry point (bootstrapper)
  - `src/index.html` – UI dashboard
- Key services:
  - `FGTSCalculatorService` – orchestrator
  - `CorrecaoMonetariaService` – TR/IPCA + ADI 5090
  - `MultaService` – rescisão multas (0%, 20%, 40%)
  - `SaqueAniversarioService` – 7 faixas oficiais
  - `DoencaGraveService` – 100% saque para doenças graves
- Value Object: `Money` (uses Decimal.js for financial precision)
  - **Critical**: All monetary operations use cents internally to avoid IEEE 754 errors
  - Global Decimal.js config: precision 20, rounding ROUND_HALF_EVEN (Banker's)

## Testing
- Test suite: Vitest (~43 unit tests) in `tests/unit/`
- Run single test file: `vitest run tests/unit/calculator.test.ts`
- Coverage: `npm run test:coverage` (80% threshold for lines/branches/functions/statements)
- Test file naming: `*.test.ts`

## Code Quality
- ESLint + Prettier configured via `lint-staged`
- Pre-commit hook (Husky) runs lint on staged files
- TypeScript strict mode (see `tsconfig.json`)
- **Important**: `lint-staged` runs `eslint --fix` then `prettier --write` on `.ts` files

## Notes
- Pure frontend static app - no backend, served by Vite
- Dependency: `decimal.js` (for Money VO)
- Build output: `dist/` directory
- HTML entry: `src/index.html`
- TypeScript entry: `src/main.ts`
- **Critical**: Build command runs typecheck before building (`tsc --noEmit && vite build`)
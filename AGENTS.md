# Agent guidelines

## Working conventions

Use Node 24 LTS/npm 11 and scripts in package.json. Production Vite base is /fgts-simulator/. index.html and public/ are at the repository root. Configuration options for Prettier live in package.json. Preserve TypeScript strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes and type-only imports.

## Financial changes

Read docs/legal/assumptions.md before changing calculation, deposit calendars, withdrawal availability or financial labels. Money/Decimal use integer cents internally. Perform financial operations in the domain, not DOM/chart/PDF adapters. A chart is account balance, not the sum of termination payments. The IPCA comparison is not an implementation of the annual ADI5090 compensation or a retroactive judicial credit.

13th and vacation outstanding avos are separate explicit inputs, never total contract duration. Any change to financial rules/calendar/rounding requires calculationVersion and regression cases. Keep domestic 3.2% indemnity separate from standard termination fines. Preserve withdrawal exceptions and retained balance.

## Shared results and privacy

Read docs/architecture.md when changing the application snapshot, persistence or reporting. Screen, chart, history and PDF consume the same validated snapshot; saved records retain their original version and values. Validate database records before use. Health calculation and persistence require separate user choices. Never serialize consent as permission to bypass a new user action.

Read docs/legal/privacy.md before changing storage. Explicit saves only; successful transaction commit precedes confirmation. Quota/blocked upgrades are recoverable; do not reset the database or silently delete records. Pages paths share an origin. Clear only this application's storage.

## Offline and delivery

Read docs/development.md for UI/offline acceptance and docs/releases.md before modifying GitHub governance or publication. PWA updates must not force a reload of pending forms or assume one tab's permission covers others. Keep fonts and required chunks local/precacheable. Rollback restores preserved release bytes, not retagging/rebuilding, and must preserve IndexedDB compatibility.

Use behavior tests at public interfaces. For UI changes verify actual rendered desktop/mobile and reachable error/stale states. Report only checks exercised. docs/archive/ is historical evidence, not current product specification. No backend, accounts or server-side financial processing.

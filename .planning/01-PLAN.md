# Phase 1 Plan: INSS sobre Rescisão

**Goal:** Criar serviço de cálculo INSS sobre verbas rescisórias com tabela progressiva 2026, integrado ao orquestrador e exibido na UI.

**Requirements:** INSS-01, INSS-02, INSS-03, QUAL-04

---

## Wave 1: Service Layer

### Task 1.1 — Add INSS types to `src/core/types.ts`
- Add `interface ResultadoINSS` with fields:
  - `salarioBruto: Money`
  - `aliquotaEfetiva: number` (decimal, ex: 0.075)
  - `valorINSS: Money`
  - `baseCalculo: Money`
  - `salarioLiquido: Money`
  - `faixaDescricao: string` (ex: "2ª faixa (9%)")
  - `fundamentoLegal: string`

### Task 1.2 — Add INSS table and method params
- Add `INSS_2026_TABLE` constant (4 faixas, each with: limiteInferior, limiteSuperior, aliquota, parcelaDeduzir)
- Add optional `calcularINSS?: boolean` to `ParametrosCalculo`
- Add optional `inss?: ResultadoINSS` to `ResultadoRescisao`
- Add optional `inssDetalhe?: { salarioLiquido: Money }` to `ResultadoRescisao.detalhes`

### Task 1.3 — Create `src/core/services/INSSService.ts`
- Static method `calcular(salarioBruto: Money): ResultadoINSS`
- Use **parcela a deduzir** method for cleaner implementation:
  ```
  valorINSS = aliquota × salarioBruto - parcelaDeduzir
  salarioLiquido = salarioBruto - valorINSS
  ```
- Handle edge cases:
  - Salário ≤ 0 → zero
  - Salário > teto → cap at R$ 8.475,55 base
  - Salário mínimo → faixa 1

## Wave 2: Integration

### Task 2.1 — Integrate into `FGTSCalculatorService.calcularRescisao`
- When `params.calcularINSS === true`, call `INSSService.calcular(salarioBruto)`
- Store result in `ResultadoRescisao.inss` and add `salarioLiquido` to detalhes

### Task 2.2 — Update UI to show INSS
- In `UIAdapter.updateBreakdown`: add INSS line showing contribution and net salary
- Info badge/tooltip explaining INSS

## Wave 3: Tests

### Task 3.1 — INSSService unit tests
- Faixa 1: R$ 1.621,00 → R$ 121,58
- Faixa 2: R$ 2.000,00 → R$ 155,69
- Faixa 3: R$ 3.500,00 → R$ 308,60
- Faixa 4: R$ 5.000,00 → R$ 501,51
- Teto: R$ 8.475,55 → R$ 988,08
- Salário ≤ 0 → Money.zero()

### Task 3.2 — FormatAdapter jsdom test
- Test `FormatAdapter.parseMonetaryInput` with valid/invalid BRL strings
- Test `FormatAdapter.parseDate` with valid/invalid dates
- Test `FormatAdapter.getRescisaoLabel` with all `TipoRescisao` values

## Verification

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (existing 61 + new tests)
- [ ] `npm run build` succeeds
- [ ] INSS values match official table examples

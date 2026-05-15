# Phase 1 Context: INSS sobre Rescisão

## Goal

Criar serviço de cálculo INSS sobre verbas rescisórias seguindo tabela progressiva 2026, integrando ao orquestrador existente e exibindo valores retidos/líquidos na UI.

## Architecture Decisions

### New Service
- Criar `src/core/services/INSSService.ts` — serviço puro, sem dependências de UI
- Método principal: `calcular(salarioBruto: Money): ResultadoINSS`
- Seguir padrão dos serviços existentes (static methods, sem DI)

### New Types (in `src/core/types.ts`)
- `interface ResultadoINSS` com: `salarioBruto`, `aliquotaEfetiva`, `valorINSS`, `baseCalculo`, `salarioLiquido`, `faixaDescricao`, `fundamentoLegal`
- Tabela INSS 2026: faixas com limite inferior, superior, aliquota

### INSS 2026 Table (valores mensais)
| Faixa | Salário | Alíquota |
|-------|---------|----------|
| 1 | Até R$ 1.518,00 | 7,5% |
| 2 | R$ 1.518,01 a R$ 2.793,88 | 9% |
| 3 | R$ 2.793,89 a R$ 4.190,83 | 12% |
| 4 | R$ 4.190,84 a R$ 8.157,41 | 14% |

> **Research needed:** Confirmar tabela INSS 2026 oficial (as faixas acima são estimativas baseadas na tabela 2025 corrigida pelo INPC/IPCA). O research agent deve verificar os valores oficiais divulgados pela Previdência Social para 2026.

### Integration
- `FGTSCalculatorService.calcularRescisao` deve aceitar parâmetro opcional `calcularINSS?: boolean`
- INSS incide sobre salário bruto (não sobre o saldo FGTS)
- Resultado INSS adicionado ao `ResultadoRescisao.detalhes`
- Breakdown da UI deve exibir: Salário Bruto → (-) INSS → Salário Líquido

### UI Changes
- `UIAdapter.updateBreakdown` — adicionar linha de INSS no breakdown
- Badge ou indicador visual de "INSS Retido"
- Tooltip informativo: "Contribuição INSS calculada conforme tabela 2026"

### Tests
- `INSSService` com testes unitários para cada faixa
- Testes de limite (teto, salário mínimo, valor exato na borda das faixas)
- `FormatAdapter` teste jsdom (já existe o setup de jsdom no vite.config.ts)
- Garantir que 61 testes existentes continuam passando

## Locked Decisions

- Usar `Money` (Decimal.js) para todos os valores
- Tabela INSS progressiva com dedução (não aliquota bruta sobre total)
- Cálculo mensal (sobre o salário mensal informado)
- Client-side — zero chamadas a API externa

## Open Questions (for research)

1. Quais os valores exatos da tabela INSS 2026? (`teto`, `faixas`)
2. O cálculo de INSS sobre 13º salário deve ser incluído nesta fase ou na fase de verbas?
3. Há mudanças na Reforma da Previdência para 2026 que afetam as alíquotas?

# Plano Unificado de Correcoes Legais e Infraestrutura

> **Documento histórico** — as correções abaixo já foram implementadas no código.
> Mantido para auditoria, rastreabilidade e referência legal.
> Para o estado atual, consultar o código-fonte e `docs/technical_doc.md`.

Este documento consolida a auditoria feita sobre o simulador FGTS, o plano de aplicacao por etapas, a estrategia de branches/commits e o template de Pull Request.

## Diagnostico Validado

| Item | Status Original | Situacao Atual | Evidencia no codigo | Fundamento Legal |
| --- | --- | --- | --- | --- |
| Acordo comum libera 100% do saldo | Bug confirmado | ✅ Corrigido | `PERCENTUAL_SALDO_DISPONIVEL.ACORDO_COMUM = 80` | Art. 484-A, §1º CLT |
| Demissao voluntaria/justa causa liberam saldo | Bug confirmado | ✅ Corrigido | `DEMISSAO_VOLUNTARIA = 0`, `JUSTA_CAUSA = 0` | Art. 20 Lei 8.036/90 |
| Domestico culpa reciproca zera reserva | Bug confirmado | ✅ Corrigido | `CULPA_RECIPROCA → 50% da reserva 3,2%` | Art. 22 LC 150/2015 c/c Art. 484 CLT |
| Doenca grave usa inciso unico | Bug confirmado | ✅ Corrigido | `DOENCAS_QUALIFICADAS` com XI/XIII/XIV por tipo | Lei 8.036/90, Art. 20, XI/XIII/XIV |
| Saque-aniversario bloqueia hipoteses de saque integral | Bug confirmado | ✅ Corrigido | `HIPOTESES_SAQUE_INTEGRAL` inclui DOENCA_GRAVE, APOSENTADORIA, FALECIMENTO | Lei 8.036/90 art. 20-A/20-D |
| ADI 5090 sugere IPCA automatico | Melhoria confirmada | ✅ Implementado | `CorrecaoMonetariaService` compara TR vs IPCA, usa IPCA como piso | ADI 5090 STF |
| `UIAdapter.ts` acesso a erros | Bug confirmado | ✅ Corrigido | Refatorado para `validateContractConstraints()` + `showErrors(errors[])` com `length > 0` | Type safety |
| `navbarThemeToggle` nao funciona | Bug confirmado | ✅ Corrigido | `main.ts` passa ambos os botoes ao `ThemeAdapter.init()` | UX |
| Form pode submeter por GET sem JS | Risco confirmado | ⚠️ Mitigado | `onsubmit="return false;"` presente; edge case aceito para app client-side | Seguranca |
| Google Fonts duplicado | Nao confirmado | ✅ Resolvido | Fontes self-hosted em `src/public/fonts/` | Performance |
| Prazo art. 15 dia 7/vigesimo dia | Nao confirmado | — | Removido do plano | — |

## Branches e Commits Planejados

Cada etapa deve ser aplicada com branch propria e commit atomico. Branch base inicial: `feature/refactor-ui-logic`.

| Etapa | Branch | Commit sugerido | Escopo |
| --- | --- | --- | --- |
| 1 | `docs/legal-correction-plan` | `docs: document legal correction plan` | Este documento e template de PR |
| 2 | `fix/typecheck-errors-array-access` | `fix: handle required field errors safely` | Corrigir `errors[0]` |
| 3 | `fix/acordo-comum-80pct-saldo` | `fix: apply legal withdrawable balance rules` | Acordo 80%, demissao/justa causa 0%, saldo retido |
| 4 | `fix/doenca-grave-incisos-corretos` | `fix: align serious illness legal references` | Incisos XI/XIII/XIV |
| 5 | `fix/domestico-culpa-reciproca-50pct` | `fix: apply reciprocal fault domestic reserve rule` | 50% da reserva 3,2% |
| 6 | `fix/saque-aniversario-hipoteses-saque-integral` | `fix: preserve full withdrawal exceptions with birthday withdrawal` | Excecoes ao saque-aniversario |
| 7 | `fix/adi-5090-estimativa-texto` | `docs: clarify ADI 5090 correction estimate` | Textos e disclaimers |
| 8 | `fix/navbar-theme-toggle` | `fix: wire navbar theme toggle` | Tema mobile/navbar |
| 9 | `fix/form-no-get-leak` | `fix: prevent form fallback GET submission` | Fallback de formulario |
| 10 | `fix/validation-all-errors` | `fix: show all required field validation errors` | Multiplos erros e limpeza de resultado antigo |
| 11 | `test/legal-corrections-coverage` | `test: cover legal correction scenarios` | Cobertura de testes |
| 12 | `fix/all-legal-and-infra` | N/A | Branch de integracao final |

## Regras Legais a Implementar

### Saldo disponivel por modalidade

| Modalidade | Percentual sacavel do saldo | Observacao |
| --- | ---: | --- |
| Dispensa sem justa causa | 100% | Multa 40% separada |
| Acordo comum | 80% | 20% fica retido |
| Culpa reciproca | 100% | Multa 20% separada |
| Demissao voluntaria | 0% | Saldo retido |
| Justa causa | 0% | Saldo retido |
| Aposentadoria | 100% | Hipotese de saque integral |
| Falecimento | 100% | Saque por dependentes/herdeiros |
| Doenca grave | 100% | Hipotese de saque integral |

### Domestico

- FGTS mensal: 8%.
- Reserva indenizatoria mensal: 3,2%.
- Dispensa sem justa causa: 100% da reserva.
- Acordo comum: 50% da reserva.
- Culpa reciproca: 50% da reserva por interpretacao analogica ao Art. 484 CLT.
- Demais modalidades: reserva retorna ao empregador quando aplicavel.

### Doenca grave

- Cancer/neoplasia maligna: Lei 8.036/90, Art. 20, XI.
- HIV/AIDS: Lei 8.036/90, Art. 20, XIII.
- Doenca em estagio terminal: Lei 8.036/90, Art. 20, XIV.

### Saque-aniversario

- Regra geral em rescisao: saldo principal fica retido; multa permanece sacavel.
- Excecoes: aposentadoria, falecimento e doenca grave preservam saque integral do saldo.

### ADI 5090

- O simulador usa TR + 3% a.a. e compara com IPCA como piso estimado.
- O texto deve deixar claro que os valores sao estimativos e nao substituem indices oficiais publicados.

## Verificacao Obrigatoria

Executar antes de considerar a integracao pronta:

```bash
npm run typecheck && npm test -- --run && npm run lint && npm run build
```

Validacoes manuais recomendadas:

1. Acordo comum deve exibir 80% do saldo como sacavel.
2. Demissao voluntaria e justa causa devem exibir saldo sacavel zero e saldo retido.
3. Doenca grave cancer deve mostrar fundamento Art. 20, XI.
4. Domestico + culpa reciproca deve calcular 50% da reserva de 3,2%.
5. Saque-aniversario + aposentadoria/falecimento/doenca grave deve preservar saldo integral.
6. Botao de tema da navbar deve alternar tema.
7. Formulario nao deve enviar dados via GET se o JavaScript falhar.

## Template de Pull Request

```markdown
## FGTS Simulator - Correcoes Legais e Infraestrutura

### Resumo
Correcoes de conformidade legal e melhorias de infraestrutura identificadas por cruzamento do codigo com fontes legais oficiais: Lei 8.036/90, CLT, LC 150/2015 e ADI 5090 STF.

### Mudancas Legais

| # | Correcao | Fundamento Legal | Antes | Depois |
|---|----------|-----------------|-------|--------|
| 1 | Acordo comum: liberar 80% do saldo | Art. 484-A, §1º CLT; Lei 8.036/90 | 100% liberado | 80% liberado, 20% retido |
| 2 | Demissao voluntaria/justa causa: saldo sacavel 0% | Art. 20 Lei 8.036/90 | Saldo exibido como disponivel | Saldo retido |
| 3 | Doenca grave: incisos corretos | Art. 20 XI/XIII/XIV | Tudo como XIII | Inciso conforme tipo |
| 4 | Domestico culpa reciproca: 50% da reserva | Art. 22 LC 150/2015 c/c Art. 484 CLT | 0% | 50% por analogia |
| 5 | Saque-aniversario com hipoteses de saque integral | Lei 8.036/90 art. 20-A/20-D | Saldo zerado sempre | Excecoes preservam saldo |
| 6 | ADI 5090 como estimativa | ADI 5090 STF | Texto sugeria IPCA automatico | Texto esclarece piso estimado |

### Mudancas de Infraestrutura

| # | Correcao | Arquivos |
|---|----------|----------|
| 1 | Acesso seguro a erro de validacao | `UIAdapter.ts` |
| 2 | Navbar theme toggle conectado | `main.ts`, `ThemeAdapter.ts` |
| 3 | Fallback anti-GET no formulario | `index.html` |
| 4 | Validacao exibe multiplos erros | `UIAdapter.ts` |

### Testes
- [ ] `npm run typecheck`
- [ ] `npm test -- --run`
- [ ] `npm run lint`
- [ ] `npm run build`

### Como Testar Manualmente
1. Simular acordo comum e confirmar saldo sacavel de 80%.
2. Simular demissao voluntaria/justa causa e confirmar saldo sacavel zero.
3. Simular doenca grave e conferir fundamentos legais por tipo.
4. Simular domestico + culpa reciproca e conferir 50% da reserva.
5. Simular saque-aniversario + aposentadoria/falecimento/doenca grave e conferir saldo integral.
6. Testar botao de tema da navbar.
7. Confirmar que o formulario nao gera query string por GET.

### Notas
- Culpa reciproca domestica usa interpretacao analogica do Art. 484 CLT aplicada ao regime da LC 150/2015.
- Os indices TR/IPCA sao estimativas conservadoras e nao substituem indices oficiais publicados.
```

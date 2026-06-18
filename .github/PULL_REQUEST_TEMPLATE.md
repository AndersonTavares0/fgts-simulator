---
name: "FGTS Simulator — Pull Request"
about: "Template padronizado para submissão de PRs"
title: "[tipo]: descrição curta"
labels: ""
assignees: ""
---

## FGTS Simulator — Pull Request

### Tipo de Mudança
<!-- Marque com "x" o(s) tipo(s) que se aplicam -->
- [ ] feat — nova funcionalidade
- [ ] fix — correção de bug
- [ ] style — CSS, tema, UI (sem mudança de lógica)
- [ ] docs — documentação
- [ ] perf — performance/privacidade
- [ ] chore — configuração, build, deps
- [ ] refactor — reorganização de código

### Branch
**Base:** `main` ← **Branch:** `<!-- nome da branch aqui -->`

### Commits Inclusos
<!-- Listar os commits com hash + mensagem -->
| Hash | Mensagem |
|------|----------|
| `abc123` | `fix: ...` |
| `def456` | `style: ...` |

### Modificações Técnicas
<!-- Breve descrição do que foi mudado e por quê -->

### Checklist Obrigatório
- [ ] `npm run typecheck` sem erros
- [ ] `npm test -- --run` — todos os testes passaram
- [ ] `npm run lint` sem erros
- [ ] `npm run build` sem warnings

### Checklist de Segurança
- [ ] `npm audit --audit-level=moderate` — 0 vulnerabilidades
- [ ] Nenhum `console.log` de dados sensíveis
- [ ] Nenhum `innerHTML` com input de usuário
- [ ] Nenhuma chave/secret hardcoded
- [ ] Nenhuma chamada de rede não intencional (`fetch`, `XMLHttpRequest`)

### Checklist de Regras Legais
<!-- Se aplicável ao escopo do PR -->
- [ ] Acordo comum libera 80% do saldo (Art. 484-A CLT)
- [ ] Demissão voluntária/justa causa: saldo sacável = R$ 0,00
- [ ] Doença grave usa incisos XI/XIII/XIV conforme tipo
- [ ] Doméstico culpa recíproca: 50% da reserva 3,2%
- [ ] Saque-aniversário preserva saldo em aposentadoria/falecimento/doença grave
- [ ] ADI 5090: índices são estimativas, não substituem oficiais

### Checklist de Privacidade (LGPD)
- [ ] Dados de saúde requerem consentimento explícito (Art. 11)
- [ ] Nenhum dado de simulação vai para `localStorage`
- [ ] Nenhum dado é enviado a servidor externo
- [ ] Processamento 100% client-side

### Testes Manuais Recomendados
1. <!-- Cenário 1 -->
2. <!-- Cenário 2 -->

### Breaking Changes
- [ ] Sim — <!-- especificar -->
- [ ] Não

### Notas Adicionais
<!-- Decisões de design, referências legais, contexto extra -->

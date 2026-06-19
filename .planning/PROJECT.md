# Projeto FGTS — Simulador de Rescisão e FGTS

## What This Is

Simulador educacional 100% client-side de FGTS e verbas rescisórias trabalhistas. Desenvolvido em TypeScript com Domain-Driven Design para o curso de Engenharia de Software (UNINTER). O usuário preenche dados do contrato (salário, datas, motivo da rescisão) e recebe estimativas detalhadas de saldo FGTS, multa rescisória, 13º proporcional, férias, e em breve INSS, IRRF, aviso prévio, horas extras e adicional noturno.

## Core Value

Trabalhadores brasileiros CLT podem calcular estimativas confiáveis de seus direitos trabalhistas de graça, sem sair do navegador, sem enviar dados pessoais a servidores externos.

## Requirements

### Validated

- ✓ **FGTS-01**: Depósito mensal de 8% (CLT), 2% (Aprendiz), 8% (Doméstico) — Lei 8.036/1990
- ✓ **FGTS-02**: Correção monetária TR + 3% a.a. com piso IPCA (ADI 5090)
- ✓ **RESC-01**: Multa rescisória (40% sem justa causa, 20% acordo/culpa recíproca, 0% demais)
- ✓ **RESC-02**: Cálculo de 13º proporcional (Lei 4.090/62)
- ✓ **RESC-03**: Férias proporcionais + 1/3 constitucional
- ✓ **RESC-04**: Saque-Aniversário (7 faixas oficiais Caixa)
- ✓ **RESC-05**: Saque integral por doença grave (câncer, HIV/AIDS, terminal)
- ✓ **RESC-06**: Trabalhador doméstico (LC 150/2015) — FGTS 8% + reserva 3,2%
- ✓ **VALD-01**: Validação de contrato (salário > 0, datas válidas, período ≤ 50 anos)
- ✓ **ACSS-01**: Acessibilidade WCAG 2.1 AA (skip links, ARIA live regions, contraste)
- ✓ **LGPD-01**: Consentimento para dados sensíveis de saúde (Art. 11)
- ✓ **LGPD-02**: Banner de privacidade + modal com política completa
- ✓ **LGPD-03**: Processamento 100% client-side
- ✓ **UI-01**: Tema claro/escuro com persistência (localStorage)
- ✓ **UI-02**: Gráfico donut interativo com texturas WCAG
- ✓ **UI-03**: Design responsivo (sidebar → empilhamento em mobile)
- ✓ **QUAL-01**: 61 testes unitários, cobertura 80%

### Active

- [ ] **INSS-01**: Calcular contribuição INSS sobre verbas rescisórias (tabela 2026, 7,5%-14%)
- [ ] **IRRF-01**: Calcular IRRF retido na fonte sobre verbas rescisórias (tabela 2026, 0%-27,5%)
- [ ] **AVISO-01**: Calcular aviso prévio trabalhado e indenizado (proporcional Lei 12.506/2011)
- [ ] **HORA-01**: Calcular horas extras (50% dias úteis, 100% domingos/feriados)
- [ ] **NOTUR-01**: Calcular adicional noturno (20% entre 22h-5h)
- [ ] **MATER-01**: Calcular salário maternidade (licença 120 dias)
- [ ] **CONV-01**: Estrutura para configurar percentuais por convenção coletiva
- [ ] **REFAC-01**: Refatorar UIAdapter (707 linhas) em adapters por domínio (formulário, resultados, LGPD)
- [ ] **EXPORT-01**: Exportar resultados em PDF (relatório formatado)
- [ ] **EXPORT-02**: Exportar resultados em CSV (planilha analítica)
- [ ] **PWA-01**: Service worker para funcionamento offline
- [ ] **PWA-02**: Cache de assets (Google Fonts, Lucide, CSS, JS)
- [ ] **PWA-03**: Histórico de simulações no IndexedDB
- [ ] **QUAL-02**: Cobertura de testes ≥ 90% (domínio + adapters + integração)
- [ ] **QUAL-03**: Testes de FormatAdapter, ThemeAdapter, UIAdapter com jsdom
- [ ] **SEG-01**: Subresource Integrity (SRI) nos CDNs (Lucide, Google Fonts)

### Out of Scope

- Backend ou API server — projeto é 100% client-side
- Autenticação de usuários — sem login, sem cadastro
- Integração com sistemas governamentais (Conectividade Social, eSocial)
- Cálculo de contribuição sindical (extinta pela Reforma Trabalhista)
- Suporte multilíngue (i18n) — português apenas

## Context

Projeto de Extensão Universitária — UNINTER, curso de Engenharia de Software. O simulador já implementa cálculos de FGTS, multa rescisória, 13º, férias, saque-aniversário e doença grave. A base de código usa TypeScript strict com DDD (core/domain + adapters), Decimal.js para precisão financeira, Vite para build, Vitest para testes. Totalmente client-side.

## Constraints

- **Client-side**: Zero backend. Todo processamento no navegador.
- **Stack fixa**: TypeScript + Vite + Decimal.js. Pode adicionar libs para PDF/CSV se necessário.
- **Acessibilidade**: Manter conformidade WCAG 2.1 AA nas novas features.
- **LGPD**: Dados sensíveis de saúde exigem consentimento explícito.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MVP Vertical | Cada fase entrega feature completa e funcional | ✓ Good |
| Cálculos primeiro | Base trabalhista é o core value do projeto | ✓ Good |
| PWA depois dos cálculos | Cálculos existentes já funcionam offline (client-side) | ✓ Good |
| Separar UIAdapter por domínio | God class de 707 linhas dificulta manutenção | — Pending |
| Estrutura de convenção coletiva | Percentuais genéricos + opção de configurar por categoria | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-14 after initialization*
